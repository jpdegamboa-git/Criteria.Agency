// ── Perception Types ──

export interface PerceptionAttribute {
  attribute: string;
  currentPerception: string;
  desiredPerception: string;
  gap: "none" | "small" | "medium" | "large";
  priority: "low" | "medium" | "high";
}

export interface PerceptionMap {
  brandName: string;
  attributes: PerceptionAttribute[];
  strengths: string[];
  weaknesses: string[];
  keyAssociations: string[];
  overallSentiment: number;
  dataQuality: "high" | "medium" | "low";
  generatedAt: string;
}

// ── Gap Analysis Types ──

export interface GapAnalysisResult {
  perceptionVsAspiration: PerceptionAttribute[];
  priorityGaps: string[];
  competitiveWhitespace: string[];
  opportunities: string[];
  risks: string[];
}

// ── Positioning Document Types ──

export interface PositioningStatement {
  targetAudience: string;
  need: string;
  brandName: string;
  category: string;
  keyBenefit: string;
  reasonsToBelieve: string[];
}

export interface CompetitiveFrame {
  directCompetitors: Array<{ name: string; positioning: string }>;
  indirectCompetitors: Array<{ name: string; positioning: string }>;
  differentiation: string;
}

export interface ValuePropositionCanvas {
  customerJobs: string[];
  pains: string[];
  gains: string[];
  painRelievers: string[];
  gainCreators: string[];
}

export interface PositioningDocument {
  statement: PositioningStatement;
  competitiveFrame: CompetitiveFrame;
  valueProposition: ValuePropositionCanvas;
  perceptionGapMap: PerceptionAttribute[];
  brandAttributes: [string, string, string];
  audienceResonance: Array<{
    audience: string;
    fitScore: number;
    reasoning: string;
  }>;
  confidenceScore: number;
  validatedAt: string | null;
}

// ── Repositioning Types ──

export type ChangeType = "replace" | "evolve" | "keep" | "remove" | "add";

export interface ChangeMatrixEntry {
  element: string;
  current: string;
  target: string;
  changeType: ChangeType;
  phase: number;
}

export interface TransitionPhase {
  phase: number;
  name: string;
  durationMonths: string;
  objectives: string[];
  actions: string[];
  measurements: string[];
}

export interface TransitionPlan {
  brandName: string;
  fromPositioning: string;
  toPositioning: string;
  changeMatrix: ChangeMatrixEntry[];
  phases: TransitionPhase[];
  riskMitigation: string[];
  successMetrics: Array<{
    metric: string;
    current: string;
    target: string;
  }>;
  totalDurationMonths: number;
}

export type TrackingStatus = "on_track" | "at_risk" | "off_track";

export interface PerceptionMetrics {
  brandHealth: number;
  attributeScores: Record<string, number>;
  sentiment: number;
  awarenessLevel: number;
}

// ── Step Result Types ──

export interface PositioningStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
