import { layout } from "./layout.js";
import { escapeHtml, escapeJsString, sanitizeUrl } from "../shared/sanitize.js";

interface ReviewPageData {
  projectName: string;
  projectType: string;
  deliveryStatus: string;
  currentVersion: number;
  videoUrl: string | null;
  gates: Array<{
    gate: string;
    decision: string;
    iteration: number;
    createdAt: Date;
  }>;
  comments: Array<{
    author: string;
    authorName: string | null;
    text: string;
    createdAt: Date;
  }>;
  token: string;
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-600",
    delivered: "bg-blue-600",
    in_review: "bg-yellow-600",
    revision_requested: "bg-orange-600",
    approved: "bg-green-600",
  };
  const labels: Record<string, string> = {
    draft: "Borrador",
    delivered: "Entregado",
    in_review: "En revision",
    revision_requested: "Revision solicitada",
    approved: "Aprobado",
  };
  return `<span class="px-3 py-1 rounded-full text-sm font-medium ${colors[status] ?? "bg-gray-600"} text-white">${labels[status] ?? status}</span>`;
}

function gateLabel(gate: string): string {
  const labels: Record<string, string> = {
    g1: "G1 — Concepto",
    g2: "G2 — Guion",
    g3: "G3 — Storyboard",
    g4: "G4 — Primer corte",
    g5: "G5 — Corte final",
  };
  return labels[gate] ?? gate;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function renderReviewPage(data: ReviewPageData): string {
  const isReviewable =
    data.deliveryStatus === "delivered" || data.deliveryStatus === "in_review";

  const videoSection = data.videoUrl
    ? `<video controls class="w-full rounded-lg bg-black" preload="metadata">
         <source src="${sanitizeUrl(data.videoUrl)}" type="video/mp4">
         Tu navegador no soporta video HTML5.
       </video>`
    : `<div class="w-full aspect-video bg-criteria-gray rounded-lg flex items-center justify-center">
         <p class="text-criteria-muted">Video no disponible aun</p>
       </div>`;

  const gateSection =
    data.gates.length > 0
      ? data.gates
          .map(
            (g) => `
        <div class="flex items-center justify-between py-2 border-b border-criteria-border">
          <span class="text-criteria-text">${gateLabel(g.gate)}</span>
          <span class="px-2 py-0.5 rounded text-xs font-medium ${g.decision === "pass" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}">
            ${g.decision === "pass" ? "Aprobado" : "Rechazado"} (intento ${g.iteration})
          </span>
        </div>`,
          )
          .join("")
      : `<p class="text-criteria-muted text-sm">Sin evaluaciones de calidad aun.</p>`;

  const commentsSection =
    data.comments.length > 0
      ? data.comments
          .map(
            (c) => `
        <div class="py-3 border-b border-criteria-border">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium ${c.author === "client" ? "text-blue-400" : "text-criteria-accent"}">
              ${c.author === "client" ? escapeHtml(c.authorName ?? "Cliente") : "criteria.agency"}
            </span>
            <span class="text-criteria-muted text-xs">${formatDate(c.createdAt)}</span>
          </div>
          <p class="text-criteria-text">${escapeHtml(c.text)}</p>
        </div>`,
          )
          .join("")
      : `<p class="text-criteria-muted text-sm">Sin comentarios aun. Se el primero en opinar.</p>`;

  const actionsSection = isReviewable
    ? `
      <!-- Comment form -->
      <form id="commentForm" class="mt-6">
        <textarea
          id="commentText"
          rows="3"
          placeholder="Escribe tu comentario..."
          class="w-full bg-criteria-gray border border-criteria-border rounded-lg px-4 py-3 text-criteria-light placeholder-criteria-muted focus:outline-none focus:border-criteria-accent resize-none"
          required
        ></textarea>
        <button
          type="submit"
          class="mt-2 px-6 py-2 bg-criteria-gray border border-criteria-border rounded-lg text-criteria-light hover:bg-criteria-border transition-colors"
        >
          Enviar comentario
        </button>
      </form>

      <!-- Action buttons -->
      <div class="mt-8 flex gap-4">
        <button
          id="approveBtn"
          class="flex-1 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          Aprobar entrega
        </button>
        <button
          id="revisionBtn"
          class="flex-1 py-3 bg-criteria-gray border border-criteria-border hover:bg-criteria-border text-criteria-light rounded-lg font-medium transition-colors"
        >
          Solicitar cambios
        </button>
      </div>
      `
    : data.deliveryStatus === "approved"
      ? `<div class="mt-6 p-4 bg-green-900/30 border border-green-800 rounded-lg text-center">
           <p class="text-green-300 font-medium">Este proyecto ha sido aprobado. Gracias.</p>
         </div>`
      : data.deliveryStatus === "revision_requested"
        ? `<div class="mt-6 p-4 bg-orange-900/30 border border-orange-800 rounded-lg text-center">
             <p class="text-orange-300 font-medium">Cambios solicitados. Estamos trabajando en una nueva version.</p>
           </div>`
        : "";

  const body = `
    <!-- Header -->
    <header class="border-b border-criteria-border">
      <div class="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <span class="text-criteria-muted font-medium tracking-wider text-sm">criteria.agency</span>
        <span class="text-criteria-muted text-sm">Portal de revision</span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-8">
      <!-- Project info -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-criteria-white">${escapeHtml(data.projectName)}</h1>
          <p class="text-criteria-muted mt-1">Version ${data.currentVersion}</p>
        </div>
        ${statusBadge(data.deliveryStatus)}
      </div>

      <!-- Video -->
      <div class="mb-8">
        ${videoSection}
      </div>

      <!-- Quality Gates -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-criteria-white mb-3">Control de calidad</h2>
        <div class="bg-criteria-dark border border-criteria-border rounded-lg px-4 py-2">
          ${gateSection}
        </div>
      </div>

      <!-- Comments -->
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-criteria-white mb-3">Comentarios</h2>
        <div class="bg-criteria-dark border border-criteria-border rounded-lg px-4 py-2">
          ${commentsSection}
        </div>
      </div>

      ${actionsSection}
    </main>

    <!-- Footer -->
    <footer class="border-t border-criteria-border mt-16">
      <div class="max-w-3xl mx-auto px-6 py-6 text-center">
        <p class="text-criteria-muted text-sm">La IA genera. El criterio decide.</p>
      </div>
    </footer>

    <script>
      const token = "${escapeJsString(data.token)}";

      // Comment form
      const commentForm = document.getElementById("commentForm");
      if (commentForm) {
        commentForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const text = document.getElementById("commentText").value.trim();
          if (!text) return;

          const btn = commentForm.querySelector("button[type=submit]");
          btn.disabled = true;
          btn.textContent = "Enviando...";

          try {
            const res = await fetch("/review/" + token + "/comments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
            if (res.ok) {
              window.location.reload();
            } else {
              const err = await res.json();
              alert(err.error || "Error al enviar comentario");
              btn.disabled = false;
              btn.textContent = "Enviar comentario";
            }
          } catch {
            alert("Error de conexion");
            btn.disabled = false;
            btn.textContent = "Enviar comentario";
          }
        });
      }

      // Approve
      const approveBtn = document.getElementById("approveBtn");
      if (approveBtn) {
        approveBtn.addEventListener("click", async () => {
          if (!confirm("Confirmas que apruebas esta entrega?")) return;
          approveBtn.disabled = true;
          approveBtn.textContent = "Aprobando...";

          try {
            const res = await fetch("/review/" + token + "/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approve" }),
            });
            if (res.ok) {
              window.location.reload();
            } else {
              const err = await res.json();
              alert(err.error || "Error al aprobar");
              approveBtn.disabled = false;
              approveBtn.textContent = "Aprobar entrega";
            }
          } catch {
            alert("Error de conexion");
            approveBtn.disabled = false;
            approveBtn.textContent = "Aprobar entrega";
          }
        });
      }

      // Request revision
      const revisionBtn = document.getElementById("revisionBtn");
      if (revisionBtn) {
        revisionBtn.addEventListener("click", async () => {
          if (!confirm("Quieres solicitar cambios en esta entrega?")) return;
          revisionBtn.disabled = true;
          revisionBtn.textContent = "Solicitando...";

          try {
            const res = await fetch("/review/" + token + "/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "revision_requested" }),
            });
            if (res.ok) {
              window.location.reload();
            } else {
              const err = await res.json();
              alert(err.error || "Error al solicitar revision");
              revisionBtn.disabled = false;
              revisionBtn.textContent = "Solicitar cambios";
            }
          } catch {
            alert("Error de conexion");
            revisionBtn.disabled = false;
            revisionBtn.textContent = "Solicitar cambios";
          }
        });
      }
    </script>
  `;

  return layout(data.projectName, body);
}
