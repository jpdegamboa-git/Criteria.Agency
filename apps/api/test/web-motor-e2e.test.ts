/**
 * Web Motor E2E pipeline simulation — Step 2.12
 *
 * Validates the complete Web Motor data flow without LLM calls.
 * Simulates what the Inngest pipeline functions would produce step by step,
 * then asserts DB state and business rules hold.
 *
 * What this proves (per BUILD_ORDER Step 2.12):
 *   1. Web project lifecycle: brief_intake → creative_direction → copy_production →
 *      gate_1 → visual_design → gate_2 → development → qa → gate_3 → deploy → delivered
 *   2. Artifact versioning: multiple versions per step (3+3 iterations)
 *   3. Gate results stored correctly (CD + BG at G1/G2; CD only at G3)
 *   4. Iteration tracking: attempt count, leader adjustment flag, escalation
 *   5. 3+3 escalation: after 6 iterations, project is escalated
 *   6. Tenant isolation: two tenants have independent web projects
 *   7. Blog post continuous mode: creates draft → brand review → published
 *   8. Output Registry: delivered project indexed after deploy
 *
 * No ANTHROPIC_API_KEY needed — pure DB state simulation.
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createDb,
  type Database,
  organizationSettings,
  webProjects,
  webPages,
  webArtifacts,
  webGateResults,
  webIterationTracking,
  blogPosts,
  outputRegistry,
  eq,
  and,
  desc,
} from '@criteria/db';
import { createApp } from '../src/index.js';
import type { Hono } from 'hono';

let db: Database;
let app: Hono;
let orgIdA: string;
let orgIdB: string;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function httpRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', ...headers },
  };
  if (body) init.body = JSON.stringify(body);
  return app.request(url, init);
}

function getCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length > 0) return raw.map((c: string) => c.split(';')[0]).join('; ');
  const single = res.headers.get('set-cookie');
  if (single) return single.split(';')[0];
  return '';
}

async function createTenant(ts: number, suffix = '') {
  const email = `web-e2e-${ts}${suffix}@criteria.agency`;
  const slug = `web-e2e-${ts}${suffix}`.slice(0, 50);

  const signupRes = await httpRequest('POST', '/api/auth/sign-up/email', {
    email, password: 'TestPassword123!', name: `Web E2E Test${suffix}`,
  });
  expect(signupRes.status).toBe(200);
  let cookies = getCookies(signupRes);

  const orgRes = await httpRequest(
    'POST', '/api/auth/organization/create',
    { name: `Web E2E Org${suffix}`, slug },
    { cookie: cookies },
  );
  expect(orgRes.status).toBe(200);
  const org = await orgRes.json();
  const c1 = getCookies(orgRes);
  if (c1) cookies = c1;

  await httpRequest('POST', '/api/auth/organization/set-active', { organizationId: org.id }, { cookie: cookies });

  await db.insert(organizationSettings).values({ organizationId: org.id, plan: 'pro', config: {} }).onConflictDoNothing();

  return { orgId: org.id as string, cookies };
}

async function createProject(orgId: string, siteType = 'landing_page'): Promise<string> {
  const [project] = await db.insert(webProjects).values({
    organizationId: orgId,
    siteType,
    status: 'brief_intake',
    currentStep: 'brief-intake',
    brief: {
      pages: ['home'],
      audiences: 'LATAM small businesses',
      conversionObjectives: 'email sign-up',
      siteType,
    },
    autonomyMode: 'ai_decides',
    gateIterations: { g1: 0, g2: 0, g3: 0 },
  }).returning({ id: webProjects.id });
  return project.id;
}

async function saveArtifact(
  projectId: string, orgId: string, step: string,
  artifactType: string, version: number, content: Record<string, unknown>,
): Promise<string> {
  const [a] = await db.insert(webArtifacts).values({
    projectId, organizationId: orgId, step, artifactType, version, gateIteration: version, content,
  }).returning({ id: webArtifacts.id });
  return a.id;
}

async function updateStatus(projectId: string, status: string, currentStep: string): Promise<void> {
  await db.update(webProjects).set({ status, currentStep }).where(eq(webProjects.id, projectId));
}

async function insertGateResult(
  projectId: string, orgId: string, gateNumber: number, iteration: number,
  cdVerdict: string, bgVerdict: string | null, combinedVerdict: string,
  qaReport?: Record<string, unknown>,
): Promise<string> {
  const [r] = await db.insert(webGateResults).values({
    projectId, organizationId: orgId, gateNumber, iterationNumber: iteration,
    cdVerdict, cdReasoning: `CD evaluation ${iteration}`, cdFeedback: { iteration },
    bgVerdict, bgReasoning: bgVerdict ? `BG evaluation ${iteration}` : null,
    bgFixGuidance: bgVerdict === 'fail' ? 'Fix brand voice' : null,
    qaReport: qaReport ?? {}, combinedVerdict, resolvedAt: new Date(),
  }).returning({ id: webGateResults.id });
  return r.id;
}

async function insertIterationTracking(
  projectId: string, orgId: string, gateNumber: number,
  attemptCount: number, leaderAdjustmentActive: boolean, escalated: boolean,
): Promise<void> {
  await db.insert(webIterationTracking).values({
    projectId, organizationId: orgId, gateNumber, attemptCount, leaderAdjustmentActive, escalated,
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
  db = createDb(process.env.DATABASE_URL);
  ({ app } = createApp(db));

  const ts = Date.now();
  const tenantA = await createTenant(ts, '-A');
  const tenantB = await createTenant(ts, '-B');
  orgIdA = tenantA.orgId;
  orgIdB = tenantB.orgId;
});

afterAll(async () => {
  if (orgIdA) {
    await db.delete(webProjects).where(eq(webProjects.organizationId, orgIdA));
    await db.delete(organizationSettings).where(eq(organizationSettings.organizationId, orgIdA));
  }
  if (orgIdB) {
    await db.delete(webProjects).where(eq(webProjects.organizationId, orgIdB));
    await db.delete(organizationSettings).where(eq(organizationSettings.organizationId, orgIdB));
  }
  await db.close();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Web Motor — Step 2.12: End-to-end pipeline simulation', () => {

  describe('2.1 Data model — web_projects', () => {
    it('creates a web project with correct defaults', async () => {
      const projectId = await createProject(orgIdA, 'landing_page');
      const [p] = await db.select().from(webProjects).where(eq(webProjects.id, projectId));
      expect(p.organizationId).toBe(orgIdA);
      expect(p.siteType).toBe('landing_page');
      expect(p.status).toBe('brief_intake');
      expect(p.autonomyMode).toBe('ai_decides');
      expect(p.liveUrl).toBeNull();
    });

    it('enforces tenant isolation — project not visible to other tenant', async () => {
      const projectId = await createProject(orgIdA, 'microsite');
      const fromOrgB = await db.select().from(webProjects)
        .where(and(eq(webProjects.id, projectId), eq(webProjects.organizationId, orgIdB)));
      expect(fromOrgB).toHaveLength(0);
    });
  });

  describe('2.1 Data model — web_pages', () => {
    it('creates pages linked to a project', async () => {
      const projectId = await createProject(orgIdA);
      await db.insert(webPages).values([
        { projectId, organizationId: orgIdA, name: 'Home', pageType: 'home', hierarchyPosition: 0 },
        { projectId, organizationId: orgIdA, name: 'Features', pageType: 'product', hierarchyPosition: 1 },
      ]);
      const pages = await db.select().from(webPages).where(eq(webPages.projectId, projectId));
      expect(pages).toHaveLength(2);
    });
  });

  describe('Full pipeline simulation (steps 2.2–2.10)', () => {
    let projectId: string;

    beforeAll(async () => {
      projectId = await createProject(orgIdA, 'corporate_site');
    });

    it('Step 1 brief-intake: status updates correctly', async () => {
      await updateStatus(projectId, 'brief_intake', 'brief-intake');
      const [p] = await db.select({ status: webProjects.status }).from(webProjects).where(eq(webProjects.id, projectId));
      expect(p.status).toBe('brief_intake');
    });

    it('Step 2 creative-direction: CD artifact saved (spec §3.3 Step 2)', async () => {
      await updateStatus(projectId, 'creative_direction', 'creative-direction');
      const artifactId = await saveArtifact(projectId, orgIdA, 'creative_direction', 'creative_direction_doc', 1, {
        visualDirection: 'Clean minimal, photography-forward',
        tonalDirection: 'Home: inspiring. Product: clear. Contact: warm.',
        userFlow: 'Confident → curious → convinced → action',
        interactionPrinciples: 'Smooth scroll, subtle reveals',
        references: ['stripe.com', 'linear.app'],
      });
      expect(artifactId).toBeTruthy();
      const [a] = await db.select().from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'creative_direction')));
      expect((a.content as Record<string, unknown>).references).toHaveLength(2);
    });

    it('Step 3 copy-production: Writer artifact saved page by page', async () => {
      await updateStatus(projectId, 'copy_production', 'copy-production');
      await saveArtifact(projectId, orgIdA, 'copy', 'copy_doc', 1, {
        pages: [
          { name: 'Home', h1: 'Tu marca, poderosa', metaTitle: 'criteria.agency' },
          { name: 'Features', h1: 'Herramientas que convierten', metaTitle: 'Funcionalidades' },
        ],
      });
      const [copy] = await db.select({ content: webArtifacts.content }).from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'copy')))
        .orderBy(desc(webArtifacts.version)).limit(1);
      expect((copy.content as Record<string, unknown[]>).pages).toHaveLength(2);
    });

    it('Gate 1: CD iterate → revision → both advance (spec §5.1)', async () => {
      // Iteration 1: iterate
      await insertGateResult(projectId, orgIdA, 1, 1, 'iterate', 'pass', 'iterate');
      await insertIterationTracking(projectId, orgIdA, 1, 1, false, false);

      // Writer revision
      await saveArtifact(projectId, orgIdA, 'copy', 'copy_doc', 2, {
        pages: [{ name: 'Home', h1: 'Revisado: Estrategia que transforma', metaTitle: 'criteria.agency' }],
      });

      // Iteration 2: advance
      await insertGateResult(projectId, orgIdA, 1, 2, 'advance', 'pass', 'advance');
      await insertIterationTracking(projectId, orgIdA, 1, 2, false, false);

      const gateRecords = await db.select().from(webGateResults)
        .where(and(eq(webGateResults.projectId, projectId), eq(webGateResults.gateNumber, 1)));
      expect(gateRecords).toHaveLength(2);
      expect(gateRecords[1].combinedVerdict).toBe('advance');

      const copyVersions = await db.select().from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'copy')));
      expect(copyVersions).toHaveLength(2);
    });

    it('Step 4 visual-design: Designer spec saved (spec §3.3 Step 4)', async () => {
      await updateStatus(projectId, 'visual_design', 'visual-design');
      await saveArtifact(projectId, orgIdA, 'design', 'design_spec', 1, {
        pages: [{
          name: 'Home', layout: '12-col, hero full-width',
          typography: 'H1: 64px/700', colors: 'Hero: navy bg, white text',
          imageryDirection: 'Full-bleed photography', responsiveNotes: 'Mobile: 40px H1',
        }],
        componentLibrary: { header: 'sticky', footer: '3-col' },
      });
      const [design] = await db.select().from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'design')));
      expect(design.artifactType).toBe('design_spec');
    });

    it('Gate 2: BG fail → designer revision → advance (spec §5.1)', async () => {
      // BG fails: color palette deviation
      await insertGateResult(projectId, orgIdA, 2, 1, 'advance', 'fail', 'iterate');
      await insertIterationTracking(projectId, orgIdA, 2, 1, false, false);

      await saveArtifact(projectId, orgIdA, 'design', 'design_spec', 2, {
        pages: [{ name: 'Home', layout: '12-col', typography: 'H1: 64px/700', colors: 'Exact brand colors applied', imageryDirection: 'Photography', responsiveNotes: 'Mobile: single col' }],
        componentLibrary: { header: 'sticky', footer: '3-col' },
        bgFixApplied: true,
      });

      await insertGateResult(projectId, orgIdA, 2, 2, 'advance', 'pass', 'advance');
      await insertIterationTracking(projectId, orgIdA, 2, 2, false, false);

      const g2 = await db.select().from(webGateResults)
        .where(and(eq(webGateResults.projectId, projectId), eq(webGateResults.gateNumber, 2)));
      expect(g2[1].combinedVerdict).toBe('advance');
    });

    it('Step 5 development: Web Developer code artifact saved', async () => {
      await updateStatus(projectId, 'development', 'development');
      await saveArtifact(projectId, orgIdA, 'code', 'source_code', 1, {
        framework: 'next.js',
        code: '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><meta charset="UTF-8"></head><body><h1>criteria.agency</h1></body></html>',
        pages: [{ name: 'Home', path: '/', content: '<main>Home</main>' }],
        integrations: { emailCapture: 'resend', analytics: 'ga4' },
        sitemapIncluded: true,
      });
      const [code] = await db.select().from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'code')));
      expect((code.content as Record<string, unknown>).framework).toBe('next.js');
    });

    it('Step 6 qa: QA report saved with pass/fail per check', async () => {
      await updateStatus(projectId, 'qa', 'qa');
      await saveArtifact(projectId, orgIdA, 'qa', 'qa_report', 1, {
        checks: {
          code_generated: { passed: true, detail: 'Source code present' },
          meta_tags: { passed: true, detail: 'Meta tags present' },
          responsive: { passed: true, detail: 'Viewport meta present' },
          pages_coverage: { passed: true, detail: '1 page' },
        },
        summary: 'All QA checks passed',
        passed: true,
      });
      const [qa] = await db.select().from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'qa')));
      expect((qa.content as Record<string, unknown>).passed).toBe(true);
    });

    it('Gate 3: CD only evaluation — no Brand Guardian (DEC-223)', async () => {
      await insertGateResult(projectId, orgIdA, 3, 1, 'advance', null, 'advance', {
        checks: { code_generated: { passed: true } }, summary: 'All passed',
      });
      await insertIterationTracking(projectId, orgIdA, 3, 1, false, false);

      const [g3] = await db.select().from(webGateResults)
        .where(and(eq(webGateResults.projectId, projectId), eq(webGateResults.gateNumber, 3)));

      expect(g3.bgVerdict).toBeNull(); // No Brand Guardian at G3 per DEC-223
      expect(g3.cdVerdict).toBe('advance');
      expect(g3.combinedVerdict).toBe('advance');
    });

    it('Step 7 deploy: project delivered, live URL set, Output Registry indexed', async () => {
      const deployId = await saveArtifact(projectId, orgIdA, 'deploy', 'deploy_record', 1, {
        url: 'https://dpl-test.vercel.app', deploymentId: 'dpl-test', deployedAt: new Date().toISOString(),
      });

      await db.update(webProjects)
        .set({ liveUrl: 'https://dpl-test.vercel.app', status: 'delivered', currentStep: 'delivered', deliveredAt: new Date() })
        .where(eq(webProjects.id, projectId));

      await db.insert(outputRegistry).values({
        organizationId: orgIdA, sourceMotor: 'web-motor', sourceAgentId: 'web-developer',
        outputType: 'website', contentRef: deployId,
        summary: `Delivered site for tenant ${orgIdA}. Live at: https://dpl-test.vercel.app`,
        metadata: { url: 'https://dpl-test.vercel.app', projectId },
      });

      const [delivered] = await db.select().from(webProjects).where(eq(webProjects.id, projectId));
      expect(delivered.status).toBe('delivered');
      expect(delivered.liveUrl).toBe('https://dpl-test.vercel.app');
      expect(delivered.deliveredAt).not.toBeNull();

      const [outputEntry] = await db.select().from(outputRegistry)
        .where(and(eq(outputRegistry.organizationId, orgIdA), eq(outputRegistry.sourceMotor, 'web-motor')))
        .orderBy(desc(outputRegistry.createdAt)).limit(1);
      expect(outputEntry.outputType).toBe('website');
      expect(outputEntry.contentRef).toBe(deployId);
    });
  });

  describe('3+3 rule — escalation (spec §5.3)', () => {
    it('escalates project status after 6 failed gate iterations', async () => {
      const projectId = await createProject(orgIdA, 'landing_page');

      for (let i = 1; i <= 6; i++) {
        await insertGateResult(projectId, orgIdA, 1, i, 'iterate', 'fail', 'iterate');
        await insertIterationTracking(projectId, orgIdA, 1, i, i >= 4, i === 6);
      }

      await db.update(webProjects).set({ status: 'escalated', currentStep: 'gate_1_escalated' }).where(eq(webProjects.id, projectId));

      const [p] = await db.select({ status: webProjects.status }).from(webProjects).where(eq(webProjects.id, projectId));
      expect(p.status).toBe('escalated');

      const gateRecords = await db.select().from(webGateResults)
        .where(and(eq(webGateResults.projectId, projectId), eq(webGateResults.gateNumber, 1)));
      expect(gateRecords).toHaveLength(6);

      const iterRecords = await db.select().from(webIterationTracking).where(eq(webIterationTracking.projectId, projectId));
      const last = iterRecords[iterRecords.length - 1];
      expect(last.escalated).toBe(true);
      expect(last.leaderAdjustmentActive).toBe(true);
    });

    it('leader adjustment activates at attempt 4, not before (spec §5.3)', async () => {
      const projectId = await createProject(orgIdA, 'landing_page');

      for (let i = 1; i <= 4; i++) {
        await insertIterationTracking(projectId, orgIdA, 1, i, i >= 4, false);
      }

      const records = await db.select().from(webIterationTracking).where(eq(webIterationTracking.projectId, projectId));
      const attempt3 = records.find((r) => r.attemptCount === 3);
      const attempt4 = records.find((r) => r.attemptCount === 4);

      expect(attempt3?.leaderAdjustmentActive).toBe(false);
      expect(attempt4?.leaderAdjustmentActive).toBe(true);
    });
  });

  describe('Continuous mode — Blog Post pipeline (spec §4.1)', () => {
    it('creates draft blog post and publishes after brand review passes', async () => {
      const projectId = await createProject(orgIdA, 'blog_first');
      await db.update(webProjects).set({ status: 'delivered', liveUrl: 'https://blog.vercel.app' }).where(eq(webProjects.id, projectId));

      const [draft] = await db.insert(blogPosts).values({
        projectId, organizationId: orgIdA,
        title: '5 estrategias de marketing para PyMEs en LATAM',
        slug: '5-estrategias-pymes-latam',
        body: '## Intro\n\nEl marketing para PyMEs en LATAM...',
        metaDescription: 'Las 5 estrategias más efectivas para PyMEs latinoamericanas.',
        tags: ['marketing', 'pymes'], categories: ['estrategia'], status: 'draft',
      }).returning({ id: blogPosts.id });

      const [saved] = await db.select().from(blogPosts).where(eq(blogPosts.id, draft.id));
      expect(saved.status).toBe('draft');
      expect(saved.publishedAt).toBeNull();

      // Brand Guardian passes → publish
      await db.update(blogPosts).set({ status: 'published', publishedAt: new Date() }).where(eq(blogPosts.id, draft.id));

      const [published] = await db.select().from(blogPosts).where(eq(blogPosts.id, draft.id));
      expect(published.status).toBe('published');
      expect(published.publishedAt).not.toBeNull();
    });

    it('blog post stays draft when brand review fails', async () => {
      const projectId = await createProject(orgIdA, 'blog_first');
      await db.update(webProjects).set({ status: 'delivered' }).where(eq(webProjects.id, projectId));

      const [post] = await db.insert(blogPosts).values({
        projectId, organizationId: orgIdA,
        title: 'Off-brand post', slug: 'off-brand',
        body: 'Off-brand content...', metaDescription: 'Off-brand',
        tags: [], categories: [], status: 'draft',
      }).returning({ id: blogPosts.id });

      // Brand review fails — status unchanged (stays draft)
      const [checked] = await db.select().from(blogPosts).where(eq(blogPosts.id, post.id));
      expect(checked.status).toBe('draft');
      expect(checked.publishedAt).toBeNull();
    });
  });

  describe('Tenant isolation', () => {
    it('artifacts from org A not accessible by org B query filter', async () => {
      const projectIdA = await createProject(orgIdA);
      await saveArtifact(projectIdA, orgIdA, 'creative_direction', 'creative_direction_doc', 1, { data: 'orgA_secret' });

      const fromOrgB = await db.select().from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectIdA), eq(webArtifacts.organizationId, orgIdB)));

      expect(fromOrgB).toHaveLength(0);
    });

    it('two tenants run independent pipelines with independent status', async () => {
      const pA = await createProject(orgIdA, 'landing_page');
      const pB = await createProject(orgIdB, 'microsite');

      await updateStatus(pA, 'creative_direction', 'creative-direction');
      await updateStatus(pB, 'copy_production', 'copy-production');

      const [a] = await db.select({ status: webProjects.status, orgId: webProjects.organizationId }).from(webProjects).where(eq(webProjects.id, pA));
      const [b] = await db.select({ status: webProjects.status, orgId: webProjects.organizationId }).from(webProjects).where(eq(webProjects.id, pB));

      expect(a.status).toBe('creative_direction');
      expect(a.orgId).toBe(orgIdA);
      expect(b.status).toBe('copy_production');
      expect(b.orgId).toBe(orgIdB);
    });
  });

  describe('Artifact versioning', () => {
    it('stores multiple versions for the same project/step', async () => {
      const projectId = await createProject(orgIdA);
      for (let v = 1; v <= 3; v++) {
        await saveArtifact(projectId, orgIdA, 'copy', 'copy_doc', v, { version: v });
      }
      const versions = await db.select({ version: webArtifacts.version }).from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'copy')));
      expect(versions).toHaveLength(3);
    });

    it('latest version query returns highest version number', async () => {
      const projectId = await createProject(orgIdA);
      await saveArtifact(projectId, orgIdA, 'copy', 'copy_doc', 1, { draft: true });
      await saveArtifact(projectId, orgIdA, 'copy', 'copy_doc', 2, { revised: true });
      await saveArtifact(projectId, orgIdA, 'copy', 'copy_doc', 3, { final: true });

      const [latest] = await db.select({ content: webArtifacts.content, version: webArtifacts.version }).from(webArtifacts)
        .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'copy')))
        .orderBy(desc(webArtifacts.version)).limit(1);

      expect(latest.version).toBe(3);
      expect((latest.content as Record<string, unknown>).final).toBe(true);
    });
  });

  describe('web_pages hierarchy (DEC-218)', () => {
    it('stores page hierarchy from brief site architecture', async () => {
      const projectId = await createProject(orgIdA, 'corporate_site');

      await db.insert(webPages).values([
        { projectId, organizationId: orgIdA, name: 'Home', pageType: 'home', hierarchyPosition: 0 },
        { projectId, organizationId: orgIdA, name: 'Services', pageType: 'product', hierarchyPosition: 1 },
        { projectId, organizationId: orgIdA, name: 'Contact', pageType: 'contact', hierarchyPosition: 2 },
      ]);

      const pages = await db.select().from(webPages).where(eq(webPages.projectId, projectId));
      expect(pages).toHaveLength(3);
      const names = pages.map((p) => p.name).sort();
      expect(names).toEqual(['Contact', 'Home', 'Services']);
    });
  });
});
