/**
 * Web Motor Pipeline — Fase 2 (DEC-222)
 *
 * Inngest orchestration for the full web production pipeline.
 * 7 steps, 3 quality gates, 3+3 iteration rule per gate.
 *
 * Pipeline sequence (spec §3.1):
 *   BRIEF → CD (Web Direction) → WRITER (Web Copy) → [G1: concept+text+cost] →
 *   DESIGNER (Web Design) → [G2: visual design] →
 *   WEB DEV → QA → [G3: site functioning] → DEPLOY
 *
 * Agent model assignments (DEC-174):
 *   Opus   — Creative Director (highest creative judgment)
 *   Sonnet — Writer, Designer, Web Developer, Brand Guardian
 *
 * All agents are Tier A — Anthropic only (DEC-149, uses Brand DNA).
 * System prompts loaded from prompt_registry — never hardcoded (DEC-145).
 * Only IDs/references stored in step state — sensitive data read fresh (DEC-148).
 *
 * 3+3 rule per gate (spec §5.3):
 *   Attempts 1-3: normal executor retry (CD + BG feedback)
 *   Attempts 4-6: leader adjustment — CD re-invoked, then executor retries
 *   After attempt 6: human escalation
 *
 * Gates (spec §5.1):
 *   G1 after Copy    — CD evaluates concept+copy quality; BG evaluates textual voice
 *   G2 after Design  — CD evaluates visual coherence; BG evaluates visual identity
 *   G3 after Dev+QA  — QA system functions + CD visual verification (no BG per DEC-223)
 */

import { z } from 'zod';
import { tool } from 'ai';
import { inngest } from '../../client.js';
import {
  eq,
  and,
  desc,
  organizationSettings,
  brandDna,
  brandDnaArtifacts,
  outputRegistry,
  webProjects,
  webArtifacts,
  webGateResults,
  webIterationTracking,
  webPages,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { classifyText, runAgentWithTools, MODELS } from '../../../lib/ai.js';
import { loadPrompt } from '../../../lib/prompt-loader.js';

// ── Event schema ──────────────────────────────────────────────────────────────

const pipelineStartedSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  projectId: z.string().uuid('projectId must be a UUID'),
});

export type WebMotorPipelineEventData = z.infer<typeof pipelineStartedSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

type CDVerdict = 'advance' | 'iterate';
type BrandGuardianVerdict = 'pass' | 'warning' | 'fail';
type GateVerdict = 'advance' | 'iterate' | 'escalate';

interface GateEvalResult {
  verdict: GateVerdict;
  cdVerdict: CDVerdict;
  cdReasoning: string;
  cdFeedback: Record<string, unknown>;
  bgVerdict: BrandGuardianVerdict | null;
  bgReasoning: string;
  bgFixGuidance: string;
  gateResultId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadPromptWithFallback(
  db: Database,
  agentId: string,
  skillId: string,
  fallbackPrompt: string,
): Promise<string> {
  try {
    const config = await loadPrompt(db, agentId, skillId);
    return config.systemPrompt;
  } catch {
    console.warn(`[web-motor] No prompt in registry for ${agentId}/${skillId} — using fallback`);
    return fallbackPrompt;
  }
}

/**
 * Combined gate verdict from CD + Brand Guardian (spec §5.1 evaluation matrix).
 * G3 passes null for bgVerdict (no Brand Guardian at Gate 3, DEC-223).
 */
function computeGateVerdict(cd: CDVerdict, bg: BrandGuardianVerdict | null): GateVerdict {
  if (cd === 'advance' && (bg === null || bg === 'pass' || bg === 'warning')) return 'advance';
  return 'iterate';
}

async function runCDEval(
  db: Database,
  tenantId: string,
  projectId: string,
  skillId: string,
  artifactContext: string,
  fallbackPrompt: string,
): Promise<{ verdict: CDVerdict; reasoning: string; feedback: Record<string, unknown> }> {
  const systemPrompt = await loadPromptWithFallback(db, 'creative-director', skillId, fallbackPrompt);

  const result = await classifyText({
    ctx: { agentId: 'creative-director', skillId, tenantId },
    model: MODELS.opus,
    system: systemPrompt,
    prompt: `Project ID: ${projectId}\n\nEvaluate the artifact and respond with JSON:\n{"verdict":"advance|iterate","reasoning":"...","feedback":{}}\n\nArtifact:\n${artifactContext}`,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        verdict?: string;
        reasoning?: string;
        feedback?: Record<string, unknown>;
      };
      const verdict = (parsed.verdict === 'advance') ? 'advance' : 'iterate';
      return { verdict, reasoning: parsed.reasoning ?? result.text, feedback: parsed.feedback ?? {} };
    }
  } catch { /* fall through */ }

  const verdict: CDVerdict = result.text.toLowerCase().includes('advance') ? 'advance' : 'iterate';
  return { verdict, reasoning: result.text, feedback: {} };
}

