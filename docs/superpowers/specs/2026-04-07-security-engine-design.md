# criteria.agency — Security & Control Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Security capabilities (C-045 to C-047): Configurable Autonomy, Customer Data Protection, Quality Gates (human review system)

---

## 1. Objective

Build the **Security Engine** — a cross-cutting governance layer that ensures AI actions are controlled, client data is protected, and human oversight is maintained at critical points. Unlike other motors, the Security Engine doesn't produce content — it **governs** all other motors.

| Capability | What it delivers |
|-----------|-----------------|
| C-045: Autonomía configurable | Per-motor, per-client control over what AI can do autonomously vs what requires approval |
| C-046: Protección de datos de clientes | Multi-tenancy, data isolation, encryption, audit trails, compliance |
| C-047: Gates de calidad humanos | Configurable human review points across all motors with escalation rules |

**Dependency:** Touches ALL motors. Must be implemented alongside or before any motor goes to production with real clients.

---

## 2. Architecture

### Security as middleware

The Security Engine operates at 3 layers:

```
[Request] → [Auth + Tenant Isolation] → [Autonomy Check] → [Motor Execution] → [Gate Check] → [Audit Log]
```

| Layer | What it does | When |
|-------|-------------|------|
| **Auth + Isolation** | Validates identity, enforces tenant boundaries | Every API request |
| **Autonomy Check** | Verifies if action requires human approval | Before every agent execution and publication |
| **Gate + Audit** | Records decisions, enforces review points | After every gate evaluation and significant action |

---

## 3. Agents

| ID | Name | Level | Role | Model | Autonomy |
|----|------|-------|------|-------|----------|
| SE-L | Security Architect | leader | Policy decisions, incident response, compliance reviews | claude-sonnet-4 | 65% |
| SE-001 | Code Guardian | sub | Code and configuration security review | gemini-2.5-flash | 85% |
| SE-002 | Data Protection Officer | sub | Data handling compliance, PII detection, isolation verification | gemini-2.5-flash | 90% |
| SE-003 | Agent Auditor | sub | Reviews agent execution logs for anomalies, unauthorized actions | gemini-2.5-flash | 90% |
| SE-004 | Threat Hunter | sub | Monitors for security threats, injection attempts, abuse patterns | gemini-2.5-flash | 85% |
| SE-005 | Infrastructure Sentinel | sub | Permission management, tenant isolation, infrastructure security | gemini-2.5-flash | 95% |

---

## 4. Configurable Autonomy (C-045)

### Autonomy levels

| Level | Name | What AI can do | What requires human approval |
|-------|------|---------------|----------------------------|
| **1** | Full Control | Nothing autonomous — every action needs approval | Everything |
| **2** | Conservative | Internal processing (analysis, drafts) | All external actions (publish, send, spend, contact) |
| **3** | Balanced (default) | Internal processing + auto-pass gates that score >95 | Publishing, spending, external communications, major revisions |
| **4** | Autonomous | Most actions autonomous | Spending above threshold, first-time actions, crisis communications |
| **5** | Full Auto | Everything autonomous | Only budget overrides and account changes |

### Autonomy configuration

```typescript
interface AutonomyConfig {
  clientId: string;
  globalLevel: 1 | 2 | 3 | 4 | 5;
  overrides: Array<{
    scope: {
      motor?: string;           // "video-production", "community-management", etc.
      actionType?: string;      // "publish", "send_email", "spend", "contact_vendor"
      budgetThreshold?: number; // override for actions above this amount
    };
    level: 1 | 2 | 3 | 4 | 5;
    reason: string;
  }>;
  escalation: {
    autoEscalateAfter: number;  // hours before auto-escalating pending approvals (default: 24)
    escalateTo: string[];       // email addresses for escalation
    fallbackAction: "block" | "approve_with_flag";  // what to do if escalation times out
  };
  schedule: {
    businessHours: { start: string; end: string; timezone: string };
    afterHoursLevel: 1 | 2 | 3 | 4 | 5;  // typically more conservative
  };
}
```

### Autonomy check flow

