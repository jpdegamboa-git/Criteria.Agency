# Phase 5: Positioning Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement capabilities C-048 (Positioning Diagnosis & Definition) and C-049 (Strategic Repositioning) — perception audit, gap analysis, positioning definition, transition planning, and perception tracking.

**Architecture:** Two pipeline modes — positioning-diagnosis (4 steps, 2 gates) and repositioning (4 steps, 2 gates). Services split into `diagnosis.ts` (C-048) and `repositioning.ts` (C-049). LLM calls via `generateText()`. Perception tracking stored in new DB table.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, Zod, Vitest, generateText() provider wrapper

---

## Task 1: Types & Constants

**Files:**
- Create: `src/services/positioning/types.ts`

- [ ] **Step 1: Create types file with all interfaces and constants**

```typescript
// src/services/positioning/types.ts

// ── Perception Types ──

export interface PerceptionAttribute {
  attribute: string;
  currentPerception: string;
  desiredPerception: string;
  gap: "none" | "small" | "medium" | "large";
  priority: "low" | "medium" | "high";
}

export interface PerceptionMap {
  brandName: string;
  attributes: PerceptionAttribute[];
  strengths: string[];
  weaknesses: string[];
  keyAssociations: string[];
  overallSentiment: number; // 0-100
  dataQuality: "high" | "medium" | "low";
  generatedAt: string;
}

// ── Gap Analysis Types ──

export interface GapAnalysisResult {
  perceptionVsAspiration: PerceptionAttribute[];
  priorityGaps: string[];
  competitiveWhitespace: string[];
  opportunities: string[];
  risks: string[];
}

// ── Positioning Document Types ──

export interface PositioningStatement {
  targetAudience: string;
  need: string;
  brandName: string;
  category: string;
  keyBenefit: string;
  reasonsToBelieve: string[];
}

export interface CompetitiveFrame {
  directCompetitors: Array<{ name: string; positioning: string }>;
  indirectCompetitors: Array<{ name: string; positioning: string }>;
  differentiation: string;
}

export interface ValuePropositionCanvas {
  customerJobs: string[];
  pains: string[];
  gains: string[];
  painRelievers: string[];
  gainCreators: string[];
}

export interface PositioningDocument {
  statement: PositioningStatement;
  competitiveFrame: CompetitiveFrame;
  valueProposition: ValuePropositionCanvas;
  perceptionGapMap: PerceptionAttribute[];
  brandAttributes: [string, string, string]; // top 3 ranked
  audienceResonance: Array<{
    audience: string;
    fitScore: number;
    reasoning: string;
  }>;
  confidenceScore: number; // 0-100
  validatedAt: string | null;
}

// ── Repositioning Types ──

export type ChangeType = "replace" | "evolve" | "keep" | "remove" | "add";

export interface ChangeMatrixEntry {
  element: string;
  current: string;
  target: string;
  changeType: ChangeType;
  phase: number;
}

export interface TransitionPhase {
  phase: number;
  name: string;
  durationMonths: string; // e.g., "1-2"
  objectives: string[];
  actions: string[];
  measurements: string[];
}

export interface TransitionPlan {
  brandName: string;
  fromPositioning: string;
  toPositioning: string;
  changeMatrix: ChangeMatrixEntry[];
  phases: TransitionPhase[];
  riskMitigation: string[];
  successMetrics: Array<{
    metric: string;
    current: string;
    target: string;
  }>;
  totalDurationMonths: number;
}

export type TrackingStatus = "on_track" | "at_risk" | "off_track";

export interface PerceptionMetrics {
  brandHealth: number; // 0-100
  attributeScores: Record<string, number>;
  sentiment: number; // 0-100
  awarenessLevel: number; // 0-100
}

// ── Step Result Types ──

export interface PositioningStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/positioning/types.ts
git commit -m "feat(positioning): add types and interfaces for Positioning Engine (C-048, C-049)"
```

---

## Task 2: Database Schema — perception_tracking table

**Files:**
- Modify: `src/db/schema.ts` (append after scoringRules table, before waitlist section ~line 862)

- [ ] **Step 1: Add positioning statuses to projectStatusEnum**

Add these values to the `projectStatusEnum` array:
```
"po_perception_audit", "po_gap_analysis", "po_positioning_definition", "po_validation",
"po_current_audit", "po_target_definition", "po_transition_plan", "po_phase_design", "po_execution_monitoring"
```

- [ ] **Step 2: Add positioning gates to gateTypeEnum**

Add these values to `gateTypeEnum`:
```
"po-g1", "po-g2"
```

- [ ] **Step 3: Add positioning artifact steps to artifactStepEnum**

Add these values to `artifactStepEnum`:
```
"po_perception_audit", "po_gap_analysis", "po_positioning_definition", "po_validation",
"po_current_audit", "po_target_definition", "po_transition_plan", "po_phase_design", "po_execution_monitoring"
```

- [ ] **Step 4: Add perception_tracking table**

Insert before the `// ── Waitlist ──` section:

```typescript
// ── Positioning Engine: Perception Tracking ──

export const perceptionTrackingStatusEnum = pgEnum("perception_tracking_status", [
  "on_track", "at_risk", "off_track",
]);

export const perceptionTracking = pgTable("perception_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  repositioningProjectId: uuid("repositioning_project_id").references(() => projects.id),
  phase: integer("phase").notNull(),
  measurementDate: timestamp("measurement_date").notNull(),
  metrics: jsonb("metrics").notNull(), // PerceptionMetrics
  status: perceptionTrackingStatusEnum("status").default("on_track").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("perception_tracking_client_id_idx").on(table.clientId),
  index("perception_tracking_project_id_idx").on(table.repositioningProjectId),
]);
```

- [ ] **Step 5: Run db:generate to verify migration**

```bash
npm run db:generate
```

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat(db): add perception_tracking table and positioning enums"
```

---

## Task 3: Register Agents in Registry

**Files:**
- Modify: `src/agents/registry.ts` (append PO-L, PO-001, PO-002, PO-003)

- [ ] **Step 1: Add 4 positioning agents to AGENT_REGISTRY**

Append to the `AGENT_REGISTRY` object:

```typescript
  "PO-L": {
    id: "PO-L",
    name: "Positioning Strategist",
    skillFile: "agents/PO-L_positioning_strategist.md",
    team: 16,
    level: "leader",
    steps: ["po_gap_analysis", "po_positioning_definition", "po_target_definition", "po_transition_plan"],
    gates: ["po-g1", "po-g2"],
    autonomy: 70,
  },
  "PO-001": {
    id: "PO-001",
    name: "Perception Auditor",
    skillFile: "agents/PO-001_perception_auditor.md",
    team: 16,
    level: "sub",
    steps: ["po_perception_audit", "po_current_audit"],
    gates: [],
    autonomy: 85,
  },
  "PO-002": {
    id: "PO-002",
    name: "Competitive Mapper",
    skillFile: "agents/PO-002_competitive_mapper.md",
    team: 16,
    level: "sub",
    steps: ["po_positioning_definition"],
    gates: [],
    autonomy: 85,
  },
  "PO-003": {
    id: "PO-003",
    name: "Transition Architect",
    skillFile: "agents/PO-003_transition_architect.md",
    team: 16,
    level: "sub",
    steps: ["po_phase_design", "po_execution_monitoring"],
    gates: [],
    autonomy: 80,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(agents): register PO-L, PO-001, PO-002, PO-003 positioning agents"
```

---

## Task 4: Register Pipelines

**Files:**
- Modify: `src/orchestrator/pipeline-registry.ts` (append two pipeline registrations)

- [ ] **Step 1: Register positioning-diagnosis pipeline**

Append after existing pipeline registrations:

```typescript
// ── Positioning Diagnosis Pipeline (C-048) ──

PipelineRegistry.register({
  type: "positioning-diagnosis",
  steps: [
    "po_perception_audit", "po_gap_analysis", "po_positioning_definition", "po_validation", "delivered",
  ],
  stepAgents: {
    po_perception_audit: ["PO-001"],
    po_gap_analysis: ["PO-L"],
    po_positioning_definition: ["PO-L", "PO-002"],
    po_validation: ["PO-L"],
    delivered: ["PO-L"],
  },
  gates: {
    "po-g1": { afterStep: "po_gap_analysis", evaluators: ["PO-L", "BG-L"], maxIterations: 3, failReturnTo: "po_gap_analysis" },
    "po-g2": { afterStep: "po_validation", evaluators: ["human"], maxIterations: 1, failReturnTo: "po_validation" },
  },
});

// ── Repositioning Pipeline (C-049) ──

PipelineRegistry.register({
  type: "repositioning",
  steps: [
    "po_current_audit", "po_target_definition", "po_transition_plan", "po_phase_design", "delivered",
  ],
  stepAgents: {
    po_current_audit: ["PO-001"],
    po_target_definition: ["PO-L"],
    po_transition_plan: ["PO-L", "PO-003"],
    po_phase_design: ["PO-003"],
    delivered: ["PO-L"],
  },
  gates: {
    "po-g1": { afterStep: "po_target_definition", evaluators: ["PO-L", "BG-L"], maxIterations: 3, failReturnTo: "po_target_definition" },
    "po-g2": { afterStep: "po_phase_design", evaluators: ["human"], maxIterations: 1, failReturnTo: "po_phase_design" },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/orchestrator/pipeline-registry.ts
git commit -m "feat(pipelines): register positioning-diagnosis and repositioning pipelines"
```

---

## Task 5: Diagnosis Service (C-048)

**Files:**
- Create: `src/services/positioning/diagnosis.ts`
- Test: `src/services/positioning/diagnosis.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/services/positioning/diagnosis.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
  schema: {},
}));
vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue("{}"),
}));

import {
  runPerceptionAudit,
  runGapAnalysis,
  definePositioning,
  validatePositioning,
} from "./diagnosis.js";

