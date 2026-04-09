import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { securityHeaders } from '../src/middleware/security-headers.js';

function createTestApp() {
  const app = new Hono();
  app.use('*', securityHeaders());
  app.get('/test', (c) => c.json({ ok: true }));
  return app;
}

describe('securityHeaders middleware', () => {
  it('sets Strict-Transport-Security header', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.headers.get('Strict-Transport-Security'))
      .toBe('max-age=63072000; includeSubDomains; preload');
  });

  it('sets X-Content-Type-Options to nosniff', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sets X-Frame-Options to DENY', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('sets Content-Security-Policy', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('sets Referrer-Policy', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.headers.get('Referrer-Policy'))
      .toBe('strict-origin-when-cross-origin');
  });

  it('sets Permissions-Policy', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.headers.get('Permissions-Policy'))
      .toBe('camera=(), microphone=(), geolocation=()');
  });

  it('removes X-Powered-By header', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.headers.get('X-Powered-By')).toBeNull();
  });
});
