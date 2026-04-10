CREATE TABLE "video_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"step" varchar(50) NOT NULL,
	"artifact_type" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"r2_key" text,
	"gate_iteration" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_gate_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"gate_number" integer NOT NULL,
	"iteration_number" integer NOT NULL,
	"showrunner_verdict" varchar(20),
	"showrunner_reasoning" text,
	"showrunner_feedback" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"brand_guardian_verdict" varchar(20),
	"brand_guardian_reasoning" text,
	"brand_guardian_fix_guidance" text,
	"combined_verdict" varchar(20) DEFAULT 'pending' NOT NULL,
	"client_approval_status" varchar(20) DEFAULT 'na' NOT NULL,
	"client_approval_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"status" varchar(30) DEFAULT 'brief_intake' NOT NULL,
	"current_step" varchar(50) DEFAULT 'brief_intake' NOT NULL,
	"brief" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"autonomy_mode" varchar(20) DEFAULT 'ai_recommends' NOT NULL,
	"inngest_run_id" varchar(255),
	"gate_iterations" jsonb DEFAULT '{"g1":0,"g2":0,"g3":0,"g4":0,"g5":0}'::jsonb NOT NULL,
	"escalated_at" timestamp,
	"escalation_reason" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_artifacts" ADD CONSTRAINT "video_artifacts_project_id_video_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."video_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_artifacts" ADD CONSTRAINT "video_artifacts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_gate_reviews" ADD CONSTRAINT "video_gate_reviews_project_id_video_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."video_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_gate_reviews" ADD CONSTRAINT "video_gate_reviews_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_projects" ADD CONSTRAINT "video_projects_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_artifact_project_idx" ON "video_artifacts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "video_artifact_org_step_idx" ON "video_artifacts" USING btree ("organization_id","step");--> statement-breakpoint
CREATE INDEX "video_artifact_project_step_version_idx" ON "video_artifacts" USING btree ("project_id","step","version");--> statement-breakpoint
CREATE INDEX "video_gate_project_idx" ON "video_gate_reviews" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "video_gate_project_gate_idx" ON "video_gate_reviews" USING btree ("project_id","gate_number");--> statement-breakpoint
CREATE INDEX "video_proj_org_idx" ON "video_projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "video_proj_org_status_idx" ON "video_projects" USING btree ("organization_id","status");