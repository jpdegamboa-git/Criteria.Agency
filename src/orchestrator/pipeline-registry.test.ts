// src/orchestrator/pipeline-registry.test.ts
import { describe, it, expect } from "vitest";
import { PipelineRegistry } from "./pipeline-registry.js";

// ── Brand Builder pipeline ──────────────────────────────────────

describe("Brand Builder pipeline registration", () => {
  it("is registered in PipelineRegistry", () => {
    expect(PipelineRegistry.has("brand-builder")).toBe(true);
  });

  it("has the correct ordered steps", () => {
    const steps = PipelineRegistry.getSteps("brand-builder");
    expect(steps).toEqual([
      "discovery",
      "research",
      "positioning",
      "identity",
      "brand_dna",
    ]);
  });

  it("has the correct agents per step", () => {
    expect(PipelineRegistry.getAgentsForStep("brand-builder", "discovery")).toEqual(["BB-L", "BB-001"]);
    expect(PipelineRegistry.getAgentsForStep("brand-builder", "research")).toEqual(["BB-002", "LI-002", "LI-004"]);
    expect(PipelineRegistry.getAgentsForStep("brand-builder", "positioning")).toEqual(["BB-L"]);
    expect(PipelineRegistry.getAgentsForStep("brand-builder", "identity")).toEqual(["BB-003", "BB-004"]);
    expect(PipelineRegistry.getAgentsForStep("brand-builder", "brand_dna")).toEqual(["BB-L"]);
  });

  it("has gate bb-g1 after research step", () => {
    const gate = PipelineRegistry.getGateAfterStep("brand-builder", "research");
    expect(gate).toBe("bb-g1");
  });

  it("has gate bb-g2 after identity step", () => {
    const gate = PipelineRegistry.getGateAfterStep("brand-builder", "identity");
    expect(gate).toBe("bb-g2");
  });

  it("has gate bb-g3 after brand_dna step", () => {
    const gate = PipelineRegistry.getGateAfterStep("brand-builder", "brand_dna");
    expect(gate).toBe("bb-g3");
  });

  it("has no gate after discovery step", () => {
    const gate = PipelineRegistry.getGateAfterStep("brand-builder", "discovery");
    expect(gate).toBeUndefined();
  });

  it("has no gate after positioning step", () => {
    const gate = PipelineRegistry.getGateAfterStep("brand-builder", "positioning");
    expect(gate).toBeUndefined();
  });

  it("returns correct gate config for bb-g1", () => {
    const config = PipelineRegistry.getGateConfig("brand-builder", "bb-g1");
    expect(config.afterStep).toBe("research");
    expect(config.evaluators).toContain("BB-L");
    expect(config.maxIterations).toBe(3);
    expect(config.failReturnTo).toBe("research");
  });

  it("returns correct gate config for bb-g2", () => {
    const config = PipelineRegistry.getGateConfig("brand-builder", "bb-g2");
    expect(config.afterStep).toBe("identity");
    expect(config.evaluators).toContain("BB-L");
    expect(config.evaluators).toContain("XA-003");
    expect(config.maxIterations).toBe(3);
    expect(config.failReturnTo).toBe("identity");
  });

  it("returns correct gate config for bb-g3 (human gate)", () => {
    const config = PipelineRegistry.getGateConfig("brand-builder", "bb-g3");
    expect(config.afterStep).toBe("brand_dna");
    expect(config.evaluators).toContain("human");
    expect(config.maxIterations).toBe(1);
    expect(config.failReturnTo).toBe("brand_dna");
  });

  it("getNextStep advances correctly through steps", () => {
    expect(PipelineRegistry.getNextStep("brand-builder", "discovery")).toBe("research");
    expect(PipelineRegistry.getNextStep("brand-builder", "research")).toBe("positioning");
    expect(PipelineRegistry.getNextStep("brand-builder", "positioning")).toBe("identity");
    expect(PipelineRegistry.getNextStep("brand-builder", "identity")).toBe("brand_dna");
  });

  it("getNextStep returns null at the final step", () => {
    expect(PipelineRegistry.getNextStep("brand-builder", "brand_dna")).toBeNull();
  });

  it("returns empty array for unknown step", () => {
    expect(PipelineRegistry.getAgentsForStep("brand-builder", "nonexistent_step")).toEqual([]);
  });
});

// ── Strategist pipeline ─────────────────────────────────────────

