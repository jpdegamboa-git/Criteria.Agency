# CriteriaFilms.com — Technical architecture

> Last updated: April 5, 2026
> Status: Active — Architecture definition phase

---

## Overview

This document defines the technical stack, data model, agent orchestration framework, and infrastructure needed to implement the CriteriaFilms agentic production system with 47 specialized AI agents. Architecture decisions should be revisited as the system moves through MVP phases.

---

## Agent orchestration

The core technical challenge: coordinating 47 specialized AI agents through a 10-step pipeline with 5 quality gates, handling parallel work, iteration loops, and human override at any point.

### Framework comparison

| Framework | Pros | Cons | Best for | Maturity |
|-----------|------|------|----------|----------|
| **Claude Agent SDK** | Native tool use, sub-agent spawning, built-in context management, strong reasoning | Anthropic-only ecosystem, newer framework | Complex multi-step reasoning agents, quality evaluation agents (showrunner, critic) | Growing — active development |
| **LangGraph** | Stateful graphs, conditional routing, persistence, framework-agnostic | Complex setup, steeper learning curve, can be over-engineered | Pipeline orchestration with complex branching (gate pass/fail routing) | Mature |
| **CrewAI** | Simple multi-agent setup, role-based, easy to prototype | Less control over agent interactions, abstraction can be limiting | Quick prototyping of team-based agent systems | Moderate |
| **Custom orchestrator** | Full control, no framework overhead, tailored to exact needs | Build everything from scratch, maintenance burden | When off-the-shelf frameworks don't fit the specific workflow | N/A |

### Recommended approach

**Hybrid:** Use Claude Agent SDK for individual agents (each agent is a Claude tool-using agent with specialized system prompts and tools) + a custom lightweight orchestrator for the pipeline state machine (manages which step is active, routes gate decisions, handles iteration loops).

**Rationale:**
- Individual agents benefit from Claude's reasoning capabilities (especially showrunner, critic, creative director)
- The pipeline state machine is relatively simple (linear with loops) and doesn't need a heavy framework
- This avoids vendor lock-in on the orchestration layer while leveraging Claude for what it does best
- Team 9 (AI Model Intelligence) operates as the model selection and knowledge layer — it provides model recommendations that all production agents consume. The orchestrator should route model selection queries to Team 9 before video/image/audio generation steps.

### Orchestration requirements

1. **Pipeline state machine:** Track which step each project is in, which gate it's approaching, how many iterations have occurred
2. **Agent dispatch:** Invoke the correct agent(s) for each step, pass them the right context
3. **Gate routing:** On gate pass → advance. On gate fail → route to correct team for iteration
4. **Parallel coordination:** Manage soft-dependency agents that can start early
5. **Human override:** At any point, pause the pipeline and hand off to a human
6. **3+3 rule enforcement:** Track attempt counts per agent per task, trigger leader adjustment after 3, escalate after 6
7. **Audit trail:** Log every agent invocation, every decision, every gate review

---

## Data model

### Core entities

**Project**
```
project:
  id: uuid
  client_id: uuid
  name: string
  type: enum (corporate, explainer, documentary, fiction, micro_content, commercial)
  status: enum (brief, concept, script, visual_look, storyboard, video_gen, edit, audio, polish, delivered)
  current_gate: enum (none, g1, g2, g3, g4, g5)
  gate_history: [GateReview]
  created_at: datetime
  updated_at: datetime
  brief: Brief
  bible: ProjectBible (nullable, created at G1)
  timeline: Timeline
  budget: Budget
```

**Artifact**
```
artifact:
  id: uuid
  project_id: uuid
  step: enum (brief, concept, g1, script, g2, visual_look, storyboard, g3, video_gen, edit, audio, g4, polish, g5, delivery)
  type: enum (document, image, video, audio, subtitle, package)
  name: string
  version: integer
  storage_path: string
  created_by_agent: agent_id
  created_at: datetime
  metadata: json
```

