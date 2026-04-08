import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCurrentBudget } from "./allocator.js";
import type {
  SpendTracker,
  SpendAlert,
  SpendStatus,
  SpendSource,
  ChannelSpendSummary,
  CampaignSpendSummary,
  BudgetStepResult,
} from "./types.js";
import type { DateRange } from "../analytics/types.js";

// ── AlertInput ──

export interface AlertInput {
  channel: string;
  budgeted: number;
  spent: number;
  roas: number;
  totalDays: number;
  elapsedDays: number;
}

// ── Pure Functions ──

/**
 * Determine spend status for a channel given budget, actual spend, and time elapsed.
 */
export function computeSpendStatus(
  budgeted: number,
  spent: number,
  totalDays: number,
  elapsedDays: number,
): SpendStatus {
  if (spent > budgeted) return "overspend";
  if (spent >= budgeted) return "exhausted";

  const expectedPace = elapsedDays / totalDays;
  const actualPace = budgeted > 0 ? spent / budgeted : 0;

  if (elapsedDays > 5 && actualPace < expectedPace * 0.5) return "underspend";

  return "on_track";
}

/**
 * Compute the average daily burn rate given total spend and elapsed days.
 */
export function computeBurnRate(totalSpent: number, elapsedDays: number): number {
  return elapsedDays > 0 ? Math.round(totalSpent / elapsedDays) : 0;
}

/**
 * Evaluate alerts for a single channel based on spend, pace, and ROAS.
 */
export function evaluateAlerts(input: AlertInput): SpendAlert[] {
  const { channel, budgeted, spent, roas, totalDays, elapsedDays } = input;
  const alerts: SpendAlert[] = [];

  const expectedPace = totalDays > 0 ? elapsedDays / totalDays : 0;
  const actualPace = budgeted > 0 ? spent / budgeted : 0;

  // Overspend: spent has gone over budget
  if (spent > budgeted) {
    alerts.push({
      type: "overspend",
      severity: "warning",
      channel,
      message: `Channel "${channel}" has exceeded its budget (spent ${spent}, budgeted ${budgeted}).`,
      currentValue: spent,
      threshold: budgeted,
    });
  }

  // Exhausted: budget fully used but period not over
  if (spent >= budgeted && elapsedDays < totalDays) {
    alerts.push({
      type: "exhausted",
      severity: "critical",
      channel,
      message: `Channel "${channel}" budget is exhausted with ${totalDays - elapsedDays} days remaining.`,
      currentValue: spent,
      threshold: budgeted,
    });
  }

  // Low ROAS
  if (roas < 1.0 && spent > 0) {
    alerts.push({
      type: "low_roas",
      severity: "warning",
      channel,
      message: `Channel "${channel}" has a low ROAS of ${roas.toFixed(2)} (below 1.0 threshold).`,
      currentValue: roas,
      threshold: 1.0,
    });
  }

  // Pace alert: spending too fast (but not yet over budget)
  if (actualPace > expectedPace * 1.3 && spent < budgeted) {
    alerts.push({
      type: "pace",
      severity: "warning",
      channel,
      message: `Channel "${channel}" is pacing ahead of schedule (${(actualPace * 100).toFixed(1)}% spent vs ${(expectedPace * 100).toFixed(1)}% of period elapsed).`,
      currentValue: actualPace,
      threshold: expectedPace * 1.3,
    });
  }

  return alerts;
}

// ── DB Operations ──

/**
 * Record a campaign spend entry and return the new row id.
 */
export async function recordSpend(
  clientId: string,
  budgetId: string | null,
  campaignName: string,
  channel: string,
  date: Date,
  amount: number,
  source: SpendSource,
  metadata?: Record<string, unknown>,
): Promise<string> {
  const [row] = await db
    .insert(schema.campaignSpend)
    .values({
      clientId,
      budgetId: budgetId ?? undefined,
      campaignName,
      channel,
      date,
      amount: String(amount),
      source,
      metadata: metadata ?? {},
    })
    .returning({ id: schema.campaignSpend.id });

  return row.id;
}

/**
 * Aggregate all spend rows for a client within the given period and return
 * a SpendTracker with overall, by-channel, and by-campaign breakdowns.
 */
