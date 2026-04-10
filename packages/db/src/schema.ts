import {
  pgTable,
  uuid,
  varchar,
  boolean,
  jsonb,
  text,
  integer,
  numeric,
  timestamp,
  uniqueIndex,
  index,
  vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization as authOrganization } from './auth-schema';

// organization_settings — extension data for Better Auth organizations
// Better Auth's `organization` table is the source of truth for org identity.
// This table stores platform-specific settings (plan, config) keyed by the same ID.
export const organizationSettings = pgTable('organization_settings', {
  organizationId: text('organization_id')
    .primaryKey()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 20 }).notNull().default('starter'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// motors — motor configurations per tenant
export const motors = pgTable('motors', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
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
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('prompt_reg_agent_skill_ver_idx').on(table.agentId, table.skillId, table.version),
  index('prompt_reg_agent_skill_active_idx').on(table.agentId, table.skillId, table.active),
]);

// output_registry — semantic search over agent outputs (DEC-130, pgvector)
// Summary-only embeddings per DEC-151
export const outputRegistry = pgTable('output_registry', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  sourceMotor: varchar('source_motor', { length: 50 }).notNull(),
  sourceAgentId: varchar('source_agent_id', { length: 50 }),
  outputType: varchar('output_type', { length: 50 }).notNull(),
  contentRef: uuid('content_ref').notNull(),
  summary: text('summary').notNull(),
  summaryEmbedding: vector('summary_embedding', { dimensions: 768 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('output_reg_org_idx').on(table.organizationId),
  index('output_reg_org_motor_idx').on(table.organizationId, table.sourceMotor),
  index('output_reg_type_idx').on(table.outputType),
]);

// brand_dna — one per tenant, tracks the current Brand DNA state across layers
// Versioning per DEC-084: previous state stored as undo snapshot, not version history
export const brandDna = pgTable('brand_dna', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .unique()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  currentLayer: integer('current_layer').notNull().default(0),
  onboardingPath: varchar('onboarding_path', { length: 1 }), // 'A' (has brand) or 'B' (from scratch)
  status: varchar('status', { length: 20 }).notNull().default('onboarding'), // onboarding | active | updating
  fundamentos_score: integer('fundamentos_score').notNull().default(0),
  // Undo support (DEC-084): snapshot of previous state before last update
  previousSnapshot: jsonb('previous_snapshot'),
  previousSnapshotAt: timestamp('previous_snapshot_at'),
  previousSnapshotTrigger: varchar('previous_snapshot_trigger', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('brand_dna_org_idx').on(table.organizationId),
]);

// brand_dna_artifacts — individual artifacts per layer (logo, tone, positioning, etc.)
// Each artifact type exists at one layer but builds on all previous layers
export const brandDnaArtifacts = pgTable('brand_dna_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandDnaId: uuid('brand_dna_id')
    .notNull()
    .references(() => brandDna.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  layer: integer('layer').notNull(), // 0, 1, 2, or 3
  // Layer 0 types: logo, color_palette, tone_of_voice, audience_estimated, value_proposition_draft,
  //                active_channels, competitor_map
  // Layer 1 types: value_proposition, audience_primary, positioning_basic,
  //                visual_identity_confirmed, tone_of_voice_defined
  // Layer 2 types: audiences_segmented, positioning_3cs, audience_smallest_viable,
  //                brand_archetype, verbal_territory, competitive_map
  // Layer 3 types: brand_book, visual_system_extended, tone_guide_by_channel,
  //                brand_guardian_templates
  artifactType: varchar('artifact_type', { length: 60 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | validated | rejected
  content: jsonb('content').notNull().default({}),
  // Undo support: previous content before last agent update
  previousContent: jsonb('previous_content'),
  triggerContext: varchar('trigger_context', { length: 100 }), // what triggered the update
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('brand_artifact_dna_idx').on(table.brandDnaId),
  index('brand_artifact_org_layer_idx').on(table.organizationId, table.layer),
  uniqueIndex('brand_artifact_org_type_idx').on(table.organizationId, table.artifactType),
]);

// brand_health_scores — daily calculated scores per tenant (DEC-126)
// Fundamentos axis now; Ejecución + Oportunidad added in Fase 3
export const brandHealthScores = pgTable('brand_health_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  fundamentos: integer('fundamentos').notNull().default(0),
  ejecucion: integer('ejecucion'), // null until Fase 3
  oportunidad: integer('oportunidad'), // null until Fase 3
  // Combined score: avg of available axes
  totalScore: integer('total_score').notNull().default(0),
  breakdown: jsonb('breakdown').notNull().default({}), // details per axis
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
}, (table) => [
  index('bhs_org_idx').on(table.organizationId),
  index('bhs_org_date_idx').on(table.organizationId, table.calculatedAt),
]);

// ─── Video Motor Tables ────────────────────────────────────────────────────────

// video_projects — one per video production project
// Tracks the full pipeline lifecycle from brief to delivery.
export const videoProjects = pgTable('video_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // Pipeline status — mirrors the 11 steps + 5 gates
  // Possible values: brief_intake | creative_direction | concept | gate_1 |
  //   script_classify | script_structure | script_draft | script_polish | gate_2 |
  //   visual_look | storyboard | gate_3 | video_gen | editing | audio | gate_4 |
  //   polish | gate_5 | delivered | escalated
  status: varchar('status', { length: 30 }).notNull().default('brief_intake'),
  currentStep: varchar('current_step', { length: 50 }).notNull().default('brief_intake'),
  // The validated brief (stored as jsonb, not in step state per DEC-148)
  brief: jsonb('brief').notNull().default({}),
  // Autonomy mode per DEC from Marketing Engine Design §3
  autonomyMode: varchar('autonomy_mode', { length: 20 }).notNull().default('ai_recommends'),
  // Inngest run ID for linking to the Inngest dashboard
  inngestRunId: varchar('inngest_run_id', { length: 255 }),
  // 3+3 iteration counters per gate (reset at each gate, tracked across function re-entries)
  gateIterations: jsonb('gate_iterations').notNull().default({ g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 }),
  // Escalation metadata
  escalatedAt: timestamp('escalated_at'),
  escalationReason: text('escalation_reason'),
  // Delivery timestamp
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('video_proj_org_idx').on(table.organizationId),
  index('video_proj_org_status_idx').on(table.organizationId, table.status),
]);

// video_artifacts — versioned artifacts per pipeline step
// R2 storage is planned for production; for MVP content is stored as jsonb.
export const videoArtifacts = pgTable('video_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => videoProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // Which pipeline step produced this artifact
  // e.g. 'creative_direction' | 'concept' | 'beat_sheet' | 'script' | 'shot_list' |
  //      'storyboard' | 'clips' | 'edit' | 'audio' | 'final_video' | ...
  step: varchar('step', { length: 50 }).notNull(),
  artifactType: varchar('artifact_type', { length: 50 }).notNull(),
  // Version increments with each 3+3 iteration at the same step
  version: integer('version').notNull().default(1),
  // Full content for MVP — in production this will be a reference to R2
  content: jsonb('content').notNull().default({}),
  // Future R2 path: {tenantId}/projects/{projectId}/{step}/v{version}/{artifactType}
  r2Key: text('r2_key'),
  // Which gate iteration produced this version
  gateIteration: integer('gate_iteration').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('video_artifact_project_idx').on(table.projectId),
  index('video_artifact_org_step_idx').on(table.organizationId, table.step),
  index('video_artifact_project_step_version_idx').on(table.projectId, table.step, table.version),
]);

