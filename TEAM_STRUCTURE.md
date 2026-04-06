# CriteriaFilms.com — Team structure

> Last updated: April 5, 2026
> Teams: 9 | Top-level: 3 | Cross-functional: 4 | Total agents: 47

---

## Chain of command

```
Human expert (final escalation)
  └── Project manager (timelines, resources, dependencies)
        ├── Showrunner (vision, coherence, quality — authority over teams 1-6)
        │     ├── Team 1: Creative development (3 agents)
        │     ├── Team 2: Writers room (7 agents)
        │     ├── Team 3: Cinematography (4 agents)
        │     ├── Team 4: Art & design (3 agents)
        │     ├── Team 5: Audio (3 agents)
        │     └── Team 6: Post-production (4 agents)
        ├── Team 7: Client experience (4 agents) — reports to PM, not showrunner
        ├── Team 8: Operations & finance (6 agents) — reports to PM, not showrunner
        ├── Team 9: AI Model Intelligence (6 agents) — reports to PM, not showrunner
        └── Producer (breakdown, assets, logistics — works across all teams)

Cross-functional (report to showrunner + PM, veto power):
  ├── Cinematographic critic
  ├── Content compliance
  ├── Brand guardian
  └── Accessibility specialist
```

---

## Team composition

### Team 1: Creative development — 3 agents

- **Leader:** Creative director
- **Sub-agents:** Project researcher, AI casting director
- **Autonomy:** 85%
- **What they can decide alone:** Concepts, creative direction, casting, moodboards
- **What requires approval:** Anything that affects budget (escalate to PM) or anything the client rejects (iterate with showrunner)
- **Peak workload:** Early project (pre-script)
- **Handoff to:** Team 2 (enriched brief + approved concept)

### Team 2: Writers room — 7 agents

- **Leader:** Head writer (guionista jefe)
- **Sub-agents:** Narrative structuralist, AV copywriter, fiction writer, documentary writer, explainer writer, script doctor
- **Autonomy:** 80%
- **What they can decide alone:** Script structure, format, specialist assignment, internal revision cycles
- **What requires approval:** Final script requires showrunner G2 approval + creative director sign-off
- **Activation:** Head writer activates only the specialist needed for each project type
- **Handoff to:** Showrunner (for G2 gate), then team 3 (approved script)

### Team 3: Cinematography — 4 agents

- **Leader:** Director of photography (DP)
- **Sub-agents:** Pre-production colorist, camera movement director, cinematic prompt engineer
- **Autonomy:** 75%
- **What they can decide alone:** All technical decisions (framing, lens, light, movement, model selection)
- **What requires approval:** Consults creative director to validate visual proposal serves the narrative
- **Key sub-agent:** Prompt engineer is the DP's execution arm — translates all technical decisions into AI prompts
- **Handoff to:** Team 4 (storyboard previews), team 6 (generated clips)

### Team 4: Art & design — 3 agents

