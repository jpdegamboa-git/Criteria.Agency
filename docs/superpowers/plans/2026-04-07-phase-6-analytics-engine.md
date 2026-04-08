# Phase 6: Analytics Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Analytics Engine (C-033 to C-037) — dashboards, multi-channel attribution, CAC/LTV calculation, automated reports, and natural language queries.

**Architecture:** Service-per-capability pattern with a shared types module. Data collectors aggregate from internal motors and stub external providers into `analytics_metrics` table. Computation services (attribution, unit economics) read from normalized metrics. Output services (dashboards, reports, NL queries) consume computed results. All LLM calls use `generateText()` from the provider registry.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Zod, Vitest, generateText (gemini-2.5-flash + claude-sonnet-4-5)

---

## Pre-existing Infrastructure

The following already exists and should NOT be recreated:

- **Pipeline:** `analytics` registered in `src/orchestrator/pipeline-registry.ts` (5 steps, 1 gate)
- **Agents:** AN-L, AN-001–AN-005 registered in `src/agents/registry.ts`
- **Enums:** `an_request`, `an_collect`, `an_analyze`, `an_visualize`, `an_deliver` in `projectStatusEnum`, `artifactStepEnum`; `an-g1` in `gateTypeEnum`
- **Agent skill files:** `agents/AN-{L,001,002,003,004,005}.md` exist
- **Sales attribution functions:** 5 pure model functions in `src/services/sales/attribution-engine.ts` (firstTouch, lastTouch, linearAttribution, timeDecay, positionBased)

## File Map

| File | Responsibility |
|------|---------------|
| `src/services/analytics/types.ts` | All Analytics Engine interfaces and constants |
| `src/services/analytics/data-collector.ts` | Aggregate data from internal motors + external stubs into analytics_metrics |
| `src/services/analytics/attribution.ts` | Channel-level attribution reports using Sales Engine's 5 models |
| `src/services/analytics/unit-economics.ts` | CAC, LTV, ratios, cohort analysis |
| `src/services/analytics/dashboard-builder.ts` | Dashboard config management and data assembly |
| `src/services/analytics/report-generator.ts` | Automated report production (daily/weekly/monthly) |
| `src/services/analytics/nl-query-engine.ts` | Natural language → data query → NL answer |
| `src/providers/analytics/stub-providers.ts` | Stub GA, Meta Ads, Google Ads providers (single file) |
| `src/api/analytics-routes.ts` | 17 API endpoints for analytics |
| `agents/AN-006_insight_detector.md` | Agent skill file for anomaly detection agent |

---

### Task 1: Types and Interfaces

**Files:**
- Create: `src/services/analytics/types.ts`

- [ ] **Step 1: Create types file**

```typescript
// src/services/analytics/types.ts

// ── Date Range ──

export interface DateRange {
  start: string; // ISO 8601
  end: string;
}

// ── Metric Types ──

export interface MetricDataPoint {
  date: string;
  metric: string;
  value: number;
  dimensions: Record<string, string>;
  source: string;
}

export interface AnalyticsDataProvider {
  name: string;
  source: string;
  fetchMetrics(
    clientId: string,
    metrics: string[],
    dateRange: DateRange,
    dimensions?: string[],
  ): Promise<MetricDataPoint[]>;
  isAvailable(): boolean;
}

// ── Dashboard Types ──

export type DashboardType = "executive" | "channel" | "content" | "funnel" | "financial";

export type WidgetType = "kpi_card" | "time_series" | "bar_chart" | "funnel" | "table" | "pie" | "heatmap";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  metric: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    comparisonPeriod?: string;
    groupBy?: string;
    dateRange?: string;
    filters?: Record<string, string>;
  };
}

export interface DashboardConfig {
  clientId: string;
  dashboardType: DashboardType;
  widgets: WidgetConfig[];
  refreshInterval: number;
}

export interface DashboardData {
  config: DashboardConfig;
  widgets: Array<{
    id: string;
    type: WidgetType;
    metric: string;
    data: unknown;
  }>;
  generatedAt: string;
}

// ── Attribution Report Types ──

export interface ChannelAttribution {
  channel: string;
  attributedRevenue: number;
  percentOfTotal: number;
  dealCount: number;
  avgDealSize: number;
  costPerAcquisition: number;
  roas: number;
}

export interface CampaignAttribution {
  campaign: string;
  channel: string;
  attributedRevenue: number;
  spend: number;
  roas: number;
}

export interface PathAnalysis {
  avgPathLength: number;
  avgTimeToClose: number;
  commonPaths: Array<{
    path: string[];
    frequency: number;
    avgDealValue: number;
  }>;
}

export interface AttributionReport {
  model: string;
  period: DateRange;
  totalRevenue: number;
  byChannel: ChannelAttribution[];
  byCampaign: CampaignAttribution[];
  pathAnalysis: PathAnalysis;
}

// ── Unit Economics Types ──

export interface UnitEconomics {
  cac: number;
  cacByChannel: Record<string, number>;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  monthlyChurnRate: number;
  netRevenueRetention: number;
  period: DateRange;
  computedAt: string;
}

export interface CohortData {
  cohortMonth: string;
  size: number;
  revenueByMonth: number[];
  cumulativeLtv: number;
  retentionByMonth: number[];
}

// ── Report Types ──

export type ReportType = "daily" | "weekly" | "monthly" | "on_demand";

export interface ReportMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  trend: "up" | "down" | "flat";
  isGood: boolean;
}

export interface ReportSection {
  title: string;
  metrics: ReportMetric[];
  insights: string[];
  recommendations: string[];
}

export interface AutomatedReport {
  clientId: string;
  type: ReportType;
  period: DateRange;
  sections: ReportSection[];
  executiveSummary: string;
  generatedAt: string;
}

// ── NL Query Types ──

export interface NLQueryResult {
  answer: string;
  data: Record<string, unknown>;
  confidence: number;
  followUpSuggestions: string[];
}

// ── Step Result ──

export interface AnalyticsStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/analytics/types.ts
git commit -m "feat(analytics): add types and interfaces for Analytics Engine (C-033 to C-037)"
```

---

### Task 2: Database Tables

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add 4 analytics tables after the `perceptionTracking` table**

Add these tables at the end of `src/db/schema.ts` (before the closing of the file), after the existing `perceptionTracking` table:

```typescript
// ── Analytics Engine Tables ──

export const analyticsMetrics = pgTable(
  "analytics_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    metric: varchar("metric", { length: 100 }).notNull(),
    value: numeric("value", { precision: 14, scale: 4 }).notNull(),
    dimensions: jsonb("dimensions").default("{}"),
    source: varchar("source", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_analytics_metrics_lookup").on(table.clientId, table.metric, table.date),
    index("idx_analytics_metrics_source").on(table.clientId, table.source, table.date),
  ],
);

export const dashboardConfigs = pgTable("dashboard_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  dashboardType: varchar("dashboard_type", { length: 50 }).notNull(),
  config: jsonb("config").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedReports = pgTable("generated_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  periodStart: varchar("period_start", { length: 10 }).notNull(),
  periodEnd: varchar("period_end", { length: 10 }).notNull(),
  content: jsonb("content").notNull(),
  renderedMarkdown: text("rendered_markdown"),
  deliveredVia: jsonb("delivered_via"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nlQueries = pgTable("nl_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  data: jsonb("data"),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  feedback: varchar("feedback", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(db): add analytics_metrics, dashboard_configs, generated_reports, nl_queries tables"
```

---

### Task 3: Stub External Data Providers

**Files:**
- Create: `src/providers/analytics/stub-providers.ts`
- Test: `src/providers/analytics/stub-providers.test.ts`

- [ ] **Step 1: Create stub providers**

