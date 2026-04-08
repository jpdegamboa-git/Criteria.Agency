import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
  schema: {},
}));

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("{}"),
}));

import { generateText } from "../../providers/generate-text.js";
import {
  runPerceptionAudit,
  runGapAnalysis,
  definePositioning,
  validatePositioning,
} from "./diagnosis.js";

const mockGenerateText = vi.mocked(generateText);

// ── Shared fixtures ──

const brandName = "AcmeBrand";

const brandDna = {
  mission: "Empower small businesses",
  values: ["innovation", "transparency", "impact"],
  personality: "Bold, approachable, expert",
};

const listenerData = {
  mentions: 120,
  overallSentiment: 72,
  topTopics: ["quality", "price", "service"],
};

const perceptionMap = {
  brandName,
  attributes: [
    {
      attribute: "Quality",
      currentPerception: "Perceived as average",
      desiredPerception: "Perceived as premium",
      gap: "large" as const,
      priority: "high" as const,
    },
  ],
  strengths: ["Strong social presence"],
  weaknesses: ["Low brand recognition"],
  keyAssociations: ["affordable", "reliable"],
  overallSentiment: 72,
  dataQuality: "medium" as const,
  generatedAt: new Date().toISOString(),
};

const gapAnalysis = {
  perceptionVsAspiration: perceptionMap.attributes,
  priorityGaps: ["Quality perception gap"],
  competitiveWhitespace: ["SMB market underserved"],
  opportunities: ["Premium tier expansion"],
  risks: ["Competitor investment in quality messaging"],
};

const positioning = {
  statement: {
    targetAudience: "SMB owners",
    need: "affordable premium tools",
    brandName,
    category: "SaaS platform",
    keyBenefit: "saves time and money",
    reasonsToBelieve: ["10k customers", "99% uptime"],
  },
  competitiveFrame: {
    directCompetitors: [{ name: "CompA", positioning: "cheap but basic" }],
    indirectCompetitors: [{ name: "CompB", positioning: "enterprise focus" }],
    differentiation: "Premium experience at SMB price",
  },
  valueProposition: {
    customerJobs: ["grow business", "manage operations"],
    pains: ["complexity", "high cost"],
    gains: ["efficiency", "savings"],
    painRelievers: ["simple UI", "transparent pricing"],
    gainCreators: ["automation", "analytics"],
  },
  perceptionGapMap: perceptionMap.attributes,
  brandAttributes: ["Bold", "Reliable", "Smart"] as [string, string, string],
  audienceResonance: [
    { audience: "SMB owners", fitScore: 85, reasoning: "Direct match" },
  ],
  confidenceScore: 78,
  validatedAt: null,
};

// ── Tests ──

