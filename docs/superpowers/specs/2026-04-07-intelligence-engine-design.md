# criteria.agency — Intelligence Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Intelligence capabilities (C-023 to C-027): Brand Listening, Culture Listening, Industry Intelligence, Competitive Monitoring, Opportunity Detection

---

## 1. Objective

Build the **Intelligence Engine** — a continuous monitoring system with 4 specialized Listeners and 1 Opportunity Agent that feed real-time context to all other motors. This replaces the LLM-only stubs defined in `strategy-engines-design.md` with a full pipeline capable of ingesting external data.

| Capability | What it delivers |
|-----------|-----------------|
| C-023: Escucha de marca | Continuous brand mention monitoring with sentiment analysis and crisis alerts |
| C-024: Escucha cultural | Trend detection, viral topics, and social movements relevant to the audience |
| C-025: Inteligencia de industria | Industry publications, reports, patents, and innovation tracking |
| C-026: Monitoreo competitivo | Competitor activity tracking: campaigns, launches, pricing, content |
| C-027: Detección de oportunidades | Cross-listener intelligence fusion producing actionable opportunities with time windows |

**Dependency chain:** C-023/C-024/C-025/C-026 (independent Listeners) → C-027 (Opportunity Agent consumes all 4)

---

## 2. Architecture: Continuous Agent Pattern

### Problem

Current motors are project-based: start → steps → gates → end. Listeners are **continuous** — they run on schedules, ingest external data, produce periodic reports, and trigger alerts when thresholds are crossed.

### Solution: ContinuousAgentRunner

A new execution pattern alongside the existing project pipeline:

```
[Schedule trigger] → [Data Collection] → [Analysis] → [Report Generation] → [Alert Evaluation]
       ↑                                                                           |
       └─────────────── [Wait for next cycle] ──────────────────────────────────────┘
```

### New infrastructure

| Component | Purpose |
|-----------|---------|
| `ContinuousAgentRunner` | Executes agents on schedule, manages data collection + analysis cycles |
| `continuousAgentRuns` table | Tracks each execution cycle with status, timing, artifacts |
| `alertRules` table | Configurable thresholds per client per listener (e.g., negative sentiment > 30%) |
| `alerts` table | Fired alerts with severity, context, and resolution status |
| `dataSourceConfigs` table | Per-client configuration of what to monitor (brand names, competitors, keywords) |

### Execution modes

| Mode | Trigger | Use case |
|------|---------|----------|
| **Scheduled** | Cron (daily/weekly) | Regular monitoring cycles |
| **On-demand** | API call | Client requests fresh analysis |
| **Event-driven** | Alert from another listener | Opportunity Agent triggered when any listener fires an alert |

---

## 3. Listener Agents

### 3.1 Brand Listener (C-023)

**Pipeline:** `collect → analyze → report → alert_eval`

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| BL-L | Brand Intelligence Lead | leader | analyze, report | claude-sonnet-4 | 75% |
| BL-001 | Mention Scanner | sub | collect | gemini-2.5-flash | 90% |
| BL-002 | Sentiment Analyst | sub | analyze | gemini-2.5-flash | 85% |

**Step details:**

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| collect | BL-001 | Fetches brand mentions from configured data sources. Deduplicates, normalizes, timestamps | dataSourceConfigs (brand names, social handles, domains) | Raw mentions (json array) |
| analyze | BL-L, BL-002 | Sentiment analysis (positive/neutral/negative/mixed), topic clustering, volume trends, anomaly detection | Raw mentions, historical baseline | Analyzed mentions with sentiment scores, topic clusters, trend data (json) |
| report | BL-L | Generates Brand Health Report: overall sentiment, volume vs baseline, top topics, notable mentions, crisis signals | Analyzed data, Brand DNA, previous reports | Brand Health Report (markdown), Brand Health Score (json: 0-100) |
| alert_eval | BL-L | Evaluates alert rules: sentiment drop >20%, volume spike >3x, crisis keywords detected | Report, alert rules | Alerts (if triggered) |

**Schedule:** Daily (default), configurable per client. Crisis detection runs on every collect cycle.

**External data interfaces:**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `SocialMentionProvider` | Brand mentions from social media (Twitter/X, Instagram, Facebook, LinkedIn, TikTok) | LLM generates synthetic mentions based on brand + industry | Brandwatch, Mention, or Sprout Social API |
| `WebMentionProvider` | News articles, blog posts, forum discussions mentioning the brand | LLM generates plausible web mentions | Google Alerts API, NewsAPI, or custom web scraper |
| `ReviewProvider` | Customer reviews from Google, Trustpilot, industry-specific sites | LLM generates sample reviews | Google Places API, Trustpilot API |

