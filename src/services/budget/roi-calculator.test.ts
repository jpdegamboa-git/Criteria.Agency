import { describe, it, expect, vi } from "vitest";

// ── Mocks (DB and providers not used by pure functions) ──

vi.mock("../../db/index.js", () => ({
  db: {},
  schema: {},
}));

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("{}"),
}));

vi.mock("../../shared/parse-json.js", () => ({
  parseJsonSafe: vi.fn((text: string, fallback: unknown) => {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }),
}));

import {
  computeCampaignMetrics,
  computeOverallRoi,
} from "./roi-calculator.js";
import type { CampaignCosts, CampaignRevenue } from "./types.js";

// ── Tests ──

describe("computeCampaignMetrics", () => {
  it("calculates ROI correctly", () => {
    const costs: CampaignCosts = {
      adSpend: 5000,
      contentProduction: 1000,
      vendorCosts: 500,
      platformFees: 210,
      laborCost: 290,
      total: 7000,
    };
    const revenue: CampaignRevenue = {
      attributed: 21000,
      model: "proportional_spend",
      confidence: 0.8,
    };
    const leadCount = 100;

    const metrics = computeCampaignMetrics(revenue, costs, leadCount);

    expect(metrics.roi).toBe(200);
    expect(metrics.roas).toBe(3);
    expect(metrics.profitLoss).toBe(14000);
    expect(metrics.cpa).toBe(70);
    expect(metrics.revenuePerLead).toBe(210);
  });

  it("handles zero costs gracefully", () => {
    const costs: CampaignCosts = {
      adSpend: 0,
      contentProduction: 0,
      vendorCosts: 0,
      platformFees: 0,
      laborCost: 0,
      total: 0,
    };
    const revenue: CampaignRevenue = {
      attributed: 0,
      model: "proportional_spend",
      confidence: 0,
    };

    const metrics = computeCampaignMetrics(revenue, costs, 0);

    expect(metrics.roi).toBe(0);
    expect(metrics.roas).toBe(0);
    expect(metrics.profitLoss).toBe(0);
    expect(metrics.cpa).toBe(0);
    expect(metrics.revenuePerLead).toBe(0);
  });
});

describe("computeOverallRoi", () => {
  it("aggregates multiple campaigns correctly", () => {
    const campaigns = [
      { totalCost: 5000, revenue: 15000 },
      { totalCost: 3000, revenue: 6000 },
    ];

    const result = computeOverallRoi(campaigns);

    expect(result.totalInvestment).toBe(8000);
    expect(result.totalRevenue).toBe(21000);
    // overallRoi = (21000 - 8000) / 8000 * 100 = 162.5
    expect(result.overallRoi).toBeCloseTo(162.5, 1);
    // overallRoas = 21000 / 8000 = 2.625
    expect(result.overallRoas).toBeCloseTo(2.625, 3);
  });

  it("handles empty campaigns array", () => {
    const result = computeOverallRoi([]);

    expect(result.totalInvestment).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.overallRoi).toBe(0);
    expect(result.overallRoas).toBe(0);
  });
});
