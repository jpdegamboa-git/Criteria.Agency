// src/api/analytics-routes.ts

import { Hono } from "hono";
import {
  parseBody,
  dashboardQuerySchema,
  dashboardConfigUpdateSchema,
  metricsQuerySchema,
  attributionQuerySchema,
  generateReportSchema,
  nlQuerySchema,
  queryFeedbackSchema,
  collectMetricsSchema,
} from "./validators.js";
import { buildDashboard, getDashboardConfig, saveDashboardConfig } from "../services/analytics/dashboard-builder.js";
import { queryMetrics, collectExternalMetrics, getDataSources } from "../services/analytics/data-collector.js";
import { computeAttribution } from "../services/analytics/attribution.js";
import { calculateUnitEconomics, computeCohorts } from "../services/analytics/unit-economics.js";
import { generateReport, listReports, getReport } from "../services/analytics/report-generator.js";
import { processNLQuery, getQueryHistory, recordQueryFeedback } from "../services/analytics/nl-query-engine.js";
import type { DashboardType } from "../services/analytics/types.js";

export const analyticsRoutes = new Hono();

// ── Dashboards ──

analyticsRoutes.get("/api/analytics/:clientId/dashboard/:type", async (c) => {
  const clientId = c.req.param("clientId");
  const dashboardType = c.req.param("type") as DashboardType;
  const validTypes = ["executive", "channel", "content", "funnel", "financial"];
  if (!validTypes.includes(dashboardType)) return c.json({ error: "Invalid dashboard type" }, 400);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const dateRange = {
    start: thirtyDaysAgo.toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };

  const dashboard = await buildDashboard(clientId, dashboardType, dateRange);
  return c.json(dashboard);
});

analyticsRoutes.get("/api/analytics/:clientId/dashboard/config", async (c) => {
  const clientId = c.req.param("clientId");
  const configs: Record<string, unknown> = {};
  const types = ["executive", "channel", "content", "funnel", "financial"] as const;
  for (const type of types) {
    configs[type] = await getDashboardConfig(clientId, type);
  }
  return c.json(configs);
});

analyticsRoutes.put("/api/analytics/:clientId/dashboard/config", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(dashboardConfigUpdateSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const dashboardType = (body.dashboardType ?? "executive") as DashboardType;
  await saveDashboardConfig(clientId, dashboardType, {
    clientId,
    dashboardType,
    widgets: parsed.data.widgets as any,
    refreshInterval: parsed.data.refreshInterval ?? 300,
  });
  return c.json({ status: "updated" });
});

// ── Metrics ──

analyticsRoutes.get("/api/analytics/:clientId/metrics", async (c) => {
  const clientId = c.req.param("clientId");
  const metricsParam = c.req.query("metrics")?.split(",") ?? [];
  const start = c.req.query("start") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const data = await queryMetrics(clientId, metricsParam, { start, end });
  return c.json(data);
});

analyticsRoutes.get("/api/analytics/:clientId/metrics/compare", async (c) => {
  const clientId = c.req.param("clientId");
  const metricsParam = c.req.query("metrics")?.split(",") ?? [];
  const start = c.req.query("start") ?? "";
  const end = c.req.query("end") ?? "";
  if (!start || !end) return c.json({ error: "start and end required" }, 400);

  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const prevEnd = new Date(new Date(start).getTime() - 1).toISOString().split("T")[0];
  const prevStart = new Date(new Date(start).getTime() - 1 - durationMs).toISOString().split("T")[0];

  const current = await queryMetrics(clientId, metricsParam, { start, end });
  const previous = await queryMetrics(clientId, metricsParam, { start: prevStart, end: prevEnd });
  return c.json({ current, previous });
});

// ── Attribution ──

analyticsRoutes.get("/api/analytics/:clientId/attribution", async (c) => {
  const clientId = c.req.param("clientId");
  const model = (c.req.query("model") ?? "linear") as any;
  const start = c.req.query("start") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const report = await computeAttribution(clientId, model, { start, end });
  return c.json(report);
});

analyticsRoutes.get("/api/analytics/:clientId/attribution/paths", async (c) => {
  const clientId = c.req.param("clientId");
  const start = c.req.query("start") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const report = await computeAttribution(clientId, "linear", { start, end });
  return c.json(report.pathAnalysis);
});

// ── Unit Economics ──

analyticsRoutes.get("/api/analytics/:clientId/unit-economics", async (c) => {
  const clientId = c.req.param("clientId");
  const start = c.req.query("start") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const economics = await calculateUnitEconomics(clientId, { start, end });
  return c.json(economics);
});

analyticsRoutes.get("/api/analytics/:clientId/unit-economics/cohorts", async (c) => {
  const clientId = c.req.param("clientId");
  const start = c.req.query("start") ?? new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
  const end = c.req.query("end") ?? new Date().toISOString().split("T")[0];
  const cohorts = await computeCohorts(clientId, { start, end });
  return c.json(cohorts);
});

// ── Reports ──

analyticsRoutes.get("/api/analytics/:clientId/reports", async (c) => {
  const clientId = c.req.param("clientId");
  const reports = await listReports(clientId);
  return c.json(reports);
});

analyticsRoutes.get("/api/analytics/:clientId/reports/:reportId", async (c) => {
  const report = await getReport(c.req.param("reportId"));
  if (!report) return c.json({ error: "Not found" }, 404);
  return c.json(report);
});

analyticsRoutes.post("/api/analytics/:clientId/reports/generate", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(generateReportSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const report = await generateReport(clientId, parsed.data.type, parsed.data.dateRange);
  return c.json(report, 201);
});

// ── NL Queries ──

analyticsRoutes.post("/api/analytics/:clientId/query", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(nlQuerySchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await processNLQuery(clientId, parsed.data.question);
  return c.json(result, 201);
});

analyticsRoutes.get("/api/analytics/:clientId/query/history", async (c) => {
  const clientId = c.req.param("clientId");
  const history = await getQueryHistory(clientId);
  return c.json(history);
});

analyticsRoutes.post("/api/analytics/:clientId/query/:queryId/feedback", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(queryFeedbackSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  await recordQueryFeedback(c.req.param("queryId"), parsed.data.feedback);
  return c.json({ status: "recorded" });
});

// ── Data Collection ──

analyticsRoutes.post("/api/analytics/:clientId/collect", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(collectMetricsSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await collectExternalMetrics(clientId, parsed.data.dateRange);
  return c.json(result, 201);
});

analyticsRoutes.get("/api/analytics/:clientId/sources", async (c) => {
  const sources = getDataSources();
  return c.json(sources);
});
