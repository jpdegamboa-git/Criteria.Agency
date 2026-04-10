# criteria.agency — Technical Architecture

> Last updated: April 9, 2026
> Status: Active — Architecture definition phase (stack revised Session 12)

---

## Overview

This document defines the technical stack, data model, agent orchestration framework, communication architecture, and infrastructure for criteria.agency — an AI-powered marketing platform with 24 motors, ~29 specialized agents (+ skills + system functions), and multi-tenant SaaS architecture.

> **Stack Revision (April 9, 2026):** Major changes: Inngest replaces custom state machine for orchestration. Vercel AI SDK replaces Claude Agent SDK for multi-model support. pgvector added for Output Registry. BetterStack replaces Sentry. **Langfuse** for LLM cost observability (was Helicone per DEC-147 — replaced in DEC-228 after Helicone acquisition by Mintlify closed new signups). See DEC-139 through DEC-147 and DEC-228.

---

## Agent Orchestration

### Framework: Inngest + Vercel AI SDK (DEC-140, DEC-141)

**Inngest** for workflow orchestration (each motor pipeline is an Inngest function, each pipeline step is an Inngest step, cross-motor communication via Inngest events) + **Vercel AI SDK v6** for agent invocation (multi-model: Anthropic, OpenAI, Google via unified TypeScript API).

**Two invocation patterns (DEC-141):**
- `generateText()` for simple tasks: classification, summaries, simple extraction
- Agent with tools for complex tasks: strategy, creative direction, evaluation

**Rationale:**
- Inngest replaces the custom state machine + Redis/BullMQ Event Bus. Custom orchestration works for 1 motor but becomes fragile with 24 motors × 3 lifecycle modes × multiple clients. Inngest provides durable execution, automatic retries, event routing, and operational visibility out of the box (DEC-140)
- Vercel AI SDK replaces Claude Agent SDK. System requires multi-model invocation by design: MARA Intent Classification with Haiku, Strategist with Sonnet/Opus, Analyst Monitoring with Haiku. Claude Agent SDK is Claude-only. Vercel AI SDK provides unified API across providers — switching models is a string change (DEC-141)
- Model selection is dynamic — managed per agent × skill via the prompt_registry table (DEC-145)

### Shared Orchestration Framework

All 24 motors share the same orchestration patterns but define their own pipelines:

- **Motor pipeline** → Inngest function (receives event, validates Zod schema, verifies tenantId, executes steps)
- **Pipeline step** → Inngest step (durable, retryable, independently observable)
- **Gate evaluation** → Decision point within the Inngest function (pass → advance, fail → iterate)
- **3+3 rule** → Iteration tracking per agent per task per gate (3 normal → 3 with leader adjustment → human escalation)
- **Cross-motor events** → Inngest events (replacing Redis pub/sub)
- **Lifecycle management** → Project, Continuous, and Hybrid motor modes
- **Autonomy enforcement** → Check configurable autonomy setting at gate level

### Orchestration Requirements

1. **Pipeline as Inngest function:** Each motor's pipeline is an Inngest function. Steps are durable and retryable
2. **Agent dispatch:** Invoke correct agent(s) for each step via Vercel AI SDK, pass them context + tenant context
3. **Gate routing:** On gate pass → advance. On gate fail → route for iteration
4. **3+3 rule enforcement:** Track attempts per agent per task, trigger leader adjustment after 3, escalate after 6
5. **Human override:** At any point, pause the pipeline and hand off to a human
6. **Cross-motor events:** Inngest events replace Redis pub/sub for inter-motor communication
7. **Lifecycle management:** Handle Project, Continuous, and Hybrid motor modes
8. **Autonomy enforcement:** Check configurable autonomy setting before critical actions
9. **Tenant isolation:** Every Inngest function verifies tenantId as first step (DEC-148). Never store sensitive data in step state — pass IDs only
10. **Audit trail:** Log every agent invocation, every decision, every gate review. Langfuse tracks LLM costs per agent per client (DEC-228, supersedes DEC-147)

---

## Communication Architecture

### Intra-Motor: Inngest Steps

Within a motor pipeline (a single Inngest function), agents communicate via Inngest steps. Each step receives context from the previous step's return value and reads full data from the database (never from step state — DEC-148). The motor's Inngest function orchestrates the sequence: which agent runs, what inputs it receives, and what gate evaluates the output.

### Cross-Motor: Inngest Events (DEC-140)

