import { describe, it, expect } from "vitest";
import type {
  RawMention,
  BrandConfig,
  BrandHealthReport,
  RawTrend,
  CultureConfig,
  RawIntelligence,
  IndustryConfig,
  RawCompetitorSignal,
  CompetitorConfig,
  ScoredOpportunity,
  ListenerStepResult,
  IntelligenceProvider,
} from "./types.js";

describe("Intelligence types", () => {
  it("RawMention satisfies interface", () => {
    const mention: RawMention = {
      source: "twitter",
      text: "Great product!",
      author: "@user",
      url: "https://twitter.com/user/123",
      timestamp: "2026-04-07T12:00:00Z",
      engagement: { likes: 10, shares: 2, comments: 1 },
      metadata: {},
    };
    expect(mention.source).toBe("twitter");
  });

  it("BrandConfig satisfies interface", () => {
    const config: BrandConfig = {
      clientId: "test-client",
      brandNames: ["Acme"],
      socialHandles: ["@acme"],
      competitors: ["Rival Co"],
      keywords: ["innovation"],
      languages: ["es"],
      regions: ["LATAM"],
    };
    expect(config.brandNames).toHaveLength(1);
  });

  it("ScoredOpportunity satisfies interface", () => {
    const opp: ScoredOpportunity = {
      id: "opp-1",
      title: "Trend alignment",
      description: "Cultural trend matches brand positioning",
      sources: ["brand", "culture"],
      brandFit: 85,
      audienceRelevance: 90,
      timeSensitivity: "days",
      effortRequired: "medium",
      expectedImpact: "high",
      overallScore: 87,
      suggestedMotors: ["community-management", "graphic-design"],
      suggestedTimeline: "This week",
    };
    expect(opp.overallScore).toBe(87);
  });

  it("ListenerStepResult satisfies interface", () => {
    const result: ListenerStepResult = {
      step: "collect",
      status: "completed",
      data: [{ source: "twitter" }],
    };
    expect(result.status).toBe("completed");
  });

  it("IntelligenceProvider interface is implementable", () => {
    const provider: IntelligenceProvider<BrandConfig, RawMention> = {
      name: "test-provider",
      fetch: async () => [],
      isAvailable: () => true,
    };
    expect(provider.isAvailable()).toBe(true);
  });
});
