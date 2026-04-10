/**
 * Strategist — Diagnostic skill (DEC-090)
 *
 * "Where are we and what does it mean?"
 *
 * The Analyst processed the data. The Strategist interprets it strategically.
 * This skill consumes Analyst Interface 2 (processed diagnostics) and produces
 * a Strategic Diagnosis: where we are, what's working, what's not, what changed,
 * opportunity, and risk.
 *
 * Frameworks: M1 (value chain, market position), M2 (3Cs), contextual SWOT.
 * Model: Claude Sonnet, Tier A — Anthropic only (DEC-149). Strategist is confidential.
 * Pattern: agent with tools (complex task — DEC-141).
 * Prompts from: prompt_registry, agent="strategist", skill="diagnostic".
 *
 * 3+3 rule applies (DEC-096):
 * - 3 normal attempts → 3 with leader adjustment → human escalation
 * Diagnostic has no formal gate (it's a reading skill, not production — see spec §6),
 * but iteration still applies if the agent fails to produce a structured output.
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
  and,
  eq,
  desc,
  organizationSettings,
  brandDna,
  brandDnaArtifacts,
  brandHealthScores,
  campaigns,
  thresholdAlerts,
  clientIntelligence,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runAgentWithTools, MODELS } from '../ai.js';
import { loadPrompt } from '../prompt-loader.js';
import { benchmarkQuery } from '../platform-intelligence/index.js';

// ── Output schema ─────────────────────────────────────────────────────────────

export const diagnosisSchema = z.object({
  whereWeAre: z.string().describe('Concise situational reading of the current state'),
  whatsWorking: z.array(z.string()).describe('What is performing well and why'),
  whatsNot: z.array(z.string()).describe('What is underperforming and the underlying reason'),
  whatChanged: z.string().describe('Notable changes since last diagnostic or since onboarding'),
  opportunity: z.string().describe('The most actionable opportunity identified'),
  risk: z.string().describe('The most material risk that needs attention'),
  bhsContext: z.object({
    fundamentos: z.number(),
    ejecucion: z.number().nullable(),
    oportunidad: z.number().nullable(),
    interpretation: z.string(),
  }).optional(),
  recommendsNewPlan: z.boolean().default(false),
  planRationale: z.string().optional(),
});

export type DiagnosisOutput = z.infer<typeof diagnosisSchema>;

// ── Main skill function ───────────────────────────────────────────────────────

export interface RunDiagnosticOptions {
  db: Database;
  tenantId: string;
  triggeredBy: string;
  attemptNumber?: number;
}

export async function runDiagnosticSkill(opts: RunDiagnosticOptions): Promise<DiagnosisOutput> {
  const { db, tenantId, triggeredBy, attemptNumber = 1 } = opts;

  // Load system prompt from registry (DEC-145)
  const promptConfig = await loadPrompt(db, 'strategist', 'diagnostic');

  // Verify Tier A (DEC-149)
  if (!promptConfig.approvedProviders.includes('anthropic')) {
    throw new Error('Strategist Diagnostic must run on Tier A (Anthropic only — DEC-149)');
  }

  // Leader adjustment on attempts 4-6 (3+3 rule)
  const leaderAdjustment =
    attemptNumber > 3
      ? `\n\nLEADER ADJUSTMENT ACTIVE (attempt ${attemptNumber} of 6): Previous outputs lacked strategic depth or proper structure. Be more decisive. Name the specific problems and opportunities clearly. Fill every field of the diagnosis schema.`
      : '';

  const systemPrompt = promptConfig.systemPrompt + leaderAdjustment;

  // Accumulator — the agent calls produce_diagnosis to set this
  let capturedDiagnosis: DiagnosisOutput | null = null;

  // Build analyst context for initial message
  const [bhs] = await db
    .select()
    .from(brandHealthScores)
    .where(eq(brandHealthScores.organizationId, tenantId))
    .orderBy(desc(brandHealthScores.calculatedAt))
    .limit(1);

  const openAlerts = await db
    .select()
    .from(thresholdAlerts)
    .where(and(eq(thresholdAlerts.organizationId, tenantId), eq(thresholdAlerts.status, 'open')))
    .orderBy(desc(thresholdAlerts.createdAt))
    .limit(10);

  const [dna] = await db
    .select()
    .from(brandDna)
    .where(eq(brandDna.organizationId, tenantId))
    .limit(1);

  // Tools the Strategist can call during diagnosis
  const tools = {
    get_brand_dna: tool({
      description: 'Read the client\'s Brand DNA artifacts to understand brand identity, positioning, and audience',
      inputSchema: z.object({
        layer: z.number().min(0).max(3).optional().describe('Filter by layer (0-3). Omit for all.'),
        artifactType: z.string().optional().describe('Filter by artifact type. Omit for all.'),
      }),
      execute: async ({ layer, artifactType }) => {
        const conditions = [eq(brandDnaArtifacts.organizationId, tenantId)];
        if (layer !== undefined) conditions.push(eq(brandDnaArtifacts.layer, layer));
        if (artifactType) conditions.push(eq(brandDnaArtifacts.artifactType, artifactType));

        const arts = await db
          .select()
          .from(brandDnaArtifacts)
          .where(and(...conditions))
          .limit(20);

        return arts.map((a) => ({
          layer: a.layer,
          type: a.artifactType,
          status: a.status,
          content: a.content,
        }));
      },
    }),

    get_campaign_performance: tool({
      description: 'Read active campaign performance data and open threshold alerts',
      inputSchema: z.object({
        status: z.enum(['execution', 'definition', 'production', 'completed']).optional(),
      }),
      execute: async ({ status }) => {
        const conditions = [eq(campaigns.organizationId, tenantId)];
        if (status) conditions.push(eq(campaigns.status, status));

        const cmpns = await db
          .select()
          .from(campaigns)
          .where(and(...conditions))
          .limit(10);

        const alerts = await db
          .select()
          .from(thresholdAlerts)
          .where(and(eq(thresholdAlerts.organizationId, tenantId), eq(thresholdAlerts.status, 'open')))
          .orderBy(desc(thresholdAlerts.createdAt))
          .limit(20);

        return { campaigns: cmpns, alerts };
      },
    }),

    get_client_intelligence: tool({
      description: 'Read accumulated private learnings from this client\'s past campaigns',
      inputSchema: z.object({}),
      execute: async () => {
        const [ci] = await db
          .select()
          .from(clientIntelligence)
          .where(eq(clientIntelligence.organizationId, tenantId))
          .limit(1);
        return ci ? { insights: ci.insights, version: ci.version } : { insights: [], version: 0 };
      },
    }),

    get_pi_benchmark: tool({
      description: 'Query Platform Intelligence for industry benchmarks. Returns reference values with data quality metadata.',
      inputSchema: z.object({
        metric: z.enum(['ctr', 'cpm', 'cpc', 'roas', 'engagement_rate', 'cac', 'conversion_rate']),
        industry: z.string().describe('Client industry (e.g., restaurants, ecommerce, fitness)'),
        channel: z.string().optional(),
        funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']).optional(),
        region: z.string().optional().default('LATAM'),
      }),
      execute: async ({ metric, industry, channel, funnelStage, region }) => {
        return benchmarkQuery(db, { metric, industry, channel, funnelStage, region });
      },
    }),

    produce_diagnosis: tool({
      description: 'Submit the completed strategic diagnosis. Call this once you have a complete read of the situation.',
      inputSchema: diagnosisSchema,
      execute: async (diagnosis) => {
        capturedDiagnosis = diagnosis;
        return { accepted: true };
      },
    }),
  };

  const userMessage = `
Produce a strategic diagnosis for this client.

Triggered by: ${triggeredBy}

Brand Health Score:
${bhs ? JSON.stringify({ fundamentos: bhs.fundamentos, ejecucion: bhs.ejecucion, oportunidad: bhs.oportunidad, total: bhs.totalScore }) : 'Not yet calculated'}

Active open alerts: ${openAlerts.length}
${openAlerts.length > 0 ? JSON.stringify(openAlerts.map((a) => ({ type: a.alertType, severity: a.severity, metric: a.metric, deviation: a.deviationPct }))) : ''}

Brand DNA layer: ${dna?.currentLayer ?? 'not started'}

Use your tools to read Brand DNA, campaign performance, and Client Intelligence as needed. Then call produce_diagnosis with the complete diagnosis.
`.trim();

  await runAgentWithTools({
    ctx: { agentId: 'strategist', skillId: 'diagnostic', tenantId },
    model: MODELS.sonnet,
    system: systemPrompt,
    prompt: userMessage,
    tools,
    maxSteps: 10,
  });

  if (!capturedDiagnosis) {
    throw new Error('Agent did not call produce_diagnosis — output incomplete');
  }

  const parsed = diagnosisSchema.safeParse(capturedDiagnosis);
  if (!parsed.success) {
    throw new Error(`Diagnosis schema validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}
