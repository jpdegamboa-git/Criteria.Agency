# criteria.agency — Strategist Motor Design

> Date: April 8, 2026
> Status: Approved design
> Scope: Strategist motor — agent, skills, triggers, gates, autonomy, campaign pre-configuration, Analyst relationship
> Decisions: DEC-087 through DEC-101

---

## 1. Context

The Strategist is the strategic brain of criteria.agency. Without it, every other motor operates in isolation — the Creative Director has no direction, the Paid Media Operator has no plan, the Listeners generate insights nobody acts on, and the client stares at an empty Funnel Matrix wondering what to do.

Despite being referenced extensively across platform documentation (Marketing Engine Design §4.1, §11; Client Portal Navigation §6, §11; Team Structure), the Strategist had zero dedicated design as of April 8, 2026. This spec defines the complete motor.

### Position in the platform

| Attribute | Value |
|-----------|-------|
| Category | Strategy (motor) + Transversal (agent) |
| Agent | Strategist (1) |
| Mode | **Hybrid** — Skills activated by triggers. No dormant/continuous distinction — the Strategist has a rhythm base with accelerations by event |
| Output | Marketing Plans, Campaign Briefs (pre-configured), Strategic Adjustments, Client Intelligence |
| Consumers | Creative Director, Showrunner, all Creation motors, all Distribution motors, Financial Agent, Client (via portal and Copilot) |
| Primary dependency | Analyst (Operation motor) — the Strategist's eyes |

### Dual nature

The Strategist is unique in the architecture: it is simultaneously a **Strategy motor** (with its own pipeline and outputs) and a **Transversal agent** (operating across all motors). This dual nature reflects what a strategist does in a real agency — they have their own work product (the plan) but they also touch every other team's work.

### Key decisions made in this spec

| Decision | ID | Choice |
|----------|----|--------|
| Agent structure | DEC-087 | 1 agent with 5 skills. Not 3 agents, not 3 instances |
| Analyst/Strategist separation | DEC-088 | Analyst processes data, Strategist interprets and decides. Two different jobs |
| Analyst position | DEC-089 | Analyst stays in Operation (not transversal) with explicit interface toward Strategist |
| Skills | DEC-090 | 5 skills: Diagnostic, Planning, Campaign Design, Optimization, Campaign Learning |
| Two-layer knowledge | DEC-091 | Campaign Learning produces Client Intelligence (private) + data for Platform Intelligence (aggregated) |
| Platform Intelligence scope | DEC-092 | Shared infrastructure, not Strategist-exclusive. All agents can query it |
| Platform Intelligence as product | DEC-093 | Also exposed as public KPIs proving criteria.agency efficacy |
| Platform Intelligence spec | DEC-094 | Separate spec from Strategist — it's platform infrastructure |
| Cross-client sharing principle | DEC-095 | Same as DEC-083: environment is shareable, identity is not |
| Gate philosophy | DEC-096 | Viability checks, stricter than Brand Builder — real budget is at stake |
| Conflict resolution | DEC-097 | Strategist owns objectives, Creative Director owns creative execution, Brand Guardian has absolute veto on brand, Financial Agent has veto on financial viability |
| Pre-configured campaigns | DEC-098 | Everything pre-filled, everything editable. Client edits, never creates from scratch |
| Trigger model | DEC-099 | 17 triggers by skill, in 3 categories: scheduled, reactive, consequence |
| Token cost model | DEC-100 | All Strategist outputs consume tokens. Observing is free (Listeners, Analyst, score). Thinking and deciding costs tokens (Strategist). Producing costs tokens (creation motors) |
| Budget from economics | DEC-101 | Marketing budget is calculated from product economics (margin × addressable market × expected CAC), not from arbitrary client input |

---

## 2. Core Concept: The Analyst/Strategist Separation

The Strategist's design depends on a fundamental architectural decision: **the Analyst and the Strategist are two different agents with two different jobs.**

### Why separate them

The original architecture had the Strategist doing everything: monitoring data, calculating scores, detecting anomalies, interpreting results, designing plans, adjusting campaigns. This made the Strategist an amorphous "god agent" — impossible to implement, impossible to debug.

The separation recognizes that processing data and making strategic decisions are fundamentally different cognitive tasks. An analyst who says "conversion rate dropped 30%, concentrated in version B, pattern consistent with a landing page problem" is doing analysis. A strategist who says "redirect traffic to version A while we fix the landing, and shift 15% of budget to organic where we're overperforming" is making decisions.

### The Analyst (redefined)

The Analyst existed in the architecture as an Operation motor doing dashboards and reports. With this redesign, the Analyst becomes the **nervous system of the platform** — still in Operation, not transversal, but serving the entire platform.

| Attribute | Previous design | New design |
|-----------|----------------|------------|
| Position | Operation motor | Operation motor (unchanged) |
| Role | Reporter — dashboards, reports | Nervous system — data processing + diagnostic delivery |
| Consumers | Client | Client (interface 1) + Strategist (interface 2) |
| Output | Dashboards, reports | Dashboards, reports + processed diagnostics, contextualized anomalies, Brand Health Score calculation |
| Autonomy | Passive | Passive but proactive in signaling |

