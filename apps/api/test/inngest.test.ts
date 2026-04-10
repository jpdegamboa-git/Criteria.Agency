/**
 * Inngest setup — Step 0.6 validation
 *
 * What we validate:
 * 1. Inngest serve handler registers and responds (GET /api/inngest)
 * 2. Function count matches expected (1 function registered)
 * 3. Test event dispatch endpoint requires auth (POST /api/inngest/test → 401)
 * 4. Authenticated dispatch constructs correct payload
 *
 * Note: Full event delivery (send → Dev Server → function execution) requires
 * the Inngest Dev Server running (`npx inngest-cli@latest dev`).
 * These tests validate wiring only — no running Dev Server needed.
 *
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb, type Database } from '@criteria/db';
import { createApp } from '../src/index.js';
import type { Hono } from 'hono';

let db: Database;
let app: Hono;

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

describe('Inngest setup — Step 0.6', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for Inngest tests');
    }
    db = createDb();
    const created = createApp(db);
    app = created.app;
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  it('GET /api/inngest returns introspection with function count', async () => {
    const res = await request('GET', '/api/inngest');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.function_count).toBe(15); // Fase 0-6: +mara-session-summary
    expect(body.mode).toBe('dev');
  });

  it('POST /api/inngest/test returns 401 without auth', async () => {
    const res = await request('POST', '/api/inngest/test', { message: 'hello' });
    expect(res.status).toBe(401);
  });

  it('POST /api/inngest/test returns 403 without active org', async () => {
    const email = `inngest-noorg-${Date.now()}@criteria.agency`;
    const signupRes = await request('POST', '/api/auth/sign-up/email', {
      email,
      password: 'TestPassword123!',
      name: 'No Org User',
    });
    const cookies = getCookies(signupRes);

    const res = await request('POST', '/api/inngest/test', { message: 'hello' }, {
      cookie: cookies,
    });
    expect(res.status).toBe(403);
  });
});
