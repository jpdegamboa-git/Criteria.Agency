import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateVerbal } from "./verbal-validator.js";
import { validateVisual } from "./visual-validator.js";
import type { BrandRule, VerbalValidationInput, VisualValidationInput } from "./types.js";
import { computeOverallScore, determineVerdict } from "./guardian-engine.js";
import { extractRuleFromFeedback } from "./rule-learner.js";
import { DEFAULT_DIMENSION_WEIGHTS } from "./types.js";
import type { BrandGuardianConfig, BrandDimensionResult } from "./types.js";

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn(),
}));

import { generateText } from "../../providers/generate-text.js";
const mockGenerateText = vi.mocked(generateText);

describe("VerbalValidator", () => {
  const brandDna = "Brand: TestCo. Tone: professional, warm. Never use slang. Key message: Innovation for everyone.";
  const rules: BrandRule[] = [
    {
      id: "r1", clientId: "c1", dimension: "tone", type: "always",
      rule: "Use professional and warm tone", source: "brand_dna",
      examples: [{ correct: "We'd love to help", incorrect: "Yo, hit us up" }],
      confidence: 1.0, enabled: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 4 verbal dimension results", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "tone", score: 90, status: "pass", issues: [] },
        { name: "vocabulary", score: 85, status: "pass", issues: [] },
        { name: "key_messages", score: 70, status: "warning", issues: [
          { description: "Key message not clearly stated", severity: "minor", suggestion: "Add explicit mention of innovation", reference: "Key Messages" }
        ]},
        { name: "audience_fit", score: 80, status: "pass", issues: [] },
      ],
    }));

    const input: VerbalValidationInput = { content: "Welcome to TestCo solutions", brandDna, rules };
    const result = await validateVerbal(input);

    expect(result).toHaveLength(4);
    expect(result[0].name).toBe("tone");
    expect(result[2].issues).toHaveLength(1);
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("should handle LLM returning code-fenced JSON", async () => {
    mockGenerateText.mockResolvedValueOnce("```json\n" + JSON.stringify({
      dimensions: [
        { name: "tone", score: 60, status: "fail", issues: [
          { description: "Too casual", severity: "major", suggestion: "Use formal tone", reference: "Tone Guidelines" }
        ]},
        { name: "vocabulary", score: 90, status: "pass", issues: [] },
        { name: "key_messages", score: 85, status: "pass", issues: [] },
        { name: "audience_fit", score: 75, status: "warning", issues: [] },
      ],
    }) + "\n```");

    const result = await validateVerbal({ content: "Hey dude, check this out", brandDna, rules });
    expect(result).toHaveLength(4);
    expect(result[0].score).toBe(60);
    expect(result[0].status).toBe("fail");
  });
});

describe("VisualValidator", () => {
  const brandDna = "Visual: Primary colors #2563EB, #1E293B. Font: Inter. Style: minimalist, clean photography. Logo: always on white bg.";
  const rules: BrandRule[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 4 visual dimension results", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "visual_palette", score: 95, status: "pass", issues: [] },
        { name: "typography", score: 80, status: "pass", issues: [] },
        { name: "imagery_style", score: 70, status: "warning", issues: [
          { description: "Image style inconsistent with minimalist guidelines", severity: "minor", suggestion: "Use cleaner backgrounds", reference: "Imagery Guidelines" }
        ]},
        { name: "logo_usage", score: 90, status: "pass", issues: [] },
      ],
    }));

    const input: VisualValidationInput = { content: "Landing page with hero banner using brand colors", brandDna, rules };
    const result = await validateVisual(input);

    expect(result).toHaveLength(4);
    expect(result[0].name).toBe("visual_palette");
    expect(result[2].issues).toHaveLength(1);
  });

  it("should return all pass for text-only content with no visual references", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "visual_palette", score: 100, status: "pass", issues: [] },
        { name: "typography", score: 100, status: "pass", issues: [] },
        { name: "imagery_style", score: 100, status: "pass", issues: [] },
        { name: "logo_usage", score: 100, status: "pass", issues: [] },
      ],
    }));

    const result = await validateVisual({ content: "Just a plain text email", brandDna, rules });
    expect(result.every((d) => d.score === 100)).toBe(true);
  });
});

