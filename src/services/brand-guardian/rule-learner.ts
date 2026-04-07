import { generateText } from "../../providers/generate-text.js";
import type { BrandDimensionResult } from "./types.js";

interface ExtractedRule {
  dimension: string;
  type: "always" | "never" | "prefer" | "avoid";
  rule: string;
  source: "human_feedback";
  examples: Array<{ correct: string; incorrect: string }>;
  confidence: number;
}

function parseJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(stripped);
}

export async function extractRuleFromFeedback(
  feedback: string,
  overrideAction: string,
  dimensions: BrandDimensionResult[],
): Promise<ExtractedRule> {
  const systemPrompt = `You extract brand rules from human feedback on content validation.
Given the feedback and the validation context, produce a single brand rule.

Return ONLY valid JSON:
{
  "dimension": "tone"|"vocabulary"|"key_messages"|"audience_fit"|"visual_palette"|"typography"|"imagery_style"|"logo_usage",
  "type": "always"|"never"|"prefer"|"avoid",
  "rule": "Clear description of the rule",
  "examples": [{ "correct": "Good example", "incorrect": "Bad example" }]
}`;

  const userPrompt = `## Human Feedback
"${feedback}"

## Override Action
The human ${overrideAction === "pass" ? "rejected a passing validation" : "approved a failing validation"}.

## Validation Dimensions
${dimensions.map((d) => `${d.name}: ${d.score}/100 (${d.status})`).join("\n")}

Extract a brand rule from this feedback.`;

  const raw = await generateText("gemini-2.5-flash", systemPrompt, userPrompt, 1000);
  const parsed = parseJson(raw) as {
    dimension: string;
    type: "always" | "never" | "prefer" | "avoid";
    rule: string;
    examples: Array<{ correct: string; incorrect: string }>;
  };

  return {
    ...parsed,
    source: "human_feedback" as const,
    confidence: 0.8,
  };
}
