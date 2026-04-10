/**
 * First Inngest function — Step 0.6
 *
 * Validates the Inngest → Zod → tenant verification → DB pipeline.
 * This function will be replaced by real motor functions in Fase 1+.
 *
 * DEC-148 requirements:
 * 1. Validate event schema with Zod (first step)
 * 2. Verify tenantId against DB (second step)
 * 3. Never store sensitive data in step state — pass IDs only
 */
import { z } from 'zod';
import { inngest } from '../client.js';
import { eq, organizationSettings } from '@criteria/db';
import type { Database } from '@criteria/db';

const eventSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  message: z.string().min(1, 'message is required'),
});

/**
 * Creates the test/hello.world Inngest function.
 * Accepts db externally for testability (same pattern as routes).
 */
export function createTestHelloWorldFn(db: Database) {
  return inngest.createFunction(
    {
      id: 'test-hello-world',
      retries: 1,
      triggers: [{ event: 'test/hello.world' as const }],
    },
    async ({ event, step }) => {
      // Step 1: Validate event schema with Zod (DEC-148)
      const validated = await step.run('validate-schema', () => {
        const result = eventSchema.safeParse(event.data);
        if (!result.success) {
          throw new Error(`Invalid event schema: ${result.error.message}`);
        }
        return { tenantId: result.data.tenantId, message: result.data.message };
      });

      // Step 2: Verify tenantId exists in DB (DEC-148)
      await step.run('verify-tenant', async () => {
        const [tenant] = await db
          .select({ organizationId: organizationSettings.organizationId })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, validated.tenantId))
          .limit(1);

        if (!tenant) {
          throw new Error(`Tenant not found: ${validated.tenantId}`);
        }
      });

      // Step 3: Do work (placeholder — in real functions this invokes agents)
      const result = await step.run('process', () => {
        return {
          processed: true,
          tenantId: validated.tenantId,
          echo: validated.message,
          timestamp: new Date().toISOString(),
        };
      });

      return result;
    },
  );
}
