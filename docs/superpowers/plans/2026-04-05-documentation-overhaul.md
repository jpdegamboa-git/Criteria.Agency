# CriteriaFilms Documentation Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure 5 existing documents to eliminate redundancy, enrich them with missing content (KPIs, iteration loops, autonomy framework, conflict resolution), and create 3 new documents (MVP_ROADMAP, TECH_ARCHITECTURE, PORTAL_SPECS) to complete the CriteriaFilms documentation system.

**Architecture:** Documentation-only project. 8 markdown files in `/Users/juanpa/Agentes/CriteriaFilms 4/`. No code, no tests. Verification is structural: correct sections exist, no duplicated info, consistent cross-references, all 38 agents accounted for.

**Tech Stack:** Markdown files. No dependencies.

**Spec:** `docs/superpowers/specs/2026-04-05-documentation-overhaul-design.md`

---

## Execution Batches

Tasks are grouped by dependency. Within each batch, tasks can run in parallel.

- **Batch A (Tasks 1-6):** Edit existing docs — independent changes, no cross-dependencies
- **Batch B (Tasks 7-8):** AGENT_REGISTRY restructure — largest transformation
- **Batch C (Tasks 9-12):** PRODUCTION_PIPELINE enrichment — independent from Batch A/B
- **Batch D (Tasks 13-15):** Create 3 new documents — independent of each other
- **Batch E (Tasks 16-18):** Decision log + cross-references — depends on Batches A-D

---

### Task 1: PROJECT_VISION.md — Remove "System overview" section

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PROJECT_VISION.md`

- [ ] **Step 1: Remove the System overview section**

Delete the `## System overview` heading and its 5 bullet points (lines 79-86 approximately):

```markdown
## System overview

- **38 agents** organized in 3 tiers: top-level (3), teams (8 teams with leaders + sub-agents), cross-functional (4)
- **8 teams:** creative development, writers room, cinematography, art & design, audio, post-production, client experience, operations
- **5 showrunner gates:** post-concept, post-script, post-storyboard, first cut, final cut
- **5 communication protocols:** handoff, request, veto, sync, escalation
- **3+3 rule:** 6 automatic attempts before escalating to human
```

This content exists verbatim in TEAM_STRUCTURE.md (chain of command, team list, communication protocols, 3+3 rule) and AGENT_REGISTRY.md (agent count, quick reference table).

- [ ] **Step 2: Verify removal**

Confirm: no "System overview" heading remains. Document flows from "Immutable principles" to "Future vision".

---

### Task 2: PROJECT_VISION.md — Trim "Future vision" to strategic-only

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PROJECT_VISION.md`

- [ ] **Step 1: Remove operational bullets from Future vision**

In the "Future vision" section, remove these two operational bullets (they're captured in TEAM_STRUCTURE.md and DEC-014):
- `- Integration with criteria.agency (shared billing, CRM, auth, storage, analytics)`
- `- The operations team (team 8) is the primary candidate for shared services`

Keep only:
```markdown
## Future vision

- Self-manageable subscription system
- Always with the option to hire human specialists, especially in creative areas
```

- [ ] **Step 2: Verify**

"Future vision" contains exactly 2 strategic bullets.

---

### Task 3: PROJECT_VISION.md — Add KPIs per business model

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PROJECT_VISION.md`

- [ ] **Step 1: Add KPIs section after "3 Business models"**

Insert after the "3. AI filmmaking school" subsection, before "3 Portals":

```markdown
---

## Key performance indicators

### Production service KPIs

| Metric | Description | Target (Phase 1) |
|--------|-------------|-------------------|
| Projects/month | Completed projects delivered to clients | 2-4 |
| Brief-to-delivery time | Average calendar days from brief to final delivery | 5-10 days |
| First-attempt approval rate | % of deliverables approved by client without revision requests | > 60% |
| Cost per video minute | Average production cost in USD per finished minute | To be baselined |
| Gate pass rate | % of gate reviews that pass on first attempt | > 70% |

### Own productions KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Pieces/quarter | Completed own productions per quarter | 1-2 |
| Festival/platform acceptance | % of submissions accepted | > 30% |
| Revenue per piece | Average distribution revenue per production | To be baselined |

### AI filmmaking school KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Active students | Students enrolled and active in courses | 50+ (beta) |
| Course completion rate | % of enrolled students who complete their course | > 60% |
| NPS | Net Promoter Score from student surveys | > 40 |
```

- [ ] **Step 2: Verify**

Section exists with 3 subsections matching the 3 business models. Each KPI has description and target.

---

### Task 4: PROJECT_VISION.md — Add competitive positioning

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PROJECT_VISION.md`

- [ ] **Step 1: Add positioning section after KPIs**

Insert after the KPIs section:

```markdown
---

## Competitive positioning

CriteriaFilms operates at the intersection of professional film production and AI automation. The competitive landscape includes:

### vs. Traditional production houses

They offer quality but at high cost and slow timelines. CriteriaFilms matches professional quality standards (enforced by 5 showrunner gates and cross-functional critics) while reducing delivery times and costs through AI automation.

### vs. Pure AI video tools (Runway, Pika, etc.)

They offer speed and low cost but generic, inconsistent quality. CriteriaFilms adds what they lack: structured production pipeline, hyper-specialized agents, human oversight at critical points, and quality gates that prevent substandard output from reaching clients.

### vs. Freelancers using AI tools

They offer flexibility but lack consistency, scalability, and quality assurance. CriteriaFilms provides a repeatable process with 38 specialized agents, formal communication protocols, and a substitution framework where any AI agent can be replaced by a human specialist.

### Positioning statement

CriteriaFilms is the first AI-native production studio that combines the rigor and quality standards of professional cinema with the speed and cost advantages of AI automation — controlled by experts with 20 years of production experience.
```

- [ ] **Step 2: Verify**

Section exists with 3 competitor comparisons and a positioning statement.

---

### Task 5: TEAM_STRUCTURE.md — Add conflict resolution matrix

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/TEAM_STRUCTURE.md`

- [ ] **Step 1: Add conflict resolution section after "Key structural decisions"**

Insert after the "Key structural decisions" section:

```markdown
---

## Conflict resolution matrix

When teams or agents disagree, conflicts are resolved through clear escalation paths. The showrunner is the primary mediator for creative conflicts; the PM for operational ones.

| Conflict type | Example | Parties | Mediator | Resolution criteria |
|--------------|---------|---------|----------|-------------------|
| Creative vision vs technical feasibility | DP proposes shot that AI models cannot generate reliably | Creative Director vs DP | Showrunner | Creative intent preserved if technically possible; if not, showrunner defines acceptable alternative |
| Edit rhythm vs shot quality | Editor wants to cut a shot short; DP argues the shot needs full duration for visual impact | Editor vs DP | Showrunner | Narrative purpose takes priority — does the story need the shot at full length? |
| Cross-functional veto vs team output | Cinematographic critic vetoes a shot that the DP approved | XF agent vs Team leader | Showrunner | Quality standard prevails — the critic's threshold is objective and non-negotiable |
| Scope expansion vs budget | Client requests additional scenes not in original brief | Any team vs PM | PM | PM decides with client input — scope changes require budget adjustment or scope trade-off |
| Creative disagreement within team | Two sub-agents in writers room produce conflicting approaches | Sub-agent vs sub-agent | Team leader | Team leader decides based on brief requirements and creative direction |
| Timeline pressure vs quality | PM pushes to deliver faster; showrunner insists on quality gate | PM vs Showrunner | Human expert | Immutable principle #1 applies: quality over speed. Human expert makes final call. |

**Rule:** No conflict bypasses the chain of command. Sub-agents escalate to their leader. Leaders escalate to showrunner (creative) or PM (operational). Unresolvable conflicts go to human expert.
```

