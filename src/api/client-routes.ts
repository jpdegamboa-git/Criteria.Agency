import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { renderClientDashboard } from "../views/client-dashboard.js";
import { renderProjectList } from "../views/project-list.js";
import { renderProjectDetail } from "../views/project-detail.js";
import { renderCopilotChat } from "../views/copilot-chat.js";
import { renderOnboarding } from "../views/onboarding.js";

export const clientRoutes = new Hono();

// ── Dashboard metric helpers ──

/** Count gate reviews with decision "fail" (pending remediation) for a client. */
async function countPendingGateReviews(clientId?: string): Promise<number> {
  const allGates = clientId
    ? await db
        .select({ decision: schema.gateReviews.decision, projectId: schema.gateReviews.projectId })
        .from(schema.gateReviews)
        .innerJoin(schema.projects, eq(schema.gateReviews.projectId, schema.projects.id))
        .where(and(eq(schema.gateReviews.decision, "fail"), eq(schema.projects.clientId, clientId)))
    : await db
        .select({ decision: schema.gateReviews.decision, projectId: schema.gateReviews.projectId })
        .from(schema.gateReviews)
        .where(eq(schema.gateReviews.decision, "fail"));
  return allGates.length;
}

/**
 * Compute average days from project creation to completion.
 * Uses updatedAt as a proxy for completion time since there is no dedicated completedAt column.
 * Returns null if there are no completed projects.
 */
function avgDaysToCompletion(
  projects: Array<{ status: string; createdAt: Date; updatedAt: Date }>,
): number | null {
  // Use status values that indicate final delivery
  const done = projects.filter(
    (p) => p.status === "delivered" || p.status === "delivery",
  );
  if (done.length === 0) return null;
  const totalMs = done.reduce(
    (sum, p) => sum + (p.updatedAt.getTime() - p.createdAt.getTime()),
    0,
  );
  const avgMs = totalMs / done.length;
  return Math.round(avgMs / (1000 * 60 * 60 * 24)); // convert to days
}

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

  // Metrics: counts by status
  const activeStatuses = ["brief", "concept", "script", "visual_look", "storyboard",
    "video_gen", "edit", "audio", "polish",
    "discovery", "research", "positioning", "identity", "brand_dna",
    "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
    "design_system", "moodboard", "production", "adaptation",
    "wr_brief", "wr_research", "wr_draft", "wr_adaptation",
    "au_brief", "au_sound_design", "au_production", "au_mix_master",
    "wb_brief", "wb_architecture", "wb_content", "wb_seo", "wb_build", "wb_qa",
    "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking",
    "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check",
    "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event",
    "ad_brief", "ad_strategy", "ad_creative", "ad_targeting", "ad_launch_kit",
    "cm_brief", "cm_calendar", "cm_content_production", "cm_scheduling", "cm_monitoring", "cm_reporting",
    "em_brief", "em_strategy", "em_production", "em_segmentation", "em_send", "em_analysis",
    "se_brief", "se_audit", "se_keyword_strategy", "se_content_plan", "se_optimization", "se_reporting",
    "ch_request", "ch_analysis", "ch_specs",
    "sl_capture", "sl_enrich", "sl_score", "sl_nurture", "sl_proposal", "sl_negotiate", "sl_close", "sl_attribution",
    "an_request", "an_collect", "an_analyze", "an_visualize",
    "fn_request", "fn_budget", "fn_tracking", "fn_pl",
    "sec_audit", "sec_scan", "sec_remediate", "sec_report",
  ];
  const completedStatuses = [
    "delivered", "wr_delivery", "au_delivery", "wb_delivery", "mk_delivery",
    "pp_delivery", "ev_delivery", "ad_delivery", "cm_delivery", "em_delivery",
    "se_delivery", "ch_delivery", "sl_delivery", "an_deliver", "fn_deliver", "sec_deliver",
  ];
  const pausedStatuses = ["paused"];

  const activeCount = projects.filter((p) => activeStatuses.includes(p.status)).length;
  const completedCount = projects.filter((p) => completedStatuses.includes(p.status)).length;
  const pausedCount = projects.filter((p) => pausedStatuses.includes(p.status)).length;

  // Count pending gate reviews (failed gate decisions needing attention)
  const pendingReviews = await countPendingGateReviews(
    tenantId && !isAdmin ? tenantId : undefined,
  );

  // Average days to completion
  const avgDays = avgDaysToCompletion(projects);

  const dashboardData = {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      pipelineType: p.pipelineType,
      updatedAt: p.updatedAt.toISOString(),
    })),
    pendingReviews,
    completedProjects: completedCount,
    activeProjects: activeCount,
    pausedProjects: pausedCount,
    avgDaysToCompletion: avgDays,
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
