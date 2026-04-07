# Agent Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive visual node canvas for all 20 agents with animated connections, real-time execution flow, inline .md editing, and replay capabilities.

**Architecture:** New `/admin/canvas` page using React Flow for the interactive graph, with custom nodes/edges, a slide-in drawer with Monaco editor, SSE for real-time events, and dagre for auto-layout. Two new DB tables store connections and node positions. Backend API serves graph data and agent file editing.

**Tech Stack:** React Flow (@xyflow/react), Monaco Editor (@monaco-editor/react), dagre, SSE (native EventSource), Hono API routes, Drizzle ORM, Next.js 16 server components + client components.

**Spec:** `docs/superpowers/specs/2026-04-07-agent-canvas-design.md`

---

## File Structure

```
# New files (frontend)
web/app/admin/canvas/page.tsx                    — Server component: fetch graph data, pass to client
web/app/admin/canvas/canvas-view.tsx             — Client component: React Flow provider, SSE, state
web/app/admin/canvas/components/agent-node.tsx   — Custom node: name + status border color + glow
web/app/admin/canvas/components/animated-edge.tsx — Custom edge: bezier + SVG particle animation
web/app/admin/canvas/components/toolbar.tsx       — Vertical left toolbar: zoom, fit, layout, replay
web/app/admin/canvas/components/filter-pills.tsx  — Floating filter pills (teams, status, live)
web/app/admin/canvas/components/command-palette.tsx — Cmd+K search modal
web/app/admin/canvas/sidepanel/agent-drawer.tsx   — Drawer container with tabs
web/app/admin/canvas/sidepanel/agent-info.tsx     — Tab 1: config, stats, connections
web/app/admin/canvas/sidepanel/agent-editor.tsx   — Tab 2: Monaco markdown editor
web/app/admin/canvas/sidepanel/agent-executions.tsx — Tab 3: execution history

# New files (backend)
src/api/canvas-routes.ts          — Hono routes: graph, positions, connections, events SSE, replay, file read/write
src/db/migrations/0010_agent_canvas.sql — Migration for new tables

# Modified files
src/db/schema.ts                  — Add agentConnections + agentNodePositions tables
web/lib/admin-schema.ts           — Mirror new tables
src/api/routes.ts                 — Mount canvas routes + protect with auth
web/app/admin/layout.tsx          — Add "Canvas" nav link
web/lib/agent-registry.ts         — Add connections field to AgentInfo type
```

---

### Task 1: Install Dependencies

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install React Flow, Monaco, and dagre**

```bash
cd web && npm install @xyflow/react @monaco-editor/react dagre && npm install -D @types/dagre
```

- [ ] **Step 2: Verify install succeeded**

Run: `cd web && node -e "require('@xyflow/react'); require('dagre'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "feat(canvas): install React Flow, Monaco Editor, dagre dependencies"
```

---

### Task 2: Database Schema — New Tables

**Files:**
- Modify: `src/db/schema.ts` (add tables at end, before Auth section)
- Modify: `web/lib/admin-schema.ts` (mirror new tables)

- [ ] **Step 1: Add new tables to backend schema**

Add to `src/db/schema.ts` before the `// ── Auth (Better Auth) ──` comment:

```typescript
// ── Agent Canvas ──

export const connectionTypeEnum = pgEnum("connection_type", [
  "pipeline",
  "manual",
]);

export const agentConnections = pgTable("agent_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceAgentId: varchar("source_agent_id", { length: 20 }).notNull(),
  targetAgentId: varchar("target_agent_id", { length: 20 }).notNull(),
  type: connectionTypeEnum("type").default("pipeline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("agent_connections_source_idx").on(table.sourceAgentId),
  index("agent_connections_target_idx").on(table.targetAgentId),
]);

export const agentNodePositions = pgTable("agent_node_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: varchar("agent_id", { length: 20 }).notNull().unique(),
  x: numeric("x", { precision: 10, scale: 2 }).default("0").notNull(),
  y: numeric("y", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Mirror tables in frontend schema**

Add to `web/lib/admin-schema.ts` at the end:

```typescript
// ── Agent Canvas ──

export const connectionTypeEnum = pgEnum("connection_type", [
  "pipeline",
  "manual",
]);

export const agentConnections = pgTable("agent_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceAgentId: varchar("source_agent_id", { length: 20 }).notNull(),
  targetAgentId: varchar("target_agent_id", { length: 20 }).notNull(),
  type: connectionTypeEnum("type").default("pipeline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("agent_connections_source_idx").on(table.sourceAgentId),
  index("agent_connections_target_idx").on(table.targetAgentId),
]);

export const agentNodePositions = pgTable("agent_node_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: varchar("agent_id", { length: 20 }).notNull().unique(),
  x: numeric("x", { precision: 10, scale: 2 }).default("0").notNull(),
  y: numeric("y", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Generate migration**

Run: `cd /Users/juanpa/Agentes/criteria.agency-2 && npx drizzle-kit generate`
Expected: New migration file created in `src/db/migrations/`

- [ ] **Step 4: Run migration**

Run: `npx drizzle-kit push`
Expected: Tables `agent_connections` and `agent_node_positions` created

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts web/lib/admin-schema.ts src/db/migrations/
git commit -m "feat(canvas): add agent_connections and agent_node_positions tables"
```

---

### Task 3: Backend API — Canvas Routes

**Files:**
- Create: `src/api/canvas-routes.ts`
- Modify: `src/api/routes.ts` (mount + protect routes)

- [ ] **Step 1: Create canvas routes file**

Create `src/api/canvas-routes.ts`:

```typescript
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { config } from "../shared/config.js";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export const canvasRoutes = new Hono();

// ── Pipeline step order (for seeding connections) ──
const PIPELINE_ORDER = [
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "audio", "edit", "polish", "delivery",
];

// ── GET /api/canvas/graph — full graph data ──
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

// ── PUT /api/canvas/positions — batch update node positions ──
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

// ── POST /api/canvas/connections — create manual connection ──
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

// ── DELETE /api/canvas/connections/:id — delete connection ──
canvasRoutes.delete("/api/canvas/connections/:id", async (c) => {
  await db
    .delete(schema.agentConnections)
    .where(eq(schema.agentConnections.id, c.req.param("id")));

  return c.json({ ok: true });
});

// ── GET /api/canvas/events — SSE stream ──
canvasRoutes.get("/api/canvas/events", async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        send("heartbeat", { time: Date.now() });
      }, 30000);

      // Poll for running executions every 2s
      const poll = setInterval(async () => {
        try {
          const running = await db
            .select()
            .from(schema.agentExecutions)
            .where(eq(schema.agentExecutions.status, "running"));
          if (running.length > 0) {
            send("agent:running", running.map((r) => ({ agentId: r.agentId, projectId: r.projectId, step: r.step })));
          }
        } catch {
          // ignore polling errors
        }
      }, 2000);

      // Cleanup on close
      c.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(poll);
        controller.close();
      });

      // Initial state
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

