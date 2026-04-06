# CriteriaFilms.com — Agent registry (technical reference)

> Last updated: April 5, 2026
> Total agents: 47 | Phase 1: 20 | Phase 2: 10 | Phase 3: 17
> Format: Technical reference cards — for team structure and communication protocols, see TEAM_STRUCTURE.md

---

## Quick reference table

| ID | Agent | Level | Team | Phase |
|----|-------|-------|------|-------|
| TL-001 | Project manager | Top-level | — | 1 |
| TL-002 | Showrunner | Top-level | — | 1 |
| TL-003 | Producer | Top-level | — | 1 |
| T1-L | Creative director | Leader | 1. Creative dev | 1 |
| T1-001 | Project researcher | Sub-agent | 1. Creative dev | 2 |
| T1-002 | AI casting director | Sub-agent | 1. Creative dev | 2 |
| T2-L | Head writer | Leader | 2. Writers room | 1 |
| T2-001 | Narrative structuralist | Sub-agent | 2. Writers room | 2 |
| T2-002 | AV copywriter | Sub-agent | 2. Writers room | 1 |
| T2-003 | Fiction writer | Sub-agent | 2. Writers room | 3 |
| T2-004 | Documentary writer | Sub-agent | 2. Writers room | 3 |
| T2-005 | Explainer writer | Sub-agent | 2. Writers room | 2 |
| T2-006 | Script doctor | Sub-agent | 2. Writers room | 1 |
| T3-L | Director of photography (DP) | Leader | 3. Cinematography | 1 |
| T3-001 | Pre-production colorist | Sub-agent | 3. Cinematography | 2 |
| T3-002 | Camera movement director | Sub-agent | 3. Cinematography | 2 |
| T3-003 | Cinematic prompt engineer | Sub-agent | 3. Cinematography | 1 |
| T4-L | Typographer / motion graphics | Leader | 4. Art & design | 3 |
| T4-001 | Compositor / VFX | Sub-agent | 4. Art & design | 3 |
| T4-002 | Continuity supervisor | Sub-agent | 4. Art & design | 3 |
| T5-L | Sound designer (sonorizador) | Leader | 5. Audio | 1 |
| T5-001 | Sound designer (atmospheres) | Sub-agent | 5. Audio | 3 |
| T5-002 | Foley artist / SFX synchronizer | Sub-agent | 5. Audio | 3 |
| T6-L | Editor | Leader | 6. Post-production | 1 |
| T6-001 | Post colorist | Sub-agent | 6. Post-production | 2 |
| T6-002 | Subtitler / localizer | Sub-agent | 6. Post-production | 2 |
| T6-003 | Delivery master | Sub-agent | 6. Post-production | 1 |
| T7-L | Client service | Leader | 7. Client exp. | 1 |
| T7-001 | Onboarding specialist | Sub-agent | 7. Client exp. | 3 |
| T7-002 | Feedback interpreter | Sub-agent | 7. Client exp. | 3 |
| T7-003 | AI filmmaking tutor | Sub-agent | 7. Client exp. | 3 |
| T8-L | Financial manager | Leader | 8. Operations | 3 |
| T8-001 | Accountant | Sub-agent | 8. Operations | 3 |
| T8-002 | Legal | Sub-agent | 8. Operations | 3 |
| T8-003 | CTO | Sub-agent | 8. Operations | 3 |
| T8-004 | AI cost estimator | Sub-agent | 8. Operations | 3 |
| T8-005 | Performance analyst | Sub-agent | 8. Operations | 3 |
| T9-L | AI Model Director | Leader | 9. AI Model Intelligence | 1 |
| T9-001 | Text Model Specialist | Sub-agent | 9. AI Model Intelligence | 1 |
| T9-002 | Image Model Specialist | Sub-agent | 9. AI Model Intelligence | 1 |
| T9-003 | Video Model Specialist | Sub-agent | 9. AI Model Intelligence | 1 |
| T9-004 | Audio Model Specialist | Sub-agent | 9. AI Model Intelligence | 1 |
| T9-005 | Model Benchmarker / Evaluator | Sub-agent | 9. AI Model Intelligence | 1 |
| XF-001 | Cinematographic critic | Cross-functional | — | 1 |
| XF-002 | Content compliance | Cross-functional | — | 2 |
| XF-003 | Brand guardian | Cross-functional | — | 2 |
| XF-004 | Accessibility specialist | Cross-functional | — | 3 |

---

## Top-level agents (3)

### TL-001: Project manager
- **Phase:** 1
- **Inputs:** Project briefs from Team 7, status reports from all team leaders, budget data from Team 8
- **Process:** Orchestrates timelines, resource allocation, and dependencies across all teams. Detects bottlenecks, manages parallel work opportunities, monitors budget.
- **Outputs:** Project schedules, resource allocation plans, progress reports (to client portal), budget status alerts
- **Tools/Models:** Project management LLM (scheduling, dependency tracking), dashboard generation
- **Quality criteria:** Projects delivered on schedule, budget deviation < 15%, bottlenecks detected before they cause delays
- **Dependencies:** None — initiates work based on client brief
- **Replaceable by human:** Yes — experienced project manager / executive producer

