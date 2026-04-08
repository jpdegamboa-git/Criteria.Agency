// src/services/scale/campaign-orchestrator.ts
import { db, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { decomposeBrief } from "./brief-decomposer.js";
import type {
  Campaign,
  CampaignStatus,
  CampaignProgress,
  CampaignBudget,
  DecompositionResult,
  SubProjectEntry,
  ScaleStepResult,
} from "./types.js";

export function buildCampaignFromDecomposition(
  clientId: string,
  name: string,
  decomposition: DecompositionResult,
  budgetTotal: number,
  currency: string,
): Omit<Campaign, "id" | "createdAt" | "updatedAt"> {
  const allocated: Record<string, number> = {};
  for (const sb of decomposition.subBriefs) {
    allocated[sb.motor] = (allocated[sb.motor] ?? 0) + sb.estimatedCost;
  }

  return {
    clientId,
    name,
    briefProjectId: null,
    brandDnaProjectId: null,
    status: "decomposing",
    sharedContext: decomposition.sharedContext,
    budget: {
      total: budgetTotal,
      currency,
      allocated,
      spent: {},
    },
    subProjects: [],
  };
}

export function computeCampaignProgress(
  campaignId: string,
  status: CampaignStatus,
  subProjects: SubProjectEntry[],
): CampaignProgress {
  let completed = 0;
  let inProgress = 0;
  let failed = 0;

  for (const sp of subProjects) {
    if (sp.status === "delivered") {
      completed++;
    } else if (sp.status === "paused" || sp.status === "failed") {
      failed++;
    } else {
      inProgress++;
    }
  }

  return {
    campaignId,
    status,
    totalSubProjects: subProjects.length,
    completed,
    inProgress,
    failed,
    subProjects,
    estimatedCompletion: null,
  };
}

export async function createCampaign(
  clientId: string,
  name: string,
  briefText: string,
  channels: string[],
  budgetTotal: number,
  currency: string,
  briefProjectId?: string,
  brandDnaProjectId?: string,
): Promise<Campaign> {
  const decomposition = await decomposeBrief(briefText, channels, budgetTotal);
  const campaignData = buildCampaignFromDecomposition(
    clientId,
    name,
    decomposition,
    budgetTotal,
    currency,
  );

  const [row] = await db
    .insert(schema.campaigns)
    .values({
      clientId,
      name,
      briefProjectId: briefProjectId ?? null,
      brandDnaProjectId: brandDnaProjectId ?? null,
      status: "decomposing",
      sharedContext: decomposition.sharedContext,
      budget: campaignData.budget,
      subProjects: [],
    })
    .returning();

  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    briefProjectId: row.briefProjectId ?? null,
    brandDnaProjectId: row.brandDnaProjectId ?? null,
    status: row.status as CampaignStatus,
    sharedContext: row.sharedContext as Campaign["sharedContext"],
    budget: row.budget as CampaignBudget | null,
    subProjects: (row.subProjects ?? []) as SubProjectEntry[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const [row] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId));

  if (!row) return null;

  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    briefProjectId: row.briefProjectId ?? null,
    brandDnaProjectId: row.brandDnaProjectId ?? null,
    status: row.status as CampaignStatus,
    sharedContext: row.sharedContext as Campaign["sharedContext"],
    budget: row.budget as CampaignBudget | null,
    subProjects: (row.subProjects ?? []) as SubProjectEntry[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCampaigns(clientId: string): Promise<Campaign[]> {
  const rows = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.clientId, clientId));

  return rows.map((row) => ({
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    briefProjectId: row.briefProjectId ?? null,
    brandDnaProjectId: row.brandDnaProjectId ?? null,
    status: row.status as CampaignStatus,
    sharedContext: row.sharedContext as Campaign["sharedContext"],
    budget: row.budget as CampaignBudget | null,
    subProjects: (row.subProjects ?? []) as SubProjectEntry[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function dispatchCampaign(campaignId: string): Promise<SubProjectEntry[]> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "decomposing" && campaign.status !== "draft") {
    throw new Error(`Cannot dispatch campaign in status: ${campaign.status}`);
  }

  await db
    .update(schema.campaigns)
    .set({
      status: "dispatched",
      updatedAt: new Date(),
    })
    .where(eq(schema.campaigns.id, campaignId));

  return campaign.subProjects;
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus,
  subProjects?: SubProjectEntry[],
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (subProjects !== undefined) {
    updates.subProjects = subProjects;
  }

  await db
    .update(schema.campaigns)
    .set(updates)
    .where(eq(schema.campaigns.id, campaignId));
}

export async function getCampaignProgress(campaignId: string): Promise<CampaignProgress | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  return computeCampaignProgress(
    campaignId,
    campaign.status,
    campaign.subProjects,
  );
}

export async function consolidateCampaign(campaignId: string): Promise<string[]> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const allDeliverables = campaign.subProjects.flatMap((sp) => sp.deliverables);

  await updateCampaignStatus(campaignId, "delivered", campaign.subProjects);

  return allDeliverables;
}

export async function runCampaignOrchestration(
  clientId: string,
  name: string,
  briefText: string,
  channels: string[],
  budgetTotal: number,
): Promise<ScaleStepResult> {
  try {
    const campaign = await createCampaign(
      clientId,
      name,
      briefText,
      channels,
      budgetTotal,
      "USD",
    );

    return {
      step: "sk_decompose",
      status: "completed",
      data: { campaignId: campaign.id, campaign },
    };
  } catch (error) {
    return {
      step: "sk_decompose",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
