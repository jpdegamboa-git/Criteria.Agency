/**
 * Strategist — Planning skill (DEC-090, DEC-101)
 *
 * "Where should we go and how do we get there?"
 *
 * Translates a diagnosis into a complete marketing plan.
 * Budget from product economics (DEC-101): margin × addressable market × expected CAC.
 *
 * Pipeline: Objectives → [G1: Financial viability] → Audiences → Value Prop →
 * [G2: Brand Guardian coherence] → Media Plan → Budget → [G3: Client approval always]
 *
 * G3 is always required — Strategist never executes a plan without client approval.
 * Model: Claude Sonnet, Tier A (DEC-149, DEC-174).
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
  and,
  eq,
  desc,
  brandDna,
  brandDnaArtifacts,
  brandHealthScores,
  strategicDiagnoses,
  clientIntelligence,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runAgentWithTools, MODELS } from '../ai.js';
import { loadPrompt } from '../prompt-loader.js';
import { batchBenchmarkQuery } from '../platform-intelligence/index.js';

// ── Output schemas ────────────────────────────────────────────────────────────

export const marketingPlanOutputSchema = z.object({
  objectives: z.array(z.object({
    type: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
    metric: z.string(),
    target: z.string(),
    rationale: z.string(),
  })).min(1),
  audiences: z.array(z.object({
    segment: z.string(),
    demographics: z.string(),
    motivation: z.string(),
    priority: z.enum(['primary', 'secondary', 'tertiary']),
    funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  })).min(1),
  valueProposition: z.object({
    headline: z.string(),
    supportingPoints: z.array(z.string()),
    differentiator: z.string(),
  }),
  mediaPlan: z.object({
    channels: z.array(z.object({
      channel: z.string(),
      type: z.enum(['paid', 'owned', 'earned']),
      rationale: z.string(),
      estimatedBudgetShare: z.number().min(0).max(100),
      primaryFunnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
    })),
    funnelMatrix: z.record(z.string(), z.array(z.string())),
    plannedCampaigns: z.number(),
  }),
  budgetAllocation: z.object({
    totalRecommended: z.number(),
    currency: z.string().default('USD'),
    rationale: z.string(),
    byChannel: z.array(z.object({
      channel: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })),
    byFunnelStage: z.array(z.object({
      stage: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })),
    economicsInputs: z.object({
      estimatedMargin: z.number().optional(),
      addressableMarket: z.number().optional(),
      expectedCac: z.number().optional(),
      targetNewCustomers: z.number().optional(),
      expectedRoi: z.number().optional(),
    }),
  }),
  calendar: z.object({
    periodStart: z.string(),
    periodEnd: z.string(),
    milestones: z.array(z.object({ date: z.string(), event: z.string() })),
  }),
  viabilityAssessment: z.object({
    financiallyViable: z.boolean(),
    financialNotes: z.string(),
    brandCoherent: z.boolean(),
    brandNotes: z.string(),
  }),
  proposedCampaigns: z.array(z.object({
    name: z.string(),
    concept: z.string(),
    funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
    channelType: z.enum(['paid', 'owned', 'earned']),
    primaryChannel: z.string(),
    suggestedBudget: z.number(),
    suggestedStartDate: z.string(),
    durationDays: z.number(),
    objective: z.string(),
    audienceSegment: z.string(),
    justification: z.string(),
    creativeSuggestion: z.string(),
    confidenceSource: z.enum(['history', 'industry', 'opportunity']).default('industry'),
    expectedKpis: z.record(z.string(), z.string()),
  })).min(1),
});

export type MarketingPlanOutput = z.infer<typeof marketingPlanOutputSchema>;

// ── Main skill function ───────────────────────────────────────────────────────

export interface RunPlanningOptions {
  db: Database;
  tenantId: string;
  diagnosisId?: string;
  periodMonths?: number;
  attemptNumber?: number;
}

export async function runPlanningSkill(opts: RunPlanningOptions): Promise<MarketingPlanOutput> {
  const { db, tenantId, diagnosisId, periodMonths = 3, attemptNumber = 1 } = opts;

  const promptConfig = await loadPrompt(db, 'strategist', 'planning');

  if (!promptConfig.approvedProviders.includes('anthropic')) {
    throw new Error('Strategist Planning must run on Tier A (Anthropic only — DEC-149)');
  }

  // Accumulator — agent calls produce_marketing_plan to set this
  let capturedPlan: MarketingPlanOutput | null = null;

  // Load diagnosis if available
  let diagnosisContext = '';
  if (diagnosisId) {
    const [diag] = await db
      .select()
      .from(strategicDiagnoses)
      .where(and(eq(strategicDiagnoses.id, diagnosisId), eq(strategicDiagnoses.organizationId, tenantId)))
      .limit(1);
    if (diag?.diagnosis) {
      diagnosisContext = `\n\nStrategic Diagnosis:\n${JSON.stringify(diag.diagnosis, null, 2)}`;
    }
  }

  const [dna] = await db
    .select()
    .from(brandDna)
    .where(eq(brandDna.organizationId, tenantId))
    .limit(1);

  const [bhs] = await db
    .select()
    .from(brandHealthScores)
    .where(eq(brandHealthScores.organizationId, tenantId))
    .orderBy(desc(brandHealthScores.calculatedAt))
    .limit(1);

  const [ci] = await db
    .select()
    .from(clientIntelligence)
    .where(eq(clientIntelligence.organizationId, tenantId))
    .limit(1);

  const piBenchmarks = await batchBenchmarkQuery(db, { industry: 'general', region: 'LATAM' }, [
    'ctr', 'cpm', 'cac', 'roas', 'engagement_rate',
  ]);

  const leaderAdjustment = attemptNumber > 3
    ? `\n\nLEADER ADJUSTMENT ACTIVE (attempt ${attemptNumber} of 6): Be more conservative with budget. Show explicit DEC-101 calculation. Ensure all channels align with Brand DNA.`
    : '';

  const systemPrompt = promptConfig.systemPrompt + leaderAdjustment;

  const tools = {
    get_brand_dna: tool({
      description: 'Read Brand DNA artifacts for positioning, audience, and verbal territory',
      inputSchema: z.object({
        layer: z.number().min(0).max(3).optional(),
      }),
      execute: async ({ layer }) => {
        const conditions = [
          eq(brandDnaArtifacts.organizationId, tenantId),
          eq(brandDnaArtifacts.status, 'validated'),
        ];
        if (layer !== undefined) conditions.push(eq(brandDnaArtifacts.layer, layer));
        const arts = await db.select().from(brandDnaArtifacts).where(and(...conditions)).limit(20);
        return arts.map((a) => ({ layer: a.layer, type: a.artifactType, content: a.content }));
      },
    }),

    get_pi_benchmark: tool({
      description: 'Query Platform Intelligence benchmarks for planning inputs (CAC, ROAS, channel performance)',
      inputSchema: z.object({
        metric: z.enum(['ctr', 'cpm', 'cpc', 'roas', 'engagement_rate', 'cac', 'conversion_rate']),
        industry: z.string(),
        channel: z.string().optional(),
        funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']).optional(),
        region: z.string().optional().default('LATAM'),
      }),
      execute: async ({ metric, industry, channel, funnelStage, region }) => {
        const { benchmarkQuery } = await import('../platform-intelligence/index.js');
        return benchmarkQuery(db, { metric, industry, channel, funnelStage, region });
      },
    }),

    produce_marketing_plan: tool({
      description: 'Submit the completed marketing plan with budget allocation, objectives, media plan, and proposed campaign briefs.',
      inputSchema: marketingPlanOutputSchema,
      execute: async (plan) => {
        capturedPlan = plan;
        return { accepted: true };
      },
    }),
  };

  const userMessage = `
Produce a marketing plan for this client covering the next ${periodMonths} months.
${diagnosisContext}

Brand DNA layer: ${dna?.currentLayer ?? 0}
Brand Health Score: ${bhs ? `Fundamentos ${bhs.fundamentos}, Total ${bhs.totalScore}` : 'Not calculated'}
Client Intelligence: ${ci ? `${(ci.insights as unknown[]).length} insights accumulated` : 'None yet'}

Available PI benchmarks (general LATAM):
${JSON.stringify(piBenchmarks, null, 2)}

Follow the planning pipeline: objectives → audiences → value prop → media plan → budget (DEC-101) → proposed campaign briefs.
Assess G1 (financial viability) and G2 (brand coherence) in your output.
Call produce_marketing_plan with the complete plan.
`.trim();

  await runAgentWithTools({
    ctx: { agentId: 'strategist', skillId: 'planning', tenantId },
    model: MODELS.sonnet,
    system: systemPrompt,
    prompt: userMessage,
    tools,
    maxSteps: 15,
  });

  if (!capturedPlan) {
    throw new Error('Agent did not call produce_marketing_plan — output incomplete');
  }

  const parsed = marketingPlanOutputSchema.safeParse(capturedPlan);
  if (!parsed.success) {
    throw new Error(`Marketing plan schema validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}