### TL-002: Showrunner
- **Phase:** 1
- **Inputs:** Project bible (self-generated at G1), all team outputs at gate review points, cross-functional agent evaluations
- **Process:** Guards creative vision and coherence across entire project lifecycle. Conducts 5 mandatory gate reviews. Generates project bible at G1 with vision, tone, rules, and central question. Redirects teams with full context when gate fails.
- **Outputs:** Gate review decisions (pass/fail with specific notes), project bible, creative direction corrections
- **Tools/Models:** Evaluation LLM (quality assessment, coherence checking), project memory (decision log access)
- **Quality criteria:** Gate reviews are consistent (same quality bar across projects), creative vision maintained from concept to delivery, team redirections are actionable (not vague)
- **Dependencies:** Depends on team outputs at each gate point
- **Replaceable by human:** Yes — executive producer with creative authority

### TL-003: Producer
- **Phase:** 1
- **Inputs:** Approved script (from G2), creative direction (from Team 1), brand guidelines (from client)
- **Process:** Creates complete script breakdown (characters, locations, props, makeup, graphics). Generates asset images for each element. Coordinates with creative director for style validation. Manages temporary client drive (15-day retention).
- **Outputs:** Script breakdown document, asset images (validated by creative director), production schedule, organized asset library
- **Tools/Models:** Image generation models (for asset/ingredient images), breakdown analysis LLM
- **Quality criteria:** Breakdown is complete (no missing elements from script), asset images are style-consistent, production schedule is realistic
- **Dependencies:** TL-002 (G1 must pass), T2-L (script must exist for breakdown)
- **Replaceable by human:** Yes — line producer

---

## Team 1: Creative development (3 agents)

### T1-L: Creative director
- **Phase:** 1
- **Inputs:** Client brief (from Team 7), researcher findings (from T1-001), project type classification
- **Process:** Analyzes brief, identifies project type (corporate, explainer, fiction, documentary, horror), proposes creative concept to client, defines creative north and moodboard. Guides client through brief creation. Supervises creative coherence throughout project.
- **Outputs:** Approved concept, moodboard, creative direction document, enriched brief (to Team 2)
- **Tools/Models:** Creative analysis LLM, image generation (moodboards), reference library
- **Quality criteria:** Concept is clear and executable (passes G1), client approves creative direction, brief is enriched enough for Team 2 to work independently
- **Dependencies:** T7-L (client brief must exist)
- **Replaceable by human:** Yes — creative director (high priority for human substitution)

### T1-001: Project researcher
- **Phase:** 2
- **Inputs:** Raw client brief
- **Process:** Scans sector videos for patterns and opportunities (visual competitive analysis). Builds psychographic audience profile with visual and narrative preferences. Establishes minimum quality benchmark by comparing with sector leaders. Enriches brief with context the client doesn't know they need.
- **Outputs:** Enriched brief with competitive analysis, audience profile, visual trends, quality benchmarks
- **Tools/Models:** Web search, video analysis tools, audience profiling LLM
- **Quality criteria:** Analysis covers at least 5 competitor videos, audience profile includes demographic + psychographic data, benchmarks are specific and measurable
- **Dependencies:** T7-L (raw brief must exist)
- **Replaceable by human:** Yes — market researcher / strategist

### T1-002: AI casting director
- **Phase:** 2
- **Inputs:** Approved script, creative direction
- **Process:** Generates character sheets with multiple angles, expressions, and poses. Creates identity consistency references (embeddings) to ensure characters look the same across shots. Maps key emotions with visual references per script moment. Defines wardrobe per scene.
- **Outputs:** Character sheets, expression maps, wardrobe-per-scene document, identity embeddings
- **Tools/Models:** Image generation (character sheets), face consistency tools, reference embedding models
- **Quality criteria:** Characters are consistent across all generated references, expression map covers all script emotions, wardrobe is scene-appropriate
- **Dependencies:** T1-L (creative direction), T2-L (approved script from G2)
- **Replaceable by human:** Yes — casting director / character designer

---

## Team 2: Writers room (7 agents)

### T2-L: Head writer
- **Phase:** 1
- **Inputs:** Enriched brief + approved concept from Team 1
- **Process:** Does not write — directs writing. Classifies project type, assigns script format, activates correct specialist writer, manages revision cycles between specialist and script doctor, approves script internally before sending to showrunner for G2.
- **Outputs:** Production-ready script in correct format (to showrunner for G2)
- **Tools/Models:** Project classification LLM, format assignment rules
- **Quality criteria:** Correct specialist activated for project type, script passes internal review before G2, format matches project type
- **Dependencies:** T1-L (enriched brief and concept must exist, G1 must pass)
- **Replaceable by human:** Yes — head writer / script supervisor

### T2-001: Narrative structuralist
- **Phase:** 2
- **Inputs:** Brief, concept, project type, duration
- **Process:** Creates beat sheet with emotional arc, turning points, and section timing. Applies framework by duration (micro 15-30s, short 1-3min, medium 3-10min, long 10min+, feature 60min+). Maps emotional arc. Creates opening hook (first 3 seconds). Structures by objective (sell vs educate vs entertain vs move).
- **Outputs:** Beat sheet, emotional arc document, timing breakdown
- **Tools/Models:** Narrative structure LLM, timing calculation
- **Quality criteria:** Beat sheet covers all duration segments, emotional arc has clear peaks and valleys, hook is defined for first 3 seconds, structure matches project objective
- **Dependencies:** T2-L (project type and format must be assigned)
- **Replaceable by human:** Yes — script consultant / story editor

