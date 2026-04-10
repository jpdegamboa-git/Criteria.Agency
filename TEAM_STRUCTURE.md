# criteria.agency — Agent Architecture

> Last updated: April 9, 2026
> Total agents: ~29 | Transversal: 7 | Creation: 12 | Strategy: 2 | Intelligence: 2 | Distribution: 2 | Operation: 3 | Security: 1 | Interface: 1 (MARA)
> Note: Strategist counted once (transversal + strategy). Analyst redefined with 3 interfaces (DEC-088/089). Platform Intelligence added as shared infrastructure (DEC-092). MARA added as agent #29 — conversational interface (DEC-127).
> Supersedes: Previous 47-agent Video Production team structure (preserved in git history)

---

## Design Principles

### Agent vs Skill vs System Function (DEC-064)

| Level | Definition | Example |
|-------|-----------|---------|
| **Agent** | Takes autonomous decisions, maintains context, iterates on its own work. Has judgment. | Editor decides cutting rhythm |
| **Skill** | Instructions/expertise an agent loads for a specific task type. Same agent, different skill. | Writer loads "documentary" or "explainer" skill |
| **System function** | Automated process that doesn't require judgment. Rules, conversions, integrations, monitoring. | RGB→CMYK conversion, model routing, API integrations |

### Why ~28 and not ~125

The original architecture (Session 1-2) designed Video Production as a full cinematic production house: 9 teams, 47 agents, specialized roles like Script Doctor, Foley Artist, Pre-production Colorist. This made sense for CriteriaFilms producing short films.

For criteria.agency producing marketing pieces (reels, carousels, emails, landing pages), that granularity is unnecessary. A "Fiction Writer" and a "Documentary Writer" are the same LLM with different prompts — that's a skill, not an agent. Model selection routing is infrastructure, not a "team of 6 AI Model Intelligence agents."

The reduction: ~125 → ~28 agents. The "missing" ~97 are now skills (loaded by agents as needed) and system functions (automated by the framework).

---

## Chain of Command

```
Human expert (final escalation)
  └── Framework orchestrator (pipelines, gates, routing — system function)
        ├── Transversal agents (operate across all motors)
        │     ├── Creative Director — creative versions at campaign level
        │     ├── Showrunner — campaign coherence validation
        │     ├── Strategist — continuous: evaluate → design → adjust
        │     ├── Brand Guardian — brand consistency across all outputs
        │     ├── Financial Agent — budget, allocation, ROI
        │     ├── Channel Manager — channel expertise (skill registry)
        │     └── Media Scout — media opportunities, partnerships
        │
        ├── Motor agents (operate within their motor's pipeline)
        │     ├── Creation motors: 12 agents (see below)
        │     ├── Strategy motors: 1 agent
        │     ├── Intelligence motors: 2 agents
        │     ├── Distribution motors: 2 agents
        │     └── Operation motors: 3 agents
        │
        ├── Security Analyst (1 agent + system functions)
        │
        └── MARA (1 agent — conversational interface to client)
```

---

## Transversal Agents (7)

| Agent | Role | Scope | Mode |
|-------|------|-------|------|
| **Creative Director** | Proposes creative versions at campaign level. Defines visual and narrative direction per version. Iterates with client. | Campaign level — direction flows down to all motors producing pieces for that version | Project (per campaign) |
| **Showrunner** | Validates campaign-level coherence and quality. Are the versions consistent with the brand? Does the distribution make sense? Feeds Campaign Score. | Campaign level — does NOT validate individual pieces (that's each motor's quality gates) | Project (per campaign) |
| **Strategist** | Strategic brain of the platform. 5 skills: Diagnostic (interpret reality), Planning (design marketing plans), Campaign Design (create pre-configured campaigns), Optimization (strategic adjustments to active campaigns), Campaign Learning (extract intelligence from completed campaigns). Consumes processed diagnostics from Analyst. Produces Marketing Plans, Campaign Briefs, and strategic adjustments. All outputs cost tokens (DEC-100). See full spec: `docs/superpowers/specs/2026-04-08-strategist-motor-design.md` | Entire platform — the strategic brain. Dual nature: Strategy motor + Transversal agent | Hybrid (skill-based activation by 17 triggers: scheduled, reactive, consequence) |
| **Brand Guardian** | Validates that every output from every motor is consistent with Brand DNA. Pass/fail + specific feedback. | All motors — invoked at quality gates | Continuous |
| **Financial Agent** | Budget control, allocation by motor/campaign/channel, spend tracking, ROI validation, forecasting, alert thresholds. | All motors — invoked for budget decisions | Continuous |
| **Channel Manager** | Expert knowledge of every communication channel. One agent that loads channel-specific skills on demand. Adding a channel = adding a skill file. | All distribution — provides specs to Paid Media and Owned Channels operators | Continuous |
| **Media Scout** | Discovers WHERE to communicate. Scans media ecosystem for opportunities: podcasts, newsletters, influencers, partnerships, unconventional spaces. Maintains live Media Registry. | Discovery — feeds Strategist and Channel Manager | Continuous |

