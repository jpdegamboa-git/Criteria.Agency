import { eq, and, gt, lte } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import type { FollowUpType, FollowUpStatus, FollowUpChannel } from "./types.js";

// ── Types ──

export interface ScheduleFollowUpParams {
  leadId: string;
  dealId?: string;
  type: FollowUpType;
  channel: FollowUpChannel;
  content?: string;
  scheduledFor: Date;
}

// ── scheduleFollowUp ──

export async function scheduleFollowUp(params: ScheduleFollowUpParams) {
  const [followUp] = await db
    .insert(schema.followUps)
    .values({
      leadId: params.leadId,
      dealId: params.dealId ?? null,
      type: params.type,
      channel: params.channel,
      content: params.content ?? null,
      scheduledFor: params.scheduledFor,
      status: "scheduled",
    })
    .returning();

  return followUp;
}

// ── getUpcomingFollowUps ──

export async function getUpcomingFollowUps(clientId: string) {
  const now = new Date();

  return db
    .select()
    .from(schema.followUps)
    .where(
      and(
        eq(schema.followUps.status, "scheduled"),
        gt(schema.followUps.scheduledFor, now),
      ),
    )
    .orderBy(schema.followUps.scheduledFor);
}

// ── getDueFollowUps ──

export async function getDueFollowUps() {
  const now = new Date();

  return db
    .select()
    .from(schema.followUps)
    .where(
      and(
        eq(schema.followUps.status, "scheduled"),
        lte(schema.followUps.scheduledFor, now),
      ),
    )
    .orderBy(schema.followUps.scheduledFor);
}

// ── markFollowUpStatus ──

export async function markFollowUpStatus(
  followUpId: string,
  status: FollowUpStatus,
  timestamp: Date = new Date(),
) {
  const updates: Record<string, unknown> = { status };

  if (status === "sent") {
    updates.sentAt = timestamp;
  } else if (status === "opened") {
    updates.openedAt = timestamp;
  } else if (status === "replied") {
    updates.repliedAt = timestamp;
  }

  const [updated] = await db
    .update(schema.followUps)
    .set(updates)
    .where(eq(schema.followUps.id, followUpId))
    .returning();

  return updated ?? null;
}

// ── cancelFollowUpsForLead ──

export async function cancelFollowUpsForLead(leadId: string) {
  return db
    .update(schema.followUps)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(schema.followUps.leadId, leadId),
        eq(schema.followUps.status, "scheduled"),
      ),
    )
    .returning();
}

// ── getFollowUpById ──

export async function getFollowUpById(followUpId: string) {
  const rows = await db
    .select()
    .from(schema.followUps)
    .where(eq(schema.followUps.id, followUpId))
    .limit(1);

  return rows[0] ?? null;
}
