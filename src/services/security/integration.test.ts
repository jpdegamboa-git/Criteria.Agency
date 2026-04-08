import { describe, it, expect, vi, beforeEach } from "vitest";

// Use same mock pattern as security.test.ts, with one enhancement:
// limit() returns a thenable that also exposes .offset() so both
//   autonomy-manager (chain ends at .limit())  and
//   audit-service    (chain ends at .offset()) work without separate mocks.
//
// Per-test data is fed through limitQueue (FIFO): push arrays before calling
// the service functions that trigger .limit().

const limitQueue: unknown[][] = [];
const offsetQueue: unknown[][] = [];

const mockOffset = vi.fn().mockImplementation(() => {
  const next = offsetQueue.shift();
  return Promise.resolve(next ?? []);
});

const makeLimitResult = (data: unknown[]) => ({
  offset: mockOffset,
  then: (
    onFulfilled?: ((v: unknown[]) => unknown) | null,
    onRejected?: ((e: unknown) => unknown) | null,
  ) => Promise.resolve(data).then(onFulfilled ?? undefined, onRejected ?? undefined),
  catch: (onRejected?: ((e: unknown) => unknown) | null) =>
    Promise.resolve(data).catch(onRejected ?? undefined),
  finally: (onFinally?: (() => void) | null) =>
    Promise.resolve(data).finally(onFinally ?? undefined),
});

const mockLimit = vi.fn().mockImplementation(() => {
  const next = limitQueue.shift();
  return makeLimitResult(next ?? []);
});

const mockReturning = vi.fn().mockResolvedValue([{ id: "test-approval-id" }]);

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: mockLimit,
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: mockReturning,
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [{ count: 0 }] }),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    offset: mockOffset,
  },
  schema: {
    autonomyConfigs: { clientId: "client_id" },
    approvalRequests: { clientId: "client_id", status: "status", createdAt: "created_at", id: "id" },
    auditLog: {
      clientId: "client_id",
      action: "action",
      actorType: "actor_type",
      resourceType: "resource_type",
      timestamp: "timestamp",
    },
    projects: { id: "id", clientId: "client_id" },
    gateReviews: { projectId: "project_id", gate: "gate", decision: "decision" },
  },
}));

// Helper: enqueue the next value that mockLimit will return
function enqueueLimitResult(data: unknown[]) {
  limitQueue.push(data);
}

// Helper: enqueue the next value that mockOffset will return
function enqueueOffsetResult(data: unknown[]) {
  offsetQueue.push(data);
}

beforeEach(() => {
  vi.clearAllMocks();
  limitQueue.length = 0;
  offsetQueue.length = 0;
  // Re-apply implementations after clearAllMocks resets them
  mockLimit.mockImplementation(() => {
    const next = limitQueue.shift();
    return makeLimitResult(next ?? []);
  });
  mockOffset.mockImplementation(() => {
    const next = offsetQueue.shift();
    return Promise.resolve(next ?? []);
  });
  mockReturning.mockResolvedValue([{ id: "test-approval-id" }]);
});

// ── Integration Test 1: Autonomy + Approval flow ──

describe("Integration: Autonomy + Approval flow", () => {
  it("checkAction returns requiresApproval=true then createApprovalRequest succeeds with correct fields", async () => {
    // No config in queue → limit returns [] → default level 3 → publish requires approval
    const { checkAction, createApprovalRequest } = await import("./autonomy-manager.js");

    const checkResult = await checkAction("client-int-1", {
      motor: "writer",
      actionType: "publish",
    });

    expect(checkResult.requiresApproval).toBe(true);
    expect(checkResult.allowed).toBe(false);

    // createApprovalRequest calls getAutonomyConfig internally (another .limit())
    // Leave queue empty → returns [] → uses default escalation hours
    mockReturning.mockResolvedValueOnce([{ id: "approval-abc-123" }]);

    const approval = await createApprovalRequest("client-int-1", {
      motor: "writer",
      actionType: "publish",
      description: "Publish needs approval",
    });

    expect(approval.id).toBe("approval-abc-123");

    // Verify insert was called with correct motor and actionType
    const { db } = await import("../../db/index.js");
    const valuesCall = vi.mocked(db.values).mock.calls[0][0] as Record<string, unknown>;
    expect(valuesCall.motor).toBe("writer");
    expect(valuesCall.actionType).toBe("publish");
    expect(valuesCall.clientId).toBe("client-int-1");
    expect(valuesCall.status).toBe("pending");
  });
});

