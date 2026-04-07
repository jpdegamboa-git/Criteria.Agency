import { randomBytes } from "crypto";
import { db, schema } from "../../db/index.js";
import { eq, desc } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import type { BrandRule } from "./types.js";

interface ValidationExample {
  contentType: string;
  score: number;
  verdict: string;
  summary: string;
}

export async function generateManualContent(
  brandDna: string,
  rules: BrandRule[],
  recentValidations: ValidationExample[],
): Promise<string> {
  const rulesSection = rules.length > 0
    ? rules.map((r) => `- [${r.dimension}] ${r.type.toUpperCase()}: ${r.rule} (source: ${r.source})`).join("\n")
    : "No additional rules defined yet.";

  const examplesSection = recentValidations.length > 0
    ? recentValidations.map((v) => `- ${v.contentType}: ${v.score}/100 (${v.verdict}) — ${v.summary}`).join("\n")
    : "No validation examples available yet.";

  const systemPrompt = `You are BG-003 Manual Generator. Generate a comprehensive brand manual in Markdown.
The manual MUST contain exactly these 8 sections:
1. Brand Overview
2. Brand Personality
3. Verbal Identity (tone, vocabulary, do's/don'ts, examples)
4. Visual Identity (colors, typography, imagery)
5. Logo Usage (versions, sizes, clear space)
6. Application Examples (from recent content validations)
7. Channel Guidelines (per-channel adaptations)
8. Do's and Don'ts (gallery of correct vs incorrect)

Write in Spanish. Be specific and actionable. Use the Brand DNA as primary source.`;

  const userPrompt = `## Brand DNA
${brandDna}

## Learned Brand Rules
${rulesSection}

## Recent Validation Examples
${examplesSection}

Generate the complete brand manual.`;

  return await generateText("claude-sonnet-4-20250514", systemPrompt, userPrompt, 8000);
}

export function generateShareToken(): string {
  return randomBytes(32).toString("hex");
}

export async function regenerateManual(clientId: string, brandDna: string): Promise<{ id: string; shareToken: string }> {
  const rules = await db
    .select()
    .from(schema.brandRules)
    .where(eq(schema.brandRules.clientId, clientId));

  const typedRules: BrandRule[] = rules.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    dimension: r.dimension,
    type: r.type as BrandRule["type"],
    rule: r.rule,
    source: r.source as BrandRule["source"],
    examples: (r.examples ?? []) as BrandRule["examples"],
    confidence: parseFloat(r.confidence ?? "1.00"),
    enabled: r.enabled,
  }));

  const validations = await db
    .select()
    .from(schema.brandValidations)
    .where(eq(schema.brandValidations.clientId, clientId))
    .orderBy(desc(schema.brandValidations.createdAt))
    .limit(10);

  const examples: ValidationExample[] = validations.map((v) => ({
    contentType: v.contentType,
    score: v.overallScore,
    verdict: v.verdict,
    summary: v.summary,
  }));

  const markdown = await generateManualContent(brandDna, typedRules, examples);

  const [latest] = await db
    .select()
    .from(schema.brandManuals)
    .where(eq(schema.brandManuals.clientId, clientId))
    .orderBy(desc(schema.brandManuals.version))
    .limit(1);

  const nextVersion = (latest?.version ?? 0) + 1;
  const shareToken = generateShareToken();

  const [manual] = await db
    .insert(schema.brandManuals)
    .values({
      clientId,
      version: nextVersion,
      contentMarkdown: markdown,
      shareToken,
    })
    .returning();

  return { id: manual.id, shareToken: manual.shareToken };
}