**Note:** Creative Director and Showrunner were originally part of the Video motor team but are now transversal because campaigns span multiple motors (DEC-061, DEC-062).

---

## Creation Motors (12 agents)

### Video Production — 6 agents

| Agent | What it decides (judgment) | Skills it loads | What is NOT an agent (system function) |
|-------|---------------------------|-----------------|---------------------------------------|
| **Writer** | Narrative structure, tone, story arc, dialogue, script format selection | Fiction, documentary, explainer, AV copy, commercial, social short-form. Script revision is an iteration cycle, not a separate agent. | — |
| **Director of Photography (DP)** | Framing, lighting, movement, visual mood, model selection for generation | Color palettes, camera movement styles, cinematic prompting, storyboard generation | — |
| **Visual Designer** | Composition, typography, motion graphics, VFX decisions, art direction execution | Motion graphics, compositing/VFX, title design, lower thirds, visual effects | Continuity checking (rule-based validation) |
| **Audio** | Sonic palette, music selection/generation, VO direction, mix balance | Sound design (atmospheres), foley/SFX, music scoring, voiceover direction, podcast mixing | — |
| **Editor** | Cutting rhythm, transitions, pacing, structure, narrative flow through editing | Long-form editing, short-form/reels, trailer/teaser, documentary, montage | Format export, subtitle timing (system functions) |
| **Quality Reviewer** | Aesthetic judgment on final output, critical evaluation, standards enforcement | Cinematographic critique, content compliance, accessibility review | Technical validation (resolution, codec, aspect ratio — system function) |

**Pipeline:** Brief → Writer (script) → DP (visual plan) → [generation] → Visual Designer (graphics/VFX) → Audio (sound) → Editor (assembly) → Quality Reviewer → Output

**Gates:** Same 5-gate structure as before (G1: vision, G2: script, G3: visual, G4: rough cut, G5: final). Gates are checkpoints where Brand Guardian and Showrunner (transversal) can intervene.

**3+3 rule still applies:** 3 attempts → agent adjusts approach → 3 more → human escalation.

### Graphic Design — 1 agent

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **Designer** | Social media graphics, brand identity, print design, presentations, infographics, packaging, web banners | Template application, format export, color space conversion |

### Web — 1 agent

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **Web Developer** | Landing pages, microsites, UI design, responsive layout, CMS integration | Page speed optimization, SSL setup, deployment |

### Audio — 1 agent

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **Audio Producer** | Podcasts, jingles, radio spots, voiceover production, audio ads | Format conversion, loudness normalization, distribution to platforms |

### Events — 2 agents

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **Event Planner** | Concept development, venue search, rundown design, guest management, budget planning | Calendar scheduling, RSVP tracking |
| **Event Coordinator** | Supplier coordination (via Marketplace), production logistics, live execution, post-event reporting | Automated reminders, attendance tracking |

### Print Production — 1 agent

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **Production Manager** | Prepress decisions, supplier selection and negotiation, quality control, proof approval | RGB→CMYK conversion, bleed/margin validation, PDF/X generation |

---

## Strategy Motors (2 agents)

