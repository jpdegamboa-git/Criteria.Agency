# Phase 4: Sales Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Sales Engine (C-028–C-032) — lead management, scoring, pipeline, proposal generation, and attribution services with 26 API endpoints.

**Architecture:** Service module at `src/services/sales/` with 6 services + types. Stub enrichment provider. API routes at `src/api/sales-routes.ts`. DB additions for `lead_touchpoints`, `follow_ups`, `scoring_rules`. Existing `leads`, `deals`, `proposals` tables already in schema.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, Zod, Vitest, generateText() via provider registry

---

### Task 1: Sales Engine types and interfaces

**Files:**
- Create: `src/services/sales/types.ts`

Define all TypeScript interfaces and constants for the Sales Engine. These mirror the design spec types.

```typescript
// src/services/sales/types.ts

// ── Lead Enrichment Types ──

export interface CompanyData {
  name: string;
  domain: string;
  industry: string;
  employeeCount: number | null;
  annualRevenue: string | null;
  techStack: string[];
  socialProfiles: Record<string, string>;
  description: string;
  location: { country: string; city: string };
}

export interface ContactData {
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  seniority: "c-level" | "vp" | "director" | "manager" | "individual" | "unknown";
}

export interface LeadSource {
  channel: string;       // "waitlist", "landing_page", "ad_meta", "ad_google", "email", "social", "referral", "manual"
  campaign: string | null;
  medium: string | null;  // "paid", "organic", "referral", "direct"
  content: string | null;
  timestamp: string;
}

// ── Scoring Types ──

export interface LeadScore {
  total: number;           // 0-100
  components: {
    fit: number;           // 0-40
    intent: number;        // 0-30
    authority: number;     // 0-15
    timing: number;        // 0-15
  };
  tier: "hot" | "warm" | "cold" | "unqualified";
  reasoning: string;
  lastUpdated: string;
}

export type ScoreComponent = "fit" | "intent" | "authority" | "timing";

export const SCORE_CAPS: Record<ScoreComponent, number> = {
  fit: 40,
  intent: 30,
  authority: 15,
  timing: 15,
};

export const TIER_THRESHOLDS = {
  hot: 75,
  warm: 50,
  cold: 25,
} as const;

export function classifyTier(score: number): LeadScore["tier"] {
  if (score >= TIER_THRESHOLDS.hot) return "hot";
  if (score >= TIER_THRESHOLDS.warm) return "warm";
  if (score >= TIER_THRESHOLDS.cold) return "cold";
  return "unqualified";
}

// ── Pipeline Types ──

export type PipelineStage = "new" | "contacted" | "qualified" | "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export const STALE_THRESHOLDS: Record<string, number> = {
  new: 3,
  contacted: 5,
  qualified: 7,
  discovery: 10,
  proposal: 14,
  negotiation: 14,
};

// ── Follow-up Types ──

export type FollowUpType = "outreach" | "follow_up_1" | "follow_up_2" | "nurture" | "check_in";
export type FollowUpStatus = "scheduled" | "sent" | "opened" | "replied" | "bounced" | "cancelled";
export type FollowUpChannel = "email" | "sms" | "call";

// ── Attribution Types ──

export type AttributionModel = "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";

export interface Touchpoint {
  leadId: string;
  channel: string;
  campaign: string | null;
  content: string | null;
  medium: string;
  timestamp: string;
  interaction: string;   // "click", "view", "form_submit", "email_open", "page_visit"
}

export interface AttributionResult {
  dealId: string;
  dealValue: number;
  model: AttributionModel;
  attributions: Array<{
    touchpointId: string;
    channel: string;
    campaign: string | null;
    creditPercent: number;
    creditValue: number;
  }>;
  pathLength: number;
  timeToCloseDays: number;
}

// ── Enrichment Provider Interface ──

export interface LeadEnrichmentProvider {
  name: string;
  enrichCompany(domain: string): Promise<CompanyData>;
  enrichContact(email: string): Promise<ContactData>;
  isAvailable(): boolean;
}

// ── Proposal Types ──

export interface ProposalTemplate {
  executiveSummary: string;
  currentSituation: string;
  proposedSolution: string;
  timeline: string;
  investment: string;
  whyCriteria: string;
  nextSteps: string;
  terms: string;
}
```

