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
