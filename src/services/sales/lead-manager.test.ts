import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "lead-001" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
  schema: {
    leads: {
      id: "id",
      clientId: "client_id",
      email: "email",
      status: "status",
      classification: "classification",
      name: "name",
      company: "company",
      createdAt: "created_at",
    },
    leadTouchpoints: {
      id: "id",
      leadId: "lead_id",
      timestamp: "timestamp",
    },
  },
}));

vi.mock("../../providers/sales/stub-enrichment.js", () => {
  const mockInstance = {
    enrichCompany: vi.fn().mockResolvedValue({
      name: "Acme Corp",
      domain: "acme.com",
      industry: "Technology",
      employeeCount: 50,
      annualRevenue: "$1M-$5M",
      techStack: ["React", "Node.js"],
      socialProfiles: {},
      description: "[SYNTHETIC] Acme Corp",
      location: { country: "US", city: "New York" },
    }),
    enrichContact: vi.fn().mockResolvedValue({
      fullName: "John Doe",
      jobTitle: "CTO",
      department: "Engineering",
      linkedinUrl: null,
      phone: null,
      seniority: "c-level",
    }),
    isAvailable: vi.fn().mockReturnValue(true),
  };

  return {
    StubEnrichmentProvider: function StubEnrichmentProvider() {
      return mockInstance;
    },
  };
});

// Helper to reset db mocks to their chainable defaults after clearAllMocks
async function resetDbMocks() {
  const { db } = await import("../../db/index.js");
  vi.mocked(db.select).mockReturnThis();
  vi.mocked(db.from).mockReturnThis();
  vi.mocked(db.where).mockReturnThis();
  vi.mocked(db.limit).mockResolvedValue([]);
  vi.mocked(db.insert).mockReturnThis();
  vi.mocked(db.values).mockReturnThis();
  vi.mocked(db.returning).mockResolvedValue([{ id: "lead-001" }]);
  vi.mocked(db.update).mockReturnThis();
  vi.mocked(db.set).mockReturnThis();
  vi.mocked(db.orderBy).mockResolvedValue([]);
}

// ── Lead Manager Tests ──

