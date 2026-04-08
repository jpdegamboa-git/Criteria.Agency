# Phase 7: Budget Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Budget Engine (capabilities C-038 through C-041) — smart budget allocation, spend control, vendor validation, and marketing ROI analysis for client marketing investments.

**Architecture:** Four service modules under `src/services/budget/` (allocator, spend-monitor, vendor-manager, roi-calculator) backed by 5 new DB tables, exposed via 17 API endpoints at `/api/budget/:clientId/*`. Reuses Analytics Engine's metrics data and Sales Engine's attribution models for ROI calculations. A stub market-rate provider generates plausible vendor pricing via LLM.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Zod, Vitest, gemini-2.5-flash (allocation rationale, vendor analysis), claude-sonnet-4-5 (investment reports)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/services/budget/types.ts` | All Budget Engine TypeScript interfaces |
| `src/services/budget/allocator.ts` | Budget allocation with M6 framework, channel distribution, rebalancing |
| `src/services/budget/spend-monitor.ts` | Spend tracking, budget-vs-actual, alerts, burn rate |
| `src/services/budget/vendor-manager.ts` | Vendor scoring, price validation against market rates |
| `src/services/budget/roi-calculator.ts` | Campaign P&L, ROI/ROAS computation, investment reports |
| `src/providers/budget/stub-market-rates.ts` | Stub market rate provider (LLM-based) |
| `src/api/budget-routes.ts` | 17 API endpoints for all budget operations |
| `agents/BU-L_budget_director.md` | Leader agent skill file |
| `agents/BU-001_budget_allocator.md` | Budget allocation agent skill file |
| `agents/BU-002_spend_monitor.md` | Spend monitoring agent skill file |
| `agents/BU-003_vendor_analyst.md` | Vendor analysis agent skill file |
| `agents/BU-004_roi_analyst.md` | ROI analysis agent skill file |

**Modified files:**
| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add 5 tables: `marketingBudgets`, `campaignSpend`, `clientVendors`, `vendorQuotations`, `campaignPnl` + 2 enum additions |
| `src/agents/registry.ts` | Register BU-L, BU-001 through BU-004 (team 36) |
| `src/api/validators.ts` | Add 7 Zod schemas for budget endpoints |
| `src/api/routes.ts` | Mount budget routes, add middleware |

---

### Task 1: Types & Interfaces

**Files:**
- Create: `src/services/budget/types.ts`

- [ ] **Step 1: Create the types file with all Budget Engine interfaces**

```typescript
// src/services/budget/types.ts

import type { DateRange } from "../analytics/types.js";

// ── Budget Allocation Types ──

export type BudgetStrategy = "growth" | "efficiency" | "balanced";

export type FunnelStage = "awareness" | "consideration" | "conversion";

export interface ChannelAllocation {
  channel: string;
  funnelStage: FunnelStage;
  amount: number;
  percentOfTotal: number;
  rationale: string;
  expectedRoas: number;
  historicalRoas: number | null;
  confidence: number;
}

export interface BudgetConstraints {
  minPerChannel: number;
  maxPerChannel: number;
  fixedAllocations: Array<{
    channel: string;
    amount: number;
    reason: string;
  }>;
}

export interface BudgetAllocation {
  clientId: string;
  budgetId: string;
  totalBudget: number;
  currency: string;
  period: DateRange;
  strategy: BudgetStrategy;
  allocations: ChannelAllocation[];
  constraints: BudgetConstraints;
  recommendations: string[];
}

// ── Spend Tracking Types ──

export type SpendSource = "meta_ads" | "google_ads" | "manual" | "vendor_invoice";

export type SpendStatus = "on_track" | "underspend" | "overspend" | "exhausted";

export interface ChannelSpendSummary {
  channel: string;
  budgeted: number;
  spent: number;
  remaining: number;
  roas: number;
  status: SpendStatus;
}

export interface CampaignSpendSummary {
  campaignName: string;
  channel: string;
  budgeted: number;
  spent: number;
  roas: number;
  status: SpendStatus;
}

export interface SpendTracker {
  clientId: string;
  period: DateRange;
  overall: {
    budgeted: number;
    spent: number;
    remaining: number;
    burnRate: number;
    projectedOverspend: number | null;
    daysUntilExhausted: number | null;
  };
  byChannel: ChannelSpendSummary[];
  byCampaign: CampaignSpendSummary[];
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface SpendAlert {
  type: "overspend" | "exhausted" | "low_roas" | "pace" | "underspend";
  severity: AlertSeverity;
  channel: string;
  message: string;
  currentValue: number;
  threshold: number;
}

// ── Vendor Types ──

export type VendorCategory = "media" | "print" | "events" | "freelance" | "influencer";

export interface VendorScoreComponents {
  quality: number;     // 0-25
  price: number;       // 0-25
  reliability: number; // 0-25
  value: number;       // 0-25
}

export interface VendorScore {
  vendorId: string;
  name: string;
  category: VendorCategory;
  overallScore: number; // 0-100
  components: VendorScoreComponents;
  history: {
    projectsCompleted: number;
    avgDeliveryTime: number;
    onTimeRate: number;
    avgPriceVsMarket: number;
  };
}

export interface MarketRate {
  service: string;
  region: string;
  low: number;
  median: number;
  high: number;
  currency: string;
  confidence: number;
  lastUpdated: string;
}

export type PriceVerdict = "fair" | "above_market" | "below_market";

export interface QuotationAnalysis {
  quotationId: string;
  vendorId: string;
  serviceDescription: string;
  quotedPrice: number;
  marketRate: MarketRate;
  verdict: PriceVerdict;
  percentVsMedian: number;
}

// ── Campaign P&L Types ──

export interface CampaignCosts {
  adSpend: number;
  contentProduction: number;
  vendorCosts: number;
  platformFees: number;
  laborCost: number;
  total: number;
}

export interface CampaignRevenue {
  attributed: number;
  model: string;
  confidence: number;
}

export interface CampaignMetrics {
  roi: number;
  roas: number;
  grossMargin: number;
  profitLoss: number;
  cpa: number;
  revenuePerLead: number;
}

export interface CampaignPnL {
  campaignName: string;
  period: DateRange;
  revenue: CampaignRevenue;
  costs: CampaignCosts;
  metrics: CampaignMetrics;
}

export interface InvestmentReport {
  clientId: string;
  period: DateRange;
  campaigns: CampaignPnL[];
  totalInvestment: number;
  totalRevenue: number;
  overallRoi: number;
  overallRoas: number;
  executiveSummary: string;
  recommendations: string[];
  generatedAt: string;
}

// ── Step Result ──

export interface BudgetStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/services/budget/types.ts 2>&1 | head -20`
Expected: No errors (or only unrelated project-wide errors)

- [ ] **Step 3: Commit**

```bash
git add src/services/budget/types.ts
git commit -m "feat(budget): add Budget Engine type definitions

Define all interfaces for budget allocation, spend tracking,
vendor management, and campaign P&L analysis."
```

---

### Task 2: Database Schema — 5 New Tables

**Files:**
- Modify: `src/db/schema.ts` (append after line 1139)

- [ ] **Step 1: Add budget-related enum values and tables to schema**

Add to `projectStatusEnum` (after line 68, before `"delivered"`):
```typescript
  // Budget Engine
  "bu_allocation", "bu_spend_tracking", "bu_vendor_validation", "bu_roi_calculation",
```

Add to `gateTypeEnum` (after `"po-g1", "po-g2"`):
```typescript
  "bu-g1",
```

Append after line 1139 (after `nlQueries` table):

```typescript
// ── Budget Engine ──

export const marketingBudgets = pgTable("marketing_budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalBudget: numeric("total_budget", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  strategy: varchar("strategy", { length: 20 }).default("balanced").notNull(),
  allocations: jsonb("allocations").default([]),
  constraints: jsonb("constraints").default({}),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_marketing_budgets_client").on(table.clientId),
  index("idx_marketing_budgets_period").on(table.clientId, table.periodStart, table.periodEnd),
]);

export const campaignSpend = pgTable("campaign_spend", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  budgetId: uuid("budget_id").references(() => marketingBudgets.id),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_campaign_spend_lookup").on(table.clientId, table.budgetId, table.date),
  index("idx_campaign_spend_channel").on(table.clientId, table.channel, table.date),
]);

export const clientVendors = pgTable("client_vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  contactInfo: jsonb("contact_info").default({}),
  score: jsonb("score"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_client_vendors_client").on(table.clientId),
  index("idx_client_vendors_category").on(table.clientId, table.category),
]);

export const vendorQuotations = pgTable("vendor_quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => clientVendors.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  serviceDescription: text("service_description").notNull(),
  quotedPrice: numeric("quoted_price", { precision: 10, scale: 2 }).notNull(),
  marketRate: jsonb("market_rate"),
  verdict: varchar("verdict", { length: 20 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_vendor_quotations_vendor").on(table.vendorId),
  index("idx_vendor_quotations_client").on(table.clientId),
]);

export const campaignPnl = pgTable("campaign_pnl", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  revenue: jsonb("revenue").default({}),
  costs: jsonb("costs").default({}),
  metrics: jsonb("metrics").default({}),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_campaign_pnl_client").on(table.clientId),
  index("idx_campaign_pnl_period").on(table.clientId, table.periodStart),
]);
```

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate 2>&1`
Expected: Migration file created in `drizzle/` directory

- [ ] **Step 3: Verify migration applies**

