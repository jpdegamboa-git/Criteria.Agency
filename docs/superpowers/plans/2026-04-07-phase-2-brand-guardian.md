# Phase 2: Brand Guardian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Brand Guardian engine (C-007, C-008) — a continuous brand enforcement system with validation scoring, learnable rules, and auto-generated brand manual with shareable URL.

**Architecture:** Content enters the Brand Guardian via `POST /api/brand/:clientId/validate`. BG-L orchestrates verbal (BG-001) and visual (BG-002) validators, scores across 8 dimensions, and returns pass/fail with detailed feedback. Human overrides trigger rule learning. BG-003 generates a live brand manual assembling Brand DNA + learned rules + produced examples.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Zod, Vitest, generateText() wrapper

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/services/brand-guardian/types.ts` | All BG interfaces: BrandValidation, BrandRule, BrandGuardianConfig, BrandManual |
| `src/services/brand-guardian/verbal-validator.ts` | BG-001: tone, vocabulary, messaging validation |
| `src/services/brand-guardian/visual-validator.ts` | BG-002: colors, typography, imagery, logo validation |
| `src/services/brand-guardian/guardian-engine.ts` | BG-L: orchestrates validators, scores, decides verdict |
| `src/services/brand-guardian/rule-learner.ts` | Extracts new rules from human overrides/feedback |
| `src/services/brand-guardian/manual-generator.ts` | BG-003: assembles and generates brand manual markdown |
| `src/api/brand-routes.ts` | 12 API endpoints for validation, rules, config, manual |
| `src/services/brand-guardian/brand-guardian.test.ts` | Unit tests for validators, engine, rule learner |
| `src/services/brand-guardian/integration.test.ts` | Integration tests for full validation flow |

### Modified Files
| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add 4 tables: brandRules, brandValidations, brandGuardianConfigs, brandManuals + enums |
| `src/agents/registry.ts` | Add BG-L, BG-001, BG-002, BG-003 entries |
| `src/shared/types.ts` | Add brand guardian artifact steps to ARTIFACT_STEPS |
| `src/api/validators.ts` | Add Zod schemas for brand guardian endpoints |
| `src/api/routes.ts` | Mount brand routes, add middleware |

### New Agent Skill Files
| File | Agent |
|------|-------|
| `agents/BG-L_brand_guardian_director.md` | Brand Guardian Director |
| `agents/BG-001_verbal_validator.md` | Verbal Validator |
| `agents/BG-002_visual_validator.md` | Visual Validator |
| `agents/BG-003_manual_generator.md` | Manual Generator |

---

## Task 1: Database Schema — Brand Guardian Tables

**Files:**
- Modify: `src/db/schema.ts` (append after line 927)

**Context:** The schema already has engine infrastructure tables (continuousAgentRuns, alerts, etc.) from Phase 0/1. Brand Guardian needs its own domain tables. Use existing patterns: uuid PKs, timestamps, jsonb for flexible data, indexes on foreign keys.

- [ ] **Step 1: Add enums for Brand Guardian**

Add these enums after the existing `continuousRunStatusEnum` (line 297):

```typescript
export const brandRuleTypeEnum = pgEnum("brand_rule_type", [
  "always", "never", "prefer", "avoid",
]);

export const brandRuleSourceEnum = pgEnum("brand_rule_source", [
  "brand_dna", "human_feedback", "learned",
]);

export const brandValidationVerdictEnum = pgEnum("brand_validation_verdict", [
  "pass", "needs_revision", "fail",
]);

export const brandIssueSeverityEnum = pgEnum("brand_issue_severity", [
  "critical", "major", "minor",
]);
```

- [ ] **Step 2: Add brandRules table**

After `autonomyConfigs` table (end of file):

```typescript
export const brandRules = pgTable("brand_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  dimension: varchar("dimension", { length: 50 }).notNull(),
  type: brandRuleTypeEnum("type").notNull(),
  rule: text("rule").notNull(),
  source: brandRuleSourceEnum("source").notNull(),
  examples: jsonb("examples").default([]),
  confidence: numeric("confidence", { precision: 3, scale: 2 }).default("1.00"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAppliedAt: timestamp("last_applied_at"),
}, (table) => [
  index("brand_rules_client_idx").on(table.clientId),
  index("brand_rules_dimension_idx").on(table.clientId, table.dimension),
]);
```

- [ ] **Step 3: Add brandValidations table**

```typescript
export const brandValidations = pgTable("brand_validations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  overallScore: integer("overall_score").notNull(),
  verdict: brandValidationVerdictEnum("verdict").notNull(),
  dimensions: jsonb("dimensions").notNull(),
  summary: text("summary").notNull(),
  autoFixable: boolean("auto_fixable").default(false).notNull(),
  autoFixSuggestions: jsonb("auto_fix_suggestions").default([]),
  humanOverride: varchar("human_override", { length: 20 }),
  humanFeedback: text("human_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("brand_validations_client_idx").on(table.clientId),
  index("brand_validations_project_idx").on(table.projectId),
]);
```

- [ ] **Step 4: Add brandGuardianConfigs table**

```typescript
export const brandGuardianConfigs = pgTable("brand_guardian_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull().unique(),
  passThreshold: integer("pass_threshold").default(80).notNull(),
  autoPassThreshold: integer("auto_pass_threshold").default(95).notNull(),
  strictMode: boolean("strict_mode").default(false).notNull(),
  weightsByDimension: jsonb("weights_by_dimension").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 5: Add brandManuals table**

```typescript
export const brandManuals = pgTable("brand_manuals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  version: integer("version").default(1).notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  shareToken: varchar("share_token", { length: 64 }).notNull().unique(),
  published: boolean("published").default(true).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (table) => [
  index("brand_manuals_client_idx").on(table.clientId),
  index("brand_manuals_token_idx").on(table.shareToken),
]);
```

- [ ] **Step 6: Run schema generation**

Run: `npx drizzle-kit generate`
Expected: Migration SQL file generated without errors.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(brand-guardian): add database tables for brand rules, validations, configs, and manuals"
```

---

## Task 2: Types and Interfaces

**Files:**
- Create: `src/services/brand-guardian/types.ts`

**Context:** These types are used by all Brand Guardian services. They match the design spec interfaces. The `BrandValidation` is the core output of the validation engine.

- [ ] **Step 1: Create types file**

```typescript
// ── Brand Guardian Types ──

export interface BrandDimensionIssue {
  description: string;
  severity: "critical" | "major" | "minor";
  suggestion: string;
  reference: string;
}

export interface BrandDimensionResult {
  name: string;
  score: number;
  status: "pass" | "warning" | "fail";
  issues: BrandDimensionIssue[];
}

export interface BrandValidation {
  overallScore: number;
  verdict: "pass" | "needs_revision" | "fail";
  dimensions: BrandDimensionResult[];
  summary: string;
  autoFixable: boolean;
  autoFixSuggestions: string[];
}

export interface BrandRule {
  id: string;
  clientId: string;
  dimension: string;
  type: "always" | "never" | "prefer" | "avoid";
  rule: string;
  source: "brand_dna" | "human_feedback" | "learned";
  examples: Array<{ correct: string; incorrect: string }>;
  confidence: number;
  enabled: boolean;
}

export interface BrandGuardianConfig {
  clientId: string;
  passThreshold: number;
  autoPassThreshold: number;
  strictMode: boolean;
  weightsByDimension: Record<string, number>;
}

export interface BrandManualSection {
  title: string;
  content: string;
}

export interface ValidateContentInput {
  content: string;
  contentType: string;
  projectId?: string;
  brandDna?: string;
}

export interface VerbalValidationInput {
  content: string;
  brandDna: string;
  rules: BrandRule[];
}

export interface VisualValidationInput {
  content: string;
  brandDna: string;
  rules: BrandRule[];
}

export const DEFAULT_DIMENSION_WEIGHTS: Record<string, number> = {
  tone: 15,
  vocabulary: 10,
  key_messages: 15,
  visual_palette: 15,
  typography: 10,
  imagery_style: 10,
  logo_usage: 10,
  audience_fit: 15,
};

export const VERBAL_DIMENSIONS = ["tone", "vocabulary", "key_messages", "audience_fit"] as const;
export const VISUAL_DIMENSIONS = ["visual_palette", "typography", "imagery_style", "logo_usage"] as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/services/brand-guardian/types.ts
git commit -m "feat(brand-guardian): add TypeScript types and interfaces"
```

---

## Task 3: Verbal Validator (BG-001)

**Files:**
- Create: `src/services/brand-guardian/verbal-validator.ts`
- Test: `src/services/brand-guardian/brand-guardian.test.ts`

**Context:** Validates content against verbal brand dimensions (tone, vocabulary, key messages, audience fit). Uses `generateText()` from `src/providers/generate-text.ts` to ask an LLM to evaluate content. Returns `BrandDimensionResult[]` for the 4 verbal dimensions.

- [ ] **Step 1: Write the failing test**

Create `src/services/brand-guardian/brand-guardian.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateVerbal } from "./verbal-validator.js";
import type { BrandRule, VerbalValidationInput } from "./types.js";

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn(),
}));