```
[Agent wants to execute action]
    ↓
[Classify action type] → publish | internal | spend | communicate | gate_pass
    ↓
[Load client autonomy config]
    ↓
[Check: motor-specific override? action-type override? budget threshold?]
    ↓
[Resolve effective autonomy level for this action]
    ↓
[Level allows autonomous execution?]
    ├── YES → Execute, log with "auto_approved"
    └── NO → Create approval request, notify client
              ↓
              [Client approves/rejects in review portal]
              ↓
              [Execute or block, log decision]
```

### Approval queue

```typescript
interface ApprovalRequest {
  id: string;
  clientId: string;
  projectId: string;
  motor: string;
  actionType: string;
  description: string;         // human-readable description of what AI wants to do
  context: {
    agent: string;
    step: string;
    artifacts: string[];       // relevant artifacts to review
  };
  urgency: "low" | "normal" | "high";
  status: "pending" | "approved" | "rejected" | "escalated" | "expired";
  createdAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
  expiresAt: string;           // auto-escalate after this time
}
```

---

## 5. Customer Data Protection (C-046)

### Multi-tenancy model

```
[Request with auth token]
    ↓
[Extract clientId from session]
    ↓
[ALL database queries scoped by clientId]
    ↓
[Response contains ONLY this client's data]
```

**Enforcement layers:**

| Layer | Mechanism |
|-------|-----------|
| **API middleware** | Every route handler receives `clientId` from session. No route operates without it |
| **Database queries** | Drizzle query builder wraps all queries with `.where(eq(table.clientId, ctx.clientId))` |
| **Agent context** | Context builder only loads artifacts/data belonging to the project's client |
| **Storage** | Artifacts stored in `/storage/{clientId}/{projectId}/` — no cross-client access |
| **Logging** | Client data never logged in plaintext — PII detection strips sensitive fields |

### Data isolation verification

SE-002 (Data Protection Officer) runs periodic audits:

```typescript
interface DataIsolationAudit {
  clientId: string;
  auditDate: string;
  checks: Array<{
    check: string;
    status: "pass" | "fail" | "warning";
    details: string;
  }>;
  overallStatus: "compliant" | "non_compliant";
}
```

**Audit checks:**
1. No cross-client artifact references in any project
2. No client data in log files
3. All API endpoints enforce clientId scoping
4. Agent context never contains data from other clients
5. Storage directories properly isolated
6. Session tokens properly scoped

### PII handling

```typescript
interface PIIPolicy {
  // Data that should never be sent to LLMs
  neverSendToLLM: string[];    // ["credit_card", "ssn", "bank_account"]

  // Data that can be sent but must be anonymized
  anonymizeBeforeLLM: string[]; // ["email", "phone", "full_name"] (replaced with tokens)

  // Data retention
  retention: {
    clientData: number;         // days to retain after contract ends (default: 90)
    executionLogs: number;      // days (default: 365)
    agentOutputs: number;       // days (default: contract duration + 90)
  };

  // Encryption
  encryption: {
    atRest: boolean;           // PostgreSQL TDE or column-level encryption
    inTransit: boolean;        // TLS required
    sensitiveFields: string[]; // additional fields to encrypt at column level
  };
}
```

### PII detection agent

SE-002 scans agent inputs/outputs for PII before they're sent to external LLM providers:

```
[Agent input prepared]
    ↓
[SE-002: PII scan]
    ↓
[PII found?]
    ├── neverSendToLLM → BLOCK execution, alert, log
    ├── anonymizeBeforeLLM → Replace with tokens, proceed, de-anonymize output
    └── clean → Proceed normally
```

---

## 6. Quality Gates (C-047)

### Gate types

| Type | When triggered | Who reviews | Purpose |
|------|---------------|------------|---------|
| **AI Gate** | After agent step | Another AI agent (evaluator) | Automated quality check |
| **Human Gate** | Configurable per motor/client | Client via review portal | Human oversight at critical points |
| **Hybrid Gate** | AI evaluates first, human if AI score is borderline | AI then human if needed | Efficient: AI handles clear pass/fail, human handles edge cases |

