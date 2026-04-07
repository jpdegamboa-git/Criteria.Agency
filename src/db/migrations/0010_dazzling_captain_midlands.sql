CREATE TYPE "public"."connection_type" AS ENUM('pipeline', 'manual');--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'discovery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'research' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'positioning' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'identity' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'brand_dna' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'diagnostic' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'objectives' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'audiences' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'value_prop' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'media_plan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'budget' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'briefs' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'discovery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'research' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'positioning' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'identity' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'brand_dna' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'diagnostic' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'objectives' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'audiences' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'value_prop' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'media_plan' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'budget' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'briefs' BEFORE 'delivered';--> statement-breakpoint
CREATE TABLE "agent_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_agent_id" varchar(20) NOT NULL,
	"target_agent_id" varchar(20) NOT NULL,
	"type" "connection_type" DEFAULT 'pipeline' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_node_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(20) NOT NULL,
	"x" numeric(10, 2) DEFAULT '0' NOT NULL,
	"y" numeric(10, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_node_positions_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
ALTER TABLE "gate_reviews" ALTER COLUMN "gate" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "current_gate" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "pipeline_type" varchar(50) DEFAULT 'video-production' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "parent_project_id" uuid;--> statement-breakpoint
CREATE INDEX "agent_connections_source_idx" ON "agent_connections" USING btree ("source_agent_id");--> statement-breakpoint
CREATE INDEX "agent_connections_target_idx" ON "agent_connections" USING btree ("target_agent_id");