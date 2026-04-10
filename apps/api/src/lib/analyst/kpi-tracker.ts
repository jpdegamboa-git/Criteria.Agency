/**
 * KPI Tracker + Threshold Alerting — Fase 3 (Analyst spec §3.1, §3.2)
 *
 * Two system functions:
 *  1. recordKpiSnapshot — stores a new KPI snapshot and calculates deltas
 *  2. checkThresholds   — compares latest KPIs against thresholds, produces threshold_alerts
 *
 * All deterministic code. No LLM.
 * The Monitoring skill (post-MVP agent) qualifies produced alerts.
 */

import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '@criteria/db';
import { campaignKpis, thresholdAlerts } from '@criteria/db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpiSnapshot {
  campaignId: string;
  organizationId: string;
  channel: string;
  period: Date;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  cpm?: number | null;
  cpc?: number | null;
  conversions?: number | null;
  roas?: number | null;
  engagementRate?: number | null;
  spend?: number | null;
  rawMetrics?: Record<string, unknown>;
}

export interface ThresholdConfig {
  metric: keyof KpiSnapshot;
  // Absolute threshold: flag when value > maxValue or < minValue
  maxValue?: number;
  minValue?: number;
  // Relative threshold: flag when % change vs previous period exceeds this
  maxRelativeChangePct?: number;
  severity: 'informational' | 'attention' | 'action_required';
}

// Default thresholds per metric (conservative — will be tuned based on data)
// Spec §15.2: start conservative (more alerts), tune down ratio of signal/noise
const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  { metric: 'cpm', maxRelativeChangePct: 25, severity: 'attention' },
  { metric: 'cpc', maxRelativeChangePct: 30, severity: 'attention' },
  { metric: 'ctr', maxRelativeChangePct: -20, severity: 'attention' }, // drop in CTR
  { metric: 'roas', maxRelativeChangePct: -20, severity: 'action_required' },
  { metric: 'conversions', maxRelativeChangePct: -30, severity: 'action_required' },
  { metric: 'engagementRate', maxRelativeChangePct: -20, severity: 'attention' },
];

// ─── recordKpiSnapshot ────────────────────────────────────────────────────────

/**
 * Store a KPI snapshot for a campaign × channel × period.
 * Calculates deltas vs the previous snapshot for the same campaign × channel.
 */
export async function recordKpiSnapshot(db: Database, snapshot: KpiSnapshot): Promise<string> {
  // Look up most recent previous snapshot for delta calculation
  const [previous] = await db
    .select()
    .from(campaignKpis)
    .where(
      and(
        eq(campaignKpis.campaignId, snapshot.campaignId),
        eq(campaignKpis.channel, snapshot.channel),
      ),
    )
    .orderBy(desc(campaignKpis.period))
    .limit(1);

  const deltas: Record<string, number | null> = {};
  const numericKpis: Array<keyof KpiSnapshot> = [
    'impressions', 'clicks', 'ctr', 'cpm', 'cpc',
    'conversions', 'roas', 'engagementRate', 'spend',
  ];

  if (previous) {
    for (const key of numericKpis) {
      const current = snapshot[key] as number | null | undefined;
      const prev = previous[key as keyof typeof previous] as string | null;
      if (current != null && prev != null) {
        const prevNum = parseFloat(prev);
        if (prevNum !== 0) {
          deltas[`${key}_pct_change`] = Math.round(((current - prevNum) / prevNum) * 10000) / 100;
        }
        deltas[`${key}_absolute_change`] = Math.round((current - prevNum) * 10000) / 10000;
      }
    }
  }

  const [inserted] = await db
    .insert(campaignKpis)
    .values({
      campaignId: snapshot.campaignId,
      organizationId: snapshot.organizationId,
      channel: snapshot.channel,
      period: snapshot.period,
      impressions: snapshot.impressions ?? null,
      clicks: snapshot.clicks ?? null,
      ctr: snapshot.ctr?.toString() ?? null,
      cpm: snapshot.cpm?.toString() ?? null,
      cpc: snapshot.cpc?.toString() ?? null,
      conversions: snapshot.conversions ?? null,
      roas: snapshot.roas?.toString() ?? null,
      engagementRate: snapshot.engagementRate?.toString() ?? null,
      spend: snapshot.spend?.toString() ?? null,
      rawMetrics: snapshot.rawMetrics ?? {},
      deltas,
    })
    .returning({ id: campaignKpis.id });

  return inserted.id;
}

