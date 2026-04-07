# criteria.agency — Marketing Engine Architecture & Design

> Date: April 6, 2026
> Status: Approved design — pending implementation planning
> Scope: Full platform engine architecture (not just "marketing" — all engines)
> **Capability mapping:** This document defines the 24 motors and their pipelines. For the client-facing view (pain points → capabilities → motors), see `2026-04-07-capabilities-map-design.md`. Motors serve capabilities; capabilities solve client pain points.

---

## 1. Context

criteria.agency was originally conceived as "4 engines" (Video, Marketing, Sales, Design). Through this brainstorming session, we discovered the platform is much larger: **24 motors/components organized into 23 teams + 9 transversal agents + 1 security team (~6 agents)**, totaling ~125 agents.

This spec redefines criteria.agency from "4 engines" to a **platform of N specialized motors** sharing a common orchestration framework. Each motor defines its own pipeline, agents, gates, and escalation rules on top of the shared infrastructure.

The Video Production engine (47 agents, 9 teams, 5 gates) is already fully designed and serves as the structural reference for all other motors.

### Key decisions made

| Decision | Choice | Why |
|----------|--------|-----|
| Motor lifecycle | Hybrid: Project + Continuous modes | Marketing is both project-oriented (create campaign) and continuous (optimize, monitor) |
| Optimization autonomy | Configurable by user | User chooses "AI decides + human supervises" OR "AI recommends + human approves" |
| Cross-engine integration | Bidirectional automatic | Marketing can trigger Video orders and vice versa |
| Funnel Matrix | Central organizing concept | Awareness/Consideration/Conversion/Retention x Paid/Owned/Earned |
| Channel architecture | Single Channel Manager + skill registry | One agent loads skills per channel — adding a channel = adding a skill |
| Agent count | Design what's needed, no artificial limits | Bottom-up analysis yielded ~125 agents across 23 teams + 9 transversals + 6 security |
| Channels scope | Full Paid/Owned/Earned including traditional + custom | Extensible registry, not hardcoded list |
| Strategist knowledge base | Harvard Digital Marketing Strategy (6 modules) | `docs/brain/M1-M6_Summary.pdf` — academic frameworks for funnel, media, metrics, budget |

---

## 2. Motor Taxonomy

### 2.1 CREATION motors — produce tangible assets

| Motor | Input | Output | Mode | Team size (est.) |
|-------|-------|--------|------|-----------------|
| **Video Production** | Brief | Finished video | Project | 47 agents, 9 teams (designed) |
| **Graphic Design** | Brief | Visual pieces, brand identity | Project | ~5 agents |
| **Web** | Brief | Landing pages, sites, microsites | Project | ~4 agents |
| **Audio** | Brief | Podcasts, jingles, spots, voiceovers | Project | ~4 agents |
| **Events** | Brief | Physical experiences | Project | ~6 agents |
| **Print Production** | Final art + specs | Printed physical pieces | Project | ~3 agents |

> **Note:** Graphic Design, Web, and Audio motors are listed here for completeness but their detailed pipelines and agent cards will be defined in separate specs. Their structure will follow the same pattern as Video Production (teams, gates, 3+3 rule).

### 2.2 STRATEGY motors — define direction and control coherence

| Motor | Input | Output | Mode | Team size (est.) |
|-------|-------|--------|------|-----------------|
| **Brand Builder** | Workshop/Onboarding | Brand DNA Document | Project (one-time per brand) | ~5 agents |
| **Strategist** | Brand DNA + Harvard frameworks + market data | Marketing Plan, Campaign Briefs | Hybrid | ~4 agents |

### 2.3 INTELLIGENCE motors — listen and detect

| Motor | Input | Output | Mode | Type |
|-------|-------|--------|------|------|
| **Brand Listening** | Social mentions, reviews, press | Sentiment, brand health, crisis alerts | Continuous | Transversal agent |
| **Culture Listening** | Trends, news, social signals | Cultural insights, trending topics | Continuous | Transversal agent |
| **Industry Listening** | Publications, reports, patents | Innovation signals, market shifts | Continuous | Transversal agent |
| **Competitive Listening** | Competitor activity | Benchmarks, moves, gaps | Continuous | Transversal agent |
| **Opportunity Agent** | Listener outputs + audiences | Opportunity Briefs (moment + audience + action) | Continuous | Transversal agent |

### 2.4 DISTRIBUTION motors — execute on channels

| Motor | Input | Output | Mode | Team size (est.) |
|-------|-------|--------|------|-----------------|
| **Ads (Pauta)** | Assets + budget + targeting | Live campaigns on platforms | Hybrid | ~5 agents |
| **Community Management** | Brand voice + content calendar | Posts, responses, engagement | Continuous | ~5 agents |
| **Email Marketing** | Segments + content | Sequences, newsletters, automations | Hybrid | ~4 agents |
| **SEO/Content** | Keywords + Brand DNA | Blog posts, articles, optimizations | Hybrid | ~4 agents |

### 2.5 OPERATION motors — manage the business

| Motor | Input | Output | Mode | Team size (est.) |
|-------|-------|--------|------|-----------------|
| **Sales/CRM** | Leads + scoring rules | Managed pipeline, follow-ups | Continuous | ~5 agents |
| **Analytics** | Data from all channels via API | Unified dashboards, reports, attribution | Continuous | ~5 agents |

### 2.6 TRANSVERSAL components — shared infrastructure

| Component | Type | Purpose |
|-----------|------|---------|
| **Brand Guardian** | Transversal agent | Validates brand consistency across all outputs |
| **Financial Agent** | Transversal agent | Budget control, allocation, forecasting, ROI validation |
| **Channel Manager** | Transversal agent + skill registry | Expert knowledge of each channel (API, specs, pricing, limits, risks) |
| **Media Scout** | Transversal agent | Discovers media opportunities, channels, partnerships |
| **Marketplace** | Transversal infrastructure | Registry of agentic (AI) and human providers for any need |

### 2.7 Agent count summary

| Category | Teams | Estimated agents |
|----------|-------|-----------------|
| Video Production | 9 teams (designed) | 47 |
| Creation (Design, Web, Audio, Events, Print) | 5 teams | ~25 |
| Strategy (Brand Builder, Strategist) | 2 teams | ~10 |
| Distribution (Ads, Community, Email, SEO) | 4 teams | ~18 |
| Operation (Sales, Analytics) | 2 teams | ~10 |
| Transversal agents | — | ~9 |
| Security team | 1 team | ~6 |
| **Total** | **23 teams + 9 transversals** | **~125 agents** |

---

## 3. Shared Orchestration Framework

All motors use the same framework proven by Video Production:

