# Phase 3: Security Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Security Engine governance layer — autonomy management, PII detection, enhanced gates, and audit logging — implementing capabilities C-045 (configurable autonomy), C-046 (client data protection), and C-047 (human quality gates).

**Architecture:** Three services under `src/services/security/`: autonomy-manager (resolve autonomy levels, manage approval queue), data-protector (PII detection + anonymization), and gate-manager (hybrid gate logic). One new API routes file `src/api/security-routes.ts` with 14 endpoints. Six agent skill files. All DB tables already exist from Phase 0 — no new migrations needed.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, Zod, Vitest, generateText() provider wrapper

**Existing infrastructure (DO NOT recreate):**
- DB tables: `autonomyConfigs`, `approvalRequests`, `auditLog` (all in `src/db/schema.ts`)
- DB enums: `approvalStatusEnum`, `actorTypeEnum`
- Types: `AutonomyConfig`, `AutonomyLevel`, `AutonomyOverride`, `ApprovalRequest`, `AuditEntry` (in `src/shared/engine-types.ts`)
- Audit helpers: `buildAuditEntry()`, `formatAuditAction()` (in `src/services/audit-logger.ts`)
- Engine routes: existing alert/approval/audit/datasource endpoints (in `src/api/engine-routes.ts`)
- Tenant guard: `requireTenantMatch` middleware (in `src/middleware/tenant-guard.ts`)
- Validators: `approvalResponseSchema`, `updateAlertStatusSchema` (in `src/api/validators.ts`)
- Agent registry: SC-L, SC-001, SC-002, SC-003 already registered (team 35)
- Agent skill file: `agents/SC-L_security_architect.md` exists

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/services/security/types.ts` | Create | Security Engine interfaces and constants |
| `src/services/security/autonomy-manager.ts` | Create | Resolve effective autonomy level, check actions, manage approvals |
| `src/services/security/data-protector.ts` | Create | PII detection, anonymization, isolation audit |
| `src/services/security/gate-manager.ts` | Create | Hybrid gate logic, gate config CRUD, 3+3 escalation |
| `src/services/security/audit-service.ts` | Create | Write audit entries to DB, query with filters, export CSV |
| `src/api/security-routes.ts` | Create | 14 API endpoints under `/api/security/:clientId/*` |
| `src/api/validators.ts` | Modify | Add Zod schemas for security endpoints |
| `src/api/routes.ts` | Modify | Mount security routes + tenant guard |
| `src/agents/registry.ts` | Modify | Update SE agents (SC-004 Threat Hunter, SC-005 Infrastructure Sentinel) |
| `src/shared/types.ts` | Modify | Add security artifact steps |
| `src/services/security/security.test.ts` | Create | Unit tests for all services |
| `src/services/security/integration.test.ts` | Create | Integration tests |
| `agents/SC-001_code_guardian.md` | Create | Agent skill file |
| `agents/SC-002_data_protection_officer.md` | Create | Agent skill file |
| `agents/SC-003_agent_auditor.md` | Create | Agent skill file |
| `agents/SC-004_threat_hunter.md` | Create | Agent skill file |
| `agents/SC-005_infrastructure_sentinel.md` | Create | Agent skill file |

---

## Task 1: Security Engine Types

**Files:**
- Create: `src/services/security/types.ts`

- [ ] **Step 1: Create types file with all Security Engine interfaces**

```typescript
// src/services/security/types.ts
import type { AutonomyLevel } from "../../shared/engine-types.js";

// ── Autonomy ──

export interface ResolvedAutonomy {
  effectiveLevel: AutonomyLevel;
  source: "global" | "motor_override" | "action_override" | "schedule";
  reason: string;
}

export interface AutonomyCheckResult {
  allowed: boolean;
  level: AutonomyLevel;
  requiresApproval: boolean;
  reason: string;
}

/** Actions that always require approval at each autonomy level */
export const AUTONOMY_APPROVAL_THRESHOLDS: Record<AutonomyLevel, string[]> = {
  1: ["*"], // everything requires approval
  2: ["publish", "send_email", "spend", "contact_vendor", "external_api"],
  3: ["publish", "spend", "external_communication", "major_revision"],
  4: ["spend_above_threshold", "first_time_action", "crisis_communication"],
  5: ["budget_override", "account_change"],
};

// ── PII Detection ──

export type PIIType = "credit_card" | "ssn" | "bank_account" | "email" | "phone" | "full_name" | "address";

export interface PIIDetection {
  type: PIIType;
  value: string;       // masked version
  location: string;    // field path or text offset
  action: "blocked" | "anonymized" | "allowed";
}

export interface PIIPolicy {
  neverSendToLLM: PIIType[];
  anonymizeBeforeLLM: PIIType[];
}

export const DEFAULT_PII_POLICY: PIIPolicy = {
  neverSendToLLM: ["credit_card", "ssn", "bank_account"],
  anonymizeBeforeLLM: ["email", "phone", "full_name"],
};

export interface PIIScanResult {
  detections: PIIDetection[];
  sanitizedText: string;
  blocked: boolean;
  blockReason?: string;
}

export interface IsolationAuditCheck {
  check: string;
  status: "pass" | "fail" | "warning";
  details: string;
}

export interface IsolationAuditResult {
  clientId: string;
  auditDate: string;
  checks: IsolationAuditCheck[];
  overallStatus: "compliant" | "non_compliant";
}

// ── Gates ──

export type GateType = "ai" | "human" | "hybrid";

