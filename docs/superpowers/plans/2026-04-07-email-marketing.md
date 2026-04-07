# Email Marketing Motor -- Implementation Plan

| Key | Value |
|-----|-------|
| **Goal** | Add an Email Marketing production motor (team 24) that strategizes, produces, segments, sends, and analyzes email campaigns. |
| **Architecture** | 5 new agents (EM-L, EM-001 to EM-004), 1 pipeline `email-marketing` with 7 steps and 2 gates. |
| **Tech** | Drizzle enum extensions, pipeline/agent/model-default registries, context-map entries, agent skill files. |
| **Spec** | `docs/superpowers/specs/2026-04-07-email-marketing-design.md` |

---

## File structure

| Path | Purpose |
|------|---------|
| `src/db/schema.ts` | Add `em_*` steps to `projectStatusEnum`, `em-g*` to `gateTypeEnum` |
| `src/pipelines/email-marketing.ts` | Pipeline definition (steps, agents, gates) |
| `src/agents/registry.ts` | 5 agent entries for team 24 |
| `src/agents/model-defaults.ts` | Model assignments for 5 agents |
| `src/context/email-marketing-map.ts` | Context-map with taskInstructions per step |
| `agents/EM-L_email_marketing_director.md` | Skill file -- Email Marketing Director (lead) |
| `agents/EM-001_email_strategist.md` | Skill file -- Email Strategist |
| `agents/EM-002_email_copywriter.md` | Skill file -- Email Copywriter |
| `agents/EM-003_segmentation_analyst.md` | Skill file -- Segmentation Analyst |
| `agents/EM-004_deliverability_engineer.md` | Skill file -- Deliverability Engineer |

---

## Tasks

### Task 1 -- Schema: extend enums

- [ ] Add 7 values to `projectStatusEnum`:
  `em_brief`, `em_strategy`, `em_production`, `em_segmentation`, `em_send`, `em_analysis`, `em_delivery`
- [ ] Add 2 values to `gateTypeEnum`:
  `em-g1`, `em-g2`
- [ ] Generate migration and apply to dev DB.

### Task 2 -- Pipeline registry

- [ ] Create `src/pipelines/email-marketing.ts`:

```ts
import { definePipeline } from "./define-pipeline";

export const emailMarketingPipeline = definePipeline({
  name: "email-marketing",
  steps: [
    "em_brief",
    "em_strategy",
    "em_production",
    "em_segmentation",
    "em_send",
    "em_analysis",
    "em_delivery",
  ],
  stepAgents: {
    em_brief:        ["EM-L"],
    em_strategy:     ["EM-L", "EM-001"],
    em_production:   ["EM-002"],
    em_segmentation: ["EM-003"],
    em_send:         ["EM-004"],
    em_analysis:     ["EM-003", "EM-L"],
    em_delivery:     ["EM-L"],
  },
  gates: [
    { id: "em-g1", after: "em_strategy",   approver: "EM-L" },
    { id: "em-g2", after: "em_production",  approver: "EM-L" },
  ],
});
```

- [ ] Re-export from `src/pipelines/index.ts`.

### Task 3 -- Agent registry

- [ ] Add 5 entries to `src/agents/registry.ts`:

```ts
// ---- Team 24: Email Marketing ----
{ id: "EM-L",   name: "Email Marketing Director", team: 24, role: "lead",
  steps: ["em_brief","em_strategy","em_analysis","em_delivery"],
  gates: ["em-g1","em-g2"] },
{ id: "EM-001", name: "Email Strategist",          team: 24, role: "sub",
  steps: ["em_strategy"] },
{ id: "EM-002", name: "Email Copywriter",           team: 24, role: "sub",
  steps: ["em_production"] },
{ id: "EM-003", name: "Segmentation Analyst",       team: 24, role: "sub",
  steps: ["em_segmentation","em_analysis"] },
{ id: "EM-004", name: "Deliverability Engineer",    team: 24, role: "sub",
  steps: ["em_send"] },
```

### Task 4 -- Model defaults

- [ ] Add to `src/agents/model-defaults.ts`:

```ts
// Team 24 -- Email Marketing
"EM-L":   { primary: "claude-sonnet-4",    fallback: "gemini-2.5-flash" },
"EM-001": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"EM-002": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"EM-003": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"EM-004": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
```

### Task 5 -- Context map

- [ ] Create `src/context/email-marketing-map.ts` with one entry per step:

```ts
export const emailMarketingContextMap = {
  em_brief: {
    taskInstructions: "Parse the client brief and extract campaign objectives, target personas, offer details, brand voice, and success KPIs for the email campaign.",
  },
  em_strategy: {
    taskInstructions: "Define the email sequence architecture: number of sends, cadence, subject-line angles, A/B test plan, and funnel stage mapping.",
  },
  em_production: {
    taskInstructions: "Write email copy (subject lines, preview text, body, CTAs) for each send in the sequence, following brand voice and conversion best practices.",
  },
  em_segmentation: {
    taskInstructions: "Build audience segments based on demographics, behavior, engagement history, and purchase signals; output segment definitions and estimated reach.",
  },
  em_send: {
    taskInstructions: "Validate sender authentication (SPF, DKIM, DMARC), configure send parameters, warm-up schedule, and trigger the campaign dispatch.",
  },
  em_analysis: {
    taskInstructions: "Compile campaign metrics (open rate, CTR, conversion rate, unsubscribe rate, revenue attribution) and produce actionable insights for optimization.",
  },
  em_delivery: {
    taskInstructions: "Package the final campaign report, winning variants, segment performance, and recommendations into the client-ready delivery bundle.",
  },
};
```

- [ ] Register in `src/context/index.ts`.

### Task 6 -- Skill files

- [ ] Create 5 agent skill files under `agents/`:
  - `EM-L_email_marketing_director.md` -- lead, orchestrates the full EM pipeline, approves gates em-g1 and em-g2.
  - `EM-001_email_strategist.md` -- designs email sequences, cadence, A/B test frameworks, and funnel mapping.
  - `EM-002_email_copywriter.md` -- writes subject lines, preview text, body copy, and CTAs for each send.
  - `EM-003_segmentation_analyst.md` -- builds audience segments and analyzes post-send campaign metrics.
  - `EM-004_deliverability_engineer.md` -- manages sender reputation, authentication, warm-up, and dispatch execution.
- [ ] Each file follows the standard skill-file template with `## Identity`, `## Responsibilities`, `## Interfaces`, `## Constraints`.
