/**
 * Analyst routes — Fase 3
 *
 * Brand Health Score:
 *   GET  /api/analyst/bhs              — latest BHS for tenant
 *   GET  /api/analyst/bhs/history      — BHS history (last N records)
 *   POST /api/analyst/bhs/recalculate  — trigger on-demand BHS recalculation (Inngest)
 *
 * Campaigns:
 *   GET  /api/analyst/campaigns        — list all campaigns for tenant
 *   POST /api/analyst/campaigns        — create a campaign
 *   GET  /api/analyst/campaigns/:id    — get campaign details with latest KPIs
 *   PUT  /api/analyst/campaigns/:id    — update campaign (status, brief, etc.)
 *   POST /api/analyst/campaigns/:id/kpi — record a KPI snapshot (triggers threshold check)
 *
 * Dashboard:
 *   GET  /api/analyst/dashboard        — aggregated dashboard payload (Funnel Matrix + BHS + alerts)
 *
 * Output Registry:
 *   GET  /api/analyst/outputs          — list outputs (filterable by motor/type)
 *   POST /api/analyst/outputs          — index a new output
 *   POST /api/analyst/outputs/search   — semantic search
 *
 * Alerts:
 *   GET  /api/analyst/alerts           — list open threshold alerts
 *   PUT  /api/analyst/alerts/:id       — dismiss alert
 *
 * All routes: tenant isolation via authenticated session (DEC-148).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  eq,
  and,
  desc,
  brandHealthScores,
  campaigns,
  campaignKpis,
  thresholdAlerts,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { inngest } from '../inngest/client.js';
import { logger } from '../lib/logger.js';
import { recordKpiSnapshot } from '../lib/analyst/kpi-tracker.js';
import { aggregateDashboard } from '../lib/analyst/dashboard-aggregator.js';
import { indexOutput, searchOutputs, listOutputs } from '../lib/analyst/output-registry.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  channelType: z.enum(['paid', 'owned', 'earned']),
  objectives: z.record(z.string(), z.unknown()).optional().default({}),
  budget: z.record(z.string(), z.unknown()).optional().default({}),
  brief: z.record(z.string(), z.unknown()).optional().default({}),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  videoProjectId: z.string().uuid().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(['definition', 'production', 'execution', 'completed', 'paused']).optional(),
});

const kpiSnapshotSchema = z.object({
  channel: z.enum(['meta', 'google_ads', 'google_analytics', 'tiktok', 'email', 'other']),
  period: z.string().datetime(),
  impressions: z.number().int().optional(),
  clicks: z.number().int().optional(),
  ctr: z.number().optional(),
  cpm: z.number().optional(),
  cpc: z.number().optional(),
  conversions: z.number().int().optional(),
  roas: z.number().optional(),
  engagementRate: z.number().optional(),
  spend: z.number().optional(),
  rawMetrics: z.record(z.string(), z.unknown()).optional().default({}),
});

const indexOutputSchema = z.object({
  sourceMotor: z.string().min(1),
  sourceAgentId: z.string().optional(),
  outputType: z.string().min(1),
  contentRef: z.string().uuid(),
  summary: z.string().min(10).max(2000),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

const searchOutputSchema = z.object({
  query: z.string().min(1).max(500),
  sourceMotor: z.string().optional(),
  outputType: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
  similarityThreshold: z.number().min(0).max(1).optional().default(0.5),
});

// ── Route factory ─────────────────────────────────────────────────────────────

export function createAnalystRoute(db: Database) {
  const app = new Hono();

  // ── Brand Health Score ──────────────────────────────────────────────────────

  // GET /api/analyst/bhs — latest BHS for tenant
  app.get('/bhs', async (c) => {
    const { tenantId } = getAuthContext(c);

    const [latest] = await db
      .select()
      .from(brandHealthScores)
      .where(eq(brandHealthScores.organizationId, tenantId))
      .orderBy(desc(brandHealthScores.calculatedAt))
      .limit(1);

    if (!latest) {
      return c.json({ score: null, message: 'No BHS calculated yet — trigger recalculation' }, 200);
    }

    return c.json({
      id: latest.id,
      fundamentos: latest.fundamentos,
      ejecucion: latest.ejecucion,
      oportunidad: latest.oportunidad,
      totalScore: latest.totalScore,
      breakdown: latest.breakdown,
      calculatedAt: latest.calculatedAt.toISOString(),
    });
  });

  // GET /api/analyst/bhs/history — last 30 days of BHS records
  app.get('/bhs/history', async (c) => {
    const { tenantId } = getAuthContext(c);
    const limit = Math.min(parseInt(c.req.query('limit') ?? '30', 10), 90);

    const history = await db
      .select()
      .from(brandHealthScores)
      .where(eq(brandHealthScores.organizationId, tenantId))
      .orderBy(desc(brandHealthScores.calculatedAt))
      .limit(limit);

    return c.json(
      history.map((h) => ({
        id: h.id,
        fundamentos: h.fundamentos,
        ejecucion: h.ejecucion,
        oportunidad: h.oportunidad,
        totalScore: h.totalScore,
        calculatedAt: h.calculatedAt.toISOString(),
      })),
    );
  });

  // POST /api/analyst/bhs/recalculate — on-demand BHS recalculation
  app.post('/bhs/recalculate', async (c) => {
    const { tenantId } = getAuthContext(c);

    try {
      const { ids } = await inngest.send({
        name: 'analyst/bhs.recalculate',
        data: { tenantId, organizationId: tenantId },
      });
      return c.json({ dispatched: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err }, 'Failed to dispatch BHS recalculation event');
      return c.json({ error: 'Failed to dispatch recalculation' }, 503);
    }
  });

  // ── Campaigns ───────────────────────────────────────────────────────────────

  // GET /api/analyst/campaigns — list all campaigns
  app.get('/campaigns', async (c) => {
    const { tenantId } = getAuthContext(c);
    const statusFilter = c.req.query('status');

    const where = statusFilter
      ? and(eq(campaigns.organizationId, tenantId), eq(campaigns.status, statusFilter))
      : eq(campaigns.organizationId, tenantId);

    const rows = await db
      .select()
      .from(campaigns)
      .where(where)
      .orderBy(desc(campaigns.createdAt));

    return c.json(rows);
  });

  // POST /api/analyst/campaigns — create a campaign
  app.post('/campaigns', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    const data = parsed.data;
    const [inserted] = await db
      .insert(campaigns)
      .values({
        organizationId: tenantId,
        name: data.name,
        funnelStage: data.funnelStage,
        channelType: data.channelType,
        objectives: data.objectives,
        budget: data.budget,
        brief: data.brief,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        videoProjectId: data.videoProjectId ?? undefined,
      })
      .returning();

    return c.json(inserted, 201);
  });

  // GET /api/analyst/campaigns/:id — campaign details
  app.get('/campaigns/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const campaignId = c.req.param('id');

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, tenantId)))
      .limit(1);

    if (!campaign) return c.json({ error: 'Campaign not found' }, 404);

    // Latest KPIs per channel
    const kpis = await db
      .select()
      .from(campaignKpis)
      .where(eq(campaignKpis.campaignId, campaignId))
      .orderBy(desc(campaignKpis.period))
      .limit(20);

    // Open alerts
    const alerts = await db
      .select()
      .from(thresholdAlerts)
      .where(and(eq(thresholdAlerts.campaignId, campaignId), eq(thresholdAlerts.status, 'open')))
      .orderBy(desc(thresholdAlerts.createdAt));

    return c.json({ campaign, kpis, alerts });
  });

  // PUT /api/analyst/campaigns/:id — update campaign
  app.put('/campaigns/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const campaignId = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    const [existing] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, tenantId)))
      .limit(1);

    if (!existing) return c.json({ error: 'Campaign not found' }, 404);

    const data = parsed.data;
    const [updated] = await db
      .update(campaigns)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.funnelStage !== undefined && { funnelStage: data.funnelStage }),
        ...(data.channelType !== undefined && { channelType: data.channelType }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.objectives !== undefined && { objectives: data.objectives }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.brief !== undefined && { brief: data.brief }),
        ...(data.startsAt !== undefined && { startsAt: new Date(data.startsAt) }),
        ...(data.endsAt !== undefined && { endsAt: new Date(data.endsAt) }),
        ...(data.videoProjectId !== undefined && { videoProjectId: data.videoProjectId }),
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, tenantId)))
      .returning();

    return c.json(updated);
  });

  // POST /api/analyst/campaigns/:id/kpi — record a KPI snapshot
  app.post('/campaigns/:id/kpi', async (c) => {
    const { tenantId } = getAuthContext(c);
    const campaignId = c.req.param('id');
    const body = await c.req.json();
    const parsed = kpiSnapshotSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, tenantId)))
      .limit(1);

    if (!campaign) return c.json({ error: 'Campaign not found' }, 404);

    const data = parsed.data;
    const kpiId = await recordKpiSnapshot(db, {
      campaignId,
      organizationId: tenantId,
      channel: data.channel,
      period: new Date(data.period),
      impressions: data.impressions,
      clicks: data.clicks,
      ctr: data.ctr,
      cpm: data.cpm,
      cpc: data.cpc,
      conversions: data.conversions,
      roas: data.roas,
      engagementRate: data.engagementRate,
      spend: data.spend,
      rawMetrics: data.rawMetrics,
    });

    // Trigger threshold check via Inngest
    try {
      await inngest.send({
        name: 'analyst/kpi.ingested',
        data: { tenantId, organizationId: tenantId, campaignId },
      });
    } catch {
      // Non-fatal: threshold check will run on next cron
      logger.warn({ campaignId }, 'Could not dispatch kpi.ingested event — threshold check deferred to cron');
    }

    return c.json({ kpiId, dispatched: true }, 201);
  });

  // ── Dashboard ───────────────────────────────────────────────────────────────

  // GET /api/analyst/dashboard — full dashboard payload
  app.get('/dashboard', async (c) => {
    const { tenantId } = getAuthContext(c);
    const payload = await aggregateDashboard(db, tenantId);
    return c.json(payload);
  });

  // ── Output Registry ─────────────────────────────────────────────────────────

  // GET /api/analyst/outputs — list outputs
  app.get('/outputs', async (c) => {
    const { tenantId } = getAuthContext(c);
    const sourceMotor = c.req.query('motor');
    const outputType = c.req.query('type');
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100);

    const results = await listOutputs(db, {
      organizationId: tenantId,
      sourceMotor,
      outputType,
      limit,
    });

    return c.json(results);
  });

  // POST /api/analyst/outputs — index a new output
  app.post('/outputs', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json();
    const parsed = indexOutputSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    const data = parsed.data;
    const id = await indexOutput(db, {
      organizationId: tenantId,
      sourceMotor: data.sourceMotor,
      sourceAgentId: data.sourceAgentId,
      outputType: data.outputType,
      contentRef: data.contentRef,
      summary: data.summary,
      metadata: data.metadata,
    });

    return c.json({ id }, 201);
  });

  // POST /api/analyst/outputs/search — semantic search
  app.post('/outputs/search', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json();
    const parsed = searchOutputSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
    }

    const data = parsed.data;
    const results = await searchOutputs(db, tenantId, data.query, {
      sourceMotor: data.sourceMotor,
      outputType: data.outputType,
      limit: data.limit,
      similarityThreshold: data.similarityThreshold,
    });

    return c.json(results);
  });

  // ── Alerts ──────────────────────────────────────────────────────────────────

  // GET /api/analyst/alerts — list open threshold alerts
  app.get('/alerts', async (c) => {
    const { tenantId } = getAuthContext(c);
    const statusFilter = c.req.query('status') ?? 'open';
    const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200);

    const alerts = await db
      .select()
      .from(thresholdAlerts)
      .where(
        and(
          eq(thresholdAlerts.organizationId, tenantId),
          eq(thresholdAlerts.status, statusFilter),
        ),
      )
      .orderBy(desc(thresholdAlerts.createdAt))
      .limit(limit);

    return c.json(alerts);
  });

  // PUT /api/analyst/alerts/:id — dismiss alert
  app.put('/alerts/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const alertId = c.req.param('id');

    const [existing] = await db
      .select()
      .from(thresholdAlerts)
      .where(and(eq(thresholdAlerts.id, alertId), eq(thresholdAlerts.organizationId, tenantId)))
      .limit(1);

    if (!existing) return c.json({ error: 'Alert not found' }, 404);

    const [updated] = await db
      .update(thresholdAlerts)
      .set({ status: 'dismissed' })
      .where(and(eq(thresholdAlerts.id, alertId), eq(thresholdAlerts.organizationId, tenantId)))
      .returning();

    return c.json(updated);
  });

  return app;
}
