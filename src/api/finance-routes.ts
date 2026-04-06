import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, sql } from "drizzle-orm";
import { learnFromCorrection } from "../services/categorizer.js";
import { addEntityPattern } from "../services/entity-matcher.js";
import { applyReconciliation } from "../services/reconciler.js";
import {
  checkExpiringTrials,
  checkExpiredTrials,
  checkOverduePayments,
  detectChurnRisk,
  getSubscriptionSummary,
} from "../services/subscription-manager.js";

export const financeRoutes = new Hono();

// ── Transactions ──

// GET /api/transactions — list paginated
financeRoutes.get("/api/transactions", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const offset = Number(c.req.query("offset") ?? 0);

  const data = await db
    .select()
    .from(schema.transactions)
    .orderBy(desc(schema.transactions.date))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.transactions);

  return c.json({ data, total: countResult.count, limit, offset });
});

// GET /api/transactions/:id — get single
financeRoutes.get("/api/transactions/:id", async (c) => {
  const [txn] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, c.req.param("id")));

  if (!txn) return c.json({ error: "Not found" }, 404);
  return c.json(txn);
});

// PATCH /api/transactions/:id — update category, subcategory, type, notes
financeRoutes.patch("/api/transactions/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { category, subcategory, type, notes, entityId } = body;

  const [existing] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (category !== undefined) updates.category = category;
  if (subcategory !== undefined) updates.subcategory = subcategory;
  if (type !== undefined) updates.type = type;
  if (notes !== undefined) updates.notes = notes;
  if (entityId !== undefined) updates.entityId = entityId;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [updated] = await db
    .update(schema.transactions)
    .set(updates)
    .where(eq(schema.transactions.id, id))
    .returning();

  // Learn from category correction
  if (category && category !== existing.category) {
    await learnFromCorrection(
      existing.description,
      category,
      subcategory ?? existing.subcategory ?? null,
      type ?? existing.type ?? "expense",
    );
  }

  // Learn entity pattern from counterparty/description
  if (entityId) {
    const patternSource = existing.counterpartyName ?? existing.description;
    await addEntityPattern(entityId, patternSource);
  }

  return c.json(updated);
});

// POST /api/transactions/:id/reconcile
financeRoutes.post("/api/transactions/:id/reconcile", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { expectedPaymentId } = body;

  if (!expectedPaymentId) {
    return c.json({ error: "expectedPaymentId is required" }, 400);
  }

  const [txn] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, id));

  if (!txn) return c.json({ error: "Transaction not found" }, 404);

  const [ep] = await db
    .select()
    .from(schema.expectedPayments)
    .where(eq(schema.expectedPayments.id, expectedPaymentId));

  if (!ep) return c.json({ error: "Expected payment not found" }, 404);

  await applyReconciliation(id, expectedPaymentId, ep.clientId, txn.counterpartyName ?? null);

  return c.json({ ok: true });
});

// ── Expected Payments ──

// POST /api/expected-payments — create
financeRoutes.post("/api/expected-payments", async (c) => {
  const body = await c.req.json();
  const { clientId, amount, currency, description, dueDate } = body;

  if (!clientId || !amount || !description || !dueDate) {
    return c.json({ error: "clientId, amount, description, and dueDate are required" }, 400);
  }

  const [created] = await db
    .insert(schema.expectedPayments)
    .values({
      clientId,
      amount: String(amount),
      currency: currency ?? "USD",
      description,
      dueDate: new Date(dueDate),
      status: "pending",
    })
    .returning();

  return c.json(created, 201);
});

// GET /api/expected-payments — list
financeRoutes.get("/api/expected-payments", async (c) => {
  const status = c.req.query("status");

  const query = db.select().from(schema.expectedPayments);

  if (status) {
    const data = await query.where(eq(schema.expectedPayments.status, status as any));
    return c.json(data);
  }

  const data = await query;
  return c.json(data);
});

// PATCH /api/expected-payments/:id — update
financeRoutes.patch("/api/expected-payments/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { amount, dueDate, status } = body;

  const [existing] = await db
    .select()
    .from(schema.expectedPayments)
    .where(eq(schema.expectedPayments.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (amount !== undefined) updates.amount = String(amount);
  if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [updated] = await db
    .update(schema.expectedPayments)
    .set(updates)
    .where(eq(schema.expectedPayments.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /api/expected-payments/:id — soft delete
financeRoutes.delete("/api/expected-payments/:id", async (c) => {
  const id = c.req.param("id");

  const [existing] = await db
    .select()
    .from(schema.expectedPayments)
    .where(eq(schema.expectedPayments.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const [updated] = await db
    .update(schema.expectedPayments)
    .set({ status: "canceled" as any })
    .where(eq(schema.expectedPayments.id, id))
    .returning();

  return c.json(updated);
});

// ── Categorization Rules ──

// GET /api/categorization-rules — list
financeRoutes.get("/api/categorization-rules", async (c) => {
  const rules = await db
    .select()
    .from(schema.categorizationRules)
    .orderBy(desc(schema.categorizationRules.priority));

  return c.json(rules);
});

// POST /api/categorization-rules — create
financeRoutes.post("/api/categorization-rules", async (c) => {
  const body = await c.req.json();
  const { pattern, matchType, category, subcategory, transactionType, priority } = body;

  if (!pattern || !category || !transactionType) {
    return c.json({ error: "pattern, category, and transactionType are required" }, 400);
  }

  const [created] = await db
    .insert(schema.categorizationRules)
    .values({
      pattern,
      matchType: matchType ?? "contains",
      category,
      subcategory: subcategory ?? null,
      transactionType,
      source: "manual",
      priority: priority ?? 10,
    })
    .returning();

  return c.json(created, 201);
});

// DELETE /api/categorization-rules/:id — hard delete
financeRoutes.delete("/api/categorization-rules/:id", async (c) => {
  const id = c.req.param("id");

  const [existing] = await db
    .select()
    .from(schema.categorizationRules)
    .where(eq(schema.categorizationRules.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  await db
    .delete(schema.categorizationRules)
    .where(eq(schema.categorizationRules.id, id));

  return c.json({ ok: true });
});

// ── Subscription Management ──

// POST /api/subscriptions/check-trials
financeRoutes.post("/api/subscriptions/check-trials", async (c) => {
  const warned = await checkExpiringTrials();
  const expired = await checkExpiredTrials();
  return c.json({ warned, expired });
});

// POST /api/subscriptions/check-overdue
financeRoutes.post("/api/subscriptions/check-overdue", async (c) => {
  const overdue = await checkOverduePayments();
  return c.json({ overdue });
});

// GET /api/subscriptions/at-risk
financeRoutes.get("/api/subscriptions/at-risk", async (c) => {
  const atRisk = await detectChurnRisk();
  return c.json({ atRisk, count: atRisk.length });
});

// GET /api/subscriptions/summary
financeRoutes.get("/api/subscriptions/summary", async (c) => {
  const summary = await getSubscriptionSummary();
  return c.json(summary);
});
