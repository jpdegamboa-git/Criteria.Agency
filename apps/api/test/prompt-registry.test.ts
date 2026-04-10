/**
 * Prompt Registry — Step 0.8 validation
 *
 * What we validate:
 * 1. CRUD endpoints: create, read, update, delete (via API)
 * 2. Auto-versioning: POST deactivates previous, creates new version
 * 3. Prompt loaded from registry → not hardcoded (DEC-145)
 * 4. Prompt change in DB takes effect without redeploy (DEC-145)
 * 5. Level 1 security — Tier enforcement (DEC-149, DEC-225):
 *    - Tier A prompt + Tier B/C provider → assertTierAllowed throws
 *    - Tier B prompt + Tier B provider → allowed
 *    - Tier C prompt + any provider → allowed
 * 6. Auth required for all endpoints
 *
 * Requires: DATABASE_URL
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb, type Database } from '@criteria/db';
import { createApp } from '../src/index.js';
import { loadPrompt } from '../src/lib/prompt-loader.js';
import { assertTierAllowed } from '../src/lib/ai.js';
import type { Hono } from 'hono';

let db: Database;
let app: Hono;
let sessionCookies: string;

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
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

describe('Prompt Registry — Step 0.8', () => {
  const ts = Date.now();

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
    db = createDb();
    const created = createApp(db);
    app = created.app;

    // Create authenticated session with active org
    const signupRes = await request('POST', '/api/auth/sign-up/email', {
      email: `prompts-${ts}@criteria.agency`,
      password: 'TestPassword123!',
      name: 'Prompt Test User',
    });
    let cookies = getCookies(signupRes);

    const orgRes = await request(
      'POST', '/api/auth/organization/create',
      { name: 'Prompt Test Org', slug: `prompt-test-${ts}` },
      { cookie: cookies },
    );
    const newCookies = getCookies(orgRes);
    if (newCookies) cookies = newCookies;

    const org = await orgRes.json();
    const setRes = await request(
      'POST', '/api/auth/organization/set-active',
      { organizationId: org.id },
      { cookie: cookies },
    );
    const setCookies = getCookies(setRes);
    if (setCookies) cookies = setCookies;
    sessionCookies = cookies;
  }, 30_000);

  afterAll(async () => { await db.close(); });

  // ── 1. Auth required ─────────────────────────────────────

  it('GET /api/prompts returns 401 without auth', async () => {
    const res = await request('GET', '/api/prompts');
    expect(res.status).toBe(401);
  });

  it('POST /api/prompts returns 401 without auth', async () => {
    const res = await request('POST', '/api/prompts', {
      agentId: 'test', skillId: 'test', systemPrompt: 'test', model: 'haiku', provider: 'anthropic',
    });
    expect(res.status).toBe(401);
  });

  // ── 2. CRUD ──────────────────────────────────────────────

  let promptId: string;
  const agentId = `test-agent-${ts}`;
  const skillId = `test-skill-${ts}`;

  it('POST /api/prompts — creates prompt with version 1', async () => {
    const res = await request('POST', '/api/prompts', {
      agentId,
      skillId,
      systemPrompt: 'You are a test agent. Version 1.',
      model: 'claude-haiku-4-5-20251001',
      provider: 'anthropic',
      dataSensitivity: 'A',
      approvedProviders: ['anthropic'],
    }, { cookie: sessionCookies });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.agentId).toBe(agentId);
    expect(body.skillId).toBe(skillId);
    expect(body.version).toBe(1);
    expect(body.active).toBe(true);
    expect(body.dataSensitivity).toBe('A');
    promptId = body.id;
  });

  it('GET /api/prompts/:agentId/:skillId — returns active prompt', async () => {
    const res = await request('GET', `/api/prompts/${agentId}/${skillId}`, undefined, {
      cookie: sessionCookies,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(1);
    expect(body.active).toBe(true);
  });

  it('GET /api/prompts — lists active prompts (includes ours)', async () => {
    const res = await request('GET', '/api/prompts', undefined, { cookie: sessionCookies });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    const ours = body.find((p: { agentId: string }) => p.agentId === agentId);
    expect(ours).toBeDefined();
  });

  // ── 3. Auto-versioning (DEC-145) ─────────────────────────

  it('POST /api/prompts again — creates version 2, deactivates version 1', async () => {
    const res = await request('POST', '/api/prompts', {
      agentId,
      skillId,
      systemPrompt: 'You are a test agent. Version 2 — updated.',
      model: 'claude-haiku-4-5-20251001',
      provider: 'anthropic',
      dataSensitivity: 'A',
      approvedProviders: ['anthropic'],
    }, { cookie: sessionCookies });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.version).toBe(2);
    expect(body.active).toBe(true);
  });

  it('loadPrompt() returns version 2 — change took effect without redeploy (DEC-145)', async () => {
    const prompt = await loadPrompt(db, agentId, skillId);
    expect(prompt.version).toBe(2);
    expect(prompt.systemPrompt).toContain('Version 2');
    expect(prompt.agentId).toBe(agentId);
  });

  it('GET /api/prompts/:agentId/:skillId — returns only version 2 (active)', async () => {
    const res = await request('GET', `/api/prompts/${agentId}/${skillId}`, undefined, {
      cookie: sessionCookies,
    });
    const body = await res.json();
    expect(body.version).toBe(2);
  });

  it('DELETE /api/prompts/:id — soft-deletes prompt', async () => {
    // Get current active prompt id
    const getRes = await request('GET', `/api/prompts/${agentId}/${skillId}`, undefined, {
      cookie: sessionCookies,
    });
    const { id } = await getRes.json();

    const res = await request('DELETE', `/api/prompts/${id}`, undefined, {
      cookie: sessionCookies,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deactivated).toBe(true);

    // Now GET should 404
    const check = await request('GET', `/api/prompts/${agentId}/${skillId}`, undefined, {
      cookie: sessionCookies,
    });
    expect(check.status).toBe(404);
  });

  // ── 4. loadPrompt throws for unknown pair ─────────────────

  it('loadPrompt() throws for unknown agent × skill', async () => {
    await expect(loadPrompt(db, 'nonexistent-agent', 'nonexistent-skill')).rejects.toThrow(
      'No active prompt found',
    );
  });

  // ── 5. Level 1 security — Tier enforcement (DEC-149) ─────

  describe('Tier enforcement — assertTierAllowed() (DEC-149, DEC-225)', () => {
    it('Tier A prompt + anthropic provider → allowed', () => {
      expect(() => assertTierAllowed('A', 'anthropic')).not.toThrow();
    });

    it('Tier A prompt + openai provider → throws (DEC-149)', () => {
      expect(() => assertTierAllowed('A', 'openai')).toThrow('DEC-149 tier violation');
    });

    it('Tier A prompt + google provider → throws (DEC-149)', () => {
      expect(() => assertTierAllowed('A', 'google')).toThrow('DEC-149 tier violation');
    });

    it('Tier A prompt + unknown provider → throws (DEC-149)', () => {
      expect(() => assertTierAllowed('A', 'some-unknown-provider')).toThrow('DEC-149 tier violation');
    });

    it('Tier B prompt + anthropic provider → allowed', () => {
      expect(() => assertTierAllowed('B', 'anthropic')).not.toThrow();
    });

    it('Tier B prompt + openai provider → allowed', () => {
      expect(() => assertTierAllowed('B', 'openai')).not.toThrow();
    });

    it('Tier B prompt + unknown/Tier C provider → throws', () => {
      expect(() => assertTierAllowed('B', 'some-tier-c-provider')).toThrow('DEC-149 tier violation');
    });

    it('Tier C prompt + any provider → allowed', () => {
      expect(() => assertTierAllowed('C', 'anthropic')).not.toThrow();
      expect(() => assertTierAllowed('C', 'openai')).not.toThrow();
      expect(() => assertTierAllowed('C', 'anything')).not.toThrow();
    });
  });
});
