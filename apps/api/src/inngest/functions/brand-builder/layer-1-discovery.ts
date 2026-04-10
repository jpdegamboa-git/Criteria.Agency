/**
 * Layer 1 — Fundamentos validados (Step 1.4 + 1.5)
 *
 * Brand Strategist agent with Discovery skill.
 * First real agent invocation on the platform.
 *
 * This function:
 * 1. Reads Layer 0 Brand DNA
 * 2. Invokes Brand Strategist with Discovery skill (Claude Sonnet, Tier A — DEC-149)
 * 3. Agent produces Layer 1 artifacts using tools (read_brand_dna, update_artifact, evaluate_completeness)
 * 4. Gate 1→2: evaluates quality, doesn't block, score reflects gaps
 * 5. 3+3 rule: tracks attempts, applies leader adjustment on attempts 4-6,
 *    escalates after attempt 6 (Step 1.5)
 *
 * DEC-076: Brand Strategist enters at Layer 1 (Layer 0 is system function).
 * DEC-141: Uses agent with tools pattern (complex task).
 * DEC-145: System prompt loaded from prompt_registry.
 * DEC-148: Validates schema + tenant before any work.
 * DEC-149: Tier A — Anthropic only. No fallback.
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
import { runAgentWithTools, MODELS } from '../../../lib/ai.js';
import { calculateFundamentosScore } from '../../../lib/brand-builder/fundamentos-score.js';

// ── Event schema ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  tenantId: z.string().min(1),
  /**
   * Client-provided input for the discovery session.
   * In MVP this is text; in Fase 6 it becomes structured MARA conversation.
   * Examples: corrections to Layer 0 values, answers to discovery questions.
   */
  clientInput: z.string().max(3000).default(''),
  /** Which attempt this is (1-6). Tracked externally to enforce 3+3 rule. */
  attemptNumber: z.number().int().min(1).max(6).default(1),
});

export type Layer1DiscoveryEventData = z.infer<typeof eventSchema>;

// Leader adjustment suffix added on attempts 4-6 (Step 1.5 — 3+3 rule)
const LEADER_ADJUSTMENT_SUFFIX = `
LEADER ADJUSTMENT ACTIVE (attempt ${'{attempt_number}'} of 6):
The previous attempts did not produce sufficient artifact quality.
Be more directive. Ask more specific, pointed questions.
Do not accept vague answers. If the client says "everyone" for their audience,
push back explicitly: "That's a demographic, not an audience. Who specifically benefits most?"
Focus on the 2-3 gaps flagged in previous evaluations.
After this attempt, if quality is still insufficient, human escalation will trigger.
`;

// ── Inngest function factory ───────────────────────────────────────────────────

