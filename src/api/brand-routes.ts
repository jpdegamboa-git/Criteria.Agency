import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { validateContent } from "../services/brand-guardian/guardian-engine.js";
import { extractRuleFromFeedback } from "../services/brand-guardian/rule-learner.js";
import { regenerateManual } from "../services/brand-guardian/manual-generator.js";
import {
  validateContentSchema,
  createBrandRuleSchema,
  updateBrandRuleSchema,
  upsertBrandGuardianConfigSchema,
  brandOverrideSchema,
  parseBody,
} from "./validators.js";

export const brandRoutes = new Hono();

// ── Validate Content ──

brandRoutes.post("/api/brand/:clientId/validate", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(validateContentSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const result = await validateContent({
    clientId,
    content: parsed.data.content,
    contentType: parsed.data.contentType,
    projectId: parsed.data.projectId,
    brandDna: parsed.data.brandDna,
  });

  return c.json(result);
});

// ── Validation History ──

brandRoutes.get("/api/brand/:clientId/validations", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "20");
  const validations = await db
    .select()
    .from(schema.brandValidations)
    .where(eq(schema.brandValidations.clientId, clientId))
    .orderBy(desc(schema.brandValidations.createdAt))
    .limit(limit);
  return c.json(validations);
});

// ── Brand Score (latest) ──

brandRoutes.get("/api/brand/:clientId/score", async (c) => {
  const clientId = c.req.param("clientId");
  const [latest] = await db
    .select()
    .from(schema.brandValidations)
    .where(eq(schema.brandValidations.clientId, clientId))
    .orderBy(desc(schema.brandValidations.createdAt))
    .limit(1);

  if (!latest) return c.json({ score: null, message: "No validations yet" });
  return c.json({
    score: latest.overallScore,
    verdict: latest.verdict,
    summary: latest.summary,
    validatedAt: latest.createdAt,
  });
});

// ── Override Validation ──

