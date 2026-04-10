/**
 * Video Motor Pipeline — Fase 2
 *
 * Inngest orchestration for the full video production pipeline.
 * 11 steps, 5 quality gates, 3+3 iteration rule per gate.
 *
 * Pipeline sequence:
 *   BRIEF → [Step 2: CD] → CONCEPT → [G1] → SCRIPT (4a-4d) → [G2] →
 *   VISUAL_LOOK → STORYBOARD → [G3 + optional waitForEvent] →
 *   VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
 *
 * Agent model assignments (DEC-174):
 *   Opus  — Creative Director, Director
 *   Sonnet — Brand Guardian, Writer, DP, Editor, Audio Producer, Visual Designer
 *   Haiku  — Writer classification sub-step (4a)
 *
 * All agents are Tier A — Anthropic only (DEC-149, uses Brand DNA).
 * System prompts loaded from prompt_registry — never hardcoded (DEC-145).
 * Only IDs/references stored in step state — sensitive data read fresh (DEC-148).
 *
 * 3+3 rule per gate:
 *   Attempts 1-3: normal executor retry (Director + BG feedback)
 *   Attempts 4-6: leader adjustment — CD revision, then executor retry
 *   After attempt 6: human escalation
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  eq,
  and,
  desc,
  organizationSettings,
  brandDna,
  brandDnaArtifacts,
  promptRegistry,
  motorExecutions,
  videoProjects,
  videoArtifacts,
  videoGateReviews,
  outputRegistry,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { classifyText, MODELS } from '../../../lib/ai.js';
import { loadPrompt } from '../../../lib/prompt-loader.js';
import { createStubExternalAPIs } from '../../../lib/video-motor/external-apis.js';

// ── Event schemas ─────────────────────────────────────────────────────────────

const pipelineStartedSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  projectId: z.string().uuid('projectId must be a UUID'),
});

export type VideoMotorPipelineEventData = z.infer<typeof pipelineStartedSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

type GateVerdict = 'advance' | 'iterate' | 'rethink' | 'escalate';
type DirectorVerdict = 'advance' | 'iterate' | 'rethink';
type BrandGuardianVerdict = 'pass' | 'warning' | 'fail';

interface GateEvalResult {
  verdict: GateVerdict;
  directorVerdict: DirectorVerdict;
  directorReasoning: string;
  directorFeedback: Record<string, unknown>;
  brandGuardianVerdict: BrandGuardianVerdict;
  brandGuardianReasoning: string;
  brandGuardianFixGuidance: string;
  gateReviewId: string;
}

interface ScriptSubStep {
  retryFrom: 'script-structure' | 'script-draft' | 'script-polish';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Load prompt with inline fallback — never crash the pipeline (Fase 2).
 */
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
    console.warn(`[video-motor] No prompt in registry for ${agentId}/${skillId} — using fallback`);
    return fallbackPrompt;
  }
}

/**
 * Compute combined gate verdict from Director + Brand Guardian results.
 * Logic per spec:
 *   Dir=advance + BG=pass/warning → advance
 *   Dir=advance + BG=fail        → iterate (brand fix needed)
 *   Dir=iterate + any BG         → iterate
 *   Dir=rethink                  → rethink
 */
function computeGateVerdict(
  dir: DirectorVerdict,
  bg: BrandGuardianVerdict,
): GateVerdict {
  if (dir === 'rethink') return 'rethink';
  if (dir === 'advance' && (bg === 'pass' || bg === 'warning')) return 'advance';
  // Dir=advance + BG=fail, or Dir=iterate
  return 'iterate';
}

/**
 * Run Director evaluation using generateText (evaluation function, not agent-with-tools).
 * Returns structured verdict parsed from LLM output.
 */
async function runDirectorEval(
  db: Database,
  tenantId: string,
  projectId: string,
  skillId: string,
  artifactContext: string,
  fallbackPrompt: string,
): Promise<{ verdict: DirectorVerdict; reasoning: string; feedback: Record<string, unknown> }> {
  const systemPrompt = await loadPromptWithFallback(db, 'director', skillId, fallbackPrompt);

  const result = await classifyText({
    ctx: { agentId: 'director', skillId, tenantId },
    model: MODELS.opus,
    system: systemPrompt,
    prompt: `Project ID: ${projectId}\n\nEvaluate the following artifact and respond with JSON:\n{"verdict":"advance|iterate|rethink","reasoning":"...","feedback":{}}\n\nArtifact:\n${artifactContext}`,
  });

  try {
    // Try to parse structured JSON from LLM
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        verdict?: string;
        reasoning?: string;
        feedback?: Record<string, unknown>;
      };
      const verdict = (['advance', 'iterate', 'rethink'].includes(parsed.verdict ?? ''))
        ? (parsed.verdict as DirectorVerdict)
        : 'iterate';
      return {
        verdict,
        reasoning: parsed.reasoning ?? result.text,
        feedback: parsed.feedback ?? {},
      };
    }
  } catch {
    // fall through to text-based heuristic
  }

  // Heuristic fallback: look for verdict keywords
  const text = result.text.toLowerCase();
  const verdict: DirectorVerdict = text.includes('advance')
    ? 'advance'
    : text.includes('rethink')
      ? 'rethink'
      : 'iterate';

  return { verdict, reasoning: result.text, feedback: {} };
}

/**
 * Run Brand Guardian evaluation using generateText.
 */
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
    prompt: `Project ID: ${projectId}\n\nBrand DNA Context:\n${brandDnaContext}\n\nEvaluate brand consistency and respond with JSON:\n{"verdict":"pass|warning|fail","reasoning":"...","fixGuidance":"..."}\n\nArtifact:\n${artifactContext}`,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        verdict?: string;
        reasoning?: string;
        fixGuidance?: string;
      };
      const verdict = (['pass', 'warning', 'fail'].includes(parsed.verdict ?? ''))
        ? (parsed.verdict as BrandGuardianVerdict)
        : 'warning';
      return {
        verdict,
        reasoning: parsed.reasoning ?? result.text,
        fixGuidance: parsed.fixGuidance ?? '',
      };
    }
  } catch {
    // fall through
  }

  const text = result.text.toLowerCase();
  const verdict: BrandGuardianVerdict = text.includes('fail')
    ? 'fail'
    : text.includes('pass')
      ? 'pass'
      : 'warning';

  return { verdict, reasoning: result.text, fixGuidance: '' };
}

/**
 * Load Brand DNA context for the tenant — used by Brand Guardian.
 * Returns a summary string safe to pass to LLM (no raw user PII).
 */
async function loadBrandDnaContext(db: Database, tenantId: string): Promise<string> {
  const artifacts = await db
    .select({
      artifactType: brandDnaArtifacts.artifactType,
      content: brandDnaArtifacts.content,
      layer: brandDnaArtifacts.layer,
    })
    .from(brandDnaArtifacts)
    .where(eq(brandDnaArtifacts.organizationId, tenantId))
    .limit(20);

  if (artifacts.length === 0) return 'No Brand DNA available yet.';

  return artifacts
    .map((a) => `[${a.artifactType} / Layer ${a.layer}]: ${JSON.stringify(a.content)}`)
    .join('\n');
}

/**
 * Load the latest artifact content for a given step as a string summary.
 */
