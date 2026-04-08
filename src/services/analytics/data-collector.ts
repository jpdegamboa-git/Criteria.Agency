import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAllProviders } from "../../providers/analytics/stub-providers.js";
import type { AnalyticsStepResult, DateRange, MetricDataPoint } from "./types.js";

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

export async function collectInternalMetrics(
  clientId: string,
  dateRange: DateRange,
): Promise<AnalyticsStepResult> {
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
