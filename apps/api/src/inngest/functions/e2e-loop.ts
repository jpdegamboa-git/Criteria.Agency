/**
 * End-to-end loop Inngest function — Step 0.9
 *
 * Proves that the full infrastructure stack works together:
 *   API request (authenticated) → Inngest event → validate schema (Zod) →
 *   verify tenant (DB) → load prompt from registry → invoke LLM (Vercel AI SDK
 *   via Helicone) → save result to output_registry (PostgreSQL, tenant-isolated)
 *
 * DEC-148 compliance:
 * - Event schema validated with Zod in first step
 * - TenantId verified against DB in second step
 * - Sensitive data (system prompt text) not stored in step state;
 *   only the promptId + model + metadata are passed between steps
 *
 * DEC-145: system prompt loaded from prompt_registry, not hardcoded
 * DEC-147: LLM call routed through Helicone with agentId/tenantId/skillId tags
 */
import { z } from 'zod';
import { inngest } from '../client.js';
import { eq, and, organizationSettings, promptRegistry, outputRegistry } from '@criteria/db';
import type { Database } from '@criteria/db';
import { classifyText } from '../../lib/ai.js';
import type { ModelId } from '../../lib/ai.js';

const eventSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  agentId: z.string().min(1, 'agentId is required'),
  skillId: z.string().min(1, 'skillId is required'),
  userMessage: z.string().min(1, 'userMessage is required').max(2000),
});

export type E2eLoopEventData = z.infer<typeof eventSchema>;

export function createE2eLoopFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'test-e2e-loop',
      retries: 1,
      triggers: [{ event: 'test/e2e.loop' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate event schema (DEC-148) ───────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) {
          throw new Error(`Invalid event schema: ${result.error.message}`);
        }
        return result.data;
      });

      // ── Step 2: Verify tenantId exists in DB (DEC-148) ───────────────────
      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);

        if (!tenant) {
          throw new Error(`Tenant not found: ${validated.tenantId}`);
        }
      });

      // ── Step 3: Load prompt from registry + invoke LLM (DEC-145, DEC-147) ─
      // Both operations combined in a single step so the system prompt text
      // is never stored in Inngest step state (passes through in-memory only).
      const llmResult = await step.run('load-prompt-and-invoke-llm', async () => {
        // Load active prompt for this agent × skill pair (DEC-145)
        const [prompt] = await db
          .select()
          .from(promptRegistry)
          .where(
            and(
              eq(promptRegistry.agentId, validated.agentId),
              eq(promptRegistry.skillId, validated.skillId),
              eq(promptRegistry.active, true),
            ),
          )
          .limit(1);

        if (!prompt) {
          throw new Error(
            `No active prompt found for agent="${validated.agentId}" skill="${validated.skillId}". ` +
              `Create one via POST /api/prompts.`,
          );
        }

        // Invoke LLM via Helicone (DEC-141, DEC-147)
        const result = await classifyText({
          ctx: {
            agentId: validated.agentId,
            skillId: validated.skillId,
            tenantId: validated.tenantId,
          },
          model: prompt.model as ModelId,
          system: prompt.systemPrompt,
          prompt: validated.userMessage,
        });

        // Return only metadata to step state — not the full system prompt.
        // Explicit shape avoids leaking AI SDK internal types into step state (TS portability).
        return {
          promptId: prompt.id,
          promptVersion: prompt.version,
          model: prompt.model,
          responseText: result.text,
          usage: {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
          } as { inputTokens: number; outputTokens: number },
        };
      });

      // ── Step 4: Save result to output_registry (tenant-isolated) ──────────
      const saved = await step.run('save-result', async () => {
        const [row] = await db
          .insert(outputRegistry)
          .values({
            organizationId: validated.tenantId,
            sourceMotor: 'test',
            sourceAgentId: validated.agentId,
            outputType: 'e2e-loop-result',
            // contentRef points to a real artifact; for this test we use promptId as a stand-in
            contentRef: llmResult.promptId,
            summary: llmResult.responseText.slice(0, 500),
            metadata: {
              agentId: validated.agentId,
              skillId: validated.skillId,
              promptVersion: llmResult.promptVersion,
              model: llmResult.model,
              usage: llmResult.usage,
            },
          })
          .returning({ id: outputRegistry.id });

        return { outputId: row.id };
      });

      return {
        tenantId: validated.tenantId,
        outputId: saved.outputId,
        responseText: llmResult.responseText,
        promptVersion: llmResult.promptVersion,
        model: llmResult.model,
        usage: llmResult.usage,
      };
    },
  );
}
