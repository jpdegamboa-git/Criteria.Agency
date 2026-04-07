import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";
import { config } from "../shared/config.js";

// Synthetic user set in context when API key auth succeeds.
const API_KEY_ADMIN_USER = { id: "api-key", role: "admin", name: "API Key" } as const;

/**
 * Session-based authentication middleware (Better Auth).
 * Also accepts API key via Authorization header or X-API-Key for CLI/scripts.
 *
 * Priority:
 * 1. Better Auth session cookie → user context
 * 2. API key (ADMIN_API_KEY) → synthetic admin user context
 * 3. Explicit dev bypass (SKIP_AUTH=true env var) → allow all
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
        c.set("user", API_KEY_ADMIN_USER);
        await next();
        return;
      }
    }
    const apiKeyHeader = c.req.header("X-API-Key");
    if (apiKeyHeader === adminKey) {
      c.set("user", API_KEY_ADMIN_USER);
      await next();
      return;
    }
  }

  // 3. Explicit dev bypass — only when SKIP_AUTH=true is set in the environment
  if (config.skipAuth) {
    c.set("user", API_KEY_ADMIN_USER);
    await next();
    return;
  }

  return c.json({ error: "Unauthorized" }, 401);
});

/**
 * Role-based access control middleware.
 * Must be used AFTER requireSession.
 */
export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user") as { role?: string } | undefined;

  // No user in context — deny. requireSession must run first.
  if (!user) {
    return c.json({ error: "Forbidden: no user context" }, 403);
  }

  if (user.role !== "admin") {
    return c.json({ error: "Forbidden: admin role required" }, 403);
  }

  await next();
});
