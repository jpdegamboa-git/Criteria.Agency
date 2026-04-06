# CriteriaFilms.com — Decision log

> Last updated: April 5, 2026
> Sessions: 2 | Decisions: DEC-001 through DEC-022

---

## How to use this document

Each entry records a key decision made during project development. Before re-discussing any topic, check here first — the decision may already have been made with good reasoning.

Format per entry: date, context, decision, alternatives considered, impact, status.

---

## Session 1 — April 5, 2026: Foundation brainstorm

### DEC-001: Agentic architecture for production

- **Context:** Defining how CriteriaFilms automates video production.
- **Decision:** Fully agentic system with hyper-specialized agents, each responsible for one specific area. Not a monolithic AI that does everything.
- **Alternatives considered:** Single LLM handling all tasks (rejected — quality suffers when one model tries to do everything); human-heavy with AI assistance only (rejected — doesn't scale, doesn't achieve the automation vision).
- **Impact:** Defines the entire technical architecture. Every feature and workflow is built around agents.
- **Status:** Active.

### DEC-002: 3 business models with priority order

- **Context:** CriteriaFilms needs multiple revenue streams.
- **Decision:** (1) Production service for businesses (priority — existing business with 20 years experience), (2) Own productions for niches, (3) AI filmmaking school.
- **Alternatives considered:** Starting with school (rejected — need proven production system first); only service (rejected — limits growth and IP creation).
- **Impact:** Determines feature priority. Portal and pipeline built for service model first, school features later.
- **Status:** Active.

### DEC-003: 3 portals (public, client, admin)

- **Context:** Different users need different interfaces.
- **Decision:** Separate portals for public visitors, clients, and admin. Client can view and comment but not edit. Admin has full pipeline access.
- **Alternatives considered:** Single portal with role-based views (rejected — too complex, UX suffers); client with edit access (rejected — clients editing production assets creates chaos).
- **Impact:** Defines frontend architecture as multi-portal system.
- **Status:** Active.

### DEC-004: Agent count expanded from 14 to 38

- **Context:** Initial design had 14 agents covering broad areas. Analysis revealed quality gaps.
- **Decision:** Expand to 38 hyper-specialized agents. Better to have 38 agents each doing one thing exceptionally than 14 doing three things acceptably.
- **Alternatives considered:** Keep 14 with broader skills (rejected — quality ceiling too low); 50+ agents with even finer granularity (rejected — over-engineering, diminishing returns).
- **Impact:** Increases system complexity but significantly raises quality ceiling.
- **Status:** Active. Count: 3 top-level + 34 in teams + 4 cross-functional = 38 (note: earlier count of 36 was before producer was moved to top-level and foley artist was added).

### DEC-005: Team structure (8 teams, not flat)