### Three interfaces of the Analyst

**Interface 1 → Client (visibility).** Dashboards, reports, metrics in the Funnel Matrix, answers to direct questions ("how many leads this week?"). Pure visibility. The client consumes this without Strategist intervention.

**Interface 2 → Strategist (processed diagnostics).** Not raw data — analytically interpreted data. "Conversion rate on Meta dropped 30% this week. Concentrated in version B. Audience engagement stable but CTR to landing collapsed. Pattern consistent with landing page problem, not creative." The Analyst says *what happened* and *what pattern it sees*. The Strategist decides *what to do*.

**Interface 3 → Brand Health Score (calculation).** The mechanical score calculation — aggregating metrics from Listeners, Analytics, Brand Guardian, Mi Negocio completeness, weighting them — is Analyst work. The number the client sees in the header is Analyst output. The *interpretation* of the score is Strategist work.

### The principle

**The Analyst works with data. The Strategist works with decisions.** The Analyst can say "what happened" and "what pattern I see." It never says "what we should do." That is always the Strategist's.

---

## 3. Strategist Agent

### Profile

| Attribute | Value |
|-----------|-------|
| Type | Agent (autonomous decisions, maintains context, iterates) |
| Motor | Strategist (Strategy category) + Transversal |
| Mode | Hybrid — skill-based activation by triggers |
| Autonomy | Configurable by client. "AI decides + human supervises" OR "AI recommends + human approves" |
| Human substitution priority | Highest. Marketing strategy is THE role where human judgment has the most quality impact. |

### Skills

| Skill | Purpose | Mode of thinking |
|-------|---------|-----------------|
| **Diagnostic** | Interpret the current reality of the client's marketing. Read Analyst outputs, Listener insights, Brand DNA, and produce a strategic diagnosis. | "Where are we and what does it mean?" — situational reading |
| **Planning** | Translate a diagnosis into a complete marketing plan: objectives, audiences, channels, budget, calendar. | "Where should we go and how do we get there?" — architectural strategy |
| **Campaign Design** | Design a specific campaign with pre-configured brief, audience targeting, Funnel Matrix distribution, and creative direction for the Creative Director. | "What specific play do we run?" — tactical design |
| **Optimization** | Make strategic-level adjustments to active campaigns: cross-campaign budget reallocation, strategy pivots, version scaling/killing. | "Is it working and what do we change?" — adaptive decision-making |
| **Campaign Learning** | Extract transferable intelligence from completed campaigns. Produce Client Intelligence and contribute to Platform Intelligence. | "What did we learn?" — retrospective synthesis |

### What is NOT the Strategist

| Agent | Relationship to strategy | Distinction |
|-------|------------------------|-------------|
| **Strategist** | Architect. Designs plans and campaigns, interprets data, makes decisions. | "We should target this channel with this message." |
| **Brand Strategist** (Brand Builder) | Foundation. Builds and questions the brand identity. | "Should our positioning change?" |
| **Creative Director** (Transversal) | Translator. Turns strategic direction into creative versions. | "The emotional angle works better than rational for this audience." |
| **Showrunner** (Transversal) | Validator. Validates campaign-level coherence and quality. | "These versions are inconsistent with each other." |
| **Analyst** (Operation) | Eyes. Processes data and surfaces patterns. | "Conversion rate dropped 30% this week." |
| **Financial Agent** (Transversal) | Accountant. Controls budget viability and tracks ROI. | "This budget allocation puts the quarterly target at risk." |

### Knowledge bases

**Static (frameworks):**
- Harvard Digital Marketing Strategy M1-M6 (`docs/brain/M1-M6_Summary.pdf`)
  - M1: Digital era, DTC model, value chain
  - M2: Marketing plan (Goals, Target, Value Prop, Metrics), funnel, positioning, 3Cs
  - M3: Paid media (SEM, Display, Native, Paid Social, OTT/CTV)
  - M4: Owned & Earned media (SEO, Content, Influencer, Email)
  - M5: Customer engagement (Personalization, Recommendations, Community)
  - M6: Budget allocation & measurement (Attribution, CAC, LTV, ROI, ROAS)
- Seth Godin methodology (shared with Brand Strategist) — smallest viable audience, tribal marketing

**Dynamic (accumulated):**
- Client Intelligence — learnings from this client's past campaigns (private)
- Platform Intelligence — patterns across all clients (aggregated, anonymized)

---

## 4. Skill Details

### 4.1 Diagnostic — "Where are we?"

**Purpose:** Interpret the current reality of the client's marketing and produce a strategic diagnosis that informs decisions.

**This is NOT what the Analyst does.** The Analyst processes data and detects patterns. The Diagnostic skill takes those patterns and puts them in strategic context: "The Analyst tells you your conversion rate dropped. The Strategist with Diagnostic tells you it dropped because your premium positioning is colliding with an aggressive discount campaign from your competitor, and your audience — which the Listener detects as price-sensitive — is migrating."

