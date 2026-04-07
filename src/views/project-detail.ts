import { layout, clientNav } from "./layout.js";
import { pipelineLabel, statusLabel, gateLabel as gateDisplayLabel } from "../shared/terminology.js";

const PIPELINE_STEPS: Record<string, string[]> = {
  "video-production": ["brief", "concept", "script", "visual_look", "storyboard", "video_gen", "edit", "audio", "polish"],
  "brand-builder": ["discovery", "research", "positioning", "identity", "brand_dna"],
  "strategist": ["diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs"],
  "graphic-design": ["brief", "design_system", "moodboard", "production", "adaptation", "delivery"],
  "writers-room": ["wr_brief", "wr_research", "wr_draft", "wr_adaptation", "wr_delivery"],
  "audio": ["au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery"],
  "web": ["wb_brief", "wb_architecture", "wb_content", "wb_seo", "wb_build", "wb_qa", "wb_delivery"],
  "marketplace": ["mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery"],
  "print-production": ["pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery"],
  "events": ["ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery"],
  "ads": ["ad_brief", "ad_strategy", "ad_creative", "ad_targeting", "ad_launch_kit", "ad_delivery"],
  "community-management": ["cm_brief", "cm_calendar", "cm_content_production", "cm_scheduling", "cm_monitoring", "cm_reporting", "cm_delivery"],
  "email-marketing": ["em_brief", "em_strategy", "em_production", "em_segmentation", "em_send", "em_analysis", "em_delivery"],
  "seo-content": ["se_brief", "se_audit", "se_keyword_strategy", "se_content_plan", "se_optimization", "se_reporting", "se_delivery"],
  "channel-manager": ["ch_request", "ch_analysis", "ch_specs", "ch_delivery"],
  "sales-crm": ["sl_capture", "sl_enrich", "sl_score", "sl_nurture", "sl_proposal", "sl_negotiate", "sl_close", "sl_attribution", "sl_delivery"],
  "financial": ["fn_request", "fn_budget", "fn_tracking", "fn_pl", "fn_deliver"],
  "analytics": ["an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver"],
  "security": ["sec_audit", "sec_scan", "sec_remediate", "sec_report", "sec_deliver"],
};

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

export interface ProjectDetailData {
  id: string;
  name: string;
  status: string;
  pipelineType: string;
  createdAt: string;
  updatedAt: string;
  deliveryStatus?: string;
}

export interface Artifact {
  id: string;
  step: string;
  agentId: string;
  contentType: string;
  createdAt: string;
}

export interface GateReview {
  id: string;
  gate: string;
  result: "pass" | "fail" | string;
  notes?: string;
  createdAt: string;
}

function renderPipelineTimeline(pipelineType: string, currentStatus: string): string {
  const steps = PIPELINE_STEPS[pipelineType] ?? PIPELINE_STEPS["video-production"];
  const currentIdx = steps.indexOf(currentStatus);

  const stepItems = steps
    .map((step, i) => {
      const isDone = i < currentIdx;
      const isCurrent = i === currentIdx;
      const isPending = i > currentIdx;

      const circleClass = isDone
        ? "bg-green-500 border-green-500 text-white"
        : isCurrent
          ? "bg-criteria-accent border-criteria-accent text-black"
          : "bg-criteria-dark border-criteria-border text-criteria-muted";

      const labelClass = isCurrent
        ? "text-criteria-white font-semibold"
        : isDone
          ? "text-green-400"
          : "text-criteria-muted";

      const lineClass = isDone ? "bg-green-500" : "bg-criteria-border";

      return `
      <div class="flex flex-col items-center relative ${i < steps.length - 1 ? "flex-1" : ""}">
        <div class="flex items-center w-full">
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 ${circleClass} shrink-0 z-10 text-xs font-bold">
            ${isDone ? "&#10003;" : i + 1}
          </div>
          ${i < steps.length - 1 ? `<div class="flex-1 h-0.5 ${lineClass}"></div>` : ""}
        </div>
        <span class="mt-2 text-xs ${labelClass} text-center max-w-[70px]">${statusLabel(step)}</span>
      </div>`;
    })
    .join("");

  return `
  <div class="bg-criteria-gray border border-criteria-border rounded-xl p-6 mb-6">
    <h2 class="text-lg font-semibold text-criteria-white mb-6">Pipeline</h2>
    <div class="flex items-start overflow-x-auto pb-2">
      ${stepItems}
    </div>
  </div>`;
}

