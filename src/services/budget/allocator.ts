import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import type {
  BudgetAllocation,
  BudgetConstraints,
  BudgetStrategy,
  ChannelAllocation,
  FunnelStage,
  BudgetStepResult,
} from "./types.js";
import type { DateRange } from "../analytics/types.js";

// ── M6 Framework Maps ──

const CHANNEL_FUNNEL_MAP: Record<string, FunnelStage> = {
  meta_ads: "awareness",
  google_ads: "consideration",
  content_marketing: "awareness",
  email_marketing: "conversion",
  seo: "consideration",
  events: "conversion",
};

const STRATEGY_WEIGHTS: Record<BudgetStrategy, Record<FunnelStage, number>> = {
  growth: { awareness: 0.50, consideration: 0.30, conversion: 0.20 },
  balanced: { awareness: 0.35, consideration: 0.35, conversion: 0.30 },
  efficiency: { awareness: 0.20, consideration: 0.30, conversion: 0.50 },
};

// ── Input Interface ──

export interface M6Input {
  clientId: string;
  totalBudget: number;
  currency: string;
  period: DateRange;
  strategy: BudgetStrategy;
  constraints?: BudgetConstraints;
}

// ── Pure Functions ──

/**
 * Distribute a total budget across channels following the M6 framework.
 * Fixed allocations (from constraints) are applied first; the remaining
 * budget is split proportionally by funnel-stage weight divided by the
 * number of dynamic channels in that stage.
 */
export function distributeByM6(
  totalBudget: number,
  strategy: BudgetStrategy,
  constraints?: BudgetConstraints,
): ChannelAllocation[] {
  const weights = STRATEGY_WEIGHTS[strategy];
  const allChannels = Object.keys(CHANNEL_FUNNEL_MAP);
  const minPerChannel = constraints?.minPerChannel ?? 0;
  const maxPerChannel = constraints?.maxPerChannel ?? Infinity;

  // Collect fixed allocations
  const fixedMap: Record<string, number> = {};
  for (const fa of constraints?.fixedAllocations ?? []) {
    fixedMap[fa.channel] = fa.amount;
  }

  // Determine dynamic channels (those without a fixed allocation)
  const dynamicChannels = allChannels.filter((ch) => fixedMap[ch] === undefined);

  // Budget available for dynamic distribution
  const fixedTotal = Object.values(fixedMap).reduce((s, v) => s + v, 0);
  const dynamicBudget = Math.max(0, totalBudget - fixedTotal);

  // Count dynamic channels per stage
  const stageChannelCount: Record<FunnelStage, number> = {
    awareness: 0,
    consideration: 0,
    conversion: 0,
  };
  for (const ch of dynamicChannels) {
    stageChannelCount[CHANNEL_FUNNEL_MAP[ch]]++;
  }

  const allocations: ChannelAllocation[] = [];

  for (const channel of allChannels) {
    const stage = CHANNEL_FUNNEL_MAP[channel];

    let amount: number;
    if (fixedMap[channel] !== undefined) {
      amount = fixedMap[channel];
    } else {
      const channelsInStage = stageChannelCount[stage];
      const rawAmount =
        channelsInStage > 0
          ? (dynamicBudget * weights[stage]) / channelsInStage
          : 0;

      // Apply min/max constraints
      amount = Math.max(minPerChannel, Math.min(maxPerChannel, rawAmount));
    }

    const percentOfTotal = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;

    // Expected ROAS heuristics by strategy and stage
    const roasBase: Record<FunnelStage, number> = {
      awareness: 1.2,
      consideration: 2.0,
      conversion: 3.5,
    };
    const strategyMultiplier: Record<BudgetStrategy, number> = {
      growth: 1.0,
      balanced: 1.1,
      efficiency: 1.25,
    };

    allocations.push({
      channel,
      funnelStage: stage,
      amount: Math.round(amount * 100) / 100,
      percentOfTotal: Math.round(percentOfTotal * 100) / 100,
      rationale: `${strategy} strategy — ${stage} stage (${(weights[stage] * 100).toFixed(0)}% weight)`,
      expectedRoas: roasBase[stage] * strategyMultiplier[strategy],
      historicalRoas: null,
      confidence: 0.75,
    });
  }

  return allocations;
}

/**
 * Compute a full BudgetAllocation from an M6Input, including channel
 * allocations and strategy-level recommendations.
 */
