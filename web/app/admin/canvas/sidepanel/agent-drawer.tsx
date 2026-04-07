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
  agent, execStats, connections, allAgents, status, onClose, onAddConnection, onRemoveConnection, apiBase,
}: AgentDrawerProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Info");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => { setActiveTab("Info"); setHasUnsavedChanges(false); }, [agent?.id]);

  if (!agent) return null;
  const badge = LEVEL_BADGES[agent.level] ?? LEVEL_BADGES.sub;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-[420px] bg-[#0f0f0f] border-l border-[#2a2a2a] z-40 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: status === "running" ? "#ffd053" : status === "completed" ? "#22c55e" : status === "failed" ? "#ef4444" : "#2a2a2a",
          }} />
          <div>
            <h3 className="text-white text-sm font-medium">{agent.name}</h3>
            <span className="text-[#666] text-[10px] font-mono">{agent.id}</span>
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>{agent.level}</span>
        </div>
        <button onClick={onClose} className="text-[#666] hover:text-white text-lg transition-colors">&times;</button>
      </div>
      <div className="flex border-b border-[#2a2a2a]">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab ? "text-[#ffd053] border-b-2 border-[#ffd053]" : "text-[#666] hover:text-[#999]"
            }`}>
            {tab}
            {tab === "Editor" && hasUnsavedChanges && (
              <span className="absolute top-1.5 right-[calc(50%-16px)] w-1.5 h-1.5 rounded-full bg-[#ffd053]" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "Info" && <AgentInfoTab agent={agent} execStats={execStats} connections={connections} allAgents={allAgents} onAddConnection={onAddConnection} onRemoveConnection={onRemoveConnection} />}
        {activeTab === "Editor" && <AgentEditorTab agentId={agent.id} apiBase={apiBase} onDirtyChange={setHasUnsavedChanges} />}
        {activeTab === "Executions" && <AgentExecutionsTab agentId={agent.id} execStats={execStats} apiBase={apiBase} />}
      </div>
    </div>
  );
}
