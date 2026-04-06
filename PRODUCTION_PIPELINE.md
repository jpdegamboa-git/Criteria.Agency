# CriteriaFilms.com — Production pipeline

> Last updated: April 5, 2026
> Pipeline steps: 10 | Showrunner gates: 5 | Script formats: 8

---

## Complete pipeline overview

```
1. Client brief ──→ GATE 1 ──→ 2. Concept
3. Script ──→ GATE 2 ──→ 4. Visual look
5. Storyboard ──→ GATE 3 ──→ 6. Video generation
7. Edit ──→ 8. Audio ──→ GATE 4 ──→ 9. Final polish ──→ GATE 5 ──→ 10. Delivery
```

---

## Step-by-step pipeline

### Step 1: Client creates brief

- **Teams involved:** Team 7 (client service) + Team 1 (creative director)
- **What happens:** The client describes their need, guided by the creative director agent who proposes ideas and guides them. The client can upload reference files to a temporary drive (15-day retention).
- **Output:** Raw client brief with reference materials
- **Client portal:** Brief creation interface with AI guidance

### Step 2: Analysis and concept

- **Teams involved:** Team 1 (creative development)
- **What happens:** The researcher enriches the brief with competitive analysis, audience profile, and visual trends. The creative director analyzes the project, identifies project type (corporate, explainer, fiction, documentary), and proposes a general concept. The casting director defines characters if applicable.
- **Output:** Enriched brief, approved concept, creative direction, character sheets

### GATE 1: Post-concept (Showrunner)

- **Question:** "Is the vision clear, inspiring, and executable?"
- **Action:** Showrunner generates the project bible with vision, tone, rules, and central question.
- **If rejected:** Returns to team 1 for concept revision.
- **Correction cost:** Minimal.

### Step 3: Script writing

- **Teams involved:** Team 2 (writers room)
- **What happens:** Head writer classifies project type and assigns format. Structuralist creates skeleton (beat sheet). Specialist writes draft in correct format. Script doctor reviews. Iteration 2-3 times if needed. Head writer approves internally.
- **Output:** Production-ready script in appropriate format
- **Internal pipeline:** See "Writers room internal pipeline" section below.

### GATE 2: Post-script (Showrunner)

- **Question:** "Does this script deserve to be produced? Does every second have purpose?"
- **Additional approval:** Creative director gives final sign-off.
- **If rejected:** Returns to team 2 with specific notes.
- **Correction cost:** Low.

> **Team 9 (AI Model Intelligence) input:** After G1 produces the project bible, Team 9 reviews the project type, style, and tone to recommend specific AI models for each task type (video generation, image generation, audio, etc.). These recommendations are consumed by Teams 3, 5, and 6 during production. This is a soft dependency — teams can start with default model configurations if Team 9 hasn't completed its analysis yet, and Team 9 refines its recommendations further once shot-level requirements are defined.

### Step 4: Visual look definition

- **Teams involved:** Team 3 (cinematography) + Producer
- **What happens:** DP proposes technical approach per shot (framing, lens, light, color temperature, composition). Colorist defines color palette. Movement director plans camera movement. Producer creates complete script breakdown (characters, locations, props, makeup, graphics). Producer creates images for each asset, validated by creative director for style consistency.
- **Output:** Shot list with technical specs, color palette, breakdown, asset images

### Step 5: Storyboard creation

- **Teams involved:** Team 3 (cinematography) + Team 4 (art & design)
- **What happens:** DP generates visual previews for each shot. Typographer defines on-screen text elements. Continuity supervisor verifies coherence. The previews become the storyboard images the client sees in their portal, accompanied by Audio and Visual text columns with their respective icons.
- **Output:** Complete storyboard with visual previews + AV text
- **Client portal:** Client sees storyboard and can comment on each element.

### GATE 3: Post-storyboard (Showrunner)

- **Question:** "Do the proposed visuals serve the narrative? Does the visual rhythm work?"
- **Client approval:** Client also approves in their portal (or admin approves on their behalf).
- **If rejected:** Returns to teams 3/4 with specific notes.
- **Correction cost:** Medium. This is the last cheap point to correct.

