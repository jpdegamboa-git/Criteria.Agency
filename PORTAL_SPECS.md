# criteria.agency — Portal Specifications

> Last updated: April 6, 2026
> Portals: 3 (public, client, admin)
> Motors: 24 | Teams: 23 | Transversal agents: 9 | Security team: 6 | Total: ~125 agents
> Status: Active — Specification phase

---

## 1. Portal Architecture

criteria.agency is a platform of 24 specialized motors sharing a common orchestration framework. Three portals serve different users on top of this platform.

```
                          ┌─────────────────────────────────┐
                          │        criteria.agency           │
                          │     Platform (24 motors)         │
                          └──────────────┬──────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
            ┌───────▼──────┐    ┌───────▼───────┐    ┌──────▼──────┐
            │ Public Portal│    │ Client Portal │    │ Admin Portal│
            │  (marketing) │    │ (self-service │    │ (operations │
            │              │    │  + guided AI) │    │  + backoff.) │
            └──────────────┘    └───────────────┘    └─────────────┘
                                        │                    │
                                 ┌──────▼──────┐      ┌─────▼─────┐
                                 │  6 Spaces   │      │ Real      │
                                 │ (by outcome)│      │ Structure │
                                 └─────────────┘      │ (motors,  │
                                                      │  teams,   │
                                                      │  agents)  │
                                                      └───────────┘
```

### Shared services

| Service | Technology | Purpose |
|---------|-----------|---------|
| Auth | Better Auth | SSO, orgs, roles, permissions |
| Real-time | SSE | Pipeline updates, alerts, agent status |
| Storage | Cloudflare R2 | Assets, artifacts, Brand DNA docs |
| Event Bus | Typed events | Cross-motor communication |
| Brand DNA | Persistent docs | Injected as context across all motors |

### Portal URLs

| Portal | URL | Access |
|--------|-----|--------|
| Public | criteria.agency | Anyone |
| Client | app.criteria.agency | Authenticated clients |
| Admin | admin.criteria.agency | Internal team + admin roles |

**Note:** CriteriaFilms.com is NOT a separate portal. It is a marketing asset (website) produced by criteria.agency's Web motor for its first client. It lives internally as a campaign asset.

---

## 2. Public Portal

**Purpose:** Marketing site for criteria.agency as a SaaS platform. Acquire new clients.

### Pages

| Page | Purpose | Key elements |
|------|---------|-------------|
| Landing | First impression, value proposition | Hero showcasing the platform, 24-motor overview, social proof, CTA to signup |
| Engines | Detail each motor category | Creation, Strategy, Intelligence, Distribution, Operation — what each does, how AI agents work |
| Pricing | Subscription plans | By Space bundles (Free/Pro/Enterprise), feature comparison table, module-level detail for Enterprise |
| Portfolio | Showcase client work | Filterable by motor type (video, design, campaigns, events), case studies with metrics |
| School | Education portal | AI marketing courses, tutorials, workshops (business model 3) |
| Blog | Content marketing | Articles, industry insights, product updates (fed by SEO/Content motor) |
| About | Team and methodology | Story, agentic methodology, quality promise |
| Contact | Lead capture | Form with interest selector (which motors), company size, budget range → feeds Sales/CRM |

### Onboarding flow

```
Visitor → Landing → Engines/Pricing → Signup (Free tier)
    → Brand Builder wizard (create Brand DNA)
    → Dashboard (Client Portal)
    → First campaign or project brief
```

### Technical notes

- SSG where possible (Next.js static generation for SEO)
- Blog/school may be subdomain (school.criteria.agency)
- Portfolio media on CDN (Bunny Stream / R2)
- Contact form feeds Sales/CRM motor directly

### Pricing structure (by Space)

| Space | Free | Pro | Enterprise |
|-------|------|-----|-----------|
| **Crear** | 1 project/month, watermark | Unlimited projects, no watermark | Priority processing, dedicated agents |
| **Comunicar** | 2 channels, 10 posts/month | All channels, unlimited posts | Custom channels, advanced optimization |
| **Entender** | Basic reports | Full analytics, all listeners | Custom dashboards, API access |
| **Vender** | 50 leads | Unlimited leads, automation | Custom scoring, API integrations |
| **Mi Marca** | 1 brand | 3 brands | Unlimited brands, white-label |

---

## 3. Client Portal

**Purpose:** Self-service management platform where clients operate their marketing, create content, monitor performance, and manage their brand — guided by AI agents at every step.

**Access model (tiered):**

| Tier | Experience | Human support |
|------|-----------|---------------|
| **Free** | Self-service guided by AI wizards and recommendations | Community / help center only |
| **Pro** | Self-service with proactive AI copilot, advanced features | Chat support |
| **Enterprise** | Same portal + dedicated Account Executive (human) who operates alongside the client | Dedicated human + priority |

### 3.1 Layout

- **Sidebar:** 6 Spaces (icons + labels), collapsible
- **Header:** criteria.agency logo + notifications bell + global search (Cmd+K) + user avatar + plan badge
- **Theme:** Light mode default, dark mode toggle
- **Responsive:** Optimized for 768px+ (tablet and desktop). Mobile: simplified view with bottom navigation.

