import { layout, clientNav } from "./layout.js";
import { pipelineLabel, statusLabel } from "../shared/terminology.js";

export interface ClientDashboardData {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    pipelineType: string;
    updatedAt: string;
  }>;
  pendingReviews: number;
  completedProjects: number;
  /** Count of projects in active (in-progress) statuses. */
  activeProjects?: number;
  /** Count of projects in paused status. */
  pausedProjects?: number;
  /** Average days from project creation to delivery (null if no completed projects). */
  avgDaysToCompletion?: number | null;
}

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

function statusBadge(status: string): string {
  const cls = STATUS_COLORS[status] ?? "bg-criteria-border text-criteria-muted border-criteria-border";
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}">${statusLabel(status)}</span>`;
}

function formatDate(iso: string): string {
  return `\${new Date("${iso}").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function renderClientDashboard(data: ClientDashboardData): string {
  const activeProjects = data.projects.filter((p) => p.status !== "completed" && p.status !== "paused");

  const projectRows = data.projects.length
    ? data.projects
        .map(
          (p) => `
        <tr class="border-b border-criteria-border hover:bg-criteria-gray/30 transition-colors">
          <td class="py-3 px-4">
            <a href="/app/projects/${p.id}" class="text-criteria-light hover:text-criteria-white font-medium">${p.name}</a>
          </td>
          <td class="py-3 px-4 text-criteria-muted text-sm">${pipelineLabel(p.pipelineType)}</td>
          <td class="py-3 px-4">${statusBadge(p.status)}</td>
          <td class="py-3 px-4 text-criteria-muted text-sm">${new Date(p.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</td>
          <td class="py-3 px-4">
            <a href="/app/projects/${p.id}" class="text-criteria-accent text-sm hover:underline">Ver &rarr;</a>
          </td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="py-12 text-center text-criteria-muted">No tienes proyectos aun. <a href="#" onclick="document.getElementById('newProjectModal').classList.remove('hidden'); return false;" class="text-criteria-accent hover:underline">Crea el primero</a>.</td></tr>`;

  const body = `
  <main class="max-w-7xl mx-auto px-6 py-8">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-criteria-white">Dashboard</h1>
        <p class="text-criteria-muted text-sm mt-1">Bienvenido de vuelta. Aqui esta el estado de tus proyectos.</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="/app/copilot" class="px-4 py-2 border border-criteria-border rounded-lg text-criteria-light text-sm hover:bg-criteria-gray transition-colors">
          Ir al Copilot
        </a>
        <button onclick="document.getElementById('newProjectModal').classList.remove('hidden')"
          class="px-4 py-2 bg-criteria-accent text-black rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
          + Nuevo Proyecto
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="bg-criteria-gray border border-criteria-border rounded-xl p-5">
        <p class="text-criteria-muted text-sm mb-1">Proyectos Activos</p>
        <p class="text-3xl font-bold text-criteria-white">${activeProjects.length}</p>
      </div>
      <div class="bg-criteria-gray border border-criteria-border rounded-xl p-5">
        <p class="text-criteria-muted text-sm mb-1">Revisiones Pendientes</p>
        <p class="text-3xl font-bold text-amber-400">${data.pendingReviews}</p>
      </div>
      <div class="bg-criteria-gray border border-criteria-border rounded-xl p-5">
        <p class="text-criteria-muted text-sm mb-1">Proyectos Completados</p>
        <p class="text-3xl font-bold text-green-400">${data.completedProjects}</p>
      </div>
    </div>

    <!-- Projects table -->
    <div class="bg-criteria-gray border border-criteria-border rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-criteria-border flex items-center justify-between">
        <h2 class="text-lg font-semibold text-criteria-white">Tus Proyectos</h2>
        <a href="/app/projects" class="text-criteria-accent text-sm hover:underline">Ver todos &rarr;</a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-criteria-muted border-b border-criteria-border">
              <th class="text-left py-3 px-4 font-medium">Proyecto</th>
              <th class="text-left py-3 px-4 font-medium">Pipeline</th>
              <th class="text-left py-3 px-4 font-medium">Estado</th>
              <th class="text-left py-3 px-4 font-medium">Actualizado</th>
              <th class="text-left py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            ${projectRows}
          </tbody>
        </table>
      </div>
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
            <option value="video-production">Produccion de Video</option>
            <option value="brand-builder">Construccion de Marca</option>
            <option value="strategist">Estrategia</option>
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

  return layout("Dashboard", body, clientNav("dashboard"));
}
