import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import {
  createAlertRuleSchema,
  updateAlertStatusSchema,
  approvalResponseSchema,
  upsertDataSourceConfigSchema,
  parseBody,
} from "./validators.js";

export const engineRoutes = new Hono();

// ── Alert Rules ──

engineRoutes.get("/api/engines/alerts/rules/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const rules = await db
    .select()
    .from(schema.alertRules)
    .where(eq(schema.alertRules.clientId, clientId));
  return c.json(rules);
});

engineRoutes.post("/api/engines/alerts/rules/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(createAlertRuleSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const [rule] = await db
    .insert(schema.alertRules)
    .values({
      clientId,
      listenerType: parsed.data.listenerType,
      ruleName: parsed.data.ruleName,
      condition: parsed.data.condition,
      severity: parsed.data.severity,
      notificationChannels: parsed.data.notificationChannels,
    })
    .returning();
  return c.json(rule, 201);
});

// ── Alerts ──

engineRoutes.get("/api/engines/alerts/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const alerts = await db
    .select()
    .from(schema.alerts)
    .where(eq(schema.alerts.clientId, clientId))
    .orderBy(desc(schema.alerts.createdAt))
    .limit(50);
  return c.json(alerts);
});

engineRoutes.patch("/api/engines/alerts/:clientId/:alertId", async (c) => {
  const { alertId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(updateAlertStatusSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const [updated] = await db
    .update(schema.alerts)
    .set({
      status: parsed.data.status,
      resolvedAt: parsed.data.status === "resolved" ? new Date() : undefined,
    })
    .where(eq(schema.alerts.id, alertId))
    .returning();
  if (!updated) return c.json({ error: "Alert not found" }, 404);
  return c.json(updated);
});

// ── Approval Queue ──

engineRoutes.get("/api/engines/approvals/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const approvals = await db
    .select()
    .from(schema.approvalRequests)
    .where(
      and(
        eq(schema.approvalRequests.clientId, clientId),
        eq(schema.approvalRequests.status, "pending"),
      ),
    )
    .orderBy(desc(schema.approvalRequests.createdAt));
  return c.json(approvals);
});

engineRoutes.post("/api/engines/approvals/:clientId/:approvalId/respond", async (c) => {
  const { approvalId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(approvalResponseSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const [updated] = await db
    .update(schema.approvalRequests)
    .set({
      status: parsed.data.status,
      respondedAt: new Date(),
      respondedBy: parsed.data.respondedBy,
      responseNote: parsed.data.note,
    })
    .where(eq(schema.approvalRequests.id, approvalId))
    .returning();
  if (!updated) return c.json({ error: "Approval not found" }, 404);
  return c.json(updated);
});

// ── Audit Log ──

engineRoutes.get("/api/engines/audit/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "50");
  const entries = await db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.clientId, clientId))
    .orderBy(desc(schema.auditLog.timestamp))
    .limit(limit);
  return c.json(entries);
});

// ── Data Source Configs ──

engineRoutes.get("/api/engines/datasources/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const configs = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(eq(schema.dataSourceConfigs.clientId, clientId));
  return c.json(configs);
});

engineRoutes.put("/api/engines/datasources/:clientId/:listenerType", async (c) => {
  const { clientId, listenerType } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(upsertDataSourceConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const existing = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(
      and(
        eq(schema.dataSourceConfigs.clientId, clientId),
        eq(schema.dataSourceConfigs.listenerType, listenerType as any),
      ),
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(schema.dataSourceConfigs)
      .set({ config: parsed.data.config, schedule: parsed.data.schedule, updatedAt: new Date() })
      .where(eq(schema.dataSourceConfigs.id, existing[0].id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(schema.dataSourceConfigs)
    .values({
      clientId,
      listenerType: listenerType as any,
      config: parsed.data.config,
      schedule: parsed.data.schedule ?? "0 6 * * *",
    })
    .returning();
  return c.json(created, 201);
});
