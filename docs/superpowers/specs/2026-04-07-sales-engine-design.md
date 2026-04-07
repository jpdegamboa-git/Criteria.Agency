# criteria.agency — Sales Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Sales capabilities (C-028 to C-032): Lead Capture & Enrichment, Lead Scoring, Sales Pipeline, Commercial Proposals, Customer Attribution

---

## 1. Objective

Build the **Sales Engine** — a hybrid motor that combines project-based flows (proposal generation) with continuous operations (lead monitoring, pipeline management, follow-ups). This is the revenue engine that connects marketing efforts to actual sales outcomes.

| Capability | What it delivers |
|-----------|-----------------|
| C-028: Captura y enriquecimiento de leads | Centralized lead intake from all channels with automatic data enrichment |
| C-029: Lead scoring automático | BANT-based scoring model that ranks leads by conversion probability |
| C-030: Pipeline de ventas | Kanban pipeline with automated follow-ups and stale deal alerts |
| C-031: Generación de propuestas | Branded commercial proposals with financial validation |
| C-032: Atribución de origen | First-touch/last-touch/multi-touch attribution linking closed deals to channels |

**Dependency chain:** C-028 (capture) → C-029 (scoring) → C-030 (pipeline) → C-031 (proposals). C-032 runs continuously alongside.

---

## 2. Architecture: Hybrid Motor

The Sales Engine operates in two modes:

### Project mode (proposals)
Standard pipeline for generating commercial proposals:
```
[lead_qualified] → [discovery] → [proposal_draft] → [G1] → [proposal_final] → [G2: human] → [sent]
```

### Continuous mode (pipeline management)
Always-on services for lead management:
```
[Lead capture] → [Enrichment] → [Scoring] → [Pipeline assignment] → [Follow-up automation] → [Attribution tracking]
```

---

## 3. Agents

### Sales Pipeline Agents

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| SL-L | Sales Director | leader | discovery, proposal_final, pipeline oversight | claude-sonnet-4 | 70% |
| SL-001 | Lead Capture Agent | sub | capture, enrichment | gemini-2.5-flash | 90% |
| SL-002 | Lead Scoring Agent | sub | scoring | gemini-2.5-flash | 85% |
| SL-003 | Pipeline Manager | sub | pipeline management, follow-ups | gemini-2.5-flash | 80% |
| SL-004 | Proposal Writer | sub | proposal_draft | claude-sonnet-4 | 75% |
| SL-005 | Nurture Specialist | sub | nurture sequences | gemini-2.5-flash | 85% |
| SL-006 | Attribution Analyst | sub | attribution | gemini-2.5-flash | 85% |
| SL-007 | Discovery Interviewer | sub | discovery | gemini-2.5-flash | 80% |

---

## 4. Continuous Operations

### 4.1 Lead Capture & Enrichment (C-028)

**Flow:** `ingest → deduplicate → enrich → assign`

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| ingest | SL-001 | Receives leads from: waitlist form, landing pages, email replies, social DMs, manual entry, ad platform conversions | Lead data (name, email, company, source) | Normalized lead record |
| deduplicate | SL-001 | Checks for existing lead by email, company name, phone. Merges if duplicate | Normalized lead, existing leads DB | Deduplicated lead |
| enrich | SL-001 | Adds: company size, industry, website, social profiles, technology stack, recent funding | Deduplicated lead | Enriched lead record |
| assign | SL-002 | Initial scoring + pipeline stage assignment | Enriched lead | Scored lead in pipeline |

**External data interfaces (enrichment):**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `CompanyEnrichmentProvider` | Company size, industry, revenue, tech stack | LLM infers from company name + website | Clearbit, Apollo.io, or LinkedIn Sales Nav API |
| `ContactEnrichmentProvider` | Job title, social profiles, phone | LLM infers from email domain | Clearbit, Hunter.io, Apollo.io |
| `WebsiteAnalyzer` | Tech stack, traffic estimates, content analysis | LLM analyzes based on domain name | BuiltWith, SimilarWeb API |

**Interface contract:**

