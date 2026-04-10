# criteria.agency — Analyst Motor Design

> Date: April 8, 2026
> Status: Approved design
> Scope: Analytics motor — system functions, Analyst agent, skills, triggers, interfaces, frequencies
> Decisions: DEC-121 through DEC-126

---

## 1. Context

The Analyst is the nervous system of criteria.agency. Without it, the Strategist operates blind — making decisions from frameworks alone. The client stares at an empty dashboard wondering if anything is working. The Brand Health Score doesn't exist. Campaign performance goes unmonitored. Every other agent that needs data either has to fetch it themselves or guesses.

The Analyst was referenced extensively across prior specs (Strategist Motor Design §2, §4.1, §11; Client Portal Navigation §4, §8; Platform Intelligence §7; Marketing Engine Design §2.5) but had only a one-line definition: "1 agent, continuous mode, skills: dashboard building, attribution modeling, anomaly detection, reporting, KPI tracking." The Strategist spec redefined it as "the nervous system of the platform" with three interfaces. This spec completes the design.

### Position in the platform

| Attribute | Value |
|-----------|-------|
| Category | Operation |
| Type | **Hybrid motor** — system functions (data processing, scores, dashboards) + 1 agent (Analyst) for interpretive layer (DEC-121) |
| Mode | Continuous — always running, batch-updated |
| Agent | Analyst (1) — 3 skills |
| System functions | Data normalization, Brand Health Score calculation, Campaign Score calculation, dashboard rendering, KPI tracking, threshold alerting, attribution modeling |
| Output | Dashboards, scores, reports (system functions) + processed diagnostics, qualified alerts (agent) |
| Consumers | Client (Interface 1), Strategist (Interface 2), Brand Health Score (Interface 3), all agents needing performance context |
| Primary dependency | Data Ingestion Layer (shared infrastructure, DEC-122) |

### Key decisions made in this spec

| Decision | ID | Choice |
|----------|----|--------|
| Motor nature | DEC-121 | Hybrid: system functions (pipeline, scores, dashboards) + 1 agent (Analyst) for interpretive layer |
| Data source | DEC-122 | External API ingestion is shared infrastructure (system function), not part of Analytics motor. Motor consumes normalized data |
| PI access level | DEC-123 | Analyst has benchmark-only access to Platform Intelligence. Pattern queries are exclusive to Strategist and strategic agents |
| Skills | DEC-124 | 3 skills: Monitoring (watchman), Diagnostic Delivery (interpreter, Interface 2), Reporting (narrator, Interface 1) |
| Knowledge base | DEC-125 | Static diagnostic patterns (cause-effect heuristics) + PI benchmarks (dynamic) + client history (dynamic) |
| Frequencies | DEC-126 | Ingestion every 4-6 hrs, threshold checks post-ingestion, Monitoring by exception, Diagnostic weekly+reactive, BHS daily, Reporting monthly+on-demand |

---

## 2. Core Concept: Two Layers of Intelligence

The Analytics motor has a fundamental architectural split: a **mechanical layer** that processes data deterministically, and an **interpretive layer** that adds analytical judgment. This mirrors the platform's broader pattern — Platform Intelligence aggregates but never interprets (DEC-112); the Analyst interprets but never decides (DEC-088).

### Why two layers

The mechanical layer handles work that code does better than an LLM: aggregating numbers, calculating weighted scores, rendering dashboards, comparing values against thresholds. Using an LLM for "is 2.3% > 2.0%?" is expensive, slow, and introduces hallucination risk for zero benefit.

The interpretive layer handles work that requires genuine reasoning: cross-referencing multiple data sources, eliminating hypotheses, producing contextual explanations. "Conversion rate dropped 30%, concentrated in version B, audience engagement stable but CTR to landing collapsed, pattern consistent with landing page problem not creative" — this requires a mode of thinking that templates and rules cannot replicate.

### The data flow

