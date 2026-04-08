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
  "corporate",
  "explainer",
  "documentary",
  "fiction",
  "micro_content",
  "commercial",
]);

export const projectStatusEnum = pgEnum("project_status", [
  // Video production
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish",
  // Brand builder
  "discovery", "research", "positioning", "identity", "brand_dna",
  // Strategist
  "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
  // Graphic design
  "design_system", "moodboard", "production", "adaptation",
  // Writers Room
  "wr_brief", "wr_research", "wr_draft", "wr_adaptation", "wr_delivery",
  // Audio
  "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
  // Web
  "wb_brief", "wb_architecture", "wb_content", "wb_seo", "wb_build", "wb_qa", "wb_delivery",
  // Marketplace
  "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery",
  // Print Production
  "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery",
  // Events
  "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
  // Ads
  "ad_brief", "ad_strategy", "ad_creative", "ad_targeting", "ad_launch_kit", "ad_delivery",
  // Security Team
  "sec_audit", "sec_scan", "sec_remediate", "sec_report", "sec_deliver",
  // Community Management
  "cm_brief", "cm_calendar", "cm_content_production", "cm_scheduling", "cm_monitoring", "cm_reporting", "cm_delivery",
  // Email Marketing
  "em_brief", "em_strategy", "em_production", "em_segmentation", "em_send", "em_analysis", "em_delivery",
  // SEO/Content
  "se_brief", "se_audit", "se_keyword_strategy", "se_content_plan", "se_optimization", "se_reporting", "se_delivery",
  // Channel Manager
  "ch_request", "ch_analysis", "ch_specs", "ch_delivery",
  // Sales/CRM
  "sl_capture", "sl_enrich", "sl_score", "sl_nurture", "sl_proposal", "sl_negotiate", "sl_close", "sl_attribution", "sl_delivery",
  // Analytics
  "an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver",
  // Financial Motor
  "fn_request", "fn_budget", "fn_tracking", "fn_pl", "fn_deliver",
  // Positioning Engine
  "po_perception_audit", "po_gap_analysis", "po_positioning_definition", "po_validation",
  "po_current_audit", "po_target_definition", "po_transition_plan", "po_phase_design", "po_execution_monitoring",
  // Shared
  "delivered", "paused",
]);

export const gateTypeEnum = pgEnum("gate_type", [
  "g1",
  "g2",
  "g3",
  "g4",
  "g5",
  "gd-g1",
  "gd-g2",
  "gd-g3",
  "wr-g1", "wr-g2",
  "au-g1", "au-g2",
  "wb-g1", "wb-g2", "wb-g3",
  "mk-g1", "mk-g2",
  "pp-g1", "pp-g2",
  "ev-g1", "ev-g2", "ev-g3",
  "ad-g1", "ad-g2",
  "cm-g1", "cm-g2",
  "em-g1", "em-g2",
  "se-g1", "se-g2",
  "ch-g1",
  "sl-g1", "sl-g2",
  "an-g1",
  "fn-g1",
  "sec-g1",
  "po-g1", "po-g2",
]);

export const gateDecisionEnum = pgEnum("gate_decision", ["pass", "fail"]);

