# criteria.agency — Brand Guardian & Live Manual Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Brand capabilities (C-007, C-008): Brand Guardian (continuous enforcement), Live Brand Manual (auto-generated, always current)

---

## 1. Objective

Build the **Brand Guardian Engine** — a continuous enforcement system that validates every piece of content against the client's Brand DNA, plus an auto-generated Brand Manual that evolves with the brand. This complements the Brand Builder motor (C-006, already designed) which creates the initial Brand DNA.

| Capability | What it delivers |
|-----------|-----------------|
| C-007: Guardián de marca | Automatic validation of every content piece against Brand DNA (tone, visual, messaging) |
| C-008: Manual de marca vivo | Auto-generated, always-current brand manual shareable with teams and vendors |

**Dependency:** Both depend on Brand Builder (C-006) having produced a Brand DNA Document. Brand Guardian is invoked by every other motor's quality gates.

---

## 2. Architecture

### Brand Guardian as Transversal Agent

The Brand Guardian (XA-003) is already defined as a stub in `strategy-engines-design.md`. This spec upgrades it from a simple pass/fail check to a full validation system with learning.

```
[Content piece from any motor]
    ↓
[Brand Guardian]
    ├── [Load Brand DNA + Brand Rules]
    ├── [Validate Verbal] — tone, vocabulary, messaging, do's/don'ts
    ├── [Validate Visual] — colors, typography, imagery style, logo usage
    ├── [Validate Messaging] — alignment with positioning, value prop, audience
    ├── [Score] — 0-100 brand consistency score
    ├── [Learn] — record patterns of what passes/fails
    └── [Output] — pass/fail + detailed feedback + score
```

### Live Brand Manual as Generated Artifact

Not a separate system — it's a **rendered view** of the Brand DNA Document plus accumulated brand rules, usage examples, and learned patterns.

---

## 3. Agents

| ID | Name | Level | Role | Model | Autonomy |
|----|------|-------|------|-------|----------|
| BG-L | Brand Guardian Director | leader | Complex brand decisions, rule evolution, manual curation | claude-sonnet-4 | 75% |
| BG-001 | Verbal Validator | sub | Tone, vocabulary, messaging validation | gemini-2.5-flash | 90% |
| BG-002 | Visual Validator | sub | Color, typography, imagery, logo validation | gemini-2.5-flash | 85% |
| BG-003 | Manual Generator | sub | Generates and updates brand manual document | gemini-2.5-flash | 85% |

> Note: BG-L **supersedes** the existing XA-003 Brand Guardian stub from strategy-engines-design. When the Brand Guardian Engine is active, all gate evaluations that previously called XA-003 should call BG-L instead. XA-003 remains as a fallback stub for clients without a Brand DNA Document.

---

## 4. Brand Guardian (C-007)

### Validation dimensions

| Dimension | What it checks | Rules source |
|-----------|---------------|-------------|
| **Tone of voice** | Formal/informal level, personality traits, emotional register | Brand DNA verbal identity |
| **Vocabulary** | Approved terms, banned terms, industry jargon usage | Brand DNA do's/don'ts |
| **Key messages** | Core value prop present, positioning statement alignment | Brand DNA positioning |
| **Visual palette** | Color codes within tolerance, correct color combinations | Brand DNA visual direction |
| **Typography** | Font family, hierarchy, sizing consistency | Brand DNA visual direction |
| **Imagery style** | Photo style, illustration style, icon consistency | Brand DNA visual direction |
| **Logo usage** | Correct version, minimum size, clear space, background | Brand DNA guidelines |
| **Audience fit** | Language level, cultural sensitivity, audience relevance | Brand DNA + Buyer Personas |

### Brand validation output

```typescript
interface BrandValidation {
  overallScore: number;         // 0-100
  verdict: "pass" | "needs_revision" | "fail";
  dimensions: Array<{
    name: string;               // "tone", "vocabulary", "visual_palette", etc.
    score: number;              // 0-100
    status: "pass" | "warning" | "fail";
    issues: Array<{
      description: string;
      severity: "critical" | "major" | "minor";
      suggestion: string;       // how to fix
      reference: string;        // section of Brand DNA that applies
    }>;
  }>;
  summary: string;              // Natural language summary of brand alignment
  autoFixable: boolean;         // can issues be fixed without human input?
  autoFixSuggestions: string[]; // specific text/color changes if autoFixable
}
```

