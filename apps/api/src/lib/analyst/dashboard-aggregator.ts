/**
 * Dashboard Data Aggregator — Fase 3 (Analyst spec §3.5)
 *
 * Prepares pre-computed data structures for the client-facing dashboards.
 * Groups, filters, and formats data by campaign, channel, funnel stage, time period.
 *
 * NOT visualization — that's frontend work.
 * This function produces the data layer so the frontend doesn't query raw tables.
 *
 * System function — no LLM.
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import type { Database } from '@criteria/db';
import {
  campaigns,
  campaignKpis,
  campaignScores,
  brandHealthScores,
  thresholdAlerts,
} from '@criteria/db';

// ─── Output types ─────────────────────────────────────────────────────────────

export interface CampaignSummary {
  id: string;
  name: string;
  funnelStage: string;
  channelType: string;
  status: string;
  currentScore: number | null;
  latestKpis: Record<string, ChannelKpiSummary>; // channel → KPI snapshot
  openAlertCount: number;
  startsAt: string | null;
  endsAt: string | null;
}

export interface ChannelKpiSummary {
  channel: string;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  conversions: number | null;
  roas: number | null;
  engagementRate: number | null;
  spend: number | null;
  period: string;
  deltas: Record<string, number | null>;
}

export interface FunnelMatrixCell {
  funnelStage: string;
  channelType: string;
  campaigns: Array<{ id: string; name: string; status: string; score: number | null }>;
  isEmpty: boolean;
}

export interface DashboardPayload {
  brandHealthScore: {
    total: number;
    fundamentos: number;
    ejecucion: number | null;
    oportunidad: number | null;
    calculatedAt: string;
  } | null;
  campaigns: CampaignSummary[];
  funnelMatrix: FunnelMatrixCell[];
  openAlerts: AlertSummary[];
  totals: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalImpressions: number;
    totalConversions: number;
    avgRoas: number | null;
  };
}

export interface AlertSummary {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  alertType: string;
  severity: string;
  metric: string;
  metricValue: string | null;
  deviationPct: string | null;
  channel: string | null;
  period: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FUNNEL_STAGES = ['awareness', 'consideration', 'conversion', 'retention'] as const;
const CHANNEL_TYPES = ['paid', 'owned', 'earned'] as const;

// ─── Main aggregator ──────────────────────────────────────────────────────────

export async function aggregateDashboard(
  db: Database,
  organizationId: string,
): Promise<DashboardPayload> {
  // 1. Latest Brand Health Score
  const [latestBhs] = await db
    .select()
    .from(brandHealthScores)
    .where(eq(brandHealthScores.organizationId, organizationId))
    .orderBy(desc(brandHealthScores.calculatedAt))
    .limit(1);

  // 2. All campaigns for this tenant
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.organizationId, organizationId))
    .orderBy(asc(campaigns.createdAt));

  // 3. Open alerts
  const openAlerts = await db
    .select()
    .from(thresholdAlerts)
    .where(
      and(
        eq(thresholdAlerts.organizationId, organizationId),
        eq(thresholdAlerts.status, 'open'),
      ),
    )
    .orderBy(desc(thresholdAlerts.createdAt))
    .limit(50);

  // 4. Build campaign summaries (latest KPIs + latest score per campaign)
  const campaignSummaries: CampaignSummary[] = [];

  for (const campaign of allCampaigns) {
    // Latest score
    const [latestScore] = await db
      .select()
      .from(campaignScores)
      .where(eq(campaignScores.campaignId, campaign.id))
      .orderBy(desc(campaignScores.calculatedAt))
      .limit(1);

    // Open alerts for this campaign
    const campaignAlerts = openAlerts.filter((a) => a.campaignId === campaign.id);

    // Latest KPIs per channel
    const kpis = await db
      .select()
      .from(campaignKpis)
      .where(eq(campaignKpis.campaignId, campaign.id))
      .orderBy(desc(campaignKpis.period))
      .limit(20);

    const latestKpis: Record<string, ChannelKpiSummary> = {};
    for (const kpi of kpis) {
      if (!latestKpis[kpi.channel]) {
        latestKpis[kpi.channel] = {
          channel: kpi.channel,
          impressions: kpi.impressions,
          clicks: kpi.clicks,
          ctr: kpi.ctr !== null ? parseFloat(kpi.ctr) : null,
          cpm: kpi.cpm !== null ? parseFloat(kpi.cpm) : null,
          cpc: kpi.cpc !== null ? parseFloat(kpi.cpc) : null,
          conversions: kpi.conversions,
          roas: kpi.roas !== null ? parseFloat(kpi.roas) : null,
          engagementRate: kpi.engagementRate !== null ? parseFloat(kpi.engagementRate) : null,
          spend: kpi.spend !== null ? parseFloat(kpi.spend) : null,
          period: kpi.period.toISOString(),
          deltas: kpi.deltas as Record<string, number | null>,
        };
      }
    }

    campaignSummaries.push({
      id: campaign.id,
      name: campaign.name,
      funnelStage: campaign.funnelStage,
      channelType: campaign.channelType,
      status: campaign.status,
      currentScore: latestScore?.score ?? null,
      latestKpis,
      openAlertCount: campaignAlerts.length,
      startsAt: campaign.startsAt?.toISOString() ?? null,
      endsAt: campaign.endsAt?.toISOString() ?? null,
    });
  }

  // 5. Funnel Matrix — all 12 cells (4 stages × 3 channel types)
  const funnelMatrix: FunnelMatrixCell[] = [];
  for (const stage of FUNNEL_STAGES) {
    for (const channelType of CHANNEL_TYPES) {
      const cellCampaigns = campaignSummaries.filter(
        (c) => c.funnelStage === stage && c.channelType === channelType,
      );
      funnelMatrix.push({
        funnelStage: stage,
        channelType,
        campaigns: cellCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          score: c.currentScore,
        })),
        isEmpty: cellCampaigns.length === 0,
      });
    }
  }

  // 6. Aggregate totals across all campaigns
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalConversions = 0;
  const roasValues: number[] = [];

  for (const summary of campaignSummaries) {
    for (const kpi of Object.values(summary.latestKpis)) {
      if (kpi.spend) totalSpend += kpi.spend;
      if (kpi.impressions) totalImpressions += kpi.impressions;
      if (kpi.conversions) totalConversions += kpi.conversions;
      if (kpi.roas) roasValues.push(kpi.roas);
    }
  }

  const avgRoas = roasValues.length > 0
    ? Math.round((roasValues.reduce((s, v) => s + v, 0) / roasValues.length) * 100) / 100
    : null;

  const activeCampaigns = allCampaigns.filter(
    (c) => c.status === 'execution' || c.status === 'production',
  ).length;

  // 7. Alert summaries with campaign names
  const campaignNameMap = new Map(allCampaigns.map((c) => [c.id, c.name]));
  const alertSummaries: AlertSummary[] = openAlerts.map((a) => ({
    id: a.id,
    campaignId: a.campaignId ?? null,
    campaignName: a.campaignId ? (campaignNameMap.get(a.campaignId) ?? null) : null,
    alertType: a.alertType,
    severity: a.severity,
    metric: a.metric,
    metricValue: a.metricValue,
    deviationPct: a.deviationPct,
    channel: a.channel ?? null,
    period: a.period?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return {
    brandHealthScore: latestBhs
      ? {
          total: latestBhs.totalScore,
          fundamentos: latestBhs.fundamentos,
          ejecucion: latestBhs.ejecucion ?? null,
          oportunidad: latestBhs.oportunidad ?? null,
          calculatedAt: latestBhs.calculatedAt.toISOString(),
        }
      : null,
    campaigns: campaignSummaries,
    funnelMatrix,
    openAlerts: alertSummaries,
    totals: {
      totalCampaigns: allCampaigns.length,
      activeCampaigns,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalImpressions,
      totalConversions,
      avgRoas,
    },
  };
}
