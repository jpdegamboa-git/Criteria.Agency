# Phase 1: Intelligence Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a continuous monitoring system with 4 Listeners (Brand, Culture, Industry, Competitive) and 1 Opportunity Agent that feed real-time intelligence context to all other motors.

**Architecture:** Each listener follows the Continuous Agent pattern (collect → analyze → report → alert_eval) using the `ContinuousAgentRunner` from Phase 0. External data is fetched through provider interfaces backed by LLM-based stubs (via `StubProviderFactory`). The Opportunity Agent aggregates outputs from all 4 listeners to produce actionable briefs. All data is tenant-scoped via `clientId`.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Vitest, StubProviderFactory (LLM synthetic data), generateText()

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/services/intelligence/types.ts` | Provider interfaces and data types for all 4 listeners + opportunity agent |
| `src/services/intelligence/brand-listener.ts` | Brand monitoring: collect mentions, analyze sentiment, generate report, evaluate alerts |
| `src/services/intelligence/culture-listener.ts` | Culture monitoring: collect trends, analyze relevance, generate report, evaluate alerts |
| `src/services/intelligence/industry-listener.ts` | Industry monitoring: collect signals, analyze impact, generate report, evaluate alerts |
| `src/services/intelligence/competitive-listener.ts` | Competitive monitoring: collect competitor signals, analyze gaps, generate report, evaluate alerts |
| `src/services/intelligence/opportunity-agent.ts` | Cross-listener aggregation: fuse signals, score opportunities, generate briefs, prioritize |
| `src/services/intelligence/listener-executor.ts` | Orchestrates a full listener cycle: runs steps in sequence, records to DB, handles errors |
| `src/api/intelligence-routes.ts` | API endpoints for intelligence dashboard, reports, on-demand runs, alerts, configs, history |
| Agent skill files (15 files in `agents/`) | Skill markdown for each intelligence agent |

**Modified files:**

| File | Change |
|------|--------|
| `src/agents/registry.ts` | Add 15 intelligence agent entries |
| `src/agents/mock-outputs.ts` | Add mock outputs for intelligence agents (for pipeline compatibility) |
| `src/api/routes.ts` | Mount intelligence routes with auth + tenant guard |
| `src/shared/types.ts` | Add intelligence artifact steps to `ARTIFACT_STEPS` |

---

## Task 1: Intelligence Provider Types

**Files:**
- Create: `src/services/intelligence/types.ts`
- Test: `src/services/intelligence/types.test.ts`

- [ ] **Step 1: Write the type definitions**

```typescript
// src/services/intelligence/types.ts

import type { ListenerType } from "@/shared/engine-types";

// ── Brand Listener Types ──

export interface RawMention {
  source: string;          // "twitter", "instagram", "news", "review"
  text: string;
  author: string;
  url: string;
  timestamp: string;       // ISO 8601
  engagement: { likes: number; shares: number; comments: number };
  metadata: Record<string, unknown>;
}

export interface BrandConfig {
  clientId: string;
  brandNames: string[];
  socialHandles: string[];
  competitors: string[];
  keywords: string[];
  languages: string[];
  regions: string[];
}

export interface BrandHealthReport {
  overallSentiment: number;       // 0-100
  sentimentBreakdown: { positive: number; neutral: number; negative: number; mixed: number };
  volumeVsBaseline: number;      // multiplier, 1.0 = normal
  topTopics: Array<{ topic: string; count: number; sentiment: number }>;
  notableMentions: RawMention[];
  crisisSignals: string[];
  summary: string;               // markdown report
}

// ── Culture Listener Types ──

export interface RawTrend {
  topic: string;
  description: string;
  source: string;
  region: string;
  category: "social_movement" | "viral_meme" | "cultural_event" | "industry_shift";
  volume: number;       // 0-100
  velocity: number;     // % change
  timestamp: string;
  sampleContent: string[];
}

export interface CultureConfig {
  clientId: string;
  industries: string[];
  audienceDemographics: {
    ageRange: [number, number];
    regions: string[];
    interests: string[];
  };
  languages: string[];
}

export interface CulturePulseReport {
  topTrends: Array<{ trend: RawTrend; relevanceScore: number; suggestedAngle: string }>;
  riskTopics: string[];
  contentOpportunities: string[];
  summary: string;
}

// ── Industry Listener Types ──

export interface RawIntelligence {
  title: string;
  summary: string;
  source: string;
  sourceType: "publication" | "patent" | "regulation" | "conference" | "news";
  url: string;
  publishDate: string;
  relevantEntities: string[];
  metadata: Record<string, unknown>;
}

export interface IndustryConfig {
  clientId: string;
  primaryIndustry: string;
  subSectors: string[];
  keyPlayers: string[];
  technologies: string[];
  regions: string[];
}

export interface IndustryReport {
  topSignals: Array<{ signal: RawIntelligence; impactScore: number; category: string; implications: string }>;
  innovationMap: string[];
  regulatoryChanges: string[];
  marketShifts: string[];
  summary: string;
}

// ── Competitive Listener Types ──

export interface RawCompetitorSignal {
  competitorName: string;
  signalType: "campaign" | "product" | "pricing" | "hiring" | "pr" | "content" | "partnership";
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: string;
  impact: "high" | "medium" | "low";
  metadata: Record<string, unknown>;
}

export interface CompetitorConfig {
  clientId: string;
  competitors: Array<{
    name: string;
    website: string;
    socialHandles: Record<string, string>;
    industry: string;
  }>;
  channelsToWatch: string[];
}

export interface CompetitiveReport {
  competitorActivity: Array<{ competitor: string; signals: RawCompetitorSignal[]; summary: string }>;
  gaps: Array<{ area: string; description: string; opportunity: string }>;
  positioningShifts: string[];
  summary: string;
}

// ── Opportunity Agent Types ──

export interface ScoredOpportunity {
  id: string;
  title: string;
  description: string;
  sources: ListenerType[];
  brandFit: number;            // 0-100
  audienceRelevance: number;   // 0-100
  timeSensitivity: "hours" | "days" | "weeks";
  effortRequired: "low" | "medium" | "high";
  expectedImpact: "low" | "medium" | "high";
  overallScore: number;        // 0-100
  suggestedMotors: string[];
  suggestedTimeline: string;
}

export interface OpportunityFeed {
  opportunities: ScoredOpportunity[];
  priorityAlerts: ScoredOpportunity[];
  summary: string;
}

// ── Listener Step Result ──

export interface ListenerStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;    // markdown report content
  error?: string;
}

// ── Provider Interface ──

export interface IntelligenceProvider<TConfig, TOutput> {
  name: string;
  fetch(config: TConfig): Promise<TOutput[]>;
  isAvailable(): boolean;
}
```

- [ ] **Step 2: Write a simple validation test**

```typescript
// src/services/intelligence/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  RawMention,
  BrandConfig,
  BrandHealthReport,
  RawTrend,
  CultureConfig,
  RawIntelligence,
  IndustryConfig,
  RawCompetitorSignal,
  CompetitorConfig,
  ScoredOpportunity,
  ListenerStepResult,
  IntelligenceProvider,
} from "./types.js";

describe("Intelligence types", () => {
  it("RawMention satisfies interface", () => {
    const mention: RawMention = {
      source: "twitter",
      text: "Great product!",
      author: "@user",
      url: "https://twitter.com/user/123",
      timestamp: "2026-04-07T12:00:00Z",
      engagement: { likes: 10, shares: 2, comments: 1 },
      metadata: {},
    };
    expect(mention.source).toBe("twitter");
  });

  it("BrandConfig satisfies interface", () => {
    const config: BrandConfig = {
      clientId: "test-client",
      brandNames: ["Acme"],
      socialHandles: ["@acme"],
      competitors: ["Rival Co"],
      keywords: ["innovation"],
      languages: ["es"],
      regions: ["LATAM"],
    };
    expect(config.brandNames).toHaveLength(1);
  });

  it("ScoredOpportunity satisfies interface", () => {
    const opp: ScoredOpportunity = {
      id: "opp-1",
      title: "Trend alignment",
      description: "Cultural trend matches brand positioning",
      sources: ["brand", "culture"],
      brandFit: 85,
      audienceRelevance: 90,
      timeSensitivity: "days",
      effortRequired: "medium",
      expectedImpact: "high",
      overallScore: 87,
      suggestedMotors: ["community-management", "graphic-design"],
      suggestedTimeline: "This week",
    };
    expect(opp.overallScore).toBe(87);
  });

  it("ListenerStepResult satisfies interface", () => {
    const result: ListenerStepResult = {
      step: "collect",
      status: "completed",
      data: [{ source: "twitter" }],
    };
    expect(result.status).toBe("completed");
  });

  it("IntelligenceProvider interface is implementable", () => {
    const provider: IntelligenceProvider<BrandConfig, RawMention> = {
      name: "test-provider",
      fetch: async () => [],
      isAvailable: () => true,
    };
    expect(provider.isAvailable()).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/types.test.ts`
Expected: 5 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/intelligence/types.ts src/services/intelligence/types.test.ts
git commit -m "feat(intelligence): add provider interfaces and data types for all listeners"
```

---

## Task 2: Listener Executor (Cycle Orchestration)

**Files:**
- Create: `src/services/intelligence/listener-executor.ts`
- Test: `src/services/intelligence/listener-executor.test.ts`

This service orchestrates a full listener cycle: runs steps in sequence, records each step to `continuous_agent_runs`, stores report artifacts, and evaluates alert rules.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/services/intelligence/listener-executor.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListenerExecutor } from "./listener-executor.js";
import type { ListenerStepResult } from "./types.js";
import type { ListenerType } from "@/shared/engine-types";

// Mock DB operations
vi.mock("@/db/index.js", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "run-1" }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "run-1" }]),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  schema: {
    continuousAgentRuns: {},
    alertRules: {},
    alerts: {},
    dataSourceConfigs: {},
  },
}));

