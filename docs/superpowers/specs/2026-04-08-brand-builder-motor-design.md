# criteria.agency — Brand Builder Motor Design

> Date: April 8, 2026
> Status: Approved design
> Scope: Brand Builder motor — pipeline, capas, agente, skills, gates, modo continuo
> Decisions: DEC-074 through DEC-086

---

## 1. Context

The Brand Builder motor is the foundation of criteria.agency. Without a Brand DNA, every other motor operates generically — the Strategist can't target, the Creative Director can't direct, the Brand Guardian can't validate, and the content across motors lacks cohesion.

Despite being foundational, the Brand Builder had zero design and zero code as of April 8, 2026. This spec defines the complete motor.

### Position in the platform

| Attribute | Value |
|-----------|-------|
| Category | Strategy |
| Agent | Brand Strategist (1) |
| Mode | **Hybrid** — Project phase (build Brand DNA by layers) + Continuous phase (dormant, trigger-activated) |
| Output | Brand DNA and all supporting artifacts in Mi Negocio |
| Consumers | Every other motor and transversal agent. Primary consumers: Strategist, Creative Director, Brand Guardian |

### Key decisions made in this spec

| Decision | ID | Choice |
|----------|----|--------|
| Motor lifecycle | DEC-074 | Hybrid. Brand is a living organism, not a one-time deliverable |
| Pipeline model | DEC-075 | Layers of depth (0-3), not sequential steps. Each layer unlocks new platform capabilities |
| Layer 0 execution | DEC-076 | System function (scraping + template filling), not agent. Brand Strategist enters at layer 1 |
| Gate philosophy | DEC-077 | Sufficiency thresholds, not barriers. Only layer 2 incoherence blocks. Score reflects gaps |
| Layer 3 gate participation | DEC-078 | Brand Guardian co-evaluates layer 3 gate (it's the primary consumer of systematization artifacts) |
| Skills | DEC-079 | 5 skills: Discovery, Positioning (M1-M6 + Godin), Archetype & Voice, Identity Systems, Brand Audit |
| Continuous triggers | DEC-080 | 5 triggers: Strategist misalignment, client request, business event, scheduled audit (6mo), score drop |
| Incoherence threshold | DEC-081 | Blocks when two Brand DNA artifacts contradict → downstream motors would produce opposite outputs |
| Layer transitions | DEC-082 | Layers accelerate (workshop does 0→3 in hours) but never skip. Each builds on previous. |
| Multi-brand sharing | DEC-083 | Market-level data (competitive map, trends, benchmarks) shareable. Brand-level data (positioning, archetype, tone) never shared. |
| DNA versioning | DEC-084 | Previous versions preserved as undo, not version history. Client sees "revert last update." |
| Workshop dynamics | DEC-085 | Human expert and Brand Strategist work in parallel. Human brings concepts; agent structures and validates in real time. |
| Cross-motor brand assets | DEC-086 | Logo (Graphic Design), Manifesto (Brand Strategist + Creative Director), Enriched Manual (Brand Strategist + Graphic Design). All cost tokens. Logo always requires client approval. |

---

## 2. Core Concept: Layers of Depth

The Brand Builder does not follow a sequential pipeline like the Video motor (Brief → Script → Visual → Audio → Edit → Polish). Brand building is an iterative discovery process where each piece informs the others.

Instead, the Brand Builder operates in **layers of depth**. Each layer covers the entire Brand DNA but at increasing depth — like painting a picture: first the sketch, then the shapes, then the details.

### Why layers

1. **Integrates with onboarding.** Layer 0 is the onboarding output. The Brand Builder continues from there — no rupture between onboarding and motor.
2. **Maps to the three configuration paths.** Manual → layer 1. Copilot → layers 2-3. Workshop → layer 3. Natural alignment.
3. **Feeds the Brand Health Score.** The Fundamentos axis essentially measures which layer the client is at. Each incomplete layer is a visible gap with concrete actions to close it.
4. **Each layer unlocks capabilities.** The client has a real incentive to deepen — not filling fields for the sake of it, but unlocking better outputs from every motor.

### The four layers

| Layer | Name | Who executes | Effort | Score impact (Fundamentos) |
|-------|------|-------------|--------|---------------------------|
| 0 | Onboarding automático | System function | ~2 minutes | ~15-20 |
| 1 | Fundamentos validados | Brand Strategist (Discovery skill) | ~30-60 minutes | ~40-50 |
| 2 | Profundidad estratégica | Brand Strategist (Positioning + Archetype skills) | ~2-4 hours | ~65-75 |
| 3 | Identidad profesional | Brand Strategist (Identity Systems skill) | ~4-8 hours | ~85-95 |

---

## 3. Layer Details

### 3.0 Layer 0 — Onboarding automático

**Executor:** System function (not Brand Strategist). Scraping, extraction, template filling. No judgment.

**Trigger:** Client completes onboarding (provides URLs or answers 3 minimum questions).

**Inputs from client:**
- Path A (has brand): Website URL, social media URLs
- Path B (from scratch): 3 questions — what does your business do? who do you sell to? what makes you different?

**Inputs from system:**
- Path A: Website scraping (text, images, meta tags, structure), social media scraping (bios, recent posts, public metrics), competitor detection by category/keywords
- Path B: None — works purely from client answers

**Artifacts produced:**

| Artifact | Path A | Path B |
|----------|--------|--------|
| Logo | Extracted | None |
| Color palette | Detected from website/social | None |
| Tone of voice | Inferred (1 paragraph) | Inferred from answers |
| Estimated audience | Generic, from content analysis | Generic, from answer to "who" |
| Value proposition | Inferred from website copy | Direct from answer to "what makes you different" |
| Active channels | Listed with basic metrics | None |
| Competitor map | Auto-detected (if identifiable) | None |

**All artifacts marked as "draft — pending validation."**

**What it unlocks:** The platform functions. Client can create generic campaigns. Strategist operates with basic recommendations. Brand Guardian validates against superficial criteria. It works — like a freelancer who met you 5 minutes ago.

**Gate (0→1):** Automatic coverage check (system function). Did scraping produce minimum fields? Did client answer the 3 questions? Pass = layer 0 complete. No quality judgment.

---

### 3.1 Layer 1 — Fundamentos validados

**Executor:** Brand Strategist with **Discovery** skill.

**Trigger:** Client enters Mi Negocio to review draft, or Copilot prompts "let's review what we found about your brand."

**Inputs from client:**
- Confirmation or correction of every layer 0 field
- Answers to questions the draft couldn't resolve: What's your real differentiator? Who is your ideal customer? What tone do you want?

**Inputs from system:**
- Layer 0 draft as starting point. The Brand Strategist reacts to the draft — never starts from zero.

**Interaction model:** Short and concrete. Not a workshop — a validation session. "Is this correct?" "Does this represent you?" The Brand Strategist pushes gently when answers are too generic.

**Artifacts produced:**

| Artifact | Description |
|----------|-------------|
| Validated value proposition | What you do, for whom, why they choose you. Client-confirmed, not inferred. |
| Confirmed primary audience | Demographics + 1 level of psychographics. Specific enough to target. |
| Basic positioning | What category you compete in, against whom. Not deep analysis — a stake in the ground. |
| Confirmed visual identity | Logo, colors, primary typography. What exists today, validated. |
| Defined tone of voice | 3-5 adjectives + examples of "sounds like this" / "never sounds like this." |

**What it unlocks:** Strategist can design campaigns with real targeting. Creative Director can propose versions with grounded creative direction. Brand Health Score Fundamentos rises to ~40-50.

**Gate (1→2) — "Are fundamentals client-validated?"**

The Brand Strategist evaluates: Has the client touched every section (not just accepted defaults)? Is the value proposition clear and differentiated, or generic? Is the audience specific, or "everyone"? Does the tone of voice have personality, or could it belong to any brand?

If the client says "my audience is women 25-45," the Brand Strategist pushes: that's a demographic, not an audience. But it doesn't block — marks Fundamentos as incomplete and continues. The platform works; the score reflects the gap.

---

### 3.2 Layer 2 — Profundidad estratégica

**Executor:** Brand Strategist with **Positioning** and **Archetype & Voice** skills.

**Trigger:** Client chooses to deepen (prompted by score, Copilot recommendation, or own initiative).

**Inputs from client:**
- Deep conversation. The Brand Strategist extracts what the client often hasn't articulated:
  - Why does your business exist beyond making money?
  - What experience do your current customers have?
  - What do people say when they recommend you?
  - Which competitor do you admire and why? Which do you dislike and why?
  - "This is for people who..." (Godin's smallest viable audience)

**Inputs from system:**
- Listener data (if active): competitive landscape, market trends, industry shifts
- Engagement analysis by content type (if campaigns exist)
- Category benchmarking

**Pattern:** As layers increase, the balance shifts from system inputs to client inputs. Layer 0 is 90% system. Layer 2 is 70% client. Strategic depth can't be scraped — it must be extracted from the business owner's head. This is why Copilot and workshops matter here.

**Artifacts produced:**

| Artifact | Description |
|----------|-------------|
| Segmented audiences | 2-5 buyer personas with psychographics, behavior patterns, motivations. Not demographics — people. |
| 3Cs positioning | Company, Customer, Competition analysis. Harvard M1-M6 framework applied. Where you play and why you win. |
| Smallest viable audience | Godin lens: "This is for people who..." — the specific tribe the brand serves. |
| Brand archetype | Personality, voice, relationship with audience. Who IS the brand as a person. |
| Verbal territory | Brand's own vocabulary, forbidden phrases, tone by context. What it says and what it would never say. |
| Competitive map | Who competes for the same attention, how each differentiates. Real differentiation, not aspirational. |

**Knowledge bases used:**
- Harvard M1-M6 framework (`docs/brain/M1-M6_Summary.pdf`) — analytical rigor: segmentation, targeting, positioning, differentiation
- Seth Godin methodology — focus and clarity: smallest viable audience, tribal marketing, permission marketing, brand as story told to people who want to hear it

M1-M6 provides the analytical structure. Godin provides the focus. The Brand Strategist uses both lenses depending on context — M1-M6 for competitive mapping and segmentation, Godin for the client to articulate who they really serve.

**What it unlocks:** Creative versions differentiated by audience segment. Copy that sounds like the brand, not a generic LLM. Listeners calibrated to monitor what actually matters. Brand Guardian validates with substance. Score rises to ~65-75.

**Gate (2→3) — "Is the brand strategy internally coherent?"**

This is the most important gate. The Brand Strategist evaluates coherence:
- Is the 3Cs positioning consistent with defined audiences?
- Does the brand archetype reflect in the verbal territory?
- Does the competitive map show real differentiation, or is the client positioned identically to competitors?
- Does the smallest viable audience align with the segmented personas?

**3+3 rule applies here.** If there are incoherences, the Brand Strategist signals them and proposes adjustments. Three iterations with the client. If no convergence, three more with a different approach (perhaps reframe positioning from scratch). If still no convergence, escalate to workshop with human expert.

**This is the one gate that can genuinely block.** A brand with contradictory positioning produces contradictory outputs across all motors. Worth stopping here.

---

### 3.3 Layer 3 — Identidad profesional

**Executor:** Brand Strategist with **Identity Systems** skill.

**Trigger:** Client chooses to systematize (prompted by score, or needs professional-grade consistency).

**Inputs from client:**
- Approval of visual applications
- Aesthetic preferences that can't be easily inferred: photography or illustration? Minimalist or expressive? Sober or bold?
- Examples of brands they admire visually (reference, not copying)

**Inputs from system:**
- All artifacts from layers 1-2 as input
- Active channel catalog from Channel Manager (to generate tone guide per channel)
- Brand book templates

**Artifacts produced:**

| Artifact | Description |
|----------|-------------|
| Brand book | Consolidated document with everything from layers 1-3. The single source of truth for the brand. |
| Extended visual system | Typographic hierarchy, extended palette, photography/illustration guidelines, icon system, format-specific applications. Not just "logo and colors" — a system. |
| Tone of voice guide by channel | How the brand sounds on Instagram vs email vs website vs ads vs customer service. Same voice, different register. Concrete examples per channel. |
| Brand Guardian validation templates | The specific criteria the Brand Guardian uses to validate every output from every motor. This is where the Brand Builder gives the Brand Guardian its teeth. |

**What it unlocks:** Real visual consistency across motors — video, design, email, and web feel like the same brand. Brand Guardian has precise criteria to validate against (not vibes). Professional-grade output quality. Score rises to ~85-95.

**Gate (3) — "Is the brand system applicable?"**

The Brand Strategist validates that layer 3 artifacts are usable by the motors:
- Does the brand book have enough specificity for the Brand Guardian to validate consistently?
- Does the tone guide per channel have concrete examples or is it abstract?
- Does the visual system cover the formats that creation motors need?

**Brand Guardian participates in this gate (DEC-078).** As the primary consumer of these artifacts, if the Brand Guardian says "I can't validate consistently with these guidelines," layer 3 is not ready.

---

## 4. Brand Strategist Agent

### Profile

| Attribute | Value |
|-----------|-------|
| Type | Agent (autonomous decisions, maintains context, iterates) |
| Motor | Brand Builder (Strategy category) |
| Mode | Hybrid — Project (layers 1-3) + Continuous (dormant, trigger-activated) |
| Autonomy | Guided (60-74%). Full technical autonomy. Strategic brand decisions require client validation. |
| Human substitution priority | High. Brand strategy is one of the roles where human judgment has the most quality impact. |

### Skills

| Skill | Loaded when | Purpose |
|-------|-------------|---------|
| **Discovery** | Layer 1 | Extraction and validation. Conversational, concrete, doesn't ramble. Knows how to review a draft with a client and push past generic answers. |
| **Positioning** | Layer 2 | Strategic heavy lifting. 3Cs framework (M1-M6), competitive analysis, differentiation. Godin's smallest viable audience and tribal lens. Knows how to ask uncomfortable questions. |
| **Archetype & Voice** | Layer 2 | Brand personality. Archetypes, tone, vocabulary, verbal identity. More creative than analytical. Defines who the brand IS as a person. |
| **Identity Systems** | Layer 3 | Systematization. Takes everything from layers 1-2 and converts it into an applicable system: brand book, guidelines, templates. More technical than strategic — knows typography, extended palettes, format applications. |
| **Brand Audit** | Continuous mode | Comparison and diagnosis. Compares current Brand DNA against market reality and produces a verdict: what's still valid, what needs updating, what changed. |

### What is NOT the Brand Strategist

The Brand Strategist builds and evolves the Brand DNA. Three related but distinct roles:

| Agent | Relationship to brand | Distinction |
|-------|----------------------|-------------|
| **Brand Strategist** (Brand Builder) | Architect. Builds and questions the foundations. | "Should our positioning change?" |
| **Brand Guardian** (Transversal) | Police. Defends the current Brand DNA. | "This output doesn't match our tone." |
| **Strategist** (Transversal) | Translator. Uses Brand DNA to design campaigns. | "Based on our positioning, we should target this channel." |

---

## 5. Continuous Mode

### Concept

After completing the Project phase (building the Brand DNA through layers), the Brand Strategist enters dormant mode. It does not actively monitor — that's what Listeners and the Strategist do. It sleeps and wakes up on specific triggers.

This makes it Hybrid with a very different continuous mode from Listeners. It's not constantly watching — it's *available* and activates on signals.

### Five triggers

#### Trigger 1 — Misalignment detected by Strategist

**Condition:** The Strategist, in its continuous evaluate→design→adjust cycle, detects that campaign results consistently diverge from what the Brand DNA predicts. Not an isolated data point — a sustained pattern across 2+ campaigns.

**Example:** Brand DNA says primary audience is professional women 30-45, but campaigns with best performance consistently resonate with male entrepreneurs 25-35.

**Action:** Brand Strategist loads Brand Audit skill. Reviews Brand DNA against real data. Produces diagnosis with options: "Your declared audience doesn't match your real audience. Options: adjust the DNA to reflect reality, or adjust campaigns to pursue the original audience." Presents to client as recommendation.

#### Trigger 2 — Explicit client request

**Condition:** Client enters Mi Negocio and edits a section, or tells Copilot "I want to review my brand" / "I need to reposition" / "let's change the tone."

**Action:** Brand Strategist activates with appropriate skill based on what the client wants to change. Positioning change → Positioning skill. Tone change → Archetype & Voice skill. Everything → full Brand Audit.

#### Trigger 3 — Significant business event

**Condition:** Client registers a structural change in Mi Negocio — new product or service, new geographic market, business model change, merger, pivot. These are editable fields in Mi Negocio that the system monitors.

**Action:** Brand Strategist loads Brand Audit and evaluates the change's impact on Brand DNA. "You added a B2B service but your brand is positioned 100% B2C. Options: create a sub-brand, extend current positioning, or keep both worlds separate."

#### Trigger 4 — Scheduled audit

**Condition:** 6 months have passed since the last Brand DNA review (date tracked automatically).

**Action:** Brand Strategist loads Brand Audit. General validity check — not because something is wrong, but as preventive maintenance. Compares against current Listener data (has the market changed?), Analytics (has performance shifted?), competitive map (new players?). Produces report: "your Brand DNA is still valid" or "these 3 areas need updating."

#### Trigger 5 — Brand Health Score drops below threshold on Fundamentos axis

**Condition:** The Fundamentos score drops below a defined threshold. Can happen if the client deactivates a Listener, deletes Mi Negocio content, or the market shifted enough that once-good positioning is no longer valid.

**Action:** Brand Strategist wakes up not because someone asked, but because the score signals it. Loads Brand Audit, diagnoses the cause, recommends specific actions to restore score.

---

## 6. Quality Gates Summary

| Gate | Between | Type | Evaluator | Blocks? |
|------|---------|------|-----------|---------|
| G0 | Layer 0 → 1 | Coverage check | System function | No. Checks minimum fields filled. |
| G1 | Layer 1 → 2 | Validation check | Brand Strategist | No. Pushes for specificity but doesn't block. Score reflects gaps. |
| G2 | Layer 2 → 3 | Coherence check | Brand Strategist | **Yes, on incoherence.** 3+3 rule applies. A contradictory brand produces contradictory outputs — worth stopping. |
| G3 | Layer 3 complete | Applicability check | Brand Strategist + Brand Guardian | No hard block, but Brand Guardian can reject if guidelines are unusable. Iterates until applicable. |

### Gate philosophy (DEC-077)

Gates in the Brand Builder are **sufficiency thresholds**, not barriers. The platform functions at any layer — it functions *better* at higher layers. The Brand Health Score (Fundamentos axis) is the honest mirror: it shows the client exactly where they are and what they'd gain by going deeper.

The only exception is the layer 2 coherence gate. A brand with contradictory positioning is worse than a shallow brand — it actively confuses every downstream motor.

---

## 7. Integration with Other Systems

### Brand Health Score (Fundamentos axis)

The Brand Builder is the primary driver of the Fundamentos axis. The score essentially measures which layer the client has completed and how well:

| Layer completed | Approximate Fundamentos score |
|----------------|------------------------------|
| 0 (onboarding only) | 15-20 |
| 1 (validated) | 40-50 |
| 2 (strategic depth) | 65-75 |
| 3 (professional identity) | 85-95 |

The score is not binary per layer — it reflects depth within each layer. A well-done layer 1 scores higher than a rushed layer 2.

### Three configuration paths

| Path | Reach | Experience | Natural tier |
|------|-------|------------|-------------|
| **Manual** | Layer 1 comfortably, layer 2 with effort | Client fills forms, system validates completeness | Starter |
| **Copilot** | Layer 2 fluidly, layer 3 with guidance | AI-guided conversation. Brand Strategist conducts conversational workshops | Pro |
| **Workshop with experts** | Layer 3 with professional quality | Human accompanies the process alongside AI. Professional consulting | Agency / upsell for any tier |

### Revenue expansion engine

Each incomplete layer is visible in the score with concrete actions:
- "You're at layer 1. To unlock audience-targeted creative versions, deepen your audiences." → Copilot or workshop upsell
- "Your tone of voice is defined but not systematized by channel. Consistent multi-channel content requires layer 3." → Workshop upsell

The upsell doesn't feel like sales — it feels like an honest diagnosis.

### Consumers of Brand DNA

| Consumer | What it uses | From which layer |
|----------|-------------|-----------------|
| **Strategist** | Audiences, positioning, objectives | Layer 1+ (basic), Layer 2+ (targeted) |
| **Creative Director** | Archetype, tone, visual direction | Layer 1+ (generic), Layer 2+ (differentiated) |
| **Brand Guardian** | All — validates against entire DNA | Layer 1+ (vibe check), Layer 3 (precise criteria) |
| **All creation motors** | Visual identity, tone, vocabulary | Layer 1+ (basic), Layer 3 (systematic) |
| **Listeners** | Competitive map, audiences, positioning | Layer 2+ (calibrated monitoring) |
| **Channel Manager** | Tone by channel, format preferences | Layer 3 (channel-specific guidelines) |

---

## 8. Cross-Motor Brand Asset Production (DEC-086)

### The problem

The Brand Builder produces the *strategy* of the brand — who you are, for whom, how you sound, how you look. But it does not produce the *assets* of the brand. Certain key deliverables require collaboration between the Brand Builder and creation motors.

### Three cross-motor brand assets

#### 8.1 Logo

| Attribute | Value |
|-----------|-------|
| **Producer** | Graphic Design motor (Designer agent with brand identity skill) |
| **Director** | Brand Builder (Brand Strategist provides creative brief) |
| **When** | Post-layer 1 (minimum functional) or post-layer 2 (ideal — strategic depth gives real creative direction) |
| **Autonomy** | Always "AI recommends + client approves" regardless of general configuration. The logo is the most important visual decision a business makes. |
| **Cost** | Tokens (production, not intelligence) |

**Flow:**
1. System detects in layer 0 whether a logo exists
2. Post-layer 1 (or 2), offers: "Your brand doesn't have a logo. We can create one now with what we know (functional result), or you can deepen your strategy first for a more grounded logo."
3. Client accepts → Brand Strategist emits creative brief to Graphic Design motor
4. Designer produces options (3-5 proposals based on archetype, positioning, audience, visual direction)
5. Client selects and refines
6. Approved logo returns to Brand DNA → feeds layer 3 visual system

**Detection:** If client provided URLs in onboarding and no logo was extracted, or client came through Path B (from scratch), the system flags "no logo" and surfaces the recommendation at the appropriate layer.

#### 8.2 Brand Manifesto

| Attribute | Value |
|-----------|-------|
| **Producers** | Brand Strategist + Creative Director (collaboration) |
| **When** | Transition from layer 2 to layer 3 |
| **What it is** | A short text that captures the emotional essence of why the brand exists. Not the corporate mission ("provide innovative solutions...") — something people *feel*. The emotional north that informs all of layer 3's systematization. |
| **Cost** | Tokens (creative production) |

**Flow:**
1. Layer 2 complete — the Brand Strategist has archetype, verbal territory, smallest viable audience, positioning
2. Brand Strategist provides strategic direction to Creative Director: "This brand is [archetype], speaks to [audience], differentiates by [X], and its verbal territory is [Y]"
3. Creative Director translates into a manifesto — a text with rhythm, emotion, poetry. Not a strategy document — a creative piece.
4. Client reviews and iterates (the manifesto must resonate emotionally, not just be strategically correct)
5. Approved manifesto becomes part of Brand DNA — the emotional anchor for tone, copy, and creative direction across all motors

**Why Creative Director and not Writer:** The manifesto is a creative direction piece, not a script or copy. The Creative Director operates at the level of brand narrative and emotional direction — exactly what a manifesto requires.

#### 8.3 Enriched Brand Manual

| Attribute | Value |
|-----------|-------|
| **Producers** | Brand Strategist (strategic brand book) + Graphic Design motor (visual applications) |
| **When** | Post-layer 3 |
| **What it is** | The fusion of the strategic brand book (layer 3 artifact — rules, criteria, territory) with visual applications (mockups of how the brand looks on Instagram, in emails, on business cards, on packaging, on a website). |
| **Cost** | Tokens (production of visual applications) |

**Flow:**
1. Brand Strategist completes layer 3 — produces strategic brand book (rules, guidelines, criteria)
2. Designer (Graphic Design motor) receives the brand book and produces visual applications: mockups by channel, format-specific examples, real-world applications
3. The enriched brand manual is the fusion: strategy + applications in one deliverable
4. This is the definitive document — what gets shared with external vendors, partners, or new team members

**Distinction:** The layer 3 brand book is the *rules*. The enriched brand manual is the rules *plus how they look in practice*. The first is sufficient for the platform's motors to operate. The second is what the client shows the world.

### Token cost principle

All three assets cost tokens because they are production, not intelligence. This aligns with the core principle: **the brain is free, the hands cost tokens.** The Brand Strategist thinking about the strategy costs nothing. The Designer producing the logo, and the Creative Director crafting the manifesto, cost tokens.

### Relationship to layers

```
Layer 0 ─── onboarding (system function)
Layer 1 ─── fundamentos validados
              └── [Optional: Logo if urgent — functional quality]
Layer 2 ─── profundidad estratégica
              └── [Recommended: Logo — strategic quality]
              └── Manifesto (Brand Strategist + Creative Director)
Layer 3 ─── identidad profesional (strategic brand book)
              └── Enriched brand manual (brand book + visual applications)
```

---

## 9. Relationship with Onboarding (unchanged)

The Brand Builder's layer 0 IS the onboarding brand analysis. There is no separate "onboarding module" and "brand building module" — the onboarding is the first pass, and the Brand Builder continues from there.

### Flow continuity

```
Onboarding (modal)
  └── Step 3: "Do you have a brand?"
        ├── Path A (URLs) → System function scrapes → Layer 0 draft
        └── Path B (from scratch) → 3 questions → Layer 0 draft
              └── Client exits modal → arrives at Home
                    └── Score shows ~15-20 Fundamentos
                          └── Strategist recommends: "Review your brand profile to improve targeting"
                                └── Client enters Mi Negocio → Brand Strategist activates → Layer 1 begins
```

No gap. No "now open the brand module." The score and recommendations naturally pull the client deeper.

---

## 10. Relationship with CriteriaFilms

For CriteriaFilms (criteria.agency's first client and film production brand), the Brand Builder operates the same way. The difference is that CriteriaFilms' Brand DNA will likely reach layer 3 early (it's Juan Pablo's core business with 20+ years of identity) and the Brand Strategist's continuous mode will focus on evolving the brand as CriteriaFilms enters new content niches and markets.

---

## 11. Implementation Notes

### Priority

The Brand Builder is Phase 2 priority alongside the Strategist motor. The Strategist depends on Brand DNA to operate with quality, making the Brand Builder a prerequisite for meaningful Strategist output.

### Recommended build order

1. Layer 0 system functions (extend existing onboarding)
2. Mi Negocio data model (all Brand DNA fields across 4 layers)
3. Brand Strategist agent with Discovery skill (layer 1)
4. Brand Health Score Fundamentos calculation
5. Brand Strategist with Positioning + Archetype & Voice skills (layer 2)
6. Layer 2 coherence gate (3+3 rule)
7. Brand Strategist with Identity Systems skill (layer 3)
8. Brand Guardian integration at layer 3 gate
9. Continuous mode triggers
10. Brand Audit skill

### Model considerations

- Layer 0 system functions: cheapest model (Haiku or equivalent). No judgment needed.
- Brand Strategist (layers 1-3): Claude or equivalent reasoning model. Brand strategy requires genuine reasoning, not pattern matching.
- Brand Audit: Claude. Comparing DNA against market reality requires synthesis.

---

## 12. Resolved Design Questions

### 11.1 Layer 2 incoherence threshold (DEC-081)

The layer 2 coherence gate blocks when **two artifacts within the same Brand DNA contradict each other in a way that would produce opposite outputs in downstream motors.** If the Brand Guardian would receive contradictory instructions, stop.

Three specific contradiction types that justify blocking:

| Contradiction | Example | Why it blocks |
|--------------|---------|---------------|
| **Audience ↔ Positioning** | Positions as premium brand but defines audience as price-sensitive. Or smallest viable audience is "tech-savvy millennials" but value proposition is "tradition and heritage." | Campaigns can't target and message coherently. |
| **Archetype ↔ Verbal territory** | Brand defined as "rebellious, provocative, irreverent" (Outlaw archetype) but verbal territory is "reliable, safe, established." | Copy and tone produce schizophrenic outputs. |
| **Positioning ↔ Competitive map** | Positioned identically to main competitor with zero identifiable differentiator. Not competing in the same category (that's fine) — literally indistinguishable. | No reason for the audience to choose this brand. |

**What does NOT block:** Incomplete information (that's a layer gap, not incoherence), weak but existing differentiators (score reflects it), minor contradictions resolvable with a wording adjustment.

**Rule:** The gate blocks when the Brand Guardian would receive contradictory instructions from the Brand DNA.

### 11.2 Layer transitions (DEC-082)

Layers cannot be skipped — they can be **accelerated**. A professional workshop can take a client from layer 0 to layer 3 in one session (hours instead of weeks), but it traverses all layers in order. Each layer builds on the previous one's artifacts.

The acceleration is in time, not in depth. A workshop-accelerated layer 2 has the same quality bar as a Copilot-guided layer 2 done over days.

### 11.3 Multi-brand shared elements (DEC-083)

In Pro/Agency tiers with multiple brands, each brand has independent layers. However, certain layer 2 elements that describe the **market** (not the brand) can be shared:

| Shareable (describes the market) | NOT shareable (describes the brand) |
|----------------------------------|-------------------------------------|
| Industry competitive map | Positioning |
| Market trends | Audiences / buyer personas |
| Category benchmarks | Brand archetype |
| Industry landscape analysis | Tone of voice |
| | Verbal territory |
| | Visual identity |

**Principle:** What describes the *environment* can be shared. What describes the *soul* of the brand cannot — sharing it would be like saying two people have the same personality because they work in the same office.

### 11.4 Brand DNA versioning (DEC-084)

When the continuous mode updates the Brand DNA, the previous version is preserved. But it is **not** presented to the client as a version history or audit trail — it functions as an **undo**.

If a continuous-mode update doesn't produce the expected results (campaigns perform worse, Brand Guardian starts flagging more, client feels the brand lost its essence), the client can revert. Simple undo, not version comparison.

Implementation: versions are stored internally with timestamps and trigger context (what caused the update). The client sees "Undo last brand update" — not "Compare version 3.2 with 3.1."

### 11.5 Workshop integration (DEC-085)

During live workshops, the human expert and the Brand Strategist agent work **in parallel**, not in sequence.

| Role | The human expert | The Brand Strategist agent |
|------|-----------------|---------------------------|
| **Contributes** | New concepts, provocative questions, industry experience, creative intuition, things an LLM can't invent | Structure, coherence validation, real-time documentation, data cross-referencing |
| **Leads** | The conversation, the exploration, the creative leaps | The architecture, the artifact generation, the consistency checks |
| **Cannot do** | Document everything in real time while also facilitating | Bring genuinely novel strategic concepts or read the room |

The human can introduce concepts that change the direction entirely — a new archetype, an unconventional positioning, a market insight from personal experience. The Brand Strategist integrates these in real time, validates coherence against existing artifacts, and produces updated documentation as the workshop progresses.

When the workshop ends, the Brand DNA is already documented and structured — no "post-workshop write-up" needed.
