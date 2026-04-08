import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { AuditQueryParams } from "./types.js";

// ── writeAuditEntry ──

interface WriteAuditParams {
  clientId: string;
  actor: string;
  actorType: "agent" | "human" | "system";
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  autonomyLevel?: number;
  approvalId?: string;
  ipAddress?: string;
}

export async function writeAuditEntry(params: WriteAuditParams): Promise<{ id: string }> {
  const [row] = await db
    .insert(schema.auditLog)
    .values({
      clientId: params.clientId,
      actor: params.actor,
      actorType: params.actorType,
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      details: params.details ?? null,
      autonomyLevel: params.autonomyLevel ?? null,
      approvalId: params.approvalId ?? null,
      ipAddress: params.ipAddress ?? null,
    })
    .returning();

  return { id: row.id };
}

// ── queryAuditLog ──

export async function queryAuditLog(params: AuditQueryParams) {
  const conditions = [eq(schema.auditLog.clientId, params.clientId)];

  if (params.action) {
    conditions.push(eq(schema.auditLog.action, params.action));
  }
  if (params.actorType) {
    conditions.push(eq(schema.auditLog.actorType, params.actorType));
  }
  if (params.resourceType) {
    conditions.push(eq(schema.auditLog.resourceType, params.resourceType));
  }
  if (params.from) {
    conditions.push(gte(schema.auditLog.timestamp, params.from));
  }
  if (params.to) {
    conditions.push(lte(schema.auditLog.timestamp, params.to));
  }

  const query = db
    .select()
    .from(schema.auditLog)
    .where(and(...conditions))
    .orderBy(desc(schema.auditLog.timestamp))
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);

  return query;
}

// ── exportAuditCSV ──

export async function exportAuditCSV(
  clientId: string,
  from?: Date,
  to?: Date,
): Promise<string> {
  const rows = await queryAuditLog({ clientId, from, to, limit: 10000 });

  const header = "timestamp,actor,actor_type,action,resource_type,resource_id,details";
  const lines = (rows as Array<{
    timestamp: Date;
    actor: string;
    actorType: string;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    details?: unknown;
  }>).map((row) => {
    const ts = row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp);
    const details = row.details != null ? JSON.stringify(row.details).replace(/"/g, '""') : "";
    return [
      ts,
      row.actor,
      row.actorType,
      row.action,
      row.resourceType ?? "",
      row.resourceId ?? "",
      `"${details}"`,
    ].join(",");
  });

  return [header, ...lines].join("\n");
}