- **Leader:** Typographer / motion graphics
- **Sub-agents:** Compositor / VFX, continuity supervisor
- **Autonomy:** 60%
- **What they can decide alone:** Technical execution within style guidelines
- **What requires approval:** All aesthetic decisions must align with creative director and DP vision. Has technical veto (if something isn't visually feasible, they say so)
- **Handoff to:** Team 6 (composited elements, graphics, continuity reports)

### Team 5: Audio — 3 agents

- **Leader:** Sonorizador (sound lead)
- **Sub-agents:** Sound designer (atmospheres), foley artist / SFX synchronizer
- **Autonomy:** 70%
- **What they can decide alone:** Sonic palette, VO style, SFX density, internal mix
- **What requires approval:** Consults creative director for emotional tone alignment
- **Key distinction:** Sonorizador handles editorial audio (VO, music, editorial SFX). Sound designer handles atmospheres and spatiality. Foley artist handles diegetic SFX synced to visual events. Three complementary layers.
- **Handoff to:** Team 6 (audio tracks for final mix)

### Team 6: Post-production — 4 agents

- **Leader:** Editor
- **Sub-agents:** Post colorist, subtitler/localizer, delivery master
- **Autonomy:** 65%
- **What they can decide alone:** Cutting rhythm, transitions, color matching, subtitle timing, delivery formats
- **What requires approval:** Final cut requires showrunner G4 and G5 approval. Editor can request shot re-generation from team 3.
- **Handoff to:** Showrunner (for G4/G5), then client portal (via team 7)

### Team 7: Client experience — 4 agents

- **Leader:** Client service
- **Sub-agents:** Onboarding specialist, feedback interpreter, AI filmmaking tutor
- **Autonomy:** 85%
- **What they can decide alone:** All client communication, onboarding flow, feedback processing
- **What requires escalation:** Scope changes affecting budget, expectation conflicts
- **Reports to:** PM directly (not showrunner — client communication is operational, not creative)
- **Special note:** AI filmmaking tutor is the core agent for business model 3 (school)

### Team 8: Operations & finance — 6 agents

- **Leader:** Financial manager
- **Sub-agents:** Accountant, legal, CTO, AI cost estimator, performance analyst
- **Autonomy:** 95%
- **What they can decide alone:** Almost everything — invoicing, reports, contracts, infrastructure
- **What requires escalation:** Only interacts with projects when PM requests quotation or when budget is exceeded
- **Shared services candidate:** This entire team can be separated as shared microservices with criteria.agency
- **Model expertise transfer:** As of session 2, AI model selection and per-model cost knowledge have been transferred to Team 9 (AI Model Intelligence). CTO retains infrastructure, APIs, and deployment. Cost estimator retains pricing, margins, and quotations.

### Team 9: AI Model Intelligence — 6 agents

- **Leader:** AI Model Director
- **Sub-agents:** Text Model Specialist, Image Model Specialist, Video Model Specialist, Audio Model Specialist, Model Benchmarker / Evaluator
- **Autonomy:** 80%
- **What they decide alone:** Model selection per task, benchmark methodology, skill documentation content, model catalog maintenance
- **What requires approval:** Budget-impacting model changes (new API subscriptions), deprecating a model from the approved list
- **Reports to:** PM (operational), consults Showrunner (creative quality implications)
- **Handoff to:** All teams (model recommendations and skills are consumed by every production team)
- **Special note:** Transversal knowledge team — not creative, not operational, but enabling. Maintains the intelligence layer that all production agents consume when using AI models.

---

## Communication protocols

### 1. Handoff (H) — Formal delivery between teams

When a team completes its phase, it generates a standardized delivery package.

**Standard handoff format:**

```
team_origin: [team name]
team_destination: [team name]
type: handoff
phase: [phase name]
outputs:
  - [file list]
decisions:
  - [key decisions made during this phase]
notes_for_next:
  - [specific guidance for receiving team]
critic_score: [if applicable]
approved_by: [leader name]
```

The receiving team leader reviews and accepts or rejects with specific feedback.

### 2. Request (R) — Out-of-sequence ask between teams

When a team needs something from another team outside the normal pipeline flow.

**Contents:** What is needed, why, by when, priority level.

**Rule:** Leader to leader only. The PM sees all requests to detect bottlenecks.

**Example:** Editor requests DP to re-generate a shot because it doesn't work for the planned cut.

### 3. Veto (V) — Quality block

Only cross-functional agents can issue a veto.

**Effect:** Pauses the pipeline until resolved.

**Contents:** What is vetoed, why, what is needed to unblock.

**Resolution:** The showrunner mediates.

**Example:** Cinematographic critic vetoes a shot with score below 6/10, specifies that the angle needs to be lower and contrast higher.

### 4. Sync (S) — Periodic alignment

Automatic alignment at each showrunner gate and at key pipeline points.

**Participants:** All team leaders + PM + showrunner.

**Each leader reports:** Status, risks, dependencies.

**Replaces:** The "production meeting" from traditional filmmaking.

### 5. Escalation (E) — To human

Triggered after 3+3 rule exhausted (6 failed attempts).

**Contents:** Complete context, previous attempts, recommended options for the human to decide quickly.

**Chain:** Sub-agent → leader → PM → human.

**Showrunner role in escalation:** Diagnoses WHAT type of human is needed (human writer? human colorist? human editor?) — more precise diagnosis than PM because showrunner understands the creative problem.

---

## The 3+3 rule

```
Attempts 1-3: Sub-agent tries with original parameters
    ↓ (if all 3 fail quality threshold)
Leader adjusts parameters (different prompt, model, approach)
    ↓
Attempts 4-6: Sub-agent tries with adjusted parameters
    ↓ (if all 3 fail again)
Escalation to PM → human expert
```

This means the system attempts 6 times before asking for human help: 3 with original parameters, 3 with leader-adjusted parameters. This maximizes automation without sacrificing quality.

**Data value:** Over time, this produces data on which tasks AI handles well and which need humans — invaluable for system optimization.

---

## Autonomy levels explained

| Team | Autonomy | Meaning |
|------|----------|---------|
| Operations (T8) | 95% | Almost fully independent. Only interacts with projects for billing or budget issues. |
| Creative (T1) | 85% | Maximum creative freedom. Only consults PM for budget, showrunner for vision alignment. |
| Client (T7) | 85% | Full control of client relationship. Only escalates scope/budget conflicts. |
| Writers (T2) | 80% | High. Internal revision cycles are autonomous. Final script needs showrunner + creative director approval. |
| AI Model Intelligence (T9) | 80% | High. Decides which models to use and maintains skills autonomously. Consults PM for budget-impacting model changes. |
| Cinematography (T3) | 75% | High technical autonomy. Consults creative director to validate visuals serve the narrative. |
| Audio (T5) | 70% | Defines sonic palette autonomously. Consults creative director for emotional tone. |
| Post (T6) | 65% | Editor has creative power over rhythm and structure, but final cut approved by showrunner. |
| Art (T4) | 60% | Executes vision of other teams. Full technical autonomy but not creative autonomy. |

### Autonomy tiers — practical guide

| Tier | Range | Behavior | Example |
|------|-------|----------|---------|
| Full autonomy | 90-100% | Executes and reports. No prior approval needed. | T8 (Operations): processes invoice, generates financial report, manages infrastructure — informs PM after the fact. |
| High autonomy | 75-89% | Executes most tasks. Consults for decisions affecting other teams or budget. | T1 (Creative): develops concept freely, but checks with PM before proposing options that exceed budget, checks with showrunner if concept deviates from project bible. |
| Guided autonomy | 60-74% | Full technical autonomy. Creative/aesthetic decisions require validation. | T5 (Audio): selects SFX tools and mixing approach freely, but sonic palette and music style confirmed by creative director. |
| Directed autonomy | <60% | Executes under direction. Proposes but does not decide. | T4 (Art): executes compositing and VFX per specs from DP and creative director. Can flag technical impossibilities but doesn't choose aesthetic direction. |

---

## Key structural decisions

1. **Showrunner is above teams, not inside one.** Maintains objectivity across all creative teams.
2. **Creative director generates ideas, showrunner evaluates execution.** Separation of creation and evaluation prevents bias.
3. **Cross-functional agents are independent.** Not inside any team — prevents conflict of interest (the critic can't be pressured by the DP to lower standards).
4. **Producer is top-level, not a team leader.** Works across all teams managing resources and logistics.
5. **Teams 7 and 8 report to PM, not showrunner.** Client communication and operations are not creative decisions.
6. **Sub-agents never communicate cross-team.** All inter-team communication goes leader-to-leader. This prevents contradictory messages and maintains clear accountability.
7. **Team 9 is transversal, not creative.** AI model intelligence is technical knowledge that serves all teams. It reports to PM (like T7 and T8) because model decisions are operational enablers, not creative choices — though T9 consults the showrunner when model capabilities affect creative quality.

---

## Conflict resolution matrix

| Conflict type | Parties | Mediator | Resolution criteria |
|--------------|---------|----------|-------------------|
| Creative vs feasibility | Creative director vs DP or Art lead | Showrunner | Does the creative vision have a technically viable path? If yes, creative wins. If no viable path after 2 attempts, feasibility wins. |
| Edit vs shot quality | Editor vs DP | Showrunner | Does the shot serve the edit? Editor has priority on rhythm; DP can request one re-edit attempt before yielding. |
| Cross-functional veto vs team | XF agent vs any team leader | Showrunner | XF veto stands unless team leader provides evidence the criteria is met. Showrunner reviews evidence and decides. |
| Scope vs budget | Any team vs PM | PM with client input | PM calculates cost impact. If within buffer (≤10%), PM approves. If above, client decides. |
| Within-team disagreement | Sub-agent vs leader | Team leader (final say) | Leader decides. Sub-agent can escalate to PM only if leader's decision violates a quality gate criterion. |
| Timeline vs quality | PM vs Showrunner | Human expert | Showrunner presents minimum quality threshold. PM presents deadline impact. Human decides trade-off. |

---

## Human-AI substitution

Any agent can be replaced by a human without changing the structure. When a human replaces an agent:

- They occupy the exact same position (sub-agent or leader)
- Their interface with the team leader (or PM/showrunner if they ARE the leader) doesn't change
- Other sub-agents in the team continue functioning normally
- The handoff format remains the same

**Highest priority for human substitution:** Creative director (T1-L), editor (T6-L), DP (T3-L) — the roles where human judgment and experience have the most impact on quality.