export async function getSpendSummary(
  clientId: string,
  period: DateRange,
): Promise<SpendTracker> {
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

  // Aggregate totals
  const totalSpent = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  // Compute elapsed days
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000),
  );
  const now = new Date();
  const elapsedDays = Math.max(
    0,
    Math.min(
      totalDays,
      Math.round((now.getTime() - startDate.getTime()) / 86_400_000),
    ),
  );

  const burnRate = computeBurnRate(totalSpent, elapsedDays);

  // Get active budget for totals
  const budget = await getCurrentBudget(clientId);
  const totalBudgeted = budget?.totalBudget ?? 0;
  const remaining = Math.max(0, totalBudgeted - totalSpent);

  // Projected overspend / days until exhausted
  const projectedTotal = burnRate > 0 ? totalSpent + burnRate * (totalDays - elapsedDays) : totalSpent;
  const projectedOverspend = projectedTotal > totalBudgeted ? projectedTotal - totalBudgeted : null;
  const daysUntilExhausted =
    burnRate > 0 && remaining > 0 ? Math.round(remaining / burnRate) : null;

  // By-channel aggregation
  const channelMap = new Map<string, { spent: number; budgeted: number; roas: number }>();
  for (const row of rows) {
    const ch = row.channel;
    const existing = channelMap.get(ch) ?? { spent: 0, budgeted: 0, roas: 0 };
    existing.spent += Number(row.amount);
    channelMap.set(ch, existing);
  }

  // Map channel budgets from the active allocation
  const channelBudgetMap: Record<string, number> = {};
  if (budget) {
    for (const alloc of budget.allocations) {
      channelBudgetMap[alloc.channel] = alloc.amount;
    }
  }

  const byChannel: ChannelSpendSummary[] = Array.from(channelMap.entries()).map(
    ([channel, data]) => {
      const budgeted = channelBudgetMap[channel] ?? 0;
      const channelRemaining = Math.max(0, budgeted - data.spent);
      const status = computeSpendStatus(budgeted, data.spent, totalDays, elapsedDays);
      return {
        channel,
        budgeted,
        spent: data.spent,
        remaining: channelRemaining,
        roas: data.roas,
        status,
      };
    },
  );

  // By-campaign aggregation
  const campaignMap = new Map<string, { channel: string; spent: number; roas: number }>();
  for (const row of rows) {
    const key = `${row.campaignName}::${row.channel}`;
    const existing = campaignMap.get(key) ?? { channel: row.channel, spent: 0, roas: 0 };
    existing.spent += Number(row.amount);
    campaignMap.set(key, existing);
  }

  const byCampaign: CampaignSpendSummary[] = Array.from(campaignMap.entries()).map(
    ([key, data]) => {
      const [campaignName] = key.split("::");
      const budgeted = channelBudgetMap[data.channel] ?? 0;
      const status = computeSpendStatus(budgeted, data.spent, totalDays, elapsedDays);
      return {
        campaignName,
        channel: data.channel,
        budgeted,
        spent: data.spent,
        roas: data.roas,
        status,
      };
    },
  );

  return {
    clientId,
    period,
    overall: {
      budgeted: totalBudgeted,
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

/**
 * Run full spend tracking for a client: fetch summary, evaluate alerts per
 * channel, and return a BudgetStepResult.
 */
export async function runSpendTracking(
  clientId: string,
  period: DateRange,
): Promise<BudgetStepResult> {
  try {
    const tracker = await getSpendSummary(clientId, period);

    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    const totalDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000),
    );
    const now = new Date();
    const elapsedDays = Math.max(
      0,
      Math.min(
        totalDays,
        Math.round((now.getTime() - startDate.getTime()) / 86_400_000),
      ),
    );

    const alerts: SpendAlert[] = [];
    for (const ch of tracker.byChannel) {
      const channelAlerts = evaluateAlerts({
        channel: ch.channel,
        budgeted: ch.budgeted,
        spent: ch.spent,
        roas: ch.roas,
        totalDays,
        elapsedDays,
      });
      alerts.push(...channelAlerts);
    }

    const artifactContent = JSON.stringify({ tracker, alerts }, null, 2);

    return {
      step: "spend_tracking",
      status: "completed",
      data: { tracker, alerts },
      artifactContent,
    };
  } catch (error) {
    return {
      step: "spend_tracking",
      status: "failed",
      data: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}
