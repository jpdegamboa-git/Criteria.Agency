import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpportunityAgent } from "./opportunity-agent.js";
import type { ScoredOpportunity } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(
    JSON.stringify({
      opportunities: [
        {
          id: "opp-1",
          title: "Cultural trend alignment",
          description: "AI marketing trend matches brand expertise",
          sources: ["brand", "culture"],
          brandFit: 85,
          audienceRelevance: 90,
          timeSensitivity: "days",
          effortRequired: "medium",
          expectedImpact: "high",
          overallScore: 87,
          suggestedMotors: ["community-management"],
          suggestedTimeline: "This week",
        },
      ],
    }),
  ),
}));

// Mock DB for fetching latest reports
vi.mock("@/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { outputData: { summary: "Brand report data" }, listenerType: "brand" },
            ]),
          }),
        }),
      }),
    }),
  },
  schema: { continuousAgentRuns: {} },
}));

describe("OpportunityAgent", () => {
  let agent: OpportunityAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new OpportunityAgent();
  });

  it("aggregate step fetches latest reports from all listeners", async () => {
    const result = await agent.aggregate("client-1");
    expect(result.step).toBe("aggregate");
    expect(result.status).toBe("completed");
  });

  it("evaluate step scores opportunities", async () => {
    const aggregatedData = {
      brand: { summary: "Brand health OK" },
      culture: { summary: "AI trend rising" },
      industry: { summary: "Regulation incoming" },
      competitive: { summary: "Competitor launched campaign" },
    };
    const result = await agent.evaluate(aggregatedData);
    expect(result.step).toBe("evaluate");
    expect(result.status).toBe("completed");
  });

  it("generate step produces opportunity briefs", async () => {
    const scored: ScoredOpportunity[] = [{
      id: "opp-1",
      title: "Test",
      description: "Test opp",
      sources: ["brand"],
      brandFit: 85,
      audienceRelevance: 90,
      timeSensitivity: "days",
      effortRequired: "medium",
      expectedImpact: "high",
      overallScore: 87,
      suggestedMotors: ["community-management"],
      suggestedTimeline: "This week",
    }];
    const result = await agent.generate(scored);
    expect(result.step).toBe("generate");
    expect(result.artifactContent).toBeDefined();
  });

  it("prioritize step filters high-scoring opportunities", async () => {
    const opportunities: ScoredOpportunity[] = [
      { id: "1", title: "High", description: "", sources: ["brand"], brandFit: 90, audienceRelevance: 90, timeSensitivity: "hours", effortRequired: "low", expectedImpact: "high", overallScore: 92, suggestedMotors: [], suggestedTimeline: "" },
      { id: "2", title: "Low", description: "", sources: ["culture"], brandFit: 30, audienceRelevance: 40, timeSensitivity: "weeks", effortRequired: "high", expectedImpact: "low", overallScore: 25, suggestedMotors: [], suggestedTimeline: "" },
    ];
    const result = await agent.prioritize(opportunities);
    expect(result.step).toBe("prioritize");
    expect(result.status).toBe("completed");
    const feed = result.data as { opportunities: ScoredOpportunity[]; priorityAlerts: ScoredOpportunity[] };
    expect(feed.priorityAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = agent.buildStepFns("client-1");
    expect(Object.keys(fns)).toEqual(["aggregate", "evaluate", "generate", "prioritize"]);
  });
});
