import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectExternalMetrics, queryMetrics, getDataSources } from "./data-collector.js";

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
