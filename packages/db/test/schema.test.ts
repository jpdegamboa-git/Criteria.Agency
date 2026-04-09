import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';

describe('db connection module', () => {
  it('exports createDb function', async () => {
    const mod = await import('../src/connection.js');
    expect(typeof mod.createDb).toBe('function');
  });
});

describe('schema exports', () => {
  it('exports all 6 tables', async () => {
    const schema = await import('../src/schema.js');
    expect(schema.organizations).toBeDefined();
    expect(schema.motors).toBeDefined();
    expect(schema.motorExecutions).toBeDefined();
    expect(schema.agentPermissions).toBeDefined();
    expect(schema.promptRegistry).toBeDefined();
    expect(schema.outputRegistry).toBeDefined();
  });

  it('tables have correct SQL names', async () => {
    const schema = await import('../src/schema.js');
    expect(getTableName(schema.organizations)).toBe('organizations');
    expect(getTableName(schema.motors)).toBe('motors');
    expect(getTableName(schema.motorExecutions)).toBe('motor_executions');
    expect(getTableName(schema.agentPermissions)).toBe('agent_permissions');
    expect(getTableName(schema.promptRegistry)).toBe('prompt_registry');
    expect(getTableName(schema.outputRegistry)).toBe('output_registry');
  });

  it('exports relation definitions', async () => {
    const schema = await import('../src/schema.js');
    expect(schema.organizationsRelations).toBeDefined();
    expect(schema.motorsRelations).toBeDefined();
    expect(schema.motorExecutionsRelations).toBeDefined();
    expect(schema.outputRegistryRelations).toBeDefined();
  });
});