- [ ] **Step 2: Verify**

Table has 6 conflict types. Each has example, parties, mediator, and resolution criteria. The rule at the bottom is consistent with the existing "Key structural decisions" section.

---

### Task 6: TEAM_STRUCTURE.md — Add operationalized autonomy framework

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/TEAM_STRUCTURE.md`

- [ ] **Step 1: Add framework section after "Autonomy levels explained"**

Insert after the existing autonomy table:

```markdown
### Operationalized autonomy framework

The autonomy percentages translate to concrete decision-making rules:

| Tier | Range | Rule | Current teams |
|------|-------|------|---------------|
| Full autonomy | 90-100% | Execute and report. No pre-approval needed for any decision within scope. Only escalates if scope boundary is crossed. | Operations (95%) |
| High autonomy | 75-89% | Execute most decisions independently. Must consult when: (a) a decision affects another team's work, (b) budget impact exceeds threshold, (c) client expectations may shift. | Creative (85%), Client (85%), Writers (80%), Cinematography (75%) |
| Guided autonomy | 60-74% | Full technical execution autonomy. All aesthetic and creative decisions require validation from creative director or showrunner before execution. | Audio (70%), Post-production (65%), Art & design (60%) |
| Directed | Below 60% | Executes under explicit direction. Proposes options but does not decide. All outputs reviewed before handoff. | (None currently — reserved for future agents or training mode) |

**How autonomy works in practice:**
- A team at 85% can choose concepts, create moodboards, and define creative direction without asking. But if the concept implies hiring a real actor (budget impact), they must consult PM.
- A team at 65% can choose cutting rhythm, transitions, and pacing. But the final cut still goes through showrunner gates G4 and G5.
- A team at 60% can choose technically optimal compositing techniques. But any aesthetic choice (color treatment, style of graphics) must be validated by the creative director or DP.
```

- [ ] **Step 2: Verify**

Framework has 4 tiers. Every current team maps to exactly one tier. Practical examples are consistent with existing team descriptions in the document.

---

### Task 7: AGENT_REGISTRY.md — Add Phase column to quick reference table

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/AGENT_REGISTRY.md`

- [ ] **Step 1: Add Phase column to the existing table**

Modify the quick reference table to add a Phase column. Assignments:

```markdown
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
| XF-001 | Cinematographic critic | Cross-functional | — | 1 |
| XF-002 | Content compliance | Cross-functional | — | 2 |
| XF-003 | Brand guardian | Cross-functional | — | 2 |
| XF-004 | Accessibility specialist | Cross-functional | — | 3 |
```

Phase counts: Phase 1 = 14 agents, Phase 2 = 10 agents, Phase 3 = 14 agents. Total = 38.

- [ ] **Step 2: Remove the old Autonomy column**

The Autonomy column is removed since autonomy is per-team (documented in TEAM_STRUCTURE.md), not per-agent.

- [ ] **Step 3: Verify**

Table has 38 rows. Phase column sums: 14 + 10 + 14 = 38. No Autonomy column remains.

---

### Task 8: AGENT_REGISTRY.md — Convert to technical reference cards

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/AGENT_REGISTRY.md`

This is the largest task. Replace all narrative agent descriptions with standardized reference cards.

- [ ] **Step 1: Update document header**

Replace the current header with:

```markdown
# CriteriaFilms.com — Agent registry (technical reference)

> Last updated: April 5, 2026
> Total agents: 38 | Phase 1: 14 | Phase 2: 10 | Phase 3: 14
> Format: Technical reference cards — for team structure and communication protocols, see TEAM_STRUCTURE.md
```

- [ ] **Step 2: Rewrite Top-level agents (TL-001, TL-002, TL-003) as reference cards**

Replace the current narrative descriptions with:

```markdown
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
```

- [ ] **Step 3: Rewrite Team 1 agents (T1-L, T1-001, T1-002) as reference cards**

```markdown
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
```

- [ ] **Step 4: Rewrite Team 2 agents (T2-L through T2-006) as reference cards**

```markdown
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
- **Process:** Last filter before script leaves the team. Diagnoses exactly where script loses power and why. Detects clichés, calibrates tone, evaluates timing, performs read-aloud test (detects tongue twisters and broken rhythms). Applies format-specific evaluation criteria (corporate ≠ fiction ≠ explainer).
- **Outputs:** Improvement report with severity levels and specific suggestions
- **Tools/Models:** Script analysis LLM, cliché detection, rhythm analysis, format-specific evaluation rubrics
- **Quality criteria:** Report identifies specific locations (not vague), suggestions are actionable, severity is calibrated (critical vs minor), format-specific criteria are applied
- **Dependencies:** T2-002/003/004/005 (draft script must exist)
- **Replaceable by human:** Yes — script consultant / story editor
```

- [ ] **Step 5: Rewrite Team 3 agents (T3-L through T3-003) as reference cards**

```markdown
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
```

- [ ] **Step 6: Rewrite Team 4 agents (T4-L through T4-002) as reference cards**

```markdown
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
```

- [ ] **Step 7: Rewrite Team 5 agents (T5-L through T5-002) as reference cards**

```markdown
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
```

- [ ] **Step 8: Rewrite Team 6 agents (T6-L through T6-003) as reference cards**

```markdown
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
```

- [ ] **Step 9: Rewrite Team 7 agents (T7-L through T7-003) as reference cards**

```markdown
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
```

- [ ] **Step 10: Rewrite Team 8 agents (T8-L through T8-005) as reference cards**

```markdown
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
- **Process:** Selects and configures AI models per shot type. Manages API integrations (video gen, image gen, voice, music). Maintains storage and processing infrastructure. Monitors performance. Evaluates and integrates tool and model updates. Plans integration with criteria.agency shared services.
- **Outputs:** Infrastructure configuration, API integrations, performance reports, update recommendations
- **Tools/Models:** Infrastructure management, API monitoring, model benchmarking tools
- **Quality criteria:** Infrastructure uptime > 99%, API costs optimized, new models evaluated within 2 weeks of release
- **Dependencies:** None — operates continuously
- **Replaceable by human:** Yes — CTO / technical director

### T8-004: AI cost estimator
- **Phase:** 3
- **Inputs:** Project specs, historical cost data
- **Process:** Calculates cost per shot (tokens/credits per model per generation type). Applies iteration factor (based on history, estimates regenerations per shot type). Estimates human supervision hours per project type. Suggests pricing with smart margin (cost + margin + perceived market value).
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
```

- [ ] **Step 11: Rewrite Cross-functional agents (XF-001 through XF-004) as reference cards**

```markdown
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
```

- [ ] **Step 12: Remove old sections that are now in TEAM_STRUCTURE.md**

Remove the following sections from AGENT_REGISTRY.md (they're already in TEAM_STRUCTURE.md):
- "Agent interaction rules" section (lines 356-361 in original)

The per-team headers like "Team 1: Creative development (3 agents)" should be kept as organizational headers in the registry, but without the narrative about team dynamics.

- [ ] **Step 13: Verify AGENT_REGISTRY.md restructure**

Confirm: (a) 38 reference cards exist, each with exactly 8 fields. (b) No team-level communication rules remain. (c) Quick reference table has Phase column. (d) Document header references TEAM_STRUCTURE.md for structure info.

---

### Task 9: PRODUCTION_PIPELINE.md — Add iteration loops per gate

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PRODUCTION_PIPELINE.md`

