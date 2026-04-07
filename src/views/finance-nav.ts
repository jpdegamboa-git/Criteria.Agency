export type FinanceNavActive = "dashboard" | "transactions" | "reconciliation" | "import";

export function financeNav(active: FinanceNavActive): string {
  const items: Array<{ href: string; label: string; key: FinanceNavActive }> = [
    { href: "/admin/finances", label: "Dashboard", key: "dashboard" },
    { href: "/admin/finances/transactions", label: "Transacciones", key: "transactions" },
    { href: "/admin/finances/reconciliation", label: "Conciliacion", key: "reconciliation" },
    { href: "/admin/finances/import", label: "Importar", key: "import" },
  ];
  return `
  <nav class="border-b border-criteria-border bg-criteria-dark">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-2">
          <a href="/admin/dashboard" class="text-criteria-accent font-bold text-lg tracking-tight">criteria.agency</a>
          <span class="text-criteria-muted text-sm ml-1">/ Finanzas</span>
        </div>
        <div class="flex items-center gap-1 text-sm">
          ${items
            .map(
              (item) =>
                `<a href="${item.href}" class="px-3 py-2 rounded-lg font-medium transition-colors ${
                  active === item.key
                    ? "text-criteria-white bg-criteria-gray"
                    : "text-criteria-muted hover:text-criteria-light hover:bg-criteria-gray/50"
                }">${item.label}</a>`,
            )
            .join("")}
        </div>
      </div>
    </div>
  </nav>`;
}