### 3.2 The 6 Spaces

The client navigates by **outcome**, not by motor. Each Space hides 2-6 motors behind a simple, goal-oriented interface.

#### Space 1: Crear

**What the client sees:** All creative projects — videos, designs, websites, audio, events, printed pieces.

**Motors behind it:** Video Production, Graphic Design, Web, Audio, Events, Print Production

| Screen | Purpose |
|--------|---------|
| **Projects** | List of all creation projects with status, type (video/design/web/audio/event/print), progress bar, delivery date |
| **New Project** | Wizard: select type → guided brief (conversational, powered by Creative Director agent) → file upload → budget estimate → confirmation |
| **Project Detail** | Progress visualization (pipeline steps per motor type), current step highlighted, deliverables by phase, comment threads |
| **Deliverable Review** | Full-screen viewer (video player / image viewer / document viewer / audio player), commenting interface with inline annotations |
| **File Upload** | Drag-and-drop, 15-day retention with countdown, accepted formats per project type |

**Brief creation flow (guided by AI):**
```
Client clicks "New Project"
    → Type selection (video, design, web, audio, event, print)
    → AI-guided conversational brief:
        - What's this for? (objective)
        - Who's the audience? (auto-suggests from Brand DNA)
        - Key messages
        - Style/tone preferences (references from Brand DNA)
        - Format/specs needed
        - Budget range
        - Timeline
    → AI generates brief summary for review
    → Client confirms → enters motor pipeline
```

**Deliverable review by type:**

| Type | Viewer | Comment format |
|------|--------|---------------|
| Video | Video player with timestamp markers | Timestamp-anchored comments |
| Design | Image viewer with zoom/pan | Area-based annotations (click on region) |
| Web | Live preview with responsive toggle | Page-section comments |
| Audio | Waveform player with markers | Timestamp-anchored comments |
| Event | Rundown/timeline view | Item-based comments |
| Print | Mockup viewer (how it looks printed) | Area-based annotations |

#### Space 2: Comunicar

**What the client sees:** All active campaigns, content calendar, social media, email, SEO. The Funnel Matrix is the central organizing view.

**Motors behind it:** Pauta (Ads), Community Management, Email Marketing, SEO/Content, Channel Manager

| Screen | Purpose |
|--------|---------|
| **Funnel Matrix** | Central view: rows = channels (Paid/Owned/Earned), columns = funnel stages (Awareness/Consideration/Conversion/Retention). Each active cell shows campaign performance. Click to drill down. |
| **Campaigns** | List of all campaigns with status, channels, budget, KPIs. Filterable by channel, funnel stage, status. |
| **New Campaign** | Wizard: objective → audience (from Brand DNA) → AI recommends channels and funnel stages → budget allocation → creative brief → launch |
| **Campaign Detail** | Performance dashboard: KPIs per channel, spend vs budget, creative performance, A/B test results, optimization suggestions |
| **Content Calendar** | Monthly/weekly calendar view. Scheduled posts, emails, content pieces. Color-coded by channel. Drag to reschedule. |
| **Social Feed** | Real-time feed of all social activity: scheduled posts, published posts, mentions, comments, DMs. Quick-reply interface. |
| **Email Hub** | Active flows, campaign history, subscriber metrics, deliverability health |

**Funnel Matrix interaction:**
```
Client opens Comunicar → sees Funnel Matrix

Matrix cell [Meta Ads × Awareness] is green (active, performing well)
Matrix cell [Email × Conversion] is yellow (active, below target)
Matrix cell [TikTok × Awareness] is empty (not activated)

Client clicks empty cell → AI suggests: "Based on your audience,
TikTok Awareness could reach 50K potential customers for $X/month.
Want to create a campaign?"

Client clicks yellow cell → sees performance detail + AI recommendations:
"Open rate is 15% (below 20% target). Suggestions:
1. Test new subject lines (A/B test ready)
2. Segment by engagement level
3. Adjust send time to 10am (your audience is most active)"
```

#### Space 3: Entender

**What the client sees:** Market intelligence, performance analytics, opportunities, insights.

**Motors behind it:** Brand Listening, Culture Listening, Industry Listening, Competitive Listening, Opportunity Agent, Media Scout, Analytics

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Executive overview: top KPIs (revenue attributed, CAC, ROAS, LTV), trend charts, health scores per area |
| **Opportunities** | Feed of detected opportunities from Opportunity Agent: trending moment + relevance + suggested action + time window. One-click to create campaign from opportunity. |
| **Brand Health** | Sentiment over time, mention volume, share of voice, perception themes, crisis alerts |
| **Market Intel** | Competitive moves, industry trends, culture signals. Organized by relevance to client's brand. |
| **Reports** | Library of generated reports (weekly, monthly, campaign-specific). On-demand: ask in natural language, AI generates report. |
| **Media Opportunities** | Media Scout discoveries: podcasts, influencers, partnerships, spaces relevant to the brand. With cost estimates and audience match %. |

#### Space 4: Vender

**What the client sees:** Leads, sales pipeline, CRM.

**Motors behind it:** Sales/CRM

