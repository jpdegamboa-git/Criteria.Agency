import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "deal-001" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    ne: vi.fn().mockReturnThis(),
  },
  schema: {
    deals: {
      id: "id",
      clientId: "client_id",
      leadId: "lead_id",
      name: "name",
      value: "value",
      currency: "currency",
      stage: "stage",
      probability: "probability",
      expectedCloseDate: "expected_close_date",
      actualCloseDate: "actual_close_date",
      lostReason: "lost_reason",
      notes: "notes",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    leads: {
      id: "id",
      clientId: "client_id",
    },
  },
}));

async function resetDbMocks() {
  const { db } = await import("../../db/index.js");
  vi.mocked(db.select).mockReturnThis();
  vi.mocked(db.from).mockReturnThis();
  vi.mocked(db.where).mockReturnThis();
  vi.mocked(db.limit).mockResolvedValue([]);
  vi.mocked(db.insert).mockReturnThis();
  vi.mocked(db.values).mockReturnThis();
  vi.mocked(db.returning).mockResolvedValue([{ id: "deal-001" }]);
  vi.mocked(db.update).mockReturnThis();
  vi.mocked(db.set).mockReturnThis();
  vi.mocked(db.orderBy).mockResolvedValue([]);
}

// ── Pipeline Manager Tests ──

describe("PipelineManager", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDbMocks();
  });

  // ── createDeal ──

  describe("createDeal", () => {
    it("inserts and returns a deal", async () => {
      const { db } = await import("../../db/index.js");

      const newDeal = {
        id: "deal-001",
        clientId: "client-1",
        leadId: "lead-001",
        name: "Acme Deal",
        value: "5000",
        currency: "USD",
        stage: "qualification",
        probability: 10,
      };

      vi.mocked(db.returning).mockResolvedValueOnce([newDeal]);

      const { createDeal } = await import("./pipeline-manager.js");
      const result = await createDeal("client-1", "lead-001", {
        name: "Acme Deal",
        value: 5000,
      });

      expect(result).toMatchObject({ id: "deal-001", name: "Acme Deal" });
      expect(db.insert).toHaveBeenCalled();
    });
  });

  // ── updateDeal ──

  describe("updateDeal", () => {
    it("changes stage and sets updatedAt", async () => {
      const { db } = await import("../../db/index.js");

      const updatedDeal = {
        id: "deal-001",
        clientId: "client-1",
        stage: "negotiation",
        updatedAt: new Date(),
      };

      vi.mocked(db.returning).mockResolvedValueOnce([updatedDeal]);

      const { updateDeal } = await import("./pipeline-manager.js");
      const result = await updateDeal("client-1", "deal-001", {
        stage: "negotiation",
      });

      expect(result).toMatchObject({ stage: "negotiation" });
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
    });

    it("sets actualCloseDate when stage changes to 'won'", async () => {
      const { db } = await import("../../db/index.js");

      const now = new Date();
      const wonDeal = {
        id: "deal-001",
        clientId: "client-1",
        stage: "won",
        actualCloseDate: now,
        updatedAt: now,
      };

      vi.mocked(db.returning).mockResolvedValueOnce([wonDeal]);

      const { updateDeal } = await import("./pipeline-manager.js");
      const result = await updateDeal("client-1", "deal-001", { stage: "won" });

      expect(result).toMatchObject({ stage: "won" });
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({ actualCloseDate: expect.any(Date) }),
      );
    });
  });

  // ── checkStaleDeal (pure function, no DB) ──

  describe("checkStaleDeal", () => {
    it("returns true for an old deal in 'new' stage (>3 days)", async () => {
      const { checkStaleDeal } = await import("./pipeline-manager.js");

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5); // 5 days ago, threshold is 3

      const result = checkStaleDeal({ stage: "new", updatedAt: oldDate });
      expect(result).toBe(true);
    });

    it("returns false for a recent deal in 'new' stage", async () => {
      const { checkStaleDeal } = await import("./pipeline-manager.js");

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1); // 1 day ago, threshold is 3

      const result = checkStaleDeal({ stage: "new", updatedAt: recentDate });
      expect(result).toBe(false);
    });

    it("returns false for a 'won' deal regardless of age", async () => {
      const { checkStaleDeal } = await import("./pipeline-manager.js");

      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 1); // 1 year ago

      const result = checkStaleDeal({ stage: "won", updatedAt: veryOldDate });
      expect(result).toBe(false);
    });

    it("returns false for a 'lost' deal regardless of age", async () => {
      const { checkStaleDeal } = await import("./pipeline-manager.js");

      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 1);

      const result = checkStaleDeal({ stage: "lost", updatedAt: veryOldDate });
      expect(result).toBe(false);
    });
  });

  // ── getPipelineMetrics ──

  describe("getPipelineMetrics", () => {
    it("returns expected shape with correct counts and rates", async () => {
      const { db } = await import("../../db/index.js");

      const mockDeals = [
        { id: "d1", clientId: "client-1", stage: "qualification", value: "1000" },
        { id: "d2", clientId: "client-1", stage: "won", value: "5000" },
        { id: "d3", clientId: "client-1", stage: "lost", value: "2000" },
        { id: "d4", clientId: "client-1", stage: "negotiation", value: "3000" },
      ];

      // getPipelineMetrics calls db.select().from().where() — resolves via orderBy or where
      vi.mocked(db.where).mockResolvedValueOnce(mockDeals);

      const { getPipelineMetrics } = await import("./pipeline-manager.js");
      const result = await getPipelineMetrics("client-1");

      expect(result).toMatchObject({
        totalDeals: 4,
        wonDeals: 1,
        lostDeals: 1,
        conversionRate: 50, // 1 won / (1 won + 1 lost) * 100
      });
      expect(result).toHaveProperty("totalValue");
      expect(result).toHaveProperty("avgDealValue");
      expect(result).toHaveProperty("dealsByStage");
      expect(result.dealsByStage).toHaveProperty("won", 1);
      expect(result.dealsByStage).toHaveProperty("lost", 1);
    });
  });

  // ── getPipelineKanban ──

  describe("getPipelineKanban", () => {
    it("groups deals by stage", async () => {
      const { db } = await import("../../db/index.js");

      const mockDeals = [
        { id: "d1", clientId: "client-1", stage: "qualification", value: "1000", createdAt: new Date() },
        { id: "d2", clientId: "client-1", stage: "qualification", value: "2000", createdAt: new Date() },
        { id: "d3", clientId: "client-1", stage: "proposal", value: "5000", createdAt: new Date() },
      ];

      vi.mocked(db.orderBy).mockResolvedValueOnce(mockDeals);

      const { getPipelineKanban } = await import("./pipeline-manager.js");
      const result = await getPipelineKanban("client-1");

      expect(result).toHaveProperty("stages");
      expect(result.stages).toHaveProperty("qualification");
      expect(result.stages).toHaveProperty("proposal");
      expect(result.stages["qualification"].count).toBe(2);
      expect(result.stages["qualification"].totalValue).toBe(3000);
      expect(result.stages["proposal"].count).toBe(1);
      expect(result.stages["proposal"].totalValue).toBe(5000);
      expect(result.stages["qualification"].deals).toHaveLength(2);
    });
  });
});
