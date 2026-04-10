/**
 * Step 0.5 validation — First tenant + seed data
 *
 * Validates:
 * 1. Can authenticate as test user, session contains correct orgId
 * 2. Authenticated request to protected route returns tenant-scoped data
 * 3. Cross-tenant isolation: org B cannot see org A's motors
 *
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb, type Database, organizationSettings, motors } from '@criteria/db';
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

/** Sign up + create org + set active → returns cookies and orgId */
async function createTenant(email: string, orgName: string, orgSlug: string) {
  // Sign up
  const signupRes = await request('POST', '/api/auth/sign-up/email', {
    email,
    password: 'TestPassword123!',
    name: 'Test User',
  });
  expect(signupRes.status).toBe(200);
  let cookies = getCookies(signupRes);

  // Create org
  const orgRes = await request(
    'POST',
    '/api/auth/organization/create',
    { name: orgName, slug: orgSlug },
    { cookie: cookies },
  );
  expect(orgRes.status).toBe(200);
  const org = await orgRes.json();
  const newCookies1 = getCookies(orgRes);
  if (newCookies1) cookies = newCookies1;

  // Set active org
  const setRes = await request(
    'POST',
    '/api/auth/organization/set-active',
    { organizationId: org.id },
    { cookie: cookies },
  );
  expect(setRes.status).toBe(200);
  const newCookies2 = getCookies(setRes);
  if (newCookies2) cookies = newCookies2;

  // Seed org settings + motor
  await db.insert(organizationSettings).values({
    organizationId: org.id,
    plan: 'starter',
    settings: {},
  }).onConflictDoNothing();

  await db.insert(motors).values({
    organizationId: org.id,
    motor: 'video',
    enabled: true,
    autonomyMode: 'ai_recommends',
    settings: {},
  }).onConflictDoNothing();

  return { cookies, orgId: org.id };
}

describe('Step 0.5 — First tenant + seed data', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }
    db = createDb();
    const created = createApp(db);
    app = created.app;
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  let tenantA: { cookies: string; orgId: string };
  let tenantB: { cookies: string; orgId: string };
  const ts = Date.now();

  it('creates tenant A with user, org, and motor config', async () => {
    tenantA = await createTenant(
      `tenantA-${ts}@criteria.agency`,
      'Tenant A Agency',
      `tenant-a-${ts}`,
    );
    expect(tenantA.orgId).toBeDefined();
    expect(tenantA.cookies).toBeTruthy();
  });

  it('tenant A session contains correct orgId', async () => {
    const res = await request('GET', '/api/auth/get-session', undefined, {
      cookie: tenantA.cookies,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.activeOrganizationId).toBe(tenantA.orgId);
  });

  it('tenant A can access protected motors route and see its data', async () => {
    const res = await request('GET', '/api/motors', undefined, {
      cookie: tenantA.cookies,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].motor).toBe('video');
    expect(body[0].organizationId).toBe(tenantA.orgId);
  });

  it('unauthenticated request to protected route returns 401', async () => {
    const res = await request('GET', '/api/motors');
    expect(res.status).toBe(401);
  });

  it('creates tenant B (separate org)', async () => {
    tenantB = await createTenant(
      `tenantB-${ts}@criteria.agency`,
      'Tenant B Agency',
      `tenant-b-${ts}`,
    );
    expect(tenantB.orgId).toBeDefined();
    expect(tenantB.orgId).not.toBe(tenantA.orgId);
  });

  it('tenant B cannot see tenant A motors (cross-tenant isolation)', async () => {
    const res = await request('GET', '/api/motors', undefined, {
      cookie: tenantB.cookies,
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // Tenant B has its own video motor, but should NOT see tenant A's
    const orgIds = body.map((m: { organizationId: string }) => m.organizationId);
    expect(orgIds).not.toContain(tenantA.orgId);
    // All returned motors belong to tenant B
    for (const m of body) {
      expect(m.organizationId).toBe(tenantB.orgId);
    }
  });
});
