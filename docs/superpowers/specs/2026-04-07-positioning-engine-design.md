# criteria.agency — Positioning Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Positioning capabilities (C-048, C-049): Positioning Diagnosis & Definition, Strategic Repositioning

---

## 1. Objective

Build the **Positioning Engine** — a project-based motor that diagnoses how a brand is currently perceived vs how it wants to be perceived, defines or refines its positioning, and when needed, executes a controlled repositioning transition. This builds on top of Brand Builder (C-006) and Strategist (C-001-C-005) but focuses specifically on the positioning problem.

| Capability | What it delivers |
|-----------|-----------------|
| C-048: Diagnóstico y definición de posicionamiento | Perception gap analysis, positioning statement, value proposition, competitive frame |
| C-049: Reposicionamiento estratégico | Phased transition plan from current to desired positioning without losing existing brand equity |

**Dependency chain:** C-048 depends on Brand Builder (Brand DNA) + Intelligence (Brand Listener perception data, Competitive Listener competitive map). C-049 depends on C-048 output + all production/distribution motors for execution.

---

## 2. Architecture

### Two pipeline modes

**Mode 1: Positioning Diagnosis (C-048)** — Project pipeline
```
[perception_audit] → [gap_analysis] → [G1] → [positioning_definition] → [validation] → [G2: human] → [documented]
```

**Mode 2: Repositioning (C-049)** — Extended pipeline with execution plan
```
[current_audit] → [target_definition] → [G1] → [transition_plan] → [phase_design] → [G2: human] → [execution_monitoring]
```

---

## 3. Agents

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| PO-L | Positioning Strategist | leader | gap analysis, positioning definition, transition plan | claude-sonnet-4 | 70% |
| PO-001 | Perception Auditor | sub | perception audit, current audit | gemini-2.5-flash | 85% |
| PO-002 | Competitive Mapper | sub | competitive frame analysis | gemini-2.5-flash | 85% |
| PO-003 | Transition Architect | sub | phase design, execution monitoring | gemini-2.5-flash | 80% |

---

## 4. Positioning Diagnosis (C-048)

