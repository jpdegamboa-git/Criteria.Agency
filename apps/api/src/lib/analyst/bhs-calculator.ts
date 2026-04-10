/**
 * Brand Health Score Calculator — Fase 3 (DEC-126)
 *
 * 3 axes, equal weight (33/33/33):
 *   - Fundamentos: "Am I ready?" — Brand DNA depth + completeness
 *   - Ejecución:   "Am I doing it well?" — campaign performance + brand consistency + gate efficiency
 *   - Oportunidad: "Am I doing enough?" — channel coverage + investment adequacy + competitive activity
 *
 * System function — no LLM. All deterministic math.
 * Fundamentos axis reuses the logic from fundamentos-score.ts.
 * Ejecución and Oportunidad are new in Fase 3.
 *
 * Spec reference: Analyst Motor Design §3.3, §11
 */

import type { ArtifactSummary } from '../brand-builder/fundamentos-score.js';
import { calculateFundamentosScore } from '../brand-builder/fundamentos-score.js';

// ─── Input types ──────────────────────────────────────────────────────────────

export interface BhsFundamentosInput {
  currentLayer: number;
  artifacts: ArtifactSummary[];
}

export interface CampaignScoreSummary {
  campaignId: string;
  score: number;       // 0-100 from campaign_scores table
  phase: string;       // definition | production | execution
  isActive: boolean;
}

export interface BhsEjecucionInput {
  // Weighted avg of active Campaign Scores (0-100)
  activeCampaignScores: CampaignScoreSummary[];
  // Brand Guardian: % of outputs that passed brand consistency (0-1)
  brandGuardianPassRate: number | null;
  // Gate efficiency: % of gate reviews that passed on first attempt (0-1)
  gateFirstPassRate: number | null;
}

