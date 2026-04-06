# criteria.agency — Database Schema & API Design (MVP Increment 1)

> Date: April 6, 2026
> Status: Approved — Ready for implementation
> Scope: Auth + Multi-tenancy + Motor-agnostic schema + API contract

---

## 1. Overview

### What This Covers
This spec defines the first schema + API increment for criteria.agency:
- **Authentication** via Better Auth (manages its own tables)
- **Multi-tenancy** via Organizations + Memberships
- **Motor-agnostic schema** replacing the video-only 6-table prototype
- **API contract** with auth, tenant isolation, and Zod validation
- **Pipeline definitions** stored in DB instead of hardcoded constants

### What This Does NOT Cover (future increments)
- Event Bus tables (eventLog, eventSubscriptions)
- Client secrets encryption (clientSecrets table)
- Security audit tables (securityEvents, auditLog)
- Billing/Stripe (subscriptions, invoices)
- Content & Distribution tables (campaigns, channels, contentCalendar)
- Analytics tables (metrics, reports)
- Brand DNA table
- Non-video motor agent registries

### Approach: Clean Slate
The current 6 tables, 8 PostgreSQL enums, and 12 endpoints are replaced entirely. The existing schema was a video-only prototype with hardcoded enums and no auth/tenancy. A clean rewrite is simpler than migrating.

**What gets rewritten:**
- `src/db/schema.ts` — complete rewrite
- `src/shared/types.ts` — eliminate enums, use string union types
- `src/orchestrator/*` — read pipeline from DB instead of constants
- `src/api/routes.ts` — new route structure with middleware
- `src/agents/registry.ts` — adapt to new schema
- Drizzle migration — new migration drops old tables, creates new ones

---

## 2. Auth Tables (Better Auth Managed)

Better Auth creates and manages these tables automatically. We do NOT define them in our Drizzle schema — Better Auth handles migrations for its own tables.

### `user`
```
id              TEXT PK
name            TEXT NOT NULL
email           TEXT NOT NULL UNIQUE
emailVerified   BOOLEAN NOT NULL DEFAULT false
image           TEXT
createdAt       TIMESTAMP NOT NULL
updatedAt       TIMESTAMP NOT NULL
```

### `session`
```
id              TEXT PK
userId          TEXT NOT NULL FK -> user.id
token           TEXT NOT NULL UNIQUE
expiresAt       TIMESTAMP NOT NULL
ipAddress       TEXT
userAgent       TEXT
createdAt       TIMESTAMP NOT NULL
updatedAt       TIMESTAMP NOT NULL
```

### `account`
```
id              TEXT PK
userId          TEXT NOT NULL FK -> user.id
accountId       TEXT NOT NULL
providerId      TEXT NOT NULL              -- 'credential', 'google', etc.
accessToken     TEXT
refreshToken    TEXT
accessTokenExpiresAt  TIMESTAMP
refreshTokenExpiresAt TIMESTAMP
scope           TEXT
idToken         TEXT
password        TEXT                       -- hashed, for credential provider
createdAt       TIMESTAMP NOT NULL
updatedAt       TIMESTAMP NOT NULL
```

### `verification`
```
id              TEXT PK
identifier      TEXT NOT NULL              -- email or phone
value           TEXT NOT NULL              -- token
expiresAt       TIMESTAMP NOT NULL
createdAt       TIMESTAMP NOT NULL
updatedAt       TIMESTAMP NOT NULL
```

**Integration notes:**
- Better Auth's Drizzle adapter generates these tables on first run
- Our Drizzle schema references `user.id` via foreign keys but does not define the `user` table
- Session management uses HTTP-only cookies with automatic rotation
- Email/password provider enabled by default; OAuth providers added later

---

## 3. Multi-tenancy Tables (Our Schema)

### `organizations`
The tenant — unit of billing, data isolation, and team membership.
```sql
id              UUID PK DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
slug            VARCHAR(100) NOT NULL UNIQUE    -- URL-safe: criteria.agency/org/{slug}
plan            VARCHAR(20) NOT NULL DEFAULT 'free'  -- 'free' | 'pro' | 'enterprise'
brandAssets     JSONB NOT NULL DEFAULT '{}'     -- { logo, colors, fonts, guidelines }
settings        JSONB NOT NULL DEFAULT '{}'     -- org-level preferences
createdAt       TIMESTAMP NOT NULL DEFAULT now()
updatedAt       TIMESTAMP NOT NULL DEFAULT now()
```

