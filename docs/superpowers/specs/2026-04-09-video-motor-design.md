# criteria.agency — Video Motor Design (MVP)

> Date: April 9, 2026
> Status: Approved design
> Scope: Video Production motor — the first and most complex creation motor in criteria.agency
> Supersedes: `PRODUCTION_PIPELINE.md` (April 5, 2026 — CriteriaFilms-era, pre-consolidation)
> Depends on: Transversal Agents Design (DEC-174 to DEC-179), Marketing Engine Design §2.1
> Decisions: References DEC-064, DEC-140, DEC-141, DEC-145, DEC-147, DEC-148, DEC-149, DEC-174 to DEC-179
> BUILD_ORDER: Fase 2

---

## 1. Context

The Video Motor is criteria.agency's first and most complex creation motor. It is the orchestration stress test — 10 pipeline steps, 5 gates, 6 executor agents, 3 transversal agents, and the 3+3 rule applied in a multi-agent context. If Inngest works here, it works for everything.

**What changed from PRODUCTION_PIPELINE.md:**

| Aspect | Before (April 5) | Now |
|---|---|---|
| Scope | CriteriaFilms.com production pipeline | criteria.agency Video Motor — serves any tenant |
| Organization | 9 Teams with ~47 agents | 6 executor agents + 3 transversal agents + skills |
| Orchestration | Narrative description | Inngest function with steps (DEC-140) |
| AI framework | Unspecified | Vercel AI SDK v6 (DEC-141) |
| Prompts | Not specified | prompt_registry (DEC-145) |
| Cost tracking | Not specified | Helicone proxy (DEC-147) |
| Model selection | Not specified | By creative leverage (DEC-174) + data tier (DEC-149) |
| Creative direction | Implicit in "Team 1" | Explicit Creative Director agent (DEC-175) |
| Quality gates | Showrunner as role | Showrunner as agent with 5 skills + Brand Guardian parallel evaluation |
| Script writing | 4 sub-agents (Writers Room) | 1 Writer agent with 4 skills |

**What is preserved:**

- The 10-step pipeline sequence (proven by domain expertise)
- The 5 gates and their central questions
- 8 script formats by project type
- Cost escalation principle: more demanding early, fewer iterations late
- G4 diagnostic protocol (shots/edit/audio/combined)
- G5 surgical fixes pattern
- Parallel work opportunities (soft dependencies)

---

## 2. Agent Map

### 2.1 Executor Agents (6)

| Agent | Model | Tier | Type | Skills |
|---|---|---|---|---|
| **Writer** | Sonnet | A | Agent with tools | Classification, Structure, Draft (×8 formats), Polish |
| **DP** (Director of Photography) | Sonnet | A | Agent with tools | Visual Look, Storyboard, Video Generation Prompting |
| **Visual Designer** | Sonnet | A | Agent with tools | Graphics, Typography, Compositing |
| **Audio Producer** | Sonnet | A | Agent with tools | Voice, Music, SFX, Foley, Mix |
| **Editor** | Sonnet | A | Agent with tools | Assembly, Rhythm, Color Grade, Subtitles, Delivery Formats |
| **Quality Reviewer** | Sonnet | A | Agent with tools | Technical QA, Accessibility, Compliance |

All executor agents are Tier A (DEC-149) because they consume Brand DNA (confidential data). Model is Sonnet (DEC-174) — execution agents where creative leverage is in the aggregate, not individual decisions.

### 2.2 Transversal Agents (3)

| Agent | Model | Tier | Role in Video Motor | Full spec |
|---|---|---|---|---|
| **Creative Director** | Opus | A | Produces Creative Direction before executors start. Revises direction on "rethink." | Transversal Agents §4 |
| **Showrunner** | Opus | A | Evaluates quality at all 5 gates. Three verdicts: advance/iterate/rethink. | Transversal Agents §5 |
| **Brand Guardian** | Sonnet | A | Evaluates brand consistency at gates (parallel with Showrunner). LLM function, not agent. | Transversal Agents §3 |

### 2.3 What Happened to the Old Teams

| Old Team | Old Agents | New mapping |
|---|---|---|
| Team 1 (Creative Development) | Creative Director, Researcher, Casting Director | **Creative Director** (transversal) — concept and direction. Research → CD tool. Casting → CD sub-task within Piece Direction. |
| Team 2 (Writers Room) | Head Writer, Structuralist, Specialist, Script Doctor | **Writer** agent with 4 skills: Classification, Structure, Draft, Polish |
| Team 3 (Cinematography) | DP, Colorist, Movement Director, Prompt Engineer, Continuity | **DP** agent with skills. Color → Editor (Color Grade skill). Prompt engineering → DP (Video Generation Prompting skill). Continuity → system function (frame comparison). |
| Team 4 (Art & Design) | Typographer, Compositor | **Visual Designer** agent with skills |
| Team 5 (Audio) | Sonorizador, Sound Designer, Foley Artist | **Audio Producer** agent with 5 skills |
| Team 6 (Post-production) | Editor, Post Colorist, Subtitler, Delivery Master | **Editor** agent with 4 skills |
| Team 7 (Client Experience) | PM, Feedback Interpreter | System functions + MARA (Fase 6). Client interaction through Client Portal. |
| Team 8 (Operations) | Producer, Cost Estimator | System functions (cost tracking via Helicone, scheduling via Inngest) |
| Team 9 (AI Model Intelligence) | Model Recommender | Absorbed into prompt_registry (DEC-145) — model per agent × skill configured in DB |
| Cross-functional | Showrunner, Critic, Brand Guardian, Compliance, Accessibility | **Showrunner** (transversal), **Brand Guardian** (transversal), **Quality Reviewer** (executor — technical QA, accessibility, compliance) |

