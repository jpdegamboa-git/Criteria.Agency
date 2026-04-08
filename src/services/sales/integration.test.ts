import { describe, it, expect } from "vitest";

// ── Pure function imports — no mocks needed ──
import {
  firstTouch,
  lastTouch,
  linearAttribution,
  timeDecay,
  positionBased,
} from "./attribution-engine.js";
import { checkStaleDeal } from "./pipeline-manager.js";
import { getDefaultRules } from "./lead-scorer.js";
import {
  classifyTier,
  SCORE_CAPS,
  TIER_THRESHOLDS,
  STALE_THRESHOLDS,
} from "./types.js";

// ── Shared touchpoint fixtures ──

const DEAL_VALUE = 10000;

const touchpoints = [
  { id: "t1", channel: "google_ads",     campaign: "brand",    timestamp: "2026-01-01T00:00:00Z" },
  { id: "t2", channel: "email",          campaign: "nurture_1", timestamp: "2026-01-08T00:00:00Z" },
  { id: "t3", channel: "organic_search", campaign: null,        timestamp: "2026-01-15T00:00:00Z" },
  { id: "t4", channel: "email",          campaign: "nurture_2", timestamp: "2026-01-22T00:00:00Z" },
  { id: "t5", channel: "direct",         campaign: null,        timestamp: "2026-01-30T00:00:00Z" },
];

// ── Helpers ──

function totalCredit(entries: { creditValue: number }[]): number {
  return entries.reduce((s, e) => s + e.creditValue, 0);
}

// ─────────────────────────────────────────────────────────────────
// Test Suite 1: Attribution model spectrum
// ─────────────────────────────────────────────────────────────────