Motors communicate asynchronously via Inngest events. When a motor completes a significant action, it sends an Inngest event that other motor functions can listen for and react to. This replaces the previous Redis + BullMQ Event Bus design.

**Event categories (30+):**
- Strategy events: `strategy/completed`, `strategy/budget.allocated`, `strategy/audience.defined`
- Brand events: `brand/dna.created`, `brand/dna.updated`, `brand/violation.detected`
- Content events: `content/created`, `content/approved`, `content/published`
- Listener events: `listener/opportunity.detected`, `listener/trend.identified`, `listener/competitor.alert`
- Distribution events: `distribution/campaign.launched`, `distribution/email.sent`, `distribution/post.published`
- Analytics events: `analytics/report.ready`, `analytics/anomaly.detected`, `analytics/goal.reached`
- Security events: `security/violation`, `security/audit.complete`, `security/threat.detected`
- System events: `system/motor.started`, `system/motor.paused`, `system/gate.evaluated`

**Communication patterns:**
- **Fan-out:** One event triggers multiple Inngest functions (e.g., `brand/dna.updated` → all motors refresh brand context)
- **Chain:** Event triggers cascade (e.g., strategy → brief → multiple creation motors)
- **Broadcast:** System-wide notifications (e.g., emergency pause)

**Security (DEC-148):** Every Inngest function must verify webhook signature, validate event schema with Zod, and verify tenantId against DB as first step. Never store sensitive data in Inngest step state — pass IDs and references only.

---

## Data Model

### Current Schema (6 tables — Video motor only)

```
clients         — Client account info, brand assets
projects        — Project metadata, status tracking, current gate
artifacts       — Generated outputs at each pipeline step (versioned)
gateReviews     — Quality gate evaluation records (scores, decisions)
agentExecutions — Agent execution audit trail (attempts, costs, I/O artifacts)
modelConfigs    — AI model selection and parameters per project/task
```

### Schema Expansion Needed

The current 6 tables need significant expansion to support the full platform:

**Multi-tenancy & Auth:**
- `users` — User accounts (Better Auth managed)
- `organizations` — Tenant/client organizations
- `memberships` — User-to-org with roles (owner, admin, editor, viewer)
- `sessions` — Auth sessions (Better Auth managed)

**Motor & Agent System:**
- `motors` — Motor configurations per tenant (enabled motors, autonomy settings)
- `motorExecutions` — Motor-level execution tracking (lifecycle, status)
- `agentPermissions` — Declared permissions per agent (artifacts, tools, APIs, cost limits)
- `criticalActionQueue` — Pending critical actions awaiting human approval

**Communication:**
- `eventLog` — Event Bus message log (for replay, debugging, audit)
- `eventSubscriptions` — Motor subscriptions to event types

**Secrets & Security:**
- `clientSecrets` — Encrypted client API keys (AES-256-GCM, per-tenant salt)
- `securityEvents` — Security audit trail (violations, alerts, incidents)
- `auditLog` — Comprehensive action audit trail

**Content & Distribution:**
- `brandDna` — Brand identity documents per tenant
- `campaigns` — Marketing campaigns (funnel stage, channel, status)
- `channels` — Channel configurations per tenant (API credentials reference, settings)
- `contentCalendar` — Scheduled content across channels

**Analytics:**
- `metrics` — Aggregated performance metrics per channel/campaign
- `reports` — Generated analytics reports

### State Machine (per motor)

Each motor defines its own pipeline, but all use the same state machine engine:

```
Video:    BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL → STORYBOARD → [G3] → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
Ads:      BRIEF → STRATEGY → [G1] → CREATIVE → [G2] → TARGETING → LAUNCH → [continuous optimization loop]
Email:    BRIEF → STRATEGY → LIST → CONTENT → [G1] → TEST → SEND → [continuous measurement loop]
Events:   BRIEF → CONCEPT → [G1] → PLANNING → LOGISTICS → [G2] → PROMOTION → EXECUTION → FOLLOWUP → [G3] → DELIVERED
```

---

## Recommended Stack

### Frontend (3 portals)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Server components, SSR for SEO, shared components across 3 portals. Largest React ecosystem for UI, charting, integrations |
| Styling | Tailwind CSS | Rapid prototyping, consistent design system |
| State management | React Server Components + minimal client state | Most data flows server → client |
| Real-time updates | Server-Sent Events (SSE) | Pipeline progress, alerts, agent status updates |
| Icons | Lucide | Consistent, lightweight |

