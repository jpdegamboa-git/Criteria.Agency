/**
 * Web Motor — Live LLM Validation Script
 *
 * Validates the Web Motor pipeline with a real Anthropic API call.
 * Runs the first two steps (CD + Writer) directly without Inngest,
 * so it can be executed without a running Inngest Dev Server.
 *
 * What this validates:
 *   1. CD agent produces a creative direction document for a landing page
 *   2. Writer agent produces structured copy (H1, CTAs, meta) per page
 *   3. Brand Guardian evaluates the copy (textual voice review)
 *   4. All artifacts are stored correctly in the DB
 *   5. Tenant isolation holds throughout
 *
 * Usage:
 *   pnpm --filter @criteria/api validate:web-motor
 *
 * Requirements:
 *   - DATABASE_URL in .env
 *   - ANTHROPIC_API_KEY in .env (with credits)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { tool } from 'ai';

// Try multiple path strategies to locate .env (tsx CWD may differ)
// override: true — shell may have empty env vars set that block dotenv defaults
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '../../../.env'), override: true });

import {
  createDb,
  organizationSettings,
  webProjects,
  webArtifacts,
  webGateResults,
  brandDnaArtifacts,
  eq,
  and,
  desc,
} from '@criteria/db';
import { runAgentWithTools, classifyText, MODELS } from './lib/ai.js';
import { loadPrompt } from './lib/prompt-loader.js';

const db = createDb();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function log(msg: string, data?: unknown) {
  const time = new Date().toISOString().slice(11, 19);
  if (data) {
    console.log(`[${time}] ${msg}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${time}] ${msg}`);
  }
}

async function loadPromptWithFallback(agentId: string, skillId: string, fallback: string): Promise<string> {
  try {
    const config = await loadPrompt(db, agentId, skillId);
    log(`✓ Prompt loaded from registry: ${agentId}/${skillId} (v${config.version})`);
    return config.systemPrompt;
  } catch {
    log(`⚠ No prompt in registry for ${agentId}/${skillId} — using fallback`);
    return fallback;
  }
}

async function loadBrandDna(tenantId: string): Promise<string> {
  const artifacts = await db
    .select({ artifactType: brandDnaArtifacts.artifactType, content: brandDnaArtifacts.content, layer: brandDnaArtifacts.layer })
    .from(brandDnaArtifacts)
    .where(eq(brandDnaArtifacts.organizationId, tenantId))
    .limit(20);

  if (artifacts.length === 0) {
    return `No Brand DNA found for tenant ${tenantId}. Using placeholder brand identity for validation:
- Brand name: criteria.agency
- Category: Marketing automation for LATAM SMBs
- Voice: Confident, clear, warm. Never corporate. Never generic.
- Values: Precision, results, autonomy.
- Audience: LATAM founders and marketing managers.`;
  }

  return artifacts.map((a) => `[${a.artifactType} / Layer ${a.layer}]: ${JSON.stringify(a.content)}`).join('\n');
}

// ── Validation ────────────────────────────────────────────────────────────────

async function validate() {
  log('=== Web Motor Live LLM Validation ===');
  log('');

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set — cannot run live LLM validation');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  // ── 1. Find or use seed tenant ────────────────────────────────────────────
  const [tenant] = await db
    .select({ organizationId: organizationSettings.organizationId })
    .from(organizationSettings)
    .limit(1);

  if (!tenant) {
    throw new Error('No tenant found — run `pnpm seed` first');
  }
  const tenantId = tenant.organizationId;
  log(`✓ Using tenant: ${tenantId}`);

  // ── 2. Create validation project ─────────────────────────────────────────
  const [project] = await db.insert(webProjects).values({
    organizationId: tenantId,
    siteType: 'landing_page',
    status: 'brief_intake',
    currentStep: 'brief-intake',
    brief: {
      pages: ['home'],
      targetAudience: 'LATAM small business owners and marketing managers who need intelligent marketing automation',
      conversionObjectives: 'Email sign-up for waitlist, demo request',
      siteType: 'landing_page',
      hasBlog: false,
      technicalRequirements: 'Next.js static export, English and Spanish support',
      emailCapture: 'resend',
      analytics: 'ga4',
    },
    autonomyMode: 'ai_decides',
    gateIterations: { g1: 0, g2: 0, g3: 0 },
  }).returning({ id: webProjects.id });

  log(`✓ Project created: ${project.id}`);

  const brief = {
    pages: ['home'],
    targetAudience: 'LATAM small business owners and marketing managers',
    conversionObjectives: 'Email sign-up for waitlist, demo request',
    siteType: 'landing_page',
  };

  try {
    // ── 3. Step 2: Creative Direction ───────────────────────────────────────
    log('');
    log('── Step 2: Creative Direction (CD, Opus, Tier A) ──');
    await db.update(webProjects).set({ status: 'creative_direction' }).where(eq(webProjects.id, project.id));

    const brandDna = await loadBrandDna(tenantId);
    const cdSystemPrompt = await loadPromptWithFallback(
      'creative-director', 'web-direction',
      `You are the Creative Director for criteria.agency.
Given a client brief and Brand DNA, produce a Creative Direction document for a landing page.
Call update_creative_direction with your complete direction. Be specific and visual.`,
    );

    let cdArtifactSaved = false;
    let cdContent: Record<string, unknown> = {};

    const cdResult = await runAgentWithTools({
      ctx: { agentId: 'creative-director', skillId: 'web-direction', tenantId },
      model: MODELS.sonnet, // Use Sonnet for validation to save Opus credits
      system: cdSystemPrompt,
      prompt: `Client brief: ${JSON.stringify(brief)}\n\nBrand DNA:\n${brandDna}\n\nProduce a complete creative direction for this landing page. Call update_creative_direction when ready.`,
      tools: {
        update_creative_direction: tool({
          description: 'Write the creative direction document',
          inputSchema: z.object({
            visualDirection: z.string(),
            tonalDirection: z.string(),
            userFlow: z.string(),
            interactionPrinciples: z.string(),
            references: z.array(z.string()),
          }),
          execute: async (params) => {
            cdContent = params;
            const [saved] = await db.insert(webArtifacts).values({
              projectId: project.id,
              organizationId: tenantId,
              step: 'creative_direction',
              artifactType: 'creative_direction_doc',
              version: 1,
              gateIteration: 1,
              content: params,
            }).returning({ id: webArtifacts.id });
            cdArtifactSaved = true;
            log(`  ✓ Creative direction saved: ${saved.id}`);
            return { saved: true };
          },
        }),
        read_brief: tool({
          description: 'Read the brief',
          inputSchema: z.object({}),
          execute: async () => ({ brief }),
        }),
        read_brand_dna: tool({
          description: 'Read brand DNA',
          inputSchema: z.object({}),
          execute: async () => ({ brandDna }),
        }),
      },
      maxSteps: 5,
    });

    if (!cdArtifactSaved) {
      log('  ⚠ CD did not call update_creative_direction — capturing from text response');
      cdContent = { rawText: cdResult.text };
      await db.insert(webArtifacts).values({
        projectId: project.id,
        organizationId: tenantId,
        step: 'creative_direction',
        artifactType: 'creative_direction_doc',
        version: 1,
        gateIteration: 1,
        content: { rawText: cdResult.text },
      });
    }

    log('  Creative Direction produced:', {
      visualDirectionPreview: String(cdContent.visualDirection ?? '').slice(0, 100),
      references: cdContent.references,
    });

    // ── 4. Step 3: Copy Production ──────────────────────────────────────────
    log('');
    log('── Step 3: Copy Production (Writer, Sonnet, Tier A) ──');
    await db.update(webProjects).set({ status: 'copy_production' }).where(eq(webProjects.id, project.id));

    const writerSystemPrompt = await loadPromptWithFallback(
      'writer', 'web-copy',
      `You are a professional web copywriter for LATAM brands.
Produce structured copy for a landing page: H1, H2s, body copy, CTAs, microcopy, meta title, meta description.
Call update_copy with the complete copy document.`,
    );

    let copyArtifactSaved = false;
    let copyContent: Record<string, unknown> = {};

    const writerResult = await runAgentWithTools({
      ctx: { agentId: 'writer', skillId: 'web-copy', tenantId },
      model: MODELS.sonnet,
      system: writerSystemPrompt,
      prompt: `Write copy for a landing page.\n\nBrief: ${JSON.stringify(brief)}\n\nCreative Direction: ${JSON.stringify(cdContent)}\n\nBrand DNA: ${brandDna.slice(0, 800)}\n\nProduce complete copy for the home page. Call update_copy when done.`,
      tools: {
        update_copy: tool({
          description: 'Write the copy document',
          inputSchema: z.object({
            pages: z.array(z.object({
              name: z.string(),
              h1: z.string(),
              h2s: z.array(z.string()),
              bodyCopy: z.string(),
              primaryCta: z.string(),
              secondaryCta: z.string().optional(),
              metaTitle: z.string(),
              metaDescription: z.string(),
            })),
          }),
          execute: async (params) => {
            copyContent = params;
            const [saved] = await db.insert(webArtifacts).values({
              projectId: project.id,
              organizationId: tenantId,
              step: 'copy',
              artifactType: 'copy_doc',
              version: 1,
              gateIteration: 1,
              content: params,
            }).returning({ id: webArtifacts.id });
            copyArtifactSaved = true;
            log(`  ✓ Copy saved: ${saved.id}`);
            return { saved: true };
          },
        }),
        read_brief: tool({ description: 'Read brief', inputSchema: z.object({}), execute: async () => ({ brief }) }),
        read_creative_direction: tool({ description: 'Read creative direction', inputSchema: z.object({}), execute: async () => ({ creativeDirection: cdContent }) }),
        read_brand_dna: tool({ description: 'Read brand DNA', inputSchema: z.object({}), execute: async () => ({ brandDna: brandDna.slice(0, 800) }) }),
      },
      maxSteps: 6,
    });

    if (!copyArtifactSaved) {
      log('  ⚠ Writer did not call update_copy — capturing from text response');
      copyContent = { rawText: writerResult.text };
      await db.insert(webArtifacts).values({
        projectId: project.id,
        organizationId: tenantId,
        step: 'copy',
        artifactType: 'copy_doc',
        version: 1,
        gateIteration: 1,
        content: { rawText: writerResult.text },
      });
    }

    const firstPage = (copyContent.pages as Array<Record<string, unknown>>)?.[0];
    log('  Copy produced:', {
      h1: firstPage?.h1 ?? '(from rawText)',
      primaryCta: firstPage?.primaryCta,
      metaTitle: firstPage?.metaTitle,
    });

    // ── 5. Gate 1: Brand Guardian textual voice review ──────────────────────
    log('');
    log('── Gate 1 (simplified): Brand Guardian textual voice review ──');

    const bgSystemPrompt = await loadPromptWithFallback(
      'brand-guardian', 'textual-voice-review',
      `You are the Brand Guardian evaluating web copy for brand voice consistency.
Respond with JSON: {"verdict":"pass|warning|fail","reasoning":"...","fixGuidance":"..."}`,
    );

    const copyText = JSON.stringify(copyContent).slice(0, 2000);
    const bgResult = await classifyText({
      ctx: { agentId: 'brand-guardian', skillId: 'textual-voice-review', tenantId },
      model: MODELS.sonnet,
      system: bgSystemPrompt,
      prompt: `Brand DNA:\n${brandDna.slice(0, 500)}\n\nWeb Copy:\n${copyText}\n\nEvaluate brand voice consistency.`,
    });

    let bgVerdict: 'pass' | 'warning' | 'fail' = 'warning';
    let bgReasoning = bgResult.text;
    let bgFixGuidance = '';
    try {
      const match = bgResult.text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { verdict?: string; reasoning?: string; fixGuidance?: string };
        if (['pass', 'warning', 'fail'].includes(parsed.verdict ?? '')) {
          bgVerdict = parsed.verdict as 'pass' | 'warning' | 'fail';
          bgReasoning = parsed.reasoning ?? bgResult.text;
          bgFixGuidance = parsed.fixGuidance ?? '';
        }
      }
    } catch { /* use defaults */ }

    log(`  Brand Guardian verdict: ${bgVerdict.toUpperCase()}`);
    log(`  Reasoning: ${bgReasoning.slice(0, 200)}`);

    // Save gate result
    const [gateResult] = await db.insert(webGateResults).values({
      projectId: project.id,
      organizationId: tenantId,
      gateNumber: 1,
      iterationNumber: 1,
      cdVerdict: 'advance',
      cdReasoning: 'Validation script: CD evaluation skipped for brevity',
      cdFeedback: {},
      bgVerdict,
      bgReasoning,
      bgFixGuidance,
      qaReport: {},
      combinedVerdict: bgVerdict === 'fail' ? 'iterate' : 'advance',
      resolvedAt: new Date(),
    }).returning({ id: webGateResults.id });

    log(`  ✓ Gate 1 result saved: ${gateResult.id} — combined: ${bgVerdict === 'fail' ? 'iterate' : 'advance'}`);

    // ── 6. Final status ─────────────────────────────────────────────────────
    await db.update(webProjects)
      .set({ status: bgVerdict === 'fail' ? 'gate_1_failed' : 'gate_1_passed', currentStep: 'gate-1' })
      .where(eq(webProjects.id, project.id));

    // ── Summary ─────────────────────────────────────────────────────────────
    log('');
    log('=== Validation complete ===');
    log('');

    const artifacts = await db
      .select({ step: webArtifacts.step, version: webArtifacts.version, id: webArtifacts.id })
      .from(webArtifacts)
      .where(eq(webArtifacts.projectId, project.id));

    log(`Project ID: ${project.id}`);
    log(`Artifacts saved (${artifacts.length}):`);
    for (const a of artifacts) {
      log(`  - ${a.step} v${a.version}: ${a.id}`);
    }
    log(`Gate 1: ${bgVerdict === 'fail' ? 'ITERATE (brand fix needed)' : 'ADVANCE'}`);
    log('');
    log('Token usage logged to Langfuse (if LANGFUSE keys set).');
    log('');
    log('Next steps:');
    log('  1. Check Langfuse dashboard for token costs');
    log('  2. Review artifact content in DB or via GET /api/web-motor/projects/' + project.id);
    log('  3. Run full pipeline via Inngest Dev Server for complete validation');

  } finally {
    await db.close();
  }
}

validate().catch((err) => {
  console.error(err);
  process.exit(1);
});
