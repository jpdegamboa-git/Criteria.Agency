import { getProviderForModel } from "./registry.js";

/**
 * Thin wrapper over the provider registry for simple text generation.
 * Replaces the standalone askClaude() helper so that all LLM calls
 * go through the registry and benefit from rate-limiting and cost tracking.
 */
export async function generateText(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number,
): Promise<string> {
  const provider = await getProviderForModel(modelId);
  const result = await provider.generate({
    model: modelId,
    systemPrompt,
    userPrompt,
    ...(maxTokens !== undefined ? { maxTokens } : {}),
  });

  if (result.status === "failed") {
    throw new Error(`generateText failed: ${result.error ?? "unknown error"}`);
  }

  return result.output?.text ?? "";
}
