import { executeAgent } from "../agents/runtime.js";
import type { AgentResult } from "../agents/mock.js";
import { STEP_AGENTS, type ArtifactStep } from "../shared/types.js";
import { logger } from "../shared/logger.js";

export async function dispatchAgentsForStep(
  projectId: string,
  step: ArtifactStep
): Promise<AgentResult[]> {
  const agentIds = STEP_AGENTS[step] ?? [];

  if (agentIds.length === 0) {
    logger.warn("dispatcher.no_agents", { projectId, step });
    return [];
  }

  logger.info("dispatcher.step_start", {
    projectId,
    step,
    agents: agentIds,
  });

  const results: AgentResult[] = [];

  // Execute agents sequentially (in mock mode, order doesn't matter much)
  for (const agentId of agentIds) {
    const result = await executeAgent(agentId, projectId, step);
    results.push(result);
  }

  logger.info("dispatcher.step_complete", {
    projectId,
    step,
    totalArtifacts: results.reduce((sum, r) => sum + r.artifactIds.length, 0),
  });

  return results;
}
