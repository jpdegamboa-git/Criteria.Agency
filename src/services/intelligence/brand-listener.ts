import { generateText } from "@/providers/generate-text.js";
import { StubProviderFactory } from "../stub-provider-factory.js";
import type {
  BrandConfig,
  RawMention,
  BrandHealthReport,
  ListenerStepResult,
} from "./types.js";

const MODEL = "gemini-2.5-flash";

export class BrandListener {
  private stubFactory: StubProviderFactory;

  constructor() {
    this.stubFactory = new StubProviderFactory((prompt) =>
      generateText(MODEL, "You are a synthetic data generator.", prompt),
    );
  }

  async collect(config: BrandConfig): Promise<ListenerStepResult> {
    const mentions = (await this.stubFactory.fetch(
      "social-mentions",
      {
        brandNames: config.brandNames,
        socialHandles: config.socialHandles,
        regions: config.regions,
        languages: config.languages,
      },
      `Generate 10-15 realistic social media mentions for "${config.brandNames[0]}". Mix: 60% positive, 25% neutral, 15% negative. Each mention must have: source, text, author, url, timestamp (ISO 8601), engagement (likes/shares/comments), metadata. Mark as "synthetic data — no live monitoring active".`,
    )) as RawMention[];

    return { step: "collect", status: "completed", data: mentions };
  }

  async analyze(mentions: unknown): Promise<ListenerStepResult> {
    const mentionArray = mentions as RawMention[];
    const mentionsSummary = mentionArray
      .map((m) => `[${m.source}] ${m.author}: "${m.text}" (likes:${m.engagement.likes})`)
      .join("\n");

    const analysisPrompt = `Analyze these brand mentions and produce a JSON object with:
- overallSentiment (0-100)
- sentimentBreakdown (positive/neutral/negative/mixed as percentages)
- volumeVsBaseline (multiplier, 1.0 = normal)
- topTopics (array of {topic, count, sentiment})
- notableMentions (indices of most important mentions)
- crisisSignals (array of crisis-related strings, empty if none)

Mentions:
${mentionsSummary}

Respond ONLY with valid JSON.`;

    const result = await generateText(
      MODEL,
      "You are a brand sentiment analyst. Analyze mentions and output structured JSON.",
      analysisPrompt,
    );

    let parsed;
    try {
      const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenceMatch ? fenceMatch[1].trim() : result.trim());
    } catch {
      parsed = {
        overallSentiment: 70,
        sentimentBreakdown: { positive: 60, neutral: 25, negative: 10, mixed: 5 },
        volumeVsBaseline: 1.0,
        topTopics: [],
        notableMentions: [],
        crisisSignals: [],
      };
    }

    return { step: "analyze", status: "completed", data: parsed };
  }

  async report(analysisData: unknown): Promise<ListenerStepResult> {
    const data = analysisData as BrandHealthReport;
    const reportPrompt = `Generate a Brand Health Report in markdown based on this analysis:
${JSON.stringify(data)}

Include:
- Overall brand health score
- Sentiment breakdown
- Volume vs baseline
- Top topics
- Notable mentions
- Crisis signals (if any)
- Recommendations

Use Spanish (Latin American). Mark as "SYNTHETIC DATA — no live monitoring active".`;

    const report = await generateText(
      "gemini-2.5-flash",
      "You are a brand health report writer. Write in Spanish (Latin American).",
      reportPrompt,
    );

    return {
      step: "report",
      status: "completed",
      data: data,
      artifactContent: report,
    };
  }

  async alertEval(reportData: unknown): Promise<ListenerStepResult> {
    const data = reportData as Partial<BrandHealthReport>;
    const alertsFired: string[] = [];

    if (data.overallSentiment !== undefined && data.overallSentiment < 30) {
      alertsFired.push("critical-low-sentiment");
    }
    if (data.crisisSignals && data.crisisSignals.length > 0) {
      alertsFired.push("crisis-detected");
    }
    if (data.volumeVsBaseline !== undefined && data.volumeVsBaseline > 3) {
      alertsFired.push("volume-spike");
    }

    return {
      step: "alert_eval",
      status: "completed",
      data: { alertsFired: alertsFired.length, alerts: alertsFired },
    };
  }

  buildStepFns(config: BrandConfig): Record<string, (input: unknown) => Promise<ListenerStepResult>> {
    return {
      collect: () => this.collect(config),
      analyze: (input) => this.analyze(input),
      report: (input) => this.report(input),
      alert_eval: (input) => this.alertEval(input),
    };
  }
}
