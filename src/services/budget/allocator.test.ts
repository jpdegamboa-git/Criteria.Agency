import { describe, it, expect, vi } from "vitest";

// ── Mocks (DB not used by pure functions) ──

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
    marketingBudgets: {
      id: "id",
      clientId: "client_id",
      periodStart: "period_start",
      periodEnd: "period_end",
    },
  },
}));

import { distributeByM6, computeAllocation } from "./allocator.js";
import type { BudgetConstraints, FunnelStage } from "./types.js";

// ── Tests ──

describe("distributeByM6", () => {
  it("distributes budget across funnel stages — total allocations ≈ totalBudget", () => {
    const totalBudget = 10_000;
    const allocations = distributeByM6(totalBudget, "balanced");

    const sum = allocations.reduce((acc, a) => acc + a.amount, 0);
    // Allow up to $1 rounding drift across 6 channels
    expect(sum).toBeCloseTo(totalBudget, 0);
  });

  it("growth strategy favors awareness over conversion", () => {
    const allocations = distributeByM6(10_000, "growth");

    const awarenessTotal = allocations
      .filter((a) => a.funnelStage === "awareness")
      .reduce((acc, a) => acc + a.amount, 0);

    const conversionTotal = allocations
      .filter((a) => a.funnelStage === "conversion")
      .reduce((acc, a) => acc + a.amount, 0);

    expect(awarenessTotal).toBeGreaterThan(conversionTotal);
  });

  it("efficiency strategy favors conversion over awareness", () => {
    const allocations = distributeByM6(10_000, "efficiency");

    const awarenessTotal = allocations
      .filter((a) => a.funnelStage === "awareness")
      .reduce((acc, a) => acc + a.amount, 0);

    const conversionTotal = allocations
      .filter((a) => a.funnelStage === "conversion")
      .reduce((acc, a) => acc + a.amount, 0);

    expect(conversionTotal).toBeGreaterThan(awarenessTotal);
  });

  it("applies fixed allocation constraints — meta_ads gets exactly 3000", () => {
    const constraints: BudgetConstraints = {
      minPerChannel: 0,
      maxPerChannel: Infinity,
      fixedAllocations: [
        { channel: "meta_ads", amount: 3_000, reason: "committed spend" },
      ],
    };

    const allocations = distributeByM6(10_000, "balanced", constraints);

    const metaAlloc = allocations.find((a) => a.channel === "meta_ads");
    expect(metaAlloc).toBeDefined();
    expect(metaAlloc!.amount).toBe(3_000);
  });
});

describe("computeAllocation", () => {
  it("returns a complete BudgetAllocation with correct shape", () => {
    const result = computeAllocation({
      clientId: "client-abc",
      totalBudget: 20_000,
      currency: "USD",
      period: { start: "2026-04-01", end: "2026-04-30" },
      strategy: "balanced",
    });

    expect(result.clientId).toBe("client-abc");
    expect(result.totalBudget).toBe(20_000);
    expect(result.allocations.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
