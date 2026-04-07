import { db } from "@/lib/db";
import { agentExecutions } from "@/lib/admin-schema";
import { sql } from "drizzle-orm";
import { AGENTS, TEAM_NAMES } from "@/lib/agent-registry";

export default async function AgentsPage() {
  // Aggregate execution stats per agent
  const stats = await db
    .select({
      agentId: agentExecutions.agentId,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${agentExecutions.status} = 'completed')::int`,
      failed: sql<number>`count(*) filter (where ${agentExecutions.status} = 'failed')::int`,
      running: sql<number>`count(*) filter (where ${agentExecutions.status} = 'running')::int`,
    })
    .from(agentExecutions)
    .groupBy(agentExecutions.agentId);

  const statsMap = new Map(stats.map((s) => [s.agentId, s]));

  // Group agents by team
  const teams = new Map<number, typeof AGENTS>();
  for (const agent of AGENTS) {
    const teamAgents = teams.get(agent.team) ?? [];
    teamAgents.push(agent);
    teams.set(agent.team, teamAgents);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Agentes</h1>
      <p className="text-[#9d9a9c] mb-8">
        {AGENTS.length} agentes en {teams.size} equipos
      </p>

      <div className="space-y-8">
        {Array.from(teams.entries())
          .sort(([a], [b]) => a - b)
          .map(([teamId, teamAgents]) => {
            const teamTotal = teamAgents.reduce(
              (sum, a) => sum + (statsMap.get(a.id)?.total ?? 0),
              0,
            );
            return (
              <div key={teamId}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {teamAgents[0].teamName}
                  </h2>
                  {teamTotal > 0 && (
                    <span className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-0.5 rounded">
                      {teamTotal} ejecuciones
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamAgents.map((agent) => {
                    const s = statsMap.get(agent.id);
                    const successRate =
                      s && s.total > 0
                        ? Math.round((s.completed / s.total) * 100)
                        : null;

                    return (
                      <div
                        key={agent.id}
                        className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#ffd053]/20 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {agent.name}
                            </p>
                            <p className="text-xs text-[#666] font-mono">
                              {agent.id}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              agent.level === "top"
                                ? "bg-[#ffd053]/20 text-[#ffd053]"
                                : agent.level === "leader"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : agent.level === "cross_functional"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-[#2a2a2a] text-[#666]"
                            }`}
                          >
                            {agent.level}
                          </span>
                        </div>

                        {/* Steps & Gates */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.steps.map((step) => (
                            <span
                              key={step}
                              className="text-[10px] bg-[#1a1a1a] text-[#9d9a9c] px-1.5 py-0.5 rounded"
                            >
                              {step}
                            </span>
                          ))}
                          {agent.gates.map((gate) => (
                            <span
                              key={gate}
                              className="text-[10px] bg-[#ffd053]/10 text-[#ffd053] px-1.5 py-0.5 rounded uppercase"
                            >
                              {gate}
                            </span>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-[#666]">
                            Autonomia: {agent.autonomy}%
                          </span>
                          {s && s.total > 0 ? (
                            <>
                              <span className="text-[#9d9a9c]">
                                {s.total} runs
                              </span>
                              <span
                                className={
                                  successRate! >= 80
                                    ? "text-green-400"
                                    : successRate! >= 50
                                      ? "text-[#ffd053]"
                                      : "text-red-400"
                                }
                              >
                                {successRate}% ok
                              </span>
                            </>
                          ) : (
                            <span className="text-[#666]">Sin ejecuciones</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
