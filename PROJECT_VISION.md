# criteria.agency — Project Vision

> Last updated: April 7, 2026
> Status: Active — Phase 1 complete, Phase 2 planning

---

## Identity

- **Name:** criteria.agency
- **Type:** AI-powered marketing agency platform (SaaS)
- **Core promise:** Complete marketing automation through specialized AI agents, controlled by human experts
- **Target market:** Small-to-medium businesses in Latin America
- **Domain:** criteria.agency

---

## Mission

Build a fully automated marketing agency platform powered by ~28 specialized AI agents (+ skills + system functions) organized in 24 motors, where every marketing function — from brand strategy to content creation to distribution to measurement — is orchestrated by AI but always controllable and overridable by human experts.

---

## Platform Structure

### The Hierarchy: Pain → Capability → Motor → Agent

The platform is organized around **client pain points**, not technology:

```
Client Pain Points (62 identified, open inventory)
  └── Capabilities (49 — what criteria.agency CAN DO for the client)
        └── Motors (24 — technical infrastructure that serves capabilities)
              └── Agents (~28) + Skills + System Functions
```

- **Pain points** are discovered from real client conversations. They drive prioritization.
- **Capabilities** are the product — named from the client's perspective (e.g., "Diagnóstico de marketing", not "Strategist pipeline step 1").
- **Motors** are infrastructure — they serve one or more capabilities.
- **Agents** are workers — they execute within motors.

A single capability may require multiple motors (e.g., "Plan de marketing completo" needs Strategist + Financial Agent + Channel Manager + Brand Guardian). A single motor may serve multiple capabilities (e.g., Brand Guardian serves both "Guardián de marca" and "Gates de calidad").

> See `docs/superpowers/specs/2026-04-07-capabilities-map-design.md` for the full mapping.

### 24 Motors in 6 Categories — ~28 Agents

| Category | Motors | Agents | What They Do |
|----------|--------|--------|-------------|
| **Creation** | Video, Design, Web, Audio, Events, Print Production | 12 | Produce all types of content and experiences |
| **Strategy** | Brand Builder, Strategist | 1 (+Strategist as transversal) | Define brands from scratch and plan marketing strategies |
| **Intelligence** | Listener (×4 instances) + Opportunity Agent | 2 | Monitor everything, detect communication opportunities |
| **Distribution** | Paid Media, Owned Channels | 2 | Execute on all channels (paid, owned, earned) |
| **Operation** | Sales/CRM, Analytics | 3 | Manage leads and measure everything |
| **Transversal** | Creative Director, Showrunner, Strategist, Brand Guardian, Financial Agent, Channel Manager, Media Scout | 7 | Cross-motor services supporting the entire platform |
| **Security** | Security Analyst | 1 | Risk assessment + automated system functions |

### Agent Architecture (DEC-064)
Not everything is an agent. The platform distinguishes agents (judgment, ~28), skills (expertise loaded by agents), and system functions (automated infrastructure). See TEAM_STRUCTURE.md.

### Shared Orchestration Framework
All motors share the same orchestration framework but define their own:
- Pipeline steps and quality gates
- Agent skills loaded per task type
- Escalation rules (3+3 rule: 3 attempts → agent adjusts → 3 more → human)
- Lifecycle mode (Project, Continuous, or Hybrid)
- Configurable autonomy level

---

## Business Units

### criteria.agency (the platform)
The SaaS product itself. Sells access to AI marketing motors via subscription tiers (Free/Pro/Enterprise).

### CriteriaFilms.com (first client)
AI-powered film and video production studio. Uses criteria.agency's Video motor + Marketing motors. CriteriaFilms.com is a marketing asset produced by the platform's Web motor — it has its own domain but lives internally as a campaign asset.

**CriteriaFilms business models:**
1. **Production service** (Priority 1) — Video production for businesses. 20 years experience.
2. **Own productions** (Priority 2) — Films and documentaries for specific niches.
3. **AI filmmaking school** (Priority 3) — Teach people to produce films with AI.

### criteria.agency as its own client (dogfooding)
Uses Marketing + Sales motors to market itself and acquire new SaaS clients.

---

## SaaS Business Model

> Full spec: `docs/superpowers/specs/2026-04-08-business-model-design.md`

### Four Revenue Streams

1. **Subscription** ($99-599/month) — platform access + included tokens + features per tier
2. **Token overage** — usage-based billing for production beyond included tokens
3. **Ad spend commission** (10-20%) — client deposits ad budget upfront, criteria.agency executes
4. **Professional services** — workshops (pre-recorded $29-99, live with experts $500-2,000)

### Token Economy

Universal consumption unit. The brain is free (Strategist, Creative Director, Brand Guardian, Copilot — all included in subscription). The hands cost tokens (image generation, video generation, emails sent, reports produced). criteria.agency's margin is the spread between token sale price and internal AI production cost.

### Subscription Tiers

| Tier | Price | Target | Tokens | Users | Brands | Ad Commission |
|------|-------|--------|--------|-------|--------|---------------|
| **Starter** | $99/month | Emprendedor / freelancer | 15,000 | 2 | 1 | 20% |
| **Pro** | $249/month | PyME with team | 75,000 | 10 | 3 | 15% |
| **Agency** | $599/month | Agencies / multi-brand | 300,000 | Unlimited | Unlimited | 10% |

Agency tier includes full **white-label** — agency's clients see the agency's brand, not criteria.agency.

### Unit Economics (target)

85% gross margin on Starter, 79% on Pro, 80% on Agency. 100-client mix generates ~$29,500/month operating profit.

### No free tier. Invitation-only trial (14 days, 2,000 tokens).

### Client Portal Navigation (no sidebar — dual view)

