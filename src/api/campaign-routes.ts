// src/api/campaign-routes.ts
import { Hono } from "hono";
import { parseBody, createCampaignSchema } from "./validators.js";
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  dispatchCampaign,
  getCampaignProgress,
  consolidateCampaign,
} from "../services/scale/campaign-orchestrator.js";

export const campaignRoutes = new Hono();

// POST /api/campaigns/:clientId — Create campaign from brief
campaignRoutes.post("/api/campaigns/:clientId", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createCampaignSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const clientId = c.req.param("clientId");
  const { name, briefText, channels, budgetTotal, currency, briefProjectId, brandDnaProjectId } = parsed.data;

  const campaign = await createCampaign(
    clientId,
    name,
    briefText,
    channels,
    budgetTotal,
    currency ?? "USD",
    briefProjectId,
    brandDnaProjectId,
  );

  return c.json(campaign, 201);
});

// GET /api/campaigns/:clientId — List campaigns
campaignRoutes.get("/api/campaigns/:clientId", async (c) => {
  const campaigns = await listCampaigns(c.req.param("clientId"));
  return c.json(campaigns);
});

// GET /api/campaigns/:clientId/:id — Campaign detail
campaignRoutes.get("/api/campaigns/:clientId/:id", async (c) => {
  const campaign = await getCampaign(c.req.param("id"));
  if (!campaign) return c.json({ error: "Campaign not found" }, 404);
  return c.json(campaign);
});

// POST /api/campaigns/:clientId/:id/dispatch — Launch campaign
campaignRoutes.post("/api/campaigns/:clientId/:id/dispatch", async (c) => {
  try {
    const subProjects = await dispatchCampaign(c.req.param("id"));
    return c.json({ status: "dispatched", subProjects });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
});

// GET /api/campaigns/:clientId/:id/progress — Campaign progress
campaignRoutes.get("/api/campaigns/:clientId/:id/progress", async (c) => {
  const progress = await getCampaignProgress(c.req.param("id"));
  if (!progress) return c.json({ error: "Campaign not found" }, 404);
  return c.json(progress);
});

// POST /api/campaigns/:clientId/:id/consolidate — Collect deliverables
campaignRoutes.post("/api/campaigns/:clientId/:id/consolidate", async (c) => {
  try {
    const deliverables = await consolidateCampaign(c.req.param("id"));
    return c.json({ status: "delivered", deliverables });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
});