import { generateText } from "../../providers/generate-text.js";
const mockGenerateText = vi.mocked(generateText);

describe("VerbalValidator", () => {
  const brandDna = "Brand: TestCo. Tone: professional, warm. Never use slang. Key message: Innovation for everyone.";
  const rules: BrandRule[] = [
    {
      id: "r1", clientId: "c1", dimension: "tone", type: "always",
      rule: "Use professional and warm tone", source: "brand_dna",
      examples: [{ correct: "We'd love to help", incorrect: "Yo, hit us up" }],
      confidence: 1.0, enabled: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 4 verbal dimension results", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "tone", score: 90, status: "pass", issues: [] },
        { name: "vocabulary", score: 85, status: "pass", issues: [] },
        { name: "key_messages", score: 70, status: "warning", issues: [
          { description: "Key message not clearly stated", severity: "minor", suggestion: "Add explicit mention of innovation", reference: "Key Messages" }
        ]},
        { name: "audience_fit", score: 80, status: "pass", issues: [] },
      ],
    }));

    const input: VerbalValidationInput = { content: "Welcome to TestCo solutions", brandDna, rules };
    const result = await validateVerbal(input);

    expect(result).toHaveLength(4);
    expect(result[0].name).toBe("tone");
    expect(result[2].issues).toHaveLength(1);
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("should handle LLM returning code-fenced JSON", async () => {
    mockGenerateText.mockResolvedValueOnce("```json\n" + JSON.stringify({
      dimensions: [
        { name: "tone", score: 60, status: "fail", issues: [
          { description: "Too casual", severity: "major", suggestion: "Use formal tone", reference: "Tone Guidelines" }
        ]},
        { name: "vocabulary", score: 90, status: "pass", issues: [] },
        { name: "key_messages", score: 85, status: "pass", issues: [] },
        { name: "audience_fit", score: 75, status: "warning", issues: [] },
      ],
    }) + "\n```");

    const result = await validateVerbal({ content: "Hey dude, check this out", brandDna, rules });
    expect(result).toHaveLength(4);
    expect(result[0].score).toBe(60);
    expect(result[0].status).toBe("fail");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: FAIL — module `./verbal-validator.js` not found.

- [ ] **Step 3: Implement verbal validator**

Create `src/services/brand-guardian/verbal-validator.ts`:

```typescript
import { generateText } from "../../providers/generate-text.js";
import type { BrandDimensionResult, VerbalValidationInput, BrandRule } from "./types.js";
import { VERBAL_DIMENSIONS } from "./types.js";

function formatRulesForPrompt(rules: BrandRule[]): string {
  if (rules.length === 0) return "No additional rules.";
  return rules.map((r) => `- [${r.dimension}] ${r.type.toUpperCase()}: ${r.rule}`).join("\n");
}

function parseJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(stripped);
}

export async function validateVerbal(input: VerbalValidationInput): Promise<BrandDimensionResult[]> {
  const { content, brandDna, rules } = input;

  const verbalRules = rules.filter((r) => VERBAL_DIMENSIONS.includes(r.dimension as any));

  const systemPrompt = `You are BG-001 Verbal Validator. You evaluate content against a brand's verbal identity.
Score each dimension 0-100. Status: "pass" (>=80), "warning" (60-79), "fail" (<60).
For each issue found, provide description, severity (critical/major/minor), suggestion, and reference to Brand DNA section.

Return ONLY valid JSON with this exact structure:
{
  "dimensions": [
    { "name": "tone", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "vocabulary", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "key_messages", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "audience_fit", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] }
  ]
}`;

  const userPrompt = `## Brand DNA
${brandDna}

## Additional Brand Rules
${formatRulesForPrompt(verbalRules)}

## Content to Validate
${content}

Evaluate the content against the brand's verbal identity across all 4 dimensions.`;

  const raw = await generateText("gemini-2.5-flash", systemPrompt, userPrompt, 2000);
  const parsed = parseJson(raw) as { dimensions: BrandDimensionResult[] };
  return parsed.dimensions;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/brand-guardian/verbal-validator.ts src/services/brand-guardian/brand-guardian.test.ts
git commit -m "feat(brand-guardian): implement verbal validator (BG-001)"
```

---

## Task 4: Visual Validator (BG-002)

**Files:**
- Create: `src/services/brand-guardian/visual-validator.ts`
- Modify: `src/services/brand-guardian/brand-guardian.test.ts`

**Context:** Same pattern as verbal validator but for visual dimensions (palette, typography, imagery, logo). For text-based content, it analyzes visual descriptions and color/font references in the content. For actual image validation, it notes this as a future enhancement.

- [ ] **Step 1: Add visual validator tests**

Append to `brand-guardian.test.ts`:

```typescript
import { validateVisual } from "./visual-validator.js";
import type { VisualValidationInput } from "./types.js";

describe("VisualValidator", () => {
  const brandDna = "Visual: Primary colors #2563EB, #1E293B. Font: Inter. Style: minimalist, clean photography. Logo: always on white bg.";
  const rules: BrandRule[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 4 visual dimension results", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "visual_palette", score: 95, status: "pass", issues: [] },
        { name: "typography", score: 80, status: "pass", issues: [] },
        { name: "imagery_style", score: 70, status: "warning", issues: [
          { description: "Image style inconsistent with minimalist guidelines", severity: "minor", suggestion: "Use cleaner backgrounds", reference: "Imagery Guidelines" }
        ]},
        { name: "logo_usage", score: 90, status: "pass", issues: [] },
      ],
    }));

    const input: VisualValidationInput = { content: "Landing page with hero banner using brand colors", brandDna, rules };
    const result = await validateVisual(input);

    expect(result).toHaveLength(4);
    expect(result[0].name).toBe("visual_palette");
    expect(result[2].issues).toHaveLength(1);
  });

  it("should return all pass for text-only content with no visual references", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "visual_palette", score: 100, status: "pass", issues: [] },
        { name: "typography", score: 100, status: "pass", issues: [] },
        { name: "imagery_style", score: 100, status: "pass", issues: [] },
        { name: "logo_usage", score: 100, status: "pass", issues: [] },
      ],
    }));

    const result = await validateVisual({ content: "Just a plain text email", brandDna, rules });
    expect(result.every((d) => d.score === 100)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: FAIL — module `./visual-validator.js` not found.

- [ ] **Step 3: Implement visual validator**

Create `src/services/brand-guardian/visual-validator.ts`:

```typescript
import { generateText } from "../../providers/generate-text.js";
import type { BrandDimensionResult, VisualValidationInput, BrandRule } from "./types.js";
import { VISUAL_DIMENSIONS } from "./types.js";

function formatRulesForPrompt(rules: BrandRule[]): string {
  if (rules.length === 0) return "No additional rules.";
  return rules.map((r) => `- [${r.dimension}] ${r.type.toUpperCase()}: ${r.rule}`).join("\n");
}

function parseJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(stripped);
}

export async function validateVisual(input: VisualValidationInput): Promise<BrandDimensionResult[]> {
  const { content, brandDna, rules } = input;

  const visualRules = rules.filter((r) => VISUAL_DIMENSIONS.includes(r.dimension as any));

  const systemPrompt = `You are BG-002 Visual Validator. You evaluate content against a brand's visual identity.
For text content, evaluate any visual references (colors, fonts, layout descriptions). If no visual elements are present, score all dimensions 100.
Score each dimension 0-100. Status: "pass" (>=80), "warning" (60-79), "fail" (<60).

Return ONLY valid JSON:
{
  "dimensions": [
    { "name": "visual_palette", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "typography", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "imagery_style", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] },
    { "name": "logo_usage", "score": number, "status": "pass"|"warning"|"fail", "issues": [...] }
  ]
}

