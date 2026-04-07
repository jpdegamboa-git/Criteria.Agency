import { createMiddleware } from "hono/factory";
import { config } from "../shared/config.js";

/**
 * Simple API key authentication middleware.
 * Checks for a valid API key in the Authorization header (Bearer token)
 * or in the X-API-Key header.
 *
 * Set ADMIN_API_KEY in .env to enable. If not set, all requests are allowed
 * (development mode).
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const adminKey = config.adminApiKey;

  // Development mode — no key configured, allow all
  if (!adminKey) {
    await next();
    return;
  }

  // Check Authorization: Bearer <key>
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token === adminKey) {
      await next();
      return;
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = c.req.header("X-API-Key");
  if (apiKeyHeader === adminKey) {
    await next();
    return;
  }

  return c.json({ error: "Unauthorized" }, 401);
});
