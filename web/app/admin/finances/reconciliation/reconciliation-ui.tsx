"use client";

interface PendingPayment {
  id: string;
  clientName: string | null;
  amount: number;
  currency: string;
  description: string;
  dueDate: Date;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
}

interface UnreconciledTx {
  id: string;
  date: Date;
  amount: number;
  description: string;
  counterpartyName: string | null;
}

export function ReconciliationUI({
  pending,
  unreconciled,
}: {
  pending: PendingPayment[];
  unreconciled: UnreconciledTx[];
}) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  // Find potential matches (same amount)
  const matches = new Map<string, string[]>();
  for (const p of pending) {
    const matching = unreconciled
      .filter((t) => Math.abs(t.amount - p.amount) < 0.01)
      .map((t) => t.id);
    if (matching.length > 0) {
      matches.set(p.id, matching);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expected Payments */}
      <div>
        <h2 className="text-sm font-medium text-[#666] mb-4">Pagos esperados</h2>
        <div className="space-y-2">
          {pending.length === 0 ? (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
              <p className="text-[#666]">Sin pagos pendientes</p>
            </div>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className={`bg-[#141414] border rounded-lg px-4 py-3 ${
                  matches.has(p.id)
                    ? "border-[#ffd053]/40"
                    : p.isOverdue
                      ? "border-red-500/30"
                      : "border-[#2a2a2a]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {p.clientName ?? "—"}
                  </span>
                  <span className="text-sm font-mono text-green-400">
                    {fmt(p.amount)}
                  </span>
                </div>
                <p className="text-xs text-[#9d9a9c]">{p.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[#666]">
                    Vence: {new Date(p.dueDate).toLocaleDateString("es")}
                  </span>
                  {p.isOverdue && (
                    <span className="text-xs text-red-400">
                      {p.daysOverdue}d vencido
                    </span>
                  )}
                  {matches.has(p.id) && (
                    <span className="text-xs text-[#ffd053]">
                      Match encontrado
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unreconciled Income */}
      <div>
        <h2 className="text-sm font-medium text-[#666] mb-4">Ingresos sin reconciliar</h2>
        <div className="space-y-2">
          {unreconciled.length === 0 ? (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
              <p className="text-[#666]">Todo reconciliado</p>
            </div>
          ) : (
            unreconciled.map((t) => {
              const isMatch = Array.from(matches.values()).some((ids) =>
                ids.includes(t.id),
              );
              return (
                <div
                  key={t.id}
                  className={`bg-[#141414] border rounded-lg px-4 py-3 ${
                    isMatch ? "border-[#ffd053]/40" : "border-[#2a2a2a]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {t.counterpartyName ?? "Desconocido"}
                    </span>
                    <span className="text-sm font-mono text-green-400">
                      {fmt(t.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[#9d9a9c] truncate">
                    {t.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#666]">
                      {new Date(t.date).toLocaleDateString("es")}
                    </span>
                    {isMatch && (
                      <span className="text-xs text-[#ffd053]">
                        Posible match
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