| Agent | Motor | Skills | System functions |
|-------|-------|--------|-----------------|
| **Brand Strategist** | Brand Builder | Discovery, Positioning (M1-M6 + Godin), Archetype & Voice, Identity Systems, Brand Audit | — |
| **Strategist** | Strategist (also transversal) | Diagnostic, Planning, Campaign Design, Optimization, Campaign Learning | — |

> The Strategist is unique: simultaneously a Strategy motor (with its own pipeline and outputs) and a Transversal agent (operating across all motors). See full specs: `2026-04-08-brand-builder-motor-design.md` and `2026-04-08-strategist-motor-design.md`.

### Platform Intelligence (infrastructure — not an agent)

Cross-client accumulated knowledge, anonymized and aggregated (DEC-092). Serves all agents as a shared knowledge layer. Also exposed as public KPIs proving criteria.agency efficacy (DEC-093). Separate spec pending (DEC-094). Sharing principle: environment is shareable, identity is not (DEC-095).

---

## Intelligence Motors (2 agents)

| Agent | Skills / Instances | System functions |
|-------|-------------------|-----------------|
| **Listener** | 1 agent design, 4 instances: Brand (sentiment, mentions, crisis), Culture (trends, moments), Industry (innovation, shifts), Competitive (moves, benchmarks). Each instance runs continuously on its source set. | Data ingestion, source crawling, deduplication |
| **Opportunity Agent** | Cross-referencing all Listener outputs with client audiences and Brand DNA to generate Opportunity Briefs (moment + relevance + action + time window) | Alert delivery |

---

## Distribution Motors (2 agents)

| Agent | Covers (formerly separate motors) | Skills | System functions |
|-------|-----------------------------------|--------|-----------------|
| **Paid Media Operator** | Ads/Pauta | Platform setup (Meta, Google, TikTok, LinkedIn, programmatic), audience segmentation, bidding strategy, A/B creative testing, real-time budget optimization, traditional media buying (TV, radio, outdoor — manual-assisted) | Pixel/tracking setup, UTM generation, API publishing |
| **Owned Channels Operator** | Community Management + Email Marketing + SEO/Content | Social publishing and scheduling, community listening and response, email campaign and flow creation, A/B subject testing, content calendar, SEO keyword optimization, content refresh | Spam score checking, rendering tests, hashtag lookup, rank monitoring |

> **Grouping logic (DEC-065):** Paid media operates on real-time bidding, budget allocation, and platform APIs — a "trader" rhythm. Owned channels operate on content planning, audience engagement, and organic optimization — a "publisher" rhythm. Different decision patterns justify different agents. Channel Manager (transversal) provides platform-specific specs to both.

---

## Operation Motors (3 agents)

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **Prospector** (Sales) | Lead enrichment, scoring (fit + intent + budget), qualification (BANT), outreach personalization, nurture sequence design | Lead capture from forms/events/social, CRM data sync |
| **Closer** (Sales) | Proposal generation, objection handling, negotiation, follow-up cadence, deal closing | Signature tracking, contract generation |
| **Analyst** (Analytics) | Dashboard design, attribution modeling, anomaly detection, report generation (daily/weekly/monthly/on-demand), KPI interpretation, variance analysis. **Redefined role (DEC-088, DEC-089):** The Analyst is the nervous system of the platform — stays in Operation but serves entire platform via 3 interfaces: (1) Client: dashboards, reports, metrics in Funnel Matrix; (2) Strategist: processed diagnostics, contextualized anomalies, patterns with analytical interpretation; (3) Brand Health Score: mechanical calculation of the score from all data sources. The Analyst says "what happened" and "what pattern I see." The Strategist decides "what to do." | Data pipeline ingestion from all channel APIs, metric calculation, Brand Health Score calculation |

---

## Security (1 agent)

| Agent | Skills | System functions (automated) |
|-------|--------|------------------------------|
| **Security Analyst** | Risk assessment, vulnerability prioritization, compliance interpretation, incident response decisions, threat hunting strategy | Vulnerability scanning (SAST/DAST), SSL monitoring, backup verification, dependency auditing, secrets detection, access log analysis, DDoS detection, PII detection, agent permission enforcement, cross-tenant isolation |