export function renderProjectDetail(
  project: ProjectDetailData,
  artifacts: Artifact[],
  gates: GateReview[],
): string {
  const statusCls = STATUS_COLORS[project.status] ?? "bg-criteria-border text-criteria-muted border-criteria-border";
  const pLabel = pipelineLabel(project.pipelineType);
  const createdDate = new Date(project.createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Group artifacts by step
  const artifactsByStep: Record<string, Artifact[]> = {};
  for (const a of artifacts) {
    if (!artifactsByStep[a.step]) artifactsByStep[a.step] = [];
    artifactsByStep[a.step].push(a);
  }

  const artifactRows = artifacts.length
    ? artifacts
        .map(
          (a) => `
        <tr class="border-b border-criteria-border hover:bg-criteria-gray/30">
          <td class="py-2 px-4 text-criteria-light text-sm">${statusLabel(a.step)}</td>
          <td class="py-2 px-4 text-criteria-muted text-sm">${a.agentId}</td>
          <td class="py-2 px-4 text-criteria-muted text-sm">${a.contentType}</td>
          <td class="py-2 px-4 text-criteria-muted text-sm">${new Date(a.createdAt).toLocaleDateString("es-MX")}</td>
          <td class="py-2 px-4">
            <a href="/artifacts/${a.id}/content" target="_blank" class="text-criteria-accent text-xs hover:underline">Ver</a>
          </td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="py-8 text-center text-criteria-muted text-sm">No hay artefactos aun.</td></tr>`;

  const gateRows = gates.length
    ? gates
        .map((g) => {
          const isPass = g.result === "pass";
          const resultCls = isPass
            ? "bg-green-500/10 text-green-400 border-green-500/30"
            : "bg-red-500/10 text-red-400 border-red-500/30";
          return `
          <tr class="border-b border-criteria-border hover:bg-criteria-gray/30">
            <td class="py-2 px-4 text-criteria-light text-sm">${gateDisplayLabel(g.gate)}</td>
            <td class="py-2 px-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${resultCls}">
                ${isPass ? "Aprobado" : "Rechazado"}
              </span>
            </td>
            <td class="py-2 px-4 text-criteria-muted text-sm">${g.notes ?? "-"}</td>
            <td class="py-2 px-4 text-criteria-muted text-sm">${new Date(g.createdAt).toLocaleDateString("es-MX")}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" class="py-8 text-center text-criteria-muted text-sm">No hay gates registrados aun.</td></tr>`;

  const isPaused = project.status === "paused";

  const body = `
  <main class="max-w-7xl mx-auto px-6 py-8">
    <!-- Back link -->
    <a href="/app/projects" class="inline-flex items-center gap-1 text-criteria-muted text-sm hover:text-criteria-light mb-6">&larr; Todos los proyectos</a>

    <!-- Project header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold text-criteria-white">${project.name}</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCls}">${statusLabel(project.status)}</span>
        </div>
        <div class="flex items-center gap-4 text-sm text-criteria-muted">
          <span>${pLabel}</span>
          <span>&bull;</span>
          <span>Creado ${createdDate}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${
          !isPaused
            ? `<button onclick="handlePause()" id="pauseBtn"
            class="px-4 py-2 border border-criteria-border rounded-lg text-criteria-light text-sm hover:bg-criteria-gray transition-colors">
            Pausar
          </button>
          <button onclick="handleAdvance()" id="advanceBtn"
            class="px-4 py-2 bg-criteria-accent text-black rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
            Avanzar
          </button>`
            : `<button onclick="handleResume()" id="resumeBtn"
            class="px-4 py-2 bg-criteria-accent text-black rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
            Reanudar
          </button>`
        }
      </div>
    </div>

    <!-- Pipeline Timeline -->
    ${renderPipelineTimeline(project.pipelineType, project.status)}

    <!-- Artifacts -->
    <div class="bg-criteria-gray border border-criteria-border rounded-xl overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-criteria-border">
        <h2 class="text-lg font-semibold text-criteria-white">Artefactos</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-criteria-muted border-b border-criteria-border">
              <th class="text-left py-3 px-4 font-medium">Paso</th>
              <th class="text-left py-3 px-4 font-medium">Agente</th>
              <th class="text-left py-3 px-4 font-medium">Tipo</th>
              <th class="text-left py-3 px-4 font-medium">Fecha</th>
              <th class="text-left py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>${artifactRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Gate Results -->
    <div class="bg-criteria-gray border border-criteria-border rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-criteria-border">
        <h2 class="text-lg font-semibold text-criteria-white">Quality Gates</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-criteria-muted border-b border-criteria-border">
              <th class="text-left py-3 px-4 font-medium">Gate</th>
              <th class="text-left py-3 px-4 font-medium">Resultado</th>
              <th class="text-left py-3 px-4 font-medium">Notas</th>
              <th class="text-left py-3 px-4 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>${gateRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Status message -->
    <div id="actionMsg" class="fixed bottom-6 right-6 hidden">
      <div class="bg-criteria-gray border border-criteria-border rounded-lg px-4 py-3 text-criteria-light text-sm shadow-lg"></div>
    </div>
  </main>

  <script>
    var projectId = '${project.id}';

    function showMsg(text, isError) {
      var el = document.getElementById('actionMsg');
      el.querySelector('div').textContent = text;
      el.querySelector('div').className = 'rounded-lg px-4 py-3 text-sm shadow-lg ' + (isError ? 'bg-red-900/80 border border-red-700 text-red-200' : 'bg-criteria-gray border border-criteria-border text-criteria-light');
      el.classList.remove('hidden');
      setTimeout(function() { el.classList.add('hidden'); }, 3000);
    }

    async function handleAdvance() {
      var btn = document.getElementById('advanceBtn');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = 'Avanzando...';
      try {
        var res = await fetch('/projects/' + projectId + '/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({})
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al avanzar');
        showMsg('Proyecto avanzado correctamente');
        setTimeout(function() { window.location.reload(); }, 1000);
      } catch(e) {
        showMsg(e.message, true);
        btn.disabled = false;
        btn.textContent = 'Avanzar';
      }
    }

    async function handlePause() {
      var btn = document.getElementById('pauseBtn');
      if (!btn) return;
      btn.disabled = true;
      try {
        var res = await fetch('/projects/' + projectId + '/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({})
        });
        if (!res.ok) { var d = await res.json(); throw new Error(d.error || 'Error'); }
        showMsg('Proyecto pausado');
        setTimeout(function() { window.location.reload(); }, 1000);
      } catch(e) {
        showMsg(e.message, true);
        btn.disabled = false;
      }
    }

    async function handleResume() {
      var btn = document.getElementById('resumeBtn');
      if (!btn) return;
      btn.disabled = true;
      try {
        var res = await fetch('/projects/' + projectId + '/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ resumeTo: '${project.status}' })
        });
        if (!res.ok) { var d = await res.json(); throw new Error(d.error || 'Error'); }
        showMsg('Proyecto reanudado');
        setTimeout(function() { window.location.reload(); }, 1000);
      } catch(e) {
        showMsg(e.message, true);
        btn.disabled = false;
      }
    }
  </script>
  `;

  return layout(project.name, body, clientNav("projects"));
}
