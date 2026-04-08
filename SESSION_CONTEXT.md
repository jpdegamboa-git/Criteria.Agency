# criteria.agency — Session Context & Briefing

> Last updated: April 6, 2026
> Purpose: Complete context for any new Claude session working on this project

---

## 1. What is criteria.agency

**criteria.agency** is an AI-powered marketing agency platform (SaaS) targeting small-to-medium businesses in Latin America.

### Core concept
A platform with **24 AI motors** organized in **6 categories** that automate complete marketing and production workflows through ~125 specialized AI agents, while maintaining human expert control at quality gates.

### 6 Motor Categories

| Category | Motors | Purpose |
|----------|--------|---------|
| **Creation** | Video, Design, Web, Audio, Events, Print Production | Produce all types of content and experiences |
| **Strategy** | Brand Builder, Strategist | Define brands and marketing strategies (Harvard M1-M6 framework) |
| **Intelligence** | 4 Listeners (Brand, Culture, Industry, Competition) + Opportunity Agent | Monitor, analyze, detect opportunities |
| **Distribution** | Ads, Community Management, Email, SEO/Content | Distribute content across all channels |
| **Operation** | Sales/CRM, Analytics | Manage leads, measure, optimize |
| **Transversal** | Brand Guardian, Financial Agent, Channel Manager, Media Scout, Marketplace, Security Team | Cross-motor services that support all others |

### 3 Motor Lifecycle Modes

| Mode | Behavior | Examples |
|------|----------|---------|
| **Project** | Start → pipeline steps → gates → delivery → end | Video, Design, Events, Print, Web |
| **Continuous** | Runs indefinitely, monitoring and acting | Listeners, Community Management, Analytics, Security |
| **Hybrid** | Starts as project, enters continuous mode after launch | Ads, Email, SEO/Content, Sales/CRM |

### Configurable Autonomy
Each motor supports two autonomy modes (user chooses per motor):
- **AI decides + human supervises** — AI executes, human monitors
- **AI recommends + human approves** — AI proposes, human approves before execution

### Clients / Business Units

| Client | Uses | Mission |
|--------|------|---------|
| **CriteriaFilms.com** (1st client) | Video motor + Marketing motors | Find niches/themes, produce films, sell them |
| **criteria.agency** (2nd client — dogfooding) | Marketing + Sales motors | Market itself, acquire new clients |

CriteriaFilms.com is a marketing asset produced by criteria.agency's web motor. It has its own domain but lives internally as a campaign asset.

### Business Model
Per-module SaaS subscriptions with 3 tiers (Free/Pro/Enterprise). Modules bundle into simplified "Spaces" for client UX. Enterprise tier adds human Account Executive.

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
| **AI Agents** | Claude Agent SDK | Superior reasoning for quality-critical agents |
| **AI Multi-model** | Claude + cheaper models | Model selection managed per task: Claude for complex, Haiku/others for simple |
| **File Storage** | Cloudflare R2 | Zero egress — critical for iterative generation cycles (3+3 rule) |
| **Video Delivery** | Bunny Stream or Mux | Transcoding, adaptive streaming, CDN |
| **Frontend Hosting** | Vercel | Optimized for Next.js |
| **Backend Hosting** | Railway or Fly.io | Hono API + agent workers |
| **Database Hosting** | Neon | Serverless PostgreSQL, scales to zero |
| **Payments** | Stripe | Subscriptions, invoicing, checkout |
| **Monitoring** | Sentry + PostHog | Error tracking + product analytics |

---

## 3. Agent Communication Architecture

### Intra-Motor Communication
Agents within a motor communicate via TaskMessage/ResultMessage:
- Leader assigns tasks to sub-agents via TaskMessage
- Sub-agents return results via ResultMessage
- Communication is synchronous within the motor's pipeline

### Cross-Motor Communication (Event Bus)
Motors communicate asynchronously via typed events on Redis + BullMQ:
- 30+ typed event categories
- Subscription patterns: fan-out, request-response, chain, broadcast
- Trigger chains enable bidirectional motor-to-motor collaboration

### Agent Tooling
~40 tools in 7 categories (Universal, AI Generation, External APIs, Data, Communication, File/media, Security) with per-agent permission declarations.

---

## 4. Current Backend State

### Database schema (6 tables — Drizzle ORM)

```
clients         — Client account info, brand assets
projects        — Project metadata, status tracking, current gate
artifacts       — Generated outputs at each pipeline step (versioned)
gateReviews     — Quality gate evaluation records (scores, decisions)
agentExecutions — Agent execution audit trail (attempts, costs, I/O artifacts)
modelConfigs    — AI model selection and parameters per project/task
```

**Note:** This schema covers the Video motor only. Needs expansion for multi-tenancy, agent permissions, secrets encryption, and additional motors.

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