### Step 6: Video generation

- **Teams involved:** Team 3 (cinematography)
- **What happens:** The prompt engineer translates all specs into optimized prompts. The DP and creative director generate video clips using the indicated AI model for each shot. The continuity supervisor verifies raccord between clips. Each generated clip is automatically placed in the editing timeline at its corresponding position.
- **Output:** Generated video clips placed in timeline

### Step 7: Editing

- **Teams involved:** Team 6 (post-production) + Team 4 (art & design)
- **What happens:** Editor assigns in-out points for each clip, assembles the montage. Compositor integrates graphics, VFX, and text overlays. Editor can request shot re-generation from team 3 if clips don't work for the cut.
- **Output:** First cut (rough edit with all clips assembled)

### Step 8: Audio and sound

- **Teams involved:** Team 5 (audio)
- **What happens:** Sonorizador generates missing voices (VO/narration), composes or selects background music, creates editorial SFX. Sound designer creates ambient layers and spatial audio. Foley artist analyzes the video frame by frame, detects visual events, generates synchronized SFX. Final audio mix.
- **Output:** Complete audio tracks (VO + music + SFX + ambience + foley) synced to video

### GATE 4: First cut (Showrunner)

- **Question:** "Does the film work? Is the emotion there?"
- **Evaluates:** Narrative + emotion + global coherence of video + audio together.
- **Cross-functional check:** Critic provides per-shot and global scores.
- **If rejected:** Identifies specific issues and which team must fix them.
- **Correction cost:** High. Changes after this point are expensive.

### Step 9: Final polish

- **Teams involved:** Team 6 (post-production)
- **What happens:** Post colorist unifies color grading across all clips. Subtitler generates captions and translations. Delivery master prepares all format versions.
- **Output:** Final graded video with subtitles in all required formats

### GATE 5: Final cut (Showrunner)

- **Question:** "Am I proud to deliver this with the CriteriaFilms name?"
- **Cross-functional checks:** Critic (final score), compliance (legal/ethical), brand guardian (brand alignment), accessibility (WCAG, reading speed, flash rate).
- **If rejected:** Identifies exactly what's missing and which team fixes it.
- **Correction cost:** Maximum if it fails here.

### Step 10: Client delivery

- **Teams involved:** Team 7 (client experience) + Team 6 (delivery master)
- **What happens:** Video is published to the client portal. Client reviews and can comment on the final video. Feedback interpreter translates client notes into actionable instructions. Corrections if necessary. Final client approval.
- **Output:** Approved video delivered in all required formats
- **Client portal:** Video player with commenting capability per timestamp.

---

## The 5 showrunner gates

| Gate | Name | When | Question | Cost if it fails |
|------|------|------|----------|-----------------|
| G1 | Post-concept | After team 1 finishes | Is the vision clear? | Minimal |
| G2 | Post-script | After team 2 finishes | Does every second have purpose? | Low |
| G3 | Post-storyboard | After teams 3+4 finish | Do visuals serve narrative? | Medium |
| G4 | First cut | After teams 5+6 finish | Does the film work emotionally? | High |
| G5 | Final cut | After final polish | Am I proud to deliver this? | Maximum |

**Key insight:** The showrunner is more demanding in early gates because corrections are cheap. It's better to return a script 3 times than to re-generate 40 shots.

---

## Iteration loops when gates fail

Each gate failure triggers a specific iteration loop. The key principle: **catch problems early and fix them cheaply.**

| Gate | On failure | Returns to | What gets reworked | Max iterations | Escalation |
|------|-----------|------------|-------------------|----------------|------------|
| G1 | Concept not clear or executable | Team 1 (Creative Development) | Concept, moodboard, creative direction | 3 | Human creative director |
| G2 | Script doesn't deserve production | Team 2 (Writers Room) | Script draft → script doctor → rewrite | 3 | Human writer |
| G3 | Visuals don't serve narrative | Teams 3 + 4 (Cinematography + Art) | Storyboard previews, shot specs | 2 | Human DP / art director |
| G4 | Film doesn't work emotionally | Diagnostic — see below | Depends on diagnosis | 2 | Human editor + showrunner |
| G5 | Not proud to deliver | Targeted fixes only | Specific shots, audio, or graphics | 1 | Human expert (role depends on issue) |

