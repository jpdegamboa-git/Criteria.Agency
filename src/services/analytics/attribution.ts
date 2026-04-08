import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import {
  firstTouch,
  lastTouch,
  linearAttribution,
  timeDecay,
  positionBased,
  type TouchpointForAttribution,
  type AttributionEntry,
} from "../sales/attribution-engine.js";
import type {
  AttributionReport,
  ChannelAttribution,
  CampaignAttribution,
  PathAnalysis,
  DateRange,
  AnalyticsStepResult,
} from "./types.js";
import { queryMetrics } from "./data-collector.js";

export type ModelName =
  | "first_touch"
  | "last_touch"
  | "linear"
  | "time_decay"
  | "position_based";

const MODEL_FNS: Record<
  ModelName,
  (tp: TouchpointForAttribution[], value: number) => AttributionEntry[]
> = {
  first_touch: firstTouch,
  last_touch: lastTouch,
  linear: linearAttribution,
  time_decay: timeDecay,
  position_based: positionBased,
};

/**
 * Compute attribution report across all closed-won deals for a client.
 */
export async function computeAttribution(
  clientId: string,
  model: ModelName,
  period: DateRange,
): Promise<AttributionReport> {
  // Fetch all deals for client (stage = "closed_won" per attribution convention)
  const allDeals = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.clientId, clientId),
        eq(schema.deals.stage, "closed_won" as any),
      ),
    );

  // Filter by period using closedAt field
  const filteredDeals = allDeals.filter((d) => {
    const raw = (d as any).closedAt ?? (d as any).actualCloseDate;
    if (!raw) return false;
    const closedAt =
      raw instanceof Date ? raw.toISOString().split("T")[0] : String(raw).split("T")[0];
    return closedAt >= period.start && closedAt <= period.end;
  });

  // Collect touchpoints for each unique lead
  const leadIds = [...new Set(filteredDeals.map((d) => d.leadId))];
  const allTouchpoints: Array<TouchpointForAttribution & { leadId: string }> = [];

  for (const leadId of leadIds) {
    const tps = await db
      .select()
      .from(schema.leadTouchpoints)
      .where(eq(schema.leadTouchpoints.leadId, leadId));

    for (const tp of tps) {
      allTouchpoints.push({
        id: tp.id,
        channel: tp.channel,
        campaign: tp.campaign ?? null,
        timestamp:
          tp.timestamp instanceof Date
            ? tp.timestamp.toISOString()
            : String(tp.timestamp),
        leadId,
      });
    }
  }

  // Run attribution model per deal and aggregate
  const modelFn = MODEL_FNS[model];
  const channelMap = new Map<
    string,
    { revenue: number; deals: number; totalValue: number }
  >();
  const campaignMap = new Map<
    string,
    { revenue: number; spend: number; channel: string }
  >();
  const paths: Array<{ path: string[]; dealValue: number }> = [];
  let totalRevenue = 0;

  for (const deal of filteredDeals) {
    const dealValue = Number((deal as any).value ?? 0);
    totalRevenue += dealValue;

    const dealTouchpoints = allTouchpoints
      .filter((tp) => tp.leadId === deal.leadId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const entries = modelFn(dealTouchpoints, dealValue);

    // Track conversion path (unique ordered channels)
    const uniqueChannels = [...new Set(dealTouchpoints.map((tp) => tp.channel))];
    paths.push({ path: uniqueChannels, dealValue });

    // Aggregate by channel
    for (const entry of entries) {
      if (entry.creditValue <= 0) continue;
      const existing = channelMap.get(entry.channel) ?? {
        revenue: 0,
        deals: 0,
        totalValue: 0,
      };
      existing.revenue += entry.creditValue;
      existing.deals += entry.creditPercent > 0 ? 1 : 0;
      existing.totalValue += dealValue;
      channelMap.set(entry.channel, existing);

      // Aggregate by campaign
      if (entry.campaign) {
        const key = `${entry.channel}::${entry.campaign}`;
        const c = campaignMap.get(key) ?? {
          revenue: 0,
          spend: 0,
          channel: entry.channel,
        };
        c.revenue += entry.creditValue;
        campaignMap.set(key, c);
      }
    }
  }

  // Fetch spend data for ROAS calculation
  const spendMetrics = await queryMetrics(clientId, ["spend"], period);
  const spendByChannel: Record<string, number> = {};
  for (const m of spendMetrics) {
    const ch = m.dimensions?.source ?? "unknown";
    spendByChannel[ch] = (spendByChannel[ch] ?? 0) + m.value;
  }

  // Build channel attribution rows
  const byChannel: ChannelAttribution[] = [
    ...channelMap.entries(),
  ].map(([channel, data]) => {
    const spend = spendByChannel[channel] ?? 0;
    return {
      channel,
      attributedRevenue: Math.round(data.revenue * 100) / 100,
      percentOfTotal:
        totalRevenue > 0
          ? Math.round((data.revenue / totalRevenue) * 10000) / 100
          : 0,
      dealCount: data.deals,
      avgDealSize:
        data.deals > 0
          ? Math.round((data.totalValue / data.deals) * 100) / 100
          : 0,
      costPerAcquisition:
        data.deals > 0 ? Math.round((spend / data.deals) * 100) / 100 : 0,
      roas:
        spend > 0 ? Math.round((data.revenue / spend) * 100) / 100 : 0,
    };
  });

  // Build campaign attribution rows
  const byCampaign: CampaignAttribution[] = [
    ...campaignMap.entries(),
  ].map(([key, data]) => {
    const [, campaign] = key.split("::");
    return {
      campaign: campaign ?? key,
      channel: data.channel,
      attributedRevenue: Math.round(data.revenue * 100) / 100,
      spend: data.spend,
      roas:
        data.spend > 0
          ? Math.round((data.revenue / data.spend) * 100) / 100
          : 0,
    };
  });

  // Build path analysis
  const pathCounts = new Map<string, { count: number; totalValue: number }>();
  let totalPathLength = 0;

  for (const p of paths) {
    const key = p.path.join(" → ");
    const existing = pathCounts.get(key) ?? { count: 0, totalValue: 0 };
    existing.count += 1;
    existing.totalValue += p.dealValue;
    pathCounts.set(key, existing);
    totalPathLength += p.path.length;
  }

  const commonPaths = [...pathCounts.entries()]
    .map(([key, data]) => ({
      path: key.split(" → "),
      frequency: data.count,
      avgDealValue:
        data.count > 0
          ? Math.round((data.totalValue / data.count) * 100) / 100
          : 0,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const pathAnalysis: PathAnalysis = {
    avgPathLength:
      paths.length > 0
        ? Math.round((totalPathLength / paths.length) * 100) / 100
        : 0,
    avgTimeToClose: 0,
    commonPaths,
  };

  return {
    model,
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    byChannel,
    byCampaign,
    pathAnalysis,
  };
}

/**
 * Wrapper that returns an AnalyticsStepResult for the pipeline.
 */
export async function runAttribution(
  clientId: string,
  model: ModelName,
  period: DateRange,
): Promise<AnalyticsStepResult> {
  const report = await computeAttribution(clientId, model, period);
  return {
    step: "an_analyze",
    status: "completed",
    data: report,
  };
}
