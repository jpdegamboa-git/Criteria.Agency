import { logger } from "../shared/logger.js";

/**
 * Sliding-window rate limiter for API providers.
 *
 * Tracks request timestamps and waits automatically when limits
 * would be exceeded. Designed for Gemini free tier but reusable.
 *
 * Free tier limits (as of April 2026):
 *   gemini-2.5-flash:      10 RPM, 250 RPD
 *   gemini-2.5-pro:         5 RPM, 100 RPD
 *   gemini-2.5-flash-lite: 15 RPM, 1000 RPD
 *   imagen-4:               5 RPM,  50 RPD
 *   veo-3:                  2 RPM,  10 RPD
 */

interface RateLimitConfig {
  /** Max requests per minute */
  rpm: number;
  /** Max requests per day (resets midnight PT) */
  rpd: number;
  /** Label for logging */
  label: string;
}

// ── Default limits per model (free tier) ──

const MODEL_LIMITS: Record<string, RateLimitConfig> = {
  "gemini-2.5-flash": { rpm: 10, rpd: 250, label: "Flash" },
  "gemini-2.5-pro": { rpm: 5, rpd: 100, label: "Pro" },
  "gemini-imagen-3": { rpm: 5, rpd: 50, label: "Imagen" },
  "veo-3": { rpm: 2, rpd: 10, label: "Veo" },
  "gemini-2.5-pro-audio": { rpm: 5, rpd: 50, label: "Audio" },
};

const DEFAULT_LIMITS: RateLimitConfig = { rpm: 5, rpd: 100, label: "default" };

// ── Rate Limiter Class ──

export class RateLimiter {
  /** Timestamps of recent requests, keyed by model ID */
  private requests: Map<string, number[]> = new Map();
  /** Daily request count per model, keyed by "modelId:YYYY-MM-DD" */
  private dailyCounts: Map<string, number> = new Map();

  /**
   * Wait if necessary, then record a request.
   * Call this BEFORE making an API call.
   */
  async acquire(modelId: string): Promise<void> {
    const limits = MODEL_LIMITS[modelId] ?? DEFAULT_LIMITS;
    const now = Date.now();

    // Check daily limit
    const dayKey = `${modelId}:${this.getDayKeyPT()}`;
    const dailyCount = this.dailyCounts.get(dayKey) ?? 0;

    if (dailyCount >= limits.rpd) {
      const msUntilReset = this.msUntilMidnightPT();
      const hoursLeft = Math.ceil(msUntilReset / (60 * 60 * 1000));
      logger.warn("ratelimit.daily_exhausted", {
        model: modelId,
        label: limits.label,
        used: dailyCount,
        limit: limits.rpd,
        hoursUntilReset: hoursLeft,
      });
      throw new Error(
        `Daily rate limit reached for ${limits.label} (${dailyCount}/${limits.rpd}). Resets in ~${hoursLeft}h.`,
      );
    }

    // Check per-minute limit — wait if needed
    const timestamps = this.requests.get(modelId) ?? [];
    const oneMinuteAgo = now - 60_000;
    const recentRequests = timestamps.filter((t) => t > oneMinuteAgo);

    if (recentRequests.length >= limits.rpm) {
      // Calculate how long to wait for the oldest request to fall outside the window
      const oldestInWindow = recentRequests[0];
      const waitMs = oldestInWindow + 60_000 - now + 100; // +100ms buffer

      logger.info("ratelimit.waiting", {
        model: modelId,
        label: limits.label,
        rpm: `${recentRequests.length}/${limits.rpm}`,
        rpd: `${dailyCount}/${limits.rpd}`,
        waitMs,
        waitSec: Math.ceil(waitMs / 1000),
      });

      await sleep(waitMs);
    }

    // Record this request
    const updatedTimestamps = [
      ...(this.requests.get(modelId) ?? []).filter((t) => t > Date.now() - 60_000),
      Date.now(),
    ];
    this.requests.set(modelId, updatedTimestamps);
    this.dailyCounts.set(dayKey, (this.dailyCounts.get(dayKey) ?? 0) + 1);

    const currentRpm = updatedTimestamps.length;
    const currentRpd = this.dailyCounts.get(dayKey)!;

    logger.info("ratelimit.acquired", {
      model: modelId,
      label: limits.label,
      rpm: `${currentRpm}/${limits.rpm}`,
      rpd: `${currentRpd}/${limits.rpd}`,
    });
  }

  /** Get remaining requests for a model */
  getRemaining(modelId: string): { rpm: number; rpd: number } {
    const limits = MODEL_LIMITS[modelId] ?? DEFAULT_LIMITS;
    const now = Date.now();
    const timestamps = this.requests.get(modelId) ?? [];
    const recentRequests = timestamps.filter((t) => t > now - 60_000);
    const dayKey = `${modelId}:${this.getDayKeyPT()}`;
    const dailyCount = this.dailyCounts.get(dayKey) ?? 0;

    return {
      rpm: limits.rpm - recentRequests.length,
      rpd: limits.rpd - dailyCount,
    };
  }

  /** YYYY-MM-DD in Pacific Time */
  private getDayKeyPT(): string {
    const ptDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
    );
    return ptDate.toISOString().slice(0, 10);
  }

  /** Milliseconds until midnight Pacific Time */
  private msUntilMidnightPT(): number {
    const ptNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
    );
    const midnight = new Date(ptNow);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime() - ptNow.getTime();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Singleton ──
export const geminiRateLimiter = new RateLimiter();