### Gate configuration (per client, per motor)

```typescript
interface GateConfig {
  clientId: string;
  motor: string;
  gates: Array<{
    gateId: string;           // "g1", "g2", etc.
    type: "ai" | "human" | "hybrid";
    hybridThreshold?: {
      autoPass: number;       // score >= this = auto-pass (default: 95)
      autoFail: number;       // score <= this = auto-fail (default: 40)
      // Between autoFail and autoPass = human review
    };
    evaluators: string[];     // agent IDs
    maxIterations: number;
    escalation: {
      afterIterations: number;  // escalate to human after N AI failures
      escalateTo: string;
    };
    required: boolean;         // can this gate be skipped?
  }>;
}
```

### 3+3 Escalation Rule (enhanced)

Current rule: 3 agent attempts → fail. Enhanced:

```
[Gate evaluation]
    ↓
[Attempt 1-3: AI evaluator(s)]
    ├── Score >= autoPass → PASS (auto)
    ├── Score <= autoFail → FAIL, agent revises
    └── Score in between → attempt next iteration
    ↓ (after 3 AI attempts)
[Attempt 4-6: AI + leader agent adjustment]
    ├── Leader reviews feedback, adjusts approach
    └── Re-evaluate
    ↓ (after 6 total attempts)
[Escalate to human]
    ├── Approval queue (C-045)
    └── Client reviews with full context (all attempts + scores + feedback)
```

### Review portal enhancements

Existing review portal (token-based) extended with:
- **Side-by-side comparison** — current version vs previous attempt
- **Gate history** — all evaluation scores and feedback for this gate
- **Guided review** — AI highlights areas that need attention
- **Quick actions** — approve, reject with reason, request specific change
- **Batch review** — review multiple gates at once when several are pending

---

## 7. Database Changes

### New tables

```sql
-- Autonomy configuration
CREATE TABLE autonomy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  global_level INTEGER NOT NULL DEFAULT 3,
  overrides JSONB DEFAULT '[]',
  escalation JSONB NOT NULL,
  schedule JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Approval queue
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  project_id UUID REFERENCES projects(id),
  motor VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  context JSONB NOT NULL,
  urgency VARCHAR(10) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending',
  responded_at TIMESTAMP,
  responded_by VARCHAR(100),
  response_note TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approval_pending
  ON approval_requests (client_id, status) WHERE status = 'pending';

-- Audit log (immutable)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  actor VARCHAR(100) NOT NULL,              -- agent ID or user email
  actor_type VARCHAR(20) NOT NULL,          -- "agent", "human", "system"
  action VARCHAR(100) NOT NULL,             -- "execute_agent", "pass_gate", "publish_content", etc.
  resource_type VARCHAR(50),                -- "project", "artifact", "lead", etc.
  resource_id UUID,
  details JSONB,
  autonomy_level INTEGER,                   -- what level applied
  approval_id UUID REFERENCES approval_requests(id),
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_client ON audit_log (client_id, timestamp DESC);
CREATE INDEX idx_audit_log_action ON audit_log (action, timestamp DESC);

-- Data isolation audit results
CREATE TABLE isolation_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date DATE NOT NULL,
  results JSONB NOT NULL,                   -- DataIsolationAudit
  overall_status VARCHAR(20) NOT NULL,
  issues_found INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gate configuration overrides (per client, per motor)
CREATE TABLE gate_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  motor VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,                    -- GateConfig.gates
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, motor)
);
```

---

## 8. API Endpoints

