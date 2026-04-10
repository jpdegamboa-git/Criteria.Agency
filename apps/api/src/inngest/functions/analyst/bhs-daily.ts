/**
 * Brand Health Score — Daily Recalculation (Fase 3, DEC-126)
 *
 * Scheduled Inngest function: runs once per day for every active tenant.
 * Calculates all 3 axes: Fundamentos, Ejecución, Oportunidad.
 *
 * Triggered by: cron schedule ("analyst/bhs.calculate-daily")
 * Also triggerable on-demand via "analyst/bhs.recalculate" event.
 *
 * DEC-148: validates schema + tenant before work.
 * No LLM — all deterministic math.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  eq,
  desc,
  and,
  organizationSettings,
  brandDna,
  brandDnaArtifacts,
  brandHealthScores,
  campaigns,
  campaignScores,
  videoGateReviews,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { calculateBrandHealthScore } from '../../../lib/analyst/bhs-calculator.js';
import type {
  BhsFundamentosInput,
  BhsEjecucionInput,
  BhsOportunidadInput,
  CampaignScoreSummary,
} from '../../../lib/analyst/bhs-calculator.js';

// ── Event schema ──────────────────────────────────────────────────────────────

const bhsRecalculateSchema = z.object({
  tenantId: z.string().min(1),
  // Optional: if omitted, recalculates for all active tenants (scheduled mode)
  organizationId: z.string().min(1).optional(),
});

export function createBhsDailyFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'analyst/bhs-daily',
      name: 'Analyst: Brand Health Score — Daily Recalculation',
      triggers: [
        // Cron: runs daily at 06:00 UTC
        { cron: '0 6 * * *' },
        // On-demand trigger
        { event: 'analyst/bhs.recalculate' as const },
      ],
    },
    async ({ event, step }) => {
      // For cron trigger there is no event.data — recalculate all tenants
      // For on-demand trigger, event.data may specify a specific org
      const isCron = !('data' in event) || event.data === undefined;

      // ── Step 1: resolve tenant(s) ─────────────────────────────────────────
      const tenantIds = await step.run('resolve-tenants', async () => {
        if (!isCron && (event as unknown as { data?: { organizationId?: string } }).data?.organizationId) {
          const orgId = (event as unknown as { data: { organizationId: string } }).data.organizationId;
          // Verify tenant exists
          const [org] = await db
            .select({ organizationId: organizationSettings.organizationId })
            .from(organizationSettings)
            .where(eq(organizationSettings.organizationId, orgId))
            .limit(1);
          return org ? [org.organizationId] : [];
        }

        // Recalculate all active tenants
        const orgs = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings);
        return orgs.map((o) => o.organizationId);
      });

      if (tenantIds.length === 0) return { calculated: 0, skipped: 0 };

      // ── Step 2: calculate BHS for each tenant ─────────────────────────────
      const results = await step.run('calculate-bhs-all-tenants', async () => {
        const outcomes: Array<{ organizationId: string; totalScore: number }> = [];

        for (const organizationId of tenantIds) {
          // Gather Fundamentos inputs
          const [dna] = await db
            .select()
            .from(brandDna)
            .where(eq(brandDna.organizationId, organizationId))
            .limit(1);

          const artifacts = dna
            ? await db
                .select({
                  artifactType: brandDnaArtifacts.artifactType,
                  layer: brandDnaArtifacts.layer,
                  status: brandDnaArtifacts.status,
                })
                .from(brandDnaArtifacts)
                .where(eq(brandDnaArtifacts.organizationId, organizationId))
            : [];

          const fundamentosInput: BhsFundamentosInput = {
            currentLayer: dna?.currentLayer ?? 0,
            artifacts,
          };

          // Gather Ejecución inputs
          const orgCampaigns = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.organizationId, organizationId));

          let ejecucionInput: BhsEjecucionInput | null = null;

          if (orgCampaigns.length > 0) {
            const campaignScoreSummaries: CampaignScoreSummary[] = [];

            for (const c of orgCampaigns) {
              const [latest] = await db
                .select()
                .from(campaignScores)
                .where(eq(campaignScores.campaignId, c.id))
                .orderBy(desc(campaignScores.calculatedAt))
                .limit(1);

              campaignScoreSummaries.push({
                campaignId: c.id,
                score: latest?.score ?? 0,
                phase: c.status,
                isActive: c.status === 'execution' || c.status === 'production',
              });
            }

            // Gate first-pass rate: across all video projects linked to org campaigns
            const videoProjectIds = orgCampaigns
              .filter((c) => c.videoProjectId != null)
              .map((c) => c.videoProjectId as string);

            let gateFirstPassRate: number | null = null;
            if (videoProjectIds.length > 0) {
              let totalGates = 0;
              let firstPassGates = 0;
              for (const vpId of videoProjectIds) {
                const reviews = await db
                  .select()
                  .from(videoGateReviews)
                  .where(eq(videoGateReviews.projectId, vpId));
                const uniqueGateNumbers = new Set(reviews.map((r) => r.gateNumber));
                totalGates += uniqueGateNumbers.size;
                firstPassGates += reviews.filter(
                  (r) => r.iterationNumber === 1 && r.combinedVerdict === 'advance',
                ).length;
              }
              gateFirstPassRate = totalGates > 0 ? firstPassGates / totalGates : null;
            }

            ejecucionInput = {
              activeCampaignScores: campaignScoreSummaries,
              brandGuardianPassRate: null, // Brand Guardian pass rate tracked post-MVP
              gateFirstPassRate,
            };
          }

          // Gather Oportunidad inputs
          // MVP: channel coverage based on active campaigns (each unique channelType = 1 active channel)
          const activeChannels = new Set(
            orgCampaigns
              .filter((c) => c.status === 'execution' || c.status === 'production')
              .map((c) => c.channelType),
          );
          const oportunidadInput: BhsOportunidadInput = {
            activeChannelCount: activeChannels.size,
            relevantChannelCount: 3, // baseline: paid + owned + earned (PI benchmark post-MVP)
            actualMonthlySpend: null, // requires Data Ingestion Layer (post-MVP)
            benchmarkMonthlySpend: null,
            competitiveActivityRatio: null, // requires Listeners (post-MVP)
          };

          // Calculate
          const result = calculateBrandHealthScore(fundamentosInput, ejecucionInput, oportunidadInput);

          // Persist
          await db.insert(brandHealthScores).values({
            organizationId,
            fundamentos: result.fundamentos,
            ejecucion: result.ejecucion ?? undefined,
            oportunidad: result.oportunidad,
            totalScore: result.totalScore,
            breakdown: result.breakdown as unknown as Record<string, unknown>,
          });

          outcomes.push({ organizationId, totalScore: result.totalScore });
        }

        return outcomes;
      });

      return {
        calculated: results.length,
        results,
      };
    },
  );
}