Each issue: { "description": string, "severity": "critical"|"major"|"minor", "suggestion": string, "reference": string }`;

  const userPrompt = `## Brand Visual Identity
${brandDna}

## Additional Brand Rules
${formatRulesForPrompt(visualRules)}

## Content to Validate
${content}

Evaluate the content's visual elements against the brand's visual identity.`;

  const raw = await generateText("gemini-2.5-flash", systemPrompt, userPrompt, 2000);
  const parsed = parseJson(raw) as { dimensions: BrandDimensionResult[] };
  return parsed.dimensions;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: 4 tests PASS (2 verbal + 2 visual).

- [ ] **Step 5: Commit**

```bash
git add src/services/brand-guardian/visual-validator.ts src/services/brand-guardian/brand-guardian.test.ts
git commit -m "feat(brand-guardian): implement visual validator (BG-002)"
```

---

## Task 5: Guardian Engine (BG-L)

**Files:**
- Create: `src/services/brand-guardian/guardian-engine.ts`
- Modify: `src/services/brand-guardian/brand-guardian.test.ts`

**Context:** The Guardian Engine is the orchestrator (BG-L). It loads Brand DNA (latest brand_report from intelligence listener), loads brand rules from DB, runs verbal + visual validators, computes weighted overall score, determines verdict based on config thresholds, and stores the validation result. Uses `db` from `src/db/index.js`.

- [ ] **Step 1: Add guardian engine tests**

Append to `brand-guardian.test.ts`:

```typescript
import { computeOverallScore, determineVerdict } from "./guardian-engine.js";
import type { BrandDimensionResult, BrandGuardianConfig } from "./types.js";
import { DEFAULT_DIMENSION_WEIGHTS } from "./types.js";

