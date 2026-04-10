/**
 * Rate limiting middleware — Step 7.2
 *
 * In-memory sliding window rate limiter. Keyed by IP + optionally userId.
 * No external dependency required for MVP — uses a Map with cleanup.
 *
 * Limits (DEC per Security Framework §4.3):
 *   - Auth endpoints:    10 req/min per IP
 *   - AI/agent routes:  20 req/min per user
 *   - General API:      60 req/min per IP
 *   - Health:           no limit
 *
 * In production with Redis (Upstash), replace the in-memory store with
 * Redis INCR + EXPIRE for distributed rate limiting across instances.
 */

import type { MiddlewareHandler } from 'hono';
import { logger } from '../lib/logger.js';

interface RateWindow {
  count: number;
  resetAt: number;
}

// In-memory store: key → sliding window
const store = new Map<string, RateWindow>();

// Cleanup expired entries every 5 minutes to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of store.entries()) {
    if (window.resetAt < now) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

/**
 * Create a rate limiter middleware.
 *
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs    - Window duration in milliseconds
 * @param keyFn       - Function to extract the rate limit key from the request
 */
export function rateLimit(
  maxRequests: number,
  windowMs: number,
  keyFn?: (c: Parameters<MiddlewareHandler>[0]) => string,
): MiddlewareHandler {
  return async (c, next) => {
    // In test mode, skip rate limiting — avoids flaky tests from shared in-memory state
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    const key = keyFn ? keyFn(c) : `ip:${getClientIp(c)}:${c.req.path}`;
    const now = Date.now();

    let window = store.get(key);

    if (!window || window.resetAt < now) {
      // Start a new window
      window = { count: 1, resetAt: now + windowMs };
      store.set(key, window);
    } else {
      window.count++;
    }

    const remaining = Math.max(0, maxRequests - window.count);
    const resetIn = Math.ceil((window.resetAt - now) / 1000);

    // Set rate limit headers (RFC 6585)
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(window.resetAt / 1000)));

    if (window.count > maxRequests) {
      logger.warn({ key, count: window.count, maxRequests }, 'Rate limit exceeded');
      c.header('Retry-After', String(resetIn));
      return c.json(
        { error: 'Too many requests', retryAfterSeconds: resetIn },
        429,
      );
    }

    await next();
  };
}

// ── Pre-configured limiters ────────────────────────────────────────────────────

/** Auth routes: 10 req/min per IP — prevents brute force */
export function authRateLimit(): MiddlewareHandler {
  return rateLimit(10, 60_000, (c) => `ip:${getClientIp(c)}:auth`);
}

/** AI/agent routes: 20 req/min per authenticated user */
export function agentRateLimit(): MiddlewareHandler {
  return rateLimit(20, 60_000, (c) => {
    const auth = c.get('auth') as { userId?: string } | undefined;
    const userId = auth?.userId ?? getClientIp(c);
    return `user:${userId}:agent`;
  });
}

/** General API: 60 req/min per IP */
export function apiRateLimit(): MiddlewareHandler {
  return rateLimit(60, 60_000, (c) => `ip:${getClientIp(c)}:api`);
}

/** MARA chat: 30 req/min per user — conversational but still limited */
export function maraRateLimit(): MiddlewareHandler {
  return rateLimit(30, 60_000, (c) => {
    const auth = c.get('auth') as { userId?: string } | undefined;
    const userId = auth?.userId ?? getClientIp(c);
    return `user:${userId}:mara`;
  });
}
