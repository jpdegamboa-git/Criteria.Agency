import { describe, it, expect } from 'vitest';

describe('db connection module', () => {
  it('exports createDb function', async () => {
    const mod = await import('../src/connection.js');
    expect(typeof mod.createDb).toBe('function');
  });
});
