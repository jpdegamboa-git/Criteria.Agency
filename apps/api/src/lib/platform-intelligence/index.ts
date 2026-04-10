/**
 * Platform Intelligence — system function (DEC-112)
 *
 * PI aggregates cross-client knowledge and serves it as benchmarks or patterns.
 * It NEVER interprets, recommends, or makes decisions — that's the Strategist's job.
 *
 * Two query modes (DEC-113):
 *   - Benchmark query: "What is the standard?" → returns metric values
 *   - Pattern query:   "What works?"            → returns rankings / distributions
 *
 * Cold start design (DEC-106):
 *   - industry_benchmark: public data seeded at deploy. Available from day 1.
 *   - platform_early:     CriteriaFilms + beta testers. Added as data accumulates.
 *   - platform:           real aggregated data. K-anonymity enforced (K=5 default).
 *
 * Hierarchical fallback (DEC-105):
 *   Exact match → expand temporal window → widen geographic level → industry_benchmark
 *
 * Three hard restrictions (DEC-114):
 *   1. Never recommends — returns data only
 *   2. Never crosses identity barrier — K ≥ 3 enforced, never serves point data
 *   3. Never serves real-time data from active campaigns (weekly batch only)
 *
 * K-anonymity (DEC-107):
 *   - Learning Records:  K = 5
 *   - Operational Signals: K = 3
 *   - Structural Patterns: K = 5
 *   - Never below K = 3 for any type
 *
 * Access levels (DEC-115):
 *   - Full (benchmark + pattern): Strategist, Financial Agent, Brand Builder
 *   - Pattern only: Creative Director, Channel Manager, Media Scout
 *   - Benchmark only: Analyst
 *   - Operational: Distribution agents
 *   - No access: Brand Guardian
 */

import { and, eq, or, sql } from 'drizzle-orm';
import { platformIntelligenceBenchmarks } from '@criteria/db';
import type { Database } from '@criteria/db';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PISource = 'industry_benchmark' | 'platform_early' | 'platform';
export type PIConfidence = 'low' | 'medium' | 'high';
export type PITrend = 'rising' | 'stable' | 'declining' | 'unknown';
export type PIMatchLevel = 'exact' | 'widened_region' | 'widened_industry' | 'fallback';

export interface BenchmarkQuery {
  industry: string;
  metric: string; // ctr | cpm | cpc | roas | engagement_rate | cac | conversion_rate
  // Optional filters — PI falls back hierarchically when missing
  region?: string;
  channel?: string;
  format?: string;
  funnelStage?: string;
  messagingType?: string;
  businessSize?: string;
}

export interface BenchmarkResult {
  metric: string;
  value: string; // string because numeric from postgres
  valueMin: string | null;
  valueMax: string | null;
  source: PISource;
  confidence: PIConfidence;
  n: number;
  temporalWindow: string;
  trend: PITrend;
  matchLevel: PIMatchLevel;
  // Human-readable: "Based on 47 platform campaigns" | "Based on industry benchmarks (external)"
  sourceLabel: string;
}

export interface PatternQuery {
  metric: string;
  groupBy: 'messagingType' | 'format' | 'channel' | 'funnelStage';
  industry?: string;
  region?: string;
  channel?: string;
  funnelStage?: string;
}

export interface PatternResult {
  dimension: string;
  value: string;
  relativeRank: number; // 1 = best in group
  n: number;
  source: PISource;
  confidence: PIConfidence;
}

export interface PatternQueryResult {
  metric: string;
  groupBy: string;
  ranked: PatternResult[];
  matchLevel: PIMatchLevel;
  temporalWindow: string;
  sourceLabel: string;
}

// ── Source label helper ───────────────────────────────────────────────────────

function buildSourceLabel(source: PISource, n: number): string {
  switch (source) {
    case 'platform':
      return `Based on ${n} campaigns on the platform`;
    case 'platform_early':
      return `Based on early platform data (${n} campaigns)`;
    case 'industry_benchmark':
      return 'Based on industry benchmarks (external source)';
  }
}

// ── Benchmark Query ───────────────────────────────────────────────────────────

/**
 * Mode 1: Benchmark query — "What is the standard?"
 *
 * Returns the best available benchmark for a metric in a given context.
 * Falls back hierarchically until a match is found.
 *
 * Consuming agents always know what level of match they received (matchLevel field).
 * Agents MUST NOT recommend based on this data — they must interpret and decide.
 */
