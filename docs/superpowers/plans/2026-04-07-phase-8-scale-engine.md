# Phase 8: Scale Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Scale & Orchestration Engine (C-042 to C-044) — campaign orchestration from single brief, asset reuse registry, and capacity management for scalable virtual teams.

**Architecture:** Three subsystems — (1) Campaign Orchestrator decomposes briefs into channel sub-projects with shared context, (2) Asset Registry indexes all produced artifacts with AI tags/descriptions for reuse, (3) Capacity Manager tracks agent concurrency, queue depth, and health. Uses SK- prefix (team 37) to avoid SC- conflict with Security Engine (team 35).

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Zod, Vitest, gemini-2.5-flash (brief decomposition, asset tagging), parseJsonSafe (shared LLM JSON parser)

---

## File Structure

| File | Purpose |
|------|---------|
| `src/services/scale/types.ts` | All Scale Engine interfaces and types |
| `src/services/scale/campaign-orchestrator.ts` | Campaign creation, dispatch, monitoring, consolidation |
| `src/services/scale/brief-decomposer.ts` | Decomposes campaign brief into channel sub-briefs via LLM |
| `src/services/scale/asset-registry.ts` | Asset indexing, tag generation, search, recommendations |
| `src/services/scale/capacity-manager.ts` | Concurrency tracking, queue management, health checks |
| `src/services/scale/campaign-orchestrator.test.ts` | Tests for campaign orchestrator |
| `src/services/scale/brief-decomposer.test.ts` | Tests for brief decomposer |
| `src/services/scale/asset-registry.test.ts` | Tests for asset registry |
| `src/services/scale/capacity-manager.test.ts` | Tests for capacity manager |
| `src/services/scale/integration.test.ts` | Cross-service integration tests |
| `src/api/campaign-routes.ts` | 6 campaign API endpoints |
| `src/api/asset-routes.ts` | 5 asset registry API endpoints |
| `src/api/capacity-routes.ts` | 3 capacity monitoring API endpoints |
| `agents/SK-L_campaign_orchestrator.md` | Leader agent skill file |
| `agents/SK-001_brief_decomposer.md` | Brief decomposer agent skill file |
| `agents/SK-002_progress_monitor.md` | Progress monitor agent skill file |
| `agents/SK-003_asset_curator.md` | Asset curator agent skill file |

---

## Task 1: Scale Engine Type Definitions

**Files:**
- Create: `src/services/scale/types.ts`

- [ ] **Step 1: Create types file with all Scale Engine interfaces**

```typescript
// src/services/scale/types.ts
import type { DateRange } from "../analytics/types.js";

// ── Campaign Orchestration (C-042) ──

export type CampaignStatus =
  | "draft"
  | "decomposing"
  | "dispatched"
  | "in_progress"
  | "consolidating"
  | "delivered"
  | "failed";

export interface SharedCampaignContext {
  campaignMessage: string;
  visualDirection: string;
  toneGuidelines: string;
  targetAudience: string;
  callToAction: string;
}

export interface SubProjectEntry {
  projectId: string;
  motor: string;
  channel: string;
  status: string;
  priority: number;
  deliverables: string[];
}

export interface CampaignBudget {
  total: number;
  currency: string;
  allocated: Record<string, number>;
  spent: Record<string, number>;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  briefProjectId: string | null;
  brandDnaProjectId: string | null;
  status: CampaignStatus;
  sharedContext: SharedCampaignContext;
  budget: CampaignBudget | null;
  subProjects: SubProjectEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelSubBrief {
  motor: string;
  channel: string;
  briefContent: string;
  specs: Record<string, unknown>;
  priority: number;
  estimatedCost: number;
}

export interface DecompositionResult {
  subBriefs: ChannelSubBrief[];
  sharedContext: SharedCampaignContext;
  totalEstimatedCost: number;
}

export interface CampaignProgress {
  campaignId: string;
  status: CampaignStatus;
  totalSubProjects: number;
  completed: number;
  inProgress: number;
  failed: number;
  subProjects: SubProjectEntry[];
  estimatedCompletion: string | null;
}

// ── Asset Registry (C-043) ──

export type AssetType = "image" | "video" | "audio" | "document" | "template" | "component";

export interface AssetOriginalContext {
  projectId: string;
  campaign: string;
  channel: string;
  step: string;
}

export interface AssetPerformance {
  timesUsed: number;
  channels: string[];
  engagement: number | null;
}

export interface AssetAdaptation {
  assetId: string;
  channel: string;
  format: string;
}

export interface AssetRegistryEntry {
  id: string;
  artifactId: string;
  clientId: string;
  type: AssetType;
  tags: string[];
  description: string;
  originalContext: AssetOriginalContext;
  performance: AssetPerformance;
  adaptations: AssetAdaptation[];
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AssetSearchResult {
  asset: AssetRegistryEntry;
  relevanceScore: number;
  matchReason: string;
}

export interface AssetRecommendation {
  asset: AssetRegistryEntry;
  suggestedUse: string;
  adaptationNeeded: boolean;
  adaptationDetails: string | null;
}

export interface AssetStats {
  totalAssets: number;
  byType: Record<string, number>;
  reuseRate: number;
  topTags: Array<{ tag: string; count: number }>;
  recentlyUsed: AssetRegistryEntry[];
}

// ── Capacity Manager (C-044) ──

export type AgentStatus = "running" | "queued" | "idle" | "error";

export interface CapacityConfig {
  maxConcurrentAgents: number;
  maxConcurrentPerMotor: number;
  maxConcurrentPerClient: number;
}

export interface CapacitySnapshot {
  timestamp: string;
  concurrentAgents: number;
  queueDepth: number;
  agentsByStatus: Record<AgentStatus, number>;
  avgResponseTimeMs: number;
  errorCount: number;
}

export interface AgentHealthEntry {
  agentId: string;
  status: "healthy" | "degraded" | "unavailable";
  avgResponseTimeMs: number;
  successRate: number;
  lastExecution: string | null;
  totalExecutions: number;
  errorRate: number;
}

export interface CapacityOverview {
  config: CapacityConfig;
  current: CapacitySnapshot;
  agents: AgentHealthEntry[];
  utilizationPercent: number;
}

// ── Step Result ──

export interface ScaleStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
```

- [ ] **Step 2: Verify types compile**

Run: `source ~/.nvm/nvm.sh && npx tsc --noEmit src/services/scale/types.ts --skipLibCheck --moduleResolution node16 --module node16 --target es2022`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/services/scale/types.ts
git commit -m "feat(scale): add Scale Engine type definitions"
```

---

## Task 2: Database Schema — 3 New Tables

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add scale engine statuses to projectStatusEnum**

Add these values to the `projectStatusEnum` array (after the Budget Engine entries, before "delivered"):
```
"sk_decompose", "sk_dispatch", "sk_monitor", "sk_consolidate"
```

- [ ] **Step 2: Add sk-g1 gate to gateTypeEnum**

Add `"sk-g1"` to the `gateTypeEnum` array (after "bu-g1").

- [ ] **Step 3: Add campaigns table**

After the `campaignPnl` table definition, add:

```typescript
// ── Scale Engine tables ──

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => user.id),
  name: varchar("name", { length: 255 }).notNull(),
  briefProjectId: uuid("brief_project_id").references(() => projects.id),
  brandDnaProjectId: uuid("brand_dna_project_id").references(() => projects.id),
  status: varchar("status", { length: 30 }).default("draft").notNull(),
  sharedContext: jsonb("shared_context").notNull().$type<{
    campaignMessage: string;
    visualDirection: string;
    toneGuidelines: string;
    targetAudience: string;
    callToAction: string;
  }>(),
  budget: jsonb("budget").$type<{
    total: number;
    currency: string;
    allocated: Record<string, number>;
    spent: Record<string, number>;
  }>(),
  subProjects: jsonb("sub_projects").default([]).$type<Array<{
    projectId: string;
    motor: string;
    channel: string;
    status: string;
    priority: number;
    deliverables: string[];
  }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 4: Add assetRegistry table**