export function createLayer1DiscoveryFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'brand-builder-layer-1-discovery',
      retries: 1, // Agent errors should not auto-retry — 3+3 rule handles iteration
      triggers: [{ event: 'brand-builder/layer1.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema ───────────────────────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);
        return result.data;
      });

      // ── Step 2: Verify tenant + Brand DNA exists ──────────────────────────
      const { dnaId, currentLayer } = await step.run('verify-tenant-and-dna', async () => {
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
        if (!dna) throw new Error(`No Brand DNA found — complete onboarding first`);

        return { dnaId: dna.id, currentLayer: dna.currentLayer };
      });

      // ── Step 3: Load prompt from registry (DEC-145) ───────────────────────
      // Prompt text not stored in step state — loaded and used within same step.
      const promptMeta = await step.run('load-prompt-meta', async () => {
        const [prompt] = await db
          .select({ id: promptRegistry.id, version: promptRegistry.version, model: promptRegistry.model })
          .from(promptRegistry)
          .where(
            and(
              eq(promptRegistry.agentId, 'brand-strategist'),
              eq(promptRegistry.skillId, 'discovery'),
              eq(promptRegistry.active, true),
            ),
          )
          .limit(1);

        if (!prompt) {
          throw new Error(
            'No active prompt found for brand-strategist/discovery. ' +
            'Run the seed script to create it.',
          );
        }
        return { promptId: prompt.id, promptVersion: prompt.version, model: prompt.model };
      });

      // ── Step 4: Invoke Brand Strategist with Discovery skill ───────────────
      // Agent reads Layer 0 data, produces Layer 1 artifacts using tools.
      // System prompt loaded fresh (not from step state — DEC-148).
      const agentResult = await step.run('invoke-brand-strategist-discovery', async () => {
        // Load full prompt text (not stored in step state per DEC-148)
        const [prompt] = await db
          .select({ systemPrompt: promptRegistry.systemPrompt })
          .from(promptRegistry)
          .where(eq(promptRegistry.id, promptMeta.promptId))
          .limit(1);
        if (!prompt) throw new Error('Prompt disappeared between steps');

        // Load Layer 0 artifacts for context
        const layer0Artifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            status: brandDnaArtifacts.status,
            content: brandDnaArtifacts.content,
          })
          .from(brandDnaArtifacts)
          .where(
            and(
              eq(brandDnaArtifacts.organizationId, validated.tenantId),
              eq(brandDnaArtifacts.layer, 0),
            ),
          );

        // Apply leader adjustment on attempts 4-6 (Step 1.5)
        const isLeaderAdjustment = validated.attemptNumber >= 4;
        const systemPrompt = isLeaderAdjustment
          ? prompt.systemPrompt + LEADER_ADJUSTMENT_SUFFIX.replace('{attempt_number}', String(validated.attemptNumber))
          : prompt.systemPrompt;

        // ── Agent tools ──────────────────────────────────────────────────────
        const tools = {
          read_brand_dna: tool({
            description:
              'Read the current Brand DNA artifacts for this client. ' +
              'Returns all layers so you can understand what was found in onboarding.',
            inputSchema: z.object({
              layer: z.number().optional().describe('Filter by layer (0-3). Omit for all layers.'),
            }),
            execute: async ({ layer }) => {
              const conditions = [eq(brandDnaArtifacts.organizationId, validated.tenantId)];
              if (layer !== undefined) {
                conditions.push(eq(brandDnaArtifacts.layer, layer));
              }
              return await db
                .select({
                  artifactType: brandDnaArtifacts.artifactType,
                  layer: brandDnaArtifacts.layer,
                  status: brandDnaArtifacts.status,
                  content: brandDnaArtifacts.content,
                })
                .from(brandDnaArtifacts)
                .where(and(...conditions));
            },
          }),

          update_artifact: tool({
            description:
              'Create or update a Brand DNA artifact at Layer 1. ' +
              'Use this to record validated information from the client. ' +
              'Layer 1 artifact types: value_proposition, audience_primary, ' +
              'positioning_basic, visual_identity_confirmed, tone_of_voice_defined.',
            inputSchema: z.object({
              artifactType: z.enum([
                'value_proposition',
                'audience_primary',
                'positioning_basic',
                'visual_identity_confirmed',
                'tone_of_voice_defined',
              ]).describe('The Layer 1 artifact type to create/update.'),
              content: z.record(z.string(), z.unknown()).describe(
                'The artifact content as a JSON object. Include the key fields from the spec.',
              ),
              status: z.enum(['draft', 'validated']).default('validated').describe(
                'Use "validated" when the client has confirmed the content. "draft" for uncertain info.',
              ),
            }),
            execute: async ({ artifactType, content, status }) => {
              // Upsert: delete existing Layer 1 artifact of this type, then insert
              await db
                .delete(brandDnaArtifacts)
                .where(
                  and(
                    eq(brandDnaArtifacts.organizationId, validated.tenantId),
                    eq(brandDnaArtifacts.layer, 1),
                    eq(brandDnaArtifacts.artifactType, artifactType),
                  ),
                );

              const [inserted] = await db
                .insert(brandDnaArtifacts)
                .values({
                  brandDnaId: dnaId,
                  organizationId: validated.tenantId,
                  layer: 1,
                  artifactType,
                  status,
                  content,
                  triggerContext: `layer1-discovery-attempt-${validated.attemptNumber}`,
                })
                .returning({ id: brandDnaArtifacts.id });

              return { updated: true, artifactId: inserted.id, artifactType, status };
            },
          }),

          evaluate_completeness: tool({
            description:
              'Evaluate whether Layer 1 artifacts are complete and sufficient. ' +
              'Call this when you believe all Layer 1 artifacts have been created. ' +
              'Returns what is missing and a quality assessment.',
            inputSchema: z.object({
              assessment: z.string().describe(
                'Your quality assessment: what is good, what is vague, what would improve downstream motors.',
              ),
            }),
            execute: async ({ assessment }) => {
              const layer1Artifacts = await db
                .select({
                  artifactType: brandDnaArtifacts.artifactType,
                  status: brandDnaArtifacts.status,
                  content: brandDnaArtifacts.content,
                })
                .from(brandDnaArtifacts)
                .where(
                  and(
                    eq(brandDnaArtifacts.organizationId, validated.tenantId),
                    eq(brandDnaArtifacts.layer, 1),
                  ),
                );

              const required = [
                'value_proposition',
                'audience_primary',
                'positioning_basic',
                'visual_identity_confirmed',
                'tone_of_voice_defined',
              ];
              const presentTypes = new Set(layer1Artifacts.map((a) => a.artifactType));
              const missing = required.filter((t) => !presentTypes.has(t));
              const validated2 = layer1Artifacts.filter((a) => a.status === 'validated').length;
              const qualityScore = Math.round((validated2 / Math.max(required.length, 1)) * 100);

              return {
                complete: missing.length === 0,
                missingArtifactTypes: missing,
                presentArtifactTypes: [...presentTypes],
                validatedCount: validated2,
                totalRequired: required.length,
                qualityScore,
                assessment,
                canAdvance: missing.length === 0,
                scoreImpact: missing.length === 0
                  ? 'Layer 1 complete — Fundamentos will rise to ~40-50'
                  : `${missing.length} required artifacts missing — score reflects gaps`,
              };
            },
          }),
        };

        const userPrompt = `
Client Brand DNA — Layer 0 (onboarding output):
${JSON.stringify(layer0Artifacts, null, 2)}

Client input for this discovery session:
${validated.clientInput || '(No additional input provided — work from Layer 0 data only)'}

Attempt: ${validated.attemptNumber} of 6
${validated.attemptNumber >= 4 ? '⚠️ LEADER ADJUSTMENT ACTIVE — previous attempts insufficient' : ''}

Your task:
1. Read the Layer 0 Brand DNA
2. Analyze the client input (corrections, answers, new information)
3. Create all 5 required Layer 1 artifacts using update_artifact
4. Call evaluate_completeness to assess quality
5. Report what was created and any quality gaps that will impact the score
`;

        const result = await runAgentWithTools({
          ctx: {
            agentId: 'brand-strategist',
            skillId: 'discovery',
            tenantId: validated.tenantId,
          },
          model: promptMeta.model as typeof MODELS.sonnet,
          system: systemPrompt,
          prompt: userPrompt,
          tools,
          maxSteps: 15, // Allow enough steps for all 5 artifacts + evaluation
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

      // ── Step 5: Gate 1→2 evaluation (doesn't block — DEC-077) ─────────────
      const gateResult = await step.run('gate-1-validation-check', async () => {
        const layer1Artifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            status: brandDnaArtifacts.status,
          })
          .from(brandDnaArtifacts)
          .where(
            and(
              eq(brandDnaArtifacts.organizationId, validated.tenantId),
              eq(brandDnaArtifacts.layer, 1),
            ),
          );

        const required = ['value_proposition', 'audience_primary', 'positioning_basic', 'visual_identity_confirmed', 'tone_of_voice_defined'];
        const presentTypes = new Set(layer1Artifacts.map((a) => a.artifactType));
        const missing = required.filter((t) => !presentTypes.has(t));
        const validated2 = layer1Artifacts.filter((a) => a.status === 'validated').length;

        const passed = missing.length === 0 && validated2 >= 4;
        const qualitySufficient = validated2 >= 3; // At least 3/5 validated for "good enough"

        return {
          passed,
          qualitySufficient,
          missingArtifactTypes: missing,
          presentCount: presentTypes.size,
          validatedCount: validated2,
          // Gate doesn't block — score reflects gaps
          note: passed
            ? 'Gate 1→2 passed — Layer 1 complete'
            : `Gate 1→2 quality gap — missing: ${missing.join(', ')}. Score reflects gaps (DEC-077).`,
        };
      });

      // ── Step 6: Update Brand DNA layer + Fundamentos score ────────────────
      const scoreResult = await step.run('update-score-and-layer', async () => {
        // Save snapshot for undo (DEC-084) before advancing layer
        const [current] = await db
          .select()
          .from(brandDna)
          .where(eq(brandDna.id, dnaId))
          .limit(1);

        const newLayer = gateResult.passed ? 1 : currentLayer;

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
            // Save undo snapshot (DEC-084)
            previousSnapshot: {
              currentLayer: current?.currentLayer,
              fundamentos_score: current?.fundamentos_score,
              status: current?.status,
            },
            previousSnapshotAt: new Date(),
            previousSnapshotTrigger: `layer1-discovery-attempt-${validated.attemptNumber}`,
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

      // ── Step 7: 3+3 rule — check if human escalation needed ───────────────
      // (Step 1.5) — if gate failed and we've exhausted all 6 attempts
      const escalationCheck = await step.run('check-escalation', async () => {
        if (gateResult.passed) {
          return { escalated: false, reason: 'Gate passed' };
        }
        if (validated.attemptNumber >= 6) {
          // Update Brand DNA to 'escalated' status
          await db
            .update(brandDna)
            .set({ status: 'escalated' })
            .where(eq(brandDna.id, dnaId));
          return {
            escalated: true,
            reason: `Layer 1 quality insufficient after ${validated.attemptNumber} attempts. Human review required.`,
          };
        }
        return {
          escalated: false,
          nextAttempt: validated.attemptNumber + 1,
          reason: `Gate quality insufficient — retry attempt ${validated.attemptNumber + 1}`,
        };
      });

      // ── Step 8: Record motor execution ────────────────────────────────────
      await step.run('record-motor-execution', async () => {
        await db.insert(motorExecutions).values({
          organizationId: validated.tenantId,
          motor: 'brand-builder',
          status: escalationCheck.escalated ? 'escalated' : gateResult.passed ? 'completed' : 'pending',
          triggeredBy: 'layer1-discovery',
          metadata: {
            layer: 1,
            attemptNumber: validated.attemptNumber,
            isLeaderAdjustment: validated.attemptNumber >= 4,
            gateResult,
            fundamentosScore: scoreResult.score,
            agentTokens: agentResult.usage,
            escalation: escalationCheck,
          },
        });
      });

      return {
        tenantId: validated.tenantId,
        brandDnaId: dnaId,
        layer: scoreResult.advancedToLayer,
        attemptNumber: validated.attemptNumber,
        fundamentosScore: scoreResult.score,
        gatePassed: gateResult.passed,
        gateResult,
        escalation: escalationCheck,
        agentTokens: agentResult.usage,
        promptVersion: promptMeta.promptVersion,
      };
    },
  );
}
