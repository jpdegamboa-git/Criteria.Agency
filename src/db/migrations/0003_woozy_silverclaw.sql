CREATE TYPE "public"."entity_type" AS ENUM('client', 'vendor', 'personal', 'bank', 'government', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."invoice_direction" AS ENUM('issued', 'received');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'partial', 'paid', 'overdue', 'canceled');--> statement-breakpoint
CREATE TABLE "business_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "entity_type" DEFAULT 'unknown' NOT NULL,
	"client_id" uuid,
	"patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_category" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"direction" "invoice_direction" NOT NULL,
	"entity_id" uuid NOT NULL,
	"invoice_number" varchar(100),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"file_path" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "entity_id" uuid;--> statement-breakpoint
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_invoices" ADD CONSTRAINT "transaction_invoices_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_invoices" ADD CONSTRAINT "transaction_invoices_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;