- [ ] Create `src/services/sales/types.ts` with all interfaces and constants above
- [ ] Verify TypeScript compilation: `npx tsc --noEmit src/services/sales/types.ts`
- [ ] Commit: `feat(sales): add Sales Engine types and interfaces`

---

### Task 2: Database schema additions (lead_touchpoints, follow_ups, scoring_rules)

**Files:**
- Modify: `src/db/schema.ts` — add 3 new tables after existing `proposals` table (line ~809)

```typescript
// After proposals table (~line 809), add:

export const followUpStatusEnum = pgEnum("follow_up_status", [
  "scheduled", "sent", "opened", "replied", "bounced", "cancelled",
]);

export const leadTouchpoints = pgTable("lead_touchpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  campaign: varchar("campaign", { length: 200 }),
  content: varchar("content", { length: 200 }),
  medium: varchar("medium", { length: 50 }),
  interaction: varchar("interaction", { length: 50 }).notNull(),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("lead_touchpoints_lead_id_idx").on(table.leadId),
]);

export const followUps = pgTable("follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 30 }).notNull(),
  content: text("content"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
  status: followUpStatusEnum("status").default("scheduled").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("follow_ups_lead_id_idx").on(table.leadId),
  index("follow_ups_status_idx").on(table.status),
]);

export const scoringRules = pgTable("scoring_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  component: varchar("component", { length: 20 }).notNull(),
  signal: varchar("signal", { length: 100 }).notNull(),
  points: integer("points").notNull(),
  condition: jsonb("condition"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("scoring_rules_client_id_idx").on(table.clientId),
]);
```

- [ ] Add 3 new tables + enum to `src/db/schema.ts`
- [ ] Run `npm run db:generate` to create migration
- [ ] Verify no errors with `npx tsc --noEmit`
- [ ] Commit: `feat(sales): add lead_touchpoints, follow_ups, scoring_rules tables`

---

### Task 3: Stub enrichment provider

**Files:**
- Create: `src/providers/sales/stub-enrichment.ts`

LLM-based stub that generates plausible company/contact data. Follow the `StubProviderFactory` pattern from intelligence services.

```typescript
// src/providers/sales/stub-enrichment.ts

import { generateText } from "@/providers/generate-text.js";
import type { LeadEnrichmentProvider, CompanyData, ContactData } from "../../services/sales/types.js";

const MODEL = "gemini-2.5-flash";

export class StubEnrichmentProvider implements LeadEnrichmentProvider {
  name = "stub-enrichment";

  isAvailable(): boolean {
    return true;
  }

  async enrichCompany(domain: string): Promise<CompanyData> {
    const prompt = `Given the domain "${domain}", generate a plausible company profile as JSON with these exact fields:
- name (string), domain (string), industry (string), employeeCount (number or null),
- annualRevenue (string like "$1M-$5M" or null), techStack (string[]),
- socialProfiles (Record<string, string>), description (string),
- location ({ country: string, city: string })

Mark output as "[SYNTHETIC]" in description. Respond ONLY with valid JSON.`;

    const result = await generateText(
      MODEL,
      "You are a synthetic business data generator. Output realistic but clearly synthetic company profiles.",
      prompt,
    );

    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      return JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      return {
        name: domain.split(".")[0],
        domain,
        industry: "Technology",
        employeeCount: null,
        annualRevenue: null,
        techStack: [],
        socialProfiles: {},
        description: `[SYNTHETIC] Company at ${domain}`,
        location: { country: "Unknown", city: "Unknown" },
      };
    }
  }

  async enrichContact(email: string): Promise<ContactData> {
    const prompt = `Given the email "${email}", generate a plausible contact profile as JSON:
