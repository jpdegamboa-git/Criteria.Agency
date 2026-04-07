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

export function AgentInfoTab({ agent, execStats, connections, allAgents, onAddConnection, onRemoveConnection }: AgentInfoTabProps) {
  const [addingConnection, setAddingConnection] = useState(false);
  const incoming = connections.filter((c) => c.targetAgentId === agent.id);
  const outgoing = connections.filter((c) => c.sourceAgentId === agent.id);
  const connectedIds = new Set([...incoming.map((c) => c.sourceAgentId), ...outgoing.map((c) => c.targetAgentId)]);
  const availableTargets = allAgents.filter((a) => a.id !== agent.id && !connectedIds.has(a.id));
  const successRate = execStats && execStats.total > 0 ? Math.round((execStats.completed / execStats.total) * 100) : null;

  return (
    <div className="p-4 space-y-5">
      <div><Label>Team</Label><p className="text-sm text-[#9d9a9c]">{agent.teamName}</p></div>
      <div>
        <Label>Autonomy</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#ffd053] h-full rounded-full" style={{ width: `${agent.autonomy}%` }} />
          </div>
          <span className="text-[11px] text-[#666]">{agent.autonomy}%</span>
        </div>
      </div>
      {agent.steps.length > 0 && (
        <div><Label>Steps</Label>
          <div className="flex flex-wrap gap-1.5">
            {agent.steps.map((step) => (<span key={step} className="text-[10px] bg-[#1a1a1a] text-[#9d9a9c] px-2 py-0.5 rounded">{step}</span>))}
          </div>
        </div>
      )}
      {agent.gates.length > 0 && (
        <div><Label>Gates</Label>
          <div className="flex flex-wrap gap-1.5">
            {agent.gates.map((gate) => (<span key={gate} className="text-[10px] bg-[#ffd053]/10 text-[#ffd053] px-2 py-0.5 rounded uppercase">{gate}</span>))}
          </div>
        </div>
      )}
      {execStats && execStats.total > 0 && (
        <div><Label>Execution Stats</Label>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Total" value={execStats.total} />
            <StatBox label="Success" value={`${successRate}%`} color={successRate! >= 80 ? "#22c55e" : successRate! >= 50 ? "#ffd053" : "#ef4444"} />
            <StatBox label="Avg time" value={execStats.avgDuration ? `${execStats.avgDuration}s` : "—"} />
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Connections</Label>
          <button onClick={() => setAddingConnection(!addingConnection)} className="text-[10px] text-[#ffd053] hover:text-[#ffe088] transition-colors">
            {addingConnection ? "Cancel" : "+ Add"}
          </button>
        </div>
        {addingConnection && (
          <select onChange={(e) => { if (e.target.value) { onAddConnection(agent.id, e.target.value); setAddingConnection(false); } }}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white mb-2 outline-none" defaultValue="">
            <option value="" disabled>Select agent...</option>
            {availableTargets.map((a) => (<option key={a.id} value={a.id}>{a.id} — {a.name}</option>))}
          </select>
        )}
        {incoming.length > 0 && (<div className="mb-2"><span className="text-[10px] text-[#666] uppercase">Incoming</span>
          {incoming.map((c) => (<ConnectionRow key={c.id} agentId={c.sourceAgentId} type={c.type} onRemove={() => onRemoveConnection(c.id)} />))}</div>)}
        {outgoing.length > 0 && (<div><span className="text-[10px] text-[#666] uppercase">Outgoing</span>
          {outgoing.map((c) => (<ConnectionRow key={c.id} agentId={c.targetAgentId} type={c.type} onRemove={() => onRemoveConnection(c.id)} />))}</div>)}
        {incoming.length === 0 && outgoing.length === 0 && !addingConnection && (<p className="text-[11px] text-[#666]">No connections</p>)}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#666] uppercase tracking-wider mb-1">{children}</p>;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (<div className="bg-[#1a1a1a] rounded p-2 text-center">
    <p className="text-xs font-medium" style={{ color: color ?? "#fff" }}>{value}</p>
    <p className="text-[9px] text-[#666]">{label}</p>
  </div>);
}

function ConnectionRow({ agentId, type, onRemove }: { agentId: string; type: string; onRemove: () => void }) {
  return (<div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2">
      <span className="text-xs text-white font-mono">{agentId}</span>
      <span className={`text-[9px] px-1 rounded ${type === "pipeline" ? "text-[#666] bg-[#1a1a1a]" : "text-[#ffd053] bg-[#ffd053]/10"}`}>{type}</span>
    </div>
    {type === "manual" && (<button onClick={onRemove} className="text-[#666] hover:text-red-400 text-xs transition-colors">&times;</button>)}
  </div>);
}
