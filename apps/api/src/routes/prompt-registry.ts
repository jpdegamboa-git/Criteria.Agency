/**
 * Prompt Registry routes — Step 0.8
 *
 * CRUD for prompt_registry table (DEC-145).
 * Prompts are platform-wide (not tenant-scoped) — they are agent × skill
 * configurations that apply to all tenants equally.
 *
 * POST   /api/prompts            — create prompt (auto-versions, deactivates prev)
 * GET    /api/prompts            — list all active prompts
 * GET    /api/prompts/:agentId/:skillId — get active prompt for agent × skill
 * PUT    /api/prompts/:id        — update prompt text/model (creates new version)
 * DELETE /api/prompts/:id        — soft-delete (set active=false)
 *
 * All routes are protected (auth middleware enforced by parent router).
 * Full admin role enforcement deferred to Step 5.2 (Admin Portal).
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { promptRegistry } from '@criteria/db';
import type { Database } from '@criteria/db';
import { logger } from '../lib/logger.js';

const createBody = z.object({
  agentId: z.string().min(1).max(50),
  skillId: z.string().min(1).max(50),
  systemPrompt: z.string().min(1),
  model: z.string().min(1).max(100),
  provider: z.string().min(1).max(50).default('anthropic'),
  dataSensitivity: z.enum(['A', 'B', 'C']).default('C'),
  approvedProviders: z.array(z.string()).default(['anthropic']),
  knowledgeBaseRef: z.string().optional(),
});

const updateBody = z.object({
  systemPrompt: z.string().min(1).optional(),
  model: z.string().min(1).max(100).optional(),
  provider: z.string().min(1).max(50).optional(),
  dataSensitivity: z.enum(['A', 'B', 'C']).optional(),
  approvedProviders: z.array(z.string()).optional(),
  knowledgeBaseRef: z.string().optional(),
});

export function createPromptRegistryRoute(db: Database) {
  const route = new Hono();

  /**
   * GET /api/prompts
   * List all active prompts (admin view).
   */
  route.get('/', async (c) => {
    const rows = await db
      .select()
      .from(promptRegistry)
      .where(eq(promptRegistry.active, true))
      .orderBy(promptRegistry.agentId, promptRegistry.skillId);
    return c.json(rows);
  });

  /**
   * GET /api/prompts/:agentId/:skillId
   * Get the active prompt for a specific agent × skill pair.
   */
  route.get('/:agentId/:skillId', async (c) => {
    const { agentId, skillId } = c.req.param();
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
      return c.json({ error: `No active prompt for agent="${agentId}" skill="${skillId}"` }, 404);
    }
    return c.json(row);
  });

  /**
   * POST /api/prompts
   * Create a new prompt. Auto-increments version and deactivates the previous
   * active prompt for the same agentId × skillId pair.
   */
  route.post('/', async (c) => {
    const raw = await c.req.json();
    const parsed = createBody.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
    }

    const { agentId, skillId, ...fields } = parsed.data;

    // Find current max version for this agent × skill
    const [latest] = await db
      .select({ version: promptRegistry.version })
      .from(promptRegistry)
      .where(and(eq(promptRegistry.agentId, agentId), eq(promptRegistry.skillId, skillId)))
      .orderBy(desc(promptRegistry.version))
      .limit(1);

    const nextVersion = latest ? latest.version + 1 : 1;

    // Deactivate all existing active prompts for this pair
    await db
      .update(promptRegistry)
      .set({ active: false })
      .where(
        and(
          eq(promptRegistry.agentId, agentId),
          eq(promptRegistry.skillId, skillId),
          eq(promptRegistry.active, true),
        ),
      );

    const [created] = await db
      .insert(promptRegistry)
      .values({
        agentId,
        skillId,
        version: nextVersion,
        active: true,
        systemPrompt: fields.systemPrompt,
        model: fields.model,
        provider: fields.provider,
        dataSensitivity: fields.dataSensitivity,
        approvedProviders: fields.approvedProviders,
        knowledgeBaseRef: fields.knowledgeBaseRef ?? null,
      })
      .returning();

    logger.info({ agentId, skillId, version: nextVersion, id: created.id }, 'Prompt created');
    return c.json(created, 201);
  });

  /**
   * PUT /api/prompts/:id
   * Update a prompt's content or model — creates a new version with the patch
   * applied and deactivates the previous one.
   */
  route.put('/:id', async (c) => {
    const { id } = c.req.param();
    const raw = await c.req.json();
    const parsed = updateBody.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
    }

    const [existing] = await db
      .select()
      .from(promptRegistry)
      .where(eq(promptRegistry.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Prompt not found' }, 404);
    }

    const { agentId, skillId } = existing;

    // Deactivate all active for this pair
    await db
      .update(promptRegistry)
      .set({ active: false })
      .where(
        and(
          eq(promptRegistry.agentId, agentId),
          eq(promptRegistry.skillId, skillId),
          eq(promptRegistry.active, true),
        ),
      );

    const [latest] = await db
      .select({ version: promptRegistry.version })
      .from(promptRegistry)
      .where(and(eq(promptRegistry.agentId, agentId), eq(promptRegistry.skillId, skillId)))
      .orderBy(desc(promptRegistry.version))
      .limit(1);

    const nextVersion = (latest?.version ?? existing.version) + 1;

    const [created] = await db
      .insert(promptRegistry)
      .values({
        agentId,
        skillId,
        version: nextVersion,
        active: true,
        systemPrompt: parsed.data.systemPrompt ?? existing.systemPrompt,
        model: parsed.data.model ?? existing.model,
        provider: parsed.data.provider ?? existing.provider,
        dataSensitivity: (parsed.data.dataSensitivity ?? existing.dataSensitivity) as 'A' | 'B' | 'C',
        approvedProviders: (parsed.data.approvedProviders ?? existing.approvedProviders) as string[],
        knowledgeBaseRef: parsed.data.knowledgeBaseRef ?? existing.knowledgeBaseRef,
      })
      .returning();

    logger.info({ agentId, skillId, version: nextVersion, id: created.id }, 'Prompt updated (new version)');
    return c.json(created);
  });

  /**
   * DELETE /api/prompts/:id
   * Soft-delete — sets active=false. The version history is preserved.
   */
  route.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const [updated] = await db
      .update(promptRegistry)
      .set({ active: false })
      .where(eq(promptRegistry.id, id))
      .returning({ id: promptRegistry.id });

    if (!updated) {
      return c.json({ error: 'Prompt not found' }, 404);
    }

    logger.info({ id }, 'Prompt deactivated');
    return c.json({ deactivated: true, id });
  });

  return route;
}