**Interface contract (all providers):**

```typescript
interface MentionProvider {
  name: string;
  fetch(config: DataSourceConfig): Promise<RawMention[]>;
  isAvailable(): boolean;
}

interface RawMention {
  source: string;        // "twitter", "instagram", "news", "review"
  text: string;
  author: string;
  url: string;
  timestamp: string;     // ISO 8601
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  metadata: Record<string, unknown>;
}

interface DataSourceConfig {
  clientId: string;
  brandNames: string[];     // ["Criteria", "criteria.agency"]
  socialHandles: string[];  // ["@criteria_agency"]
  competitors: string[];    // For relative comparison
  keywords: string[];       // Additional terms to track
  languages: string[];      // ["es", "en"]
  regions: string[];        // ["PA", "LATAM"]
}
```

---

### 3.2 Culture Listener (C-024)

**Pipeline:** `collect → analyze → report → alert_eval`

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| CL-L | Culture Intelligence Lead | leader | analyze, report | claude-sonnet-4 | 75% |
| CL-001 | Trend Scanner | sub | collect | gemini-2.5-flash | 90% |
| CL-002 | Relevance Analyst | sub | analyze | gemini-2.5-flash | 85% |

**Step details:**

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| collect | CL-001 | Scans trending topics, viral content, social movements, cultural moments | dataSourceConfigs (industry, audience demographics, regions) | Raw trends (json array) |
| analyze | CL-L, CL-002 | Relevance scoring: how relevant is each trend to the client's brand, audience, and industry. Categorizes: leverageable, monitor-only, risk | Raw trends, Brand DNA, buyer personas | Analyzed trends with relevance scores, categories, suggested angles (json) |
| report | CL-L | Culture Pulse Report: top trends, relevance map, content opportunities, risks to avoid | Analyzed trends, previous reports | Culture Pulse Report (markdown) |
| alert_eval | CL-L | Evaluates: high-relevance trend detected (score >0.8), viral moment with brand alignment, cultural risk | Report, alert rules | Alerts (if triggered) → feeds Opportunity Agent |

**Schedule:** Daily for trending topics, weekly for deep cultural analysis.

**External data interfaces:**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `TrendProvider` | Trending topics by region/category | LLM generates plausible trends for industry + region | Google Trends API, Twitter/X Trends API |
| `ViralContentProvider` | Viral posts/videos/memes with engagement data | LLM generates sample viral content | CrowdTangle, TikTok API, social listening tools |
| `NewsAggregator` | Cultural news, social movements, events | LLM generates relevant news items | NewsAPI, Google News, RSS feeds |

**Interface contract:**

```typescript
interface TrendProvider {
  name: string;
  fetchTrends(config: CultureConfig): Promise<RawTrend[]>;
  isAvailable(): boolean;
}

interface RawTrend {
  topic: string;
  description: string;
  source: string;          // "google_trends", "twitter", "tiktok", "news"
  region: string;
  category: string;        // "social_movement", "viral_meme", "cultural_event", "industry_shift"
  volume: number;          // Relative popularity 0-100
  velocity: number;        // Growth rate (% change)
  timestamp: string;
  sampleContent: string[]; // Example posts/articles
}

interface CultureConfig {
  clientId: string;
  industries: string[];
  audienceDemographics: {
    ageRange: [number, number];
    regions: string[];
    interests: string[];
  };
  languages: string[];
}
```

---

### 3.3 Industry Listener (C-025)

**Pipeline:** `collect → analyze → report → alert_eval`

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| IL-L | Industry Intelligence Lead | leader | analyze, report | claude-sonnet-4 | 75% |
| IL-001 | Research Scanner | sub | collect | gemini-2.5-flash | 90% |
| IL-002 | Trend Analyst | sub | analyze | gemini-2.5-flash | 85% |

**Step details:**

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| collect | IL-001 | Scans industry publications, research papers, patent filings, conference proceedings, regulatory changes | dataSourceConfigs (industry, sub-sectors, key players) | Raw intelligence (json array) |
| analyze | IL-L, IL-002 | Impact analysis: categorizes signals as innovation, regulation, market shift, M&A, threat. Scores relevance and urgency | Raw intelligence, client industry profile | Analyzed signals with impact scores, categories, implications (json) |
| report | IL-L | Industry Intelligence Report: top signals, innovation map, regulatory changes, market shifts, strategic implications | Analyzed signals, previous reports | Industry Intelligence Report (markdown) |
| alert_eval | IL-L | Evaluates: high-impact regulatory change, disruptive innovation, market shift relevant to client | Report, alert rules | Alerts (if triggered) |

