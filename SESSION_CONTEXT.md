# criteria.agency — Session Context & Briefing

> Last updated: April 6, 2026
> Purpose: Complete context for any new Claude session working on this project

---

## 1. What is criteria.agency

**criteria.agency** is an AI-powered marketing agency platform (SaaS) targeting small-to-medium businesses in Latin America.

### Core concept
A platform with **4 AI engines** that automate complete marketing and production workflows through specialized AI agents, while maintaining human expert control at quality gates.

### 4 Engines

| Engine | Purpose | Automation level |
|--------|---------|-----------------|
| **Video Production** | End-to-end video/film production pipeline | Full agentic (47 agents, 9 teams, 5 quality gates) |
| **Marketing AI** | Autonomous marketing campaigns: research, create, publish, measure, optimize | Full agentic (pipeline TBD) |
| **Sales** | Lead generation and qualification → human closes | Hybrid (AI prospecting, human closing) |
| **Design/Branding** | Graphic design, brand identity, visual assets with AI | Agentic (pipeline TBD) |

### Shared agent framework
All engines share the same orchestration framework but define their own:
- Pipeline steps
- Quality gates
- Agent teams and roles
- Escalation rules

### Clients / Business units

| Client | Uses | Mission |
|--------|------|---------|
| **CriteriaFilms.com** (1st client) | Video engine + Marketing engine | Find niches/themes, produce films, sell them |
| **criteria.agency** (2nd client — dogfooding) | Marketing engine + Sales engine | Market itself, acquire new clients |

### Business model
Per-module SaaS subscriptions with 3 tiers (Free/Pro/Enterprise). Modules bundle into simplified "Spaces" for better UX.

---

## 2. Tech Stack (decided)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | RSC, SSR for SEO, 3 apps (admin, client portal, public site) |
| **Backend API** | Hono (TypeScript) | Lightweight, portable, TypeScript-native |
| **Database** | PostgreSQL + Drizzle ORM | Relational data, type-safe queries, complex aggregations |
| **Cache / Queue** | Redis + BullMQ | Job queue for agent execution, caching, rate limiting |
| **Real-time** | Server-Sent Events (SSE) | Simpler than WebSockets, sufficient for dashboard monitoring |
| **Auth** | Better Auth | Open-source, orgs/roles/permissions, first-class Hono support, MIT license |
| **AI Agents** | Claude Agent SDK | Superior reasoning for quality-critical agents (Showrunner, Critic, Creative Director) |
| **AI Multi-model** | Claude + cheaper models | Team 9 manages model selection: Claude for complex tasks, Haiku/others for simple tasks |
| **File Storage** | Cloudflare R2 | Zero egress — critical for video with iterative generation cycles (3+3 rule) |
| **Video Delivery** | Bunny Stream or Mux | Transcoding, adaptive streaming, CDN |
| **Frontend Hosting** | Vercel | Optimized for Next.js |
| **Backend Hosting** | Railway or Fly.io | Hono API + agent workers |
| **Database Hosting** | Neon | Serverless PostgreSQL, scales to zero |
| **Payments** | Stripe | Subscriptions, invoicing, checkout |
| **Monitoring** | Sentry + PostHog | Error tracking + product analytics |

### Why NOT Firebase (the legacy stack)
The previous criteria.agency project used Firebase/Firestore/Genkit. We migrated because:
- Firestore limits complex queries needed by the video pipeline (JOINs, aggregations)
- Per-operation pricing scales badly with video production workloads
- High vendor lock-in across auth, database, functions, and storage
- Claude models outperform Gemini for creative/reasoning tasks required by agents

---

## 3. Current Backend State

### Database schema (6 tables — Drizzle ORM)

```
clients         — Client account info, brand assets
projects        — Project metadata, status tracking, current gate
artifacts       — Generated outputs at each pipeline step (versioned)
gateReviews     — Quality gate evaluation records (scores, decisions)
agentExecutions — Agent execution audit trail (attempts, costs, I/O artifacts)
modelConfigs    — AI model selection and parameters per project/task
```

**Enums:** projectType (6), projectStatus (11), gateType (5), artifactType (6), artifactStep (12)

### API endpoints (12 routes — Hono)

```
GET  /health                    — Health check
GET  /agents                    — List all agents from registry
POST /projects                  — Create project (auto-creates client)
GET  /projects                  — List projects
GET  /projects/:id              — Get project details
POST /projects/:id/advance      — Advance one pipeline step
POST /projects/:id/run          — Run full pipeline end-to-end
POST /projects/:id/pause        — Pause project
POST /projects/:id/resume       — Resume project
GET  /projects/:id/artifacts    — Get artifacts for project
GET  /artifacts/:id/content     — Read artifact content
GET  /projects/:id/gates        — Get gate reviews
GET  /projects/:id/executions   — Get agent executions
```

