import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn(),
}));

vi.mock("../../db/index.js", () => {
  const mockChain = () => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockResolvedValue([]);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.values = vi.fn().mockReturnValue(chain);
    chain.returning = vi.fn().mockResolvedValue([{ id: "v1", overallScore: 85, verdict: "pass", summary: "test" }]);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.set = vi.fn().mockReturnValue(chain);
    return chain;
  };

  return {
    db: mockChain(),
    schema: {
      brandRules: {},
      brandValidations: {},
      brandGuardianConfigs: {},
      brandManuals: {},
      continuousAgentRuns: {},
      clients: {},
    },
  };
});

import { generateText } from "../../providers/generate-text.js";
import { computeOverallScore, determineVerdict } from "./guardian-engine.js";
import { validateVerbal } from "./verbal-validator.js";
import { validateVisual } from "./visual-validator.js";
import { extractRuleFromFeedback } from "./rule-learner.js";
import { generateManualContent } from "./manual-generator.js";
import { DEFAULT_DIMENSION_WEIGHTS } from "./types.js";
import type { BrandGuardianConfig } from "./types.js";

const mockGenerateText = vi.mocked(generateText);

describe("Brand Guardian Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run full validation pipeline: verbal + visual + scoring", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "tone", score: 88, status: "pass", issues: [] },
        { name: "vocabulary", score: 92, status: "pass", issues: [] },
        { name: "key_messages", score: 75, status: "warning", issues: [
          { description: "Missing core value prop", severity: "minor", suggestion: "Add innovation message", reference: "Key Messages" }
        ]},
        { name: "audience_fit", score: 85, status: "pass", issues: [] },
      ],
    }));

    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "visual_palette", score: 95, status: "pass", issues: [] },
        { name: "typography", score: 80, status: "pass", issues: [] },
        { name: "imagery_style", score: 70, status: "warning", issues: [] },
        { name: "logo_usage", score: 90, status: "pass", issues: [] },
      ],
    }));

    const verbal = await validateVerbal({ content: "Test", brandDna: "Brand DNA", rules: [] });
    const visual = await validateVisual({ content: "Test", brandDna: "Brand DNA", rules: [] });

    const allDims = [...verbal, ...visual];
    expect(allDims).toHaveLength(8);

    const score = computeOverallScore(allDims, DEFAULT_DIMENSION_WEIGHTS);
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThan(100);

    const config: BrandGuardianConfig = {
      clientId: "c1", passThreshold: 80, autoPassThreshold: 95,
      strictMode: false, weightsByDimension: {},
    };
    const verdict = determineVerdict(score, allDims, config);
    expect(["pass", "needs_revision"]).toContain(verdict);
  });

  it("should extract rule from override feedback", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimension: "tone",
      type: "prefer",
      rule: "Use warmer, more personal tone in social posts",
      examples: [{ correct: "We'd love your feedback!", incorrect: "Submit your feedback." }],
    }));

    const rule = await extractRuleFromFeedback(
      "Too cold and corporate for our Instagram",
      "reject",
      [{ name: "tone", score: 82, status: "pass", issues: [] }],
    );

    expect(rule.dimension).toBe("tone");
    expect(rule.source).toBe("human_feedback");
    expect(rule.confidence).toBe(0.8);
  });

  it("should generate brand manual with all sections", async () => {
    mockGenerateText.mockResolvedValueOnce(
      "# Brand Manual\n## 1. Brand Overview\nTest\n## 2. Brand Personality\nTest\n" +
      "## 3. Verbal Identity\nTest\n## 4. Visual Identity\nTest\n" +
      "## 5. Logo Usage\nTest\n## 6. Application Examples\nTest\n" +
      "## 7. Channel Guidelines\nTest\n## 8. Do's and Don'ts\nTest",
    );

    const markdown = await generateManualContent("Brand DNA", [], []);
    expect(markdown).toContain("Brand Manual");
    expect(markdown).toContain("Brand Overview");
    expect(markdown).toContain("Do's and Don'ts");
  });

  it("should handle strict mode with critical issues", () => {
    const dims = [
      { name: "tone", score: 90, status: "pass" as const, issues: [] },
      { name: "vocabulary", score: 85, status: "pass" as const, issues: [] },
      { name: "key_messages", score: 80, status: "pass" as const, issues: [] },
      { name: "audience_fit", score: 82, status: "pass" as const, issues: [] },
      { name: "visual_palette", score: 95, status: "pass" as const, issues: [] },
      { name: "typography", score: 80, status: "pass" as const, issues: [] },
      { name: "imagery_style", score: 30, status: "fail" as const, issues: [
        { description: "Wrong imagery", severity: "critical" as const, suggestion: "Fix it", reference: "Imagery" }
      ]},
      { name: "logo_usage", score: 90, status: "pass" as const, issues: [] },
    ];

    const config: BrandGuardianConfig = {
      clientId: "c1", passThreshold: 80, autoPassThreshold: 95,
      strictMode: true, weightsByDimension: {},
    };

    const score = computeOverallScore(dims, DEFAULT_DIMENSION_WEIGHTS);
    const verdict = determineVerdict(score, dims, config);
    expect(verdict).toBe("fail");
  });

  it("should score higher when custom weights favor strong dimensions", () => {
    const dims = [
      { name: "tone", score: 95, status: "pass" as const, issues: [] },
      { name: "vocabulary", score: 50, status: "fail" as const, issues: [] },
      { name: "key_messages", score: 90, status: "pass" as const, issues: [] },
      { name: "audience_fit", score: 88, status: "pass" as const, issues: [] },
      { name: "visual_palette", score: 92, status: "pass" as const, issues: [] },
      { name: "typography", score: 85, status: "pass" as const, issues: [] },
      { name: "imagery_style", score: 80, status: "pass" as const, issues: [] },
      { name: "logo_usage", score: 90, status: "pass" as const, issues: [] },
    ];

    const defaultScore = computeOverallScore(dims, DEFAULT_DIMENSION_WEIGHTS);
    const customWeights = { ...DEFAULT_DIMENSION_WEIGHTS, vocabulary: 1, tone: 30 };
    const customScore = computeOverallScore(dims, customWeights);

    expect(customScore).toBeGreaterThan(defaultScore);
  });

  it("should determine needs_revision for borderline scores", () => {
    const dims = [
      { name: "tone", score: 70, status: "warning" as const, issues: [] },
      { name: "vocabulary", score: 75, status: "warning" as const, issues: [] },
      { name: "key_messages", score: 65, status: "warning" as const, issues: [] },
      { name: "audience_fit", score: 72, status: "warning" as const, issues: [] },
      { name: "visual_palette", score: 68, status: "warning" as const, issues: [] },
      { name: "typography", score: 71, status: "warning" as const, issues: [] },
      { name: "imagery_style", score: 66, status: "warning" as const, issues: [] },
      { name: "logo_usage", score: 73, status: "warning" as const, issues: [] },
    ];

    const config: BrandGuardianConfig = {
      clientId: "c1", passThreshold: 80, autoPassThreshold: 95,
      strictMode: false, weightsByDimension: {},
    };

    const score = computeOverallScore(dims, DEFAULT_DIMENSION_WEIGHTS);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThan(80);

    const verdict = determineVerdict(score, dims, config);
    expect(verdict).toBe("needs_revision");
  });
});