---

## 3. Pipeline

### 3.1 Overview

```
BRIEF → [CD] → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL_LOOK → STORYBOARD → [G3] → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
```

The pipeline is a single Inngest function (`video-motor/pipeline`) with each step as an Inngest step. Gates are decision points within the function that can branch to iteration loops.

### 3.2 Inngest Function Structure

```
inngest.createFunction(
  { id: "video-motor-pipeline" },
  { event: "video-motor/pipeline.started" },
  async ({ event, step }) => {
    // Step 0: Validate event + verify tenant
    // Step 1: Brief intake
    // Step 2: Creative Direction (CD)
    // Step 3: Concept development
    // Gate 1: Concept evaluation
    // Step 4: Script (4 sub-steps)
    // Gate 2: Script evaluation
    // Step 5: Visual look
    // Step 6: Storyboard
    // Gate 3: Visual evaluation + client approval
    // Step 7: Video generation
    // Step 8: Editing
    // Step 9: Audio
    // Gate 4: Edit evaluation
    // Step 10: Polish
    // Gate 5: Final quality
    // Step 11: Delivery
  }
)
```

**Security per DEC-148:** Every Inngest function verifies webhook signature, validates event schema with Zod, and verifies tenantId against DB as the first step. No sensitive data in step state — only IDs and references.

### 3.3 Step-by-Step Pipeline

#### Step 1: Brief Intake

- **Who:** System function (no LLM)
- **Input:** Client brief (from Client Portal or from Strategist campaign brief)
- **What happens:** Validates brief completeness, stores in DB, creates project record, triggers pipeline
- **Output:** Validated brief with project ID
- **Inngest step:** `brief-intake`

#### Step 2: Creative Direction

- **Who:** Creative Director (Opus, Tier A) — Piece Direction skill
- **Input:** Brief + Brand DNA + Campaign Creative Direction (if exists)
- **What happens:** CD interprets the brief through the lens of Brand DNA and its Creative Philosophy. Produces a Creative Direction document that all downstream agents will follow.
- **Output:** Creative Direction (central concept, narrative tone, visual direction, audio direction, narrative structure, references)
- **Inngest step:** `creative-direction`
- **Context injected to all subsequent agents:** Brand DNA + Creative Direction

> This step is NEW relative to PRODUCTION_PIPELINE.md. Previously, concept development was done by "Team 1" without a structured creative direction. Now the CD produces a document that explicitly guides all executors.

#### Step 3: Concept Development

- **Who:** Creative Director (Opus, Tier A) — same invocation as Step 2, or as continuation
- **Input:** Brief + Brand DNA + Creative Direction (from Step 2)
- **What happens:** CD develops the concept: moodboard references (textual in MVP), project type classification, character definitions (if applicable), concept summary
- **Output:** Enriched brief, concept document, creative direction, character sheets (if applicable)
- **Inngest step:** `concept-development`

> **Design note:** Steps 2 and 3 can be a single CD invocation. They are conceptually separate (direction vs. concept) but the CD may produce both in one pass. Implementation can merge them into one Inngest step or keep them separate for observability. The key constraint: Creative Direction MUST exist before any executor agent is invoked.

#### Gate 1: Post-Concept

- **Central question:** "Is the vision clear, inspiring, and executable?"
- **Who evaluates:**
  - Showrunner — Concept Evaluation skill (Opus): evaluates clarity, emotional potential, feasibility, originality
  - Brand Guardian — Strategic Alignment Review skill (Sonnet): evaluates alignment with Brand DNA positioning and audiences
- **Parallel:** Both run simultaneously. Both must pass for pipeline to advance.
- **Inngest step:** `gate-1-concept`

**On Showrunner "iterate":** CD receives feedback, retries concept (3+3 rule counter starts).
**On Showrunner "rethink":** This early, "rethink" means the brief itself may be unclear. Escalate to human for brief clarification.
**On Brand Guardian "fail":** CD receives brand feedback, adjusts concept to align.

#### Step 4: Script Writing (4 sub-steps)

The SCRIPT phase is the most complex step. It decomposes into 4 sequential sub-steps, each a separate Inngest step for full observability.

**Step 4a — Classification**
- **Who:** Writer + Classification skill (can use Haiku for cost efficiency — this is mechanical, not creative)
- **Input:** Enriched brief + Creative Direction
- **What happens:** Determines script format (from 8 formats — see §4), target duration, delivery parameters, special requirements
- **Output:** Script parameters (format, duration, structure type)
- **Inngest step:** `script-classify`

