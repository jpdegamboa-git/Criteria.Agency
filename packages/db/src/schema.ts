import {
  pgTable,
  uuid,
  varchar,
  boolean,
  jsonb,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// organizations — tenant unit (billing, data isolation, teams)
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  plan: varchar('plan', { length: 20 }).notNull().default('starter'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// motors — motor configurations per tenant
export const motors = pgTable('motors', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  motor: varchar('motor', { length: 50 }).notNull(),
  enabled: boolean('enabled').notNull().default(true),
  autonomyMode: varchar('autonomy_mode', { length: 20 }).notNull().default('ai_recommends'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('motors_org_motor_idx').on(table.organizationId, table.motor),
]);

// motor_executions — audit trail of motor-level invocations
export const motorExecutions = pgTable('motor_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  motor: varchar('motor', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  triggeredBy: varchar('triggered_by', { length: 50 }).notNull(),
  inngestEventId: varchar('inngest_event_id', { length: 255 }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata').notNull().default({}),
  error: text('error'),
}, (table) => [
  index('motor_exec_org_idx').on(table.organizationId),
  index('motor_exec_motor_status_idx').on(table.motor, table.status),
]);

// agent_permissions — declarative permissions per agent
export const agentPermissions = pgTable('agent_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: varchar('agent_id', { length: 50 }).notNull(),
  permission: varchar('permission', { length: 100 }).notNull(),
  scope: varchar('scope', { length: 50 }).notNull().default('motor'),
  constraints: jsonb('constraints').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('agent_perm_agent_perm_idx').on(table.agentId, table.permission),
]);

// prompt_registry — versioned system prompts per agent x skill (DEC-145)
export const promptRegistry = pgTable('prompt_registry', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: varchar('agent_id', { length: 50 }).notNull(),
  skillId: varchar('skill_id', { length: 50 }).notNull(),
  version: integer('version').notNull().default(1),
  systemPrompt: text('system_prompt').notNull(),
  knowledgeBaseRef: text('knowledge_base_ref'),
  model: varchar('model', { length: 100 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  dataSensitivity: varchar('data_sensitivity', { length: 10 }).notNull().default('C'),
  approvedProviders: jsonb('approved_providers').notNull().default(['anthropic']),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('prompt_reg_agent_skill_ver_idx').on(table.agentId, table.skillId, table.version),
  index('prompt_reg_agent_skill_active_idx').on(table.agentId, table.skillId, table.active),
]);

// output_registry — semantic search over agent outputs (DEC-130, pgvector)
// Summary-only embeddings per DEC-151
export const outputRegistry = pgTable('output_registry', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  sourceMotor: varchar('source_motor', { length: 50 }).notNull(),
  sourceAgentId: varchar('source_agent_id', { length: 50 }),
  outputType: varchar('output_type', { length: 50 }).notNull(),
  contentRef: uuid('content_ref').notNull(),
  summary: text('summary').notNull(),
  summaryEmbedding: vector('summary_embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('output_reg_org_idx').on(table.organizationId),
  index('output_reg_org_motor_idx').on(table.organizationId, table.sourceMotor),
  index('output_reg_type_idx').on(table.outputType),
]);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  motors: many(motors),
  motorExecutions: many(motorExecutions),
  outputRegistry: many(outputRegistry),
}));

export const motorsRelations = relations(motors, ({ one }) => ({
  organization: one(organizations, {
    fields: [motors.organizationId],
    references: [organizations.id],
  }),
}));

export const motorExecutionsRelations = relations(motorExecutions, ({ one }) => ({
  organization: one(organizations, {
    fields: [motorExecutions.organizationId],
    references: [organizations.id],
  }),
}));

export const outputRegistryRelations = relations(outputRegistry, ({ one }) => ({
  organization: one(organizations, {
    fields: [outputRegistry.organizationId],
    references: [organizations.id],
  }),
}));
