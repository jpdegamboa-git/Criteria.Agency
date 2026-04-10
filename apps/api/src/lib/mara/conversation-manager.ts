/**
 * MARA — Conversation Management skill (DEC-128, DEC-133)
 *
 * "What's the context?"
 *
 * Manages conversational continuity within and across sessions.
 *
 * Within session: messages stored as mara_messages, full history available.
 * Across sessions (DEC-133): session summary model — when session ends,
 * MARA generates a lightweight summary (topics, decisions, pending actions,
 * client sentiment). Free — internal maintenance (DEC-132).
 *
 * On next session open, the most recent summary is loaded as context.
 *
 * Per-session invocation budget: 5 paid invocations max (DEC-157).
 * Session ends on inactivity timeout (configurable) or explicit logout.
 *
 * Model for summary generation: Haiku (DEC-174 — it's internal, not client-facing).
 * Tier A (Anthropic only — DEC-149).
 */

import { eq, and, desc } from 'drizzle-orm';
import { maraSessions, maraMessages } from '@criteria/db';
import type { Database } from '@criteria/db';
import { classifyText, MODELS } from '../ai.js';
import { loadPrompt } from '../prompt-loader.js';
import type { IntentCategory } from './intent-classifier.js';

// ── Session management ────────────────────────────────────────────────────────

export interface CreateSessionOptions {
  db: Database;
  tenantId: string;
  userId: string;
  uiContext?: Record<string, unknown>;
}

export async function createSession(opts: CreateSessionOptions) {
  const { db, tenantId, userId, uiContext = {} } = opts;

  const [session] = await db
    .insert(maraSessions)
    .values({
      organizationId: tenantId,
      userId,
      status: 'active',
      invocationsUsed: 0,
      uiContext,
    })
    .returning();

  return session;
}

export async function getActiveSession(db: Database, tenantId: string, userId: string) {
  const [session] = await db
    .select()
    .from(maraSessions)
    .where(
      and(
        eq(maraSessions.organizationId, tenantId),
        eq(maraSessions.userId, userId),
        eq(maraSessions.status, 'active'),
      ),
    )
    .orderBy(desc(maraSessions.startedAt))
    .limit(1);

  return session ?? null;
}

/** Load the most recent ended session's summary for cross-session context (DEC-133) */
export async function loadPreviousSessionSummary(
  db: Database,
  tenantId: string,
  userId: string,
): Promise<{ summary: string; summaryMeta: Record<string, unknown> } | null> {
  const [prev] = await db
    .select({
      summary: maraSessions.summary,
      summaryMeta: maraSessions.summaryMeta,
    })
    .from(maraSessions)
    .where(
      and(
        eq(maraSessions.organizationId, tenantId),
        eq(maraSessions.userId, userId),
        eq(maraSessions.status, 'ended'),
      ),
    )
    .orderBy(desc(maraSessions.startedAt))
    .limit(1);

  if (!prev || !prev.summary) return null;
  return {
    summary: prev.summary,
    summaryMeta: (prev.summaryMeta as Record<string, unknown>) ?? {},
  };
}

// ── Message persistence ───────────────────────────────────────────────────────

export interface SaveMessageOptions {
  db: Database;
  sessionId: string;
  tenantId: string;
  role: 'user' | 'assistant';
  content: string;
  intentCategory?: IntentCategory;
  routedTo?: string;
  outputRegistryHit?: boolean;
  tokensConsumed?: number;
  uiContext?: Record<string, unknown>;
}

export async function saveMessage(opts: SaveMessageOptions) {
  const {
    db,
    sessionId,
    tenantId,
    role,
    content,
    intentCategory,
    routedTo,
    outputRegistryHit = false,
    tokensConsumed = 0,
    uiContext = {},
  } = opts;

  const [message] = await db
    .insert(maraMessages)
    .values({
      sessionId,
      organizationId: tenantId,
      role,
      content,
      intentCategory,
      routedTo,
      outputRegistryHit,
      tokensConsumed,
      uiContext,
    })
    .returning();

  return message;
}

export async function getSessionMessages(db: Database, sessionId: string) {
  return db
    .select()
    .from(maraMessages)
    .where(eq(maraMessages.sessionId, sessionId))
    .orderBy(maraMessages.createdAt);
}

// ── Session summary (DEC-133) ─────────────────────────────────────────────────

export interface EndSessionOptions {
  db: Database;
  tenantId: string;
  sessionId: string;
  /** If true, generate a summary before marking the session as ended */
  generateSummary?: boolean;
}

export async function endSession(opts: EndSessionOptions) {
  const { db, tenantId, sessionId, generateSummary = true } = opts;

  let summary: string | undefined;
  let summaryMeta: Record<string, unknown> = {};

  if (generateSummary) {
    const messages = await getSessionMessages(db, sessionId);
    if (messages.length > 0) {
      const result = await generateSessionSummary({
        db,
        tenantId,
        sessionId,
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });
      summary = result.summary;
      summaryMeta = result.meta;
    }
  }

  const [updated] = await db
    .update(maraSessions)
    .set({
      status: 'ended',
      endedAt: new Date(),
      summary,
      summaryMeta,
    })
    .where(
      and(eq(maraSessions.id, sessionId), eq(maraSessions.organizationId, tenantId)),
    )
    .returning();

  return updated;
}

async function generateSessionSummary(opts: {
  db: Database;
  tenantId: string;
  sessionId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  const { db, tenantId, messages } = opts;

  const promptConfig = await loadPrompt(db, 'mara', 'conversation-management');

  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'Cliente' : 'MARA'}: ${m.content}`)
    .join('\n');

  const prompt = `Conversación a resumir:

${conversation}

Genera un resumen de sesión en JSON:
{
  "summary": "<resumen de 1-2 párrafos en español: temas discutidos, decisiones, acciones pendientes, tono del cliente>",
  "topics": ["<tema 1>", "<tema 2>"],
  "decisions": ["<decisión tomada 1>"],
  "pendingActions": ["<acción pendiente 1>"],
  "clientSentiment": "<satisfecho | neutro | preocupado | frustrado>"
}`;

  const result = await classifyText({
    ctx: { agentId: 'mara', skillId: 'conversation-management', tenantId },
    model: MODELS.haiku,
    system: promptConfig.systemPrompt,
    prompt,
  });

  let parsed: {
    summary: string;
    topics: string[];
    decisions: string[];
    pendingActions: string[];
    clientSentiment: string;
  };

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return { summary: 'Resumen no disponible.', meta: {} };
  }

  return {
    summary: parsed.summary ?? '',
    meta: {
      topics: parsed.topics ?? [],
      decisions: parsed.decisions ?? [],
      pendingActions: parsed.pendingActions ?? [],
      clientSentiment: parsed.clientSentiment ?? 'neutro',
    },
  };
}
