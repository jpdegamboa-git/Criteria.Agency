import type { DateRange } from "../analytics/types.js";

// Budget Allocation Types
export type BudgetStrategy = "growth" | "efficiency" | "balanced";
export type FunnelStage = "awareness" | "consideration" | "conversion";

export interface ChannelAllocation {
  channel: string;
  funnelStage: FunnelStage;
  amount: number;
  percentOfTotal: number;
  rationale: string;
  expectedRoas: number;
  historicalRoas: number | null;
  confidence: number;
}

export interface BudgetConstraints {
  minPerChannel: number;
  maxPerChannel: number;
  fixedAllocations: Array<{ channel: string; amount: number; reason: string }>;
}

export interface BudgetAllocation {
  clientId: string;
  budgetId: string;
  totalBudget: number;
  currency: string;
  period: DateRange;
  strategy: BudgetStrategy;
  allocations: ChannelAllocation[];
  constraints: BudgetConstraints;
  recommendations: string[];
}

// Spend Tracking Types
export type SpendSource = "meta_ads" | "google_ads" | "manual" | "vendor_invoice";
export type SpendStatus = "on_track" | "underspend" | "overspend" | "exhausted";

export interface ChannelSpendSummary {
  channel: string;
  budgeted: number;
  spent: number;
  remaining: number;
  roas: number;
  status: SpendStatus;
}

export interface CampaignSpendSummary {
  campaignName: string;
  channel: string;
  budgeted: number;
  spent: number;
  roas: number;
  status: SpendStatus;
}

export interface SpendTracker {
  clientId: string;
  period: DateRange;
  overall: {
    budgeted: number;
    spent: number;
    remaining: number;
    burnRate: number;
    projectedOverspend: number | null;
    daysUntilExhausted: number | null;
  };
  byChannel: ChannelSpendSummary[];
  byCampaign: CampaignSpendSummary[];
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface SpendAlert {
  type: "overspend" | "exhausted" | "low_roas" | "pace" | "underspend";
  severity: AlertSeverity;
  channel: string;
  message: string;
  currentValue: number;
  threshold: number;
}

// Vendor Types
export type VendorCategory = "media" | "print" | "events" | "freelance" | "influencer";

export interface VendorScoreComponents {
  quality: number;     // 0-25
  price: number;       // 0-25
  reliability: number; // 0-25
  value: number;       // 0-25
}

export interface VendorScore {
  vendorId: string;
  name: string;
  category: VendorCategory;
  overallScore: number; // 0-100
  components: VendorScoreComponents;
  history: {
    projectsCompleted: number;
    avgDeliveryTime: number;
    onTimeRate: number;
    avgPriceVsMarket: number;
  };
}

export interface MarketRate {
  service: string;
  region: string;
  low: number;
  median: number;
  high: number;
  currency: string;
  confidence: number;
  lastUpdated: string;
}

export type PriceVerdict = "fair" | "above_market" | "below_market";

export interface QuotationAnalysis {
  quotationId: string;
  vendorId: string;
  serviceDescription: string;
  quotedPrice: number;
  marketRate: MarketRate;
  verdict: PriceVerdict;
  percentVsMedian: number;
}

// Campaign P&L Types
export interface CampaignCosts {
  adSpend: number;
  contentProduction: number;
  vendorCosts: number;
  platformFees: number;
  laborCost: number;
  total: number;
}

export interface CampaignRevenue {
  attributed: number;
  model: string;
  confidence: number;
}

export interface CampaignMetrics {
  roi: number;
  roas: number;
  grossMargin: number;
  profitLoss: number;
  cpa: number;
  revenuePerLead: number;
}

export interface CampaignPnL {
  campaignName: string;
  period: DateRange;
  revenue: CampaignRevenue;
  costs: CampaignCosts;
  metrics: CampaignMetrics;
}

export interface InvestmentReport {
  clientId: string;
  period: DateRange;
  campaigns: CampaignPnL[];
  totalInvestment: number;
  totalRevenue: number;
  overallRoi: number;
  overallRoas: number;
  executiveSummary: string;
  recommendations: string[];
  generatedAt: string;
}

// Step Result
export interface BudgetStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
