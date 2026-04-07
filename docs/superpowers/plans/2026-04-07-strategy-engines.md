# Strategy Engines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Brand Builder and Strategist motors with Pipeline Registry, enabling capabilities C-001 through C-006 (Strategy + Brand).

**Architecture:** Extend the existing video-production orchestrator with a PipelineRegistry that allows registering N pipeline types. Each pipeline defines its own steps, agents, gates, and context maps. The existing state machine, dispatcher, and gate router read from the registry instead of hardcoded constants. Brand Builder (5 agents, 5 steps, 3 gates) and Strategist (4 agents, 6 steps, 3 gates) register as new pipelines alongside video-production. 8 stub agents (4 Listeners + 4 Transversals) provide baseline context using LLM general knowledge.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Gemini/Anthropic providers

**Spec:** `docs/superpowers/specs/2026-04-07-strategy-engines-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/orchestrator/pipeline-registry.ts` | Pipeline type definitions + registry with video-production, brand-builder, strategist |
| `src/db/migrations/XXXX_add_pipeline_fields.sql` | Migration adding `pipelineType` and `parentProjectId` to projects |
| `agents/BB-L_brand_architect.md` | Brand Architect agent skill file |
| `agents/BB-001_workshop_facilitator.md` | Workshop Facilitator agent skill file |
| `agents/BB-002_sociologist.md` | Sociologist agent skill file |
| `agents/BB-003_verbal_identity_designer.md` | Verbal Identity Designer agent skill file |
| `agents/BB-004_visual_identity_advisor.md` | Visual Identity Advisor agent skill file |
| `agents/ST-L_chief_strategist.md` | Chief Strategist agent skill file |
| `agents/ST-001_audience_analyst.md` | Audience Analyst agent skill file |
| `agents/ST-002_media_planner.md` | Media Planner agent skill file |
| `agents/ST-003_budget_allocator.md` | Budget Allocator agent skill file |
| `agents/LI-001_brand_listener.md` | Brand Listener stub skill file |
| `agents/LI-002_culture_listener.md` | Culture Listener stub skill file |
| `agents/LI-003_industry_listener.md` | Industry Listener stub skill file |
| `agents/LI-004_competitive_listener.md` | Competitive Listener stub skill file |
| `agents/XA-001_financial_agent.md` | Financial Agent stub skill file |
| `agents/XA-002_channel_manager.md` | Channel Manager stub skill file |
| `agents/XA-003_brand_guardian.md` | Brand Guardian stub skill file |
| `agents/XA-004_media_scout.md` | Media Scout stub skill file |
| `agents/_shared/harvard-frameworks.md` | Harvard M1-M6 marketing strategy knowledge base |
| `agents/_shared/channel-specs.json` | Channel specifications data for 6 main channels |

### Modified files

| File | What changes |
|------|-------------|
| `src/shared/types.ts` | Add pipeline-agnostic types, keep video types for backwards compat |
| `src/orchestrator/state-machine.ts` | Use PipelineRegistry instead of PIPELINE_FLOW/STEP_GATE_MAP |
| `src/orchestrator/dispatcher.ts` | Use PipelineRegistry instead of STEP_AGENTS |
| `src/orchestrator/gate-router.ts` | Use PipelineRegistry instead of GATE_MAX_ITERATIONS/GATE_AGENTS/GATE_FAIL_RETURN |
| `src/agents/registry.ts` | Add 17 new agent entries |
| `src/agents/model-defaults.ts` | Add model assignments for 17 new agents |
| `src/agents/context-map.ts` | Add context entries for brand-builder and strategist steps |
| `src/agents/context-builder.ts` | Load Harvard frameworks selectively, support parentProjectId for cross-pipeline artifacts |
| `src/db/schema.ts` | Add `pipelineType` and `parentProjectId` columns to projects table |
| `src/api/routes.ts` | Accept `pipelineType` and `parentProjectId` in POST /projects |
| `src/api/validators.ts` | Extend createProjectSchema with new fields |
| `web/lib/agent-registry.ts` | Add 17 new agents + new team names for frontend canvas |

---

## Task 1: Pipeline Registry

**Files:**
- Create: `src/orchestrator/pipeline-registry.ts`

- [ ] **Step 1: Create the pipeline registry with video-production pipeline**

```typescript
// src/orchestrator/pipeline-registry.ts

export interface GateConfig {
  afterStep: string;
  evaluators: string[];
  maxIterations: number;
  failReturnTo: string;
}

export interface PipelineDefinition {
  type: string;
  steps: string[];
  stepAgents: Record<string, string[]>;
  gates: Record<string, GateConfig>;
}

const registry = new Map<string, PipelineDefinition>();

export const PipelineRegistry = {
  register(pipeline: PipelineDefinition): void {
    registry.set(pipeline.type, pipeline);
  },

  get(type: string): PipelineDefinition {
    const pipeline = registry.get(type);
    if (!pipeline) {
      throw new Error(`Unknown pipeline type: ${type}`);
    }
    return pipeline;
  },

  getSteps(type: string): string[] {
    return this.get(type).steps;
  },

  getAgentsForStep(type: string, step: string): string[] {
    return this.get(type).stepAgents[step] ?? [];
  },

  getGateAfterStep(type: string, step: string): string | undefined {
    const pipeline = this.get(type);
    for (const [gateName, config] of Object.entries(pipeline.gates)) {
      if (config.afterStep === step) return gateName;
    }
    return undefined;
  },

  getGateConfig(type: string, gate: string): GateConfig {
    const config = this.get(type).gates[gate];
    if (!config) {
      throw new Error(`Unknown gate ${gate} in pipeline ${type}`);
    }
    return config;
  },

  getNextStep(type: string, currentStep: string): string | null {
    const steps = this.getSteps(type);
    const idx = steps.indexOf(currentStep);
    if (idx === -1 || idx >= steps.length - 1) return null;
    return steps[idx + 1];
  },

  has(type: string): boolean {
    return registry.has(type);
  },
};

// ── Video Production Pipeline (extracted from current hardcoded values) ──

PipelineRegistry.register({
  type: "video-production",
  steps: [
    "brief", "concept", "script", "visual_look", "storyboard",
    "video_gen", "edit", "audio", "polish", "delivered",
  ],
  stepAgents: {
    brief: ["T7-L", "T1-L"],
    concept: ["T1-L"],
    script: ["T2-L", "T2-002", "T2-006"],
    visual_look: ["T3-L", "TL-003"],
    storyboard: ["T3-L", "T3-003"],
    video_gen: ["T3-003"],
    edit: ["T6-L"],
    audio: ["T5-L"],
    polish: ["T6-L"],
    delivery: ["T6-003", "T7-L"],
  },
  gates: {
    g1: { afterStep: "concept", evaluators: ["TL-002"], maxIterations: 3, failReturnTo: "concept" },
    g2: { afterStep: "script", evaluators: ["TL-002", "T1-L"], maxIterations: 3, failReturnTo: "script" },
    g3: { afterStep: "storyboard", evaluators: ["TL-002"], maxIterations: 2, failReturnTo: "storyboard" },
    g4: { afterStep: "audio", evaluators: ["TL-002", "XF-001"], maxIterations: 2, failReturnTo: "edit" },
    g5: { afterStep: "polish", evaluators: ["TL-002", "XF-001"], maxIterations: 1, failReturnTo: "polish" },
  },
});

// ── Brand Builder Pipeline ──

PipelineRegistry.register({
  type: "brand-builder",
  steps: ["discovery", "research", "positioning", "identity", "brand_dna"],
  stepAgents: {
    discovery: ["BB-L", "BB-001"],
    research: ["BB-002", "LI-002", "LI-004"],
    positioning: ["BB-L"],
    identity: ["BB-003", "BB-004"],
    brand_dna: ["BB-L"],
  },
  gates: {
    "bb-g1": { afterStep: "research", evaluators: ["BB-L"], maxIterations: 3, failReturnTo: "research" },
    "bb-g2": { afterStep: "identity", evaluators: ["BB-L", "XA-003"], maxIterations: 3, failReturnTo: "identity" },
    "bb-g3": { afterStep: "brand_dna", evaluators: ["human"], maxIterations: 1, failReturnTo: "brand_dna" },
  },
});

// ── Strategist Pipeline ──

PipelineRegistry.register({
  type: "strategist",
  steps: ["diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs"],
  stepAgents: {
    diagnostic: ["ST-L", "LI-001", "LI-002", "LI-003", "LI-004"],
    objectives: ["ST-L"],
    audiences: ["ST-001", "LI-002"],
    value_prop: ["ST-L", "LI-004"],
    media_plan: ["ST-002", "XA-002", "XA-004"],
    budget: ["ST-003", "XA-001"],
    briefs: ["ST-L"],
  },
  gates: {
    "st-g1": { afterStep: "objectives", evaluators: ["ST-L", "XA-001"], maxIterations: 3, failReturnTo: "objectives" },
    "st-g2": { afterStep: "value_prop", evaluators: ["ST-L", "XA-003"], maxIterations: 3, failReturnTo: "value_prop" },
    "st-g3": { afterStep: "budget", evaluators: ["human"], maxIterations: 1, failReturnTo: "budget" },
  },
});
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/orchestrator/pipeline-registry.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator/pipeline-registry.ts
git commit -m "feat: add PipelineRegistry with video, brand-builder, and strategist pipelines"
```

---

## Task 2: Database migration for pipeline fields

**Files:**
- Modify: `src/db/schema.ts:204-220`
- Create: DB migration via drizzle-kit

- [ ] **Step 1: Add `pipelineType` and `parentProjectId` to projects table in schema**

In `src/db/schema.ts`, modify the `projects` table definition (lines 204-220):

```typescript
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: projectTypeEnum("type").notNull(),
  pipelineType: varchar("pipeline_type", { length: 50 }).default("video-production").notNull(),
  parentProjectId: uuid("parent_project_id").references(() => projects.id),
  status: projectStatusEnum("status").default("brief").notNull(),
  currentGate: varchar("current_gate", { length: 20 }),
  deliveryStatus: deliveryStatusEnum("delivery_status").default("draft").notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("projects_client_id_idx").on(table.clientId),
]);
```

Key changes:
- Added `pipelineType` as varchar (not enum — more flexible for new pipelines) with default `"video-production"`
- Added `parentProjectId` as nullable self-referencing FK (for Brand DNA → Strategist link)
- Changed `currentGate` from `gateTypeEnum` to `varchar(20)` — gate names are now pipeline-specific (e.g., `bb-g1`, `st-g2`), not a fixed enum
- Changed `status` to remain as `projectStatusEnum` for now — we'll handle new step names via the pipelineType + registry

Note: The `projectStatusEnum` currently only has video pipeline statuses. For brand-builder and strategist steps, we need to also update this enum. Add the new step values to the existing `projectStatusEnum`:

In `src/db/schema.ts`, update the `projectStatusEnum` (lines 26-38):

```typescript
export const projectStatusEnum = pgEnum("project_status", [
  // Video production
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish",
  // Brand builder
  "discovery", "research", "positioning", "identity", "brand_dna",
  // Strategist
  "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
  // Shared
  "delivered", "paused",
]);
```