- [ ] **Step 1: Add iteration loops section after the "5 showrunner gates" table**

Insert after line 133:

```markdown
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
```

- [ ] **Step 2: Verify**

Section has table with 5 gates. G4 includes diagnostic protocol. G5 specifies surgical fixes. Max iterations decrease from G1 to G5.

---

### Task 10: PRODUCTION_PIPELINE.md — Add estimated time ranges

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PRODUCTION_PIPELINE.md`

- [ ] **Step 1: Add time estimates section**

Insert after the iteration loops section:

```markdown
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
```

- [ ] **Step 2: Verify**

4 project types covered. Each has phase-level breakdowns. Total includes both AI-only and calendar-day estimates.

---

### Task 11: PRODUCTION_PIPELINE.md — Add shared state and artifacts

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PRODUCTION_PIPELINE.md`

- [ ] **Step 1: Add shared state section**

Insert after the time estimates section:

```markdown
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

### Project state machine

```
BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL_LOOK → STORYBOARD → [G3] → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
```

Each state transition is logged with timestamp, agent responsible, and gate decision (if applicable). The PM monitors state transitions to detect stalls.
```

- [ ] **Step 2: Verify**

Table has entries for all 10 steps and 5 gates. Every artifact has a storage path. Write access is restricted (no "All teams" in write column). State machine matches pipeline flow.

---

### Task 12: PRODUCTION_PIPELINE.md — Expand parallel work section

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PRODUCTION_PIPELINE.md`

- [ ] **Step 1: Replace current "Parallel work opportunities" section**

Replace the existing section (lines 232-240) with:

```markdown
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
```

- [ ] **Step 2: Verify**

Hard dependencies table has 5 entries. Soft dependencies table has 6 entries. ASCII diagram is consistent with both tables.

---

### Task 13: Create MVP_ROADMAP.md

**Files:**
- Create: `/Users/juanpa/Agentes/CriteriaFilms 4/MVP_ROADMAP.md`

- [ ] **Step 1: Create the complete document**

```markdown
# CriteriaFilms.com — MVP Roadmap

> Last updated: April 5, 2026
> Phases: 3 | Total agents: 38 (14 → 24 → 38)
> Status: Active — Phase 1 planning

---

## Rollout philosophy

The system launches in 3 phases, adding agents and capabilities incrementally. Each phase must prove itself before advancing to the next. This is not a feature roadmap — it's a capability expansion plan.

**Principle:** A working system with 14 agents producing real videos is infinitely more valuable than a design for 38 agents that hasn't been tested.

---

## Phase 1: Foundation (14 agents)

**Goal:** Produce a corporate/explainer video (1-3 minutes) end-to-end using the agentic pipeline.

### Agents active

| ID | Agent | Role in Phase 1 |
|----|-------|-----------------|
| TL-001 | Project manager | Orchestrates timeline and resources |
| TL-002 | Showrunner | Guards quality via gates G2, G3, G5 |
| TL-003 | Producer | Breakdown, assets, logistics |
| T1-L | Creative director | Concept, creative direction, brief guidance |
| T2-L | Head writer | Directs writing, assigns format |
| T2-002 | AV copywriter | Writes two-column AV scripts (corporate/explainer) |
| T2-006 | Script doctor | Reviews and improves scripts |
| T3-L | Director of photography | Shot specs, storyboard previews |
| T3-003 | Cinematic prompt engineer | Translates specs to AI prompts, generates video |
| T5-L | Sonorizador | VO, music, editorial SFX |
| T6-L | Editor | Assembles timeline, creates cuts |
| T6-003 | Delivery master | Multi-format export and packaging |
| T7-L | Client service | Client communication and feedback |
| XF-001 | Cinematographic critic | Quality scoring and enforcement |

### Gates active

| Gate | Active | Notes |
|------|--------|-------|
| G1 (post-concept) | Simplified | Showrunner reviews concept but no formal project bible yet — a lightweight version instead |
| G2 (post-script) | Full | First formal quality gate |
| G3 (post-storyboard) | Full | Last cheap correction point |
| G4 (first cut) | Simplified | Showrunner reviews but without full cross-functional evaluation |
| G5 (final cut) | Full | Only XF-001 (critic) provides formal evaluation; compliance and brand checks are manual |

### What's NOT in Phase 1

- No project researcher (creative director handles brief enrichment manually)
- No casting director (character consistency managed by prompt engineer)
- No narrative structuralist (head writer creates structure directly)
- No specialized writers beyond AV copywriter (no fiction, documentary, explainer specialist)
- No pre-production colorist (DP handles color direction)
- No camera movement director (DP handles movement)
- No art & design team (no compositing, VFX, or continuity supervision)
- No sound designer or foley artist (sonorizador handles all audio)
- No post colorist or subtitler (editor handles basic grading, subtitles if needed)
- No operations team (manual billing, contracts, infrastructure)
- No onboarding specialist or feedback interpreter (client service handles both)
- No compliance, brand guardian, or accessibility checks (manual)
- No AI filmmaking tutor (school not active)

### Target project types

- Corporate explainer videos (1-3 minutes)
- Social media content (15-60 seconds)
- Simple brand videos

### Advance criteria (all must be met to move to Phase 2)

- [ ] 3 projects completed end-to-end through the pipeline
- [ ] Average cinematographic critic score > 6/10
- [ ] At least 1 project approved by a real client on first delivery
- [ ] Pipeline runs without manual intervention between gates (agents hand off to each other)
- [ ] Average brief-to-delivery time < 7 calendar days for a 2-minute video
- [ ] All 14 agents demonstrably functional and producing useful output

---

## Phase 2: Quality and specialization (+10 agents = 24 total)

**Goal:** Expand project types to include more complex corporate work and first documentary/short film attempts. Activate full quality gate system.

### New agents added

| ID | Agent | Why now |
|----|-------|---------|
| T1-001 | Project researcher | Brief enrichment improves concept quality |
| T1-002 | AI casting director | Character consistency for narrative projects |
| T2-001 | Narrative structuralist | Complex projects need formal structure |
| T2-005 | Explainer writer | Dedicated specialist for educational content |
| T3-001 | Pre-production colorist | Formal color system improves visual consistency |
| T3-002 | Camera movement director | Purposeful camera movement for complex projects |
| T6-001 | Post colorist | Professional color grading across clips |
| T6-002 | Subtitler / localizer | Multi-language delivery capability |
| XF-002 | Content compliance | Formal compliance checks for client protection |
| XF-003 | Brand guardian | Automated brand consistency enforcement |

### Changes from Phase 1

