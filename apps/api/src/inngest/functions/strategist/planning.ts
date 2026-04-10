/**
 * Strategist Planning — Inngest function
 *
 * Event: strategist/planning.started
 * Triggers (from spec §9):
 *   6. Diagnosis completed that requires new plan (consequence)
 *   7. New client post-onboarding (first plan)
 *   8. Significant change in business objectives
 *   9. New budget approved (material change)
 *
 * Pipeline per spec §4.2:
 *   [Diagnosis] → Objectives → [G1: Financial viability] →
 *   Audiences → Value Prop → [G2: Brand Guardian coherence] →
 *   Media Plan → Budget → [G3: Client approval] → Marketing Plan + Campaign Briefs
 *
 * G1 and G2 implement 3+3 rule.
 * G3 (client approval) always required — creates pending_approval state.
 *
 * DEC-148, DEC-149 enforced.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  eq,
  and,
  organizationSettings,
  marketingPlans,
  marketingPlanCampaigns,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runPlanningSkill } from '../../../lib/strategist/planning.js';
import { logger } from '../../../lib/logger.js';

// ── Event schema ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  tenantId: z.string().min(1),
  triggeredBy: z.enum([
    'diagnosis_complete',
    'new_client',
    'objectives_changed',
    'budget_approved',
    'manual',
  ]),
  diagnosisId: z.string().uuid().optional(),
  periodMonths: z.number().int().min(1).max(12).default(3),
  attemptNumber: z.number().int().min(1).max(6).default(1),
  existingPlanId: z.string().uuid().optional(),
  // G1 and G2 attempt counters (separate from overall attempt)
  g1Attempts: z.number().int().min(0).max(6).default(0),
  g2Attempts: z.number().int().min(0).max(6).default(0),
});

export type PlanningEventData = z.infer<typeof eventSchema>;

// ── Function factory ──────────────────────────────────────────────────────────

export function createStrategistPlanningFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'strategist-planning',
      retries: 1,
      triggers: [{ event: 'strategist/planning.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema ────────────────────────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);
        return result.data;
      });

      // ── Step 2: Verify tenant ──────────────────────────────────────────────
      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);
        if (!tenant) throw new Error(`Tenant not found: ${validated.tenantId}`);
        return { verified: true };
      });

      // ── Step 3: Escalation check ────────────────────────────────────────────
      if (validated.attemptNumber > 6) {
        if (validated.existingPlanId) {
          await step.run('mark-escalated', async () => {
            await db
              .update(marketingPlans)
              .set({ status: 'archived' })
              .where(and(eq(marketingPlans.id, validated.existingPlanId!), eq(marketingPlans.organizationId, validated.tenantId)));
          });
        }
        logger.warn({ tenantId: validated.tenantId }, 'Strategist Planning escalated after 6 attempts');
        return { status: 'escalated' };
      }

      // ── Step 4: Create or reuse plan record ────────────────────────────────
      const planId = await step.run('upsert-plan-record', async () => {
        if (validated.existingPlanId) {
          return validated.existingPlanId;
        }

        const now = new Date();
        const [inserted] = await db
          .insert(marketingPlans)
          .values({
            organizationId: validated.tenantId,
            diagnosisId: validated.diagnosisId ?? null,
            status: 'draft',
            periodStart: now,
            periodEnd: new Date(now.getFullYear(), now.getMonth() + validated.periodMonths, now.getDate()),
            objectives: [],
            audiences: [],
            valueProposition: {},
            mediaPlan: {},
            budgetAllocation: {},
          })
          .returning({ id: marketingPlans.id });

        return inserted.id;
      });

      // ── Step 5: Run Planning skill (generates full plan) ───────────────────
      const planOutput = await step.run('run-planning-skill', async () => {
        return runPlanningSkill({
          db,
          tenantId: validated.tenantId,
          diagnosisId: validated.diagnosisId,
          periodMonths: validated.periodMonths,
          attemptNumber: validated.attemptNumber,
        });
      });

      // ── Step 6: Evaluate G1 (financial viability) ─────────────────────────
      const g1Result = await step.run('evaluate-g1-financial-viability', async () => {
        const { financiallyViable, financialNotes } = planOutput.viabilityAssessment;

        await db
          .update(marketingPlans)
          .set({
            objectives: planOutput.objectives,
            audiences: planOutput.audiences,
            g1Status: financiallyViable ? 'passed' : 'flagged',
            g1Feedback: financialNotes,
            g1Iterations: validated.g1Attempts + 1,
          })
          .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, validated.tenantId)));

        return { passed: financiallyViable, notes: financialNotes };
      });

      // If G1 blocks (financially impossible, not just aggressive), iterate
      if (!g1Result.passed && validated.g1Attempts >= 6) {
        logger.warn({ planId, tenantId: validated.tenantId }, 'G1 financial viability check failed after 6 attempts — escalating');
        await db.update(marketingPlans).set({ status: 'archived' }).where(eq(marketingPlans.id, planId));
        return { status: 'escalated', reason: 'G1 financial viability', planId };
      }

      // ── Step 7: Evaluate G2 (Brand Guardian coherence) ────────────────────
      const g2Result = await step.run('evaluate-g2-brand-coherence', async () => {
        const { brandCoherent, brandNotes } = planOutput.viabilityAssessment;

        await db
          .update(marketingPlans)
          .set({
            valueProposition: planOutput.valueProposition,
            mediaPlan: planOutput.mediaPlan,
            g2Status: brandCoherent ? 'passed' : 'blocked',
            g2Feedback: brandNotes,
            g2Iterations: validated.g2Attempts + 1,
          })
          .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, validated.tenantId)));

        return { passed: brandCoherent, notes: brandNotes };
      });

      // G2 blocks — 3+3 rule: retry with leader adjustment
      if (!g2Result.passed) {
        if (validated.g2Attempts >= 6) {
          await db.update(marketingPlans).set({ status: 'archived' }).where(eq(marketingPlans.id, planId));
          return { status: 'escalated', reason: 'G2 brand coherence', planId };
        }

        logger.info({ planId, g2Attempts: validated.g2Attempts }, 'G2 failed — retrying with leader adjustment');

        const { inngest: client } = await import('../../client.js');
        await client.send({
          name: 'strategist/planning.started',
          data: {
            tenantId: validated.tenantId,
            triggeredBy: validated.triggeredBy,
            diagnosisId: validated.diagnosisId,
            periodMonths: validated.periodMonths,
            attemptNumber: validated.attemptNumber + 1,
            existingPlanId: planId,
            g1Attempts: validated.g1Attempts,
            g2Attempts: validated.g2Attempts + 1,
          } as PlanningEventData,
        });

        return { status: 'retrying_g2', planId, g2Attempts: validated.g2Attempts + 1 };
      }

      // ── Step 8: Persist full plan + budget, set G3 pending ─────────────────
      await step.run('persist-plan', async () => {
        await db
          .update(marketingPlans)
          .set({
            budgetAllocation: planOutput.budgetAllocation,
            status: 'pending_approval', // G3: awaiting client approval
            g3Status: 'pending',
          })
          .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, validated.tenantId)));
      });

      // ── Step 9: Create pre-configured campaign briefs ─────────────────────
      await step.run('create-campaign-briefs', async () => {
        if (planOutput.proposedCampaigns.length === 0) return;

        await db.insert(marketingPlanCampaigns).values(
          planOutput.proposedCampaigns.map((c) => ({
            organizationId: validated.tenantId,
            planId,
            source: 'plan' as const,
            funnelStage: c.funnelStage,
            channelType: c.channelType,
            name: c.name,
            concept: c.concept,
            objective: { type: c.funnelStage, metric: '', target: c.objective },
            audiences: [{ segment: c.audienceSegment, priority: 'primary' }],
            channels: [{ channel: c.primaryChannel, justification: c.justification, format: '' }],
            funnelMatrixDistribution: { [c.funnelStage]: [c.primaryChannel] },
            budget: {
              suggested: c.suggestedBudget,
              min: Math.round(c.suggestedBudget * 0.7),
              max: Math.round(c.suggestedBudget * 1.3),
              currency: 'USD',
              rationale: c.justification,
            },
            calendar: {
              startDate: c.suggestedStartDate,
              durationDays: c.durationDays,
              milestones: [],
            },
            expectedKpis: c.expectedKpis,
            justification: c.justification,
            confidenceSource: c.confidenceSource,
            creativeSuggestion: { creativeSuggestion: c.creativeSuggestion },
            status: 'proposed',
            g4Passed: true, // pre-validated in Planning skill
          })),
        );
      });

      logger.info(
        { planId, tenantId: validated.tenantId, campaigns: planOutput.proposedCampaigns.length },
        'Strategist Planning complete — awaiting G3 client approval',
      );

      return {
        status: 'pending_approval',
        planId,
        campaignBriefs: planOutput.proposedCampaigns.length,
      };
    },
  );
}