**Alternatives considered (Session 12):** SvelteKit 2 (3.2x faster SSR, smaller bundles — rejected: smaller ecosystem critical for solo founder), React Router v7 (no vendor lock-in — rejected: less tooling), Nuxt 4 (best module system — rejected: Vue ecosystem smaller).

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API | Hono (TypeScript) | Lightweight (1.8M weekly npm downloads), TypeScript-native, edge-compatible, portable |
| **Workflow orchestration** | **Inngest** | **Event-driven durable workflows. Replaces custom state machine + BullMQ for pipeline orchestration. Handles retries, state persistence, and 3+3 rule. Dashboard for visibility. Free tier: 50K executions/month (DEC-140)** |
| **AI framework** | **Vercel AI SDK (v6)** | **Multi-model (Anthropic, OpenAI, Google, Mistral) with unified TypeScript API. Two invocation patterns: generateText() for simple tasks (classification, summaries), agent with tools for complex (Strategist, Brand Builder). Replaces Claude Agent SDK (DEC-141)** |
| Auth | Better Auth | Open-source, orgs/roles/permissions, Hono-native, MIT license. Requires POC validation of multi-org before commitment; Clerk as fallback (DEC-142) |
| Validation | Zod | Input validation on every endpoint |

**Orchestration change rationale (DEC-140):** Custom state machine works for 1 motor but becomes fragile with 24 motors × 3 lifecycle modes × 17 Strategist triggers × MARA sessions × multiple clients. Inngest provides durable execution, automatic retries, event routing, and operational visibility out of the box. Each motor's pipeline becomes an Inngest function. Cross-motor events become Inngest events (replacing Redis pub/sub for Event Bus). Redis scope reduces to cache + rate limiting.

**AI framework change rationale (DEC-141):** System requires multi-model invocation by design: MARA Intent Classification with Haiku ($0.25/M input), Strategist with Sonnet/Opus ($3-15/M), Analyst Monitoring with Haiku. Claude Agent SDK is Claude-only. Vercel AI SDK provides unified API across providers — switching models is a string change. Also supports streaming (critical for MARA responses) and structured outputs natively.