### Pipeline steps

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| perception_audit | PO-001 | Collects and analyzes how the brand is currently perceived. Sources: Brand Listener data (mentions, sentiment), client's own research, team interviews | Brand Listener reports, client survey data (if available), Brand DNA | Perception Map (markdown): how market sees the brand today — attributes, strengths/weaknesses, key associations |
| gap_analysis | PO-L | Compares perception (how you're seen) vs aspiration (how you want to be seen, from Brand DNA). Identifies: gaps, misalignments, untapped opportunities | Perception Map, Brand DNA, Competitive Map from Competitive Listener | Gap Analysis Report (markdown): perception vs aspiration matrix, priority gaps, competitive whitespace |
| positioning_definition | PO-L, PO-002 | Defines/refines positioning using 3Cs framework (Company, Customer, Competition). Produces: positioning statement, value proposition, competitive frame, reasons to believe | Gap Analysis, Brand DNA, Buyer Personas, Competitive Listener data | Positioning Document (markdown): full positioning with supporting evidence |
| validation | PO-L | Validates positioning against: Brand DNA consistency, market feasibility, competitive differentiation, audience resonance | Positioning Document, all prior artifacts | Validated Positioning + confidence score per dimension |

### Gates

| Gate | After step | Evaluator(s) | Max iterations | What it checks |
|------|-----------|-------------|----------------|---------------|
| G1 | gap_analysis | PO-L, BG-L (Brand Guardian) | 3 | Are gaps accurately identified? Is competitive mapping complete? |
| G2 | validation | Human | 1 | Client reviews and approves positioning |

### Positioning Document structure

```markdown
# Positioning Statement
For [target audience] who [need/want],
[brand name] is the [category/frame of reference]
that [key benefit/differentiator]
because [reasons to believe].

# Competitive Frame
- Direct competitors: [list with positioning]
- Indirect competitors: [list]
- Our differentiation: [specific, defensible]

# Value Proposition Canvas
- Customer jobs: [what they're trying to do]
- Pains: [what frustrates them]
- Gains: [what they aspire to]
- Pain relievers: [how we address pains]
- Gain creators: [how we deliver gains]

# Perception Gap Map
| Attribute | Current perception | Desired perception | Gap | Priority |
|-----------|-------------------|-------------------|-----|----------|
| Quality | "decent" | "premium" | Large | High |
| Innovation | "traditional" | "cutting-edge" | Large | High |
| Price | "affordable" | "value-driven" | Small | Low |

# Brand Attributes (ranked)
1. [Primary attribute — what you're known for first]
2. [Secondary attribute]
3. [Tertiary attribute]

# Audience Resonance Test
- Primary audience: [fit score, reasoning]
- Secondary audience: [fit score, reasoning]
```

---

## 5. Strategic Repositioning (C-049)

### Pipeline steps

| Step | Agent | What happens | Input | Output |
|------|-------|-------------|-------|--------|
| current_audit | PO-001 | Deep audit of current positioning: all touchpoints, content, messaging, visual identity, customer feedback | Brand DNA, Brand Listener history, all recent content artifacts, customer feedback data | Current Positioning Audit (markdown): comprehensive picture of where the brand stands today |
| target_definition | PO-L | Defines target positioning using C-048 framework. Identifies what changes and what stays | Current Audit, competitive landscape, business strategy | Target Positioning Document (markdown) + Change Matrix (what changes, what stays, what evolves) |
| transition_plan | PO-L, PO-003 | Designs phased transition: timeline, milestones, messaging shifts, visual evolution, channel strategy per phase | Change Matrix, current assets inventory, budget | Transition Plan (markdown): phased roadmap with specific actions per phase |
| phase_design | PO-003 | Designs each phase in detail: which touchpoints change first, messaging gradient, visual evolution, internal training needed | Transition Plan, Channel Manager specs, production motor capabilities | Phase Blueprints (markdown per phase): specific briefs for production and distribution motors |

### Gates

| Gate | After step | Evaluator(s) | Max iterations | What it checks |
|------|-----------|-------------|----------------|---------------|
| G1 | target_definition | PO-L, BG-L (Brand Guardian) | 3 | Is target achievable? Does Change Matrix preserve essential brand equity? |
| G2 | phase_design | Human | 1 | Client approves transition plan and phase blueprints |

### Transition plan structure

```markdown
# Repositioning: [Brand Name]
From: "[current positioning summary]"
To: "[target positioning summary]"

# Change Matrix
| Element | Current | Target | Change type | Phase |
|---------|---------|--------|-------------|-------|
| Tagline | "We make it easy" | "We make it exceptional" | Replace | Phase 1 |
| Color palette | Blues + grays | Blues + gold | Evolve | Phase 2 |
| Tone | Casual, friendly | Confident, expert | Evolve | Phase 1-3 |
| Logo | Current version | Refined version | Evolve | Phase 3 |
| Pricing message | "Affordable" | "Premium value" | Replace | Phase 2 |

# Phase 1: Foundation (Month 1-2)
- Internal alignment: update Brand DNA, brief all team members
- Messaging shift: new tagline, updated elevator pitch
- Digital touchpoints: website copy, social bios, email signatures
- Measurement: Brand Listener tracks perception shift

# Phase 2: Expansion (Month 3-4)
- Visual evolution: updated color palette, photography style
- Content shift: new content pillars, updated editorial calendar
- Campaign launch: repositioning campaign across primary channels
- Measurement: sentiment analysis, brand attribute tracking

# Phase 3: Consolidation (Month 5-6)
- Full visual refresh: updated logo, complete design system
- All touchpoints aligned: print, events, packaging
- PR push: industry press, thought leadership
- Measurement: brand health score target achieved

# Risk mitigation
- Track customer confusion signals (Brand Listener)
- Maintain core identity elements throughout (Brand Guardian enforcement)
- Rollback criteria: if brand health drops >20%, pause and reassess

# Success metrics
- Brand health score: [current] → [target]
- Attribute association: [specific shifts]
- Customer sentiment: [current] → [target]
- Revenue impact: [maintain during transition, grow after]
```

### Execution monitoring

After G2 approval, PO-003 monitors transition progress:
- Triggers Brand Listener to track perception changes phase by phase
- Generates monthly Repositioning Progress Reports
- Alerts if metrics deviate from plan (brand health dropping too fast, customer confusion signals)
- Brand Guardian enforces increasingly strict rules as transition progresses (gradual tightening)

---

## 6. External Data Interfaces

No new external interfaces needed. Positioning Engine consumes:
- Brand Listener reports (Intelligence Engine) for perception data
- Competitive Listener reports for competitive mapping
- Culture Listener for cultural context
- Analytics for content performance data
- Asset Registry for touchpoint inventory

---

## 7. Database Changes

### New tables

```sql
-- Positioning projects (extends projects table via pipelineType)
-- No separate table needed — uses existing projects + artifacts

-- Perception tracking (for repositioning monitoring)
CREATE TABLE perception_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  repositioning_project_id UUID REFERENCES projects(id),
  phase INTEGER NOT NULL,
  measurement_date DATE NOT NULL,
  metrics JSONB NOT NULL,                       -- brand health, attribute scores, sentiment
  status VARCHAR(20) DEFAULT 'on_track',        -- on_track, at_risk, off_track
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enum additions

```sql
ALTER TYPE pipeline_type ADD VALUE 'positioning-diagnosis';
ALTER TYPE pipeline_type ADD VALUE 'repositioning';
```

---

## 8. API Endpoints

```
-- Positioning diagnosis
POST   /api/positioning/:clientId/diagnose          → Start positioning diagnosis project
GET    /api/positioning/:clientId/current            → Current positioning document
GET    /api/positioning/:clientId/perception         → Latest perception data

-- Repositioning
POST   /api/positioning/:clientId/reposition         → Start repositioning project
GET    /api/positioning/:clientId/transition          → Current transition plan + progress
GET    /api/positioning/:clientId/transition/phases   → Phase details
GET    /api/positioning/:clientId/transition/tracking → Perception tracking over time
```

---

## 9. New Files

| File | Purpose |
|------|---------|
| `src/services/positioning/diagnosis.ts` | Perception audit + gap analysis logic |
| `src/services/positioning/repositioning.ts` | Transition plan generation + monitoring |
| `src/api/positioning-routes.ts` | Positioning API endpoints |
| `agents/PO-L_positioning_strategist.md` | Agent skill file |
| `agents/PO-001_perception_auditor.md` | Agent skill file |
| `agents/PO-002_competitive_mapper.md` | Agent skill file |
| `agents/PO-003_transition_architect.md` | Agent skill file |

---

## 10. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Perception audit produces useful insights | Run with Brand Listener stub data, verify audit identifies real perception attributes |
| Gap analysis finds meaningful gaps | Provide Brand DNA with aspirational attributes, verify gaps are correctly identified |
| Positioning document is complete | All sections filled: statement, competitive frame, value prop canvas, attributes |
| Repositioning Change Matrix is actionable | For each element, specific change type and phase assignment |
| Transition plan has realistic phases | 3-6 month plan with measurable milestones per phase |
| Phase blueprints generate production briefs | Phase 1 blueprint can be fed into Campaign Orchestrator (C-042) |
| Perception tracking works | Record 3 monthly measurements, verify trend visualization |
| Brand Guardian enforces gradual transition | Phase 1 = lenient on new tone, Phase 3 = strict on new identity |
| No regression | Brand Builder and Strategist continue working independently |
