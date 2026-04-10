# criteria.agency — Transversal Agents Design (MVP)

> Date: April 9, 2026
> Status: Approved design
> Scope: Brand Guardian, Creative Director, Showrunner — transversal components for MVP
> Also covers: Financial Agent and Channel Manager MVP simplifications
> Decisions: DEC-174 through DEC-179
> Supersedes: `2026-04-07-brand-guardian-engine-design.md` (which was already superseded by DEC-173; this spec further evolves the design)

---

## 1. Context

The marketing engine design (`2026-04-06-marketing-engine-design.md` §5) defines 8 transversal components. Only high-level descriptions existed — mission statements and responsibilities. This spec provides the detailed design needed for MVP implementation.

**MVP transversal status:**

| Transversal | MVP Status | Why |
|---|---|---|
| Brand Guardian | Active — LLM function with 4 skills | Brand Builder and Video motor invoke it at gates |
| Creative Director | Active — Agent with tools, 3 skills | Video motor needs creative direction; highest value creator |
| Showrunner | Active — Agent with tools, 5 skills | Video motor gates need quality evaluation |
| Financial Agent | Simplified — system function + Strategist skill | No real spend to track in MVP (DEC-178) |
| Channel Manager | Simplified — lookup table + Strategist tool | No distribution motors in MVP (DEC-179) |
| Media Scout | Deferred | No distribution motors or Listeners |
| Security Analyst | Deferred | System functions cover security in Fase 7 |
| Marketplace | Deferred | Post-MVP infrastructure |

---

## 2. Model Selection by Creative Leverage (DEC-174)

DEC-149 governs model selection by **data sensitivity** (Tier A/B/C). DEC-174 adds a second axis: **creative leverage** — within a tier, the specific model is selected by the role's impact on output quality.

| Model | When to use | Roles |
|---|---|---|
| **Opus** | Highest-leverage creative and evaluative decisions | Creative Director, Showrunner, Brand Strategist (Layer 2-3) |
| **Sonnet** | Execution agents, validation, composition | Writer, DP, Editor, Audio, Visual Designer, Brand Guardian, MARA Response Composition |
| **Haiku** | Lightweight classification, simple validation | MARA Intent Classification, simple system function LLM calls |

**Principle:** Spend more where judgment has the most impact. Spend less where execution is more mechanical.

Model assignment is configured per agent × skill in `prompt_registry` — no code changes needed to adjust.

---

## 3. Brand Guardian

### 3.1 Identity

- **Type:** LLM function with skills. Uses `generateText()` (DEC-141 simple pattern). Not an agent — no tools, no autonomous iteration. The invoking motor handles iteration via the 3+3 rule.
- **Model:** Sonnet, Tier A (DEC-149). Always consumes Brand DNA (confidential data).
- **Prompt:** Loaded from `prompt_registry`. Entry: `agent: brand-guardian`, `skill: [variable]`.

### 3.2 Skills

**Skill 1 — Textual Voice Review**
- **Evaluates:** Scripts, copy, email content, social posts — any text produced by a creation motor.
- **Dimensions:** Voice and tone, vocabulary, formality level, brand personality, verbal do's and don'ts.
- **Brand DNA context loaded:** Verbal identity, tone of voice guide, do's and don'ts, archetype.
- **Invoked by:** Video motor (scripts at G2), Community Management, Email Marketing, SEO/Content.

**Skill 2 — Visual Identity Review**
- **Evaluates:** Storyboards, visual look proposals, graphic designs, art direction.
- **Dimensions:** Color palette, typography, imagery style, consistency with visual personality.
- **Brand DNA context loaded:** Visual system, color palette, typography, imagery style, brand personality.
- **Invoked by:** Video motor (visual look at G3), Graphic Design, Web.

**Skill 3 — Strategic Alignment Review**
- **Evaluates:** Marketing plans, campaign briefs, positioning proposals.
- **Dimensions:** Consistency with value proposition, correct target audience, positioning reinforced (not contradicted), messaging on-brand.
- **Brand DNA context loaded:** Positioning statement, target audiences, value proposition, competitive set, do's and don'ts.
- **Invoked by:** Strategist (G2), Brand Builder (coherence gate Layer 2).