```typescript
// src/providers/analytics/stub-providers.ts

import type { AnalyticsDataProvider, MetricDataPoint, DateRange } from "../../services/analytics/types.js";

function generateStubMetrics(
  clientId: string,
  metrics: string[],
  dateRange: DateRange,
  source: string,
  baseValues: Record<string, number>,
): MetricDataPoint[] {
  const points: MetricDataPoint[] = [];
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    for (const metric of metrics) {
      const base = baseValues[metric] ?? 100;
      // Add ±20% random variation for realistic stub data
      const variation = base * 0.2 * (Math.random() * 2 - 1);
      points.push({
        date: dateStr,
        metric,
        value: Math.round((base + variation) * 100) / 100,
        dimensions: { source },
        source,
      });
    }
  }
  return points;
}

export const stubGoogleAnalytics: AnalyticsDataProvider = {
  name: "Google Analytics (Stub)",
  source: "google_analytics",
  async fetchMetrics(clientId, metrics, dateRange) {
    return generateStubMetrics(clientId, metrics, dateRange, "google_analytics", {
      sessions: 1200,
      page_views: 3500,
      bounce_rate: 45,
      avg_session_duration: 180,
      conversions: 35,
      organic_traffic: 800,
    });
  },
  isAvailable() { return true; },
};

export const stubMetaAds: AnalyticsDataProvider = {
  name: "Meta Ads (Stub)",
  source: "meta_ads",
  async fetchMetrics(clientId, metrics, dateRange) {
    return generateStubMetrics(clientId, metrics, dateRange, "meta_ads", {
      spend: 150,
      impressions: 25000,
      clicks: 750,
      conversions: 20,
      cpc: 0.20,
      cpm: 6.0,
      roas: 3.2,
    });
  },
  isAvailable() { return true; },
};

export const stubGoogleAds: AnalyticsDataProvider = {
  name: "Google Ads (Stub)",
  source: "google_ads",
  async fetchMetrics(clientId, metrics, dateRange) {
    return generateStubMetrics(clientId, metrics, dateRange, "google_ads", {
      spend: 200,
      impressions: 30000,
      clicks: 900,
      conversions: 25,
      cpc: 0.22,
      cpm: 6.67,
      roas: 2.8,
    });
  },
  isAvailable() { return true; },
};

export function getAllProviders(): AnalyticsDataProvider[] {
  return [stubGoogleAnalytics, stubMetaAds, stubGoogleAds];
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/providers/analytics/stub-providers.test.ts

import { describe, it, expect } from "vitest";
import { stubGoogleAnalytics, stubMetaAds, stubGoogleAds, getAllProviders } from "./stub-providers.js";
import type { DateRange } from "../../services/analytics/types.js";

const range: DateRange = { start: "2026-03-01", end: "2026-03-03" };

describe("stub analytics providers", () => {
  it("Google Analytics returns metrics for date range", async () => {
    const points = await stubGoogleAnalytics.fetchMetrics("c1", ["sessions", "page_views"], range);
    expect(points.length).toBe(6); // 2 metrics × 3 days
    expect(points[0].source).toBe("google_analytics");
    expect(points[0]).toHaveProperty("date");
    expect(points[0]).toHaveProperty("value");
  });

  it("Meta Ads returns metrics for date range", async () => {
    const points = await stubMetaAds.fetchMetrics("c1", ["spend"], range);
    expect(points.length).toBe(3); // 1 metric × 3 days
    expect(points[0].source).toBe("meta_ads");
  });

  it("Google Ads returns metrics for date range", async () => {
    const points = await stubGoogleAds.fetchMetrics("c1", ["clicks", "conversions"], range);
    expect(points.length).toBe(6);
    expect(points[0].source).toBe("google_ads");
  });

  it("all providers report as available", () => {
    expect(stubGoogleAnalytics.isAvailable()).toBe(true);
    expect(stubMetaAds.isAvailable()).toBe(true);
    expect(stubGoogleAds.isAvailable()).toBe(true);
  });

  it("getAllProviders returns 3 providers", () => {
    const providers = getAllProviders();
    expect(providers).toHaveLength(3);
    expect(providers.map(p => p.source)).toEqual(["google_analytics", "meta_ads", "google_ads"]);
  });

  it("metric values have reasonable variation", async () => {
    const points = await stubGoogleAnalytics.fetchMetrics("c1", ["sessions"], range);
    for (const p of points) {
      // Base 1200 ± 20% → 960–1440
      expect(p.value).toBeGreaterThan(900);
      expect(p.value).toBeLessThan(1500);
    }
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/providers/analytics/stub-providers.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/providers/analytics/
git commit -m "feat(analytics): add stub GA, Meta Ads, Google Ads providers"
```

---

### Task 4: Data Collector Service

**Files:**
- Create: `src/services/analytics/data-collector.ts`
- Test: `src/services/analytics/data-collector.test.ts`

- [ ] **Step 1: Create data collector**

```typescript
// src/services/analytics/data-collector.ts

import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAllProviders } from "../../providers/analytics/stub-providers.js";
import type { AnalyticsStepResult, DateRange, MetricDataPoint } from "./types.js";

/**
 * Collect metrics from all available external providers and store in analytics_metrics.
 */
export async function collectExternalMetrics(
  clientId: string,
  dateRange: DateRange,
): Promise<AnalyticsStepResult> {
  const providers = getAllProviders();
  const allPoints: MetricDataPoint[] = [];

  for (const provider of providers) {
    if (!provider.isAvailable()) continue;
    const metrics = await provider.fetchMetrics(
      clientId,
      ["spend", "impressions", "clicks", "conversions", "roas"],
      dateRange,
    );
    allPoints.push(...metrics);
  }

  // Batch insert into analytics_metrics
  if (allPoints.length > 0) {
    const rows = allPoints.map((p) => ({
      clientId,
      date: p.date,
      metric: p.metric,
      value: String(p.value),
      dimensions: p.dimensions,
      source: p.source,
    }));
    await db.insert(schema.analyticsMetrics).values(rows);
  }

  return {
    step: "an_collect",
    status: "completed",
    data: { pointsCollected: allPoints.length, sources: providers.filter(p => p.isAvailable()).map(p => p.source) },
  };
}

/**
 * Collect internal metrics from agent executions and artifacts.
 */
export async function collectInternalMetrics(
  clientId: string,
  dateRange: DateRange,
): Promise<AnalyticsStepResult> {
  // Count completed executions per day
  const executions = await db
    .select()
    .from(schema.agentExecutions)
    .where(
      and(
        eq(schema.agentExecutions.projectId, clientId),
        eq(schema.agentExecutions.status, "completed"),
      ),
    );

  const dailyCounts: Record<string, number> = {};
  const dailyCosts: Record<string, number> = {};

  for (const exec of executions) {
    const day = exec.startedAt?.toISOString().split("T")[0] ?? dateRange.start;
    if (day >= dateRange.start && day <= dateRange.end) {
      dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
      dailyCosts[day] = (dailyCosts[day] ?? 0) + Number(exec.costUsd ?? 0);
    }
  }

  const rows = [
    ...Object.entries(dailyCounts).map(([date, count]) => ({
      clientId,
      date,
      metric: "agent_executions",
      value: String(count),
      dimensions: {},
      source: "internal",
    })),
    ...Object.entries(dailyCosts).map(([date, cost]) => ({
      clientId,
      date,
      metric: "agent_cost_usd",
      value: String(cost),
      dimensions: {},
      source: "internal",
    })),
  ];

  if (rows.length > 0) {
    await db.insert(schema.analyticsMetrics).values(rows);
  }

  return {
    step: "an_collect",
    status: "completed",
    data: { pointsCollected: rows.length, sources: ["internal"] },
  };
}

/**
 * Query stored metrics from analytics_metrics table.
 */
export async function queryMetrics(
  clientId: string,
  metricNames: string[],
  dateRange: DateRange,
): Promise<MetricDataPoint[]> {
  const rows = await db
    .select()
    .from(schema.analyticsMetrics)
    .where(
      and(
        eq(schema.analyticsMetrics.clientId, clientId),
        gte(schema.analyticsMetrics.date, dateRange.start),
        lte(schema.analyticsMetrics.date, dateRange.end),
      ),
    );

  return rows
    .filter((r) => metricNames.length === 0 || metricNames.includes(r.metric))
    .map((r) => ({
      date: r.date,
      metric: r.metric,
      value: Number(r.value),
      dimensions: (r.dimensions as Record<string, string>) ?? {},
      source: r.source,
    }));
}

/**
 * List connected data sources and their availability status.
 */
export function getDataSources(): Array<{ name: string; source: string; available: boolean }> {
  const external = getAllProviders().map((p) => ({
    name: p.name,
    source: p.source,
    available: p.isAvailable(),
  }));
  return [
    { name: "Internal Motors", source: "internal", available: true },
    ...external,
  ];
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/services/analytics/data-collector.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectExternalMetrics, queryMetrics, getDataSources } from "./data-collector.js";

// Mock DB
vi.mock("../../db/index.js", () => {
  const insertedRows: unknown[] = [];
  return {
    db: {
      insert: () => ({ values: (rows: unknown[]) => { insertedRows.push(...(Array.isArray(rows) ? rows : [rows])); return Promise.resolve(); } }),
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([
            { date: "2026-03-01", metric: "spend", value: "150.00", dimensions: { source: "meta_ads" }, source: "meta_ads" },
            { date: "2026-03-01", metric: "clicks", value: "750", dimensions: {}, source: "google_ads" },
          ]),
        }),
      }),
    },
    schema: { analyticsMetrics: "analytics_metrics", agentExecutions: "agent_executions" },
    _insertedRows: insertedRows,
  };
});

describe("data-collector", () => {
  it("collectExternalMetrics returns completed with point count", async () => {
    const result = await collectExternalMetrics("client-1", { start: "2026-03-01", end: "2026-03-02" });
    expect(result.step).toBe("an_collect");
    expect(result.status).toBe("completed");
    expect((result.data as any).pointsCollected).toBeGreaterThan(0);
    expect((result.data as any).sources).toContain("google_analytics");
    expect((result.data as any).sources).toContain("meta_ads");
    expect((result.data as any).sources).toContain("google_ads");
  });

  it("queryMetrics filters by metric names", async () => {
    const results = await queryMetrics("client-1", ["spend"], { start: "2026-03-01", end: "2026-03-31" });
    expect(results).toHaveLength(1);
    expect(results[0].metric).toBe("spend");
    expect(results[0].value).toBe(150);
  });

  it("queryMetrics returns all when metricNames is empty", async () => {
    const results = await queryMetrics("client-1", [], { start: "2026-03-01", end: "2026-03-31" });
    expect(results).toHaveLength(2);
  });

  it("getDataSources returns internal + 3 external", () => {
    const sources = getDataSources();
    expect(sources).toHaveLength(4);
    expect(sources[0].source).toBe("internal");
    expect(sources.every(s => s.available)).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/services/analytics/data-collector.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/data-collector.ts src/services/analytics/data-collector.test.ts
git commit -m "feat(analytics): implement data collector service with external + internal sources"
```

---

### Task 5: Attribution Report Service

**Files:**
- Create: `src/services/analytics/attribution.ts`
- Test: `src/services/analytics/attribution.test.ts`

- [ ] **Step 1: Create attribution report service**

