# criteria.agency — Analytics Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Measurement capabilities (C-033 to C-037): Executive Dashboard, Multi-channel Attribution, CAC/LTV Calculation, Automated Reports, Natural Language Queries

---

## 1. Objective

Build the **Analytics Engine** — a continuous measurement system that aggregates data from all motors into unified dashboards, calculates unit economics (CAC/LTV), generates automated reports, and allows natural language queries. This is the "proof of value" layer that justifies marketing investment.

| Capability | What it delivers |
|-----------|-----------------|
| C-033: Dashboard ejecutivo unificado | All marketing KPIs in one place, in simple language |
| C-034: Atribución multicanal | 5 attribution models showing which channels drive results |
| C-035: Cálculo automático de CAC y LTV | Unit economics updated in real-time |
| C-036: Reportes automatizados | Daily/weekly/monthly reports delivered automatically |
| C-037: Reportes en lenguaje natural | Ask anything about your marketing in plain language |

**Dependency:** Analytics consumes data from ALL other motors. It has no hard dependencies but becomes more valuable as more motors are active.

---

## 2. Architecture

### Data Flow

```
[All Motors] → [Data Collectors] → [Analytics Data Store] → [Computation Layer] → [Output Layer]
                                                                    ↓
                                                        [Dashboards | Reports | NL Queries | Alerts]
```

### Components

| Component | Purpose |
|-----------|---------|
| **Data Collectors** | Pull/receive data from each motor into normalized analytics format |
| **Analytics Data Store** | Time-series metrics storage (PostgreSQL tables with partitioning) |
| **Computation Layer** | Attribution models, CAC/LTV calculators, trend analysis |
| **Dashboard Builder** | Generates dashboard configurations per client |
| **Report Generator** | Produces periodic reports (markdown + charts) |
| **NL Query Engine** | Translates natural language to data queries |

---

## 3. Agents

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| AN-L | Analytics Director | leader | report review, NL queries, insight generation | claude-sonnet-4 | 75% |
| AN-001 | Data Collector | sub | data collection, normalization | gemini-2.5-flash | 95% |
| AN-002 | Metrics Analyst | sub | calculations, attribution, CAC/LTV | gemini-2.5-flash | 90% |
| AN-003 | Dashboard Builder | sub | dashboard configuration, widget creation | gemini-2.5-flash | 85% |
| AN-004 | Report Generator | sub | automated report production | gemini-2.5-flash | 85% |
| AN-005 | NL Query Agent | sub | natural language → data query translation | claude-sonnet-4 | 80% |
| AN-006 | Insight Detector | sub | anomaly detection, trend identification | gemini-2.5-flash | 85% |

---

## 4. Capability Details

### 4.1 Executive Dashboard (C-033)

**5 Dashboard types:**

| Dashboard | Audience | Key widgets |
|-----------|----------|-------------|
| **Executive Overview** | CEO/CMO | Total spend, revenue attributed to marketing, ROI, top 3 metrics trending up, top 3 trending down |
| **Channel Performance** | Marketing manager | Per-channel metrics (spend, impressions, clicks, conversions, ROAS), channel comparison |
| **Content Performance** | Content team | Top performing content by engagement, conversion, reach. Content calendar status |
| **Sales Funnel** | Sales team | Leads by stage, conversion rates, deal velocity, pipeline value |
| **Financial** | Finance/Owner | Marketing P&L, CAC/LTV trends, budget utilization, forecast vs actual |

**Widget types:**

| Widget | Data | Visualization |
|--------|------|---------------|
| KPI Card | Single metric + trend | Number with arrow (↑↓) and sparkline |
| Time Series | Metric over time | Line chart with comparison period |
| Bar Chart | Comparison across categories | Horizontal/vertical bars |
| Funnel | Conversion through stages | Funnel visualization |
| Table | Detailed data | Sortable/filterable table |
| Pie/Donut | Distribution | Proportional chart |
| Heatmap | Activity by day/hour | Calendar heatmap |

**Dashboard configuration (per client):**

```typescript
interface DashboardConfig {
  clientId: string;
  dashboardType: string;
  widgets: Array<{
    id: string;
    type: string;            // "kpi_card", "time_series", "bar_chart", etc.
    metric: string;          // "total_spend", "roas", "leads_captured", etc.
    position: { x: number; y: number; w: number; h: number };
    config: {
      comparisonPeriod?: string;  // "previous_period", "previous_year"
      groupBy?: string;           // "channel", "campaign", "content"
      dateRange?: string;         // "7d", "30d", "90d", "ytd"
      filters?: Record<string, string>;
    };
  }>;
  refreshInterval: number;   // seconds
}
```