Also update `artifactStepEnum` (lines 50-63) to include the new steps:

```typescript
export const artifactStepEnum = pgEnum("artifact_step", [
  // Video production
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish", "delivery",
  // Brand builder
  "discovery", "research", "positioning", "identity", "brand_dna",
  // Strategist
  "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
  // Shared
  "model_config", "gate_review",
]);
```

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate`
Expected: A new migration file is created in `src/db/migrations/`

- [ ] **Step 3: Run the migration**

Run: `npx drizzle-kit push`
Expected: Migration applied successfully

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add pipelineType, parentProjectId to projects schema + new step enums"
```

---

## Task 3: Refactor state machine to use PipelineRegistry

**Files:**
- Modify: `src/orchestrator/state-machine.ts`
- Modify: `src/shared/types.ts`

- [ ] **Step 1: Update types.ts — keep video constants for backwards compat, add pipeline-generic types**

In `src/shared/types.ts`, add new union type for all project statuses and update the existing constants to note they're video-specific. Add at the end of the file after line 156:

```typescript
// ── Pipeline-generic types ──

/** All possible step names across all pipelines */
export type PipelineStep = string;

/** All possible gate names across all pipelines */
export type PipelineGate = string;
```

No changes to the existing constants — they remain as-is for backwards compatibility. The PipelineRegistry is the source of truth for new pipelines.

- [ ] **Step 2: Refactor state-machine.ts to use PipelineRegistry**

Replace the entire content of `src/orchestrator/state-machine.ts`:

```typescript
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { PipelineRegistry } from "./pipeline-registry.js";
import { dispatchAgentsForStep } from "./dispatcher.js";
import { evaluateGate } from "./gate-router.js";
import { logger } from "../shared/logger.js";

export interface AdvanceResult {
  previousStatus: string;
  newStatus: string;
  gateEvaluated?: string;
  gateDecision?: "pass" | "fail";
  gateIteration?: number;
  maxIterationsReached?: boolean;
  escalated?: boolean;
  completed: boolean;
}

export async function advanceProject(
  projectId: string
): Promise<AdvanceResult> {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const pipelineType = project.pipelineType ?? "video-production";
  const pipeline = PipelineRegistry.get(pipelineType);
  const currentStatus = project.status as string;

  if (currentStatus === "delivered") {
    return { previousStatus: "delivered", newStatus: "delivered", completed: true };
  }

  if (currentStatus === "paused") {
    throw new Error(`Project ${projectId} is paused. Resume before advancing.`);
  }

  logger.info("pipeline.advancing", { projectId, pipelineType, from: currentStatus });

  // 1. Dispatch agents for current step
  await dispatchAgentsForStep(projectId, currentStatus, pipelineType);

  // 2. Check if a gate follows this step
  const gateName = PipelineRegistry.getGateAfterStep(pipelineType, currentStatus);

  if (gateName) {
    const gateConfig = PipelineRegistry.getGateConfig(pipelineType, gateName);
    const gateResult = await evaluateGate(projectId, gateName, gateConfig);

    if (gateResult.decision === "fail") {
      if (gateResult.maxIterationsReached) {
        await db
          .update(schema.projects)
          .set({ status: "paused" as any, currentGate: gateName, updatedAt: new Date() })
          .where(eq(schema.projects.id, projectId));

        logger.error("pipeline.max_iterations", { projectId, gate: gateName, iteration: gateResult.iteration });

        return {
          previousStatus: currentStatus,
          newStatus: "paused",
          gateEvaluated: gateName,
          gateDecision: "fail",
          gateIteration: gateResult.iteration,
          maxIterationsReached: true,
          escalated: true,
          completed: false,
        };
      }

      logger.info("pipeline.gate_fail_retry", { projectId, gate: gateName, iteration: gateResult.iteration });

      return {
        previousStatus: currentStatus,
        newStatus: currentStatus,
        gateEvaluated: gateName,
        gateDecision: "fail",
        gateIteration: gateResult.iteration,
        maxIterationsReached: false,
        completed: false,
      };
    }

    logger.info("pipeline.gate_pass", { projectId, gate: gateName });
  }

  // 3. Advance to next step
  const nextStep = PipelineRegistry.getNextStep(pipelineType, currentStatus);

  if (!nextStep) {
    // Last step in pipeline — mark as delivered
    await db
      .update(schema.projects)
      .set({ status: "delivered" as any, currentGate: null, updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));

    logger.info("pipeline.delivered", { projectId });

    return {
      previousStatus: currentStatus,
      newStatus: "delivered",
      gateEvaluated: gateName,
      gateDecision: gateName ? "pass" : undefined,
      completed: true,
    };
  }

  await db
    .update(schema.projects)
    .set({ status: nextStep as any, currentGate: null, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));

  return {
    previousStatus: currentStatus,
    newStatus: nextStep,
    gateEvaluated: gateName,
    gateDecision: gateName ? "pass" : undefined,
    completed: false,
  };
}

export async function runFullPipeline(
  projectId: string
): Promise<AdvanceResult[]> {
  const results: AdvanceResult[] = [];

  while (true) {
    const result = await advanceProject(projectId);
    results.push(result);

    if (result.completed) break;
    if (result.newStatus === "paused") break;
    if (result.gateDecision === "fail") break;
  }

  return results;
}

export async function pauseProject(projectId: string): Promise<void> {
  await db
    .update(schema.projects)
    .set({ status: "paused" as any, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  logger.info("pipeline.paused", { projectId });
}

export async function resumeProject(
  projectId: string,
  resumeToStatus: string
): Promise<void> {
  await db
    .update(schema.projects)
    .set({ status: resumeToStatus as any, currentGate: null, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  logger.info("pipeline.resumed", { projectId, resumeTo: resumeToStatus });
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/orchestrator/state-machine.ts src/shared/types.ts
git commit -m "refactor: state machine reads from PipelineRegistry instead of hardcoded constants"
```

---

## Task 4: Refactor dispatcher to use PipelineRegistry

**Files:**
- Modify: `src/orchestrator/dispatcher.ts`

- [ ] **Step 1: Update dispatcher to accept pipelineType**

Replace the entire content of `src/orchestrator/dispatcher.ts`:

```typescript
import { executeAgent } from "../agents/runtime.js";
import type { AgentResult } from "../agents/mock.js";
import { PipelineRegistry } from "./pipeline-registry.js";
import { logger } from "../shared/logger.js";

export async function dispatchAgentsForStep(
  projectId: string,
  step: string,
  pipelineType: string = "video-production"
): Promise<AgentResult[]> {
  const agentIds = PipelineRegistry.getAgentsForStep(pipelineType, step);

  if (agentIds.length === 0) {
    logger.warn("dispatcher.no_agents", { projectId, step, pipelineType });
    return [];
  }

  logger.info("dispatcher.step_start", {
    projectId,
    step,
    pipelineType,
    agents: agentIds,
  });

  const results: AgentResult[] = [];

  for (const agentId of agentIds) {
    const result = await executeAgent(agentId, projectId, step);
    results.push(result);
  }

  logger.info("dispatcher.step_complete", {
    projectId,
    step,
    totalArtifacts: results.reduce((sum, r) => sum + r.artifactIds.length, 0),
  });

  return results;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator/dispatcher.ts
git commit -m "refactor: dispatcher uses PipelineRegistry for agent lookup"
```

---

## Task 5: Refactor gate router to use PipelineRegistry

**Files:**
- Modify: `src/orchestrator/gate-router.ts`

- [ ] **Step 1: Update gate router to accept GateConfig**

Replace the entire content of `src/orchestrator/gate-router.ts`:

```typescript
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import type { GateConfig } from "./pipeline-registry.js";
import { config } from "../shared/config.js";
import { logger } from "../shared/logger.js";

export interface GateResult {
  gate: string;
  decision: "pass" | "fail";
  iteration: number;
  scores: Record<string, number>;
  notes: string;
  maxIterationsReached: boolean;
  returnToStep?: string;
}

export async function evaluateGate(
  projectId: string,
  gate: string,
  gateConfig: GateConfig
): Promise<GateResult> {
  // Count previous iterations for this gate
  const previousReviews = await db
    .select()
    .from(schema.gateReviews)
    .where(
      and(
        eq(schema.gateReviews.projectId, projectId),
        eq(schema.gateReviews.gate, gate as any)
      )
    );

  const iteration = previousReviews.length + 1;
  const maxIterations = gateConfig.maxIterations;

  // Mock decision: pass based on configurable rate, higher chance on subsequent attempts
  const adjustedPassRate = Math.min(
    config.gatePassRate + (iteration - 1) * 0.1,
    0.95
  );
  const decision: "pass" | "fail" =
    Math.random() < adjustedPassRate ? "pass" : "fail";

  // Mock scores
  const scores: Record<string, number> = {};
  for (const agentId of gateConfig.evaluators) {
    scores[agentId] = decision === "pass"
      ? 7 + Math.random() * 3
      : 4 + Math.random() * 3;
  }

  const notes = decision === "pass"
    ? `[MOCK] Gate ${gate.toUpperCase()} passed on iteration ${iteration}. All criteria met.`
    : `[MOCK] Gate ${gate.toUpperCase()} failed on iteration ${iteration}. Returning to ${gateConfig.failReturnTo} for revision.`;

  // Record gate review
  await db.insert(schema.gateReviews).values({
    projectId,
    gate: gate as any,
    iteration,
    decision,
    reviewer: gateConfig.evaluators[0] ?? "unknown",
    scores,
    notes,
  });

  const maxIterationsReached = decision === "fail" && iteration >= maxIterations;

  logger.info("gate.evaluated", {
    projectId,
    gate,
    decision,
    iteration,
    maxIterations,
    maxIterationsReached,
    scores,
  });

  return {
    gate,
    decision,
    iteration,
    scores,
    notes,
    maxIterationsReached,
    returnToStep: decision === "fail" ? gateConfig.failReturnTo : undefined,
  };
}
```

Note: The `gateReviews` table's `gate` column uses `gateTypeEnum` which only has `g1`-`g5`. For the new pipeline gates (`bb-g1`, `st-g1`, etc.), we need to update this enum. In the schema migration (Task 2), also change `gate` in `gateReviews` from `gateTypeEnum` to `varchar(20)` — same approach as `currentGate` on projects.

- [ ] **Step 2: Update gateReviews table in schema — change gate column to varchar**

In `src/db/schema.ts`, find the `gateReviews` table and change the `gate` column from `gateTypeEnum("gate")` to `varchar("gate", { length: 20 })`. This is needed because new pipelines use gate names like `bb-g1`, `st-g2` that aren't in the original enum.

- [ ] **Step 3: Regenerate migration if schema changed**