**Step 4b — Structure**
- **Who:** Writer + Structure skill (Sonnet)
- **Input:** Script parameters + Creative Direction + Brief
- **What happens:** Produces beat sheet / narrative skeleton. Emotional arc, turning points, section timing. Follows the narrative structure defined in Creative Direction.
- **Output:** Beat sheet with timing
- **Inngest step:** `script-structure`

**Step 4c — Draft**
- **Who:** Writer + Draft skill, format-specific (Sonnet). The Draft skill loads the appropriate format template (one of 8 — see §4).
- **Input:** Beat sheet + Creative Direction + Brief + Brand DNA (for voice/tone)
- **What happens:** Writes the complete script in the correct format. Every word matters — Brand DNA voice guide is active context.
- **Output:** Complete draft script
- **Inngest step:** `script-draft`

**Step 4d — Polish**
- **Who:** Writer + Polish skill (Sonnet)
- **Input:** Draft script + Beat sheet + Creative Direction
- **What happens:** Self-review with script doctor lens. Evaluates structure, rhythm, clichés, coherence, timing. Rewrites weak sections. This is NOT the quality gate — this is internal polish before the script reaches the Showrunner.
- **Output:** Polished script ready for G2
- **Inngest step:** `script-polish`

**On G2 failure returning to SCRIPT:** The Showrunner's feedback identifies where the problem is:
- Structure problem → return to Step 4b (re-structure)
- Execution problem → return to Step 4c (re-draft with feedback)
- Minor issues → return to Step 4d (re-polish with feedback)

#### Gate 2: Post-Script

- **Central question:** "Does this script deserve to be produced? Does every second have purpose?"
- **Who evaluates:**
  - Showrunner — Script Evaluation skill (Opus): narrative structure, rhythm, hook, payoff, message clarity, CTA effectiveness, format/duration fit. **The bar is deliberately high** — producing a video is expensive in tokens. A mediocre script that passes G2 wastes the entire downstream pipeline.
  - Brand Guardian — Textual Voice Review skill (Sonnet): voice and tone, vocabulary, formality, brand personality
  - Creative Director — final sign-off (reads evaluation results, confirms creative alignment)
- **Inngest step:** `gate-2-script`

**On Showrunner "iterate":** Writer receives weaknesses + direction feedback, returns to appropriate sub-step. 3+3 rule applies to the SCRIPT phase as a whole (not per sub-step).
**On Showrunner "rethink":** Creative Direction itself doesn't work for this brief. Escalates to CD Skill 3 (Creative Revision). Writer receives new Creative Direction and returns to Step 4b.

> **Cost principle:** This is the most important gate in the pipeline. Rejecting at G2 saves ALL tokens for VIDEO_GEN + EDIT + AUDIO + POLISH + G3 + G4 + G5. The Showrunner should be MORE demanding here than anywhere else.

#### Step 5: Visual Look Definition

- **Who:** DP + Visual Look skill (Sonnet)
- **Input:** Script + Creative Direction + Brand DNA (visual system)
- **What happens:** DP proposes technical approach per shot: framing, composition, color temperature, lighting mood, camera movement intent. Defines the color palette for this piece (within Brand DNA's visual system but specific to this piece's emotional needs).
- **Output:** Shot list with visual specs, color palette, visual style document
- **Inngest step:** `visual-look`

#### Step 6: Storyboard Creation

- **Who:** DP + Storyboard skill (Sonnet) + Visual Designer (graphics/typography)
- **Input:** Shot list + Script + Creative Direction + Brand DNA
- **What happens:** DP generates visual previews for each shot (image generation). Visual Designer adds typography, graphic elements, and on-screen text. Each frame includes Audio and Visual text columns.
- **External API:** Image generation (Flux/Midjourney — abstracted behind interface)
- **Output:** Complete storyboard with visual previews + AV text per frame
- **Client portal:** Client sees storyboard and can comment per frame
- **Inngest step:** `storyboard`

#### Gate 3: Post-Storyboard

- **Central question:** "Do the proposed visuals serve the narrative?"
- **Who evaluates:**
  - Showrunner — Visual Evaluation skill (Opus): visual-narrative coherence, composition, visual rhythm, transitions
  - Brand Guardian — Visual Identity Review skill (Sonnet): color palette, typography, imagery style consistency
  - **Client approval** (in "human approves" mode): client reviews storyboard in portal and approves/rejects with comments
- **Inngest step:** `gate-3-storyboard`
- **Client approval Inngest pattern:** `step.waitForEvent('video-motor/client-approval', { timeout: '7d' })` — pipeline pauses until client responds or times out.

> **Last cheap correction point.** After G3, changes become expensive (video generation, editing, audio). The Showrunner and client should be thorough here.

#### Step 7: Video Generation

- **Who:** DP + Video Generation Prompting skill (Sonnet)
- **Input:** Approved storyboard + shot list + visual specs
- **What happens:** DP translates all specs into optimized prompts for the video generation model. Generates video clips per shot. System function verifies continuity between clips (frame comparison — no LLM needed for this).
- **External API:** Video generation (Runway/Kling/Sora/Veo — start with one, abstracted behind interface)
- **Output:** Generated video clips, placed in timeline order
- **Inngest step:** `video-generation`