**Notes:**
- `slug` is auto-generated from name on creation, editable by owner
- `plan` is manually set for now; Stripe webhook will update it in future increment
- `brandAssets` migrates the concept from the old `clients.brandAssets` column
- A new user registration auto-creates an organization with the user as owner

### `memberships`
Links users to organizations with role-based access.
```sql
id              UUID PK DEFAULT gen_random_uuid()
userId          TEXT NOT NULL FK -> user.id ON DELETE CASCADE
organizationId  UUID NOT NULL FK -> organizations.id ON DELETE CASCADE
role            VARCHAR(20) NOT NULL DEFAULT 'member'  -- 'owner' | 'admin' | 'editor' | 'viewer'
createdAt       TIMESTAMP NOT NULL DEFAULT now()

UNIQUE(userId, organizationId)
```

**Role hierarchy:**
| Role | Permissions |
|------|-------------|
| `owner` | Full access. Billing, team management, delete org. One per org. |
| `admin` | Manage projects, motors, members (except owner). Cannot delete org or manage billing. |
| `editor` | Create/edit projects, review gates, manage artifacts. Cannot manage team or motors. |
| `viewer` | Read-only access to projects, artifacts, analytics. |

### `motors`
Motor configurations per tenant. Controls which motors are enabled and their autonomy settings.
```sql
id              UUID PK DEFAULT gen_random_uuid()
organizationId  UUID NOT NULL FK -> organizations.id ON DELETE CASCADE
motor           VARCHAR(50) NOT NULL           -- 'video', 'design', 'ads', 'email', etc.
enabled         BOOLEAN NOT NULL DEFAULT true
autonomyMode    VARCHAR(20) NOT NULL DEFAULT 'ai_recommends'  -- 'ai_decides' | 'ai_recommends'
settings        JSONB NOT NULL DEFAULT '{}'    -- motor-specific settings
createdAt       TIMESTAMP NOT NULL DEFAULT now()

UNIQUE(organizationId, motor)
```

**Notes:**
- On org creation, seed default motors based on `plan` tier
- `autonomyMode` controls whether agents execute autonomously or wait for human approval
- `settings` JSONB holds motor-specific config (e.g., video resolution defaults, preferred models)

---

## 4. Core Platform Tables

### `projects`
Generalized for any motor. Pipeline status is a varchar, not an enum.
```sql
id              UUID PK DEFAULT gen_random_uuid()
organizationId  UUID NOT NULL FK -> organizations.id ON DELETE CASCADE
name            VARCHAR(255) NOT NULL
motor           VARCHAR(50) NOT NULL           -- 'video', 'design', 'ads', etc.
projectType     VARCHAR(50) NOT NULL           -- motor-specific type (video: 'corporate'; design: 'logo')
status          VARCHAR(50) NOT NULL DEFAULT 'draft'  -- current pipeline step, varies per motor
currentGate     VARCHAR(10)                    -- 'g1', 'g2', etc. NULL when not at a gate
brief           JSONB NOT NULL DEFAULT '{}'    -- structured brief data
metadata        JSONB NOT NULL DEFAULT '{}'    -- motor-specific metadata
createdBy       TEXT FK -> user.id             -- user who created the project
deletedAt       TIMESTAMP                      -- soft delete (NULL = active)
createdAt       TIMESTAMP NOT NULL DEFAULT now()
updatedAt       TIMESTAMP NOT NULL DEFAULT now()
```

**Indexes:**
```sql
CREATE INDEX idx_projects_org ON projects(organizationId);
CREATE INDEX idx_projects_org_motor ON projects(organizationId, motor);
CREATE INDEX idx_projects_org_status ON projects(organizationId, status);
CREATE INDEX idx_projects_created_by ON projects(createdBy);
```

