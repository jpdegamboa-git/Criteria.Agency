// src/services/analytics/nl-query-engine.test.ts

import { describe, it, expect, vi } from "vitest";
import { processNLQuery, getQueryHistory, recordQueryFeedback, runNLQuery } from "./nl-query-engine.js";

vi.mock("../../db/index.js", () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({ from: () => ({ where: () => Promise.resolve([{ id: "q1", question: "test", answer: "test" }]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
  schema: { nlQueries: "nl_queries" },
}));

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-01", metric: "spend", value: 2500, dimensions: {}, source: "meta_ads" },
    { date: "2026-03-01", metric: "roas", value: 3.2, dimensions: {}, source: "meta_ads" },
  ]),
}));

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn()
    .mockResolvedValueOnce('{"metrics":["spend","roas"],"dateRange":{"start":"2026-03-01","end":"2026-03-31"},"dimensions":[],"comparison":false}')
    .mockResolvedValueOnce('{"answer":"El mes pasado gastamos $2,500 en Meta Ads con un ROAS de 3.2x","followUpSuggestions":["¿Cuál fue el CPC promedio?","¿Cómo se compara con Google Ads?"]}'),
}));

describe("nl-query-engine", () => {
  it("processNLQuery returns structured result", async () => {
    const result = await processNLQuery("c1", "¿Cuánto gastamos en Meta Ads el mes pasado?");
    expect(result.answer).toBeTruthy();
    expect(result.data).toHaveProperty("spend");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.followUpSuggestions).toBeInstanceOf(Array);
  });

  it("getQueryHistory returns stored queries", async () => {
    const history = await getQueryHistory("c1");
    expect(history).toHaveLength(1);
  });

  it("recordQueryFeedback updates without error", async () => {
    await expect(recordQueryFeedback("q1", "helpful")).resolves.toBeUndefined();
  });

  it("runNLQuery returns step result", async () => {
    const { generateText } = await import("../../providers/generate-text.js");
    (generateText as any)
      .mockResolvedValueOnce('{"metrics":["spend"],"dateRange":{"start":"2026-03-01","end":"2026-03-31"},"dimensions":[],"comparison":false}')
      .mockResolvedValueOnce('{"answer":"Gastamos $2,500","followUpSuggestions":[]}');

    const result = await runNLQuery("c1", "¿Cuánto gastamos?");
    expect(result.step).toBe("an_analyze");
    expect(result.status).toBe("completed");
    expect(result.artifactContent).toBeTruthy();
  });
});
