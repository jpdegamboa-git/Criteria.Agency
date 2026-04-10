/**
 * Output Registry — Fase 3 (DEC-130, DEC-151)
 *
 * Shared infrastructure for indexing and searching agent outputs.
 * Uses pgvector for semantic search over summary embeddings.
 *
 * Security rules (DEC-151):
 *  - Summary-only embeddings (not full content)
 *  - Pre-filter by tenant (organizationId) before any vector similarity search
 *  - contentRef is UUID only — callers must resolve via the source motor's own API
 *
 * Consumers:
 *  - Brand Builder: indexes Brand DNA artifacts after each layer completes
 *  - Video Motor: indexes video pipeline artifacts after delivery
 *  - MARA (Fase 6): semantic search before invoking new agent calls
 */

import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Database } from '@criteria/db';
import { outputRegistry } from '@criteria/db';
import { createProvider, MODELS } from '../ai.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndexOutputInput {
  organizationId: string;
  sourceMotor: string;         // brand-builder | video-motor | strategist | ...
  sourceAgentId?: string;      // which agent produced it
  outputType: string;          // brand-dna-layer-0 | video-script | video-final | ...
  contentRef: string;          // UUID of the source record (brand_dna_artifacts.id, video_artifacts.id, etc.)
  summary: string;             // human-readable summary for embedding
  metadata?: Record<string, unknown>;
}

export interface OutputSearchResult {
  id: string;
  sourceMotor: string;
  sourceAgentId: string | null;
  outputType: string;
  contentRef: string;
  summary: string;
  similarity: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ListOutputsInput {
  organizationId: string;
  sourceMotor?: string;
  outputType?: string;
  limit?: number;
}

// ─── Embedding generation ─────────────────────────────────────────────────────

/**
 * Generate a 768-dim embedding for the given text.
 * Uses Google Gemini text-embedding-004 (Tier C — public summaries only, per DEC-151).
 * Summaries contain no confidential Brand DNA content.
 *
 * Falls back to null (no embedding) when GOOGLE_GEMINI_API_KEY is not configured.
 * Records stored without embeddings are excluded from vector search but remain
 * accessible via the non-semantic listOutputs() fallback.
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[output-registry] GOOGLE_AI_API_KEY not set — storing output without embedding');
    }
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      },
    );

    if (!response.ok) {
      console.error('[output-registry] Gemini embedding API error:', response.status);
      return null;
    }

    const data = await response.json() as { embedding: { values: number[] } };
    return data.embedding?.values ?? null;
  } catch (err) {
    console.error('[output-registry] Embedding generation failed:', err);
    return null;
  }
}

// ─── Index output ─────────────────────────────────────────────────────────────

/**
 * Index a new agent output in the Output Registry.
 * Generates and stores a summary embedding for semantic search.
 */
export async function indexOutput(db: Database, input: IndexOutputInput): Promise<string> {
  const embedding = await generateEmbedding(input.summary);

  const [inserted] = await db
    .insert(outputRegistry)
    .values({
      organizationId: input.organizationId,
      sourceMotor: input.sourceMotor,
      sourceAgentId: input.sourceAgentId ?? null,
      outputType: input.outputType,
      contentRef: input.contentRef,
      summary: input.summary,
      summaryEmbedding: embedding ?? undefined,
      metadata: input.metadata ?? {},
    })
    .returning({ id: outputRegistry.id });

  return inserted.id;
}

// ─── Semantic search ──────────────────────────────────────────────────────────

/**
 * Search the Output Registry by semantic similarity.
 *
 * Security: always pre-filters by organizationId (DEC-151).
 * Returns up to `limit` results ordered by cosine similarity.
 * Records without embeddings are excluded from vector search.
 */
export async function searchOutputs(
  db: Database,
  organizationId: string,
  query: string,
  options: {
    sourceMotor?: string;
    outputType?: string;
    limit?: number;
    similarityThreshold?: number;
  } = {},
): Promise<OutputSearchResult[]> {
  const { limit = 10, similarityThreshold = 0.5 } = options;

  const queryEmbedding = await generateEmbedding(query);

  if (!queryEmbedding) {
    // No embedding available — fall back to listing recent outputs without vector ranking
    return listOutputsFallback(db, organizationId, options);
  }

  // pgvector cosine similarity search (1 - cosine_distance = cosine_similarity)
  // Pre-filter by tenant first for security (DEC-151)
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  const rows = await db.execute(sql`
    SELECT
      id,
      source_motor,
      source_agent_id,
      output_type,
      content_ref,
      summary,
      metadata,
      created_at,
      1 - (summary_embedding <=> ${vectorStr}::vector) AS similarity
    FROM output_registry
    WHERE
      organization_id = ${organizationId}
      ${options.sourceMotor ? sql`AND source_motor = ${options.sourceMotor}` : sql``}
      ${options.outputType ? sql`AND output_type = ${options.outputType}` : sql``}
      AND summary_embedding IS NOT NULL
      AND 1 - (summary_embedding <=> ${vectorStr}::vector) >= ${similarityThreshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `);

  return (rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    sourceMotor: row.source_motor as string,
    sourceAgentId: row.source_agent_id as string | null,
    outputType: row.output_type as string,
    contentRef: row.content_ref as string,
    summary: row.summary as string,
    similarity: row.similarity as number,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: (row.created_at as Date).toISOString(),
  }));
}

// ─── List outputs (non-semantic fallback) ─────────────────────────────────────

async function listOutputsFallback(
  db: Database,
  organizationId: string,
  options: { sourceMotor?: string; outputType?: string; limit?: number },
): Promise<OutputSearchResult[]> {
  // Build where condition without spread (Drizzle doesn't accept spread in and())
  let where = eq(outputRegistry.organizationId, organizationId) as ReturnType<typeof eq> | ReturnType<typeof and>;
  if (options.sourceMotor) {
    where = and(where, eq(outputRegistry.sourceMotor, options.sourceMotor))!;
  }
  if (options.outputType) {
    where = and(where, eq(outputRegistry.outputType, options.outputType))!;
  }

  const rows = await db
    .select()
    .from(outputRegistry)
    .where(where)
    .orderBy(desc(outputRegistry.createdAt))
    .limit(options.limit ?? 10);

  return rows.map((row) => ({
    id: row.id,
    sourceMotor: row.sourceMotor,
    sourceAgentId: row.sourceAgentId ?? null,
    outputType: row.outputType,
    contentRef: row.contentRef,
    summary: row.summary,
    similarity: 0, // no similarity score in fallback
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listOutputs(
  db: Database,
  input: ListOutputsInput,
): Promise<OutputSearchResult[]> {
  return listOutputsFallback(db, input.organizationId, {
    sourceMotor: input.sourceMotor,
    outputType: input.outputType,
    limit: input.limit,
  });
}
