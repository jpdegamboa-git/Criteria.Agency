"use client";

interface AgentExecutionsTabProps {
  agentId: string;
  execStats: { total: number; completed: number; failed: number; running: number; avgDuration: number } | null;
  apiBase: string;
}

export function AgentExecutionsTab({ agentId, execStats, apiBase }: AgentExecutionsTabProps) {
  const successRate = execStats && execStats.total > 0 ? Math.round((execStats.completed / execStats.total) * 100) : null;

  return (
    <div className="p-4 space-y-4">
      {execStats && execStats.total > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Total" value={execStats.total} />
          <StatCard label="Running" value={execStats.running} color="#ffd053" />
          <StatCard label="Success" value={`${successRate}%`} color={successRate! >= 80 ? "#22c55e" : "#ffd053"} />
          <StatCard label="Failed" value={execStats.failed} color={execStats.failed > 0 ? "#ef4444" : "#666"} />
        </div>
      )}
      {(!execStats || execStats.total === 0) && (
        <div className="text-center py-8 text-[#666] text-sm">No executions yet for this agent</div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (<div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center">
    <p className="text-sm font-medium" style={{ color: color ?? "#fff" }}>{value}</p>
    <p className="text-[9px] text-[#666] mt-0.5">{label}</p>
  </div>);
}
