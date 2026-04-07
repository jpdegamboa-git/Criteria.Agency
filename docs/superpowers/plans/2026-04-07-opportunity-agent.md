# Opportunity Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Opportunity Agent (C-027) — register 3 agents, add schema entries, wire up context maps, and create skill files. This is NOT a pipeline — it runs as a scheduled task/loop that continuously scans for opportunities, evaluates them, and surfaces alerts.

**Architecture:** Creates 3 agents (OP-L through OP-002) in team 27. Uses `op_scan`, `op_evaluate`, and `op_alert` phases tracked via artifactStepEnum only (NOT projectStatusEnum or gateTypeEnum). No PipelineRegistry entry needed — the Opportunity Agent operates as an autonomous loop outside the standard pipeline orchestration.

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Hono

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `agents/OP-L_opportunity_director.md` | Opportunity Director skill file (leader) |
| `agents/OP-001_signal_scanner.md` | Signal Scanner skill file |
| `agents/OP-002_activation_planner.md` | Activation Planner skill file |

### Modified files
| File | Change |
|------|--------|
| `src/db/schema.ts` | Add OP steps to artifactStepEnum ONLY |
| `src/agents/registry.ts` | Add 3 agents (team 27) |
| `src/agents/model-defaults.ts` | Add model assignments |
| `src/agents/context-map.ts` | Add 3 context map entries |

---

### Task 1: Add Opportunity steps to DB schema (artifactStepEnum only)
**Files:** Modify: `src/db/schema.ts`

- [ ] **Step 1:** Add to artifactStepEnum ONLY: `"op_scan", "op_evaluate", "op_alert"`
- [ ] **Step 2:** Do NOT add to projectStatusEnum — this is not a pipeline with project status transitions
- [ ] **Step 3:** Do NOT add to gateTypeEnum — there are no gates
- [ ] **Step 4:** Run `npm run db:generate && npm run db:migrate`
- [ ] **Step 5:** Commit: `git add src/db/schema.ts src/db/migrations/ && git commit -m "feat(opportunity): add OP steps to artifactStepEnum"`

---

### Task 2: Register 3 agents
**Files:** Modify: `src/agents/registry.ts`

- [ ] **Step 1:** Add:
```typescript
  // ── Opportunity Agent ──
  "OP-L": { id: "OP-L", name: "Opportunity Director", skillFile: "agents/OP-L_opportunity_director.md", team: 27, level: "leader", steps: [] as any, gates: [], autonomy: 70 },
  "OP-001": { id: "OP-001", name: "Signal Scanner", skillFile: "agents/OP-001_signal_scanner.md", team: 27, level: "sub", steps: [] as any, gates: [], autonomy: 80 },
  "OP-002": { id: "OP-002", name: "Activation Planner", skillFile: "agents/OP-002_activation_planner.md", team: 27, level: "sub", steps: [] as any, gates: [], autonomy: 75 },
```
- [ ] **Step 2:** Note: `steps` arrays are empty because this team does not participate in any pipeline. The agents operate in a scheduled loop, not via pipeline step assignments.
- [ ] **Step 3:** Commit: `git commit -m "feat(opportunity): register 3 OP agents (team 27)"`

---

### Task 3: Add model defaults
**Files:** Modify: `src/agents/model-defaults.ts`

- [ ] **Step 1:** Add: `"OP-L": "claude-sonnet-4"`, `"OP-001": "gemini-2.5-flash"`, `"OP-002": "gemini-2.5-flash"`
- [ ] **Step 2:** Commit: `git commit -m "feat(opportunity): add OP model defaults"`

---

### Task 4: Add context map entries
**Files:** Modify: `src/agents/context-map.ts`

- [ ] **Step 1:** Add 3 entries for the opportunity agent phases (these are used for artifact context, not pipeline routing):
  - `op_scan` — Scan external signals: industry news, trending topics, cultural moments, competitor moves, seasonal patterns, and client-relevant events. Produce a raw signal list with source, relevance score, and time sensitivity.
  - `op_evaluate` — Evaluate each signal against active client briefs, brand voice constraints, and production capacity. Score opportunity fit (0-100), estimate effort, and flag conflicts with in-flight projects.
  - `op_alert` — Generate structured opportunity alerts for the Project Manager and Client Service. Include signal summary, recommended action, suggested pipeline (which motor to activate), estimated timeline, and urgency level.
- [ ] **Step 2:** Add output types (all "text")
- [ ] **Step 3:** Commit: `git commit -m "feat(opportunity): add context map entries for scan/evaluate/alert"`

---

### Task 5: Create 3 agent skill files
**Files:** Create: `agents/OP-L_opportunity_director.md`, `agents/OP-001_signal_scanner.md`, `agents/OP-002_activation_planner.md`

Each with YAML frontmatter (team: "27. Opportunity Agent", phase: 2) + Identity + Role + Rules.

- [ ] **Step 1:** Create OP-L — Opportunity Director. Leader agent. Orchestrates the scan-evaluate-alert loop. Decides scan frequency, prioritizes evaluated signals, and approves alerts before they reach the PM. Autonomy 70 — escalates high-impact opportunities to human review.
- [ ] **Step 2:** Create OP-001 — Signal Scanner. Runs op_scan phase. Monitors configured signal sources (RSS feeds, social listening, news APIs, trend databases). Produces structured signal objects. High autonomy (80) — runs continuously with minimal supervision.
- [ ] **Step 3:** Create OP-002 — Activation Planner. Runs op_evaluate and contributes to op_alert. Cross-references signals against client portfolios and agency capacity. Produces activation briefs with recommended pipelines, timelines, and resource estimates.
- [ ] **Step 4:** Commit: `git add agents/OP-*.md && git commit -m "feat(opportunity): add 3 OP agent skill files"`
