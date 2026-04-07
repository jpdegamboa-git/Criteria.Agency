import { layout, clientNav } from "./layout.js";
import { PIPELINE_LABELS, pipelineLabel, statusLabel } from "../shared/terminology.js";

const STATUS_COLORS: Record<string, string> = {
  brief: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  discovery: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  diagnostic: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  scripting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  production: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  editing: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  review: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  delivery: "bg-green-500/10 text-green-400 border-green-500/30",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  paused: "bg-criteria-border text-criteria-muted border-criteria-border",
};

export interface Project {
  id: string;
  name: string;
  status: string;
  pipelineType: string;
  updatedAt: string;
}

export function renderProjectList(projects: Project[]): string {
  const pipelineOptions = Object.entries(PIPELINE_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");

  const projectCards = projects.length
    ? projects
        .map((p) => {
          const statusCls = STATUS_COLORS[p.status] ?? "bg-criteria-border text-criteria-muted border-criteria-border";
          const pLabel = pipelineLabel(p.pipelineType);
          const dateStr = new Date(p.updatedAt).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return `
          <a href="/app/projects/${p.id}" data-pipeline="${p.pipelineType}"
            class="project-card block bg-criteria-gray border border-criteria-border rounded-xl p-5 hover:border-criteria-accent transition-colors group">
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-criteria-white font-semibold group-hover:text-criteria-accent transition-colors">${p.name}</h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCls} ml-3 shrink-0">${statusLabel(p.status)}</span>
            </div>
            <p class="text-criteria-muted text-sm mb-4">${pLabel}</p>
            <div class="flex items-center justify-between text-xs text-criteria-muted">
              <span>Actualizado: ${dateStr}</span>
              <span class="text-criteria-accent group-hover:underline">Ver proyecto &rarr;</span>
            </div>
          </a>`;
        })
        .join("")
    : `<div class="col-span-full py-16 text-center text-criteria-muted">No hay proyectos aun.</div>`;

  const body = `
  <main class="max-w-7xl mx-auto px-6 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-criteria-white">Proyectos</h1>
        <p class="text-criteria-muted text-sm mt-1">${projects.length} proyecto${projects.length !== 1 ? "s" : ""} en total</p>
      </div>
      <button onclick="document.getElementById('newProjectModal').classList.remove('hidden')"
        class="px-4 py-2 bg-criteria-accent text-black rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
        + Nuevo Proyecto
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4 mb-6">
      <div>
        <label class="text-criteria-muted text-xs block mb-1">Filtrar por pipeline</label>
        <select id="pipelineFilter"
          class="bg-criteria-gray border border-criteria-border text-criteria-light text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-criteria-accent">
          <option value="">Todos los pipelines</option>
          ${pipelineOptions}
        </select>
      </div>
    </div>

    <!-- Project grid -->
    <div id="projectGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${projectCards}
    </div>
  </main>

  <!-- New Project Modal -->
  <div id="newProjectModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
    <div class="bg-criteria-dark border border-criteria-border rounded-2xl p-8 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold text-criteria-white mb-6">Nuevo Proyecto</h3>
      <form id="newProjectForm" class="space-y-4">
        <div>
          <label class="text-criteria-text text-sm block mb-1">Nombre del proyecto</label>
          <input type="text" id="projectName" required
            class="w-full bg-criteria-gray border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light placeholder-criteria-muted focus:outline-none focus:border-criteria-accent"
            placeholder="Ej. Video corporativo Q2" />
        </div>
        <div>
          <label class="text-criteria-text text-sm block mb-1">Tipo de pipeline</label>
          <select id="projectPipeline"
            class="w-full bg-criteria-gray border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light focus:outline-none focus:border-criteria-accent">
            ${pipelineOptions}
          </select>
        </div>
        <p id="newProjectError" class="text-red-400 text-sm hidden"></p>
        <button type="submit" id="newProjectSubmit"
          class="w-full py-3 bg-criteria-accent text-black rounded-lg font-medium hover:bg-amber-400 transition-colors">
          Crear Proyecto
        </button>
        <button type="button" onclick="document.getElementById('newProjectModal').classList.add('hidden')"
          class="w-full py-2 text-criteria-muted text-sm hover:text-criteria-light transition-colors">
          Cancelar
        </button>
      </form>
    </div>
  </div>

  <script>
    // Filter by pipeline
    document.getElementById('pipelineFilter').addEventListener('change', function() {
      var val = this.value;
      document.querySelectorAll('.project-card').forEach(function(card) {
        if (!val || card.dataset.pipeline === val) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });

    document.getElementById('newProjectModal').addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hidden');
    });

    document.getElementById('newProjectForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('newProjectSubmit');
      var err = document.getElementById('newProjectError');
      btn.disabled = true;
      btn.textContent = 'Creando...';
      err.classList.add('hidden');
      try {
        var res = await fetch('/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({
            name: document.getElementById('projectName').value,
            pipelineType: document.getElementById('projectPipeline').value,
            type: 'corporate',
          })
        });
        var data = await res.json();
        if (!res.ok) { throw new Error(data.error || 'Error al crear proyecto'); }
        window.location.href = '/app/projects/' + data.id;
      } catch(ex) {
        err.textContent = ex.message;
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Crear Proyecto';
      }
    });
  </script>
  `;

  return layout("Proyectos", body, clientNav("projects"));
}
