# criteria.agency — Session Context & Briefing

> Last updated: April 9, 2026
> Purpose: Complete context for any new Claude session working on this project

---

## 1. What is criteria.agency

**criteria.agency** is an AI-powered marketing agency platform (SaaS) targeting small-to-medium businesses in Latin America.

### Core concept
A platform with **24 AI motors** organized in **6 categories** that automate complete marketing and production workflows through **~29 specialized AI agents** (+ skills + system functions), while maintaining human expert control at quality gates. See DEC-064. MARA (agent #29) serves as the conversational interface.

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
Token-based SaaS with 3 tiers: Starter ($99/15K tokens), Pro ($249/75K tokens), Agency ($599/300K tokens + white-label). Observe free (Listeners, Analyst, dashboards), think costs tokens (Strategist outputs), produce costs tokens (creation motor outputs). Commission on paid media: 20%/15%/10% by tier. Workshops as add-on ($29-99 pre-recorded, $500-2K live). See `docs/superpowers/specs/2026-04-08-business-model-design.md`.

---

## 2. Tech Stack (revised April 9, 2026 — DEC-139 through DEC-147)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | RSC, SSR for SEO, 3 apps (admin, client portal, public site) |
| **Backend API** | Hono (TypeScript) | Lightweight, portable, TypeScript-native |
| **Workflow Orchestration** | **Inngest** | **Replaces custom state machine + BullMQ. Durable workflows, event routing, retries, dashboard. DEC-140** |
| **AI Framework** | **Vercel AI SDK (v6)** | **Replaces Claude Agent SDK. Multi-model (Anthropic, OpenAI, Google). Two patterns: generateText() for simple, agent with tools for complex. DEC-141** |
| **Database** | PostgreSQL + Drizzle ORM + **pgvector** | Relational data, type-safe queries, vector search for Output Registry. DEC-144 |
| **Cache** | Redis (Upstash) | Scope reduced: session data, rate limiting, temporary cache only |
| **Real-time** | Server-Sent Events (SSE) | Pipeline progress, alerts, MARA proactive messages |
| **Auth** | Better Auth (POC first → Clerk fallback) | Open-source, orgs/roles/permissions, Hono-native. DEC-142 |
| **File Storage** | Cloudflare R2 | Zero egress — critical for iterative generation cycles (3+3 rule) |
| **Video Delivery** | Bunny Stream | Transcoding, adaptive streaming, CDN |
| **Frontend Hosting** | Vercel | Optimized for Next.js |
| **Backend Hosting** | Railway (MVP) → Fly.io (scale) | Hono API. Inngest handles long-running workflows separately |
| **Database Hosting** | Neon or Supabase | Both support pgvector. Evaluate at implementation. DEC-143 |
| **Payments** | Stripe | Only viable option for LATAM (OXXO, PIX, local cards). Subscriptions + usage-based + commissions |
| **Error tracking** | **BetterStack** | **Replaces Sentry + UptimeRobot. 6x cheaper. DEC-146** |
| **Product analytics** | PostHog | Session replay, feature flags, surveys |
| **LLM Observability** | **Langfuse** | **SDK-wrapper via central helper in `lib/ai/llm.ts`. Tracks tokens, cost, latency per agent per tenant. Critical for token economy validation. 50K observations/month free tier. Self-host fallback available. DEC-228 (supersedes DEC-147 — Helicone acquired by Mintlify and closed new signups).** |
| **Prompt Management** | **PostgreSQL table** | **NEW. Versioned system prompts per agent × skill. DEC-145** |

See `TECH_ARCHITECTURE.md` for full rationale, alternatives considered, and cost structure. See `docs/superpowers/specs/2026-04-09-growth-strategy.md` for startup credit programs and bootstrapping plan.

---

## 3. Agent Communication Architecture (revised DEC-140, DEC-141)

### Orchestration: Inngest (DEC-140)
Each motor pipeline is an Inngest function. Each pipeline step is an Inngest step (durable, retryable). Gates are decision points within the function. Cross-motor communication via Inngest events (replaces Redis + BullMQ Event Bus).

### Agent Invocation: Vercel AI SDK v6 (DEC-141)
Two patterns: `generateText()` for simple tasks (classification, summaries), agent with tools for complex tasks (strategy, creative direction, evaluation). Multi-model: Anthropic, OpenAI, Google via unified TypeScript API. System prompts loaded from prompt_registry table (DEC-145).

### Cross-Motor Communication
Motors communicate asynchronously via Inngest events (30+ event types). Patterns: fan-out, chain, broadcast. Every Inngest function verifies webhook signature, validates event schema with Zod, and verifies tenantId as first step (DEC-148).

### Agent Tooling
~40 tools in 7 categories (Universal, AI Generation, External APIs, Data, Communication, File/media, Security) with per-agent permission declarations.

---

## 4. Current Implementation State (audited April 9, 2026)

### Architecture

- **Monorepo** with pnpm workspaces: `apps/api/`, `packages/db/`, `web/` (standalone)
- **Legacy `src/` directory** exists (203 TS files) — pre-monorepo architecture, read-only reference

### Database (22 tables — Drizzle ORM + pgvector)

PostgreSQL via `DATABASE_URL` (Neon/Supabase agnostic). pgvector enabled for 1536-dim embeddings.

**Auth tables (Better Auth):** user, session, account, organization, member, invitation
**Infrastructure:** motors, motorExecutions, agentPermissions, promptRegistry, outputRegistry (pgvector)
**Brand Builder:** brandDna, brandDnaArtifacts, brandHealthScores
**Strategist:** strategicDiagnoses, marketingPlans, marketingPlanCampaigns, platformIntelligenceBenchmarks
**Analyst:** campaigns, campaignKpis, thresholdAlerts
**Video Motor:** videoProjects, videoArtifacts, videoGateReviews

### API (Hono — apps/api/)

**Middleware stack:** Security headers (CSP, HSTS, X-Frame), CORS, auth, tenant isolation, request logging.

**Routes implemented:**
- `GET /health` — public health check
- `/api/auth/*` — Better Auth (sign-in, sign-up, session, org management)
- `/api/prompts` — Prompt Registry CRUD (GET, POST, GET/:id, PUT/:id)
- `/api/brand-builder` — Onboarding (Path A/B), Brand DNA CRUD, Fundamentos score, artifacts, undo
- `/api/video-motor` — Project CRUD, artifacts, gate reviews, G3 approval
- `/api/analyst` — Brand Health Score (CRUD + history + recalculate), campaigns, KPIs, threshold alerts, Output Registry (index + semantic search), dashboard aggregation
- `/api/strategist` — PI benchmarks/patterns, diagnostics, marketing plans, campaign briefs, approval workflows (G3, G6)
- `/api/inngest` — Inngest serve handler + e2e test endpoint

### Inngest Functions (12 functions, ~4,780 LOC)

**Brand Builder (4 functions, ~2,390 LOC):**
- Layer 0 Onboarding (414 LOC): Path A (URL scrape) + Path B (Q&A), auto-fills Brand DNA
- Layer 1 Discovery (473 LOC): Brand Strategist agent, validates Layer 0
- Layer 2 Strategic Depth (568 LOC): Differentiation, messaging, tone
- Layer 3 Identity Systems (535 LOC): Visual identity, naming, voice guidelines

**Video Motor (1 function, ~1,798 LOC):**
- Full pipeline: ideation → storyboard → production → delivery with gate reviews

**Analyst (2 functions, ~321 LOC):**
- BHS Daily recalculation (209 LOC)
- Threshold Check alerting (112 LOC)

**Strategist (3 functions, ~619 LOC):**
- Diagnostic (166 LOC): triggered by BHS changes, brand updates, anomalies
- Planning (269 LOC): multi-campaign plan generation
- Campaign Design (184 LOC): brief pre-configuration

**Infrastructure (1 function, ~149 LOC):**
- E2E Loop test: validates schema → verifies tenant → loads prompt → invokes Claude → saves to outputRegistry

### Auth & Security

- **Better Auth v1.6.2** with multi-org plugin (organization, roles). No Clerk — fully committed.
- Auth middleware enforces 401/403 on protected routes
- Tenant isolation: all queries filter by organizationId
- Level 1 security tests exist for auth middleware

### AI Integration

- **Vercel AI SDK v6.0.154** with Anthropic provider (`@ai-sdk/anthropic`)
- **Langfuse observability** via `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` (DEC-228, supersedes Helicone)
- Both invocation patterns implemented: `generateText()` + agent with tools

### Seed Data

- Idempotent seed script (888 LOC): test user (admin@criteria.agency), test org (CriteriaFilms), motor config, prompt registry entries

### Frontend (web/ — standalone Next.js 16)

- Next.js 16.2.2 app (NOT yet in monorepo)
- Routes: auth (sign-in, sign-up, callback), admin (projects, agents, canvas, finances), client (home, brand, campaigns), pricing, waitlist
- Components: KPICard, IdeaCard, OpportunityCard, PortalCard, SectionHeader, PortalButton
- Better Auth session integration — **not yet wired to monorepo API**
- Uses mock data for portal views

### Testing

- **71 test files total:**
  - `apps/api/test/` — 10 files (auth, health, inngest, seed, security headers, brand-builder, e2e-loop, logger)
  - `packages/db/test/` — 2 files (schema, integration)
  - `web/__tests__/` — 1 file
  - `src/` (legacy) — 58 files (pre-monorepo, reference only)

---

## 5. What Does NOT Exist Yet

| Component | Status | Notes |
|-----------|--------|-------|
| Web Motor implementation | 0% | Spec complete (DEC-217-223), no code yet. Video Motor routes exist but Web Motor tables/pipeline not created |
| Frontend ↔ API integration | 0% | Next.js app exists but uses mock data, not wired to monorepo API |
| Real-time (SSE) | 0% | API is pure HTTP request/response |
| Stripe | 0% | No payment processing |
| CI/CD | 0% | No deployment pipeline |
| Deployment | 0% | Everything runs locally |
| Brand Guardian agent | 0% | Spec exists, no implementation |
| Creative Director agent | 0% | Spec exists, no implementation for Web Motor pipeline |
| Distribution motors | 0% | Ads, Email, Community Management, SEO — all post-MVP |
| MARA (copilot) | 0% | Spec complete, implementation in Fase 6 |

---

## 6. Specifications Completed

| Spec | Lines | Covers |
|------|-------|--------|
| `PORTAL_SPECS.md` | ~841 | Admin portal (24 motors, Mission Control, backoffice), Public portal, Alert system, SSE, Design system, Permission matrix. **Client portal section (§3) superseded by navigation spec below** |
| `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md` | ~400 | **Client Portal navigation: Funnel Matrix Home, no sidebar, header dropdowns, Brand Health Score, onboarding, AI Copilot** |
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | ~943 | All 24 motors (taxonomy, pipelines, agents, gates), Shared orchestration framework, Event Bus, Agent communication, Agent tooling, Cross-motor integration, 4-phase rollout. **§4.1 Strategist Pipeline superseded by Strategist motor spec** |
| `docs/superpowers/specs/2026-04-06-security-framework-design.md` | ~857 | Threat model, OWASP compliance, infrastructure security, data protection (GDPR baseline), agent security (sandboxing, prompt injection, permissions), secrets management, auth, operational security, compliance matrix, implementation priorities |
| `docs/superpowers/specs/2026-04-08-brand-builder-motor-design.md` | ~570 | **Brand Builder motor: layers 0-3, Brand Strategist agent (5 skills), gates, continuous mode (5 triggers), cross-motor assets. DEC-074 to DEC-086** |
| `docs/superpowers/specs/2026-04-08-strategist-motor-design.md` | ~500 | **Strategist motor: 5 skills (Diagnostic, Planning, Campaign Design, Optimization, Campaign Learning), 17 triggers, gates, Analyst/Strategist separation, pre-configured campaigns, Platform Intelligence concept, token cost model. DEC-087 to DEC-101** |
| `docs/superpowers/specs/2026-04-08-business-model-design.md` | ~300 | **Business model: 3 tiers, token economy, commission model, workshops, unit economics. DEC-067 to DEC-073** |
| `docs/superpowers/specs/2026-04-08-analyst-motor-design.md` | ~550 | **Analyst motor: hybrid (system functions + 1 agent), 3 skills (Monitoring, Diagnostic Delivery, Reporting), Brand Health Score complete spec, Data Ingestion Layer, PI benchmark-only access, frequency model. DEC-121 to DEC-126** |
| `docs/superpowers/specs/2026-04-09-mara-copilot-design.md` | ~600 | **MARA (client copilot): agent #29, 3 skills (Intent Classification, Conversation Management, Response Composition), routing taxonomy, Output Registry (new shared infra), play/pause token model, session memory, 3 interaction modes, tier differentiation. DEC-127 to DEC-138** |
| `docs/superpowers/specs/2026-04-09-growth-strategy.md` | ~400 | **Growth strategy: bootstrapped $0 runway via startup credits (Anthropic $25K, Google $250K, Cloudflare $5K), free tier stack, CriteriaFilms-first GTM, 4 acquisition channels, timeline to 10 paying clients in 12 months** |
| `docs/superpowers/specs/2026-04-09-security-audit-v2.md` | ~800 | **Security Audit v2: comprehensive risk assessment post-stack revision. 13 risk domains, 25 new decisions (DEC-148-172). Covers: Inngest security, multi-model data tiers, MARA hardening, Output Registry, ad spend, white-label, content safety, legal/regulatory, solo founder ops** |

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

## 8. Client Portal — Design Complete (Superseded by navigation spec)

**See `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md` for the authoritative design.**

Key changes from original design:
- **No sidebar.** Dual view: Grid de Campañas (Home) + Funnel Matrix (toggle)
- **Header dropdowns:** Tools, Brujula (intelligence), Campana (notifications), Avatar (Mi Negocio, Mi Cuenta, Settings)
- **Campaign hierarchy:** Campaña → Versión → Activación → Pieza
- **Brand Health Score:** 3 axes (Fundamentos, Ejecución, Oportunidad). Analyst calculates, Strategist interprets.
- **Strategist recommendations everywhere:** pre-configured campaigns in Grid, recommended cells in Matrix, score interpretations
- **Tiered access:** Starter (self-service), Pro (+ MARA full), Agency (+ white-label + workshops)
- **MARA (copilot):** Agent #29. Conversational interface to the entire platform. Play/pause toggle controls token-consuming invocations. Available in all tiers with depth varying by tier. Output Registry as shared infrastructure for serving existing agent outputs. See `docs/superpowers/specs/2026-04-09-mara-copilot-design.md`

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
| Platform architecture | 24 motors, ~29 agents + skills + system functions | Agent (judgment) vs Skill (expertise) vs System Function (automation). Reduced from ~125. See DEC-064. MARA added as #29 |
| Motor lifecycle | 3 modes (Project/Continuous/Hybrid) | Different motors operate fundamentally differently |
| Configurable autonomy | User chooses per motor | Balance between automation and human control |
| Client navigation | Dual view (Grid + Funnel Matrix), no sidebar, header dropdowns | DEC-046 through DEC-063 |
| Brand Builder | Layers of depth (0-3), Brand Strategist with 5 skills, hybrid mode | DEC-074 through DEC-086 |
| Strategist | 1 agent with 5 skills, Analyst/Strategist separation, pre-configured campaigns | DEC-087 through DEC-101 |
| Platform Intelligence | Shared knowledge layer, cross-client learning, public KPIs | DEC-092, DEC-093, DEC-094, DEC-095 |
| Analyst motor | Hybrid motor (system functions + 1 agent), 3 skills, Brand Health Score calculation, Data Ingestion Layer as shared infra | DEC-121 through DEC-126 |
| MARA (client copilot) | Agent #29, conversational interface, play/pause token model, Output Registry, 3 interaction modes, single face principle | DEC-127 through DEC-138 |
| Stack revision | Inngest (orchestration), Vercel AI SDK (multi-model), pgvector, BetterStack, Langfuse (was Helicone — DEC-228), prompt registry | DEC-139 through DEC-147 |
| Security Audit v2 | Inngest hardening, AI provider tiers, MARA multi-layer defense, Output Registry hardening, ad spend phasing (no intermediation MVP), legal docs required, solo founder ops | DEC-148 through DEC-172 |
| Token cost model | Observe free, think costs tokens, produce costs tokens | DEC-100 |
| Budget from economics | Margin × market × CAC, not arbitrary client input | DEC-101 |
| Security baseline | GDPR | Strictest standard simplifies multi-jurisdiction compliance |
| Brand Health Score | 3 axes (33/33/33), daily recalculation, intraday trend indicator. Analyst calculates, Strategist interprets | DEC-126, Analyst spec §11 |
| Funnel Matrix | Central organizing concept | Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned |
| Strategist knowledge | Harvard M1-M6 + Godin + Platform Intelligence | Static frameworks + dynamic cross-client learning |

---

## 11. Documentation Map

### Core Documents

| File | Purpose | Status |
|------|---------|--------|
| `BUILD_ORDER.md` | Integrated implementation plan — 8 phases with dependencies and deliverables | **Approved** |
| `CLAUDE.md` | Instructions for Claude Code — immutable stack, architecture rules, spec references | **Ready** |
| `DECISION_LOG.md` | Chronological log of all architectural decisions (DEC-001 to DEC-227) | Updated |
| `SESSION_CONTEXT.md` | This file — complete project briefing | Updated |
| `TECH_ARCHITECTURE.md` | Technical stack, data model, communication architecture, infrastructure | Updated |
| `PORTAL_SPECS.md` | Full platform UI/UX spec (admin, client, public portals) | Complete |
| `PROJECT_VISION.md` | Mission, business models, platform identity, immutable principles | Updated |
| `PRODUCTION_PIPELINE.md` | Video pipeline: 10 steps, 5 gates, iteration loops | Active (Video motor) |

### Legacy Documents (pre-consolidation, read-only reference)

| File | Purpose | Status |
|------|---------|--------|
| `TEAM_STRUCTURE.md` | 9 teams (Video motor), chain of command | Pre-DEC-064 (47 → ~29 agents). Reference only |
| `AGENT_REGISTRY.md` | Technical reference cards for Video motor agents | Pre-DEC-064. Reference only |
| `MVP_ROADMAP.md` | 3-phase rollout for Video motor | Superseded by BUILD_ORDER.md |

### Authoritative Spec Documents

See `CLAUDE.md` for the definitive mapping of which spec to read per component. See `docs/superpowers/specs/SPEC_INDEX.md` for full index with vigency status.

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-04-08-brand-builder-motor-design.md` | Brand Builder motor (DEC-074 to DEC-086) |
| `docs/superpowers/specs/2026-04-09-web-motor-design.md` | Web Motor — sites, microsites, landing pages, blogs (DEC-217 to DEC-223) |
| `docs/superpowers/specs/2026-04-08-strategist-motor-design.md` | Strategist motor (DEC-087 to DEC-101) |
| `docs/superpowers/specs/2026-04-08-analyst-motor-design.md` | Analyst motor (DEC-121 to DEC-126) |
| `docs/superpowers/specs/2026-04-08-platform-intelligence-design.md` | Platform Intelligence (DEC-102 to DEC-120) |
| `docs/superpowers/specs/2026-04-09-mara-copilot-design.md` | MARA copilot + Output Registry (DEC-127 to DEC-138) |
| `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md` | Client Portal navigation (DEC-046 to DEC-063) |
| `docs/superpowers/specs/2026-04-08-business-model-design.md` | Business model + token economy (DEC-067 to DEC-073) |
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | Complete 24-motor platform architecture |
| `docs/superpowers/specs/2026-04-06-security-framework-design.md` | Security framework |
| `docs/superpowers/specs/2026-04-09-security-audit-v2.md` | Security Audit v2 post-stack revision (DEC-148 to DEC-172) |
| `docs/superpowers/specs/2026-04-09-growth-strategy.md` | Growth strategy, startup credits, GTM |

### Reference Documents

| File | Purpose |
|------|---------|
| `docs/brain/M1-M6_Summary.pdf` | Harvard Digital Marketing Strategy course (Strategist knowledge base) |

---

## 12. Next Steps

### Design — COMPLETE (227 decisions)
All specs are complete. 227 decisions (DEC-001 to DEC-227). No pending design work blocks implementation.

### Implementation State (audited April 9, 2026)

| Phase | Status | Detail |
|-------|--------|--------|
| Fase 0 (Cimientos) | **COMPLETE** | Monorepo, Hono, Drizzle+pgvector, Better Auth multi-org, tenant isolation, Inngest, Vercel AI SDK + Langfuse (was Helicone — DEC-228), Prompt Registry, e2e loop test. 12 test files. |
| Fase 1 (Brand Builder) | **FUNCTIONAL** | Routes + 4 Inngest functions (Layers 0-3) + Brand DNA tables. ~2,390 LOC. Needs validation against spec (gates, 3+3 rule, Brand Guardian, coherence gate). |
| Fase 2 (Web Motor) | **NOT STARTED** | Spec complete (DEC-217-223). Video Motor routes/tables exist but Web Motor pipeline not implemented. |
| Fase 3 (Analyst) | **FUNCTIONAL** | Routes + 2 Inngest functions (BHS daily, threshold check) + Output Registry with semantic search. Needs validation against spec. |
| Fase 4 (Strategist) | **FUNCTIONAL** | Routes + 3 Inngest functions (diagnostic, planning, campaign design) + PI benchmarks. Needs validation against spec. |
| Fase 5 (Admin UI) | **PARTIAL** | Frontend exists (Next.js 16 at `/web/`) with admin and client routes, but uses mock data. Not wired to API. |
| Fases 6-8 | **NOT STARTED** | — |

### Next: Validate Fase 1 against spec
The infrastructure (Fase 0) is solid. The next step is to validate that Brand Builder implementation matches the spec in detail — gates, 3+3 rule, Brand Guardian function, coherence checks. Then proceed to Web Motor (Fase 2). See `BUILD_ORDER.md` for full plan.

---

## 13. Project Directories

```
/Users/juanpa/Agentes/criteria.agency/     — LEGACY (read-only reference, DO NOT MODIFY)
/Users/juanpa/Agentes/criteria.agency-2/    — ACTIVE PROJECT (all development here)
```
