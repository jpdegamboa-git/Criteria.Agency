/**
 * Layer 0 — Onboarding automático (Step 1.2)
 *
 * System function — no LLM required (DEC-076).
 * Scrapes or extracts brand signals and populates Brand DNA at Layer 0.
 *
 * Two paths:
 *   Path A (has brand): websiteUrl + socialUrls → scrape → extract signals → fill artifacts
 *   Path B (from scratch): 3 questions → fill artifacts from answers
 *
 * After artifacts are saved, calculates Fundamentos score (~15-20).
 * All artifacts are marked "draft — pending validation".
 * Gate 0→1: automatic coverage check — did we get minimum required fields?
 *
 * DEC-076: Layer 0 is a system function, not the Brand Strategist agent.
 * DEC-148: Validates event schema + tenant before any work.
 * DEC-084: Brand DNA record created here; versioning (undo) supported from Layer 1+.
 */

import { z } from 'zod';
import { inngest } from '../../client.js';
import {
  and,
  eq,
  organizationSettings,
  brandDna,
  brandDnaArtifacts,
  brandHealthScores,
  motorExecutions,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { scrapeWebsite } from '../../../lib/brand-builder/web-scraper.js';
import { calculateFundamentosScore } from '../../../lib/brand-builder/fundamentos-score.js';

// ── Event schema ───────────────────────────────────────────────────────────────

const pathASchema = z.object({
  path: z.literal('A'),
  websiteUrl: z.string().url('websiteUrl must be a valid URL'),
  socialUrls: z.array(z.string().url()).default([]),
});

const pathBSchema = z.object({
  path: z.literal('B'),
  whatDoesDo: z.string().min(10, 'Describe what your business does (min 10 chars)').max(500),
  whoDoYouSellTo: z.string().min(5, 'Describe your target customer (min 5 chars)').max(500),
  whatMakesDifferent: z.string().min(5, 'Describe your differentiator (min 5 chars)').max(500),
});

const eventSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  onboarding: z.discriminatedUnion('path', [pathASchema, pathBSchema]),
});

export type OnboardingStartedEventData = z.infer<typeof eventSchema>;

// ── Inngest function factory ───────────────────────────────────────────────────

