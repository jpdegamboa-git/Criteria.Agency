import type { DateRange } from "../analytics/types.js";

// ── Campaign Orchestration (C-042) ──

export type CampaignStatus =
  | "draft"
  | "decomposing"
  | "dispatched"
  | "in_progress"
  | "consolidating"
  | "delivered"
  | "failed";

export interface SharedCampaignContext {
  campaignMessage: string;
  visualDirection: string;
  toneGuidelines: string;
  targetAudience: string;
  callToAction: string;
}

export interface SubProjectEntry {
  projectId: string;
  motor: string;
  channel: string;
  status: string;
  priority: number;
  deliverables: string[];
}

export interface CampaignBudget {
  total: number;
  currency: string;
  allocated: Record<string, number>;
  spent: Record<string, number>;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  briefProjectId: string | null;
  brandDnaProjectId: string | null;
  status: CampaignStatus;
  sharedContext: SharedCampaignContext;
  budget: CampaignBudget | null;
  subProjects: SubProjectEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelSubBrief {
  motor: string;
  channel: string;
  briefContent: string;
  specs: Record<string, unknown>;
  priority: number;
  estimatedCost: number;
}

export interface DecompositionResult {
  subBriefs: ChannelSubBrief[];
  sharedContext: SharedCampaignContext;
  totalEstimatedCost: number;
}

export interface CampaignProgress {
  campaignId: string;
  status: CampaignStatus;
  totalSubProjects: number;
  completed: number;
  inProgress: number;
  failed: number;
  subProjects: SubProjectEntry[];
  estimatedCompletion: string | null;
}

// ── Asset Registry (C-043) ──

export type AssetType = "image" | "video" | "audio" | "document" | "template" | "component";

export interface AssetOriginalContext {
  projectId: string;
  campaign: string;
  channel: string;
  step: string;
}

export interface AssetPerformance {
  timesUsed: number;
  channels: string[];
  engagement: number | null;
}

export interface AssetAdaptation {
  assetId: string;
  channel: string;
  format: string;
}

export interface AssetRegistryEntry {
  id: string;
  artifactId: string;
  clientId: string;
  type: AssetType;
  tags: string[];
  description: string;
  originalContext: AssetOriginalContext;
  performance: AssetPerformance;
  adaptations: AssetAdaptation[];
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AssetSearchResult {
  asset: AssetRegistryEntry;
  relevanceScore: number;
  matchReason: string;
}

export interface AssetRecommendation {
  asset: AssetRegistryEntry;
  suggestedUse: string;
  adaptationNeeded: boolean;
  adaptationDetails: string | null;
}

export interface AssetStats {
  totalAssets: number;
  byType: Record<string, number>;
  reuseRate: number;
  topTags: Array<{ tag: string; count: number }>;
  recentlyUsed: AssetRegistryEntry[];
}

// ── Capacity Manager (C-044) ──

export type AgentStatus = "running" | "queued" | "idle" | "error";

export interface CapacityConfig {
  maxConcurrentAgents: number;
  maxConcurrentPerMotor: number;
  maxConcurrentPerClient: number;
}

export interface CapacitySnapshot {
  timestamp: string;
  concurrentAgents: number;
  queueDepth: number;
  agentsByStatus: Record<AgentStatus, number>;
  avgResponseTimeMs: number;
  errorCount: number;
}

export interface AgentHealthEntry {
  agentId: string;
  status: "healthy" | "degraded" | "unavailable";
  avgResponseTimeMs: number;
  successRate: number;
  lastExecution: string | null;
  totalExecutions: number;
  errorRate: number;
}

export interface CapacityOverview {
  config: CapacityConfig;
  current: CapacitySnapshot;
  agents: AgentHealthEntry[];
  utilizationPercent: number;
}

// ── Step Result ──

export interface ScaleStepResult {
  step: string;
  status: "completed" | "failed";
  data: unknown;
  artifactContent?: string;
}