describe("GuardianEngine", () => {
  const allPassDimensions: BrandDimensionResult[] = [
    { name: "tone", score: 90, status: "pass", issues: [] },
    { name: "vocabulary", score: 85, status: "pass", issues: [] },
    { name: "key_messages", score: 80, status: "pass", issues: [] },
    { name: "audience_fit", score: 88, status: "pass", issues: [] },
    { name: "visual_palette", score: 95, status: "pass", issues: [] },
    { name: "typography", score: 82, status: "pass", issues: [] },
    { name: "imagery_style", score: 78, status: "warning", issues: [] },
    { name: "logo_usage", score: 90, status: "pass", issues: [] },
  ];

  describe("computeOverallScore", () => {
    it("should compute weighted average from dimension scores", () => {
      const score = computeOverallScore(allPassDimensions, DEFAULT_DIMENSION_WEIGHTS);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThan(100);
    });

    it("should use custom weights when provided", () => {
      const customWeights = { tone: 50, vocabulary: 10, key_messages: 10, audience_fit: 10, visual_palette: 5, typography: 5, imagery_style: 5, logo_usage: 5 };
      const score = computeOverallScore(allPassDimensions, customWeights);
      // Tone has score 90 with weight 50%, so overall should be pulled toward 90
      expect(score).toBeGreaterThan(85);
    });
  });

  describe("determineVerdict", () => {
    const defaultConfig: BrandGuardianConfig = {
      clientId: "c1",
      passThreshold: 80,
      autoPassThreshold: 95,
      strictMode: false,
      weightsByDimension: {},
    };

    it("should return pass for score >= passThreshold", () => {
      expect(determineVerdict(85, allPassDimensions, defaultConfig)).toBe("pass");
    });

    it("should return fail for score < 60", () => {
      expect(determineVerdict(55, allPassDimensions, defaultConfig)).toBe("fail");
    });

    it("should return needs_revision for score between 60 and threshold", () => {
      expect(determineVerdict(70, allPassDimensions, defaultConfig)).toBe("needs_revision");
    });

    it("should return fail in strict mode if any critical issue exists", () => {
      const dims: BrandDimensionResult[] = [
        ...allPassDimensions.slice(0, 7),
        { name: "logo_usage", score: 40, status: "fail", issues: [
          { description: "Logo on wrong bg", severity: "critical", suggestion: "Use white bg", reference: "Logo" }
        ]},
      ];
      const strictConfig = { ...defaultConfig, strictMode: true };
      expect(determineVerdict(82, dims, strictConfig)).toBe("fail");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: FAIL — cannot import from `./guardian-engine.js`.

- [ ] **Step 3: Implement guardian engine**

Create `src/services/brand-guardian/guardian-engine.ts`:

```typescript
import { db, schema } from "../../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { validateVerbal } from "./verbal-validator.js";
import { validateVisual } from "./visual-validator.js";
import type {
  BrandValidation,
  BrandDimensionResult,
  BrandGuardianConfig,
  BrandRule,
  ValidateContentInput,
} from "./types.js";
import { DEFAULT_DIMENSION_WEIGHTS } from "./types.js";

export function computeOverallScore(
  dimensions: BrandDimensionResult[],
  weights: Record<string, number>,
): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const dim of dimensions) {
    const w = weights[dim.name] ?? 10;
    weightedSum += dim.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export function determineVerdict(
  score: number,
  dimensions: BrandDimensionResult[],
  config: BrandGuardianConfig,
): "pass" | "needs_revision" | "fail" {
  // Strict mode: any critical issue = fail regardless of score
  if (config.strictMode) {
    const hasCritical = dimensions.some((d) =>
      d.issues.some((i) => i.severity === "critical"),
    );
    if (hasCritical) return "fail";
  }

  if (score >= config.passThreshold) return "pass";
  if (score < 60) return "fail";
  return "needs_revision";
}

async function loadBrandDna(clientId: string): Promise<string> {
  // Try to find the latest brand report from intelligence listener
  const [run] = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(
      and(
        eq(schema.continuousAgentRuns.clientId, clientId),
        eq(schema.continuousAgentRuns.listenerType, "brand"),
        eq(schema.continuousAgentRuns.step, "report"),
        eq(schema.continuousAgentRuns.status, "completed"),
      ),
    )
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(1);

  if (run?.outputData) {
    const data = run.outputData as Record<string, unknown>;
    if (typeof data.report === "string") return data.report;
  }

  // Fallback: check client's brand assets
  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId));

  if (client?.brandAssets) {
    const assets = client.brandAssets as Record<string, unknown>;
    if (typeof assets.brandDna === "string") return assets.brandDna;
  }

  return "No Brand DNA available. Evaluate based on general best practices.";
}

async function loadRules(clientId: string): Promise<BrandRule[]> {
  const rows = await db
    .select()
    .from(schema.brandRules)
    .where(
      and(
        eq(schema.brandRules.clientId, clientId),
        eq(schema.brandRules.enabled, true),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    dimension: r.dimension,
    type: r.type as BrandRule["type"],
    rule: r.rule,
    source: r.source as BrandRule["source"],
    examples: (r.examples ?? []) as BrandRule["examples"],
    confidence: parseFloat(r.confidence ?? "1.00"),
    enabled: r.enabled,
  }));
}

async function loadConfig(clientId: string): Promise<BrandGuardianConfig> {
  const [row] = await db
    .select()
    .from(schema.brandGuardianConfigs)
    .where(eq(schema.brandGuardianConfigs.clientId, clientId));

  if (row) {
    return {
      clientId,
      passThreshold: row.passThreshold,
      autoPassThreshold: row.autoPassThreshold,
      strictMode: row.strictMode,
      weightsByDimension: (row.weightsByDimension ?? {}) as Record<string, number>,
    };
  }

  return {
    clientId,
    passThreshold: 80,
    autoPassThreshold: 95,
    strictMode: false,
    weightsByDimension: {},
  };
}

export async function validateContent(input: ValidateContentInput & { clientId: string }): Promise<BrandValidation> {
  const { clientId, content, contentType, projectId } = input;

  const [brandDna, rules, config] = await Promise.all([
    input.brandDna ? Promise.resolve(input.brandDna) : loadBrandDna(clientId),
    loadRules(clientId),
    loadConfig(clientId),
  ]);

  const [verbalDims, visualDims] = await Promise.all([
    validateVerbal({ content, brandDna, rules }),
    validateVisual({ content, brandDna, rules }),
  ]);

  const allDimensions = [...verbalDims, ...visualDims];
  const weights = { ...DEFAULT_DIMENSION_WEIGHTS, ...config.weightsByDimension };
  const overallScore = computeOverallScore(allDimensions, weights);
  const verdict = determineVerdict(overallScore, allDimensions, config);

  const allIssues = allDimensions.flatMap((d) => d.issues);
  const autoFixable = allIssues.length > 0 && allIssues.every((i) => i.severity === "minor");
  const autoFixSuggestions = autoFixable
    ? allIssues.map((i) => i.suggestion)
    : [];

  const summary = `Brand consistency score: ${overallScore}/100. Verdict: ${verdict}. ${allIssues.length} issue(s) found across ${allDimensions.filter((d) => d.issues.length > 0).length} dimension(s).`;

  const validation: BrandValidation = {
    overallScore,
    verdict,
    dimensions: allDimensions,
    summary,
    autoFixable,
    autoFixSuggestions,
  };

  // Store validation in DB
  await db.insert(schema.brandValidations).values({
    clientId,
    projectId: projectId ?? null,
    contentType,
    overallScore,
    verdict: verdict as any,
    dimensions: allDimensions as any,
    summary,
    autoFixable,
    autoFixSuggestions: autoFixSuggestions as any,
  });

  return validation;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: 8 tests PASS (2 verbal + 2 visual + 4 engine).

- [ ] **Step 5: Commit**

```bash
git add src/services/brand-guardian/guardian-engine.ts src/services/brand-guardian/brand-guardian.test.ts
git commit -m "feat(brand-guardian): implement guardian engine (BG-L) with weighted scoring and verdict logic"
```

---

## Task 6: Rule Learner

**Files:**
- Create: `src/services/brand-guardian/rule-learner.ts`
- Modify: `src/services/brand-guardian/brand-guardian.test.ts`

**Context:** When a human overrides a validation (approves a "fail" or rejects a "pass"), the rule learner extracts a new brand rule from the feedback. Uses `generateText()` to interpret the feedback and create a structured rule.

- [ ] **Step 1: Add rule learner tests**

Append to `brand-guardian.test.ts`:

```typescript
import { extractRuleFromFeedback } from "./rule-learner.js";

describe("RuleLearner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract a rule from human feedback", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimension: "tone",
      type: "prefer",
      rule: "Use conversational tone for social media posts",
      examples: [
        { correct: "Check out our latest update!", incorrect: "We hereby announce the release of..." }
      ],
    }));

    const result = await extractRuleFromFeedback(
      "The tone is too formal for Instagram. We want casual and fun.",
      "pass",
      [{ name: "tone", score: 85, status: "pass", issues: [] }],
    );

    expect(result.dimension).toBe("tone");
    expect(result.type).toBe("prefer");
    expect(result.source).toBe("human_feedback");
    expect(result.examples).toHaveLength(1);
  });

  it("should return learned source and default confidence", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimension: "vocabulary",
      type: "never",
      rule: "Never use the word 'synergy'",
      examples: [
        { correct: "collaboration", incorrect: "synergy" }
      ],
    }));

    const result = await extractRuleFromFeedback(
      "Stop using 'synergy', it's cringe",
      "fail",
      [],
    );

    expect(result.source).toBe("human_feedback");
    expect(result.confidence).toBe(0.8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: FAIL — module `./rule-learner.js` not found.

- [ ] **Step 3: Implement rule learner**

Create `src/services/brand-guardian/rule-learner.ts`:

```typescript
import { generateText } from "../../providers/generate-text.js";
import type { BrandDimensionResult } from "./types.js";

interface ExtractedRule {
  dimension: string;
  type: "always" | "never" | "prefer" | "avoid";
  rule: string;
  source: "human_feedback";
  examples: Array<{ correct: string; incorrect: string }>;
  confidence: number;
}

function parseJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(stripped);
}

export async function extractRuleFromFeedback(
  feedback: string,
  overrideAction: string,
  dimensions: BrandDimensionResult[],
): Promise<ExtractedRule> {
  const systemPrompt = `You extract brand rules from human feedback on content validation.
Given the feedback and the validation context, produce a single brand rule.

Return ONLY valid JSON:
{
  "dimension": "tone"|"vocabulary"|"key_messages"|"audience_fit"|"visual_palette"|"typography"|"imagery_style"|"logo_usage",
  "type": "always"|"never"|"prefer"|"avoid",
  "rule": "Clear description of the rule",
  "examples": [{ "correct": "Good example", "incorrect": "Bad example" }]
}`;

  const userPrompt = `## Human Feedback
"${feedback}"

## Override Action
The human ${overrideAction === "pass" ? "rejected a passing validation" : "approved a failing validation"}.

## Validation Dimensions
${dimensions.map((d) => `${d.name}: ${d.score}/100 (${d.status})`).join("\n")}

Extract a brand rule from this feedback.`;

  const raw = await generateText("gemini-2.5-flash", systemPrompt, userPrompt, 1000);
  const parsed = parseJson(raw) as {
    dimension: string;
    type: "always" | "never" | "prefer" | "avoid";
    rule: string;
    examples: Array<{ correct: string; incorrect: string }>;
  };

  return {
    ...parsed,
    source: "human_feedback" as const,
    confidence: 0.8,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/brand-guardian/rule-learner.ts src/services/brand-guardian/brand-guardian.test.ts
git commit -m "feat(brand-guardian): implement rule learner for human feedback"
```

---

## Task 7: Manual Generator (BG-003)

**Files:**
- Create: `src/services/brand-guardian/manual-generator.ts`
- Modify: `src/services/brand-guardian/brand-guardian.test.ts`

**Context:** BG-003 generates a brand manual in markdown. It assembles Brand DNA, learned rules, and recent validation examples into 8 sections. Uses `generateText()` for section narrative generation. Stores result in `brandManuals` table with a share token for public access.

- [ ] **Step 1: Add manual generator tests**

Append to `brand-guardian.test.ts`:

```typescript
import { generateManualContent } from "./manual-generator.js";

describe("ManualGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate markdown with all 8 sections", async () => {
    mockGenerateText.mockResolvedValueOnce([
      "# Brand Manual: TestCo",
      "## 1. Brand Overview",
      "TestCo is an innovative technology company.",
      "## 2. Brand Personality",
      "Professional, warm, innovative.",
      "## 3. Verbal Identity",
      "Use professional tone. Avoid slang.",
      "## 4. Visual Identity",
      "Primary: #2563EB. Font: Inter.",
      "## 5. Logo Usage",
      "Always on white background.",
      "## 6. Application Examples",
      "See recent content validations.",
      "## 7. Channel Guidelines",
      "LinkedIn: formal. Instagram: casual.",
      "## 8. Do's and Don'ts",
      "DO: Use warm language. DON'T: Use jargon.",
    ].join("\n"));

    const markdown = await generateManualContent(
      "TestCo Brand DNA here",
      [{ id: "r1", clientId: "c1", dimension: "tone", type: "always" as const, rule: "Be warm", source: "brand_dna" as const, examples: [], confidence: 1.0, enabled: true }],
      [],
    );

    expect(markdown).toContain("# Brand Manual");
    expect(markdown).toContain("Brand Overview");
    expect(markdown).toContain("Do's and Don'ts");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: FAIL — module `./manual-generator.js` not found.

- [ ] **Step 3: Implement manual generator**

Create `src/services/brand-guardian/manual-generator.ts`:

```typescript
import { randomBytes } from "crypto";
import { db, schema } from "../../db/index.js";
import { eq, desc } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import type { BrandRule } from "./types.js";

interface ValidationExample {
  contentType: string;
  score: number;
  verdict: string;
  summary: string;
}

export async function generateManualContent(
  brandDna: string,
  rules: BrandRule[],
  recentValidations: ValidationExample[],
): Promise<string> {
  const rulesSection = rules.length > 0
    ? rules.map((r) => `- [${r.dimension}] ${r.type.toUpperCase()}: ${r.rule} (source: ${r.source})`).join("\n")
    : "No additional rules defined yet.";

  const examplesSection = recentValidations.length > 0
    ? recentValidations.map((v) => `- ${v.contentType}: ${v.score}/100 (${v.verdict}) — ${v.summary}`).join("\n")
    : "No validation examples available yet.";

  const systemPrompt = `You are BG-003 Manual Generator. Generate a comprehensive brand manual in Markdown.
The manual MUST contain exactly these 8 sections:
1. Brand Overview
2. Brand Personality
3. Verbal Identity (tone, vocabulary, do's/don'ts, examples)
4. Visual Identity (colors, typography, imagery)
5. Logo Usage (versions, sizes, clear space)
6. Application Examples (from recent content validations)
7. Channel Guidelines (per-channel adaptations)
8. Do's and Don'ts (gallery of correct vs incorrect)

Write in Spanish. Be specific and actionable. Use the Brand DNA as primary source.`;

  const userPrompt = `## Brand DNA
${brandDna}

## Learned Brand Rules
${rulesSection}

## Recent Validation Examples
${examplesSection}

Generate the complete brand manual.`;

  return await generateText("claude-sonnet-4-20250514", systemPrompt, userPrompt, 8000);
}

export function generateShareToken(): string {
  return randomBytes(32).toString("hex");
}

export async function regenerateManual(clientId: string, brandDna: string): Promise<{ id: string; shareToken: string }> {
  // Load rules
  const rules = await db
    .select()
    .from(schema.brandRules)
    .where(eq(schema.brandRules.clientId, clientId));

  const typedRules: BrandRule[] = rules.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    dimension: r.dimension,
    type: r.type as BrandRule["type"],
    rule: r.rule,
    source: r.source as BrandRule["source"],
    examples: (r.examples ?? []) as BrandRule["examples"],
    confidence: parseFloat(r.confidence ?? "1.00"),
    enabled: r.enabled,
  }));

  // Load recent validations
  const validations = await db
    .select()
    .from(schema.brandValidations)
    .where(eq(schema.brandValidations.clientId, clientId))
    .orderBy(desc(schema.brandValidations.createdAt))
    .limit(10);

  const examples: ValidationExample[] = validations.map((v) => ({
    contentType: v.contentType,
    score: v.overallScore,
    verdict: v.verdict,
    summary: v.summary,
  }));

  const markdown = await generateManualContent(brandDna, typedRules, examples);

  // Get next version
  const [latest] = await db
    .select()
    .from(schema.brandManuals)
    .where(eq(schema.brandManuals.clientId, clientId))
    .orderBy(desc(schema.brandManuals.version))
    .limit(1);

  const nextVersion = (latest?.version ?? 0) + 1;
  const shareToken = generateShareToken();

  const [manual] = await db
    .insert(schema.brandManuals)
    .values({
      clientId,
      version: nextVersion,
      contentMarkdown: markdown,
      shareToken,
    })
    .returning();

  return { id: manual.id, shareToken: manual.shareToken };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/brand-guardian/brand-guardian.test.ts`
Expected: 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/brand-guardian/manual-generator.ts src/services/brand-guardian/brand-guardian.test.ts
git commit -m "feat(brand-guardian): implement manual generator (BG-003)"
```

