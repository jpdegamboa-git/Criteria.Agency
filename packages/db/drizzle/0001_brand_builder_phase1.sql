CREATE TABLE "brand_dna" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"current_layer" integer DEFAULT 0 NOT NULL,
	"onboarding_path" varchar(1),
	"status" varchar(20) DEFAULT 'onboarding' NOT NULL,
	"fundamentos_score" integer DEFAULT 0 NOT NULL,
	"previous_snapshot" jsonb,
	"previous_snapshot_at" timestamp,
	"previous_snapshot_trigger" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_dna_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "brand_dna_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_dna_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"layer" integer NOT NULL,
	"artifact_type" varchar(60) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"previous_content" jsonb,
	"trigger_context" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_health_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"fundamentos" integer DEFAULT 0 NOT NULL,
	"ejecucion" integer,
	"oportunidad" integer,
	"total_score" integer DEFAULT 0 NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_dna" ADD CONSTRAINT "brand_dna_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_dna_artifacts" ADD CONSTRAINT "brand_dna_artifacts_brand_dna_id_brand_dna_id_fk" FOREIGN KEY ("brand_dna_id") REFERENCES "public"."brand_dna"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_dna_artifacts" ADD CONSTRAINT "brand_dna_artifacts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_health_scores" ADD CONSTRAINT "brand_health_scores_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_dna_org_idx" ON "brand_dna" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "brand_artifact_dna_idx" ON "brand_dna_artifacts" USING btree ("brand_dna_id");--> statement-breakpoint
CREATE INDEX "brand_artifact_org_layer_idx" ON "brand_dna_artifacts" USING btree ("organization_id","layer");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_artifact_org_type_idx" ON "brand_dna_artifacts" USING btree ("organization_id","artifact_type");--> statement-breakpoint
CREATE INDEX "bhs_org_idx" ON "brand_health_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bhs_org_date_idx" ON "brand_health_scores" USING btree ("organization_id","calculated_at");