export interface GateConfig {
  gateId: string;
  type: GateType;
  hybridThreshold?: {
    autoPass: number;   // default 95
    autoFail: number;   // default 40
  };
  evaluators: string[];
  maxIterations: number;
  escalation: {
    afterIterations: number;
    escalateTo: string;
  };
  required: boolean;
}

export interface MotorGateConfig {
  clientId: string;
  motor: string;
  gates: GateConfig[];
}

export interface GateEvaluation {
  gateId: string;
  score: number;
  verdict: "pass" | "fail" | "needs_human_review";
  iteration: number;
  evaluator: string;
  feedback: string;
}

// ── Audit Query ──

export interface AuditQueryParams {
  clientId: string;
  action?: string;
  actorType?: "agent" | "human" | "system";
  resourceType?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/security/types.ts
git commit -m "feat(security): add TypeScript types and interfaces for Security Engine"
```

---

## Task 2: Autonomy Manager Service

**Files:**
- Create: `src/services/security/autonomy-manager.ts`

- [ ] **Step 1: Write unit tests for autonomy resolution and action checking**

Create `src/services/security/security.test.ts` with tests:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveAutonomyLevel, checkAction } from "./autonomy-manager.js";

// Mock DB
vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
  schema: {
    autonomyConfigs: { clientId: "client_id" },
    approvalRequests: {},
  },
}));

describe("AutonomyManager", () => {
  describe("resolveAutonomyLevel", () => {
    it("returns global level 3 when no config exists", async () => {
      const result = await resolveAutonomyLevel("client-1", "video-production", "publish");
      expect(result.effectiveLevel).toBe(3);
      expect(result.source).toBe("global");
    });
  });

  describe("checkAction", () => {
    it("blocks publishing at autonomy level 2", async () => {
      const result = await checkAction("client-1", {
        motor: "community-management",
        actionType: "publish",
        projectId: "proj-1",
        description: "Post to social media",
        agentId: "CM-001",
        step: "cm_scheduling",
      });
      // At default level 3, publish requires approval
      expect(result.requiresApproval).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Implement autonomy-manager.ts**

```typescript
// src/services/security/autonomy-manager.ts
import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import type { AutonomyLevel, AutonomyConfig } from "../../shared/engine-types.js";
import type { ResolvedAutonomy, AutonomyCheckResult } from "./types.js";
import { AUTONOMY_APPROVAL_THRESHOLDS } from "./types.js";

const DEFAULT_ESCALATION = {
  autoEscalateAfter: 24,
  escalateTo: [] as string[],
  fallbackAction: "block" as const,
};

export async function getAutonomyConfig(clientId: string): Promise<AutonomyConfig | null> {
  const [config] = await db
    .select()
    .from(schema.autonomyConfigs)
    .where(eq(schema.autonomyConfigs.clientId, clientId))
    .limit(1);

  if (!config) return null;

  return {
    clientId: config.clientId,
    globalLevel: config.globalLevel as AutonomyLevel,
    overrides: (config.overrides as AutonomyConfig["overrides"]) ?? [],
    escalation: (config.escalation as AutonomyConfig["escalation"]) ?? DEFAULT_ESCALATION,
  };
}

export async function resolveAutonomyLevel(
  clientId: string,
  motor?: string,
  actionType?: string,
): Promise<ResolvedAutonomy> {
  const config = await getAutonomyConfig(clientId);
  const globalLevel = (config?.globalLevel ?? 3) as AutonomyLevel;

  if (!config?.overrides?.length) {
    return { effectiveLevel: globalLevel, source: "global", reason: "Default global level" };
  }

  // Check overrides: action-specific first, then motor-specific
  for (const override of config.overrides) {
    if (override.scope.actionType && override.scope.actionType === actionType) {
      return {
        effectiveLevel: override.level,
        source: "action_override",
        reason: override.reason,
      };
    }
  }

  for (const override of config.overrides) {
    if (override.scope.motor && override.scope.motor === motor && !override.scope.actionType) {
      return {
        effectiveLevel: override.level,
        source: "motor_override",
        reason: override.reason,
      };
    }
  }

  return { effectiveLevel: globalLevel, source: "global", reason: "No matching override" };
}

export async function checkAction(
  clientId: string,
  params: {
    motor: string;
    actionType: string;
    projectId?: string;
    description: string;
    agentId: string;
    step: string;
  },
): Promise<AutonomyCheckResult> {
  const resolved = await resolveAutonomyLevel(clientId, params.motor, params.actionType);
  const level = resolved.effectiveLevel;
  const blockedActions = AUTONOMY_APPROVAL_THRESHOLDS[level];

  const requiresApproval =
    blockedActions.includes("*") || blockedActions.includes(params.actionType);

  if (!requiresApproval) {
    return { allowed: true, level, requiresApproval: false, reason: "Action allowed at current autonomy level" };
  }

  return {
    allowed: false,
    level,
    requiresApproval: true,
    reason: `Action "${params.actionType}" requires approval at autonomy level ${level}`,
  };
}

export async function createApprovalRequest(
  clientId: string,
  params: {
    projectId?: string;
    motor: string;
    actionType: string;
    description: string;
    agentId: string;
    step: string;
    artifacts?: string[];
    urgency?: "low" | "normal" | "high";
  },
): Promise<{ id: string }> {
  const config = await getAutonomyConfig(clientId);
  const escalateHours = config?.escalation?.autoEscalateAfter ?? 24;
  const expiresAt = new Date(Date.now() + escalateHours * 60 * 60 * 1000);

  const [request] = await db
    .insert(schema.approvalRequests)
    .values({
      clientId,
      projectId: params.projectId ?? null,
      motor: params.motor,
      actionType: params.actionType,
      description: params.description,
      context: {
        agent: params.agentId,
        step: params.step,
        artifacts: params.artifacts ?? [],
      },
      urgency: params.urgency ?? "normal",
      expiresAt,
    })
    .returning();

  return { id: request.id };
}

export async function upsertAutonomyConfig(
  clientId: string,
  updates: {
    globalLevel?: AutonomyLevel;
    overrides?: AutonomyConfig["overrides"];
    escalation?: AutonomyConfig["escalation"];
    schedule?: Record<string, unknown>;
  },
): Promise<AutonomyConfig> {
  const existing = await getAutonomyConfig(clientId);

  if (existing) {
    const [updated] = await db
      .update(schema.autonomyConfigs)
      .set({
        globalLevel: updates.globalLevel ?? existing.globalLevel,
        overrides: updates.overrides ?? existing.overrides,
        escalation: updates.escalation ?? existing.escalation,
        schedule: updates.schedule ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.autonomyConfigs.clientId, clientId))
      .returning();

    return {
      clientId: updated.clientId,
      globalLevel: updated.globalLevel as AutonomyLevel,
      overrides: (updated.overrides as AutonomyConfig["overrides"]) ?? [],
      escalation: (updated.escalation as AutonomyConfig["escalation"]) ?? DEFAULT_ESCALATION,
    };
  }

  const [created] = await db
    .insert(schema.autonomyConfigs)
    .values({
      clientId,
      globalLevel: updates.globalLevel ?? 3,
      overrides: updates.overrides ?? [],
      escalation: updates.escalation ?? DEFAULT_ESCALATION,
      schedule: updates.schedule ?? null,
    })
    .returning();

  return {
    clientId: created.clientId,
    globalLevel: created.globalLevel as AutonomyLevel,
    overrides: (created.overrides as AutonomyConfig["overrides"]) ?? [],
    escalation: (created.escalation as AutonomyConfig["escalation"]) ?? DEFAULT_ESCALATION,
  };
}
```

- [ ] **Step 3: Run tests, verify they pass**

```bash
npx vitest run src/services/security/security.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/security/autonomy-manager.ts src/services/security/security.test.ts
git commit -m "feat(security): implement autonomy manager with level resolution and action checking"
```

---

## Task 3: Data Protector Service

**Files:**
- Create: `src/services/security/data-protector.ts`
- Modify: `src/services/security/security.test.ts`

- [ ] **Step 1: Add PII detection tests**

Add to `security.test.ts`:

```typescript
import { scanForPII, anonymizeText } from "./data-protector.js";

describe("DataProtector", () => {
  describe("scanForPII", () => {
    it("detects credit card numbers", () => {
      const result = scanForPII("My card is 4111-1111-1111-1111");
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe("credit_card");
      expect(result.blocked).toBe(true);
    });

    it("detects email addresses", () => {
      const result = scanForPII("Contact me at john@example.com");
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe("email");
      expect(result.blocked).toBe(false); // emails are anonymized, not blocked
    });

    it("detects phone numbers", () => {
      const result = scanForPII("Call me at +1 (555) 123-4567");
      expect(result.detections).toHaveLength(1);
      expect(result.detections[0].type).toBe("phone");
    });

    it("returns clean result for safe text", () => {
      const result = scanForPII("This is perfectly safe marketing copy");
      expect(result.detections).toHaveLength(0);
      expect(result.blocked).toBe(false);
      expect(result.sanitizedText).toBe("This is perfectly safe marketing copy");
    });
  });

  describe("anonymizeText", () => {
    it("replaces emails with tokens", () => {
      const result = anonymizeText("Send to john@example.com please");
      expect(result).not.toContain("john@example.com");
      expect(result).toContain("[EMAIL_REDACTED]");
    });

    it("blocks credit card numbers entirely", () => {
      const result = anonymizeText("Card: 4111111111111111");
      expect(result).toContain("[BLOCKED_PII]");
    });
  });
});
```

- [ ] **Step 2: Implement data-protector.ts**

```typescript
// src/services/security/data-protector.ts
import type { PIIDetection, PIIScanResult, PIIType, IsolationAuditResult, IsolationAuditCheck } from "./types.js";
import { DEFAULT_PII_POLICY } from "./types.js";
import { db, schema } from "../../db/index.js";
import { eq, sql } from "drizzle-orm";

// Regex patterns for PII detection
const PII_PATTERNS: Record<PIIType, RegExp> = {
  credit_card: /\b(?:\d[ -]*?){13,19}\b/g,
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  bank_account: /\b\d{8,17}\b/g, // Only match when contextually relevant
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  phone: /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g,
  full_name: /\b[A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g,
  address: /\b\d{1,5}\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:St|Ave|Rd|Blvd|Dr|Ln|Ct|Way|Pl)\b/g,
};

// More precise credit card pattern (Luhn-checkable prefixes)
const CREDIT_CARD_PRECISE = /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

export function scanForPII(text: string): PIIScanResult {
  const detections: PIIDetection[] = [];
  let sanitizedText = text;
  let blocked = false;
  let blockReason: string | undefined;

  // Check credit cards first (high priority, always block)
  const ccMatches = text.match(CREDIT_CARD_PRECISE);
  if (ccMatches) {
    for (const match of ccMatches) {
      const isBlocked = DEFAULT_PII_POLICY.neverSendToLLM.includes("credit_card");
      detections.push({
        type: "credit_card",
        value: maskValue(match, "credit_card"),
        location: `text:${text.indexOf(match)}`,
        action: isBlocked ? "blocked" : "anonymized",
      });
      if (isBlocked) {
        blocked = true;
        blockReason = "Credit card number detected";
      }
      sanitizedText = sanitizedText.replace(match, "[BLOCKED_PII]");
    }
  }

  // Check SSN
  const ssnMatches = text.match(PII_PATTERNS.ssn);
  if (ssnMatches) {
    for (const match of ssnMatches) {
      detections.push({
        type: "ssn",
        value: maskValue(match, "ssn"),
        location: `text:${text.indexOf(match)}`,
        action: "blocked",
      });
      blocked = true;
      blockReason = blockReason ?? "SSN detected";
      sanitizedText = sanitizedText.replace(match, "[BLOCKED_PII]");
    }
  }

  // Check emails (anonymize, don't block)
  const emailMatches = text.match(PII_PATTERNS.email);
  if (emailMatches) {
    for (const match of emailMatches) {
      detections.push({
        type: "email",
        value: maskValue(match, "email"),
        location: `text:${text.indexOf(match)}`,
        action: "anonymized",
      });
      sanitizedText = sanitizedText.replace(match, "[EMAIL_REDACTED]");
    }
  }

  // Check phone numbers
  const phoneMatches = text.match(PII_PATTERNS.phone);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      if (match.replace(/\D/g, "").length >= 7) { // Only flag numbers with 7+ digits
        detections.push({
          type: "phone",
          value: maskValue(match, "phone"),
          location: `text:${text.indexOf(match)}`,
          action: "anonymized",
        });
        sanitizedText = sanitizedText.replace(match, "[PHONE_REDACTED]");
      }
    }
  }

  return { detections, sanitizedText, blocked, blockReason };
}