export const artifactStepEnum = pgEnum("artifact_step", [
  // Video production
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish", "delivery",
  // Brand builder
  "discovery", "research", "positioning", "identity", "brand_dna",
  // Strategist
  "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
  // Graphic design
  "design_system", "moodboard", "production", "adaptation",
  // Writers Room
  "wr_brief", "wr_research", "wr_draft", "wr_adaptation", "wr_delivery",
  // Audio
  "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
  // Web
  "wb_brief", "wb_architecture", "wb_content", "wb_seo", "wb_build", "wb_qa", "wb_delivery",
  // Marketplace
  "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery",
  // Print Production
  "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery",
  // Events
  "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
  // Ads
  "ad_brief", "ad_strategy", "ad_creative", "ad_targeting", "ad_launch_kit", "ad_delivery",
  // Community Management
  "cm_brief", "cm_calendar", "cm_content_production", "cm_scheduling", "cm_monitoring", "cm_reporting", "cm_delivery",
  // Email Marketing
  "em_brief", "em_strategy", "em_production", "em_segmentation", "em_send", "em_analysis", "em_delivery",
  // SEO/Content
  "se_brief", "se_audit", "se_keyword_strategy", "se_content_plan", "se_optimization", "se_reporting", "se_delivery",
  // Channel Manager
  "ch_request", "ch_analysis", "ch_specs", "ch_delivery",
  // Sales/CRM
  "sl_capture", "sl_enrich", "sl_score", "sl_nurture", "sl_proposal", "sl_negotiate", "sl_close", "sl_attribution", "sl_delivery",
  // Analytics
  "an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver",
  // Financial Motor
  "fn_request", "fn_budget", "fn_tracking", "fn_pl", "fn_deliver",
  // Security Team
  "sec_audit", "sec_scan", "sec_remediate", "sec_report", "sec_deliver",
  // Opportunity Agent (loop, not pipeline)
  "op_scan", "op_evaluate", "op_alert",
  // Brand Listener
  "bl_scan", "bl_analyze", "bl_report",
  // Culture Listener
  "cl_scan", "cl_analyze", "cl_report",
  // Industry Listener
  "il_scan", "il_analyze", "il_report",
  // Competitive Listener
  "co_scan", "co_analyze", "co_report",
  // Positioning Engine
  "po_perception_audit", "po_gap_analysis", "po_positioning_definition", "po_validation",
  "po_current_audit", "po_target_definition", "po_transition_plan", "po_phase_design", "po_execution_monitoring",
  // Shared
  "model_config", "gate_review",
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

export const entityTypeEnum = pgEnum("entity_type", [
  "client", "vendor", "personal", "bank", "government", "unknown",
]);

export const invoiceDirectionEnum = pgEnum("invoice_direction", [
  "issued", "received",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending", "partial", "paid", "overdue", "canceled",
]);

export const listenerTypeEnum = pgEnum("listener_type", [
  "brand", "culture", "industry", "competitive", "opportunity",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info", "warning", "critical",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "open", "acknowledged", "resolved", "dismissed",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending", "approved", "rejected", "escalated", "expired",
]);

export const actorTypeEnum = pgEnum("actor_type", [
  "agent", "human", "system",
]);

export const continuousRunStatusEnum = pgEnum("continuous_run_status", [
  "pending", "running", "completed", "failed",
]);

export const brandRuleTypeEnum = pgEnum("brand_rule_type", [
  "always", "never", "prefer", "avoid",
]);

export const brandRuleSourceEnum = pgEnum("brand_rule_source", [
  "brand_dna", "human_feedback", "learned",
]);

export const brandValidationVerdictEnum = pgEnum("brand_validation_verdict", [
  "pass", "needs_revision", "fail",
]);

export const brandIssueSeverityEnum = pgEnum("brand_issue_severity", [
  "critical", "major", "minor",
]);

// ── Tables ──

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
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
  pipelineType: varchar("pipeline_type", { length: 50 }).default("video-production").notNull(),
  parentProjectId: uuid("parent_project_id"),
  status: projectStatusEnum("status").default("brief").notNull(),
  currentGate: varchar("current_gate", { length: 20 }),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("artifacts_project_id_idx").on(table.projectId),
]);

export const gateReviews = pgTable("gate_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  gate: varchar("gate", { length: 20 }).notNull(),
  iteration: integer("iteration").default(1).notNull(),
  decision: gateDecisionEnum("decision").notNull(),
  reviewer: varchar("reviewer", { length: 20 }).notNull(),
  scores: jsonb("scores").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("gate_reviews_project_id_gate_idx").on(table.projectId, table.gate),
]);

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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("comments_project_id_idx").on(table.projectId),
]);

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
  entityId: uuid("entity_id"),
  notes: text("notes"),
  parentTransactionId: uuid("parent_transaction_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("transactions_date_idx").on(table.date),
  index("transactions_client_id_idx").on(table.clientId),
  index("transactions_category_idx").on(table.category),
  index("transactions_parent_id_idx").on(table.parentTransactionId),
]);

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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("expected_payments_client_id_idx").on(table.clientId),
  index("expected_payments_status_idx").on(table.status),
]);

