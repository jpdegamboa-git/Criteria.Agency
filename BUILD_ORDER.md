# criteria.agency — Build Order

> Date: April 9, 2026
> Status: Approved plan (revised: Web Motor replaces Video as Fase 2, DEC-222)
> Scope: Integrated implementation plan from design to functional MVP
> Context: 227 design decisions. Fase 0 complete, Fases 1/3/4 functional (needs spec validation), Fase 2 (Web Motor) not started. Solo founder, bootstrapped.
> Decisions referenced: DEC-001 through DEC-227

---

## Principles

1. **Dependencies, not timelines.** Each phase lists what it depends on and what it produces. Timelines are the founder's to set.
2. **Backend first, then admin UI, then client UI.** No frontend work until the backend for that phase is solid.
3. **Each phase has a concrete entregable.** Not "progress" — a testable, demonstrable result.
4. **Founder needs drive priority (DEC-222).** Build order follows what the founder needs for dogfooding and market presence, not implementation complexity.
5. **Admin UI is required.** The founder needs to operate, control, and observe the platform.
6. **CriteriaFilms is a separate project.** It will be a client of criteria.agency, but its specifics are out of scope for this plan.
7. **Testing is part of every step, not a separate phase (DEC-226).** Each step follows the cycle: write Level 1 security tests (if applicable) → implement → run Level 1 tests → validate manually → debug → convert validation to Level 2 automated test → advance. See DEC-224 through DEC-226 for the full testing strategy.

---

## Dependency Graph

```
FASE 0: Cimientos
    │
    ▼
FASE 1: Brand Builder ──────────────────────┐
    │                                        │
    ▼                                        ▼
FASE 2: Web Motor                     FASE 3: Analyst + Output Registry
    │                                        │
    │                                        ▼
    │                                  FASE 4: Strategist
    │                                        │
    └────────────┬───────────────────────────┘
                 │
                 ▼
           FASE 5: Admin UI
                 │
                 ▼
           FASE 6: MARA + Client Portal
                 │
                 ▼
           FASE 7: Hardening pre-beta
                 │
                 ▼
           FASE 8: Video Motor (when needed)
```

**Key dependency notes:**
- Fase 2 (Web Motor, DEC-222) and Fase 3 (Analyst) both depend on Fase 1 (Brand Builder) but NOT on each other. As solo founder, they're sequential. Web goes first because the founder needs a website for dogfooding and public presence.
- Fase 4 (Strategist) depends on Fase 3 (Analyst) — the Analyst is the Strategist's "eyes" (DEC-088).
- Fase 5 (Admin UI) depends on Fases 1-4 — needs backend data to show. First frontend built.
- Fase 6 (Client Portal + MARA) depends on Fase 5 — pattern established, shared components.
- Fase 7 (Hardening) before any external user touches the platform.
- Fase 8 (Video Motor) builds when founder needs video production. All orchestration patterns validated by Web Motor in Fase 2.

---

## FASE 0 — Cimientos

**Depends on:** Nothing. Starting point.
**What:** The infrastructure that every motor, agent, and function needs to exist.

### Implementation sequence

Steps are sequential — complete each one before moving to the next. Each step has a validation checkpoint. Every step follows the testing cycle from DEC-226.

**Step 0.1 — Project scaffold + Hono base + Vitest (DEC-224)**
- Initialize TypeScript project (monorepo or single-package — decide at this point)
- Install Hono, configure TypeScript, basic project structure
- **Install Vitest** and configure for the project. First test: health endpoint returns 200 with correct security headers.
- Health endpoint (`GET /health`)
- Structured logging (JSON format)
- Security headers middleware (HSTS, CSP, X-Frame-Options, nosniff)
- Read: `docs/superpowers/specs/2026-04-06-security-framework-design.md` §3.1, §5
- **Validate:** `GET /health` returns 200 with security headers present

**Step 0.2 — Database + Drizzle ORM**
- Evaluate and choose Neon vs Supabase (DEC-143). Criteria: pgvector support, free tier limits, branching (Neon) vs integrated features (Supabase)
- Set up PostgreSQL instance on chosen provider
- Install Drizzle ORM, configure connection
- Clean slate schema (drop legacy video-only prototype). New tables include: organizations, motors, motorExecutions, agentPermissions, prompt_registry, output_registry (with pgvector). Better Auth manages its own tables (user, session, account, organization, member)
- Reference: `docs/superpowers/specs/2026-04-06-schema-api-design.md` for table designs (verify against current decisions before using — some details may be outdated)
- Run first migration
- **Validate:** Drizzle can connect, migration runs, tables exist, pgvector extension enabled

