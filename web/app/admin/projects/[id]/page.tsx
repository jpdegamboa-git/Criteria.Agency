import { db } from "@/lib/db";
import { projects, clients, artifacts, gateReviews, agentExecutions } from "@/lib/admin-schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agent-registry";
import { ProjectDetail } from "./project-detail";

const PIPELINE_STEPS = [
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish", "delivered",
];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel data fetching
  const [projectRows, artifactRows, gateRows, executionRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        type: projects.type,
        status: projects.status,
        currentGate: projects.currentGate,
        deliveryStatus: projects.deliveryStatus,
        currentVersion: projects.currentVersion,
        videoUrl: projects.videoUrl,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.name,
        clientEmail: clients.email,
        clientCompany: clients.company,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.id, id)),
    db
      .select()
      .from(artifacts)
      .where(eq(artifacts.projectId, id))
      .orderBy(desc(artifacts.createdAt)),
    db
      .select()
      .from(gateReviews)
      .where(eq(gateReviews.projectId, id))
      .orderBy(desc(gateReviews.createdAt)),
    db
      .select()
      .from(agentExecutions)
      .where(eq(agentExecutions.projectId, id))
      .orderBy(desc(agentExecutions.startedAt)),
  ]);

  const project = projectRows[0];
  if (!project) notFound();

  const currentStepIndex = PIPELINE_STEPS.indexOf(project.status);

  const enrichedExecutions = executionRows.map((e) => ({
    ...e,
    agentName: getAgent(e.agentId)?.name ?? e.agentId,
    agentTeam: getAgent(e.agentId)?.teamName ?? "Unknown",
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-[#9d9a9c] text-sm mt-1">
            {project.clientName}
            {project.clientCompany ? ` — ${project.clientCompany}` : ""}
            {" | "}
            <span className="capitalize">{project.type.replace("_", " ")}</span>
          </p>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded bg-[#ffd053]/20 text-[#ffd053] uppercase">
          {project.status.replace("_", " ")}
        </span>
      </div>

      {/* Pipeline Progress */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-8">
        <h2 className="text-sm font-medium text-[#666] mb-4">Pipeline</h2>
        <div className="flex items-center gap-1">
          {PIPELINE_STEPS.map((step, i) => {
            const isComplete = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`h-2 w-full rounded-full transition-colors ${
                    isComplete
                      ? "bg-green-500"
                      : isCurrent
                        ? "bg-[#ffd053]"
                        : "bg-[#2a2a2a]"
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    isCurrent ? "text-[#ffd053] font-medium" : "text-[#666]"
                  }`}
                >
                  {step.replace("_", " ")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <ProjectDetail
        artifacts={artifactRows}
        gates={gateRows}
        executions={enrichedExecutions}
      />
    </div>
  );
}
