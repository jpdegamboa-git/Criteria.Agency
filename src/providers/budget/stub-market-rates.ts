import { generateText } from "../../providers/generate-text.js";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type { MarketRate } from "../../services/budget/types.js";

const MODEL = "gemini-2.5-flash";

// ---------------------------------------------------------------------------
// Base rates in USD (North America = 1.0 baseline)
// Each entry: [low, median, high]
// ---------------------------------------------------------------------------
const BASE_RATES: Record<string, [number, number, number]> = {
  "30-second tv spot":                    [8000,  15000,  35000],
  "60-second tv spot":                    [12000, 25000,  60000],
  "social media management (monthly)":    [800,   2000,   5000],
  "brand identity package":               [3000,  8000,   25000],
  "1000 business cards":                  [80,    150,    400],
  "full-page magazine ad":                [2000,  5000,   15000],
  "half-page magazine ad":                [1000,  2500,   8000],
  "outdoor billboard (monthly)":          [1500,  4000,   12000],
  "radio spot (30-second)":               [500,   1500,   4000],
  "product photography (per day)":        [800,   2000,   5000],
  "explainer video (60-second)":          [3000,  7000,   18000],
  "email marketing campaign":             [500,   1500,   4000],
  "influencer post (micro, 10k-100k)":    [200,   800,    3000],
  "influencer post (macro, 100k-1m)":     [2000,  8000,   30000],
  "copywriting (per page)":               [80,    200,    600],
};

// ---------------------------------------------------------------------------
// Regional multipliers relative to North America baseline
// ---------------------------------------------------------------------------
const REGION_MULTIPLIERS: Record<string, number> = {
  "LATAM":          0.6,
  "North America":  1.0,
  "Europe":         0.9,
  "Asia Pacific":   0.7,
  "Middle East":    0.85,
};

const DEFAULT_MULTIPLIER = 1.0;

// ---------------------------------------------------------------------------
// LLM estimation for unknown services
// ---------------------------------------------------------------------------
async function estimateViallm(service: string, region: string): Promise<MarketRate | null> {
  const multiplier = REGION_MULTIPLIERS[region] ?? DEFAULT_MULTIPLIER;

  const prompt = `Provide a realistic market rate estimate in USD for the following marketing/advertising service:
Service: "${service}"
Region: "${region}" (apply a ${multiplier}x multiplier relative to North American baseline)

Respond ONLY with valid JSON in this exact shape:
{
  "low": <number>,
  "median": <number>,
  "high": <number>,
  "confidence": <number between 0 and 1>
}`;

  try {
    const raw = await generateText(
      MODEL,
      "You are a marketing industry pricing expert. Return only JSON, no prose.",
      prompt,
      256,
    );

    const parsed = parseJsonSafe<{ low?: number; median?: number; high?: number; confidence?: number }>(
      raw,
      {},
    );

    if (
      typeof parsed.low === "number" &&
      typeof parsed.median === "number" &&
      typeof parsed.high === "number"
    ) {
      return {
        service,
        region,
        low: parsed.low,
        median: parsed.median,
        high: parsed.high,
        currency: "USD",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.4,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    }
  } catch {
    // fall through to deterministic fallback
  }

  return null;
}

// ---------------------------------------------------------------------------
// Deterministic fallback for unknown services (test-stable)
// ---------------------------------------------------------------------------
function deterministicFallback(service: string, region: string): MarketRate {
  const multiplier = REGION_MULTIPLIERS[region] ?? DEFAULT_MULTIPLIER;
  const seed = service.length * 137;
  const median = Math.round((500 + (seed % 5000)) * multiplier);
  const low = Math.round(median * 0.6);
  const high = Math.round(median * 1.8);

  return {
    service,
    region,
    low,
    median,
    high,
    currency: "USD",
    confidence: 0.3,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function getMarketRate(service: string, region: string): Promise<MarketRate> {
  const key = service.toLowerCase().trim();
  const rates = BASE_RATES[key];

  if (rates) {
    const multiplier = REGION_MULTIPLIERS[region] ?? DEFAULT_MULTIPLIER;
    const [baseLow, baseMedian, baseHigh] = rates;
    return {
      service,
      region,
      low: Math.round(baseLow * multiplier),
      median: Math.round(baseMedian * multiplier),
      high: Math.round(baseHigh * multiplier),
      currency: "USD",
      confidence: 0.85,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
  }

  // Unknown service — try LLM, then deterministic fallback
  const llmResult = await estimateViallm(service, region);
  return llmResult ?? deterministicFallback(service, region);
}

export const stubMarketRateProvider = {
  name: "stub-market-rates",
  isAvailable: () => true,
  getRate: getMarketRate,
};