// video_gate_reviews — gate evaluation records (Showrunner + Brand Guardian + optional client)
export const videoGateReviews = pgTable('video_gate_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => videoProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  gateNumber: integer('gate_number').notNull(), // 1-5
  iterationNumber: integer('iteration_number').notNull(), // 1-6
  // Showrunner verdict: advance | iterate | rethink | null (pending)
  showrunnerVerdict: varchar('showrunner_verdict', { length: 20 }),
  showrunnerReasoning: text('showrunner_reasoning'),
  showrunnerFeedback: jsonb('showrunner_feedback').notNull().default({}),
  // Brand Guardian verdict: pass | warning | fail | null (pending)
  brandGuardianVerdict: varchar('brand_guardian_verdict', { length: 20 }),
  brandGuardianReasoning: text('brand_guardian_reasoning'),
  brandGuardianFixGuidance: text('brand_guardian_fix_guidance'),
  // Combined verdict: advance | iterate | rethink | escalate | pending_client
  combinedVerdict: varchar('combined_verdict', { length: 20 }).notNull().default('pending'),
  // G3 client approval (always offered at G3, required in ai_recommends mode)
  clientApprovalStatus: varchar('client_approval_status', { length: 20 }).notNull().default('na'),
  clientApprovalNotes: text('client_approval_notes'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('video_gate_project_idx').on(table.projectId),
  index('video_gate_project_gate_idx').on(table.projectId, table.gateNumber),
]);

// ─── Fase 2: Web Motor ────────────────────────────────────────────────────────

