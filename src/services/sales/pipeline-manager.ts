import { eq, and, desc, ilike, ne, sql } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { STALE_THRESHOLDS } from "./types.js";

// ── Types ──

export interface CreateDealData {
  name: string;
  value?: number | null;
  currency?: string | null;
  probability?: number | null;
  expectedCloseDate?: Date | null;
  notes?: string | null;
}

export interface DealFilters {
  stage?: string;
  search?: string;
}

// ── createDeal ──

export async function createDeal(
  clientId: string,
  leadId: string,
  data: CreateDealData,
) {
  const [deal] = await db
    .insert(schema.deals)
    .values({
      clientId,
      leadId,
      name: data.name,
      value: data.value != null ? String(data.value) : null,
      currency: data.currency ?? "USD",
      probability: data.probability ?? 10,
      expectedCloseDate: data.expectedCloseDate ?? null,
      notes: data.notes ?? null,
    })
    .returning();

  return deal;
}

// ── getDeals ──

export async function getDeals(clientId: string, filters?: DealFilters) {
  const conditions = [eq(schema.deals.clientId, clientId)];

  if (filters?.stage) {
    conditions.push(eq(schema.deals.stage, filters.stage as any));
  }

  const query = db
    .select()
    .from(schema.deals)
    .where(
      filters?.search
        ? and(...conditions, ilike(schema.deals.name, `%${filters.search}%`))
        : and(...conditions),
    )
    .orderBy(desc(schema.deals.createdAt));

  return query;
}

// ── getDealById ──

export async function getDealById(clientId: string, dealId: string) {
  const rows = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.id, dealId),
        eq(schema.deals.clientId, clientId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ── updateDeal ──

export async function updateDeal(
  clientId: string,
  dealId: string,
  updates: Partial<CreateDealData> & {
    stage?: string;
    lostReason?: string | null;
    actualCloseDate?: Date | null;
  },
) {
  const now = new Date();
  const setValues: Record<string, unknown> = { ...updates, updatedAt: now };

  if (updates.value != null) {
    setValues.value = String(updates.value);
  }

  if (updates.stage === "won" || updates.stage === "lost") {
    setValues.actualCloseDate = now;
  }

  const [updated] = await db
    .update(schema.deals)
    .set(setValues as any)
    .where(
      and(
        eq(schema.deals.id, dealId),
        eq(schema.deals.clientId, clientId),
      ),
    )
    .returning();

  return updated ?? null;
}

// ── getPipelineKanban ──

export async function getPipelineKanban(clientId: string) {
  const deals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.clientId, clientId))
    .orderBy(desc(schema.deals.createdAt));

  const stages: Record<string, { deals: typeof deals; count: number; totalValue: number }> = {};

  for (const deal of deals) {
    const stage = deal.stage ?? "qualification";
    if (!stages[stage]) {
      stages[stage] = { deals: [], count: 0, totalValue: 0 };
    }
    stages[stage].deals.push(deal);
    stages[stage].count += 1;
    stages[stage].totalValue += deal.value != null ? parseFloat(String(deal.value)) : 0;
  }

  return { stages };
}

// ── getPipelineMetrics ──

export async function getPipelineMetrics(clientId: string) {
  const deals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.clientId, clientId));

  const totalDeals = deals.length;
  const wonDeals = deals.filter((d) => d.stage === "won").length;
  const lostDeals = deals.filter((d) => d.stage === "lost").length;

  const activeDeals = deals.filter((d) => d.stage !== "lost");
  const totalValue = activeDeals.reduce(
    (sum, d) => sum + (d.value != null ? parseFloat(String(d.value)) : 0),
    0,
  );
  const avgDealValue = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;

  const dealsByStage: Record<string, number> = {};
  for (const deal of deals) {
    const stage = deal.stage ?? "qualification";
    dealsByStage[stage] = (dealsByStage[stage] ?? 0) + 1;
  }

  const closedCount = wonDeals + lostDeals;
  const conversionRate = closedCount > 0 ? (wonDeals / closedCount) * 100 : 0;

  return {
    totalDeals,
    totalValue,
    avgDealValue,
    dealsByStage,
    wonDeals,
    lostDeals,
    conversionRate,
  };
}

// ── checkStaleDeal ──

export function checkStaleDeal(deal: {
  stage: string | null;
  updatedAt: Date;
}): boolean {
  const stage = deal.stage ?? "";

  if (stage === "won" || stage === "lost") {
    return false;
  }

  const threshold = STALE_THRESHOLDS[stage];
  if (threshold == null) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - deal.updatedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > threshold;
}

// ── getStaleDealsList ──

export async function getStaleDealsList(clientId: string) {
  const deals = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.clientId, clientId),
        ne(schema.deals.stage, "won"),
        ne(schema.deals.stage, "lost"),
      ),
    );

  return deals.filter((deal) => checkStaleDeal(deal));
}
