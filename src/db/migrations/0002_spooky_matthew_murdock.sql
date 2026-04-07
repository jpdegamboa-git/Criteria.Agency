CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'approved', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('linkedin_post', 'email_nurture', 'blog_article', 'social_caption', 'landing_copy');--> statement-breakpoint
CREATE TYPE "public"."copilot_phase" AS ENUM('understand', 'define', 'confirm');--> statement-breakpoint
CREATE TYPE "public"."copilot_session_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."expected_payment_status" AS ENUM('pending', 'reconciled', 'overdue', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."rule_match_type" AS ENUM('contains', 'exact', 'regex');--> statement-breakpoint
CREATE TYPE "public"."rule_source" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('csv_import', 'conexion_bg', 'stripe', 'manual');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer', 'fee');--> statement-breakpoint
CREATE TABLE "bank_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"transactions_found" integer DEFAULT 0 NOT NULL,
	"transactions_new" integer DEFAULT 0 NOT NULL,
	"transactions_reconciled" integer DEFAULT 0 NOT NULL,
	"status" "sync_status" NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "categorization_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern" varchar(255) NOT NULL,
	"match_type" "rule_match_type" DEFAULT 'contains' NOT NULL,
	"category" varchar(50) NOT NULL,
	"subcategory" varchar(50),
	"transaction_type" "transaction_type" NOT NULL,
	"source" "rule_source" DEFAULT 'manual' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"alias" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "content_type" NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"brief" jsonb DEFAULT '{}'::jsonb,
	"content" text,
	"title" varchar(255),
	"meta" jsonb DEFAULT '{}'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"revision_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copilot_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"status" "copilot_session_status" DEFAULT 'active' NOT NULL,
	"project_type" varchar(50),
	"current_phase" "copilot_phase" DEFAULT 'understand' NOT NULL,
	"current_question" integer DEFAULT 1 NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"generated_brief" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expected_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"description" varchar(255) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "expected_payment_status" DEFAULT 'pending' NOT NULL,
	"reconciled_transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" varchar(50) DEFAULT 'main' NOT NULL,
	"external_id" varchar(255),
	"date" timestamp NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"description" text NOT NULL,
	"counterparty_name" varchar(255),
	"reference" varchar(255),
	"category" varchar(50),
	"subcategory" varchar(50),
	"type" "transaction_type",
	"source" "transaction_source" NOT NULL,
	"reconciled" integer DEFAULT 0 NOT NULL,
	"reconciled_with_id" uuid,
	"client_id" uuid,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "client_aliases" ADD CONSTRAINT "client_aliases_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_sessions" ADD CONSTRAINT "copilot_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expected_payments" ADD CONSTRAINT "expected_payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;