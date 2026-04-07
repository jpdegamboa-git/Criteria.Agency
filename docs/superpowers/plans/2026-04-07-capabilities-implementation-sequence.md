# Capabilities Implementation Sequence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each phase plan.

**Goal:** Implement all 30 remaining capabilities across 8 engines, adding 53 agents to the platform.

**Architecture:** Each phase produces working, testable software. Phases are ordered by dependency — later phases consume outputs from earlier ones. Each phase has its own detailed plan file.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Vitest, node-cron, Gemini Flash / Claude Sonnet

---

## Dependency Graph

```
Phase 0: Shared Infrastructure ──────────────────────────────────────────┐
    │                                                                     │
    ├── Phase 1: Intelligence Engine (C-023–C-027)                       │
    │       ↓ feeds context to                                           │
    │   ┌───────────────────────────┐                                    │
    │   │                           │                                    │
    ├── Phase 2: Brand Guardian     Phase 3: Security Engine             │
    │   (C-007–C-008)              (C-045–C-047)                        │
    │       ↓ validates all              ↓ governs all                   │
    │   ┌───┴───────────────────────────┴──┐                            │
    │   │                                   │                            │
    ├── Phase 4: Sales Engine          Phase 5: Positioning Engine       │
    │   (C-028–C-032)                  (C-048–C-049)                    │
    │       ↓ feeds deals                                                │
    ├── Phase 6: Analytics Engine (C-033–C-037)                         │
    │       ↓ feeds metrics                                              │
    ├── Phase 7: Budget Engine (C-038–C-041)                            │
    │                                                                     │
    └── Phase 8: Scale Engine (C-042–C-044) ← orchestrates everything   │
```

## Phase Summary

| Phase | Engine | Caps | Agents | Est. New Files | Plan file |
|-------|--------|------|--------|----------------|-----------|
| **0** | Shared Infrastructure | — | 0 | ~8 | `2026-04-07-phase-0-shared-infrastructure.md` |
| **1** | Intelligence | C-023–C-027 | 15 | ~20 | `2026-04-07-phase-1-intelligence-engine.md` |
| **2** | Brand Guardian | C-007–C-008 | 4 | ~8 | `2026-04-07-phase-2-brand-guardian.md` |
| **3** | Security | C-045–C-047 | 6 | ~10 | `2026-04-07-phase-3-security-engine.md` |
| **4** | Sales | C-028–C-032 | 8 | ~14 | `2026-04-07-phase-4-sales-engine.md` |
| **5** | Positioning | C-048–C-049 | 4 | ~6 | `2026-04-07-phase-5-positioning-engine.md` |
| **6** | Analytics | C-033–C-037 | 7 | ~14 | `2026-04-07-phase-6-analytics-engine.md` |
| **7** | Budget | C-038–C-041 | 5 | ~10 | `2026-04-07-phase-7-budget-engine.md` |
| **8** | Scale | C-042–C-044 | 4 | ~10 | `2026-04-07-phase-8-scale-engine.md` |

## Phase 0: Shared Infrastructure

**What it builds:** Database tables, services, and middleware that multiple engines share.

**Key deliverables:**
- `ContinuousAgentRunner` service — scheduler for listener/monitoring agents
- DB migration: `continuous_agent_runs`, `alerts`, `alert_rules`, `data_source_configs`, `audit_log`, `approval_requests`
- Autonomy middleware skeleton
- Tenant isolation middleware enhancement
- Intelligence provider interface + stub factory
- Shared types for all engines

**Why first:** Every subsequent phase depends on these shared components.

## Phase 1: Intelligence Engine

**What it builds:** 4 Listeners (Brand, Culture, Industry, Competitive) + Opportunity Agent.

**Key deliverables:**
- 15 agent skill files
- 4 listener services + opportunity agent service
- Stub providers for all external data sources
- API routes for intelligence data
- Scheduled listener execution

**Why second:** Intelligence data feeds into Strategy, Brand Guardian, Positioning, Community Management, and Ads. It's the context layer for everything.

