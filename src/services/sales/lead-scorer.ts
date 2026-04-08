import { eq, and, lt, sql } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { generateText } from "../../providers/generate-text.js";
import {
  type LeadScore,
  type ScoreComponent,
  SCORE_CAPS,
  classifyTier,
} from "./types.js";

// ── Default Rules ──

interface ScoringRule {
  component: ScoreComponent;
  signal: string;
  points: number;
  condition: Record<string, unknown> | null;
  enabled: boolean;
}

export function getDefaultRules(): ScoringRule[] {
  return [
    // Fit (cap: 40)
    { component: "fit", signal: "industry_match",    points: 10, condition: null, enabled: true },
    { component: "fit", signal: "company_size_icp",  points: 10, condition: null, enabled: true },
    { component: "fit", signal: "budget_indicated",  points: 10, condition: null, enabled: true },
    { component: "fit", signal: "region_match",      points: 10, condition: null, enabled: true },

    // Intent (cap: 30)
    { component: "intent", signal: "website_visit_7d",      points: 5,  condition: null, enabled: true },
    { component: "intent", signal: "email_opened_7d",        points: 5,  condition: null, enabled: true },
    { component: "intent", signal: "content_downloaded",     points: 10, condition: null, enabled: true },
    { component: "intent", signal: "pricing_page_visited",   points: 10, condition: null, enabled: true },

    // Authority (cap: 15)
    { component: "authority", signal: "c_level_vp",             points: 15, condition: null, enabled: true },
    { component: "authority", signal: "director_manager",        points: 10, condition: null, enabled: true },
    { component: "authority", signal: "individual_contributor",  points: 5,  condition: null, enabled: true },

    // Timing (cap: 15)
    { component: "timing", signal: "expressed_urgency", points: 15, condition: null, enabled: true },
    { component: "timing", signal: "budget_cycle",      points: 10, condition: null, enabled: true },
    { component: "timing", signal: "recent_funding",    points: 5,  condition: null, enabled: true },
  ];
}

// ── DB Rule type ──

interface DbScoringRule {
  component: string;
  signal: string;
  points: number;
  condition: unknown;
  enabled: boolean;
}

// ── Scoring Rule CRUD ──

export async function getScoringRules(clientId: string): Promise<ScoringRule[]> {
  const rows = await db
    .select()
    .from(schema.scoringRules)
    .where(eq(schema.scoringRules.clientId, clientId));

  if (rows.length === 0) return getDefaultRules();

  return rows.map((r: DbScoringRule) => ({
    component: r.component as ScoreComponent,
    signal: r.signal,
    points: r.points,
    condition: (r.condition as Record<string, unknown> | null) ?? null,
    enabled: r.enabled,
  }));
}

export async function upsertScoringRules(
  clientId: string,
  rules: Array<{ component: ScoreComponent; signal: string; points: number; condition?: Record<string, unknown> | null; enabled?: boolean }>,
): Promise<void> {
  await db
    .delete(schema.scoringRules)
    .where(eq(schema.scoringRules.clientId, clientId));

  if (rules.length === 0) return;

  await db.insert(schema.scoringRules).values(
    rules.map((r) => ({
      clientId,
      component: r.component,
      signal: r.signal,
      points: r.points,
      condition: r.condition ?? null,
      enabled: r.enabled ?? true,
    })),
  );
}

// ── Condition Matching ──

function ruleMatches(rule: ScoringRule, leadData: Record<string, unknown>): boolean {
  if (!rule.enabled) return false;

  const condition = rule.condition;

  // No condition: match if the signal field is truthy in leadData
  if (!condition || Object.keys(condition).length === 0) {
    return Boolean(leadData[rule.signal]);
  }

  // Condition is key-value map: all pairs must match leadData
  for (const [key, value] of Object.entries(condition)) {
    if (leadData[key] !== value) return false;
  }
  return true;
}

// ── Score Lead ──

export async function scoreLead(
  clientId: string,
  leadData: Record<string, unknown>,
): Promise<LeadScore> {
  const rules = await getScoringRules(clientId);

  const rawComponents: Record<ScoreComponent, number> = {
    fit: 0,
    intent: 0,
    authority: 0,
    timing: 0,
  };

  for (const rule of rules) {
    if (ruleMatches(rule, leadData)) {
      rawComponents[rule.component] += rule.points;
    }
  }

  const capped: Record<ScoreComponent, number> = {
    fit:       Math.min(rawComponents.fit,       SCORE_CAPS.fit),
    intent:    Math.min(rawComponents.intent,    SCORE_CAPS.intent),
    authority: Math.min(rawComponents.authority, SCORE_CAPS.authority),
    timing:    Math.min(rawComponents.timing,    SCORE_CAPS.timing),
  };

  const total = capped.fit + capped.intent + capped.authority + capped.timing;
  const tier = classifyTier(total);

  const reasoning = await generateText(
    "claude-3-5-haiku-20241022",
    "You are a B2B sales scoring assistant. Provide a concise 1-2 sentence explanation for a lead's score.",
    `Lead data: ${JSON.stringify(leadData)}. Score breakdown: fit=${capped.fit}, intent=${capped.intent}, authority=${capped.authority}, timing=${capped.timing}. Total=${total}. Tier=${tier}.`,
    200,
  );

  return {
    total,
    components: capped,
    tier,
    reasoning,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Rescore Lead from DB ──

export async function rescoreLead(clientId: string, leadId: string): Promise<LeadScore> {
  const rows = await db
    .select()
    .from(schema.leads)
    .where(and(eq(schema.leads.id, leadId), eq(schema.leads.clientId, clientId)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error(`Lead ${leadId} not found for client ${clientId}`);
  }

  const lead = rows[0];
  const leadData: Record<string, unknown> = {
    ...((lead.enrichmentData as Record<string, unknown>) ?? {}),
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    title: lead.title,
    source: lead.source,
  };

  const score = await scoreLead(clientId, leadData);

  // Map tier to classification (DB enum: hot | warm | cold; unqualified → cold)
  const classification: "hot" | "warm" | "cold" =
    score.tier === "unqualified" ? "cold" : score.tier;

  await db
    .update(schema.leads)
    .set({
      fitScore: score.components.fit,
      intentScore: score.components.intent,
      bantScore: { authority: score.components.authority, timing: score.components.timing },
      totalScore: score.total,
      classification,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.leads.id, leadId), eq(schema.leads.clientId, clientId)));

  return score;
}

// ── Score Decay ──

export async function applyScoreDecay(clientId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const staleLeads = await db
    .select()
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.clientId, clientId),
        lt(schema.leads.updatedAt, sevenDaysAgo),
        sql`${schema.leads.totalScore} > 0`,
        sql`${schema.leads.status} NOT IN ('won', 'lost')`,
      ),
    );

  let updated = 0;

  for (const lead of staleLeads) {
    const currentScore = lead.totalScore ?? 0;
    const newScore = Math.max(0, currentScore - 2);
    const newTier = classifyTier(newScore);
    const classification: "hot" | "warm" | "cold" =
      newTier === "unqualified" ? "cold" : newTier;

    await db
      .update(schema.leads)
      .set({
        totalScore: newScore,
        classification,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, lead.id));

    updated++;
  }

  return updated;
}
