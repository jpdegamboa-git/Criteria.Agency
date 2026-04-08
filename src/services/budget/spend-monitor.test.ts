import { describe, it, expect, vi } from "vitest";

// ── Mocks (DB not used by pure functions) ──

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "mock-id" }]),
  },
  schema: {
    campaignSpend: {
      id: "id",
      clientId: "client_id",
      budgetId: "budget_id",
      campaignName: "campaign_name",
      channel: "channel",
      date: "date",
      amount: "amount",
      currency: "currency",
      source: "source",
      metadata: "metadata",
    },
  },
}));

vi.mock("./allocator.js", () => ({
  getCurrentBudget: vi.fn().mockResolvedValue(null),
}));

import {
  computeSpendStatus,
  computeBurnRate,
  evaluateAlerts,
} from "./spend-monitor.js";

// ── Tests ──

describe("computeSpendStatus", () => {
  it("returns on_track when spent is within budget", () => {
    // 50% spent at day 15 of 30 — perfectly on track
    expect(computeSpendStatus(1000, 500, 30, 15)).toBe("on_track");
  });

  it("returns overspend when spent exceeds budget", () => {
    expect(computeSpendStatus(1000, 1100, 30, 30)).toBe("overspend");
  });

  it("returns exhausted when remaining is zero", () => {
    // Exactly equal — exhausted (period still has 5 days left, but that's irrelevant to status)
    expect(computeSpendStatus(1000, 1000, 30, 25)).toBe("exhausted");
  });

  it("returns underspend when pace is too low", () => {
    // 30% spent at day 20 of 30 (66% elapsed) — actual pace 0.3 < expected 0.66 * 0.5 = 0.33
    expect(computeSpendStatus(1000, 300, 30, 20)).toBe("underspend");
  });
});

describe("computeBurnRate", () => {
  it("calculates daily burn rate", () => {
    expect(computeBurnRate(3000, 10)).toBe(300);
  });

  it("returns 0 for 0 days", () => {
    expect(computeBurnRate(0, 0)).toBe(0);
  });
});

describe("evaluateAlerts", () => {
  it("generates overspend alert when spent exceeds budget", () => {
    const alerts = evaluateAlerts({
      channel: "meta_ads",
      budgeted: 1000,
      spent: 1200,
      roas: 2.0,
      totalDays: 30,
      elapsedDays: 30,
    });
    const types = alerts.map((a) => a.type);
    expect(types).toContain("overspend");
  });

  it("generates low_roas alert when ROAS is below 1.0", () => {
    const alerts = evaluateAlerts({
      channel: "google_ads",
      budgeted: 1000,
      spent: 200,
      roas: 0.5,
      totalDays: 30,
      elapsedDays: 10,
    });
    const types = alerts.map((a) => a.type);
    expect(types).toContain("low_roas");
  });

  it("returns empty array for a healthy channel", () => {
    // ~50% spent at day 15 of 30, good ROAS
    const alerts = evaluateAlerts({
      channel: "email_marketing",
      budgeted: 1000,
      spent: 500,
      roas: 4.0,
      totalDays: 30,
      elapsedDays: 15,
    });
    expect(alerts).toHaveLength(0);
  });
});
