import { z } from "zod";

// ── Shared ──

const uuid = z.string().uuid();
const positiveAmount = z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a positive number with up to 2 decimal places")
  .or(z.number().positive().transform(String));

// ── Projects ──

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["corporate", "social", "commercial", "music_video", "shortfilm"]).optional(),
  clientName: z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().optional(),
});

export const resumeProjectSchema = z.object({
  resumeTo: z.enum(["brief", "concept", "script", "visual_look", "storyboard", "video_gen", "edit", "audio", "polish", "delivered", "paused"]).optional(),
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

// ── Helper: parse with nice error response ──

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { success: false, error: messages };
}