describe("Strategist pipeline registration", () => {
  it("is registered in PipelineRegistry", () => {
    expect(PipelineRegistry.has("strategist")).toBe(true);
  });

  it("has the correct ordered steps", () => {
    const steps = PipelineRegistry.getSteps("strategist");
    expect(steps).toEqual([
      "diagnostic",
      "objectives",
      "audiences",
      "value_prop",
      "media_plan",
      "budget",
      "briefs",
    ]);
  });

  it("has the correct agents per step", () => {
    expect(PipelineRegistry.getAgentsForStep("strategist", "diagnostic")).toEqual(["ST-L", "LI-001", "LI-002", "LI-003", "LI-004"]);
    expect(PipelineRegistry.getAgentsForStep("strategist", "objectives")).toEqual(["ST-L"]);
    expect(PipelineRegistry.getAgentsForStep("strategist", "audiences")).toEqual(["ST-001", "LI-002"]);
    expect(PipelineRegistry.getAgentsForStep("strategist", "value_prop")).toEqual(["ST-L", "LI-004"]);
    expect(PipelineRegistry.getAgentsForStep("strategist", "media_plan")).toEqual(["ST-002", "XA-002", "XA-004"]);
    expect(PipelineRegistry.getAgentsForStep("strategist", "budget")).toEqual(["ST-003", "XA-001"]);
    expect(PipelineRegistry.getAgentsForStep("strategist", "briefs")).toEqual(["ST-L"]);
  });

  it("has gate st-g1 after objectives step", () => {
    const gate = PipelineRegistry.getGateAfterStep("strategist", "objectives");
    expect(gate).toBe("st-g1");
  });

  it("has gate st-g2 after value_prop step", () => {
    const gate = PipelineRegistry.getGateAfterStep("strategist", "value_prop");
    expect(gate).toBe("st-g2");
  });

  it("has gate st-g3 after budget step", () => {
    const gate = PipelineRegistry.getGateAfterStep("strategist", "budget");
    expect(gate).toBe("st-g3");
  });

  it("has no gate after diagnostic step", () => {
    const gate = PipelineRegistry.getGateAfterStep("strategist", "diagnostic");
    expect(gate).toBeUndefined();
  });

  it("returns correct gate config for st-g1", () => {
    const config = PipelineRegistry.getGateConfig("strategist", "st-g1");
    expect(config.afterStep).toBe("objectives");
    expect(config.evaluators).toContain("ST-L");
    expect(config.evaluators).toContain("XA-001");
    expect(config.maxIterations).toBe(3);
    expect(config.failReturnTo).toBe("objectives");
  });

  it("returns correct gate config for st-g2", () => {
    const config = PipelineRegistry.getGateConfig("strategist", "st-g2");
    expect(config.afterStep).toBe("value_prop");
    expect(config.evaluators).toContain("ST-L");
    expect(config.evaluators).toContain("XA-003");
    expect(config.maxIterations).toBe(3);
    expect(config.failReturnTo).toBe("value_prop");
  });

  it("returns correct gate config for st-g3 (human gate)", () => {
    const config = PipelineRegistry.getGateConfig("strategist", "st-g3");
    expect(config.afterStep).toBe("budget");
    expect(config.evaluators).toContain("human");
    expect(config.maxIterations).toBe(1);
    expect(config.failReturnTo).toBe("budget");
  });

  it("getNextStep advances correctly through steps", () => {
    expect(PipelineRegistry.getNextStep("strategist", "diagnostic")).toBe("objectives");
    expect(PipelineRegistry.getNextStep("strategist", "objectives")).toBe("audiences");
    expect(PipelineRegistry.getNextStep("strategist", "audiences")).toBe("value_prop");
    expect(PipelineRegistry.getNextStep("strategist", "value_prop")).toBe("media_plan");
    expect(PipelineRegistry.getNextStep("strategist", "media_plan")).toBe("budget");
    expect(PipelineRegistry.getNextStep("strategist", "budget")).toBe("briefs");
  });

  it("getNextStep returns null at the final step", () => {
    expect(PipelineRegistry.getNextStep("strategist", "briefs")).toBeNull();
  });
});

// ── PipelineRegistry error handling ────────────────────────────

describe("PipelineRegistry error handling", () => {
  it("throws for unknown pipeline type", () => {
    expect(() => PipelineRegistry.get("unknown-pipeline")).toThrow("Unknown pipeline type: unknown-pipeline");
  });

  it("throws for unknown gate in known pipeline", () => {
    expect(() => PipelineRegistry.getGateConfig("brand-builder", "nonexistent-gate")).toThrow();
  });

  it("returns false for unregistered pipeline", () => {
    expect(PipelineRegistry.has("not-a-pipeline")).toBe(false);
  });
});
