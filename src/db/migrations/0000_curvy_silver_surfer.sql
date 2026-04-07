CREATE TYPE "public"."artifact_step" AS ENUM('brief', 'concept', 'script', 'visual_look', 'storyboard', 'video_gen', 'edit', 'audio', 'polish', 'delivery', 'model_config', 'gate_review');--> statement-breakpoint
CREATE TYPE "public"."artifact_type" AS ENUM('document', 'image', 'video', 'audio', 'subtitle', 'package');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."gate_decision" AS ENUM('pass', 'fail');--> statement-breakpoint
CREATE TYPE "public"."gate_type" AS ENUM('g1', 'g2', 'g3', 'g4', 'g5');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('brief', 'concept', 'script', 'visual_look', 'storyboard', 'video_gen', 'edit', 'audio', 'polish', 'delivered', 'paused');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('corporate', 'explainer', 'documentary', 'fiction', 'micro_content', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('text_gen', 'image_gen', 'video_gen', 'audio_voice', 'audio_music', 'audio_sfx');--> statement-breakpoint
CREATE TABLE "agent_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"agent_id" varchar(20) NOT NULL,
	"step" varchar(50) NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" "execution_status" NOT NULL,
	"input_artifact_ids" jsonb DEFAULT '[]'::jsonb,
	"output_artifact_ids" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"cost" jsonb DEFAULT '{}'::jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"step" "artifact_step" NOT NULL,
	"type" "artifact_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"storage_path" text NOT NULL,
	"created_by_agent" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"brand_assets" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"gate" "gate_type" NOT NULL,
	"iteration" integer DEFAULT 1 NOT NULL,
	"decision" "gate_decision" NOT NULL,
	"reviewer" varchar(20) NOT NULL,
	"scores" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_type" "task_type" NOT NULL,
	"recommended_model" varchar(100) NOT NULL,
	"recommended_by" varchar(20) NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"cost_estimate" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "project_type" NOT NULL,
	"status" "project_status" DEFAULT 'brief' NOT NULL,
	"current_gate" "gate_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_reviews" ADD CONSTRAINT "gate_reviews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_configs" ADD CONSTRAINT "model_configs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;