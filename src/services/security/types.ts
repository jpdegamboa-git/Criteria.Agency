import type { AutonomyLevel } from "../../shared/engine-types.js";

// ── Autonomy ──

export interface ResolvedAutonomy {
  effectiveLevel: AutonomyLevel;
  source: "global" | "motor_override" | "action_override" | "schedule";
  reason: string;
}

export interface AutonomyCheckResult {
  allowed: boolean;
  level: AutonomyLevel;
  requiresApproval: boolean;
  reason: string;
}

/** Actions that always require approval at each autonomy level */
export const AUTONOMY_APPROVAL_THRESHOLDS: Record<AutonomyLevel, string[]> = {
  1: ["*"],
  2: ["publish", "send_email", "spend", "contact_vendor", "external_api"],
  3: ["publish", "spend", "external_communication", "major_revision"],
  4: ["spend_above_threshold", "first_time_action", "crisis_communication"],
  5: ["budget_override", "account_change"],
};

// ── PII Detection ──

export type PIIType = "credit_card" | "ssn" | "bank_account" | "email" | "phone" | "full_name" | "address";

export interface PIIDetection {
  type: PIIType;
  value: string;
  location: string;
  action: "blocked" | "anonymized" | "allowed";
}

export interface PIIPolicy {
  neverSendToLLM: PIIType[];
  anonymizeBeforeLLM: PIIType[];
}

export const DEFAULT_PII_POLICY: PIIPolicy = {
  neverSendToLLM: ["credit_card", "ssn", "bank_account"],
  anonymizeBeforeLLM: ["email", "phone", "full_name"],
};

export interface PIIScanResult {
  detections: PIIDetection[];
  sanitizedText: string;
  blocked: boolean;
  blockReason?: string;
}

export interface IsolationAuditCheck {
  check: string;
  status: "pass" | "fail" | "warning";
  details: string;
}

export interface IsolationAuditResult {
  clientId: string;
  auditDate: string;
  checks: IsolationAuditCheck[];
  overallStatus: "compliant" | "non_compliant";
}

// ── Gates ──

export type GateType = "ai" | "human" | "hybrid";

export interface GateConfig {
  gateId: string;
  type: GateType;
  hybridThreshold?: {
    autoPass: number;
    autoFail: number;
  };
  evaluators: string[];
  maxIterations: number;
  escalation: {
    afterIterations: number;
    escalateTo: string;
  };
  required: boolean;
}

export interface MotorGateConfig {
  clientId: string;
  motor: string;
  gates: GateConfig[];
}

export interface GateEvaluation {
  gateId: string;
  score: number;
  verdict: "pass" | "fail" | "needs_human_review";
  iteration: number;
  evaluator: string;
  feedback: string;
}

// ── Audit Query ──

export interface AuditQueryParams {
  clientId: string;
  action?: string;
  actorType?: "agent" | "human" | "system";
  resourceType?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}
