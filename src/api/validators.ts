import { z } from "zod";

// ── Shared ──

const uuid = z.string().uuid();
const positiveAmount = z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a positive number with up to 2 decimal places")
  .or(z.number().positive().transform(String));

// ── Projects ──

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["corporate", "explainer", "documentary", "fiction", "micro_content", "commercial"]).optional(),
  pipelineType: z.enum([
    "video-production", "brand-builder", "strategist", "graphic-design",
    "writers-room", "audio", "web", "marketplace", "print-production",
    "events", "ads", "community-management", "email-marketing",
    "seo-content", "channel-manager", "sales-crm", "financial",
    "analytics", "security",
  ]).optional(),
  parentProjectId: z.string().uuid().optional(),
  clientName: z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().optional(),
});

export const resumeProjectSchema = z.object({
  resumeTo: z.enum([
    // Video production
    "brief", "concept", "script", "visual_look", "storyboard", "video_gen", "edit", "audio", "polish",
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
    // Financial
    "fn_request", "fn_budget", "fn_tracking", "fn_pl", "fn_deliver",
    // Analytics
    "an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver",
    // Security
    "sec_audit", "sec_scan", "sec_remediate", "sec_report", "sec_deliver",
    // Shared
    "delivered", "paused",
  ]).optional(),
});

// ── Transactions ──

export const updateTransactionSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  subcategory: z.string().min(1).max(100).nullish(),
  type: z.enum(["income", "expense"]).optional(),
  notes: z.string().max(2000).nullish(),
  entityId: uuid.nullish(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const reconcileTransactionSchema = z.object({
  expectedPaymentId: uuid,
});

// ── Expected Payments ──

export const createExpectedPaymentSchema = z.object({
  clientId: uuid,
  amount: positiveAmount,
  currency: z.string().length(3).default("USD"),
  description: z.string().min(1).max(500),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateExpectedPaymentSchema = z.object({
  amount: positiveAmount.optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(["pending", "received", "partial", "overdue", "canceled"]).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

// ── Categorization Rules ──

export const createRuleSchema = z.object({
  pattern: z.string().min(1).max(500),
  matchType: z.enum(["contains", "exact", "regex"]).default("contains"),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).nullish(),
  transactionType: z.enum(["income", "expense"]),
  priority: z.number().int().min(0).max(100).default(10),
}).superRefine((data, ctx) => {
  if (data.matchType === "regex") {
    try {
      new RegExp(data.pattern);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid regex pattern",
        path: ["pattern"],
      });
    }
  }
});

// ── Entities ──

export const createEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["vendor", "client", "personal", "unknown"]).default("unknown"),
  clientId: uuid.nullish(),
  patterns: z.array(z.string()).default([]),
  defaultCategory: z.string().max(100).nullish(),
  notes: z.string().max(2000).nullish(),
});

export const updateEntitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["vendor", "client", "personal", "unknown"]).optional(),
  defaultCategory: z.string().max(100).nullish(),
  patterns: z.array(z.string()).optional(),
  notes: z.string().max(2000).nullish(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const addPatternSchema = z.object({
  pattern: z.string().min(1).max(500),
});

// ── Invoices ──

export const createInvoiceSchema = z.object({
  direction: z.enum(["issued", "received"]),
  entityId: uuid,
  invoiceNumber: z.string().max(100).nullish(),
  amount: positiveAmount,
  currency: z.string().length(3).default("USD"),
  issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullish(),
  notes: z.string().max(2000).nullish(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(["pending", "partial", "paid", "overdue", "canceled"]).optional(),
  notes: z.string().max(2000).nullish(),
  invoiceNumber: z.string().max(100).nullish(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const linkTransactionInvoiceSchema = z.object({
  invoiceId: uuid,
  amount: positiveAmount,
});

// ── Content ──

const contentTypes = ["linkedin_post", "email_nurture", "blog_article", "social_caption", "landing_copy"] as const;
const contentStatuses = ["draft", "review", "approved", "published"] as const;

export const generateContentSchema = z.object({
  type: z.enum(contentTypes),
  topic: z.string().min(1).max(500),
  audience: z.string().min(1).max(500),
  tone: z.string().min(1).max(100),
  keyMessage: z.string().min(1).max(1000),
  cta: z.string().min(1).max(500),
  additionalContext: z.string().max(2000).optional(),
});

export const updateContentSchema = z.object({
  status: z.enum(contentStatuses).optional(),
  content: z.string().optional(),
  title: z.string().max(300).optional(),
});

export const reviseContentSchema = z.object({
  feedback: z.string().min(1).max(2000),
});

// ── Copilot ──

export const copilotMessageSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(5000).optional(),
  clientId: z.string().uuid().optional(),
});

// ── Review ──

export const reviewCommentSchema = z.object({
  text: z.string().min(1).max(5000),
  authorName: z.string().max(200).optional(),
});

export const reviewStatusSchema = z.object({
  action: z.enum(["approve", "revision_requested"]),
});

// ── Engine: Alert Rules ──

export const createAlertRuleSchema = z.object({
  listenerType: z.enum(["brand", "culture", "industry", "competitive", "opportunity"]),
  ruleName: z.string().min(1).max(255),
  condition: z.record(z.unknown()),
  severity: z.enum(["info", "warning", "critical"]),
  notificationChannels: z.array(z.string()).default([]),
});

// ── Engine: Alerts ──

export const updateAlertStatusSchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved", "dismissed"]),
});

// ── Engine: Approval Responses ──

export const approvalResponseSchema = z.object({
  status: z.enum(["approved", "rejected", "escalated", "expired"]),
  respondedBy: z.string().min(1).max(255),
  note: z.string().max(2000).optional(),
});

// ── Engine: Data Source Configs ──

export const upsertDataSourceConfigSchema = z.object({
  config: z.record(z.unknown()),
  schedule: z.string().regex(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/).optional(),
});

// ── Canvas: Agent Skill File ──

export const updateAgentFileSchema = z.object({
  content: z.string().min(1),
});

// ── Checkout ──

export const createCheckoutSchema = z.object({
  tier: z.enum(["starter", "pro"]),
  billingPeriod: z.enum(["monthly", "yearly"]),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().min(1).max(200),
});

// ── Helper: parse with nice error response ──

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { success: false, error: messages };
}
