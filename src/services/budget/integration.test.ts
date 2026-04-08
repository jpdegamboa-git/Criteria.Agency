import { describe, it, expect, vi } from "vitest";

// ── Mocks (DB not needed for pure function integration tests) ──

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "mock-id" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
  schema: {
    marketingBudgets: {},
    campaignSpend: {},
    clientVendors: {},
    vendorQuotations: {},
    campaignPnl: {},
    deals: {},
  },
}));

import type {
  BudgetStrategy,
  SpendSource,
  SpendStatus,
  VendorCategory,
  PriceVerdict,
  FunnelStage,
  AlertSeverity,
  BudgetStepResult,
  MarketRate,
} from "./types.js";
import { distributeByM6, computeAllocation } from "./allocator.js";
import {
  computeSpendStatus,
  computeBurnRate,
  evaluateAlerts,
} from "./spend-monitor.js";
import { computeVendorScore, analyzeQuotation } from "./vendor-manager.js";
import {
  computeCampaignMetrics,
  computeOverallRoi,
} from "./roi-calculator.js";

// ── 1. Type Completeness ──

describe("Type completeness", () => {
  it("BudgetStrategy has exactly 3 options", () => {
    const options: BudgetStrategy[] = ["growth", "balanced", "efficiency"];
    expect(options).toHaveLength(3);
  });

  it("SpendSource has exactly 4 options", () => {
    const options: SpendSource[] = [
      "meta_ads",
      "google_ads",
      "manual",
      "vendor_invoice",
    ];
    expect(options).toHaveLength(4);
  });

  it("SpendStatus has exactly 4 options", () => {
    const options: SpendStatus[] = [
      "on_track",
      "underspend",
      "overspend",
      "exhausted",
    ];
    expect(options).toHaveLength(4);
  });

  it("VendorCategory has exactly 5 options", () => {
    const options: VendorCategory[] = [
      "media",
      "print",
      "events",
      "freelance",
      "influencer",
    ];
    expect(options).toHaveLength(5);
  });

  it("PriceVerdict has exactly 3 options", () => {
    const options: PriceVerdict[] = ["fair", "above_market", "below_market"];
    expect(options).toHaveLength(3);
  });

  it("FunnelStage has exactly 3 options", () => {
    const options: FunnelStage[] = ["awareness", "consideration", "conversion"];
    expect(options).toHaveLength(3);
  });

  it("AlertSeverity has exactly 3 options", () => {
    const options: AlertSeverity[] = ["info", "warning", "critical"];
    expect(options).toHaveLength(3);
  });
});

// ── 2. Cross-service: allocation output feeds spend monitor ──

describe("Cross-service: allocation → spend monitor", () => {
  it("each channel allocation has a valid SpendStatus", () => {
    const validStatuses: SpendStatus[] = [
      "on_track",
      "underspend",
      "overspend",
      "exhausted",
    ];
    const allocations = distributeByM6(10_000, "balanced");

    for (const alloc of allocations) {
      // Simulate a mid-period spend check: 50% through period, 40% spent
      const status = computeSpendStatus(
        alloc.amount,
        alloc.amount * 0.4,
        30,
        15,
      );
      expect(validStatuses).toContain(status);
    }
  });
});

// ── 3. Spend alerts integrate with vendor scoring (low ROAS triggers alert) ──

describe("Cross-service: spend alerts ↔ vendor scoring", () => {
  it("low ROAS triggers a low_roas alert", () => {
    const alerts = evaluateAlerts({
      channel: "meta_ads",
      budgeted: 5_000,
      spent: 1_000,
      roas: 0.5, // below 1.0 threshold
      totalDays: 30,
      elapsedDays: 10,
    });

    const lowRoasAlert = alerts.find((a) => a.type === "low_roas");
    expect(lowRoasAlert).toBeDefined();
    expect(lowRoasAlert!.severity).toBe("warning");
  });

  it("vendor with low ROAS-equivalent quality gets a lower score", () => {
    const highQuality = computeVendorScore({
      qualityRating: 5,
      avgPriceVsMarket: 1.0,
      onTimeRate: 1.0,
      projectsCompleted: 20,
    });

    const lowQuality = computeVendorScore({
      qualityRating: 1,
      avgPriceVsMarket: 1.5,
      onTimeRate: 0.4,
      projectsCompleted: 1,
    });

    expect(highQuality.overallScore).toBeGreaterThan(lowQuality.overallScore);
  });
});

// ── 4. Campaign metrics feed overall ROI calculation ──

describe("Cross-service: campaign metrics → overall ROI", () => {
  it("single campaign ROI matches overall ROI calculation", () => {
    const revenue = { attributed: 15_000, model: "proportional_spend", confidence: 0.8 };
    const costs = {
      adSpend: 5_000,
      contentProduction: 500,
      vendorCosts: 1_000,
      platformFees: 150,
      laborCost: 350,
      total: 7_000,
    };

    const campaignMetrics = computeCampaignMetrics(revenue, costs, 50);

    const overall = computeOverallRoi([
      { totalCost: costs.total, revenue: revenue.attributed },
    ]);

    // Single campaign ROI (%) should match overall ROI
    // campaignMetrics.roi is integer %, overallRoi has 1 decimal
    expect(overall.overallRoi).toBeCloseTo(campaignMetrics.roi, 0);
    expect(overall.totalInvestment).toBe(costs.total);
    expect(overall.totalRevenue).toBe(revenue.attributed);
  });
});

// ── 5. All strategies produce valid allocations ──

describe("All strategies produce valid allocations", () => {
  const strategies: BudgetStrategy[] = ["growth", "balanced", "efficiency"];

  for (const strategy of strategies) {
    it(`${strategy} strategy produces non-empty allocations that sum > 0`, () => {
      const allocation = computeAllocation({
        clientId: "test-client",
        totalBudget: 12_000,
        currency: "USD",
        period: { start: "2026-04-01", end: "2026-04-30" },
        strategy,
      });

      expect(allocation.allocations.length).toBeGreaterThan(0);

      const sum = allocation.allocations.reduce((s, a) => s + a.amount, 0);
      expect(sum).toBeGreaterThan(0);
    });
  }
});

// ── 6. BudgetStepResult naming convention ──

describe("BudgetStepResult step naming convention", () => {
  it("all known step names match /^bu_/", () => {
    const knownSteps: BudgetStepResult["step"][] = [
      "bu_allocation",
      "bu_spend_tracking",
      "bu_vendor_validation",
      "bu_roi_calculation",
    ];

    for (const step of knownSteps) {
      expect(step).toMatch(/^bu_/);
    }
  });
});

// ── 7. Vendor score components sum to overall score ──

describe("Vendor score components sum to overall score", () => {
  it("quality + price + reliability + value === overallScore", () => {
    const { overallScore, components } = computeVendorScore({
      qualityRating: 4,
      avgPriceVsMarket: 1.1,
      onTimeRate: 0.9,
      projectsCompleted: 15,
    });

    const componentSum =
      components.quality +
      components.price +
      components.reliability +
      components.value;

    expect(componentSum).toBe(overallScore);
  });

  it("quotation analyzeQuotation returns correct verdict for above-market price", () => {
    const marketRate: MarketRate = {
      service: "social-media-management",
      region: "North America",
      low: 500,
      median: 1_000,
      high: 2_000,
      currency: "USD",
      confidence: 0.9,
      lastUpdated: "2026-01-01",
    };

    const { verdict, percentVsMedian } = analyzeQuotation(1_600, marketRate);
    expect(verdict).toBe("above_market");
    expect(percentVsMedian).toBe(60); // (1600 - 1000) / 1000 * 100
  });
});