| Screen | Purpose |
|--------|---------|
| **Pipeline** | Kanban: New → Contacted → Qualified → Proposal → Negotiation → Closed Won / Lost. Cards show lead name, company, score, value, last activity. |
| **Leads** | Full lead list with search, filters (source, score, status, date). Inline enrichment data. |
| **Lead Detail** | Full profile: contact info, company, enrichment data, score breakdown (fit + intent + budget), activity timeline, linked campaigns/events |
| **Automations** | Active nurture flows, follow-up sequences, email templates. Toggle on/off. |

#### Space 5: Mi Marca

**What the client sees:** Their brand identity, Brand DNA, guidelines, assets.

**Motors behind it:** Brand Builder, Brand Guardian

| Screen | Purpose |
|--------|---------|
| **Brand DNA** | Full brand document: mission, vision, values, positioning, audiences, tone, personality. Editable (triggers Brand Guardian re-validation). |
| **Visual Identity** | Colors (with hex/RGB), typography, logo versions, imagery style, do's and don'ts. Asset download. |
| **Verbal Identity** | Tone of voice, vocabulary, key phrases, messaging framework, what the brand says and doesn't say. |
| **Brand Health** | Brand Guardian report: consistency score across all recent outputs, violations flagged, trends. |
| **Asset Library** | All brand assets in one place: logos, templates, fonts, guidelines PDF, social media kits. |

**First-time experience:**
```
New client with no Brand DNA:
    → "Mi Marca" space shows Brand Builder wizard
    → Guided workshop (conversational AI):
        - Tell me about your business
        - What makes you different?
        - Who are your customers?
        - What's your brand personality?
        - Visual preferences (show examples, client picks)
    → AI generates Brand DNA draft
    → Client reviews and approves
    → Brand DNA persisted → injected into all motors
```

#### Space 6: Cuenta

**What the client sees:** Subscription, billing, team, settings.

**Motors behind it:** Marketplace (contracted providers), Financial Agent (billing)

| Screen | Purpose |
|--------|---------|
| **Plan** | Current subscription tier, included features, usage metrics, upgrade CTA |
| **Billing** | Invoices, payment methods, billing history. Stripe customer portal integration. |
| **Team** | Team members with roles (owner, admin, editor, viewer). Invite new members. Permissions per Space. |
| **Providers** | Contracted providers from Marketplace: active contracts, history, ratings, spend. |
| **Settings** | Notifications preferences, language, timezone, autonomy level (AI decides vs AI recommends), connected accounts (social, ads, email). |
| **Help** | AI chat support (powered by support agent), help center, contact human support (Pro/Enterprise). |

### 3.3 AI Copilot (transversal)

A persistent AI assistant available across all Spaces via a chat bubble or Cmd+K:

- **Proactive suggestions:** "Your TikTok campaign is underperforming. Want me to generate new creative variants?"
- **Natural language queries:** "How much did I spend on Meta Ads last month?" → generates answer from Analytics
- **Quick actions:** "Create a post about our new product for Instagram" → routes to Community Management
- **Opportunity alerts:** "Trending topic X is relevant to your audience. Want to create content?" → routes to Crear or Comunicar
- **Budget warnings:** "You've used 80% of your monthly Ads budget with 10 days remaining."

The copilot's proactiveness depends on the autonomy setting (AI decides vs AI recommends).

### 3.4 Account Executive view (Enterprise tier)

Enterprise clients have a dedicated Account Executive (human). The AE uses the **same client portal** but with additional capabilities:

| Feature | Client sees | AE also sees |
|---------|------------|--------------|
| Projects | Own projects | All assigned clients' projects, switch between clients |
| Campaigns | Own campaigns | Cross-client performance comparison, best practices from other clients |
| Analytics | Own data | Benchmarks across all managed clients, industry averages |
| Brand DNA | Own brand | Edit access, can trigger Brand Builder revisions |
| Settings | Own account | Client health score, engagement metrics, churn risk |

---

## 4. Admin Portal

**Purpose:** Full operational control of criteria.agency platform. Real structure visibility: motors, teams, agents, pipelines, gates, costs.

**Access:** Internal team. Modules visible by role.

### 4.1 Layout

- **Sidebar:** Organized by motor taxonomy (see 4.3). Collapsible (56px icons-only ↔ 240px icons+text).
- **Header:** criteria.agency logo + alert bell (count badge) + global search (Cmd+K) + user avatar + role badge
- **Theme:** Light mode default, dark mode toggle
- **Disabled modules:** Modules not yet built appear grayed with "Proximamente" badge
- **Responsive:** Designed for 1280px+ (desktop). Not optimized for mobile.

### 4.2 Role-based visibility

| Sidebar section | Admin (founder) | Operations Manager | Account Executive | Developer |
|-----------------|:---:|:---:|:---:|:---:|
| GLOBAL | Yes | Yes | Yes | Yes |
| CREATION | Yes | Yes | Own clients | Read-only |
| STRATEGY | Yes | Yes | Own clients | Read-only |
| INTELLIGENCE | Yes | Yes | Own clients | Read-only |
| DISTRIBUTION | Yes | Yes | Own clients | Read-only |
| OPERATION | Yes | Yes | Own clients | Read-only |
| TRANSVERSAL | Yes | Yes | Limited | Read-only |
| SYSTEM | Yes | Read-only | — | Yes |
| BACKOFFICE | Yes | — | — | — |