describe("LeadManager", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDbMocks();
  });

  // ── createLead ──

  describe("createLead", () => {
    it("inserts and returns a new lead", async () => {
      const { db } = await import("../../db/index.js");
      // No existing lead found
      vi.mocked(db.limit).mockResolvedValueOnce([]);
      // Insert returns new lead
      vi.mocked(db.returning).mockResolvedValueOnce([
        { id: "lead-001", name: "Alice", email: "alice@acme.com", clientId: "client-1" },
      ]);

      const { createLead } = await import("./lead-manager.js");
      const result = await createLead("client-1", {
        name: "Alice",
        email: "alice@acme.com",
      });

      expect(result).toMatchObject({ id: "lead-001", name: "Alice", email: "alice@acme.com" });
      expect(db.insert).toHaveBeenCalled();
    });

    it("returns existing lead when duplicate email exists for same client", async () => {
      const { db } = await import("../../db/index.js");
      const existingLead = { id: "lead-existing", name: "Alice", email: "alice@acme.com", clientId: "client-1" };
      // Existing lead found
      vi.mocked(db.limit).mockResolvedValueOnce([existingLead]);

      const { createLead } = await import("./lead-manager.js");
      const result = await createLead("client-1", {
        name: "Alice",
        email: "alice@acme.com",
      });

      expect(result).toEqual(existingLead);
      // Insert should NOT be called
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  // ── getLeads ──

  describe("getLeads", () => {
    it("returns leads for a client", async () => {
      const { db } = await import("../../db/index.js");
      const leads = [
        { id: "lead-001", name: "Alice", email: "alice@acme.com", clientId: "client-1" },
        { id: "lead-002", name: "Bob", email: "bob@corp.com", clientId: "client-1" },
      ];
      vi.mocked(db.orderBy).mockResolvedValueOnce(leads);

      const { getLeads } = await import("./lead-manager.js");
      const result = await getLeads("client-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "lead-001" });
    });

    it("applies status filter when provided", async () => {
      const { db } = await import("../../db/index.js");
      const leads = [
        { id: "lead-003", name: "Carol", email: "carol@co.com", clientId: "client-1", status: "enriched" },
      ];
      vi.mocked(db.orderBy).mockResolvedValueOnce(leads);

      const { getLeads } = await import("./lead-manager.js");
      const result = await getLeads("client-1", { status: "enriched" });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ status: "enriched" });
    });
  });

  // ── enrichLead ──

  describe("enrichLead", () => {
    it("calls provider and updates enrichmentData", async () => {
      const { db } = await import("../../db/index.js");

      // select lead by id
      vi.mocked(db.limit).mockResolvedValueOnce([
        { id: "lead-001", email: "john@acme.com", clientId: "client-1", status: "new" },
      ]);

      // update().set().where().returning() - need to restore chain
      vi.mocked(db.update).mockReturnThis();
      vi.mocked(db.set).mockReturnThis();
      vi.mocked(db.where).mockReturnThis();
      vi.mocked(db.returning).mockResolvedValueOnce([
        {
          id: "lead-001",
          email: "john@acme.com",
          status: "enriched",
          enrichmentData: {
            company: { name: "Acme Corp", domain: "acme.com" },
            contact: { fullName: "John Doe" },
          },
        },
      ]);

      const { enrichLead } = await import("./lead-manager.js");
      const result = await enrichLead("lead-001");

      expect(result).toMatchObject({ status: "enriched" });
      expect(result.enrichmentData).toHaveProperty("company");
      expect(result.enrichmentData).toHaveProperty("contact");
    });
  });

  // ── addTouchpoint ──

  describe("addTouchpoint", () => {
    it("inserts a touchpoint and returns it", async () => {
      const { db } = await import("../../db/index.js");

      const touchpoint = {
        id: "tp-001",
        leadId: "lead-001",
        channel: "email",
        medium: "outbound",
        interaction: "sent",
        timestamp: new Date("2026-04-07T10:00:00Z"),
      };

      vi.mocked(db.insert).mockReturnThis();
      vi.mocked(db.values).mockReturnThis();
      vi.mocked(db.returning).mockResolvedValueOnce([touchpoint]);

      const { addTouchpoint } = await import("./lead-manager.js");
      const result = await addTouchpoint("lead-001", {
        channel: "email",
        campaign: "spring-promo",
        content: "intro",
        medium: "outbound",
        interaction: "sent",
        timestamp: "2026-04-07T10:00:00Z",
      });

      expect(result).toMatchObject({ id: "tp-001", leadId: "lead-001", channel: "email" });
      expect(db.insert).toHaveBeenCalled();
    });
  });

  // ── bulkImportLeads ──

  describe("bulkImportLeads", () => {
    it("processes multiple rows, tracking created and duplicates", async () => {
      const { db } = await import("../../db/index.js");

      // bulkImportLeads checks existing for each row before calling createLead
      // Alice: no existing in bulk check, no existing in createLead's internal check → new
      // Bob: existing found in bulk check → duplicate
      vi.mocked(db.limit)
        .mockResolvedValueOnce([]) // bulk dedup check alice → not found
        .mockResolvedValueOnce([]) // createLead internal dedup check alice → not found
        .mockResolvedValueOnce([{ id: "lead-bob" }]); // bulk dedup check bob → found

      vi.mocked(db.returning).mockResolvedValueOnce([
        { id: "lead-alice", name: "Alice", email: "alice@new.com", clientId: "client-1" },
      ]);

      const { bulkImportLeads } = await import("./lead-manager.js");
      const result = await bulkImportLeads("client-1", [
        { name: "Alice", email: "alice@new.com" },
        { name: "Bob", email: "bob@existing.com" },
      ]);

      expect(result.created).toBe(1);
      expect(result.duplicates).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });
});
