import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompetitiveListener } from "./competitive-listener.js";
import type { CompetitorConfig, RawCompetitorSignal } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("# Competitive Intelligence Report\n\nSYNTHETIC DATA"),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(function() {
    return {
      fetch: vi.fn().mockResolvedValue([
        {
          competitorName: "RivalCo",
          signalType: "campaign",
          title: "New campaign launch",
          description: "RivalCo launched Instagram campaign",
          source: "instagram",
          url: "https://instagram.com/rivalco",
          timestamp: "2026-04-07T08:00:00Z",
          impact: "medium",
          metadata: {},
        },
      ]),
    };
  }),
}));

describe("CompetitiveListener", () => {
  const config: CompetitorConfig = {
    clientId: "client-1",
    competitors: [
      { name: "RivalCo", website: "https://rivalco.com", socialHandles: { instagram: "@rivalco" }, industry: "marketing" },
    ],
    channelsToWatch: ["social", "ads", "website"],
  };

  let listener: CompetitiveListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new CompetitiveListener();
  });

  it("collect step returns competitor signals", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes signals", async () => {
    const signals: RawCompetitorSignal[] = [{
      competitorName: "RivalCo",
      signalType: "campaign",
      title: "New campaign",
      description: "Launched on IG",
      source: "instagram",
      url: "https://example.com",
      timestamp: "2026-04-07T08:00:00Z",
      impact: "medium",
      metadata: {},
    }];
    const result = await listener.analyze(signals);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const result = await listener.report({ competitorActivity: [], gaps: [], positioningShifts: [] });
    expect(result.step).toBe("report");
    expect(result.artifactContent).toBeDefined();
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
  });
});
