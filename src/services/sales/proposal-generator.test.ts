import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB ──

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "proposal-001" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
  schema: {
    proposals: {
      id: "id",
      dealId: "deal_id",
      clientId: "client_id",
      version: "version",
      content: "content",
      pricing: "pricing",
      validUntil: "valid_until",
      status: "status",
      createdAt: "created_at",
    },
    deals: {
      id: "id",
      clientId: "client_id",
      leadId: "lead_id",
      name: "name",
      value: "value",
      notes: "notes",
      createdAt: "created_at",
    },
    leads: {
      id: "id",
      clientId: "client_id",
      name: "name",
      email: "email",
      company: "company",
      enrichmentData: "enrichment_data",
    },
  },
}));

// ── Mock generateText ──

const mockProposalJson = JSON.stringify({
  executiveSummary: "Executive summary content",
  currentSituation: "Current situation content",
  proposedSolution: "Proposed solution content",
  timeline: "12 weeks",
  investment: "$10,000",
  whyCriteria: "Why Criteria content",
  nextSteps: "Schedule a call",
  terms: "30-day validity",
});

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(mockProposalJson),
}));

// ── Helpers ──

async function resetDbMocks() {
  const { db } = await import("../../db/index.js");
  vi.mocked(db.select).mockReturnThis();
  vi.mocked(db.from).mockReturnThis();
  vi.mocked(db.where).mockReturnThis();
  vi.mocked(db.limit).mockResolvedValue([]);
  vi.mocked(db.leftJoin).mockReturnThis();
  vi.mocked(db.insert).mockReturnThis();
  vi.mocked(db.values).mockReturnThis();
  vi.mocked(db.returning).mockResolvedValue([{ id: "proposal-001" }]);
  vi.mocked(db.update).mockReturnThis();
  vi.mocked(db.set).mockReturnThis();
  vi.mocked(db.orderBy).mockResolvedValue([]);
}

// ── Tests ──