> **Stub-first:** For MVP validation, video generation can use stub/mock implementations that return placeholder clips. The pipeline flow and gate logic are validated before real API integration.

#### Step 8: Editing

- **Who:** Editor + Assembly skill (Sonnet) + Visual Designer + Compositing skill
- **Input:** Video clips + Script (timing reference) + Creative Direction
- **What happens:** Editor assigns in-out points, assembles montage, defines rhythm and transitions. Visual Designer integrates graphics, VFX, text overlays. Editor can request shot re-generation from DP if clips don't work for the cut.
- **Output:** First cut (rough edit with all clips assembled)
- **Inngest step:** `editing`

#### Step 9: Audio and Sound

- **Who:** Audio Producer (Sonnet) — multiple skills invoked sequentially or partially in parallel
- **Input:** First cut video + Script + Creative Direction
- **Skills invoked:**
  - Voice skill: generates VO/narration via TTS
  - Music skill: composes or selects background music
  - SFX skill: creates editorial sound effects
  - Foley skill: analyzes video frame by frame, detects visual events, generates synchronized SFX
  - Mix skill: final audio mix, balancing all layers
- **External API:** ElevenLabs (or equivalent) for voice generation
- **Output:** Complete audio tracks (VO + music + SFX + foley + ambient) synced to video
- **Inngest step:** `audio` (or multiple sub-steps for observability: `audio-voice`, `audio-music`, `audio-sfx`, `audio-foley`, `audio-mix`)

#### Gate 4: First Cut

- **Central question:** "Is this watchable? Does it serve the brief?"
- **Who evaluates:**
  - Showrunner — Edit Evaluation skill (Opus): edit rhythm, transitions, continuity, audio-visual sync, pacing, hook effectiveness, CTA landing
  - Brand Guardian — Textual Voice Review (if VO) + Visual Identity Review: checks final composite maintains brand
  - Quality Reviewer — Technical QA skill (Sonnet): technical quality, encoding, sync issues, artifacts
- **Inngest step:** `gate-4-firstcut`

**G4 Diagnostic Protocol (preserved from PRODUCTION_PIPELINE.md):**

When G4 fails, the Showrunner diagnoses root cause:

1. **Shots problem** (composition, quality, continuity) → DP regenerates specific shots → Editor re-integrates
2. **Edit problem** (rhythm, pacing, transitions) → Editor re-edits with feedback. No new shots needed.
3. **Audio problem** (mix, VO, music mismatch) → Audio Producer adjusts. No visual changes.
4. **Combined** → Showrunner assigns priority order. Most impactful fix first.

The diagnostic routes to the specific agent, not "start over." The 3+3 rule applies per iteration of the gate, not per agent.

#### Step 10: Final Polish

- **Who:** Editor + Color Grade skill + Subtitles skill + Delivery Formats skill
- **Input:** Approved first cut
- **What happens:** Unifies color grading across all clips. Generates captions and translations. Prepares all format versions for target platforms (using channel specs from channel_registry if available).
- **Output:** Final graded video with subtitles in all required formats
- **Inngest step:** `polish`

#### Gate 5: Final Quality

- **Central question:** "Is this ready for delivery?"
- **Who evaluates:**
  - Showrunner — Final Quality skill (Opus): technical polish, overall quality, complete brief fulfillment. **This is the only Showrunner skill that also checks brand consistency** — as final verification before delivery.
  - Brand Guardian — Visual Identity Review + Textual Voice Review (final brand check)
  - Quality Reviewer — Accessibility skill (Sonnet): WCAG compliance, reading speed, flash rate, subtitle accuracy
  - Quality Reviewer — Compliance skill (Sonnet): legal/ethical checks, content policy (DEC-167)
- **Inngest step:** `gate-5-final`

**G5 failures are surgical (preserved from PRODUCTION_PIPELINE.md).** Never "start over." The Showrunner identifies the specific issue and routes to the exact agent + skill:
- Color inconsistency → Editor + Color Grade skill
- Subtitle timing → Editor + Subtitles skill
- Brand violation → Brand Guardian provides fix_guidance, relevant executor retries
- Accessibility issue → Quality Reviewer flags, relevant executor fixes

#### Step 11: Delivery

- **Who:** System function (no LLM)
- **What happens:** Video published to client portal (via Bunny Stream for delivery). Project status updated. Output indexed in Output Registry (DEC-130) with summary embeddings. Notification sent to client.
- **Output:** Delivered video in all formats, project closed
- **Inngest step:** `delivery`

---

## 4. Script Formats (8)

Preserved from PRODUCTION_PIPELINE.md — these represent real production knowledge.

| # | Format | Used for | Writer Draft skill variant |
|---|---|---|---|
| 1 | Two-column AV script | Corporate, explainer, institutional, tutorial | `draft-av` |
| 2 | Master scene script (cinema) | Short films, series, fiction | `draft-master-scene` |
| 3 | Step outline / treatment | Documentary, fiction, long format | `draft-treatment` |
| 4 | Narration with visual notes | Social media, video essay, brand storytelling | `draft-narration` |
| 5 | Dialogue / interview script | Testimonial, interview, talking head | `draft-dialogue` |
| 6 | Micro-content script | TikTok, Reels, Shorts, ads (15-60s) | `draft-micro` |
| 7 | Interactive / branching script | E-learning, interactive, gamified | `draft-interactive` |
| 8 | Bible / narrative pitch deck | Series, feature, pitch | `draft-bible` |

