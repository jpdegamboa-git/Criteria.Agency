import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { AutonomyLevel, AutonomyConfig, AutonomyOverride } from "../../shared/engine-types.js";
import {
  AUTONOMY_APPROVAL_THRESHOLDS,
  type ResolvedAutonomy,
  type AutonomyCheckResult,
} from "./types.js";

const DEFAULT_ESCALATION = {
  autoEscalateAfter: 24,
  escalateTo: [] as string[],
  fallbackAction: "block" as const,
};

export async function getAutonomyConfig(clientId: string): Promise<AutonomyConfig | null> {
  const rows = await db
    .select()
    .from(schema.autonomyConfigs)
    .where(eq(schema.autonomyConfigs.clientId, clientId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    clientId: row.clientId,
    globalLevel: row.globalLevel as AutonomyLevel,
    overrides: (row.overrides as AutonomyOverride[]) ?? [],
    escalation: (row.escalation as AutonomyConfig["escalation"]) ?? DEFAULT_ESCALATION,
  };
}

export async function resolveAutonomyLevel(
  clientId: string,
  motor?: string,
  actionType?: string,
): Promise<ResolvedAutonomy> {
  const config = await getAutonomyConfig(clientId);

  if (!config) {
    return {
      effectiveLevel: 3 as AutonomyLevel,
      source: "global",
      reason: "No config found; using default level 3",
    };
  }

  const overrides: AutonomyOverride[] = config.overrides ?? [];

  // Action-specific override (most specific)
  if (actionType) {
    const actionOverride = overrides.find(
      (o) => o.scope.actionType === actionType && (!o.scope.motor || o.scope.motor === motor),
    );
    if (actionOverride) {
      return {
        effectiveLevel: actionOverride.level,
        source: "action_override",
        reason: actionOverride.reason,
      };
    }
  }

  // Motor-specific override
  if (motor) {
    const motorOverride = overrides.find(
      (o) => o.scope.motor === motor && !o.scope.actionType,
    );
    if (motorOverride) {
      return {
        effectiveLevel: motorOverride.level,
        source: "motor_override",
        reason: motorOverride.reason,
      };
    }
  }

  return {
    effectiveLevel: config.globalLevel,
    source: "global",
    reason: `Global autonomy level ${config.globalLevel}`,
  };
}

export async function checkAction(
  clientId: string,
  params: {
    motor: string;
    actionType: string;
    description?: string;
  },
): Promise<AutonomyCheckResult> {
  const resolved = await resolveAutonomyLevel(clientId, params.motor, params.actionType);
  const level = resolved.effectiveLevel;
  const thresholds = AUTONOMY_APPROVAL_THRESHOLDS[level];

  // "*" means everything is blocked at this level
  const requiresApproval =
    thresholds.includes("*") || thresholds.includes(params.actionType);

  return {
    allowed: !requiresApproval,
    level,
    requiresApproval,
    reason: requiresApproval
      ? `Action "${params.actionType}" requires approval at autonomy level ${level}`
      : `Action "${params.actionType}" is allowed at autonomy level ${level}`,
  };
}

export async function createApprovalRequest(
  clientId: string,
  params: {
    projectId?: string;
    motor: string;
    actionType: string;
    description: string;
    context?: Record<string, unknown>;
    urgency?: "low" | "normal" | "high";
  },
): Promise<{ id: string }> {
  const config = await getAutonomyConfig(clientId);
  const escalationHours = config?.escalation?.autoEscalateAfter ?? DEFAULT_ESCALATION.autoEscalateAfter;

  const expiresAt = new Date(Date.now() + escalationHours * 60 * 60 * 1000);

  const rows = await db
    .insert(schema.approvalRequests)
    .values({
      clientId,
      projectId: params.projectId ?? null,
      motor: params.motor,
      actionType: params.actionType,
      description: params.description,
      context: params.context ?? {},
      urgency: params.urgency ?? "normal",
      status: "pending",
      expiresAt,
    })
    .returning({ id: schema.approvalRequests.id });

  return { id: rows[0].id };
}

export async function upsertAutonomyConfig(
  clientId: string,
  updates: Partial<Omit<AutonomyConfig, "clientId">>,
): Promise<AutonomyConfig> {
  const existing = await getAutonomyConfig(clientId);

  if (existing) {
    const rows = await db
      .update(schema.autonomyConfigs)
      .set({
        ...(updates.globalLevel !== undefined && { globalLevel: updates.globalLevel }),
        ...(updates.overrides !== undefined && { overrides: updates.overrides }),
        ...(updates.escalation !== undefined && { escalation: updates.escalation }),
        updatedAt: new Date(),
      })
      .where(eq(schema.autonomyConfigs.clientId, clientId))
      .returning();

    const row = rows[0];
    return {
      clientId: row.clientId,
      globalLevel: row.globalLevel as AutonomyLevel,
      overrides: (row.overrides as AutonomyOverride[]) ?? [],
      escalation: (row.escalation as AutonomyConfig["escalation"]) ?? DEFAULT_ESCALATION,
    };
  }

  const escalation = updates.escalation ?? DEFAULT_ESCALATION;
  const rows = await db
    .insert(schema.autonomyConfigs)
    .values({
      clientId,
      globalLevel: updates.globalLevel ?? 3,
      overrides: updates.overrides ?? [],
      escalation,
    })
    .returning();

  const row = rows[0];
  return {
    clientId: row.clientId,
    globalLevel: row.globalLevel as AutonomyLevel,
    overrides: (row.overrides as AutonomyOverride[]) ?? [],
    escalation: (row.escalation as AutonomyConfig["escalation"]) ?? DEFAULT_ESCALATION,
  };
}