**Changes from old schema:**
- `clientId` → `organizationId` (tenant)
- `type` PostgreSQL enum → `projectType` varchar
- `status` PostgreSQL enum → `status` varchar
- Added: `motor`, `brief`, `metadata`, `createdBy`, `deletedAt`

### `artifacts`
Generated outputs at each pipeline step. Versioned.
```sql
id              UUID PK DEFAULT gen_random_uuid()
projectId       UUID NOT NULL FK -> projects.id ON DELETE CASCADE
organizationId  UUID NOT NULL FK -> organizations.id  -- denormalized for tenant queries
step            VARCHAR(50) NOT NULL           -- pipeline step (varies per motor)
artifactType    VARCHAR(30) NOT NULL           -- 'document', 'image', 'video', 'audio', 'subtitle', 'package'
name            VARCHAR(255) NOT NULL
version         INTEGER NOT NULL DEFAULT 1
storagePath     TEXT NOT NULL                  -- R2 key or local filesystem path
createdByAgent  VARCHAR(30) NOT NULL           -- agent ID (e.g., 'T1-L', 'TL-002')
metadata        JSONB NOT NULL DEFAULT '{}'    -- { dimensions, duration, format, etc. }
createdAt       TIMESTAMP NOT NULL DEFAULT now()
```

**Indexes:**
```sql
CREATE INDEX idx_artifacts_project ON artifacts(projectId);
CREATE INDEX idx_artifacts_org ON artifacts(organizationId);
```

### `gateReviews`
Quality gate evaluation records.
```sql
id              UUID PK DEFAULT gen_random_uuid()
projectId       UUID NOT NULL FK -> projects.id ON DELETE CASCADE
organizationId  UUID NOT NULL FK -> organizations.id  -- denormalized
gate            VARCHAR(10) NOT NULL           -- 'g1', 'g2', 'g3', etc.
iteration       INTEGER NOT NULL DEFAULT 1
decision        VARCHAR(10) NOT NULL           -- 'pass' | 'fail'
reviewer        VARCHAR(30) NOT NULL           -- agent ID or 'human:{userId}'
scores          JSONB NOT NULL DEFAULT '{}'    -- { agentId: score, ... }
notes           TEXT
createdAt       TIMESTAMP NOT NULL DEFAULT now()
```

**Indexes:**
```sql
CREATE INDEX idx_gate_reviews_project_gate ON gateReviews(projectId, gate);
```

### `agentExecutions`
Audit trail of every agent invocation.
```sql
id              UUID PK DEFAULT gen_random_uuid()
projectId       UUID NOT NULL FK -> projects.id ON DELETE CASCADE
organizationId  UUID NOT NULL FK -> organizations.id  -- denormalized
agentId         VARCHAR(30) NOT NULL
step            VARCHAR(50) NOT NULL
attempt         INTEGER NOT NULL DEFAULT 1
status          VARCHAR(20) NOT NULL           -- 'running' | 'completed' | 'failed'
inputArtifactIds  JSONB NOT NULL DEFAULT '[]'  -- array of artifact UUIDs
outputArtifactIds JSONB NOT NULL DEFAULT '[]'  -- array of artifact UUIDs
startedAt       TIMESTAMP NOT NULL DEFAULT now()
completedAt     TIMESTAMP
cost            JSONB NOT NULL DEFAULT '{}'    -- { tokens, usd, model }
error           TEXT
metadata        JSONB NOT NULL DEFAULT '{}'
```

**Indexes:**
```sql
CREATE INDEX idx_agent_exec_project ON agentExecutions(projectId);
CREATE INDEX idx_agent_exec_org ON agentExecutions(organizationId);
CREATE INDEX idx_agent_exec_agent_status ON agentExecutions(agentId, status);
```

### `modelConfigs`
AI model configuration per tenant per motor (not per project).
```sql
id              UUID PK DEFAULT gen_random_uuid()
organizationId  UUID NOT NULL FK -> organizations.id ON DELETE CASCADE
motor           VARCHAR(50) NOT NULL
taskType        VARCHAR(30) NOT NULL           -- 'text_gen', 'image_gen', 'video_gen', etc.
modelName       VARCHAR(100) NOT NULL          -- 'claude-sonnet-4-20250514', 'runway-gen4', etc.
provider        VARCHAR(50) NOT NULL           -- 'anthropic', 'openai', 'runway', etc.
parameters      JSONB NOT NULL DEFAULT '{}'    -- model-specific params
costPerUnit     NUMERIC(10,4)                  -- cost per token/image/second
isDefault       BOOLEAN NOT NULL DEFAULT false
createdAt       TIMESTAMP NOT NULL DEFAULT now()
```