**Step 0.3 — Better Auth POC (DEC-142)**
- Install Better Auth, configure with Hono
- Validate multi-organization support: create org, invite user, assign roles (owner, admin, editor, viewer)
- Session handling with HTTP-only cookies
- **This is a risk checkpoint.** If Better Auth multi-org doesn't work → pivot to Clerk (DEC-142). This changes cost structure and auth integration patterns. Don't proceed past this step until auth is validated.
- Read: `docs/superpowers/specs/2026-04-06-security-framework-design.md` §4
- **Validate:** Can create user, create org, assign role, authenticate, get session with orgId. HTTP-only cookies work.

**Step 0.4 — Auth middleware + tenant isolation**
- Hono middleware: extract tenant (orgId) from authenticated session, inject into request context
- Tenant isolation helper: all Drizzle queries filter by tenantId
- Protected route pattern: any endpoint beyond `/health` and `/auth/*` requires authentication
- **Level 1 security tests (DEC-225 — write BEFORE implementing):**
  - Unauthenticated request to protected route → 401
  - Authenticated as org A, query org B data → empty result (tenant isolation)
  - Authenticated as org A, create resource → resource has tenantId = A
  - No tenantId in session → 403
- **Validate:** All Level 1 tests pass. Unauthenticated request → 401. Authenticated request → tenantId available. Query for org A's data while authenticated as org B → empty result.

**Step 0.5 — First tenant + seed data**
- Create test organization in DB via Better Auth
- Create test user with owner role
- Seed: at least one motor configuration row (Web motor, enabled)
- **Validate:** Can authenticate as test user, session contains correct orgId

**Step 0.6 — Inngest setup (DEC-140)**
- Install Inngest, configure serve handler on Hono + **Inngest testing toolkit (DEC-224)**
- First Inngest function: receives event → validates Zod schema → verifies tenantId exists in DB → returns success
- Wire up Inngest Dev Server for local development
- **Level 1 security tests (DEC-225 — write BEFORE implementing):**
  - Event with invalid Zod schema → function rejects
  - Event with nonexistent tenantId → function rejects
  - (Webhook signature verification tested when deployed, not locally)
- Test: send event from API endpoint → Inngest function executes
- Read: `docs/superpowers/specs/2026-04-09-security-audit-v2.md` §2.1 (Inngest security patterns)
- **Validate:** Inngest Dev Server dashboard shows function registered. Sending test event → function executes → tenantId verified → visible in dashboard. Invalid tenantId → function rejects.

**Step 0.7 — Vercel AI SDK v6 + Helicone (DEC-141, DEC-147)**
- Install Vercel AI SDK v6
- Configure Helicone proxy (intercepts LLM calls, logs tokens/cost/latency)
- Implement two invocation patterns:
  - `generateText()` — simple call to Claude Haiku via Helicone proxy. Test: classify a text input.
  - Agent with tools — call to Claude Sonnet with one tool. Test: agent receives a question, uses a tool to look up data, returns answer.
- Add metadata to Helicone calls: agent_id, tenant_id, skill_id
- Read: `TECH_ARCHITECTURE.md` §AI Models
- **Validate:** Both invocation patterns work. Helicone dashboard shows calls with correct metadata (tokens, cost, latency, agent_id, tenant_id).

**Step 0.8 — Prompt Registry (DEC-145)**
- CRUD endpoints for prompt_registry table
- Security fields per DEC-149: data_sensitivity (tier A/B/C), approved_providers per entry
- Seed first prompt: Brand Strategist agent, Discovery skill, system prompt, model=claude-sonnet, data_sensitivity=A, approved_providers=[anthropic]
- Wire Vercel AI SDK wrapper to load system prompt from prompt_registry before invocation
- **Level 1 security test (DEC-225 — write BEFORE implementing):**
  - Prompt with data_sensitivity=A + attempt to invoke with Tier B/C provider → blocked
  - Prompt with data_sensitivity=B + invoke with Tier B provider → allowed
- **Validate:** Create prompt via API. Vercel AI SDK invocation reads prompt from registry (not hardcoded). Change prompt in DB → next invocation uses new prompt without redeploy. Tier enforcement tests pass.

**Step 0.9 — End-to-end loop (integration test)**
- Wire everything together: API request → authenticated → dispatches Inngest event → Inngest function validates schema + verifies tenant → loads prompt from registry → invokes LLM via Vercel AI SDK through Helicone → result saved to PostgreSQL with tenant isolation
- This is the entregable of Fase 0. Not a feature — a proof that the infrastructure works.
- **Convert all manual validations from Steps 0.1-0.8 into Level 2 automated tests (DEC-225).** These form the regression suite for Fase 0 infrastructure. They run before starting Fase 1 and after any infrastructure change.
- **Validate:**
  - The full loop works end-to-end
  - Inngest dashboard shows the function execution with steps
  - Helicone shows the LLM call with cost, tokens, agent_id, tenant_id
  - Tenant isolation enforced (no cross-tenant data access)
  - Prompt loaded from DB, not hardcoded
  - All Level 1 security tests pass
  - All Level 2 regression tests pass

### Entregable

