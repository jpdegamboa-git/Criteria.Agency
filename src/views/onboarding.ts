import { layout } from "./layout.js";

export function renderOnboarding(): string {
  const body = `
  <style>
    .step-panel { display: none; }
    .step-panel.active { display: block; }
    .pain-card { cursor: pointer; transition: border-color 0.15s, background-color 0.15s; }
    .pain-card.selected { border-color: #f59e0b; background-color: rgba(245,158,11,0.1); }
  </style>

  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-xl">

      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <p class="text-criteria-accent font-bold text-xl tracking-tight">criteria.agency</p>
        <p class="text-criteria-muted text-sm mt-1">Configuremos tu espacio de trabajo</p>
      </div>

      <!-- Progress bar -->
      <div class="flex items-center gap-2 mb-8">
        <div class="flex-1 h-1 rounded-full bg-criteria-border overflow-hidden">
          <div id="progressBar" class="h-full bg-criteria-accent rounded-full transition-all duration-500" style="width:33%"></div>
        </div>
        <span id="progressLabel" class="text-criteria-muted text-xs shrink-0">Paso 1 de 3</span>
      </div>

      <!-- Step 1: Business info -->
      <div id="step1" class="step-panel active bg-criteria-gray border border-criteria-border rounded-2xl p-8">
        <h2 class="text-xl font-bold text-criteria-white mb-2">Cuentanos sobre tu negocio</h2>
        <p class="text-criteria-muted text-sm mb-6">Esta informacion nos ayuda a personalizar tu experiencia.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-criteria-light text-sm mb-1">Nombre de tu empresa <span class="text-red-400">*</span></label>
            <input id="companyName" type="text" required
              class="w-full bg-criteria-dark border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light placeholder-criteria-muted focus:outline-none focus:border-criteria-accent text-sm"
              placeholder="Ej. Acme Corp" />
            <p id="companyNameError" class="text-red-400 text-xs mt-1 hidden">Este campo es requerido</p>
          </div>

          <div>
            <label class="block text-criteria-light text-sm mb-1">Industria <span class="text-red-400">*</span></label>
            <select id="industry"
              class="w-full bg-criteria-dark border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light focus:outline-none focus:border-criteria-accent text-sm">
              <option value="">Selecciona una industria</option>
              <option value="tecnologia">Tecnologia</option>
              <option value="retail">Retail</option>
              <option value="servicios">Servicios</option>
              <option value="salud">Salud</option>
              <option value="educacion">Educacion</option>
              <option value="alimentos">Alimentos</option>
              <option value="otros">Otros</option>
            </select>
            <p id="industryError" class="text-red-400 text-xs mt-1 hidden">Selecciona una industria</p>
          </div>

          <div>
            <label class="block text-criteria-light text-sm mb-1">Tamano de la empresa <span class="text-red-400">*</span></label>
            <select id="companySize"
              class="w-full bg-criteria-dark border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light focus:outline-none focus:border-criteria-accent text-sm">
              <option value="">Selecciona un rango</option>
              <option value="1-10">1-10 empleados</option>
              <option value="11-50">11-50 empleados</option>
              <option value="51-200">51-200 empleados</option>
              <option value="200+">200+ empleados</option>
            </select>
            <p id="companySizeError" class="text-red-400 text-xs mt-1 hidden">Selecciona el tamano</p>
          </div>
        </div>

        <button onclick="goToStep2()"
          class="mt-6 w-full py-3 bg-criteria-accent text-black rounded-lg font-medium hover:bg-amber-400 transition-colors">
          Continuar &rarr;
        </button>
      </div>

      <!-- Step 2: Pain points -->
      <div id="step2" class="step-panel bg-criteria-gray border border-criteria-border rounded-2xl p-8">
        <h2 class="text-xl font-bold text-criteria-white mb-2">Cual es tu dolor principal?</h2>
        <p class="text-criteria-muted text-sm mb-6">Selecciona uno o mas puntos de dolor que quieres resolver.</p>

        <div id="painGrid" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-EST-01">
            <p class="text-criteria-white text-sm font-medium">No se por donde empezar</p>
            <p class="text-criteria-muted text-xs mt-1">Estrategia y hoja de ruta</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-MCA-01">
            <p class="text-criteria-white text-sm font-medium">No tengo identidad de marca</p>
            <p class="text-criteria-muted text-xs mt-1">Branding y diseno</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-PRD-01">
            <p class="text-criteria-white text-sm font-medium">Necesito producir contenido</p>
            <p class="text-criteria-muted text-xs mt-1">Creacion y produccion</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-ROI-01">
            <p class="text-criteria-white text-sm font-medium">No se si mi marketing funciona</p>
            <p class="text-criteria-muted text-xs mt-1">Medicion y ROI</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-VTA-02">
            <p class="text-criteria-white text-sm font-medium">No le doy seguimiento a leads</p>
            <p class="text-criteria-muted text-xs mt-1">CRM y ventas</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-DST-04">
            <p class="text-criteria-white text-sm font-medium">No aparezco en Google</p>
            <p class="text-criteria-muted text-xs mt-1">SEO y visibilidad</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-INT-01">
            <p class="text-criteria-white text-sm font-medium">No se que hace mi competencia</p>
            <p class="text-criteria-muted text-xs mt-1">Inteligencia competitiva</p>
          </div>
          <div class="pain-card border border-criteria-border rounded-xl p-4" data-id="D-FIN-01">
            <p class="text-criteria-white text-sm font-medium">No controlo mi presupuesto</p>
            <p class="text-criteria-muted text-xs mt-1">Finanzas y control</p>
          </div>
        </div>

        <p id="painError" class="text-red-400 text-xs mb-3 hidden">Selecciona al menos un punto de dolor</p>

        <div class="flex gap-3">
          <button onclick="goToStep1()"
            class="flex-1 py-3 border border-criteria-border text-criteria-light rounded-lg text-sm hover:bg-criteria-dark transition-colors">
            &larr; Atras
          </button>
          <button onclick="goToStep3()"
            class="flex-1 py-3 bg-criteria-accent text-black rounded-lg font-medium hover:bg-amber-400 transition-colors">
            Continuar &rarr;
          </button>
        </div>
      </div>

      <!-- Step 3: Confirmation -->
      <div id="step3" class="step-panel bg-criteria-gray border border-criteria-border rounded-2xl p-8">
        <div class="text-center mb-6">
          <div class="w-14 h-14 rounded-full bg-criteria-accent/20 border border-criteria-accent/30 flex items-center justify-center mx-auto mb-3">
            <span class="text-criteria-accent text-2xl">&#10003;</span>
          </div>
          <h2 class="text-xl font-bold text-criteria-white">Listo, estamos preparando tu diagnostico</h2>
          <p class="text-criteria-muted text-sm mt-2">Esto es lo que configuraremos para ti:</p>
        </div>

        <!-- Summary -->
        <div id="onboardingSummary" class="space-y-3 mb-6">
          <!-- filled by JS -->
        </div>

        <p id="onboardingError" class="text-red-400 text-sm text-center mb-3 hidden"></p>

        <div class="flex gap-3">
          <button onclick="goToStep2()"
            class="flex-1 py-3 border border-criteria-border text-criteria-light rounded-lg text-sm hover:bg-criteria-dark transition-colors">
            &larr; Atras
          </button>
          <button id="completeBtn" onclick="completeOnboarding()"
            class="flex-1 py-3 bg-criteria-accent text-black rounded-lg font-medium hover:bg-amber-400 transition-colors">
            Comenzar
          </button>
        </div>
      </div>

    </div>
  </div>

  <script>
    var selectedPains = [];

    var PAIN_LABELS = {
      'D-EST-01': 'No se por donde empezar',
      'D-MCA-01': 'No tengo identidad de marca',
      'D-PRD-01': 'Necesito producir contenido',
      'D-ROI-01': 'No se si mi marketing funciona',
      'D-VTA-02': 'No le doy seguimiento a leads',
      'D-DST-04': 'No aparezco en Google',
      'D-INT-01': 'No se que hace mi competencia',
      'D-FIN-01': 'No controlo mi presupuesto'
    };

    // Wire up pain card toggles
    document.querySelectorAll('.pain-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = this.dataset.id;
        var idx = selectedPains.indexOf(id);
        if (idx === -1) {
          selectedPains.push(id);
          this.classList.add('selected');
        } else {
          selectedPains.splice(idx, 1);
          this.classList.remove('selected');
        }
      });
    });

    function showStep(n) {
      document.querySelectorAll('.step-panel').forEach(function(p) { p.classList.remove('active'); });
      document.getElementById('step' + n).classList.add('active');
      var pct = n === 1 ? 33 : n === 2 ? 66 : 100;
      document.getElementById('progressBar').style.width = pct + '%';
      document.getElementById('progressLabel').textContent = 'Paso ' + n + ' de 3';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goToStep1() { showStep(1); }

    function goToStep2() {
      var name = document.getElementById('companyName').value.trim();
      var industry = document.getElementById('industry').value;
      var size = document.getElementById('companySize').value;
      var valid = true;

      if (!name) {
        document.getElementById('companyNameError').classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('companyNameError').classList.add('hidden');
      }
      if (!industry) {
        document.getElementById('industryError').classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('industryError').classList.add('hidden');
      }
      if (!size) {
        document.getElementById('companySizeError').classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('companySizeError').classList.add('hidden');
      }

      if (valid) showStep(2);
    }

    function goToStep3() {
      if (selectedPains.length === 0) {
        document.getElementById('painError').classList.remove('hidden');
        return;
      }
      document.getElementById('painError').classList.add('hidden');

      // Build summary
      var name = document.getElementById('companyName').value.trim();
      var industry = document.getElementById('industry').value;
      var size = document.getElementById('companySize').value;

      var summary = document.getElementById('onboardingSummary');
      summary.textContent = '';

      function summaryRow(label, value) {
        var row = document.createElement('div');
        row.className = 'flex items-start justify-between bg-criteria-dark border border-criteria-border rounded-lg px-4 py-3';
        var lbl = document.createElement('p');
        lbl.className = 'text-criteria-muted text-sm';
        lbl.textContent = label;
        var val = document.createElement('p');
        val.className = 'text-criteria-light text-sm font-medium text-right';
        val.textContent = value;
        row.appendChild(lbl);
        row.appendChild(val);
        return row;
      }

      summary.appendChild(summaryRow('Empresa', name));
      summary.appendChild(summaryRow('Industria', industry));
      summary.appendChild(summaryRow('Tamano', size));

      var painRow = document.createElement('div');
      painRow.className = 'bg-criteria-dark border border-criteria-border rounded-lg px-4 py-3';
      var painLbl = document.createElement('p');
      painLbl.className = 'text-criteria-muted text-sm mb-2';
      painLbl.textContent = 'Dolores seleccionados';
      painRow.appendChild(painLbl);
      selectedPains.forEach(function(id) {
        var tag = document.createElement('span');
        tag.className = 'inline-block px-2 py-0.5 rounded-full text-xs bg-criteria-accent/20 text-criteria-accent border border-criteria-accent/30 mr-1 mb-1';
        tag.textContent = PAIN_LABELS[id] || id;
        painRow.appendChild(tag);
      });
      summary.appendChild(painRow);

      var projectsNote = document.createElement('div');
      projectsNote.className = 'bg-criteria-dark border border-criteria-border rounded-lg px-4 py-3';
      var noteLbl = document.createElement('p');
      noteLbl.className = 'text-criteria-muted text-sm mb-1';
      noteLbl.textContent = 'Proyectos que crearemos';
      projectsNote.appendChild(noteLbl);
      var noteVal = document.createElement('p');
      noteVal.className = 'text-criteria-light text-sm';
      noteVal.textContent = 'Brand Builder + Diagnostico Estrategico';
      projectsNote.appendChild(noteVal);
      summary.appendChild(projectsNote);

      showStep(3);
    }

    async function completeOnboarding() {
      var btn = document.getElementById('completeBtn');
      var errEl = document.getElementById('onboardingError');
      btn.disabled = true;
      btn.textContent = 'Configurando...';
      errEl.classList.add('hidden');

      var name = document.getElementById('companyName').value.trim();
      var industry = document.getElementById('industry').value;
      var size = document.getElementById('companySize').value;

      try {
        // Create Brand Builder project
        var r1 = await fetch('/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ name: name + ' — Brand Builder', pipelineType: 'brand-builder', type: 'brand' })
        });
        if (!r1.ok) {
          var e1 = await r1.json();
          throw new Error(e1.error || 'No se pudo crear el proyecto Brand Builder');
        }

        // Create Strategist diagnostic project
        var r2 = await fetch('/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ name: name + ' — Diagnostico', pipelineType: 'strategist', type: 'strategy' })
        });
        if (!r2.ok) {
          var e2 = await r2.json();
          throw new Error(e2.error || 'No se pudo crear el proyecto de diagnostico');
        }

        // Redirect to dashboard
        window.location.href = '/app/dashboard';
      } catch(ex) {
        errEl.textContent = ex.message || 'Hubo un error. Intenta de nuevo.';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Comenzar';
      }
    }
  </script>
  `;

  return layout("Bienvenido — criteria.agency", body);
}