### Orchestrator (fully functional)

- **State machine** (`src/orchestrator/state-machine.ts`): `advanceProject()`, `runFullPipeline()`, `pauseProject()`, `resumeProject()`
- **Gate router** (`src/orchestrator/gate-router.ts`): `evaluateGate()` with iteration tracking, max iterations per gate type
- **3+3 rule** (`src/orchestrator/three-plus-three.ts`): 3 attempts normal → 3 attempts with leader adjustment → human escalation
- **Dispatcher** (`src/orchestrator/dispatcher.ts`): Routes tasks to correct agents per pipeline step

### Pipeline flow

```
BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL_LOOK → STORYBOARD → [G3]
  → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
```

- 10 production steps + 5 mandatory quality gates
- Gate max iterations: G1(3), G2(3), G3(2), G4(2), G5(1)
- Gate failures loop back for iteration with 3+3 escalation

### Agent system

- **47 agents total** across 9 teams (defined in `AGENT_REGISTRY.md`)
- **20 agents in Phase 1** with complete skill files in `agents/` directory
- **Mock execution mode** — generates template artifacts, tracks costs/time
- **Agent registry** (`src/agents/registry.ts`): Maps all agents with metadata (team, level, steps, gates, autonomy %)
- Each skill file defines: identity, personality, role in pipeline, modes of operation, interaction patterns, success criteria

### Other components

- **CLI** (`src/cli/index.ts`): Full project management (create, list, status, run, advance, pause, agents)
- **Storage** (`src/storage/artifacts.ts`): Local filesystem, planned migration to R2
- **Config** (`src/shared/config.ts`): Centralized config with env vars
- **Logger** (`src/shared/logger.ts`): Structured pipeline event logging

---

## 4. What Does NOT Exist Yet

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (any) | 0% | No Next.js app, no React components, no UI |
| Authentication | 0% | No auth middleware, no user model, no login |
| Multi-tenancy | 0% | No organizations, no roles, no permissions |
| Real-time (SSE) | 0% | API is pure HTTP request/response |
| Claude API integration | 0% | Agents run in mock mode only |
| Redis / BullMQ | 0% | No job queue, agents execute synchronously |
| Stripe | 0% | No payment processing |
| Marketing engine | 0% | No pipeline, no agents defined |
| Sales engine | 0% | No pipeline, no agents defined |
| Design engine | 0% | No pipeline, no agents defined |
| Deployment | 0% | Everything runs locally |
| Tests | 0% | No test framework or test files |

---

## 5. Admin Portal — Design in Progress

The admin portal spec (`PORTAL_SPECS.md`) needs a complete overhaul. A brainstorming session was in progress when this context was created. Key decisions made:

### Architecture
- The admin portal is the **unified management interface** for criteria.agency
- Combines platform management (agents, models, pipeline) + business operations (clients, content strategy, costs)
- Since there's only one user (the founder) for now, no complex RBAC needed initially

### Layout
- **Sidebar:** Collapsible (icons-only ↔ icons + text)
- **Header:** Logo + alert badge + global search + user avatar
- **Theme:** Dark mode default
- **Nav modules:** All modules visible in sidebar; unimplemented ones grayed out with "Proximamente"

### Module tiers

**Tier 1 — MVP:**

| Module | Area | Purpose |
|--------|------|---------|
| Command Center | Production | KPI cards + Kanban/Timeline toggle + alert feed |
| Project Detail | Production | 5 tabs: Pipeline, Artifacts, Gates, Costs, Activity |
| Gate Review | Production | Showrunner evaluation, pass/fail, human override |
| Agent Dashboard | Production | Performance, 3+3 status, costs, escalations |
| Model Dashboard | Production | Models in use, costs, benchmarks, selection |

**Tier 2 — Post-MVP:** Activity Log, Client Management, Content Strategy, Production Costs, Settings

**Tier 3 — Future (disabled):** Sales/Distribution, Billing, Accounting

### Command Center details
- KPI row: Active projects, In Gate, Escalations, AI cost today, Delivered this month
- Two views: Kanban (by pipeline step) and Timeline (Gantt by delivery date)
- NO drag & drop — pipeline controlled by state machine
- Alert feed with chronological events and direct links

### Alert system
- Triggers: Agent stuck (>2x avg time), 3+3 attempt 4/6, gate failed 2+, budget exceeded, new model detected
- Delivery: In-app badge + panel (no email yet)

---

## 6. Valuable Logic from Legacy Project

The legacy project at `/Users/juanpa/Agentes/criteria.agency/` (React + Firebase) contains business logic and patterns worth porting as CONCEPTS (not code):

### Patterns to port

