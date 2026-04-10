import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve as serveInngest } from 'inngest/hono';
import { securityHeaders } from './middleware/security-headers.js';
import { authMiddleware, getAuthContext } from './middleware/auth.js';
import { apiRateLimit, authRateLimit, maraRateLimit } from './middleware/rate-limiter.js';
import { sanitizeErrorForClient } from './lib/log-sanitizer.js';
import { healthRoute } from './routes/health.js';
import { createMotorsRoute } from './routes/motors.js';
import { createAiTestRoute } from './routes/ai-test.js';
import { createPromptRegistryRoute } from './routes/prompt-registry.js';
import { createAuth } from './lib/auth.js';
import {
  inngest,
  createTestHelloWorldFn,
  createE2eLoopFn,
  createLayer0OnboardingFn,
  createLayer1DiscoveryFn,
  createLayer2StrategicDepthFn,
  createLayer3IdentitySystemsFn,
  createVideoMotorPipelineFn,
  createWebMotorPipelineFn,
  createWebMotorBlogPostFn,
  createBhsDailyFn,
  createThresholdCheckFn,
  createStrategistDiagnosticFn,
  createStrategistPlanningFn,
  createStrategistCampaignDesignFn,
  createMaraSessionSummaryFn,
} from './inngest/index.js';
import { createBrandBuilderRoute } from './routes/brand-builder.js';
import { createLegalRoute } from './routes/legal.js';
import { createVideoMotorRoute } from './routes/video-motor.js';
import { createWebMotorRoute } from './routes/web-motor.js';
import { createAnalystRoute } from './routes/analyst.js';
import { createStrategistRoute } from './routes/strategist.js';
import { createMaraRoutes } from './routes/mara.js';
import { createSseRoute } from './routes/sse.js';
import { type Database } from '@criteria/db';
import { logger } from './lib/logger.js';

/**
 * Create the Hono app with auth + Inngest wired up.
 * Accepts db externally for testability.
 */
export function createApp(db: Database) {
  const auth = createAuth(db);
  const app = new Hono();

  // ── Inngest functions (instantiate with db) ───────────────
  const inngestFunctions = [
    createTestHelloWorldFn(db),
    createE2eLoopFn(db),
    createLayer0OnboardingFn(db),
    createLayer1DiscoveryFn(db),
    createLayer2StrategicDepthFn(db),
    createLayer3IdentitySystemsFn(db),
    createVideoMotorPipelineFn(db),
    // Fase 2: Web Motor
    createWebMotorPipelineFn(db),
    createWebMotorBlogPostFn(db),
    // Fase 3: Analyst system functions
    createBhsDailyFn(db),
    createThresholdCheckFn(db),
    // Fase 4: Strategist motor
    createStrategistDiagnosticFn(db),
    createStrategistPlanningFn(db),
    createStrategistCampaignDesignFn(db),
    // Fase 6: MARA
    createMaraSessionSummaryFn(db),
  ];

  // Global middleware
  app.use('*', securityHeaders());

  // Global error handler — never expose stack traces to clients (Step 7.1, P1-5)
  app.onError((err, c) => {
    logger.error({ err }, 'Unhandled API error');
    return c.json(sanitizeErrorForClient(err), 500);
  });

  // CORS — restrictive, never wildcard (Security Framework §4.2, P1-2)
  const allowedOrigins = [
    process.env.APP_URL ?? 'http://localhost:3000',
    process.env.ADMIN_URL ?? 'http://localhost:3000',
    process.env.PORTAL_URL ?? 'http://localhost:3002',
  ].filter(Boolean);

  const corsMiddleware = cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.use('/api/*', corsMiddleware);

  // General API rate limiting — 60 req/min per IP (Step 7.2)
  app.use('/api/*', apiRateLimit());

  // Auth routes: stricter limit — 10 req/min per IP (brute force prevention)
  app.use('/api/auth/*', authRateLimit());

  // Request logging
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

  // ── Public routes (no auth required) ──────────────────────
  app.route('/', healthRoute);

  // Legal documents — public, no auth (Step 7.6)
  app.route('/api/legal', createLegalRoute());

  // Better Auth handler — handles all /api/auth/* routes (public)
  app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    return auth.handler(c.req.raw);
  });

  // Inngest serve handler — receives webhooks from Inngest (DEC-148: signature verification)
  const inngestHandler = serveInngest({
    client: inngest,
    functions: inngestFunctions,
  });
  app.on(['GET', 'POST', 'PUT'], '/api/inngest', inngestHandler);

  // ── Protected API routes (auth middleware enforced) ────────
  // Group all protected routes under a sub-app with auth middleware
  const protectedApi = new Hono();
  protectedApi.use('*', authMiddleware(auth));
  protectedApi.route('/motors', createMotorsRoute(db));
  protectedApi.route('/ai', createAiTestRoute(db));
  protectedApi.route('/prompts', createPromptRegistryRoute(db));
  protectedApi.route('/brand-builder', createBrandBuilderRoute(db));
  protectedApi.route('/video-motor', createVideoMotorRoute(db));
  protectedApi.route('/web-motor', createWebMotorRoute(db));
  protectedApi.route('/analyst', createAnalystRoute(db));
  protectedApi.route('/strategist', createStrategistRoute(db));
  // MARA chat: tighter rate limit (30 req/min per user) on top of general limit
  protectedApi.use('/mara/chat', maraRateLimit());
  protectedApi.route('/mara', createMaraRoutes(db));
  protectedApi.route('/sse', createSseRoute(db));

  // Dispatch test event (protected — only authenticated users can trigger)
  protectedApi.post('/inngest/test', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json<{ message?: string }>();

    try {
      const { ids } = await inngest.send({
        name: 'test/hello.world',
        data: {
          tenantId,
          message: body.message ?? 'hello from criteria.agency',
        },
      });

      return c.json({ sent: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err }, 'Failed to send Inngest event');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // Step 0.9 — End-to-end loop trigger (protected)
  // Dispatches test/e2e.loop which runs the full stack:
  // validate schema → verify tenant → load prompt → invoke LLM → save to output_registry
  protectedApi.post('/inngest/e2e-test', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json<{ agentId?: string; skillId?: string; userMessage?: string }>();

    try {
      const { ids } = await inngest.send({
        name: 'test/e2e.loop',
        data: {
          tenantId,
          agentId: body.agentId ?? 'brand-strategist',
          skillId: body.skillId ?? 'discovery',
          userMessage: body.userMessage ?? 'What is criteria.agency?',
        },
      });

      return c.json({ sent: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err }, 'Failed to send e2e loop event');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  app.route('/api', protectedApi);

  return { app, auth, inngest };
}