describe("runPerceptionAudit", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("returns step=perception_audit with status=completed and valid data", async () => {
    const mockPerceptionData = {
      attributes: [
        {
          attribute: "Brand awareness",
          currentPerception: "Low",
          desiredPerception: "High",
          gap: "large",
          priority: "high",
        },
      ],
      strengths: ["Community trust"],
      weaknesses: ["Limited reach"],
      keyAssociations: ["affordable", "friendly"],
      overallSentiment: 65,
      dataQuality: "medium",
    };

    // First call: JSON data; second call: markdown report
    mockGenerateText
      .mockResolvedValueOnce(JSON.stringify(mockPerceptionData))
      .mockResolvedValueOnce("# Informe de Auditoría de Percepción\n⚠️ DATOS SINTÉTICOS");

    const result = await runPerceptionAudit("client-1", {
      brandName,
      brandDna,
      listenerData,
    });

    expect(result.step).toBe("perception_audit");
    expect(result.status).toBe("completed");

    const data = result.data as typeof perceptionMap;
    expect(data.brandName).toBe(brandName);
    expect(Array.isArray(data.attributes)).toBe(true);
    expect(data.attributes.length).toBeGreaterThan(0);
    expect(data.strengths).toBeDefined();
    expect(data.weaknesses).toBeDefined();
    expect(typeof data.overallSentiment).toBe("number");
    expect(data.generatedAt).toBeDefined();

    expect(result.artifactContent).toBeDefined();
    expect(typeof result.artifactContent).toBe("string");
    expect(result.artifactContent!.length).toBeGreaterThan(0);
  });

  it("falls back gracefully on invalid JSON from LLM", async () => {
    mockGenerateText
      .mockResolvedValueOnce("not valid json at all {{{{")
      .mockResolvedValueOnce("# Report");

    const result = await runPerceptionAudit("client-2", {
      brandName,
      brandDna,
      listenerData,
    });

    expect(result.step).toBe("perception_audit");
    expect(result.status).toBe("completed");

    const data = result.data as typeof perceptionMap;
    expect(Array.isArray(data.attributes)).toBe(true);
    expect(data.brandName).toBe(brandName);
  });

  it("parses JSON wrapped in markdown fences", async () => {
    const wrapped = "```json\n{\"attributes\":[],\"strengths\":[\"S1\"],\"weaknesses\":[],\"keyAssociations\":[],\"overallSentiment\":80,\"dataQuality\":\"high\"}\n```";
    mockGenerateText
      .mockResolvedValueOnce(wrapped)
      .mockResolvedValueOnce("# Report");

    const result = await runPerceptionAudit("client-3", { brandName, brandDna, listenerData });

    const data = result.data as typeof perceptionMap;
    expect(data.strengths).toContain("S1");
    expect(data.overallSentiment).toBe(80);
  });
});

describe("runGapAnalysis", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("returns step=gap_analysis with priorityGaps in data", async () => {
    const mockGap = {
      perceptionVsAspiration: perceptionMap.attributes,
      priorityGaps: ["Quality gap", "Awareness gap"],
      competitiveWhitespace: ["Premium SMB"],
      opportunities: ["Expand upmarket"],
      risks: ["Price war"],
    };

    mockGenerateText
      .mockResolvedValueOnce(JSON.stringify(mockGap))
      .mockResolvedValueOnce("# Análisis de Brechas\n⚠️ DATOS SINTÉTICOS");

    const result = await runGapAnalysis("client-1", {
      perceptionMap,
      brandDna,
      competitiveMap: {},
    });

    expect(result.step).toBe("gap_analysis");
    expect(result.status).toBe("completed");

    const data = result.data as typeof mockGap;
    expect(Array.isArray(data.priorityGaps)).toBe(true);
    expect(data.priorityGaps.length).toBeGreaterThan(0);
    expect(Array.isArray(data.opportunities)).toBe(true);
    expect(Array.isArray(data.risks)).toBe(true);
    expect(Array.isArray(data.competitiveWhitespace)).toBe(true);
    expect(result.artifactContent).toBeDefined();
  });

  it("falls back to empty arrays on invalid JSON", async () => {
    mockGenerateText
      .mockResolvedValueOnce("!!!broken!!!")
      .mockResolvedValueOnce("# Report");

    const result = await runGapAnalysis("client-2", {
      perceptionMap,
      brandDna,
      competitiveMap: {},
    });

    const data = result.data as typeof gapAnalysis;
    expect(Array.isArray(data.priorityGaps)).toBe(true);
    expect(data.priorityGaps.length).toBe(0);
  });
});