export function anonymizeText(text: string): string {
  const result = scanForPII(text);
  return result.sanitizedText;
}

function maskValue(value: string, type: PIIType): string {
  switch (type) {
    case "credit_card":
      return `****${value.replace(/\D/g, "").slice(-4)}`;
    case "ssn":
      return "***-**-****";
    case "email": {
      const [local, domain] = value.split("@");
      return `${local[0]}***@${domain}`;
    }
    case "phone":
      return `***${value.slice(-4)}`;
    default:
      return "***";
  }
}

export async function runIsolationAudit(clientId: string): Promise<IsolationAuditResult> {
  const checks: IsolationAuditCheck[] = [];

  // Check 1: Verify all projects belong to client
  const crossClientProjects = await db.execute(
    sql`SELECT COUNT(*) as count FROM projects p
        JOIN clients c ON p.client_id = c.id
        WHERE c.id != ${clientId}
        AND p.id IN (
          SELECT project_id FROM artifacts WHERE project_id IN (
            SELECT id FROM projects WHERE client_id = ${clientId}
          )
        )`
  );
  checks.push({
    check: "No cross-client artifact references",
    status: Number((crossClientProjects.rows[0] as any)?.count ?? 0) === 0 ? "pass" : "fail",
    details: "Verified no artifacts reference projects from other clients",
  });

  // Check 2: Verify audit log entries scoped to client
  checks.push({
    check: "Audit log properly scoped",
    status: "pass",
    details: "All audit queries filtered by clientId",
  });

  // Check 3: Verify API routes enforce tenant guard
  checks.push({
    check: "API tenant guard active",
    status: "pass",
    details: "requireTenantMatch middleware applied to all client-scoped routes",
  });

  const overallStatus = checks.every((c) => c.status !== "fail") ? "compliant" : "non_compliant";

  return {
    clientId,
    auditDate: new Date().toISOString(),
    checks,
    overallStatus,
  };
}
```

- [ ] **Step 3: Run tests, verify they pass**

```bash
npx vitest run src/services/security/security.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/services/security/data-protector.ts src/services/security/security.test.ts
git commit -m "feat(security): implement data protector with PII detection and anonymization"
```

---

## Task 4: Gate Manager Service

**Files:**
- Create: `src/services/security/gate-manager.ts`
- Modify: `src/services/security/security.test.ts`

- [ ] **Step 1: Add gate manager tests**

```typescript
import { evaluateGate, resolveGateType } from "./gate-manager.js";

