# criteria.agency — Strategy Engines Implementation Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation plan for Strategy capabilities (C-001 to C-005) + Brand Builder (C-006), including pipeline registry, 17 new agents, Harvard knowledge base, and transversal stubs

---

## 1. Objective

Implement the first capability group — **Estrategia y Dirección** — by building 2 new motors (Brand Builder, Strategist) on top of the existing orchestration infrastructure. This unlocks 6 capabilities:

| Capability | What it delivers |
|-----------|-----------------|
| C-001: Diagnóstico de marketing | Evaluation of current state + top 3 priorities |
| C-002: Plan de marketing completo | Objectives, audiences, value prop, channels, budget |
| C-003: Definición de audiencias | 2-3 buyer personas with behavioral/motivational data |
| C-004: Análisis competitivo | Top 5 competitors mapped with gaps and opportunities |
| C-005: Generación de briefs | Campaign briefs that feed production + distribution motors |
| C-006: Construcción de marca | Brand DNA Document (prerequisite for all strategy work) |

**Dependency chain:** C-006 (Brand Builder) → C-001 → C-002 → C-003/C-004 → C-005

---

## 2. Architecture: Pipeline Registry

### Problem

The current orchestrator hardcodes the video-production pipeline (steps, agents, gates) as constants. Adding new motors requires a registry pattern.

### Solution

Create `PipelineRegistry` — a static registry where each motor registers its pipeline definition.

```typescript
interface PipelineDefinition {
  type: string;
  steps: string[];
  stepAgents: Record<string, string[]>;
  gates: Record<string, {
    afterStep: string;
    evaluators: string[];
    maxIterations: number;
  }>;
}
```

### Changes to existing code

| File | Change |
|------|--------|
| `src/orchestrator/pipeline-registry.ts` | **New file.** Registry + 3 pipeline definitions (video-production, brand-builder, strategist) |
| `src/orchestrator/state-machine.ts` | Read `pipelineType` from project. Use `PipelineRegistry` for step sequence and gate checks instead of hardcoded constants |
| `src/orchestrator/dispatcher.ts` | Replace `STEP_AGENTS` constant with `PipelineRegistry.getAgentsForStep(pipelineType, step)` |
| `src/orchestrator/gate-router.ts` | Use `PipelineRegistry.getGateConfig(pipelineType, gate)` for evaluators and max iterations |
| `src/db/schema.ts` | Add `pipelineType` column to `projects` table (string, default 'video-production') |
| `src/api/routes.ts` | `POST /projects` accepts `pipelineType` in request body |

### Migration strategy

1. Extract current hardcoded video pipeline into a `PipelineDefinition` object
2. Register it as `video-production`
3. Refactor state-machine/dispatcher/gate-router to use registry
4. Add brand-builder and strategist pipelines
5. Existing projects continue working (default `pipelineType = 'video-production'`)

---

## 3. Brand Builder Motor (C-006)

### Pipeline

```
[discovery] → [research] → [G1] → [positioning] → [identity] → [G2] → [brand_dna] → [G3: client]
```

### Agents (5)

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| BB-L | Brand Architect | leader | discovery, positioning, brand_dna | claude-sonnet-4 | 75% |
| BB-001 | Workshop Facilitator | sub | discovery | gemini-2.5-flash | 80% |
| BB-002 | Sociologist | sub | research | gemini-2.5-flash | 85% |
| BB-003 | Verbal Identity Designer | sub | identity | claude-sonnet-4 | 70% |
| BB-004 | Visual Identity Advisor | sub | identity | gemini-2.5-flash | 70% |

### Step details

| Step | Agents | What happens | Input artifacts | Output artifacts |
|------|--------|-------------|----------------|-----------------|
| discovery | BB-L, BB-001 | Guided workshop with client: mission, vision, values, history, product/service, differentiators, aspirations | Client brief (text) | Workshop responses (json) |
| research | BB-002 | Audience analysis (behavioral, psychographic, cultural). Consumes Culture Listener + Competitive Listener stubs | Workshop responses, Culture Listener output, Competitive Listener output | Audience analysis (markdown), Competitive context (markdown) |
| positioning | BB-L | 3Cs framework. Defines: target audience, value proposition, competitive set, positioning statement, tone, brand personality | Workshop responses, research artifacts | Positioning document (markdown) |
| identity | BB-003, BB-004 | Verbal system (tone, vocabulary, key phrases, do's/don'ts). Visual direction (colors, typography, imagery style, logo direction) | Positioning document | Verbal guidelines (markdown), Visual direction (markdown) |
| brand_dna | BB-L | Consolidates all artifacts into final Brand DNA Document | All prior artifacts | Brand DNA Document (markdown) |

### Gates

