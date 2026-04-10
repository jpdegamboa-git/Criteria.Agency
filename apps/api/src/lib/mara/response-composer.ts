/**
 * MARA — Response Composition skill (DEC-128)
 *
 * "How do I say this?"
 *
 * Takes technical outputs from agents or system functions and translates them
 * into natural, client-appropriate language in Spanish (LATAM).
 *
 * Single face principle (DEC-138): client always talks to MARA — never to
 * "the Strategist" or "the Analyst" directly. MARA integrates all backend
 * responses as its own voice.
 *
 * Soft transparency (§4): MARA communicates internal activity in natural language:
 *   "Consultando tus datos..." not "Querying Analyst system function..."
 *
 * Model: Sonnet (DEC-174 — executor agent, response quality matters).
 * Tier A (Anthropic only — DEC-149).
 * Pattern: classifyText() — the composition step is translation, not reasoning.
 * MARA itself is free (DEC-132) — cost comes from what it invokes downstream.
 */

import { classifyText, MODELS } from '../ai.js';
import { loadPrompt } from '../prompt-loader.js';
import type { Database } from '@criteria/db';
import type { IntentCategory } from './intent-classifier.js';

export interface ComposeResponseOptions {
  db: Database;
  tenantId: string;
  /** The original message from the client */
  userMessage: string;
  /** The raw technical output from the agent/system function */
  agentOutput: string;
  /** Which agent/system produced the output */
  source: string;
  /** Intent that was classified */
  intentCategory: IntentCategory;
  /** Whether this came from Output Registry (affects framing) */
  fromOutputRegistry: boolean;
  /** Client's plan tier for language calibration (starter → simpler, agency → more technical) */
  clientTier?: 'starter' | 'pro' | 'agency';
  /** Conversation history for tone/context */
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ComposedResponse {
  message: string;
  suggestedActions?: string[];
}

export async function composeResponse(
  opts: ComposeResponseOptions,
): Promise<ComposedResponse> {
  const {
    db,
    tenantId,
    userMessage,
    agentOutput,
    source,
    intentCategory,
    fromOutputRegistry,
    clientTier = 'starter',
    conversationHistory = [],
  } = opts;

  const promptConfig = await loadPrompt(db, 'mara', 'response-composition');

  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-4)
          .map((m) => `${m.role === 'user' ? 'Cliente' : 'MARA'}: ${m.content}`)
          .join('\n')
      : '';

  const sourceNote = fromOutputRegistry
    ? `(dato obtenido del registro de outputs existentes — sin costo adicional)`
    : `(obtenido de: ${source})`;

  const prompt = `Tier del cliente: ${clientTier}
Intent clasificado: ${intentCategory}
Fuente del dato: ${sourceNote}

${historyText ? `Historial reciente:\n${historyText}\n\n` : ''}Pregunta del cliente: "${userMessage}"

Output técnico a traducir:
${agentOutput}

Transforma el output técnico en una respuesta conversacional natural en español para el cliente.
Responde con JSON:
{
  "message": "<respuesta en lenguaje natural, cálida y directa>",
  "suggestedActions": ["<acción sugerida 1>", "<acción sugerida 2>"] // opcional, máximo 2
}`;

  const result = await classifyText({
    ctx: { agentId: 'mara', skillId: 'response-composition', tenantId },
    model: MODELS.sonnet,
    system: promptConfig.systemPrompt,
    prompt,
  });

  let parsed: { message: string; suggestedActions?: string[] };
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback: use raw output
    return { message: agentOutput };
  }

  return {
    message: parsed.message ?? agentOutput,
    suggestedActions: parsed.suggestedActions,
  };
}