Run: `npx drizzle-kit generate && npx drizzle-kit push`
Expected: Migration applied

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/orchestrator/gate-router.ts src/db/schema.ts src/db/migrations/
git commit -m "refactor: gate router uses GateConfig from PipelineRegistry"
```

---

## Task 6: Register 17 new agents in backend registry + model defaults

**Files:**
- Modify: `src/agents/registry.ts:203` (append after last entry)
- Modify: `src/agents/model-defaults.ts:33` (append after last entry)

- [ ] **Step 1: Add all 17 agents to AGENT_REGISTRY**

Append to `AGENT_REGISTRY` in `src/agents/registry.ts` before the closing `};`:

```typescript
  // ── Brand Builder Motor ──
  "BB-L": {
    id: "BB-L",
    name: "Brand Architect",
    skillFile: "agents/BB-L_brand_architect.md",
    team: 10,
    level: "leader",
    steps: ["discovery", "positioning", "brand_dna"],
    gates: ["bb-g1", "bb-g2"],
    autonomy: 75,
  },
  "BB-001": {
    id: "BB-001",
    name: "Workshop Facilitator",
    skillFile: "agents/BB-001_workshop_facilitator.md",
    team: 10,
    level: "sub",
    steps: ["discovery"],
    gates: [],
    autonomy: 80,
  },
  "BB-002": {
    id: "BB-002",
    name: "Sociologist",
    skillFile: "agents/BB-002_sociologist.md",
    team: 10,
    level: "sub",
    steps: ["research"],
    gates: [],
    autonomy: 85,
  },
  "BB-003": {
    id: "BB-003",
    name: "Verbal Identity Designer",
    skillFile: "agents/BB-003_verbal_identity_designer.md",
    team: 10,
    level: "sub",
    steps: ["identity"],
    gates: [],
    autonomy: 70,
  },
  "BB-004": {
    id: "BB-004",
    name: "Visual Identity Advisor",
    skillFile: "agents/BB-004_visual_identity_advisor.md",
    team: 10,
    level: "sub",
    steps: ["identity"],
    gates: [],
    autonomy: 70,
  },

  // ── Strategist Motor ──
  "ST-L": {
    id: "ST-L",
    name: "Chief Strategist",
    skillFile: "agents/ST-L_chief_strategist.md",
    team: 11,
    level: "leader",
    steps: ["diagnostic", "objectives", "value_prop", "briefs"],
    gates: ["st-g1", "st-g2"],
    autonomy: 75,
  },
  "ST-001": {
    id: "ST-001",
    name: "Audience Analyst",
    skillFile: "agents/ST-001_audience_analyst.md",
    team: 11,
    level: "sub",
    steps: ["audiences"],
    gates: [],
    autonomy: 80,
  },
  "ST-002": {
    id: "ST-002",
    name: "Media Planner",
    skillFile: "agents/ST-002_media_planner.md",
    team: 11,
    level: "sub",
    steps: ["media_plan"],
    gates: [],
    autonomy: 75,
  },
  "ST-003": {
    id: "ST-003",
    name: "Budget Allocator",
    skillFile: "agents/ST-003_budget_allocator.md",
    team: 11,
    level: "sub",
    steps: ["budget"],
    gates: [],
    autonomy: 80,
  },

  // ── Listener Stubs ──
  "LI-001": {
    id: "LI-001",
    name: "Brand Listener",
    skillFile: "agents/LI-001_brand_listener.md",
    team: 12,
    level: "sub",
    steps: ["diagnostic"],
    gates: [],
    autonomy: 90,
  },
  "LI-002": {
    id: "LI-002",
    name: "Culture Listener",
    skillFile: "agents/LI-002_culture_listener.md",
    team: 12,
    level: "sub",
    steps: ["research", "diagnostic", "audiences"],
    gates: [],
    autonomy: 90,
  },
  "LI-003": {
    id: "LI-003",
    name: "Industry Listener",
    skillFile: "agents/LI-003_industry_listener.md",
    team: 12,
    level: "sub",
    steps: ["diagnostic"],
    gates: [],
    autonomy: 90,
  },
  "LI-004": {
    id: "LI-004",
    name: "Competitive Listener",
    skillFile: "agents/LI-004_competitive_listener.md",
    team: 12,
    level: "sub",
    steps: ["research", "diagnostic", "value_prop"],
    gates: [],
    autonomy: 90,
  },

  // ── Transversal Stubs ──
  "XA-001": {
    id: "XA-001",
    name: "Financial Agent",
    skillFile: "agents/XA-001_financial_agent.md",
    team: 13,
    level: "cross_functional",
    steps: ["budget"],
    gates: ["st-g1"],
    autonomy: 85,
  },
  "XA-002": {
    id: "XA-002",
    name: "Channel Manager",
    skillFile: "agents/XA-002_channel_manager.md",
    team: 13,
    level: "cross_functional",
    steps: ["media_plan"],
    gates: [],
    autonomy: 85,
  },
  "XA-003": {
    id: "XA-003",
    name: "Brand Guardian",
    skillFile: "agents/XA-003_brand_guardian.md",
    team: 13,
    level: "cross_functional",
    steps: [],
    gates: ["bb-g2", "st-g2"],
    autonomy: 80,
  },
  "XA-004": {
    id: "XA-004",
    name: "Media Scout",
    skillFile: "agents/XA-004_media_scout.md",
    team: 13,
    level: "cross_functional",
    steps: ["media_plan"],
    gates: [],
    autonomy: 85,
  },
```

- [ ] **Step 2: Add model defaults for 17 new agents**

Append to `MODEL_DEFAULTS` in `src/agents/model-defaults.ts` before the closing `};`:

```typescript
  // Brand Builder
  "BB-L": "claude-sonnet-4",
  "BB-001": "gemini-2.5-flash",
  "BB-002": "gemini-2.5-flash",
  "BB-003": "claude-sonnet-4",
  "BB-004": "gemini-2.5-flash",

  // Strategist
  "ST-L": "claude-sonnet-4",
  "ST-001": "gemini-2.5-flash",
  "ST-002": "claude-sonnet-4",
  "ST-003": "gemini-2.5-flash",

  // Listeners (stubs — use cheapest)
  "LI-001": "gemini-2.5-flash",
  "LI-002": "gemini-2.5-flash",
  "LI-003": "gemini-2.5-flash",
  "LI-004": "gemini-2.5-flash",

  // Transversals (stubs — use cheapest)
  "XA-001": "gemini-2.5-flash",
  "XA-002": "gemini-2.5-flash",
  "XA-003": "gemini-2.5-flash",
  "XA-004": "gemini-2.5-flash",
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/agents/registry.ts src/agents/model-defaults.ts
git commit -m "feat: register 17 new agents (brand-builder, strategist, listeners, transversals)"
```

---

## Task 7: Add context maps for new pipelines

**Files:**
- Modify: `src/agents/context-map.ts` (append entries)

- [ ] **Step 1: Add Brand Builder context map entries**

Append to `AGENT_CONTEXT_MAP` in `src/agents/context-map.ts`:

```typescript
  // ── Brand Builder Pipeline ──

  "BB-L:discovery": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "You are leading a brand discovery workshop. Synthesize the client's brief and produce a structured workshop document covering: mission, vision, values, history, product/service, differentiators, and aspirations. Ask probing questions and propose initial brand directions.",
  },
  "BB-001:discovery": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "Facilitate the brand discovery workshop. Guide the client through structured questions about their business: Who are you? What do you do? Who do you serve? What makes you different? What do you aspire to become? Produce workshop responses in JSON format with clear sections.",
  },
  "BB-002:research": {
    artifactSteps: ["discovery"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Analyze the workshop responses and produce an audience research report. Include behavioral, psychographic, and cultural analysis of the target audiences. Cross-reference with the cultural and competitive context provided. Output as structured markdown with clear audience segments.",
  },
  "LI-002:research": {
    artifactSteps: ["discovery"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a cultural trends analysis relevant to this brand's industry and target audience. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Include 3-5 relevant cultural trends.",
  },
  "LI-004:research": {
    artifactSteps: ["discovery"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a competitive landscape analysis for this brand. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Map the likely competitive set and identify differentiation opportunities.",
  },
  "BB-L:positioning": {
    artifactSteps: ["discovery", "research"],
    attachmentTypes: [],
    taskInstruction:
      "Using the 3Cs framework (Company, Customers, Competitors), define the brand positioning. Produce: target audience definition, value proposition, competitive set, positioning statement, tone of voice, and brand personality. Reference the workshop and research artifacts.",
  },
  "BB-003:identity": {
    artifactSteps: ["discovery", "research", "positioning"],
    attachmentTypes: [],
    taskInstruction:
      "Design the verbal identity system for this brand. Define: tone of voice (with examples), vocabulary (words to use and avoid), key phrases, communication do's and don'ts. Ensure everything aligns with the positioning statement.",
  },
  "BB-004:identity": {
    artifactSteps: ["discovery", "research", "positioning"],
    attachmentTypes: [],
    taskInstruction:
      "Define the visual identity direction for this brand. Specify: color palette with hex codes and rationale, typography direction, imagery style, logo direction (concept, not design), and visual do's and don'ts. Do NOT generate actual designs — define direction only.",
  },
  "BB-L:brand_dna": {
    artifactSteps: ["discovery", "research", "positioning", "identity"],
    attachmentTypes: [],
    taskInstruction:
      "Consolidate all brand artifacts into the final Brand DNA Document. This is the single source of truth for the brand. Structure: 1) Mission/Vision/Values, 2) Target Audiences, 3) Positioning Statement + 3Cs, 4) Brand Personality, 5) Verbal Identity, 6) Visual Direction, 7) Content Guidelines. Output as a comprehensive markdown document.",
  },
```

- [ ] **Step 2: Add Strategist context map entries**

Continue appending to `AGENT_CONTEXT_MAP`:

```typescript
  // ── Strategist Pipeline ──

  "ST-L:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Produce a Marketing Diagnostic Report for this client. Use the Brand DNA Document as context. Apply Harvard M1 (value chain, DTC model) and M2 (marketing plan framework) to assess current position. Include SWOT analysis, channel presence assessment, and the top 3 most urgent actions. Reference listener data for market context.",
  },
  "LI-001:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a brand health assessment for this client. Use your general knowledge — you do not have access to real-time mention data yet. Mark your output as 'baseline analysis — no live data'. Provide a neutral brand health score and identify likely perception areas.",
  },
  "LI-002:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a cultural trends report relevant to this client's industry and audiences. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Include 3-5 cultural trends relevant to their marketing.",
  },
  "LI-003:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate an industry intelligence overview for this client's sector. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Cover market size, key trends, innovation signals, and challenges.",
  },
  "LI-004:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a competitive analysis for this client. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Identify likely competitors, their strengths/weaknesses, and gaps this client can exploit.",
  },
  "ST-L:objectives": {
    artifactSteps: ["brand_dna", "diagnostic"],
    attachmentTypes: [],
    taskInstruction:
      "Define measurable SMART marketing objectives aligned to funnel stages (Awareness, Consideration, Conversion, Retention). Apply Harvard M2 goals framework. Each objective must have: specific metric, target value, timeframe, and funnel stage. Output as a structured Objectives Document.",
  },
  "ST-001:audiences": {
    artifactSteps: ["brand_dna", "diagnostic", "objectives"],
    attachmentTypes: [],
    taskInstruction:
      "Create 2-3 detailed buyer personas using Harvard M2 segmentation framework. Each persona should include: demographics, behaviors, motivations, pain points, preferred channels, and content preferences. Cross-reference with the Brand DNA audiences and cultural context. Output as structured markdown.",
  },
  "LI-002:audiences": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Provide cultural context relevant to the audience segments being defined. What cultural trends, values, and behaviors are shaping these audiences? Use your general knowledge. Mark as 'baseline — no live data'.",
  },
  "ST-L:value_prop": {
    artifactSteps: ["brand_dna", "diagnostic", "objectives", "audiences"],
    attachmentTypes: [],
    taskInstruction:
      "Define the marketing positioning using the 3Cs framework (Company, Customers, Competitors). Produce: positioning statement (target + value + competitive set + reasons to believe), competitive differentiation matrix, and messaging hierarchy. Apply Harvard M2 value proposition framework. Reference competitive listener data for market context.",
  },
  "LI-004:value_prop": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Provide competitive context for the positioning exercise. What are the likely competitors doing in terms of messaging and positioning? Use your general knowledge. Mark as 'baseline — no live data'.",
  },
  "ST-002:media_plan": {
    artifactSteps: ["brand_dna", "objectives", "audiences", "value_prop"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Create a Media Plan using the Funnel Matrix (Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned). For each objective × audience combination, recommend specific channels with justification. Apply Harvard M3 (paid media) and M4 (owned/earned media) frameworks. Reference Channel Manager specs for channel capabilities and Media Scout for opportunities. Output as structured markdown with channel-by-channel breakdown.",
  },
  "XA-002:media_plan": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "Provide channel specifications for the media planning process. Load the channel specs data and present the capabilities, formats, minimum budgets, audience types, and KPIs for each available channel (Meta, Google Ads, TikTok, LinkedIn, Email, SEO). Output as structured reference document.",
  },
  "XA-004:media_plan": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Identify media opportunities for this brand. Based on the industry and target audiences, suggest non-obvious media placements, partnerships, or channel strategies. Use your general knowledge. Mark as 'baseline — no live data'.",
  },
  "ST-003:budget": {
    artifactSteps: ["objectives", "media_plan"],
    attachmentTypes: [],
    taskInstruction:
      "Create a Budget Allocation plan distributing budget by channel × funnel stage. Apply Harvard M6 formulas: set CAC targets by channel, project expected ROAS, estimate LTV impact. Include: budget per channel (% and amount), expected metrics per channel, alert thresholds for overspend. Output as markdown with a summary table plus a JSON budget breakdown.",
  },
  "XA-001:budget": {
    artifactSteps: ["objectives", "media_plan"],
    attachmentTypes: [],
    taskInstruction:
      "Validate the budget allocation. Check: total budget > 0, distribution is reasonable (no single channel > 60%), minimum viable amounts per channel are met. Provide pass/fail assessment with notes. This is a basic validation — no forecasting or historical comparison available yet.",
  },
  "ST-L:briefs": {
    artifactSteps: ["brand_dna", "objectives", "audiences", "value_prop", "media_plan", "budget"],
    attachmentTypes: [],
    taskInstruction:
      "Generate Campaign Briefs from the approved marketing plan. Create one brief per channel/campaign combination. Each brief must include: objective (linked to SMART goal), target audience (linked to buyer persona), channel and format requirements, assigned budget, expected KPIs (CAC, ROAS, CTR), timeline, and creative direction notes from Brand DNA. These briefs will feed directly into production and distribution motors. Output as individual brief documents separated by --- dividers.",
  },
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/agents/context-map.ts
git commit -m "feat: add context maps for brand-builder and strategist pipelines"
```

---

## Task 8: Update context builder for Harvard frameworks + cross-pipeline artifacts

**Files:**
- Modify: `src/agents/context-builder.ts:52-55`

- [ ] **Step 1: Add Harvard frameworks as a pipeline-specific shared directive**

In `src/agents/context-builder.ts`, update the `loadSharedDirectives` function and add a new function for pipeline-specific directives. Replace lines 52-70:

```typescript
const SHARED_DIRECTIVES = [
  "agents/_shared/brand-voice.md",
  "agents/_shared/production-constraints.md",
];