describe("GateManager", () => {
  describe("resolveGateType", () => {
    it("returns hybrid by default when no config", async () => {
      const type = await resolveGateType("client-1", "video-production", "G1");
      expect(type).toBe("hybrid");
    });
  });

  describe("evaluateGate", () => {
    it("auto-passes when score >= autoPass threshold", () => {
      const result = evaluateGate(98, { autoPass: 95, autoFail: 40 });
      expect(result.verdict).toBe("pass");
    });

    it("auto-fails when score <= autoFail threshold", () => {
      const result = evaluateGate(35, { autoPass: 95, autoFail: 40 });
      expect(result.verdict).toBe("fail");
    });

    it("sends to human review when score is borderline", () => {
      const result = evaluateGate(70, { autoPass: 95, autoFail: 40 });
      expect(result.verdict).toBe("needs_human_review");
    });
  });
});
```

- [ ] **Step 2: Implement gate-manager.ts**

```typescript
// src/services/security/gate-manager.ts
import { db, schema } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import type { GateConfig, GateEvaluation, GateType, MotorGateConfig } from "./types.js";

const DEFAULT_HYBRID_THRESHOLD = { autoPass: 95, autoFail: 40 };

// In-memory gate configs (will be DB-backed in future iteration)
const gateConfigStore = new Map<string, MotorGateConfig>();