- fullName (string), jobTitle (string or null), department (string or null),
- linkedinUrl (string or null), phone (string or null),
- seniority ("c-level"|"vp"|"director"|"manager"|"individual"|"unknown")

Output synthetic but realistic data. Respond ONLY with valid JSON.`;

    const result = await generateText(
      MODEL,
      "You are a synthetic contact data generator.",
      prompt,
    );

    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      return JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      const namePart = email.split("@")[0].replace(/[._-]/g, " ");
      return {
        fullName: namePart,
        jobTitle: null,
        department: null,
        linkedinUrl: null,
        phone: null,
        seniority: "unknown",
      };
    }
  }
}
```

- [ ] Create `src/providers/sales/stub-enrichment.ts`
- [ ] Verify compilation: `npx tsc --noEmit`
- [ ] Commit: `feat(sales): add stub enrichment provider`

---

### Task 4: Lead manager service (C-028)

**Files:**
- Create: `src/services/sales/lead-manager.ts`
- Create: `src/services/sales/lead-manager.test.ts`

Handles lead capture, deduplication, enrichment. Uses DB for persistence, stub provider for enrichment.

**Key functions:**
- `createLead(clientId, data)` — insert lead, check for existing by email+clientId
- `getLeads(clientId, filters?)` — list with optional status/classification/search filters
- `getLeadById(clientId, leadId)` — single lead with touchpoints
- `updateLead(clientId, leadId, updates)` — partial update
- `enrichLead(leadId)` — call stub enrichment provider, update enrichmentData
- `bulkImportLeads(clientId, rows[])` — parse CSV rows, create/update leads, return stats
- `addTouchpoint(leadId, touchpoint)` — insert into lead_touchpoints
- `getLeadTouchpoints(leadId)` — list touchpoints ordered by timestamp

**Test file should cover:**
- createLead inserts and returns lead
- createLead with duplicate email returns existing (deduplication)
- getLeads filters by status
- getLeads filters by classification
- enrichLead updates enrichmentData
- addTouchpoint inserts and retrieves
- bulkImportLeads processes multiple rows

Use the same DB mock pattern as security tests (vi.mock drizzle, mock select/insert/update chains).

- [ ] Write tests in `src/services/sales/lead-manager.test.ts`
- [ ] Implement `src/services/sales/lead-manager.ts`
- [ ] Run tests: `npx vitest run src/services/sales/lead-manager.test.ts`
- [ ] Commit: `feat(sales): add lead manager service (C-028)`

---

### Task 5: Lead scorer service (C-029)

**Files:**
- Create: `src/services/sales/lead-scorer.ts`
- Create: `src/services/sales/lead-scorer.test.ts`

Implements BANT-based scoring with configurable rules per client.

**Key functions:**
- `scoreLead(clientId, leadData)` — compute score using rules from DB (or defaults)
- `getDefaultRules()` — returns default scoring rules matching design spec table
- `getScoringRules(clientId)` — fetch from scoring_rules table
- `upsertScoringRules(clientId, rules[])` — replace client's scoring rules
- `applyScoreDecay(clientId)` — reduce totalScore by 2 for leads with updatedAt > 7 days, cap at 0
- `rescoreLead(clientId, leadId)` — re-run scoring on a single lead and update DB

**Scoring logic:**
1. Load client's scoring rules (or defaults)
2. For each component (fit, intent, authority, timing): sum matching rule points, cap at component max
3. Total = sum of all components (already capped individually)
4. Classify tier using `classifyTier()` from types
5. Use generateText() to produce reasoning string explaining the score
6. Update lead's fitScore, intentScore, bantScore, totalScore, classification in DB

**Test file should cover:**
- scoreLead with hot lead data → tier "hot", score ≥75
- scoreLead with cold lead data → tier "cold" or "unqualified"
- Component capping (fit max 40 even with signals totaling 50)
- getDefaultRules returns all expected rules
- applyScoreDecay reduces scores for stale leads
- classifyTier boundary tests (75=hot, 74=warm, 50=warm, 49=cold, 25=cold, 24=unqualified)