### T2-002: AV copywriter
- **Phase:** 1
- **Inputs:** Approved structure, brand guidelines
- **Process:** Writes complete AV script in two-column format for corporate, advertising, and brand videos. Distills key messages, integrates CTAs naturally into narrative, writes for voice (sounds natural spoken), ensures mute test passes (video communicates without audio), adapts brand voice.
- **Outputs:** AV script in two-column format
- **Tools/Models:** Copywriting LLM, brand voice adaptation, readability analysis
- **Quality criteria:** Script passes mute test, CTA is integrated naturally, brand voice is consistent, narration sounds natural when read aloud
- **Dependencies:** T2-001 (structure, if available) or T2-L (direct assignment for simple projects)
- **Replaceable by human:** Yes — copywriter / AV scriptwriter

### T2-003: Fiction writer
- **Phase:** 3
- **Inputs:** Approved structure, character sheets
- **Process:** Writes master scene format scripts for short films, features, series, and narrative documentaries. Creates authentic dialogue (each character has own voice), builds subtext, constructs characters with motivations and arcs, does worldbuilding, paces tension and release.
- **Outputs:** Master scene format script
- **Tools/Models:** Creative writing LLM, dialogue analysis, character consistency checker
- **Quality criteria:** Each character has distinct voice, subtext exists in key scenes, character arcs are complete, pacing follows emotional arc from structuralist
- **Dependencies:** T2-001 (structure), T1-002 (character sheets)
- **Replaceable by human:** Yes — screenwriter

### T2-004: Documentary writer
- **Phase:** 3
- **Inputs:** Approved structure, research material
- **Process:** Writes documentary scripts with interview guides. Builds argumentative structure (premise, evidence, counterpoint, conclusion). Designs interview questions. Writes non-fiction narration that guides without lecturing. Fact-checks narrative claims.
- **Outputs:** Documentary script with interview guides
- **Tools/Models:** Research LLM, fact-checking tools, documentary structure templates
- **Quality criteria:** Argumentative structure is sound, claims are verifiable, narration guides without lecturing, interview questions elicit compelling responses
- **Dependencies:** T2-001 (structure), T1-001 (research material)
- **Replaceable by human:** Yes — documentary writer / journalist

### T2-005: Explainer writer
- **Phase:** 2
- **Inputs:** Approved structure, subject matter
- **Process:** Writes narration scripts with visual cues for explainers, tutorials, educational videos, and onboarding content. Simplifies complex topics without distortion using analogies and metaphors. Applies didactic structure (concept, example, complication, resolution, summary). Calibrates learning pace.
- **Outputs:** Narration script with visual cues
- **Tools/Models:** Educational content LLM, complexity analysis, visual cue generation
- **Quality criteria:** Simplification is accurate (no distortion), visual cues are specific and producible, pacing matches target audience level, structure follows didactic framework
- **Dependencies:** T2-001 (structure) or T2-L (direct assignment)
- **Replaceable by human:** Yes — educational content writer

### T2-006: Script doctor
- **Phase:** 1
- **Inputs:** Draft script from any specialist writer
- **Process:** Last filter before script leaves the team. Diagnoses exactly where script loses power and why. Detects cliches, calibrates tone, evaluates timing, performs read-aloud test (detects tongue twisters and broken rhythms). Applies format-specific evaluation criteria (corporate ≠ fiction ≠ explainer).
- **Outputs:** Improvement report with severity levels and specific suggestions
- **Tools/Models:** Script analysis LLM, cliche detection, rhythm analysis, format-specific evaluation rubrics
- **Quality criteria:** Report identifies specific locations (not vague), suggestions are actionable, severity is calibrated (critical vs minor), format-specific criteria are applied
- **Dependencies:** T2-002/003/004/005 (draft script must exist)
- **Replaceable by human:** Yes — script consultant / story editor

---

## Team 3: Cinematography (4 agents)

### T3-L: Director of photography (DP)
- **Phase:** 1
- **Inputs:** Approved script (G2), creative direction, project bible
- **Process:** Creates technical proposal per scene and shot (framing, lens, light, color temperature, composition). Generates visual previews for storyboard. Selects AI model per shot type. Ensures visual consistency between shots. Adjusts parameters based on feedback.
- **Outputs:** Shot list with technical specs, storyboard previews, model selection per shot
- **Tools/Models:** Image generation models (storyboard previews), cinematography reference library, shot composition analysis
- **Quality criteria:** Technical specs are complete for every shot, storyboard previews match creative direction, visual consistency across shots is maintained
- **Dependencies:** TL-002 (G2 must pass), T1-L (creative direction)
- **Replaceable by human:** Yes — cinematographer / DP (high priority for human substitution)

### T3-001: Pre-production colorist / art director
- **Phase:** 2
- **Inputs:** Project bible, creative direction, brand guidelines
- **Process:** Creates color system (primary, secondary, accent based on brand + target emotion). Generates reference LUTs. Defines per-scene color psychology (adjusts temperature and saturation per narrative emotion). Validates accessibility (sufficient contrast for on-screen text).
- **Outputs:** Color palette, LUT references, per-scene color parameters
- **Tools/Models:** Color analysis tools, LUT generation, accessibility contrast checker
- **Quality criteria:** Color palette aligns with brand and emotional intent, contrast ratios meet accessibility standards (4.5:1 for text), per-scene parameters are specific and reproducible
- **Dependencies:** T1-L (creative direction), TL-002 (project bible from G1)
- **Replaceable by human:** Yes — colorist / art director

