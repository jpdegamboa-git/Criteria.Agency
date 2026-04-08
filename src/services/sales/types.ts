// ── Lead Enrichment Types ──

export interface CompanyData {
  name: string;
  domain: string;
  industry: string;
  employeeCount: number | null;
  annualRevenue: string | null;
  techStack: string[];
  socialProfiles: Record<string, string>;
  description: string;
  location: { country: string; city: string };
}

export interface ContactData {
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  seniority: "c-level" | "vp" | "director" | "manager" | "individual" | "unknown";
}

export interface LeadSource {
  channel: string;
  campaign: string | null;
  medium: string | null;
  content: string | null;
  timestamp: string;
}

// ── Scoring Types ──

export interface LeadScore {
  total: number;
  components: {
    fit: number;
    intent: number;
    authority: number;
    timing: number;
  };
  tier: "hot" | "warm" | "cold" | "unqualified";
  reasoning: string;
  lastUpdated: string;
}

export type ScoreComponent = "fit" | "intent" | "authority" | "timing";

export const SCORE_CAPS: Record<ScoreComponent, number> = {
  fit: 40,
  intent: 30,
  authority: 15,
  timing: 15,
};

export const TIER_THRESHOLDS = {
  hot: 75,
  warm: 50,
  cold: 25,
} as const;

export function classifyTier(score: number): LeadScore["tier"] {
  if (score >= TIER_THRESHOLDS.hot) return "hot";
  if (score >= TIER_THRESHOLDS.warm) return "warm";
  if (score >= TIER_THRESHOLDS.cold) return "cold";
  return "unqualified";
}

// ── Pipeline Types ──

export type PipelineStage = "new" | "contacted" | "qualified" | "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export const STALE_THRESHOLDS: Record<string, number> = {
  new: 3,
  contacted: 5,
  qualified: 7,
  discovery: 10,
  proposal: 14,
  negotiation: 14,
};

// ── Follow-up Types ──

export type FollowUpType = "outreach" | "follow_up_1" | "follow_up_2" | "nurture" | "check_in";
export type FollowUpStatus = "scheduled" | "sent" | "opened" | "replied" | "bounced" | "cancelled";
export type FollowUpChannel = "email" | "sms" | "call";

// ── Attribution Types ──

export type AttributionModel = "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";

export interface Touchpoint {
  leadId: string;
  channel: string;
  campaign: string | null;
  content: string | null;
  medium: string;
  timestamp: string;
  interaction: string;
}

export interface AttributionResult {
  dealId: string;
  dealValue: number;
  model: AttributionModel;
  attributions: Array<{
    touchpointId: string;
    channel: string;
    campaign: string | null;
    creditPercent: number;
    creditValue: number;
  }>;
  pathLength: number;
  timeToCloseDays: number;
}

// ── Enrichment Provider Interface ──

export interface LeadEnrichmentProvider {
  name: string;
  enrichCompany(domain: string): Promise<CompanyData>;
  enrichContact(email: string): Promise<ContactData>;
  isAvailable(): boolean;
}

// ── Proposal Types ──

export interface ProposalTemplate {
  executiveSummary: string;
  currentSituation: string;
  proposedSolution: string;
  timeline: string;
  investment: string;
  whyCriteria: string;
  nextSteps: string;
  terms: string;
}
