# Real Agent Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock agent execution with real AI model calls (Claude, Gemini, PiAPI) for all 20 Phase 1 video pipeline agents.

**Architecture:** Model Provider abstraction layer with 4 implementations (Anthropic, Gemini, PiAPI, Mock fallback). Agent Context Builder assembles prompts from skill files + project artifacts. Runtime tries real execution first, falls back to mock per-provider when API keys are missing.

**Tech Stack:** `@anthropic-ai/sdk` (installed), `@google/genai` (new), PiAPI REST (fetch), Hono, Drizzle ORM

**Spec:** `docs/superpowers/specs/2026-04-06-real-agents-design.md`

---

### Task 1: Install Google AI SDK + Config

**Files:**
- Modify: `package.json`
- Modify: `src/shared/config.ts`

- [ ] **Step 1: Install package**

```bash
npm install @google/genai
```

- [ ] **Step 2: Add API keys to config**

In `src/shared/config.ts`, add after the `anthropicApiKey` line:

```typescript
  // Google AI (Gemini, Imagen, Veo)
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY ?? "",

  // PiAPI (Kling, Seedance)
  piapiApiKey: process.env.PIAPI_API_KEY ?? "",
```

- [ ] **Step 3: Add env vars to .env**

Append to `.env`:

```
# Google AI (Gemini, Imagen, Veo) — leave empty for mock mode
GOOGLE_AI_API_KEY=

# PiAPI (Kling, Seedance) — leave empty for mock mode
PIAPI_API_KEY=
```

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/shared/config.ts
git commit -m "feat: add google genai sdk, google + piapi config keys"
```

---

### Task 2: Provider Types & Catalog

**Files:**
- Create: `src/providers/types.ts`
- Create: `src/providers/catalog.ts`

- [ ] **Step 1: Create provider type definitions**

```typescript
// src/providers/types.ts

export interface ModelEntry {
  id: string;
  provider: string;
  type: "text" | "image" | "video" | "audio";
  tier: "premium" | "standard" | "fast";
  costPer1k: number;
  maxTokens?: number;
  maxDuration?: number;
  capabilities: string[];
  supportedInputs: string[];
}

export interface Attachment {
  type: "image" | "video" | "audio" | "json" | "document";
  name: string;
  mimeType: string;
  filePath: string;
  artifactId?: string;
}

export interface GenerateParams {
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  attachments?: Attachment[];
  maxTokens?: number;
  temperature?: number;
  outputFormat?: "text" | "json" | "file";
}

export interface GenerateResult {
  status: "completed" | "processing" | "failed";
  jobId?: string;
  output?: {
    text?: string;
    fileUrl?: string;
    filePath?: string;
    metadata?: Record<string, any>;
  };
  cost?: {
    inputTokens?: number;
    outputTokens?: number;
    credits?: number;
    estimatedUsd?: number;
  };
  error?: string;
}

export interface ModelProvider {
  id: string;
  type: "text" | "image" | "video" | "audio";
  models: ModelEntry[];
  generate(params: GenerateParams): Promise<GenerateResult>;
  checkJob?(jobId: string): Promise<GenerateResult>;
  getStatus(): Promise<{ available: boolean; error?: string }>;
}
```

- [ ] **Step 2: Create model catalog**

```typescript
// src/providers/catalog.ts
import type { ModelEntry } from "./types.js";