The Writer's Classification skill (Step 4a) determines which format applies. The Draft skill loads the appropriate format template from prompt_registry.

**Special cases (preserved):**

- **Client has a script:** Writer + Classification skill evaluates producibility. Writer + Polish skill adapts to correct format if needed. Feeds into G2 normally.
- **Client has only an idea/narration:** Writer + Structure skill extracts core message, proposes 2-3 narrative approaches (via MARA to client for selection in Fase 6, or admin selects). Then normal pipeline from Step 4b.

---

## 5. Gate Architecture

### 5.1 Parallel Evaluation Matrix

At each gate, Brand Guardian and Showrunner are invoked **in parallel** (separate Inngest steps that can run concurrently via `step.run` in parallel). Their evaluations are orthogonal:

| Brand Guardian | Showrunner | Combined meaning | Action |
|---|---|---|---|
| Pass | Advance | On-brand AND good quality | Proceed to next step |
| Pass | Iterate | On-brand but weak execution | Executor retries with Showrunner feedback |
| Pass | Rethink | On-brand but wrong creative direction | CD revises direction (Skill 3) |
| Warning | Advance | Genericbut quality → proceed with brand warning logged | |
| Fail | Advance | Good quality but off-brand | Executor retries with Brand Guardian fix_guidance |
| Fail | Iterate | Off-brand AND weak | Executor retries with both feedback |
| Fail | Rethink | Off-brand AND wrong direction | CD revises with brand feedback |

Both must be non-fail for the pipeline to advance.

### 5.2 Gate Summary

| Gate | After | Central question | Cost if fails | Max 3+3 iterations |
|---|---|---|---|---|
| G1 | Concept | Is the vision clear, inspiring, and executable? | Minimal | 6 |
| G2 | Script | Does this script deserve to be produced? | Low | 6 |
| G3 | Storyboard | Do the visuals serve the narrative? | Medium | 4 (fewer because image gen costs) |
| G4 | First cut | Is this watchable? Does it serve the brief? | High | 4 |
| G5 | Final | Is this ready for delivery? | Maximum | 2 (surgical fixes only) |

**Cost escalation principle (preserved):** Max iterations decrease as cost increases. The Showrunner is MORE demanding in early gates because corrections are cheap. It is far better to iterate 6 times on a script (only LLM tokens) than 4 times on video generation (LLM tokens + external API costs).

### 5.3 The 3+3 Rule in Multi-Agent Context

The 3+3 rule (3 normal attempts → 3 with leader adjustment → human escalation) applies per gate, not per agent.

**Attempts 1-3 (normal):** The executor agent that produced the failing artifact retries with feedback from Showrunner/Brand Guardian injected as `upstream_feedback` in its context.

**Attempts 4-6 (leader adjustment):** The "leader" in the Video Motor is the Creative Director. On attempt 4, the CD is re-invoked with Creative Revision skill (Skill 3) to produce an adjusted Creative Direction. Executor agents then retry under the new direction. This addresses situations where the problem is not execution quality but the creative direction itself.

**After attempt 6:** Human escalation. The project is flagged in the Admin Portal Gate Review queue (BUILD_ORDER Fase 5). The admin (founder in MVP) reviews and provides direction.

**Counter scope:** The counter tracks attempts per gate, not cumulative across the pipeline. Passing G2 after 3 attempts does not affect the counter at G3.

---

## 6. Agent Details

### 6.1 Writer Agent

**Identity:** Agent with tools. The narrative engine of the Video Motor.

**Model:** Sonnet, Tier A (DEC-149, DEC-174). Execution agent — creative leverage is significant but contained by the Creative Direction from the CD.

**Skills:**

| Skill | Purpose | Model override |
|---|---|---|
| Classification | Determine format, duration, parameters | Haiku (mechanical task) |
| Structure | Beat sheet, emotional arc, turning points | Sonnet |
| Draft (×8 formats) | Write complete script in correct format | Sonnet |
| Polish | Self-review with script doctor lens | Sonnet |

**Tools:**
- Read Brief — access the project brief
- Read Creative Direction — access the CD's creative direction
- Read Brand DNA — access brand voice/tone sections
- Read Beat Sheet — access the structure (for Draft and Polish skills)
- Update Script — write/update the script artifact

**prompt_registry entries:** One entry per skill. `agent: writer`, `skill: classification | structure | draft-av | draft-master-scene | ... | polish`.

### 6.2 DP (Director of Photography) Agent

**Identity:** Agent with tools. The visual engine.

**Skills:**

| Skill | Purpose |
|---|---|
| Visual Look | Technical approach per shot: framing, composition, color, lighting, movement |
| Storyboard | Generate visual previews for each shot (image generation prompting) |
| Video Generation Prompting | Translate all specs into optimized prompts for video generation API |

