# criteria.agency — Security Team Implementation Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation plan for Security Team capability (C-046), including pipeline definition, 4 internal agents, context maps, and security directives

---

## 1. Objective

Implement the **Security Team** motor — the platform's dedicated security intelligence layer. This motor audits code, data handling, and agent behavior to ensure criteria.agency meets modern security standards before any client-facing deployment.

### Capability delivered

| Capability | What it delivers |
|-----------|-----------------|
| C-046: Security Audit on-demand | Full-stack security audit covering code vulnerabilities, data protection compliance, and agent execution safety — delivered as a structured report with prioritized remediation |

### Why this motor is priority

Security is a **foundational requirement for the platform**:

- criteria.agency handles **multi-tenant client data** — isolation failures have legal and reputational consequences
- Agents execute autonomously and **access sensitive project assets** — scope violations must be detected and prevented
- The platform processes **financial data, brand assets, and strategic documents** — all require encryption and access control
- GDPR and basic compliance requirements apply to client data stored and processed by the platform

### Scope

- **Code security:** OWASP Top 10 vulnerabilities, dependency audits, secret scanning
- **Data protection:** Multi-tenancy isolation, encryption at rest and in transit, PII handling, access controls
- **Agent execution auditing:** Data access scoping, output sanitization, prompt security, credential exposure
- **Remediation planning:** Prioritized fixes with code-level recommendations
- **Security reporting:** Executive summary + technical findings by severity

---

## 2. Pipeline

```
[sec_audit] → [sec_scan] → [sec-g1] → [sec_remediate] → [sec_report] → [sec_deliver]
```

### Step details

| Step | Agents | What happens | Input artifacts | Output artifacts |
|------|--------|-------------|----------------|-----------------|
| sec_audit | SC-L | Defines audit scope and risk prioritization. Reviews architecture for security surface area. Identifies which code paths, data flows, and agent behaviors are in scope | Project brief, architecture docs (json) | Audit Scope Document (json): risk categories, priorities, focus areas |
| sec_scan | SC-001, SC-002, SC-003 | Parallel scan by three specialists. SC-001 scans code for OWASP vulnerabilities, dependency issues, and hardcoded secrets. SC-002 audits data protection: tenant isolation, encryption, PII handling. SC-003 audits agent execution: data access, output sanitization, prompt security | Audit Scope Document | Findings reports (json) per specialist: {findings: [{severity, category, location, description, remediation}]} |
| **sec-g1** | SC-L | Are all findings properly documented? Are critical issues identified? Is the severity classification accurate? Are any scan areas missing? | All scan findings | pass/fail + reviewer notes |
| sec_remediate | SC-001 | Generates prioritized remediation plan for critical and high findings. Includes code-level fixes where possible. Organizes by severity then exploitability | All scan findings | Remediation Plan (text): fix-by-fix instructions, code snippets, priority queue |
| sec_report | SC-L | Compiles executive security report: summary of posture, findings by severity tier, remediation status, compliance score, and strategic recommendations | Scan findings + Remediation Plan | Security Report (markdown): executive summary, findings table, compliance score, roadmap |
| sec_deliver | SC-L | Final review of security report. Verifies all critical findings have remediation plans or documented risk-acceptance. Signs off on delivery | Security Report | Approved Security Report (text) |

### Gate definition

| Gate | After step | Evaluators | Max iterations | Fail returns to |
|------|-----------|-----------|---------------|----------------|
| sec-g1 | sec_scan | SC-L | 2 | sec_scan |

### Autonomy configuration

| Mode | sec-g1 behavior |
|------|----------------|
| **AI decides** | Auto-approves if SC-L internal evaluation passes all severity checks |
| **AI recommends** | Requires human approval before proceeding to remediation |

---

## 3. Agents

### Internal agents (4)

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| SC-L | Security Architect | leader | sec_audit, sec_report, sec_deliver | claude-sonnet-4 | 70% |
| SC-001 | Code Guardian | sub | sec_scan, sec_remediate | gemini-2.5-flash | 80% |
| SC-002 | Data Protection Officer | sub | sec_scan | gemini-2.5-flash | 75% |
| SC-003 | Agent Auditor | sub | sec_scan | gemini-2.5-flash | 80% |

### Agent responsibilities

**SC-L — Security Architect (leader, 70%)**
- Defines security audit scope and risk framework
- Prioritizes findings by severity and business impact
- Reviews all scan outputs before proceeding to remediation
- Compiles and signs off on the final security report
- Holds gate sec-g1: validates completeness and accuracy of all scan findings

**SC-001 — Code Guardian (sub, 80%)**
- OWASP Top 10 vulnerability scanning (injection, XSS, CSRF, broken auth, sensitive data exposure, XXE, insecure deserialization, known vulnerabilities)
- Dependency audit: identifies packages with known CVEs
- Secret scanning: detects hardcoded API keys, passwords, tokens in codebase
- Generates code-level remediation suggestions for all critical and high findings

**SC-002 — Data Protection Officer (sub, 75%)**
- Multi-tenancy isolation audit: verifies client data is properly scoped and never cross-contaminated
- Encryption audit: checks encryption at rest (database fields, file storage) and in transit (HTTPS, TLS)
- PII handling: identifies where personal data is stored, processed, and logged
- Access control review: validates least-privilege patterns across API routes and DB queries
- Compliance check: GDPR basics — data retention, consent, right to erasure paths

**SC-003 — Agent Auditor (sub, 80%)**
- Maps what data each agent can access during execution (artifacts, project metadata, client info)
- Detects scope violations: agents accessing data beyond their designated steps
- Output sanitization review: ensures agent outputs don't leak credentials, PII, or internal system details
- Prompt security: checks whether system prompts or task instructions expose sensitive configuration
- Credential exposure: verifies no API keys or tokens are passed through agent task payloads

