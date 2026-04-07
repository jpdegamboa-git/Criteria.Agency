import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { PipelineRegistry } from "./pipeline-registry.js";
import { dispatchAgentsForStep } from "./dispatcher.js";
import { evaluateGate } from "./gate-router.js";
import { logger } from "../shared/logger.js";

export interface AdvanceResult {
  previousStatus: string;
  newStatus: string;
  gateEvaluated?: string;
  gateDecision?: "pass" | "fail";
  gateIteration?: number;
  maxIterationsReached?: boolean;
  escalated?: boolean;
  completed: boolean;
}

export async function advanceProject(
  projectId: string
): Promise<AdvanceResult> {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const pipelineType = project.pipelineType ?? "video-production";
  const currentStatus = project.status as string;

  if (currentStatus === "delivered") {
    return { previousStatus: "delivered", newStatus: "delivered", completed: true };
  }

  if (currentStatus === "paused") {
    throw new Error(`Project ${projectId} is paused. Resume before advancing.`);
  }

  logger.info("pipeline.advancing", { projectId, pipelineType, from: currentStatus });

  // 1. Dispatch agents for current step
  await dispatchAgentsForStep(projectId, currentStatus, pipelineType);

  // 2. Check if a gate follows this step
  const gateName = PipelineRegistry.getGateAfterStep(pipelineType, currentStatus);

  if (gateName) {
    const gateConfig = PipelineRegistry.getGateConfig(pipelineType, gateName);
    const gateResult = await evaluateGate(projectId, gateName, gateConfig);

    if (gateResult.decision === "fail") {
      if (gateResult.maxIterationsReached) {
        await db
          .update(schema.projects)
          .set({ status: "paused" as any, currentGate: gateName, updatedAt: new Date() })
          .where(eq(schema.projects.id, projectId));

        logger.error("pipeline.max_iterations", { projectId, gate: gateName, iteration: gateResult.iteration });

        return {
          previousStatus: currentStatus,
          newStatus: "paused",
          gateEvaluated: gateName,
          gateDecision: "fail",
          gateIteration: gateResult.iteration,
          maxIterationsReached: true,
          escalated: true,
          completed: false,
        };
      }

      logger.info("pipeline.gate_fail_retry", { projectId, gate: gateName, iteration: gateResult.iteration });

      return {
        previousStatus: currentStatus,
        newStatus: currentStatus,
        gateEvaluated: gateName,
        gateDecision: "fail",
        gateIteration: gateResult.iteration,
        maxIterationsReached: false,
        completed: false,
      };
    }

    logger.info("pipeline.gate_pass", { projectId, gate: gateName });
  }

  // 3. Advance to next step
  const nextStep = PipelineRegistry.getNextStep(pipelineType, currentStatus);

  if (!nextStep) {
    await db
      .update(schema.projects)
      .set({ status: "delivered" as any, currentGate: null, updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));

    logger.info("pipeline.delivered", { projectId });

    return {
      previousStatus: currentStatus,
      newStatus: "delivered",
      gateEvaluated: gateName,
      gateDecision: gateName ? "pass" : undefined,
      completed: true,
    };
  }

  await db
    .update(schema.projects)
    .set({ status: nextStep as any, currentGate: null, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));

  return {
    previousStatus: currentStatus,
    newStatus: nextStep,
    gateEvaluated: gateName,
    gateDecision: gateName ? "pass" : undefined,
    completed: false,
  };
}

export async function runFullPipeline(
  projectId: string
): Promise<AdvanceResult[]> {
  const results: AdvanceResult[] = [];

  while (true) {
    const result = await advanceProject(projectId);
    results.push(result);

    if (result.completed) break;
    if (result.newStatus === "paused") break;
    if (result.gateDecision === "fail") break;
  }

  return results;
}

export async function pauseProject(projectId: string): Promise<void> {
  await db
    .update(schema.projects)
    .set({ status: "paused" as any, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  logger.info("pipeline.paused", { projectId });
}

export async function resumeProject(
  projectId: string,
  resumeToStatus: string
): Promise<void> {
  await db
    .update(schema.projects)
    .set({ status: resumeToStatus as any, currentGate: null, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  logger.info("pipeline.resumed", { projectId, resumeTo: resumeToStatus });
}
