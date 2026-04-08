import { describe, it, expect } from "vitest";
import { getMarketRate, stubMarketRateProvider } from "./stub-market-rates.js";

describe("stubMarketRateProvider", () => {
  it("has correct provider metadata", () => {
    expect(stubMarketRateProvider.name).toBe("stub-market-rates");
    expect(stubMarketRateProvider.isAvailable()).toBe(true);
    expect(typeof stubMarketRateProvider.getRate).toBe("function");
  });

  it("getMarketRate returns a valid MarketRate", async () => {
    const rate = await getMarketRate("30-second tv spot", "North America");

    expect(rate.service).toBe("30-second tv spot");
    expect(rate.region).toBe("North America");
    expect(typeof rate.low).toBe("number");
    expect(typeof rate.median).toBe("number");
    expect(typeof rate.high).toBe("number");
    expect(rate.currency).toBe("USD");
    expect(rate.confidence).toBeGreaterThan(0);
    expect(rate.confidence).toBeLessThanOrEqual(1);
    expect(rate.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Ordering invariant
    expect(rate.low).toBeLessThanOrEqual(rate.median);
    expect(rate.median).toBeLessThanOrEqual(rate.high);
  });

  it("returns different rates for different services", async () => {
    const [rateA, rateB] = await Promise.all([
      getMarketRate("brand identity package", "North America"),
      getMarketRate("1000 business cards", "North America"),
    ]);

    expect(rateA.median).toBeGreaterThan(0);
    expect(rateB.median).toBeGreaterThan(0);
    expect(rateA.median).not.toBe(rateB.median);
  });
});
