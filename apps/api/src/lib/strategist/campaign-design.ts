/**
 * Strategist — Campaign Design skill (DEC-090, DEC-098)
 *
 * "What specific play do we run?"
 *
 * Designs a specific campaign with a pre-configured brief ready for client review.
 * "Everything pre-filled, everything editable. Client edits, never creates from scratch."
 *
 * Three origins: plan | opportunity | optimization.
 * Closes the Strategist → Video Motor brief pipeline when requiresVideo=true.
 *
 * Gates:
 *   G4: Strategist self-evaluation (internal, required to pass)
 *   G5: Showrunner coherence (post-Creative Director — deferred to Fase 5)
 *   G6: Client approval — ALWAYS required (DEC-096)
 *
 * Model: Claude Sonnet, Tier A (DEC-149, DEC-174).
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
  and,
  eq,
  brandDnaArtifacts,
  marketingPlans,
  clientIntelligence,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runAgentWithTools, MODELS } from '../ai.js';
import { loadPrompt } from '../prompt-loader.js';
import { benchmarkQuery } from '../platform-intelligence/index.js';

// ── Output schema ─────────────────────────────────────────────────────────────

export const campaignBriefSchema = z.object({
  name: z.string(),
  concept: z.string().max(200),
  objective: z.object({
    type: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
    metric: z.string(),
    target: z.string(),
  }),
  funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  channelType: z.enum(['paid', 'owned', 'earned']),
  audiences: z.array(z.object({
    segment: z.string(),
    motivation: z.string(),
    priority: z.enum(['primary', 'secondary']),
  })).min(1),
  channels: z.array(z.object({
    channel: z.string(),
    justification: z.string(),
    format: z.string(),
  })).min(1),
  funnelMatrixDistribution: z.record(z.string(), z.array(z.string())),
  budget: z.object({
    suggested: z.number(),
    min: z.number(),
    max: z.number(),
    currency: z.string().default('USD'),
    rationale: z.string(),
  }),
  calendar: z.object({
    startDate: z.string(),
    durationDays: z.number(),
    milestones: z.array(z.object({ date: z.string(), event: z.string() })),
  }),
  expectedKpis: z.record(z.string(), z.string()),
  justification: z.string(),
  confidenceSource: z.enum(['history', 'industry', 'opportunity']).default('industry'),
  creativeSuggestion: z.object({
    numberOfVersions: z.number().min(1).max(5).default(2),
    angles: z.array(z.string()),
    formats: z.array(z.string()),
    toneGuidance: z.string(),
    requiresVideo: z.boolean().default(false),
    videoBriefSummary: z.string().optional(),
  }),
  g4Assessment: z.object({
    advancesPlanObjectives: z.boolean(),
    alignsWithBrandDna: z.boolean(),
    isTimingAppropriate: z.boolean(),
    reasoning: z.string(),
  }),
  source: z.enum(['plan', 'opportunity', 'optimization']).default('plan'),
  planId: z.string().uuid().optional(),
});

export type CampaignBriefOutput = z.infer<typeof campaignBriefSchema>;

// ── Main skill function ───────────────────────────────────────────────────────

export interface RunCampaignDesignOptions {
  db: Database;
  tenantId: string;
  source: 'plan' | 'opportunity' | 'optimization';
  planId?: string;
  opportunityContext?: string;
  optimizationContext?: string;
  funnelStage?: 'awareness' | 'consideration' | 'conversion' | 'retention';
  channelType?: 'paid' | 'owned' | 'earned';
  attemptNumber?: number;
}

export async function runCampaignDesignSkill(opts: RunCampaignDesignOptions): Promise<CampaignBriefOutput> {
  const {
    db,
    tenantId,
    source,
    planId,
    opportunityContext,
    optimizationContext,
    funnelStage,
    channelType,
    attemptNumber = 1,
  } = opts;

  const promptConfig = await loadPrompt(db, 'strategist', 'campaign-design');

  if (!promptConfig.approvedProviders.includes('anthropic')) {
    throw new Error('Strategist Campaign Design must run on Tier A (Anthropic only — DEC-149)');
  }

  // Accumulator — agent calls produce_campaign_brief to set this
  let capturedBrief: CampaignBriefOutput | null = null;

  // Load Marketing Plan context if from plan
  let planContext = '';
  if (planId) {
    const [plan] = await db
      .select()
      .from(marketingPlans)
      .where(and(eq(marketingPlans.id, planId), eq(marketingPlans.organizationId, tenantId)))
      .limit(1);

    if (plan) {
      planContext = `\n\nMarketing Plan context:\nObjectives: ${JSON.stringify(plan.objectives)}\nAudiences: ${JSON.stringify(plan.audiences)}\nMedia Plan: ${JSON.stringify(plan.mediaPlan)}\nBudget: ${JSON.stringify(plan.budgetAllocation)}`;
      if (funnelStage) planContext += `\nTarget funnel stage: ${funnelStage}`;
      if (channelType) planContext += `\nTarget channel type: ${channelType}`;
    }
  }

  const leaderAdjustment = attemptNumber > 3
    ? `\n\nLEADER ADJUSTMENT (attempt ${attemptNumber} of 6): Be more specific. G4 must pass. Show explicit rationale for each channel and budget.`
    : '';

  const systemPrompt = promptConfig.systemPrompt + leaderAdjustment;

  const tools = {
    get_brand_dna: tool({
      description: 'Read Brand DNA for tone, audience, positioning',
      inputSchema: z.object({
        artifactType: z.string().optional(),
      }),
      execute: async ({ artifactType }) => {
        const conditions = [
          eq(brandDnaArtifacts.organizationId, tenantId),
          eq(brandDnaArtifacts.status, 'validated'),
        ];
        if (artifactType) conditions.push(eq(brandDnaArtifacts.artifactType, artifactType));
        const arts = await db.select().from(brandDnaArtifacts).where(and(...conditions)).limit(15);
        return arts.map((a) => ({ layer: a.layer, type: a.artifactType, content: a.content }));
      },
    }),

    get_client_intelligence: tool({
      description: 'Read private learnings from this client\'s past campaigns',
      inputSchema: z.object({}),
      execute: async () => {
        const [c] = await db.select().from(clientIntelligence).where(eq(clientIntelligence.organizationId, tenantId)).limit(1);
        return c ? { insights: c.insights } : { insights: [] };
      },
    }),

    get_pi_benchmark: tool({
      description: 'Query Platform Intelligence for expected KPIs',
      inputSchema: z.object({
        metric: z.enum(['ctr', 'cpm', 'cpc', 'roas', 'engagement_rate', 'cac', 'conversion_rate']),
        industry: z.string(),
        channel: z.string().optional(),
        funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']).optional(),
      }),
      execute: async ({ metric, industry, channel, funnelStage }) => {
        return benchmarkQuery(db, { metric, industry, channel, funnelStage, region: 'LATAM' });
      },
    }),

    produce_campaign_brief: tool({
      description: 'Submit the completed pre-configured campaign brief.',
      inputSchema: campaignBriefSchema,
      execute: async (brief) => {
        if (!brief.g4Assessment.advancesPlanObjectives || !brief.g4Assessment.alignsWithBrandDna) {
          return {
            accepted: false,
            reason: 'G4 failed: does not advance plan objectives or contradicts Brand DNA. Revise.',
          };
        }
        capturedBrief = brief;
        return { accepted: true };
      },
    }),
  };

  const contextBlock = source === 'opportunity'
    ? `\nOpportunity: ${opportunityContext}`
    : source === 'optimization'
    ? `\nOptimization context: ${optimizationContext}`
    : '';

  const userMessage = `
Design a pre-configured campaign brief.
Source: ${source}${contextBlock}
${planContext}

Instructions:
1. Read Brand DNA (get_brand_dna)
2. Read Client Intelligence (get_client_intelligence)
3. Query PI for expected KPIs (get_pi_benchmark)
4. Design the campaign with all fields pre-filled
5. Perform G4 self-evaluation
6. Call produce_campaign_brief

Everything must be pre-filled with strategic logic.
`.trim();

  await runAgentWithTools({
    ctx: { agentId: 'strategist', skillId: 'campaign-design', tenantId },
    model: MODELS.sonnet,
    system: systemPrompt,
    prompt: userMessage,
    tools,
    maxSteps: 12,
  });

  if (!capturedBrief) {
    throw new Error('Agent did not produce an accepted campaign brief — G4 may have failed or produce_campaign_brief was not called');
  }

  const parsed = campaignBriefSchema.safeParse(capturedBrief);
  if (!parsed.success) {
    throw new Error(`Campaign brief schema validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}