describe("ProposalGenerator", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDbMocks();
  });

  // ── createProposal ──

  describe("createProposal", () => {
    it("inserts record with version 1 and status draft", async () => {
      const { db } = await import("../../db/index.js");

      const mockDeal = {
        id: "deal-001",
        clientId: "client-1",
        leadId: "lead-001",
        name: "Acme Website Redesign",
        value: "5000",
        notes: null,
      };

      const mockLead = {
        id: "lead-001",
        name: "Alice Smith",
        email: "alice@acme.com",
        company: "Acme Corp",
        enrichmentData: null,
      };

      const mockProposal = {
        id: "proposal-001",
        dealId: "deal-001",
        clientId: "client-1",
        version: 1,
        status: "draft",
        content: mockProposalJson,
        createdAt: new Date(),
      };

      // select deal → returns mockDeal
      vi.mocked(db.limit)
        .mockResolvedValueOnce([mockDeal])   // fetchDeal
        .mockResolvedValueOnce([mockLead]);  // fetchLead

      // insert proposal
      vi.mocked(db.returning).mockResolvedValueOnce([mockProposal]);

      const { createProposal } = await import("./proposal-generator.js");
      const result = await createProposal("client-1", "deal-001");

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({ version: 1, status: "draft" }),
      );
      expect(result).toMatchObject({ id: "proposal-001", version: 1, status: "draft" });
    });

    it("calls generateProposalContent (generateText) during creation", async () => {
      const { db } = await import("../../db/index.js");
      const { generateText } = await import("../../providers/generate-text.js");

      const mockDeal = {
        id: "deal-002",
        clientId: "client-1",
        leadId: "lead-002",
        name: "SEO Campaign",
        value: "3000",
        notes: "Focus on organic growth",
      };

      vi.mocked(db.limit)
        .mockResolvedValueOnce([mockDeal])
        .mockResolvedValueOnce([]);

      vi.mocked(db.returning).mockResolvedValueOnce([{
        id: "proposal-002",
        version: 1,
        status: "draft",
      }]);

      const { createProposal } = await import("./proposal-generator.js");
      await createProposal("client-1", "deal-002", "Client wants quick results");

      expect(generateText).toHaveBeenCalledWith(
        "claude-sonnet-4-5",
        expect.any(String),
        expect.stringContaining("SEO Campaign"),
        expect.any(Number),
      );
    });
  });

  // ── getProposals ──

  describe("getProposals", () => {
    it("returns proposals for client ordered by date", async () => {
      const { db } = await import("../../db/index.js");

      const mockProposals = [
        {
          id: "proposal-003",
          dealId: "deal-001",
          clientId: "client-1",
          version: 1,
          status: "sent",
          dealName: "Acme Website Redesign",
          createdAt: new Date("2026-04-05"),
        },
        {
          id: "proposal-004",
          dealId: "deal-002",
          clientId: "client-1",
          version: 1,
          status: "draft",
          dealName: "SEO Campaign",
          createdAt: new Date("2026-04-01"),
        },
      ];

      vi.mocked(db.orderBy).mockResolvedValueOnce(mockProposals);

      const { getProposals } = await import("./proposal-generator.js");
      const result = await getProposals("client-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "proposal-003", dealName: "Acme Website Redesign" });
      expect(result[1]).toMatchObject({ id: "proposal-004", dealName: "SEO Campaign" });
      expect(db.from).toHaveBeenCalled();
      expect(db.leftJoin).toHaveBeenCalled();
      expect(db.orderBy).toHaveBeenCalled();
    });
  });

  // ── getProposalById ──

  describe("getProposalById", () => {
    it("returns a single proposal with deal info", async () => {
      const { db } = await import("../../db/index.js");

      const mockProposal = {
        id: "proposal-001",
        dealId: "deal-001",
        clientId: "client-1",
        version: 1,
        status: "draft",
        dealName: "Acme Website Redesign",
        content: mockProposalJson,
        createdAt: new Date(),
      };

      vi.mocked(db.limit).mockResolvedValueOnce([mockProposal]);

      const { getProposalById } = await import("./proposal-generator.js");
      const result = await getProposalById("client-1", "proposal-001");

      expect(result).toMatchObject({
        id: "proposal-001",
        clientId: "client-1",
        dealName: "Acme Website Redesign",
      });
      expect(db.leftJoin).toHaveBeenCalled();
    });

    it("returns null when proposal not found", async () => {
      const { db } = await import("../../db/index.js");
      vi.mocked(db.limit).mockResolvedValueOnce([]);

      const { getProposalById } = await import("./proposal-generator.js");
      const result = await getProposalById("client-1", "nonexistent");

      expect(result).toBeNull();
    });
  });

  // ── generateProposalContent ──

  describe("generateProposalContent", () => {
    it("returns all ProposalTemplate fields", async () => {
      const { generateProposalContent } = await import("./proposal-generator.js");

      const deal = { id: "deal-001", name: "Test Deal", value: "5000", notes: null };
      const lead = { name: "Bob Jones", email: "bob@company.com", company: "Company Inc", enrichmentData: null };

      const result = await generateProposalContent(deal, lead);

      expect(result).toHaveProperty("executiveSummary");
      expect(result).toHaveProperty("currentSituation");
      expect(result).toHaveProperty("proposedSolution");
      expect(result).toHaveProperty("timeline");
      expect(result).toHaveProperty("investment");
      expect(result).toHaveProperty("whyCriteria");
      expect(result).toHaveProperty("nextSteps");
      expect(result).toHaveProperty("terms");

      expect(result.executiveSummary).toBe("Executive summary content");
      expect(result.timeline).toBe("12 weeks");
      expect(result.investment).toBe("$10,000");
    });

    it("returns fallback template when JSON parsing fails", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      vi.mocked(generateText).mockResolvedValueOnce("invalid json {{{");

      const { generateProposalContent } = await import("./proposal-generator.js");

      const deal = { id: "deal-001", name: "Fallback Deal", value: null, notes: null };
      const lead = { name: "Jane", email: "jane@test.com", company: "Test Co", enrichmentData: null };

      const result = await generateProposalContent(deal, lead);

      expect(result).toHaveProperty("executiveSummary");
      expect(result).toHaveProperty("currentSituation");
      expect(result).toHaveProperty("proposedSolution");
      expect(result).toHaveProperty("timeline");
      expect(result).toHaveProperty("investment");
      expect(result).toHaveProperty("whyCriteria");
      expect(result).toHaveProperty("nextSteps");
      expect(result).toHaveProperty("terms");
      expect(result.executiveSummary).toContain("Fallback Deal");
    });
  });
});
