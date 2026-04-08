// web/lib/portal-types.ts

// ── Media & State ──

export type MediaType = "paid" | "owned" | "earned";
export type CampaignState = "plan" | "ejecutar" | "seguimiento";
export type LeadTemperature = "hot" | "warm" | "cold";
export type DealStage = "new" | "contacted" | "proposal" | "negotiation" | "won";
export type FunnelStage = "awareness" | "consideration" | "conversion" | "retention";

export type Channel =
  | "sem"
  | "social_ads"
  | "display"
  | "video_ott"
  | "seo_content"
  | "email"
  | "social_org"
  | "influencers";

// ── Entities ──

export interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  score: number;
  toneScores: { formal: number; serious: number; technical: number };
  colors: { name: string; hex: string }[];
  fonts: { heading: string; body: string };
  positioning: string;
}

export interface KPI {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  secondary?: string;
}

export interface CampaignIdea {
  id: string;
  title: string;
  description: string;
  tags: { type: string; channel: string; time: string };
  urgent?: boolean;
  urgencyDays?: number;
}

export interface Opportunity {
  id: string;
  type: "tendencia" | "competencia" | "cultura" | "industria";
  title: string;
  description: string;
  action: string;
}

export interface Campaign {
  id: string;
  name: string;
  state: CampaignState;
  startDate: string;
  endDate: string;
  objective: string;
  budget: number;
  spent: number;
  activations: Activation[];
}

export type Platform =
  | "google"
  | "meta"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "tiktok"
  | "x"
  | "mailchimp"
  | "generic";

export interface Activation {
  id: string;
  campaignId: string;
  name: string;
  channel: Channel;
  funnelStage: FunnelStage;
  mediaType: MediaType;
  state: CampaignState;
  platform?: Platform;
  kpis: { label: string; value: string }[];
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  value: number;
  stage: DealStage;
  temperature: LeadTemperature;
  lastActivity: string;
  score: number;
  touchpoints: string[];
}

export interface BudgetNode {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  locked: boolean;
  recommended?: { min: number; max: number };
  children?: BudgetNode[];
}

export interface Notification {
  id: string;
  description: string;
  source: string;
  time: string;
  action?: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  description: string;
  space: "home" | "brand" | "plan" | "campaigns" | "sales";
  time: string;
}