### G4 diagnostic protocol

When G4 (first cut) fails, the showrunner diagnoses the root cause:

1. **Shots problem** (composition, quality, continuity) → Team 3 regenerates specific shots. Editor re-integrates.
2. **Edit problem** (rhythm, pacing, transitions) → Team 6 re-edits with showrunner notes. No new shots needed.
3. **Audio problem** (mix, VO, music mismatch) → Team 5 adjusts. No visual changes.
4. **Combined** → Showrunner assigns priority order. Most impactful fix first.

### G5 surgical fixes

G5 failures are never "start over." The showrunner identifies the specific issue and routes to the exact agent:
- Color inconsistency → T6-001 (post colorist)
- Subtitle timing → T6-002 (subtitler)
- Brand violation → flag from XF-003, fix by relevant team
- Accessibility issue → flag from XF-004, fix by relevant team

**Cost escalation principle:** Max iterations decrease as cost increases. It's better to iterate 3 times on a script (cheap) than 2 times on video generation (expensive). This is why the showrunner is MORE demanding in early gates.

---

## Writers room internal pipeline

### Standard flow (client has no script)

1. **Enriched brief arrives from team 1.** Head writer receives concept, project type, audience, duration, tone, key messages, references.
2. **Head writer classifies and assigns.** Determines script format, activates correct specialist, defines delivery parameters.
3. **Structuralist creates skeleton.** Beat sheet, emotional arc, turning points, section timing. Head writer approves structure.
4. **Specialist writes first draft.** With approved structure, the assigned sub-agent writes the complete script in the correct format.
5. **Script doctor reviews.** Evaluates structure, rhythm, coherence, clichés, timing. Generates improvement report.
6. **Specialist rewrites.** Applies corrections. Can iterate 2-3 times between steps 5 and 6.
7. **Head writer approves.** Reads final script, verifies it meets brief, tone, and quality standard.
8. **Creative director gives sign-off.** As team 1 defined the creative north, the creative director has final sign-off on the script.

### Special case: Client already has a script

1. Head writer evaluates the client's script — determines if it's producible as-is, needs adjustments, or needs significant rewrite.
2. Script doctor analyzes — generates quality report with suggestions. This report is shared with the client via team 7, with tact.
3. Conversion to correct format — if the script isn't in AV or master scene format, the appropriate specialist converts it.

### Special case: Client only has an idea or narration

1. Structuralist extracts the core — identifies central message, audience, desired action.
2. Head writer proposes 2-3 approaches — different narrative angles for the same story. Client chooses via team 7.
3. Normal pipeline from step 3 — structure, draft, revision, approval.

---

## 8 Script formats by project type

### 1. Two-column AV script (audiovisual)

Core format for corporate and explainer videos. Left column = AUDIO (narration, dialogue, music, SFX). Right column = VIDEO (description of each visual). Each row = one shot or moment.

**Used for:** Corporate, explainer, institutional, tutorial.

### 2. Master scene script (cinema format)

Industry-standard film format. Scene heading (INT/EXT, location, time), descriptive action, dialogue with character name. 1 page ≈ 1 minute of film.

**Used for:** Short films, features, series, fiction.

### 3. Step outline / treatment

Intermediate step between idea and complete script. Describes scene by scene what happens without writing dialogue. Useful for approving structure before investing in full writing.

**Used for:** Documentary, fiction, any long format.

### 4. Narration script with visual notes

Audio column only (linear narration) with visual indications in brackets. More agile than two-column AV. Ideal for videos where voice guides and visuals accompany.

**Used for:** Social media, video essay, brand storytelling.

### 5. Dialogue / interview script

For person-on-camera videos: testimonials, interviews, talking heads. Defines guide questions, key points to cover, and target times per topic.

**Used for:** Testimonial, interview, talking head.

### 6. Micro-content script

15-60 second videos for social media. Ultra-compressed structure: hook (1-3s), content (10-45s), CTA (3-5s). Every word counts. Every frame counts.