// web_projects — one per web production project (site, landing page, microsite, product page)
// Pipeline status mirrors 7 steps + 3 gates (DEC-217)
export const webProjects = pgTable('web_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // site_type: complete_site | landing_page | microsite | product_page | blog_first
  siteType: varchar('site_type', { length: 30 }).notNull(),
  // status: brief_intake | creative_direction | copy_production | gate_1 |
  //   visual_design | gate_2 | development | qa | gate_3 | deploy | delivered | escalated
  status: varchar('status', { length: 30 }).notNull().default('brief_intake'),
  currentStep: varchar('current_step', { length: 50 }).notNull().default('brief_intake'),
  // Mode: project (initial build) | continuous (updates, blog posts, new pages)
  mode: varchar('mode', { length: 20 }).notNull().default('project'),
  // Autonomy: ai_decides | ai_recommends (per DEC-220)
  autonomyMode: varchar('autonomy_mode', { length: 20 }).notNull().default('ai_recommends'),
  // Validated brief stored as jsonb (not in Inngest step state, per DEC-148)
  brief: jsonb('brief').notNull().default({}),
  // Inngest run ID for linking to dashboard
  inngestRunId: varchar('inngest_run_id', { length: 255 }),
  // 3+3 iteration counters per gate (reset at each gate)
  gateIterations: jsonb('gate_iterations').notNull().default({ g1: 0, g2: 0, g3: 0 }),
  // Live site URL after deploy
  liveUrl: text('live_url'),
  // Escalation metadata
  escalatedAt: timestamp('escalated_at'),
  escalationReason: text('escalation_reason'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('web_proj_org_idx').on(table.organizationId),
  index('web_proj_org_status_idx').on(table.organizationId, table.status),
]);

// web_pages — page registry per project (site architecture DEC-218)
export const webPages = pgTable('web_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => webProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // Page name (e.g. "Home", "About", "Product — Features")
  name: varchar('name', { length: 100 }).notNull(),
  // page_type: home | about | product | landing | blog_listing | blog_post_template |
  //   contact | category | legal
  pageType: varchar('page_type', { length: 30 }).notNull(),
  // Position in navigation hierarchy (0 = top-level, parent_id for children)
  hierarchyPosition: integer('hierarchy_position').notNull().default(0),
  parentPageId: uuid('parent_page_id'),
  // Pipeline status per page: pending | copy_draft | copy_approved | design_draft |
  //   design_approved | code_draft | code_approved
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  // Current approved artifact version numbers
  currentCopyVersion: integer('current_copy_version'),
  currentDesignVersion: integer('current_design_version'),
  currentCodeVersion: integer('current_code_version'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('web_page_project_idx').on(table.projectId),
  index('web_page_org_idx').on(table.organizationId),
]);

// web_artifacts — versioned artifacts per pipeline step, per page (DEC-148)
// R2 path: {tenantId}/projects/{projectId}/{step}/v{version}/
export const webArtifacts = pgTable('web_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => webProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').references(() => webPages.id, { onDelete: 'set null' }),
  // step: brief | creative_direction | copy | design | code | qa | deploy
  step: varchar('step', { length: 50 }).notNull(),
  // type: brief_doc | creative_direction_doc | copy_doc | design_spec | source_code |
  //   qa_report | deploy_record
  artifactType: varchar('artifact_type', { length: 50 }).notNull(),
  // Version increments with each 3+3 iteration
  version: integer('version').notNull().default(1),
  // Content for MVP — in production this will be a reference to R2
  content: jsonb('content').notNull().default({}),
  // Future R2 path (§7 of web-motor-design spec)
  r2Key: text('r2_key'),
  gateIteration: integer('gate_iteration').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('web_artifact_project_idx').on(table.projectId),
  index('web_artifact_org_step_idx').on(table.organizationId, table.step),
  index('web_artifact_project_step_version_idx').on(table.projectId, table.step, table.version),
]);

// web_gate_results — gate evaluation records (CD + Brand Guardian)
// Three gates: G1 (concept+text), G2 (visual design), G3 (site functioning)
export const webGateResults = pgTable('web_gate_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => webProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  gateNumber: integer('gate_number').notNull(), // 1, 2, or 3
  iterationNumber: integer('iteration_number').notNull(), // 1-6
  // CD verdict: advance | iterate (no rethink in Web Motor — leader adjustment is the escalation path)
  cdVerdict: varchar('cd_verdict', { length: 20 }),
  cdReasoning: text('cd_reasoning'),
  cdFeedback: jsonb('cd_feedback').notNull().default({}),
  // Brand Guardian verdict (G1 + G2 only; not used in G3 per DEC-223)
  bgVerdict: varchar('bg_verdict', { length: 20 }), // pass | warning | fail | null
  bgReasoning: text('bg_reasoning'),
  bgFixGuidance: text('bg_fix_guidance'),
  // QA report (G3 only)
  qaReport: jsonb('qa_report').notNull().default({}),
  // Combined: advance | iterate | escalate | pending
  combinedVerdict: varchar('combined_verdict', { length: 20 }).notNull().default('pending'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('web_gate_project_idx').on(table.projectId),
  index('web_gate_project_gate_idx').on(table.projectId, table.gateNumber),
]);

