// src/api/capacity-routes.ts
import { Hono } from "hono";
import {
  getCurrentCapacity,
  getCapacityHistory,
  buildHealthEntry,
} from "../services/scale/capacity-manager.js";
import { AGENT_REGISTRY } from "../agents/registry.js";

export const capacityRoutes = new Hono();

// GET /api/capacity — Current capacity overview
capacityRoutes.get("/api/capacity", async (c) => {
  const overview = await getCurrentCapacity();
  return c.json(overview);
});

// GET /api/capacity/health — Agent health dashboard
capacityRoutes.get("/api/capacity/health", async (c) => {
  const agentIds = Object.keys(AGENT_REGISTRY);
  const healthEntries = agentIds.map((id) =>
    buildHealthEntry(id, 0, 1, 0, 0, null),
  );
  return c.json({ agents: healthEntries, total: healthEntries.length });
});

// GET /api/capacity/history — Capacity utilization over time
capacityRoutes.get("/api/capacity/history", async (c) => {
  const limitParam = c.req.query("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const history = await getCapacityHistory(limit);
  return c.json(history);
});
