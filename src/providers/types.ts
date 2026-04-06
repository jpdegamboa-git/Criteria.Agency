// ── Provider Types ──────────────────────────────────────────────

export type ModelType = "text" | "image" | "video" | "audio";
export type ModelTier = "premium" | "standard" | "fast";
export type GenerateStatus = "completed" | "processing" | "failed";

export interface ModelEntry {
  id: string;
  provider: string;
  type: ModelType;
  tier: ModelTier;
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
  outputFormat?: string;
}

export interface GenerateResult {
  status: GenerateStatus;
  jobId?: string;
  output?: {
    text?: string;
    fileUrl?: string;
    filePath?: string;
    metadata?: Record<string, unknown>;
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
  type: ModelType;
  models: ModelEntry[];
  generate(params: GenerateParams): Promise<GenerateResult>;
  checkJob?(jobId: string): Promise<GenerateResult>;
  getStatus(): Promise<{ available: boolean; error?: string }>;
}