### T3-002: Camera movement director
- **Phase:** 2
- **Inputs:** Shot list, script, emotional arc
- **Process:** Specifies camera movement per shot with narrative purpose (every movement has a reason: reveal, follow, emphasize, transition). Maintains movement vocabulary per AI model. Coordinates movement rhythm with music and narrative. Plans shot-to-shot transitions.
- **Outputs:** Movement specifications per shot, transition plan
- **Tools/Models:** Movement planning LLM, per-model movement vocabulary library
- **Quality criteria:** Every camera movement has documented narrative purpose, movement vocabulary matches selected AI model's capabilities, transitions are smooth
- **Dependencies:** T3-L (shot list), T2-001 (emotional arc)
- **Replaceable by human:** Yes — camera operator / steadicam operator

### T3-003: Cinematic prompt engineer
- **Phase:** 1
- **Inputs:** DP technical specs, colorist parameters, movement specs, style reference, character sheets
- **Process:** Translates all creative and technical decisions into optimized prompts for each AI generation model. Maintains per-model vocabulary (each model responds differently to terms). Layers prompts in priority order (composition + lighting + movement + style + negatives). Evaluates each generation against objective criteria. Maintains pattern library of successful prompts.
- **Outputs:** Optimized prompts, generated outputs, quality evaluation scores
- **Tools/Models:** Video generation models (Runway, Kling, Sora, etc.), image generation models, prompt optimization LLM, pattern library
- **Quality criteria:** Prompts produce output matching DP specs on first or second attempt, per-model vocabulary is current, pattern library grows with each project
- **Dependencies:** T3-L (technical specs), T3-001 (color parameters, if Phase 2+), T3-002 (movement specs, if Phase 2+)
- **Replaceable by human:** Yes — AI artist / prompt specialist

---

## Team 4: Art & design (3 agents)

### T4-L: Typographer / motion graphics
- **Phase:** 3
- **Inputs:** Brand guidelines, creative direction, script
- **Process:** Selects typographic system (fonts that reinforce project tone, visual hierarchy). Designs lower thirds and titles. Creates animated infographics. Builds brand-aligned reusable templates.
- **Outputs:** Typography system, animated text templates, infographics, lower thirds
- **Tools/Models:** Typography selection LLM, motion graphics tools, template generation
- **Quality criteria:** Typography reinforces project tone, visual hierarchy is clear, templates are reusable across project, brand alignment verified
- **Dependencies:** T1-L (creative direction), T3-L (visual look from G3)
- **Replaceable by human:** Yes — graphic designer / motion graphics artist

### T4-001: Compositor / VFX
- **Phase:** 3
- **Inputs:** Generated clips, graphic elements, text overlays
- **Process:** Composes multiple layers (background + character + graphics) into coherent single frames. Performs selective inpainting. Integrates text respecting perspective and light. Cleans edges. Stabilizes erratic AI-generated motion.
- **Outputs:** Composited frames, cleaned shots
- **Tools/Models:** Compositing tools, inpainting models, stabilization algorithms
- **Quality criteria:** Layers are seamlessly integrated, no visible edges or artifacts, text follows scene perspective, AI motion artifacts are eliminated
- **Dependencies:** T3-003 (generated clips), T4-L (graphic elements)
- **Replaceable by human:** Yes — compositor / VFX artist

### T4-002: Continuity supervisor
- **Phase:** 3
- **Inputs:** All generated shots, script breakdown, character sheets
- **Process:** Verifies wardrobe raccord (same clothes within scene), lighting raccord (consistent light within scene), position raccord (objects and people maintain relative position between cuts). Detects AI artifacts (extra fingers, illegible text, deformations, flickering). Maintains continuity timeline document.
- **Outputs:** Continuity report, error flags with timecodes
- **Tools/Models:** Visual comparison tools, AI artifact detection, continuity tracking database
- **Quality criteria:** All raccord violations detected before G4, AI artifacts flagged with specific timecodes, continuity document is complete
- **Dependencies:** T3-003 (generated shots), TL-003 (script breakdown), T1-002 (character sheets)
- **Replaceable by human:** Yes — script supervisor / continuity person

---

## Team 5: Audio (3 agents)

### T5-L: Sound designer — sonorizador
- **Phase:** 1
- **Inputs:** Script, project bible, creative direction
- **Process:** Defines sonic palette of the project (types of music, VO style, SFX density). Generates voice-over/narration. Composes or selects background music. Creates editorial SFX (whooshes, risers, stingers, transition sounds). Coordinates final audio mix.
- **Outputs:** VO tracks, music, editorial SFX, sonic palette document, final audio mix
- **Tools/Models:** Voice generation (ElevenLabs, etc.), music generation (Suno, Udio, etc.), SFX libraries, audio mixing tools
- **Quality criteria:** VO sounds natural and matches brand voice, music supports emotional arc, SFX enhance transitions, overall mix is balanced
- **Dependencies:** T2-L (approved script from G2), T1-L (creative direction)
- **Replaceable by human:** Yes — sound designer / audio engineer

