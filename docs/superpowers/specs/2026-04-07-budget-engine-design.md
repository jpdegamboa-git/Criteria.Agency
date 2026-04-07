# criteria.agency — Budget & Financial Control Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Budget capabilities (C-038 to C-041): Smart Budget Allocation, Spending Control, Vendor Validation, Marketing ROI

---

## 1. Objective

Build the **Budget Engine** — a financial control layer for the client's marketing investment. This extends the existing internal financial module (bank transactions, categorization, reconciliation) into a **client-facing marketing finance system** that optimizes budget allocation, controls spending, validates vendors, and proves ROI.

| Capability | What it delivers |
|-----------|-----------------|
| C-038: Asignación inteligente de presupuesto | Optimal budget distribution by channel × funnel stage using M6 frameworks |
| C-039: Control de gasto por campaña | Real-time spend tracking vs budget with alerts |
| C-040: Validación de proveedores y costos | Vendor comparison, price validation, performance tracking |
| C-041: Marketing como inversión | Campaign P&L, ROI calculation, investment justification reports |

**Dependency:** Consumes data from Analytics (attribution, metrics), Sales (deal data), Ads (spend data), and the existing Financial module.

---

## 2. Architecture

### Relationship to existing Financial module

The existing financial module handles **criteria.agency's own finances** (bank transactions, reconciliation, subscriptions). The Budget Engine handles the **client's marketing finances** — a different scope:

| Existing Financial Module | Budget Engine (new) |
|--------------------------|-------------------|
| criteria.agency's bank transactions | Client's marketing budget allocation |
| Internal revenue/expense tracking | Client's campaign spend tracking |
| Subscription billing | Client's vendor costs |
| Internal P&L | Client's marketing P&L |

They share the same `Financial Agent` transversal but operate on different data.

> **Relationship to XA-001:** The transversal Financial Agent stub (XA-001) from the strategy-engines-design is a lightweight gate evaluator that validates budgets are reasonable. The Budget Engine agents (BU-*) are the full implementation. BU-L **supersedes XA-001** — when the Budget Engine is active, gate evaluations that previously called XA-001 should call BU-L instead. XA-001 remains as a fallback stub for clients without the Budget Engine enabled.

### Components

```
[Budget Planner] → [Budget Allocator] → [Spend Monitor] → [ROI Calculator]
                                              ↓
                              [Vendor Manager] ← [Marketplace data]
```

---

## 3. Agents

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| BU-L | Budget Director | leader | allocation review, ROI analysis, vendor decisions | claude-sonnet-4 | 70% |
| BU-001 | Budget Allocator | sub | budget distribution, rebalancing | gemini-2.5-flash | 80% |
| BU-002 | Spend Monitor | sub | real-time tracking, alerts | gemini-2.5-flash | 90% |
| BU-003 | Vendor Analyst | sub | price comparison, vendor scoring | gemini-2.5-flash | 85% |
| BU-004 | ROI Analyst | sub | P&L computation, investment reports | gemini-2.5-flash | 85% |

---

## 4. Capability Details

### 4.1 Smart Budget Allocation (C-038)

**Allocation framework (Harvard M6):**

```
Total Marketing Budget
    ├── By Funnel Stage
    │   ├── Awareness (top): 30-40%
    │   ├── Consideration (middle): 25-35%
    │   └── Conversion (bottom): 25-35%
    │
    └── By Channel (within each stage)
        ├── Paid Media: Meta Ads, Google Ads, TikTok, LinkedIn
        ├── Owned Media: Email, SEO/Content, Website, Social
        └── Earned Media: PR, Influencer, Community
```

**Allocation algorithm:**

```typescript
interface BudgetAllocation {
  clientId: string;
  totalBudget: number;
  currency: string;
  period: DateRange;
  strategy: "growth" | "efficiency" | "balanced";  // affects distribution
  allocations: Array<{
    channel: string;
    funnelStage: "awareness" | "consideration" | "conversion";
    amount: number;
    percentOfTotal: number;
    rationale: string;            // AI explanation
    expectedRoas: number;         // projected return
    historicalRoas: number | null; // actual if available
    confidence: number;           // 0-1 (higher with more data)
  }>;
  constraints: {
    minPerChannel: number;        // minimum viable spend per channel
    maxPerChannel: number;        // cap per channel
    fixedAllocations: Array<{     // locked budgets (e.g., ongoing retainer)
      channel: string;
      amount: number;
      reason: string;
    }>;
  };
  recommendations: string[];      // AI recommendations for optimization
}
```

**Rebalancing triggers:**
- Monthly review (scheduled)
- Channel ROAS drops below threshold
- New channel opportunity detected (from Analytics)
- Budget increase/decrease by client
- Campaign end (reallocate freed budget)

### 4.2 Spending Control (C-039)

**Real-time budget tracking:**