| Gate | After step | Evaluator(s) | Max iterations | What it checks |
|------|-----------|-------------|----------------|---------------|
| G1 | research | BB-L | 3 | Are insights sufficient for positioning decisions? |
| G2 | identity | BB-L | 3 | Does positioning reflect in identity? Internal consistency |
| G3 | brand_dna | Human | 1 | Client reviews and approves Brand DNA |

### Output

**Brand DNA Document** — persistent markdown document containing:
- Mission, vision, values
- Target audiences
- Positioning statement + 3Cs analysis
- Brand personality
- Verbal identity (tone, vocabulary, phrases, do's/don'ts)
- Visual direction (colors, typography, imagery, logo direction)
- Guidelines for content production

This document is stored as an artifact and injected as context into all Strategist pipeline runs.

---

## 4. Strategist Motor (C-001 to C-005)

### Pipeline

```
[diagnostic] → [objectives] → [G1] → [audiences] → [value_prop] → [G2] → [media_plan] → [budget] → [G3: human] → OUTPUT: Campaign Briefs
```

### Agents (4)

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| ST-L | Chief Strategist | leader | diagnostic, objectives, value_prop | claude-sonnet-4 | 75% |
| ST-001 | Audience Analyst | sub | audiences | gemini-2.5-flash | 80% |
| ST-002 | Media Planner | sub | media_plan | claude-sonnet-4 | 75% |
| ST-003 | Budget Allocator | sub | budget | gemini-2.5-flash | 80% |

### Step details

| Step | Agents | What happens | Framework | Input | Output | Capability |
|------|--------|-------------|-----------|-------|--------|-----------|
| diagnostic | ST-L | Receives Brand DNA + Listener data + client history. SWOT, value chain position | M1, M2 | Brand DNA, Listener outputs (x4) | Marketing Diagnostic Report (markdown) | C-001 |
| objectives | ST-L | Defines measurable SMART goals aligned to funnel stages | M2 | Diagnostic report | Objectives Document (markdown) | C-002 |
| audiences | ST-001 | Segmentation: demographic, behavioral, motivational. Cross with Culture Listener and Brand DNA | M2 | Objectives, Brand DNA, Culture Listener output | Buyer Personas (markdown, 2-3 segments) | C-003 |
| value_prop | ST-L | Positioning statement (target + value + competitive set + reasons to believe). 3Cs validation | M2 3Cs | Audiences, Competitive Listener output, Brand DNA | Positioning Statement + 3Cs Analysis (markdown) | C-004 (partial) |
| media_plan | ST-002 | Funnel Matrix activation. For each objective × audience, recommend channels. Distinguish Paid (M3), Owned (M4), Earned (M4). Channel Manager provides specs | M3, M4 | Objectives, audiences, value_prop, Channel Manager output, Media Scout output | Media Plan (markdown) | C-002 |
| budget | ST-003 | Distribute budget by channel × funnel stage. CAC target, expected ROAS, LTV projection | M6 | Media plan, Financial Agent validation | Budget Allocation (markdown + json) | C-002 |

### Gates

| Gate | After step | Evaluator(s) | Max iterations | What it checks |
|------|-----------|-------------|----------------|---------------|
| G1 | objectives | ST-L, XA-001 (Financial Agent stub) | 3 | Are objectives realistic given budget and market? |
| G2 | value_prop | ST-L, XA-003 (Brand Guardian stub) | 3 | Is positioning consistent with Brand DNA? Does market space exist? |
| G3 | budget | Human | 1 | Human reviews complete plan before campaign briefs are generated |

### Output

**Campaign Briefs** — generated after G3 approval. Each brief is a structured document specifying:
- Objective (linked to SMART goal)
- Target audience (linked to buyer persona)
- Channel(s) and format requirements
- Assigned budget
- Expected KPIs (CAC, ROAS, CTR targets)
- Timeline
- Creative direction notes (from Brand DNA)

Campaign Briefs feed directly into Creation motors (Video, Design, Web, Audio) and Distribution motors (Ads, Community, Email, SEO).

### Harvard Frameworks Knowledge Base

The Harvard Digital Marketing Strategy modules (M1-M6) are extracted from `docs/brain/M1-M6_Summary.pdf` into `agents/_shared/harvard-frameworks.md`.

**Selective injection by agent+step:**

| Agent | Step | Modules injected |
|-------|------|-----------------|
| ST-L | diagnostic | M1 (value chain, DTC model), M2 (marketing plan, SWOT) |
| ST-L | objectives | M2 (goals, metrics, funnel stages) |
| ST-001 | audiences | M2 (segmentation, positioning) |
| ST-L | value_prop | M2 (3Cs, value proposition, competitive set) |
| ST-002 | media_plan | M3 (paid media), M4 (owned & earned media) |
| ST-003 | budget | M6 (budget allocation, attribution, CAC, LTV, ROI, ROAS) |

