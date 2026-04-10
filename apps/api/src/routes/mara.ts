/**
 * MARA routes — Fase 6
 *
 * POST /api/mara/session          — start a new session (or resume active)
 * DELETE /api/mara/session/:id    — end session (triggers summary via Inngest)
 * POST /api/mara/chat             — send a message (main MARA endpoint)
 * GET  /api/mara/session/:id      — get session state + messages
 * GET  /api/mara/play-pause       — get current play/pause state
 * PUT  /api/mara/play-pause       — toggle play/pause mode
 *
 * All routes: tenant isolation via authenticated session (DEC-148).
 * Play/pause enforced server-side (DEC-158) — not UI-only.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, desc, outputRegistry, organizationSettings } from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { inngest } from '../inngest/client.js';
import { logger } from '../lib/logger.js';
import {
  classifyIntent,
  composeResponse,
  createSession,
  getActiveSession,
  loadPreviousSessionSummary,
  saveMessage,
  getSessionMessages,
  getPlayPauseState,
  togglePlayMode,
  checkInvocationAllowed,
  recordInvocation,
  getPauseModeMessage,
  FREE_INTENTS,
  REGISTRY_FIRST_INTENTS,
} from '../lib/mara/index.js';
import { checkSafety, truncateHistory } from '../lib/mara/safety-classifier.js';
import { searchOutputs } from '../lib/analyst/output-registry.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const startSessionSchema = z.object({
  uiContext: z.record(z.string(), z.unknown()).optional(),
});

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  uiContext: z.record(z.string(), z.unknown()).optional(),
});

const toggleSchema = z.object({
  playMode: z.boolean(),
});

// ── Router factory ────────────────────────────────────────────────────────────

export function createMaraRoutes(db: Database) {
  const app = new Hono();

  // ── GET /api/mara/play-pause ──────────────────────────────────────────────
  app.get('/play-pause', async (c) => {
    const { tenantId } = getAuthContext(c);
    const state = await getPlayPauseState(db, tenantId);
    return c.json(state);
  });

  // ── PUT /api/mara/play-pause ──────────────────────────────────────────────
  app.put('/play-pause', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = toggleSchema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: body.error.message }, 400);

    const state = await togglePlayMode(db, tenantId, body.data.playMode);
    logger.info({ tenantId, playMode: body.data.playMode }, 'MARA play/pause toggled');
    return c.json(state);
  });

  // ── POST /api/mara/session ────────────────────────────────────────────────
  app.post('/session', async (c) => {
    const { tenantId, userId } = getAuthContext(c);
    const body = startSessionSchema.safeParse(await c.req.json().catch(() => ({})));
    const uiContext = body.success ? (body.data.uiContext ?? {}) : {};

    // Check for existing active session
    const existing = await getActiveSession(db, tenantId, userId);
    if (existing) {
      return c.json({ session: existing, resumed: true });
    }

    // Load previous session summary for cross-session context (DEC-133)
    const previousSummary = await loadPreviousSessionSummary(db, tenantId, userId);

    const session = await createSession({ db, tenantId, userId, uiContext });

    // Compose MARA's opening message if there's a previous summary
    let openingMessage: string | undefined;
    if (previousSummary) {
      openingMessage = `¡Hola de nuevo! Desde la última vez: ${previousSummary.summary.split('.')[0]}.`;
    }

    return c.json({ session, resumed: false, openingMessage, previousSummary });
  });

  // ── GET /api/mara/session/:id ─────────────────────────────────────────────
  app.get('/session/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const sessionId = c.req.param('id');

    const messages = await getSessionMessages(db, sessionId);
    const state = await getPlayPauseState(db, tenantId);

    return c.json({ messages, playPauseState: state });
  });

  // ── DELETE /api/mara/session/:id ─────────────────────────────────────────
  app.delete('/session/:id', async (c) => {
    const { tenantId } = getAuthContext(c);
    const sessionId = c.req.param('id');

    // Trigger async session summary via Inngest (DEC-133)
    // Non-blocking — if Inngest is unavailable (dev/test), log and continue
    inngest.send({
      name: 'mara/session.end',
      data: { tenantId, sessionId, reason: 'manual' },
    }).catch((err: unknown) => {
      logger.warn({ err, tenantId, sessionId }, 'Failed to queue MARA session summary — Inngest unavailable');
    });

    return c.json({ queued: true, sessionId });
  });

  // ── POST /api/mara/chat ───────────────────────────────────────────────────
  app.post('/chat', async (c) => {
    const { tenantId, userId } = getAuthContext(c);
    const body = chatSchema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: body.error.message }, 400);

    const { sessionId, message, uiContext = {} } = body.data;

    // Get client tier for response calibration
    const [orgSettings] = await db
      .select({ plan: organizationSettings.plan })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, tenantId))
      .limit(1);
    const clientTier = (orgSettings?.plan ?? 'starter') as 'starter' | 'pro' | 'agency';

    // ── Step 0: Safety check (DEC-155, P1-7) ───────────────────────────────
    const safetyResult = await checkSafety(message, db, tenantId);
    if (!safetyResult.safe) {
      logger.warn({ tenantId, sessionId, reason: safetyResult.reason }, 'MARA safety check blocked message');
      return c.json({
        response: safetyResult.refusal ?? 'No puedo procesar esa solicitud.',
        intent: { category: 'navigation', confidence: 'high', requiresTokens: false, rationale: 'safety_block' },
        blocked: true,
        blockedReason: safetyResult.reason,
      });
    }

    // Load conversation history for context (with size limits — DEC-155)
    const history = await getSessionMessages(db, sessionId);
    const rawHistory = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    const conversationHistory = truncateHistory(rawHistory);

    // Save user message
    await saveMessage({
      db,
      sessionId,
      tenantId,
      role: 'user',
      content: message,
      uiContext,
    });

    // ── Step 1: Classify intent ─────────────────────────────────────────────
    // Graceful fallback if no prompt in registry (dev/test environments)
    let intent: Awaited<ReturnType<typeof classifyIntent>>;
    try {
      intent = await classifyIntent({
        db,
        tenantId,
        userMessage: message,
        uiContext,
        conversationHistory,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ tenantId, err: msg }, 'Intent classification failed — falling back to navigation');
      intent = {
        category: 'navigation' as const,
        confidence: 'low' as const,
        requiresTokens: false,
        rationale: 'Fallback: classification unavailable',
      };
    }

    logger.info(
      { tenantId, sessionId, category: intent.category, confidence: intent.confidence },
      'MARA intent classified',
    );

    let responseText: string;
    let routedTo: string | undefined;
    let outputRegistryHit = false;
    let tokensConsumed = 0;

    // ── Step 2: Check if free or requires tokens ────────────────────────────

    const isFree = FREE_INTENTS.includes(intent.category);

    if (!isFree) {
      // Check play mode + budget (DEC-157, DEC-158)
      const budgetCheck = await checkInvocationAllowed(db, tenantId, sessionId);

      if (!budgetCheck.allowed) {
        const pauseMsg = getPauseModeMessage(
          budgetCheck.blockedReason as 'pause_mode' | 'session_budget_exhausted',
        );

        await saveMessage({
          db,
          sessionId,
          tenantId,
          role: 'assistant',
          content: pauseMsg,
          intentCategory: intent.category,
          routedTo: undefined,
          outputRegistryHit: false,
          tokensConsumed: 0,
          uiContext,
        });

        return c.json({
          response: pauseMsg,
          intent,
          blocked: true,
          blockedReason: budgetCheck.blockedReason,
        });
      }
    }

    // ── Step 3: Check Output Registry first for registry-first intents ──────

    if (REGISTRY_FIRST_INTENTS.includes(intent.category)) {
      try {
        const registryResults = await searchOutputs(db, tenantId, message, { limit: 1 });
        if (registryResults.length > 0) {
          const topResult = registryResults[0];
          outputRegistryHit = true;
          routedTo = 'output_registry';

          const composed = await composeResponse({
            db,
            tenantId,
            userMessage: message,
            agentOutput: topResult.summary,
            source: `output_registry:${topResult.sourceMotor}`,
            intentCategory: intent.category,
            fromOutputRegistry: true,
            clientTier,
            conversationHistory,
          });

          responseText = composed.message;
        } else {
          // Cache miss — will fall through to agent invocation below
          responseText = '';
        }
      } catch {
        responseText = '';
      }
    } else {
      responseText = '';
    }

    // ── Step 4: Handle free intents (data_lookup, navigation) ───────────────

    if (!responseText && isFree) {
      routedTo = intent.category === 'navigation' ? 'system' : 'analyst_system';
      responseText =
        intent.category === 'navigation'
          ? 'Claro, te ayudo a navegar. ¿A qué sección quieres ir?'
          : 'Consultando tus datos...'; // Real implementation would call Analyst system functions
    }

    // ── Step 5: Handle paid intents that need agent invocation ───────────────
    // (Output Registry miss for interpretation/strategic_decision, or brand/operational actions)

    if (!responseText && !isFree) {
      // Route to appropriate agent
      const agentMessage = getAgentPlaceholderResponse(intent.category);
      routedTo = getAgentForIntent(intent.category);

      const composed = await composeResponse({
        db,
        tenantId,
        userMessage: message,
        agentOutput: agentMessage,
        source: routedTo,
        intentCategory: intent.category,
        fromOutputRegistry: false,
        clientTier,
        conversationHistory,
      });

      responseText = composed.message;

      // Record paid invocation (DEC-157)
      await recordInvocation(db, tenantId, sessionId);
      tokensConsumed = 1; // approximation — real cost tracked via Langfuse
    }

    // ── Step 6: Save assistant message ──────────────────────────────────────

    await saveMessage({
      db,
      sessionId,
      tenantId,
      role: 'assistant',
      content: responseText,
      intentCategory: intent.category,
      routedTo,
      outputRegistryHit,
      tokensConsumed,
      uiContext,
    });

    return c.json({
      response: responseText,
      intent,
      routedTo,
      outputRegistryHit,
      tokensConsumed,
    });
  });

  return app;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAgentForIntent(category: string): string {
  switch (category) {
    case 'interpretation':
      return 'analyst';
    case 'strategic_decision':
      return 'strategist';
    case 'brand_action':
      return 'brand-builder';
    case 'operational_action':
      return 'web-motor';
    default:
      return 'system';
  }
}

function getAgentPlaceholderResponse(category: string): string {
  switch (category) {
    case 'interpretation':
      return 'Analizando el rendimiento de tus campañas...';
    case 'strategic_decision':
      return 'Revisando tu estrategia de marketing actual...';
    case 'brand_action':
      return 'Accediendo al constructor de marca...';
    case 'operational_action':
      return 'Iniciando flujo de trabajo operacional...';
    default:
      return 'Procesando tu solicitud...';
  }
}