**Note:** These endpoints have ZERO authentication, ZERO tenant isolation, and known security vulnerabilities. See SECURITY_FRAMEWORK.md Section 11 for fix priorities.

### Orchestrator (functional for Video motor)

- **State machine** (`src/orchestrator/state-machine.ts`): `advanceProject()`, `runFullPipeline()`, `pauseProject()`, `resumeProject()`
- **Gate router** (`src/orchestrator/gate-router.ts`): `evaluateGate()` with iteration tracking
- **3+3 rule** (`src/orchestrator/three-plus-three.ts`): 3 attempts normal → 3 with leader adjustment → human escalation
- **Dispatcher** (`src/orchestrator/dispatcher.ts`): Routes tasks to correct agents per pipeline step

### Video Pipeline Flow

```
BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL_LOOK → STORYBOARD → [G3]
  → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
```

### Agent System

- **~125 agents total** across 24 motors (23 teams + 9 transversal agents + 6 security agents)
- **47 agents defined** for Video motor (in `AGENT_REGISTRY.md`)
- **20 agents in Phase 1** with complete skill files in `agents/` directory
- **Mock execution mode** — generates template artifacts, tracks costs/time

### Other Components

- **CLI** (`src/cli/index.ts`): Full project management
- **Storage** (`src/storage/artifacts.ts`): Local filesystem, planned migration to R2
- **Config** (`src/shared/config.ts`): Centralized config with env vars
- **Logger** (`src/shared/logger.ts`): Structured pipeline event logging

---

## 5. What Does NOT Exist Yet

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (any) | 0% | No Next.js app, no React components, no UI |
| Authentication | 0% | No auth middleware, no user model, no login |
| Multi-tenancy | 0% | No organizations, no roles, no permissions |
| Real-time (SSE) | 0% | API is pure HTTP request/response |
| Event Bus | 0% | No cross-motor communication |
| Claude API integration | 0% | Agents run in mock mode only |
| Redis / BullMQ | 0% | No job queue, agents execute synchronously |
| Stripe | 0% | No payment processing |
| Non-video motors | 0% | Only Video motor has agents/pipeline defined |
| Security implementation | 0% | Framework spec exists, zero code |
| Tests | 0% | No test framework or test files |
| CI/CD | 0% | No deployment pipeline |
| Deployment | 0% | Everything runs locally |

---

## 6. Specifications Completed

| Spec | Lines | Covers |
|------|-------|--------|
| `PORTAL_SPECS.md` | ~841 | Admin portal (24 motors, Mission Control, backoffice), Client portal (sidebar nav — Fundamentos/Inteligencia/Ejecución/Tools), Public portal, Alert system, SSE, Design system, Permission matrix |
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | ~943 | All 24 motors (taxonomy, pipelines, agents, gates), Shared orchestration framework, Event Bus, Agent communication, Agent tooling, Cross-motor integration, 4-phase rollout |
| `docs/superpowers/specs/2026-04-06-security-framework-design.md` | ~857 | Threat model, OWASP compliance, infrastructure security, data protection (GDPR baseline), agent security (sandboxing, prompt injection, permissions), secrets management, auth, operational security, compliance matrix, implementation priorities |

---

## 7. Admin Portal — Design Complete

### Layout
- **Sidebar:** Collapsible (icons-only ↔ icons+text), organized by motor category
- **Header:** Logo + alert badge + global search (Cmd+K) + user avatar
- **Theme:** Light mode default, dark mode available via toggle
- **Disabled modules:** Grayed out with "Proximamente" badge

### Module Tiers

**Tier 1 — MVP:** Mission Control, Projects, Gate Review, Agent Dashboard, Model Dashboard
**Tier 2 — Post-MVP:** Activity Log, Clients, Content Strategy, Production Costs, Settings
**Tier 3 — Future (disabled):** Sales/Distribution, Billing, Accounting

### Backoffice Modules (admin role only)
Finanzas, Contabilidad, RRHH, Proyectos Internos, Clientes/Usuarios, Analytics Interno

### Alert System
18 trigger types across 4 severities. In-app badge + slide-out panel.

---

## 8. Client Portal — Design Complete

### Left Sidebar Navigation (4 groups)

| Group | Items |
|-------|-------|
| **Fundamentos** | Business, Brand, Productos y Servicios, Revenue Streams |
| **Inteligencia** | Mercado, Competencia |
| **Ejecución** | Campaigns, Sales |
| **Tools** | Studio, Marketplace, Directorio, Drive, Reportes |

> Note: Replaced the original 6 outcome-based Spaces (Crear, Comunicar, Entender, Vender, Mi Marca, Cuenta). "Blueprint" renamed to "Business"; Plan's Mercado and Competencia tabs promoted to top-level Inteligencia items. See DEC-036.

