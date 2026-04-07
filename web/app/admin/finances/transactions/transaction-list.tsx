"use client";

import { useState } from "react";

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  counterpartyName: string | null;
  category: string | null;
  subcategory: string | null;
  type: string | null;
  source: string;
  reconciled: number;
  parentTransactionId: string | null;
  entityName: string | null;
  entityType: string | null;
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [reconciledFilter, setReconciledFilter] = useState("all");

  const filtered = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (reconciledFilter === "yes" && t.reconciled !== 1) return false;
    if (reconciledFilter === "no" && t.reconciled !== 0) return false;
    return true;
  });

  // Group: build map of parentId → child fees
  const feesByParent = new Map<string, Transaction[]>();
  const childIds = new Set<string>();

  for (const t of filtered) {
    if (t.parentTransactionId) {
      const existing = feesByParent.get(t.parentTransactionId) ?? [];
      existing.push(t);
      feesByParent.set(t.parentTransactionId, existing);
      childIds.add(t.id);
    }
  }

  // Top-level rows: everything except child fees
  const topLevel = filtered.filter((t) => !childIds.has(t.id));

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
          <option value="transfer">Transferencias</option>
          <option value="fee">Comisiones</option>
        </select>

        <select
          value={reconciledFilter}
          onChange={(e) => setReconciledFilter(e.target.value)}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="all">Reconciliacion: Todos</option>
          <option value="yes">Reconciliados</option>
          <option value="no">Sin reconciliar</option>
        </select>

        <span className="text-sm text-[#666] self-center ml-auto">
          {filtered.length} resultados
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left text-xs font-medium text-[#666] px-4 py-3">Fecha</th>
              <th className="text-left text-xs font-medium text-[#666] px-4 py-3">Entidad</th>
              <th className="text-left text-xs font-medium text-[#666] px-4 py-3">Descripcion</th>
              <th className="text-left text-xs font-medium text-[#666] px-4 py-3">Categoria</th>
              <th className="text-left text-xs font-medium text-[#666] px-4 py-3">Tipo</th>
              <th className="text-right text-xs font-medium text-[#666] px-4 py-3">Monto</th>
              <th className="text-center text-xs font-medium text-[#666] px-4 py-3">Rec.</th>
            </tr>
          </thead>
          <tbody>
            {topLevel.map((t) => {
              const childFees = feesByParent.get(t.id) ?? [];
              const totalFees = childFees.reduce((sum, f) => sum + Math.abs(f.amount), 0);
              const hasLinkedFees = childFees.length > 0;

              return (
                <TransactionGroup
                  key={t.id}
                  transaction={t}
                  childFees={childFees}
                  totalFees={totalFees}
                  hasLinkedFees={hasLinkedFees}
                  fmt={fmt}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionGroup({
  transaction: t,
  childFees,
  totalFees,
  hasLinkedFees,
  fmt,
}: {
  transaction: Transaction;
  childFees: Transaction[];
  totalFees: number;
  hasLinkedFees: boolean;
  fmt: (n: number) => string;
}) {
  return (
    <>
      {/* Parent row */}
      <tr className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors">
        <td className="px-4 py-3 text-sm text-[#9d9a9c]">
          {new Date(t.date).toLocaleDateString("es")}
        </td>
        <td className="px-4 py-3 text-sm text-white">
          {t.entityName ?? t.counterpartyName ?? "\u2014"}
        </td>
        <td className="px-4 py-3 text-sm text-[#9d9a9c] max-w-[200px] truncate">
          {t.description}
        </td>
        <td className="px-4 py-3">
          {t.category ? (
            <span className="text-xs bg-[#2a2a2a] text-[#9d9a9c] px-2 py-0.5 rounded">
              {t.category}
            </span>
          ) : (
            <span className="text-xs text-[#666]">{"\u2014"}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            t.type === "income"
              ? "bg-green-500/20 text-green-400"
              : t.type === "expense"
                ? "bg-red-500/20 text-red-400"
                : "bg-gray-500/20 text-gray-400"
          }`}>
            {t.type ?? "\u2014"}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className={`text-sm font-mono ${
            t.amount >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {fmt(t.amount)}
          </span>
          {hasLinkedFees && (
            <span className="block text-xs text-[#ffd053] font-mono mt-0.5">
              neto: {fmt(t.amount - totalFees)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-block w-2 h-2 rounded-full ${
            t.reconciled ? "bg-green-500" : "bg-[#2a2a2a]"
          }`} />
        </td>
      </tr>

      {/* Child fee rows (indented) */}
      {childFees.map((fee) => (
        <tr key={fee.id} className="border-b border-[#2a2a2a] last:border-0 bg-[#0e0e0e]">
          <td className="px-4 py-2 text-xs text-[#666]">
            {new Date(fee.date).toLocaleDateString("es")}
          </td>
          <td className="px-4 py-2 text-xs text-[#666] pl-8">
            <span className="text-[#ffd053] mr-1">{"\u2514"}</span>
            {fee.entityName ?? fee.counterpartyName ?? "\u2014"}
          </td>
          <td className="px-4 py-2 text-xs text-[#666] max-w-[200px] truncate">
            {fee.description}
          </td>
          <td className="px-4 py-2">
            <span className="text-[10px] bg-[#2a2a2a] text-[#666] px-1.5 py-0.5 rounded">
              {fee.category ?? "fee"}
            </span>
          </td>
          <td className="px-4 py-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd053]/20 text-[#ffd053]">
              fee
            </span>
          </td>
          <td className="px-4 py-2 text-xs font-mono text-right text-red-400">
            {fmt(fee.amount)}
          </td>
          <td className="px-4 py-2 text-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2a2a2a]" />
          </td>
        </tr>
      ))}
    </>
  );
}