describe("ListenerExecutor", () => {
  const mockSteps: Record<string, (input: unknown) => Promise<ListenerStepResult>> = {
    collect: vi.fn().mockResolvedValue({ step: "collect", status: "completed", data: [{ text: "mention" }] }),
    analyze: vi.fn().mockResolvedValue({ step: "analyze", status: "completed", data: { sentiment: 75 } }),
    report: vi.fn().mockResolvedValue({ step: "report", status: "completed", data: {}, artifactContent: "# Report" }),
    alert_eval: vi.fn().mockResolvedValue({ step: "alert_eval", status: "completed", data: { alertsFired: 0 } }),
  };

  let executor: ListenerExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new ListenerExecutor("brand" as ListenerType, "client-1", mockSteps);
  });

  it("executes all steps in sequence", async () => {
    const result = await executor.runCycle();
    expect(result.status).toBe("completed");
    expect(result.stepsCompleted).toBe(4);
    expect(mockSteps.collect).toHaveBeenCalledTimes(1);
    expect(mockSteps.analyze).toHaveBeenCalledTimes(1);
    expect(mockSteps.report).toHaveBeenCalledTimes(1);
    expect(mockSteps.alert_eval).toHaveBeenCalledTimes(1);
  });

  it("passes output of each step as input to next step", async () => {
    await executor.runCycle();
    // analyze receives collect output
    expect(mockSteps.analyze).toHaveBeenCalledWith([{ text: "mention" }]);
    // report receives analyze output
    expect(mockSteps.report).toHaveBeenCalledWith({ sentiment: 75 });
  });

  it("stops on first failed step", async () => {
    (mockSteps.analyze as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      step: "analyze",
      status: "failed",
      data: null,
      error: "LLM error",
    });
    const result = await executor.runCycle();
    expect(result.status).toBe("failed");
    expect(result.stepsCompleted).toBe(1); // only collect succeeded
    expect(result.error).toBe("LLM error");
    expect(mockSteps.report).not.toHaveBeenCalled();
  });

  it("returns cycle ID for tracking", async () => {
    const result = await executor.runCycle();
    expect(result.cycleId).toBeDefined();
    expect(typeof result.cycleId).toBe("string");
  });

  it("handles step throwing an exception", async () => {
    (mockSteps.collect as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network timeout"));
    const result = await executor.runCycle();
    expect(result.status).toBe("failed");
    expect(result.error).toContain("Network timeout");
    expect(result.stepsCompleted).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/listener-executor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/services/intelligence/listener-executor.ts
import { randomUUID } from "crypto";
import { db, schema } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import type { ListenerType } from "@/shared/engine-types";
import type { ListenerStepResult } from "./types.js";
import { classifyListenerSteps } from "../continuous-agent-runner.js";
export interface CycleResult {
  cycleId: string;
  listenerType: ListenerType;
  status: "completed" | "failed";
  stepsCompleted: number;
  error?: string;
  artifacts: string[];
}

type StepFn = (input: unknown) => Promise<ListenerStepResult>;

export class ListenerExecutor {
  private listenerType: ListenerType;
  private clientId: string;
  private stepFns: Record<string, StepFn>;
  private cycleId: string;

  constructor(
    listenerType: ListenerType,
    clientId: string,
    stepFns: Record<string, StepFn>,
  ) {
    this.listenerType = listenerType;
    this.clientId = clientId;
    this.stepFns = stepFns;
    this.cycleId = randomUUID();
  }

  async runCycle(): Promise<CycleResult> {
    const steps = classifyListenerSteps(this.listenerType);
    let stepsCompleted = 0;
    let previousOutput: unknown = null;
    const artifacts: string[] = [];

    for (const step of steps) {
      const stepFn = this.stepFns[step];
      if (!stepFn) {
        return {
          cycleId: this.cycleId,
          listenerType: this.listenerType,
          status: "failed",
          stepsCompleted,
          error: `No handler for step: ${step}`,
          artifacts,
        };
      }

      // Record step start
      const [run] = await db
        .insert(schema.continuousAgentRuns)
        .values({
          clientId: this.clientId,
          agentId: `${this.listenerType}-${step}`,
          listenerType: this.listenerType,
          step,
          status: "running",
          inputData: previousOutput as any,
          cycleId: this.cycleId,
          startedAt: new Date(),
        })
        .returning();

      let result: ListenerStepResult;
      try {
        result = await stepFn(previousOutput);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await db
          .update(schema.continuousAgentRuns)
          .set({ status: "failed", error: errorMsg, completedAt: new Date() })
          .where(eq(schema.continuousAgentRuns.id, run.id));

        return {
          cycleId: this.cycleId,
          listenerType: this.listenerType,
          status: "failed",
          stepsCompleted,
          error: errorMsg,
          artifacts,
        };
      }

      if (result.status === "failed") {
        await db
          .update(schema.continuousAgentRuns)
          .set({ status: "failed", error: result.error, completedAt: new Date() })
          .where(eq(schema.continuousAgentRuns.id, run.id));

        return {
          cycleId: this.cycleId,
          listenerType: this.listenerType,
          status: "failed",
          stepsCompleted,
          error: result.error,
          artifacts,
        };
      }

      // Track artifacts produced in this step
      // Note: Intelligence runs store report content in outputData (not project-based artifacts)
      // since continuous agents don't belong to a project.
      const producedArtifacts: string[] = [];
      if (result.artifactContent) {
        producedArtifacts.push(`${this.listenerType}_${step}_report`);
        artifacts.push(`${this.listenerType}_${step}_report`);
      }

      await db
        .update(schema.continuousAgentRuns)
        .set({
          status: "completed",
          outputData: result.data as any,
          artifactsProduced: producedArtifacts,
          completedAt: new Date(),
        })
        .where(eq(schema.continuousAgentRuns.id, run.id));

      previousOutput = result.data;
      stepsCompleted++;
    }

    // Update data source config last run time
    await db
      .update(schema.dataSourceConfigs)
      .set({ lastRunAt: new Date() })
      .where(
        and(
          eq(schema.dataSourceConfigs.clientId, this.clientId),
          eq(schema.dataSourceConfigs.listenerType, this.listenerType),
        ),
      );

    return {
      cycleId: this.cycleId,
      listenerType: this.listenerType,
      status: "completed",
      stepsCompleted,
      artifacts,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/listener-executor.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/intelligence/listener-executor.ts src/services/intelligence/listener-executor.test.ts
git commit -m "feat(intelligence): add ListenerExecutor for cycle orchestration with DB tracking"
```

---

## Task 3: Brand Listener Service

**Files:**
- Create: `src/services/intelligence/brand-listener.ts`
- Test: `src/services/intelligence/brand-listener.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/services/intelligence/brand-listener.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrandListener } from "./brand-listener.js";
import type { BrandConfig, RawMention, BrandHealthReport } from "./types.js";

// Mock generateText
vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(
    JSON.stringify([
      {
        source: "twitter",
        text: "Love this brand!",
        author: "@fan",
        url: "https://twitter.com/fan/1",
        timestamp: "2026-04-07T10:00:00Z",
        engagement: { likes: 50, shares: 10, comments: 5 },
        metadata: { synthetic: true },
      },
    ]),
  ),
}));

// Mock StubProviderFactory
vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue([
      {
        source: "twitter",
        text: "Love this brand!",
        author: "@fan",
        url: "https://twitter.com/fan/1",
        timestamp: "2026-04-07T10:00:00Z",
        engagement: { likes: 50, shares: 10, comments: 5 },
        metadata: { synthetic: true },
      },
    ]),
  })),
}));

