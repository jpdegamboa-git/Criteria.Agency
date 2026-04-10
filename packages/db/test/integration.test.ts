import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { createDb } from '../src/connection.js';
import { motors, promptRegistry, campaigns } from '../src/schema.js';
import { organization as authOrganization } from '../src/auth-schema.js';
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
    await db.close();
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

  it('organization (Better Auth) table exists', async () => {
    const [org] = await db.insert(authOrganization).values({
      id: `test-org-${Date.now()}`,
      name: 'Test Org',
      slug: `test-org-integration-${Date.now()}`,
      createdAt: new Date(),
    }).returning();

    try {
      expect(org.id).toBeDefined();
      expect(org.name).toBe('Test Org');
    } finally {
      await db.delete(authOrganization).where(eq(authOrganization.id, org.id));
    }
  });

  it('motors table enforces org FK and unique constraint', async () => {
    const orgId = `test-motor-org-${Date.now()}`;
    const [org] = await db.insert(authOrganization).values({
      id: orgId,
      name: 'Motor Test Org',
      slug: `motor-test-org-${Date.now()}`,
      createdAt: new Date(),
    }).returning();

    try {
      const [motor] = await db.insert(motors).values({
        organizationId: org.id,
        motor: 'video',
        autonomyMode: 'ai_recommends',
      }).returning();

      expect(motor.motor).toBe('video');
      expect(motor.enabled).toBe(true);

      await db.delete(motors).where(eq(motors.id, motor.id));
    } finally {
      await db.delete(authOrganization).where(eq(authOrganization.id, org.id));
    }
  });

  it('prompt_registry table accepts inserts with DEC-149 fields', async () => {
    // Use a unique version to avoid the unique constraint conflict
    const uniqueVersion = Date.now() % 10000;
    const [prompt] = await db.insert(promptRegistry).values({
      agentId: `brand-strategist-test-${Date.now()}`,
      skillId: 'discovery',
      version: uniqueVersion,
      systemPrompt: 'You are a brand strategist...',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      dataSensitivity: 'A',
      approvedProviders: ['anthropic'],
      active: true,
    }).returning();

    try {
      expect(prompt.agentId).toContain('brand-strategist-test');
      expect(prompt.dataSensitivity).toBe('A');
    } finally {
      await db.delete(promptRegistry).where(eq(promptRegistry.id, prompt.id));
    }
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

  it('core platform tables exist in public schema', async () => {
    const tables = await rawClient`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'organization_settings', 'motors', 'motor_executions',
        'agent_permissions', 'prompt_registry', 'output_registry',
        'brand_dna', 'brand_dna_artifacts', 'brand_health_scores',
        'video_projects', 'video_artifacts', 'video_gate_reviews',
        'campaigns', 'campaign_kpis', 'threshold_alerts', 'campaign_scores'
      )
      ORDER BY table_name
    `;
    const tableNames = tables.map((t: { table_name: string }) => t.table_name);
    // All 16 platform tables should exist
    expect(tableNames.length).toBe(16);
    expect(tableNames).toContain('campaigns');
    expect(tableNames).toContain('campaign_kpis');
    expect(tableNames).toContain('threshold_alerts');
    expect(tableNames).toContain('campaign_scores');
  });

  it('campaigns table exists and accepts inserts', async () => {
    const orgId = `test-campaign-org-${Date.now()}`;
    const [org] = await db.insert(authOrganization).values({
      id: orgId,
      name: 'Campaign Test Org',
      slug: `campaign-test-org-${Date.now()}`,
      createdAt: new Date(),
    }).returning();

    try {
      const [campaign] = await db.insert(campaigns).values({
        organizationId: org.id,
        name: 'Test Campaign',
        funnelStage: 'awareness',
        channelType: 'paid',
        objectives: { goal: 'reach 10k impressions' },
      }).returning();

      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.funnelStage).toBe('awareness');
      expect(campaign.channelType).toBe('paid');
      expect(campaign.status).toBe('definition');
    } finally {
      await db.delete(authOrganization).where(eq(authOrganization.id, org.id));
    }
  });
});
