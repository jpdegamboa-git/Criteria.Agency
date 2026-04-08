// src/services/scale/brief-decomposer.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("{}"),
}));

import { parseDecompositionResult, buildDecompositionPrompt } from "./brief-decomposer.js";

describe("brief-decomposer", () => {
  describe("buildDecompositionPrompt", () => {
    it("includes brief text and requested channels", () => {
      const prompt = buildDecompositionPrompt(
        "Launch Q2 campaign for product X targeting millennials",
        ["instagram", "linkedin", "email"],
        5000,
      );
      expect(prompt).toContain("product X");
      expect(prompt).toContain("instagram");
      expect(prompt).toContain("linkedin");
      expect(prompt).toContain("email");
      expect(prompt).toContain("5000");
    });
  });

  describe("parseDecompositionResult", () => {
    it("parses valid LLM JSON into DecompositionResult", () => {
      const llmJson = JSON.stringify({
        subBriefs: [
          {
            motor: "graphic-design",
            channel: "instagram",
            briefContent: "Create 5 Instagram posts for product X",
            specs: { format: "1080x1080", count: 5 },
            priority: 1,
            estimatedCost: 1500,
          },
          {
            motor: "writers-room",
            channel: "linkedin",
            briefContent: "Write 3 LinkedIn articles about product X",
            specs: { wordCount: 800 },
            priority: 2,
            estimatedCost: 1000,
          },
        ],
        sharedContext: {
          campaignMessage: "Product X transforms your workflow",
          visualDirection: "Modern, minimal, blue tones",
          toneGuidelines: "Professional but approachable",
          targetAudience: "Urban millennials 25-35",
          callToAction: "Try free for 30 days",
        },
        totalEstimatedCost: 2500,
      });

      const result = parseDecompositionResult(llmJson);
      expect(result.subBriefs).toHaveLength(2);
      expect(result.subBriefs[0].motor).toBe("graphic-design");
      expect(result.sharedContext.campaignMessage).toContain("Product X");
      expect(result.totalEstimatedCost).toBe(2500);
    });

    it("handles markdown-fenced JSON", () => {
      const fenced =
        "```json\n" +
        JSON.stringify({
          subBriefs: [],
          sharedContext: {
            campaignMessage: "msg",
            visualDirection: "dir",
            toneGuidelines: "tone",
            targetAudience: "audience",
            callToAction: "cta",
          },
          totalEstimatedCost: 0,
        }) +
        "\n```";

      const result = parseDecompositionResult(fenced);
      expect(result.subBriefs).toHaveLength(0);
      expect(result.sharedContext.campaignMessage).toBe("msg");
    });

    it("throws on invalid JSON", () => {
      expect(() => parseDecompositionResult("not json")).toThrow();
    });
  });
});
