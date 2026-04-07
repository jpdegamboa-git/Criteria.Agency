import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  IndustryConfig,
  RawIntelligence,
  IndustryReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class IndustryListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: IndustryConfig): Promise<ListenerStepResult> {
    const signals = (await this.stubFactory.fetch(
      "industry-intelligence",
      {
        industry: config.primaryIndustry,
        subSectors: config.subSectors,
        keyPlayers: config.keyPlayers,
        technologies: config.technologies,
        regions: config.regions,
      },
      `Generate 8-12 industry intelligence signals for "${config.primaryIndustry}" covering: publications, patents, regulations, conferences, news. Each must have: title, summary, source, sourceType (publication|patent|regulation|conference|news), url, publishDate, relevantEntities, metadata. Mark as "synthetic data".`,
    )) as RawIntelligence[];

    return { step: "collect", status: "completed", data: signals };
  }

  async analyze(signals: unknown): Promise<ListenerStepResult> {
    const signalArray = signals as RawIntelligence[];
    const signalsSummary = signalArray
      .map((s) => `[${s.sourceType}] ${s.title}: ${s.summary}`)
      .join("\n");

    const result = await generateText(
      MODEL,
      "You are an industry intelligence analyst. Categorize and score signals, output structured JSON.",
      `Analyze these industry signals and produce JSON with:
- topSignals: array of {signal (original), impactScore (0-100), category (innovation|regulation|market_shift|ma|threat), implications (string)}
- innovationMap: array of innovation descriptions
- regulatoryChanges: array of regulation summaries
- marketShifts: array of market shift descriptions

Signals:
${signalsSummary}

Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { topSignals: [], innovationMap: [], regulatoryChanges: [], marketShifts: [] };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as Partial<IndustryReport>;
    const report = await generateText(
      MODEL,
      "You are an industry intelligence report writer. Write in Spanish (Latin American).",
      `Generate an Industry Intelligence Report in markdown based on:
${JSON.stringify(data)}

Include: top signals with impact, innovation map, regulatory changes, market shifts, strategic implications.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "report", status: "completed", data: data, artifactContent: report };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<IndustryReport>;
    const alertsFired: string[] = [];

    if (data.regulatoryChanges && data.regulatoryChanges.length > 0) {
      alertsFired.push("regulatory-change-detected");
    }
    if (data.topSignals) {
      const highImpact = data.topSignals.filter((s: any) => (s.impactScore ?? 0) > 80);
      if (highImpact.length > 0) alertsFired.push("high-impact-signal");
    }

    return { step: "alert_eval", status: "completed", data: { alertsFired: alertsFired.length, alerts: alertsFired } };
  }

  buildStepFns(config: IndustryConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