```typescript
export const assetRegistry = pgTable("asset_registry", {
  id: uuid("id").primaryKey().defaultRandom(),
  artifactId: uuid("artifact_id").notNull().references(() => artifacts.id),
  clientId: uuid("client_id").notNull().references(() => user.id),
  type: varchar("type", { length: 30 }).notNull(),
  tags: jsonb("tags").default([]).$type<string[]>(),
  description: text("description"),
  originalContext: jsonb("original_context").notNull().$type<{
    projectId: string;
    campaign: string;
    channel: string;
    step: string;
  }>(),
  performance: jsonb("performance").default({ timesUsed: 0, channels: [], engagement: null }).$type<{
    timesUsed: number;
    channels: string[];
    engagement: number | null;
  }>(),
  adaptations: jsonb("adaptations").default([]).$type<Array<{
    assetId: string;
    channel: string;
    format: string;
  }>>(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => [
  index("idx_asset_registry_client").on(table.clientId),
]);
```

- [ ] **Step 5: Add agentCapacityLog table**

```typescript
export const agentCapacityLog = pgTable("agent_capacity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  concurrentAgents: integer("concurrent_agents").notNull(),
  queueDepth: integer("queue_depth").notNull(),
  agentsByStatus: jsonb("agents_by_status").$type<Record<string, number>>(),
  avgResponseTimeMs: integer("avg_response_time_ms"),
  errorCount: integer("error_count").default(0),
});
```

- [ ] **Step 6: Generate migration**

Run: `source ~/.nvm/nvm.sh && npx drizzle-kit generate`
Expected: New migration file created in `drizzle/` directory

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(scale): add 3 Scale Engine database tables and campaign statuses"
```

---

## Task 3: Brief Decomposer Service

**Files:**
- Create: `src/services/scale/brief-decomposer.ts`
- Create: `src/services/scale/brief-decomposer.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/services/scale/brief-decomposer.test.ts
import { describe, it, expect, vi } from "vitest";
import { parseDecompositionResult, buildDecompositionPrompt } from "./brief-decomposer.js";
import type { SharedCampaignContext, ChannelSubBrief } from "./types.js";

