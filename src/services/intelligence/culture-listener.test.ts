import { describe, it, expect, vi, beforeEach } from "vitest";
import { CultureListener } from "./culture-listener.js";
import type { CultureConfig, RawTrend } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("# Culture Pulse Report\n\nSYNTHETIC DATA"),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(function() {
    return {
      fetch: vi.fn().mockResolvedValue([
        {
          topic: "AI marketing",
          description: "Brands using AI for personalized content",
          source: "google_trends",
          region: "LATAM",
          category: "industry_shift",
          volume: 85,
          velocity: 40,
          timestamp: "2026-04-07T10:00:00Z",
          sampleContent: ["AI is transforming marketing"],
        },
      ]),
    };
  }),
}));

describe("CultureListener", () => {
  const config: CultureConfig = {
    clientId: "client-1",
    industries: ["technology"],
    audienceDemographics: { ageRange: [25, 45], regions: ["LATAM"], interests: ["tech"] },
    languages: ["es"],
  };

  let listener: CultureListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new CultureListener();
  });

  it("collect step returns raw trends", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes trends", async () => {
    const trends: RawTrend[] = [{
      topic: "AI marketing",
      description: "Brands using AI",
      source: "google_trends",
      region: "LATAM",
      category: "industry_shift",
      volume: 85,
      velocity: 40,
      timestamp: "2026-04-07T10:00:00Z",
      sampleContent: [],
    }];
    const result = await listener.analyze(trends);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const result = await listener.report({ topTrends: [], riskTopics: [], contentOpportunities: [] });
    expect(result.step).toBe("report");
    expect(result.artifactContent).toBeDefined();
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
  });
});
