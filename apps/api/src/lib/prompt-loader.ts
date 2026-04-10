/**
 * Prompt loader — Step 0.8
 *
 * Loads the active system prompt from prompt_registry before AI invocation.
 * This is the contract from DEC-145: every agent reads its system prompt from
 * the registry, never hardcoded. Changing the prompt in DB takes effect on
 * the next invocation — no redeploy needed.
 *
 * Usage:
 *   const prompt = await loadPrompt(db, 'brand-strategist', 'discovery');
 *   await classifyText({ ctx, model: prompt.model as ModelId, system: prompt.systemPrompt, prompt });
 */
import { eq, and } from 'drizzle-orm';
import { promptRegistry } from '@criteria/db';
import type { Database } from '@criteria/db';

export interface PromptConfig {
  id: string;
  agentId: string;
  skillId: string;
  version: number;
  systemPrompt: string;
  model: string;
  provider: string;
  dataSensitivity: string;
  approvedProviders: string[];
  knowledgeBaseRef: string | null;
}

/**
 * Load the active system prompt for a given agent × skill pair.
 * Throws if no active prompt exists — callers must handle this by
 * either creating a prompt in the registry or falling back gracefully.
 */
export async function loadPrompt(
  db: Database,
  agentId: string,
  skillId: string,
): Promise<PromptConfig> {
  const [row] = await db
    .select()
    .from(promptRegistry)
    .where(
      and(
        eq(promptRegistry.agentId, agentId),
        eq(promptRegistry.skillId, skillId),
        eq(promptRegistry.active, true),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error(
      `No active prompt found in registry for agent="${agentId}" skill="${skillId}". ` +
        `Create one via POST /api/prompts.`,
    );
  }

  return {
    id: row.id,
    agentId: row.agentId,
    skillId: row.skillId,
    version: row.version,
    systemPrompt: row.systemPrompt,
    model: row.model,
    provider: row.provider,
    dataSensitivity: row.dataSensitivity,
    approvedProviders: row.approvedProviders as string[],
    knowledgeBaseRef: row.knowledgeBaseRef,
  };
}