**Used for:** TikTok, Reels, Shorts, ads.

### 7. Interactive / branching script

For videos with viewer decisions or adaptable content. Defines decision nodes, multiple narrative paths, and activation conditions.

**Used for:** E-learning, interactive, gamified.

### 8. Bible / narrative pitch deck

Not a production script but a sales document: synopsis, characters, tone, visual references, episodes. For selling a series or film before producing it.

**Used for:** Series, feature, pitch.

---

## Client feedback flow

1. Client sees deliverable in their portal (storyboard, video, etc.)
2. Client adds comments on specific elements (script, breakdown, style, schedule, storyboard, video)
3. Comments arrive at the project in admin portal
4. Team 7 feedback interpreter translates vague feedback into actionable instructions
5. PM routes instructions to the correct team
6. Team makes corrections
7. Updated deliverable is published to client portal
8. Client reviews again

**Commentable elements in client portal:** Script, breakdown, style, schedule, storyboard, final video.

---

## Estimated time ranges by project type

These are ranges, not commitments. Actual times depend on iteration count, client response time, and project complexity.

### Corporate / Explainer (1-3 minutes)

| Phase | Steps | Estimated time | Notes |
|-------|-------|---------------|-------|
| Pre-production | Brief → G2 (concept + script) | 4-8 hours | Fastest phase — mostly LLM work |
| Production | G2 → G3 (visual look + storyboard) | 3-6 hours | Image generation is fast, iteration takes time |
| Generation | G3 → G4 (video gen + edit + audio) | 6-12 hours | Most variable — depends on shot count and complexity |
| Post | G4 → G5 (polish + delivery) | 2-4 hours | Grading, subtitles, multi-format export |
| **Total (no client feedback waits)** | | **15-30 hours** | AI processing time only |
| **Total (with client feedback)** | | **3-7 calendar days** | Client response adds 1-2 days per review point |

### Social media micro-content (15-60 seconds)

| Phase | Steps | Estimated time | Notes |
|-------|-------|---------------|-------|
| Pre-production | Brief → G2 | 2-4 hours | Simplified brief, micro-content script |
| Production + Generation | G2 → G4 | 3-6 hours | Fewer shots, simpler pipeline |
| Post | G4 → Delivery | 1-2 hours | Often single format |
| **Total** | | **6-12 hours / 1-3 days** | |

### Documentary / Short film (5-15 minutes)

| Phase | Steps | Estimated time | Notes |
|-------|-------|---------------|-------|
| Pre-production | Brief → G2 | 8-16 hours | Research-heavy, complex structure |
| Production | G2 → G3 | 6-12 hours | More shots, more complex visual language |
| Generation | G3 → G4 | 12-24 hours | High shot count, consistency critical |
| Post | G4 → G5 | 4-8 hours | Full post pipeline |
| **Total** | | **30-60 hours / 7-14 days** | |

### Complex commercial (high production value)

| Phase | Steps | Estimated time | Notes |
|-------|-------|---------------|-------|
| Pre-production | Brief → G2 | 6-12 hours | Brand requirements add complexity |
| Production | G2 → G3 | 6-12 hours | Brand guardian involvement throughout |
| Generation | G3 → G4 | 8-16 hours | High quality bar, more iterations expected |
| Post | G4 → G5 | 4-8 hours | Full post + brand compliance check |
| **Total** | | **24-48 hours / 5-10 days** | |

---

## Shared state and artifacts

Every pipeline step produces artifacts that are stored centrally and accessed by downstream teams. This is the single source of truth for each project.

### Artifact registry per step

