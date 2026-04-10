# criteria.agency — Spec Index

> Last updated: April 9, 2026
> Purpose: Identifies which specs are authoritative for implementation vs. superseded or post-MVP.
> Rule: If a spec is not marked AUTHORITATIVE below, do NOT use it for implementation decisions.

---

## AUTHORITATIVE — Use these for implementation

These are the definitive specs referenced in `CLAUDE.md`. Read the relevant one BEFORE implementing any component.

| Spec | Covers | DECs |
|------|--------|------|
| `2026-04-09-web-motor-design.md` | **Web Motor (Fase 2):** sites, microsites, landing pages, blogs, product pages. 3 gates, hybrid mode, 4 transversal agents. Replaces Video as Fase 2. | DEC-217 to DEC-223 |
| `2026-04-09-video-motor-design.md` | Video Motor: 10-step pipeline, 5 gates, 6 executor agents + 3 transversals, Inngest orchestration, script sub-pipeline. **Moved to Fase 8 (DEC-222).** | Refs DEC-064, DEC-140, DEC-141, DEC-145, DEC-147-149, DEC-174-177 |
| `2026-04-08-brand-builder-motor-design.md` | Brand Builder motor: layers 0-3, Brand Strategist agent, gates, continuous mode | DEC-074 to DEC-086 |
| `2026-04-08-strategist-motor-design.md` | Strategist motor: 5 skills, triggers, gates, pre-configured campaigns, PI concept | DEC-087 to DEC-101 |
| `2026-04-08-analyst-motor-design.md` | Analyst motor: hybrid (system functions + 1 agent), Brand Health Score, Data Ingestion Layer | DEC-121 to DEC-126 |
| `2026-04-08-platform-intelligence-design.md` | Platform Intelligence: shared infra, K-anonymity, cold start, tiered access | DEC-102 to DEC-120 |
| `2026-04-09-mara-copilot-design.md` | MARA copilot: agent #29, Output Registry, play/pause, routing taxonomy | DEC-127 to DEC-138 |
| `2026-04-08-client-portal-navigation-design.md` | Client Portal: Funnel Matrix, no sidebar, header dropdowns, Brand Health Score | DEC-046 to DEC-063 |
| `2026-04-08-business-model-design.md` | Business model: 3 tiers, token economy, commission model, workshops | DEC-067 to DEC-073 |
| `2026-04-06-marketing-engine-design.md` | All 24 motors: taxonomy, pipelines, agents, gates, cross-motor integration | — |
| `2026-04-06-security-framework-design.md` | Security: threat model, OWASP, auth, encryption, agent sandboxing, compliance | DEC-041 to DEC-045 |
| `2026-04-09-security-audit-v2.md` | Security Audit v2: Inngest, multi-model tiers, MARA hardening, legal requirements | DEC-148 to DEC-172 |
| `2026-04-09-growth-strategy.md` | Growth: startup credits, bootstrapped GTM, CriteriaFilms-first, timeline to 10 clients | — |
| `2026-04-09-transversal-agents-design.md` | Transversal agents MVP: Brand Guardian, Creative Director, Showrunner, Financial Agent/Channel Manager simplifications | DEC-174 to DEC-179 |

---

## USEFUL BUT NOT MVP — Post-MVP motor specs

These specs describe motors that are NOT in the MVP build order. They are architecturally sound but not needed until post-beta. Do not implement these during Fases 0-7.

| Spec | Motor |
|------|-------|
| `2026-04-07-audio-motor-design.md` | Audio motor (Creation) |
| ~~`2026-04-07-web-motor-design.md`~~ | ~~Web motor~~ — **SUPERSEDED by `2026-04-09-web-motor-design.md`** |
| `2026-04-07-events-motor-design.md` | Events motor (Creation) |
| `2026-04-07-graphic-design-engine-design.md` | Graphic Design motor (Creation) |
| `2026-04-07-marketplace-print-design.md` | Marketplace + Print Production motors |
| `2026-04-07-writers-room-design.md` | Writers Room / Copywriting motor |
| `2026-04-07-ads-motor-design.md` | Ads motor (Distribution) |
| `2026-04-07-community-management-design.md` | Community Management motor (Distribution) |
| `2026-04-07-email-marketing-design.md` | Email Marketing motor (Distribution) |
| `2026-04-07-seo-content-design.md` | SEO/Content motor (Distribution) |
| `2026-04-07-channel-manager-design.md` | Channel Manager (Transversal) |
| `2026-04-07-opportunity-agent-design.md` | Opportunity Agent (Intelligence) |
| `2026-04-07-brand-listener-design.md` | Brand Listener (Intelligence) |
| `2026-04-07-culture-listener-design.md` | Culture Listener (Intelligence) |
| `2026-04-07-industry-listener-design.md` | Industry Listener (Intelligence) |
| `2026-04-07-competitive-listener-design.md` | Competitive Listener (Intelligence) |
| `2026-04-07-sales-crm-design.md` | Sales/CRM motor (Operation) |
| `2026-04-07-analytics-design.md` | Analytics motor (Operation) |
| `2026-04-07-financial-motor-design.md` | Financial Agent (Transversal) |
| `2026-04-07-security-team-design.md` | Security Team (Transversal) |