async function loadLatestArtifactContent(
  db: Database,
  projectId: string,
  step: string,
): Promise<string> {
  const [artifact] = await db
    .select({ content: videoArtifacts.content, version: videoArtifacts.version })
    .from(videoArtifacts)
    .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, step)))
    .orderBy(desc(videoArtifacts.version))
    .limit(1);

  if (!artifact) return `No artifact found for step "${step}"`;
  return JSON.stringify(artifact.content);
}

/**
 * Save a video artifact and return its ID.
 */
async function saveArtifact(
  db: Database,
  params: {
    projectId: string;
    organizationId: string;
    step: string;
    artifactType: string;
    version: number;
    gateIteration: number;
    content: Record<string, unknown>;
  },
): Promise<string> {
  const [inserted] = await db
    .insert(videoArtifacts)
    .values(params)
    .returning({ id: videoArtifacts.id });
  return inserted.id;
}

/**
 * Update project status and currentStep.
 */
async function updateProjectStatus(
  db: Database,
  projectId: string,
  status: string,
  currentStep: string,
): Promise<void> {
  await db
    .update(videoProjects)
    .set({ status, currentStep })
    .where(eq(videoProjects.id, projectId));
}

/**
 * Insert a gate review record and return its ID.
 */
async function insertGateReview(
  db: Database,
  params: {
    projectId: string;
    organizationId: string;
    gateNumber: number;
    iterationNumber: number;
    showrunnerVerdict: string;
    showrunnerReasoning: string;
    showrunnerFeedback: Record<string, unknown>;
    brandGuardianVerdict: string;
    brandGuardianReasoning: string;
    brandGuardianFixGuidance: string;
    combinedVerdict: string;
    clientApprovalStatus?: string;
  },
): Promise<string> {
  const [inserted] = await db
    .insert(videoGateReviews)
    .values({
      ...params,
      clientApprovalStatus: params.clientApprovalStatus ?? 'na',
      resolvedAt: new Date(),
    })
    .returning({ id: videoGateReviews.id });
  return inserted.id;
}

// ── Gate runner factory ───────────────────────────────────────────────────────

/**
 * Generic 3+3 gate runner.
 * Handles iteration loop, CD revision on attempts 4-6, and escalation.
 *
 * @param step         Inngest step context
 * @param db           Database instance
 * @param tenantId     Tenant ID
 * @param projectId    Project ID
 * @param gateNumber   Gate index (1-5)
 * @param directorSkillId  promptRegistry skillId for Director
 * @param bgSkillId         promptRegistry skillId for Brand Guardian
 * @param directorFallback Fallback prompt for Director
 * @param bgFallback         Fallback prompt for Brand Guardian
 * @param getArtifactContext  Called inside each step to load current artifact
 * @param runExecutor         Called to re-run the executor (normal retry)
 * @param runCDRevision       Called when a CD rethink/leader adjustment is needed
 * @param escalateStatus      Project status value when escalating
 */
async function runGate(
  // biome-ignore lint/suspicious/noExplicitAny: Inngest step type
  step: any,
  db: Database,
  tenantId: string,
  projectId: string,
  organizationId: string,
  gateNumber: number,
  directorSkillId: string,
  bgSkillId: string,
  directorFallback: string,
  bgFallback: string,
  getArtifactContext: () => Promise<string>,
  runExecutor: (attempt: number, feedback: GateEvalResult | null) => Promise<void>,
  runCDRevision: (attempt: number, reason: string) => Promise<void>,
  escalateStatus: string,
): Promise<{ passed: boolean; escalated: boolean; finalVerdict?: GateVerdict }> {
  let passed = false;
  let attempts = 0;
  let lastEval: GateEvalResult | null = null;

  while (!passed && attempts < 6) {
    attempts++;

    // Evaluate gate — Director + Brand Guardian in parallel within one step
    const evalResult: GateEvalResult = await step.run(
      `gate-${gateNumber}-eval-attempt-${attempts}`,
      async () => {
        const artifactContext = await getArtifactContext();
        const brandDnaContext = await loadBrandDnaContext(db, tenantId);

        const [dir, bg] = await Promise.all([
          runDirectorEval(
            db,
            tenantId,
            projectId,
            directorSkillId,
            artifactContext,
            directorFallback,
          ),
          runBrandGuardianEval(
            db,
            tenantId,
            projectId,
            bgSkillId,
            artifactContext,
            brandDnaContext,
            bgFallback,
          ),
        ]);

        const combinedVerdict = computeGateVerdict(dir.verdict, bg.verdict);

        const gateReviewId = await insertGateReview(db, {
          projectId,
          organizationId,
          gateNumber,
          iterationNumber: attempts,
          showrunnerVerdict: dir.verdict,
          showrunnerReasoning: dir.reasoning,
          showrunnerFeedback: dir.feedback,
          brandGuardianVerdict: bg.verdict,
          brandGuardianReasoning: bg.reasoning,
          brandGuardianFixGuidance: bg.fixGuidance,
          combinedVerdict,
        });

        return {
          verdict: combinedVerdict,
          directorVerdict: dir.verdict,
          directorReasoning: dir.reasoning,
          directorFeedback: dir.feedback,
          brandGuardianVerdict: bg.verdict,
          brandGuardianReasoning: bg.reasoning,
          brandGuardianFixGuidance: bg.fixGuidance,
          gateReviewId,
        } satisfies GateEvalResult;
      },
    );

    lastEval = evalResult;

    if (evalResult.verdict === 'advance') {
      passed = true;
      break;
    }

    // Not yet passed — check if we've exhausted attempts
    if (attempts >= 6) break;

    if (evalResult.verdict === 'rethink' || attempts >= 4) {
      // Leader adjustment: CD revision first, then executor retry
      await step.run(`gate-${gateNumber}-cd-revision-attempt-${attempts}`, async () => {
        await runCDRevision(
          attempts,
          evalResult.directorReasoning + '\n' + evalResult.brandGuardianFixGuidance,
        );
      });

      await step.run(`gate-${gateNumber}-executor-after-cd-${attempts}`, async () => {
        await runExecutor(attempts, evalResult);
      });
    } else {
      // Normal retry (attempts 1-3): executor retries with Director + BG feedback
      await step.run(`gate-${gateNumber}-executor-retry-${attempts}`, async () => {
        await runExecutor(attempts, evalResult);
      });
    }
  }

  if (!passed) {
    // Escalate
    await step.run(`gate-${gateNumber}-escalate`, async () => {
      await db
        .update(videoProjects)
        .set({
          status: escalateStatus,
          currentStep: `gate_${gateNumber}_escalated`,
          escalatedAt: new Date(),
          escalationReason: lastEval?.directorReasoning ?? 'Max iterations reached',
        })
        .where(eq(videoProjects.id, projectId));

      if (lastEval) {
        await db
          .update(videoGateReviews)
          .set({ combinedVerdict: 'escalate' })
          .where(eq(videoGateReviews.id, lastEval.gateReviewId));
      }

      await db.insert(motorExecutions).values({
        organizationId,
        motor: 'video-motor',
        status: 'escalated',
        triggeredBy: `gate-${gateNumber}`,
        metadata: { projectId, gate: gateNumber, attempts },
      });
    });

    return { passed: false, escalated: true, finalVerdict: 'escalate' };
  }

  return { passed: true, escalated: false, finalVerdict: 'advance' };
}