- **State machine** per project/campaign — tracks current pipeline step
- **Quality gates** — quantity and type vary per motor
- **3+3 escalation rule** — 3 normal attempts → 3 with leader adjustment → human escalation
- **Dispatcher** — routes tasks to correct agents per pipeline step
- **Event Bus** — cross-motor communication (typed events)

### Lifecycle modes

| Mode | Behavior | Example motors |
|------|----------|----------------|
| **Project** | Linear pipeline with start and end. Gates at checkpoints. | Video, Design, Web, Audio, Events, Print, Brand Builder |
| **Continuous** | Runs indefinitely, generates outputs/alerts periodically. No "end" state. | Listeners (x4), Opportunity Agent, Brand Guardian, Community Management, Analytics |
| **Hybrid** | Starts as project (setup/launch), then enters continuous mode (optimization loop). | Strategist, Ads, Email Marketing, SEO/Content, Sales/CRM |

### Hybrid mode detail

```
PROJECT PHASE:  [Setup] → [Gates] → [Launch]
                                         │
                                         ▼
CONTINUOUS PHASE:  [Monitor] → [Analyze] → [Optimize] → [Monitor] → ...
                                              │
                                   (configurable autonomy)
                                   ├── AI decides + human supervises
                                   └── AI recommends + human approves
```

### Configurable autonomy

The user chooses per motor (or per campaign) how much autonomy AI agents have:

| Mode | AI can do automatically | Requires human approval |
|------|------------------------|------------------------|
| **AI decides** | Minor optimizations (pause bad ad set, reallocate <10% budget, swap creative variant, adjust bid) | Major changes (>20% budget shift, pause entire campaign, change strategy, new channel) |
| **AI recommends** | Nothing — all actions generate recommendations | Everything requires explicit approval |

---

## 4. Detailed Motor Pipelines

### 4.1 Strategist Pipeline

**Knowledge base:** Harvard Digital Marketing Strategy modules (`docs/brain/M1-M6_Summary.pdf`)
- M1: Digital era, DTC model, value chain
- M2: Marketing plan (Goals, Target, Value Prop, Metrics), funnel, positioning, 3Cs
- M3: Paid media (SEM, Display, Native, Paid Social, OTT/CTV)
- M4: Owned & Earned media (SEO, Content Strategy, Influencer, Email)
- M5: Customer engagement (Personalization, Recommendations, Community)
- M6: Budget allocation & measurement (Attribution, CAC, LTV, ROI, ROAS)

**Pipeline:**

```
[1] Diagnostic → [2] Objectives → [G1] → [3] Audiences → [4] Value Prop → [G2] → [5] Media Plan → [6] Budget Allocation → [G3] → OUTPUT: Campaign Briefs
```

| Step | What happens | Framework |
|------|-------------|-----------|
| 1. Diagnostic | Receives Brand DNA + Listener data + client history. Identifies position in value chain, SWOT. | M1 value chain |
| 2. Objectives | Defines measurable goals aligned to funnel stages (awareness, consideration, conversion, retention). | M2 goals/objectives |
| **G1** | Are objectives realistic given budget and market? Financial Agent validates economic viability. | — |
| 3. Audiences | Segmentation (demographic, behavioral, motivational). Cross with Culture Listening and Brand DNA. | M2 segmentation |
| 4. Value Proposition | Positioning statement (target + value + competitive set + reasons to believe). Validate with 3Cs. | M2 value prop, 3Cs |
| **G2** | Brand Guardian validates positioning is consistent with Brand DNA. Listeners confirm market space exists. | — |
| 5. Media Plan | Activate Funnel Matrix. For each objective x audience, recommend channels via Channel Manager. Distinguish Paid (M3), Owned (M4), Earned (M4). Opportunity Agent adds timing. Media Scout adds channel opportunities. | M3, M4 |
| 6. Budget Allocation | Financial Agent distributes budget by channel x funnel stage. Uses M6 formulas (CAC target, expected ROAS, LTV projection). Sets alert thresholds. | M6 |
| **G3** | Human reviews complete plan before campaign briefs are generated. | — |

**Output:** Campaign Briefs — structured documents that feed Creation and Distribution motors. Each brief specifies: objective, audience, channel, required format, assigned budget, expected KPIs, timeline.

### 4.2 Brand Builder Pipeline

```
[1] Discovery → [2] Research → [G1] → [3] Positioning → [4] Identity → [G2] → [5] Brand DNA Document → [G3] → OUTPUT: Brand DNA
```