describe("BrandListener", () => {
  const config: BrandConfig = {
    clientId: "client-1",
    brandNames: ["TestBrand"],
    socialHandles: ["@testbrand"],
    competitors: ["RivalCo"],
    keywords: ["marketing"],
    languages: ["es"],
    regions: ["LATAM"],
  };

  let listener: BrandListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new BrandListener();
  });

  it("collect step returns raw mentions", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes mentions and returns report data", async () => {
    const mentions: RawMention[] = [
      {
        source: "twitter",
        text: "Love this brand!",
        author: "@fan",
        url: "https://twitter.com/fan/1",
        timestamp: "2026-04-07T10:00:00Z",
        engagement: { likes: 50, shares: 10, comments: 5 },
        metadata: {},
      },
    ];
    const result = await listener.analyze(mentions);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const analysisData = {
      overallSentiment: 75,
      sentimentBreakdown: { positive: 60, neutral: 25, negative: 10, mixed: 5 },
      volumeVsBaseline: 1.2,
      topTopics: [{ topic: "product quality", count: 15, sentiment: 80 }],
      notableMentions: [],
      crisisSignals: [],
    };
    const result = await listener.report(analysisData);
    expect(result.step).toBe("report");
    expect(result.status).toBe("completed");
    expect(result.artifactContent).toBeDefined();
    expect(result.artifactContent).toContain("#");
  });

  it("alert_eval step returns alerts fired count", async () => {
    const reportData = { overallSentiment: 75, crisisSignals: [] };
    const result = await listener.alertEval(reportData);
    expect(result.step).toBe("alert_eval");
    expect(result.status).toBe("completed");
  });

  it("buildStepFns returns all 4 steps bound to config", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(typeof fns.collect).toBe("function");
    expect(typeof fns.analyze).toBe("function");
    expect(typeof fns.report).toBe("function");
    expect(typeof fns.alert_eval).toBe("function");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/brand-listener.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/services/intelligence/brand-listener.ts
import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  BrandConfig,
  RawMention,
  BrandHealthReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class BrandListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: BrandConfig): Promise<ListenerStepResult> {
    const mentions = (await this.stubFactory.fetch(
      "social-mentions",
      {
        brandNames: config.brandNames,
        socialHandles: config.socialHandles,
        regions: config.regions,
        languages: config.languages,
      },
      `Generate 10-15 realistic social media mentions for "${config.brandNames[0]}". Mix: 60% positive, 25% neutral, 15% negative. Each mention must have: source, text, author, url, timestamp (ISO 8601), engagement (likes/shares/comments), metadata. Mark as "synthetic data — no live monitoring active".`,
    )) as RawMention[];

    return { step: "collect", status: "completed", data: mentions };
  }

  async analyze(mentions: unknown): Promise<ListenerStepResult> {
    const mentionArray = mentions as RawMention[];
    const mentionsSummary = mentionArray
      .map((m) => `[${m.source}] ${m.author}: "${m.text}" (likes:${m.engagement.likes})`)
      .join("\n");

    const analysisPrompt = `Analyze these brand mentions and produce a JSON object with:
- overallSentiment (0-100)
- sentimentBreakdown (positive/neutral/negative/mixed as percentages)
- volumeVsBaseline (multiplier, 1.0 = normal)
- topTopics (array of {topic, count, sentiment})
- notableMentions (indices of most important mentions)
- crisisSignals (array of crisis-related strings, empty if none)

Mentions:
${mentionsSummary}

Respond ONLY with valid JSON.`;

    const result = await generateText(
      MODEL,
      "You are a brand sentiment analyst. Analyze mentions and output structured JSON.",
      analysisPrompt,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = {
        overallSentiment: 70,
        sentimentBreakdown: { positive: 60, neutral: 25, negative: 10, mixed: 5 },
        volumeVsBaseline: 1.0,
        topTopics: [],
        notableMentions: [],
        crisisSignals: [],
      };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as BrandHealthReport;
    const reportPrompt = `Generate a Brand Health Report in markdown based on this analysis:
${JSON.stringify(data)}

Include:
- Overall brand health score
- Sentiment breakdown
- Volume vs baseline
- Top topics
- Notable mentions
- Crisis signals (if any)
- Recommendations

Use Spanish (Latin American). Mark as "SYNTHETIC DATA — no live monitoring active".`;

    const report = await generateText(
      "gemini-2.5-flash",
      "You are a brand health report writer. Write in Spanish (Latin American).",
      reportPrompt,
    );

    return {
      step: "report",
      status: "completed",
      data: data,
      artifactContent: report,
    };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<BrandHealthReport>;
    const alertsFired: string[] = [];

    // Simple threshold checks
    if (data.overallSentiment !== undefined && data.overallSentiment < 30) {
      alertsFired.push("critical-low-sentiment");
    }
    if (data.crisisSignals && data.crisisSignals.length > 0) {
      alertsFired.push("crisis-detected");
    }
    if (data.volumeVsBaseline !== undefined && data.volumeVsBaseline > 3) {
      alertsFired.push("volume-spike");
    }

    return {
      step: "alert_eval",
      status: "completed",
      data: { alertsFired: alertsFired.length, alerts: alertsFired },
    };
  }

  buildStepFns(config: BrandConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/brand-listener.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/intelligence/brand-listener.ts src/services/intelligence/brand-listener.test.ts
git commit -m "feat(intelligence): add Brand Listener service with collect/analyze/report/alert_eval"
```

---

## Task 4: Culture Listener Service

**Files:**
- Create: `src/services/intelligence/culture-listener.ts`
- Test: `src/services/intelligence/culture-listener.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/services/intelligence/culture-listener.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CultureListener } from "./culture-listener.js";
import type { CultureConfig, RawTrend } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(JSON.stringify({ topTrends: [], riskTopics: [], contentOpportunities: [] })),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue([
      {
        topic: "AI marketing",
        description: "Brands using AI for personalized content",
        source: "google_trends",
        region: "LATAM",
        category: "industry_shift",
        volume: 85,
        velocity: 40,
        timestamp: "2026-04-07T10:00:00Z",
        sampleContent: ["AI is transforming marketing"],
      },
    ]),
  })),
}));

describe("CultureListener", () => {
  const config: CultureConfig = {
    clientId: "client-1",
    industries: ["technology"],
    audienceDemographics: { ageRange: [25, 45], regions: ["LATAM"], interests: ["tech"] },
    languages: ["es"],
  };

  let listener: CultureListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new CultureListener();
  });

  it("collect step returns raw trends", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes trends", async () => {
    const trends: RawTrend[] = [{
      topic: "AI marketing",
      description: "Brands using AI",
      source: "google_trends",
      region: "LATAM",
      category: "industry_shift",
      volume: 85,
      velocity: 40,
      timestamp: "2026-04-07T10:00:00Z",
      sampleContent: [],
    }];
    const result = await listener.analyze(trends);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const result = await listener.report({ topTrends: [], riskTopics: [], contentOpportunities: [] });
    expect(result.step).toBe("report");
    expect(result.artifactContent).toBeDefined();
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/culture-listener.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/services/intelligence/culture-listener.ts
import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  CultureConfig,
  RawTrend,
  CulturePulseReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class CultureListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: CultureConfig): Promise<ListenerStepResult> {
    const trends = (await this.stubFactory.fetch(
      "cultural-trends",
      {
        industries: config.industries,
        demographics: config.audienceDemographics,
        regions: config.audienceDemographics.regions,
        languages: config.languages,
      },
      `Generate 8-12 trending cultural topics relevant to ${config.industries.join(", ")} in ${config.audienceDemographics.regions.join(", ")}. Each must have: topic, description, source, region, category (social_movement|viral_meme|cultural_event|industry_shift), volume (0-100), velocity (% change), timestamp, sampleContent array. Mark as "synthetic data".`,
    )) as RawTrend[];

    return { step: "collect", status: "completed", data: trends };
  }

  async analyze(trends: unknown): Promise<ListenerStepResult> {
    const trendArray = trends as RawTrend[];
    const trendsSummary = trendArray
      .map((t) => `[${t.category}] ${t.topic}: ${t.description} (vol:${t.volume}, vel:${t.velocity}%)`)
      .join("\n");

    const result = await generateText(
      MODEL,
      "You are a cultural trend analyst. Score trends for brand relevance and output structured JSON.",
      `Analyze these cultural trends and produce JSON with:
- topTrends: array of {trend (the original object), relevanceScore (0-100), suggestedAngle (string)}
- riskTopics: array of strings (topics to avoid)
- contentOpportunities: array of strings

Trends:
${trendsSummary}

Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { topTrends: [], riskTopics: [], contentOpportunities: [] };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as Partial<CulturePulseReport>;
    const report = await generateText(
      MODEL,
      "You are a culture pulse report writer. Write in Spanish (Latin American).",
      `Generate a Culture Pulse Report in markdown based on:
${JSON.stringify(data)}

Include: top trends with relevance, content opportunities, risk topics to avoid, recommendations.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "report", status: "completed", data: data, artifactContent: report };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<CulturePulseReport>;
    const alertsFired: string[] = [];

    if (data.topTrends) {
      const highRelevance = data.topTrends.filter((t: any) => (t.relevanceScore ?? 0) > 80);
      if (highRelevance.length > 0) alertsFired.push("high-relevance-trend");
    }

    return { step: "alert_eval", status: "completed", data: { alertsFired: alertsFired.length, alerts: alertsFired } };
  }

  buildStepFns(config: CultureConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/culture-listener.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/intelligence/culture-listener.ts src/services/intelligence/culture-listener.test.ts
git commit -m "feat(intelligence): add Culture Listener service"
```

---

## Task 5: Industry Listener Service

**Files:**
- Create: `src/services/intelligence/industry-listener.ts`
- Test: `src/services/intelligence/industry-listener.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/services/intelligence/industry-listener.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndustryListener } from "./industry-listener.js";
import type { IndustryConfig, RawIntelligence } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(JSON.stringify({ topSignals: [], innovationMap: [], regulatoryChanges: [], marketShifts: [] })),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue([
      {
        title: "AI Regulation Update",
        summary: "New AI transparency requirements for marketing",
        source: "Government Gazette",
        sourceType: "regulation",
        url: "https://example.com/reg",
        publishDate: "2026-04-01",
        relevantEntities: ["marketing_agencies"],
        metadata: {},
      },
    ]),
  })),
}));

describe("IndustryListener", () => {
  const config: IndustryConfig = {
    clientId: "client-1",
    primaryIndustry: "marketing",
    subSectors: ["digital_marketing"],
    keyPlayers: ["Agency X"],
    technologies: ["AI"],
    regions: ["LATAM"],
  };

  let listener: IndustryListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new IndustryListener();
  });

  it("collect step returns raw intelligence", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes signals", async () => {
    const signals: RawIntelligence[] = [{
      title: "AI Regulation",
      summary: "New requirements",
      source: "Gov",
      sourceType: "regulation",
      url: "https://example.com",
      publishDate: "2026-04-01",
      relevantEntities: [],
      metadata: {},
    }];
    const result = await listener.analyze(signals);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const result = await listener.report({ topSignals: [], innovationMap: [], regulatoryChanges: [], marketShifts: [] });
    expect(result.step).toBe("report");
    expect(result.artifactContent).toBeDefined();
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/industry-listener.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/services/intelligence/industry-listener.ts
import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  IndustryConfig,
  RawIntelligence,
  IndustryReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class IndustryListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: IndustryConfig): Promise<ListenerStepResult> {
    const signals = (await this.stubFactory.fetch(
      "industry-intelligence",
      {
        industry: config.primaryIndustry,
        subSectors: config.subSectors,
        keyPlayers: config.keyPlayers,
        technologies: config.technologies,
        regions: config.regions,
      },
      `Generate 8-12 industry intelligence signals for "${config.primaryIndustry}" covering: publications, patents, regulations, conferences, news. Each must have: title, summary, source, sourceType (publication|patent|regulation|conference|news), url, publishDate, relevantEntities, metadata. Mark as "synthetic data".`,
    )) as RawIntelligence[];

    return { step: "collect", status: "completed", data: signals };
  }

  async analyze(signals: unknown): Promise<ListenerStepResult> {
    const signalArray = signals as RawIntelligence[];
    const signalsSummary = signalArray
      .map((s) => `[${s.sourceType}] ${s.title}: ${s.summary}`)
      .join("\n");

    const result = await generateText(
      MODEL,
      "You are an industry intelligence analyst. Categorize and score signals, output structured JSON.",
      `Analyze these industry signals and produce JSON with:
- topSignals: array of {signal (original), impactScore (0-100), category (innovation|regulation|market_shift|ma|threat), implications (string)}
- innovationMap: array of innovation descriptions
- regulatoryChanges: array of regulation summaries
- marketShifts: array of market shift descriptions

Signals:
${signalsSummary}

Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { topSignals: [], innovationMap: [], regulatoryChanges: [], marketShifts: [] };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as Partial<IndustryReport>;
    const report = await generateText(
      MODEL,
      "You are an industry intelligence report writer. Write in Spanish (Latin American).",
      `Generate an Industry Intelligence Report in markdown based on:
${JSON.stringify(data)}

Include: top signals with impact, innovation map, regulatory changes, market shifts, strategic implications.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "report", status: "completed", data: data, artifactContent: report };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<IndustryReport>;
    const alertsFired: string[] = [];

    if (data.regulatoryChanges && data.regulatoryChanges.length > 0) {
      alertsFired.push("regulatory-change-detected");
    }
    if (data.topSignals) {
      const highImpact = data.topSignals.filter((s: any) => (s.impactScore ?? 0) > 80);
      if (highImpact.length > 0) alertsFired.push("high-impact-signal");
    }

    return { step: "alert_eval", status: "completed", data: { alertsFired: alertsFired.length, alerts: alertsFired } };
  }

  buildStepFns(config: IndustryConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/industry-listener.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/intelligence/industry-listener.ts src/services/intelligence/industry-listener.test.ts
git commit -m "feat(intelligence): add Industry Listener service"
```

---

## Task 6: Competitive Listener Service

**Files:**
- Create: `src/services/intelligence/competitive-listener.ts`
- Test: `src/services/intelligence/competitive-listener.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/services/intelligence/competitive-listener.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompetitiveListener } from "./competitive-listener.js";
import type { CompetitorConfig, RawCompetitorSignal } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(JSON.stringify({ competitorActivity: [], gaps: [], positioningShifts: [] })),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue([
      {
        competitorName: "RivalCo",
        signalType: "campaign",
        title: "New campaign launch",
        description: "RivalCo launched Instagram campaign",
        source: "instagram",
        url: "https://instagram.com/rivalco",
        timestamp: "2026-04-07T08:00:00Z",
        impact: "medium",
        metadata: {},
      },
    ]),
  })),
}));