> The original 6-agent Security Team is now 1 agent + system functions. Scanning, monitoring, and rule enforcement don't need judgment — they need automation. The Security Analyst interprets signals and makes strategic security decisions.

---

## Interface (1 agent)

| Agent | Skills | System functions |
|-------|--------|-----------------|
| **MARA** (Marketing Agent for Routing & Assistance) | Intent Classification (route client intent to correct backend agent/system), Conversation Management (session context, cross-session memory via summaries), Response Composition (translate technical agent outputs to client-appropriate language) | Output Registry queries, UI context ingestion, session summary generation, proactivity scanning |

> MARA is agent #29 — the conversational interface to the entire platform. Unlike every other agent, MARA produces no work product of its own. Its value is translation: from client language to the system, and from the system to client language. The client always talks to MARA, never directly to backend agents (single face principle, DEC-138). MARA searches existing outputs (via Output Registry) before invoking agents, making most interactions instant and free. Play/pause toggle controls whether MARA can invoke token-consuming agents. See full spec: `docs/superpowers/specs/2026-04-09-mara-copilot-design.md`

---

## Communication Protocols

Same as before — the protocols don't change with fewer agents:

### 1. Handoff (H) — Formal delivery between pipeline steps
Agent completes its phase → generates standardized delivery package → next agent reviews and accepts.

### 2. Request (R) — Out-of-sequence ask
When an agent needs something outside normal pipeline flow. Agent-to-agent. Framework sees all requests.

### 3. Veto (V) — Quality block
Transversal agents (Brand Guardian, Showrunner, Quality Reviewer) can block pipeline. Pauses until resolved.

### 4. Sync (S) — Periodic alignment
At quality gates: relevant agents + transversals align on status, risks, dependencies.

### 5. Escalation (E) — To human
3+3 rule exhausted → human expert. Agent provides complete context + previous attempts + recommendations.

---

## The 3+3 Rule (unchanged)

```
Attempts 1-3: Agent tries with original parameters
    ↓ (if all 3 fail quality threshold)
Agent adjusts own approach (different skill, model, parameters)
    ↓
Attempts 4-6: Agent tries with adjusted parameters
    ↓ (if all 3 fail again)
Escalation → human expert
```

> Previously, attempts 4-6 were adjusted by a "team leader" (a separate agent). Now the agent adjusts its own approach — it loads a different skill, changes the model, or reframes the problem. If it can't solve it in 6 tries, it's a human problem.

---

## Autonomy Levels

| Level | Behavior | Applies to |
|-------|----------|------------|
| **Full autonomy (90-100%)** | Executes and reports. No prior approval. | System functions, Financial Agent (routine tracking), Listeners |
| **High autonomy (75-89%)** | Executes most tasks. Consults for decisions affecting other agents or budget. | Most motor agents, Security Analyst |
| **Guided autonomy (60-74%)** | Full technical autonomy. Creative/aesthetic decisions require transversal validation. | Visual Designer, Audio (consult Creative Director) |
| **Configurable by client** | Client chooses "AI decides + supervises" OR "AI recommends + approves" per motor | All agents in client-facing motors |

---

## Human-AI Substitution (unchanged principle)

Any agent can be replaced by a human without changing the structure. The human occupies the same position, uses the same handoff format, follows the same pipeline. With 28 agents instead of 125, human substitution becomes even more practical — each human replacement covers a meaningful scope.

**Highest priority for human substitution:** Strategist (transversal), Creative Director (transversal), Writer (Video), Editor (Video), Brand Strategist — the roles where human judgment has the most impact on quality.

---

## Relationship to CriteriaFilms

The original 47-agent, 9-team Video Production structure remains valid for CriteriaFilms' cinematic productions (short films, documentaries, branded entertainment). When criteria.agency produces a cinematic piece (not a marketing piece), the Video motor can activate additional skills and request human specialists via Marketplace for roles that marketing pieces don't need (dedicated colorist, foley specialist, script doctor review).

The difference is not in the architecture — it's in which skills are loaded and how many quality gates are enforced. A 30-second Instagram reel goes through a lighter pipeline than a 15-minute branded documentary.
