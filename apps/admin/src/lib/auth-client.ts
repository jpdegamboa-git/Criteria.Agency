/**
 * Better Auth client — Admin Portal
 *
 * Configured to talk to the Hono API auth endpoints.
 * The API is proxied via Next.js rewrites (/api/* → localhost:3001/api/*).
 */
import { createAuthClient } from 'better-auth/client';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  plugins: [organizationClient()],
});

export type Session = typeof authClient.$Infer.Session;