// web_iteration_tracking — 3+3 rule state per gate (DEC-186 §5.3)
export const webIterationTracking = pgTable('web_iteration_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => webProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  gateNumber: integer('gate_number').notNull(), // 1, 2, or 3
  attemptCount: integer('attempt_count').notNull().default(0),
  // true once we've entered leader adjustment (attempts 4-6)
  leaderAdjustmentActive: boolean('leader_adjustment_active').notNull().default(false),
  // true once attempt 6 is exceeded and human is required
  escalated: boolean('escalated').notNull().default(false),
  escalatedAt: timestamp('escalated_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('web_iter_project_gate_idx').on(table.projectId, table.gateNumber),
]);

// blog_posts — blog content for continuous mode (DEC-221)
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => webProjects.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  body: text('body').notNull().default(''),
  metaDescription: text('meta_description'),
  // draft | brand_review | approved | published | archived
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  // Tags/categories as array of strings in jsonb
  tags: jsonb('tags').notNull().default([]),
  categories: jsonb('categories').notNull().default([]),
  // Author attribution (optional — for byline display)
  authorName: varchar('author_name', { length: 100 }),
  // Inngest run ID for the blog post pipeline
  inngestRunId: varchar('inngest_run_id', { length: 255 }),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('blog_post_project_idx').on(table.projectId),
  index('blog_post_org_status_idx').on(table.organizationId, table.status),
  index('blog_post_project_slug_idx').on(table.projectId, table.slug),
]);

// ─── Fase 3: Analyst System Functions + Output Registry ───────────────────────

// campaigns — one per marketing campaign, tracks full lifecycle
// Funnel Matrix position: stage × channel type (Analyst spec §3.4)
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  // Funnel Matrix position
  funnelStage: varchar('funnel_stage', { length: 30 }).notNull(), // awareness | consideration | conversion | retention
  channelType: varchar('channel_type', { length: 20 }).notNull(), // paid | owned | earned
  // Campaign lifecycle
  // definition → production → execution → completed | paused
  status: varchar('status', { length: 20 }).notNull().default('definition'),
  objectives: jsonb('objectives').notNull().default({}),
  budget: jsonb('budget').notNull().default({}), // { total, currency, spent }
  // Link to Video Motor project if campaign produced a video
  videoProjectId: uuid('video_project_id').references(() => videoProjects.id, { onDelete: 'set null' }),
  brief: jsonb('brief').notNull().default({}),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('campaign_org_idx').on(table.organizationId),
  index('campaign_org_status_idx').on(table.organizationId, table.status),
  index('campaign_org_funnel_idx').on(table.organizationId, table.funnelStage, table.channelType),
]);

// campaign_kpis — KPI snapshots per campaign × channel × period (Analyst spec §3.1)
// Post-ingestion (every 4-6 hours). MVP: manual/seeded; real ingestion is post-MVP.
export const campaignKpis = pgTable('campaign_kpis', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 50 }).notNull(), // meta | google_ads | google_analytics | tiktok | email
  period: timestamp('period').notNull(), // when this snapshot was taken
  // Core KPIs — all nullable (not all channels report all metrics)
  impressions: integer('impressions'),
  clicks: integer('clicks'),
  ctr: numeric('ctr', { precision: 8, scale: 4 }), // %
  cpm: numeric('cpm', { precision: 10, scale: 4 }), // cost per mille
  cpc: numeric('cpc', { precision: 10, scale: 4 }), // cost per click
  conversions: integer('conversions'),
  roas: numeric('roas', { precision: 10, scale: 4 }), // return on ad spend
  engagementRate: numeric('engagement_rate', { precision: 8, scale: 4 }), // %
  spend: numeric('spend', { precision: 12, scale: 4 }),
  // Extra platform-specific metrics
  rawMetrics: jsonb('raw_metrics').notNull().default({}),
  // Deltas vs previous period (calculated at ingestion time)
  deltas: jsonb('deltas').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('kpi_campaign_idx').on(table.campaignId),
  index('kpi_org_channel_idx').on(table.organizationId, table.channel),
  index('kpi_campaign_period_idx').on(table.campaignId, table.period),
]);

// threshold_alerts — mechanical flags from threshold checks (Analyst spec §3.2)
// System function output — no LLM. Monitoring skill (Fase 3+) qualifies them.
export const thresholdAlerts = pgTable('threshold_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  // What triggered the flag
  alertType: varchar('alert_type', { length: 30 }).notNull(), // absolute | relative | sustained | compound
  severity: varchar('severity', { length: 20 }).notNull(), // informational | attention | action_required
  metric: varchar('metric', { length: 50 }).notNull(), // which KPI crossed the threshold
  metricValue: numeric('metric_value', { precision: 15, scale: 4 }),
  threshold: numeric('threshold', { precision: 15, scale: 4 }),
  deviationPct: numeric('deviation_pct', { precision: 8, scale: 4 }), // % deviation from threshold
  channel: varchar('channel', { length: 50 }),
  period: timestamp('period'),
  // Alert lifecycle: open → qualified (by Monitoring skill) | dismissed
  status: varchar('status', { length: 20 }).notNull().default('open'),
  // Populated after Monitoring skill processes it (post-MVP — agent deferred)
  qualifiedSeverity: varchar('qualified_severity', { length: 20 }),
  qualifiedAssessment: jsonb('qualified_assessment').notNull().default({}),
  qualifiedAt: timestamp('qualified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('alert_org_idx').on(table.organizationId),
  index('alert_org_status_idx').on(table.organizationId, table.status),
  index('alert_campaign_idx').on(table.campaignId),
]);

