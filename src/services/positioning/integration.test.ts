import { describe, it, expect } from "vitest";
import type {
  PerceptionAttribute,
  PerceptionMap,
  GapAnalysisResult,
  PositioningDocument,
  PositioningStatement,
  CompetitiveFrame,
  ValuePropositionCanvas,
  ChangeMatrixEntry,
  TransitionPhase,
  TransitionPlan,
  PerceptionMetrics,
  TrackingStatus,
  ChangeType,
  PositioningStepResult,
} from "./types.js";

// ── Sample fixtures ──────────────────────────────────────────────────────────

const samplePerceptionAttribute: PerceptionAttribute = {
  attribute: "Innovation",
  currentPerception: "Traditional",
  desiredPerception: "Cutting-edge",
  gap: "large",
  priority: "high",
};

const sampleStatement: PositioningStatement = {
  targetAudience: "Mid-market B2B companies",
  need: "streamline marketing operations",
  brandName: "Criteria",
  category: "AI marketing platform",
  keyBenefit: "autonomous campaign execution",
  reasonsToBelieve: ["20+ AI agents", "real-time analytics", "proven ROI"],
};

const sampleCompetitiveFrame: CompetitiveFrame = {
  directCompetitors: [{ name: "HubSpot", positioning: "All-in-one inbound" }],
  indirectCompetitors: [{ name: "Salesforce", positioning: "CRM-first growth" }],
  differentiation: "AI-native autonomous execution vs manual orchestration",
};

const sampleValueProp: ValuePropositionCanvas = {
  customerJobs: ["launch campaigns", "track brand health"],
  pains: ["slow execution", "fragmented tools", "lack of insight"],
  gains: ["faster GTM", "unified platform", "measurable impact"],
  painRelievers: ["automated workflows", "single dashboard"],
  gainCreators: ["AI recommendations", "real-time metrics"],
};

const samplePositioningDoc: PositioningDocument = {
  statement: sampleStatement,
  competitiveFrame: sampleCompetitiveFrame,
  valueProposition: sampleValueProp,
  perceptionGapMap: [samplePerceptionAttribute],
  brandAttributes: ["Innovative", "Reliable", "Intelligent"],
  audienceResonance: [
    { audience: "CMOs", fitScore: 0.9, reasoning: "Aligns with AI adoption goals" },
  ],
  confidenceScore: 0.85,
  validatedAt: null,
};

const sampleChangeMatrix: ChangeMatrixEntry = {
  element: "Brand voice",
  current: "Corporate formal",
  target: "Conversational expert",
  changeType: "evolve",
  phase: 1,
};

const sampleTransitionPhase: TransitionPhase = {
  phase: 1,
  name: "Foundation",
  durationMonths: "3",
  objectives: ["Establish new tone of voice", "Update visual identity"],
  actions: ["Rewrite website copy", "Redesign brand assets"],
  measurements: ["NPS survey", "brand recall study"],
};

const sampleTransitionPlan: TransitionPlan = {
  brandName: "Criteria",
  fromPositioning: "Traditional marketing software",
  toPositioning: "AI-native marketing intelligence platform",
  changeMatrix: [sampleChangeMatrix],
  phases: [sampleTransitionPhase],
  riskMitigation: ["Phased rollout to reduce disruption"],
  successMetrics: [
    { metric: "Brand awareness", current: "12%", target: "25%" },
  ],
  totalDurationMonths: 9,
};

const samplePerceptionMap: PerceptionMap = {
  brandName: "Criteria",
  attributes: [samplePerceptionAttribute],
  strengths: ["AI capabilities", "automation depth"],
  weaknesses: ["limited integrations", "steep learning curve"],
  keyAssociations: ["AI", "marketing", "efficiency"],
  overallSentiment: 0.72,
  dataQuality: "high",
  generatedAt: new Date().toISOString(),
};

const sampleGapAnalysis: GapAnalysisResult = {
  perceptionVsAspiration: [samplePerceptionAttribute],
  priorityGaps: ["Innovation gap", "Trust gap"],
  competitiveWhitespace: ["AI-native positioning"],
  opportunities: ["SMB market expansion"],
  risks: ["Incumbent brand equity"],
};