- All 5 gates fully active with formal reviews
- Cross-functional agents XF-002 and XF-003 participate in G5
- Pre-production colorist establishes color system before production
- Camera movement director adds narrative-purposeful movement
- Post colorist unifies grading across all clips

### Target project types

- Complex corporate videos (multiple scenes, characters)
- Explainer and educational content (tutorials, onboarding)
- First documentary attempts (5-10 minutes)
- First narrative short film attempts

### Advance criteria

- [ ] 10 total projects completed (cumulative)
- [ ] Average critic score > 7/10
- [ ] Client first-attempt approval rate > 60%
- [ ] At least 1 documentary or short film completed
- [ ] Compliance and brand checks automated (no manual intervention)
- [ ] Average brief-to-delivery time < 5 calendar days for corporate/explainer

---

## Phase 3: Full system (+14 agents = 38 total)

**Goal:** Activate all agents. Support all project types including fiction, documentary, and school. Prepare for scale.

### New agents added

| ID | Agent | Why now |
|----|-------|---------|
| T2-003 | Fiction writer | Fiction/narrative project support |
| T2-004 | Documentary writer | Dedicated documentary specialist |
| T4-L | Typographer / motion graphics | Professional titles and graphics |
| T4-001 | Compositor / VFX | Multi-layer composition and cleanup |
| T4-002 | Continuity supervisor | Automated raccord checking |
| T5-001 | Sound designer (atmospheres) | Spatial audio and ambient layers |
| T5-002 | Foley artist | Frame-accurate synchronized SFX |
| T7-001 | Onboarding specialist | Automated client onboarding |
| T7-002 | Feedback interpreter | Automated feedback translation |
| T7-003 | AI filmmaking tutor | School launch (business model 3) |
| T8-L | Financial manager | Automated financial management |
| T8-001 | Accountant | Automated invoicing and accounting |
| T8-002 | Legal | Automated contract generation |
| T8-003 | CTO | Infrastructure and model management |
| T8-004 | AI cost estimator | Per-project cost estimation |
| T8-005 | Performance analyst | Production analytics and optimization |
| XF-004 | Accessibility specialist | Automated accessibility checks |

Note: Phase 3 adds 17 agents (not 14) because some agents were deferred from the original Phase 2 count. Final total: 14 + 10 + 14 = 38. Recount: Phase 3 list above has 17 entries. Let me recount phases.

Actually, let me recount: Phase 1 = 14, Phase 2 = 10 (adds to 24), Phase 3 must add 14 to reach 38. The list above has 17 entries — this is wrong. Remove T2-003, T2-004, and T7-003... no. Let me recount the quick reference table from Task 7:

Phase 1 (14): TL-001, TL-002, TL-003, T1-L, T2-L, T2-002, T2-006, T3-L, T3-003, T5-L, T6-L, T6-003, T7-L, XF-001
Phase 2 (10): T1-001, T1-002, T2-001, T2-005, T3-001, T3-002, T6-001, T6-002, XF-002, XF-003
Phase 3 (14): T2-003, T2-004, T4-L, T4-001, T4-002, T5-001, T5-002, T7-001, T7-002, T7-003, T8-L, T8-001, T8-002, T8-003, T8-004, T8-005, XF-004

That's 17 in Phase 3, not 14. Total would be 14+10+17=41, but we only have 38 agents. Let me recount Phase 3: T2-003, T2-004, T4-L, T4-001, T4-002, T5-001, T5-002, T7-001, T7-002, T7-003, T8-L, T8-001, T8-002, T8-003, T8-004, T8-005, XF-004 = 17.

But wait — T8 has 6 agents (T8-L + 5 sub-agents), T7 adds 3 (T7-001, T7-002, T7-003), T4 adds 3 (T4-L, T4-001, T4-002), T5 adds 2 (T5-001, T5-002), T2 adds 2 (T2-003, T2-004), XF adds 1 (XF-004). That's 6+3+3+2+2+1 = 17.

So the header should say Phase 3: 14 agents but actually it's 17. The total is 14+10+14=38 was wrong. It should be 14+10+14=38... but I'm counting 17 in Phase 3.

Let me recount total agents: 3 top-level + 2+7+4+3+3+4+4+6 = 33 team agents + 4 cross-functional = 40? No:
- TL: 3 (TL-001, TL-002, TL-003)
- T1: 3 (T1-L, T1-001, T1-002)
- T2: 7 (T2-L, T2-001 through T2-006)
- T3: 4 (T3-L, T3-001, T3-002, T3-003)
- T4: 3 (T4-L, T4-001, T4-002)
- T5: 3 (T5-L, T5-001, T5-002)
- T6: 4 (T6-L, T6-001, T6-002, T6-003)
- T7: 4 (T7-L, T7-001, T7-002, T7-003)
- T8: 6 (T8-L, T8-001 through T8-005)
- XF: 4 (XF-001 through XF-004)
Total: 3+3+7+4+3+3+4+4+6+4 = 41

But the original docs say 38. Let me check: "3 top-level + 34 in teams + 4 cross-functional = 38" per DEC-004 note. But I count 3+3+7+4+3+3+4+4+6 = 37 in teams (including leaders) + 4 XF = 41 - 3 top-level... no.

The original AGENT_REGISTRY quick reference table has exactly 41 rows. But the header says 38. There's a discrepancy in the original docs. The count in DEC-004 says "3 top-level + 34 in teams + 4 cross-functional = 41" which is not 38 either.

Actually looking again: DEC-004 says "Total agents: 38 (note: earlier count of 36 was before producer was moved to top-level and foley artist was added)." But counting the table: 3 + (3+7+4+3+3+4+4+6) + 4 = 3 + 34 + 4 = 41. That means the "38" count in the original docs is incorrect — there are actually 41 agents.

For the plan, I'll use the actual count from the quick reference table (41 agents) and note the discrepancy.

OK — adjusting the phase distribution: Phase 1 = 14, Phase 2 = 10, Phase 3 = 17. Total = 41.

Let me write the MVP_ROADMAP correctly:

### New agents added (Phase 3)

| ID | Agent | Why now |
|----|-------|---------|
| T2-003 | Fiction writer | Fiction/narrative project support |
| T2-004 | Documentary writer | Dedicated documentary specialist |
| T4-L | Typographer / motion graphics | Professional titles and graphics |
| T4-001 | Compositor / VFX | Multi-layer composition and cleanup |
| T4-002 | Continuity supervisor | Automated raccord checking |
| T5-001 | Sound designer (atmospheres) | Spatial audio and ambient layers |
| T5-002 | Foley artist | Frame-accurate synchronized SFX |
| T7-001 | Onboarding specialist | Automated client onboarding |
| T7-002 | Feedback interpreter | Automated feedback translation |
| T7-003 | AI filmmaking tutor | School launch (business model 3) |
| T8-L | Financial manager | Automated financial management |
| T8-001 | Accountant | Automated invoicing and accounting |
| T8-002 | Legal | Automated contract generation |
| T8-003 | CTO | Infrastructure and model management |
| T8-004 | AI cost estimator | Per-project cost estimation |
| T8-005 | Performance analyst | Production analytics and optimization |
| XF-004 | Accessibility specialist | Automated accessibility checks |

### Target project types

- Fiction short films
- Full documentaries (10-30 minutes)
- Series (multiple episodes)
- AI filmmaking school courses
- All project types with full quality pipeline

