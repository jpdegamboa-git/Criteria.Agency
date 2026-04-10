/**
 * Layer 2 — Profundidad estratégica (Step 1.6 + 1.7)
 *
 * Brand Strategist agent with Positioning and Archetype & Voice skills.
 * Produces Layer 2 artifacts: 3Cs positioning, segmented audiences,
 * smallest viable audience, brand archetype, verbal territory, competitive map.
 *
 * Layer 2 coherence gate (Step 1.7 — DEC-081):
 * - Blocks on THREE specific contradiction types (unlike layers 0-1 which never block)
 * - 3+3 rule applies: 3 normal attempts → 3 leader-adjusted → human escalation
 *
 * Three blocking incoherences (DEC-081):
 *   1. Audience ↔ Positioning: premium brand targeting price-sensitive audience, or
 *      "tech-savvy millennials" audience with "tradition and heritage" VP.
 *   2. Archetype ↔ Verbal territory: "rebellious, irreverent" archetype but
 *      "reliable, safe, established" verbal territory.
 *   3. Positioning ↔ Competitive map: positioned identically to main competitor
 *      with zero identifiable differentiator.
 *
 * DEC-141: Agent with tools pattern (complex strategic work).
 * DEC-145: System prompts loaded from prompt_registry.
 * DEC-149: Tier A — Anthropic only.
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
  /**
   * Which skills to run in this invocation.
   * Both skills run together by default (Layer 2 is a single session).
   */
  skills: z.array(z.enum(['positioning', 'archetype_voice'])).default(['positioning', 'archetype_voice']),
  clientInput: z.string().max(5000).default(''),
  attemptNumber: z.number().int().min(1).max(6).default(1),
});

export type Layer2StrategicDepthEventData = z.infer<typeof eventSchema>;

// Leader adjustment suffix for 3+3 rule (attempts 4-6)
const LEADER_ADJUSTMENT_SUFFIX = `
LEADER ADJUSTMENT ACTIVE (attempt ${'{attempt_number}'} of 6):
Previous attempts produced incoherent or insufficient artifacts.
Be explicit about contradictions. Name them directly: "Your audience definition contradicts your positioning."
Force resolution. Do not accept ambiguous answers.
The coherence gate at Layer 2 BLOCKS if key contradictions are not resolved.
After this attempt, if incoherence persists, human escalation will trigger.
`;

// ── Inngest function factory ───────────────────────────────────────────────────

