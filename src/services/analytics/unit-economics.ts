import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { queryMetrics } from "./data-collector.js";
import type { UnitEconomics, CohortData, DateRange, AnalyticsStepResult } from "./types.js";

export async function calculateUnitEconomics(
  clientId: string,
  period: DateRange,
): Promise<UnitEconomics> {
  // Get spend metrics for the period
  const spendPoints = await queryMetrics(clientId, ["spend"], period);

  const totalSpend = spendPoints.reduce((sum, p) => sum + p.value, 0);

  // Get closed_won deals in period
  const allDeals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.clientId, clientId));

  const closedDeals = allDeals.filter((d) => {
    if (d.stage !== "closed_won" || !d.closedAt) return false;
    const closedDate = d.closedAt.toISOString().split("T")[0];
    return closedDate >= period.start && closedDate <= period.end;
  });

  const customerCount = closedDeals.length;
  const totalRevenue = closedDeals.reduce((sum, d) => sum + Number(d.value ?? 0), 0);
  const avgRevenue = customerCount > 0 ? totalRevenue / customerCount : 0;

  // CAC = totalSpend / customerCount
  const cac = customerCount > 0 ? totalSpend / customerCount : 0;

  // CAC by channel (proportional to channel spend)
  const spendByChannel: Record<string, number> = {};
  for (const point of spendPoints) {
    const channel = point.dimensions?.source ?? point.source ?? "unknown";
    spendByChannel[channel] = (spendByChannel[channel] ?? 0) + point.value;
  }

  const cacByChannel: Record<string, number> = {};
  if (customerCount > 0) {
    for (const [channel, channelSpend] of Object.entries(spendByChannel)) {
      cacByChannel[channel] = channelSpend / customerCount;
    }
  }

  // LTV = avgRevenue × 12 (default lifespan)
  const ltv = avgRevenue * 12;

  // Derived metrics
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const paybackPeriodMonths = avgRevenue > 0 ? cac / avgRevenue : 0;

  // Stubs
  const monthlyChurnRate = 5;
  const netRevenueRetention = 105;

  return {
    cac,
    cacByChannel,
    ltv,
    ltvCacRatio,
    paybackPeriodMonths,
    monthlyChurnRate,
    netRevenueRetention,
    period,
    computedAt: new Date().toISOString(),
  };
}

export async function computeCohorts(
  clientId: string,
  period: DateRange,
): Promise<CohortData[]> {
  const allDeals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.clientId, clientId));

  // Filter closed_won deals in period
  const closedDeals = allDeals.filter((d) => {
    if (d.stage !== "closed_won" || !d.closedAt) return false;
    const closedDate = d.closedAt.toISOString().split("T")[0];
    return closedDate >= period.start && closedDate <= period.end;
  });

  // Group by month of closure
  const cohortMap: Record<string, typeof closedDeals> = {};
  for (const deal of closedDeals) {
    const month = deal.closedAt!.toISOString().slice(0, 7); // "YYYY-MM"
    if (!cohortMap[month]) cohortMap[month] = [];
    cohortMap[month].push(deal);
  }

  const cohorts: CohortData[] = [];
  for (const [cohortMonth, deals] of Object.entries(cohortMap).sort()) {
    const size = deals.length;
    const totalRevenue = deals.reduce((sum, d) => sum + Number(d.value ?? 0), 0);
    const avgRevenue = size > 0 ? totalRevenue / size : 0;

    // Simplified: single-month revenue entry and 100% retention for the cohort month
    const revenueByMonth = [totalRevenue];
    const retentionByMonth = [100];
    const cumulativeLtv = avgRevenue * 12;

    cohorts.push({
      cohortMonth,
      size,
      revenueByMonth,
      cumulativeLtv,
      retentionByMonth,
    });
  }

  return cohorts;
}

export async function runUnitEconomics(
  clientId: string,
  period: DateRange,
): Promise<AnalyticsStepResult> {
  try {
    const [unitEconomics, cohorts] = await Promise.all([
      calculateUnitEconomics(clientId, period),
      computeCohorts(clientId, period),
    ]);

    return {
      step: "an_unit_economics",
      status: "completed",
      data: { unitEconomics, cohorts },
    };
  } catch (error) {
    return {
      step: "an_unit_economics",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
