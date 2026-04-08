ALTER TYPE "public"."gate_type" ADD VALUE 'sk-g1';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sk_decompose' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sk_dispatch' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sk_monitor' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sk_consolidate' BEFORE 'delivered';--> statement-breakpoint
CREATE TABLE "agent_capacity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"concurrent_agents" integer NOT NULL,
	"queue_depth" integer NOT NULL,
	"agents_by_status" jsonb,
	"avg_response_time_ms" integer,
	"error_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "asset_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"client_id" text NOT NULL,
	"type" varchar(30) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"original_context" jsonb NOT NULL,
	"performance" jsonb DEFAULT '{"timesUsed":0,"channels":[],"engagement":null}'::jsonb,
	"adaptations" jsonb DEFAULT '[]'::jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"brief_project_id" uuid,
	"brand_dna_project_id" uuid,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"shared_context" jsonb NOT NULL,
	"budget" jsonb,
	"sub_projects" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_registry" ADD CONSTRAINT "asset_registry_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_registry" ADD CONSTRAINT "asset_registry_client_id_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_client_id_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brief_project_id_projects_id_fk" FOREIGN KEY ("brief_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_dna_project_id_projects_id_fk" FOREIGN KEY ("brand_dna_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_asset_registry_client" ON "asset_registry" USING btree ("client_id");