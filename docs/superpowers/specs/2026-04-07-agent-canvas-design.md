# Agent Canvas — Design Spec

## Overview

Visual node-based canvas for the admin dashboard that displays all 20 agents as interactive nodes with animated connections, real-time execution flow, and inline editing. Replaces the current agents list page with an immersive "Mission Control" experience.

**Reference:** weavy.ai-style interactive node canvas.

## Stack

- **React Flow** — canvas engine (nodes, edges, zoom, pan, drag, minimap)
- **Monaco Editor** — embedded markdown editor for skill files
- **SSE** — real-time execution events from backend
- **Next.js 16 / React 19 / Tailwind v4** — existing frontend stack
- **Hono API** — existing backend, extended with new endpoints
- **Drizzle ORM** — existing DB layer, extended with new tables

## Architecture

### File Structure

```
/web/app/admin/canvas/
  page.tsx                    — Server component, fetches agents + connections + positions + stats
  canvas-view.tsx             — Client component, React Flow provider + canvas + event subscriptions
  components/
    agent-node.tsx            — Custom React Flow node (minimal: name + status color)
    animated-edge.tsx         — Custom edge with SVG particle animation
    toolbar.tsx               — Vertical left toolbar (zoom, fit, layout, replay controls)
    filter-pills.tsx          — Floating filter pills (top-right corner)
    command-palette.tsx       — Cmd+K modal for search/filter
    minimap.tsx               — React Flow minimap wrapper
  sidepanel/
    agent-drawer.tsx          — Slide-in drawer container (420px, right side)
    agent-info.tsx            — Tab 1: config, stats, connections editor
    agent-editor.tsx          — Tab 2: Monaco editor for .md skill file
    agent-executions.tsx      — Tab 3: execution history and logs
```

### Data Flow

1. `page.tsx` fetches from `/api/canvas/graph` — returns agents, connections, positions, aggregated stats
2. Passes as props to `canvas-view.tsx` which converts to React Flow nodes/edges
3. `canvas-view.tsx` opens SSE connection to `/api/canvas/events` for real-time updates
4. Sidepanel does lazy fetch of `.md` file content and detailed executions when opened

## Components

### Agent Node

- Box `#141414`, rounded corners, ~120x44px
- Border color by status: `#2a2a2a` idle, `#ffd053` running, `#22c55e` done, `#ef4444` error
- Subtle glow (`box-shadow`) when running
- Content: agent short name + id abbreviation in gray
- Connection handles (top/bottom), invisible until hover
- Click opens sidepanel. Drag moves node.

### Layout

- Dagre layout (top-to-bottom) based on hierarchy: leadership top, leaders middle, subs bottom
- Team clusters rendered as dashed-border zones with team name label
- User can drag nodes manually; positions persist to DB

### Animated Edge

- Bezier curve SVG between nodes
- Edge color inherits from source node (team color or status)
- Active execution: particle (small circle) traveling along path via `<animateMotion>`
- No execution: static line at low opacity
- Pipeline-derived edges are solid; manual edges are dashed

### Toolbar (Vertical, Left Side)

- Zoom in/out, fit view, auto-layout reset
- Replay controls: project selector, play/pause, speed (1x/2x/4x)
- Scrubber timeline at bottom of canvas during replay

### Filter Pills (Floating, Top-Right)

- Default pills: "All teams" (dropdown with checkboxes), "Status" (idle/running/done/error), "Live" (toggle)
- Filtered-out nodes drop to opacity 0.15, edges hidden
- Nodes maintain position — no layout shift
- Active pill has `#ffd053` border
- Filter state persisted in URL search params

### Command Palette (Cmd+K)

- Centered modal with search input
- Searches: agent name, id, team, step, gate, model
- Enter/click selects agent — centers canvas on node + opens sidepanel
- Prefix filters: `team:` `step:` `gate:` `status:`
- Escape closes

## Sidepanel (Agent Drawer)

