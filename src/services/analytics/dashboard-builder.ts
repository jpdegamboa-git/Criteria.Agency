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
