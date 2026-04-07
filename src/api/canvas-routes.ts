import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { config } from "../shared/config.js";
import { sanitizeAgentId } from "../shared/sanitize.js";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { updateAgentFileSchema, parseBody } from "./validators.js";

export const canvasRoutes = new Hono();

// Pipeline step order for seeding connections
const PIPELINE_ORDER = [
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "audio", "edit", "polish", "delivery",
];

// GET /api/canvas/graph — full graph data (agents + connections + positions + exec stats)
canvasRoutes.get("/api/canvas/graph", async (c) => {
  const [connections, positions, execStats] = await Promise.all([
    db.select().from(schema.agentConnections),
    db.select().from(schema.agentNodePositions),
    db
      .select({
        agentId: schema.agentExecutions.agentId,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${schema.agentExecutions.status} = 'completed')::int`,
        failed: sql<number>`count(*) filter (where ${schema.agentExecutions.status} = 'failed')::int`,
        running: sql<number>`count(*) filter (where ${schema.agentExecutions.status} = 'running')::int`,
        avgDuration: sql<number>`avg(extract(epoch from (${schema.agentExecutions.completedAt} - ${schema.agentExecutions.startedAt})))::int`,
      })
      .from(schema.agentExecutions)
      .groupBy(schema.agentExecutions.agentId),
  ]);
  return c.json({ connections, positions, execStats });
});

// PUT /api/canvas/positions — batch update node positions
canvasRoutes.put("/api/canvas/positions", async (c) => {
  const body = await c.req.json<{ positions: { agentId: string; x: number; y: number }[] }>();
  for (const pos of body.positions) {
    await db
      .insert(schema.agentNodePositions)
      .values({ agentId: pos.agentId, x: String(pos.x), y: String(pos.y) })
      .onConflictDoUpdate({
        target: schema.agentNodePositions.agentId,
        set: { x: String(pos.x), y: String(pos.y), updatedAt: new Date() },
      });
  }
  return c.json({ ok: true });
});

// POST /api/canvas/connections — create manual connection
canvasRoutes.post("/api/canvas/connections", async (c) => {
  const body = await c.req.json<{ sourceAgentId: string; targetAgentId: string }>();
  const [connection] = await db
    .insert(schema.agentConnections)
    .values({
      sourceAgentId: body.sourceAgentId,
      targetAgentId: body.targetAgentId,
      type: "manual",
    })
    .returning();
  return c.json(connection, 201);
});

// DELETE /api/canvas/connections/:id — delete connection
canvasRoutes.delete("/api/canvas/connections/:id", async (c) => {
  await db
    .delete(schema.agentConnections)
    .where(eq(schema.agentConnections.id, c.req.param("id")));
  return c.json({ ok: true });
});

// GET /api/canvas/events — SSE stream
canvasRoutes.get("/api/canvas/events", async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const heartbeat = setInterval(() => {
        send("heartbeat", { time: Date.now() });
      }, 30000);
      const poll = setInterval(async () => {
        try {
          const running = await db
            .select()
            .from(schema.agentExecutions)
            .where(eq(schema.agentExecutions.status, "running"));
          if (running.length > 0) {
            send("agent:running", running.map((r) => ({ agentId: r.agentId, projectId: r.projectId, step: r.step })));
          }
        } catch { /* ignore */ }
      }, 2000);
      c.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(poll);
        controller.close();
      });
      send("connected", { time: Date.now() });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": config.webUrl,
    },
  });
});

// GET /api/canvas/replay/:projectId — execution timeline
canvasRoutes.get("/api/canvas/replay/:projectId", async (c) => {
  const executions = await db
    .select()
    .from(schema.agentExecutions)
    .where(eq(schema.agentExecutions.projectId, c.req.param("projectId")))
    .orderBy(schema.agentExecutions.startedAt);
  return c.json(executions);
});

// GET /api/agents/:id/file — read agent skill file
canvasRoutes.get("/api/agents/:id/file", async (c) => {
  const agentId = sanitizeAgentId(c.req.param("id"));
  if (!agentId) return c.json({ error: "Invalid agent id" }, 400);
  const agentsDir = config.agentsPath;
  const { readdirSync } = await import("fs");
  const files = readdirSync(agentsDir);
  const match = files.find((f: string) => f.startsWith(agentId) && f.endsWith(".md"));
  if (!match) return c.json({ error: "Agent file not found" }, 404);
  const content = await readFile(join(agentsDir, match), "utf-8");
  return c.json({ filename: match, content });
});

// PUT /api/agents/:id/file — save agent skill file
canvasRoutes.put("/api/agents/:id/file", async (c) => {
  const agentId = sanitizeAgentId(c.req.param("id"));
  if (!agentId) return c.json({ error: "Invalid agent id" }, 400);
  const body = await c.req.json();
  const parsed = parseBody(updateAgentFileSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const agentsDir = config.agentsPath;
  const { readdirSync } = await import("fs");
  const files = readdirSync(agentsDir);
  const match = files.find((f: string) => f.startsWith(agentId) && f.endsWith(".md"));
  if (!match) return c.json({ error: "Agent file not found" }, 404);
  await writeFile(join(agentsDir, match), parsed.data.content, "utf-8");
  return c.json({ ok: true, filename: match });
});

// POST /api/canvas/seed-connections — generate pipeline connections
canvasRoutes.post("/api/canvas/seed-connections", async (c) => {
  const { AGENT_REGISTRY } = await import("../agents/registry.js");
  const agents = Object.values(AGENT_REGISTRY) as { id: string; steps?: string[]; gates?: string[] }[];
  const stepAgents = new Map<string, string[]>();
  for (const agent of agents) {
    for (const step of agent.steps ?? []) {
      const list = stepAgents.get(step) ?? [];
      list.push(agent.id);
      stepAgents.set(step, list);
    }
  }
  const connections: { sourceAgentId: string; targetAgentId: string }[] = [];
  for (let i = 0; i < PIPELINE_ORDER.length - 1; i++) {
    const currentAgents = stepAgents.get(PIPELINE_ORDER[i]) ?? [];
    const nextAgents = stepAgents.get(PIPELINE_ORDER[i + 1]) ?? [];
    for (const src of currentAgents) {
      for (const tgt of nextAgents) {
        if (src !== tgt) connections.push({ sourceAgentId: src, targetAgentId: tgt });
      }
    }
  }
  const gateAgents = agents.filter((a) => (a.gates ?? []).length > 0);
  for (const reviewer of gateAgents) {
    if (reviewer.id === "XF-001") continue;
    for (const gate of reviewer.gates ?? []) {
      const critics = gateAgents.filter((a) => a.id === "XF-001" && (a.gates ?? []).includes(gate));
      for (const critic of critics) {
        connections.push({ sourceAgentId: reviewer.id, targetAgentId: critic.id });
      }
    }
  }
  let created = 0;
  for (const conn of connections) {
    try {
      await db.insert(schema.agentConnections).values({ ...conn, type: "pipeline" }).onConflictDoNothing();
      created++;
    } catch { /* skip */ }
  }
  return c.json({ seeded: created, total: connections.length });
});