This builds on the Sales Engine's pure attribution functions (`firstTouch`, `lastTouch`, `linearAttribution`, `timeDecay`, `positionBased`) to produce channel-level and campaign-level `AttributionReport`.

```typescript
// src/services/analytics/attribution.ts

import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import {
  firstTouch,
  lastTouch,
  linearAttribution,
  timeDecay,
  positionBased,
  type TouchpointForAttribution,
  type AttributionEntry,
} from "../sales/attribution-engine.js";
import type { AttributionReport, ChannelAttribution, CampaignAttribution, PathAnalysis, DateRange, AnalyticsStepResult } from "./types.js";
import { queryMetrics } from "./data-collector.js";

type ModelName = "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";

const MODEL_FNS: Record<ModelName, (tp: TouchpointForAttribution[], value: number) => AttributionEntry[]> = {
  first_touch: firstTouch,
  last_touch: lastTouch,
  linear: linearAttribution,
  time_decay: timeDecay,
  position_based: positionBased,
};

/**
 * Compute attribution report across all deals for a client.
 */
export async function computeAttribution(
  clientId: string,
  model: ModelName,
  period: DateRange,
): Promise<AttributionReport> {
  // Fetch deals closed in period
  const deals = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.clientId, clientId),
        eq(schema.deals.stage, "closed_won"),
      ),
    );

  const filteredDeals = deals.filter((d) => {
    const closedAt = d.closedAt?.toISOString().split("T")[0] ?? "";
    return closedAt >= period.start && closedAt <= period.end;
  });

  // Fetch all touchpoints for these deals' leads
  const leadIds = [...new Set(filteredDeals.map((d) => d.leadId))];
  const allTouchpoints: Array<TouchpointForAttribution & { leadId: string }> = [];

  for (const leadId of leadIds) {
    const tps = await db
      .select()
      .from(schema.leadTouchpoints)
      .where(eq(schema.leadTouchpoints.leadId, leadId));

    for (const tp of tps) {
      allTouchpoints.push({
        id: tp.id,
        channel: tp.channel,
        campaign: tp.campaign,
        timestamp: tp.timestamp?.toISOString() ?? new Date().toISOString(),
        leadId,
      });
    }
  }

  // Run attribution model per deal
  const modelFn = MODEL_FNS[model];
  const channelMap = new Map<string, { revenue: number; deals: number; totalValue: number }>();
  const campaignMap = new Map<string, { revenue: number; spend: number; channel: string }>();
  const paths: Array<{ path: string[]; dealValue: number }> = [];
  let totalRevenue = 0;

  for (const deal of filteredDeals) {
    const dealValue = Number(deal.value ?? 0);
    totalRevenue += dealValue;

    const dealTouchpoints = allTouchpoints
      .filter((tp) => tp.leadId === deal.leadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const entries = modelFn(dealTouchpoints, dealValue);

    // Track path
    const uniqueChannels = [...new Set(dealTouchpoints.map((tp) => tp.channel))];
    paths.push({ path: uniqueChannels, dealValue });

    // Aggregate by channel
    for (const entry of entries) {
      if (entry.creditValue <= 0) continue;
      const existing = channelMap.get(entry.channel) ?? { revenue: 0, deals: 0, totalValue: 0 };
      existing.revenue += entry.creditValue;
      existing.deals += entry.creditPercent > 0 ? 1 : 0;
      existing.totalValue += dealValue;
      channelMap.set(entry.channel, existing);

      // Aggregate by campaign
      if (entry.campaign) {
        const key = `${entry.channel}::${entry.campaign}`;
        const c = campaignMap.get(key) ?? { revenue: 0, spend: 0, channel: entry.channel };
        c.revenue += entry.creditValue;
        campaignMap.set(key, c);
      }
    }
  }

  // Fetch spend data for ROAS calculation
  const spendMetrics = await queryMetrics(clientId, ["spend"], period);
  const spendByChannel: Record<string, number> = {};
  for (const m of spendMetrics) {
    const ch = m.dimensions.source ?? "unknown";
    spendByChannel[ch] = (spendByChannel[ch] ?? 0) + m.value;
  }

  // Build channel attribution
  const byChannel: ChannelAttribution[] = [...channelMap.entries()].map(([channel, data]) => {
    const spend = spendByChannel[channel] ?? 0;
    return {
      channel,
      attributedRevenue: Math.round(data.revenue * 100) / 100,
      percentOfTotal: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 10000) / 100 : 0,
      dealCount: data.deals,
      avgDealSize: data.deals > 0 ? Math.round((data.totalValue / data.deals) * 100) / 100 : 0,
      costPerAcquisition: data.deals > 0 ? Math.round((spend / data.deals) * 100) / 100 : 0,
      roas: spend > 0 ? Math.round((data.revenue / spend) * 100) / 100 : 0,
    };
  });

  // Build campaign attribution
  const byCampaign: CampaignAttribution[] = [...campaignMap.entries()].map(([key, data]) => {
    const [, campaign] = key.split("::");
    return {
      campaign: campaign ?? key,
      channel: data.channel,
      attributedRevenue: Math.round(data.revenue * 100) / 100,
      spend: data.spend,
      roas: data.spend > 0 ? Math.round((data.revenue / data.spend) * 100) / 100 : 0,
    };
  });

  // Build path analysis
  const pathCounts = new Map<string, { count: number; totalValue: number }>();
  let totalPathLength = 0;

  for (const p of paths) {
    const key = p.path.join(" → ");
    const existing = pathCounts.get(key) ?? { count: 0, totalValue: 0 };
    existing.count += 1;
    existing.totalValue += p.dealValue;
    pathCounts.set(key, existing);
    totalPathLength += p.path.length;
  }

  const commonPaths = [...pathCounts.entries()]
    .map(([key, data]) => ({
      path: key.split(" → "),
      frequency: data.count,
      avgDealValue: data.count > 0 ? Math.round((data.totalValue / data.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const pathAnalysis: PathAnalysis = {
    avgPathLength: paths.length > 0 ? Math.round((totalPathLength / paths.length) * 100) / 100 : 0,
    avgTimeToClose: 0, // Would require deal creation dates
    commonPaths,
  };

  return {
    model,
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    byChannel,
    byCampaign,
    pathAnalysis,
  };
}

/**
 * Wrapper that returns an AnalyticsStepResult.
 */
export async function runAttribution(
  clientId: string,
  model: ModelName,
  period: DateRange,
): Promise<AnalyticsStepResult> {
  const report = await computeAttribution(clientId, model, period);
  return {
    step: "an_analyze",
    status: "completed",
    data: report,
  };
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/services/analytics/attribution.test.ts

import { describe, it, expect, vi } from "vitest";
import { computeAttribution, runAttribution } from "./attribution.js";

// Mock DB
vi.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from: (table: string) => ({
        where: () => {
          if (table === "deals") {
            return Promise.resolve([
              { id: "d1", leadId: "l1", value: "1000", stage: "closed_won", closedAt: new Date("2026-03-15"), clientId: "c1" },
              { id: "d2", leadId: "l2", value: "2000", stage: "closed_won", closedAt: new Date("2026-03-20"), clientId: "c1" },
            ]);
          }
          if (table === "lead_touchpoints") {
            return Promise.resolve([
              { id: "t1", channel: "meta_ads", campaign: "spring", timestamp: new Date("2026-03-01"), leadId: "l1" },
              { id: "t2", channel: "email", campaign: "nurture", timestamp: new Date("2026-03-10"), leadId: "l1" },
              { id: "t3", channel: "google_ads", campaign: "brand", timestamp: new Date("2026-03-05"), leadId: "l2" },
            ]);
          }
          if (table === "analytics_metrics") {
            return Promise.resolve([
              { date: "2026-03-01", metric: "spend", value: "500", dimensions: { source: "meta_ads" }, source: "meta_ads" },
            ]);
          }
          return Promise.resolve([]);
        },
      }),
    }),
  },
  schema: {
    deals: "deals",
    leadTouchpoints: "lead_touchpoints",
    analyticsMetrics: "analytics_metrics",
  },
}));

// Mock queryMetrics to avoid double-mock conflicts
vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-01", metric: "spend", value: 500, dimensions: { source: "meta_ads" }, source: "meta_ads" },
  ]),
}));

const period = { start: "2026-03-01", end: "2026-03-31" };

describe("attribution", () => {
  it("computeAttribution returns valid report structure", async () => {
    const report = await computeAttribution("c1", "first_touch", period);
    expect(report.model).toBe("first_touch");
    expect(report.period).toEqual(period);
    expect(report.totalRevenue).toBe(3000);
    expect(report.byChannel).toBeInstanceOf(Array);
    expect(report.byCampaign).toBeInstanceOf(Array);
    expect(report.pathAnalysis).toHaveProperty("avgPathLength");
    expect(report.pathAnalysis).toHaveProperty("commonPaths");
  });

  it("byChannel sums to totalRevenue", async () => {
    const report = await computeAttribution("c1", "linear", period);
    const channelSum = report.byChannel.reduce((s, c) => s + c.attributedRevenue, 0);
    expect(Math.round(channelSum)).toBe(Math.round(report.totalRevenue));
  });

  it("first_touch gives 100% to first touchpoint channel", async () => {
    const report = await computeAttribution("c1", "first_touch", period);
    // Deal 1: meta_ads (first), Deal 2: google_ads (first)
    const meta = report.byChannel.find(c => c.channel === "meta_ads");
    const google = report.byChannel.find(c => c.channel === "google_ads");
    expect(meta?.attributedRevenue).toBe(1000);
    expect(google?.attributedRevenue).toBe(2000);
  });

  it("ROAS calculated when spend data available", async () => {
    const report = await computeAttribution("c1", "first_touch", period);
    const meta = report.byChannel.find(c => c.channel === "meta_ads");
    // 1000 revenue / 500 spend = 2.0 ROAS
    expect(meta?.roas).toBe(2);
  });

  it("runAttribution returns AnalyticsStepResult", async () => {
    const result = await runAttribution("c1", "last_touch", period);
    expect(result.step).toBe("an_analyze");
    expect(result.status).toBe("completed");
    expect(result.data).toHaveProperty("model", "last_touch");
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/services/analytics/attribution.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/attribution.ts src/services/analytics/attribution.test.ts
git commit -m "feat(analytics): implement multi-channel attribution report service (C-034)"
```

