# criteria.agency — Decision Log

> Last updated: April 6, 2026
> Sessions: 4 | Decisions: DEC-001 through DEC-045

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
- **Impact:** Increases system complexity but significantly raises quality ceiling.
- **Status:** Superseded by DEC-023 (expanded to 24 motors with ~125 agents).

### DEC-005: Team structure (8 teams, not flat)

- **Context:** 38 agents need organizational structure to avoid chaos.
- **Decision:** 8 teams with leaders and sub-agents, mirroring real film production departments. Sub-agents only communicate with their leader.
- **Impact:** Defines communication protocols, escalation paths, and how agents are implemented.
- **Status:** Active for Video motor. Expanded by DEC-023 to 24 motors with their own teams.

### DEC-006: Showrunner as top-level agent

- **Context:** No single agent had the complete picture of a project with authority to enforce coherence.
- **Decision:** Create showrunner agent above all creative teams, separate from PM and creative director. The showrunner evaluates and guards the vision across all phases.
- **Impact:** Adds the 5-gate quality system. The showrunner becomes the highest creative authority per project.
- **Status:** Active for Video motor.

### DEC-007: Showrunner vs creative director — separate roles

- **Context:** Both roles deal with creative vision. Why not merge them?
- **Decision:** Keep them separate. Creative director GENERATES ideas. Showrunner EVALUATES if execution fulfills those ideas. Separation of generation and evaluation prevents bias.
- **Status:** Active.

### DEC-008: Writers room as independent team

- **Context:** Originally, script writing was inside the creative development team. Creative director was overloaded.
- **Decision:** Separate writers room (team 2) with its own leader (head writer). Creative development defines WHAT to tell. Writers room defines HOW to write it.
- **Status:** Active.

### DEC-009: 5 showrunner gates

- **Context:** Need quality checkpoints throughout the pipeline.
- **Decision:** 5 mandatory gates: G1 post-concept, G2 post-script, G3 post-storyboard, G4 first cut, G5 final cut.
- **Rationale:** Early gates are cheap to fail (rewriting a script costs tokens). Late gates are expensive (re-generating video costs API credits).
- **Status:** Active for Video motor. Other motors define their own gates.

### DEC-010: 3+3 rule for escalation

- **Context:** Need a clear rule for when to involve humans.
- **Decision:** Sub-agent tries 3 times with original parameters. If all fail, leader adjusts parameters, sub-agent tries 3 more. After 6 total failures, escalate to human.
- **Rationale:** Maximizes automation (6 attempts) without infinite loops.
- **Impact:** Defines the human intervention threshold across the entire system. Shared by all 24 motors.
- **Status:** Active.

### DEC-011: Cross-functional agents outside all teams

- **Context:** Quality evaluation agents need independence.
- **Decision:** 4 cross-functional agents report to showrunner + PM, not to any team. They have veto power and can pause the pipeline.
- **Rationale:** Independence = objectivity. Same principle applies to Security Team.
- **Status:** Active.

### DEC-012: Foley artist as separate agent from sonorizador

- **Context:** Audio was initially handled by one agent doing everything.
- **Decision:** Three specialized audio agents: sonorizador, sound designer, foley artist.
- **Status:** Active.

### DEC-013: Producer moved to top-level

- **Context:** Producer's role is cross-team (breakdown, assets, logistics for all departments).
- **Decision:** Move producer to top-level alongside PM and showrunner. Leadership triad: PM (when/how much), showrunner (what/how well), producer (with what).
- **Status:** Active.

### DEC-014: Operations team as shared services candidate

- **Context:** CriteriaFilms is part of criteria.agency ecosystem.
- **Decision:** Team 8 (operations & finance) designed as separable module with shared auth (SSO).
- **Status:** Superseded by DEC-023 (operations now part of the 24-motor platform architecture).

### DEC-015: Documentation system for project continuity

- **Context:** Decisions exist only in chat. Claude has no memory between sessions.
- **Decision:** Master documents as project source of truth: PROJECT_VISION, AGENT_REGISTRY, TEAM_STRUCTURE, PRODUCTION_PIPELINE, PORTAL_SPECS, TECH_ARCHITECTURE, DECISION_LOG, SESSION_CONTEXT, MVP_ROADMAP.
- **Status:** Active. Documents expanded with spec files in `docs/superpowers/specs/`.

---

## Session 2 — April 5, 2026: Documentation overhaul

### DEC-016: MVP phased rollout (3 phases)

- **Context:** Cannot launch all 47 video agents simultaneously.
- **Decision:** 3-phase rollout for Video motor: Phase 1 (20 agents), Phase 2 (+10), Phase 3 (+17).
- **Status:** Active for Video motor. Platform-wide rollout defined separately in DEC-035.

