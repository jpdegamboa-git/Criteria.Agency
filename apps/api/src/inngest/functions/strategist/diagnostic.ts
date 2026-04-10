/**
 * Strategist Diagnostic — Inngest function
 *
 * Event: strategist/diagnostic.started
 * Triggers (from spec §9, Diagnostic skill):
 *   1. Material change in Brand Health Score
 *   2. Start of planning cycle (quarterly)
 *   3. Post-Brand Builder layer 2
 *   4. Significant anomaly from Analyst
 *   5. Relevant competitive move
 *
 * 3+3 rule: 3 normal attempts → 3 with leader adjustment → human escalation.
 * (Diagnostic has no formal gate but iteration still enforces quality).
 *
 * DEC-148: validates schema + verifies tenant before any work.
 * DEC-149: Tier A — Anthropic only.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  eq,
  organizationSettings,
  strategicDiagnoses,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runDiagnosticSkill } from '../../../lib/strategist/diagnostic.js';
import { logger } from '../../../lib/logger.js';

// ── Event schema (DEC-148) ────────────────────────────────────────────────────

const eventSchema = z.object({
  tenantId: z.string().min(1),
  /** What triggered this diagnostic (trigger # from spec §9) */
  triggeredBy: z.enum([
    'bhs_material_change',
    'planning_cycle_start',
    'brand_builder_layer2',
    'analyst_anomaly',
    'competitive_move',
    'manual',
  ]),
  /** For re-triggers on 3+3 iteration */
  attemptNumber: z.number().int().min(1).max(6).default(1),
  /** Populated when re-triggered by inngest itself after a failure */
  existingDiagnosisId: z.string().uuid().optional(),
});

export type DiagnosticEventData = z.infer<typeof eventSchema>;

// ── Function factory ──────────────────────────────────────────────────────────

export function createStrategistDiagnosticFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'strategist-diagnostic',
      retries: 1, // 3+3 rule handles iteration, not auto-retry
      triggers: [{ event: 'strategist/diagnostic.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema ─────────────────────────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);
        return result.data;
      });

      // ── Step 2: Verify tenant (DEC-148) ────────────────────────────────────
      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);
        if (!tenant) throw new Error(`Tenant not found: ${validated.tenantId}`);
        return { verified: true };
      });

      // ── Step 3: Create or update diagnosis record ───────────────────────────
      const diagnosisId = await step.run('upsert-diagnosis-record', async () => {
        if (validated.existingDiagnosisId) {
          await db
            .update(strategicDiagnoses)
            .set({ status: 'running', iterationCount: validated.attemptNumber })
            .where(eq(strategicDiagnoses.id, validated.existingDiagnosisId));
          return validated.existingDiagnosisId;
        }

        const [inserted] = await db
          .insert(strategicDiagnoses)
          .values({
            organizationId: validated.tenantId,
            status: 'running',
            triggeredBy: validated.triggeredBy,
            iterationCount: validated.attemptNumber,
          })
          .returning({ id: strategicDiagnoses.id });

        return inserted.id;
      });

      // ── Step 4: Check for escalation ────────────────────────────────────────
      if (validated.attemptNumber > 6) {
        await step.run('escalate', async () => {
          await db
            .update(strategicDiagnoses)
            .set({
              status: 'escalated',
              escalatedAt: new Date(),
              escalationReason: 'Exceeded 3+3 attempt limit — human review required',
            })
            .where(eq(strategicDiagnoses.id, diagnosisId));
          logger.warn({ diagnosisId, tenantId: validated.tenantId }, 'Strategist Diagnostic escalated after 6 attempts');
        });

        return { status: 'escalated', diagnosisId };
      }

      // ── Step 5: Run Diagnostic skill ────────────────────────────────────────
      const diagnosisOutput = await step.run('run-diagnostic-skill', async () => {
        return runDiagnosticSkill({
          db,
          tenantId: validated.tenantId,
          triggeredBy: validated.triggeredBy,
          attemptNumber: validated.attemptNumber,
        });
      });

      // ── Step 6: Persist diagnosis ───────────────────────────────────────────
      await step.run('persist-diagnosis', async () => {
        await db
          .update(strategicDiagnoses)
          .set({
            status: 'complete',
            diagnosis: diagnosisOutput,
            completedAt: new Date(),
          })
          .where(eq(strategicDiagnoses.id, diagnosisId));
      });

      // ── Step 7: Auto-trigger Planning if recommended ─────────────────────────
      if (diagnosisOutput.recommendsNewPlan) {
        await step.run('trigger-planning', async () => {
          const { inngest: client } = await import('../../client.js');
          await client.send({
            name: 'strategist/planning.started' as const,
            data: {
              tenantId: validated.tenantId,
              triggeredBy: 'diagnosis_complete' as const,
              diagnosisId,
              attemptNumber: 1,
            },
          });
        });
      }

      logger.info({ diagnosisId, tenantId: validated.tenantId, attempt: validated.attemptNumber }, 'Strategist Diagnostic complete');

      return {
        status: 'complete',
        diagnosisId,
        recommendsNewPlan: diagnosisOutput.recommendsNewPlan,
      };
    },
  );
}