describe("CompetitiveListener", () => {
  const config: CompetitorConfig = {
    clientId: "client-1",
    competitors: [
      { name: "RivalCo", website: "https://rivalco.com", socialHandles: { instagram: "@rivalco" }, industry: "marketing" },
    ],
    channelsToWatch: ["social", "ads", "website"],
  };

  let listener: CompetitiveListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new CompetitiveListener();
  });

  it("collect step returns competitor signals", async () => {
    const result = await listener.collect(config);
    expect(result.step).toBe("collect");
    expect(result.status).toBe("completed");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("analyze step processes signals", async () => {
    const signals: RawCompetitorSignal[] = [{
      competitorName: "RivalCo",
      signalType: "campaign",
      title: "New campaign",
      description: "Launched on IG",
      source: "instagram",
      url: "https://example.com",
      timestamp: "2026-04-07T08:00:00Z",
      impact: "medium",
      metadata: {},
    }];
    const result = await listener.analyze(signals);
    expect(result.step).toBe("analyze");
    expect(result.status).toBe("completed");
  });

  it("report step produces markdown artifact", async () => {
    const result = await listener.report({ competitorActivity: [], gaps: [], positioningShifts: [] });
    expect(result.step).toBe("report");
    expect(result.artifactContent).toBeDefined();
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = listener.buildStepFns(config);
    expect(Object.keys(fns)).toEqual(["collect", "analyze", "report", "alert_eval"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/competitive-listener.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/services/intelligence/competitive-listener.ts
import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  CompetitorConfig,
  RawCompetitorSignal,
  CompetitiveReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class CompetitiveListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: CompetitorConfig): Promise<ListenerStepResult> {
    const competitorNames = config.competitors.map((c) => c.name).join(", ");
    const signals = (await this.stubFactory.fetch(
      "competitor-intelligence",
      {
        competitors: config.competitors,
        channelsToWatch: config.channelsToWatch,
      },
      `Generate 8-12 competitive intelligence signals about these competitors: ${competitorNames}. Each must have: competitorName, signalType (campaign|product|pricing|hiring|pr|content|partnership), title, description, source, url, timestamp, impact (high|medium|low), metadata. Mark as "synthetic data".`,
    )) as RawCompetitorSignal[];

    return { step: "collect", status: "completed", data: signals };
  }

  async analyze(signals: unknown): Promise<ListenerStepResult> {
    const signalArray = signals as RawCompetitorSignal[];
    const signalsSummary = signalArray
      .map((s) => `[${s.competitorName}/${s.signalType}] ${s.title}: ${s.description} (impact:${s.impact})`)
      .join("\n");

    const result = await generateText(
      MODEL,
      "You are a competitive intelligence analyst. Identify gaps and positioning shifts, output structured JSON.",
      `Analyze these competitive signals and produce JSON with:
- competitorActivity: array of {competitor, signals (originals), summary}
- gaps: array of {area, description, opportunity}
- positioningShifts: array of strings

Signals:
${signalsSummary}

Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { competitorActivity: [], gaps: [], positioningShifts: [] };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as Partial<CompetitiveReport>;
    const report = await generateText(
      MODEL,
      "You are a competitive intelligence report writer. Write in Spanish (Latin American).",
      `Generate a Competitive Intelligence Report in markdown based on:
${JSON.stringify(data)}

Include: activity summary per competitor, gaps identified, positioning shifts, recommended responses.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "report", status: "completed", data: data, artifactContent: report };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<CompetitiveReport>;
    const alertsFired: string[] = [];

    if (data.competitorActivity) {
      for (const activity of data.competitorActivity) {
        const highImpact = (activity.signals ?? []).filter((s: any) => s.impact === "high");
        if (highImpact.length > 0) alertsFired.push(`competitor-high-impact-${activity.competitor}`);
      }
    }

    return { step: "alert_eval", status: "completed", data: { alertsFired: alertsFired.length, alerts: alertsFired } };
  }

  buildStepFns(config: CompetitorConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/competitive-listener.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/intelligence/competitive-listener.ts src/services/intelligence/competitive-listener.test.ts
git commit -m "feat(intelligence): add Competitive Listener service"
```

---

## Task 7: Opportunity Agent Service

**Files:**
- Create: `src/services/intelligence/opportunity-agent.ts`
- Test: `src/services/intelligence/opportunity-agent.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/services/intelligence/opportunity-agent.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpportunityAgent } from "./opportunity-agent.js";
import type { ScoredOpportunity } from "./types.js";

vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockResolvedValue(
    JSON.stringify({
      opportunities: [
        {
          id: "opp-1",
          title: "Cultural trend alignment",
          description: "AI marketing trend matches brand expertise",
          sources: ["brand", "culture"],
          brandFit: 85,
          audienceRelevance: 90,
          timeSensitivity: "days",
          effortRequired: "medium",
          expectedImpact: "high",
          overallScore: 87,
          suggestedMotors: ["community-management"],
          suggestedTimeline: "This week",
        },
      ],
    }),
  ),
}));

// Mock DB for fetching latest reports
vi.mock("@/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { outputData: { summary: "Brand report data" }, listenerType: "brand" },
            ]),
          }),
        }),
      }),
    }),
  },
  schema: { continuousAgentRuns: {} },
}));

