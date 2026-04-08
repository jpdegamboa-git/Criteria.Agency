import { describe, it, expect } from "vitest";
import {
  firstTouch,
  lastTouch,
  linearAttribution,
  timeDecay,
  positionBased,
} from "./attribution-engine.js";

// ── Test Data ──

const touchpoints = [
  { id: "t1", channel: "google_ads",     campaign: "brand",    timestamp: "2026-01-01T00:00:00Z" },
  { id: "t2", channel: "email",          campaign: "nurture_1",timestamp: "2026-01-08T00:00:00Z" },
  { id: "t3", channel: "organic_search", campaign: null,       timestamp: "2026-01-15T00:00:00Z" },
  { id: "t4", channel: "email",          campaign: "nurture_2",timestamp: "2026-01-22T00:00:00Z" },
  { id: "t5", channel: "direct",         campaign: null,       timestamp: "2026-01-30T00:00:00Z" },
];

const dealValue = 10000;

// ── firstTouch ──

describe("firstTouch", () => {
  it("gives 100% to the first touchpoint (t1) and 0% to all others", () => {
    const result = firstTouch(touchpoints, dealValue);
    const t1 = result.find((r) => r.touchpointId === "t1")!;
    const others = result.filter((r) => r.touchpointId !== "t1");

    expect(t1.creditPercent).toBe(100);
    expect(t1.creditValue).toBe(dealValue);
    for (const r of others) {
      expect(r.creditPercent).toBe(0);
      expect(r.creditValue).toBe(0);
    }
  });

  it("returns empty array for empty touchpoints", () => {
    expect(firstTouch([], dealValue)).toEqual([]);
  });

  it("returns 100% for a single touchpoint", () => {
    const result = firstTouch([touchpoints[0]], dealValue);
    expect(result).toHaveLength(1);
    expect(result[0].creditPercent).toBe(100);
    expect(result[0].creditValue).toBe(dealValue);
  });
});

// ── lastTouch ──

describe("lastTouch", () => {
  it("gives 100% to the last touchpoint (t5) and 0% to all others", () => {
    const result = lastTouch(touchpoints, dealValue);
    const t5 = result.find((r) => r.touchpointId === "t5")!;
    const others = result.filter((r) => r.touchpointId !== "t5");

    expect(t5.creditPercent).toBe(100);
    expect(t5.creditValue).toBe(dealValue);
    for (const r of others) {
      expect(r.creditPercent).toBe(0);
      expect(r.creditValue).toBe(0);
    }
  });

  it("returns empty array for empty touchpoints", () => {
    expect(lastTouch([], dealValue)).toEqual([]);
  });

  it("returns 100% for a single touchpoint", () => {
    const result = lastTouch([touchpoints[0]], dealValue);
    expect(result).toHaveLength(1);
    expect(result[0].creditPercent).toBe(100);
    expect(result[0].creditValue).toBe(dealValue);
  });
});

// ── linearAttribution ──

describe("linearAttribution", () => {
  it("gives each of 5 touchpoints exactly 20% and 2000 creditValue", () => {
    const result = linearAttribution(touchpoints, dealValue);
    for (const r of result) {
      expect(r.creditPercent).toBeCloseTo(20, 5);
      expect(r.creditValue).toBeCloseTo(2000, 5);
    }
  });

  it("returns empty array for empty touchpoints", () => {
    expect(linearAttribution([], dealValue)).toEqual([]);
  });

  it("returns 100% for a single touchpoint", () => {
    const result = linearAttribution([touchpoints[0]], dealValue);
    expect(result[0].creditPercent).toBe(100);
    expect(result[0].creditValue).toBe(dealValue);
  });

  it("credit values sum to dealValue", () => {
    const result = linearAttribution(touchpoints, dealValue);
    const sum = result.reduce((s, r) => s + r.creditValue, 0);
    expect(sum).toBeCloseTo(dealValue, 5);
  });
});

// ── timeDecay ──

