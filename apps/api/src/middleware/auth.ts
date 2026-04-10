/**
 * Auth middleware — Step 0.4
 *
 * Extracts tenant (orgId) from authenticated session and injects into
 * Hono request context. Protected routes require both:
 * 1. Valid session (authenticated user)
 * 2. Active organization (tenant context)
 *
 * Public routes (/health, /api/auth/*) skip this middleware.
 */
import type { Context, MiddlewareHandler } from 'hono';
import type { Auth } from '../lib/auth.js';

export type AuthContext = {
  userId: string;
  tenantId: string;
  session: {
    id: string;
    userId: string;
    activeOrganizationId: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
};

/**
 * Creates auth middleware that validates sessions and extracts tenant context.
 * Must be applied to protected routes only.
 */
export function authMiddleware(auth: Auth): MiddlewareHandler {
  return async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const activeOrgId = session.session.activeOrganizationId;
    if (!activeOrgId) {
      return c.json({ error: 'No active organization' }, 403);
    }

    // Inject auth context into Hono's request context
    c.set('auth', {
      userId: session.user.id,
      tenantId: activeOrgId,
      session: {
        id: session.session.id,
        userId: session.session.userId,
        activeOrganizationId: activeOrgId,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    } satisfies AuthContext);

    await next();
  };
}

/**
 * Helper to extract auth context from Hono request.
 * Use in route handlers after authMiddleware.
 */
export function getAuthContext(c: Context): AuthContext {
  return c.get('auth') as AuthContext;
}