---

## 4. Security Domains

### 4.1 Multi-tenancy

criteria.agency serves multiple clients on a shared infrastructure. The Security Team audits:

- **Database-level isolation:** All queries must be scoped by `clientId`. The audit checks for missing `WHERE clientId = ?` clauses in any cross-table join or aggregation.
- **Storage isolation:** Files on R2 must be organized under client-scoped prefixes. Public URLs must not be guessable or enumerable.
- **API route authorization:** Every API route that returns client data must validate the requesting session's `clientId` against the resource's `clientId`.
- **Agent context isolation:** When an agent executes for a project, it must only receive artifacts belonging to that project's client.

**Failure modes audited:**
- IDOR (Insecure Direct Object Reference): accessing a resource by ID without ownership validation
- Tenant bleed: a query returning records from multiple clients
- Storage path traversal: guessable paths exposing other clients' files

### 4.2 Data Encryption

| Layer | Requirement | Audit check |
|-------|------------|------------|
| Database fields (PII) | Encrypted at rest via Postgres encryption or application-level | Verify encryption applied to `email`, `name`, `phone` fields |
| File storage (R2) | Server-side encryption enabled | Verify bucket SSE configuration |
| API transport | HTTPS enforced, no HTTP fallback | Check for HTTP endpoints and missing HSTS headers |
| Secrets management | Env vars only, never in code | Secret scanning across entire codebase |
| Agent payloads | No credentials in task instructions | Audit context-map task instructions for secret patterns |

### 4.3 OWASP Top 10

SC-001 audits against the full OWASP Top 10 (2021):

| # | Category | What SC-001 checks |
|---|----------|-------------------|
| A01 | Broken Access Control | IDOR, missing auth middleware, role bypass |
| A02 | Cryptographic Failures | Weak algorithms, missing encryption, cleartext PII |
| A03 | Injection | SQL injection via ORM misuse, NoSQL injection, command injection |
| A04 | Insecure Design | Missing rate limiting, no input validation schemas |
| A05 | Security Misconfiguration | Default credentials, exposed debug endpoints, verbose error messages |
| A06 | Vulnerable Components | Dependencies with known CVEs (checked via npm audit) |
| A07 | Auth & Session Failures | Weak tokens, no token expiry, session fixation |
| A08 | Software Integrity Failures | Unverified package integrity, supply chain risks |
| A09 | Logging & Monitoring Failures | Missing audit logs for sensitive operations |
| A10 | SSRF | Unvalidated URLs in server-side fetch calls |

### 4.4 Agent Execution Auditing

Agents in criteria.agency execute with access to project artifacts, client data, and model APIs. SC-003 enforces:

**Data access scoping:**
Each agent's context entry in `AGENT_CONTEXT_MAP` defines which `artifactSteps` it can read. SC-003 verifies that the orchestrator never passes artifacts outside this scope.

**Output sanitization:**
Agent outputs are stored as artifacts. SC-003 checks that:
- Outputs do not contain embedded credentials or tokens
- Outputs do not include data from other projects/clients
- JSON outputs conform to defined schemas (no extra fields with sensitive data)

**Prompt security:**
Task instructions in the context map must not contain:
- Hardcoded API keys or secrets
- Internal system architecture details that would help an adversary
- PII from any client

**Execution traceability:**
`agentExecutions` table records all agent runs. SC-003 validates that:
- All executions have proper `projectId` linkage
- Input and output artifact IDs are recorded
- Failed executions log sanitized error messages (no stack traces with credentials)

---

## 5. Dolores Integration

**Dolores directive: D-SEG-02**

When a project triggers the Security pipeline, Dolores:
1. Notifies the client that a security audit is in progress
2. Presents the Security Report in the client review panel when `sec_report` completes
3. Highlights critical findings prominently — separate from medium/low findings
4. On `sec_deliver`, packages the approved report as a downloadable PDF

---

## 6. Context Map Summary

| Agent:Step | Reads from | Key instruction |
|-----------|-----------|----------------|
| SC-L:sec_audit | — | Define scope, risk prioritization, surface area |
| SC-001:sec_scan | sec_audit | OWASP Top 10, dependencies, secret scanning |
| SC-002:sec_scan | sec_audit | Tenant isolation, encryption, PII, access controls |
| SC-003:sec_scan | sec_audit | Agent data access, output sanitization, prompt security |
| SC-001:sec_remediate | sec_scan | Prioritized remediation plan with code fixes |
| SC-L:sec_report | sec_scan + sec_remediate | Executive report: findings, compliance score, roadmap |
| SC-L:sec_deliver | sec_report | Final review and sign-off |

---

## 7. Source file changes

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `sec_audit, sec_scan, sec_remediate, sec_report, sec_deliver` to `projectStatusEnum` and `artifactStepEnum`; add `sec-g1` to `gateTypeEnum` |
| `src/orchestrator/pipeline-registry.ts` | Register `security` pipeline with steps, stepAgents, and gate config |
| `src/agents/registry.ts` | Add SC-L, SC-001, SC-002, SC-003 to `AGENT_REGISTRY` |
| `src/agents/model-defaults.ts` | Add model assignments for all 4 SC agents |
| `src/agents/context-map.ts` | Add context entries and output types for all 7 agent:step combinations |

Skill files:
- `agents/SC-L_security_architect.md`
- `agents/SC-001_code_guardian.md`
- `agents/SC-002_data_protection_officer.md`
- `agents/SC-003_agent_auditor.md`
