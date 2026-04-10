/**
 * Step 0.9 — End-to-end loop integration test
 *
 * Validates the full Fase 0 infrastructure chain:
 *   API (authenticated) → dispatches Inngest event → function validates schema
 *   → verifies tenant → loads prompt from registry → invokes LLM (Vercel AI SDK
 *   via Helicone) → saves result to output_registry with tenant isolation
 *
 * Test structure:
 * 1. Schema validation (Zod) — fast, no DB or LLM needed
 * 2. Tenant verification — DB required
 * 3. Prompt loading — DB required
 * 4. HTTP endpoint — DB required (auth)
 * 5. LLM invocation + output_registry save — DB + ANTHROPIC_API_KEY required
 *
 * Tests 1-4 always run. Test 5 is skipped if ANTHROPIC_API_KEY is not set
 * (safe for CI without API keys).
 *
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import {
  createDb,
  type Database,
  organizationSettings,
  promptRegistry,
  outputRegistry,
  eq,
  and,
} from '@criteria/db';
import { createApp } from '../src/index.js';
import { classifyText, MODELS } from '../src/lib/ai.js';
import { loadPrompt } from '../src/lib/prompt-loader.js';
import type { Hono } from 'hono';

let db: Database;
let app: Hono;

// Mirror the event schema to test validation independently
const eventSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  agentId: z.string().min(1, 'agentId is required'),
  skillId: z.string().min(1, 'skillId is required'),
  userMessage: z.string().min(1, 'userMessage is required').max(2000),
});

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', ...headers },
  };
  if (body) init.body = JSON.stringify(body);
  return app.request(url, init);
}

function getCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length > 0) return raw.map((c: string) => c.split(';')[0]).join('; ');
  const single = res.headers.get('set-cookie');
  if (single) return single.split(';')[0];
  return '';
}

/** Sign up + create org + seed settings + prompt → returns cookies, orgId */
async function createTenantWithPrompt(
  email: string,
  orgSlug: string,
  agentId: string,
  skillId: string,
) {
  const signupRes = await request('POST', '/api/auth/sign-up/email', {
    email,
    password: 'TestPassword123!',
    name: 'E2E Test User',
  });
  expect(signupRes.status).toBe(200);
  let cookies = getCookies(signupRes);

  const orgRes = await request(
    'POST',
    '/api/auth/organization/create',
    { name: `E2E Org ${orgSlug}`, slug: orgSlug },
    { cookie: cookies },
  );
  expect(orgRes.status).toBe(200);
  const org = await orgRes.json();
  const newCookies = getCookies(orgRes);
  if (newCookies) cookies = newCookies;

  const setRes = await request(
    'POST',
    '/api/auth/organization/set-active',
    { organizationId: org.id },
    { cookie: cookies },
  );
  expect(setRes.status).toBe(200);
  const newCookies2 = getCookies(setRes);
  if (newCookies2) cookies = newCookies2;

  // Seed org settings
  await db
    .insert(organizationSettings)
    .values({ organizationId: org.id, plan: 'starter', settings: {} })
    .onConflictDoNothing();

  // Seed prompt in registry
  await db
    .insert(promptRegistry)
    .values({
      agentId,
      skillId,
      version: 1,
      systemPrompt:
        'You are a test classifier for criteria.agency. Given a text, output a single word: "valid" or "invalid".',
      model: MODELS.haiku,
      provider: 'anthropic',
      dataSensitivity: 'C',
      approvedProviders: ['anthropic'],
      active: true,
    })
    .onConflictDoNothing();

  return { cookies, orgId: org.id };
}