### 4.2 Multi-channel Attribution (C-034)

The Analytics Engine **owns** attribution computation. The Sales Engine stores touchpoints and deal data, but the actual attribution models run here. The `AttributionResult` stored on each deal in the Sales Engine is computed by the Analytics attribution engine and written back.

Uses the 5 attribution models (first-touch, last-touch, linear, time-decay, position-based) and provides visualization.

**Attribution computation:**

```typescript
interface AttributionEngine {
  calculate(
    deals: Deal[],
    touchpoints: LeadTouchpoint[],
    model: "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based"
  ): AttributionReport;
}

interface AttributionReport {
  model: string;
  period: DateRange;
  totalRevenue: number;
  byChannel: Array<{
    channel: string;
    attributedRevenue: number;
    percentOfTotal: number;
    dealCount: number;
    avgDealSize: number;
    costPerAcquisition: number;
    roas: number;
  }>;
  byCampaign: Array<{
    campaign: string;
    channel: string;
    attributedRevenue: number;
    spend: number;
    roas: number;
  }>;
  pathAnalysis: {
    avgPathLength: number;
    avgTimeToClose: number;
    commonPaths: Array<{
      path: string[];     // ["meta_ads", "email", "organic_search", "direct"]
      frequency: number;
      avgDealValue: number;
    }>;
  };
}
```

### 4.3 CAC & LTV Calculation (C-035)

**CAC (Customer Acquisition Cost):**

```
CAC = Total Marketing & Sales Spend / New Customers Acquired

CAC by channel = Channel Spend / Customers Attributed to Channel
```

**LTV (Lifetime Value):**

```
LTV = Average Revenue Per Customer × Average Customer Lifespan (months)

-- Or cohort-based:
LTV = Σ (Monthly Revenue from Cohort) / Cohort Size
```

**Key metrics computed:**

| Metric | Formula | Target |
|--------|---------|--------|
| CAC (blended) | Total spend / new customers | Track trend |
| CAC by channel | Channel spend / channel customers | Compare channels |
| LTV | ARPU × avg lifespan | LTV:CAC > 3:1 |
| LTV:CAC ratio | LTV / CAC | > 3:1 |
| Payback period | CAC / monthly ARPU | < 12 months |
| Monthly churn | Lost customers / total customers | < 5% |
| Net revenue retention | (Revenue from existing customers this period) / (Revenue from same customers last period) | > 100% |

**Data sources:**

| Metric | Source |
|--------|--------|
| Marketing spend | Financial module (transactions categorized as marketing) |
| Sales spend | Financial module (transactions categorized as sales) |
| New customers | Sales engine (deals closed_won) |
| Revenue per customer | Financial module (income by client) + Stripe subscriptions |
| Customer lifespan | Subscription data (start date, churn date) |
| Channel-attributed customers | Attribution engine |

### 4.4 Automated Reports (C-036)

**Report types:**

| Report | Frequency | Content | Delivery |
|--------|-----------|---------|----------|
| **Daily Pulse** | Daily 8am | Key metrics vs yesterday, alerts, today's scheduled actions | Dashboard + email digest |
| **Weekly Review** | Monday 9am | Week-over-week performance, top/bottom content, budget utilization, anomalies | Full email report + PDF |
| **Monthly Deep Dive** | 1st of month | Month-over-month with commentary, attribution analysis, CAC/LTV update, recommendations | Full report + executive summary |
| **On-demand** | API call | Custom date range, custom metrics | JSON + rendered report |

**Report structure:**

```typescript
interface AutomatedReport {
  clientId: string;
  type: "daily" | "weekly" | "monthly" | "on_demand";
  period: DateRange;
  sections: Array<{
    title: string;
    metrics: Array<{
      name: string;
      value: number;
      previousValue: number;
      change: number;        // percentage
      trend: "up" | "down" | "flat";
      isGood: boolean;       // is the direction positive?
    }>;
    insights: string[];      // AI-generated commentary
    recommendations: string[];
    charts: Array<{
      type: string;
      data: unknown;
    }>;
  }>;
  executiveSummary: string;  // 2-3 sentence TL;DR
  alertsSinceLastReport: Alert[];
  generatedAt: string;
}
```

**Report generation flow:**

```
[Scheduler trigger] → AN-001 collects data → AN-002 computes metrics → AN-006 detects anomalies
    → AN-004 generates report → AN-L reviews and adds insights → [Deliver via email + dashboard]
```