**Tools:**
- Read Script — access the approved script
- Read Creative Direction — access visual direction
- Read Brand DNA — access visual system
- Generate Image — invoke image generation API (Flux/Midjourney)
- Generate Video — invoke video generation API (Runway/Kling/Sora/Veo)
- Update Shot List — write/update visual specs
- Read Storyboard Feedback — access client/gate comments on specific frames

### 6.3 Visual Designer Agent

**Identity:** Agent with tools. Graphics, typography, compositing.

**Skills:**

| Skill | Purpose |
|---|---|
| Graphics | On-screen text, lower thirds, title cards, graphic elements |
| Typography | Font selection and text layout within brand visual system |
| Compositing | Integration of graphics, VFX, text overlays into video |

**Tools:**
- Read Brand DNA — visual identity section
- Read Creative Direction — visual direction
- Read Script — for text/graphic content
- Generate Image — for graphic elements
- Update Timeline — add graphic layers to edit

### 6.4 Audio Producer Agent

**Identity:** Agent with tools. The complete audio pipeline.

**Skills:**

| Skill | Purpose |
|---|---|
| Voice | Generate VO/narration via TTS API. Direction: pace, emotion, emphasis. |
| Music | Compose or select background music. Mood, tempo, instrumentation aligned with Creative Direction audio direction. |
| SFX | Editorial sound effects — transitions, emphasis, emotional punctuation |
| Foley | Frame-by-frame video analysis → synchronized environmental sounds |
| Mix | Final audio mix — balance VO, music, SFX, foley, ambient layers |

**Tools:**
- Read Script — for VO content and timing
- Read Creative Direction — audio direction
- Read Video — access current video cut for sync
- Generate Voice — invoke TTS API (ElevenLabs)
- Generate Music — invoke music generation API (or select from library)
- Update Audio Tracks — write audio layers

### 6.5 Editor Agent

**Identity:** Agent with tools. Assembly, rhythm, and post-production.

**Skills:**

| Skill | Purpose |
|---|---|
| Assembly | In-out points, montage, transitions, rhythm |
| Rhythm | Pacing analysis and adjustment — cuts per minute, breathing space, tension build |
| Color Grade | Unified color grading across all clips within Brand DNA palette |
| Subtitles | Caption generation, translation, timing |
| Delivery Formats | Multi-format export for target platforms |

**Tools:**
- Read Script — timing reference
- Read Creative Direction — rhythm/pacing guidance
- Read Shot List — per-shot specs
- Read Video Clips — access generated clips
- Read Audio — access audio tracks for sync
- Update Timeline — edit operations
- Request Reshoot — flag specific shots for DP to regenerate

### 6.6 Quality Reviewer Agent

**Identity:** Agent with tools. Technical QA, accessibility, and compliance. This agent absorbs the cross-functional checking roles (Critic, Compliance, Accessibility) from the old PRODUCTION_PIPELINE.md.

**Skills:**

| Skill | Purpose |
|---|---|
| Technical QA | Encoding quality, resolution, sync, artifacts, format compliance |
| Accessibility | WCAG: reading speed, flash rate, subtitle accuracy, color contrast |
| Compliance | Content policy (DEC-167), legal disclaimers, platform-specific rules |

**Tools:**
- Read Video — access current video
- Read Audio — access audio tracks
- Read Subtitles — access subtitle file
- Read Brand DNA — for compliance context
- Flag Issue — create structured issue report for specific agent

---

## 7. Artifact Storage

All artifacts stored on Cloudflare R2 with tenant isolation.

**Path structure:** `{tenantId}/projects/{projectId}/{step}/`

| Step | Artifacts | Path |
|---|---|---|
| Brief | Raw brief, reference files | `.../brief/` |
| Creative Direction | Creative direction document | `.../creative-direction/` |
| Concept | Concept doc, moodboard refs, character sheets | `.../concept/` |
| G1 | Gate evaluation results (Showrunner + Brand Guardian JSON) | `.../gates/g1/` |
| Script | Beat sheet, draft versions, final script | `.../script/` |
| G2 | Gate evaluation results + CD sign-off | `.../gates/g2/` |
| Visual Look | Shot list, color palette, visual style doc | `.../visual/` |
| Storyboard | Generated images, AV text per frame | `.../storyboard/` |
| G3 | Gate results + client approval record | `.../gates/g3/` |
| Video Gen | Generated clips, prompt logs | `.../clips/` |
| Edit | Timeline data, first cut video | `.../edit/` |
| Audio | VO, music, SFX, foley, ambient, final mix | `.../audio/` |
| G4 | Gate results + diagnostic | `.../gates/g4/` |
| Polish | Graded video, subtitles, multi-format package | `.../polish/` |
| G5 | Gate results + QA report + compliance report | `.../gates/g5/` |
| Delivery | Final multi-format package | `.../delivery/` |

**Versioning:** Each iteration (3+3 rule) creates a new version within the step folder. Previous versions retained for comparison and audit. Version naming: `v{attempt_number}`.

**Output Registry integration (DEC-130):** On delivery, key artifacts are indexed in the Output Registry with summary embeddings: final video, script, creative direction, storyboard. This enables MARA (Fase 6) to find and reference previous work.

