// ── Model Defaults ─────────────────────────────────────────────
// Default model assignments per agent (and optionally per step).

export const MODEL_DEFAULTS: Record<string, string> = {
  // Top-level evaluators (complex reasoning)
  "TL-002": "gemini-2.5-flash",
  "XF-001": "gemini-2.5-flash",

  // Text-heavy agents (standard reasoning)
  "T1-L": "gemini-2.5-flash",
  "T2-L": "gemini-2.5-flash",
  "T2-002": "gemini-2.5-flash",
  "T2-006": "gemini-2.5-flash",
  "T7-L": "gemini-2.5-flash",
  "TL-001": "gemini-2.5-flash",
  "TL-003": "gemini-2.5-flash",

  // Image generation
  "T3-003:storyboard": "gemini-imagen-3",

  // Video generation
  "T3-003:video_gen": "veo-3",

  // Audio generation
  "T5-L": "gemini-2.5-pro-audio",

  // Model team (fast, low-cost)
  "T9-L": "gemini-2.5-flash",
  "T9-001": "gemini-2.5-flash",
  "T9-002": "gemini-2.5-flash",
  "T9-003": "gemini-2.5-flash",
  "T9-004": "gemini-2.5-flash",
  "T9-005": "gemini-2.5-flash",

  // Brand Builder
  "BB-L": "claude-sonnet-4",
  "BB-001": "gemini-2.5-flash",
  "BB-002": "gemini-2.5-flash",
  "BB-003": "claude-sonnet-4",
  "BB-004": "gemini-2.5-flash",
  // Strategist
  "ST-L": "claude-sonnet-4",
  "ST-001": "gemini-2.5-flash",
  "ST-002": "claude-sonnet-4",
  "ST-003": "gemini-2.5-flash",
  // Listeners (stubs)
  "LI-001": "gemini-2.5-flash",
  "LI-002": "gemini-2.5-flash",
  "LI-003": "gemini-2.5-flash",
  "LI-004": "gemini-2.5-flash",
  // Transversals (stubs)
  "XA-001": "gemini-2.5-flash",
  "XA-002": "gemini-2.5-flash",
  "XA-003": "gemini-2.5-flash",
  "XA-004": "gemini-2.5-flash",
  // Graphic Design
  "GD-L": "claude-sonnet-4",
  "GD-001": "gemini-2.5-flash",
  "GD-002": "gemini-2.5-flash",
  "GD-002:moodboard": "gemini-imagen-3",
  "GD-002:production": "gemini-imagen-3",
  "GD-003": "gemini-2.5-flash",
  "GD-004": "gemini-2.5-flash",
  "GD-004:production": "veo-3",
  "GD-004:adaptation": "veo-3",
  "GD-005": "gemini-2.5-flash",
  "GD-005:production": "gemini-imagen-3",
  // Copywriter (cross-motor)
  "CW-001": "claude-sonnet-4",
  // Writers Room
  "WR-L": "claude-sonnet-4",
  "WR-001": "gemini-2.5-flash",
  "WR-002": "gemini-2.5-flash",
  "WR-003": "gemini-2.5-flash",
  "WR-004": "gemini-2.5-flash",
  "WR-005": "claude-sonnet-4",
  // Audio Motor
  "AU-L": "claude-sonnet-4",
  "AU-001": "gemini-2.5-pro-audio",
  "AU-002": "gemini-2.5-pro-audio",
  "AU-003": "gemini-2.5-pro-audio",
  "AU-004": "gemini-2.5-flash",
  // Web Motor
  "WB-L": "claude-sonnet-4",
  "WB-001": "gemini-2.5-flash",
  "WB-002": "gemini-2.5-flash",
  "WB-003": "gemini-2.5-flash",
  "WB-004": "gemini-2.5-flash",
  "WB-005": "gemini-2.5-flash",
  // Marketplace
  "MK-L": "claude-sonnet-4",
  "MK-001": "gemini-2.5-flash",
  "MK-002": "gemini-2.5-flash",
  "MK-003": "gemini-2.5-flash",
  // Print Production
  "PP-L": "claude-sonnet-4",
  "PP-001": "gemini-2.5-flash",
  "PP-002": "gemini-2.5-flash",
  "PP-003": "gemini-2.5-flash",
  // Events Motor
  "EV-L": "claude-sonnet-4",
  "EV-001": "gemini-2.5-flash",
  "EV-002": "gemini-2.5-flash",
  "EV-003": "gemini-2.5-flash",
  "EV-004": "gemini-2.5-flash",
  "EV-005": "gemini-2.5-flash",
  // Ads Motor
  "AD-L": "claude-sonnet-4",
  "AD-001": "gemini-2.5-flash",
  "AD-002": "gemini-2.5-flash",
  "AD-003": "gemini-2.5-flash",
  "AD-004": "gemini-2.5-flash",
  // Community Management
  "CM-L": "claude-sonnet-4",
  "CM-001": "gemini-2.5-flash",
  "CM-002": "gemini-2.5-flash",
  "CM-003": "gemini-2.5-flash",
  "CM-004": "gemini-2.5-flash",
  // Email Marketing
  "EM-L": "claude-sonnet-4",
  "EM-001": "gemini-2.5-flash",
  "EM-002": "gemini-2.5-flash",
  "EM-003": "gemini-2.5-flash",
  "EM-004": "gemini-2.5-flash",
  // SEO/Content
  "SE-L": "claude-sonnet-4",
  "SE-001": "gemini-2.5-flash",
  "SE-002": "gemini-2.5-flash",
  "SE-003": "gemini-2.5-flash",
  "SE-004": "gemini-2.5-flash",
  // Channel Manager
  "CH-L": "claude-sonnet-4",
  "CH-001": "gemini-2.5-flash",
  "CH-002": "gemini-2.5-flash",
  "CH-003": "gemini-2.5-flash",
  // Opportunity Agent
  "OP-L": "claude-sonnet-4",
  "OP-001": "gemini-2.5-flash",
  "OP-002": "gemini-2.5-flash",
  // Brand Listener
  "BL-L": "claude-sonnet-4",
  "BL-001": "gemini-2.5-flash",
  "BL-002": "gemini-2.5-flash",
  // Culture Listener
  "CL-L": "claude-sonnet-4",
  "CL-001": "gemini-2.5-flash",
  "CL-002": "gemini-2.5-flash",
  // Industry Listener
  "IL-L": "claude-sonnet-4",
  "IL-001": "gemini-2.5-flash",
  "IL-002": "gemini-2.5-flash",
  // Competitive Listener
  "CO-L": "claude-sonnet-4",
  "CO-001": "gemini-2.5-flash",
  "CO-002": "gemini-2.5-flash",
  // Sales/CRM
  "SL-L": "claude-sonnet-4",
  "SL-001": "gemini-2.5-flash",
  "SL-002": "gemini-2.5-flash",
  "SL-003": "gemini-2.5-flash",
  "SL-004": "gemini-2.5-flash",
  "SL-005": "gemini-2.5-flash",
  "SL-006": "gemini-2.5-flash",
  // Security Team
  "SC-L": "claude-sonnet-4",
  "SC-001": "gemini-2.5-flash",
  "SC-002": "gemini-2.5-flash",
  "SC-003": "gemini-2.5-flash",
  // Financial Motor
  "FN-L": "claude-sonnet-4",
  "FN-001": "gemini-2.5-flash",
  "FN-002": "gemini-2.5-flash",
  "FN-003": "gemini-2.5-flash",
  // Analytics
  "AN-L": "claude-sonnet-4",
  "AN-001": "gemini-2.5-flash",
  "AN-002": "gemini-2.5-flash",
  "AN-003": "gemini-2.5-flash",
  "AN-004": "gemini-2.5-flash",
  "AN-005": "claude-sonnet-4",
};

const DEFAULT_FALLBACK = "gemini-2.5-flash";

/**
 * Get the default model for a given agent and optional step.
 * Checks `${agentId}:${step}` first, then `agentId`, then fallback.
 */
export function getDefaultModel(agentId: string, step?: string): string {
  if (step) {
    const specific = MODEL_DEFAULTS[`${agentId}:${step}`];
    if (specific) return specific;
  }
  return MODEL_DEFAULTS[agentId] ?? DEFAULT_FALLBACK;
}
