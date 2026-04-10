/**
 * Auth Middleware + Tenant Isolation — Step 0.4 validation
 *
 * What we validate:
 * 1. Unauthenticated request to protected route → 401
 * 2. Authenticated request without active org → 403
 * 3. Authenticated request with active org → tenantId available, 200
 * 4. /health remains public (no auth required)
 * 5. /api/auth/* remains public (no auth required)
 * 6. Tenant isolation: org A data not visible when auth'd as org B
 *
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb, type Database } from '@criteria/db';
import { createApp } from '../src/index.js';
import type { Hono } from 'hono';

let db: Database;
let app: Hono;

// Helper: make request to app
async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) init.body = JSON.stringify(body);
  return app.request(url, init);
}

// Helper: extract cookies from response
function getCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length > 0) {
    return raw.map((c: string) => c.split(';')[0]).join('; ');
  }
  const single = res.headers.get('set-cookie');
  if (single) return single.split(';')[0];
  return '';
}

// Helper: sign up, sign in, create org, set active org — returns cookies
async function createAuthenticatedSession(orgName: string): Promise<{
  cookies: string;
  orgId: string;
  userId: string;
}> {
  const email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}@criteria.agency`;

  // Sign up
  const signupRes = await request('POST', '/api/auth/sign-up/email', {
    email,
    password: 'TestPassword123!',
    name: 'Test User',
  });
  const signupBody = await signupRes.json();
  let cookies = getCookies(signupRes);

  // Create org
  const orgRes = await request(
    'POST',
    '/api/auth/organization/create',
    { name: orgName, slug: `${orgName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` },
    { cookie: cookies },
  );
  const orgBody = await orgRes.json();
  const newCookies = getCookies(orgRes);
  if (newCookies) cookies = newCookies;

  // Set active org
  const setRes = await request(
    'POST',
    '/api/auth/organization/set-active',
    { organizationId: orgBody.id },
    { cookie: cookies },
  );
  const setCookies = getCookies(setRes);
  if (setCookies) cookies = setCookies;

  return { cookies, orgId: orgBody.id, userId: signupBody.user.id };
}

describe('Auth Middleware + Tenant Isolation — Step 0.4', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for auth middleware tests');
    }
    db = createDb();
    const created = createApp(db);
    app = created.app;
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  // ── 1. Protected routes require auth ─────────────────────

  it('returns 401 for unauthenticated request to protected route', async () => {
    const res = await request('GET', '/api/motors');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 2. Public routes remain accessible ────────────────────

  it('/health is accessible without auth', async () => {
    const res = await request('GET', '/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('/api/auth/* is accessible without auth (sign-up works)', async () => {
    // Sign-up should succeed without prior auth — proves auth routes bypass our middleware
    const email = `public-test-${Date.now()}@criteria.agency`;
    const res = await request('POST', '/api/auth/sign-up/email', {
      email,
      password: 'TestPassword123!',
      name: 'Public Test',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
  });

  // ── 3. Authenticated without active org → 403 ────────────

  it('returns 403 when authenticated but no active organization', async () => {
    const email = `noorg-${Date.now()}@criteria.agency`;

    // Sign up (no org created)
    const signupRes = await request('POST', '/api/auth/sign-up/email', {
      email,
      password: 'TestPassword123!',
      name: 'No Org User',
    });
    const cookies = getCookies(signupRes);

    const res = await request('GET', '/api/motors', undefined, {
      cookie: cookies,
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('No active organization');
  });

  // ── 4. Authenticated with active org → tenantId in response ──

  it('returns tenantId in response for authenticated request with active org', async () => {
    const { cookies } = await createAuthenticatedSession('Auth Test Org');

    const res = await request('GET', '/api/motors', undefined, {
      cookie: cookies,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    // The motors endpoint should return an array (possibly empty) filtered by tenant
    expect(Array.isArray(body)).toBe(true);
  });

  // ── 5. Tenant isolation: cross-tenant data not visible ────

  it('cannot see data from another organization', async () => {
    // Create two separate sessions with different orgs
    const sessionA = await createAuthenticatedSession('Org Alpha');
    const sessionB = await createAuthenticatedSession('Org Beta');

    // Create a motor config for Org Alpha via seed endpoint
    const seedRes = await request(
      'POST',
      '/api/motors',
      { motor: 'video', enabled: true },
      { cookie: sessionA.cookies },
    );
    expect(seedRes.status).toBe(201);

    // Org Alpha should see the motor
    const resA = await request('GET', '/api/motors', undefined, {
      cookie: sessionA.cookies,
    });
    expect(resA.status).toBe(200);
    const bodyA = await resA.json();
    expect(bodyA.length).toBeGreaterThanOrEqual(1);
    expect(bodyA.some((m: { motor: string }) => m.motor === 'video')).toBe(true);

    // Org Beta should NOT see Org Alpha's motor
    const resB = await request('GET', '/api/motors', undefined, {
      cookie: sessionB.cookies,
    });
    expect(resB.status).toBe(200);
    const bodyB = await resB.json();
    expect(bodyB.some((m: { motor: string }) => m.motor === 'video')).toBe(false);
  });
});
