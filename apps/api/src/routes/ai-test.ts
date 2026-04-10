/**
 * AI test routes — Step 0.7
 *
 * Validates both Vercel AI SDK invocation patterns through Helicone.
 * These routes are for infrastructure validation only — not production features.
 *
 * POST /api/ai/classify   — generateText() with Haiku (simple classification)
 * POST /api/ai/agent      — generateText() with tools + Sonnet (agent pattern)
 *
 * Both routes are protected (auth middleware enforced by parent router).
 * Both inject tenantId from session into Helicone metadata.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { tool } from 'ai';
import { classifyText, runAgentWithTools, MODELS } from '../lib/ai.js';
import { loadPrompt } from '../lib/prompt-loader.js';
import { getAuthContext } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import type { Database } from '@criteria/db';
import { eq, organizationSettings } from '@criteria/db';
import type { ModelId } from '../lib/ai.js';

const classifyBody = z.object({
  text: z.string().min(1).max(2000),
});

const agentBody = z.object({
  question: z.string().min(1).max(1000),
});

export function createAiTestRoute(db: Database) {
  const route = new Hono();

  /**
   * POST /api/ai/classify
   * Pattern 1: generateText() — Haiku classifies a text input.
   * Validates: simple invocation works, Helicone receives call with metadata.
   */
  route.post('/classify', async (c) => {
    const { tenantId } = getAuthContext(c);
    const raw = await c.req.json();
    const parsed = classifyBody.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
    }

    const ctx = { agentId: 'test-classifier', skillId: 'classify', tenantId };

    try {
      const result = await classifyText({
        ctx,
        model: MODELS.haiku,
        system: "You are a text classifier. Classify the sentiment of the input as one of: positive, negative, neutral. Respond with only the label.",
        prompt: parsed.data.text,
      });

      logger.info({ tenantId, agentId: ctx.agentId, usage: result.usage }, 'AI classify complete');
      return c.json({ classification: result.text.trim(), usage: result.usage });
    } catch (err) {
      logger.error({ err, tenantId }, 'AI classify failed');
      return c.json({ error: 'LLM invocation failed — check ANTHROPIC_API_KEY and Helicone config' }, 503);
    }
  });

  /**
   * POST /api/ai/agent
   * Pattern 2: generateText() with tools — Sonnet uses a tool to look up tenant data.
   * Validates: agent-with-tools pattern works, tool execution works, Helicone receives call.
   */
  route.post('/agent', async (c) => {
    const { tenantId } = getAuthContext(c);
    const raw = await c.req.json();
    const parsed = agentBody.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
    }

    const ctx = { agentId: 'test-agent', skillId: 'lookup', tenantId };

    // Tool: look up tenant plan from DB (passes IDs only — DEC-148)
    // v6 API: inputSchema replaces parameters
    const lookupTenantPlanSchema = z.object({
      organizationId: z.string().describe('The tenant organization ID to look up'),
    });
    const lookupTenantPlan = tool<z.infer<typeof lookupTenantPlanSchema>, { plan: string }>({
      description: 'Look up the subscription plan for the current tenant from the database.',
      inputSchema: lookupTenantPlanSchema,
      execute: async ({ organizationId }) => {
        const [settings] = await db
          .select({ plan: organizationSettings.plan })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, organizationId))
          .limit(1);

        return { plan: settings?.plan ?? 'unknown' };
      },
    });

    try {
      const result = await runAgentWithTools({
        ctx,
        model: MODELS.sonnet,
        system: "You are a helpful assistant for the criteria.agency platform. Answer the user's question using the available tools.",
        prompt: `The user's organization ID is: ${tenantId}\n\nQuestion: ${parsed.data.question}`,
        tools: { lookupTenantPlan },
        maxSteps: 3,
      });

      logger.info({ tenantId, agentId: ctx.agentId, steps: result.steps.length, usage: result.usage }, 'AI agent complete');
      return c.json({
        answer: result.text,
        toolCallCount: result.toolCalls?.length ?? 0,
        steps: result.steps.length,
        usage: result.usage,
      });
    } catch (err) {
      logger.error({ err, tenantId }, 'AI agent failed');
      return c.json({ error: 'Agent invocation failed — check ANTHROPIC_API_KEY and Helicone config' }, 503);
    }
  });

  /**
   * POST /api/ai/from-registry
   * Pattern 3: load system prompt from prompt_registry, then invoke LLM.
   * Validates: DEC-145 — prompt changes in DB take effect without redeploy.
   *
   * Body: { agentId, skillId, userMessage }
   * Loads active prompt for agentId×skillId, runs classifyText() with that system prompt.
   */
  const fromRegistryBody = z.object({
    agentId: z.string().min(1).max(50),
    skillId: z.string().min(1).max(50),
    userMessage: z.string().min(1).max(2000),
  });

  route.post('/from-registry', async (c) => {
    const { tenantId } = getAuthContext(c);
    const raw = await c.req.json();
    const parsed = fromRegistryBody.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
    }

    const { agentId, skillId, userMessage } = parsed.data;

    // Load system prompt from registry — this is the DEC-145 contract
    let promptConfig;
    try {
      promptConfig = await loadPrompt(db, agentId, skillId);
    } catch (err) {
      return c.json(
        { error: `Prompt not found in registry for agent="${agentId}" skill="${skillId}". Create it via POST /api/prompts first.` },
        404,
      );
    }

    const ctx = { agentId, skillId, tenantId };

    try {
      const result = await classifyText({
        ctx,
        model: promptConfig.model as ModelId,
        system: promptConfig.systemPrompt,
        prompt: userMessage,
      });

      logger.info(
        { tenantId, agentId, skillId, promptVersion: promptConfig.version, usage: result.usage },
        'AI from-registry invocation complete',
      );

      return c.json({
        response: result.text.trim(),
        promptVersion: promptConfig.version,
        promptId: promptConfig.id,
        model: promptConfig.model,
        usage: result.usage,
      });
    } catch (err) {
      logger.error({ err, tenantId, agentId, skillId }, 'AI from-registry invocation failed');
      return c.json({ error: 'LLM invocation failed — check ANTHROPIC_API_KEY' }, 503);
    }
  });

  return route;
}
