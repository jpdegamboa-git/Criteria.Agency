import type { MiddlewareHandler } from 'hono';

/**
 * Security headers per Security Framework spec §4.1.
 * See: docs/superpowers/specs/2026-04-06-security-framework-design.md
 */
export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next();

    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://storage.criteria.agency; connect-src 'self' https://api.criteria.agency",
    );
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Remove X-Powered-By if present (§4.1: "Don't reveal stack")
    c.res.headers.delete('X-Powered-By');
  };
}
