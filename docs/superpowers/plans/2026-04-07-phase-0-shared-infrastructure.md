# Phase 0: Shared Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared database tables, types, services, and middleware that all 8 engines depend on.

**Architecture:** Add new Drizzle schema tables for continuous agent runs, alerts, audit logging, and approvals. Create a `ContinuousAgentRunner` service that schedules and executes listener agents on cron. Add a stub provider factory that generates synthetic data via LLM for any external data interface. Enhance middleware with autonomy checks and tenant isolation.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL, node-cron, Vitest, Hono middleware

---

## File Structure

```
src/
├── shared/
│   └── engine-types.ts                  # CREATE — shared types for all engines
├── db/
│   └── schema.ts                        # MODIFY — add 6 new tables
├── services/
│   ├── continuous-agent-runner.ts        # CREATE — scheduler for continuous agents
│   └── stub-provider-factory.ts         # CREATE — LLM-based stub for any data interface
├── middleware/
│   ├── autonomy.ts                      # CREATE — autonomy check middleware
│   └── tenant-isolation.ts              # CREATE — enhanced tenant isolation
└── api/
    └── engine-routes.ts                 # CREATE — shared engine management endpoints
```

---

### Task 1: Shared Engine Types

**Files:**
- Create: `src/shared/engine-types.ts`
- Test: `src/shared/engine-types.test.ts`

- [ ] **Step 1: Create shared type definitions**

```typescript
// src/shared/engine-types.ts

// ── Continuous Agent Types ──

export interface ContinuousAgentCycle {
  id: string;
  clientId: string;
  agentId: string;
  listenerType: ListenerType;
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  artifactsProduced: string[];
  startedAt: string | null;
  completedAt: string | null;
  costUsd: number | null;
  error: string | null;
  cycleId: string;
}

export type ListenerType =
  | "brand"
  | "culture"
  | "industry"
  | "competitive"
  | "opportunity";

// ── Alert Types ──

export interface AlertRule {
  id: string;
  clientId: string;
  listenerType: ListenerType;
  ruleName: string;
  condition: AlertCondition;
  severity: "info" | "warning" | "critical";
  notificationChannels: string[];
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: "<" | ">" | "<=" | ">=" | "==" | "!=";
  value: number;
}

export interface Alert {
  id: string;
  clientId: string;
  alertRuleId: string | null;
  listenerType: ListenerType;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  context: Record<string, unknown> | null;
  status: "open" | "acknowledged" | "resolved" | "dismissed";
  resolvedAt: string | null;
}

// ── Data Source Config ──

export interface DataSourceConfig {
  clientId: string;
  listenerType: ListenerType;
  config: Record<string, unknown>;
  schedule: string; // cron expression
  enabled: boolean;
  lastRunAt: string | null;
}

// ── Autonomy Types ──

export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

export interface AutonomyConfig {
  clientId: string;
  globalLevel: AutonomyLevel;
  overrides: AutonomyOverride[];
  escalation: {
    autoEscalateAfter: number;
    escalateTo: string[];
    fallbackAction: "block" | "approve_with_flag";
  };
}

export interface AutonomyOverride {
  scope: {
    motor?: string;
    actionType?: string;
    budgetThreshold?: number;
  };
  level: AutonomyLevel;
  reason: string;
}

export interface ApprovalRequest {
  id: string;
  clientId: string;
  projectId: string | null;
  motor: string;
  actionType: string;
  description: string;
  context: Record<string, unknown>;
  urgency: "low" | "normal" | "high";
  status: "pending" | "approved" | "rejected" | "escalated" | "expired";
  expiresAt: string;
}

// ── Audit Types ──

export interface AuditEntry {
  clientId: string;
  actor: string;
  actorType: "agent" | "human" | "system";
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  autonomyLevel: AutonomyLevel | null;
  approvalId: string | null;
}

// ── Stub Provider Interface ──

export interface StubProviderConfig {
  providerType: string;
  prompt: string;
  outputSchema: string; // JSON schema description for LLM
}
```

- [ ] **Step 2: Write basic type validation test**