```
External APIs (Meta, Google, TikTok, email, analytics...)
        │
        ▼
┌─────────────────────────────────────┐
│  Data Ingestion Layer               │  ← Shared infrastructure (DEC-122)
│  (OAuth, polling, normalization)    │     Not part of Analytics motor
└─────────────────┬───────────────────┘
                  │ Normalized data
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  ANALYTICS MOTOR                                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  System Functions (mechanical layer)                 │    │
│  │                                                      │    │
│  │  • KPI tracking & threshold checks                   │    │
│  │  • Brand Health Score calculation (daily)             │    │
│  │  • Campaign Score calculation (post-ingestion)        │    │
│  │  • Dashboard data aggregation                         │    │
│  │  • Attribution modeling                               │    │
│  │  • Threshold alerting (if metric > X, flag)           │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │ Aggregated data + flags            │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Analyst Agent (interpretive layer)                  │    │
│  │                                                      │    │
│  │  • Monitoring skill — qualify flags as signal/noise   │    │
│  │  • Diagnostic Delivery — cross-source interpretation  │    │
│  │  • Reporting — narrative synthesis for client          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
   Interface 1               Interface 2
   (Client)                   (Strategist)
   Dashboards, scores,        Processed diagnostics,
   reports                    qualified alerts
```

---

## 3. System Functions (Mechanical Layer)

These are deterministic, code-based processes. No LLM involved. They run automatically and produce structured outputs.

### 3.1 KPI Tracking

**What it does:** For each active campaign × activation × channel, maintains current values of tracked KPIs (impressions, clicks, CTR, CPM, CPC, conversions, ROAS, engagement rate, etc.). Compares against targets defined in the Campaign Brief.

**Frequency:** Post-ingestion (every 4-6 hours when new data arrives from the Data Ingestion Layer).

**Output:** Current KPI values with delta vs target, delta vs previous period, trend direction.

### 3.2 Threshold Alerting

**What it does:** Compares KPI values against predefined thresholds. Produces flags when thresholds are crossed. This is mechanical — it doesn't evaluate whether the flag is meaningful.

**Threshold types:**
- **Absolute:** metric crosses a fixed value (e.g., CPM > $15)
- **Relative:** metric deviates >X% from target or previous period
- **Sustained:** metric deviates >X% for N consecutive data points (not a single spike)
- **Compound:** multiple related metrics cross thresholds simultaneously

**Output:** Flags with type, severity, metric, value, threshold, timestamp. These flags are the input to the Analyst's Monitoring skill.

### 3.3 Brand Health Score Calculation

**What it does:** Calculates the three-axis score visible in the client portal header.

**Frequency:** Daily recalculation. Intraday trend indicator (up/down/stable arrow) updated post-ingestion.

**Three axes (from Client Portal Navigation spec §4):**

| Axis | Question | Inputs | Calculation |
|------|----------|--------|-------------|
| **Fundamentos** | Am I ready? | Brand DNA layer depth, Mi Negocio completeness, audience definitions, business objectives | Weighted completeness percentage. Layer 0 = 0-20, Layer 1 = 20-50, Layer 2 = 50-80, Layer 3 = 80-100. Each component within a layer contributes to the sub-score |
| **Ejecucion** | Am I doing it well? | Campaign Scores (weighted average of active campaigns), Brand Guardian consistency rate, gate approval rates | Weighted composite: 50% campaign performance vs targets, 25% brand consistency, 25% gate efficiency |
| **Oportunidad** | Am I doing enough? | Active channels vs relevant channels (Channel Manager), investment vs market benchmark (PI), activity vs competition (Listeners) | Coverage ratio × investment adequacy ratio × competitive activity ratio |

**Weights between axes:** Equal (33/33/33) by default. The Strategist *interprets* which axis matters most — the score itself doesn't prioritize.

**Output:** Global score (0-100), per-axis scores, component breakdown, trend indicator (intraday).

### 3.4 Campaign Score Calculation

**What it does:** Calculates a quality score per campaign that evolves across its lifecycle (from Client Portal Navigation spec §4.1).

**Frequency:** Post-ingestion for active campaigns. On gate completion for campaigns in production.

**Phases:**

| Campaign phase | What the score measures | Sources |
|----------------|------------------------|---------|
| En definición | Quality of strategic and creative input: clear objectives, well-defined audiences, differentiated versions, coherent creative direction, realistic budget, sensible calendar | Showrunner, Strategist, Brand Guardian |
| En producción | Asset quality: gate approval rates, brand consistency of produced pieces | Gate reviews, Brand Guardian |
| En ejecución | Real performance: results vs objectives, ROAS, engagement, conversion | Ingested channel data |

**Output:** Score (0-100), phase label, component breakdown, recommended actions (templated — "tu score subiría si defines mejor la audiencia de la versión 2").

### 3.5 Dashboard Data Aggregation

**What it does:** Prepares data structures for the client-facing dashboards in the portal. Groups, filters, and formats data by campaign, channel, funnel stage, time period.

**This is not visualization.** Dashboard rendering is frontend work. This system function prepares the data layer — pre-computed aggregations so the frontend doesn't query raw tables.

