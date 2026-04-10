/**
 * Web Motor routes — Fase 2
 *
 * POST /api/web-motor/projects               — create project + start pipeline
 * GET  /api/web-motor/projects               — list projects for tenant
 * GET  /api/web-motor/projects/:id           — project details + artifacts + gate results
 * GET  /api/web-motor/projects/:id/artifacts — list artifacts by step
 * GET  /api/web-motor/projects/:id/gates     — list gate results
 * GET  /api/web-motor/projects/:id/pages     — list pages for the project
 * POST /api/web-motor/projects/:id/blog-post — create blog post (continuous mode)
 *
 * All routes: tenant isolation via authenticated session (DEC-148).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  eq,
  and,
  desc,
  webProjects,
  webArtifacts,
  webGateResults,
  webIterationTracking,
  webPages,
  blogPosts,
  organizationSettings,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { inngest } from '../inngest/client.js';
import { logger } from '../lib/logger.js';

// ── Brief schema ──────────────────────────────────────────────────────────────

const briefSchema = z.object({
  /** Site type — determines skill used for Web Developer (DEC-219) */
  siteType: z.enum(['complete_site', 'landing_page', 'microsite', 'product_page', 'blog_first']),
  /** Pages and hierarchy — site architecture per brief (DEC-218) */
  pages: z.array(z.string()).min(1),
  /** Whether the site includes a blog/CMS */
  hasBlog: z.boolean().default(false),
  /** Target audience description */
  targetAudience: z.string().min(5).max(500),
  /** Primary conversion objective */
  conversionObjectives: z.string().min(5).max(500),
  /** Technical requirements (domain, hosting, framework prefs) */
  technicalRequirements: z.string().max(500).optional(),
  /** Email capture provider (mailchimp, convertkit, resend) */
  emailCapture: z.string().max(50).optional(),
  /** Analytics provider (ga4, posthog) */
  analytics: z.string().max(50).optional(),
  /** Reference sites or existing content */
  contentInputs: z.string().max(500).optional(),
  /** Autonomy mode */
  autonomyMode: z.enum(['ai_decides', 'ai_recommends']).default('ai_decides'),
});

// ── Blog post brief schema ────────────────────────────────────────────────────

const blogPostBriefSchema = z.object({
  topic: z.string().min(5).max(200),
  keywords: z.array(z.string()).default([]),
  targetAudience: z.string().default(''),
  seoIntent: z.string().default(''),
  highImportance: z.boolean().default(false),
  needsCustomImagery: z.boolean().default(false),
});

// ── Route factory ─────────────────────────────────────────────────────────────

