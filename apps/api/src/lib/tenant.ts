/**
 * Tenant isolation — Step 0.4
 *
 * Every Drizzle query on tenant-scoped tables MUST filter by organizationId.
 *
 * Pattern:
 *   import { eq, motors } from '@criteria/db';
 *   db.select().from(motors).where(eq(motors.organizationId, tenantId))
 *
 * Always use `eq`/`and` from @criteria/db (re-exported from drizzle-orm)
 * to avoid duplicate-instance type conflicts.
 */
