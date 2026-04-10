/**
 * Campaign Score Calculator — Fase 3 (Analyst spec §3.4)
 *
 * Calculates a 0-100 quality score per campaign per phase:
 *   - definition: quality of strategic + creative input
 *   - production: asset quality (gate approval rates, brand consistency)
 *   - execution:  real performance vs objectives (KPI-based)
 *
 * System function — no LLM.
 * Score evolves across the campaign lifecycle.
 * Spec: Analyst Motor Design §3.4
 */

import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '@criteria/db';
import { campaigns, campaignKpis, campaignScores, videoGateReviews } from '@criteria/db';

// ─── Score weights per phase ──────────────────────────────────────────────────

// Definition phase: "quality of strategic and creative input"
// Clear objectives, well-defined audiences, differentiated versions, coherent creative direction,
// realistic budget, sensible calendar. (spec §3.4)
const DEFINITION_WEIGHTS = {
  hasObjectives: 0.25,     // structured objectives set
  hasBudget: 0.20,         // budget defined
  hasTimeline: 0.15,       // start/end dates defined
  hasBrief: 0.25,          // brief has meaningful content (keys filled)
  hasFunnelPosition: 0.15, // funnel stage + channel type defined
};

// Production phase: gate approval rates + brand consistency
const PRODUCTION_WEIGHTS = {
  gateFirstPassRate: 0.60,     // gates passed on first attempt
  brandConsistencyRate: 0.40,  // Brand Guardian pass rate
};

// Execution phase: performance vs objectives (KPI-based)
const EXECUTION_WEIGHTS = {
  ctrPerformance: 0.20,
  conversionPerformance: 0.25,
  roasPerformance: 0.30,
  engagementPerformance: 0.15,
  spendEfficiency: 0.10,
};

// ─── Phase calculators ────────────────────────────────────────────────────────

function scoreDefinitionPhase(campaign: {
  objectives: unknown;
  budget: unknown;
  brief: unknown;
  startsAt: Date | null;
  endsAt: Date | null;
  funnelStage: string;
  channelType: string;
}): { score: number; breakdown: Record<string, unknown>; recommendations: string[] } {
  const obj = campaign.objectives as Record<string, unknown>;
  const budget = campaign.budget as Record<string, unknown>;
  const brief = campaign.brief as Record<string, unknown>;

  const hasObjectives = obj && Object.keys(obj).length > 0;
  const hasBudget = budget && (budget.total != null || budget.currency != null);
  const hasTimeline = campaign.startsAt != null && campaign.endsAt != null;
  const hasBrief = brief && Object.keys(brief).length >= 3; // at least 3 fields
  const hasFunnelPosition = Boolean(campaign.funnelStage && campaign.channelType);

  const score = Math.round(
    (hasObjectives ? DEFINITION_WEIGHTS.hasObjectives : 0) * 100 +
    (hasBudget ? DEFINITION_WEIGHTS.hasBudget : 0) * 100 +
    (hasTimeline ? DEFINITION_WEIGHTS.hasTimeline : 0) * 100 +
    (hasBrief ? DEFINITION_WEIGHTS.hasBrief : 0) * 100 +
    (hasFunnelPosition ? DEFINITION_WEIGHTS.hasFunnelPosition : 0) * 100,
  );

  const recommendations: string[] = [];
  if (!hasObjectives) recommendations.push('Define campaign objectives with measurable KPI targets');
  if (!hasBudget) recommendations.push('Set the campaign budget (total spend and currency)');
  if (!hasTimeline) recommendations.push('Set campaign start and end dates');
  if (!hasBrief) recommendations.push('Complete the campaign brief with creative direction, audience, and format details');

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: { hasObjectives, hasBudget, hasTimeline, hasBrief, hasFunnelPosition },
    recommendations,
  };
}

async function scoreProductionPhase(
  db: Database,
  campaignId: string,
  videoProjectId: string | null,
): Promise<{ score: number; breakdown: Record<string, unknown>; recommendations: string[] }> {
  let gateFirstPassRate = 0.5; // neutral default
  let brandConsistencyRate = 0.5;
  const recommendations: string[] = [];

  if (videoProjectId) {
    const gateReviews = await db
      .select()
      .from(videoGateReviews)
      .where(eq(videoGateReviews.projectId, videoProjectId))
      .orderBy(desc(videoGateReviews.createdAt));

    if (gateReviews.length > 0) {
      // Gate first-pass rate: reviews where iterationNumber === 1 and combined verdict = advance
      const firstPassReviews = gateReviews.filter(
        (r) => r.iterationNumber === 1 && r.combinedVerdict === 'advance',
      );
      const uniqueGates = new Set(gateReviews.map((r) => r.gateNumber)).size;
      gateFirstPassRate = uniqueGates > 0 ? firstPassReviews.length / uniqueGates : 0.5;

      // Brand Guardian consistency: reviews where brand guardian passed
      const bgReviews = gateReviews.filter((r) => r.brandGuardianVerdict !== null);
      if (bgReviews.length > 0) {
        const bgPassed = bgReviews.filter((r) => r.brandGuardianVerdict === 'pass').length;
        brandConsistencyRate = bgPassed / bgReviews.length;
      }

      if (gateFirstPassRate < 0.5) {
        recommendations.push('Review creative briefs — gates are requiring multiple iterations');
      }
      if (brandConsistencyRate < 0.7) {
        recommendations.push('Strengthen brand guideline adherence during content production');
      }
    }
  }

  const score = Math.round(
    gateFirstPassRate * PRODUCTION_WEIGHTS.gateFirstPassRate * 100 +
    brandConsistencyRate * PRODUCTION_WEIGHTS.brandConsistencyRate * 100,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      gateFirstPassRate,
      brandConsistencyRate,
      hasVideoProject: Boolean(videoProjectId),
    },
    recommendations,
  };
}