export const clientAliases = pgTable("client_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  alias: varchar("alias", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// ── Business Entities & Invoices ──

export const businessEntities = pgTable("business_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: entityTypeEnum("type").default("unknown").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  patterns: jsonb("patterns").default([]).notNull(),
  defaultCategory: varchar("default_category", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  direction: invoiceDirectionEnum("direction").notNull(),
  entityId: uuid("entity_id").references(() => businessEntities.id).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date"),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  filePath: text("file_path"),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("invoices_entity_id_idx").on(table.entityId),
  index("invoices_status_idx").on(table.status),
]);

export const transactionInvoices = pgTable("transaction_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").references(() => transactions.id).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// ── Auth (Better Auth) ──

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: varchar("role", { length: 20 }).default("client").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Vendor Management (Marketplace) ──

export const vendorQuoteStatusEnum = pgEnum("vendor_quote_status", [
  "pending", "accepted", "rejected", "expired",
]);

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  categories: text("categories").array().notNull(),
  services: text("services").array().notNull(),
  location: varchar("location", { length: 255 }),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  totalJobs: integer("total_jobs").default(0),
  priceRange: varchar("price_range", { length: 10 }),
  portfolioUrl: varchar("portfolio_url", { length: 500 }),
  contact: jsonb("contact").$type<{ email?: string; phone?: string; whatsapp?: string; website?: string }>(),
  notes: text("notes"),
  active: boolean("active").default(true),
  clientId: uuid("client_id").references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendorQuotes = pgTable("vendor_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => vendors.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  deliveryDays: integer("delivery_days"),
  specs: jsonb("specs"),
  status: vendorQuoteStatusEnum("status").default("pending"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorReviews = pgTable("vendor_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => vendors.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  quality: integer("quality").notNull(),
  price: integer("price").notNull(),
  timeliness: integer("timeliness").notNull(),
  communication: integer("communication").notNull(),
  notes: text("notes"),
  reviewDate: timestamp("review_date").defaultNow().notNull(),
});

// ── Sales/CRM ──

export const leadStatusEnum = pgEnum("lead_status", [
  "new", "enriched", "scored", "qualified", "nurturing", "proposal", "negotiation", "won", "lost",
]);

export const leadClassificationEnum = pgEnum("lead_classification", ["hot", "warm", "cold"]);

export const dealStageEnum = pgEnum("deal_stage", [
  "qualification", "nurture", "proposal", "negotiation", "closing", "won", "lost",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft", "sent", "viewed", "accepted", "rejected",
]);

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 50 }).notNull(),
  sourceDetail: varchar("source_detail", { length: 255 }),
  fitScore: integer("fit_score").default(0),
  intentScore: integer("intent_score").default(0),
  bantScore: jsonb("bant_score").default({}),
  totalScore: integer("total_score").default(0),
  classification: leadClassificationEnum("classification").default("cold"),
  status: leadStatusEnum("status").default("new"),
  enrichmentData: jsonb("enrichment_data").default({}),
  assignedTo: varchar("assigned_to", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("leads_client_id_idx").on(table.clientId),
  index("leads_email_idx").on(table.email),
]);

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: numeric("value", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  stage: dealStageEnum("stage").default("qualification"),
  probability: integer("probability").default(10),
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  lostReason: varchar("lost_reason", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("deals_lead_id_idx").on(table.leadId),
  index("deals_client_id_idx").on(table.clientId),
]);

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  version: integer("version").default(1),
  content: text("content"),
  pricing: jsonb("pricing"),
  validUntil: timestamp("valid_until"),
  status: proposalStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Sales Engine: Touchpoints, Follow-Ups, Scoring ──

export const followUpStatusEnum = pgEnum("follow_up_status", [
  "scheduled", "sent", "opened", "replied", "bounced", "cancelled",
]);

export const leadTouchpoints = pgTable("lead_touchpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  campaign: varchar("campaign", { length: 200 }),
  content: varchar("content", { length: 200 }),
  medium: varchar("medium", { length: 50 }),
  interaction: varchar("interaction", { length: 50 }).notNull(),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("lead_touchpoints_lead_id_idx").on(table.leadId),
]);

export const followUps = pgTable("follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 30 }).notNull(),
  content: text("content"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
  status: followUpStatusEnum("status").default("scheduled").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("follow_ups_lead_id_idx").on(table.leadId),
  index("follow_ups_status_idx").on(table.status),
]);

export const scoringRules = pgTable("scoring_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  component: varchar("component", { length: 20 }).notNull(),
  signal: varchar("signal", { length: 100 }).notNull(),
  points: integer("points").notNull(),
  condition: jsonb("condition"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("scoring_rules_client_id_idx").on(table.clientId),
]);

// ── Positioning Engine: Perception Tracking ──

export const perceptionTrackingStatusEnum = pgEnum("perception_tracking_status", [
  "on_track", "at_risk", "off_track",
]);

export const perceptionTracking = pgTable("perception_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  repositioningProjectId: uuid("repositioning_project_id").references(() => projects.id),
  phase: integer("phase").notNull(),
  measurementDate: timestamp("measurement_date").notNull(),
  metrics: jsonb("metrics").notNull(),
  status: perceptionTrackingStatusEnum("status").default("on_track").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("perception_tracking_client_id_idx").on(table.clientId),
  index("perception_tracking_project_id_idx").on(table.repositioningProjectId),
]);

// ── Waitlist ──

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "pending",
  "nurturing",
  "invited",
  "converted",
]);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  videoType: varchar("video_type", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  source: varchar("source", { length: 100 }).default("landing").notNull(),
  status: waitlistStatusEnum("status").default("pending").notNull(),
  nurtureStep: integer("nurture_step").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Engine Infrastructure Tables ──

export const continuousAgentRuns = pgTable("continuous_agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  agentId: varchar("agent_id", { length: 20 }).notNull(),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  step: varchar("step", { length: 30 }).notNull(),
  status: continuousRunStatusEnum("status").default("pending").notNull(),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  artifactsProduced: jsonb("artifacts_produced").default([]),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 4 }),
  error: text("error"),
  cycleId: uuid("cycle_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("car_client_listener_idx").on(table.clientId, table.listenerType),
  index("car_cycle_idx").on(table.cycleId),
]);

