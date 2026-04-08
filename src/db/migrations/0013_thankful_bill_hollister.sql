ALTER TYPE "public"."gate_type" ADD VALUE 'bu-g1';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'bu_allocation' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'bu_spend_tracking' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'bu_vendor_validation' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'bu_roi_calculation' BEFORE 'delivered';--> statement-breakpoint
CREATE TABLE "campaign_pnl" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"campaign_name" varchar(255) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"revenue" jsonb DEFAULT '{}'::jsonb,
	"costs" jsonb DEFAULT '{}'::jsonb,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_spend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"budget_id" uuid,
	"campaign_name" varchar(255) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"source" varchar(50) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"contact_info" jsonb DEFAULT '{}'::jsonb,
	"score" jsonb,
	"notes" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_budget" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"strategy" varchar(20) DEFAULT 'balanced' NOT NULL,
	"allocations" jsonb DEFAULT '[]'::jsonb,
	"constraints" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"service_description" text NOT NULL,
	"quoted_price" numeric(10, 2) NOT NULL,
	"market_rate" jsonb,
	"verdict" varchar(20),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_pnl" ADD CONSTRAINT "campaign_pnl_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_spend" ADD CONSTRAINT "campaign_spend_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_spend" ADD CONSTRAINT "campaign_spend_budget_id_marketing_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."marketing_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_vendors" ADD CONSTRAINT "client_vendors_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_budgets" ADD CONSTRAINT "marketing_budgets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_quotations" ADD CONSTRAINT "vendor_quotations_vendor_id_client_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."client_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_quotations" ADD CONSTRAINT "vendor_quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_pnl_client" ON "campaign_pnl" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_pnl_period" ON "campaign_pnl" USING btree ("client_id","period_start");--> statement-breakpoint
CREATE INDEX "idx_campaign_spend_lookup" ON "campaign_spend" USING btree ("client_id","budget_id","date");--> statement-breakpoint
CREATE INDEX "idx_campaign_spend_channel" ON "campaign_spend" USING btree ("client_id","channel","date");--> statement-breakpoint
CREATE INDEX "idx_client_vendors_client" ON "client_vendors" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_vendors_category" ON "client_vendors" USING btree ("client_id","category");--> statement-breakpoint
CREATE INDEX "idx_marketing_budgets_client" ON "marketing_budgets" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_marketing_budgets_period" ON "marketing_budgets" USING btree ("client_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_vendor_quotations_vendor" ON "vendor_quotations" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_quotations_client" ON "vendor_quotations" USING btree ("client_id");