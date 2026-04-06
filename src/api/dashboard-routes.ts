import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { sql, and, gte, lt, eq, desc } from "drizzle-orm";
import { layout } from "../views/layout.js";
import { importCSV, previewCSV } from "../services/bank-sync.js";

export const dashboardRoutes = new Hono();

// ── Helpers ──

function getPeriodDates(period: string): {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
} {
  const now = new Date();

  if (period === "quarter") {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterMonth, 1);
    const end = new Date(now.getFullYear(), quarterMonth + 3, 1);
    const prevStart = new Date(now.getFullYear(), quarterMonth - 3, 1);
    const prevEnd = new Date(start);
    return { start, end, prevStart, prevEnd };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(start);
    return { start, end, prevStart, prevEnd };
  }

  // Default: month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(start);
  return { start, end, prevStart, prevEnd };
}

// ── SSR Page Placeholders ──

dashboardRoutes.get("/admin/finances", (c) => {
  return c.html(
    layout("Dashboard", "<h1>Financial Dashboard</h1><p>Coming soon</p>"),
  );
});

dashboardRoutes.get("/admin/finances/transactions", (c) => {
  return c.html(
    layout(
      "Transactions",
      "<h1>Transactions</h1><p>Coming soon</p>",
    ),
  );
});

dashboardRoutes.get("/admin/finances/reconciliation", (c) => {
  return c.html(
    layout(
      "Reconciliation",
      "<h1>Reconciliation</h1><p>Coming soon</p>",
    ),
  );
});

dashboardRoutes.get("/admin/finances/import", (c) => {
  return c.html(
    layout("Import", "<h1>CSV Import</h1><p>Coming soon</p>"),
  );
});

// ── Import API ──

// POST /api/transactions/import — full import
dashboardRoutes.post("/api/transactions/import", async (c) => {
  const formData = await c.req.parseBody();
  const file = formData["file"];
  const accountId = (formData["accountId"] as string) ?? "main";

  if (!file || typeof file === "string") {
    return c.json({ error: "file is required (multipart)" }, 400);
  }

  const content = await file.text();
  const result = await importCSV(content, accountId);
  return c.json(result);
});

// POST /api/transactions/import/preview — preview only
dashboardRoutes.post("/api/transactions/import/preview", async (c) => {
  const formData = await c.req.parseBody();
  const file = formData["file"];
  const accountId = (formData["accountId"] as string) ?? "main";

  if (!file || typeof file === "string") {
    return c.json({ error: "file is required (multipart)" }, 400);
  }

  const content = await file.text();
  const result = await previewCSV(content, accountId);
  return c.json(result);
});

// ── Dashboard Data Endpoints ──

// GET /api/finances/summary?period=month
dashboardRoutes.get("/api/finances/summary", async (c) => {
  const period = c.req.query("period") ?? "month";
  const { start, end, prevStart, prevEnd } = getPeriodDates(period);

  // Current period
  const [current] = await db
    .select({
      income: sql<string>`coalesce(sum(case when amount::numeric > 0 then amount::numeric else 0 end), 0)`,
      expenses: sql<string>`coalesce(sum(case when amount::numeric < 0 then abs(amount::numeric) else 0 end), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        gte(schema.transactions.date, start),
        lt(schema.transactions.date, end),
      ),
    );

  // Previous period
  const [previous] = await db
    .select({
      income: sql<string>`coalesce(sum(case when amount::numeric > 0 then amount::numeric else 0 end), 0)`,
      expenses: sql<string>`coalesce(sum(case when amount::numeric < 0 then abs(amount::numeric) else 0 end), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        gte(schema.transactions.date, prevStart),
        lt(schema.transactions.date, prevEnd),
      ),
    );

  const income = parseFloat(current.income);
  const expenses = parseFloat(current.expenses);
  const balance = income - expenses;

  const prevIncome = parseFloat(previous.income);
  const prevExpenses = parseFloat(previous.expenses);
  const prevBalance = prevIncome - prevExpenses;

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

  return c.json({
    period,
    income,
    expenses,
    balance,
    changes: {
      income: pctChange(income, prevIncome),
      expenses: pctChange(expenses, prevExpenses),
      balance: pctChange(balance, prevBalance),
    },
  });
});

// GET /api/finances/cash-flow?months=6
dashboardRoutes.get("/api/finances/cash-flow", async (c) => {
  const months = Math.min(Number(c.req.query("months") ?? 6), 24);
  const now = new Date();
  const result: { month: string; income: number; expenses: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

    const [row] = await db
      .select({
        income: sql<string>`coalesce(sum(case when amount::numeric > 0 then amount::numeric else 0 end), 0)`,
        expenses: sql<string>`coalesce(sum(case when amount::numeric < 0 then abs(amount::numeric) else 0 end), 0)`,
      })
      .from(schema.transactions)
      .where(
        and(
          gte(schema.transactions.date, start),
          lt(schema.transactions.date, end),
        ),
      );

    result.push({
      month: monthLabel,
      income: parseFloat(row.income),
      expenses: parseFloat(row.expenses),
    });
  }

  return c.json(result);
});

// GET /api/finances/top-entities?period=month
dashboardRoutes.get("/api/finances/top-entities", async (c) => {
  const period = c.req.query("period") ?? "month";
  const { start, end } = getPeriodDates(period);

  const rows = await db
    .select({
      entityId: schema.transactions.entityId,
      entityName: schema.businessEntities.name,
      entityType: schema.businessEntities.type,
      total: sql<string>`sum(abs(amount::numeric))`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.transactions)
    .innerJoin(
      schema.businessEntities,
      eq(schema.transactions.entityId, schema.businessEntities.id),
    )
    .where(
      and(
        gte(schema.transactions.date, start),
        lt(schema.transactions.date, end),
      ),
    )
    .groupBy(
      schema.transactions.entityId,
      schema.businessEntities.name,
      schema.businessEntities.type,
    )
    .orderBy(desc(sql`sum(abs(amount::numeric))`));

  const vendors = rows
    .filter((r) => r.entityType === "vendor")
    .slice(0, 5)
    .map((r) => ({
      entityId: r.entityId,
      name: r.entityName,
      total: parseFloat(r.total),
      count: r.count,
    }));

  const clients = rows
    .filter((r) => r.entityType === "client")
    .slice(0, 5)
    .map((r) => ({
      entityId: r.entityId,
      name: r.entityName,
      total: parseFloat(r.total),
      count: r.count,
    }));

  return c.json({ period, vendors, clients });
});