async function scoreExecutionPhase(
  db: Database,
  campaignId: string,
  organizationId: string,
  objectives: Record<string, unknown>,
): Promise<{ score: number; breakdown: Record<string, unknown>; recommendations: string[] }> {
  // Get the most recent KPI snapshots per channel
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
    .limit(20);

  if (recentKpis.length === 0) {
    return {
      score: 0,
      breakdown: { hasKpiData: false },
      recommendations: ['Connect platform data to track campaign performance'],
    };
  }

  // Take most recent KPI per channel
  const byChannel = new Map<string, typeof recentKpis[0]>();
  for (const kpi of recentKpis) {
    if (!byChannel.has(kpi.channel)) byChannel.set(kpi.channel, kpi);
  }

  const kpiValues = [...byChannel.values()];

  // Average KPIs across channels
  const avg = (field: keyof typeof kpiValues[0]) => {
    const vals = kpiValues.map((k) => k[field] as string | null).filter((v) => v != null).map(Number);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  };

  const avgCtr = avg('ctr');
  const avgConversions = avg('conversions');
  const avgRoas = avg('roas');
  const avgEngagement = avg('engagementRate');
  const avgSpend = avg('spend');

  // Score against objectives if targets are defined, otherwise use industry baseline
  // Simple scoring: map raw KPI to 0-100 using reasonable baselines
  const ctrScore = avgCtr !== null ? Math.min(100, (avgCtr / 2.0) * 100) : 50; // 2% CTR = 100
  const convScore = avgConversions !== null ? Math.min(100, Math.max(0, avgConversions > 0 ? 70 : 20)) : 50;
  const roasScore = avgRoas !== null ? Math.min(100, (avgRoas / 4.0) * 100) : 50; // 4x ROAS = 100
  const engScore = avgEngagement !== null ? Math.min(100, (avgEngagement / 3.0) * 100) : 50; // 3% = 100
  const spendScore = avgSpend !== null ? Math.min(100, avgSpend > 0 ? 80 : 20) : 50; // spending = good

  const score = Math.round(
    ctrScore * EXECUTION_WEIGHTS.ctrPerformance +
    convScore * EXECUTION_WEIGHTS.conversionPerformance +
    roasScore * EXECUTION_WEIGHTS.roasPerformance +
    engScore * EXECUTION_WEIGHTS.engagementPerformance +
    spendScore * EXECUTION_WEIGHTS.spendEfficiency,
  );

  const recommendations: string[] = [];
  if (avgCtr !== null && avgCtr < 1.0) recommendations.push('CTR below 1% — review ad creative and targeting');
  if (avgRoas !== null && avgRoas < 2.0) recommendations.push('ROAS below 2x — consider pausing underperforming versions');

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      channelCount: byChannel.size,
      avgCtr,
      avgConversions,
      avgRoas,
      avgEngagement,
      avgSpend,
      ctrScore,
      convScore,
      roasScore,
      engScore,
    },
    recommendations,
  };
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Calculate and persist the campaign score for the current phase.
 * Replaces the latest score for the same campaign × phase.
 */
export async function calculateAndStoreCampaignScore(
  db: Database,
  campaignId: string,
  organizationId: string,
): Promise<{ score: number; phase: string }> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const phase = campaign.status as string; // definition | production | execution | completed

  let score = 0;
  let breakdown: Record<string, unknown> = {};
  let recommendations: string[] = [];

  if (phase === 'definition') {
    const result = scoreDefinitionPhase(campaign as Parameters<typeof scoreDefinitionPhase>[0]);
    score = result.score;
    breakdown = result.breakdown;
    recommendations = result.recommendations;
  } else if (phase === 'production') {
    const result = await scoreProductionPhase(db, campaignId, campaign.videoProjectId ?? null);
    score = result.score;
    breakdown = result.breakdown;
    recommendations = result.recommendations;
  } else if (phase === 'execution' || phase === 'completed') {
    const result = await scoreExecutionPhase(
      db,
      campaignId,
      organizationId,
      campaign.objectives as Record<string, unknown>,
    );
    score = result.score;
    breakdown = result.breakdown;
    recommendations = result.recommendations;
  }

  await db
    .insert(campaignScores)
    .values({
      campaignId,
      organizationId,
      phase,
      score,
      breakdown,
      recommendations,
    });

  return { score, phase };
}
