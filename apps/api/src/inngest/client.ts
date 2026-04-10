/**
 * Inngest client — Step 0.6
 *
 * Single Inngest client instance for the entire API.
 * All functions are registered through this client.
 *
 * DEC-140: Inngest replaces custom state machines + BullMQ.
 * DEC-148: Signing key required in production for webhook HMAC-SHA256 verification.
 */
import { Inngest, eventType } from 'inngest';
import { z } from 'zod';

/**
 * Event type definitions for the platform.
 * Each motor will add its own events here as they're built.
 */
const testEvent = eventType('test/hello.world', {
  schema: z.object({
    tenantId: z.string().min(1),
    message: z.string().min(1),
  }),
});

export const inngest = new Inngest({
  id: 'criteria-agency',
  eventTypes: [testEvent],
});
