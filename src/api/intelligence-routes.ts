import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import type { ListenerType } from "../shared/engine-types.js";

export const intelligenceRoutes = new Hono();

// Helper: fetch latest completed report for a listener type
async function getLatestReport(clientId: string, listenerType: ListenerType) {
  const [run] = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(
      and(
        eq(schema.continuousAgentRuns.clientId, clientId),
        eq(schema.continuousAgentRuns.listenerType, listenerType),
        eq(schema.continuousAgentRuns.step, "report"),
        eq(schema.continuousAgentRuns.status, "completed"),
      ),
    )
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(1);

  return run ?? null;
}

// Dashboard — overview of all listeners
intelligenceRoutes.get("/api/intelligence/:clientId/dashboard", async (c) => {
  const clientId = c.req.param("clientId");
  const [brand, culture, industry, competitive, opportunities] = await Promise.all([
    getLatestReport(clientId, "brand"),
    getLatestReport(clientId, "culture"),
    getLatestReport(clientId, "industry"),
    getLatestReport(clientId, "competitive"),
    getLatestReport(clientId, "opportunity"),
  ]);

  return c.json({ brand, culture, industry, competitive, opportunities });
});

// Individual listener reports
intelligenceRoutes.get("/api/intelligence/:clientId/brand", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "brand");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/culture", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "culture");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/industry", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "industry");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/competitive", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "competitive");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/opportunities", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "opportunity");
  return c.json(report);
});

// Trigger on-demand listener run
intelligenceRoutes.post("/api/intelligence/:clientId/run/:listenerType", async (c) => {
  const clientId = c.req.param("clientId");
  const listenerType = c.req.param("listenerType") as ListenerType;

  const validTypes: ListenerType[] = ["brand", "culture", "industry", "competitive", "opportunity"];
  if (!validTypes.includes(listenerType)) {
    return c.json({ error: `Invalid listener type: ${listenerType}` }, 400);
  }

  const { runListener } = await import("../services/intelligence/run-listener.js");
  const result = await runListener(clientId, listenerType);
  return c.json(result);
});

// Alerts
intelligenceRoutes.get("/api/intelligence/:clientId/alerts", async (c) => {
  const clientId = c.req.param("clientId");
  const alerts = await db
    .select()
    .from(schema.alerts)
    .where(eq(schema.alerts.clientId, clientId))
    .orderBy(desc(schema.alerts.createdAt))
    .limit(50);
  return c.json(alerts);
});

intelligenceRoutes.patch("/api/intelligence/:clientId/alerts/:alertId", async (c) => {
  const { alertId } = c.req.param();
  const body = await c.req.json();
  const [updated] = await db
    .update(schema.alerts)
    .set({
      status: body.status,
      resolvedAt: body.status === "resolved" ? new Date() : undefined,
    })
    .where(eq(schema.alerts.id, alertId))
    .returning();
  if (!updated) return c.json({ error: "Alert not found" }, 404);
  return c.json(updated);
});

// Data source configs
intelligenceRoutes.get("/api/intelligence/:clientId/config", async (c) => {
  const clientId = c.req.param("clientId");
  const configs = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(eq(schema.dataSourceConfigs.clientId, clientId));
  return c.json(configs);
});

intelligenceRoutes.put("/api/intelligence/:clientId/config/:type", async (c) => {
  const { clientId } = c.req.param();
  const listenerType = c.req.param("type") as ListenerType;
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(
      and(
        eq(schema.dataSourceConfigs.clientId, clientId),
        eq(schema.dataSourceConfigs.listenerType, listenerType),
      ),
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(schema.dataSourceConfigs)
      .set({ config: body.config, schedule: body.schedule, updatedAt: new Date() })
      .where(eq(schema.dataSourceConfigs.id, existing[0].id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(schema.dataSourceConfigs)
    .values({
      clientId,
      listenerType,
      config: body.config,
      schedule: body.schedule ?? "0 6 * * *",
    })
    .returning();
  return c.json(created, 201);
});

// History
intelligenceRoutes.get("/api/intelligence/:clientId/history", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "50");
  const runs = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(eq(schema.continuousAgentRuns.clientId, clientId))
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(limit);
  return c.json(runs);
});