export function createLayer0OnboardingFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'brand-builder-layer-0-onboarding',
      retries: 2,
      triggers: [{ event: 'brand-builder/onboarding.started' as const }],
    },
    async ({ event, step }) => {
      // ── Step 1: Validate event schema (DEC-148) ───────────────────────────
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) {
          throw new Error(`Invalid event schema: ${result.error.message}`);
        }
        return result.data;
      });

      // ── Step 2: Verify tenant exists in DB (DEC-148) ─────────────────────
      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);

        if (!tenant) {
          throw new Error(`Tenant not found: ${validated.tenantId}`);
        }
      });

      // ── Step 3: Create or reset Brand DNA record ─────────────────────────
      const dnaId = await step.run('init-brand-dna', async () => {
        // Check if brand_dna already exists for this tenant
        const [existing] = await db
          .select({ id: brandDna.id })
          .from(brandDna)
          .where(eq(brandDna.organizationId, validated.tenantId))
          .limit(1);

        if (existing) {
          // Reset to onboarding state (re-run onboarding)
          await db
            .update(brandDna)
            .set({
              currentLayer: 0,
              onboardingPath: validated.onboarding.path,
              status: 'onboarding',
              fundamentos_score: 0,
            })
            .where(eq(brandDna.id, existing.id));
          return existing.id;
        }

        const [created] = await db
          .insert(brandDna)
          .values({
            organizationId: validated.tenantId,
            currentLayer: 0,
            onboardingPath: validated.onboarding.path,
            status: 'onboarding',
            fundamentos_score: 0,
          })
          .returning({ id: brandDna.id });

        return created.id;
      });

      // ── Step 4: Extract brand signals ────────────────────────────────────
      // Path A: scrape website + socials
      // Path B: extract from answers
      // Note: scraped data not stored in step state (may contain large HTML)
      // We pass only the structured extraction result.
      const signals = await step.run('extract-signals', async () => {
        const { onboarding } = validated;

        if (onboarding.path === 'A') {
          const scraped = await scrapeWebsite(onboarding.websiteUrl, onboarding.socialUrls);
          return {
            path: 'A' as const,
            businessName: scraped.businessName,
            valueProposition: scraped.ogDescription ?? scraped.metaDescription ?? null,
            toneSignals: buildToneSignalsFromScrape(scraped.headings, scraped.bodyTextSample),
            audienceHints: buildAudienceHints(scraped.bodyTextSample, scraped.detectedKeywords),
            colorPalette: scraped.detectedColors,
            socialLinks: scraped.socialLinks,
            activeChannels: Object.keys(scraped.socialLinks),
            websiteUrl: onboarding.websiteUrl,
            scrapedSuccessfully: !scraped.error,
            scrapedError: scraped.error ?? null,
            detectedKeywords: scraped.detectedKeywords,
          };
        }

        // Path B — from scratch
        return {
          path: 'B' as const,
          businessName: null,
          valueProposition: onboarding.whatMakesDifferent,
          toneSignals: buildToneSignalsFromAnswers(onboarding.whatDoesDo),
          audienceHints: onboarding.whoDoYouSellTo,
          colorPalette: [],
          socialLinks: {},
          activeChannels: [],
          websiteUrl: null,
          scrapedSuccessfully: true,
          scrapedError: null,
          detectedKeywords: [],
        };
      });

      // ── Step 5: Save Layer 0 artifacts ───────────────────────────────────
      // Each artifact type = one row in brand_dna_artifacts
      // All marked "draft — pending validation"
      await step.run('save-artifacts', async () => {
        // Remove existing Layer 0 artifacts for idempotency
        await db
          .delete(brandDnaArtifacts)
          .where(
            and(
              eq(brandDnaArtifacts.organizationId, validated.tenantId),
              eq(brandDnaArtifacts.layer, 0),
            ),
          );

        const now = new Date().toISOString();
        const artifactBase = {
          brandDnaId: dnaId,
          organizationId: validated.tenantId,
          layer: 0,
          status: 'draft' as const,
          triggerContext: `onboarding-path-${signals.path}`,
        };

        const artifacts = [];

        // Value proposition draft
        artifacts.push({
          ...artifactBase,
          artifactType: 'value_proposition_draft',
          content: {
            text: signals.valueProposition ?? 'Pending — answer onboarding questions',
            source: signals.path === 'A' ? 'website_extraction' : 'client_answer',
            confidence: signals.path === 'A' ? 'medium' : 'high',
            extractedAt: now,
          },
        });

        // Estimated audience
        artifacts.push({
          ...artifactBase,
          artifactType: 'audience_estimated',
          content: {
            description: typeof signals.audienceHints === 'string'
              ? signals.audienceHints
              : signals.audienceHints ?? 'Pending — to be defined in Layer 1',
            source: signals.path === 'A' ? 'content_analysis' : 'client_answer',
            confidence: 'low', // Layer 0 audience is always low confidence
            extractedAt: now,
          },
        });

        // Tone of voice (inferred)
        artifacts.push({
          ...artifactBase,
          artifactType: 'tone_of_voice',
          content: {
            inferredSignals: signals.toneSignals,
            adjectives: [], // to be defined in Layer 1
            source: signals.path === 'A' ? 'website_analysis' : 'business_description_analysis',
            confidence: 'low',
            note: 'Draft — requires validation in Layer 1',
            extractedAt: now,
          },
        });

        // Path A only: logo, color palette, active channels, competitor map
        if (signals.path === 'A') {
          if (signals.colorPalette.length > 0) {
            artifacts.push({
              ...artifactBase,
              artifactType: 'color_palette',
              content: {
                colors: signals.colorPalette,
                source: 'website_extraction',
                confidence: 'medium',
                extractedAt: now,
              },
            });
          }

          if (signals.activeChannels.length > 0) {
            artifacts.push({
              ...artifactBase,
              artifactType: 'active_channels',
              content: {
                channels: signals.activeChannels,
                socialLinks: signals.socialLinks,
                websiteUrl: signals.websiteUrl,
                source: 'website_extraction',
                extractedAt: now,
              },
            });
          }

          if (signals.detectedKeywords.length > 0) {
            artifacts.push({
              ...artifactBase,
              artifactType: 'competitor_map',
              content: {
                detectedKeywords: signals.detectedKeywords,
                status: 'auto_detected_partial',
                note: 'Auto-detected from website metadata — requires validation',
                extractedAt: now,
              },
            });
          }
        }

        if (artifacts.length > 0) {
          await db.insert(brandDnaArtifacts).values(artifacts);
        }

        return { artifactCount: artifacts.length };
      });

      // ── Step 6: Coverage gate (0→1) ──────────────────────────────────────
      // Automatic check — no LLM, no blocking. Did we get minimum fields?
      const gateResult = await step.run('gate-0-coverage-check', async () => {
        const artifacts = await db
          .select({ artifactType: brandDnaArtifacts.artifactType, status: brandDnaArtifacts.status })
          .from(brandDnaArtifacts)
          .where(
            and(
              eq(brandDnaArtifacts.organizationId, validated.tenantId),
              eq(brandDnaArtifacts.layer, 0),
            ),
          );

        const types = new Set(artifacts.map((a) => a.artifactType));
        const minimumMet = types.has('value_proposition_draft') && types.has('audience_estimated') && types.has('tone_of_voice');

        return {
          passed: minimumMet,
          artifactTypes: [...types],
          note: minimumMet
            ? 'Layer 0 coverage gate passed — minimum fields present'
            : 'Layer 0 coverage gate not fully met — missing required fields',
        };
      });

      // ── Step 7: Calculate Fundamentos score and update Brand DNA ─────────
      const scoreResult = await step.run('calculate-fundamentos-score', async () => {
        const artifacts = await db
          .select({
            artifactType: brandDnaArtifacts.artifactType,
            layer: brandDnaArtifacts.layer,
            status: brandDnaArtifacts.status,
          })
          .from(brandDnaArtifacts)
          .where(eq(brandDnaArtifacts.organizationId, validated.tenantId));

        const { score, breakdown } = calculateFundamentosScore(0, artifacts);

        // Update brand_dna with score and mark as active
        await db
          .update(brandDna)
          .set({
            fundamentos_score: score,
            status: 'active',
          })
          .where(eq(brandDna.id, dnaId));

        // Save to brand_health_scores (daily history)
        await db.insert(brandHealthScores).values({
          organizationId: validated.tenantId,
          fundamentos: score,
          totalScore: score, // Only Fundamentos exists in Phase 1
          breakdown,
        });

        return { score, breakdown };
      });

      // ── Step 8: Record motor execution ───────────────────────────────────
      await step.run('record-motor-execution', async () => {
        await db.insert(motorExecutions).values({
          organizationId: validated.tenantId,
          motor: 'brand-builder',
          status: 'completed',
          triggeredBy: 'onboarding',
          metadata: {
            layer: 0,
            path: signals.path,
            gateResult,
            fundamentosScore: scoreResult.score,
          },
        });
      });

      return {
        tenantId: validated.tenantId,
        brandDnaId: dnaId,
        layer: 0,
        path: signals.path,
        fundamentosScore: scoreResult.score,
        gatePassed: gateResult.passed,
        artifactTypes: gateResult.artifactTypes,
      };
    },
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildToneSignalsFromScrape(headings: string[], bodyText: string): string[] {
  const text = [...headings, bodyText].join(' ').toLowerCase();
  const signals: string[] = [];

  if (/innovad|cutting.edge|avant.garde|vanguard/.test(text)) signals.push('innovative');
  if (/profesion|expert|specialist|leader|authority/.test(text)) signals.push('professional');
  if (/friendly|welcom|warm|cercano/.test(text)) signals.push('approachable');
  if (/premium|exclusive|luxury|elite/.test(text)) signals.push('premium');
  if (/simple|easy|fast|quick|instant/.test(text)) signals.push('pragmatic');
  if (/trust|reliable|secure|safe|guarantee/.test(text)) signals.push('trustworthy');
  if (/fun|playful|creative|imagination/.test(text)) signals.push('playful');
  if (/bold|brave|challenge|disrupt|rebel/.test(text)) signals.push('bold');

  return signals.length > 0 ? signals : ['neutral'];
}

