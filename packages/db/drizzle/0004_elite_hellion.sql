CREATE TABLE "client_intelligence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"insights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_intelligence_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "marketing_plan_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"plan_id" uuid,
	"source" varchar(20) DEFAULT 'plan' NOT NULL,
	"funnel_stage" varchar(30) NOT NULL,
	"channel_type" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"concept" text NOT NULL,
	"objective" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"audiences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"funnel_matrix_distribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"budget" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calendar" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expected_kpis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"justification" text DEFAULT '' NOT NULL,
	"confidence_source" varchar(20) DEFAULT 'industry' NOT NULL,
	"creative_suggestion" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'proposed' NOT NULL,
	"g4_passed" boolean DEFAULT false NOT NULL,
	"g5_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"g6_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"g6_notes" text,
	"linked_campaign_id" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"diagnosis_id" uuid,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"audiences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"value_proposition" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"media_plan" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"budget_allocation" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"g1_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"g1_feedback" text,
	"g2_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"g2_feedback" text,
	"g3_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"g3_notes" text,
	"g1_iterations" integer DEFAULT 0 NOT NULL,
	"g2_iterations" integer DEFAULT 0 NOT NULL,
	"inngest_run_id" varchar(255),
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_intelligence_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry" varchar(100) NOT NULL,
	"region" varchar(50) DEFAULT 'LATAM' NOT NULL,
	"business_size" varchar(20) DEFAULT 'any' NOT NULL,
	"channel" varchar(50) DEFAULT 'any' NOT NULL,
	"format" varchar(50) DEFAULT 'any' NOT NULL,
	"funnel_stage" varchar(30) DEFAULT 'any' NOT NULL,
	"messaging_type" varchar(30) DEFAULT 'any' NOT NULL,
	"metric" varchar(50) NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"value_min" numeric(15, 4),
	"value_max" numeric(15, 4),
	"source" varchar(30) DEFAULT 'industry_benchmark' NOT NULL,
	"confidence" varchar(10) DEFAULT 'low' NOT NULL,
	"n" integer DEFAULT 0 NOT NULL,
	"temporal_window" varchar(20) DEFAULT '2025' NOT NULL,
	"trend" varchar(20) DEFAULT 'unknown' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"triggered_by" varchar(100) NOT NULL,
	"diagnosis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"iteration_count" integer DEFAULT 0 NOT NULL,
	"inngest_run_id" varchar(255),
	"completed_at" timestamp,
	"escalated_at" timestamp,
	"escalation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_intelligence" ADD CONSTRAINT "client_intelligence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plan_campaigns" ADD CONSTRAINT "marketing_plan_campaigns_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plan_campaigns" ADD CONSTRAINT "marketing_plan_campaigns_plan_id_marketing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."marketing_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plan_campaigns" ADD CONSTRAINT "marketing_plan_campaigns_linked_campaign_id_campaigns_id_fk" FOREIGN KEY ("linked_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plans" ADD CONSTRAINT "marketing_plans_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plans" ADD CONSTRAINT "marketing_plans_diagnosis_id_strategic_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."strategic_diagnoses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_diagnoses" ADD CONSTRAINT "strategic_diagnoses_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ci_org_idx" ON "client_intelligence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "mpc_org_idx" ON "marketing_plan_campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "mpc_org_status_idx" ON "marketing_plan_campaigns" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "mpc_plan_idx" ON "marketing_plan_campaigns" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "mpc_org_funnel_idx" ON "marketing_plan_campaigns" USING btree ("organization_id","funnel_stage","channel_type");--> statement-breakpoint
CREATE INDEX "mplan_org_idx" ON "marketing_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "mplan_org_status_idx" ON "marketing_plans" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "pi_industry_idx" ON "platform_intelligence_benchmarks" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "pi_industry_channel_idx" ON "platform_intelligence_benchmarks" USING btree ("industry","channel");--> statement-breakpoint
CREATE INDEX "pi_industry_metric_idx" ON "platform_intelligence_benchmarks" USING btree ("industry","metric");--> statement-breakpoint
CREATE INDEX "pi_channel_funnel_idx" ON "platform_intelligence_benchmarks" USING btree ("channel","funnel_stage");--> statement-breakpoint
CREATE INDEX "diag_org_idx" ON "strategic_diagnoses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "diag_org_status_idx" ON "strategic_diagnoses" USING btree ("organization_id","status");