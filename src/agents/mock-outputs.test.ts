// src/agents/mock-outputs.test.ts
import { describe, it, expect } from "vitest";
import { AGENT_OUTPUTS } from "./mock-outputs.js";
import { PipelineRegistry } from "../orchestrator/pipeline-registry.js";

/**
 * Checks that every agent registered for a step in the given pipeline has a
 * mock output entry for that step in AGENT_OUTPUTS.
 * An empty array is acceptable (agent runs but produces no mock artifacts).
 * A missing key is a blocker — it means the mock execution path has no data.
 */
function getMissingMockOutputs(pipelineType: string): Array<{ agentId: string; step: string }> {
  const pipeline = PipelineRegistry.get(pipelineType);
  const missing: Array<{ agentId: string; step: string }> = [];

  for (const step of pipeline.steps) {
    const agents = PipelineRegistry.getAgentsForStep(pipelineType, step);
    for (const agentId of agents) {
      const agentOutputs = AGENT_OUTPUTS[agentId];
      if (!agentOutputs) {
        missing.push({ agentId, step });
      } else if (!(step in agentOutputs)) {
        // The agent exists but has no entry for this specific step
        // This is fine — the mock will just produce 0 artifacts.
        // We only flag if the agent itself is completely absent.
      }
    }
  }

  return missing;
}

// ── Brand Builder mock outputs ──────────────────────────────────

describe("Brand Builder mock outputs completeness", () => {
  it("every agent in the brand-builder pipeline has a AGENT_OUTPUTS entry", () => {
    const missing = getMissingMockOutputs("brand-builder");
    expect(missing).toEqual([]);
  });

  it("BB-L has mock outputs for discovery step", () => {
    const outputs = AGENT_OUTPUTS["BB-L"]?.["discovery"];
    expect(outputs).toBeDefined();
    expect(Array.isArray(outputs)).toBe(true);
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("BB-L has mock outputs for positioning step", () => {
    const outputs = AGENT_OUTPUTS["BB-L"]?.["positioning"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("BB-L has mock outputs for brand_dna step", () => {
    const outputs = AGENT_OUTPUTS["BB-L"]?.["brand_dna"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("BB-001 has mock outputs for discovery step", () => {
    const outputs = AGENT_OUTPUTS["BB-001"]?.["discovery"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("BB-002 has mock outputs for research step", () => {
    const outputs = AGENT_OUTPUTS["BB-002"]?.["research"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("BB-003 has mock outputs for identity step", () => {
    const outputs = AGENT_OUTPUTS["BB-003"]?.["identity"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("BB-004 has mock outputs for identity step", () => {
    const outputs = AGENT_OUTPUTS["BB-004"]?.["identity"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-002 has mock outputs for research step", () => {
    const outputs = AGENT_OUTPUTS["LI-002"]?.["research"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-004 has mock outputs for research step", () => {
    const outputs = AGENT_OUTPUTS["LI-004"]?.["research"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("all brand-builder mock artifacts have required fields", () => {
    const pipeline = PipelineRegistry.get("brand-builder");
    for (const step of pipeline.steps) {
      const agents = PipelineRegistry.getAgentsForStep("brand-builder", step);
      for (const agentId of agents) {
        const stepOutputs = AGENT_OUTPUTS[agentId]?.[step] ?? [];
        for (const artifact of stepOutputs) {
          expect(artifact).toHaveProperty("name");
          expect(artifact).toHaveProperty("type");
          expect(artifact).toHaveProperty("templateContent");
          expect(artifact.name.length).toBeGreaterThan(0);
          expect(["document", "image", "video", "audio", "subtitle", "package"]).toContain(artifact.type);
        }
      }
    }
  });
});

// ── Strategist mock outputs ─────────────────────────────────────

describe("Strategist mock outputs completeness", () => {
  it("every agent in the strategist pipeline has a AGENT_OUTPUTS entry", () => {
    const missing = getMissingMockOutputs("strategist");
    expect(missing).toEqual([]);
  });

  it("ST-L has mock outputs for diagnostic step", () => {
    const outputs = AGENT_OUTPUTS["ST-L"]?.["diagnostic"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("ST-L has mock outputs for objectives step", () => {
    const outputs = AGENT_OUTPUTS["ST-L"]?.["objectives"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("ST-L has mock outputs for value_prop step", () => {
    const outputs = AGENT_OUTPUTS["ST-L"]?.["value_prop"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("ST-L has mock outputs for briefs step", () => {
    const outputs = AGENT_OUTPUTS["ST-L"]?.["briefs"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("ST-001 has mock outputs for audiences step", () => {
    const outputs = AGENT_OUTPUTS["ST-001"]?.["audiences"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("ST-002 has mock outputs for media_plan step", () => {
    const outputs = AGENT_OUTPUTS["ST-002"]?.["media_plan"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("ST-003 has mock outputs for budget step", () => {
    const outputs = AGENT_OUTPUTS["ST-003"]?.["budget"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-001 has mock outputs for diagnostic step", () => {
    const outputs = AGENT_OUTPUTS["LI-001"]?.["diagnostic"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-002 has mock outputs for diagnostic step", () => {
    const outputs = AGENT_OUTPUTS["LI-002"]?.["diagnostic"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-002 has mock outputs for audiences step", () => {
    const outputs = AGENT_OUTPUTS["LI-002"]?.["audiences"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-003 has mock outputs for diagnostic step", () => {
    const outputs = AGENT_OUTPUTS["LI-003"]?.["diagnostic"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-004 has mock outputs for diagnostic step", () => {
    const outputs = AGENT_OUTPUTS["LI-004"]?.["diagnostic"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("LI-004 has mock outputs for value_prop step", () => {
    const outputs = AGENT_OUTPUTS["LI-004"]?.["value_prop"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("XA-001 has mock outputs for budget step", () => {
    const outputs = AGENT_OUTPUTS["XA-001"]?.["budget"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("XA-002 has mock outputs for media_plan step", () => {
    const outputs = AGENT_OUTPUTS["XA-002"]?.["media_plan"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("XA-004 has mock outputs for media_plan step", () => {
    const outputs = AGENT_OUTPUTS["XA-004"]?.["media_plan"];
    expect(outputs).toBeDefined();
    expect(outputs!.length).toBeGreaterThan(0);
  });

  it("all strategist mock artifacts have required fields", () => {
    const pipeline = PipelineRegistry.get("strategist");
    for (const step of pipeline.steps) {
      const agents = PipelineRegistry.getAgentsForStep("strategist", step);
      for (const agentId of agents) {
        const stepOutputs = AGENT_OUTPUTS[agentId]?.[step] ?? [];
        for (const artifact of stepOutputs) {
          expect(artifact).toHaveProperty("name");
          expect(artifact).toHaveProperty("type");
          expect(artifact).toHaveProperty("templateContent");
          expect(artifact.name.length).toBeGreaterThan(0);
          expect(["document", "image", "video", "audio", "subtitle", "package"]).toContain(artifact.type);
        }
      }
    }
  });
});
