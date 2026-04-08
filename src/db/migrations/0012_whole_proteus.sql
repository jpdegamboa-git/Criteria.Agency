CREATE TYPE "public"."follow_up_status" AS ENUM('scheduled', 'sent', 'opened', 'replied', 'bounced', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."perception_tracking_status" AS ENUM('on_track', 'at_risk', 'off_track');--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_perception_audit' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_gap_analysis' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_positioning_definition' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_validation' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_current_audit' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_target_definition' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_transition_plan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_phase_design' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'po_execution_monitoring' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'po-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'po-g2';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_perception_audit' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_gap_analysis' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_positioning_definition' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_validation' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_current_audit' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_target_definition' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_transition_plan' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_phase_design' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'po_execution_monitoring' BEFORE 'delivered';--> statement-breakpoint
CREATE TABLE "analytics_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"metric" varchar(100) NOT NULL,
	"value" numeric(14, 4) NOT NULL,
	"dimensions" jsonb DEFAULT '{}',
	"source" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"dashboard_type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid,
	"lead_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"channel" varchar(30) NOT NULL,
	"content" text,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"replied_at" timestamp,
	"status" "follow_up_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"period_start" varchar(10) NOT NULL,
	"period_end" varchar(10) NOT NULL,
	"content" jsonb NOT NULL,
	"rendered_markdown" text,
	"delivered_via" jsonb,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_touchpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"campaign" varchar(200),
	"content" varchar(200),
	"medium" varchar(50),
	"interaction" varchar(50) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nl_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"data" jsonb,
	"confidence" numeric(3, 2),
	"feedback" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "perception_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"repositioning_project_id" uuid,
	"phase" integer NOT NULL,
	"measurement_date" timestamp NOT NULL,
	"metrics" jsonb NOT NULL,
	"status" "perception_tracking_status" DEFAULT 'on_track' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"component" varchar(20) NOT NULL,
	"signal" varchar(100) NOT NULL,
	"points" integer NOT NULL,
	"condition" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_touchpoints" ADD CONSTRAINT "lead_touchpoints_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perception_tracking" ADD CONSTRAINT "perception_tracking_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perception_tracking" ADD CONSTRAINT "perception_tracking_repositioning_project_id_projects_id_fk" FOREIGN KEY ("repositioning_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_rules" ADD CONSTRAINT "scoring_rules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_metrics_lookup" ON "analytics_metrics" USING btree ("client_id","metric","date");--> statement-breakpoint
CREATE INDEX "idx_analytics_metrics_source" ON "analytics_metrics" USING btree ("client_id","source","date");--> statement-breakpoint
CREATE INDEX "follow_ups_lead_id_idx" ON "follow_ups" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "follow_ups_status_idx" ON "follow_ups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_touchpoints_lead_id_idx" ON "lead_touchpoints" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "perception_tracking_client_id_idx" ON "perception_tracking" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "perception_tracking_project_id_idx" ON "perception_tracking" USING btree ("repositioning_project_id");--> statement-breakpoint
CREATE INDEX "scoring_rules_client_id_idx" ON "scoring_rules" USING btree ("client_id");