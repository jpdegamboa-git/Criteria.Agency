import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import {
  PIPELINE_FLOW,
  STEP_GATE_MAP,
  type ProjectStatus,
  type ArtifactStep,
} from "../shared/types.js";
import { dispatchAgentsForStep } from "./dispatcher.js";
import { evaluateGate } from "./gate-router.js";
import { logger } from "../shared/logger.js";

export interface AdvanceResult {
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
  gateEvaluated?: string;
  gateDecision?: "pass" | "fail";
  gateIteration?: number;
  maxIterationsReached?: boolean;
  escalated?: boolean;
  completed: boolean;
}

function getNextStatus(current: ProjectStatus): ProjectStatus | null {
  const idx = PIPELINE_FLOW.indexOf(current);
  if (idx === -1 || idx >= PIPELINE_FLOW.length - 1) return null;
  return PIPELINE_FLOW[idx + 1];
}

function statusToArtifactStep(status: ProjectStatus): ArtifactStep {
  if (status === "delivered") return "delivery";
  return status as ArtifactStep;
}

export async function advanceProject(
  projectId: string
): Promise<AdvanceResult> {
  // Get current project
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (project.status === "delivered") {
    return {
      previousStatus: "delivered",
      newStatus: "delivered",
      completed: true,
    };
  }

  if (project.status === "paused") {
    throw new Error(
      `Project ${projectId} is paused. Resume before advancing.`
    );
  }

  const currentStatus = project.status as ProjectStatus;
  const step = statusToArtifactStep(currentStatus);

  logger.info("pipeline.advancing", { projectId, from: currentStatus });

  // 1. Dispatch agents for current step
  await dispatchAgentsForStep(projectId, step);

  // 2. Check if a gate follows this step
  const gate = STEP_GATE_MAP[currentStatus];

  if (gate) {
    const gateResult = await evaluateGate(projectId, gate);

    if (gateResult.decision === "fail") {
      if (gateResult.maxIterationsReached) {
        // Pause project — max iterations reached, needs human
        await db
          .update(schema.projects)
          .set({
            status: "paused",
            currentGate: gate,
            updatedAt: new Date(),
          })
          .where(eq(schema.projects.id, projectId));

        logger.error("pipeline.max_iterations", {
          projectId,
          gate,
          iteration: gateResult.iteration,
        });

        return {
          previousStatus: currentStatus,
          newStatus: "paused",
          gateEvaluated: gate,
          gateDecision: "fail",
          gateIteration: gateResult.iteration,
          maxIterationsReached: true,
          escalated: true,
          completed: false,
        };
      }

      // Gate failed but can retry — stay at current step
      logger.info("pipeline.gate_fail_retry", {
        projectId,
        gate,
        iteration: gateResult.iteration,
        returnTo: gateResult.returnToStep,
      });

      return {
        previousStatus: currentStatus,
        newStatus: currentStatus,
        gateEvaluated: gate,
        gateDecision: "fail",
        gateIteration: gateResult.iteration,
        maxIterationsReached: false,
        completed: false,
      };
    }

    // Gate passed
    logger.info("pipeline.gate_pass", { projectId, gate });
  }

  // 3. Advance to next step
  const nextStatus = getNextStatus(currentStatus);

  if (!nextStatus) {
    // Shouldn't happen if pipeline is well-defined
    throw new Error(`No next status after ${currentStatus}`);
  }

  await db
    .update(schema.projects)
    .set({
      status: nextStatus,
      currentGate: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId));

  const completed = nextStatus === "delivered";

  if (completed) {
    logger.info("pipeline.delivered", { projectId });
  }

  return {
    previousStatus: currentStatus,
    newStatus: nextStatus,
    gateEvaluated: gate,
    gateDecision: gate ? "pass" : undefined,
    completed,
  };
}

/**
 * Run the entire pipeline until delivery or a gate failure/pause.
 */
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
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  logger.info("pipeline.paused", { projectId });
}

export async function resumeProject(
  projectId: string,
  resumeToStatus: ProjectStatus
): Promise<void> {
  await db
    .update(schema.projects)
    .set({
      status: resumeToStatus,
      currentGate: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId));
  logger.info("pipeline.resumed", { projectId, resumeTo: resumeToStatus });
}
