import { Hono } from "hono";
import { parseBody, startDiagnosisSchema, startRepositioningSchema, recordPerceptionSchema } from "./validators.js";
import { runPerceptionAudit, runGapAnalysis, definePositioning, validatePositioning } from "../services/positioning/diagnosis.js";
import { runCurrentAudit, defineTargetPositioning, createTransitionPlan, designPhases, recordPerceptionMeasurement, getPerceptionHistory } from "../services/positioning/repositioning.js";

export const positioningRoutes = new Hono();

// ── Diagnosis (C-048) ──

positioningRoutes.post("/api/positioning/:clientId/diagnose", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(startDiagnosisSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { brandName, brandDna, listenerData } = parsed.data;

  const auditResult = await runPerceptionAudit(clientId, {
    brandName,
    brandDna: brandDna ?? "",
    listenerData: listenerData ?? "",
  });

  return c.json(auditResult, 201);
});

positioningRoutes.get("/api/positioning/:clientId/current", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, message: "No positioning document found. Start a diagnosis first." });
});

positioningRoutes.get("/api/positioning/:clientId/perception", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, message: "No perception data available. Run a perception audit first." });
});

// ── Repositioning (C-049) ──

positioningRoutes.post("/api/positioning/:clientId/reposition", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(startRepositioningSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { brandName, businessStrategy, brandDna } = parsed.data;

  const auditResult = await runCurrentAudit(clientId, {
    brandName,
    brandDna: brandDna ?? "",
    listenerHistory: "",
    contentArtifacts: "",
  });

  return c.json(auditResult, 201);
});

positioningRoutes.get("/api/positioning/:clientId/transition", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, message: "No active transition plan." });
});

positioningRoutes.get("/api/positioning/:clientId/transition/phases", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, phases: [] });
});

positioningRoutes.get("/api/positioning/:clientId/transition/tracking", async (c) => {
  const clientId = c.req.param("clientId");
  const projectId = c.req.query("projectId");
  if (!projectId) return c.json({ error: "projectId query param required" }, 400);
  const history = await getPerceptionHistory(clientId, projectId);
  return c.json(history);
});

positioningRoutes.post("/api/positioning/:clientId/tracking", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(recordPerceptionSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await recordPerceptionMeasurement(clientId, parsed.data);
  return c.json(result, 201);
});
