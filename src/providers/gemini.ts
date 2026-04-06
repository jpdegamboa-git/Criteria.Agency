import { readFile } from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import type {
  ModelType,
  ModelEntry,
  ModelProvider,
  GenerateParams,
  GenerateResult,
  Attachment,
} from "./types.js";
import { MODEL_CATALOG } from "./catalog.js";
import { config } from "../shared/config.js";

// ── Model-ID Mapping (catalog → Google API) ───────────────────
const MODEL_ID_MAP: Record<string, string> = {
  "gemini-2.5-pro": "gemini-2.5-pro-preview-06-05",
  "gemini-2.5-flash": "gemini-2.5-flash-preview-05-20",
  "gemini-imagen-3": "imagen-3.0-generate-002",
  "veo-3": "veo-3.0-generate-preview",
  "gemini-2.5-pro-audio": "gemini-2.5-pro-preview-06-05",
};

function resolveModelId(catalogId: string): string {
  return MODEL_ID_MAP[catalogId] ?? catalogId;
}

// ── Gemini Provider ───────────────────────────────────────────
export class GeminiProvider implements ModelProvider {
  id = "gemini";
  type: ModelType;
  models: ModelEntry[];
  private client: GoogleGenAI | null;

  constructor(type: ModelType) {
    this.type = type;
    this.models = MODEL_CATALOG.filter(
      (m) => m.provider === "gemini" && m.type === type,
    );
    this.client = config.googleAiApiKey
      ? new GoogleGenAI({ apiKey: config.googleAiApiKey })
      : null;
  }

  // ── generate ──────────────────────────────────────────────
  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!this.client) {
      return {
        status: "failed",
        error: "Google AI API key not configured",
      };
    }

    const catalogEntry = this.models.find((m) => m.id === params.model);
    const entryType = catalogEntry?.type ?? this.type;
    const apiModel = resolveModelId(params.model);

    switch (entryType) {
      case "image":
        return this.generateImage(apiModel, params);
      case "video":
        return this.generateVideo(apiModel, params);
      case "text":
      case "audio":
      default:
        return this.generateText(apiModel, params);
    }
  }

  // ── Text / Audio generation ───────────────────────────────
  private async generateText(
    apiModel: string,
    params: GenerateParams,
  ): Promise<GenerateResult> {
    const parts = await this.buildParts(params.attachments ?? []);
    parts.push({ text: params.userPrompt });

    const response = await this.client!.models.generateContent({
      model: apiModel,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: params.systemPrompt,
        maxOutputTokens: params.maxTokens,
        temperature: params.temperature,
      },
    });

    const text = response.text;
    return {
      status: "completed",
      output: {
        text: text ?? "",
        metadata: {
          model: apiModel,
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
        },
      },
      cost: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  // ── Image generation (Imagen 3) ───────────────────────────
  private async generateImage(
    apiModel: string,
    params: GenerateParams,
  ): Promise<GenerateResult> {
    const response = await this.client!.models.generateImages({
      model: apiModel,
      prompt: params.userPrompt,
      config: { numberOfImages: 1 },
    });

    const image = response.generatedImages?.[0];
    const imageBase64 = image?.image?.imageBytes;

    if (!imageBase64) {
      return {
        status: "failed",
        error:
          image?.raiFilteredReason ??
          "No image generated (possibly filtered by safety)",
      };
    }

    return {
      status: "completed",
      output: {
        metadata: { imageBase64, model: apiModel },
      },
    };
  }

  // ── Video generation (Veo 3) — async ──────────────────────
  private async generateVideo(
    apiModel: string,
    params: GenerateParams,
  ): Promise<GenerateResult> {
    const operation = await this.client!.models.generateVideos({
      model: apiModel,
      prompt: params.userPrompt,
    });

    if (!operation.name) {
      return { status: "failed", error: "No operation name returned" };
    }

    return {
      status: "processing",
      jobId: operation.name,
    };
  }

  // ── checkJob (video async polling) ────────────────────────
  async checkJob(jobId: string): Promise<GenerateResult> {
    if (!this.client) {
      return { status: "failed", error: "Google AI API key not configured" };
    }

    const op = await this.client.operations.getVideosOperation({
      operation: { name: jobId } as Parameters<
        typeof this.client.operations.getVideosOperation
      >[0]["operation"],
    });

    if (!op.done) {
      return { status: "processing", jobId };
    }

    if (op.error) {
      return {
        status: "failed",
        error: JSON.stringify(op.error),
      };
    }

    const videoUri = op.response?.generatedVideos?.[0]?.video?.uri;
    return {
      status: "completed",
      output: {
        fileUrl: videoUri ?? undefined,
        metadata: { model: "veo-3", jobId },
      },
    };
  }

  // ── getStatus ─────────────────────────────────────────────
  async getStatus(): Promise<{ available: boolean; error?: string }> {
    if (!this.client) {
      return { available: false, error: "Google AI API key not configured" };
    }
    return { available: true };
  }

  // ── Helpers ───────────────────────────────────────────────
  private async buildParts(
    attachments: Attachment[],
  ): Promise<Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>> {
    const parts: Array<
      { text: string } | { inlineData: { data: string; mimeType: string } }
    > = [];

    for (const att of attachments) {
      if (att.type === "json" || att.type === "document") {
        const content = await readFile(att.filePath, "utf-8");
        parts.push({ text: `[${att.name}]\n${content}` });
      } else {
        // image, video, audio → inlineData (base64)
        const data = await readFile(att.filePath);
        parts.push({
          inlineData: {
            data: data.toString("base64"),
            mimeType: att.mimeType,
          },
        });
      }
    }

    return parts;
  }
}