// campaign_scores — per-campaign quality score per phase (Analyst spec §3.4)
// Recalculated post-ingestion for active campaigns, at gate completion for production.
export const campaignScores = pgTable('campaign_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  phase: varchar('phase', { length: 20 }).notNull(), // definition | production | execution
  score: integer('score').notNull().default(0),
  breakdown: jsonb('breakdown').notNull().default({}),
  // Templated action recommendations based on score gaps
  recommendations: jsonb('recommendations').notNull().default([]),
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
}, (table) => [
  index('cscore_campaign_idx').on(table.campaignId),
  index('cscore_org_phase_idx').on(table.organizationId, table.phase),
]);

// ─── Fase 4: Strategist Motor + Platform Intelligence ─────────────────────────

// strategic_diagnoses — output of Strategist Diagnostic skill (DEC-090)
// The Strategist interprets Analyst data and produces strategic context.
export const strategicDiagnoses = pgTable('strategic_diagnoses', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // pending | running | complete | escalated
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // What triggered this diagnostic (matches Trigger # from spec §9)
  triggeredBy: varchar('triggered_by', { length: 100 }).notNull(),
  // Structured diagnosis output
  // { whereWeAre, whatsWorking, whatsNot, whatChanged, opportunity, risk, bhsContext }
  diagnosis: jsonb('diagnosis').notNull().default({}),
  // 3+3 iteration tracking
  iterationCount: integer('iteration_count').notNull().default(0),
  // Link to Inngest run for observability
  inngestRunId: varchar('inngest_run_id', { length: 255 }),
  completedAt: timestamp('completed_at'),
  escalatedAt: timestamp('escalated_at'),
  escalationReason: text('escalation_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('diag_org_idx').on(table.organizationId),
  index('diag_org_status_idx').on(table.organizationId, table.status),
]);

// marketing_plans — output of Strategist Planning skill (DEC-090, DEC-101)
// One per planning cycle per tenant. Client must approve (G3 — always required).
export const marketingPlans = pgTable('marketing_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // FK to the diagnosis that spawned this plan (trigger 6)
  diagnosisId: uuid('diagnosis_id').references(() => strategicDiagnoses.id, { onDelete: 'set null' }),
  // draft | pending_approval | approved | active | archived
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  // Plan period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  // Structured plan content from the Planning skill pipeline
  // { objectives[], audiences[], valueProposition, mediaPlan{}, budgetAllocation{}, calendar{} }
  objectives: jsonb('objectives').notNull().default([]),
  audiences: jsonb('audiences').notNull().default([]),
  valueProposition: jsonb('value_proposition').notNull().default({}),
  mediaPlan: jsonb('media_plan').notNull().default({}),
  // Budget calculated from product economics: margin × market × CAC (DEC-101)
  budgetAllocation: jsonb('budget_allocation').notNull().default({}),
  // G1 (Financial Agent viability): passed | flagged | blocked
  g1Status: varchar('g1_status', { length: 20 }).notNull().default('pending'),
  g1Feedback: text('g1_feedback'),
  // G2 (Brand Guardian coherence): passed | blocked
  g2Status: varchar('g2_status', { length: 20 }).notNull().default('pending'),
  g2Feedback: text('g2_feedback'),
  // G3 (client approval): pending | approved | rejected — ALWAYS required (DEC-096)
  g3Status: varchar('g3_status', { length: 20 }).notNull().default('pending'),
  g3Notes: text('g3_notes'),
  // 3+3 counters for G1 and G2
  g1Iterations: integer('g1_iterations').notNull().default(0),
  g2Iterations: integer('g2_iterations').notNull().default(0),
  inngestRunId: varchar('inngest_run_id', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('mplan_org_idx').on(table.organizationId),
  index('mplan_org_status_idx').on(table.organizationId, table.status),
]);