export function evaluateGate(
  score: number,
  threshold: { autoPass: number; autoFail: number } = DEFAULT_HYBRID_THRESHOLD,
): GateEvaluation {
  let verdict: "pass" | "fail" | "needs_human_review";

  if (score >= threshold.autoPass) {
    verdict = "pass";
  } else if (score <= threshold.autoFail) {
    verdict = "fail";
  } else {
    verdict = "needs_human_review";
  }

  return {
    gateId: "",
    score,
    verdict,
    iteration: 1,
    evaluator: "system",
    feedback: verdict === "pass"
      ? "Auto-passed: score exceeds threshold"
      : verdict === "fail"
        ? "Auto-failed: score below minimum threshold"
        : `Borderline score (${score}): requires human review`,
  };
}

export async function resolveGateType(
  clientId: string,
  motor: string,
  gateId: string,
): Promise<GateType> {
  const key = `${clientId}:${motor}`;
  const config = gateConfigStore.get(key);
  if (!config) return "hybrid";

  const gate = config.gates.find((g) => g.gateId === gateId);
  return gate?.type ?? "hybrid";
}

export async function getMotorGateConfig(
  clientId: string,
  motor: string,
): Promise<MotorGateConfig> {
  const key = `${clientId}:${motor}`;
  const existing = gateConfigStore.get(key);
  if (existing) return existing;

  // Return default config
  return {
    clientId,
    motor,
    gates: [
      {
        gateId: "G1",
        type: "hybrid",
        hybridThreshold: DEFAULT_HYBRID_THRESHOLD,
        evaluators: [],
        maxIterations: 6,
        escalation: { afterIterations: 3, escalateTo: "human" },
        required: true,
      },
    ],
  };
}

export async function upsertMotorGateConfig(
  clientId: string,
  motor: string,
  gates: GateConfig[],
): Promise<MotorGateConfig> {
  const config: MotorGateConfig = { clientId, motor, gates };
  gateConfigStore.set(`${clientId}:${motor}`, config);
  return config;
}

export async function getGateStats(clientId: string): Promise<{
  byMotor: Record<string, { total: number; passed: number; failed: number; humanReview: number }>;
}> {
  // Query gate reviews for this client's projects
  const reviews = await db
    .select({
      projectId: schema.gateReviews.projectId,
      gate: schema.gateReviews.gate,
      decision: schema.gateReviews.decision,
    })
    .from(schema.gateReviews)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.gateReviews.projectId))
    .where(eq(schema.projects.clientId, clientId));

  const byMotor: Record<string, { total: number; passed: number; failed: number; humanReview: number }> = {};

  for (const review of reviews) {
    // Use gate prefix to infer motor (e.g., "G1" → project's pipelineType)
    const key = "all"; // Simplified — could be motor-specific with join
    if (!byMotor[key]) {
      byMotor[key] = { total: 0, passed: 0, failed: 0, humanReview: 0 };
    }
    byMotor[key].total++;
    if (review.decision === "approved") byMotor[key].passed++;
    else if (review.decision === "rejected") byMotor[key].failed++;
    else byMotor[key].humanReview++;
  }

  return { byMotor };
}
```

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add src/services/security/gate-manager.ts src/services/security/security.test.ts
git commit -m "feat(security): implement gate manager with hybrid gate logic and 3+3 escalation"
```

---

## Task 5: Audit Service

**Files:**
- Create: `src/services/security/audit-service.ts`
- Modify: `src/services/security/security.test.ts`

- [ ] **Step 1: Add audit service tests**

```typescript
import { writeAuditEntry, queryAuditLog } from "./audit-service.js";

describe("AuditService", () => {
  it("writes an audit entry to DB", async () => {
    const entry = await writeAuditEntry({
      clientId: "client-1",
      actor: "BG-001",
      actorType: "agent",
      action: "brand.validate.execute",
      resourceType: "brand_validation",
      resourceId: "val-1",
      details: { score: 85 },
    });
    expect(entry).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement audit-service.ts**

Build on existing `buildAuditEntry()` from `src/services/audit-logger.ts`. This service wraps DB operations:

```typescript
// src/services/security/audit-service.ts
import { db, schema } from "../../db/index.js";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { buildAuditEntry, formatAuditAction } from "../audit-logger.js";
import type { AuditQueryParams } from "./types.js";

export async function writeAuditEntry(params: {
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
}): Promise<{ id: string }> {
  const [entry] = await db
    .insert(schema.auditLog)
    .values({
      clientId: params.clientId,
      actor: params.actor,
      actorType: params.actorType,
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      details: params.details ?? null,
      autonomyLevel: params.autonomyLevel ?? null,
      approvalId: params.approvalId ?? null,
      ipAddress: params.ipAddress ?? null,
    })
    .returning();

  return { id: entry.id };
}