- 420px wide, slides in from right with animation
- Canvas remains interactive behind (no blocking overlay)
- Close: X button, click outside, or Escape
- Fixed header: agent name, id, level badge (top/leader/sub/cross_functional), status indicator

### Tab 1 — Info

- Team, level, autonomy (visual bar)
- Steps and gates as pills
- Connections list (incoming/outgoing) with add/remove buttons
- Model selector (dropdown)
- Configurable parameters (temperature, max tokens, etc.)

### Tab 2 — Editor

- Monaco Editor with markdown syntax highlighting
- Loads skill file content (e.g., `agents/T1-L_creative_director.md`)
- Save button writes to filesystem via API
- Unsaved changes indicator (dot on tab)

### Tab 3 — Executions

- Recent executions list (timestamp, project, status, duration)
- Click to expand: input/output/logs
- Aggregated stats at top: total runs, success rate, avg duration

## Real-Time and Replay

### Real-Time (Active Execution)

- Backend SSE endpoint: `/api/canvas/events`
- Events: `agent:started`, `agent:completed`, `agent:failed`, `agent:output`
- Canvas subscribes on mount, updates node states and activates edge particle animations
- "Live" green pill indicator when a project is actively executing

### Replay (Completed Project)

- Project selector in toolbar or command palette
- Loads agent_executions ordered by timestamp
- Play/pause/speed controls in toolbar
- Nodes change state progressively following timeline
- Particles activate on edges during transitions
- Optional scrubber timeline at canvas bottom

### Fallback (No Data)

- All agents shown in idle state with static edges
- Still useful as organizational map

## Database

### New Tables

```sql
agent_connections
  id          serial PRIMARY KEY
  source_agent_id  text NOT NULL  -- e.g., "T1-L"
  target_agent_id  text NOT NULL  -- e.g., "T3-L"
  type        text NOT NULL DEFAULT 'pipeline'  -- 'pipeline' | 'manual'
  created_at  timestamp DEFAULT now()
  updated_at  timestamp DEFAULT now()
  UNIQUE(source_agent_id, target_agent_id)

agent_node_positions
  id          serial PRIMARY KEY
  agent_id    text NOT NULL UNIQUE
  x           real NOT NULL DEFAULT 0
  y           real NOT NULL DEFAULT 0
  updated_at  timestamp DEFAULT now()
```

### Pipeline Connection Seed

Script parses agent steps from the registry and generates connections based on pipeline order:

```
brief → concept → script → visual_look → storyboard → video_gen → audio → edit → polish → delivery
```

Agents sharing adjacent steps get a `type: 'pipeline'` connection. Gates create connections to gate-reviewing agents (XF-001 Cinematographic Critic).

## API Endpoints

```
GET  /api/canvas/graph              — agents + connections + positions + aggregated stats
PUT  /api/canvas/positions          — batch update positions (on node drop)
POST /api/canvas/connections        — create manual connection
DEL  /api/canvas/connections/:id    — delete connection
GET  /api/canvas/events             — SSE stream of execution events
GET  /api/canvas/replay/:projectId  — project executions ordered by time
GET  /api/agents/:id/file           — skill file .md content
PUT  /api/agents/:id/file           — save skill file .md changes
```

## Design System

Follows existing admin theme:
- Background: `#0a0a0a` (canvas), `#141414` (nodes), `#0f0f0f` (panels)
- Borders: `#2a2a2a`
- Accent: `#ffd053` (gold)
- Text: `#fff` primary, `#9d9a9c` secondary, `#666` muted
- Status colors: `#22c55e` success, `#ef4444` error, `#3b82f6` info/team
- Font: system font stack, monospace for ids and code

## Navigation

- New nav item "Canvas" in the admin header, added after "Agentes" (the existing agents list page remains as a simpler alternative view)
- The canvas uses a full-viewport immersive layout — breaks out of the `max-w-7xl` container
- Keeps the top nav bar for navigation consistency

## Dependencies (New)

```
@xyflow/react          — React Flow v12 (canvas engine)
@monaco-editor/react   — Monaco editor React wrapper
dagre                  — graph layout algorithm
```