### Tiered Access
- Free/Pro: Self-service + AI Copilot
- Enterprise: + Human Account Executive

---

## 9. Security Framework — Design Complete

### Key Decisions
- **GDPR as baseline** — strictest standard, covers LGPD/CCPA with minor adjustments
- **Hybrid secrets:** env vars (system) + encrypted DB AES-256-GCM (client secrets)
- **Layered agent sandboxing:** declarative permissions + critical action gates
- **Better Auth** for authentication with session management
- **Business Continuity Plan** for single-founder risk

### Implementation Priorities
- P0 (before deploy): Remove hardcoded creds, add auth, tenant isolation, fix path traversal, security headers
- P1 (first week): Rate limiting, CORS, input validation, log sanitization
- P2 (first month): Client secret encryption, agent permissions, audit logging, backups
- P3 (3 months): Prompt injection defense, critical action gates, cost circuit breaker, PII scanner

---

## 10. Key Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Platform architecture | 24 motors in 6 categories | Each marketing function needs its own pipeline, gates, and specialized agents |
| Motor lifecycle | 3 modes (Project/Continuous/Hybrid) | Different motors operate fundamentally differently |
| Configurable autonomy | User chooses per motor | Balance between automation and human control |
| Agent communication | Hybrid (intra-motor messages + cross-motor Event Bus) | Different communication patterns for different scopes |
| Client navigation | Left sidebar with 4 groups (Fundamentos/Inteligencia/Ejecución/Tools) | Replaced 6 outcome-based Spaces — better fit for portal's actual sections (see DEC-036) |
| Admin navigation | Real structure (motor taxonomy) | Admin needs to see and manage the actual system |
| Security baseline | GDPR | Strictest standard simplifies multi-jurisdiction compliance |
| Agent sandboxing | Soft sandbox + critical action gates | Pragmatic security without container-per-agent overhead |
| Secrets management | Hybrid (env vars + encrypted DB) | Separation of concerns, per-tenant encryption |
| CriteriaFilms relationship | Marketing asset of criteria.agency | Not separate platform — produced by web motor |
| Funnel Matrix | Central organizing concept | Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned |
| Channel Manager | Single agent + skill registry | Extensible per-channel skills (traditional + digital + custom) |
| Strategist knowledge | Harvard M1-M6 framework | Academic foundation from Digital Marketing Strategy course |

---

## 11. Documentation Map

| File | Purpose | Status |
|------|---------|--------|
| `PROJECT_VISION.md` | Mission, business models, platform identity, immutable principles | Updated |
| `TECH_ARCHITECTURE.md` | Technical stack, data model, communication architecture, infrastructure | Updated |
| `TEAM_STRUCTURE.md` | 9 teams (Video motor), chain of command, agent responsibilities | Needs expansion for other motors |
| `AGENT_REGISTRY.md` | Technical reference cards for 47 Video motor agents | Needs registries for other motors |
| `PRODUCTION_PIPELINE.md` | Video pipeline: 10 steps, 5 gates, iteration loops | Active (Video motor) |
| `MVP_ROADMAP.md` | 3-phase rollout for Video motor (20 → 30 → 47 agents) | Active (Video motor) |
| `PORTAL_SPECS.md` | Full platform UI/UX spec (admin, client, public portals) | Complete |
| `DECISION_LOG.md` | Chronological log of all key architectural decisions | Updated |
| `SESSION_CONTEXT.md` | This file — complete project briefing | Updated |

### Spec Documents

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | Complete 24-motor platform architecture |
| `docs/superpowers/specs/2026-04-06-security-framework-design.md` | Comprehensive security framework |

### Reference Documents

| File | Purpose |
|------|---------|
| `docs/brain/M1-M6_Summary.pdf` | Harvard Digital Marketing Strategy course (Strategist knowledge base) |

---

## 12. Next Steps

1. **Database Schema Evolution** — Expand from 6 tables to support multi-tenancy, agent permissions, secrets encryption, Event Bus, and additional motors
2. **API Design** — Expand from 12 video-only endpoints to full platform API contract
3. **Agent Registries per motor** — Define detailed agent cards for the ~80 non-video agents
4. **Testing Strategy** — Define what and how to test (0% coverage currently)
5. **CI/CD Pipeline** — Define deployment flow
6. **Begin frontend implementation** — Next.js 15 admin portal (Tier 1 modules)
7. **Implement P0 security fixes** — Before any public deployment

---

## 13. Project Directories

```
/Users/juanpa/Agentes/criteria.agency/     — LEGACY (read-only reference, DO NOT MODIFY)
/Users/juanpa/Agentes/criteria.agency-2/    — ACTIVE PROJECT (all development here)
```
