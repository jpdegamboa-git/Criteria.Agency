// ── Pipeline enums ──

export const PROJECT_TYPES = [
  "corporate",
  "explainer",
  "documentary",
  "fiction",
  "micro_content",
  "commercial",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivered",
  "paused",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const GATE_TYPES = ["g1", "g2", "g3", "g4", "g5"] as const;
export type GateType = (typeof GATE_TYPES)[number];

export const GATE_DECISIONS = ["pass", "fail"] as const;
export type GateDecision = (typeof GATE_DECISIONS)[number];

export const ARTIFACT_STEPS = [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivery",
  "model_config",
  "gate_review",
] as const;
export type ArtifactStep = (typeof ARTIFACT_STEPS)[number];

export const ARTIFACT_TYPES = [
  "document",
  "image",
  "video",
  "audio",
  "subtitle",
  "package",
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const EXECUTION_STATUSES = [
  "running",
  "completed",
  "failed",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const TASK_TYPES = [
  "text_gen",
  "image_gen",
  "video_gen",
  "audio_voice",
  "audio_music",
  "audio_sfx",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

// ── Pipeline flow ──

/** Ordered pipeline steps (excluding gates and paused) */
export const PIPELINE_FLOW: ProjectStatus[] = [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivered",
];

/** Which gate follows which step (if any) */
export const STEP_GATE_MAP: Partial<Record<ProjectStatus, GateType>> = {
  concept: "g1",
  script: "g2",
  storyboard: "g3",
  audio: "g4",
  polish: "g5",
};

/** Gate failure: which step to return to */
export const GATE_FAIL_RETURN: Record<GateType, ProjectStatus> = {
  g1: "concept",
  g2: "script",
  g3: "storyboard",
  g4: "edit", // G4 diagnostic can route to edit, video_gen, or audio — default edit
  g5: "polish",
};

/** Max iterations per gate before escalation */
export const GATE_MAX_ITERATIONS: Record<GateType, number> = {
  g1: 3,
  g2: 3,
  g3: 2,
  g4: 2,
  g5: 1,
};

// ── Agent types ──

export type AgentLevel = "top" | "leader" | "sub" | "cross_functional";

export interface AgentRegistryEntry {
  id: string;
  name: string;
  skillFile: string;
  team: number;
  level: AgentLevel;
  steps: ArtifactStep[];
  gates: GateType[];
  autonomy: number;
}

// ── Pipeline-generic types ──

/** All possible step names across all pipelines */
export type PipelineStep = string;

/** All possible gate names across all pipelines */
export type PipelineGate = string;
