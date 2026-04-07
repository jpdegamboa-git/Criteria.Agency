import { db } from "@/lib/db";
import { projects, clients } from "@/lib/admin-schema";
import { desc, eq } from "drizzle-orm";
import { ProjectList } from "./project-list";

const STATUS_LABELS: Record<string, string> = {
  brief: "Brief",
  concept: "Concepto",
  script: "Guion",
  visual_look: "Visual",
  storyboard: "Storyboard",
  video_gen: "Generacion",
  edit: "Edicion",
  audio: "Audio",
  polish: "Polish",
  delivered: "Entregado",
  paused: "Pausado",
};

export default async function ProjectsPage() {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      type: projects.type,
      status: projects.status,
      currentGate: projects.currentGate,
      deliveryStatus: projects.deliveryStatus,
      currentVersion: projects.currentVersion,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(desc(projects.updatedAt));

  const projectData = rows.map((r) => ({
    ...r,
    statusLabel: STATUS_LABELS[r.status] ?? r.status,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Proyectos</h1>
      <p className="text-[#9d9a9c] mb-8">
        {projectData.length} proyecto{projectData.length !== 1 ? "s" : ""}
      </p>
      <ProjectList projects={projectData} />
    </div>
  );
}
