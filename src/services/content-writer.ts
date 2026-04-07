import fs from "fs/promises";
import path from "path";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { generateText } from "../providers/generate-text.js";
import { config } from "../shared/config.js";

// ── Types ──

interface ContentBrief {
  type: "linkedin_post" | "email_nurture" | "blog_article" | "social_caption" | "landing_copy";
  topic: string;
  audience: string;
  tone: string;
  keyMessage: string;
  cta: string;
  additionalContext?: string;
}

interface ContentOutput {
  content: string;
  title: string;
  meta: {
    keywords: string[];
    cta: string;
    audience: string;
    wordCount: number;
    readabilityScore: number;
  };
}

interface AutoReviewResult {
  passed: boolean;
  issues: string[];
}

// ── Constants ──

const WORD_LIMITS: Record<ContentBrief["type"], number> = {
  linkedin_post: 300,
  email_nurture: 500,
  blog_article: 1500,
  social_caption: 150,
  landing_copy: 800,
};

const BANNED_WORDS = [
  "revolutionary",
  "game-changing",
  "cutting-edge",
  "disruptive",
  "synergy",
  "paradigm shift",
  "best-in-class",
];

// "leverage" as a verb is banned but not as a noun.
// We check for common verb patterns: "leverage your", "leverage the", "to leverage", etc.
const LEVERAGE_VERB_PATTERNS = [
  /\bleverage\s+(your|the|our|their|its|this|that|a|an)\b/i,
  /\bto\s+leverage\b/i,
  /\bleveraging\b/i,
  /\bleveraged\b/i,
];

// ── Helpers ──

async function loadSkillFile(): Promise<string> {
  const skillPath = path.join(config.agentsPath, "DC-001_content_writer.md");
  return fs.readFile(skillPath, "utf-8");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function autoReview(output: ContentOutput, brief: ContentBrief): AutoReviewResult {
  const issues: string[] = [];
  const targetWords = WORD_LIMITS[brief.type];
  const actualWords = countWords(output.content);
  const tolerance = targetWords * 0.1;

  // Word count check: within +/- 10%
  if (actualWords < targetWords - tolerance) {
    issues.push(
      `Word count too low: ${actualWords} words (target: ${targetWords}, minimum: ${Math.ceil(targetWords - tolerance)})`
    );
  }
  if (actualWords > targetWords + tolerance) {
    issues.push(
      `Word count too high: ${actualWords} words (target: ${targetWords}, maximum: ${Math.floor(targetWords + tolerance)})`
    );
  }

  // CTA presence check
  const contentLower = output.content.toLowerCase();
  const ctaLower = brief.cta.toLowerCase();
  const hasCta =
    contentLower.includes(ctaLower) ||
    output.meta.cta.length > 0;
  if (!hasCta) {
    issues.push("No CTA found in content or meta");
  }

  // Banned words check
  for (const word of BANNED_WORDS) {
    if (contentLower.includes(word.toLowerCase())) {
      issues.push(`Banned word found: "${word}"`);
    }
  }

  // "leverage" as verb check
  for (const pattern of LEVERAGE_VERB_PATTERNS) {
    if (pattern.test(output.content)) {
      issues.push('Banned usage found: "leverage" used as a verb');
      break;
    }
  }

  return { passed: issues.length === 0, issues };
}

function parseContentOutput(raw: string, brief: ContentBrief): ContentOutput {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Handle mock mode response
    if (parsed._mock) {
      return {
        content: `[MOCK] Content about "${brief.topic}" for ${brief.audience}.\n\n${brief.keyMessage}\n\nCTA: ${brief.cta}`,
        title: `[MOCK] ${brief.topic}`,
        meta: {
          keywords: [brief.topic.toLowerCase()],
          cta: brief.cta,
          audience: brief.audience,
          wordCount: 30,
          readabilityScore: 70,
        },
      };
    }

    if (!parsed.content || !parsed.title || !parsed.meta) {
      throw new Error("Missing required fields");
    }

    return parsed as ContentOutput;
  } catch {
    // Fallback: treat raw response as content
    return {
      content: raw,
      title: brief.topic,
      meta: {
        keywords: [],
        cta: brief.cta,
        audience: brief.audience,
        wordCount: raw.split(/\s+/).length,
        readabilityScore: 70,
      },
    };
  }
}

// ── Main Functions ──

export async function generateContent(brief: ContentBrief): Promise<ContentOutput> {
  const systemPrompt = await loadSkillFile();
  const targetWords = WORD_LIMITS[brief.type];

  const prompt = `Generate content based on this brief:

Type: ${brief.type}
Topic: ${brief.topic}
Target Audience: ${brief.audience}
Tone: ${brief.tone}
Key Message: ${brief.keyMessage}
CTA: ${brief.cta}
${brief.additionalContext ? `Additional Context: ${brief.additionalContext}` : ""}

Target word count: ${targetWords} words (must be within ±10%).

Respond with valid JSON only. No markdown fences, no explanation.`;

  let output: ContentOutput | null = null;
  const maxAttempts = 3; // 1 initial + 2 self-revisions

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const currentPrompt =
      attempt === 1
        ? prompt
        : `${prompt}

REVISION ATTEMPT ${attempt}: The previous version had these issues:
${autoReview(output!, brief).issues.map((i) => `- ${i}`).join("\n")}

Fix ALL issues and respond with the corrected JSON only.`;

    const raw = await generateText("claude-sonnet-4", systemPrompt, currentPrompt, 4096);

    output = parseContentOutput(raw, brief);

    const review = autoReview(output, brief);
    if (review.passed) {
      return output;
    }

    // If this is the last attempt, return what we have
    if (attempt === maxAttempts) {
      console.warn(
        `[Content Writer] Auto-review still failing after ${maxAttempts} attempts. Issues: ${review.issues.join(", ")}`
      );
      return output;
    }
  }

  // Unreachable, but TypeScript wants it
  return output!;
}

export async function reviseContent(
  contentId: string,
  feedback: string
): Promise<ContentOutput> {
  const [piece] = await db
    .select()
    .from(schema.contentPieces)
    .where(eq(schema.contentPieces.id, contentId));

  if (!piece) {
    throw new Error(`Content piece not found: ${contentId}`);
  }

  const systemPrompt = await loadSkillFile();
  const brief = piece.brief as Record<string, string>;
  const targetWords = WORD_LIMITS[piece.type as ContentBrief["type"]] ?? 500;

  const prompt = `Revise this content based on feedback.

CURRENT CONTENT:
Title: ${piece.title ?? ""}
Content: ${piece.content ?? ""}

ORIGINAL BRIEF:
Type: ${piece.type}
Topic: ${brief.topic ?? ""}
Audience: ${brief.audience ?? ""}
Tone: ${brief.tone ?? ""}
Key Message: ${brief.keyMessage ?? ""}
CTA: ${brief.cta ?? ""}

FEEDBACK:
${feedback}

Target word count: ${targetWords} words (must be within ±10%).
Apply the feedback while maintaining brand voice and content rules.
Respond with valid JSON only. No markdown fences, no explanation.`;

  const raw = await generateText("claude-sonnet-4", systemPrompt, prompt, 4096);

  return parseContentOutput(raw, brief as unknown as ContentBrief);
}
