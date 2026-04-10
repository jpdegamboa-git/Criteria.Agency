/**
 * Video Motor routes — Fase 2
 *
 * POST /api/video-motor/projects          — create project + start pipeline
 * GET  /api/video-motor/projects          — list projects for tenant
 * GET  /api/video-motor/projects/:id      — project details + artifacts + gate reviews
 * POST /api/video-motor/projects/:id/approve — approve G3 storyboard (client approval)
 * GET  /api/video-motor/projects/:id/artifacts — list artifacts by step
 * GET  /api/video-motor/projects/:id/gates    — list gate reviews
 *
 * All routes: tenant isolation via authenticated session (DEC-148).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  eq,
  and,
  desc,
  videoProjects,
  videoArtifacts,
  videoGateReviews,
  organizationSettings,
  motors,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { inngest } from '../inngest/client.js';
import { logger } from '../lib/logger.js';

// ── Brief schema ──────────────────────────────────────────────────────────────

const briefSchema = z.object({
  /** Project title for admin identification */
  title: z.string().min(3).max(200),
  /** Core objective of the video */
  objective: z.string().min(10).max(1000),
  /** Target audience description */
  targetAudience: z.string().min(10).max(500),
  /** Key message to communicate */
  keyMessage: z.string().min(10).max(500),
  /** Approximate duration in seconds */
  targetDurationSeconds: z.number().int().min(15).max(7200).optional(),
  /** Delivery platforms */
  platforms: z.array(z.string()).default([]),
  /** Tone/mood guidance */
  tone: z.string().max(200).optional(),
  /** Budget context (for Strategist-fed briefs) */
  budgetContext: z.string().max(200).optional(),
  /** Reference links (existing videos, examples) */
  references: z.array(z.string().url()).default([]),
  /** Whether the client already has a script */
  hasScript: z.boolean().default(false),
  /** Pre-existing script text (if hasScript = true) */
  existingScript: z.string().max(50000).optional(),
  /** Autonomy mode override (defaults to motor setting) */
  autonomyMode: z.enum(['ai_decides', 'ai_recommends']).optional(),
});

export type VideoBrief = z.infer<typeof briefSchema>;

// ── Route factory ─────────────────────────────────────────────────────────────