**Note:** For MVP (single user — founder), all sections are visible. Role-based visibility is designed for scale.

### 4.3 Sidebar Structure

```
GLOBAL
  ├── Mission Control          KPIs, global health, quick actions
  └── Alerts                   All alerts by severity, filterable

CREATION
  ├── Video Production         Pipeline, projects, agents, costs
  ├── Graphic Design           Pipeline, projects, agents, costs
  ├── Web                      Pipeline, projects, agents, costs
  ├── Audio                    Pipeline, projects, agents, costs
  ├── Events                   Pipeline, events, suppliers, costs
  └── Print Production         Orders, prepress, suppliers, deliveries

STRATEGY
  ├── Brand Builder            Active builds, Brand DNA library
  ├── Strategist               Marketing plans, campaign briefs
  └── Financial Overview       Budget allocation, spend tracking, P&L

INTELLIGENCE
  ├── Brand Listening          Sentiment, mentions, health score
  ├── Culture Listening        Trends, signals, moments
  ├── Industry Listening       Innovation, market shifts
  ├── Competitive Listening    Competitor moves, benchmarks
  └── Opportunities            Active opportunities, conversion rate

DISTRIBUTION
  ├── Ads (Pauta)              Campaigns, spend, ROAS, optimization
  ├── Community Management     Social accounts, calendar, engagement
  ├── Email Marketing          Flows, campaigns, deliverability
  └── SEO/Content              Rankings, content calendar, technical health

OPERATION
  ├── Sales/CRM                Pipeline, leads, conversion rates
  └── Analytics                Dashboards, reports, attribution

TRANSVERSAL
  ├── Brand Guardian           Consistency score, violations, audits
  ├── Channel Manager          Channel registry, skills, specs
  ├── Media Scout              Media registry, opportunities, partnerships
  ├── Marketplace              Providers, contracts, ratings, spend
  └── Security Center          Risk score, vulnerabilities, compliance

SYSTEM
  ├── Agent Dashboard          All ~125 agents, status, performance, costs
  ├── Model Dashboard          AI models, usage, costs, benchmarks
  ├── Clients                  Client accounts, subscriptions, health
  └── Settings                 Platform config, thresholds, notifications

BACKOFFICE (admin role only)
  ├── Finanzas                 Cashflow, AR/AP, internal budgets
  ├── Contabilidad             General ledger, tax reports, reconciliations
  ├── RRHH                     Team, contracts, payroll, PTO
  ├── Proyectos Internos       Internal company projects (not client projects)
  ├── Clientes/Usuarios        Account management, subscriptions, roles, permissions
  └── Analytics Interno        Business metrics: MRR, churn, unit economics, LTV:CAC
```

### 4.4 Mission Control

The global dashboard. Shows the health of the entire platform at a glance.

**KPI row (top):**

| KPI | Source | Trend |
|-----|--------|-------|
| Active Projects | All creation motors | vs last week |
| Active Campaigns | Distribution motors | vs last week |
| In Gate | All motors with gates | which gates, which projects |
| Escalations | 3+3 rule across all motors | count + severity |
| AI Cost Today | All agent executions | vs daily average |
| Revenue This Month | Sales/CRM + Billing | vs target |
| Security Risk | Security Center | green/yellow/red |

**Sections:**

| Section | Content |
|---------|---------|
| **Motor Health Grid** | All 24 motors in a grid. Each shows: status (active/idle/alert), active tasks, load. Click to drill down. Color-coded by category (Creation=purple, Strategy=blue, Intelligence=cyan, Distribution=orange, Operation=green). |
| **Alert Feed** | Chronological feed of all alerts across the platform. Filterable by motor, severity, type. Each alert links to the relevant screen. |
| **Active Agents** | Count of active agents, current tasks, total cost accumulating in real-time. Top 5 busiest agents. |
| **Client Activity** | Recent client actions: new projects, campaign launches, briefs submitted, deliverables reviewed. |
| **Quick Actions** | Create project, review gate, view escalation, check costs, search anything |

### 4.5 Motor Views (consistent pattern)

