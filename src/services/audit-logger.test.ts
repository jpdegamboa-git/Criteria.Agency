import { describe, it, expect } from "vitest";
import { buildAuditEntry, formatAuditAction } from "./audit-logger";

describe("AuditLogger", () => {
  describe("buildAuditEntry", () => {
    it("creates a complete audit entry", () => {
      const entry = buildAuditEntry({
        clientId: "client-123",
        actor: "BL-001",
        actorType: "agent",
        action: "execute_listener",
        resourceType: "continuous_agent_run",
        resourceId: "run-456",
        details: { listenerType: "brand", step: "collect" },
        autonomyLevel: 3,
      });
      expect(entry.clientId).toBe("client-123");
      expect(entry.actor).toBe("BL-001");
      expect(entry.actorType).toBe("agent");
      expect(entry.action).toBe("execute_listener");
      expect(entry.details).toHaveProperty("listenerType", "brand");
    });

    it("handles optional fields", () => {
      const entry = buildAuditEntry({
        clientId: "client-123",
        actor: "system",
        actorType: "system",
        action: "schedule_run",
      });
      expect(entry.resourceType).toBeNull();
      expect(entry.resourceId).toBeNull();
      expect(entry.details).toBeNull();
      expect(entry.autonomyLevel).toBeNull();
    });
  });

  describe("formatAuditAction", () => {
    it("formats agent execution action", () => {
      expect(formatAuditAction("execute", "agent", "BL-001")).toBe("agent.BL-001.execute");
    });
    it("formats gate evaluation action", () => {
      expect(formatAuditAction("gate_pass", "gate", "g1")).toBe("gate.g1.gate_pass");
    });
  });
});
