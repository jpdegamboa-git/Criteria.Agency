import type { ModelProvider, GenerateResult, ModelType } from "../providers/types.js";

// ── Timeouts per output type (ms) ──────────────────────────────

const TIMEOUTS: Record<string, number> = {
  image: 120_000,
  video: 600_000,
  audio: 300_000,
};

const DEFAULT_INTERVAL = 10_000;

/**
 * Poll a provider's checkJob until it completes, fails, or times out.
 */
export async function pollUntilComplete(
  provider: ModelProvider,
  jobId: string,
  outputType: ModelType,
  intervalMs: number = DEFAULT_INTERVAL,
): Promise<GenerateResult> {
  const timeout = TIMEOUTS[outputType] ?? 120_000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (!provider.checkJob) {
      return {
        status: "failed",
        error: `Provider ${provider.id} does not support async job polling`,
      };
    }

    const result = await provider.checkJob(jobId);

    if (result.status === "completed" || result.status === "failed") {
      return result;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: "failed",
    jobId,
    error: `Job timed out after ${timeout}ms for ${outputType} generation`,
  };
}