function buildToneSignalsFromAnswers(whatDoesDo: string): string[] {
  const text = whatDoesDo.toLowerCase();
  const signals: string[] = [];

  if (/tech|software|digital|platform|app/.test(text)) signals.push('tech-forward');
  if (/design|creative|art|visual|studio/.test(text)) signals.push('creative');
  if (/consul|advisor|strateg|expert/.test(text)) signals.push('expert');
  if (/local|community|neighborhood/.test(text)) signals.push('local');
  if (/health|wellness|care|medical/.test(text)) signals.push('caring');

  return signals.length > 0 ? signals : ['professional'];
}

function buildAudienceHints(bodyText: string, keywords: string[]): string {
  const allText = [bodyText, ...keywords].join(' ');
  const hints: string[] = [];

  if (/b2b|empresa|business|corporat|compan/.test(allText.toLowerCase())) hints.push('businesses (B2B)');
  if (/consumer|cliente|customer|shopper/.test(allText.toLowerCase())) hints.push('consumers (B2C)');
  if (/sme|pyme|small business/.test(allText.toLowerCase())) hints.push('SMBs');
  if (/startup|entrepreneur|founder/.test(allText.toLowerCase())) hints.push('entrepreneurs');

  return hints.length > 0
    ? `Likely targeting: ${hints.join(', ')}`
    : 'Audience to be defined in Layer 1';
}