```typescript
// src/shared/engine-types.test.ts
import { describe, it, expect } from "vitest";
import type {
  ListenerType,
  AutonomyLevel,
  AlertCondition,
} from "./engine-types";

describe("engine-types", () => {
  it("ListenerType values are valid strings", () => {
    const types: ListenerType[] = [
      "brand", "culture", "industry", "competitive", "opportunity",
    ];
    expect(types).toHaveLength(5);
  });

  it("AutonomyLevel values are valid numbers", () => {
    const levels: AutonomyLevel[] = [1, 2, 3, 4, 5];
    expect(levels).toHaveLength(5);
    levels.forEach((l) => expect(l).toBeGreaterThanOrEqual(1));
    levels.forEach((l) => expect(l).toBeLessThanOrEqual(5));
  });

  it("AlertCondition structure is valid", () => {
    const condition: AlertCondition = {
      metric: "sentiment_score",
      operator: "<",
      value: 30,
    };
    expect(condition.metric).toBe("sentiment_score");
    expect(condition.operator).toBe("<");
    expect(condition.value).toBe(30);
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/shared/engine-types.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**

```bash
git add src/shared/engine-types.ts src/shared/engine-types.test.ts
git commit -m "feat: add shared type definitions for all engines"
```

---

### Task 2: Database Schema — New Tables

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add new enums to schema.ts**

Add after the existing enum definitions (after `invoiceStatusEnum`):

```typescript
export const listenerTypeEnum = pgEnum("listener_type", [
  "brand", "culture", "industry", "competitive", "opportunity",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info", "warning", "critical",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "open", "acknowledged", "resolved", "dismissed",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending", "approved", "rejected", "escalated", "expired",
]);

export const actorTypeEnum = pgEnum("actor_type", [
  "agent", "human", "system",
]);

export const continuousRunStatusEnum = pgEnum("continuous_run_status", [
  "pending", "running", "completed", "failed",
]);
```

- [ ] **Step 2: Add continuous_agent_runs table**

Add after the existing tables section:

```typescript
// ── Engine Infrastructure Tables ──