### T5-001: Sound designer (atmospheres)
- **Phase:** 3
- **Inputs:** Video clips, location descriptions, script
- **Process:** Generates per-location ambient layers (city, forest, office, beach — coherent with visuals). Creates spatial audio (reverb and stereo positioning coherent with visual space). Plans audio transitions between scenes. Applies dramatic silence when appropriate (knows when NOT to add sound).
- **Outputs:** Ambient layers, spatial audio tracks, scene transition audio
- **Tools/Models:** Ambient generation tools, spatial audio processing, reverb modeling
- **Quality criteria:** Ambients match visual locations, spatiality is coherent with visual depth, transitions are smooth, silence is used intentionally
- **Dependencies:** T6-L (edited video with visual locations visible), T5-L (sonic palette)
- **Replaceable by human:** Yes — ambient sound designer

### T5-002: Foley artist / SFX synchronizer
- **Phase:** 3
- **Inputs:** Edited video, AV script, director notes, sonic style
- **Process:** Analyzes video frame by frame, detects visual events that need sound (impacts, frictions, body movements, object interactions, liquids, weather, machinery, textiles, nature, vehicles, electronics). Classifies context (step on tile vs wood vs carpet vs grass). Generates per-model SFX. Synchronizes frame-accurately (+/- 1 frame at 24fps = +/- 41ms, 0 frames for hard impacts). Mixes SFX layers with correct relative volumes and stereo panning coherent with screen position. Ensures SFX never mask dialogue.
- **Outputs:** Event map with timecodes, synced SFX track, synced foley track, sonic coverage report
- **Tools/Models:** Video analysis (frame-by-frame event detection), SFX generation models, frame-accurate synchronization tools, SFX pattern library
- **Quality criteria:** All visual events have corresponding sound, sync is within tolerance, SFX don't mask dialogue, stereo panning matches screen position, physical coherence maintained
- **Dependencies:** T6-L (edited video), T5-L (sonic palette and style)
- **Replaceable by human:** Yes — foley artist

---

## Team 6: Post-production (4 agents)

### T6-L: Editor
- **Phase:** 1
- **Inputs:** Generated video clips, audio tracks, graphics
- **Process:** Assembles timeline, assigns in-out points for each clip, defines montage rhythm and cutting pace, plans scene transitions. Coordinates with audio team for sync. Can request shot re-generation from Team 3 if clips don't work for the planned cut. Exports MP4.
- **Outputs:** Edited timeline, first cut, final cut (after G4/G5 approval)
- **Tools/Models:** Video editing tools/APIs, timeline assembly LLM, export encoders
- **Quality criteria:** Cutting rhythm serves narrative, transitions are purposeful, audio-video sync is frame-accurate, no dead frames or jump cuts (unless intentional)
- **Dependencies:** T3-003 (generated video clips), T5-L (audio tracks)
- **Replaceable by human:** Yes — video editor (high priority for human substitution)

### T6-001: Post colorist
- **Phase:** 2
- **Inputs:** Edited video (first cut)
- **Process:** Matches color between clips (temperature, saturation, luminosity). Applies narrative grading (cold for tension, warm for intimacy). Protects skin tones. Verifies broadcast standard compliance.
- **Outputs:** Color-graded video
- **Tools/Models:** Color grading tools, LUT application, broadcast standard verification
- **Quality criteria:** Color is consistent across all clips, narrative grading matches emotional intent, skin tones are natural, broadcast standards met
- **Dependencies:** T6-L (first cut must exist)
- **Replaceable by human:** Yes — colorist

### T6-002: Subtitler / localizer
- **Phase:** 2
- **Inputs:** Final video, script
- **Process:** Transcribes with exact timing. Translates cinematically (maintains tone, rhythm, emotion — not literal). Adapts culturally. Generates multiple formats (SRT, VTT, burned-in per platform).
- **Outputs:** Subtitle files in multiple formats, translated versions
- **Tools/Models:** Transcription models, translation LLM, subtitle formatting tools
- **Quality criteria:** Timing is exact (no early/late subtitles), translation preserves tone, cultural references are adapted, all required formats generated
- **Dependencies:** T6-L (final cut), T6-001 (graded video, if available)
- **Replaceable by human:** Yes — subtitler / translator

### T6-003: Delivery master
- **Phase:** 1
- **Inputs:** Final graded video with audio
- **Process:** Applies platform profiles (exact specs for YouTube, Instagram, TikTok, LinkedIn, TV broadcast, digital cinema). Selects optimal codec and bitrate. Reframes automatically (16:9 to 9:16, 1:1, 4:5 with smart recomposition). Packages delivery folder with all versions, metadata, and thumbnails.
- **Outputs:** Multi-format delivery package (organized folder)
- **Tools/Models:** Encoding tools, reframing algorithms, metadata generators, thumbnail extractors
- **Quality criteria:** All requested platform formats are present, encoding quality is optimal per platform, reframing preserves key visual elements, package is complete with metadata
- **Dependencies:** T6-L (final cut after G5), T6-001 (graded video, if available)
- **Replaceable by human:** Yes — post-production coordinator

---

## Team 7: Client experience (4 agents)