export const MODEL_CATALOG: ModelEntry[] = [
  // ── Text ──
  {
    id: "claude-opus-4",
    provider: "anthropic",
    type: "text",
    tier: "premium",
    costPer1k: 0.015,
    maxTokens: 32000,
    capabilities: ["reasoning", "vision", "code", "evaluation"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "claude-sonnet-4",
    provider: "anthropic",
    type: "text",
    tier: "standard",
    costPer1k: 0.003,
    maxTokens: 16000,
    capabilities: ["reasoning", "vision", "code", "creative"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "claude-haiku-4",
    provider: "anthropic",
    type: "text",
    tier: "fast",
    costPer1k: 0.00025,
    maxTokens: 8000,
    capabilities: ["classification", "extraction", "simple_reasoning"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "gemini-2.5-pro",
    provider: "gemini",
    type: "text",
    tier: "premium",
    costPer1k: 0.01,
    maxTokens: 65000,
    capabilities: ["reasoning", "vision", "code", "multimodal", "long_context"],
    supportedInputs: ["text", "image", "video", "audio", "json"],
  },
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    type: "text",
    tier: "fast",
    costPer1k: 0.0005,
    maxTokens: 16000,
    capabilities: ["reasoning", "classification", "multimodal"],
    supportedInputs: ["text", "image", "video", "audio", "json"],
  },

  // ── Image ──
  {
    id: "gemini-imagen-3",
    provider: "gemini",
    type: "image",
    tier: "standard",
    costPer1k: 0.04,
    capabilities: ["photorealistic", "illustration", "text_rendering"],
    supportedInputs: ["text", "image"],
  },

  // ── Video ──
  {
    id: "veo-3",
    provider: "gemini",
    type: "video",
    tier: "premium",
    costPer1k: 0.50,
    maxDuration: 8,
    capabilities: ["high_quality", "camera_control", "complex_motion", "audio_generation"],
    supportedInputs: ["text", "image"],
  },
  {
    id: "kling-v2",
    provider: "piapi",
    type: "video",
    tier: "standard",
    costPer1k: 0.30,
    maxDuration: 10,
    capabilities: ["motion", "lip_sync", "image_to_video"],
    supportedInputs: ["text", "image"],
  },
  {
    id: "seedance-2.0",
    provider: "piapi",
    type: "video",
    tier: "premium",
    costPer1k: 0.40,
    maxDuration: 8,
    capabilities: ["character_motion", "dance", "action", "image_to_video"],
    supportedInputs: ["text", "image"],
  },

  // ── Audio ──
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

export function getModel(modelId: string): ModelEntry | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getModelsByType(type: ModelEntry["type"]): ModelEntry[] {
  return MODEL_CATALOG.filter((m) => m.type === type);
}

export function getModelsByProvider(provider: string): ModelEntry[] {
  return MODEL_CATALOG.filter((m) => m.provider === provider);
}
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/providers/types.ts src/providers/catalog.ts
git commit -m "feat: add model provider types and catalog (10 models, 3 providers)"
```

---

### Task 3: Mock Provider

**Files:**
- Create: `src/providers/mock.ts`

- [ ] **Step 1: Create mock provider**

```typescript
// src/providers/mock.ts
import type { ModelProvider, GenerateParams, GenerateResult, ModelEntry } from "./types.js";
import { MODEL_CATALOG } from "./catalog.js";

export class MockProvider implements ModelProvider {
  id = "mock";
  type: "text" | "image" | "video" | "audio";
  models: ModelEntry[];

  constructor(type: "text" | "image" | "video" | "audio") {
    this.type = type;
    this.models = MODEL_CATALOG.filter((m) => m.type === type);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    console.log(`[MOCK PROVIDER] type=${this.type} model=${params.model}`);
    console.log(`[MOCK PROVIDER] prompt: ${params.userPrompt.slice(0, 200)}...`);

    if (this.type === "text") {
      return {
        status: "completed",
        output: {
          text: `[MOCK] Generated ${this.type} output for model ${params.model}.\n\nSystem: ${(params.systemPrompt ?? "").slice(0, 100)}...\n\nPrompt: ${params.userPrompt.slice(0, 200)}...`,
        },
        cost: { inputTokens: 0, outputTokens: 0, estimatedUsd: 0 },
      };
    }

    // For image/video/audio: return mock file path
    return {
      status: "completed",
      output: {
        text: `[MOCK] ${this.type} generation requested. Model: ${params.model}. No real file produced.`,
        metadata: { mockMode: true, model: params.model, type: this.type },
      },
      cost: { credits: 0, estimatedUsd: 0 },
    };
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    return { available: true };
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/mock.ts
git commit -m "feat: add mock provider as fallback for all generation types"
```

---

### Task 4: Anthropic Provider

**Files:**
- Create: `src/providers/anthropic.ts`

- [ ] **Step 1: Create Anthropic provider**

```typescript
// src/providers/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import type { ModelProvider, GenerateParams, GenerateResult, ModelEntry, Attachment } from "./types.js";
import { MODEL_CATALOG } from "./catalog.js";
import { config } from "../shared/config.js";

// Map catalog IDs to actual Anthropic model identifiers
const MODEL_ID_MAP: Record<string, string> = {
  "claude-opus-4": "claude-opus-4-20250514",
  "claude-sonnet-4": "claude-sonnet-4-20250514",
  "claude-haiku-4": "claude-haiku-4-20250414",
};

export class AnthropicProvider implements ModelProvider {
  id = "anthropic";
  type: "text" = "text";
  models: ModelEntry[];
  private client: Anthropic | null;

  constructor() {
    this.models = MODEL_CATALOG.filter((m) => m.provider === "anthropic");
    this.client = config.anthropicApiKey
      ? new Anthropic({ apiKey: config.anthropicApiKey })
      : null;
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!this.client) {
      return { status: "failed", error: "Anthropic API key not configured" };
    }

    const modelId = MODEL_ID_MAP[params.model] ?? params.model;

    // Build content blocks with attachments
    const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    // Add image attachments as base64
    if (params.attachments) {
      for (const att of params.attachments) {
        if (att.type === "image" && ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(att.mimeType)) {
          try {
            const data = await fs.readFile(att.filePath);
            contentBlocks.push({
              type: "image",
              source: {
                type: "base64",
                media_type: att.mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                data: data.toString("base64"),
              },
            });
          } catch {
            console.warn(`[ANTHROPIC] Could not read image attachment: ${att.filePath}`);
          }
        } else if (att.type === "json" || att.type === "document") {
          try {
            const text = await fs.readFile(att.filePath, "utf-8");
            contentBlocks.push({
              type: "text",
              text: `[Attachment: ${att.name}]\n${text}`,
            });
          } catch {
            console.warn(`[ANTHROPIC] Could not read attachment: ${att.filePath}`);
          }
        }
        // video and audio not supported by Claude — skip (context builder should have converted)
      }
    }

    // Add the user prompt
    contentBlocks.push({ type: "text", text: params.userPrompt });

    try {
      const response = await this.client.messages.create({
        model: modelId,
        max_tokens: params.maxTokens ?? 4096,
        system: params.systemPrompt ?? "",
        messages: [{ role: "user", content: contentBlocks }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock && "text" in textBlock ? textBlock.text : "";

      return {
        status: "completed",
        output: { text },
        cost: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          estimatedUsd:
            (response.usage.input_tokens / 1000) * (this.models.find((m) => m.id === params.model)?.costPer1k ?? 0.003) +
            (response.usage.output_tokens / 1000) * (this.models.find((m) => m.id === params.model)?.costPer1k ?? 0.003) * 3,
        },
      };
    } catch (err) {
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "Anthropic API error",
      };
    }
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    return { available: this.client !== null, error: this.client ? undefined : "API key not configured" };
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/anthropic.ts
git commit -m "feat: add Anthropic provider with vision support and cost tracking"
```

---

### Task 5: Gemini Provider

**Files:**
- Create: `src/providers/gemini.ts`

- [ ] **Step 1: Create Gemini provider**

```typescript
// src/providers/gemini.ts
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import type { ModelProvider, GenerateParams, GenerateResult, ModelEntry, Attachment } from "./types.js";
import { MODEL_CATALOG } from "./catalog.js";
import { config } from "../shared/config.js";

// Map catalog IDs to Gemini model identifiers
const MODEL_ID_MAP: Record<string, string> = {
  "gemini-2.5-pro": "gemini-2.5-pro-preview-06-05",
  "gemini-2.5-flash": "gemini-2.5-flash-preview-05-20",
  "gemini-imagen-3": "imagen-3.0-generate-002",
  "veo-3": "veo-3.0-generate-preview",
  "gemini-2.5-pro-audio": "gemini-2.5-pro-preview-06-05",
};

export class GeminiProvider implements ModelProvider {
  id = "gemini";
  type: "text" | "image" | "video" | "audio";
  models: ModelEntry[];
  private client: GoogleGenAI | null;

  constructor(type: "text" | "image" | "video" | "audio") {
    this.type = type;
    this.models = MODEL_CATALOG.filter((m) => m.provider === "gemini" && m.type === type);
    this.client = config.googleAiApiKey
      ? new GoogleGenAI({ apiKey: config.googleAiApiKey })
      : null;
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!this.client) {
      return { status: "failed", error: "Google AI API key not configured" };
    }

    const modelId = MODEL_ID_MAP[params.model] ?? params.model;
    const catalogEntry = MODEL_CATALOG.find((m) => m.id === params.model);

    try {
      if (catalogEntry?.type === "image") {
        return await this.generateImage(modelId, params);
      } else if (catalogEntry?.type === "video") {
        return await this.generateVideo(modelId, params);
      } else {
        return await this.generateText(modelId, params);
      }
    } catch (err) {
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "Gemini API error",
      };
    }
  }

  private async generateText(modelId: string, params: GenerateParams): Promise<GenerateResult> {
    // Build parts array with multimodal content
    const parts: any[] = [];

    if (params.attachments) {
      for (const att of params.attachments) {
        if (att.type === "json" || att.type === "document") {
          const text = await fs.readFile(att.filePath, "utf-8");
          parts.push({ text: `[${att.name}]\n${text}` });
        } else if (["image", "video", "audio"].includes(att.type)) {
          try {
            const data = await fs.readFile(att.filePath);
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: data.toString("base64"),
              },
            });
          } catch {
            console.warn(`[GEMINI] Could not read attachment: ${att.filePath}`);
          }
        }
      }
    }

    parts.push({ text: params.userPrompt });

    const response = await this.client!.models.generateContent({
      model: modelId,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: params.systemPrompt,
        maxOutputTokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
      },
    });

    const text = response.text ?? "";

    return {
      status: "completed",
      output: { text },
      cost: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        estimatedUsd: ((response.usageMetadata?.totalTokenCount ?? 0) / 1000) * (this.models[0]?.costPer1k ?? 0.001),
      },
    };
  }

  private async generateImage(modelId: string, params: GenerateParams): Promise<GenerateResult> {
    const response = await this.client!.models.generateImages({
      model: modelId,
      prompt: params.userPrompt,
      config: { numberOfImages: 1 },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      return { status: "failed", error: "No images generated" };
    }

    const imageData = response.generatedImages[0].image;
    if (!imageData?.imageBytes) {
      return { status: "failed", error: "No image data in response" };
    }

    return {
      status: "completed",
      output: {
        text: `Image generated successfully via ${modelId}`,
        metadata: {
          imageBase64: imageData.imageBytes,
          mimeType: "image/png",
        },
      },
      cost: { credits: 1, estimatedUsd: 0.04 },
    };
  }

  private async generateVideo(modelId: string, params: GenerateParams): Promise<GenerateResult> {
    // Veo 3 uses generateContent with video config
    const operation = await this.client!.models.generateVideos({
      model: modelId,
      prompt: params.userPrompt,
    });

    if (!operation.name) {
      return { status: "failed", error: "No operation ID returned for video generation" };
    }

    return {
      status: "processing",
      jobId: operation.name,
      cost: { estimatedUsd: 0.50 },
    };
  }

  async checkJob(jobId: string): Promise<GenerateResult> {
    if (!this.client) {
      return { status: "failed", error: "Google AI API key not configured" };
    }

    try {
      const operation = await this.client.operations.get({ operation: jobId });

      if (!operation.done) {
        return { status: "processing", jobId };
      }

      // Extract video from completed operation
      const response = operation.response;
      if (response?.generatedVideos && response.generatedVideos.length > 0) {
        const video = response.generatedVideos[0];
        return {
          status: "completed",
          output: {
            text: "Video generated successfully",
            fileUrl: video.video?.uri ?? undefined,
            metadata: { mimeType: "video/mp4" },
          },
          cost: { estimatedUsd: 0.50 },
        };
      }

      return { status: "failed", error: "Video operation completed but no video in response" };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "Failed to check job" };
    }
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    return { available: this.client !== null, error: this.client ? undefined : "API key not configured" };
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

Note: There may be type issues with `@google/genai` — the SDK types are new. If compilation fails on specific method signatures, adjust the calls to match the SDK's actual API. The core pattern is correct.

- [ ] **Step 3: Commit**

```bash
git add src/providers/gemini.ts
git commit -m "feat: add Gemini provider (text, image, video, audio) with async polling"
```

---

### Task 6: PiAPI Provider

**Files:**
- Create: `src/providers/piapi.ts`

- [ ] **Step 1: Create PiAPI provider**

```typescript
// src/providers/piapi.ts
import type { ModelProvider, GenerateParams, GenerateResult, ModelEntry } from "./types.js";
import { MODEL_CATALOG } from "./catalog.js";
import { config } from "../shared/config.js";
import fs from "fs/promises";

const PIAPI_BASE = "https://api.piapi.ai/api/v1";

// Map catalog IDs to PiAPI model names
const MODEL_ID_MAP: Record<string, string> = {
  "kling-v2": "kling",
  "seedance-2.0": "seedance",
};

export class PiAPIProvider implements ModelProvider {
  id = "piapi";
  type: "video" = "video";
  models: ModelEntry[];

  constructor() {
    this.models = MODEL_CATALOG.filter((m) => m.provider === "piapi");
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!config.piapiApiKey) {
      return { status: "failed", error: "PiAPI API key not configured" };
    }

    const piModel = MODEL_ID_MAP[params.model] ?? params.model;

    // Build request body
    const body: Record<string, any> = {
      model: piModel,
      task_type: "video_generation",
      input: {
        prompt: params.userPrompt,
      },
    };

    // Add reference image if attached
    if (params.attachments) {
      const imageAtt = params.attachments.find((a) => a.type === "image");
      if (imageAtt) {
        try {
          const data = await fs.readFile(imageAtt.filePath);
          body.input.image = `data:${imageAtt.mimeType};base64,${data.toString("base64")}`;
        } catch {
          console.warn(`[PIAPI] Could not read image attachment: ${imageAtt.filePath}`);
        }
      }
    }

    try {
      const response = await fetch(`${PIAPI_BASE}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.piapiApiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { status: "failed", error: `PiAPI error ${response.status}: ${errorText}` };
      }

      const data = await response.json() as { data?: { task_id?: string } };
      const taskId = data.data?.task_id;

      if (!taskId) {
        return { status: "failed", error: "No task_id in PiAPI response" };
      }

      return {
        status: "processing",
        jobId: taskId,
        cost: { estimatedUsd: params.model === "seedance-2.0" ? 0.40 : 0.30 },
      };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "PiAPI request failed" };
    }
  }

  async checkJob(jobId: string): Promise<GenerateResult> {
    if (!config.piapiApiKey) {
      return { status: "failed", error: "PiAPI API key not configured" };
    }

    try {
      const response = await fetch(`${PIAPI_BASE}/task/${jobId}`, {
        headers: { "X-API-Key": config.piapiApiKey },
      });

      if (!response.ok) {
        return { status: "failed", error: `PiAPI poll error: ${response.status}` };
      }

      const data = await response.json() as {
        data?: { status?: string; output?: { video_url?: string } };
      };

      const status = data.data?.status;

      if (status === "completed") {
        const videoUrl = data.data?.output?.video_url;
        return {
          status: "completed",
          output: {
            text: "Video generated via PiAPI",
            fileUrl: videoUrl ?? undefined,
            metadata: { mimeType: "video/mp4" },
          },
        };
      } else if (status === "failed") {
        return { status: "failed", error: "PiAPI task failed" };
      }

      return { status: "processing", jobId };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "PiAPI poll failed" };
    }
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    return {
      available: !!config.piapiApiKey,
      error: config.piapiApiKey ? undefined : "API key not configured",
    };
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/piapi.ts
git commit -m "feat: add PiAPI provider for Kling and Seedance video generation"
```

---

### Task 7: Provider Registry

**Files:**
- Create: `src/providers/registry.ts`

- [ ] **Step 1: Create provider registry**

```typescript
// src/providers/registry.ts
import type { ModelProvider } from "./types.js";
import { getModel } from "./catalog.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { PiAPIProvider } from "./piapi.js";
import { MockProvider } from "./mock.js";