## Phase 2: Brand Guardian

**What it builds:** Brand validation system + live brand manual.

**Key deliverables:**
- 4 agent skill files (BG-L replaces XA-003 stub)
- Brand validation engine with scoring
- Brand rules system with learning
- Manual generator with shareable URL
- Gate integration across all motors

**Why third:** Brand Guardian validates content from ALL production motors. Having it early means every subsequent engine benefits from brand consistency checks.

## Phase 3: Security Engine

**What it builds:** Autonomy system, data protection, enhanced gates.

**Key deliverables:**
- 6 agent skill files
- Autonomy configuration + approval queue
- PII detection + anonymization
- Enhanced gate system (hybrid gates)
- Audit logging

**Why fourth:** Security governs all operations. Later phases (Sales, Analytics, Budget) handle sensitive client data that needs protection and autonomy controls.

## Phase 4: Sales Engine

**What it builds:** Lead management, scoring, pipeline, proposals, attribution tracking.

**Key deliverables:**
- 8 agent skill files
- Lead capture + enrichment services
- BANT scoring engine
- Pipeline management with automated follow-ups
- Proposal generation pipeline
- Touchpoint tracking for attribution

**Why fifth:** Sales needs Intelligence data (for proposals and enrichment) and Security (for data protection of lead PII). Sales data feeds Analytics and Budget.

## Phase 5: Positioning Engine

**What it builds:** Positioning diagnosis + strategic repositioning.

**Key deliverables:**
- 4 agent skill files
- Perception audit service
- Gap analysis + positioning definition
- Repositioning transition planner
- Perception tracking for repositioning monitoring

**Why sixth:** Positioning needs Intelligence (Brand/Competitive Listener data) and Brand Guardian (consistency validation). Relatively standalone — doesn't feed many other engines.

## Phase 6: Analytics Engine

**What it builds:** Dashboards, attribution computation, CAC/LTV, reports, NL queries.

**Key deliverables:**
- 7 agent skill files
- Data collectors from all active engines
- Attribution computation engine (5 models)
- CAC/LTV calculator
- Dashboard configuration system
- Report generator (daily/weekly/monthly)
- NL query engine

**Why seventh:** Analytics needs data from Sales (deals, touchpoints), Intelligence (listener metrics), and all distribution motors. It's the aggregation layer.

## Phase 7: Budget Engine

**What it builds:** Budget allocation, spend control, vendor validation, marketing ROI.

**Key deliverables:**
- 5 agent skill files
- Budget allocator with M6 frameworks
- Spend monitor with alerts
- Vendor management + price validation
- Campaign P&L calculator

**Why eighth:** Budget needs Analytics (attribution data, channel metrics) and Sales (deal data) for accurate ROI calculations and smart allocation.

## Phase 8: Scale Engine

**What it builds:** Campaign orchestration, asset registry, capacity management.

**Key deliverables:**
- 4 agent skill files
- Campaign Orchestrator (1 brief → N sub-projects)
- Brief decomposer
- Asset registry with indexing + recommendation
- Dynamic capacity management

**Why last:** Scale orchestrates ALL other motors. It needs every production and distribution motor to be available for multi-channel campaign dispatch.

---

## Cross-Phase Verification

After each phase, verify:
1. All new tests pass: `npm test`
2. Existing tests still pass (no regression)
3. DB migration applies cleanly: `npm run db:generate && npm run db:migrate`
4. Server starts without errors: `npm run dev`
5. New API endpoints respond correctly
6. New agents register in the agent registry
7. Pipeline registry includes new pipelines (if applicable)

## Notes

- Each phase plan contains full TDD steps with code
- Plans are designed for execution by agentic workers (subagents or inline)
- Stub providers use LLM to generate synthetic data — useful even without real API keys
- Every phase commits frequently — multiple commits per phase
- Phases can be parallelized where dependencies allow (e.g., Phase 2 + Phase 3 are independent)
