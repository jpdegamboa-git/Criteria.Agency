/**
 * MARA — Play/Pause toggle + invocation budget (DEC-131, DEC-157, DEC-158)
 *
 * Server-side enforcement — the toggle is not a UI-only feature.
 * Every MARA response goes through this layer before invoking paid agents.
 *
 * Play mode  → MARA can invoke any agent/system function the client's tier allows.
 * Pause mode → MARA responds only with free resources (Output Registry, data lookups, navigation).
 *
 * Per-session budget (DEC-157): max 5 paid agent invocations per session.
 * When budget exhausted, MARA prompts the client to start a new session.
 *
 * Budget tracking:
 * - mara_sessions.invocations_used  — per-session counter
 * - mara_play_pause.invocations_this_period — billing period aggregate
 */

import { eq, and, sql } from 'drizzle-orm';
import { maraPlayPause, maraSessions } from '@criteria/db';
import type { Database } from '@criteria/db';

const SESSION_BUDGET = 5; // DEC-157

export interface PlayPauseState {
  playMode: boolean;
  invocationsThisPeriod: number;
  sessionBudget: number;
}

// ── Read state ────────────────────────────────────────────────────────────────

export async function getPlayPauseState(db: Database, tenantId: string): Promise<PlayPauseState> {
  const [row] = await db
    .select()
    .from(maraPlayPause)
    .where(eq(maraPlayPause.organizationId, tenantId))
    .limit(1);

  if (!row) {
    // Default: pause mode, no invocations
    return { playMode: false, invocationsThisPeriod: 0, sessionBudget: SESSION_BUDGET };
  }

  return {
    playMode: row.playMode,
    invocationsThisPeriod: row.invocationsThisPeriod,
    sessionBudget: row.sessionBudget,
  };
}

// ── Toggle play/pause ─────────────────────────────────────────────────────────

export async function togglePlayMode(
  db: Database,
  tenantId: string,
  playMode: boolean,
): Promise<PlayPauseState> {
  await db
    .insert(maraPlayPause)
    .values({
      organizationId: tenantId,
      playMode,
      invocationsThisPeriod: 0,
      sessionBudget: SESSION_BUDGET,
    })
    .onConflictDoUpdate({
      target: maraPlayPause.organizationId,
      set: { playMode, updatedAt: new Date() },
    });

  return getPlayPauseState(db, tenantId);
}

// ── Budget checks (DEC-157, DEC-158) ─────────────────────────────────────────

export interface BudgetCheckResult {
  allowed: boolean;
  /** Why the invocation is blocked (null if allowed) */
  blockedReason: string | null;
  sessionInvocationsUsed: number;
  sessionBudget: number;
}

/**
 * Checks whether a paid agent invocation is allowed.
 * Enforces:
 *   1. Play mode must be active (DEC-158)
 *   2. Session budget not exhausted (DEC-157: max 5 per session)
 */
export async function checkInvocationAllowed(
  db: Database,
  tenantId: string,
  sessionId: string,
): Promise<BudgetCheckResult> {
  const state = await getPlayPauseState(db, tenantId);

  if (!state.playMode) {
    return {
      allowed: false,
      blockedReason:
        'pause_mode',
      sessionInvocationsUsed: 0,
      sessionBudget: state.sessionBudget,
    };
  }

  // Check session budget
  const [session] = await db
    .select({ invocationsUsed: maraSessions.invocationsUsed })
    .from(maraSessions)
    .where(
      and(eq(maraSessions.id, sessionId), eq(maraSessions.organizationId, tenantId)),
    )
    .limit(1);

  const used = session?.invocationsUsed ?? 0;

  if (used >= state.sessionBudget) {
    return {
      allowed: false,
      blockedReason: 'session_budget_exhausted',
      sessionInvocationsUsed: used,
      sessionBudget: state.sessionBudget,
    };
  }

  return {
    allowed: true,
    blockedReason: null,
    sessionInvocationsUsed: used,
    sessionBudget: state.sessionBudget,
  };
}

/**
 * Records a paid invocation. Call AFTER the agent successfully returns.
 * Updates both the session counter and the billing period aggregate.
 */
export async function recordInvocation(
  db: Database,
  tenantId: string,
  sessionId: string,
): Promise<void> {
  // Increment session counter
  await db
    .update(maraSessions)
    .set({ invocationsUsed: sql`${maraSessions.invocationsUsed} + 1` })
    .where(
      and(eq(maraSessions.id, sessionId), eq(maraSessions.organizationId, tenantId)),
    );

  // Increment period aggregate
  await db
    .update(maraPlayPause)
    .set({
      invocationsThisPeriod: sql`${maraPlayPause.invocationsThisPeriod} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(maraPlayPause.organizationId, tenantId));
}

// ── Pause mode response helpers ───────────────────────────────────────────────

/** Returns the standard MARA message when a paid invocation is blocked */
export function getPauseModeMessage(reason: 'pause_mode' | 'session_budget_exhausted'): string {
  if (reason === 'pause_mode') {
    return 'Para responderte eso necesitaría consultar al equipo de estrategia, lo que consume tokens. Ponme en play si quieres que lo haga.';
  }
  return 'Hemos llegado al límite de consultas profundas para esta sesión (5 máximo). Puedo seguir ayudándote con datos y navegación, o puedes iniciar una nueva sesión para continuar con análisis más profundos.';
}
