/**
 * Strategist Campaign Design — Inngest function
 *
 * Event: strategist/campaign-design.started
 * Triggers (from spec §9):
 *   10. Plan says it's time (scheduled — campaign start date approaching)
 *   11. Opportunity Brief with time window (reactive — from Opportunity Agent)
 *   12. Client requests a campaign (explicit — via Copilot or portal)
 *
 * Output: Pre-configured Campaign Brief (DEC-098) stored in marketing_plan_campaigns.
 * G6 (client approval) sets status to pending_approval — always required.
 * If brief.creativeSuggestion.requiresVideo: dispatches video-motor/pipeline.started.
 *
 * DEC-148, DEC-149 enforced.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  eq,
  and,
  organizationSettings,
  marketingPlanCampaigns,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runCampaignDesignSkill } from '../../../lib/strategist/campaign-design.js';
import { logger } from '../../../lib/logger.js';

// ── Event schema ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  tenantId: z.string().min(1),
  triggeredBy: z.enum(['plan_scheduled', 'opportunity', 'client_request', 'manual']),
  source: z.enum(['plan', 'opportunity', 'optimization']).default('plan'),
  planId: z.string().uuid().optional(),
  funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']).optional(),
  channelType: z.enum(['paid', 'owned', 'earned']).optional(),
  opportunityContext: z.string().max(1000).optional(),
  optimizationContext: z.string().max(1000).optional(),
  attemptNumber: z.number().int().min(1).max(6).default(1),
  existingBriefId: z.string().uuid().optional(),
});

export type CampaignDesignEventData = z.infer<typeof eventSchema>;

// ── Function factory ──────────────────────────────────────────────────────────

export function createStrategistCampaignDesignFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'strategist-campaign-design',
      retries: 1,
      triggers: [{ event: 'strategist/campaign-design.started' as const }],
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
        logger.warn({ tenantId: validated.tenantId }, 'Strategist Campaign Design escalated after 6 attempts');
        return { status: 'escalated' };
      }

      // ── Step 4: Run Campaign Design skill ─────────────────────────────────
      const briefOutput = await step.run('run-campaign-design-skill', async () => {
        return runCampaignDesignSkill({
          db,
          tenantId: validated.tenantId,
          source: validated.source,
          planId: validated.planId,
          opportunityContext: validated.opportunityContext,
          optimizationContext: validated.optimizationContext,
          funnelStage: validated.funnelStage,
          channelType: validated.channelType,
          attemptNumber: validated.attemptNumber,
        });
      });

      // ── Step 5: Persist campaign brief ─────────────────────────────────────
      const briefId = await step.run('persist-campaign-brief', async () => {
        if (validated.existingBriefId) {
          // Update existing brief (re-attempt)
          await db
            .update(marketingPlanCampaigns)
            .set({
              name: briefOutput.name,
              concept: briefOutput.concept,
              objective: briefOutput.objective,
              audiences: briefOutput.audiences,
              channels: briefOutput.channels,
              funnelMatrixDistribution: briefOutput.funnelMatrixDistribution,
              budget: briefOutput.budget,
              calendar: briefOutput.calendar,
              expectedKpis: briefOutput.expectedKpis,
              justification: briefOutput.justification,
              confidenceSource: briefOutput.confidenceSource,
              creativeSuggestion: briefOutput.creativeSuggestion,
              g4Passed: briefOutput.g4Assessment.advancesPlanObjectives && briefOutput.g4Assessment.alignsWithBrandDna,
              status: 'proposed',
              g6Status: 'pending',
            })
            .where(and(eq(marketingPlanCampaigns.id, validated.existingBriefId), eq(marketingPlanCampaigns.organizationId, validated.tenantId)));
          return validated.existingBriefId;
        }

        const [inserted] = await db
          .insert(marketingPlanCampaigns)
          .values({
            organizationId: validated.tenantId,
            planId: briefOutput.planId ?? validated.planId ?? undefined,
            source: briefOutput.source,
            funnelStage: briefOutput.funnelStage,
            channelType: briefOutput.channelType,
            name: briefOutput.name,
            concept: briefOutput.concept,
            objective: briefOutput.objective,
            audiences: briefOutput.audiences,
            channels: briefOutput.channels,
            funnelMatrixDistribution: briefOutput.funnelMatrixDistribution,
            budget: briefOutput.budget,
            calendar: briefOutput.calendar,
            expectedKpis: briefOutput.expectedKpis,
            justification: briefOutput.justification,
            confidenceSource: briefOutput.confidenceSource,
            creativeSuggestion: briefOutput.creativeSuggestion,
            g4Passed: briefOutput.g4Assessment.advancesPlanObjectives && briefOutput.g4Assessment.alignsWithBrandDna,
            status: 'proposed',
          })
          .returning({ id: marketingPlanCampaigns.id });

        return inserted.id;
      });

      // ── Step 6: If video required, dispatch Video Motor ────────────────────
      if (briefOutput.creativeSuggestion.requiresVideo && briefOutput.creativeSuggestion.videoBriefSummary) {
        await step.run('dispatch-video-motor', async () => {
          const { inngest: client } = await import('../../client.js');
          await client.send({
            name: 'video-motor/pipeline.started' as const,
            data: {
              tenantId: validated.tenantId,
              brief: {
                title: briefOutput.name,
                description: briefOutput.creativeSuggestion.videoBriefSummary,
                objective: briefOutput.objective.type,
                targetAudience: briefOutput.audiences[0]?.segment ?? 'general',
                campaignBriefId: briefId,
              },
              autonomyMode: 'ai_recommends',
            },
          });
          logger.info({ briefId, tenantId: validated.tenantId }, 'Dispatched Video Motor from Campaign Design');
        });
      }

      logger.info(
        { briefId, tenantId: validated.tenantId, source: validated.source, requiresVideo: briefOutput.creativeSuggestion.requiresVideo },
        'Campaign Design complete — brief awaiting G6 client approval',
      );

      return {
        status: 'pending_approval',
        briefId,
        requiresVideo: briefOutput.creativeSuggestion.requiresVideo,
      };
    },
  );
}
