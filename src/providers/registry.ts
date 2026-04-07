import type { ModelProvider } from "./types.js";
import { getModel } from "./catalog.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { PiAPIProvider } from "./piapi.js";
import { MockProvider } from "./mock.js";
import { logger } from "../shared/logger.js";

const providers: Record<string, ModelProvider> = {};

function initProviders() {
  if (Object.keys(providers).length > 0) return;
  providers["anthropic:text"] = new AnthropicProvider();
  providers["gemini:text"] = new GeminiProvider("text");
  providers["gemini:image"] = new GeminiProvider("image");
  providers["gemini:video"] = new GeminiProvider("video");
  providers["gemini:audio"] = new GeminiProvider("audio");
  providers["piapi:video"] = new PiAPIProvider();
  providers["mock:text"] = new MockProvider("text");
  providers["mock:image"] = new MockProvider("image");
  providers["mock:video"] = new MockProvider("video");
  providers["mock:audio"] = new MockProvider("audio");
}

export async function getProviderForModel(modelId: string): Promise<ModelProvider> {
  initProviders();
  const model = getModel(modelId);
  if (!model) {
    logger.warn("registry.unknownModel", { modelId });
    return providers["mock:text"];
  }
  const key = `${model.provider}:${model.type}`;
  const provider = providers[key];
  if (!provider) {
    return providers[`mock:${model.type}`] ?? providers["mock:text"];
  }
  const status = await provider.getStatus();
  if (!status.available) {
    logger.warn("registry.providerUnavailable", { provider: key, error: status.error });
    return providers[`mock:${model.type}`] ?? providers["mock:text"];
  }
  return provider;
}

export async function getAllProviderStatus() {
  initProviders();
  const statuses = [];
  for (const [key, provider] of Object.entries(providers)) {
    if (key.startsWith("mock:")) continue;
    const status = await provider.getStatus();
    statuses.push({ id: provider.id, type: key.split(":")[1], ...status });
  }
  return statuses;
}