| Pattern | What it does | Source file(s) |
|---------|-------------|---------------|
| **6 Spaces UX** | Hide 17+ modules behind 6 simple navigation spaces | `docs/ux-experience.md` |
| **Module Registry** | 17 SaaS modules with 3-tier pricing (Free/Pro/Enterprise), feature gates | `src/shared/config/moduleRegistry.ts` (1237 lines) |
| **Event Bus** | 28 typed events for decoupled cross-module communication | `src/shared/services/eventBus.ts`, `src/shared/types/eventTypes.ts` |
| **4-role multi-tenancy** | admin/executive/client/member with granular permissions | `src/shared/types/organizationTypes.ts` |
| **Funnel Matrix** | Campaigns organized by funnel stage x media type (owned/paid/earned) | `src/modules/campanas/` |
| **Brand DNA** | Brand identity injected as AI context across all agents | `src/modules/brand/` |
| **Marketing pipeline** | A(Brand DNA) → B(Ideation) → C(Production) → D(QA) → E(Distribution) → F(Measurement) | `docs/product-catalog.md` |
| **Tracking system** | Visitor, session, UTM, funnel attribution tracking | `src/shared/services/trackingService.ts` |
| **White-label** | Custom branding per tenant (domain, logo, colors, legal text) | `src/shared/contexts/whiteLabelContext.tsx` |
| **Buyer persona** | Detailed profile of target user (Marketing Manager at PyME, $500-$5K/month) | `docs/buyer-persona.md` |

### Key documents in legacy project
- `docs/buyer-persona.md` — 15-page target user analysis
- `docs/product-catalog.md` — Complete feature inventory + agent pipeline
- `docs/ux-experience.md` — "Spaces vs Modules" UX decision
- `docs/development-plan.md` — 5-phase rollout with structure definitions
- `docs/security.md` — Auth, roles, permissions, multi-tenancy, data protection

---

## 7. Key Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Stack | PostgreSQL/Hono/Next.js/Claude | Relational data, open-source, Claude quality for agents |
| Auth | Better Auth | Open-source, org/role support, Hono-native, zero lock-in |
| NOT Firebase | Migrated away | Query limits, pricing at scale, vendor lock-in, Gemini < Claude for reasoning |
| CriteriaFilms relationship | First client of criteria.agency | Not a separate platform — uses video + marketing engines |
| criteria.agency dogfooding | Second client of itself | Uses marketing + sales engines to acquire clients |
| Agent framework | Shared framework, distinct pipelines | Each engine defines its own pipeline/gates/agents on shared orchestration |
| Admin scope | Unified (platform + business ops) | One user (founder) manages everything from one portal |
| Module visibility | All visible, disabled if not built | User sees the full vision even during MVP |

---

## 8. Documentation Map

All documents are in the project root:

| File | Purpose | Lines |
|------|---------|-------|
| `PROJECT_VISION.md` | Mission, 3 business models, 3 portals, immutable principles | ~100 |
| `TECH_ARCHITECTURE.md` | Technical stack, data model, infrastructure | ~290 |
| `TEAM_STRUCTURE.md` | 9 teams, chain of command, agent responsibilities | ~300 |
| `AGENT_REGISTRY.md` | Technical reference cards for all 47 agents | ~400 |
| `PRODUCTION_PIPELINE.md` | Step-by-step production flow with gates and iteration loops | ~400 |
| `MVP_ROADMAP.md` | 3-phase rollout: 20 → 30 → 47 agents | ~225 |
| `PORTAL_SPECS.md` | UI/UX specs for public, client, and admin portals (NEEDS OVERHAUL) | ~220 |
| `DECISION_LOG.md` | Chronological log of 22+ key architectural decisions | ~300 |
| `SESSION_CONTEXT.md` | This file — complete project briefing | — |

---

## 9. Next Steps

The immediate priorities for the next session:

1. **Complete the admin portal spec overhaul** — PORTAL_SPECS.md needs to be rewritten with the full criteria.agency vision (not just video production). The brainstorming was in progress.

2. **Update TECH_ARCHITECTURE.md** — Reflect the new unified stack decisions (Better Auth, SSE, criteria.agency as platform with 4 engines).

3. **Update PROJECT_VISION.md** — Expand from CriteriaFilms-centric to criteria.agency platform vision.

4. **Define Marketing AI engine** — Pipeline steps, gates, agent teams for the autonomous marketing engine. This is the core SaaS differentiator.

5. **Begin frontend implementation** — Next.js 15 app with admin portal (Tier 1 modules).

---

## 10. Project Directories

```
/Users/juanpa/Agentes/criteria.agency/     — LEGACY (read-only reference, DO NOT MODIFY)
/Users/juanpa/Agentes/criteria.agency-2/    — ACTIVE PROJECT (all development here)
```