export function createWebMotorRoute(db: Database) {
  const app = new Hono();

  // POST /api/web-motor/projects — create project + start pipeline
  app.post('/projects', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json().catch(() => null);

    const parsed = briefSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid brief', details: parsed.error.flatten() }, 400);
    }

    // Verify tenant exists (DEC-148)
    const [tenant] = await db
      .select({ organizationId: organizationSettings.organizationId })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, tenantId))
      .limit(1);

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    const { autonomyMode, ...briefData } = parsed.data;

    // Create project record
    const [project] = await db
      .insert(webProjects)
      .values({
        organizationId: tenantId,
        siteType: briefData.siteType,
        status: 'brief_intake',
        currentStep: 'brief-intake',
        brief: briefData,
        autonomyMode,
        gateIterations: { g1: 0, g2: 0, g3: 0 },
      })
      .returning({
        id: webProjects.id,
        siteType: webProjects.siteType,
        status: webProjects.status,
        autonomyMode: webProjects.autonomyMode,
        createdAt: webProjects.createdAt,
      });

    // Create page records from brief site architecture
    if (briefData.pages.length > 0) {
      await db.insert(webPages).values(
        briefData.pages.map((pageName, idx) => ({
          projectId: project.id,
          organizationId: tenantId,
          name: pageName,
          pageType: idx === 0 ? 'home' : 'product',
          hierarchyPosition: idx,
        })),
      );
    }

    // Dispatch Inngest event to start the pipeline
    try {
      const { ids } = await inngest.send({
        name: 'web-motor/pipeline.started',
        data: { tenantId, projectId: project.id },
      });

      await db.update(webProjects)
        .set({ inngestRunId: ids[0] ?? null })
        .where(eq(webProjects.id, project.id));

      logger.info({ tenantId, projectId: project.id, siteType: project.siteType, autonomyMode }, 'Web Motor pipeline started');
      return c.json({ project, eventIds: ids }, 202);
    } catch (err) {
      await db.delete(webProjects).where(eq(webProjects.id, project.id));
      logger.error({ err, tenantId }, 'Failed to start Web Motor pipeline');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // GET /api/web-motor/projects — list all projects for tenant
  app.get('/projects', async (c) => {
    const { tenantId } = getAuthContext(c);

    const projects = await db
      .select({
        id: webProjects.id,
        siteType: webProjects.siteType,
        status: webProjects.status,
        currentStep: webProjects.currentStep,
        autonomyMode: webProjects.autonomyMode,
        liveUrl: webProjects.liveUrl,
        gateIterations: webProjects.gateIterations,
        createdAt: webProjects.createdAt,
        deliveredAt: webProjects.deliveredAt,
      })
      .from(webProjects)
      .where(eq(webProjects.organizationId, tenantId))
      .orderBy(desc(webProjects.createdAt))
      .limit(50);

    return c.json({ projects });
  });

  // GET /api/web-motor/projects/:id — project details
  app.get('/projects/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');

    const [project] = await db
      .select()
      .from(webProjects)
      .where(and(eq(webProjects.id, projectId), eq(webProjects.organizationId, tenantId)))
      .limit(1);

    if (!project) return c.json({ error: 'Project not found' }, 404);

    const pages = await db.select().from(webPages).where(eq(webPages.projectId, projectId));
    const artifacts = await db.select().from(webArtifacts)
      .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.organizationId, tenantId)))
      .orderBy(desc(webArtifacts.createdAt)).limit(50);
    const gateResults = await db.select().from(webGateResults)
      .where(and(eq(webGateResults.projectId, projectId), eq(webGateResults.organizationId, tenantId)))
      .orderBy(desc(webGateResults.createdAt)).limit(30);
    const iterations = await db.select().from(webIterationTracking)
      .where(eq(webIterationTracking.projectId, projectId));

    return c.json({ project, pages, artifacts, gateResults, iterations });
  });

  // GET /api/web-motor/projects/:id/artifacts
  app.get('/projects/:id/artifacts', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');
    const step = c.req.query('step');

    const conditions = [
      eq(webArtifacts.projectId, projectId),
      eq(webArtifacts.organizationId, tenantId),
    ];
    if (step) conditions.push(eq(webArtifacts.step, step));

    const artifacts = await db.select().from(webArtifacts)
      .where(and(...conditions))
      .orderBy(desc(webArtifacts.version)).limit(100);

    return c.json({ artifacts });
  });

  // GET /api/web-motor/projects/:id/gates
  app.get('/projects/:id/gates', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');

    const gateResults = await db.select().from(webGateResults)
      .where(and(eq(webGateResults.projectId, projectId), eq(webGateResults.organizationId, tenantId)))
      .orderBy(desc(webGateResults.createdAt));

    return c.json({ gateResults });
  });

  // POST /api/web-motor/projects/:id/blog-post — trigger continuous mode
  app.post('/projects/:id/blog-post', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');
    const body = await c.req.json().catch(() => null);

    const parsed = blogPostBriefSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid blog post brief', details: parsed.error.flatten() }, 400);
    }

    // Verify project exists, belongs to tenant, and is delivered
    const [project] = await db
      .select({ status: webProjects.status, siteType: webProjects.siteType })
      .from(webProjects)
      .where(and(eq(webProjects.id, projectId), eq(webProjects.organizationId, tenantId)))
      .limit(1);

    if (!project) return c.json({ error: 'Project not found' }, 404);
    if (project.status !== 'delivered') {
      return c.json({ error: 'Blog posts can only be created for delivered sites', currentStatus: project.status }, 409);
    }

    try {
      const { ids } = await inngest.send({
        name: 'web-motor/blog-post.started',
        data: { tenantId, projectId, brief: parsed.data },
      });

      logger.info({ tenantId, projectId, topic: parsed.data.topic }, 'Blog post pipeline started');
      return c.json({ eventIds: ids, topic: parsed.data.topic }, 202);
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to start blog post pipeline');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  return app;
}
