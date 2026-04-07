import { generateText } from "../../providers/generate-text.js";
import type { BrandDimensionResult, VerbalValidationInput, BrandRule } from "./types.js";
import { VERBAL_DIMENSIONS } from "./types.js";

function formatRulesForPrompt(rules: BrandRule[]): string {
  if (rules.length === 0) return "No additional rules.";
  return rules.map((r) => `- [${r.dimension}] ${r.type.toUpperCase()}: ${r.rule}`).join("\n");
}

function parseJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(stripped);
}

export async function validateVerbal(input: VerbalValidationInput): Promise<BrandDimensionResult[]> {
  const { content, brandDna, rules } = input;

  const verbalRules = rules.filter((r) => VERBAL_DIMENSIONS.includes(r.dimension as any));

  const systemPrompt = `You are BG-001 Verbal Validator. You evaluate content against a brand's verbal identity.
Score each dimension 0-100. Status: "pass" (>=80), "warning" (60-79), "fail" (<60).
For each issue found, provide description, severity (critical/major/minor), suggestion, and reference to Brand DNA section.

Return ONLY valid JSON with this exact structure:
{
  "dimensions": [
    { "name": "tone", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "vocabulary", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "key_messages", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "audience_fit", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] }
  ]
}`;

  const userPrompt = `## Brand DNA
${brandDna}

## Additional Brand Rules
${formatRulesForPrompt(verbalRules)}

## Content to Validate
${content}

Evaluate the content against the brand's verbal identity across all 4 dimensions.`;

  const raw = await generateText("gemini-2.5-flash", systemPrompt, userPrompt, 2000);
  const parsed = parseJson(raw) as { dimensions: BrandDimensionResult[] };
  return parsed.dimensions;
}
