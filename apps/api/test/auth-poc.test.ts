/**
 * Better Auth POC — Step 0.3 validation
 *
 * Risk checkpoint: validates multi-org support with Hono + Drizzle.
 * If these tests fail fundamentally → pivot to Clerk (DEC-142).
 *
 * What we validate:
 * 1. User signup (email + password)
 * 2. User signin → session with HTTP-only cookie
 * 3. Create organization
 * 4. Session contains activeOrganizationId
 * 5. Invite member with role
 * 6. Role assignment works (owner, admin, editor, viewer)
 *
 * Requires: DATABASE_URL pointing to a test PostgreSQL instance.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb, type Database } from '@criteria/db';
import { createApp } from '../src/index.js';
import type { Hono } from 'hono';

let db: Database;
let app: Hono;
let auth: ReturnType<typeof createApp>['auth'];

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

// Helper: extract all Set-Cookie values as a single cookie header string
function getCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length > 0) {
    return raw.map((c: string) => c.split(';')[0]).join('; ');
  }
  const single = res.headers.get('set-cookie');
  if (single) return single.split(';')[0];
  return '';
}

describe('Better Auth POC — Step 0.3', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for auth POC tests');
    }

    db = createDb();
    const created = createApp(db);
    app = created.app;
    auth = created.auth;
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  const testUser = {
    email: `test-${Date.now()}@criteria.agency`,
    password: 'TestPassword123!',
    name: 'Juan Test',
  };
  let sessionCookies = '';

  it('1. can sign up a new user', async () => {
    const res = await request('POST', '/api/auth/sign-up/email', {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.name).toBe(testUser.name);
    expect(body.user.id).toBeDefined();

    sessionCookies = getCookies(res);
  });

  it('2. can sign in and get session cookie', async () => {
    const res = await request('POST', '/api/auth/sign-in/email', {
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    // Better Auth may return token at different levels depending on version
    expect(body.token ?? body.session?.token).toBeDefined();

    const newCookies = getCookies(res);
    if (newCookies) sessionCookies = newCookies;
    expect(sessionCookies).toBeTruthy();
  });

  it('3. can retrieve session from cookie', async () => {
    const res = await request('GET', '/api/auth/get-session', undefined, {
      cookie: sessionCookies,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    expect(body.session).toBeDefined();
  });

  let orgId: string;

  it('4. can create an organization', async () => {
    const res = await request(
      'POST',
      '/api/auth/organization/create',
      { name: 'Test Agency', slug: `test-agency-${Date.now()}` },
      { cookie: sessionCookies },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Test Agency');
    orgId = body.id;
  });

  it('5. can set active organization and session reflects it', async () => {
    const setRes = await request(
      'POST',
      '/api/auth/organization/set-active',
      { organizationId: orgId },
      { cookie: sessionCookies },
    );
    expect(setRes.status).toBe(200);

    // Update cookies after set-active (session may be refreshed)
    const newCookies = getCookies(setRes);
    if (newCookies) sessionCookies = newCookies;

    const res = await request('GET', '/api/auth/get-session', undefined, {
      cookie: sessionCookies,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.activeOrganizationId).toBe(orgId);
  });

  it('6. creator has owner role in active organization', async () => {
    const res = await request(
      'GET',
      `/api/auth/organization/get-full-organization?organizationId=${orgId}`,
      undefined,
      { cookie: sessionCookies },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toBeDefined();
    expect(body.members.length).toBeGreaterThanOrEqual(1);

    const ownerMember = body.members.find((m: { role: string }) => m.role === 'owner');
    expect(ownerMember).toBeDefined();
  });

  it('7. can invite member with admin role', async () => {
    const inviteeEmail = `invitee-${Date.now()}@criteria.agency`;
    const res = await request(
      'POST',
      '/api/auth/organization/invite-member',
      {
        email: inviteeEmail,
        role: 'admin',
        organizationId: orgId,
      },
      { cookie: sessionCookies },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.role).toBe('admin');
    expect(body.status).toBe('pending');
  });

  it('8. health endpoint unaffected (no auth regression)', async () => {
    const res = await request('GET', '/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
