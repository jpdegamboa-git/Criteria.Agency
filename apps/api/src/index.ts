import { Hono } from 'hono';
import { securityHeaders } from './middleware/security-headers.js';
import { healthRoute } from './routes/health.js';
import { logger } from './lib/logger.js';

const app = new Hono();

// Global middleware
app.use('*', securityHeaders());

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: ms,
  }, `${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
});

// Routes
app.route('/', healthRoute);

export { app };
