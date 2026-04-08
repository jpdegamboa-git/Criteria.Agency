import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { GateConfig, GateEvaluation, GateType, MotorGateConfig } from "./types.js";

// ── In-memory gate config store ──

const gateConfigStore = new Map<string, MotorGateConfig>();

// ── evaluateGate ──

interface GateThreshold {
  autoPass: number;
  autoFail: number;
}

const DEFAULT_THRESHOLD: GateThreshold = { autoPass: 95, autoFail: 40 };

export function evaluateGate(
  score: number,
  threshold: GateThreshold = DEFAULT_THRESHOLD,
): GateEvaluation {
  let verdict: GateEvaluation["verdict"];
  let feedback: string;

  if (score >= threshold.autoPass) {
    verdict = "pass";
    feedback = `Score ${score} meets or exceeds auto-pass threshold of ${threshold.autoPass}.`;
  } else if (score <= threshold.autoFail) {
    verdict = "fail";
    feedback = `Score ${score} is at or below auto-fail threshold of ${threshold.autoFail}.`;
  } else {
    verdict = "needs_human_review";
    feedback = `Score ${score} is between thresholds (fail: ${threshold.autoFail}, pass: ${threshold.autoPass}). Human review required.`;
  }

  return {
    gateId: "",
    score,
    verdict,
    iteration: 1,
    evaluator: "system",
    feedback,
  };
}

// ── resolveGateType ──

export async function resolveGateType(
  clientId: string,
  motor: string,
  gateId: string,
): Promise<GateType> {
  const key = `${clientId}:${motor}`;
  const config = gateConfigStore.get(key);

  if (!config) return "hybrid";

  const gate = config.gates.find((g) => g.gateId === gateId);
  return gate ? gate.type : "hybrid";
}

// ── getMotorGateConfig ──

const DEFAULT_GATE_CONFIG: GateConfig = {
  gateId: "G1",
  type: "hybrid",
  hybridThreshold: { autoPass: 95, autoFail: 40 },
  evaluators: [],
  maxIterations: 3,
  escalation: { afterIterations: 2, escalateTo: "human" },
  required: true,
};

export async function getMotorGateConfig(
  clientId: string,
  motor: string,
): Promise<MotorGateConfig> {
  const key = `${clientId}:${motor}`;
  const config = gateConfigStore.get(key);

  if (config) return config;

  return {
    clientId,
    motor,
    gates: [{ ...DEFAULT_GATE_CONFIG }],
  };
}

// ── upsertMotorGateConfig ──

export async function upsertMotorGateConfig(
  clientId: string,
  motor: string,
  gates: GateConfig[],
): Promise<MotorGateConfig> {
  const key = `${clientId}:${motor}`;
  const config: MotorGateConfig = { clientId, motor, gates };
  gateConfigStore.set(key, config);
  return config;
}

// ── getGateStats ──

export async function getGateStats(
  clientId: string,
): Promise<{ byMotor: Record<string, { total: number; passed: number; failed: number; humanReview: number }> }> {
  const reviews = await db
    .select({
      projectId: schema.gateReviews.projectId,
      gate: schema.gateReviews.gate,
      decision: schema.gateReviews.decision,
    })
    .from(schema.gateReviews)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.gateReviews.projectId))
    .where(eq(schema.projects.clientId, clientId));

  const byMotor: Record<string, { total: number; passed: number; failed: number; humanReview: number }> = {};

  for (const review of reviews) {
    const motor = review.gate;
    if (!byMotor[motor]) {
      byMotor[motor] = { total: 0, passed: 0, failed: 0, humanReview: 0 };
    }
    byMotor[motor].total++;

    if (review.decision === "approved") {
      byMotor[motor].passed++;
    } else if (review.decision === "rejected") {
      byMotor[motor].failed++;
    } else {
      byMotor[motor].humanReview++;
    }
  }

  return { byMotor };
}