**Indexes:**
```sql
CREATE INDEX idx_model_configs_org_motor ON modelConfigs(organizationId, motor);
CREATE UNIQUE INDEX idx_model_configs_default ON modelConfigs(organizationId, motor, taskType) WHERE isDefault = true;
```

---

## 5. Pipeline Configuration Table

### `pipelineDefinitions`
Defines the pipeline steps, gates, and agent assignments for each motor. Replaces all hardcoded constants (PIPELINE_FLOW, STEP_GATE_MAP, GATE_FAIL_RETURN, GATE_MAX_ITERATIONS, STEP_AGENTS, GATE_AGENTS).
```sql
id              UUID PK DEFAULT gen_random_uuid()
motor           VARCHAR(50) NOT NULL UNIQUE    -- 'video', 'design', 'ads', etc.
steps           JSONB NOT NULL                 -- ordered array of step definitions
gates           JSONB NOT NULL                 -- gate definitions
metadata        JSONB NOT NULL DEFAULT '{}'    -- motor-level config
createdAt       TIMESTAMP NOT NULL DEFAULT now()
updatedAt       TIMESTAMP NOT NULL DEFAULT now()
```

### `steps` JSONB Structure
```typescript
interface PipelineStep {
  id: string;           // 'brief', 'concept', 'script', etc.
  name: string;         // Human-readable: 'Brief', 'Concept', etc.
  order: number;        // 1-based ordering
  agents: string[];     // Agent IDs to dispatch: ['T7-L', 'T1-L']
  gateAfter?: string;   // Gate ID that follows this step: 'g1'
}
```

**Video motor example:**
```json
[
  { "id": "brief", "name": "Brief", "order": 1, "agents": ["T7-L", "T1-L"] },
  { "id": "concept", "name": "Concept", "order": 2, "agents": ["T1-L"], "gateAfter": "g1" },
  { "id": "script", "name": "Script", "order": 3, "agents": ["T2-L", "T2-002", "T2-006"], "gateAfter": "g2" },
  { "id": "visual_look", "name": "Visual Look", "order": 4, "agents": ["T3-L", "TL-003"] },
  { "id": "storyboard", "name": "Storyboard", "order": 5, "agents": ["T3-L", "T3-003"], "gateAfter": "g3" },
  { "id": "video_gen", "name": "Video Generation", "order": 6, "agents": ["T3-003"] },
  { "id": "edit", "name": "Editing", "order": 7, "agents": ["T6-L"] },
  { "id": "audio", "name": "Audio", "order": 8, "agents": ["T5-L"], "gateAfter": "g4" },
  { "id": "polish", "name": "Polish", "order": 9, "agents": ["T6-L"], "gateAfter": "g5" },
  { "id": "delivered", "name": "Delivered", "order": 10, "agents": ["T6-003", "T7-L"] }
]
```

### `gates` JSONB Structure
```typescript
interface GateDefinition {
  [gateId: string]: {
    name: string;              // 'Concept Gate'
    maxIterations: number;     // 3
    returnToStep: string;      // Step to return to on failure
    agents: string[];          // Reviewer agent IDs
  };
}
```

**Video motor example:**
```json
{
  "g1": { "name": "Concept Gate", "maxIterations": 3, "returnToStep": "concept", "agents": ["TL-002"] },
  "g2": { "name": "Script Gate", "maxIterations": 3, "returnToStep": "script", "agents": ["TL-002", "T1-L"] },
  "g3": { "name": "Storyboard Gate", "maxIterations": 2, "returnToStep": "storyboard", "agents": ["TL-002"] },
  "g4": { "name": "Audio Gate", "maxIterations": 2, "returnToStep": "audio", "agents": ["TL-002", "XF-001"] },
  "g5": { "name": "Final Gate", "maxIterations": 1, "returnToStep": "polish", "agents": ["TL-002", "XF-001"] }
}
```

