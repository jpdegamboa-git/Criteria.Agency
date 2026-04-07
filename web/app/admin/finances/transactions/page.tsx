import { db } from "@/lib/db";
import { transactions, businessEntities } from "@/lib/admin-schema";
import { desc, eq, sql } from "drizzle-orm";
import { TransactionList } from "./transaction-list";

export default async function TransactionsPage() {
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      currency: transactions.currency,
      description: transactions.description,
      counterpartyName: transactions.counterpartyName,
      category: transactions.category,
      subcategory: transactions.subcategory,
      type: transactions.type,
      source: transactions.source,
      reconciled: transactions.reconciled,
      parentTransactionId: transactions.parentTransactionId,
      entityName: businessEntities.name,
      entityType: businessEntities.type,
    })
    .from(transactions)
    .leftJoin(businessEntities, eq(transactions.entityId, businessEntities.id))
    .orderBy(desc(transactions.date))
    .limit(200);

  const txData = rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Transacciones</h1>
      <p className="text-[#9d9a9c] mb-8">{txData.length} transacciones</p>
      <TransactionList transactions={txData} />
    </div>
  );
}