---

## Task 8: API Validators

**Files:**
- Modify: `src/api/validators.ts`

**Context:** Add Zod schemas for all brand guardian endpoints. Follow the existing pattern with `parseBody()`.

- [ ] **Step 1: Add brand guardian schemas**

Append before the `parseBody` function in `src/api/validators.ts`:

```typescript
// ── Brand Guardian: Validate ──

export const validateContentSchema = z.object({
  content: z.string().min(1).max(50000),
  contentType: z.string().min(1).max(50),
  projectId: z.string().uuid().optional(),
  brandDna: z.string().max(50000).optional(),
});

// ── Brand Guardian: Rules ──

export const createBrandRuleSchema = z.object({
  dimension: z.enum(["tone", "vocabulary", "key_messages", "audience_fit", "visual_palette", "typography", "imagery_style", "logo_usage"]),
  type: z.enum(["always", "never", "prefer", "avoid"]),
  rule: z.string().min(1).max(2000),
  source: z.enum(["brand_dna", "human_feedback", "learned"]).default("human_feedback"),
  examples: z.array(z.object({
    correct: z.string(),
    incorrect: z.string(),
  })).default([]),
});

export const updateBrandRuleSchema = z.object({
  type: z.enum(["always", "never", "prefer", "avoid"]).optional(),
  rule: z.string().min(1).max(2000).optional(),
  enabled: z.boolean().optional(),
  examples: z.array(z.object({
    correct: z.string(),
    incorrect: z.string(),
  })).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

// ── Brand Guardian: Config ──

export const upsertBrandGuardianConfigSchema = z.object({
  passThreshold: z.number().int().min(0).max(100).optional(),
  autoPassThreshold: z.number().int().min(0).max(100).optional(),
  strictMode: z.boolean().optional(),
  weightsByDimension: z.record(z.number().min(0).max(100)).optional(),
});

// ── Brand Guardian: Override ──

export const brandOverrideSchema = z.object({
  action: z.enum(["approve", "reject"]),
  feedback: z.string().min(1).max(5000),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/api/validators.ts
git commit -m "feat(brand-guardian): add Zod validation schemas for brand guardian endpoints"
```

---

## Task 9: API Routes

**Files:**
- Create: `src/api/brand-routes.ts`
- Modify: `src/api/routes.ts`

**Context:** 12 API endpoints. All under `/api/brand/:clientId/*` (protected by session + tenant guard) except the public manual share endpoint. Follow patterns from `engine-routes.ts` and `intelligence-routes.ts`.

- [ ] **Step 1: Create brand routes**