The context builder loads the full `harvard-frameworks.md` file and extracts the relevant module sections based on the agent+step combination.

---

## 5. Transversal Stubs

Stubs are real agents (not mocks) that use an LLM with limited scope. They produce useful content based on model knowledge but without real-time data sources. Each stub has a skill file defining its role.

### Listener Stubs (x4)

| ID | Name | Team | Input | Output | Model |
|----|------|------|-------|--------|-------|
| LI-001 | Brand Listener | listeners | Brand name + industry | Generic brand health assessment, no real mentions | gemini-2.5-flash |
| LI-002 | Culture Listener | listeners | Industry + country | 3-5 generic cultural trends for the sector | gemini-2.5-flash |
| LI-003 | Industry Listener | listeners | Industry | Sector overview with general knowledge | gemini-2.5-flash |
| LI-004 | Competitive Listener | listeners | Competitor names (if provided) | Basic competitive landscape without live data | gemini-2.5-flash |

**Stub behavior:** Each Listener receives a prompt like: "Generate a {type} analysis for the {industry} industry in {country}. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'."

### Transversal Agent Stubs (x4)

| ID | Name | Team | Invoked by | Behavior | Model |
|----|------|------|-----------|----------|-------|
| XA-001 | Financial Agent | transversals | Strategist G1, budget step | Basic budget validation (>0, reasonable distribution). No forecasting | gemini-2.5-flash |
| XA-002 | Channel Manager | transversals | Strategist media_plan step | Returns specs from `agents/_shared/channel-specs.json` for 6 main channels | gemini-2.5-flash |
| XA-003 | Brand Guardian | transversals | Strategist G2, Brand Builder G2 | Compares output against Brand DNA Document. Returns pass/fail + notes | gemini-2.5-flash |
| XA-004 | Media Scout | transversals | Strategist media_plan step | Generic media opportunities list by industry | gemini-2.5-flash |

### Channel Specs Data

`agents/_shared/channel-specs.json` contains hardcoded specs for 6 channels:

| Channel | Data included |
|---------|-------------|
| Meta (FB + IG) | Formats, min budget, audience types, KPIs, placement options |
| Google Ads | Search/Display/YouTube/Shopping formats, bidding types, KPIs |
| TikTok | Video formats, audience demographics, creative requirements |
| LinkedIn | B2B targeting, ad formats, budget minimums |
| Email | Sequence types, open rate benchmarks, deliverability basics |
| SEO/Content | Content types, keyword strategy basics, timeline expectations |

---

## 6. Agent Skill Files

17 new agent skill files following the existing pattern:

```
agents/
  # Brand Builder motor
  BB-L_brand_architect.md
  BB-001_workshop_facilitator.md
  BB-002_sociologist.md
  BB-003_verbal_identity_designer.md
  BB-004_visual_identity_advisor.md

  # Strategist motor
  ST-L_chief_strategist.md
  ST-001_audience_analyst.md
  ST-002_media_planner.md
  ST-003_budget_allocator.md

  # Listener stubs
  LI-001_brand_listener.md
  LI-002_culture_listener.md
  LI-003_industry_listener.md
  LI-004_competitive_listener.md

  # Transversal stubs
  XA-001_financial_agent.md
  XA-002_channel_manager.md
  XA-003_brand_guardian.md
  XA-004_media_scout.md

  # Shared knowledge
  _shared/harvard-frameworks.md    (extracted from docs/brain/M1-M6_Summary.pdf)
  _shared/channel-specs.json       (6 channel specs)
```

Each skill file follows the existing frontmatter pattern:

```yaml
---
name: [Agent Name]
description: [Brief purpose]
id: [ID]
team: [brand-builder | strategist | listeners | transversals]
level: [leader | sub]
autonomy: [65-85%]
phase: [2]
---
```

---

## 7. Code Changes Summary

### New files

| File | Purpose |
|------|---------|
| `src/orchestrator/pipeline-registry.ts` | Pipeline registry + 3 pipeline definitions |
| `agents/*.md` (x17) | Agent skill files |
| `agents/_shared/harvard-frameworks.md` | Harvard M1-M6 knowledge base |
| `agents/_shared/channel-specs.json` | Channel specifications data |
| `src/db/migrations/XXXX_add_pipeline_type.sql` | DB migration for `pipelineType` and `parentProjectId` columns |

### Modified files

