/**
 * Motors routes — Step 0.4
 *
 * First protected routes on the platform. Demonstrates:
 * - Auth middleware enforcement
 * - Tenant isolation on all queries
 *
 * All routes require authentication + active organization.
 */
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { motors } from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';

export function createMotorsRoute(db: Database) {
  const route = new Hono();

  // GET / — list motors for the authenticated tenant
  route.get('/', async (c) => {
    const { tenantId } = getAuthContext(c);
    const results = await db
      .select()
      .from(motors)
      .where(eq(motors.organizationId, tenantId));
    return c.json(results);
  });

  // POST / — create a motor config for the authenticated tenant
  route.post('/', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json<{ motor: string; enabled?: boolean }>();

    const [created] = await db
      .insert(motors)
      .values({
        organizationId: tenantId,
        motor: body.motor,
        enabled: body.enabled ?? true,
      })
      .returning();

    return c.json(created, 201);
  });

  return route;
}
