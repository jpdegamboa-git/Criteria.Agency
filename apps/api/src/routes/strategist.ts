/**
 * Strategist routes — Fase 4
 *
 * Platform Intelligence:
 *   GET  /api/strategist/pi/benchmark     — benchmark query (metric + context dimensions)
 *   GET  /api/strategist/pi/pattern       — pattern query (what works?)
 *
 * Diagnostics:
 *   POST /api/strategist/diagnose         — trigger Diagnostic skill (Inngest)
 *   GET  /api/strategist/diagnoses        — list diagnoses for tenant
 *   GET  /api/strategist/diagnoses/:id    — get diagnosis detail
 *
 * Marketing Plans:
 *   POST /api/strategist/plans            — trigger Planning skill (Inngest)
 *   GET  /api/strategist/plans            — list plans for tenant
 *   GET  /api/strategist/plans/:id        — plan detail + campaign briefs
 *   PUT  /api/strategist/plans/:id/approve — client approves plan (G3)
 *   PUT  /api/strategist/plans/:id/reject  — client rejects plan (G3)
 *
 * Campaign Briefs (pre-configured):
 *   POST /api/strategist/campaign-design  — trigger Campaign Design skill (Inngest)
 *   GET  /api/strategist/campaigns        — list all campaign briefs for tenant
 *   GET  /api/strategist/campaigns/:id    — brief detail
 *   PUT  /api/strategist/campaigns/:id/approve — client approves brief (G6)
 *   PUT  /api/strategist/campaigns/:id/reject  — client rejects brief (G6)
 *
 * All routes: tenant isolation via authenticated session (DEC-148).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  and,
  eq,
  desc,
  strategicDiagnoses,
  marketingPlans,
  marketingPlanCampaigns,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { inngest } from '../inngest/client.js';
import { logger } from '../lib/logger.js';
import { benchmarkQuery, patternQuery } from '../lib/platform-intelligence/index.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const diagnoseSchema = z.object({
  triggeredBy: z.enum([
    'bhs_material_change',
    'planning_cycle_start',
    'brand_builder_layer2',
    'analyst_anomaly',
    'competitive_move',
    'manual',
  ]).default('manual'),
});

const planningSchema = z.object({
  triggeredBy: z.enum([
    'diagnosis_complete',
    'new_client',
    'objectives_changed',
    'budget_approved',
    'manual',
  ]).default('manual'),
  diagnosisId: z.string().uuid().optional(),
  periodMonths: z.number().int().min(1).max(12).default(3),
});

const campaignDesignSchema = z.object({
  triggeredBy: z.enum(['plan_scheduled', 'opportunity', 'client_request', 'manual']).default('manual'),
  source: z.enum(['plan', 'opportunity', 'optimization']).default('plan'),
  planId: z.string().uuid().optional(),
  funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']).optional(),
  channelType: z.enum(['paid', 'owned', 'earned']).optional(),
  opportunityContext: z.string().max(1000).optional(),
  optimizationContext: z.string().max(1000).optional(),
});

const approvalSchema = z.object({
  notes: z.string().max(2000).optional(),
});

// ── Route factory ─────────────────────────────────────────────────────────────

export function createStrategistRoute(db: Database) {
  const app = new Hono();

  // ── Platform Intelligence ───────────────────────────────────────────────────

  // GET /api/strategist/pi/benchmark — "What is the standard?"
  app.get('/pi/benchmark', async (c) => {
    // PI queries are free (DEC-118) but still authenticated (tenant context)
    getAuthContext(c); // validates session

    const metric = c.req.query('metric');
    const industry = c.req.query('industry') ?? 'general';
    const region = c.req.query('region') ?? 'LATAM';
    const channel = c.req.query('channel');
    const funnelStage = c.req.query('funnelStage');
    const format = c.req.query('format');

    if (!metric) {
      return c.json({ error: 'metric query param required' }, 400);
    }

    const result = await benchmarkQuery(db, { metric, industry, region, channel, funnelStage, format });

    if (!result) {
      return c.json({ data: null, message: 'No benchmark data available for this combination' }, 200);
    }

    return c.json({ data: result });
  });

  // GET /api/strategist/pi/pattern — "What works?"
  app.get('/pi/pattern', async (c) => {
    getAuthContext(c);

    const metric = c.req.query('metric');
    const groupBy = c.req.query('groupBy') as 'messagingType' | 'format' | 'channel' | 'funnelStage' | undefined;
    const industry = c.req.query('industry');
    const region = c.req.query('region') ?? 'LATAM';
    const channel = c.req.query('channel');
    const funnelStage = c.req.query('funnelStage');

    if (!metric || !groupBy) {
      return c.json({ error: 'metric and groupBy query params required' }, 400);
    }

    const validGroupBy = ['messagingType', 'format', 'channel', 'funnelStage'];
    if (!validGroupBy.includes(groupBy)) {
      return c.json({ error: `groupBy must be one of: ${validGroupBy.join(', ')}` }, 400);
    }

    const result = await patternQuery(db, { metric, groupBy, industry, region, channel, funnelStage });

    if (!result) {
      return c.json({ data: null, message: 'No pattern data available for this combination' }, 200);
    }

    return c.json({ data: result });
  });

  // ── Diagnostics ─────────────────────────────────────────────────────────────

  // POST /api/strategist/diagnose — trigger Diagnostic skill
  app.post('/diagnose', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json();
    const parsed = diagnoseSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    try {
      const { ids } = await inngest.send({
        name: 'strategist/diagnostic.started',
        data: {
          tenantId,
          triggeredBy: parsed.data.triggeredBy,
          attemptNumber: 1,
        },
      });
      return c.json({ dispatched: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err }, 'Failed to dispatch strategist/diagnostic.started');
      return c.json({ error: 'Failed to dispatch diagnostic' }, 503);
    }
  });

  // GET /api/strategist/diagnoses — list diagnoses
  app.get('/diagnoses', async (c) => {
    const { tenantId } = getAuthContext(c);
    const statusFilter = c.req.query('status');
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50);

    const where = statusFilter
      ? and(eq(strategicDiagnoses.organizationId, tenantId), eq(strategicDiagnoses.status, statusFilter))
      : eq(strategicDiagnoses.organizationId, tenantId);

    const rows = await db
      .select()
      .from(strategicDiagnoses)
      .where(where)
      .orderBy(desc(strategicDiagnoses.createdAt))
      .limit(limit);

    return c.json(rows);
  });

  // GET /api/strategist/diagnoses/:id — diagnosis detail
  app.get('/diagnoses/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const diagId = c.req.param('id');

    const [row] = await db
      .select()
      .from(strategicDiagnoses)
      .where(and(eq(strategicDiagnoses.id, diagId), eq(strategicDiagnoses.organizationId, tenantId)))
      .limit(1);

    if (!row) return c.json({ error: 'Diagnosis not found' }, 404);
    return c.json(row);
  });

  // ── Marketing Plans ─────────────────────────────────────────────────────────

  // POST /api/strategist/plans — trigger Planning skill
  app.post('/plans', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json();
    const parsed = planningSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    try {
      const { ids } = await inngest.send({
        name: 'strategist/planning.started',
        data: {
          tenantId,
          triggeredBy: parsed.data.triggeredBy,
          diagnosisId: parsed.data.diagnosisId,
          periodMonths: parsed.data.periodMonths,
          attemptNumber: 1,
          g1Attempts: 0,
          g2Attempts: 0,
        },
      });
      return c.json({ dispatched: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err }, 'Failed to dispatch strategist/planning.started');
      return c.json({ error: 'Failed to dispatch planning' }, 503);
    }
  });

  // GET /api/strategist/plans — list marketing plans
  app.get('/plans', async (c) => {
    const { tenantId } = getAuthContext(c);
    const statusFilter = c.req.query('status');
    const limit = Math.min(parseInt(c.req.query('limit') ?? '10', 10), 50);

    const where = statusFilter
      ? and(eq(marketingPlans.organizationId, tenantId), eq(marketingPlans.status, statusFilter))
      : eq(marketingPlans.organizationId, tenantId);

    const rows = await db
      .select()
      .from(marketingPlans)
      .where(where)
      .orderBy(desc(marketingPlans.createdAt))
      .limit(limit);

    return c.json(rows);
  });

  // GET /api/strategist/plans/:id — plan detail with campaign briefs
  app.get('/plans/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const planId = c.req.param('id');

    const [plan] = await db
      .select()
      .from(marketingPlans)
      .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, tenantId)))
      .limit(1);

    if (!plan) return c.json({ error: 'Plan not found' }, 404);

    const campaigns = await db
      .select()
      .from(marketingPlanCampaigns)
      .where(and(eq(marketingPlanCampaigns.planId, planId), eq(marketingPlanCampaigns.organizationId, tenantId)))
      .orderBy(desc(marketingPlanCampaigns.createdAt));

    return c.json({ plan, campaigns });
  });

  // PUT /api/strategist/plans/:id/approve — client approves plan (G3)
  app.put('/plans/:id/approve', async (c) => {
    const { tenantId } = getAuthContext(c);
    const planId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = approvalSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const [plan] = await db
      .select()
      .from(marketingPlans)
      .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, tenantId)))
      .limit(1);

    if (!plan) return c.json({ error: 'Plan not found' }, 404);
    if (plan.g3Status !== 'pending') {
      return c.json({ error: `Plan is not pending approval (current G3 status: ${plan.g3Status})` }, 409);
    }

    const [updated] = await db
      .update(marketingPlans)
      .set({
        g3Status: 'approved',
        g3Notes: notes ?? null,
        status: 'approved',
        approvedAt: new Date(),
      })
      .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, tenantId)))
      .returning();

    return c.json(updated);
  });

  // PUT /api/strategist/plans/:id/reject — client rejects plan (G3)
  app.put('/plans/:id/reject', async (c) => {
    const { tenantId } = getAuthContext(c);
    const planId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = approvalSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const [plan] = await db
      .select()
      .from(marketingPlans)
      .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, tenantId)))
      .limit(1);

    if (!plan) return c.json({ error: 'Plan not found' }, 404);

    const [updated] = await db
      .update(marketingPlans)
      .set({ g3Status: 'rejected', g3Notes: notes ?? null, status: 'archived' })
      .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, tenantId)))
      .returning();

    return c.json(updated);
  });

  // ── Campaign Briefs ─────────────────────────────────────────────────────────

  // POST /api/strategist/campaign-design — trigger Campaign Design skill
  app.post('/campaign-design', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json();
    const parsed = campaignDesignSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    try {
      const { ids } = await inngest.send({
        name: 'strategist/campaign-design.started',
        data: {
          tenantId,
          triggeredBy: parsed.data.triggeredBy,
          source: parsed.data.source,
          planId: parsed.data.planId,
          funnelStage: parsed.data.funnelStage,
          channelType: parsed.data.channelType,
          opportunityContext: parsed.data.opportunityContext,
          optimizationContext: parsed.data.optimizationContext,
          attemptNumber: 1,
        },
      });
      return c.json({ dispatched: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err }, 'Failed to dispatch strategist/campaign-design.started');
      return c.json({ error: 'Failed to dispatch campaign design' }, 503);
    }
  });

  // GET /api/strategist/campaigns — list all campaign briefs
  app.get('/campaigns', async (c) => {
    const { tenantId } = getAuthContext(c);
    const statusFilter = c.req.query('status');
    const funnelStage = c.req.query('funnelStage');
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100);

    let where = eq(marketingPlanCampaigns.organizationId, tenantId);
    if (statusFilter) where = and(where, eq(marketingPlanCampaigns.status, statusFilter))!;
    if (funnelStage) where = and(where, eq(marketingPlanCampaigns.funnelStage, funnelStage))!;

    const rows = await db
      .select()
      .from(marketingPlanCampaigns)
      .where(where)
      .orderBy(desc(marketingPlanCampaigns.createdAt))
      .limit(limit);

    return c.json(rows);
  });

  // GET /api/strategist/campaigns/:id — brief detail
  app.get('/campaigns/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const briefId = c.req.param('id');

    const [row] = await db
      .select()
      .from(marketingPlanCampaigns)
      .where(and(eq(marketingPlanCampaigns.id, briefId), eq(marketingPlanCampaigns.organizationId, tenantId)))
      .limit(1);

    if (!row) return c.json({ error: 'Campaign brief not found' }, 404);
    return c.json(row);
  });

  // PUT /api/strategist/campaigns/:id/approve — client approves brief (G6)
  app.put('/campaigns/:id/approve', async (c) => {
    const { tenantId } = getAuthContext(c);
    const briefId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = approvalSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const [brief] = await db
      .select()
      .from(marketingPlanCampaigns)
      .where(and(eq(marketingPlanCampaigns.id, briefId), eq(marketingPlanCampaigns.organizationId, tenantId)))
      .limit(1);

    if (!brief) return c.json({ error: 'Campaign brief not found' }, 404);
    if (brief.g6Status !== 'pending') {
      return c.json({ error: `Brief is not pending approval (current G6 status: ${brief.g6Status})` }, 409);
    }

    const [updated] = await db
      .update(marketingPlanCampaigns)
      .set({
        g6Status: 'approved',
        g6Notes: notes ?? null,
        status: 'approved',
        approvedAt: new Date(),
      })
      .where(and(eq(marketingPlanCampaigns.id, briefId), eq(marketingPlanCampaigns.organizationId, tenantId)))
      .returning();

    return c.json(updated);
  });

  // PUT /api/strategist/campaigns/:id/reject — client rejects brief (G6)
  app.put('/campaigns/:id/reject', async (c) => {
    const { tenantId } = getAuthContext(c);
    const briefId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = approvalSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

    const [brief] = await db
      .select()
      .from(marketingPlanCampaigns)
      .where(and(eq(marketingPlanCampaigns.id, briefId), eq(marketingPlanCampaigns.organizationId, tenantId)))
      .limit(1);

    if (!brief) return c.json({ error: 'Campaign brief not found' }, 404);

    const [updated] = await db
      .update(marketingPlanCampaigns)
      .set({ g6Status: 'rejected', g6Notes: notes ?? null, status: 'rejected' })
      .where(and(eq(marketingPlanCampaigns.id, briefId), eq(marketingPlanCampaigns.organizationId, tenantId)))
      .returning();

    return c.json(updated);
  });

  return app;
}
