import { Hono } from "hono";
import { parseBody, createBudgetSchema, updateBudgetSchema, spendEntrySchema, createVendorSchema, vendorQuotationSchema, generatePnlSchema } from "./validators.js";
import { computeAllocation, saveBudget, getCurrentBudget, updateBudget, runBudgetAllocation } from "../services/budget/allocator.js";
import { recordSpend, getSpendSummary, runSpendTracking } from "../services/budget/spend-monitor.js";
import { createVendor, listVendors, getVendor, submitQuotation, compareVendors } from "../services/budget/vendor-manager.js";
import { buildCampaignPnL, generateInvestmentReport, getLatestPnL } from "../services/budget/roi-calculator.js";

export const budgetRoutes = new Hono();

// ── Budget Allocation ──

// GET /api/budget/:clientId/current
budgetRoutes.get("/api/budget/:clientId/current", async (c) => {
  const { clientId } = c.req.param();
  const budget = await getCurrentBudget(clientId);
  if (!budget) return c.json({ error: "No active budget found" }, 404);
  return c.json(budget);
});

// POST /api/budget/:clientId/allocate
budgetRoutes.post("/api/budget/:clientId/allocate", async (c) => {
  const { clientId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(createBudgetSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await runBudgetAllocation(clientId, parsed.data);
  return c.json(result, 201);
});

// PUT /api/budget/:clientId/:budgetId
budgetRoutes.put("/api/budget/:clientId/:budgetId", async (c) => {
  const { clientId, budgetId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(updateBudgetSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await updateBudget(clientId, budgetId, parsed.data);
  return c.json(result);
});

// POST /api/budget/:clientId/:budgetId/rebalance
budgetRoutes.post("/api/budget/:clientId/:budgetId/rebalance", async (c) => {
  const { clientId, budgetId } = c.req.param();
  const budget = await getCurrentBudget(clientId);
  if (!budget) return c.json({ error: "No active budget found" }, 404);
  const allocation = await computeAllocation(clientId, budget);
  const result = await updateBudget(clientId, budgetId, allocation);
  return c.json(result);
});

// ── Spend Tracking ──

// GET /api/budget/:clientId/spend
budgetRoutes.get("/api/budget/:clientId/spend", async (c) => {
  const { clientId } = c.req.param();
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const defaultEnd = now.toISOString().slice(0, 10);
  const periodStart = c.req.query("periodStart") ?? defaultStart;
  const periodEnd = c.req.query("periodEnd") ?? defaultEnd;
  const summary = await getSpendSummary(clientId, periodStart, periodEnd);
  return c.json(summary);
});

// POST /api/budget/:clientId/spend
budgetRoutes.post("/api/budget/:clientId/spend", async (c) => {
  const { clientId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(spendEntrySchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await recordSpend(clientId, parsed.data);
  return c.json(result, 201);
});

// GET /api/budget/:clientId/spend/forecast
budgetRoutes.get("/api/budget/:clientId/spend/forecast", async (c) => {
  const { clientId } = c.req.param();
  const forecast = await runSpendTracking(clientId);
  return c.json(forecast);
});

// ── Vendor Management ──

// GET /api/budget/:clientId/vendors
budgetRoutes.get("/api/budget/:clientId/vendors", async (c) => {
  const { clientId } = c.req.param();
  const category = c.req.query("category");
  const vendors = await listVendors(clientId, category);
  return c.json(vendors);
});

// POST /api/budget/:clientId/vendors
budgetRoutes.post("/api/budget/:clientId/vendors", async (c) => {
  const { clientId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(createVendorSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const vendor = await createVendor(clientId, parsed.data);
  return c.json(vendor, 201);
});

// GET /api/budget/:clientId/vendors/compare — MUST be before /:id
budgetRoutes.get("/api/budget/:clientId/vendors/compare", async (c) => {
  const { clientId } = c.req.param();
  const result = await compareVendors(clientId);
  return c.json(result);
});

// GET /api/budget/:clientId/vendors/:id
budgetRoutes.get("/api/budget/:clientId/vendors/:id", async (c) => {
  const { clientId, id } = c.req.param();
  const vendor = await getVendor(clientId, id);
  if (!vendor) return c.json({ error: "Vendor not found" }, 404);
  return c.json(vendor);
});

// POST /api/budget/:clientId/vendors/:id/quote
budgetRoutes.post("/api/budget/:clientId/vendors/:id/quote", async (c) => {
  const { clientId, id } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(vendorQuotationSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const quotation = await submitQuotation(clientId, id, parsed.data);
  return c.json(quotation, 201);
});

// ── ROI / P&L ──

// GET /api/budget/:clientId/pnl
budgetRoutes.get("/api/budget/:clientId/pnl", async (c) => {
  const { clientId } = c.req.param();
  const pnl = await getLatestPnL(clientId);
  return c.json(pnl);
});

// POST /api/budget/:clientId/pnl/generate
budgetRoutes.post("/api/budget/:clientId/pnl/generate", async (c) => {
  const { clientId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(generatePnlSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const pnl = await buildCampaignPnL(clientId, parsed.data);
  return c.json(pnl, 201);
});

// GET /api/budget/:clientId/roi-report
budgetRoutes.get("/api/budget/:clientId/roi-report", async (c) => {
  const { clientId } = c.req.param();
  const query = c.req.query();
  const report = await generateInvestmentReport(clientId, query);
  return c.json(report);
});
