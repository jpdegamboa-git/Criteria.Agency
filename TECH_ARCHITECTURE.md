# criteria.agency — Technical Architecture

> Last updated: April 6, 2026
> Status: Active — Architecture definition phase

---

## Overview

This document defines the technical stack, data model, agent orchestration framework, communication architecture, and infrastructure for criteria.agency — an AI-powered marketing platform with 24 motors, ~125 specialized agents, and multi-tenant SaaS architecture.

---

## Agent Orchestration

### Framework: Hybrid approach

**Claude Agent SDK** for individual agents (each agent is a Claude tool-using agent with specialized system prompts and tools) + **custom lightweight orchestrator** for the pipeline state machine (manages which step is active, routes gate decisions, handles iteration loops).

**Rationale:**
- Individual agents benefit from Claude's reasoning capabilities (especially for quality evaluation, strategy, and creative tasks)
- The pipeline state machine is relatively simple per motor and doesn't need a heavy framework
- Avoids vendor lock-in on the orchestration layer while leveraging Claude for what it does best
- Cheaper models (Haiku, etc.) used for simple/repetitive tasks, Claude for complex reasoning

### Shared Orchestration Framework

All 24 motors share the same orchestration components but define their own pipelines:

```
src/orchestrator/
  state-machine.ts    — advanceProject(), runFullPipeline(), pauseProject(), resumeProject()
  gate-router.ts      — evaluateGate() with iteration tracking, max iterations per gate type
  three-plus-three.ts — 3 attempts normal → 3 with leader adjustment → human escalation
  dispatcher.ts       — Routes tasks to correct agents per pipeline step
  event-bus.ts        — Cross-motor Event Bus (Redis + BullMQ)
  lifecycle.ts        — Motor lifecycle management (Project/Continuous/Hybrid modes)
  autonomy.ts         — Configurable autonomy enforcement (AI-decides vs AI-recommends)
```

### Orchestration Requirements

1. **Pipeline state machine:** Track which step each project is in per motor, which gate it's approaching, iteration count
2. **Agent dispatch:** Invoke correct agent(s) for each step, pass them the right context + tenant context
3. **Gate routing:** On gate pass → advance. On gate fail → route for iteration
4. **3+3 rule enforcement:** Track attempts per agent per task, trigger leader adjustment after 3, escalate after 6
5. **Human override:** At any point, pause the pipeline and hand off to a human
6. **Cross-motor events:** Publish/subscribe events between motors via Event Bus
7. **Lifecycle management:** Handle Project, Continuous, and Hybrid motor modes
8. **Autonomy enforcement:** Check configurable autonomy setting before critical actions
9. **Tenant isolation:** Every execution carries tenantId, enforced at orchestrator level
10. **Audit trail:** Log every agent invocation, every decision, every gate review

---

## Communication Architecture

### Intra-Motor: TaskMessage / ResultMessage

Agents within a motor communicate synchronously via the leader:

```typescript
interface TaskMessage {
  taskId: string;
  fromAgent: string;       // Usually the motor leader
  toAgent: string;
  type: 'execute' | 'review' | 'iterate';
  projectId: string;
  tenantId: string;
  payload: {
    step: string;
    inputArtifacts: string[];
    instructions: string;
    attempt: number;        // 1-6 for 3+3 rule
    leaderAdjustment?: string; // Present on attempts 4-6
  };
  deadline?: Date;
}

interface ResultMessage {
  taskId: string;
  fromAgent: string;
  toAgent: string;         // Usually the motor leader
  status: 'completed' | 'failed' | 'needs_review';
  projectId: string;
  tenantId: string;
  payload: {
    outputArtifacts: string[];
    summary: string;
    cost: { tokens: number; usd: number; model: string };
    duration: number;       // ms
    issues?: string[];
  };
}
```

### Cross-Motor: Event Bus (Redis + BullMQ)

Motors communicate asynchronously via typed events:

```typescript
interface MotorEvent {
  eventId: string;
  type: string;            // e.g., 'strategy.completed', 'brand.updated'
  sourceMotor: string;
  tenantId: string;
  projectId?: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  correlationId?: string;  // For request-response patterns
}
```

**Event categories (30+):**
- Strategy events: `strategy.completed`, `strategy.budget_allocated`, `strategy.audience_defined`
- Brand events: `brand.dna_created`, `brand.dna_updated`, `brand.violation_detected`
- Content events: `content.created`, `content.approved`, `content.published`
- Listener events: `listener.opportunity_detected`, `listener.trend_identified`, `listener.competitor_alert`
- Distribution events: `distribution.campaign_launched`, `distribution.email_sent`, `distribution.post_published`
- Analytics events: `analytics.report_ready`, `analytics.anomaly_detected`, `analytics.goal_reached`
- Security events: `security.violation`, `security.audit_complete`, `security.threat_detected`
- System events: `system.motor_started`, `system.motor_paused`, `system.gate_evaluated`

