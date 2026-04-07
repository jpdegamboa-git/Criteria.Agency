import { generateText } from "../../providers/generate-text.js";
import type { BrandDimensionResult, VisualValidationInput, BrandRule } from "./types.js";
import { VISUAL_DIMENSIONS } from "./types.js";

function formatRulesForPrompt(rules: BrandRule[]): string {
  if (rules.length === 0) return "No additional rules.";
  return rules.map((r) => `- [${r.dimension}] ${r.type.toUpperCase()}: ${r.rule}`).join("\n");
}

function parseJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(stripped);
}

export async function validateVisual(input: VisualValidationInput): Promise<BrandDimensionResult[]> {
  const { content, brandDna, rules } = input;

  const visualRules = rules.filter((r) => VISUAL_DIMENSIONS.includes(r.dimension as any));

  const systemPrompt = `You are BG-002 Visual Validator. You evaluate content against a brand's visual identity.
For text content, evaluate any visual references (colors, fonts, layout descriptions). If no visual elements are present, score all dimensions 100.
Score each dimension 0-100. Status: "pass" (>=80), "warning" (60-79), "fail" (<60).

Return ONLY valid JSON:
{
  "dimensions": [
    { "name": "visual_palette", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "typography", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "imagery_style", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "logo_usage", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] }
  ]
}

Each issue: { "description": string, "severity": "critical"|"major"|"minor", "suggestion": string, "reference": string }`;

  const userPrompt = `## Brand Visual Identity
${brandDna}

## Additional Brand Rules
${formatRulesForPrompt(visualRules)}

## Content to Validate
${content}

Evaluate the content's visual elements against the brand's visual identity.`;

  const raw = await generateText("gemini-2.5-flash", systemPrompt, userPrompt, 2000);
  const parsed = parseJson(raw) as { dimensions: BrandDimensionResult[] };
  return parsed.dimensions;
}