A request arrives at the API → authenticated → dispatches an Inngest event → Inngest function validates schema, verifies tenant → loads prompt from registry → invokes LLM via Vercel AI SDK → Helicone logs the call → result saved to PostgreSQL with tenant isolation. Ugly but functional end-to-end. All Level 1 + Level 2 tests pass.

### Done when

- The full loop works (Step 0.9 validates pass)
- Inngest dashboard shows the function execution
- Helicone shows the LLM call with cost
- Tenant isolation is enforced (no cross-tenant data access)
- Prompt loaded from registry, not hardcoded
- All Level 1 + Level 2 tests pass as automated suite

---

## FASE 1 — Brand Builder

**Depends on:** Fase 0 complete.
**Why first:** Brand Builder spec §1 — "Without a Brand DNA, every other motor operates generically." Prerequisite for everything.
**Read before implementing:** `docs/superpowers/specs/2026-04-08-brand-builder-motor-design.md`

### Implementation sequence

Steps are sequential. Each step builds on infrastructure from Fase 0 (Hono, auth, Inngest, Vercel AI SDK, Prompt Registry, tenant isolation). Read the full Brand Builder spec before starting.

**Step 1.1 — Brand DNA data model**
- Define all Brand DNA fields across 4 layers in PostgreSQL (Drizzle schema)
- Table: `brand_dna` — tenant-scoped, layer-aware, with versioning support (DEC-084: undo, not version history)
- Table: `brand_dna_artifacts` — individual artifacts (manifesto, positioning statement, archetype, visual system, etc.) with layer, status, and content
- Layer field on each artifact: 0, 1, 2, or 3
- Versioning: previous versions stored with timestamp, trigger context. Client-facing: "revert last update"
- **Validate:** Can create, read, update Brand DNA for a tenant. Previous version preserved on update. Cross-tenant isolation works.

**Step 1.2 — Layer 0: Onboarding automático (DEC-076)**
- System function, NOT the Brand Strategist agent. No LLM needed.
- Inngest function: receives `brand-builder/onboarding.started` event
- Path A (has brand): receives website URL + social URLs → scrape → extract brand signals → fill Brand DNA template at Layer 0
- Path B (from scratch): receives answers to 3 minimum questions → fill template at Layer 0
- Output: Brand DNA with Layer 0 artifacts populated (~15-20 Fundamentos score)
- All artifacts marked "draft — pending validation"
- **Validate:** Path A: provide a real URL → Layer 0 Brand DNA created with extracted data. Path B: provide 3 answers → Layer 0 created. Both paths: Brand DNA stored with tenant isolation, all artifacts at layer 0.

**Step 1.3 — Brand Health Score: Fundamentos axis**
- System function (no LLM) that calculates Fundamentos score based on Brand Builder layer and artifact completeness
- Layer 0 = ~15-20, Layer 1 = ~40-50, Layer 2 = ~65-75, Layer 3 = ~85-95
- Score stored per tenant, recalculated on Brand DNA changes
- This is the first axis of the 3-axis Brand Health Score (DEC-126). Ejecución and Oportunidad axes come in Fase 3.
- **Validate:** Create Layer 0 Brand DNA → Fundamentos score ~15-20. Advance to Layer 1 → score updates to ~40-50.

**Step 1.4 — Brand Strategist agent: Discovery skill (Layer 1)**
- First real agent on the platform
- Register Brand Strategist agent in prompt_registry: Discovery skill, Claude Sonnet (Tier A — DEC-149), data_sensitivity=A
- Implement as Vercel AI SDK agent with tools (complex pattern — DEC-141):
  - Tools: read Brand DNA, update Brand DNA artifact, ask client question, evaluate sufficiency
- Inngest function: `brand-builder/layer1.started` → Brand Strategist with Discovery skill interacts with client → produces Layer 1 artifacts
- Gate 0→1: automatic coverage check (system function). Did Layer 0 produce minimum fields? No quality judgment.
- Sufficiency threshold (DEC-077): gate evaluates but doesn't hard-block. Score reflects gaps.
- **Validate:** Trigger Layer 1 → Brand Strategist agent invokes via Vercel AI SDK → agent reads Layer 0 Brand DNA → produces Layer 1 artifacts → gate evaluates → Fundamentos score updates. Inngest dashboard shows the full execution. Helicone shows LLM costs.

**Step 1.5 — 3+3 rule for Brand Builder**
- Implement iteration tracking on Brand Strategist invocations
- 3 normal attempts → 3 with leader adjustment → human escalation
- The "leader" for Brand Builder is the Brand Strategist itself (single-agent motor), so "leader adjustment" means modified instructions on attempts 4-6
- Gate failure → iterate with updated instructions → re-evaluate
- **Validate:** Force a gate failure → agent retries with iteration count incrementing → after attempt 3, leader adjustment appears in instructions → after attempt 6, human escalation triggered.