### DEC-017: Agent registry restructured as technical reference cards

- **Context:** AGENT_REGISTRY had narrative descriptions overlapping with TEAM_STRUCTURE.
- **Decision:** Convert to standardized reference cards with 8 fields per agent.
- **Status:** Active.

### DEC-018: Three new master documents added

- **Decision:** Add MVP_ROADMAP.md, TECH_ARCHITECTURE.md, PORTAL_SPECS.md.
- **Status:** Active. PORTAL_SPECS.md completely rewritten in DEC-030.

### DEC-019: Agent count corrected to 47

- **Decision:** Correct Video motor agent count to 47 across all documents.
- **Status:** Active for Video motor. Total platform count is ~125 (DEC-023).

### DEC-020: Team 9 — AI Model Intelligence created

- **Decision:** 6 agents for model selection, benchmarking, and optimization across all production tasks.
- **Status:** Active.

### DEC-021: Team 9 absorbs model expertise from CTO and Cost Estimator

- **Decision:** Transfer model selection duties from CTO and per-model cost knowledge from Cost Estimator to Team 9.
- **Status:** Active.

### DEC-022: Two-layer storage architecture (R2 + Bunny Stream)

- **Decision:** Cloudflare R2 for internal pipeline (zero egress), Bunny Stream for delivery (CDN, DRM).
- **Status:** Active.

---

## Session 3 — April 6, 2026: Platform architecture expansion

### DEC-023: Expansion from 4 engines to 24 motors

- **Context:** Original architecture had 4 engines (Video, Marketing, Sales, Design). Analysis of complete marketing agency needs revealed this was insufficient.
- **Decision:** Expand to 24 motors organized in 6 categories: Creation (6), Strategy (2), Intelligence (5), Distribution (4), Operation (2), Transversal (6). Total ~125 agents across 23 teams + 9 transversal agents + 6 security agents.
- **Alternatives considered:** Keeping 4 broad engines (rejected — each marketing function needs its own pipeline, gates, and specialized agents); creating >30 motors (rejected — some functions are better as agents within motors rather than separate motors).
- **Impact:** Fundamental architecture change. Requires Event Bus, motor lifecycle management, and significant schema expansion.
- **Status:** Active.

### DEC-024: Three motor lifecycle modes

