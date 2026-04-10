/**
 * Vercel AI SDK v6 + Langfuse — Step 0.7 validation
 *
 * What we validate:
 * 1. MODELS constants match expected model IDs (DEC-174)
 * 2. createProvider() returns an Anthropic provider function
 * 3. getLangfuseClient() returns null when keys are absent; Langfuse instance when present
 * 4. Pattern 1: classifyText() — generateText() with Haiku (skipped without API key)
 * 5. Pattern 2: runAgentWithTools() — generateText() with tools + Sonnet (skipped without API key)
 *
 * Tests 1-3 always run (unit tests, no API calls).
 * Tests 4-5 require ANTHROPIC_API_KEY.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { MODELS, createProvider, getLangfuseClient, resetLangfuseClient, classifyText, runAgentWithTools, tool } from '../src/lib/ai.js';
import { z } from 'zod';

const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;
const skipMsg = 'ANTHROPIC_API_KEY not set — skipping live LLM test';

describe('Vercel AI SDK + Langfuse — Step 0.7', () => {

  afterEach(() => {
    // Reset cached Langfuse client so env var tests don't bleed into each other
    resetLangfuseClient();
  });

  // ── 1. Model IDs (DEC-174) ────────────────────────────────

  describe('MODELS constants (DEC-174)', () => {
    it('opus is claude-opus-4-6', () => {
      expect(MODELS.opus).toBe('claude-opus-4-6');
    });

    it('sonnet is claude-sonnet-4-6', () => {
      expect(MODELS.sonnet).toBe('claude-sonnet-4-6');
    });

    it('haiku is claude-haiku-4-5-20251001', () => {
      expect(MODELS.haiku).toBe('claude-haiku-4-5-20251001');
    });
  });

  // ── 2. Provider configuration ─────────────────────────────

  describe('createProvider()', () => {
    const ctx = { agentId: 'test-agent', skillId: 'test-skill', tenantId: 'test-org' };

    it('returns a provider function', () => {
      const provider = createProvider(ctx);
      expect(typeof provider).toBe('function');
    });

    it('exports tool builder from ai SDK', () => {
      expect(typeof tool).toBe('function');
    });
  });

  // ── 3. Langfuse client (DEC-228) ─────────────────────────

  describe('getLangfuseClient() (DEC-228)', () => {
    it('returns null when LANGFUSE keys are not set', () => {
      // In test env both keys are typically absent — verify graceful null
      const original_pub = process.env.LANGFUSE_PUBLIC_KEY;
      const original_sec = process.env.LANGFUSE_SECRET_KEY;
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;
      resetLangfuseClient();

      const client = getLangfuseClient();
      expect(client).toBeNull();

      // Restore
      if (original_pub) process.env.LANGFUSE_PUBLIC_KEY = original_pub;
      if (original_sec) process.env.LANGFUSE_SECRET_KEY = original_sec;
    });

    it('returns a Langfuse instance when both keys are set', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test';
      resetLangfuseClient();

      const client = getLangfuseClient();
      expect(client).not.toBeNull();
      expect(typeof client?.trace).toBe('function');

      // Cleanup
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;
    });
  });

  // ── 4. Pattern 1: classifyText() — generateText() ─────────

  describe('Pattern 1: classifyText() — generateText()', () => {
    it('invokes LLM and returns text + usage', async () => {
      if (!HAS_API_KEY) { console.log(`[skip] ${skipMsg}`); return; }

      const result = await classifyText({
        ctx: { agentId: 'test-classifier', skillId: 'classify', tenantId: 'test-org' },
        model: MODELS.haiku,
        system: 'Classify sentiment as: positive, negative, or neutral. Respond with one word only.',
        prompt: 'I love this product!',
      });

      expect(result.text).toBeTruthy();
      expect(['positive', 'negative', 'neutral']).toContain(result.text.toLowerCase().trim());
      expect(result.usage.inputTokens).toBeGreaterThan(0);
      expect(result.usage.outputTokens).toBeGreaterThan(0);
      expect(result.finishReason).toBe('stop');
    }, 30_000);
  });

  // ── 5. Pattern 2: runAgentWithTools() — agent with tools ──

  describe('Pattern 2: runAgentWithTools() — agent with tools', () => {
    it('invokes agent with a tool and returns tool results + text', async () => {
      if (!HAS_API_KEY) { console.log(`[skip] ${skipMsg}`); return; }

      // Minimal tool: returns a static value (no DB needed for unit validation)
      const getPlatformName = tool({
        description: 'Returns the name of the platform.',
        inputSchema: z.object({}),
        execute: async () => ({ name: 'criteria.agency' }),
      });

      const result = await runAgentWithTools({
        ctx: { agentId: 'test-agent', skillId: 'lookup', tenantId: 'test-org' },
        model: MODELS.sonnet,
        system: 'You are a helpful assistant. Use the available tool to answer questions.',
        prompt: 'What is the name of the platform? Use the tool to find out.',
        tools: { getPlatformName },
        maxSteps: 3,
      });

      expect(result.text).toBeTruthy();
      expect(result.text.toLowerCase()).toContain('criteria');
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      expect(result.usage.inputTokens).toBeGreaterThan(0);
      // At least one tool call should have been made
      const totalToolCalls = result.steps.reduce(
        (sum, s) => sum + (s.toolCalls?.length ?? 0), 0
      );
      expect(totalToolCalls).toBeGreaterThanOrEqual(1);
    }, 30_000);
  });
});