**Step 1.6 — Brand Strategist: Positioning + Archetype & Voice skills (Layer 2)**
- Add 2 skills to Brand Strategist in prompt_registry
- Positioning skill: M1-M6 framework (segmentation, targeting, positioning) + Godin's "smallest viable audience"
- Archetype & Voice skill: brand archetype identification, voice definition per channel
- Inngest function: `brand-builder/layer2.started` → Brand Strategist with Layer 2 skills
- Gate 1→2: validation check. Brand Strategist evaluates but doesn't hard-block. Score reflects gaps.
- **Validate:** Trigger Layer 2 → Brand Strategist uses Positioning and Archetype skills → Layer 2 artifacts created → gate evaluates.

**Step 1.7 — Layer 2 coherence gate (DEC-081)**
- Incoherence check: blocks when two Brand DNA artifacts contradict each other in a way that would produce opposite outputs downstream
- Three specific contradiction types that justify blocking (see spec §11.1): positioning vs audience, archetype vs voice, visual direction vs brand personality
- Gate 2→3: **this gate CAN block** (unlike gates 0→1 and 1→2). 3+3 rule applies.
- **Validate:** Create intentionally contradictory artifacts → gate blocks. Fix contradiction → gate passes. 3+3 rule works at this gate.

**Step 1.8 — Brand Strategist: Identity Systems skill (Layer 3)**
- Add Identity Systems skill to prompt_registry
- Produces: brand book, extended visual system, tone of voice guide per channel, Brand Guardian validation templates
- Inngest function: `brand-builder/layer3.started` → Brand Strategist with Identity Systems skill
- **Validate:** Trigger Layer 3 → Layer 3 artifacts created (brand book, visual system, tone guide, validation templates).

**Step 1.9 — Layer 3 gate: Brand Guardian function (DEC-078, DEC-173)**
- Minimal gate function using `generateText()` (not a full agent)
- System prompt loaded from prompt_registry (agent: brand-guardian, skill: layer3-gate)
- Evaluates Layer 3 artifacts against specificity checklist:
  - Does the brand book have enough specificity for consistent output validation?
  - Does the tone guide have concrete examples per channel (not abstract)?
  - Does the visual system cover the formats creation motors need?
- If insufficient → iterates (3+3 rule applies)
- **Validate:** Provide vague Layer 3 artifacts → gate rejects. Provide specific artifacts → gate passes. Iteration loop works.

**Step 1.10 — End-to-end Brand Builder integration test**
- Run the full flow: onboarding (Layer 0) → Discovery (Layer 1) → Positioning + Archetype (Layer 2) → coherence gate → Identity Systems (Layer 3) → Brand Guardian gate → complete Brand DNA
- Verify: all gates work, all scores update, all artifacts stored with versioning, tenant isolation enforced throughout
- **Validate:**
  - Layer 0 works without LLM
  - Layers 1-3 work with Brand Strategist through Inngest
  - Gates evaluate and block/pass correctly (especially Layer 2 incoherence and Layer 3 Brand Guardian)
  - Brand DNA stored with tenant isolation and versioning (undo works)
  - Fundamentos score updates correctly at each layer transition
  - DEC-077 sufficiency thresholds enforced
  - Inngest dashboard shows clear pipeline progression across all layers

### Entregable

A client can go through Brand Builder from Layer 0 to Layer 3 and have a complete Brand DNA. The Brand Strategist agent works end-to-end through Inngest with gates.

### Done when

- Step 1.10 validation passes completely

### Deferred to post-MVP

- **Continuous mode triggers (DEC-080):** 5 triggers (Strategist misalignment, client request, business event, scheduled audit, score drop). Not needed until Strategist exists and platform is running continuously.
- **Brand Audit skill:** Requires active market data to compare Brand DNA against reality.

---

## FASE 2 — Web Motor (DEC-222)

**Depends on:** Fase 0 (Inngest, AI SDK) + Fase 1 (Brand DNA for creative direction).
**Does NOT depend on:** Analyst or Strategist. Web Motor accepts manual briefs.
**Why second:** Founder needs a website for dogfooding and public presence. Validates the same orchestration patterns as Video Motor (multi-agent pipeline, gates, 3+3 rule) plus hybrid mode (project → continuous). DEC-222.
**Read before implementing:** `docs/superpowers/specs/2026-04-09-web-motor-design.md`

### Implementation sequence

**Step 2.1 — Web Motor data model**
- Define tables in PostgreSQL (Drizzle schema): `web_projects`, `web_artifacts`, `web_gate_results`, `web_iteration_tracking`, `web_pages`, `blog_posts`
- All tables tenant-scoped
- **Validate:** Can create, read, update web projects for a tenant. Cross-tenant isolation works.

**Step 2.2 — Pipeline as Inngest function**
- `BRIEF → CD → WRITER → [G1] → DESIGNER → [G2] → WEB DEV → [G3] → DEPLOY`
- Each step as an Inngest step within the function
- Gate evaluation as decision points
- Security per DEC-148: webhook verification, Zod schema validation, tenantId verification
- **Validate:** Inngest function registered. Steps visible in dashboard. Can trigger with test event.

