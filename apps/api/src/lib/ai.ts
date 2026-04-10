/**
 * AI SDK wrapper — Step 0.7
 *
 * Vercel AI SDK v6 + Langfuse SDK-wrapper for LLM observability (DEC-141, DEC-228).
 *
 * Two invocation patterns (DEC-141):
 * - generateText()  → simple tasks: classification, summaries (Haiku)
 * - generateText() with tools + stopWhen → complex tasks: strategy, evaluation (Sonnet/Opus)
 *
 * Langfuse wraps each LLM call and logs tokens/cost/latency per agent per client.
 * Each call creates a trace tagged with agentId, tenantId, skillId (DEC-228).
 *
 * Data tiers (DEC-149):
 * - Tier A (confidential): Anthropic only. Brand Builder, Strategist, Analyst, MARA.
 * - Tier B (general): OpenAI/Google with training opt-out.
 * - Tier C (public): any provider.
 *
 * DEC-228: supersedes DEC-147 (Helicone). Langfuse is self-hostable and open-source.
 */
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs } from 'ai';
import type { Tool } from 'ai';
import { Langfuse } from 'langfuse';

// ── Model IDs (DEC-174: model by creative leverage) ──────────────────────────
export const MODELS = {
  /** Creative Director + Showrunner — highest-judgment roles */
  opus: 'claude-opus-4-6' as const,
  /** Executor agents + Brand Guardian */
  sonnet: 'claude-sonnet-4-6' as const,
  /** Classification, intent routing — lightweight tasks */
  haiku: 'claude-haiku-4-5-20251001' as const,
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// ── Agent context ─────────────────────────────────────────────────────────────
export interface AgentContext {
  agentId: string;
  skillId: string;
  tenantId: string;
}

// ── Langfuse client (lazy singleton) ─────────────────────────────────────────

let _langfuseClient: Langfuse | null | undefined;

/**
 * Returns a Langfuse client if keys are configured, or null (dev/test fallback).
 * Logs a warning in non-test environments when keys are missing.
 */
export function getLangfuseClient(): Langfuse | null {
  if (_langfuseClient !== undefined) return _langfuseClient;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;

  if (!publicKey || !secretKey) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[ai] LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY not set — LLM calls will not be observed');
    }
    _langfuseClient = null;
    return null;
  }

  _langfuseClient = new Langfuse({
    publicKey,
    secretKey,
    baseUrl: process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com',
  });
  return _langfuseClient;
}

/** Resets the cached Langfuse client (used in tests to pick up env var changes). */
export function resetLangfuseClient(): void {
  _langfuseClient = undefined;
}

// ── Anthropic provider ────────────────────────────────────────────────────────

/**
 * Creates a direct Anthropic provider instance.
 * Observability is handled at call time via Langfuse, not at the provider level.
 * AgentContext is accepted for API compatibility; tracing uses it in each call.
 */
export function createProvider(_ctx: AgentContext) {
  return createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    // Explicit baseURL prevents ANTHROPIC_BASE_URL shell env from overriding the SDK default
    baseURL: 'https://api.anthropic.com/v1',
  });
}

// ── Tier enforcement (DEC-149) ───────────────────────────────────────────────

/** Maps provider names to their data tier (what sensitivity they may handle). */
const PROVIDER_TIERS: Record<string, 'A' | 'B' | 'C'> = {
  anthropic: 'A',   // Tier A — confidential data allowed
  openai: 'B',      // Tier B — general data only
  google: 'B',      // Tier B — general data only
  gemini: 'B',
};

/**
 * Enforces DEC-149 data tier rules before any LLM invocation.
 * Tier A prompts (Brand Builder, Strategist, Analyst, MARA) may ONLY use Anthropic.
 * No automatic fallback — throws immediately if the provider is insufficient.
 *
 * @param dataSensitivity - 'A' | 'B' | 'C' from prompt_registry
 * @param provider - provider name from prompt_registry (e.g. 'anthropic', 'openai')
 */
