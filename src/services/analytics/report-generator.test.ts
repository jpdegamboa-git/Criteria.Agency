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