describe("OpportunityAgent", () => {
  let agent: OpportunityAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new OpportunityAgent();
  });

  it("aggregate step fetches latest reports from all listeners", async () => {
    const result = await agent.aggregate("client-1");
    expect(result.step).toBe("aggregate");
    expect(result.status).toBe("completed");
  });

  it("evaluate step scores opportunities", async () => {
    const aggregatedData = {
      brand: { summary: "Brand health OK" },
      culture: { summary: "AI trend rising" },
      industry: { summary: "Regulation incoming" },
      competitive: { summary: "Competitor launched campaign" },
    };
    const result = await agent.evaluate(aggregatedData);
    expect(result.step).toBe("evaluate");
    expect(result.status).toBe("completed");
  });

  it("generate step produces opportunity briefs", async () => {
    const scored: ScoredOpportunity[] = [{
      id: "opp-1",
      title: "Test",
      description: "Test opp",
      sources: ["brand"],
      brandFit: 85,
      audienceRelevance: 90,
      timeSensitivity: "days",
      effortRequired: "medium",
      expectedImpact: "high",
      overallScore: 87,
      suggestedMotors: ["community-management"],
      suggestedTimeline: "This week",
    }];
    const result = await agent.generate(scored);
    expect(result.step).toBe("generate");
    expect(result.artifactContent).toBeDefined();
  });

  it("prioritize step filters high-scoring opportunities", async () => {
    const opportunities: ScoredOpportunity[] = [
      { id: "1", title: "High", description: "", sources: ["brand"], brandFit: 90, audienceRelevance: 90, timeSensitivity: "hours", effortRequired: "low", expectedImpact: "high", overallScore: 92, suggestedMotors: [], suggestedTimeline: "" },
      { id: "2", title: "Low", description: "", sources: ["culture"], brandFit: 30, audienceRelevance: 40, timeSensitivity: "weeks", effortRequired: "high", expectedImpact: "low", overallScore: 25, suggestedMotors: [], suggestedTimeline: "" },
    ];
    const result = await agent.prioritize(opportunities);
    expect(result.step).toBe("prioritize");
    expect(result.status).toBe("completed");
    const feed = result.data as { opportunities: ScoredOpportunity[]; priorityAlerts: ScoredOpportunity[] };
    expect(feed.priorityAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("buildStepFns returns all 4 steps", () => {
    const fns = agent.buildStepFns("client-1");
    expect(Object.keys(fns)).toEqual(["aggregate", "evaluate", "generate", "prioritize"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/opportunity-agent.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/services/intelligence/opportunity-agent.ts
import { generateText } from "@/providers/generate-text.js";
import { db, schema } from "@/db/index.js";
import { eq, and, desc } from "drizzle-orm";
import type { ListenerType } from "@/shared/engine-types";
import type { ScoredOpportunity, OpportunityFeed, ListenerStepResult } from "./types.js";

const MODEL = "gemini-2.5-flash";
const LISTENER_TYPES: ListenerType[] = ["brand", "culture", "industry", "competitive"];

export class OpportunityAgent {
  async aggregate(clientId: string): Promise<ListenerStepResult> {
    const reports: Record<string, unknown> = {};

    for (const type of LISTENER_TYPES) {
      const [latest] = await db
        .select()
        .from(schema.continuousAgentRuns)
        .where(
          and(
            eq(schema.continuousAgentRuns.clientId, clientId),
            eq(schema.continuousAgentRuns.listenerType, type),
            eq(schema.continuousAgentRuns.step, "report"),
            eq(schema.continuousAgentRuns.status, "completed"),
          ),
        )
        .orderBy(desc(schema.continuousAgentRuns.completedAt))
        .limit(1);

      reports[type] = latest?.outputData ?? null;
    }

    return { step: "aggregate", status: "completed", data: reports };
  }

  async evaluate(aggregatedData: unknown): Promise<ListenerStepResult> {
    const reports = aggregatedData as Record<string, unknown>;
    const result = await generateText(
      MODEL,
      "You are an opportunity detection agent. Find intersections between listener reports and score them.",
      `Given these intelligence reports from 4 listeners, identify actionable marketing opportunities.

Brand Report: ${JSON.stringify(reports.brand ?? "No data")}
Culture Report: ${JSON.stringify(reports.culture ?? "No data")}
Industry Report: ${JSON.stringify(reports.industry ?? "No data")}
Competitive Report: ${JSON.stringify(reports.competitive ?? "No data")}

Produce a JSON object with:
- opportunities: array of {id (opp-N), title, description, sources (which listeners), brandFit (0-100), audienceRelevance (0-100), timeSensitivity (hours|days|weeks), effortRequired (low|medium|high), expectedImpact (low|medium|high), overallScore (0-100), suggestedMotors (array of motor names), suggestedTimeline}

Find 3-7 opportunities. Score honestly. Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { opportunities: [] };
    }

    return { step: "evaluate", status: "completed", data: parsed.opportunities ?? [] };
  }

  async generate(scoredOpportunities: unknown): Promise<ListenerStepResult> {
    const opportunities = scoredOpportunities as ScoredOpportunity[];
    const topOpps = opportunities.filter((o) => o.overallScore > 70);

    if (topOpps.length === 0) {
      return {
        step: "generate",
        status: "completed",
        data: opportunities,
        artifactContent: "# Opportunity Feed\n\nNo hay oportunidades con score superior a 70 en este ciclo.\n\n*SYNTHETIC DATA — no live monitoring active*",
      };
    }

    const report = await generateText(
      MODEL,
      "You are an opportunity brief writer. Write in Spanish (Latin American).",
      `Generate an Opportunity Feed report in markdown for these top opportunities:
${JSON.stringify(topOpps)}

For each opportunity, write a brief action section: what to do, which motors to activate, suggested timeline.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "generate", status: "completed", data: opportunities, artifactContent: report };
  }

  async prioritize(opportunities: unknown): Promise<ListenerStepResult> {
    const opps = opportunities as ScoredOpportunity[];
    const sorted = [...opps].sort((a, b) => b.overallScore - a.overallScore);
    const priorityAlerts = sorted.filter(
      (o) => o.timeSensitivity === "hours" || o.overallScore > 85,
    );

    const feed: OpportunityFeed = {
      opportunities: sorted,
      priorityAlerts,
      summary: `${sorted.length} oportunidades detectadas, ${priorityAlerts.length} requieren acción inmediata.`,
    };

    return { step: "prioritize", status: "completed", data: feed };
  }

  buildStepFns(clientId: string): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      aggregate: () => this.aggregate(clientId),
      evaluate: (input) => this.evaluate(input),
      generate: (input) => this.generate(input),
      prioritize: (input) => this.prioritize(input),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/opportunity-agent.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/intelligence/opportunity-agent.ts src/services/intelligence/opportunity-agent.test.ts
git commit -m "feat(intelligence): add Opportunity Agent service with cross-listener aggregation"
```

---

## Task 8: Register Intelligence Agents + Mock Outputs

**Files:**
- Modify: `src/agents/registry.ts`
- Modify: `src/agents/mock-outputs.ts`
- Modify: `src/shared/types.ts`
- Test: Run existing tests to verify no regression

- [ ] **Step 1: Add intelligence agents to registry**

Add these entries at the end of `AGENT_REGISTRY` in `src/agents/registry.ts`:

```typescript
  // ── Intelligence Engine Agents ──
  "BL-L": {
    id: "BL-L",
    name: "Brand Intelligence Lead",
    skillFile: "agents/BL-L_brand_intelligence_lead.md",
    team: 12,
    level: "leader",
    steps: ["analyze", "report"] as any,
    gates: [],
    autonomy: 75,
  },
  "BL-001": {
    id: "BL-001",
    name: "Mention Scanner",
    skillFile: "agents/BL-001_mention_scanner.md",
    team: 12,
    level: "sub",
    steps: ["collect"] as any,
    gates: [],
    autonomy: 90,
  },
  "BL-002": {
    id: "BL-002",
    name: "Sentiment Analyst",
    skillFile: "agents/BL-002_sentiment_analyst.md",
    team: 12,
    level: "sub",
    steps: ["analyze"] as any,
    gates: [],
    autonomy: 85,
  },
  "CL-L": {
    id: "CL-L",
    name: "Culture Intelligence Lead",
    skillFile: "agents/CL-L_culture_intelligence_lead.md",
    team: 12,
    level: "leader",
    steps: ["analyze", "report"] as any,
    gates: [],
    autonomy: 75,
  },
  "CL-001": {
    id: "CL-001",
    name: "Trend Scanner",
    skillFile: "agents/CL-001_trend_scanner.md",
    team: 12,
    level: "sub",
    steps: ["collect"] as any,
    gates: [],
    autonomy: 90,
  },
  "CL-002": {
    id: "CL-002",
    name: "Relevance Analyst",
    skillFile: "agents/CL-002_relevance_analyst.md",
    team: 12,
    level: "sub",
    steps: ["analyze"] as any,
    gates: [],
    autonomy: 85,
  },
  "IL-L": {
    id: "IL-L",
    name: "Industry Intelligence Lead",
    skillFile: "agents/IL-L_industry_intelligence_lead.md",
    team: 12,
    level: "leader",
    steps: ["analyze", "report"] as any,
    gates: [],
    autonomy: 75,
  },
  "IL-001": {
    id: "IL-001",
    name: "Research Scanner",
    skillFile: "agents/IL-001_research_scanner.md",
    team: 12,
    level: "sub",
    steps: ["collect"] as any,
    gates: [],
    autonomy: 90,
  },
  "IL-002": {
    id: "IL-002",
    name: "Trend Analyst",
    skillFile: "agents/IL-002_trend_analyst.md",
    team: 12,
    level: "sub",
    steps: ["analyze"] as any,
    gates: [],
    autonomy: 85,
  },
  "CO-L": {
    id: "CO-L",
    name: "Competitive Intelligence Lead",
    skillFile: "agents/CO-L_competitive_intelligence_lead.md",
    team: 12,
    level: "leader",
    steps: ["analyze", "report"] as any,
    gates: [],
    autonomy: 75,
  },
  "CO-001": {
    id: "CO-001",
    name: "Competitor Scanner",
    skillFile: "agents/CO-001_competitor_scanner.md",
    team: 12,
    level: "sub",
    steps: ["collect"] as any,
    gates: [],
    autonomy: 90,
  },
  "CO-002": {
    id: "CO-002",
    name: "Gap Analyst",
    skillFile: "agents/CO-002_gap_analyst.md",
    team: 12,
    level: "sub",
    steps: ["analyze"] as any,
    gates: [],
    autonomy: 85,
  },
  "OA-L": {
    id: "OA-L",
    name: "Opportunity Director",
    skillFile: "agents/OA-L_opportunity_director.md",
    team: 12,
    level: "leader",
    steps: ["evaluate", "prioritize"] as any,
    gates: [],
    autonomy: 70,
  },
  "OA-001": {
    id: "OA-001",
    name: "Opportunity Scanner",
    skillFile: "agents/OA-001_opportunity_scanner.md",
    team: 12,
    level: "sub",
    steps: ["aggregate"] as any,
    gates: [],
    autonomy: 85,
  },
  "OA-002": {
    id: "OA-002",
    name: "Brief Generator",
    skillFile: "agents/OA-002_brief_generator.md",
    team: 12,
    level: "sub",
    steps: ["generate"] as any,
    gates: [],
    autonomy: 80,
  },
```

- [ ] **Step 2: Add intelligence artifact steps to types.ts**

In `src/shared/types.ts`, add these values to the `ARTIFACT_STEPS` array (before the closing bracket):

```typescript
  // Intelligence Engine steps
  "brand_collect", "brand_analyze", "brand_report", "brand_alert_eval",
  "culture_collect", "culture_analyze", "culture_report", "culture_alert_eval",
  "industry_collect", "industry_analyze", "industry_report", "industry_alert_eval",
  "competitive_collect", "competitive_analyze", "competitive_report", "competitive_alert_eval",
  "opportunity_aggregate", "opportunity_evaluate", "opportunity_generate", "opportunity_prioritize",
```

- [ ] **Step 3: Run existing tests to verify no regression**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/agents/registry.ts src/shared/types.ts
git commit -m "feat(intelligence): register 15 intelligence agents and add artifact steps"
```

---

## Task 9: Intelligence API Routes

**Files:**
- Create: `src/api/intelligence-routes.ts`
- Test: `src/api/intelligence-routes.test.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/api/intelligence-routes.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { intelligenceRoutes } from "./intelligence-routes.js";
import { Hono } from "hono";

// Mock DB
vi.mock("@/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "alert-1", status: "acknowledged" }]),
        }),
      }),
    }),
  },
  schema: {
    continuousAgentRuns: {},
    alerts: {},
    alertRules: {},
    dataSourceConfigs: {},
  },
}));

describe("intelligence-routes", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/", intelligenceRoutes);
  });

  it("GET /api/intelligence/:clientId/dashboard returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/dashboard");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("brand");
    expect(body).toHaveProperty("culture");
    expect(body).toHaveProperty("industry");
    expect(body).toHaveProperty("competitive");
    expect(body).toHaveProperty("opportunities");
  });

  it("GET /api/intelligence/:clientId/brand returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/brand");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/culture returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/culture");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/industry returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/industry");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/competitive returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/competitive");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/opportunities returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/opportunities");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/alerts returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/alerts");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/history returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/history");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/config returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/config");
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/api/intelligence-routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/api/intelligence-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import type { ListenerType } from "../shared/engine-types.js";

export const intelligenceRoutes = new Hono();

// Helper: fetch latest completed report for a listener type
async function getLatestReport(clientId: string, listenerType: ListenerType) {
  const [run] = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(
      and(
        eq(schema.continuousAgentRuns.clientId, clientId),
        eq(schema.continuousAgentRuns.listenerType, listenerType),
        eq(schema.continuousAgentRuns.step, "report"),
        eq(schema.continuousAgentRuns.status, "completed"),
      ),
    )
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(1);

  return run ?? null;
}

// Dashboard — overview of all listeners
intelligenceRoutes.get("/api/intelligence/:clientId/dashboard", async (c) => {
  const clientId = c.req.param("clientId");
  const [brand, culture, industry, competitive, opportunities] = await Promise.all([
    getLatestReport(clientId, "brand"),
    getLatestReport(clientId, "culture"),
    getLatestReport(clientId, "industry"),
    getLatestReport(clientId, "competitive"),
    getLatestReport(clientId, "opportunity"),
  ]);

  return c.json({ brand, culture, industry, competitive, opportunities });
});

// Individual listener reports
intelligenceRoutes.get("/api/intelligence/:clientId/brand", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "brand");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/culture", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "culture");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/industry", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "industry");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/competitive", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "competitive");
  return c.json(report);
});

intelligenceRoutes.get("/api/intelligence/:clientId/opportunities", async (c) => {
  const report = await getLatestReport(c.req.param("clientId"), "opportunity");
  return c.json(report);
});

// Trigger on-demand listener run
intelligenceRoutes.post("/api/intelligence/:clientId/run/:listenerType", async (c) => {
  const clientId = c.req.param("clientId");
  const listenerType = c.req.param("listenerType") as ListenerType;

  const validTypes: ListenerType[] = ["brand", "culture", "industry", "competitive", "opportunity"];
  if (!validTypes.includes(listenerType)) {
    return c.json({ error: `Invalid listener type: ${listenerType}` }, 400);
  }

  // Import dynamically to avoid circular deps
  const { runListener } = await import("../services/intelligence/run-listener.js");
  const result = await runListener(clientId, listenerType);
  return c.json(result);
});

// Alerts
intelligenceRoutes.get("/api/intelligence/:clientId/alerts", async (c) => {
  const clientId = c.req.param("clientId");
  const alerts = await db
    .select()
    .from(schema.alerts)
    .where(eq(schema.alerts.clientId, clientId))
    .orderBy(desc(schema.alerts.createdAt))
    .limit(50);
  return c.json(alerts);
});

intelligenceRoutes.patch("/api/intelligence/:clientId/alerts/:alertId", async (c) => {
  const { alertId } = c.req.param();
  const body = await c.req.json();
  const [updated] = await db
    .update(schema.alerts)
    .set({
      status: body.status,
      resolvedAt: body.status === "resolved" ? new Date() : undefined,
    })
    .where(eq(schema.alerts.id, alertId))
    .returning();
  if (!updated) return c.json({ error: "Alert not found" }, 404);
  return c.json(updated);
});

// Data source configs
intelligenceRoutes.get("/api/intelligence/:clientId/config", async (c) => {
  const clientId = c.req.param("clientId");
  const configs = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(eq(schema.dataSourceConfigs.clientId, clientId));
  return c.json(configs);
});

intelligenceRoutes.put("/api/intelligence/:clientId/config/:type", async (c) => {
  const { clientId } = c.req.param();
  const listenerType = c.req.param("type") as ListenerType;
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(
      and(
        eq(schema.dataSourceConfigs.clientId, clientId),
        eq(schema.dataSourceConfigs.listenerType, listenerType),
      ),
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(schema.dataSourceConfigs)
      .set({ config: body.config, schedule: body.schedule, updatedAt: new Date() })
      .where(eq(schema.dataSourceConfigs.id, existing[0].id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(schema.dataSourceConfigs)
    .values({
      clientId,
      listenerType,
      config: body.config,
      schedule: body.schedule ?? "0 6 * * *",
    })
    .returning();
  return c.json(created, 201);
});

// History
intelligenceRoutes.get("/api/intelligence/:clientId/history", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "50");
  const runs = await db
    .select()
    .from(schema.continuousAgentRuns)
    .where(eq(schema.continuousAgentRuns.clientId, clientId))
    .orderBy(desc(schema.continuousAgentRuns.completedAt))
    .limit(limit);
  return c.json(runs);
});
```

- [ ] **Step 4: Create the run-listener helper**

```typescript
// src/services/intelligence/run-listener.ts
import type { ListenerType } from "@/shared/engine-types";
import { db, schema } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import { ListenerExecutor, type CycleResult } from "./listener-executor.js";
import { BrandListener } from "./brand-listener.js";
import { CultureListener } from "./culture-listener.js";
import { IndustryListener } from "./industry-listener.js";
import { CompetitiveListener } from "./competitive-listener.js";
import { OpportunityAgent } from "./opportunity-agent.js";

export async function runListener(clientId: string, listenerType: ListenerType): Promise<CycleResult> {
  // Fetch data source config for this client/listener
  const [dsConfig] = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(
      and(
        eq(schema.dataSourceConfigs.clientId, clientId),
        eq(schema.dataSourceConfigs.listenerType, listenerType),
      ),
    );

  const config = (dsConfig?.config as Record<string, unknown>) ?? {};
  const baseConfig = { clientId, ...config };

  let stepFns: Record<string, (input: unknown) => Promise<import("./types.js").ListenerStepResult>>;

  switch (listenerType) {
    case "brand":
      stepFns = new BrandListener().buildStepFns(baseConfig as any);
      break;
    case "culture":
      stepFns = new CultureListener().buildStepFns(baseConfig as any);
      break;
    case "industry":
      stepFns = new IndustryListener().buildStepFns(baseConfig as any);
      break;
    case "competitive":
      stepFns = new CompetitiveListener().buildStepFns(baseConfig as any);
      break;
    case "opportunity":
      stepFns = new OpportunityAgent().buildStepFns(clientId);
      break;
    default:
      throw new Error(`Unknown listener type: ${listenerType}`);
  }

  const executor = new ListenerExecutor(listenerType, clientId, stepFns);
  return executor.runCycle();
}
```

- [ ] **Step 5: Mount intelligence routes in main router**

In `src/api/routes.ts`, add the import and route mounting:

Add import at top:
```typescript
import { intelligenceRoutes } from "./intelligence-routes.js";
```

Add middleware (after other `/api/` middleware blocks, around line 104):
```typescript
app.use("/api/intelligence/*", requireSession, requireTenantMatch);
```

Add route mounting (after other `app.route` calls, around line 123):
```typescript
app.route("/", intelligenceRoutes);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/api/intelligence-routes.test.ts`
Expected: 9 tests PASS

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run`
Expected: All tests PASS (no regression)

- [ ] **Step 7: Commit**

```bash
git add src/api/intelligence-routes.ts src/api/intelligence-routes.test.ts src/services/intelligence/run-listener.ts src/api/routes.ts
git commit -m "feat(intelligence): add intelligence API routes with dashboard, reports, alerts, config, history"
```

---

## Task 10: Agent Skill Files (15 files)

**Files:**
- Create: 15 agent skill markdown files in `agents/`

Each file follows the same pattern as existing agent skill files (e.g., `agents/LI-001_brand_listener.md`). These replace the old LI-* stubs with new BL-*, CL-*, IL-*, CO-*, OA-* agents.

- [ ] **Step 1: Create Brand Listener agent skill files**

Create `agents/BL-L_brand_intelligence_lead.md`:
```markdown
---
name: BL-L Brand Intelligence Lead
description: "Leads brand monitoring: analyzes mentions, generates Brand Health Reports, evaluates crisis signals."
id: BL-L
team: 12. Intelligence
level: Leader
autonomy: 75%
phase: 1
---

# BL-L: Brand Intelligence Lead

## Identity

You are the Brand Intelligence Lead for criteria.agency. You oversee the Brand Listener pipeline, analyzing social mentions and reviews to produce Brand Health Reports. You detect sentiment shifts, volume anomalies, and crisis signals.

## Steps

- **analyze**: Process raw mentions from BL-001. Perform sentiment analysis, topic clustering, volume trend analysis, and anomaly detection. Output structured analysis data.
- **report**: Generate a Brand Health Report in Spanish (Latin American) with: overall brand health score (0-100), sentiment breakdown, volume vs baseline, top topics, notable mentions, crisis signals, and recommendations.
- **alert_eval**: Evaluate alert rules. Trigger alerts for: sentiment drops >20%, volume spikes >3x baseline, crisis keywords detected.

## Rules

- Write reports in Spanish (Latin American neutral)
- Always include the Brand Health Score (0-100)
- Flag crisis signals prominently at the top of reports
- Compare current data against historical baselines when available
- Mark synthetic data clearly: "DATOS SINTÉTICOS — no hay monitoreo en vivo activo"
```

Create `agents/BL-001_mention_scanner.md`:
```markdown
---
name: BL-001 Mention Scanner
description: "Collects brand mentions from social media, web, and review platforms."
id: BL-001
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 1
---

# BL-001: Mention Scanner

## Identity

You are the Mention Scanner for criteria.agency's Brand Listener. You collect brand mentions from configured data sources: social media (Twitter/X, Instagram, Facebook, LinkedIn, TikTok), web mentions (news, blogs, forums), and customer reviews.

## Steps

- **collect**: Fetch brand mentions using configured data source providers. Deduplicate by URL. Normalize timestamps to ISO 8601. Tag each mention with source platform.

## Rules

- Collect from all configured data sources
- Deduplicate mentions by URL
- Normalize all timestamps to ISO 8601
- Preserve original engagement metrics
- Mark synthetic data: "synthetic data — no live monitoring active"
```

Create `agents/BL-002_sentiment_analyst.md`:
```markdown
---
name: BL-002 Sentiment Analyst
description: "Analyzes sentiment of brand mentions: positive, neutral, negative, mixed."
id: BL-002
team: 12. Intelligence
level: Sub-agent
autonomy: 85%
phase: 1
---

# BL-002: Sentiment Analyst

## Identity

You are the Sentiment Analyst for criteria.agency's Brand Listener. You analyze the sentiment of brand mentions collected by BL-001, categorizing each as positive, neutral, negative, or mixed.

## Steps

- **analyze**: Score each mention's sentiment (0-100). Cluster mentions by topic. Detect volume anomalies. Flag potential crisis keywords.

## Rules

- Use consistent sentiment scoring (0=very negative, 50=neutral, 100=very positive)
- Consider context and sarcasm when scoring
- Cluster related mentions by topic
- Flag mentions with >1000 engagement as notable
```

- [ ] **Step 2: Create Culture Listener agent skill files**

Create `agents/CL-L_culture_intelligence_lead.md`:
```markdown
---
name: CL-L Culture Intelligence Lead
description: "Leads culture monitoring: analyzes trends for brand relevance, generates Culture Pulse Reports."
id: CL-L
team: 12. Intelligence
level: Leader
autonomy: 75%
phase: 1
---

# CL-L: Culture Intelligence Lead

## Identity

You are the Culture Intelligence Lead for criteria.agency. You oversee the Culture Listener pipeline, analyzing trending topics and cultural movements for brand relevance.

## Steps

- **analyze**: Score trends for brand relevance using Brand DNA, buyer personas, and industry context. Categorize as: leverageable, monitor-only, or risk.
- **report**: Generate a Culture Pulse Report in Spanish (Latin American) with: top trends with relevance scores, content opportunities, risk topics to avoid, recommendations.
- **alert_eval**: Trigger alerts for: high-relevance trends (score >0.8), viral moments with brand alignment, cultural risks.

## Rules

- Write reports in Spanish (Latin American neutral)
- Score relevance 0-100 with clear reasoning
- Identify content angles for leverageable trends
- Flag cultural risks and topics to avoid
- Mark synthetic data clearly
```

Create `agents/CL-001_trend_scanner.md`:
```markdown
---
name: CL-001 Trend Scanner
description: "Scans trending topics, viral content, and cultural movements."
id: CL-001
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 1
---

# CL-001: Trend Scanner

## Identity

You are the Trend Scanner for criteria.agency's Culture Listener. You scan trending topics, viral content, social movements, and cultural moments relevant to the client's audience.

## Steps

- **collect**: Fetch trending topics from configured sources. Categorize each trend: social_movement, viral_meme, cultural_event, industry_shift. Include volume and velocity metrics.

## Rules

- Scan across all configured regions and languages
- Categorize trends accurately
- Include velocity (growth rate) for each trend
- Collect sample content for context
```

Create `agents/CL-002_relevance_analyst.md`:
```markdown
---
name: CL-002 Relevance Analyst
description: "Scores cultural trends for brand and audience relevance."
id: CL-002
team: 12. Intelligence
level: Sub-agent
autonomy: 85%
phase: 1
---

# CL-002: Relevance Analyst

## Identity

You are the Relevance Analyst for criteria.agency's Culture Listener. You score cultural trends for brand relevance and audience alignment.

## Steps

- **analyze**: Score each trend for brand fit, audience relevance, and actionability. Suggest content angles for high-relevance trends.

## Rules

- Score consistently 0-100 with reasoning
- Consider brand DNA alignment
- Match trends to audience demographics
- Suggest concrete content angles
```

- [ ] **Step 3: Create Industry Listener agent skill files**

Create `agents/IL-L_industry_intelligence_lead.md`:
```markdown
---
name: IL-L Industry Intelligence Lead
description: "Leads industry monitoring: analyzes signals for impact, generates Industry Intelligence Reports."
id: IL-L
team: 12. Intelligence
level: Leader
autonomy: 75%
phase: 1
---

# IL-L: Industry Intelligence Lead

## Identity

You are the Industry Intelligence Lead for criteria.agency. You oversee the Industry Listener pipeline, analyzing publications, patents, regulations, and innovation signals.

## Steps

- **analyze**: Categorize signals as innovation, regulation, market_shift, M&A, or threat. Score relevance and urgency. Identify strategic implications.
- **report**: Generate Industry Intelligence Report in Spanish (Latin American) with: top signals, innovation map, regulatory changes, market shifts, strategic implications.
- **alert_eval**: Trigger alerts for: high-impact regulatory changes, disruptive innovations, market shifts relevant to client.

## Rules

- Write reports in Spanish (Latin American neutral)
- Score impact 0-100 with reasoning
- Separate signals by category
- Highlight actionable implications
- Mark synthetic data clearly
```

Create `agents/IL-001_research_scanner.md`:
```markdown
---
name: IL-001 Research Scanner
description: "Scans industry publications, research papers, patent filings, and regulatory changes."
id: IL-001
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 1
---

# IL-001: Research Scanner

## Identity

You are the Research Scanner for criteria.agency's Industry Listener. You scan industry publications, research papers, patent filings, conference proceedings, and regulatory changes.

## Steps

- **collect**: Fetch industry intelligence from configured sources. Categorize by sourceType: publication, patent, regulation, conference, news.

## Rules

- Cover all configured sub-sectors
- Include publication dates for freshness assessment
- List relevant entities (companies, technologies) mentioned
```

Create `agents/IL-002_trend_analyst.md`:
```markdown
---
name: IL-002 Trend Analyst
description: "Analyzes industry signals for impact and strategic implications."
id: IL-002
team: 12. Intelligence
level: Sub-agent
autonomy: 85%
phase: 1
---

# IL-002: Trend Analyst

## Identity

You are the Trend Analyst for criteria.agency's Industry Listener. You analyze industry signals for impact and strategic implications.

## Steps

- **analyze**: Score signals for impact (0-100). Categorize as innovation, regulation, market_shift, M&A, or threat. Write implications for each signal.

## Rules

- Score impact consistently with reasoning
- Distinguish between direct and indirect impact on client
- Flag regulatory changes as high-priority
```

- [ ] **Step 4: Create Competitive Listener agent skill files**

Create `agents/CO-L_competitive_intelligence_lead.md`:
```markdown
---
name: CO-L Competitive Intelligence Lead
description: "Leads competitive monitoring: analyzes competitor activity, identifies gaps, generates Competitive Reports."
id: CO-L
team: 12. Intelligence
level: Leader
autonomy: 75%
phase: 1
---

# CO-L: Competitive Intelligence Lead

## Identity

You are the Competitive Intelligence Lead for criteria.agency. You oversee the Competitive Listener pipeline, tracking competitor campaigns, products, pricing, and strategy.

## Steps

- **analyze**: Categorize signals by type (campaign, product, pricing, hiring, PR). Identify competitive gaps and positioning shifts. Map competitive landscape changes.
- **report**: Generate Competitive Intelligence Report in Spanish (Latin American) with: activity summary per competitor, positioning map, gaps identified, recommended responses.
- **alert_eval**: Trigger alerts for: competitor product launches, significant pricing changes, aggressive campaigns in client's territory.

## Rules

- Write reports in Spanish (Latin American neutral)
- Track all configured competitors
- Identify actionable gaps and opportunities
- Recommend specific responses to competitor moves
- Mark synthetic data clearly
```

Create `agents/CO-001_competitor_scanner.md`:
```markdown
---
name: CO-001 Competitor Scanner
description: "Monitors competitor websites, social media, ads, hiring, and PR activities."
id: CO-001
team: 12. Intelligence
level: Sub-agent
autonomy: 90%
phase: 1
---

# CO-001: Competitor Scanner

## Identity

You are the Competitor Scanner for criteria.agency's Competitive Listener. You monitor competitor activity across websites, social media, ad campaigns, hiring patterns, and PR.

## Steps

- **collect**: Fetch competitor signals from configured channels. Tag each signal with competitor name, signal type, and impact level.

## Rules

- Monitor all configured competitors
- Cover all configured channels
- Assess impact level: high, medium, low
- Include source URLs for verification
```

Create `agents/CO-002_gap_analyst.md`:
```markdown
---
name: CO-002 Gap Analyst
description: "Identifies competitive gaps and positioning opportunities."
id: CO-002
team: 12. Intelligence
level: Sub-agent
autonomy: 85%
phase: 1
---

# CO-002: Gap Analyst

## Identity

You are the Gap Analyst for criteria.agency's Competitive Listener. You analyze competitor signals to identify gaps and positioning opportunities.

## Steps

- **analyze**: Compare competitor activities against client positioning. Identify gaps in market coverage, messaging, channels, and product features. Flag positioning shifts.

## Rules

- Be specific about gaps (not vague)
- Prioritize gaps by opportunity size
- Consider client's resources when suggesting opportunities
```

- [ ] **Step 5: Create Opportunity Agent skill files**

Create `agents/OA-L_opportunity_director.md`:
```markdown
---
name: OA-L Opportunity Director
description: "Directs opportunity detection: scores and prioritizes cross-listener opportunities."
id: OA-L
team: 12. Intelligence
level: Leader
autonomy: 70%
phase: 1
---

# OA-L: Opportunity Director

## Identity

You are the Opportunity Director for criteria.agency. You fuse intelligence from all 4 Listeners to identify actionable marketing opportunities with time windows.

## Steps

- **evaluate**: Score each opportunity for: brand fit (0-100), audience relevance (0-100), time sensitivity, effort required, expected impact. Calculate overall score.
- **prioritize**: Final prioritization considering: active campaigns, budget availability, team capacity. Produce the daily Opportunity Feed. Flag time-sensitive items as priority alerts.

## Rules

- Score honestly — not everything is a high-scoring opportunity
- Consider client's current active campaigns to avoid conflicts
- Time-sensitive opportunities (hours/days) get priority
- Write in Spanish (Latin American neutral)
- Mark synthetic data clearly
```

Create `agents/OA-001_opportunity_scanner.md`:
```markdown
---
name: OA-001 Opportunity Scanner
description: "Aggregates latest reports from all 4 Listeners and identifies signal intersections."
id: OA-001
team: 12. Intelligence
level: Sub-agent
autonomy: 85%
phase: 1
---

# OA-001: Opportunity Scanner

## Identity

You are the Opportunity Scanner for criteria.agency. You aggregate the latest reports from Brand, Culture, Industry, and Competitive Listeners to find intersections.

## Steps

- **aggregate**: Fetch the latest completed report from each of the 4 Listeners. Map intersections: trend + gap + audience fit.

## Rules

- Always fetch from all 4 listeners (use null if no data)
- Look for genuine intersections, not forced connections
- An intersection needs at least 2 listener sources
```

Create `agents/OA-002_brief_generator.md`:
```markdown
---
name: OA-002 Brief Generator
description: "Generates action briefs for top-scoring opportunities."
id: OA-002
team: 12. Intelligence
level: Sub-agent
autonomy: 80%
phase: 1
---

# OA-002: Brief Generator

## Identity

You are the Brief Generator for criteria.agency's Opportunity Agent. You create action briefs for opportunities scoring above 70.

## Steps

- **generate**: For each qualifying opportunity, generate an action brief: what to do, which motors to activate, suggested timeline, estimated budget.

## Rules

- Only generate briefs for opportunities with overallScore > 70
- Be specific about which motors (pipelines) to activate
- Include realistic timelines
- Write in Spanish (Latin American neutral)
- Mark synthetic data clearly
```

- [ ] **Step 6: Verify all 15 files exist**

Run: `ls agents/BL-* agents/CL-* agents/IL-* agents/CO-* agents/OA-*`
Expected: 15 files listed

- [ ] **Step 7: Commit**

```bash
git add agents/BL-L_brand_intelligence_lead.md agents/BL-001_mention_scanner.md agents/BL-002_sentiment_analyst.md agents/CL-L_culture_intelligence_lead.md agents/CL-001_trend_scanner.md agents/CL-002_relevance_analyst.md agents/IL-L_industry_intelligence_lead.md agents/IL-001_research_scanner.md agents/IL-002_trend_analyst.md agents/CO-L_competitive_intelligence_lead.md agents/CO-001_competitor_scanner.md agents/CO-002_gap_analyst.md agents/OA-L_opportunity_director.md agents/OA-001_opportunity_scanner.md agents/OA-002_brief_generator.md
git commit -m "feat(intelligence): add 15 agent skill files for Intelligence Engine"
```

---

## Task 11: Integration Test — Full Listener Cycle

**Files:**
- Create: `src/services/intelligence/integration.test.ts`

This test verifies that all components work together: listener services produce step results, the executor chains them, and the opportunity agent aggregates.

- [ ] **Step 1: Write integration tests**

```typescript
// src/services/intelligence/integration.test.ts
import { describe, it, expect, vi } from "vitest";
import { BrandListener } from "./brand-listener.js";
import { CultureListener } from "./culture-listener.js";
import { IndustryListener } from "./industry-listener.js";
import { CompetitiveListener } from "./competitive-listener.js";
import { OpportunityAgent } from "./opportunity-agent.js";
import type { BrandConfig, CultureConfig, IndustryConfig, CompetitorConfig } from "./types.js";

// Mock all LLM calls to return deterministic data
vi.mock("@/providers/generate-text.js", () => ({
  generateText: vi.fn().mockImplementation((_model: string, _sys: string, prompt: string) => {
    if (prompt.includes("social media mentions")) {
      return JSON.stringify([
        { source: "twitter", text: "Great brand!", author: "@user1", url: "https://t.co/1", timestamp: "2026-04-07T10:00:00Z", engagement: { likes: 10, shares: 2, comments: 1 }, metadata: {} },
      ]);
    }
    if (prompt.includes("cultural topics")) {
      return JSON.stringify([
        { topic: "AI trend", description: "AI in marketing", source: "google_trends", region: "LATAM", category: "industry_shift", volume: 80, velocity: 30, timestamp: "2026-04-07T10:00:00Z", sampleContent: [] },
      ]);
    }
    if (prompt.includes("industry intelligence")) {
      return JSON.stringify([
        { title: "New regulation", summary: "AI transparency req", source: "Gov", sourceType: "regulation", url: "https://gov.example", publishDate: "2026-04-01", relevantEntities: [], metadata: {} },
      ]);
    }
    if (prompt.includes("competitive intelligence")) {
      return JSON.stringify([
        { competitorName: "Rival", signalType: "campaign", title: "IG launch", description: "New campaign", source: "instagram", url: "https://ig.com/rival", timestamp: "2026-04-07T08:00:00Z", impact: "medium", metadata: {} },
      ]);
    }
    if (prompt.includes("opportunities")) {
      return JSON.stringify({
        opportunities: [
          { id: "opp-1", title: "AI content", description: "Leverage AI trend", sources: ["culture", "competitive"], brandFit: 85, audienceRelevance: 80, timeSensitivity: "days", effortRequired: "medium", expectedImpact: "high", overallScore: 83, suggestedMotors: ["community-management"], suggestedTimeline: "This week" },
        ],
      });
    }
    // Default: return a report-like response
    return "# Report\n\nSynthetic report content.\n\n*SYNTHETIC DATA*";
  }),
}));

vi.mock("../stub-provider-factory.js", () => ({
  StubProviderFactory: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue([{ source: "stub", text: "Stub data" }]),
  })),
}));

vi.mock("@/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { outputData: { summary: "Test report" }, listenerType: "brand" },
            ]),
          }),
        }),
      }),
    }),
  },
  schema: { continuousAgentRuns: {} },
}));

