/**
 * @deprecated This module creates a standalone Anthropic SDK client that bypasses
 * the provider registry, rate limiting, and cost tracking.
 * Use `generateText` from `../providers/generate-text.js` instead.
 */

// Re-export the canonical helper for backward compatibility.
export { generateText } from "../providers/generate-text.js";

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../shared/config.js";

const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;

export async function askClaude(params: {
  system: string;
  prompt: string;
  model?: "claude-sonnet-4-20250514" | "claude-haiku-4-20250414";
  maxTokens?: number;
}): Promise<string> {
  const model = params.model ?? "claude-haiku-4-20250414";

  if (!anthropic) {
    console.log(`[CLAUDE MOCK] model=${model}`);
    console.log(`[CLAUDE MOCK] system: ${params.system.slice(0, 100)}...`);
    console.log(`[CLAUDE MOCK] prompt: ${params.prompt.slice(0, 200)}...`);
    return JSON.stringify({
      _mock: true,
      message: "Claude API key not configured. Set ANTHROPIC_API_KEY in .env",
    });
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

export function isClaudeConfigured(): boolean {
  return anthropic !== null;
}