```typescript
interface LeadEnrichmentProvider {
  name: string;
  enrichCompany(domain: string): Promise<CompanyData>;
  enrichContact(email: string): Promise<ContactData>;
  isAvailable(): boolean;
}

interface CompanyData {
  name: string;
  domain: string;
  industry: string;
  employeeCount: number | null;
  annualRevenue: string | null;     // Range: "$1M-$5M"
  techStack: string[];
  socialProfiles: Record<string, string>;
  description: string;
  location: { country: string; city: string };
}

interface ContactData {
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  seniority: "c-level" | "vp" | "director" | "manager" | "individual" | "unknown";
}

interface LeadSource {
  channel: string;       // "waitlist", "landing_page", "ad_meta", "ad_google", "email", "social", "referral", "manual"
  campaign: string | null;
  medium: string | null;  // "paid", "organic", "referral", "direct"
  content: string | null; // specific ad or content piece
  timestamp: string;
}
```

### 4.2 Lead Scoring (C-029)

**BANT + Behavioral scoring model:**

```typescript
interface LeadScore {
  total: number;           // 0-100
  components: {
    fit: number;           // 0-40 — company fit (industry, size, budget)
    intent: number;        // 0-30 — behavioral signals (website visits, email opens, content downloads)
    authority: number;     // 0-15 — decision-making power (seniority, department)
    timing: number;        // 0-15 — urgency signals (budget cycle, recent funding, expressed timeline)
  };
  tier: "hot" | "warm" | "cold" | "unqualified";
  reasoning: string;       // AI explanation of score
  lastUpdated: string;
}
```

**Scoring rules (configurable per client):**

| Component | Signal | Points |
|-----------|--------|--------|
| **Fit** | Industry match | +10 |
| **Fit** | Company size in ICP range | +10 |
| **Fit** | Budget indicated | +10 |
| **Fit** | Region match | +10 |
| **Intent** | Website visit (last 7 days) | +5 |
| **Intent** | Email opened (last 7 days) | +5 |
| **Intent** | Content downloaded | +10 |
| **Intent** | Pricing page visited | +10 |
| **Authority** | C-level / VP | +15 |
| **Authority** | Director / Manager | +10 |
| **Authority** | Individual contributor | +5 |
| **Timing** | Expressed urgency | +15 |
| **Timing** | Budget cycle alignment | +10 |
| **Timing** | Recent funding | +5 |

**Scoring rules:** Each component is capped at its maximum (Fit: 40, Intent: 30, Authority: 15, Timing: 15). Multiple signals within a component are additive but capped. For example, if a lead has both "expressed urgency" (+15) and "budget cycle alignment" (+10), the Timing component scores 15 (capped), not 25.

**Tier thresholds:** Hot ≥75, Warm ≥50, Cold ≥25, Unqualified <25

**Re-scoring triggers:** Score recalculates on: new behavioral event, manual data update, weekly decay (-2 points/week with no activity).

### 4.3 Sales Pipeline (C-030)

**Pipeline stages:**

| Stage | Entry criteria | Auto-actions | Stale threshold |
|-------|---------------|-------------|-----------------|
| **New** | Lead captured | Enrichment + scoring | 3 days |
| **Contacted** | First outreach sent | Schedule follow-up | 5 days |
| **Qualified** | BANT confirmed | Create opportunity record | 7 days |
| **Discovery** | Discovery call scheduled | Prepare discovery brief | 10 days |
| **Proposal** | Discovery complete | Generate proposal (project pipeline) | 14 days |
| **Negotiation** | Proposal sent | Schedule check-in | 14 days |
| **Closed Won** | Deal signed | Trigger onboarding, update attribution | — |
| **Closed Lost** | Deal lost | Record reason, nurture sequence | — |

**Automated follow-ups:**

| Trigger | Action | Agent |
|---------|--------|-------|
| Lead in "New" for 24h, score ≥50 | Send personalized outreach email | SL-005 |
| Lead in "Contacted" for 3 days, no reply | Send follow-up #1 | SL-005 |
| Lead in "Contacted" for 7 days, no reply | Send follow-up #2 (different angle) | SL-005 |
| Lead in "Contacted" for 14 days, no reply | Move to nurture, send value-add content | SL-005 |
| Deal in any stage past stale threshold | Alert to Sales Director + suggest action | SL-003 |
| Score drops below tier threshold | Re-evaluate pipeline stage | SL-002 |

