import type { ListenerType } from "@/shared/engine-types";

// ── Brand Listener Types ──

export interface RawMention {
  source: string;
  text: string;
  author: string;
  url: string;
  timestamp: string;
  engagement: { likes: number; shares: number; comments: number };
  metadata: Record<string, unknown>;
}

export interface BrandConfig {
  clientId: string;
  brandNames: string[];
  socialHandles: string[];
  competitors: string[];
  keywords: string[];
  languages: string[];
  regions: string[];
}

export interface BrandHealthReport {
  overallSentiment: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number; mixed: number };
  volumeVsBaseline: number;
  topTopics: Array<{ topic: string; count: number; sentiment: number }>;
  notableMentions: RawMention[];
  crisisSignals: string[];
  summary: string;
}

// ── Culture Listener Types ──

export interface RawTrend {
  topic: string;
  description: string;
  source: string;
  region: string;
  category: "social_movement" | "viral_meme" | "cultural_event" | "industry_shift";
  volume: number;
  velocity: number;
  timestamp: string;
  sampleContent: string[];
}

export interface CultureConfig {
  clientId: string;
  industries: string[];
  audienceDemographics: {
    ageRange: [number, number];
    regions: string[];
    interests: string[];
  };
  languages: string[];
}

export interface CulturePulseReport {
  topTrends: Array<{ trend: RawTrend; relevanceScore: number; suggestedAngle: string }>;
  riskTopics: string[];
  contentOpportunities: string[];
  summary: string;
}

// ── Industry Listener Types ──

export interface RawIntelligence {
  title: string;
  summary: string;
  source: string;
  sourceType: "publication" | "patent" | "regulation" | "conference" | "news";
  url: string;
  publishDate: string;
  relevantEntities: string[];
  metadata: Record<string, unknown>;
}

export interface IndustryConfig {
  clientId: string;
  primaryIndustry: string;
  subSectors: string[];
  keyPlayers: string[];
  technologies: string[];
  regions: string[];
}

export interface IndustryReport {
  topSignals: Array<{ signal: RawIntelligence; impactScore: number; category: string; implications: string }>;
  innovationMap: string[];
  regulatoryChanges: string[];
  marketShifts: string[];
  summary: string;
}

// ── Competitive Listener Types ──

export interface RawCompetitorSignal {
  competitorName: string;
  signalType: "campaign" | "product" | "pricing" | "hiring" | "pr" | "content" | "partnership";
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: string;
  impact: "high" | "medium" | "low";
  metadata: Record<string, unknown>;
}

export interface CompetitorConfig {
  clientId: string;
  competitors: Array<{
    name: string;
    website: string;
    socialHandles: Record<string, string>;
    industry: string;
  }>;
  channelsToWatch: string[];
}

export interface CompetitiveReport {
  competitorActivity: Array<{ competitor: string; signals: RawCompetitorSignal[]; summary: string }>;
  gaps: Array<{ area: string; description: string; opportunity: string }>;
  positioningShifts: string[];
  summary: string;
}

// ── Opportunity Agent Types ──

export interface ScoredOpportunity {
  id: string;
  title: string;
  description: string;
  sources: ListenerType[];
  brandFit: number;
  audienceRelevance: number;
  timeSensitivity: "hours" | "days" | "weeks";
  effortRequired: "low" | "medium" | "high";
  expectedImpact: "low" | "medium" | "high";
  overallScore: number;
  suggestedMotors: string[];
  suggestedTimeline: string;
}

export interface OpportunityFeed {
  opportunities: ScoredOpportunity[];
  priorityAlerts: ScoredOpportunity[];
  summary: string;
}

// ── Listener Step Result ──

export interface ListenerStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
  error?: string;
}

// ── Provider Interface ──

export interface IntelligenceProvider<TConfig, TOutput> {
  name: string;
  fetch(config: TConfig): Promise<TOutput[]>;
  isAvailable(): boolean;
}