export interface BhsOportunidadInput {
  // Channel coverage: how many relevant channels are active (0-1 ratio)
  activeChannelCount: number;
  relevantChannelCount: number;
  // Investment adequacy: actual spend vs PI benchmark spend recommendation (0-1 ratio, capped at 1)
  actualMonthlySpend: number | null;
  benchmarkMonthlySpend: number | null;
  // Competitive activity: rough ratio vs detected competitors (0-1, default 0.5 when unknown)
  competitiveActivityRatio: number | null;
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface BhsResult {
  fundamentos: number;      // 0-100
  ejecucion: number | null; // null when no campaigns exist yet
  oportunidad: number;      // 0-100 (can be estimated even with no campaigns)
  totalScore: number;       // weighted average of available axes
  breakdown: BhsBreakdown;
}

export interface BhsBreakdown {
  fundamentosDetail: Record<string, unknown>;
  ejecucionDetail: Record<string, unknown> | null;
  oportunidadDetail: Record<string, unknown>;
  axesUsed: number;
  weights: { fundamentos: number; ejecucion: number; oportunidad: number };
}

// ─── Weights ──────────────────────────────────────────────────────────────────

// Within Ejecución axis (spec §11):
//   50% campaign performance vs targets, 25% brand consistency, 25% gate efficiency
const EJECUCION_WEIGHTS = {
  campaignPerformance: 0.50,
  brandConsistency: 0.25,
  gateEfficiency: 0.25,
};

// Within Oportunidad axis (spec §11):
//   channel coverage ratio × investment adequacy ratio × competitive activity ratio
// Simple weighted average: 40% coverage, 35% investment, 25% competitive
const OPORTUNIDAD_WEIGHTS = {
  channelCoverage: 0.40,
  investmentAdequacy: 0.35,
  competitiveActivity: 0.25,
};

// ─── Axis calculators ─────────────────────────────────────────────────────────

function calcEjecucion(input: BhsEjecucionInput): { score: number; detail: Record<string, unknown> } {
  const activeCampaigns = input.activeCampaignScores.filter((c) => c.isActive && c.phase === 'execution');

  // Campaign performance: weighted avg of execution-phase campaign scores
  let campaignPerformanceScore = 0;
  if (activeCampaigns.length > 0) {
    const avg = activeCampaigns.reduce((sum, c) => sum + c.score, 0) / activeCampaigns.length;
    campaignPerformanceScore = avg;
  } else if (input.activeCampaignScores.length > 0) {
    // Campaigns exist but none in execution yet — use definition/production scores at 60% weight
    const allAvg = input.activeCampaignScores.reduce((sum, c) => sum + c.score, 0) / input.activeCampaignScores.length;
    campaignPerformanceScore = allAvg * 0.6;
  }
  // If no campaigns at all: campaignPerformanceScore stays 0 → return null signal

  const brandConsistencyScore = input.brandGuardianPassRate !== null
    ? Math.round(input.brandGuardianPassRate * 100)
    : 50; // neutral default — no data yet

  const gateEfficiencyScore = input.gateFirstPassRate !== null
    ? Math.round(input.gateFirstPassRate * 100)
    : 50; // neutral default

  const score = Math.round(
    campaignPerformanceScore * EJECUCION_WEIGHTS.campaignPerformance +
    brandConsistencyScore * EJECUCION_WEIGHTS.brandConsistency +
    gateEfficiencyScore * EJECUCION_WEIGHTS.gateEfficiency,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    detail: {
      activeCampaignCount: activeCampaigns.length,
      campaignPerformanceScore,
      brandConsistencyScore,
      gateEfficiencyScore,
      brandGuardianPassRateInput: input.brandGuardianPassRate,
      gateFirstPassRateInput: input.gateFirstPassRate,
    },
  };
}

function calcOportunidad(input: BhsOportunidadInput): { score: number; detail: Record<string, unknown> } {
  // Channel coverage (0-100)
  const relevant = Math.max(1, input.relevantChannelCount);
  const coverageRatio = Math.min(1, input.activeChannelCount / relevant);
  const channelCoverageScore = Math.round(coverageRatio * 100);

  // Investment adequacy (0-100) — ratio actual/benchmark, capped at 1.0
  let investmentAdequacyScore = 30; // low default — "not yet investing"
  if (input.actualMonthlySpend !== null && input.benchmarkMonthlySpend !== null && input.benchmarkMonthlySpend > 0) {
    const adequacyRatio = Math.min(1, input.actualMonthlySpend / input.benchmarkMonthlySpend);
    investmentAdequacyScore = Math.round(adequacyRatio * 100);
  }

  // Competitive activity (0-100) — default 0.5 when unknown
  const compRatio = input.competitiveActivityRatio ?? 0.5;
  const competitiveActivityScore = Math.round(Math.min(1, Math.max(0, compRatio)) * 100);

  const score = Math.round(
    channelCoverageScore * OPORTUNIDAD_WEIGHTS.channelCoverage +
    investmentAdequacyScore * OPORTUNIDAD_WEIGHTS.investmentAdequacy +
    competitiveActivityScore * OPORTUNIDAD_WEIGHTS.competitiveActivity,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    detail: {
      channelCoverageScore,
      investmentAdequacyScore,
      competitiveActivityScore,
      activeChannelCount: input.activeChannelCount,
      relevantChannelCount: input.relevantChannelCount,
      actualMonthlySpend: input.actualMonthlySpend,
      benchmarkMonthlySpend: input.benchmarkMonthlySpend,
      competitiveActivityRatio: compRatio,
    },
  };
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateBrandHealthScore(
  fundamentosInput: BhsFundamentosInput,
  ejecucionInput: BhsEjecucionInput | null,
  oportunidadInput: BhsOportunidadInput,
): BhsResult {
  const { score: fundamentos, breakdown: fundamentosDetail } = calculateFundamentosScore(
    fundamentosInput.currentLayer,
    fundamentosInput.artifacts,
  );

  // Ejecución is null when there are no campaigns at all
  const hasAnyCampaigns = ejecucionInput !== null && ejecucionInput.activeCampaignScores.length > 0;
  let ejecucionScore: number | null = null;
  let ejecucionDetail: Record<string, unknown> | null = null;

  if (hasAnyCampaigns && ejecucionInput !== null) {
    const result = calcEjecucion(ejecucionInput);
    ejecucionScore = result.score;
    ejecucionDetail = result.detail;
  }

  const { score: oportunidad, detail: oportunidadDetail } = calcOportunidad(oportunidadInput);

  // Total score: average of available axes (equal weight per available axis)
  const axes: number[] = [fundamentos, oportunidad];
  if (ejecucionScore !== null) axes.push(ejecucionScore);
  const totalScore = Math.round(axes.reduce((s, v) => s + v, 0) / axes.length);

  const axesUsed = axes.length;

  return {
    fundamentos,
    ejecucion: ejecucionScore,
    oportunidad,
    totalScore,
    breakdown: {
      fundamentosDetail,
      ejecucionDetail,
      oportunidadDetail,
      axesUsed,
      weights: {
        fundamentos: Math.round((1 / axesUsed) * 100),
        ejecucion: ejecucionScore !== null ? Math.round((1 / axesUsed) * 100) : 0,
        oportunidad: Math.round((1 / axesUsed) * 100),
      },
    },
  };
}
