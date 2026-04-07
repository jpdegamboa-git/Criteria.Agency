import { Hono } from "hono";
import { cors } from "hono/cors";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { AGENT_REGISTRY } from "../agents/registry.js";
import {
  advanceProject,
  runFullPipeline,
  pauseProject,
  resumeProject,
} from "../orchestrator/state-machine.js";
import { getArtifacts, readArtifact } from "../storage/artifacts.js";
import { requireSession, requireAdmin } from "./auth.js";
import { parseBody, createProjectSchema, resumeProjectSchema } from "./validators.js";
import { reviewRoutes } from "./review-routes.js";
import { checkoutRoutes } from "./checkout-routes.js";
import { financeRoutes } from "./finance-routes.js";
import { copilotRoutes } from "./copilot-routes.js";
import { contentRoutes } from "./content-routes.js";
import { entityRoutes } from "./entity-routes.js";
import { invoiceRoutes } from "./invoice-routes.js";
import { dashboardRoutes } from "./dashboard-routes.js";
import { canvasRoutes } from "./canvas-routes.js";
import { auth } from "../auth.js";
import { config } from "../shared/config.js";

export const app = new Hono();

// ── CORS (allow frontend origin) ──
app.use(
  "/api/auth/*",
  cors({
    origin: config.webUrl,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// ── Better Auth handler ──
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// ── Public routes (no auth required) ──
app.route("/", reviewRoutes);     // Token-based auth (client portal)
app.route("/", checkoutRoutes);   // Public pricing + Stripe webhook

// ── Protected routes (require session) ──
app.use("/projects/*", requireSession);
app.use("/agents", requireSession);
app.use("/artifacts/*", requireSession);
app.use("/api/transactions/*", requireSession);
app.use("/api/expected-payments/*", requireSession);
app.use("/api/categorization-rules/*", requireSession);
app.use("/api/subscriptions/*", requireSession);
app.use("/api/content/*", requireSession);
app.use("/api/copilot/*", requireSession);
app.use("/api/entities/*", requireSession);
app.use("/api/invoices/*", requireSession);
app.use("/admin/*", requireSession);
app.use("/admin/*", requireAdmin);
app.use("/api/canvas/*", requireSession);
app.use("/api/canvas/*", requireAdmin);
app.use("/api/agents/*/file", requireSession);
app.use("/api/agents/*/file", requireAdmin);

app.route("/", financeRoutes);
app.route("/", copilotRoutes);
app.route("/", contentRoutes);
app.route("/", entityRoutes);
app.route("/", invoiceRoutes);
app.route("/", dashboardRoutes);
app.route("/", canvasRoutes);

// Health
app.get("/health", (c) => c.json({ status: "ok", version: "0.1.0" }));

// Agents
app.get("/agents", (c) => c.json(Object.values(AGENT_REGISTRY)));

// Projects - Create
app.post("/projects", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createProjectSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { name, type, pipelineType, parentProjectId, clientName, clientEmail } = parsed.data;

  // Create or find client
  let [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.email, clientEmail ?? "demo@example.com"));

  if (!client) {
    [client] = await db
      .insert(schema.clients)
      .values({
        name: clientName ?? "Demo Client",
        email: clientEmail ?? "demo@example.com",
      })
      .returning();
  }

  // Determine initial status based on pipeline type
  const resolvedPipelineType = pipelineType ?? "video-production";
  const initialStatusMap: Record<string, string> = {
    "video-production": "brief",
    "brand-builder": "discovery",
    "strategist": "diagnostic",
  };
  const initialStatus = initialStatusMap[resolvedPipelineType] ?? "brief";

  const [project] = await db
    .insert(schema.projects)
    .values({
      clientId: client.id,
      name: name ?? "Untitled Project",
      type: (type ?? "corporate") as any,
      pipelineType: resolvedPipelineType,
      parentProjectId: parentProjectId ?? null,
      status: initialStatus as any,
    })
    .returning();

  return c.json(project, 201);
});

// Projects - List
app.get("/projects", async (c) => {
  const projects = await db.select().from(schema.projects);
  return c.json(projects);
});

// Projects - Get
app.get("/projects/:id", async (c) => {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, c.req.param("id")));

  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json(project);
});

// Projects - Advance one step
app.post("/projects/:id/advance", async (c) => {
  try {
    const result = await advanceProject(c.req.param("id"));
    return c.json(result);
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      400
    );
  }
});

// Projects - Run full pipeline
app.post("/projects/:id/run", async (c) => {
  try {
    const results = await runFullPipeline(c.req.param("id"));
    return c.json({ steps: results.length, results });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      400
    );
  }
});

// Projects - Pause
app.post("/projects/:id/pause", async (c) => {
  await pauseProject(c.req.param("id"));
  return c.json({ status: "paused" });
});

// Projects - Resume
app.post("/projects/:id/resume", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(resumeProjectSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  await resumeProject(c.req.param("id"), parsed.data.resumeTo ?? "brief");
  return c.json({ status: "resumed" });
});

// Artifacts
app.get("/projects/:id/artifacts", async (c) => {
  const step = c.req.query("step");
  const artifacts = await getArtifacts(
    c.req.param("id"),
    step as any
  );
  return c.json(artifacts);
});

app.get("/artifacts/:id/content", async (c) => {
  const content = await readArtifact(c.req.param("id"));
  if (content === null) return c.json({ error: "Not found" }, 404);
  return c.text(content);
});

// Gate reviews
app.get("/projects/:id/gates", async (c) => {
  const reviews = await db
    .select()
    .from(schema.gateReviews)
    .where(eq(schema.gateReviews.projectId, c.req.param("id")));
  return c.json(reviews);
});

// Agent executions
app.get("/projects/:id/executions", async (c) => {
  const executions = await db
    .select()
    .from(schema.agentExecutions)
    .where(eq(schema.agentExecutions.projectId, c.req.param("id")));
  return c.json(executions);
});
