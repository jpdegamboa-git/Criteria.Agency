-- Change output_registry.summary_embedding from vector(1536) to vector(768)
-- Reason: switched embedding provider from OpenAI text-embedding-3-small (1536-dim)
-- to Google Gemini text-embedding-004 (768-dim). DEC-151: summaries are Tier C.
-- Safe to drop existing data — no production embeddings exist yet.
ALTER TABLE "output_registry" DROP COLUMN IF EXISTS "summary_embedding";--> statement-breakpoint
ALTER TABLE "output_registry" ADD COLUMN "summary_embedding" vector(768);
