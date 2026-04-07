import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { parseBGFile, type ParsedTransaction } from "./bg-csv-parser.js";
import { matchEntity } from "./entity-matcher.js";
import { categorizeTransaction } from "./categorizer.js";
import {
  reconcileTransaction,
  applyReconciliation,
} from "./reconciler.js";
import { linkFeesToParents } from "./fee-linker.js";

// ── Types ──

export interface ImportResult {
  syncLogId: string;
  found: number;
  new: number;
  duplicates: number;
  entitiesCreated: number;
  categorized: number;
  reconciled: number;
  feesLinked: number;
  unmatched: number;
}

// ── Main Import ──

export async function importCSV(
  fileContent: string,
  accountId: string,
): Promise<ImportResult> {
  // 1. Parse CSV
  const parsed = parseBGFile(fileContent, accountId);

  // 2. Dedup against existing transactions
  const existingRows = await db
    .select({ externalId: schema.transactions.externalId })
    .from(schema.transactions);

  const existingIds = new Set(
    existingRows
      .map((r) => r.externalId)
      .filter((id): id is string => id !== null),
  );

  const newTransactions = parsed.filter((t) => !existingIds.has(t.externalId));
  const duplicates = parsed.length - newTransactions.length;

  // 3. Load clientAliases once for the entire import batch
  const clientAliases = await db.select().from(schema.clientAliases);

  // 4. Process each new transaction
  let entitiesCreated = 0;
  let categorized = 0;
  let reconciled = 0;
  let unmatched = 0;
  const insertedIds: string[] = [];

  for (const txn of newTransactions) {
    // 4a. Match / create entity
    const entityResult = await matchEntity(
      txn.counterpartyName,
      txn.description,
      txn.amount,
      clientAliases,
    );
    if (entityResult.created) entitiesCreated++;

    // 3b. Insert transaction
    const [inserted] = await db
      .insert(schema.transactions)
      .values({
        bankAccountId: accountId,
        externalId: txn.externalId,
        date: txn.date,
        amount: txn.amount,
        currency: txn.currency,
        description: txn.description,
        counterpartyName: txn.counterpartyName,
        reference: txn.reference,
        type: txn.type,
        source: txn.source,
        entityId: entityResult.entityId,
        metadata: txn.metadata,
      })
      .returning();

    insertedIds.push(inserted.id);

    // 4c. Categorize
    const catResult = await categorizeTransaction({
      date: txn.date,
      description: txn.description,
      counterpartyName: txn.counterpartyName,
      amount: txn.amount,
      reference: txn.reference,
      aliases: clientAliases,
    });

    await db
      .update(schema.transactions)
      .set({
        category: catResult.category,
        subcategory: catResult.subcategory,
        type: catResult.type,
      })
      .where(eq(schema.transactions.id, inserted.id));

    categorized++;

    // 4d. Reconcile income transactions
    if (txn.type === "income") {
      const reconResult = await reconcileTransaction({
        id: inserted.id,
        amount: txn.amount,
        counterpartyName: txn.counterpartyName,
        date: txn.date,
        description: txn.description,
        type: txn.type,
      }, clientAliases);

      if (reconResult.autoReconciled && reconResult.expectedPaymentId && reconResult.clientId) {
        await applyReconciliation(
          inserted.id,
          reconResult.expectedPaymentId,
          reconResult.clientId,
          txn.counterpartyName,
        );
        reconciled++;
      } else if (!reconResult.matched) {
        unmatched++;
      }
    }
  }

  // 5. Auto-link fees to parent income transactions
  const feesLinked = await linkFeesToParents(insertedIds);

  // 6. Log sync
  const [logEntry] = await db
    .insert(schema.bankSyncLog)
    .values({
      provider: "csv_import",
      startedAt: new Date(),
      completedAt: new Date(),
      transactionsFound: parsed.length,
      transactionsNew: newTransactions.length,
      transactionsReconciled: reconciled,
      status: "completed",
    })
    .returning();

  // 7. Return result
  return {
    syncLogId: logEntry.id,
    found: parsed.length,
    new: newTransactions.length,
    duplicates,
    entitiesCreated,
    categorized,
    reconciled,
    feesLinked,
    unmatched,
  };
}

// ── Preview ──

export async function previewCSV(
  fileContent: string,
  accountId: string,
): Promise<{
  found: number;
  new: number;
  duplicates: number;
  preview: ParsedTransaction[];
}> {
  const parsed = parseBGFile(fileContent, accountId);

  const existingRows = await db
    .select({ externalId: schema.transactions.externalId })
    .from(schema.transactions);

  const existingIds = new Set(
    existingRows
      .map((r) => r.externalId)
      .filter((id): id is string => id !== null),
  );

  const newTransactions = parsed.filter((t) => !existingIds.has(t.externalId));

  return {
    found: parsed.length,
    new: newTransactions.length,
    duplicates: parsed.length - newTransactions.length,
    preview: newTransactions.slice(0, 10),
  };
}