describe("Intelligence Engine Integration", () => {
  it("BrandListener produces valid step results for all 4 steps", async () => {
    const listener = new BrandListener();
    const config: BrandConfig = {
      clientId: "test", brandNames: ["TestBrand"], socialHandles: ["@test"],
      competitors: [], keywords: [], languages: ["es"], regions: ["LATAM"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");

    const analyze = await listener.analyze(collect.data);
    expect(analyze.status).toBe("completed");

    const report = await listener.report(analyze.data);
    expect(report.status).toBe("completed");
    expect(report.artifactContent).toBeDefined();

    const alert = await listener.alertEval(report.data);
    expect(alert.status).toBe("completed");
  });

  it("CultureListener produces valid step results", async () => {
    const listener = new CultureListener();
    const config: CultureConfig = {
      clientId: "test", industries: ["tech"],
      audienceDemographics: { ageRange: [25, 45], regions: ["LATAM"], interests: [] },
      languages: ["es"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");

    const analyze = await listener.analyze(collect.data);
    expect(analyze.status).toBe("completed");
  });

  it("IndustryListener produces valid step results", async () => {
    const listener = new IndustryListener();
    const config: IndustryConfig = {
      clientId: "test", primaryIndustry: "marketing", subSectors: [],
      keyPlayers: [], technologies: ["AI"], regions: ["LATAM"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");
  });

  it("CompetitiveListener produces valid step results", async () => {
    const listener = new CompetitiveListener();
    const config: CompetitorConfig = {
      clientId: "test",
      competitors: [{ name: "Rival", website: "https://rival.com", socialHandles: {}, industry: "marketing" }],
      channelsToWatch: ["social"],
    };

    const collect = await listener.collect(config);
    expect(collect.status).toBe("completed");
  });

  it("OpportunityAgent aggregates and scores", async () => {
    const agent = new OpportunityAgent();

    const aggregate = await agent.aggregate("test-client");
    expect(aggregate.status).toBe("completed");

    const evaluate = await agent.evaluate(aggregate.data);
    expect(evaluate.status).toBe("completed");
  });

  it("buildStepFns returns correct step names per listener type", () => {
    expect(Object.keys(new BrandListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new CultureListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new IndustryListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new CompetitiveListener().buildStepFns({ clientId: "x" } as any)))
      .toEqual(["collect", "analyze", "report", "alert_eval"]);
    expect(Object.keys(new OpportunityAgent().buildStepFns("x")))
      .toEqual(["aggregate", "evaluate", "generate", "prioritize"]);
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run src/services/intelligence/integration.test.ts`
Expected: 6 tests PASS

- [ ] **Step 3: Run all tests to verify no regression**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/intelligence/integration.test.ts
git commit -m "test(intelligence): add integration tests for all listener services and opportunity agent"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Verify all new files exist**

Run:
```bash
ls src/services/intelligence/*.ts
ls src/api/intelligence-routes.ts
ls agents/BL-* agents/CL-* agents/IL-* agents/CO-* agents/OA-*
```

Expected:
- 8 TypeScript files in `src/services/intelligence/`
- 1 route file
- 15 agent skill files

- [ ] **Step 2: Run full test suite**

Run: `PATH="/opt/homebrew/bin:$PATH" npx vitest run`
Expected: All tests PASS, including ~30+ new intelligence tests

- [ ] **Step 3: Verify server starts**

Run: `PATH="/opt/homebrew/bin:$PATH" npx tsx src/index.ts &` then `curl http://localhost:3000/health`
Expected: `{"status":"ok","version":"0.1.0"}`

Kill the server after verification.

- [ ] **Step 4: Verify intelligence agents in registry**

Run: `PATH="/opt/homebrew/bin:$PATH" npx tsx -e "import { AGENT_REGISTRY } from './src/agents/registry.js'; const intel = Object.keys(AGENT_REGISTRY).filter(k => ['BL','CL','IL','CO','OA'].some(p => k.startsWith(p))); console.log(intel.length, 'intelligence agents:', intel);"`
Expected: `15 intelligence agents: [BL-L, BL-001, BL-002, CL-L, CL-001, CL-002, IL-L, IL-001, IL-002, CO-L, CO-001, CO-002, OA-L, OA-001, OA-002]`