Every motor in the sidebar opens a view with a consistent structure. The content adapts per motor, but the layout pattern is the same:

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ Motor Name                    [status] [filters] │
├──────────────────────────────────────────────────┤
│ KPI Bar: 4-5 motor-specific KPIs                 │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Left:    │ Main content:                         │
│ Nav/     │ Pipeline view / list / kanban /        │
│ Filters  │ calendar / matrix (varies per motor)  │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│ Bottom panel: Agent activity, recent events       │
└──────────────────────────────────────────────────┘
```

**Per-motor specifics:**

| Motor | Main content view | KPIs |
|-------|-------------------|------|
| Video Production | Kanban by pipeline step (10 steps + 5 gates) | Active, In Gate, Delivered, Avg Time, Cost |
| Graphic Design | Kanban by pipeline step | Active, Completed, Avg Time, Cost |
| Web | Kanban by pipeline step | Active, Deployed, Avg Time, Cost |
| Audio | Kanban by pipeline step | Active, Delivered, Avg Time, Cost |
| Events | Timeline/calendar by event date | Upcoming, In Planning, Completed, Total Spend |
| Print Production | Kanban: Prepress → Supplier → Proof → Production → Delivery | Active Orders, Pending Proofs, Delivered, Spend |
| Brand Builder | List of brands with DNA status | Brands Active, In Progress, Completed |
| Strategist | List of marketing plans and campaign briefs | Plans Active, Briefs Generated, Campaigns Launched |
| Financial Overview | Budget dashboard: allocation vs spend by motor, channel, client | Total Budget, Spent, Remaining, Projected |
| Brand Listening | Sentiment timeline + mention feed | Health Score, Mentions/day, Sentiment, Alerts |
| Culture Listening | Trending topics feed with relevance scoring | Active Trends, Relevant %, Opportunities Generated |
| Industry Listening | Intelligence feed by category | Reports Generated, Signals Detected, Trends Active |
| Competitive Listening | Competitor grid + activity feed | Competitors Tracked, Moves/week, Gaps Found |
| Opportunities | Opportunity feed: moment + relevance + action + window | Active, Acted On, Conversion Rate, Revenue Attributed |
| Ads (Pauta) | Funnel Matrix + campaign list | Active Campaigns, Total Spend, Avg ROAS, CAC |
| Community Management | Content calendar + social feed | Posts/week, Engagement Rate, Response Time, Followers |
| Email Marketing | Flow list + campaign list + health metrics | Active Flows, Open Rate, CTR, Deliverability |
| SEO/Content | Keyword rankings table + content calendar | Rankings Tracked, Organic Traffic, Top 10 Keywords, Content Published |
| Sales/CRM | Kanban pipeline | Leads, Qualified, Pipeline Value, Win Rate, Avg Deal Time |
| Analytics | Dashboard selector (executive, campaign, channel, funnel, cost) | Revenue, CAC, LTV, ROAS, ROI |

### 4.6 Project/Campaign Detail (drill-down)

Clicking any project or campaign from a motor view opens a detail page with consistent tabs:

| Tab | Content | Applicable to |
|-----|---------|---------------|
| **Pipeline** | Visual progress bar with motor-specific steps. Current step highlighted. Gate results inline. Iteration count per step. | All project-mode motors |
| **Artifacts** | Table: step, artifact type, version, agent who created, timestamp, preview/download. | All motors that produce outputs |
| **Gates** | Gate review history: gate type, attempt #, scores, decision, reviewer notes, iteration feedback. | All motors with gates |
| **Costs** | Breakdown by: step, agent, AI model. Running total vs budget. Chart over time. | All motors |
| **Activity** | Chronological log of everything: agent executions, gate reviews, status changes, client comments, alerts. | All motors |
| **Client View** | What the client sees for this project in their portal. Useful for AEs and support. | All client-facing motors |

### 4.7 Gate Review Interface

Accessed from any gate in any motor's pipeline:

| Section | Content |
|---------|---------|
| **Gate info** | Gate type, gate-specific question (e.g., "Is the vision clear, inspiring, and executable?"), motor, project |
| **Evaluation** | Structured assessment per gate criteria. Score per criterion. Overall recommendation. |
| **Cross-reports** | Reports from other agents/teams relevant to this gate (e.g., Brand Guardian consistency check, Financial Agent budget validation) |
| **Iteration history** | Previous attempts at this gate: what was submitted, what feedback was given, what changed |
| **Actions** | **Approve** (advance to next step) / **Reject** (return with feedback — enters 3+3 count) / **Escalate** (bypass to human) |
| **3+3 Status** | Visual indicator: 6 dots showing attempt progress. Dots 1-3 green (normal), 4-6 amber (leader adjustment). If all 6 fail → human escalation required. |

### 4.8 Agent Dashboard

**Purpose:** Monitor ALL ~125 agents across the entire platform.

**Views:**

| View | Content |
|------|---------|
| **Grid** | All agents in cards, grouped by team/motor. Each card: name, team, status (active/idle/error), current task, 3+3 progress, cost today. Color-coded by motor category. |
| **Table** | Sortable/filterable table: agent, motor, team, status, current task, project, execution time, cost, escalations, success rate. |
| **Performance** | Aggregate stats: total active, avg execution time, total cost today/week/month, escalation rate, success rate. Charts over time. |

**Filters:** By motor, by team, by status (active/idle/error/escalated), by cost range.

**Agent detail (click any agent):**

| Section | Content |
|---------|---------|
| **Profile** | Name, team, motor, role, autonomy level, skills, description |
| **Current** | Current task, project, execution time, input artifacts, output artifacts (in progress) |
| **3+3 Status** | Current attempt number, history of attempts on current task |
| **History** | Last 50 executions: task, project, duration, cost, result (success/fail), artifacts produced |
| **Performance** | Success rate, avg execution time, avg cost, escalation rate. Trends over time. |
| **Costs** | Cost breakdown by AI model used. Total cost this day/week/month. |

### 4.9 Model Dashboard

**Purpose:** Monitor AI model usage, costs, and quality across the platform. Team 9 (AI Model Intelligence) transversal view.

| Section | Content |
|---------|---------|
| **Models in use** | Table: model name, provider, tasks assigned, usage count, total cost, avg quality score, status |
| **Cost analysis** | Cost per model over time. Cost per task type. Projected monthly cost at current rate. |
| **Benchmark** | Quality comparison chart across models for same task types. Latency comparison. |
| **Selection history** | Log of model selection decisions: which model was chosen for which task and why |
| **Alerts** | New model releases detected. Performance degradation alerts. Cost anomalies. |

### 4.10 Security Center

**Purpose:** Security posture of the entire platform.

| Section | Content |
|---------|---------|
| **Risk Score** | Global score (green/yellow/red) with breakdown by domain: code, infrastructure, data, agents, APIs, operations |
| **Vulnerabilities** | Active vulnerabilities by severity (critical/high/medium/low). Each with: description, affected component, remediation status, assigned to. |
| **Compliance** | Status per regulation (GDPR, LGPD, CCPA): compliant/partial/non-compliant. Checklist with evidence. |
| **Agent Audit** | Recent agent permission checks: violations, data leakage attempts, prompt injection detections, cross-tenant access attempts. |
| **Access Log** | Login anomalies, API abuse patterns, credential events. Filterable by user, IP, time. |
| **Infrastructure** | SSL cert expiry timeline, backup status (last backup + restore test), uptime metrics, DDoS alerts. |
| **Security Events** | Chronological feed of all security events. Severity-coded. Links to affected resources. |

### 4.11 Clients Management (SYSTEM)

| Section | Content |
|---------|---------|
| **Client list** | All client accounts: name, plan (Free/Pro/Enterprise), MRR, active projects, active campaigns, health score, AE assigned |
| **Client detail** | Account info, subscription history, Brand DNA link, project history, campaign history, usage metrics, billing, team members, satisfaction metrics |
| **Subscriptions** | Active subscriptions by plan. Upgrades/downgrades trend. Churn tracking. |
| **Roles & Permissions** | User management: who has access to what, role assignments, invitation management |

### 4.12 BACKOFFICE Modules (admin role only)

These modules manage the internal operations of criteria.agency as a business. They are only visible to users with the admin role.

#### Finanzas

| Section | Content |
|---------|---------|
| **Cashflow** | Cash in vs cash out over time. Projected cashflow. |
| **Cuentas por Cobrar** | Outstanding invoices, aging report, collection status |
| **Cuentas por Pagar** | Supplier invoices (Marketplace, infrastructure, AI costs), payment schedule |
| **Presupuestos Internos** | Budget per department/motor, actual vs planned |
| **Treasury** | Bank balances, payment methods, financial calendar |

#### Contabilidad

| Section | Content |
|---------|---------|
| **Libro Mayor** | General ledger entries, chart of accounts |
| **Reportes Fiscales** | Tax calculations, withholding, declarations by jurisdiction |
| **Conciliaciones** | Bank reconciliation, Stripe reconciliation, provider payment reconciliation |
| **Cierre Mensual** | Monthly close checklist, accruals, adjustments |

#### RRHH

| Section | Content |
|---------|---------|
| **Equipo** | Human team members: name, role, department, contract type, start date |
| **Contratos** | Active contracts, renewal dates, terms |
| **Nomina** | Payroll processing, salary history, deductions |
| **Vacaciones/PTO** | PTO balances, requests, calendar |
| **Evaluaciones** | Performance reviews, goals, feedback |

#### Proyectos Internos

| Section | Content |
|---------|---------|
| **Projects** | Internal company projects (platform development, marketing of criteria.agency itself, partnerships). NOT client projects. |
| **Kanban** | Status tracking: Backlog → In Progress → Review → Done |
| **Milestones** | Key dates, deliverables, dependencies |
| **Resources** | Who is assigned to what, capacity planning |

#### Clientes/Usuarios

| Section | Content |
|---------|---------|
| **User Management** | All platform users across all clients. Search, filter, role management. |
| **Account Lifecycle** | Signup → Onboarding → Active → At Risk → Churned. Funnel metrics. |
| **Feature Flags** | Per-client feature toggles for beta features, custom configurations |
| **Data Management** | Data export, account deletion (right to be forgotten), data portability |

#### Analytics Interno

| Section | Content |
|---------|---------|
| **MRR** | Monthly Recurring Revenue: current, trend, breakdown by plan |
| **Churn** | Churn rate, reasons, cohort analysis, at-risk clients |
| **Unit Economics** | CAC (to acquire a client of criteria.agency), LTV, LTV:CAC ratio, payback period |
| **Usage** | Platform usage metrics: active users, sessions, features used, motors used |
| **Growth** | Signup rate, activation rate, upgrade rate, expansion revenue |
| **AI Costs** | Total AI compute cost, cost per client, cost per motor, margin analysis |

---

## 5. Alert System

Alerts are global and surface across both portals (admin sees all, client sees own).

### 5.1 Alert triggers

| Category | Trigger | Severity | Source motor |
|----------|---------|----------|-------------|
| **Agent** | Stuck (execution time > 2x average) | warning | Any motor with agents |
| **Agent** | 3+3 attempt 4 triggered (leader adjustment) | warning | Any motor with 3+3 |
| **Agent** | 3+3 attempt 6 failed (human escalation needed) | critical | Any motor with 3+3 |
| **Gate** | Gate failed 2+ times on same project | error | Any motor with gates |
| **Budget** | Budget exceeded threshold (80%, 100%) | warning / critical | Financial Agent |
| **Performance** | KPI below target for 3+ consecutive days | warning | Analytics |
| **Performance** | Anomaly detected (sudden drop/spike) | warning | Analytics |
| **Model** | New model release detected | info | Model Dashboard |
| **Model** | Model performance degradation | warning | Model Dashboard |
| **Security** | Vulnerability detected | error / critical | Security Center |
| **Security** | Access anomaly detected | warning | Security Center |
| **Security** | Agent permission violation | critical | Agent Auditor |
| **Brand** | Consistency violation in output | warning | Brand Guardian |
| **Brand** | Crisis signal detected | critical | Brand Listening |
| **Opportunity** | Time-sensitive opportunity detected | info | Opportunity Agent |
| **Marketplace** | Provider delivery overdue | warning | Marketplace |
| **Infrastructure** | SSL cert expiring in < 30 days | warning | Infrastructure Sentinel |
| **Infrastructure** | Backup failure | critical | Infrastructure Sentinel |

### 5.2 Alert delivery

| Channel | When | Who sees it |
|---------|------|-------------|
| **Header bell badge** | Always (count of unread) | Admin and client (own alerts only) |
| **Slide-out panel** | Click bell | Full alert list, filterable |
| **Mission Control feed** | Always visible | Admin only |
| **Push notification** | Critical alerts | Admin (browser notification) |
| **Email** | Critical alerts only (future, not MVP) | Admin |
| **In-context badge** | On the motor/project where alert originated | Both portals |

### 5.3 Alert anatomy

```
[severity icon] [timestamp] [motor badge]
Alert title
Brief description with context
[Link to relevant screen] [Mark as read] [Snooze]
```

---

## 6. Real-time (SSE)

Server-Sent Events provide live updates across both portals.

### 6.1 Event types

| Event | Payload | Consumers |
|-------|---------|-----------|
| `pipeline_update` | project_id, motor, step, status | Project views, Mission Control |
| `alert` | alert object | Header bell, Alert panel, Mission Control |
| `agent_status` | agent_id, status, task, progress | Agent Dashboard, motor views |
| `cost_update` | motor, amount, running_total | Financial Overview, Mission Control, Cost tabs |
| `gate_result` | gate_id, decision, scores | Gate Review, Pipeline views |
| `campaign_metric` | campaign_id, metric, value | Campaign detail, Funnel Matrix |
| `social_event` | platform, type (mention/comment/DM), content | Social Feed, Community Management |
| `opportunity` | opportunity brief object | Opportunities feed, notifications |
| `security_event` | event object | Security Center |

### 6.2 Technical

- SSE endpoint per authenticated session
- **Powered by Event Bus:** SSE events are a subset of platform events (from `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` section 7.3) filtered by user role and tenant
- 30-second heartbeat
- Auto-reconnect on connection loss
- Event filtering per user role and subscribed motors
- Fallback: polling every 30 seconds if SSE unavailable

---

## 7. Design System Notes

### 7.1 Theme

Both light and dark modes. Light is default. User toggle in header.

**Light mode:**
- Background: `#ffffff` (primary), `#f8f9fa` (secondary), `#f1f3f5` (tertiary)
- Text: `#212529` (primary), `#495057` (secondary), `#868e96` (muted)
- Border: `#dee2e6`