// ── Integration Test 2: PII detection comprehensive ──

describe("Integration: PII detection comprehensive", () => {
  it("detects credit card + email + phone in a single text", async () => {
    const { scanForPII } = await import("./data-protector.js");

    const text =
      "Bill card 4111 1111 1111 1111, email john.doe@example.com, call 555-123-4567";
    const result = scanForPII(text);

    const types = result.detections.map((d) => d.type);
    expect(types).toContain("credit_card");
    expect(types).toContain("email");
    expect(types).toContain("phone");
    expect(result.detections.length).toBeGreaterThanOrEqual(3);
  });

  it("credit card is blocked and email/phone are anonymized", async () => {
    const { scanForPII } = await import("./data-protector.js");

    const text =
      "Bill card 4111 1111 1111 1111, email john.doe@example.com, call 555-123-4567";
    const result = scanForPII(text);

    const cc = result.detections.find((d) => d.type === "credit_card");
    const email = result.detections.find((d) => d.type === "email");
    const phone = result.detections.find((d) => d.type === "phone");

    expect(cc?.action).toBe("blocked");
    expect(email?.action).toBe("anonymized");
    expect(phone?.action).toBe("anonymized");
    expect(result.blocked).toBe(true);
  });

  it("sanitizedText contains no raw PII", async () => {
    const { scanForPII } = await import("./data-protector.js");

    const text =
      "Bill card 4111 1111 1111 1111, email john.doe@example.com, call 555-123-4567";
    const result = scanForPII(text);

    expect(result.sanitizedText).not.toContain("4111 1111 1111 1111");
    expect(result.sanitizedText).not.toContain("john.doe@example.com");
    expect(result.sanitizedText).not.toContain("555-123-4567");
    expect(result.sanitizedText).toContain("[BLOCKED_PII]");
    expect(result.sanitizedText).toContain("[EMAIL_REDACTED]");
  });
});

// ── Integration Test 3: Gate evaluation spectrum ──

describe("Integration: Gate evaluation spectrum", () => {
  it("score=95 → pass (at autoPass boundary)", async () => {
    const { evaluateGate } = await import("./gate-manager.js");
    expect(evaluateGate(95).verdict).toBe("pass");
  });

  it("score=94 → needs_human_review (just below autoPass)", async () => {
    const { evaluateGate } = await import("./gate-manager.js");
    expect(evaluateGate(94).verdict).toBe("needs_human_review");
  });

  it("score=40 → fail (at autoFail boundary)", async () => {
    const { evaluateGate } = await import("./gate-manager.js");
    expect(evaluateGate(40).verdict).toBe("fail");
  });

  it("score=41 → needs_human_review (just above autoFail)", async () => {
    const { evaluateGate } = await import("./gate-manager.js");
    expect(evaluateGate(41).verdict).toBe("needs_human_review");
  });

  it("score=0 → fail", async () => {
    const { evaluateGate } = await import("./gate-manager.js");
    expect(evaluateGate(0).verdict).toBe("fail");
  });

  it("score=100 → pass", async () => {
    const { evaluateGate } = await import("./gate-manager.js");
    expect(evaluateGate(100).verdict).toBe("pass");
  });
});

// ── Integration Test 4: Autonomy level override precedence ──

