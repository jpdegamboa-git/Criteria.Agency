import type { ModelEntry, ModelType } from "./types.js";

// ── Model Catalog (10 models, 3 providers) ──────────────────────

export const MODEL_CATALOG: ModelEntry[] = [
  // ── Anthropic (text) ──
  {
    id: "claude-opus-4",
    provider: "anthropic",
    type: "text",
    tier: "premium",
    costPer1k: 0.015,
    maxTokens: 32_000,
    capabilities: ["reasoning", "vision", "code", "evaluation"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "claude-sonnet-4",
    provider: "anthropic",
    type: "text",
    tier: "standard",
    costPer1k: 0.003,
    maxTokens: 16_000,
    capabilities: ["reasoning", "vision", "code", "creative"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "claude-haiku-4",
    provider: "anthropic",
    type: "text",
    tier: "fast",
    costPer1k: 0.00025,
    maxTokens: 8_000,
    capabilities: ["classification", "extraction", "simple_reasoning"],
    supportedInputs: ["text", "image", "json"],
  },

  // ── Gemini (text) ──
  {
    id: "gemini-2.5-pro",
    provider: "gemini",
    type: "text",
    tier: "premium",
    costPer1k: 0.01,
    maxTokens: 65_000,
    capabilities: [
      "reasoning",
      "vision",
      "code",
      "multimodal",
      "long_context",
    ],
    supportedInputs: ["text", "image", "video", "audio", "json"],
  },
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    type: "text",
    tier: "fast",
    costPer1k: 0.0005,
    maxTokens: 16_000,
    capabilities: ["reasoning", "classification", "multimodal"],
    supportedInputs: ["text", "image", "video", "audio", "json"],
  },

  // ── Gemini (image) ──
  {
    id: "gemini-imagen-3",
    provider: "gemini",
    type: "image",
    tier: "standard",
    costPer1k: 0.04,
    capabilities: ["photorealistic", "illustration", "text_rendering"],
    supportedInputs: ["text", "image"],
  },

  // ── Gemini (video) ──
  {
    id: "veo-3",
    provider: "gemini",
    type: "video",
    tier: "premium",
    costPer1k: 0.5,
    maxDuration: 8,
    capabilities: [
      "high_quality",
      "camera_control",
      "complex_motion",
      "audio_generation",
    ],
    supportedInputs: ["text", "image"],
  },

  // ── PiAPI (video) ──
  {
    id: "kling-v2",
    provider: "piapi",
    type: "video",
    tier: "standard",
    costPer1k: 0.3,
    maxDuration: 10,
    capabilities: ["motion", "lip_sync", "image_to_video"],
    supportedInputs: ["text", "image"],
  },
  {
    id: "seedance-2.0",
    provider: "piapi",
    type: "video",
    tier: "premium",
    costPer1k: 0.4,
    maxDuration: 8,
    capabilities: [
      "character_motion",
      "dance",
      "action",
      "image_to_video",
    ],
    supportedInputs: ["text", "image"],
  },

  // ── Gemini (audio) ──
  {
    id: "gemini-2.5-pro-audio",
    provider: "gemini",
    type: "audio",
    tier: "standard",
    costPer1k: 0.02,
    maxDuration: 120,
    capabilities: ["voice", "music", "sfx", "tts"],
    supportedInputs: ["text", "audio"],
  },
];

// ── Helpers ─────────────────────────────────────────────────────

export function getModel(id: string): ModelEntry | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

export function getModelsByType(type: ModelType): ModelEntry[] {
  return MODEL_CATALOG.filter((m) => m.type === type);
}

export function getModelsByProvider(provider: string): ModelEntry[] {
  return MODEL_CATALOG.filter((m) => m.provider === provider);
}