> Full spec: `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md`

**No sidebar.** Two main views with toggle: Grid de Campanas (Home — create, define, iterate) and Funnel Matrix (execute, monitor, optimize). Both occupy the full screen. All other access via header dropdowns.

**Header:** Logo | Search (Cmd+K) | Tools | Compass (intelligence) | Bell (notifications) | Avatar

**Campaign hierarchy:** Campana (thematic concept) → Version (creative angle by Creative Director) → Activacion (cell in Funnel Matrix) → Pieza (content by motors).

**Transversal creative agents:** Creative Director (proposes versions, defines creative direction across all motors), Showrunner (validates campaign-level coherence, feeds Campaign Score), Strategist (continuous: evaluate → design → execute → measure → adjust).

**Tools dropdown:** Studio, CRM, Research, Marketplace, Drive, Reportes

**Compass dropdown:** Strategic intelligence feed from Listeners. Surface of Research tool.

**Bell dropdown:** Operational notifications (approvals, leads, budget alerts, Brand Guardian flags).

**Avatar dropdown:** Mi Negocio (brand, model, audiences, products, value proposition, revenue, markets, objectives), Mi Cuenta (plan, billing, team), Settings (integrations, autonomy, copilot, notifications, preferences).

**AI Copilot:** Chat bubble — natural language control for everything the visual interface does. Configurable proactivity.

**Brand Health Score:** Always-visible global score with 3 axes: Fundamentos (¿Estoy listo?), Ejecución (¿Lo estoy haciendo bien?), Oportunidad (¿Estoy haciendo lo suficiente?). Campaign Score per campaign feeds into Ejecución axis.

**Key principle:** Motors surface contextually within campaigns (step 4: pieces), not in navigation. Sales lives in Conversion/Retention columns of the matrix. Creation motors appear when a campaign needs them.

---

## Key Performance Indicators

### Platform (criteria.agency)
- Monthly Recurring Revenue (MRR)
- Active clients by tier
- Client retention rate (monthly/annual)
- Motor utilization rate (which motors are most used)
- Agent execution cost vs revenue ratio
- Client satisfaction (NPS)

### Per Client
- Projects completed per month
- Average brief-to-delivery time
- First-attempt approval rate (gate pass rate)
- Cost per deliverable
- Channel performance (by funnel stage)
- ROI on marketing spend

---

## Competitive Positioning

| vs. | criteria.agency Advantage |
|-----|--------------------------|
| Traditional agencies | Same quality at fraction of time and cost. AI motors work 24/7, no human bottlenecks. |
| Pure AI tools (ChatGPT, Canva AI, etc.) | Structured pipelines with quality gates + human oversight. Not just generation — full agency service from strategy to measurement. |
| Marketing automation (HubSpot, Mailchimp) | AI agents that CREATE content, not just distribute it. Full creative + strategic + distribution stack. |
| Freelancer marketplaces (Fiverr, Upwork) | Integrated system of ~28 specialized agents with skills + quality gates + scalability. Not individual freelancers — a system. |

---

## 3 Portals

### Public Portal
criteria.agency marketing site: landing page, motor/feature overview, pricing, onboarding.
CriteriaFilms.com: marketing asset generated by web motor, separate domain.

### Client Portal
No sidebar. The Funnel Matrix (channels × funnel stages) is the Home and primary interface. Header with dropdowns: Tools (Studio, CRM, Research, Marketplace, Drive, Reportes), Compass (intelligence), Bell (notifications), Avatar (Mi Negocio, Mi Cuenta, Settings). AI Copilot as chat bubble for natural language control. Brand Health Score always visible. Motors surface contextually within campaigns. Enterprise clients get human Account Executive overlay. Full spec: `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md`.

### Admin Portal
Mission Control for the entire platform. Real structure visibility (24 motors organized by category). Agent monitoring, gate reviews, model management, security center, backoffice modules (admin role only: finance, accounting, HR, internal projects, client management, internal analytics).

---

## Immutable Principles

1. **Absolute quality over speed.** Every output must meet professional standards. No shortcuts.
2. **AI automated but human controllable.** Every agent can be overridden, paused, or replaced by a human expert at any point.
3. **Hyper-specialization.** Each agent does one thing exceptionally well, rather than many things acceptably.
4. **Fluid human-AI substitution.** Any agent can be replaced by a human without changing the system structure.
5. **Quality gates prevent expensive mistakes.** Gates catch problems when they're cheap to fix, not after content is published.
6. **GDPR-first data protection.** Every data decision assumes the strictest standard. Client data is sacred.
7. **Client simplicity over system complexity.** Clients see campaigns, versions, and pieces — not motors and agents. The 24 motors and ~28 agents are invisible to them.

---

## Related Documents

- `TECH_ARCHITECTURE.md` — Technical stack, data model, communication architecture
- `TEAM_STRUCTURE.md` — Video motor teams, chain of command (needs expansion for other motors)
- `AGENT_REGISTRY.md` — Technical reference cards for Video motor agents (needs registries for other motors)
- `PRODUCTION_PIPELINE.md` — Video pipeline: 10 steps, 5 gates
- `MVP_ROADMAP.md` — Video motor phased rollout
- `PORTAL_SPECS.md` — UI/UX spec for Public + Admin portals (Client Portal superseded)
- `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md` — **Client Portal navigation: Funnel Matrix Home, no sidebar, Brand Health Score**
- `DECISION_LOG.md` — All key architectural decisions
- `SESSION_CONTEXT.md` — Complete project briefing
- `docs/superpowers/specs/2026-04-07-capabilities-map-design.md` — **Capabilities Map: 62 pain points → 49 capabilities → 24 motors**
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — 24-motor architecture spec
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Security framework spec
