import { describe, it, expect } from "vitest";
import { computeVendorScore, analyzeQuotation } from "./vendor-manager.js";
import type { MarketRate } from "./types.js";

const marketRate: MarketRate = {
  service: "Photography session",
  region: "LATAM",
  low: 200,
  median: 800,
  high: 3000,
  currency: "USD",
  confidence: 0.8,
  lastUpdated: "2026-04-01",
};

describe("computeVendorScore", () => {
  it("scores a vendor with balanced components", () => {
    const result = computeVendorScore({
      qualityRating: 3.5,
      avgPriceVsMarket: 1.0,
      onTimeRate: 0.8,
      projectsCompleted: 10,
    });

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.components.quality).toBeLessThanOrEqual(25);
    expect(result.components.price).toBeLessThanOrEqual(25);
    expect(result.components.reliability).toBeLessThanOrEqual(25);
    expect(result.components.value).toBeLessThanOrEqual(25);
  });

  it("scores high quality vendor higher than low quality vendor", () => {
    const high = computeVendorScore({
      qualityRating: 5,
      avgPriceVsMarket: 1.0,
      onTimeRate: 0.95,
      projectsCompleted: 20,
    });

    const low = computeVendorScore({
      qualityRating: 2,
      avgPriceVsMarket: 1.0,
      onTimeRate: 0.5,
      projectsCompleted: 2,
    });

    expect(high.overallScore).toBeGreaterThan(low.overallScore);
  });
});

describe("analyzeQuotation", () => {
  it("returns fair for price near median", () => {
    const result = analyzeQuotation(750, marketRate);
    expect(result.verdict).toBe("fair");
  });

  it("returns above_market for expensive quote", () => {
    const result = analyzeQuotation(2500, marketRate);
    expect(result.verdict).toBe("above_market");
  });

  it("returns below_market for cheap quote", () => {
    const result = analyzeQuotation(150, marketRate);
    expect(result.verdict).toBe("below_market");
  });

  it("calculates percent vs median correctly", () => {
    const result = analyzeQuotation(1600, marketRate);
    expect(result.percentVsMedian).toBe(100);
  });
});
