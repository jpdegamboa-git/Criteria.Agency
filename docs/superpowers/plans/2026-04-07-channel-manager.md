# Channel Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Channel Manager motor (C-026) — register pipeline, create 4 agent skill files, wire up context maps, update DB schema, and deprecate XA-002 stub reference.

**Architecture:** Adds a `channel-manager` pipeline to PipelineRegistry with 4 steps and 1 gate. Creates 4 agents (CH-L through CH-003). Evolves from the XA-002 stub into a full motor that analyzes channel requirements, produces technical specs, and delivers channel-ready packages.

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Hono

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `agents/CH-L_channel_director.md` | Channel Director skill file (leader) |
| `agents/CH-001_digital_channel_specialist.md` | Digital Channel Specialist skill file |
| `agents/CH-002_traditional_channel_specialist.md` | Traditional Channel Specialist skill file |
| `agents/CH-003_specs_engineer.md` | Specs Engineer skill file |

### Modified files
| File | Change |
|------|--------|
| `src/db/schema.ts` | Add CH steps to enums |
| `src/orchestrator/pipeline-registry.ts` | Add `channel-manager` pipeline |
| `src/agents/registry.ts` | Add 4 agents (team 26), deprecate XA-002 reference |
| `src/agents/model-defaults.ts` | Add model assignments |
| `src/agents/context-map.ts` | Add 4 context map entries |

---

### Task 1: Add Channel Manager steps to DB schema
**Files:** Modify: `src/db/schema.ts`

- [ ] **Step 1:** Add to projectStatusEnum: `"ch_request", "ch_analysis", "ch_specs", "ch_delivery"`
- [ ] **Step 2:** Add to artifactStepEnum: same values
- [ ] **Step 3:** Add to gateTypeEnum: `"ch-g1"`
- [ ] **Step 4:** Run `npm run db:generate && npm run db:migrate`
- [ ] **Step 5:** Commit: `git add src/db/schema.ts src/db/migrations/ && git commit -m "feat(channel-manager): add CH steps and gate to DB schema"`

---

### Task 2: Register channel-manager pipeline
**Files:** Modify: `src/orchestrator/pipeline-registry.ts`

- [ ] **Step 1:** Add pipeline:
```typescript
PipelineRegistry.register({
  type: "channel-manager",
  steps: ["ch_request", "ch_analysis", "ch_specs", "ch_delivery"],
  stepAgents: {
    ch_request: ["CH-L"],
    ch_analysis: ["CH-001", "CH-002"],
    ch_specs: ["CH-003"],
    ch_delivery: ["CH-L"],
  },
  gates: {
    "ch-g1": { afterStep: "ch_analysis", evaluators: ["CH-L"], maxIterations: 2, failReturnTo: "ch_analysis" },
  },
});
```
- [ ] **Step 2:** Verify and commit: `git commit -m "feat(channel-manager): register channel-manager pipeline"`

---

### Task 3: Register 4 agents and deprecate XA-002 reference
**Files:** Modify: `src/agents/registry.ts`

- [ ] **Step 1:** Add:
```typescript
  // ── Channel Manager ──
  "CH-L": { id: "CH-L", name: "Channel Director", skillFile: "agents/CH-L_channel_director.md", team: 26, level: "leader", steps: ["ch_request", "ch_delivery"] as any, gates: ["ch-g1"] as any, autonomy: 75 },
  "CH-001": { id: "CH-001", name: "Digital Channel Specialist", skillFile: "agents/CH-001_digital_channel_specialist.md", team: 26, level: "sub", steps: ["ch_analysis"] as any, gates: [], autonomy: 80 },
  "CH-002": { id: "CH-002", name: "Traditional Channel Specialist", skillFile: "agents/CH-002_traditional_channel_specialist.md", team: 26, level: "sub", steps: ["ch_analysis"] as any, gates: [], autonomy: 75 },
  "CH-003": { id: "CH-003", name: "Specs Engineer", skillFile: "agents/CH-003_specs_engineer.md", team: 26, level: "sub", steps: ["ch_specs"] as any, gates: [], autonomy: 85 },
```
- [ ] **Step 2:** Find XA-002 reference in registry — add a deprecation comment noting it is superseded by CH-L / Channel Manager motor. If XA-002 is referenced as a gate evaluator elsewhere, leave those references but add a TODO comment to migrate to CH-L.
- [ ] **Step 3:** Commit: `git commit -m "feat(channel-manager): register 4 CH agents, deprecate XA-002 reference"`

---

### Task 4: Add model defaults
**Files:** Modify: `src/agents/model-defaults.ts`

- [ ] **Step 1:** Add: `"CH-L": "claude-sonnet-4"`, `"CH-001": "gemini-2.5-flash"`, `"CH-002": "gemini-2.5-flash"`, `"CH-003": "gemini-2.5-flash"`
- [ ] **Step 2:** Commit: `git commit -m "feat(channel-manager): add CH model defaults"`

---

### Task 5: Add context map entries
**Files:** Modify: `src/agents/context-map.ts`

- [ ] **Step 1:** Add 4 entries for the channel-manager pipeline:
  - `ch_request` — Intake and normalize the channel request; extract target channels, formats, and deadlines
  - `ch_analysis` — Analyze channel requirements: digital (CH-001) covers web, social, email, programmatic; traditional (CH-002) covers print, OOH, broadcast, POS
  - `ch_specs` — Produce precise technical specs per channel (dimensions, codecs, color profiles, file formats, naming conventions)
  - `ch_delivery` — Compile final delivery packages, run QA checklists, and hand off to delivery pipeline or client
- [ ] **Step 2:** Add output types (all "text")
- [ ] **Step 3:** Commit: `git commit -m "feat(channel-manager): add context map entries"`

---

### Task 6: Create 4 agent skill files
**Files:** Create: `agents/CH-L_channel_director.md`, `agents/CH-001_digital_channel_specialist.md`, `agents/CH-002_traditional_channel_specialist.md`, `agents/CH-003_specs_engineer.md`

Each with YAML frontmatter (team: "26. Channel Manager", phase: 2) + Identity + Role in Pipeline + Rules.

- [ ] **Step 1:** Create CH-L — Channel Director. Leader agent. Owns ch_request and ch_delivery steps plus ch-g1 gate. Coordinates the full channel workflow from request intake through final delivery. Evolved from XA-002 stub.
- [ ] **Step 2:** Create CH-001 — Digital Channel Specialist. Handles ch_analysis for digital channels (web banners, social media formats, email templates, programmatic ad specs, app store assets).
- [ ] **Step 3:** Create CH-002 — Traditional Channel Specialist. Handles ch_analysis for traditional channels (print/press, out-of-home, broadcast TV/radio, point-of-sale, packaging, event collateral).
- [ ] **Step 4:** Create CH-003 — Specs Engineer. Handles ch_specs. Produces exact technical specifications per channel: pixel dimensions, bleed, color profiles (CMYK/RGB/P3), codecs, bitrates, file naming conventions, and delivery folder structures.
- [ ] **Step 5:** Commit: `git add agents/CH-*.md && git commit -m "feat(channel-manager): add 4 CH agent skill files"`