describe("brief-decomposer", () => {
  describe("buildDecompositionPrompt", () => {
    it("includes brief text and requested channels", () => {
      const prompt = buildDecompositionPrompt(
        "Launch Q2 campaign for product X targeting millennials",
        ["instagram", "linkedin", "email"],
        5000,
      );
      expect(prompt).toContain("product X");
      expect(prompt).toContain("instagram");
      expect(prompt).toContain("linkedin");
      expect(prompt).toContain("email");
      expect(prompt).toContain("5000");
    });
  });

  describe("parseDecompositionResult", () => {
    it("parses valid LLM JSON into DecompositionResult", () => {
      const llmJson = JSON.stringify({
        subBriefs: [
          {
            motor: "graphic-design",
            channel: "instagram",
            briefContent: "Create 5 Instagram posts for product X",
            specs: { format: "1080x1080", count: 5 },
            priority: 1,
            estimatedCost: 1500,
          },
          {
            motor: "writers-room",
            channel: "linkedin",
            briefContent: "Write 3 LinkedIn articles about product X",
            specs: { wordCount: 800 },
            priority: 2,
            estimatedCost: 1000,
          },
        ],
        sharedContext: {
          campaignMessage: "Product X transforms your workflow",
          visualDirection: "Modern, minimal, blue tones",
          toneGuidelines: "Professional but approachable",
          targetAudience: "Urban millennials 25-35",
          callToAction: "Try free for 30 days",
        },
        totalEstimatedCost: 2500,
      });

      const result = parseDecompositionResult(llmJson);
      expect(result.subBriefs).toHaveLength(2);
      expect(result.subBriefs[0].motor).toBe("graphic-design");
      expect(result.sharedContext.campaignMessage).toContain("Product X");
      expect(result.totalEstimatedCost).toBe(2500);
    });

    it("handles markdown-fenced JSON", () => {
      const fenced = "```json\n" + JSON.stringify({
        subBriefs: [],
        sharedContext: {
          campaignMessage: "msg",
          visualDirection: "dir",
          toneGuidelines: "tone",
          targetAudience: "audience",
          callToAction: "cta",
        },
        totalEstimatedCost: 0,
      }) + "\n```";

      const result = parseDecompositionResult(fenced);
      expect(result.subBriefs).toHaveLength(0);
      expect(result.sharedContext.campaignMessage).toBe("msg");
    });

    it("throws on invalid JSON", () => {
      expect(() => parseDecompositionResult("not json")).toThrow();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/brief-decomposer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement brief decomposer**

```typescript
// src/services/scale/brief-decomposer.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type { DecompositionResult, ChannelSubBrief, SharedCampaignContext } from "./types.js";

const DECOMPOSITION_MODEL = "gemini-2.5-flash";

// Channel → default motor mapping
const CHANNEL_MOTOR_MAP: Record<string, string> = {
  instagram: "graphic-design",
  facebook: "graphic-design",
  linkedin: "writers-room",
  twitter: "writers-room",
  email: "email-marketing",
  youtube: "video-production",
  tiktok: "video-production",
  website: "web",
  podcast: "audio",
  blog: "writers-room",
};

export function buildDecompositionPrompt(
  briefText: string,
  channels: string[],
  budgetTotal: number,
): string {
  return `You are a campaign strategist. Decompose this campaign brief into channel-specific sub-briefs.

CAMPAIGN BRIEF:
${briefText}

REQUESTED CHANNELS: ${channels.join(", ")}
TOTAL BUDGET: $${budgetTotal}

For each channel, produce a sub-brief specifying what content to create, with specs and estimated cost.
Distribute the budget proportionally across channels based on typical effectiveness.

Respond with ONLY valid JSON (no markdown fences):
{
  "subBriefs": [
    {
      "motor": "<motor-name>",
      "channel": "<channel>",
      "briefContent": "<detailed brief for this channel>",
      "specs": { ... },
      "priority": <1-N>,
      "estimatedCost": <number>
    }
  ],
  "sharedContext": {
    "campaignMessage": "<core message>",
    "visualDirection": "<visual guidelines>",
    "toneGuidelines": "<tone and voice>",
    "targetAudience": "<target audience description>",
    "callToAction": "<primary CTA>"
  },
  "totalEstimatedCost": <number>
}`;
}

export function parseDecompositionResult(text: string): DecompositionResult {
  const parsed = parseJsonSafe<DecompositionResult>(text);
  if (!parsed) throw new Error("Failed to parse decomposition result");

  // Validate required fields
  if (!Array.isArray(parsed.subBriefs)) {
    throw new Error("Missing subBriefs array");
  }
  if (!parsed.sharedContext?.campaignMessage) {
    throw new Error("Missing sharedContext.campaignMessage");
  }

  return {
    subBriefs: parsed.subBriefs,
    sharedContext: parsed.sharedContext,
    totalEstimatedCost: parsed.totalEstimatedCost ?? 0,
  };
}

export function assignMotors(channels: string[]): Array<{ channel: string; motor: string }> {
  return channels.map((ch) => ({
    channel: ch,
    motor: CHANNEL_MOTOR_MAP[ch] ?? "writers-room",
  }));
}

export async function decomposeBrief(
  briefText: string,
  channels: string[],
  budgetTotal: number,
): Promise<DecompositionResult> {
  const prompt = buildDecompositionPrompt(briefText, channels, budgetTotal);

  const { text } = await generateText({
    model: google(DECOMPOSITION_MODEL),
    prompt,
    temperature: 0.3,
  });

  return parseDecompositionResult(text);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/brief-decomposer.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/scale/brief-decomposer.ts src/services/scale/brief-decomposer.test.ts
git commit -m "feat(scale): add brief decomposer with LLM-based channel splitting"
```

---

## Task 4: Campaign Orchestrator Service

**Files:**
- Create: `src/services/scale/campaign-orchestrator.ts`
- Create: `src/services/scale/campaign-orchestrator.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/services/scale/campaign-orchestrator.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  buildCampaignFromDecomposition,
  computeCampaignProgress,
} from "./campaign-orchestrator.js";
import type { DecompositionResult, SubProjectEntry, CampaignStatus } from "./types.js";

describe("campaign-orchestrator", () => {
  describe("buildCampaignFromDecomposition", () => {
    it("creates campaign object from decomposition result", () => {
      const decomposition: DecompositionResult = {
        subBriefs: [
          {
            motor: "graphic-design",
            channel: "instagram",
            briefContent: "Create posts",
            specs: {},
            priority: 1,
            estimatedCost: 1000,
          },
          {
            motor: "writers-room",
            channel: "linkedin",
            briefContent: "Write articles",
            specs: {},
            priority: 2,
            estimatedCost: 500,
          },
        ],
        sharedContext: {
          campaignMessage: "Launch product",
          visualDirection: "Modern",
          toneGuidelines: "Professional",
          targetAudience: "Millennials",
          callToAction: "Buy now",
        },
        totalEstimatedCost: 1500,
      };

      const campaign = buildCampaignFromDecomposition(
        "client-1",
        "Q2 Launch",
        decomposition,
        2000,
        "USD",
      );

      expect(campaign.clientId).toBe("client-1");
      expect(campaign.name).toBe("Q2 Launch");
      expect(campaign.status).toBe("decomposing");
      expect(campaign.sharedContext.campaignMessage).toBe("Launch product");
      expect(campaign.budget?.total).toBe(2000);
      expect(campaign.budget?.allocated).toHaveProperty("graphic-design");
      expect(campaign.budget?.allocated).toHaveProperty("writers-room");
    });
  });

  describe("computeCampaignProgress", () => {
    it("computes progress from sub-project statuses", () => {
      const subProjects: SubProjectEntry[] = [
        { projectId: "p1", motor: "graphic-design", channel: "instagram", status: "delivered", priority: 1, deliverables: ["a1"] },
        { projectId: "p2", motor: "writers-room", channel: "linkedin", status: "brief", priority: 2, deliverables: [] },
        { projectId: "p3", motor: "video-production", channel: "youtube", status: "delivered", priority: 3, deliverables: ["a2"] },
      ];

      const progress = computeCampaignProgress("camp-1", "in_progress", subProjects);
      expect(progress.totalSubProjects).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.inProgress).toBe(1);
      expect(progress.failed).toBe(0);
    });

    it("detects failed sub-projects", () => {
      const subProjects: SubProjectEntry[] = [
        { projectId: "p1", motor: "graphic-design", channel: "instagram", status: "delivered", priority: 1, deliverables: [] },
        { projectId: "p2", motor: "writers-room", channel: "linkedin", status: "paused", priority: 2, deliverables: [] },
      ];

      const progress = computeCampaignProgress("camp-1", "in_progress", subProjects);
      expect(progress.completed).toBe(1);
      expect(progress.failed).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/campaign-orchestrator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement campaign orchestrator**

```typescript
// src/services/scale/campaign-orchestrator.ts
import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { decomposeBrief } from "./brief-decomposer.js";
import type {
  Campaign,
  CampaignStatus,
  CampaignProgress,
  CampaignBudget,
  DecompositionResult,
  SubProjectEntry,
  ScaleStepResult,
} from "./types.js";

export function buildCampaignFromDecomposition(
  clientId: string,
  name: string,
  decomposition: DecompositionResult,
  budgetTotal: number,
  currency: string,
): Omit<Campaign, "id" | "createdAt" | "updatedAt"> {
  const allocated: Record<string, number> = {};
  for (const sb of decomposition.subBriefs) {
    allocated[sb.motor] = (allocated[sb.motor] ?? 0) + sb.estimatedCost;
  }

  return {
    clientId,
    name,
    briefProjectId: null,
    brandDnaProjectId: null,
    status: "decomposing",
    sharedContext: decomposition.sharedContext,
    budget: {
      total: budgetTotal,
      currency,
      allocated,
      spent: {},
    },
    subProjects: [],
  };
}

export function computeCampaignProgress(
  campaignId: string,
  status: CampaignStatus,
  subProjects: SubProjectEntry[],
): CampaignProgress {
  let completed = 0;
  let inProgress = 0;
  let failed = 0;

  for (const sp of subProjects) {
    if (sp.status === "delivered") {
      completed++;
    } else if (sp.status === "paused" || sp.status === "failed") {
      failed++;
    } else {
      inProgress++;
    }
  }

  return {
    campaignId,
    status,
    totalSubProjects: subProjects.length,
    completed,
    inProgress,
    failed,
    subProjects,
    estimatedCompletion: null,
  };
}

export async function createCampaign(
  clientId: string,
  name: string,
  briefText: string,
  channels: string[],
  budgetTotal: number,
  currency: string,
  briefProjectId?: string,
  brandDnaProjectId?: string,
): Promise<Campaign> {
  const decomposition = await decomposeBrief(briefText, channels, budgetTotal);
  const campaignData = buildCampaignFromDecomposition(
    clientId,
    name,
    decomposition,
    budgetTotal,
    currency,
  );

  const [row] = await db
    .insert(schema.campaigns)
    .values({
      clientId,
      name,
      briefProjectId: briefProjectId ?? null,
      brandDnaProjectId: brandDnaProjectId ?? null,
      status: "decomposing",
      sharedContext: decomposition.sharedContext,
      budget: campaignData.budget,
      subProjects: [],
    })
    .returning();

  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    briefProjectId: row.briefProjectId,
    brandDnaProjectId: row.brandDnaProjectId,
    status: row.status as CampaignStatus,
    sharedContext: row.sharedContext as Campaign["sharedContext"],
    budget: row.budget as CampaignBudget | null,
    subProjects: (row.subProjects ?? []) as SubProjectEntry[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const [row] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId));

  if (!row) return null;

  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    briefProjectId: row.briefProjectId,
    brandDnaProjectId: row.brandDnaProjectId,
    status: row.status as CampaignStatus,
    sharedContext: row.sharedContext as Campaign["sharedContext"],
    budget: row.budget as CampaignBudget | null,
    subProjects: (row.subProjects ?? []) as SubProjectEntry[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCampaigns(clientId: string): Promise<Campaign[]> {
  const rows = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.clientId, clientId));

  return rows.map((row) => ({
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    briefProjectId: row.briefProjectId,
    brandDnaProjectId: row.brandDnaProjectId,
    status: row.status as CampaignStatus,
    sharedContext: row.sharedContext as Campaign["sharedContext"],
    budget: row.budget as CampaignBudget | null,
    subProjects: (row.subProjects ?? []) as SubProjectEntry[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function dispatchCampaign(campaignId: string): Promise<SubProjectEntry[]> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "decomposing" && campaign.status !== "draft") {
    throw new Error(`Cannot dispatch campaign in status: ${campaign.status}`);
  }

  // In a real implementation, this would create sub-projects via the orchestrator.
  // For now, mark campaign as dispatched with placeholder sub-projects.
  await db
    .update(schema.campaigns)
    .set({
      status: "dispatched",
      updatedAt: new Date(),
    })
    .where(eq(schema.campaigns.id, campaignId));

  return campaign.subProjects;
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus,
  subProjects?: SubProjectEntry[],
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (subProjects !== undefined) {
    updates.subProjects = subProjects;
  }

  await db
    .update(schema.campaigns)
    .set(updates)
    .where(eq(schema.campaigns.id, campaignId));
}

export async function getCampaignProgress(campaignId: string): Promise<CampaignProgress | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  return computeCampaignProgress(
    campaignId,
    campaign.status,
    campaign.subProjects,
  );
}

export async function consolidateCampaign(campaignId: string): Promise<string[]> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const allDeliverables = campaign.subProjects.flatMap((sp) => sp.deliverables);

  await updateCampaignStatus(campaignId, "delivered", campaign.subProjects);

  return allDeliverables;
}

export async function runCampaignOrchestration(
  clientId: string,
  name: string,
  briefText: string,
  channels: string[],
  budgetTotal: number,
): Promise<ScaleStepResult> {
  try {
    const campaign = await createCampaign(
      clientId,
      name,
      briefText,
      channels,
      budgetTotal,
      "USD",
    );

    return {
      step: "sk_decompose",
      status: "completed",
      data: { campaignId: campaign.id, campaign },
    };
  } catch (error) {
    return {
      step: "sk_decompose",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/campaign-orchestrator.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/scale/campaign-orchestrator.ts src/services/scale/campaign-orchestrator.test.ts
git commit -m "feat(scale): add campaign orchestrator with decomposition and progress tracking"
```

---

## Task 5: Asset Registry Service

**Files:**
- Create: `src/services/scale/asset-registry.ts`
- Create: `src/services/scale/asset-registry.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/services/scale/asset-registry.test.ts
import { describe, it, expect } from "vitest";
import {
  computeAssetStats,
  matchAssetsByTags,
  buildIndexingPrompt,
  parseIndexingResult,
} from "./asset-registry.js";
import type { AssetRegistryEntry } from "./types.js";

describe("asset-registry", () => {
  const sampleAssets: AssetRegistryEntry[] = [
    {
      id: "a1",
      artifactId: "art1",
      clientId: "c1",
      type: "image",
      tags: ["product", "instagram", "hero"],
      description: "Hero image for product launch",
      originalContext: { projectId: "p1", campaign: "Q1", channel: "instagram", step: "production" },
      performance: { timesUsed: 3, channels: ["instagram", "facebook"], engagement: 4.2 },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-01-01",
      lastUsedAt: "2026-03-15",
    },
    {
      id: "a2",
      artifactId: "art2",
      clientId: "c1",
      type: "document",
      tags: ["copy", "linkedin", "blog"],
      description: "LinkedIn article about product features",
      originalContext: { projectId: "p1", campaign: "Q1", channel: "linkedin", step: "wr_draft" },
      performance: { timesUsed: 1, channels: ["linkedin"], engagement: 2.1 },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-01-15",
      lastUsedAt: "2026-02-01",
    },
    {
      id: "a3",
      artifactId: "art3",
      clientId: "c1",
      type: "video",
      tags: ["product", "youtube", "explainer"],
      description: "Product explainer video",
      originalContext: { projectId: "p2", campaign: "Q2", channel: "youtube", step: "video_gen" },
      performance: { timesUsed: 0, channels: [], engagement: null },
      adaptations: [],
      expiresAt: null,
      createdAt: "2026-03-01",
      lastUsedAt: null,
    },
  ];

  describe("computeAssetStats", () => {
    it("computes stats from asset list", () => {
      const stats = computeAssetStats(sampleAssets);
      expect(stats.totalAssets).toBe(3);
      expect(stats.byType.image).toBe(1);
      expect(stats.byType.document).toBe(1);
      expect(stats.byType.video).toBe(1);
      expect(stats.reuseRate).toBeCloseTo(2 / 3); // 2 of 3 have timesUsed > 0
      expect(stats.topTags.length).toBeGreaterThan(0);
      expect(stats.topTags[0].tag).toBe("product"); // appears in 2 assets
    });
  });

  describe("matchAssetsByTags", () => {
    it("returns assets matching any of the query tags sorted by match count", () => {
      const results = matchAssetsByTags(sampleAssets, ["product", "instagram"]);
      expect(results.length).toBe(2); // a1 matches both, a3 matches "product"
      expect(results[0].asset.id).toBe("a1"); // 2 matches
      expect(results[1].asset.id).toBe("a3"); // 1 match
    });

    it("returns empty array when no tags match", () => {
      const results = matchAssetsByTags(sampleAssets, ["nonexistent"]);
      expect(results).toHaveLength(0);
    });
  });

  describe("buildIndexingPrompt", () => {
    it("includes artifact name and type", () => {
      const prompt = buildIndexingPrompt("hero-image.png", "image", "Product launch Instagram post");
      expect(prompt).toContain("hero-image.png");
      expect(prompt).toContain("image");
    });
  });

  describe("parseIndexingResult", () => {
    it("parses valid indexing response", () => {
      const json = JSON.stringify({
        tags: ["product", "hero", "launch"],
        description: "Hero image for product launch campaign",
      });
      const result = parseIndexingResult(json);
      expect(result.tags).toContain("product");
      expect(result.description).toContain("Hero image");
    });

    it("handles markdown-fenced JSON", () => {
      const fenced = "```json\n" + JSON.stringify({
        tags: ["logo"],
        description: "Company logo",
      }) + "\n```";
      const result = parseIndexingResult(fenced);
      expect(result.tags).toContain("logo");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/asset-registry.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement asset registry**

```typescript
// src/services/scale/asset-registry.ts
import { db, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { parseJsonSafe } from "../../shared/parse-json.js";
import type {
  AssetRegistryEntry,
  AssetSearchResult,
  AssetRecommendation,
  AssetStats,
  AssetType,
  AssetOriginalContext,
  AssetPerformance,
  AssetAdaptation,
  ScaleStepResult,
} from "./types.js";

const INDEXING_MODEL = "gemini-2.5-flash";

export function computeAssetStats(assets: AssetRegistryEntry[]): AssetStats {
  const byType: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  let reusedCount = 0;

  for (const asset of assets) {
    byType[asset.type] = (byType[asset.type] ?? 0) + 1;
    if (asset.performance.timesUsed > 0) reusedCount++;
    for (const tag of asset.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  const recentlyUsed = assets
    .filter((a) => a.lastUsedAt)
    .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""))
    .slice(0, 5);

  return {
    totalAssets: assets.length,
    byType,
    reuseRate: assets.length > 0 ? reusedCount / assets.length : 0,
    topTags,
    recentlyUsed,
  };
}

export function matchAssetsByTags(
  assets: AssetRegistryEntry[],
  queryTags: string[],
): AssetSearchResult[] {
  const results: AssetSearchResult[] = [];

  for (const asset of assets) {
    const matchCount = queryTags.filter((t) =>
      asset.tags.some((at) => at.toLowerCase() === t.toLowerCase()),
    ).length;

    if (matchCount > 0) {
      results.push({
        asset,
        relevanceScore: matchCount / queryTags.length,
        matchReason: `Matched ${matchCount} of ${queryTags.length} tags`,
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function buildIndexingPrompt(
  artifactName: string,
  artifactType: string,
  contextDescription: string,
): string {
  return `You are an asset librarian. Index this creative asset for future reuse.

ASSET: ${artifactName}
TYPE: ${artifactType}
CONTEXT: ${contextDescription}

Generate tags and a description for this asset. Tags should be specific and useful for search.

Respond with ONLY valid JSON:
{
  "tags": ["tag1", "tag2", ...],
  "description": "<one-sentence description of the asset>"
}`;
}

export function parseIndexingResult(text: string): { tags: string[]; description: string } {
  const parsed = parseJsonSafe<{ tags: string[]; description: string }>(text);
  if (!parsed || !Array.isArray(parsed.tags)) {
    throw new Error("Failed to parse indexing result");
  }
  return { tags: parsed.tags, description: parsed.description ?? "" };
}

export async function indexArtifact(
  artifactId: string,
  clientId: string,
  artifactName: string,
  artifactType: AssetType,
  context: AssetOriginalContext,
): Promise<AssetRegistryEntry> {
  const prompt = buildIndexingPrompt(artifactName, artifactType, JSON.stringify(context));

  const { text } = await generateText({
    model: google(INDEXING_MODEL),
    prompt,
    temperature: 0.2,
  });

  const { tags, description } = parseIndexingResult(text);

  const [row] = await db
    .insert(schema.assetRegistry)
    .values({
      artifactId,
      clientId,
      type: artifactType,
      tags,
      description,
      originalContext: context,
      performance: { timesUsed: 0, channels: [], engagement: null },
      adaptations: [],
    })
    .returning();

  return {
    id: row.id,
    artifactId: row.artifactId,
    clientId: row.clientId,
    type: row.type as AssetType,
    tags: (row.tags ?? []) as string[],
    description: row.description ?? "",
    originalContext: row.originalContext as AssetOriginalContext,
    performance: row.performance as AssetPerformance,
    adaptations: (row.adaptations ?? []) as AssetAdaptation[],
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

export async function listAssets(clientId: string): Promise<AssetRegistryEntry[]> {
  const rows = await db
    .select()
    .from(schema.assetRegistry)
    .where(eq(schema.assetRegistry.clientId, clientId));

  return rows.map((row) => ({
    id: row.id,
    artifactId: row.artifactId,
    clientId: row.clientId,
    type: row.type as AssetType,
    tags: (row.tags ?? []) as string[],
    description: row.description ?? "",
    originalContext: row.originalContext as AssetOriginalContext,
    performance: row.performance as AssetPerformance,
    adaptations: (row.adaptations ?? []) as AssetAdaptation[],
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  }));
}

export async function searchAssets(
  clientId: string,
  tags: string[],
): Promise<AssetSearchResult[]> {
  const assets = await listAssets(clientId);
  return matchAssetsByTags(assets, tags);
}

export async function getAssetStats(clientId: string): Promise<AssetStats> {
  const assets = await listAssets(clientId);
  return computeAssetStats(assets);
}

export async function recordAssetUsage(
  assetId: string,
  channel: string,
): Promise<void> {
  const [row] = await db
    .select()
    .from(schema.assetRegistry)
    .where(eq(schema.assetRegistry.id, assetId));

  if (!row) return;

  const perf = row.performance as AssetPerformance;
  const updatedPerf: AssetPerformance = {
    timesUsed: perf.timesUsed + 1,
    channels: Array.from(new Set([...perf.channels, channel])),
    engagement: perf.engagement,
  };

  await db
    .update(schema.assetRegistry)
    .set({
      performance: updatedPerf,
      lastUsedAt: new Date(),
    })
    .where(eq(schema.assetRegistry.id, assetId));
}

export async function getAssetRecommendations(
  clientId: string,
  channel: string,
  tags: string[],
): Promise<AssetRecommendation[]> {
  const results = await searchAssets(clientId, [...tags, channel]);

  return results.slice(0, 5).map((r) => ({
    asset: r.asset,
    suggestedUse: `Reuse for ${channel}: ${r.matchReason}`,
    adaptationNeeded: !r.asset.performance.channels.includes(channel),
    adaptationDetails: !r.asset.performance.channels.includes(channel)
      ? `Adapt from ${r.asset.originalContext.channel} to ${channel}`
      : null,
  }));
}

export async function runAssetIndexing(clientId: string): Promise<ScaleStepResult> {
  try {
    const stats = await getAssetStats(clientId);
    return {
      step: "sk_asset_index",
      status: "completed",
      data: { stats },
    };
  } catch (error) {
    return {
      step: "sk_asset_index",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/asset-registry.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/scale/asset-registry.ts src/services/scale/asset-registry.test.ts
git commit -m "feat(scale): add asset registry with AI indexing, tag search, and recommendations"
```

---

## Task 6: Capacity Manager Service

**Files:**
- Create: `src/services/scale/capacity-manager.ts`
- Create: `src/services/scale/capacity-manager.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/services/scale/capacity-manager.test.ts
import { describe, it, expect } from "vitest";
import {
  DEFAULT_CAPACITY_CONFIG,
  computeUtilization,
  canDispatch,
  buildHealthEntry,
} from "./capacity-manager.js";
import type { CapacityConfig, CapacitySnapshot, AgentHealthEntry } from "./types.js";

describe("capacity-manager", () => {
  describe("DEFAULT_CAPACITY_CONFIG", () => {
    it("has expected defaults", () => {
      expect(DEFAULT_CAPACITY_CONFIG.maxConcurrentAgents).toBe(10);
      expect(DEFAULT_CAPACITY_CONFIG.maxConcurrentPerMotor).toBe(3);
      expect(DEFAULT_CAPACITY_CONFIG.maxConcurrentPerClient).toBe(10);
    });
  });

  describe("computeUtilization", () => {
    it("returns 0 when no agents running", () => {
      expect(computeUtilization(0, 10)).toBe(0);
    });

    it("returns 100 at capacity", () => {
      expect(computeUtilization(10, 10)).toBe(100);
    });

    it("returns proportional value", () => {
      expect(computeUtilization(5, 10)).toBe(50);
    });
  });

  describe("canDispatch", () => {
    const config: CapacityConfig = {
      maxConcurrentAgents: 10,
      maxConcurrentPerMotor: 3,
      maxConcurrentPerClient: 5,
    };

    it("allows dispatch when under all limits", () => {
      expect(canDispatch(config, 5, 2, 3)).toBe(true);
    });

    it("blocks when at global limit", () => {
      expect(canDispatch(config, 10, 1, 1)).toBe(false);
    });

    it("blocks when at motor limit", () => {
      expect(canDispatch(config, 5, 3, 2)).toBe(false);
    });

    it("blocks when at client limit", () => {
      expect(canDispatch(config, 5, 1, 5)).toBe(false);
    });
  });

  describe("buildHealthEntry", () => {
    it("marks agent as healthy with high success rate", () => {
      const entry = buildHealthEntry("AG-001", 150, 0.98, 100, 2, "2026-04-07T12:00:00Z");
      expect(entry.status).toBe("healthy");
      expect(entry.successRate).toBe(0.98);
      expect(entry.errorRate).toBe(0.02);
    });

    it("marks agent as degraded with moderate error rate", () => {
      const entry = buildHealthEntry("AG-002", 500, 0.85, 50, 8, null);
      expect(entry.status).toBe("degraded");
    });

    it("marks agent as unavailable with high error rate", () => {
      const entry = buildHealthEntry("AG-003", 2000, 0.5, 20, 10, null);
      expect(entry.status).toBe("unavailable");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/capacity-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement capacity manager**

```typescript
// src/services/scale/capacity-manager.ts
import { db, schema } from "../../db/index.js";
import { desc } from "drizzle-orm";
import type {
  CapacityConfig,
  CapacitySnapshot,
  CapacityOverview,
  AgentHealthEntry,
  ScaleStepResult,
} from "./types.js";

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  maxConcurrentAgents: 10,
  maxConcurrentPerMotor: 3,
  maxConcurrentPerClient: 10,
};

export function computeUtilization(
  concurrentAgents: number,
  maxConcurrent: number,
): number {
  if (maxConcurrent <= 0) return 0;
  return Math.round((concurrentAgents / maxConcurrent) * 100);
}

export function canDispatch(
  config: CapacityConfig,
  currentGlobal: number,
  currentMotor: number,
  currentClient: number,
): boolean {
  return (
    currentGlobal < config.maxConcurrentAgents &&
    currentMotor < config.maxConcurrentPerMotor &&
    currentClient < config.maxConcurrentPerClient
  );
}

export function buildHealthEntry(
  agentId: string,
  avgResponseTimeMs: number,
  successRate: number,
  totalExecutions: number,
  errorCount: number,
  lastExecution: string | null,
): AgentHealthEntry {
  const errorRate = 1 - successRate;
  let status: AgentHealthEntry["status"] = "healthy";

  if (errorRate > 0.3 || avgResponseTimeMs > 1500) {
    status = "unavailable";
  } else if (errorRate > 0.1 || avgResponseTimeMs > 800) {
    status = "degraded";
  }

  return {
    agentId,
    status,
    avgResponseTimeMs,
    successRate,
    lastExecution,
    totalExecutions,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

export async function logCapacity(snapshot: Omit<CapacitySnapshot, "timestamp">): Promise<void> {
  await db.insert(schema.agentCapacityLog).values({
    concurrentAgents: snapshot.concurrentAgents,
    queueDepth: snapshot.queueDepth,
    agentsByStatus: snapshot.agentsByStatus,
    avgResponseTimeMs: snapshot.avgResponseTimeMs,
    errorCount: snapshot.errorCount,
  });
}

export async function getCapacityHistory(limit: number = 50): Promise<CapacitySnapshot[]> {
  const rows = await db
    .select()
    .from(schema.agentCapacityLog)
    .orderBy(desc(schema.agentCapacityLog.timestamp))
    .limit(limit);

  return rows.map((row) => ({
    timestamp: row.timestamp.toISOString(),
    concurrentAgents: row.concurrentAgents,
    queueDepth: row.queueDepth,
    agentsByStatus: (row.agentsByStatus ?? {}) as Record<string, number>,
    avgResponseTimeMs: row.avgResponseTimeMs ?? 0,
    errorCount: row.errorCount ?? 0,
  }));
}

export async function getCurrentCapacity(): Promise<CapacityOverview> {
  const history = await getCapacityHistory(1);
  const current: CapacitySnapshot = history[0] ?? {
    timestamp: new Date().toISOString(),
    concurrentAgents: 0,
    queueDepth: 0,
    agentsByStatus: { running: 0, queued: 0, idle: 0, error: 0 },
    avgResponseTimeMs: 0,
    errorCount: 0,
  };

  return {
    config: DEFAULT_CAPACITY_CONFIG,
    current,
    agents: [],
    utilizationPercent: computeUtilization(
      current.concurrentAgents,
      DEFAULT_CAPACITY_CONFIG.maxConcurrentAgents,
    ),
  };
}

export async function runCapacityCheck(): Promise<ScaleStepResult> {
  try {
    const overview = await getCurrentCapacity();
    return {
      step: "sk_capacity",
      status: "completed",
      data: { overview },
    };
  } catch (error) {
    return {
      step: "sk_capacity",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/capacity-manager.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/scale/capacity-manager.ts src/services/scale/capacity-manager.test.ts
git commit -m "feat(scale): add capacity manager with concurrency control and health tracking"
```

---

## Task 7: Integration Tests

**Files:**
- Create: `src/services/scale/integration.test.ts`

- [ ] **Step 1: Write integration tests**

```typescript
// src/services/scale/integration.test.ts
import { describe, it, expect } from "vitest";
import type {
  Campaign,
  CampaignStatus,
  DecompositionResult,
  SharedCampaignContext,
  ChannelSubBrief,
  SubProjectEntry,
  CampaignProgress,
  AssetRegistryEntry,
  AssetSearchResult,
  AssetRecommendation,
  AssetStats,
  AssetType,
  CapacityConfig,
  CapacitySnapshot,
  CapacityOverview,
  AgentHealthEntry,
  ScaleStepResult,
} from "./types.js";
import { buildCampaignFromDecomposition, computeCampaignProgress } from "./campaign-orchestrator.js";
import { computeAssetStats, matchAssetsByTags } from "./asset-registry.js";
import { DEFAULT_CAPACITY_CONFIG, computeUtilization, canDispatch } from "./capacity-manager.js";

describe("Scale Engine integration", () => {
  // Type completeness tests
  describe("type completeness", () => {
    it("Campaign has all required fields", () => {
      const campaign: Campaign = {
        id: "1",
        clientId: "c1",
        name: "Test Campaign",
        briefProjectId: null,
        brandDnaProjectId: null,
        status: "draft",
        sharedContext: {
          campaignMessage: "msg",
          visualDirection: "dir",
          toneGuidelines: "tone",
          targetAudience: "audience",
          callToAction: "cta",
        },
        budget: null,
        subProjects: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };
      expect(campaign.id).toBeDefined();
      expect(campaign.sharedContext.campaignMessage).toBeDefined();
    });

    it("AssetRegistryEntry has all required fields", () => {
      const entry: AssetRegistryEntry = {
        id: "1",
        artifactId: "a1",
        clientId: "c1",
        type: "image",
        tags: ["logo"],
        description: "Company logo",
        originalContext: { projectId: "p1", campaign: "Q1", channel: "web", step: "production" },
        performance: { timesUsed: 5, channels: ["web"], engagement: 3.5 },
        adaptations: [],
        expiresAt: null,
        createdAt: "2026-01-01",
        lastUsedAt: null,
      };
      expect(entry.type).toBe("image");
      expect(entry.tags).toContain("logo");
    });

    it("CapacityOverview has all required fields", () => {
      const overview: CapacityOverview = {
        config: DEFAULT_CAPACITY_CONFIG,
        current: {
          timestamp: "2026-01-01",
          concurrentAgents: 5,
          queueDepth: 2,
          agentsByStatus: { running: 5, queued: 2, idle: 118, error: 0 },
          avgResponseTimeMs: 200,
          errorCount: 0,
        },
        agents: [],
        utilizationPercent: 50,
      };
      expect(overview.utilizationPercent).toBe(50);
    });

    it("CampaignStatus covers all states", () => {
      const statuses: CampaignStatus[] = [
        "draft", "decomposing", "dispatched", "in_progress", "consolidating", "delivered", "failed",
      ];
      expect(statuses).toHaveLength(7);
    });

    it("AssetType covers all types", () => {
      const types: AssetType[] = ["image", "video", "audio", "document", "template", "component"];
      expect(types).toHaveLength(6);
    });

    it("ScaleStepResult has step naming convention", () => {
      const result: ScaleStepResult = {
        step: "sk_decompose",
        status: "completed",
        data: {},
      };
      expect(result.step).toMatch(/^sk_/);
    });
  });

  // Cross-service flow tests
  describe("cross-service flow", () => {
    it("campaign decomposition feeds asset search tags", () => {
      const decomposition: DecompositionResult = {
        subBriefs: [
          { motor: "graphic-design", channel: "instagram", briefContent: "Posts", specs: {}, priority: 1, estimatedCost: 1000 },
        ],
        sharedContext: {
          campaignMessage: "Launch",
          visualDirection: "Modern",
          toneGuidelines: "Pro",
          targetAudience: "Millennials",
          callToAction: "Buy",
        },
        totalEstimatedCost: 1000,
      };

      // Tags from sub-brief can feed asset search
      const searchTags = decomposition.subBriefs.flatMap((sb) => [sb.motor, sb.channel]);
      expect(searchTags).toContain("graphic-design");
      expect(searchTags).toContain("instagram");

      // Those tags can search the asset registry
      const assets: AssetRegistryEntry[] = [
        {
          id: "a1", artifactId: "art1", clientId: "c1", type: "image",
          tags: ["instagram", "hero"], description: "Hero",
          originalContext: { projectId: "p1", campaign: "Q1", channel: "instagram", step: "production" },
          performance: { timesUsed: 3, channels: ["instagram"], engagement: 4.0 },
          adaptations: [], expiresAt: null, createdAt: "2026-01-01", lastUsedAt: "2026-03-01",
        },
      ];

      const results = matchAssetsByTags(assets, searchTags);
      expect(results).toHaveLength(1);
      expect(results[0].asset.id).toBe("a1");
    });

    it("capacity check integrates with campaign dispatch decision", () => {
      const config = DEFAULT_CAPACITY_CONFIG;

      // Campaign wants to dispatch 3 sub-projects
      const subProjectCount = 3;
      const currentGlobal = 7;
      const currentMotor = 1;
      const currentClient = 3;

      // Check if each can dispatch
      const canDispatchAll = Array.from({ length: subProjectCount }).every((_, i) =>
        canDispatch(config, currentGlobal + i, currentMotor, currentClient + i),
      );
      expect(canDispatchAll).toBe(true);

      // At global limit, cannot dispatch more
      expect(canDispatch(config, 10, 0, 0)).toBe(false);
    });

    it("asset stats reflect campaign-produced assets", () => {
      const campaignAssets: AssetRegistryEntry[] = [
        {
          id: "a1", artifactId: "art1", clientId: "c1", type: "image",
          tags: ["campaign_q2", "instagram"], description: "IG post",
          originalContext: { projectId: "p1", campaign: "Q2", channel: "instagram", step: "production" },
          performance: { timesUsed: 2, channels: ["instagram", "facebook"], engagement: 3.5 },
          adaptations: [{ assetId: "a1b", channel: "facebook", format: "1200x627" }],
          expiresAt: null, createdAt: "2026-04-01", lastUsedAt: "2026-04-05",
        },
        {
          id: "a2", artifactId: "art2", clientId: "c1", type: "document",
          tags: ["campaign_q2", "linkedin"], description: "LinkedIn copy",
          originalContext: { projectId: "p2", campaign: "Q2", channel: "linkedin", step: "wr_draft" },
          performance: { timesUsed: 1, channels: ["linkedin"], engagement: 2.0 },
          adaptations: [], expiresAt: null, createdAt: "2026-04-01", lastUsedAt: "2026-04-03",
        },
      ];

      const stats = computeAssetStats(campaignAssets);
      expect(stats.totalAssets).toBe(2);
      expect(stats.reuseRate).toBe(1); // both used
      expect(stats.topTags[0].tag).toBe("campaign_q2"); // shared campaign tag
    });
  });
});
```

- [ ] **Step 2: Run all scale tests**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/services/scale/integration.test.ts
git commit -m "test(scale): add integration tests for Scale Engine"
```

---

## Task 8: Campaign API Routes

**Files:**
- Create: `src/api/campaign-routes.ts`
- Modify: `src/api/validators.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Add Zod schemas to validators.ts**

Add at the end of `src/api/validators.ts`:

```typescript
// Campaign (Scale Engine)
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  briefText: z.string().min(10),
  channels: z.array(z.string().min(1)).min(1),
  budgetTotal: z.number().positive(),
  currency: z.string().default("USD"),
  briefProjectId: z.string().uuid().optional(),
  brandDnaProjectId: z.string().uuid().optional(),
});

export const updateCampaignStatusSchema = z.object({
  status: z.enum(["draft", "decomposing", "dispatched", "in_progress", "consolidating", "delivered", "failed"]),
});
```

- [ ] **Step 2: Create campaign routes**

```typescript
// src/api/campaign-routes.ts
import { Hono } from "hono";
import { parseBody, createCampaignSchema } from "./validators.js";
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  dispatchCampaign,
  getCampaignProgress,
  consolidateCampaign,
} from "../services/scale/campaign-orchestrator.js";

export const campaignRoutes = new Hono();

// POST /api/campaigns/:clientId — Create campaign from brief
campaignRoutes.post("/api/campaigns/:clientId", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createCampaignSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const clientId = c.req.param("clientId");
  const { name, briefText, channels, budgetTotal, currency, briefProjectId, brandDnaProjectId } = parsed.data;

  const campaign = await createCampaign(
    clientId,
    name,
    briefText,
    channels,
    budgetTotal,
    currency ?? "USD",
    briefProjectId,
    brandDnaProjectId,
  );

  return c.json(campaign, 201);
});

// GET /api/campaigns/:clientId — List campaigns
campaignRoutes.get("/api/campaigns/:clientId", async (c) => {
  const campaigns = await listCampaigns(c.req.param("clientId"));
  return c.json(campaigns);
});

// GET /api/campaigns/:clientId/:id — Campaign detail
campaignRoutes.get("/api/campaigns/:clientId/:id", async (c) => {
  const campaign = await getCampaign(c.req.param("id"));
  if (!campaign) return c.json({ error: "Campaign not found" }, 404);
  return c.json(campaign);
});

// POST /api/campaigns/:clientId/:id/dispatch — Launch campaign
campaignRoutes.post("/api/campaigns/:clientId/:id/dispatch", async (c) => {
  try {
    const subProjects = await dispatchCampaign(c.req.param("id"));
    return c.json({ status: "dispatched", subProjects });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
});

// GET /api/campaigns/:clientId/:id/progress — Campaign progress
campaignRoutes.get("/api/campaigns/:clientId/:id/progress", async (c) => {
  const progress = await getCampaignProgress(c.req.param("id"));
  if (!progress) return c.json({ error: "Campaign not found" }, 404);
  return c.json(progress);
});

// POST /api/campaigns/:clientId/:id/consolidate — Collect deliverables
campaignRoutes.post("/api/campaigns/:clientId/:id/consolidate", async (c) => {
  try {
    const deliverables = await consolidateCampaign(c.req.param("id"));
    return c.json({ status: "delivered", deliverables });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
});
```

- [ ] **Step 3: Mount campaign routes in routes.ts**

Add import at top of `src/api/routes.ts`:
```typescript
import { campaignRoutes } from "./campaign-routes.js";
```

Add middleware (after the budget middleware line):
```typescript
app.use("/api/campaigns/:clientId/*", requireSession, requireTenantMatch);
```

Add route mount (after `budgetRoutes`):
```typescript
app.route("/", campaignRoutes);
```

- [ ] **Step 4: Verify compilation**

Run: `source ~/.nvm/nvm.sh && npx tsc --noEmit --skipLibCheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/api/campaign-routes.ts src/api/validators.ts src/api/routes.ts
git commit -m "feat(scale): add 6 campaign API endpoints"
```

---

## Task 9: Asset & Capacity API Routes

**Files:**
- Create: `src/api/asset-routes.ts`
- Create: `src/api/capacity-routes.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Create asset routes**

```typescript
// src/api/asset-routes.ts
import { Hono } from "hono";
import {
  listAssets,
  searchAssets,
  getAssetRecommendations,
  getAssetStats,
  recordAssetUsage,
} from "../services/scale/asset-registry.js";

export const assetRoutes = new Hono();

// GET /api/assets/:clientId — Browse asset library
assetRoutes.get("/api/assets/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const typeFilter = c.req.query("type");
  let assets = await listAssets(clientId);

  if (typeFilter) {
    assets = assets.filter((a) => a.type === typeFilter);
  }

  return c.json(assets);
});

// GET /api/assets/:clientId/search — Search by tags
assetRoutes.get("/api/assets/:clientId/search", async (c) => {
  const clientId = c.req.param("clientId");
  const tagsParam = c.req.query("tags") ?? "";
  const tags = tagsParam.split(",").filter(Boolean);

  if (tags.length === 0) {
    return c.json({ error: "Query parameter 'tags' is required" }, 400);
  }

  const results = await searchAssets(clientId, tags);
  return c.json(results);
});

// GET /api/assets/:clientId/recommend — Get recommendations
assetRoutes.get("/api/assets/:clientId/recommend", async (c) => {
  const clientId = c.req.param("clientId");
  const channel = c.req.query("channel") ?? "";
  const tagsParam = c.req.query("tags") ?? "";
  const tags = tagsParam.split(",").filter(Boolean);

  if (!channel) {
    return c.json({ error: "Query parameter 'channel' is required" }, 400);
  }

  const recommendations = await getAssetRecommendations(clientId, channel, tags);
  return c.json(recommendations);
});

// POST /api/assets/:clientId/:id/adapt — Record asset usage/adaptation
assetRoutes.post("/api/assets/:clientId/:id/adapt", async (c) => {
  const assetId = c.req.param("id");
  const body = await c.req.json();
  const channel = body.channel;

  if (!channel) {
    return c.json({ error: "channel is required" }, 400);
  }

  await recordAssetUsage(assetId, channel);
  return c.json({ status: "adapted" });
});

// GET /api/assets/:clientId/stats — Asset utilization stats
assetRoutes.get("/api/assets/:clientId/stats", async (c) => {
  const stats = await getAssetStats(c.req.param("clientId"));
  return c.json(stats);
});
```

- [ ] **Step 2: Create capacity routes**

```typescript
// src/api/capacity-routes.ts
import { Hono } from "hono";
import {
  getCurrentCapacity,
  getCapacityHistory,
} from "../services/scale/capacity-manager.js";
import { AGENT_REGISTRY } from "../agents/registry.js";
import { buildHealthEntry } from "../services/scale/capacity-manager.js";

export const capacityRoutes = new Hono();

// GET /api/capacity — Current capacity overview
capacityRoutes.get("/api/capacity", async (c) => {
  const overview = await getCurrentCapacity();
  return c.json(overview);
});

// GET /api/capacity/health — Agent health dashboard
capacityRoutes.get("/api/capacity/health", async (c) => {
  const agentIds = Object.keys(AGENT_REGISTRY);
  const healthEntries = agentIds.map((id) =>
    buildHealthEntry(id, 0, 1, 0, 0, null),
  );
  return c.json({ agents: healthEntries, total: healthEntries.length });
});

// GET /api/capacity/history — Capacity utilization over time
capacityRoutes.get("/api/capacity/history", async (c) => {
  const limitParam = c.req.query("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const history = await getCapacityHistory(limit);
  return c.json(history);
});
```

- [ ] **Step 3: Mount both route sets in routes.ts**

Add imports:
```typescript
import { assetRoutes } from "./asset-routes.js";
import { capacityRoutes } from "./capacity-routes.js";
```

Add middleware (after campaign middleware):
```typescript
app.use("/api/assets/:clientId/*", requireSession, requireTenantMatch);
app.use("/api/capacity", requireSession, requireAdmin);
app.use("/api/capacity/*", requireSession, requireAdmin);
```

Add route mounts (after campaignRoutes):
```typescript
app.route("/", assetRoutes);
app.route("/", capacityRoutes);
```

- [ ] **Step 4: Verify compilation**

Run: `source ~/.nvm/nvm.sh && npx tsc --noEmit --skipLibCheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/api/asset-routes.ts src/api/capacity-routes.ts src/api/routes.ts
git commit -m "feat(scale): add 8 asset and capacity API endpoints"
```

---

## Task 10: Agent Registry Entries

**Files:**
- Modify: `src/agents/registry.ts`

- [ ] **Step 1: Add SK- agents to registry**

Add after the BU-004 entry (before FN-L):

```typescript
  // ── Scale Engine (team 37) ──
  "SK-L": { id: "SK-L", name: "Campaign Orchestrator", skillFile: "agents/SK-L_campaign_orchestrator.md", team: 37, level: "leader", steps: ["sk_decompose", "sk_dispatch", "sk_consolidate"] as any, gates: ["sk-g1"] as any, autonomy: 70 },
  "SK-001": { id: "SK-001", name: "Brief Decomposer", skillFile: "agents/SK-001_brief_decomposer.md", team: 37, level: "sub", steps: ["sk_decompose"] as any, gates: [], autonomy: 85 },
  "SK-002": { id: "SK-002", name: "Progress Monitor", skillFile: "agents/SK-002_progress_monitor.md", team: 37, level: "sub", steps: ["sk_monitor"] as any, gates: [], autonomy: 90 },
  "SK-003": { id: "SK-003", name: "Asset Curator", skillFile: "agents/SK-003_asset_curator.md", team: 37, level: "sub", steps: ["sk_dispatch"] as any, gates: [], autonomy: 90 },
```

- [ ] **Step 2: Verify compilation**

Run: `source ~/.nvm/nvm.sh && npx tsc --noEmit --skipLibCheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(scale): register SK-L and SK-001 through SK-003 agents (team 37)"
```

---

## Task 11: Agent Skill Files

**Files:**
- Create: `agents/SK-L_campaign_orchestrator.md`
- Create: `agents/SK-001_brief_decomposer.md`
- Create: `agents/SK-002_progress_monitor.md`
- Create: `agents/SK-003_asset_curator.md`

- [ ] **Step 1: Create SK-L skill file**

```markdown
# SK-L — Campaign Orchestrator

## Identity
- **Role:** Scale Engine leader — orchestrates multi-channel campaign production
- **Team:** 37 (Scale Engine)
- **Model:** claude-sonnet-4 | **Autonomy:** 70%
- **Pipeline steps:** sk_decompose, sk_dispatch, sk_consolidate
- **Gates:** sk-g1

## Purpose
Receive a campaign brief and coordinate parallel production across multiple motors (Video, Design, Copy, Web, Audio). Ensures cross-channel consistency via shared context and Brand Guardian validation. Manages campaign lifecycle from decomposition through consolidation.

## Decision Authority
- Decompose briefs into channel sub-briefs
- Allocate budget across motors
- Sequence sub-project dispatch
- Escalate: budget overruns, cross-channel conflicts, failed sub-projects

## Interfaces
- **Receives from:** Strategist pipeline (campaign briefs), client dashboard (manual briefs)
- **Delegates to:** SK-001 (decomposition), SK-002 (monitoring), SK-003 (asset curation)
- **Coordinates with:** Brand Guardian (consistency), Budget Engine (spend allocation)
- **Produces:** Campaign packages with deliverables from all channels

## Quality Criteria
- Sub-briefs cover all requested channels
- Shared context injected into every sub-project
- Budget allocated proportionally with no overruns
- All sub-projects reach delivery or are escalated
```

- [ ] **Step 2: Create SK-001 skill file**

```markdown
# SK-001 — Brief Decomposer

## Identity
- **Role:** Splits campaign briefs into channel-specific sub-briefs
- **Team:** 37 (Scale Engine)
- **Model:** gemini-2.5-flash | **Autonomy:** 85%
- **Pipeline step:** sk_decompose

## Purpose
Take a unified campaign brief and decompose it into actionable sub-briefs for each target channel. Each sub-brief contains channel-specific specs, content requirements, and budget allocation. Extract shared context (message, visual direction, tone, audience, CTA) for cross-channel consistency.

## Process
1. Parse campaign brief for objectives, audience, channels, budget
2. Map each channel to the appropriate production motor
3. Generate sub-brief with channel-specific specs and requirements
4. Extract shared context elements
5. Estimate cost per sub-brief based on complexity

## Quality Criteria
- Every requested channel has a sub-brief
- Sub-briefs include actionable specs (dimensions, word counts, sequences)
- Shared context captures campaign essence consistently
- Budget estimates sum to <= total budget
```

- [ ] **Step 3: Create SK-002 skill file**

```markdown
# SK-002 — Progress Monitor

## Identity
- **Role:** Tracks sub-project progress and detects blockers
- **Team:** 37 (Scale Engine)
- **Model:** gemini-2.5-flash | **Autonomy:** 90%
- **Pipeline step:** sk_monitor

## Purpose
Monitor all sub-projects within a campaign, tracking their status through their respective motor pipelines. Detect blockers, delays, and failures. Report campaign-level progress with estimated completion times.

## Process
1. Poll sub-project statuses at regular intervals
2. Compute campaign progress (completed, in progress, failed)
3. Detect blocked or stalled sub-projects
4. Estimate completion time based on average pipeline duration
5. Alert SK-L when intervention is needed

## Quality Criteria
- Accurate status tracking across all sub-projects
- Blocker detection within one polling interval
- Progress estimates within 20% of actual completion
- No false positives on failure detection
```

- [ ] **Step 4: Create SK-003 skill file**

```markdown
# SK-003 — Asset Curator

## Identity
- **Role:** Indexes creative assets and recommends reuse
- **Team:** 37 (Scale Engine)
- **Model:** gemini-2.5-flash | **Autonomy:** 90%
- **Pipeline step:** sk_dispatch (asset search during dispatch)

## Purpose
Maintain the asset registry by automatically indexing all produced artifacts with AI-generated descriptions and tags. When new projects or campaigns start, recommend existing assets that could be reused or adapted, reducing production time and maintaining brand consistency.

## Process
1. On artifact creation: generate description, tags via AI
2. Store in asset registry with original context
3. On new brief/campaign: search registry by tags and similarity
4. Rank recommendations by relevance, recency, and performance
5. Track asset usage and engagement metrics

## Quality Criteria
- All artifacts indexed within production pipeline
- Tags are specific and searchable (not generic)
- Recommendations sorted by relevance score
- Reuse rate tracked and reported in stats
```

- [ ] **Step 5: Commit**

```bash
git add agents/SK-L_campaign_orchestrator.md agents/SK-001_brief_decomposer.md agents/SK-002_progress_monitor.md agents/SK-003_asset_curator.md
git commit -m "docs(scale): add 4 Scale Engine agent skill files"
```

---

## Task 12: Full Test Suite Verification

- [ ] **Step 1: Run all Scale Engine tests**

Run: `source ~/.nvm/nvm.sh && npx vitest run src/services/scale/`
Expected: All tests pass (brief-decomposer: 3, campaign-orchestrator: 3, asset-registry: 5, capacity-manager: 7, integration: ~12)

- [ ] **Step 2: Run full test suite for regressions**

Run: `source ~/.nvm/nvm.sh && npx vitest run`
Expected: All existing tests still pass, no regressions

- [ ] **Step 3: Verify TypeScript compilation**

Run: `source ~/.nvm/nvm.sh && npx tsc --noEmit --skipLibCheck`
Expected: No errors