// ─── checkThresholds ──────────────────────────────────────────────────────────

/**
 * Compare the most recent KPI snapshot for a campaign against thresholds.
 * Creates threshold_alerts rows for any violations found.
 *
 * Returns the IDs of created alerts.
 */
export async function checkThresholds(
  db: Database,
  campaignId: string,
  organizationId: string,
  thresholds: ThresholdConfig[] = DEFAULT_THRESHOLDS,
): Promise<string[]> {
  // Fetch the two most recent snapshots per channel to evaluate sustained deviations
  const recentKpis = await db
    .select()
    .from(campaignKpis)
    .where(
      and(
        eq(campaignKpis.campaignId, campaignId),
        eq(campaignKpis.organizationId, organizationId),
      ),
    )
    .orderBy(desc(campaignKpis.period))
    .limit(20); // enough to cover all channels × 2 periods

  if (recentKpis.length === 0) return [];

  // Group by channel, take most recent per channel
  const byChannel = new Map<string, typeof recentKpis[0]>();
  for (const kpi of recentKpis) {
    if (!byChannel.has(kpi.channel)) {
      byChannel.set(kpi.channel, kpi);
    }
  }

  const createdAlertIds: string[] = [];

  for (const [channel, kpi] of byChannel.entries()) {
    const deltas = kpi.deltas as Record<string, number | null>;

    for (const threshold of thresholds) {
      const metricStr = threshold.metric as string;
      const currentValue = kpi[metricStr as keyof typeof kpi] as string | null;
      if (currentValue == null) continue;

      const current = parseFloat(currentValue);
      let triggered = false;
      let metricValue = current;
      let thresholdValue = 0;
      let deviationPct = 0;
      let alertType: 'absolute' | 'relative' | 'sustained' | 'compound' = 'absolute';

      // Check absolute thresholds
      if (threshold.maxValue !== undefined && current > threshold.maxValue) {
        triggered = true;
        thresholdValue = threshold.maxValue;
        deviationPct = ((current - threshold.maxValue) / threshold.maxValue) * 100;
        alertType = 'absolute';
      }

      if (!triggered && threshold.minValue !== undefined && current < threshold.minValue) {
        triggered = true;
        thresholdValue = threshold.minValue;
        deviationPct = ((threshold.minValue - current) / threshold.minValue) * 100;
        alertType = 'absolute';
      }

      // Check relative threshold (% change vs previous period)
      if (!triggered && threshold.maxRelativeChangePct !== undefined) {
        const pctChangeKey = `${metricStr}_pct_change`;
        const pctChange = deltas[pctChangeKey];
        if (pctChange !== null && pctChange !== undefined) {
          const limit = threshold.maxRelativeChangePct;
          // Negative limit means we flag drops; positive means we flag increases
          if (limit < 0 && pctChange < limit) {
            triggered = true;
            deviationPct = Math.abs(pctChange);
            thresholdValue = limit;
            alertType = 'relative';
          } else if (limit > 0 && pctChange > limit) {
            triggered = true;
            deviationPct = pctChange;
            thresholdValue = limit;
            alertType = 'relative';
          }
        }
      }

      if (triggered) {
        const [inserted] = await db
          .insert(thresholdAlerts)
          .values({
            organizationId,
            campaignId,
            alertType,
            severity: threshold.severity,
            metric: metricStr,
            metricValue: metricValue.toString(),
            threshold: thresholdValue.toString(),
            deviationPct: deviationPct.toString(),
            channel,
            period: kpi.period,
            status: 'open',
          })
          .returning({ id: thresholdAlerts.id });

        createdAlertIds.push(inserted.id);
      }
    }
  }

  return createdAlertIds;
}
