// src/services/scale/capacity-manager.test.ts
import { describe, it, expect } from "vitest";
import {
  DEFAULT_CAPACITY_CONFIG,
  computeUtilization,
  canDispatch,
  buildHealthEntry,
} from "./capacity-manager.js";
import type { CapacityConfig, CapacitySnapshot, AgentHealthEntry } from "./types.js";

describe("capacity-manager", () => {
  describe("DEFAULT_CAPACITY_CONFIG", () => {
    it("has expected defaults", () => {
      expect(DEFAULT_CAPACITY_CONFIG.maxConcurrentAgents).toBe(10);
      expect(DEFAULT_CAPACITY_CONFIG.maxConcurrentPerMotor).toBe(3);
      expect(DEFAULT_CAPACITY_CONFIG.maxConcurrentPerClient).toBe(10);
    });
  });

  describe("computeUtilization", () => {
    it("returns 0 when no agents running", () => {
      expect(computeUtilization(0, 10)).toBe(0);
    });

    it("returns 100 at capacity", () => {
      expect(computeUtilization(10, 10)).toBe(100);
    });

    it("returns proportional value", () => {
      expect(computeUtilization(5, 10)).toBe(50);
    });
  });

  describe("canDispatch", () => {
    const config: CapacityConfig = {
      maxConcurrentAgents: 10,
      maxConcurrentPerMotor: 3,
      maxConcurrentPerClient: 5,
    };

    it("allows dispatch when under all limits", () => {
      expect(canDispatch(config, 5, 2, 3)).toBe(true);
    });

    it("blocks when at global limit", () => {
      expect(canDispatch(config, 10, 1, 1)).toBe(false);
    });

    it("blocks when at motor limit", () => {
      expect(canDispatch(config, 5, 3, 2)).toBe(false);
    });

    it("blocks when at client limit", () => {
      expect(canDispatch(config, 5, 1, 5)).toBe(false);
    });
  });

  describe("buildHealthEntry", () => {
    it("marks agent as healthy with high success rate", () => {
      const entry = buildHealthEntry("AG-001", 150, 0.98, 100, 2, "2026-04-07T12:00:00Z");
      expect(entry.status).toBe("healthy");
      expect(entry.successRate).toBe(0.98);
      expect(entry.errorRate).toBe(0.02);
    });

    it("marks agent as degraded with moderate error rate", () => {
      const entry = buildHealthEntry("AG-002", 500, 0.85, 50, 8, null);
      expect(entry.status).toBe("degraded");
    });

    it("marks agent as unavailable with high error rate", () => {
      const entry = buildHealthEntry("AG-003", 2000, 0.5, 20, 10, null);
      expect(entry.status).toBe("unavailable");
    });
  });
});