---

## 8. External API Integrations

All external APIs are abstracted behind interfaces to enable swapping providers.

| Capability | Provider(s) | Used in steps | MVP approach |
|---|---|---|---|
| Image generation | Flux, Midjourney | Storyboard (Step 6) | Start with one. Abstract behind `ImageGenerator` interface. |
| Video generation | Runway, Kling, Sora, Veo | Video Gen (Step 7) | Start with one. Abstract behind `VideoGenerator` interface. Stub first. |
| Voice / TTS | ElevenLabs | Audio (Step 9) | Abstract behind `VoiceGenerator` interface. |
| Music generation | TBD (Suno, Udio, or library) | Audio (Step 9) | Abstract behind `MusicGenerator` interface. Can start with royalty-free library. |
| Video delivery | Bunny Stream | Delivery (Step 11) | Direct integration for client-facing video playback. |

**Stub-first strategy:** For Fase 2 validation, all external APIs can return mock/placeholder outputs. The purpose of Fase 2 is to validate the orchestration (Inngest pipeline + gates + 3+3 rule + agent invocations), not the visual quality of generated content. Real API integration can be swapped in incrementally.

**Cost tracking:** Every external API call is logged with cost (or estimated cost). Helicone tracks LLM costs (DEC-147). A separate `external_api_costs` table tracks non-LLM API costs (image gen, video gen, TTS). Both feed into the project's total cost calculation.

---

## 9. Configurable Autonomy

Per DEC from Marketing Engine Design §3:

| Mode | AI can do automatically | Requires human approval |
|---|---|---|
| **AI decides + human supervises** | Pass gates (except G3 which always offers client review), iterate within 3+3 rule, choose creative variants | Human escalation after 3+3, G3 client approval, budget overruns |
| **AI recommends + human approves** | Nothing — all gates generate recommendations | Every gate requires explicit human approval before pipeline advances |

**Gate-level enforcement:**
- In "AI decides" mode: gates evaluate and advance/iterate automatically. Admin sees progress in real-time via SSE.
- In "AI recommends" mode: every gate result is queued in Admin Portal Gate Review (Fase 5). Pipeline pauses (`step.waitForEvent`) until admin approves.
- G3 (storyboard) always includes client approval opportunity regardless of mode — this is the last visual checkpoint before expensive generation.

**Configuration:** Stored per tenant in `motor_settings` table. Can be set globally or per project.

---

## 10. Token Economics

### 10.1 Estimated Token Consumption Per Video

These are rough estimates for a typical 1-3 minute corporate/explainer video with normal gate passage (1-2 iterations max).

| Component | Input tokens | Output tokens | Model | Invocations | Est. total |
|---|---|---|---|---|---|
| Creative Director | ~4K | ~1.2K | Opus | 1-2 | ~5-10K |
| Writer (all sub-steps) | ~6K | ~3K | Sonnet (+ Haiku for classify) | 4-6 | ~24-54K |
| Showrunner (5 gates) | ~5K | ~0.6K | Opus | 5-8 | ~25-45K |
| Brand Guardian (3-5 gates) | ~5K | ~0.3K | Sonnet | 3-6 | ~15-32K |
| DP | ~4K | ~2K | Sonnet | 3-5 | ~12-30K |
| Visual Designer | ~3K | ~1K | Sonnet | 2-4 | ~6-16K |
| Audio Producer | ~4K | ~1.5K | Sonnet | 5-7 | ~20-39K |
| Editor | ~4K | ~1.5K | Sonnet | 3-5 | ~12-28K |
| Quality Reviewer | ~3K | ~0.5K | Sonnet | 2-4 | ~6-14K |
| **Total LLM tokens** | | | | | **~125K-268K** |

**External API costs** (video gen, image gen, TTS) are separate and significantly more expensive per unit than LLM tokens. These vary by provider and are tracked independently.

**Worst case (3+3 on multiple gates):** ~3-4× the normal estimate. This is why the demanding Showrunner at G2 saves money — rejecting a bad script prevents all downstream token and API spend.

### 10.2 Token Budget Per Plan

From Business Model Design:
- Starter ($99): ~$250 token budget → ~1-2 simple videos/month
- Pro ($249): ~$700 token budget → ~3-5 videos/month
- Agency ($599): ~$2,000 token budget → ~8-15 videos/month

These are illustrative. Actual limits depend on final token pricing and external API cost negotiation.

---

## 11. Parallel Work Opportunities

Some steps have soft dependencies and can start with partial information:

| Step | Can start as early as | Starts with | Refines after |
|---|---|---|---|
| Audio direction/sonic palette | G2 (script approved) | Script tone + Creative Direction audio direction | Adjusts after seeing generated video |
| Graphic templates | G2 (script approved) | Brand visual system + Creative Direction visual direction | Refines after storyboard shows context |
| Color palette definition | G1 (concept approved) | Brand DNA + Creative Direction | Per-scene adjustment after script exists |

**Inngest implementation:** These parallel work items are separate Inngest steps that can run concurrently with the main pipeline. They produce artifacts that downstream steps consume but are not blocking — downstream steps can proceed with defaults if parallel work isn't complete.

