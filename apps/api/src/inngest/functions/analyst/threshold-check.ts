/**
 * Threshold Check — Post-Ingestion (Fase 3, Analyst spec §3.2)
 *
 * Runs after KPI data is ingested for a campaign.
 * Compares the latest KPI snapshot against thresholds and creates threshold_alerts.
 *
 * Triggered by: "analyst/kpi.ingested" event (fired after recordKpiSnapshot).
 * Also runs on a 6-hour cron schedule to catch any missed ingestion triggers.
 *
 * DEC-148: validates schema + tenant before work.
 * No LLM — all deterministic comparisons.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  eq,
  organizationSettings,
  campaigns,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { checkThresholds } from '../../../lib/analyst/kpi-tracker.js';
import { calculateAndStoreCampaignScore } from '../../../lib/analyst/campaign-score.js';

// ── Event schema ──────────────────────────────────────────────────────────────

const kpiIngestedSchema = z.object({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  campaignId: z.string().uuid(),
});

export function createThresholdCheckFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'analyst/threshold-check',
      name: 'Analyst: KPI Threshold Check + Campaign Score',
      triggers: [
        // On-demand: triggered after KPI ingestion
        { event: 'analyst/kpi.ingested' as const },
        // Cron fallback: run every 6 hours to catch any missed triggers
        { cron: '0 */6 * * *' },
      ],
    },
    async ({ event, step }) => {
      const isCron = !('data' in event) || event.data === undefined;

      // ── Step 1: resolve campaigns to check ───────────────────────────────
      const campaignsToCheck = await step.run('resolve-campaigns', async () => {
        if (!isCron && (event as { data?: unknown }).data) {
          const parsed = kpiIngestedSchema.safeParse((event as { data: unknown }).data);
          if (!parsed.success) {
            throw new Error(`Invalid event schema: ${parsed.error.message}`);
          }
          const { organizationId, campaignId } = parsed.data;

          // Verify tenant
          const [org] = await db
            .select({ organizationId: organizationSettings.organizationId })
            .from(organizationSettings)
            .where(eq(organizationSettings.organizationId, organizationId))
            .limit(1);

          if (!org) throw new Error(`Tenant ${organizationId} not found`);

          return [{ organizationId, campaignId }];
        }

        // Cron mode: check all active campaigns across all tenants
        const activeCampaigns = await db
          .select({
            id: campaigns.id,
            organizationId: campaigns.organizationId,
          })
          .from(campaigns)
          .where(eq(campaigns.status, 'execution'));

        return activeCampaigns.map((c) => ({
          organizationId: c.organizationId,
          campaignId: c.id,
        }));
      });

      if (campaignsToCheck.length === 0) return { checked: 0, alertsCreated: 0 };

      // ── Step 2: check thresholds + update campaign scores ─────────────────
      const outcomes = await step.run('check-thresholds-and-score', async () => {
        let totalAlerts = 0;
        const results: Array<{ campaignId: string; alertsCreated: number; score: number }> = [];

        for (const { campaignId, organizationId } of campaignsToCheck) {
          // Check KPI thresholds
          const alertIds = await checkThresholds(db, campaignId, organizationId);
          totalAlerts += alertIds.length;

          // Recalculate campaign score
          const { score } = await calculateAndStoreCampaignScore(db, campaignId, organizationId);

          results.push({ campaignId, alertsCreated: alertIds.length, score });
        }

        return { results, totalAlerts };
      });

      return {
        checked: campaignsToCheck.length,
        alertsCreated: outcomes.totalAlerts,
        campaigns: outcomes.results,
      };
    },
  );
}