| File | Change |
|------|--------|
| `src/orchestrator/state-machine.ts` | Use PipelineRegistry instead of hardcoded steps/gates |
| `src/orchestrator/dispatcher.ts` | Use PipelineRegistry instead of STEP_AGENTS constant |
| `src/orchestrator/gate-router.ts` | Use PipelineRegistry for gate config |
| `src/agents/registry.ts` | Add 17 new agents to registry |
| `src/agents/context-builder.ts` | Add context maps for brand-builder and strategist pipelines. Load Harvard frameworks selectively. Load channel-specs.json for Channel Manager |
| `src/agents/model-defaults.ts` | Add model assignments for 17 new agents |
| `src/db/schema.ts` | Add `pipelineType` and `parentProjectId` (nullable FK to projects) to projects table |
| `src/api/routes.ts` | Accept pipelineType in POST /projects |
| `web/lib/agent-registry.ts` | Add new agents for canvas visualization |

### Unchanged

- Agent runtime (`src/agents/runtime.ts`) — no changes needed
- Provider system (`src/providers/*`) — no changes needed
- Artifact storage (`src/storage/*`) — no changes needed
- Gate evaluation mechanics — same pass/fail logic, just different evaluators
- Canvas visualization — works automatically once agents are in registry

---

## 8. Execution Flow

### Brand Builder flow

```
1. POST /projects { pipelineType: 'brand-builder', clientId, brief }
2. POST /projects/:id/run
   → discovery: BB-L + BB-001 run workshop, produce workshop responses
   → research: BB-002 + LI-002 (stub) + LI-004 (stub) produce audience/competitive analysis
   → G1: BB-L evaluates if insights are sufficient
   → positioning: BB-L defines positioning using 3Cs
   → identity: BB-003 (verbal) + BB-004 (visual) define brand identity
   → G2: BB-L checks positioning ↔ identity consistency
   → brand_dna: BB-L consolidates into Brand DNA Document
   → G3: Human reviews and approves
3. Brand DNA Document stored as artifact, available for Strategist pipeline
```

### Strategist flow

```
1. POST /projects { pipelineType: 'strategist', clientId, brandDnaProjectId }
2. POST /projects/:id/run
   → diagnostic: ST-L + LI-001/002/003/004 (stubs) produce diagnostic report
   → objectives: ST-L defines SMART goals
   → G1: ST-L + XA-001 (Financial Agent stub) validate objectives
   → audiences: ST-001 + LI-002 (stub) produce buyer personas
   → value_prop: ST-L + LI-004 (stub) produce positioning statement
   → G2: ST-L + XA-003 (Brand Guardian stub) validate consistency with Brand DNA
   → media_plan: ST-002 + XA-002 (Channel Manager stub) + XA-004 (Media Scout stub) produce media plan
   → budget: ST-003 + XA-001 produce budget allocation
   → G3: Human reviews complete plan
3. Campaign Briefs generated as final artifacts
```

### Cross-pipeline artifact flow

The Strategist pipeline receives a `brandDnaProjectId` at creation time. The context builder uses this to load the Brand DNA Document artifact from the Brand Builder project as additional context for relevant steps.

**Implementation:** Add `parentProjectId` (nullable) to the `projects` table. The context builder checks for `parentProjectId` and, if present, loads the final artifact (step `brand_dna`) from the parent project as an attachment.

```
Brand Builder (project A)
  └─ Artifact: Brand DNA Document
       ↓ (referenced via parentProjectId on project B)
Strategist (project B)
  ├─ diagnostic step: loads Brand DNA as context
  ├─ audiences step: loads Brand DNA for persona alignment
  ├─ value_prop step: loads Brand DNA for positioning consistency
  └─ G2: Brand Guardian validates against Brand DNA
```

---

## 9. Future evolution

This implementation sets up the foundation for:

- **Full Listener implementation** (Intelligence capability group) — replace stubs with real-time data sources
- **Full transversal implementation** — Financial Agent with real forecasting, Channel Manager with API integrations, Brand Guardian with learned brand rules
- **Additional motors** — each new motor registers its pipeline in PipelineRegistry following the same pattern
- **Cross-motor orchestration** — Campaign Briefs from Strategist trigger Creation/Distribution motor projects automatically
- **Motor Registry** (Approach B from brainstorming) — PipelineRegistry can evolve into a full MotorRegistry with lifecycle management, health monitoring, and dependency resolution

---

## 10. Success criteria

| Criterion | Measurement |
|-----------|-------------|
| Brand Builder produces Brand DNA | Run pipeline end-to-end, get coherent Brand DNA Document |
| Strategist produces Campaign Briefs | Run pipeline with Brand DNA as input, get structured briefs |
| Pipeline Registry works | All 3 pipeline types (video, brand-builder, strategist) run without regression |
| Stubs produce useful output | Listener and transversal stubs generate non-empty, contextually relevant content |
| Harvard frameworks are injected correctly | Chief Strategist receives correct M1-M6 modules per step |
| No video pipeline regression | Existing video projects continue to work after refactor |
