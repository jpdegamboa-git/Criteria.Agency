// src/services/scale/brief-decomposer.ts
import { generateText } from "@/providers/generate-text.js";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type { DecompositionResult } from "./types.js";

const DECOMPOSITION_MODEL = "gemini-2.5-flash";

// Channel → default motor mapping
const CHANNEL_MOTOR_MAP: Record<string, string> = {
  instagram: "graphic-design",
  facebook: "graphic-design",
  linkedin: "writers-room",
  twitter: "writers-room",
  email: "email-marketing",
  youtube: "video-production",
  tiktok: "video-production",
  website: "web",
  podcast: "audio",
  blog: "writers-room",
};

export function buildDecompositionPrompt(
  briefText: string,
  channels: string[],
  budgetTotal: number,
): string {
  return `You are a campaign strategist. Decompose this campaign brief into channel-specific sub-briefs.

CAMPAIGN BRIEF:
${briefText}

REQUESTED CHANNELS: ${channels.join(", ")}
TOTAL BUDGET: $${budgetTotal}

For each channel, produce a sub-brief specifying what content to create, with specs and estimated cost.
Distribute the budget proportionally across channels based on typical effectiveness.

Respond with ONLY valid JSON (no markdown fences):
{
  "subBriefs": [
    {
      "motor": "<motor-name>",
      "channel": "<channel>",
      "briefContent": "<detailed brief for this channel>",
      "specs": { ... },
      "priority": <1-N>,
      "estimatedCost": <number>
    }
  ],
  "sharedContext": {
    "campaignMessage": "<core message>",
    "visualDirection": "<visual guidelines>",
    "toneGuidelines": "<tone and voice>",
    "targetAudience": "<target audience description>",
    "callToAction": "<primary CTA>"
  },
  "totalEstimatedCost": <number>
}`;
}

export function parseDecompositionResult(text: string): DecompositionResult {
  const parsed = parseJsonSafe<DecompositionResult | null>(text, null);
  if (!parsed) throw new Error("Failed to parse decomposition result");

  // Validate required fields
  if (!Array.isArray(parsed.subBriefs)) {
    throw new Error("Missing subBriefs array");
  }
  if (!parsed.sharedContext?.campaignMessage) {
    throw new Error("Missing sharedContext.campaignMessage");
  }

  return {
    subBriefs: parsed.subBriefs,
    sharedContext: parsed.sharedContext,
    totalEstimatedCost: parsed.totalEstimatedCost ?? 0,
  };
}

export function assignMotors(channels: string[]): Array<{ channel: string; motor: string }> {
  return channels.map((ch) => ({
    channel: ch,
    motor: CHANNEL_MOTOR_MAP[ch] ?? "writers-room",
  }));
}

export async function decomposeBrief(
  briefText: string,
  channels: string[],
  budgetTotal: number,
): Promise<DecompositionResult> {
  const prompt = buildDecompositionPrompt(briefText, channels, budgetTotal);

  const text = await generateText(
    DECOMPOSITION_MODEL,
    "You are a campaign strategist specializing in multi-channel marketing.",
    prompt,
  );

  return parseDecompositionResult(text);
}
