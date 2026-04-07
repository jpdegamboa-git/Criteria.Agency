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
