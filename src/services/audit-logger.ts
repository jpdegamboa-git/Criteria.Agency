import type { AuditEntry } from "@/shared/engine-types";

interface BuildAuditParams {
  clientId: string;
  actor: string;
  actorType: "agent" | "human" | "system";
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  autonomyLevel?: number | null;
  approvalId?: string | null;
  ipAddress?: string | null;
}

export function buildAuditEntry(params: BuildAuditParams): AuditEntry {
  return {
    clientId: params.clientId,
    actor: params.actor,
    actorType: params.actorType,
    action: params.action,
    resourceType: params.resourceType ?? null,
    resourceId: params.resourceId ?? null,
    details: params.details ?? null,
    autonomyLevel: (params.autonomyLevel as 1 | 2 | 3 | 4 | 5) ?? null,
    approvalId: params.approvalId ?? null,
  };
}

export function formatAuditAction(
  verb: string,
  category: string,
  target: string,
): string {
  return `${category}.${target}.${verb}`;
}