### 4.4 Proposal Generation (C-031)

**Project pipeline (triggered from pipeline stage "Proposal"):**

```
[discovery_notes] → [proposal_draft] → [G1: internal] → [proposal_final] → [G2: human] → [sent]
```

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| discovery_notes | SL-007 | Structures discovery call notes into: needs, budget, timeline, decision process, competitors considered | Raw discovery notes (text) | Structured discovery document (markdown) |
| proposal_draft | SL-004 | Generates proposal: executive summary, proposed solution (services + scope), timeline, investment, team, case studies, terms | Discovery doc, Brand DNA, pricing templates, client enrichment data | Draft proposal (markdown) |
| proposal_final | SL-L | Reviews, adjusts pricing, adds strategic positioning, ensures brand consistency | Draft proposal, Brand DNA, Financial Agent validation | Final proposal (markdown + PDF generation) |

**Gates:**

| Gate | After step | Evaluator(s) | Max iterations | What it checks |
|------|-----------|-------------|----------------|---------------|
| G1 | proposal_draft | SL-L, XA-001 (Financial Agent) | 3 | Pricing viable? Scope realistic? Brand aligned? |
| G2 | proposal_final | Human | 1 | Founder reviews before send |

**Proposal template sections:**
1. Executive Summary (personalized to client's pain)
2. Current Situation (from discovery)
3. Proposed Solution (services, scope, deliverables)
4. Timeline & Milestones
5. Investment (pricing tier, payment terms)
6. Why criteria.agency (differentiators, relevant experience)
7. Next Steps
8. Terms & Conditions

### 4.5 Customer Attribution (C-032)

> **Ownership note:** The Sales Engine captures touchpoints and stores attribution results on deals. The actual attribution computation (model execution) lives in the **Analytics Engine**. The Analytics Engine reads touchpoints from the `lead_touchpoints` table, computes attribution, and writes results back to the `deals.attribution` field.

**Attribution models (configurable, executed by Analytics Engine):**

| Model | Logic | Best for |
|-------|-------|----------|
| **First-touch** | 100% credit to first known touchpoint | Understanding awareness channels |
| **Last-touch** | 100% credit to last touchpoint before conversion | Understanding closing channels |
| **Linear** | Equal credit across all touchpoints | Balanced view |
| **Time-decay** | More credit to recent touchpoints (7-day half-life) | Understanding recent influence |
| **Position-based** | 40% first, 40% last, 20% distributed middle | Balanced with emphasis on bookends |

**Touchpoint tracking:**

```typescript
interface Touchpoint {
  leadId: string;
  channel: string;        // "meta_ads", "google_ads", "organic_search", "email", "social", "referral", "direct"
  campaign: string | null;
  content: string | null;  // specific ad, email, or content piece
  medium: string;          // "paid", "organic", "referral", "direct"
  timestamp: string;
  interaction: string;     // "click", "view", "form_submit", "email_open", "page_visit"
}

interface AttributionResult {
  dealId: string;
  dealValue: number;
  model: string;
  attributions: Array<{
    touchpoint: Touchpoint;
    creditPercent: number;
    creditValue: number;
  }>;
  pathLength: number;      // total touchpoints
  timeToClose: number;     // days from first touch to close
}
```

**External data interfaces (attribution):**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `AdPlatformProvider` | Campaign clicks, costs, conversions per lead | LLM generates sample campaign data | Meta Marketing API, Google Ads API |
| `WebAnalyticsProvider` | Page visits, UTM params, conversion events | LLM generates sample analytics data | Google Analytics 4 API |
| `EmailTrackingProvider` | Email opens, clicks per lead | Uses existing Resend webhooks | Resend webhook events |

**Interface contract:**

```typescript
interface AdPlatformProvider {
  name: string;
  platform: "meta" | "google" | "tiktok" | "linkedin";
  getCampaignData(dateRange: DateRange): Promise<CampaignData[]>;
  getLeadTouchpoints(email: string): Promise<Touchpoint[]>;
  isAvailable(): boolean;
}

interface CampaignData {
  campaignId: string;
  campaignName: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  dateRange: DateRange;
}

interface WebAnalyticsProvider {
  name: string;
  getPageViews(clientId: string, dateRange: DateRange): Promise<PageView[]>;
  getConversionEvents(clientId: string, dateRange: DateRange): Promise<ConversionEvent[]>;
  isAvailable(): boolean;
}
```

---

## 5. Database Changes

### New tables

```sql
-- Lead management
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),   -- which criteria.agency client owns this lead
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  job_title VARCHAR(100),
  phone VARCHAR(50),
  source JSONB NOT NULL,                          -- LeadSource object
  enrichment_data JSONB,                          -- CompanyData + ContactData
  score JSONB,                                    -- LeadScore object
  pipeline_stage VARCHAR(30) DEFAULT 'new',
  assigned_to VARCHAR(100),                       -- sales rep or "ai"
  last_activity_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, email)
);

-- Lead activity/touchpoints for attribution
CREATE TABLE lead_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  channel VARCHAR(50) NOT NULL,
  campaign VARCHAR(200),
  content VARCHAR(200),
  medium VARCHAR(50),
  interaction VARCHAR(50) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deals (qualified opportunities)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  title VARCHAR(255) NOT NULL,
  value NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  stage VARCHAR(30) NOT NULL DEFAULT 'qualified',
  probability INTEGER DEFAULT 50,                  -- 0-100
  expected_close_date DATE,
  actual_close_date DATE,
  close_reason VARCHAR(50),                        -- "won", "lost_price", "lost_competitor", "lost_timing", "lost_no_decision"
  proposal_project_id UUID REFERENCES projects(id), -- link to proposal pipeline project
  discovery_notes TEXT,
  attribution JSONB,                               -- AttributionResult
  stale_since TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Automated follow-up tracking
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  type VARCHAR(50) NOT NULL,                       -- "outreach", "follow_up_1", "follow_up_2", "nurture", "check_in"
  channel VARCHAR(30) NOT NULL,                    -- "email", "sms", "call"
  content TEXT,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  replied_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled',          -- scheduled, sent, opened, replied, bounced
  scheduled_for TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scoring rules (configurable per client)
CREATE TABLE scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  component VARCHAR(20) NOT NULL,                  -- "fit", "intent", "authority", "timing"
  signal VARCHAR(100) NOT NULL,
  points INTEGER NOT NULL,
  condition JSONB,                                 -- evaluation criteria
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enum additions

```sql
ALTER TYPE pipeline_type ADD VALUE 'sales-proposal';

CREATE TYPE lead_stage_enum AS ENUM (
  'new', 'contacted', 'qualified', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
);
```

---

## 6. API Endpoints

```
-- Lead management
GET    /api/sales/:clientId/leads                  → List leads (filterable by stage, score tier)
POST   /api/sales/:clientId/leads                  → Create lead manually
GET    /api/sales/:clientId/leads/:id              → Lead detail with enrichment + score + touchpoints
PATCH  /api/sales/:clientId/leads/:id              → Update lead data
POST   /api/sales/:clientId/leads/:id/rescore      → Trigger re-scoring
POST   /api/sales/:clientId/leads/import           → Bulk import (CSV)

-- Pipeline
GET    /api/sales/:clientId/pipeline               → Pipeline Kanban view (deals by stage)
GET    /api/sales/:clientId/pipeline/metrics        → Pipeline metrics (velocity, conversion rates)
PATCH  /api/sales/:clientId/deals/:id              → Update deal (stage, value, notes)
POST   /api/sales/:clientId/deals/:id/proposal     → Create proposal project from deal

-- Proposals
GET    /api/sales/:clientId/proposals               → List proposals with status
GET    /api/sales/:clientId/proposals/:projectId    → Proposal detail

-- Attribution
GET    /api/sales/:clientId/attribution             → Attribution report (by model)
GET    /api/sales/:clientId/attribution/by-channel  → Revenue attribution per channel
GET    /api/sales/:clientId/attribution/by-campaign → Revenue attribution per campaign

-- Follow-ups
GET    /api/sales/:clientId/follow-ups              → Upcoming follow-ups
PATCH  /api/sales/:clientId/follow-ups/:id          → Mark as completed/cancelled

-- Configuration
GET    /api/sales/:clientId/scoring-rules           → Scoring configuration
PUT    /api/sales/:clientId/scoring-rules           → Update scoring rules
```

---

## 7. Scheduled Tasks

| Task | Schedule | What it does |
|------|----------|-------------|
| `score-decay` | Daily 2am | Reduce scores by 2 points for leads with no activity in 7+ days |
| `stale-deal-check` | Daily 8am | Flag deals past stale threshold, send alerts |
| `follow-up-sender` | Every 15min | Send scheduled follow-ups whose time has arrived |
| `enrichment-retry` | Daily 3am | Re-attempt enrichment for leads where it previously failed |
| `attribution-recalc` | Weekly Sunday | Recalculate attribution for all closed deals with new data |

---

## 8. Context Maps

### How Sales consumes other motors

| Source motor | Data consumed | Used in |
|-------------|--------------|---------|
| **Intelligence** (Brand Listener) | Brand health → sentiment context for proposals | proposal_draft |
| **Intelligence** (Competitive) | Competitor analysis → differentiators for proposals | proposal_draft |
| **Analytics** | Campaign performance → attribution data | attribution |
| **Email Marketing** | Email engagement → intent scoring signals | scoring |
| **Community Mgmt** | Social engagement → intent scoring signals | scoring |
| **Ads** | Ad clicks/conversions → touchpoint tracking | capture, attribution |
| **Brand Guardian** | Brand DNA → proposal branding | proposal_draft, proposal_final |
| **Financial Agent** | Pricing validation → proposal pricing | G1 evaluation |

### How other motors consume Sales

| Consumer motor | What it reads | When |
|---------------|--------------|------|
| **Strategist** | Pipeline metrics, conversion rates | Strategy planning |
| **Analytics** | Deal data, revenue attribution | Dashboard and reports |
| **Email Marketing** | Lead segments by score tier | Campaign targeting |
| **Financial Agent** | Deal value, revenue forecast | Budget planning |

---

## 9. Agent Skill Files

```
agents/
  SL-L_sales_director.md
  SL-001_lead_capture_agent.md
  SL-002_lead_scoring_agent.md
  SL-003_pipeline_manager.md
  SL-004_proposal_writer.md
  SL-005_nurture_specialist.md
  SL-006_attribution_analyst.md
  SL-007_discovery_interviewer.md
```

---

## 10. New Files

| File | Purpose |
|------|---------|
| `src/services/sales/lead-manager.ts` | Lead capture, deduplication, enrichment |
| `src/services/sales/lead-scorer.ts` | BANT scoring engine |
| `src/services/sales/pipeline-manager.ts` | Pipeline stage management, stale detection |
| `src/services/sales/follow-up-engine.ts` | Automated follow-up scheduling and sending |
| `src/services/sales/attribution-engine.ts` | Multi-model attribution calculator |
| `src/services/sales/proposal-generator.ts` | Proposal project creation and template system |
| `src/providers/sales/stub-enrichment.ts` | LLM-based enrichment stub |
| `src/providers/sales/stub-ad-platform.ts` | LLM-based ad platform data stub |
| `src/api/sales-routes.ts` | All sales API endpoints |
| `agents/*.md` (x8) | Agent skill files |

---

## 11. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Lead capture from 3+ sources | Ingest from waitlist, manual entry, and CSV import |
| Enrichment produces useful data | Stub enrichment returns plausible company/contact data |
| Scoring differentiates leads | Hot/warm/cold distribution roughly matches expected ratios |
| Pipeline stages work | Move leads through full funnel, verify transitions |
| Proposal generation end-to-end | From discovery notes to branded proposal with pricing |
| Follow-ups fire on schedule | Set up test follow-ups, verify they send |
| Attribution calculates correctly | Create test deal with 5 touchpoints, verify all 5 models produce correct results |
| Stale detection works | Create deal, wait past threshold, verify alert |
| No regression | Existing pipelines continue working |
