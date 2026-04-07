import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  CultureConfig,
  RawTrend,
  CulturePulseReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class CultureListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: CultureConfig): Promise<ListenerStepResult> {
    const trends = (await this.stubFactory.fetch(
      "cultural-trends",
      {
        industries: config.industries,
        demographics: config.audienceDemographics,
        regions: config.audienceDemographics.regions,
        languages: config.languages,
      },
      `Generate 8-12 trending cultural topics relevant to ${config.industries.join(", ")} in ${config.audienceDemographics.regions.join(", ")}. Each must have: topic, description, source, region, category (social_movement|viral_meme|cultural_event|industry_shift), volume (0-100), velocity (% change), timestamp, sampleContent array. Mark as "synthetic data".`,
    )) as RawTrend[];

    return { step: "collect", status: "completed", data: trends };
  }

  async analyze(trends: unknown): Promise<ListenerStepResult> {
    const trendArray = trends as RawTrend[];
    const trendsSummary = trendArray
      .map((t) => `[${t.category}] ${t.topic}: ${t.description} (vol:${t.volume}, vel:${t.velocity}%)`)
      .join("\n");

    const result = await generateText(
      MODEL,
      "You are a cultural trend analyst. Score trends for brand relevance and output structured JSON.",
      `Analyze these cultural trends and produce JSON with:
- topTrends: array of {trend (the original object), relevanceScore (0-100), suggestedAngle (string)}
- riskTopics: array of strings (topics to avoid)
- contentOpportunities: array of strings

Trends:
${trendsSummary}

Respond ONLY with valid JSON.`,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = { topTrends: [], riskTopics: [], contentOpportunities: [] };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as Partial<CulturePulseReport>;
    const report = await generateText(
      MODEL,
      "You are a culture pulse report writer. Write in Spanish (Latin American).",
      `Generate a Culture Pulse Report in markdown based on:
${JSON.stringify(data)}

Include: top trends with relevance, content opportunities, risk topics to avoid, recommendations.
Mark as "SYNTHETIC DATA — no live monitoring active".`,
    );

    return { step: "report", status: "completed", data: data, artifactContent: report };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<CulturePulseReport>;
    const alertsFired: string[] = [];

    if (data.topTrends) {
      const highRelevance = data.topTrends.filter((t: any) => (t.relevanceScore ?? 0) > 80);
      if (highRelevance.length > 0) alertsFired.push("high-relevance-trend");
    }

    return { step: "alert_eval", status: "completed", data: { alertsFired: alertsFired.length, alerts: alertsFired } };
  }

  buildStepFns(config: CultureConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
