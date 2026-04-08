import type { AnalyticsDataProvider, MetricDataPoint, DateRange } from "../../services/analytics/types.js";

function generateStubMetrics(
  clientId: string,
  metrics: string[],
  dateRange: DateRange,
  source: string,
  baseValues: Record<string, number>,
): MetricDataPoint[] {
  const points: MetricDataPoint[] = [];
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    for (const metric of metrics) {
      const base = baseValues[metric] ?? 100;
      const variation = base * 0.2 * (Math.random() * 2 - 1);
      points.push({
        date: dateStr,
        metric,
        value: Math.round((base + variation) * 100) / 100,
        dimensions: { source },
        source,
      });
    }
  }
  return points;
}

export const stubGoogleAnalytics: AnalyticsDataProvider = {
  name: "Google Analytics (Stub)",
  source: "google_analytics",
  async fetchMetrics(clientId, metrics, dateRange) {
    return generateStubMetrics(clientId, metrics, dateRange, "google_analytics", {
      sessions: 1200,
      page_views: 3500,
      bounce_rate: 45,
      avg_session_duration: 180,
      conversions: 35,
      organic_traffic: 800,
    });
  },
  isAvailable() { return true; },
};

export const stubMetaAds: AnalyticsDataProvider = {
  name: "Meta Ads (Stub)",
  source: "meta_ads",
  async fetchMetrics(clientId, metrics, dateRange) {
    return generateStubMetrics(clientId, metrics, dateRange, "meta_ads", {
      spend: 150,
      impressions: 25000,
      clicks: 750,
      conversions: 20,
      cpc: 0.20,
      cpm: 6.0,
      roas: 3.2,
    });
  },
  isAvailable() { return true; },
};

export const stubGoogleAds: AnalyticsDataProvider = {
  name: "Google Ads (Stub)",
  source: "google_ads",
  async fetchMetrics(clientId, metrics, dateRange) {
    return generateStubMetrics(clientId, metrics, dateRange, "google_ads", {
      spend: 200,
      impressions: 30000,
      clicks: 900,
      conversions: 25,
      cpc: 0.22,
      cpm: 6.67,
      roas: 2.8,
    });
  },
  isAvailable() { return true; },
};

export function getAllProviders(): AnalyticsDataProvider[] {
  return [stubGoogleAnalytics, stubMetaAds, stubGoogleAds];
}