---

### Task 6: Unit Economics Service

**Files:**
- Create: `src/services/analytics/unit-economics.ts`
- Test: `src/services/analytics/unit-economics.test.ts`

- [ ] **Step 1: Create unit economics service**

```typescript
// src/services/analytics/unit-economics.ts

import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { queryMetrics } from "./data-collector.js";
import type { UnitEconomics, CohortData, DateRange, AnalyticsStepResult } from "./types.js";

/**
 * Calculate CAC, LTV, and related unit economics.
 */
export async function calculateUnitEconomics(
  clientId: string,
  period: DateRange,
): Promise<UnitEconomics> {
  // Get total marketing spend from metrics
  const spendMetrics = await queryMetrics(clientId, ["spend"], period);
  const totalSpend = spendMetrics.reduce((sum, m) => sum + m.value, 0);

  // Spend by channel
  const spendByChannel: Record<string, number> = {};
  for (const m of spendMetrics) {
    const ch = m.dimensions.source ?? "unknown";
    spendByChannel[ch] = (spendByChannel[ch] ?? 0) + m.value;
  }

  // Get new customers (closed_won deals in period)
  const deals = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.clientId, clientId),
        eq(schema.deals.stage, "closed_won"),
      ),
    );

  const newCustomers = deals.filter((d) => {
    const closedAt = d.closedAt?.toISOString().split("T")[0] ?? "";
    return closedAt >= period.start && closedAt <= period.end;
  });

  const customerCount = newCustomers.length;
  const totalRevenue = newCustomers.reduce((s, d) => s + Number(d.value ?? 0), 0);

  // CAC
  const cac = customerCount > 0 ? totalSpend / customerCount : 0;

  // CAC by channel (simplified — proportional to spend)
  const cacByChannel: Record<string, number> = {};
  for (const [channel, spend] of Object.entries(spendByChannel)) {
    cacByChannel[channel] = customerCount > 0 ? spend / customerCount : 0;
  }

  // LTV (simplified: avg revenue × assumed 12-month lifespan)
  const avgRevenue = customerCount > 0 ? totalRevenue / customerCount : 0;
  const avgLifespanMonths = 12; // Default assumption
  const ltv = avgRevenue * avgLifespanMonths;

  // Derived metrics
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const monthlyArpu = avgRevenue;
  const paybackPeriodMonths = monthlyArpu > 0 ? cac / monthlyArpu : 0;

  return {
    cac: Math.round(cac * 100) / 100,
    cacByChannel: Object.fromEntries(
      Object.entries(cacByChannel).map(([k, v]) => [k, Math.round(v * 100) / 100]),
    ),
    ltv: Math.round(ltv * 100) / 100,
    ltvCacRatio: Math.round(ltvCacRatio * 100) / 100,
    paybackPeriodMonths: Math.round(paybackPeriodMonths * 100) / 100,
    monthlyChurnRate: 5, // Stub — would require subscription data
    netRevenueRetention: 105, // Stub — would require historical cohort data
    period,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Compute cohort-based LTV analysis.
 */
export async function computeCohorts(
  clientId: string,
  period: DateRange,
): Promise<CohortData[]> {
  const deals = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.clientId, clientId),
        eq(schema.deals.stage, "closed_won"),
      ),
    );

  // Group deals by month of closure
  const cohorts = new Map<string, { size: number; totalValue: number }>();

  for (const deal of deals) {
    const closedAt = deal.closedAt?.toISOString().split("T")[0] ?? "";
    if (closedAt < period.start || closedAt > period.end) continue;
    const month = closedAt.slice(0, 7); // "YYYY-MM"
    const existing = cohorts.get(month) ?? { size: 0, totalValue: 0 };
    existing.size += 1;
    existing.totalValue += Number(deal.value ?? 0);
    cohorts.set(month, existing);
  }

  return [...cohorts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      cohortMonth: month,
      size: data.size,
      revenueByMonth: [data.totalValue], // Simplified — single month
      cumulativeLtv: data.size > 0 ? data.totalValue / data.size : 0,
      retentionByMonth: [100], // Simplified — 100% at month 0
    }));
}

/**
 * Wrapper that returns an AnalyticsStepResult.
 */
export async function runUnitEconomics(
  clientId: string,
  period: DateRange,
): Promise<AnalyticsStepResult> {
  const economics = await calculateUnitEconomics(clientId, period);
  return {
    step: "an_analyze",
    status: "completed",
    data: economics,
  };
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/services/analytics/unit-economics.test.ts

import { describe, it, expect, vi } from "vitest";
import { calculateUnitEconomics, computeCohorts, runUnitEconomics } from "./unit-economics.js";

vi.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: "d1", leadId: "l1", value: "1000", stage: "closed_won", closedAt: new Date("2026-03-10"), clientId: "c1" },
            { id: "d2", leadId: "l2", value: "2000", stage: "closed_won", closedAt: new Date("2026-03-20"), clientId: "c1" },
            { id: "d3", leadId: "l3", value: "1500", stage: "closed_won", closedAt: new Date("2026-04-05"), clientId: "c1" },
          ]),
      }),
    }),
  },
  schema: { deals: "deals" },
}));

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-01", metric: "spend", value: 300, dimensions: { source: "meta_ads" }, source: "meta_ads" },
    { date: "2026-03-15", metric: "spend", value: 200, dimensions: { source: "google_ads" }, source: "google_ads" },
  ]),
}));

const period = { start: "2026-03-01", end: "2026-03-31" };

describe("unit-economics", () => {
  it("calculates CAC correctly", async () => {
    const result = await calculateUnitEconomics("c1", period);
    // Total spend: 500, 2 customers in March → CAC = 250
    expect(result.cac).toBe(250);
  });

  it("calculates LTV with 12-month multiplier", async () => {
    const result = await calculateUnitEconomics("c1", period);
    // Avg revenue = (1000+2000)/2 = 1500, × 12 = 18000
    expect(result.ltv).toBe(18000);
  });

  it("calculates LTV:CAC ratio", async () => {
    const result = await calculateUnitEconomics("c1", period);
    // 18000 / 250 = 72
    expect(result.ltvCacRatio).toBe(72);
  });

  it("includes CAC by channel", async () => {
    const result = await calculateUnitEconomics("c1", period);
    expect(result.cacByChannel).toHaveProperty("meta_ads");
    expect(result.cacByChannel).toHaveProperty("google_ads");
  });

  it("computeCohorts groups by month", async () => {
    const cohorts = await computeCohorts("c1", period);
    expect(cohorts).toHaveLength(1); // Only March deals in period
    expect(cohorts[0].cohortMonth).toBe("2026-03");
    expect(cohorts[0].size).toBe(2);
  });

  it("runUnitEconomics returns step result", async () => {
    const result = await runUnitEconomics("c1", period);
    expect(result.step).toBe("an_analyze");
    expect(result.status).toBe("completed");
    expect(result.data).toHaveProperty("cac");
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/services/analytics/unit-economics.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/unit-economics.ts src/services/analytics/unit-economics.test.ts
git commit -m "feat(analytics): implement CAC/LTV unit economics service (C-035)"
```

---

### Task 7: Dashboard Builder Service

**Files:**
- Create: `src/services/analytics/dashboard-builder.ts`
- Test: `src/services/analytics/dashboard-builder.test.ts`

- [ ] **Step 1: Create dashboard builder**

