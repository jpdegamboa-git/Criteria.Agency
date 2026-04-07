import { db } from "@/lib/db";
import { transactions, expectedPayments, clients } from "@/lib/admin-schema";
import { eq, and, desc } from "drizzle-orm";
import { ReconciliationUI } from "./reconciliation-ui";

export default async function ReconciliationPage() {
  // Pending expected payments
  const pending = await db
    .select({
      id: expectedPayments.id,
      clientName: clients.name,
      amount: expectedPayments.amount,
      currency: expectedPayments.currency,
      description: expectedPayments.description,
      dueDate: expectedPayments.dueDate,
      status: expectedPayments.status,
    })
    .from(expectedPayments)
    .leftJoin(clients, eq(expectedPayments.clientId, clients.id))
    .where(eq(expectedPayments.status, "pending"))
    .orderBy(desc(expectedPayments.dueDate));

  // Unreconciled income transactions
  const unreconciled = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "income"),
        eq(transactions.reconciled, 0),
      ),
    )
    .orderBy(desc(transactions.date))
    .limit(50);

  const pendingData = pending.map((p) => ({
    ...p,
    amount: parseFloat(p.amount),
    isOverdue: p.dueDate < new Date(),
    daysOverdue: Math.max(0, Math.floor((Date.now() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24))),
  }));

  const unreconciledData = unreconciled.map((t) => ({
    ...t,
    amount: parseFloat(t.amount),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Reconciliacion</h1>
      <p className="text-[#9d9a9c] mb-8">
        {pendingData.length} pagos esperados | {unreconciledData.length} ingresos sin reconciliar
      </p>
      <ReconciliationUI pending={pendingData} unreconciled={unreconciledData} />
    </div>
  );
}