| Step | What happens |
|------|-------------|
| 1. Discovery | Guided workshop with client: mission, vision, values, history, product/service, differentiators, aspirations. |
| 2. Research | Sociologist Agent analyzes audiences (behavioral, psychographic, cultural). Competitive Listener maps competitors. Culture Listener identifies relevant trends. |
| **G1** | Are insights sufficient for positioning decisions? |
| 3. Positioning | 3Cs framework (M2). Defines: target audience, value proposition, competitive set, positioning statement, tone of voice, brand personality. |
| 4. Identity | Visual system (colors, typography, logo direction, imagery style). Verbal system (tone, vocabulary, key phrases, what the brand says and doesn't say). |
| **G2** | Internal consistency check. Does positioning reflect in identity? |
| 5. Brand DNA Document | Final persistent document: mission, vision, values, audiences, positioning, visual identity, verbal identity, guidelines, do's and don'ts. |
| **G3** | Client reviews and approves Brand DNA. |

**Output:** Brand DNA Document — stored as persistent document, injected as context into ALL other motors. Single source of truth for the brand.

### 4.3 Listeners (x4) + Opportunity Agent

All Listeners follow the same pattern:

```
Sources → Ingestion → Analysis → Insights → Alerts/Feed
                                      │
                              Opportunity Agent
```

| Listener | Sources | What it looks for | Output |
|----------|---------|-------------------|--------|
| **Brand** | Social mentions, reviews, press, forums | Sentiment, perception shifts, crisis signals, brand health score | Brand Health Report, Crisis Alerts |
| **Culture** | Trending topics, news, social movements, memes, seasonal events | Cultural trends relevant to client audiences | Culture Trends Feed, Moment Alerts |
| **Industry** | Trade publications, reports, patents, product launches | Innovation, market shifts, new technologies | Industry Intelligence Report |
| **Competitive** | Competitor websites, ads, social, pricing, launches | Competitive moves, gaps, benchmarks | Competitive Dashboard, Move Alerts |

**Opportunity Agent** crosses all 4 Listener outputs with client audiences and Brand DNA:

```
Culture Listener: "Trending topic X exploding on TikTok"
    + Brand Listening: "Our brand has affinity with this topic"
    + Audience: "60% of our audience follows this trend"
    = OPPORTUNITY: "Create content about X for TikTok in next 48h"
```

**Opportunity Brief contains:** moment detected, brand relevance, impacted audience, recommended channel, time window, suggested action, risk assessment.

**Autonomy:** In "AI decides" mode, can automatically trigger Creation + Distribution orders for time-sensitive opportunities.

### 4.4 Events Pipeline

```
[1] Brief → [2] Concept → [G1] → [3] Planning → [4] Production → [G2] → [5] Pre-event → [6] Live Event → [7] Post-event → [G3] → OUTPUT: Report + Assets
```

| Step | What happens |
|------|-------------|
| 1. Brief | Event objective, audience, tentative date, budget, type (launch, networking, conference, activation, workshop, gala, trade show). |
| 2. Concept | Theme, narrative, desired experience. Aligned with Brand DNA. Strategist validates it serves marketing plan objectives. |
| **G1** | Financial Agent validates budget. Is concept executable within date and budget? |
| 3. Planning | **Venue:** search, compare, quote, reserve. **Suppliers:** catering, decoration, A/V, photography/video, security, transport (via Marketplace). **Rundown:** minute-by-minute agenda, speakers, activities. **Guests:** list, segmentation (VIP, press, clients, prospects), invitation system + RSVP. **Content:** presentations, printed materials, venue branding, signage (via Design + Print Production). **Digital:** event landing page (via Web), email invitations (via Email Marketing), social pre-event (via Community Management). |
| 4. Production | Execute all planned items. Coordinate with suppliers. Produce materials via Design and Video motors. |
| **G2** | Ready check: venue confirmed, suppliers confirmed, rundown final, guests confirmed, materials ready? |
| 5. Pre-event (72-24h) | Final attendee confirmation. Reminders. Venue setup. Operational checklist. Community Management: social hype. |
| 6. Live Event | Rundown execution. Real-time coverage (photos, stories, live streaming). Social coverage. Attendance tracking. Contingency handling. |
| 7. Post-event | Thank you emails. Content distribution (photos, video recap, highlights). Satisfaction survey. Lead follow-up. Derivative content for social. |
| **G3** | Success measurement: attendance vs target, leads generated, social engagement, ROI, NPS, press coverage. |

**Output:** Event Report + derivative assets (photos, videos, social content) that feed other motors.

### 4.5 Print Production Pipeline

```
[1] Production Order → [2] Technical Specs → [3] Prepress Adaptation → [G1] → [4] Supplier → [5] Color Proof → [G2] → [6] Production → [7] Delivery → [G3] → OUTPUT: Delivered pieces
```

| Step | What happens |
|------|-------------|
| 1. Production Order | Receives final art from Graphic Design + channel specs from Channel Manager. Defines: what piece, how many, by when, where to deliver. |
| 2. Technical Specs | Defines requirements per piece type: paper, finish, inks (CMYK/Pantone/special), cutting, binding, material, installation method. Covers: business cards, brochures, banners, signage, packaging, merchandising, outdoor, POP. |
| 3. Prepress Adaptation | RGB→CMYK conversion, bleed and safety margins, correct resolution for final size, overprint/trapping, ink separation, PDF/X-1a generation, physical mockup preview. |
| **G1** | Prepress technically correct? Brand Guardian validates identity not altered in adaptation. |
| 4. Supplier | Search Supplier Registry (subset of Marketplace), get 2-3 quotes, select based on price/quality/timeline/location, issue purchase order. |
| 5. Color Proof | Soft proof (digital) or hard proof (physical). Compare with brand color reference from Brand DNA. Approve before full production run. |
| **G2** | Proof matches expectations? Proceed to full run? |
| 6. Production | Monitor print run. Production timelines. Quality control of samples during run. |
| 7. Delivery | Logistics to final destination (client office, POS, event venue, outdoor company). Receipt confirmation. Quantity and quality verification. |
| **G3** | Delivered complete, on time, correct quality? |

### 4.6 Ads (Pauta) Pipeline

```
[1] Campaign Brief → [2] Setup → [3] Creatives → [G1] → [4] Launch → [5] Continuous Optimization → [G2 periodic] → [6] Close → [G3] → OUTPUT: Performance Report
```

| Step | What happens |
|------|-------------|
| 1. Campaign Brief | From Strategist: objective, audience, channel(s), budget, KPI targets (CAC, ROAS, CTR), timeline. Channel Manager provides channel specs. |
| 2. Setup | Campaign structure (campaign → ad sets → ads). Audience segmentation (demographics, interests, behaviors, lookalikes, retargeting). Bidding strategy. Placement selection. Tracking setup (pixels, UTMs, conversion events). Schedule. |
| 3. Creatives | Request assets from Design and/or Video per required formats. Generate A/B variants for testing. |
| **G1** | Creatives approved by Brand Guardian? Technical setup correct? Budget aligned with Financial Agent? Tracking working? |
| 4. Launch | Publish via channel API (Meta, Google, TikTok, LinkedIn, etc.) or manual-assisted for channels without API (radio, TV, outdoor). |
| 5. Continuous Optimization | Daily KPI monitoring via Analytics. **Auto (if configured):** pause bad ad sets, reallocate budget, activate new creative variants, adjust bids, expand/refine audiences. **Requires human:** strategy change, >20% budget shift, pause entire campaign, new channel. |
| **G2 (weekly)** | Meeting KPIs? Budget on track? Anomalies? Need new creatives? Financial Agent reviews spend vs forecast. |
| 6. Close | Flight ended or budget exhausted. Data consolidation. |
| **G3** | Final performance: ROAS, ROI, CAC, total conversions, learnings. Feeds Strategist for future campaigns. |

**Supported channels (via Channel Manager skills):**

| Channel | Integration | Type |
|---------|-------------|------|
| Meta (FB + IG) | API | Paid |
| Google Ads (Search, Display, YouTube, Shopping, PMax) | API | Paid |
| TikTok Ads | API | Paid |
| LinkedIn Ads | API | Paid |
| Twitter/X Ads | API | Paid |
| Programmatic / DSP | API | Paid |
| TV | Manual-assisted | Paid (traditional) |
| Radio | Manual-assisted | Paid (traditional) |
| Outdoor (billboards, transit, mupis) | Manual-assisted | Paid (traditional) |
| Press (print insertions) | Manual-assisted | Paid (traditional) |
| Custom channels | Configurable | User-defined |

### 4.7 Community Management (Continuous Loop)

```
Content Calendar → Publication → Listening → Response → Engagement → Report
       ↑                                                                  │
       └──────────────────────────────────────────────────────────────────┘
```

| Function | What happens |
|----------|-------------|
| **Content Calendar** | Weekly/monthly planning per social network. Aligned with active campaigns from Strategist. Incorporates Opportunity Agent reactive content. Content pillars from Brand DNA. Mix: planned (70%) + reactive (20%) + experimental (10%). |
| **Publication** | Automatic scheduling per network (optimal times per audience). Format adaptation per platform (Design provides, Channel Manager gives specs). Hashtag strategy. Intelligent cross-posting (adapts tone and format per network, not same post everywhere). |
| **Listening** | Monitor mentions, DMs, comments, tags. Automatic classification: question, complaint, praise, spam, sales opportunity, crisis. Brand Listener feed integrated. |
| **Response** | Auto-responses for FAQ. Personalized responses for complex interactions. Tone aligned with Brand DNA. Escalation: serious complaint or crisis → human alert. Sales opportunity → Sales/CRM feed. |
| **Engagement** | Proactive interaction with community content. Participation in relevant conversations. UGC curation and repost. Micro-influencer relationship building. |
| **Report (weekly)** | Metrics per network: followers, reach, engagement rate, best performing content. Sentiment trend. Average response time. Opportunities detected. Feed to Analytics. |

### 4.8 Email Marketing Pipeline

**Campaign mode (project):**

```
[1] Brief → [2] Segmentation → [3] Content → [4] Design → [G1] → [5] A/B Test → [6] Send → [7] Analysis → OUTPUT: Performance + Leads
```

| Step | What happens |
|------|-------------|
| 1. Brief | Objective (nurture, conversion, retention, announcement), audience, timing. |
| 2. Segmentation | From contact base, select segment by: behavior, demographics, funnel stage, prior engagement, purchase history. |
| 3. Content | Subject line (A/B variants), preheader, body copy, CTA. Aligned with Brand DNA and active campaign. |
| 4. Design | Responsive HTML template. Graphic Design produces visual assets. |
| **G1** | Spam score check, link validation, rendering test (Gmail, Outlook, Apple Mail), Brand Guardian validates. |
| 5. A/B Test | Test with 10-20% subset. Measure open rate and CTR. Select winning variant. |
| 6. Send | Send to rest of list with winner. Respect recipient timezone. Throttle to protect domain reputation. |
| 7. Analysis | Open rate, CTR, conversion rate, unsub rate, bounce rate, attributed revenue. Feed to Analytics. |

**Automated flows (continuous):**

| Flow | Trigger | Sequence |
|------|---------|----------|
| Welcome | New subscriber | Day 0: welcome → Day 2: value prop → Day 5: case study → Day 7: offer |
| Nurture | Lead in consideration | Educational series based on detected interest |
| Abandoned cart | Cart abandoned | +1h: reminder → +24h: incentive → +72h: urgency |
| Re-engagement | Inactive 30+ days | "We miss you" → special offer → last attempt → auto-unsub |
| Post-purchase | Purchase completed | Thank you → review request → cross-sell → loyalty |
| Event follow-up | Attended event | Thank you → event content → related offer |

### 4.9 SEO/Content Pipeline

```
[1] Keyword Research → [2] Content Strategy → [G1] → [3] Production → [4] Publication → [5] Continuous Optimization → OUTPUT: Organic Traffic + Authority
```

| Step | What happens |
|------|-------------|
| 1. Keyword Research | Based on Strategist audiences + Brand DNA + Industry Listener. Map keywords by funnel stage (M4: broad top-funnel, long-tail bottom-funnel). Search intent analysis. Competitive gap analysis via Competitive Listener. |
| 2. Content Strategy | Organic content calendar. Thematic pillars from Brand DNA. Formats: blog posts, landing pages, guides, whitepapers, case studies, videos, infographics. Each piece has keyword target, funnel stage, and CTA. |
| **G1** | Human validates topics and keywords are correct. |
| 3. Production | Content produced by invoking other motors per format: text → Copywriter, images → Design, video → Video, infographics → Design. SEO on-page: meta titles, descriptions, headers, internal linking, schema markup. |
| 4. Publication | On client website (Web motor) or owned platforms (Medium, LinkedIn articles, YouTube). |
| 5. Optimization (continuous) | Ranking monitoring via Analytics. Content refresh for pieces losing positions. Link building strategy. Periodic technical SEO audits (page speed, mobile, crawlability). New keyword opportunities from Industry/Culture Listeners. |

### 4.10 Sales/CRM Pipeline

```
[1] Lead Capture → [2] Enrichment → [3] Scoring → [4] Qualification → [G1] → [5] Nurture/Outreach → [6] Proposal → [G2] → [7] Negotiation → [8] Close → OUTPUT: Client
```

| Step | What happens |
|------|-------------|
| 1. Lead Capture | Leads from: forms (Web), events (Events), social (Community Management), ads (Pauta), email (Email Marketing), referrals, manual entry. |
| 2. Enrichment | Enrich with public data (LinkedIn, company, industry, size, location). Media Scout provides context if lead is media/influencer. |
| 3. Scoring | Model: Fit score (buyer persona match) + Intent score (behavior-based interest) + Budget score (company size, industry). |
| 4. Qualification | BANT classification (Budget, Authority, Need, Timeline). |
| **G1** | Qualified lead? Minimum score reached? Worth pursuing? |
| 5. Nurture/Outreach | Hot leads: direct outreach (personalized email, WhatsApp, call). Warm leads: automated nurture via Email Marketing. Cold leads: retargeting via Ads. |
| 6. Proposal | Commercial proposal generation. Uses Brand DNA for visual look. Financial Agent validates pricing. |
| **G2** | Proposal sent and lead actively evaluating? |
| 7. Negotiation | Follow-up, objection handling, proposal adjustment if needed. |
| 8. Close | Signature, new client onboarding. If applicable, triggers Brand Builder to create their Brand DNA. |

**Kanban view:** New → Contacted → Qualified → Proposal → Negotiation → Closed Won → Closed Lost

### 4.11 Analytics (Transversal Continuous)

**Data sources:**

| Source | Data | Integration |
|--------|------|-------------|
| Ads | Impressions, clicks, CTR, CPC, conversions, ROAS, spend | Channel APIs |
| Community Management | Followers, engagement rate, reach, sentiment | Social media APIs |
| Email Marketing | Open rate, CTR, unsub rate, conversions | ESP API |
| SEO/Content | Rankings, organic traffic, backlinks, page speed | Google Search Console, Analytics |
| Sales/CRM | Pipeline value, conversion rates, deal velocity, revenue | Internal data |
| Events | Attendance, leads, event ROI | Internal data |
| Print Production | Production costs | Internal data |
| Marketplace | Provider costs | Internal data |
| All motors | AI compute costs (agent executions, model usage) | Internal data |

**Dashboards:**

| Dashboard | Purpose | Audience |
|-----------|---------|----------|
| Executive | Business KPIs in simple language | Founder, clients |
| Campaign | Performance per campaign cross-channel | Strategist, marketing team |
| Channel | Comparative between channels | Channel Manager, Media Scout |
| Funnel | Conversion rates per stage | Strategist, Sales |
| Cost | Where every dollar is spent | Financial Agent, founder |

**Attribution models:** First-touch, last-touch, linear, data-driven (when volume permits), cross-channel.

**Automated reports:**
- **Daily:** anomaly alerts (metric drops/spikes)
- **Weekly:** performance summary + recommendations
- **Monthly:** executive report + full ROI + period-over-period comparison
- **On-demand:** user asks in natural language, agent generates report

**Key formulas (M6):**
- `CAC = Total marketing spend / New customers acquired`
- `LTV = Average revenue per customer x Customer lifespan`
- `LTV:CAC ratio` (target: >3:1)
- `ROAS = Revenue / Ad spend`
- `ROI = (Revenue x Margin - Total cost) / Total cost`
- `Payback period = CAC / Monthly revenue per customer`

**Feeds:** Strategist (data for future plans), Financial Agent (performance vs budget for reallocation), Opportunity Agent (performance patterns suggesting new actions), Ads (optimization signals for active campaigns).

---

## 5. Transversal Components

### 5.1 Brand Guardian (single agent)

**Mission:** Validate that EVERY output from EVERY motor is consistent with Brand DNA.

**Operates as:** Quality gate participant. Any motor can invoke Brand Guardian before releasing an output.

**Checks:** Visual identity (colors, typography, logo usage), verbal identity (tone, vocabulary, messaging), positioning alignment, guideline compliance.

**Output:** Pass/fail + specific feedback if fail.

### 5.2 Financial Agent (single agent)

**Mission:** Control budget across all motors and validate economic viability.

**Responsibilities:**
- Budget allocation per motor, campaign, channel
- Spend tracking in real-time
- Forecast vs actual monitoring
- ROI validation before approving spend
- Alert when budget thresholds exceeded
- Supplier cost validation (Marketplace, Print Production)
- P&L per campaign, per client, aggregate

### 5.3 Channel Manager (single agent + skill registry)

**Mission:** Be the expert on every communication channel.

**Architecture:** One agent that loads channel-specific skills on demand. Each skill contains:

| Skill field | Content |
|-------------|---------|
| Channel name | e.g., "Meta Ads (Facebook + Instagram)" |
| Type | Paid / Owned / Earned / Traditional |
| Reach | Audience size, demographics, geographies |
| Formats | Available ad/content formats with specs |
| API | Integration method, endpoints, auth, rate limits |
| Pricing | Cost model (CPM, CPC, CPA), typical ranges by market |
| Best practices | What works, optimal frequencies, creative guidelines |
| Risks | Platform policy changes, audience fatigue, brand safety |
| Limitations | Character limits, file sizes, aspect ratios, durations |
| Measurement | Available metrics, attribution support, pixel/SDK |

**Adding a new channel = adding a new skill file.** No code changes required.

**Includes traditional channels:** TV, Radio, Outdoor, Press, Cinema, Events — with manual-assisted integration specs.

**Includes custom channels:** User can define any channel with its specs.

### 5.4 Media Scout (single agent)

**Mission:** Discover WHERE to communicate — media opportunities, partnerships, spaces.

**Searches for:**
- **Digital:** Relevant podcasts, niche newsletters, online communities, influencers/creators, emerging platforms
- **Traditional:** TV/radio programs, print publications, outdoor spaces in high-concentration zones
- **Partnerships:** Complementary brands, co-branding opportunities, affiliate programs
- **Unconventional:** Product placement, POS activations, ambient marketing, sponsorships

**Output:** Media Opportunity Brief (channel/medium, audience match %, format, estimated cost, projected reach, time window, risk, recommendation).

**Modes:**
- **Continuous:** Constantly scans the media ecosystem, maintains a live **Media Registry**
- **On-demand:** When Strategist generates a Marketing Plan, Media Scout actively searches for specific channels for that campaign

**Integration with Channel Manager:** When Scout discovers a new channel, triggers Channel Manager to create/update corresponding skill.

### 5.5 Security Team (~6 agents)

**Mission:** Protect the platform, its data, and its users across development and operations.

**Agents:**

| Agent | Mission | Mode |
|-------|--------|------|
| **Security Architect** (Team Leader) | Define policies, evaluate risks, prioritize mitigations, report to admin | Continuous |
| **Code Guardian** | Vulnerability scanning, dependency audit, secrets detection, SAST/DAST | Continuous (hooks on each deploy) |
| **Infrastructure Sentinel** | Server monitoring, SSL certs, firewall, backups, uptime, DDoS detection | Continuous |
| **Data Protection Officer** | Compliance (GDPR, LGPD, CCPA), encryption audit, PII detection, data retention, right to deletion | Continuous |
| **Agent Auditor** | Validate agents don't leak data between tenants, don't exceed permissions, aren't vulnerable to prompt injection | Continuous |
| **Threat Hunter** | Proactive threat detection: access anomalies, credential stuffing, brute force, phishing, fraud | Continuous |

**Key responsibilities by agent:**

- **Code Guardian:** Automatic scanning on every commit/PR. Detect hardcoded secrets. Audit dependencies for known CVEs. OWASP Top 10 enforcement. Auth config validation.
- **Infrastructure Sentinel:** SSL certificate expiry monitoring. Server access log analysis. Backup verification (existence AND restorability). Rate limiting. DDoS pattern detection.
- **Data Protection Officer:** Multi-tenancy isolation (client A never sees client B data). Encryption at rest and in transit. PII detection in artifacts and logs. Data retention policy enforcement. Compliance reporting by jurisdiction.
- **Agent Auditor:** Each agent has a permission scope — Auditor verifies compliance. Prompt injection detection in user/client inputs. Cross-tenant data leakage prevention. Anomalous cost detection (agent spending 10x normal may indicate a loop or attack). Sandbox testing of new agents before production.
- **Threat Hunter:** Login anomaly detection (location, time, device). API abuse patterns. Credential stuffing detection. Phishing detection in generated content. Fraud patterns in Marketplace (fake providers, inflated billing).

### 5.6 Marketplace (transversal infrastructure)

**Concept:** Integrated marketplace where agentic (AI) and human providers coexist for any marketing-related service.

**Provider types:**

| Type | What they are | Examples |
|------|--------------|---------|
| **Agentic (AI)** | External AI services via API | Image generation, translation, voiceover, transcription, stock |
| **Human freelance** | Independent professionals | Photographers, videographers, voiceover artists, translators, specialized copywriters |
| **Companies** | Full-service providers | Printers, audio studios, PR agencies, event companies, venues, catering |
| **Media** | Channels and advertising spaces | Media outlets, influencers, podcasters, billboard owners, POS space owners |

**Categories:** Visual production, Audiovisual production, Audio, Text, Development, Printing & production, Events, Media & PR, AI services, Consulting.

**Supplier profile includes:** name, type, category, location, portfolio, rating, average price, response time, availability, skills, integration method, history.

**Contracting pipeline:**

```
[1] Need detected → [2] Marketplace search → [3] Match + Quote → [G1] → [4] Contract → [5] Execution → [6] Delivery → [G2] → OUTPUT: Service completed
```

**Business model:** Transaction commission (10-15%), premium supplier subscriptions, AI service markup.

**Integration:** All motors can invoke Marketplace. Print Production's Supplier Registry and Events' vendor lists are subsets of Marketplace.

---

## 6. Funnel Matrix — Central Organizing Concept

The Funnel Matrix is the primary navigation and planning tool for campaigns:

```
              │ Awareness │ Consideration │ Conversion │ Retention │
──────────────┼───────────┼───────────────┼────────────┼───────────┤
PAID          │           │               │            │           │
  Meta Ads    │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Google Ads  │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  TikTok      │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  LinkedIn    │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  TV          │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Radio       │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Outdoor     │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  ...         │           │               │            │           │
──────────────┼───────────┼───────────────┼────────────┼───────────┤
OWNED         │           │               │            │           │
  Website     │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Blog        │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Email       │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Social Org  │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  App/Push    │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  ...         │           │               │            │           │
──────────────┼───────────┼───────────────┼────────────┼───────────┤
EARNED        │           │               │            │           │
  Press       │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  UGC         │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Influencers │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  Community   │  [cell]   │    [cell]     │   [cell]   │  [cell]   │
  ...         │           │               │            │           │
```

**Each cell represents** a potential campaign activation. The Strategist recommends which cells to activate based on objectives, audiences, and budget. The Channel Manager provides specs for each row. The Financial Agent allocates budget across active cells.

**The matrix is extensible:** new rows are added via Channel Manager skills + Media Scout discoveries. Custom channels appear as new rows.

---

## 7. Agent Communication Architecture

### 7.1 Communication model: Hybrid (Messages + Events)

Two layers:
- **Intra-motor:** Team Leaders assign tasks to sub-agents via **direct messages** (TaskMessage/ResultMessage). Sub-agents never talk to each other directly — the leader routes everything.
- **Cross-motor:** Motors publish **typed events** to a central Event Bus. Other motors subscribe and react. Motors don't need to know each other — they only know event types.

```
INTRA-MOTOR (messages)              CROSS-MOTOR (events)

  ┌──────────────┐                ┌──────────┐     ┌───────────┐     ┌──────────┐
  │  Team Leader │                │ Motor A  │────▶│ EVENT BUS │────▶│ Motor B  │
  └──┬───┬───┬──┘                │ (publish)│     │ (route by │     │(subscribe)│
     │   │   │  TaskMessage      └──────────┘     │   type)   │     └──────────┘
  ┌──▼┐┌─▼─┐┌▼──┐                                └─────┬─────┘
  │ A1││ A2││ A3│  Sub-agents                           │
  └──┬┘└─┬─┘└┬──┘                                ┌─────▼─────┐
     │   │   │  ResultMessage                     │  Motor C  │
  ┌──▼───▼───▼──┐                                │(subscribe)│
  │  Team Leader │                                └───────────┘
  └─────────────┘
```

### 7.2 Intra-Motor: TaskMessage / ResultMessage

**TaskMessage (Leader → Sub-agent):**

```typescript
interface TaskMessage {
  id: string                    // unique message ID
  from: AgentId                 // team leader ID
  to: AgentId                   // sub-agent ID
  project_id: string            // project context
  motor: MotorType              // which motor
  step: PipelineStep            // current pipeline step
  task_type: string             // what to do (e.g., "write_script", "generate_image")

  // Context
  inputs: ArtifactRef[]         // artifacts to consume (explicit, not implicit)
  brand_dna: BrandDNARef        // brand context (always injected)
  project_bible?: ProjectBible  // vision doc from Showrunner (if exists)
  upstream_feedback?: string    // feedback from gate failure or leader review

  // Constraints
  attempt: number               // which attempt (1-6 in 3+3 rule)
  leader_adjustments?: string   // if attempt 4-6, what the leader changed
  deadline?: Date               // expected completion time
  budget_limit?: number         // max AI cost for this execution

  // Instructions
  instructions: string          // specific task instructions
  success_criteria: string[]    // what "done" looks like
  output_format: ArtifactType   // expected output type
}
```

**ResultMessage (Sub-agent → Leader):**

```typescript
interface ResultMessage {
  id: string
  task_id: string               // references the TaskMessage
  from: AgentId                 // sub-agent ID
  to: AgentId                   // team leader ID
  status: "completed" | "failed" | "needs_input" | "blocked"

  // Outputs
  artifacts: ArtifactRef[]      // produced artifacts

  // Metadata
  model_used: string            // which AI model was used
  cost: number                  // AI compute cost
  duration_ms: number           // execution time
  tokens_in: number             // input tokens consumed
  tokens_out: number            // output tokens produced

  // If failed/blocked
  failure_reason?: string       // why it failed
  needs_from?: AgentId          // if blocked, who can unblock
  suggested_action?: string     // agent's recommendation
}
```

**Intra-team special patterns:**

| Pattern | How it works |
|---------|-------------|
| **Request** | Sub-agent A3 returns `status: "needs_input", needs_from: A2` → Leader creates new TaskMessage for A2 → A2 produces → Leader routes back to A3 |
| **Veto** | Sub-agent returns `status: "completed"` → Leader reviews, detects issue → Leader sends new TaskMessage with `upstream_feedback` → Sub-agent retries (counts toward 3+3) |
| **Parallel** | Leader sends TaskMessages to A1, A2, A3 simultaneously → waits for all ResultMessages → aggregates outputs |

### 7.3 Cross-Motor: Event Bus

Motors publish typed events. Other motors subscribe by event type. No direct coupling between motors.

**Event anatomy:**

```typescript
interface PlatformEvent {
  id: string                    // unique event ID
  type: string                  // e.g., "asset.requested"
  source_motor: MotorType       // who published
  source_agent?: AgentId        // specific agent (optional)
  timestamp: Date
  client_id: string             // tenant context (for isolation)
  project_id?: string           // project context (if applicable)

  payload: Record<string, any>  // event-specific data

  // For request-response patterns
  correlation_id?: string       // links request to response
  reply_to?: string             // where to send the response event
}
```

**Event catalog:**

| Category | Event | Payload | Typical subscribers |
|----------|-------|---------|-------------------|
| **Lifecycle** | `project.created` | project_id, motor, client_id, type | Analytics, Financial, Security |
| **Lifecycle** | `project.completed` | project_id, motor, artifacts, duration, cost | Analytics, Client Portal, Sales/CRM |
| **Lifecycle** | `project.failed` | project_id, motor, reason | Alerts, Analytics |
| **Pipeline** | `step.started` | project_id, motor, step, agents | Analytics, Admin Portal (SSE) |
| **Pipeline** | `step.completed` | project_id, motor, step, artifacts, cost | Analytics, next step trigger |
| **Pipeline** | `gate.passed` | project_id, motor, gate, scores | Analytics, Admin Portal |
| **Pipeline** | `gate.failed` | project_id, motor, gate, attempt, feedback | Alerts, Analytics |
| **Agent** | `agent.started` | agent_id, task_id, project_id | Agent Dashboard |
| **Agent** | `agent.completed` | agent_id, task_id, artifacts, cost | Agent Dashboard |
| **Agent** | `agent.escalated` | agent_id, task_id, reason, attempt | Alerts, Team Leader |
| **Agent** | `agent.stuck` | agent_id, task_id, duration | Alerts, Security |
| **Cross-motor** | `asset.requested` | requesting_motor, asset_type, brief, priority, callback | Creation motors |
| **Cross-motor** | `asset.delivered` | request_id, artifacts | Requesting motor |
| **Cross-motor** | `campaign.needs_creative` | campaign_id, channel, format, specs | Design, Video, Audio |
| **Cross-motor** | `opportunity.detected` | opportunity_brief | Strategist, relevant Creation motors |
| **Cross-motor** | `lead.captured` | lead_data, source_motor, source_campaign | Sales/CRM |
| **Cross-motor** | `brand_dna.updated` | client_id, changes | ALL motors (refresh context) |
| **Cross-motor** | `budget.alert` | client_id, motor, threshold, current_spend | Financial, Alerts, Strategist |
| **Cross-motor** | `channel.discovered` | channel_data | Channel Manager |
| **Intelligence** | `trend.detected` | trend_data, relevance_scores | Opportunity Agent, Strategist |
| **Intelligence** | `competitor.moved` | competitor, action, impact | Strategist, Opportunity Agent |
| **Intelligence** | `brand.crisis` | severity, mentions, sentiment | Alerts, Community Management, Brand Guardian |
| **Security** | `security.violation` | type, agent_id, details | Security Center, Alerts |
| **Security** | `security.anomaly` | type, user_id, details | Threat Hunter, Alerts |
| **Marketplace** | `provider.needed` | category, specs, budget, deadline | Marketplace |
| **Marketplace** | `provider.delivered` | request_id, deliverables | Requesting motor, Brand Guardian (QA) |
| **Financial** | `invoice.generated` | client_id, amount, items | Backoffice/Finanzas |
| **Financial** | `cost.threshold` | motor, percentage, projected_overrun | Financial Agent, Alerts |

**Subscription patterns:**

| Pattern | How it works | Example |
|---------|-------------|---------|
| **Fan-out** | One event → multiple subscribers | `project.completed` → Analytics + Client Portal + Sales/CRM |
| **Request-Response** | Motor publishes request, waits for response event linked by `correlation_id` | Ads publishes `campaign.needs_creative` → Design responds with `asset.delivered` |
| **Chain** | Event triggers action, which triggers another event | `opportunity.detected` → Strategist creates brief → `campaign.created` → Ads sets up campaign |
| **Broadcast** | Platform-wide notification | `brand_dna.updated` → ALL motors refresh their Brand DNA context |

**Implementation:** Redis + BullMQ (already in tech stack). Events published to Redis streams, consumed by motor workers subscribed to relevant event types.

### 7.4 Trigger chains (cross-motor sequences)

| Trigger | Event chain |
|---------|-------------|
| New client onboards | `project.created` (Brand Builder) → `brand_dna.updated` → `project.created` (Strategist) → `campaign.needs_creative` → `asset.requested` |
| Opportunity detected | `trend.detected` → `opportunity.detected` → (if autonomous) `asset.requested` + `campaign.created` → `step.completed` → `project.completed` |
| Campaign needs video | `campaign.needs_creative` (Ads) → `project.created` (Video) → ... → `asset.delivered` → Ads consumes |
| Event planned | `project.created` (Events) → `asset.requested` (Design) + `asset.requested` (Video) + `asset.requested` (Print) + `campaign.created` (Email) + `campaign.created` (Community) |
| Analytics detects drop | `budget.alert` or anomaly → `opportunity.detected` (optimize) → `campaign.needs_creative` or `asset.requested` |
| Lead converts to client | `lead.captured` → Sales pipeline → `project.created` (Brand Builder if needed) → full cycle |
| Media Scout finds channel | `channel.discovered` → Channel Manager creates skill → `opportunity.detected` for Strategist |
| Print needed | `asset.delivered` (Design) → `project.created` (Print) → `provider.needed` (Marketplace) → `provider.delivered` → `project.completed` |

---

## 8. Agent Tooling

### 8.1 Universal tools (all agents)

| Tool | Purpose |
|------|---------|
| `read_artifact` | Read an artifact from storage (input) |
| `write_artifact` | Create/version an artifact (output) |
| `read_brand_dna` | Read the current client's Brand DNA document |
| `read_project_context` | Read project metadata (status, client, type, history) |
| `publish_event` | Publish an event to the Event Bus |
| `log_decision` | Record a decision in the audit trail |
| `report_cost` | Report execution cost to Financial Agent |
| `request_help` | Escalate to Team Leader when blocked |

### 8.2 AI Generation tools

| Tool | Used by | Purpose |
|------|---------|---------|
| `generate_text` | Copywriters, Strategists, Content agents | Generate text via Claude/LLM |
| `generate_image` | Designers, Art Directors | Generate images via DALL-E/Midjourney/Flux |
| `generate_video` | Video agents | Generate video via Runway/Kling/Sora |
| `generate_audio` | Audio agents, Voiceover | Generate audio/voice via ElevenLabs/Suno |
| `generate_code` | Web developers | Generate code via Claude |
| `analyze_image` | QA agents, Art review | Analyze existing image (composition, brand compliance) |
| `analyze_video` | QA agents, Editor | Analyze video (pacing, quality, continuity) |
| `analyze_text` | QA agents, Brand Guardian | Analyze text (tone, grammar, brand alignment) |

### 8.3 External API tools

| Tool | Used by | Purpose |
|------|---------|---------|
| `meta_ads_api` | Ads agents | Create/manage/read Meta campaigns |
| `google_ads_api` | Ads agents | Create/manage/read Google campaigns |
| `tiktok_ads_api` | Ads agents | Create/manage/read TikTok campaigns |
| `linkedin_ads_api` | Ads agents | Create/manage/read LinkedIn campaigns |
| `social_api` (per platform) | Community Management | Post, read comments, DMs, mentions |
| `email_api` | Email Marketing | Send emails, manage lists, read analytics |
| `analytics_api` | Analytics agents | Read Google Analytics, Search Console |
| `search_trends_api` | Listeners, Strategist | Google Trends, social listening APIs |
| `news_api` | Culture/Industry Listeners | News feeds, RSS |
| `competitor_monitor_api` | Competitive Listener | Track competitor websites, ads, social |

### 8.4 Data tools

| Tool | Used by | Purpose |
|------|---------|---------|
| `query_database` | Analytics, Sales, Financial | Read from PostgreSQL (read-only for most) |
| `write_database` | Sales (lead mgmt), specific admin agents | Write to PostgreSQL (restricted) |
| `search_marketplace` | Any motor needing providers | Search Supplier Registry |
| `search_channels` | Channel Manager, Strategist, Media Scout | Search Channel Registry |
| `calculate_metrics` | Analytics, Financial | Compute CAC, LTV, ROAS, ROI, etc. |
| `generate_report` | Analytics, any reporting agent | Produce formatted reports |

### 8.5 Communication tools

| Tool | Used by | Purpose |
|------|---------|---------|
| `send_task` | Team Leaders only | Send TaskMessage to sub-agent |
| `receive_result` | Team Leaders only | Receive ResultMessage from sub-agent |
| `notify_client` | Client-facing agents | Push notification to client portal |
| `send_alert` | Any agent detecting anomaly | Create alert in Alert System |
| `request_approval` | Any agent at gate/decision point | Request human approval via Admin Portal |

### 8.6 File/media tools

| Tool | Used by | Purpose |
|------|---------|---------|
| `upload_to_r2` | Any agent producing assets | Upload to Cloudflare R2 |
| `download_from_r2` | Any agent consuming assets | Download from R2 |
| `convert_format` | Print Production, Media Adapter | Convert file formats (RGB→CMYK, resize, transcode) |
| `create_mockup` | Print Production, Design | Generate mockup preview of physical piece |

### 8.7 Security tools (Security Team only)

| Tool | Used by | Purpose |
|------|---------|---------|
| `scan_code` | Code Guardian | SAST/DAST scanning |
| `audit_dependencies` | Code Guardian | CVE scanning in dependencies |
| `check_secrets` | Code Guardian | Detect hardcoded secrets |
| `verify_encryption` | Data Protection Officer | Validate encryption at rest/transit |
| `check_tenant_isolation` | Agent Auditor | Verify no cross-tenant data leakage |
| `analyze_access_logs` | Threat Hunter | Pattern analysis on access logs |
| `scan_for_pii` | Data Protection Officer | Detect PII in artifacts/logs |

### 8.8 Tool permission matrix

| Tool category | Team Leader | Sub-agent | Transversal agent | Security |
|---------------|:-----------:|:---------:|:-----------------:|:--------:|
| Universal | Yes | Yes | Yes | Yes |
| AI Generation | Yes | Yes (own type only) | Limited | No |
| External APIs | Yes | Yes (assigned API only) | Yes (own scope) | Read-only |
| Data (read) | Yes | Own motor data only | Cross-motor (read) | Full read |
| Data (write) | Yes | Own artifacts only | Own scope only | Audit log only |
| Communication (`send_task`) | Yes | No | No | No |
| Communication (`publish_event`) | Yes | Via leader only | Yes | Yes |
| Communication (`send_alert`) | Yes | Via leader only | Yes | Yes |
| File/media | Yes | Yes | Limited | Scan only |
| Security tools | No | No | No | Yes |

---

## 9. Cross-Motor Integration Map

### Bidirectional connections

```
Strategist ←→ All motors (provides plans, receives performance data)
Brand DNA ←→ All motors (injected as context everywhere)
Financial Agent ←→ All motors (budget control everywhere)
Analytics ←→ All motors (receives data from all, feeds insights back)
Brand Guardian ←→ All creation/distribution motors (QA gate)
Marketplace ←→ All motors (any motor can request providers)
Security Team ←→ All motors (monitors everything)
Event Bus ←→ All motors (communication backbone)
```

---

## 10. Phased Rollout (Suggested)

Not all ~125 agents need to exist from day 1. Suggested phasing:

### Phase 1: Foundation (extends current Video engine)
- **Event Bus infrastructure** (Redis streams + BullMQ workers)
- **TaskMessage/ResultMessage protocol** (replace current synchronous dispatch)
- Brand Builder (core team: ~3 agents)
- Strategist (core team: ~3 agents)
- Brand Guardian
- Financial Agent
- Channel Manager (with 3-4 initial channel skills: Meta, Google, TikTok, LinkedIn)
- Analytics (core: ~2 agents, internal data only)
- Security (core: Security Architect + Code Guardian + Agent Auditor = 3 agents)
- **Total new: ~15 agents + infrastructure**

### Phase 2: Distribution
- Ads motor (core team: ~3 agents)
- Community Management (core team: ~3 agents)
- Email Marketing (core team: ~2 agents)
- SEO/Content (core team: ~2 agents)
- Listeners (x4 transversal agents)
- Opportunity Agent
- **Total new: ~15 agents**

### Phase 3: Operations & Physical
- Sales/CRM (core team: ~3 agents)
- Events (core team: ~4 agents)
- Print Production (core team: ~2 agents)
- Graphic Design (core team: ~3 agents)
- Web (core team: ~3 agents)
- Audio (core team: ~3 agents)
- Media Scout
- **Total new: ~19 agents**

### Phase 4: Scale & Marketplace
- Expand all teams to full size
- Marketplace infrastructure
- Additional Channel Manager skills (traditional, custom)
- Advanced Analytics (attribution models, ML)
- **Total new: ~20+ agents**

---

## 11. Related Documents

| Document | Relevance |
|----------|-----------|
| `PRODUCTION_PIPELINE.md` | Video engine pipeline — structural reference for all motor pipelines |
| `TEAM_STRUCTURE.md` | Video team organization — model for marketing teams |
| `AGENT_REGISTRY.md` | Video agent cards — model for marketing agent cards |
| `MVP_ROADMAP.md` | Video phased rollout — model for marketing phases |
| `TECH_ARCHITECTURE.md` | Shared infrastructure (state machine, gate router, dispatcher, 3+3) |
| `PORTAL_SPECS.md` | Public, client (6 Spaces), and admin portal specifications |
| `docs/brain/M1-M6_Summary.pdf` | Harvard Digital Marketing Strategy — Strategist knowledge base |
| `SESSION_CONTEXT.md` | Full project briefing and context |
| `SESSION_CONTEXT.md` | Full project context |
| Legacy: `docs/product-catalog.md` | Marketing Pipeline A→F, 10 transversal skills, agent definitions |
| Legacy: `docs/ux-experience.md` | 6 Spaces UX, Funnel Matrix, Account Executive model |
| Legacy: `src/shared/config/moduleRegistry.ts` | 17 SaaS modules, 3-tier pricing |