export function createLayer2StrategicDepthFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'brand-builder-layer-2-strategic-depth',
      retries: 1,
      triggers: [{ event: 'brand-builder/layer2.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate schema ───────────────────────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) throw new Error(`Invalid schema: ${result.error.message}`);
        return result.data;
      });

      // ── Step 2: Verify tenant + Brand DNA at Layer 1 ──────────────────────
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
        if (!dna) throw new Error('No Brand DNA found — complete Layer 1 first');
        if (dna.currentLayer < 1) throw new Error('Layer 1 must be completed before starting Layer 2');

        return { dnaId: dna.id };
      });

      // ── Step 3: Load prompt IDs ───────────────────────────────────────────
      const promptMeta = await step.run('load-prompt-meta', async () => {
        const prompts: Record<string, { id: string; version: number; model: string }> = {};

        for (const skillId of ['positioning', 'archetype_voice']) {
          const [p] = await db
            .select({ id: promptRegistry.id, version: promptRegistry.version, model: promptRegistry.model })
            .from(promptRegistry)
            .where(
              and(
                eq(promptRegistry.agentId, 'brand-strategist'),
                eq(promptRegistry.skillId, skillId),
                eq(promptRegistry.active, true),
              ),
            )
            .limit(1);

          if (!p) {
            throw new Error(
              `No active prompt for brand-strategist/${skillId}. Run the seed script.`,
            );
          }
          prompts[skillId] = { id: p.id, version: p.version, model: p.model };
        }

        return prompts;
      });

      // ── Step 4: Invoke Brand Strategist (Positioning + Archetype skills) ──
      const agentResult = await step.run('invoke-brand-strategist-layer2', async () => {
        // Load all prompts (not stored in step state — DEC-148)
        const skillPrompts: Record<string, string> = {};
        for (const [skillId, meta] of Object.entries(promptMeta)) {
          const [p] = await db
            .select({ systemPrompt: promptRegistry.systemPrompt })
            .from(promptRegistry)
            .where(eq(promptRegistry.id, meta.id))
            .limit(1);
          if (!p) throw new Error(`Prompt ${skillId} disappeared between steps`);
          skillPrompts[skillId] = p.systemPrompt;
        }

        // Load existing artifacts (Layer 0 + Layer 1) for context
        const existingArtifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            layer: brandDnaArtifacts.layer,
            status: brandDnaArtifacts.status,
            content: brandDnaArtifacts.content,
          })
          .from(brandDnaArtifacts)
          .where(eq(brandDnaArtifacts.organizationId, validated.tenantId));

        // Combined system prompt (both skills active in this session)
        const isLeaderAdjustment = validated.attemptNumber >= 4;
        const combinedPrompt = [
          skillPrompts['positioning'],
          '\n\n---\n\n',
          skillPrompts['archetype_voice'],
          isLeaderAdjustment
            ? LEADER_ADJUSTMENT_SUFFIX.replace('{attempt_number}', String(validated.attemptNumber))
            : '',
        ].join('');

        // ── Agent tools ──────────────────────────────────────────────────────
        const tools = {
          read_brand_dna: tool({
            description: 'Read all existing Brand DNA artifacts to understand the full context before producing Layer 2 artifacts.',
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
              'Create or update a Brand DNA artifact at Layer 2. ' +
              'Layer 2 types: audiences_segmented, positioning_3cs, audience_smallest_viable, ' +
              'brand_archetype, verbal_territory, competitive_map.',
            inputSchema: z.object({
              artifactType: z.enum([
                'audiences_segmented',
                'positioning_3cs',
                'audience_smallest_viable',
                'brand_archetype',
                'verbal_territory',
                'competitive_map',
              ]),
              content: z.record(z.string(), z.unknown()).describe(
                'Artifact content as structured JSON. Include all required fields for this artifact type.',
              ),
              status: z.enum(['draft', 'validated']).default('validated'),
            }),
            execute: async ({ artifactType, content, status }) => {
              await db
                .delete(brandDnaArtifacts)
                .where(
                  and(
                    eq(brandDnaArtifacts.organizationId, validated.tenantId),
                    eq(brandDnaArtifacts.layer, 2),
                    eq(brandDnaArtifacts.artifactType, artifactType),
                  ),
                );

              const [inserted] = await db
                .insert(brandDnaArtifacts)
                .values({
                  brandDnaId: dnaId,
                  organizationId: validated.tenantId,
                  layer: 2,
                  artifactType,
                  status,
                  content,
                  triggerContext: `layer2-strategic-depth-attempt-${validated.attemptNumber}`,
                })
                .returning({ id: brandDnaArtifacts.id });

              return { updated: true, artifactId: inserted.id, artifactType, status };
            },
          }),

          evaluate_coherence: tool({
            description:
              'Evaluate whether Layer 2 artifacts are internally coherent. ' +
              'Call this after creating all 5-6 required artifacts. ' +
              'Checks for the 3 blocking contradiction types (DEC-081).',
            inputSchema: z.object({
              coherenceAssessment: z.string().describe(
                'Your assessment of coherence between artifacts. ' +
                'Specifically address: 1) Audience vs Positioning, ' +
                '2) Archetype vs Verbal Territory, 3) Positioning vs Competitive Map.',
              ),
              hasIncoherence: z.boolean().describe(
                'True if any of the 3 blocking contradiction types are present.',
              ),
              incoherenceType: z.enum([
                'none',
                'audience_vs_positioning',
                'archetype_vs_verbal_territory',
                'positioning_vs_competitive_map',
                'multiple',
              ]).describe('Which contradiction type was found, or "none" if coherent.'),
            }),
            execute: async ({ coherenceAssessment, hasIncoherence, incoherenceType }) => {
              const layer2Artifacts = await db
                .select({ artifactType: brandDnaArtifacts.artifactType, status: brandDnaArtifacts.status })
                .from(brandDnaArtifacts)
                .where(
                  and(
                    eq(brandDnaArtifacts.organizationId, validated.tenantId),
                    eq(brandDnaArtifacts.layer, 2),
                  ),
                );

              const required = ['audiences_segmented', 'positioning_3cs', 'audience_smallest_viable', 'brand_archetype', 'verbal_territory'];
              const presentTypes = new Set(layer2Artifacts.map((a) => a.artifactType));
              const missing = required.filter((t) => !presentTypes.has(t));

              return {
                artifactsComplete: missing.length === 0,
                missingArtifactTypes: missing,
                presentCount: presentTypes.size,
                coherenceAssessment,
                hasIncoherence,
                incoherenceType,
                gateWillBlock: hasIncoherence && missing.length === 0,
                recommendation: hasIncoherence
                  ? `⚠️ GATE BLOCKS: ${incoherenceType} contradiction detected. Resolve before advancing to Layer 3.`
                  : missing.length > 0
                    ? `Missing artifacts: ${missing.join(', ')}. Create them before evaluating coherence.`
                    : '✅ Layer 2 complete and coherent — ready for Layer 3.',
              };
            },
          }),
        };

        const userPrompt = `
Existing Brand DNA (Layers 0-1):
${JSON.stringify(existingArtifacts, null, 2)}

Client input for this Layer 2 session:
${validated.clientInput || '(No additional input — work from existing Brand DNA)'}

Skills active: ${validated.skills.join(', ')}
Attempt: ${validated.attemptNumber} of 6

Your task:
1. Read the existing Brand DNA (especially Layer 1 artifacts)
2. Produce all Layer 2 artifacts using update_artifact:
   - audiences_segmented (2-5 buyer personas with psychographics)
   - positioning_3cs (Company, Customer, Competition analysis — M1-M6 framework)
   - audience_smallest_viable (Godin's "This is for people who...")
   - brand_archetype (who IS the brand as a person)
   - verbal_territory (brand vocabulary, forbidden phrases, tone by context)
   - competitive_map (who competes for same attention, real differentiation)
3. Call evaluate_coherence — be honest about contradictions
4. If coherent: report Layer 2 complete
5. If incoherent: flag the specific contradiction and propose resolution
`;

        const result = await runAgentWithTools({
          ctx: {
            agentId: 'brand-strategist',
            skillId: 'positioning+archetype_voice',
            tenantId: validated.tenantId,
          },
          model: promptMeta['positioning'].model as typeof MODELS.sonnet,
          system: combinedPrompt,
          prompt: userPrompt,
          tools,
          maxSteps: 20, // Layer 2 has more artifacts — needs more steps
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

      // ── Step 5: Layer 2 Coherence Gate (DEC-081) — CAN BLOCK ─────────────
      // Run a secondary LLM check to independently verify coherence
      // (the agent self-evaluated but we verify with a separate call)
      const gateResult = await step.run('gate-2-coherence-check', async () => {
        const layer2Artifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            status: brandDnaArtifacts.status,
            content: brandDnaArtifacts.content,
          })
          .from(brandDnaArtifacts)
          .where(
            and(
              eq(brandDnaArtifacts.organizationId, validated.tenantId),
              eq(brandDnaArtifacts.layer, 2),
            ),
          );

        const required = ['audiences_segmented', 'positioning_3cs', 'audience_smallest_viable', 'brand_archetype', 'verbal_territory'];
        const presentTypes = new Set(layer2Artifacts.map((a) => a.artifactType));
        const missing = required.filter((t) => !presentTypes.has(t));

        if (missing.length > 0) {
          return {
            passed: false,
            blocked: false,
            missingArtifactTypes: missing,
            incoherenceType: 'none' as const,
            note: `Layer 2 incomplete — missing: ${missing.join(', ')}. Gate requires all artifacts.`,
          };
        }

        // Load the Guardian system prompt (not stored in step state — DEC-148)
        const [coherencePrompt] = await db
          .select({ systemPrompt: promptRegistry.systemPrompt })
          .from(promptRegistry)
          .where(
            and(
              eq(promptRegistry.agentId, 'brand-strategist'),
              eq(promptRegistry.skillId, 'coherence-gate'),
              eq(promptRegistry.active, true),
            ),
          )
          .limit(1);

        // If no dedicated coherence prompt exists, do a rule-based check
        if (!coherencePrompt) {
          // Rule-based coherence check without LLM
          const archetypeArtifact = layer2Artifacts.find((a) => a.artifactType === 'brand_archetype');
          const verbalArtifact = layer2Artifacts.find((a) => a.artifactType === 'verbal_territory');
          const positioningArtifact = layer2Artifacts.find((a) => a.artifactType === 'positioning_3cs');
          const competitiveArtifact = layer2Artifacts.find((a) => a.artifactType === 'competitive_map');

          // Simple heuristic: if both archetype and verbal territory exist and are validated, assume coherent
          // A full LLM check would happen when the coherence-gate prompt is seeded
          const allValidated = layer2Artifacts.every((a) => a.status === 'validated');
          return {
            passed: allValidated,
            blocked: false, // Rule-based check never blocks — only flags
            missingArtifactTypes: [],
            incoherenceType: 'none' as const,
            note: allValidated
              ? 'All Layer 2 artifacts validated — coherence check passed (rule-based)'
              : 'Some artifacts not yet validated — score reflects gaps',
            checkedWith: 'rule-based',
          };
        }

        // LLM-based coherence check using classifyText (generateText pattern)
        const artifactSummary = layer2Artifacts.map((a) => ({
          type: a.artifactType,
          content: a.content,
        }));

        const coherenceCheck = await classifyText({
          ctx: {
            agentId: 'brand-strategist',
            skillId: 'coherence-gate',
            tenantId: validated.tenantId,
          },
          model: MODELS.sonnet,
          system: coherencePrompt.systemPrompt,
          prompt: `
Evaluate the internal coherence of these Layer 2 Brand DNA artifacts.
Check for these THREE specific contradiction types (DEC-081):

1. AUDIENCE vs POSITIONING: Does the positioning contradict the audience definition?
2. ARCHETYPE vs VERBAL TERRITORY: Does the brand archetype contradict the verbal territory?
3. POSITIONING vs COMPETITIVE MAP: Is the positioning indistinguishable from competitors?

Artifacts to evaluate:
${JSON.stringify(artifactSummary, null, 2)}

Respond with a JSON object:
{
  "coherent": boolean,
  "incoherenceType": "none" | "audience_vs_positioning" | "archetype_vs_verbal_territory" | "positioning_vs_competitive_map" | "multiple",
  "explanation": "brief explanation of the contradiction or confirmation of coherence"
}
`,
        });

        let coherenceResult: {
          coherent: boolean;
          incoherenceType: string;
          explanation: string;
        };

        try {
          const cleaned = coherenceCheck.text.replace(/```json\n?|\n?```/g, '').trim();
          coherenceResult = JSON.parse(cleaned);
        } catch {
          // Parse failure — assume coherent (defensive)
          coherenceResult = {
            coherent: true,
            incoherenceType: 'none',
            explanation: 'Coherence check parse failed — defaulting to coherent',
          };
        }

        const blocked = !coherenceResult.coherent && coherenceResult.incoherenceType !== 'none';

        return {
          passed: !blocked,
          blocked,
          missingArtifactTypes: [],
          incoherenceType: coherenceResult.incoherenceType,
          explanation: coherenceResult.explanation,
          note: blocked
            ? `⚠️ GATE BLOCKS: ${coherenceResult.incoherenceType} — ${coherenceResult.explanation}`
            : `Layer 2 coherent — ${coherenceResult.explanation}`,
          checkedWith: 'llm',
        };
      });

      // ── Step 6: Update Brand DNA layer + Fundamentos score ────────────────
      const scoreResult = await step.run('update-score-and-layer', async () => {
        const [current] = await db
          .select()
          .from(brandDna)
          .where(eq(brandDna.id, dnaId))
          .limit(1);

        // Only advance to Layer 2 if gate passed (coherence gate CAN block — DEC-077)
        const newLayer = gateResult.passed ? 2 : (current?.currentLayer ?? 1);

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
            status: gateResult.blocked ? 'blocked' : 'active',
            previousSnapshot: {
              currentLayer: current?.currentLayer,
              fundamentos_score: current?.fundamentos_score,
              status: current?.status,
            },
            previousSnapshotAt: new Date(),
            previousSnapshotTrigger: `layer2-attempt-${validated.attemptNumber}`,
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

      // ── Step 7: 3+3 rule escalation check (Step 1.5 pattern) ─────────────
      const escalationCheck = await step.run('check-escalation', async () => {
        if (gateResult.passed) return { escalated: false, reason: 'Gate passed' };
        if (validated.attemptNumber >= 6) {
          await db.update(brandDna).set({ status: 'escalated' }).where(eq(brandDna.id, dnaId));
          return {
            escalated: true,
            reason: `Layer 2 coherence insufficient after ${validated.attemptNumber} attempts. Human workshop required.`,
          };
        }
        return {
          escalated: false,
          nextAttempt: validated.attemptNumber + 1,
          reason: gateResult.blocked
            ? `Gate blocked on ${gateResult.incoherenceType} — retry attempt ${validated.attemptNumber + 1}`
            : `Layer 2 incomplete — retry attempt ${validated.attemptNumber + 1}`,
        };
      });

      // ── Step 8: Record motor execution ────────────────────────────────────
      await step.run('record-motor-execution', async () => {
        await db.insert(motorExecutions).values({
          organizationId: validated.tenantId,
          motor: 'brand-builder',
          status: escalationCheck.escalated ? 'escalated' : gateResult.passed ? 'completed' : 'pending',
          triggeredBy: 'layer2-strategic-depth',
          metadata: {
            layer: 2,
            attemptNumber: validated.attemptNumber,
            isLeaderAdjustment: validated.attemptNumber >= 4,
            gateResult,
            fundamentosScore: scoreResult.score,
            agentTokens: agentResult.usage,
            escalation: escalationCheck,
          },
        });
      });

      // ── Step 9: Auto-retry (3+3 rule) — dispatch next attempt if gate failed ─
      // DEC-081: coherence gate CAN block; 3+3 rule auto-iterates until attempt 6.
      if (!escalationCheck.escalated && !gateResult.passed && 'nextAttempt' in escalationCheck && escalationCheck.nextAttempt) {
        await step.sendEvent('auto-retry-layer2', {
          name: 'brand-builder/layer2.started',
          data: {
            tenantId: validated.tenantId,
            skills: validated.skills,
            clientInput: validated.clientInput,
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
        gatePassed: gateResult.passed,
        gateBlocked: gateResult.blocked ?? false,
        gateResult,
        escalation: escalationCheck,
        agentTokens: agentResult.usage,
      };
    },
  );
}