**GateReview**
```
gate_review:
  id: uuid
  project_id: uuid
  gate: enum (g1, g2, g3, g4, g5)
  iteration: integer
  decision: enum (pass, fail)
  reviewer: agent_id (showrunner)
  scores: json (critic scores if applicable)
  notes: string
  cross_functional_reports: [ComplianceReport]
  created_at: datetime
```

**AgentExecution**
```
agent_execution:
  id: uuid
  project_id: uuid
  agent_id: string
  step: string
  attempt: integer (1-6 for 3+3 rule)
  status: enum (running, completed, failed)
  input_artifacts: [artifact_id]
  output_artifacts: [artifact_id]
  started_at: datetime
  completed_at: datetime
  cost: Cost (tokens, credits, compute time)
  error: string (nullable)
```

**Client**
```
client:
  id: uuid
  name: string
  email: string
  brand_assets: BrandAssets
  projects: [project_id]
  feedback_history: [Feedback]
  created_at: datetime
```

**ModelConfig**
```
model_config:
  id: uuid
  project_id: uuid
  task_type: enum (text_gen, image_gen, video_gen, audio_voice, audio_music, audio_sfx)
  recommended_model: string
  recommended_by: agent_id (Team 9 agent)
  parameters: json (model-specific settings)
  cost_estimate: decimal
  created_at: datetime
```

**BenchmarkResult**
```
benchmark_result:
  id: uuid
  model_a: string
  model_b: string
  task_type: enum
  evaluator: agent_id (T9-005)
  scores: json
  recommendation: string
  created_at: datetime
```

### State machine

```
                    ┌─── fail ───┐
                    │             ▼
BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL → STORYBOARD → [G3] → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
          ▲         │               ▲       │                      ▲       │                          ▲       │         ▲       │
          └─────────┘               └───────┘                      └───────┘                          └───────┘         └───────┘
            fail                      fail                           fail                              fail (diagnostic)  fail (surgical)
```

Each backward arrow represents an iteration loop. The 3+3 rule applies within each step (agent-level retries). Gate failures trigger step-level iteration.

---

## Recommended stack

### Frontend (3 portals)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Server components for admin dashboard, client portal SSR, shared component library across 3 portals |
| Styling | Tailwind CSS | Rapid prototyping, consistent design system |
| State management | React Server Components + minimal client state | Most data flows server → client; minimize client-side complexity |
| Real-time updates | Server-Sent Events or WebSockets | Pipeline progress updates in admin and client portals |
| Video player | Custom with comment overlay | Client portal needs per-timestamp commenting |

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API | Node.js with Hono or Fastify | Lightweight, fast, TypeScript-native |
| Agent orchestrator | Custom TypeScript state machine | Pipeline state + agent dispatch + gate routing |
| Agent runtime | Claude Agent SDK (TypeScript) | Individual agent implementations |
| Job queue | BullMQ (Redis-backed) | Agent task queuing, retry handling, 3+3 rule |
| Auth | NextAuth.js or Clerk | Multi-portal auth with role-based access |

### Data

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Primary database | PostgreSQL | Relational data (projects, clients, artifacts, gate reviews) |
| ORM | Drizzle or Prisma | Type-safe database access |
| Cache | Redis | Session data, job queue, real-time state |
| Internal file storage | Cloudflare R2 | Production assets, clips, iterations — zero egress cost saves significantly during 3+3 rule iterations |
| Video delivery (client/public) | Bunny Stream | Adaptive bitrate, CDN, player with commenting overlay, DRM/hotlink protection |
| Vector store | (Phase 2+) pgvector or Pinecone | Pattern library for prompt engineer, preference learning |

### AI models by task type

| Task type | Recommended models | Used by agents |
|-----------|-------------------|---------------|
| Text generation (scripts, analysis, evaluation) | Claude Sonnet/Opus | Most agents — writing, analysis, evaluation |
| Image generation (storyboards, character sheets, assets) | Flux, Midjourney, DALL-E 3 | T3-L, T3-003, T1-002, TL-003 |
| Video generation | Runway Gen-3/4, Kling, Sora, Veo | T3-003 (primary execution agent) |
| Voice generation | ElevenLabs, PlayHT | T5-L |
| Music generation | Suno, Udio | T5-L |
| Sound effects | ElevenLabs SFX, Stable Audio | T5-001, T5-002 |
| Transcription/subtitles | Whisper | T6-002 |

