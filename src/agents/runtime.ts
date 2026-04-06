import type { ArtifactStep } from "../shared/types.js";
import type { AgentResult } from "./mock.js";
import { executeMockAgent } from "./mock.js";

/**
 * Execute an agent. Currently always uses mock mode.
 * When real APIs are integrated, this will route to the appropriate runtime.
 */
export async function executeAgent(
  agentId: string,
  projectId: string,
  step: ArtifactStep
): Promise<AgentResult> {
  return executeMockAgent(agentId, projectId, step);
}
