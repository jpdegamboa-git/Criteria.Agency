# ADR-001: Migrate project status from PostgreSQL enum to varchar

## Status: Proposed

## Context

The `projectStatusEnum` in `src/db/schema.ts` currently holds 65+ values covering every step
across all registered pipelines (video-production, brand-builder, strategist, graphic-design,
writers-room, audio, web, marketplace, print-production, events, ads, community-management,
email-marketing, seo-content, channel-manager, sales-crm, financial, analytics, security, and
shared statuses).

Every time a new motor (pipeline) is registered, its steps must be added to the PostgreSQL enum
via `ALTER TYPE project_status ADD VALUE`. This creates significant migration friction:

- `ALTER TYPE ... ADD VALUE` cannot run inside a transaction in PostgreSQL, requiring careful
  migration orchestration and downtime risk.
- The enum definition in `schema.ts` must be kept in sync with `pipeline-registry.ts` manually;
  drift causes DB errors (the validator schema drift fixed in B.6 is a direct consequence of this).
- Adding a new motor to the platform requires a coordinated DB migration before the pipeline code
  can be deployed — slowing iteration speed.
- Drizzle ORM regenerates the full enum literal type on every schema change, causing noisy diffs.

## Decision

Migrate `projectStatusEnum` (and its column `projects.status`) from a PostgreSQL `pgEnum` to
`varchar(50)`, with app-level validation enforced by `PipelineRegistry`:

- The DB column becomes `varchar(50) NOT NULL DEFAULT 'brief'`.
- Validity of status values is checked at the application layer via
  `PipelineRegistry.getSteps(pipelineType)` before any write.
- An optional PostgreSQL `CHECK` constraint (`status IN (...)`) is intentionally omitted for now,
  because it would reintroduce the same migration friction for every new motor. App-level
  validation via `PipelineRegistry` is the single source of truth.
- The `resumeProjectSchema` validator in `src/api/validators.ts` continues to enumerate all valid
  values explicitly (already fixed in B.6), which provides a Zod-level safeguard at the API
  boundary.

## Consequences

**Pros:**
- New pipelines can be registered in `pipeline-registry.ts` and deployed without any DB migration.
- Removes the `ALTER TYPE ... ADD VALUE` anti-pattern entirely.
- Eliminates enum drift between DB schema and validator — both read from `PipelineRegistry`.
- Simplifies Drizzle schema: no pgEnum to maintain for status.
- Opens the door to multi-tenant custom pipelines in the future.

**Cons:**
- DB-level enforcement is weaker; an invalid status could be inserted by a bug that bypasses
  app-layer validation (e.g., a raw SQL script or a migration).
- Existing rows are valid — but the migration must backfill `NULL` or default values safely.
- Query performance on `status` is unchanged (index on varchar performs identically to enum
  for equality lookups).
- `projectStatusEnum` in schema.ts is still referenced by `artifactStepEnum` and other enums
  that overlap in value names; those are separate and must not be affected.

## Migration Plan

Execute before Phase E starts adding more motors (currently planned at Phase E kickoff):

1. **Create migration:** `ALTER TABLE projects ALTER COLUMN status TYPE varchar(50)` —
   PostgreSQL allows this cast from enum to varchar directly with no data loss.
2. **Drop the enum type:** `DROP TYPE project_status` after confirming no other columns reference it.
3. **Update `src/db/schema.ts`:** Replace `projectStatusEnum("status")` with
   `varchar("status", { length: 50 })` on the `projects` table.
4. **Remove `export const projectStatusEnum`** from schema.ts.
5. **Update `resumeProjectSchema`** in `validators.ts` to derive valid values from
   `PipelineRegistry` at runtime instead of a hardcoded enum (longer-term improvement).
6. **Run full test suite** to confirm no regressions.

This migration should be performed in a single coordinated deploy: schema change + app deploy
together, since the old enum column is compatible with varchar reads from the app.
