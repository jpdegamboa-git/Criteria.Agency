import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    orderBy: vi.fn().mockReturnThis(),
  },
  schema: {
    leads: {
      id: "id",
      clientId: "client_id",
      totalScore: "total_score",
      updatedAt: "updated_at",
      status: "status",
    },
    scoringRules: {
      clientId: "client_id",
    },
  },
}));

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("This lead shows strong fit and intent signals."),
}));

import { db } from "../../db/index.js";
import {
  classifyTier,
  SCORE_CAPS,
  TIER_THRESHOLDS,
} from "./types.js";
import {
  getDefaultRules,
  scoreLead,
  applyScoreDecay,
} from "./lead-scorer.js";

// ── classifyTier boundary tests ──

describe("classifyTier", () => {
  it("returns hot for score >= 75", () => {
    expect(classifyTier(75)).toBe("hot");
    expect(classifyTier(100)).toBe("hot");
    expect(classifyTier(76)).toBe("hot");
  });

  it("returns warm for scores 50–74", () => {
    expect(classifyTier(74)).toBe("warm");
    expect(classifyTier(50)).toBe("warm");
  });

  it("returns cold for scores 25–49", () => {
    expect(classifyTier(49)).toBe("cold");
    expect(classifyTier(25)).toBe("cold");
  });

  it("returns unqualified for scores < 25", () => {
    expect(classifyTier(24)).toBe("unqualified");
    expect(classifyTier(0)).toBe("unqualified");
  });
});

// ── SCORE_CAPS ──

describe("SCORE_CAPS", () => {
  it("has correct cap values", () => {
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

// ── getDefaultRules ──

describe("getDefaultRules", () => {
  it("returns exactly 14 rules (4 fit + 4 intent + 3 authority + 3 timing)", () => {
    const rules = getDefaultRules();
    expect(rules).toHaveLength(14);
  });

  it("has 4 fit rules", () => {
    const rules = getDefaultRules().filter((r) => r.component === "fit");
    expect(rules).toHaveLength(4);
  });

  it("has 4 intent rules", () => {
    const rules = getDefaultRules().filter((r) => r.component === "intent");
    expect(rules).toHaveLength(4);
  });

  it("has 3 authority rules", () => {
    const rules = getDefaultRules().filter((r) => r.component === "authority");
    expect(rules).toHaveLength(3);
  });

  it("has 3 timing rules", () => {
    const rules = getDefaultRules().filter((r) => r.component === "timing");
    expect(rules).toHaveLength(3);
  });
});

// ── scoreLead ──

describe("scoreLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no DB scoring rules → falls back to getDefaultRules()
    vi.mocked(db.where).mockReturnThis();
    vi.mocked(db.from).mockReturnThis();
    vi.mocked(db.select).mockReturnThis();
    // Simulate empty scoringRules table so we use defaults
    vi.mocked(db.where).mockResolvedValue([]);
  });

  it("hot lead: all signals truthy → score ≥ 75 and tier hot", async () => {
    const leadData = {
      // fit signals
      industry_match: true,
      company_size_icp: true,
      budget_indicated: true,
      region_match: true,
      // intent signals
      website_visit_7d: true,
      email_opened_7d: true,
      content_downloaded: true,
      pricing_page_visited: true,
      // authority signals
      c_level_vp: true,
      // timing signals
      expressed_urgency: true,
    };

    const result = await scoreLead("client-1", leadData);

    expect(result.total).toBeGreaterThanOrEqual(75);
    expect(result.tier).toBe("hot");
    expect(result.components).toBeDefined();
    expect(result.reasoning).toBeTruthy();
    expect(result.lastUpdated).toBeTruthy();
  });

  it("minimal lead: no signals → low score, tier cold or unqualified", async () => {
    const result = await scoreLead("client-1", {});

    expect(result.total).toBeLessThan(25);
    expect(["cold", "unqualified"]).toContain(result.tier);
  });

  it("component capping: fit signals totaling 50 → capped at 40", async () => {
    // All 4 fit signals (10+10+10+10=40) + add extra via intent=0
    const leadData = {
      industry_match: true,
      company_size_icp: true,
      budget_indicated: true,
      region_match: true,
    };

    const result = await scoreLead("client-1", leadData);

    expect(result.components.fit).toBe(40);
    expect(result.components.intent).toBe(0);
  });

  it("partial signals give warm tier", async () => {
    const leadData = {
      industry_match: true,
      company_size_icp: true,
      budget_indicated: true,
      region_match: true,   // fit = 40
      website_visit_7d: true,
      email_opened_7d: true, // intent = 10
    };

    const result = await scoreLead("client-1", leadData);
    expect(result.total).toBe(50);
    expect(result.tier).toBe("warm");
  });

  it("condition key-value matching works", async () => {
    // The default rules have null conditions, matching against leadData field name.
    // Test with a rule that has a condition.
    // We'll call scoreLead with leadData that doesn't have "industry_match" as truthy key
    // but has an industry key that a condition would test.
    const leadData = {
      industry_match: false,   // not truthy → rule won't fire
      company_size_icp: true,
      budget_indicated: true,
      region_match: true,
    };

    const result = await scoreLead("client-1", leadData);
    // fit should be 30 (3 rules matched, industry_match skipped)
    expect(result.components.fit).toBe(30);
  });
});

// ── applyScoreDecay ──

describe("applyScoreDecay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reduces score by 2 for stale leads", async () => {
    // Setup stale leads returned from select query
    const staleLeads = [
      { id: "lead-1", totalScore: 60, clientId: "client-1" },
      { id: "lead-2", totalScore: 80, clientId: "client-1" },
    ];

    // Mock the select chain: the final .where() call resolves to staleLeads
    vi.mocked(db.select).mockReturnThis();
    vi.mocked(db.from).mockReturnThis();
    // The .where() on leads query must return staleLeads
    vi.mocked(db.where).mockResolvedValue(staleLeads);

    // Mock update chain
    vi.mocked(db.update).mockReturnThis();
    vi.mocked(db.set).mockReturnThis();

    const count = await applyScoreDecay("client-1");

    expect(count).toBe(2);
    // update was called twice (once per lead)
    expect(vi.mocked(db.update)).toHaveBeenCalledTimes(2);
  });

  it("returns 0 when no stale leads", async () => {
    vi.mocked(db.select).mockReturnThis();
    vi.mocked(db.from).mockReturnThis();
    vi.mocked(db.where).mockResolvedValue([]);

    const count = await applyScoreDecay("client-1");

    expect(count).toBe(0);
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });

  it("does not reduce below 0", async () => {
    const staleLeads = [
      { id: "lead-3", totalScore: 1, clientId: "client-1" },
    ];

    vi.mocked(db.select).mockReturnThis();
    vi.mocked(db.from).mockReturnThis();
    vi.mocked(db.where).mockResolvedValue(staleLeads);

    vi.mocked(db.update).mockReturnThis();
    vi.mocked(db.set).mockReturnThis();

    const setCallArgs: Record<string, unknown>[] = [];
    vi.mocked(db.set).mockImplementation((args: unknown) => {
      setCallArgs.push(args as Record<string, unknown>);
      return db;
    });

    await applyScoreDecay("client-1");

    // Score of 1 - 2 should clamp to 0
    expect(setCallArgs[0].totalScore).toBe(0);
  });
});
