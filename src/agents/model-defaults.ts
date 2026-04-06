// ── Model Defaults ─────────────────────────────────────────────
// Default model assignments per agent (and optionally per step).

export const MODEL_DEFAULTS: Record<string, string> = {
  // Top-level evaluators (complex reasoning)
  "TL-002": "claude-opus-4",
  "XF-001": "claude-opus-4",

  // Text-heavy agents (standard reasoning)
  "T1-L": "claude-sonnet-4",
  "T2-L": "claude-sonnet-4",
  "T2-002": "claude-sonnet-4",
  "T2-006": "claude-sonnet-4",
  "T7-L": "claude-sonnet-4",
  "TL-001": "claude-sonnet-4",
  "TL-003": "claude-sonnet-4",

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
};

const DEFAULT_FALLBACK = "claude-sonnet-4";

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
