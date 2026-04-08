import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateUnitEconomics, computeCohorts, runUnitEconomics } from "./unit-economics.js";
import type { DateRange } from "./types.js";

vi.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: "d1", leadId: "l1", value: "1000", stage: "closed_won", closedAt: new Date("2026-03-10"), clientId: "c1" },
            { id: "d2", leadId: "l2", value: "2000", stage: "closed_won", closedAt: new Date("2026-03-20"), clientId: "c1" },
            { id: "d3", leadId: "l3", value: "1500", stage: "closed_won", closedAt: new Date("2026-04-05"), clientId: "c1" },
          ]),
      }),
    }),
  },
  schema: { deals: "deals" },
}));

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    { date: "2026-03-01", metric: "spend", value: 300, dimensions: { source: "meta_ads" }, source: "meta_ads" },
    { date: "2026-03-15", metric: "spend", value: 200, dimensions: { source: "google_ads" }, source: "google_ads" },
  ]),
}));

const period: DateRange = { start: "2026-03-01", end: "2026-03-31" };
const clientId = "c1";

describe("calculateUnitEconomics", () => {
  it("computes CAC = 500 / 2 = 250 (only March deals in period)", async () => {
    const result = await calculateUnitEconomics(clientId, period);
    expect(result.cac).toBe(250);
  });

  it("computes LTV = avgRevenue × 12 = ((1000+2000)/2) × 12 = 18000", async () => {
    const result = await calculateUnitEconomics(clientId, period);
    expect(result.ltv).toBe(18000);
  });

  it("computes LTV:CAC ratio = 18000 / 250 = 72", async () => {
    const result = await calculateUnitEconomics(clientId, period);
    expect(result.ltvCacRatio).toBe(72);
  });

  it("computes CAC by channel proportional to channel spend", async () => {
    const result = await calculateUnitEconomics(clientId, period);
    expect(result.cacByChannel).toBeDefined();
    expect(Object.keys(result.cacByChannel).length).toBeGreaterThan(0);
    // meta_ads: 300/2 = 150, google_ads: 200/2 = 100
    expect(result.cacByChannel["meta_ads"]).toBe(150);
    expect(result.cacByChannel["google_ads"]).toBe(100);
  });

  it("has stub values for monthlyChurnRate and netRevenueRetention", async () => {
    const result = await calculateUnitEconomics(clientId, period);
    expect(result.monthlyChurnRate).toBe(5);
    expect(result.netRevenueRetention).toBe(105);
  });

  it("includes period and computedAt", async () => {
    const result = await calculateUnitEconomics(clientId, period);
    expect(result.period).toEqual(period);
    expect(result.computedAt).toBeTruthy();
  });
});

describe("computeCohorts", () => {
  it("groups deals by month of closure", async () => {
    const cohorts = await computeCohorts(clientId, period);
    // Only March deals fall within the period (2026-03-01 to 2026-03-31)
    expect(cohorts).toHaveLength(1);
    expect(cohorts[0].cohortMonth).toBe("2026-03");
    expect(cohorts[0].size).toBe(2);
  });

  it("cohort has revenueByMonth, cumulativeLtv, and retentionByMonth", async () => {
    const cohorts = await computeCohorts(clientId, period);
    const marchCohort = cohorts.find((c) => c.cohortMonth === "2026-03");
    expect(marchCohort).toBeDefined();
    expect(marchCohort!.revenueByMonth).toBeInstanceOf(Array);
    expect(marchCohort!.retentionByMonth).toBeInstanceOf(Array);
    expect(marchCohort!.cumulativeLtv).toBeGreaterThan(0);
  });
});

describe("runUnitEconomics", () => {
  it("returns an AnalyticsStepResult with completed status", async () => {
    const result = await runUnitEconomics(clientId, period);
    expect(result.step).toBe("an_unit_economics");
    expect(result.status).toBe("completed");
    expect(result.data).toBeDefined();
  });

  it("result data includes unitEconomics and cohorts", async () => {
    const result = await runUnitEconomics(clientId, period);
    const data = result.data as { unitEconomics: unknown; cohorts: unknown[] };
    expect(data.unitEconomics).toBeDefined();
    expect(data.cohorts).toBeInstanceOf(Array);
  });
});