- [ ] Write tests in `src/services/sales/lead-scorer.test.ts`
- [ ] Implement `src/services/sales/lead-scorer.ts`
- [ ] Run tests: `npx vitest run src/services/sales/lead-scorer.test.ts`
- [ ] Commit: `feat(sales): add lead scorer service (C-029)`

---

### Task 6: Pipeline manager service (C-030)

**Files:**
- Create: `src/services/sales/pipeline-manager.ts`
- Create: `src/services/sales/pipeline-manager.test.ts`

Manages deal pipeline stages, stale detection, and pipeline metrics.

**Key functions:**
- `createDeal(clientId, leadId, data)` — create deal from qualified lead
- `getDeals(clientId, filters?)` — list deals with optional stage filter
- `getDealById(clientId, dealId)` — single deal with lead info
- `updateDeal(clientId, dealId, updates)` — update stage, value, probability, notes
- `getPipelineKanban(clientId)` — deals grouped by stage with counts and total values
- `getPipelineMetrics(clientId)` — velocity, conversion rates, average deal value, stale count
- `checkStaleDeal(deal)` — returns true if deal's updatedAt exceeds STALE_THRESHOLDS for its stage
- `getStaleDealsList(clientId)` — all deals past stale threshold

**Test file should cover:**
- createDeal inserts and returns deal
- updateDeal changes stage
- getPipelineKanban groups correctly
- checkStaleDeal detects stale deals correctly
- getPipelineMetrics returns expected shape

- [ ] Write tests in `src/services/sales/pipeline-manager.test.ts`
- [ ] Implement `src/services/sales/pipeline-manager.ts`
- [ ] Run tests: `npx vitest run src/services/sales/pipeline-manager.test.ts`
- [ ] Commit: `feat(sales): add pipeline manager service (C-030)`

---

### Task 7: Follow-up engine service

**Files:**
- Create: `src/services/sales/follow-up-engine.ts`
- Create: `src/services/sales/follow-up-engine.test.ts`

Manages automated follow-up scheduling and tracking.

**Key functions:**
- `scheduleFollowUp(params)` — create follow_up record with scheduledFor
- `getUpcomingFollowUps(clientId)` — scheduled follow-ups ordered by scheduledFor
- `getDueFollowUps()` — all follow-ups with scheduledFor <= now and status "scheduled"
- `markFollowUpStatus(followUpId, status, timestamp?)` — update status (sent, opened, replied, cancelled)
- `cancelFollowUpsForLead(leadId)` — cancel all scheduled follow-ups for a lead (when stage changes)

**Test file should cover:**
- scheduleFollowUp creates record with correct scheduledFor
- getUpcomingFollowUps returns only future scheduled items for client
- getDueFollowUps returns items past scheduledFor
- markFollowUpStatus updates correctly
- cancelFollowUpsForLead cancels multiple

- [ ] Write tests in `src/services/sales/follow-up-engine.test.ts`
- [ ] Implement `src/services/sales/follow-up-engine.ts`
- [ ] Run tests: `npx vitest run src/services/sales/follow-up-engine.test.ts`
- [ ] Commit: `feat(sales): add follow-up engine service`

---

### Task 8: Attribution engine service (C-032)

**Files:**
- Create: `src/services/sales/attribution-engine.ts`
- Create: `src/services/sales/attribution-engine.test.ts`

Implements 5 attribution models: first-touch, last-touch, linear, time-decay, position-based.

**Key functions:**
- `calculateAttribution(dealId, model)` — compute attribution for one deal using specified model
- `getAttributionByChannel(clientId, model?)` — aggregate attribution across all won deals by channel
- `getAttributionByCampaign(clientId, model?)` — aggregate by campaign
- `recalculateAllAttribution(clientId)` — re-run attribution for all won deals

