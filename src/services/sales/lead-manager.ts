import { eq, and, desc, ilike, or } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { StubEnrichmentProvider } from "../../providers/sales/stub-enrichment.js";
import type { Touchpoint } from "./types.js";

// ── Types ──

export interface CreateLeadData {
  name: string;
  email: string;
  company?: string | null;
  title?: string | null;
  phone?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  assignedTo?: string | null;
  notes?: string | null;
}

export interface LeadFilters {
  status?: string;
  classification?: string;
  search?: string;
}

export interface BulkImportResult {
  created: number;
  duplicates: number;
  errors: string[];
}

// ── createLead ──

export async function createLead(clientId: string, data: CreateLeadData) {
  // Dedup: check if lead with same email already exists for this client
  const existing = await db
    .select()
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.clientId, clientId),
        eq(schema.leads.email, data.email),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [lead] = await db
    .insert(schema.leads)
    .values({
      clientId,
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      title: data.title ?? null,
      phone: data.phone ?? null,
      source: data.source ?? "manual",
      sourceDetail: data.sourceDetail ?? null,
      assignedTo: data.assignedTo ?? null,
      notes: data.notes ?? null,
      status: "new",
    })
    .returning();

  return lead;
}

// ── getLeads ──

export async function getLeads(clientId: string, filters?: LeadFilters) {
  const conditions = [eq(schema.leads.clientId, clientId)];

  if (filters?.status) {
    conditions.push(eq(schema.leads.status, filters.status));
  }

  if (filters?.classification) {
    conditions.push(eq(schema.leads.classification, filters.classification));
  }

  let query = db
    .select()
    .from(schema.leads)
    .where(
      filters?.search
        ? and(
            ...conditions,
            or(
              ilike(schema.leads.name, `%${filters.search}%`),
              ilike(schema.leads.email, `%${filters.search}%`),
              ilike(schema.leads.company, `%${filters.search}%`),
            ),
          )
        : and(...conditions),
    )
    .orderBy(desc(schema.leads.createdAt));

  return query;
}

// ── getLeadById ──

export async function getLeadById(clientId: string, leadId: string) {
  const rows = await db
    .select()
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.clientId, clientId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ── updateLead ──

export async function updateLead(
  clientId: string,
  leadId: string,
  updates: Partial<CreateLeadData> & {
    status?: string;
    classification?: string;
    fitScore?: number | null;
    intentScore?: number | null;
    bantScore?: Record<string, unknown> | null;
    totalScore?: number | null;
    enrichmentData?: Record<string, unknown> | null;
  },
) {
  const [updated] = await db
    .update(schema.leads)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.clientId, clientId),
      ),
    )
    .returning();

  return updated ?? null;
}

// ── enrichLead ──

export async function enrichLead(leadId: string) {
  const rows = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.id, leadId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const lead = rows[0];
  const domain = lead.email.split("@")[1] ?? lead.email;

  const provider = new StubEnrichmentProvider();
  const [companyData, contactData] = await Promise.all([
    provider.enrichCompany(domain),
    provider.enrichContact(lead.email),
  ]);

  const enrichmentData = { company: companyData, contact: contactData };

  const [updated] = await db
    .update(schema.leads)
    .set({
      enrichmentData,
      status: "enriched",
      updatedAt: new Date(),
    })
    .where(eq(schema.leads.id, leadId))
    .returning();

  return updated;
}

// ── bulkImportLeads ──

export async function bulkImportLeads(
  clientId: string,
  rows: CreateLeadData[],
): Promise<BulkImportResult> {
  let created = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      // Check for existing to track duplicates vs new
      const existing = await db
        .select()
        .from(schema.leads)
        .where(
          and(
            eq(schema.leads.clientId, clientId),
            eq(schema.leads.email, row.email),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        duplicates++;
      } else {
        await createLead(clientId, row);
        created++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${row.email}: ${message}`);
    }
  }

  return { created, duplicates, errors };
}

// ── addTouchpoint ──

export async function addTouchpoint(
  leadId: string,
  data: Omit<Touchpoint, "leadId">,
) {
  const [touchpoint] = await db
    .insert(schema.leadTouchpoints)
    .values({
      leadId,
      channel: data.channel,
      campaign: data.campaign ?? null,
      content: data.content ?? null,
      medium: data.medium,
      interaction: data.interaction,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    })
    .returning();

  return touchpoint;
}

// ── getLeadTouchpoints ──

export async function getLeadTouchpoints(leadId: string) {
  return db
    .select()
    .from(schema.leadTouchpoints)
    .where(eq(schema.leadTouchpoints.leadId, leadId))
    .orderBy(schema.leadTouchpoints.timestamp);
}
