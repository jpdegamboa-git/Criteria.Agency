import { db, schema } from "../../db/index.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type {
  CampaignCosts,
  CampaignMetrics,
  CampaignPnL,
  CampaignRevenue,
  BudgetStepResult,
  InvestmentReport,
} from "./types.js";
import type { DateRange } from "../analytics/types.js";

// ── Pure Functions ──

/**
 * Compute ROI, ROAS, gross margin, P&L, CPA and revenue-per-lead
 * for a single campaign given its revenue, costs and lead count.
 */
export function computeCampaignMetrics(
  revenue: CampaignRevenue,
  costs: CampaignCosts,
  leadCount: number,
): CampaignMetrics {
  const profitLoss = revenue.attributed - costs.total;

  const roi =
    costs.total > 0 ? Math.round((profitLoss / costs.total) * 100) : 0;

  const roas =
    costs.total > 0
      ? Math.round((revenue.attributed / costs.total) * 1000) / 1000
      : 0;

  const grossMargin =
    revenue.attributed > 0
      ? Math.round((profitLoss / revenue.attributed) * 100)
      : 0;

  const cpa =
    leadCount > 0 ? Math.round(costs.total / leadCount) : 0;

  const revenuePerLead =
    leadCount > 0 ? Math.round(revenue.attributed / leadCount) : 0;

  return { roi, roas, grossMargin, profitLoss, cpa, revenuePerLead };
}

/**
 * Aggregate ROI and ROAS across multiple campaigns.
 */
