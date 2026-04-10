/**
 * MARA — Session Summary Inngest function
 *
 * Event: mara/session.end
 * Triggered when a MARA session ends (logout, inactivity timeout).
 *
 * Generates a cross-session summary (DEC-133):
 *   - Topics discussed
 *   - Decisions made
 *   - Pending actions
 *   - Client sentiment
 *
 * Summary is stored in mara_sessions.summary for use in next session open.
 * Cost: Free (internal maintenance — DEC-132).
 *
 * DEC-148: validates schema + verifies tenant before any work.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import { eq, organizationSettings } from '@criteria/db';
import type { Database } from '@criteria/db';
import { endSession } from '../../../lib/mara/conversation-manager.js';
import { logger } from '../../../lib/logger.js';

// ── Event schema (DEC-148) ────────────────────────────────────────────────────

const eventSchema = z.object({
  tenantId: z.string().min(1),
  sessionId: z.string().uuid(),
  /** Why the session ended */
  reason: z.enum(['logout', 'inactivity', 'manual']).default('manual'),
});

export type MaraSessionEndEventData = z.infer<typeof eventSchema>;

// ── Function factory ──────────────────────────────────────────────────────────

export function createMaraSessionSummaryFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'mara-session-summary',
      retries: 2,
      triggers: [{ event: 'mara/session.end' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema ───────────────────────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);
        return result.data;
      });

      // ── Step 2: Verify tenant (DEC-148) ──────────────────────────────────
      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);
        if (!tenant) throw new Error(`Tenant not found: ${validated.tenantId}`);
        return { verified: true };
      });

      // ── Step 3: Generate summary + end session ───────────────────────────
      const result = await step.run('generate-summary', async () => {
        const session = await endSession({
          db,
          tenantId: validated.tenantId,
          sessionId: validated.sessionId,
          generateSummary: true,
        });

        logger.info(
          { tenantId: validated.tenantId, sessionId: validated.sessionId, reason: validated.reason },
          'MARA session ended and summarized',
        );

        return { sessionId: session?.id, status: session?.status };
      });

      return result;
    },
  );
}
