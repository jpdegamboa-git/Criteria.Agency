import { Hono } from "hono";
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
import type { ProjectType } from "../shared/types.js";

export const app = new Hono();

// Health
app.get("/health", (c) => c.json({ status: "ok", version: "0.1.0" }));

// Agents
app.get("/agents", (c) => c.json(Object.values(AGENT_REGISTRY)));

// Projects - Create
app.post("/projects", async (c) => {
  const body = await c.req.json();
  const { name, type, clientName, clientEmail } = body;

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

  const [project] = await db
    .insert(schema.projects)
    .values({
      clientId: client.id,
      name: name ?? "Untitled Project",
      type: (type ?? "corporate") as ProjectType,
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
  await resumeProject(c.req.param("id"), body.resumeTo ?? "brief");
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