**Subscription patterns:**
- **Fan-out:** One event consumed by multiple motors (e.g., `brand.dna_updated` → all motors refresh brand context)
- **Request-response:** Motor A requests work from Motor B via correlationId
- **Chain:** Event triggers cascade (e.g., strategy → brief → multiple creation motors)
- **Broadcast:** System-wide notifications (e.g., emergency pause)

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
| Framework | Next.js 15 (App Router) | Server components, SSR for SEO, shared components across 3 portals |
| Styling | Tailwind CSS | Rapid prototyping, consistent design system |
| State management | React Server Components + minimal client state | Most data flows server → client |
| Real-time updates | Server-Sent Events (SSE) | Pipeline progress, alerts, agent status updates |
| Icons | Lucide | Consistent, lightweight |

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API | Hono (TypeScript) | Lightweight, fast, TypeScript-native, portable |
| Agent orchestrator | Custom TypeScript state machine | Pipeline state + agent dispatch + gate routing |
| Agent runtime | Claude Agent SDK (TypeScript) | Individual agent implementations |
| Job queue | BullMQ (Redis-backed) | Agent task queuing, Event Bus, retry handling, 3+3 rule |
| Auth | Better Auth | Open-source, orgs/roles/permissions, Hono-native, MIT license |
| Validation | Zod | Input validation on every endpoint |

### Data

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Primary database | PostgreSQL (Neon) | Relational data, serverless, scales to zero |
| ORM | Drizzle | Type-safe, lightweight, migration support |
| Cache / Queue | Redis (Upstash) | Session data, Event Bus, job queue, rate limiting |
| Internal storage | Cloudflare R2 | Production assets, iterations — zero egress cost |
| Video delivery | Bunny Stream | Adaptive bitrate, CDN, DRM/hotlink protection |

### AI Models

| Task Type | Recommended Models | Used By |
|-----------|-------------------|---------|
| Complex reasoning (strategy, evaluation, creative direction) | Claude Opus/Sonnet | Strategist, Showrunner, Critics, Creative Director |
| Text generation (copy, scripts, emails, posts) | Claude Sonnet/Haiku | Copywriters, Email agent, Community Manager |
| Image generation (designs, storyboards, ads) | Flux, Midjourney, DALL-E 3 | Design motor, Ads creative, Video storyboards |
| Video generation | Runway, Kling, Sora, Veo | Video motor |
| Voice/Music/SFX | ElevenLabs, Suno, Udio | Audio motor |
| Transcription | Whisper | Subtitle agents |

Model selection is dynamic — managed per task based on complexity, cost, and quality requirements.

---

## Infrastructure

### Hosting

| Component | Technology | Alternative |
|-----------|-----------|-------------|
| Frontend (3 portals) | Vercel | Cloudflare Pages |
| Backend API + workers | Railway or Fly.io | AWS ECS |
| Database | Neon (serverless PostgreSQL) | Supabase |
| Redis | Upstash | Redis Cloud |
| Internal file storage | Cloudflare R2 | AWS S3 |
| Video delivery | Bunny Stream | Mux |

### Monitoring

| Type | Technology |
|------|-----------|
| Error tracking | Sentry |
| Product analytics | PostHog |
| Uptime | UptimeRobot or similar |
| Security logs | Separate immutable log destination (Section 9.2 of Security Framework) |

### SSE Real-time Events

SSE endpoint per authenticated session. Event types:
- `pipeline_update` — Step/gate changes
- `alert` — System alerts
- `agent_status` — Agent execution updates
- `cost_update` — Running cost totals
- `gate_result` — Gate evaluation results
- `motor_event` — Cross-motor Event Bus events (filtered by tenant)
- `security_event` — Security alerts (admin only)
- `notification` — User-facing notifications
- `heartbeat` — 30-second keepalive

Auto-reconnect on disconnect.

### Cost Structure

| Cost Type | Notes |
|-----------|-------|
| **Fixed (monthly)** | Hosting, DB, Redis, monitoring (~$50-200 for Phase 1) |
| **Variable (per execution)** | AI model API calls (dominant cost — scales with usage) |
| **Key cost drivers** | Video generation (most expensive), ad creative generation, bulk email |
| **Cost optimization** | 3+3 rule limits iterations; early gates prevent expensive late-stage rework; cost caps per agent/day |
| **Storage optimization** | R2 (zero egress) for internal + Bunny Stream for delivery |

---

## Security Architecture

Detailed in `docs/superpowers/specs/2026-04-06-security-framework-design.md`. Key technical decisions:

- **Auth:** Better Auth with HTTP-only cookies, session rotation, MFA for admin
- **Tenant isolation:** Middleware injects tenantId from token, all queries filter by tenant
- **Agent sandboxing:** Declarative permissions per agent, 6-point enforcement (pre-execution, tool call, data access, API call, artifact write, cost check)
- **Encryption:** TLS 1.3 in transit, AES-256-GCM for client secrets (per-tenant salt), Neon/R2 encryption at rest
- **Secrets:** System secrets in env vars, client secrets encrypted in DB with key derivation from MASTER_ENCRYPTION_KEY
- **Headers:** HSTS, CSP, X-Frame-Options, nosniff, restrictive CORS
- **Rate limiting:** Per IP + per user, different limits by endpoint type
- **Logging:** Structured JSON, sanitized (no secrets/PII), security logs immutable with 2-year retention
- **Compliance:** GDPR baseline, jurisdictional addendums for LGPD, LFPDPPP, CCPA

---

## Related Documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — Video motor teams, chain of command
- `AGENT_REGISTRY.md` — Technical reference cards for Video motor agents
- `PRODUCTION_PIPELINE.md` — Video pipeline: 10 steps, 5 gates
- `MVP_ROADMAP.md` — Video motor phased rollout
- `PORTAL_SPECS.md` — Full portal UI/UX specifications
- `DECISION_LOG.md` — All key architectural decisions
- `SESSION_CONTEXT.md` — Complete project briefing
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — 24-motor architecture spec
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Security framework spec
