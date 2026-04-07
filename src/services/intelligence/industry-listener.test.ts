import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndustryListener } from "./industry-listener.js";
import type { IndustryConfig, RawIntelligence } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("# Industry Intelligence Report\n\nSYNTHETIC DATA"),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(function() {
    return {
      fetch: vi.fn().mockResolvedValue([
        {
          title: "AI Regulation Update",
          summary: "New AI transparency requirements for marketing",
          source: "Government Gazette",
          sourceType: "regulation",
          url: "https://example.com/reg",
          publishDate: "2026-04-01",
          relevantEntities: ["marketing_agencies"],
          metadata: {},
        },
      ]),
    };
  }),
}));

describe("IndustryListener", () => {
  const config: IndustryConfig = {
    clientId: "client-1",
    primaryIndustry: "marketing",
    subSectors: ["digital_marketing"],
    keyPlayers: ["Agency X"],
    technologies: ["AI"],
    regions: ["LATAM"],
  };

  let listener: IndustryListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new IndustryListener();
  });

  it("collect step returns raw intelligence", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes signals", async () => {
    const signals: RawIntelligence[] = [{
      title: "AI Regulation",
      summary: "New requirements",
      source: "Gov",
      sourceType: "regulation",
      url: "https://example.com",
      publishDate: "2026-04-01",
      relevantEntities: [],
      metadata: {},
    }];
    const result = await listener.analyze(signals);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const result = await listener.report({ topSignals: [], innovationMap: [], regulatoryChanges: [], marketShifts: [] });
    expect(result.step).toBe("report");
    expect(result.artifactContent).toBeDefined();
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
  });
});
