import { describe, it, expect } from "vitest";
import { stubGoogleAnalytics, stubMetaAds, stubGoogleAds, getAllProviders } from "./stub-providers.js";
import type { DateRange } from "../../services/analytics/types.js";

const range: DateRange = { start: "2026-03-01", end: "2026-03-03" };

describe("stub analytics providers", () => {
  it("Google Analytics returns metrics for date range", async () => {
    const points = await stubGoogleAnalytics.fetchMetrics("c1", ["sessions", "page_views"], range);
    expect(points.length).toBe(6);
    expect(points[0].source).toBe("google_analytics");
    expect(points[0]).toHaveProperty("date");
    expect(points[0]).toHaveProperty("value");
  });

  it("Meta Ads returns metrics for date range", async () => {
    const points = await stubMetaAds.fetchMetrics("c1", ["spend"], range);
    expect(points.length).toBe(3);
    expect(points[0].source).toBe("meta_ads");
  });

  it("Google Ads returns metrics for date range", async () => {
    const points = await stubGoogleAds.fetchMetrics("c1", ["clicks", "conversions"], range);
    expect(points.length).toBe(6);
    expect(points[0].source).toBe("google_ads");
  });

  it("all providers report as available", () => {
    expect(stubGoogleAnalytics.isAvailable()).toBe(true);
    expect(stubMetaAds.isAvailable()).toBe(true);
    expect(stubGoogleAds.isAvailable()).toBe(true);
  });

  it("getAllProviders returns 3 providers", () => {
    const providers = getAllProviders();
    expect(providers).toHaveLength(3);
    expect(providers.map(p => p.source)).toEqual(["google_analytics", "meta_ads", "google_ads"]);
  });

  it("metric values have reasonable variation", async () => {
    const points = await stubGoogleAnalytics.fetchMetrics("c1", ["sessions"], range);
    for (const p of points) {
      expect(p.value).toBeGreaterThan(900);
      expect(p.value).toBeLessThan(1500);
    }
  });
});