describe("timeDecay", () => {
  it("t5 gets more credit than t1 (most recent = most credit)", () => {
    const result = timeDecay(touchpoints, dealValue);
    const t1 = result.find((r) => r.touchpointId === "t1")!;
    const t5 = result.find((r) => r.touchpointId === "t5")!;
    expect(t5.creditPercent).toBeGreaterThan(t1.creditPercent);
  });

  it("percentages sum to 100%", () => {
    const result = timeDecay(touchpoints, dealValue);
    const sum = result.reduce((s, r) => s + r.creditPercent, 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it("credit values sum to dealValue", () => {
    const result = timeDecay(touchpoints, dealValue);
    const sum = result.reduce((s, r) => s + r.creditValue, 0);
    expect(sum).toBeCloseTo(dealValue, 5);
  });

  it("returns empty array for empty touchpoints", () => {
    expect(timeDecay([], dealValue)).toEqual([]);
  });

  it("returns 100% for a single touchpoint", () => {
    const result = timeDecay([touchpoints[0]], dealValue);
    expect(result[0].creditPercent).toBeCloseTo(100, 5);
    expect(result[0].creditValue).toBeCloseTo(dealValue, 5);
  });

  it("touchpoints are ordered by recency (t5 > t4 > t3 > t2 > t1)", () => {
    const result = timeDecay(touchpoints, dealValue);
    const sorted = [...result].sort((a, b) => b.creditPercent - a.creditPercent);
    const ids = sorted.map((r) => r.touchpointId);
    expect(ids).toEqual(["t5", "t4", "t3", "t2", "t1"]);
  });
});

// ── positionBased ──

describe("positionBased", () => {
  it("t1 gets 40%, t5 gets 40%, middle touchpoints get ~6.67% each", () => {
    const result = positionBased(touchpoints, dealValue);
    const t1 = result.find((r) => r.touchpointId === "t1")!;
    const t5 = result.find((r) => r.touchpointId === "t5")!;
    const middle = result.filter((r) => !["t1", "t5"].includes(r.touchpointId));

    expect(t1.creditPercent).toBeCloseTo(40, 5);
    expect(t5.creditPercent).toBeCloseTo(40, 5);
    for (const m of middle) {
      expect(m.creditPercent).toBeCloseTo(20 / 3, 4);
    }
  });

  it("percentages sum to 100%", () => {
    const result = positionBased(touchpoints, dealValue);
    const sum = result.reduce((s, r) => s + r.creditPercent, 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it("credit values sum to dealValue", () => {
    const result = positionBased(touchpoints, dealValue);
    const sum = result.reduce((s, r) => s + r.creditValue, 0);
    expect(sum).toBeCloseTo(dealValue, 5);
  });

  it("returns empty array for empty touchpoints", () => {
    expect(positionBased([], dealValue)).toEqual([]);
  });

  it("single touchpoint gets 100%", () => {
    const result = positionBased([touchpoints[0]], dealValue);
    expect(result).toHaveLength(1);
    expect(result[0].creditPercent).toBe(100);
    expect(result[0].creditValue).toBe(dealValue);
  });

  it("two touchpoints get 50/50 (not 40/40/20)", () => {
    const two = [touchpoints[0], touchpoints[4]];
    const result = positionBased(two, dealValue);
    expect(result).toHaveLength(2);
    for (const r of result) {
      expect(r.creditPercent).toBeCloseTo(50, 5);
      expect(r.creditValue).toBeCloseTo(dealValue / 2, 5);
    }
  });
});

// ── Cross-model: credit values always sum to dealValue ──

describe("all models: creditValues sum to dealValue", () => {
  const models = [
    { name: "firstTouch",        fn: (tp: typeof touchpoints, dv: number) => firstTouch(tp, dv) },
    { name: "lastTouch",         fn: (tp: typeof touchpoints, dv: number) => lastTouch(tp, dv) },
    { name: "linearAttribution", fn: (tp: typeof touchpoints, dv: number) => linearAttribution(tp, dv) },
    { name: "timeDecay",         fn: (tp: typeof touchpoints, dv: number) => timeDecay(tp, dv) },
    { name: "positionBased",     fn: (tp: typeof touchpoints, dv: number) => positionBased(tp, dv) },
  ];

  for (const { name, fn } of models) {
    it(`${name} — sum of creditValues equals dealValue`, () => {
      const result = fn(touchpoints, dealValue);
      const sum = result.reduce((s, r) => s + r.creditValue, 0);
      expect(sum).toBeCloseTo(dealValue, 5);
    });

    it(`${name} — single touchpoint returns 100%`, () => {
      const result = fn([touchpoints[2]], dealValue);
      expect(result).toHaveLength(1);
      expect(result[0].creditPercent).toBeCloseTo(100, 5);
      expect(result[0].creditValue).toBeCloseTo(dealValue, 5);
    });

    it(`${name} — empty touchpoints returns empty array`, () => {
      const result = fn([], dealValue);
      expect(result).toEqual([]);
    });
  }
});
