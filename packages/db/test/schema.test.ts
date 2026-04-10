import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';

describe('db connection module', () => {
  it('exports createDb function', async () => {
    const mod = await import('../src/connection.js');
    expect(typeof mod.createDb).toBe('function');
  });
});

describe('schema exports', () => {
  it('exports core platform tables', async () => {
    const schema = await import('../src/schema.js');
    // Fase 0 tables
    expect(schema.organizationSettings).toBeDefined();
    expect(schema.motors).toBeDefined();
    expect(schema.motorExecutions).toBeDefined();
    expect(schema.agentPermissions).toBeDefined();
    expect(schema.promptRegistry).toBeDefined();
    expect(schema.outputRegistry).toBeDefined();
  });

  it('exports Brand Builder tables (Fase 1)', async () => {
    const schema = await import('../src/schema.js');
    expect(schema.brandDna).toBeDefined();
    expect(schema.brandDnaArtifacts).toBeDefined();
    expect(schema.brandHealthScores).toBeDefined();
  });

  it('exports Video Motor tables (Fase 2)', async () => {
    const schema = await import('../src/schema.js');
    expect(schema.videoProjects).toBeDefined();
    expect(schema.videoArtifacts).toBeDefined();
    expect(schema.videoGateReviews).toBeDefined();
  });

  it('exports Analyst tables (Fase 3)', async () => {
    const schema = await import('../src/schema.js');
    expect(schema.campaigns).toBeDefined();
    expect(schema.campaignKpis).toBeDefined();
    expect(schema.thresholdAlerts).toBeDefined();
    expect(schema.campaignScores).toBeDefined();
  });

  it('tables have correct SQL names', async () => {
    const schema = await import('../src/schema.js');
    expect(getTableName(schema.organizationSettings)).toBe('organization_settings');
    expect(getTableName(schema.motors)).toBe('motors');
    expect(getTableName(schema.motorExecutions)).toBe('motor_executions');
    expect(getTableName(schema.agentPermissions)).toBe('agent_permissions');
    expect(getTableName(schema.promptRegistry)).toBe('prompt_registry');
    expect(getTableName(schema.outputRegistry)).toBe('output_registry');
    expect(getTableName(schema.brandDna)).toBe('brand_dna');
    expect(getTableName(schema.campaigns)).toBe('campaigns');
    expect(getTableName(schema.campaignKpis)).toBe('campaign_kpis');
    expect(getTableName(schema.thresholdAlerts)).toBe('threshold_alerts');
    expect(getTableName(schema.campaignScores)).toBe('campaign_scores');
  });

  it('exports relation definitions', async () => {
    const schema = await import('../src/schema.js');
    expect(schema.organizationSettingsRelations).toBeDefined();
    expect(schema.motorsRelations).toBeDefined();
    expect(schema.motorExecutionsRelations).toBeDefined();
    expect(schema.outputRegistryRelations).toBeDefined();
    expect(schema.campaignsRelations).toBeDefined();
    expect(schema.campaignKpisRelations).toBeDefined();
    expect(schema.thresholdAlertsRelations).toBeDefined();
    expect(schema.campaignScoresRelations).toBeDefined();
  });
});