export function assertTierAllowed(dataSensitivity: string, provider: string): void {
  const sensitivity = dataSensitivity as 'A' | 'B' | 'C';
  const providerTier = PROVIDER_TIERS[provider.toLowerCase()] ?? 'C';

  if (sensitivity === 'A' && providerTier !== 'A') {
    throw new Error(
      `DEC-149 tier violation: prompt dataSensitivity=A requires an Anthropic provider, ` +
        `but provider="${provider}" (tier=${providerTier}) was requested. ` +
        `No automatic fallback. Use provider="anthropic" for Tier A agents.`,
    );
  }

  if (sensitivity === 'B' && providerTier === 'C') {
    throw new Error(
      `DEC-149 tier violation: prompt dataSensitivity=B requires a Tier A or B provider, ` +
        `but provider="${provider}" (tier=C) was requested.`,
    );
  }
  // Tier C prompts: any provider allowed.
}

// ── Pattern 1: generateText() — simple tasks (DEC-141) ───────────────────────

interface ClassifyOptions {
  ctx: AgentContext;
  model?: ModelId;
  system?: string;
  prompt: string;
}

/**
 * Simple generateText() invocation — for classification, summaries, extraction.
 * Defaults to Haiku (cheapest, fastest) per DEC-174.
 * Wraps each call with a Langfuse trace tagged by agentId/tenantId/skillId.
 */
export async function classifyText(options: ClassifyOptions) {
  const { ctx, model = MODELS.haiku, system, prompt } = options;
  const provider = createProvider(ctx);

  const lf = getLangfuseClient();
  const trace = lf?.trace({
    name: ctx.agentId,
    metadata: { tenantId: ctx.tenantId, skillId: ctx.skillId },
  });
  const generation = trace?.generation({
    name: ctx.skillId,
    model,
    input: { system, prompt },
  });

  const result = await generateText({
    model: provider(model),
    system,
    prompt,
  });

  generation?.end({
    output: result.text,
    usage: {
      input: result.usage.inputTokens,
      output: result.usage.outputTokens,
    },
  });
  await lf?.flushAsync();

  return {
    text: result.text,
    usage: result.usage,
    finishReason: result.finishReason,
  };
}

// ── Pattern 2: generateText() with tools — complex tasks (DEC-141) ───────────

// ToolSet type matches what generateText accepts: Record<string, Tool<any, any>>
type ToolSet = Record<string, Tool<any, any>>;

interface AgentWithToolsOptions {
  ctx: AgentContext;
  model?: ModelId;
  system: string;
  prompt: string;
  tools: ToolSet;
  /** Maximum number of tool-call cycles before stopping. Default: 5. */
  maxSteps?: number;
}

/**
 * Agent with tools invocation — for strategy, creative direction, evaluation.
 * Defaults to Sonnet (capable executor). Use MODELS.opus for CD/Showrunner (DEC-174).
 *
 * Uses stopWhen: stepCountIs(maxSteps) — v6 replaces legacy maxSteps param.
 * Keep maxSteps low (3-5) for gates, higher (10+) for full strategy sessions.
 * Wraps each call with a Langfuse trace tagged by agentId/tenantId/skillId.
 */
export async function runAgentWithTools(options: AgentWithToolsOptions) {
  const { ctx, model = MODELS.sonnet, system, prompt, tools, maxSteps = 5 } = options;
  const provider = createProvider(ctx);

  const lf = getLangfuseClient();
  const trace = lf?.trace({
    name: ctx.agentId,
    metadata: { tenantId: ctx.tenantId, skillId: ctx.skillId },
  });
  const generation = trace?.generation({
    name: ctx.skillId,
    model,
    input: { system, prompt },
  });

  const result = await generateText({
    model: provider(model),
    system,
    prompt,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });

  generation?.end({
    output: result.text,
    usage: {
      input: result.usage.inputTokens,
      output: result.usage.outputTokens,
    },
  });
  await lf?.flushAsync();

  return {
    text: result.text,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
    steps: result.steps,
    usage: result.usage,
    finishReason: result.finishReason,
  };
}

// Re-export tool builder for use in agent definitions
export { tool };
