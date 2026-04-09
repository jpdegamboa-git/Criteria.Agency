import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { createDb } from '../src/connection.js';
import { organizations, motors, motorExecutions, agentPermissions, promptRegistry, outputRegistry } from '../src/schema.js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('database integration', () => {
  let db: ReturnType<typeof createDb>;
  let rawClient: ReturnType<typeof postgres>;

  beforeAll(() => {
    db = createDb(DATABASE_URL!);
    rawClient = postgres(DATABASE_URL!);
  });

  afterAll(async () => {
    await rawClient.end();
  });

  it('connects to PostgreSQL', async () => {
    const result = await db.execute(sql`SELECT 1 as connected`);
    expect(result).toBeDefined();
  });

  it('has pgvector extension enabled', async () => {
    const result = await rawClient`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
    expect(result.length).toBe(1);
    expect(result[0].extname).toBe('vector');
  });

  it('organizations table exists and accepts inserts', async () => {
    const [org] = await db.insert(organizations).values({
      name: 'Test Org',
      slug: 'test-org-integration',
      plan: 'starter',
    }).returning();

    expect(org.id).toBeDefined();
    expect(org.name).toBe('Test Org');
    expect(org.slug).toBe('test-org-integration');
    expect(org.plan).toBe('starter');

    // Cleanup
    await db.delete(organizations).where(eq(organizations.id, org.id));
  });

  it('motors table enforces org FK and unique constraint', async () => {
    const [org] = await db.insert(organizations).values({
      name: 'Motor Test Org',
      slug: 'motor-test-org',
    }).returning();

    const [motor] = await db.insert(motors).values({
      organizationId: org.id,
      motor: 'video',
      autonomyMode: 'ai_recommends',
    }).returning();

    expect(motor.motor).toBe('video');
    expect(motor.enabled).toBe(true);

    // Cleanup
    await db.delete(motors).where(eq(motors.id, motor.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));
  });

  it('prompt_registry table accepts inserts with DEC-149 fields', async () => {
    const [prompt] = await db.insert(promptRegistry).values({
      agentId: 'brand-strategist',
      skillId: 'discovery',
      version: 1,
      systemPrompt: 'You are a brand strategist...',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      dataSensitivity: 'A',
      approvedProviders: ['anthropic'],
      active: true,
    }).returning();

    expect(prompt.agentId).toBe('brand-strategist');
    expect(prompt.dataSensitivity).toBe('A');

    // Cleanup
    await db.delete(promptRegistry).where(eq(promptRegistry.id, prompt.id));
  });

  it('output_registry table has vector column', async () => {
    const columns = await rawClient`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'output_registry' AND column_name = 'summary_embedding'
    `;
    expect(columns.length).toBe(1);
    expect(columns[0].udt_name).toBe('vector');
  });

  it('all 6 tables exist', async () => {
    const tables = await rawClient`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('organizations', 'motors', 'motor_executions', 'agent_permissions', 'prompt_registry', 'output_registry')
      ORDER BY table_name
    `;
    const tableNames = tables.map((t: { table_name: string }) => t.table_name);
    expect(tableNames).toEqual([
      'agent_permissions',
      'motor_executions',
      'motors',
      'organizations',
      'output_registry',
      'prompt_registry',
    ]);
  });
});