**Schedule:** Weekly (default). Regulatory alerts: daily.

**External data interfaces:**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `PublicationProvider` | Industry publications, whitepapers, reports | LLM generates industry insights from general knowledge | Industry-specific APIs, Google Scholar, arXiv |
| `PatentProvider` | Patent filings in relevant categories | LLM generates plausible patent descriptions | Google Patents API, USPTO API |
| `RegulatoryProvider` | New regulations, policy changes | LLM generates relevant regulatory updates | Government RSS feeds, LexisNexis |

**Interface contract:**

```typescript
interface IntelligenceProvider {
  name: string;
  fetch(config: IndustryConfig): Promise<RawIntelligence[]>;
  isAvailable(): boolean;
}

interface RawIntelligence {
  title: string;
  summary: string;
  source: string;
  sourceType: "publication" | "patent" | "regulation" | "conference" | "news";
  url: string;
  publishDate: string;
  relevantEntities: string[];  // Companies, technologies, products mentioned
  metadata: Record<string, unknown>;
}

interface IndustryConfig {
  clientId: string;
  primaryIndustry: string;
  subSectors: string[];
  keyPlayers: string[];      // Companies to track
  technologies: string[];    // Technologies to monitor
  regions: string[];
}
```

---

### 3.4 Competitive Listener (C-026)

**Pipeline:** `collect → analyze → report → alert_eval`

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| CO-L | Competitive Intelligence Lead | leader | analyze, report | claude-sonnet-4 | 75% |
| CO-001 | Competitor Scanner | sub | collect | gemini-2.5-flash | 90% |
| CO-002 | Gap Analyst | sub | analyze | gemini-2.5-flash | 85% |

**Step details:**

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| collect | CO-001 | Monitors competitor websites, social media, ad campaigns, hiring, PR, product changes, pricing | dataSourceConfigs (competitor list, channels to watch) | Raw competitive signals (json array) |
| analyze | CO-L, CO-002 | Categorizes signals (campaign, product, pricing, hiring, PR). Identifies gaps and opportunities. Maps competitive positioning changes | Raw signals, previous competitive map, Brand DNA | Analyzed signals with gap analysis, positioning shifts, opportunity windows (json) |
| report | CO-L | Competitive Intelligence Report: activity summary per competitor, positioning map, gaps identified, recommended responses | Analyzed signals, previous reports | Competitive Report (markdown), Competitive Map (json) |
| alert_eval | CO-L | Evaluates: competitor launches new product, significant pricing change, aggressive campaign in client's territory | Report, alert rules | Alerts (if triggered) → feeds Opportunity Agent |

**Schedule:** Weekly (default). Ad/social monitoring: daily.

**External data interfaces:**

| Interface | Data needed | Stub behavior | Real integration |
|-----------|-------------|---------------|-----------------|
| `CompetitorWebProvider` | Competitor website changes (products, pricing, features) | LLM generates plausible competitor activities | BuiltWith, SimilarWeb, custom scrapers |
| `CompetitorAdProvider` | Competitor ad campaigns (creative, spend estimates, targeting) | LLM generates sample competitor ads | Meta Ad Library API, Google Ads Transparency, SimilarWeb |
| `CompetitorSocialProvider` | Competitor social media activity and engagement | LLM generates competitor social profiles | Social listening tools (same as Brand Listener) |
| `CompetitorJobProvider` | Competitor hiring patterns (signal of strategic direction) | LLM generates hiring insights | LinkedIn API, Indeed API |

**Interface contract:**

```typescript
interface CompetitorProvider {
  name: string;
  fetch(config: CompetitorConfig): Promise<RawCompetitorSignal[]>;
  isAvailable(): boolean;
}

interface RawCompetitorSignal {
  competitorName: string;
  signalType: "campaign" | "product" | "pricing" | "hiring" | "pr" | "content" | "partnership";
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: string;
  impact: "high" | "medium" | "low";
  metadata: Record<string, unknown>;
}

interface CompetitorConfig {
  clientId: string;
  competitors: Array<{
    name: string;
    website: string;
    socialHandles: Record<string, string>;  // platform → handle
    industry: string;
  }>;
  channelsToWatch: string[];  // ["website", "social", "ads", "hiring", "pr"]
}
```

---

### 3.5 Opportunity Agent (C-027)

**Pipeline:** `aggregate → evaluate → generate → prioritize`

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| OA-L | Opportunity Director | leader | evaluate, prioritize | claude-sonnet-4 | 70% |
| OA-001 | Opportunity Scanner | sub | aggregate | gemini-2.5-flash | 85% |
| OA-002 | Brief Generator | sub | generate | gemini-2.5-flash | 80% |