### T7-L: Client service
- **Phase:** 1
- **Inputs:** Client inquiries, project status updates from PM
- **Process:** Manages all client-facing communication. Handles first contact and onboarding. Communicates progress and milestones. Manages client comments per deliverable element. Escalates issues to PM. Handles post-delivery follow-up, renewal, and new project management.
- **Outputs:** Client communications, organized feedback (to PM), onboarding records
- **Tools/Models:** Communication LLM, client portal integration, CRM
- **Quality criteria:** Client response time < 4 hours, all feedback is captured and routed, client satisfaction maintained throughout project
- **Dependencies:** None — operates throughout project lifecycle
- **Replaceable by human:** Yes — account manager

### T7-001: Onboarding specialist
- **Phase:** 3
- **Inputs:** New client information
- **Process:** Conducts smart questionnaire (conversational, not boring forms). Ingests brand assets (logos, palettes, fonts, manuals). Analyzes client's previous videos (visual history). Calibrates expectations (what AI production can and cannot achieve currently).
- **Outputs:** Complete client profile, ingested brand assets, expectation document
- **Tools/Models:** Conversational questionnaire LLM, brand asset parser, video analysis
- **Quality criteria:** All brand assets are ingested and catalogued, client expectations are documented, profile is complete enough for Team 1 to work from
- **Dependencies:** T7-L (initial client contact)
- **Replaceable by human:** Yes — onboarding coordinator

### T7-002: Feedback interpreter
- **Phase:** 3
- **Inputs:** Raw client feedback on deliverables
- **Process:** Translates vague client feedback into concrete, actionable instructions. Decodes ("I don't like it" → specific questions to identify the issue). Translates technically ("I want it more cinematic" → concrete instructions for DP, colorist, editor). Prioritizes (10 comments → ordered by impact and urgency). Learns from each client's feedback to anticipate preferences.
- **Outputs:** Actionable instruction list (prioritized, routed to correct team)
- **Tools/Models:** Feedback analysis LLM, client preference history, technical translation rules
- **Quality criteria:** No vague feedback reaches production teams (all translated to actionable items), priorities are correctly ordered, routing is accurate
- **Dependencies:** T7-L (raw feedback collected)
- **Replaceable by human:** Yes — producer / account director

### T7-003: AI filmmaking tutor
- **Phase:** 3
- **Inputs:** Student profile, learning objectives
- **Process:** Core agent for business model 3 (school). Assesses student level (beginner, intermediate, advanced). Designs curriculum by objective (documentaries path ≠ corporate path). Provides practical exercises with feedback. Mentors through complete first project. Connects with community.
- **Outputs:** Personalized curriculum, exercise feedback, project guidance
- **Tools/Models:** Educational LLM, exercise generation, project assessment tools
- **Quality criteria:** Curriculum matches student level and objectives, exercises are practical with real tools, student completes first project successfully
- **Dependencies:** None — operates independently from production pipeline
- **Replaceable by human:** Yes — film school instructor

---

## Team 8: Operations & finance (6 agents)

> **Note:** This entire team is a candidate for shared services with criteria.agency (see DEC-014).

### T8-L: Financial manager
- **Phase:** 3
- **Inputs:** Project briefs (for quotation), production data (for cost tracking)
- **Process:** Generates automatic quotations by project type and complexity. Calculates production costs (AI model usage, human hours, licenses). Projects ROI for own productions. Manages per-project budgets. Generates monthly financial reports. Alerts on budget deviations.
- **Outputs:** Quotations, cost reports, budget alerts, monthly financial reports
- **Tools/Models:** Financial modeling LLM, cost calculation engines, reporting tools
- **Quality criteria:** Quotations are competitive and profitable, cost tracking is real-time, budget deviations flagged before they become critical
- **Dependencies:** T8-004 (cost estimates for quotations)
- **Replaceable by human:** Yes — financial manager / CFO

### T8-001: Accountant
- **Phase:** 3
- **Inputs:** Invoicing triggers (project milestones), financial transactions
- **Process:** Generates automatic invoices by project milestones. Manages accounts receivable/payable. Handles tax management and declarations. Generates accounting reports. Performs bank reconciliation. Manages contractor payroll.
- **Outputs:** Invoices, accounting reports, tax declarations, payroll records
- **Tools/Models:** Accounting LLM, invoice generation, bank integration APIs
- **Quality criteria:** Invoices are timely and accurate, tax compliance maintained, accounts balanced
- **Dependencies:** T8-L (financial parameters)
- **Replaceable by human:** Yes — accountant

### T8-002: Legal
- **Phase:** 3
- **Inputs:** Project requirements, content for review
- **Process:** Generates contracts by project type. Manages copyright and content licenses. Reviews AI model terms of use. Generates NDAs, talent releases, location releases. Ensures AI content regulatory compliance.
- **Outputs:** Contracts, legal documents, compliance reports
- **Tools/Models:** Legal document LLM, compliance checking tools, contract templates
- **Quality criteria:** Contracts cover all necessary clauses, AI usage complies with model terms, regulatory compliance verified
- **Dependencies:** None — operates on request
- **Replaceable by human:** Yes — entertainment lawyer

### T8-003: CTO
- **Phase:** 3
- **Inputs:** Project requirements, performance data, new tool releases
- **Process:** Manages API integrations (video gen, image gen, voice, music). Maintains storage and processing infrastructure. Monitors performance. Evaluates and integrates tool and model updates. Plans integration with criteria.agency shared services.
- **Outputs:** Infrastructure configuration, API integrations, performance reports, update recommendations
- **Tools/Models:** Infrastructure management, API monitoring, model benchmarking tools
- **Quality criteria:** Infrastructure uptime > 99%, API costs optimized, new models evaluated within 2 weeks of release
- **Dependencies:** None — operates continuously
- **Replaceable by human:** Yes — CTO / technical director