async function runBrandGuardianEval(
  db: Database,
  tenantId: string,
  projectId: string,
  skillId: string,
  artifactContext: string,
  brandDnaContext: string,
  fallbackPrompt: string,
): Promise<{ verdict: BrandGuardianVerdict; reasoning: string; fixGuidance: string }> {
  const systemPrompt = await loadPromptWithFallback(db, 'brand-guardian', skillId, fallbackPrompt);

  const result = await classifyText({
    ctx: { agentId: 'brand-guardian', skillId, tenantId },
    model: MODELS.sonnet,
    system: systemPrompt,
    prompt: `Project ID: ${projectId}\n\nBrand DNA:\n${brandDnaContext}\n\nEvaluate brand consistency and respond with JSON:\n{"verdict":"pass|warning|fail","reasoning":"...","fixGuidance":"..."}\n\nArtifact:\n${artifactContext}`,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        verdict?: string;
        reasoning?: string;
        fixGuidance?: string;
      };
      const v = parsed.verdict ?? '';
      const verdict: BrandGuardianVerdict = (['pass', 'warning', 'fail'].includes(v))
        ? (v as BrandGuardianVerdict) : 'warning';
      return { verdict, reasoning: parsed.reasoning ?? result.text, fixGuidance: parsed.fixGuidance ?? '' };
    }
  } catch { /* fall through */ }

  const text = result.text.toLowerCase();
  const verdict: BrandGuardianVerdict = text.includes('fail') ? 'fail' : text.includes('pass') ? 'pass' : 'warning';
  return { verdict, reasoning: result.text, fixGuidance: '' };
}

async function loadBrandDnaContext(db: Database, tenantId: string): Promise<string> {
  const artifacts = await db
    .select({ artifactType: brandDnaArtifacts.artifactType, content: brandDnaArtifacts.content, layer: brandDnaArtifacts.layer })
    .from(brandDnaArtifacts)
    .where(eq(brandDnaArtifacts.organizationId, tenantId))
    .limit(20);

  if (artifacts.length === 0) return 'No Brand DNA available yet.';
  return artifacts.map((a) => `[${a.artifactType} / Layer ${a.layer}]: ${JSON.stringify(a.content)}`).join('\n');
}

async function loadLatestArtifact(
  db: Database,
  projectId: string,
  step: string,
): Promise<string> {
  const [artifact] = await db
    .select({ content: webArtifacts.content, version: webArtifacts.version })
    .from(webArtifacts)
    .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, step)))
    .orderBy(desc(webArtifacts.version))
    .limit(1);
  if (!artifact) return `No artifact found for step "${step}"`;
  return JSON.stringify(artifact.content);
}

async function saveWebArtifact(
  db: Database,
  params: {
    projectId: string;
    organizationId: string;
    pageId?: string;
    step: string;
    artifactType: string;
    version: number;
    gateIteration: number;
    content: Record<string, unknown>;
  },
): Promise<string> {
  const [inserted] = await db
    .insert(webArtifacts)
    .values(params)
    .returning({ id: webArtifacts.id });
  return inserted.id;
}

async function updateProjectStatus(db: Database, projectId: string, status: string, currentStep: string): Promise<void> {
  await db.update(webProjects).set({ status, currentStep }).where(eq(webProjects.id, projectId));
}

async function insertGateResult(
  db: Database,
  params: {
    projectId: string;
    organizationId: string;
    gateNumber: number;
    iterationNumber: number;
    cdVerdict: string;
    cdReasoning: string;
    cdFeedback: Record<string, unknown>;
    bgVerdict?: string | null;
    bgReasoning?: string;
    bgFixGuidance?: string;
    qaReport?: Record<string, unknown>;
    combinedVerdict: string;
  },
): Promise<string> {
  const [inserted] = await db
    .insert(webGateResults)
    .values({
      ...params,
      bgVerdict: params.bgVerdict ?? null,
      bgReasoning: params.bgReasoning ?? null,
      bgFixGuidance: params.bgFixGuidance ?? null,
      qaReport: params.qaReport ?? {},
      resolvedAt: new Date(),
    })
    .returning({ id: webGateResults.id });
  return inserted.id;
}