brandRoutes.post("/api/brand/:clientId/validations/:validationId/override", async (c) => {
  const { clientId, validationId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(brandOverrideSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [validation] = await db
    .select()
    .from(schema.brandValidations)
    .where(
      and(
        eq(schema.brandValidations.id, validationId),
        eq(schema.brandValidations.clientId, clientId),
      ),
    );

  if (!validation) return c.json({ error: "Validation not found" }, 404);

  await db
    .update(schema.brandValidations)
    .set({
      humanOverride: parsed.data.action,
      humanFeedback: parsed.data.feedback,
    })
    .where(eq(schema.brandValidations.id, validationId));

  const dimensions = (validation.dimensions as any[]) ?? [];
  const extracted = await extractRuleFromFeedback(
    parsed.data.feedback,
    parsed.data.action,
    dimensions,
  );

  const [newRule] = await db
    .insert(schema.brandRules)
    .values({
      clientId,
      dimension: extracted.dimension,
      type: extracted.type as any,
      rule: extracted.rule,
      source: "human_feedback" as any,
      examples: extracted.examples as any,
      confidence: String(extracted.confidence),
    })
    .returning();

  return c.json({ override: parsed.data.action, learnedRule: newRule });
});

// ── Brand Rules ──

brandRoutes.get("/api/brand/:clientId/rules", async (c) => {
  const clientId = c.req.param("clientId");
  const rules = await db
    .select()
    .from(schema.brandRules)
    .where(eq(schema.brandRules.clientId, clientId))
    .orderBy(desc(schema.brandRules.createdAt));
  return c.json(rules);
});

brandRoutes.post("/api/brand/:clientId/rules", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(createBrandRuleSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [rule] = await db
    .insert(schema.brandRules)
    .values({
      clientId,
      dimension: parsed.data.dimension,
      type: parsed.data.type as any,
      rule: parsed.data.rule,
      source: (parsed.data.source ?? "human_feedback") as any,
      examples: parsed.data.examples as any,
    })
    .returning();

  return c.json(rule, 201);
});

brandRoutes.patch("/api/brand/:clientId/rules/:ruleId", async (c) => {
  const { clientId, ruleId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(updateBrandRuleSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const updates: Record<string, unknown> = {};
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.rule !== undefined) updates.rule = parsed.data.rule;
  if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
  if (parsed.data.examples !== undefined) updates.examples = parsed.data.examples;

  const [updated] = await db
    .update(schema.brandRules)
    .set(updates)
    .where(
      and(
        eq(schema.brandRules.id, ruleId),
        eq(schema.brandRules.clientId, clientId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Rule not found" }, 404);
  return c.json(updated);
});

// ── Config ──

brandRoutes.get("/api/brand/:clientId/config", async (c) => {
  const clientId = c.req.param("clientId");
  const [config] = await db
    .select()
    .from(schema.brandGuardianConfigs)
    .where(eq(schema.brandGuardianConfigs.clientId, clientId));

  if (!config) {
    return c.json({
      clientId,
      passThreshold: 80,
      autoPassThreshold: 95,
      strictMode: false,
      weightsByDimension: {},
    });
  }
  return c.json(config);
});

brandRoutes.put("/api/brand/:clientId/config", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(upsertBrandGuardianConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [existing] = await db
    .select()
    .from(schema.brandGuardianConfigs)
    .where(eq(schema.brandGuardianConfigs.clientId, clientId));

  if (existing) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.passThreshold !== undefined) updates.passThreshold = parsed.data.passThreshold;
    if (parsed.data.autoPassThreshold !== undefined) updates.autoPassThreshold = parsed.data.autoPassThreshold;
    if (parsed.data.strictMode !== undefined) updates.strictMode = parsed.data.strictMode;
    if (parsed.data.weightsByDimension !== undefined) updates.weightsByDimension = parsed.data.weightsByDimension;

    const [updated] = await db
      .update(schema.brandGuardianConfigs)
      .set(updates)
      .where(eq(schema.brandGuardianConfigs.id, existing.id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(schema.brandGuardianConfigs)
    .values({
      clientId,
      passThreshold: parsed.data.passThreshold ?? 80,
      autoPassThreshold: parsed.data.autoPassThreshold ?? 95,
      strictMode: parsed.data.strictMode ?? false,
      weightsByDimension: (parsed.data.weightsByDimension ?? {}) as any,
    })
    .returning();
  return c.json(created, 201);
});

// ── Brand Manual ──

brandRoutes.get("/api/brand/:clientId/manual", async (c) => {
  const clientId = c.req.param("clientId");
  const [manual] = await db
    .select()
    .from(schema.brandManuals)
    .where(
      and(
        eq(schema.brandManuals.clientId, clientId),
        eq(schema.brandManuals.published, true),
      ),
    )
    .orderBy(desc(schema.brandManuals.version))
    .limit(1);

  if (!manual) return c.json({ error: "No brand manual generated yet" }, 404);
  return c.json(manual);
});

brandRoutes.get("/api/brand/:clientId/manual/versions", async (c) => {
  const clientId = c.req.param("clientId");
  const versions = await db
    .select({
      id: schema.brandManuals.id,
      version: schema.brandManuals.version,
      shareToken: schema.brandManuals.shareToken,
      published: schema.brandManuals.published,
      generatedAt: schema.brandManuals.generatedAt,
    })
    .from(schema.brandManuals)
    .where(eq(schema.brandManuals.clientId, clientId))
    .orderBy(desc(schema.brandManuals.version));
  return c.json(versions);
});

brandRoutes.post("/api/brand/:clientId/manual/regenerate", async (c) => {
  const clientId = c.req.param("clientId");

  const [run] = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(
      and(
        eq(schema.continuousAgentRuns.clientId, clientId),
        eq(schema.continuousAgentRuns.listenerType, "brand"),
        eq(schema.continuousAgentRuns.step, "report"),
        eq(schema.continuousAgentRuns.status, "completed"),
      ),
    )
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(1);

  let brandDna = "No Brand DNA available.";
  if (run?.outputData) {
    const data = run.outputData as Record<string, unknown>;
    if (typeof data.report === "string") brandDna = data.report;
  }

  const result = await regenerateManual(clientId, brandDna);
  return c.json(result, 201);
});

// ── Public: Brand Manual by Share Token ──

brandRoutes.get("/api/brand/manual/:shareToken", async (c) => {
  const shareToken = c.req.param("shareToken");
  const [manual] = await db
    .select()
    .from(schema.brandManuals)
    .where(
      and(
        eq(schema.brandManuals.shareToken, shareToken),
        eq(schema.brandManuals.published, true),
      ),
    );

  if (!manual) return c.json({ error: "Manual not found" }, 404);
  return c.json({ content: manual.contentMarkdown, version: manual.version, generatedAt: manual.generatedAt });
});
