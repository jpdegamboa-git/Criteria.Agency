import { layout } from "./layout.js";
import { financeNav } from "./finance-nav.js";

export async function renderFinanceTransactions(): Promise<string> {
  return layout(
    "Transacciones",
    `
    ${financeNav("transactions")}


    <main class="max-w-7xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-bold text-criteria-white mb-6">Transacciones</h1>

      <!-- Filter bar -->
      <div class="flex flex-wrap items-end gap-4 mb-6 bg-criteria-dark border border-criteria-border rounded-lg p-4">
        <div>
          <label class="block text-xs text-criteria-muted mb-1">Tipo</label>
          <select id="filter-type" class="bg-criteria-gray border border-criteria-border text-criteria-light text-sm rounded px-3 py-2 focus:outline-none focus:border-criteria-accent">
            <option value="">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-criteria-muted mb-1">Categoria</label>
          <select id="filter-category" class="bg-criteria-gray border border-criteria-border text-criteria-light text-sm rounded px-3 py-2 focus:outline-none focus:border-criteria-accent">
            <option value="">Todas</option>
            <option value="servicios">Servicios</option>
            <option value="nomina">Nomina</option>
            <option value="software">Software</option>
            <option value="publicidad">Publicidad</option>
            <option value="impuestos">Impuestos</option>
            <option value="infraestructura">Infraestructura</option>
            <option value="honorarios">Honorarios</option>
            <option value="ventas">Ventas</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-criteria-muted mb-1">Reconciliado</label>
          <select id="filter-reconciled" class="bg-criteria-gray border border-criteria-border text-criteria-light text-sm rounded px-3 py-2 focus:outline-none focus:border-criteria-accent">
            <option value="">Todos</option>
            <option value="1">Si</option>
            <option value="0">No</option>
          </select>
        </div>
        <button id="btn-apply" class="bg-criteria-accent text-criteria-black text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition">
          Aplicar
        </button>
      </div>

      <!-- Transaction table -->
      <div class="overflow-x-auto border border-criteria-border rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-criteria-dark text-criteria-muted uppercase text-xs">
            <tr>
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Entidad</th>
              <th class="px-4 py-3 text-left">Descripcion</th>
              <th class="px-4 py-3 text-right">Monto</th>
              <th class="px-4 py-3 text-left">Categoria</th>
              <th class="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody id="txn-body" class="divide-y divide-criteria-border">
            <tr><td colspan="6" class="px-4 py-8 text-center text-criteria-muted">Cargando...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4">
        <span id="pagination-info" class="text-sm text-criteria-muted"></span>
        <div class="flex gap-2">
          <button id="btn-prev" class="px-3 py-1.5 text-sm border border-criteria-border rounded text-criteria-muted hover:text-criteria-light disabled:opacity-40" disabled>Anterior</button>
          <button id="btn-next" class="px-3 py-1.5 text-sm border border-criteria-border rounded text-criteria-muted hover:text-criteria-light disabled:opacity-40" disabled>Siguiente</button>
        </div>
      </div>
    </main>

    <script>
      (function () {
        var LIMIT = 50;
        var currentOffset = 0;
        var totalCount = 0;

        var tbody = document.getElementById("txn-body");
        var paginationInfo = document.getElementById("pagination-info");
        var btnPrev = document.getElementById("btn-prev");
        var btnNext = document.getElementById("btn-next");

        function buildQuery() {
          var type = document.getElementById("filter-type").value;
          var category = document.getElementById("filter-category").value;
          var reconciled = document.getElementById("filter-reconciled").value;
          var params = new URLSearchParams({ limit: String(LIMIT), offset: String(currentOffset) });
          if (type) params.set("type", type);
          if (category) params.set("category", category);
          if (reconciled) params.set("reconciled", reconciled);
          return params.toString();
        }

        function formatMoney(amount) {
          var n = Number(amount);
          var formatted = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          var sign = n >= 0 ? "" : "-";
          return { text: sign + "$" + formatted, color: n >= 0 ? "text-green-400" : "text-red-400" };
        }

        function formatDate(d) {
          return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
        }

        function escapeHtml(str) {
          var div = document.createElement("div");
          div.textContent = str;
          return div.innerHTML;
        }

        function showShimmerRows() {
          tbody.textContent = "";
          for (var s = 0; s < 8; s++) {
            var tr = document.createElement("tr");
            tr.className = "animate-pulse border-b border-criteria-border";
            var widths = ["80px", "128px", "160px", "96px", "80px", "72px"];
            widths.forEach(function(w) {
              var td = document.createElement("td");
              td.className = "px-4 py-3";
              var div = document.createElement("div");
              div.className = "h-4 bg-criteria-gray rounded";
              div.style.width = w;
              td.appendChild(div);
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          }
        }

        async function loadTransactions() {
          showShimmerRows();
          try {
            var res = await fetch("/api/transactions?" + buildQuery());
            var json = await res.json();
            totalCount = json.total;
            renderRows(json.data);
            updatePagination();
          } catch (e) {
            tbody.textContent = "";
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.setAttribute("colspan", "6");
            td.className = "px-4 py-8 text-center text-red-400";
            td.textContent = "Error cargando transacciones";
            tr.appendChild(td);
            tbody.appendChild(tr);
          }
        }

        function renderRows(rows) {
          tbody.textContent = "";
          if (!rows.length) {
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.setAttribute("colspan", "6");
            td.className = "px-4 py-8 text-center text-criteria-muted";
            td.textContent = "Sin transacciones";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
          }
          rows.forEach(function (t) {
            var tr = document.createElement("tr");
            tr.className = "hover:bg-criteria-dark/50";

            var tdDate = document.createElement("td");
            tdDate.className = "px-4 py-3 text-criteria-text";
            tdDate.textContent = formatDate(t.date);

            var tdEntity = document.createElement("td");
            tdEntity.className = "px-4 py-3 text-criteria-light";
            tdEntity.textContent = t.entityName || t.counterpartyName || "\\u2014";

            var tdDesc = document.createElement("td");
            tdDesc.className = "px-4 py-3 text-criteria-text max-w-xs truncate";
            tdDesc.textContent = t.description || "\\u2014";

            var m = formatMoney(t.amount);
            var tdAmount = document.createElement("td");
            tdAmount.className = "px-4 py-3 text-right font-mono " + m.color;
            tdAmount.textContent = m.text;

            var tdCat = document.createElement("td");
            tdCat.className = "px-4 py-3";
            if (t.category) {
              var badge = document.createElement("span");
              badge.className = "px-2 py-0.5 rounded-full text-xs font-medium bg-criteria-gray border border-criteria-border text-criteria-light";
              badge.textContent = t.category;
              tdCat.appendChild(badge);
            } else {
              tdCat.textContent = "\\u2014";
            }

            var tdStatus = document.createElement("td");
            tdStatus.className = "px-4 py-3";
            if (t.reconciled) {
              var statusBadge = document.createElement("span");
              statusBadge.className = "px-2 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300";
              statusBadge.textContent = "Reconciliado";
              tdStatus.appendChild(statusBadge);
            }

            tr.appendChild(tdDate);
            tr.appendChild(tdEntity);
            tr.appendChild(tdDesc);
            tr.appendChild(tdAmount);
            tr.appendChild(tdCat);
            tr.appendChild(tdStatus);
            tbody.appendChild(tr);
          });
        }

        function updatePagination() {
          var from = totalCount === 0 ? 0 : currentOffset + 1;
          var to = Math.min(currentOffset + LIMIT, totalCount);
          paginationInfo.textContent = "Mostrando " + from + "-" + to + " de " + totalCount;
          btnPrev.disabled = currentOffset === 0;
          btnNext.disabled = currentOffset + LIMIT >= totalCount;
        }

        btnPrev.addEventListener("click", function () { currentOffset = Math.max(0, currentOffset - LIMIT); loadTransactions(); });
        btnNext.addEventListener("click", function () { currentOffset += LIMIT; loadTransactions(); });
        document.getElementById("btn-apply").addEventListener("click", function () { currentOffset = 0; loadTransactions(); });

        loadTransactions();
      })();
    </script>
    `,
  );
}