// Singleton provider instances
const providers: Record<string, ModelProvider> = {};

function initProviders() {
  if (Object.keys(providers).length > 0) return;

  // Real providers
  const anthropic = new AnthropicProvider();
  const geminiText = new GeminiProvider("text");
  const geminiImage = new GeminiProvider("image");
  const geminiVideo = new GeminiProvider("video");
  const geminiAudio = new GeminiProvider("audio");
  const piapi = new PiAPIProvider();

  // Register by provider:type key
  providers["anthropic:text"] = anthropic;
  providers["gemini:text"] = geminiText;
  providers["gemini:image"] = geminiImage;
  providers["gemini:video"] = geminiVideo;
  providers["gemini:audio"] = geminiAudio;
  providers["piapi:video"] = piapi;

  // Mock fallbacks
  providers["mock:text"] = new MockProvider("text");
  providers["mock:image"] = new MockProvider("image");
  providers["mock:video"] = new MockProvider("video");
  providers["mock:audio"] = new MockProvider("audio");
}

/**
 * Get the provider for a specific model ID.
 * Falls back to mock if the real provider is unavailable.
 */
export async function getProviderForModel(modelId: string): Promise<ModelProvider> {
  initProviders();

  const model = getModel(modelId);
  if (!model) {
    console.warn(`[REGISTRY] Unknown model "${modelId}", using mock`);
    return providers["mock:text"];
  }

  const key = `${model.provider}:${model.type}`;
  const provider = providers[key];

  if (!provider) {
    console.warn(`[REGISTRY] No provider for ${key}, using mock`);
    return providers[`mock:${model.type}`] ?? providers["mock:text"];
  }

  // Check if provider is available (has API key)
  const status = await provider.getStatus();
  if (!status.available) {
    console.warn(`[REGISTRY] Provider ${key} unavailable (${status.error}), using mock`);
    return providers[`mock:${model.type}`] ?? providers["mock:text"];
  }

  return provider;
}