```typescript
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { validateContent } from "../services/brand-guardian/guardian-engine.js";
import { extractRuleFromFeedback } from "../services/brand-guardian/rule-learner.js";
import { regenerateManual } from "../services/brand-guardian/manual-generator.js";
import {
  validateContentSchema,
  createBrandRuleSchema,
  updateBrandRuleSchema,
  upsertBrandGuardianConfigSchema,
  brandOverrideSchema,
  parseBody,
} from "./validators.js";

export const brandRoutes = new Hono();

// ── Validate Content ──

brandRoutes.post("/api/brand/:clientId/validate", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(validateContentSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const result = await validateContent({
    clientId,
    content: parsed.data.content,
    contentType: parsed.data.contentType,
    projectId: parsed.data.projectId,
    brandDna: parsed.data.brandDna,
  });

  return c.json(result);
});

// ── Validation History ──

brandRoutes.get("/api/brand/:clientId/validations", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "20");
  const validations = await db
    .select()
    .from(schema.brandValidations)
    .where(eq(schema.brandValidations.clientId, clientId))
    .orderBy(desc(schema.brandValidations.createdAt))
    .limit(limit);
  return c.json(validations);
});

// ── Brand Score (latest) ──

brandRoutes.get("/api/brand/:clientId/score", async (c) => {
  const clientId = c.req.param("clientId");
  const [latest] = await db
    .select()
    .from(schema.brandValidations)
    .where(eq(schema.brandValidations.clientId, clientId))
    .orderBy(desc(schema.brandValidations.createdAt))
    .limit(1);

  if (!latest) return c.json({ score: null, message: "No validations yet" });
  return c.json({
    score: latest.overallScore,
    verdict: latest.verdict,
    summary: latest.summary,
    validatedAt: latest.createdAt,
  });
});

// ── Override Validation ──

brandRoutes.post("/api/brand/:clientId/validations/:validationId/override", async (c) => {
  const { clientId, validationId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(brandOverrideSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  // Load the validation
  const [validation] = await db
    .select()
    .from(schema.brandValidations)
    .where(
      and(
        eq(schema.brandValidations.id, validationId),
        eq(schema.brandValidations.clientId, clientId),
      ),
    );

  if (!validation) return c.json({ error: "Validation not found" }, 404);

  // Update the validation with override
  await db
    .update(schema.brandValidations)
    .set({
      humanOverride: parsed.data.action,
      humanFeedback: parsed.data.feedback,
    })
    .where(eq(schema.brandValidations.id, validationId));

  // Learn a rule from the feedback
  const dimensions = (validation.dimensions as any[]) ?? [];
  const extracted = await extractRuleFromFeedback(
    parsed.data.feedback,
    parsed.data.action,
    dimensions,
  );

  // Store the learned rule
  const [newRule] = await db
    .insert(schema.brandRules)
    .values({
      clientId,
      dimension: extracted.dimension,
      type: extracted.type as any,
      rule: extracted.rule,
      source: "human_feedback" as any,
      examples: extracted.examples as any,
      confidence: String(extracted.confidence),
    })
    .returning();

  return c.json({ override: parsed.data.action, learnedRule: newRule });
});

// ── Brand Rules ──

brandRoutes.get("/api/brand/:clientId/rules", async (c) => {
  const clientId = c.req.param("clientId");
  const rules = await db
    .select()
    .from(schema.brandRules)
    .where(eq(schema.brandRules.clientId, clientId))
    .orderBy(desc(schema.brandRules.createdAt));
  return c.json(rules);
});

brandRoutes.post("/api/brand/:clientId/rules", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(createBrandRuleSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [rule] = await db
    .insert(schema.brandRules)
    .values({
      clientId,
      dimension: parsed.data.dimension,
      type: parsed.data.type as any,
      rule: parsed.data.rule,
      source: (parsed.data.source ?? "human_feedback") as any,
      examples: parsed.data.examples as any,
    })
    .returning();

  return c.json(rule, 201);
});

brandRoutes.patch("/api/brand/:clientId/rules/:ruleId", async (c) => {
  const { clientId, ruleId } = c.req.param();
  const body = await c.req.json();
  const parsed = parseBody(updateBrandRuleSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const updates: Record<string, unknown> = {};
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.rule !== undefined) updates.rule = parsed.data.rule;
  if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
  if (parsed.data.examples !== undefined) updates.examples = parsed.data.examples;

  const [updated] = await db
    .update(schema.brandRules)
    .set(updates)
    .where(
      and(
        eq(schema.brandRules.id, ruleId),
        eq(schema.brandRules.clientId, clientId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Rule not found" }, 404);
  return c.json(updated);
});

// ── Config ──

brandRoutes.get("/api/brand/:clientId/config", async (c) => {
  const clientId = c.req.param("clientId");
  const [config] = await db
    .select()
    .from(schema.brandGuardianConfigs)
    .where(eq(schema.brandGuardianConfigs.clientId, clientId));

  if (!config) {
    return c.json({
      clientId,
      passThreshold: 80,
      autoPassThreshold: 95,
      strictMode: false,
      weightsByDimension: {},
    });
  }
  return c.json(config);
});

brandRoutes.put("/api/brand/:clientId/config", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const parsed = parseBody(upsertBrandGuardianConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [existing] = await db
    .select()
    .from(schema.brandGuardianConfigs)
    .where(eq(schema.brandGuardianConfigs.clientId, clientId));

  if (existing) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.passThreshold !== undefined) updates.passThreshold = parsed.data.passThreshold;
    if (parsed.data.autoPassThreshold !== undefined) updates.autoPassThreshold = parsed.data.autoPassThreshold;
    if (parsed.data.strictMode !== undefined) updates.strictMode = parsed.data.strictMode;
    if (parsed.data.weightsByDimension !== undefined) updates.weightsByDimension = parsed.data.weightsByDimension;

    const [updated] = await db
      .update(schema.brandGuardianConfigs)
      .set(updates)
      .where(eq(schema.brandGuardianConfigs.id, existing.id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(schema.brandGuardianConfigs)
    .values({
      clientId,
      passThreshold: parsed.data.passThreshold ?? 80,
      autoPassThreshold: parsed.data.autoPassThreshold ?? 95,
      strictMode: parsed.data.strictMode ?? false,
      weightsByDimension: (parsed.data.weightsByDimension ?? {}) as any,
    })
    .returning();
  return c.json(created, 201);
});

// ── Brand Manual ──

brandRoutes.get("/api/brand/:clientId/manual", async (c) => {
  const clientId = c.req.param("clientId");
  const [manual] = await db
    .select()
    .from(schema.brandManuals)
    .where(
      and(
        eq(schema.brandManuals.clientId, clientId),
        eq(schema.brandManuals.published, true),
      ),
    )
    .orderBy(desc(schema.brandManuals.version))
    .limit(1);

  if (!manual) return c.json({ error: "No brand manual generated yet" }, 404);
  return c.json(manual);
});

brandRoutes.get("/api/brand/:clientId/manual/versions", async (c) => {
  const clientId = c.req.param("clientId");
  const versions = await db
    .select({
      id: schema.brandManuals.id,
      version: schema.brandManuals.version,
      shareToken: schema.brandManuals.shareToken,
      published: schema.brandManuals.published,
      generatedAt: schema.brandManuals.generatedAt,
    })
    .from(schema.brandManuals)
    .where(eq(schema.brandManuals.clientId, clientId))
    .orderBy(desc(schema.brandManuals.version));
  return c.json(versions);
});

brandRoutes.post("/api/brand/:clientId/manual/regenerate", async (c) => {
  const clientId = c.req.param("clientId");

  // Load brand DNA
  const [run] = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(
      and(
        eq(schema.continuousAgentRuns.clientId, clientId),
        eq(schema.continuousAgentRuns.listenerType, "brand"),
        eq(schema.continuousAgentRuns.step, "report"),
        eq(schema.continuousAgentRuns.status, "completed"),
      ),
    )
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(1);

  let brandDna = "No Brand DNA available.";
  if (run?.outputData) {
    const data = run.outputData as Record<string, unknown>;
    if (typeof data.report === "string") brandDna = data.report;
  }

  const result = await regenerateManual(clientId, brandDna);
  return c.json(result, 201);
});

// ── Public: Brand Manual by Share Token ──

brandRoutes.get("/api/brand/manual/:shareToken", async (c) => {
  const shareToken = c.req.param("shareToken");
  const [manual] = await db
    .select()
    .from(schema.brandManuals)
    .where(
      and(
        eq(schema.brandManuals.shareToken, shareToken),
        eq(schema.brandManuals.published, true),
      ),
    );

  if (!manual) return c.json({ error: "Manual not found" }, 404);
  return c.json({ content: manual.contentMarkdown, version: manual.version, generatedAt: manual.generatedAt });
});
```

