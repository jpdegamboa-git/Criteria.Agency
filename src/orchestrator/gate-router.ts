import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import {
  type GateType,
  type ProjectStatus,
  GATE_FAIL_RETURN,
  GATE_MAX_ITERATIONS,
  GATE_AGENTS,
} from "../shared/types.js";
import { config } from "../shared/config.js";
import { logger } from "../shared/logger.js";

export interface GateResult {
  gate: GateType;
  decision: "pass" | "fail";
  iteration: number;
  scores: Record<string, number>;
  notes: string;
  maxIterationsReached: boolean;
  returnToStep?: ProjectStatus;
}

export async function evaluateGate(
  projectId: string,
  gate: GateType
): Promise<GateResult> {
  // Count previous iterations for this gate
  const previousReviews = await db
    .select()
    .from(schema.gateReviews)
    .where(
      and(
        eq(schema.gateReviews.projectId, projectId),
        eq(schema.gateReviews.gate, gate)
      )
    );

  const iteration = previousReviews.length + 1;
  const maxIterations = GATE_MAX_ITERATIONS[gate];

  // Mock decision: pass based on configurable rate, higher chance on subsequent attempts
  const adjustedPassRate = Math.min(
    config.gatePassRate + (iteration - 1) * 0.1,
    0.95
  );
  const decision: "pass" | "fail" =
    Math.random() < adjustedPassRate ? "pass" : "fail";

  // Mock scores
  const agents = GATE_AGENTS[gate];
  const scores: Record<string, number> = {};
  for (const agentId of agents) {
    scores[agentId] = decision === "pass"
      ? 7 + Math.random() * 3   // 7-10 for pass
      : 4 + Math.random() * 3;  // 4-7 for fail
  }

  const notes = decision === "pass"
    ? `[MOCK] Gate ${gate.toUpperCase()} passed on iteration ${iteration}. All criteria met.`
    : `[MOCK] Gate ${gate.toUpperCase()} failed on iteration ${iteration}. Returning to ${GATE_FAIL_RETURN[gate]} for revision.`;

  // Record gate review
  await db.insert(schema.gateReviews).values({
    projectId,
    gate,
    iteration,
    decision,
    reviewer: "TL-002",
    scores,
    notes,
  });

  const maxIterationsReached = decision === "fail" && iteration >= maxIterations;

  logger.info("gate.evaluated", {
    projectId,
    gate,
    decision,
    iteration,
    maxIterations,
    maxIterationsReached,
    scores,
  });

  return {
    gate,
    decision,
    iteration,
    scores,
    notes,
    maxIterationsReached,
    returnToStep: decision === "fail" ? GATE_FAIL_RETURN[gate] : undefined,
  };
}
