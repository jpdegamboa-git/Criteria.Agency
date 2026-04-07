import { generateText } from "@/providers/generate-text.js";
import { db, schema } from "@/db/index.js";
import { eq, and, desc } from "drizzle-orm";
import type { ListenerType } from "@/shared/engine-types";
import type { ScoredOpportunity, OpportunityFeed, ListenerStepResult } from "./types.js";

const MODEL = "gemini-2.5-flash";
const LISTENER_TYPES: ListenerType[] = ["brand", "culture", "industry", "competitive"];

export class OpportunityAgent {
  async aggregate(clientId: string): Promise<ListenerStepResult> {
    const reports: Record<string, unknown> = {};

    for (const type of LISTENER_TYPES) {
      const [latest] = await db
        .select()
        .from(schema.continuousAgentRuns)
        .where(
          and(
            eq(schema.continuousAgentRuns.clientId, clientId),
            eq(schema.continuousAgentRuns.listenerType, type),
            eq(schema.continuousAgentRuns.step, "report"),
            eq(schema.continuousAgentRuns.status, "completed"),
          ),
        )
        .orderBy(desc(schema.continuousAgentRuns.completedAt))
        .limit(1);

      reports[type] = latest?.outputData ?? null;
    }

    return { step: "aggregate", status: "completed", data: reports };
  }

  async evaluate(aggregatedData: unknown): Promise<ListenerStepResult> {
    const reports = aggregatedData as Record<string, unknown>;
    const result = await generateText(
      MODEL,
      "You are an opportunity detection agent. Find intersections between listener reports and score them.",
      `Given these intelligence reports from 4 listeners, identify actionable marketing opportunities.

Brand Report: ${JSON.stringify(reports.brand ?? "No data")}
Culture Report: ${JSON.stringify(reports.culture ?? "No data")}
Industry Report: ${JSON.stringify(reports.industry ?? "No data")}
Competitive Report: ${JSON.stringify(reports.competitive ?? "No data")}

Produce a JSON object with:
- opportunities: array of {id (opp-N), title, description, sources (which listeners), brandFit (0-100), audienceRelevance (0-100), timeSensitivity (hours|days|weeks), effortRequired (low|medium|high), expectedImpact (low|medium|high), overallScore (0-100), suggestedMotors (array of motor names), suggestedTimeline}

Find 3-7 opportunities. Score honestly. Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { opportunities: [] };
    }

    return { step: "evaluate", status: "completed", data: parsed.opportunities ?? [] };
  }

  async generate(scoredOpportunities: unknown): Promise<ListenerStepResult> {
    const opportunities = scoredOpportunities as ScoredOpportunity[];
    const topOpps = opportunities.filter((o) => o.overallScore > 70);

    if (topOpps.length === 0) {
      return {
        step: "generate",
        status: "completed",
        data: opportunities,
        artifactContent: "# Opportunity Feed\n\nNo hay oportunidades con score superior a 70 en este ciclo.\n\n*SYNTHETIC DATA — no live monitoring active*",
      };
    }

    const report = await generateText(
      MODEL,
      "You are an opportunity brief writer. Write in Spanish (Latin American).",
      `Generate an Opportunity Feed report in markdown for these top opportunities:
${JSON.stringify(topOpps)}

For each opportunity, write a brief action section: what to do, which motors to activate, suggested timeline.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "generate", status: "completed", data: opportunities, artifactContent: report };
  }

  async prioritize(opportunities: unknown): Promise<ListenerStepResult> {
    const opps = opportunities as ScoredOpportunity[];
    const sorted = [...opps].sort((a, b) => b.overallScore - a.overallScore);
    const priorityAlerts = sorted.filter(
      (o) => o.timeSensitivity === "hours" || o.overallScore > 85,
    );

    const feed: OpportunityFeed = {
      opportunities: sorted,
      priorityAlerts,
      summary: `${sorted.length} oportunidades detectadas, ${priorityAlerts.length} requieren acción inmediata.`,
    };

    return { step: "prioritize", status: "completed", data: feed };
  }

  buildStepFns(clientId: string): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      aggregate: () => this.aggregate(clientId),
      evaluate: (input) => this.evaluate(input),
      generate: (input) => this.generate(input),
      prioritize: (input) => this.prioritize(input),
    };
  }
}