// ── GET /api/canvas/replay/:projectId — execution timeline ──
canvasRoutes.get("/api/canvas/replay/:projectId", async (c) => {
  const executions = await db
    .select()
    .from(schema.agentExecutions)
    .where(eq(schema.agentExecutions.projectId, c.req.param("projectId")))
    .orderBy(schema.agentExecutions.startedAt);

  return c.json(executions);
});

// ── GET /api/agents/:id/file — read agent skill file ──
canvasRoutes.get("/api/agents/:id/file", async (c) => {
  const agentId = c.req.param("id");
  const agentsDir = config.agentsPath;

  // Find matching file (agents are named like T1-L_creative_director.md)
  const { readdirSync } = await import("fs");
  const files = readdirSync(agentsDir);
  const match = files.find((f: string) => f.startsWith(agentId) && f.endsWith(".md"));

  if (!match) return c.json({ error: "Agent file not found" }, 404);

  const content = await readFile(join(agentsDir, match), "utf-8");
  return c.json({ filename: match, content });
});

// ── PUT /api/agents/:id/file — save agent skill file ──
canvasRoutes.put("/api/agents/:id/file", async (c) => {
  const agentId = c.req.param("id");
  const body = await c.req.json<{ content: string }>();
  const agentsDir = config.agentsPath;

  const { readdirSync } = await import("fs");
  const files = readdirSync(agentsDir);
  const match = files.find((f: string) => f.startsWith(agentId) && f.endsWith(".md"));

  if (!match) return c.json({ error: "Agent file not found" }, 404);

  await writeFile(join(agentsDir, match), body.content, "utf-8");
  return c.json({ ok: true, filename: match });
});

// ── POST /api/canvas/seed-connections — generate pipeline connections ──
canvasRoutes.post("/api/canvas/seed-connections", async (c) => {
  const { AGENT_REGISTRY } = await import("../agents/registry.js");
  const agents = Object.values(AGENT_REGISTRY) as { id: string; steps?: string[]; gates?: string[] }[];

  // Build step-to-agents map
  const stepAgents = new Map<string, string[]>();
  for (const agent of agents) {
    for (const step of agent.steps ?? []) {
      const list = stepAgents.get(step) ?? [];
      list.push(agent.id);
      stepAgents.set(step, list);
    }
  }

  // Create connections between agents in adjacent pipeline steps
  const connections: { sourceAgentId: string; targetAgentId: string }[] = [];
  for (let i = 0; i < PIPELINE_ORDER.length - 1; i++) {
    const currentStep = PIPELINE_ORDER[i];
    const nextStep = PIPELINE_ORDER[i + 1];
    const currentAgents = stepAgents.get(currentStep) ?? [];
    const nextAgents = stepAgents.get(nextStep) ?? [];

    for (const src of currentAgents) {
      for (const tgt of nextAgents) {
        if (src !== tgt) {
          connections.push({ sourceAgentId: src, targetAgentId: tgt });
        }
      }
    }
  }

  // Gate connections: agents with gates connect to gate reviewers
  const gateAgents = agents.filter((a) => (a.gates ?? []).length > 0);
  for (const reviewer of gateAgents) {
    if (reviewer.id === "XF-001") continue; // XF-001 IS the reviewer
    for (const gate of reviewer.gates ?? []) {
      // XF-001 (Cinematographic Critic) reviews g4, g5
      const critics = gateAgents.filter((a) => a.id === "XF-001" && (a.gates ?? []).includes(gate));
      for (const critic of critics) {
        connections.push({ sourceAgentId: reviewer.id, targetAgentId: critic.id });
      }
    }
  }

  // Upsert all connections
  let created = 0;
  for (const conn of connections) {
    try {
      await db
        .insert(schema.agentConnections)
        .values({ ...conn, type: "pipeline" })
        .onConflictDoNothing();
      created++;
    } catch {
      // skip duplicates
    }
  }

  return c.json({ seeded: created, total: connections.length });
});
```

- [ ] **Step 2: Mount canvas routes and add auth protection**

In `src/api/routes.ts`, add the import after the other route imports:

```typescript
import { canvasRoutes } from "./canvas-routes.js";
```

Add auth protection (after the existing `app.use("/admin/*", requireAdmin);` line):

```typescript
app.use("/api/canvas/*", requireSession);
app.use("/api/canvas/*", requireAdmin);
app.use("/api/agents/*/file", requireSession);
app.use("/api/agents/*/file", requireAdmin);
```

Mount the routes (after `app.route("/", dashboardRoutes);`):

```typescript
app.route("/", canvasRoutes);
```

- [ ] **Step 3: Verify backend compiles**

Run: `cd /Users/juanpa/Agentes/criteria.agency-2 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/api/canvas-routes.ts src/api/routes.ts
git commit -m "feat(canvas): add canvas API routes — graph, positions, connections, SSE, file edit"
```

---

### Task 4: Agent Node Component

**Files:**
- Create: `web/app/admin/canvas/components/agent-node.tsx`

- [ ] **Step 1: Create the custom React Flow node**

Create `web/app/admin/canvas/components/agent-node.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface AgentNodeData {
  label: string;
  agentId: string;
  status: "idle" | "running" | "completed" | "failed";
  level: string;
  [key: string]: unknown;
}