**Frequency:** Post-ingestion.

### 3.6 Attribution Modeling

**What it does:** Distributes conversion credit across touchpoints using deterministic algorithms.

**Models supported:**
- **Last-touch** (default for Starter tier — simple, understandable)
- **Linear** (available for Pro — equal credit across touchpoints)
- **Time-decay** (available for Agency — more credit to recent touchpoints)

**Note:** Attribution is a hard problem. For MVP, last-touch is sufficient. More sophisticated models require cross-channel identity resolution which is a Phase 3+ infrastructure problem. The important thing is that the attribution model is explicit and the client knows which one is being used.

**Output:** Per-conversion attribution breakdown by channel × activation.

---

## 4. Analyst Agent (Interpretive Layer)

### Profile

| Attribute | Value |
|-----------|-------|
| Type | Agent (analytical judgment, cross-source reasoning) |
| Motor | Analytics (Operation category) |
| Mode | Continuous — skill-based activation by triggers |
| Autonomy | Not configurable — the Analyst always operates autonomously. Its outputs are informational, not decisional. There's nothing to "approve" in a diagnostic |
| Instanciation | Per-client, on-demand. No persistent instance. Each invocation receives client context from the database |

### What the Analyst does

The Analyst has one job: **make data meaningful.** It takes numbers, flags, and signals from the system functions of its own motor plus data from other system components, and produces analytical interpretation.

### What the Analyst does NOT do

| Action | Who does it | Why not the Analyst |
|--------|------------|---------------------|
| Decide what to do about a problem | Strategist | DEC-088: Analyst processes data, Strategist decides |
| Recommend campaigns or budget changes | Strategist | Recommendations require strategic context |
| Calculate scores or aggregate metrics | System functions | Mechanical work, no LLM needed |
| Fetch data from external APIs | Data Ingestion Layer | Infrastructure, not interpretation (DEC-122) |
| Evaluate brand consistency | Brand Guardian | Different expertise, different independence |
| Monitor external markets | Listeners | External observation vs internal analysis |

### Knowledge bases

**Static (diagnostic patterns):**

A curated library of cause-effect heuristics from performance marketing. These are not theoretical frameworks — they are empirical patterns that help the Analyst triangulate diagnoses.

Example patterns:

| Signal combination | Typical pattern | Confidence |
|-------------------|----------------|------------|
| CTR high + conversion low | Post-click problem (landing page, checkout, form) | High |
| Impressions stable + engagement declining | Creative fatigue | High |
| CPM rising + CTR stable | Increased auction competition, not creative problem | Medium |
| Engagement high organic + low paid (same content) | Targeting problem, not content problem | Medium |
| All metrics declining + no internal change | Platform algorithm change or seasonal shift | Medium |
| Conversions spiking + no campaign change | External event or competitor exit | Low (needs Listener confirmation) |
| CPC rising + conversion rate stable | Market-wide inflation, not performance problem | Medium |
| Email open rate dropping + click rate stable among openers | Deliverability or subject line issue, not content | High |

This library grows over time as the platform accumulates experience. New patterns can be added without changing the agent's architecture.