### Advance criteria

- [ ] 25 total projects completed (cumulative)
- [ ] At least 1 fiction short film completed
- [ ] School beta launched with 10+ students
- [ ] Operations team functional (automated billing, contracts)
- [ ] System running without human intervention for standard projects
- [ ] Average brief-to-delivery time improving quarter over quarter

---

## Agent count note

The original documentation states 38 agents. A careful count of the agent registry reveals 41 distinct agents. This discrepancy should be resolved — the correct count based on the full registry is 41: 3 top-level + 34 in teams (8 leaders + 26 sub-agents) + 4 cross-functional. The phase distribution is: 14 (Phase 1) + 10 (Phase 2) + 17 (Phase 3) = 41.

---

## Pilot project: First end-to-end test

**Type:** 2-minute corporate explainer video

**Client:** Internal (CriteriaFilms produces a video about its own service) or simulated external client

**Why this type:**
- Exercises the most common project type (business model 1)
- Uses AV copywriter (Phase 1 writer)
- Moderate complexity — enough to test the pipeline without fiction/documentary complications
- Has a real deliverable — can be used on criteriafilms.com

**Success criteria:**
- [ ] All 14 Phase 1 agents participated in production
- [ ] 3 gates (G2, G3, G5) were passed
- [ ] Cinematographic critic scored > 6/10 average
- [ ] Video is watchable and professional quality
- [ ] Total production time < 48 hours (AI processing)
- [ ] Pipeline data captured (times per step, iteration counts, costs)

**What to measure during pilot:**
- Time per pipeline step
- Number of iterations at each gate
- Which agents needed most human intervention
- Total API cost (tokens, credits, compute)
- Subjective quality assessment by the founder

---

## Related documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — 8 teams, chain of command, communication protocols
- `AGENT_REGISTRY.md` — Technical reference cards for all agents
- `PRODUCTION_PIPELINE.md` — Step-by-step production flow with gates
- `TECH_ARCHITECTURE.md` — Technical stack and implementation
- `PORTAL_SPECS.md` — Portal design specifications
- `DECISION_LOG.md` — Chronological log of all key decisions
```

- [ ] **Step 2: Verify**

(a) Agent list per phase is complete — count Phase 1 (14) + Phase 2 (10) + Phase 3 (17) = 41 (with discrepancy note). (b) Each phase has: agent table, active gates, target projects, advance criteria. (c) Pilot project has measurable success criteria. (d) Cross-references are present.

---

### Task 14: Create TECH_ARCHITECTURE.md

**Files:**
- Create: `/Users/juanpa/Agentes/CriteriaFilms 4/TECH_ARCHITECTURE.md`

- [ ] **Step 1: Create the complete document**

```markdown
# CriteriaFilms.com — Technical architecture

> Last updated: April 5, 2026
> Status: Active — Architecture definition phase

---

## Overview

This document defines the technical stack, data model, agent orchestration framework, and infrastructure needed to implement the CriteriaFilms agentic production system. Architecture decisions should be revisited as the system moves through MVP phases.

---

## Agent orchestration

The core technical challenge: coordinating 41 specialized AI agents through a 10-step pipeline with 5 quality gates, handling parallel work, iteration loops, and human override at any point.

### Framework comparison

| Framework | Pros | Cons | Best for | Maturity |
|-----------|------|------|----------|----------|
| **Claude Agent SDK** | Native tool use, sub-agent spawning, built-in context management, strong reasoning | Anthropic-only ecosystem, newer framework | Complex multi-step reasoning agents, quality evaluation agents (showrunner, critic) | Growing — active development |
| **LangGraph** | Stateful graphs, conditional routing, persistence, framework-agnostic | Complex setup, steeper learning curve, can be over-engineered | Pipeline orchestration with complex branching (gate pass/fail routing) | Mature |
| **CrewAI** | Simple multi-agent setup, role-based, easy to prototype | Less control over agent interactions, abstraction can be limiting | Quick prototyping of team-based agent systems | Moderate |
| **Custom orchestrator** | Full control, no framework overhead, tailored to exact needs | Build everything from scratch, maintenance burden | When off-the-shelf frameworks don't fit the specific workflow | N/A |

### Recommended approach

**Hybrid:** Use Claude Agent SDK for individual agents (each agent is a Claude tool-using agent with specialized system prompts and tools) + a custom lightweight orchestrator for the pipeline state machine (manages which step is active, routes gate decisions, handles iteration loops).

**Rationale:**
- Individual agents benefit from Claude's reasoning capabilities (especially showrunner, critic, creative director)
- The pipeline state machine is relatively simple (linear with loops) and doesn't need a heavy framework
- This avoids vendor lock-in on the orchestration layer while leveraging Claude for what it does best

### Orchestration requirements

1. **Pipeline state machine:** Track which step each project is in, which gate it's approaching, how many iterations have occurred
2. **Agent dispatch:** Invoke the correct agent(s) for each step, pass them the right context
3. **Gate routing:** On gate pass → advance. On gate fail → route to correct team for iteration
4. **Parallel coordination:** Manage soft-dependency agents that can start early
5. **Human override:** At any point, pause the pipeline and hand off to a human
6. **3+3 rule enforcement:** Track attempt counts per agent per task, trigger leader adjustment after 3, escalate after 6
7. **Audit trail:** Log every agent invocation, every decision, every gate review

---

## Data model

### Core entities

**Project**
```
project:
  id: uuid
  client_id: uuid
  name: string
  type: enum (corporate, explainer, documentary, fiction, micro_content, commercial)
  status: enum (brief, concept, script, visual_look, storyboard, video_gen, edit, audio, polish, delivered)
  current_gate: enum (none, g1, g2, g3, g4, g5)
  gate_history: [GateReview]
  created_at: datetime
  updated_at: datetime
  brief: Brief
  bible: ProjectBible (nullable, created at G1)
  timeline: Timeline
  budget: Budget
```

**Artifact**
```
artifact:
  id: uuid
  project_id: uuid
  step: enum (brief, concept, g1, script, g2, visual_look, storyboard, g3, video_gen, edit, audio, g4, polish, g5, delivery)
  type: enum (document, image, video, audio, subtitle, package)
  name: string
  version: integer
  storage_path: string
  created_by_agent: agent_id
  created_at: datetime
  metadata: json
```

**GateReview**
```
gate_review:
  id: uuid
  project_id: uuid
  gate: enum (g1, g2, g3, g4, g5)
  iteration: integer
  decision: enum (pass, fail)
  reviewer: agent_id (showrunner)
  scores: json (critic scores if applicable)
  notes: string
  cross_functional_reports: [ComplianceReport]
  created_at: datetime
```

**AgentExecution**
```
agent_execution:
  id: uuid
  project_id: uuid
  agent_id: string
  step: string
  attempt: integer (1-6 for 3+3 rule)
  status: enum (running, completed, failed)
  input_artifacts: [artifact_id]
  output_artifacts: [artifact_id]
  started_at: datetime
  completed_at: datetime
  cost: Cost (tokens, credits, compute time)
  error: string (nullable)
```

**Client**
```
client:
  id: uuid
  name: string
  email: string
  brand_assets: BrandAssets
  projects: [project_id]
  feedback_history: [Feedback]
  created_at: datetime
```

### State machine

