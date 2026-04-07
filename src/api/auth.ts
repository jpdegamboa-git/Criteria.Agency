import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";
import { config } from "../shared/config.js";

/**
 * Session-based authentication middleware (Better Auth).
 * Also accepts API key via Authorization header or X-API-Key for CLI/scripts.
 *
 * Priority:
 * 1. Better Auth session cookie → user context
 * 2. API key (ADMIN_API_KEY) → admin access
 * 3. Dev mode (no ADMIN_API_KEY set + no BETTER_AUTH_SECRET) → allow all
 */
export const requireSession = createMiddleware(async (c, next) => {
  // 1. Check for Better Auth session
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
    return;
  }

  // 2. Fallback: API key auth (for CLI, scripts, cron)
  const adminKey = config.adminApiKey;
  if (adminKey) {
    const authHeader = c.req.header("Authorization");
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (scheme === "Bearer" && token === adminKey) {
        await next();
        return;
      }
    }
    const apiKeyHeader = c.req.header("X-API-Key");
    if (apiKeyHeader === adminKey) {
      await next();
      return;
    }
  }

  // 3. Dev mode — no auth configured, allow all
  if (!adminKey && config.betterAuthSecret === "dev-secret-change-in-production") {
    await next();
    return;
  }

  return c.json({ error: "Unauthorized" }, 401);
});

/**
 * Role-based access control middleware.
 * Must be used AFTER requireSession.
 * API key auth bypasses role check (already trusted).
 */
export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user") as { role?: string } | undefined;

  // API key auth and dev mode don't set user — they're already trusted
  if (!user) {
    await next();
    return;
  }

  if (user.role !== "admin") {
    return c.json({ error: "Forbidden: admin role required" }, 403);
  }

  await next();
});
