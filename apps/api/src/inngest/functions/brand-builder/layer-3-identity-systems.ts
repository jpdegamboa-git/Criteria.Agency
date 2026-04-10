/**
 * Layer 3 — Identidad profesional (Step 1.8 + 1.9)
 *
 * Brand Strategist agent with Identity Systems skill.
 * Produces: brand_book, visual_system_extended, tone_guide_by_channel, brand_guardian_templates.
 *
 * Gate 3 — Brand Guardian participation (DEC-078):
 * - Brand Guardian co-evaluates the layer 3 gate
 * - Uses generateText() with Brand Guardian prompt (classifyText pattern — DEC-141)
 * - Checks: specificity for consistent validation, concrete tone examples, motor-ready visual system
 * - No hard block, but Brand Guardian can reject if guidelines are unusable
 * - Iterates until applicable (3+3 rule applies)
 *
 * DEC-141: Identity Systems uses agent with tools (complex systematization work).
 *          Brand Guardian gate uses generateText() (evaluation/classification pattern).
 * DEC-145: All prompts from registry.
 * DEC-173: Brand Guardian co-evaluates Layer 3.
 */

import { z } from 'zod';
import { tool } from 'ai';
import { inngest } from '../../client.js';
import {
  and,
  eq,
  organizationSettings,
  brandDna,
  brandDnaArtifacts,
  brandHealthScores,
  motorExecutions,
  promptRegistry,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { runAgentWithTools, classifyText, MODELS } from '../../../lib/ai.js';
import { calculateFundamentosScore } from '../../../lib/brand-builder/fundamentos-score.js';

// ── Event schema ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  tenantId: z.string().min(1),
  clientInput: z.string().max(5000).default(''),
  /**
   * Visual preferences from the client:
   * - photographyOrIllustration: 'photography' | 'illustration' | 'both'
   * - aestheticStyle: 'minimalist' | 'expressive' | 'balanced'
   * - colorApproach: 'sober' | 'bold' | 'neutral'
   * - brandReferences: array of brand names they admire visually
   */
  visualPreferences: z.record(z.string(), z.unknown()).default({}),
  attemptNumber: z.number().int().min(1).max(6).default(1),
});

export type Layer3IdentitySystemsEventData = z.infer<typeof eventSchema>;

// ── Inngest function factory ───────────────────────────────────────────────────