async function upsertIterationTracking(
  db: Database,
  params: {
    projectId: string;
    organizationId: string;
    gateNumber: number;
    attemptCount: number;
    leaderAdjustmentActive: boolean;
    escalated: boolean;
  },
): Promise<void> {
  const existing = await db
    .select({ id: webIterationTracking.id })
    .from(webIterationTracking)
    .where(and(
      eq(webIterationTracking.projectId, params.projectId),
      eq(webIterationTracking.gateNumber, params.gateNumber),
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(webIterationTracking)
      .set({
        attemptCount: params.attemptCount,
        leaderAdjustmentActive: params.leaderAdjustmentActive,
        escalated: params.escalated,
        escalatedAt: params.escalated ? new Date() : undefined,
      })
      .where(eq(webIterationTracking.id, existing[0].id));
  } else {
    await db.insert(webIterationTracking).values(params);
  }
}

// ── Gate runner (generic 3+3, spec §5.3) ─────────────────────────────────────

/**
 * Generic gate runner implementing the 3+3 rule.
 *
 * @param includesBrandGuardian - G1 and G2 use BG; G3 does not (DEC-223)
 * @param getArtifactContext    - loads the current artifact for evaluation
 * @param runExecutor           - re-runs the producing agent with feedback
 * @param runLeaderAdjustment   - re-invokes CD to adjust creative direction (attempts 4-6)
 */
async function runGate(
  // biome-ignore lint/suspicious/noExplicitAny: Inngest step type
  step: any,
  db: Database,
  tenantId: string,
  projectId: string,
  organizationId: string,
  gateNumber: number,
  cdSkillId: string,
  bgSkillId: string | null,
  cdFallback: string,
  bgFallback: string,
  includesBrandGuardian: boolean,
  getArtifactContext: () => Promise<string>,
  runExecutor: (attempt: number, feedback: GateEvalResult | null) => Promise<void>,
  runLeaderAdjustment: (attempt: number, reason: string) => Promise<void>,
  escalateStatus: string,
): Promise<{ passed: boolean; escalated: boolean }> {
  let passed = false;
  let attempts = 0;
  let lastEval: GateEvalResult | null = null;

  while (!passed && attempts < 6) {
    attempts++;

    // Evaluate gate
    const evalResult: GateEvalResult = await step.run(
      `gate-${gateNumber}-eval-attempt-${attempts}`,
      async () => {
        const artifactContext = await getArtifactContext();
        const brandDnaContext = includesBrandGuardian ? await loadBrandDnaContext(db, tenantId) : '';

        const [cdResult, bgResult] = await Promise.all([
          runCDEval(db, tenantId, projectId, cdSkillId, artifactContext, cdFallback),
          includesBrandGuardian && bgSkillId
            ? runBrandGuardianEval(db, tenantId, projectId, bgSkillId, artifactContext, brandDnaContext, bgFallback)
            : Promise.resolve(null),
        ]);

        const bgVerdict = bgResult ? bgResult.verdict : null;
        const combinedVerdict = computeGateVerdict(cdResult.verdict, bgVerdict);

        const gateResultId = await insertGateResult(db, {
          projectId,
          organizationId,
          gateNumber,
          iterationNumber: attempts,
          cdVerdict: cdResult.verdict,
          cdReasoning: cdResult.reasoning,
          cdFeedback: cdResult.feedback,
          bgVerdict,
          bgReasoning: bgResult?.reasoning,
          bgFixGuidance: bgResult?.fixGuidance,
          combinedVerdict,
        });

        await upsertIterationTracking(db, {
          projectId,
          organizationId,
          gateNumber,
          attemptCount: attempts,
          leaderAdjustmentActive: attempts >= 4,
          escalated: false,
        });

        return {
          verdict: combinedVerdict,
          cdVerdict: cdResult.verdict,
          cdReasoning: cdResult.reasoning,
          cdFeedback: cdResult.feedback,
          bgVerdict,
          bgReasoning: bgResult?.reasoning ?? '',
          bgFixGuidance: bgResult?.fixGuidance ?? '',
          gateResultId,
        } satisfies GateEvalResult;
      },
    );

    if (evalResult.verdict === 'advance') {
      passed = true;
      break;
    }

    lastEval = evalResult;

    if (attempts >= 4) {
      // Leader adjustment: re-invoke CD to adjust creative direction
      await step.run(`gate-${gateNumber}-leader-adjustment-${attempts}`, async () => {
        const reason = `${evalResult.cdReasoning} | BG: ${evalResult.bgFixGuidance}`;
        await runLeaderAdjustment(attempts, reason);
      });
    }

    // Executor retry with feedback
    await step.run(`gate-${gateNumber}-executor-retry-${attempts}`, async () => {
      await runExecutor(attempts, lastEval);
    });
  }

  if (!passed) {
    // Escalate after 6 attempts
    await step.run(`gate-${gateNumber}-escalate`, async () => {
      await updateProjectStatus(db, projectId, escalateStatus, `gate_${gateNumber}_escalated`);
      await upsertIterationTracking(db, {
        projectId,
        organizationId,
        gateNumber,
        attemptCount: 6,
        leaderAdjustmentActive: true,
        escalated: true,
      });
    });
    return { passed: false, escalated: true };
  }

  return { passed: true, escalated: false };
}

// ── QA system functions (Step 2.9) ────────────────────────────────────────────

/**
 * Automated QA battery (spec §3.3 Step 6).
 * In MVP: stub checks with deterministic pass for the deployed code artifact.
 * Post-MVP: real browser automation, Lighthouse API, link checker.
 */
async function runQaChecks(
  db: Database,
  projectId: string,
  siteContent: Record<string, unknown>,
): Promise<{ passed: boolean; report: Record<string, unknown> }> {
  // MVP: structural validation of the generated code artifact
  const checks: Record<string, { passed: boolean; detail: string }> = {};

  const code = siteContent.code as string | undefined;
  const pages = siteContent.pages as unknown[] | undefined;

  // Check: code was generated
  checks.code_generated = {
    passed: typeof code === 'string' && code.length > 100,
    detail: code ? 'Source code present' : 'No source code found',
  };

  // Check: pages coverage
  checks.pages_coverage = {
    passed: Array.isArray(pages) && pages.length > 0,
    detail: pages ? `${pages.length} page(s) generated` : 'No pages found',
  };

  // Check: meta tags present (SEO basics)
  checks.meta_tags = {
    passed: typeof code === 'string' && code.includes('<meta'),
    detail: code?.includes('<meta') ? 'Meta tags present' : 'Meta tags missing',
  };

  // Check: responsive viewport
  checks.responsive = {
    passed: typeof code === 'string' && code.includes('viewport'),
    detail: code?.includes('viewport') ? 'Viewport meta present' : 'Viewport meta missing',
  };

  const allPassed = Object.values(checks).every((c) => c.passed);

  return {
    passed: allPassed,
    report: {
      checks,
      summary: allPassed ? 'All QA checks passed' : 'Some QA checks failed',
      timestamp: new Date().toISOString(),
    },
  };
}

// ── Deploy function (Step 2.10) ───────────────────────────────────────────────

/**
 * Deploy to Vercel (spec §3.3 Step 7).
 * MVP: returns a preview URL. Full integration uses the Vercel API.
 */
async function deployToVercel(
  _siteContent: Record<string, unknown>,
  projectId: string,
): Promise<{ url: string; deploymentId: string }> {
  // MVP stub — in production calls Vercel Deploy API
  const deploymentId = `dpl_${projectId.replace(/-/g, '').slice(0, 16)}`;
  const url = `https://${deploymentId}.vercel.app`;
  console.log(`[web-motor] Deploy stub — projectId=${projectId} url=${url}`);
  return { url, deploymentId };
}

// ── Inngest function factory ───────────────────────────────────────────────────

export function createWebMotorPipelineFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'web-motor-pipeline',
      retries: 1,
      triggers: [{ event: 'web-motor/pipeline.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 0: Validate event schema + verify tenant (DEC-148) ──────────────
      const { tenantId, projectId } = await step.run('validate-schema', async () => {
        const result = pipelineStartedSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid event schema: ${result.error.message}`);

        const [org] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, result.data.tenantId))
          .limit(1);

        if (!org) throw new Error(`Tenant not found: ${result.data.tenantId} (DEC-148)`);
        return result.data;
      });

      // ── Step 1: Load project + brief (Brief Intake) ───────────────────────────
      const { brief, siteType, autonomyMode, organizationId } = await step.run('brief-intake', async () => {
        const [project] = await db
          .select()
          .from(webProjects)
          .where(and(eq(webProjects.id, projectId), eq(webProjects.organizationId, tenantId)))
          .limit(1);

        if (!project) throw new Error(`Project not found: ${projectId} for tenant ${tenantId}`);
        await updateProjectStatus(db, projectId, 'brief_intake', 'brief-intake');

        return {
          brief: project.brief as Record<string, unknown>,
          siteType: project.siteType,
          autonomyMode: project.autonomyMode,
          organizationId: project.organizationId,
        };
      });

      // ── Step 2: Creative Direction (CD, Opus, Tier A) ─────────────────────────
      await step.run('creative-direction', async () => {
        await updateProjectStatus(db, projectId, 'creative_direction', 'creative-direction');

        const brandDnaContext = await loadBrandDnaContext(db, tenantId);
        const systemPrompt = await loadPromptWithFallback(
          db, 'creative-director', 'web-direction',
          `You are the Creative Director for a web production agency.
Given a client brief and Brand DNA, produce a Creative Direction document for a ${siteType} website.
Output a JSON object with keys: visual_direction, tonal_direction, user_flow, interaction_principles, references.
The brief defines WHAT pages exist — you define HOW the user experiences them.`,
        );

        const tools = {
          update_creative_direction: tool({
            description: 'Write or update the creative direction document',
            inputSchema: z.object({
              visualDirection: z.string().describe('Color, imagery, whitespace, visual rhythm'),
              tonalDirection: z.string().describe('Voice per page type'),
              userFlow: z.string().describe('Emotional journey through the site architecture'),
              interactionPrinciples: z.string().describe('Hover states, transitions, scroll behavior mood'),
              references: z.array(z.string()).describe('2-5 reference site URLs/names'),
            }),
            execute: async (params) => {
              await saveWebArtifact(db, {
                projectId,
                organizationId,
                step: 'creative_direction',
                artifactType: 'creative_direction_doc',
                version: 1,
                gateIteration: 1,
                content: params,
              });
              return { saved: true };
            },
          }),
          read_brief: tool({
            description: 'Read the client brief',
            inputSchema: z.object({}),
            execute: async () => ({ brief }),
          }),
          read_brand_dna: tool({
            description: 'Read the brand DNA for the tenant',
            inputSchema: z.object({}),
            execute: async () => ({ brandDna: brandDnaContext }),
          }),
        };

        await runAgentWithTools({
          ctx: { agentId: 'creative-director', skillId: 'web-direction', tenantId },
          model: MODELS.opus,
          system: systemPrompt,
          prompt: `Client brief: ${JSON.stringify(brief)}\n\nBrand DNA: ${brandDnaContext}\n\nProduce a complete creative direction document for this ${siteType}. Call update_creative_direction when done.`,
          tools,
          maxSteps: 5,
        });
      });

      // ── Step 3: Copy Production (Writer, Sonnet, Tier A) ──────────────────────
      let copyVersion = 1;
      await step.run('copy-production', async () => {
        await updateProjectStatus(db, projectId, 'copy_production', 'copy-production');

        const creativeDirection = await loadLatestArtifact(db, projectId, 'creative_direction');
        const brandDnaContext = await loadBrandDnaContext(db, tenantId);
        const systemPrompt = await loadPromptWithFallback(
          db, 'writer', 'web-copy',
          `You are a professional web copywriter.
Given a brief (with site architecture and objectives), creative direction, and Brand DNA,
produce structured web copy for every page. For each page produce: H1/H2/H3 hierarchy,
body copy, CTAs (primary + secondary), microcopy, meta title, meta description.
Output as JSON with pages array.`,
        );

        const pages = (brief.pages as string[]) ?? ['home'];

        const tools = {
          update_copy: tool({
            description: 'Write or update the copy document',
            inputSchema: z.object({
              pages: z.array(z.object({
                name: z.string(),
                h1: z.string(),
                h2s: z.array(z.string()),
                bodyCopy: z.string(),
                primaryCta: z.string(),
                secondaryCta: z.string().optional(),
                microcopy: z.record(z.string(), z.string()).optional(),
                metaTitle: z.string(),
                metaDescription: z.string(),
              })).describe('Copy per page'),
            }),
            execute: async (params) => {
              await saveWebArtifact(db, {
                projectId,
                organizationId,
                step: 'copy',
                artifactType: 'copy_doc',
                version: copyVersion,
                gateIteration: 1,
                content: params,
              });
              return { saved: true, pageCount: params.pages.length };
            },
          }),
          read_brief: tool({
            description: 'Read the client brief',
            inputSchema: z.object({}),
            execute: async () => ({ brief }),
          }),
          read_creative_direction: tool({
            description: 'Read the creative direction document',
            inputSchema: z.object({}),
            execute: async () => ({ creativeDirection }),
          }),
          read_brand_dna: tool({
            description: 'Read the brand DNA',
            inputSchema: z.object({}),
            execute: async () => ({ brandDna: brandDnaContext }),
          }),
        };

        await runAgentWithTools({
          ctx: { agentId: 'writer', skillId: 'web-copy', tenantId },
          model: MODELS.sonnet,
          system: systemPrompt,
          prompt: `Pages to write: ${pages.join(', ')}\n\nBrief: ${JSON.stringify(brief)}\n\nCreative Direction: ${creativeDirection}\n\nBrand DNA: ${brandDnaContext}\n\nProduce complete web copy for all pages. Call update_copy when done.`,
          tools,
          maxSteps: 8,
        });
      });

      // ── Gate 1: Concept + Texts + Cost ────────────────────────────────────────
      const gate1 = await runGate(
        step, db, tenantId, projectId, organizationId,
        1,
        'concept-text-review', // cdSkillId
        'textual-voice-review', // bgSkillId
        // CD fallback
        `You are the Creative Director evaluating web copy. Assess: does the copy serve the creative direction? Is the emotional flow maintained? Are CTAs clear? Verdict: advance (meets standard) or iterate (needs revision).`,
        // BG fallback
        `You are the Brand Guardian evaluating web copy. Assess: voice, tone, vocabulary, brand personality. Verdict: pass/warning/fail.`,
        true, // includesBrandGuardian
        () => loadLatestArtifact(db, projectId, 'copy'),
        // runExecutor: Writer retries with feedback
        async (attempt, feedback) => {
          copyVersion = attempt + 1;
          const creativeDirection = await loadLatestArtifact(db, projectId, 'creative_direction');
          const brandDnaContext = await loadBrandDnaContext(db, tenantId);
          const feedbackText = feedback
            ? `CD feedback: ${feedback.cdReasoning}\nBG fix guidance: ${feedback.bgFixGuidance}`
            : '';

          const systemPrompt = await loadPromptWithFallback(db, 'writer', 'web-copy',
            `You are a professional web copywriter. Revise the existing copy based on feedback.`);

          const tools = {
            update_copy: tool({
              description: 'Update the copy document with revisions',
              inputSchema: z.object({
                pages: z.array(z.object({
                  name: z.string(),
                  h1: z.string(),
                  h2s: z.array(z.string()),
                  bodyCopy: z.string(),
                  primaryCta: z.string(),
                  secondaryCta: z.string().optional(),
                  microcopy: z.record(z.string(), z.string()).optional(),
                  metaTitle: z.string(),
                  metaDescription: z.string(),
                })),
              }),
              execute: async (params) => {
                await saveWebArtifact(db, {
                  projectId, organizationId, step: 'copy',
                  artifactType: 'copy_doc', version: copyVersion,
                  gateIteration: attempt, content: params,
                });
                return { saved: true };
              },
            }),
            read_creative_direction: tool({
              description: 'Read the creative direction', inputSchema: z.object({}),
              execute: async () => ({ creativeDirection }),
            }),
            read_brand_dna: tool({
              description: 'Read brand DNA', inputSchema: z.object({}),
              execute: async () => ({ brandDna: brandDnaContext }),
            }),
          };

          await runAgentWithTools({
            ctx: { agentId: 'writer', skillId: 'web-copy', tenantId },
            model: MODELS.sonnet, system: systemPrompt,
            prompt: `Revise the copy based on this feedback:\n${feedbackText}\n\nCreative Direction: ${creativeDirection}\n\nCall update_copy when done.`,
            tools, maxSteps: 8,
          });
        },
        // runLeaderAdjustment: CD re-invoked to adjust direction
        async (attempt, reason) => {
          const brandDnaContext = await loadBrandDnaContext(db, tenantId);
          const systemPrompt = await loadPromptWithFallback(db, 'creative-director', 'web-direction',
            `You are the Creative Director. After ${attempt - 1} failed iterations, adjust the creative direction to address: ${reason}`);

          const tools = {
            update_creative_direction: tool({
              description: 'Update the creative direction with adjustments',
              inputSchema: z.object({
                visualDirection: z.string(),
                tonalDirection: z.string(),
                userFlow: z.string(),
                interactionPrinciples: z.string(),
                references: z.array(z.string()),
                leaderAdjustmentNote: z.string().describe('What specifically changed and why'),
              }),
              execute: async (params) => {
                await saveWebArtifact(db, {
                  projectId, organizationId, step: 'creative_direction',
                  artifactType: 'creative_direction_doc', version: attempt,
                  gateIteration: attempt, content: params,
                });
                return { saved: true };
              },
            }),
            read_brief: tool({ description: 'Read the brief', inputSchema: z.object({}), execute: async () => ({ brief }) }),
            read_brand_dna: tool({ description: 'Read brand DNA', inputSchema: z.object({}), execute: async () => ({ brandDna: brandDnaContext }) }),
          };

          await runAgentWithTools({
            ctx: { agentId: 'creative-director', skillId: 'web-direction', tenantId },
            model: MODELS.opus, system: systemPrompt,
            prompt: `Iteration ${attempt}: The copy has failed ${attempt - 1} times. Reason: ${reason}\n\nAdjust the creative direction to resolve the fundamental issues. Be more specific and directive. Call update_creative_direction when done.`,
            tools, maxSteps: 5,
          });
        },
        'escalated',
      );

      if (gate1.escalated) {
        return { status: 'escalated', gate: 1, projectId };
      }

      // ── Step 4: Visual Design (Designer, Sonnet, Tier A) ─────────────────────
      let designVersion = 1;
      await step.run('visual-design', async () => {
        await updateProjectStatus(db, projectId, 'visual_design', 'visual-design');

        const creativeDirection = await loadLatestArtifact(db, projectId, 'creative_direction');
        const approvedCopy = await loadLatestArtifact(db, projectId, 'copy');
        const brandDnaContext = await loadBrandDnaContext(db, tenantId);
        const systemPrompt = await loadPromptWithFallback(
          db, 'designer', 'web-design',
          `You are a web designer producing layout specifications (not visual mockups).
For each page produce: layout grid, component arrangement, typography application,
color usage, imagery direction, responsive behavior notes, component library.
Output as JSON with pages array and componentLibrary object.`,
        );

        const tools = {
          update_design: tool({
            description: 'Write or update design specifications',
            inputSchema: z.object({
              pages: z.array(z.object({
                name: z.string(),
                layout: z.string().describe('Grid and section structure'),
                typography: z.string().describe('Font sizes, weights, hierarchy'),
                colors: z.string().describe('Color application per section'),
                imageryDirection: z.string().describe('What types of images/illustrations go where'),
                responsiveNotes: z.string().describe('How layout transforms for mobile/tablet'),
                components: z.array(z.string()).describe('Which component library elements are used'),
              })),
              componentLibrary: z.object({
                header: z.string().optional(),
                footer: z.string().optional(),
                buttons: z.string().optional(),
                cards: z.string().optional(),
                forms: z.string().optional(),
              }).describe('Reusable components across pages'),
            }),
            execute: async (params) => {
              await saveWebArtifact(db, {
                projectId, organizationId, step: 'design',
                artifactType: 'design_spec', version: designVersion,
                gateIteration: 1, content: params,
              });
              return { saved: true };
            },
          }),
          read_creative_direction: tool({
            description: 'Read creative direction', inputSchema: z.object({}),
            execute: async () => ({ creativeDirection }),
          }),
          read_approved_copy: tool({
            description: 'Read the approved copy', inputSchema: z.object({}),
            execute: async () => ({ copy: approvedCopy }),
          }),
          read_brand_dna: tool({
            description: 'Read brand DNA', inputSchema: z.object({}),
            execute: async () => ({ brandDna: brandDnaContext }),
          }),
          read_brief: tool({
            description: 'Read the brief', inputSchema: z.object({}),
            execute: async () => ({ brief }),
          }),
        };

        await runAgentWithTools({
          ctx: { agentId: 'designer', skillId: 'web-design', tenantId },
          model: MODELS.sonnet, system: systemPrompt,
          prompt: `Design a ${siteType}.\n\nCreative Direction: ${creativeDirection}\n\nApproved Copy: ${approvedCopy}\n\nBrand DNA: ${brandDnaContext}\n\nProduce complete design specifications for all pages. Call update_design when done.`,
          tools, maxSteps: 8,
        });
      });

      // ── Gate 2: Visual Design ─────────────────────────────────────────────────
      const gate2 = await runGate(
        step, db, tenantId, projectId, organizationId,
        2,
        'visual-coherence-review', // cdSkillId
        'visual-identity-review', // bgSkillId
        // CD fallback
        `You are the Creative Director evaluating web design specifications. Assess: visual rhythm, hierarchy, whitespace, emotional tone, interaction principles. Verdict: advance or iterate.`,
        // BG fallback
        `You are the Brand Guardian evaluating visual design. Assess: color palette, typography, imagery style. Verdict: pass/warning/fail.`,
        true, // includesBrandGuardian
        () => loadLatestArtifact(db, projectId, 'design'),
        // runExecutor: Designer retries
        async (attempt, feedback) => {
          designVersion = attempt + 1;
          const creativeDirection = await loadLatestArtifact(db, projectId, 'creative_direction');
          const approvedCopy = await loadLatestArtifact(db, projectId, 'copy');
          const brandDnaContext = await loadBrandDnaContext(db, tenantId);
          const feedbackText = feedback
            ? `CD feedback: ${feedback.cdReasoning}\nBG fix guidance: ${feedback.bgFixGuidance}`
            : '';

          const systemPrompt = await loadPromptWithFallback(db, 'designer', 'web-design',
            `You are a web designer revising design specifications based on feedback.`);

          const tools = {
            update_design: tool({
              description: 'Update design specifications',
              inputSchema: z.object({
                pages: z.array(z.object({
                  name: z.string(), layout: z.string(), typography: z.string(),
                  colors: z.string(), imageryDirection: z.string(),
                  responsiveNotes: z.string(), components: z.array(z.string()),
                })),
                componentLibrary: z.object({
                  header: z.string().optional(), footer: z.string().optional(),
                  buttons: z.string().optional(), cards: z.string().optional(),
                  forms: z.string().optional(),
                }),
              }),
              execute: async (params) => {
                await saveWebArtifact(db, {
                  projectId, organizationId, step: 'design',
                  artifactType: 'design_spec', version: designVersion,
                  gateIteration: attempt, content: params,
                });
                return { saved: true };
              },
            }),
            read_creative_direction: tool({ description: 'Read creative direction', inputSchema: z.object({}), execute: async () => ({ creativeDirection }) }),
            read_approved_copy: tool({ description: 'Read approved copy', inputSchema: z.object({}), execute: async () => ({ copy: approvedCopy }) }),
            read_brand_dna: tool({ description: 'Read brand DNA', inputSchema: z.object({}), execute: async () => ({ brandDna: brandDnaContext }) }),
          };

          await runAgentWithTools({
            ctx: { agentId: 'designer', skillId: 'web-design', tenantId },
            model: MODELS.sonnet, system: systemPrompt,
            prompt: `Revise the design based on feedback:\n${feedbackText}\n\nCreative Direction: ${creativeDirection}\n\nCall update_design when done.`,
            tools, maxSteps: 8,
          });
        },
        // runLeaderAdjustment
        async (attempt, reason) => {
          const brandDnaContext = await loadBrandDnaContext(db, tenantId);
          const systemPrompt = await loadPromptWithFallback(db, 'creative-director', 'web-direction',
            `You are the Creative Director. Adjust visual direction after ${attempt - 1} failed design iterations.`);

          const tools = {
            update_creative_direction: tool({
              description: 'Update creative direction with visual adjustments',
              inputSchema: z.object({
                visualDirection: z.string(), tonalDirection: z.string(),
                userFlow: z.string(), interactionPrinciples: z.string(),
                references: z.array(z.string()),
                leaderAdjustmentNote: z.string(),
              }),
              execute: async (params) => {
                await saveWebArtifact(db, {
                  projectId, organizationId, step: 'creative_direction',
                  artifactType: 'creative_direction_doc', version: attempt + 10,
                  gateIteration: attempt, content: params,
                });
                return { saved: true };
              },
            }),
            read_brand_dna: tool({ description: 'Read brand DNA', inputSchema: z.object({}), execute: async () => ({ brandDna: brandDnaContext }) }),
          };

          await runAgentWithTools({
            ctx: { agentId: 'creative-director', skillId: 'web-direction', tenantId },
            model: MODELS.opus, system: systemPrompt,
            prompt: `Design iteration ${attempt} failed. Reason: ${reason}\n\nAdjust visual direction to resolve design issues. Call update_creative_direction when done.`,
            tools, maxSteps: 5,
          });
        },
        'escalated',
      );

      if (gate2.escalated) {
        return { status: 'escalated', gate: 2, projectId };
      }

      // ── Step 5: Development (Web Developer, Sonnet, Tier A) ──────────────────
      let codeVersion = 1;
      await step.run('development', async () => {
        await updateProjectStatus(db, projectId, 'development', 'development');

        const approvedCopy = await loadLatestArtifact(db, projectId, 'copy');
        const approvedDesign = await loadLatestArtifact(db, projectId, 'design');
        const brandDnaContext = await loadBrandDnaContext(db, tenantId);

        // Determine skill based on site type (DEC-219)
        const devSkill = siteType === 'blog_first' ? 'cms-site'
          : siteType === 'microsite' ? 'microsite'
          : 'static-site';

        const systemPrompt = await loadPromptWithFallback(
          db, 'web-developer', devSkill,
          `You are a web developer translating approved design specs and copy into functional code.
Produce complete, deployable ${siteType} code (Next.js or HTML/CSS/JS).
Include: all pages, responsive implementation, email capture, analytics, meta tags, sitemap.
Output as JSON with code (full source), pages array, and integrations object.`,
        );

        const tools = {
          write_code: tool({
            description: 'Generate the complete site code',
            inputSchema: z.object({
              framework: z.string().describe('next.js | html-css-js'),
              code: z.string().describe('Complete source code or primary entry file'),
              pages: z.array(z.object({
                name: z.string(),
                path: z.string(),
                content: z.string().describe('Page-specific code/template'),
              })),
              integrations: z.object({
                emailCapture: z.string().optional(),
                analytics: z.string().optional(),
                cms: z.string().optional(),
              }),
              sitemapIncluded: z.boolean(),
            }),
            execute: async (params) => {
              await saveWebArtifact(db, {
                projectId, organizationId, step: 'code',
                artifactType: 'source_code', version: codeVersion,
                gateIteration: 1, content: params as Record<string, unknown>,
              });
              return { saved: true };
            },
          }),
          read_approved_copy: tool({ description: 'Read approved copy', inputSchema: z.object({}), execute: async () => ({ copy: approvedCopy }) }),
          read_approved_design: tool({ description: 'Read approved design', inputSchema: z.object({}), execute: async () => ({ design: approvedDesign }) }),
          read_brief: tool({ description: 'Read the brief', inputSchema: z.object({}), execute: async () => ({ brief }) }),
          read_brand_dna: tool({ description: 'Read brand DNA for styling', inputSchema: z.object({}), execute: async () => ({ brandDna: brandDnaContext }) }),
        };

        await runAgentWithTools({
          ctx: { agentId: 'web-developer', skillId: devSkill, tenantId },
          model: MODELS.sonnet, system: systemPrompt,
          prompt: `Build a ${siteType} using the ${devSkill} skill.\n\nApproved Copy: ${approvedCopy}\n\nApproved Design: ${approvedDesign}\n\nBrief (technical requirements): ${JSON.stringify(brief)}\n\nGenerate complete deployable code. Call write_code when done.`,
          tools, maxSteps: 10,
        });
      });

      // ── Step 6: QA ────────────────────────────────────────────────────────────
      let qaReport: Record<string, unknown> = {};
      await step.run('qa', async () => {
        await updateProjectStatus(db, projectId, 'qa', 'qa');

        const codeArtifact = await loadLatestArtifact(db, projectId, 'code');
        let siteContent: Record<string, unknown> = {};
        try { siteContent = JSON.parse(codeArtifact); } catch { siteContent = { raw: codeArtifact }; }

        const result = await runQaChecks(db, projectId, siteContent);
        qaReport = result.report;

        await saveWebArtifact(db, {
          projectId, organizationId, step: 'qa',
          artifactType: 'qa_report', version: 1,
          gateIteration: 1, content: { ...result.report, passed: result.passed },
        });
      });

      // ── Gate 3: Site Functioning (CD visual verification + QA) ───────────────
      const gate3 = await runGate(
        step, db, tenantId, projectId, organizationId,
        3,
        'visual-verification', // cdSkillId
        null, // no Brand Guardian at G3 (DEC-223)
        // CD fallback
        `You are the Creative Director doing final visual verification. Does the built site match the approved design? Check: fidelity to design specs, visual consistency, correct page structure. Verdict: advance (implementation matches) or iterate (Web Developer needs to fix specific items).`,
        '',
        false, // NO Brand Guardian
        async () => {
          const codeArtifact = await loadLatestArtifact(db, projectId, 'code');
          const designArtifact = await loadLatestArtifact(db, projectId, 'design');
          return `QA Report: ${JSON.stringify(qaReport)}\n\nBuilt Code: ${codeArtifact}\n\nApproved Design: ${designArtifact}`;
        },
        // runExecutor: Web Developer fixes
        async (attempt, feedback) => {
          codeVersion = attempt + 1;
          const approvedCopy = await loadLatestArtifact(db, projectId, 'copy');
          const approvedDesign = await loadLatestArtifact(db, projectId, 'design');
          const prevCode = await loadLatestArtifact(db, projectId, 'code');
          const feedbackText = feedback ? `CD feedback: ${feedback.cdReasoning}` : '';
          const qaFeedback = JSON.stringify(qaReport);

          const devSkill = siteType === 'blog_first' ? 'cms-site' : siteType === 'microsite' ? 'microsite' : 'static-site';
          const systemPrompt = await loadPromptWithFallback(db, 'web-developer', devSkill,
            `You are a web developer fixing implementation issues based on QA results and CD feedback.`);

          const tools = {
            write_code: tool({
              description: 'Update the site code with fixes',
              inputSchema: z.object({
                framework: z.string(), code: z.string(),
                pages: z.array(z.object({ name: z.string(), path: z.string(), content: z.string() })),
                integrations: z.object({ emailCapture: z.string().optional(), analytics: z.string().optional(), cms: z.string().optional() }),
                sitemapIncluded: z.boolean(),
                fixSummary: z.string().describe('What was fixed'),
              }),
              execute: async (params) => {
                await saveWebArtifact(db, {
                  projectId, organizationId, step: 'code',
                  artifactType: 'source_code', version: codeVersion,
                  gateIteration: attempt, content: params as Record<string, unknown>,
                });
                return { saved: true };
              },
            }),
            read_approved_design: tool({ description: 'Read approved design', inputSchema: z.object({}), execute: async () => ({ design: approvedDesign }) }),
            read_approved_copy: tool({ description: 'Read approved copy', inputSchema: z.object({}), execute: async () => ({ copy: approvedCopy }) }),
            read_current_code: tool({ description: 'Read current code', inputSchema: z.object({}), execute: async () => ({ code: prevCode }) }),
          };

          await runAgentWithTools({
            ctx: { agentId: 'web-developer', skillId: devSkill, tenantId },
            model: MODELS.sonnet, system: systemPrompt,
            prompt: `Fix the following issues:\n\nQA Report: ${qaFeedback}\n\n${feedbackText}\n\nCall write_code with the corrected implementation.`,
            tools, maxSteps: 8,
          });
        },
        // runLeaderAdjustment (rare at G3 — usually technical fixes)
        async (attempt, reason) => {
          console.warn(`[web-motor] G3 leader adjustment attempt ${attempt}: ${reason}`);
        },
        'escalated',
      );

      if (gate3.escalated) {
        return { status: 'escalated', gate: 3, projectId };
      }

      // ── Step 7: Deploy ────────────────────────────────────────────────────────
      const deployResult = await step.run('deploy', async () => {
        await updateProjectStatus(db, projectId, 'deploy', 'deploy');

        const codeArtifact = await loadLatestArtifact(db, projectId, 'code');
        let siteContent: Record<string, unknown> = {};
        try { siteContent = JSON.parse(codeArtifact); } catch { siteContent = { raw: codeArtifact }; }

        const { url, deploymentId } = await deployToVercel(siteContent, projectId);

        // Save deploy artifact
        await saveWebArtifact(db, {
          projectId, organizationId, step: 'deploy',
          artifactType: 'deploy_record', version: 1,
          gateIteration: 1,
          content: { url, deploymentId, deployedAt: new Date().toISOString() },
        });

        // Update project with live URL + delivered status
        await db.update(webProjects)
          .set({ liveUrl: url, status: 'delivered', currentStep: 'delivered', deliveredAt: new Date() })
          .where(eq(webProjects.id, projectId));

        // Index in Output Registry (DEC-130)
        const deployArtifact = await db
          .select({ id: webArtifacts.id })
          .from(webArtifacts)
          .where(and(eq(webArtifacts.projectId, projectId), eq(webArtifacts.step, 'deploy')))
          .orderBy(desc(webArtifacts.version))
          .limit(1);

        if (deployArtifact.length > 0) {
          await db.insert(outputRegistry).values({
            organizationId,
            sourceMotor: 'web-motor',
            sourceAgentId: 'web-developer',
            outputType: 'website',
            contentRef: deployArtifact[0].id,
            summary: `Deployed ${siteType} for tenant ${tenantId}. Live at: ${url}`,
            metadata: { url, projectId, siteType, deploymentId },
          });
        }

        return { url, deploymentId };
      });

      return { status: 'delivered', projectId, liveUrl: deployResult.url };
    },
  );
}
