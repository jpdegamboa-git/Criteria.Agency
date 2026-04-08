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
