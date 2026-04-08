import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "fu-001" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
  schema: {
    followUps: {
      id: "id",
      leadId: "lead_id",
      dealId: "deal_id",
      type: "type",
      channel: "channel",
      content: "content",
      status: "status",
      scheduledFor: "scheduled_for",
      sentAt: "sent_at",
      openedAt: "opened_at",
      repliedAt: "replied_at",
      createdAt: "created_at",
    },
    leads: {
      id: "id",
      clientId: "client_id",
    },
  },
}));

// Helper to reset db mocks to their chainable defaults after clearAllMocks
async function resetDbMocks() {
  const { db } = await import("../../db/index.js");
  vi.mocked(db.select).mockReturnThis();
  vi.mocked(db.from).mockReturnThis();
  vi.mocked(db.where).mockReturnThis();
  vi.mocked(db.limit).mockResolvedValue([]);
  vi.mocked(db.insert).mockReturnThis();
  vi.mocked(db.values).mockReturnThis();
  vi.mocked(db.returning).mockResolvedValue([{ id: "fu-001" }]);
  vi.mocked(db.update).mockReturnThis();
  vi.mocked(db.set).mockReturnThis();
  vi.mocked(db.orderBy).mockResolvedValue([]);
}

// ── Follow-up Engine Tests ──

describe("FollowUpEngine", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDbMocks();
  });

  // ── scheduleFollowUp ──

  describe("scheduleFollowUp", () => {
    it("creates record with correct fields", async () => {
      const { db } = await import("../../db/index.js");

      const now = new Date("2026-04-08T10:00:00Z");
      const record = {
        id: "fu-001",
        leadId: "lead-001",
        dealId: null,
        type: "follow_up_1",
        channel: "email",
        content: "Hello there",
        status: "scheduled",
        scheduledFor: now,
        createdAt: new Date(),
      };

      vi.mocked(db.returning).mockResolvedValueOnce([record]);

      const { scheduleFollowUp } = await import("./follow-up-engine.js");
      const result = await scheduleFollowUp({
        leadId: "lead-001",
        type: "follow_up_1",
        channel: "email",
        content: "Hello there",
        scheduledFor: now,
      });

      expect(result).toMatchObject({
        id: "fu-001",
        leadId: "lead-001",
        type: "follow_up_1",
        channel: "email",
        content: "Hello there",
        status: "scheduled",
      });
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
    });
  });

  // ── getUpcomingFollowUps ──

  describe("getUpcomingFollowUps", () => {
    it("returns only future scheduled items", async () => {
      const { db } = await import("../../db/index.js");

      const upcoming = [
        {
          id: "fu-002",
          leadId: "lead-001",
          status: "scheduled",
          scheduledFor: new Date("2026-04-09T10:00:00Z"),
        },
      ];
      vi.mocked(db.orderBy).mockResolvedValueOnce(upcoming);

      const { getUpcomingFollowUps } = await import("./follow-up-engine.js");
      const result = await getUpcomingFollowUps("client-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "fu-002", status: "scheduled" });
      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
  });

  // ── getDueFollowUps ──

  describe("getDueFollowUps", () => {
    it("returns items past scheduledFor with status scheduled", async () => {
      const { db } = await import("../../db/index.js");

      const due = [
        {
          id: "fu-003",
          leadId: "lead-001",
          status: "scheduled",
          scheduledFor: new Date("2026-04-06T10:00:00Z"),
        },
      ];
      vi.mocked(db.orderBy).mockResolvedValueOnce(due);

      const { getDueFollowUps } = await import("./follow-up-engine.js");
      const result = await getDueFollowUps();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "fu-003", status: "scheduled" });
      expect(db.select).toHaveBeenCalled();
    });
  });

  // ── markFollowUpStatus ──

  describe("markFollowUpStatus", () => {
    it("sets sentAt when status is 'sent'", async () => {
      const { db } = await import("../../db/index.js");

      const sentAt = new Date("2026-04-07T12:00:00Z");
      const record = { id: "fu-001", status: "sent", sentAt };

      vi.mocked(db.returning).mockResolvedValueOnce([record]);

      const { markFollowUpStatus } = await import("./follow-up-engine.js");
      const result = await markFollowUpStatus("fu-001", "sent", sentAt);

      expect(result).toMatchObject({ id: "fu-001", status: "sent", sentAt });
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "sent", sentAt }),
      );
    });

    it("sets openedAt when status is 'opened'", async () => {
      const { db } = await import("../../db/index.js");

      const openedAt = new Date("2026-04-07T13:00:00Z");
      const record = { id: "fu-001", status: "opened", openedAt };

      vi.mocked(db.returning).mockResolvedValueOnce([record]);

      const { markFollowUpStatus } = await import("./follow-up-engine.js");
      const result = await markFollowUpStatus("fu-001", "opened", openedAt);

      expect(result).toMatchObject({ id: "fu-001", status: "opened", openedAt });
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "opened", openedAt }),
      );
    });

    it("sets repliedAt when status is 'replied'", async () => {
      const { db } = await import("../../db/index.js");

      const repliedAt = new Date("2026-04-07T14:00:00Z");
      const record = { id: "fu-001", status: "replied", repliedAt };

      vi.mocked(db.returning).mockResolvedValueOnce([record]);

      const { markFollowUpStatus } = await import("./follow-up-engine.js");
      const result = await markFollowUpStatus("fu-001", "replied", repliedAt);

      expect(result).toMatchObject({ id: "fu-001", status: "replied", repliedAt });
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "replied", repliedAt }),
      );
    });
  });

  // ── cancelFollowUpsForLead ──

  describe("cancelFollowUpsForLead", () => {
    it("updates all scheduled follow-ups for a lead to cancelled", async () => {
      const { db } = await import("../../db/index.js");

      const cancelled = [
        { id: "fu-001", leadId: "lead-001", status: "cancelled" },
        { id: "fu-002", leadId: "lead-001", status: "cancelled" },
      ];
      vi.mocked(db.returning).mockResolvedValueOnce(cancelled);

      const { cancelFollowUpsForLead } = await import("./follow-up-engine.js");
      const result = await cancelFollowUpsForLead("lead-001");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ status: "cancelled" });
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({ status: "cancelled" });
    });
  });
});