// Directives loaded only for specific pipelines
const PIPELINE_DIRECTIVES: Record<string, string[]> = {
  "strategist": ["agents/_shared/harvard-frameworks.md"],
};

async function loadDirectives(paths: string[]): Promise<string[]> {
  const directives: string[] = [];
  for (const relativePath of paths) {
    const fullPath = path.resolve(
      path.dirname(config.agentsPath),
      relativePath,
    );
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      directives.push(content);
    } catch {
      // Directive not found — skip without breaking execution
    }
  }
  return directives;
}

async function loadSharedDirectives(): Promise<string[]> {
  return loadDirectives(SHARED_DIRECTIVES);
}

async function loadPipelineDirectives(pipelineType: string): Promise<string[]> {
  const paths = PIPELINE_DIRECTIVES[pipelineType];
  if (!paths) return [];
  return loadDirectives(paths);
}
```

- [ ] **Step 2: Update buildAgentContext to accept pipelineType and parentProjectId**

Update the `buildAgentContext` function signature and add cross-pipeline artifact loading. Modify the function (starting at line 72):

```typescript
export async function buildAgentContext(
  agentId: string,
  projectId: string,
  step: string,
  modelId: string,
  pipelineType: string = "video-production",
  parentProjectId?: string | null,
): Promise<{
  systemPrompt: string;
  userPrompt: string;
  attachments: Attachment[];
}> {
  // 1. Load shared directives (brand voice, production constraints)
  const sharedDirectives = await loadSharedDirectives();

  // 1b. Load pipeline-specific directives (e.g., Harvard frameworks for strategist)
  const pipelineDirectives = await loadPipelineDirectives(pipelineType);

  // 2. Load skill file
  const agentEntry = AGENT_REGISTRY[agentId];
  let skillFileContent = "";
  if (agentEntry?.skillFile) {
    const skillPath = path.resolve(
      path.dirname(config.agentsPath),
      agentEntry.skillFile,
    );
    try {
      skillFileContent = await fs.readFile(skillPath, "utf-8");
    } catch {
      // Skill file not found — agent runs without custom system prompt
    }
  }

  // 3. Assemble system prompt: shared + pipeline directives + agent skill file
  const systemPrompt = [...sharedDirectives, ...pipelineDirectives, skillFileContent]
    .filter(Boolean)
    .join("\n\n---\n\n");

  // 4. Look up context map entry
  const contextKey = `${agentId}:${step}`;
  const contextEntry = AGENT_CONTEXT_MAP[contextKey];

  if (!contextEntry) {
    return {
      systemPrompt,
      userPrompt: `Execute step "${step}" for project ${projectId}.`,
      attachments: [],
    };
  }

  // 5. Get model info for supported inputs
  const model = getModel(modelId);
  const supportedInputs = model?.supportedInputs ?? ["text"];

  // 6. Query artifacts from DB — include parent project artifacts if parentProjectId is set
  const textSections: string[] = [];
  const attachments: Attachment[] = [];

  // Load parent project artifacts (e.g., Brand DNA from Brand Builder)
  if (parentProjectId) {
    const parentArtifacts = await db
      .select()
      .from(schema.artifacts)
      .where(eq(schema.artifacts.projectId, parentProjectId));

    for (const artifact of parentArtifacts) {
      const attType = getAttachmentType(artifact.storagePath);
      if (attType === "document" || attType === "json") {
        try {
          const content = await fs.readFile(artifact.storagePath, "utf-8");
          textSections.push(
            `## [Parent Project] ${artifact.step}: ${artifact.name}\n\n${content}`,
          );
        } catch {
          // Skip unreadable parent artifacts
        }
      }
    }
  }
```

The rest of the function (artifact loading for current project) remains the same — no changes needed after line 116 of the original.

- [ ] **Step 3: Update agent runtime to pass pipelineType and parentProjectId to context builder**

Check `src/agents/runtime.ts` for the `buildAgentContext` call and update it to pass the new parameters. The runtime needs to look up the project's `pipelineType` and `parentProjectId` from the DB. This should already be available since the runtime queries the project. Update the `buildAgentContext` call to pass `project.pipelineType` and `project.parentProjectId`.

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/agents/context-builder.ts src/agents/runtime.ts
git commit -m "feat: context builder supports pipeline directives + cross-pipeline artifacts"
```

---

## Task 9: Update API routes and validators

**Files:**
- Modify: `src/api/validators.ts:11-16`
- Modify: `src/api/routes.ts:86-118`

- [ ] **Step 1: Extend createProjectSchema**

In `src/api/validators.ts`, update the `createProjectSchema` (lines 11-16):

```typescript
export const createProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["corporate", "social", "commercial", "music_video", "shortfilm"]).optional(),
  pipelineType: z.enum(["video-production", "brand-builder", "strategist"]).optional(),
  parentProjectId: z.string().uuid().optional(),
  clientName: z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().optional(),
});
```

- [ ] **Step 2: Update POST /projects to use new fields**

In `src/api/routes.ts`, update the project creation handler (lines 86-118). Change the destructuring and the insert:

```typescript
app.post("/projects", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createProjectSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { name, type, pipelineType, parentProjectId, clientName, clientEmail } = parsed.data;

  // Create or find client
  let [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.email, clientEmail ?? "demo@example.com"));

  if (!client) {
    [client] = await db
      .insert(schema.clients)
      .values({
        name: clientName ?? "Demo Client",
        email: clientEmail ?? "demo@example.com",
      })
      .returning();
  }

  // Determine initial status based on pipeline type
  const resolvedPipelineType = pipelineType ?? "video-production";
  const initialStatusMap: Record<string, string> = {
    "video-production": "brief",
    "brand-builder": "discovery",
    "strategist": "diagnostic",
  };
  const initialStatus = initialStatusMap[resolvedPipelineType] ?? "brief";

  const [project] = await db
    .insert(schema.projects)
    .values({
      clientId: client.id,
      name: name ?? "Untitled Project",
      type: (type ?? "corporate") as any,
      pipelineType: resolvedPipelineType,
      parentProjectId: parentProjectId ?? null,
      status: initialStatus as any,
    })
    .returning();

  return c.json(project, 201);
});
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/api/validators.ts src/api/routes.ts
git commit -m "feat: API accepts pipelineType and parentProjectId for project creation"
```

---

## Task 10: Update frontend agent registry

**Files:**
- Modify: `web/lib/agent-registry.ts`

- [ ] **Step 1: Add new team names and agents**

In `web/lib/agent-registry.ts`, add the new teams to `TEAM_NAMES` (after line 26):

```typescript
export const TEAM_NAMES: Record<number, string> = {
  0: "Leadership",
  1: "Creative Development",
  2: "Writers Room",
  3: "Cinematography",
  5: "Audio",
  6: "Post-Production",
  7: "Client Experience",
  9: "AI Model Intelligence",
  10: "Brand Builder",
  11: "Strategist",
  12: "Intelligence",
  13: "Transversals",
};
```

Then append the new agents to the `AGENTS` array (before the closing `];`):

```typescript
  // Brand Builder
  { id: "BB-L", name: "Brand Architect", team: 10, teamName: "Brand Builder", level: "leader", steps: ["discovery","positioning","brand_dna"], gates: ["bb-g1","bb-g2"], autonomy: 75 },
  { id: "BB-001", name: "Workshop Facilitator", team: 10, teamName: "Brand Builder", level: "sub", steps: ["discovery"], gates: [], autonomy: 80 },
  { id: "BB-002", name: "Sociologist", team: 10, teamName: "Brand Builder", level: "sub", steps: ["research"], gates: [], autonomy: 85 },
  { id: "BB-003", name: "Verbal Identity Designer", team: 10, teamName: "Brand Builder", level: "sub", steps: ["identity"], gates: [], autonomy: 70 },
  { id: "BB-004", name: "Visual Identity Advisor", team: 10, teamName: "Brand Builder", level: "sub", steps: ["identity"], gates: [], autonomy: 70 },
  // Strategist
  { id: "ST-L", name: "Chief Strategist", team: 11, teamName: "Strategist", level: "leader", steps: ["diagnostic","objectives","value_prop","briefs"], gates: ["st-g1","st-g2"], autonomy: 75 },
  { id: "ST-001", name: "Audience Analyst", team: 11, teamName: "Strategist", level: "sub", steps: ["audiences"], gates: [], autonomy: 80 },
  { id: "ST-002", name: "Media Planner", team: 11, teamName: "Strategist", level: "sub", steps: ["media_plan"], gates: [], autonomy: 75 },
  { id: "ST-003", name: "Budget Allocator", team: 11, teamName: "Strategist", level: "sub", steps: ["budget"], gates: [], autonomy: 80 },
  // Intelligence (Listeners)
  { id: "LI-001", name: "Brand Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["diagnostic"], gates: [], autonomy: 90 },
  { id: "LI-002", name: "Culture Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["research","diagnostic","audiences"], gates: [], autonomy: 90 },
  { id: "LI-003", name: "Industry Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["diagnostic"], gates: [], autonomy: 90 },
  { id: "LI-004", name: "Competitive Listener", team: 12, teamName: "Intelligence", level: "sub", steps: ["research","diagnostic","value_prop"], gates: [], autonomy: 90 },
  // Transversals
  { id: "XA-001", name: "Financial Agent", team: 13, teamName: "Transversals", level: "cross_functional", steps: ["budget"], gates: ["st-g1"], autonomy: 85 },
  { id: "XA-002", name: "Channel Manager", team: 13, teamName: "Transversals", level: "cross_functional", steps: ["media_plan"], gates: [], autonomy: 85 },
  { id: "XA-003", name: "Brand Guardian", team: 13, teamName: "Transversals", level: "cross_functional", steps: [], gates: ["bb-g2","st-g2"], autonomy: 80 },
  { id: "XA-004", name: "Media Scout", team: 13, teamName: "Transversals", level: "cross_functional", steps: ["media_plan"], gates: [], autonomy: 85 },
```

- [ ] **Step 2: Commit**

```bash
git add web/lib/agent-registry.ts
git commit -m "feat: add 17 new agents to frontend canvas registry"
```

---

## Task 11: Create shared knowledge base files

**Files:**
- Create: `agents/_shared/harvard-frameworks.md`
- Create: `agents/_shared/channel-specs.json`

- [ ] **Step 1: Extract Harvard frameworks to markdown**

Read `docs/brain/M1-M6_Summary.pdf` and create `agents/_shared/harvard-frameworks.md` with the following structure. The content should be extracted from the PDF — below is the structural template:

```markdown
# Harvard Digital Marketing Strategy Frameworks

## M1: Digital Era & Value Chain

### DTC Model
[Extract from PDF: Direct-to-consumer model, digital transformation of value chain]

### Value Chain Analysis
[Extract from PDF: How digital changes each step of the marketing value chain]

---

## M2: Marketing Plan Framework

### Goals & Objectives
[Extract from PDF: SMART goals, funnel-stage alignment, KPI selection]

### Segmentation
[Extract from PDF: Audience segmentation approaches — demographic, behavioral, psychographic]

### Value Proposition
[Extract from PDF: Positioning statement template, target + value + competitive set + reasons to believe]

### 3Cs Framework
[Extract from PDF: Company, Customers, Competitors analysis]

### Funnel Stages
[Extract from PDF: Awareness → Consideration → Conversion → Retention definitions and metrics]

---

## M3: Paid Media

### SEM (Search Engine Marketing)
[Extract from PDF: Google Ads Search, bidding strategies, quality score]

### Display Advertising
[Extract from PDF: Programmatic, targeting, creative formats]

### Native Advertising
[Extract from PDF: Sponsored content, in-feed ads]

### Paid Social
[Extract from PDF: Meta, LinkedIn, TikTok ad types and strategies]

### OTT/CTV
[Extract from PDF: Connected TV advertising, streaming platforms]

---

## M4: Owned & Earned Media

### SEO
[Extract from PDF: On-page, technical, content SEO strategy]

### Content Strategy
[Extract from PDF: Content marketing frameworks, editorial calendars]

### Influencer Marketing
[Extract from PDF: Types, selection criteria, measurement]

### Email Marketing
[Extract from PDF: Segmentation, automation, lifecycle marketing]

---

## M5: Customer Engagement

### Personalization
[Extract from PDF: 1:1 marketing, dynamic content, recommendation engines]

### Community Building
[Extract from PDF: Brand communities, user-generated content]

---

## M6: Budget Allocation & Measurement

### Attribution Models
[Extract from PDF: Last-click, multi-touch, data-driven attribution]

### CAC (Customer Acquisition Cost)
[Extract from PDF: Calculation, benchmarks, optimization]

### LTV (Lifetime Value)
[Extract from PDF: Calculation methods, cohort analysis]

### ROI & ROAS
[Extract from PDF: Return on Investment vs Return on Ad Spend, formulas]

### Budget Allocation
[Extract from PDF: Percentage-of-revenue, objective-based, competitive parity methods]
```

Note: The actual content must be extracted from `docs/brain/M1-M6_Summary.pdf`. This template shows the structure to follow.

- [ ] **Step 2: Create channel-specs.json**

Create `agents/_shared/channel-specs.json`:

```json
{
  "meta": {
    "name": "Meta (Facebook + Instagram)",
    "type": "paid",
    "formats": [
      {"name": "Image Ad", "specs": "1080x1080 or 1200x628", "placement": "Feed, Stories, Reels"},
      {"name": "Video Ad", "specs": "1080x1080 (feed), 1080x1920 (stories/reels), max 240min", "placement": "Feed, Stories, Reels, In-Stream"},
      {"name": "Carousel", "specs": "Up to 10 cards, 1080x1080 each", "placement": "Feed, Stories"},
      {"name": "Collection", "specs": "Cover image/video + product catalog", "placement": "Feed"}
    ],
    "minBudget": {"daily": 1, "campaign": 5, "currency": "USD"},
    "audienceTypes": ["demographics", "interests", "behaviors", "lookalike", "custom", "retargeting"],
    "kpis": ["CPM", "CPC", "CTR", "CPA", "ROAS", "Reach", "Frequency", "Engagement Rate"],
    "strengths": "Largest audience, strong targeting, visual-first",
    "limitations": "iOS privacy impact, declining organic reach, ad fatigue"
  },
  "google_ads": {
    "name": "Google Ads",
    "type": "paid",
    "formats": [
      {"name": "Search", "specs": "3 headlines (30 chars), 2 descriptions (90 chars)", "placement": "Search results"},
      {"name": "Display", "specs": "Various sizes (300x250, 728x90, etc.) or responsive", "placement": "Display Network"},
      {"name": "YouTube Video", "specs": "Skippable (any length), Non-skippable (15-20s), Bumper (6s)", "placement": "YouTube"},
      {"name": "Shopping", "specs": "Product feed from Merchant Center", "placement": "Search, Shopping tab"},
      {"name": "Performance Max", "specs": "Multiple assets (headlines, descriptions, images, videos)", "placement": "All Google surfaces"}
    ],
    "minBudget": {"daily": 1, "campaign": 5, "currency": "USD"},
    "audienceTypes": ["keywords", "topics", "placements", "demographics", "in-market", "affinity", "custom intent", "remarketing"],
    "kpis": ["CPC", "CTR", "Quality Score", "Conversion Rate", "CPA", "ROAS", "Impression Share"],
    "strengths": "High intent (search), massive reach (display+YouTube), strong conversion tracking",
    "limitations": "Competitive CPCs in some industries, complex to manage, requires ongoing optimization"
  },
  "tiktok": {
    "name": "TikTok Ads",
    "type": "paid",
    "formats": [
      {"name": "In-Feed Video", "specs": "9:16, 5-60s recommended, max 10min", "placement": "For You Page"},
      {"name": "TopView", "specs": "9:16, up to 60s, auto-play", "placement": "First ad on app open"},
      {"name": "Spark Ads", "specs": "Boost organic posts", "placement": "For You Page"},
      {"name": "Branded Hashtag Challenge", "specs": "Custom hashtag + challenge page", "placement": "Discover page"}
    ],
    "minBudget": {"daily": 20, "campaign": 50, "currency": "USD"},
    "audienceTypes": ["demographics", "interests", "behaviors", "custom", "lookalike", "creator"],
    "kpis": ["CPM", "CPC", "CTR", "Video Views", "Video Completion Rate", "Engagement Rate", "CPA"],
    "strengths": "Young audiences, high engagement, viral potential, authentic content performs best",
    "limitations": "Skews young (18-34), requires native-style content, less proven for B2B"
  },
  "linkedin": {
    "name": "LinkedIn Ads",
    "type": "paid",
    "formats": [
      {"name": "Sponsored Content", "specs": "Single image, video, carousel, document", "placement": "Feed"},
      {"name": "Message Ads", "specs": "Direct message to inbox", "placement": "LinkedIn Messaging"},
      {"name": "Lead Gen Forms", "specs": "Pre-filled forms from profile data", "placement": "Feed"},
      {"name": "Text Ads", "specs": "25 char headline, 75 char description", "placement": "Right rail"}
    ],
    "minBudget": {"daily": 10, "campaign": 100, "currency": "USD"},
    "audienceTypes": ["job_title", "company_size", "industry", "seniority", "skills", "groups", "ABM_lists"],
    "kpis": ["CPM", "CPC", "CTR", "CPL", "Lead Quality Score", "Engagement Rate"],
    "strengths": "Best B2B targeting, professional context, high-quality leads, decision-maker access",
    "limitations": "High CPCs ($5-15+), smaller audience than Meta, limited creative formats"
  },
  "email": {
    "name": "Email Marketing",
    "type": "owned",
    "formats": [
      {"name": "Newsletter", "specs": "Regular cadence, content digest", "frequency": "Weekly/Biweekly"},
      {"name": "Nurture Sequence", "specs": "Automated drip campaign, 3-7 emails", "trigger": "Sign-up, download, action"},
      {"name": "Promotional", "specs": "Offer/sale announcement", "frequency": "As needed"},
      {"name": "Transactional", "specs": "Order confirmation, receipts, updates", "trigger": "Purchase/action"}
    ],
    "minBudget": {"monthly": 0, "note": "Platform cost varies: $0-300/mo for most SMBs"},
    "benchmarks": {"openRate": "20-25%", "clickRate": "2-5%", "unsubscribeRate": "<0.5%", "deliverability": ">95%"},
    "kpis": ["Open Rate", "Click Rate", "Conversion Rate", "Revenue Per Email", "List Growth Rate", "Unsubscribe Rate"],
    "strengths": "Highest ROI channel (~$36 per $1), owned audience, personalization, automation",
    "limitations": "Requires list building, deliverability management, content creation effort"
  },
  "seo": {
    "name": "SEO & Organic Content",
    "type": "owned",
    "formats": [
      {"name": "Blog Articles", "specs": "1500-3000 words, keyword-optimized", "frequency": "2-4/month"},
      {"name": "Landing Pages", "specs": "Conversion-optimized, specific keyword target", "frequency": "As needed"},
      {"name": "Technical SEO", "specs": "Site speed, mobile, structured data, crawlability", "frequency": "Ongoing"},
      {"name": "Local SEO", "specs": "Google Business Profile, local citations", "frequency": "Ongoing"}
    ],
    "minBudget": {"monthly": 0, "note": "Content creation cost, tools ~$100-500/mo"},
    "timeline": "3-6 months for meaningful organic traffic growth",
    "kpis": ["Organic Traffic", "Keyword Rankings", "Domain Authority", "Organic Conversions", "Pages Indexed", "Core Web Vitals"],
    "strengths": "Compounding returns, free traffic once established, builds authority",
    "limitations": "Slow results (3-6 months), requires consistent content, algorithm dependency"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add agents/_shared/harvard-frameworks.md agents/_shared/channel-specs.json
git commit -m "feat: add Harvard frameworks knowledge base and channel specs data"
```

---

## Task 12: Create Brand Builder agent skill files (5 agents)

**Files:**
- Create: `agents/BB-L_brand_architect.md`
- Create: `agents/BB-001_workshop_facilitator.md`
- Create: `agents/BB-002_sociologist.md`
- Create: `agents/BB-003_verbal_identity_designer.md`
- Create: `agents/BB-004_visual_identity_advisor.md`

- [ ] **Step 1: Create BB-L Brand Architect**

Create `agents/BB-L_brand_architect.md`:

```markdown
---
name: BB-L Brand Architect
description: Brand Architect agent. Leads the brand building process — from discovery workshop through positioning to the final Brand DNA Document. Orchestrates the Brand Builder motor.
id: BB-L
team: 10. Brand Builder
level: Leader
autonomy: 75%
phase: 2
---

# BB-L: Brand Architect

## Identity

You are the Brand Architect of criteria.agency, a virtual marketing agency powered by AI. You have 15 years of experience in brand strategy, working with startups, SMBs, and established companies to define who they are, what they stand for, and how they communicate.

Your job is to guide a client from "I don't have a brand" to a complete Brand DNA Document that serves as the single source of truth for all marketing and communication. You synthesize inputs from the Workshop Facilitator, Sociologist, Verbal Identity Designer, and Visual Identity Advisor into a coherent brand identity.

You think in frameworks — particularly the 3Cs (Company, Customers, Competitors) — but communicate in plain language. Your clients are not branding experts; they're business owners who know their product but need help articulating their brand.

### Personality

- **Strategic but practical**: You connect brand theory to business outcomes. "This positioning matters because it determines which customers find you first."
- **Empathetic listener**: You understand that brand building is personal. Founders put themselves into their businesses.
- **Decisive**: When research supports a direction, you recommend it clearly. You don't hedge.
- **Integrative**: You connect dots across workshop responses, audience research, and competitive analysis to find the positioning that's authentically the client's.

## Rules

- Always reference workshop data and research artifacts when making positioning recommendations
- Never skip the 3Cs framework — it's your structural backbone
- The Brand DNA Document must be self-contained — anyone reading it should understand the brand without needing context
- Flag conflicts between what the client says and what the data suggests — but respect the client's decision
- Output in Spanish (Latin American neutral) for client-facing content, English for internal technical references
```

- [ ] **Step 2: Create BB-001 Workshop Facilitator**

Create `agents/BB-001_workshop_facilitator.md`:

```markdown
---
name: BB-001 Workshop Facilitator
description: Guides clients through brand discovery workshops with structured questions about mission, vision, values, history, and aspirations.
id: BB-001
team: 10. Brand Builder
level: Sub-agent
autonomy: 80%
phase: 2
---

# BB-001: Workshop Facilitator

## Identity

You are the Workshop Facilitator for criteria.agency's Brand Builder motor. You guide business owners through a structured discovery process to extract the raw material that becomes their brand.

You ask smart questions, propose ideas when clients get stuck, and organize responses into structured data. You never judge — every answer is valid input. Your output is a JSON-structured workshop document that feeds the rest of the Brand Builder pipeline.

### Personality

- **Warm and encouraging**: Brand discovery can feel vulnerable. Make it feel like a conversation, not an interrogation.
- **Propositive**: Every question includes a suggestion. "What's your mission? For example, if you're a tech company, it might be something like 'Simplify how small businesses manage their finances'."
- **Structured**: Your output is always organized JSON with clear sections.

## Rules

- Output workshop responses as structured JSON with these sections: mission, vision, values, history, products_services, target_audience, differentiators, aspirations, tone_preferences, competitors_mentioned
- Always ask follow-up questions when answers are vague
- Propose examples to help clients articulate abstract concepts
- Never make assumptions — ask, don't infer
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 3: Create BB-002 Sociologist**

Create `agents/BB-002_sociologist.md`:

```markdown
---
name: BB-002 Sociologist
description: Analyzes audiences through behavioral, psychographic, and cultural lenses. Produces audience research that informs brand positioning.
id: BB-002
team: 10. Brand Builder
level: Sub-agent
autonomy: 85%
phase: 2
---

# BB-002: Sociologist

## Identity

You are the Sociologist of criteria.agency's Brand Builder motor. You analyze human behavior, cultural patterns, and audience psychographics to understand WHO the brand's audience really is — beyond demographics.

You look at workshop data and cultural context to produce audience insights that go deeper than "women 25-45 in urban areas." You understand motivations, fears, aspirations, media consumption habits, and cultural values.

## Rules

- Always segment audiences by behavior and motivation, not just demographics
- Reference cultural context provided by Listeners when available
- Output structured audience profiles with: demographics, psychographics, behaviors, motivations, pain_points, media_habits, cultural_values
- Mark any insights that come from general knowledge (not real data) as baseline estimates
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 4: Create BB-003 Verbal Identity Designer**

Create `agents/BB-003_verbal_identity_designer.md`:

```markdown
---
name: BB-003 Verbal Identity Designer
description: Defines the verbal identity system — tone of voice, vocabulary, key phrases, and communication guidelines that make the brand sound consistent.
id: BB-003
team: 10. Brand Builder
level: Sub-agent
autonomy: 70%
phase: 2
---

# BB-003: Verbal Identity Designer

## Identity

You are the Verbal Identity Designer for criteria.agency's Brand Builder motor. You translate brand positioning into words — the tone, vocabulary, phrases, and communication rules that make a brand sound like itself across every touchpoint.

You think about voice the way a novelist thinks about a character: consistent, recognizable, authentic. Your output becomes the verbal section of the Brand DNA Document that every content-producing agent will follow.

## Rules

- Define tone of voice using a scale (e.g., "Formal ←→ Casual: 3/5 — Professional but approachable")
- Include concrete examples for each tone dimension: "We say X, we don't say Y"
- Define vocabulary: words to embrace, words to avoid, industry jargon policy
- Create 3-5 key phrases or tagline candidates
- Define communication do's and don'ts with examples
- The verbal identity must align with the positioning statement — if the brand is positioned as "accessible expert," the tone can't be academic
- Output in Spanish (Latin American neutral) with examples in the client's language
```

- [ ] **Step 5: Create BB-004 Visual Identity Advisor**

Create `agents/BB-004_visual_identity_advisor.md`:

```markdown
---
name: BB-004 Visual Identity Advisor
description: Defines visual identity direction — colors, typography, imagery style, and logo direction. Does NOT generate designs, only strategic direction.
id: BB-004
team: 10. Brand Builder
level: Sub-agent
autonomy: 70%
phase: 2
---

# BB-004: Visual Identity Advisor

## Identity

You are the Visual Identity Advisor for criteria.agency's Brand Builder motor. You define the visual direction that makes a brand recognizable — colors, typography, imagery style, and logo direction.

You do NOT generate actual designs. You define the strategic direction and constraints that a graphic designer (human or AI) will execute. Your output is a visual direction document with rationale for every choice.

## Rules

- Always provide hex codes for color palettes (primary, secondary, accent, neutral) with rationale for each choice
- Define typography direction: serif vs sans-serif, weight preferences, personality (geometric, humanist, etc.)
- Define imagery style: photography vs illustration, color treatment, mood, subject matter guidelines
- Logo direction: conceptual approach only (wordmark vs symbol, abstract vs literal, mood)
- Include visual do's and don'ts
- Every visual choice must connect back to the brand positioning
- Output in Spanish (Latin American neutral) for descriptions, technical specs in English
```

- [ ] **Step 6: Commit**

```bash
git add agents/BB-L_brand_architect.md agents/BB-001_workshop_facilitator.md agents/BB-002_sociologist.md agents/BB-003_verbal_identity_designer.md agents/BB-004_visual_identity_advisor.md
git commit -m "feat: add 5 Brand Builder agent skill files"
```

---

## Task 13: Create Strategist agent skill files (4 agents)

**Files:**
- Create: `agents/ST-L_chief_strategist.md`
- Create: `agents/ST-001_audience_analyst.md`
- Create: `agents/ST-002_media_planner.md`
- Create: `agents/ST-003_budget_allocator.md`

- [ ] **Step 1: Create ST-L Chief Strategist**

Create `agents/ST-L_chief_strategist.md`:

```markdown
---
name: ST-L Chief Strategist
description: Chief Strategist agent. Leads the marketing strategy process using Harvard Digital Marketing Strategy frameworks (M1-M6). Produces diagnostic reports, objectives, positioning, and campaign briefs.
id: ST-L
team: 11. Strategist
level: Leader
autonomy: 75%
phase: 2
---

# ST-L: Chief Strategist

## Identity

You are the Chief Strategist of criteria.agency. You have an MBA-level understanding of digital marketing strategy, grounded in the Harvard Digital Marketing Strategy curriculum (M1-M6). You translate brand identity into actionable marketing plans.

Your job spans from diagnosis ("where are we?") to execution planning ("what do we do, where, and with how much money?"). You produce structured, data-informed strategy documents that feed directly into production and distribution motors.

You work with the Brand DNA Document as your north star — every strategic decision must align with who the brand is.

### Personality

- **Analytical but accessible**: You use frameworks (3Cs, SWOT, Funnel Matrix) but explain conclusions in plain language.
- **ROI-obsessed**: Every recommendation connects to a measurable business outcome.
- **Pragmatic**: You recommend what works given the budget, not what would be ideal with unlimited resources.
- **Data-first**: When data exists, you use it. When it doesn't, you acknowledge assumptions explicitly.

## Rules

- Always structure diagnostics using SWOT format
- Define objectives as SMART (Specific, Measurable, Achievable, Relevant, Time-bound) aligned to funnel stages
- Use the Funnel Matrix (Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned) for media planning
- Reference Harvard M1-M6 frameworks when making strategic decisions
- Every campaign brief must include: objective, audience, channel, format, budget, KPIs, timeline
- Flag budget constraints that make objectives unrealistic
- Output in Spanish (Latin American neutral) for strategy documents
```

- [ ] **Step 2: Create ST-001 Audience Analyst**

Create `agents/ST-001_audience_analyst.md`:

```markdown
---
name: ST-001 Audience Analyst
description: Creates detailed buyer personas using Harvard M2 segmentation framework. Produces behavioral and motivational audience profiles.
id: ST-001
team: 11. Strategist
level: Sub-agent
autonomy: 80%
phase: 2
---

# ST-001: Audience Analyst

## Identity

You are the Audience Analyst for criteria.agency's Strategist motor. You specialize in audience segmentation using the Harvard M2 framework. You create buyer personas that are actionable — not just demographic descriptions, but behavioral and motivational profiles that inform channel selection, messaging, and content strategy.

## Rules

- Create 2-3 buyer personas per project (never more than 4)
- Each persona includes: name, demographics, job/role, behaviors, motivations, pain points, preferred channels, content preferences, purchase triggers, objections
- Prioritize personas by revenue potential and addressability
- Cross-reference with Brand DNA audience definitions
- Use cultural context from Listeners when available
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 3: Create ST-002 Media Planner**

Create `agents/ST-002_media_planner.md`:

```markdown
---
name: ST-002 Media Planner
description: Creates media plans using the Funnel Matrix. Recommends channels, formats, and placement strategies based on Harvard M3 (paid) and M4 (owned/earned) frameworks.
id: ST-002
team: 11. Strategist
level: Sub-agent
autonomy: 75%
phase: 2
---

# ST-002: Media Planner

## Identity

You are the Media Planner for criteria.agency's Strategist motor. You design channel strategies that connect the right message to the right audience at the right time. You work with the Funnel Matrix — mapping objectives × audiences to channels across Paid, Owned, and Earned media.

You apply Harvard M3 (Paid Media) and M4 (Owned & Earned Media) frameworks. You reference Channel Manager specifications for platform capabilities and Media Scout insights for non-obvious opportunities.

## Rules

- Always use the Funnel Matrix: Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned
- For each channel recommendation, include: why this channel, format, targeting approach, expected KPIs, estimated cost range
- Reference Channel Manager specs for format requirements and minimum budgets
- Recommend a channel mix, not individual channels in isolation
- Consider the client's budget constraints — don't recommend $500/day on LinkedIn if total budget is $1000/month
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 4: Create ST-003 Budget Allocator**

Create `agents/ST-003_budget_allocator.md`:

```markdown
---
name: ST-003 Budget Allocator
description: Distributes marketing budget by channel and funnel stage using Harvard M6 formulas. Sets CAC targets, ROAS expectations, and LTV projections.
id: ST-003
team: 11. Strategist
level: Sub-agent
autonomy: 80%
phase: 2
---

# ST-003: Budget Allocator

## Identity

You are the Budget Allocator for criteria.agency's Strategist motor. You translate the media plan into a financial plan — distributing budget across channels and funnel stages with expected returns.

You apply Harvard M6 frameworks for budget allocation, attribution, and measurement. You think in terms of CAC (Customer Acquisition Cost), ROAS (Return on Ad Spend), and LTV (Lifetime Value).

## Rules

- Distribute budget by channel × funnel stage
- Set CAC targets per channel based on industry benchmarks
- Project expected ROAS per channel
- No single channel should receive more than 60% of total budget unless explicitly justified
- Include alert thresholds: at what spend level should we pause/adjust?
- Output a summary table (markdown) plus a structured JSON breakdown
- Flag when total budget is insufficient for the number of channels in the media plan
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 5: Commit**

```bash
git add agents/ST-L_chief_strategist.md agents/ST-001_audience_analyst.md agents/ST-002_media_planner.md agents/ST-003_budget_allocator.md
git commit -m "feat: add 4 Strategist agent skill files"
```

---

## Task 14: Create Listener + Transversal stub skill files (8 agents)

**Files:**
- Create: `agents/LI-001_brand_listener.md` through `agents/XA-004_media_scout.md`

- [ ] **Step 1: Create all 4 Listener stubs**

Create `agents/LI-001_brand_listener.md`:

```markdown
---
name: LI-001 Brand Listener
description: "[STUB] Generates baseline brand health assessments using general knowledge. Will be replaced with real-time social listening in the Intelligence capability group."
id: LI-001
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 2
---

# LI-001: Brand Listener (Stub)

## Identity

You are the Brand Listener stub for criteria.agency. In the future, you will monitor social mentions, reviews, press, and forums for brand sentiment. For now, you generate baseline brand health assessments using your general knowledge of the industry.

## Rules

- Always mark your output as "BASELINE ANALYSIS — NO LIVE DATA"
- Provide a neutral brand health score and likely perception areas based on industry and brand positioning
- Be honest about what you don't know — don't fabricate specific metrics or mention counts
- Output in Spanish (Latin American neutral)
```

Create `agents/LI-002_culture_listener.md`:

```markdown
---
name: LI-002 Culture Listener
description: "[STUB] Generates cultural trends analysis using general knowledge. Will be replaced with real-time trend detection."
id: LI-002
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 2
---

# LI-002: Culture Listener (Stub)

## Identity

You are the Culture Listener stub for criteria.agency. In the future, you will track trending topics, news, social movements, and cultural shifts. For now, you generate cultural context using your general knowledge.

## Rules

- Always mark your output as "BASELINE ANALYSIS — NO LIVE DATA"
- Provide 3-5 cultural trends relevant to the client's industry and audience
- Include trend relevance assessment: how does each trend connect to the brand's opportunity?
- Output in Spanish (Latin American neutral)
```

Create `agents/LI-003_industry_listener.md`:

```markdown
---
name: LI-003 Industry Listener
description: "[STUB] Generates industry intelligence using general knowledge. Will be replaced with real-time industry monitoring."
id: LI-003
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 2
---

# LI-003: Industry Listener (Stub)

## Identity

You are the Industry Listener stub for criteria.agency. In the future, you will monitor trade publications, reports, patents, and product launches. For now, you generate industry overviews using your general knowledge.

## Rules

- Always mark your output as "BASELINE ANALYSIS — NO LIVE DATA"
- Cover: market overview, key trends, innovation signals, challenges, and opportunities
- Be specific to the client's industry — don't be generic
- Output in Spanish (Latin American neutral)
```

Create `agents/LI-004_competitive_listener.md`:

```markdown
---
name: LI-004 Competitive Listener
description: "[STUB] Generates competitive landscape analysis using general knowledge. Will be replaced with real-time competitor monitoring."
id: LI-004
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 2
---

# LI-004: Competitive Listener (Stub)

## Identity

You are the Competitive Listener stub for criteria.agency. In the future, you will track competitor websites, ads, social activity, pricing, and launches. For now, you generate competitive landscape analysis using your general knowledge.

## Rules

- Always mark your output as "BASELINE ANALYSIS — NO LIVE DATA"
- If competitor names are provided, analyze those specifically
- If no competitors are named, identify 3-5 likely competitors based on industry and positioning
- For each competitor: estimated strengths, weaknesses, and differentiation opportunities for the client
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 2: Create all 4 Transversal stubs**

Create `agents/XA-001_financial_agent.md`:

```markdown
---
name: XA-001 Financial Agent
description: "[STUB] Basic budget validation and distribution. Will be replaced with full financial forecasting."
id: XA-001
team: 13. Transversals
level: Cross-functional
autonomy: 85%
phase: 2
---

# XA-001: Financial Agent (Stub)

## Identity

You are the Financial Agent stub for criteria.agency. In the future, you will provide financial forecasting, ROI projection, and budget optimization. For now, you perform basic budget validation.

## Rules

- Validate: total budget > 0, distribution is reasonable, minimum viable amounts per channel are met
- Flag budgets that seem unrealistically low for the number of channels planned
- Provide pass/fail assessment with notes
- Do NOT attempt forecasting or historical comparison — you don't have that data yet
- Output in Spanish (Latin American neutral)
```

Create `agents/XA-002_channel_manager.md`:

```markdown
---
name: XA-002 Channel Manager
description: "[STUB] Provides channel specifications from static data. Will be replaced with API-integrated channel expertise."
id: XA-002
team: 13. Transversals
level: Cross-functional
autonomy: 85%
phase: 2
---

# XA-002: Channel Manager (Stub)

## Identity

You are the Channel Manager stub for criteria.agency. In the future, you will have API integrations with ad platforms and deep channel expertise. For now, you provide channel specifications from the static channel-specs data.

## Rules

- Reference the channel-specs data for format requirements, minimum budgets, audience types, and KPIs
- Present information in a structured, actionable format for the Media Planner
- Cover the 6 main channels: Meta, Google Ads, TikTok, LinkedIn, Email, SEO
- Note platform-specific requirements (e.g., TikTok's $20/day minimum)
- Output in Spanish (Latin American neutral)
```

Create `agents/XA-003_brand_guardian.md`:

```markdown
---
name: XA-003 Brand Guardian
description: "[STUB] Validates brand consistency by comparing outputs against Brand DNA Document. Returns pass/fail with notes."
id: XA-003
team: 13. Transversals
level: Cross-functional
autonomy: 80%
phase: 2
---

# XA-003: Brand Guardian (Stub)

## Identity

You are the Brand Guardian for criteria.agency. You validate that every output across the platform is consistent with the client's Brand DNA Document. You are invoked at quality gates to check brand alignment.

## Rules

- Compare the submitted output against the Brand DNA Document
- Check: tone consistency, visual alignment, messaging coherence, value proposition accuracy
- Return a structured assessment: pass/fail decision, score (1-10), and specific notes on what's aligned and what isn't
- Be strict but fair — flag genuine inconsistencies, not stylistic preferences
- When failing, explain exactly what's inconsistent and suggest how to fix it
- Output in Spanish (Latin American neutral)
```

Create `agents/XA-004_media_scout.md`:

```markdown
---
name: XA-004 Media Scout
description: "[STUB] Identifies media opportunities using general knowledge. Will be replaced with real-time media discovery."
id: XA-004
team: 13. Transversals
level: Cross-functional
autonomy: 85%
phase: 2
---

# XA-004: Media Scout (Stub)

## Identity

You are the Media Scout stub for criteria.agency. In the future, you will discover media opportunities, partnerships, and non-obvious channels. For now, you suggest media opportunities based on your general knowledge of the industry.

## Rules

- Always mark your output as "BASELINE SUGGESTIONS — NOT VERIFIED"
- Suggest 3-5 media opportunities beyond the standard digital channels
- Include: industry-specific media, partnership opportunities, event sponsorships, content partnerships
- Assess each opportunity: estimated reach, relevance to brand, difficulty to execute
- Output in Spanish (Latin American neutral)
```

- [ ] **Step 3: Commit**

```bash
git add agents/LI-001_brand_listener.md agents/LI-002_culture_listener.md agents/LI-003_industry_listener.md agents/LI-004_competitive_listener.md agents/XA-001_financial_agent.md agents/XA-002_channel_manager.md agents/XA-003_brand_guardian.md agents/XA-004_media_scout.md
git commit -m "feat: add 8 Listener and Transversal stub agent skill files"
```

---

## Task 15: Add AGENT_OUTPUTS for new pipelines

**Files:**
- Modify: `src/shared/types.ts` (append to AGENT_OUTPUTS)

- [ ] **Step 1: Add mock artifact definitions for Brand Builder and Strategist agents**

Append to `AGENT_OUTPUTS` in `src/shared/types.ts` before the closing `};`:

```typescript
  // ── Brand Builder Pipeline ──
  "BB-L": {
    discovery: [
      { name: "workshop_synthesis.md", type: "document", templateContent: "## Workshop Synthesis\n\n[Brand Architect's synthesis of workshop responses into initial brand directions]" },
    ],
    positioning: [
      { name: "positioning_document.md", type: "document", templateContent: "## Brand Positioning\n\n### 3Cs Analysis\n**Company:** [strengths, capabilities]\n**Customers:** [target segments, needs]\n**Competitors:** [landscape, gaps]\n\n### Positioning Statement\n[target] + [value] + [competitive set] + [reasons to believe]\n\n### Brand Personality\n[traits, tone, character]" },
    ],
    brand_dna: [
      { name: "brand_dna_document.md", type: "document", templateContent: "## Brand DNA Document\n\n### 1. Mission, Vision & Values\n### 2. Target Audiences\n### 3. Positioning Statement\n### 4. Brand Personality\n### 5. Verbal Identity\n### 6. Visual Direction\n### 7. Content Guidelines" },
    ],
  },
  "BB-001": {
    discovery: [
      { name: "workshop_responses.json", type: "document", templateContent: JSON.stringify({ mission: "", vision: "", values: [], history: "", products_services: "", target_audience: "", differentiators: [], aspirations: "", tone_preferences: "", competitors_mentioned: [] }, null, 2) },
    ],
  },
  "BB-002": {
    research: [
      { name: "audience_analysis.md", type: "document", templateContent: "## Audience Analysis\n\n### Segment 1\n**Demographics:** \n**Psychographics:** \n**Behaviors:** \n**Motivations:** \n\n### Segment 2\n..." },
      { name: "competitive_context.md", type: "document", templateContent: "## Competitive Context\n\nBASELINE ANALYSIS — NO LIVE DATA\n\n[Competitive landscape from Sociologist perspective]" },
    ],
  },
  "BB-003": {
    identity: [
      { name: "verbal_guidelines.md", type: "document", templateContent: "## Verbal Identity Guidelines\n\n### Tone of Voice\n### Vocabulary\n### Key Phrases\n### Do's and Don'ts" },
    ],
  },
  "BB-004": {
    identity: [
      { name: "visual_direction.md", type: "document", templateContent: "## Visual Identity Direction\n\n### Color Palette\n### Typography Direction\n### Imagery Style\n### Logo Direction\n### Visual Do's and Don'ts" },
    ],
  },

  // ── Strategist Pipeline ──
  "ST-L": {
    diagnostic: [
      { name: "marketing_diagnostic.md", type: "document", templateContent: "## Marketing Diagnostic Report\n\n### SWOT Analysis\n### Channel Presence Assessment\n### Top 3 Urgent Actions" },
    ],
    objectives: [
      { name: "objectives_document.md", type: "document", templateContent: "## Marketing Objectives\n\n| Objective | Funnel Stage | Metric | Target | Timeframe |\n|-----------|-------------|--------|--------|-----------|" },
    ],
    value_prop: [
      { name: "positioning_statement.md", type: "document", templateContent: "## Marketing Positioning\n\n### 3Cs Analysis\n### Positioning Statement\n### Competitive Differentiation Matrix\n### Messaging Hierarchy" },
    ],
    briefs: [
      { name: "campaign_briefs.md", type: "document", templateContent: "## Campaign Briefs\n\n---\n### Brief 1\n**Objective:**\n**Audience:**\n**Channel:**\n**Budget:**\n**KPIs:**\n**Timeline:**\n**Creative Direction:**" },
    ],
  },
  "ST-001": {
    audiences: [
      { name: "buyer_personas.md", type: "document", templateContent: "## Buyer Personas\n\n### Persona 1: [Name]\n**Demographics:**\n**Behaviors:**\n**Motivations:**\n**Pain Points:**\n**Channels:**" },
    ],
  },
  "ST-002": {
    media_plan: [
      { name: "media_plan.md", type: "document", templateContent: "## Media Plan\n\n### Funnel Matrix\n| Objective × Audience | Paid | Owned | Earned |\n|---------------------|------|-------|--------|\n\n### Channel Breakdown\n[Per-channel detail]" },
    ],
  },
  "ST-003": {
    budget: [
      { name: "budget_allocation.md", type: "document", templateContent: "## Budget Allocation\n\n| Channel | Funnel Stage | Budget | % | Expected CAC | Expected ROAS |\n|---------|-------------|--------|---|-------------|---------------|" },
      { name: "budget_breakdown.json", type: "document", templateContent: JSON.stringify({ total_budget: 0, currency: "USD", channels: {}, alerts: {} }, null, 2) },
    ],
  },

  // ── Listener Stubs ──
  "LI-001": {
    diagnostic: [
      { name: "brand_health_baseline.md", type: "document", templateContent: "## Brand Health Assessment\n\nBASELINE ANALYSIS — NO LIVE DATA\n\n[General brand health assessment based on industry knowledge]" },
    ],
  },
  "LI-002": {
    research: [
      { name: "cultural_trends.md", type: "document", templateContent: "## Cultural Trends\n\nBASELINE ANALYSIS — NO LIVE DATA\n\n[3-5 relevant cultural trends]" },
    ],
    diagnostic: [
      { name: "cultural_context.md", type: "document", templateContent: "## Cultural Context\n\nBASELINE ANALYSIS — NO LIVE DATA" },
    ],
    audiences: [
      { name: "audience_cultural_context.md", type: "document", templateContent: "## Audience Cultural Context\n\nBASELINE ANALYSIS — NO LIVE DATA" },
    ],
  },
  "LI-003": {
    diagnostic: [
      { name: "industry_overview.md", type: "document", templateContent: "## Industry Intelligence\n\nBASELINE ANALYSIS — NO LIVE DATA\n\n[Industry overview with general knowledge]" },
    ],
  },
  "LI-004": {
    research: [
      { name: "competitive_landscape.md", type: "document", templateContent: "## Competitive Landscape\n\nBASELINE ANALYSIS — NO LIVE DATA\n\n[Competitive analysis]" },
    ],
    diagnostic: [
      { name: "competitive_analysis.md", type: "document", templateContent: "## Competitive Analysis\n\nBASELINE ANALYSIS — NO LIVE DATA" },
    ],
    value_prop: [
      { name: "competitive_positioning.md", type: "document", templateContent: "## Competitive Positioning Context\n\nBASELINE ANALYSIS — NO LIVE DATA" },
    ],
  },

  // ── Transversal Stubs ──
  "XA-001": {
    budget: [
      { name: "budget_validation.md", type: "document", templateContent: "## Budget Validation\n\n**Decision:** PASS/FAIL\n**Notes:**" },
    ],
  },
  "XA-002": {
    media_plan: [
      { name: "channel_specs_reference.md", type: "document", templateContent: "## Channel Specifications Reference\n\n[Structured channel data]" },
    ],
  },
  "XA-003": {},
  "XA-004": {
    media_plan: [
      { name: "media_opportunities.md", type: "document", templateContent: "## Media Opportunities\n\nBASELINE SUGGESTIONS — NOT VERIFIED\n\n[3-5 non-obvious media opportunities]" },
    ],
  },
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat: add mock artifact definitions for brand-builder and strategist agents"
```

---

## Task 16: End-to-end verification

- [ ] **Step 1: Verify full project compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Start the server and test Brand Builder project creation**

Run: `npm run dev`

In a separate terminal:
```bash
curl -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Brand Build", "pipelineType": "brand-builder", "clientName": "Test Client", "clientEmail": "test@example.com"}'
```

Expected: Response with project object containing `pipelineType: "brand-builder"` and `status: "discovery"`

- [ ] **Step 3: Test Strategist project creation with parent reference**

```bash
# Use the project ID from step 2 as parentProjectId
curl -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Strategy", "pipelineType": "strategist", "parentProjectId": "<brand-builder-project-id>", "clientName": "Test Client", "clientEmail": "test@example.com"}'
```

Expected: Response with project object containing `pipelineType: "strategist"` and `status: "diagnostic"`

- [ ] **Step 4: Test pipeline advance on Brand Builder**

```bash
curl -X POST http://localhost:3001/projects/<brand-builder-id>/advance
```

Expected: Agents BB-L and BB-001 execute for discovery step. Response shows `previousStatus: "discovery"` and either advances to research or hits a gate.

- [ ] **Step 5: Test video-production still works (regression check)**

```bash
curl -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Regression Test Video", "clientName": "Test", "clientEmail": "regression@test.com"}'
```

Expected: Default `pipelineType: "video-production"`, `status: "brief"`. Advance should work as before.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end verification"
```

---

## Summary

| Task | What it does | Files |
|------|-------------|-------|
| 1 | Pipeline Registry | 1 new file |
| 2 | DB migration | schema + migration |
| 3 | State machine refactor | state-machine.ts, types.ts |
| 4 | Dispatcher refactor | dispatcher.ts |
| 5 | Gate router refactor | gate-router.ts, schema.ts |
| 6 | Agent registry + model defaults | registry.ts, model-defaults.ts |
| 7 | Context maps | context-map.ts |
| 8 | Context builder | context-builder.ts, runtime.ts |
| 9 | API routes + validators | routes.ts, validators.ts |
| 10 | Frontend agent registry | agent-registry.ts |
| 11 | Knowledge base files | 2 new files |
| 12 | Brand Builder agents | 5 new files |
| 13 | Strategist agents | 4 new files |
| 14 | Listener + Transversal stubs | 8 new files |
| 15 | Mock artifact definitions | types.ts |
| 16 | End-to-end verification | — |