```
                    ┌─── fail ───┐
                    │             ▼
BRIEF → CONCEPT → [G1] → SCRIPT → [G2] → VISUAL → STORYBOARD → [G3] → VIDEO_GEN → EDIT → AUDIO → [G4] → POLISH → [G5] → DELIVERED
          ▲         │               ▲       │                      ▲       │                          ▲       │         ▲       │
          └─────────┘               └───────┘                      └───────┘                          └───────┘         └───────┘
            fail                      fail                           fail                              fail (diagnostic)  fail (surgical)
```

Each backward arrow represents an iteration loop. The 3+3 rule applies within each step (agent-level retries). Gate failures trigger step-level iteration.

---

## Recommended stack

### Frontend (3 portals)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Server components for admin dashboard, client portal SSR, shared component library across 3 portals |
| Styling | Tailwind CSS | Rapid prototyping, consistent design system |
| State management | React Server Components + minimal client state | Most data flows server → client; minimize client-side complexity |
| Real-time updates | Server-Sent Events or WebSockets | Pipeline progress updates in admin and client portals |
| Video player | Custom with comment overlay | Client portal needs per-timestamp commenting |

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API | Node.js with Hono or Fastify | Lightweight, fast, TypeScript-native |
| Agent orchestrator | Custom TypeScript state machine | Pipeline state + agent dispatch + gate routing |
| Agent runtime | Claude Agent SDK (TypeScript) | Individual agent implementations |
| Job queue | BullMQ (Redis-backed) | Agent task queuing, retry handling, 3+3 rule |
| Auth | NextAuth.js or Clerk | Multi-portal auth with role-based access |

### Data

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Primary database | PostgreSQL | Relational data (projects, clients, artifacts, gate reviews) |
| ORM | Drizzle or Prisma | Type-safe database access |
| Cache | Redis | Session data, job queue, real-time state |
| File storage | S3-compatible (AWS S3 or Cloudflare R2) | Video, image, audio, document storage |
| Vector store | (Phase 2+) pgvector or Pinecone | Pattern library for prompt engineer, preference learning |

### AI models by task type

| Task type | Recommended models | Used by agents |
|-----------|-------------------|---------------|
| Text generation (scripts, analysis, evaluation) | Claude Sonnet/Opus | Most agents — writing, analysis, evaluation |
| Image generation (storyboards, character sheets, assets) | Flux, Midjourney, DALL-E 3 | T3-L, T3-003, T1-002, TL-003 |
| Video generation | Runway Gen-3/4, Kling, Sora, Veo | T3-003 (primary execution agent) |
| Voice generation | ElevenLabs, PlayHT | T5-L |
| Music generation | Suno, Udio | T5-L |
| Sound effects | ElevenLabs SFX, Stable Audio | T5-001, T5-002 |
| Transcription/subtitles | Whisper | T6-002 |

**Model selection is dynamic:** The CTO agent (T8-003) evaluates new models as they release and recommends updates. The prompt engineer (T3-003) maintains per-model vocabulary.

---

## Infrastructure

### Hosting

| Component | Recommended | Alternative |
|-----------|-------------|-------------|
| Frontend (3 portals) | Vercel | Cloudflare Pages |
| Backend API | Railway or Fly.io | AWS ECS |
| Database | Neon (serverless PostgreSQL) | Supabase |
| Redis | Upstash | Redis Cloud |
| File storage | Cloudflare R2 | AWS S3 |
| Background jobs | Railway (same as API) | AWS Lambda |

### Monitoring

- **Application:** Sentry (error tracking)
- **Infrastructure:** Grafana Cloud or Datadog
- **Agent performance:** Custom dashboard tracking execution times, costs, success rates per agent
- **Pipeline health:** Custom dashboard showing projects in each state, gate pass rates, iteration counts

### Cost structure

| Cost type | Category | Notes |
|-----------|----------|-------|
| **Fixed (monthly)** | Hosting, database, Redis, monitoring | ~$50-200/month for Phase 1 |
| **Variable (per project)** | AI model API calls (video gen is most expensive), storage | Dominant cost — scales with project volume |
| **Key cost driver** | Video generation (Runway, Kling, Sora credits) | Each generated shot costs credits; iterations multiply cost |
| **Cost optimization** | 3+3 rule limits iterations; early gates prevent expensive late-stage rework | Built into the architecture |

### Cost estimation per project type (rough)

| Project type | Estimated AI API cost | Notes |
|-------------|----------------------|-------|
| Corporate explainer (2 min) | $20-50 | ~10-20 shots, 1-2 iterations avg |
| Micro-content (30s) | $5-15 | 3-8 shots |
| Documentary (10 min) | $100-300 | 40-100 shots, higher iteration rate |
| Complex commercial | $50-150 | Fewer shots but higher quality bar |

These are AI API costs only. Human supervision, infrastructure, and margins are additional.

---

## criteria.agency integration plan

Team 8 (Operations & Finance) is designed as a separable module (DEC-014). Integration path:

1. **Phase 1:** Team 8 functions are manual. No integration needed.
2. **Phase 2:** Implement Team 8 agents. Design their APIs as standalone services from the start.
3. **Phase 3:** Extract Team 8 as shared microservices. Shared auth (SSO), shared billing, shared CRM between criteriafilms.com and criteria.agency.

**Shared services candidates:**
- Authentication / SSO (one login for all criteria properties)
- Billing and invoicing (T8-001)
- Legal / contract management (T8-002)
- Analytics (T8-005)
- Storage infrastructure (T8-003)

---

## Related documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — 8 teams, chain of command, communication protocols
- `AGENT_REGISTRY.md` — Technical reference cards for all agents
- `PRODUCTION_PIPELINE.md` — Step-by-step production flow with gates
- `MVP_ROADMAP.md` — Phased rollout plan
- `PORTAL_SPECS.md` — Portal design specifications
- `DECISION_LOG.md` — Chronological log of all key decisions
```

- [ ] **Step 2: Verify**

(a) Orchestrator comparison has 4 options with pros/cons. (b) Data model has 5 entities with typed fields. (c) Stack covers frontend, backend, data, AI models, infrastructure. (d) Cost estimates exist per project type. (e) Integration plan references DEC-014. (f) Cross-references present.

---

### Task 15: Create PORTAL_SPECS.md

**Files:**
- Create: `/Users/juanpa/Agentes/CriteriaFilms 4/PORTAL_SPECS.md`

- [ ] **Step 1: Create the complete document**

```markdown
# CriteriaFilms.com — Portal specifications

> Last updated: April 5, 2026
> Portals: 3 (public, client, admin)
> Status: Active — Specification phase

---

## Portal architecture

Three separate portals sharing a common backend and authentication system. Each portal has a distinct purpose and user base.

```
                    ┌──────────────────┐
                    │   Shared Auth    │
                    │   (SSO/roles)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
      ┌───────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
      │ Public Portal│ │  Client  │ │    Admin    │
      │ (marketing)  │ │  Portal  │ │   Portal    │
      │              │ │(projects)│ │(production) │
      └──────────────┘ └──────────┘ └─────────────┘
```

---

## Public portal

**Purpose:** Marketing, portfolio showcase, lead generation, school access.

**URL:** criteriafilms.com

### Pages

