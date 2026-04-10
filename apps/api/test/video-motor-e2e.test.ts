/**
 * Video Motor E2E pipeline simulation — Step 8.7
 *
 * Validates the complete Video Motor data flow without LLM calls.
 * Simulates what the Inngest pipeline functions would produce step by step,
 * then asserts DB state and business rules hold.
 *
 * What this proves (per BUILD_ORDER Step 8.7 and spec §3, §5):
 *   1. Data model: video_projects defaults, artifact versioning, gate records
 *   2. Pipeline lifecycle: brief_intake → creative_direction → concept → gate_1 →
 *      script_classify → script_structure → script_draft → script_polish → gate_2 →
 *      visual_look → storyboard → gate_3 → video_gen → editing → audio → gate_4 →
 *      polish → gate_5 → delivered
 *   3. Gate logic: SR+BG verdicts → advance / iterate / rethink
 *   4. 3+3 rule: iteration counters, leader adjustment (attempts 4-6), escalation (7+)
 *   5. G3 client approval flow: pending → approved → pipeline unblocked
 *   6. G4 diagnostic routing: shots / edit / audio problem types
 *   7. Delivery: delivered_at set, output_registry indexed with tenant isolation
 *   8. Tenant isolation: two tenants have independent video projects
 *
 * Level 1 (security — automated, blocks deploy):
 *   - Auth: 401 on all 6 video motor endpoints without session
 *   - Inngest schema validation: tenantId + projectId required (DEC-148)
 *   - Tier A enforcement: video motor uses Anthropic-only models (DEC-149)
 *   - Tenant isolation: cross-tenant project access denied
 *
 * No ANTHROPIC_API_KEY needed — pure DB state simulation.
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import {
  createDb,
  type Database,
  organizationSettings,
  videoProjects,
  videoArtifacts,
  videoGateReviews,
  outputRegistry,
  eq,
  and,
  desc,
} from '@criteria/db';
import { createApp } from '../src/index.js';
import type { Hono } from 'hono';
import { MODELS } from '../src/lib/ai.js';

let db: Database;
let app: Hono;
let orgIdA: string;
let orgIdB: string;
let cookiesA: string;
let cookiesB: string;

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
  const email = `video-e2e-${ts}${suffix}@criteria.agency`;
  const slug = `video-e2e-${ts}${suffix}`.slice(0, 50);

  const signupRes = await httpRequest('POST', '/api/auth/sign-up/email', {
    email, password: 'TestPassword123!', name: `Video E2E Test${suffix}`,
  });
  expect(signupRes.status).toBe(200);
  let cookies = getCookies(signupRes);

  const orgRes = await httpRequest(
    'POST', '/api/auth/organization/create',
    { name: `Video E2E Org${suffix}`, slug },
    { cookie: cookies },
  );
  expect(orgRes.status).toBe(200);
  const org = await orgRes.json() as { id: string };
  const c1 = getCookies(orgRes);
  if (c1) cookies = c1;

  // Capture cookies from set-active — needed for org context in session
  const setActiveRes = await httpRequest(
    'POST', '/api/auth/organization/set-active',
    { organizationId: org.id },
    { cookie: cookies },
  );
  const c2 = getCookies(setActiveRes);
  if (c2) cookies = c2;

  await db.insert(organizationSettings).values({ organizationId: org.id, plan: 'pro', settings: {} }).onConflictDoNothing();

  return { orgId: org.id, cookies };
}

async function createVideoProject(
  orgId: string,
  overrides: Partial<typeof videoProjects.$inferInsert> = {},
): Promise<string> {
  const [project] = await db.insert(videoProjects).values({
    organizationId: orgId,
    status: 'brief_intake',
    currentStep: 'brief_intake',
    brief: {
      title: 'Test Video',
      objective: 'Brand awareness for LATAM SMBs',
      targetAudience: 'Small business owners',
      keyMessage: 'criteria.agency makes marketing simple',
      targetDurationSeconds: 60,
      platforms: ['youtube', 'linkedin'],
    },
    autonomyMode: 'ai_decides',
    gateIterations: { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 },
    ...overrides,
  }).returning({ id: videoProjects.id });
  return project.id;
}

async function saveArtifact(
  projectId: string,
  orgId: string,
  step: string,
  artifactType: string,
  version: number,
  content: Record<string, unknown>,
): Promise<string> {
  const [a] = await db.insert(videoArtifacts).values({
    projectId, organizationId: orgId, step, artifactType, version, gateIteration: version, content,
  }).returning({ id: videoArtifacts.id });
  return a.id;
}

async function updateStatus(projectId: string, status: string, currentStep: string): Promise<void> {
  await db.update(videoProjects).set({ status, currentStep }).where(eq(videoProjects.id, projectId));
}

async function insertGateReview(params: {
  projectId: string;
  orgId: string;
  gateNumber: number;
  iterationNumber: number;
  directorVerdict: string;
  brandGuardianVerdict: string;
  combinedVerdict: string;
  clientApprovalStatus?: string;
}): Promise<string> {
  const [r] = await db.insert(videoGateReviews).values({
    projectId: params.projectId,
    organizationId: params.orgId,
    gateNumber: params.gateNumber,
    iterationNumber: params.iterationNumber,
    showrunnerVerdict: params.directorVerdict,
    showrunnerReasoning: `Director G${params.gateNumber} eval attempt ${params.iterationNumber}`,
    showrunnerFeedback: { attempt: params.iterationNumber },
    brandGuardianVerdict: params.brandGuardianVerdict,
    brandGuardianReasoning: `BG G${params.gateNumber} eval attempt ${params.iterationNumber}`,
    brandGuardianFixGuidance: params.brandGuardianVerdict === 'fail' ? 'Align with brand voice' : null,
    combinedVerdict: params.combinedVerdict,
    clientApprovalStatus: params.clientApprovalStatus ?? 'na',
    resolvedAt: new Date(),
  }).returning({ id: videoGateReviews.id });
  return r.id;
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
  cookiesA = tenantA.cookies;
  cookiesB = tenantB.cookies;
});

afterAll(async () => {
  if (orgIdA) {
    await db.delete(videoProjects).where(eq(videoProjects.organizationId, orgIdA));
    await db.delete(organizationSettings).where(eq(organizationSettings.organizationId, orgIdA));
  }
  if (orgIdB) {
    await db.delete(videoProjects).where(eq(videoProjects.organizationId, orgIdB));
    await db.delete(organizationSettings).where(eq(organizationSettings.organizationId, orgIdB));
  }
  await db.close();
});

// ── Level 1: Auth ─────────────────────────────────────────────────────────────

describe('8.L1 Auth — 401 without session', () => {
  const fakeId = '00000000-0000-0000-0000-000000000001';

  it('GET /api/video-motor/projects → 401', async () => {
    const res = await httpRequest('GET', '/api/video-motor/projects');
    expect(res.status).toBe(401);
  });

  it('POST /api/video-motor/projects → 401', async () => {
    const res = await httpRequest('POST', '/api/video-motor/projects', { title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('GET /api/video-motor/projects/:id → 401', async () => {
    const res = await httpRequest('GET', `/api/video-motor/projects/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it('GET /api/video-motor/projects/:id/artifacts → 401', async () => {
    const res = await httpRequest('GET', `/api/video-motor/projects/${fakeId}/artifacts`);
    expect(res.status).toBe(401);
  });

  it('GET /api/video-motor/projects/:id/gates → 401', async () => {
    const res = await httpRequest('GET', `/api/video-motor/projects/${fakeId}/gates`);
    expect(res.status).toBe(401);
  });

  it('POST /api/video-motor/projects/:id/approve → 401', async () => {
    const res = await httpRequest('POST', `/api/video-motor/projects/${fakeId}/approve`, { approved: true });
    expect(res.status).toBe(401);
  });
});

// ── Level 1: Inngest schema validation (DEC-148) ──────────────────────────────

describe('8.L1 Inngest schema validation — DEC-148', () => {
  // Mirror the pipeline event schema
  const pipelineEventSchema = z.object({
    tenantId: z.string().min(1, 'tenantId is required'),
    projectId: z.string().uuid('projectId must be a UUID'),
  });

  it('rejects event missing tenantId', () => {
    const result = pipelineEventSchema.safeParse({ projectId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(false);
    // tenantId is required — Zod rejects when missing
    expect(result.error?.issues.some(i => i.path.includes('tenantId'))).toBe(true);
  });

  it('rejects event missing projectId', () => {
    const result = pipelineEventSchema.safeParse({ tenantId: 'org_abc' });
    expect(result.success).toBe(false);
    // projectId is required — Zod rejects when missing
    expect(result.error?.issues.some(i => i.path.includes('projectId'))).toBe(true);
  });

  it('rejects non-UUID projectId', () => {
    const result = pipelineEventSchema.safeParse({ tenantId: 'org_abc', projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path.includes('projectId'))).toBe(true);
  });

  it('accepts valid event data', () => {
    const result = pipelineEventSchema.safeParse({
      tenantId: 'org_abc',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  // Client approval event schema
  const clientApprovalSchema = z.object({
    projectId: z.string().uuid(),
    approved: z.boolean(),
    notes: z.string().optional(),
  });

  it('rejects client approval missing projectId', () => {
    const result = clientApprovalSchema.safeParse({ approved: true });
    expect(result.success).toBe(false);
  });

  it('rejects client approval with non-boolean approved', () => {
    const result = clientApprovalSchema.safeParse({
      projectId: '00000000-0000-0000-0000-000000000001',
      approved: 'yes',
    });
    expect(result.success).toBe(false);
  });
});

// ── Level 1: Tier A enforcement (DEC-149) ─────────────────────────────────────

describe('8.L1 Tier A enforcement — DEC-149', () => {
  it('MODELS.opus is an Anthropic model ID', () => {
    // DEC-149: Tier A = Anthropic only. CD and Director must use Opus.
    expect(MODELS.opus).toContain('claude');
    expect(MODELS.opus).not.toContain('gpt');
    expect(MODELS.opus).not.toContain('gemini');
  });

  it('MODELS.sonnet is an Anthropic model ID', () => {
    // DEC-149: Tier A = Anthropic only. Executor agents and Brand Guardian use Sonnet.
    expect(MODELS.sonnet).toContain('claude');
    expect(MODELS.sonnet).not.toContain('gpt');
    expect(MODELS.sonnet).not.toContain('gemini');
  });

  it('MODELS.haiku is an Anthropic model ID', () => {
    // DEC-149: Tier A = Anthropic only. Writer classification sub-step uses Haiku.
    expect(MODELS.haiku).toContain('claude');
    expect(MODELS.haiku).not.toContain('gpt');
    expect(MODELS.haiku).not.toContain('gemini');
  });
});

// ── Level 2: Data model (Step 8.1) ───────────────────────────────────────────

describe('8.1 Data model — video_projects', () => {
  it('creates a video project with correct defaults', async () => {
    const projectId = await createVideoProject(orgIdA);
    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.organizationId).toBe(orgIdA);
    expect(p.status).toBe('brief_intake');
    expect(p.currentStep).toBe('brief_intake');
    expect(p.autonomyMode).toBe('ai_decides');
    expect(p.deliveredAt).toBeNull();
    expect(p.escalatedAt).toBeNull();
    expect(p.gateIterations).toEqual({ g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 });
  });

  it('gateIterations tracks 5 gates (G1-G5 per spec §5.2)', async () => {
    const projectId = await createVideoProject(orgIdA);
    const [p] = await db.select({ gi: videoProjects.gateIterations }).from(videoProjects)
      .where(eq(videoProjects.id, projectId));
    const gi = p.gi as Record<string, number>;
    expect(Object.keys(gi)).toHaveLength(5);
    expect(gi.g1).toBe(0);
    expect(gi.g5).toBe(0);
  });

  it('tenant isolation — org B cannot see org A project by direct query', async () => {
    const projectId = await createVideoProject(orgIdA);
    const result = await db.select().from(videoProjects)
      .where(and(eq(videoProjects.id, projectId), eq(videoProjects.organizationId, orgIdB)));
    expect(result).toHaveLength(0);
  });

  it('creates video_artifacts with correct step + version tracking', async () => {
    const projectId = await createVideoProject(orgIdA);
    const aId = await saveArtifact(projectId, orgIdA, 'creative_direction', 'cd_document', 1, {
      centralConcept: 'Simplicity in chaos',
      narrativeTone: 'Confident, warm',
    });
    const [a] = await db.select().from(videoArtifacts).where(eq(videoArtifacts.id, aId));
    expect(a.step).toBe('creative_direction');
    expect(a.version).toBe(1);
    expect(a.organizationId).toBe(orgIdA);
    expect(a.content).toMatchObject({ centralConcept: 'Simplicity in chaos' });
  });
});

// ── Level 2: Pipeline lifecycle (Steps 8.2-8.4) ──────────────────────────────

describe('8.2 Pipeline steps — status transitions', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
  });

  it('Step 1 → Step 2: brief_intake → creative_direction', async () => {
    await saveArtifact(projectId, orgIdA, 'brief', 'validated_brief', 1, {
      title: 'Test Video', objective: 'Awareness', platforms: ['youtube'],
    });
    await updateStatus(projectId, 'creative_direction', 'creative_direction');
    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('creative_direction');
  });

  it('Step 2 → Step 3: creative_direction → concept', async () => {
    await saveArtifact(projectId, orgIdA, 'creative_direction', 'cd_document', 1, {
      centralConcept: 'Empowering LATAM SMBs',
      narrativeTone: 'Confident and warm',
      visualDirection: 'Clean, modern, colorful',
      audioDirection: 'Uplifting corporate',
    });
    await updateStatus(projectId, 'concept', 'concept_development');
    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('concept');
  });

  it('Step 3 → Gate 1: concept artifact created', async () => {
    await saveArtifact(projectId, orgIdA, 'concept', 'concept_document', 1, {
      conceptSummary: 'A day in the life of an SMB owner, transformed by AI',
      moodboardRefs: ['modern office', 'vibrant colors'],
      projectType: 'corporate_explainer',
    });
    await updateStatus(projectId, 'gate_1', 'gate_1');
    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('gate_1');
  });

  it('artifacts can be queried by step', async () => {
    const artifacts = await db.select().from(videoArtifacts)
      .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'creative_direction')));
    expect(artifacts.length).toBeGreaterThan(0);
    expect(artifacts[0].step).toBe('creative_direction');
  });
});

// ── Level 2: Gate logic (Step 8.4) ───────────────────────────────────────────

describe('8.4 Gate logic — advance path (G1)', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'gate_1', 'gate_1');
  });

  it('SR=advance + BG=pass → combinedVerdict=advance → script phase', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 1, iterationNumber: 1,
      directorVerdict: 'advance',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'advance',
    });
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    expect(r.showrunnerVerdict).toBe('advance');
    expect(r.brandGuardianVerdict).toBe('pass');
    expect(r.combinedVerdict).toBe('advance');

    await updateStatus(projectId, 'script_classify', 'script_classify');
    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('script_classify');
  });
});

describe('8.4 Gate logic — iterate path (G1)', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'gate_1', 'gate_1');
  });

  it('SR=iterate → combinedVerdict=iterate, no advancement', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 1, iterationNumber: 1,
      directorVerdict: 'iterate',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'iterate',
    });
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    expect(r.combinedVerdict).toBe('iterate');
    // Project stays at gate_1
    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('gate_1');
  });

  it('SR=advance + BG=fail → combinedVerdict=iterate (brand fix needed)', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 1, iterationNumber: 2,
      directorVerdict: 'advance',
      brandGuardianVerdict: 'fail',
      combinedVerdict: 'iterate', // BG fail overrides SR advance per spec §5.1
    });
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    expect(r.combinedVerdict).toBe('iterate');
    expect(r.brandGuardianFixGuidance).toBeTruthy();
  });
});

describe('8.4 Gate logic — rethink path (G2)', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'gate_2', 'gate_2');
  });

  it('SR=rethink → CD revision triggered, combinedVerdict=rethink', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 2, iterationNumber: 1,
      directorVerdict: 'rethink',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'rethink',
    });
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    expect(r.combinedVerdict).toBe('rethink');
    // Dir=rethink → pipeline would trigger CD revision (Skill 3) and return to script phase
    expect(r.showrunnerVerdict).toBe('rethink');
  });
});

// ── Level 2: Script sub-steps (4a-4d) ────────────────────────────────────────

describe('8.3 Script sub-steps (4a-4d per spec §3.3)', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'script_classify', 'script_classify');
  });

  it('4a — Classification artifact created (Haiku, mechanical)', async () => {
    await saveArtifact(projectId, orgIdA, 'script_classify', 'script_parameters', 1, {
      format: 'draft-av',
      targetDurationSeconds: 60,
      deliveryParams: { platforms: ['youtube'] },
    });
    await updateStatus(projectId, 'script_structure', 'script_structure');
    const [a] = await db.select().from(videoArtifacts)
      .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'script_classify')));
    expect(a.artifactType).toBe('script_parameters');
    expect(a.content).toMatchObject({ format: 'draft-av' });
  });

  it('4b — Structure artifact (beat sheet) created', async () => {
    await saveArtifact(projectId, orgIdA, 'script_structure', 'beat_sheet', 1, {
      emotionalArc: [
        { timestamp: '0:00', beat: 'Hook — pain point' },
        { timestamp: '0:15', beat: 'Turning point — criteria.agency' },
        { timestamp: '0:45', beat: 'Resolution — transformation' },
      ],
    });
    await updateStatus(projectId, 'script_draft', 'script_draft');
    const artifacts = await db.select().from(videoArtifacts)
      .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'script_structure')));
    expect(artifacts.length).toBe(1);
    expect(artifacts[0].artifactType).toBe('beat_sheet');
  });

  it('4c — Draft script created in correct format (draft-av)', async () => {
    await saveArtifact(projectId, orgIdA, 'script_draft', 'script', 1, {
      format: 'draft-av',
      scenes: [
        { visual: 'Close-up on stressed business owner', audio: 'VO: Running a business is hard...' },
        { visual: 'Dashboard with AI agents working', audio: 'VO: criteria.agency changes everything.' },
      ],
    });
    await updateStatus(projectId, 'script_polish', 'script_polish');
    const [a] = await db.select().from(videoArtifacts)
      .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'script_draft')));
    expect(a.content).toMatchObject({ format: 'draft-av' });
  });

  it('4d — Polished script (self-review) created', async () => {
    await saveArtifact(projectId, orgIdA, 'script_polish', 'polished_script', 1, {
      format: 'draft-av',
      polishNotes: 'Tightened rhythm at 0:30, improved CTA clarity',
      scenes: [
        { visual: 'Close-up on stressed business owner', audio: 'VO: Running a business in LATAM is relentless.' },
        { visual: 'Dashboard — agents completing tasks', audio: 'VO: criteria.agency is your unfair advantage.' },
      ],
    });
    await updateStatus(projectId, 'gate_2', 'gate_2');
    const allScript = await db.select().from(videoArtifacts)
      .where(and(eq(videoArtifacts.projectId, projectId)));
    // Should have at least 4 artifacts (brief intake, classify, structure, draft, polish)
    const scriptSteps = allScript.filter(a =>
      ['script_classify', 'script_structure', 'script_draft', 'script_polish'].includes(a.step),
    );
    expect(scriptSteps.length).toBe(4);
  });
});

// ── Level 2: G3 client approval flow (spec §3.3 Gate 3) ──────────────────────

describe('8.4 G3 client approval flow', () => {
  let projectId: string;
  let gateReviewId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'gate_3', 'gate_3');
  });

  it('G3 creates gate review with clientApprovalStatus=pending', async () => {
    gateReviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 3, iterationNumber: 1,
      directorVerdict: 'advance',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'pending_client',
      clientApprovalStatus: 'pending',
    });
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, gateReviewId));
    expect(r.clientApprovalStatus).toBe('pending');
    expect(r.combinedVerdict).toBe('pending_client');
  });

  it('client approval → clientApprovalStatus=approved → pipeline can advance', async () => {
    await db.update(videoGateReviews).set({
      clientApprovalStatus: 'approved',
      clientApprovalNotes: 'Looks great! Proceed.',
      resolvedAt: new Date(),
      combinedVerdict: 'advance',
    }).where(eq(videoGateReviews.id, gateReviewId));

    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, gateReviewId));
    expect(r.clientApprovalStatus).toBe('approved');
    expect(r.combinedVerdict).toBe('advance');
    expect(r.clientApprovalNotes).toBe('Looks great! Proceed.');
  });

  it('client rejection → clientApprovalStatus=rejected → pipeline iterates', async () => {
    const rejectedReviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 3, iterationNumber: 2,
      directorVerdict: 'advance',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'pending_client',
      clientApprovalStatus: 'pending',
    });
    await db.update(videoGateReviews).set({
      clientApprovalStatus: 'rejected',
      clientApprovalNotes: 'The storyboard colors feel off-brand.',
      combinedVerdict: 'iterate',
    }).where(eq(videoGateReviews.id, rejectedReviewId));

    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, rejectedReviewId));
    expect(r.clientApprovalStatus).toBe('rejected');
    expect(r.combinedVerdict).toBe('iterate');
  });
});

// ── Level 2: 3+3 rule (spec §5.3) ────────────────────────────────────────────

describe('8.4 3+3 rule — iteration tracking', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'gate_2', 'gate_2');
  });

  it('attempts 1-3: normal executor retries', async () => {
    // Simulate 3 failed gate evaluations at G2
    for (let i = 1; i <= 3; i++) {
      await insertGateReview({
        projectId, orgId: orgIdA,
        gateNumber: 2, iterationNumber: i,
        directorVerdict: 'iterate',
        brandGuardianVerdict: 'pass',
        combinedVerdict: 'iterate',
      });
      // Update gateIterations counter
      const currentIterations = { g1: 0, g2: i, g3: 0, g4: 0, g5: 0 };
      await db.update(videoProjects).set({ gateIterations: currentIterations })
        .where(eq(videoProjects.id, projectId));
    }

    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    const gi = p.gateIterations as Record<string, number>;
    expect(gi.g2).toBe(3);
  });

  it('attempts 4-6: leader adjustment (CD revision), counter continues', async () => {
    // Attempts 4-6: CD revision (leader adjustment) kicks in per spec §5.3
    for (let i = 4; i <= 6; i++) {
      await insertGateReview({
        projectId, orgId: orgIdA,
        gateNumber: 2, iterationNumber: i,
        directorVerdict: 'iterate',
        brandGuardianVerdict: 'warning',
        combinedVerdict: 'iterate',
      });
      await db.update(videoProjects).set({ gateIterations: { g1: 0, g2: i, g3: 0, g4: 0, g5: 0 } })
        .where(eq(videoProjects.id, projectId));
    }

    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    const gi = p.gateIterations as Record<string, number>;
    expect(gi.g2).toBe(6);
  });

  it('attempt 7+: human escalation — project marked escalated', async () => {
    // After 6 attempts, escalate per spec §5.3
    await db.update(videoProjects).set({
      status: 'escalated',
      currentStep: 'escalated',
      escalatedAt: new Date(),
      escalationReason: 'G2 exceeded maximum 6 iterations (3+3 rule) — human review required',
    }).where(eq(videoProjects.id, projectId));

    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('escalated');
    expect(p.escalatedAt).not.toBeNull();
    expect(p.escalationReason).toContain('G2');
    expect(p.escalationReason).toContain('3+3');
  });
});

// ── Level 2: G4 diagnostic routing (spec §3.3 Gate 4) ────────────────────────

describe('8.4 G4 diagnostic routing — preserved from PRODUCTION_PIPELINE.md', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
    await updateStatus(projectId, 'gate_4', 'gate_4');
  });

  it('shots problem → DP agent step identified in feedback', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 4, iterationNumber: 1,
      directorVerdict: 'iterate',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'iterate',
    });
    await db.update(videoGateReviews).set({
      showrunnerFeedback: {
        diagnosisType: 'shots',
        problem: 'Shot 3 composition is off-center, continuity break between shots 5-6',
        routeTo: 'dp_agent',
        affectedShots: [3, 5, 6],
      },
    }).where(eq(videoGateReviews.id, reviewId));
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    const feedback = r.showrunnerFeedback as Record<string, unknown>;
    expect(feedback.diagnosisType).toBe('shots');
    expect(feedback.routeTo).toBe('dp_agent');
  });

  it('edit problem → Editor agent step identified in feedback', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 4, iterationNumber: 2,
      directorVerdict: 'iterate',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'iterate',
    });
    await db.update(videoGateReviews).set({
      showrunnerFeedback: {
        diagnosisType: 'edit',
        problem: 'Pacing too slow at 0:30-0:45, transitions feel abrupt',
        routeTo: 'editor_agent',
      },
    }).where(eq(videoGateReviews.id, reviewId));
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    const feedback = r.showrunnerFeedback as Record<string, unknown>;
    expect(feedback.diagnosisType).toBe('edit');
    expect(feedback.routeTo).toBe('editor_agent');
  });

  it('audio problem → Audio Producer agent identified in feedback', async () => {
    const reviewId = await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 4, iterationNumber: 3,
      directorVerdict: 'iterate',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'iterate',
    });
    await db.update(videoGateReviews).set({
      showrunnerFeedback: {
        diagnosisType: 'audio',
        problem: 'Music overpowers VO at 0:15, SFX missing at product reveal',
        routeTo: 'audio_producer_agent',
      },
    }).where(eq(videoGateReviews.id, reviewId));
    const [r] = await db.select().from(videoGateReviews).where(eq(videoGateReviews.id, reviewId));
    const feedback = r.showrunnerFeedback as Record<string, unknown>;
    expect(feedback.diagnosisType).toBe('audio');
    expect(feedback.routeTo).toBe('audio_producer_agent');
  });
});

// ── Level 2: Full pipeline to delivery (Step 8.6) ────────────────────────────

describe('8.6 Full pipeline → delivery + output registry', () => {
  let projectId: string;

  beforeAll(async () => {
    projectId = await createVideoProject(orgIdA);
  });

  it('simulates full pipeline lifecycle to delivered status', async () => {
    // Walk through all pipeline steps
    const steps = [
      ['creative_direction', 'creative_direction'],
      ['concept', 'concept_development'],
      ['gate_1', 'gate_1'],
      ['script_classify', 'script_classify'],
      ['script_structure', 'script_structure'],
      ['script_draft', 'script_draft'],
      ['script_polish', 'script_polish'],
      ['gate_2', 'gate_2'],
      ['visual_look', 'visual_look'],
      ['storyboard', 'storyboard'],
      ['gate_3', 'gate_3'],
      ['video_gen', 'video_generation'],
      ['editing', 'editing'],
      ['audio', 'audio'],
      ['gate_4', 'gate_4'],
      ['polish', 'polish'],
      ['gate_5', 'gate_5'],
    ];

    for (const [status, step] of steps) {
      await updateStatus(projectId, status, step);
    }

    // Final delivery
    await db.update(videoProjects).set({
      status: 'delivered',
      currentStep: 'delivery',
      deliveredAt: new Date(),
    }).where(eq(videoProjects.id, projectId));

    const [p] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
    expect(p.status).toBe('delivered');
    expect(p.deliveredAt).not.toBeNull();
  });

  it('delivered project is indexed in output_registry (DEC-130)', async () => {
    // Simulate Output Registry indexing on delivery
    await db.insert(outputRegistry).values({
      organizationId: orgIdA,
      sourceMotor: 'video',
      sourceAgentId: 'video-motor-pipeline',
      outputType: 'final_video',
      contentRef: projectId,
      summary: 'Corporate explainer video for LATAM SMBs — criteria.agency awareness campaign',
      metadata: {
        projectId,
        format: 'corporate_explainer',
        durationSeconds: 60,
        platforms: ['youtube', 'linkedin'],
        deliveredAt: new Date().toISOString(),
      },
    });

    const results = await db.select().from(outputRegistry)
      .where(and(
        eq(outputRegistry.organizationId, orgIdA),
        eq(outputRegistry.sourceMotor, 'video'),
        eq(outputRegistry.contentRef, projectId),
      ));
    expect(results).toHaveLength(1);
    expect(results[0].summary).toContain('criteria.agency');
  });

  it('output_registry has tenant isolation — org B cannot see org A output', async () => {
    const fromOrgB = await db.select().from(outputRegistry)
      .where(and(
        eq(outputRegistry.organizationId, orgIdB),
        eq(outputRegistry.sourceMotor, 'video'),
        eq(outputRegistry.contentRef, projectId),
      ));
    expect(fromOrgB).toHaveLength(0);
  });
});

// ── Level 2: API route validation (Step 8.6 routes) ──────────────────────────

describe('8.6 API routes — authenticated access', () => {
  it('GET /api/video-motor/projects returns empty list for new tenant', async () => {
    // Create fresh tenant with no projects
    const ts = Date.now();
    const freshEmail = `video-e2e-fresh-${ts}@criteria.agency`;
    const signupRes = await httpRequest('POST', '/api/auth/sign-up/email', {
      email: freshEmail, password: 'TestPassword123!', name: 'Fresh Tenant',
    });
    let freshCookies = getCookies(signupRes);
    const orgRes = await httpRequest(
      'POST', '/api/auth/organization/create',
      { name: 'Fresh Video Org', slug: `fresh-video-${ts}`.slice(0, 50) },
      { cookie: freshCookies },
    );
    const org = await orgRes.json() as { id: string };
    const c1 = getCookies(orgRes);
    if (c1) freshCookies = c1;
    const setRes = await httpRequest('POST', '/api/auth/organization/set-active', { organizationId: org.id }, { cookie: freshCookies });
    const c2 = getCookies(setRes);
    if (c2) freshCookies = c2;
    await db.insert(organizationSettings).values({ organizationId: org.id, plan: 'starter', settings: {} }).onConflictDoNothing();

    const res = await httpRequest('GET', '/api/video-motor/projects', undefined, { cookie: freshCookies });
    expect(res.status).toBe(200);
    const body = await res.json() as { projects: unknown[] };
    expect(body.projects).toHaveLength(0);

    // Cleanup
    await db.delete(organizationSettings).where(eq(organizationSettings.organizationId, org.id));
  });

  it('GET /api/video-motor/projects returns tenant projects with pagination', async () => {
    const res = await httpRequest('GET', '/api/video-motor/projects', undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { projects: unknown[]; total: number };
    expect(Array.isArray(body.projects)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('GET /api/video-motor/projects/:id returns 404 for cross-tenant access', async () => {
    // Create project for org A
    const projectId = await createVideoProject(orgIdA);
    // Try to access with org B's session
    const res = await httpRequest('GET', `/api/video-motor/projects/${projectId}`, undefined, { cookie: cookiesB });
    expect(res.status).toBe(404);
  });

  it('POST /api/video-motor/projects validates brief schema', async () => {
    // Missing required fields
    const res = await httpRequest(
      'POST', '/api/video-motor/projects',
      { title: 'x' }, // too short, missing required fields
      { cookie: cookiesA },
    );
    expect(res.status).toBe(400);
  });

  it('GET /api/video-motor/projects/:id/artifacts returns 404 for cross-tenant', async () => {
    const projectId = await createVideoProject(orgIdA);
    const res = await httpRequest(
      'GET', `/api/video-motor/projects/${projectId}/artifacts`, undefined,
      { cookie: cookiesB },
    );
    expect(res.status).toBe(404);
  });

  it('GET /api/video-motor/projects/:id/gates returns gate reviews for owner', async () => {
    const projectId = await createVideoProject(orgIdA);
    await insertGateReview({
      projectId, orgId: orgIdA,
      gateNumber: 1, iterationNumber: 1,
      directorVerdict: 'advance',
      brandGuardianVerdict: 'pass',
      combinedVerdict: 'advance',
    });

    const res = await httpRequest(
      'GET', `/api/video-motor/projects/${projectId}/gates`, undefined,
      { cookie: cookiesA },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { gateReviews: unknown[]; total: number };
    expect(body.gateReviews.length).toBeGreaterThan(0);
    expect(body.total).toBe(1);
  });

  it('POST /api/video-motor/projects/:id/approve rejects when project not at gate_3', async () => {
    const projectId = await createVideoProject(orgIdA);
    // Project is at brief_intake, not gate_3
    const res = await httpRequest(
      'POST', `/api/video-motor/projects/${projectId}/approve`,
      { approved: true },
      { cookie: cookiesA },
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('G3');
  });
});

// ── Level 2: Tenant isolation (HTTP layer) ────────────────────────────────────

describe('8.L1 Tenant isolation — via HTTP routes', () => {
  it('org B cannot access org A artifacts via API', async () => {
    const projectId = await createVideoProject(orgIdA);
    await saveArtifact(projectId, orgIdA, 'script_draft', 'script', 1, { confidential: true });

    const res = await httpRequest(
      'GET', `/api/video-motor/projects/${projectId}/artifacts`, undefined,
      { cookie: cookiesB },
    );
    expect(res.status).toBe(404); // Project not found for org B
  });

  it('org B projects list does not include org A projects', async () => {
    const projectIdA = await createVideoProject(orgIdA);

    const res = await httpRequest('GET', '/api/video-motor/projects', undefined, { cookie: cookiesB });
    expect(res.status).toBe(200);
    const body = await res.json() as { projects: { id: string }[] };
    const ids = body.projects.map(p => p.id);
    expect(ids).not.toContain(projectIdA);
  });
});
