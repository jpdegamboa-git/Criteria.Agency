import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeAttribution, runAttribution } from "./attribution.js";

// ── Fixtures ──

const DEALS = [
  {
    id: "d1",
    leadId: "l1",
    value: "1000",
    stage: "closed_won",
    closedAt: new Date("2026-03-15"),
    clientId: "c1",
  },
  {
    id: "d2",
    leadId: "l2",
    value: "2000",
    stage: "closed_won",
    closedAt: new Date("2026-03-20"),
    clientId: "c1",
  },
];

const TOUCHPOINTS = [
  {
    id: "t1",
    channel: "meta_ads",
    campaign: "spring",
    timestamp: new Date("2026-03-01"),
    leadId: "l1",
  },
  {
    id: "t2",
    channel: "email",
    campaign: "nurture",
    timestamp: new Date("2026-03-10"),
    leadId: "l1",
  },
  {
    id: "t3",
    channel: "google_ads",
    campaign: "brand",
    timestamp: new Date("2026-03-05"),
    leadId: "l2",
  },
];

// ── Mock DB ──
// Touchpoints are queried once per unique leadId in order (l1 then l2).
// We use a call counter so each invocation returns the correct subset.

const TOUCHPOINTS_BY_LEAD: Record<string, typeof TOUCHPOINTS> = {
  l1: TOUCHPOINTS.filter((t) => t.leadId === "l1"),
  l2: TOUCHPOINTS.filter((t) => t.leadId === "l2"),
};

let touchpointCallCount = 0;
const LEAD_ORDER = ["l1", "l2"];

vi.mock("../../db/index.js", () => {
  const makeChain = (tableRef: unknown) => ({
    where: (..._args: unknown[]) => {
      if (tableRef === "deals_table") {
        return Promise.resolve(DEALS);
      }
      if (tableRef === "touchpoints_table") {
        const leadId = LEAD_ORDER[touchpointCallCount % LEAD_ORDER.length];
        touchpointCallCount++;
        return Promise.resolve(TOUCHPOINTS_BY_LEAD[leadId] ?? []);
      }
      return Promise.resolve([]);
    },
  });

  return {
    db: {
      select: () => ({
        from: (table: unknown) => makeChain(table),
      }),
    },
    schema: {
      deals: "deals_table",
      leadTouchpoints: "touchpoints_table",
      analyticsMetrics: "metrics_table",
    },
  };
});

// ── Mock queryMetrics ──

vi.mock("./data-collector.js", () => ({
  queryMetrics: vi.fn().mockResolvedValue([
    {
      date: "2026-03-01",
      metric: "spend",
      value: 500,
      dimensions: { source: "meta_ads" },
      source: "meta_ads",
    },
  ]),
}));

const period = { start: "2026-03-01", end: "2026-03-31" };

// ── Tests ──

describe("attribution", () => {
  beforeEach(() => {
    touchpointCallCount = 0;
  });

  it("computeAttribution returns valid report structure", async () => {
    const report = await computeAttribution("c1", "first_touch", period);
    expect(report.model).toBe("first_touch");
    expect(report.period).toEqual(period);
    expect(report.totalRevenue).toBe(3000);
    expect(report.byChannel).toBeInstanceOf(Array);
    expect(report.byCampaign).toBeInstanceOf(Array);
    expect(report.pathAnalysis).toHaveProperty("avgPathLength");
    expect(report.pathAnalysis).toHaveProperty("commonPaths");
  });

  it("byChannel sums to totalRevenue", async () => {
    const report = await computeAttribution("c1", "linear", period);
    const channelSum = report.byChannel.reduce(
      (s, c) => s + c.attributedRevenue,
      0,
    );
    expect(Math.round(channelSum)).toBe(Math.round(report.totalRevenue));
  });

  it("first_touch gives 100% to first touchpoint channel per deal", async () => {
    const report = await computeAttribution("c1", "first_touch", period);
    // Deal 1 (value=1000): first tp is meta_ads (2026-03-01)
    // Deal 2 (value=2000): only tp is google_ads (2026-03-05)
    const meta = report.byChannel.find((c) => c.channel === "meta_ads");
    const google = report.byChannel.find((c) => c.channel === "google_ads");
    expect(meta?.attributedRevenue).toBe(1000);
    expect(google?.attributedRevenue).toBe(2000);
  });

  it("ROAS calculated correctly when spend data available", async () => {
    const report = await computeAttribution("c1", "first_touch", period);
    const meta = report.byChannel.find((c) => c.channel === "meta_ads");
    // 1000 revenue / 500 spend = 2.0 ROAS
    expect(meta?.roas).toBe(2);
  });

  it("runAttribution returns AnalyticsStepResult", async () => {
    const result = await runAttribution("c1", "last_touch", period);
    expect(result.step).toBe("an_analyze");
    expect(result.status).toBe("completed");
    expect(result.data).toHaveProperty("model", "last_touch");
  });
});
