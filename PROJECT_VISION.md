# criteria.agency — Project Vision

> Last updated: April 6, 2026
> Status: Active — Specification phase

---

## Identity

- **Name:** criteria.agency
- **Type:** AI-powered marketing agency platform (SaaS)
- **Core promise:** Complete marketing automation through specialized AI agents, controlled by human experts
- **Target market:** Small-to-medium businesses in Latin America
- **Domain:** criteria.agency

---

## Mission

Build a fully automated marketing agency platform powered by ~125 hyper-specialized AI agents organized in 24 motors, where every marketing function — from brand strategy to content creation to distribution to measurement — is orchestrated by AI but always controllable and overridable by human experts.

---

## Platform Structure

### 24 Motors in 6 Categories

| Category | Motors | What They Do |
|----------|--------|-------------|
| **Creation** | Video, Design, Web, Audio, Events, Print Production | Produce all types of content and experiences |
| **Strategy** | Brand Builder, Strategist | Define brands from scratch and plan marketing strategies |
| **Intelligence** | Brand Listener, Culture Listener, Industry Listener, Competition Listener + Opportunity Agent | Monitor everything, detect communication opportunities |
| **Distribution** | Ads, Community Management, Email Marketing, SEO/Content | Distribute content across all channels (paid, owned, earned) |
| **Operation** | Sales/CRM, Analytics | Manage leads and measure everything |
| **Transversal** | Brand Guardian, Financial Agent, Channel Manager, Media Scout, Marketplace, Security Team | Cross-motor services supporting the entire platform |

### Shared Orchestration Framework
All motors share the same orchestration framework but define their own:
- Pipeline steps and quality gates
- Agent teams and roles
- Escalation rules (3+3 rule: 3 attempts → leader adjusts → 3 more → human)
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

### Subscription Tiers

| Tier | Access | Support | Price Range |
|------|--------|---------|-------------|
| **Free** | Limited motors, basic features, AI Copilot | Self-service | $0 |
| **Pro** | All motors, full features, AI Copilot | Self-service + priority support | $500-$5,000/month |
| **Enterprise** | All motors + human Account Executive + custom integrations | Dedicated support | Custom |

### 6 Client Spaces (outcome-based navigation)
Clients navigate by outcomes, not by the 24 motors underneath:

| Space | Outcome | Motors Behind |
|-------|---------|--------------|
| **Crear** | "I need content" | Video, Design, Web, Audio, Events, Print |
| **Comunicar** | "I need to reach people" | Ads, Community Management, Email, SEO/Content |
| **Entender** | "I need to understand my market" | 4 Listeners, Opportunity Agent, Analytics |
| **Vender** | "I need to sell" | Sales/CRM |
| **Mi Marca** | "I need my brand defined/protected" | Brand Builder, Brand Guardian |
| **Cuenta** | "I need to manage my account" | Settings, billing, team, integrations |

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
| Freelancer marketplaces (Fiverr, Upwork) | Integrated system of ~125 specialized agents + quality gates + scalability. Not individual freelancers — a system. |

---

## 3 Portals

### Public Portal
criteria.agency marketing site: landing page, motor/feature overview, pricing, onboarding.
CriteriaFilms.com: marketing asset generated by web motor, separate domain.

### Client Portal
6 outcome-based Spaces. Clients create briefs, review deliverables, manage their brand, view analytics, manage their account. AI Copilot assists throughout. Enterprise clients get human Account Executive overlay.

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
7. **Client simplicity over system complexity.** Clients see 6 Spaces and outcomes. The 24 motors and ~125 agents are invisible to them.

---

## Related Documents

- `TECH_ARCHITECTURE.md` — Technical stack, data model, communication architecture
- `TEAM_STRUCTURE.md` — Video motor teams, chain of command (needs expansion for other motors)
- `AGENT_REGISTRY.md` — Technical reference cards for Video motor agents (needs registries for other motors)
- `PRODUCTION_PIPELINE.md` — Video pipeline: 10 steps, 5 gates
- `MVP_ROADMAP.md` — Video motor phased rollout
- `PORTAL_SPECS.md` — Full UI/UX spec for all 3 portals
- `DECISION_LOG.md` — All key architectural decisions
- `SESSION_CONTEXT.md` — Complete project briefing
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — 24-motor architecture spec
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Security framework spec