**Dark mode:**
- Background: `#1a1b1e` (primary), `#25262b` (secondary), `#2c2e33` (tertiary)
- Text: `#c1c2c5` (primary), `#909296` (secondary), `#5c5f66` (muted)
- Border: `#373a40`

### 7.2 Motor category colors

Used for badges, borders, chart colors, and sidebar section indicators:

| Category | Color | Hex |
|----------|-------|-----|
| Creation | Purple | `#a78bfa` |
| Strategy | Blue | `#60a5fa` |
| Intelligence | Cyan | `#22d3ee` |
| Distribution | Orange | `#fb923c` |
| Operation | Green | `#4ade80` |
| Transversal | Gray | `#9ca3af` |
| Security | Red | `#f87171` |
| Backoffice | Slate | `#94a3b8` |

### 7.3 Alert severity colors

| Severity | Color | Hex |
|----------|-------|-----|
| info | Blue | `#60a5fa` |
| warning | Amber | `#fbbf24` |
| error | Orange | `#fb923c` |
| critical | Red | `#ef4444` |

### 7.4 Typography

- Font: Inter (or system font stack as fallback)
- Sizes: 12px (caption), 14px (body), 16px (subtitle), 20px (title), 28px (heading)
- Monospace: JetBrains Mono (code, agent IDs, costs)

