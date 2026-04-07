# SEO/Content Motor -- Implementation Plan

| Key | Value |
|-----|-------|
| **Goal** | Add an SEO/Content production motor (team 25) that audits, strategizes, plans, optimizes, and reports on search-driven content. |
| **Architecture** | 5 new agents (SE-L, SE-001 to SE-004), 1 pipeline `seo-content` with 7 steps and 2 gates. |
| **Tech** | Drizzle enum extensions, pipeline/agent/model-default registries, context-map entries, agent skill files. |
| **Spec** | `docs/superpowers/specs/2026-04-07-seo-content-design.md` |

---

## File structure

| Path | Purpose |
|------|---------|
| `src/db/schema.ts` | Add `se_*` steps to `projectStatusEnum`, `se-g*` to `gateTypeEnum` |
| `src/pipelines/seo-content.ts` | Pipeline definition (steps, agents, gates) |
| `src/agents/registry.ts` | 5 agent entries for team 25 |
| `src/agents/model-defaults.ts` | Model assignments for 5 agents |
| `src/context/seo-content-map.ts` | Context-map with taskInstructions per step |
| `agents/SE-L_seo_director.md` | Skill file -- SEO Director (lead) |
| `agents/SE-001_technical_seo_analyst.md` | Skill file -- Technical SEO Analyst |
| `agents/SE-002_keyword_strategist.md` | Skill file -- Keyword Strategist |
| `agents/SE-003_seo_copywriter.md` | Skill file -- SEO Copywriter |
| `agents/SE-004_analytics_reporter.md` | Skill file -- Analytics Reporter |

---

## Tasks

### Task 1 -- Schema: extend enums

- [ ] Add 7 values to `projectStatusEnum`:
  `se_brief`, `se_audit`, `se_keyword_strategy`, `se_content_plan`, `se_optimization`, `se_reporting`, `se_delivery`
- [ ] Add 2 values to `gateTypeEnum`:
  `se-g1`, `se-g2`
- [ ] Generate migration and apply to dev DB.

### Task 2 -- Pipeline registry

- [ ] Create `src/pipelines/seo-content.ts`:

```ts
import { definePipeline } from "./define-pipeline";

export const seoContentPipeline = definePipeline({
  name: "seo-content",
  steps: [
    "se_brief",
    "se_audit",
    "se_keyword_strategy",
    "se_content_plan",
    "se_optimization",
    "se_reporting",
    "se_delivery",
  ],
  stepAgents: {
    se_brief:            ["SE-L"],
    se_audit:            ["SE-001"],
    se_keyword_strategy: ["SE-002"],
    se_content_plan:     ["SE-L", "SE-003"],
    se_optimization:     ["SE-003", "SE-001"],
    se_reporting:        ["SE-004", "SE-L"],
    se_delivery:         ["SE-L"],
  },
  gates: [
    { id: "se-g1", after: "se_keyword_strategy", approver: "SE-L" },
    { id: "se-g2", after: "se_optimization",     approver: "SE-L" },
  ],
});
```

- [ ] Re-export from `src/pipelines/index.ts`.

### Task 3 -- Agent registry

- [ ] Add 5 entries to `src/agents/registry.ts`:

```ts
// ---- Team 25: SEO/Content ----
{ id: "SE-L",   name: "SEO Director",          team: 25, role: "lead",
  steps: ["se_brief","se_content_plan","se_reporting","se_delivery"],
  gates: ["se-g1","se-g2"] },
{ id: "SE-001", name: "Technical SEO Analyst",  team: 25, role: "sub",
  steps: ["se_audit","se_optimization"] },
{ id: "SE-002", name: "Keyword Strategist",     team: 25, role: "sub",
  steps: ["se_keyword_strategy"] },
{ id: "SE-003", name: "SEO Copywriter",         team: 25, role: "sub",
  steps: ["se_content_plan","se_optimization"] },
{ id: "SE-004", name: "Analytics Reporter",     team: 25, role: "sub",
  steps: ["se_reporting"] },
```

### Task 4 -- Model defaults

- [ ] Add to `src/agents/model-defaults.ts`:

```ts
// Team 25 -- SEO/Content
"SE-L":   { primary: "claude-sonnet-4",    fallback: "gemini-2.5-flash" },
"SE-001": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"SE-002": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"SE-003": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
"SE-004": { primary: "gemini-2.5-flash",   fallback: "claude-haiku-3" },
```

### Task 5 -- Context map

- [ ] Create `src/context/seo-content-map.ts` with one entry per step:

```ts
export const seoContentContextMap = {
  se_brief: {
    taskInstructions: "Parse the client brief and extract business goals, target market, current domain authority, competitor landscape, and priority content verticals.",
  },
  se_audit: {
    taskInstructions: "Run a technical SEO audit: crawlability, indexation, Core Web Vitals, structured data, internal linking health, and canonical/duplicate issues.",
  },
  se_keyword_strategy: {
    taskInstructions: "Build a keyword universe with search volume, difficulty, intent classification, SERP feature opportunities, and cluster-to-page mapping.",
  },
  se_content_plan: {
    taskInstructions: "Create an editorial calendar mapping keyword clusters to content pieces with titles, outlines, target word counts, internal link targets, and publish dates.",
  },
  se_optimization: {
    taskInstructions: "Write and optimize content: title tags, meta descriptions, H1-H3 hierarchy, keyword density, schema markup, image alt text, and internal/external links.",
  },
  se_reporting: {
    taskInstructions: "Compile a performance report with ranking changes, organic traffic, CTR, impressions, backlink acquisition, and ROI projections for the next cycle.",
  },
  se_delivery: {
    taskInstructions: "Package the final audit report, keyword map, optimized content files, and analytics dashboard into the client-ready delivery bundle.",
  },
};
```

- [ ] Register in `src/context/index.ts`.

### Task 6 -- Skill files

- [ ] Create 5 agent skill files under `agents/`:
  - `SE-L_seo_director.md` -- lead, orchestrates the full SEO pipeline, approves gates se-g1 and se-g2.
  - `SE-001_technical_seo_analyst.md` -- performs technical audits, crawl analysis, and on-page optimization checks.
  - `SE-002_keyword_strategist.md` -- researches keywords, maps intent clusters, and identifies SERP opportunities.
  - `SE-003_seo_copywriter.md` -- writes SEO-optimized content with proper heading hierarchy, schema, and link structure.
  - `SE-004_analytics_reporter.md` -- tracks ranking changes, organic traffic, and compiles performance reports.
- [ ] Each file follows the standard skill-file template with `## Identity`, `## Responsibilities`, `## Interfaces`, `## Constraints`.
