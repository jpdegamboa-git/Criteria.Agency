import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateVerbal } from "./verbal-validator.js";
import type { BrandRule, VerbalValidationInput } from "./types.js";

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
