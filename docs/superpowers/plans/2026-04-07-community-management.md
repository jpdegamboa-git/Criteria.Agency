# Community Management Motor -- Implementation Plan

| Key | Value |
|-----|-------|
| **Goal** | Add a Community Management production motor (team 23) that plans, produces, schedules, monitors and reports on social-media community content. |
| **Architecture** | 5 new agents (CM-L, CM-001 to CM-004), 1 pipeline `community-management` with 7 steps and 2 gates. |
| **Tech** | Drizzle enum extensions, pipeline/agent/model-default registries, context-map entries, agent skill files. |
| **Spec** | `docs/superpowers/specs/2026-04-07-community-management-design.md` |

---

## File structure

| Path | Purpose |
|------|---------|
| `src/db/schema.ts` | Add `cm_*` steps to `projectStatusEnum`, `cm-g*` to `gateTypeEnum` |
| `src/pipelines/community-management.ts` | Pipeline definition (steps, agents, gates) |
| `src/agents/registry.ts` | 5 agent entries for team 23 |
| `src/agents/model-defaults.ts` | Model assignments for 5 agents |
| `src/context/community-management-map.ts` | Context-map with taskInstructions per step |
| `agents/CM-L_community_manager.md` | Skill file -- Community Manager (lead) |
| `agents/CM-001_content_planner.md` | Skill file -- Content Planner |
| `agents/CM-002_content_creator.md` | Skill file -- Content Creator |
| `agents/CM-003_engagement_analyst.md` | Skill file -- Engagement Analyst |
| `agents/CM-004_scheduling_operator.md` | Skill file -- Scheduling Operator |

---

## Tasks

### Task 1 -- Schema: extend enums

- [ ] Add 7 values to `projectStatusEnum`:
  `cm_brief`, `cm_calendar`, `cm_content_production`, `cm_scheduling`, `cm_monitoring`, `cm_reporting`, `cm_delivery`
- [ ] Add 2 values to `gateTypeEnum`:
  `cm-g1`, `cm-g2`
- [ ] Generate migration and apply to dev DB.

### Task 2 -- Pipeline registry

- [ ] Create `src/pipelines/community-management.ts`:

```ts
import { definePipeline } from "./define-pipeline";

export const communityManagementPipeline = definePipeline({
  name: "community-management",
  steps: [
    "cm_brief",
    "cm_calendar",
    "cm_content_production",
    "cm_scheduling",
    "cm_monitoring",
    "cm_reporting",
    "cm_delivery",
  ],
  stepAgents: {
    cm_brief:              ["CM-L"],
    cm_calendar:           ["CM-L", "CM-001"],
    cm_content_production: ["CM-002"],
    cm_scheduling:         ["CM-004"],
    cm_monitoring:         ["CM-003"],
    cm_reporting:          ["CM-003", "CM-L"],
    cm_delivery:           ["CM-L"],
  },
  gates: [
    { id: "cm-g1", after: "cm_calendar",           approver: "CM-L" },
    { id: "cm-g2", after: "cm_content_production",  approver: "CM-L" },
  ],
});
```

- [ ] Re-export from `src/pipelines/index.ts`.

### Task 3 -- Agent registry

- [ ] Add 5 entries to `src/agents/registry.ts`:

```ts
// ---- Team 23: Community Management ----
{ id: "CM-L",   name: "Community Manager",     team: 23, role: "lead",
  steps: ["cm_brief","cm_calendar","cm_reporting","cm_delivery"],
  gates: ["cm-g1","cm-g2"] },
{ id: "CM-001", name: "Content Planner",        team: 23, role: "sub",
  steps: ["cm_calendar"] },
{ id: "CM-002", name: "Content Creator",         team: 23, role: "sub",
  steps: ["cm_content_production"] },
{ id: "CM-003", name: "Engagement Analyst",      team: 23, role: "sub",
  steps: ["cm_monitoring","cm_reporting"] },
{ id: "CM-004", name: "Scheduling Operator",     team: 23, role: "sub",
  steps: ["cm_scheduling"] },
```

### Task 4 -- Model defaults

- [ ] Add to `src/agents/model-defaults.ts`:

```ts
// Team 23 -- Community Management
"CM-L":   { primary: "claude-sonnet-4",    fallback: "gemini-2.5-flash" },
"CM-001": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"CM-002": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"CM-003": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"CM-004": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
```

### Task 5 -- Context map

- [ ] Create `src/context/community-management-map.ts` with one entry per step:

```ts
export const communityManagementContextMap = {
  cm_brief: {
    taskInstructions: "Parse the client brief and extract brand voice, target audience, platforms, goals, KPIs, and content pillars for the community management campaign.",
  },
  cm_calendar: {
    taskInstructions: "Build a content calendar with post dates, platforms, content types, copy hooks, and hashtag clusters aligned to the brief objectives.",
  },
  cm_content_production: {
    taskInstructions: "Produce post copy, captions, carousels, and short-form scripts following brand voice guidelines and platform-specific best practices.",
  },
  cm_scheduling: {
    taskInstructions: "Map each content piece to its publishing slot, confirm platform API compatibility, and generate the scheduling payload.",
  },
  cm_monitoring: {
    taskInstructions: "Track engagement metrics (likes, comments, shares, saves, reach) in real time and flag anomalies or viral opportunities.",
  },
  cm_reporting: {
    taskInstructions: "Compile a performance report with KPI progress, top-performing posts, audience growth, and actionable recommendations for the next cycle.",
  },
  cm_delivery: {
    taskInstructions: "Package the final report, approved assets, and calendar into the client-ready delivery bundle.",
  },
};
```

- [ ] Register in `src/context/index.ts`.

### Task 6 -- Skill files

- [ ] Create 5 agent skill files under `agents/`:
  - `CM-L_community_manager.md` -- lead, orchestrates the full CM pipeline, approves gates cm-g1 and cm-g2.
  - `CM-001_content_planner.md` -- builds content calendars, topic clusters, and posting cadences.
  - `CM-002_content_creator.md` -- writes post copy, captions, carousel scripts, and short-form hooks.
  - `CM-003_engagement_analyst.md` -- monitors metrics, detects trends, and compiles performance reports.
  - `CM-004_scheduling_operator.md` -- maps content to time slots and generates scheduling payloads.
- [ ] Each file follows the standard skill-file template with `## Identity`, `## Responsibilities`, `## Interfaces`, `## Constraints`.