const samplePerceptionMetrics: PerceptionMetrics = {
  brandHealth: 74,
  attributeScores: { innovation: 0.8, trust: 0.65, clarity: 0.7 },
  sentiment: 0.68,
  awarenessLevel: 0.42,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Positioning Engine — Integration Tests", () => {
  // 1. Type completeness
  describe("Type completeness", () => {
    it("PerceptionAttribute gap covers all 4 options", () => {
      const gapValues: Array<PerceptionAttribute["gap"]> = [
        "none",
        "small",
        "medium",
        "large",
      ];
      expect(gapValues).toHaveLength(4);
      expect(gapValues).toContain("none");
      expect(gapValues).toContain("small");
      expect(gapValues).toContain("medium");
      expect(gapValues).toContain("large");
    });

    it("PerceptionAttribute priority covers all 3 options", () => {
      const priorityValues: Array<PerceptionAttribute["priority"]> = [
        "low",
        "medium",
        "high",
      ];
      expect(priorityValues).toHaveLength(3);
      expect(priorityValues).toContain("low");
      expect(priorityValues).toContain("medium");
      expect(priorityValues).toContain("high");
    });

    it("ChangeType covers all 5 values", () => {
      const changeTypes: ChangeType[] = [
        "replace",
        "evolve",
        "keep",
        "remove",
        "add",
      ];
      expect(changeTypes).toHaveLength(5);
      expect(changeTypes).toContain("replace");
      expect(changeTypes).toContain("evolve");
      expect(changeTypes).toContain("keep");
      expect(changeTypes).toContain("remove");
      expect(changeTypes).toContain("add");
    });

    it("TrackingStatus covers all 3 values", () => {
      const statuses: TrackingStatus[] = ["on_track", "at_risk", "off_track"];
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain("on_track");
      expect(statuses).toContain("at_risk");
      expect(statuses).toContain("off_track");
    });
  });

  // 2. Data flow validation
  describe("Data flow validation", () => {
    it("PerceptionMap output shape has all required fields", () => {
      expect(samplePerceptionMap).toHaveProperty("brandName");
      expect(samplePerceptionMap).toHaveProperty("attributes");
      expect(samplePerceptionMap).toHaveProperty("strengths");
      expect(samplePerceptionMap).toHaveProperty("weaknesses");
      expect(samplePerceptionMap).toHaveProperty("keyAssociations");
      expect(samplePerceptionMap).toHaveProperty("overallSentiment");
      expect(samplePerceptionMap).toHaveProperty("dataQuality");
      expect(samplePerceptionMap).toHaveProperty("generatedAt");
    });

    it("GapAnalysisResult has perceptionVsAspiration matching PerceptionAttribute shape", () => {
      expect(Array.isArray(sampleGapAnalysis.perceptionVsAspiration)).toBe(true);
      const attr = sampleGapAnalysis.perceptionVsAspiration[0];
      expect(attr).toHaveProperty("attribute");
      expect(attr).toHaveProperty("currentPerception");
      expect(attr).toHaveProperty("desiredPerception");
      expect(attr).toHaveProperty("gap");
      expect(attr).toHaveProperty("priority");
    });

    it("PositioningDocument has all 7 top-level fields", () => {
      expect(samplePositioningDoc).toHaveProperty("statement");
      expect(samplePositioningDoc).toHaveProperty("competitiveFrame");
      expect(samplePositioningDoc).toHaveProperty("valueProposition");
      expect(samplePositioningDoc).toHaveProperty("perceptionGapMap");
      expect(samplePositioningDoc).toHaveProperty("brandAttributes");
      expect(samplePositioningDoc).toHaveProperty("audienceResonance");
      expect(samplePositioningDoc).toHaveProperty("confidenceScore");
    });

    it("TransitionPlan has all required fields including changeMatrix and phases", () => {
      expect(sampleTransitionPlan).toHaveProperty("brandName");
      expect(sampleTransitionPlan).toHaveProperty("fromPositioning");
      expect(sampleTransitionPlan).toHaveProperty("toPositioning");
      expect(sampleTransitionPlan).toHaveProperty("changeMatrix");
      expect(sampleTransitionPlan).toHaveProperty("phases");
      expect(sampleTransitionPlan).toHaveProperty("riskMitigation");
      expect(sampleTransitionPlan).toHaveProperty("successMetrics");
      expect(sampleTransitionPlan).toHaveProperty("totalDurationMonths");
      expect(Array.isArray(sampleTransitionPlan.changeMatrix)).toBe(true);
      expect(Array.isArray(sampleTransitionPlan.phases)).toBe(true);
    });
  });

  // 3. PositioningStatement structure
  describe("PositioningStatement structure", () => {
    it("has all required fields", () => {
      expect(sampleStatement).toHaveProperty("targetAudience");
      expect(sampleStatement).toHaveProperty("need");
      expect(sampleStatement).toHaveProperty("brandName");
      expect(sampleStatement).toHaveProperty("category");
      expect(sampleStatement).toHaveProperty("keyBenefit");
      expect(sampleStatement).toHaveProperty("reasonsToBelieve");
    });

    it("reasonsToBelieve is an array of strings", () => {
      expect(Array.isArray(sampleStatement.reasonsToBelieve)).toBe(true);
      sampleStatement.reasonsToBelieve.forEach((r) => {
        expect(typeof r).toBe("string");
      });
    });
  });

  // 4. PerceptionMetrics constraints
  describe("PerceptionMetrics constraints", () => {
    it("brandHealth is a number", () => {
      expect(typeof samplePerceptionMetrics.brandHealth).toBe("number");
    });

    it("sentiment is a number", () => {
      expect(typeof samplePerceptionMetrics.sentiment).toBe("number");
    });

    it("awarenessLevel is a number", () => {
      expect(typeof samplePerceptionMetrics.awarenessLevel).toBe("number");
    });

    it("attributeScores is a Record<string, number>", () => {
      expect(typeof samplePerceptionMetrics.attributeScores).toBe("object");
      expect(samplePerceptionMetrics.attributeScores).not.toBeNull();
      Object.entries(samplePerceptionMetrics.attributeScores).forEach(
        ([key, value]) => {
          expect(typeof key).toBe("string");
          expect(typeof value).toBe("number");
        }
      );
    });
  });

  // 5. TransitionPhase structure
  describe("TransitionPhase structure", () => {
    it("has phase number", () => {
      expect(typeof sampleTransitionPhase.phase).toBe("number");
    });

    it("has name string", () => {
      expect(typeof sampleTransitionPhase.name).toBe("string");
    });

    it("has durationMonths string", () => {
      expect(typeof sampleTransitionPhase.durationMonths).toBe("string");
    });

    it("has objectives array", () => {
      expect(Array.isArray(sampleTransitionPhase.objectives)).toBe(true);
    });

    it("has actions array", () => {
      expect(Array.isArray(sampleTransitionPhase.actions)).toBe(true);
    });

    it("has measurements array", () => {
      expect(Array.isArray(sampleTransitionPhase.measurements)).toBe(true);
    });
  });

  // 6. Change matrix validation
  describe("Change matrix validation", () => {
    it("each entry has element, current, target, changeType, phase", () => {
      sampleTransitionPlan.changeMatrix.forEach((entry) => {
        expect(entry).toHaveProperty("element");
        expect(entry).toHaveProperty("current");
        expect(entry).toHaveProperty("target");
        expect(entry).toHaveProperty("changeType");
        expect(entry).toHaveProperty("phase");
      });
    });

    it("phase is a positive integer", () => {
      sampleTransitionPlan.changeMatrix.forEach((entry) => {
        expect(typeof entry.phase).toBe("number");
        expect(Number.isInteger(entry.phase)).toBe(true);
        expect(entry.phase).toBeGreaterThan(0);
      });
    });

    it("changeType is one of the valid ChangeType values", () => {
      const validChangeTypes: ChangeType[] = [
        "replace",
        "evolve",
        "keep",
        "remove",
        "add",
      ];
      sampleTransitionPlan.changeMatrix.forEach((entry) => {
        expect(validChangeTypes).toContain(entry.changeType);
      });
    });
  });

  // 7. PositioningStepResult shape
  describe("PositioningStepResult shape", () => {
    it("completed step has step, status, and data fields", () => {
      const result: PositioningStepResult = {
        step: "build_perception_map",
        status: "completed",
        data: samplePerceptionMap,
      };
      expect(result.step).toBe("build_perception_map");
      expect(result.status).toBe("completed");
      expect(result.data).toBeDefined();
    });

    it("failed step has step, status, and data fields", () => {
      const result: PositioningStepResult = {
        step: "gap_analysis",
        status: "failed",
        data: { error: "Insufficient perception data" },
      };
      expect(result.step).toBe("gap_analysis");
      expect(result.status).toBe("failed");
      expect(result.data).toBeDefined();
    });

    it("optional artifactContent is a string when present", () => {
      const result: PositioningStepResult = {
        step: "generate_document",
        status: "completed",
        data: samplePositioningDoc,
        artifactContent: "# Positioning Document\n...",
      };
      expect(typeof result.artifactContent).toBe("string");
    });
  });
});