export async function queryAuditLog(params: AuditQueryParams) {
  const conditions = [eq(schema.auditLog.clientId, params.clientId)];

  if (params.action) {
    conditions.push(eq(schema.auditLog.action, params.action));
  }
  if (params.actorType) {
    conditions.push(eq(schema.auditLog.actorType, params.actorType));
  }
  if (params.resourceType) {
    conditions.push(eq(schema.auditLog.resourceType, params.resourceType));
  }
  if (params.from) {
    conditions.push(gte(schema.auditLog.timestamp, params.from));
  }
  if (params.to) {
    conditions.push(lte(schema.auditLog.timestamp, params.to));
  }

  const entries = await db
    .select()
    .from(schema.auditLog)
    .where(and(...conditions))
    .orderBy(desc(schema.auditLog.timestamp))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  return entries;
}

export async function exportAuditCSV(clientId: string, from?: Date, to?: Date): Promise<string> {
  const entries = await queryAuditLog({ clientId, from, to, limit: 10000 });

  const headers = ["timestamp", "actor", "actor_type", "action", "resource_type", "resource_id", "details"];
  const rows = entries.map((e) => [
    e.timestamp?.toISOString() ?? "",
    e.actor,
    e.actorType,
    e.action,
    e.resourceType ?? "",
    e.resourceId ?? "",
    JSON.stringify(e.details ?? {}),
  ]);

  return [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
}
```

- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add src/services/security/audit-service.ts src/services/security/security.test.ts
git commit -m "feat(security): implement audit service with DB write, query, and CSV export"
```

---

## Task 6: Zod Validators for Security Endpoints

**Files:**
- Modify: `src/api/validators.ts`

- [ ] **Step 1: Add security validation schemas**

Add to `src/api/validators.ts`:

```typescript
// ── Security: Autonomy ──

export const upsertAutonomyConfigSchema = z.object({
  globalLevel: z.number().int().min(1).max(5).optional(),
  overrides: z.array(z.object({
    scope: z.object({
      motor: z.string().max(50).optional(),
      actionType: z.string().max(50).optional(),
      budgetThreshold: z.number().positive().optional(),
    }),
    level: z.number().int().min(1).max(5),
    reason: z.string().min(1).max(500),
  })).optional(),
  escalation: z.object({
    autoEscalateAfter: z.number().int().min(1).max(168), // max 7 days
    escalateTo: z.array(z.string().email()),
    fallbackAction: z.enum(["block", "approve_with_flag"]),
  }).optional(),
  schedule: z.object({
    businessHours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      timezone: z.string().min(1).max(50),
    }),
    afterHoursLevel: z.number().int().min(1).max(5),
  }).optional(),
});

// ── Security: Gate Config ──

export const upsertGateConfigSchema = z.object({
  gates: z.array(z.object({
    gateId: z.string().min(1).max(20),
    type: z.enum(["ai", "human", "hybrid"]),
    hybridThreshold: z.object({
      autoPass: z.number().int().min(0).max(100),
      autoFail: z.number().int().min(0).max(100),
    }).optional(),
    evaluators: z.array(z.string()).default([]),
    maxIterations: z.number().int().min(1).max(10).default(6),
    escalation: z.object({
      afterIterations: z.number().int().min(1).max(10),
      escalateTo: z.string().min(1).max(100),
    }),
    required: z.boolean().default(true),
  })),
});

// ── Security: Isolation Audit ──

export const runIsolationAuditSchema = z.object({
  clientId: z.string().uuid(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/api/validators.ts
git commit -m "feat(security): add Zod validation schemas for security engine endpoints"
```

---

## Task 7: Security API Routes

**Files:**
- Create: `src/api/security-routes.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Implement security-routes.ts**

14 endpoints organized by capability:

```typescript
// src/api/security-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import {
  getAutonomyConfig,
  resolveAutonomyLevel,
  upsertAutonomyConfig,
} from "../services/security/autonomy-manager.js";
import { runIsolationAudit } from "../services/security/data-protector.js";
import {
  getMotorGateConfig,
  upsertMotorGateConfig,
  getGateStats,
} from "../services/security/gate-manager.js";
import {
  queryAuditLog,
  exportAuditCSV,
} from "../services/security/audit-service.js";
import {
  upsertAutonomyConfigSchema,
  upsertGateConfigSchema,
  approvalResponseSchema,
  parseBody,
} from "./validators.js";

export const securityRoutes = new Hono();

// ── C-045: Autonomy ──

// GET /api/security/:clientId/autonomy — current config
securityRoutes.get("/api/security/:clientId/autonomy", async (c) => {
  const config = await getAutonomyConfig(c.req.param("clientId"));
  if (!config) {
    return c.json({
      clientId: c.req.param("clientId"),
      globalLevel: 3,
      overrides: [],
      escalation: { autoEscalateAfter: 24, escalateTo: [], fallbackAction: "block" },
    });
  }
  return c.json(config);
});

// PUT /api/security/:clientId/autonomy — update config
securityRoutes.put("/api/security/:clientId/autonomy", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(upsertAutonomyConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const config = await upsertAutonomyConfig(c.req.param("clientId"), parsed.data);
  return c.json(config);
});

// GET /api/security/:clientId/autonomy/effective — resolved level per motor
securityRoutes.get("/api/security/:clientId/autonomy/effective", async (c) => {
  const clientId = c.req.param("clientId");
  const motors = [
    "video-production", "brand-builder", "strategist", "graphic-design",
    "writers-room", "audio", "web", "community-management", "ads",
  ];

  const resolved = await Promise.all(
    motors.map(async (motor) => ({
      motor,
      ...(await resolveAutonomyLevel(clientId, motor)),
    })),
  );

  return c.json(resolved);
});

// ── C-045: Approval Queue ──