**Frameworks:** M1 (value chain, market position), M2 (3Cs — Company, Customer, Competition), contextual SWOT.

**Inputs:**
- Brand DNA (from Brand Builder)
- Analyst outputs: metrics, anomalies, trends, Brand Health Score breakdown
- Listener outputs: market intelligence, competitive moves, cultural trends, brand sentiment
- Client Intelligence: what we've learned from past campaigns
- Platform Intelligence: benchmarks for similar brands

**Output:** **Strategic Diagnosis** — where the client is, what's working, what's not, what changed, what opportunity exists, what risk exists. This document feeds all subsequent decisions.

**Triggers that load this skill:**
1. Material change in Brand Health Score (>X points on any axis)
2. Start of planning cycle (quarterly by default, configurable)
3. Post-Brand Builder layer 2 (strategic depth now available)
4. Significant anomaly from Analyst (structural pattern, not noise)
5. Relevant competitive move (via Competitive Listener)

### 4.2 Planning — "Where should we go?"

**Purpose:** Translate a diagnosis into a complete marketing plan with objectives, audiences, channels, budget allocation, and calendar.

**Pipeline:**

```
[Diagnosis input] → [1] Objectives → [G1] → [2] Audiences → [3] Value Prop → [G2] → [4] Media Plan → [5] Budget Allocation → [G3] → OUTPUT: Marketing Plan + Campaign Briefs
```