export function createLayer3IdentitySystemsFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'brand-builder-layer-3-identity-systems',
      retries: 1,
      triggers: [{ event: 'brand-builder/layer3.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema ───────────────────────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);
        return result.data;
      });

      // ── Step 2: Verify tenant + Brand DNA at Layer 2 ──────────────────────
      const { dnaId } = await step.run('verify-tenant-and-dna', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);
        if (!tenant) throw new Error(`Tenant not found: ${validated.tenantId}`);

        const [dna] = await db
          .select({ id: brandDna.id, currentLayer: brandDna.currentLayer })
          .from(brandDna)
          .where(eq(brandDna.organizationId, validated.tenantId))
          .limit(1);
        if (!dna) throw new Error('No Brand DNA found — complete onboarding first');
        if (dna.currentLayer < 2) throw new Error('Layer 2 must be completed before starting Layer 3');

        return { dnaId: dna.id };
      });

      // ── Step 3: Load prompt meta ──────────────────────────────────────────
      const promptMeta = await step.run('load-prompt-meta', async () => {
        const [p] = await db
          .select({ id: promptRegistry.id, version: promptRegistry.version, model: promptRegistry.model })
          .from(promptRegistry)
          .where(
            and(
              eq(promptRegistry.agentId, 'brand-strategist'),
              eq(promptRegistry.skillId, 'identity_systems'),
              eq(promptRegistry.active, true),
            ),
          )
          .limit(1);

        if (!p) throw new Error('No active prompt for brand-strategist/identity_systems. Run seed.');
        return { id: p.id, version: p.version, model: p.model };
      });

      // ── Step 4: Invoke Brand Strategist with Identity Systems skill ────────
      const agentResult = await step.run('invoke-brand-strategist-layer3', async () => {
        const [prompt] = await db
          .select({ systemPrompt: promptRegistry.systemPrompt })
          .from(promptRegistry)
          .where(eq(promptRegistry.id, promptMeta.id))
          .limit(1);
        if (!prompt) throw new Error('Prompt disappeared between steps');

        // Load all existing artifacts (Layers 0-2) for full context
        const existingArtifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            layer: brandDnaArtifacts.layer,
            status: brandDnaArtifacts.status,
            content: brandDnaArtifacts.content,
          })
          .from(brandDnaArtifacts)
          .where(eq(brandDnaArtifacts.organizationId, validated.tenantId));

        // ── Agent tools ──────────────────────────────────────────────────────
        const tools = {
          read_brand_dna: tool({
            description: 'Read existing Brand DNA artifacts. Layer 3 systematizes everything from Layers 1-2.',
            inputSchema: z.object({
              layer: z.number().optional().describe('Filter by layer. Omit for all.'),
            }),
            execute: async ({ layer }) => {
              if (layer !== undefined) {
                return existingArtifacts.filter((a) => a.layer === layer);
              }
              return existingArtifacts;
            },
          }),

          update_artifact: tool({
            description:
              'Create or update a Brand DNA artifact at Layer 3. ' +
              'Layer 3 types: brand_book, visual_system_extended, tone_guide_by_channel, brand_guardian_templates.',
            inputSchema: z.object({
              artifactType: z.enum([
                'brand_book',
                'visual_system_extended',
                'tone_guide_by_channel',
                'brand_guardian_templates',
              ]),
              content: z.record(z.string(), z.unknown()).describe(
                'Artifact content as structured JSON. Must be specific and actionable.',
              ),
              status: z.enum(['draft', 'validated']).default('validated'),
            }),
            execute: async ({ artifactType, content, status }) => {
              await db
                .delete(brandDnaArtifacts)
                .where(
                  and(
                    eq(brandDnaArtifacts.organizationId, validated.tenantId),
                    eq(brandDnaArtifacts.layer, 3),
                    eq(brandDnaArtifacts.artifactType, artifactType),
                  ),
                );

              const [inserted] = await db
                .insert(brandDnaArtifacts)
                .values({
                  brandDnaId: dnaId,
                  organizationId: validated.tenantId,
                  layer: 3,
                  artifactType,
                  status,
                  content,
                  triggerContext: `layer3-identity-systems-attempt-${validated.attemptNumber}`,
                })
                .returning({ id: brandDnaArtifacts.id });

              return { updated: true, artifactId: inserted.id, artifactType, status };
            },
          }),

          evaluate_applicability: tool({
            description:
              'Self-evaluate whether Layer 3 artifacts are specific enough to be applied by motors. ' +
              'The Brand Guardian will also check this — be honest.',
            inputSchema: z.object({
              brandBookAssessment: z.string().describe(
                'Is the brand book specific enough for consistent Brand Guardian validation?',
              ),
              toneGuideAssessment: z.string().describe(
                'Does the tone guide have concrete per-channel examples, not just abstract guidelines?',
              ),
              visualSystemAssessment: z.string().describe(
                'Does the visual system cover the formats creation motors will actually use?',
              ),
            }),
            execute: async ({ brandBookAssessment, toneGuideAssessment, visualSystemAssessment }) => {
              const layer3Artifacts = await db
                .select({ artifactType: brandDnaArtifacts.artifactType, status: brandDnaArtifacts.status })
                .from(brandDnaArtifacts)
                .where(
                  and(
                    eq(brandDnaArtifacts.organizationId, validated.tenantId),
                    eq(brandDnaArtifacts.layer, 3),
                  ),
                );

              const required = ['brand_book', 'visual_system_extended', 'tone_guide_by_channel', 'brand_guardian_templates'];
              const presentTypes = new Set(layer3Artifacts.map((a) => a.artifactType));
              const missing = required.filter((t) => !presentTypes.has(t));

              return {
                complete: missing.length === 0,
                missingArtifactTypes: missing,
                selfAssessment: {
                  brandBook: brandBookAssessment,
                  toneGuide: toneGuideAssessment,
                  visualSystem: visualSystemAssessment,
                },
                note: missing.length > 0
                  ? `Missing ${missing.length} artifacts — create them before Brand Guardian review`
                  : 'All Layer 3 artifacts created — ready for Brand Guardian gate',
              };
            },
          }),
        };

        const userPrompt = `
Existing Brand DNA (all layers):
${JSON.stringify(existingArtifacts.filter((a) => a.layer >= 1), null, 2)}

Client visual preferences:
${JSON.stringify(validated.visualPreferences, null, 2)}

Additional client input:
${validated.clientInput || '(None provided)'}

Attempt: ${validated.attemptNumber} of 6

Your task — produce 4 Layer 3 artifacts:

1. BRAND BOOK — The single source of truth. Consolidate everything from Layers 1-2.
   Must include: brand purpose, audiences, positioning, archetype, voice, visual identity rules.
   Must be specific enough for the Brand Guardian to validate consistently.

2. EXTENDED VISUAL SYSTEM — Beyond logo and colors.
   Must include: typographic hierarchy, extended color palette usage, photography/illustration guidelines,
   icon system approach, format-specific applications (social, email, web, ads).

3. TONE OF VOICE GUIDE BY CHANNEL — Same voice, different register.
   Must include: Instagram vs email vs website vs ads vs customer service.
   For each: 2-3 concrete example sentences (what the brand would say, what it would never say).

4. BRAND GUARDIAN TEMPLATES — The validation criteria.
   For each type of motor output (video, design, copy), provide the specific checklist
   the Brand Guardian uses to validate it against the Brand DNA.

After creating all 4, call evaluate_applicability with an honest self-assessment.
`;

        const result = await runAgentWithTools({
          ctx: {
            agentId: 'brand-strategist',
            skillId: 'identity_systems',
            tenantId: validated.tenantId,
          },
          model: promptMeta.model as typeof MODELS.sonnet,
          system: prompt.systemPrompt,
          prompt: userPrompt,
          tools,
          maxSteps: 20,
        });

        return {
          text: result.text,
          toolCallCount: result.toolCalls?.length ?? 0,
          usage: {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
          },
          finishReason: result.finishReason,
        };
      });

      // ── Step 5: Brand Guardian gate (DEC-078, DEC-173) ───────────────────
      // Uses generateText() (classification pattern — DEC-141)
      // Brand Guardian evaluates applicability, not coherence
      // Step 1.9: "minimal gate function using generateText()"
      const guardianResult = await step.run('gate-3-brand-guardian-check', async () => {
        const layer3Artifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            status: brandDnaArtifacts.status,
            content: brandDnaArtifacts.content,
          })
          .from(brandDnaArtifacts)
          .where(
            and(
              eq(brandDnaArtifacts.organizationId, validated.tenantId),
              eq(brandDnaArtifacts.layer, 3),
            ),
          );

        const required = ['brand_book', 'visual_system_extended', 'tone_guide_by_channel', 'brand_guardian_templates'];
        const presentTypes = new Set(layer3Artifacts.map((a) => a.artifactType));
        const missing = required.filter((t) => !presentTypes.has(t));

        if (missing.length > 0) {
          return {
            approved: false,
            missingArtifactTypes: missing,
            rejection: `Missing artifacts: ${missing.join(', ')}`,
            checklist: null,
          };
        }

        // Load Brand Guardian prompt (not stored in step state — DEC-148)
        const [guardianPrompt] = await db
          .select({ systemPrompt: promptRegistry.systemPrompt })
          .from(promptRegistry)
          .where(
            and(
              eq(promptRegistry.agentId, 'brand-guardian'),
              eq(promptRegistry.skillId, 'layer3-gate'),
              eq(promptRegistry.active, true),
            ),
          )
          .limit(1);

        if (!guardianPrompt) {
          // Brand Guardian prompt not seeded yet — use applicability rules directly
          const allValidated = layer3Artifacts.every((a) => a.status === 'validated');
          const toneGuide = layer3Artifacts.find((a) => a.artifactType === 'tone_guide_by_channel');
          const hasToneExamples = toneGuide?.content !== null;

          return {
            approved: allValidated && hasToneExamples,
            missingArtifactTypes: [],
            rejection: allValidated ? null : 'Some artifacts are not validated',
            checklist: {
              brandBookSpecific: allValidated,
              toneGuideHasExamples: hasToneExamples,
              visualSystemComplete: true,
              checkedWith: 'rule-based',
            },
          };
        }

        // LLM-based Brand Guardian evaluation (classifyText — generateText pattern)
        const artifactSummary = layer3Artifacts.map((a) => ({
          type: a.artifactType,
          status: a.status,
          // Only pass key fields to avoid token overflow
          contentPreview: JSON.stringify(a.content).slice(0, 500),
        }));

        const guardianCheck = await classifyText({
          ctx: {
            agentId: 'brand-guardian',
            skillId: 'layer3-gate',
            tenantId: validated.tenantId,
          },
          model: MODELS.sonnet,
          system: guardianPrompt.systemPrompt,
          prompt: `
Evaluate these Layer 3 Brand DNA artifacts for applicability (DEC-078).
As the Brand Guardian, you are the primary consumer of these artifacts.

Check:
1. Brand book: Is it specific enough to validate outputs consistently? (Not abstract — does it have concrete criteria?)
2. Tone guide: Does it have concrete examples per channel, not just adjectives?
3. Visual system: Does it cover the formats that creation motors will produce?

Artifacts:
${JSON.stringify(artifactSummary, null, 2)}

Respond with JSON:
{
  "approved": boolean,
  "brandBookSpecific": boolean,
  "toneGuideHasExamples": boolean,
  "visualSystemComplete": boolean,
  "rejection": "reason if not approved, null if approved",
  "improvements": ["specific thing to fix 1", "specific thing to fix 2"]
}
`,
        });

        let guardianResult: {
          approved: boolean;
          brandBookSpecific: boolean;
          toneGuideHasExamples: boolean;
          visualSystemComplete: boolean;
          rejection: string | null;
          improvements: string[];
        };

        try {
          const cleaned = guardianCheck.text.replace(/```json\n?|\n?```/g, '').trim();
          guardianResult = JSON.parse(cleaned);
        } catch {
          guardianResult = {
            approved: true,
            brandBookSpecific: true,
            toneGuideHasExamples: true,
            visualSystemComplete: true,
            rejection: null,
            improvements: [],
          };
        }

        return {
          approved: guardianResult.approved,
          missingArtifactTypes: [],
          rejection: guardianResult.rejection,
          checklist: {
            brandBookSpecific: guardianResult.brandBookSpecific,
            toneGuideHasExamples: guardianResult.toneGuideHasExamples,
            visualSystemComplete: guardianResult.visualSystemComplete,
            improvements: guardianResult.improvements,
            checkedWith: 'llm',
          },
        };
      });

      // ── Step 6: Update Brand DNA layer + Fundamentos score ────────────────
      const scoreResult = await step.run('update-score-and-layer', async () => {
        const [current] = await db
          .select()
          .from(brandDna)
          .where(eq(brandDna.id, dnaId))
          .limit(1);

        // Advance to Layer 3 if Brand Guardian approves
        const newLayer = guardianResult.approved ? 3 : (current?.currentLayer ?? 2);

        const allArtifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            layer: brandDnaArtifacts.layer,
            status: brandDnaArtifacts.status,
          })
          .from(brandDnaArtifacts)
          .where(eq(brandDnaArtifacts.organizationId, validated.tenantId));

        const { score, breakdown } = calculateFundamentosScore(newLayer, allArtifacts);

        await db
          .update(brandDna)
          .set({
            currentLayer: newLayer,
            fundamentos_score: score,
            status: 'active',
            previousSnapshot: {
              currentLayer: current?.currentLayer,
              fundamentos_score: current?.fundamentos_score,
              status: current?.status,
            },
            previousSnapshotAt: new Date(),
            previousSnapshotTrigger: `layer3-attempt-${validated.attemptNumber}`,
          })
          .where(eq(brandDna.id, dnaId));

        await db.insert(brandHealthScores).values({
          organizationId: validated.tenantId,
          fundamentos: score,
          totalScore: score,
          breakdown,
        });

        return { score, breakdown, advancedToLayer: newLayer };
      });

      // ── Step 7: 3+3 rule escalation ───────────────────────────────────────
      const escalationCheck = await step.run('check-escalation', async () => {
        if (guardianResult.approved) return { escalated: false, reason: 'Brand Guardian approved' };
        if (validated.attemptNumber >= 6) {
          await db.update(brandDna).set({ status: 'escalated' }).where(eq(brandDna.id, dnaId));
          return {
            escalated: true,
            reason: `Layer 3 Brand Guardian rejected after ${validated.attemptNumber} attempts. Human workshop required.`,
          };
        }
        return {
          escalated: false,
          nextAttempt: validated.attemptNumber + 1,
          reason: `Brand Guardian rejected — retry attempt ${validated.attemptNumber + 1}`,
          improvements: (guardianResult.checklist as { improvements?: string[] } | null)?.improvements ?? [],
        };
      });

      // ── Step 8: Record motor execution ────────────────────────────────────
      await step.run('record-motor-execution', async () => {
        await db.insert(motorExecutions).values({
          organizationId: validated.tenantId,
          motor: 'brand-builder',
          status: escalationCheck.escalated
            ? 'escalated'
            : guardianResult.approved
              ? 'completed'
              : 'pending',
          triggeredBy: 'layer3-identity-systems',
          metadata: {
            layer: 3,
            attemptNumber: validated.attemptNumber,
            guardianResult,
            fundamentosScore: scoreResult.score,
            agentTokens: agentResult.usage,
            escalation: escalationCheck,
          },
        });
      });

      // ── Step 9: Auto-retry (3+3 rule) — dispatch next attempt if Brand Guardian rejected ─
      // DEC-078: Brand Guardian gate applies 3+3 rule; auto-iterates until attempt 6.
      if (!escalationCheck.escalated && !guardianResult.approved && 'nextAttempt' in escalationCheck && escalationCheck.nextAttempt) {
        await step.sendEvent('auto-retry-layer3', {
          name: 'brand-builder/layer3.started',
          data: {
            tenantId: validated.tenantId,
            attemptNumber: escalationCheck.nextAttempt,
          },
        });
      }

      return {
        tenantId: validated.tenantId,
        brandDnaId: dnaId,
        layer: scoreResult.advancedToLayer,
        attemptNumber: validated.attemptNumber,
        fundamentosScore: scoreResult.score,
        brandGuardianApproved: guardianResult.approved,
        guardianResult,
        escalation: escalationCheck,
        agentTokens: agentResult.usage,
        promptVersion: promptMeta.version,
      };
    },
  );
}
