import { layout } from "./layout.js";
import { financeNav } from "./finance-nav.js";

export async function renderFinanceReconciliation(): Promise<string> {
  return layout(
    "Reconciliacion",
    `
    ${financeNav("reconciliation")}


    <main class="max-w-7xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-bold text-criteria-white mb-6">Reconciliacion</h1>

      <div class="flex gap-6">
        <!-- Left panel: Expected payments -->
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-criteria-light mb-4">Pagos Esperados</h2>
          <div id="expected-list" class="space-y-3">
            <div class="text-criteria-muted text-sm py-8 text-center">Cargando...</div>
          </div>
        </div>

        <!-- Right panel: Unreconciled income -->
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-criteria-light mb-4">Ingresos Sin Reconciliar</h2>
          <div id="income-list" class="space-y-3">
            <div class="text-criteria-muted text-sm py-8 text-center">Cargando...</div>
          </div>
        </div>
      </div>
    </main>

    <script>
      (function () {
        var expectedPayments = [];
        var unreconciledIncome = [];

        function formatMoney(amount) {
          var n = Math.abs(Number(amount));
          return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function formatDate(d) {
          return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
        }

        function daysOverdue(dueDate) {
          var now = new Date();
          var due = new Date(dueDate);
          return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }

        function findMatchingIncome(expectedAmount) {
          return unreconciledIncome.find(function (t) {
            return Number(t.amount) === Number(expectedAmount);
          });
        }

        function findMatchingExpected(incomeAmount) {
          return expectedPayments.find(function (p) {
            return Number(p.amount) === Number(incomeAmount);
          });
        }

        function renderExpected() {
          var el = document.getElementById("expected-list");
          el.textContent = "";

          if (!expectedPayments.length) {
            var empty = document.createElement("div");
            empty.className = "text-criteria-muted text-sm py-8 text-center";
            empty.textContent = "Sin pagos esperados pendientes";
            el.appendChild(empty);
            return;
          }

          expectedPayments.forEach(function (p) {
            var match = findMatchingIncome(p.amount);
            var overdue = daysOverdue(p.dueDate);

            var card = document.createElement("div");
            card.className = "border rounded-lg p-4 " + (match ? "border-amber-500/50 bg-amber-500/5" : "border-criteria-border");

            var topRow = document.createElement("div");
            topRow.className = "flex items-center justify-between mb-1";
            var nameSpan = document.createElement("span");
            nameSpan.className = "text-criteria-light font-medium text-sm";
            nameSpan.textContent = p.clientName || p.entityName || "\u2014";
            var amountSpan = document.createElement("span");
            amountSpan.className = "text-green-400 font-mono text-sm";
            amountSpan.textContent = formatMoney(p.amount);
            topRow.appendChild(nameSpan);
            topRow.appendChild(amountSpan);

            var bottomRow = document.createElement("div");
            bottomRow.className = "flex items-center justify-between";
            var dueSpan = document.createElement("span");
            dueSpan.className = "text-criteria-muted text-xs";
            dueSpan.textContent = "Vence: " + formatDate(p.dueDate);
            var overdueSpan = document.createElement("span");
            overdueSpan.className = overdue > 0 ? "text-red-400 text-xs font-medium" : "text-criteria-muted text-xs";
            overdueSpan.textContent = overdue > 0 ? overdue + " dias vencido" : "Al dia";
            bottomRow.appendChild(dueSpan);
            bottomRow.appendChild(overdueSpan);

            card.appendChild(topRow);
            card.appendChild(bottomRow);

            if (match) {
              var btn = document.createElement("button");
              btn.className = "mt-2 bg-criteria-accent text-criteria-black text-xs font-medium px-3 py-1 rounded hover:opacity-90 transition";
              btn.textContent = "Confirmar";
              btn.addEventListener("click", function () {
                reconcile(match.id, p.id);
              });
              card.appendChild(btn);
            } else {
              var noMatch = document.createElement("span");
              noMatch.className = "text-criteria-muted text-xs italic mt-2 inline-block";
              noMatch.textContent = "Sin match";
              card.appendChild(noMatch);
            }

            el.appendChild(card);
          });
        }

        function renderIncome() {
          var el = document.getElementById("income-list");
          el.textContent = "";

          if (!unreconciledIncome.length) {
            var empty = document.createElement("div");
            empty.className = "text-criteria-muted text-sm py-8 text-center";
            empty.textContent = "Sin ingresos sin reconciliar";
            el.appendChild(empty);
            return;
          }

          unreconciledIncome.forEach(function (t) {
            var match = findMatchingExpected(t.amount);

            var card = document.createElement("div");
            card.className = "border rounded-lg p-4 " + (match ? "border-amber-500/50 bg-amber-500/5" : "border-criteria-border");

            var topRow = document.createElement("div");
            topRow.className = "flex items-center justify-between mb-1";
            var nameSpan = document.createElement("span");
            nameSpan.className = "text-criteria-light font-medium text-sm";
            nameSpan.textContent = t.entityName || t.counterpartyName || "\u2014";
            var amountSpan = document.createElement("span");
            amountSpan.className = "text-green-400 font-mono text-sm";
            amountSpan.textContent = formatMoney(t.amount);
            topRow.appendChild(nameSpan);
            topRow.appendChild(amountSpan);

            var bottomRow = document.createElement("div");
            bottomRow.className = "flex items-center justify-between";
            var dateSpan = document.createElement("span");
            dateSpan.className = "text-criteria-muted text-xs";
            dateSpan.textContent = formatDate(t.date);
            var descSpan = document.createElement("span");
            descSpan.className = "text-criteria-text text-xs max-w-[200px] truncate";
            var desc = t.description || "\u2014";
            descSpan.textContent = desc.length > 60 ? desc.substring(0, 60) + "..." : desc;
            bottomRow.appendChild(dateSpan);
            bottomRow.appendChild(descSpan);

            card.appendChild(topRow);
            card.appendChild(bottomRow);

            if (!match) {
              var noMatch = document.createElement("span");
              noMatch.className = "text-criteria-muted text-xs italic mt-2 inline-block";
              noMatch.textContent = "Sin match";
              card.appendChild(noMatch);
            }

            el.appendChild(card);
          });
        }

        async function reconcile(txnId, expectedPaymentId) {
          try {
            var res = await fetch("/api/transactions/" + txnId + "/reconcile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expectedPaymentId: expectedPaymentId }),
            });
            if (!res.ok) throw new Error("Reconcile failed");
            window.location.reload();
          } catch (e) {
            alert("Error al reconciliar: " + e.message);
          }
        }

        async function loadAll() {
          try {
            var results = await Promise.all([
              fetch("/api/expected-payments?status=pending"),
              fetch("/api/transactions?limit=50"),
            ]);
            var epData = await results[0].json();
            var txnData = await results[1].json();

            expectedPayments = Array.isArray(epData) ? epData : (epData.data || []);
            var allTxns = Array.isArray(txnData) ? txnData : (txnData.data || []);
            unreconciledIncome = allTxns.filter(function (t) {
              return t.type === "income" && !t.reconciled;
            });

            renderExpected();
            renderIncome();
          } catch (e) {
            var expEl = document.getElementById("expected-list");
            expEl.textContent = "";
            var errExp = document.createElement("div");
            errExp.className = "text-red-400 text-sm py-4 text-center";
            errExp.textContent = "Error cargando datos";
            expEl.appendChild(errExp);

            var incEl = document.getElementById("income-list");
            incEl.textContent = "";
            var errInc = document.createElement("div");
            errInc.className = "text-red-400 text-sm py-4 text-center";
            errInc.textContent = "Error cargando datos";
            incEl.appendChild(errInc);
          }
        }

        loadAll();
      })();
    </script>
    `,
  );
}
