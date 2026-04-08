import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import {
  getAutonomyConfig,
  resolveAutonomyLevel,
  upsertAutonomyConfig,
} from "../services/security/autonomy-manager.js";
import { runIsolationAudit } from "../services/security/data-protector.js";
import {
  getMotorGateConfig,
  upsertMotorGateConfig,
  getGateStats,
} from "../services/security/gate-manager.js";
import {
  queryAuditLog,
  exportAuditCSV,
} from "../services/security/audit-service.js";
import {
  upsertAutonomyConfigSchema,
  upsertGateConfigSchema,
  approvalResponseSchema,
  parseBody,
} from "./validators.js";

export const securityRoutes = new Hono();

// ── C-045: Autonomy ──

// GET /api/security/:clientId/autonomy
securityRoutes.get("/api/security/:clientId/autonomy", async (c) => {
  const config = await getAutonomyConfig(c.req.param("clientId"));
  if (!config) {
    return c.json({
      clientId: c.req.param("clientId"),
      globalLevel: 3,
      overrides: [],
      escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
    });
  }
  return c.json(config);
});

// PUT /api/security/:clientId/autonomy
securityRoutes.put("/api/security/:clientId/autonomy", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(upsertAutonomyConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const config = await upsertAutonomyConfig(c.req.param("clientId"), parsed.data);
  return c.json(config);
});

// GET /api/security/:clientId/autonomy/effective
securityRoutes.get("/api/security/:clientId/autonomy/effective", async (c) => {
  const clientId = c.req.param("clientId");
  const motors = [
    "video-production", "brand-builder", "strategist", "graphic-design",
    "writers-room", "audio", "web", "community-management", "ads",
  ];
  const resolved = await Promise.all(
    motors.map(async (motor) => ({
      motor,
      ...(await resolveAutonomyLevel(clientId, motor)),
    })),
  );
  return c.json(resolved);
});

// ── C-045: Approval Queue ──

// GET /api/security/:clientId/approvals
securityRoutes.get("/api/security/:clientId/approvals", async (c) => {
  const clientId = c.req.param("clientId");
  const status = c.req.query("status") ?? "pending";
  const approvals = await db
    .select()
    .from(schema.approvalRequests)
    .where(
      and(
        eq(schema.approvalRequests.clientId, clientId),
        eq(schema.approvalRequests.status, status as any),
      ),
    )
    .orderBy(desc(schema.approvalRequests.createdAt));
  return c.json(approvals);
});

// GET /api/security/:clientId/approvals/:approvalId
securityRoutes.get("/api/security/:clientId/approvals/:approvalId", async (c) => {
  const [approval] = await db
    .select()
    .from(schema.approvalRequests)
    .where(
      and(
        eq(schema.approvalRequests.id, c.req.param("approvalId")),
        eq(schema.approvalRequests.clientId, c.req.param("clientId")),
      ),
    );
  if (!approval) return c.json({ error: "Not found" }, 404);
  return c.json(approval);
});

// POST /api/security/:clientId/approvals/:approvalId/respond
securityRoutes.post("/api/security/:clientId/approvals/:approvalId/respond", async (c) => {
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
    .where(
      and(
        eq(schema.approvalRequests.id, c.req.param("approvalId")),
        eq(schema.approvalRequests.clientId, c.req.param("clientId")),
      ),
    )
    .returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// GET /api/security/:clientId/approvals/history
securityRoutes.get("/api/security/:clientId/approvals/history", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "50");
  const approvals = await db
    .select()
    .from(schema.approvalRequests)
    .where(eq(schema.approvalRequests.clientId, clientId))
    .orderBy(desc(schema.approvalRequests.createdAt))
    .limit(limit);
  return c.json(approvals);
});

// ── C-046: Data Protection ──

// GET /api/security/:clientId/isolation-status
securityRoutes.get("/api/security/:clientId/isolation-status", async (c) => {
  const result = await runIsolationAudit(c.req.param("clientId"));
  return c.json(result);
});

// POST /api/security/run-audit (admin-only, no :clientId in path)
securityRoutes.post("/api/security/run-audit", async (c) => {
  const body = await c.req.json();
  const clientId = body?.clientId;
  if (!clientId) return c.json({ error: "clientId is required" }, 400);
  const result = await runIsolationAudit(clientId);
  return c.json(result);
});

// ── C-046: Audit Log ──

// GET /api/security/:clientId/audit
securityRoutes.get("/api/security/:clientId/audit", async (c) => {
  const clientId = c.req.param("clientId");
  const action = c.req.query("action");
  const actorType = c.req.query("actorType") as "agent" | "human" | "system" | undefined;
  const resourceType = c.req.query("resourceType");
  const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const entries = await queryAuditLog({ clientId, action, actorType, resourceType, from, to, limit, offset });
  return c.json(entries);
});

// GET /api/security/:clientId/audit/export
securityRoutes.get("/api/security/:clientId/audit/export", async (c) => {
  const clientId = c.req.param("clientId");
  const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;
  const csv = await exportAuditCSV(clientId, from, to);
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", `attachment; filename="audit-${clientId}.csv"`);
  return c.text(csv);
});

// ── C-047: Gate Configuration ──

// GET /api/security/:clientId/gates
securityRoutes.get("/api/security/:clientId/gates", async (c) => {
  const clientId = c.req.param("clientId");
  const motors = [
    "video-production", "brand-builder", "strategist", "graphic-design",
    "writers-room", "audio", "web", "community-management", "ads",
  ];
  const configs = await Promise.all(
    motors.map((motor) => getMotorGateConfig(clientId, motor)),
  );
  return c.json(configs);
});

// PUT /api/security/:clientId/gates/:motor
securityRoutes.put("/api/security/:clientId/gates/:motor", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(upsertGateConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const config = await upsertMotorGateConfig(
    c.req.param("clientId"),
    c.req.param("motor"),
    parsed.data.gates,
  );
  return c.json(config);
});

// GET /api/security/:clientId/gates/stats
securityRoutes.get("/api/security/:clientId/gates/stats", async (c) => {
  const stats = await getGateStats(c.req.param("clientId"));
  return c.json(stats);
});