- [ ] **Step 2: Mount brand routes in main app**

In `src/api/routes.ts`, add import:

```typescript
import { brandRoutes } from "./brand-routes.js";
```

Add middleware (after existing `/api/intelligence/*` lines):

```typescript
app.use("/api/brand/:clientId/*", requireSession, requireTenantMatch);
```

Note: The public share endpoint `/api/brand/manual/:shareToken` does NOT have `:clientId` in the path, so it won't be caught by the middleware above.

Add route mount:

```typescript
app.route("/", brandRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add src/api/brand-routes.ts src/api/routes.ts
git commit -m "feat(brand-guardian): add 12 API endpoints for brand validation, rules, config, and manual"
```

---

## Task 10: Agent Registry + Artifact Steps

**Files:**
- Modify: `src/agents/registry.ts`
- Modify: `src/shared/types.ts`

**Context:** Register the 4 Brand Guardian agents. BG-L replaces the XA-003 stub. Update ARTIFACT_STEPS with brand guardian steps for tracking.

- [ ] **Step 1: Update agent registry**

Replace the existing `"XA-003"` entry in `src/agents/registry.ts` with `"BG-L"` and add the 3 sub-agents. Place them together:

```typescript
"BG-L": {
  id: "BG-L",
  name: "Brand Guardian Director",
  skillFile: "agents/BG-L_brand_guardian_director.md",
  team: 12,
  level: "leader",
  steps: [] as any,
  gates: ["bb-g2", "st-g2", "gd-g1", "gd-g2", "wr-g2", "au-g2", "wb-g2", "pp-g1", "ad-g2", "cm-g2", "em-g2", "sl-g2"] as any,
  autonomy: 75,
},
"BG-001": {
  id: "BG-001",
  name: "Verbal Validator",
  skillFile: "agents/BG-001_verbal_validator.md",
  team: 12,
  level: "sub",
  steps: [] as any,
  gates: [] as any,
  autonomy: 90,
},
"BG-002": {
  id: "BG-002",
  name: "Visual Validator",
  skillFile: "agents/BG-002_visual_validator.md",
  team: 12,
  level: "sub",
  steps: [] as any,
  gates: [] as any,
  autonomy: 85,
},
"BG-003": {
  id: "BG-003",
  name: "Manual Generator",
  skillFile: "agents/BG-003_manual_generator.md",
  team: 12,
  level: "sub",
  steps: [] as any,
  gates: [] as any,
  autonomy: 85,
},
```

Remove the old `"XA-003"` entry entirely.

- [ ] **Step 2: Add artifact steps**

In `src/shared/types.ts`, add Brand Guardian steps to the `ARTIFACT_STEPS` array:

```typescript
// Brand Guardian
"bg_validate", "bg_verbal", "bg_visual", "bg_score", "bg_manual",
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/registry.ts src/shared/types.ts
git commit -m "feat(brand-guardian): register BG-L, BG-001, BG-002, BG-003 agents and artifact steps"
```

---

## Task 11: Agent Skill Files

**Files:**
- Create: `agents/BG-L_brand_guardian_director.md`
- Create: `agents/BG-001_verbal_validator.md`
- Create: `agents/BG-002_visual_validator.md`
- Create: `agents/BG-003_manual_generator.md`

**Context:** Each agent gets a markdown skill file describing its role, capabilities, and decision criteria. Follow the pattern from Phase 1 intelligence agent files. These are used by the agent runtime for system prompts.

- [ ] **Step 1: Create BG-L skill file**

```markdown
# BG-L: Brand Guardian Director

## Role
Lead brand enforcement agent. Orchestrates verbal and visual validation, manages scoring logic, evolves brand rules through learning.

## Capabilities
- Orchestrate BG-001 (verbal) and BG-002 (visual) validators
- Compute weighted brand consistency scores
- Determine pass/fail verdicts based on client configuration
- Learn new brand rules from human feedback overrides
- Manage brand guardian configuration per client

## Decision Criteria
- **Pass** (score >= passThreshold): Content aligns with brand identity
- **Needs Revision** (60 <= score < passThreshold): Minor issues need fixing
- **Fail** (score < 60): Significant brand misalignment
- **Strict Mode**: Any critical issue = automatic fail regardless of score

## Model
claude-sonnet-4

## Autonomy Level
75% — Passes and minor issues handled automatically. Critical failures and rule evolution escalated to human.

## Integration Points
- Reads Brand DNA from Intelligence Engine (Phase 1 brand listener reports)
- Loads learned rules from brand_rules table
- Stores validation results in brand_validations table
- Triggers rule learning on human overrides
- Applied at quality gates across ALL production motors

## Team
12 — Intelligence & Brand Guardian
```

- [ ] **Step 2: Create BG-001 skill file**

```markdown
# BG-001: Verbal Validator

## Role
Evaluates content against brand verbal identity across 4 dimensions.

## Dimensions
1. **Tone of voice** — Formal/informal, personality, emotional register
2. **Vocabulary** — Approved/banned terms, jargon usage
3. **Key messages** — Core value proposition alignment
4. **Audience fit** — Language level, cultural sensitivity

## Scoring
- 0-100 per dimension
- Pass: >= 80 | Warning: 60-79 | Fail: < 60

## Model
gemini-2.5-flash

## Autonomy Level
90% — Fully automated verbal analysis.

## Team
12 — Intelligence & Brand Guardian
```

- [ ] **Step 3: Create BG-002 skill file**

```markdown
# BG-002: Visual Validator

## Role
Evaluates content against brand visual identity across 4 dimensions.

## Dimensions
1. **Visual palette** — Colors, combinations, contrast
2. **Typography** — Font family, hierarchy, sizing
3. **Imagery style** — Photo/illustration/icon consistency
4. **Logo usage** — Version, size, clear space, background

## Scoring
- 0-100 per dimension
- Pass: >= 80 | Warning: 60-79 | Fail: < 60
- Text-only content with no visual references scores 100 on all visual dimensions

## Model
gemini-2.5-flash

## Autonomy Level
85% — Automated visual analysis. Escalates ambiguous imagery decisions.

## Team
12 — Intelligence & Brand Guardian
```

- [ ] **Step 4: Create BG-003 skill file**

```markdown
# BG-003: Manual Generator

## Role
Generates and maintains the live brand manual document.

## Manual Sections
1. Brand Overview
2. Brand Personality
3. Verbal Identity
4. Visual Identity
5. Logo Usage
6. Application Examples
7. Channel Guidelines
8. Do's and Don'ts

## Sources
- Brand DNA Document (from Brand Builder or Intelligence Engine)
- Learned brand rules (from human feedback)
- Recent validation examples (from brand_validations)

## Output
- Markdown document stored in brand_manuals table
- Shareable via unique token URL (no auth required)
- Versioned — each regeneration creates a new version

## Triggers
- Manual: POST /api/brand/:clientId/manual/regenerate
- Automatic: After Brand DNA update, new rules learned, quarterly refresh

## Model
claude-sonnet-4

## Autonomy Level
85% — Generates manual automatically. Escalates if Brand DNA is missing.

## Team
12 — Intelligence & Brand Guardian
```

- [ ] **Step 5: Commit**

```bash
git add agents/BG-L_brand_guardian_director.md agents/BG-001_verbal_validator.md agents/BG-002_visual_validator.md agents/BG-003_manual_generator.md
git commit -m "docs(brand-guardian): add agent skill files for BG-L, BG-001, BG-002, BG-003"
```