**Step details:**

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| aggregate | OA-001 | Collects latest reports from all 4 Listeners. Identifies intersections: trend + gap + audience fit | Latest reports from BL, CL, IL, CO; Brand DNA; Buyer Personas | Aggregated signals with intersection map (json) |
| evaluate | OA-L | Scores each potential opportunity: brand fit (0-100), audience relevance (0-100), time sensitivity (hours/days/weeks), effort required (low/medium/high), expected impact (low/medium/high) | Aggregated signals, historical opportunity performance | Scored opportunities (json) |
| generate | OA-002 | For top opportunities (score >70), generates an action brief: what to do, which motors to activate, suggested timeline, estimated budget | Scored opportunities, channel specs | Opportunity Briefs (markdown per opportunity) |
| prioritize | OA-L | Final prioritization considering: active campaigns (avoid conflicts), budget availability, team capacity. Produces daily opportunity feed | Opportunity briefs, active projects, budget status | Daily Opportunity Feed (markdown), Priority alerts for time-sensitive items |

**Trigger modes:**
- **Scheduled:** Daily morning run aggregating overnight listener data
- **Event-driven:** Immediate run when any listener fires a high-severity alert
- **On-demand:** Client requests fresh opportunity scan

**No external interfaces needed** — consumes outputs from the 4 Listeners only.

---

## 4. Database Changes

### New tables

```sql
-- Continuous agent execution tracking
CREATE TABLE continuous_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  agent_id VARCHAR(20) NOT NULL,        -- "BL-001", "CL-L", etc.
  listener_type VARCHAR(30) NOT NULL,    -- "brand", "culture", "industry", "competitive", "opportunity"
  step VARCHAR(30) NOT NULL,             -- "collect", "analyze", "report", "alert_eval"
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  input_data JSONB,
  output_data JSONB,
  artifacts_produced TEXT[],             -- artifact IDs
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cost_usd NUMERIC(10,4),
  error TEXT,
  cycle_id UUID NOT NULL,               -- groups steps of a single cycle
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert configuration per client per listener
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  listener_type VARCHAR(30) NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  condition JSONB NOT NULL,              -- { "metric": "sentiment_score", "operator": "<", "value": 30 }
  severity VARCHAR(20) NOT NULL,         -- "info", "warning", "critical"
  notification_channels TEXT[],          -- ["email", "dashboard", "slack"]
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fired alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  alert_rule_id UUID REFERENCES alert_rules(id),
  listener_type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  context JSONB,                         -- relevant data that triggered the alert
  status VARCHAR(20) DEFAULT 'open',     -- open, acknowledged, resolved, dismissed
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Per-client data source configuration
CREATE TABLE data_source_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  listener_type VARCHAR(30) NOT NULL,
  config JSONB NOT NULL,                 -- DataSourceConfig, CultureConfig, etc.
  schedule VARCHAR(50) DEFAULT '0 6 * * *',  -- cron expression
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, listener_type)
);
```

### Enum additions

```sql
-- Add to existing enums
ALTER TYPE pipeline_type ADD VALUE 'intelligence';

-- New enum for listener types
CREATE TYPE listener_type_enum AS ENUM (
  'brand', 'culture', 'industry', 'competitive', 'opportunity'
);
```

### Modified files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add 4 new tables + enum |
| `src/agents/registry.ts` | Add 15 new agents |
| `src/agents/model-defaults.ts` | Add model assignments for intelligence agents |
| `src/orchestrator/pipeline-registry.ts` | Register intelligence pipeline |

### New files

| File | Purpose |
|------|---------|
| `src/services/continuous-agent-runner.ts` | Scheduler + executor for continuous agents |
| `src/services/intelligence/brand-listener.ts` | Brand monitoring service |
| `src/services/intelligence/culture-listener.ts` | Culture monitoring service |
| `src/services/intelligence/industry-listener.ts` | Industry monitoring service |
| `src/services/intelligence/competitive-listener.ts` | Competitive monitoring service |
| `src/services/intelligence/opportunity-agent.ts` | Opportunity detection and brief generation |
| `src/providers/intelligence/stub-provider.ts` | LLM-based stub for all external data interfaces |
| `src/api/intelligence-routes.ts` | API endpoints for intelligence data |
| `agents/BL-L_brand_intelligence_lead.md` | Agent skill file |
| `agents/BL-001_mention_scanner.md` | Agent skill file |
| `agents/BL-002_sentiment_analyst.md` | Agent skill file |
| `agents/CL-L_culture_intelligence_lead.md` | Agent skill file |
| `agents/CL-001_trend_scanner.md` | Agent skill file |
| `agents/CL-002_relevance_analyst.md` | Agent skill file |
| `agents/IL-L_industry_intelligence_lead.md` | Agent skill file |
| `agents/IL-001_research_scanner.md` | Agent skill file |
| `agents/IL-002_trend_analyst.md` | Agent skill file |
| `agents/CO-L_competitive_intelligence_lead.md` | Agent skill file |
| `agents/CO-001_competitor_scanner.md` | Agent skill file |
| `agents/CO-002_gap_analyst.md` | Agent skill file |
| `agents/OA-L_opportunity_director.md` | Agent skill file |
| `agents/OA-001_opportunity_scanner.md` | Agent skill file |
| `agents/OA-002_brief_generator.md` | Agent skill file |

