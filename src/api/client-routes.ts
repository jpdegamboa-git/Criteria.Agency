import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { renderClientDashboard } from "../views/client-dashboard.js";
import { renderProjectList } from "../views/project-list.js";
import { renderProjectDetail } from "../views/project-detail.js";
import { renderCopilotChat } from "../views/copilot-chat.js";
import { renderOnboarding } from "../views/onboarding.js";

export const clientRoutes = new Hono();

// GET /app/dashboard
clientRoutes.get("/app/dashboard", async (c) => {
  const tenantId = c.get("tenantId") as string | undefined;
  const user = c.get("user") as { role?: string } | undefined;
  const isAdmin = user?.role === "admin";

  let projects;
  if (tenantId && !isAdmin) {
    projects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.clientId, tenantId));
  } else {
    projects = await db.select().from(schema.projects);
  }

  const completedProjects = projects.filter((p) => p.status === "completed").length;

  // Count pending gate reviews (gates with decision === "fail" that need attention)
  // For simplicity: count projects in "review" status as pending reviews
  const pendingReviews = projects.filter((p) => p.status === "review").length;

  const dashboardData = {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      pipelineType: p.pipelineType,
      updatedAt: p.updatedAt.toISOString(),
    })),
    pendingReviews,
    completedProjects,
  };

  return c.html(renderClientDashboard(dashboardData));
});

// GET /app/projects
clientRoutes.get("/app/projects", async (c) => {
  const tenantId = c.get("tenantId") as string | undefined;
  const user = c.get("user") as { role?: string } | undefined;
  const isAdmin = user?.role === "admin";

  let projects;
  if (tenantId && !isAdmin) {
    projects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.clientId, tenantId));
  } else {
    projects = await db.select().from(schema.projects);
  }

  const projectList = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    pipelineType: p.pipelineType,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return c.html(renderProjectList(projectList));
});

// GET /app/projects/:id
clientRoutes.get("/app/projects/:id", async (c) => {
  const id = c.req.param("id");

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, id));

  if (!project) {
    return c.html("<h1>Proyecto no encontrado</h1>", 404);
  }

  const [artifactRows, gateRows] = await Promise.all([
    db.select().from(schema.artifacts).where(eq(schema.artifacts.projectId, id)),
    db.select().from(schema.gateReviews).where(eq(schema.gateReviews.projectId, id)),
  ]);

  const artifacts = artifactRows.map((a) => ({
    id: a.id,
    step: a.step,
    agentId: a.createdByAgent,
    contentType: a.type,
    createdAt: a.createdAt.toISOString(),
  }));

  const gates = gateRows.map((g) => ({
    id: g.id,
    gate: g.gate,
    result: g.decision as string,
    notes: g.notes ?? undefined,
    createdAt: g.createdAt.toISOString(),
  }));

  const projectData = {
    id: project.id,
    name: project.name,
    status: project.status,
    pipelineType: project.pipelineType,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    deliveryStatus: project.deliveryStatus,
  };

  return c.html(renderProjectDetail(projectData, artifacts, gates));
});

// GET /app/copilot
clientRoutes.get("/app/copilot", (c) => {
  return c.html(renderCopilotChat());
});

// GET /app/onboarding
clientRoutes.get("/app/onboarding", (c) => {
  return c.html(renderOnboarding());
});
