export type Tier = "pyme" | "mediana" | "agencia";

export const TIER_CAPABILITIES: Record<Tier, string[]> = {
  pyme: [
    "C-001", "C-002", "C-003", "C-004", "C-005", // Strategy
    "C-006", "C-007", "C-008",                     // Brand
    "C-009", "C-010", "C-011",                     // Core production (video, design, copy)
    "C-017",                                        // Community management
    "C-033",                                        // Basic dashboard
    "C-045", "C-047",                              // Security basics
  ],
  mediana: [
    // All pyme +
    "C-012", "C-013", "C-014", "C-015",           // Full production
    "C-016", "C-018", "C-019", "C-020", "C-021", "C-022", // All distribution
    "C-023", "C-024", "C-025", "C-026", "C-027",  // Intelligence
    "C-028", "C-029", "C-030", "C-031", "C-032",  // Sales
    "C-033", "C-034", "C-035", "C-036", "C-037",  // Full analytics
    "C-038", "C-039", "C-040", "C-041",           // Budget
    "C-046",                                       // Data protection
  ],
  agencia: [
    // All mediana +
    "C-042", "C-043", "C-044",                    // Scale
    "C-048", "C-049",                              // Positioning
  ],
};

export const TIER_LABELS: Record<Tier, string> = {
  pyme: "PyME",
  mediana: "Mediana Empresa",
  agencia: "Agencia",
};

export function getCapabilitiesForTier(tier: Tier): string[] {
  // Agencia includes mediana, mediana includes pyme
  if (tier === "agencia") return [...new Set([...TIER_CAPABILITIES.pyme, ...TIER_CAPABILITIES.mediana, ...TIER_CAPABILITIES.agencia])];
  if (tier === "mediana") return [...new Set([...TIER_CAPABILITIES.pyme, ...TIER_CAPABILITIES.mediana])];
  return TIER_CAPABILITIES.pyme;
}
