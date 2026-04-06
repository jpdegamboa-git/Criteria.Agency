import { readFileSync } from "fs";
import type {
  ModelProvider,
  ModelEntry,
  GenerateParams,
  GenerateResult,
} from "./types.js";
import { getModelsByProvider } from "./catalog.js";
import { config } from "../shared/config.js";

// ── PiAPI Provider ─────────────────────────────────────────────
// Async video generation via PiAPI (Kling, Seedance).

const BASE = "https://api.piapi.ai/api/v1";

/** Map catalog model IDs to the PiAPI model name. */
const MODEL_MAP: Record<string, string> = {
  "kling-v2": "kling",
  "seedance-2.0": "seedance",
};

export class PiAPIProvider implements ModelProvider {
  id = "piapi";
  type = "video" as const;
  models: ModelEntry[] = getModelsByProvider("piapi");

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const apiKey = config.piapiApiKey;
    if (!apiKey) {
      return { status: "failed", error: "PiAPI API key is not configured" };
    }

    const piModel = MODEL_MAP[params.model];
    if (!piModel) {
      return { status: "failed", error: `Unknown PiAPI model: ${params.model}` };
    }

    const input: Record<string, unknown> = { prompt: params.userPrompt };

    // If an image attachment exists, encode it as a base64 data URI.
    const imageAttachment = params.attachments?.find((a) => a.type === "image");
    if (imageAttachment) {
      const buf = readFileSync(imageAttachment.filePath);
      const b64 = buf.toString("base64");
      input.image = `data:${imageAttachment.mimeType};base64,${b64}`;
    }

    const body = {
      model: piModel,
      task_type: "video_generation",
      input,
    };

    const res = await fetch(`${BASE}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `PiAPI create task failed (${res.status}): ${text}` };
    }

    const json = (await res.json()) as { data?: { task_id?: string } };
    const taskId = json.data?.task_id;
    if (!taskId) {
      return { status: "failed", error: "PiAPI response missing task_id" };
    }

    return { status: "processing", jobId: taskId };
  }

  async checkJob(jobId: string): Promise<GenerateResult> {
    const apiKey = config.piapiApiKey;
    if (!apiKey) {
      return { status: "failed", error: "PiAPI API key is not configured" };
    }

    const res = await fetch(`${BASE}/task/${jobId}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `PiAPI check task failed (${res.status}): ${text}` };
    }

    const json = (await res.json()) as {
      data?: { status?: string; output?: { video_url?: string } };
    };

    const taskStatus = json.data?.status;

    if (taskStatus === "completed") {
      return {
        status: "completed",
        jobId,
        output: { fileUrl: json.data?.output?.video_url },
      };
    }

    if (taskStatus === "failed") {
      return { status: "failed", jobId, error: "PiAPI task failed" };
    }

    return { status: "processing", jobId };
  }

  async getStatus(): Promise<{ available: boolean; error?: string }> {
    return config.piapiApiKey
      ? { available: true }
      : { available: false, error: "PIAPI_API_KEY not set" };
  }
}
