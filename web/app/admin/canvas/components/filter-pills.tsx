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