---

## Task 12: Integration Tests

**Files:**
- Create: `src/services/brand-guardian/integration.test.ts`

**Context:** Integration tests verify the full flow: validate content → check scoring → override → rule learning → manual generation. Mock `generateText` and `db` at the module level. Follow patterns from `src/services/intelligence/integration.test.ts`.

- [ ] **Step 1: Write integration tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../providers/generate-text.js", () => ({
  generateText: vi.fn(),
}));

vi.mock("../../db/index.js", () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockReturnThis();
  const mockOrderBy = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockInsert = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockReturnThis();
  const mockReturning = vi.fn().mockResolvedValue([{ id: "v1", overallScore: 85, verdict: "pass", summary: "test" }]);
  const mockUpdate = vi.fn().mockReturnThis();
  const mockSet = vi.fn().mockReturnThis();

  return {
    db: {
      select: mockSelect,
      from: mockFrom,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      insert: mockInsert,
      values: mockValues,
      returning: mockReturning,
      update: mockUpdate,
      set: mockSet,
    },
    schema: {
      brandRules: {},
      brandValidations: {},
      brandGuardianConfigs: {},
      brandManuals: {},
      continuousAgentRuns: {},
      clients: {},
    },
  };
});

import { generateText } from "../../providers/generate-text.js";
import { computeOverallScore, determineVerdict } from "./guardian-engine.js";
import { validateVerbal } from "./verbal-validator.js";
import { validateVisual } from "./visual-validator.js";
import { extractRuleFromFeedback } from "./rule-learner.js";
import { generateManualContent } from "./manual-generator.js";
import { DEFAULT_DIMENSION_WEIGHTS } from "./types.js";
import type { BrandGuardianConfig } from "./types.js";

const mockGenerateText = vi.mocked(generateText);

describe("Brand Guardian Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run full validation pipeline: verbal + visual + scoring", async () => {
    // Mock verbal validation LLM response
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "tone", score: 88, status: "pass", issues: [] },
        { name: "vocabulary", score: 92, status: "pass", issues: [] },
        { name: "key_messages", score: 75, status: "warning", issues: [
          { description: "Missing core value prop", severity: "minor", suggestion: "Add innovation message", reference: "Key Messages" }
        ]},
        { name: "audience_fit", score: 85, status: "pass", issues: [] },
      ],
    }));

    // Mock visual validation LLM response
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimensions: [
        { name: "visual_palette", score: 95, status: "pass", issues: [] },
        { name: "typography", score: 80, status: "pass", issues: [] },
        { name: "imagery_style", score: 70, status: "warning", issues: [] },
        { name: "logo_usage", score: 90, status: "pass", issues: [] },
      ],
    }));

    const verbal = await validateVerbal({ content: "Test", brandDna: "Brand DNA", rules: [] });
    const visual = await validateVisual({ content: "Test", brandDna: "Brand DNA", rules: [] });

    const allDims = [...verbal, ...visual];
    expect(allDims).toHaveLength(8);

    const score = computeOverallScore(allDims, DEFAULT_DIMENSION_WEIGHTS);
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThan(100);

    const config: BrandGuardianConfig = {
      clientId: "c1", passThreshold: 80, autoPassThreshold: 95,
      strictMode: false, weightsByDimension: {},
    };
    const verdict = determineVerdict(score, allDims, config);
    expect(["pass", "needs_revision"]).toContain(verdict);
  });

  it("should extract rule from override feedback", async () => {
    mockGenerateText.mockResolvedValueOnce(JSON.stringify({
      dimension: "tone",
      type: "prefer",
      rule: "Use warmer, more personal tone in social posts",
      examples: [{ correct: "We'd love your feedback!", incorrect: "Submit your feedback." }],
    }));

    const rule = await extractRuleFromFeedback(
      "Too cold and corporate for our Instagram",
      "reject",
      [{ name: "tone", score: 82, status: "pass", issues: [] }],
    );

    expect(rule.dimension).toBe("tone");
    expect(rule.source).toBe("human_feedback");
    expect(rule.confidence).toBe(0.8);
  });

  it("should generate brand manual with all sections", async () => {
    mockGenerateText.mockResolvedValueOnce(
      "# Brand Manual\n## 1. Brand Overview\nTest\n## 2. Brand Personality\nTest\n" +
      "## 3. Verbal Identity\nTest\n## 4. Visual Identity\nTest\n" +
      "## 5. Logo Usage\nTest\n## 6. Application Examples\nTest\n" +
      "## 7. Channel Guidelines\nTest\n## 8. Do's and Don'ts\nTest",
    );

    const markdown = await generateManualContent("Brand DNA", [], []);
    expect(markdown).toContain("Brand Manual");
    expect(markdown).toContain("Brand Overview");
    expect(markdown).toContain("Do's and Don'ts");
  });

  it("should handle strict mode with critical issues", () => {
    const dims = [
      { name: "tone", score: 90, status: "pass" as const, issues: [] },
      { name: "vocabulary", score: 85, status: "pass" as const, issues: [] },
      { name: "key_messages", score: 80, status: "pass" as const, issues: [] },
      { name: "audience_fit", score: 82, status: "pass" as const, issues: [] },
      { name: "visual_palette", score: 95, status: "pass" as const, issues: [] },
      { name: "typography", score: 80, status: "pass" as const, issues: [] },
      { name: "imagery_style", score: 30, status: "fail" as const, issues: [
        { description: "Wrong imagery", severity: "critical" as const, suggestion: "Fix it", reference: "Imagery" }
      ]},
      { name: "logo_usage", score: 90, status: "pass" as const, issues: [] },
    ];

    const config: BrandGuardianConfig = {
      clientId: "c1", passThreshold: 80, autoPassThreshold: 95,
      strictMode: true, weightsByDimension: {},
    };

    const score = computeOverallScore(dims, DEFAULT_DIMENSION_WEIGHTS);
    const verdict = determineVerdict(score, dims, config);
    expect(verdict).toBe("fail"); // critical issue in strict mode
  });

  it("should score higher when custom weights favor strong dimensions", () => {
    const dims = [
      { name: "tone", score: 95, status: "pass" as const, issues: [] },
      { name: "vocabulary", score: 50, status: "fail" as const, issues: [] },
      { name: "key_messages", score: 90, status: "pass" as const, issues: [] },
      { name: "audience_fit", score: 88, status: "pass" as const, issues: [] },
      { name: "visual_palette", score: 92, status: "pass" as const, issues: [] },
      { name: "typography", score: 85, status: "pass" as const, issues: [] },
      { name: "imagery_style", score: 80, status: "pass" as const, issues: [] },
      { name: "logo_usage", score: 90, status: "pass" as const, issues: [] },
    ];

    const defaultScore = computeOverallScore(dims, DEFAULT_DIMENSION_WEIGHTS);
    const customWeights = { ...DEFAULT_DIMENSION_WEIGHTS, vocabulary: 1, tone: 30 };
    const customScore = computeOverallScore(dims, customWeights);

    // Custom weights minimize vocabulary impact (score 50) and boost tone (score 95)
    expect(customScore).toBeGreaterThan(defaultScore);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/services/brand-guardian/`
Expected: All tests PASS (unit + integration).

- [ ] **Step 3: Commit**

```bash
git add src/services/brand-guardian/integration.test.ts
git commit -m "test(brand-guardian): add integration tests for full validation pipeline"
```

---

## Verification Checklist

After all tasks:

1. `npx vitest run src/services/brand-guardian/` — all Brand Guardian tests pass
2. `npx vitest run` — no regressions across codebase
3. `npx drizzle-kit generate` — migration generates clean
4. Verify files created: 9 TypeScript files + 4 agent markdown files
5. Verify registry: BG-L, BG-001, BG-002, BG-003 present, XA-003 removed
6. Verify routes mounted: 12 endpoints at `/api/brand/*`