### Threshold configuration (per client)

```typescript
interface BrandGuardianConfig {
  clientId: string;
  passThreshold: number;         // default: 80 (score >= 80 = pass)
  autoPassThreshold: number;     // default: 95 (score >= 95 = auto-approve without human review)
  strictMode: boolean;           // default: false (true = no auto-pass, always human review)
  weightsByDimension: Record<string, number>;  // customize importance per dimension
  customRules: BrandRule[];      // client-specific additions beyond Brand DNA
}
```

### Brand Rules (learnable)

Beyond the static Brand DNA, the Guardian accumulates learned rules:

```typescript
interface BrandRule {
  id: string;
  clientId: string;
  dimension: string;            // "tone", "vocabulary", "visual", etc.
  type: "always" | "never" | "prefer" | "avoid";
  rule: string;                 // "Always capitalize 'Criteria' when referring to the platform"
  source: "brand_dna" | "human_feedback" | "learned";
  examples: Array<{
    correct: string;
    incorrect: string;
  }>;
  createdAt: string;
  lastAppliedAt: string;
}
```

**Learning mechanism:**
- When a human reviewer edits content after Brand Guardian passes it → learn what was wrong
- When a human reviewer overrides a Brand Guardian rejection → learn what was acceptable
- Accumulated corrections become new `BrandRule` entries with `source: "learned"`

### Gate integration

The Brand Guardian is invoked at quality gates across ALL motors:

| Motor | Gate(s) | What Brand Guardian checks |
|-------|---------|--------------------------|
| Video Production | G1, G3, G5 | Script tone, visual look, final delivery |
| Graphic Design | G1, G2 | Design system alignment, final pieces |
| Writers Room | G1, G2 | Copy tone and messaging |
| Web | G1, G2 | Visual + verbal alignment |
| Audio | G1 | Voice tone, music mood alignment |
| Email Marketing | G1 | Subject lines, copy tone, template design |
| Community Mgmt | Pre-publish | Every social post before scheduling |
| Ads | G1, G2 | Ad creative + copy validation |
| Sales (Proposals) | G1 | Proposal branding |
| Events | G1 | Event concept alignment with brand |

---

## 5. Live Brand Manual (C-008)

### What it contains

The Brand Manual is a **generated document** (HTML + PDF) that assembles:

1. **Brand Overview** — mission, vision, values (from Brand DNA)
2. **Brand Personality** — personality traits, tone of voice (from Brand DNA)
3. **Verbal Identity** — vocabulary, phrases, do's/don'ts, example copy (from Brand DNA + learned rules)
4. **Visual Identity** — colors, typography, imagery guidelines (from Brand DNA)
5. **Logo Usage** — versions, clear space, minimum sizes (from Brand DNA)
6. **Application Examples** — real produced content showing correct usage (from asset registry)
7. **Channel Guidelines** — per-channel adaptations (from Channel Manager specs + production history)
8. **Do's and Don'ts Gallery** — visual examples of correct vs incorrect usage (from Brand Guardian history)

### Auto-update triggers

The manual regenerates when:
- Brand DNA Document is updated (Brand Builder re-run)
- New Brand Rule is learned (from human feedback)
- Significant new content is produced (new examples available)
- Channel specifications change
- Quarterly scheduled refresh

### Manual generation flow

```
[Trigger] → BG-003 collects: Brand DNA + Brand Rules + asset examples + channel specs
    → Generates markdown sections
    → BG-L reviews and curates
    → Renders HTML + PDF
    → Stores as artifact + publishes to shareable URL
```

### Shareable access

Brand Manual is accessible via a token-based URL (same pattern as client review portal):
- Read-only access for team members and vendors
- No authentication required (link = access)
- Version history available
- Always shows latest version

---

## 6. Database Changes

### New tables