**Step 2.3 — Creative Director: Web Direction skill**
- Register CD Web Direction skill in prompt_registry: Opus, Tier A
- Implement as Vercel AI SDK agent with tools (complex pattern — DEC-141)
- Tools: Read Brief, Read Brand DNA, Update Creative Direction
- CD receives site architecture from brief, produces creative direction (visual, tonal, experiential)
- **Validate:** Trigger CD step → CD produces creative direction document based on brief + Brand DNA.

**Step 2.4 — Writer: Web Copy skill**
- Register Writer Web Copy skill in prompt_registry: Sonnet, Tier A
- Implement as Vercel AI SDK agent with tools
- Tools: Read Brief, Read Creative Direction, Read Brand DNA, Update Copy
- Writer produces copy page by page following site architecture from brief
- **Validate:** Trigger Writer step → Writer produces structured copy document with all page content.

**Step 2.5 — Gate 1 implementation (concepto + textos + costo)**
- CD evaluates creative direction + copy quality (parallel Inngest steps)
- Brand Guardian evaluates textual voice (Textual Voice Review skill)
- Cost estimation as system function
- 3+3 rule: on failure, Writer retries with CD feedback
- **Validate:** Pass case → pipeline advances. Fail case → Writer retries with feedback. 3+3 rule counter increments. After attempt 6 → human escalation.

**Step 2.6 — Designer: Web Design skill**
- Register Designer Web Design skill in prompt_registry: Sonnet, Tier A (DEC-187)
- Implement as Vercel AI SDK agent with tools
- Tools: Read Brief, Read Creative Direction, Read Brand DNA, Read Approved Copy, Update Design
- Designer produces layout specs per page
- **Validate:** Trigger Designer step → Designer produces structured design specs for all pages.

**Step 2.7 — Gate 2 implementation (diseño visual)**
- CD evaluates visual coherence with creative direction (parallel Inngest steps)
- Brand Guardian evaluates visual identity (Visual Identity Review skill)
- 3+3 rule: on failure, Designer retries with CD feedback
- **Validate:** Pass/fail routing works. 3+3 rule works. Leader adjustment (CD re-invoked) on attempts 4-6.

**Step 2.8 — Web Developer agent + Development step**
- Register Web Developer in prompt_registry: Sonnet, Tier A (DEC-219)
- New transversal agent — implement as Vercel AI SDK agent with tools
- Skills: Static Site, CMS Site, Microsite — skill selected based on brief
- Tools: Read Approved Copy, Read Approved Design, Read Brief, Read Brand DNA, Write Code, Configure Integration, Deploy Preview
- Web Developer takes approved design + copy and generates functional code
- If brief includes blog → CMS Site skill builds blog structure (templates, categories, listing, post template, RSS)
- **Validate:** Trigger Web Developer step → generates deployable code. CMS Site skill creates blog structure when brief specifies blog.

**Step 2.9 — QA + Gate 3 implementation (sitio funcionando)**
- System functions run automated QA: responsive, performance, links, forms, SEO basics, accessibility, integrations (DEC-223)
- CD visual verification: does the built site match the approved design?
- No Brand Guardian (brand validated at G1 + G2)
- **Validate:** QA system functions detect intentional failures. CD catches visual mismatches. 3+3 rule works on technical failures.

**Step 2.10 — Deploy step**
- System function deploys to Vercel
- Output indexed in Output Registry (DEC-130)
- Notification to client
- **Validate:** Site deploys, URL accessible, Output Registry entry created.

**Step 2.11 — Continuous mode: Blog Post pipeline**
- Separate Inngest function: `web-motor/blog-post`
- Brief → Writer (Blog Post skill) → G1 simplified (Brand Guardian) → Designer (optional) → publish via CMS (DEC-221)
- **Validate:** Blog post created and published through CMS without full pipeline.

**Step 2.12 — End-to-end integration test**
- Run the full flow: brief (with site architecture + blog) → CD → Writer → G1 → Designer → G2 → Web Dev → QA → G3 → Deploy → Live site
- Then: blog post through continuous mode pipeline
- **Validate:**
  - Full project pipeline works end-to-end
  - All 3 gates evaluate and route correctly
  - 3+3 rule enforced with leader adjustment at all gates
  - Artifacts stored and versioned on R2
  - Autonomy settings change gate behavior
  - Continuous mode blog post pipeline works
  - Brand DNA context injected into all creative agents
  - Inngest dashboard shows clear pipeline progression
  - Langfuse shows LLM costs per agent per step

### Entregable

Send a brief (including site architecture) → Web Motor produces a deployed website through the full pipeline with 3 gates. Blog posts can be published through the continuous mode pipeline. The full orchestration runs in Inngest with real agent invocations.

### Done when

- Step 2.12 validation passes completely
- First real use: founder's own criteria.agency website built through the pipeline