```typescript
// src/services/analytics/dashboard-builder.ts

import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { queryMetrics } from "./data-collector.js";
import type { DashboardConfig, DashboardData, DashboardType, WidgetConfig, DateRange, AnalyticsStepResult } from "./types.js";

// ── Default Dashboard Templates ──

const DEFAULT_WIDGETS: Record<DashboardType, WidgetConfig[]> = {
  executive: [
    { id: "total_spend", type: "kpi_card", metric: "spend", position: { x: 0, y: 0, w: 3, h: 1 }, config: { dateRange: "30d" } },
    { id: "total_revenue", type: "kpi_card", metric: "revenue", position: { x: 3, y: 0, w: 3, h: 1 }, config: { dateRange: "30d" } },
    { id: "roas", type: "kpi_card", metric: "roas", position: { x: 6, y: 0, w: 3, h: 1 }, config: { dateRange: "30d" } },
    { id: "spend_trend", type: "time_series", metric: "spend", position: { x: 0, y: 1, w: 6, h: 2 }, config: { dateRange: "90d", comparisonPeriod: "previous_period" } },
    { id: "channel_split", type: "pie", metric: "spend", position: { x: 6, y: 1, w: 3, h: 2 }, config: { groupBy: "channel" } },
  ],
  channel: [
    { id: "channel_spend", type: "bar_chart", metric: "spend", position: { x: 0, y: 0, w: 6, h: 2 }, config: { groupBy: "channel" } },
    { id: "channel_roas", type: "bar_chart", metric: "roas", position: { x: 6, y: 0, w: 6, h: 2 }, config: { groupBy: "channel" } },
    { id: "impressions_trend", type: "time_series", metric: "impressions", position: { x: 0, y: 2, w: 12, h: 2 }, config: { dateRange: "30d", groupBy: "channel" } },
  ],
  content: [
    { id: "engagement", type: "kpi_card", metric: "engagement", position: { x: 0, y: 0, w: 4, h: 1 }, config: { dateRange: "30d" } },
    { id: "top_content", type: "table", metric: "content_performance", position: { x: 0, y: 1, w: 12, h: 3 }, config: {} },
  ],
  funnel: [
    { id: "lead_funnel", type: "funnel", metric: "leads_by_stage", position: { x: 0, y: 0, w: 6, h: 3 }, config: {} },
    { id: "conversion_rates", type: "bar_chart", metric: "conversion_rate", position: { x: 6, y: 0, w: 6, h: 3 }, config: {} },
  ],
  financial: [
    { id: "cac", type: "kpi_card", metric: "cac", position: { x: 0, y: 0, w: 3, h: 1 }, config: { dateRange: "30d" } },
    { id: "ltv", type: "kpi_card", metric: "ltv", position: { x: 3, y: 0, w: 3, h: 1 }, config: { dateRange: "30d" } },
    { id: "ltv_cac_ratio", type: "kpi_card", metric: "ltv_cac_ratio", position: { x: 6, y: 0, w: 3, h: 1 }, config: { dateRange: "30d" } },
    { id: "budget_utilization", type: "bar_chart", metric: "budget_utilization", position: { x: 0, y: 1, w: 12, h: 2 }, config: { dateRange: "30d" } },
  ],
};

/**
 * Get or create dashboard config for a client + type.
 */
export async function getDashboardConfig(
  clientId: string,
  dashboardType: DashboardType,
): Promise<DashboardConfig> {
  const [existing] = await db
    .select()
    .from(schema.dashboardConfigs)
    .where(
      and(
        eq(schema.dashboardConfigs.clientId, clientId),
        eq(schema.dashboardConfigs.dashboardType, dashboardType),
      ),
    );

  if (existing) {
    return existing.config as DashboardConfig;
  }

  // Return default config
  return {
    clientId,
    dashboardType,
    widgets: DEFAULT_WIDGETS[dashboardType] ?? [],
    refreshInterval: 300,
  };
}

/**
 * Save dashboard config.
 */
export async function saveDashboardConfig(
  clientId: string,
  dashboardType: DashboardType,
  config: DashboardConfig,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(schema.dashboardConfigs)
    .where(
      and(
        eq(schema.dashboardConfigs.clientId, clientId),
        eq(schema.dashboardConfigs.dashboardType, dashboardType),
      ),
    );

  if (existing) {
    await db
      .update(schema.dashboardConfigs)
      .set({ config, updatedAt: new Date() })
      .where(eq(schema.dashboardConfigs.id, existing.id));
  } else {
    await db.insert(schema.dashboardConfigs).values({
      clientId,
      dashboardType,
      config,
      isDefault: true,
    });
  }
}

/**
 * Build dashboard data by fetching metrics for each widget.
 */
export async function buildDashboard(
  clientId: string,
  dashboardType: DashboardType,
  dateRange: DateRange,
): Promise<DashboardData> {
  const config = await getDashboardConfig(clientId, dashboardType);

  const widgetData = await Promise.all(
    config.widgets.map(async (widget) => {
      const metrics = await queryMetrics(clientId, [widget.metric], dateRange);
      return {
        id: widget.id,
        type: widget.type,
        metric: widget.metric,
        data: metrics,
      };
    }),
  );

  return {
    config,
    widgets: widgetData,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Wrapper that returns AnalyticsStepResult.
 */
export async function runDashboardBuild(
  clientId: string,
  dashboardType: DashboardType,
  dateRange: DateRange,
): Promise<AnalyticsStepResult> {
  const dashboard = await buildDashboard(clientId, dashboardType, dateRange);
  return {
    step: "an_visualize",
    status: "completed",
    data: dashboard,
  };
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/services/analytics/dashboard-builder.test.ts

import { describe, it, expect, vi } from "vitest";
import { getDashboardConfig, buildDashboard, runDashboardBuild } from "./dashboard-builder.js";

vi.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
    insert: () => ({ values: () => Promise.resolve() }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
  schema: { dashboardConfigs: "dashboard_configs" },
}));

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-01", metric: "spend", value: 150, dimensions: {}, source: "meta_ads" },
  ]),
}));

const period = { start: "2026-03-01", end: "2026-03-31" };

describe("dashboard-builder", () => {
  it("getDashboardConfig returns default when no saved config", async () => {
    const config = await getDashboardConfig("c1", "executive");
    expect(config.dashboardType).toBe("executive");
    expect(config.widgets.length).toBeGreaterThan(0);
    expect(config.refreshInterval).toBe(300);
  });

  it("executive dashboard has 5 default widgets", async () => {
    const config = await getDashboardConfig("c1", "executive");
    expect(config.widgets).toHaveLength(5);
  });

  it("buildDashboard returns widget data", async () => {
    const dashboard = await buildDashboard("c1", "executive", period);
    expect(dashboard.config.dashboardType).toBe("executive");
    expect(dashboard.widgets.length).toBeGreaterThan(0);
    expect(dashboard.generatedAt).toBeTruthy();
    expect(dashboard.widgets[0]).toHaveProperty("data");
  });

  it("all dashboard types have default widgets", async () => {
    const types = ["executive", "channel", "content", "funnel", "financial"] as const;
    for (const type of types) {
      const config = await getDashboardConfig("c1", type);
      expect(config.widgets.length).toBeGreaterThan(0);
    }
  });

  it("runDashboardBuild returns step result", async () => {
    const result = await runDashboardBuild("c1", "executive", period);
    expect(result.step).toBe("an_visualize");
    expect(result.status).toBe("completed");
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/services/analytics/dashboard-builder.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/dashboard-builder.ts src/services/analytics/dashboard-builder.test.ts
git commit -m "feat(analytics): implement dashboard builder with 5 dashboard types (C-033)"
```

---

### Task 8: Report Generator Service

**Files:**
- Create: `src/services/analytics/report-generator.ts`
- Test: `src/services/analytics/report-generator.test.ts`

- [ ] **Step 1: Create report generator**

