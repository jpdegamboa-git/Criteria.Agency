import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { type Database, authSchema } from '@criteria/db';

/**
 * Better Auth configuration for criteria.agency.
 *
 * Step 0.3 POC — validates multi-org support with Hono + Drizzle.
 * See: BUILD_ORDER.md Step 0.3, Security Framework §8.
 *
 * Better Auth manages its own tables: user, session, account, verification,
 * organization, member, invitation. Schema defined in packages/db/src/auth-schema.ts.
 */
export function createAuth(db: Database) {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
    basePath: '/api/auth',
    trustedOrigins: [process.env.APP_URL ?? 'http://localhost:3000'],

    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: authSchema,
    }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,  // 7 days (Security Framework §8.2: refresh token TTL)
      updateAge: 60 * 60 * 24,       // refresh after 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,              // 5-minute cache
      },
    },

    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'strict' as const,   // Security Framework §8.2
      },
    },

    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        creatorRole: 'owner',
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