export async function benchmarkQuery(
  db: Database,
  query: BenchmarkQuery,
): Promise<BenchmarkResult | null> {
  const { industry, metric, region, channel, format, funnelStage, messagingType } = query;

  // Fallback cascade: try increasingly broad matches
  const fallbackLevels: Array<{
    filters: Record<string, string | undefined>;
    matchLevel: PIMatchLevel;
  }> = [
    // 1. Exact match on all provided dimensions
    {
      filters: { industry, region, channel, format, funnelStage, messagingType },
      matchLevel: 'exact',
    },
    // 2. Widen region to LATAM if specific region was requested
    ...(region && region !== 'LATAM'
      ? [{ filters: { industry, region: 'LATAM', channel, format, funnelStage, messagingType }, matchLevel: 'widened_region' as PIMatchLevel }]
      : []),
    // 3. Drop channel/format specificity
    {
      filters: { industry, region: 'LATAM', funnelStage },
      matchLevel: 'widened_industry' as PIMatchLevel,
    },
    // 4. Final fallback — industry + metric only
    {
      filters: { industry },
      matchLevel: 'fallback' as PIMatchLevel,
    },
    // 5. Absolute fallback — any benchmark for this metric
    {
      filters: {},
      matchLevel: 'fallback' as PIMatchLevel,
    },
  ];

  for (const { filters, matchLevel } of fallbackLevels) {
    const conditions = [eq(platformIntelligenceBenchmarks.metric, metric)];

    if (filters.industry) {
      conditions.push(
        or(
          eq(platformIntelligenceBenchmarks.industry, filters.industry),
          eq(platformIntelligenceBenchmarks.industry, 'any'),
        )!,
      );
    }
    if (filters.region) {
      conditions.push(
        or(
          eq(platformIntelligenceBenchmarks.region, filters.region),
          eq(platformIntelligenceBenchmarks.region, 'LATAM'),
        )!,
      );
    }
    if (filters.channel) {
      conditions.push(
        or(
          eq(platformIntelligenceBenchmarks.channel, filters.channel),
          eq(platformIntelligenceBenchmarks.channel, 'any'),
        )!,
      );
    }
    if (filters.funnelStage) {
      conditions.push(
        or(
          eq(platformIntelligenceBenchmarks.funnelStage, filters.funnelStage),
          eq(platformIntelligenceBenchmarks.funnelStage, 'any'),
        )!,
      );
    }

    const [row] = await db
      .select()
      .from(platformIntelligenceBenchmarks)
      .where(and(...conditions))
      // Prefer platform > platform_early > industry_benchmark; prefer higher N
      .orderBy(
        sql`CASE source WHEN 'platform' THEN 1 WHEN 'platform_early' THEN 2 ELSE 3 END`,
        sql`${platformIntelligenceBenchmarks.n} DESC`,
      )
      .limit(1);

    if (row) {
      return {
        metric: row.metric,
        value: String(row.value),
        valueMin: row.valueMin ? String(row.valueMin) : null,
        valueMax: row.valueMax ? String(row.valueMax) : null,
        source: row.source as PISource,
        confidence: row.confidence as PIConfidence,
        n: row.n,
        temporalWindow: row.temporalWindow,
        trend: row.trend as PITrend,
        matchLevel,
        sourceLabel: buildSourceLabel(row.source as PISource, row.n),
      };
    }
  }

  return null; // no data available at all
}

/**
 * Mode 2: Pattern query — "What works?"
 *
 * Returns a ranked list of dimension values by metric performance.
 * Used to answer: "What messaging type works best?" or "Which channels outperform?"
 */
export async function patternQuery(
  db: Database,
  query: PatternQuery,
): Promise<PatternQueryResult | null> {
  const { metric, groupBy, industry, region, channel, funnelStage } = query;

  const conditions = [eq(platformIntelligenceBenchmarks.metric, metric)];

  if (industry) {
    conditions.push(
      or(
        eq(platformIntelligenceBenchmarks.industry, industry),
        eq(platformIntelligenceBenchmarks.industry, 'any'),
      )!,
    );
  }
  if (region) {
    conditions.push(
      or(
        eq(platformIntelligenceBenchmarks.region, region),
        eq(platformIntelligenceBenchmarks.region, 'LATAM'),
      )!,
    );
  }
  if (channel) {
    conditions.push(
      or(
        eq(platformIntelligenceBenchmarks.channel, channel),
        eq(platformIntelligenceBenchmarks.channel, 'any'),
      )!,
    );
  }
  if (funnelStage) {
    conditions.push(
      or(
        eq(platformIntelligenceBenchmarks.funnelStage, funnelStage),
        eq(platformIntelligenceBenchmarks.funnelStage, 'any'),
      )!,
    );
  }

  // Map groupBy to schema column
  const groupByColumn = {
    messagingType: platformIntelligenceBenchmarks.messagingType,
    format: platformIntelligenceBenchmarks.format,
    channel: platformIntelligenceBenchmarks.channel,
    funnelStage: platformIntelligenceBenchmarks.funnelStage,
  }[groupBy];

  const rows = await db
    .select()
    .from(platformIntelligenceBenchmarks)
    .where(and(...conditions))
    .orderBy(
      sql`CASE source WHEN 'platform' THEN 1 WHEN 'platform_early' THEN 2 ELSE 3 END`,
      sql`${platformIntelligenceBenchmarks.value} DESC`,
    );

  if (rows.length === 0) return null;

  // Group by the requested dimension, keep best row per group
  const groups = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    const dim = String((row as Record<string, unknown>)[groupBy] ?? 'any');
    if (dim === 'any') continue; // skip catch-all rows for pattern queries
    if (!groups.has(dim)) groups.set(dim, row);
  }

  if (groups.size === 0) return null;

  const ranked: PatternResult[] = Array.from(groups.entries())
    .map(([dimension, row], idx) => ({
      dimension,
      value: String(row.value),
      relativeRank: idx + 1,
      n: row.n,
      source: row.source as PISource,
      confidence: row.confidence as PIConfidence,
    }));

  const bestRow = rows[0];
  return {
    metric,
    groupBy,
    ranked,
    matchLevel: 'exact',
    temporalWindow: bestRow.temporalWindow,
    sourceLabel: buildSourceLabel(bestRow.source as PISource, bestRow.n),
  };
}

/**
 * Batch benchmark queries — for Planning skill which needs multiple metrics at once.
 * Returns a map of metric → BenchmarkResult.
 */
export async function batchBenchmarkQuery(
  db: Database,
  baseQuery: Omit<BenchmarkQuery, 'metric'>,
  metrics: string[],
): Promise<Record<string, BenchmarkResult | null>> {
  const results: Record<string, BenchmarkResult | null> = {};
  await Promise.all(
    metrics.map(async (metric) => {
      results[metric] = await benchmarkQuery(db, { ...baseQuery, metric });
    }),
  );
  return results;
}
