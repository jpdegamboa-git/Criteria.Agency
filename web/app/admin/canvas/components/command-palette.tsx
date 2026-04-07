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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onSelectAgent("__open__");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onSelectAgent]);

  const results = useMemo(() => {
    if (!query.trim()) return agents;
    const q = query.toLowerCase();
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
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.teamName.toLowerCase().includes(q) ||
        a.steps.some((s) => s.includes(q)) ||
        a.gates.some((g) => g.includes(q)),
    );
  }, [query, agents]);

  useEffect(() => { setSelectedIndex(0); }, [results]);

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
          <span className="text-[#666] text-sm">⌘K</span>
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
              onClick={() => { onSelectAgent(agent.id); onClose(); }}
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