### T8-004: AI cost estimator
- **Phase:** 3
- **Inputs:** Project specs, historical cost data
- **Process:** Calculates total production cost per project. Applies iteration factor (based on history, estimates regenerations per shot type). Estimates human supervision hours per project type. Suggests pricing with smart margin (cost + margin + perceived market value).
- **Outputs:** Cost estimates, pricing suggestions, iteration factor data
- **Tools/Models:** Cost modeling LLM, historical data analysis, pricing optimization
- **Quality criteria:** Estimates are within 20% of actual costs, iteration factors improve with more data, pricing is competitive
- **Dependencies:** Historical project data (improves over time)
- **Replaceable by human:** Yes — production accountant / estimator

### T8-005: Performance analyst
- **Phase:** 3
- **Inputs:** All project data, content performance data (when client shares)
- **Process:** Maintains production dashboard (average time per phase, average cost per type, rework rate). Tracks quality metrics (average critic score, client first-attempt approval rate). Analyzes content performance (views, engagement, retention). Recommends process improvements.
- **Outputs:** Production dashboard, quality metrics report, content performance analysis, improvement recommendations
- **Tools/Models:** Analytics LLM, dashboard tools, data visualization
- **Quality criteria:** Dashboard is up-to-date, metrics are accurate, recommendations are actionable and data-driven
- **Dependencies:** Project completion data (needs several completed projects to be useful)
- **Replaceable by human:** Yes — business analyst

---

## Team 9: AI Model Intelligence (6 agents)

### T9-L: AI Model Director
- **Phase:** 1
- **Inputs:** Project requirements (type, style, budget), model landscape updates, benchmark results
- **Process:** Defines model strategy per project. Decides which AI model to use for each task (text gen, image gen, video gen, audio gen). Maintains approved model catalog with ratings. Coordinates specialists. Publishes model selection guidelines for all teams.
- **Outputs:** Model selection matrix per project, approved model catalog, model strategy updates
- **Tools/Models:** All AI models (evaluation access), benchmark frameworks
- **Quality criteria:** Model selections produce quality output on first attempts, cost-efficiency of model choices, catalog is current
- **Dependencies:** None — operates proactively and on-demand
- **Replaceable by human:** Yes — AI technical director / ML engineer

### T9-001: Text Model Specialist
- **Phase:** 1
- **Inputs:** Text generation tasks from all teams, model releases, benchmark requests
- **Process:** Deep expertise on all LLMs (Claude, GPT, Gemini, Llama, Mistral, etc.). Creates detailed technical skills/guides for each model: optimal prompting techniques, context window management, temperature/parameter tuning, strengths/weaknesses per task type. Instructs agents on how to get best results from each LLM. Tracks pricing, rate limits, terms of use.
- **Outputs:** Per-model skill documents, prompting best practices, model comparison matrix (text), cost/limit reference sheets
- **Tools/Models:** Claude, GPT-4, Gemini, Llama, Mistral (evaluation access to all)
- **Quality criteria:** Skills produce measurably better outputs when followed, cost recommendations save >20% vs naive model selection
- **Dependencies:** T9-005 (benchmark results inform recommendations)
- **Replaceable by human:** Yes — prompt engineering lead / LLM researcher

### T9-002: Image Model Specialist
- **Phase:** 1
- **Inputs:** Image generation tasks, model releases, style requirements
- **Process:** Deep expertise on image models (Flux, Midjourney, DALL-E, Ideogram, Stable Diffusion, etc.). Creates skills: optimal prompting per model, style control, consistency techniques, negative prompts, aspect ratios, upscaling. Instructs T3-003 (prompt engineer), T1-002 (casting), TL-003 (producer) on image generation best practices. Tracks per-model pricing, credit systems, resolution limits.
- **Outputs:** Per-model image skills, style control guides, consistency techniques, cost/limit sheets
- **Tools/Models:** Flux, Midjourney, DALL-E 3, Ideogram, Stable Diffusion (evaluation access)
- **Quality criteria:** Image quality improves after skill adoption, prompt engineer success rate increases, cost per image optimized
- **Dependencies:** T9-005 (benchmarks)
- **Replaceable by human:** Yes — AI artist / image generation specialist

### T9-003: Video Model Specialist
- **Phase:** 1
- **Inputs:** Video generation tasks, model releases, shot requirements from DP
- **Process:** Deep expertise on video models (Runway Gen-3/4, Kling, Sora, Veo, Pika, Luma, Seedance 2.0, etc.). Creates skills: optimal prompting per model, movement control, consistency across shots, duration limits, resolution/fps options, style transfer, camera movement vocabulary per model. Primary instructor to T3-003 (cinematic prompt engineer). Tracks per-model pricing, generation limits, queue times.
- **Outputs:** Per-model video skills, movement vocabulary per model, shot type guides, cost/limit/queue sheets
- **Tools/Models:** Runway, Kling, Sora, Veo, Pika, Luma, Seedance 2.0 (evaluation access)
- **Quality criteria:** Video generation first-attempt success rate, shot consistency across models, cost optimization per shot type
- **Dependencies:** T9-005 (benchmarks), T3-L (DP provides shot requirements for model matching)
- **Replaceable by human:** Yes — AI video specialist / technical director