### 7.5 Icons

Lucide icons throughout. Consistent use:

| Element | Icon |
|---------|------|
| Mission Control | `LayoutDashboard` |
| Alerts | `Bell` |
| Video | `Film` |
| Design | `Palette` |
| Web | `Globe` |
| Audio | `Music` |
| Events | `CalendarDays` |
| Print | `Printer` |
| Brand Builder | `Sparkles` |
| Strategist | `Target` |
| Financial | `DollarSign` |
| Listeners | `Ear` |
| Opportunities | `Lightbulb` |
| Ads | `Megaphone` |
| Community | `MessageCircle` |
| Email | `Mail` |
| SEO | `Search` |
| Sales | `TrendingUp` |
| Analytics | `BarChart3` |
| Brand Guardian | `Shield` |
| Channel Manager | `Radio` |
| Media Scout | `Radar` |
| Marketplace | `Store` |
| Security | `Lock` |
| Agents | `Bot` |
| Models | `Brain` |
| Clients | `Users` |
| Settings | `Settings` |

### 7.6 Component patterns

| Component | Usage |
|-----------|-------|
| **KPI Card** | Top row of dashboards. Number + label + trend indicator (arrow + percentage). Color-coded by positive/negative. |
| **Status Badge** | Pill shape. Colors: active (green), idle (gray), alert (amber), error (red), completed (blue). |
| **Tier Badge** | "Proximamente" for unbuilt modules. Grayed out icon + dashed border. |
| **Motor Badge** | Small colored pill with motor category color + motor name. Used in alerts, activity feeds. |
| **Pipeline Bar** | Horizontal bar with steps as segments. Current step highlighted. Completed steps filled. Gate steps have shield icon. |
| **3+3 Indicator** | 6 dots in a row. Filled dots = attempts used. Green (1-3), amber (4-6). |
| **Funnel Matrix Cell** | Square cell in matrix. Empty = not activated. Colored = active (green=good, yellow=warning, red=underperforming). Shows mini KPI on hover. |
| **Alert Card** | Severity stripe on left + icon + timestamp + motor badge + title + description + action link. |
| **Agent Card** | Agent avatar/icon + name + team + status badge + current task + 3+3 indicator + cost. |