### Data

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Primary database | PostgreSQL (Neon or Supabase) | Relational data, managed. Both support pgvector. Neon: branching, scale-to-zero (good for dev). Supabase: more features (real-time, auth, storage) at $25/mo. Evaluate at implementation time (DEC-143) |
| **Vector search** | **pgvector (in PostgreSQL)** | **Semantic search for Output Registry (DEC-130). Embedded in PostgreSQL — no separate service. Sufficient for platform scale (thousands of outputs, not millions). Drizzle has documented pgvector integration (DEC-144)** |
| ORM | Drizzle | Type-safe, lightweight (7.4KB vs Prisma's 1.6MB), 14x faster on complex joins. Surpassed Prisma in weekly downloads (5.1M vs 4.3M, Q1 2026) |
| Cache | Redis (Upstash) | Scope reduced with Inngest adoption: session data, rate limiting, temporary cache only. Free tier: 256MB, 500K commands/month |
| **Prompt registry** | **PostgreSQL table** | **Versioned system prompts per agent × skill. Fields: agent_id, skill_id, version, system_prompt, knowledge_base_ref, model, active. Enables prompt iteration without redeploy (DEC-145)** |
| Internal storage | Cloudflare R2 | Production assets, iterations — zero egress cost. Cloudflare for Startups: $5K credits |
| Video delivery | Bunny Stream | Adaptive bitrate, CDN, DRM/hotlink protection |

### AI Models

| Task Type | Invocation Pattern | Recommended Models | Used By |
|-----------|-------------------|-------------------|---------|
| Complex reasoning (strategy, evaluation, creative direction) | Agent with tools (Vercel AI SDK) | Claude Opus/Sonnet | Strategist, Brand Builder, Analyst Diagnostic Delivery, Creative Director |
| Intent classification, composition, summaries | generateText() (Vercel AI SDK) | Claude Haiku | MARA, Analyst Monitoring, session summaries |
| Text generation (copy, scripts, emails, posts) | generateText() or agent | Claude Sonnet/Haiku | Writer, Email agent, Community Manager |
| Narrative reports | generateText() with long context | Claude Sonnet | Analyst Reporting skill |
| Image generation (designs, storyboards, ads) | External API | Flux, Midjourney, DALL-E 3 | Design motor, Ads creative, Video storyboards |
| Video generation | External API | Runway, Kling, Sora, Veo | Video motor |
| Voice/Music/SFX | External API | ElevenLabs, Suno, Udio | Audio motor |
| Transcription | External API | Whisper | Subtitle agents |

Model selection is dynamic — managed per task via the prompt registry. The two-pattern approach (generateText for simple, agent for complex) reduces LLM overhead by ~37% compared to running everything as full agents.

---

## Infrastructure

### Hosting

| Component | Technology | Phase | Alternative |
|-----------|-----------|-------|-------------|
| Frontend (3 portals) | Vercel | MVP → Scale | Cloudflare Pages |
| Backend API | Railway | MVP (simplicity) | Fly.io (scale — 35+ regions, better LATAM latency) |
| Workflow execution | Inngest (managed) | MVP → Scale | Temporal Cloud (if Inngest limits reached) |
| Database | Neon or Supabase | MVP → Scale | Railway Postgres |
| Redis | Upstash (serverless) | MVP → Scale | Railway Redis (if Upstash costs surprise) |
| Internal file storage | Cloudflare R2 | MVP → Scale | — |
| Video delivery | Bunny Stream | MVP → Scale | Mux |

**Hosting philosophy for solo founder:** Minimize services. With Inngest handling workflow orchestration and event routing, the backend (Hono on Railway) only handles HTTP requests and dispatches to Inngest. This is lightweight and cheap. Migrate to Fly.io when LATAM latency matters (>50 clients) — though LLM call latency (2-30 seconds) dominates over server latency (50-100ms) making this a low priority.

### Monitoring & Observability

| Type | Technology | Rationale |
|------|-----------|-----------|
| **Error tracking + uptime** | **BetterStack** | **Replaces Sentry + UptimeRobot. 6x cheaper than Sentry at volume. Free tier: 10 monitors, 100K exceptions/month (DEC-146)** |
| Product analytics | PostHog | Session replay, feature flags, surveys. Free tier: 1M events/month |
| **LLM cost observability** | **Langfuse** | **SDK-wrapper via centralized helper (`lib/ai/llm.ts`) that every agent uses. Logs tokens/cost/latency per agent per tenant. Critical for validating token economy (DEC-100). Free tier: 50K observations/month. Open source — self-host fallback for enterprise. (DEC-228, supersedes DEC-147)** |
| Security logs | Separate immutable log destination (Section 9.2 of Security Framework) |

### Payments

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Subscriptions + billing | Stripe | Only viable option for LATAM: supports OXXO (Mexico), PIX (Brazil), local cards. Handles subscription tiers + metered/usage-based billing for tokens + custom charges for ad spend commissions |

### SSE Real-time Events

SSE endpoint per authenticated session. Event types:
- `pipeline_update` — Step/gate changes
- `alert` — System alerts
- `agent_status` — Agent execution updates
- `cost_update` — Running cost totals
- `gate_result` — Gate evaluation results
- `motor_event` — Cross-motor events (filtered by tenant). Source: Inngest event log
- `security_event` — Security alerts (admin only)
- `notification` — User-facing notifications
- `mara_proactive` — MARA proactive messages (moderado/activo modes)
- `heartbeat` — 30-second keepalive

Auto-reconnect on disconnect.

### Cost Structure

| Phase | Monthly Cost | Breakdown |
|-------|-------------|-----------|
| **Development (months 1-3)** | **~$0** | All services on free tiers. LLM costs covered by Anthropic startup credits ($25K). Cloudflare startup credits ($5K) for R2 |
| **Beta (months 4-6, 1-5 clients)** | **~$10** | Railway $5-10. Everything else free tier |
| **Early revenue (months 7-12, 10+ clients)** | **~$50-60** | Neon $19 + Railway $10-20 + possibly Vercel Pro $20. LLM partially covered by remaining credits |
| **Sustainable (Year 2, 50+ clients)** | **~$150-300** | Paid tiers on most services. LLM fully paid from revenue |

| Cost Type | Notes |
|-----------|-------|
| **Dominant cost** | AI model API calls — ~80% of variable costs. Langfuse makes this visible per agent, per client, per month (DEC-228) |
| **Key cost drivers** | Video generation (most expensive), ad creative generation, Strategist planning sessions |
| **Cost optimization** | 3+3 rule limits iterations; early gates prevent expensive late-stage rework; cost caps per agent/day; MARA Output Registry reduces redundant LLM invocations; Haiku for simple tasks (10-20x cheaper than Sonnet) |
| **Storage optimization** | R2 (zero egress) for internal + Bunny Stream for delivery |
| **Break-even** | 1 Starter client ($99/mo) covers infrastructure. 2 clients cover infra + moderate LLM. 5 clients provide real margin |

### Startup Credit Programs

| Program | Credits | Status |
|---------|---------|--------|
| **Anthropic Startup Program** | $25K Claude API credits (12 months) | Apply immediately — Airtable form, ~2 week review |
| **Google for Startups (AI First)** | $250K GCP credits (Year 1) + $10K Anthropic bonus | Apply — equity-free, LATAM Spanish accelerator available |
| **AWS Activate** | Up to $100K | Apply — fallback for Bedrock (Claude via AWS) |
| **Cloudflare for Startups** | $5K (self-funded tier) | Apply — covers R2 storage |
| **Microsoft for Startups** | $5K-$150K | Apply — Azure OpenAI as fallback model provider |

---

## Security Architecture

Detailed in two documents:
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Original framework (OWASP, auth, encryption, tenant isolation, agent sandboxing, compliance)
- `docs/superpowers/specs/2026-04-09-security-audit-v2.md` — Post-stack-revision audit (DEC-148 through DEC-172)

### Core protections (Security Framework):

- **Auth:** Better Auth with HTTP-only cookies, session rotation, MFA for admin
- **Tenant isolation:** Middleware injects tenantId from token, all queries filter by tenant
- **Agent sandboxing:** Declarative permissions per agent, 6-point enforcement (pre-execution, tool call, data access, API call, artifact write, cost check)
- **Encryption:** TLS 1.3 in transit, AES-256-GCM for client secrets (per-tenant salt), Neon/R2 encryption at rest
- **Secrets:** System secrets in env vars, client secrets encrypted in DB with key derivation from MASTER_ENCRYPTION_KEY
- **Headers:** HSTS, CSP, X-Frame-Options, nosniff, restrictive CORS
- **Rate limiting:** Per IP + per user, different limits by endpoint type
- **Logging:** Structured JSON, sanitized (no secrets/PII), security logs immutable with 2-year retention
- **Compliance:** GDPR baseline, jurisdictional addendums for LGPD, LFPDPPP, CCPA

### Stack-specific protections (Security Audit v2):

- **Inngest:** Webhook signature verification, event schema validation, tenant verification in functions, minimal state (DEC-148)
- **Multi-model AI:** Provider security tiers (A/B/C by data sensitivity), no cross-tier fallback for confidential data, Prompt Registry security fields (DEC-149)
- **Langfuse:** Listed as sub-processor in DPA, tier-A prompts visible to vendor, self-host (docker) fallback available for enterprise clients (DEC-228, supersedes DEC-150)
- **Output Registry:** Summary-only embeddings, pre-filtering for pgvector, UUID-only content_ref, competitive cross-tenant anonymization (DEC-151, DEC-156)
- **MARA:** Safety classifier, immutable system prompt, context limit, server-side play/pause, per-session invocation budget (DEC-155, DEC-157, DEC-158)
- **Ad spend:** Phase 1 no intermediation, expanded critical actions, cumulative tracking, circuit breaker, daily reconciliation (DEC-163, DEC-164, DEC-165)
- **Content:** Content Policy Checker, TOS disclaimers, AUP (DEC-167)
- **Legal:** 5 required documents pre-launch (TOS, Privacy Policy, DPA, AUP, Cookie Policy)

---

## Related Documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — ~29 agents, chain of command (updated for MARA)
- `AGENT_REGISTRY.md` — Technical reference cards for Video motor agents
- `PRODUCTION_PIPELINE.md` — Video pipeline: 10 steps, 5 gates
- `MVP_ROADMAP.md` — Video motor phased rollout
- `PORTAL_SPECS.md` — Full portal UI/UX specifications
- `DECISION_LOG.md` — All key architectural decisions (DEC-001 through DEC-172)
- `SESSION_CONTEXT.md` — Complete project briefing
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — 24-motor architecture spec
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Security framework spec
- `docs/superpowers/specs/2026-04-09-mara-copilot-design.md` — MARA agent + Output Registry spec
- `docs/superpowers/specs/2026-04-09-growth-strategy.md` — Growth strategy, startup credits, GTM plan
- `docs/superpowers/specs/2026-04-09-security-audit-v2.md` — Security Audit v2: comprehensive risk assessment (DEC-148-172)