- **Context:** 38 agents need organizational structure to avoid chaos.
- **Decision:** 8 teams with leaders and sub-agents, mirroring real film production departments. Sub-agents only communicate with their leader.
- **Alternatives considered:** Flat structure where all agents report to PM (rejected — 38 agents reporting to one orchestrator creates massive bottleneck and contradictory decisions); 3 large departments (rejected — too broad, doesn't capture specialization).
- **Impact:** Defines communication protocols, escalation paths, and how agents are implemented.
- **Status:** Active.

### DEC-006: Showrunner as top-level agent

- **Context:** No single agent had the complete picture of a project with authority to enforce coherence.
- **Decision:** Create showrunner agent above all creative teams (1-6), separate from PM (who handles operational concerns) and creative director (who generates ideas). The showrunner evaluates and guards the vision across all phases.
- **Alternatives considered:** Merging with creative director (rejected — same agent generating and evaluating loses objectivity); merging with PM (rejected — PM doesn't understand creative problems deeply enough); no showrunner, rely on cross-functional critics (rejected — critics evaluate individual elements, nobody evaluates the whole).
- **Impact:** Adds the 5-gate quality system. Changes the chain of command. The showrunner becomes the highest creative authority per project.
- **Status:** Active.

### DEC-007: Showrunner vs creative director — separate roles

- **Context:** Both roles deal with creative vision. Why not merge them?
- **Decision:** Keep them separate. Creative director GENERATES ideas (concept, moodboard, north). Showrunner EVALUATES if execution fulfills those ideas. Separation of generation and evaluation prevents bias.
- **Additional reasons:** Different temporal scope (CD peaks early, showrunner works throughout), multiple simultaneous projects (CD can ideate new project while showrunner supervises 3 in production), independent human substitution.
- **Impact:** Both roles can be independently replaced by humans.
- **Status:** Active.

### DEC-008: Writers room as independent team

- **Context:** Originally, script writing was inside the creative development team. Creative director was overloaded: defining vision AND writing scripts AND evaluating quality.
- **Decision:** Separate writers room (team 2) with its own leader (head writer). Creative development (team 1) defines WHAT to tell. Writers room defines HOW to write it. Creative director approves but doesn't execute writing.
- **Alternatives considered:** Keep writing in team 1 (rejected — overloads creative director, different specializations needed for different script types).
- **Impact:** Added 4 new specialized writers (copywriter, fiction, documentary, explainer) plus structuralist. Total team 2 = 7 agents.
- **Status:** Active.

### DEC-009: 5 showrunner gates

- **Context:** Need quality checkpoints throughout the pipeline.
- **Decision:** 5 mandatory gates: G1 post-concept, G2 post-script, G3 post-storyboard, G4 first cut, G5 final cut. No project advances without showrunner approval at each gate.
- **Rationale:** Early gates are cheap to fail (rewriting a script costs tokens). Late gates are expensive (re-generating video costs time and API credits). The showrunner is MORE demanding in early gates.
- **Impact:** Defines the pipeline structure and where quality is enforced.
- **Status:** Active.

### DEC-010: 3+3 rule for escalation

- **Context:** Need a clear rule for when to involve humans.
- **Decision:** Sub-agent tries 3 times with original parameters. If all fail, leader adjusts parameters, sub-agent tries 3 more. After 6 total failures, escalate to human.
- **Rationale:** Maximizes automation (6 attempts) without infinite loops. Generates data on which tasks AI handles well vs needs humans.
- **Impact:** Defines the human intervention threshold across the entire system.
- **Status:** Active.

### DEC-011: Cross-functional agents outside all teams

- **Context:** Quality evaluation agents (critic, compliance, brand, accessibility) need independence.
- **Decision:** 4 cross-functional agents report to showrunner + PM, not to any team. They have veto power and can pause the pipeline.
- **Rationale:** If the critic reports to the DP, the DP can pressure to lower standards. Independence = objectivity.
- **Impact:** Creates a quality enforcement layer that operates across all teams.
- **Status:** Active.

### DEC-012: Foley artist as separate agent from sonorizador

- **Context:** Audio was initially handled by one agent (sonorizador) doing everything.
- **Decision:** Three specialized audio agents: sonorizador (VO, music, editorial SFX), sound designer (atmospheres, spatiality), foley artist (diegetic SFX synced to visual events frame-by-frame).
- **Rationale:** Three fundamentally different types of audio work. Foley requires vision-to-audio analysis which is a completely different skill than music composition or ambient design.
- **Impact:** Added foley artist with 7 specialized skills including frame-accurate synchronization.
- **Status:** Active.

### DEC-013: Producer moved to top-level

- **Context:** Producer was originally a team leader but their role is cross-team (breakdown, assets, logistics for all departments).
- **Decision:** Move producer to top-level alongside PM and showrunner. Creates a leadership triad: PM (when/how much), showrunner (what/how well), producer (with what).
- **Impact:** Producer works across all teams without being confined to one.
- **Status:** Active.

### DEC-014: Operations team as shared services candidate

- **Context:** CriteriaFilms is part of criteria.agency ecosystem. Need to plan for shared services.
- **Decision:** Team 8 (operations & finance) is the primary candidate for shared services. Financial, accounting, legal, CTO, and analytics functions are generic enough to serve both criteriafilms.com and criteria.agency.
- **Additional candidates:** Parts of team 7 (onboarding, client service) could also be shared.
- **Impact:** Team 8 should be designed as a separable microservice from the start.
- **Status:** Active — to be detailed during technical architecture phase.

### DEC-015: Documentation system for project continuity

- **Context:** All project decisions exist only in chat conversations. Claude has no memory between sessions.
- **Decision:** Create 7 master documents as the project's source of truth: PROJECT_VISION, AGENT_REGISTRY, TEAM_STRUCTURE, PRODUCTION_PIPELINE, PORTAL_SPECS, TECH_ARCHITECTURE, DECISION_LOG. Upload relevant documents at the start of each work session.
- **Impact:** Ensures project continuity across sessions and prevents contradictory decisions.
- **Status:** Active. First 5 documents created in this session.

---

## Session 2 — April 5, 2026: Documentation overhaul

### DEC-016: MVP phased rollout (3 phases)

- **Context:** Cannot launch all 47 agents simultaneously. Need an incremental path from current state (manual AI production) to full system.
- **Decision:** 3-phase rollout: Phase 1 (20 agents, core pipeline + Team 9), Phase 2 (+10, quality expansion), Phase 3 (+17, full system). Each phase must meet advance criteria before expanding.
- **Alternatives considered:** Big bang launch (rejected — too risky, no way to validate assumptions); 2-phase only (rejected — jump from 20 to full is too large).
- **Impact:** Defines MVP_ROADMAP.md. All agents assigned to a phase. Implementation starts with Phase 1.
- **Status:** Active.

### DEC-017: Agent registry restructured as technical reference cards

- **Context:** AGENT_REGISTRY had narrative descriptions overlapping with TEAM_STRUCTURE. Hard to scan, redundant information.
- **Decision:** Convert to standardized reference cards with 8 fields: Phase, Inputs, Process, Outputs, Tools/Models, Quality criteria, Dependencies, Replaceable by human. Remove team structure info (lives in TEAM_STRUCTURE.md).
- **Alternatives considered:** Keep narrative format with deduplication only (rejected — still hard to scan for quick lookup).
- **Impact:** AGENT_REGISTRY becomes a technical lookup tool. TEAM_STRUCTURE becomes the single source for organizational info.
- **Status:** Active.

### DEC-018: Three new master documents added

- **Context:** Original 5 docs are insufficient for implementation. Missing: phased rollout plan, technical architecture, portal specifications.
- **Decision:** Add MVP_ROADMAP.md, TECH_ARCHITECTURE.md, PORTAL_SPECS.md. Total master documents: 8.
- **Alternatives considered:** Embedding this content in existing docs (rejected — would make existing docs too long and lose focus).
- **Impact:** Completes the documentation system needed for implementation.
- **Status:** Active.

### DEC-019: Agent count corrected to 47

- **Context:** Original documentation stated 38 agents. Careful count of the agent registry reveals 41 distinct agents: 3 top-level + 34 in teams (8 leaders + 26 sub-agents) + 4 cross-functional. With Team 9 (6 agents), total is 47.
- **Decision:** Correct agent count to 47 across all documents. Phase distribution: 20 (Phase 1) + 10 (Phase 2) + 17 (Phase 3) = 47.
- **Alternatives considered:** Consolidating agents to reach original 38 (rejected — all agents serve distinct purposes).
- **Impact:** All documents updated to reflect correct count.
- **Status:** Active.

### DEC-020: Team 9 — AI Model Intelligence created

- **Context:** No dedicated agents for deep AI model knowledge. CTO (T8-003) was handling model selection, and Cost Estimator (T8-004) tracked per-model costs, but neither had the depth needed for optimal model usage across all production tasks.
- **Decision:** Create Team 9: AI Model Intelligence with 6 agents: AI Model Director (leader), Text Model Specialist, Image Model Specialist, Video Model Specialist, Audio Model Specialist, Model Benchmarker / Evaluator. Hybrid structure with leader + 4 specialists by model type + 1 benchmarker. All 6 in Phase 1 (critical from day 1). Reports to PM (transversal knowledge, not creative).
- **Alternatives considered:** Adding model knowledge to existing agents (rejected — each agent already has their specialty, adding deep model knowledge would dilute focus); single "AI Model Expert" agent (rejected — model types are too different for one agent to have deep expertise in all).
- **Impact:** 47 agents total. Team 9 provides the intelligence layer that all production agents consume when using AI models.
- **Status:** Active.

### DEC-021: Team 9 absorbs model expertise from CTO and Cost Estimator

- **Context:** CTO (T8-003) had "AI model selection and configuration per shot type" in their skills. Cost Estimator (T8-004) had detailed per-model cost knowledge. These overlap with Team 9's purpose.
- **Decision:** Transfer model selection duties from CTO to Team 9. Transfer per-model cost knowledge from Cost Estimator to Team 9. CTO retains infrastructure, APIs, and deployment. Cost Estimator retains pricing, margins, and quotations.
- **Alternatives considered:** Keeping overlap (rejected — violates hyper-specialization principle and creates conflicting model recommendations).
- **Impact:** Clean separation of responsibilities. Team 9 owns model intelligence. T8 owns infrastructure and financial operations.
- **Status:** Active.

### DEC-022: Two-layer storage architecture (R2 + Bunny Stream)

- **Context:** The production pipeline generates heavy video/image/audio assets that are iterated multiple times (3+3 rule). Internal transfers between agents during generation cycles create significant egress costs with traditional cloud storage. Client and public delivery needs adaptive bitrate, CDN, and video protection.
- **Decision:** Two-layer storage: Cloudflare R2 for internal pipeline storage (production assets, clips, iterations between agents — zero egress cost), Bunny Stream for client/public video delivery (adaptive bitrate, global CDN, built-in player, DRM/hotlink protection).
- **Alternatives considered:** AWS S3 for everything (rejected — egress costs multiply with iterative generation); single CDN like Cloudflare Stream (rejected — Bunny Stream offers better pricing for video-specific delivery with built-in player and adaptive bitrate); self-hosted (rejected — operational overhead for video transcoding and CDN).
- **Impact:** Significantly reduces storage costs during production (R2 egress is free). Client experience improved with professional video delivery (Bunny Stream player with adaptive bitrate). Architecture cleanly separates production storage from delivery.
- **Status:** Active.

---

## Pending decisions (to be made in future sessions)

- Admin portal agent integration specifics (how agents are configured and monitored in the UI)
- Client portal commenting system UX details (wireframes, interaction design)
- Final technical stack selection (pending prototype validation — storage decision made, see DEC-022)
- AI model selection per agent (pending Team 9 benchmarking)
- Deployment pipeline and CI/CD setup
- Pricing model for each business model (packages, per-project, retainer rates)
- School curriculum structure and course design
- criteria.agency shared services implementation timeline