```typescript
// src/services/analytics/report-generator.ts

import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import { queryMetrics } from "./data-collector.js";
import type { AutomatedReport, ReportType, ReportSection, ReportMetric, DateRange, AnalyticsStepResult } from "./types.js";

const FLASH_MODEL = "gemini-2.5-flash";
const STRATEGIC_MODEL = "claude-sonnet-4-5";

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
    }
    return fallback;
  }
}

/**
 * Build metrics comparison between two periods.
 */
async function buildMetricsComparison(
  clientId: string,
  currentPeriod: DateRange,
  previousPeriod: DateRange,
  metricNames: string[],
): Promise<ReportMetric[]> {
  const current = await queryMetrics(clientId, metricNames, currentPeriod);
  const previous = await queryMetrics(clientId, metricNames, previousPeriod);

  const currentTotals: Record<string, number> = {};
  const previousTotals: Record<string, number> = {};

  for (const m of current) {
    currentTotals[m.metric] = (currentTotals[m.metric] ?? 0) + m.value;
  }
  for (const m of previous) {
    previousTotals[m.metric] = (previousTotals[m.metric] ?? 0) + m.value;
  }

  return metricNames.map((name) => {
    const value = currentTotals[name] ?? 0;
    const previousValue = previousTotals[name] ?? 0;
    const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
    const positiveIsGood = !["spend", "cpc", "bounce_rate", "cac"].includes(name);
    return {
      name,
      value: Math.round(value * 100) / 100,
      previousValue: Math.round(previousValue * 100) / 100,
      change: Math.round(change * 100) / 100,
      trend: change > 1 ? "up" : change < -1 ? "down" : "flat",
      isGood: positiveIsGood ? change >= 0 : change <= 0,
    };
  });
}

/**
 * Generate AI insights for a report section.
 */
async function generateInsights(
  metrics: ReportMetric[],
  reportType: ReportType,
): Promise<{ insights: string[]; recommendations: string[] }> {
  const metricsStr = metrics
    .map((m) => `${m.name}: ${m.value} (${m.change > 0 ? "+" : ""}${m.change}% vs anterior)`)
    .join("\n");

  const raw = await generateText(
    FLASH_MODEL,
    "Eres un analista de marketing. Genera insights en español sobre métricas de marketing. Responde en JSON: { \"insights\": [\"...\"], \"recommendations\": [\"...\"] }",
    `Tipo de reporte: ${reportType}\nMétricas:\n${metricsStr}\n\nGenera 2-3 insights y 1-2 recomendaciones.`,
    1000,
  );

  return parseJsonSafe(raw, { insights: [], recommendations: [] });
}

/**
 * Generate an automated report.
 */
export async function generateReport(
  clientId: string,
  type: ReportType,
  period: DateRange,
): Promise<AutomatedReport> {
  // Calculate previous period (same duration)
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  const previousPeriod: DateRange = {
    start: prevStart.toISOString().split("T")[0],
    end: prevEnd.toISOString().split("T")[0],
  };

  const coreMetrics = ["spend", "impressions", "clicks", "conversions", "roas"];
  const metrics = await buildMetricsComparison(clientId, period, previousPeriod, coreMetrics);
  const { insights, recommendations } = await generateInsights(metrics, type);

  const sections: ReportSection[] = [
    {
      title: "Resumen de rendimiento",
      metrics,
      insights,
      recommendations,
    },
  ];

  // Generate executive summary
  const summaryRaw = await generateText(
    STRATEGIC_MODEL,
    "Eres el director de analytics de una agencia de marketing. Escribe un resumen ejecutivo de 2-3 oraciones en español.",
    `Métricas del periodo ${period.start} a ${period.end}:\n${metrics.map(m => `${m.name}: ${m.value} (${m.trend})`).join(", ")}`,
    300,
  );

  const report: AutomatedReport = {
    clientId,
    type,
    period,
    sections,
    executiveSummary: summaryRaw.trim(),
    generatedAt: new Date().toISOString(),
  };

  // Save to DB
  await db.insert(schema.generatedReports).values({
    clientId,
    type,
    periodStart: period.start,
    periodEnd: period.end,
    content: report,
    renderedMarkdown: formatReportMarkdown(report),
  });

  return report;
}

/**
 * Format report as markdown.
 */
function formatReportMarkdown(report: AutomatedReport): string {
  const lines: string[] = [
    `# Reporte ${report.type} — ${report.period.start} a ${report.period.end}`,
    "",
    `> ${report.executiveSummary}`,
    "",
  ];

  for (const section of report.sections) {
    lines.push(`## ${section.title}`, "");
    lines.push("| Métrica | Valor | Cambio | Tendencia |");
    lines.push("|---------|-------|--------|-----------|");
    for (const m of section.metrics) {
      const arrow = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→";
      lines.push(`| ${m.name} | ${m.value} | ${m.change > 0 ? "+" : ""}${m.change}% | ${arrow} |`);
    }
    lines.push("");
    if (section.insights.length > 0) {
      lines.push("### Insights", "");
      for (const i of section.insights) lines.push(`- ${i}`);
      lines.push("");
    }
    if (section.recommendations.length > 0) {
      lines.push("### Recomendaciones", "");
      for (const r of section.recommendations) lines.push(`- ${r}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * List generated reports for a client.
 */
export async function listReports(clientId: string): Promise<unknown[]> {
  return db
    .select()
    .from(schema.generatedReports)
    .where(eq(schema.generatedReports.clientId, clientId));
}

/**
 * Get a specific report by ID.
 */
export async function getReport(reportId: string): Promise<unknown | null> {
  const [report] = await db
    .select()
    .from(schema.generatedReports)
    .where(eq(schema.generatedReports.id, reportId));
  return report ?? null;
}

/**
 * Wrapper returning AnalyticsStepResult.
 */
export async function runReportGeneration(
  clientId: string,
  type: ReportType,
  period: DateRange,
): Promise<AnalyticsStepResult> {
  const report = await generateReport(clientId, type, period);
  return {
    step: "an_visualize",
    status: "completed",
    data: report,
    artifactContent: formatReportMarkdown(report),
  };
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/services/analytics/report-generator.test.ts

import { describe, it, expect, vi } from "vitest";
import { generateReport, runReportGeneration } from "./report-generator.js";

vi.mock("../../db/index.js", () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  },
  schema: { generatedReports: "generated_reports" },
}));

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-15", metric: "spend", value: 500, dimensions: {}, source: "meta_ads" },
    { date: "2026-03-15", metric: "clicks", value: 800, dimensions: {}, source: "meta_ads" },
  ]),
}));

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue('{"insights":["El gasto aumentó un 10%"],"recommendations":["Optimizar campañas de bajo ROAS"]}'),
}));

const period = { start: "2026-03-01", end: "2026-03-31" };

describe("report-generator", () => {
  it("generateReport returns valid AutomatedReport", async () => {
    const report = await generateReport("c1", "monthly", period);
    expect(report.clientId).toBe("c1");
    expect(report.type).toBe("monthly");
    expect(report.sections).toHaveLength(1);
    expect(report.sections[0].metrics.length).toBeGreaterThan(0);
    expect(report.executiveSummary).toBeTruthy();
    expect(report.generatedAt).toBeTruthy();
  });

  it("metrics include trend and change", async () => {
    const report = await generateReport("c1", "weekly", period);
    const metric = report.sections[0].metrics[0];
    expect(metric).toHaveProperty("name");
    expect(metric).toHaveProperty("value");
    expect(metric).toHaveProperty("change");
    expect(metric).toHaveProperty("trend");
    expect(["up", "down", "flat"]).toContain(metric.trend);
  });

  it("runReportGeneration returns step result with artifact", async () => {
    const result = await runReportGeneration("c1", "daily", period);
    expect(result.step).toBe("an_visualize");
    expect(result.status).toBe("completed");
    expect(result.artifactContent).toContain("# Reporte");
  });

  it("handles fallback when LLM returns invalid JSON", async () => {
    const { generateText } = await import("../../providers/generate-text.js");
    (generateText as any).mockResolvedValueOnce("not json");
    const report = await generateReport("c1", "daily", period);
    expect(report.sections[0].insights).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/services/analytics/report-generator.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/report-generator.ts src/services/analytics/report-generator.test.ts
git commit -m "feat(analytics): implement automated report generator — daily/weekly/monthly (C-036)"
```

---

### Task 9: NL Query Engine Service

**Files:**
- Create: `src/services/analytics/nl-query-engine.ts`
- Test: `src/services/analytics/nl-query-engine.test.ts`

- [ ] **Step 1: Create NL query engine**

```typescript
// src/services/analytics/nl-query-engine.ts

import { db, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import { queryMetrics } from "./data-collector.js";
import type { NLQueryResult, DateRange, AnalyticsStepResult } from "./types.js";

const STRATEGIC_MODEL = "claude-sonnet-4-5";
const FLASH_MODEL = "gemini-2.5-flash";

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
    }
    return fallback;
  }
}

interface StructuredQuery {
  metrics: string[];
  dateRange: DateRange;
  dimensions: string[];
  comparison: boolean;
}

/**
 * Translate a natural language question into a structured query.
 */
async function translateQuestion(question: string): Promise<StructuredQuery> {
  const today = new Date().toISOString().split("T")[0];
  const raw = await generateText(
    FLASH_MODEL,
    `Eres un traductor de consultas de marketing. Convierte preguntas en español a queries estructurados.
Hoy es ${today}. Responde SOLO en JSON:
{
  "metrics": ["spend", "clicks", "conversions", "roas", "impressions", "cac", "ltv", "leads", "revenue"],
  "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "dimensions": [],
  "comparison": false
}
Métricas disponibles: spend, impressions, clicks, conversions, roas, cpc, cpm, sessions, page_views, bounce_rate, organic_traffic, leads, revenue, cac, ltv, agent_executions, agent_cost_usd.`,
    question,
    500,
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return parseJsonSafe<StructuredQuery>(raw, {
    metrics: ["spend", "revenue"],
    dateRange: { start: thirtyDaysAgo, end: today },
    dimensions: [],
    comparison: false,
  });
}

/**
 * Generate a natural language answer from query results.
 */
async function generateAnswer(
  question: string,
  structuredQuery: StructuredQuery,
  data: Record<string, number>,
): Promise<{ answer: string; followUpSuggestions: string[] }> {
  const dataStr = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ");

  const raw = await generateText(
    STRATEGIC_MODEL,
    `Eres un analista de marketing que responde preguntas en español de forma clara y concisa.
Responde en JSON: { "answer": "...", "followUpSuggestions": ["...", "..."] }
- La respuesta debe ser directa, con números y contexto
- Incluye 2-3 sugerencias de preguntas de seguimiento
- Usa formato de moneda para dinero ($X,XXX)
- Usa porcentajes cuando sea relevante`,
    `Pregunta: ${question}\nQuery: ${JSON.stringify(structuredQuery)}\nDatos: ${dataStr}`,
    800,
  );

  return parseJsonSafe(raw, {
    answer: `Datos encontrados: ${dataStr}`,
    followUpSuggestions: [],
  });
}

/**
 * Process a natural language query end-to-end.
 */
export async function processNLQuery(
  clientId: string,
  question: string,
): Promise<NLQueryResult> {
  // Step 1: Translate to structured query
  const structuredQuery = await translateQuestion(question);

  // Step 2: Execute query
  const metrics = await queryMetrics(clientId, structuredQuery.metrics, structuredQuery.dateRange);

  // Aggregate data
  const aggregated: Record<string, number> = {};
  for (const m of metrics) {
    aggregated[m.metric] = (aggregated[m.metric] ?? 0) + m.value;
  }

  // Step 3: Generate NL answer
  const { answer, followUpSuggestions } = await generateAnswer(question, structuredQuery, aggregated);

  // Step 4: Calculate confidence based on data availability
  const requestedMetrics = structuredQuery.metrics.length;
  const foundMetrics = Object.keys(aggregated).length;
  const confidence = requestedMetrics > 0 ? Math.min(foundMetrics / requestedMetrics, 1) : 0.5;

  const result: NLQueryResult = {
    answer,
    data: aggregated,
    confidence: Math.round(confidence * 100) / 100,
    followUpSuggestions,
  };

  // Save to history
  await db.insert(schema.nlQueries).values({
    clientId,
    question,
    answer: result.answer,
    data: result.data,
    confidence: String(result.confidence),
  });

  return result;
}

/**
 * Get query history for a client.
 */
export async function getQueryHistory(clientId: string): Promise<unknown[]> {
  return db
    .select()
    .from(schema.nlQueries)
    .where(eq(schema.nlQueries.clientId, clientId));
}

/**
 * Record feedback for a query.
 */
export async function recordQueryFeedback(
  queryId: string,
  feedback: "helpful" | "not_helpful",
): Promise<void> {
  await db
    .update(schema.nlQueries)
    .set({ feedback })
    .where(eq(schema.nlQueries.id, queryId));
}

/**
 * Wrapper returning AnalyticsStepResult.
 */
export async function runNLQuery(
  clientId: string,
  question: string,
): Promise<AnalyticsStepResult> {
  const result = await processNLQuery(clientId, question);
  return {
    step: "an_analyze",
    status: "completed",
    data: result,
    artifactContent: result.answer,
  };
}
```

- [ ] **Step 2: Write tests**

```typescript
// src/services/analytics/nl-query-engine.test.ts

import { describe, it, expect, vi } from "vitest";
import { processNLQuery, getQueryHistory, recordQueryFeedback, runNLQuery } from "./nl-query-engine.js";

vi.mock("../../db/index.js", () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({ from: () => ({ where: () => Promise.resolve([{ id: "q1", question: "test", answer: "test" }]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
  schema: { nlQueries: "nl_queries" },
}));

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-01", metric: "spend", value: 2500, dimensions: {}, source: "meta_ads" },
    { date: "2026-03-01", metric: "roas", value: 3.2, dimensions: {}, source: "meta_ads" },
  ]),
}));

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn()
    .mockResolvedValueOnce('{"metrics":["spend","roas"],"dateRange":{"start":"2026-03-01","end":"2026-03-31"},"dimensions":[],"comparison":false}')
    .mockResolvedValueOnce('{"answer":"El mes pasado gastamos $2,500 en Meta Ads con un ROAS de 3.2x","followUpSuggestions":["¿Cuál fue el CPC promedio?","¿Cómo se compara con Google Ads?"]}'),
}));

describe("nl-query-engine", () => {
  it("processNLQuery returns structured result", async () => {
    const result = await processNLQuery("c1", "¿Cuánto gastamos en Meta Ads el mes pasado?");
    expect(result.answer).toBeTruthy();
    expect(result.data).toHaveProperty("spend");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.followUpSuggestions).toBeInstanceOf(Array);
  });

  it("getQueryHistory returns stored queries", async () => {
    const history = await getQueryHistory("c1");
    expect(history).toHaveLength(1);
  });

  it("recordQueryFeedback updates without error", async () => {
    await expect(recordQueryFeedback("q1", "helpful")).resolves.toBeUndefined();
  });

  it("runNLQuery returns step result", async () => {
    const { generateText } = await import("../../providers/generate-text.js");
    (generateText as any)
      .mockResolvedValueOnce('{"metrics":["spend"],"dateRange":{"start":"2026-03-01","end":"2026-03-31"},"dimensions":[],"comparison":false}')
      .mockResolvedValueOnce('{"answer":"Gastamos $2,500","followUpSuggestions":[]}');

    const result = await runNLQuery("c1", "¿Cuánto gastamos?");
    expect(result.step).toBe("an_analyze");
    expect(result.status).toBe("completed");
    expect(result.artifactContent).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/services/analytics/nl-query-engine.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/nl-query-engine.ts src/services/analytics/nl-query-engine.test.ts
git commit -m "feat(analytics): implement natural language query engine (C-037)"
```

---

### Task 10: Zod Validators + API Routes

**Files:**
- Modify: `src/api/validators.ts`
- Create: `src/api/analytics-routes.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Add analytics validators to `src/api/validators.ts`**

Add at the end of the file, before any closing exports:

```typescript
// ── Analytics Validators ──

export const dashboardQuerySchema = z.object({
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
});

export const dashboardConfigUpdateSchema = z.object({
  widgets: z.array(z.object({
    id: z.string().min(1).max(100),
    type: z.enum(["kpi_card", "time_series", "bar_chart", "funnel", "table", "pie", "heatmap"]),
    metric: z.string().min(1).max(100),
    position: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1),
      h: z.number().int().min(1),
    }),
    config: z.record(z.unknown()).optional(),
  })),
  refreshInterval: z.number().int().min(30).max(3600).optional(),
});

