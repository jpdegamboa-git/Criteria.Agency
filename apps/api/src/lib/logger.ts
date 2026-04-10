import pino from 'pino';
import { sanitizingSerializers } from './log-sanitizer.js';

export const logger = pino({
  name: 'criteria-api',
  level: process.env.LOG_LEVEL ?? 'info',
  // Redact sensitive fields from all log output (Step 7.4)
  serializers: sanitizingSerializers,
  // Never log stack traces in production — use sanitizingSerializers.err
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      '*.password',
      '*.apiKey',
      '*.api_key',
      '*.secret',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});
