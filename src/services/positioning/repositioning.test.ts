import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => {
  const mockReturning = vi.fn().mockResolvedValue([{ id: "track-1" }]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockWhere = vi.fn().mockResolvedValue([
    {
      id: "track-1",
      phase: 1,
      metrics: { brandHealth: 70, sentiment: 65 },
      status: "on_track",
      measurementDate: new Date(),
    },
  ]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  return {
    db: {
      select: vi.fn().mockReturnValue({ from: mockFrom }),
      insert: vi.fn().mockReturnValue({ values: mockValues }),
    },
    schema: { perceptionTracking: {} },
  };
});

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("{}"),
}));

import {
  runCurrentAudit,
  defineTargetPositioning,
  createTransitionPlan,
  designPhases,
  recordPerceptionMeasurement,
  getPerceptionHistory,
} from "./repositioning.js";
import { generateText } from "../../providers/generate-text.js";

const CLIENT_ID = "client-abc";
const PROJECT_ID = "project-xyz";

beforeEach(() => {
  vi.clearAllMocks();
  (generateText as ReturnType<typeof vi.fn>).mockResolvedValue("{}");
});

// ── runCurrentAudit ──

describe("runCurrentAudit", () => {
  it("returns step=current_audit with status completed and parsed data", async () => {
    const mockData = {
      currentPositioning: "Premium digital-first brand",
      touchpointAudit: [{ touchpoint: "Website", currentMessage: "Innovation", effectiveness: "high", notes: "Good" }],
      customerPerception: "Trustworthy and modern",
      strengthsToPreserve: ["Visual identity"],
      weaknessesToAddress: ["Tone inconsistency"],
    };
    (generateText as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(JSON.stringify(mockData))
      .mockResolvedValueOnce("# Reporte de Auditoría\n\nDATOS SINTÉTICOS");

    const result = await runCurrentAudit(CLIENT_ID, {
      brandName: "TestBrand",
      brandDna: { values: ["innovation"] },
      listenerHistory: [],
      contentArtifacts: [],
    });

    expect(result.step).toBe("current_audit");
    expect(result.status).toBe("completed");
    expect((result.data as typeof mockData).currentPositioning).toBe("Premium digital-first brand");
    expect(result.artifactContent).toBeTruthy();
  });

  it("returns fallback data when LLM returns invalid JSON", async () => {
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue("not json");

    const result = await runCurrentAudit(CLIENT_ID, {
      brandName: "Fallback Brand",
      brandDna: {},
      listenerHistory: [],
      contentArtifacts: [],
    });

    expect(result.step).toBe("current_audit");
    expect(result.status).toBe("completed");
    expect((result.data as { currentPositioning: string }).currentPositioning).toBe("Unknown");
  });
});

// ── defineTargetPositioning ──

describe("defineTargetPositioning", () => {
  it("returns step=target_definition with changeMatrix", async () => {
    const mockData = {
      targetPositioning: "The go-to brand for creative professionals",
      changeMatrix: [
        { element: "Tagline", current: "Old tagline", target: "New tagline", changeType: "replace", phase: 1 },
      ],
      preserveElements: ["Logo colors"],
    };
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify(mockData));

    const result = await defineTargetPositioning(CLIENT_ID, {
      currentAudit: { currentPositioning: "Generic brand" },
      competitiveLandscape: { competitors: [] },
      businessStrategy: { goal: "Market leadership" },
    });

    expect(result.step).toBe("target_definition");
    expect(result.status).toBe("completed");
    const data = result.data as typeof mockData;
    expect(data.changeMatrix).toHaveLength(1);
    expect(data.changeMatrix[0].changeType).toBe("replace");
    expect(data.targetPositioning).toBe("The go-to brand for creative professionals");
  });

  it("returns fallback when LLM returns invalid JSON", async () => {
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValueOnce("invalid json");

    const result = await defineTargetPositioning(CLIENT_ID, {
      currentAudit: {},
      competitiveLandscape: {},
      businessStrategy: {},
    });

    expect(result.step).toBe("target_definition");
    const data = result.data as { changeMatrix: unknown[] };
    expect(Array.isArray(data.changeMatrix)).toBe(true);
  });
});

// ── createTransitionPlan ──

