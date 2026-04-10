/**
 * Startup environment validation — Step 7.1
 *
 * Fails fast if required environment variables are missing in production.
 * Prevents silent misconfigurations that would only surface at runtime.
 *
 * Call this before starting the server. In development (NODE_ENV !== 'production')
 * missing vars emit warnings rather than hard failures, to ease local setup.
 */

const REQUIRED_ALWAYS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
] as const;

const REQUIRED_IN_PRODUCTION = [
  'ANTHROPIC_API_KEY',
  'INNGEST_SIGNING_KEY',
  'LANGFUSE_PUBLIC_KEY',
  'LANGFUSE_SECRET_KEY',
  'APP_URL',
] as const;

const FORBIDDEN_IN_PRODUCTION = [
  'INNGEST_DEV', // Must NOT be set in production — disables Inngest signature verification
] as const;

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // Always required
  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key]) {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  // Required in production
  for (const key of REQUIRED_IN_PRODUCTION) {
    if (!process.env[key]) {
      if (isProd) {
        errors.push(`Missing required env var for production: ${key}`);
      } else {
        warnings.push(`Missing env var (optional in dev): ${key}`);
      }
    }
  }

  // Forbidden in production
  for (const key of FORBIDDEN_IN_PRODUCTION) {
    if (process.env[key] && isProd) {
      errors.push(`Env var ${key} must NOT be set in production — it disables security`);
    }
  }

  // BETTER_AUTH_SECRET must be ≥ 32 chars
  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    errors.push('BETTER_AUTH_SECRET must be at least 32 characters');
  }

  // Warn about dev-only secret in production
  if (isProd && authSecret?.includes('dev')) {
    errors.push('BETTER_AUTH_SECRET appears to be a development secret — rotate before production');
  }

  // Emit
  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(`[env-validation] WARN: ${w}`);
    }
  }

  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`[env-validation] ERROR: ${e}`);
    }
    throw new Error(
      `Environment validation failed with ${errors.length} error(s). Fix before starting.`,
    );
  }
}