### T9-004: Audio Model Specialist
- **Phase:** 1
- **Inputs:** Audio tasks (VO, music, SFX), model releases, sonic requirements
- **Process:** Deep expertise on audio models. Voice: ElevenLabs, PlayHT, Fish.audio, etc. Music: Suno, Udio, Stable Audio, etc. SFX: ElevenLabs SFX, sound libraries. Creates skills: voice cloning techniques, music prompting, SFX generation and sync. Instructs T5-L, T5-001, T5-002 on audio generation best practices. Tracks pricing, licensing terms, quality tiers.
- **Outputs:** Per-model audio skills, voice generation guides, music prompting guides, SFX techniques, cost/licensing sheets
- **Tools/Models:** ElevenLabs, PlayHT, Suno, Udio, Stable Audio (evaluation access)
- **Quality criteria:** Audio quality matches professional standards, voice consistency, music fits emotional arc, licensing compliance
- **Dependencies:** T9-005 (benchmarks)
- **Replaceable by human:** Yes — audio engineer / sound technology specialist

### T9-005: Model Benchmarker / Evaluator
- **Phase:** 1
- **Inputs:** New model releases, specialist evaluations, project quality data
- **Process:** Runs systematic benchmarks comparing models within each category. Designs evaluation criteria per task type. Conducts A/B tests with controlled prompts. Publishes benchmark reports with recommendations. Tracks model evolution over time. Feeds results to all specialists and to the AI Model Director.
- **Outputs:** Benchmark reports, model comparison matrices, A/B test results, recommendation updates
- **Tools/Models:** All models (benchmark access), evaluation frameworks, statistical analysis
- **Quality criteria:** Benchmarks are reproducible, sample sizes are meaningful, recommendations are data-driven
- **Dependencies:** T9-001 through T9-004 (specialists provide domain-specific evaluation criteria)
- **Replaceable by human:** Yes — ML evaluation engineer / benchmarking analyst

---

## Cross-functional agents (4) — Independent, with veto power

### XF-001: Cinematographic critic
- **Phase:** 1
- **Inputs:** Generated shots, edited sequences, final cuts
- **Process:** Scores each shot on 4 dimensions (composition, lighting, movement, narrative coherence — each 1-10). Provides global score (rhythm, narrative arc, emotional impact, visual coherence). Compares against quality benchmarks. Gives concrete recommendations ("regenerate with more contrast and lower angle", not "this is bad"). Enforces quality threshold.
- **Outputs:** Per-shot scores, global score, concrete improvement recommendations, pass/fail decision
- **Tools/Models:** Visual quality assessment LLM, composition analysis, benchmark library
- **Quality criteria:** Scores are consistent across projects, recommendations are specific and actionable, threshold enforcement is objective
- **Dependencies:** T3-003 (generated shots must exist)
- **Replaceable by human:** Yes — film critic / quality reviewer

### XF-002: Content compliance
- **Phase:** 2
- **Inputs:** All generated content (video, audio, text)
- **Process:** Detects likeness to real people in generated characters. Verifies claims (medical, financial, comparative — flags those needing legal disclaimer). Checks music and audio (all must be original, licensed, or public domain). Detects involuntary trademark appearances (third-party logos/brands in AI generations).
- **Outputs:** Compliance report, flagged issues with severity, required disclaimers
- **Tools/Models:** Likeness detection models, claim verification LLM, trademark recognition, audio licensing verification
- **Quality criteria:** Zero compliance issues reach final delivery, all claims are verified, all audio is properly licensed
- **Dependencies:** Content must exist for review (operates at G4 and G5)
- **Replaceable by human:** Yes — compliance officer / legal reviewer

### XF-003: Brand guardian
- **Phase:** 2
- **Inputs:** All deliverables, client brand manual
- **Process:** Ingests client brand book and extracts verifiable rules. Verifies color usage (compares every brand color appearance against official values). Checks logo usage (minimum size, protection area, permitted backgrounds). Evaluates tone of voice consistency. Runs pre-delivery brand compliance checklist.
- **Outputs:** Brand compliance report, deviation flags, pre-delivery checklist results
- **Tools/Models:** Brand analysis LLM, color comparison tools, logo detection, tone analysis
- **Quality criteria:** Brand guidelines are fully digitized and verifiable, all deviations are flagged before delivery, checklist is complete
- **Dependencies:** Client brand manual (from onboarding), deliverables for review
- **Replaceable by human:** Yes — brand manager

### XF-004: Accessibility specialist
- **Phase:** 3
- **Inputs:** Final video with text overlays and audio
- **Process:** Checks text-in-video contrast (all text must exceed 4.5:1 ratio). Verifies reading speed (on-screen text must remain long enough to be read). Generates audio descriptions. Runs epilepsy check (no more than 3 flashes per second).
- **Outputs:** Accessibility report, audio description track, violation flags
- **Tools/Models:** Contrast analysis tools, reading speed calculator, audio description generator, flash rate detector
- **Quality criteria:** All text exceeds 4.5:1 contrast, reading speed is sufficient, no epilepsy-triggering content, audio description is available
- **Dependencies:** T6-L (final cut with all text overlays)
- **Replaceable by human:** Yes — accessibility consultant