// marketing_plan_campaigns — pre-configured campaign briefs (DEC-098)
// "Everything pre-filled, everything editable. Client edits, never creates from scratch."
// Comes from 3 sources: plan, opportunity, optimization extension.
export const marketingPlanCampaigns = pgTable('marketing_plan_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // Optional — null if from opportunity or optimization (not part of a plan)
  planId: uuid('plan_id').references(() => marketingPlans.id, { onDelete: 'set null' }),
  // Origin: plan | opportunity | optimization
  source: varchar('source', { length: 20 }).notNull().default('plan'),
  // Funnel Matrix position
  funnelStage: varchar('funnel_stage', { length: 30 }).notNull(),
  channelType: varchar('channel_type', { length: 20 }).notNull(), // paid | owned | earned
  // Layer 1: Quick view (Campaign Grid card)
  name: varchar('name', { length: 200 }).notNull(),
  concept: text('concept').notNull(), // one-sentence concept
  // Layer 2: Strategic detail — all pre-filled, all editable
  objective: jsonb('objective').notNull().default({}), // { type, metric, target }
  audiences: jsonb('audiences').notNull().default([]),
  channels: jsonb('channels').notNull().default([]), // [{ channel, justification }]
  funnelMatrixDistribution: jsonb('funnel_matrix_distribution').notNull().default({}),
  budget: jsonb('budget').notNull().default({}), // { suggested, min, max, currency, rationale }
  calendar: jsonb('calendar').notNull().default({}), // { startDate, endDate, milestones }
  expectedKpis: jsonb('expected_kpis').notNull().default({}), // from PI benchmarks
  justification: text('justification').notNull().default(''), // the "why" (not editable by client)
  // Confidence indicator for the card: history | industry | opportunity
  confidenceSource: varchar('confidence_source', { length: 20 }).notNull().default('industry'),
  // Creative direction for Creative Director (Layer 2.5)
  creativeSuggestion: jsonb('creative_suggestion').notNull().default({}),
  // Lifecycle: proposed | pending_approval | approved | rejected | active | completed
  status: varchar('status', { length: 20 }).notNull().default('proposed'),
  // G4: Strategist self-evaluation (internal quality check)
  g4Passed: boolean('g4_passed').notNull().default(false),
  // G5: Showrunner campaign coherence check
  g5Status: varchar('g5_status', { length: 20 }).notNull().default('pending'),
  // G6: Client approval — ALWAYS required (DEC-096)
  g6Status: varchar('g6_status', { length: 20 }).notNull().default('pending'),
  g6Notes: text('g6_notes'),
  // When approved, links to the actual campaign in campaigns table
  linkedCampaignId: uuid('linked_campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('mpc_org_idx').on(table.organizationId),
  index('mpc_org_status_idx').on(table.organizationId, table.status),
  index('mpc_plan_idx').on(table.planId),
  index('mpc_org_funnel_idx').on(table.organizationId, table.funnelStage, table.channelType),
]);

// client_intelligence — private per-client accumulated learnings (DEC-091)
// Updated by Campaign Learning skill. One document per client, grows over time.
export const clientIntelligence = pgTable('client_intelligence', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .unique()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // Structured learnings accumulated from completed campaigns
  // Array of: { topic, finding, confidence, evidenceCount, sourceCampaignIds[], lastUpdated }
  insights: jsonb('insights').notNull().default([]),
  // Increments each time Campaign Learning skill updates this document
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('ci_org_idx').on(table.organizationId),
]);

// platform_intelligence_benchmarks — industry_benchmark cold start layer (DEC-106)
// System function (DEC-112). Seeded from public data. K-anonymity enforced at query time.
// Later layers (platform_early, platform) accumulate automatically from Campaign Learning.
export const platformIntelligenceBenchmarks = pgTable('platform_intelligence_benchmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Dimension context (the "where")
  industry: varchar('industry', { length: 100 }).notNull(),
  region: varchar('region', { length: 50 }).notNull().default('LATAM'),
  businessSize: varchar('business_size', { length: 20 }).notNull().default('any'), // starter | pro | agency | any
  // Dimension execution (the "what")
  channel: varchar('channel', { length: 50 }).notNull().default('any'),
  format: varchar('format', { length: 50 }).notNull().default('any'),
  funnelStage: varchar('funnel_stage', { length: 30 }).notNull().default('any'),
  messagingType: varchar('messaging_type', { length: 30 }).notNull().default('any'),
  // The metric and its value
  metric: varchar('metric', { length: 50 }).notNull(), // ctr | cpm | cpc | roas | engagement_rate | cac
  value: numeric('value', { precision: 15, scale: 4 }).notNull(), // median/mean value
  // Range served when K is low (K=3-7 per DEC-108)
  valueMin: numeric('value_min', { precision: 15, scale: 4 }),
  valueMax: numeric('value_max', { precision: 15, scale: 4 }),
  // Data quality metadata
  // industry_benchmark (public data) | platform_early | platform
  source: varchar('source', { length: 30 }).notNull().default('industry_benchmark'),
  // low | medium | high
  confidence: varchar('confidence', { length: 10 }).notNull().default('low'),
  // How many campaigns/clients contributed (for industry_benchmark this is the published sample size)
  n: integer('n').notNull().default(0),
  // Temporal window: e.g. "2025-Q4", "2025", "2024-2025"
  temporalWindow: varchar('temporal_window', { length: 20 }).notNull().default('2025'),
  // rising | stable | declining | unknown
  trend: varchar('trend', { length: 20 }).notNull().default('unknown'),
  // Notes: source URL, caveats, methodology
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('pi_industry_idx').on(table.industry),
  index('pi_industry_channel_idx').on(table.industry, table.channel),
  index('pi_industry_metric_idx').on(table.industry, table.metric),
  index('pi_channel_funnel_idx').on(table.channel, table.funnelStage),
]);