### How the Orchestrator Uses This
1. On project creation, validate that `motor` has a `pipelineDefinitions` entry
2. Set initial `status` to the first step's `id`
3. On `advanceProject()`:
   - Read pipeline definition for the project's motor
   - Find current step, dispatch its agents
   - If step has `gateAfter`, evaluate the gate
   - On gate pass, advance to next step in order
   - On gate fail, return to `gates[gateId].returnToStep`
4. Adding a new motor = INSERT a row into `pipelineDefinitions`

---

## 6. API Contract

### Base URL
```
/api
```

### Middleware Stack (applied in order)
```
1. securityHeaders    — HSTS, CSP, X-Frame-Options, nosniff
2. rateLimiter        — Per IP, stricter for auth endpoints
3. cors              — Restrictive: specific origins only
4. auth              — Better Auth session validation (skip for public routes)
5. tenant            — Extract orgId from URL, validate membership, inject into context
6. zodValidator      — Per-route input validation
7. errorHandler      — Structured JSON error responses
```

### Error Response Format
```typescript
{
  error: {
    code: string;        // 'UNAUTHORIZED', 'NOT_FOUND', 'VALIDATION_ERROR', etc.
    message: string;     // Human-readable message
    details?: unknown;   // Zod validation errors, field-level details
  }
}
```

### Auth Routes (Better Auth)
Better Auth handles these routes internally. We mount Better Auth at `/api/auth/*`.
```
POST   /api/auth/sign-up                     — Register (creates user + org)
POST   /api/auth/sign-in/email               — Login with email/password
POST   /api/auth/sign-out                     — Logout (invalidate session)
GET    /api/auth/session                      — Get current session + user
POST   /api/auth/forgot-password              — Request password reset
POST   /api/auth/reset-password               — Complete password reset
```

### Organization Routes
```
POST   /api/organizations                           — Create organization
GET    /api/organizations/:orgId                     — Get org details
PATCH  /api/organizations/:orgId                     — Update org (name, brandAssets, settings)
GET    /api/organizations/:orgId/members             — List members
POST   /api/organizations/:orgId/members             — Invite member (email + role)
PATCH  /api/organizations/:orgId/members/:memberId   — Update member role
DELETE /api/organizations/:orgId/members/:memberId   — Remove member
```

**Permissions:**
| Action | owner | admin | editor | viewer |
|--------|-------|-------|--------|--------|
| Update org | YES | NO | NO | NO |
| Manage members | YES | YES | NO | NO |
| Remove member | YES | YES (not owner) | NO | NO |

### Motor Routes
```
GET    /api/organizations/:orgId/motors              — List motors (enabled + available)
PATCH  /api/organizations/:orgId/motors/:motor       — Update motor config
```

**Permissions:** owner and admin only.

**Response format (GET):**
```typescript
{
  motors: {
    motor: string;
    enabled: boolean;
    autonomyMode: 'ai_decides' | 'ai_recommends';
    availableInPlan: boolean;  // derived from org.plan
    settings: Record<string, unknown>;
  }[];
}
```

### Project Routes
```
POST   /api/organizations/:orgId/projects                  — Create project
GET    /api/organizations/:orgId/projects                   — List projects
GET    /api/organizations/:orgId/projects/:projectId        — Get project detail
PATCH  /api/organizations/:orgId/projects/:projectId        — Update project
DELETE /api/organizations/:orgId/projects/:projectId        — Soft delete

POST   /api/organizations/:orgId/projects/:projectId/advance   — Advance one step
POST   /api/organizations/:orgId/projects/:projectId/run       — Run full pipeline
POST   /api/organizations/:orgId/projects/:projectId/pause     — Pause project
POST   /api/organizations/:orgId/projects/:projectId/resume    — Resume project
```

**Create project body:**
```typescript
{
  name: string;           // Required
  motor: string;          // Required: 'video', 'design', etc.
  projectType: string;    // Required: motor-specific type
  brief?: Record<string, unknown>;  // Optional initial brief
}
```