---

## FASE 3 — Analyst System Functions + Output Registry

**Depends on:** Fase 1 (Brand DNA for Fundamentos axis of Brand Health Score). Independent of Fase 2 (Video Motor) — but as solo founder, built sequentially after Fase 2.
**Sequencing rationale:** After Fase 2 there are real outputs (Brand DNA + videos) to measure and index, making Analyst testing more meaningful.
**Read before implementing:** `docs/superpowers/specs/2026-04-08-analyst-motor-design.md`

### Components

1. **Brand Health Score calculation (DEC-126)**
   - 3 axes: Fundamentos (33%), Ejecución (33%), Oportunidad (33%)
   - Fundamentos: reflects Brand Builder layer (Layer 0 = ~15-20, Layer 3 = ~85-95)
   - Ejecución: reflects active campaigns and content production (starts low, no campaigns yet)
   - Oportunidad: reflects Listener signals and market alignment (starts at baseline, no Listeners yet)
   - Daily recalculation, intraday trend indicator
   - System function — no LLM needed

2. **Dashboard data aggregation (system functions)**
   - KPI tracking and storage
   - Threshold alerting (if metric crosses threshold → flag)
   - Campaign Score calculation (per campaign, post-data-ingestion)

3. **Output Registry as shared infrastructure (DEC-130)**
   - pgvector table with output metadata + summary embeddings
   - Index all outputs: Brand DNA artifacts, video pipeline artifacts
   - Query interface for semantic search ("find outputs related to X")
   - Security: summary-only embeddings (DEC-151), pre-filtering by tenant, UUID-only content_ref
   - This benefits MARA (Fase 6) but is built now because it's infrastructure

4. **Analyst agent — DEFERRED to post-MVP**
   - The interpretive layer (Monitoring, Diagnostic Delivery, Reporting skills) requires data from campaigns, distribution channels, and external APIs
   - Without Data Ingestion Layer (DEC-122) and distribution motors, the Analyst agent has nothing substantial to interpret
   - System functions handle everything needed for MVP

### Entregable

Brand Health Score is calculated daily for each tenant. Outputs from Brand Builder and Video motor are indexed in Output Registry and queryable. Dashboard data is aggregated.

### Done when

- Brand Health Score calculates correctly (Fundamentos reflects Brand Builder layer)
- Output Registry indexes outputs and returns relevant results for semantic queries
- Threshold alerts fire when metrics cross defined boundaries
- All system functions run without LLM (deterministic calculations)

---

## FASE 4 — Strategist

**Depends on:** Fase 3 (Analyst system functions as "eyes" — DEC-088), Fase 1 (Brand DNA).
**Read before implementing:** `docs/superpowers/specs/2026-04-08-strategist-motor-design.md`

### Components

1. **Strategist Diagnostic skill (DEC-090)**
   - Consumes processed data from Analyst Interface 2
   - First skill because it connects Analyst → Strategist pipeline

2. **Strategist Planning skill (DEC-090)**
   - Produces Marketing Plan based on Brand DNA + Brand Health Score + PI benchmarks
   - Budget from economics model (DEC-101): margin × addressable market × expected CAC

3. **Strategist Campaign Design skill (DEC-090)**
   - Pre-configured campaigns (DEC-098): everything pre-filled, everything editable
   - Client edits, never creates from scratch
   - Campaign briefs mapped to Funnel Matrix positions (Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned)
   - Campaign briefs can feed into Video motor (closing the loop: Strategist → brief → Video motor)

4. **Platform Intelligence basic (DEC-102-120)**
   - System function (DEC-112) — aggregates, never interprets
   - Cold start with industry_benchmark layer (DEC-106): public data, available from day 1
   - Benchmark queries for Strategist Planning skill
   - K-anonymity thresholds (DEC-107): K=5 default — with 1 client, only industry benchmarks are available
   - Read: `docs/superpowers/specs/2026-04-08-platform-intelligence-design.md`

5. **Strategist Optimization + Campaign Learning skills — DEFERRED to post-MVP**
   - Optimization requires active campaigns to optimize
   - Campaign Learning requires completed campaigns to learn from
   - Both activate when distribution motors exist and campaigns are running

### Entregable

Strategist produces Marketing Plan, campaign briefs (pre-configured), and diagnostic interpretations. Campaign briefs can feed into Video motor. PI serves industry benchmarks.

### Done when

- Strategist receives diagnostics from Analyst and produces interpretations
- Marketing Plan generated for a tenant based on Brand DNA + BHS + PI benchmarks
- Pre-configured campaigns appear mapped to Funnel Matrix
- Campaign brief → Video motor brief pipeline works
- PI serves cold-start benchmarks

---

## FASE 5 — Admin UI

**Depends on:** Fases 0-4 (backend complete with real data to display).
**First frontend built.**
**Read before implementing:** `PORTAL_SPECS.md` §2 (Admin Portal)

### Components

