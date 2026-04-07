# criteria.agency — MVP Roadmap

> Last updated: April 7, 2026
> Phases: 3 | Total agents: 47 video + ~78 platform = ~125
> Capabilities: 49 (4 Beta, 5 Alpha, 37 En desarrollo, 3 Roadmap)
> Status: Active — Phase 1 complete (video pipeline), Phase 2 planning

---

## Rollout philosophy

The system launches in 3 phases. Each phase must prove itself before advancing to the next.

**Principle:** A working system with 20 agents producing real videos is infinitely more valuable than a design for 125 agents that hasn't been tested.

**Capability-first prioritization:** Phases are defined by **client value delivered** (capabilities), not by agent count. The Capabilities Map (`docs/superpowers/specs/2026-04-07-capabilities-map-design.md`) defines 49 capabilities organized by client pain points. Each phase targets a specific tier of client.

### How capabilities relate to phases

```
Phase 1 (DONE):  Video pipeline → 9 capabilities partially active
Phase 2 (NEXT):  Tier PyME viable → 14 critical capabilities for smallest clients
Phase 3 (LATER): Tier Mediana viable → full distribution + sales + measurement
```

See the Capabilities Map for the full dolor→capacidad→motor hierarchy.

---

## Phase 1: Foundation (20 agents) — COMPLETE

**Goal:** Produce a corporate/explainer video (1-3 minutes) end-to-end using the agentic pipeline.

**Capabilities activated (partially):**
- C-009 Producción de video end-to-end (🟡 Beta)
- C-011 Copywriting especializado (🟠 Alpha — solo guiones AV)
- C-013 Producción de audio (🟠 Alpha — solo dentro de video)
- C-018 Email marketing (🟠 Alpha — nurture sequence básica)
- C-033 Dashboard ejecutivo unificado (🟠 Alpha — solo financiero)
- C-039 Control de gasto por campaña (🟠 Alpha — control financiero básico)
- C-044 Equipo virtual escalable (🟡 Beta — 20/125 agentes)
- C-045 Autonomía configurable (🟡 Beta — gates en video)
- C-047 Gates de calidad humanos (🟡 Beta — 5 gates en video)

### Agents active

| ID | Agent | Role in Phase 1 |
|----|-------|-----------------|
| TL-001 | Project manager | Orchestrates timeline and resources |
| TL-002 | Showrunner | Guards quality via gates G2, G3, G5 |
| TL-003 | Producer | Breakdown, assets, logistics |
| T1-L | Creative director | Concept, creative direction, brief guidance |
| T2-L | Head writer | Directs writing, assigns format |
| T2-002 | AV copywriter | Writes two-column AV scripts (corporate/explainer) |
| T2-006 | Script doctor | Reviews and improves scripts |
| T3-L | Director of photography | Shot specs, storyboard previews |
| T3-003 | Cinematic prompt engineer | Translates specs to AI prompts, generates video |
| T5-L | Sonorizador | VO, music, editorial SFX |
| T6-L | Editor | Assembles timeline, creates cuts |
| T6-003 | Delivery master | Multi-format export and packaging |
| T7-L | Client service | Client communication and feedback |
| XF-001 | Cinematographic critic | Quality scoring and enforcement |
| T9-L | AI Model Director | Defines model strategy, selects AI models per task |
| T9-001 | Text Model Specialist | LLM expertise, prompting guides, cost tracking |
| T9-002 | Image Model Specialist | Image model expertise, style control, consistency techniques |
| T9-003 | Video Model Specialist | Video model expertise, movement control, camera vocabulary per model |
| T9-004 | Audio Model Specialist | Audio model expertise, voice/music/SFX generation guides |
| T9-005 | Model Benchmarker | Cross-model benchmarks, A/B testing, quality scoring |

### Gates active

| Gate | Active | Notes |
|------|--------|-------|
| G1 (post-concept) | Simplified | Showrunner reviews concept but no formal project bible yet — a lightweight version instead |
| G2 (post-script) | Full | First formal quality gate |
| G3 (post-storyboard) | Full | Last cheap correction point |
| G4 (first cut) | Simplified | Showrunner reviews but without full cross-functional evaluation |
| G5 (final cut) | Full | Only XF-001 (critic) provides formal evaluation; compliance and brand checks are manual |

### What's NOT in Phase 1

- No project researcher (creative director handles brief enrichment manually)
- No casting director (character consistency managed by prompt engineer)
- No narrative structuralist (head writer creates structure directly)
- No specialized writers beyond AV copywriter (no fiction, documentary, explainer specialist)
- No pre-production colorist (DP handles color direction)
- No camera movement director (DP handles movement)
- No art & design team (no compositing, VFX, or continuity supervision)
- No sound designer or foley artist (sonorizador handles all audio)
- No post colorist or subtitler (editor handles basic grading, subtitles if needed)
- No operations team (manual billing, contracts, infrastructure)
- No onboarding specialist or feedback interpreter (client service handles both)
- No compliance, brand guardian, or accessibility checks (manual)
- No AI filmmaking tutor (school not active)

