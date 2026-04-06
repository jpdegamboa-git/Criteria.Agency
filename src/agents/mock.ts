import { AGENT_OUTPUTS, type ArtifactStep } from "../shared/types.js";
import { createArtifact } from "../storage/artifacts.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { logger } from "../shared/logger.js";

export interface AgentResult {
  agentId: string;
  step: string;
  artifactIds: string[];
  success: boolean;
  error?: string;
}

export async function executeMockAgent(
  agentId: string,
  projectId: string,
  step: ArtifactStep
): Promise<AgentResult> {
  const startedAt = new Date();

  // Record execution start
  const [execution] = await db
    .insert(schema.agentExecutions)
    .values({
      projectId,
      agentId,
      step,
      attempt: 1,
      status: "running",
      startedAt,
    })
    .returning();

  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));

  const outputs = AGENT_OUTPUTS[agentId]?.[step] ?? [];
  const artifactIds: string[] = [];

  for (const output of outputs) {
    const artifact = await createArtifact({
      projectId,
      step,
      type: output.type,
      name: output.name,
      content: output.templateContent,
      agentId,
    });
    artifactIds.push(artifact.id);
  }

  // Mark execution complete
  await db
    .update(schema.agentExecutions)
    .set({
      status: "completed",
      completedAt: new Date(),
      outputArtifactIds: artifactIds,
      cost: { tokens: 0, credits: 0, mockMode: true },
    })
    .where(eq(schema.agentExecutions.id, execution.id));

  logger.info("agent.executed", {
    agentId,
    projectId,
    step,
    artifactsCreated: artifactIds.length,
    mock: true,
  });

  return { agentId, step, artifactIds, success: true };
}