// Relations
export const organizationSettingsRelations = relations(organizationSettings, ({ many }) => ({
  motors: many(motors),
  motorExecutions: many(motorExecutions),
  outputRegistry: many(outputRegistry),
  brandDna: many(brandDna),
  brandHealthScores: many(brandHealthScores),
  videoProjects: many(videoProjects),
  webProjects: many(webProjects),
  campaigns: many(campaigns),
  strategicDiagnoses: many(strategicDiagnoses),
  marketingPlans: many(marketingPlans),
  marketingPlanCampaigns: many(marketingPlanCampaigns),
}));

export const motorsRelations = relations(motors, ({ one }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [motors.organizationId],
    references: [organizationSettings.organizationId],
  }),
}));

export const motorExecutionsRelations = relations(motorExecutions, ({ one }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [motorExecutions.organizationId],
    references: [organizationSettings.organizationId],
  }),
}));

export const outputRegistryRelations = relations(outputRegistry, ({ one }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [outputRegistry.organizationId],
    references: [organizationSettings.organizationId],
  }),
}));

export const brandDnaRelations = relations(brandDna, ({ many }) => ({
  artifacts: many(brandDnaArtifacts),
}));

export const brandDnaArtifactsRelations = relations(brandDnaArtifacts, ({ one }) => ({
  brandDna: one(brandDna, {
    fields: [brandDnaArtifacts.brandDnaId],
    references: [brandDna.id],
  }),
}));

export const brandHealthScoresRelations = relations(brandHealthScores, ({ one }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [brandHealthScores.organizationId],
    references: [organizationSettings.organizationId],
  }),
}));

// Video Motor relations
export const videoProjectsRelations = relations(videoProjects, ({ many }) => ({
  artifacts: many(videoArtifacts),
  gateReviews: many(videoGateReviews),
}));

export const videoArtifactsRelations = relations(videoArtifacts, ({ one }) => ({
  project: one(videoProjects, {
    fields: [videoArtifacts.projectId],
    references: [videoProjects.id],
  }),
}));

export const videoGateReviewsRelations = relations(videoGateReviews, ({ one }) => ({
  project: one(videoProjects, {
    fields: [videoGateReviews.projectId],
    references: [videoProjects.id],
  }),
}));

// Web Motor relations
export const webProjectsRelations = relations(webProjects, ({ many }) => ({
  pages: many(webPages),
  artifacts: many(webArtifacts),
  gateResults: many(webGateResults),
  iterationTracking: many(webIterationTracking),
  blogPosts: many(blogPosts),
}));

export const webPagesRelations = relations(webPages, ({ one, many }) => ({
  project: one(webProjects, {
    fields: [webPages.projectId],
    references: [webProjects.id],
  }),
  artifacts: many(webArtifacts),
}));

export const webArtifactsRelations = relations(webArtifacts, ({ one }) => ({
  project: one(webProjects, {
    fields: [webArtifacts.projectId],
    references: [webProjects.id],
  }),
  page: one(webPages, {
    fields: [webArtifacts.pageId],
    references: [webPages.id],
  }),
}));

export const webGateResultsRelations = relations(webGateResults, ({ one }) => ({
  project: one(webProjects, {
    fields: [webGateResults.projectId],
    references: [webProjects.id],
  }),
}));

export const webIterationTrackingRelations = relations(webIterationTracking, ({ one }) => ({
  project: one(webProjects, {
    fields: [webIterationTracking.projectId],
    references: [webProjects.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  project: one(webProjects, {
    fields: [blogPosts.projectId],
    references: [webProjects.id],
  }),
}));

// Fase 3 — Analyst relations
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [campaigns.organizationId],
    references: [organizationSettings.organizationId],
  }),
  videoProject: one(videoProjects, {
    fields: [campaigns.videoProjectId],
    references: [videoProjects.id],
  }),
  kpis: many(campaignKpis),
  alerts: many(thresholdAlerts),
  scores: many(campaignScores),
}));

export const campaignKpisRelations = relations(campaignKpis, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignKpis.campaignId],
    references: [campaigns.id],
  }),
}));