| Step | Artifacts produced | Storage path | Write access | Read access |
|------|-------------------|-------------|-------------|------------|
| 1. Brief | Raw brief, reference files | `project/{id}/brief/` | Team 7, Team 1 | All teams |
| 2. Concept | Enriched brief, concept doc, moodboard, character sheets | `project/{id}/concept/` | Team 1 | All teams |
| G1 | Project bible | `project/{id}/bible/` | Showrunner | All teams |
| 3. Script | Production-ready script, beat sheet | `project/{id}/script/` | Team 2 | All teams |
| G2 | G2 review notes | `project/{id}/gates/g2/` | Showrunner | All teams |
| 4. Visual look | Shot list, color palette, breakdown, asset images | `project/{id}/visual/` | Team 3, Producer | Teams 3-6 |
| 5. Storyboard | Storyboard images, AV text columns | `project/{id}/storyboard/` | Team 3, Team 4 | All teams + client |
| G3 | G3 review notes, client approval | `project/{id}/gates/g3/` | Showrunner, client | All teams |
| 6. Video gen | Generated clips, prompt logs | `project/{id}/clips/` | Team 3 | Teams 4, 5, 6 |
| 7. Edit | Timeline, first cut video | `project/{id}/edit/` | Team 6 | Teams 4, 5, XF agents |
| 8. Audio | VO, music, SFX, foley, ambient, final mix | `project/{id}/audio/` | Team 5 | Team 6, XF agents |
| G4 | G4 review, critic scores | `project/{id}/gates/g4/` | Showrunner, XF-001 | All teams |
| 9. Polish | Graded video, subtitles | `project/{id}/polish/` | Team 6 | XF agents |
| G5 | G5 review, compliance report, brand report, accessibility report | `project/{id}/gates/g5/` | Showrunner, XF-001 to XF-004 | All teams |
| 10. Delivery | Multi-format package | `project/{id}/delivery/` | Team 6 (T6-003) | Team 7, client |
| Model config | Model selection matrix, per-shot model assignments | `project/{id}/model_config/` | Team 9 | Teams 3, 5, 6 |

### Project state machine

```
BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL_LOOK → STORYBOARD → [G3] → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
```

Each state transition is logged with timestamp, agent responsible, and gate decision (if applicable). The PM monitors state transitions to detect stalls.

---

## Parallel work and dependencies

### Hard dependencies (cannot start until predecessor completes)

| Downstream step | Depends on | Reason |
|----------------|-----------|--------|
| Script writing (Step 3) | G1 pass | Script needs approved concept and project bible |
| Video generation (Step 6) | G3 pass | Cannot generate without approved storyboard |
| Editing (Step 7) | Video clips exist | Cannot edit without material |
| Final polish (Step 9) | G4 pass | Cannot polish a rejected cut |
| Delivery (Step 10) | G5 pass | Cannot deliver unapproved final |

### Soft dependencies (can start with partial info, refine later)

| Step | Can start as early as | What it starts with | What it refines later |
|------|----------------------|--------------------|--------------------|
| Sonic palette definition (Team 5) | G2 (script approved) | Script tone, creative direction | Adjusts after seeing generated video |
| Graphic templates (Team 4) | G2 (script approved) | Brand guidelines, creative direction | Refines after storyboard shows context |
| Character sheets (T1-002) | During concept phase | Initial creative direction | Refines after script finalizes characters |
| Cost estimation (T8-004) | Brief received | Project type, estimated duration | Refines after shot count is known |
| Color palette (T3-001) | G1 (project bible) | Brand + emotional direction | Adjusts per scene after script exists |
| Platform formats (T6-003) | Brief received | Client's target platforms | Executes after final cut |
| Model selection (Team 9) | G1 (project bible) | Project type, style, tone | Refines after shot requirements are defined |

> **Note:** Model skills are always available (maintained continuously, not per-project).

### Parallel work diagram

```
Timeline ──────────────────────────────────────────────────────────>

Brief ─── Concept ─── [G1] ─── Script ─── [G2] ─── Visual ─── Storyboard ─── [G3] ─── VideoGen ─── Edit ─── [G4] ─── Polish ─── [G5] ─── Delivery
                                  │                    │                                    │            │
                                  │                    ├── Sonic palette ──────────────────>│            │
                                  │                    ├── Graphic templates ──────────────>│            │
                                  │                    └── Cost estimation ──>              │            │
                                  │                                                        │            │
                                  └── Character sheets ──────────────────────────────────>  │            │
                                                                                           │            │
                                                                              Audio ───────┘            │
                                                                              Foley ────────────────────┘
```

Teams 7 (client experience) and 8 (operations) operate continuously throughout the project and are not shown in the pipeline diagram.
