import { layout } from "./layout.js";

const financeNav = `
<nav class="border-b border-criteria-border">
  <div class="max-w-6xl mx-auto px-6 py-3 flex gap-6">
    <a href="/admin/finances" class="text-criteria-muted hover:text-criteria-light">Dashboard</a>
    <a href="/admin/finances/transactions" class="text-criteria-muted hover:text-criteria-light">Transacciones</a>
    <a href="/admin/finances/reconciliation" class="text-criteria-muted hover:text-criteria-light">Reconciliacion</a>
    <a href="/admin/finances/import" class="text-criteria-accent font-medium">Importar</a>
  </div>
</nav>`;

export async function renderFinanceImport(): Promise<string> {
  const body = `
${financeNav}

<div class="max-w-4xl mx-auto px-6 py-10">
  <h1 class="text-2xl font-bold text-criteria-white mb-8">Importar Estado de Cuenta</h1>

  <!-- Upload Section -->
  <div class="bg-criteria-dark border border-criteria-border rounded-lg p-6 mb-8">
    <!-- Account Selector -->
    <div class="mb-6">
      <label class="block text-sm text-criteria-text mb-3">Cuenta</label>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="accountId" value="checking" checked
            class="accent-criteria-accent" />
          <span class="text-criteria-light">Cuenta Corriente</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="accountId" value="savings"
            class="accent-criteria-accent" />
          <span class="text-criteria-light">Cuenta de Ahorros</span>
        </label>
      </div>
    </div>

    <!-- Drop Zone -->
    <div id="dropZone"
      class="border-2 border-dashed border-criteria-border rounded-lg p-12 text-center cursor-pointer
             hover:border-criteria-accent transition-colors">
      <div class="text-criteria-muted mb-2">
        <svg class="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p class="text-criteria-text mb-1">Arrastra tu archivo .txt o .csv aqui</p>
      <p class="text-criteria-muted text-sm">o haz clic para seleccionar</p>
      <input id="fileInput" type="file" accept=".txt,.csv" class="hidden" />
    </div>

    <p id="fileName" class="text-sm text-criteria-muted mt-3 hidden"></p>
    <p id="uploadError" class="text-sm text-red-400 mt-3 hidden"></p>
  </div>

  <!-- Preview Section -->
  <div id="previewSection" class="hidden mb-8">
    <div class="bg-criteria-dark border border-criteria-border rounded-lg p-6">
      <h2 class="text-lg font-semibold text-criteria-white mb-4">Vista Previa</h2>

      <!-- Summary -->
      <div id="previewSummary" class="flex gap-6 mb-6 text-sm">
        <span class="text-criteria-text">Encontradas: <strong id="statFound" class="text-criteria-light">0</strong></span>
        <span class="text-criteria-text">Nuevas: <strong id="statNew" class="text-criteria-accent">0</strong></span>
        <span class="text-criteria-text">Duplicadas: <strong id="statDuplicates" class="text-criteria-muted">0</strong></span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-criteria-border text-criteria-muted text-left">
              <th class="pb-2 pr-4">Fecha</th>
              <th class="pb-2 pr-4">Descripcion</th>
              <th class="pb-2 pr-4 text-right">Monto</th>
              <th class="pb-2">Tipo</th>
            </tr>
          </thead>
          <tbody id="previewBody"></tbody>
        </table>
      </div>

      <button id="importBtn"
        class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
        Importar
      </button>
    </div>
  </div>

  <!-- Result Section -->
  <div id="resultSection" class="hidden mb-8">
    <div class="bg-criteria-dark border border-criteria-border rounded-lg p-6">
      <h2 class="text-lg font-semibold text-criteria-white mb-6">Resultado de Importacion</h2>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div class="bg-criteria-gray rounded-lg p-4 text-center">
          <p id="resNew" class="text-2xl font-bold text-criteria-accent">0</p>
          <p class="text-xs text-criteria-muted mt-1">Importadas</p>
        </div>
        <div class="bg-criteria-gray rounded-lg p-4 text-center">
          <p id="resEntities" class="text-2xl font-bold text-criteria-light">0</p>
          <p class="text-xs text-criteria-muted mt-1">Entidades Creadas</p>
        </div>
        <div class="bg-criteria-gray rounded-lg p-4 text-center">
          <p id="resCategorized" class="text-2xl font-bold text-criteria-light">0</p>
          <p class="text-xs text-criteria-muted mt-1">Categorizadas</p>
        </div>
        <div class="bg-criteria-gray rounded-lg p-4 text-center">
          <p id="resReconciled" class="text-2xl font-bold text-criteria-light">0</p>
          <p class="text-xs text-criteria-muted mt-1">Reconciliadas</p>
        </div>
        <div class="bg-criteria-gray rounded-lg p-4 text-center">
          <p id="resUnmatched" class="text-2xl font-bold text-red-400">0</p>
          <p class="text-xs text-criteria-muted mt-1">Sin Match</p>
        </div>
      </div>
      <a href="/admin/finances/transactions" class="text-criteria-accent hover:underline text-sm">
        Ver transacciones &rarr;
      </a>
    </div>
  </div>

  <!-- Last Import -->
  <p id="lastImport" class="text-sm text-criteria-muted hidden"></p>
</div>

<script>
(function() {
  var dropZone = document.getElementById('dropZone');
  var fileInput = document.getElementById('fileInput');
  var fileNameEl = document.getElementById('fileName');
  var uploadError = document.getElementById('uploadError');
  var previewSection = document.getElementById('previewSection');
  var previewBody = document.getElementById('previewBody');
  var importBtn = document.getElementById('importBtn');
  var resultSection = document.getElementById('resultSection');

  var selectedFile = null;

  function getAccountId() {
    var checked = document.querySelector('input[name="accountId"]:checked');
    return checked ? checked.value : 'checking';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.textContent;
  }

  // Drag and drop
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('border-criteria-accent');
  });
  dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('border-criteria-accent');
  });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('border-criteria-accent');
    var files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  // Click to select
  dropZone.addEventListener('click', function() { fileInput.click(); });
  fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'txt' && ext !== 'csv') {
      showError('Solo se aceptan archivos .txt y .csv');
      return;
    }

    selectedFile = file;
    fileNameEl.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
    fileNameEl.classList.remove('hidden');
    uploadError.classList.add('hidden');
    previewSection.classList.add('hidden');
    resultSection.classList.add('hidden');

    var fd = new FormData();
    fd.append('file', file);
    fd.append('accountId', getAccountId());

    fetch('/api/transactions/import/preview', { method: 'POST', body: fd })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(err) { throw new Error(err.error || 'Error al procesar archivo'); });
        return res.json();
      })
      .then(function(data) { showPreview(data); })
      .catch(function(err) { showError(err.message); });
  }

  function showError(msg) {
    uploadError.textContent = msg;
    uploadError.classList.remove('hidden');
  }

  function showPreview(data) {
    document.getElementById('statFound').textContent = data.found || 0;
    document.getElementById('statNew').textContent = data['new'] || 0;
    document.getElementById('statDuplicates').textContent = data.duplicates || 0;

    // Clear previous rows
    while (previewBody.firstChild) previewBody.removeChild(previewBody.firstChild);

    var rows = (data.preview || []).slice(0, 10);
    rows.forEach(function(tx) {
      var amount = parseFloat(tx.amount || 0);
      var isIncome = amount > 0;
      var tr = document.createElement('tr');
      tr.className = 'border-b border-criteria-border';

      var tdDate = document.createElement('td');
      tdDate.className = 'py-2 pr-4 text-criteria-text';
      tdDate.textContent = tx.date || '';

      var tdDesc = document.createElement('td');
      tdDesc.className = 'py-2 pr-4 text-criteria-light';
      tdDesc.textContent = tx.description || '';

      var tdAmount = document.createElement('td');
      tdAmount.className = 'py-2 pr-4 text-right ' + (isIncome ? 'text-green-400' : 'text-red-400');
      tdAmount.textContent = (isIncome ? '+' : '') + amount.toLocaleString('es', { minimumFractionDigits: 2 });

      var tdType = document.createElement('td');
      tdType.className = 'py-2';
      var span = document.createElement('span');
      span.className = 'text-xs px-2 py-0.5 rounded ' + (isIncome ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400');
      span.textContent = isIncome ? 'Ingreso' : 'Gasto';
      tdType.appendChild(span);

      tr.appendChild(tdDate);
      tr.appendChild(tdDesc);
      tr.appendChild(tdAmount);
      tr.appendChild(tdType);
      previewBody.appendChild(tr);
    });

    previewSection.classList.remove('hidden');
  }

  // Import action
  importBtn.addEventListener('click', function() {
    if (!selectedFile) return;
    importBtn.disabled = true;
    importBtn.textContent = 'Importando...';

    var fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('accountId', getAccountId());

    fetch('/api/transactions/import', { method: 'POST', body: fd })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(err) { throw new Error(err.error || 'Error al importar'); });
        return res.json();
      })
      .then(function(data) { showResult(data); })
      .catch(function(err) { showError(err.message); })
      .finally(function() {
        importBtn.disabled = false;
        importBtn.textContent = 'Importar';
      });
  });

  function showResult(data) {
    document.getElementById('resNew').textContent = data['new'] || 0;
    document.getElementById('resEntities').textContent = data.entitiesCreated || 0;
    document.getElementById('resCategorized').textContent = data.categorized || 0;
    document.getElementById('resReconciled').textContent = data.reconciled || 0;
    document.getElementById('resUnmatched').textContent = data.unmatched || 0;
    resultSection.classList.remove('hidden');
    previewSection.classList.add('hidden');
  }
})();
</script>
`;

  return layout("Import", body);
}
