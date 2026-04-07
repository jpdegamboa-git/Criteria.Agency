import { db } from "@/lib/db";
import { transactions, expectedPayments, businessEntities } from "@/lib/admin-schema";
import { sql, eq, and, gte, lt, desc, isNotNull } from "drizzle-orm";
import Link from "next/link";

function getPeriodDates(period: string) {
  const now = new Date();
  let start: Date, end: Date, prevStart: Date, prevEnd: Date;

  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    end = new Date(now.getFullYear(), (q + 1) * 3, 1);
    prevStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
    prevEnd = start;
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
    prevStart = new Date(now.getFullYear() - 1, 0, 1);
    prevEnd = start;
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = start;
  }
  return { start, end, prevStart, prevEnd };
}

export default async function FinancesPage() {
  const { start, end, prevStart, prevEnd } = getPeriodDates("month");

  // KPIs - current period
  const [currentIncome] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "income"), gte(transactions.date, start), lt(transactions.date, end)));

  const [currentExpenses] = await db
    .select({ total: sql<string>`coalesce(sum(abs(amount)), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "expense"), gte(transactions.date, start), lt(transactions.date, end)));

  // KPIs - previous period
  const [prevIncome] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "income"), gte(transactions.date, prevStart), lt(transactions.date, prevEnd)));

  const [prevExpenses] = await db
    .select({ total: sql<string>`coalesce(sum(abs(amount)), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "expense"), gte(transactions.date, prevStart), lt(transactions.date, prevEnd)));

  // Linked fees (fees attached to parent income)
  const [currentLinkedFees] = await db
    .select({ total: sql<string>`coalesce(sum(abs(amount)), 0)` })
    .from(transactions)
    .where(and(isNotNull(transactions.parentTransactionId), gte(transactions.date, start), lt(transactions.date, end)));

  // Receivable
  const [receivable] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(expectedPayments)
    .where(eq(expectedPayments.status, "pending"));

  // Recent transactions
  const recent = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.date))
    .limit(10);

  // Top entities
  const topEntities = await db
    .select({
      name: businessEntities.name,
      type: businessEntities.type,
      total: sql<string>`sum(abs(${transactions.amount}))`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .innerJoin(businessEntities, eq(transactions.entityId, businessEntities.id))
    .groupBy(businessEntities.id, businessEntities.name, businessEntities.type)
    .orderBy(sql`sum(abs(${transactions.amount})) desc`)
    .limit(10);

  const income = parseFloat(currentIncome.total);
  const expenses = parseFloat(currentExpenses.total);
  const linkedFees = parseFloat(currentLinkedFees.total);
  const netIncome = income - linkedFees;
  const balance = income - expenses;
  const prevIncomeVal = parseFloat(prevIncome.total);
  const prevExpensesVal = parseFloat(prevExpenses.total);
  const receivableVal = parseFloat(receivable.total);

  const incomeChange = prevIncomeVal > 0 ? ((income - prevIncomeVal) / prevIncomeVal * 100) : 0;
  const expensesChange = prevExpensesVal > 0 ? ((expenses - prevExpensesVal) / prevExpensesVal * 100) : 0;

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Finanzas</h1>
          <p className="text-[#9d9a9c] text-sm">Periodo actual</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/finances/transactions" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141414] text-[#9d9a9c] hover:text-white border border-[#2a2a2a] transition-colors">
            Transacciones
          </Link>
          <Link href="/admin/finances/reconciliation" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141414] text-[#9d9a9c] hover:text-white border border-[#2a2a2a] transition-colors">
            Reconciliacion
          </Link>
          <Link href="/admin/finances/import" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#ffd053] text-[#0a0a0a] transition-colors hover:bg-[#ffda73]">
            Importar CSV
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <KPICard label="Ingresos" value={fmt(income)} change={incomeChange} positive />
        <KPICard label="Ingreso Neto" value={fmt(netIncome)} subtitle={linkedFees > 0 ? `- ${fmt(linkedFees)} comisiones` : undefined} positive />
        <KPICard label="Gastos" value={fmt(expenses)} change={expensesChange} positive={false} />
        <KPICard label="Balance" value={fmt(balance)} positive={balance >= 0} />
        <KPICard label="Por cobrar" value={fmt(receivableVal)} />
      </div>

      {/* Two columns: Top entities + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Entities */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-medium text-[#666] mb-4">Top Entidades</h2>
          {topEntities.length === 0 ? (
            <p className="text-[#666] text-sm">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {topEntities.map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      e.type === "client" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {e.type}
                    </span>
                    <span className="text-sm text-white">{e.name}</span>
                  </div>
                  <span className="text-sm text-[#9d9a9c] font-mono">
                    {fmt(parseFloat(e.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-medium text-[#666] mb-4">Transacciones recientes</h2>
          {recent.length === 0 ? (
            <p className="text-[#666] text-sm">Sin transacciones</p>
          ) : (
            <div className="space-y-2">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white truncate max-w-[250px]">
                      {t.counterpartyName ?? t.description}
                    </p>
                    <p className="text-xs text-[#666]">
                      {new Date(t.date).toLocaleDateString("es")}
                      {t.category ? ` · ${t.category}` : ""}
                    </p>
                  </div>
                  <span className={`text-sm font-mono ${
                    parseFloat(t.amount) >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {fmt(parseFloat(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, change, positive, subtitle }: {
  label: string;
  value: string;
  change?: number;
  positive?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-xs text-[#666] mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-xs mt-1 text-[#9d9a9c]">{subtitle}</p>
      )}
      {change !== undefined && change !== 0 && (
        <p className={`text-xs mt-1 ${positive ? "text-green-400" : "text-red-400"}`}>
          {change > 0 ? "+" : ""}{change.toFixed(1)}% vs periodo anterior
        </p>
      )}
    </div>
  );
}
