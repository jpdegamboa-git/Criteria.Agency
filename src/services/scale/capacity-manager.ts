// src/services/scale/capacity-manager.ts
import { db, schema } from "../../db/index.js";
import { desc } from "drizzle-orm";
import type {
  CapacityConfig,
  CapacitySnapshot,
  CapacityOverview,
  AgentHealthEntry,
  ScaleStepResult,
} from "./types.js";

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  maxConcurrentAgents: 10,
  maxConcurrentPerMotor: 3,
  maxConcurrentPerClient: 10,
};

export function computeUtilization(
  concurrentAgents: number,
  maxConcurrent: number,
): number {
  if (maxConcurrent <= 0) return 0;
  return Math.round((concurrentAgents / maxConcurrent) * 100);
}

export function canDispatch(
  config: CapacityConfig,
  currentGlobal: number,
  currentMotor: number,
  currentClient: number,
): boolean {
  return (
    currentGlobal < config.maxConcurrentAgents &&
    currentMotor < config.maxConcurrentPerMotor &&
    currentClient < config.maxConcurrentPerClient
  );
}

export function buildHealthEntry(
  agentId: string,
  avgResponseTimeMs: number,
  successRate: number,
  totalExecutions: number,
  errorCount: number,
  lastExecution: string | null,
): AgentHealthEntry {
  const errorRate = 1 - successRate;
  let status: AgentHealthEntry["status"] = "healthy";

  if (errorRate > 0.3 || avgResponseTimeMs > 1500) {
    status = "unavailable";
  } else if (errorRate > 0.1 || avgResponseTimeMs > 800) {
    status = "degraded";
  }

  return {
    agentId,
    status,
    avgResponseTimeMs,
    successRate,
    lastExecution,
    totalExecutions,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

export async function logCapacity(snapshot: Omit<CapacitySnapshot, "timestamp">): Promise<void> {
  await db.insert(schema.agentCapacityLog).values({
    concurrentAgents: snapshot.concurrentAgents,
    queueDepth: snapshot.queueDepth,
    agentsByStatus: snapshot.agentsByStatus,
    avgResponseTimeMs: snapshot.avgResponseTimeMs,
    errorCount: snapshot.errorCount,
  });
}

export async function getCapacityHistory(limit: number = 50): Promise<CapacitySnapshot[]> {
  const rows = await db
    .select()
    .from(schema.agentCapacityLog)
    .orderBy(desc(schema.agentCapacityLog.timestamp))
    .limit(limit);

  return rows.map((row) => ({
    timestamp: row.timestamp.toISOString(),
    concurrentAgents: row.concurrentAgents,
    queueDepth: row.queueDepth,
    agentsByStatus: (row.agentsByStatus ?? {}) as Record<string, number>,
    avgResponseTimeMs: row.avgResponseTimeMs ?? 0,
    errorCount: row.errorCount ?? 0,
  }));
}

export async function getCurrentCapacity(): Promise<CapacityOverview> {
  const history = await getCapacityHistory(1);
  const current: CapacitySnapshot = history[0] ?? {
    timestamp: new Date().toISOString(),
    concurrentAgents: 0,
    queueDepth: 0,
    agentsByStatus: { running: 0, queued: 0, idle: 0, error: 0 },
    avgResponseTimeMs: 0,
    errorCount: 0,
  };

  return {
    config: DEFAULT_CAPACITY_CONFIG,
    current,
    agents: [],
    utilizationPercent: computeUtilization(
      current.concurrentAgents,
      DEFAULT_CAPACITY_CONFIG.maxConcurrentAgents,
    ),
  };
}

export async function runCapacityCheck(): Promise<ScaleStepResult> {
  try {
    const overview = await getCurrentCapacity();
    return {
      step: "sk_capacity",
      status: "completed",
      data: { overview },
    };
  } catch (error) {
    return {
      step: "sk_capacity",
      status: "failed",
      data: { error: String(error) },
    };
  }
}