const STATUS_COLORS: Record<string, { border: string; glow: string }> = {
  idle: { border: "#2a2a2a", glow: "none" },
  running: { border: "#ffd053", glow: "0 0 12px rgba(255,208,83,0.3)" },
  completed: { border: "#22c55e", glow: "none" },
  failed: { border: "#ef4444", glow: "0 0 12px rgba(239,68,68,0.3)" },
};

function AgentNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const { border, glow } = STATUS_COLORS[nodeData.status] ?? STATUS_COLORS.idle;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2 hover:!bg-[#ffd053] transition-colors" />
      <div
        className="bg-[#141414] rounded-lg px-3 py-2 cursor-pointer select-none transition-all hover:brightness-110"
        style={{
          border: `1.5px solid ${border}`,
          boxShadow: glow,
          minWidth: 120,
        }}
      >
        <div className="flex items-center gap-2">
          {nodeData.status === "running" && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd053] animate-pulse" />
          )}
          <span className="text-white text-xs font-medium truncate">{nodeData.label}</span>
        </div>
        <span className="text-[#666] text-[10px] font-mono">{nodeData.agentId}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2 hover:!bg-[#ffd053] transition-colors" />
    </>
  );
}

export const AgentNode = memo(AgentNodeComponent);
```

- [ ] **Step 2: Commit**

```bash
git add web/app/admin/canvas/components/agent-node.tsx
git commit -m "feat(canvas): add custom AgentNode component with status colors"
```

---

### Task 5: Animated Edge Component

**Files:**
- Create: `web/app/admin/canvas/components/animated-edge.tsx`

- [ ] **Step 1: Create custom animated edge**

Create `web/app/admin/canvas/components/animated-edge.tsx`:

```tsx
"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export interface AnimatedEdgeData {
  animated: boolean;
  connectionType: "pipeline" | "manual";
  [key: string]: unknown;
}

function AnimatedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const isAnimated = edgeData?.animated ?? false;
  const isPipeline = (edgeData?.connectionType ?? "pipeline") === "pipeline";

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isAnimated ? "#ffd053" : "#2a2a2a",
          strokeWidth: isAnimated ? 1.5 : 1,
          strokeDasharray: isPipeline ? "none" : "5 5",
          opacity: isAnimated ? 0.8 : 0.4,
          ...style,
        }}
      />
      {isAnimated && (
        <circle r="3" fill="#ffd053">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
```

- [ ] **Step 2: Commit**

```bash
git add web/app/admin/canvas/components/animated-edge.tsx
git commit -m "feat(canvas): add AnimatedEdge component with particle animation"
```

---

### Task 6: Toolbar Component

**Files:**
- Create: `web/app/admin/canvas/components/toolbar.tsx`

- [ ] **Step 1: Create vertical toolbar**

Create `web/app/admin/canvas/components/toolbar.tsx`:

```tsx
"use client";

import { useReactFlow } from "@xyflow/react";

interface ToolbarProps {
  onAutoLayout: () => void;
  onReplay: () => void;
  isReplaying: boolean;
  replaySpeed: number;
  onSpeedChange: (speed: number) => void;
  onPauseReplay: () => void;
}

export function Toolbar({
  onAutoLayout,
  onReplay,
  isReplaying,
  replaySpeed,
  onSpeedChange,
  onPauseReplay,
}: ToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-1.5">
      <ToolButton label="+" title="Zoom in" onClick={() => zoomIn()} />
      <ToolButton label="-" title="Zoom out" onClick={() => zoomOut()} />
      <ToolButton label="⊞" title="Fit view" onClick={() => fitView({ padding: 0.1 })} />
      <ToolButton label="⊟" title="Auto layout" onClick={onAutoLayout} />
      <div className="border-t border-[#2a2a2a] my-1" />
      {isReplaying ? (
        <>
          <ToolButton label="⏸" title="Pause" onClick={onPauseReplay} active />
          <ToolButton
            label={`${replaySpeed}x`}
            title="Speed"
            onClick={() => onSpeedChange(replaySpeed === 4 ? 1 : replaySpeed * 2)}
          />
        </>
      ) : (
        <ToolButton label="▶" title="Replay" onClick={onReplay} />
      )}
    </div>
  );
}

function ToolButton({
  label,
  title,
  onClick,
  active = false,
}: {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${
        active
          ? "bg-[#ffd053]/20 text-[#ffd053] border border-[#ffd053]/30"
          : "bg-[#1a1a1a] text-[#666] border border-[#333] hover:text-white hover:border-[#555]"
      }`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/admin/canvas/components/toolbar.tsx
git commit -m "feat(canvas): add Toolbar component with zoom, layout, replay controls"
```

---

### Task 7: Filter Pills Component

**Files:**
- Create: `web/app/admin/canvas/components/filter-pills.tsx`

- [ ] **Step 1: Create filter pills**

Create `web/app/admin/canvas/components/filter-pills.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { TEAM_NAMES } from "@/lib/agent-registry";

export interface Filters {
  teams: number[];
  status: string[];
  liveOnly: boolean;
}

interface FilterPillsProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  hasLiveAgents: boolean;
}

export function FilterPills({ filters, onChange, hasLiveAgents }: FilterPillsProps) {
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const teamRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamDropdownOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const teamEntries = Object.entries(TEAM_NAMES).map(([k, v]) => [Number(k), v] as [number, string]);
  const allTeamsSelected = filters.teams.length === 0;
  const statuses = ["idle", "running", "completed", "failed"];

  const toggleTeam = (teamId: number) => {
    const next = filters.teams.includes(teamId)
      ? filters.teams.filter((t) => t !== teamId)
      : [...filters.teams, teamId];
    onChange({ ...filters, teams: next });
  };

  const toggleStatus = (status: string) => {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onChange({ ...filters, status: next });
  };

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
      {/* Teams */}
      <div ref={teamRef} className="relative">
        <button
          onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            allTeamsSelected
              ? "bg-[#1a1a1a] border-[#333] text-[#999]"
              : "bg-[#1a1a1a] border-[#ffd053] text-[#ffd053]"
          }`}
        >
          {allTeamsSelected ? "All teams" : `${filters.teams.length} teams`}
        </button>
        {teamDropdownOpen && (
          <div className="absolute top-8 right-0 bg-[#141414] border border-[#2a2a2a] rounded-lg p-2 min-w-[180px] shadow-xl">
            {teamEntries.map(([id, name]) => (
              <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-[#1a1a1a] rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.teams.length === 0 || filters.teams.includes(id)}
                  onChange={() => toggleTeam(id)}
                  className="accent-[#ffd053]"
                />
                <span className="text-[11px] text-[#999]">{name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div ref={statusRef} className="relative">
        <button
          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            filters.status.length === 0
              ? "bg-[#1a1a1a] border-[#333] text-[#999]"
              : "bg-[#1a1a1a] border-[#ffd053] text-[#ffd053]"
          }`}
        >
          {filters.status.length === 0 ? "Status" : filters.status.join(", ")}
        </button>
        {statusDropdownOpen && (
          <div className="absolute top-8 right-0 bg-[#141414] border border-[#2a2a2a] rounded-lg p-2 min-w-[140px] shadow-xl">
            {statuses.map((s) => (
              <label key={s} className="flex items-center gap-2 px-2 py-1 hover:bg-[#1a1a1a] rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.status.includes(s)}
                  onChange={() => toggleStatus(s)}
                  className="accent-[#ffd053]"
                />
                <span className="text-[11px] text-[#999] capitalize">{s}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Live toggle */}
      <button
        onClick={() => onChange({ ...filters, liveOnly: !filters.liveOnly })}
        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
          filters.liveOnly
            ? "bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e]"
            : "bg-[#1a1a1a] border-[#333] text-[#999]"
        }`}
      >
        {hasLiveAgents && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />}
        Live
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/admin/canvas/components/filter-pills.tsx
git commit -m "feat(canvas): add FilterPills component with team, status, live toggles"
```

---

### Task 8: Command Palette Component

**Files:**
- Create: `web/app/admin/canvas/components/command-palette.tsx`

- [ ] **Step 1: Create command palette**

Create `web/app/admin/canvas/components/command-palette.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { AgentInfo } from "@/lib/agent-registry";

interface CommandPaletteProps {
  agents: AgentInfo[];
  open: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

export function CommandPalette({ agents, open, onClose, onSelectAgent }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onSelectAgent("__open__"); // signal to parent to open
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onSelectAgent]);

  const results = useMemo(() => {
    if (!query.trim()) return agents;
    const q = query.toLowerCase();

    // Prefix filters
    if (q.startsWith("team:")) {
      const teamQ = q.slice(5).trim();
      return agents.filter((a) => a.teamName.toLowerCase().includes(teamQ));
    }
    if (q.startsWith("step:")) {
      const stepQ = q.slice(5).trim();
      return agents.filter((a) => a.steps.some((s) => s.includes(stepQ)));
    }
    if (q.startsWith("gate:")) {
      const gateQ = q.slice(5).trim();
      return agents.filter((a) => a.gates.some((g) => g.includes(gateQ)));
    }

    // General search
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.teamName.toLowerCase().includes(q) ||
        a.steps.some((s) => s.includes(q)) ||
        a.gates.some((g) => g.includes(q)),
    );
  }, [query, agents]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      onSelectAgent(results[selectedIndex].id);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
          <span className="text-[#666] text-sm">&#x2318;K</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search agents... (team: step: gate:)"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#666]"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {results.map((agent, i) => (
            <button
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIndex ? "bg-[#ffd053]/10" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="text-[10px] font-mono text-[#666] w-10">{agent.id}</span>
              <span className="text-sm text-white flex-1">{agent.name}</span>
              <span className="text-[10px] text-[#666]">{agent.teamName}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="px-4 py-6 text-center text-[#666] text-sm">No agents found</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/admin/canvas/components/command-palette.tsx
git commit -m "feat(canvas): add CommandPalette with search, prefix filters, keyboard nav"
```

---

### Task 9: Sidepanel — Agent Drawer

**Files:**
- Create: `web/app/admin/canvas/sidepanel/agent-drawer.tsx`
- Create: `web/app/admin/canvas/sidepanel/agent-info.tsx`
- Create: `web/app/admin/canvas/sidepanel/agent-editor.tsx`
- Create: `web/app/admin/canvas/sidepanel/agent-executions.tsx`

- [ ] **Step 1: Create drawer container**

Create `web/app/admin/canvas/sidepanel/agent-drawer.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import type { AgentInfo } from "@/lib/agent-registry";
import { AgentInfoTab } from "./agent-info";
import { AgentEditorTab } from "./agent-editor";
import { AgentExecutionsTab } from "./agent-executions";

interface AgentDrawerProps {
  agent: AgentInfo | null;
  execStats: { total: number; completed: number; failed: number; running: number; avgDuration: number } | null;
  connections: { id: string; sourceAgentId: string; targetAgentId: string; type: string }[];
  allAgents: AgentInfo[];
  status: "idle" | "running" | "completed" | "failed";
  onClose: () => void;
  onAddConnection: (sourceId: string, targetId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
  apiBase: string;
}

const TABS = ["Info", "Editor", "Executions"] as const;

const LEVEL_BADGES: Record<string, { bg: string; text: string }> = {
  top: { bg: "bg-[#ffd053]/20", text: "text-[#ffd053]" },
  leader: { bg: "bg-blue-500/20", text: "text-blue-400" },
  sub: { bg: "bg-[#2a2a2a]", text: "text-[#666]" },
  cross_functional: { bg: "bg-purple-500/20", text: "text-purple-400" },
};

export function AgentDrawer({
  agent,
  execStats,
  connections,
  allAgents,
  status,
  onClose,
  onAddConnection,
  onRemoveConnection,
  apiBase,
}: AgentDrawerProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Info");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Reset tab when agent changes
  useEffect(() => {
    setActiveTab("Info");
    setHasUnsavedChanges(false);
  }, [agent?.id]);

  if (!agent) return null;

  const badge = LEVEL_BADGES[agent.level] ?? LEVEL_BADGES.sub;

  return (
    <div
      className="fixed top-14 right-0 bottom-0 w-[420px] bg-[#0f0f0f] border-l border-[#2a2a2a] z-40 flex flex-col shadow-2xl animate-[slideIn_200ms_ease-out]"
      style={{ "--tw-animate-slideIn": "translateX(100%)" } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                status === "running" ? "#ffd053" : status === "completed" ? "#22c55e" : status === "failed" ? "#ef4444" : "#2a2a2a",
            }}
          />
          <div>
            <h3 className="text-white text-sm font-medium">{agent.name}</h3>
            <span className="text-[#666] text-[10px] font-mono">{agent.id}</span>
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
            {agent.level}
          </span>
        </div>
        <button onClick={onClose} className="text-[#666] hover:text-white text-lg transition-colors">
          &times;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab ? "text-[#ffd053] border-b-2 border-[#ffd053]" : "text-[#666] hover:text-[#999]"
            }`}
          >
            {tab}
            {tab === "Editor" && hasUnsavedChanges && (
              <span className="absolute top-1.5 right-[calc(50%-16px)] w-1.5 h-1.5 rounded-full bg-[#ffd053]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "Info" && (
          <AgentInfoTab
            agent={agent}
            execStats={execStats}
            connections={connections}
            allAgents={allAgents}
            onAddConnection={onAddConnection}
            onRemoveConnection={onRemoveConnection}
          />
        )}
        {activeTab === "Editor" && (
          <AgentEditorTab
            agentId={agent.id}
            apiBase={apiBase}
            onDirtyChange={setHasUnsavedChanges}
          />
        )}
        {activeTab === "Executions" && (
          <AgentExecutionsTab agentId={agent.id} execStats={execStats} apiBase={apiBase} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Info tab**

Create `web/app/admin/canvas/sidepanel/agent-info.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { AgentInfo } from "@/lib/agent-registry";

interface AgentInfoTabProps {
  agent: AgentInfo;
  execStats: { total: number; completed: number; failed: number; running: number; avgDuration: number } | null;
  connections: { id: string; sourceAgentId: string; targetAgentId: string; type: string }[];
  allAgents: AgentInfo[];
  onAddConnection: (sourceId: string, targetId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
}

export function AgentInfoTab({
  agent,
  execStats,
  connections,
  allAgents,
  onAddConnection,
  onRemoveConnection,
}: AgentInfoTabProps) {
  const [addingConnection, setAddingConnection] = useState(false);

  const incoming = connections.filter((c) => c.targetAgentId === agent.id);
  const outgoing = connections.filter((c) => c.sourceAgentId === agent.id);
  const connectedIds = new Set([...incoming.map((c) => c.sourceAgentId), ...outgoing.map((c) => c.targetAgentId)]);
  const availableTargets = allAgents.filter((a) => a.id !== agent.id && !connectedIds.has(a.id));

  const successRate = execStats && execStats.total > 0 ? Math.round((execStats.completed / execStats.total) * 100) : null;

  return (
    <div className="p-4 space-y-5">
      {/* Basic info */}
      <div>
        <Label>Team</Label>
        <p className="text-sm text-[#9d9a9c]">{agent.teamName}</p>
      </div>

      <div>
        <Label>Autonomy</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#ffd053] h-full rounded-full" style={{ width: `${agent.autonomy}%` }} />
          </div>
          <span className="text-[11px] text-[#666]">{agent.autonomy}%</span>
        </div>
      </div>

      {/* Steps & Gates */}
      {agent.steps.length > 0 && (
        <div>
          <Label>Steps</Label>
          <div className="flex flex-wrap gap-1.5">
            {agent.steps.map((step) => (
              <span key={step} className="text-[10px] bg-[#1a1a1a] text-[#9d9a9c] px-2 py-0.5 rounded">
                {step}
              </span>
            ))}
          </div>
        </div>
      )}
      {agent.gates.length > 0 && (
        <div>
          <Label>Gates</Label>
          <div className="flex flex-wrap gap-1.5">
            {agent.gates.map((gate) => (
              <span key={gate} className="text-[10px] bg-[#ffd053]/10 text-[#ffd053] px-2 py-0.5 rounded uppercase">
                {gate}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {execStats && execStats.total > 0 && (
        <div>
          <Label>Execution Stats</Label>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Total" value={execStats.total} />
            <StatBox label="Success" value={`${successRate}%`} color={successRate! >= 80 ? "#22c55e" : successRate! >= 50 ? "#ffd053" : "#ef4444"} />
            <StatBox label="Avg time" value={execStats.avgDuration ? `${execStats.avgDuration}s` : "—"} />
          </div>
        </div>
      )}

      {/* Connections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Connections</Label>
          <button
            onClick={() => setAddingConnection(!addingConnection)}
            className="text-[10px] text-[#ffd053] hover:text-[#ffe088] transition-colors"
          >
            {addingConnection ? "Cancel" : "+ Add"}
          </button>
        </div>

        {addingConnection && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAddConnection(agent.id, e.target.value);
                setAddingConnection(false);
              }
            }}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white mb-2 outline-none"
            defaultValue=""
          >
            <option value="" disabled>Select agent...</option>
            {availableTargets.map((a) => (
              <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
            ))}
          </select>
        )}

        {incoming.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] text-[#666] uppercase">Incoming</span>
            {incoming.map((c) => (
              <ConnectionRow key={c.id} agentId={c.sourceAgentId} type={c.type} onRemove={() => onRemoveConnection(c.id)} />
            ))}
          </div>
        )}
        {outgoing.length > 0 && (
          <div>
            <span className="text-[10px] text-[#666] uppercase">Outgoing</span>
            {outgoing.map((c) => (
              <ConnectionRow key={c.id} agentId={c.targetAgentId} type={c.type} onRemove={() => onRemoveConnection(c.id)} />
            ))}
          </div>
        )}
        {incoming.length === 0 && outgoing.length === 0 && !addingConnection && (
          <p className="text-[11px] text-[#666]">No connections</p>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#666] uppercase tracking-wider mb-1">{children}</p>;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#1a1a1a] rounded p-2 text-center">
      <p className="text-xs font-medium" style={{ color: color ?? "#fff" }}>{value}</p>
      <p className="text-[9px] text-[#666]">{label}</p>
    </div>
  );
}

function ConnectionRow({ agentId, type, onRemove }: { agentId: string; type: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-white font-mono">{agentId}</span>
        <span className={`text-[9px] px-1 rounded ${type === "pipeline" ? "text-[#666] bg-[#1a1a1a]" : "text-[#ffd053] bg-[#ffd053]/10"}`}>
          {type}
        </span>
      </div>
      {type === "manual" && (
        <button onClick={onRemove} className="text-[#666] hover:text-red-400 text-xs transition-colors">&times;</button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create Editor tab**

Create `web/app/admin/canvas/sidepanel/agent-editor.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false });

interface AgentEditorTabProps {
  agentId: string;
  apiBase: string;
  onDirtyChange: (dirty: boolean) => void;
}

export function AgentEditorTab({ agentId, apiBase, onDirtyChange }: AgentEditorTabProps) {
  const [content, setContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  useEffect(() => {
    setContent(null);
    setError(null);
    fetch(`${apiBase}/api/agents/${agentId}/file`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load file");
        return r.json();
      })
      .then((data: { filename: string; content: string }) => {
        setContent(data.content);
        setOriginalContent(data.content);
        setFilename(data.filename);
      })
      .catch((e) => setError(e.message));
  }, [agentId, apiBase]);

  const isDirty = content !== null && content !== originalContent;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const save = useCallback(async () => {
    if (!content || !isDirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/agents/${agentId}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setOriginalContent(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [content, isDirty, agentId, apiBase]);

  if (error && content === null) {
    return <div className="p-4 text-red-400 text-sm">{error}</div>;
  }

  if (content === null) {
    return <div className="p-4 text-[#666] text-sm">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-[10px] text-[#666] font-mono">{filename}</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-[10px] text-red-400">{error}</span>}
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
              isDirty
                ? "bg-[#ffd053] text-black font-medium hover:bg-[#ffe088]"
                : "bg-[#1a1a1a] text-[#666] cursor-not-allowed"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[400px]">
        <MonacoEditor
          height="100%"
          language="markdown"
          theme="vs-dark"
          value={content}
          onChange={(val) => setContent(val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Executions tab**

Create `web/app/admin/canvas/sidepanel/agent-executions.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";

interface Execution {
  id: string;
  projectId: string;
  step: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

interface AgentExecutionsTabProps {
  agentId: string;
  execStats: { total: number; completed: number; failed: number; running: number; avgDuration: number } | null;
  apiBase: string;
}

export function AgentExecutionsTab({ agentId, execStats, apiBase }: AgentExecutionsTabProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Fetch all executions for this agent across all projects
    fetch(`${apiBase}/api/canvas/graph`, { credentials: "include" })
      .then((r) => r.json())
      .then(() => {
        // For now, we show stats from graph data; detailed executions need a dedicated endpoint
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [agentId, apiBase]);

  const successRate = execStats && execStats.total > 0 ? Math.round((execStats.completed / execStats.total) * 100) : null;

  return (
    <div className="p-4 space-y-4">
      {/* Aggregated stats */}
      {execStats && execStats.total > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Total" value={execStats.total} />
          <StatCard label="Running" value={execStats.running} color="#ffd053" />
          <StatCard
            label="Success"
            value={`${successRate}%`}
            color={successRate! >= 80 ? "#22c55e" : "#ffd053"}
          />
          <StatCard label="Failed" value={execStats.failed} color={execStats.failed > 0 ? "#ef4444" : "#666"} />
        </div>
      )}

      {(!execStats || execStats.total === 0) && (
        <div className="text-center py-8 text-[#666] text-sm">
          No executions yet for this agent
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center">
      <p className="text-sm font-medium" style={{ color: color ?? "#fff" }}>{value}</p>
      <p className="text-[9px] text-[#666] mt-0.5">{label}</p>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/app/admin/canvas/sidepanel/
git commit -m "feat(canvas): add sidepanel — drawer, info tab, Monaco editor tab, executions tab"
```

---

### Task 10: Canvas View — Main Client Component

**Files:**
- Create: `web/app/admin/canvas/canvas-view.tsx`

- [ ] **Step 1: Create the main canvas client component**

Create `web/app/admin/canvas/canvas-view.tsx`:

```tsx
"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { AGENTS, type AgentInfo } from "@/lib/agent-registry";
import { AgentNode, type AgentNodeData } from "./components/agent-node";
import { AnimatedEdge } from "./components/animated-edge";
import { Toolbar } from "./components/toolbar";
import { FilterPills, type Filters } from "./components/filter-pills";
import { CommandPalette } from "./components/command-palette";
import { AgentDrawer } from "./sidepanel/agent-drawer";

const nodeTypes = { agent: AgentNode };
const edgeTypes = { animated: AnimatedEdge };

interface GraphData {
  connections: { id: string; sourceAgentId: string; targetAgentId: string; type: string }[];
  positions: { agentId: string; x: string; y: string }[];
  execStats: { agentId: string; total: number; completed: number; failed: number; running: number; avgDuration: number }[];
}

interface CanvasViewProps {
  initialGraph: GraphData;
  apiBase: string;
}

// ── Dagre layout ──
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 130, height: 50 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 65,
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function CanvasContent({ initialGraph, apiBase }: CanvasViewProps) {
  const reactFlow = useReactFlow();
  const statsMap = useMemo(
    () => new Map(initialGraph.execStats.map((s) => [s.agentId, s])),
    [initialGraph.execStats],
  );
  const posMap = useMemo(
    () => new Map(initialGraph.positions.map((p) => [p.agentId, { x: parseFloat(p.x), y: parseFloat(p.y) }])),
    [initialGraph.positions],
  );

  // ── Build initial nodes & edges ──
  const [initialNodes, initialEdges] = useMemo(() => {
    const agentNodes: Node[] = AGENTS.map((agent) => ({
      id: agent.id,
      type: "agent",
      position: posMap.get(agent.id) ?? { x: 0, y: 0 },
      data: {
        label: agent.name,
        agentId: agent.id,
        status: (statsMap.get(agent.id)?.running ?? 0) > 0 ? "running" : "idle",
        level: agent.level,
      } satisfies AgentNodeData,
    }));

    const agentEdges: Edge[] = initialGraph.connections.map((c) => ({
      id: c.id,
      source: c.sourceAgentId,
      target: c.targetAgentId,
      type: "animated",
      data: { animated: false, connectionType: c.type },
    }));

    // Apply dagre layout if no saved positions
    if (posMap.size === 0) {
      const layouted = getLayoutedElements(agentNodes, agentEdges);
      return [layouted.nodes, layouted.edges];
    }

    return [agentNodes, agentEdges];
  }, [initialGraph.connections, posMap, statsMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // ── State ──
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [filters, setFilters] = useState<Filters>({ teams: [], status: [], liveOnly: false });
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [liveAgentIds, setLiveAgentIds] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SSE for real-time events ──
  useEffect(() => {
    const evtSource = new EventSource(`${apiBase}/api/canvas/events`, { withCredentials: true });

    evtSource.addEventListener("agent:running", (e) => {
      const data = JSON.parse(e.data) as { agentId: string }[];
      const runningIds = new Set(data.map((d) => d.agentId));
      setLiveAgentIds(runningIds);

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            status: runningIds.has(n.id) ? "running" : (n.data as AgentNodeData).status === "running" ? "idle" : (n.data as AgentNodeData).status,
          },
        })),
      );

      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, animated: runningIds.has(e.source) },
        })),
      );
    });

    return () => evtSource.close();
  }, [apiBase, setNodes, setEdges]);

  // ── Save positions on drag end (debounced) ──
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const movedNodes = nodes.map((n) => ({
          agentId: n.id,
          x: n.position.x,
          y: n.position.y,
        }));
        fetch(`${apiBase}/api/canvas/positions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ positions: movedNodes }),
        }).catch(() => {});
      }, 1000);
    },
    [nodes, apiBase],
  );

  // ── Node click → open drawer ──
  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const agent = AGENTS.find((a) => a.id === node.id);
      if (agent) setSelectedAgent(agent);
    },
    [],
  );

  // ── Filtering ──
  const filteredNodeIds = useMemo(() => {
    return new Set(
      AGENTS.filter((a) => {
        if (filters.teams.length > 0 && !filters.teams.includes(a.team)) return false;
        if (filters.liveOnly && !liveAgentIds.has(a.id)) return false;
        // Status filter requires checking node data
        if (filters.status.length > 0) {
          const stat = statsMap.get(a.id);
          const nodeStatus = (stat?.running ?? 0) > 0 ? "running" : "idle";
          if (!filters.status.includes(nodeStatus)) return false;
        }
        return true;
      }).map((a) => a.id),
    );
  }, [filters, liveAgentIds, statsMap]);

  const hasActiveFilters = filters.teams.length > 0 || filters.status.length > 0 || filters.liveOnly;

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: hasActiveFilters && !filteredNodeIds.has(n.id) ? 0.15 : 1,
          transition: "opacity 200ms",
        },
      })),
    [nodes, filteredNodeIds, hasActiveFilters],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        hidden: hasActiveFilters && (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)),
      })),
    [edges, filteredNodeIds, hasActiveFilters],
  );

  // ── Auto layout ──
  const onAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes(layouted.nodes);
    setTimeout(() => reactFlow.fitView({ padding: 0.1 }), 50);
  }, [nodes, edges, setNodes, reactFlow]);

  // ── Command palette agent select ──
  const onPaletteSelectAgent = useCallback(
    (agentId: string) => {
      if (agentId === "__open__") {
        setCmdPaletteOpen(true);
        return;
      }
      const agent = AGENTS.find((a) => a.id === agentId);
      if (agent) {
        setSelectedAgent(agent);
        const node = nodes.find((n) => n.id === agentId);
        if (node) {
          reactFlow.setCenter(node.position.x + 65, node.position.y + 25, { zoom: 1.2, duration: 500 });
        }
      }
    },
    [nodes, reactFlow],
  );

  // ── Connection management ──
  const onAddConnection = useCallback(
    async (sourceId: string, targetId: string) => {
      const res = await fetch(`${apiBase}/api/canvas/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sourceAgentId: sourceId, targetAgentId: targetId }),
      });
      if (res.ok) {
        const conn = await res.json();
        setEdges((eds) => [
          ...eds,
          {
            id: conn.id,
            source: sourceId,
            target: targetId,
            type: "animated",
            data: { animated: false, connectionType: "manual" },
          },
        ]);
      }
    },
    [apiBase, setEdges],
  );

  const onRemoveConnection = useCallback(
    async (connectionId: string) => {
      await fetch(`${apiBase}/api/canvas/connections/${connectionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setEdges((eds) => eds.filter((e) => e.id !== connectionId));
    },
    [apiBase, setEdges],
  );

  // ── Connections for selected agent ──
  const selectedAgentConnections = useMemo(
    () =>
      selectedAgent
        ? initialGraph.connections.filter(
            (c) => c.sourceAgentId === selectedAgent.id || c.targetAgentId === selectedAgent.id,
          )
        : [],
    [selectedAgent, initialGraph.connections],
  );

  return (
    <div className="w-screen h-[calc(100vh-56px)] bg-[#0a0a0a] relative">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#222" />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as AgentNodeData;
            if (data.status === "running") return "#ffd053";
            if (data.status === "completed") return "#22c55e";
            if (data.status === "failed") return "#ef4444";
            return "#2a2a2a";
          }}
          maskColor="rgba(0,0,0,0.7)"
          style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8 }}
        />
      </ReactFlow>

      <Toolbar
        onAutoLayout={onAutoLayout}
        onReplay={() => setIsReplaying(true)}
        isReplaying={isReplaying}
        replaySpeed={replaySpeed}
        onSpeedChange={setReplaySpeed}
        onPauseReplay={() => setIsReplaying(false)}
      />

      <FilterPills filters={filters} onChange={setFilters} hasLiveAgents={liveAgentIds.size > 0} />

      <CommandPalette
        agents={AGENTS}
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onSelectAgent={onPaletteSelectAgent}
      />

      <AgentDrawer
        agent={selectedAgent}
        execStats={selectedAgent ? statsMap.get(selectedAgent.id) ?? null : null}
        connections={selectedAgentConnections}
        allAgents={AGENTS}
        status={selectedAgent && liveAgentIds.has(selectedAgent.id) ? "running" : "idle"}
        onClose={() => setSelectedAgent(null)}
        onAddConnection={onAddConnection}
        onRemoveConnection={onRemoveConnection}
        apiBase={apiBase}
      />
    </div>
  );
}

export function CanvasView(props: CanvasViewProps) {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/admin/canvas/canvas-view.tsx
git commit -m "feat(canvas): add main CanvasView with React Flow, SSE, filtering, dagre layout"
```

---

### Task 11: Canvas Page (Server Component) + Navigation

**Files:**
- Create: `web/app/admin/canvas/page.tsx`
- Modify: `web/app/admin/layout.tsx` (add Canvas nav link)

- [ ] **Step 1: Create the server page component**

Create `web/app/admin/canvas/page.tsx`:

```tsx
import { CanvasView } from "./canvas-view";

export default async function CanvasPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  // Fetch graph data server-side for initial render
  let graphData = { connections: [], positions: [], execStats: [] };
  try {
    const res = await fetch(`${apiBase}/api/canvas/graph`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      graphData = await res.json();
    }
  } catch {
    // Canvas will render with empty graph data (all agents visible, no connections)
  }

  return <CanvasView initialGraph={graphData} apiBase={apiBase} />;
}
```

- [ ] **Step 2: Add Canvas nav link to admin layout**

In `web/app/admin/layout.tsx`, add a new `<a>` tag after the "Agentes" link:

```tsx
              <a
                href="/admin/canvas"
                className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
              >
                Canvas
              </a>
```

- [ ] **Step 3: Override the max-w-7xl layout for canvas page**

The canvas page component already renders full-width (`w-screen`). The parent layout's `<main className="max-w-7xl mx-auto px-6 py-8">` will constrain it. We need to handle this. In `web/app/admin/layout.tsx`, make the main content area conditional or use a CSS approach. The simplest fix: change the `<main>` to not constrain canvas:

Replace:
```tsx
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
```

With:
```tsx
      <main>{children}</main>
```

Then in `web/app/admin/page.tsx`, `web/app/admin/agents/page.tsx`, `web/app/admin/projects/page.tsx`, and all finance pages, wrap content with `<div className="max-w-7xl mx-auto px-6 py-8">`. Actually, a simpler approach — use a dedicated layout for canvas:

Create `web/app/admin/canvas/layout.tsx`:

```tsx
export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

And keep the parent layout's main as-is but add `overflow-hidden` to prevent canvas from overflowing strangely. Actually the cleanest approach: just set the canvas to break out of the container with negative margins.

In the `CanvasView` component, the outer div already uses `w-screen` and absolute positioning which will work. The `max-w-7xl` container will clip it though. Let's solve this in the canvas page with a wrapper:

Update `web/app/admin/canvas/page.tsx` to:

```tsx
import { CanvasView } from "./canvas-view";

export default async function CanvasPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  let graphData = { connections: [], positions: [], execStats: [] };
  try {
    const res = await fetch(`${apiBase}/api/canvas/graph`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      graphData = await res.json();
    }
  } catch {
    // Canvas will render with empty data
  }

  return (
    <div className="-mx-6 -mt-8" style={{ width: "100vw", height: "calc(100vh - 56px)" }}>
      <CanvasView initialGraph={graphData} apiBase={apiBase} />
    </div>
  );
}
```

And update `canvas-view.tsx` outer div to use `w-full h-full` instead of `w-screen h-[calc(100vh-56px)]`:

The outer div in `CanvasContent` should be:
```tsx
<div className="w-full h-full bg-[#0a0a0a] relative">
```

- [ ] **Step 4: Verify frontend compiles**

Run: `cd web && npx next build`
Expected: Build succeeds (or check for type errors with `npx tsc --noEmit`)

- [ ] **Step 5: Commit**

```bash
git add web/app/admin/canvas/page.tsx web/app/admin/canvas/layout.tsx web/app/admin/layout.tsx web/app/admin/canvas/canvas-view.tsx
git commit -m "feat(canvas): add canvas page, nav link, and full-viewport layout"
```

---

### Task 12: Seed Pipeline Connections + .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add .superpowers to gitignore**

Add to `.gitignore`:

```
.superpowers/
```

- [ ] **Step 2: Seed connections via API**

After starting the backend server, run:

```bash
curl -X POST http://localhost:3000/api/canvas/seed-connections \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>"
```

Or test via the frontend by adding a temporary seed button, or call it from a script.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers to gitignore, seed pipeline connections"
```

---

### Task 13: End-to-End Verification

- [ ] **Step 1: Start backend**

Run: `cd /Users/juanpa/Agentes/criteria.agency-2 && npm run dev`

- [ ] **Step 2: Start frontend**

Run: `cd web && npm run dev`

- [ ] **Step 3: Verify canvas loads**

Open `http://localhost:3001/admin/canvas` — should see all 20 agent nodes with dagre layout

- [ ] **Step 4: Verify node click opens drawer**

Click any agent node — drawer should slide in from right with 3 tabs

- [ ] **Step 5: Verify editor tab loads .md file**

Click Editor tab — Monaco editor should show the agent's skill file content

- [ ] **Step 6: Verify filter pills work**

Click "All teams" → select a team → nodes outside that team should fade to opacity 0.15

- [ ] **Step 7: Verify Cmd+K works**

Press Cmd+K → type agent name → select → canvas should center on that node

- [ ] **Step 8: Verify node drag saves position**

Drag a node → refresh page → node should be in the new position

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat(canvas): complete Agent Canvas — nodes, edges, sidepanel, filters, command palette"
```