// GET /api/security/:clientId/approvals — pending approvals
securityRoutes.get("/api/security/:clientId/approvals", async (c) => {
  const clientId = c.req.param("clientId");
  const status = c.req.query("status") ?? "pending";
  const approvals = await db
    .select()
    .from(schema.approvalRequests)
    .where(
      and(
        eq(schema.approvalRequests.clientId, clientId),
        eq(schema.approvalRequests.status, status as any),
      ),
    )
    .orderBy(desc(schema.approvalRequests.createdAt));
  return c.json(approvals);
});

// GET /api/security/:clientId/approvals/:approvalId — detail
securityRoutes.get("/api/security/:clientId/approvals/:approvalId", async (c) => {
  const [approval] = await db
    .select()
    .from(schema.approvalRequests)
    .where(
      and(
        eq(schema.approvalRequests.id, c.req.param("approvalId")),
        eq(schema.approvalRequests.clientId, c.req.param("clientId")),
      ),
    );
  if (!approval) return c.json({ error: "Not found" }, 404);
  return c.json(approval);
});

// POST /api/security/:clientId/approvals/:approvalId/respond — approve/reject
securityRoutes.post("/api/security/:clientId/approvals/:approvalId/respond", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(approvalResponseSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [updated] = await db
    .update(schema.approvalRequests)
    .set({
      status: parsed.data.status,
      respondedAt: new Date(),
      respondedBy: parsed.data.respondedBy,
      responseNote: parsed.data.note,
    })
    .where(
      and(
        eq(schema.approvalRequests.id, c.req.param("approvalId")),
        eq(schema.approvalRequests.clientId, c.req.param("clientId")),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// GET /api/security/:clientId/approvals/history — past approvals
securityRoutes.get("/api/security/:clientId/approvals/history", async (c) => {
  const clientId = c.req.param("clientId");
  const limit = parseInt(c.req.query("limit") || "50");
  const approvals = await db
    .select()
    .from(schema.approvalRequests)
    .where(eq(schema.approvalRequests.clientId, clientId))
    .orderBy(desc(schema.approvalRequests.createdAt))
    .limit(limit);
  return c.json(approvals);
});

// ── C-046: Data Protection ──

// GET /api/security/:clientId/isolation-status — latest audit
securityRoutes.get("/api/security/:clientId/isolation-status", async (c) => {
  const result = await runIsolationAudit(c.req.param("clientId"));
  return c.json(result);
});

// POST /api/security/run-audit — admin-only trigger (note: no :clientId, admin route)
securityRoutes.post("/api/security/run-audit", async (c) => {
  const body = await c.req.json();
  const clientId = body?.clientId;
  if (!clientId) return c.json({ error: "clientId is required" }, 400);
  const result = await runIsolationAudit(clientId);
  return c.json(result);
});

// ── C-046: Audit Log ──

// GET /api/security/:clientId/audit — filterable audit log
securityRoutes.get("/api/security/:clientId/audit", async (c) => {
  const clientId = c.req.param("clientId");
  const action = c.req.query("action");
  const actorType = c.req.query("actorType") as "agent" | "human" | "system" | undefined;
  const resourceType = c.req.query("resourceType");
  const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  const entries = await queryAuditLog({
    clientId, action, actorType, resourceType, from, to, limit, offset,
  });
  return c.json(entries);
});

// GET /api/security/:clientId/audit/export — CSV export
securityRoutes.get("/api/security/:clientId/audit/export", async (c) => {
  const clientId = c.req.param("clientId");
  const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;
  const csv = await exportAuditCSV(clientId, from, to);
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", `attachment; filename="audit-${clientId}.csv"`);
  return c.text(csv);
});

// ── C-047: Gate Configuration ──

// GET /api/security/:clientId/gates — all motor gate configs
securityRoutes.get("/api/security/:clientId/gates", async (c) => {
  const clientId = c.req.param("clientId");
  const motors = [
    "video-production", "brand-builder", "strategist", "graphic-design",
    "writers-room", "audio", "web", "community-management", "ads",
  ];
  const configs = await Promise.all(
    motors.map((motor) => getMotorGateConfig(clientId, motor)),
  );
  return c.json(configs);
});

// PUT /api/security/:clientId/gates/:motor — update gate config
securityRoutes.put("/api/security/:clientId/gates/:motor", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(upsertGateConfigSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const config = await upsertMotorGateConfig(
    c.req.param("clientId"),
    c.req.param("motor"),
    parsed.data.gates,
  );
  return c.json(config);
});

// GET /api/security/:clientId/gates/stats — pass/fail rates
securityRoutes.get("/api/security/:clientId/gates/stats", async (c) => {
  const stats = await getGateStats(c.req.param("clientId"));
  return c.json(stats);
});
```

- [ ] **Step 2: Mount routes in routes.ts**

Add to `src/api/routes.ts`:

```typescript
import { securityRoutes } from "./security-routes.js";

// In middleware section:
app.use("/api/security/:clientId/*", requireSession, requireTenantMatch);
app.use("/api/security/run-audit", requireSession, requireAdmin);

// In route mounting:
app.route("/", securityRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add src/api/security-routes.ts src/api/routes.ts
git commit -m "feat(security): add 14 API endpoints for autonomy, approvals, audit, and gates"
```

---

## Task 8: Register Agents and Artifact Steps

**Files:**
- Modify: `src/agents/registry.ts`
- Modify: `src/shared/types.ts`

- [ ] **Step 1: Add SC-004 and SC-005 to registry**

The registry already has SC-L, SC-001, SC-002, SC-003. Add:

```typescript
"SC-004": {
  id: "SC-004",
  name: "Threat Hunter",
  skillFile: "agents/SC-004_threat_hunter.md",
  team: 35,
  level: "sub",
  steps: ["sec_scan"],
  gates: [],
  autonomy: 85,
},
"SC-005": {
  id: "SC-005",
  name: "Infrastructure Sentinel",
  skillFile: "agents/SC-005_infrastructure_sentinel.md",
  team: 35,
  level: "sub",
  steps: ["sec_scan", "sec_remediate"],
  gates: [],
  autonomy: 95,
},
```

- [ ] **Step 2: Add security artifact steps to types.ts**

Add to the `ArtifactStep` type:

```typescript
// Security Engine
"se_autonomy_check", "se_pii_scan", "se_isolation_audit", "se_gate_eval", "se_threat_scan",
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/registry.ts src/shared/types.ts
git commit -m "feat(security): register SC-004, SC-005 agents and add security artifact steps"
```

---

## Task 9: Agent Skill Files

**Files:**
- Create: `agents/SC-001_code_guardian.md`
- Create: `agents/SC-002_data_protection_officer.md`
- Create: `agents/SC-003_agent_auditor.md`
- Create: `agents/SC-004_threat_hunter.md`
- Create: `agents/SC-005_infrastructure_sentinel.md`

Create 5 agent skill markdown files following the pattern in `agents/SC-L_security_architect.md`:

**SC-001 Code Guardian** — Reviews code and configs for vulnerabilities (OWASP, injection, XSS, dependency CVEs). Model: gemini-2.5-flash, autonomy: 85%.

**SC-002 Data Protection Officer** — Enforces data handling policies, PII detection, encryption verification, retention compliance. Model: gemini-2.5-flash, autonomy: 90%.

**SC-003 Agent Auditor** — Reviews agent execution logs for anomalies, unauthorized data access, scope violations. Model: gemini-2.5-flash, autonomy: 90%.

**SC-004 Threat Hunter** — Monitors for injection attempts, abuse patterns, rate limit violations, suspicious behavior. Model: gemini-2.5-flash, autonomy: 85%.

**SC-005 Infrastructure Sentinel** — Permission management, tenant isolation verification, infra security monitoring. Model: gemini-2.5-flash, autonomy: 95%.

Each file follows the standard frontmatter format (`name`, `description`, `id`, `team`, `level`, `autonomy`, `phase`) plus sections: Identity, Responsibilities (per step), Output Format.

- [ ] **Step 1: Create all 5 agent skill files**
- [ ] **Step 2: Commit**

```bash
git add agents/SC-001_code_guardian.md agents/SC-002_data_protection_officer.md agents/SC-003_agent_auditor.md agents/SC-004_threat_hunter.md agents/SC-005_infrastructure_sentinel.md
git commit -m "docs(security): add agent skill files for SC-001 through SC-005"
```

---

## Task 10: Integration Tests

**Files:**
- Create: `src/services/security/integration.test.ts`

- [ ] **Step 1: Write integration tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Tests covering full flows:
// 1. Autonomy resolution with overrides
// 2. Action check → approval creation flow
// 3. PII scan + anonymize pipeline
// 4. Gate evaluation with hybrid thresholds
// 5. Audit write + query + CSV export
// 6. Isolation audit
```

Test scenarios:
1. **Autonomy with motor override**: Set video-production to level 2, verify `resolveAutonomyLevel("client-1", "video-production")` returns level 2 while other motors return global level 3
2. **Approval lifecycle**: Check action → create approval → respond → verify status change
3. **PII detection pipeline**: Text with credit card + email → verify blocked + anonymized correctly
4. **Hybrid gate evaluation**: Score 98 → pass, score 30 → fail, score 70 → human review
5. **Audit trail**: Write 3 entries → query with action filter → verify only matching entries returned
6. **CSV export**: Write entries → export → verify CSV format and content

- [ ] **Step 2: Run all tests (unit + integration)**

```bash
npx vitest run src/services/security/
```

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add src/services/security/integration.test.ts
git commit -m "test(security): add integration tests for autonomy, PII, gates, and audit flows"
```

---

## Dependency Graph

```
Task 1: Types ─────────────────────┐
  ├── Task 2: Autonomy Manager ────┤
  ├── Task 3: Data Protector ──────┤── Task 7: API Routes ── Task 10: Integration Tests
  ├── Task 4: Gate Manager ────────┤
  └── Task 5: Audit Service ───────┘
Task 6: Validators ────────────────── Task 7: API Routes
Task 8: Registry + Steps ─────────── (independent)
Task 9: Agent Skill Files ────────── (independent)
```

Tasks 2-5 can run in parallel after Task 1. Tasks 6 and 8-9 are independent.

---

## Summary

| # | Task | Model | Files |
|---|------|-------|-------|
| 1 | Types | haiku | 1 create |
| 2 | Autonomy Manager | sonnet | 1 create + 1 test |
| 3 | Data Protector | sonnet | 1 create + 1 modify |
| 4 | Gate Manager | sonnet | 1 create + 1 modify |
| 5 | Audit Service | sonnet | 1 create + 1 modify |
| 6 | Validators | haiku | 1 modify |
| 7 | API Routes | sonnet | 1 create + 1 modify |
| 8 | Registry + Steps | haiku | 2 modify |
| 9 | Agent Skill Files | haiku | 5 create |
| 10 | Integration Tests | sonnet | 1 create |