**List projects query params:**
```
?motor=video             — Filter by motor
?status=concept          — Filter by status
?page=1&limit=20         — Pagination
?sort=createdAt&order=desc  — Sorting
```

**Permissions:**
| Action | owner | admin | editor | viewer |
|--------|-------|-------|--------|--------|
| Create project | YES | YES | YES | NO |
| View project | YES | YES | YES | YES |
| Update project | YES | YES | YES | NO |
| Delete project | YES | YES | NO | NO |
| Advance/Run/Pause/Resume | YES | YES | YES | NO |

### Artifact Routes
```
GET    /api/organizations/:orgId/projects/:projectId/artifacts         — List artifacts
GET    /api/organizations/:orgId/artifacts/:artifactId                  — Get artifact metadata
GET    /api/organizations/:orgId/artifacts/:artifactId/content          — Download content
```

**List artifacts query params:**
```
?step=concept            — Filter by pipeline step
?type=document           — Filter by artifact type
```

### Gate Routes
```
GET    /api/organizations/:orgId/projects/:projectId/gates                    — Gate history
POST   /api/organizations/:orgId/projects/:projectId/gates/:gate/override     — Human override
```

**Human override body:**
```typescript
{
  decision: 'pass' | 'fail';
  notes?: string;
}
```

**Permissions:** owner and admin only for human override.

### Agent Routes
```
GET    /api/agents                                                            — Agent registry (public)
GET    /api/organizations/:orgId/projects/:projectId/executions               — Execution history
```

**Execution history query params:**
```
?agentId=T1-L            — Filter by agent
?status=running          — Filter by status
```

### Model Config Routes
```
GET    /api/organizations/:orgId/models                     — List model configs
PATCH  /api/organizations/:orgId/models/:modelId            — Update model config
```

### Pipeline Routes (admin/read-only)
```
GET    /api/pipelines                    — List all pipeline definitions
GET    /api/pipelines/:motor             — Get pipeline for a specific motor
```

### System Routes
```
GET    /health                           — Health check (no auth, no tenant)
```

---

## 7. Tenant Isolation

### Middleware Implementation
Every request to `/api/organizations/:orgId/*` passes through tenant middleware:

1. Extract `orgId` from URL params
2. Query `memberships` to verify authenticated user belongs to org
3. If no membership → 403 Forbidden
4. Inject `orgId` into Hono context: `c.set('organizationId', orgId)`
5. Inject `role` into Hono context: `c.set('memberRole', membership.role)`

### Query Pattern
All database queries MUST filter by tenant:
```typescript
// CORRECT
const projects = await db.select()
  .from(projectsTable)
  .where(eq(projectsTable.organizationId, c.get('organizationId')));

// WRONG — never do this
const projects = await db.select().from(projectsTable);
```

### Denormalized `organizationId`
Tables `artifacts`, `gateReviews`, and `agentExecutions` include `organizationId` even though it could be derived via JOIN to `projects`. This:
- Enables direct tenant-filtered queries without JOINs
- Provides defense-in-depth (even if a bug skips the middleware, queries still filter)
- Simplifies index patterns

---

## 8. Entity Relationship Diagram

```
┌──────────────────┐
│   user           │ ← Better Auth managed
│   (TEXT PK)      │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│  memberships     │──────→│  organizations   │
│  (userId, orgId) │  N:1  │  (UUID PK)       │
│  role            │       │  name, slug, plan │
└──────────────────┘       │  brandAssets      │
                           └──────┬────────────┘
                                  │ 1:N
                    ┌─────────────┼─────────────┐
                    ▼             ▼              ▼
              ┌──────────┐ ┌──────────┐  ┌──────────────┐
              │  motors  │ │ projects │  │ modelConfigs │
              │  (motor, │ │ (motor,  │  │ (motor,      │
              │  enabled,│ │  status, │  │  taskType,   │
              │  autonomy│ │  brief)  │  │  modelName)  │
              │  Mode)   │ └────┬─────┘  └──────────────┘
              └──────────┘      │ 1:N
                          ┌─────┼──────────┐
                          ▼     ▼          ▼
                    ┌─────────┐ ┌────────┐ ┌───────────────┐
                    │artifacts│ │ gate   │ │ agent         │
                    │         │ │Reviews │ │ Executions    │
                    └─────────┘ └────────┘ └───────────────┘

┌─────────────────────┐
│ pipelineDefinitions │  ← standalone, referenced by motor name
│ (motor UNIQUE)      │
│ steps, gates (JSONB)│
└─────────────────────┘
```