| Step | What happens | Framework |
|------|-------------|-----------|
| 1. Objectives | Define measurable goals aligned to funnel stages. Based on diagnosis and client business objectives from Mi Negocio. | M2 goals/objectives |
| **G1** | Are objectives realistic given budget and market? Financial Agent validates economic viability. **Budget is calculated from product economics: margin × addressable market × expected CAC (DEC-101).** | M6 |
| 2. Audiences | Segmentation (demographic, behavioral, motivational). Cross with Culture Listening and Brand DNA buyer personas. | M2 segmentation |
| 3. Value Proposition | Campaign-level positioning (not brand-level — that's Brand DNA). How the brand's value proposition maps to each audience segment for this plan period. | M2 value prop, 3Cs |
| **G2** | Brand Guardian validates positioning is consistent with Brand DNA. Listeners confirm market space exists. | — |
| 4. Media Plan | Activate Funnel Matrix. For each objective × audience, recommend channels via Channel Manager. Distinguish Paid (M3), Owned (M4), Earned (M4). Media Scout adds channel opportunities. Opportunity Agent adds timing. | M3, M4 |
| 5. Budget Allocation | Financial Agent distributes budget by channel × funnel stage. Uses M6 formulas (CAC target, expected ROAS, LTV projection). Sets alert thresholds. **Grounded in product economics, not arbitrary input (DEC-101).** | M6 |
| **G3** | **Human reviews and approves complete plan.** Obligatory — the Strategist never executes a plan without client approval. | — |

**Output:** Marketing Plan (master document) + Campaign Briefs (pre-configured campaigns for the plan period).

**Budget calculation principle (DEC-101):**

The Strategist does not ask "how much do you want to spend?" It calculates how much makes sense:

"Your product has a $30 margin. Your addressable market is 50K people. To acquire a customer in your industry, the average CAC is $12 (Platform Intelligence). That means to acquire 500 new customers, you need ~$6,000 in acquisition investment, and each customer leaves $18 net margin post-acquisition. At that investment level, expected ROI is 2.5x."

The client can override, but the Strategist always proposes a grounded budget. The Financial Agent validates that the proposed budget is viable within the client's overall financial constraints.

**Triggers that load this skill:**
6. Diagnosis completed that requires new plan (consequence of Diagnostic)
7. New client post-onboarding (first plan)
8. Significant change in business objectives (client updates Mi Negocio)
9. New budget approved (Financial Agent confirms material change)

### 4.3 Campaign Design — "What play do we run?"

**Purpose:** Design a specific campaign with a pre-configured brief ready for client review.

**This is different from Planning.** Planning thinks in quarters and the full marketing mix. Campaign Design thinks in a specific campaign: "Mother's Day" with its objectives, versions, and Funnel Matrix distribution. Planning is analytical-strategic. Campaign Design is tactical-creative — the point where the Strategist works closest with the Creative Director.

**Frameworks:** M2 (campaign-level targeting), M3/M4 (channel selection per campaign), Funnel Matrix as distribution tool.

**Inputs:**
- Marketing Plan (from Planning skill) — the campaign's strategic context
- Specific opportunity (from Opportunity Agent) — if trigger is reactive
- Client request — if trigger is explicit
- Brand DNA — always
- Client Intelligence + Platform Intelligence — what works for this brand and in general

**Output:** **Pre-configured Campaign Brief** — see §5 for complete design.

**Triggers that load this skill:**
10. The plan says it's time (scheduled — campaign start date approaching)
11. Opportunity Brief with time window (reactive — from Opportunity Agent)
12. Client requests a campaign (explicit — via Copilot or portal)

### 4.4 Optimization — "Is it working?"

**Purpose:** Make strategic-level adjustments to active campaigns. Not operational optimization (that's the distribution agents) — strategic reallocation and pivots.

**Distinction from distribution agent optimization:**

| Level | Who | Example |
|-------|-----|---------|
| Operational | Paid Media Operator, Owned Channels Operator | Pause bad ad set, adjust bid, swap creative variant |
| Strategic | Strategist (Optimization skill) | Reallocate budget between campaigns, pivot campaign strategy, scale or kill a version, propose new creative direction |

**Frameworks:** M6 (ROI analysis, budget reallocation), M5 (customer engagement optimization).

**Inputs:**
- Analyst outputs: performance by campaign, version, channel, activation
- Financial Agent: budget status, burn rate, ROI tracking
- Brand Guardian: consistency flags
- Client Intelligence: historical patterns for this brand

**Output:** **Adjustment orders** — specific instructions for motors and agents. "Reallocate 30% of version B budget to version A on Meta." "Pause email activation — not converting." "Propose new version for TikTok — Listener detected a trend we can capitalize on."

**Autonomy thresholds (DEC-097):**

| Adjustment type | Autonomy | Requires approval from |
|-----------------|----------|----------------------|
| Reallocate <10% budget between versions, same channel | Autonomous | Nobody (reports to client) |
| Reallocate 10-20% between channels | Semi-autonomous | Financial Agent validates viability |
| Reallocate >20% or change strategy | Requires approval | Client (via Copilot or notification) |
| Pause an underperforming activation | Autonomous | Nobody (reports) |
| Pause an entire campaign | Requires approval | Client |
| Propose new creative version | Semi-autonomous | Creative Director designs, client approves |
| Scale budget of successful campaign | Requires approval | Financial Agent + Client |

In "AI decides" mode, autonomous actions execute directly. In "AI recommends" mode, everything generates a recommendation for client approval.

**Triggers that load this skill:**
13. Periodic campaign review (daily for performance/paid, weekly for content/organic, monthly for long campaigns)
14. Performance alert from Analyst (campaign crosses a threshold)
15. Financial Agent alert (budget deviation requiring strategic decision)

### 4.5 Campaign Learning — "What did we learn?"

**Purpose:** Extract transferable intelligence from completed campaigns. The skill that makes the Strategist smarter over time.

**Why this skill exists:** In real agencies, the post-campaign debrief is the most neglected step. There's always pressure to rush to the next campaign. The result: each campaign starts nearly from scratch. Campaign Learning systematizes what agencies skip.

**Inputs:**
- Analyst final campaign report (performance data, attribution, metrics)
- Original Campaign Brief (what was planned)
- Optimization history (what was adjusted and why)
- Brand DNA (to contextualize learnings)

**Two outputs (DEC-091):**

**Output 1 — Client Intelligence (private per client).** A living document that accumulates learnings per brand. "For this brand, we know that: (1) emotional > rational in awareness, (2) video > static on Meta but not LinkedIn, (3) Q2 is weak and requires more investment, (4) real audience is slightly different from declared audience in Brand DNA."

**Output 2 — Contribution to Platform Intelligence (aggregated, anonymized).** Anonymized data points that feed the platform's shared knowledge. "Campaigns with emotional messaging outperform rational 2.8:1 in awareness for audiences 25-35 in LATAM." No client is identifiable. Requires minimum N clients contributing for a pattern to be valid.

**Sharing principle (DEC-095, extends DEC-083):**

| Shareable (describes the environment) | NOT shareable (describes the brand) |
|---------------------------------------|-------------------------------------|
| Channel × format performance patterns | Which campaigns a client ran |
| Industry × timing patterns | A client's specific strategy or targeting |
| Audience segment × messaging patterns | A client's budget or ROI |
| CAC/ROAS benchmarks by industry | A client's competitive positioning |
| Format effectiveness by funnel stage | A client's audience learnings |

**Triggers that load this skill:**
16. Campaign closed (automatic — final gate of campaign pipeline completes)
17. Pre-planning (before a Planning cycle, to feed the next plan with learnings from the previous period)

---

## 5. Pre-Configured Campaigns (DEC-098)

### The problem

A client opens criteria.agency. They have Brand DNA. They want to do marketing but don't know where to start. Traditional agencies take weeks to produce a plan. Self-service tools show an empty canvas. criteria.agency should be different: **the Strategist already thought for you.**

### The principle

When the client opens the platform, they don't see a blank canvas. They see proposed campaigns with strategic logic behind them, ready to review and launch. The experience is not "build your campaign" — it's "this is what I recommend, want to change anything?"

It's the difference between a GPS showing a map and saying "navigate yourself" and one saying "the fastest route is this — shall we go?"

### Three origins of pre-configured campaigns

1. **From the Marketing Plan.** The Strategist designed a quarterly plan with N campaigns. Each becomes a pre-configured brief with suggested start date.

2. **From an opportunity.** The Opportunity Agent detected a cultural or competitive moment. The Strategist generated a rapid-response brief. "Trending topic relevant to your audience — proposal: reactive campaign on Instagram and TikTok, 48h window, reel format, suggested budget $Y."

3. **From the optimization cycle.** An active campaign is performing well in one channel but isn't being exploited in another. The Strategist proposes an extension: "The emotional version is performing excellently on Meta. Proposal: activate on TikTok with format adaptation, additional budget $Z."

### Anatomy of the pre-configured Campaign Brief

**Layer 1 — Quick view (what the client sees in the Campaign Grid):**

A card showing: proposed campaign name, concept in one sentence, primary audience, recommended channels (icons), estimated budget, timeline, and a confidence indicator ("based on your history" vs "based on industry benchmarks" vs "opportunity detected"). The client decides in 10 seconds whether to explore further.

**Layer 2 — Strategic detail (what they see when they open the card):**

| Element | Pre-configured by | Editable by client |
|---------|-------------------|-------------------|
| **Concept** | Strategist (from plan, opportunity, or extension) | Yes — can change the angle |
| **Objective** | Strategist (awareness, consideration, conversion, retention + metric target) | Yes — can change metric or target |
| **Audience** | Strategist (segments from Mi Negocio, prioritized) | Yes — can add, remove, reorder |
| **Channels** | Strategist + Channel Manager (recommended channels with justification) | Yes — can add or remove channels |
| **Funnel Matrix distribution** | Strategist (which cells activate and why) | Yes — can move activations |
| **Budget** | Financial Agent (suggested with ranges, grounded in product economics per DEC-101) | Yes — can raise or lower |
| **Calendar** | Strategist (start date, duration, milestones) | Yes — can move dates |
| **Expected KPIs** | Strategist + Analyst (based on Client Intelligence or Platform Intelligence) | Yes — can adjust targets |
| **Justification** | Strategist ("why this campaign, why now, why this way") | Not editable — it's the explanation |

**Layer 3 — Creative versions (post-strategic approval):**

After the client approves (or modifies) layer 2, the Creative Director proposes creative versions. This is not part of the pre-configured brief — it's the next step. But the brief includes **suggested creative direction** that the Creative Director uses as starting point: "For this Mother's Day campaign, we suggest 2-3 versions with different emotional angles. The audience responds well to nostalgic messaging (Client Intelligence)."

**Layer 4 — Activations and pieces (post-versions):**

Approved versions are distributed into activations (channel × funnel stage). Each activation generates orders to creation motors. Already documented in Client Portal Navigation spec (§6.2, steps 3 and 4).

### Complete flow

```
Strategist generates pre-configured brief
  └── Client sees card in Grid (Layer 1)
        └── Client opens and reviews (Layer 2)
              ├── Modifies whatever they want
              ├── [G6: Approves strategic direction]
              └── Creative Director proposes versions (Layer 3)
                    ├── Client co-creates versions
                    ├── [G5: Showrunner validates coherence]
                    └── Strategist distributes activations (Layer 4)
                          ├── Creation motors produce pieces
                          └── Distribution motors execute
```

### New client (special case)

A client who just completed onboarding has Brand DNA layer 0-1 with no history. The Strategist has little proprietary information. Here Platform Intelligence is crucial.

The Strategist proposes a first plan — not an ambitious quarterly roadmap, but 1-2 simple campaigns to generate data. First campaign: awareness. Objective: get the brand known. Most likely channel for the industry (Platform Intelligence). Minimum viable budget calculated from product economics (DEC-101).

"This campaign will generate the first real data about your audience. With this data, the next campaigns will be much more precise."

Honest — it doesn't pretend to know everything. It says "let's start with this to learn." With data from that first campaign, Campaign Learning feeds Client Intelligence and the next cycle is much more informed.

### What the client NEVER has to do

Choose a channel from scratch. Define an audience from scratch. Calculate a budget from scratch. Invent a concept from scratch. Everything comes pre-filled with strategic logic behind it.

**But they always have the option to create from scratch.** If they want a campaign the Strategist didn't propose, they can initiate it manually. The Strategist then accompanies reactively: helps fill the brief in conversation with the Copilot, suggests audiences, recommends channels.

---

## 6. Quality Gates

### Gate philosophy (DEC-096)

Gates in the Strategist are **viability checks**, not sufficiency thresholds. This is stricter than the Brand Builder. In the Brand Builder, the platform functions at any layer — it functions *better* at higher layers. In the Strategist, a badly designed plan wastes real budget. It's not "your brand is shallow but it works" — it's "your money will be spent wrong."

The exception to strictness: the Diagnostic skill has no formal gates (it's a reading skill, not a production skill), and Campaign Learning has no gates (it produces internal documents that don't require approval).

### Gates summary

| Gate | Where | Type | Evaluator | Blocks? |
|------|-------|------|-----------|---------|
| G1 | Planning: post-objectives | Viability check | Financial Agent | No hard block — can flag "aggressive but possible" and let client decide. Blocks if financially impossible. |
| G2 | Planning: post-value prop + media plan | Brand coherence | Brand Guardian | **Yes.** If the plan contradicts Brand DNA, it produces inconsistent outputs in cascade. Same logic as Brand Builder G2. |
| G3 | Planning: complete plan | Human approval | Client | **Yes, always.** The Strategist never executes a plan without client approval. |
| G4 | Campaign Design: brief complete | Self-evaluation | Strategist | No — internal quality check. Does this campaign advance the plan's objectives? |
| G5 | Campaign Design: post-Creative Director | Campaign coherence | Showrunner | Can block if versions are incoherent or distribution doesn't make sense. Returns to Strategist/Creative Director. |
| G6 | Campaign Design: pre-execution | Human approval | Client | **Yes, always.** Pre-configured campaign presented for review. Client approves, modifies, or rejects. |

### 3+3 rule

Applies at G1 and G2. If the Financial Agent or Brand Guardian blocks:
- 3 attempts: Strategist adjusts within current approach
- 3 more attempts: Strategist reframes the approach
- If still blocked: escalate to human expert

Does NOT apply at G3 and G6 (human approval gates) — the client decides on their own timeline.

---

## 7. Relationships with Other Agents

### The Strategist consumes from

| Source | What it provides | How |
|--------|-----------------|-----|
| **Analyst** | Brand Health Score, campaign metrics, anomalies with context, attribution, reports | Interface 2 (processed diagnostics). The Strategist never sees raw data. |
| **Listeners (×4)** | Market intelligence, competitive moves, cultural trends, brand sentiment | Via Event Bus. Independent to avoid circular bias. |
| **Opportunity Agent** | Opportunity Briefs (moment + relevance + action + time window) | Already crossed Listener data with client context |
| **Brand DNA** (via Brand Builder) | Audiences, positioning, verbal territory, visual identity | Foundation for all decisions. Quality depends on Brand DNA layer. |
| **Financial Agent** | Budget available, burn rate, forecasting, ROI targets, alert thresholds | Constraints for Planning and Optimization |
| **Channel Manager** | Channel specs, formats, costs, limitations, best practices | Consulted during media planning |
| **Media Scout** | Media opportunities, partnership options, unconventional channels | On-demand during Planning |
| **Platform Intelligence** | Cross-client patterns, industry benchmarks, channel performance data | Shared infrastructure (DEC-092) |
| **Client Intelligence** | This client's accumulated learnings from past campaigns | Private per client (DEC-091) |

### The Strategist produces for

| Consumer | What it receives | When |
|----------|-----------------|------|
| **Creative Director** | Strategic direction: objectives, audience, channels, suggested creative direction | Campaign Design skill. Bidirectional — Creative Director proposes versions back. |
| **Showrunner** | Complete campaign for coherence validation | Post-Campaign Design + post-Creative Director |
| **Creation motors** | Campaign Briefs specifying what to produce, for whom, in what channel, with what tone | After G6 (client approves campaign) |
| **Distribution motors** | Activation configurations: what to activate, where, with what targeting, budget, KPIs | After G6 |
| **Financial Agent** | Budget allocation proposals for validation | During Planning and Optimization |
| **Channel Manager** | Specific channel queries | During media plan design |
| **Media Scout** | Search requests for specific channel types | During Planning |
| **Client** | Recommendations in Funnel Matrix, pre-configured campaigns in Grid, score interpretation, strategic guidance via Copilot | Always |
| **Client Intelligence** | Learnings from completed campaigns | Via Campaign Learning skill |
| **Platform Intelligence** | Anonymized data points from completed campaigns | Via Campaign Learning skill |

### Conflict resolution (DEC-097)

**Strategist vs Creative Director.** The Strategist has authority over objectives and the Creative Director over creative execution. If the objective is awareness, the version must serve awareness — but how it does so creatively is the Creative Director's territory. If they don't converge, the Showrunner arbitrates.

**Strategist vs Financial Agent.** The Financial Agent has veto over financial viability. The Strategist can argue "this is an awareness investment not measured by direct ROI," but the Financial Agent can block if the investment puts the total budget at risk. If they don't converge, escalate to human.

**Strategist vs Brand Guardian.** The Brand Guardian has absolute veto on brand consistency — same as in every other motor. If Brand DNA says the brand is premium and the Strategist designs an aggressive discount campaign, the Brand Guardian blocks. The Strategist must change the approach or, if it genuinely believes the Brand DNA needs to evolve, trigger a review at the Brand Builder.

---

## 8. Token Cost Model (DEC-100)

### Principle

The original Brand Builder principle was "the brain is free, the hands cost tokens." The Strategist refines this into a more precise model:

| Type of work | Cost | Example |
|--------------|------|---------|
| **Base configuration** (Mi Negocio, Brand DNA layers) | Included in tier | Client builds their foundation |
| **Passive monitoring** (Listeners, Analyst dashboards, score) | Included in tier | The platform always watches and shows data |
| **Strategic intelligence** (diagnoses, plans, briefs, optimizations) | Tokens | All Strategist outputs |
| **Asset production** (video, design, copy, web) | Tokens | All creation motor outputs |

**Observing and showing is free.** The client can always see what's happening (dashboards, score, alerts) at no additional cost. **Thinking and deciding costs tokens.** Having the platform tell you what to do and prepare the campaign costs tokens. **Producing costs tokens.** Creating the assets costs tokens.

This aligns incentives: the platform gives visibility for free (keeps clients engaged) but charges for the intelligence and production that generate real value.

---

## 9. Triggers (Complete Reference)

### Three categories

- **Scheduled:** Predictable, calendarized. The Strategist's rhythm base.
- **Reactive:** Responding to signals from other agents or the client.
- **Consequence:** Resulting from the Strategist's own prior work.

### By skill

| # | Trigger | Category | Loads skill |
|---|---------|----------|-------------|
| 1 | Material change in Brand Health Score (>X points on any axis) | Reactive | Diagnostic |
| 2 | Start of planning cycle (quarterly default) | Scheduled | Diagnostic |
| 3 | Post-Brand Builder layer 2 (strategic depth now available) | Reactive | Diagnostic |
| 4 | Significant anomaly from Analyst (structural pattern) | Reactive | Diagnostic |
| 5 | Relevant competitive move (via Competitive Listener) | Reactive | Diagnostic |
| 6 | Diagnosis completed that requires new plan | Consequence | Planning |
| 7 | New client post-onboarding (first plan) | Reactive | Planning |
| 8 | Significant change in business objectives | Reactive | Planning |
| 9 | New budget approved (material change) | Reactive | Planning |
| 10 | Plan says it's time (campaign start date approaching) | Scheduled | Campaign Design |
| 11 | Opportunity Brief with time window | Reactive | Campaign Design |
| 12 | Client requests a campaign | Reactive | Campaign Design |
| 13 | Periodic campaign review (daily/weekly/monthly by type) | Scheduled | Optimization |
| 14 | Performance alert from Analyst (threshold crossed) | Reactive | Optimization |
| 15 | Financial Agent alert (budget deviation) | Reactive | Optimization |
| 16 | Campaign closed (final gate completes) | Consequence | Campaign Learning |
| 17 | Pre-planning review (before next Planning cycle) | Scheduled | Campaign Learning |

### The perpetual cycle

The triggers form a natural chain:

```
Diagnostic → Planning → Campaign Design → [motors execute] → Optimization → Campaign Learning → Diagnostic (next cycle)
       ↑                                                                                               │
       └───────────────────────────────────────────────────────────────────────────────────────────────┘
```

This is the "evaluate → design → adjust" cycle from the original documentation, now with explicit skills at each phase. The cycle is not rigid — reactive triggers can interrupt at any point, and multiple campaigns at different stages coexist.

---

## 10. Platform Intelligence (Reference — Separate Spec)

### Concept

Platform Intelligence is a shared knowledge layer that accumulates patterns across all criteria.agency clients. It is **not** a Strategist feature — it is platform infrastructure that any agent can query (DEC-092). Its complete design is a separate spec (DEC-094).

### What this spec defines about Platform Intelligence

**Contribution:** The Campaign Learning skill (§4.5) is the primary contributor. After every completed campaign, anonymized data points are added.

**Consumption:** The Strategist consults Platform Intelligence when loading any skill, especially for new clients without Client Intelligence. Other agents (Creative Director, Channel Manager, Paid Media Operator) also consume it for their own decisions.

**Sharing principle (DEC-095):** Same as DEC-083 from Brand Builder. What describes the environment (channel performance, industry timing, audience behavior patterns) is shareable. What describes the brand (specific strategies, budgets, competitive positions) is never shared.

### Categories of aggregated intelligence

| Category | Example insight | Granularity |
|----------|----------------|-------------|
| Channel × format | "15s reels convert 40% better than 30s in awareness for 25-35 audiences in LATAM" | By channel, format, funnel stage |
| Industry × timing | "Restaurants peak in Q4; campaigns starting 6 weeks before peak outperform 3-week starts" | By industry, seasonality |
| Audience × messaging | "Audiences 25-35 respond 2.8x better to emotional vs rational messaging" | By demographic segment, message type |
| Channel × industry | "B2B converts better on LinkedIn than Meta, but awareness is cheaper on Meta" | By industry, channel, objective |
| Budget × result | "For awareness in LATAM, average CPM is $X with floor $Y" | By region, objective, channel |

Each insight is a statistical pattern, not a single client's data. Requires minimum N clients contributing to be valid.

### External exposure (DEC-093)

Platform Intelligence also surfaces as public KPIs proving criteria.agency's efficacy:

- Landing page: "Average ROAS of 4.2x across our clients"
- Onboarding: "Brands like yours achieve X in their first 90 days"
- Upsell: "Clients who activate Listeners improve performance by 35%"
- Sales: "Your industry benchmark vs your current performance"

This generates a **data moat**: a competitor can copy the UI, the agents, the pipeline. They cannot copy 18 months of cross-client learning from 500 brands.

---

## 11. Integration with Other Systems

### Brand Health Score

The Brand Health Score has three axes. The Strategist and Analyst divide the work:

| Axis | Question | Analyst's role | Strategist's role |
|------|----------|---------------|-------------------|
| **Fundamentos** | Am I ready? | Calculates completeness of Brand DNA, Mi Negocio | Interprets gaps and recommends actions |
| **Ejecucion** | Am I doing it well? | Calculates campaign performance, Brand Guardian consistency rate, gate approval rate | Interprets why performance is good/bad and what to change |
| **Oportunidad** | Am I doing enough? | Calculates investment vs available market, activity vs competition, channel coverage | Interprets what's missing and proposes campaigns to fill gaps |

The number is Analyst output. The meaning is Strategist output.

### Three configuration paths

| Path | Strategist experience | Natural tier |
|------|----------------------|-------------|
| **Manual** | Pre-configured campaigns with justification. Client reviews and launches. Strategist operates in the background. | Starter |
| **Copilot** | Strategist guides conversationally. Client discusses strategy, co-creates campaigns, asks "why this channel?" and gets strategic answers. | Pro |
| **Workshop with experts** | Human strategist and Strategist agent work in parallel. Human brings market intuition and provocative questions. Agent brings data, frameworks, and real-time documentation. | Agency / upsell for any tier |

### Revenue expansion engine

The Strategist is criteria.agency's primary upsell driver — not through sales pitches, but through honest strategic recommendations:

- "You're only activating 3 of 12 relevant channels. Brands like yours that activate 6+ channels see 40% better reach." → Activates more motors
- "Your Brand DNA is at layer 1. Campaign targeting would improve significantly with segmented audiences (layer 2)." → Brand Builder deepening
- "Your campaigns are well-designed but your budget is 60% below industry average for your market size. Consider increasing investment." → Budget increase
- "A human expert workshop could accelerate your brand from layer 1 to layer 3 in one session." → Workshop upsell

Every recommendation is grounded in data (Platform Intelligence, Client Intelligence, Brand Health Score). It feels like help, not sales.

---

## 12. Relationship with CriteriaFilms

For CriteriaFilms (criteria.agency's first client), the Strategist operates with a significant advantage: Juan Pablo's 20+ years of brand knowledge means the Brand DNA will reach layer 3 quickly, providing the Strategist with maximum strategic depth from the start.

The Strategist's initial focus for CriteriaFilms will be establishing the first marketing plan and generating data through early campaigns to build Client Intelligence. This data, combined with Platform Intelligence from other early clients, creates the foundation for increasingly precise recommendations.

---

## 13. Implementation Notes

### Priority

The Strategist is Phase 2 priority alongside the Brand Builder. The Brand Builder produces the Brand DNA; the Strategist consumes it to produce everything else. Building the Strategist without Brand DNA means operating generically. Building the Brand Builder without the Strategist means a beautiful brand document that nobody uses strategically.

### Recommended build order

1. Analyst interface 2 (processed diagnostics toward Strategist)
2. Brand Health Score calculation (Analyst)
3. Strategist agent with Diagnostic skill
4. Strategist with Planning skill + Financial Agent integration
5. Pre-configured Campaign Brief structure
6. Strategist with Campaign Design skill
7. Gates G1-G6
8. Strategist with Optimization skill + autonomy thresholds
9. Campaign Learning skill + Client Intelligence storage
10. Platform Intelligence contribution pipeline (anonymization, aggregation)
11. Platform Intelligence consumption API (for all agents)

### Model considerations

- Diagnostic: Claude or equivalent reasoning model. Synthesis across multiple data sources requires genuine reasoning.
- Planning: Claude. Strategic framework application (M1-M6) requires deep reasoning.
- Campaign Design: Claude. Tactical creativity requires both analytical and creative reasoning.
- Optimization: Could start with a lighter model for routine reviews, escalate to Claude for strategic pivots.
- Campaign Learning: Claude. Retrospective synthesis requires distinguishing transferable patterns from situational noise.

### Dependencies

- **Brand Builder** must produce Brand DNA (at least layer 1) for the Strategist to operate with quality.
- **Analyst** must have interface 2 operational for the Strategist to receive processed diagnostics.
- **Financial Agent** must be operational for Planning gates (G1) and Optimization thresholds.
- **Brand Guardian** must be operational for Planning gate (G2).
- **Listeners** should be operational for Diagnostic quality, but the Strategist can operate without them (using only Analyst data and Brand DNA) for early implementations.

---

## 14. Open Questions

### 14.1 Copilot ↔ Strategist interaction

The Copilot is the client's conversational interface. When the client tells the Copilot "I want a Christmas campaign," how does that flow to the Strategist? Does the Copilot route the request to the Strategist which generates a pre-configured brief? Does the Strategist conduct the conversation through the Copilot? This needs its own design.

### 14.2 Platform Intelligence complete design

What exactly is aggregated, how is it anonymized, what minimum N is required for a pattern to be valid, what the internal API looks like for agents, and how public KPIs are formatted and surfaced. Deferred to separate spec (DEC-094).