export function computeOverallRoi(
  campaigns: Array<{ totalCost: number; revenue: number }>,
): {
  totalInvestment: number;
  totalRevenue: number;
  overallRoi: number;
  overallRoas: number;
} {
  const totalInvestment = campaigns.reduce((s, c) => s + c.totalCost, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const profitLoss = totalRevenue - totalInvestment;

  const overallRoi =
    totalInvestment > 0
      ? Math.round((profitLoss / totalInvestment) * 1000) / 10
      : 0;

  const overallRoas =
    totalInvestment > 0
      ? Math.round((totalRevenue / totalInvestment) * 1000) / 1000
      : 0;

  return { totalInvestment, totalRevenue, overallRoi, overallRoas };
}

// ── DB Operations ──

/**
 * Build campaign P&L for all campaigns of a client within a date range.
 * Ad spend is sourced from campaignSpend; revenue from closed-won deals
 * proportionally distributed across campaigns; vendor costs from accepted
 * vendorQuotations; plus a 3% platform fee estimate.
 */
export async function buildCampaignPnL(
  clientId: string,
  period: DateRange,
): Promise<CampaignPnL[]> {
  const start = new Date(period.start);
  const end = new Date(period.end);

  // 1. Fetch ad spend grouped by campaignName
  const spendRows = await db
    .select()
    .from(schema.campaignSpend)
    .where(
      and(
        eq(schema.campaignSpend.clientId, clientId),
        gte(schema.campaignSpend.date, start),
        lte(schema.campaignSpend.date, end),
      ),
    );

  // Group spend by campaign
  const spendByCampaign: Record<string, number> = {};
  for (const row of spendRows) {
    const name = row.campaignName;
    spendByCampaign[name] = (spendByCampaign[name] ?? 0) + Number(row.amount);
  }

  const campaignNames = Object.keys(spendByCampaign);
  if (campaignNames.length === 0) return [];

  // 2. Fetch closed-won deals for revenue attribution
  const dealsRows = await db
    .select()
    .from(schema.deals)
    .where(
      and(
        eq(schema.deals.clientId, clientId),
        eq(schema.deals.stage, "won"),
        gte(schema.deals.actualCloseDate, start),
        lte(schema.deals.actualCloseDate, end),
      ),
    );

  const totalDealRevenue = dealsRows.reduce(
    (s, d) => s + Number(d.value ?? 0),
    0,
  );

  // 3. Fetch accepted vendor costs
  const vendorRows = await db
    .select()
    .from(schema.vendorQuotations)
    .where(
      and(
        eq(schema.vendorQuotations.clientId, clientId),
        eq(schema.vendorQuotations.status, "accepted"),
      ),
    );

  const totalVendorCost = vendorRows.reduce(
    (s, v) => s + Number(v.quotedPrice),
    0,
  );

  // Distribute vendor costs evenly across campaigns
  const vendorCostPerCampaign =
    campaignNames.length > 0 ? totalVendorCost / campaignNames.length : 0;

  // 4. Distribute revenue proportionally by ad spend
  const totalAdSpend = Object.values(spendByCampaign).reduce(
    (s, v) => s + v,
    0,
  );

  const pnlList: CampaignPnL[] = [];

  for (const campaignName of campaignNames) {
    const adSpend = spendByCampaign[campaignName];
    const spendShare = totalAdSpend > 0 ? adSpend / totalAdSpend : 0;
    const attributedRevenue = totalDealRevenue * spendShare;

    const platformFees = adSpend * 0.03;

    const costs: CampaignCosts = {
      adSpend,
      contentProduction: 0,
      vendorCosts: vendorCostPerCampaign,
      platformFees,
      laborCost: 0,
      total: adSpend + vendorCostPerCampaign + platformFees,
    };

    const revenue: CampaignRevenue = {
      attributed: attributedRevenue,
      model: "proportional_spend",
      confidence: 0.7,
    };

    const leadCount = dealsRows.length;
    const metrics = computeCampaignMetrics(revenue, costs, leadCount);

    const pnl: CampaignPnL = {
      campaignName,
      period,
      revenue,
      costs,
      metrics,
    };

    // Save to DB
    await db.insert(schema.campaignPnl).values({
      clientId,
      campaignName,
      periodStart: start,
      periodEnd: end,
      revenue: revenue as unknown as Record<string, unknown>,
      costs: costs as unknown as Record<string, unknown>,
      metrics: metrics as unknown as Record<string, unknown>,
    });

    pnlList.push(pnl);
  }

  return pnlList;
}

/**
 * Generate a full investment report with AI executive summary (in Spanish).
 */
export async function generateInvestmentReport(
  clientId: string,
  period: DateRange,
): Promise<InvestmentReport> {
  const campaigns = await buildCampaignPnL(clientId, period);

  const overallMetrics = computeOverallRoi(
    campaigns.map((c) => ({
      totalCost: c.costs.total,
      revenue: c.revenue.attributed,
    })),
  );

  // Build AI executive summary in Spanish
  const systemPrompt = `Eres un analista de marketing experto que redacta resúmenes ejecutivos de campañas publicitarias.
Responde siempre en español. Devuelve un objeto JSON con las claves "summary" (string) y "recommendations" (array de strings).`;

  const userPrompt = `Genera un resumen ejecutivo para el siguiente reporte de inversión:

- Período: ${period.start} al ${period.end}
- Campañas analizadas: ${campaigns.length}
- Inversión total: $${overallMetrics.totalInvestment.toLocaleString("es-MX")}
- Ingresos totales atribuidos: $${overallMetrics.totalRevenue.toLocaleString("es-MX")}
- ROI general: ${overallMetrics.overallRoi}%
- ROAS general: ${overallMetrics.overallRoas}x

Detalle por campaña:
${campaigns
  .map(
    (c) =>
      `- ${c.campaignName}: inversión $${c.costs.total.toFixed(0)}, ingresos $${c.revenue.attributed.toFixed(0)}, ROI ${c.metrics.roi}%, ROAS ${c.metrics.roas}x`,
  )
  .join("\n")}

Proporciona un resumen ejecutivo conciso y 3-5 recomendaciones accionables.`;

  const llmResponse = await generateText(
    "claude-sonnet-4-5",
    systemPrompt,
    userPrompt,
    1024,
  );

  const parsed = parseJsonSafe<{
    summary?: string;
    recommendations?: string[];
  }>(llmResponse, {});

  const executiveSummary =
    parsed.summary ??
    `Reporte de inversión: ROI ${overallMetrics.overallRoi}%, ROAS ${overallMetrics.overallRoas}x para el período ${period.start} - ${period.end}.`;

  const recommendations = parsed.recommendations ?? [];

  return {
    clientId,
    period,
    campaigns,
    totalInvestment: overallMetrics.totalInvestment,
    totalRevenue: overallMetrics.totalRevenue,
    overallRoi: overallMetrics.overallRoi,
    overallRoas: overallMetrics.overallRoas,
    executiveSummary,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieve the latest stored P&L records for a client.
 */
export async function getLatestPnL(clientId: string): Promise<CampaignPnL[]> {
  const rows = await db
    .select()
    .from(schema.campaignPnl)
    .where(eq(schema.campaignPnl.clientId, clientId))
    .orderBy(schema.campaignPnl.generatedAt);

  return rows.map((row) => ({
    campaignName: row.campaignName,
    period: {
      start: row.periodStart.toISOString(),
      end: row.periodEnd.toISOString(),
    },
    revenue: (row.revenue as CampaignRevenue) ?? {
      attributed: 0,
      model: "unknown",
      confidence: 0,
    },
    costs: (row.costs as CampaignCosts) ?? {
      adSpend: 0,
      contentProduction: 0,
      vendorCosts: 0,
      platformFees: 0,
      laborCost: 0,
      total: 0,
    },
    metrics: (row.metrics as CampaignMetrics) ?? {
      roi: 0,
      roas: 0,
      grossMargin: 0,
      profitLoss: 0,
      cpa: 0,
      revenuePerLead: 0,
    },
  }));
}

/**
 * Orchestrate a full ROI calculation cycle, returning a BudgetStepResult.
 */
export async function runRoiCalculation(
  clientId: string,
  period: DateRange,
): Promise<BudgetStepResult> {
  try {
    const report = await generateInvestmentReport(clientId, period);

    return {
      step: "roi_calculation",
      status: "completed",
      data: report,
      artifactContent: JSON.stringify(report, null, 2),
    };
  } catch (error) {
    return {
      step: "roi_calculation",
      status: "failed",
      data: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}
