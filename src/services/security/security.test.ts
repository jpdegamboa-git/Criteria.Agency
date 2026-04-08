import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [{ count: 0 }] }),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  },
  schema: {
    autonomyConfigs: { clientId: "client_id" },
    approvalRequests: {},
    auditLog: { clientId: "client_id", action: "action", actorType: "actor_type", resourceType: "resource_type", timestamp: "timestamp" },
    projects: { id: "id", clientId: "client_id" },
    gateReviews: { projectId: "project_id" },
  },
}));

// ── Autonomy Manager Tests ──

describe("AutonomyManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveAutonomyLevel", () => {
    it("returns level 3 as default when no config exists", async () => {
      const { resolveAutonomyLevel } = await import("./autonomy-manager.js");
      const result = await resolveAutonomyLevel("client-123");

      expect(result.effectiveLevel).toBe(3);
      expect(result.source).toBe("global");
    });

    it("returns level from config when config exists", async () => {
      const { db } = await import("../../db/index.js");
      vi.mocked(db.limit).mockResolvedValueOnce([
        {
          clientId: "client-123",
          globalLevel: 2,
          overrides: [],
          escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
        },
      ]);

      const { resolveAutonomyLevel } = await import("./autonomy-manager.js");
      const result = await resolveAutonomyLevel("client-123");

      expect(result.effectiveLevel).toBe(2);
      expect(result.source).toBe("global");
    });

    it("uses action_override when matching override exists", async () => {
      const { db } = await import("../../db/index.js");
      vi.mocked(db.limit).mockResolvedValueOnce([
        {
          clientId: "client-123",
          globalLevel: 3,
          overrides: [
            {
              scope: { motor: "writer", actionType: "publish" },
              level: 1,
              reason: "Publish always needs approval",
            },
          ],
          escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
        },
      ]);

      const { resolveAutonomyLevel } = await import("./autonomy-manager.js");
      const result = await resolveAutonomyLevel("client-123", "writer", "publish");

      expect(result.effectiveLevel).toBe(1);
      expect(result.source).toBe("action_override");
    });
  });

  describe("checkAction", () => {
    it("blocks publish action at level 3", async () => {
      // No config → default level 3
      const { checkAction } = await import("./autonomy-manager.js");
      const result = await checkAction("client-123", {
        motor: "writer",
        actionType: "publish",
      });

      expect(result.allowed).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.level).toBe(3);
    });

    it("allows non-sensitive action at level 4", async () => {
      const { db } = await import("../../db/index.js");
      vi.mocked(db.limit).mockResolvedValueOnce([
        {
          clientId: "client-123",
          globalLevel: 4,
          overrides: [],
          escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
        },
      ]);

      const { checkAction } = await import("./autonomy-manager.js");
      const result = await checkAction("client-123", {
        motor: "writer",
        actionType: "draft",
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it("blocks everything at level 1", async () => {
      const { db } = await import("../../db/index.js");
      vi.mocked(db.limit).mockResolvedValueOnce([
        {
          clientId: "client-123",
          globalLevel: 1,
          overrides: [],
          escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
        },
      ]);

      const { checkAction } = await import("./autonomy-manager.js");
      const result = await checkAction("client-123", {
        motor: "writer",
        actionType: "anything",
      });

      expect(result.allowed).toBe(false);
      expect(result.requiresApproval).toBe(true);
    });
  });

  describe("createApprovalRequest", () => {
    it("inserts an approval request and returns id", async () => {
      const { createApprovalRequest } = await import("./autonomy-manager.js");
      const result = await createApprovalRequest("client-123", {
        motor: "writer",
        actionType: "publish",
        description: "Needs approval to publish",
      });

      expect(result.id).toBe("test-id");
    });
  });
});

// ── Data Protector Tests ──

describe("DataProtector", () => {
  describe("scanForPII", () => {
    it("detects credit card numbers as blocked", async () => {
      const { scanForPII } = await import("./data-protector.js");
      const result = scanForPII("Pay with 4111 1111 1111 1111 today");

      const ccDetection = result.detections.find((d) => d.type === "credit_card");
      expect(ccDetection).toBeDefined();
      expect(ccDetection?.action).toBe("blocked");
      expect(result.blocked).toBe(true);
    });

    it("detects emails as anonymized", async () => {
      const { scanForPII } = await import("./data-protector.js");
      const result = scanForPII("Contact john.doe@example.com for info");

      const emailDetection = result.detections.find((d) => d.type === "email");
      expect(emailDetection).toBeDefined();
      expect(emailDetection?.action).toBe("anonymized");
    });

    it("detects phone numbers", async () => {
      const { scanForPII } = await import("./data-protector.js");
      const result = scanForPII("Call us at 555-123-4567");

      const phoneDetection = result.detections.find((d) => d.type === "phone");
      expect(phoneDetection).toBeDefined();
    });

    it("returns clean result for safe text", async () => {
      const { scanForPII } = await import("./data-protector.js");
      const result = scanForPII("The sky is blue and the grass is green.");

      expect(result.detections).toHaveLength(0);
      expect(result.blocked).toBe(false);
      expect(result.sanitizedText).toBe("The sky is blue and the grass is green.");
    });

    it("detects SSN as blocked", async () => {
      const { scanForPII } = await import("./data-protector.js");
      const result = scanForPII("SSN: 123-45-6789");

      const ssnDetection = result.detections.find((d) => d.type === "ssn");
      expect(ssnDetection).toBeDefined();
      expect(ssnDetection?.action).toBe("blocked");
      expect(result.blocked).toBe(true);
    });
  });

  describe("anonymizeText", () => {
    it("replaces emails with [EMAIL_REDACTED]", async () => {
      const { anonymizeText } = await import("./data-protector.js");
      const result = anonymizeText("Send to alice@example.com please");

      expect(result).toContain("[EMAIL_REDACTED]");
      expect(result).not.toContain("alice@example.com");
    });

    it("replaces credit card with [BLOCKED_PII]", async () => {
      const { anonymizeText } = await import("./data-protector.js");
      const result = anonymizeText("Charge 4111111111111111 immediately");

      expect(result).toContain("[BLOCKED_PII]");
      expect(result).not.toContain("4111111111111111");
    });

    it("replaces SSN with [BLOCKED_PII]", async () => {
      const { anonymizeText } = await import("./data-protector.js");
      const result = anonymizeText("SSN is 123-45-6789");

      expect(result).toContain("[BLOCKED_PII]");
    });
  });

  describe("runIsolationAudit", () => {
    it("returns compliant status for a client", async () => {
      const { runIsolationAudit } = await import("./data-protector.js");
      const result = await runIsolationAudit("client-123");

      expect(result.clientId).toBe("client-123");
      expect(result.overallStatus).toBe("compliant");
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.checks.every((c) => c.status === "pass")).toBe(true);
    });
  });
});