1. **Next.js 15 setup (App Router)**
   - Shared component library (used by admin and later by client portal)
   - Tailwind CSS, design system foundation
   - Auth integration (Better Auth session handling)

2. **Admin Portal Tier 1 (per PORTAL_SPECS.md)**
   - **Mission Control:** Panoramic view of all motors — status, active projects, alerts
   - **Projects:** List all projects across motors, status, current pipeline step, current gate
   - **Gate Review:** Queue of gates pending human evaluation. Approve/reject with notes
   - **Agent Dashboard:** Agent executions, costs (from Helicone), success rates, iteration counts
   - **Model Dashboard:** Prompt Registry management — view/edit system prompts, model assignments, data_sensitivity per agent × skill

3. **Layout (per PORTAL_SPECS.md)**
   - Collapsible sidebar organized by motor category
   - Header: logo + alert badge + global search (Cmd+K) + user avatar
   - Light mode default, dark mode toggle

4. **Alert system (per PORTAL_SPECS.md)**
   - 18 trigger types across 4 severities
   - In-app badge + slide-out panel

5. **SSE integration**
   - Pipeline progress updates
   - Gate evaluation results
   - Agent status changes
   - Cost updates

### Entregable

Admin can operate the entire platform from a UI: see all motors, all projects, review gates, monitor agent performance and costs, manage prompts.

### Done when

- Mission Control shows real data from all operational motors
- Gate Review allows approve/reject with notes
- Agent Dashboard shows real execution data and costs from Helicone
- Model Dashboard allows prompt editing without redeploy
- SSE delivers real-time updates

---

## FASE 6 — MARA + Client Portal

**Depends on:** Fase 5 (frontend patterns established, shared components), Fase 3 (Output Registry).
**Read before implementing:**
- `docs/superpowers/specs/2026-04-09-mara-copilot-design.md`
- `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md`
- `PORTAL_SPECS.md` §3 (Client Portal — superseded by navigation spec)

### Components

1. **MARA backend**
   - Intent Classification skill (DEC-128): 6 categories — data lookup, interpretation, strategic decision, brand action, operational action, navigation. Start with Haiku (DEC per MARA spec §15)
   - Response Composition skill (DEC-128): composes responses from agent outputs in client-appropriate language. Claude Sonnet for quality.
   - Conversation Management skill (DEC-128): session summaries, cross-session memory, pending actions tracking
   - Output Registry queries: semantic search for existing outputs before invoking new agent calls
   - Play/pause toggle backend (DEC-131, DEC-158): server-side enforcement, stored in DB session. Pause = free-only responses. Play = full capability.
   - Per-session invocation budget: 5 paid agent invocations max (DEC-157)

2. **Client Portal**
   - **Login + onboarding** (triggers Brand Builder Layer 0)
   - **Grid de Campañas** (Home): campaign cards, status, actions
   - **Funnel Matrix** (toggle from Grid): Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned. Empty cells as visual gaps. Strategist recommendations in cells.
   - **Brand Health Score:** 3-axis visualization, daily trend, action suggestions
   - **Mi Negocio:** Brand DNA viewer (from Brand Builder outputs)
   - **Header dropdowns:** Tools, Brújula (intelligence), Campana (notifications), Avatar (Mi Negocio, Mi Cuenta, Settings)
   - **No sidebar.** Dual view: Grid + Funnel Matrix.
   - **MARA chat:** floating chat bubble, 3 interaction modes (consulta, acción, exploratorio)

3. **SSE for real-time**
   - Pipeline progress (video motor updates)
   - MARA proactive messages (in play mode)
   - Alert notifications
   - Brand Health Score intraday updates

4. **Tier differentiation (DEC-136)**
   - Starter: self-service, basic MARA
   - Pro: full MARA + deeper PI access
   - Agency: white-label + workshops (DEFERRED — no white-label in MVP)

### Entregable

A client can log in, see their brand (Brand DNA), see campaigns in Grid and Funnel Matrix, see Brand Health Score, and talk to MARA. MARA answers questions using Output Registry and routes to agents when needed.

### Done when

- Client portal loads with real data from backend
- MARA classifies intents and composes responses
- Play/pause toggle works (server-side enforced)
- Output Registry serves relevant outputs to MARA queries
- Grid and Funnel Matrix display real campaign data
- Brand Health Score displays with trend

---

## FASE 7 — Hardening pre-beta