### 4.5 Natural Language Queries (C-037)

**Query flow:**

```
User: "¿Cuánto gastamos en Meta Ads el mes pasado y cuál fue el ROAS?"
    ↓
AN-005: Translates to structured query
    ↓
{ metrics: ["spend", "roas"], filters: { channel: "meta_ads", period: "last_month" } }
    ↓
AN-002: Executes query against analytics data store
    ↓
{ spend: 2500, roas: 3.2, comparison: { previous_month: { spend: 2200, roas: 2.8 } } }
    ↓
AN-005: Generates natural language response
    ↓
"El mes pasado gastamos $2,500 en Meta Ads con un ROAS de 3.2x (por cada dólar invertido,
generamos $3.20 en revenue). Esto es una mejora del 14% vs el mes anterior (ROAS 2.8x).
El gasto subió un 13% ($2,200 → $2,500)."
```

**Query capabilities:**

| Query type | Example | Implementation |
|-----------|---------|---------------|
| Simple metric lookup | "¿Cuántos leads capturamos esta semana?" | Direct DB query |
| Comparison | "¿Cómo se compara nuestro CAC de abril vs marzo?" | Two queries + diff |
| Ranking | "¿Cuáles son nuestros 5 mejores contenidos por engagement?" | Query + sort |
| Trend | "¿El tráfico orgánico está subiendo o bajando?" | Time series + regression |
| Why/Diagnosis | "¿Por qué bajó el ROAS esta semana?" | Multi-factor analysis |
| Recommendation | "¿Dónde debería invertir más presupuesto?" | Attribution + ROAS analysis |

**Interface:**

```typescript
interface NLQueryEngine {
  query(
    clientId: string,
    question: string,
    context?: {
      conversationHistory?: string[];
      dashboardContext?: string;
    }
  ): Promise<NLQueryResult>;
}

interface NLQueryResult {
  answer: string;              // Natural language response
  data: Record<string, unknown>; // Raw data used
  charts: Array<{              // Suggested visualizations
    type: string;
    data: unknown;
    title: string;
  }>;
  confidence: number;          // 0-1 confidence in answer
  followUpSuggestions: string[]; // "También podrías preguntar..."
}
```

---

## 5. External Data Interfaces

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `GoogleAnalyticsProvider` | Traffic, page views, events, conversions | LLM generates sample GA data | GA4 Data API |
| `MetaAdsProvider` | Campaigns, ad sets, spend, ROAS | LLM generates sample Meta data | Meta Marketing API |
| `GoogleAdsProvider` | Campaigns, keywords, spend, conversions | LLM generates sample Google Ads data | Google Ads API |
| `StripeRevenueProvider` | Subscriptions, MRR, churn | Real data from existing Stripe integration | Already integrated |
| `InternalMotorProvider` | Execution data from all criteria.agency motors | Real data from `agentExecutions` + `artifacts` tables | Already available |

**Interface contract:**

```typescript
interface AnalyticsDataProvider {
  name: string;
  source: string;
  fetchMetrics(
    clientId: string,
    metrics: string[],
    dateRange: DateRange,
    dimensions?: string[]
  ): Promise<MetricDataPoint[]>;
  isAvailable(): boolean;
}

interface MetricDataPoint {
  date: string;
  metric: string;
  value: number;
  dimensions: Record<string, string>;
  source: string;
}

interface DateRange {
  start: string;  // ISO 8601
  end: string;
}
```

---

## 6. Database Changes

### New tables

```sql
-- Aggregated metrics store (time-series)
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  date DATE NOT NULL,
  metric VARCHAR(100) NOT NULL,         -- "spend_total", "leads_captured", "roas_meta", etc.
  value NUMERIC(14,4) NOT NULL,
  dimensions JSONB DEFAULT '{}',        -- { "channel": "meta_ads", "campaign": "spring_2026" }
  source VARCHAR(50) NOT NULL,          -- "meta_ads", "google_ads", "internal", "stripe", etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast time-series queries
CREATE INDEX idx_analytics_metrics_lookup
  ON analytics_metrics (client_id, metric, date);
CREATE INDEX idx_analytics_metrics_source
  ON analytics_metrics (client_id, source, date);

-- Dashboard configurations
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  dashboard_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,                -- DashboardConfig object
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated reports
CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  type VARCHAR(30) NOT NULL,            -- "daily", "weekly", "monthly", "on_demand"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content JSONB NOT NULL,               -- AutomatedReport object
  rendered_markdown TEXT,
  delivered_via TEXT[],                  -- ["email", "dashboard"]
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NL query history
CREATE TABLE nl_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  data JSONB,
  confidence NUMERIC(3,2),
  feedback VARCHAR(20),                 -- "helpful", "not_helpful", null
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. API Endpoints

```
-- Dashboards
GET    /api/analytics/:clientId/dashboard/:type     → Dashboard data (executive, channel, content, funnel, financial)
GET    /api/analytics/:clientId/dashboard/config     → Dashboard configurations
PUT    /api/analytics/:clientId/dashboard/config     → Update dashboard layout/widgets