```typescript
interface SpendTracker {
  clientId: string;
  period: DateRange;
  overall: {
    budgeted: number;
    spent: number;
    remaining: number;
    burnRate: number;         // $/day
    projectedOverspend: number | null;
    daysUntilExhausted: number | null;
  };
  byChannel: Array<{
    channel: string;
    budgeted: number;
    spent: number;
    remaining: number;
    roas: number;
    status: "on_track" | "underspend" | "overspend" | "exhausted";
  }>;
  byCampaign: Array<{
    campaignId: string;
    name: string;
    channel: string;
    budgeted: number;
    spent: number;
    roas: number;
    status: string;
  }>;
}
```

**Alert rules:**

| Alert | Condition | Severity |
|-------|-----------|----------|
| Channel overspend | Spent > 90% of channel budget with > 10 days remaining | warning |
| Channel exhausted | Spent = 100% of channel budget | critical |
| Low ROAS | Channel ROAS < 1.0 for 7+ consecutive days | warning |
| Budget pace | Overall burn rate projects exhaustion before period end | warning |
| Underspend | Channel spent < 50% of budget with < 10 days remaining | info |

### 4.3 Vendor Validation (C-040)

**Vendor management scope:**

Vendors that criteria.agency clients interact with: media companies (TV, radio, print), event venues, print shops, photographers, influencers, freelancers.

**Vendor scoring model:**

```typescript
interface VendorScore {
  vendorId: string;
  name: string;
  category: string;          // "media", "print", "events", "freelance", "influencer"
  overallScore: number;      // 0-100
  components: {
    quality: number;         // 0-25 — quality of deliverables
    price: number;           // 0-25 — competitiveness vs market
    reliability: number;     // 0-25 — on-time delivery, responsiveness
    value: number;           // 0-25 — cost-effectiveness (quality/price)
  };
  history: {
    projectsCompleted: number;
    avgDeliveryTime: number; // days
    onTimeRate: number;      // 0-1
    avgPriceVsMarket: number; // ratio (1.0 = market rate, <1 = cheaper)
  };
  quotations: Array<{
    date: string;
    service: string;
    quotedPrice: number;
    marketAverage: number;
    verdict: "fair" | "above_market" | "below_market";
  }>;
}
```

**Price validation flow:**

```
[Client needs vendor service] → BU-003 checks market rates → Compares quotation
    → Returns: "fair" / "above market by X%" / "below market (verify quality)"
```

**External data interface:**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `MarketRateProvider` | Average pricing for services by category and region | LLM generates market rate estimates based on service type + region | Industry rate databases, vendor platforms |

**Interface contract:**

```typescript
interface MarketRateProvider {
  name: string;
  getRate(
    service: string,         // "30-second TV spot", "1000 flyers A4", "corporate video"
    region: string,
    specifications: Record<string, unknown>
  ): Promise<MarketRate>;
  isAvailable(): boolean;
}

interface MarketRate {
  service: string;
  region: string;
  low: number;
  median: number;
  high: number;
  currency: string;
  source: string;
  confidence: number;       // 0-1
  lastUpdated: string;
}
```

### 4.4 Marketing as Investment (C-041)

**Campaign P&L:**

```typescript
interface CampaignPnL {
  campaignId: string;
  name: string;
  period: DateRange;
  revenue: {
    attributed: number;           // from attribution model
    model: string;                // which attribution model used
    confidence: number;
  };
  costs: {
    adSpend: number;
    contentProduction: number;    // design, video, copy costs
    vendorCosts: number;          // external vendors
    platformFees: number;         // tool subscriptions
    laborCost: number;            // criteria.agency subscription cost allocated
    total: number;
  };
  metrics: {
    roi: number;                  // (revenue - costs) / costs
    roas: number;                 // revenue / ad spend only
    grossMargin: number;          // (revenue - costs) / revenue
    profitLoss: number;           // revenue - costs
    cpa: number;                  // costs / conversions
    revenuePerLead: number;
  };
  comparison: {
    previousPeriod: Partial<CampaignPnL>;
    benchmark: {                  // industry benchmarks
      avgRoi: number;
      avgRoas: number;
    };
  };
}
```

**Investment justification report:**

Generated monthly (or on-demand) for client to present to leadership:
1. Executive Summary — total marketing investment, total attributed revenue, overall ROI
2. Channel Performance — which channels are generating return, which aren't
3. Trend Analysis — ROI trending up/down, CAC improving/worsening
4. Recommendations — where to invest more, where to cut
5. Forward Projection — expected returns based on current trajectory

---

## 5. Database Changes

### New tables