---

## 12. Client Feedback Flow

Preserved from PRODUCTION_PIPELINE.md, updated for new architecture:

1. Client sees deliverable in Client Portal (storyboard at G3, final video at delivery)
2. Client adds comments on specific elements (per-frame on storyboard, per-timestamp on video)
3. Comments stored as structured feedback in project DB
4. In MVP: Admin reviews comments in Admin Portal, translates to actionable instructions, routes to pipeline
5. In Fase 6 (MARA): MARA can help interpret vague feedback into actionable instructions
6. Pipeline re-enters at appropriate step with feedback as upstream context
7. Updated deliverable published to Client Portal

**Commentable elements in Client Portal:**
- Storyboard: per-frame comments
- Final video: per-timestamp comments
- Script: per-section comments (if client has script review access in their plan)

---

## 13. Estimated Time Ranges

Preserved from PRODUCTION_PIPELINE.md. These are AI processing time ranges, not calendar time (which adds client feedback waits).

| Project type | Duration | Pre-prod (Brief→G2) | Production (G2→G4) | Post (G4→Delivery) | Total (AI time) | Total (with client) |
|---|---|---|---|---|---|---|
| Corporate / Explainer | 1-3 min | 4-8h | 9-18h | 2-4h | 15-30h | 3-7 days |
| Social micro-content | 15-60s | 2-4h | 3-6h | 1-2h | 6-12h | 1-3 days |
| Documentary / Short film | 5-15 min | 8-16h | 18-36h | 4-8h | 30-60h | 7-14 days |
| Complex commercial | High value | 6-12h | 14-28h | 4-8h | 24-48h | 5-10 days |

> These will be refined as real production data accumulates. The Inngest dashboard provides actual step-by-step timing for each project.

---

## 14. New Tables Required

Beyond the tables already defined in other specs:

| Table | Purpose | Created in |
|---|---|---|
| `video_projects` | Project metadata: tenant, status, current step, project type, brief reference | Fase 2 |
| `video_artifacts` | Artifact registry: project, step, version, R2 path, type, metadata | Fase 2 |
| `video_gate_results` | Gate evaluation results: project, gate, showrunner verdict, brand guardian verdict, attempt number, feedback | Fase 2 |
| `video_iteration_tracking` | 3+3 rule state: project, gate, attempt count, leader adjustment flag, escalation status | Fase 2 |
| `external_api_costs` | Non-LLM API cost tracking: project, provider, operation, cost, timestamp | Fase 2 |

Tables from other specs that the Video Motor uses:
- `prompt_registry` (DEC-145) — all agent × skill prompts
- `output_registry` (DEC-130) — delivered outputs with embeddings
- `creative_references` (Transversal Agents §9) — CD reference corpus
- `financial_tracking` (Transversal Agents §9) — token cost aggregation
- `motor_settings` — autonomy configuration per tenant

---

## 15. Relationship to BUILD_ORDER Fase 2

This spec provides the authoritative design for BUILD_ORDER Fase 2. The BUILD_ORDER's Fase 2 section lists 7 implementation components:

| BUILD_ORDER component | This spec section |
|---|---|
| 1. Pipeline as Inngest function | §3 (Pipeline), §3.2 (Inngest structure) |
| 2. 6 agents on Vercel AI SDK | §2 (Agent Map), §6 (Agent Details) |
| 3. 3+3 rule implementation | §5.3 (3+3 Rule in Multi-Agent Context) |
| 4. Gate router | §5 (Gate Architecture) |
| 5. Artifact storage on R2 | §7 (Artifact Storage) |
| 6. External API integrations | §8 (External API Integrations) |
| 7. Configurable autonomy | §9 (Configurable Autonomy) |

---

## 16. Decisions Summary

| Decision | Reference | Impact on Video Motor |
|---|---|---|
| DEC-064 | Agent vs Skill vs System Function | 6 executor agents + skills, not 47. Writers Room → 1 Writer + 4 skills. |
| DEC-140 | Inngest for orchestration | Pipeline is one Inngest function. Each step is an Inngest step. |
| DEC-141 | Vercel AI SDK v6 | Agents use agent-with-tools pattern. Brand Guardian uses generateText(). |
| DEC-145 | Prompt Registry | All agent prompts loaded from DB. Format-specific Draft skills are separate entries. |
| DEC-147 | Helicone | All LLM calls proxied for cost/latency tracking. |
| DEC-148 | Inngest security | Webhook verification, Zod schema validation, tenant verification on every function. |
| DEC-149 | Multi-model tiers | All Video Motor agents are Tier A (Brand DNA = confidential). |
| DEC-174 | Model by creative leverage | CD and Showrunner = Opus. Executors = Sonnet. Writer classify = Haiku. |
| DEC-175 | CD as clonable asset | Creative Philosophy configurable per CD instance. |
| DEC-176 | CD training | Post-MVP: portfolio/reel ingestion. MVP: text-based philosophy. |
| DEC-177 | CD marketplace economics | Free CDs included, Premium unlocked by plan, Custom allowed per plan tier. |