**Skill 4 — Holistic Review (Brand Builder only)**
- **Evaluates:** Complete Brand DNA at Layer 3 closure.
- **Dimensions:** Sufficient specificity for other skills to function. Does the tone guide have concrete per-channel examples? Does the visual system cover required formats? Are do's and don'ts actionable?
- **Brand DNA context loaded:** All — this is the only skill that loads the complete Brand DNA.
- **Invoked by:** Brand Builder Step 1.9 exclusively.

### 3.3 Context Selector

The Brand Guardian does NOT load the entire Brand DNA for every invocation. Each skill defines which Brand DNA sections are relevant, keeping token consumption predictable:

| Skill | Brand DNA sections loaded | Estimated tokens |
|---|---|---|
| Textual Voice Review | Verbal identity, tone guide, do's/don'ts, archetype | ~1K-2K |
| Visual Identity Review | Visual system, palette, typography, imagery, personality | ~1K-2K |
| Strategic Alignment Review | Positioning, audiences, value prop, competitive set, do's/don'ts | ~1K-3K |
| Holistic Review | Complete Brand DNA | ~3K-6K |

### 3.4 Evaluation Protocol

**Input:**
- Artifact to evaluate (content produced by an agent)
- Brand DNA context (subset selected by skill)
- Evaluation context: invoking motor, gate, pipeline step

**Output (always structured JSON):**

```json
{
  "verdict": "pass | warning | fail",
  "dimensions": [
    { "name": "voice_and_tone", "result": "pass|warning|fail", "detail": "..." },
    { "name": "positioning", "result": "pass|warning|fail", "detail": "..." }
  ],
  "summary": "One sentence explaining the verdict",
  "fix_guidance": "If fail or warning, what specifically must change"
}
```

**Verdict rules:**
- One `fail` in any dimension → global verdict `fail`
- Only `warnings` and `pass` → global verdict `warning` (does not block, but is reported)
- All `pass` → global verdict `pass`

**What constitutes each level:**
- **Fail:** Direct contradiction with Brand DNA. The artifact says or shows something opposite to what the brand is.
- **Warning:** Does not contradict but is generic. Could belong to any brand. Does not leverage differentiation.
- **Pass:** Consistent AND distinctive. Feels like this specific brand.

The Brand Guardian checks for genericity, not just errors. An output that doesn't contradict but doesn't reflect the brand is a warning, not a pass. This pushes quality upward.

### 3.5 Invocation Pattern

Always invoked by the motor that needs validation, as a step within an Inngest function:

```
Motor produces artifact → Motor invokes Brand Guardian →
  If pass: advance
  If warning: advance but register warning in output metadata
  If fail: motor's 3+3 rule activates, Brand Guardian's fix_guidance
           injected as upstream_feedback to the agent that produced the artifact
```

The Brand Guardian **never decides what to do with a fail.** It only reports. The motor decides (via its gate logic and 3+3 rule).

### 3.6 Cost Estimate

Per invocation: ~3.5K-7.5K input tokens + ~200-400 output tokens (Sonnet).
A complete video passes Brand Guardian ~3 times (G1, G3, G5). Worst case with 3+3: up to 18 invocations. Normal case (1-2 iterations): ~4-6 invocations.

### 3.7 Boundaries

- Not Creative Director — does not propose alternatives. Only says "this doesn't work" and why.
- Not Showrunner — does not evaluate coherence between multiple campaign pieces. Evaluates one piece against Brand DNA.
- Not an editor — does not rewrite. Its `fix_guidance` says what to change, not how.
- Does not evaluate technical quality — if a script is boring but on-brand, it passes.

### 3.8 Post-MVP Evolution

- **Skill 5 — Pattern Analysis:** Analyzes trends in fails/warnings to detect systemic issues ("Writer consistently uses overly formal tone in social scripts"). Requires evaluation history.
- **Skill per new motor:** When Graphic Design, Web, Audio, etc. are added, the same Brand Guardian serves them. No architectural changes — only the motor needs to invoke it.

