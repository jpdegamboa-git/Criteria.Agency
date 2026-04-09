import { describe, it, expect } from 'vitest';
import { logger } from '../src/lib/logger.js';

describe('logger', () => {
  it('exports a pino logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('has name set to criteria-api', () => {
    const bindings = logger.bindings();
    expect(bindings.name).toBe('criteria-api');
  });
});
