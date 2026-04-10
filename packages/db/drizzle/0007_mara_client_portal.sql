-- Migration 0007: MARA + Client Portal tables
-- Fase 6: mara_play_pause, mara_sessions, mara_messages

--> statement-breakpoint
CREATE TABLE "mara_play_pause" (
  "organization_id" text PRIMARY KEY NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "play_mode" boolean NOT NULL DEFAULT false,
  "invocations_this_period" integer NOT NULL DEFAULT 0,
  "session_budget" integer NOT NULL DEFAULT 5,
  "period_resets_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
CREATE TABLE "mara_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "user_id" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "invocations_used" integer NOT NULL DEFAULT 0,
  "summary" text,
  "summary_meta" jsonb NOT NULL DEFAULT '{}',
  "ui_context" jsonb NOT NULL DEFAULT '{}',
  "started_at" timestamp NOT NULL DEFAULT now(),
  "ended_at" timestamp
);

--> statement-breakpoint
CREATE TABLE "mara_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "mara_sessions" ("id") ON DELETE CASCADE,
  "organization_id" text NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "role" varchar(10) NOT NULL,
  "content" text NOT NULL,
  "intent_category" varchar(30),
  "routed_to" varchar(50),
  "output_registry_hit" boolean NOT NULL DEFAULT false,
  "tokens_consumed" integer NOT NULL DEFAULT 0,
  "ui_context" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
CREATE INDEX "mara_session_org_idx" ON "mara_sessions" ("organization_id");
CREATE INDEX "mara_session_org_status_idx" ON "mara_sessions" ("organization_id", "status");
CREATE INDEX "mara_session_org_user_idx" ON "mara_sessions" ("organization_id", "user_id");
CREATE INDEX "mara_msg_session_idx" ON "mara_messages" ("session_id");
CREATE INDEX "mara_msg_org_idx" ON "mara_messages" ("organization_id");
