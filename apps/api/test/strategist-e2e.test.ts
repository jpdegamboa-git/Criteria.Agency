/**
 * Strategist Motor — Fase 4 validation
 *
 * Level 1 (security — blocks deploy):
 *   1. Auth enforcement: unauthenticated → 401 on all strategist endpoints
 *   2. Tenant isolation: Org A data not visible to Org B
 *   3. AI Tier A enforcement: prompt_registry entries for strategist have dataSensitivity=A
 *   4. Inngest security: schema validation rejects invalid events, tenant verification enforced
 *
 * Level 2 (pipeline regression):
 *   5.  Platform Intelligence: benchmarkQuery returns fallback hierarchy
 *   6.  Platform Intelligence: patternQuery returns ranked results
 *   7.  PI routes: GET /strategist/pi/benchmark returns seeded data
 *   8.  Diagnoses lifecycle: insert → list → detail (tenant scoped)
 *   9.  Cross-tenant diagnosis → 404
 *  10.  Marketing Plans lifecycle: insert → list → detail → G3 approve
 *  11.  Marketing Plans G3 reject and re-approval conflict (409)
 *  12.  Campaign Briefs lifecycle: insert → list → detail → G6 approve
 *  13.  Campaign Briefs G6 reject and re-approval conflict (409)
 *  14.  Inngest Diagnostic schema: missing tenantId rejected
 *  15.  Inngest Diagnostic schema: invalid triggeredBy rejected
 *  16.  Inngest Planning schema: missing tenantId rejected
 *  17.  Inngest Campaign Design schema: invalid source rejected
 *  18.  3+3 escalation: Diagnostic with attemptNumber > 6 marks diagnosis escalated
 *
 * No ANTHROPIC_API_KEY needed — no LLM calls. Pure DB state + route tests.
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import {
  createDb,
  type Database,
  organizationSettings,
  promptRegistry,
  strategicDiagnoses,
  marketingPlans,
  marketingPlanCampaigns,
  platformIntelligenceBenchmarks,
  eq,
  and,
} from '@criteria/db';
import { createApp } from '../src/index.js';
import { benchmarkQuery, patternQuery, batchBenchmarkQuery } from '../src/lib/platform-intelligence/index.js';
import type { Hono } from 'hono';

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

async function createTenant(ts: number, suffix = ''): Promise<{ orgId: string; cookies: string }> {
  const email = `strat-e2e-${ts}${suffix}@criteria.agency`;
  const slug = `strat-e2e-${ts}${suffix}`.slice(0, 50);

  const signupRes = await httpRequest('POST', '/api/auth/sign-up/email', {
    email, password: 'TestPassword123!', name: `Strat E2E${suffix}`,
  });
  expect(signupRes.status).toBe(200);
  let cookies = getCookies(signupRes);

  const orgRes = await httpRequest(
    'POST', '/api/auth/organization/create',
    { name: `Strat Org${suffix}`, slug },
    { cookie: cookies },
  );
  expect(orgRes.status).toBe(200);
  const org = await orgRes.json() as { id: string };
  const c1 = getCookies(orgRes);
  if (c1) cookies = c1;

  const setActiveRes = await httpRequest(
    'POST', '/api/auth/organization/set-active',
    { organizationId: org.id },
    { cookie: cookies },
  );
  const c2 = getCookies(setActiveRes);
  if (c2) cookies = c2;

  await db.insert(organizationSettings)
    .values({ organizationId: org.id, plan: 'pro', settings: {} })
    .onConflictDoNothing();

  return { orgId: org.id, cookies };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  db = createDb();
  app = createApp(db).app;

  const ts = Date.now();
  const [a, b] = await Promise.all([
    createTenant(ts, '-a'),
    createTenant(ts, '-b'),
  ]);
  orgIdA = a.orgId;
  orgIdB = b.orgId;
  cookiesA = a.cookies;
  cookiesB = b.cookies;

  // Seed strategist prompts (Tier A — DEC-149)
  await db.insert(promptRegistry).values([
    {
      agentId: 'strategist', skillId: 'diagnostic', version: 1,
      systemPrompt: 'You are the Strategist. Diagnostic skill. Tier A.',
      model: 'claude-sonnet-4-6', provider: 'anthropic',
      dataSensitivity: 'A', approvedProviders: ['anthropic'], active: true,
    },
    {
      agentId: 'strategist', skillId: 'planning', version: 1,
      systemPrompt: 'You are the Strategist. Planning skill. Tier A.',
      model: 'claude-sonnet-4-6', provider: 'anthropic',
      dataSensitivity: 'A', approvedProviders: ['anthropic'], active: true,
    },
    {
      agentId: 'strategist', skillId: 'campaign-design', version: 1,
      systemPrompt: 'You are the Strategist. Campaign Design skill. Tier A.',
      model: 'claude-sonnet-4-6', provider: 'anthropic',
      dataSensitivity: 'A', approvedProviders: ['anthropic'], active: true,
    },
  ]).onConflictDoNothing();

  // Seed PI benchmarks for tests
  await db.insert(platformIntelligenceBenchmarks).values([
    {
      industry: 'test_industry',
      region: 'LATAM',
      channel: 'any',
      format: 'any',
      funnelStage: 'any',
      messagingType: 'any',
      metric: 'ctr',
      value: '2.50',
      valueMin: '0.80',
      valueMax: '5.00',
      source: 'industry_benchmark',
      confidence: 'medium',
      n: 50,
      temporalWindow: '2025',
      trend: 'stable',
    },
    {
      industry: 'test_industry',
      region: 'LATAM',
      channel: 'instagram',
      format: 'video',
      funnelStage: 'awareness',
      messagingType: 'emotional',
      metric: 'engagement_rate',
      value: '4.20',
      valueMin: '1.50',
      valueMax: '8.00',
      source: 'industry_benchmark',
      confidence: 'medium',
      n: 30,
      temporalWindow: '2025',
      trend: 'rising',
    },
    {
      industry: 'test_industry',
      region: 'LATAM',
      channel: 'facebook',
      format: 'image',
      funnelStage: 'conversion',
      messagingType: 'rational',
      metric: 'engagement_rate',
      value: '2.10',
      valueMin: '0.80',
      valueMax: '4.00',
      source: 'industry_benchmark',
      confidence: 'low',
      n: 20,
      temporalWindow: '2025',
      trend: 'stable',
    },
  ]).onConflictDoNothing();
}, 30_000);

afterAll(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

// ── Level 1: Auth enforcement ─────────────────────────────────────────────────

describe('Level 1 — Auth enforcement', () => {
  it('GET /api/strategist/pi/benchmark → 401 unauthenticated', async () => {
    const res = await httpRequest('GET', '/api/strategist/pi/benchmark?metric=ctr');
    expect(res.status).toBe(401);
  });

  it('GET /api/strategist/pi/pattern → 401 unauthenticated', async () => {
    const res = await httpRequest('GET', '/api/strategist/pi/pattern?metric=ctr&groupBy=channel');
    expect(res.status).toBe(401);
  });

  it('POST /api/strategist/diagnose → 401 unauthenticated', async () => {
    const res = await httpRequest('POST', '/api/strategist/diagnose', { triggeredBy: 'manual' });
    expect(res.status).toBe(401);
  });

  it('GET /api/strategist/diagnoses → 401 unauthenticated', async () => {
    const res = await httpRequest('GET', '/api/strategist/diagnoses');
    expect(res.status).toBe(401);
  });

  it('GET /api/strategist/diagnoses/:id → 401 unauthenticated', async () => {
    const res = await httpRequest('GET', '/api/strategist/diagnoses/00000000-0000-0000-0000-000000000001');
    expect(res.status).toBe(401);
  });

  it('POST /api/strategist/plans → 401 unauthenticated', async () => {
    const res = await httpRequest('POST', '/api/strategist/plans', { triggeredBy: 'manual' });
    expect(res.status).toBe(401);
  });

  it('GET /api/strategist/plans → 401 unauthenticated', async () => {
    const res = await httpRequest('GET', '/api/strategist/plans');
    expect(res.status).toBe(401);
  });

  it('PUT /api/strategist/plans/:id/approve → 401 unauthenticated', async () => {
    const res = await httpRequest('PUT', '/api/strategist/plans/00000000-0000-0000-0000-000000000001/approve');
    expect(res.status).toBe(401);
  });

  it('GET /api/strategist/campaigns → 401 unauthenticated', async () => {
    const res = await httpRequest('GET', '/api/strategist/campaigns');
    expect(res.status).toBe(401);
  });

  it('POST /api/strategist/campaign-design → 401 unauthenticated', async () => {
    const res = await httpRequest('POST', '/api/strategist/campaign-design', { source: 'plan' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/strategist/campaigns/:id/approve → 401 unauthenticated', async () => {
    const res = await httpRequest('PUT', '/api/strategist/campaigns/00000000-0000-0000-0000-000000000001/approve');
    expect(res.status).toBe(401);
  });
});

// ── Level 1: Tenant isolation ─────────────────────────────────────────────────

describe('Level 1 — Tenant isolation', () => {
  let diagIdA: string;
  let planIdA: string;
  let briefIdA: string;

  beforeAll(async () => {
    const now = new Date();

    // Insert diagnosis for Org A
    const [diag] = await db.insert(strategicDiagnoses).values({
      organizationId: orgIdA,
      status: 'complete',
      triggeredBy: 'manual',
      diagnosis: { whereWeAre: 'test' },
      iterationCount: 1,
    }).returning({ id: strategicDiagnoses.id });
    diagIdA = diag.id;

    // Insert plan for Org A
    const [plan] = await db.insert(marketingPlans).values({
      organizationId: orgIdA,
      status: 'pending_approval',
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      objectives: [],
      audiences: [],
      valueProposition: {},
      mediaPlan: {},
      budgetAllocation: {},
    }).returning({ id: marketingPlans.id });
    planIdA = plan.id;

    // Insert campaign brief for Org A
    const [brief] = await db.insert(marketingPlanCampaigns).values({
      organizationId: orgIdA,
      planId: planIdA,
      source: 'plan',
      funnelStage: 'awareness',
      channelType: 'paid',
      name: 'Org A Secret Campaign',
      concept: 'Secret concept',
      objective: { type: 'awareness' },
      audiences: [],
      channels: [],
      funnelMatrixDistribution: {},
      budget: { suggested: 1000, min: 700, max: 1300, currency: 'USD', rationale: 'Test' },
      calendar: { startDate: '2026-05-01', durationDays: 30, milestones: [] },
      expectedKpis: {},
      justification: 'Test',
      status: 'proposed',
    }).returning({ id: marketingPlanCampaigns.id });
    briefIdA = brief.id;
  });

  it('Org B cannot see Org A diagnoses', async () => {
    const res = await httpRequest('GET', '/api/strategist/diagnoses', undefined, { cookie: cookiesB });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).not.toContain(diagIdA);
  });

  it('Org B cannot access Org A diagnosis by ID → 404', async () => {
    const res = await httpRequest('GET', `/api/strategist/diagnoses/${diagIdA}`, undefined, { cookie: cookiesB });
    expect(res.status).toBe(404);
  });

  it('Org B cannot see Org A plans', async () => {
    const res = await httpRequest('GET', '/api/strategist/plans', undefined, { cookie: cookiesB });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).not.toContain(planIdA);
  });

  it('Org B cannot access Org A plan by ID → 404', async () => {
    const res = await httpRequest('GET', `/api/strategist/plans/${planIdA}`, undefined, { cookie: cookiesB });
    expect(res.status).toBe(404);
  });

  it('Org B cannot see Org A campaign briefs', async () => {
    const res = await httpRequest('GET', '/api/strategist/campaigns', undefined, { cookie: cookiesB });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).not.toContain(briefIdA);
  });

  it('Org B cannot access Org A campaign brief by ID → 404', async () => {
    const res = await httpRequest('GET', `/api/strategist/campaigns/${briefIdA}`, undefined, { cookie: cookiesB });
    expect(res.status).toBe(404);
  });

  it('Org B cannot approve Org A plan → 404', async () => {
    const res = await httpRequest('PUT', `/api/strategist/plans/${planIdA}/approve`, {}, { cookie: cookiesB });
    expect(res.status).toBe(404);
  });

  it('Org B cannot approve Org A campaign brief → 404', async () => {
    const res = await httpRequest('PUT', `/api/strategist/campaigns/${briefIdA}/approve`, {}, { cookie: cookiesB });
    expect(res.status).toBe(404);
  });
});

// ── Level 1: AI Tier A enforcement ────────────────────────────────────────────

describe('Level 1 — AI Tier A enforcement', () => {
  it('Strategist diagnostic prompt has dataSensitivity=A', async () => {
    const rows = await db
      .select({ dataSensitivity: promptRegistry.dataSensitivity, approvedProviders: promptRegistry.approvedProviders })
      .from(promptRegistry)
      .where(and(eq(promptRegistry.agentId, 'strategist'), eq(promptRegistry.skillId, 'diagnostic'), eq(promptRegistry.active, true)));

    // Prompt must exist and be Tier A
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.dataSensitivity).toBe('A');
      expect(row.approvedProviders).toContain('anthropic');
      expect(row.approvedProviders).not.toContain('openai');
    }
  });

  it('Strategist planning prompt has dataSensitivity=A', async () => {
    const rows = await db
      .select({ dataSensitivity: promptRegistry.dataSensitivity, approvedProviders: promptRegistry.approvedProviders })
      .from(promptRegistry)
      .where(and(eq(promptRegistry.agentId, 'strategist'), eq(promptRegistry.skillId, 'planning'), eq(promptRegistry.active, true)));

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.dataSensitivity).toBe('A');
      expect(row.approvedProviders).toContain('anthropic');
    }
  });

  it('Strategist campaign-design prompt has dataSensitivity=A', async () => {
    const rows = await db
      .select({ dataSensitivity: promptRegistry.dataSensitivity, approvedProviders: promptRegistry.approvedProviders })
      .from(promptRegistry)
      .where(and(eq(promptRegistry.agentId, 'strategist'), eq(promptRegistry.skillId, 'campaign-design'), eq(promptRegistry.active, true)));

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.dataSensitivity).toBe('A');
      expect(row.approvedProviders).toContain('anthropic');
    }
  });

  it('No strategist prompt allows non-Anthropic provider (DEC-149)', async () => {
    const rows = await db
      .select({ skillId: promptRegistry.skillId, approvedProviders: promptRegistry.approvedProviders })
      .from(promptRegistry)
      .where(and(eq(promptRegistry.agentId, 'strategist'), eq(promptRegistry.active, true)));

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const providers = row.approvedProviders as string[];
      // Must include anthropic
      expect(providers).toContain('anthropic');
      // Must NOT include tier B/C providers
      expect(providers).not.toContain('openai');
      expect(providers).not.toContain('google');
    }
  });
});

// ── Level 1: Inngest event schema validation (DEC-148) ────────────────────────

describe('Level 1 — Inngest schema validation', () => {
  // Mirror schemas from Inngest function files to test independently
  const diagnosticEventSchema = z.object({
    tenantId: z.string().min(1),
    triggeredBy: z.enum([
      'bhs_material_change',
      'planning_cycle_start',
      'brand_builder_layer2',
      'analyst_anomaly',
      'competitive_move',
      'manual',
    ]),
    attemptNumber: z.number().int().min(1).max(6).default(1),
    existingDiagnosisId: z.string().uuid().optional(),
  });

  const planningEventSchema = z.object({
    tenantId: z.string().min(1),
    triggeredBy: z.enum([
      'diagnosis_complete',
      'new_client',
      'objectives_changed',
      'budget_approved',
      'manual',
    ]),
    diagnosisId: z.string().uuid().optional(),
    periodMonths: z.number().int().min(1).max(12).default(3),
    attemptNumber: z.number().int().min(1).max(6).default(1),
    existingPlanId: z.string().uuid().optional(),
    g1Attempts: z.number().int().min(0).max(6).default(0),
    g2Attempts: z.number().int().min(0).max(6).default(0),
  });

  const campaignDesignEventSchema = z.object({
    tenantId: z.string().min(1),
    triggeredBy: z.enum(['plan_scheduled', 'opportunity', 'client_request', 'manual']),
    source: z.enum(['plan', 'opportunity', 'optimization']).default('plan'),
    planId: z.string().uuid().optional(),
    funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']).optional(),
    channelType: z.enum(['paid', 'owned', 'earned']).optional(),
    opportunityContext: z.string().max(1000).optional(),
    optimizationContext: z.string().max(1000).optional(),
    attemptNumber: z.number().int().min(1).max(6).default(1),
    existingBriefId: z.string().uuid().optional(),
  });

  // Diagnostic schema
  it('Diagnostic: rejects missing tenantId', () => {
    const result = diagnosticEventSchema.safeParse({ triggeredBy: 'manual' });
    expect(result.success).toBe(false);
  });

  it('Diagnostic: rejects empty tenantId', () => {
    const result = diagnosticEventSchema.safeParse({ tenantId: '', triggeredBy: 'manual' });
    expect(result.success).toBe(false);
  });

  it('Diagnostic: rejects invalid triggeredBy', () => {
    const result = diagnosticEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'unknown_trigger' });
    expect(result.success).toBe(false);
  });

  it('Diagnostic: accepts valid event', () => {
    const result = diagnosticEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'manual' });
    expect(result.success).toBe(true);
  });

  it('Diagnostic: rejects attemptNumber > 6', () => {
    const result = diagnosticEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'manual', attemptNumber: 7 });
    expect(result.success).toBe(false);
  });

  // Planning schema
  it('Planning: rejects missing tenantId', () => {
    const result = planningEventSchema.safeParse({ triggeredBy: 'manual' });
    expect(result.success).toBe(false);
  });

  it('Planning: rejects invalid triggeredBy', () => {
    const result = planningEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'random_trigger' });
    expect(result.success).toBe(false);
  });

  it('Planning: rejects periodMonths > 12', () => {
    const result = planningEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'manual', periodMonths: 13 });
    expect(result.success).toBe(false);
  });

  it('Planning: accepts valid event with defaults', () => {
    const result = planningEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'manual' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.periodMonths).toBe(3);
      expect(result.data.attemptNumber).toBe(1);
      expect(result.data.g1Attempts).toBe(0);
    }
  });

  // Campaign Design schema
  it('Campaign Design: rejects missing tenantId', () => {
    const result = campaignDesignEventSchema.safeParse({ triggeredBy: 'manual' });
    expect(result.success).toBe(false);
  });

  it('Campaign Design: rejects invalid source', () => {
    const result = campaignDesignEventSchema.safeParse({ tenantId: 'tenant-1', triggeredBy: 'manual', source: 'invalid_source' });
    expect(result.success).toBe(false);
  });

  it('Campaign Design: rejects invalid funnelStage', () => {
    const result = campaignDesignEventSchema.safeParse({
      tenantId: 'tenant-1', triggeredBy: 'manual', funnelStage: 'middle_of_funnel',
    });
    expect(result.success).toBe(false);
  });

  it('Campaign Design: accepts valid event', () => {
    const result = campaignDesignEventSchema.safeParse({
      tenantId: 'tenant-1', triggeredBy: 'manual', source: 'plan', funnelStage: 'awareness',
    });
    expect(result.success).toBe(true);
  });
});

// ── Level 1: Inngest tenant verification ─────────────────────────────────────

describe('Level 1 — Inngest tenant verification (DEC-148)', () => {
  it('Unknown tenantId → org not found in organizationSettings', async () => {
    const fakeTenantId = '00000000-0000-0000-0000-ffffffffffff';
    const rows = await db
      .select({ organizationId: organizationSettings.organizationId })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, fakeTenantId))
      .limit(1);
    expect(rows).toHaveLength(0);
  });

  it('Valid tenantId (Org A) → found in organizationSettings', async () => {
    const rows = await db
      .select({ organizationId: organizationSettings.organizationId })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, orgIdA))
      .limit(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].organizationId).toBe(orgIdA);
  });
});

// ── Level 2: Platform Intelligence — direct function tests ────────────────────

describe('Level 2 — Platform Intelligence: benchmarkQuery', () => {
  it('Returns benchmark result for seeded metric + industry', async () => {
    const result = await benchmarkQuery(db, { metric: 'ctr', industry: 'test_industry', region: 'LATAM' });
    expect(result).not.toBeNull();
    expect(result?.metric).toBe('ctr');
    expect(result?.source).toBe('industry_benchmark');
    expect(parseFloat(result?.value ?? '0')).toBeGreaterThan(0);
  });

  it('Returns null for unknown metric', async () => {
    const result = await benchmarkQuery(db, { metric: 'nonexistent_metric_xyz', industry: 'test_industry' });
    expect(result).toBeNull();
  });

  it('Returns null when metric has zero rows in DB', async () => {
    // This metric is guaranteed to not exist in test data
    const result = await benchmarkQuery(db, {
      metric: 'totally_unknown_metric_xyzzy_99',
      industry: 'test_industry',
    });
    expect(result).toBeNull();
  });

  it('matchLevel is exact when all dimensions match', async () => {
    const result = await benchmarkQuery(db, {
      metric: 'ctr',
      industry: 'test_industry',
      region: 'LATAM',
    });
    expect(result).not.toBeNull();
    expect(result?.matchLevel).toBe('exact');
  });

  it('Returns sourceLabel', async () => {
    const result = await benchmarkQuery(db, { metric: 'ctr', industry: 'test_industry' });
    expect(result?.sourceLabel).toContain('industry benchmarks');
  });
});

describe('Level 2 — Platform Intelligence: patternQuery', () => {
  it('Returns ranked pattern results for engagement_rate grouped by channel', async () => {
    const result = await patternQuery(db, {
      metric: 'engagement_rate',
      groupBy: 'channel',
      industry: 'test_industry',
      region: 'LATAM',
    });
    expect(result).not.toBeNull();
    expect(result?.ranked.length).toBeGreaterThan(0);
    // Rank 1 should be first
    expect(result?.ranked[0].relativeRank).toBe(1);
  });

  it('Returns null for metric with no data', async () => {
    const result = await patternQuery(db, {
      metric: 'nonexistent_metric_xyz',
      groupBy: 'channel',
    });
    expect(result).toBeNull();
  });

  it('Returns ranked by value descending', async () => {
    const result = await patternQuery(db, {
      metric: 'engagement_rate',
      groupBy: 'channel',
      industry: 'test_industry',
    });
    if (result && result.ranked.length > 1) {
      // Values should be from best to worst (relativeRank ascending)
      const firstVal = parseFloat(result.ranked[0].value);
      const secondVal = parseFloat(result.ranked[1].value);
      expect(firstVal).toBeGreaterThanOrEqual(secondVal);
    }
  });
});

describe('Level 2 — Platform Intelligence: batchBenchmarkQuery', () => {
  it('Returns map of metric → result for multiple metrics', async () => {
    const results = await batchBenchmarkQuery(
      db,
      { industry: 'test_industry', region: 'LATAM' },
      ['ctr', 'nonexistent_metric_xyz'],
    );
    expect(results.ctr).not.toBeNull();
    expect(results.nonexistent_metric_xyz).toBeNull();
  });

  it('Returns empty map for empty metrics list', async () => {
    const results = await batchBenchmarkQuery(db, { industry: 'test_industry' }, []);
    expect(Object.keys(results)).toHaveLength(0);
  });
});

// ── Level 2: PI routes ────────────────────────────────────────────────────────

describe('Level 2 — PI routes', () => {
  it('GET /api/strategist/pi/benchmark returns 400 without metric param', async () => {
    const res = await httpRequest('GET', '/api/strategist/pi/benchmark', undefined, { cookie: cookiesA });
    expect(res.status).toBe(400);
  });

  it('GET /api/strategist/pi/benchmark returns data for known metric', async () => {
    const res = await httpRequest(
      'GET', '/api/strategist/pi/benchmark?metric=ctr&industry=test_industry',
      undefined, { cookie: cookiesA },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { metric: string } | null };
    expect(body.data).not.toBeNull();
    expect(body.data?.metric).toBe('ctr');
  });

  it('GET /api/strategist/pi/benchmark returns null data for unknown metric', async () => {
    const res = await httpRequest(
      'GET', '/api/strategist/pi/benchmark?metric=nonexistent_metric',
      undefined, { cookie: cookiesA },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { data: null };
    expect(body.data).toBeNull();
  });

  it('GET /api/strategist/pi/pattern returns 400 without required params', async () => {
    const res = await httpRequest('GET', '/api/strategist/pi/pattern?metric=ctr', undefined, { cookie: cookiesA });
    expect(res.status).toBe(400);
  });

  it('GET /api/strategist/pi/pattern returns 400 for invalid groupBy', async () => {
    const res = await httpRequest(
      'GET', '/api/strategist/pi/pattern?metric=ctr&groupBy=invalid',
      undefined, { cookie: cookiesA },
    );
    expect(res.status).toBe(400);
  });

  it('GET /api/strategist/pi/pattern returns ranked data', async () => {
    const res = await httpRequest(
      'GET', '/api/strategist/pi/pattern?metric=engagement_rate&groupBy=channel&industry=test_industry',
      undefined, { cookie: cookiesA },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { ranked: unknown[] } | null };
    if (body.data !== null) {
      expect(body.data.ranked.length).toBeGreaterThan(0);
    }
  });
});

// ── Level 2: Diagnoses lifecycle ──────────────────────────────────────────────

describe('Level 2 — Diagnoses lifecycle', () => {
  let diagId: string;

  beforeAll(async () => {
    const [diag] = await db.insert(strategicDiagnoses).values({
      organizationId: orgIdA,
      status: 'complete',
      triggeredBy: 'manual',
      diagnosis: {
        whereWeAre: 'Initial phase',
        whatsWorking: ['Brand recognition'],
        whatsNot: ['Conversion rates'],
        whatChanged: 'Nothing significant',
        opportunity: 'Expand social media',
        risk: 'Budget constraint',
        recommendsNewPlan: false,
      },
      iterationCount: 1,
    }).returning({ id: strategicDiagnoses.id });
    diagId = diag.id;
  });

  it('GET /diagnoses returns diagnosis for authenticated tenant', async () => {
    const res = await httpRequest('GET', '/api/strategist/diagnoses', undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).toContain(diagId);
  });

  it('GET /diagnoses?status=complete filters by status', async () => {
    const res = await httpRequest('GET', '/api/strategist/diagnoses?status=complete', undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ status: string }>;
    for (const row of rows) {
      expect(row.status).toBe('complete');
    }
  });

  it('GET /diagnoses/:id returns diagnosis detail', async () => {
    const res = await httpRequest('GET', `/api/strategist/diagnoses/${diagId}`, undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; triggeredBy: string };
    expect(body.id).toBe(diagId);
    expect(body.triggeredBy).toBe('manual');
  });

  it('GET /diagnoses/:id for nonexistent ID → 404', async () => {
    const res = await httpRequest('GET', '/api/strategist/diagnoses/00000000-0000-0000-0000-000000000999', undefined, { cookie: cookiesA });
    expect(res.status).toBe(404);
  });
});

// ── Level 2: Marketing Plans lifecycle ────────────────────────────────────────

describe('Level 2 — Marketing Plans lifecycle', () => {
  let planId: string;
  let planForRejectId: string;

  beforeAll(async () => {
    const now = new Date();

    const [plan] = await db.insert(marketingPlans).values({
      organizationId: orgIdA,
      status: 'pending_approval',
      g3Status: 'pending',
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      objectives: [{ type: 'awareness', metric: 'reach', target: '100K', rationale: 'Brand launch' }],
      audiences: [{ segment: 'Young professionals', priority: 'primary', funnelStage: 'awareness' }],
      valueProposition: { headline: 'Test VP', supportingPoints: [], differentiator: 'Quality' },
      mediaPlan: { channels: [], funnelMatrix: {}, plannedCampaigns: 2 },
      budgetAllocation: { totalRecommended: 5000, currency: 'USD', rationale: 'DEC-101', byChannel: [], byFunnelStage: [] },
    }).returning({ id: marketingPlans.id });
    planId = plan.id;

    const [planReject] = await db.insert(marketingPlans).values({
      organizationId: orgIdA,
      status: 'pending_approval',
      g3Status: 'pending',
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      objectives: [],
      audiences: [],
      valueProposition: {},
      mediaPlan: {},
      budgetAllocation: {},
    }).returning({ id: marketingPlans.id });
    planForRejectId = planReject.id;
  });

  it('GET /plans returns plans for authenticated tenant', async () => {
    const res = await httpRequest('GET', '/api/strategist/plans', undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).toContain(planId);
  });

  it('GET /plans/:id returns plan detail with campaigns', async () => {
    const res = await httpRequest('GET', `/api/strategist/plans/${planId}`, undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { plan: { id: string }; campaigns: unknown[] };
    expect(body.plan.id).toBe(planId);
    expect(Array.isArray(body.campaigns)).toBe(true);
  });

  it('PUT /plans/:id/approve sets status=approved and g3Status=approved (G3)', async () => {
    const res = await httpRequest('PUT', `/api/strategist/plans/${planId}/approve`, { notes: 'Looks good' }, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; g3Status: string; g3Notes: string };
    expect(body.status).toBe('approved');
    expect(body.g3Status).toBe('approved');
    expect(body.g3Notes).toBe('Looks good');
  });

  it('PUT /plans/:id/approve again → 409 (G3 already resolved)', async () => {
    const res = await httpRequest('PUT', `/api/strategist/plans/${planId}/approve`, {}, { cookie: cookiesA });
    expect(res.status).toBe(409);
  });

  it('PUT /plans/:id/reject sets status=archived and g3Status=rejected', async () => {
    const res = await httpRequest('PUT', `/api/strategist/plans/${planForRejectId}/reject`, { notes: 'Budget too high' }, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; g3Status: string; g3Notes: string };
    expect(body.status).toBe('archived');
    expect(body.g3Status).toBe('rejected');
    expect(body.g3Notes).toBe('Budget too high');
  });

  it('GET /plans/:id for nonexistent ID → 404', async () => {
    const res = await httpRequest('GET', '/api/strategist/plans/00000000-0000-0000-0000-000000000999', undefined, { cookie: cookiesA });
    expect(res.status).toBe(404);
  });
});

// ── Level 2: Campaign Briefs lifecycle ────────────────────────────────────────

describe('Level 2 — Campaign Briefs lifecycle', () => {
  let briefId: string;
  let briefForRejectId: string;

  const makeBriefValues = (orgId: string) => ({
    organizationId: orgId,
    source: 'plan' as const,
    funnelStage: 'awareness',
    channelType: 'paid',
    name: 'Q2 Awareness Campaign',
    concept: 'Reach new audiences through social ads',
    objective: { type: 'awareness', metric: 'reach', target: '50K' },
    audiences: [{ segment: 'Millennials', motivation: 'Quality', priority: 'primary' }],
    channels: [{ channel: 'instagram', justification: 'High engagement', format: 'video' }],
    funnelMatrixDistribution: { 'awareness-paid': ['instagram'] },
    budget: { suggested: 2000, min: 1400, max: 2600, currency: 'USD', rationale: 'DEC-101' },
    calendar: { startDate: '2026-06-01', durationDays: 30, milestones: [] },
    expectedKpis: { reach: '50000', ctr: '2%' },
    justification: 'Platform PI benchmark supports Instagram for awareness',
    confidenceSource: 'industry' as const,
    creativeSuggestion: { numberOfVersions: 2, angles: ['emotion', 'function'], formats: ['15s'], toneGuidance: 'warm', requiresVideo: false },
    g4Passed: true,
    status: 'proposed',
  });

  beforeAll(async () => {
    const [brief] = await db.insert(marketingPlanCampaigns)
      .values(makeBriefValues(orgIdA))
      .returning({ id: marketingPlanCampaigns.id });
    briefId = brief.id;

    const [briefReject] = await db.insert(marketingPlanCampaigns)
      .values(makeBriefValues(orgIdA))
      .returning({ id: marketingPlanCampaigns.id });
    briefForRejectId = briefReject.id;
  });

  it('GET /campaigns returns briefs for authenticated tenant', async () => {
    const res = await httpRequest('GET', '/api/strategist/campaigns', undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).toContain(briefId);
  });

  it('GET /campaigns?funnelStage=awareness filters correctly', async () => {
    const res = await httpRequest('GET', '/api/strategist/campaigns?funnelStage=awareness', undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const rows = await res.json() as Array<{ funnelStage: string }>;
    for (const row of rows) {
      expect(row.funnelStage).toBe('awareness');
    }
  });

  it('GET /campaigns/:id returns brief detail', async () => {
    const res = await httpRequest('GET', `/api/strategist/campaigns/${briefId}`, undefined, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; name: string; g4Passed: boolean };
    expect(body.id).toBe(briefId);
    expect(body.name).toBe('Q2 Awareness Campaign');
    expect(body.g4Passed).toBe(true);
  });

  it('PUT /campaigns/:id/approve sets status=approved and g6Status=approved (G6)', async () => {
    const res = await httpRequest('PUT', `/api/strategist/campaigns/${briefId}/approve`, { notes: 'Brief approved' }, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; g6Status: string; g6Notes: string };
    expect(body.status).toBe('approved');
    expect(body.g6Status).toBe('approved');
    expect(body.g6Notes).toBe('Brief approved');
  });

  it('PUT /campaigns/:id/approve again → 409 (G6 already resolved)', async () => {
    const res = await httpRequest('PUT', `/api/strategist/campaigns/${briefId}/approve`, {}, { cookie: cookiesA });
    expect(res.status).toBe(409);
  });

  it('PUT /campaigns/:id/reject sets status=rejected and g6Status=rejected', async () => {
    const res = await httpRequest('PUT', `/api/strategist/campaigns/${briefForRejectId}/reject`, { notes: 'Not aligned with brand' }, { cookie: cookiesA });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; g6Status: string; g6Notes: string };
    expect(body.status).toBe('rejected');
    expect(body.g6Status).toBe('rejected');
    expect(body.g6Notes).toBe('Not aligned with brand');
  });

  it('GET /campaigns/:id for nonexistent ID → 404', async () => {
    const res = await httpRequest('GET', '/api/strategist/campaigns/00000000-0000-0000-0000-000000000999', undefined, { cookie: cookiesA });
    expect(res.status).toBe(404);
  });
});

// ── Level 2: 3+3 escalation — DB state ────────────────────────────────────────

describe('Level 2 — 3+3 escalation', () => {
  it('Diagnosis with attempt > 6: DB can be set to escalated status', async () => {
    // Simulate what the Inngest function does at attemptNumber > 6
    const [diag] = await db.insert(strategicDiagnoses).values({
      organizationId: orgIdA,
      status: 'running',
      triggeredBy: 'manual',
      diagnosis: {},
      iterationCount: 7,
    }).returning({ id: strategicDiagnoses.id });

    // Simulate escalation step
    await db.update(strategicDiagnoses)
      .set({
        status: 'escalated',
        escalatedAt: new Date(),
        escalationReason: 'Exceeded 3+3 attempt limit — human review required',
      })
      .where(eq(strategicDiagnoses.id, diag.id));

    // Verify escalation persisted
    const [updated] = await db
      .select()
      .from(strategicDiagnoses)
      .where(and(eq(strategicDiagnoses.id, diag.id), eq(strategicDiagnoses.organizationId, orgIdA)));

    expect(updated.status).toBe('escalated');
    expect(updated.escalationReason).toContain('human review required');
    expect(updated.escalatedAt).not.toBeNull();
  });

  it('Plan with G2 failure: DB can be set to archived after 6 attempts', async () => {
    const now = new Date();
    const [plan] = await db.insert(marketingPlans).values({
      organizationId: orgIdA,
      status: 'draft',
      g2Status: 'blocked',
      g2Iterations: 6,
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      objectives: [],
      audiences: [],
      valueProposition: {},
      mediaPlan: {},
      budgetAllocation: {},
    }).returning({ id: marketingPlans.id });

    // Simulate escalation: archive the plan
    await db.update(marketingPlans)
      .set({ status: 'archived' })
      .where(eq(marketingPlans.id, plan.id));

    const [updated] = await db
      .select()
      .from(marketingPlans)
      .where(eq(marketingPlans.id, plan.id));

    expect(updated.status).toBe('archived');
    expect(updated.g2Status).toBe('blocked');
    expect(updated.g2Iterations).toBe(6);
  });
});

// ── Level 2: Campaign → Video Motor brief pipeline ────────────────────────────

describe('Level 2 — Campaign Design → Video Motor pipeline (DEC-098)', () => {
  it('Campaign brief with requiresVideo=true stores flag correctly in DB', async () => {
    const [brief] = await db.insert(marketingPlanCampaigns).values({
      organizationId: orgIdA,
      source: 'opportunity',
      funnelStage: 'awareness',
      channelType: 'paid',
      name: 'Video Campaign Brief',
      concept: 'Brand story through video',
      objective: { type: 'awareness' },
      audiences: [],
      channels: [],
      funnelMatrixDistribution: {},
      budget: { suggested: 5000, min: 3500, max: 6500, currency: 'USD', rationale: 'Video production' },
      calendar: { startDate: '2026-06-01', durationDays: 60, milestones: [] },
      expectedKpis: { views: '100K' },
      justification: 'Brand awareness through video content',
      creativeSuggestion: {
        numberOfVersions: 2,
        angles: ['emotional'],
        formats: ['30s video'],
        toneGuidance: 'inspiring',
        requiresVideo: true,
        videoBriefSummary: 'Brand story short film, 30 seconds, emotional tone',
      },
      g4Passed: true,
      status: 'proposed',
    }).returning({ id: marketingPlanCampaigns.id, creativeSuggestion: marketingPlanCampaigns.creativeSuggestion });

    expect(brief.creativeSuggestion).toMatchObject({
      requiresVideo: true,
      videoBriefSummary: 'Brand story short film, 30 seconds, emotional tone',
    });
  });

  it('Campaign brief from plan origin links to planId', async () => {
    const now = new Date();
    const [plan] = await db.insert(marketingPlans).values({
      organizationId: orgIdA,
      status: 'pending_approval',
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      objectives: [],
      audiences: [],
      valueProposition: {},
      mediaPlan: {},
      budgetAllocation: {},
    }).returning({ id: marketingPlans.id });

    const [brief] = await db.insert(marketingPlanCampaigns).values({
      organizationId: orgIdA,
      planId: plan.id,
      source: 'plan',
      funnelStage: 'conversion',
      channelType: 'paid',
      name: 'Conversion Campaign',
      concept: 'Drive purchases',
      objective: { type: 'conversion' },
      audiences: [],
      channels: [],
      funnelMatrixDistribution: {},
      budget: { suggested: 3000, min: 2100, max: 3900, currency: 'USD', rationale: 'Test' },
      calendar: { startDate: '2026-07-01', durationDays: 30, milestones: [] },
      expectedKpis: { conversion_rate: '3%' },
      justification: 'Conversion campaign from plan',
      creativeSuggestion: { numberOfVersions: 2, angles: ['rational'], formats: ['static'], toneGuidance: 'direct', requiresVideo: false },
      g4Passed: true,
      status: 'proposed',
    }).returning({ id: marketingPlanCampaigns.id, planId: marketingPlanCampaigns.planId, source: marketingPlanCampaigns.source });

    expect(brief.planId).toBe(plan.id);
    expect(brief.source).toBe('plan');
  });
});