// ── Gate Manager Tests ──

describe("GateManager", () => {
  describe("evaluateGate", () => {
    it("auto-passes when score >= autoPass threshold", async () => {
      const { evaluateGate } = await import("./gate-manager.js");
      const result = evaluateGate(98);
      expect(result.verdict).toBe("pass");
    });

    it("auto-fails when score <= autoFail threshold", async () => {
      const { evaluateGate } = await import("./gate-manager.js");
      const result = evaluateGate(35);
      expect(result.verdict).toBe("fail");
    });

    it("sends to human review when score is borderline", async () => {
      const { evaluateGate } = await import("./gate-manager.js");
      const result = evaluateGate(70);
      expect(result.verdict).toBe("needs_human_review");
    });

    it("uses custom thresholds when provided", async () => {
      const { evaluateGate } = await import("./gate-manager.js");
      const result = evaluateGate(80, { autoPass: 75, autoFail: 50 });
      expect(result.verdict).toBe("pass");
    });
  });

  describe("resolveGateType", () => {
    it("returns hybrid by default when no config exists", async () => {
      const { resolveGateType } = await import("./gate-manager.js");
      const type = await resolveGateType("client-1", "video-production", "G1");
      expect(type).toBe("hybrid");
    });
  });

  describe("getMotorGateConfig", () => {
    it("returns default config with one hybrid gate", async () => {
      const { getMotorGateConfig } = await import("./gate-manager.js");
      const config = await getMotorGateConfig("client-1", "video-production");
      expect(config.gates).toHaveLength(1);
      expect(config.gates[0].type).toBe("hybrid");
      expect(config.gates[0].gateId).toBe("G1");
    });
  });
});

// ── Audit Service Tests ──

describe("AuditService", () => {
  it("writes an audit entry", async () => {
    const { writeAuditEntry } = await import("./audit-service.js");
    const entry = await writeAuditEntry({
      clientId: "client-1",
      actor: "BG-001",
      actorType: "agent",
      action: "brand.validate.execute",
      resourceType: "brand_validation",
      resourceId: "val-1",
      details: { score: 85 },
    });
    expect(entry.id).toBe("test-id");
  });
});
