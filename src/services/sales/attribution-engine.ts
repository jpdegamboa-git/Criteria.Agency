import { eq, and } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { type AttributionModel, type AttributionResult } from "./types.js";

// ── TouchpointForAttribution ──

export interface TouchpointForAttribution {
  id: string;
  channel: string;
  campaign: string | null;
  timestamp: string; // ISO date
}

export type AttributionEntry = {
  touchpointId: string;
  channel: string;
  campaign: string | null;
  creditPercent: number;
  creditValue: number;
};

// ── Pure Attribution Model Functions ──

/**
 * First Touch: 100% credit to the chronologically first touchpoint.
 */
export function firstTouch(
  touchpoints: TouchpointForAttribution[],
  dealValue: number,
): AttributionEntry[] {
  if (touchpoints.length === 0) return [];

  const sorted = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return sorted.map((tp, idx) => ({
    touchpointId: tp.id,
    channel: tp.channel,
    campaign: tp.campaign,
    creditPercent: idx === 0 ? 100 : 0,
    creditValue: idx === 0 ? dealValue : 0,
  }));
}

/**
 * Last Touch: 100% credit to the chronologically last touchpoint.
 */
export function lastTouch(
  touchpoints: TouchpointForAttribution[],
  dealValue: number,
): AttributionEntry[] {
  if (touchpoints.length === 0) return [];

  const sorted = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const lastIdx = sorted.length - 1;

  return sorted.map((tp, idx) => ({
    touchpointId: tp.id,
    channel: tp.channel,
    campaign: tp.campaign,
    creditPercent: idx === lastIdx ? 100 : 0,
    creditValue: idx === lastIdx ? dealValue : 0,
  }));
}

/**
 * Linear Attribution: equal split across all touchpoints.
 */
export function linearAttribution(
  touchpoints: TouchpointForAttribution[],
  dealValue: number,
): AttributionEntry[] {
  if (touchpoints.length === 0) return [];

  const n = touchpoints.length;
  const creditPercent = 100 / n;
  const creditValue = dealValue / n;

  return touchpoints.map((tp) => ({
    touchpointId: tp.id,
    channel: tp.channel,
    campaign: tp.campaign,
    creditPercent,
    creditValue,
  }));
}

/**
 * Time Decay: exponential decay — touchpoints closer to deal close get more credit.
 * weight = 2^(-daysSinceTouchpoint / halfLifeDays)
 * Uses the last touchpoint's timestamp as the reference "close date" when no explicit
 * close date is provided. The DB wrapper passes the actual close date.
 */
export function timeDecay(
  touchpoints: TouchpointForAttribution[],
  dealValue: number,
  halfLifeDays = 7,
  closeDateIso?: string,
): AttributionEntry[] {
  if (touchpoints.length === 0) return [];

  const sorted = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const closeMs = closeDateIso
    ? new Date(closeDateIso).getTime()
    : new Date(sorted[sorted.length - 1].timestamp).getTime();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const weights = sorted.map((tp) => {
    const daysSince = (closeMs - new Date(tp.timestamp).getTime()) / MS_PER_DAY;
    return Math.pow(2, -daysSince / halfLifeDays);
  });

  const totalWeight = weights.reduce((s, w) => s + w, 0);

  return sorted.map((tp, idx) => {
    const creditPercent = (weights[idx] / totalWeight) * 100;
    const creditValue = (weights[idx] / totalWeight) * dealValue;
    return {
      touchpointId: tp.id,
      channel: tp.channel,
      campaign: tp.campaign,
      creditPercent,
      creditValue,
    };
  });
}

/**
 * Position Based: 40% first, 40% last, 20% distributed equally among middle.
 * Edge cases:
 *   - 1 touchpoint: 100%
 *   - 2 touchpoints: 50/50
 */
export function positionBased(
  touchpoints: TouchpointForAttribution[],
  dealValue: number,
): AttributionEntry[] {
  if (touchpoints.length === 0) return [];

  const sorted = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const n = sorted.length;

  if (n === 1) {
    return [
      {
        touchpointId: sorted[0].id,
        channel: sorted[0].channel,
        campaign: sorted[0].campaign,
        creditPercent: 100,
        creditValue: dealValue,
      },
    ];
  }

  if (n === 2) {
    return sorted.map((tp) => ({
      touchpointId: tp.id,
      channel: tp.channel,
      campaign: tp.campaign,
      creditPercent: 50,
      creditValue: dealValue * 0.5,
    }));
  }

  // n >= 3: first=40%, last=40%, middle=20% equally split
  const middleCount = n - 2;
  const middlePercent = 20 / middleCount;
  const middleValue = (dealValue * 0.2) / middleCount;

  return sorted.map((tp, idx) => {
    let creditPercent: number;
    let creditValue: number;

    if (idx === 0) {
      creditPercent = 40;
      creditValue = dealValue * 0.4;
    } else if (idx === n - 1) {
      creditPercent = 40;
      creditValue = dealValue * 0.4;
    } else {
      creditPercent = middlePercent;
      creditValue = middleValue;
    }

    return {
      touchpointId: tp.id,
      channel: tp.channel,
      campaign: tp.campaign,
      creditPercent,
      creditValue,
    };
  });
}

