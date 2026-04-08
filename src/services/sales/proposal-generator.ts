import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { generateText } from "../../providers/generate-text.js";
import type { ProposalTemplate } from "./types.js";

// ── generateProposalContent ──

export async function generateProposalContent(
  deal: { id: string; name: string; value?: string | null; notes?: string | null },
  lead: { name?: string | null; email?: string | null; company?: string | null; enrichmentData?: Record<string, unknown> | null },
  discoveryNotes?: string,
): Promise<ProposalTemplate> {
  const systemPrompt = `You are an expert sales proposal writer for Criteria Agency, a creative and digital marketing agency.
Generate a comprehensive, professional proposal for a potential client.
Return ONLY valid JSON matching the ProposalTemplate schema — no markdown, no explanation.`;

  const userPrompt = `Generate a proposal for the following deal:

Deal Name: ${deal.name}
Deal Value: ${deal.value ?? "TBD"}
Deal Notes: ${deal.notes ?? "None"}

Client/Lead Information:
Name: ${lead.name ?? "Unknown"}
Email: ${lead.email ?? "Unknown"}
Company: ${lead.company ?? "Unknown"}
${lead.enrichmentData ? `Enrichment Data: ${JSON.stringify(lead.enrichmentData, null, 2)}` : ""}
${discoveryNotes ? `Discovery Notes: ${discoveryNotes}` : ""}

Return a JSON object with exactly these fields:
{
  "executiveSummary": "string",
  "currentSituation": "string",
  "proposedSolution": "string",
  "timeline": "string",
  "investment": "string",
  "whyCriteria": "string",
  "nextSteps": "string",
  "terms": "string"
}`;

  try {
    const raw = await generateText("claude-sonnet-4-5", systemPrompt, userPrompt, 2000);
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as ProposalTemplate;
    return parsed;
  } catch {
    // Fallback: return placeholder template
    return {
      executiveSummary: `Proposal for ${deal.name}`,
      currentSituation: `Current situation analysis for ${lead.company ?? lead.name ?? "client"}.`,
      proposedSolution: `Criteria Agency proposes a tailored solution for ${deal.name}.`,
      timeline: "Project timeline to be determined during kickoff.",
      investment: `Investment: ${deal.value ?? "To be confirmed"}`,
      whyCriteria: "Criteria Agency brings deep expertise in creative and digital marketing.",
      nextSteps: "Schedule a follow-up call to review this proposal.",
      terms: "Standard terms apply. Valid for 30 days from issue date.",
    };
  }
}

// ── createProposal ──

export async function createProposal(
  clientId: string,
  dealId: string,
  discoveryNotes?: string,
) {
  // Fetch deal from DB
  const dealRows = await db
    .select()
    .from(schema.deals)
    .where(and(eq(schema.deals.id, dealId), eq(schema.deals.clientId, clientId)))
    .limit(1);

  if (dealRows.length === 0) {
    throw new Error(`Deal not found: ${dealId}`);
  }

  const deal = dealRows[0];

  // Fetch lead via deal.leadId
  const leadRows = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.id, deal.leadId))
    .limit(1);

  const lead = leadRows[0] ?? {};

  // Generate proposal content
  const proposalContent = await generateProposalContent(deal, lead, discoveryNotes);

  // Insert into proposals
  const [proposal] = await db
    .insert(schema.proposals)
    .values({
      clientId,
      dealId,
      version: 1,
      status: "draft",
      content: JSON.stringify(proposalContent),
    })
    .returning();

  return proposal;
}

// ── getProposals ──

export async function getProposals(clientId: string) {
  return db
    .select({
      id: schema.proposals.id,
      dealId: schema.proposals.dealId,
      clientId: schema.proposals.clientId,
      version: schema.proposals.version,
      content: schema.proposals.content,
      pricing: schema.proposals.pricing,
      validUntil: schema.proposals.validUntil,
      status: schema.proposals.status,
      createdAt: schema.proposals.createdAt,
      dealName: schema.deals.name,
    })
    .from(schema.proposals)
    .leftJoin(schema.deals, eq(schema.proposals.dealId, schema.deals.id))
    .where(eq(schema.proposals.clientId, clientId))
    .orderBy(desc(schema.proposals.createdAt));
}

// ── getProposalById ──

export async function getProposalById(clientId: string, proposalId: string) {
  const rows = await db
    .select({
      id: schema.proposals.id,
      dealId: schema.proposals.dealId,
      clientId: schema.proposals.clientId,
      version: schema.proposals.version,
      content: schema.proposals.content,
      pricing: schema.proposals.pricing,
      validUntil: schema.proposals.validUntil,
      status: schema.proposals.status,
      createdAt: schema.proposals.createdAt,
      dealName: schema.deals.name,
    })
    .from(schema.proposals)
    .leftJoin(schema.deals, eq(schema.proposals.dealId, schema.deals.id))
    .where(
      and(
        eq(schema.proposals.id, proposalId),
        eq(schema.proposals.clientId, clientId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
