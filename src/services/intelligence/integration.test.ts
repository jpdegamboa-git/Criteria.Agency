// src/services/intelligence/integration.test.ts
import { describe, it, expect, vi } from "vitest";
import { BrandListener } from "./brand-listener.js";
import { CultureListener } from "./culture-listener.js";
import { IndustryListener } from "./industry-listener.js";
import { CompetitiveListener } from "./competitive-listener.js";
import { OpportunityAgent } from "./opportunity-agent.js";
import type { BrandConfig, CultureConfig, IndustryConfig, CompetitorConfig } from "./types.js";

// Mock all LLM calls to return deterministic data
vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockImplementation((_model: string, _sys: string, prompt: string) => {
    if (prompt.includes("social media mentions")) {
      return JSON.stringify([
        { source: "twitter", text: "Great brand!", author: "@user1", url: "https://t.co/1", timestamp: "2026-04-07T10:00:00Z", engagement: { likes: 10, shares: 2, comments: 1 }, metadata: {} },
      ]);
    }
    if (prompt.includes("cultural topics")) {
      return JSON.stringify([
        { topic: "AI trend", description: "AI in marketing", source: "google_trends", region: "LATAM", category: "industry_shift", volume: 80, velocity: 30, timestamp: "2026-04-07T10:00:00Z", sampleContent: [] },
      ]);
    }
    if (prompt.includes("industry intelligence")) {
      return JSON.stringify([
        { title: "New regulation", summary: "AI transparency req", source: "Gov", sourceType: "regulation", url: "https://gov.example", publishDate: "2026-04-01", relevantEntities: [], metadata: {} },
      ]);
    }
    if (prompt.includes("competitive intelligence")) {
      return JSON.stringify([
        { competitorName: "Rival", signalType: "campaign", title: "IG launch", description: "New campaign", source: "instagram", url: "https://ig.com/rival", timestamp: "2026-04-07T08:00:00Z", impact: "medium", metadata: {} },
      ]);
    }
    if (prompt.includes("opportunities")) {
      return JSON.stringify({
        opportunities: [
          { id: "opp-1", title: "AI content", description: "Leverage AI trend", sources: ["culture", "competitive"], brandFit: 85, audienceRelevance: 80, timeSensitivity: "days", effortRequired: "medium", expectedImpact: "high", overallScore: 83, suggestedMotors: ["community-management"], suggestedTimeline: "This week" },
        ],
      });
    }
    // Default: return a report-like markdown response
    return "# Report\n\nSynthetic report content.\n\n*SYNTHETIC DATA*";
  }),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(function() {
    return {
      fetch: vi.fn().mockImplementation((_type: string) => {
        return Promise.resolve([
          {
            source: "twitter",
            text: "Great brand!",
            author: "@user1",
            url: "https://t.co/1",
            timestamp: "2026-04-07T10:00:00Z",
            engagement: { likes: 10, shares: 2, comments: 1 },
            metadata: {},
            // CultureSignal fields
            topic: "AI trend",
            description: "AI in marketing",
            region: "LATAM",
            category: "industry_shift",
            volume: 80,
            velocity: 30,
            sampleContent: [],
            // IndustryInsight fields
            title: "New regulation",
            summary: "AI transparency req",
            sourceType: "regulation",
            publishDate: "2026-04-01",
            relevantEntities: [],
            // CompetitiveSignal fields
            competitorName: "Rival",
            signalType: "campaign",
            impact: "medium",
          },
        ]);
      }),
    };
  }),
}));

vi.mock("@/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { outputData: { summary: "Test report" }, listenerType: "brand" },
            ]),
          }),
        }),
      }),
    }),
  },
  schema: { continuousAgentRuns: {} },
}));

describe("Intelligence Engine Integration", () => {
  it("BrandListener produces valid step results for all 4 steps", async () => {
    const listener = new BrandListener();
    const config: BrandConfig = {
      clientId: "test", brandNames: ["TestBrand"], socialHandles: ["@test"],
      competitors: [], keywords: [], languages: ["es"], regions: ["LATAM"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");

    const analyze = await listener.analyze(collect.data);
    expect(analyze.status).toBe("completed");

    const report = await listener.report(analyze.data);
    expect(report.status).toBe("completed");
    expect(report.artifactContent).toBeDefined();

    const alert = await listener.alertEval(report.data);
    expect(alert.status).toBe("completed");
  });

  it("CultureListener produces valid step results", async () => {
    const listener = new CultureListener();
    const config: CultureConfig = {
      clientId: "test", industries: ["tech"],
      audienceDemographics: { ageRange: [25, 45], regions: ["LATAM"], interests: [] },
      languages: ["es"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");

    const analyze = await listener.analyze(collect.data);
    expect(analyze.status).toBe("completed");
  });

  it("IndustryListener produces valid step results", async () => {
    const listener = new IndustryListener();
    const config: IndustryConfig = {
      clientId: "test", primaryIndustry: "marketing", subSectors: [],
      keyPlayers: [], technologies: ["AI"], regions: ["LATAM"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");
  });

  it("CompetitiveListener produces valid step results", async () => {
    const listener = new CompetitiveListener();
    const config: CompetitorConfig = {
      clientId: "test",
      competitors: [{ name: "Rival", website: "https://rival.com", socialHandles: {}, industry: "marketing" }],
      channelsToWatch: ["social"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");
  });

  it("OpportunityAgent aggregates and scores", async () => {
    const agent = new OpportunityAgent();

    const aggregate = await agent.aggregate("test-client");
    expect(aggregate.status).toBe("completed");

    const evaluate = await agent.evaluate(aggregate.data);
    expect(evaluate.status).toBe("completed");
  });

  it("buildStepFns returns correct step names per listener type", () => {
    expect(Object.keys(new BrandListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new CultureListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new IndustryListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new CompetitiveListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new OpportunityAgent().buildStepFns("x")))
      .toEqual(["aggregate", "evaluate", "generate", "prioritize"]);
  });
});
