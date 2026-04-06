import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";

// ── Enums ──

export const projectTypeEnum = pgEnum("project_type", [
  "corporate",
  "explainer",
  "documentary",
  "fiction",
  "micro_content",
  "commercial",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivered",
  "paused",
]);

export const gateTypeEnum = pgEnum("gate_type", [
  "g1",
  "g2",
  "g3",
  "g4",
  "g5",
]);

export const gateDecisionEnum = pgEnum("gate_decision", ["pass", "fail"]);

export const artifactStepEnum = pgEnum("artifact_step", [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivery",
  "model_config",
  "gate_review",
]);

export const artifactTypeEnum = pgEnum("artifact_type", [
  "document",
  "image",
  "video",
  "audio",
  "subtitle",
  "package",
]);

export const executionStatusEnum = pgEnum("execution_status", [
  "running",
  "completed",
  "failed",
]);

export const taskTypeEnum = pgEnum("task_type", [
  "text_gen",
  "image_gen",
  "video_gen",
  "audio_voice",
  "audio_music",
  "audio_sfx",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "draft",
  "delivered",
  "in_review",
  "revision_requested",
  "approved",
]);

export const commentAuthorEnum = pgEnum("comment_author", [
  "client",
  "criteria",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "starter",
  "pro",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
  "fee",
]);

export const transactionSourceEnum = pgEnum("transaction_source", [
  "csv_import",
  "conexion_bg",
  "stripe",
  "manual",
]);

export const expectedPaymentStatusEnum = pgEnum("expected_payment_status", [
  "pending",
  "reconciled",
  "overdue",
  "canceled",
]);

export const ruleMatchTypeEnum = pgEnum("rule_match_type", [
  "contains",
  "exact",
  "regex",
]);

export const ruleSourceEnum = pgEnum("rule_source", ["auto", "manual"]);

export const syncStatusEnum = pgEnum("sync_status", [
  "completed",
  "failed",
  "partial",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "linkedin_post",
  "email_nurture",
  "blog_article",
  "social_caption",
  "landing_copy",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "review",
  "approved",
  "published",
]);

export const copilotSessionStatusEnum = pgEnum("copilot_session_status", [
  "active",
  "completed",
  "abandoned",
]);

export const copilotPhaseEnum = pgEnum("copilot_phase", [
  "understand",
  "define",
  "confirm",
]);

// ── Tables ──

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  brandAssets: jsonb("brand_assets").default({}),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionTier: subscriptionTierEnum("subscription_tier"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  trialEndsAt: timestamp("trial_ends_at"),
  earlyAdopterEndsAt: timestamp("early_adopter_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: projectTypeEnum("type").notNull(),
  status: projectStatusEnum("status").default("brief").notNull(),
  currentGate: gateTypeEnum("current_gate"),
  deliveryStatus: deliveryStatusEnum("delivery_status").default("draft").notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  step: artifactStepEnum("step").notNull(),
  type: artifactTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  version: integer("version").default(1).notNull(),
  storagePath: text("storage_path").notNull(),
  createdByAgent: varchar("created_by_agent", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
});

export const gateReviews = pgTable("gate_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
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
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  agentId: varchar("agent_id", { length: 20 }).notNull(),
  step: varchar("step", { length: 50 }).notNull(),
  attempt: integer("attempt").default(1).notNull(),
  status: executionStatusEnum("status").notNull(),
  inputArtifactIds: jsonb("input_artifact_ids").default([]),
  outputArtifactIds: jsonb("output_artifact_ids").default([]),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  cost: jsonb("cost").default({}),
  error: text("error"),
});

export const modelConfigs = pgTable("model_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  taskType: taskTypeEnum("task_type").notNull(),
  recommendedModel: varchar("recommended_model", { length: 100 }).notNull(),
  recommendedBy: varchar("recommended_by", { length: 20 }).notNull(),
  parameters: jsonb("parameters").default({}),
  costEstimate: numeric("cost_estimate", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Review & Delivery ──

export const reviewTokens = pgTable("review_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  author: commentAuthorEnum("author").notNull(),
  authorName: varchar("author_name", { length: 255 }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Financial Module ──

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: varchar("bank_account_id", { length: 50 }).default("main").notNull(),
  externalId: varchar("external_id", { length: 255 }).unique(),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  description: text("description").notNull(),
  counterpartyName: varchar("counterparty_name", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  category: varchar("category", { length: 50 }),
  subcategory: varchar("subcategory", { length: 50 }),
  type: transactionTypeEnum("type"),
  source: transactionSourceEnum("source").notNull(),
  reconciled: integer("reconciled").default(0).notNull(),
  reconciledWithId: uuid("reconciled_with_id"),
  clientId: uuid("client_id").references(() => clients.id),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expectedPayments = pgTable("expected_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: expectedPaymentStatusEnum("status").default("pending").notNull(),
  reconciledTransactionId: uuid("reconciled_transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientAliases = pgTable("client_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  alias: varchar("alias", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categorizationRules = pgTable("categorization_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  matchType: ruleMatchTypeEnum("match_type").default("contains").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  source: ruleSourceEnum("source").default("manual").notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankSyncLog = pgTable("bank_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  transactionsFound: integer("transactions_found").default(0).notNull(),
  transactionsNew: integer("transactions_new").default(0).notNull(),
  transactionsReconciled: integer("transactions_reconciled").default(0).notNull(),
  status: syncStatusEnum("status").notNull(),
  error: text("error"),
});

// ── Content Module ──

export const contentPieces = pgTable("content_pieces", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: contentTypeEnum("type").notNull(),
  status: contentStatusEnum("status").default("draft").notNull(),
  brief: jsonb("brief").default({}),
  content: text("content"),
  title: varchar("title", { length: 255 }),
  meta: jsonb("meta").default({}),
  version: integer("version").default(1).notNull(),
  revisionNotes: text("revision_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Copilot Module ──

export const copilotSessions = pgTable("copilot_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id),
  status: copilotSessionStatusEnum("status").default("active").notNull(),
  projectType: varchar("project_type", { length: 50 }),
  currentPhase: copilotPhaseEnum("current_phase").default("understand").notNull(),
  currentQuestion: integer("current_question").default(1).notNull(),
  answers: jsonb("answers").default({}),
  generatedBrief: jsonb("generated_brief"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
