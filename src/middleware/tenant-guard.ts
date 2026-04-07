import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";

/**
 * Tenant guard middleware — enforces multi-tenant data isolation.
 *
 * Must be used AFTER requireSession.
 *
 * Flow:
 * 1. If no user in context (API key auth or dev mode) → trusted, pass through
 * 2. If user is admin → pass through (admins can access any tenant)
 * 3. Look up the client by user email to resolve tenantId
 * 4. Store tenantId in Hono context
 * 5. If route has :clientId param, verify it matches the user's tenantId
 *    → mismatch returns 403
 */
export const requireTenantMatch = createMiddleware(async (c, next) => {
  const user = c.get("user") as { id: string; email: string; role?: string } | undefined;

  // No user in context → API key auth or dev mode, trusted
  if (!user) {
    await next();
    return;
  }

  // Admin users bypass tenant check
  if (user.role === "admin") {
    await next();
    return;
  }

  // Resolve tenantId by looking up client via user email
  const [client] = await db
    .select({ id: schema.clients.id })
    .from(schema.clients)
    .where(eq(schema.clients.email, user.email))
    .limit(1);

  const tenantId = client?.id ?? null;

  // Store tenantId in context for downstream use
  if (tenantId) {
    c.set("tenantId", tenantId);
  }

  // Check :clientId route param if present
  const routeClientId = c.req.param("clientId") as string | undefined;

  if (routeClientId) {
    if (!tenantId || tenantId !== routeClientId) {
      return c.json({ error: "Forbidden: tenant mismatch" }, 403);
    }
  }

  await next();
});
