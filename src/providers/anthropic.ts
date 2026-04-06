import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js";
import fs from "fs/promises";
import path from "path";

import type {
  ModelProvider,
  ModelEntry,
  GenerateParams,
  GenerateResult,
  Attachment,
} from "./types.js";
import { getModelsByProvider } from "./catalog.js";
import { config } from "../shared/config.js";

// ── Model ID Mapping ──────────────────────────────────────────────

const API_MODEL_MAP: Record<string, string> = {
  "claude-opus-4": "claude-opus-4-20250514",
  "claude-sonnet-4": "claude-sonnet-4-20250514",
  "claude-haiku-4": "claude-haiku-4-20250414",
};

// ── Cost Rates (USD per token) ────────────────────────────────────

const COST_RATES: Record<string, { input: number; output: number }> = {
  "claude-opus-4-20250514": { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  "claude-sonnet-4-20250514": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-haiku-4-20250414": {
    input: 0.8 / 1_000_000,
    output: 4 / 1_000_000,
  },
};

// ── Helpers ────────────────────────────────────────────────────────

type ContentBlock =
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } }
  | { type: "text"; text: string };

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

function isImageMime(
  mime: string
): mime is "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  return IMAGE_MIME_TYPES.has(mime);
}

async function attachmentToBlock(
  att: Attachment
): Promise<ContentBlock | null> {
  if (att.type === "image" && isImageMime(att.mimeType)) {
    const data = await fs.readFile(att.filePath);
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: att.mimeType,
        data: data.toString("base64"),
      },
    };
  }

  if (att.type === "json" || att.type === "document") {
    const content = await fs.readFile(att.filePath, "utf-8");
    return {
      type: "text",
      text: `[Attachment: ${att.name}]\n${content}`,
    };
  }

  // video / audio — not supported by Claude messages API
  return null;
}

// ── Anthropic Provider ────────────────────────────────────────────

export class AnthropicProvider implements ModelProvider {
  id = "anthropic" as const;
  type = "text" as const;
  models: ModelEntry[];

  private client: Anthropic | null;

  constructor() {
    this.models = getModelsByProvider("anthropic");
    this.client = config.anthropicApiKey
      ? new Anthropic({ apiKey: config.anthropicApiKey })
      : null;
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!this.client) {
      return {
        status: "failed",
        error: "Anthropic API key not configured",
      };
    }

    const apiModel = API_MODEL_MAP[params.model];
    if (!apiModel) {
      return {
        status: "failed",
        error: `Unknown model: ${params.model}`,
      };
    }

    // Build content blocks
    const contentBlocks: ContentBlock[] = [];

    if (params.attachments) {
      for (const att of params.attachments) {
        const block = await attachmentToBlock(att);
        if (block) contentBlocks.push(block);
      }
    }

    contentBlocks.push({ type: "text", text: params.userPrompt });

    try {
      const message = await this.client.messages.create({
        model: apiModel,
        max_tokens: params.maxTokens ?? 4096,
        ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
        messages: [
          { role: "user", content: contentBlocks },
        ] satisfies MessageParam[],
      });

      // Extract text from response
      const text = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      // Calculate cost
      const rates = COST_RATES[apiModel];
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const estimatedUsd = rates
        ? inputTokens * rates.input + outputTokens * rates.output
        : 0;

      return {
        status: "completed",
        output: {
          text,
          metadata: {
            model: apiModel,
            stopReason: message.stop_reason,
          },
        },
        cost: {
          inputTokens,
          outputTokens,
          estimatedUsd,
        },
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown Anthropic API error";
      return {
        status: "failed",
        error: errorMessage,
      };
    }
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    if (!this.client) {
      return { available: false, error: "Anthropic API key not configured" };
    }
    return { available: true };
  }
}