**Attribution model logic (pure functions):**
- `firstTouch(touchpoints, dealValue)` — 100% to first touchpoint
- `lastTouch(touchpoints, dealValue)` — 100% to last touchpoint
- `linearAttribution(touchpoints, dealValue)` — equal split
- `timeDecay(touchpoints, dealValue)` — 7-day half-life from deal close date
- `positionBased(touchpoints, dealValue)` — 40% first, 40% last, 20% distributed middle

**Test file should cover:**
- Each model with 5 touchpoints → verify credit distribution sums to 100%
- firstTouch gives 100% to earliest touchpoint
- lastTouch gives 100% to latest touchpoint
- linearAttribution gives 20% each for 5 touchpoints
- timeDecay gives more to recent touchpoints
- positionBased gives 40/20-split/40 pattern
- Single touchpoint → 100% regardless of model
- Empty touchpoints → empty attributions array

- [ ] Write tests in `src/services/sales/attribution-engine.test.ts`
- [ ] Implement `src/services/sales/attribution-engine.ts`
- [ ] Run tests: `npx vitest run src/services/sales/attribution-engine.test.ts`
- [ ] Commit: `feat(sales): add attribution engine service (C-032)`

---

### Task 9: Proposal generator service (C-031)

**Files:**
- Create: `src/services/sales/proposal-generator.ts`
- Create: `src/services/sales/proposal-generator.test.ts`

Generates commercial proposals from deal discovery data using LLM.

**Key functions:**
- `createProposal(clientId, dealId)` — create proposal record, generate content via LLM
- `getProposals(clientId)` — list proposals with deal info
- `getProposalById(clientId, proposalId)` — single proposal detail
- `generateProposalContent(deal, lead, brandDna?)` — LLM generates proposal sections using ProposalTemplate structure

**LLM prompt structure:**
- System: "You are a senior sales proposal writer for a creative marketing agency."
- User: Template with discovery notes, client info, enrichment data, brand DNA if available
- Output: JSON matching ProposalTemplate interface

**Test file should cover:**
- createProposal inserts record with version 1, status "draft"
- generateProposalContent returns all template sections
- getProposals returns proposals for client
- getProposalById returns single proposal

- [ ] Write tests in `src/services/sales/proposal-generator.test.ts`
- [ ] Implement `src/services/sales/proposal-generator.ts`
- [ ] Run tests: `npx vitest run src/services/sales/proposal-generator.test.ts`
- [ ] Commit: `feat(sales): add proposal generator service (C-031)`

---

### Task 10: Zod validators for sales endpoints

**Files:**
- Modify: `src/api/validators.ts` — add sales-specific schemas after existing security schemas

```typescript
// ── Sales: Leads ──

export const createLeadSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  source: z.string().min(1).max(50),
  sourceDetail: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(["new", "enriched", "scored", "qualified", "nurturing", "proposal", "negotiation", "won", "lost"]).optional(),
  notes: z.string().max(2000).optional(),
  assignedTo: z.string().max(50).optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field is required" });

export const bulkImportLeadsSchema = z.object({
  leads: z.array(z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    company: z.string().max(255).optional(),
    title: z.string().max(255).optional(),
    phone: z.string().max(50).optional(),
    source: z.string().max(50).default("import"),
  })).min(1).max(1000),
});

// ── Sales: Deals ──

export const updateDealSchema = z.object({
  stage: z.enum(["qualification", "nurture", "proposal", "negotiation", "closing", "won", "lost"]).optional(),
  value: z.string().regex(/^\d+(\.\d{1,2})?$/).or(z.number().positive().transform(String)).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  lostReason: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field is required" });

export const createDealProposalSchema = z.object({
  discoveryNotes: z.string().min(1).max(10000).optional(),
});

// ── Sales: Follow-ups ──

export const updateFollowUpSchema = z.object({
  status: z.enum(["sent", "opened", "replied", "cancelled"]),
});

// ── Sales: Scoring Rules ──

export const upsertScoringRulesSchema = z.object({
  rules: z.array(z.object({
    component: z.enum(["fit", "intent", "authority", "timing"]),
    signal: z.string().min(1).max(100),
    points: z.number().int().min(-50).max(50),
    condition: z.record(z.unknown()).optional(),
    enabled: z.boolean().default(true),
  })).min(1),
});
```

