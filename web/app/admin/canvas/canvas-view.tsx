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

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });
  nodes.forEach((node) => { g.setNode(node.id, { width: 130, height: 50 }); });
  edges.forEach((edge) => { g.setEdge(edge.source, edge.target); });
  dagre.layout(g);
  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return { ...node, position: { x: pos.x - 65, y: pos.y - 25 } };
    }),
    edges,
  };
}

function CanvasContent({ initialGraph, apiBase }: CanvasViewProps) {
  const reactFlow = useReactFlow();
  const statsMap = useMemo(() => new Map(initialGraph.execStats.map((s) => [s.agentId, s])), [initialGraph.execStats]);
  const posMap = useMemo(() => new Map(initialGraph.positions.map((p) => [p.agentId, { x: parseFloat(p.x), y: parseFloat(p.y) }])), [initialGraph.positions]);

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
    if (posMap.size === 0) {
      const layouted = getLayoutedElements(agentNodes, agentEdges);
      return [layouted.nodes, layouted.edges];
    }
    return [agentNodes, agentEdges];
  }, [initialGraph.connections, posMap, statsMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [filters, setFilters] = useState<Filters>({ teams: [], status: [], liveOnly: false });
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [liveAgentIds, setLiveAgentIds] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSE for real-time events
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
        eds.map((e) => ({ ...e, data: { ...e.data, animated: runningIds.has(e.source) } })),
      );
    });
    return () => evtSource.close();
  }, [apiBase, setNodes, setEdges]);

  // Save positions on drag end (debounced)
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const movedNodes = nodes.map((n) => ({ agentId: n.id, x: n.position.x, y: n.position.y }));
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

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    const agent = AGENTS.find((a) => a.id === node.id);
    if (agent) setSelectedAgent(agent);
  }, []);

  // Filtering
  const filteredNodeIds = useMemo(() => {
    return new Set(
      AGENTS.filter((a) => {
        if (filters.teams.length > 0 && !filters.teams.includes(a.team)) return false;
        if (filters.liveOnly && !liveAgentIds.has(a.id)) return false;
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
    () => nodes.map((n) => ({
      ...n,
      style: { ...n.style, opacity: hasActiveFilters && !filteredNodeIds.has(n.id) ? 0.15 : 1, transition: "opacity 200ms" },
    })),
    [nodes, filteredNodeIds, hasActiveFilters],
  );

  const displayEdges = useMemo(
    () => edges.map((e) => ({
      ...e,
      hidden: hasActiveFilters && (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)),
    })),
    [edges, filteredNodeIds, hasActiveFilters],
  );

  const onAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes(layouted.nodes);
    setTimeout(() => reactFlow.fitView({ padding: 0.1 }), 50);
  }, [nodes, edges, setNodes, reactFlow]);

  const onPaletteSelectAgent = useCallback(
    (agentId: string) => {
      if (agentId === "__open__") { setCmdPaletteOpen(true); return; }
      const agent = AGENTS.find((a) => a.id === agentId);
      if (agent) {
        setSelectedAgent(agent);
        const node = nodes.find((n) => n.id === agentId);
        if (node) reactFlow.setCenter(node.position.x + 65, node.position.y + 25, { zoom: 1.2, duration: 500 });
      }
    },
    [nodes, reactFlow],
  );

  const onAddConnection = useCallback(async (sourceId: string, targetId: string) => {
    const res = await fetch(`${apiBase}/api/canvas/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sourceAgentId: sourceId, targetAgentId: targetId }),
    });
    if (res.ok) {
      const conn = await res.json();
      setEdges((eds) => [...eds, { id: conn.id, source: sourceId, target: targetId, type: "animated", data: { animated: false, connectionType: "manual" } }]);
    }
  }, [apiBase, setEdges]);

  const onRemoveConnection = useCallback(async (connectionId: string) => {
    await fetch(`${apiBase}/api/canvas/connections/${connectionId}`, { method: "DELETE", credentials: "include" });
    setEdges((eds) => eds.filter((e) => e.id !== connectionId));
  }, [apiBase, setEdges]);

  const selectedAgentConnections = useMemo(
    () => selectedAgent ? initialGraph.connections.filter((c) => c.sourceAgentId === selectedAgent.id || c.targetAgentId === selectedAgent.id) : [],
    [selectedAgent, initialGraph.connections],
  );

  return (
    <div className="w-full h-full bg-[#0a0a0a] relative">
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
      <Toolbar onAutoLayout={onAutoLayout} onReplay={() => setIsReplaying(true)} isReplaying={isReplaying} replaySpeed={replaySpeed} onSpeedChange={setReplaySpeed} onPauseReplay={() => setIsReplaying(false)} />
      <FilterPills filters={filters} onChange={setFilters} hasLiveAgents={liveAgentIds.size > 0} />
      <CommandPalette agents={AGENTS} open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} onSelectAgent={onPaletteSelectAgent} />
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