export const continuousAgentRuns = pgTable("continuous_agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  agentId: varchar("agent_id", { length: 20 }).notNull(),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  step: varchar("step", { length: 30 }).notNull(),
  status: continuousRunStatusEnum("status").default("pending").notNull(),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  artifactsProduced: jsonb("artifacts_produced").default([]),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 4 }),
  error: text("error"),
  cycleId: uuid("cycle_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("car_client_listener_idx").on(table.clientId, table.listenerType),
  index("car_cycle_idx").on(table.cycleId),
]);
```

- [ ] **Step 3: Add alert tables**

```typescript
export const alertRules = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  condition: jsonb("condition").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  notificationChannels: jsonb("notification_channels").default([]),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  alertRuleId: uuid("alert_rule_id").references(() => alertRules.id),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  context: jsonb("context"),
  status: alertStatusEnum("status").default("open").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("alerts_client_status_idx").on(table.clientId, table.status),
]);
```

- [ ] **Step 4: Add data source configs table**

```typescript
export const dataSourceConfigs = pgTable("data_source_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  listenerType: listenerTypeEnum("listener_type").notNull(),
  config: jsonb("config").notNull(),
  schedule: varchar("schedule", { length: 50 }).default("0 6 * * *").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 5: Add audit log table**

```typescript
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  actor: varchar("actor", { length: 100 }).notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),
  details: jsonb("details"),
  autonomyLevel: integer("autonomy_level"),
  approvalId: uuid("approval_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("audit_client_time_idx").on(table.clientId, table.timestamp),
  index("audit_action_idx").on(table.action),
]);
```

- [ ] **Step 6: Add approval requests table**

```typescript
export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  motor: varchar("motor", { length: 50 }).notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  context: jsonb("context").notNull(),
  urgency: varchar("urgency", { length: 10 }).default("normal").notNull(),
  status: approvalStatusEnum("status").default("pending").notNull(),
  respondedAt: timestamp("responded_at"),
  respondedBy: varchar("responded_by", { length: 100 }),
  responseNote: text("response_note"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("approval_pending_idx").on(table.clientId, table.status),
]);
```

- [ ] **Step 7: Add autonomy configs table**

```typescript
export const autonomyConfigs = pgTable("autonomy_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull().unique(),
  globalLevel: integer("global_level").default(3).notNull(),
  overrides: jsonb("overrides").default([]),
  escalation: jsonb("escalation").notNull(),
  schedule: jsonb("schedule"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 8: Generate and apply migration**

Run: `npm run db:generate`
Expected: Migration file generated in `src/db/migrations/`

Run: `npm run db:migrate`
Expected: Migration applied successfully

- [ ] **Step 9: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(db): add shared engine infrastructure tables"
```

---

### Task 3: ContinuousAgentRunner Service

**Files:**
- Create: `src/services/continuous-agent-runner.ts`
- Test: `src/services/continuous-agent-runner.test.ts`

- [ ] **Step 1: Write failing test for ContinuousAgentRunner**

```typescript
// src/services/continuous-agent-runner.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  classifyListenerSteps,
  buildCycleId,
  shouldRunListener,
} from "./continuous-agent-runner";

describe("ContinuousAgentRunner", () => {
  describe("classifyListenerSteps", () => {
    it("returns correct steps for brand listener", () => {
      const steps = classifyListenerSteps("brand");
      expect(steps).toEqual(["collect", "analyze", "report", "alert_eval"]);
    });

    it("returns correct steps for opportunity agent", () => {
      const steps = classifyListenerSteps("opportunity");
      expect(steps).toEqual(["aggregate", "evaluate", "generate", "prioritize"]);
    });

    it("returns 4 steps for all listener types", () => {
      const types = ["brand", "culture", "industry", "competitive", "opportunity"] as const;
      types.forEach((type) => {
        expect(classifyListenerSteps(type)).toHaveLength(4);
      });
    });
  });

  describe("buildCycleId", () => {
    it("returns a valid UUID-like string", () => {
      const id = buildCycleId();
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("returns unique IDs on successive calls", () => {
      const id1 = buildCycleId();
      const id2 = buildCycleId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("shouldRunListener", () => {
    it("returns true when lastRunAt is null (never ran)", () => {
      expect(shouldRunListener(null, "0 6 * * *")).toBe(true);
    });

    it("returns false when last run was recent (within schedule period)", () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      // Hourly schedule — 10 min ago = should NOT run
      expect(shouldRunListener(tenMinutesAgo, "0 * * * *")).toBe(false);
    });

    it("returns true when last run was long ago (past schedule period)", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      // Daily schedule — 2 days ago = should run
      expect(shouldRunListener(twoDaysAgo, "0 6 * * *")).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/continuous-agent-runner.test.ts`
Expected: FAIL — functions not found

- [ ] **Step 3: Implement ContinuousAgentRunner**

```typescript
// src/services/continuous-agent-runner.ts
import { randomUUID } from "crypto";
import type { ListenerType } from "@/shared/engine-types";

const LISTENER_STEPS: Record<ListenerType, string[]> = {
  brand: ["collect", "analyze", "report", "alert_eval"],
  culture: ["collect", "analyze", "report", "alert_eval"],
  industry: ["collect", "analyze", "report", "alert_eval"],
  competitive: ["collect", "analyze", "report", "alert_eval"],
  opportunity: ["aggregate", "evaluate", "generate", "prioritize"],
};

// Minimum interval between runs (in ms) by cron pattern heuristic
const CRON_MIN_INTERVALS: Record<string, number> = {
  "hourly": 50 * 60 * 1000,        // 50 minutes
  "daily": 20 * 60 * 60 * 1000,    // 20 hours
  "weekly": 5 * 24 * 60 * 60 * 1000, // 5 days
};

export function classifyListenerSteps(listenerType: ListenerType): string[] {
  return LISTENER_STEPS[listenerType];
}

export function buildCycleId(): string {
  return randomUUID();
}

export function shouldRunListener(
  lastRunAt: string | null,
  schedule: string,
): boolean {
  if (!lastRunAt) return true;

  const lastRun = new Date(lastRunAt).getTime();
  const now = Date.now();
  const elapsed = now - lastRun;

  // Parse cron to estimate minimum interval
  const minInterval = estimateMinInterval(schedule);
  return elapsed >= minInterval;
}

function estimateMinInterval(cron: string): number {
  const parts = cron.split(" ");
  if (parts.length !== 5) return CRON_MIN_INTERVALS["daily"];

  const [minute, hour, dom, month, dow] = parts;

  // Every N minutes
  if (minute.startsWith("*/")) {
    const n = parseInt(minute.slice(2));
    return (n - 1) * 60 * 1000;
  }

  // Specific minute, every hour
  if (hour === "*") return CRON_MIN_INTERVALS["hourly"];

  // Specific hour, specific day of week
  if (dow !== "*" && dow !== "?") return CRON_MIN_INTERVALS["weekly"];

  // Specific hour, every day
  return CRON_MIN_INTERVALS["daily"];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/continuous-agent-runner.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/continuous-agent-runner.ts src/services/continuous-agent-runner.test.ts
git commit -m "feat: add ContinuousAgentRunner core functions"
```

---

### Task 4: Stub Provider Factory

**Files:**
- Create: `src/services/stub-provider-factory.ts`
- Test: `src/services/stub-provider-factory.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/services/stub-provider-factory.test.ts
import { describe, it, expect, vi } from "vitest";
import { buildStubPrompt, parseStubResponse, StubProviderFactory } from "./stub-provider-factory";

describe("StubProviderFactory", () => {
  describe("buildStubPrompt", () => {
    it("builds a prompt with provider type and context", () => {
      const prompt = buildStubPrompt(
        "social_mentions",
        { brandName: "Criteria", industry: "marketing" },
        "Generate 5-10 realistic social media mentions",
      );
      expect(prompt).toContain("social_mentions");
      expect(prompt).toContain("Criteria");
      expect(prompt).toContain("marketing");
      expect(prompt).toContain("synthetic data");
    });
  });

  describe("parseStubResponse", () => {
    it("parses valid JSON from LLM response", () => {
      const response = '```json\n[{"text": "hello"}]\n```';
      const parsed = parseStubResponse(response);
      expect(parsed).toEqual([{ text: "hello" }]);
    });

    it("parses raw JSON without code fences", () => {
      const response = '[{"text": "hello"}]';
      const parsed = parseStubResponse(response);
      expect(parsed).toEqual([{ text: "hello" }]);
    });

    it("returns empty array for unparseable response", () => {
      const response = "This is not JSON at all";
      const parsed = parseStubResponse(response);
      expect(parsed).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/stub-provider-factory.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement StubProviderFactory**

```typescript
// src/services/stub-provider-factory.ts

export function buildStubPrompt(
  providerType: string,
  context: Record<string, unknown>,
  instruction: string,
): string {
  const contextStr = Object.entries(context)
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  return `You are a synthetic data generator for the "${providerType}" data provider.

Context:
${contextStr}

Instructions: ${instruction}

IMPORTANT: This is synthetic data — mark output as "synthetic data — no live monitoring active".

Respond with a JSON array. No explanation, just valid JSON.`;
}

export function parseStubResponse(response: string): unknown[] {
  // Try to extract JSON from code fences
  const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : response.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export class StubProviderFactory {
  private generateFn: (prompt: string) => Promise<string>;

  constructor(generateFn: (prompt: string) => Promise<string>) {
    this.generateFn = generateFn;
  }

  async fetch(
    providerType: string,
    context: Record<string, unknown>,
    instruction: string,
  ): Promise<unknown[]> {
    const prompt = buildStubPrompt(providerType, context, instruction);
    const response = await this.generateFn(prompt);
    return parseStubResponse(response);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/stub-provider-factory.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/stub-provider-factory.ts src/services/stub-provider-factory.test.ts
git commit -m "feat: add StubProviderFactory for synthetic data generation"
```

---

### Task 5: Audit Logger Service

**Files:**
- Create: `src/services/audit-logger.ts`
- Test: `src/services/audit-logger.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/services/audit-logger.test.ts
import { describe, it, expect, vi } from "vitest";
import { buildAuditEntry, formatAuditAction } from "./audit-logger";

describe("AuditLogger", () => {
  describe("buildAuditEntry", () => {
    it("creates a complete audit entry", () => {
      const entry = buildAuditEntry({
        clientId: "client-123",
        actor: "BL-001",
        actorType: "agent",
        action: "execute_listener",
        resourceType: "continuous_agent_run",
        resourceId: "run-456",
        details: { listenerType: "brand", step: "collect" },
        autonomyLevel: 3,
      });

      expect(entry.clientId).toBe("client-123");
      expect(entry.actor).toBe("BL-001");
      expect(entry.actorType).toBe("agent");
      expect(entry.action).toBe("execute_listener");
      expect(entry.details).toHaveProperty("listenerType", "brand");
    });

    it("handles optional fields", () => {
      const entry = buildAuditEntry({
        clientId: "client-123",
        actor: "system",
        actorType: "system",
        action: "schedule_run",
      });

      expect(entry.resourceType).toBeNull();
      expect(entry.resourceId).toBeNull();
      expect(entry.details).toBeNull();
      expect(entry.autonomyLevel).toBeNull();
    });
  });

  describe("formatAuditAction", () => {
    it("formats agent execution action", () => {
      expect(formatAuditAction("execute", "agent", "BL-001")).toBe(
        "agent.BL-001.execute",
      );
    });

    it("formats gate evaluation action", () => {
      expect(formatAuditAction("gate_pass", "gate", "g1")).toBe(
        "gate.g1.gate_pass",
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/audit-logger.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement AuditLogger**

```typescript
// src/services/audit-logger.ts
import type { AuditEntry } from "@/shared/engine-types";

interface BuildAuditParams {
  clientId: string;
  actor: string;
  actorType: "agent" | "human" | "system";
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  autonomyLevel?: number | null;
  approvalId?: string | null;
  ipAddress?: string | null;
}

export function buildAuditEntry(params: BuildAuditParams): AuditEntry {
  return {
    clientId: params.clientId,
    actor: params.actor,
    actorType: params.actorType,
    action: params.action,
    resourceType: params.resourceType ?? null,
    resourceId: params.resourceId ?? null,
    details: params.details ?? null,
    autonomyLevel: (params.autonomyLevel as 1 | 2 | 3 | 4 | 5) ?? null,
    approvalId: params.approvalId ?? null,
  };
}

export function formatAuditAction(
  verb: string,
  category: string,
  target: string,
): string {
  return `${category}.${target}.${verb}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/audit-logger.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/audit-logger.ts src/services/audit-logger.test.ts
git commit -m "feat: add audit logger service for cross-engine audit trail"
```

---

### Task 6: Autonomy Middleware

**Files:**
- Create: `src/middleware/autonomy.ts`
- Test: `src/middleware/autonomy.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/middleware/autonomy.test.ts
import { describe, it, expect } from "vitest";
import {
  classifyAction,
  resolveEffectiveLevel,
  requiresApproval,
} from "./autonomy";
import type { AutonomyConfig, AutonomyLevel } from "@/shared/engine-types";

describe("Autonomy", () => {
  const defaultConfig: AutonomyConfig = {
    clientId: "client-123",
    globalLevel: 3,
    overrides: [],
    escalation: {
      autoEscalateAfter: 24,
      escalateTo: ["admin@test.com"],
      fallbackAction: "block",
    },
  };

  describe("classifyAction", () => {
    it("classifies publish as external", () => {
      expect(classifyAction("publish_social_post")).toBe("publish");
    });

    it("classifies send_email as communicate", () => {
      expect(classifyAction("send_email")).toBe("communicate");
    });

    it("classifies analyze_data as internal", () => {
      expect(classifyAction("analyze_data")).toBe("internal");
    });

    it("classifies create_campaign_spend as spend", () => {
      expect(classifyAction("create_campaign_spend")).toBe("spend");
    });
  });

  describe("resolveEffectiveLevel", () => {
    it("returns global level when no overrides match", () => {
      const level = resolveEffectiveLevel(defaultConfig, "video-production", "internal");
      expect(level).toBe(3);
    });

    it("returns motor-specific override when matched", () => {
      const config: AutonomyConfig = {
        ...defaultConfig,
        overrides: [
          { scope: { motor: "community-management" }, level: 4, reason: "trusted" },
        ],
      };
      const level = resolveEffectiveLevel(config, "community-management", "publish");
      expect(level).toBe(4);
    });

    it("returns action-specific override when matched", () => {
      const config: AutonomyConfig = {
        ...defaultConfig,
        overrides: [
          { scope: { actionType: "spend" }, level: 2, reason: "careful with money" },
        ],
      };
      const level = resolveEffectiveLevel(config, "ads", "spend");
      expect(level).toBe(2);
    });
  });

  describe("requiresApproval", () => {
    it("level 1 requires approval for everything", () => {
      expect(requiresApproval(1, "internal")).toBe(true);
      expect(requiresApproval(1, "publish")).toBe(true);
    });

    it("level 2 allows internal, blocks external", () => {
      expect(requiresApproval(2, "internal")).toBe(false);
      expect(requiresApproval(2, "publish")).toBe(true);
      expect(requiresApproval(2, "communicate")).toBe(true);
    });

    it("level 3 allows internal + auto-pass gates, blocks publish/spend", () => {
      expect(requiresApproval(3, "internal")).toBe(false);
      expect(requiresApproval(3, "gate_pass")).toBe(false);
      expect(requiresApproval(3, "publish")).toBe(true);
      expect(requiresApproval(3, "spend")).toBe(true);
    });

    it("level 4 allows most actions, blocks high spend", () => {
      expect(requiresApproval(4, "internal")).toBe(false);
      expect(requiresApproval(4, "publish")).toBe(false);
      expect(requiresApproval(4, "communicate")).toBe(false);
      expect(requiresApproval(4, "spend")).toBe(true);
    });

    it("level 5 allows everything", () => {
      expect(requiresApproval(5, "internal")).toBe(false);
      expect(requiresApproval(5, "publish")).toBe(false);
      expect(requiresApproval(5, "spend")).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/middleware/autonomy.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement autonomy functions**

```typescript
// src/middleware/autonomy.ts
import type { AutonomyConfig, AutonomyLevel } from "@/shared/engine-types";

type ActionCategory = "internal" | "publish" | "communicate" | "spend" | "gate_pass";

const ACTION_PATTERNS: Array<{ pattern: RegExp; category: ActionCategory }> = [
  { pattern: /publish|post|schedule_content/, category: "publish" },
  { pattern: /send_email|send_message|notify/, category: "communicate" },
  { pattern: /spend|payment|budget|purchase/, category: "spend" },
  { pattern: /gate_pass|auto_approve/, category: "gate_pass" },
];

export function classifyAction(action: string): ActionCategory {
  for (const { pattern, category } of ACTION_PATTERNS) {
    if (pattern.test(action)) return category;
  }
  return "internal";
}

export function resolveEffectiveLevel(
  config: AutonomyConfig,
  motor: string,
  actionCategory: string,
): AutonomyLevel {
  // Check overrides from most specific to least specific
  for (const override of config.overrides) {
    const { scope } = override;

    // Motor + action match (most specific)
    if (scope.motor === motor && scope.actionType === actionCategory) {
      return override.level;
    }
  }

  for (const override of config.overrides) {
    const { scope } = override;

    // Action-only match
    if (!scope.motor && scope.actionType === actionCategory) {
      return override.level;
    }

    // Motor-only match
    if (scope.motor === motor && !scope.actionType) {
      return override.level;
    }
  }

  return config.globalLevel;
}

// Permission matrix: level → what requires approval
const APPROVAL_MATRIX: Record<AutonomyLevel, Set<ActionCategory>> = {
  1: new Set(["internal", "publish", "communicate", "spend", "gate_pass"]),
  2: new Set(["publish", "communicate", "spend"]),
  3: new Set(["publish", "communicate", "spend"]),
  4: new Set(["spend"]),
  5: new Set(),
};

export function requiresApproval(
  level: AutonomyLevel,
  actionCategory: ActionCategory,
): boolean {
  return APPROVAL_MATRIX[level].has(actionCategory);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/middleware/autonomy.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/middleware/autonomy.ts src/middleware/autonomy.test.ts
git commit -m "feat: add autonomy middleware with 5-level permission system"
```

---

### Task 7: Shared Engine API Routes

**Files:**
- Create: `src/api/engine-routes.ts`

- [ ] **Step 1: Create shared engine management routes**

```typescript
// src/api/engine-routes.ts
import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

const app = new Hono();

// ── Alert Rules ──

app.get("/alerts/rules/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const rules = await db
    .select()
    .from(schema.alertRules)
    .where(eq(schema.alertRules.clientId, clientId));
  return c.json(rules);
});

app.post("/alerts/rules/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const body = await c.req.json();
  const [rule] = await db
    .insert(schema.alertRules)
    .values({ clientId, ...body })
    .returning();
  return c.json(rule, 201);
});

// ── Alerts ──

app.get("/alerts/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const status = c.req.query("status") || "open";
  const alerts = await db
    .select()
    .from(schema.alerts)
    .where(
      and(
        eq(schema.alerts.clientId, clientId),
        eq(schema.alerts.status, status as "open" | "acknowledged" | "resolved" | "dismissed"),
      ),
    )
    .orderBy(desc(schema.alerts.createdAt))
    .limit(50);
  return c.json(alerts);
});

app.patch("/alerts/:clientId/:alertId", async (c) => {
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

// ── Approval Queue ──

app.get("/approvals/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const approvals = await db
    .select()
    .from(schema.approvalRequests)
    .where(
      and(
        eq(schema.approvalRequests.clientId, clientId),
        eq(schema.approvalRequests.status, "pending"),
      ),
    )
    .orderBy(desc(schema.approvalRequests.createdAt));
  return c.json(approvals);
});

app.post("/approvals/:clientId/:approvalId/respond", async (c) => {
  const { approvalId } = c.req.param();
  const body = await c.req.json();
  const [updated] = await db
    .update(schema.approvalRequests)
    .set({
      status: body.status,
      respondedAt: new Date(),
      respondedBy: body.respondedBy,
      responseNote: body.note,
    })
    .where(eq(schema.approvalRequests.id, approvalId))
    .returning();
  if (!updated) return c.json({ error: "Approval not found" }, 404);
  return c.json(updated);
});

// ── Audit Log ──

app.get("/audit/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "50");
  const entries = await db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.clientId, clientId))
    .orderBy(desc(schema.auditLog.timestamp))
    .limit(limit);
  return c.json(entries);
});

// ── Data Source Configs ──

app.get("/datasources/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  const configs = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(eq(schema.dataSourceConfigs.clientId, clientId));
  return c.json(configs);
});

app.put("/datasources/:clientId/:listenerType", async (c) => {
  const { clientId, listenerType } = c.req.param();
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(schema.dataSourceConfigs)
    .where(
      and(
        eq(schema.dataSourceConfigs.clientId, clientId),
        eq(schema.dataSourceConfigs.listenerType, listenerType as any),
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
      listenerType: listenerType as any,
      config: body.config,
      schedule: body.schedule || "0 6 * * *",
    })
    .returning();
  return c.json(created, 201);
});

export default app;
```

- [ ] **Step 2: Wire routes into main server**

In `src/api/routes.ts`, add the import and mount:

```typescript
import engineRoutes from "./engine-routes";
// ... existing imports

// Add after existing route mounts:
app.route("/api/engines", engineRoutes);
```

- [ ] **Step 3: Verify server starts**

Run: `npm run dev`
Expected: Server starts without errors on port 3000

- [ ] **Step 4: Commit**

```bash
git add src/api/engine-routes.ts src/api/routes.ts
git commit -m "feat(api): add shared engine management routes (alerts, approvals, audit, datasources)"
```

---

### Task 8: Run All Tests and Verify

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (existing + new)

- [ ] **Step 2: Verify migration applies on fresh database**

Run: `npm run db:generate && npm run db:migrate`
Expected: No errors

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any test or migration issues from phase 0"
```

---

## Summary

Phase 0 delivers:
- **6 new database tables:** continuous_agent_runs, alert_rules, alerts, data_source_configs, audit_log, approval_requests, autonomy_configs
- **Shared types:** All TypeScript interfaces used across engines (`src/shared/engine-types.ts`)
- **ContinuousAgentRunner:** Core functions for scheduling and running listener agents
- **StubProviderFactory:** Generic LLM-based stub for any external data interface
- **AuditLogger:** Cross-engine audit trail builder
- **Autonomy middleware:** 5-level permission system with override resolution
- **Engine API routes:** CRUD for alerts, approvals, audit log, data source configs

**Next:** Phase 1 — Intelligence Engine builds on this foundation to implement the 4 Listeners and Opportunity Agent.