| Page | Purpose | Key elements |
|------|---------|-------------|
| Landing | First impression, value proposition | Hero video (produced by CriteriaFilms), services overview, social proof |
| Portfolio | Showcase completed work | Filterable gallery by type (corporate, documentary, fiction), video player, case studies |
| Services | Detail service offerings | 3 service tiers or packages, comparison table, pricing starting points |
| About | Team and methodology | Story, methodology (agentic production), quality promise |
| Blog / School | Content marketing + education portal | Articles, tutorials, course listings (business model 3) |
| Contact | Lead capture | Contact form with project type selector, budget range, timeline |

### Onboarding flow

```
Visitor → Landing page → Services/Portfolio → Contact form → Qualification call (or automated) → Account creation → Client portal access → First brief
```

### Technical notes
- Static pages where possible (SSG for performance and SEO)
- Blog/school section may be a separate subdomain (school.criteriafilms.com)
- Portfolio videos hosted on CDN for fast playback

---

## Client portal

**Purpose:** Project management from the client's perspective. Create briefs, upload files, review deliverables, provide feedback.

**URL:** app.criteriafilms.com (or clients.criteriafilms.com)

**Access:** Authenticated clients only. Each client sees only their own projects.

### Main screens

| Screen | Purpose | Key elements |
|--------|---------|-------------|
| Dashboard | Overview of all projects | Project cards with status indicator (mapped to pipeline step), quick actions |
| New brief | Create a new project | Guided conversational interface (powered by Creative Director agent), file upload, reference links |
| Project detail | Deep view of one project | Pipeline progress bar, current status, deliverables by phase, comment threads |
| Deliverable review | Review a specific deliverable | Full-screen viewer (video player / image viewer / document viewer), commenting interface |
| File upload | Add reference materials | Drag-and-drop upload to temporary drive (15-day retention with visible countdown) |
| Account / Profile | Manage account | Brand assets, preferences, billing history |

### Brief creation flow

```
Client clicks "New Project"
    → Type selection (corporate, explainer, documentary, etc.)
    → Guided questions (conversational, powered by Creative Director agent):
        - What's the video for? (objective)
        - Who's the audience?
        - Key messages (1-3)
        - Tone and style preferences
        - Duration preference
        - Reference examples (upload or links)
        - Budget range
        - Timeline
    → Brief summary for client review
    → Client confirms → Brief enters pipeline
```

### Deliverable review and commenting

**Commentable elements:**

| Element | How client sees it | Comment format | Routes to |
|---------|-------------------|---------------|-----------|
| Script | Two-column or formatted text view | Inline comments on specific paragraphs/lines | Team 2 (via T7-002 feedback interpreter) |
| Breakdown | Table of characters, locations, props | Comments on specific items | Producer |
| Style / Moodboard | Image gallery with descriptions | Comments on specific images | Team 1 (Creative Director) |
| Schedule | Timeline/Gantt view | Comments on milestones | PM |
| Storyboard | Image grid with AV text, audio and visual icons | Comments on specific frames | Teams 3/4 |
| Final video | Video player with timestamp markers | Timestamp-anchored comments | Team 6 (Editor, via T7-002) |

**Comment flow:**
1. Client adds comment on element
2. Comment appears in admin portal, tagged to project + element + specific location
3. T7-002 (feedback interpreter) translates vague comments to actionable instructions
4. PM routes instructions to correct team
5. Team makes corrections
6. Updated deliverable appears in client portal
7. Client reviews again (notification sent)

### File upload

- Drag-and-drop interface
- Accepted formats: images (PNG, JPG, PSD), video (MP4, MOV), audio (MP3, WAV), documents (PDF, DOCX)
- 15-day retention with visible countdown timer
- Size limit: 500MB per file, 2GB per project
- Files are accessible to all production teams via artifact storage

---

## Admin portal

**Purpose:** Full production management. Pipeline visualization, agent orchestration, quality control, client management, billing.

**URL:** admin.criteriafilms.com

**Access:** Internal team only (human experts, PM role).

### Main screens

| Screen | Purpose | Key elements |
|--------|---------|-------------|
| Command center | All projects at a glance | Kanban board (columns = pipeline steps), filters by status/client/type/team |
| Project detail | Deep production view | Full pipeline with agent status, gate reviews, artifacts, iteration history, costs |
| Agent dashboard | Monitor agent performance | Active agents, execution times, success rates, 3+3 rule progress, cost per agent |
| Gate review | Conduct or review gate decisions | Showrunner evaluation interface, critic scores, cross-functional reports, pass/fail with notes |
| Client comments | View and manage all feedback | Comments organized by project → element → priority, translation status, routing status |
| Billing | Financial overview | Invoices, project costs, revenue, margins per project and aggregate |
| Client management | Manage client accounts | Client list, brand assets, project history, satisfaction metrics |
| Settings | System configuration | Agent configurations, model selections, quality thresholds, notification rules |

### Pipeline visualization

The command center shows a Kanban-style board:

```
| Brief | Concept | [G1] | Script | [G2] | Visual | Storyboard | [G3] | VideoGen | Edit | Audio | [G4] | Polish | [G5] | Delivered |
|-------|---------|------|--------|------|--------|------------|------|----------|------|-------|------|--------|------|-----------|
| Proj-A|         |      |        |      |        |            |      | Proj-C   |      |       |      |        |      | Proj-F    |
|       |         |      |Proj-B  |      |        |            |      |          |      |       |      |Proj-E  |      |           |
|       |         |      |        |      |        | Proj-D     |      |          |      |       |      |        |      |           |
```

Each project card shows: client name, project type, days in current step, iteration count, assigned agents.

Gate columns are highlighted — clicking shows the gate review interface.

### Agent orchestration view

For each active agent:
- Current task and project
- Attempt number (1-6 per 3+3 rule)
- Execution time
- Input artifacts consumed
- Output artifacts produced (or in progress)
- Cost accumulated

**Alert triggers:**
- Agent stuck (execution time > 2x average)
- 3+3 rule: attempt 4 triggered (leader adjustment happening)
- 3+3 rule: attempt 6 failed (human escalation needed)
- Gate failed 2+ times on same project
- Budget exceeded threshold

---

## Permission matrix

| Action | Public visitor | Registered client | Team leader agent | Sub-agent | PM | Showrunner | Admin human |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View public site | Yes | Yes | — | — | Yes | Yes | Yes |
| Create account | Yes | — | — | — | — | — | Yes |
| Create brief | — | Yes | — | — | Yes | — | Yes |
| Upload files | — | Yes | — | — | Yes | — | Yes |
| View own projects | — | Yes | — | — | Yes | — | Yes |
| Comment on deliverables | — | Yes | — | — | Yes | — | Yes |
| View all projects | — | — | Own team | — | Yes | Teams 1-6 | Yes |
| Edit project artifacts | — | — | Own team | Own task | Yes | — | Yes |
| Conduct gate review | — | — | — | — | — | Yes | Yes |
| Override agent decision | — | — | — | — | Yes | Yes | Yes |
| Approve final delivery | — | Yes | — | — | Yes | Yes | Yes |
| View billing | — | Own invoices | — | — | Yes | — | Yes |
| Manage clients | — | — | — | — | Yes | — | Yes |
| Configure agents | — | — | — | — | — | — | Yes |
| View agent dashboard | — | — | — | — | Yes | Yes | Yes |

