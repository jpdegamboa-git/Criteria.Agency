import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  CompetitorConfig,
  RawCompetitorSignal,
  CompetitiveReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class CompetitiveListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: CompetitorConfig): Promise<ListenerStepResult> {
    const competitorNames = config.competitors.map((c) => c.name).join(", ");
    const signals = (await this.stubFactory.fetch(
      "competitor-intelligence",
      {
        competitors: config.competitors,
        channelsToWatch: config.channelsToWatch,
      },
      `Generate 8-12 competitive intelligence signals about these competitors: ${competitorNames}. Each must have: competitorName, signalType (campaign|product|pricing|hiring|pr|content|partnership), title, description, source, url, timestamp, impact (high|medium|low), metadata. Mark as "synthetic data".`,
    )) as RawCompetitorSignal[];

    return { step: "collect", status: "completed", data: signals };
  }

  async analyze(signals: unknown): Promise<ListenerStepResult> {
    const signalArray = signals as RawCompetitorSignal[];
    const signalsSummary = signalArray
      .map((s) => `[${s.competitorName}/${s.signalType}] ${s.title}: ${s.description} (impact:${s.impact})`)
      .join("\n");

    const result = await generateText(
      MODEL,
      "You are a competitive intelligence analyst. Identify gaps and positioning shifts, output structured JSON.",
      `Analyze these competitive signals and produce JSON with:
- competitorActivity: array of {competitor, signals (originals), summary}
- gaps: array of {area, description, opportunity}
- positioningShifts: array of strings

Signals:
${signalsSummary}

Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { competitorActivity: [], gaps: [], positioningShifts: [] };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as Partial<CompetitiveReport>;
    const report = await generateText(
      MODEL,
      "You are a competitive intelligence report writer. Write in Spanish (Latin American).",
      `Generate a Competitive Intelligence Report in markdown based on:
${JSON.stringify(data)}

Include: activity summary per competitor, gaps identified, positioning shifts, recommended responses.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "report", status: "completed", data: data, artifactContent: report };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<CompetitiveReport>;
    const alertsFired: string[] = [];

    if (data.competitorActivity) {
      for (const activity of data.competitorActivity) {
        const highImpact = (activity.signals ?? []).filter((s: any) => s.impact === "high");
        if (highImpact.length > 0) alertsFired.push(`competitor-high-impact-${activity.competitor}`);
      }
    }

    return { step: "alert_eval", status: "completed", data: { alertsFired: alertsFired.length, alerts: alertsFired } };
  }

  buildStepFns(config: CompetitorConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
