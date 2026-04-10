# criteria.agency — Decision Log

> Last updated: April 9, 2026
> Sessions: 17 | Decisions: DEC-001 through DEC-216

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
- **Decision:** Complete rewrite to 841 lines covering: Admin Portal (Mission Control, 24 motors by category, backoffice modules by role), Client Portal (sidebar nav with Fundamentos/Inteligencia/Ejecución/Tools, tiered access — originally spec'd as 6 outcome-based Spaces, see DEC-036), Public Portal (SaaS marketing site + pricing).
- **Impact:** Defines the complete UI/UX spec for all three portals.
- **Status:** Active.

### DEC-031: Client navigation via 6 outcome-based Spaces

- **Context:** 24 motors is overwhelming for SME clients. Need simple navigation.
- **Decision:** 6 Spaces: Crear, Comunicar, Entender, Vender, Mi Marca, Cuenta. Clients navigate by what they want to achieve, not by which motor does it.
- **Alternatives considered:** Exposing motors directly (rejected — too complex for target audience); category-based (rejected — categories are system-oriented, not outcome-oriented).
- **Impact:** Client portal UX completely hides the 24-motor structure.
- **Status:** Superseded by DEC-036.

### DEC-036: Client navigation redesigned as left sidebar with 4 groups

- **Context:** Outcome-based Spaces (DEC-031) were replaced during implementation. The portal grew to include intelligence, marketplace, and file management sections that didn't map cleanly to the original 6 Spaces. Also, "Blueprint" was renamed "Business" and "Plan" was split into discrete sections.
- **Decision:** Left sidebar with 4 named groups — Fundamentos (Business, Brand, Productos y Servicios, Revenue Streams), Inteligencia (Mercado, Competencia), Ejecución (Campaigns, Sales), Tools (Studio, Marketplace, Directorio, Drive, Reportes). Route `/blueprint` → `/business`. Former Plan tabs (Mercado, Competencia) promoted to top-level sidebar items under Inteligencia; Campaigns remains under Ejecución.
- **Alternatives considered:** Keeping 6 Spaces (rejected — didn't accommodate new sections cleanly); flat list (rejected — too long without grouping).
- **Impact:** Client portal sidebar replaces top tab bar. All route references to `/blueprint` and `/plan` are superseded.
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

## Session 5 — April 8, 2026: Client Portal navigation redesign

### DEC-046: Funnel Matrix as Home (replaces sidebar navigation)

- **Context:** Previous design (DEC-036) had a left sidebar with 4 groups (Fundamentos/Inteligencia/Ejecucion/Tools). Analyzing from the client's pain points revealed that the navigation should reflect the client's work, not the platform's structure.
- **Decision:** The Funnel Matrix (channels × funnel stages: Awareness/Consideration/Conversion/Retention) IS the Home and primary interface. No sidebar. All other access via header dropdowns. The entire screen is the matrix.
- **Alternatives considered:** Keeping sidebar with fewer items (rejected — even a minimal sidebar competes with the matrix for attention); dashboard with KPIs (rejected — abstract numbers vs actionable matrix).
- **Impact:** Fundamental UX change. Every interaction starts from the matrix. Motors surface contextually within campaigns, not in navigation.
- **Status:** Active. Supersedes DEC-036.

### DEC-047: No sidebar — all access via header dropdowns

- **Context:** With the Funnel Matrix as Home, the sidebar becomes unnecessary.
- **Decision:** Header contains: Logo, Search (Cmd+K), Tools (dropdown), Compass/Brujula (dropdown), Bell (dropdown), Avatar (dropdown). All open as lightweight dropdowns, not side panels. Click on a tool item opens full-screen view.
- **Impact:** Maximum screen space for the matrix. Clean, minimal interface.
- **Status:** Active.

### DEC-048: Sales/CRM lives inside the Funnel Matrix + CRM as Tool

- **Context:** Sales is fundamentally part of the marketing cycle, not a separate world.
- **Decision:** Sales lives in the Conversion and Retention columns of the Funnel Matrix. A lead entering via Meta Ads Awareness flows through to Conversion in the same matrix. Additionally, CRM exists as a Tool for the consolidated pipeline view (all leads across all channels) for salespeople who need that daily working view.
- **Alternatives considered:** Sales as separate sidebar item (rejected — reinforces the marketing/sales divide); Sales only in matrix (rejected — vendedores need consolidated pipeline view).
- **Impact:** No separate Sales section. The funnel is continuous.
- **Status:** Active.

### DEC-049: Brand Health Score with 3 axes

- **Context:** Need a single metric that unifies the state of the client's base with the effectiveness of their execution and market opportunity.
- **Decision:** Global score visible at all times with 3 axes: (1) Fundamentos — "¿Estoy listo?" (completeness/depth of base), (2) Ejecucion — "¿Lo estoy haciendo bien?" (campaign performance, brand consistency), (3) Oportunidad — "¿Estoy haciendo lo suficiente?" (investment vs market opportunity, activity vs competition). Expandable to see breakdown and recommended actions. Each action links directly to relevant capability.
- **Impact:** The score is both a diagnostic tool and the primary upsell driver — every low sub-score suggests a capability the client should activate.
- **Status:** Active.

### DEC-050: Strategist as continuous motor (evaluate → design → adjust)

- **Context:** The Strategist was initially conceived as a motor that runs once to produce a marketing plan.
- **Decision:** The Strategist operates continuously with three functions: (1) Evaluate — maintains brand health score, detects gaps, compares against market; (2) Design — translates diagnosis into pre-configured campaigns with objectives, audience, budget, calendar; (3) Adjust — reads campaign results and modifies (reallocate budget, propose new assets, scale/pause). This creates a perpetual cycle: evaluate → design → execute → measure → adjust → repeat.
- **Impact:** The Strategist becomes the most important motor — the brain behind the most visible metric in the platform and the engine for campaign design and optimization.
- **Status:** Active.

### DEC-051: Mi Negocio in avatar dropdown (not in sidebar/navigation)

- **Context:** The client's business base (brand, model, audiences, value proposition, objectives) is configured once and updated rarely. It shouldn't compete for attention with the Funnel Matrix.
- **Decision:** Mi Negocio lives in the avatar dropdown alongside Mi Cuenta and Settings. Contains: Brand DNA, Business Model, Products & Services, Audiences, Value Proposition, Revenue Streams, Markets, Business Objectives. Three configuration paths: manual (self-service), copilot (AI-guided), workshop (human experts). Depth of configuration reflected in brand health score.
- **Impact:** Navigation stays clean. Mi Negocio is accessible but not prominent. The brand health score drives the client back when attention is needed.
- **Status:** Active. Supersedes Fundamentos group from DEC-036.

### DEC-052: Tools as header dropdown (6 tools)

- **Context:** Tools need quick access without occupying sidebar space.
- **Decision:** Tools dropdown in header with 6 items: Studio (free creation), CRM (consolidated pipeline), Research (market intelligence), Marketplace (external providers), Drive (files/assets), Reportes (on-demand reports). Directorio removed — absorbed by Marketplace.
- **Impact:** Clean header access to all utilities. Each opens in full-screen view.
- **Status:** Active.

### DEC-053: Compass (Brujula) for intelligence in header

- **Context:** Market intelligence needs a visible but non-intrusive access point, separate from operational notifications.
- **Decision:** Compass icon in header with badge. Dropdown shows recent strategic insights from Listeners (market movements, competitive alerts, trends, opportunities). Separate from Bell (operational notifications). Compass = strategic (inform decisions), Bell = operational (requires action). Compass links to relevant matrix cells for actionable insights; "Ver mas" links to Research tool for depth.
- **Impact:** Two distinct notification channels with clear purposes. Intelligence doesn't get lost in operational noise.
- **Status:** Active.

### DEC-054: Onboarding via URL analysis (two paths)

- **Context:** Onboarding should minimize client effort while maximizing initial platform value.
- **Decision:** Modal flow. After registration and basic business info, one question: "¿Ya tienes una marca o empiezas de cero?" Path A (has brand): provide URLs → platform analyzes website + social media + competition automatically → generates draft of Mi Negocio → pre-populates Funnel Matrix with detected presence. Path B (from scratch): copilot conversation with 3 minimum questions → generates preliminary Brand DNA. Minimum to exit modal: registration + basic info + one URL (A) or 3 answers (B). Everything else raises brand health score.
- **Impact:** Dramatic reduction in onboarding friction. Client sees their reality reflected immediately without filling forms.
- **Status:** Active.

### DEC-055: Contextual warnings, not blocks

- **Context:** Clients with incomplete base want to create campaigns. Should they be blocked?
- **Decision:** Never block. Show contextual warnings explaining consequences: "We can produce the video, but without brand identity we can't guarantee visual consistency. Complete your brand first or continue without it?" The client decides. Generic output without base; professional output with base. The difference is reflected in the brand health score over time.
- **Impact:** Respects impatient clients. The brand health score teaches them why the base matters, not a popup.
- **Status:** Active.

### DEC-056: AI Copilot as chat bubble (configurable proactivity)

- **Context:** Need an alternative interface for clients who prefer conversational interaction.
- **Decision:** Chat bubble with criteria.agency identity (not generic support icon). Functions as natural language control for the entire platform — everything the visual interface does. When the copilot acts, the visual interface reflects it (matrix highlights, forms open, etc.). Proactivity configurable in Settings: silent (only speaks when spoken to), moderate (alerts on important changes), active (suggests, recommends, initiates conversations).
- **Impact:** Two parallel interfaces to the same system. The client chooses their preferred interaction mode.
- **Status:** Active.

### DEC-057: Campaign creation from matrix cells (pre-configured by Strategist)

- **Context:** Creating a campaign from a Funnel Matrix cell provides two data points (channel + funnel stage) which is enough context for intelligent pre-configuration.
- **Decision:** When creating a campaign from a cell, the Strategist pre-configures: suggested objectives (metrics appropriate to funnel stage, targets based on market benchmarking), content format (appropriate to channel), relevant motors (surfaced contextually), audience (from Mi Negocio), budget (from Financial Agent + competitive benchmarking), calendar. Objectives must be structured: metric, target, deadline, baseline. Strategist validates achievability.
- **Impact:** The client never starts from a blank form. Every campaign starts as a professional recommendation.
- **Status:** Active.

### DEC-058: Strategist and Listeners remain independent motors

- **Context:** The Strategist depends heavily on Listener data. Should they be integrated?
- **Decision:** Independent motors communicating via Event Bus. Listeners are neutral observers — they report what's happening without agenda. The Strategist interprets data and makes decisions. Separation prevents circular bias (Strategist designing → Listeners confirming what Strategist wants to hear).
- **Impact:** Clean separation of observation and decision-making. Different lifecycle modes (Listeners continuous, Strategist hybrid). Different AI model requirements (Listeners: cheap extraction models, Strategist: deep reasoning).
- **Status:** Active.

### DEC-059: Grid de Campanas como Home, Funnel Matrix como toggle

- **Context:** DEC-046 defined Funnel Matrix as the sole Home. But the creative definition process (creating campaigns, defining versions, iterating concepts) needs its own space separate from the execution/monitoring view.
- **Decision:** Two main views with a toggle: Grid de Campanas (default/Home — create, define, iterate) and Funnel Matrix (execute, monitor, optimize). Both always accessible. Refines DEC-046.
- **Alternatives considered:** Funnel Matrix only (rejected — creative definition process gets lost); separate pages (rejected — too disconnected, need to see both perspectives of the same data).
- **Impact:** Changes the default landing experience from matrix to campaign grid. The matrix becomes the execution lens, not the only lens.
- **Status:** Active. Supersedes DEC-046.

### DEC-060: Campaign hierarchy — Campana → Version → Activacion → Pieza

- **Context:** A campaign is not a single execution in a single channel. "Dia de las Madres" can have romantic, sexy, and tender angles, each deployed across multiple channels and funnel stages, each producing different content types.
- **Decision:** Four-level hierarchy: Campana (thematic concept) → Version (creative angle — NOT A/B variants, but thematic adaptations with their own identity) → Activacion (execution in a specific Funnel Matrix cell: channel × funnel stage) → Pieza (content produced by a motor for that activation).
- **Alternatives considered:** Campana → Activacion → Version (rejected — versions are creative directions, not channel-level tweaks; a "romantic" version maintains its identity across all channels); flat campaign-to-pieces (rejected — loses the creative strategy layer).
- **Impact:** Defines the data model for campaigns. The Creative Director works at version level. The Strategist distributes at activation level. Motors produce at piece level.
- **Status:** Active.

### DEC-061: Creative Director promoted to transversal agent

- **Context:** The Creative Director was originally defined within the Video motor team structure. But campaigns involve multiple motors (video, design, copy, email, web) — creative direction must be consistent across all of them.
- **Decision:** Creative Director becomes a transversal agent operating at campaign level. Proposes creative versions, defines visual and narrative direction per version, iterates with client. The direction then flows down to all motors producing pieces for that version.
- **Alternatives considered:** Keeping Creative Director in Video motor (rejected — a campaign's creative direction isn't just about video); one Creative Director per motor (rejected — fragments the creative vision, causes inconsistency).
- **Impact:** Changes the agent architecture. Creative Director moves from Video motor's team to the transversal agent category alongside Brand Guardian, Financial Agent, etc.
- **Status:** Active.

### DEC-062: Showrunner promoted to transversal, validates at campaign level only

- **Context:** The Showrunner was originally the Video motor's head. But quality validation at the campaign level (is the whole campaign coherent?) is different from quality validation at the piece level (does this video pass its quality gate?).
- **Decision:** Showrunner becomes transversal, validating campaign-level coherence and quality. Individual pieces are validated by each motor's own quality gates. Showrunner feeds the Campaign Score (§4.1 of navigation spec).
- **Alternatives considered:** Showrunner validates everything including pieces (rejected — duplicates motor-level gates, creates bottleneck); no campaign-level validation (rejected — individual pieces can be good but campaign can be incoherent).
- **Impact:** Two-layer quality system: motor gates for pieces, Showrunner for campaign coherence. Campaign Score reflects both layers.
- **Status:** Active.

### DEC-063: Campaign Score feeds Brand Health Score

- **Context:** Each campaign has its own quality trajectory (definition → production → execution). The Brand Health Score's "Ejecucion" axis needs to reflect how well campaigns are performing.
- **Decision:** Campaign Score is a per-campaign metric that evolves with the campaign lifecycle. The weighted average of active Campaign Scores feeds the "Ejecucion" axis of the Brand Health Score. Each low score comes with actionable recommendations.
- **Alternatives considered:** Only global metrics without per-campaign granularity (rejected — can't diagnose which campaign is dragging the score down); Campaign Score without linking to Brand Health (rejected — disconnects the two measurement systems).
- **Impact:** Creates a measurement chain: Pieza quality → Campaign Score → Brand Health Score (Ejecucion axis). Enables drill-down from global health to specific campaign issues.
- **Status:** Active.

---

## Pending Decisions

### DEC-064: Agent vs Skill vs System Function — reduce ~125 agents to ~28

- **Context:** The original architecture designed 47 agents for Video Production alone (modeled after CriteriaFilms cinematic production) and ~125 total. Many "agents" were actually the same LLM with different prompts (Fiction Writer vs Documentary Writer), infrastructure functions dressed as agents (AI Model Intelligence team of 6), or corporate departments (Operations team of 6).
- **Decision:** Distinguish three levels: Agents (autonomous judgment, ~28), Skills (expertise loaded by agents, unlimited), System Functions (automated infrastructure). A "Fiction Writer" becomes a skill the Writer agent loads. Model routing becomes a system function. RGB→CMYK conversion becomes a system function.
- **Alternatives considered:** Keeping 125 agents (rejected — most don't need autonomous judgment); reducing but keeping team structure (rejected — teams of 1 agent are just agents).
- **Impact:** Fundamental architecture simplification. 28 agents are easier to build, test, monitor, and explain. Skills are cheaper to create than agents. System functions are the most reliable.
- **Status:** Active. Supersedes original agent count from DEC-001 era.

### DEC-065: Distribution consolidated from 4 motors to 2 agents (Paid Media + Owned Channels)

- **Context:** Distribution originally had 4 separate motors (Ads ~5 agents, Community Management ~5, Email Marketing ~4, SEO/Content ~4 = ~18 agents). All follow the same pattern: receive brief → execute on channel → optimize → report.
- **Decision:** Two agents grouped by channel nature: Paid Media Operator (real-time bidding, budget, platform APIs — "trader" rhythm) and Owned Channels Operator (content, engagement, organic optimization — "publisher" rhythm). Channel Manager (transversal) provides platform-specific specs to both.
- **Alternatives considered:** 4 separate agents per motor (rejected — too granular for shared patterns); 1 single distribution agent (rejected — paid and owned have fundamentally different decision rhythms).
- **Impact:** 18 agents → 2 agents. Massive simplification of distribution layer. Skills handle platform-specific expertise.
- **Status:** Active.

### DEC-066: Video motor scoped for marketing, CriteriaFilms uses extended skills

- **Context:** The 47-agent Video motor was designed for full cinematic production (CriteriaFilms). criteria.agency produces marketing videos (reels, testimonials, explainers) — same pipeline, lighter execution.
- **Decision:** Video motor in criteria.agency operates with 6 agents (Writer, DP, Visual Designer, Audio, Editor, Quality Reviewer). For cinematic productions, the same agents load additional skills and request human specialists via Marketplace for roles like dedicated colorist or script doctor. The difference is skill depth and gate strictness, not agent count.
- **Alternatives considered:** Separate "Video Lite" and "Video Pro" motors (rejected — same pipeline, same agents, different skill loading).
- **Impact:** 47 → 6 agents for Video. CriteriaFilms cinematic mode is a configuration, not a separate system.
- **Status:** Active.

---

## Session 6 — April 8, 2026 (continued): Agent Architecture Revision

Summary: Reviewed all ~125 agents across the platform. Established Agent/Skill/System Function distinction. Reduced to ~28 agents. Consolidated Distribution from 4 motors to 2 agents. Scoped Video motor for marketing use.

### DEC-067: Token as universal consumption unit

- **Context:** Need a way to measure and bill client consumption that is transparent to the client but gives criteria.agency margin control internally.
- **Decision:** Token is the universal unit. Every production action (image, video, audio, email, report) costs tokens. Intelligence actions (Strategist thinking, Brand Guardian validating, Copilot conversations) are free — included in subscription. "The brain is free, the hands cost tokens."
- **Alternatives considered:** Counting by piece type (rejected — video vs post vs email are different costs, need one unit); raw LLM tokens (rejected — client doesn't understand); unlimited generation (rejected — unsustainable with video costs).
- **Impact:** Defines the entire pricing structure. Margin is the spread between token sale price and internal production cost.
- **Status:** Active.

### DEC-068: Three subscription tiers — $99 / $249 / $599

- **Context:** Need aggressive pricing to compete with agencies ($2,000-5,000/month) while maintaining 78-85% gross margins.
- **Decision:** Starter $99/month (15,000 tokens, 2 users, 1 brand), Pro $249/month (75,000 tokens, 10 users, 3 brands), Agency $599/month (300,000 tokens, unlimited users/brands, white-label). Token overage billing at decreasing rates per tier.
- **Impact:** Starter replaces $300-500 freelancer. Pro replaces $2,000-3,000 agency. Agency enables agencies to resell at 86% margin.
- **Status:** Active.

### DEC-069: Pre-paid ad spend intermediation with commission

- **Context:** PyME clients won't connect Meta/Google APIs themselves. Managing ad spend is an opportunity, not just a technical problem.
- **Decision:** Client deposits ad budget + commission upfront. criteria.agency executes on platforms. Commission: 20% (Starter), 15% (Pro), 10% (Agency). Zero credit risk — never spend what hasn't been received.
- **Alternatives considered:** Client connects via OAuth (rejected — too technical for target market); criteria.agency pays and invoices later (rejected — credit risk).
- **Impact:** Second largest revenue stream. Near-100% margin on commission. criteria.agency operates Business Manager accounts on behalf of clients.
- **Status:** Active.

### DEC-070: Storage caps force tier upgrades

- **Context:** Storage grows forever. Need a model that scales revenue with storage consumption.
- **Decision:** Each tier has included storage + a purchasable cap. Beyond the cap, client must upgrade tier. Starter: 5 GB included, up to 15 GB purchasable ($2/GB/month), beyond → Pro. Pro: 25 GB, up to 75 GB, beyond → Agency. Agency: 100 GB, up to 500 GB, beyond → custom.
- **Impact:** Natural tier progression without hard blocks. Storage overage is low-effort revenue.
- **Status:** Active.

### DEC-071: Invitation-only free trial, no free tier

- **Context:** Need to let prospects experience the platform but control growth and avoid spam signups.
- **Decision:** No free tier. 14-day trial with 2,000 tokens, by invitation only (from existing client, partner, or criteria.agency directly). No credit card required to start. Data preserved 30 days after expiration.
- **Impact:** Controls onboarding quality, creates exclusivity, existing clients become evangelists.
- **Status:** Active.

### DEC-072: White-label for Agency tier

- **Context:** Agencies want to use criteria.agency as their backend but present their own brand to end clients.
- **Decision:** Agency tier includes full white-label: custom domain, agency's logo/colors, branded reports/emails/notifications, branded Copilot. criteria.agency invisible to end clients. Shared token pool with per-brand consumption tracking.
- **Impact:** Makes criteria.agency a margin multiplier for agencies. Agency pays $599 + overage, charges clients whatever they want.
- **Status:** Active.

### DEC-073: Workshops as separate revenue stream

- **Context:** Brand DNA depth matters (affects Brand Health Score), and some clients want professional guidance.
- **Decision:** Two types: pre-recorded ($29-99, high margin ~90%) and live with human experts ($500-2,000, margin 40-60%). Available to any tier as add-on. Agency includes 1 live workshop/year.
- **Impact:** Additional revenue stream. Improves platform value for client (deeper Brand DNA → better outputs). Natural upsell.
- **Status:** Active.

---

## Session 7 — April 8, 2026: Brand Builder Motor Design

### DEC-074: Brand Builder motor lifecycle — Hybrid

- **Context:** Brand building is iterative, not a one-time deliverable.
- **Decision:** Hybrid mode. Project phase (build Brand DNA by layers) + Continuous phase (dormant, trigger-activated). Brand is a living organism.
- **Status:** Active.

### DEC-075: Pipeline model — layers of depth (0-3)

- **Context:** Needed a pipeline model for Brand Builder.
- **Decision:** Layers of depth, not sequential steps. Layer 0 (onboarding auto) → Layer 1 (validated fundamentals) → Layer 2 (strategic depth) → Layer 3 (professional identity).
- **Status:** Active.

### DEC-076: Layer 0 execution — system function, not agent

- **Decision:** System function (scraping + template filling). Brand Strategist enters at layer 1.
- **Status:** Active.

### DEC-077: Gate philosophy — sufficiency thresholds

- **Decision:** Gates are sufficiency thresholds, not barriers. Only layer 2 incoherence blocks. Score reflects gaps.
- **Status:** Active.

### DEC-078: Brand Guardian co-evaluates layer 3 gate

- **Decision:** Brand Guardian participates in layer 3 gate as primary consumer of systematization artifacts.
- **Status:** Active.

### DEC-079: Brand Strategist — 5 skills

- **Decision:** Discovery, Positioning (M1-M6 + Godin), Archetype & Voice, Identity Systems, Brand Audit.
- **Status:** Active.

### DEC-080: Continuous mode — 5 triggers

- **Decision:** Strategist misalignment, client request, business event, scheduled audit (6mo), score drop.
- **Status:** Active.

### DEC-081: Incoherence threshold — blocks on contradictory artifacts

- **Decision:** Blocks when two Brand DNA artifacts contradict → downstream motors would produce opposite outputs. Three types: Audience ↔ Positioning, Archetype ↔ Verbal territory, Positioning ↔ Competitive map.
- **Status:** Active.

### DEC-082: Layer transitions — accelerate, never skip

- **Decision:** Layers can be accelerated (workshop does 0→3 in hours) but never skipped. Each builds on previous.
- **Status:** Active.

### DEC-083: Multi-brand sharing — environment yes, identity no

- **Decision:** Market-level data shareable (competitive map, trends, benchmarks). Brand-level data never shared (positioning, archetype, tone). What describes the environment can be shared; what describes the soul cannot.
- **Status:** Active.

### DEC-084: Brand DNA versioning — undo, not version history

- **Decision:** Previous versions preserved as undo. Client sees "revert last update," not version comparison.
- **Status:** Active.

### DEC-085: Workshop dynamics — human + agent in parallel

- **Decision:** Human expert brings concepts; agent structures and validates in real time. When workshop ends, Brand DNA is already documented.
- **Status:** Active.

### DEC-086: Cross-motor brand assets — Logo, Manifesto, Enriched Manual

- **Decision:** Logo (Graphic Design motor), Manifesto (Brand Strategist + Creative Director), Enriched Manual (Brand Strategist + Graphic Design). All cost tokens. Logo always requires client approval.
- **Status:** Active.

---

## Session 8 — April 8, 2026: Strategist Motor Design

### DEC-087: Strategist is 1 agent with 5 skills

- **Context:** Should the Strategist be 1 agent/3 skills, 3 agents, or 1 agent/3 instances?
- **Decision:** 1 agent with 5 skills. The value of a strategist is that one brain holds the complete picture. Splitting loses context and synthesis.
- **Alternatives:** 3 agents (context loss, nobody owns the plan), 1×3 instances (Listener model doesn't fit — modes do different things, not same thing on different data).
- **Status:** Active.

### DEC-088: Analyst/Strategist separation

- **Context:** Strategist was too amorphous doing everything.
- **Decision:** Analyst processes data (what happened, what pattern). Strategist interprets and decides (what it means, what to do). Two different cognitive tasks.
- **Status:** Active.

### DEC-089: Analyst stays in Operation with new interfaces

- **Decision:** Stays in Operation (not transversal). Gains 3 interfaces: (1) Client — dashboards/reports, (2) Strategist — processed diagnostics, (3) Brand Health Score — calculation.
- **Status:** Active.

### DEC-090: Strategist — 5 skills

- **Decision:** Diagnostic (where are we?), Planning (where should we go?), Campaign Design (what play?), Optimization (is it working?), Campaign Learning (what did we learn?).
- **Status:** Active.

### DEC-091: Campaign Learning — two-layer knowledge output

- **Decision:** Client Intelligence (private per client) + contribution to Platform Intelligence (aggregated, anonymized).
- **Status:** Active.

### DEC-092: Platform Intelligence is shared infrastructure

- **Decision:** Not Strategist-exclusive. All agents query it (Creative Director, Channel Manager, Paid Media Operator, etc.).
- **Status:** Active.

### DEC-093: Platform Intelligence exposed as public efficacy KPIs

- **Decision:** Aggregate KPIs surface as proof of criteria.agency efficacy. Creates data moat — competitors can't copy accumulated learning.
- **Status:** Active.

### DEC-094: Platform Intelligence — separate spec

- **Decision:** Full design (aggregation, anonymization, minimum N, API, KPI format) deferred to separate spec.
- **Status:** Resolved in Session 9 (DEC-102 through DEC-120). Full spec: `docs/superpowers/specs/2026-04-08-platform-intelligence-design.md`

### DEC-095: Cross-client sharing principle — extends DEC-083

- **Decision:** Same as DEC-083: environment shareable (channel performance, industry timing, audience behavior), identity not shareable (strategies, budgets, competitive positions).
- **Status:** Active.

### DEC-096: Strategist gates — viability checks (stricter than Brand Builder)

- **Decision:** Real budget at stake → stricter gates. G1 Financial Agent, G2 Brand Guardian can block. G3/G6 human approval always required.
- **Status:** Active.

### DEC-097: Conflict resolution hierarchy

- **Decision:** Strategist owns objectives. Creative Director owns creative execution. Brand Guardian has absolute veto on brand. Financial Agent has veto on financial viability. Showrunner arbitrates Strategist vs Creative Director.
- **Status:** Active.

### DEC-098: Pre-configured campaigns — edit, never create from scratch

- **Decision:** Everything pre-filled, everything editable. Client edits, never builds from scratch. Brief includes concept, objectives, audience, channels, budget, calendar, KPIs, justification.
- **Status:** Active.

### DEC-099: 17 triggers in 3 categories

- **Decision:** Scheduled (planning cycles, periodic reviews), reactive (anomalies, opportunities, client requests), consequence (diagnosis → planning, campaign close → learning). Each trigger loads a specific skill.
- **Status:** Active.

### DEC-100: Token cost model — observe free, think/produce cost

- **Decision:** Observing free (Listeners, Analyst, score). Thinking/deciding costs tokens (Strategist outputs). Producing costs tokens (creation motors). Base configuration included in tier.
- **Status:** Active.

### DEC-101: Budget from product economics

- **Decision:** Budget calculated from margin × addressable market × expected CAC. Not arbitrary client input. Client can override. Financial Agent validates viability.
- **Status:** Active.

---

## Session 9 — April 8, 2026: Platform Intelligence Design

### DEC-102: Three writer types for Platform Intelligence

- **Context:** PI was initially conceived as only fed by Campaign Learning. Analysis revealed other agents produce valuable cross-client data.
- **Decision:** Three writer types: (1) Learning Records from Strategist via Campaign Learning — causal, post-campaign, highest confidence. (2) Operational Signals from Distribution agents, Brand Guardian, Channel Manager — correlational, weekly batch, medium confidence. (3) Structural Patterns from Brand Builder and Listeners — market-level, monthly recalculation.
- **Alternatives:** Single writer via Campaign Learning only (rejected — misses valuable operational and structural data that doesn't require campaign completion).
- **Status:** Active.

### DEC-103: Unified repository with single API

- **Context:** Three data types could live in separate systems or one.
- **Decision:** Single repository, unified API. All responses include metadata: data type, N (contributors), source layer, confidence level, match level, temporal window, trend direction.
- **Alternatives:** Separate systems per type (rejected — agents would need to query multiple systems and synthesize results themselves).
- **Status:** Active.

### DEC-104: Dimension model — context × execution × result

- **Decision:** All PI data tagged with three dimension groups. Context: industry, region (hierarchical), business size. Execution: channel, format, funnel stage, messaging type. Result: performance metrics, investment ranges.
- **Impact:** Dimensions determine how data is aggregated, queried, and how granular benchmarks can be.
- **Status:** Active.

### DEC-105: Hierarchical fallback for insufficient N

- **Context:** Crossing dimensions divides data. Most specific combinations will have N < K with few clients.
- **Decision:** When N < K, system first widens temporal window (up to 12 months), then ascends dimension hierarchy (city → country → subregion → LATAM, or specific industry → broader category). Fallback logic is hardcoded in PI, not in consuming agents. Agent sends maximally specific query; PI returns best available match with metadata on what level was used.
- **Alternatives:** Agents manage their own fallback logic (rejected — duplicates logic across agents, agents shouldn't need to know PI internals).
- **Status:** Active.

### DEC-106: Cold start — three source layers

- **Context:** Day 1 with zero clients, PI is empty. Strategist needs benchmarks for DEC-101 budget calculation.
- **Decision:** Three layers: `industry_benchmark` (public data — Meta, Google, HubSpot, Statista — available day 1, low confidence), `platform_early` (CriteriaFilms + beta testers, medium confidence), `platform` (real aggregated data with N ≥ K, high confidence). Source quality always disclosed to consuming agent and surfaceable to client.
- **Alternatives:** Start empty and be transparent (rejected alone — product feels unintelligent at launch); synthetic data (rejected — dishonest).
- **Status:** Active. Resolves DEC-094.

### DEC-107: K-anonymity thresholds

- **Decision:** K=5 minimum contributing clients for Learning Records and Structural Patterns. K=3 for Operational Signals (less sensitive — market-level metrics). Never below K=3 for any data type.
- **Impact:** Determines when PI can serve specific vs generalized benchmarks. Below K, fallback hierarchy activates.
- **Status:** Active.

### DEC-108: Additional privacy protections beyond K

- **Decision:** Three protections: (1) Ranges instead of exact values when K is 3-7 (exact aggregates only at K > 10). (2) Outlier suppression via P10-P90 trimming before aggregation. (3) Maximum 30% contribution per client to any aggregate — prevents dominant clients from skewing benchmarks.
- **Status:** Active.

### DEC-109: No opt-out from PI contribution

- **Context:** Should clients be able to exclude their data from PI?
- **Decision:** No. Contributing to PI is the platform's social contract — the Waze model. All benefit because all contribute. Must be communicated transparently during onboarding and in terms of service.
- **Alternatives:** Optional opt-out (rejected — creates free-rider problem, degrades data quality, undermines the value exchange).
- **Status:** Active.

### DEC-110: Differentiated temporal decay

- **Decision:** Operational Signals: exponential decay, 3-month half-life (costs and engagement shift rapidly). Learning Records: exponential decay, 12-month half-life (strategic patterns are more stable). Structural Patterns: no temporal decay — periodically recalculated from current state.
- **Impact:** Decay is a weight at aggregation time, not data deletion. Data is never removed — it becomes naturally irrelevant.
- **Status:** Active.

### DEC-111: Geographic hierarchy — 4 levels, region = target market

- **Decision:** City → Country → Subregion (Centroamérica+Caribe, Andina, Cono Sur, México+US Hispanic) → LATAM. Region of a data point is the campaign's target market, not the client's domicile.
- **Alternatives:** Region = client location (rejected — a Panamanian business selling to all of Central America would distort Panama's micro-market data and lose its contribution to the regional benchmark).
- **Status:** Active.

### DEC-112: Platform Intelligence is a system function, not an agent

- **Decision:** PI aggregates and serves data. No interpretation, no recommendations, no decisions. Per DEC-064 taxonomy, it's infrastructure — like the database, not like the Strategist.
- **Status:** Active.

### DEC-113: Two query modes — benchmark and pattern

- **Decision:** Benchmark query ("what is the standard?") returns a value with metadata. Pattern query ("what works?") returns a ranking or distribution with relative values and per-option N. Both include full metadata (source, confidence, temporal window, match level, trend).
- **Status:** Active.

### DEC-114: Three hard restrictions on PI

- **Decision:** (1) PI never recommends — it serves data, agents interpret. (2) PI never crosses the identity barrier — if N < K, it ascends fallback, never serves point data. (3) PI never serves real-time data from active campaigns — operational signals aggregated in weekly batch to prevent competitive inference.
- **Status:** Active.

### DEC-115: Tiered agent access to PI

- **Decision:** Full access (benchmark + pattern): Strategist, Financial Agent, Brand Builder (Layer 2+). Pattern only: Creative Director, Channel Manager, Media Scout. Operational only: Paid Media Operator, Owned Channels Operator. No access: Brand Guardian (validates against Brand DNA, not market norms — differentiation is not an error), Listeners (observe external world independently per DEC-058).
- **Status:** Active.

### DEC-116: Public KPIs — volume + efficacy on three surfaces

- **Decision:** Volume KPIs (campaigns executed, spend managed, clients by industry, countries). Efficacy KPIs (ROAS by industry, improvement over time, recommendation adoption rate, cost benchmarking vs industry). Three surfaces: landing page (public, static, quarterly), Brújula (in-platform, contextualized), exportable reports (Pro/Agency).
- **Impact:** Efficacy KPIs are the true differentiator. "The third campaign performs 40% better than the first" proves the platform learns.
- **Status:** Active.

### DEC-117: Automated quarterly PI Report as owned media

- **Decision:** Quarterly publication generated by criteria.agency's own motors (Strategist for narrative, Writer for copy, founder approves). Multi-funnel owned media: awareness (blog/social), consideration (intelligence proof), conversion (sales material). Tracks platform data maturity narrative (% proprietary vs external benchmarks).
- **Status:** Active.

### DEC-118: PI queries are free — part of observe layer

- **Decision:** Consulting PI does not consume tokens. Categorized as "observe" layer per DEC-100. Charging would cause agents to query less, degrading recommendation quality. Reinforces no-opt-out social contract: contribute data, query freely.
- **Alternatives:** Token cost per query (rejected — PI is a quality multiplier, not an independent service).
- **Status:** Active.

### DEC-119: Client-facing PI visibility varies by tier

- **Context:** Agents always have full PI access regardless of tier (recommendation quality doesn't degrade). But what clients see directly differs.
- **Decision:** Starter: generic benchmarks (industry × LATAM). Pro: full benchmarks (industry × region × channel) + pattern queries visible in Brújula/Copilot. Agency: Pro + benchmarks in white-label reports + cross-industry trends.
- **Impact:** Adds value to tier upgrades without degrading the AI's performance for lower tiers.
- **Status:** Active.

### DEC-120: Listeners excluded from PI access

- **Context:** Should Listeners consult PI to contextualize their observations?
- **Decision:** No. Listeners observe the external world. PI aggregates the internal world. The Strategist synthesizes both. If Listeners consulted PI, they might prioritize signals that align with existing patterns and ignore novel signals — exactly the circular bias DEC-058 prevents.
- **Alternatives:** Listeners read PI for context (rejected — undermines independence and novelty detection).
- **Status:** Active.

---

## Session 10 — April 8, 2026: Analyst Motor Design

### DEC-121: Analytics motor is hybrid — system functions + 1 agent

- **Context:** The Analyst had been defined as a single agent in Operation (Marketing Engine Design §2.5) and then redefined as "the nervous system of the platform" in the Strategist spec. Need to determine its nature per DEC-064 taxonomy.
- **Decision:** Hybrid motor. System functions handle mechanical work (data pipeline, score calculations, dashboards, threshold alerting, attribution modeling). One agent (Analyst) handles the interpretive layer (Interface 2 diagnostics, anomaly qualification). The 95% mechanical work runs as deterministic code at zero LLM cost. The agent only activates when genuine analytical judgment is needed.
- **Alternatives:** All agent (rejected — wastes LLM on "is 2.3% > 2.0%", introduces hallucination risk for mechanical tasks); All system function (rejected — loses the rich cross-source diagnostic capability that Interface 2 requires).
- **Impact:** Enables dashboards and scores to work from day 1 without LLM. Agent adds interpretive enrichment on top. Separates implementation phases cleanly.
- **Status:** Active.

### DEC-122: Data ingestion is shared infrastructure, not part of Analytics motor

- **Context:** The Analyst needs data from Meta, Google, TikTok, email platforms, etc. Someone has to manage OAuth connections, API polling, and schema normalization.
- **Decision:** Data ingestion is a shared infrastructure system function, not owned by the Analytics motor. Multiple motors need external data (Paid Media Operator, Channel Manager, Email Operator). Centralizing ingestion avoids making Analytics a bottleneck. Consistent with how PI receives data (from writers, doesn't go fetch) and how the Event Bus works (shared infrastructure).
- **Alternatives:** Analytics owns the full pipeline from OAuth to dashboard (rejected — creates bottleneck, mixes plumbing with analysis, other motors would depend on Analytics for data access).
- **Impact:** Defines a new infrastructure component (Data Ingestion Layer). Analytics motor's scope is clearly bounded: it processes and interprets, it doesn't fetch.
- **Status:** Active.

### DEC-123: Analyst has benchmark-only access to Platform Intelligence

- **Context:** PI tiered access (DEC-115) didn't include the Analyst. But the Analyst needs industry benchmarks to contextualize client data ("your CTR is 2.3%, benchmark is 1.8%").
- **Decision:** Analyst gets benchmark-only access — can ask "what is the standard?" but not "what works?" Pattern queries (which reveal strategic intelligence about what messaging/format/channel combinations drive results) are reserved for the Strategist and other strategic agents. This preserves the Analyst/Strategist separation (DEC-088): the Analyst contextualizes with numbers, the Strategist interprets with patterns.
- **Alternatives:** Full access (rejected — blurs the line with Strategist, Analyst might produce recommendation-like outputs); No access (rejected — diagnostics without benchmarks lack context).
- **Impact:** Creates a new PI access tier (benchmark-only) between "pattern only" and "operational."
- **Status:** Active.

### DEC-124: Analyst has 3 skills — Monitoring, Diagnostic Delivery, Reporting

- **Context:** The Analyst agent needs defined skills following the pattern of Strategist (5 skills) and Brand Builder (5 skills).
- **Decision:** Three skills based on three distinct cognitive modes: (1) **Monitoring** — the watchman. Distinguishes signal from noise when threshold flags are raised. (2) **Diagnostic Delivery** — the interpreter. Produces Interface 2 processed diagnostics by cross-referencing multiple data sources. (3) **Reporting** — the narrator. Produces narrative reports for the client (Interface 1) with contextual commentary beyond what dashboards show.
- **Alternatives:** 5 skills matching marketing-engine-design's original list (rejected — dashboard building, KPI tracking, and attribution are system functions, not agent skills per DEC-121).
- **Impact:** Defines clear activation patterns for the agent. Monitoring filters most noise cheaply; Diagnostic Delivery is the high-value skill; Reporting produces client-facing deliverables.
- **Status:** Active.

### DEC-125: Analyst knowledge base — diagnostic pattern heuristics

- **Context:** The Strategist has Harvard M1-M6 + Godin as static knowledge. What does the Analyst use?
- **Decision:** A curated library of cause-effect heuristics from performance marketing (e.g., "CTR high + conversion low = post-click problem", "impressions stable + engagement declining = creative fatigue"). Not theoretical frameworks — empirical diagnostic patterns. Enriched dynamically by PI benchmarks and client history. Over time, PI's Learning Records can validate/invalidate these heuristics empirically.
- **Alternatives:** No static knowledge, pure LLM reasoning (rejected — inconsistent quality, no institutional memory); Full marketing frameworks like M1-M6 (rejected — those are strategic, not analytical).
- **Impact:** Creates a maintainable, extensible knowledge base that improves diagnostic consistency.
- **Status:** Active.

### DEC-126: Analytics motor frequencies

- **Context:** The motor is "continuous" but needs concrete operational rhythms.
- **Decision:** Layered frequency model: Data ingestion every 4-6 hours (shared infra). System function threshold checks run post-ingestion (deterministic, cheap). Monitoring agent skill activates only by exception (when flags exceed "possibly anomalous" threshold). Diagnostic Delivery runs weekly (comprehensive review) plus reactively on alerts or Strategist requests. Brand Health Score recalculates daily with intraday trend indicator. Reporting runs monthly (automated) plus on campaign close and on-demand.
- **Rationale:** Designed for efficiency — 95% of the time, deterministic code handles everything. The LLM agent only activates when there's something worth interpreting. This keeps costs low while maintaining quality of interpretation.
- **Impact:** Defines operational cadence for the entire Analytics motor. The weekly diagnostic cycle catches gradual trends that no single-period threshold would flag.
- **Status:** Active.

---

## Session 11 — April 9, 2026: MARA (Client Copilot) Design

### DEC-127: MARA is an agent (#29), not a system function

- **Context:** The "AI Copilot" referenced in the Client Portal Navigation spec (§8) needed a concrete design. Three options: dumb router (system function), god agent (knows everything), or interface agent (lightweight, orchestrates).
- **Decision:** MARA is agent #29 — an interface agent. Exercises judgment on intent classification (what does the client mean?), conversation management (context, memory), and response composition (translate technical outputs to client language). Does not produce its own work product — composes responses from other agents' outputs. Per DEC-064 taxonomy, intent classification requires genuine judgment = agent.
- **Alternatives:** System function router (rejected — can't handle ambiguous intent, tone, conversational context); god agent (rejected — duplicates all specialized agents, impossible to maintain).
- **Status:** Active.

### DEC-128: MARA — 3 skills (interaction, not domain)

- **Decision:** Intent Classification (route to correct backend), Conversation Management (session continuity, cross-session memory), Response Composition (translate technical outputs to client-appropriate language). Skills are about interaction, not marketing domain expertise.
- **Status:** Active.

### DEC-129: Routing taxonomy — 6 intent categories

- **Decision:** Six categories mapping to existing architecture: (1) Data lookup → Analyst system functions, free. (2) Data interpretation → Output Registry then Analyst agent, free. (3) Strategic decision → Output Registry then Strategist, tokens. (4) Brand action → Brand Builder, tokens. (5) Operational action → Framework Orchestrator, tokens. (6) Navigation/meta → system functions, free. Key principle: MARA always searches existing outputs before invoking an agent.
- **Status:** Active.

### DEC-130: Output Registry — new shared infrastructure

- **Context:** MARA needs to search recent outputs from all agents to avoid redundant invocations. This capability benefits the entire platform.
- **Decision:** New shared infrastructure component. Indexed store of all agent and system function outputs with structured metadata (source, client, type, campaigns, channels, timestamp, embedding) and semantic search. MARA is primary consumer but not exclusive — any agent can query. Staleness model varies by output type (KPI snapshots: 4-6 hours, diagnostics: 7 days, plans: 90 days, reports: permanent).
- **Alternatives:** MARA-specific cache (rejected — other agents also need to query cross-agent outputs); no cache, always invoke (rejected — expensive, slow, unnecessary when recent output exists).
- **Status:** Active.

### DEC-131: Play/Pause model for token transparency

- **Context:** The Copilot can invoke agents that cost tokens. Need a control mechanism that doesn't interrupt every conversation with "are you sure?"
- **Decision:** Visible toggle in MARA's chat header. Play = MARA can invoke token-consuming agents without per-interaction permission. Pause = MARA responds only with free resources (data lookups, existing outputs, navigation). When paused and a paid invocation is needed, MARA explains and suggests enabling play. First-use onboarding message explains the model once.
- **Alternatives:** Per-interaction confirmation (rejected — breaks conversational flow); no control (rejected — clients need token spend awareness); follows per-motor autonomy setting (considered — play/pause is simpler and specific to the conversational context).
- **Status:** Active.

### DEC-132: MARA itself is free — cost is downstream

- **Decision:** MARA's LLM invocations (intent classification, response composition, session summaries) are free — classified as interface/observe layer per DEC-100. Token cost comes from what MARA invokes downstream: Strategist outputs, Brand Builder, creation motors, reports. Serving existing outputs from the Output Registry is always free regardless of the original output's cost — it was already paid for.
- **Rationale:** Charging for MARA would penalize conversational interaction, driving clients to the visual UI. The conversational interface is the product differentiator.
- **Status:** Active.

### DEC-133: Session memory by summary, not full history

- **Decision:** Within-session: standard LLM context window (full conversation). Across sessions: MARA generates a lightweight summary on session close (topics, decisions, pending actions, client sentiment). Next session loads the most recent summary. MARA can proactively reference pending actions. Summary generation is free (internal maintenance).
- **Alternatives:** No cross-session memory (rejected — client feels like talking to a stranger each time); full history storage (rejected — expensive context, complex retrieval, diminishing value over time).
- **Status:** Active.

### DEC-134: Three interaction modes — consulta, acción, exploratorio

- **Decision:** (1) Consulta: Q&A flow, MARA talks more. (2) Acción: task facilitation, client talks more (MARA collects inputs). (3) Exploratorio: client is lost, MARA reads Brand Health Score, identifies weakest axis, proposes starting point. The Brand Health Score is MARA's compass in exploratory mode — designed to diagnose and drive engagement.
- **Status:** Active.

### DEC-135: Proactivity respects play/pause

- **Decision:** Three proactivity levels (silencioso/moderado/activo) interact with play/pause. Pause + moderado: proactive with free info only (alerts, score changes, pending actions). Play + activo: proactive with Strategist recommendations and opportunity briefs. Proactive scanning is a system function (deterministic rules — new unseen alerts, score changes, pending actions); MARA LLM only invoked to compose the message.
- **Status:** Active.

### DEC-136: MARA available in all tiers, depth varies

- **Context:** Client Portal spec listed Copilot as Pro feature. But removing conversational access entirely from Starter creates a worse experience.
- **Decision:** MARA exists in all tiers. Starter: data lookups, navigation, basic existing outputs. Pro: full capability including Strategist and Analyst agent invocations, session memory, all proactivity levels. Agency: Pro + multi-brand context switching + white-label MARA. Tier limits become natural upsell moments.
- **Status:** Active.

### DEC-137: Soft transparency — natural language, not technical labels

- **Decision:** MARA communicates internal activity in natural language ("déjame revisar tu estrategia...") not technical labels ("invoking Strategist agent"). Token cost visible via play/pause toggle state + subtle session counter. First-use onboarding explains the model once. No per-interaction confirmation in play mode.
- **Status:** Active.

### DEC-138: Single face principle — client talks to MARA, never to backend agents

- **Decision:** The client always interacts with MARA. Backend agents (Strategist, Analyst, Brand Builder) are never exposed directly in the conversational interface. MARA integrates all responses as its own voice. The client experiences one continuous conversation with one entity.
- **Rationale:** Exposing multiple agent personalities creates confusion and breaks the "virtual marketing director" metaphor. MARA is the account manager; the agents are the team behind the scenes.
- **Status:** Active.

---

## Session 12 — April 9, 2026: Tech Stack Revision + Growth Strategy

### DEC-139: Stack revision driven by design requirements

- **Context:** 138 decisions of design (MARA, Analyst, Strategist, PI, Brand Builder) revealed that the original stack had gaps: no workflow orchestration for 24 motors, no multi-model AI support, no vector search for Output Registry, no LLM cost observability, no prompt management.
- **Decision:** Comprehensive stack revision. 9 changes across orchestration, AI framework, database, monitoring, and observability. See DEC-140 through DEC-147. Growth strategy added for bootstrapped $0 launch.
- **Status:** Active.

### DEC-140: Inngest replaces custom state machine for orchestration

- **Context:** Custom TypeScript state machine works for 1 motor (Video). With 24 motors × 3 lifecycle modes × 17 Strategist triggers × MARA sessions × multiple clients, a manual state machine becomes the most fragile code in the system.
- **Decision:** Inngest for durable workflow orchestration. Each motor's pipeline is an Inngest function. Cross-motor events are Inngest events (replaces Redis pub/sub for Event Bus). Retries, state persistence, and operational dashboard included. Free tier: 50K executions/month.
- **Alternatives:** Temporal (too complex and expensive for solo founder — $200/month Cloud minimum), custom state machine (fragile at scale), Trigger.dev (less mature than Inngest for AI workloads).
- **Impact:** Redis scope reduces to cache + rate limiting. BullMQ no longer needed.
- **Status:** Active.

### DEC-141: Vercel AI SDK replaces Claude Agent SDK

- **Context:** System requires multi-model invocation: MARA Intent Classification with Haiku ($0.25/M), Strategist with Sonnet/Opus ($3-15/M), Analyst Monitoring with Haiku. Claude Agent SDK is Claude-only. Multi-agent overhead averages 37% of tokens — not all agents need full agent capabilities.
- **Decision:** Vercel AI SDK (v6) as unified AI framework. Two invocation patterns: generateText() for simple tasks (classification, summaries, composition — Haiku), agent with tools for complex reasoning (Strategist, Brand Builder, Analyst Diagnostic — Sonnet/Opus). Streaming support for MARA responses.
- **Alternatives:** Claude Agent SDK (rejected — single provider, no lightweight mode), LangGraph (rejected — Python-first, adds complexity), CrewAI (rejected — not TypeScript-native).
- **Impact:** ~37% reduction in LLM overhead. Model switching is a string change.
- **Status:** Active.

### DEC-142: Better Auth with POC validation, Clerk as fallback

- **Context:** Auth is the highest-security component. Better Auth is free and self-hosted but younger than alternatives. Clerk is managed and battle-tested but creates external data dependency.
- **Decision:** Better Auth as primary choice. Before commitment, validate with POC: create org with 3 roles, add user to 2 orgs with different roles, verify Hono middleware tenant isolation. If POC takes >1 day or reveals gaps, pivot to Clerk.
- **Rationale:** Better Auth + PostgreSQL = single source of truth for user data. Clerk requires sync between Clerk and DB.
- **Status:** Active — pending POC.

### DEC-143: Database hosting — Neon or Supabase, evaluate at implementation

- **Context:** Both Neon and Supabase support PostgreSQL + pgvector. Neon: serverless, branching, scale-to-zero (good for dev, bad for continuous motors). Supabase: more features (real-time, auth, storage) at similar price.
- **Decision:** Defer choice to implementation. Both valid. Key factor: if Google for Startups credits are accepted ($250K GCP), consider Cloud SQL on GCP instead.
- **Status:** Active — deferred.

### DEC-144: pgvector for Output Registry semantic search

- **Context:** MARA's Output Registry (DEC-130) requires semantic search across agent outputs. Options: separate vector DB (Pinecone, Qdrant) or pgvector in PostgreSQL.
- **Decision:** pgvector in PostgreSQL. Eliminates a separate service. Drizzle has documented pgvector integration. At platform scale (thousands of outputs, not millions), pgvector is sufficient.
- **Alternatives:** Pinecone (rejected — separate service, cost, overkill for scale), Qdrant (rejected — same reasons).
- **Status:** Active.

### DEC-145: Prompt registry in PostgreSQL

- **Context:** 29 agents with multiple skills need versioned system prompts that can be updated without redeploy.
- **Decision:** PostgreSQL table: agent_id, skill_id, version, system_prompt, knowledge_base_ref, model, active. Simple, queryable, versionable. No separate service needed.
- **Alternatives:** Langfuse (rejected for now — valuable when team > 5 people iterating on prompts simultaneously, overkill for solo founder), MLflow Prompt Registry (rejected — too heavy).
- **Status:** Active.

### DEC-146: BetterStack replaces Sentry for error tracking

- **Context:** Sentry is feature-rich but expensive at volume. BetterStack combines error tracking + uptime monitoring at 6x lower cost.
- **Decision:** BetterStack for error tracking and uptime. Free tier: 10 monitors, 100K exceptions/month, 3-day log retention. Sufficient for Year 1. Consolidates two services (Sentry + UptimeRobot) into one.
- **Status:** Active.

### DEC-147: Helicone for LLM cost observability

- **Context:** With 29 agents invoking LLMs, cost visibility per agent per client per month is critical for validating token economy (DEC-100) and pricing tiers.
- **Decision:** Helicone as proxy-based LLM observability. Intercepts API calls, logs tokens/cost/latency with one line of code (base URL change). Free tier: 10K requests/month. Enables per-agent cost dashboards from day 1.
- **Alternatives:** Portkey (more powerful — caching, routing, fallbacks — deferred to Year 2 optimization), LangSmith (more focused on tracing/debugging than cost).
- **Status:** SUPERSEDED by DEC-228 (April 9, 2026). Helicone was acquired by Mintlify and new signups were disabled. Observability vendor replaced with Langfuse.

---

## Session 13 — April 9, 2026: Security Audit v2 — Comprehensive Risk Assessment

### DEC-148: Inngest security model

- **Context:** Inngest operates outside the network boundary. Security Framework assumed orchestration ran inside the application server.
- **Decision:** Webhook HMAC-SHA256 verification (P0), event schema validation with Zod (P0), tenant verification against DB in every function (P0), MFA on Inngest account, minimal state in steps (IDs only), API key as SYSTEM SECRET.
- **Status:** Active.

### DEC-149: Multi-model data security — provider tiers

- **Context:** Vercel AI SDK enables multi-model invocation with different providers having different data policies.
- **Decision:** Three-tier classification: Tier A (confidential — Anthropic), Tier B (general — OpenAI opt-out, Google enterprise), Tier C (public only). Prompt Registry gains `data_sensitivity` and `approved_providers` fields. CONFIDENTIAL agents use Tier A only. No cross-tier fallback. MARA streaming uses composition buffer.
- **Status:** Active.

### DEC-150: Helicone risk management

- **Decision:** Evaluate Helicone data policies before implementation. If insufficient, self-host logging (counts/costs only, not full prompts). Listed as sub-processor for GDPR/LGPD.
- **Status:** SUPERSEDED by DEC-228. Risk management concerns transfer to Langfuse (see DEC-228 for updated sub-processor listing and self-host fallback).

### DEC-151: Output Registry hardening

- **Decision:** Embed summaries only. Same-provider or local embedding model. Mandatory pre-filtering for pgvector. content_ref as UUID only. Partial HNSW indexes per tenant.
- **Status:** Active.

### DEC-152: Chained prompt injection defense

- **Decision:** Inter-agent sanitization on TaskMessage/ResultMessage. Output schema validation at every pipeline step. Orchestrator validates between steps.
- **Status:** Active.

### DEC-153: Model-agent compatibility testing

- **Decision:** `approved_models` field in Prompt Registry per agent × skill. Only tested combinations allowed in production.
- **Status:** Active.

### DEC-154: Cumulative agent action tracking

- **Decision:** Per-agent per-tenant per-day cumulative thresholds. Budget modifications > 20%, audience changes > 3, bid adjustments > 30% cumulative → auto-pause and escalate.
- **Status:** Active.

### DEC-155: MARA hardening (multi-layer)

- **Decision:** Immutable system prompt re-injection every invocation. Safety classifier (Haiku) pre-screens messages. Context window limit at 30 messages. Session summaries from system-logged actions, not conversation text.
- **Status:** Active.

### DEC-156: Competitive cross-tenant protection

- **Decision:** Cross-reference check before Output Registry writes. If competitor is active tenant, anonymize (public-domain info only).
- **Status:** Active.

### DEC-157: MARA per-session invocation budget

- **Decision:** Maximum 5 paid agent invocations per session. After limit, free resources only.
- **Status:** Active.

### DEC-158: Play/pause server-side enforcement

- **Decision:** State stored in DB session record. MARA endpoint reads from DB, never from request params. Separate endpoint to change state.
- **Status:** Active.

### DEC-159: OAuth token security

- **Decision:** CRITICAL classification. AES-256-GCM + per-tenant salt. Minimal scopes by default. Separate read/write tokens. Every decryption logged.
- **Status:** Active.

### DEC-160: Webhook verification for external platforms

- **Decision:** Mandatory per-platform signature verification (Meta HMAC, Google JWT, Stripe HMAC, TikTok HMAC). Unverified → 401 + security log.
- **Status:** Active.

### DEC-161: Data sanity validation

- **Decision:** Statistical checks on ingested data: CTR > 100% reject, CPC < 0 reject, >95% drop flag, cost > budget × 1.5 flag. Flagged data excluded until verified.
- **Status:** Active.

### DEC-162: External API rate limiting per-tenant

- **Decision:** Rate limiter per tenant per platform. Auto-throttle at 80% of documented limit.
- **Status:** Active.

### DEC-163: Ad spend protection

- **Decision:** Expanded critical actions + cumulative tracking + absolute circuit breaker (daily spend > cap × 1.2 → pause all, alert admin AND client).
- **Status:** Active.

### DEC-164: Financial reconciliation

- **Decision:** Daily automated reconciliation. Client-visible dashboard. Flag discrepancies > 5%.
- **Status:** Active.

### DEC-165: Ad spend intermediation phasing

- **Decision:** Phase 1 (MVP): NO intermediation — client connects own accounts, criteria.agency has management access only. Phase 2: optional with escrow + legal structure.
- **Impact:** Changes business model §5 for Phase 1.
- **Status:** Active.

### DEC-166: White-label security

- **Decision:** DNS verification for custom domains. Distributor responsibility in TOS. Per-brand token logging. MARA context cleared on brand switch.
- **Status:** Active.

### DEC-167: Content safety

- **Decision:** Content Policy Checker (system function) before delivery/publication. TOS disclaimers. AUP prohibits deepfakes, disinformation, targeting minors, illegal products.
- **Status:** Active.

### DEC-168: Advertising compliance phasing

- **Decision:** MVP: client responsibility + disclaimer. Post-MVP: Ad Compliance Checker as Brand Guardian skill.
- **Status:** Active.

### DEC-169: Platform Intelligence integrity

- **Decision:** Anomaly detection (exclude > 3 SD). Minimum 5 clients per category for benchmarks. Opt-out available. TOS clause.
- **Status:** Active.

### DEC-170: SSE role-based filtering

- **Decision:** Viewer (limited events), Editor (+gates), Admin (+costs), Platform Admin (+security). Connections logged. Auth on reconnect.
- **Status:** Active.

### DEC-171: Development security

- **Decision:** Accept Claude Code as residual risk. Private repo. Access controls. Consider separate repo for commercial specs if team grows.
- **Status:** Active.

### DEC-172: Solo founder operational security

- **Decision:** Shamir's Secret Sharing for MASTER_ENCRYPTION_KEY. Living runbook. Automated rotation alerts. Extended absence protocol (7/30/90-day escalation).
- **Status:** Active.

---

## Session 13 — April 9, 2026: Documentation cleanup & Brand Guardian resolution

### DEC-173: Brand Guardian at Layer 3 gate — minimal gate function, not full agent

- **Context:** DEC-078 specifies Brand Guardian co-evaluates the Layer 3 gate in Brand Builder. But Brand Guardian as a full independent agent is deferred to post-MVP. Open question in BUILD_ORDER.md Fase 1: how to implement the co-evaluation without the full agent.
- **Decision:** Implement a **Brand Guardian gate function** using `generateText()` (Vercel AI SDK simple pattern, per DEC-141). Not a full agent with tools — a single LLM invocation that receives Layer 3 artifacts and evaluates against a checklist: (1) Does the brand book have enough specificity for consistent output validation? (2) Does the tone guide have concrete examples per channel? (3) Does the visual system cover the formats creation motors need? If any answer is no, the gate iterates (3+3 rule applies). System prompt loaded from prompt_registry (DEC-145).
- **Alternatives considered:** (a) Stub with hardcoded checklist (rejected — misses nuance in evaluating brand guidelines), (b) Skip co-evaluation entirely (rejected — contradicts DEC-078 and risks unusable Layer 3 artifacts), (c) Build full Brand Guardian agent (rejected — premature, post-MVP scope).
- **Impact:** Resolves the last open decision blocking Fase 1 implementation. Brand Guardian gate function is lightweight (~1 LLM call per Layer 3 evaluation). Full Brand Guardian agent can later replace this function when more motors produce brand-sensitive outputs.
- **Status:** Active.

---

## Session 14 — April 9, 2026: Transversal agents design

### DEC-174: Model selection by creative leverage

- **Context:** DEC-149 defines model selection by data sensitivity (Tier A/B/C). But within a tier, which specific model (Opus/Sonnet/Haiku) to use? Some roles have disproportionate impact on output quality.
- **Decision:** Within Tier A, model selected by **creative leverage**: Opus for Creative Director and Showrunner (highest-judgment roles), Sonnet for executor agents (Writer, DP, Editor, etc.) and Brand Guardian, Haiku for lightweight classification (MARA Intent). Configured per agent × skill in `prompt_registry`.
- **Alternatives considered:** (a) Sonnet for everything (rejected — quality delta on creative judgment tasks is significant, and CD/Showrunner are invoked infrequently so cost impact is marginal), (b) Opus for all agents (rejected — wasteful for execution tasks where Sonnet is sufficient).
- **Impact:** Creative Director and Showrunner use Opus. All other agents remain Sonnet/Haiku. Cost increase is marginal (few invocations at high-leverage points) for significant quality improvement.
- **Status:** Active.

### DEC-175: Creative Director as clonable asset

- **Context:** In real agencies, different creative directors produce radically different work from the same brief. A generic CD prompt produces generic creative direction — the highest-leverage point in the pipeline.
- **Decision:** Each Creative Director is a **portable package**: Creative Philosophy (configurable approach/lens) + Reference Corpus (annotated references) + Model Config + Feedback History. MVP ships with 2-3 pre-built CD philosophies (Provocateur, Storyteller, Minimalist). CDs can be cloned (duplicated and modified) to create new variants.
- **Impact:** Enables differentiated creative output per brand/campaign. Foundation for CD marketplace (DEC-177).
- **Status:** Active.

### DEC-176: Creative Director training via portfolio/reel ingestion

- **Context:** A CD's style is best understood by looking at their work, not reading descriptions. Users want to train CDs by feeding them links to portfolios and showreels.
- **Decision:** CDs can be trained with links to portfolios (Behance, Dribbble, personal sites) and reels (Vimeo, YouTube). Pipeline: (1) scrape/extract assets (system function), (2) per-piece multimodal analysis (vision model), (3) cross-portfolio pattern extraction, (4) Creative Style DNA output (structured document: stylistic constants, creative range, narrative patterns, production level, detected influences). Original assets NOT stored (copyright). Three modes: clone a real director, train by inspiration (multi-source), customize a base CD.
- **Alternatives considered:** (a) Text-only descriptions forever (rejected — too abstract, loses the richness of visual/temporal style), (b) Fine-tuning per CD (rejected — model-level changes are impractical and expensive per-client).
- **Impact:** MVP: CDs are text-based. Post-MVP: visual ingestion pipeline. Tables `creative_references` and `creative_style_dna` created in Fase 0 (empty, ready to populate).
- **Status:** Active (MVP: text-only; post-MVP: full pipeline).

### DEC-177: Creative Director marketplace economics

- **Context:** CDs with different styles and performance levels have different value. Need a business model around CD selection.
- **Decision:** Three tiers: **Free** (2-3 house CDs included in all plans), **Premium** (portfolio-trained CDs with measurable performance, unlocked by plan tier — Starter: free only + 1 custom; Pro: free + premium + 3 custom; Agency: all + unlimited custom), **Custom** (client creates their own via self-service training). Premium gated by plan, not per-token surcharge. Post-MVP: marketplace where human creative directors license their clone with revenue share.
- **Impact:** Adds a differentiation axis to pricing tiers. Creates future marketplace revenue stream.
- **Status:** Active.

### DEC-178: Financial Agent MVP simplification — system function + Strategist skill

- **Context:** The Financial Agent (marketing engine §5.2) handles budget control, spend tracking, P&L. But MVP has no real ad spend (DEC-165), no distribution motors, no Marketplace suppliers. What does it control?
- **Decision:** MVP: **no Financial Agent**. Token cost tracking → system function (Helicone aggregation, usage billing, rate limiting — pure arithmetic). Budget validation in Strategist pipeline → Strategist "Budget Validation" skill at G1 and G3 (applies M6 frameworks to validate plan economics). Post-MVP: promoted to independent agent when distribution motors generate real spend (needs independence to counterweight Strategist recommendations).
- **Alternatives considered:** (a) Build full agent now (rejected — no data to justify its existence), (b) Skip budget validation entirely (rejected — Strategist pipeline needs economic sanity checks at gates).
- **Impact:** Eliminates one agent from MVP. Table `financial_tracking` exists from Fase 0 to accumulate cost data.
- **Status:** Active.

### DEC-179: Channel Manager MVP simplification — lookup table + Strategist tool

- **Context:** The Channel Manager (marketing engine §5.3) provides expert channel knowledge. But MVP has no distribution motors executing on channels.
- **Decision:** MVP: **no Channel Manager agent**. Channel knowledge → `channel_registry` table seeded with ~15-20 main Funnel Matrix channels (name, type, reach, formats, cost model, best practices, limitations). Strategist access → `lookup_channel` tool queries the table at Media Plan step. Data maintained manually by admin. Post-MVP: promoted to agent when distribution motors need dynamic channel expertise, real-time spec adaptation, and response to Media Scout discoveries.
- **Alternatives considered:** (a) Build full agent now (rejected — static knowledge doesn't need an agent), (b) Hardcode channel knowledge in Strategist prompt (rejected — unmaintainable, can't update without redeploy).
- **Impact:** Eliminates one agent from MVP. Strategist still produces channel-aware campaign briefs via table lookup.
- **Status:** Active.

---

## Session 15 — April 9, 2026 (Token Economics, Video Pipeline Refinement, Agent Simplification)

### DEC-180: Token as criteria.agency's own currency, decoupled from LLM tokens

- **Context:** Need a billing model that is predictable for clients and absorbs cost variability from multiple LLM providers, iteration loops, and model differences.
- **Decision:** criteria.agency tokens are a proprietary currency, not LLM tokens. The client pays in "criteria tokens." Internally, criteria.agency converts to each provider's token costs and absorbs variability (retries, model differences, 3+3 iterations). Two consumption modes: **Think** (silent — MARA, Strategist, Brand Builder consume without asking) and **Produce** (explicit — images, video, audio show estimated cost on the "Create" button before execution). Client always sees a token balance indicator.
- **Alternatives considered:** (a) Pass-through LLM token costs (rejected — unpredictable for client, exposes internal cost structure), (b) Fixed price per output type (rejected — too rigid, doesn't account for parameterization).
- **Impact:** Every motor and agent must track token consumption. Helicone provides internal cost; a conversion layer maps to criteria tokens.
- **Status:** Active.

### DEC-181: Production cost approval at Gate 1 (script approval = budget approval)

- **Context:** Video production is expensive in tokens. The client needs to approve the investment before visual/audio generation begins. The cost can be estimated from the script because it defines number of shots, complexity, and duration.
- **Decision:** Gate 1 in the Video Motor (per DEC-183 pipeline) combines creative approval (script + style) with budget approval (production cost estimate). The estimate covers worst case (full 3+3 iterations on all clips). Text phases before Gate 1 (brief, concept, script) consume tokens silently as "think." Everything after Gate 1 is pre-approved "produce." If the actual cost is less than the estimate, the client is only charged the actual cost. The client must have sufficient tokens for worst-case before production can start.
- **Impact:** Gate 1 becomes the commitment point. Simplifies the client experience: one approval, not two.
- **Status:** Active.

### DEC-182: Iteration control as client option (linked to autonomy mode)

- **Context:** The 3+3 rule means worst-case cost is ~3x the best case. Clients should have control over whether the system iterates automatically.
- **Decision:** Iteration automatic on/off is controlled by the client. With iteration ON + autonomous mode ("AI decides"), the system iterates without asking — client pays worst case. With iteration OFF, the system stops at first result — lower cost, lower guarantee of quality. In "human approves" mode, iteration control is irrelevant because the client is already in the loop at every gate. The cost estimate on the Create button reflects the iteration setting.
- **Impact:** Connects autonomy configuration (existing) with token economics. Affects cost estimates shown to client.
- **Status:** Active.

### DEC-183: Video Motor pipeline refined — 4 gates, preproduction phase, style from CD

- **Context:** The original Video Motor spec had 10 steps and 5 gates. Through design refinement, the pipeline was simplified to match real production workflows.
- **Decision:** Video Motor pipeline: (1) **Script + Style** — Writer produces script, Creative Director provides style image from campaign direction → **Gate 1** (client approves script + style + cost estimate). (2) **Preproduction** (no gate) — Director/Producer does breakdown (desglose), DP generates images of individual ingredients, then composes shot images using approved style as reference. (3) **Shot images** → **Gate 2** (images match script intent within approved style). (4) **Animation** — each image animated to clip → **Gate 3** (clips work as motion). (5) **Post-production** — assembly per script, music, SFX, voiceover → **Gate 4** (final piece ready). Style image in Gate 1 is inherited from Creative Director's campaign-level direction, not generated per piece.
- **Alternatives considered:** Original 10-step 5-gate pipeline (rejected — overcomplicated, didn't match real production logic).
- **Impact:** Replaces original Video Motor pipeline design. Reduces gates from 5 to 4. Preproduction is internal work, not a gate. Updates needed in video-motor-design spec.
- **Status:** Active. Supersedes pipeline definition in `2026-04-09-video-motor-design.md`.

### DEC-184: Showrunner eliminated — Director evaluates gates, CD oversees campaign coherence

- **Context:** The Showrunner (Opus Tier A agent, 5 skills) was designed to direct video pieces and evaluate gates within the Video Motor. But with the refined pipeline, the Creative Director already defines style and creative direction at campaign level, and the Director within the Video Motor handles breakdown and execution decisions. The Showrunner's gate evaluation role is what any director naturally does — review work and decide if it meets the vision.
- **Decision:** **Eliminate the Showrunner agent.** The Director within the Video Motor directs the piece AND evaluates gates. The Creative Director (transversal) oversees coherence across pieces at campaign level — this is the actual "showrunner" function (TV terminology: consistency across episodes). If the Director can't resolve a creative issue within the 3+3 rule, it escalates to the Creative Director. If the CD can't resolve, it escalates to JP.
- **Alternatives considered:** (a) Keep Showrunner as separate agent (rejected — redundant with Director, doubles Opus cost), (b) Merge Showrunner into CD (considered — but the Director is the natural owner of piece-level gate evaluation).
- **Impact:** One fewer Opus Tier A agent. Reduces cost per video pipeline execution. Simplifies agent hierarchy. Agent count reduced. Updates needed in transversal-agents-design spec and AGENT_REGISTRY.
- **Status:** Active. Supersedes Showrunner definition in DEC-174 and `2026-04-09-transversal-agents-design.md`.

### DEC-185: Escalation calibration loop — JP interventions feed global agent calibration via MARA

- **Context:** When human escalation occurs (after 3+3), JP resolves the creative issue. That intervention contains valuable calibration data that should improve agent performance globally, not just for the specific brand or piece.
- **Decision:** JP's escalation interventions happen as conversations with MARA. MARA has full context of the failed pipeline (what was attempted, why each gate rejected). JP provides creative direction. MARA captures the intervention and a system function classifies it (tone, structure, visual direction, Brand DNA interpretation, etc.) and distills it into a general calibration rule. The rule is added to the relevant agent's base prompt in prompt_registry — NOT to a specific brand's Brand DNA, NOT to a specific piece. Each intervention improves all future executions for all clients. Operational monitoring (gate success rates, cost patterns, failure trends) is handled by system functions that produce a daily summary for JP, not by JP manually reviewing dashboards.
- **Alternatives considered:** (a) Store calibrations per brand in Brand DNA (rejected — contaminates brand identity with operational instructions), (b) Store in agent prompt per brand (rejected — doesn't scale, same lesson benefits all brands), (c) Require JP to manually update prompts (rejected — friction kills the feedback loop).
- **Impact:** Creates a virtuous cycle: more usage → more escalations → better agents → fewer escalations. Prompt_registry becomes a living system that learns from operation.
- **Status:** Active.

### DEC-186: Creation motors are orchestration pipelines, not agent silos

- **Context:** As more creation motors are designed (Video, Graphic Design, Audio), a pattern emerged: each motor uses the same transversal agents (CD, Writer, Diseñador, Audio Producer) in different combinations. No motor owns its agents.
- **Decision:** Creation motors are **orchestration pipelines** that assemble transversal creative agents. The motor defines the sequence, gates, and product — the agents provide the talent. Example: Graphic Design uses CD + Writer + Diseñador. Video uses CD + Writer + Director + DP + Diseñador (motion graphics) + Audio Producer + Editor. This means agent cost is tracked per invocation, not per motor. A Diseñador invocation costs the same whether it's for Graphic Design or Video.
- **Impact:** Simplifies agent architecture. New motors don't require new agents — they require new orchestration of existing ones. Reduces total agent count.
- **Status:** Active.

### DEC-187: Diseñador as transversal agent

- **Context:** The Graphic Design motor needs a composition agent. The Video Motor needs motion graphics. Both require the same skills: composition, typography, visual hierarchy, layout.
- **Decision:** The Diseñador is a **transversal agent**, not specific to any motor. Skills: static composition (Graphic Design motor), motion graphics (Video Motor), and potentially web layout, email layout (future motors). Sonnet Tier A (handles brand-sensitive visual content). Available to any creation motor that needs visual composition.
- **Impact:** One agent serves multiple motors. Avoids duplicating visual composition capabilities across motors.
- **Status:** Active.

### DEC-188: Graphic Design motor pipeline — 2 gates, adaptations as system function

- **Context:** Designing the Graphic Design motor following the principle that motors are orchestration of transversal agents (DEC-186).
- **Decision:** Pipeline: **Brief** (from Strategist) → **CD** (defines piece concept within campaign concept) → **Writer** (produces texts: headline, body, CTA) → **Gate 1** (client approves concept + texts + cost estimate) → **Diseñador** (composes piece using approved concept + texts + campaign style from CD) → **Gate 2** (final piece approved) → **System function** (mechanical adaptations to multiple formats — resize/recompose, no creative decisions). Three transversal agents (CD, Writer, Diseñador), two gates, one system function. Think is silent (brief, concept, texts). Produce is explicit at Gate 1 (cost estimate on Create button).
- **Alternatives considered:** Three gates with separate concept and text approvals (rejected — unnecessary friction, concept and texts are one package).
- **Impact:** First creation motor designed with the transversal agent pattern. Template for future simple creation motors.
- **Status:** Active.

### DEC-189: Audio Producer as transversal agent with production + mixing skills

- **Context:** The Audio motor needs an agent that produces audio elements (music, voice, SFX) AND mixes them into final pieces. The Video Motor needs audio for post-production.
- **Decision:** The Audio Producer is a **transversal agent** with two core skills: **production** (generate individual elements — music, voiceover, SFX, jingles) and **mixing** (combine elements into final piece with levels, EQ, timing). When serving the Audio motor independently, its output goes through Audio motor gates. When serving the Video Motor, its output is evaluated as part of the video in Video Gate 4 — no separate audio gate.
- **Impact:** One agent serves both Audio and Video motors. Avoids separate audio approval flows when audio is an ingredient of video.
- **Status:** Active.

### DEC-190: Audio motor pipeline — 2 gates, same pattern as Graphic Design

- **Context:** Designing the Audio motor as an independent motor for audio-only deliverables (jingles, podcasts, radio spots, sound branding, SFX).
- **Decision:** Pipeline: **Brief** (from Strategist) → **CD** (defines sonic concept within campaign) → **Writer** (produces script/lyrics/description) → **Gate 1** (client approves concept + text + cost estimate) → **Audio Producer** (produces elements + mixes final piece) → **Gate 2** (mixed piece approved) → **System function** (adaptations — duration variants, format conversions). Same pattern as Graphic Design (DEC-188): three transversal agents (CD, Writer, Audio Producer), two gates, mechanical adaptations. The motor only activates independently when audio IS the deliverable. When audio serves video, the Audio Producer works within the Video Motor pipeline.
- **Alternatives considered:** Separate gate for individual elements before mixing (rejected — evaluate the mix directly, if an element is bad the Audio Producer detects it during mixing).
- **Impact:** Confirms the universal creation motor pattern: Brief → CD → Writer → Gate 1 → Specialist → Gate 2 → Adaptations.
- **Status:** Active.

### DEC-192: Desarrollador Web as transversal agent

- **Context:** The Web motor needs someone to convert approved visual designs into functional code. This is a different skill from visual composition (Diseñador) — it requires thinking about structure, interactions, performance, and responsiveness.
- **Decision:** The Desarrollador Web is a **transversal agent**, separate from the Diseñador. The Diseñador thinks in visual composition; the Desarrollador Web thinks in functional implementation. Analogous to the separation between DP (generates image) and animation model (generates clip) in the Video Motor. Skills: web development (Web motor), and potentially email HTML (future Email motor). Sonnet Tier B (code generation doesn't handle brand-sensitive content directly — works from approved designs).
- **Alternatives considered:** (a) Diseñador with web dev skill (rejected — different expertise, different evaluation criteria), (b) System function for code generation (rejected — development requires judgment about interactions, performance, edge cases).
- **Impact:** New transversal agent. Available to any motor that needs design-to-code conversion.
- **Status:** Active.

### DEC-193: Web motor pipeline — 3 gates, design and development separated

- **Context:** Designing the Web motor for landing pages, microsites, and full websites. The deliverable is a live, functional website — not a static file.
- **Decision:** Pipeline: **Brief** (from Strategist) → **CD** (concept for site/landing within campaign) → **Writer** (texts for all pages — headlines, body, CTAs, microcopy) → **Gate 1** (concept + texts + information architecture + cost estimate) → **Diseñador** (skill web: designs pages visually) → **Gate 2** (visual design approved) → **Desarrollador Web** (implements functional code) → **Gate 3** (live site approved) → **System function** (responsive adaptations if needed). Four transversal agents (CD, Writer, Diseñador, Desarrollador Web), three gates. More complex than Graphic Design/Audio (2 gates) but less than Video (4 gates). Gate 2 prevents wasting development resources on unapproved designs.
- **Alternatives considered:** (a) Two gates with design+development fused (rejected — different skills, different evaluation criteria, client should approve visuals before development starts), (b) Diseñador does both design and development (rejected — different expertise).
- **Impact:** Establishes Web motor as a 3-gate creation pipeline. Confirms pattern variation: simple motors = 2 gates, intermediate = 3 gates, complex (Video) = 4 gates.
- **Status:** Active.

### DEC-194: Web motor analogy to Video pipeline — image:development as image:animation

- **Context:** In the Video Motor, production goes image → clip (animation) → edited piece. In Web, production goes design → development. The relationship between the Diseñador and Desarrollador Web mirrors the relationship between image generation and animation in Video.
- **Decision:** The design→development step in Web is analogous to image→animation in Video. The Diseñador produces the visual (like the DP produces the image). The Desarrollador Web makes it functional (like animation makes the image move). This analogy informs gate placement: approve the visual before investing in making it functional.
- **Impact:** Conceptual alignment across motors. Helps reason about future motors by analogy.
- **Status:** Active.

### DEC-195: Ads motor — two modes: Manual and Automatic (supersedes DEC-165 partially)

- **Context:** DEC-165 said "no ad spend intermediation in Phase 1." But criteria.agency needs to be its own first client (CriteriaFilms), and for clients the manual mode creates friction. Need a clean separation.
- **Decision:** Two modes only, no intermediate: **Manual** — criteria.agency generates a downloadable package (creative assets in exact formats per platform + ad texts + audience definitions + step-by-step configuration instructions). Client does everything in their ad platform. If client wants optimization help, uploads reports manually. No API connection, no commission. **Automatic** — criteria.agency connects client's ad accounts via API, executes campaigns, monitors metrics, optimizes. Client prepays ad budget. criteria.agency charges commission on spend. JP uses automatic mode first with CriteriaFilms as dogfooding. Available to clients when proven.
- **Alternatives considered:** (a) Three modes including read-only API (rejected — half-connected state is confusing, either you're connected or you're not), (b) No intermediation ever (rejected — full-service execution is the real value for PyMEs who don't know ad platforms).
- **Impact:** Supersedes the absolute prohibition in DEC-165. Intermediation exists but is gated behind automatic mode, which launches after JP validates with own client. Revenue model: token consumption for creation + commission on ad spend in automatic mode.
- **Status:** Active. Manual mode at launch, automatic mode after CriteriaFilms validation.

### DEC-196: Ads motor pipeline — operations cycle, not creation pipeline

- **Context:** Ads is a distribution motor, not a creation motor. It doesn't produce creative assets — it distributes assets produced by creation motors (Video, Graphic Design, Audio).
- **Decision:** Pipeline is a continuous operations cycle, not a linear creation pipeline with gates: **Strategist** designs campaign (existing Fase 4 capability) → **System function** (Channel Manager connectors) translates plan to platform-specific configuration + packages assets in required formats → **Manual mode:** generates downloadable package for client. Client uploads reports when available. → **Automatic mode:** executes via API, monitors metrics continuously, Analyst processes data, Strategist recommends optimizations, cycle repeats. No creation gates. No CD, Writer, or Diseñador involvement — those already did their work in the creation motors.
- **Impact:** First distribution motor designed. Establishes that distribution motors are operations cycles, distinct from creation motor pipelines.
- **Status:** Active.

### DEC-197: Channel Manager evolution — system function with platform connectors

- **Context:** DEC-179 defined Channel Manager MVP as a static lookup table. The Ads motor design reveals it needs to be more operational: translating Strategist plans into platform-specific configurations, knowing exact format requirements, and in automatic mode, executing via API.
- **Decision:** Channel Manager is a **system function with platform connectors**, not an agent. Each connector (Meta, Google, TikTok, etc.) knows: platform requirements (formats, sizes, text limits), configuration steps, API endpoints (for automatic mode), and reporting formats (for parsing uploaded reports in manual mode). No creative or strategic judgment — pure operational translation. Evolves from static table (MVP) to active connectors (post-MVP). New platforms added by creating new connectors.
- **Alternatives considered:** (a) Promote to agent (rejected — no judgment needed, pure translation), (b) Keep as static table forever (rejected — automatic mode requires API integration knowledge).
- **Impact:** Channel Manager grows from DEC-179 table into an extensible connector system. Each new ad platform = one new connector module.
- **Status:** Active. Supersedes DEC-179 for post-MVP scope.

### DEC-198: Email motor — internal platform with creation + distribution + list management

- **Context:** Email marketing requires three capabilities: creating the email, managing who receives it, and sending it. The question was whether criteria.agency connects to external email platforms (Mailchimp, SendGrid) or handles email internally.
- **Decision:** criteria.agency **is** the email platform. No external email marketing tool needed from the client's perspective. Three layers: (1) **Lists** (permanent infrastructure) — import contacts, segment, manage subscriptions/unsubscriptions. System functions, no LLM. (2) **Creation** (creation pattern) — Brief → CD → Writer (subject line, preheader, body, CTAs) → Gate 1 (concept + texts + cost estimate) → Diseñador (skill email layout) → Desarrollador Web (HTML email) → Gate 2 (email approved). Same pattern as Web motor. (3) **Distribution** (operations) — segment selection, scheduling, sending via delivery service (AWS SES/SendGrid/Postmark as backend), metric monitoring (opens, clicks, bounces, unsubscribes), data to Analyst. Emails are sent **from the client's own domain/email**, not from criteria.agency. Requires one-time DNS setup (SPF/DKIM/DMARC) verified by system function.
- **Alternatives considered:** (a) Connect to client's existing email platform via API (rejected — adds dependency, criteria.agency loses control of data and experience), (b) Send from criteria.agency domain (rejected — destroys deliverability and brand trust).
- **Impact:** criteria.agency becomes a full email marketing platform. Client doesn't need Mailchimp. All email data is first-party, directly available to Analyst. One-time domain setup required per client.
- **Status:** Active.

### DEC-199: Email motor creation follows Web motor pattern — 2 gates with Diseñador + Desarrollador Web

- **Context:** An email is essentially a web page that gets sent. It needs visual design and HTML development, same as the Web motor.
- **Decision:** Email creation uses the same agent pipeline as Web: Diseñador (skill email layout) produces the visual design, Desarrollador Web converts to HTML email code. Gate 1 approves concept + texts + estimate. Gate 2 approves the final email. The Desarrollador Web gains an email HTML skill in addition to web development — same agent, different skill. Email HTML has unique constraints (inline CSS, table layouts, client compatibility) that justify a specialized skill.
- **Impact:** No new agents needed for Email motor creation. Diseñador and Desarrollador Web gain email-specific skills. Confirms transversal agent model — same agents serve Video, Graphic Design, Audio, Web, and now Email.
- **Status:** Active.

### DEC-202: Productor as transversal agent — bridge between digital and physical

- **Context:** The Events motor needs someone to coordinate venues, vendors, staff, and logistics. The Print motor needs someone to manage printing specifications, vendor quotes, and delivery. Merchandising, stands for trade shows, and packaging have the same need: take an approved digital design and make it exist in the physical world.
- **Decision:** The **Productor** is a transversal agent that bridges digital outputs and physical execution. Skills: **Events** (venue sourcing, vendor contracting, staff coordination, live event timeline, setup/teardown), **Print** (printing specs — paper, finishes, inks — vendor quoting, quantities, delivery), **Merchandising** (branded product manufacturing — shirts, mugs, keychains — vendor sourcing, quantities, inventory), **Stands/Trade shows** (stand design fabrication, transport logistics, setup/teardown), **Packaging** (material specifications, prototype testing, mass production runs). All skills follow the same pattern: receive approved creative asset → adapt technical specs for physical production → source and manage vendors → oversee production → ensure delivery/execution.
- **Alternatives considered:** (a) Separate agents per domain (rejected — same core competency: managing physical production from digital inputs), (b) System function (rejected — requires judgment in vendor selection, negotiation, problem-solving during execution).
- **Impact:** New transversal agent. Serves Events, Print, Merchandising, Stands, and Packaging. Reduces need for multiple specialized agents. Manages human vendors and staff as resources, similar to how creation motors manage AI model APIs.
- **Status:** Active.

### DEC-203: Events motor — hybrid motor with CD skill + Productor + existing creation motors

- **Context:** Events require both creative outputs (invitations, signage, videos, landing pages) and physical logistics (venue, vendors, staff, timeline). The creative part uses existing creation motors. The logistics part is unique.
- **Decision:** Events motor pipeline: **CD with event skill** defines the integral creative direction for the event (concept, look & feel, visual universe). This feeds the transversal agents (Diseñador, Writer, etc.) who produce all creative pieces for the event under unified direction. In parallel, the **Productor with events skill** plans and coordinates all logistics. Pipeline: **Brief** (from Strategist — event objective, audience, scale) → **CD** (event creative direction — unified concept for all pieces and physical branding) → **Creative track:** Writer + Diseñador + other agents produce pieces (invitations, signage, presentations, video, landing, email) using existing motor patterns → **Logistics track:** Productor plans venue, vendors, staff, timeline, budget → **Gate 1** (client approves creative direction + logistics plan + total budget) → **Productor** executes: contracts vendors, coordinates staff, manages timeline → Event happens → **Productor** handles teardown, payments, evaluation. Gate 1 combines creative and logistics approval because both must be coherent (you can't approve the creative without knowing the venue, and vice versa).
- **Alternatives considered:** (a) Events as just a campaign type using existing motors (rejected — logistics coordination is a unique capability no other motor provides), (b) Separate creative and logistics approval gates (rejected — they're interdependent, approve as one package).
- **Impact:** First hybrid motor (creation + physical production). Establishes pattern for real-world execution.
- **Status:** Active.

### DEC-204: Physical Production motor replaces Print — covers print, merchandising, stands, packaging

- **Context:** The original "Print" motor was too narrow. Physical production of branded materials includes printing, but also merchandising, trade show stands, and packaging. All follow the same pattern: approved digital design → physical fabrication.
- **Decision:** Rename and expand: **Physical Production motor** (not just "Print"). Pipeline: Creative asset already approved (from Graphic Design or other creation motor, Gate 2 passed) → **Productor** adapts technical specifications for the specific physical medium → Productor sources and quotes vendors → **Gate 1** (client approves vendor + cost + quantities + timeline) → **Productor** manages fabrication, quality control, delivery. One gate only — the creative is already approved. The gate here is about production logistics and cost. Covers: print materials (brochures, posters, business cards), merchandising (branded products), trade show stands (design fabrication, transport, setup), packaging (materials, prototypes, production runs).
- **Alternatives considered:** (a) Separate motor per type — Print motor, Merch motor, etc. (rejected — same pipeline, same agent, same pattern), (b) No motor, just the Productor agent (rejected — needs orchestration, budget tracking, vendor management as infrastructure).
- **Impact:** Consolidates all physical production into one motor. Simplifies the motor count. The Productor's skill determines the domain, the motor provides the orchestration.
- **Status:** Active.

### DEC-205: CD gains event creative direction skill

- **Context:** Events need a unified creative direction that covers all pieces (invitations, signage, spatial branding, presentations, video) and the physical experience (décor, ambiance, flow). This is creative direction applied to a multi-sensory, physical experience.
- **Decision:** The Creative Director gains an **event creative direction skill**. This skill defines the integral concept for the event — visual identity, spatial experience, tone, and how all pieces (digital and physical) connect into a coherent experience. The output feeds both the creative agents (Diseñador, Writer, Audio Producer for ambient music) and the Productor (who translates the creative direction into vendor briefings for décor, lighting, catering presentation, etc.).
- **Impact:** No new agent. CD expands its skill set. Confirms CD as the single source of creative direction across all contexts: campaigns, video pieces, and now events.
- **Status:** Active.

### DEC-206: Gate structure scales by motor complexity — 1 to 4 gates

- **Context:** Across all designed motors, a pattern of gate complexity has emerged based on the nature of the deliverable.
- **Decision:** Gate count reflects the number of distinct approval moments needed: **1 gate:** Physical Production motor (creative already approved, only logistics/cost approval needed). **2 gates:** Graphic Design, Audio, Email (concept+text approval → final piece approval). **3 gates:** Web (concept+text → visual design → functional site). **4 gates:** Video (script+style+cost → shot images → animation clips → final edited piece). Events has 1 gate but it combines creative direction + logistics approval into one package. This is a pattern, not a rule — future motors may vary.
- **Impact:** Provides a framework for designing new motors: count the distinct "approve before investing in the next expensive step" moments.
- **Status:** Active.

### DEC-200: Email list import policy — technical verification + gradual sending + contractual responsibility (see also DEC-201 on campaigns)

- **Context:** Clients like a supermarket may have 50,000+ existing contacts. Blocking imports would cripple the Email motor's value. But accepting unverified lists risks spam complaints and destroys sending reputation for all clients sharing the infrastructure.
- **Decision:** Clients **can import existing contact lists**. criteria.agency applies three layers of protection: (1) **Technical cleaning** — system function validates emails (syntax, active domain, no disposable, no known spam traps), removes duplicates and invalid entries. (2) **Gradual sending** — first campaigns to imported lists start with small batches, monitoring bounce rates and complaint rates. If indicators are healthy, volume opens. If they degrade, sending pauses automatically. (3) **Contractual** — TOS requires client to declare that imported contacts were obtained with consent. Legal responsibility for list legitimacy is on the client. No double opt-in reconfirmation required — criteria.agency does NOT burden the end recipient with reconfirmation emails. New contacts captured via criteria.agency campaigns (forms, landing pages) use standard double opt-in from the start.
- **Alternatives considered:** (a) Only allow organically captured contacts (rejected — excludes clients with existing bases, kills adoption), (b) Require reconfirmation email to all imported contacts (rejected — burdens end recipients, client loses legitimate contacts who don't click), (c) No verification at all (rejected — one bad list destroys sending reputation for all clients).
- **Impact:** Enables Email motor adoption by clients with existing databases while protecting platform deliverability. Monitoring system must exist before Email motor launches.
- **Status:** Active.

### DEC-201: Campaigns have temporality — temporal or persistent. Email automations are persistent campaigns.

- **Context:** Email "automations" (welcome flows, post-purchase sequences, reactivation) seemed like a separate concept from campaigns. But in criteria.agency, a campaign is already defined as a thematic grouping of activations across channels positioned in the Funnel Matrix. Automations are just campaigns that don't end.
- **Decision:** Campaigns have a **temporality attribute**: **temporal** (has start and end date — product launch, Black Friday, seasonal) or **persistent** (runs indefinitely, reviewed periodically — welcome, onboarding, reactivation, corporate, RSE). Email automations are persistent campaigns with trigger-based activations in the email channel. No separate concept, no separate infrastructure. The Strategist designs both types. The Funnel Matrix displays both. All channels (email, web, ads, social, even point of sale) are channels within campaigns — owned, paid, or earned. This also means the website itself is a channel where campaigns have activations (landing pages, banners, etc.).
- **Alternatives considered:** (a) Separate "automations" system for email (rejected — creates a parallel structure that duplicates campaign logic), (b) Only temporal campaigns (rejected — welcome flows and ongoing brand communications don't fit a start/end model).
- **Impact:** Unifies all marketing activities under one concept: campaigns with activations across channels. Simplifies the Funnel Matrix — persistent campaigns appear alongside temporal ones. The Strategist's planning scope now explicitly includes persistent flows. The campaign data model needs a temporality field (temporal/persistent) and for temporal campaigns, start/end dates.
- **Status:** Active.

---

## Session 16 — Distribution Motors & Messenger Agent (April 9, 2026)

Summary: Deconstructed Community Management — not a motor, but orchestration of existing motors + new Messenger agent. Messenger is a transversal conversational agent (brand voice outward). Sales/CRM restructured: Prospector → Analyst skill, Closer → Messenger skill. Distribution consolidation (DEC-065) updated. Net agent count reduced by 3.

### DEC-207: Community Management is not a motor — it's orchestration of existing motors + Messenger

- **Context:** The marketing engine spec (§4.7) defined Community Management as a continuous loop: Content Calendar → Publication → Listening → Response → Engagement → Report. When decomposed function by function, every piece is already covered by existing motors: Strategist plans the content calendar/grid, creation motors (Graphic Design, Video, Audio) produce pieces, Channel Manager (system function, DEC-197) handles publication and format adaptation per platform, Listeners (Intelligence motors) monitor mentions and sentiment, Analyst reports metrics. The only missing piece was: who responds to comments, DMs, and mentions.
- **Decision:** Community Management does not get its own motor. It is an orchestration pattern across existing motors. The missing conversational response capability is provided by the new Messenger agent (DEC-208). This follows the same pattern established in DEC-186 (motors are orchestration pipelines, not agent silos) — Community Management simply doesn't need its own pipeline because it has no unique creation or production sequence. It's a continuous operation where multiple existing agents contribute.
- **Alternatives considered:** (a) Community Management as independent motor with its own agents (rejected — every function already exists elsewhere, creating a motor would duplicate capabilities), (b) Community Management as part of Owned Channels Operator per DEC-065 (rejected — the Owned Channels Operator concept is being retired per DEC-210).
- **Impact:** Reduces motor count. Validates the transversal agent model — complex capabilities emerge from agent composition, not from creating new silos.
- **Status:** Active.

### DEC-208: Messenger — transversal conversational agent (brand voice outward)

- **Context:** Multiple motors need a capability that didn't exist: holding real-time conversations on behalf of the client's brand with external people. Community Management needs someone to respond to comments and DMs. Sales/CRM needs someone to do outreach and close deals. Web sites need chatbots. WhatsApp business accounts need conversational handling. All share the same core: conversing in brand voice, classifying intent, deciding when to escalate to human.
- **Decision:** New transversal agent: **Messenger**. The agent that speaks outward on behalf of the client's brand in 1-to-1 or 1-to-few interactions. Distinct from MARA (speaks inward to criteria.agency users) and Writer (creates content for publication, doesn't converse). Tier A (Anthropic) — handles brand-sensitive conversations. Skills: (1) **Community Response** — replies to comments, DMs, mentions on social media. Objective: engagement, support, reputation defense. (2) **Chat/Bot** — handles web chat, WhatsApp, Messenger conversations. Objective: attention, information, lead capture. (3) **Sales** (absorbs Closer, see DEC-209) — outreach, nurture, objection handling, negotiation, close. (4) **Support** (future) — customer service, ticket resolution, retention. All skills share: Brand DNA for voice consistency, Brand Guardian validation, intent classification of interlocutor, conversation thread context, escalation rules to human, interaction logging for Analyst. Operational model: routine responses (FAQ, thanks, standard replies) handled by system function with Brand Guardian-approved templates (no LLM). Messenger activates when classification indicates the situation requires judgment. Autonomy configurable per skill (auto-respond vs recommend-and-wait).
- **Alternatives considered:** (a) Skill of Writer (rejected — Writer creates content, doesn't hold conversations; different rhythm and context management), (b) Skill of MARA (rejected — MARA serves criteria.agency's interface, not the client's brand voice; mixing them conflates inward and outward communication), (c) Separate agents per domain — Community Responder, Chatbot Agent, Sales Closer (rejected — same core competency with different skills, exactly the pattern DEC-064 was designed to avoid), (d) Names considered: Communicator (too broad, overlaps with Writer), Spokesperson (good but Messenger is more natural given the messaging channels it operates on).
- **Impact:** New transversal agent. Serves Community Management orchestration, Sales/CRM motor, Web motor (post-publication chat), and future customer support. Agent count: +1.
- **Status:** Active.

### DEC-209: Sales/CRM motor restructured — zero proprietary agents

- **Context:** Sales/CRM (§4.10) had two agents: Prospector (enrichment, scoring, qualification) and Closer (outreach, nurture, negotiation, close). With the Messenger agent (DEC-208) absorbing conversational capabilities, and the Analyst already capable of data analysis on people, both Sales agents can be absorbed into transversals.
- **Decision:** **Prospector → Analyst skill (lead intelligence).** Lead scoring is analysis: take data from multiple sources (forms, events, ads, social), cross with criteria (fit, intent, budget), generate a score, classify BANT. Same pattern as any other Analyst skill but applied to people instead of campaigns. **Closer → Messenger skill (sales).** Outreach, follow-up, objection handling, negotiation are conversations in brand voice with commercial objective. Same core capability as community response or chat, different skill loaded. The Sales/CRM motor becomes pure orchestration: system functions capture leads → Analyst (lead intelligence skill) enriches and scores → Messenger (sales skill) engages qualified leads → Writer + Designer produce proposals → Messenger closes → system function updates CRM status. Zero proprietary agents, consistent with DEC-186.
- **Alternatives considered:** (a) Keep Prospector as standalone agent (rejected — enrichment and scoring is pure analysis with no conversational or creative judgment), (b) Keep Closer as standalone (rejected — conversational capability is the same as Messenger's other skills, siloing it wastes the transversal pattern).
- **Impact:** Sales/CRM motor loses 2 proprietary agents (-2). Analyst gains lead intelligence skill. Messenger gains sales skill. Proposal generation uses existing Writer + Designer. Pipeline stages map cleanly to existing transversal agents.
- **Status:** Active.

### DEC-210: DEC-065 updated — distribution is no longer 2 agents

- **Context:** DEC-065 consolidated distribution from 4 motors (~18 agents) into 2 agents: Paid Media Operator (trader rhythm) and Owned Channels Operator (publisher rhythm). Session 15 designed Ads and Email as independent motors (DEC-195-201). Session 16 deconstructed Community Management into orchestration. The 2-agent model no longer reflects reality.
- **Decision:** DEC-065's consolidation is superseded. Distribution is resolved through: **Ads motor** (DEC-195-197) — operations cycle with manual/automatic modes, Channel Manager connectors as system functions. **Email motor** (DEC-198-201) — criteria.agency as email platform, three layers (lists, creation, distribution). **Community Management** (DEC-207) — orchestration of existing motors + Messenger. **SEO/Content** — pending design (next session). The Paid Media Operator and Owned Channels Operator concepts are retired. Their functions are absorbed: Paid Media Operator → system functions (Channel Manager connectors) + Strategist for optimization decisions. Owned Channels Operator → distributed across Messenger (response), system functions (publication), and existing agents.
- **Impact:** Agent count: -2 (Paid Media Operator, Owned Channels Operator removed). Distribution becomes a category of motors/orchestrations, not a category of agents.
- **Status:** Active. Supersedes DEC-065 for distribution scope.

### DEC-211: Agent count updated — ~25 agents (down from ~28)

- **Context:** Sessions 15 and 16 restructured multiple areas. Need to reconcile the total agent count.
- **Decision:** Net changes from session 16: +1 (Messenger), -1 (Prospector → Analyst skill), -1 (Closer → Messenger skill), -1 (Paid Media Operator → system function), -1 (Owned Channels Operator → retired). Net: -3. Combined with session 15 changes (DEC-184 Showrunner eliminated: -1), total from ~28 to ~25. Updated transversal agent list: Creative Director, Strategist, Brand Guardian, Financial Agent (system function per DEC-178), Channel Manager (system function per DEC-197), Media Scout, Designer, Writer, Audio Producer, Developer Web, Producer, **Messenger**, Security Analyst. Creation agents: Brand Strategist, Video DP, Video Editor. Intelligence: Listener (1 design × 4 instances), Opportunity Agent.
- **Impact:** Leaner agent architecture. More capability delivered through skills on fewer, more versatile transversal agents. Consistent with DEC-064 philosophy.
- **Status:** Active. Supersedes agent count in DEC-064.

---

## Session 17 — SEO Architecture (April 9, 2026)

Summary: SEO deconstructed following Community Management pattern (DEC-207). Not a motor — a capability (C-019) composed of SEO-specific skills on existing agents. No new agents. Link building mapped to existing transversal agents (Media Scout, Messenger, Writer). Strategist orchestrates all SEO activity through media plan and optimization triggers.

### DEC-212: SEO is not a motor — it's a capability composed of skills on existing agents

- **Context:** The Marketing Engine Design (§4.9) defined an SEO/Content pipeline as a 5-step motor: Keyword Research → Content Strategy → [G1] → Production → Publication → Continuous Optimization. However, examining each step reveals that every function already exists in transversal agents. Keyword research is data analysis (Analyst). Content strategy is media planning (Strategist, M4). Production invokes existing creation agents (Writer, Diseñador, Video). Publication is the Web motor. Optimization is Analyst monitoring + Strategist decisions. SEO expertise is real and specialized, but it's domain knowledge (skills), not autonomous judgment requiring a new agent or orchestration pipeline.
- **Decision:** SEO is a **capability (C-019)** that emerges from SEO-specific skills distributed across existing agents, orchestrated by the Strategist as part of the media plan. No SEO motor. No SEO agent. The client doesn't "activate SEO" as a separate project — organic content strategy comes out of the Strategist's media plan (M4: Owned & Earned media), and SEO-specific decisions and optimizations are handled by agents with SEO skills. Follows the same deconstruction pattern as Community Management (DEC-207).
- **Alternatives considered:** (a) SEO as independent motor with its own pipeline (rejected — every pipeline step maps to an existing agent, creating a motor would duplicate orchestration the Strategist already does), (b) SEO as lightweight orchestration motor without own agents, like Events (rejected — Events has a unique deliverable type requiring physical production coordination; SEO's deliverable is content, which existing creation motors already produce), (c) SEO as skill set on the "Owned Channels Operator" agent (rejected — DEC-210 retired that agent).
- **Impact:** Reduces motor count. SEO capability requires 5 new skills across 3 agents + system functions (see DEC-213). The Marketing Engine Design §4.9 SEO/Content pipeline is superseded by this architecture. C-019 capability map updated: infrastructure = Analyst + Strategist + Writer + Media Scout + Messenger + Web motor + system functions.
- **Status:** Active. Supersedes §4.9 of Marketing Engine Design for SEO architecture.

### DEC-213: SEO skills distribution across agents

- **Context:** DEC-212 establishes that SEO capability lives in skills, not in a dedicated motor or agent. Need to define exactly which skills go where, following the principle that analytical work goes to Analyst, strategic decisions go to Strategist, and execution expertise goes to creation agents.
- **Decision:** Five SEO-specific skills distributed across three agents, plus system functions:

  **Analyst — "SEO Intelligence" skill:**
  Keyword research (volume, difficulty, search intent classification — informational/navigational/transactional/commercial), competitive gap analysis. Ranking monitoring (position tracking, SERP feature tracking, visibility score). Backlink analysis (new/lost backlinks, domain authority, toxic link detection). Keyword cannibalization detection. Content performance analysis (which pieces drive organic traffic, which are declining). Data sources: Google Search Console, Google Analytics, keyword research APIs, backlink APIs. Feeds Strategist via Interface 2 (processed diagnostics) and Client via Interface 1 (visibility dashboards).

  **Strategist — "Organic Content Strategy" skill (extends M4):**
  Topic cluster design (pillar pages + cluster content). Editorial calendar for organic content. Content freshness strategy (refresh vs create new vs consolidate). Internal linking architecture. Link building strategy (tactic prioritization: guest posting, digital PR, linkable assets, resource outreach; which Media Scout opportunities to pursue). Keyword-to-funnel mapping. Priority decisions via impact × effort matrix.

  **Writer — "SEO Copywriting" skill:**
  Writing for search intent (matching content structure to user need). Header architecture (H1-H3 for readability and crawlability). Meta titles and descriptions (CTR optimization in SERP). Keyword integration (natural density, semantic variations, related entities). Featured snippet formatting (paragraph, list, table, definition). Internal link placement within body text. Content structure for E-E-A-T signals.

  **System functions (no LLM, automated):**
  Technical SEO audit (page speed, mobile-friendliness, crawlability, Core Web Vitals). Schema markup generation (articles, FAQs, how-tos, products, reviews). Meta tag validation (title/description length, duplicate detection). Sitemap management. Robots.txt management. Redirect management (301/302 chains, broken links). Crawl error monitoring (404s, soft 404s, server errors).

- **Alternatives considered:** (a) Single "SEO Expert" agent owning all skills (rejected — violates DEC-064 principle that domain knowledge is skills, not agents; judgment calls in SEO map cleanly to existing agent roles), (b) SEO knowledge only in Strategist (rejected — keyword research is analysis, not strategy; copywriting technique is execution, not planning).
- **Impact:** Three agents gain one skill each. System functions add to technical infrastructure. No agent count change. All SEO skills default to Tier B (see DEC-216).
- **Status:** Active.

### DEC-214: Link building mapped to existing transversal agents

- **Context:** Link building is the SEO activity that least obviously maps to existing agents. It involves: discovering opportunities (which sites to target), creating linkable content (assets worth linking to), and outreach (contacting site owners/editors to request links or propose guest posts). Each is a distinct type of work.
- **Decision:** Link building is a coordinated flow across five existing agents, no new orchestration needed:
  1. **Media Scout** discovers link building opportunities — high-authority sites in the client's industry, broken link opportunities, resource pages, guest post targets. Same "discover media opportunities, channels, partnerships" role (Marketing Engine §2.6).
  2. **Analyst** (SEO Intelligence skill) evaluates each opportunity — domain authority, relevance, traffic, spam score, competitive overlap. Feeds processed data to Strategist.
  3. **Strategist** (Organic Content Strategy skill) prioritizes and decides tactics — which opportunities to pursue, what type of content to create for each, resource allocation.
  4. **Writer** (+ Diseñador if visual content needed) creates the linkable asset or guest post. Writer's SEO Copywriting skill ensures optimization.
  5. **Messenger** (new skill: "link building outreach") executes the outreach — personalized pitch emails to editors/bloggers, follow-up, guest post negotiation. Same conversational capability as Sales outreach (DEC-208) and Community Management (DEC-207), different context.
  The Strategist's optimization loop monitors results: Analyst tracks new backlinks acquired → Strategist evaluates ROI of each tactic → adjusts strategy.
- **Alternatives considered:** (a) Dedicated link building agent (rejected — each step maps to an existing agent's core competency), (b) Link building as pure system function via automated outreach tools (rejected — outreach requires brand voice, personalization, and judgment about which opportunities are worth pursuing).
- **Impact:** Messenger gains one skill ("link building outreach"). Media Scout's existing role covers opportunity discovery without new skills. Confirms the pattern that complex capabilities emerge from agent composition.
- **Status:** Active.

### DEC-215: SEO triggers integrated into Strategist's trigger model (extends DEC-099)

- **Context:** DEC-099 defined 17 triggers for the Strategist in 3 categories (scheduled, reactive, consequence). SEO activity needs its own triggers within this framework — both scheduled (regular audits, content calendar) and reactive (ranking drops, algorithm updates, new keyword opportunities).
- **Decision:** SEO triggers added to the Strategist's existing trigger model, not as a separate trigger system:

  **Scheduled triggers:** Weekly ranking position review (Analyst SEO Intelligence runs, feeds Strategist). Monthly content performance review (which organic pieces growing/declining). Quarterly technical SEO audit (system function runs, flags issues to Strategist). Quarterly content freshness review (pieces older than N months losing positions).

  **Reactive triggers:** Significant ranking drop (>N positions for tracked keyword) → Analyst detects → Strategist evaluates. New high-opportunity keyword detected (emerging search terms from Listener data or Search Console). Technical SEO issue detected (crawl errors spike, Core Web Vitals degradation) → system function alerts → Strategist prioritizes. Competitor content detected on target keyword (Competitive Listener + Analyst) → Strategist decides response. Backlink lost from high-authority site → Analyst detects → Strategist decides recovery outreach.

  **Consequence triggers:** New Brand DNA layer completed → Strategist reviews organic content alignment. New campaign launched (any motor) → Strategist evaluates organic content support opportunities. Content piece published → system function submits to Search Console, monitors indexation.

  All triggers flow through the Strategist's existing skill activation model.

- **Alternatives considered:** (a) SEO triggers as separate Inngest cron jobs (rejected — fragments orchestration, Strategist should own all strategic triggers), (b) Only reactive triggers, no scheduled (rejected — SEO requires regular cadence audits regardless of incidents).
- **Impact:** Extends DEC-099's trigger count. Strategist's Organic Content Strategy skill activates on these triggers. Analyst's SEO Intelligence skill runs the data collection that feeds them.
- **Status:** Active. Extends DEC-099.

### DEC-216: SEO data tier classification — Tier B default, Tier A when Brand DNA in context

- **Context:** DEC-149 defines data sensitivity tiers: Tier A (confidential — Anthropic only), Tier B (general — OpenAI/Google allowed), Tier C (public only — any provider). SEO data involves keywords, rankings, traffic volumes, backlink profiles, competitor URLs, and search intent analysis.
- **Decision:** SEO skills default to **Tier B** (general data). Keyword data, rankings, and search metrics are derived from public search engines — not confidential client data. However, when SEO skills operate in context with Brand DNA (e.g., Strategist's Organic Content Strategy skill mapping keywords to brand positioning), the Strategist's existing Tier A classification applies — the SEO knowledge is Tier B, but the Brand DNA context forces Tier A for that invocation. Analyst's SEO Intelligence skill and Writer's SEO Copywriting skill operate at Tier B unless Brand DNA is in the prompt context.
- **Alternatives considered:** (a) All SEO at Tier A (rejected — search data is not confidential, would waste Tier A budget), (b) All SEO at Tier C (rejected — while data is public, competitive analysis reveals strategic intent which has business value).
- **Impact:** SEO intelligence analysis can use cost-effective Tier B models. Strategist invocations remain Tier A when Brand DNA is in context. Writer SEO Copywriting at Tier B unless brand voice loaded.
- **Status:** Active.

---

## Session 18 — Web Motor Design (April 9, 2026)

Summary: Web Motor designed as a full creation motor (sites, microsites, landing pages, blogs, product pages — no e-commerce). Replaces Video Motor as Fase 2 in BUILD_ORDER per founder-need-driven priority (dogfooding). Follows universal creation motor pattern (DEC-186) with 3 gates. Site architecture is brief input, not CD output. Web Developer introduced as new transversal agent. Motor is hybrid (project → continuous). Blog structure vs blog post content separated.

### DEC-217: Web Motor pipeline — universal creation motor pattern with 3 gates

- **Context:** The Web Motor needs a pipeline design. DEC-186 established the universal creation motor pattern: Brief → CD → Writer → Gate 1 → Specialist → Gate 2 → Adaptations. DEC-206 established that Web Motor has 3 gates (between Graphic Design's 2 and Video's 4). The Web Motor extends the universal pattern with a Development step and a third technical gate.
- **Decision:** Web Motor pipeline: `BRIEF → CD → WRITER → [G1: concepto + textos + costo] → DESIGNER → [G2: diseño visual] → WEB DEV → [G3: sitio funcionando] → DEPLOY`. G1 evaluates creative direction + copy + cost viability. G2 evaluates visual design + brand. G3 evaluates technical implementation + visual fidelity. The extension beyond the universal 2-gate pattern (G3 + Development + QA + Deploy steps) is justified because web outputs are live deployable artifacts that must function correctly — unlike graphic design (static) or audio (playable file).
- **Alternatives considered:** (a) 2 gates like Graphic Design (rejected — development is a substantial step that can introduce errors, needs its own quality checkpoint), (b) 4 gates like Video (rejected — Web doesn't have the cost escalation that Video has with image/video generation APIs; 3 gates are sufficient).
- **Impact:** Defines the complete Web Motor pipeline. All steps are Inngest steps within a single Inngest function.
- **Status:** Active.

### DEC-218: Site architecture is brief input, not CD output

- **Context:** Initial design had the Creative Director defining site architecture (pages, navigation, hierarchy). On reflection, the client (or Strategist campaign brief) already knows what pages they need and how they should be organized. This is project specification, not creative direction.
- **Decision:** Site architecture (pages, hierarchy, navigation structure, whether it includes blog, integrations) is part of the brief. The CD receives this architecture and decides HOW the user experiences it — visual direction, tonal direction, emotional flow, interaction principles — but not WHAT pages exist. Same principle as Video: the brief says "explainer video, 60 seconds, audience X" and the CD decides how to approach it creatively.
- **Alternatives considered:** (a) CD defines architecture (rejected — this is project scoping, not creative judgment), (b) Separate "Information Architect" agent (rejected — overkill, architecture is a brief field).
- **Impact:** Simplifies the pipeline. Brief intake is more structured (includes architecture fields). CD skill focuses purely on creative direction.
- **Status:** Active.

### DEC-219: Web Developer — new transversal agent

- **Context:** The Web Motor needs someone to translate approved design + copy into functional code. No existing agent has this capability. The Marketing Engine Design §2.1 listed "1: Web Developer" for the Web motor.
- **Decision:** Web Developer is a new transversal agent. Sonnet, Tier A (consumes Brand DNA and confidential client designs/copy). Three skills: Static Site (Next.js static/HTML — landing pages, microsites), CMS Site (Next.js with content management — sites with blogs), Microsite (lightweight, campaign-specific). This is an agent (not a system function) because it makes judgment calls about implementation approach, component architecture, performance optimization, and integration patterns.
- **Alternatives considered:** (a) System function that mechanically translates design to code (rejected — web development requires judgment about trade-offs), (b) External service/API for code generation (rejected — needs Brand DNA context and design fidelity).
- **Impact:** Agent count goes from ~25 to ~26. Web Developer is transversal — can serve any motor that needs web output (e.g., Email motor landing pages).
- **Status:** Active.

### DEC-220: Web Motor is hybrid (project → continuous)

- **Context:** The Web Motor produces a site (project mode) but sites need ongoing maintenance, new content, and updates (continuous mode). This matches the hybrid motor lifecycle from Marketing Engine Design §2.
- **Decision:** Web Motor is hybrid. Project mode: build and deploy the complete site (full pipeline with 3 gates). Continuous mode post-deploy: three operation types with different pipelines — (1) Blog posts: Brief → Writer → G1 simplified → Designer optional → publish via CMS, (2) New pages: full pipeline but G3 reduced to new page only, (3) Content/design updates: change → relevant gate → Web Dev → deploy. Each continuous mode operation is a separate, lighter Inngest function.
- **Alternatives considered:** (a) Pure project mode with updates as new projects (rejected — overkill for a blog post or copy change), (b) No pipeline for continuous ops (rejected — even a blog post should go through Brand Guardian for voice consistency).
- **Impact:** Defines three Inngest functions for continuous mode: `web-motor/blog-post`, `web-motor/new-page`, `web-motor/update`.
- **Status:** Active.

### DEC-221: Blog structure vs blog post content

- **Context:** Clients may want sites with blogs. Need to distinguish between building the blog infrastructure and publishing content into it.
- **Decision:** Blog as CMS structure (templates, categories, listing pages, post template, RSS) is built during project mode as part of the site. It goes through all 3 gates. Blog posts are content published into the existing CMS during continuous mode. A blog post uses a simplified pipeline: Writer (Blog Post skill) → G1 simplified (Brand Guardian, CD only if high-importance) → Designer optional (if custom imagery needed) → publish via CMS. No Gate 2 (design templates already validated) or Gate 3 (CMS already functioning).
- **Alternatives considered:** (a) Every blog post through full pipeline (rejected — massively expensive for routine content, CMS was already validated), (b) Blog posts with zero gates (rejected — at minimum Brand Guardian should verify brand voice on published content).
- **Impact:** Enables efficient content production. Blog posts are one of the cheapest operations (~5-15K tokens).
- **Status:** Active.

### DEC-222: BUILD_ORDER revised — Web Motor replaces Video as Fase 2

- **Context:** The original BUILD_ORDER placed Video Motor as Fase 2 because it was "the hardest orchestration test." However, the founder's immediate need is a website (landing page + email capture) for dogfooding, presencia pública, and applying to startup credit programs. Development priority should follow founder needs, not implementation complexity.
- **Decision:** Web Motor is the new Fase 2 in BUILD_ORDER. Video Motor moves to a later phase (after Analyst + Strategist, or whenever the founder needs it). The Web Motor still validates the same Inngest orchestration patterns: multi-agent pipeline, gates as decision points, 3+3 rule with leader adjustment, parallel evaluation (CD + Brand Guardian), configurable autonomy, and artifact storage on R2. Additionally, Web Motor validates hybrid mode (project → continuous) which Video Motor does not.
- **Alternatives considered:** (a) Keep Video as Fase 2 and add Web later (rejected — delays the founder's ability to dogfood and go to market), (b) Build both in parallel (rejected — solo founder, one motor at a time).
- **Impact:** Changes BUILD_ORDER Fase 2 from Video Motor to Web Motor. Video Motor moves to later phase. The principle shifts from "hardest first" to "founder needs first."
- **Status:** Active. Supersedes BUILD_ORDER Fase 2 definition.

### DEC-223: Gate 3 is mostly technical — system functions + CD visual verification

- **Context:** Gate 3 evaluates the built site. Unlike G1 (creative + textual) and G2 (creative + visual), G3 is about implementation fidelity and technical quality.
- **Decision:** Gate 3 is composed of: (1) System functions — automated QA checks for responsive rendering, performance (Lighthouse), link validation, form functionality, SEO basics (meta tags, sitemap), accessibility (color contrast, alt text, keyboard nav), integration verification (analytics fires, email capture works). (2) Creative Director — visual verification that the implemented site matches the design approved at G2. No Brand Guardian at G3 — brand was validated at G1 (text) and G2 (visual). If something looks off-brand at G3, it means the Web Developer deviated from approved design, which is an implementation fix, not a brand re-evaluation.
- **Alternatives considered:** (a) Full creative evaluation at G3 including Brand Guardian (rejected — redundant, adds cost, brand was already validated), (b) Only automated tests, no CD (rejected — automated tests can't judge visual fidelity; need CD to verify design intent survived code translation).
- **Impact:** G3 is the cheapest gate to run (mostly system functions). CD invocation at G3 is lightweight (visual comparison, not creative direction).
- **Status:** Active.

---

## Session 18b — Testing Strategy & Development Flow (April 9, 2026)

Summary: Formalized the testing strategy and development flow for criteria.agency. Three levels of testing by criticality. Testing integrated into each BUILD_ORDER step, not a separate phase. Development flow documented end-to-end from vision to beta.

### DEC-224: Testing framework — Vitest + Inngest testing toolkit

- **Context:** Need a testing framework compatible with the TypeScript + Hono + Inngest stack. Solo founder needs fast test execution and minimal configuration.
- **Decision:** Vitest for unit and integration tests (TypeScript native, fast, ESM support, compatible with Hono). Inngest testing toolkit for workflow function validation. No Cypress/Playwright until Fase 5 (no UI exists). No Jest (Vitest is the modern TypeScript-native successor).
- **Alternatives considered:** (a) Jest (rejected — requires more configuration for ESM/TypeScript, Vitest is faster and native), (b) No framework, manual testing only (rejected — critical tests must be automated and repeatable), (c) Playwright from day one (rejected — no UI until Fase 5, premature).
- **Impact:** Vitest added to approved stack. Test files colocated with source code (`*.test.ts`). Inngest testing toolkit for workflow validation.
- **Status:** Active.

### DEC-225: Three levels of testing by criticality

- **Context:** Solo founder with $0 cannot afford to write tests for everything, but cannot afford security bugs either. Need a principled framework for what gets tested and how.
- **Decision:** Three levels:

  **Level 1 — Security (automated, mandatory, blocks deploy).** Tests where failure means data exposure or contract violation. Written BEFORE the code (test-first — they define the security contract). Includes:
  - Tenant isolation: query with tenantId A returns zero data from tenantId B
  - Auth middleware: unauthenticated request → 401, authenticated as org A cannot access org B
  - AI provider tier enforcement: agent with data_sensitivity=A cannot invoke Tier B/C provider
  - Inngest security: unsigned webhook → rejected, invalid Zod schema → rejected, nonexistent tenantId → rejected
  - Prompt registry tier check: prompt with data_sensitivity=A only allows approved_providers=[anthropic]

  **Level 2 — Pipeline (automated after manual validation, regression safety net).** Tests that verify end-to-end flow. Written AFTER the BUILD_ORDER validation passes manually. They are the "Validate" criteria from BUILD_ORDER converted into automated tests. Includes:
  - Motor pipeline end-to-end: brief in → delivered output
  - Gate routing: pass → advance, fail → iterate, 3+3 rule counter increments, human escalation after attempt 6
  - Brand Guardian evaluation: pass/warning/fail routing
  - Prompt registry: change prompt in DB → next invocation uses new prompt
  - Cross-motor events: event dispatched by motor A → received by motor B
  These run as regression when infrastructure code changes.

  **Level 3 — Not tested (conscious savings, not technical debt).** Includes:
  - LLM output quality (fragile, changes with every prompt tweak — quality is evaluated by gates, not tests)
  - UI (no UI until Fase 5; when it exists, manual testing first)
  - Performance and load (0 users, premature optimization)
  - Trivial business logic (helpers, formatters — TypeScript compiler catches most issues)
  - System prompt content (managed in prompt_registry, evaluated by human + gates)

- **Alternatives considered:** (a) Full TDD everything (rejected — too slow for solo founder, most value is in Level 1), (b) No automated tests, only manual (rejected — regression bugs in tenant isolation are catastrophic and silent), (c) Test LLM outputs with golden files (rejected — LLM output is non-deterministic, gates are the quality mechanism).
- **Impact:** Level 1 tests exist before code. Level 2 tests accumulate as BUILD_ORDER progresses. Level 3 stays untested until team size or user count justifies it.
- **Status:** Active.

### DEC-226: Testing integrated into BUILD_ORDER steps, not a separate phase

- **Context:** Testing is often treated as a phase that happens after implementation. This creates a false sense of progress (code written but untested) and makes bugs more expensive to find.
- **Decision:** Testing is part of each BUILD_ORDER step, not a separate phase. The development cycle per step is:
  1. Read the relevant spec
  2. Write Level 1 tests if the step involves security (tenant isolation, auth, tier enforcement)
  3. Implement the code
  4. Run Level 1 tests — must pass before proceeding
  5. Validate manually per BUILD_ORDER criteria
  6. Debug if validation fails, iterate steps 3-5
  7. Convert the manual validation into a Level 2 automated test
  8. Advance to next step

  At the end of each fase, run all Level 1 + Level 2 tests as regression (verify previous fases still work). Fase 7 (Hardening) includes a comprehensive security test battery, but this is verification, not the first time things are tested.

- **Alternatives considered:** (a) Separate testing phase after each fase (rejected — delays feedback, makes bugs more expensive), (b) Only test at the end in Fase 7 (rejected — catastrophic; would find fundamental issues after months of building on top of them).
- **Impact:** Every BUILD_ORDER step now has an implicit testing cycle. CI runs all Level 1 + Level 2 tests before deploy.
- **Status:** Active.

### DEC-227: Development flow formalized — vision to beta in 12 steps

- **Context:** The development flow for criteria.agency had been implicit. Need to make it explicit so that each session (whether in Cowork thinking or Claude Code implementing) knows where it fits in the overall process.
- **Decision:** The complete development flow for criteria.agency:
  1. **Vision and concept** — what is criteria.agency, for whom, what does it do
  2. **Architecture** — motors, agents, taxonomy, communication patterns
  3. **Detailed specs** — per motor/component: pipeline, gates, agents, skills, token economics
  4. **Transversal decisions** — stack, security, business model, growth strategy
  5. **Implementation plan** — BUILD_ORDER with steps and validation criteria
  6. **Implementation + Testing + Debugging** — per step, iterative cycle (DEC-226)
  7. **Dogfooding** — founder runs own Brand DNA and builds own website using the platform
  8. **Public presence** — landing page live with email capture + blog, build-in-public starts
  9. **Credit applications** — Anthropic, Google, Cloudflare with real product to demonstrate
  10. **Continued construction** — remaining fases (Analyst, Strategist, Admin UI, MARA, Client Portal)
  11. **Hardening pre-beta** — security audit, legal docs, CI/CD, comprehensive test battery
  12. **Beta** — first 5-10 paying clients

  Steps 1-5 are complete (223+ decisions, 13+ specs, BUILD_ORDER approved). Step 6 begins with Fase 0, Step 0.1.

- **Alternatives considered:** Not applicable — this is documentation of the actual flow that emerged organically through 18 design sessions.
- **Impact:** Provides a map for any session to locate itself in the overall process. Steps 7-9 are the founder's personal milestones before the product is ready for external users.
- **Status:** Active.

---

## Session 19 — April 9, 2026: Infrastructure Setup — Vendor Swap

### DEC-228: Langfuse replaces Helicone for LLM observability

- **Context:** During Fase 0 infrastructure setup, attempted to create a Helicone account and found that Helicone was acquired by Mintlify and new signups were permanently disabled. This breaks DEC-147 (Helicone as proxy-based observability) and DEC-150 (Helicone risk management). A replacement observability tool must be chosen before Fase 0 can continue.
- **Decision:** **Langfuse** replaces Helicone as the LLM observability layer for criteria.agency. Free tier: 50K observations/month (5x Helicone's 10K). Open source with optional self-hosting (enables future enterprise-grade data residency). Integration via Vercel AI SDK wrapper in a centralized helper (`lib/ai/llm.ts`) rather than a URL proxy — all 29 agents instrument through one helper, consistent with the prompt_registry access pattern in DEC-145.
- **Pattern change:** DEC-147 specified **proxy-based** instrumentation (change `baseURL`, zero code contamination). DEC-228 shifts to **SDK-wrapper-based** instrumentation (centralized helper that every agent uses). The trade-off: loses the "one-line change" elegance, gains (a) a natural place to also enforce prompt_registry reads (DEC-145), (b) tier enforcement hook for Tier A/B/C providers (DEC-149), and (c) better hierarchical tracing that spans entire Inngest pipelines. The helper becomes a single choke point for all LLM calls — this is arguably cleaner than a transparent proxy for a multi-tier, multi-tenant system.
- **Cost visibility requirement preserved:** Langfuse tracks tokens, cost, and latency per agent per tenant per month — the original requirement of DEC-147 that validates the token economy (DEC-100) is unchanged.
- **Tier A data handling:** Same confidentiality concern as Helicone — the vendor sees prompts and outputs of confidential agents (Brand Builder, Strategist, Analyst Diagnostic, MARA). Mitigation: Langfuse is listed as a sub-processor in the DPA with sensitivity-level controls. If a future enterprise client rejects Langfuse Cloud, self-hosted Langfuse (docker) is the fallback — this was not a viable option with Helicone.
- **Alternatives considered:**
  - **Portkey** — closest drop-in replacement for the proxy pattern. Rejected because Langfuse's larger ecosystem and open-source nature reduce vendor-lock risk, and the SDK-wrapper pattern is cleaner given the existing prompt_registry helper.
  - **LangSmith** — deeply tied to LangChain, which is not in the stack. Rejected on ecosystem fit.
  - **Self-host from day one** — operational cost too high for a solo-founder bootstrap. Deferred as fallback path.
- **Impact on existing specs:** All references to "Helicone" in other docs (TECH_ARCHITECTURE.md, SESSION_CONTEXT.md, security-audit-v2, web-motor-design, video-motor-design, growth-strategy, transversal-agents-design, BUILD_ORDER, BUILD_TRACKER, PORTAL_SPECS, step-0.1-project-scaffold plan) are now superseded by this DEC. The core files (CLAUDE.md, SESSION_CONTEXT.md, TECH_ARCHITECTURE.md) are updated in-place in this session. Other specs retain the historical "Helicone" text but should be read as "the LLM observability layer per DEC-228."
- **Implementation note:** The env var name changes from `HELICONE_API_KEY` to `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` + `LANGFUSE_HOST` (Langfuse uses a public/secret key pair rather than a single token, plus a host URL since self-hosting is supported).
- **Status:** Active.

### DEC-229: Gate evaluator agent named "director" (not "showrunner")

- **Context:** DEC-184 eliminated the Showrunner and assigned gate evaluation within the Video Motor to "the Director." The initial implementation used `agentId: 'showrunner'` in pipeline.ts and seed.ts because the naming was never formally resolved. Before the first manual validation run, the naming needed to be decided.
- **Decision:** The gate evaluator agent is named **`director`** (`agentId: 'director'` in prompt_registry and all pipeline references). Rationale: (1) the name reflects what the agent actually does — directs the piece end-to-end and decides if each gate passes, which is the natural role of a film/video director; (2) "showrunner" now semantically belongs to the Creative Director's campaign-level function (DEC-184), so reusing it at the piece level creates conceptual confusion; (3) `director` is legible in the Admin Portal if the agent is ever surfaced to users.
- **Alternatives considered:** Keep `showrunner` as agentId (rejected — conflicts with DEC-184's reassignment of the showrunner function to the CD; creates ambiguity in the DB when campaign-level coherence is later implemented).
- **Impact:** Rename in pipeline.ts (types, function names, agentId strings), seed.ts (5 prompt entries), agent-registry.ts, and mock files. Logic unchanged — same Opus Tier A model, same 3+3 rule, same escalation to CD.
- **Status:** Active. Supersedes the implicit `showrunner` naming in the Fase 2 implementation.

---

## Pending Decisions

- **Analyst threshold calibration** — initial values for anomaly detection thresholds (>20% deviation, >N consecutive points). Conservative start, tune empirically
- **Multi-brand analytics** — per-brand dashboards + cross-brand consolidated view for Agency tier clients
- Skill registry design (how agents discover and load skills)
- ~~Testing strategy (what to test, coverage targets, testing frameworks)~~ → Resolved in DEC-224, DEC-225, DEC-226
- CI/CD pipeline design (deployment flow, environments, rollback)
- School curriculum structure (CriteriaFilms AI filmmaking school)
- Deployment environment setup (staging, production)
- Mobile/responsive design for Funnel Matrix
- ~~Brand health score calculation weights and algorithm~~ → Resolved in Analyst Motor Design §11 (equal 33/33/33, Strategist interprets priority)
- Onboarding URL analysis: sync vs async processing
