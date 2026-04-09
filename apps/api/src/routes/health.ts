import { Hono } from 'hono';

export const healthRoute = new Hono();

// Security Framework §4.5: "MUST NOT expose system info (only { status: ok })"
healthRoute.get('/health', (c) => {
  return c.json({ status: 'ok' });
});
