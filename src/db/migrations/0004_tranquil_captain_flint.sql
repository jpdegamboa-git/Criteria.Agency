CREATE TYPE "public"."waitlist_status" AS ENUM('pending', 'nurturing', 'invited', 'converted');--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"video_type" varchar(100),
	"company_size" varchar(50),
	"source" varchar(100) DEFAULT 'landing' NOT NULL,
	"status" "waitlist_status" DEFAULT 'pending' NOT NULL,
	"nurture_step" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entries_email_unique" UNIQUE("email")
);
