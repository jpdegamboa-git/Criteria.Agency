// ── Continuous Agent Types ──
export type ListenerType = "brand" | "culture" | "industry" | "competitive" | "opportunity";

export interface ContinuousAgentCycle {
  id: string;
  clientId: string;
  agentId: string;
  listenerType: ListenerType;
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  artifactsProduced: string[];
  startedAt: string | null;
  completedAt: string | null;
  costUsd: number | null;
  error: string | null;
  cycleId: string;
}

// ── Alert Types ──
export interface AlertRule {
  id: string;
  clientId: string;
  listenerType: ListenerType;
  ruleName: string;
  condition: AlertCondition;
  severity: "info" | "warning" | "critical";
  notificationChannels: string[];
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: "<" | ">" | "<=" | ">=" | "==" | "!=";
  value: number;
}

export interface Alert {
  id: string;
  clientId: string;
  alertRuleId: string | null;
  listenerType: ListenerType;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  context: Record<string, unknown> | null;
  status: "open" | "acknowledged" | "resolved" | "dismissed";
  resolvedAt: string | null;
}

// ── Data Source Config ──
export interface DataSourceConfig {
  clientId: string;
  listenerType: ListenerType;
  config: Record<string, unknown>;
  schedule: string;
  enabled: boolean;
  lastRunAt: string | null;
}

// ── Autonomy Types ──
export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

export interface AutonomyConfig {
  clientId: string;
  globalLevel: AutonomyLevel;
  overrides: AutonomyOverride[];
  escalation: {
    autoEscalateAfter: number;
    escalateTo: string[];
    fallbackAction: "block" | "approve_with_flag";
  };
}

export interface AutonomyOverride {
  scope: {
    motor?: string;
    actionType?: string;
    budgetThreshold?: number;
  };
  level: AutonomyLevel;
  reason: string;
}

export interface ApprovalRequest {
  id: string;
  clientId: string;
  projectId: string | null;
  motor: string;
  actionType: string;
  description: string;
  context: Record<string, unknown>;
  urgency: "low" | "normal" | "high";
  status: "pending" | "approved" | "rejected" | "escalated" | "expired";
  expiresAt: string;
}

// ── Audit Types ──
export interface AuditEntry {
  clientId: string;
  actor: string;
  actorType: "agent" | "human" | "system";
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  autonomyLevel: AutonomyLevel | null;
  approvalId: string | null;
}

// ── Stub Provider Interface ──
export interface StubProviderConfig {
  providerType: string;
  prompt: string;
  outputSchema: string;
}