```sql
-- Brand rules (static + learned)
CREATE TABLE brand_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  dimension VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,                    -- "always", "never", "prefer", "avoid"
  rule TEXT NOT NULL,
  source VARCHAR(20) NOT NULL,                  -- "brand_dna", "human_feedback", "learned"
  examples JSONB DEFAULT '[]',
  confidence NUMERIC(3,2) DEFAULT 1.0,          -- 0-1, decays if overridden
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_applied_at TIMESTAMP
);

-- Brand validation history
CREATE TABLE brand_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  project_id UUID REFERENCES projects(id),
  gate_type VARCHAR(20),
  content_type VARCHAR(50),                     -- "script", "design", "copy", "email", "social_post"
  validation_result JSONB NOT NULL,             -- BrandValidation object
  human_override VARCHAR(20),                   -- null, "approved_despite_fail", "rejected_despite_pass"
  human_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brand_validations_client
  ON brand_validations (client_id, created_at DESC);

-- Brand guardian configuration
CREATE TABLE brand_guardian_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  config JSONB NOT NULL,                        -- BrandGuardianConfig object
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Brand manual versions
CREATE TABLE brand_manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  version INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  generated_at TIMESTAMP DEFAULT NOW(),
  published BOOLEAN DEFAULT true
);
```

---

## 7. API Endpoints

```
-- Brand Guardian
POST   /api/brand/:clientId/validate               → Validate content against Brand DNA (ad-hoc)
GET    /api/brand/:clientId/validations             → Validation history
GET    /api/brand/:clientId/score                   → Current brand consistency score (avg of recent validations)
GET    /api/brand/:clientId/rules                   → List all brand rules (static + learned)
POST   /api/brand/:clientId/rules                   → Add manual brand rule
PATCH  /api/brand/:clientId/rules/:id               → Update/disable rule
GET    /api/brand/:clientId/config                  → Guardian configuration
PUT    /api/brand/:clientId/config                  → Update configuration

-- Brand Manual
GET    /api/brand/:clientId/manual                  → Latest brand manual (authenticated)
GET    /api/brand/:clientId/manual/versions         → Version history
POST   /api/brand/:clientId/manual/regenerate       → Trigger manual regeneration
GET    /api/brand/manual/:shareToken                → Public brand manual (no auth, read-only)
```

---

## 8. Scheduled Tasks

| Task | Schedule | What it does |
|------|----------|-------------|
| `brand-manual-refresh` | Quarterly (1st of Jan/Apr/Jul/Oct) | Regenerate brand manual with latest Brand DNA, rules, and examples |
| `rule-learning-batch` | Weekly Sunday 3am | Process recent brand validation overrides and extract new learned rules |
| `validation-stats` | Monthly 1st 2am | Compute brand consistency score trends and generate monthly brand health summary |

---

## 9. New Files

| File | Purpose |
|------|---------|
| `src/services/brand/brand-guardian.ts` | Validation engine with scoring, learning |
| `src/services/brand/brand-rules.ts` | Rule management and learning |
| `src/services/brand/manual-generator.ts` | Brand manual generation and publishing |
| `src/api/brand-routes.ts` | Brand Guardian + Manual API endpoints |
| `agents/BG-L_brand_guardian_director.md` | Agent skill file |
| `agents/BG-001_verbal_validator.md` | Agent skill file |
| `agents/BG-002_visual_validator.md` | Agent skill file |
| `agents/BG-003_manual_generator.md` | Agent skill file |

---

## 9. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Brand validation produces meaningful scores | Submit 3 content pieces (1 on-brand, 1 off-brand, 1 mixed), verify scores differentiate |
| Dimension breakdown is useful | Each dimension (tone, visual, messaging) scores independently |
| Suggestions are actionable | "Fail" validations include specific, fixable suggestions |
| Learning works | Override a Brand Guardian decision, verify new rule is created |
| Brand Manual generates | From Brand DNA, produce complete manual with all 8 sections |
| Manual updates on trigger | Update a Brand Rule, verify manual regenerates |
| Shareable URL works | Access manual via share token without authentication |
| Gate integration works | Run a video pipeline project, verify Brand Guardian is invoked at G1/G3/G5 |
| No regression | XA-003 stub callers continue working (BG-L replaces XA-003) |