describe("definePositioning", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("returns step=positioning_definition with statement, competitiveFrame, and valueProposition", async () => {
    mockGenerateText
      .mockResolvedValueOnce(JSON.stringify(positioning))
      .mockResolvedValueOnce("# Documento de Posicionamiento\n⚠️ DATOS SINTÉTICOS");

    const result = await definePositioning("client-1", {
      gapAnalysis,
      brandDna,
      buyerPersonas: [{ name: "SMB Owner", age: "35-50" }],
    });

    expect(result.step).toBe("positioning_definition");
    expect(result.status).toBe("completed");

    const data = result.data as typeof positioning;
    expect(data.statement).toBeDefined();
    expect(data.statement.targetAudience).toBeTruthy();
    expect(data.statement.keyBenefit).toBeTruthy();

    expect(data.competitiveFrame).toBeDefined();
    expect(Array.isArray(data.competitiveFrame.directCompetitors)).toBe(true);
    expect(typeof data.competitiveFrame.differentiation).toBe("string");

    expect(data.valueProposition).toBeDefined();
    expect(Array.isArray(data.valueProposition.customerJobs)).toBe(true);
    expect(Array.isArray(data.valueProposition.pains)).toBe(true);
    expect(Array.isArray(data.valueProposition.gains)).toBe(true);

    expect(typeof data.confidenceScore).toBe("number");
    expect(result.artifactContent).toBeDefined();
  });

  it("uses claude-sonnet-4-5 as model (strategic decision)", async () => {
    mockGenerateText
      .mockResolvedValueOnce(JSON.stringify(positioning))
      .mockResolvedValueOnce("# Report");

    await definePositioning("client-1", {
      gapAnalysis,
      brandDna,
      buyerPersonas: [],
    });

    expect(mockGenerateText).toHaveBeenCalledWith(
      "claude-sonnet-4-5",
      expect.any(String),
      expect.any(String),
    );
  });

  it("falls back gracefully on invalid JSON", async () => {
    mockGenerateText
      .mockResolvedValueOnce("{invalid}")
      .mockResolvedValueOnce("# Report");

    const result = await definePositioning("client-2", {
      gapAnalysis,
      brandDna,
      buyerPersonas: [],
    });

    const data = result.data as typeof positioning;
    expect(data.statement).toBeDefined();
    expect(data.competitiveFrame).toBeDefined();
    expect(data.valueProposition).toBeDefined();
  });
});

describe("validatePositioning", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("returns step=validation with confidenceScore in data", async () => {
    const mockValidation = {
      confidenceScore: 82,
      dimensions: {
        clarity: { score: 85, feedback: "Very clear statement" },
        differentiation: { score: 80, feedback: "Strong differentiation" },
        relevance: { score: 90, feedback: "Highly relevant to target" },
        credibility: { score: 75, feedback: "Needs more evidence" },
        consistency: { score: 80, feedback: "Consistent with DNA" },
      },
      strengths: ["Clear target audience", "Strong differentiation"],
      weaknesses: ["Limited reasons to believe"],
      recommendations: ["Add case studies", "Strengthen credibility signals"],
      isValid: true,
      validatedAt: new Date().toISOString(),
    };

    mockGenerateText.mockResolvedValueOnce(JSON.stringify(mockValidation));

    const result = await validatePositioning("client-1", {
      positioning,
      brandDna,
    });

    expect(result.step).toBe("validation");
    expect(result.status).toBe("completed");

    const data = result.data as typeof mockValidation;
    expect(typeof data.confidenceScore).toBe("number");
    expect(data.confidenceScore).toBe(82);
    expect(data.dimensions).toBeDefined();
    expect(data.dimensions.clarity).toBeDefined();
    expect(data.dimensions.differentiation).toBeDefined();
    expect(Array.isArray(data.strengths)).toBe(true);
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(typeof data.isValid).toBe("boolean");
  });

  it("falls back to confidenceScore=0 on invalid JSON", async () => {
    mockGenerateText.mockResolvedValueOnce("garbage response");

    const result = await validatePositioning("client-2", {
      positioning,
      brandDna,
    });

    const data = result.data as { confidenceScore: number };
    expect(typeof data.confidenceScore).toBe("number");
    expect(data.confidenceScore).toBe(0);
  });

  it("uses gemini-2.5-flash model", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({ confidenceScore: 75 }));

    await validatePositioning("client-1", { positioning, brandDna });

    expect(mockGenerateText).toHaveBeenCalledWith(
      "gemini-2.5-flash",
      expect.any(String),
      expect.any(String),
    );
  });
});
