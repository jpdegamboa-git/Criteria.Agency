import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../shared/logger.js";

const MAX_NORMAL_ATTEMPTS = 3;
const MAX_TOTAL_ATTEMPTS = 6;

export interface ThreePlusThreeStatus {
  attempts: number;
  phase: "normal" | "adjusted" | "escalated";
  canRetry: boolean;
}

export async function getAttemptStatus(
  projectId: string,
  agentId: string,
  step: string
): Promise<ThreePlusThreeStatus> {
  const executions = await db
    .select()
    .from(schema.agentExecutions)
    .where(
      and(
        eq(schema.agentExecutions.projectId, projectId),
        eq(schema.agentExecutions.agentId, agentId),
        eq(schema.agentExecutions.step, step),
        eq(schema.agentExecutions.status, "failed")
      )
    );

  const failedCount = executions.length;

  if (failedCount >= MAX_TOTAL_ATTEMPTS) {
    return { attempts: failedCount, phase: "escalated", canRetry: false };
  }
  if (failedCount >= MAX_NORMAL_ATTEMPTS) {
    return { attempts: failedCount, phase: "adjusted", canRetry: true };
  }
  return { attempts: failedCount, phase: "normal", canRetry: true };
}

export async function recordFailedAttempt(
  projectId: string,
  agentId: string,
  step: string,
  error: string
): Promise<ThreePlusThreeStatus> {
  const status = await getAttemptStatus(projectId, agentId, step);

  await db.insert(schema.agentExecutions).values({
    projectId,
    agentId,
    step,
    attempt: status.attempts + 1,
    status: "failed",
    error,
  });

  const newStatus = await getAttemptStatus(projectId, agentId, step);

  if (newStatus.phase === "adjusted" && status.phase === "normal") {
    logger.warn("3+3.leader_adjustment", {
      projectId,
      agentId,
      step,
      failedAttempts: newStatus.attempts,
    });
  }

  if (newStatus.phase === "escalated") {
    logger.error("3+3.escalation", {
      projectId,
      agentId,
      step,
      failedAttempts: newStatus.attempts,
      message: "Human intervention required",
    });
  }

  return newStatus;
}