- [ ] Add all sales Zod schemas to `src/api/validators.ts`
- [ ] Verify compilation: `npx tsc --noEmit`
- [ ] Commit: `feat(sales): add Zod validators for sales endpoints`

---

### Task 11: Sales API routes (26 endpoints)

**Files:**
- Create: `src/api/sales-routes.ts`
- Modify: `src/api/routes.ts` — import and mount sales routes

Implements all 26 API endpoints from the design spec. Group by capability:

**Lead management (C-028):**
- `GET /api/sales/:clientId/leads` — list leads with filters (status, classification, search)
- `POST /api/sales/:clientId/leads` — create lead
- `GET /api/sales/:clientId/leads/:leadId` — lead detail with touchpoints
- `PATCH /api/sales/:clientId/leads/:leadId` — update lead
- `POST /api/sales/:clientId/leads/:leadId/rescore` — trigger re-scoring
- `POST /api/sales/:clientId/leads/import` — bulk import

**Pipeline (C-030):**
- `GET /api/sales/:clientId/pipeline` — kanban view
- `GET /api/sales/:clientId/pipeline/metrics` — pipeline metrics
- `PATCH /api/sales/:clientId/deals/:dealId` — update deal
- `POST /api/sales/:clientId/deals/:dealId/proposal` — create proposal from deal

**Proposals (C-031):**
- `GET /api/sales/:clientId/proposals` — list proposals
- `GET /api/sales/:clientId/proposals/:proposalId` — proposal detail

**Attribution (C-032):**
- `GET /api/sales/:clientId/attribution` — attribution report (query param: model)
- `GET /api/sales/:clientId/attribution/by-channel` — by channel
- `GET /api/sales/:clientId/attribution/by-campaign` — by campaign

**Follow-ups:**
- `GET /api/sales/:clientId/follow-ups` — upcoming follow-ups
- `PATCH /api/sales/:clientId/follow-ups/:followUpId` — update status

**Configuration (C-029):**
- `GET /api/sales/:clientId/scoring-rules` — get scoring rules
- `PUT /api/sales/:clientId/scoring-rules` — update scoring rules

**routes.ts changes:**
- Add import: `import { salesRoutes } from "./sales-routes.js";`
- Add middleware: `app.use("/api/sales/:clientId/*", requireSession, requireTenantMatch);`
- Add mount: `app.route("/", salesRoutes);`

- [ ] Create `src/api/sales-routes.ts` with all 19 endpoints (some spec endpoints like proposals/:projectId map to existing project routes)
- [ ] Update `src/api/routes.ts` with import, middleware, and mount
- [ ] Verify compilation: `npx tsc --noEmit`
- [ ] Commit: `feat(sales): add sales API routes (26 endpoints)`

---

### Task 12: Integration tests

**Files:**
- Create: `src/services/sales/integration.test.ts`

Integration tests that verify cross-service flows:

**Test scenarios:**
1. **Lead lifecycle:** Create lead → enrich → score → classify → verify tier
2. **Pipeline flow:** Create lead → score as hot → create deal → advance stages → close won
3. **Attribution with 5 touchpoints:** Create lead with touchpoints → close deal → run all 5 models → verify credit sums to 100%
4. **Score decay:** Create lead with score → mark as old → run decay → verify reduced
5. **Follow-up scheduling:** Create lead → schedule follow-up → verify getDueFollowUps returns it after time
6. **Deduplication:** Create lead → create same email → verify returns existing
7. **Scoring rules customization:** Set custom rules → score lead → verify custom rules applied
8. **Proposal creation:** Create deal → generate proposal → verify proposal in DB with version 1

- [ ] Write integration tests in `src/services/sales/integration.test.ts`
- [ ] Run all sales tests: `npx vitest run src/services/sales/`
- [ ] Run full test suite: `npx vitest run` to verify no regressions
- [ ] Commit: `test(sales): add integration tests for Sales Engine`