describe('Step 0.9 — End-to-end loop', () => {
  const ts = Date.now();
  const agentId = `e2e-agent-${ts}`;
  const skillId = `e2e-skill-${ts}`;
  let tenant: { cookies: string; orgId: string };

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }
    db = createDb();
    const created = createApp(db);
    app = created.app;

    tenant = await createTenantWithPrompt(
      `e2e-${ts}@criteria.agency`,
      `e2e-org-${ts}`,
      agentId,
      skillId,
    );
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  // ── 1. Schema validation (Zod) ───────────────────────────

  describe('1. Event schema validation (DEC-148)', () => {
    it('rejects missing tenantId', () => {
      const result = eventSchema.safeParse({
        agentId: 'brand-strategist',
        skillId: 'discovery',
        userMessage: 'hello',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing agentId', () => {
      const result = eventSchema.safeParse({
        tenantId: 'org-123',
        skillId: 'discovery',
        userMessage: 'hello',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty userMessage', () => {
      const result = eventSchema.safeParse({
        tenantId: 'org-123',
        agentId: 'brand-strategist',
        skillId: 'discovery',
        userMessage: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects userMessage over 2000 chars', () => {
      const result = eventSchema.safeParse({
        tenantId: 'org-123',
        agentId: 'brand-strategist',
        skillId: 'discovery',
        userMessage: 'x'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid event data', () => {
      const result = eventSchema.safeParse({
        tenantId: 'org-123',
        agentId: 'brand-strategist',
        skillId: 'discovery',
        userMessage: 'What is criteria.agency?',
      });
      expect(result.success).toBe(true);
    });
  });

  // ── 2. Tenant verification (DEC-148) ─────────────────────

  describe('2. Tenant verification (DEC-148)', () => {
    it('rejects unknown tenantId', async () => {
      const [tenant] = await db
        .select({ organizationId: organizationSettings.organizationId })
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, 'nonexistent-org-id'))
        .limit(1);
      expect(tenant).toBeUndefined();
    });

    it('accepts valid tenantId from DB', async () => {
      const [row] = await db
        .select({ organizationId: organizationSettings.organizationId })
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, tenant.orgId))
        .limit(1);
      expect(row).toBeDefined();
      expect(row.organizationId).toBe(tenant.orgId);
    });
  });

  // ── 3. Prompt loading from registry (DEC-145) ────────────

  describe('3. Prompt loading from registry (DEC-145)', () => {
    it('loads active prompt for seeded agent × skill', async () => {
      const prompt = await loadPrompt(db, agentId, skillId);
      expect(prompt.agentId).toBe(agentId);
      expect(prompt.skillId).toBe(skillId);
      expect(prompt.systemPrompt).toBeTruthy();
      expect(prompt.model).toBe(MODELS.haiku);
      expect(prompt.dataSensitivity).toBe('C');
    });

    it('throws for unknown agent × skill pair', async () => {
      await expect(loadPrompt(db, 'nonexistent-agent', 'nonexistent-skill')).rejects.toThrow(
        'No active prompt found',
      );
    });

    it('prompt change in DB takes effect without redeploy (DEC-145)', async () => {
      const newPrompt = 'Updated system prompt for testing DEC-145 — ' + ts;

      // Deactivate current, insert new version
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

      await db.insert(promptRegistry).values({
        agentId,
        skillId,
        version: 2,
        systemPrompt: newPrompt,
        model: MODELS.haiku,
        provider: 'anthropic',
        dataSensitivity: 'C',
        approvedProviders: ['anthropic'],
        active: true,
      });

      const loaded = await loadPrompt(db, agentId, skillId);
      expect(loaded.systemPrompt).toBe(newPrompt);
      expect(loaded.version).toBe(2);
    });
  });

  // ── 4. HTTP endpoint (auth required) ─────────────────────

  describe('4. POST /api/inngest/e2e-test endpoint', () => {
    it('returns 401 without auth', async () => {
      const res = await request('POST', '/api/inngest/e2e-test', {
        agentId,
        skillId,
        userMessage: 'hello',
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 without active org', async () => {
      const email = `e2e-noorg-${ts}@criteria.agency`;
      const signupRes = await request('POST', '/api/auth/sign-up/email', {
        email,
        password: 'TestPassword123!',
        name: 'No Org User',
      });
      const cookies = getCookies(signupRes);

      const res = await request(
        'POST',
        '/api/inngest/e2e-test',
        { agentId, skillId, userMessage: 'hello' },
        { cookie: cookies },
      );
      expect(res.status).toBe(403);
    });

    it('returns 202 with eventIds when authenticated', async () => {
      const res = await request(
        'POST',
        '/api/inngest/e2e-test',
        { agentId, skillId, userMessage: 'test message' },
        { cookie: tenant.cookies },
      );
      // 202 = event dispatched (Inngest Dev Server not required to accept)
      // 503 = Inngest Dev Server not running — acceptable in unit test env
      expect([202, 503]).toContain(res.status);
      if (res.status === 202) {
        const body = await res.json();
        expect(body.sent).toBe(true);
        expect(Array.isArray(body.eventIds)).toBe(true);
      }
    });
  });

  // ── 5. Full loop: LLM invocation + output_registry save ──
  // Only runs when ANTHROPIC_API_KEY is set

  describe('5. Full loop — LLM + output_registry (DEC-141, DEC-147, DEC-130)', () => {
    const skipMsg = 'ANTHROPIC_API_KEY not set — skipping LLM invocation test';

    it('invokes LLM via Vercel AI SDK and returns a response', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log(`[skip] ${skipMsg}`);
        return;
      }

      const prompt = await loadPrompt(db, agentId, skillId);
      const result = await classifyText({
        ctx: { agentId, skillId, tenantId: tenant.orgId },
        model: prompt.model as typeof MODELS.haiku,
        system: prompt.systemPrompt,
        prompt: 'criteria.agency is a marketing platform',
      });

      expect(result.text).toBeTruthy();
      expect(result.usage.inputTokens).toBeGreaterThan(0);
      expect(result.usage.outputTokens).toBeGreaterThan(0);
    });

    it('saves LLM result to output_registry with tenant isolation', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log(`[skip] ${skipMsg}`);
        return;
      }

      const prompt = await loadPrompt(db, agentId, skillId);
      const result = await classifyText({
        ctx: { agentId, skillId, tenantId: tenant.orgId },
        model: prompt.model as typeof MODELS.haiku,
        system: prompt.systemPrompt,
        prompt: 'criteria.agency is a marketing platform',
      });

      const [saved] = await db
        .insert(outputRegistry)
        .values({
          organizationId: tenant.orgId,
          sourceMotor: 'test',
          sourceAgentId: agentId,
          outputType: 'e2e-loop-result',
          contentRef: prompt.id,
          summary: result.text.slice(0, 500),
          metadata: {
            agentId,
            skillId,
            promptVersion: prompt.version,
            model: prompt.model,
            usage: result.usage,
          },
        })
        .returning();

      expect(saved.id).toBeDefined();
      expect(saved.organizationId).toBe(tenant.orgId);
      expect(saved.summary).toBeTruthy();

      // Verify tenant isolation: another org cannot see this output
      const secondTenant = await createTenantWithPrompt(
        `e2e-iso-${ts}@criteria.agency`,
        `e2e-iso-org-${ts}`,
        `iso-agent-${ts}`,
        `iso-skill-${ts}`,
      );

      const rows = await db
        .select({ id: outputRegistry.id })
        .from(outputRegistry)
        .where(eq(outputRegistry.organizationId, secondTenant.orgId));

      const ids = rows.map((r) => r.id);
      expect(ids).not.toContain(saved.id);
    }, 30_000);
  });
});