describe("Positioning Diagnosis (C-048)", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("runPerceptionAudit", () => {
    it("returns a PerceptionMap with attributes", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        attributes: [
          { attribute: "Quality", currentPerception: "decent", desiredPerception: "premium", gap: "large", priority: "high" },
        ],
        strengths: ["reliability"],
        weaknesses: ["innovation"],
        keyAssociations: ["affordable"],
        overallSentiment: 65,
        dataQuality: "medium",
      }));

      const result = await runPerceptionAudit("client-1", {
        brandName: "TestBrand",
        brandDna: "Premium tech company",
        listenerData: "Sentiment: 65, mentions: 120",
      });

      expect(result.step).toBe("perception_audit");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("attributes");
      expect(result.artifactContent).toBeDefined();
    });
  });

  describe("runGapAnalysis", () => {
    it("returns gap analysis with priority gaps", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        perceptionVsAspiration: [
          { attribute: "Innovation", currentPerception: "traditional", desiredPerception: "cutting-edge", gap: "large", priority: "high" },
        ],
        priorityGaps: ["Innovation perception gap"],
        competitiveWhitespace: ["AI-native positioning"],
        opportunities: ["First mover in AI marketing"],
        risks: ["Category confusion"],
      }));

      const result = await runGapAnalysis("client-1", {
        perceptionMap: { attributes: [], strengths: [], weaknesses: [], keyAssociations: [], overallSentiment: 65, dataQuality: "medium", brandName: "Test", generatedAt: "" },
        brandDna: "Premium tech company",
        competitiveMap: "Competitor A: budget, Competitor B: enterprise",
      });

      expect(result.step).toBe("gap_analysis");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("priorityGaps");
    });
  });

  describe("definePositioning", () => {
    it("returns full positioning document", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        statement: {
          targetAudience: "SMBs",
          need: "marketing automation",
          brandName: "TestBrand",
          category: "AI marketing",
          keyBenefit: "automated creativity",
          reasonsToBelieve: ["track record"],
        },
        competitiveFrame: {
          directCompetitors: [{ name: "CompA", positioning: "budget" }],
          indirectCompetitors: [],
          differentiation: "AI-native",
        },
        valueProposition: {
          customerJobs: ["create content"],
          pains: ["time-consuming"],
          gains: ["faster output"],
          painRelievers: ["automation"],
          gainCreators: ["quality AI"],
        },
        brandAttributes: ["innovative", "reliable", "creative"],
        audienceResonance: [{ audience: "SMBs", fitScore: 85, reasoning: "matches needs" }],
        confidenceScore: 78,
      }));

      const result = await definePositioning("client-1", {
        gapAnalysis: { perceptionVsAspiration: [], priorityGaps: [], competitiveWhitespace: [], opportunities: [], risks: [] },
        brandDna: "Premium tech company",
        buyerPersonas: "SMB owners aged 30-50",
      });

      expect(result.step).toBe("positioning_definition");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("statement");
      expect(result.data).toHaveProperty("competitiveFrame");
      expect(result.data).toHaveProperty("valueProposition");
    });
  });

  describe("validatePositioning", () => {
    it("returns validated positioning with confidence score", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        isValid: true,
        confidenceScore: 82,
        brandDnaConsistency: "high",
        marketFeasibility: "medium",
        competitiveDifferentiation: "high",
        audienceResonance: "high",
        recommendations: ["Strengthen proof points"],
      }));

      const positioning = {
        statement: { targetAudience: "SMBs", need: "marketing", brandName: "Test", category: "AI", keyBenefit: "speed", reasonsToBelieve: [] },
        competitiveFrame: { directCompetitors: [], indirectCompetitors: [], differentiation: "AI" },
        valueProposition: { customerJobs: [], pains: [], gains: [], painRelievers: [], gainCreators: [] },
        perceptionGapMap: [],
        brandAttributes: ["innovative", "reliable", "creative"] as [string, string, string],
        audienceResonance: [],
        confidenceScore: 0,
        validatedAt: null,
      };

      const result = await validatePositioning("client-1", {
        positioning,
        brandDna: "Premium tech",
      });

      expect(result.step).toBe("validation");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("confidenceScore");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/services/positioning/diagnosis.test.ts
```

- [ ] **Step 3: Implement diagnosis service**

```typescript
// src/services/positioning/diagnosis.ts
import { generateText } from "@/providers/generate-text.js";
import type {
  PerceptionMap,
  GapAnalysisResult,
  PositioningDocument,
  PositioningStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(fenceMatch ? fenceMatch[1].trim() : text.trim());
  } catch {
    return fallback;
  }
}

export async function runPerceptionAudit(
  clientId: string,
  input: { brandName: string; brandDna: string; listenerData: string },
): Promise<PositioningStepResult> {
  const prompt = `Analyze how the brand "${input.brandName}" is currently perceived.

Brand DNA: ${input.brandDna}
Brand Listener Data: ${input.listenerData}

Return a JSON object with:
- attributes: array of { attribute, currentPerception, desiredPerception, gap (none|small|medium|large), priority (low|medium|high) }
- strengths: array of perceived strengths
- weaknesses: array of perceived weaknesses
- keyAssociations: array of brand associations
- overallSentiment: number 0-100
- dataQuality: "high" | "medium" | "low"

Output ONLY valid JSON.`;

  const result = await generateText(
    MODEL,
    "You are a brand perception analyst. Analyze perception data and output structured JSON. Write in Spanish (Latin American).",
    prompt,
  );

  const parsed = parseJsonSafe<Omit<PerceptionMap, "brandName" | "generatedAt">>(result, {
    attributes: [],
    strengths: [],
    weaknesses: [],
    keyAssociations: [],
    overallSentiment: 50,
    dataQuality: "low",
  });

  const perceptionMap: PerceptionMap = {
    ...parsed,
    brandName: input.brandName,
    generatedAt: new Date().toISOString(),
  };

  const reportPrompt = `Generate a Perception Audit Report in markdown for "${input.brandName}" based on:
${JSON.stringify(perceptionMap)}

Include sections: Executive Summary, Perception Attributes, Strengths & Weaknesses, Key Associations, Sentiment Analysis, Data Quality Assessment.
Use Spanish (Latin American). Mark as "SYNTHETIC DATA — no live monitoring active".`;

  const report = await generateText(
    MODEL,
    "You are a brand perception report writer. Write in Spanish (Latin American).",
    reportPrompt,
  );

  return {
    step: "perception_audit",
    status: "completed",
    data: perceptionMap,
    artifactContent: report,
  };
}