### Target project types

- Corporate explainer videos (1-3 minutes)
- Social media content (15-60 seconds)
- Simple brand videos

### Advance criteria (all must be met to move to Phase 2)

- [ ] 3 projects completed end-to-end through the pipeline
- [ ] Average cinematographic critic score > 6/10
- [ ] At least 1 project approved by a real client on first delivery
- [ ] Pipeline runs without manual intervention between gates (agents hand off to each other)
- [ ] Average brief-to-delivery time < 7 calendar days for a 2-minute video
- [ ] All 20 agents demonstrably functional and producing useful output

---

## Phase 2: Tier PyME Viable (+10 video agents + Strategy/Brand motors)

**Goal:** Make criteria.agency usable for a small business client. This means solving the #1 pain point ("No tengo estrategia") AND expanding video quality. A PyME client should be able to: get a marketing diagnosis, build their brand, produce content, and see results in a dashboard.

**New capabilities to activate:**
- C-001 Diagnóstico de marketing (CRÍTICA — dolor #1)
- C-002 Plan de marketing completo (CRÍTICA)
- C-003 Definición de audiencias (CRÍTICA)
- C-006 Construcción de marca desde cero (CRÍTICA)
- C-007 Guardián de marca (CRÍTICA)
- C-010 Diseño gráfico on-demand (ALTA)
- C-012 Desarrollo web (ALTA)
- C-017 Community management (ALTA)
- C-048 Diagnóstico y definición de posicionamiento (CRÍTICA)

**Video pipeline expansion (original Phase 2 goal preserved):**
Expand project types to include more complex corporate work and first documentary/short film attempts. Activate full quality gate system.

### New agents added

| ID | Agent | Why now |
|----|-------|---------|
| T1-001 | Project researcher | Brief enrichment improves concept quality |
| T1-002 | AI casting director | Character consistency for narrative projects |
| T2-001 | Narrative structuralist | Complex projects need formal structure |
| T2-005 | Explainer writer | Dedicated specialist for educational content |
| T3-001 | Pre-production colorist | Formal color system improves visual consistency |
| T3-002 | Camera movement director | Purposeful camera movement for complex projects |
| T6-001 | Post colorist | Professional color grading across clips |
| T6-002 | Subtitler / localizer | Multi-language delivery capability |
| XF-002 | Content compliance | Formal compliance checks for client protection |
| XF-003 | Brand guardian | Automated brand consistency enforcement |

### Changes from Phase 1

- All 5 gates fully active with formal reviews
- Cross-functional agents XF-002 and XF-003 participate in G5
- Pre-production colorist establishes color system before production
- Camera movement director adds narrative-purposeful movement
- Post colorist unifies grading across all clips

### Target project types

- Complex corporate videos (multiple scenes, characters)
- Explainer and educational content (tutorials, onboarding)
- First documentary attempts (5-10 minutes)
- First narrative short film attempts

### Advance criteria

**Video pipeline:**
- [ ] 10 total projects completed (cumulative)
- [ ] Average critic score > 7/10
- [ ] Client first-attempt approval rate > 60%
- [ ] At least 1 documentary or short film completed
- [ ] Compliance and brand checks automated (no manual intervention)
- [ ] Average brief-to-delivery time < 5 calendar days for corporate/explainer

**Platform capabilities (NEW):**
- [ ] 1 real PyME client has completed onboarding (Brand DNA + Marketing Plan)
- [ ] Brand Guardian actively validating outputs across video + design
- [ ] Dashboard showing marketing KPIs (not just financial)
- [ ] At least 5 capabilities at 🟡 Beta or higher

---

## Phase 3: Tier Mediana Viable (+17 video agents + Distribution/Sales/Analytics motors)

**Goal:** Activate all video agents AND distribution, sales, and measurement capabilities. Support all project types including fiction, documentary, and school. A mediana company should be able to: run campaigns across channels, track leads, measure ROI, and see everything in one dashboard.

**New capabilities to activate:**
- C-004 Análisis competitivo
- C-005 Generación de briefs de campaña
- C-016 Gestión de pauta digital
- C-018 Email marketing (upgrade a producción completa)
- C-019 SEO y contenido orgánico
- C-028 Captura y enriquecimiento de leads
- C-029 Lead scoring automático
- C-030 Pipeline de ventas
- C-034 Atribución multicanal
- C-035 Cálculo automático de CAC y LTV
- C-036 Reportes automatizados
- C-038 Asignación inteligente de presupuesto
- C-023 Escucha de marca
- C-026 Monitoreo competitivo continuo

**Video pipeline expansion (original Phase 3 goal preserved):**
Activate all video agents. Support all project types including fiction, documentary, and school. Prepare for scale.

### New agents added

| ID | Agent | Why now |
|----|-------|---------|
| T2-003 | Fiction writer | Fiction/narrative project support |
| T2-004 | Documentary writer | Dedicated documentary specialist |
| T4-L | Typographer / motion graphics | Professional titles and graphics |
| T4-001 | Compositor / VFX | Multi-layer composition and cleanup |
| T4-002 | Continuity supervisor | Automated raccord checking |
| T5-001 | Sound designer (atmospheres) | Spatial audio and ambient layers |
| T5-002 | Foley artist | Frame-accurate synchronized SFX |
| T7-001 | Onboarding specialist | Automated client onboarding |
| T7-002 | Feedback interpreter | Automated feedback translation |
| T7-003 | AI filmmaking tutor | School launch (business model 3) |
| T8-L | Financial manager | Automated financial management |
| T8-001 | Accountant | Automated invoicing and accounting |
| T8-002 | Legal | Automated contract generation |
| T8-003 | CTO | Infrastructure and model management |
| T8-004 | AI cost estimator | Per-project cost estimation |
| T8-005 | Performance analyst | Production analytics and optimization |
| XF-004 | Accessibility specialist | Automated accessibility checks |

### Target project types

- Fiction short films
- Full documentaries (10-30 minutes)
- Series (multiple episodes)
- AI filmmaking school courses
- All project types with full quality pipeline

### Advance criteria

**Video pipeline:**
- [ ] 25 total projects completed (cumulative)
- [ ] At least 1 fiction short film completed
- [ ] School beta launched with 10+ students
- [ ] Operations team functional (automated billing, contracts)
- [ ] System running without human intervention for standard projects
- [ ] Average brief-to-delivery time improving quarter over quarter

**Platform capabilities (NEW):**
- [ ] 5 Mediana clients active with full distribution + measurement
- [ ] CAC and LTV calculated for at least 3 clients
- [ ] At least 1 client running paid campaigns through the platform
- [ ] At least 20 capabilities at 🟡 Beta or higher
- [ ] 0 capabilities still at 🔴 in the Tier PyME set

---

## Agent count note

The original documentation states 38 agents. A careful count of the agent registry reveals 41 distinct agents (3 top-level + 34 in teams + 4 cross-functional). This discrepancy existed in the original docs. With the addition of Team 9 — AI Model Intelligence (6 agents: T9-L, T9-001 through T9-005), the correct total is now 47. Phase distribution: 20 (Phase 1: 14 original + 6 Team 9) + 10 (Phase 2) + 17 (Phase 3) = 47.

---

## Pilot project: First end-to-end test

**Type:** 2-minute corporate explainer video

**Client:** Internal (CriteriaFilms produces a video about its own service) or simulated external client

**Why this type:**
- Exercises the most common project type (business model 1)
- Uses AV copywriter (Phase 1 writer)
- Moderate complexity — enough to test the pipeline without fiction/documentary complications
- Has a real deliverable — can be used on criteriafilms.com

**Success criteria:**
- [ ] All 20 Phase 1 agents participated in production
- [ ] 3 gates (G2, G3, G5) were passed
- [ ] Cinematographic critic scored > 6/10 average
- [ ] Video is watchable and professional quality
- [ ] Total production time < 48 hours (AI processing)
- [ ] Pipeline data captured (times per step, iteration counts, costs)
- [ ] Team 9 provides model selection recommendations for video and image generation

**What to measure during pilot:**
- Time per pipeline step
- Number of iterations at each gate
- Which agents needed most human intervention
- Total API cost (tokens, credits, compute)
- Subjective quality assessment by the founder

---

## Related documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — 9 teams, chain of command, communication protocols (47 agents)
- `AGENT_REGISTRY.md` — Technical reference cards for all 47 agents
- `PRODUCTION_PIPELINE.md` — Step-by-step production flow with gates
- `TECH_ARCHITECTURE.md` — Technical stack and implementation
- `PORTAL_SPECS.md` — Portal design specifications
- `DECISION_LOG.md` — Chronological log of all key decisions
- `docs/superpowers/specs/2026-04-07-capabilities-map-design.md` — **Capabilities Map: 62 pain points → 49 capabilities → 24 motors** (defines what each phase must deliver in client value)
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — 24-motor technical architecture
- `MVP_ROADMAP.md` — This document: phased rollout plan