// ── Helper: run model by name ──

function runModel(
  model: AttributionModel,
  touchpoints: TouchpointForAttribution[],
  dealValue: number,
  closeDateIso?: string,
): AttributionEntry[] {
  switch (model) {
    case "first_touch":
      return firstTouch(touchpoints, dealValue);
    case "last_touch":
      return lastTouch(touchpoints, dealValue);
    case "linear":
      return linearAttribution(touchpoints, dealValue);
    case "time_decay":
      return timeDecay(touchpoints, dealValue, 7, closeDateIso);
    case "position_based":
      return positionBased(touchpoints, dealValue);
  }
}

// ── DB Functions ──

/**
 * calculateAttribution — fetch deal + touchpoints from DB, run model, return AttributionResult.
 */
export async function calculateAttribution(
  dealId: string,
  model: AttributionModel = "linear",
): Promise<AttributionResult | null> {
  const [deal] = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.id, dealId))
    .limit(1);

  if (!deal) return null;

  const touchpointRows = await db
    .select()
    .from(schema.leadTouchpoints)
    .where(eq(schema.leadTouchpoints.leadId, deal.leadId));

  const dealValue = deal.value != null ? parseFloat(String(deal.value)) : 0;

  const touchpoints: TouchpointForAttribution[] = touchpointRows.map((tp) => ({
    id: tp.id,
    channel: tp.channel,
    campaign: tp.campaign ?? null,
    timestamp: tp.timestamp instanceof Date ? tp.timestamp.toISOString() : String(tp.timestamp),
  }));

  const closeDateIso = deal.actualCloseDate
    ? deal.actualCloseDate instanceof Date
      ? deal.actualCloseDate.toISOString()
      : String(deal.actualCloseDate)
    : undefined;

  const attributions = runModel(model, touchpoints, dealValue, closeDateIso);

  // Compute timeToCloseDays from first touchpoint to close date
  const sorted = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const firstTs = sorted.length > 0 ? new Date(sorted[0].timestamp).getTime() : Date.now();
  const closeTs = closeDateIso ? new Date(closeDateIso).getTime() : Date.now();
  const timeToCloseDays = Math.round((closeTs - firstTs) / (1000 * 60 * 60 * 24));

  return {
    dealId,
    dealValue,
    model,
    attributions,
    pathLength: touchpoints.length,
    timeToCloseDays,
  };
}

/**
 * getAttributionByChannel — for all won deals of a client, aggregate creditValue by channel.
 */
export async function getAttributionByChannel(
  clientId: string,
  model: AttributionModel = "linear",
): Promise<Array<{ channel: string; totalCredit: number; dealCount: number }>> {
  const wonDeals = await db
    .select()
    .from(schema.deals)
    .where(and(eq(schema.deals.clientId, clientId), eq(schema.deals.stage, "won" as any)));

  const channelMap: Record<string, { totalCredit: number; dealIds: Set<string> }> = {};

  for (const deal of wonDeals) {
    const result = await calculateAttribution(deal.id, model);
    if (!result) continue;

    for (const attr of result.attributions) {
      if (!channelMap[attr.channel]) {
        channelMap[attr.channel] = { totalCredit: 0, dealIds: new Set() };
      }
      channelMap[attr.channel].totalCredit += attr.creditValue;
      channelMap[attr.channel].dealIds.add(deal.id);
    }
  }

  return Object.entries(channelMap).map(([channel, data]) => ({
    channel,
    totalCredit: data.totalCredit,
    dealCount: data.dealIds.size,
  }));
}

/**
 * getAttributionByCampaign — same but grouped by campaign.
 */
export async function getAttributionByCampaign(
  clientId: string,
  model: AttributionModel = "linear",
): Promise<Array<{ campaign: string | null; totalCredit: number; dealCount: number }>> {
  const wonDeals = await db
    .select()
    .from(schema.deals)
    .where(and(eq(schema.deals.clientId, clientId), eq(schema.deals.stage, "won" as any)));

  const campaignMap: Record<string, { totalCredit: number; dealIds: Set<string> }> = {};

  for (const deal of wonDeals) {
    const result = await calculateAttribution(deal.id, model);
    if (!result) continue;

    for (const attr of result.attributions) {
      const key = attr.campaign ?? "(none)";
      if (!campaignMap[key]) {
        campaignMap[key] = { totalCredit: 0, dealIds: new Set() };
      }
      campaignMap[key].totalCredit += attr.creditValue;
      campaignMap[key].dealIds.add(deal.id);
    }
  }

  return Object.entries(campaignMap).map(([campaign, data]) => ({
    campaign: campaign === "(none)" ? null : campaign,
    totalCredit: data.totalCredit,
    dealCount: data.dealIds.size,
  }));
}
