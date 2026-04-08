import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { getMarketRate } from "../../providers/budget/stub-market-rates.js";
import type {
  VendorCategory,
  VendorScore,
  VendorScoreComponents,
  MarketRate,
  PriceVerdict,
  QuotationAnalysis,
  BudgetStepResult,
} from "./types.js";

// ── Input Interface ──

export interface VendorScoreInput {
  qualityRating: number;      // 0-5
  avgPriceVsMarket: number;   // ratio (e.g. 1.0 = at market)
  onTimeRate: number;         // 0-1
  projectsCompleted: number;
}

// ── Pure Functions ──

export function computeVendorScore(input: VendorScoreInput): {
  overallScore: number;
  components: VendorScoreComponents;
} {
  const { qualityRating, avgPriceVsMarket, onTimeRate, projectsCompleted } = input;

  const quality = Math.round((qualityRating / 5) * 25);

  const price = Math.max(
    0,
    Math.min(25, Math.round(25 - (avgPriceVsMarket - 0.5) * 20)),
  );

  const reliability = Math.min(
    25,
    Math.round(onTimeRate * 20) + Math.min(5, Math.floor(projectsCompleted / 5)),
  );

  const value = Math.min(
    25,
    Math.round((qualityRating / Math.max(avgPriceVsMarket, 0.001)) * 5),
  );

  const overallScore = quality + price + reliability + value;

  return {
    overallScore,
    components: { quality, price, reliability, value },
  };
}

export function analyzeQuotation(
  quotedPrice: number,
  marketRate: MarketRate,
): { verdict: PriceVerdict; percentVsMedian: number } {
  const { low, median } = marketRate;

  const percentVsMedian = Math.round(((quotedPrice - median) / median) * 100);

  let verdict: PriceVerdict;
  if (quotedPrice < low) {
    verdict = "below_market";
  } else if (quotedPrice > median * 1.5) {
    verdict = "above_market";
  } else {
    verdict = "fair";
  }

  return { verdict, percentVsMedian };
}

// ── DB Operations ──

export async function createVendor(
  clientId: string,
  name: string,
  category: VendorCategory,
  contactInfo?: Record<string, unknown>,
): Promise<string> {
  const [row] = await db
    .insert(schema.clientVendors)
    .values({
      clientId,
      name,
      category,
      contactInfo: contactInfo ?? {},
    })
    .returning({ id: schema.clientVendors.id });

  return row.id;
}

export async function listVendors(
  clientId: string,
  category?: VendorCategory,
) {
  const conditions = [eq(schema.clientVendors.clientId, clientId)];
  if (category) {
    conditions.push(eq(schema.clientVendors.category, category));
  }

  return db
    .select()
    .from(schema.clientVendors)
    .where(and(...conditions));
}

export async function getVendor(vendorId: string) {
  const [row] = await db
    .select()
    .from(schema.clientVendors)
    .where(eq(schema.clientVendors.id, vendorId))
    .limit(1);

  return row ?? null;
}

export async function submitQuotation(
  clientId: string,
  vendorId: string,
  serviceDescription: string,
  quotedPrice: number,
  region = "North America",
): Promise<QuotationAnalysis> {
  const marketRate = await getMarketRate(serviceDescription, region);
  const { verdict, percentVsMedian } = analyzeQuotation(quotedPrice, marketRate);

  const [row] = await db
    .insert(schema.vendorQuotations)
    .values({
      clientId,
      vendorId,
      serviceDescription,
      quotedPrice: String(quotedPrice),
      marketRate: marketRate as unknown as Record<string, unknown>,
      verdict,
      status: "pending",
    })
    .returning({ id: schema.vendorQuotations.id });

  return {
    quotationId: row.id,
    vendorId,
    serviceDescription,
    quotedPrice,
    marketRate,
    verdict,
    percentVsMedian,
  };
}

export async function compareVendors(clientId: string): Promise<VendorScore[]> {
  const vendors = await listVendors(clientId);

  const scores: VendorScore[] = vendors.map((vendor) => {
    // Derive score inputs from stored score data or use neutral defaults
    const stored = vendor.score as Record<string, unknown> | null;

    const qualityRating: number =
      typeof stored?.qualityRating === "number" ? stored.qualityRating : 3;
    const avgPriceVsMarket: number =
      typeof stored?.avgPriceVsMarket === "number" ? stored.avgPriceVsMarket : 1.0;
    const onTimeRate: number =
      typeof stored?.onTimeRate === "number" ? stored.onTimeRate : 0.8;
    const projectsCompleted: number =
      typeof stored?.projectsCompleted === "number" ? stored.projectsCompleted : 0;

    const { overallScore, components } = computeVendorScore({
      qualityRating,
      avgPriceVsMarket,
      onTimeRate,
      projectsCompleted,
    });

    return {
      vendorId: vendor.id,
      name: vendor.name,
      category: vendor.category as VendorCategory,
      overallScore,
      components,
      history: {
        projectsCompleted,
        avgDeliveryTime: typeof stored?.avgDeliveryTime === "number" ? stored.avgDeliveryTime : 0,
        onTimeRate,
        avgPriceVsMarket,
      },
    };
  });

  // Update scores in DB
  await Promise.all(
    scores.map((s) =>
      db
        .update(schema.clientVendors)
        .set({
          score: {
            overallScore: s.overallScore,
            components: s.components,
          } as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(schema.clientVendors.id, s.vendorId)),
    ),
  );

  return scores.sort((a, b) => b.overallScore - a.overallScore);
}

export async function runVendorValidation(clientId: string): Promise<BudgetStepResult> {
  try {
    const scores = await compareVendors(clientId);

    return {
      step: "vendor_validation",
      status: "completed",
      data: { vendors: scores, totalVendors: scores.length },
      artifactContent: JSON.stringify(scores, null, 2),
    };
  } catch (error) {
    return {
      step: "vendor_validation",
      status: "failed",
      data: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}
