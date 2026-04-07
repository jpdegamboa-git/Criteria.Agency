import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import type { GateConfig } from "./pipeline-registry.js";
import { config } from "../shared/config.js";
import { logger } from "../shared/logger.js";

export interface GateResult {
  gate: string;
  decision: "pass" | "fail";
  iteration: number;
  scores: Record<string, number>;
  notes: string;
  maxIterationsReached: boolean;
  returnToStep?: string;
}

export async function evaluateGate(
  projectId: string,
  gate: string,
  gateConfig: GateConfig
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
  const maxIterations = gateConfig.maxIterations;

  // Mock decision: pass based on configurable rate, higher chance on subsequent attempts
  const adjustedPassRate = Math.min(
    config.gatePassRate + (iteration - 1) * 0.1,
    0.95
  );
  const decision: "pass" | "fail" =
    Math.random() < adjustedPassRate ? "pass" : "fail";

  // Mock scores
  const scores: Record<string, number> = {};
  for (const agentId of gateConfig.evaluators) {
    scores[agentId] = decision === "pass"
      ? 7 + Math.random() * 3
      : 4 + Math.random() * 3;
  }

  const notes = decision === "pass"
    ? `[MOCK] Gate ${gate.toUpperCase()} passed on iteration ${iteration}. All criteria met.`
    : `[MOCK] Gate ${gate.toUpperCase()} failed on iteration ${iteration}. Returning to ${gateConfig.failReturnTo} for revision.`;

  // Record gate review
  await db.insert(schema.gateReviews).values({
    projectId,
    gate,
    iteration,
    decision,
    reviewer: gateConfig.evaluators[0] ?? "unknown",
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
    returnToStep: decision === "fail" ? gateConfig.failReturnTo : undefined,
  };
}
