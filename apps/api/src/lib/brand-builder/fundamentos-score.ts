/**
 * Fundamentos Score — Step 1.3 (Brand Health Score: Fundamentos axis)
 *
 * System function — no LLM. Deterministic calculation based on Brand DNA
 * layer completion and artifact quality/status.
 *
 * Score ranges (DEC-126, Brand Builder spec §7):
 *   Layer 0 (onboarding only) → ~15-20
 *   Layer 1 (validated)       → ~40-50
 *   Layer 2 (strategic depth) → ~65-75
 *   Layer 3 (professional)    → ~85-95
 *
 * The score is not binary per layer — it reflects completeness within each layer.
 * A well-done layer 1 scores higher than a rushed layer 2.
 */

/** Minimum artifacts required per layer to consider it "complete" */
const LAYER_REQUIRED_ARTIFACTS: Record<number, string[]> = {
  0: ['value_proposition_draft', 'audience_estimated', 'tone_of_voice'],
  1: ['value_proposition', 'audience_primary', 'positioning_basic', 'visual_identity_confirmed', 'tone_of_voice_defined'],
  2: ['audiences_segmented', 'positioning_3cs', 'audience_smallest_viable', 'brand_archetype', 'verbal_territory'],
  3: ['brand_book', 'visual_system_extended', 'tone_guide_by_channel', 'brand_guardian_templates'],
};

/** Optional bonus artifacts per layer */
const LAYER_BONUS_ARTIFACTS: Record<number, string[]> = {
  0: ['logo', 'color_palette', 'active_channels', 'competitor_map'],
  1: [],
  2: ['competitive_map'],
  3: [],
};

/** Base score ranges for each layer (min achievable when entering the layer) */
const LAYER_BASE_SCORE: Record<number, number> = {
  0: 10,
  1: 35,
  2: 60,
  3: 80,
};

/** Max additional score for artifact completeness within each layer */
const LAYER_COMPLETENESS_BONUS: Record<number, number> = {
  0: 10, // up to 20 total
  1: 15, // up to 50 total
  2: 15, // up to 75 total
  3: 15, // up to 95 total
};

export interface ArtifactSummary {
  artifactType: string;
  layer: number;
  status: string; // 'draft' | 'validated' | 'rejected'
}

/**
 * Calculate the Fundamentos score for a given Brand DNA state.
 * Called after any Brand DNA update.
 */
export function calculateFundamentosScore(
  currentLayer: number,
  artifacts: ArtifactSummary[],
): { score: number; breakdown: Record<string, unknown> } {
  const layer = Math.max(0, Math.min(3, currentLayer));

  // Count completed artifacts per layer
  const artifactsByLayer: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };
  const validatedByLayer: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };

  for (const art of artifacts) {
    if (art.layer >= 0 && art.layer <= 3) {
      artifactsByLayer[art.layer].add(art.artifactType);
      if (art.status === 'validated') {
        validatedByLayer[art.layer].add(art.artifactType);
      }
    }
  }

  // Calculate completeness ratio for the current and all previous layers
  let completenessBonus = 0;
  for (let l = 0; l <= layer; l++) {
    const required = LAYER_REQUIRED_ARTIFACTS[l] ?? [];
    const bonus = LAYER_BONUS_ARTIFACTS[l] ?? [];
    const maxBonus = LAYER_COMPLETENESS_BONUS[l] ?? 0;

    if (required.length === 0) continue;

    // Required artifacts: must exist (any status)
    const requiredPresent = required.filter((t) => artifactsByLayer[l].has(t)).length;
    // Validated: extra quality signal
    const requiredValidated = required.filter((t) => validatedByLayer[l].has(t)).length;
    // Bonus artifacts add a small extra
    const bonusPresent = bonus.filter((t) => artifactsByLayer[l].has(t)).length;

    const requiredRatio = required.length > 0 ? requiredPresent / required.length : 0;
    const validatedRatio = required.length > 0 ? requiredValidated / required.length : 0;
    const bonusRatio = bonus.length > 0 ? bonusPresent / bonus.length : 0;

    // Weighted: 50% required presence, 35% validated, 15% bonus
    const layerCompleteness = requiredRatio * 0.5 + validatedRatio * 0.35 + bonusRatio * 0.15;
    completenessBonus += layerCompleteness * maxBonus;
  }

  const baseScore = LAYER_BASE_SCORE[layer] ?? 0;
  const rawScore = baseScore + completenessBonus;
  const score = Math.round(Math.min(95, Math.max(0, rawScore)));

  const breakdown = {
    currentLayer: layer,
    baseScore,
    completenessBonus: Math.round(completenessBonus * 10) / 10,
    artifactsPerLayer: Object.fromEntries(
      Object.entries(artifactsByLayer).map(([l, set]) => [l, [...set]]),
    ),
    validatedPerLayer: Object.fromEntries(
      Object.entries(validatedByLayer).map(([l, set]) => [l, [...set]]),
    ),
  };

  return { score, breakdown };
}
