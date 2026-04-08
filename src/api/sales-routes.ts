import { Hono } from "hono";
import {
  parseBody,
  createLeadSchema,
  updateLeadSchema,
  bulkImportLeadsSchema,
  updateDealSchema,
  createDealProposalSchema,
  updateFollowUpSchema,
  upsertScoringRulesSchema,
} from "./validators.js";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  enrichLead,
  bulkImportLeads,
  getLeadTouchpoints,
} from "../services/sales/lead-manager.js";
import {
  getScoringRules,
  upsertScoringRules,
  rescoreLead,
} from "../services/sales/lead-scorer.js";
import {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  getPipelineKanban,
  getPipelineMetrics,
} from "../services/sales/pipeline-manager.js";
import {
  getUpcomingFollowUps,
  markFollowUpStatus,
} from "../services/sales/follow-up-engine.js";
import {
  getAttributionByChannel,
  getAttributionByCampaign,
} from "../services/sales/attribution-engine.js";
import {
  createProposal,
  getProposals,
  getProposalById,
} from "../services/sales/proposal-generator.js";

export const salesRoutes = new Hono();

// ── C-028: Lead Management ──

// GET /api/sales/:clientId/leads
salesRoutes.get("/api/sales/:clientId/leads", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const status = c.req.query("status");
    const classification = c.req.query("classification");
    const search = c.req.query("search");
    const leads = await getLeads(clientId, { status: status as any, classification: classification as any, search });
    return c.json(leads);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// POST /api/sales/:clientId/leads
salesRoutes.post("/api/sales/:clientId/leads", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const body = await c.req.json();
    const parsed = parseBody(createLeadSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const lead = await createLead(clientId, parsed.data);
    return c.json(lead, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// POST /api/sales/:clientId/leads/import
salesRoutes.post("/api/sales/:clientId/leads/import", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const body = await c.req.json();
    const parsed = parseBody(bulkImportLeadsSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const result = await bulkImportLeads(clientId, parsed.data.leads);
    return c.json(result, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// GET /api/sales/:clientId/leads/:leadId
salesRoutes.get("/api/sales/:clientId/leads/:leadId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const leadId = c.req.param("leadId");
    const lead = await getLeadById(clientId, leadId);
    if (!lead) return c.json({ error: "Not found" }, 404);
    const touchpoints = await getLeadTouchpoints(leadId);
    return c.json({ ...lead, touchpoints });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// PATCH /api/sales/:clientId/leads/:leadId
salesRoutes.patch("/api/sales/:clientId/leads/:leadId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const leadId = c.req.param("leadId");
    const body = await c.req.json();
    const parsed = parseBody(updateLeadSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const lead = await updateLead(clientId, leadId, parsed.data);
    return c.json(lead);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// POST /api/sales/:clientId/leads/:leadId/rescore
salesRoutes.post("/api/sales/:clientId/leads/:leadId/rescore", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const leadId = c.req.param("leadId");
    const score = await rescoreLead(clientId, leadId);
    return c.json(score);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// POST /api/sales/:clientId/leads/:leadId/enrich
salesRoutes.post("/api/sales/:clientId/leads/:leadId/enrich", async (c) => {
  try {
    const leadId = c.req.param("leadId");
    const lead = await enrichLead(leadId);
    return c.json(lead);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// ── C-030: Pipeline ──

// GET /api/sales/:clientId/pipeline
salesRoutes.get("/api/sales/:clientId/pipeline", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const kanban = await getPipelineKanban(clientId);
    return c.json(kanban);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// GET /api/sales/:clientId/pipeline/metrics
salesRoutes.get("/api/sales/:clientId/pipeline/metrics", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const metrics = await getPipelineMetrics(clientId);
    return c.json(metrics);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// GET /api/sales/:clientId/deals
salesRoutes.get("/api/sales/:clientId/deals", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const stage = c.req.query("stage");
    const deals = await getDeals(clientId, { stage: stage as any });
    return c.json(deals);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// PATCH /api/sales/:clientId/deals/:dealId
salesRoutes.patch("/api/sales/:clientId/deals/:dealId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const dealId = c.req.param("dealId");
    const body = await c.req.json();
    const parsed = parseBody(updateDealSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const { value, expectedCloseDate, ...rest } = parsed.data;
    const deal = await updateDeal(clientId, dealId, {
      ...rest,
      ...(value != null ? { value: Number(value) } : {}),
      ...(expectedCloseDate != null ? { expectedCloseDate: new Date(expectedCloseDate) } : {}),
    });
    return c.json(deal);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// POST /api/sales/:clientId/deals/:dealId/proposal
salesRoutes.post("/api/sales/:clientId/deals/:dealId/proposal", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const dealId = c.req.param("dealId");
    const body = await c.req.json();
    const parsed = parseBody(createDealProposalSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const deal = await getDealById(clientId, dealId);
    if (!deal) return c.json({ error: "Deal not found" }, 404);
    const proposal = await createProposal(clientId, dealId, parsed.data.discoveryNotes);
    return c.json(proposal, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// ── C-031: Proposals ──

// GET /api/sales/:clientId/proposals
salesRoutes.get("/api/sales/:clientId/proposals", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const proposals = await getProposals(clientId);
    return c.json(proposals);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// GET /api/sales/:clientId/proposals/:proposalId
salesRoutes.get("/api/sales/:clientId/proposals/:proposalId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const proposalId = c.req.param("proposalId");
    const proposal = await getProposalById(clientId, proposalId);
    if (!proposal) return c.json({ error: "Not found" }, 404);
    return c.json(proposal);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// ── C-032: Attribution ──

// GET /api/sales/:clientId/attribution/by-channel
salesRoutes.get("/api/sales/:clientId/attribution/by-channel", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const model = c.req.query("model");
    const result = await getAttributionByChannel(clientId, model as any);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// GET /api/sales/:clientId/attribution/by-campaign
salesRoutes.get("/api/sales/:clientId/attribution/by-campaign", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const model = c.req.query("model");
    const result = await getAttributionByCampaign(clientId, model as any);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// ── Follow-ups ──

// GET /api/sales/:clientId/follow-ups
salesRoutes.get("/api/sales/:clientId/follow-ups", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const followUps = await getUpcomingFollowUps(clientId);
    return c.json(followUps);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// PATCH /api/sales/:clientId/follow-ups/:followUpId
salesRoutes.patch("/api/sales/:clientId/follow-ups/:followUpId", async (c) => {
  try {
    const followUpId = c.req.param("followUpId");
    const body = await c.req.json();
    const parsed = parseBody(updateFollowUpSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const followUp = await markFollowUpStatus(followUpId, parsed.data.status);
    return c.json(followUp);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// ── C-029: Configuration ──

// GET /api/sales/:clientId/scoring-rules
salesRoutes.get("/api/sales/:clientId/scoring-rules", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const rules = await getScoringRules(clientId);
    return c.json(rules);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// PUT /api/sales/:clientId/scoring-rules
salesRoutes.put("/api/sales/:clientId/scoring-rules", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const body = await c.req.json();
    const parsed = parseBody(upsertScoringRulesSchema, body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);
    const rules = await upsertScoringRules(clientId, parsed.data.rules);
    return c.json(rules);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