export function computeAllocation(input: M6Input): BudgetAllocation {
  const defaultConstraints: BudgetConstraints = {
    minPerChannel: 0,
    maxPerChannel: Infinity,
    fixedAllocations: [],
    ...input.constraints,
  };

  const allocations = distributeByM6(
    input.totalBudget,
    input.strategy,
    defaultConstraints,
  );

  const recommendations = buildRecommendations(input.strategy, allocations);

  return {
    clientId: input.clientId,
    budgetId: "",
    totalBudget: input.totalBudget,
    currency: input.currency,
    period: input.period,
    strategy: input.strategy,
    allocations,
    constraints: defaultConstraints,
    recommendations,
  };
}

function buildRecommendations(
  strategy: BudgetStrategy,
  allocations: ChannelAllocation[],
): string[] {
  const recs: string[] = [];

  const byStage: Record<FunnelStage, number> = {
    awareness: 0,
    consideration: 0,
    conversion: 0,
  };
  for (const a of allocations) {
    byStage[a.funnelStage] += a.amount;
  }

  if (strategy === "growth") {
    recs.push(
      "Growth strategy detected: 50% awareness spend — monitor CPM and reach weekly.",
    );
    recs.push(
      "Consider increasing conversion budget once awareness benchmarks are met.",
    );
  } else if (strategy === "efficiency") {
    recs.push(
      "Efficiency strategy: conversion-heavy allocation — ensure retargeting audiences are warm.",
    );
    recs.push(
      "Low awareness budget may limit audience replenishment over time; review after 60 days.",
    );
  } else {
    recs.push(
      "Balanced strategy: equal weight across consideration and awareness — good for steady-state campaigns.",
    );
  }

  const topChannel = allocations.reduce((a, b) => (a.amount > b.amount ? a : b));
  recs.push(
    `Largest single allocation: ${topChannel.channel} (${topChannel.percentOfTotal.toFixed(1)}% of budget). Prioritize creative refresh here.`,
  );

  return recs;
}

// ── DB Operations ──

export async function saveBudget(allocation: BudgetAllocation): Promise<string> {
  const [row] = await db
    .insert(schema.marketingBudgets)
    .values({
      clientId: allocation.clientId,
      periodStart: new Date(allocation.period.start),
      periodEnd: new Date(allocation.period.end),
      totalBudget: String(allocation.totalBudget),
      currency: allocation.currency,
      strategy: allocation.strategy,
      allocations: allocation.allocations as unknown[],
      constraints: allocation.constraints as Record<string, unknown>,
      status: "active",
    })
    .returning({ id: schema.marketingBudgets.id });

  return row.id;
}

export async function getCurrentBudget(
  clientId: string,
): Promise<BudgetAllocation | null> {
  const now = new Date();

  const [row] = await db
    .select()
    .from(schema.marketingBudgets)
    .where(
      and(
        eq(schema.marketingBudgets.clientId, clientId),
        lte(schema.marketingBudgets.periodStart, now),
        gte(schema.marketingBudgets.periodEnd, now),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    clientId: row.clientId,
    budgetId: row.id,
    totalBudget: Number(row.totalBudget),
    currency: row.currency,
    period: {
      start: row.periodStart.toISOString(),
      end: row.periodEnd.toISOString(),
    },
    strategy: row.strategy as BudgetStrategy,
    allocations: (row.allocations as ChannelAllocation[]) ?? [],
    constraints: (row.constraints as BudgetConstraints) ?? {
      minPerChannel: 0,
      maxPerChannel: Infinity,
      fixedAllocations: [],
    },
    recommendations: [],
  };
}

export async function updateBudget(
  budgetId: string,
  updates: Partial<{
    allocations: ChannelAllocation[];
    constraints: BudgetConstraints;
    status: string;
    totalBudget: number;
    strategy: BudgetStrategy;
  }>,
): Promise<void> {
  const values: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.allocations !== undefined) values.allocations = updates.allocations;
  if (updates.constraints !== undefined) values.constraints = updates.constraints;
  if (updates.status !== undefined) values.status = updates.status;
  if (updates.totalBudget !== undefined) values.totalBudget = String(updates.totalBudget);
  if (updates.strategy !== undefined) values.strategy = updates.strategy;

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
    const input: M6Input = {
      clientId,
      totalBudget,
      currency: "USD",
      period,
      strategy,
      constraints,
    };

    const allocation = computeAllocation(input);
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
      data: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}