- **Context:** Video is project-oriented (start → delivery → end) but marketing activities like social media monitoring run continuously.
- **Decision:** Three modes: Project (start → end), Continuous (runs indefinitely), Hybrid (project phase → continuous optimization). Each motor declares its mode.
- **Alternatives considered:** All project-based (rejected — continuous monitoring doesn't fit); all continuous (rejected — video production has clear start/end).
- **Impact:** Orchestrator must handle three different execution patterns.
- **Status:** Active.

### DEC-025: Configurable autonomy per motor

- **Context:** Some clients want full AI automation, others want to approve everything.
- **Decision:** Two modes configurable per motor: "AI decides + human supervises" (AI executes, human monitors) and "AI recommends + human approves" (AI proposes, human approves before execution).
- **Alternatives considered:** Fixed autonomy for all (rejected — different clients have different trust levels); per-agent autonomy (rejected — too granular, confusing for clients).
- **Impact:** All critical action gates must check autonomy setting.
- **Status:** Active.

### DEC-026: Bidirectional cross-motor communication

- **Context:** Motors need to collaborate (e.g., Strategist defines campaign → triggers creation in Video + Design + Ads).
- **Decision:** Bidirectional automatic via Event Bus. Any motor can trigger work in any other motor via typed events. No manual routing.
- **Alternatives considered:** Manual routing through admin (rejected — too slow); unidirectional (rejected — Analytics needs to feed back to Strategy, creating loops).
- **Impact:** Requires Event Bus infrastructure (Redis + BullMQ) with subscription management.
- **Status:** Active.

### DEC-027: Funnel Matrix as central organizing concept

- **Context:** Need a framework to organize marketing activities across channels and funnel stages.
- **Decision:** Funnel Matrix: Awareness/Consideration/Conversion/Retention × Paid/Owned/Earned as the central framework. The Strategist uses this to plan, Ads/Email/SEO/CM execute within it, Analytics measures against it.
- **Impact:** Affects campaign data model, analytics dimensions, and client-facing reports.
- **Status:** Active.

### DEC-028: Channel Manager as single agent with skill registry

- **Context:** Need to support many channels (Meta, Google, TikTok, LinkedIn, traditional media, custom channels).
- **Decision:** One Channel Manager agent with an extensible skill registry. Each channel is a skill (API integration, best practices, limits, pricing). New channels added by adding skills, not new agents.
- **Alternatives considered:** One agent per channel (rejected — doesn't scale, too many agents); hardcoded channel list (rejected — need to support traditional + custom channels).
- **Impact:** Skill registry becomes a key extensibility pattern for the platform.
- **Status:** Active.

### DEC-029: Strategist powered by Harvard M1-M6 framework

- **Context:** The Strategist agent needs a strong academic foundation for marketing strategy.
- **Decision:** Inject Harvard Digital Marketing Strategy course content (M1-M6) as knowledge base: M1 (Marketing in Digital Era), M2 (Marketing Plan), M3 (Paid Media), M4 (Owned & Earned), M5 (Customer Engagement), M6 (Budget & Measurement).
- **Impact:** PDFs stored in `docs/brain/`. Strategist agent's system prompt includes this framework.
- **Status:** Active.

### DEC-030: Portal specs complete rewrite

- **Context:** PORTAL_SPECS.md was CriteriaFilms-centric (220 lines, video-only). Needed to reflect 24-motor platform.
- **Decision:** Complete rewrite to 841 lines covering: Admin Portal (Mission Control, 24 motors by category, backoffice modules by role), Client Portal (6 outcome-based Spaces, tiered access), Public Portal (SaaS marketing site + pricing).
- **Impact:** Defines the complete UI/UX spec for all three portals.
- **Status:** Active.

### DEC-031: Client navigation via 6 outcome-based Spaces

- **Context:** 24 motors is overwhelming for SME clients. Need simple navigation.
- **Decision:** 6 Spaces: Crear, Comunicar, Entender, Vender, Mi Marca, Cuenta. Clients navigate by what they want to achieve, not by which motor does it.
- **Alternatives considered:** Exposing motors directly (rejected — too complex for target audience); category-based (rejected — categories are system-oriented, not outcome-oriented).
- **Impact:** Client portal UX completely hides the 24-motor structure.
- **Status:** Active.

### DEC-032: Admin navigation shows real structure

- **Context:** Admin needs to manage the actual system, not a simplified view.
- **Decision:** Admin sidebar organized by motor category (Creation/Strategy/Intelligence/Distribution/Operation/Transversal), showing all 24 motors. Unimplemented motors grayed out with "Proximamente".
- **Impact:** Admin sees and controls the full architecture.
- **Status:** Active.

### DEC-033: Tiered client model (Free/Pro/Enterprise)

- **Context:** Different clients need different levels of service.
- **Decision:** Free (limited motors, AI only), Pro (all motors, self-service + AI Copilot), Enterprise (+ human Account Executive + custom integrations).
- **Impact:** Permission model must support feature gating by tier.
- **Status:** Active.

### DEC-034: CriteriaFilms.com as marketing asset, not separate platform

- **Context:** Was originally presented as separate deployment / white-label / subdomain.
- **Decision:** CriteriaFilms.com is a marketing asset produced by criteria.agency's Web motor. Has its own domain but lives internally as `/marketing/client/campaigns/assets`.
- **Impact:** No separate deployment or codebase for CriteriaFilms.
- **Status:** Active.

### DEC-035: Platform-wide 4-phase rollout

- **Context:** Need phased deployment for 24 motors.
- **Decision:** Phase 1 (~15 agents + Event Bus infra), Phase 2 (~15 distribution agents), Phase 3 (~19 operations agents), Phase 4 (scale + marketplace). Separate from Video motor's 3-phase rollout.
- **Impact:** Defines implementation order for the entire platform.
- **Status:** Active.

### DEC-036: Events motor added

- **Context:** Marketing agencies organize physical events (launches, conferences, brand activations).
- **Decision:** Add Events motor to Creation category with agents for venue management, catering, decoration, invitations, rundown planning, follow-up, and success measurement.
- **Impact:** +1 motor, additional pipeline with 3 gates.
- **Status:** Active.

### DEC-037: Marketplace motor for agentic/human providers

- **Context:** Not all services can be handled by AI agents (e.g., photography, venue rental, printing).
- **Decision:** Marketplace motor where external providers (AI services or human freelancers) can be contracted for specific tasks. Provider types: AI API (Runway, ElevenLabs), Human freelancer, Agency, Physical provider (venues, catering).
- **Impact:** Enables the platform to handle any marketing need even when no internal motor covers it.
- **Status:** Active.

### DEC-038: Security Team (6 agents)

- **Context:** Platform handles sensitive client data and financial APIs. Needs dedicated security.
- **Decision:** 6-agent Security Team: Security Architect (leader), Code Guardian, Infrastructure Sentinel, Data Protection Officer, Agent Auditor, Threat Hunter. All operate in Continuous mode.
- **Impact:** Security is an autonomous, always-on function, not a manual checklist.
- **Status:** Active.

### DEC-039: Backoffice modules in admin portal, access by role

- **Context:** Internal business functions (finance, accounting, HR, etc.) need a home.
- **Decision:** 6 backoffice modules in the same admin portal, visible only to Platform Admin role: Finanzas, Contabilidad, RRHH, Proyectos Internos, Clientes/Usuarios, Analytics Interno.
- **Alternatives considered:** Separate backoffice portal (rejected — unnecessary complexity for single founder); third-party tools only (rejected — need integration with platform data).
- **Impact:** Admin portal serves dual purpose: platform management + business operations.
- **Status:** Active.

### DEC-040: Hybrid agent communication (intra-motor + cross-motor)

- **Context:** Agents need to communicate at two scopes: within their motor and across motors.
- **Decision:** Intra-motor via synchronous TaskMessage/ResultMessage (leader assigns to sub-agents). Cross-motor via asynchronous typed Event Bus (Redis + BullMQ).
- **Alternatives considered:** All synchronous (rejected — doesn't scale across motors); all async (rejected — intra-motor communication is naturally synchronous and sequential).
- **Impact:** Two communication protocols to implement and maintain.
- **Status:** Active.

---

## Session 4 — April 6, 2026: Security framework

### DEC-041: GDPR as security/compliance baseline

- **Context:** criteria.agency targets LATAM but may have clients anywhere. Multiple data protection laws apply.
- **Decision:** Design for GDPR compliance as the baseline standard. If we comply with GDPR, we comply with LGPD, CCPA, LFPDPPP with minor jurisdictional adjustments.
- **Alternatives considered:** LATAM-only compliance (rejected — limits expansion); per-jurisdiction from scratch (rejected — redundant effort).
- **Impact:** One high standard instead of multiple medium standards.
- **Status:** Active.

### DEC-042: Hybrid secrets management (env vars + encrypted DB)

- **Context:** Need to manage both system secrets (DB credentials, API keys) and client secrets (their Meta/Google/Mailchimp API keys).
- **Decision:** System secrets in hosting env vars (Railway/Fly.io). Client secrets encrypted in PostgreSQL with AES-256-GCM, key derived from MASTER_ENCRYPTION_KEY + unique salt per tenant.
- **Alternatives considered:** Vault (HashiCorp) for everything (rejected — too much infra for current stage); all in DB (rejected — DB compromise exposes everything).
- **Impact:** Separation of concerns. System secrets never in DB, client secrets have per-tenant encryption.
- **Status:** Active.

### DEC-043: Layered agent sandboxing (soft sandbox + critical action gates)

- **Context:** ~125 agents operating autonomously with client data could cause damage if compromised.
- **Decision:** Declarative permissions per agent (artifacts, tools, APIs, cost limits) enforced at 6 points (pre-execution, tool call, data access, API call, artifact write, cost check). Critical actions (spend money, publish content, send mass email) require explicit gate approval.
- **Alternatives considered:** Process isolation per agent (rejected — too expensive, one container per execution); no sandbox (rejected — unacceptable risk with financial APIs).
- **Impact:** Every agent must declare permissions. Orchestrator validates at every enforcement point.
- **Status:** Active.

### DEC-044: Better Auth for authentication

- **Context:** Need multi-portal auth with roles, organizations, and Hono support.
- **Decision:** Better Auth — open-source, MIT license, first-class Hono support, organizations/roles/permissions built-in. Sessions via HTTP-only cookies with rotation.
- **Alternatives considered:** NextAuth.js (rejected — Next.js specific, doesn't cover Hono API); Clerk (rejected — vendor lock-in, paid); Firebase Auth (rejected — migrating away from Firebase ecosystem).
- **Impact:** Auth framework for all 3 portals and API.
- **Status:** Active.

### DEC-045: Business continuity plan for single-founder risk

- **Context:** Only one person (founder) operates the entire platform. Absence creates critical risk.
- **Decision:** Autonomous mode activates after 48h of no admin activity: continuous motors run in conservative mode, project motors pause at next gate, critical actions queue up. Emergency runbook + emergency contact with limited access (pause + read-only status).
- **Impact:** Platform can survive founder absence without data loss or uncontrolled actions.
- **Status:** Active.

---

## Pending Decisions

- Database schema evolution details (exact table definitions for multi-tenancy, events, secrets)
- API contract design (full endpoint specification beyond video motor)
- Agent registries for non-video motors (detailed agent cards for ~80 agents)
- Testing strategy (what to test, coverage targets, testing frameworks)
- CI/CD pipeline design (deployment flow, environments, rollback)
- Pricing model details (exact feature gates per tier, pricing per Space)
- School curriculum structure (CriteriaFilms AI filmmaking school)
- Deployment environment setup (staging, production)