// ── Main pipeline factory ─────────────────────────────────────────────────────

export function createVideoMotorPipelineFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'video-motor-pipeline',
      retries: 1,
      triggers: [{ event: 'video-motor/pipeline.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema + verify tenant (DEC-148) ─────────────────
      const validated = await step.run('validate-schema', () => {
        const result = pipelineStartedSchema.safeParse(event.data);
        if (!result.success) {
          throw new Error(`Invalid event schema: ${result.error.message}`);
        }
        return result.data;
      });

      const { tenantId, projectId } = validated;

      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, tenantId))
          .limit(1);

        if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
      });

      // Load project (verify it exists and get its data)
      const project = await step.run('load-project', async () => {
        const [proj] = await db
          .select({
            id: videoProjects.id,
            organizationId: videoProjects.organizationId,
            brief: videoProjects.brief,
            autonomyMode: videoProjects.autonomyMode,
          })
          .from(videoProjects)
          .where(
            and(
              eq(videoProjects.id, projectId),
              eq(videoProjects.organizationId, tenantId),
            ),
          )
          .limit(1);

        if (!proj) throw new Error(`Project not found: ${projectId} for tenant: ${tenantId}`);
        return proj;
      });

      const organizationId = project.organizationId;

      // ── Step 2: Creative Direction (Creative Director — Opus) ──────────────
      await step.run('creative-direction', async () => {
        await updateProjectStatus(db, projectId, 'creative_direction', 'creative_direction');

        const systemPrompt = await loadPromptWithFallback(
          db,
          'creative-director',
          'piece-direction',
          'You are the Creative Director. Produce a comprehensive creative direction document for the video project based on the brief. Include concept, tone, visual direction, audio direction, and target audience. Output valid JSON.',
        );

        // CD uses generateText (classifyText) to produce a structured creative direction document.
        // runAgentWithTools is reserved for multi-step tool loops; CD direction is a single
        // rich-output generation that fits classifyText well.
        const result = await classifyText({
          ctx: { agentId: 'creative-director', skillId: 'piece-direction', tenantId },
          model: MODELS.opus,
          system: systemPrompt,
          prompt: `Project Brief:\n${JSON.stringify(project.brief, null, 2)}\n\nProduce a complete creative direction document. Respond with JSON: {"concept":"...","tone":"...","visualDirection":"...","audioDirection":"...","targetAudience":"...","keyMessages":[],"estimatedDurationSeconds":30}`,
        });

        let directionContent: Record<string, unknown> = { rawText: result.text };
        try {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (match) directionContent = JSON.parse(match[0]) as Record<string, unknown>;
        } catch { /* use raw */ }

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'creative_direction',
          artifactType: 'creative_direction',
          version: 1,
          gateIteration: 1,
          content: directionContent as Record<string, unknown>,
        });
      });

      // ── Step 3: Concept Development (Creative Director — Opus) ────────────
      await step.run('concept-initial', async () => {
        await updateProjectStatus(db, projectId, 'concept', 'concept');

        const systemPrompt = await loadPromptWithFallback(
          db,
          'creative-director',
          'piece-direction',
          'You are the Creative Director. Based on the creative direction, develop a compelling video concept including the central idea, narrative arc, and emotional hook. Output JSON.',
        );

        const cdArtifact = await loadLatestArtifactContent(db, projectId, 'creative_direction');

        const result = await classifyText({
          ctx: { agentId: 'creative-director', skillId: 'piece-direction', tenantId },
          model: MODELS.opus,
          system: systemPrompt,
          prompt: `Creative Direction:\n${cdArtifact}\n\nDevelop the video concept. Respond with JSON: {"centralIdea":"...","narrativeArc":"...","emotionalHook":"...","format":"...","targetEmotion":"..."}`,
        });

        let conceptContent: Record<string, unknown> = { rawText: result.text };
        try {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (match) conceptContent = JSON.parse(match[0]) as Record<string, unknown>;
        } catch { /* use raw text */ }

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'concept',
          artifactType: 'concept',
          version: 1,
          gateIteration: 1,
          content: conceptContent,
        });
      });

      // ── Gate 1: Concept Quality Gate ──────────────────────────────────────
      await updateProjectStatus(db, projectId, 'gate_1', 'gate_1');

      let conceptVersion = 1;

      const gate1Result = await runGate(
        step,
        db,
        tenantId,
        projectId,
        organizationId,
        1,
        'concept-evaluation',
        'strategic-alignment-review',
        'You are the Director. Evaluate this concept for creative quality, originality, and feasibility. Verdict: advance/iterate/rethink. Output JSON.',
        'You are the Brand Guardian. Evaluate this concept for brand alignment and strategic consistency. Verdict: pass/warning/fail. Output JSON.',
        () => loadLatestArtifactContent(db, projectId, 'concept'),
        // Executor retry: CD re-runs concept with feedback
        async (attempt, feedback) => {
          conceptVersion++;
          const systemPrompt = await loadPromptWithFallback(
            db,
            'creative-director',
            'piece-direction',
            'You are the Creative Director. Revise the concept based on quality feedback.',
          );

          const [prevConcept, cdArtifact] = await Promise.all([
            loadLatestArtifactContent(db, projectId, 'concept'),
            loadLatestArtifactContent(db, projectId, 'creative_direction'),
          ]);

          const result = await classifyText({
            ctx: { agentId: 'creative-director', skillId: 'piece-direction', tenantId },
            model: MODELS.opus,
            system: systemPrompt,
            prompt: `Previous Concept:\n${prevConcept}\n\nFeedback:\n${JSON.stringify(feedback)}\n\nCreative Direction:\n${cdArtifact}\n\nRevise the concept. Output JSON.`,
          });

          let content: Record<string, unknown> = { rawText: result.text };
          try {
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
          } catch { /* use raw */ }

          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'concept',
            artifactType: 'concept',
            version: conceptVersion,
            gateIteration: attempt,
            content,
          });
        },
        // CD revision (rethink / leader adjustment)
        async (attempt, reason) => {
          const systemPrompt = await loadPromptWithFallback(
            db,
            'creative-director',
            'creative-revision',
            'You are the Creative Director. The concept needs fundamental rethinking. Revise the creative direction and produce a new direction document. Output JSON.',
          );

          const cdArtifact = await loadLatestArtifactContent(db, projectId, 'creative_direction');

          const result = await classifyText({
            ctx: { agentId: 'creative-director', skillId: 'creative-revision', tenantId },
            model: MODELS.opus,
            system: systemPrompt,
            prompt: `Rethink reason:\n${reason}\n\nCurrent Creative Direction:\n${cdArtifact}\n\nRevise the creative direction. Output JSON.`,
          });

          let content: Record<string, unknown> = { rawText: result.text };
          try {
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
          } catch { /* use raw */ }

          // Save revised direction as a new version
          const [latestDir] = await db
            .select({ version: videoArtifacts.version })
            .from(videoArtifacts)
            .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'creative_direction')))
            .orderBy(desc(videoArtifacts.version))
            .limit(1);

          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'creative_direction',
            artifactType: 'creative_direction',
            version: (latestDir?.version ?? 1) + 1,
            gateIteration: attempt,
            content,
          });
        },
        'escalated',
      );

      if (gate1Result.escalated) {
        return { escalated: true, gate: 1, projectId };
      }

      // ── Step 4: Script (4 sub-steps) ──────────────────────────────────────
      await updateProjectStatus(db, projectId, 'script_classify', 'script_classify');

      // 4a — Classification (Writer + Classification skill — Haiku)
      const scriptClassification = await step.run('script-4a-classification', async () => {
        const systemPrompt = await loadPromptWithFallback(
          db,
          'writer',
          'classification',
          'You are the Writer. Classify the video project type and identify the appropriate script format from the 8 available formats: commercial, documentary, explainer, narrative, social_short, testimonial, product_demo, brand_story. Output JSON: {"format":"...","rationale":"...","scriptRequirements":{}}',
        );

        const [concept, cdArtifact] = await Promise.all([
          loadLatestArtifactContent(db, projectId, 'concept'),
          loadLatestArtifactContent(db, projectId, 'creative_direction'),
        ]);

        const result = await classifyText({
          ctx: { agentId: 'writer', skillId: 'classification', tenantId },
          model: MODELS.haiku,
          system: systemPrompt,
          prompt: `Brief:\n${JSON.stringify(project.brief)}\nConcept:\n${concept}\nCreative Direction:\n${cdArtifact}\n\nClassify the script format. Output JSON.`,
        });

        let content: Record<string, unknown> = { rawText: result.text, format: 'commercial' };
        try {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
        } catch { /* use raw */ }

        return content;
      });

      // 4b — Structure (Writer + Structure skill — Sonnet)
      await step.run('script-4b-structure', async () => {
        await updateProjectStatus(db, projectId, 'script_structure', 'script_structure');

        const systemPrompt = await loadPromptWithFallback(
          db,
          'writer',
          'structure',
          'You are the Writer. Create a beat sheet / structural outline for the video script. Include acts, key beats, timing, and emotional arc. Output JSON: {"acts":[],"beats":[],"totalDurationSeconds":0,"emotionalArc":""}',
        );

        const concept = await loadLatestArtifactContent(db, projectId, 'concept');

        const result = await classifyText({
          ctx: { agentId: 'writer', skillId: 'structure', tenantId },
          model: MODELS.sonnet,
          system: systemPrompt,
          prompt: `Script Format: ${String(scriptClassification.format)}\nConcept:\n${concept}\nRequirements: ${JSON.stringify(scriptClassification.scriptRequirements ?? {})}\n\nCreate the script structure / beat sheet. Output JSON.`,
        });

        let content: Record<string, unknown> = { rawText: result.text };
        try {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
        } catch { /* use raw */ }

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'beat_sheet',
          artifactType: 'beat_sheet',
          version: 1,
          gateIteration: 1,
          content,
        });
      });

      // 4c — Draft (Writer + Draft skill — Sonnet)
      await step.run('script-4c-draft', async () => {
        await updateProjectStatus(db, projectId, 'script_draft', 'script_draft');

        const systemPrompt = await loadPromptWithFallback(
          db,
          'writer',
          'draft',
          'You are the Writer. Write a complete script draft based on the beat sheet. Include scene headings, action lines, and dialogue/narration. Output JSON: {"scenes":[],"voiceover":"","totalWords":0}',
        );

        const [beatSheet, concept] = await Promise.all([
          loadLatestArtifactContent(db, projectId, 'beat_sheet'),
          loadLatestArtifactContent(db, projectId, 'concept'),
        ]);

        const result = await classifyText({
          ctx: { agentId: 'writer', skillId: 'draft', tenantId },
          model: MODELS.sonnet,
          system: systemPrompt,
          prompt: `Beat Sheet:\n${beatSheet}\nConcept:\n${concept}\n\nWrite the full script draft. Output JSON.`,
        });

        let content: Record<string, unknown> = { rawText: result.text };
        try {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
        } catch { /* use raw */ }

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'script',
          artifactType: 'script',
          version: 1,
          gateIteration: 1,
          content,
        });
      });

      // 4d — Polish (Writer + Polish skill — Sonnet)
      await step.run('script-4d-polish', async () => {
        await updateProjectStatus(db, projectId, 'script_polish', 'script_polish');

        const systemPrompt = await loadPromptWithFallback(
          db,
          'writer',
          'polish',
          'You are the Writer. Polish the script draft — refine language, improve flow, check timing, strengthen emotional beats. Output the polished script as JSON.',
        );

        const scriptDraft = await loadLatestArtifactContent(db, projectId, 'script');
        const brandContext = await loadBrandDnaContext(db, tenantId);

        const result = await classifyText({
          ctx: { agentId: 'writer', skillId: 'polish', tenantId },
          model: MODELS.sonnet,
          system: systemPrompt,
          prompt: `Script Draft:\n${scriptDraft}\nBrand Voice Context:\n${brandContext}\n\nPolish the script. Output JSON.`,
        });

        let content: Record<string, unknown> = { rawText: result.text };
        try {
          const match = result.text.match(/\{[\s\S]*\}/);
          if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
        } catch { /* use raw */ }

        // Save as new version of script artifact
        const [latestScript] = await db
          .select({ version: videoArtifacts.version })
          .from(videoArtifacts)
          .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'script')))
          .orderBy(desc(videoArtifacts.version))
          .limit(1);

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'script',
          artifactType: 'script',
          version: (latestScript?.version ?? 1) + 1,
          gateIteration: 1,
          content,
        });
      });

      // ── Gate 2: Script Quality Gate ───────────────────────────────────────
      await updateProjectStatus(db, projectId, 'gate_2', 'gate_2');

      // Tracks which sub-step to retry from on G2 failure
      let scriptRetryFrom: ScriptSubStep['retryFrom'] = 'script-draft';
      let scriptVersion = 2;

      const gate2Result = await runGate(
        step,
        db,
        tenantId,
        projectId,
        organizationId,
        2,
        'script-evaluation',
        'textual-voice-review',
        'You are the Director. Evaluate the polished script for narrative quality, pacing, emotional impact, and execution. If the verdict is not advance, indicate the root cause: "structure_problem" (→ restart from structure), "execution_problem" (→ restart from draft), or "minor_issues" (→ polish only). Output JSON: {"verdict":"...","reasoning":"...","rootCause":"execution_problem|structure_problem|minor_issues","feedback":{}}',
        'You are the Brand Guardian. Evaluate the script for brand voice, tone, and messaging alignment. Output JSON: {"verdict":"pass|warning|fail","reasoning":"...","fixGuidance":"..."}',
        () => loadLatestArtifactContent(db, projectId, 'script'),
        // Executor retry: Writer re-runs from indicated sub-step
        async (attempt, feedback) => {
          // Determine which sub-step to return to based on Director feedback
          const dirFeedback = feedback?.directorFeedback as Record<string, unknown> | undefined;
          const rootCause = (dirFeedback?.rootCause as string) ?? 'execution_problem';

          if (rootCause === 'structure_problem') {
            scriptRetryFrom = 'script-structure';
          } else if (rootCause === 'minor_issues') {
            scriptRetryFrom = 'script-polish';
          } else {
            scriptRetryFrom = 'script-draft';
          }

          const systemPrompt = await loadPromptWithFallback(
            db,
            'writer',
            scriptRetryFrom === 'script-structure' ? 'structure' : scriptRetryFrom === 'script-polish' ? 'polish' : 'draft',
            'You are the Writer. Revise the script based on feedback.',
          );

          const [beatSheet, prevScript] = await Promise.all([
            loadLatestArtifactContent(db, projectId, 'beat_sheet'),
            loadLatestArtifactContent(db, projectId, 'script'),
          ]);

          const result = await classifyText({
            ctx: { agentId: 'writer', skillId: 'draft', tenantId },
            model: MODELS.sonnet,
            system: systemPrompt,
            prompt: `Retry from: ${scriptRetryFrom}\nPrevious Script:\n${prevScript}\nBeat Sheet:\n${beatSheet}\nFeedback:\n${JSON.stringify(feedback)}\n\nRevise the script. Output JSON.`,
          });

          let content: Record<string, unknown> = { rawText: result.text };
          try {
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
          } catch { /* use raw */ }

          scriptVersion++;
          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'script',
            artifactType: 'script',
            version: scriptVersion,
            gateIteration: attempt,
            content,
          });
        },
        // CD revision for G2
        async (attempt, reason) => {
          const systemPrompt = await loadPromptWithFallback(
            db,
            'creative-director',
            'creative-revision',
            'The script has fundamental issues. Revise the creative direction to give the Writer better guidance.',
          );

          const cdArtifact = await loadLatestArtifactContent(db, projectId, 'creative_direction');

          const result = await classifyText({
            ctx: { agentId: 'creative-director', skillId: 'creative-revision', tenantId },
            model: MODELS.opus,
            system: systemPrompt,
            prompt: `Script is blocked. Rethink reason:\n${reason}\nCurrent Creative Direction:\n${cdArtifact}\n\nRevise creative direction for script guidance. Output JSON.`,
          });

          let content: Record<string, unknown> = { rawText: result.text };
          try {
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
          } catch { /* use raw */ }

          const [latestDir] = await db
            .select({ version: videoArtifacts.version })
            .from(videoArtifacts)
            .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'creative_direction')))
            .orderBy(desc(videoArtifacts.version))
            .limit(1);

          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'creative_direction',
            artifactType: 'creative_direction',
            version: (latestDir?.version ?? 1) + 1,
            gateIteration: attempt,
            content,
          });
        },
        'escalated',
      );

      if (gate2Result.escalated) {
        return { escalated: true, gate: 2, projectId };
      }

      // ── Step 5: Visual Look (DP agent — Sonnet) ────────────────────────────
      await step.run('visual-look', async () => {
        await updateProjectStatus(db, projectId, 'visual_look', 'visual_look');

        const [script, cdArtifact] = await Promise.all([
          loadLatestArtifactContent(db, projectId, 'script'),
          loadLatestArtifactContent(db, projectId, 'creative_direction'),
        ]);

        // DP produces shot list + visual specs as structured JSON (stub content)
        const shotListContent: Record<string, unknown> = {
          shots: [
            { index: 0, description: 'Opening wide shot', cameraMovement: 'slow push in', duration: 3, lens: '24mm', lighting: 'natural golden hour' },
            { index: 1, description: 'Product hero shot', cameraMovement: 'static', duration: 2, lens: '85mm', lighting: 'studio controlled' },
            { index: 2, description: 'Customer reaction', cameraMovement: 'handheld', duration: 2, lens: '50mm', lighting: 'practical' },
            { index: 3, description: 'Brand lock-up close', cameraMovement: 'slow zoom out', duration: 3, lens: '100mm macro', lighting: 'backlit' },
          ],
          colorPalette: { primary: '#1a1a2e', secondary: '#e94560', accent: '#f5f5f5' },
          visualStyle: 'cinematic documentary with warm grade',
          aspectRatio: '16:9',
          totalDurationSeconds: 30,
          derivedFrom: { script: 'truncated', creativeDirection: 'truncated' },
        };

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'shot_list',
          artifactType: 'shot_list',
          version: 1,
          gateIteration: 1,
          content: shotListContent,
        });
      });

      // ── Step 6: Storyboard (DP + Visual Designer — stub image gen) ────────
      await step.run('storyboard', async () => {
        await updateProjectStatus(db, projectId, 'storyboard', 'storyboard');

        const apis = createStubExternalAPIs();
        const shotListJson = await loadLatestArtifactContent(db, projectId, 'shot_list');

        let shotList: Array<{ index: number; description: string; cameraMovement: string }> = [];
        try {
          const parsed = JSON.parse(shotListJson) as { shots?: typeof shotList };
          shotList = parsed.shots ?? [];
        } catch { /* use defaults */ }

        if (shotList.length === 0) {
          shotList = [{ index: 0, description: 'Default shot', cameraMovement: 'static' }];
        }

        // Generate storyboard frame for each shot
        const frames = await Promise.all(
          shotList.map((shot) =>
            apis.image.generate({
              prompt: `Storyboard frame: ${shot.description}. Camera: ${shot.cameraMovement}. Style: cinematic.`,
              aspectRatio: '16:9',
            }),
          ),
        );

        const storyboardContent: Record<string, unknown> = {
          frames: frames.map((f, i) => ({
            shotIndex: shotList[i]?.index ?? i,
            shotDescription: shotList[i]?.description,
            imageUrl: f.imageUrl,
            isStub: f.isStub,
            estimatedCost: f.estimatedCost,
          })),
          generatedAt: new Date().toISOString(),
        };

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'storyboard',
          artifactType: 'storyboard',
          version: 1,
          gateIteration: 1,
          content: storyboardContent,
        });
      });

      // ── Gate 3: Visual / Storyboard Gate (+ optional client approval) ─────
      await updateProjectStatus(db, projectId, 'gate_3', 'gate_3');

      let storyboardVersion = 1;

      const gate3Result = await runGate(
        step,
        db,
        tenantId,
        projectId,
        organizationId,
        3,
        'visual-evaluation',
        'visual-identity-review',
        'You are the Director. Evaluate the storyboard and shot list for visual quality, narrative flow, and cinematographic choices. Output JSON: {"verdict":"advance|iterate|rethink","reasoning":"...","feedback":{}}',
        'You are the Brand Guardian. Evaluate the storyboard for visual brand identity alignment — colors, composition style, and visual tone. Output JSON: {"verdict":"pass|warning|fail","reasoning":"...","fixGuidance":"..."}',
        () => loadLatestArtifactContent(db, projectId, 'storyboard'),
        // DP retries storyboard
        async (attempt) => {
          const apis = createStubExternalAPIs();
          const shotListJson = await loadLatestArtifactContent(db, projectId, 'shot_list');
          let shotList: Array<{ index: number; description: string; cameraMovement: string }> = [];
          try {
            const parsed = JSON.parse(shotListJson) as { shots?: typeof shotList };
            shotList = parsed.shots ?? [];
          } catch { /* use defaults */ }

          const frames = await Promise.all(
            shotList.map((shot) =>
              apis.image.generate({
                prompt: `Revised storyboard (attempt ${attempt}): ${shot.description}. Camera: ${shot.cameraMovement}.`,
                aspectRatio: '16:9',
              }),
            ),
          );

          storyboardVersion++;
          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'storyboard',
            artifactType: 'storyboard',
            version: storyboardVersion,
            gateIteration: attempt,
            content: {
              frames: frames.map((f, i) => ({
                shotIndex: i,
                imageUrl: f.imageUrl,
                isStub: f.isStub,
              })),
              revision: attempt,
            },
          });
        },
        // CD revision for G3
        async (attempt, reason) => {
          const systemPrompt = await loadPromptWithFallback(
            db,
            'creative-director',
            'creative-revision',
            'The visual direction needs revision. Update the creative direction with new visual guidance.',
          );

          const cdArtifact = await loadLatestArtifactContent(db, projectId, 'creative_direction');

          const result = await classifyText({
            ctx: { agentId: 'creative-director', skillId: 'creative-revision', tenantId },
            model: MODELS.opus,
            system: systemPrompt,
            prompt: `Visual storyboard blocked. Rethink:\n${reason}\nCreative Direction:\n${cdArtifact}\n\nRevise visual direction. Output JSON.`,
          });

          let content: Record<string, unknown> = { rawText: result.text };
          try {
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
          } catch { /* use raw */ }

          const [latestDir] = await db
            .select({ version: videoArtifacts.version })
            .from(videoArtifacts)
            .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'creative_direction')))
            .orderBy(desc(videoArtifacts.version))
            .limit(1);

          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'creative_direction',
            artifactType: 'creative_direction',
            version: (latestDir?.version ?? 1) + 1,
            gateIteration: attempt,
            content,
          });
        },
        'escalated',
      );

      if (gate3Result.escalated) {
        return { escalated: true, gate: 3, projectId };
      }

      // G3 special: client approval opportunity
      // Read autonomy mode fresh from DB — do not use step state (DEC-148)
      const autonomyMode = await step.run('g3-check-autonomy-mode', async () => {
        const [proj] = await db
          .select({ autonomyMode: videoProjects.autonomyMode })
          .from(videoProjects)
          .where(eq(videoProjects.id, projectId))
          .limit(1);
        return proj?.autonomyMode ?? 'ai_recommends';
      });

      // Log client approval opportunity record
      await step.run('g3-log-client-opportunity', async () => {
        const [latestGateReview] = await db
          .select({ id: videoGateReviews.id })
          .from(videoGateReviews)
          .where(
            and(
              eq(videoGateReviews.projectId, projectId),
              eq(videoGateReviews.gateNumber, 3),
            ),
          )
          .orderBy(desc(videoGateReviews.createdAt))
          .limit(1);

        if (latestGateReview) {
          await db
            .update(videoGateReviews)
            .set({
              clientApprovalStatus: autonomyMode === 'ai_recommends' ? 'pending' : 'offered',
            })
            .where(eq(videoGateReviews.id, latestGateReview.id));
        }
      });

      if (autonomyMode === 'ai_recommends') {
        // Block pipeline until client approves or times out (7 days)
        await updateProjectStatus(db, projectId, 'gate_3_pending_client', 'gate_3_pending_client');

        const clientApproval = await step.waitForEvent(
          'g3-client-approval',
          {
            event: 'video-motor/client-approved',
            timeout: '7d',
            // Match on projectId
            if: `async.data.projectId == "${projectId}"`,
          },
        );

        if (!clientApproval || clientApproval.data.approved === false) {
          // Client rejected or timed out — escalate
          await step.run('g3-client-rejected', async () => {
            await db
              .update(videoProjects)
              .set({
                status: 'escalated',
                currentStep: 'gate_3_client_rejected',
                escalatedAt: new Date(),
                escalationReason: clientApproval
                  ? `Client rejected storyboard: ${clientApproval.data.notes ?? 'No reason given'}`
                  : 'Client approval timeout (7d)',
              })
              .where(eq(videoProjects.id, projectId));
          });
          return { escalated: true, gate: '3_client', projectId };
        }

        // Client approved — record it
        await step.run('g3-client-approved', async () => {
          const [latestGateReview] = await db
            .select({ id: videoGateReviews.id })
            .from(videoGateReviews)
            .where(
              and(
                eq(videoGateReviews.projectId, projectId),
                eq(videoGateReviews.gateNumber, 3),
              ),
            )
            .orderBy(desc(videoGateReviews.createdAt))
            .limit(1);

          if (latestGateReview) {
            await db
              .update(videoGateReviews)
              .set({
                clientApprovalStatus: 'approved',
                clientApprovalNotes: clientApproval.data.notes ?? null,
              })
              .where(eq(videoGateReviews.id, latestGateReview.id));
          }
        });
      }
      // In 'ai_decides' mode, G3 already logged the opportunity above — continue immediately

      // ── Step 7: Video Generation (DP — stub video gen per shot) ───────────
      await step.run('video-generation', async () => {
        await updateProjectStatus(db, projectId, 'video_gen', 'video_gen');

        const apis = createStubExternalAPIs();
        const shotListJson = await loadLatestArtifactContent(db, projectId, 'shot_list');
        const storyboardJson = await loadLatestArtifactContent(db, projectId, 'storyboard');

        let shotList: Array<{ index: number; description: string; cameraMovement: string; duration?: number }> = [];
        try {
          const parsed = JSON.parse(shotListJson) as { shots?: typeof shotList };
          shotList = parsed.shots ?? [];
        } catch { /* use defaults */ }

        let storyboardFrames: Array<{ shotIndex: number; imageUrl: string }> = [];
        try {
          const parsed = JSON.parse(storyboardJson) as { frames?: typeof storyboardFrames };
          storyboardFrames = parsed.frames ?? [];
        } catch { /* no frames */ }

        if (shotList.length === 0) {
          shotList = [{ index: 0, description: 'Default shot', cameraMovement: 'static', duration: 3 }];
        }

        const clips = await Promise.all(
          shotList.map((shot, i) =>
            apis.video.generateClip({
              prompt: `Shot ${shot.index}: ${shot.description}. Camera: ${shot.cameraMovement}.`,
              durationSeconds: shot.duration ?? 3,
              referenceImageUrl: storyboardFrames[i]?.imageUrl,
              cameraMovement: shot.cameraMovement,
              shotIndex: shot.index,
            }),
          ),
        );

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'clips',
          artifactType: 'clips',
          version: 1,
          gateIteration: 1,
          content: {
            clips: clips.map((c, i) => ({
              shotIndex: shotList[i]?.index ?? i,
              clipUrl: c.clipUrl,
              durationSeconds: c.durationSeconds,
              estimatedCost: c.estimatedCost,
              isStub: c.isStub,
            })),
            totalDurationSeconds: clips.reduce((sum, c) => sum + c.durationSeconds, 0),
            generatedAt: new Date().toISOString(),
          },
        });
      });

      // ── Step 8: Editing (Editor — stub assembly) ───────────────────────────
      await step.run('editing', async () => {
        await updateProjectStatus(db, projectId, 'editing', 'editing');

        const clipsJson = await loadLatestArtifactContent(db, projectId, 'clips');
        const scriptJson = await loadLatestArtifactContent(db, projectId, 'script');

        // Editor produces timeline/edit data as structured JSON
        const editContent: Record<string, unknown> = {
          timeline: {
            totalDurationSeconds: 30,
            tracks: [
              { type: 'video', clips: JSON.parse(clipsJson) },
              { type: 'script_reference', content: scriptJson },
            ],
          },
          cuts: [
            { timestamp: 0, type: 'cut', fromShot: 0, toShot: 1 },
            { timestamp: 5, type: 'dissolve', fromShot: 1, toShot: 2 },
            { timestamp: 9, type: 'cut', fromShot: 2, toShot: 3 },
          ],
          rhythm: 'medium_paced',
          colorGrade: 'warm_cinematic',
          assembledAt: new Date().toISOString(),
        };

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'edit',
          artifactType: 'edit',
          version: 1,
          gateIteration: 1,
          content: editContent,
        });
      });

      // ── Step 9: Audio (Audio Producer — stub voice + music) ───────────────
      await step.run('audio', async () => {
        await updateProjectStatus(db, projectId, 'audio', 'audio');

        const apis = createStubExternalAPIs();
        const scriptJson = await loadLatestArtifactContent(db, projectId, 'script');
        const cdArtifact = await loadLatestArtifactContent(db, projectId, 'creative_direction');

        let scriptText = 'Default voiceover text for the video project.';
        try {
          const parsed = JSON.parse(scriptJson) as { voiceover?: string; scenes?: Array<{ narration?: string }> };
          scriptText = parsed.voiceover
            ?? parsed.scenes?.map((s) => s.narration ?? '').join(' ')
            ?? scriptText;
        } catch { /* use default */ }

        let audioDirection = 'warm, uplifting, professional';
        try {
          const parsed = JSON.parse(cdArtifact) as { audioDirection?: string };
          audioDirection = parsed.audioDirection ?? audioDirection;
        } catch { /* use default */ }

        const [voiceResult, musicResult] = await Promise.all([
          apis.voice.generate({
            text: scriptText,
            emotion: 'confident',
            pace: 1.0,
          }),
          apis.music.generate({
            moodDescription: audioDirection,
            durationSeconds: 32,
            genre: 'cinematic',
          }),
        ]);

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'audio_tracks',
          artifactType: 'audio_tracks',
          version: 1,
          gateIteration: 1,
          content: {
            voiceover: {
              audioUrl: voiceResult.audioUrl,
              durationSeconds: voiceResult.durationSeconds,
              estimatedCost: voiceResult.estimatedCost,
              isStub: voiceResult.isStub,
            },
            music: {
              audioUrl: musicResult.audioUrl,
              durationSeconds: musicResult.durationSeconds,
              estimatedCost: musicResult.estimatedCost,
              isStub: musicResult.isStub,
            },
            mixSettings: {
              voiceoverLevel: 0.85,
              musicLevel: 0.35,
              sfxLevel: 0.5,
            },
            producedAt: new Date().toISOString(),
          },
        });
      });

      // ── Gate 4: Edit / Audio Gate (with diagnostic protocol on failure) ───
      await updateProjectStatus(db, projectId, 'gate_4', 'gate_4');

      let editVersion = 1;
      let audioVersion = 1;
      let clipsVersion = 1;

      const gate4Result = await runGate(
        step,
        db,
        tenantId,
        projectId,
        organizationId,
        4,
        'edit-evaluation',
        'textual-voice-review',
        'You are the Director. Evaluate the assembled edit + audio for rhythm, pacing, narrative impact, and technical quality. If not advancing, diagnose the root cause: "shots_problem" | "edit_problem" | "audio_problem" | "combined". Output JSON: {"verdict":"advance|iterate|rethink","reasoning":"...","diagnosis":"shots_problem|edit_problem|audio_problem|combined","feedback":{}}',
        'You are the Brand Guardian. Evaluate the edit for brand voice consistency in voiceover, music tone, and visual brand presence. Output JSON.',
        () => loadLatestArtifactContent(db, projectId, 'edit'),
        // G4 diagnostic executor retry
        async (attempt, feedback) => {
          const dirFeedback = feedback?.directorFeedback as Record<string, unknown> | undefined;
          const diagnosis = (dirFeedback?.diagnosis as string) ?? 'edit_problem';

          if (diagnosis === 'shots_problem') {
            // Re-run video generation with DP feedback
            const apis = createStubExternalAPIs();
            const shotListJson = await loadLatestArtifactContent(db, projectId, 'shot_list');
            let shotList: Array<{ index: number; description: string; cameraMovement: string; duration?: number }> = [];
            try {
              const parsed = JSON.parse(shotListJson) as { shots?: typeof shotList };
              shotList = parsed.shots ?? [];
            } catch { /* defaults */ }

            const clips = await Promise.all(
              shotList.map((shot) =>
                apis.video.generateClip({
                  prompt: `Revised shot ${shot.index} (attempt ${attempt}, DP feedback): ${shot.description}. Camera: ${shot.cameraMovement}.`,
                  durationSeconds: shot.duration ?? 3,
                  cameraMovement: shot.cameraMovement,
                  shotIndex: shot.index,
                }),
              ),
            );

            clipsVersion++;
            await saveArtifact(db, {
              projectId,
              organizationId,
              step: 'clips',
              artifactType: 'clips',
              version: clipsVersion,
              gateIteration: attempt,
              content: {
                clips: clips.map((c, i) => ({
                  shotIndex: i,
                  clipUrl: c.clipUrl,
                  durationSeconds: c.durationSeconds,
                  isStub: c.isStub,
                })),
                diagnosedIssue: 'shots_problem',
                revision: attempt,
              },
            });
          } else if (diagnosis === 'audio_problem') {
            // Re-run audio
            const apis = createStubExternalAPIs();
            const scriptJson = await loadLatestArtifactContent(db, projectId, 'script');

            let scriptText = 'Revised voiceover.';
            try {
              const parsed = JSON.parse(scriptJson) as { voiceover?: string };
              scriptText = parsed.voiceover ?? scriptText;
            } catch { /* use default */ }

            const [voiceResult, musicResult] = await Promise.all([
              apis.voice.generate({ text: scriptText, emotion: 'confident', pace: 1.0 }),
              apis.music.generate({ moodDescription: 'revised cinematic', durationSeconds: 32 }),
            ]);

            audioVersion++;
            await saveArtifact(db, {
              projectId,
              organizationId,
              step: 'audio_tracks',
              artifactType: 'audio_tracks',
              version: audioVersion,
              gateIteration: attempt,
              content: {
                voiceover: { audioUrl: voiceResult.audioUrl, isStub: voiceResult.isStub },
                music: { audioUrl: musicResult.audioUrl, isStub: musicResult.isStub },
                diagnosedIssue: 'audio_problem',
                revision: attempt,
              },
            });
          } else {
            // edit_problem or combined — re-run editing
            const clipsJson = await loadLatestArtifactContent(db, projectId, 'clips');

            editVersion++;
            await saveArtifact(db, {
              projectId,
              organizationId,
              step: 'edit',
              artifactType: 'edit',
              version: editVersion,
              gateIteration: attempt,
              content: {
                timeline: { revised: true, iteration: attempt },
                diagnosedIssue: diagnosis,
                previousClips: clipsJson,
                revision: attempt,
              },
            });
          }
        },
        // CD revision for G4
        async (attempt, reason) => {
          const systemPrompt = await loadPromptWithFallback(
            db,
            'creative-director',
            'creative-revision',
            'The edit/audio needs fundamental revision. Update creative direction with specific guidance for the editor and audio producer.',
          );

          const cdArtifact = await loadLatestArtifactContent(db, projectId, 'creative_direction');

          const result = await classifyText({
            ctx: { agentId: 'creative-director', skillId: 'creative-revision', tenantId },
            model: MODELS.opus,
            system: systemPrompt,
            prompt: `Edit blocked. Rethink:\n${reason}\nCreative Direction:\n${cdArtifact}\n\nRevise for editor + audio guidance. Output JSON.`,
          });

          let content: Record<string, unknown> = { rawText: result.text };
          try {
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) content = JSON.parse(match[0]) as Record<string, unknown>;
          } catch { /* use raw */ }

          const [latestDir] = await db
            .select({ version: videoArtifacts.version })
            .from(videoArtifacts)
            .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'creative_direction')))
            .orderBy(desc(videoArtifacts.version))
            .limit(1);

          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'creative_direction',
            artifactType: 'creative_direction',
            version: (latestDir?.version ?? 1) + 1,
            gateIteration: attempt,
            content,
          });
        },
        'escalated',
      );

      if (gate4Result.escalated) {
        return { escalated: true, gate: 4, projectId };
      }

      // ── Step 10: Polish (Editor — color grade + subtitles simulation) ─────
      await step.run('polish', async () => {
        await updateProjectStatus(db, projectId, 'polish', 'polish');

        const editJson = await loadLatestArtifactContent(db, projectId, 'edit');
        const audioJson = await loadLatestArtifactContent(db, projectId, 'audio_tracks');

        // Final color grade + subtitle simulation (stub)
        const finalVideoContent: Record<string, unknown> = {
          colorGrade: {
            lut: 'warm_cinematic_v2',
            contrast: 1.05,
            saturation: 0.95,
            highlights: -10,
            shadows: +5,
            applied: true,
          },
          subtitles: {
            generated: true,
            language: 'es',
            accessibility: { srt: 'stub://subs/final.srt', vtt: 'stub://subs/final.vtt' },
          },
          deliveryFormats: [
            { format: 'mp4', resolution: '1920x1080', codec: 'h264', url: 'stub://video/final-1080p.mp4' },
            { format: 'mp4', resolution: '1280x720', codec: 'h264', url: 'stub://video/final-720p.mp4' },
            { format: 'mp4', resolution: '1080x1920', codec: 'h264', url: 'stub://video/final-vertical.mp4' },
          ],
          baseEdit: editJson,
          audioTracks: audioJson,
          polishedAt: new Date().toISOString(),
        };

        await saveArtifact(db, {
          projectId,
          organizationId,
          step: 'final_video',
          artifactType: 'final_video',
          version: 1,
          gateIteration: 1,
          content: finalVideoContent,
        });
      });

      // ── Gate 5: Final Quality Gate (surgical fixes only on failure) ────────
      await updateProjectStatus(db, projectId, 'gate_5', 'gate_5');

      let finalVideoVersion = 1;

      const gate5Result = await runGate(
        step,
        db,
        tenantId,
        projectId,
        organizationId,
        5,
        'final-quality',
        'visual-identity-review',
        'You are the Director. This is the final quality gate. Evaluate the complete polished video — color, subtitles, delivery formats, and overall execution. Only advance if everything is broadcast-ready. If iterating, specify the SINGLE most critical fix (surgical fix only). Output JSON: {"verdict":"advance|iterate|rethink","reasoning":"...","surgicalFix":"...","feedback":{}}',
        'You are the Brand Guardian. Final check — verify all brand elements are correctly applied: logo, colors, typography, voice, and messaging. Output JSON.',
        () => loadLatestArtifactContent(db, projectId, 'final_video'),
        // Surgical fix executor — Editor applies the single critical fix
        async (attempt, feedback) => {
          const dirFeedback = feedback?.directorFeedback as Record<string, unknown> | undefined;
          const surgicalFix = (dirFeedback?.surgicalFix as string) ?? 'Apply general polish corrections';

          const finalVideoJson = await loadLatestArtifactContent(db, projectId, 'final_video');

          let prevContent: Record<string, unknown> = {};
          try {
            prevContent = JSON.parse(finalVideoJson) as Record<string, unknown>;
          } catch { /* use empty */ }

          finalVideoVersion++;
          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'final_video',
            artifactType: 'final_video',
            version: finalVideoVersion,
            gateIteration: attempt,
            content: {
              ...prevContent,
              surgicalFix,
              surgicalFixApplied: true,
              fixAppliedAt: new Date().toISOString(),
              revision: attempt,
            },
          });
        },
        // CD revision for G5 (last resort)
        async (attempt, reason) => {
          // G5 rethink is rare — just log it, no creative direction revision needed at delivery
          console.warn(`[video-motor] G5 CD revision requested at attempt ${attempt}: ${reason}`);

          const [latestDir] = await db
            .select({ version: videoArtifacts.version })
            .from(videoArtifacts)
            .where(and(eq(videoArtifacts.projectId, projectId), eq(videoArtifacts.step, 'creative_direction')))
            .orderBy(desc(videoArtifacts.version))
            .limit(1);

          // Log a note in CD artifact
          await saveArtifact(db, {
            projectId,
            organizationId,
            step: 'creative_direction',
            artifactType: 'creative_direction',
            version: (latestDir?.version ?? 1) + 1,
            gateIteration: attempt,
            content: {
              note: `G5 escalation note at attempt ${attempt}`,
              reason,
              timestamp: new Date().toISOString(),
            },
          });
        },
        'escalated',
      );

      if (gate5Result.escalated) {
        return { escalated: true, gate: 5, projectId };
      }

      // ── Step 11: Delivery ─────────────────────────────────────────────────
      await step.run('delivery', async () => {
        await updateProjectStatus(db, projectId, 'delivered', 'delivered');

        // Mark project as delivered
        await db
          .update(videoProjects)
          .set({
            status: 'delivered',
            currentStep: 'delivered',
            deliveredAt: new Date(),
          })
          .where(eq(videoProjects.id, projectId));

        // Register final video in Output Registry (DEC-130)
        const finalVideoJson = await loadLatestArtifactContent(db, projectId, 'final_video');
        let finalVideoId: string | undefined;
        try {
          const [artifact] = await db
            .select({ id: videoArtifacts.id })
            .from(videoArtifacts)
            .where(
              and(
                eq(videoArtifacts.projectId, projectId),
                eq(videoArtifacts.step, 'final_video'),
              ),
            )
            .orderBy(desc(videoArtifacts.version))
            .limit(1);
          finalVideoId = artifact?.id;
        } catch { /* skip */ }

        if (finalVideoId) {
          await db.insert(outputRegistry).values({
            organizationId,
            sourceMotor: 'video-motor',
            sourceAgentId: 'editor',
            outputType: 'final_video',
            contentRef: finalVideoId,
            summary: `Delivered video project ${projectId} for tenant ${tenantId}`,
            metadata: {
              projectId,
              deliveredAt: new Date().toISOString(),
            },
          });
        }

        // Record motor execution
        await db.insert(motorExecutions).values({
          organizationId,
          motor: 'video-motor',
          status: 'completed',
          triggeredBy: 'pipeline',
          completedAt: new Date(),
          metadata: {
            projectId,
            deliveredAt: new Date().toISOString(),
          },
        });
      });

      return {
        success: true,
        projectId,
        tenantId,
        status: 'delivered',
      };
    },
  );
}