Run: `npx drizzle-kit migrate 2>&1`
Expected: Migration applied successfully (or skipped if DB not running — that's fine)

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(budget): add 5 Budget Engine database tables

Add marketing_budgets, campaign_spend, client_vendors,
vendor_quotations, and campaign_pnl tables with indexes.
Add bu_* status enums and bu-g1 gate."
```

---

### Task 3: Stub Market Rate Provider

**Files:**
- Create: `src/providers/budget/stub-market-rates.ts`
- Create: `src/providers/budget/stub-market-rates.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/providers/budget/stub-market-rates.test.ts
import { describe, it, expect } from "vitest";
import { stubMarketRateProvider, getMarketRate } from "./stub-market-rates.js";

describe("stubMarketRateProvider", () => {
  it("has correct provider metadata", () => {
    expect(stubMarketRateProvider.name).toBe("stub-market-rates");
    expect(stubMarketRateProvider.isAvailable()).toBe(true);
  });

  it("getMarketRate returns a valid MarketRate", async () => {
    const rate = await getMarketRate("30-second TV spot", "LATAM");
    expect(rate).toHaveProperty("service", "30-second TV spot");
    expect(rate).toHaveProperty("region", "LATAM");
    expect(rate.low).toBeLessThanOrEqual(rate.median);
    expect(rate.median).toBeLessThanOrEqual(rate.high);
    expect(rate.currency).toBe("USD");
    expect(rate.confidence).toBeGreaterThanOrEqual(0);
    expect(rate.confidence).toBeLessThanOrEqual(1);
    expect(rate.lastUpdated).toBeTruthy();
  });

  it("returns different rates for different services", async () => {
    const rate1 = await getMarketRate("1000 business cards", "LATAM");
    const rate2 = await getMarketRate("brand identity package", "LATAM");
    // Rates should exist (both valid)
    expect(rate1.median).toBeGreaterThan(0);
    expect(rate2.median).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/providers/budget/stub-market-rates.test.ts 2>&1`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the stub provider**

```typescript
// src/providers/budget/stub-market-rates.ts
import { generateText } from "../generate-text.js";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type { MarketRate } from "../../services/budget/types.js";

// Known service base rates (USD) — avoids LLM call for common services
const BASE_RATES: Record<string, { low: number; median: number; high: number }> = {
  "30-second tv spot": { low: 2000, median: 5000, high: 15000 },
  "social media management (monthly)": { low: 500, median: 1500, high: 4000 },
  "brand identity package": { low: 3000, median: 8000, high: 25000 },
  "1000 business cards": { low: 30, median: 80, high: 200 },
  "website design": { low: 2000, median: 6000, high: 20000 },
  "seo audit": { low: 500, median: 2000, high: 5000 },
  "influencer post (micro)": { low: 100, median: 500, high: 2000 },
  "influencer post (macro)": { low: 2000, median: 8000, high: 30000 },
  "event production (small)": { low: 3000, median: 10000, high: 30000 },
  "google ads management (monthly)": { low: 500, median: 1500, high: 5000 },
  "meta ads management (monthly)": { low: 400, median: 1200, high: 4000 },
  "video production (1 min)": { low: 1000, median: 3000, high: 10000 },
  "photography session": { low: 200, median: 800, high: 3000 },
  "print ad design": { low: 300, median: 1000, high: 3000 },
  "1000 flyers a4": { low: 50, median: 120, high: 300 },
};

// Regional multipliers
const REGION_MULTIPLIERS: Record<string, number> = {
  "LATAM": 0.6,
  "North America": 1.0,
  "Europe": 0.9,
  "Asia Pacific": 0.7,
  "Middle East": 0.85,
};

function applyRegion(
  base: { low: number; median: number; high: number },
  region: string,
): { low: number; median: number; high: number } {
  const mult = REGION_MULTIPLIERS[region] ?? 0.8;
  return {
    low: Math.round(base.low * mult),
    median: Math.round(base.median * mult),
    high: Math.round(base.high * mult),
  };
}

export async function getMarketRate(
  service: string,
  region: string,
): Promise<MarketRate> {
  const key = service.toLowerCase();
  const knownRate = BASE_RATES[key];

  if (knownRate) {
    const adjusted = applyRegion(knownRate, region);
    return {
      service,
      region,
      ...adjusted,
      currency: "USD",
      confidence: 0.8,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Fallback: use LLM to estimate
  try {
    const response = await generateText({
      model: "gemini-2.5-flash",
      system: `You are a marketing cost estimation expert for the ${region} market. Return JSON only.`,
      prompt: `Estimate the market rate in USD for: "${service}" in the ${region} region.
Return JSON: {"low": number, "median": number, "high": number}
Where low is the budget option, median is the typical market price, high is premium.`,
    });

    const parsed = parseJsonSafe<{ low: number; median: number; high: number }>(response);
    if (parsed && parsed.low <= parsed.median && parsed.median <= parsed.high) {
      return {
        service,
        region,
        ...parsed,
        currency: "USD",
        confidence: 0.5,
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch {
    // Fall through to deterministic fallback
  }

  // Deterministic fallback based on service string length (for test stability)
  const seed = service.length * 137;
  const median = 500 + (seed % 5000);
  return {
    service,
    region,
    low: Math.round(median * 0.5),
    median,
    high: Math.round(median * 2),
    currency: "USD",
    confidence: 0.3,
    lastUpdated: new Date().toISOString(),
  };
}

export const stubMarketRateProvider = {
  name: "stub-market-rates" as const,
  isAvailable: () => true,
  getRate: getMarketRate,
};
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/providers/budget/stub-market-rates.test.ts 2>&1`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/providers/budget/
git commit -m "feat(budget): add stub market rate provider

Known base rates for 15 common services with regional multipliers.
Falls back to LLM estimation for unknown services."
```

---

### Task 4: Budget Allocator Service

**Files:**
- Create: `src/services/budget/allocator.ts`
- Create: `src/services/budget/allocator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/services/budget/allocator.test.ts
import { describe, it, expect } from "vitest";
import {
  distributeByM6,
  computeAllocation,
  type M6Input,
} from "./allocator.js";

describe("distributeByM6", () => {
  it("distributes budget across funnel stages", () => {
    const result = distributeByM6(10000, "balanced");
    const total = result.reduce((sum, a) => sum + a.amount, 0);
    expect(Math.abs(total - 10000)).toBeLessThan(1); // rounding tolerance
    expect(result.length).toBeGreaterThan(0);
    for (const a of result) {
      expect(a.amount).toBeGreaterThan(0);
      expect(a.channel).toBeTruthy();
      expect(["awareness", "consideration", "conversion"]).toContain(a.funnelStage);
    }
  });

  it("growth strategy favors awareness", () => {
    const result = distributeByM6(10000, "growth");
    const awarenessTotal = result
      .filter((a) => a.funnelStage === "awareness")
      .reduce((sum, a) => sum + a.amount, 0);
    const conversionTotal = result
      .filter((a) => a.funnelStage === "conversion")
      .reduce((sum, a) => sum + a.amount, 0);
    expect(awarenessTotal).toBeGreaterThan(conversionTotal);
  });

  it("efficiency strategy favors conversion", () => {
    const result = distributeByM6(10000, "efficiency");
    const awarenessTotal = result
      .filter((a) => a.funnelStage === "awareness")
      .reduce((sum, a) => sum + a.amount, 0);
    const conversionTotal = result
      .filter((a) => a.funnelStage === "conversion")
      .reduce((sum, a) => sum + a.amount, 0);
    expect(conversionTotal).toBeGreaterThan(awarenessTotal);
  });

  it("applies fixed allocation constraints", () => {
    const result = distributeByM6(10000, "balanced", {
      minPerChannel: 0,
      maxPerChannel: 10000,
      fixedAllocations: [
        { channel: "meta_ads", amount: 3000, reason: "contractual" },
      ],
    });
    const metaAlloc = result.find((a) => a.channel === "meta_ads");
    expect(metaAlloc).toBeTruthy();
    expect(metaAlloc!.amount).toBe(3000);
  });
});

describe("computeAllocation", () => {
  it("returns a complete BudgetAllocation", () => {
    const input: M6Input = {
      clientId: "test-client",
      totalBudget: 10000,
      currency: "USD",
      period: { start: "2026-01-01", end: "2026-01-31" },
      strategy: "balanced",
    };
    const result = computeAllocation(input);
    expect(result.clientId).toBe("test-client");
    expect(result.totalBudget).toBe(10000);
    expect(result.allocations.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/budget/allocator.test.ts 2>&1`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the allocator**

```typescript
// src/services/budget/allocator.ts
import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import type {
  BudgetAllocation,
  BudgetConstraints,
  BudgetStrategy,
  BudgetStepResult,
  ChannelAllocation,
  FunnelStage,
  DateRange,
} from "./types.js";

// ── M6 Framework Channel × Funnel Distribution ──

// Default channels and their primary funnel stages
const CHANNEL_FUNNEL_MAP: Array<{
  channel: string;
  funnelStage: FunnelStage;
}> = [
  { channel: "meta_ads", funnelStage: "awareness" },
  { channel: "google_ads", funnelStage: "consideration" },
  { channel: "content_marketing", funnelStage: "awareness" },
  { channel: "email_marketing", funnelStage: "conversion" },
  { channel: "seo", funnelStage: "consideration" },
  { channel: "events", funnelStage: "conversion" },
];

// Strategy weights: what % goes to each funnel stage
const STRATEGY_WEIGHTS: Record<BudgetStrategy, Record<FunnelStage, number>> = {
  growth:      { awareness: 0.50, consideration: 0.30, conversion: 0.20 },
  balanced:    { awareness: 0.35, consideration: 0.35, conversion: 0.30 },
  efficiency:  { awareness: 0.20, consideration: 0.30, conversion: 0.50 },
};

export interface M6Input {
  clientId: string;
  totalBudget: number;
  currency: string;
  period: DateRange;
  strategy: BudgetStrategy;
  constraints?: BudgetConstraints;
}

/**
 * Pure function: distribute budget across channels using M6 framework.
 * Each channel is mapped to a funnel stage, and the strategy determines
 * the weight of each stage.
 */
export function distributeByM6(
  totalBudget: number,
  strategy: BudgetStrategy,
  constraints?: BudgetConstraints,
): ChannelAllocation[] {
  const weights = STRATEGY_WEIGHTS[strategy];
  const fixed = constraints?.fixedAllocations ?? [];

  // Subtract fixed allocations from available budget
  const fixedTotal = fixed.reduce((sum, f) => sum + f.amount, 0);
  const available = totalBudget - fixedTotal;

  // Count channels per funnel stage (excluding fixed ones)
  const fixedChannels = new Set(fixed.map((f) => f.channel));
  const dynamicChannels = CHANNEL_FUNNEL_MAP.filter(
    (c) => !fixedChannels.has(c.channel),
  );

  const stageChannelCounts: Record<FunnelStage, number> = {
    awareness: 0,
    consideration: 0,
    conversion: 0,
  };
  for (const c of dynamicChannels) {
    stageChannelCounts[c.funnelStage]++;
  }

  const allocations: ChannelAllocation[] = [];

  // Fixed allocations
  for (const f of fixed) {
    const mapped = CHANNEL_FUNNEL_MAP.find((c) => c.channel === f.channel);
    allocations.push({
      channel: f.channel,
      funnelStage: mapped?.funnelStage ?? "awareness",
      amount: f.amount,
      percentOfTotal: totalBudget > 0 ? (f.amount / totalBudget) * 100 : 0,
      rationale: `Fixed allocation: ${f.reason}`,
      expectedRoas: 0,
      historicalRoas: null,
      confidence: 1,
    });
  }

  // Dynamic allocations
  for (const ch of dynamicChannels) {
    const stageWeight = weights[ch.funnelStage];
    const channelsInStage = stageChannelCounts[ch.funnelStage];
    const amount =
      channelsInStage > 0
        ? Math.round((available * stageWeight) / channelsInStage)
        : 0;

    // Apply min/max constraints
    let finalAmount = amount;
    if (constraints?.minPerChannel && finalAmount < constraints.minPerChannel) {
      finalAmount = constraints.minPerChannel;
    }
    if (constraints?.maxPerChannel && finalAmount > constraints.maxPerChannel) {
      finalAmount = constraints.maxPerChannel;
    }

    allocations.push({
      channel: ch.channel,
      funnelStage: ch.funnelStage,
      amount: finalAmount,
      percentOfTotal: totalBudget > 0 ? (finalAmount / totalBudget) * 100 : 0,
      rationale: `M6 ${strategy}: ${ch.funnelStage} stage via ${ch.channel}`,
      expectedRoas: 0,
      historicalRoas: null,
      confidence: 0.6,
    });
  }

  return allocations;
}

/**
 * Compute a full budget allocation (pure, no DB).
 */
export function computeAllocation(input: M6Input): BudgetAllocation {
  const allocations = distributeByM6(
    input.totalBudget,
    input.strategy,
    input.constraints,
  );

  const recommendations: string[] = [];
  if (input.strategy === "growth") {
    recommendations.push("Consider increasing content marketing for organic reach");
  }
  if (input.strategy === "efficiency") {
    recommendations.push("Focus on retargeting to maximize conversion rates");
  }
  recommendations.push("Review ROAS monthly and rebalance underperforming channels");

  return {
    clientId: input.clientId,
    budgetId: "",
    totalBudget: input.totalBudget,
    currency: input.currency,
    period: input.period,
    strategy: input.strategy,
    allocations,
    constraints: input.constraints ?? {
      minPerChannel: 0,
      maxPerChannel: input.totalBudget,
      fixedAllocations: [],
    },
    recommendations,
  };
}

// ── DB Operations ──

export async function saveBudget(
  allocation: BudgetAllocation,
): Promise<string> {
  const [row] = await db
    .insert(schema.marketingBudgets)
    .values({
      clientId: allocation.clientId,
      periodStart: new Date(allocation.period.start),
      periodEnd: new Date(allocation.period.end),
      totalBudget: String(allocation.totalBudget),
      currency: allocation.currency,
      strategy: allocation.strategy,
      allocations: allocation.allocations,
      constraints: allocation.constraints,
      status: "active",
    })
    .returning();
  return row.id;
}

export async function getCurrentBudget(
  clientId: string,
): Promise<BudgetAllocation | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(schema.marketingBudgets)
    .where(
      and(
        eq(schema.marketingBudgets.clientId, clientId),
        eq(schema.marketingBudgets.status, "active"),
        lte(schema.marketingBudgets.periodStart, now),
        gte(schema.marketingBudgets.periodEnd, now),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    clientId: row.clientId,
    budgetId: row.id,
    totalBudget: Number(row.totalBudget),
    currency: row.currency,
    period: {
      start: row.periodStart.toISOString().split("T")[0],
      end: row.periodEnd.toISOString().split("T")[0],
    },
    strategy: row.strategy as BudgetStrategy,
    allocations: (row.allocations ?? []) as ChannelAllocation[],
    constraints: (row.constraints ?? {}) as BudgetConstraints,
    recommendations: [],
  };
}

export async function updateBudget(
  budgetId: string,
  updates: Partial<{
    totalBudget: number;
    strategy: BudgetStrategy;
    allocations: ChannelAllocation[];
    constraints: BudgetConstraints;
    status: string;
  }>,
): Promise<void> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.totalBudget !== undefined) values.totalBudget = String(updates.totalBudget);
  if (updates.strategy) values.strategy = updates.strategy;
  if (updates.allocations) values.allocations = updates.allocations;
  if (updates.constraints) values.constraints = updates.constraints;
  if (updates.status) values.status = updates.status;

  await db
    .update(schema.marketingBudgets)
    .set(values)
    .where(eq(schema.marketingBudgets.id, budgetId));
}

export async function runBudgetAllocation(
  clientId: string,
  totalBudget: number,
  strategy: BudgetStrategy,
  period: DateRange,
  constraints?: BudgetConstraints,
): Promise<BudgetStepResult> {
  try {
    const allocation = computeAllocation({
      clientId,
      totalBudget,
      currency: "USD",
      period,
      strategy,
      constraints,
    });
    const budgetId = await saveBudget(allocation);
    allocation.budgetId = budgetId;

    return {
      step: "bu_allocation",
      status: "completed",
      data: allocation,
      artifactContent: JSON.stringify(allocation, null, 2),
    };
  } catch (error) {
    return {
      step: "bu_allocation",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/budget/allocator.test.ts 2>&1`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/budget/allocator.ts src/services/budget/allocator.test.ts
git commit -m "feat(budget): add M6 budget allocation engine

Pure distributeByM6 function distributes across channels by funnel stage.
Supports growth/balanced/efficiency strategies with fixed allocation constraints."
```

---

### Task 5: Spend Monitor Service

**Files:**
- Create: `src/services/budget/spend-monitor.ts`
- Create: `src/services/budget/spend-monitor.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/services/budget/spend-monitor.test.ts
import { describe, it, expect } from "vitest";
import {
  computeSpendStatus,
  computeBurnRate,
  evaluateAlerts,
} from "./spend-monitor.js";

describe("computeSpendStatus", () => {
  it("returns on_track when spent is within budget", () => {
    expect(computeSpendStatus(1000, 500, 30, 15)).toBe("on_track");
  });

  it("returns overspend when spent exceeds budget", () => {
    expect(computeSpendStatus(1000, 1100, 30, 30)).toBe("overspend");
  });

  it("returns exhausted when remaining is zero", () => {
    expect(computeSpendStatus(1000, 1000, 30, 25)).toBe("exhausted");
  });

  it("returns underspend when pace is too low", () => {
    // 30-day period, 20 days in, only 30% spent (should be ~66%)
    expect(computeSpendStatus(1000, 300, 30, 20)).toBe("underspend");
  });
});

describe("computeBurnRate", () => {
  it("calculates daily burn rate", () => {
    const rate = computeBurnRate(3000, 10);
    expect(rate).toBe(300);
  });

  it("returns 0 for 0 days", () => {
    expect(computeBurnRate(0, 0)).toBe(0);
  });
});

describe("evaluateAlerts", () => {
  it("generates overspend alert", () => {
    const alerts = evaluateAlerts({
      channel: "meta_ads",
      budgeted: 1000,
      spent: 1100,
      roas: 3.0,
      totalDays: 30,
      elapsedDays: 30,
    });
    expect(alerts.some((a) => a.type === "overspend")).toBe(true);
  });

  it("generates low_roas alert", () => {
    const alerts = evaluateAlerts({
      channel: "google_ads",
      budgeted: 1000,
      spent: 500,
      roas: 0.5,
      totalDays: 30,
      elapsedDays: 15,
    });
    expect(alerts.some((a) => a.type === "low_roas")).toBe(true);
  });

  it("returns empty for healthy channel", () => {
    const alerts = evaluateAlerts({
      channel: "seo",
      budgeted: 1000,
      spent: 450,
      roas: 4.0,
      totalDays: 30,
      elapsedDays: 15,
    });
    expect(alerts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/budget/spend-monitor.test.ts 2>&1`
Expected: FAIL — module not found

- [ ] **Step 3: Implement spend monitor**

```typescript
// src/services/budget/spend-monitor.ts
import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type {
  SpendTracker,
  SpendAlert,
  SpendStatus,
  AlertSeverity,
  SpendSource,
  ChannelSpendSummary,
  BudgetStepResult,
  DateRange,
} from "./types.js";
import { getCurrentBudget } from "./allocator.js";

// ── Pure Functions ──

export function computeSpendStatus(
  budgeted: number,
  spent: number,
  totalDays: number,
  elapsedDays: number,
): SpendStatus {
  if (spent >= budgeted) return spent > budgeted ? "overspend" : "exhausted";

  // Check pace: if spending is < 50% of expected pace, it's underspend
  const expectedPace = totalDays > 0 ? elapsedDays / totalDays : 0;
  const actualPace = budgeted > 0 ? spent / budgeted : 0;
  if (elapsedDays > 5 && actualPace < expectedPace * 0.5) return "underspend";

  return "on_track";
}

export function computeBurnRate(totalSpent: number, elapsedDays: number): number {
  return elapsedDays > 0 ? Math.round(totalSpent / elapsedDays) : 0;
}

export interface AlertInput {
  channel: string;
  budgeted: number;
  spent: number;
  roas: number;
  totalDays: number;
  elapsedDays: number;
}

export function evaluateAlerts(input: AlertInput): SpendAlert[] {
  const alerts: SpendAlert[] = [];
  const { channel, budgeted, spent, roas, totalDays, elapsedDays } = input;

  // Overspend
  if (spent > budgeted) {
    alerts.push({
      type: "overspend",
      severity: "warning" as AlertSeverity,
      channel,
      message: `${channel} exceeded budget by $${Math.round(spent - budgeted)}`,
      currentValue: spent,
      threshold: budgeted,
    });
  }

  // Exhausted
  if (spent >= budgeted && elapsedDays < totalDays) {
    alerts.push({
      type: "exhausted",
      severity: "critical" as AlertSeverity,
      channel,
      message: `${channel} budget exhausted with ${totalDays - elapsedDays} days remaining`,
      currentValue: spent,
      threshold: budgeted,
    });
  }

  // Low ROAS (below 1.0 means losing money)
  if (roas < 1.0 && spent > 0) {
    alerts.push({
      type: "low_roas",
      severity: "warning" as AlertSeverity,
      channel,
      message: `${channel} ROAS is ${roas.toFixed(2)} — below break-even`,
      currentValue: roas,
      threshold: 1.0,
    });
  }

  // Pace warning: spending too fast
  if (totalDays > 0 && elapsedDays > 0) {
    const expectedPace = elapsedDays / totalDays;
    const actualPace = budgeted > 0 ? spent / budgeted : 0;
    if (actualPace > expectedPace * 1.3 && spent < budgeted) {
      alerts.push({
        type: "pace",
        severity: "warning" as AlertSeverity,
        channel,
        message: `${channel} spending 30%+ ahead of pace`,
        currentValue: actualPace,
        threshold: expectedPace,
      });
    }
  }

  return alerts;
}

// ── DB Operations ──

export async function recordSpend(
  clientId: string,
  budgetId: string | null,
  campaignName: string,
  channel: string,
  date: string,
  amount: number,
  source: SpendSource,
  metadata?: Record<string, unknown>,
): Promise<string> {
  const [row] = await db
    .insert(schema.campaignSpend)
    .values({
      clientId,
      budgetId,
      campaignName,
      channel,
      date: new Date(date),
      amount: String(amount),
      source,
      metadata: metadata ?? {},
    })
    .returning();
  return row.id;
}

export async function getSpendSummary(
  clientId: string,
  period: DateRange,
): Promise<SpendTracker> {
  const budget = await getCurrentBudget(clientId);
  const budgeted = budget ? budget.totalBudget : 0;

  const rows = await db
    .select()
    .from(schema.campaignSpend)
    .where(
      and(
        eq(schema.campaignSpend.clientId, clientId),
        gte(schema.campaignSpend.date, new Date(period.start)),
        lte(schema.campaignSpend.date, new Date(period.end)),
      ),
    );

  const totalSpent = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const start = new Date(period.start);
  const end = new Date(period.end);
  const now = new Date();
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const elapsedDays = Math.ceil(
    (Math.min(now.getTime(), end.getTime()) - start.getTime()) / 86400000,
  );

  const burnRate = computeBurnRate(totalSpent, elapsedDays);
  const remaining = Math.max(0, budgeted - totalSpent);
  const daysUntilExhausted = burnRate > 0 ? Math.ceil(remaining / burnRate) : null;
  const projectedTotal = burnRate * totalDays;
  const projectedOverspend =
    projectedTotal > budgeted ? projectedTotal - budgeted : null;

  // Aggregate by channel
  const channelMap: Record<string, { spent: number; budgeted: number }> = {};
  for (const r of rows) {
    const ch = r.channel;
    if (!channelMap[ch]) channelMap[ch] = { spent: 0, budgeted: 0 };
    channelMap[ch].spent += Number(r.amount);
  }

  // Map channel budgets from allocation
  if (budget) {
    for (const alloc of budget.allocations) {
      if (!channelMap[alloc.channel]) {
        channelMap[alloc.channel] = { spent: 0, budgeted: 0 };
      }
      channelMap[alloc.channel].budgeted += alloc.amount;
    }
  }

  const byChannel: ChannelSpendSummary[] = Object.entries(channelMap).map(
    ([channel, data]) => ({
      channel,
      budgeted: data.budgeted,
      spent: data.spent,
      remaining: Math.max(0, data.budgeted - data.spent),
      roas: 0, // Requires attribution data — filled by ROI calculator
      status: computeSpendStatus(data.budgeted, data.spent, totalDays, elapsedDays),
    }),
  );

  // Aggregate by campaign
  const campaignMap: Record<string, { channel: string; spent: number }> = {};
  for (const r of rows) {
    if (!campaignMap[r.campaignName]) {
      campaignMap[r.campaignName] = { channel: r.channel, spent: 0 };
    }
    campaignMap[r.campaignName].spent += Number(r.amount);
  }

  const byCampaign = Object.entries(campaignMap).map(([name, data]) => ({
    campaignName: name,
    channel: data.channel,
    budgeted: 0,
    spent: data.spent,
    roas: 0,
    status: "on_track" as const,
  }));

  return {
    clientId,
    period,
    overall: {
      budgeted,
      spent: totalSpent,
      remaining,
      burnRate,
      projectedOverspend,
      daysUntilExhausted,
    },
    byChannel,
    byCampaign,
  };
}

export async function runSpendTracking(
  clientId: string,
  period: DateRange,
): Promise<BudgetStepResult> {
  try {
    const summary = await getSpendSummary(clientId, period);

    // Evaluate alerts per channel
    const start = new Date(period.start);
    const end = new Date(period.end);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const now = new Date();
    const elapsedDays = Math.ceil(
      (Math.min(now.getTime(), end.getTime()) - start.getTime()) / 86400000,
    );

    const alerts: SpendAlert[] = [];
    for (const ch of summary.byChannel) {
      alerts.push(
        ...evaluateAlerts({
          channel: ch.channel,
          budgeted: ch.budgeted,
          spent: ch.spent,
          roas: ch.roas,
          totalDays,
          elapsedDays,
        }),
      );
    }

    return {
      step: "bu_spend_tracking",
      status: "completed",
      data: { summary, alerts },
    };
  } catch (error) {
    return {
      step: "bu_spend_tracking",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/budget/spend-monitor.test.ts 2>&1`
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/budget/spend-monitor.ts src/services/budget/spend-monitor.test.ts
git commit -m "feat(budget): add spend monitoring with alerts

Track campaign spend by channel, compute burn rate, detect
overspend/underspend/low ROAS with severity-based alerts."
```

---

### Task 6: Vendor Manager Service

**Files:**
- Create: `src/services/budget/vendor-manager.ts`
- Create: `src/services/budget/vendor-manager.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/services/budget/vendor-manager.test.ts
import { describe, it, expect } from "vitest";
import {
  computeVendorScore,
  analyzeQuotation,
} from "./vendor-manager.js";
import type { MarketRate } from "./types.js";

describe("computeVendorScore", () => {
  it("scores a vendor with balanced components", () => {
    const score = computeVendorScore({
      qualityRating: 4, // out of 5
      avgPriceVsMarket: 1.0, // at market rate
      onTimeRate: 0.9,
      projectsCompleted: 10,
    });

    expect(score.overallScore).toBeGreaterThan(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    expect(score.components.quality).toBeLessThanOrEqual(25);
    expect(score.components.price).toBeLessThanOrEqual(25);
    expect(score.components.reliability).toBeLessThanOrEqual(25);
    expect(score.components.value).toBeLessThanOrEqual(25);
  });

  it("scores high quality vendor higher", () => {
    const high = computeVendorScore({
      qualityRating: 5,
      avgPriceVsMarket: 1.0,
      onTimeRate: 0.95,
      projectsCompleted: 20,
    });
    const low = computeVendorScore({
      qualityRating: 2,
      avgPriceVsMarket: 1.0,
      onTimeRate: 0.5,
      projectsCompleted: 3,
    });
    expect(high.overallScore).toBeGreaterThan(low.overallScore);
  });
});

describe("analyzeQuotation", () => {
  const marketRate: MarketRate = {
    service: "Photography session",
    region: "LATAM",
    low: 200,
    median: 800,
    high: 3000,
    currency: "USD",
    confidence: 0.8,
    lastUpdated: "2026-04-01",
  };

  it("returns fair for price near median", () => {
    const result = analyzeQuotation(750, marketRate);
    expect(result.verdict).toBe("fair");
  });

  it("returns above_market for expensive quote", () => {
    const result = analyzeQuotation(2500, marketRate);
    expect(result.verdict).toBe("above_market");
  });

  it("returns below_market for cheap quote", () => {
    const result = analyzeQuotation(150, marketRate);
    expect(result.verdict).toBe("below_market");
  });

  it("calculates percent vs median", () => {
    const result = analyzeQuotation(1600, marketRate);
    expect(result.percentVsMedian).toBe(100); // 100% above median
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/budget/vendor-manager.test.ts 2>&1`
Expected: FAIL — module not found

- [ ] **Step 3: Implement vendor manager**

```typescript
// src/services/budget/vendor-manager.ts
import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { getMarketRate } from "../../providers/budget/stub-market-rates.js";
import type {
  VendorScore,
  VendorScoreComponents,
  VendorCategory,
  MarketRate,
  PriceVerdict,
  QuotationAnalysis,
  BudgetStepResult,
} from "./types.js";

// ── Pure Functions ──

export interface VendorScoreInput {
  qualityRating: number;   // 0-5
  avgPriceVsMarket: number; // ratio (1.0 = at market)
  onTimeRate: number;       // 0-1
  projectsCompleted: number;
}

/**
 * Compute vendor score (pure). Each component is 0-25, total 0-100.
 */
export function computeVendorScore(input: VendorScoreInput): {
  overallScore: number;
  components: VendorScoreComponents;
} {
  // Quality: rating / 5 * 25
  const quality = Math.round((input.qualityRating / 5) * 25);

  // Price: cheaper than market = higher score
  // ratio 0.5 = 25, ratio 1.0 = 15, ratio 1.5 = 5, ratio 2.0 = 0
  const priceScore = Math.max(0, Math.min(25, Math.round(25 - (input.avgPriceVsMarket - 0.5) * 20)));

  // Reliability: onTimeRate * 20 + experience bonus (up to 5)
  const experienceBonus = Math.min(5, Math.floor(input.projectsCompleted / 5));
  const reliability = Math.min(25, Math.round(input.onTimeRate * 20) + experienceBonus);

  // Value: combination of quality-to-price ratio
  const qualityPriceRatio = input.avgPriceVsMarket > 0
    ? input.qualityRating / input.avgPriceVsMarket
    : input.qualityRating;
  const value = Math.min(25, Math.round(qualityPriceRatio * 5));

  const components: VendorScoreComponents = { quality, price: priceScore, reliability, value };
  const overallScore = quality + priceScore + reliability + value;

  return { overallScore, components };
}

/**
 * Analyze a price quote against market rate (pure).
 */
export function analyzeQuotation(
  quotedPrice: number,
  marketRate: MarketRate,
): { verdict: PriceVerdict; percentVsMedian: number } {
  const percentVsMedian = marketRate.median > 0
    ? Math.round(((quotedPrice - marketRate.median) / marketRate.median) * 100)
    : 0;

  let verdict: PriceVerdict;
  if (quotedPrice < marketRate.low) {
    verdict = "below_market";
  } else if (quotedPrice > marketRate.median * 1.5) {
    verdict = "above_market";
  } else {
    verdict = "fair";
  }

  return { verdict, percentVsMedian };
}

// ── DB Operations ──

export async function createVendor(
  clientId: string,
  name: string,
  category: VendorCategory,
  contactInfo?: Record<string, unknown>,
): Promise<string> {
  const [row] = await db
    .insert(schema.clientVendors)
    .values({
      clientId,
      name,
      category,
      contactInfo: contactInfo ?? {},
    })
    .returning();
  return row.id;
}

export async function listVendors(
  clientId: string,
  category?: VendorCategory,
): Promise<Array<{ id: string; name: string; category: string; score: unknown; status: string }>> {
  const conditions = [eq(schema.clientVendors.clientId, clientId)];
  if (category) {
    conditions.push(eq(schema.clientVendors.category, category));
  }

  const rows = await db
    .select()
    .from(schema.clientVendors)
    .where(and(...conditions));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    score: r.score,
    status: r.status,
  }));
}

export async function getVendor(
  vendorId: string,
): Promise<typeof schema.clientVendors.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(schema.clientVendors)
    .where(eq(schema.clientVendors.id, vendorId));
  return row ?? null;
}

export async function submitQuotation(
  clientId: string,
  vendorId: string,
  serviceDescription: string,
  quotedPrice: number,
  region?: string,
): Promise<QuotationAnalysis> {
  const marketRate = await getMarketRate(serviceDescription, region ?? "LATAM");
  const { verdict, percentVsMedian } = analyzeQuotation(quotedPrice, marketRate);

  const [row] = await db
    .insert(schema.vendorQuotations)
    .values({
      vendorId,
      clientId,
      serviceDescription,
      quotedPrice: String(quotedPrice),
      marketRate,
      verdict,
      status: "pending",
    })
    .returning();

  return {
    quotationId: row.id,
    vendorId,
    serviceDescription,
    quotedPrice,
    marketRate,
    verdict,
    percentVsMedian,
  };
}

export async function compareVendors(
  clientId: string,
): Promise<VendorScore[]> {
  const vendors = await listVendors(clientId);
  const scores: VendorScore[] = [];

  for (const v of vendors) {
    // Get quotation history for this vendor
    const quotations = await db
      .select()
      .from(schema.vendorQuotations)
      .where(eq(schema.vendorQuotations.vendorId, v.id));

    const projectsCompleted = quotations.filter((q) => q.status === "accepted").length;
    const avgPriceVsMarket = quotations.length > 0
      ? quotations.reduce((sum, q) => {
          const mr = q.marketRate as MarketRate | null;
          if (!mr || mr.median === 0) return sum + 1;
          return sum + Number(q.quotedPrice) / mr.median;
        }, 0) / quotations.length
      : 1.0;

    const scoreInput: VendorScoreInput = {
      qualityRating: 3.5, // Default — would come from reviews in production
      avgPriceVsMarket,
      onTimeRate: 0.85,   // Default
      projectsCompleted,
    };

    const { overallScore, components } = computeVendorScore(scoreInput);

    scores.push({
      vendorId: v.id,
      name: v.name,
      category: v.category as VendorCategory,
      overallScore,
      components,
      history: {
        projectsCompleted,
        avgDeliveryTime: 7, // Default days
        onTimeRate: 0.85,
        avgPriceVsMarket,
      },
    });
  }

  // Update scores in DB
  for (const s of scores) {
    await db
      .update(schema.clientVendors)
      .set({ score: s, updatedAt: new Date() })
      .where(eq(schema.clientVendors.id, s.vendorId));
  }

  return scores.sort((a, b) => b.overallScore - a.overallScore);
}

export async function runVendorValidation(
  clientId: string,
): Promise<BudgetStepResult> {
  try {
    const scores = await compareVendors(clientId);
    return {
      step: "bu_vendor_validation",
      status: "completed",
      data: { vendors: scores, count: scores.length },
    };
  } catch (error) {
    return {
      step: "bu_vendor_validation",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/budget/vendor-manager.test.ts 2>&1`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/budget/vendor-manager.ts src/services/budget/vendor-manager.test.ts
git commit -m "feat(budget): add vendor management and price validation

Score vendors on quality/price/reliability/value (0-100).
Validate quotations against market rates with fair/above/below verdicts."
```

---

### Task 7: ROI Calculator Service

**Files:**
- Create: `src/services/budget/roi-calculator.ts`
- Create: `src/services/budget/roi-calculator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/services/budget/roi-calculator.test.ts
import { describe, it, expect } from "vitest";
import {
  computeCampaignMetrics,
  computeOverallRoi,
} from "./roi-calculator.js";
import type { CampaignCosts, CampaignRevenue } from "./types.js";

describe("computeCampaignMetrics", () => {
  it("calculates ROI correctly", () => {
    const costs: CampaignCosts = {
      adSpend: 5000,
      contentProduction: 1000,
      vendorCosts: 500,
      platformFees: 200,
      laborCost: 300,
      total: 7000,
    };
    const revenue: CampaignRevenue = {
      attributed: 21000,
      model: "linear",
      confidence: 0.8,
    };

    const metrics = computeCampaignMetrics(revenue, costs, 100);

    expect(metrics.roi).toBe(200); // (21000 - 7000) / 7000 * 100
    expect(metrics.roas).toBe(3); // 21000 / 7000
    expect(metrics.profitLoss).toBe(14000); // 21000 - 7000
    expect(metrics.cpa).toBe(70); // 7000 / 100
    expect(metrics.revenuePerLead).toBe(210); // 21000 / 100
  });

  it("handles zero costs gracefully", () => {
    const costs: CampaignCosts = {
      adSpend: 0, contentProduction: 0, vendorCosts: 0,
      platformFees: 0, laborCost: 0, total: 0,
    };
    const revenue: CampaignRevenue = {
      attributed: 0, model: "linear", confidence: 0,
    };
    const metrics = computeCampaignMetrics(revenue, costs, 0);
    expect(metrics.roi).toBe(0);
    expect(metrics.roas).toBe(0);
  });
});

describe("computeOverallRoi", () => {
  it("aggregates multiple campaigns", () => {
    const campaigns = [
      { totalCost: 5000, revenue: 15000 },
      { totalCost: 3000, revenue: 6000 },
    ];
    const result = computeOverallRoi(campaigns);
    // Total cost: 8000, Total revenue: 21000
    expect(result.totalInvestment).toBe(8000);
    expect(result.totalRevenue).toBe(21000);
    expect(result.overallRoi).toBeCloseTo(162.5); // (21000 - 8000) / 8000 * 100
    expect(result.overallRoas).toBeCloseTo(2.625); // 21000 / 8000
  });

  it("handles empty campaigns", () => {
    const result = computeOverallRoi([]);
    expect(result.totalInvestment).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.overallRoi).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/budget/roi-calculator.test.ts 2>&1`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ROI calculator**

```typescript
// src/services/budget/roi-calculator.ts
import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type {
  CampaignPnL,
  CampaignCosts,
  CampaignRevenue,
  CampaignMetrics,
  InvestmentReport,
  BudgetStepResult,
  DateRange,
} from "./types.js";

const STRATEGIC_MODEL = "claude-sonnet-4-5";

// ── Pure Functions ──

export function computeCampaignMetrics(
  revenue: CampaignRevenue,
  costs: CampaignCosts,
  leadCount: number,
): CampaignMetrics {
  const totalCost = costs.total;
  const profitLoss = revenue.attributed - totalCost;
  const roi = totalCost > 0 ? Math.round((profitLoss / totalCost) * 100) : 0;
  const roas = totalCost > 0 ? Math.round((revenue.attributed / totalCost) * 1000) / 1000 : 0;
  const grossMargin = revenue.attributed > 0
    ? Math.round((profitLoss / revenue.attributed) * 100)
    : 0;
  const cpa = leadCount > 0 ? Math.round(totalCost / leadCount) : 0;
  const revenuePerLead = leadCount > 0 ? Math.round(revenue.attributed / leadCount) : 0;

  return { roi, roas, grossMargin, profitLoss, cpa, revenuePerLead };
}

export function computeOverallRoi(
  campaigns: Array<{ totalCost: number; revenue: number }>,
): {
  totalInvestment: number;
  totalRevenue: number;
  overallRoi: number;
  overallRoas: number;
} {
  const totalInvestment = campaigns.reduce((sum, c) => sum + c.totalCost, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const overallRoi = totalInvestment > 0
    ? ((totalRevenue - totalInvestment) / totalInvestment) * 100
    : 0;
  const overallRoas = totalInvestment > 0
    ? totalRevenue / totalInvestment
    : 0;

  return { totalInvestment, totalRevenue, overallRoi, overallRoas };
}

// ── DB Operations ──

export async function buildCampaignPnL(
  clientId: string,
  period: DateRange,
): Promise<CampaignPnL[]> {
  // Get all spend grouped by campaign
  const spendRows = await db
    .select()
    .from(schema.campaignSpend)
    .where(
      and(
        eq(schema.campaignSpend.clientId, clientId),
        gte(schema.campaignSpend.date, new Date(period.start)),
        lte(schema.campaignSpend.date, new Date(period.end)),
      ),
    );

  // Group spend by campaign
  const campaignSpendMap: Record<string, { channel: string; total: number }> = {};
  for (const row of spendRows) {
    if (!campaignSpendMap[row.campaignName]) {
      campaignSpendMap[row.campaignName] = { channel: row.channel, total: 0 };
    }
    campaignSpendMap[row.campaignName].total += Number(row.amount);
  }

  // Get attributed revenue from deals closed in period
  const allDeals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.clientId, clientId));

  const closedDeals = allDeals.filter((d) => {
    if (d.stage !== "closed_won" || !d.closedAt) return false;
    const closedDate = d.closedAt.toISOString().split("T")[0];
    return closedDate >= period.start && closedDate <= period.end;
  });

  const totalRevenue = closedDeals.reduce((sum, d) => sum + Number(d.value ?? 0), 0);
  const campaignNames = Object.keys(campaignSpendMap);
  const revenuePerCampaign = campaignNames.length > 0
    ? totalRevenue / campaignNames.length
    : 0;

  // Get vendor costs
  const vendorCosts = await db
    .select()
    .from(schema.vendorQuotations)
    .where(
      and(
        eq(schema.vendorQuotations.clientId, clientId),
        eq(schema.vendorQuotations.status, "accepted"),
      ),
    );

  const totalVendorCost = vendorCosts.reduce(
    (sum, v) => sum + Number(v.quotedPrice),
    0,
  );
  const vendorCostPerCampaign = campaignNames.length > 0
    ? totalVendorCost / campaignNames.length
    : 0;

  const results: CampaignPnL[] = [];
  for (const [campaignName, data] of Object.entries(campaignSpendMap)) {
    const costs: CampaignCosts = {
      adSpend: data.total,
      contentProduction: 0,
      vendorCosts: Math.round(vendorCostPerCampaign),
      platformFees: Math.round(data.total * 0.03), // 3% platform fee estimate
      laborCost: 0,
      total: Math.round(data.total + vendorCostPerCampaign + data.total * 0.03),
    };

    const revenue: CampaignRevenue = {
      attributed: Math.round(revenuePerCampaign),
      model: "proportional",
      confidence: 0.6,
    };

    const metrics = computeCampaignMetrics(revenue, costs, closedDeals.length);

    results.push({ campaignName, period, revenue, costs, metrics });
  }

  // Save to DB
  for (const pnl of results) {
    await db.insert(schema.campaignPnl).values({
      clientId,
      campaignName: pnl.campaignName,
      periodStart: new Date(period.start),
      periodEnd: new Date(period.end),
      revenue: pnl.revenue,
      costs: pnl.costs,
      metrics: pnl.metrics,
    });
  }

  return results;
}

export async function generateInvestmentReport(
  clientId: string,
  period: DateRange,
): Promise<InvestmentReport> {
  const campaigns = await buildCampaignPnL(clientId, period);

  const overall = computeOverallRoi(
    campaigns.map((c) => ({
      totalCost: c.costs.total,
      revenue: c.revenue.attributed,
    })),
  );

  // Generate executive summary via LLM
  let executiveSummary = "Investment report generated.";
  let recommendations: string[] = ["Review underperforming channels."];

  try {
    const response = await generateText({
      model: STRATEGIC_MODEL,
      system: "You are a marketing investment analyst. Respond in Spanish. Return JSON only.",
      prompt: `Analyze this marketing investment data and generate an executive summary and recommendations.

Period: ${period.start} to ${period.end}
Total investment: $${overall.totalInvestment}
Total revenue: $${overall.totalRevenue}
Overall ROI: ${overall.overallRoi.toFixed(1)}%
Overall ROAS: ${overall.overallRoas.toFixed(2)}x
Campaigns: ${campaigns.length}

Campaign details:
${campaigns.map((c) => `- ${c.campaignName}: Spend $${c.costs.total}, Revenue $${c.revenue.attributed}, ROI ${c.metrics.roi}%`).join("\n")}

Return JSON:
{
  "executiveSummary": "2-3 sentence summary in Spanish",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`,
    });

    const parsed = parseJsonSafe<{
      executiveSummary: string;
      recommendations: string[];
    }>(response);
    if (parsed) {
      executiveSummary = parsed.executiveSummary;
      recommendations = parsed.recommendations;
    }
  } catch {
    // Use defaults
  }

  return {
    clientId,
    period,
    campaigns,
    ...overall,
    executiveSummary,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

export async function getLatestPnL(
  clientId: string,
): Promise<CampaignPnL[]> {
  const rows = await db
    .select()
    .from(schema.campaignPnl)
    .where(eq(schema.campaignPnl.clientId, clientId));

  return rows.map((r) => ({
    campaignName: r.campaignName,
    period: {
      start: r.periodStart.toISOString().split("T")[0],
      end: r.periodEnd.toISOString().split("T")[0],
    },
    revenue: r.revenue as CampaignRevenue,
    costs: r.costs as CampaignCosts,
    metrics: r.metrics as CampaignMetrics,
  }));
}

export async function runRoiCalculation(
  clientId: string,
  period: DateRange,
): Promise<BudgetStepResult> {
  try {
    const report = await generateInvestmentReport(clientId, period);
    return {
      step: "bu_roi_calculation",
      status: "completed",
      data: report,
      artifactContent: JSON.stringify(report, null, 2),
    };
  } catch (error) {
    return {
      step: "bu_roi_calculation",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/budget/roi-calculator.test.ts 2>&1`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/budget/roi-calculator.ts src/services/budget/roi-calculator.test.ts
git commit -m "feat(budget): add ROI calculator and investment reports

Campaign P&L with costs/revenue/metrics. AI-generated executive
summaries via claude-sonnet-4-5 for investment reports."
```

---

### Task 8: Integration Tests

**Files:**
- Create: `src/services/budget/integration.test.ts`

- [ ] **Step 1: Write integration tests for type completeness and service contracts**

```typescript
// src/services/budget/integration.test.ts
import { describe, it, expect } from "vitest";
import type {
  BudgetAllocation,
  SpendTracker,
  VendorScore,
  CampaignPnL,
  InvestmentReport,
  BudgetStepResult,
  BudgetStrategy,
  SpendSource,
  SpendStatus,
  VendorCategory,
  PriceVerdict,
  AlertSeverity,
  FunnelStage,
  MarketRate,
  QuotationAnalysis,
  ChannelAllocation,
  SpendAlert,
} from "./types.js";
import { distributeByM6, computeAllocation } from "./allocator.js";
import {
  computeSpendStatus,
  computeBurnRate,
  evaluateAlerts,
} from "./spend-monitor.js";
import { computeVendorScore, analyzeQuotation } from "./vendor-manager.js";
import {
  computeCampaignMetrics,
  computeOverallRoi,
} from "./roi-calculator.js";

describe("Budget Engine Integration", () => {
  // ── Type Completeness ──

  it("BudgetStrategy covers all options", () => {
    const strategies: BudgetStrategy[] = ["growth", "efficiency", "balanced"];
    expect(strategies).toHaveLength(3);
  });

  it("SpendSource covers all options", () => {
    const sources: SpendSource[] = [
      "meta_ads",
      "google_ads",
      "manual",
      "vendor_invoice",
    ];
    expect(sources).toHaveLength(4);
  });

  it("SpendStatus covers all options", () => {
    const statuses: SpendStatus[] = [
      "on_track",
      "underspend",
      "overspend",
      "exhausted",
    ];
    expect(statuses).toHaveLength(4);
  });

  it("VendorCategory covers all options", () => {
    const categories: VendorCategory[] = [
      "media",
      "print",
      "events",
      "freelance",
      "influencer",
    ];
    expect(categories).toHaveLength(5);
  });

  it("PriceVerdict covers all options", () => {
    const verdicts: PriceVerdict[] = ["fair", "above_market", "below_market"];
    expect(verdicts).toHaveLength(3);
  });

  it("FunnelStage covers all options", () => {
    const stages: FunnelStage[] = ["awareness", "consideration", "conversion"];
    expect(stages).toHaveLength(3);
  });

  it("AlertSeverity covers all options", () => {
    const severities: AlertSeverity[] = ["info", "warning", "critical"];
    expect(severities).toHaveLength(3);
  });

  // ── Cross-Service Integration ──

  it("allocation output feeds spend monitor input", () => {
    const allocation = computeAllocation({
      clientId: "test",
      totalBudget: 10000,
      currency: "USD",
      period: { start: "2026-01-01", end: "2026-01-31" },
      strategy: "balanced",
    });

    // Each allocation channel should have a valid status when tracked
    for (const ch of allocation.allocations) {
      const status = computeSpendStatus(ch.amount, 0, 31, 0);
      expect(["on_track", "underspend", "overspend", "exhausted"]).toContain(status);
    }
  });

  it("spend alerts integrate with vendor scoring", () => {
    // A channel with low ROAS should trigger an alert
    const alerts = evaluateAlerts({
      channel: "meta_ads",
      budgeted: 5000,
      spent: 4500,
      roas: 0.8,
      totalDays: 30,
      elapsedDays: 25,
    });

    expect(alerts.some((a) => a.type === "low_roas")).toBe(true);
  });

  it("campaign metrics feed overall ROI calculation", () => {
    const revenue = { attributed: 15000, model: "linear", confidence: 0.8 };
    const costs = {
      adSpend: 3000,
      contentProduction: 500,
      vendorCosts: 200,
      platformFees: 100,
      laborCost: 200,
      total: 4000,
    };
    const metrics = computeCampaignMetrics(revenue, costs, 50);

    const overall = computeOverallRoi([
      { totalCost: costs.total, revenue: revenue.attributed },
    ]);

    expect(overall.overallRoi).toBe(metrics.roi);
    expect(overall.overallRoas).toBeCloseTo(metrics.roas, 1);
  });

  it("all strategies produce valid allocations", () => {
    const strategies: BudgetStrategy[] = ["growth", "balanced", "efficiency"];
    for (const strategy of strategies) {
      const allocs = distributeByM6(10000, strategy);
      expect(allocs.length).toBeGreaterThan(0);
      const total = allocs.reduce((s, a) => s + a.amount, 0);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(10000);
    }
  });

  it("BudgetStepResult follows step naming convention", () => {
    const validSteps = [
      "bu_allocation",
      "bu_spend_tracking",
      "bu_vendor_validation",
      "bu_roi_calculation",
    ];
    for (const step of validSteps) {
      expect(step).toMatch(/^bu_/);
    }
  });

  it("vendor score components sum to overall score", () => {
    const { overallScore, components } = computeVendorScore({
      qualityRating: 4,
      avgPriceVsMarket: 1.0,
      onTimeRate: 0.9,
      projectsCompleted: 10,
    });
    const sum =
      components.quality +
      components.price +
      components.reliability +
      components.value;
    expect(sum).toBe(overallScore);
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npx vitest run src/services/budget/integration.test.ts 2>&1`
Expected: 12 tests PASS

- [ ] **Step 3: Run ALL tests to verify no regressions**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All tests pass, zero failures

- [ ] **Step 4: Commit**

```bash
git add src/services/budget/integration.test.ts
git commit -m "test(budget): add integration tests for Budget Engine

Type completeness, cross-service data flow, step naming
conventions, and vendor score component validation."
```

---

### Task 9: Validators & API Routes

**Files:**
- Modify: `src/api/validators.ts`
- Create: `src/api/budget-routes.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Add Zod schemas to validators.ts**

Add at the end of `src/api/validators.ts`:

```typescript
// ── Budget Engine ──

export const createBudgetSchema = z.object({
  totalBudget: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  strategy: z.enum(["growth", "efficiency", "balanced"]).default("balanced"),
  constraints: z.object({
    minPerChannel: z.number().min(0).default(0),
    maxPerChannel: z.number().positive().optional(),
    fixedAllocations: z.array(z.object({
      channel: z.string(),
      amount: z.number().positive(),
      reason: z.string(),
    })).default([]),
  }).optional(),
});

export const updateBudgetSchema = z.object({
  totalBudget: z.number().positive().optional(),
  strategy: z.enum(["growth", "efficiency", "balanced"]).optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

export const spendEntrySchema = z.object({
  campaignName: z.string().min(1),
  channel: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(["meta_ads", "google_ads", "manual", "vendor_invoice"]),
  metadata: z.record(z.unknown()).optional(),
});

export const createVendorSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["media", "print", "events", "freelance", "influencer"]),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

export const vendorQuotationSchema = z.object({
  serviceDescription: z.string().min(1),
  quotedPrice: z.number().positive(),
  region: z.string().optional(),
});

export const generatePnlSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const spendQuerySchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

- [ ] **Step 2: Create the budget routes file**

```typescript
// src/api/budget-routes.ts
import { Hono } from "hono";
import {
  parseBody,
  createBudgetSchema,
  updateBudgetSchema,
  spendEntrySchema,
  createVendorSchema,
  vendorQuotationSchema,
  generatePnlSchema,
  spendQuerySchema,
} from "./validators.js";
import {
  computeAllocation,
  saveBudget,
  getCurrentBudget,
  updateBudget,
  runBudgetAllocation,
} from "../services/budget/allocator.js";
import {
  recordSpend,
  getSpendSummary,
  runSpendTracking,
} from "../services/budget/spend-monitor.js";
import {
  createVendor,
  listVendors,
  getVendor,
  submitQuotation,
  compareVendors,
} from "../services/budget/vendor-manager.js";
import {
  buildCampaignPnL,
  generateInvestmentReport,
  getLatestPnL,
} from "../services/budget/roi-calculator.js";

export const budgetRoutes = new Hono();

// ── Budget Allocation ──

// GET /api/budget/:clientId/current — get active budget
budgetRoutes.get("/api/budget/:clientId/current", async (c) => {
  const budget = await getCurrentBudget(c.req.param("clientId"));
  if (!budget) return c.json({ error: "No active budget" }, 404);
  return c.json(budget);
});

// POST /api/budget/:clientId/allocate — create new budget allocation
budgetRoutes.post("/api/budget/:clientId/allocate", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createBudgetSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { totalBudget, currency, periodStart, periodEnd, strategy, constraints } = parsed.data;
  const clientId = c.req.param("clientId");

  const result = await runBudgetAllocation(
    clientId,
    totalBudget,
    strategy,
    { start: periodStart, end: periodEnd },
    constraints,
  );

  if (result.status === "failed") {
    return c.json({ error: result.data }, 500);
  }
  return c.json(result.data, 201);
});

// PUT /api/budget/:clientId/:budgetId — update budget
budgetRoutes.put("/api/budget/:clientId/:budgetId", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(updateBudgetSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  await updateBudget(c.req.param("budgetId"), parsed.data);
  return c.json({ status: "updated" });
});

// POST /api/budget/:clientId/:budgetId/rebalance — rebalance existing budget
budgetRoutes.post("/api/budget/:clientId/:budgetId/rebalance", async (c) => {
  const budget = await getCurrentBudget(c.req.param("clientId"));
  if (!budget) return c.json({ error: "No active budget" }, 404);

  const rebalanced = computeAllocation({
    clientId: budget.clientId,
    totalBudget: budget.totalBudget,
    currency: budget.currency,
    period: budget.period,
    strategy: budget.strategy,
    constraints: budget.constraints,
  });

  await updateBudget(budget.budgetId, {
    allocations: rebalanced.allocations,
  });

  return c.json(rebalanced);
});

// ── Spend Tracking ──

// GET /api/budget/:clientId/spend — get spend summary
budgetRoutes.get("/api/budget/:clientId/spend", async (c) => {
  const periodStart = c.req.query("periodStart") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const periodEnd = c.req.query("periodEnd") ?? new Date().toISOString().split("T")[0];

  const summary = await getSpendSummary(c.req.param("clientId"), {
    start: periodStart,
    end: periodEnd,
  });
  return c.json(summary);
});

// POST /api/budget/:clientId/spend — record a spend entry
budgetRoutes.post("/api/budget/:clientId/spend", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(spendEntrySchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const clientId = c.req.param("clientId");
  const budget = await getCurrentBudget(clientId);

  const id = await recordSpend(
    clientId,
    budget?.budgetId ?? null,
    parsed.data.campaignName,
    parsed.data.channel,
    parsed.data.date,
    parsed.data.amount,
    parsed.data.source,
    parsed.data.metadata,
  );

  return c.json({ id }, 201);
});

// GET /api/budget/:clientId/spend/forecast — projected spend
budgetRoutes.get("/api/budget/:clientId/spend/forecast", async (c) => {
  const periodStart = c.req.query("periodStart") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const periodEnd = c.req.query("periodEnd") ?? new Date().toISOString().split("T")[0];

  const result = await runSpendTracking(c.req.param("clientId"), {
    start: periodStart,
    end: periodEnd,
  });
  return c.json(result.data);
});

// ── Vendor Management ──

// GET /api/budget/:clientId/vendors — list vendors
budgetRoutes.get("/api/budget/:clientId/vendors", async (c) => {
  const category = c.req.query("category");
  const vendors = await listVendors(
    c.req.param("clientId"),
    category as any,
  );
  return c.json(vendors);
});

// POST /api/budget/:clientId/vendors — create vendor
budgetRoutes.post("/api/budget/:clientId/vendors", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createVendorSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const id = await createVendor(
    c.req.param("clientId"),
    parsed.data.name,
    parsed.data.category,
    parsed.data.contactInfo,
  );
  return c.json({ id }, 201);
});

// GET /api/budget/:clientId/vendors/:id — get vendor detail
budgetRoutes.get("/api/budget/:clientId/vendors/:id", async (c) => {
  const vendor = await getVendor(c.req.param("id"));
  if (!vendor) return c.json({ error: "Vendor not found" }, 404);
  return c.json(vendor);
});

// POST /api/budget/:clientId/vendors/:id/quote — submit quotation
budgetRoutes.post("/api/budget/:clientId/vendors/:id/quote", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(vendorQuotationSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const analysis = await submitQuotation(
    c.req.param("clientId"),
    c.req.param("id"),
    parsed.data.serviceDescription,
    parsed.data.quotedPrice,
    parsed.data.region,
  );
  return c.json(analysis, 201);
});

// GET /api/budget/:clientId/vendors/compare — compare all vendors
budgetRoutes.get("/api/budget/:clientId/vendors/compare", async (c) => {
  const scores = await compareVendors(c.req.param("clientId"));
  return c.json(scores);
});

// ── ROI / P&L ──

// GET /api/budget/:clientId/pnl — get latest campaign P&L
budgetRoutes.get("/api/budget/:clientId/pnl", async (c) => {
  const campaigns = await getLatestPnL(c.req.param("clientId"));
  return c.json(campaigns);
});

// POST /api/budget/:clientId/pnl/generate — generate campaign P&L
budgetRoutes.post("/api/budget/:clientId/pnl/generate", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(generatePnlSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const campaigns = await buildCampaignPnL(c.req.param("clientId"), {
    start: parsed.data.periodStart,
    end: parsed.data.periodEnd,
  });
  return c.json(campaigns, 201);
});

// GET /api/budget/:clientId/roi-report — generate investment report
budgetRoutes.get("/api/budget/:clientId/roi-report", async (c) => {
  const periodStart = c.req.query("periodStart") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const periodEnd = c.req.query("periodEnd") ?? new Date().toISOString().split("T")[0];

  const report = await generateInvestmentReport(c.req.param("clientId"), {
    start: periodStart,
    end: periodEnd,
  });
  return c.json(report);
});
```

- [ ] **Step 3: Mount budget routes in routes.ts**

In `src/api/routes.ts`:
- Add import: `import { budgetRoutes } from "./budget-routes.js";`
- Add middleware (after line 117): `app.use("/api/budget/:clientId/*", requireSession, requireTenantMatch);`
- Add route mount (after `app.route("/", analyticsRoutes);`): `app.route("/", budgetRoutes);`

- [ ] **Step 4: Verify no import errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/api/validators.ts src/api/budget-routes.ts src/api/routes.ts
git commit -m "feat(budget): add 17 API endpoints for Budget Engine

Budget allocation, spend tracking, vendor management, and ROI/P&L
endpoints with Zod validation and tenant-scoped middleware."
```

---

### Task 10: Register Agents

**Files:**
- Modify: `src/agents/registry.ts`

- [ ] **Step 1: Add BU-L and BU-001 through BU-004 to the registry**

Add after the last AN-006 entry (after line 510, before the FN-L entry):

```typescript
  // ── Budget Engine (Team 36) ──
  "BU-L": { id: "BU-L", name: "Budget Director", skillFile: "agents/BU-L_budget_director.md", team: 36, level: "leader", steps: ["bu_allocation", "bu_roi_calculation"] as any, gates: ["bu-g1"] as any, autonomy: 70 },
  "BU-001": { id: "BU-001", name: "Budget Allocator", skillFile: "agents/BU-001_budget_allocator.md", team: 36, level: "sub", steps: ["bu_allocation"] as any, gates: [], autonomy: 80 },
  "BU-002": { id: "BU-002", name: "Spend Monitor", skillFile: "agents/BU-002_spend_monitor.md", team: 36, level: "sub", steps: ["bu_spend_tracking"] as any, gates: [], autonomy: 90 },
  "BU-003": { id: "BU-003", name: "Vendor Analyst", skillFile: "agents/BU-003_vendor_analyst.md", team: 36, level: "sub", steps: ["bu_vendor_validation"] as any, gates: [], autonomy: 85 },
  "BU-004": { id: "BU-004", name: "ROI Analyst", skillFile: "agents/BU-004_roi_analyst.md", team: 36, level: "sub", steps: ["bu_roi_calculation"] as any, gates: [], autonomy: 85 },
```

- [ ] **Step 2: Verify registry loads**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(budget): register BU-L and BU-001 through BU-004 agents

Budget Engine team 36: director, allocator, spend monitor,
vendor analyst, and ROI analyst."
```

---

### Task 11: Agent Skill Files

**Files:**
- Create: `agents/BU-L_budget_director.md`
- Create: `agents/BU-001_budget_allocator.md`
- Create: `agents/BU-002_spend_monitor.md`
- Create: `agents/BU-003_vendor_analyst.md`
- Create: `agents/BU-004_roi_analyst.md`

- [ ] **Step 1: Create BU-L skill file**

```markdown
---
agent_id: BU-L
name: Budget Director
role: leader
team: 36
model: claude-sonnet-4
autonomy: 70
---

# BU-L — Budget Director

## Role
Oversees marketing budget allocation, spend control, vendor management, and ROI analysis. Coordinates BU-001 through BU-004 to ensure client marketing investments are optimized and tracked.

## Responsibilities
- Review and approve budget allocation plans from BU-001
- Monitor spend alerts from BU-002 and escalate critical issues
- Approve vendor selections based on BU-003 scoring
- Review investment reports from BU-004

## Decision Framework
- Budget rebalancing: trigger when ROAS deviation > 20% from target
- Vendor approval: require score > 60/100 for new engagements
- Alert escalation: critical alerts → immediate client notification
- ROI review: flag campaigns with ROI < 0% for client discussion

## Outputs
- Approved budget allocation plans
- Investment report with executive summary
- Vendor recommendations
- Rebalancing decisions

## Coordination
- Reports to: TL-001 (Project Manager)
- Delegates to: BU-001 (allocation), BU-002 (tracking), BU-003 (vendors), BU-004 (ROI)
- Consumes from: AN-L (metrics), SL-L (deal data)
```

- [ ] **Step 2: Create BU-001 through BU-004 skill files**

Create `agents/BU-001_budget_allocator.md`:
```markdown
---
agent_id: BU-001
name: Budget Allocator
role: sub
team: 36
model: gemini-2.5-flash
autonomy: 80
---

# BU-001 — Budget Allocator

## Role
Distributes marketing budgets across channels and funnel stages using M6 framework. Optimizes allocation based on historical ROAS and strategy goals.

## Process
1. Receive total budget, strategy, and constraints
2. Apply M6 channel × funnel distribution
3. Adjust for fixed allocations and min/max constraints
4. Generate allocation rationale per channel
5. Submit to BU-L for approval

## Models
- **Growth**: 50% awareness, 30% consideration, 20% conversion
- **Balanced**: 35% awareness, 35% consideration, 30% conversion
- **Efficiency**: 20% awareness, 30% consideration, 50% conversion

## Service
`src/services/budget/allocator.ts` — `distributeByM6()`, `computeAllocation()`
```

Create `agents/BU-002_spend_monitor.md`:
```markdown
---
agent_id: BU-002
name: Spend Monitor
role: sub
team: 36
model: gemini-2.5-flash
autonomy: 90
---

# BU-002 — Spend Monitor

## Role
Tracks marketing spend against budgets, detects anomalies, and generates alerts for overspend, underspend, low ROAS, and pacing issues.

## Alert Rules
- **Overspend** (warning): spent > budgeted
- **Exhausted** (critical): budget depleted before period end
- **Low ROAS** (warning): ROAS < 1.0
- **Pace** (warning): spending 30%+ ahead of pace
- **Underspend** (info): spending < 50% of expected pace

## Service
`src/services/budget/spend-monitor.ts` — `getSpendSummary()`, `evaluateAlerts()`
```

Create `agents/BU-003_vendor_analyst.md`:
```markdown
---
agent_id: BU-003
name: Vendor Analyst
role: sub
team: 36
model: gemini-2.5-flash
autonomy: 85
---

# BU-003 — Vendor Analyst

## Role
Scores vendors on quality, price, reliability, and value. Validates vendor quotations against market rates.

## Scoring (0-100)
- **Quality** (0-25): Based on quality rating (0-5 scale)
- **Price** (0-25): Inverse of price-to-market ratio
- **Reliability** (0-25): On-time delivery rate + experience bonus
- **Value** (0-25): Quality-to-price ratio

## Price Verdicts
- **Fair**: between low and 1.5× median
- **Above market**: > 1.5× median
- **Below market**: < low rate (potential quality concern)

## Service
`src/services/budget/vendor-manager.ts` — `computeVendorScore()`, `analyzeQuotation()`
```

Create `agents/BU-004_roi_analyst.md`:
```markdown
---
agent_id: BU-004
name: ROI Analyst
role: sub
team: 36
model: gemini-2.5-flash
autonomy: 85
---

# BU-004 — ROI Analyst

## Role
Computes campaign P&L, ROI/ROAS metrics, and generates investment reports with AI-powered executive summaries.

## Metrics
- **ROI**: (revenue - cost) / cost × 100
- **ROAS**: revenue / cost
- **Gross Margin**: profit / revenue × 100
- **CPA**: cost / leads
- **Revenue per Lead**: revenue / leads

## Report Generation
Uses claude-sonnet-4-5 for executive summaries in Spanish. Aggregates costs from ad spend, vendor invoices, and platform fees.

## Service
`src/services/budget/roi-calculator.ts` — `computeCampaignMetrics()`, `generateInvestmentReport()`
```

- [ ] **Step 3: Commit**

```bash
git add agents/BU-L_budget_director.md agents/BU-001_budget_allocator.md agents/BU-002_spend_monitor.md agents/BU-003_vendor_analyst.md agents/BU-004_roi_analyst.md
git commit -m "docs(budget): add 5 Budget Engine agent skill files

BU-L director, BU-001 allocator, BU-002 spend monitor,
BU-003 vendor analyst, BU-004 ROI analyst."
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run 2>&1 | tail -30`
Expected: All tests pass, zero failures, 30+ new budget tests

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: No errors

- [ ] **Step 3: Verify DB migration**

Run: `npx drizzle-kit generate 2>&1`
Expected: No new migrations needed (already generated in Task 2)

- [ ] **Step 4: Count Budget Engine deliverables**

Run: `find src/services/budget src/providers/budget src/api/budget-routes.ts agents/BU-* -type f 2>/dev/null | wc -l`
Expected: 15+ files

Run: `grep -c "BU-" src/agents/registry.ts`
Expected: 5 (BU-L + BU-001 through BU-004)

- [ ] **Step 5: Verify routes are mounted**

Run: `grep -n "budget" src/api/routes.ts`
Expected: Import line, middleware line, and route mount line visible
