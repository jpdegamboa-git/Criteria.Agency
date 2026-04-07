import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrandListener } from "./brand-listener.js";
import type { BrandConfig, RawMention, BrandHealthReport } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("# Brand Health Report\n\nSYNTHETIC DATA — no live monitoring active"),
}));

vi.mock("../stub-provider-factory.js", () => {
  const mockFetch = vi.fn().mockResolvedValue([
    {
      source: "twitter",
      text: "Love this brand!",
      author: "@fan",
      url: "https://twitter.com/fan/1",
      timestamp: "2026-04-07T10:00:00Z",
      engagement: { likes: 50, shares: 10, comments: 5 },
      metadata: { synthetic: true },
    },
  ]);
  function StubProviderFactory() {
    return { fetch: mockFetch };
  }
  return { StubProviderFactory };
});

describe("BrandListener", () => {
  const config: BrandConfig = {
    clientId: "client-1",
    brandNames: ["TestBrand"],
    socialHandles: ["@testbrand"],
    competitors: ["RivalCo"],
    keywords: ["marketing"],
    languages: ["es"],
    regions: ["LATAM"],
  };

  let listener: BrandListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new BrandListener();
  });

  it("collect step returns raw mentions", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes mentions and returns report data", async () => {
    const mentions: RawMention[] = [
      {
        source: "twitter",
        text: "Love this brand!",
        author: "@fan",
        url: "https://twitter.com/fan/1",
        timestamp: "2026-04-07T10:00:00Z",
        engagement: { likes: 50, shares: 10, comments: 5 },
        metadata: {},
      },
    ];
    const result = await listener.analyze(mentions);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const analysisData = {
      overallSentiment: 75,
      sentimentBreakdown: { positive: 60, neutral: 25, negative: 10, mixed: 5 },
      volumeVsBaseline: 1.2,
      topTopics: [{ topic: "product quality", count: 15, sentiment: 80 }],
      notableMentions: [],
      crisisSignals: [],
    };
    const result = await listener.report(analysisData);
    expect(result.step).toBe("report");
    expect(result.status).toBe("completed");
    expect(result.artifactContent).toBeDefined();
    expect(result.artifactContent).toContain("#");
  });

  it("alert_eval step returns alerts fired count", async () => {
    const reportData = { overallSentiment: 75, crisisSignals: [] };
    const result = await listener.alertEval(reportData);
    expect(result.step).toBe("alert_eval");
    expect(result.status).toBe("completed");
  });

  it("buildStepFns returns all 4 steps bound to config", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(typeof fns.collect).toBe("function");
    expect(typeof fns.analyze).toBe("function");
    expect(typeof fns.report).toBe("function");
    expect(typeof fns.alert_eval).toBe("function");
  });
});
