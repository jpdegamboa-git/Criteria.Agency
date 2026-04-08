// src/api/asset-routes.ts
import { Hono } from "hono";
import {
  listAssets,
  searchAssets,
  getAssetRecommendations,
  getAssetStats,
  recordAssetUsage,
} from "../services/scale/asset-registry.js";

export const assetRoutes = new Hono();

// GET /api/assets/:clientId — Browse asset library
assetRoutes.get("/api/assets/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const typeFilter = c.req.query("type");
  let assets = await listAssets(clientId);

  if (typeFilter) {
    assets = assets.filter((a) => a.type === typeFilter);
  }

  return c.json(assets);
});

// GET /api/assets/:clientId/search — Search by tags
assetRoutes.get("/api/assets/:clientId/search", async (c) => {
  const clientId = c.req.param("clientId");
  const tagsParam = c.req.query("tags") ?? "";
  const tags = tagsParam.split(",").filter(Boolean);

  if (tags.length === 0) {
    return c.json({ error: "Query parameter 'tags' is required" }, 400);
  }

  const results = await searchAssets(clientId, tags);
  return c.json(results);
});

// GET /api/assets/:clientId/recommend — Get recommendations
assetRoutes.get("/api/assets/:clientId/recommend", async (c) => {
  const clientId = c.req.param("clientId");
  const channel = c.req.query("channel") ?? "";
  const tagsParam = c.req.query("tags") ?? "";
  const tags = tagsParam.split(",").filter(Boolean);

  if (!channel) {
    return c.json({ error: "Query parameter 'channel' is required" }, 400);
  }

  const recommendations = await getAssetRecommendations(clientId, channel, tags);
  return c.json(recommendations);
});

// POST /api/assets/:clientId/:id/adapt — Record asset usage/adaptation
assetRoutes.post("/api/assets/:clientId/:id/adapt", async (c) => {
  const assetId = c.req.param("id");
  const body = await c.req.json();
  const channel = body.channel;

  if (!channel) {
    return c.json({ error: "channel is required" }, 400);
  }

  await recordAssetUsage(assetId, channel);
  return c.json({ status: "adapted" });
});

// GET /api/assets/:clientId/stats — Asset utilization stats
assetRoutes.get("/api/assets/:clientId/stats", async (c) => {
  const stats = await getAssetStats(c.req.param("clientId"));
  return c.json(stats);
});