export const thresholdAlertsRelations = relations(thresholdAlerts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [thresholdAlerts.campaignId],
    references: [campaigns.id],
  }),
}));

export const campaignScoresRelations = relations(campaignScores, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignScores.campaignId],
    references: [campaigns.id],
  }),
}));

// Fase 4 — Strategist relations
export const strategicDiagnosesRelations = relations(strategicDiagnoses, ({ many }) => ({
  marketingPlans: many(marketingPlans),
}));

export const marketingPlansRelations = relations(marketingPlans, ({ one, many }) => ({
  diagnosis: one(strategicDiagnoses, {
    fields: [marketingPlans.diagnosisId],
    references: [strategicDiagnoses.id],
  }),
  campaigns: many(marketingPlanCampaigns),
}));

export const marketingPlanCampaignsRelations = relations(marketingPlanCampaigns, ({ one }) => ({
  plan: one(marketingPlans, {
    fields: [marketingPlanCampaigns.planId],
    references: [marketingPlans.id],
  }),
  linkedCampaign: one(campaigns, {
    fields: [marketingPlanCampaigns.linkedCampaignId],
    references: [campaigns.id],
  }),
}));

export const clientIntelligenceRelations = relations(clientIntelligence, ({ one }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [clientIntelligence.organizationId],
    references: [organizationSettings.organizationId],
  }),
}));

// ─── Fase 6: MARA + Client Portal ─────────────────────────────────────────────

// mara_play_pause — per-org play/pause toggle and invocation budget (DEC-131, DEC-157, DEC-158)
// One row per org. Upserted on toggle. Invocations reset per billing period.
export const maraPlayPause = pgTable('mara_play_pause', {
  organizationId: text('organization_id')
    .primaryKey()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // play = MARA can invoke token-consuming agents; pause = free responses only
  playMode: boolean('play_mode').notNull().default(false),
  // Total paid invocations consumed in current billing period
  invocationsThisPeriod: integer('invocations_this_period').notNull().default(0),
  // Max paid invocations per session (DEC-157: 5 per session)
  sessionBudget: integer('session_budget').notNull().default(5),
  // Billing period reset timestamp
  periodResetsAt: timestamp('period_resets_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// mara_sessions — one per conversation session (DEC-133: cross-session memory via summaries)
export const maraSessions = pgTable('mara_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // Better Auth user ID (text, not uuid — matches Better Auth schema)
  userId: text('user_id').notNull(),
  // active | ended | timed_out
  status: varchar('status', { length: 20 }).notNull().default('active'),
  // Paid invocations consumed in this session (max 5 per DEC-157)
  invocationsUsed: integer('invocations_used').notNull().default(0),
  // Cross-session summary generated when session ends (DEC-133)
  summary: text('summary'),
  // Topics, decisions, pending actions captured in summary
  summaryMeta: jsonb('summary_meta').notNull().default({}),
  // Page/context the client was on when session started
  uiContext: jsonb('ui_context').notNull().default({}),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
}, (table) => [
  index('mara_session_org_idx').on(table.organizationId),
  index('mara_session_org_status_idx').on(table.organizationId, table.status),
  index('mara_session_org_user_idx').on(table.organizationId, table.userId),
]);

// mara_messages — individual messages within a session
export const maraMessages = pgTable('mara_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => maraSessions.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => authOrganization.id, { onDelete: 'cascade' }),
  // user | assistant
  role: varchar('role', { length: 10 }).notNull(),
  content: text('content').notNull(),
  // Intent classification result (DEC-129): data_lookup | interpretation | strategic_decision |
  //   brand_action | operational_action | navigation
  intentCategory: varchar('intent_category', { length: 30 }),
  // Which agent/system was invoked to answer (null if answered from Output Registry or free)
  routedTo: varchar('routed_to', { length: 50 }),
  // Whether this response came from Output Registry (cache hit) vs fresh invocation
  outputRegistryHit: boolean('output_registry_hit').notNull().default(false),
  // Tokens consumed by any downstream agent invocation (0 = free)
  tokensConsumed: integer('tokens_consumed').notNull().default(0),
  // UI context at the time of the message (what page/section the client was viewing)
  uiContext: jsonb('ui_context').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('mara_msg_session_idx').on(table.sessionId),
  index('mara_msg_org_idx').on(table.organizationId),
]);

// ─── Relations: MARA ──────────────────────────────────────────────────────────

export const maraSessionsRelations = relations(maraSessions, ({ one, many }) => ({
  organizationSettings: one(organizationSettings, {
    fields: [maraSessions.organizationId],
    references: [organizationSettings.organizationId],
  }),
  messages: many(maraMessages),
}));

export const maraMessagesRelations = relations(maraMessages, ({ one }) => ({
  session: one(maraSessions, {
    fields: [maraMessages.sessionId],
    references: [maraSessions.id],
  }),
}));