describe("Integration: Autonomy level override precedence", () => {
  it("action-specific override takes priority over motor-specific override", async () => {
    // Config with both a motor-level override (level 2) and an action-specific override (level 1)
    enqueueLimitResult([
      {
        clientId: "client-override",
        globalLevel: 3,
        overrides: [
          {
            scope: { motor: "writer" },
            level: 2,
            reason: "Motor-level override for writer",
          },
          {
            scope: { motor: "writer", actionType: "publish" },
            level: 1,
            reason: "Action-specific override: publish always needs full approval",
          },
        ],
        escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
      },
    ]);

    const { resolveAutonomyLevel } = await import("./autonomy-manager.js");
    const result = await resolveAutonomyLevel("client-override", "writer", "publish");

    // action_override (level 1) must beat motor_override (level 2)
    expect(result.effectiveLevel).toBe(1);
    expect(result.source).toBe("action_override");
  });

  it("motor-specific override is used when no matching action override", async () => {
    enqueueLimitResult([
      {
        clientId: "client-override",
        globalLevel: 3,
        overrides: [
          {
            scope: { motor: "writer" },
            level: 2,
            reason: "Motor-level override for writer",
          },
        ],
        escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
      },
    ]);

    const { resolveAutonomyLevel } = await import("./autonomy-manager.js");
    const result = await resolveAutonomyLevel("client-override", "writer", "draft");

    expect(result.effectiveLevel).toBe(2);
    expect(result.source).toBe("motor_override");
  });
});

// ── Integration Test 5: Audit write + query ──

describe("Integration: Audit write + query", () => {
  it("writeAuditEntry persists entry and queryAuditLog returns it", async () => {
    const fakeEntry = {
      id: "audit-entry-001",
      clientId: "client-audit",
      actor: "BG-001",
      actorType: "agent",
      action: "brand.validate.execute",
      resourceType: "brand_validation",
      resourceId: "val-99",
      details: { score: 92 },
      timestamp: new Date("2026-04-07T10:00:00Z"),
    };

    // Mock the insert .returning() to return the new entry id
    mockReturning.mockResolvedValueOnce([fakeEntry]);

    const { writeAuditEntry } = await import("./audit-service.js");
    const written = await writeAuditEntry({
      clientId: fakeEntry.clientId,
      actor: fakeEntry.actor,
      actorType: "agent",
      action: fakeEntry.action,
      resourceType: fakeEntry.resourceType,
      resourceId: fakeEntry.resourceId,
      details: fakeEntry.details,
    });

    expect(written.id).toBe("audit-entry-001");

    // Mock the select+offset chain to return the same entry on query
    enqueueOffsetResult([fakeEntry]);

    const { queryAuditLog } = await import("./audit-service.js");
    const rows = await queryAuditLog({
      clientId: fakeEntry.clientId,
      action: fakeEntry.action,
    });

    expect(Array.isArray(rows)).toBe(true);
    expect((rows as typeof fakeEntry[]).length).toBe(1);
    expect((rows as typeof fakeEntry[])[0].id).toBe("audit-entry-001");
    expect((rows as typeof fakeEntry[])[0].action).toBe("brand.validate.execute");
  });
});

// ── Integration Test 6: Isolation audit ──

describe("Integration: Isolation audit", () => {
  it("runIsolationAudit returns compliant with exactly 3 checks, all passing", async () => {
    const { runIsolationAudit } = await import("./data-protector.js");
    const result = await runIsolationAudit("client-iso-1");

    expect(result.clientId).toBe("client-iso-1");
    expect(result.overallStatus).toBe("compliant");
    expect(result.checks).toHaveLength(3);
    expect(result.checks.every((c) => c.status === "pass")).toBe(true);
    expect(result.checks.map((c) => c.check)).toEqual([
      "cross_client_refs",
      "audit_scoping",
      "tenant_guard",
    ]);
  });
});

// ── Integration Test 7: PII edge cases ──

describe("Integration: PII edge cases", () => {
  it("normal text with numbers like 'Order 12345' does NOT trigger false positives", async () => {
    const { scanForPII } = await import("./data-protector.js");

    const result = scanForPII("Your order number is 12345 and will arrive soon.");
    expect(result.detections).toHaveLength(0);
    expect(result.blocked).toBe(false);
    expect(result.sanitizedText).toBe("Your order number is 12345 and will arrive soon.");
  });

  it("SSN format '123-45-6789' IS detected and blocked", async () => {
    const { scanForPII } = await import("./data-protector.js");

    const result = scanForPII("Please provide your SSN: 123-45-6789 for verification.");
    const ssn = result.detections.find((d) => d.type === "ssn");
    expect(ssn).toBeDefined();
    expect(ssn?.action).toBe("blocked");
    expect(result.blocked).toBe(true);
    expect(result.sanitizedText).not.toContain("123-45-6789");
    expect(result.sanitizedText).toContain("[BLOCKED_PII]");
  });
});