```
-- Autonomy
GET    /api/security/:clientId/autonomy             → Current autonomy configuration
PUT    /api/security/:clientId/autonomy             → Update autonomy config
GET    /api/security/:clientId/autonomy/effective    → Resolved autonomy level per motor

-- Approval queue
GET    /api/security/:clientId/approvals             → Pending approvals
GET    /api/security/:clientId/approvals/:id         → Approval detail with context
POST   /api/security/:clientId/approvals/:id/respond → Approve/reject
GET    /api/security/:clientId/approvals/history     → Past approvals

-- Audit
GET    /api/security/:clientId/audit                 → Audit log (filterable by action, actor, date)
GET    /api/security/:clientId/audit/export          → Export audit log (CSV)

-- Data protection
GET    /api/security/:clientId/isolation-status      → Latest isolation audit result
POST   /api/security/run-audit                       → Trigger isolation audit (admin only)

-- Gate configuration
GET    /api/security/:clientId/gates                 → Gate configs for all motors
PUT    /api/security/:clientId/gates/:motor          → Update gate config for a motor
GET    /api/security/:clientId/gates/stats           → Gate pass/fail rates by motor
```

---

## 9. Middleware Integration

### Autonomy middleware

Applied to all routes that trigger agent actions or external effects:

```typescript
async function autonomyMiddleware(ctx, next) {
  const action = classifyAction(ctx);  // "publish", "send", "spend", "internal"
  const config = await getAutonomyConfig(ctx.clientId);
  const effectiveLevel = resolveLevel(config, ctx.motor, action);

  if (requiresApproval(effectiveLevel, action)) {
    const approval = await createApprovalRequest(ctx);
    ctx.set('approvalRequired', true);
    ctx.set('approvalId', approval.id);
    return ctx.json({ status: 'pending_approval', approvalId: approval.id });
  }

  await next();
  await createAuditEntry(ctx, action, effectiveLevel);
}
```

### Tenant isolation middleware

Already partially exists in auth middleware. Enhanced with:

```typescript
async function tenantIsolation(ctx, next) {
  const clientId = ctx.get('session')?.userId;
  if (!clientId) throw new HTTPException(401);

  // Inject clientId into all database operations for this request
  ctx.set('clientId', clientId);

  // Verify any resource access is scoped to this client
  const resourceId = ctx.req.param('resourceId');
  if (resourceId) {
    const authorized = await verifyResourceOwnership(resourceId, clientId);
    if (!authorized) throw new HTTPException(403);
  }

  await next();
}
```

---

## 10. Scheduled Tasks

| Task | Schedule | What it does |
|------|----------|-------------|
| `approval-escalation` | Every 1h | Escalate pending approvals past expiration time |
| `isolation-audit` | Weekly Sunday 2am | Run data isolation verification across all clients |
| `pii-scan` | Daily 3am | Scan recent agent outputs for PII leakage |
| `audit-log-cleanup` | Monthly 1st 4am | Archive audit entries older than retention period |
| `agent-anomaly-check` | Daily 6am | Review agent execution patterns for anomalies |

---

## 11. New Files

| File | Purpose |
|------|---------|
| `src/services/security/autonomy-manager.ts` | Autonomy config, level resolution, approval queue |
| `src/services/security/data-protector.ts` | PII detection, anonymization, isolation verification |
| `src/services/security/audit-logger.ts` | Immutable audit trail for all actions |
| `src/services/security/gate-manager.ts` | Enhanced gate configuration and hybrid gate logic |
| `src/middleware/autonomy.ts` | Autonomy check middleware |
| `src/middleware/tenant-isolation.ts` | Enhanced tenant isolation middleware |
| `src/api/security-routes.ts` | All security API endpoints |
| `agents/SE-*.md` (x6) | Agent skill files |

---

## 12. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Autonomy level 3 (default) works | Internal processing runs auto, publishing blocked and queued for approval |
| Autonomy level override per motor | Set community-management to level 4, video to level 2, verify different behavior |
| Approval queue notifies | Pending approval sends notification, client can approve in portal |
| Escalation works | Let approval expire, verify escalation notification fires |
| Tenant isolation passes audit | Run isolation audit, verify 0 cross-client data leaks |
| PII detection catches sensitive data | Inject credit card number in agent input, verify it's blocked |
| Audit log captures all actions | Execute 10 different actions, verify all appear in audit log |
| Hybrid gates work | Set threshold 40-95, verify auto-pass at 96, auto-fail at 39, human review at 60 |
| Gate config per client | Two clients with different gate configs on same motor, verify independent behavior |
| No regression | Existing auth, sessions, and review portal continue working |