---

## Related documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — 8 teams, chain of command, communication protocols
- `AGENT_REGISTRY.md` — Technical reference cards for all agents
- `PRODUCTION_PIPELINE.md` — Step-by-step production flow with gates
- `MVP_ROADMAP.md` — Phased rollout plan
- `TECH_ARCHITECTURE.md` — Technical stack and implementation
- `DECISION_LOG.md` — Chronological log of all key decisions
```

- [ ] **Step 2: Verify**

(a) All 3 portals have page/screen tables. (b) Permission matrix has 7 user types and 14 actions. (c) Commentable elements spec covers all 6 elements from PRODUCTION_PIPELINE. (d) File upload mentions 15-day retention. (e) Cross-references present.

---

### Task 16: DECISION_LOG.md — Replace "Vigent" with "Active"

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/DECISION_LOG.md`

- [ ] **Step 1: Find and replace all instances of "Vigent"**

Use replace-all to change every occurrence of `Vigent` to `Active` in the file. There should be approximately 15 instances (one per DEC entry status field).

- [ ] **Step 2: Verify**

Zero occurrences of "Vigent" in the file.

---

### Task 17: DECISION_LOG.md — Add session 2 decisions

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/DECISION_LOG.md`

- [ ] **Step 1: Add session 2 header and 4 new decisions**

Add after the last Session 1 entry:

```markdown
---

## Session 2 — April 5, 2026: Documentation overhaul

### DEC-016: MVP phased rollout (3 phases)

- **Context:** Cannot launch all agents simultaneously. Need an incremental path from current state (manual AI production) to full system.
- **Decision:** 3-phase rollout: Phase 1 (14 agents, core pipeline), Phase 2 (+10, quality expansion), Phase 3 (+17, full system). Each phase must meet advance criteria before expanding.
- **Alternatives considered:** Big bang launch (rejected — too risky, no way to validate assumptions); 2-phase only (rejected — jump from 14 to full is too large).
- **Impact:** Defines MVP_ROADMAP.md. All agents assigned to a phase. Implementation starts with Phase 1.
- **Status:** Active.

### DEC-017: Agent registry restructured as technical reference cards

- **Context:** AGENT_REGISTRY had narrative descriptions overlapping with TEAM_STRUCTURE. Hard to scan, redundant information.
- **Decision:** Convert to standardized reference cards with 8 fields: Phase, Inputs, Process, Outputs, Tools/Models, Quality criteria, Dependencies, Replaceable by human. Remove team structure info (lives in TEAM_STRUCTURE.md).
- **Alternatives considered:** Keep narrative format with deduplication only (rejected — still hard to scan for quick lookup).
- **Impact:** AGENT_REGISTRY becomes a technical lookup tool. TEAM_STRUCTURE becomes the single source for organizational info.
- **Status:** Active.

### DEC-018: Three new master documents added

- **Context:** Original 5 docs are insufficient for implementation. Missing: phased rollout plan, technical architecture, portal specifications.
- **Decision:** Add MVP_ROADMAP.md, TECH_ARCHITECTURE.md, PORTAL_SPECS.md. Total master documents: 8 (exceeding the 7 originally planned in DEC-015 because MVP_ROADMAP was not anticipated).
- **Alternatives considered:** Embedding this content in existing docs (rejected — would make existing docs too long and lose focus).
- **Impact:** Completes the documentation system needed for implementation.
- **Status:** Active.

### DEC-019: Agent count corrected to 41

- **Context:** Original documentation stated 38 agents. Careful count of the agent registry reveals 41 distinct agents: 3 top-level + 34 in teams (8 leaders + 26 sub-agents) + 4 cross-functional.
- **Decision:** Correct agent count to 41 across all documents. Phase distribution: 14 (Phase 1) + 10 (Phase 2) + 17 (Phase 3) = 41.
- **Alternatives considered:** Consolidating agents to reach 38 (rejected — all 41 agents serve distinct purposes).
- **Impact:** All documents updated to reflect correct count.
- **Status:** Active.
```

- [ ] **Step 2: Update the pending decisions section**

Replace the current pending decisions list with:

```markdown
## Pending decisions (to be made in future sessions)

- Admin portal agent integration specifics (how agents are configured and monitored in the UI)
- Client portal commenting system UX details (wireframes, interaction design)
- Final technical stack selection (pending prototype validation)
- AI model selection per agent (pending benchmarking)
- Deployment pipeline and CI/CD setup
- Pricing model for each business model (packages, per-project, retainer rates)
- School curriculum structure and course design
- criteria.agency shared services implementation timeline
```

- [ ] **Step 3: Verify**

(a) 4 new DEC entries exist with sequential IDs (016-019). (b) Each has all 5 fields. (c) All use "Active" not "Vigent". (d) Pending list is updated (removed items now covered by new docs).

---

### Task 18: PROJECT_VISION.md — Update cross-references

**Files:**
- Modify: `/Users/juanpa/Agentes/CriteriaFilms 4/PROJECT_VISION.md`

- [ ] **Step 1: Update the "Related documents" section**

Replace the current section with:

```markdown
## Related documents

- `TEAM_STRUCTURE.md` — 8 teams, chain of command, communication protocols, conflict resolution
- `AGENT_REGISTRY.md` — Technical reference cards for all 41 agents with phases and dependencies
- `PRODUCTION_PIPELINE.md` ��� Step-by-step production flow with 5 gates, iteration loops, time estimates
- `MVP_ROADMAP.md` — 3-phase rollout plan (14 → 24 → 41 agents) with advance criteria
- `TECH_ARCHITECTURE.md` — Technical stack, data model, agent orchestration, infrastructure
- `PORTAL_SPECS.md` — Public, client, and admin portal specifications
- `DECISION_LOG.md` — Chronological log of all key decisions
```

- [ ] **Step 2: Update agent count in document**

If any remaining reference to "38 agents" exists in PROJECT_VISION.md after Tasks 1-4, update to "41 agents". (The System overview section was removed in Task 1, so this may not be needed.)

- [ ] **Step 3: Verify**

Related documents section lists exactly 7 documents. None have "(pending)" markers. MVP_ROADMAP.md, TECH_ARCHITECTURE.md, and PORTAL_SPECS.md are all included.

---

## Verification checklist (run after all tasks complete)

- [ ] No information duplicated between TEAM_STRUCTURE.md and AGENT_REGISTRY.md
- [ ] PROJECT_VISION.md contains no system-level details (those are in other docs)
- [ ] All cross-references between documents are correct (7 docs reference each other)
- [ ] DECISION_LOG.md reflects all decisions (DEC-001 through DEC-019)
- [ ] Zero instances of "Vigent" in any document
- [ ] Agent count is consistent: 41 agents across all documents
- [ ] All 41 agents are assigned to exactly one phase (14 + 10 + 17 = 41)
- [ ] Phase assignments in AGENT_REGISTRY.md match MVP_ROADMAP.md
- [ ] PRODUCTION_PIPELINE.md has iteration loops, time estimates, shared state, and expanded parallel work
- [ ] TECH_ARCHITECTURE.md has orchestrator comparison, data model, stack, infra, and integration plan
- [ ] PORTAL_SPECS.md has all 3 portals, permission matrix, and commentable elements spec