---

## 4. Creative Director

### 4.1 Identity

- **Type:** Agent with tools (DEC-141 complex pattern). Takes autonomous creative decisions — interprets brief, consults Brand DNA, produces creative direction requiring real creative judgment.
- **Model:** Opus, Tier A (DEC-174). Highest-leverage creative decision point in the pipeline. The quality delta between Opus and Sonnet on creative judgment tasks is significant, and the CD is invoked infrequently (1-2 times per piece).
- **Prompt:** `prompt_registry`, entry: `agent: creative-director`, `skill: [variable]`.

### 4.2 The Problem It Solves

Without a Creative Director, each agent in the Video motor interprets the brief independently. The Writer writes according to their reading, the DP proposes visuals according to theirs. They may all be on-brand (Brand Guardian passes) but **telling different stories.** The result is technically correct but lacks creative unity.

The Creative Director translates Brief + Brand DNA into a **Creative Direction** that all downstream agents follow. It is the second context document (after Brand DNA): Brand DNA says "who the brand is," Creative Direction says "what we're doing with the brand in this piece."

### 4.3 Creative Philosophy (DEC-175: CD as Clonable Asset)

Each Creative Director has a **Creative Philosophy** — a configurable component within its `prompt_registry` entry that defines its creative lens. Not a "character" — a real working philosophy.

Pre-built philosophies for MVP:

| Philosophy | Approach | Preferred ideas |
|---|---|---|
| **Provocateur** | Disruption, surprise, break expectations. Calculated risk over safety. | "If it doesn't make you slightly uncomfortable, it's not working." |
| **Storyteller** | Emotional narrative, dramatic arc, human connection. Every piece has a character with a conflict. | "If you don't feel something, it's not worth it." |
| **Minimalist** | Clarity, elegance, less is more. Every element must earn its place. | "If you can remove it without losing anything, remove it." |

The philosophy interacts with Brand DNA: a "Rebel" archetype brand + Provocateur CD produces very different work than the same brand + Storyteller CD.

### 4.4 Creative Director Training (DEC-176)

CDs can be trained with links to portfolios and reels. The training pipeline extracts **Creative Style DNA**:

**Input:** Links to portfolios (Behance, Dribbble, Vimeo, YouTube, personal sites) and/or reels.

**Ingestion process:**
1. **Scraping + asset extraction** — system function, no LLM. Get portfolio pieces and video frames.
2. **Per-piece visual analysis** — multimodal model analyzes each piece: color palette, composition, typography, mood, style, production level. For video: key frame sampling + pacing analysis (cuts per minute), transitions, color grading, image-audio relationship.
3. **Cross-portfolio pattern extraction** — identifies what repeats across 70%+ of work (constants) vs. what varies (range).
4. **Creative Style DNA output** — structured document:
   - **Stylistic constants:** What appears in >70% of work.
   - **Creative range:** The extremes between which the work moves.
   - **Narrative patterns:** How stories are told (if video).
   - **Production level:** How polished vs. raw.
   - **Detected influences:** What school or creative tradition.

**Storage:** Analysis and Creative DNA stored — NOT original assets (copyright respect). Original links stored as source reference.

**Three training modes:**
- **Clone a real director:** Human CD feeds portfolios + reels → system extracts their Creative DNA → platform CD works with their sensibility.
- **Train by inspiration:** Client feeds 5+ portfolios they admire (not one director) → system extracts cross-portfolio patterns → "Frankenstein" CD captures what they have in common.
- **Customize base CD:** User takes a pre-built CD and feeds references to bias it toward a specific aesthetic.

**MVP scope:** CDs are text-based (philosophy + manual reference descriptions). Portfolio ingestion is post-MVP. But the table `creative_references` and `creative_style_dna` exist from Fase 0 (empty, ready to populate).

### 4.5 Creative Director Marketplace Economics (DEC-177)

**Tier Free — House CDs:**
2-3 base CDs included in all plans. Competent, reliable, no extraordinary signature.

