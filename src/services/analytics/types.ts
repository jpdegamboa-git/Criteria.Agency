// ── Date Range ──

export interface DateRange {
  start: string; // ISO 8601
  end: string;
}

// ── Metric Types ──

export interface MetricDataPoint {
  date: string;
  metric: string;
  value: number;
  dimensions: Record<string, string>;
  source: string;
}

export interface AnalyticsDataProvider {
  name: string;
  source: string;
  fetchMetrics(
    clientId: string,
    metrics: string[],
    dateRange: DateRange,
    dimensions?: string[],
  ): Promise<MetricDataPoint[]>;
  isAvailable(): boolean;
}

// ── Dashboard Types ──

export type DashboardType = "executive" | "channel" | "content" | "funnel" | "financial";

export type WidgetType = "kpi_card" | "time_series" | "bar_chart" | "funnel" | "table" | "pie" | "heatmap";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  metric: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    comparisonPeriod?: string;
    groupBy?: string;
    dateRange?: string;
    filters?: Record<string, string>;
  };
}

export interface DashboardConfig {
  clientId: string;
  dashboardType: DashboardType;
  widgets: WidgetConfig[];
  refreshInterval: number;
}

export interface DashboardData {
  config: DashboardConfig;
  widgets: Array<{
    id: string;
    type: WidgetType;
    metric: string;
    data: unknown;
  }>;
  generatedAt: string;
}

// ── Attribution Report Types ──

export interface ChannelAttribution {
  channel: string;
  attributedRevenue: number;
  percentOfTotal: number;
  dealCount: number;
  avgDealSize: number;
  costPerAcquisition: number;
  roas: number;
}

export interface CampaignAttribution {
  campaign: string;
  channel: string;
  attributedRevenue: number;
  spend: number;
  roas: number;
}

export interface PathAnalysis {
  avgPathLength: number;
  avgTimeToClose: number;
  commonPaths: Array<{
    path: string[];
    frequency: number;
    avgDealValue: number;
  }>;
}

export interface AttributionReport {
  model: string;
  period: DateRange;
  totalRevenue: number;
  byChannel: ChannelAttribution[];
  byCampaign: CampaignAttribution[];
  pathAnalysis: PathAnalysis;
}

// ── Unit Economics Types ──

export interface UnitEconomics {
  cac: number;
  cacByChannel: Record<string, number>;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  monthlyChurnRate: number;
  netRevenueRetention: number;
  period: DateRange;
  computedAt: string;
}

export interface CohortData {
  cohortMonth: string;
  size: number;
  revenueByMonth: number[];
  cumulativeLtv: number;
  retentionByMonth: number[];
}

// ── Report Types ──

export type ReportType = "daily" | "weekly" | "monthly" | "on_demand";

export interface ReportMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  trend: "up" | "down" | "flat";
  isGood: boolean;
}

export interface ReportSection {
  title: string;
  metrics: ReportMetric[];
  insights: string[];
  recommendations: string[];
}

export interface AutomatedReport {
  clientId: string;
  type: ReportType;
  period: DateRange;
  sections: ReportSection[];
  executiveSummary: string;
  generatedAt: string;
}

// ── NL Query Types ──

export interface NLQueryResult {
  answer: string;
  data: Record<string, unknown>;
  confidence: number;
  followUpSuggestions: string[];
}

// ── Step Result ──

export interface AnalyticsStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