/**
 * Get provider status for all registered providers.
 */
export async function getAllProviderStatus(): Promise<
  Array<{ id: string; type: string; available: boolean; error?: string }>
> {
  initProviders();
  const statuses = [];
  for (const [key, provider] of Object.entries(providers)) {
    if (key.startsWith("mock:")) continue;
    const status = await provider.getStatus();
    statuses.push({ id: provider.id, type: key.split(":")[1], ...status });
  }
  return statuses;
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/registry.ts
git commit -m "feat: add provider registry with automatic mock fallback"
```

---

### Task 8: Agent Context Map, Model Defaults, Job Poller

**Files:**
- Create: `src/agents/context-map.ts`
- Create: `src/agents/model-defaults.ts`
- Create: `src/agents/job-poller.ts`

- [ ] **Step 1: Create context map**

```typescript
// src/agents/context-map.ts

export interface ContextMapEntry {
  artifactSteps: string[];
  attachmentTypes: string[];
  taskInstruction: string;
}

export const AGENT_CONTEXT_MAP: Record<string, ContextMapEntry> = {
  // ── Brief ──
  "T7-L:brief": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction: "Create an onboarding record and communication plan for this new client project.",
  },
  "T1-L:brief": {
    artifactSteps: [],
    attachmentTypes: ["image"],
    taskInstruction: "Guide the brief enrichment process. Ask clarifying questions and produce an enriched brief document.",
  },

  // ── Concept ──
  "T1-L:concept": {
    artifactSteps: ["brief"],
    attachmentTypes: ["image"],
    taskInstruction: "Develop 2-3 creative concepts based on the enriched brief. Include mood, tone, visual direction, and narrative approach for each.",
  },

  // ── Script ──
  "T2-L:script": {
    artifactSteps: ["brief", "concept"],
    attachmentTypes: ["json"],
    taskInstruction: "Classify this project type, create a beat sheet, and prepare an assignment brief for the AV Copywriter.",
  },
  "T2-002:script": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: [],
    taskInstruction: "Write a two-column AV script (audio | video) following the beat sheet and creative direction.",
  },
  "T2-006:script": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: [],
    taskInstruction: "Review this script using your 7 diagnostic lenses. Produce an improvement report with severity-graded findings.",
  },

  // ── Visual Look ──
  "T3-L:visual_look": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Define the visual language: framing, lens choices, lighting style, color palette, and movement vocabulary for each scene.",
  },
  "TL-003:visual_look": {
    artifactSteps: ["script"],
    attachmentTypes: ["json"],
    taskInstruction: "Create a complete script breakdown: scenes, locations, characters, props, wardrobe, and production requirements.",
  },

  // ── Storyboard ──
  "T3-L:storyboard": {
    artifactSteps: ["script", "visual_look"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Create detailed shot specs for each scene: composition, camera angle, movement, lighting, and subject placement.",
  },
  "T3-003:storyboard": {
    artifactSteps: ["script", "visual_look", "storyboard"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Generate storyboard preview images for each shot using the shot specs. Use the image generation model.",
  },

  // ── Video Generation ──
  "T3-003:video_gen": {
    artifactSteps: ["script", "visual_look", "storyboard"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Generate video clips for each shot in the storyboard. Translate shot specs into optimized prompts for the video model.",
  },

  // ── Edit ──
  "T6-L:edit": {
    artifactSteps: ["script", "storyboard", "video_gen"],
    attachmentTypes: ["video", "audio", "image", "json"],
    taskInstruction: "Assemble the first cut: sequence clips following the storyboard order, define cutting rhythm, note any shots that need regeneration.",
  },

  // ── Audio ──
  "T5-L:audio": {
    artifactSteps: ["script", "concept", "edit"],
    attachmentTypes: ["video", "json"],
    taskInstruction: "Define sonic palette, generate voiceover segments, compose music, create SFX, and produce the final audio mix synced to the edit.",
  },

  // ── Polish ──
  "T6-L:polish": {
    artifactSteps: ["script", "edit", "audio"],
    attachmentTypes: ["video", "audio", "json"],
    taskInstruction: "Apply final polish: color correction, audio sync, transitions, and subtitles if needed. Prepare for final gate review.",
  },

  // ── Delivery ──
  "T6-003:delivery": {
    artifactSteps: ["polish"],
    attachmentTypes: ["video", "json"],
    taskInstruction: "Encode the final video for all required delivery platforms. Generate thumbnails and delivery metadata.",
  },
  "T7-L:delivery": {
    artifactSteps: ["polish", "delivery"],
    attachmentTypes: ["json"],
    taskInstruction: "Prepare the client delivery package. Generate delivery notification and publish to the review portal.",
  },

  // ── Gate Evaluators ──
  "TL-002:gate": {
    artifactSteps: ["brief", "concept", "script", "visual_look", "storyboard", "video_gen", "edit", "audio", "polish"],
    attachmentTypes: ["image", "video", "audio", "json"],
    taskInstruction: "Evaluate this gate. Review all artifacts produced so far. Score 1-10 on relevant dimensions. Issue PASS or FAIL with detailed notes.",
  },
  "XF-001:gate": {
    artifactSteps: ["visual_look", "storyboard", "video_gen", "edit", "polish"],
    attachmentTypes: ["image", "video", "json"],
    taskInstruction: "Evaluate cinematographic quality. Score each shot on composition, lighting, movement, and narrative coherence (1-10). Issue veto if any dimension ≤3 or overall <6.",
  },

  // ── Model Intelligence ──
  "T9-L:model_config": {
    artifactSteps: ["brief", "concept"],
    attachmentTypes: ["json"],
    taskInstruction: "Create a model selection matrix for this project. Recommend specific models for text, image, video, and audio tasks based on project requirements and budget.",
  },
};

/** Maps agent:step to the output type they produce */
export const AGENT_OUTPUT_TYPES: Record<string, "text" | "image" | "video" | "audio"> = {
  "T7-L:brief": "text",
  "T1-L:brief": "text",
  "T1-L:concept": "text",
  "T2-L:script": "text",
  "T2-002:script": "text",
  "T2-006:script": "text",
  "T3-L:visual_look": "text",
  "TL-003:visual_look": "text",
  "T3-L:storyboard": "text",
  "T3-003:storyboard": "image",
  "T3-003:video_gen": "video",
  "T6-L:edit": "text",
  "T5-L:audio": "audio",
  "T6-L:polish": "text",
  "T6-003:delivery": "text",
  "T7-L:delivery": "text",
  "TL-002:gate": "text",
  "XF-001:gate": "text",
  "T9-L:model_config": "text",
};
```

- [ ] **Step 2: Create model defaults**

```typescript
// src/agents/model-defaults.ts

/** Default model for each agent (used when Team 9 hasn't made a recommendation) */
export const MODEL_DEFAULTS: Record<string, string> = {
  // Text agents — by role complexity
  "TL-002": "claude-opus-4",
  "XF-001": "claude-opus-4",
  "T1-L": "claude-sonnet-4",
  "T2-L": "claude-sonnet-4",
  "T2-002": "claude-sonnet-4",
  "T2-006": "claude-sonnet-4",
  "T7-L": "claude-sonnet-4",
  "TL-001": "claude-sonnet-4",
  "TL-003": "claude-sonnet-4",

  // Image generation
  "T3-003:storyboard": "gemini-imagen-3",

  // Video generation
  "T3-003:video_gen": "veo-3",

  // Audio generation
  "T5-L": "gemini-2.5-pro-audio",

  // Model intelligence — fast model for catalog lookups
  "T9-L": "gemini-2.5-flash",
  "T9-001": "gemini-2.5-flash",
  "T9-002": "gemini-2.5-flash",
  "T9-003": "gemini-2.5-flash",
  "T9-004": "gemini-2.5-flash",
  "T9-005": "gemini-2.5-flash",
};

export function getDefaultModel(agentId: string, step?: string): string {
  // Check agent:step specific default first
  if (step) {
    const specific = MODEL_DEFAULTS[`${agentId}:${step}`];
    if (specific) return specific;
  }
  // Fall back to agent-level default
  return MODEL_DEFAULTS[agentId] ?? "claude-sonnet-4";
}
```

- [ ] **Step 3: Create job poller**

```typescript
// src/agents/job-poller.ts
import type { ModelProvider, GenerateResult } from "../providers/types.js";

const TIMEOUTS: Record<string, number> = {
  image: 120_000,   // 2 min
  video: 600_000,   // 10 min
  audio: 300_000,   // 5 min
};

const DEFAULT_INTERVAL = 10_000; // 10s

export async function pollUntilComplete(
  provider: ModelProvider,
  jobId: string,
  outputType: string,
  intervalMs: number = DEFAULT_INTERVAL,
): Promise<GenerateResult> {
  const timeoutMs = TIMEOUTS[outputType] ?? 120_000;
  const startTime = Date.now();

  if (!provider.checkJob) {
    return { status: "failed", error: `Provider ${provider.id} does not support async job polling` };
  }

  while (Date.now() - startTime < timeoutMs) {
    const result = await provider.checkJob(jobId);

    if (result.status === "completed" || result.status === "failed") {
      return result;
    }

    // Still processing — wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: "failed",
    error: `Job ${jobId} timed out after ${timeoutMs / 1000}s`,
  };
}
```

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/agents/context-map.ts src/agents/model-defaults.ts src/agents/job-poller.ts
git commit -m "feat: add context map, model defaults, and async job poller"
```

---

### Task 9: Agent Context Builder

**Files:**
- Create: `src/agents/context-builder.ts`

- [ ] **Step 1: Create context builder**

```typescript
// src/agents/context-builder.ts
import fs from "fs/promises";
import path from "path";
import { db, schema } from "../db/index.js";
import { eq, and, inArray } from "drizzle-orm";
import { config } from "../shared/config.js";
import { AGENT_REGISTRY } from "./registry.js";
import { AGENT_CONTEXT_MAP } from "./context-map.js";
import { getModel } from "../providers/catalog.js";
import type { Attachment } from "../providers/types.js";
import type { ArtifactStep } from "../shared/types.js";

interface AgentContext {
  systemPrompt: string;
  userPrompt: string;
  attachments: Attachment[];
}

const MIME_TYPES: Record<string, string> = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

function getAttachmentType(ext: string): Attachment["type"] {
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) return "image";
  if ([".mp4", ".webm"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".ogg"].includes(ext)) return "audio";
  if (ext === ".json") return "json";
  return "document";
}

async function loadSkillFile(agentId: string): Promise<string> {
  const agent = AGENT_REGISTRY[agentId];
  if (!agent) return `You are agent ${agentId}.`;

  const skillPath = path.resolve(config.agentsPath, "..", agent.skillFile);
  try {
    return await fs.readFile(skillPath, "utf-8");
  } catch {
    // Try alternate path
    const altPath = path.resolve(config.agentsPath, path.basename(agent.skillFile));
    try {
      return await fs.readFile(altPath, "utf-8");
    } catch {
      console.warn(`[CONTEXT] Could not load skill file for ${agentId}: ${agent.skillFile}`);
      return `You are ${agent.name} (${agentId}). ${agent.level} level agent.`;
    }
  }
}

export async function buildAgentContext(
  agentId: string,
  projectId: string,
  step: string,
  modelId: string,
): Promise<AgentContext> {
  // 1. Load skill file as system prompt
  const systemPrompt = await loadSkillFile(agentId);

  // 2. Look up context map
  const mapKey = `${agentId}:${step}`;
  const contextEntry = AGENT_CONTEXT_MAP[mapKey];

  if (!contextEntry) {
    // No context map entry — return minimal context
    return {
      systemPrompt,
      userPrompt: `Execute your role for step "${step}" on project ${projectId}.`,
      attachments: [],
    };
  }

  // 3. Load artifacts from DB for required steps
  const textSections: string[] = [];
  const attachments: Attachment[] = [];

  if (contextEntry.artifactSteps.length > 0) {
    const artifacts = await db
      .select()
      .from(schema.artifacts)
      .where(
        and(
          eq(schema.artifacts.projectId, projectId),
          inArray(schema.artifacts.step, contextEntry.artifactSteps as ArtifactStep[]),
        ),
      );

    // Get model's supported inputs for filtering
    const model = getModel(modelId);
    const supportedInputs = model?.supportedInputs ?? ["text", "json"];

    for (const artifact of artifacts) {
      const ext = path.extname(artifact.name).toLowerCase();
      const attType = getAttachmentType(ext);
      const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

      if (attType === "document" || ext === ".md" || ext === ".txt") {
        // Text artifacts — always include as text in prompt
        try {
          const content = await fs.readFile(artifact.storagePath, "utf-8");
          textSections.push(`## ${artifact.step}: ${artifact.name}\n\n${content}`);
        } catch {
          textSections.push(`## ${artifact.step}: ${artifact.name}\n\n[Could not read file]`);
        }
      } else if (contextEntry.attachmentTypes.includes(attType)) {
        // File artifacts — include if provider supports them
        if (supportedInputs.includes(attType)) {
          attachments.push({
            type: attType,
            name: artifact.name,
            mimeType,
            filePath: artifact.storagePath,
            artifactId: artifact.id,
          });
        } else if (attType === "json") {
          // JSON always readable as text
          try {
            const content = await fs.readFile(artifact.storagePath, "utf-8");
            textSections.push(`## ${artifact.step}: ${artifact.name}\n\n\`\`\`json\n${content}\n\`\`\``);
          } catch {
            // skip
          }
        } else {
          // Unsupported attachment — add text description
          textSections.push(`[Attachment: ${artifact.name} (${attType}, not supported by current model)]`);
        }
      }
    }
  }

  // 4. Assemble user prompt
  const contextText = textSections.length > 0
    ? `# Project Context\n\n${textSections.join("\n\n---\n\n")}`
    : "";

  const userPrompt = `${contextEntry.taskInstruction}\n\n${contextText}`.trim();

  return { systemPrompt, userPrompt, attachments };
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/context-builder.ts
git commit -m "feat: add agent context builder (skill files + project artifacts + attachments)"
```

---

### Task 10: Real Agent Runtime

**Files:**
- Modify: `src/agents/runtime.ts`

- [ ] **Step 1: Replace runtime with real+mock hybrid**

Replace the entire contents of `src/agents/runtime.ts`:

```typescript
// src/agents/runtime.ts
import fs from "fs/promises";
import path from "path";
import type { ArtifactStep } from "../shared/types.js";
import type { AgentResult } from "./mock.js";
import { executeMockAgent } from "./mock.js";
import { buildAgentContext } from "./context-builder.js";
import { getDefaultModel } from "./model-defaults.js";
import { getProviderForModel } from "../providers/registry.js";
import { pollUntilComplete } from "./job-poller.js";
import { AGENT_OUTPUT_TYPES } from "./context-map.js";
import { createArtifact, getStoragePath } from "../storage/artifacts.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { logger } from "../shared/logger.js";