**Dynamic:**
- Platform Intelligence benchmarks (DEC-123 — benchmark queries only): "What is the standard CTR for restaurants in LATAM on Meta awareness campaigns?"
- Client history: past campaign performance, seasonal patterns, audience response patterns (from Client Intelligence produced by Strategist's Campaign Learning skill)

### Three Interfaces (from Strategist spec §2)

**Interface 1 → Client (visibility).** Dashboards, reports, metrics in the Funnel Matrix, answers to direct questions ("how many leads this week?"). Pure visibility. The client consumes this without Strategist intervention. Mostly produced by system functions, with narrative enrichment from the Reporting skill.

**Interface 2 → Strategist (processed diagnostics).** Not raw data — analytically interpreted data. The Analyst says *what happened* and *what pattern it sees*. The Strategist decides *what to do*. This is the primary output of the Diagnostic Delivery skill.

**Interface 3 → Brand Health Score (calculation).** The mechanical score calculation is a system function (§3.3). The Analyst's contribution is producing the trend context and component explanations that accompany the score — "your Ejecución axis dropped 5 points this week, driven by Campaign X underperforming on Meta."

---

## 5. Skill Details

### 5.1 Monitoring — "Is something happening?"

**Purpose:** Distinguish signal from noise. The system functions produce flags when thresholds are crossed. The Monitoring skill decides if those flags represent a real pattern or just normal variance.

**Why this needs an agent:** A CPM that rises 25% could mean the platform raised prices (structural), it's Black Friday season (expected), or the creative is fatiguing and the algorithm is compensating (actionable). A threshold check flags it. The Monitoring skill reads context and qualifies it.

**Inputs:**
- Threshold flags from system functions (what crossed and by how much)
- Historical context for this client (has this happened before? Is it seasonal?)
- Platform Intelligence benchmarks (is this movement consistent with industry-wide shifts?)
- Current campaign state (what's active, what changed recently)

**Output:** **Qualified Alert** — a structured assessment:

| Field | Content |
|-------|---------|
| Severity | Informational / Attention / Action Required |
| What changed | Specific metric(s), magnitude, duration |
| Where | Campaign, version, channel, activation |
| Context | Historical comparison, benchmark comparison |
| Pattern assessment | "Consistent with [pattern X]" or "No matching pattern — novel signal" |
| Confidence | High / Medium / Low |
| Recommended next step | "Diagnostic review recommended" or "Continue monitoring" |

**What Monitoring never says:** "You should change your budget." That's Strategist territory.

**Triggers:**

| # | Trigger | Type |
|---|---------|------|
| 1 | System function threshold flag on metric with >20% deviation | Reactive |
| 2 | Compound flag (3+ related metrics crossing thresholds simultaneously) | Reactive |
| 3 | Sustained deviation detected (>N consecutive data points) | Reactive |

**Frequency:** Only activates when system functions produce flags that exceed the "possibly anomalous" threshold. On a calm week, the Monitoring skill may not activate at all. This is by design — the 95% of quiet data points are handled by deterministic code at zero LLM cost.

### 5.2 Diagnostic Delivery — "What does it mean?"

**Purpose:** Produce the processed diagnostics that the Strategist consumes (Interface 2). This is the core of the Analyst's value — the skill that justifies the agent's existence.

**How it works:**

The Diagnostic Delivery skill performs cross-source triangulation. It doesn't look at a single metric in isolation. It takes:

1. **The trigger** — what activated this diagnostic (alert, weekly cycle, Strategist request)
2. **Performance data** — from system functions (KPIs, scores, attribution)
3. **Brand context** — Brand DNA layer, Mi Negocio objectives, Client Intelligence
4. **Market context** — PI benchmarks (benchmark queries only, DEC-123)
5. **External signals** — Listener outputs if available (competitive moves, cultural shifts, industry trends)
6. **Brand Guardian flags** — consistency issues that might explain performance patterns

And produces a **Processed Diagnostic**:

| Section | Content | Example |
|---------|---------|---------|
| Summary | One-paragraph synthesis of the current state | "Your awareness campaigns are performing above industry benchmarks on Meta but significantly below on Google. Conversion is strong overall but declining in version B." |
| Key findings | 3-5 specific observations with data | "CTR on Meta: 2.3% (benchmark: 1.8%). CTR on Google Display: 0.4% (benchmark: 0.9%). Version B conversion dropped 30% week-over-week." |
| Pattern analysis | Cross-referencing to identify likely causes | "The version B decline is concentrated in CTR-to-landing, with stable ad engagement. Pattern consistent with landing page degradation, not creative fatigue." |
| Benchmark context | Where this client stands vs industry | "Overall campaign performance is in the 65th percentile for restaurants in LATAM (PI benchmark)." |
| Confidence notes | What the Analyst is sure about vs uncertain | "High confidence on Meta outperformance. Medium confidence on version B cause — needs 2-3 more data points to confirm." |
| What the Analyst does NOT include | Recommendations, action items, strategic direction | That's the Strategist's job upon receiving this diagnostic |

**Triggers:**

| # | Trigger | Type | Context |
|---|---------|------|---------|
| 4 | Qualified alert from Monitoring with severity "Action Required" | Consequence | Monitoring detected something that needs interpretation |
| 5 | Weekly diagnostic cycle | Scheduled | Comprehensive review even without alerts — catches gradual trends |
| 6 | Strategist requests context | Reactive | Pre-Diagnostic skill activation, pre-Planning, or ad-hoc |
| 7 | Brand Health Score drops >X points in one recalculation | Reactive | System function detects the drop, agent explains why |

**The weekly cycle (trigger 5) is important.** Not everything that matters triggers an alert. A slow, steady 2% weekly decline in engagement might never cross a single-period threshold, but over 6 weeks it's a 12% decline. The weekly comprehensive review catches these gradual patterns.

### 5.3 Reporting — "Here's what happened."

**Purpose:** Produce narrative reports for the client (Interface 1). The difference between a report and a dashboard is narrative — a dashboard shows "CTR: 2.3%." A report says "Your CTR was 2.3%, a 15% increase from last month, driven primarily by the emotional version of your awareness campaign on Meta."

**Why this needs an agent:** Writing coherent narrative that synthesizes multiple data points, contextualizes them for a specific client, and presents them in understandable language is an LLM task. Templates produce "Your CTR was [X], [up/down] [Y]% from last month." An agent produces genuinely useful commentary.

**Report types:**

| Type | Frequency | Content | Audience |
|------|-----------|---------|----------|
| **Campaign Report** | On campaign close | Full lifecycle analysis: what was planned, what happened, performance vs objectives, key learnings | Client + Strategist (feeds Campaign Learning skill) |
| **Monthly Report** | Monthly (automated) | Cross-campaign synthesis: overall performance, Brand Health Score trend, top insights, budget status | Client |
| **On-Demand Report** | Client request | Custom scope — can be about a specific campaign, channel, time period, or question | Client |

**Inputs:**
- System function outputs (KPIs, scores, attribution data)
- Qualified alerts from Monitoring (the notable events of the period)
- PI benchmarks for contextualization
- Brand DNA (to frame reports in the client's language and priorities)

**Output:** Structured narrative report. For Campaign Report and Monthly Report, this is also available as a downloadable PDF (produced by the report system function using the agent's narrative content).

**Triggers:**

| # | Trigger | Type |
|---|---------|------|
| 8 | Campaign closes (final gate complete) | Consequence |
| 9 | Monthly calendar cycle | Scheduled |
| 10 | Client requests report via Copilot or portal | Reactive |

---

## 6. Trigger Summary

| # | Trigger | Type | Skill |
|---|---------|------|-------|
| 1 | Threshold flag with >20% deviation | Reactive | Monitoring |
| 2 | Compound flag (3+ related metrics) | Reactive | Monitoring |
| 3 | Sustained deviation (>N consecutive points) | Reactive | Monitoring |
| 4 | Qualified alert severity "Action Required" | Consequence | Diagnostic Delivery |
| 5 | Weekly diagnostic cycle | Scheduled | Diagnostic Delivery |
| 6 | Strategist requests context | Reactive | Diagnostic Delivery |
| 7 | Brand Health Score drops >X points | Reactive | Diagnostic Delivery |
| 8 | Campaign closes | Consequence | Reporting |
| 9 | Monthly calendar cycle | Scheduled | Reporting |
| 10 | Client requests report | Reactive | Reporting |

Three categories following the Strategist spec pattern:
- **Scheduled** (3): weekly diagnostic, monthly report, (BHS daily recalculation is a system function, not a trigger)
- **Reactive** (5): threshold flags, compound flags, sustained deviations, Strategist request, BHS drop, client request
- **Consequence** (2): qualified alert → diagnostic, campaign close → report

---

## 7. Relationship with Platform Intelligence

### Access level: Benchmark only (DEC-123)

The Analyst can query PI for benchmark data: "What is the average CTR for restaurants in LATAM on Meta awareness campaigns?" It cannot query PI for patterns: "What messaging type works best for restaurants in awareness?" Pattern queries are strategic intelligence — the Strategist's domain.

### Updated PI access table (extends DEC-115)

| Level | Agents | Queries |
|-------|--------|---------|
| Full | Strategist, Financial Agent, Brand Builder | Benchmark + Pattern |
| Pattern only | Creative Director, Channel Manager, Media Scout | Pattern only |
| **Benchmark only** | **Analyst** | **Benchmark only** |
| Operational | Distribution agents | Operational signals |
| No access | Brand Guardian, Listeners | — |

### Why this separation matters

The Analyst contextualizes: "Your CTR is 2.3%. The industry benchmark is 1.8%. You're above average." This is analytical framing — it makes a number meaningful.

The Strategist interprets patterns: "Restaurants that use emotional video in awareness see 1.4x better engagement. Your brand's emotional version is underperforming — let's investigate." This is strategic reasoning — it drives decisions.

If the Analyst had pattern access, it would blur the line with the Strategist. The Analyst might say "your emotional messaging is below the pattern for your industry" — which sounds like a recommendation dressed as analysis. Keeping the Analyst at benchmark-only preserves the clean separation of DEC-088.

---

## 8. Relationship with the Strategist

The Analyst/Strategist relationship is the most important integration in the platform. It's a pipeline of increasing interpretation:

```
Raw data → [System Functions] → Aggregated data → [Analyst] → Diagnostic → [Strategist] → Decision
```

### What the Analyst sends the Strategist

| Output | When | Purpose |
|--------|------|---------|
| Processed Diagnostic | Weekly cycle or on alert | Interface 2 — the Strategist's primary data input |
| Brand Health Score with context | On significant change | "Score dropped 5 points. Ejecución axis. Driven by Campaign X on Meta." |
| Campaign Report | On campaign close | Feeds the Strategist's Campaign Learning skill |
| Qualified Alert | On detection | Urgent signal that may trigger Strategist optimization |

### What the Strategist sends the Analyst

| Request | When | Purpose |
|---------|------|---------|
| Context request | Pre-Diagnostic skill, pre-Planning | "Give me a comprehensive diagnostic before I design the quarterly plan" |
| Specific question | Ad-hoc | "Break down version B performance by audience segment for the last 3 weeks" |

### The boundary

The Analyst says: "Version B's conversion rate dropped 30%. Concentrated in CTR-to-landing. Engagement stable. Pattern consistent with landing page problem."

The Strategist says: "Redirect traffic to version A while we fix the landing. Shift 15% of budget to organic where we're overperforming."

The Analyst never crosses into "you should." The Strategist never crosses into "let me aggregate data."

---

## 9. Data Ingestion Layer (Shared Infrastructure)

Not part of the Analytics motor (DEC-122), but documented here because the motor depends on it entirely.

### Why it's separate

1. **Multiple consumers.** The Paid Media Operator needs Meta data to optimize ads. The Channel Manager needs channel specs. The Email Operator needs email platform data. If the Analytics motor owns the pipeline, every other motor depends on Analytics for data access — creating a bottleneck.

2. **It's plumbing.** OAuth token management, API rate limiting, retry logic, schema normalization — this is infrastructure work identical in nature to the Event Bus or file storage. It belongs with platform infrastructure.

3. **Consistency with PI.** Platform Intelligence receives data from writers (DEC-102) — it doesn't go fetch data. Same principle: the Analytics motor receives normalized data — it doesn't manage API connections.

### What it provides

| Function | Details |
|----------|---------|
| OAuth connection management | Per-client, per-platform. Stored encrypted (Security Framework spec P2) |
| Data pulling | Polling each platform's API at appropriate intervals (varies by platform) |
| Schema normalization | All data normalized to a unified format regardless of source platform |
| Storage | Normalized data stored in PostgreSQL, available to any motor via internal API |
| Connection status | Health monitoring — alerts if a connection fails or token expires |

### Platforms (MVP)

| Platform | Data type | Pull frequency |
|----------|-----------|---------------|
| Meta (Facebook/Instagram) | Ad performance, organic page metrics | Every 4-6 hours |
| Google Ads | Ad performance | Every 4-6 hours |
| Google Analytics | Web analytics, conversions | Every 4-6 hours |
| TikTok Ads | Ad performance | Every 4-6 hours |
| Email platform (Mailchimp/SendGrid) | Email metrics | Every 4-6 hours |

Additional platforms added as Distribution motors are activated. The ingestion layer is designed to be extensible — adding a new platform is a configuration task, not an architecture change.

---

## 10. Token Cost Model

Following the platform-wide principle (DEC-100): **observe is free, think costs tokens, produce costs tokens.**

| Component | Token cost | Rationale |
|-----------|-----------|-----------|
| Dashboards | **Free** | System function. Part of "observe" layer |
| Brand Health Score | **Free** | System function. Always visible |
| Campaign Score | **Free** | System function. Part of campaign visibility |
| KPI tracking | **Free** | System function. Part of "observe" layer |
| Threshold alerts | **Free** | System function. Mechanical checks |
| Monitoring skill (agent) | **Free** | Internal — qualifies alerts for the Strategist. Client doesn't see this directly |
| Diagnostic Delivery (agent) | **Free** | Internal — feeds the Strategist. The Strategist's output costs tokens, not its input |
| Monthly Report (agent) | **Costs tokens** | Client-facing deliverable. Narrative synthesis is "thinking" |
| Campaign Report (agent) | **Costs tokens** | Client-facing deliverable |
| On-Demand Report (agent) | **Costs tokens** | Client-facing deliverable |

### Rationale for free diagnostics

Monitoring and Diagnostic Delivery are free even though they invoke an LLM because:

1. **They're internal.** The client doesn't directly consume their output — the Strategist does. Charging for them would be charging for the platform's own nervous system.
2. **Charging would degrade quality.** If diagnostics cost tokens, the system has an incentive to run fewer diagnostics. Fewer diagnostics = worse Strategist decisions = worse client outcomes.
3. **Consistency with PI queries being free (DEC-118).** Same logic: don't charge for the inputs to good decisions.

The cost appears downstream: the Strategist's output (which relies on diagnostics) costs tokens. The Reports cost tokens because they're client-facing deliverables with narrative value.

---

## 11. Brand Health Score — Complete Design

The Brand Health Score was defined conceptually in the Client Portal Navigation spec (§4) and assigned to the Analyst in the Strategist spec (§11). This section completes the mechanical specification.

### Score architecture

```
Global Score (0-100) = weighted average of three axes

  ├── Fundamentos (0-100) ─── "Am I ready?"
  │     ├── Brand DNA depth (which layer: 0/1/2/3)
  │     ├── Mi Negocio completeness (required fields filled)
  │     ├── Audience definition quality (segments defined with criteria)
  │     └── Business objectives clarity (measurable goals set)
  │
  ├── Ejecucion (0-100) ─── "Am I doing it well?"
  │     ├── Campaign performance vs targets (weighted avg of Campaign Scores)
  │     ├── Brand consistency rate (Brand Guardian approval %)
  │     └── Gate efficiency (first-pass approval rate in production)
  │
  └── Oportunidad (0-100) ─── "Am I doing enough?"
        ├── Channel coverage (active channels / relevant channels)
        ├── Investment adequacy (actual spend / recommended spend from PI benchmarks)
        └── Competitive activity (relative activity level vs detected competitors)
```

### Axis weights

Default: 33/33/33 (equal). The score itself is objective. Interpretation of which axis matters most is the Strategist's job — not a weight adjustment in the formula.

### New client behavior

| Client state | Fundamentos | Ejecucion | Oportunidad | Global |
|-------------|-------------|-----------|-------------|--------|
| Just registered (layer 0 only) | ~15 | N/A (no campaigns) | ~5 (no activity) | ~7 |
| Post-Brand Builder layer 1 | ~35 | N/A | ~10 | ~15 |
| First campaign active | ~35 | ~50 (early data) | ~20 | ~35 |
| Mature client (layer 2+, 5+ campaigns) | ~70 | Varies | ~50 | ~55-70 |

The score starts low and climbs as the client builds their brand and activates campaigns. This is by design — the low score drives engagement ("what can I do to improve?") and maps to concrete actions.

### The intraday trend indicator

The score recalculates daily. But between recalculations, the system function tracks whether incoming data would move the score up or down, and displays a simple trend arrow (↑ ↓ →) next to the score. This gives the client a sense of momentum without the instability of constant score changes.

---

## 12. Integration with Other Systems

### Integration map

| System | What it sends to Analytics | What it receives from Analytics |
|--------|---------------------------|-------------------------------|
| **Data Ingestion Layer** | Normalized performance data from all connected platforms | Nothing (one-way) |
| **Strategist** | Context requests, campaign briefs (for tracking targets) | Processed diagnostics (Interface 2), qualified alerts, campaign reports |
| **Brand Builder** | Brand DNA (for client context in diagnostics and reports) | Nothing directly (Brand Builder is informed via Strategist) |
| **Brand Guardian** | Consistency flags, approval rates | Nothing directly |
| **Financial Agent** | Budget targets, financial thresholds | Budget burn data, ROI calculations |
| **Listeners** | Market signals, competitive intelligence | Nothing directly |
| **Platform Intelligence** | Nothing (Analyst doesn't write to PI) | Benchmark data (benchmark queries only) |
| **Distribution agents** | Operational performance data (via Data Ingestion Layer) | Nothing directly (distribution agents optimize autonomously; Strategist mediates strategic adjustments) |
| **Client (portal)** | Nothing directly | Dashboards, scores, reports (Interface 1) |
| **Copilot** | Client questions about data | Formatted answers, report links |

### Who writes to Platform Intelligence

The Analyst does NOT write to PI. This is deliberate. PI's three writer types (DEC-102) are:
- Learning Records: Strategist (via Campaign Learning skill)
- Operational Signals: Distribution agents, Brand Guardian, Channel Manager
- Structural Patterns: Brand Builder, Listeners

The Analyst processes data for one client at a time. PI requires cross-client aggregation. The Strategist's Campaign Learning skill produces the structured, anonymized learning records that feed PI. The Analyst provides the raw performance data that Campaign Learning synthesizes.

---

## 13. Autonomy Model

Unlike other agents, the Analyst's autonomy is NOT configurable by the client. There are no "AI decides + human supervises" or "AI recommends + human approves" modes for the Analyst, because:

1. **The Analyst's outputs are informational, not decisional.** A diagnostic says "what happened." There's nothing for the client to approve or reject — it's an observation, not an action.

2. **Making diagnostics require approval would break the chain.** If the Analyst needs client approval to send a diagnostic to the Strategist, every strategic response is delayed by human latency. The entire event-driven architecture slows to the speed of inbox checking.

3. **The control point is downstream.** The client controls the Strategist (which decides what to do based on diagnostics) and the Distribution agents (which execute). Control at the decision point is sufficient — you don't need control at the observation point too.

The client does have control over **Reporting** frequency and scope in Settings: monthly reports on/off, preferred level of detail (summary vs comprehensive), which campaigns to include.

---

## 14. Implementation Notes

### Priority

The Analyst is a **prerequisite for the Strategist** (Strategist spec §13 recommended build order items 1-2). Specifically:
- Analyst Interface 2 must be operational for the Strategist to receive processed diagnostics
- Brand Health Score calculation must be operational for the portal header and Strategist's Diagnostic skill

### Recommended build order

| Phase | Component | Type | Depends on |
|-------|-----------|------|------------|
| 1 | Data Ingestion Layer (shared infra) | System function | Database schema for normalized metrics |
| 2 | KPI tracking + threshold alerting | System function | Data Ingestion Layer |
| 3 | Brand Health Score calculation | System function | KPI tracking + Brand DNA schema |
| 4 | Campaign Score calculation | System function | KPI tracking + Campaign schema |
| 5 | Dashboard data aggregation | System function | All above |
| 6 | Analyst agent — Monitoring skill | Agent | Threshold alerting (produces flags) |
| 7 | Analyst agent — Diagnostic Delivery skill | Agent | Monitoring + PI benchmark access |
| 8 | Analyst agent — Reporting skill | Agent | All system functions + Diagnostic Delivery |
| 9 | Attribution modeling | System function | Multi-channel data + conversion tracking |

**Phases 1-5 can be built without any LLM.** They are deterministic code. This means the client-facing dashboards and scores can work from day 1, even before the Analyst agent exists. The agent adds the interpretive layer on top — enriching, not replacing, the mechanical foundation.

### Model considerations

- **Monitoring:** Could start with a lighter model (Haiku). Signal/noise qualification for most common patterns doesn't require deep reasoning.
- **Diagnostic Delivery:** Claude or equivalent. Cross-source triangulation and pattern matching across diverse data types requires genuine reasoning.
- **Reporting:** Could use a lighter model for routine monthly reports. Claude for Campaign Reports (which feed the Strategist's Campaign Learning) and complex on-demand reports.

### Dependencies

- **Data Ingestion Layer** must exist for any Analytics system function to operate.
- **Brand Builder** Brand DNA (at least layer 0) must exist for the Analyst to contextualize client data.
- **Platform Intelligence** benchmark API must be operational for the Analyst to provide industry context (DEC-123). Without it, the Analyst still functions but diagnostics lack benchmarking.
- **Listeners** are optional — the Analyst can operate without market context for early implementations, using only internal data and PI benchmarks.

---

## 15. Open Questions

### 15.1 Copilot ↔ Analyst interaction

When the client asks the Copilot "how are my campaigns doing?" — does the Copilot route to the Analyst directly, or to the Strategist who then requests context from the Analyst? The answer likely depends on the nature of the question: data questions ("what is my CTR?") go to Interface 1 (system functions, instant). Interpretation questions ("why is my campaign underperforming?") may route to the Strategist who uses the latest diagnostic. This needs resolution in the Copilot spec.

### 15.2 Threshold calibration

The system function thresholds (>20% deviation, >N consecutive points) need empirical calibration. Too sensitive = alert fatigue. Too loose = missed signals. Initial values should be conservative (more alerts than needed) and tuned based on the ratio of Monitoring "signal" vs "noise" classifications.

### 15.3 Multi-brand analytics

For clients with multiple brands (Agency tier), the Analytics motor needs per-brand dashboards and scores plus a cross-brand consolidated view. The system functions support this if brands are modeled as separate entities in the database. The Analyst agent needs to be invoked with the correct brand context. No architectural change needed — but the dashboard data aggregation system function needs a "brand" dimension.