**Tier Premium — Portfolio-trained CDs:**
CDs trained with real portfolios/reels. Measurable performance: "This CD has 87% first-attempt approval in awareness campaigns." Unlocked by plan tier, not per-token surcharge.

**Tier Custom — Client's own CD:**
Client creates their own CD via self-service training flow.

**Plan mapping:**
- Starter ($99): Free CDs only. 1 custom CD allowed.
- Pro ($249): Free + Premium CDs. 3 custom CDs allowed.
- Agency ($599): All CDs + unlimited custom + publish to marketplace (post-MVP).

**Post-MVP marketplace:** Human creative directors license their clone. Revenue share per use.

### 4.6 Output: Creative Direction Document

The Creative Director produces a **Creative Direction** for each piece/campaign:

- **Central concept:** The creative idea in one sentence.
- **Narrative tone:** The tone of *this specific piece* (not the brand tone — that's in Brand DNA). The brand may be "warm and professional" but this piece may be "humorous with an emotional twist at the end."
- **Visual direction:** Aesthetic style, references, emotional palette. How the brand's visual system is applied in this piece.
- **Audio direction:** Musical mood, voice treatment, general sound design.
- **Narrative structure:** Arc of the piece. Setup, conflict, turn, resolution, CTA — with timing.
- **References:** Conceptual references illustrating the direction (textual in MVP, visual post-MVP).

### 4.7 Skills

**Skill 1 — Campaign Concept**
- **Input:** Campaign Brief (from Strategist) + Brand DNA
- **Output:** Creative Direction for the entire campaign
- **When:** At the start of a campaign generating multiple pieces
- **Scope:** Defines the creative line unifying all campaign pieces

**Skill 2 — Piece Direction**
- **Input:** Campaign Creative Direction (if exists) + specific piece brief + Brand DNA
- **Output:** Creative Direction specific to one piece (video, graphic, etc.)
- **When:** Before executor agents start working on a piece
- **Scope:** Translates campaign direction into concrete instructions for a specific motor's agents

**Skill 3 — Creative Revision**
- **Input:** Artifact rejected at a gate + gate feedback + original Creative Direction
- **Output:** Revised Creative Direction with specific adjustments
- **When:** When a gate fails and the cause is creative direction (not execution)
- **Scope:** Does not rewrite the artifact — adjusts direction so the executor agent produces something different on the next attempt

### 4.8 Position in Video Motor Pipeline

```
BRIEF → [Creative Director: Piece Direction] → CONCEPT → [G1] → SCRIPT → [G2] → ...
```

The step BRIEF → CONCEPT now has a clear owner: the Creative Director produces the concept. The Writer then writes the script *under* that direction. The DP proposes visual look *under* that direction.

The Creative Direction is injected as context to all downstream agents, alongside Brand DNA.

### 4.9 Relationship with Other Transversals

- **With Brand Guardian:** G1 (post-concept) includes Brand Guardian invocation with Strategic Alignment Review skill evaluating the Creative Direction itself. Catch brand contradictions before the Writer writes an entire script.
- **With Showrunner:** Creative Director proposes the vision. Showrunner validates execution fulfills the vision. CD is the *before*, Showrunner is the *during and after*.
- **With Strategist:** Strategist says "what to do and for whom." Creative Director says "how to do it creatively."

### 4.10 Cost Estimate

1-2 invocations per piece (initial + possible revision). Campaign: 1 Campaign Concept + 1 Piece Direction per piece. Opus pricing but low invocation count — marginal cost increase for significant quality improvement.

Input: ~3.5K-5.5K tokens. Output: ~800-1.5K tokens.

### 4.11 Boundaries

- Does not execute — does not write scripts, design, or edit. Directs.
- Does not validate — does not say if something is good or bad. That's Brand Guardian (brand) and Showrunner (quality/coherence).
- Does not plan marketing — does not decide channels, budget, audiences. That's the Strategist.
- Does not have final say — Creative Direction passes through G1 where Brand Guardian and client (in "human approves" mode) can reject it.

### 4.12 Post-MVP Evolution

- When more creation motors are added (Graphic Design, Web, Audio), the CD directs all — Piece Direction skill adapts per motor.
- Campaign Concept skill becomes critical for multi-motor campaigns (video + graphics + email coherent under one creative line).
- Portfolio/reel ingestion pipeline enables CD training (DEC-176).
- Marketplace enables CD licensing by human directors (DEC-177).

---

## 5. Showrunner

### 5.1 Identity

- **Type:** Agent with tools (DEC-141 complex pattern). Requires real qualitative judgment — deciding whether a script "deserves to be produced" is not a checklist.
- **Model:** Opus, Tier A (DEC-174). Second highest-leverage point. An undemanding Showrunner lets mediocre work through, wasting all downstream tokens. A demanding Showrunner that rejects at G2 saves all VIDEO_GEN, EDIT, AUDIO, POLISH tokens that would have been spent on a weak script.
- **Prompt:** `prompt_registry`, entry: `agent: showrunner`, `skill: [variable per gate]`.

### 5.2 The Problem It Solves

The Brand Guardian checks brand consistency. The Creative Director defines creative direction. But neither evaluates whether the execution is **good**. A script can be on-brand and aligned with creative direction but still be boring, poorly structured, or weak. The Showrunner is the quality gate — the one who says "this isn't good enough."

In MVP with a single creation motor (Video), the Showrunner evaluates individual pieces at gates. Post-MVP with multi-piece campaigns, it also evaluates campaign-level coherence.

### 5.3 Skills (MVP — Video Motor Gates)

**Skill 1 — Concept Evaluation (G1)**
- **Input:** Creative Direction (from CD) + Concept
- **Central question:** "Is this vision clear, inspiring, and executable?"
- **Evaluates:** Concept clarity (can it be explained in one sentence?), emotional potential, feasibility with available resources, relative originality.
- **Does NOT evaluate:** Brand consistency (that's Brand Guardian).

**Skill 2 — Script Evaluation (G2)**
- **Input:** Script + Creative Direction + original Brief
- **Central question:** "Does this script deserve to be produced?"
- **Evaluates:** Narrative structure, rhythm, hook (first 3 seconds for digital), payoff, message clarity, CTA effectiveness, format/duration fit.
- **The bar is deliberately high.** Producing a video is expensive in tokens. A mediocre script that passes G2 wastes the entire downstream pipeline.

**Skill 3 — Visual Evaluation (G3)**
- **Input:** Visual Look + Storyboard + Script + Creative Direction
- **Central question:** "Do the visuals serve the narrative?"
- **Evaluates:** Visual-narrative coherence, composition, visual rhythm, transitions, whether visuals amplify or distract from the message.
- **Note:** This gate also includes client approval in "human approves" mode.

**Skill 4 — Edit Evaluation (G4)**
- **Input:** Edited video + Audio + original Script + Creative Direction
- **Central question:** "Is this watchable? Does it serve the brief?"
- **Evaluates:** Edit rhythm, transitions, continuity, audio-visual sync, pacing, duration correctness, hook effectiveness, CTA landing.

**Skill 5 — Final Quality (G5)**
- **Input:** Final polished video + original Brief + Creative Direction + Brand DNA
- **Central question:** "Is this ready for delivery?"
- **Evaluates:** Technical polish, overall quality, complete brief fulfillment.
- **Note:** This is the only Showrunner skill that also checks brand consistency — as a final verification before delivery, complementing Brand Guardian.

### 5.4 Evaluation Protocol

Unlike Brand Guardian (per-dimension pass/warning/fail), the Showrunner evaluates holistically:

**Output (structured JSON):**

```json
{
  "verdict": "advance | iterate | rethink",
  "quality_score": 7,
  "strengths": ["Specific things that work well"],
  "weaknesses": ["Specific things that don't work"],
  "direction": "If iterate or rethink, what specifically must change"
}
```

**Three verdict levels:**

- **Advance:** Ready for the next step. Doesn't have to be perfect — has to be solid enough for the next step to build on.
- **Iterate:** Direction is correct but execution needs work. The producing agent receives `weaknesses` + `direction` as feedback and retries. Activates the 3+3 rule counter.
- **Rethink:** Direction itself doesn't work. Not an execution problem — a concept problem. This escalates to the Creative Director for a revised Creative Direction (CD Skill 3: Creative Revision).

**"Rethink" ≠ "iterate."** Iterate says "write this script better." Rethink says "this script won't work no matter how well you write it — the concept needs to change." The distinction saves wasted iterations.

### 5.5 Tools

- **Read Creative Direction** — access the CD's creative direction for this piece/campaign
- **Read Brief** — access the original Strategist brief
- **Read Brand DNA** — access Brand DNA (relevant subset)
- **Read Previous Evaluations** — access the Showrunner's own prior evaluations at earlier gates in the same project (maintains evaluative coherence: "at G1 I said the concept was strong because of X — now I verify the script preserves X")
- **Flag for Creative Director** — when verdict is "rethink," notifies CD that direction needs revision

### 5.6 Parallel Evaluation with Brand Guardian

At each gate, Brand Guardian and Showrunner can be invoked **in parallel** — their evaluations are orthogonal:

| Brand Guardian | Showrunner | Meaning |
|---|---|---|
| Pass | Advance | On-brand AND good quality → proceed |
| Pass | Iterate | On-brand but weak execution → agent retries |
| Pass | Rethink | On-brand but wrong creative direction → CD revises |
| Fail | Advance | Good quality but off-brand → agent retries with brand feedback |
| Fail | Iterate | Off-brand AND weak → agent retries with both feedback |
| Fail | Rethink | Off-brand AND wrong direction → CD revises with brand feedback |

Both must pass for the pipeline to advance.

### 5.7 Cost Estimate

Invoked at each of 5 Video motor gates. Opus pricing. Worst case with 3+3: up to 30 invocations per video (5 gates × 6 attempts). Normal case: ~6-8 invocations (most gates pass in 1-2 attempts).

Input: ~3K-6K tokens. Output: ~400-800 tokens.

The "demand Showrunner saves money" argument: rejecting at G2 (script) saves all tokens for VIDEO_GEN + EDIT + AUDIO + POLISH + G3 + G4 + G5. A single G2 rejection that prevents a bad video from being produced saves far more than the Showrunner's own invocation cost.

### 5.8 Boundaries

- Not Creative Director — does not propose creative direction. Evaluates whether execution meets the direction.
- Not Brand Guardian — does not evaluate brand consistency (except at G5 final check). Evaluates quality and coherence.
- Not an executor — does not rewrite, re-edit, or fix. Gives feedback for others to fix.
- The Showrunner can say "this is on-brand but boring" — Brand Guardian cannot.

### 5.9 Post-MVP Evolution

**Skill 6 — Campaign Coherence Review:**
When multiple creation motors exist and campaigns produce multiple pieces, evaluates whether pieces work as an ensemble. Progression, complementarity, or redundancy.

**Skill 7 — Campaign Score:**
Composite score from gate results + Analyst metrics. Quality of execution × brand alignment × performance. Feeds Strategist for optimization.

---

## 6. Financial Agent — MVP Simplification (DEC-178)

### 6.1 Decision

The Financial Agent does NOT exist as an agent in MVP. Its responsibilities are distributed:

**Token cost tracking → System function**
- Aggregates Helicone data (DEC-147) by project, motor, tenant
- Compares consumption against plan limits (Starter/Pro/Agency token budgets)
- Usage billing calculations
- Scheduled daily job + real-time counter for rate limiting
- No LLM needed — pure arithmetic

**Budget validation in Strategist → Strategist skill**
- "Budget Validation" skill loaded by Strategist at G1 and G3
- Applies Harvard M6 frameworks (CAC, LTV, ROI, ROAS) to validate proposed plan economics
- No separate agent needed — Strategist is capable of validating its own plan's economic viability with the right skill

### 6.2 When It Becomes a Real Agent

When distribution motors exist with real ad spend:
- Real-time spend monitoring against forecast
- Channel deviation alerts
- Supplier cost validation (Marketplace)
- Campaign P&L with real data
- Must be independent of Strategist to serve as counterweight ("your plan says spend X on TikTok but historical ROI doesn't justify it")

### 6.3 Infrastructure

Table `financial_tracking` exists from MVP to accumulate cost data, even though there's no agent interpreting it yet.

---

## 7. Channel Manager — MVP Simplification (DEC-179)

### 7.1 Decision

The Channel Manager does NOT exist as an agent in MVP. Its responsibility is served by static data:

**Channel knowledge base → `channel_registry` table**
- Contains per-channel data using the structure from marketing engine doc §5.3:
  - Channel name, type (Paid/Owned/Earned/Traditional)
  - Reach, demographics, geographies
  - Available formats with specs
  - Cost model and typical ranges
  - Best practices, limitations
- Seeded with ~15-20 main Funnel Matrix channels
- Maintained manually by admin via Admin Portal

**Strategist access → `lookup_channel` tool**
- Strategist has a tool that queries `channel_registry`
- At Media Plan step (step 5), searches for channels relevant to objective and audience
- Uses specs to produce campaign briefs with realistic formats and costs

### 7.2 When It Becomes a Real Agent

When distribution motors exist and need:
- Real-time spec adaptation (platforms change policies constantly)
- Technical specs for actual execution (not just planning)
- Response to Media Scout discoveries with new channel skills
- Channel-specific optimization intelligence

### 7.3 Infrastructure

Table `channel_registry` exists from Fase 0, seeded with main channels.

---

## 8. Creative Pipeline Summary

The full creative pipeline from brief to delivery:

```
STRATEGIST                    CREATIVE DIRECTOR              EXECUTORS                    EVALUATORS
                              (Opus, Tier A)                 (Sonnet, Tier A)             
                                                                                          
Campaign Brief ──────────────► Campaign Concept               
  "What + For whom"            "How, creatively"              
       │                            │                         
       │                            ▼                         
       │                       Piece Direction ──────────────► Writer ──► Script           
       │                            │                         DP ──► Visual Look          
       │                            │                         Audio ──► Sound Design      
       │                            │                         Editor ──► Final Edit       
       │                            │                                     │                
       │                            │                                     ▼                
       │                            │                         Brand Guardian (Sonnet):     
       │                            │                           "Is it on-brand?"          
       │                            │                         Showrunner (Opus):            
       │                            │                           "Is it good?"              
       │                            │                                     │                
       │                            │                              ┌──────┴──────┐         
       │                            │                              │             │         
       │                            │                           PASS          FAIL         
       │                            │                           advance     iterate/rethink
       │                            │                                         │            
       │                            ◄─── (if rethink) ────────────────────────┘            
       │                                  CD revises direction                             
```

---

## 9. New Tables Required

| Table | Purpose | Created in |
|---|---|---|
| `creative_references` | Manual reference corpus per CD (title, description, lessons, tags) | Fase 0 |
| `creative_style_dna` | Extracted style DNA from portfolio/reel analysis | Fase 0 (empty, populated post-MVP) |
| `channel_registry` | Static channel knowledge for Strategist | Fase 0 (seeded with ~15-20 channels) |
| `financial_tracking` | Token cost aggregation by project/motor/tenant | Fase 0 |

---

## 10. Decisions Summary

| DEC | Decision | Status |
|---|---|---|
| DEC-174 | Model selection by creative leverage: Opus for CD + Showrunner, Sonnet for executors + Brand Guardian, Haiku for classification | Active |
| DEC-175 | Creative Director as clonable asset: portable package of philosophy + references + model config | Active |
| DEC-176 | CD training pipeline: portfolio/reel ingestion → Creative Style DNA extraction via multimodal analysis. MVP text-based; post-MVP visual ingestion | Active |
| DEC-177 | CD marketplace economics: Free (house CDs), Premium (performance-gated by plan), Custom (self-service). Post-MVP: human directors license clones | Active |
| DEC-178 | Financial Agent MVP: no agent. System function (token tracking) + Strategist skill (budget validation). Becomes agent when distribution motors generate real spend | Active |
| DEC-179 | Channel Manager MVP: no agent. `channel_registry` table + Strategist `lookup_channel` tool. Becomes agent when distribution motors need dynamic channel expertise | Active |
