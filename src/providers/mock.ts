import type {
  ModelType,
  ModelEntry,
  ModelProvider,
  GenerateParams,
  GenerateResult,
} from "./types.js";
import { getModelsByType } from "./catalog.js";

// ── Mock Provider ───────────────────────────────────────────────
// Returns synthetic responses for every generation type.
// Used as a fallback when API keys are not configured.

export class MockProvider implements ModelProvider {
  id: string;
  type: ModelType;
  models: ModelEntry[];

  constructor(type: ModelType) {
    this.type = type;
    this.id = `mock-${type}`;
    this.models = getModelsByType(type);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    console.log(
      `[MockProvider:${this.type}] generate called for model=${params.model}`
    );

    if (this.type === "text") {
      return {
        status: "completed",
        output: {
          text: `[MOCK] Response to: ${params.userPrompt.slice(0, 80)}...`,
          metadata: { mock: true, model: params.model },
        },
        cost: {
          inputTokens: 100,
          outputTokens: 200,
          estimatedUsd: 0,
        },
      };
    }

    // image / video / audio — return mock file metadata
    const extensions: Record<string, string> = {
      image: "png",
      video: "mp4",
      audio: "wav",
    };
    const ext = extensions[this.type] ?? "bin";

    return {
      status: "completed",
      output: {
        filePath: `/tmp/mock-${this.type}-${Date.now()}.${ext}`,
        metadata: {
          mock: true,
          model: params.model,
          type: this.type,
          prompt: params.userPrompt.slice(0, 80),
        },
      },
      cost: { credits: 0, estimatedUsd: 0 },
    };
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    return { available: true };
  }
}
