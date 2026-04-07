import { describe, it, expect } from "vitest";
import { classifyAction, resolveEffectiveLevel, requiresApproval } from "./autonomy";
import type { AutonomyConfig } from "@/shared/engine-types";

describe("Autonomy", () => {
  const defaultConfig: AutonomyConfig = {
    clientId: "client-123",
    globalLevel: 3,
    overrides: [],
    escalation: { autoEscalateAfter: 24, escalateTo: ["admin@test.com"], fallbackAction: "block" },
  };

  describe("classifyAction", () => {
    it("classifies publish as external", () => {
      expect(classifyAction("publish_social_post")).toBe("publish");
    });
    it("classifies send_email as communicate", () => {
      expect(classifyAction("send_email")).toBe("communicate");
    });
    it("classifies analyze_data as internal", () => {
      expect(classifyAction("analyze_data")).toBe("internal");
    });
    it("classifies create_campaign_spend as spend", () => {
      expect(classifyAction("create_campaign_spend")).toBe("spend");
    });
  });

  describe("resolveEffectiveLevel", () => {
    it("returns global level when no overrides", () => {
      expect(resolveEffectiveLevel(defaultConfig, "video-production", "internal")).toBe(3);
    });
    it("returns motor-specific override", () => {
      const config: AutonomyConfig = {
        ...defaultConfig,
        overrides: [{ scope: { motor: "community-management" }, level: 4, reason: "trusted" }],
      };
      expect(resolveEffectiveLevel(config, "community-management", "publish")).toBe(4);
    });
    it("returns action-specific override", () => {
      const config: AutonomyConfig = {
        ...defaultConfig,
        overrides: [{ scope: { actionType: "spend" }, level: 2, reason: "careful" }],
      };
      expect(resolveEffectiveLevel(config, "ads", "spend")).toBe(2);
    });
  });

  describe("requiresApproval", () => {
    it("level 1 requires approval for everything", () => {
      expect(requiresApproval(1, "internal")).toBe(true);
      expect(requiresApproval(1, "publish")).toBe(true);
    });
    it("level 2 allows internal, blocks external", () => {
      expect(requiresApproval(2, "internal")).toBe(false);
      expect(requiresApproval(2, "publish")).toBe(true);
    });
    it("level 3 blocks publish/spend, allows internal + gates", () => {
      expect(requiresApproval(3, "internal")).toBe(false);
      expect(requiresApproval(3, "gate_pass")).toBe(false);
      expect(requiresApproval(3, "publish")).toBe(true);
      expect(requiresApproval(3, "spend")).toBe(true);
    });
    it("level 4 allows most, blocks spend", () => {
      expect(requiresApproval(4, "publish")).toBe(false);
      expect(requiresApproval(4, "spend")).toBe(true);
    });
    it("level 5 allows everything", () => {
      expect(requiresApproval(5, "spend")).toBe(false);
      expect(requiresApproval(5, "publish")).toBe(false);
    });
  });
});