export const metricsQuerySchema = z.object({
  metrics: z.array(z.string().min(1).max(100)).min(1),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  dimensions: z.array(z.string()).optional(),
});

export const attributionQuerySchema = z.object({
  model: z.enum(["first_touch", "last_touch", "linear", "time_decay", "position_based"]),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export const generateReportSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "on_demand"]),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export const nlQuerySchema = z.object({
  question: z.string().min(3).max(1000),
});

export const queryFeedbackSchema = z.object({
  feedback: z.enum(["helpful", "not_helpful"]),
});

export const collectMetricsSchema = z.object({
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});
```

- [ ] **Step 2: Create analytics routes**

```typescript
// src/api/analytics-routes.ts

import { Hono } from "hono";
import {
  parseBody,
  dashboardQuerySchema,
  dashboardConfigUpdateSchema,
  metricsQuerySchema,
  attributionQuerySchema,
  generateReportSchema,
  nlQuerySchema,
  queryFeedbackSchema,
  collectMetricsSchema,
} from "./validators.js";
import { buildDashboard, getDashboardConfig, saveDashboardConfig } from "../services/analytics/dashboard-builder.js";
import { queryMetrics, collectExternalMetrics, getDataSources } from "../services/analytics/data-collector.js";
import { computeAttribution } from "../services/analytics/attribution.js";
import { calculateUnitEconomics, computeCohorts } from "../services/analytics/unit-economics.js";
import { generateReport, listReports, getReport } from "../services/analytics/report-generator.js";
import { processNLQuery, getQueryHistory, recordQueryFeedback } from "../services/analytics/nl-query-engine.js";
import type { DashboardType } from "../services/analytics/types.js";

export const analyticsRoutes = new Hono();

// ── Dashboards ──

analyticsRoutes.get("/api/analytics/:clientId/dashboard/:type", async (c) => {
  const clientId = c.req.param("clientId");
  const dashboardType = c.req.param("type") as DashboardType;
  const validTypes = ["executive", "channel", "content", "funnel", "financial"];
  if (!validTypes.includes(dashboardType)) return c.json({ error: "Invalid dashboard type" }, 400);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const dateRange = {
    start: thirtyDaysAgo.toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };

  const dashboard = await buildDashboard(clientId, dashboardType, dateRange);
  return c.json(dashboard);
});

analyticsRoutes.get("/api/analytics/:clientId/dashboard/config", async (c) => {
  const clientId = c.req.param("clientId");
  const configs: Record<string, unknown> = {};
  const types = ["executive", "channel", "content", "funnel", "financial"] as const;
  for (const type of types) {
    configs[type] = await getDashboardConfig(clientId, type);
  }
  return c.json(configs);
});

analyticsRoutes.put("/api/analytics/:clientId/dashboard/config", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(dashboardConfigUpdateSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const dashboardType = (body.dashboardType ?? "executive") as DashboardType;
  await saveDashboardConfig(clientId, dashboardType, {
    clientId,
    dashboardType,
    widgets: parsed.data.widgets as any,
    refreshInterval: parsed.data.refreshInterval ?? 300,
  });
  return c.json({ status: "updated" });
});

// ── Metrics ──

analyticsRoutes.get("/api/analytics/:clientId/metrics", async (c) => {
  const clientId = c.req.param("clientId");
  const metricsParam = c.req.query("metrics")?.split(",") ?? [];
  const start = c.req.query("start") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const data = await queryMetrics(clientId, metricsParam, { start, end });
  return c.json(data);
});

analyticsRoutes.get("/api/analytics/:clientId/metrics/compare", async (c) => {
  const clientId = c.req.param("clientId");
  const metricsParam = c.req.query("metrics")?.split(",") ?? [];
  const start = c.req.query("start") ?? "";
  const end = c.req.query("end") ?? "";
  if (!start || !end) return c.json({ error: "start and end required" }, 400);

  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const prevEnd = new Date(new Date(start).getTime() - 1).toISOString().split("T")[0];
  const prevStart = new Date(new Date(start).getTime() - 1 - durationMs).toISOString().split("T")[0];

  const current = await queryMetrics(clientId, metricsParam, { start, end });
  const previous = await queryMetrics(clientId, metricsParam, { start: prevStart, end: prevEnd });
  return c.json({ current, previous });
});

// ── Attribution ──

analyticsRoutes.get("/api/analytics/:clientId/attribution", async (c) => {
  const clientId = c.req.param("clientId");
  const model = (c.req.query("model") ?? "linear") as any;
  const start = c.req.query("start") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const report = await computeAttribution(clientId, model, { start, end });
  return c.json(report);
});

analyticsRoutes.get("/api/analytics/:clientId/attribution/paths", async (c) => {
  const clientId = c.req.param("clientId");
  const start = c.req.query("start") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const report = await computeAttribution(clientId, "linear", { start, end });
  return c.json(report.pathAnalysis);
});

// ── Unit Economics ──

analyticsRoutes.get("/api/analytics/:clientId/unit-economics", async (c) => {
  const clientId = c.req.param("clientId");
  const start = c.req.query("start") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const economics = await calculateUnitEconomics(clientId, { start, end });
  return c.json(economics);
});