### 7.7 Responsive breakpoints

| Portal | Minimum | Optimized for |
|--------|---------|---------------|
| Public | 375px (mobile-first) | All devices |
| Client | 768px (tablet+) | Desktop, with tablet support |
| Admin | 1280px (desktop) | Desktop only |

---

## 8. Permission Matrix

### 8.1 MVP (single user)

For MVP, the founder has full access to everything in admin portal. Client portal is not yet exposed to external clients.

### 8.2 Future roles

| Role | Portal | Sees | Can do |
|------|--------|------|--------|
| **Platform Admin** | Admin (full) | Everything including Backoffice | Full control. Configure agents, models, security, billing. |
| **Operations Manager** | Admin (no Backoffice) | All motors, all clients | Manage all projects/campaigns, review gates, handle escalations. Cannot access Backoffice. |
| **Account Executive** | Admin (scoped) + Client | Assigned clients' data only | Operate client portal on behalf of clients. View cross-client benchmarks. Cannot configure agents/models. |
| **Developer** | Admin (System only) | System section + read-only motors | Deploy, debug, configure technical settings. Cannot manage clients or operations. |
| **Client Owner** | Client | Own account, all Spaces | Full self-service. Manage team, billing, Brand DNA. |
| **Client Admin** | Client | Own account, all Spaces | Same as owner except billing and account deletion. |
| **Client Editor** | Client | Own account, most Spaces | Create projects, campaigns, content. Cannot manage team or billing. |
| **Client Viewer** | Client | Own account, read-only | View projects, reports, analytics. Cannot create or modify. |

### 8.3 Agent permissions (system-level)

Agent permissions are NOT portal permissions — they are system-level access controls enforced by the Agent Auditor:

| Permission | Scope | Example |
|------------|-------|---------|
| **Tenant isolation** | Agents NEVER access data from other tenants | Video agent for Client A cannot read Client B's Brand DNA |
| **Motor scope** | Agents only access artifacts within their motor unless explicitly cross-motor | Email agent cannot read Sales pipeline data unless triggered by cross-motor event |
| **Write scope** | Agents can only write to their designated artifact types | Copywriter cannot modify visual assets |
| **External API scope** | Agents use only approved API endpoints with client-authorized credentials | Ads agent uses client's Meta Ads account, not another client's |
| **Cost limits** | Per-agent execution cost limits to prevent runaway spend | Max $10 per single agent execution |

---

## 9. Related Documents

| Document | Relevance |
|----------|-----------|
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | Full motor architecture (24 motors, teams, agents, pipelines, communication, tooling) |
| `PRODUCTION_PIPELINE.md` | Video engine pipeline — reference for all motor pipelines |
| `TEAM_STRUCTURE.md` | Video team organization (9 teams, chain of command) |
| `AGENT_REGISTRY.md` | Video agent reference cards (47 agents) |
| `TECH_ARCHITECTURE.md` | Shared infrastructure (state machine, gate router, dispatcher, 3+3) |
| `MVP_ROADMAP.md` | Phased rollout plan |
| `PROJECT_VISION.md` | Mission, business models, immutable principles |
| `DECISION_LOG.md` | Chronological log of key decisions |
| `SESSION_CONTEXT.md` | Full project briefing |
| `docs/brain/M1-M6_Summary.pdf` | Harvard Digital Marketing Strategy — Strategist knowledge base |
