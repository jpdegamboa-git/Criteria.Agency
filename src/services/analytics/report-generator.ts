// src/services/analytics/report-generator.ts

import { db, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { generateText } from "../../providers/generate-text.js";
import { queryMetrics } from "./data-collector.js";
import type { AutomatedReport, ReportType, ReportSection, ReportMetric, DateRange, AnalyticsStepResult } from "./types.js";

const FLASH_MODEL = "gemini-2.5-flash";
const STRATEGIC_MODEL = "claude-sonnet-4-5";

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

/**
 * Build metrics comparison between two periods.
 */
async function buildMetricsComparison(
  clientId: string,
  currentPeriod: DateRange,
  previousPeriod: DateRange,
  metricNames: string[],
): Promise<ReportMetric[]> {
  const current = await queryMetrics(clientId, metricNames, currentPeriod);
  const previous = await queryMetrics(clientId, metricNames, previousPeriod);

  const currentTotals: Record<string, number> = {};
  const previousTotals: Record<string, number> = {};

  for (const m of current) {
    currentTotals[m.metric] = (currentTotals[m.metric] ?? 0) + m.value;
  }
  for (const m of previous) {
    previousTotals[m.metric] = (previousTotals[m.metric] ?? 0) + m.value;
  }

  return metricNames.map((name) => {
    const value = currentTotals[name] ?? 0;
    const previousValue = previousTotals[name] ?? 0;
    const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
    const positiveIsGood = !["spend", "cpc", "bounce_rate", "cac"].includes(name);
    return {
      name,
      value: Math.round(value * 100) / 100,
      previousValue: Math.round(previousValue * 100) / 100,
      change: Math.round(change * 100) / 100,
      trend: change > 1 ? "up" : change < -1 ? "down" : "flat",
      isGood: positiveIsGood ? change >= 0 : change <= 0,
    };
  });
}

/**
 * Generate AI insights for a report section.
 */
async function generateInsights(
  metrics: ReportMetric[],
  reportType: ReportType,
): Promise<{ insights: string[]; recommendations: string[] }> {
  const metricsStr = metrics
    .map((m) => `${m.name}: ${m.value} (${m.change > 0 ? "+" : ""}${m.change}% vs anterior)`)
    .join("\n");

  const raw = await generateText(
    FLASH_MODEL,
    "Eres un analista de marketing. Genera insights en español sobre métricas de marketing. Responde en JSON: { \"insights\": [\"...\"], \"recommendations\": [\"...\"] }",
    `Tipo de reporte: ${reportType}\nMétricas:\n${metricsStr}\n\nGenera 2-3 insights y 1-2 recomendaciones.`,
    1000,
  );

  return parseJsonSafe(raw, { insights: [], recommendations: [] });
}

/**
 * Generate an automated report.
 */
export async function generateReport(
  clientId: string,
  type: ReportType,
  period: DateRange,
): Promise<AutomatedReport> {
  // Calculate previous period (same duration)
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  const previousPeriod: DateRange = {
    start: prevStart.toISOString().split("T")[0],
    end: prevEnd.toISOString().split("T")[0],
  };

  const coreMetrics = ["spend", "impressions", "clicks", "conversions", "roas"];
  const metrics = await buildMetricsComparison(clientId, period, previousPeriod, coreMetrics);
  const { insights, recommendations } = await generateInsights(metrics, type);

  const sections: ReportSection[] = [
    {
      title: "Resumen de rendimiento",
      metrics,
      insights,
      recommendations,
    },
  ];

  // Generate executive summary
  const summaryRaw = await generateText(
    STRATEGIC_MODEL,
    "Eres el director de analytics de una agencia de marketing. Escribe un resumen ejecutivo de 2-3 oraciones en español.",
    `Métricas del periodo ${period.start} a ${period.end}:\n${metrics.map(m => `${m.name}: ${m.value} (${m.trend})`).join(", ")}`,
    300,
  );

  const report: AutomatedReport = {
    clientId,
    type,
    period,
    sections,
    executiveSummary: summaryRaw.trim(),
    generatedAt: new Date().toISOString(),
  };

  // Save to DB
  await db.insert(schema.generatedReports).values({
    clientId,
    type,
    periodStart: period.start,
    periodEnd: period.end,
    content: report,
    renderedMarkdown: formatReportMarkdown(report),
  });

  return report;
}

/**
 * Format report as markdown.
 */
function formatReportMarkdown(report: AutomatedReport): string {
  const lines: string[] = [
    `# Reporte ${report.type} — ${report.period.start} a ${report.period.end}`,
    "",
    `> ${report.executiveSummary}`,
    "",
  ];

  for (const section of report.sections) {
    lines.push(`## ${section.title}`, "");
    lines.push("| Métrica | Valor | Cambio | Tendencia |");
    lines.push("|---------|-------|--------|-----------|");
    for (const m of section.metrics) {
      const arrow = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→";
      lines.push(`| ${m.name} | ${m.value} | ${m.change > 0 ? "+" : ""}${m.change}% | ${arrow} |`);
    }
    lines.push("");
    if (section.insights.length > 0) {
      lines.push("### Insights", "");
      for (const i of section.insights) lines.push(`- ${i}`);
      lines.push("");
    }
    if (section.recommendations.length > 0) {
      lines.push("### Recomendaciones", "");
      for (const r of section.recommendations) lines.push(`- ${r}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * List generated reports for a client.
 */
export async function listReports(clientId: string): Promise<unknown[]> {
  return db
    .select()
    .from(schema.generatedReports)
    .where(eq(schema.generatedReports.clientId, clientId));
}

/**
 * Get a specific report by ID.
 */
export async function getReport(reportId: string): Promise<unknown | null> {
  const [report] = await db
    .select()
    .from(schema.generatedReports)
    .where(eq(schema.generatedReports.id, reportId));
  return report ?? null;
}

/**
 * Wrapper returning AnalyticsStepResult.
 */
export async function runReportGeneration(
  clientId: string,
  type: ReportType,
  period: DateRange,
): Promise<AnalyticsStepResult> {
  const report = await generateReport(clientId, type, period);
  return {
    step: "an_visualize",
    status: "completed",
    data: report,
    artifactContent: formatReportMarkdown(report),
  };
}