---

## 5. API Endpoints

```
GET    /api/intelligence/:clientId/dashboard       → Intelligence overview (all listeners)
GET    /api/intelligence/:clientId/brand            → Latest Brand Health Report
GET    /api/intelligence/:clientId/culture          → Latest Culture Pulse Report
GET    /api/intelligence/:clientId/industry         → Latest Industry Intelligence Report
GET    /api/intelligence/:clientId/competitive      → Latest Competitive Report
GET    /api/intelligence/:clientId/opportunities    → Current opportunity feed
POST   /api/intelligence/:clientId/run/:listenerType → Trigger on-demand listener run
GET    /api/intelligence/:clientId/alerts           → Active alerts
PATCH  /api/intelligence/:clientId/alerts/:id       → Update alert status
GET    /api/intelligence/:clientId/config           → Data source configurations
PUT    /api/intelligence/:clientId/config/:type     → Update data source config
GET    /api/intelligence/:clientId/history           → Historical runs and reports
```

---

## 6. Context Maps

### How other motors consume Intelligence

| Consumer motor | What it reads | When |
|---------------|--------------|------|
| **Strategist** (diagnostic) | All 4 listener reports | At start of strategy pipeline |
| **Strategist** (audiences) | Culture Listener report, Brand Listener audience data | During audience definition |
| **Strategist** (value_prop) | Competitive report, gap analysis | During positioning |
| **Brand Builder** (research) | Culture + Competitive reports | During brand research phase |
| **Community Mgmt** (reactive) | Opportunity feed, Culture pulse | Daily content planning |
| **Ads** (optimization) | Competitive ad intelligence | Campaign optimization cycles |
| **Brand Guardian** (validation) | Brand Health score, sentiment trends | Every gate evaluation |

The context builder loads intelligence artifacts by querying:
```sql
SELECT * FROM continuous_agent_runs
WHERE client_id = :clientId
  AND listener_type = :type
  AND step = 'report'
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
```

---

## 7. Stub Implementation Strategy

### Phase 1: LLM stubs (launch)

Every provider implements the interface but uses an LLM to generate synthetic data:

```typescript
class StubMentionProvider implements MentionProvider {
  name = 'stub-social';

  async fetch(config: DataSourceConfig): Promise<RawMention[]> {
    const prompt = `Generate 10-15 realistic social media mentions for the brand "${config.brandNames[0]}"
      in the ${config.industries?.[0] || 'general'} industry, region: ${config.regions.join(', ')}.
      Mix of positive (60%), neutral (25%), negative (15%) sentiment.
      Include realistic engagement metrics.
      IMPORTANT: Mark output as "synthetic data — no live monitoring active".`;

    const result = await llm.generate(prompt);
    return JSON.parse(result);
  }

  isAvailable() { return true; }
}
```

### Phase 2: Real integrations (post-launch)

Replace stubs one by one. The `isAvailable()` method enables graceful fallback:

```typescript
const providers: MentionProvider[] = [
  new BrandwatchProvider(),  // Real API
  new StubMentionProvider(), // Fallback
];

const provider = providers.find(p => p.isAvailable()) || providers[providers.length - 1];
```

---

## 8. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Each Listener produces a coherent report | Run all 4 listeners with stubs, verify report quality |
| Opportunity Agent identifies real intersections | Run with 4 listener outputs, verify it finds non-trivial opportunities |
| Alert system fires correctly | Configure test rules, verify alerts trigger on threshold breach |
| Context builder loads intelligence | Verify Strategist pipeline receives intelligence data |
| Scheduled execution works | Set up cron, verify listeners run on schedule |
| Data source config per client | Create 2 client configs, verify independent monitoring |
| No regression on existing pipelines | Video, Brand Builder, Strategist continue working |