-- Metrics
GET    /api/analytics/:clientId/metrics              → Query specific metrics (params: metrics[], dateRange, dimensions)
GET    /api/analytics/:clientId/metrics/compare      → Compare periods

-- Attribution
GET    /api/analytics/:clientId/attribution          → Attribution report (param: model)
GET    /api/analytics/:clientId/attribution/paths    → Common conversion paths

-- Unit economics
GET    /api/analytics/:clientId/unit-economics       → CAC, LTV, ratios, trends
GET    /api/analytics/:clientId/unit-economics/cohorts → Cohort-based LTV analysis

-- Reports
GET    /api/analytics/:clientId/reports              → List generated reports
GET    /api/analytics/:clientId/reports/:id          → Specific report
POST   /api/analytics/:clientId/reports/generate     → Generate on-demand report

-- NL Queries
POST   /api/analytics/:clientId/query               → Ask a question in natural language
GET    /api/analytics/:clientId/query/history        → Previous queries
POST   /api/analytics/:clientId/query/:id/feedback   → Rate answer quality

-- Data collection
POST   /api/analytics/:clientId/collect              → Trigger data collection cycle
GET    /api/analytics/:clientId/sources              → Connected data sources + health
```

---

## 8. Scheduled Tasks

| Task | Schedule | What it does |
|------|----------|-------------|
| `collect-internal-metrics` | Daily 1am | Aggregate metrics from internal motors (executions, artifacts, costs) |
| `collect-external-metrics` | Daily 2am | Pull data from external providers (GA, Meta, Google Ads) |
| `compute-attribution` | Daily 3am | Recalculate attribution for recent deal closures |
| `compute-unit-economics` | Daily 4am | Recalculate CAC, LTV, ratios |
| `detect-anomalies` | Daily 5am | Run anomaly detection on all key metrics |
| `generate-daily-report` | Daily 8am | Generate and deliver daily pulse |
| `generate-weekly-report` | Monday 9am | Generate and deliver weekly review |
| `generate-monthly-report` | 1st of month 9am | Generate and deliver monthly deep dive |

---

## 9. New Files

| File | Purpose |
|------|---------|
| `src/services/analytics/data-collector.ts` | Aggregates data from all sources into analytics_metrics |
| `src/services/analytics/attribution-engine.ts` | 5 attribution model implementations |
| `src/services/analytics/unit-economics.ts` | CAC, LTV, ratio calculations |
| `src/services/analytics/dashboard-builder.ts` | Dashboard config management and data assembly |
| `src/services/analytics/report-generator.ts` | Automated report production |
| `src/services/analytics/nl-query-engine.ts` | Natural language query processing |
| `src/services/analytics/anomaly-detector.ts` | Statistical anomaly detection |
| `src/providers/analytics/stub-ga.ts` | Google Analytics stub |
| `src/providers/analytics/stub-meta-ads.ts` | Meta Ads stub |
| `src/providers/analytics/stub-google-ads.ts` | Google Ads stub |
| `src/api/analytics-routes.ts` | All analytics API endpoints |
| `agents/AN-*.md` (x7) | Agent skill files |

---

## 10. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Dashboard renders with real internal data | Executive dashboard shows actual project/agent/cost data |
| Dashboard renders with stub external data | Channel dashboard shows plausible stub data |
| Attribution calculates correctly | 5 models produce correct results for test scenarios |
| CAC/LTV computes with available data | Uses Stripe + financial module data for real calculations |
| Daily report generates | Automated daily pulse with metrics and insights |
| Weekly report generates | Automated weekly review with commentary |
| NL query answers correctly | "¿Cuántos proyectos completamos este mes?" returns correct count |
| NL query handles comparisons | "¿Cómo se compara este mes vs el anterior?" returns correct diff |
| Anomaly detection works | Inject a 3x spike, verify alert fires |
| No regression | Existing dashboards and finance module continue working |