---

## SUPERSEDED — Do NOT use for implementation

These specs were created during earlier design iterations and have been replaced by newer, authoritative specs. They remain in the repo for historical reference only. If any content in these conflicts with an authoritative spec, the authoritative spec wins.

| Spec | Superseded by | Why |
|------|--------------|-----|
| `2026-04-07-strategy-engines-design.md` | `strategist-motor-design.md` + `brand-builder-motor-design.md` | References "17 new agents" — pre-DEC-064 consolidation (~125 → ~29) |
| `2026-04-07-positioning-engine-design.md` | `strategist-motor-design.md` | Positioning is now a Brand Strategist skill, not a separate engine |
| `2026-04-07-analytics-engine-design.md` | `analyst-motor-design.md` | Analytics engine redesigned as Analyst motor (DEC-121) |
| `2026-04-07-budget-engine-design.md` | `strategist-motor-design.md` §Budget | Budget is now part of Strategist Planning skill (DEC-101) |
| `2026-04-07-intelligence-engine-design.md` | `platform-intelligence-design.md` | PI redesigned as shared infrastructure (DEC-092) |
| `2026-04-07-brand-guardian-engine-design.md` | `transversal-agents-design.md` §3 | Brand Guardian redesigned as LLM function with 4 skills (DEC-174) |
| `2026-04-07-security-engine-design.md` | `security-framework-design.md` + `security-audit-v2.md` | Security redesigned as framework, not engine |
| `2026-04-07-sales-engine-design.md` | `sales-crm-design.md` | Naming change: engine → motor |
| `2026-04-07-scale-engine-design.md` | Post-MVP scope | Scale features deferred |
| `2026-04-08-navigation-redesign.md` | `client-portal-navigation-design.md` | Intermediate iteration, superseded same day |
| `2026-04-08-client-portal-design.md` | `client-portal-navigation-design.md` | Earlier version, superseded by final navigation spec |
| `2026-04-07-google-oauth-design.md` | Better Auth (DEC-142) | Stack now uses Better Auth, not Google OAuth directly |
| `2026-04-07-agent-canvas-design.md` | `PORTAL_SPECS.md` §Admin | Agent Canvas concept absorbed into Admin Agent Dashboard |
| `2026-04-07-capabilities-map-design.md` | `marketing-engine-design.md` | Early capability mapping, superseded by 24-motor taxonomy |
| `2026-04-06-real-agents-design.md` | `marketing-engine-design.md` + motor specs | Pre-consolidation agent design |
| `2026-04-06-business-agents-design.md` | Motor-specific specs | Pre-consolidation agent design |
| `2026-04-06-csv-import-dashboard-design.md` | Post-MVP scope | Data import features deferred |
| `2026-04-05-documentation-overhaul-design.md` | Current doc structure | Meta-document, purpose fulfilled |
| `2026-04-06-financial-module-design.md` | `financial-motor-design.md` | Pre-motor architecture naming |
| `2026-04-06-landing-waitlist-design.md` | `growth-strategy.md` §Landing | Landing page strategy updated in growth spec |
| `2026-04-06-gtm-strategy-design.md` | `growth-strategy.md` | GTM strategy fully redesigned |
| `PRODUCTION_PIPELINE.md` (root) | `2026-04-09-video-motor-design.md` | CriteriaFilms-era pipeline, pre-consolidation Teams model, no Inngest/transversals |
| `2026-04-07-writers-room-design.md` | `2026-04-09-video-motor-design.md` §4, §6.1 | Writers Room is now Writer agent with 4 skills |

---

## POTENTIALLY USEFUL — Reference for Fase 0

| Spec | Use for |
|------|---------|
| `2026-04-06-schema-api-design.md` | Has clean-slate DB schema + API contract design for multi-tenancy. Check against BUILD_ORDER.md Fase 0 before using — some details may be outdated |
