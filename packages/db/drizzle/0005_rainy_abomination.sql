CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"meta_description" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_name" varchar(100),
	"inngest_run_id" varchar(255),
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"page_id" uuid,
	"step" varchar(50) NOT NULL,
	"artifact_type" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"r2_key" text,
	"gate_iteration" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_gate_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"gate_number" integer NOT NULL,
	"iteration_number" integer NOT NULL,
	"cd_verdict" varchar(20),
	"cd_reasoning" text,
	"cd_feedback" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bg_verdict" varchar(20),
	"bg_reasoning" text,
	"bg_fix_guidance" text,
	"qa_report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"combined_verdict" varchar(20) DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_iteration_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"gate_number" integer NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"leader_adjustment_active" boolean DEFAULT false NOT NULL,
	"escalated" boolean DEFAULT false NOT NULL,
	"escalated_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"page_type" varchar(30) NOT NULL,
	"hierarchy_position" integer DEFAULT 0 NOT NULL,
	"parent_page_id" uuid,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"current_copy_version" integer,
	"current_design_version" integer,
	"current_code_version" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"site_type" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'brief_intake' NOT NULL,
	"current_step" varchar(50) DEFAULT 'brief_intake' NOT NULL,
	"mode" varchar(20) DEFAULT 'project' NOT NULL,
	"autonomy_mode" varchar(20) DEFAULT 'ai_recommends' NOT NULL,
	"brief" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"inngest_run_id" varchar(255),
	"gate_iterations" jsonb DEFAULT '{"g1":0,"g2":0,"g3":0}'::jsonb NOT NULL,
	"live_url" text,
	"escalated_at" timestamp,
	"escalation_reason" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_project_id_web_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."web_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_artifacts" ADD CONSTRAINT "web_artifacts_project_id_web_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."web_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_artifacts" ADD CONSTRAINT "web_artifacts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_artifacts" ADD CONSTRAINT "web_artifacts_page_id_web_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."web_pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_gate_results" ADD CONSTRAINT "web_gate_results_project_id_web_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."web_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_gate_results" ADD CONSTRAINT "web_gate_results_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_iteration_tracking" ADD CONSTRAINT "web_iteration_tracking_project_id_web_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."web_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_iteration_tracking" ADD CONSTRAINT "web_iteration_tracking_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_pages" ADD CONSTRAINT "web_pages_project_id_web_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."web_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_pages" ADD CONSTRAINT "web_pages_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_projects" ADD CONSTRAINT "web_projects_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_project_idx" ON "blog_posts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "blog_post_org_status_idx" ON "blog_posts" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "blog_post_project_slug_idx" ON "blog_posts" USING btree ("project_id","slug");--> statement-breakpoint
CREATE INDEX "web_artifact_project_idx" ON "web_artifacts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "web_artifact_org_step_idx" ON "web_artifacts" USING btree ("organization_id","step");--> statement-breakpoint
CREATE INDEX "web_artifact_project_step_version_idx" ON "web_artifacts" USING btree ("project_id","step","version");--> statement-breakpoint
CREATE INDEX "web_gate_project_idx" ON "web_gate_results" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "web_gate_project_gate_idx" ON "web_gate_results" USING btree ("project_id","gate_number");--> statement-breakpoint
CREATE INDEX "web_iter_project_gate_idx" ON "web_iteration_tracking" USING btree ("project_id","gate_number");--> statement-breakpoint
CREATE INDEX "web_page_project_idx" ON "web_pages" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "web_page_org_idx" ON "web_pages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "web_proj_org_idx" ON "web_projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "web_proj_org_status_idx" ON "web_projects" USING btree ("organization_id","status");