describe("GuardianEngine", () => {
  const allPassDimensions: BrandDimensionResult[] = [
    { name: "tone", score: 90, status: "pass", issues: [] },
    { name: "vocabulary", score: 85, status: "pass", issues: [] },
    { name: "key_messages", score: 80, status: "pass", issues: [] },
    { name: "audience_fit", score: 88, status: "pass", issues: [] },
    { name: "visual_palette", score: 95, status: "pass", issues: [] },
    { name: "typography", score: 82, status: "pass", issues: [] },
    { name: "imagery_style", score: 78, status: "warning", issues: [] },
    { name: "logo_usage", score: 90, status: "pass", issues: [] },
  ];

  describe("computeOverallScore", () => {
    it("should compute weighted average from dimension scores", () => {
      const score = computeOverallScore(allPassDimensions, DEFAULT_DIMENSION_WEIGHTS);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThan(100);
    });

    it("should use custom weights when provided", () => {
      const customWeights = { tone: 50, vocabulary: 10, key_messages: 10, audience_fit: 10, visual_palette: 5, typography: 5, imagery_style: 5, logo_usage: 5 };
      const score = computeOverallScore(allPassDimensions, customWeights);
      expect(score).toBeGreaterThan(85);
    });
  });

  describe("determineVerdict", () => {
    const defaultConfig: BrandGuardianConfig = {
      clientId: "c1",
      passThreshold: 80,
      autoPassThreshold: 95,
      strictMode: false,
      weightsByDimension: {},
    };

    it("should return pass for score >= passThreshold", () => {
      expect(determineVerdict(85, allPassDimensions, defaultConfig)).toBe("pass");
    });

    it("should return fail for score < 60", () => {
      expect(determineVerdict(55, allPassDimensions, defaultConfig)).toBe("fail");
    });

    it("should return needs_revision for score between 60 and threshold", () => {
      expect(determineVerdict(70, allPassDimensions, defaultConfig)).toBe("needs_revision");
    });

    it("should return fail in strict mode if any critical issue exists", () => {
      const dims: BrandDimensionResult[] = [
        ...allPassDimensions.slice(0, 7),
        { name: "logo_usage", score: 40, status: "fail", issues: [
          { description: "Logo on wrong bg", severity: "critical", suggestion: "Use white bg", reference: "Logo" }
        ]},
      ];
      const strictConfig = { ...defaultConfig, strictMode: true };
      expect(determineVerdict(82, dims, strictConfig)).toBe("fail");
    });
  });
});

describe("RuleLearner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract a rule from human feedback", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimension: "tone",
      type: "prefer",
      rule: "Use conversational tone for social media posts",
      examples: [
        { correct: "Check out our latest update!", incorrect: "We hereby announce the release of..." }
      ],
    }));

    const result = await extractRuleFromFeedback(
      "The tone is too formal for Instagram. We want casual and fun.",
      "pass",
      [{ name: "tone", score: 85, status: "pass", issues: [] }],
    );

    expect(result.dimension).toBe("tone");
    expect(result.type).toBe("prefer");
    expect(result.source).toBe("human_feedback");
    expect(result.examples).toHaveLength(1);
  });

  it("should return learned source and default confidence", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimension: "vocabulary",
      type: "never",
      rule: "Never use the word 'synergy'",
      examples: [
        { correct: "collaboration", incorrect: "synergy" }
      ],
    }));

    const result = await extractRuleFromFeedback(
      "Stop using 'synergy', it's cringe",
      "fail",
      [],
    );

    expect(result.source).toBe("human_feedback");
    expect(result.confidence).toBe(0.8);
  });
});
