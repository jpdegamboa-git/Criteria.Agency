/**
 * MARA — Intent Classification skill (DEC-128, DEC-129)
 *
 * "What does the client want?"
 *
 * 6 intent categories (DEC-129):
 *   data_lookup        → Analyst system functions (free)
 *   interpretation     → Output Registry → if miss, Analyst agent (free)
 *   strategic_decision → Output Registry → if miss, Strategist (tokens)
 *   brand_action       → Brand Builder (tokens)
 *   operational_action → Framework Orchestrator (tokens)
 *   navigation         → System functions (free)
 *
 * Model: Haiku (DEC-174 — classification, intent routing, lightweight).
 * Tier A (Anthropic only — DEC-149: MARA handles confidential client data).
 * Pattern: classifyText() — simple generateText() (DEC-141).
 */

import { classifyText, MODELS } from '../ai.js';
import { loadPrompt } from '../prompt-loader.js';
import type { Database } from '@criteria/db';

// ── Intent taxonomy (DEC-129) ─────────────────────────────────────────────────

export const INTENT_CATEGORIES = [
  'data_lookup',
  'interpretation',
  'strategic_decision',
  'brand_action',
  'operational_action',
  'navigation',
] as const;

export type IntentCategory = (typeof INTENT_CATEGORIES)[number];

// Free intents never consume tokens regardless of play/pause state
export const FREE_INTENTS: IntentCategory[] = ['data_lookup', 'navigation'];

// Intents that benefit from Output Registry lookup before agent invocation
export const REGISTRY_FIRST_INTENTS: IntentCategory[] = ['interpretation', 'strategic_decision'];

// Intents that always consume tokens (if play mode is on)
export const PAID_INTENTS: IntentCategory[] = [
  'interpretation',      // if Output Registry miss → Analyst agent
  'strategic_decision',  // if Output Registry miss → Strategist
  'brand_action',        // → Brand Builder
  'operational_action',  // → Creation motors
];

export interface IntentClassificationResult {
  category: IntentCategory;
  confidence: 'high' | 'medium' | 'low';
  requiresTokens: boolean;
  rationale: string;
}

export interface ClassifyIntentOptions {
  db: Database;
  tenantId: string;
  userMessage: string;
  /** Current page/section the client is viewing — used for ambiguity resolution (§3.1) */
  uiContext?: Record<string, unknown>;
  /** Recent conversation turns (last N messages) for context */
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ── Main classification function ──────────────────────────────────────────────

export async function classifyIntent(
  opts: ClassifyIntentOptions,
): Promise<IntentClassificationResult> {
  const { db, tenantId, userMessage, uiContext = {}, conversationHistory = [] } = opts;

  const promptConfig = await loadPrompt(db, 'mara', 'intent-classification');

  // Build contextual prompt
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-6) // last 6 turns
          .map((m) => `${m.role === 'user' ? 'Cliente' : 'MARA'}: ${m.content}`)
          .join('\n')
      : 'Sin historial previo en esta sesión.';

  const uiContextText =
    Object.keys(uiContext).length > 0
      ? `Página actual: ${JSON.stringify(uiContext)}`
      : 'Contexto UI no disponible.';

  const prompt = `${uiContextText}

Historial reciente:
${historyText}

Mensaje del cliente: "${userMessage}"

Clasifica el intent. Responde SOLO con JSON en este formato exacto:
{
  "category": "<una de: data_lookup | interpretation | strategic_decision | brand_action | operational_action | navigation>",
  "confidence": "<high | medium | low>",
  "rationale": "<una oración explicando por qué>"
}`;

  const result = await classifyText({
    ctx: { agentId: 'mara', skillId: 'intent-classification', tenantId },
    model: MODELS.haiku,
    system: promptConfig.systemPrompt,
    prompt,
  });

  // Parse JSON response
  let parsed: { category: string; confidence: string; rationale: string };
  try {
    // Extract JSON from response (may have surrounding text)
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback: treat as navigation/meta if parsing fails
    return {
      category: 'navigation',
      confidence: 'low',
      requiresTokens: false,
      rationale: 'Classification parsing failed — defaulting to navigation',
    };
  }

  const category = INTENT_CATEGORIES.includes(parsed.category as IntentCategory)
    ? (parsed.category as IntentCategory)
    : 'navigation';

  const confidence =
    parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
      ? parsed.confidence
      : 'low';

  return {
    category,
    confidence,
    requiresTokens: PAID_INTENTS.includes(category),
    rationale: parsed.rationale ?? '',
  };
}