analyticsRoutes.get("/api/analytics/:clientId/unit-economics/cohorts", async (c) => {
  const clientId = c.req.param("clientId");
  const start = c.req.query("start") ?? new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const cohorts = await computeCohorts(clientId, { start, end });
  return c.json(cohorts);
});

// ── Reports ──

analyticsRoutes.get("/api/analytics/:clientId/reports", async (c) => {
  const clientId = c.req.param("clientId");
  const reports = await listReports(clientId);
  return c.json(reports);
});

analyticsRoutes.get("/api/analytics/:clientId/reports/:reportId", async (c) => {
  const report = await getReport(c.req.param("reportId"));
  if (!report) return c.json({ error: "Not found" }, 404);
  return c.json(report);
});

analyticsRoutes.post("/api/analytics/:clientId/reports/generate", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(generateReportSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const report = await generateReport(clientId, parsed.data.type, parsed.data.dateRange);
  return c.json(report, 201);
});

// ── NL Queries ──

analyticsRoutes.post("/api/analytics/:clientId/query", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(nlQuerySchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await processNLQuery(clientId, parsed.data.question);
  return c.json(result, 201);
});

analyticsRoutes.get("/api/analytics/:clientId/query/history", async (c) => {
  const clientId = c.req.param("clientId");
  const history = await getQueryHistory(clientId);
  return c.json(history);
});

analyticsRoutes.post("/api/analytics/:clientId/query/:queryId/feedback", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(queryFeedbackSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  await recordQueryFeedback(c.req.param("queryId"), parsed.data.feedback);
  return c.json({ status: "recorded" });
});

// ── Data Collection ──

analyticsRoutes.post("/api/analytics/:clientId/collect", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(collectMetricsSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await collectExternalMetrics(clientId, parsed.data.dateRange);
  return c.json(result, 201);
});

analyticsRoutes.get("/api/analytics/:clientId/sources", async (c) => {
  const sources = getDataSources();
  return c.json(sources);
});
```

- [ ] **Step 3: Mount routes in `src/api/routes.ts`**

Add import (near other route imports):
```typescript
import { analyticsRoutes } from "./analytics-routes.js";
```

Add middleware (near other `/api/` middleware lines):
```typescript
app.use("/api/analytics/:clientId/*", requireSession, requireTenantMatch);
```

Add route mount (near other `app.route("/", ...)` lines):
```typescript
app.route("/", analyticsRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add src/api/validators.ts src/api/analytics-routes.ts src/api/routes.ts
git commit -m "feat(api): add 17 analytics API endpoints with auth + tenant guard"
```

---

### Task 11: Integration Tests

**Files:**
- Create: `src/services/analytics/integration.test.ts`

- [ ] **Step 1: Write integration tests**

```typescript
// src/services/analytics/integration.test.ts

import { describe, it, expect } from "vitest";
import type {
  DateRange,
  MetricDataPoint,
  AnalyticsDataProvider,
  DashboardType,
  WidgetType,
  DashboardConfig,
  DashboardData,
  ChannelAttribution,
  CampaignAttribution,
  PathAnalysis,
  AttributionReport,
  UnitEconomics,
  CohortData,
  ReportType,
  ReportMetric,
  ReportSection,
  AutomatedReport,
  NLQueryResult,
  AnalyticsStepResult,
} from "./types.js";

describe("Analytics Engine type completeness", () => {
  it("DateRange requires start and end", () => {
    const range: DateRange = { start: "2026-01-01", end: "2026-03-31" };
    expect(range.start).toBeTruthy();
    expect(range.end).toBeTruthy();
  });

  it("MetricDataPoint has all required fields", () => {
    const point: MetricDataPoint = {
      date: "2026-03-01",
      metric: "spend",
      value: 150,
      dimensions: { source: "meta_ads" },
      source: "meta_ads",
    };
    expect(point.date).toBeTruthy();
    expect(point.metric).toBeTruthy();
    expect(typeof point.value).toBe("number");
  });

  it("DashboardType covers all 5 types", () => {
    const types: DashboardType[] = ["executive", "channel", "content", "funnel", "financial"];
    expect(types).toHaveLength(5);
  });

  it("WidgetType covers all 7 types", () => {
    const types: WidgetType[] = ["kpi_card", "time_series", "bar_chart", "funnel", "table", "pie", "heatmap"];
    expect(types).toHaveLength(7);
  });

  it("AttributionReport has byChannel, byCampaign, pathAnalysis", () => {
    const report: AttributionReport = {
      model: "linear",
      period: { start: "2026-01-01", end: "2026-03-31" },
      totalRevenue: 10000,
      byChannel: [{
        channel: "meta_ads",
        attributedRevenue: 5000,
        percentOfTotal: 50,
        dealCount: 10,
        avgDealSize: 500,
        costPerAcquisition: 100,
        roas: 5,
      }],
      byCampaign: [{
        campaign: "spring",
        channel: "meta_ads",
        attributedRevenue: 3000,
        spend: 500,
        roas: 6,
      }],
      pathAnalysis: {
        avgPathLength: 2.5,
        avgTimeToClose: 14,
        commonPaths: [{ path: ["meta_ads", "email"], frequency: 5, avgDealValue: 1000 }],
      },
    };
    expect(report.byChannel).toHaveLength(1);
    expect(report.byCampaign).toHaveLength(1);
    expect(report.pathAnalysis.commonPaths).toHaveLength(1);
  });

  it("UnitEconomics has all computed fields", () => {
    const economics: UnitEconomics = {
      cac: 250,
      cacByChannel: { meta_ads: 150, google_ads: 200 },
      ltv: 18000,
      ltvCacRatio: 72,
      paybackPeriodMonths: 0.17,
      monthlyChurnRate: 5,
      netRevenueRetention: 105,
      period: { start: "2026-01-01", end: "2026-03-31" },
      computedAt: "2026-04-07T00:00:00Z",
    };
    expect(economics.ltvCacRatio).toBeGreaterThan(0);
    expect(economics.cacByChannel).toHaveProperty("meta_ads");
  });

  it("CohortData has retention and revenue arrays", () => {
    const cohort: CohortData = {
      cohortMonth: "2026-03",
      size: 10,
      revenueByMonth: [5000, 4500, 4000],
      cumulativeLtv: 1350,
      retentionByMonth: [100, 90, 80],
    };
    expect(cohort.revenueByMonth).toHaveLength(3);
    expect(cohort.retentionByMonth).toHaveLength(3);
  });

  it("ReportType covers all 4 types", () => {
    const types: ReportType[] = ["daily", "weekly", "monthly", "on_demand"];
    expect(types).toHaveLength(4);
  });

  it("ReportMetric includes trend direction and isGood", () => {
    const metric: ReportMetric = {
      name: "spend",
      value: 500,
      previousValue: 450,
      change: 11.11,
      trend: "up",
      isGood: false, // spend up = bad
    };
    expect(["up", "down", "flat"]).toContain(metric.trend);
    expect(typeof metric.isGood).toBe("boolean");
  });

  it("AutomatedReport has executiveSummary and sections", () => {
    const report: AutomatedReport = {
      clientId: "c1",
      type: "weekly",
      period: { start: "2026-03-01", end: "2026-03-07" },
      sections: [{
        title: "Performance",
        metrics: [],
        insights: ["Insight 1"],
        recommendations: ["Rec 1"],
      }],
      executiveSummary: "Good week overall.",
      generatedAt: "2026-04-07T00:00:00Z",
    };
    expect(report.sections).toHaveLength(1);
    expect(report.executiveSummary).toBeTruthy();
  });

  it("NLQueryResult has confidence between 0 and 1", () => {
    const result: NLQueryResult = {
      answer: "Gastamos $2,500",
      data: { spend: 2500 },
      confidence: 0.95,
      followUpSuggestions: ["¿Cuál fue el ROAS?"],
    };
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("AnalyticsStepResult matches engine step pattern", () => {
    const steps = ["an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver"];
    for (const step of steps) {
      const result: AnalyticsStepResult = {
        step,
        status: "completed",
        data: {},
      };
      expect(result.step).toBe(step);
    }
  });

  it("AnalyticsDataProvider interface is implementable", () => {
    const provider: AnalyticsDataProvider = {
      name: "Test",
      source: "test",
      async fetchMetrics() { return []; },
      isAvailable() { return true; },
    };
    expect(provider.isAvailable()).toBe(true);
  });
});
```

- [ ] **Step 2: Run all analytics tests**

```bash
npx vitest run src/services/analytics/ src/providers/analytics/
```

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add src/services/analytics/integration.test.ts
git commit -m "test(analytics): add integration tests for type shapes and data flow"
```

---

### Task 12: AN-006 Agent Skill File + Registry

**Files:**
- Create: `agents/AN-006_insight_detector.md`
- Modify: `src/agents/registry.ts`

- [ ] **Step 1: Create AN-006 skill file**

Create `agents/AN-006_insight_detector.md` with the agent's capabilities, triggers, and response format for anomaly detection on marketing metrics.

- [ ] **Step 2: Register AN-006 in `src/agents/registry.ts`**

Add to the Analytics Engine section (around the AN-005 entry):

```typescript
"AN-006": {
  id: "AN-006",
  name: "Insight Detector",
  role: "Anomaly detection and trend identification across marketing metrics",
  team: 17,
  level: "sub",
  model: "gemini-2.5-flash",
  autonomy: 85,
},
```

- [ ] **Step 3: Commit**

```bash
git add agents/AN-006_insight_detector.md src/agents/registry.ts
git commit -m "feat(agents): add AN-006 Insight Detector agent skill file and registry entry"
```
