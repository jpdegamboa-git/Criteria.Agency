import { executeAgent } from "../agents/runtime.js";
import type { AgentResult } from "../agents/mock.js";
import type { ArtifactStep } from "../shared/types.js";
import { PipelineRegistry } from "./pipeline-registry.js";
import { logger } from "../shared/logger.js";

export async function dispatchAgentsForStep(
  projectId: string,
  step: string,
  pipelineType: string = "video-production"
): Promise<AgentResult[]> {
  const agentIds = PipelineRegistry.getAgentsForStep(pipelineType, step);

  if (agentIds.length === 0) {
    logger.warn("dispatcher.no_agents", { projectId, step, pipelineType });
    return [];
  }

  logger.info("dispatcher.step_start", {
    projectId,
    step,
    pipelineType,
    agents: agentIds,
  });

  const results: AgentResult[] = [];

  for (const agentId of agentIds) {
    const result = await executeAgent(agentId, projectId, step as ArtifactStep);
    results.push(result);
  }

  logger.info("dispatcher.step_complete", {
    projectId,
    step,
    totalArtifacts: results.reduce((sum, r) => sum + r.artifactIds.length, 0),
  });

  return results;
}
