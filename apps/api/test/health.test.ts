import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { healthRoute } from '../src/routes/health.js';
import { securityHeaders } from '../src/middleware/security-headers.js';

function createTestApp() {
  const app = new Hono();
  app.use('*', securityHeaders());
  app.route('/', healthRoute);
  return app;
}

describe('GET /health', () => {
  it('returns 200', async () => {
    const app = createTestApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
  });

  it('returns { status: "ok" } — no system info per §4.5', async () => {
    const app = createTestApp();
    const res = await app.request('/health');
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
    expect(Object.keys(body)).toEqual(['status']);
  });

  it('includes security headers', async () => {
    const app = createTestApp();
    const res = await app.request('/health');
    expect(res.headers.get('Strict-Transport-Security')).toBeTruthy();
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('returns application/json content type', async () => {
    const app = createTestApp();
    const res = await app.request('/health');
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});
