/**
 * Admin schema for Next.js server components.
 * IMPORTANT: Keep in sync with src/db/schema.ts.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  numeric,
  index,
} from "drizzle-orm/pg-core";

// ── Enums ──

export const projectTypeEnum = pgEnum("project_type", [
  "corporate", "explainer", "documentary", "fiction", "micro_content", "commercial",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish", "delivered", "paused",
]);

export const gateTypeEnum = pgEnum("gate_type", ["g1", "g2", "g3", "g4", "g5"]);
export const gateDecisionEnum = pgEnum("gate_decision", ["pass", "fail"]);

export const artifactStepEnum = pgEnum("artifact_step", [
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish", "delivery", "model_config", "gate_review",
]);

export const artifactTypeEnum = pgEnum("artifact_type", [
  "document", "image", "video", "audio", "subtitle", "package",
]);

export const executionStatusEnum = pgEnum("execution_status", [
  "running", "completed", "failed",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "draft", "delivered", "in_review", "revision_requested", "approved",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", ["starter", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing", "active", "past_due", "canceled",
]);

// ── Tables ──

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  subscriptionTier: subscriptionTierEnum("subscription_tier"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: projectTypeEnum("type").notNull(),
  status: projectStatusEnum("status").default("brief").notNull(),
  currentGate: gateTypeEnum("current_gate"),
  deliveryStatus: deliveryStatusEnum("delivery_status").default("draft").notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("projects_client_id_idx").on(table.clientId),
]);

export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  step: artifactStepEnum("step").notNull(),
  type: artifactTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  version: integer("version").default(1).notNull(),
  storagePath: text("storage_path").notNull(),
  createdByAgent: varchar("created_by_agent", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("artifacts_project_id_idx").on(table.projectId),
]);

export const gateReviews = pgTable("gate_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  gate: gateTypeEnum("gate").notNull(),
  iteration: integer("iteration").default(1).notNull(),
  decision: gateDecisionEnum("decision").notNull(),
  reviewer: varchar("reviewer", { length: 20 }).notNull(),
  scores: jsonb("scores").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentExecutions = pgTable("agent_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  agentId: varchar("agent_id", { length: 20 }).notNull(),
  step: varchar("step", { length: 50 }).notNull(),
  attempt: integer("attempt").default(1).notNull(),
  status: executionStatusEnum("status").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  cost: jsonb("cost").default({}),
  error: text("error"),
});

// ── Financial Tables ──

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income", "expense", "transfer", "fee",
]);

export const transactionSourceEnum = pgEnum("transaction_source", [
  "csv_import", "conexion_bg", "stripe", "manual",
]);

export const expectedPaymentStatusEnum = pgEnum("expected_payment_status", [
  "pending", "reconciled", "overdue", "canceled",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "client", "vendor", "personal", "bank", "government", "unknown",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: varchar("bank_account_id", { length: 50 }).default("main").notNull(),
  externalId: varchar("external_id", { length: 255 }).unique(),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  description: text("description").notNull(),
  counterpartyName: varchar("counterparty_name", { length: 255 }),
  category: varchar("category", { length: 50 }),
  subcategory: varchar("subcategory", { length: 50 }),
  type: transactionTypeEnum("type"),
  source: transactionSourceEnum("source").notNull(),
  reconciled: integer("reconciled").default(0).notNull(),
  reconciledWithId: uuid("reconciled_with_id"),
  clientId: uuid("client_id").references(() => clients.id),
  entityId: uuid("entity_id"),
  parentTransactionId: uuid("parent_transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("transactions_date_idx").on(table.date),
  index("transactions_category_idx").on(table.category),
]);

export const expectedPayments = pgTable("expected_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: expectedPaymentStatusEnum("status").default("pending").notNull(),
  reconciledTransactionId: uuid("reconciled_transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("expected_payments_status_idx").on(table.status),
]);

export const businessEntities = pgTable("business_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: entityTypeEnum("type").default("unknown").notNull(),
  defaultCategory: varchar("default_category", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Agent Canvas ──

export const connectionTypeEnum = pgEnum("connection_type", [
  "pipeline",
  "manual",
]);

export const agentConnections = pgTable("agent_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceAgentId: varchar("source_agent_id", { length: 20 }).notNull(),
  targetAgentId: varchar("target_agent_id", { length: 20 }).notNull(),
  type: connectionTypeEnum("type").default("pipeline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("agent_connections_source_idx").on(table.sourceAgentId),
  index("agent_connections_target_idx").on(table.targetAgentId),
]);

export const agentNodePositions = pgTable("agent_node_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: varchar("agent_id", { length: 20 }).notNull().unique(),
  x: numeric("x", { precision: 10, scale: 2 }).default("0").notNull(),
  y: numeric("y", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