export function createVideoMotorRoute(db: Database) {
  const app = new Hono();

  // POST /api/video-motor/projects — create project + start pipeline
  app.post('/projects', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json().catch(() => null);

    const parsed = briefSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid brief', details: parsed.error.flatten() }, 400);
    }

    // Verify tenant exists
    const [tenant] = await db
      .select({ organizationId: organizationSettings.organizationId })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, tenantId))
      .limit(1);

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    // Get autonomy mode from motor config (or use brief override)
    let autonomyMode = parsed.data.autonomyMode ?? 'ai_recommends';
    if (!parsed.data.autonomyMode) {
      const [motorConfig] = await db
        .select({ autonomyMode: motors.autonomyMode })
        .from(motors)
        .where(
          and(
            eq(motors.organizationId, tenantId),
            eq(motors.motor, 'video'),
          ),
        )
        .limit(1);

      if (motorConfig?.autonomyMode === 'ai_decides' || motorConfig?.autonomyMode === 'ai_recommends') {
        autonomyMode = motorConfig.autonomyMode as 'ai_decides' | 'ai_recommends';
      }
    }

    // Create the project record (pipeline reads from DB — not from Inngest event state)
    const { autonomyMode: _removed, ...briefWithoutMode } = parsed.data;
    const [project] = await db
      .insert(videoProjects)
      .values({
        organizationId: tenantId,
        status: 'brief_intake',
        currentStep: 'brief_intake',
        brief: briefWithoutMode,
        autonomyMode,
        gateIterations: { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 },
      })
      .returning({
        id: videoProjects.id,
        status: videoProjects.status,
        autonomyMode: videoProjects.autonomyMode,
        createdAt: videoProjects.createdAt,
      });

    // Dispatch Inngest event to start the pipeline
    try {
      const { ids } = await inngest.send({
        name: 'video-motor/pipeline.started',
        data: {
          tenantId,
          projectId: project.id,
        },
      });

      // Update project with inngest run reference
      await db
        .update(videoProjects)
        .set({ inngestRunId: ids[0] ?? null })
        .where(eq(videoProjects.id, project.id));

      logger.info({ tenantId, projectId: project.id, autonomyMode }, 'Video Motor pipeline started');
      return c.json(
        {
          project: {
            id: project.id,
            status: project.status,
            autonomyMode: project.autonomyMode,
            createdAt: project.createdAt,
          },
          eventIds: ids,
        },
        202,
      );
    } catch (err) {
      // Rollback the project if Inngest dispatch fails
      await db.delete(videoProjects).where(eq(videoProjects.id, project.id));
      logger.error({ err, tenantId }, 'Failed to start Video Motor pipeline');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // GET /api/video-motor/projects — list tenant's projects
  app.get('/projects', async (c) => {
    const { tenantId } = getAuthContext(c);
    const limitParam = c.req.query('limit');
    const limit = Math.min(parseInt(limitParam ?? '20', 10), 100);

    const projects = await db
      .select({
        id: videoProjects.id,
        status: videoProjects.status,
        currentStep: videoProjects.currentStep,
        autonomyMode: videoProjects.autonomyMode,
        gateIterations: videoProjects.gateIterations,
        escalatedAt: videoProjects.escalatedAt,
        deliveredAt: videoProjects.deliveredAt,
        createdAt: videoProjects.createdAt,
        updatedAt: videoProjects.updatedAt,
      })
      .from(videoProjects)
      .where(eq(videoProjects.organizationId, tenantId))
      .orderBy(desc(videoProjects.createdAt))
      .limit(limit);

    return c.json({ projects, total: projects.length });
  });

  // GET /api/video-motor/projects/:id — project details
  app.get('/projects/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');

    const [project] = await db
      .select()
      .from(videoProjects)
      .where(
        and(
          eq(videoProjects.id, projectId),
          eq(videoProjects.organizationId, tenantId),
        ),
      )
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  });

  // GET /api/video-motor/projects/:id/artifacts — list artifacts
  app.get('/projects/:id/artifacts', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');
    const stepFilter = c.req.query('step');

    // Verify project belongs to tenant
    const [project] = await db
      .select({ id: videoProjects.id })
      .from(videoProjects)
      .where(
        and(
          eq(videoProjects.id, projectId),
          eq(videoProjects.organizationId, tenantId),
        ),
      )
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const conditions = [eq(videoArtifacts.projectId, projectId)];
    if (stepFilter) {
      conditions.push(eq(videoArtifacts.step, stepFilter));
    }

    const artifacts = await db
      .select()
      .from(videoArtifacts)
      .where(and(...conditions))
      .orderBy(videoArtifacts.step, videoArtifacts.version);

    return c.json({ artifacts, total: artifacts.length });
  });

  // GET /api/video-motor/projects/:id/gates — list gate reviews
  app.get('/projects/:id/gates', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');

    const [project] = await db
      .select({ id: videoProjects.id })
      .from(videoProjects)
      .where(
        and(
          eq(videoProjects.id, projectId),
          eq(videoProjects.organizationId, tenantId),
        ),
      )
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const reviews = await db
      .select()
      .from(videoGateReviews)
      .where(eq(videoGateReviews.projectId, projectId))
      .orderBy(videoGateReviews.gateNumber, videoGateReviews.iterationNumber);

    return c.json({ gateReviews: reviews, total: reviews.length });
  });

  // POST /api/video-motor/projects/:id/approve — G3 storyboard client approval
  app.post('/projects/:id/approve', async (c) => {
    const { tenantId } = getAuthContext(c);
    const projectId = c.req.param('id');

    const approvalSchema = z.object({
      approved: z.boolean(),
      notes: z.string().max(1000).optional(),
    });

    const body = await c.req.json().catch(() => null);
    const parsed = approvalSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid approval', details: parsed.error.flatten() }, 400);
    }

    // Verify project belongs to tenant and is at G3
    const [project] = await db
      .select({ id: videoProjects.id, status: videoProjects.status })
      .from(videoProjects)
      .where(
        and(
          eq(videoProjects.id, projectId),
          eq(videoProjects.organizationId, tenantId),
        ),
      )
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.status !== 'gate_3') {
      return c.json(
        { error: `Project is not awaiting G3 approval (current status: ${project.status})` },
        400,
      );
    }

    // Update the pending G3 gate review
    await db
      .update(videoGateReviews)
      .set({
        clientApprovalStatus: parsed.data.approved ? 'approved' : 'rejected',
        clientApprovalNotes: parsed.data.notes ?? null,
        resolvedAt: new Date(),
      })
      .where(
        and(
          eq(videoGateReviews.projectId, projectId),
          eq(videoGateReviews.gateNumber, 3),
          eq(videoGateReviews.clientApprovalStatus, 'pending'),
        ),
      );

    // Dispatch Inngest event to unblock the pipeline's waitForEvent
    try {
      const { ids } = await inngest.send({
        name: 'video-motor/client-approved',
        data: {
          projectId,
          approved: parsed.data.approved,
          notes: parsed.data.notes ?? '',
        },
      });

      logger.info({ tenantId, projectId, approved: parsed.data.approved }, 'G3 client approval submitted');
      return c.json({ approved: parsed.data.approved, eventIds: ids }, 200);
    } catch (err) {
      logger.error({ err, tenantId, projectId }, 'Failed to dispatch G3 approval event');
      return c.json({ error: 'Failed to dispatch approval event — is Inngest Dev Server running?' }, 503);
    }
  });

  return app;
}