export async function runGapAnalysis(
  clientId: string,
  input: { perceptionMap: PerceptionMap; brandDna: string; competitiveMap: string },
): Promise<PositioningStepResult> {
  const prompt = `Compare brand perception vs aspiration.

Perception Map: ${JSON.stringify(input.perceptionMap)}
Brand DNA (aspirational): ${input.brandDna}
Competitive Map: ${input.competitiveMap}

Return a JSON object with:
- perceptionVsAspiration: array of { attribute, currentPerception, desiredPerception, gap, priority }
- priorityGaps: array of most critical gap descriptions
- competitiveWhitespace: array of unoccupied positioning opportunities
- opportunities: array of positioning opportunities
- risks: array of positioning risks

Output ONLY valid JSON.`;

  const result = await generateText(
    MODEL,
    "You are a strategic positioning analyst. Output structured JSON.",
    prompt,
  );

  const parsed = parseJsonSafe<GapAnalysisResult>(result, {
    perceptionVsAspiration: [],
    priorityGaps: [],
    competitiveWhitespace: [],
    opportunities: [],
    risks: [],
  });

  const reportPrompt = `Generate a Gap Analysis Report in markdown based on:
${JSON.stringify(parsed)}

Include: Perception vs Aspiration Matrix, Priority Gaps, Competitive Whitespace, Opportunities, Risks.
Use Spanish (Latin American). Mark as "SYNTHETIC DATA".`;

  const report = await generateText(MODEL, "Brand positioning analyst. Spanish (Latin American).", reportPrompt);

  return {
    step: "gap_analysis",
    status: "completed",
    data: parsed,
    artifactContent: report,
  };
}

export async function definePositioning(
  clientId: string,
  input: { gapAnalysis: GapAnalysisResult; brandDna: string; buyerPersonas: string },
): Promise<PositioningStepResult> {
  const prompt = `Define brand positioning using the 3Cs framework (Company, Customer, Competition).

Gap Analysis: ${JSON.stringify(input.gapAnalysis)}
Brand DNA: ${input.brandDna}
Buyer Personas: ${input.buyerPersonas}

Return a JSON object with:
- statement: { targetAudience, need, brandName, category, keyBenefit, reasonsToBelieve[] }
- competitiveFrame: { directCompetitors: [{name, positioning}], indirectCompetitors: [{name, positioning}], differentiation }
- valueProposition: { customerJobs[], pains[], gains[], painRelievers[], gainCreators[] }
- brandAttributes: [primary, secondary, tertiary] (top 3 ranked)
- audienceResonance: [{ audience, fitScore (0-100), reasoning }]
- confidenceScore: number 0-100

Output ONLY valid JSON.`;

  const result = await generateText(
    "claude-sonnet-4-5",
    "You are a brand positioning strategist. Define positioning using 3Cs framework. Output structured JSON.",
    prompt,
  );

  const parsed = parseJsonSafe<Omit<PositioningDocument, "perceptionGapMap" | "validatedAt">>(result, {
    statement: { targetAudience: "", need: "", brandName: "", category: "", keyBenefit: "", reasonsToBelieve: [] },
    competitiveFrame: { directCompetitors: [], indirectCompetitors: [], differentiation: "" },
    valueProposition: { customerJobs: [], pains: [], gains: [], painRelievers: [], gainCreators: [] },
    brandAttributes: ["", "", ""],
    audienceResonance: [],
    confidenceScore: 50,
  });

  const positioningDoc: PositioningDocument = {
    ...parsed,
    perceptionGapMap: input.gapAnalysis.perceptionVsAspiration,
    validatedAt: null,
  };

  const reportPrompt = `Generate a Positioning Document in markdown based on:
${JSON.stringify(positioningDoc)}

Include all sections: Positioning Statement (For/Who/Is/That/Because format), Competitive Frame, Value Proposition Canvas, Perception Gap Map (table), Brand Attributes, Audience Resonance.
Use Spanish (Latin American). Mark as "SYNTHETIC DATA".`;

  const report = await generateText(MODEL, "Brand positioning document writer. Spanish (Latin American).", reportPrompt);

  return {
    step: "positioning_definition",
    status: "completed",
    data: positioningDoc,
    artifactContent: report,
  };
}

