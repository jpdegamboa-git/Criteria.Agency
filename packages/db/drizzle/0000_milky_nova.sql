CREATE TABLE "agent_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(50) NOT NULL,
	"permission" varchar(100) NOT NULL,
	"scope" varchar(50) DEFAULT 'motor' NOT NULL,
	"constraints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motor_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"motor" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"triggered_by" varchar(50) NOT NULL,
	"inngest_event_id" varchar(255),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "motors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"motor" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"autonomy_mode" varchar(20) DEFAULT 'ai_recommends' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"plan" varchar(20) DEFAULT 'starter' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "output_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_motor" varchar(50) NOT NULL,
	"source_agent_id" varchar(50),
	"output_type" varchar(50) NOT NULL,
	"content_ref" uuid NOT NULL,
	"summary" text NOT NULL,
	"summary_embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(50) NOT NULL,
	"skill_id" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"system_prompt" text NOT NULL,
	"knowledge_base_ref" text,
	"model" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"data_sensitivity" varchar(10) DEFAULT 'C' NOT NULL,
	"approved_providers" jsonb DEFAULT '["anthropic"]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "motor_executions" ADD CONSTRAINT "motor_executions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motors" ADD CONSTRAINT "motors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "output_registry" ADD CONSTRAINT "output_registry_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_perm_agent_perm_idx" ON "agent_permissions" USING btree ("agent_id","permission");--> statement-breakpoint
CREATE INDEX "motor_exec_org_idx" ON "motor_executions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "motor_exec_motor_status_idx" ON "motor_executions" USING btree ("motor","status");--> statement-breakpoint
CREATE UNIQUE INDEX "motors_org_motor_idx" ON "motors" USING btree ("organization_id","motor");--> statement-breakpoint
CREATE INDEX "output_reg_org_idx" ON "output_registry" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "output_reg_org_motor_idx" ON "output_registry" USING btree ("organization_id","source_motor");--> statement-breakpoint
CREATE INDEX "output_reg_type_idx" ON "output_registry" USING btree ("output_type");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_reg_agent_skill_ver_idx" ON "prompt_registry" USING btree ("agent_id","skill_id","version");--> statement-breakpoint
CREATE INDEX "prompt_reg_agent_skill_active_idx" ON "prompt_registry" USING btree ("agent_id","skill_id","active");