/**
 * Execute an agent. Tries real execution first, falls back to mock.
 */
export async function executeAgent(
  agentId: string,
  projectId: string,
  step: ArtifactStep,
): Promise<AgentResult> {
  try {
    return await executeRealAgent(agentId, projectId, step);
  } catch (err) {
    console.warn(`[AGENT] Real execution failed for ${agentId}:${step}, falling back to mock:`, err);
    return executeMockAgent(agentId, projectId, step);
  }
}

async function executeRealAgent(
  agentId: string,
  projectId: string,
  step: ArtifactStep,
): Promise<AgentResult> {
  const startedAt = new Date();

  // 1. Determine output type
  const outputType = AGENT_OUTPUT_TYPES[`${agentId}:${step}`] ?? "text";

  // 2. Get model (check project config first, then defaults)
  const modelId = await getModelForAgent(agentId, projectId, step, outputType);

  // 3. Get provider (auto-fallback to mock if unavailable)
  const provider = await getProviderForModel(modelId);

  // If we got a mock provider, use the existing mock system instead
  if (provider.id === "mock") {
    return executeMockAgent(agentId, projectId, step);
  }

  // 4. Record execution start
  const [execution] = await db
    .insert(schema.agentExecutions)
    .values({
      projectId,
      agentId,
      step,
      attempt: 1,
      status: "running",
      startedAt,
    })
    .returning();

  try {
    // 5. Build context
    const context = await buildAgentContext(agentId, projectId, step, modelId);

    // 6. Call provider
    let result = await provider.generate({
      model: modelId,
      systemPrompt: context.systemPrompt,
      userPrompt: context.userPrompt,
      attachments: context.attachments,
      maxTokens: outputType === "text" ? 4096 : undefined,
    });

    // 7. Handle async (video, image, audio)
    if (result.status === "processing" && result.jobId) {
      logger.info("agent.polling", { agentId, step, jobId: result.jobId, outputType });
      result = await pollUntilComplete(provider, result.jobId, outputType);
    }

    if (result.status === "failed") {
      throw new Error(result.error ?? "Generation failed");
    }

    // 8. Save output as artifact
    const artifactIds: string[] = [];

    if (outputType === "text" && result.output?.text) {
      const artifact = await createArtifact({
        projectId,
        step,
        type: "document",
        name: `${agentId}_${step}.md`,
        content: result.output.text,
        agentId,
        metadata: { model: modelId, provider: provider.id },
      });
      artifactIds.push(artifact.id);
    } else if (result.output?.fileUrl) {
      // Download remote file
      const dir = await getStoragePath(projectId, step);
      const ext = outputType === "image" ? ".png" : outputType === "video" ? ".mp4" : ".mp3";
      const filename = `${agentId}_${step}${ext}`;
      const filePath = path.join(dir, filename);

      const response = await fetch(result.output.fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      const artifactType = outputType === "image" ? "image" : outputType === "video" ? "video" : "audio";
      const [artifact] = await db
        .insert(schema.artifacts)
        .values({
          projectId,
          step,
          type: artifactType,
          name: filename,
          storagePath: filePath,
          createdByAgent: agentId,
          metadata: { model: modelId, provider: provider.id, url: result.output.fileUrl },
        })
        .returning();
      artifactIds.push(artifact.id);
    } else if (outputType === "image" && result.output?.metadata?.imageBase64) {
      // Gemini Imagen returns base64 directly
      const dir = await getStoragePath(projectId, step);
      const filename = `${agentId}_${step}.png`;
      const filePath = path.join(dir, filename);
      await fs.writeFile(filePath, Buffer.from(result.output.metadata.imageBase64, "base64"));

      const [artifact] = await db
        .insert(schema.artifacts)
        .values({
          projectId,
          step,
          type: "image",
          name: filename,
          storagePath: filePath,
          createdByAgent: agentId,
          metadata: { model: modelId, provider: provider.id },
        })
        .returning();
      artifactIds.push(artifact.id);
    } else if (result.output?.text) {
      // Fallback: save any text output
      const artifact = await createArtifact({
        projectId,
        step,
        type: "document",
        name: `${agentId}_${step}.md`,
        content: result.output.text,
        agentId,
        metadata: { model: modelId, provider: provider.id },
      });
      artifactIds.push(artifact.id);
    }

    // 9. Record execution complete
    await db
      .update(schema.agentExecutions)
      .set({
        status: "completed",
        completedAt: new Date(),
        outputArtifactIds: artifactIds,
        cost: {
          ...result.cost,
          model: modelId,
          provider: provider.id,
          mockMode: false,
        },
      })
      .where(eq(schema.agentExecutions.id, execution.id));

    logger.info("agent.executed", {
      agentId,
      projectId,
      step,
      model: modelId,
      provider: provider.id,
      artifactsCreated: artifactIds.length,
      cost: result.cost,
      mock: false,
    });

    return { agentId, step, artifactIds, success: true };
  } catch (err) {
    // Record failure
    await db
      .update(schema.agentExecutions)
      .set({
        status: "failed",
        completedAt: new Date(),
        error: err instanceof Error ? err.message : "Unknown error",
        cost: { model: modelId, provider: provider.id, mockMode: false },
      })
      .where(eq(schema.agentExecutions.id, execution.id));

    throw err;
  }
}

async function getModelForAgent(
  agentId: string,
  projectId: string,
  step: string,
  outputType: string,
): Promise<string> {
  // Check project-specific model config first
  const taskTypeMap: Record<string, string> = {
    text: "text_gen",
    image: "image_gen",
    video: "video_gen",
    audio: "audio_voice",
  };

  const taskType = taskTypeMap[outputType];
  if (taskType) {
    const configs = await db
      .select()
      .from(schema.modelConfigs)
      .where(
        eq(schema.modelConfigs.projectId, projectId),
      );

    const config = configs.find((c) => c.taskType === taskType);
    if (config) return config.recommendedModel;
  }

  // Fall back to defaults
  return getDefaultModel(agentId, step);
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Verify server starts**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; npm run dev &
sleep 3; curl -s http://localhost:3000/health; kill %1 2>/dev/null
```

Expected: `{"status":"ok","version":"0.1.0"}`

- [ ] **Step 4: Commit**

```bash
git add src/agents/runtime.ts
git commit -m "feat: replace mock-only runtime with real execution + mock fallback"
```

---

### Task 11: End-to-End Verification

- [ ] **Step 1: Test text agent execution (mock mode without API keys)**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; npm run dev &
sleep 3

# Create a project
PROJECT=$(curl -s -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Real Agent Test","type":"corporate","clientName":"Test","clientEmail":"test@test.com"}')
echo "Project: $PROJECT"

PROJECT_ID=$(echo $PROJECT | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Advance one step (brief) — should fall back to mock since no API keys
curl -s -X POST "http://localhost:3000/projects/${PROJECT_ID}/advance"

# Check executions
curl -s "http://localhost:3000/projects/${PROJECT_ID}/executions"

# Check artifacts were created
curl -s "http://localhost:3000/projects/${PROJECT_ID}/artifacts"
```

Expected: Executions show mock mode, artifacts created with template content (same as before — fallback works).

- [ ] **Step 2: Test provider status endpoint (add a quick route)**

Test that providers report their status correctly by checking the server logs. When API keys are empty, all providers should show "unavailable" in logs.

- [ ] **Step 3: Kill server and commit any fixes**

```bash
kill %1 2>/dev/null
```

If any fixes needed:
```bash
git add -A && git commit -m "fix: address issues found during e2e verification"
```

- [ ] **Step 4: Final verification summary**

```bash
npx tsc --noEmit
git log --oneline -12
```

Expected: clean compilation + all task commits visible.

---

### Summary of Files

**Created (11 files):**

| File | Purpose |
|------|---------|
| `src/providers/types.ts` | ModelProvider, ModelEntry, GenerateParams, GenerateResult, Attachment interfaces |
| `src/providers/catalog.ts` | MODEL_CATALOG (10 models) + helper functions |
| `src/providers/mock.ts` | Mock provider fallback for all types |
| `src/providers/anthropic.ts` | Claude models with vision support |
| `src/providers/gemini.ts` | Gemini text + Imagen image + Veo video + audio |
| `src/providers/piapi.ts` | Kling + Seedance video via REST API |
| `src/providers/registry.ts` | Provider registry with auto-mock fallback |
| `src/agents/context-map.ts` | AGENT_CONTEXT_MAP + AGENT_OUTPUT_TYPES |
| `src/agents/model-defaults.ts` | MODEL_DEFAULTS per agent |
| `src/agents/job-poller.ts` | Async job polling utility |
| `src/agents/context-builder.ts` | Build prompts from skill files + artifacts |

**Modified (4 files):**

| File | Changes |
|------|---------|
| `src/agents/runtime.ts` | Full rewrite: executeRealAgent + mock fallback |
| `src/shared/config.ts` | Add googleAiApiKey, piapiApiKey |
| `package.json` | Add @google/genai |
| `.env` | Add GOOGLE_AI_API_KEY, PIAPI_API_KEY |
