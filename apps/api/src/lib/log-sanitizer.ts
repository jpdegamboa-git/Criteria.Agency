/**
 * Log sanitization — Step 7.4 (Security Framework §11.2 P1-4)
 *
 * Redacts sensitive values from log objects before they reach pino.
 * Prevents API keys, passwords, tokens, and PII from appearing in logs.
 *
 * Used as pino serializers + exported as a standalone sanitize() function
 * for manual use in error handlers.
 */

// Patterns that indicate a field contains sensitive data
const SENSITIVE_KEY_PATTERNS = [
  /key/i,
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /auth/i,
  /credential/i,
  /api_key/i,
  /apikey/i,
  /access_key/i,
  /private/i,
  /signing/i,
] as const;

// Patterns that indicate a VALUE is a secret (regardless of key name)
const SENSITIVE_VALUE_PATTERNS = [
  /^sk-ant-/i,          // Anthropic API key
  /^sk-lf-/i,           // Langfuse secret key
  /^pk-lf-/i,           // Langfuse public key
  /^AIza/,              // Google AI API key
  /^Bearer\s+/i,        // Authorization header value
  /^Basic\s+/i,         // Basic auth header value
  /^ey[A-Za-z0-9_-]{10,}/, // JWT tokens
] as const;

const REDACTED = '[REDACTED]';

/**
 * Check if a key name suggests it contains sensitive data.
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));
}

/**
 * Check if a string value looks like a secret.
 */
function isSensitiveValue(value: string): boolean {
  return SENSITIVE_VALUE_PATTERNS.some((p) => p.test(value));
}

/**
 * Sanitize a log object by redacting sensitive fields.
 * Performs a shallow walk of the top-level keys.
 */
export function sanitizeLogObject(obj: unknown, depth = 0): unknown {
  if (depth > 3) return obj; // prevent deep recursion on complex objects
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return isSensitiveValue(obj) ? REDACTED : obj;
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLogObject(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = REDACTED;
    } else if (typeof value === 'string' && isSensitiveValue(value)) {
      sanitized[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Pino serializers that redact sensitive fields.
 * Pass to pino({ serializers }) config.
 */
export const sanitizingSerializers = {
  req: (req: Record<string, unknown>) => sanitizeLogObject(req),
  res: (res: Record<string, unknown>) => sanitizeLogObject(res),
  err: (err: unknown) => {
    if (err instanceof Error) {
      return {
        type: err.constructor.name,
        message: err.message,
        // Never log the full stack in production — too much info exposure
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      };
    }
    return sanitizeLogObject(err);
  },
};

/**
 * Sanitize an error for client response.
 * Never expose stack traces or internal details externally.
 */
export function sanitizeErrorForClient(err: unknown): { error: string } {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Internal server error' };
  }
  // In development, expose the message (not the stack)
  if (err instanceof Error) {
    return { error: err.message };
  }
  return { error: 'Unknown error' };
}