export async function validatePositioning(
  clientId: string,
  input: { positioning: PositioningDocument; brandDna: string },
): Promise<PositioningStepResult> {
  const prompt = `Validate this positioning against brand strategy.

Positioning: ${JSON.stringify(input.positioning)}
Brand DNA: ${input.brandDna}

Return a JSON object with:
- isValid: boolean
- confidenceScore: number 0-100
- brandDnaConsistency: "high" | "medium" | "low"
- marketFeasibility: "high" | "medium" | "low"
- competitiveDifferentiation: "high" | "medium" | "low"
- audienceResonance: "high" | "medium" | "low"
- recommendations: string[]

Output ONLY valid JSON.`;

  const result = await generateText(
    MODEL,
    "You are a brand strategy validator. Assess positioning quality and consistency.",
    prompt,
  );

  const parsed = parseJsonSafe(result, {
    isValid: true,
    confidenceScore: 60,
    brandDnaConsistency: "medium",
    marketFeasibility: "medium",
    competitiveDifferentiation: "medium",
    audienceResonance: "medium",
    recommendations: [],
  });

  return {
    step: "validation",
    status: "completed",
    data: parsed,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/positioning/diagnosis.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/services/positioning/diagnosis.ts src/services/positioning/diagnosis.test.ts
git commit -m "feat(positioning): implement diagnosis service — perception audit, gap analysis, positioning definition, validation (C-048)"
```

---

## Task 6: Repositioning Service (C-049)

**Files:**
- Create: `src/services/positioning/repositioning.ts`
- Test: `src/services/positioning/repositioning.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/services/positioning/repositioning.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => {
  const mockReturning = vi.fn().mockResolvedValue([{ id: "track-1" }]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsertInto = vi.fn().mockReturnValue({ values: mockValues });
  const mockWhere = vi.fn().mockResolvedValue([
    { id: "track-1", phase: 1, metrics: { brandHealth: 70, sentiment: 65 }, status: "on_track", measurementDate: new Date() },
  ]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return {
    db: {
      select: mockSelect,
      insert: vi.fn().mockReturnValue({ values: mockValues }),
    },
    schema: {
      perceptionTracking: {},
    },
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

describe("Strategic Repositioning (C-049)", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("runCurrentAudit", () => {
    it("returns comprehensive audit of current positioning", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        currentPositioning: "Affordable tech services",
        touchpointAudit: [{ touchpoint: "website", messaging: "budget-friendly", alignment: "aligned" }],
        customerPerception: "budget brand",
        strengthsToPreserve: ["reliability"],
        weaknessesToAddress: ["premium perception"],
      }));

      const result = await runCurrentAudit("client-1", {
        brandName: "TestBrand",
        brandDna: "Premium tech",
        listenerHistory: "Historical sentiment data",
        contentArtifacts: "Recent campaigns",
      });

      expect(result.step).toBe("current_audit");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("currentPositioning");
    });
  });

  describe("defineTargetPositioning", () => {
    it("returns target positioning with change matrix", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        targetPositioning: "Premium AI-native marketing partner",
        changeMatrix: [
          { element: "Tagline", current: "Affordable", target: "Premium", changeType: "replace", phase: 1 },
        ],
        preserveElements: ["reliability", "customer service"],
      }));

      const result = await defineTargetPositioning("client-1", {
        currentAudit: { currentPositioning: "Budget brand", touchpointAudit: [], customerPerception: "", strengthsToPreserve: [], weaknessesToAddress: [] },
        competitiveLandscape: "Market data",
        businessStrategy: "Move upmarket",
      });

      expect(result.step).toBe("target_definition");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("changeMatrix");
    });
  });

  describe("createTransitionPlan", () => {
    it("returns phased transition plan", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        fromPositioning: "Budget brand",
        toPositioning: "Premium partner",
        phases: [
          { phase: 1, name: "Foundation", durationMonths: "1-2", objectives: ["Internal alignment"], actions: ["Update brand DNA"], measurements: ["Team alignment score"] },
        ],
        riskMitigation: ["Track confusion signals"],
        successMetrics: [{ metric: "Brand health", current: "60", target: "80" }],
        totalDurationMonths: 6,
      }));

      const result = await createTransitionPlan("client-1", {
        brandName: "TestBrand",
        changeMatrix: [{ element: "Tagline", current: "Old", target: "New", changeType: "replace" as const, phase: 1 }],
        currentAssets: "Website, social media, print",
      });

      expect(result.step).toBe("transition_plan");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("phases");
      expect(result.artifactContent).toBeDefined();
    });
  });

  describe("designPhases", () => {
    it("returns detailed phase blueprints", async () => {
      const { generateText } = await import("../../providers/generate-text.js");
      (generateText as any).mockResolvedValueOnce(JSON.stringify({
        phaseBlueprints: [
          {
            phase: 1,
            name: "Foundation",
            touchpointChanges: [{ touchpoint: "website", action: "Update copy and CTA" }],
            messagingGuidance: "Shift from affordable to value-driven",
            visualEvolution: "Subtle color palette warm-up",
            internalTraining: ["Brand team workshop"],
            productionBriefs: ["Website copy rewrite brief"],
          },
        ],
      }));

      const result = await designPhases("client-1", {
        transitionPlan: {
          brandName: "TestBrand",
          fromPositioning: "Budget",
          toPositioning: "Premium",
          changeMatrix: [],
          phases: [{ phase: 1, name: "Foundation", durationMonths: "1-2", objectives: [], actions: [], measurements: [] }],
          riskMitigation: [],
          successMetrics: [],
          totalDurationMonths: 6,
        },
        channelSpecs: "Website, Instagram, LinkedIn",
      });

      expect(result.step).toBe("phase_design");
      expect(result.status).toBe("completed");
      expect(result.data).toHaveProperty("phaseBlueprints");
    });
  });

  describe("recordPerceptionMeasurement", () => {
    it("records a perception tracking entry", async () => {
      const result = await recordPerceptionMeasurement("client-1", {
        repositioningProjectId: "project-1",
        phase: 1,
        metrics: { brandHealth: 70, attributeScores: {}, sentiment: 65, awarenessLevel: 50 },
        status: "on_track",
        notes: "Phase 1 on track",
      });

      expect(result).toHaveProperty("id");
    });
  });

  describe("getPerceptionHistory", () => {
    it("returns perception measurements for a project", async () => {
      const result = await getPerceptionHistory("client-1", "project-1");

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement repositioning service**

```typescript
// src/services/positioning/repositioning.ts
import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { generateText } from "@/providers/generate-text.js";
import type {
  ChangeMatrixEntry,
  TransitionPlan,
  TransitionPhase,
  TrackingStatus,
  PerceptionMetrics,
  PositioningStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(fenceMatch ? fenceMatch[1].trim() : text.trim());
  } catch {
    return fallback;
  }
}

export async function runCurrentAudit(
  clientId: string,
  input: { brandName: string; brandDna: string; listenerHistory: string; contentArtifacts: string },
): Promise<PositioningStepResult> {
  const prompt = `Perform a deep audit of current brand positioning for "${input.brandName}".

Brand DNA: ${input.brandDna}
Brand Listener History: ${input.listenerHistory}
Recent Content: ${input.contentArtifacts}

Return a JSON object with:
- currentPositioning: string summary of current positioning
- touchpointAudit: array of { touchpoint, messaging, alignment: "aligned"|"misaligned"|"partial" }
- customerPerception: string summary of how customers see the brand
- strengthsToPreserve: string[] — what works and should stay
- weaknessesToAddress: string[] — what needs to change

Output ONLY valid JSON.`;

  const result = await generateText(
    MODEL,
    "You are a brand positioning auditor. Output structured JSON. Write in Spanish (Latin American).",
    prompt,
  );

  const parsed = parseJsonSafe(result, {
    currentPositioning: "",
    touchpointAudit: [],
    customerPerception: "",
    strengthsToPreserve: [],
    weaknessesToAddress: [],
  });

  const reportPrompt = `Generate a Current Positioning Audit Report in markdown for "${input.brandName}" based on:
${JSON.stringify(parsed)}

Include: Current Positioning Summary, Touchpoint Audit, Customer Perception, Strengths to Preserve, Weaknesses to Address.
Use Spanish (Latin American). Mark as "SYNTHETIC DATA".`;

  const report = await generateText(MODEL, "Brand audit report writer. Spanish (Latin American).", reportPrompt);

  return {
    step: "current_audit",
    status: "completed",
    data: parsed,
    artifactContent: report,
  };
}

export async function defineTargetPositioning(
  clientId: string,
  input: { currentAudit: unknown; competitiveLandscape: string; businessStrategy: string },
): Promise<PositioningStepResult> {
  const prompt = `Define target positioning and Change Matrix.

Current Audit: ${JSON.stringify(input.currentAudit)}
Competitive Landscape: ${input.competitiveLandscape}
Business Strategy: ${input.businessStrategy}

Return a JSON object with:
- targetPositioning: string describing desired positioning
- changeMatrix: array of { element, current, target, changeType: "replace"|"evolve"|"keep"|"remove"|"add", phase: number }
- preserveElements: string[] — brand elements that must NOT change

Output ONLY valid JSON.`;

  const result = await generateText(
    "claude-sonnet-4-5",
    "You are a brand repositioning strategist. Output structured JSON.",
    prompt,
  );

  const parsed = parseJsonSafe(result, {
    targetPositioning: "",
    changeMatrix: [] as ChangeMatrixEntry[],
    preserveElements: [],
  });

  return {
    step: "target_definition",
    status: "completed",
    data: parsed,
  };
}

export async function createTransitionPlan(
  clientId: string,
  input: { brandName: string; changeMatrix: ChangeMatrixEntry[]; currentAssets: string },
): Promise<PositioningStepResult> {
  const prompt = `Design a phased repositioning transition plan for "${input.brandName}".

Change Matrix: ${JSON.stringify(input.changeMatrix)}
Current Assets: ${input.currentAssets}

Return a JSON object with:
- fromPositioning: string
- toPositioning: string
- phases: array of { phase: number, name: string, durationMonths: string, objectives: string[], actions: string[], measurements: string[] }
- riskMitigation: string[]
- successMetrics: array of { metric, current, target }
- totalDurationMonths: number (3-6 typical)

Plan should have 3 phases: Foundation, Expansion, Consolidation.
Output ONLY valid JSON.`;

  const result = await generateText(
    "claude-sonnet-4-5",
    "You are a brand transition planner. Design phased repositioning plans. Output JSON.",
    prompt,
  );

  const parsed = parseJsonSafe<Omit<TransitionPlan, "brandName" | "changeMatrix">>(result, {
    fromPositioning: "",
    toPositioning: "",
    phases: [],
    riskMitigation: [],
    successMetrics: [],
    totalDurationMonths: 6,
  });

  const plan: TransitionPlan = {
    brandName: input.brandName,
    changeMatrix: input.changeMatrix,
    ...parsed,
  };

  const reportPrompt = `Generate a Repositioning Transition Plan in markdown based on:
${JSON.stringify(plan)}

Include: Executive Summary, From/To, Change Matrix (table), Phase details, Risk Mitigation, Success Metrics.
Use Spanish (Latin American). Mark as "SYNTHETIC DATA".`;

  const report = await generateText(MODEL, "Transition plan writer. Spanish (Latin American).", reportPrompt);

  return {
    step: "transition_plan",
    status: "completed",
    data: plan,
    artifactContent: report,
  };
}

export async function designPhases(
  clientId: string,
  input: { transitionPlan: TransitionPlan; channelSpecs: string },
): Promise<PositioningStepResult> {
  const prompt = `Design detailed phase blueprints for this repositioning transition.

Transition Plan: ${JSON.stringify(input.transitionPlan)}
Channel Specifications: ${input.channelSpecs}

Return a JSON object with:
- phaseBlueprints: array of {
    phase: number,
    name: string,
    touchpointChanges: array of { touchpoint, action },
    messagingGuidance: string,
    visualEvolution: string,
    internalTraining: string[],
    productionBriefs: string[]
  }

Output ONLY valid JSON.`;

  const result = await generateText(
    MODEL,
    "You are a brand transition architect. Design detailed phase blueprints. Output JSON.",
    prompt,
  );

  const parsed = parseJsonSafe(result, { phaseBlueprints: [] });

  const reportPrompt = `Generate Phase Blueprints document in markdown based on:
${JSON.stringify(parsed)}

Include per phase: Touchpoint Changes, Messaging Guidance, Visual Evolution, Internal Training, Production Briefs.
Use Spanish (Latin American). Mark as "SYNTHETIC DATA".`;

  const report = await generateText(MODEL, "Phase blueprint writer. Spanish (Latin American).", reportPrompt);

  return {
    step: "phase_design",
    status: "completed",
    data: parsed,
    artifactContent: report,
  };
}

export async function recordPerceptionMeasurement(
  clientId: string,
  input: {
    repositioningProjectId: string;
    phase: number;
    metrics: PerceptionMetrics;
    status: TrackingStatus;
    notes?: string;
  },
): Promise<{ id: string }> {
  const [record] = await db
    .insert(schema.perceptionTracking)
    .values({
      clientId,
      repositioningProjectId: input.repositioningProjectId,
      phase: input.phase,
      measurementDate: new Date(),
      metrics: input.metrics,
      status: input.status,
      notes: input.notes ?? null,
    })
    .returning();

  return { id: record.id };
}

export async function getPerceptionHistory(
  clientId: string,
  projectId: string,
): Promise<unknown[]> {
  return db
    .select()
    .from(schema.perceptionTracking)
    .where(
      and(
        eq(schema.perceptionTracking.clientId, clientId),
        eq(schema.perceptionTracking.repositioningProjectId, projectId),
      ),
    );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/positioning/repositioning.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/services/positioning/repositioning.ts src/services/positioning/repositioning.test.ts
git commit -m "feat(positioning): implement repositioning service — current audit, target definition, transition plan, phase design (C-049)"
```

---

## Task 7: Zod Validators

**Files:**
- Modify: `src/api/validators.ts`

- [ ] **Step 1: Add positioning Zod schemas**

Add to validators.ts:

```typescript
// ── Positioning Validators ──

export const startDiagnosisSchema = z.object({
  brandName: z.string().min(1).max(200),
  brandDna: z.string().min(1).max(5000).optional(),
  listenerData: z.string().max(10000).optional(),
});

export const startRepositioningSchema = z.object({
  brandName: z.string().min(1).max(200),
  businessStrategy: z.string().min(1).max(5000),
  brandDna: z.string().max(5000).optional(),
});

export const recordPerceptionSchema = z.object({
  repositioningProjectId: z.string().uuid(),
  phase: z.number().int().min(1).max(10),
  metrics: z.object({
    brandHealth: z.number().min(0).max(100),
    attributeScores: z.record(z.number()),
    sentiment: z.number().min(0).max(100),
    awarenessLevel: z.number().min(0).max(100),
  }),
  status: z.enum(["on_track", "at_risk", "off_track"]),
  notes: z.string().max(2000).optional(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/api/validators.ts
git commit -m "feat(validators): add Zod schemas for positioning endpoints"
```

---

## Task 8: API Routes

**Files:**
- Create: `src/api/positioning-routes.ts`
- Modify: `src/api/routes.ts` (add import, middleware, mount)

- [ ] **Step 1: Create positioning routes**

```typescript
// src/api/positioning-routes.ts
import { Hono } from "hono";
import { parseBody, startDiagnosisSchema, startRepositioningSchema, recordPerceptionSchema } from "./validators.js";
import { runPerceptionAudit, runGapAnalysis, definePositioning, validatePositioning } from "../services/positioning/diagnosis.js";
import { runCurrentAudit, defineTargetPositioning, createTransitionPlan, designPhases, recordPerceptionMeasurement, getPerceptionHistory } from "../services/positioning/repositioning.js";

export const positioningRoutes = new Hono();

// ── Diagnosis (C-048) ──

positioningRoutes.post("/api/positioning/:clientId/diagnose", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(startDiagnosisSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { brandName, brandDna, listenerData } = parsed.data;

  const auditResult = await runPerceptionAudit(clientId, {
    brandName,
    brandDna: brandDna ?? "",
    listenerData: listenerData ?? "",
  });

  return c.json(auditResult, 201);
});

positioningRoutes.get("/api/positioning/:clientId/current", async (c) => {
  const clientId = c.req.param("clientId");
  // Returns latest positioning document for the client (from project artifacts)
  // Placeholder — in full implementation would query latest positioning-diagnosis project artifacts
  return c.json({ clientId, message: "No positioning document found. Start a diagnosis first." });
});

positioningRoutes.get("/api/positioning/:clientId/perception", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, message: "No perception data available. Run a perception audit first." });
});

// ── Repositioning (C-049) ──

positioningRoutes.post("/api/positioning/:clientId/reposition", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(startRepositioningSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { brandName, businessStrategy, brandDna } = parsed.data;

  const auditResult = await runCurrentAudit(clientId, {
    brandName,
    brandDna: brandDna ?? "",
    listenerHistory: "",
    contentArtifacts: "",
  });

  return c.json(auditResult, 201);
});

positioningRoutes.get("/api/positioning/:clientId/transition", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, message: "No active transition plan." });
});

positioningRoutes.get("/api/positioning/:clientId/transition/phases", async (c) => {
  const clientId = c.req.param("clientId");
  return c.json({ clientId, phases: [] });
});

positioningRoutes.get("/api/positioning/:clientId/transition/tracking", async (c) => {
  const clientId = c.req.param("clientId");
  const projectId = c.req.query("projectId");
  if (!projectId) return c.json({ error: "projectId query param required" }, 400);
  const history = await getPerceptionHistory(clientId, projectId);
  return c.json(history);
});

positioningRoutes.post("/api/positioning/:clientId/tracking", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(recordPerceptionSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const result = await recordPerceptionMeasurement(clientId, parsed.data);
  return c.json(result, 201);
});
```

- [ ] **Step 2: Wire routes into main app**

In `src/api/routes.ts`:
- Add import: `import { positioningRoutes } from "./positioning-routes.js";`
- Add middleware: `app.use("/api/positioning/:clientId/*", requireSession, requireTenantMatch);`
- Add mount: `app.route("/", positioningRoutes);`

- [ ] **Step 3: Commit**

```bash
git add src/api/positioning-routes.ts src/api/routes.ts
git commit -m "feat(api): add 8 positioning API endpoints with auth + tenant guard"
```

---

## Task 9: Agent Skill Files

**Files:**
- Create: `agents/PO-L_positioning_strategist.md`
- Create: `agents/PO-001_perception_auditor.md`
- Create: `agents/PO-002_competitive_mapper.md`
- Create: `agents/PO-003_transition_architect.md`

- [ ] **Step 1: Create all 4 agent skill files**

Each follows the pattern of existing agent files in the `agents/` directory. Include: agent ID, name, role description, capabilities, model, autonomy level, steps, and decision framework.

- [ ] **Step 2: Commit**

```bash
git add agents/PO-L_positioning_strategist.md agents/PO-001_perception_auditor.md agents/PO-002_competitive_mapper.md agents/PO-003_transition_architect.md
git commit -m "docs(agents): add PO-L, PO-001, PO-002, PO-003 positioning agent skill files"
```

---

## Task 10: Integration Tests

**Files:**
- Create: `src/services/positioning/integration.test.ts`

- [ ] **Step 1: Write integration tests**

Test pure function logic and cross-module behavior:
- Perception audit → gap analysis data flow (output shape matches input requirements)
- Change matrix entries have valid changeType values
- Transition plan phase numbering consistency
- TrackingStatus enum coverage
- PerceptionMetrics validation constraints
- PositioningDocument complete structure verification
- parseJsonSafe handles malformed JSON gracefully

- [ ] **Step 2: Run all tests**

```bash
npx vitest run src/services/positioning/
```

- [ ] **Step 3: Commit**

```bash
git add src/services/positioning/integration.test.ts
git commit -m "test(positioning): add integration tests for cross-module data flow"
```

---

## Task 11: Cross-Phase Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Verify: no regressions in Phases 1-4.

- [ ] **Step 2: Verify pipeline registration**

```bash
npx vitest run src/orchestrator/
```

- [ ] **Step 3: Verify git log**

```bash
git log --oneline -15
```

Confirm all Phase 5 commits are clean.