describe("createTransitionPlan", () => {
  it("returns step=transition_plan with phases and artifactContent", async () => {
    const mockPlanData = {
      fromPositioning: "Generic brand",
      toPositioning: "Premium positioning",
      phases: [
        {
          phase: 1,
          name: "Foundation",
          durationMonths: "3",
          objectives: ["Align internally"],
          actions: ["Update messaging docs"],
          measurements: ["Internal survey score"],
        },
      ],
      riskMitigation: ["Monitor customer feedback closely"],
      successMetrics: [{ metric: "Brand awareness", current: "30%", target: "50%" }],
      totalDurationMonths: 9,
    };
    (generateText as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(JSON.stringify(mockPlanData))
      .mockResolvedValueOnce("# Plan de Transición\n\nDATOS SINTÉTICOS");

    const changeMatrix = [
      { element: "Tagline", current: "Old", target: "New", changeType: "replace" as const, phase: 1 },
    ];

    const result = await createTransitionPlan(CLIENT_ID, {
      brandName: "TestBrand",
      changeMatrix,
      currentAssets: { logo: "v1.svg" },
    });

    expect(result.step).toBe("transition_plan");
    expect(result.status).toBe("completed");
    const data = result.data as typeof mockPlanData & { brandName: string; changeMatrix: unknown[] };
    expect(Array.isArray(data.phases)).toBe(true);
    expect(data.phases).toHaveLength(1);
    expect(data.brandName).toBe("TestBrand");
    expect(result.artifactContent).toBeTruthy();
  });
});

// ── designPhases ──

describe("designPhases", () => {
  it("returns step=phase_design with phaseBlueprints", async () => {
    const mockDesignData = {
      phaseBlueprints: [
        {
          phase: 1,
          name: "Foundation",
          touchpointChanges: [{ touchpoint: "Website", change: "Update hero copy", rationale: "Align with new positioning" }],
          messagingGuidance: "Focus on reliability and innovation",
          visualEvolution: "Introduce updated color palette",
          internalTraining: ["Train sales team on new messaging"],
          productionBriefs: ["New website banner brief"],
        },
      ],
    };
    (generateText as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(JSON.stringify(mockDesignData))
      .mockResolvedValueOnce("# Diseño de Fases\n\nDATOS SINTÉTICOS");

    const transitionPlan = {
      brandName: "TestBrand",
      fromPositioning: "Generic",
      toPositioning: "Premium",
      changeMatrix: [],
      phases: [{ phase: 1, name: "Foundation", durationMonths: "3", objectives: [], actions: [], measurements: [] }],
      riskMitigation: [],
      successMetrics: [],
      totalDurationMonths: 9,
    };

    const result = await designPhases(CLIENT_ID, {
      transitionPlan,
      channelSpecs: { channels: ["instagram", "website"] },
    });

    expect(result.step).toBe("phase_design");
    expect(result.status).toBe("completed");
    const data = result.data as typeof mockDesignData;
    expect(data.phaseBlueprints).toHaveLength(1);
    expect(data.phaseBlueprints[0].phase).toBe(1);
    expect(result.artifactContent).toBeTruthy();
  });

  it("returns fallback when LLM returns invalid JSON", async () => {
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue("bad json");

    const transitionPlan = {
      brandName: "X",
      fromPositioning: "A",
      toPositioning: "B",
      changeMatrix: [],
      phases: [],
      riskMitigation: [],
      successMetrics: [],
      totalDurationMonths: 6,
    };

    const result = await designPhases(CLIENT_ID, { transitionPlan, channelSpecs: {} });

    expect(result.step).toBe("phase_design");
    const data = result.data as { phaseBlueprints: unknown[] };
    expect(Array.isArray(data.phaseBlueprints)).toBe(true);
  });
});

// ── recordPerceptionMeasurement ──

describe("recordPerceptionMeasurement", () => {
  it("inserts a record and returns { id }", async () => {
    const result = await recordPerceptionMeasurement(CLIENT_ID, {
      repositioningProjectId: PROJECT_ID,
      phase: 1,
      metrics: {
        brandHealth: 72,
        attributeScores: { innovation: 80, trust: 75 },
        sentiment: 68,
        awarenessLevel: 55,
      },
      status: "on_track",
      notes: "First measurement",
    });

    expect(result).toEqual({ id: "track-1" });
  });

  it("works without optional notes", async () => {
    const result = await recordPerceptionMeasurement(CLIENT_ID, {
      repositioningProjectId: PROJECT_ID,
      phase: 2,
      metrics: {
        brandHealth: 80,
        attributeScores: { premium: 85 },
        sentiment: 78,
        awarenessLevel: 62,
      },
      status: "at_risk",
    });

    expect(result.id).toBe("track-1");
  });
});

// ── getPerceptionHistory ──

describe("getPerceptionHistory", () => {
  it("returns array of perception tracking records", async () => {
    const history = await getPerceptionHistory(CLIENT_ID, PROJECT_ID);

    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(1);
    const record = history[0] as { id: string; phase: number; status: string };
    expect(record.id).toBe("track-1");
    expect(record.phase).toBe(1);
    expect(record.status).toBe("on_track");
  });
});
