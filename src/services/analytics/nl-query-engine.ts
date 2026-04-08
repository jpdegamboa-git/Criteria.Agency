// src/services/analytics/nl-query-engine.ts

import { db, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import { queryMetrics } from "./data-collector.js";
import type { NLQueryResult, DateRange, AnalyticsStepResult } from "./types.js";

const STRATEGIC_MODEL = "claude-sonnet-4-5";
const FLASH_MODEL = "gemini-2.5-flash";

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
    }
    return fallback;
  }
}

interface StructuredQuery {
  metrics: string[];
  dateRange: DateRange;
  dimensions: string[];
  comparison: boolean;
}

/**
 * Translate a natural language question into a structured query.
 */
async function translateQuestion(question: string): Promise<StructuredQuery> {
  const today = new Date().toISOString().split("T")[0];
  const raw = await generateText(
    FLASH_MODEL,
    `Eres un traductor de consultas de marketing. Convierte preguntas en español a queries estructurados.
Hoy es ${today}. Responde SOLO en JSON:
{
  "metrics": ["spend", "clicks", "conversions", "roas", "impressions", "cac", "ltv", "leads", "revenue"],
  "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "dimensions": [],
  "comparison": false
}
Métricas disponibles: spend, impressions, clicks, conversions, roas, cpc, cpm, sessions, page_views, bounce_rate, organic_traffic, leads, revenue, cac, ltv, agent_executions, agent_cost_usd.`,
    question,
    500,
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return parseJsonSafe<StructuredQuery>(raw, {
    metrics: ["spend", "revenue"],
    dateRange: { start: thirtyDaysAgo, end: today },
    dimensions: [],
    comparison: false,
  });
}

/**
 * Generate a natural language answer from query results.
 */
async function generateAnswer(
  question: string,
  structuredQuery: StructuredQuery,
  data: Record<string, number>,
): Promise<{ answer: string; followUpSuggestions: string[] }> {
  const dataStr = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ");

  const raw = await generateText(
    STRATEGIC_MODEL,
    `Eres un analista de marketing que responde preguntas en español de forma clara y concisa.
Responde en JSON: { "answer": "...", "followUpSuggestions": ["...", "..."] }
- La respuesta debe ser directa, con números y contexto
- Incluye 2-3 sugerencias de preguntas de seguimiento
- Usa formato de moneda para dinero ($X,XXX)
- Usa porcentajes cuando sea relevante`,
    `Pregunta: ${question}\nQuery: ${JSON.stringify(structuredQuery)}\nDatos: ${dataStr}`,
    800,
  );

  return parseJsonSafe(raw, {
    answer: `Datos encontrados: ${dataStr}`,
    followUpSuggestions: [],
  });
}

/**
 * Process a natural language query end-to-end.
 */
export async function processNLQuery(
  clientId: string,
  question: string,
): Promise<NLQueryResult> {
  // Step 1: Translate to structured query
  const structuredQuery = await translateQuestion(question);

  // Step 2: Execute query
  const metrics = await queryMetrics(clientId, structuredQuery.metrics, structuredQuery.dateRange);

  // Aggregate data
  const aggregated: Record<string, number> = {};
  for (const m of metrics) {
    aggregated[m.metric] = (aggregated[m.metric] ?? 0) + m.value;
  }

  // Step 3: Generate NL answer
  const { answer, followUpSuggestions } = await generateAnswer(question, structuredQuery, aggregated);

  // Step 4: Calculate confidence based on data availability
  const requestedMetrics = structuredQuery.metrics.length;
  const foundMetrics = Object.keys(aggregated).length;
  const confidence = requestedMetrics > 0 ? Math.min(foundMetrics / requestedMetrics, 1) : 0.5;

  const result: NLQueryResult = {
    answer,
    data: aggregated,
    confidence: Math.round(confidence * 100) / 100,
    followUpSuggestions,
  };

  // Save to history
  await db.insert(schema.nlQueries).values({
    clientId,
    question,
    answer: result.answer,
    data: result.data,
    confidence: String(result.confidence),
  });

  return result;
}

/**
 * Get query history for a client.
 */
export async function getQueryHistory(clientId: string): Promise<unknown[]> {
  return db
    .select()
    .from(schema.nlQueries)
    .where(eq(schema.nlQueries.clientId, clientId));
}

/**
 * Record feedback for a query.
 */
export async function recordQueryFeedback(
  queryId: string,
  feedback: "helpful" | "not_helpful",
): Promise<void> {
  await db
    .update(schema.nlQueries)
    .set({ feedback })
    .where(eq(schema.nlQueries.id, queryId));
}

/**
 * Wrapper returning AnalyticsStepResult.
 */
export async function runNLQuery(
  clientId: string,
  question: string,
): Promise<AnalyticsStepResult> {
  const result = await processNLQuery(clientId, question);
  return {
    step: "an_analyze",
    status: "completed",
    data: result,
    artifactContent: result.answer,
  };
}
