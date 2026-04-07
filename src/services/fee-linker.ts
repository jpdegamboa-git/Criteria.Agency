import { db, schema } from "../db/index.js";
import { eq, and, gte, lte, isNull, isNotNull, inArray } from "drizzle-orm";

/**
 * Auto-link fee transactions to their parent income transactions.
 *
 * Heuristic: for each fee, find the closest income transaction by date
 * (same day preferred, ±1 day max), same bank account, that doesn't
 * already have a linked fee.
 */
export async function linkFeesToParents(transactionIds: string[]): Promise<number> {
  if (transactionIds.length === 0) return 0;

  // Get fee transactions from the batch
  const fees = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        inArray(schema.transactions.id, transactionIds),
        eq(schema.transactions.type, "fee"),
        isNull(schema.transactions.parentTransactionId),
      ),
    );

  let linked = 0;

  for (const fee of fees) {
    const feeDate = new Date(fee.date);
    const dayBefore = new Date(feeDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(feeDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(23, 59, 59, 999);

    // Find income transactions in ±1 day range, same bank account, no existing child fee
    const candidates = await db
      .select({ id: schema.transactions.id, date: schema.transactions.date })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.type, "income"),
          eq(schema.transactions.bankAccountId, fee.bankAccountId),
          gte(schema.transactions.date, dayBefore),
          lte(schema.transactions.date, dayAfter),
        ),
      );

    // Exclude candidates that already have a linked fee
    const parentIds = candidates.map((c) => c.id);
    if (parentIds.length === 0) continue;

    const existingLinks = await db
      .select({ parentTransactionId: schema.transactions.parentTransactionId })
      .from(schema.transactions)
      .where(
        and(
          inArray(schema.transactions.parentTransactionId, parentIds),
          isNotNull(schema.transactions.parentTransactionId),
        ),
      );

    const takenParents = new Set(
      existingLinks
        .map((l) => l.parentTransactionId)
        .filter((id): id is string => id !== null),
    );

    // Pick closest available candidate by date
    const available = candidates.filter((c) => !takenParents.has(c.id));
    if (available.length === 0) continue;

    available.sort((a, b) => {
      const diffA = Math.abs(new Date(a.date).getTime() - feeDate.getTime());
      const diffB = Math.abs(new Date(b.date).getTime() - feeDate.getTime());
      return diffA - diffB;
    });

    await db
      .update(schema.transactions)
      .set({ parentTransactionId: available[0].id })
      .where(eq(schema.transactions.id, fee.id));

    linked++;
  }

  return linked;
}

/**
 * Auto-link all existing unlinked fee transactions.
 */
export async function linkAllOrphanedFees(): Promise<number> {
  const orphanedFees = await db
    .select({ id: schema.transactions.id })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.type, "fee"),
        isNull(schema.transactions.parentTransactionId),
      ),
    );

  if (orphanedFees.length === 0) return 0;

  return linkFeesToParents(orphanedFees.map((f) => f.id));
}

/**
 * Manually link a fee to a parent transaction.
 */
export async function linkFee(feeId: string, parentId: string): Promise<void> {
  const [fee] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, feeId));

  if (!fee) throw new Error("Fee transaction not found");
  if (fee.type !== "fee") throw new Error("Transaction is not a fee");

  const [parent] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, parentId));

  if (!parent) throw new Error("Parent transaction not found");
  if (parent.type !== "income") throw new Error("Parent must be an income transaction");

  await db
    .update(schema.transactions)
    .set({ parentTransactionId: parentId })
    .where(eq(schema.transactions.id, feeId));
}

/**
 * Unlink a fee from its parent.
 */
export async function unlinkFee(feeId: string): Promise<void> {
  await db
    .update(schema.transactions)
    .set({ parentTransactionId: null })
    .where(eq(schema.transactions.id, feeId));
}
