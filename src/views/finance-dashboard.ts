import { layout } from "./layout.js";
import { financeNav } from "./finance-nav.js";

export async function renderFinanceDashboard(): Promise<string> {
  return layout(
    "Dashboard Financiero",
    `
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    ${financeNav("dashboard")}

    <main class="max-w-7xl mx-auto px-6 py-8">

      <!-- Header + Period Selector -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-criteria-white">Dashboard Financiero</h1>
        <select id="periodSelector"
          class="bg-criteria-gray border border-criteria-border text-criteria-light rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-criteria-accent">
          <option value="month">Este mes</option>
          <option value="last_month">Ultimo mes</option>
          <option value="quarter">Ultimos 3 meses</option>
          <option value="year">Este ano</option>
        </select>
      </div>

      <!-- KPI Cards -->
      <div id="kpiCards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Skeleton placeholders shown while loading -->
        <div class="animate-pulse bg-criteria-gray border border-criteria-border rounded-xl p-5 h-24"></div>
        <div class="animate-pulse bg-criteria-gray border border-criteria-border rounded-xl p-5 h-24"></div>
        <div class="animate-pulse bg-criteria-gray border border-criteria-border rounded-xl p-5 h-24"></div>
        <div class="animate-pulse bg-criteria-gray border border-criteria-border rounded-xl p-5 h-24"></div>
      </div>

      <!-- Cash Flow Chart -->
      <div class="bg-criteria-gray border border-criteria-border rounded-xl p-6 mb-8">
        <h2 class="text-lg font-semibold text-criteria-white mb-4">Flujo de Efectivo</h2>
        <div class="relative" style="height: 320px;">
          <canvas id="cashFlowChart"></canvas>
        </div>
      </div>

      <!-- Top Entities -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <!-- Top Proveedores -->
        <div class="bg-criteria-gray border border-criteria-border rounded-xl p-6">
          <h2 class="text-lg font-semibold text-criteria-white mb-4">Top Proveedores</h2>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-criteria-muted border-b border-criteria-border">
                <th class="text-left pb-3 font-medium">Nombre</th>
                <th class="text-right pb-3 font-medium">Total</th>
                <th class="text-right pb-3 font-medium">Txns</th>
              </tr>
            </thead>
            <tbody id="topVendorsBody"></tbody>
          </table>
          <p id="topVendorsEmpty" class="text-criteria-muted text-sm py-4 text-center hidden">Sin datos</p>
        </div>
        <!-- Top Clientes -->
        <div class="bg-criteria-gray border border-criteria-border rounded-xl p-6">
          <h2 class="text-lg font-semibold text-criteria-white mb-4">Top Clientes</h2>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-criteria-muted border-b border-criteria-border">
                <th class="text-left pb-3 font-medium">Nombre</th>
                <th class="text-right pb-3 font-medium">Total</th>
                <th class="text-right pb-3 font-medium">Txns</th>
              </tr>
            </thead>
            <tbody id="topClientsBody"></tbody>
          </table>
          <p id="topClientsEmpty" class="text-criteria-muted text-sm py-4 text-center hidden">Sin datos</p>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-criteria-gray border border-criteria-border rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-criteria-white">Transacciones Recientes</h2>
          <a href="/admin/finances/transactions" class="text-criteria-accent text-sm hover:underline">Ver todas &rarr;</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-criteria-muted border-b border-criteria-border">
                <th class="text-left pb-3 font-medium">Fecha</th>
                <th class="text-left pb-3 font-medium">Entidad</th>
                <th class="text-right pb-3 font-medium">Monto</th>
                <th class="text-left pb-3 font-medium">Categoria</th>
              </tr>
            </thead>
            <tbody id="recentTxnsBody"></tbody>
          </table>
          <p id="recentTxnsEmpty" class="text-criteria-muted text-sm py-4 text-center hidden">Sin transacciones</p>
        </div>
      </div>
    </main>

    <script>
      (function() {
        function fmt(amount) {
          return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function changeBadge(pct) {
          var val = Number(pct || 0);
          var sign = val >= 0 ? '+' : '';
          return sign + val.toFixed(1) + '%';
        }

        function periodParam() {
          return document.getElementById('periodSelector').value;
        }

        function escapeHtml(str) {
          var div = document.createElement('div');
          div.textContent = str;
          return div.textContent;
        }

        var cashFlowChartInstance = null;

        function makeKpiCard(label, valueText, valueClass, changeText, changeBgClass, changeTextClass) {
          var card = document.createElement('div');
          card.className = 'bg-criteria-gray border border-criteria-border rounded-xl p-5';
          var lbl = document.createElement('p');
          lbl.className = 'text-criteria-muted text-sm mb-1';
          lbl.textContent = label;
          var val = document.createElement('p');
          val.className = 'text-2xl font-bold ' + valueClass;
          val.textContent = valueText;
          card.appendChild(lbl);
          card.appendChild(val);
          if (changeText) {
            var badge = document.createElement('span');
            badge.className = 'inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ' + changeBgClass + ' ' + changeTextClass;
            badge.textContent = changeText;
            card.appendChild(badge);
          }
          return card;
        }

        function renderKpiCards(d) {
          var container = document.getElementById('kpiCards');
          while (container.firstChild) container.removeChild(container.firstChild);
          var incomeChange = d.changes ? changeBadge(d.changes.income) : null;
          var expensesChange = d.changes ? changeBadge(d.changes.expenses) : null;
          var balanceChange = d.changes ? changeBadge(d.changes.balance) : null;
          container.appendChild(makeKpiCard('Ingresos', fmt(d.income), 'text-green-400', incomeChange, 'bg-green-400/10', 'text-green-400'));
          container.appendChild(makeKpiCard('Gastos', fmt(d.expenses), 'text-red-400', expensesChange, 'bg-red-400/10', 'text-red-400'));
          container.appendChild(makeKpiCard('Balance', fmt(d.balance), 'text-criteria-white', balanceChange, 'bg-criteria-border', 'text-criteria-light'));
          container.appendChild(makeKpiCard('Por cobrar', fmt(d.receivable), 'text-amber-400', null, '', ''));
        }

        async function loadSummary() {
          try {
            var res = await fetch('/api/finances/summary?period=' + periodParam());
            var d = await res.json();
            renderKpiCards(d);
          } catch(e) { console.error('summary fetch error', e); }
        }

        async function loadCashFlow() {
          try {
            var res = await fetch('/api/finances/cash-flow?months=6');
            var data = await res.json();
            var labels = data.map(function(d) { return d.month; });
            var incomes = data.map(function(d) { return d.income; });
            var expenses = data.map(function(d) { return d.expenses; });

            var ctx = document.getElementById('cashFlowChart').getContext('2d');
            if (cashFlowChartInstance) cashFlowChartInstance.destroy();

            cashFlowChartInstance = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [
                  {
                    label: 'Ingresos',
                    data: incomes,
                    backgroundColor: 'rgba(74, 222, 128, 0.7)',
                    borderColor: 'rgba(74, 222, 128, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                  },
                  {
                    label: 'Gastos',
                    data: expenses,
                    backgroundColor: 'rgba(248, 113, 113, 0.7)',
                    borderColor: 'rgba(248, 113, 113, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#a0a0a0' }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { color: '#2a2a2a' }
                  },
                  y: {
                    ticks: {
                      color: '#a0a0a0',
                      callback: function(v) { return '$' + v.toLocaleString(); }
                    },
                    grid: { color: '#2a2a2a' }
                  }
                }
              }
            });
          } catch(e) { console.error('cash-flow fetch error', e); }
        }

        async function loadTopEntities() {
          showTableSkeleton('topVendorsBody', 3);
          showTableSkeleton('topClientsBody', 3);
          try {
            var res = await fetch('/api/finances/top-entities?period=' + periodParam());
            var d = await res.json();

            var vBody = document.getElementById('topVendorsBody');
            var vEmpty = document.getElementById('topVendorsEmpty');
            vBody.textContent = '';
            if (d.topVendors && d.topVendors.length) {
              vEmpty.classList.add('hidden');
              d.topVendors.forEach(function(v) {
                var tr = document.createElement('tr');
                tr.className = 'border-b border-criteria-border';
                var tdName = document.createElement('td');
                tdName.className = 'py-2 text-criteria-light';
                tdName.textContent = v.name || 'Sin nombre';
                var tdTotal = document.createElement('td');
                tdTotal.className = 'py-2 text-right text-criteria-light';
                tdTotal.textContent = fmt(v.total);
                var tdCount = document.createElement('td');
                tdCount.className = 'py-2 text-right text-criteria-muted';
                tdCount.textContent = String(v.count || 0);
                tr.appendChild(tdName);
                tr.appendChild(tdTotal);
                tr.appendChild(tdCount);
                vBody.appendChild(tr);
              });
            } else {
              vEmpty.classList.remove('hidden');
            }

            var cBody = document.getElementById('topClientsBody');
            var cEmpty = document.getElementById('topClientsEmpty');
            cBody.textContent = '';
            if (d.topClients && d.topClients.length) {
              cEmpty.classList.add('hidden');
              d.topClients.forEach(function(cl) {
                var tr = document.createElement('tr');
                tr.className = 'border-b border-criteria-border';
                var tdName = document.createElement('td');
                tdName.className = 'py-2 text-criteria-light';
                tdName.textContent = cl.name || 'Sin nombre';
                var tdTotal = document.createElement('td');
                tdTotal.className = 'py-2 text-right text-criteria-light';
                tdTotal.textContent = fmt(cl.total);
                var tdCount = document.createElement('td');
                tdCount.className = 'py-2 text-right text-criteria-muted';
                tdCount.textContent = String(cl.count || 0);
                tr.appendChild(tdName);
                tr.appendChild(tdTotal);
                tr.appendChild(tdCount);
                cBody.appendChild(tr);
              });
            } else {
              cEmpty.classList.remove('hidden');
            }
          } catch(e) { console.error('top-entities fetch error', e); }
        }

        function showTableSkeleton(tbodyId, cols) {
          var tbody = document.getElementById(tbodyId);
          if (!tbody) return;
          tbody.textContent = '';
          for (var s = 0; s < 5; s++) {
            var tr = document.createElement('tr');
            tr.className = 'animate-pulse border-b border-criteria-border';
            for (var c = 0; c < cols; c++) {
              var td = document.createElement('td');
              td.className = 'py-3 px-2';
              var div = document.createElement('div');
              div.className = 'h-4 bg-criteria-gray rounded';
              div.style.width = (c === 0 ? '96px' : c === 1 ? '128px' : '64px');
              td.appendChild(div);
              tr.appendChild(td);
            }
            tbody.appendChild(tr);
          }
        }

        async function loadTransactions() {
          showTableSkeleton('recentTxnsBody', 4);
          try {
            var res = await fetch('/api/transactions?limit=10');
            var d = await res.json();
            var tbody = document.getElementById('recentTxnsBody');
            var empty = document.getElementById('recentTxnsEmpty');
            tbody.textContent = '';
            if (d.data && d.data.length) {
              empty.classList.add('hidden');
              d.data.forEach(function(tx) {
                var dateStr = tx.date ? new Date(tx.date).toLocaleDateString('es-MX') : '-';
                var isIncome = tx.type === 'income';
                var tr = document.createElement('tr');
                tr.className = 'border-b border-criteria-border';
                var tdDate = document.createElement('td');
                tdDate.className = 'py-2 text-criteria-muted';
                tdDate.textContent = dateStr;
                var tdEntity = document.createElement('td');
                tdEntity.className = 'py-2 text-criteria-light';
                tdEntity.textContent = tx.entityName || tx.description || '-';
                var tdAmount = document.createElement('td');
                tdAmount.className = 'py-2 text-right ' + (isIncome ? 'text-green-400' : 'text-red-400');
                tdAmount.textContent = (isIncome ? '+' : '-') + fmt(Math.abs(tx.amount));
                var tdCat = document.createElement('td');
                tdCat.className = 'py-2 text-criteria-muted';
                tdCat.textContent = tx.category || '-';
                tr.appendChild(tdDate);
                tr.appendChild(tdEntity);
                tr.appendChild(tdAmount);
                tr.appendChild(tdCat);
                tbody.appendChild(tr);
              });
            } else {
              empty.classList.remove('hidden');
            }
          } catch(e) { console.error('transactions fetch error', e); }
        }

        async function loadAll() {
          await Promise.all([loadSummary(), loadCashFlow(), loadTopEntities(), loadTransactions()]);
        }

        document.getElementById('periodSelector').addEventListener('change', function() {
          loadSummary();
          loadTopEntities();
        });

        loadAll();
      })();
    </script>
    `,
  );
}
