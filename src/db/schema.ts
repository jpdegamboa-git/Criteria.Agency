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

// ── Tables ──

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  brandAssets: jsonb("brand_assets").default({}),
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
