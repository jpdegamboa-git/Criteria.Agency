import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { parseBody, createInvoiceSchema, updateInvoiceSchema, linkTransactionInvoiceSchema } from "./validators.js";

export const invoiceRoutes = new Hono();

// POST /api/invoices — create invoice
invoiceRoutes.post("/api/invoices", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createInvoiceSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { direction, entityId, invoiceNumber, amount, currency, issueDate, dueDate, notes, metadata } = parsed.data;

  const [created] = await db
    .insert(schema.invoices)
    .values({
      direction,
      entityId,
      invoiceNumber: invoiceNumber ?? null,
      amount: String(amount),
      currency,
      issueDate: new Date(issueDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
      metadata,
    })
    .returning();

  return c.json(created, 201);
});

// GET /api/invoices — list with optional filters
invoiceRoutes.get("/api/invoices", async (c) => {
  const direction = c.req.query("direction");
  const status = c.req.query("status");

  const conditions = [];
  if (direction) conditions.push(eq(schema.invoices.direction, direction as "issued" | "received"));
  if (status) conditions.push(eq(schema.invoices.status, status as "pending" | "partial" | "paid" | "overdue" | "canceled"));

  const query = db.select().from(schema.invoices);
  const data = conditions.length > 0
    ? await query.where(sql`${sql.join(conditions, sql` AND `)}`)
    : await query;

  return c.json(data);
});

// GET /api/invoices/:id — single invoice
invoiceRoutes.get("/api/invoices/:id", async (c) => {
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.id, c.req.param("id")));

  if (!invoice) return c.json({ error: "Not found" }, 404);
  return c.json(invoice);
});

// PATCH /api/invoices/:id — update
invoiceRoutes.patch("/api/invoices/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = parseBody(updateInvoiceSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { status, notes, invoiceNumber } = parsed.data;

  const [existing] = await db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (invoiceNumber !== undefined) updates.invoiceNumber = invoiceNumber;

  const [updated] = await db
    .update(schema.invoices)
    .set(updates)
    .where(eq(schema.invoices.id, id))
    .returning();

  return c.json(updated);
});

// POST /api/transactions/:id/invoices — link transaction to invoice
invoiceRoutes.post("/api/transactions/:id/invoices", async (c) => {
  const transactionId = c.req.param("id");
  const body = await c.req.json();
  const parsed = parseBody(linkTransactionInvoiceSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { invoiceId, amount } = parsed.data;

  // Verify transaction exists
  const [txn] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, transactionId));

  if (!txn) return c.json({ error: "Transaction not found" }, 404);

  // Verify invoice exists
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.id, invoiceId));

  if (!invoice) return c.json({ error: "Invoice not found" }, 404);

  // Create the link
  const [link] = await db
    .insert(schema.transactionInvoices)
    .values({
      transactionId,
      invoiceId,
      amount: String(amount),
    })
    .returning();

  // Recalculate invoice status
  const [sumResult] = await db
    .select({
      total: sql<string>`coalesce(sum(amount::numeric), 0)`,
    })
    .from(schema.transactionInvoices)
    .where(eq(schema.transactionInvoices.invoiceId, invoiceId));

  const linkedTotal = parseFloat(sumResult.total);
  const invoiceAmount = parseFloat(invoice.amount);

  let newStatus: "paid" | "partial" | "pending";
  if (linkedTotal >= invoiceAmount) {
    newStatus = "paid";
  } else if (linkedTotal > 0) {
    newStatus = "partial";
  } else {
    newStatus = "pending";
  }

  await db
    .update(schema.invoices)
    .set({ status: newStatus })
    .where(eq(schema.invoices.id, invoiceId));

  return c.json({ link, invoiceStatus: newStatus }, 201);
});
