CREATE TABLE "campaign_kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"channel" varchar(50) NOT NULL,
	"period" timestamp NOT NULL,
	"impressions" integer,
	"clicks" integer,
	"ctr" numeric(8, 4),
	"cpm" numeric(10, 4),
	"cpc" numeric(10, 4),
	"conversions" integer,
	"roas" numeric(10, 4),
	"engagement_rate" numeric(8, 4),
	"spend" numeric(12, 4),
	"raw_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deltas" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"phase" varchar(20) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"funnel_stage" varchar(30) NOT NULL,
	"channel_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'definition' NOT NULL,
	"objectives" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"budget" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"video_project_id" uuid,
	"brief" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threshold_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"campaign_id" uuid,
	"alert_type" varchar(30) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"metric" varchar(50) NOT NULL,
	"metric_value" numeric(15, 4),
	"threshold" numeric(15, 4),
	"deviation_pct" numeric(8, 4),
	"channel" varchar(50),
	"period" timestamp,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"qualified_severity" varchar(20),
	"qualified_assessment" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"qualified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_kpis" ADD CONSTRAINT "campaign_kpis_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_kpis" ADD CONSTRAINT "campaign_kpis_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_scores" ADD CONSTRAINT "campaign_scores_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_scores" ADD CONSTRAINT "campaign_scores_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_video_project_id_video_projects_id_fk" FOREIGN KEY ("video_project_id") REFERENCES "public"."video_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threshold_alerts" ADD CONSTRAINT "threshold_alerts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threshold_alerts" ADD CONSTRAINT "threshold_alerts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kpi_campaign_idx" ON "campaign_kpis" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "kpi_org_channel_idx" ON "campaign_kpis" USING btree ("organization_id","channel");--> statement-breakpoint
CREATE INDEX "kpi_campaign_period_idx" ON "campaign_kpis" USING btree ("campaign_id","period");--> statement-breakpoint
CREATE INDEX "cscore_campaign_idx" ON "campaign_scores" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "cscore_org_phase_idx" ON "campaign_scores" USING btree ("organization_id","phase");--> statement-breakpoint
CREATE INDEX "campaign_org_idx" ON "campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "campaign_org_status_idx" ON "campaigns" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "campaign_org_funnel_idx" ON "campaigns" USING btree ("organization_id","funnel_stage","channel_type");--> statement-breakpoint
CREATE INDEX "alert_org_idx" ON "threshold_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alert_org_status_idx" ON "threshold_alerts" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "alert_campaign_idx" ON "threshold_alerts" USING btree ("campaign_id");