---

## 9. Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| organizations | slug | UNIQUE | URL lookup |
| memberships | (userId, organizationId) | UNIQUE | One membership per user per org |
| memberships | organizationId | INDEX | List org members |
| motors | (organizationId, motor) | UNIQUE | One config per motor per org |
| projects | organizationId | INDEX | Tenant query |
| projects | (organizationId, motor) | INDEX | Filter by motor |
| projects | (organizationId, status) | INDEX | Filter by status |
| projects | createdBy | INDEX | User's projects |
| artifacts | projectId | INDEX | Project's artifacts |
| artifacts | organizationId | INDEX | Tenant query |
| gateReviews | (projectId, gate) | INDEX | Gate lookup |
| agentExecutions | projectId | INDEX | Project's executions |
| agentExecutions | organizationId | INDEX | Tenant query |
| agentExecutions | (agentId, status) | INDEX | Agent monitoring |
| modelConfigs | (organizationId, motor) | INDEX | Motor model lookup |
| modelConfigs | (organizationId, motor, taskType) WHERE isDefault | UNIQUE | One default per task type |
| pipelineDefinitions | motor | UNIQUE | Motor lookup |

---

## 10. Migration Strategy

### Step 1: New Migration
Create a new Drizzle migration that:
1. Drops all existing tables and enums (clean slate)
2. Creates all 9 new tables (excluding Better Auth's 4)
3. Creates all indexes

### Step 2: Better Auth Setup
Configure Better Auth with Drizzle adapter. Better Auth creates its 4 tables automatically on first startup.

### Step 3: Seed Data
New seed script creates:
- Demo user (via Better Auth)
- Demo organization ("CriteriaFilms")
- Membership (demo user as owner)
- Video motor enabled for demo org
- Video pipeline definition in `pipelineDefinitions`
- Demo project with initial brief

### Step 4: Code Updates
- Rewrite `src/db/schema.ts` with new table definitions
- Rewrite `src/shared/types.ts` — string unions instead of enums
- Update orchestrator to read pipeline from DB
- Rewrite API routes with new structure + middleware
- Update CLI to work with new schema
- Update agent runtime to include `organizationId`

---

## 11. Validation (Zod Schemas)

Key Zod schemas for API input validation:

```typescript
// Create project
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  motor: z.string().min(1).max(50),
  projectType: z.string().min(1).max(50),
  brief: z.record(z.unknown()).optional(),
});

// Update org
const updateOrgSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  brandAssets: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});

// Invite member
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),  // owner is auto-assigned
});

// Update motor
const updateMotorSchema = z.object({
  enabled: z.boolean().optional(),
  autonomyMode: z.enum(['ai_decides', 'ai_recommends']).optional(),
  settings: z.record(z.unknown()).optional(),
});

// Gate override
const gateOverrideSchema = z.object({
  decision: z.enum(['pass', 'fail']),
  notes: z.string().optional(),
});

// Query params
const listProjectsSchema = z.object({
  motor: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

---

## 12. Table Count Summary

| Category | Tables | Owner |
|----------|--------|-------|
| Auth | 4 (user, session, account, verification) | Better Auth |
| Multi-tenancy | 3 (organizations, memberships, motors) | Us |
| Core platform | 5 (projects, artifacts, gateReviews, agentExecutions, modelConfigs) | Us |
| Pipeline config | 1 (pipelineDefinitions) | Us |
| **Total** | **13 tables** | 4 BA + 9 ours |

---

## 13. Related Documents

- `TECH_ARCHITECTURE.md` — Stack decisions, communication architecture
- `SESSION_CONTEXT.md` — Complete project context
- `PRODUCTION_PIPELINE.md` — Video motor pipeline (10 steps, 5 gates)
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Security framework
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — 24-motor architecture