export const alertRules = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  condition: jsonb("condition").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  notificationChannels: jsonb("notification_channels").default([]),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  alertRuleId: uuid("alert_rule_id").references(() => alertRules.id),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  context: jsonb("context"),
  status: alertStatusEnum("status").default("open").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("alerts_client_status_idx").on(table.clientId, table.status),
]);

export const dataSourceConfigs = pgTable("data_source_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  config: jsonb("config").notNull(),
  schedule: varchar("schedule", { length: 50 }).default("0 6 * * *").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  actor: varchar("actor", { length: 100 }).notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),
  details: jsonb("details"),
  autonomyLevel: integer("autonomy_level"),
  approvalId: uuid("approval_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("audit_client_time_idx").on(table.clientId, table.timestamp),
  index("audit_action_idx").on(table.action),
]);

export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  motor: varchar("motor", { length: 50 }).notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  context: jsonb("context").notNull(),
  urgency: varchar("urgency", { length: 10 }).default("normal").notNull(),
  status: approvalStatusEnum("status").default("pending").notNull(),
  respondedAt: timestamp("responded_at"),
  respondedBy: varchar("responded_by", { length: 100 }),
  responseNote: text("response_note"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("approval_pending_idx").on(table.clientId, table.status),
]);

export const autonomyConfigs = pgTable("autonomy_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull().unique(),
  globalLevel: integer("global_level").default(3).notNull(),
  overrides: jsonb("overrides").default([]),
  escalation: jsonb("escalation").notNull(),
  schedule: jsonb("schedule"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Brand Guardian ──

export const brandRules = pgTable("brand_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  dimension: varchar("dimension", { length: 50 }).notNull(),
  type: brandRuleTypeEnum("type").notNull(),
  rule: text("rule").notNull(),
  source: brandRuleSourceEnum("source").notNull(),
  examples: jsonb("examples").default([]),
  confidence: numeric("confidence", { precision: 3, scale: 2 }).default("1.00"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAppliedAt: timestamp("last_applied_at"),
}, (table) => [
  index("brand_rules_client_idx").on(table.clientId),
  index("brand_rules_dimension_idx").on(table.clientId, table.dimension),
]);

export const brandValidations = pgTable("brand_validations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  overallScore: integer("overall_score").notNull(),
  verdict: brandValidationVerdictEnum("verdict").notNull(),
  dimensions: jsonb("dimensions").notNull(),
  summary: text("summary").notNull(),
  autoFixable: boolean("auto_fixable").default(false).notNull(),
  autoFixSuggestions: jsonb("auto_fix_suggestions").default([]),
  humanOverride: varchar("human_override", { length: 20 }),
  humanFeedback: text("human_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("brand_validations_client_idx").on(table.clientId),
  index("brand_validations_project_idx").on(table.projectId),
]);

export const brandGuardianConfigs = pgTable("brand_guardian_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull().unique(),
  passThreshold: integer("pass_threshold").default(80).notNull(),
  autoPassThreshold: integer("auto_pass_threshold").default(95).notNull(),
  strictMode: boolean("strict_mode").default(false).notNull(),
  weightsByDimension: jsonb("weights_by_dimension").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandManuals = pgTable("brand_manuals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  version: integer("version").default(1).notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  shareToken: varchar("share_token", { length: 64 }).notNull().unique(),
  published: boolean("published").default(true).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (table) => [
  index("brand_manuals_client_idx").on(table.clientId),
  index("brand_manuals_token_idx").on(table.shareToken),
]);

// ── Analytics Engine Tables ──

export const analyticsMetrics = pgTable(
  "analytics_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    metric: varchar("metric", { length: 100 }).notNull(),
    value: numeric("value", { precision: 14, scale: 4 }).notNull(),
    dimensions: jsonb("dimensions").default("{}"),
    source: varchar("source", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_analytics_metrics_lookup").on(table.clientId, table.metric, table.date),
    index("idx_analytics_metrics_source").on(table.clientId, table.source, table.date),
  ],
);

export const dashboardConfigs = pgTable("dashboard_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  dashboardType: varchar("dashboard_type", { length: 50 }).notNull(),
  config: jsonb("config").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedReports = pgTable("generated_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  periodStart: varchar("period_start", { length: 10 }).notNull(),
  periodEnd: varchar("period_end", { length: 10 }).notNull(),
  content: jsonb("content").notNull(),
  renderedMarkdown: text("rendered_markdown"),
  deliveredVia: jsonb("delivered_via"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nlQueries = pgTable("nl_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  data: jsonb("data"),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  feedback: varchar("feedback", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});