```sql
-- Client marketing budgets
CREATE TABLE marketing_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_budget NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  strategy VARCHAR(20) DEFAULT 'balanced',   -- "growth", "efficiency", "balanced"
  allocations JSONB NOT NULL,                -- BudgetAllocation.allocations
  constraints JSONB,                          -- BudgetAllocation.constraints
  status VARCHAR(20) DEFAULT 'active',       -- draft, active, closed
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign spend tracking
CREATE TABLE campaign_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  budget_id UUID REFERENCES marketing_budgets(id),
  campaign_name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  source VARCHAR(50) NOT NULL,               -- "meta_ads", "google_ads", "manual", "vendor_invoice"
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaign_spend_lookup
  ON campaign_spend (client_id, budget_id, date);

-- Vendor registry (client's vendors)
CREATE TABLE client_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,             -- "media", "print", "events", "freelance", "influencer"
  contact_info JSONB,
  score JSONB,                                -- VendorScore
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor quotations
CREATE TABLE vendor_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES client_vendors(id),
  client_id UUID NOT NULL REFERENCES user(id),
  service_description TEXT NOT NULL,
  quoted_price NUMERIC(10,2) NOT NULL,
  market_rate JSONB,                          -- MarketRate
  verdict VARCHAR(20),                        -- "fair", "above_market", "below_market"
  status VARCHAR(20) DEFAULT 'pending',      -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign P&L
CREATE TABLE campaign_pnl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  campaign_name VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue JSONB NOT NULL,                     -- attributed revenue data
  costs JSONB NOT NULL,                       -- cost breakdown
  metrics JSONB NOT NULL,                     -- computed ROI, ROAS, etc.
  generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API Endpoints

```
-- Budget allocation
GET    /api/budget/:clientId/current               → Current active budget
POST   /api/budget/:clientId/allocate              → Create new budget allocation
PUT    /api/budget/:clientId/:budgetId             → Update allocation
POST   /api/budget/:clientId/:budgetId/rebalance   → Trigger AI rebalancing

-- Spend tracking
GET    /api/budget/:clientId/spend                 → Current spend vs budget (overall + by channel)
GET    /api/budget/:clientId/spend/by-campaign     → Spend by campaign
POST   /api/budget/:clientId/spend                 → Record manual spend entry
GET    /api/budget/:clientId/spend/forecast        → Projected spend through period end

-- Vendor management
GET    /api/budget/:clientId/vendors               → List client vendors with scores
POST   /api/budget/:clientId/vendors               → Add vendor
GET    /api/budget/:clientId/vendors/:id           → Vendor detail with history
POST   /api/budget/:clientId/vendors/:id/quote     → Submit quotation for validation
GET    /api/budget/:clientId/vendors/compare        → Compare vendors for a service

-- ROI / P&L
GET    /api/budget/:clientId/pnl                   → Marketing P&L (aggregate)
GET    /api/budget/:clientId/pnl/by-campaign       → P&L per campaign
GET    /api/budget/:clientId/roi-report            → Investment justification report
GET    /api/budget/:clientId/roi-report/export     → PDF export of ROI report
```

---

## 7. Scheduled Tasks

| Task | Schedule | What it does |
|------|----------|-------------|
| `collect-ad-spend` | Daily 2am | Pull spend data from ad platforms (via Analytics providers) |
| `check-budget-alerts` | Daily 8am | Evaluate all budget alert rules, fire alerts |
| `monthly-pnl` | 1st of month 5am | Generate campaign P&L for previous month |
| `rebalancing-check` | Weekly Sunday 3am | Check if any channel ROAS warrants rebalancing suggestion |
| `vendor-score-update` | Monthly 1st 4am | Recalculate vendor scores based on recent history |

---

## 8. Context Maps

| Source | Data consumed | Used in |
|--------|-------------|---------|
| **Analytics** | Attribution data, channel metrics | Budget allocation rationale, ROI calculations |
| **Sales** | Deal data, revenue | P&L revenue side |
| **Ads** | Ad platform spend | Spend tracking, ROAS |
| **Financial module** | criteria.agency costs | Internal cost allocation |
| **Marketplace** | Vendor history | Vendor scoring |
| **Strategist** | Budget step output | Initial allocation framework |

---

## 9. New Files

| File | Purpose |
|------|---------|
| `src/services/budget/allocator.ts` | Budget allocation engine with M6 frameworks |
| `src/services/budget/spend-monitor.ts` | Real-time spend tracking and alerts |
| `src/services/budget/vendor-manager.ts` | Vendor scoring, price validation |
| `src/services/budget/roi-calculator.ts` | Campaign P&L and ROI computation |
| `src/providers/budget/stub-market-rates.ts` | LLM-based market rate stub |
| `src/api/budget-routes.ts` | All budget API endpoints |
| `agents/BU-*.md` (x5) | Agent skill files |

---

## 10. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Budget allocation produces reasonable distribution | Given a $10K budget, allocator distributes across channels with rationale |
| Spend tracking updates from ad stubs | Daily spend collection runs, dashboard reflects data |
| Budget alerts fire correctly | Set a $1000 budget, record $950 spend, verify overspend warning |
| Vendor scoring differentiates | Score 3 test vendors, verify scores reflect different quality/price profiles |
| Price validation works | Submit quotation, get "fair" / "above market" verdict with market data |
| Campaign P&L computes | Create campaign with spend + attributed revenue, verify ROI calculation |
| Investment report generates | Monthly report produces executive summary + channel breakdown |
| No regression | Financial module continues working independently |