**Model selection is dynamic:** Team 9 (AI Model Intelligence) evaluates and benchmarks all models continuously. The AI Model Director (T9-L) decides which model to use per project task. Specialists (T9-001 through T9-004) maintain detailed skills and guides per model. The Benchmarker (T9-005) runs systematic A/B comparisons. CTO (T8-003) manages APIs and infrastructure.

---

## Infrastructure

### Hosting

| Component | Recommended | Alternative |
|-----------|-------------|-------------|
| Frontend (3 portals) | Vercel | Cloudflare Pages |
| Backend API | Railway or Fly.io | AWS ECS |
| Database | Neon (serverless PostgreSQL) | Supabase |
| Redis | Upstash | Redis Cloud |
| Internal file storage | Cloudflare R2 | AWS S3 |
| Video delivery | Bunny Stream | Cloudflare Stream |
| Background jobs | Railway (same as API) | AWS Lambda |

### Monitoring

- **Application:** Sentry (error tracking)
- **Infrastructure:** Grafana Cloud or Datadog
- **Agent performance:** Custom dashboard tracking execution times, costs, success rates per agent
- **Pipeline health:** Custom dashboard showing projects in each state, gate pass rates, iteration counts

### Cost structure

| Cost type | Category | Notes |
|-----------|----------|-------|
| **Fixed (monthly)** | Hosting, database, Redis, monitoring | ~$50-200/month for Phase 1 |
| **Variable (per project)** | AI model API calls (video gen is most expensive), storage | Dominant cost — scales with project volume |
| **Key cost driver** | Video generation (Runway, Kling, Sora credits) | Each generated shot costs credits; iterations multiply cost |
| **Cost optimization** | 3+3 rule limits iterations; early gates prevent expensive late-stage rework | Built into the architecture |
| **Storage optimization** | Cloudflare R2 (zero egress) for internal pipeline + Bunny Stream for delivery | Egress-free internal storage saves significantly during iterative generation cycles (see DEC-022) |

### Cost estimation per project type (rough)

| Project type | Estimated AI API cost | Notes |
|-------------|----------------------|-------|
| Corporate explainer (2 min) | $20-50 | ~10-20 shots, 1-2 iterations avg |
| Micro-content (30s) | $5-15 | 3-8 shots |
| Documentary (10 min) | $100-300 | 40-100 shots, higher iteration rate |
| Complex commercial | $50-150 | Fewer shots but higher quality bar |

These are AI API costs only. Human supervision, infrastructure, and margins are additional.

---

## criteria.agency integration plan

Team 8 (Operations & Finance) is designed as a separable module (DEC-014). Integration path:

1. **Phase 1:** Team 8 functions are manual. No integration needed.
2. **Phase 2:** Implement Team 8 agents. Design their APIs as standalone services from the start.
3. **Phase 3:** Extract Team 8 as shared microservices. Shared auth (SSO), shared billing, shared CRM between criteriafilms.com and criteria.agency.

**Shared services candidates:**
- Authentication / SSO (one login for all criteria properties)
- Billing and invoicing (T8-001)
- Legal / contract management (T8-002)
- Analytics (T8-005)
- Storage infrastructure (T8-003)
- Model intelligence (Team 9 — if criteria.agency also uses AI models, Team 9's benchmarks and skills could be shared)

---

## Related documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — 9 teams, chain of command, communication protocols
- `AGENT_REGISTRY.md` — Technical reference cards for all 47 agents
- `PRODUCTION_PIPELINE.md` — Step-by-step production flow with gates
- `MVP_ROADMAP.md` — Phased rollout plan
- `PORTAL_SPECS.md` — Portal design specifications
- `DECISION_LOG.md` — Chronological log of all key decisions
