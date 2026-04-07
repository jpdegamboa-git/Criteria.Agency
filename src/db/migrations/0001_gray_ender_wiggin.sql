CREATE TYPE "public"."comment_author" AS ENUM('client', 'criteria');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('draft', 'delivered', 'in_review', 'revision_requested', 'approved');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('starter', 'pro');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"author" "comment_author" NOT NULL,
	"author_name" varchar(255),
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"client_email" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "company" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "subscription_tier" "subscription_tier";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "subscription_status" "subscription_status";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "early_adopter_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "delivery_status" "delivery_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "current_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;