**Depends on:** Fase 6 (complete platform).
**Before:** Any external user.
**Read before implementing:**
- `docs/superpowers/specs/2026-04-09-security-audit-v2.md` §16 (Mitigation priorities)
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` §11 (Implementation priorities)

### Components

1. **Security P0 (from Security Framework §11.1 + Audit v2 §16.2)**
   - Remove any hardcoded credentials
   - Inngest webhook HMAC-SHA256 verification + anti-replay (DEC-148)
   - Event schema validation with Zod on every Inngest function (DEC-148)
   - Tenant verification in every Inngest function (DEC-148)
   - Inngest API key isolation — backend only (DEC-148)
   - Auth hardening: session rotation, secure cookies
   - Security headers: HSTS, CSP, X-Frame-Options, nosniff
   - Restrictive CORS

2. **Security P1 (from Security Framework §11.2 + Audit v2 §16.3)**
   - Rate limiting: per IP + per user, different limits by endpoint
   - Input validation with Zod on every API endpoint
   - Log sanitization (no secrets/PII in logs)
   - MARA safety classifier (DEC-155)
   - MARA immutable system prompt re-injection (DEC-155)
   - MARA context size limit (DEC-155)
   - Play/pause server-side enforcement verified (DEC-158)
   - Per-session invocation budget enforced (DEC-157)
   - AI Provider tier enforcement (DEC-149): Tier A only for confidential data

3. **Legal documents (5 required pre-launch)**
   - Terms of Service
   - Privacy Policy (GDPR baseline — DEC per Security Framework)
   - Data Processing Agreement (DPA)
   - Acceptable Use Policy (AUP) (DEC-167)
   - Cookie Policy

4. **Content Policy Checker (DEC-167)**
   - Basic content safety checks on creation motor outputs
   - TOS disclaimers on AI-generated content

5. **Testing**
   - Critical path tests: auth flow, tenant isolation, pipeline execution, gate evaluation, MARA routing
   - Security tests: cross-tenant access attempts, injection attempts, rate limit enforcement

6. **CI/CD**
   - Deployment pipeline to Railway (backend) + Vercel (frontend)
   - Environment separation (dev/staging/production)

### Entregable

Platform is secure enough for external users. Legal coverage exists. Critical paths are tested. Deployment is automated.

### Done when

- All P0 security items verified
- All P1 security items verified (especially MARA hardening)
- 5 legal documents published
- Critical path tests pass
- CI/CD deploys successfully to staging and production

---

## What's NOT in the MVP (post-beta, in rough priority order)

| Component | Why deferred | Depends on |
|-----------|-------------|------------|
| Strategist Optimization + Campaign Learning skills | Need active campaigns | Distribution motors running |
| Brand Builder continuous mode (5 triggers, DEC-080) | Need Strategist + continuous operations | Strategist operational |
| Analyst agent (interpretive layer) | Need Data Ingestion Layer + campaign data | External API integrations + campaigns |
| Data Ingestion Layer (DEC-122) | External API OAuth management | Distribution motors to ingest from |
| 4 Listeners (Brand, Culture, Industry, Competition) | Intelligence motors | External data sources |
| Distribution motors (Ads, Community, Email, SEO) | Need Strategist for campaign briefs | Strategist + channel APIs |
| Sales/CRM motor | Need leads to manage | Distribution generating leads |
| Brand Guardian as independent agent | Currently stubbed at Layer 3 gate | More motors producing brand-sensitive outputs |
| Graphic Design, Web, Audio, Events, Print motors | Creation motors beyond Video | Market demand |
| White-label (Agency tier, DEC-166) | Multiplies attack surface | Security maturity |
| Workshops ($29-2K) | Revenue add-on | Brand Builder proven |
| Marketplace | Scale feature | 50+ clients |
| Stripe integration (subscriptions + usage billing) | Payment processing | Beta → paid conversion |
| Ad spend intermediation (DEC-165: Phase 1 = no intermediation) | Legal/financial complexity | Legal structure |
| Backoffice modules (Finanzas, Contabilidad, RRHH) | Admin-only, internal ops | Revenue justifies complexity |

---

## Pre-implementation Actions (parallel with Fase 0)

These don't block implementation but should start immediately:

1. **Apply to Anthropic Startup Program** — $25K Claude API credits. Most impactful single action.
2. **Apply to Google for Startups (AI First)** — $250K GCP credits. If accepted, reconsider hosting on GCP.
3. **Apply to Cloudflare for Startups** — $5K for R2 storage.
4. **Register free tier accounts:** Neon or Supabase, Vercel, Upstash, Inngest, Helicone, PostHog, BetterStack.
5. **Better Auth POC** — validate multi-org with Hono before committing (DEC-142). This is part of Fase 0 but should start first because it's a risk: if it fails, pivot to Clerk.
6. **Landing page + waitlist** — static Next.js on Vercel free tier. "Tu director de marketing virtual."
7. **Start weekly content** — build-in-public on LinkedIn/YouTube.

---

## How to Use This Document

**In Claude Code:** Read this document before starting any implementation work. Follow the phases in order. Before implementing any component, read the referenced spec document in full. Do not invent architecture — if something isn't in a spec, ask.

**Cross-reference:** Every major decision references a DEC number. If uncertain about a design choice, look up the DEC in `DECISION_LOG.md` for the full rationale.

**Updating:** When a phase is completed, mark it as done with the date. When implementation reveals that a spec needs updating, note the change here and update the spec.