describe("Integration: Attribution model spectrum", () => {
  describe("firstTouch", () => {
    it("gives 100% to t1 (google_ads)", () => {
      const result = firstTouch(touchpoints, DEAL_VALUE);
      const t1 = result.find((e) => e.touchpointId === "t1");
      const others = result.filter((e) => e.touchpointId !== "t1");

      expect(t1?.creditPercent).toBe(100);
      expect(t1?.creditValue).toBe(DEAL_VALUE);
      others.forEach((e) => {
        expect(e.creditPercent).toBe(0);
        expect(e.creditValue).toBe(0);
      });
    });

    it("creditValues sum to dealValue", () => {
      expect(totalCredit(firstTouch(touchpoints, DEAL_VALUE))).toBeCloseTo(DEAL_VALUE);
    });
  });

  describe("lastTouch", () => {
    it("gives 100% to t5 (direct)", () => {
      const result = lastTouch(touchpoints, DEAL_VALUE);
      const t5 = result.find((e) => e.touchpointId === "t5");
      const others = result.filter((e) => e.touchpointId !== "t5");

      expect(t5?.creditPercent).toBe(100);
      expect(t5?.creditValue).toBe(DEAL_VALUE);
      others.forEach((e) => {
        expect(e.creditPercent).toBe(0);
        expect(e.creditValue).toBe(0);
      });
    });

    it("creditValues sum to dealValue", () => {
      expect(totalCredit(lastTouch(touchpoints, DEAL_VALUE))).toBeCloseTo(DEAL_VALUE);
    });
  });

  describe("linearAttribution", () => {
    it("gives each touchpoint 20%", () => {
      const result = linearAttribution(touchpoints, DEAL_VALUE);
      result.forEach((e) => {
        expect(e.creditPercent).toBeCloseTo(20);
        expect(e.creditValue).toBeCloseTo(DEAL_VALUE / 5);
      });
    });

    it("creditValues sum to dealValue", () => {
      expect(totalCredit(linearAttribution(touchpoints, DEAL_VALUE))).toBeCloseTo(DEAL_VALUE);
    });
  });

  describe("timeDecay", () => {
    it("ordering: t5 > t4 > t3 > t2 > t1", () => {
      const result = timeDecay(touchpoints, DEAL_VALUE);
      const sorted = [...result].sort((a, b) => b.creditValue - a.creditValue);
      const ids = sorted.map((e) => e.touchpointId);
      expect(ids).toEqual(["t5", "t4", "t3", "t2", "t1"]);
    });

    it("creditValues sum to dealValue", () => {
      expect(totalCredit(timeDecay(touchpoints, DEAL_VALUE))).toBeCloseTo(DEAL_VALUE);
    });
  });

  describe("positionBased", () => {
    it("t1=40%, t5=40%, t2/t3/t4 each get ~6.67% (split 20%)", () => {
      const result = positionBased(touchpoints, DEAL_VALUE);
      const byId = Object.fromEntries(result.map((e) => [e.touchpointId, e]));

      expect(byId["t1"].creditPercent).toBeCloseTo(40);
      expect(byId["t5"].creditPercent).toBeCloseTo(40);
      expect(byId["t1"].creditValue).toBeCloseTo(DEAL_VALUE * 0.4);
      expect(byId["t5"].creditValue).toBeCloseTo(DEAL_VALUE * 0.4);

      // middle 3 each get 20/3 ≈ 6.667%
      ["t2", "t3", "t4"].forEach((id) => {
        expect(byId[id].creditPercent).toBeCloseTo(20 / 3);
        expect(byId[id].creditValue).toBeCloseTo((DEAL_VALUE * 0.2) / 3);
      });
    });

    it("creditValues sum to dealValue", () => {
      expect(totalCredit(positionBased(touchpoints, DEAL_VALUE))).toBeCloseTo(DEAL_VALUE);
    });
  });

  describe("all models — edge cases", () => {
    it("single touchpoint: all models give 100% credit", () => {
      const single = [touchpoints[0]];
      [
        firstTouch(single, DEAL_VALUE),
        lastTouch(single, DEAL_VALUE),
        linearAttribution(single, DEAL_VALUE),
        timeDecay(single, DEAL_VALUE),
        positionBased(single, DEAL_VALUE),
      ].forEach((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].creditPercent).toBeCloseTo(100);
        expect(result[0].creditValue).toBeCloseTo(DEAL_VALUE);
      });
    });

    it("two touchpoints: positionBased gives 50/50", () => {
      const two = [touchpoints[0], touchpoints[4]]; // t1, t5
      const result = positionBased(two, DEAL_VALUE);
      expect(result).toHaveLength(2);
      result.forEach((e) => {
        expect(e.creditPercent).toBeCloseTo(50);
        expect(e.creditValue).toBeCloseTo(DEAL_VALUE * 0.5);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 2: Scoring tier boundaries
// ─────────────────────────────────────────────────────────────────

describe("Integration: Scoring tier boundaries", () => {
  it("classifyTier(100) = 'hot'", () => expect(classifyTier(100)).toBe("hot"));
  it("classifyTier(75) = 'hot' (at hot threshold)", () => expect(classifyTier(75)).toBe("hot"));
  it("classifyTier(74) = 'warm' (just below hot threshold)", () => expect(classifyTier(74)).toBe("warm"));
  it("classifyTier(50) = 'warm' (at warm threshold)", () => expect(classifyTier(50)).toBe("warm"));
  it("classifyTier(49) = 'cold' (just below warm threshold)", () => expect(classifyTier(49)).toBe("cold"));
  it("classifyTier(25) = 'cold' (at cold threshold)", () => expect(classifyTier(25)).toBe("cold"));
  it("classifyTier(24) = 'unqualified' (just below cold threshold)", () => expect(classifyTier(24)).toBe("unqualified"));
  it("classifyTier(0) = 'unqualified'", () => expect(classifyTier(0)).toBe("unqualified"));
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 3: SCORE_CAPS sum to 100
// ─────────────────────────────────────────────────────────────────

describe("Integration: SCORE_CAPS correctness", () => {
  it("individual caps: fit=40, intent=30, authority=15, timing=15", () => {
    expect(SCORE_CAPS.fit).toBe(40);
    expect(SCORE_CAPS.intent).toBe(30);
    expect(SCORE_CAPS.authority).toBe(15);
    expect(SCORE_CAPS.timing).toBe(15);
  });

  it("all caps sum to 100", () => {
    const total = SCORE_CAPS.fit + SCORE_CAPS.intent + SCORE_CAPS.authority + SCORE_CAPS.timing;
    expect(total).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 4: STALE_THRESHOLDS correctness
// ─────────────────────────────────────────────────────────────────

describe("Integration: STALE_THRESHOLDS correctness", () => {
  it("new: 3 days", () => expect(STALE_THRESHOLDS["new"]).toBe(3));
  it("contacted: 5 days", () => expect(STALE_THRESHOLDS["contacted"]).toBe(5));
  it("qualified: 7 days", () => expect(STALE_THRESHOLDS["qualified"]).toBe(7));
  it("discovery: 10 days", () => expect(STALE_THRESHOLDS["discovery"]).toBe(10));
  it("proposal: 14 days", () => expect(STALE_THRESHOLDS["proposal"]).toBe(14));
  it("negotiation: 14 days", () => expect(STALE_THRESHOLDS["negotiation"]).toBe(14));
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 5: checkStaleDeal pure function tests
// ─────────────────────────────────────────────────────────────────

describe("Integration: checkStaleDeal pure function", () => {
  function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  }

  it("'new' stage, 4 days ago → stale (threshold=3)", () => {
    expect(checkStaleDeal({ stage: "new", updatedAt: daysAgo(4) })).toBe(true);
  });

  it("'new' stage, 2 days ago → not stale", () => {
    expect(checkStaleDeal({ stage: "new", updatedAt: daysAgo(2) })).toBe(false);
  });

  it("'won' stage, 30 days ago → not stale (won never stale)", () => {
    expect(checkStaleDeal({ stage: "won", updatedAt: daysAgo(30) })).toBe(false);
  });

  it("'lost' stage, 30 days ago → not stale (lost never stale)", () => {
    expect(checkStaleDeal({ stage: "lost", updatedAt: daysAgo(30) })).toBe(false);
  });

  it("'negotiation' stage, 15 days ago → stale (threshold=14)", () => {
    expect(checkStaleDeal({ stage: "negotiation", updatedAt: daysAgo(15) })).toBe(true);
  });

  it("'negotiation' stage, 13 days ago → not stale", () => {
    expect(checkStaleDeal({ stage: "negotiation", updatedAt: daysAgo(13) })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 6: Default scoring rules completeness
// ─────────────────────────────────────────────────────────────────

describe("Integration: Default scoring rules completeness", () => {
  const rules = getDefaultRules();

  it("returns rules for all 4 components", () => {
    const components = new Set(rules.map((r) => r.component));
    expect(components.has("fit")).toBe(true);
    expect(components.has("intent")).toBe(true);
    expect(components.has("authority")).toBe(true);
    expect(components.has("timing")).toBe(true);
  });

  it("each component has at least 2 rules", () => {
    const counts = rules.reduce<Record<string, number>>((acc, r) => {
      acc[r.component] = (acc[r.component] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts["fit"]).toBeGreaterThanOrEqual(2);
    expect(counts["intent"]).toBeGreaterThanOrEqual(2);
    expect(counts["authority"]).toBeGreaterThanOrEqual(2);
    expect(counts["timing"]).toBeGreaterThanOrEqual(2);
  });

  it("all points are positive", () => {
    rules.forEach((r) => {
      expect(r.points).toBeGreaterThan(0);
    });
  });

  it("total possible score if all rules match exceeds 100 (due to capping)", () => {
    const sum = rules.reduce((s, r) => s + r.points, 0);
    expect(sum).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 7: TIER_THRESHOLDS values
// ─────────────────────────────────────────────────────────────────

describe("Integration: TIER_THRESHOLDS values", () => {
  it("hot threshold is 75", () => expect(TIER_THRESHOLDS.hot).toBe(75));
  it("warm threshold is 50", () => expect(TIER_THRESHOLDS.warm).toBe(50));
  it("cold threshold is 25", () => expect(TIER_THRESHOLDS.cold).toBe(25));
});
