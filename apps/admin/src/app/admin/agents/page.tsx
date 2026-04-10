import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import type { PromptRegistryEntry } from '@/lib/api';

const TIER_LABELS: Record<string, string> = {
  A: 'Tier A — Confidencial (Anthropic only)',
  B: 'Tier B — General (OpenAI / Gemini)',
  C: 'Tier C — Público',
};

const TIER_VARIANTS: Record<string, 'error' | 'warning' | 'info'> = {
  A: 'error',
  B: 'warning',
  C: 'info',
};

// Canonical list of agents × skills expected in the platform
const EXPECTED_AGENTS: { agentId: string; skills: string[]; motor: string }[] = [
  { agentId: 'brand-builder', skills: ['layer-0', 'layer-1', 'layer-2', 'layer-3'], motor: 'Brand Builder' },
  { agentId: 'video-motor', skills: ['director', 'scriptwriter', 'qa'], motor: 'Video Motor' },
  { agentId: 'web-motor', skills: ['writer', 'optimizer'], motor: 'Web Motor' },
  { agentId: 'analyst', skills: ['diagnostic', 'threshold'], motor: 'Analyst' },
  { agentId: 'strategist', skills: ['diagnostic', 'planning', 'campaign-design'], motor: 'Strategist' },
  { agentId: 'platform-intelligence', skills: ['benchmark', 'pattern'], motor: 'Platform Intelligence' },
  { agentId: 'brand-guardian', skills: ['evaluate', 'gate'], motor: 'Brand Guardian (transversal)' },
  { agentId: 'creative-director', skills: ['brief', 'direction'], motor: 'Creative Director (transversal)' },
  { agentId: 'showrunner', skills: ['orchestrate'], motor: 'Showrunner (transversal)' },
];

export default async function AgentDashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let prompts: PromptRegistryEntry[] = [];
  try {
    const res = await fetch(`${api}/api/prompts`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.ok) prompts = await res.json() as PromptRegistryEntry[];
  } catch {
    // fail silently — show empty state
  }

  // Index prompts by agentId + skillId
  const promptMap = new Map(prompts.map((p) => [`${p.agentId}:${p.skillId}`, p]));

  const configured = prompts.length;
  const total = EXPECTED_AGENTS.reduce((acc, a) => acc + a.skills.length, 0);
  const tierA = prompts.filter((p) => p.dataSensitivity === 'A').length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {configured} de {total} skills configurados — {tierA} Tier A
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{configured}</p>
          <p className="text-xs text-gray-500 mt-1">Skills configurados</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{tierA}</p>
          <p className="text-xs text-gray-500 mt-1">Tier A (confidencial)</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {prompts.filter((p) => p.dataSensitivity === 'B').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Tier B (general)</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {prompts.filter((p) => p.dataSensitivity === 'C').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Tier C (público)</p>
        </div>
      </div>

      {/* Agent groups */}
      <div className="space-y-4">
        {EXPECTED_AGENTS.map((agent) => {
          const agentPrompts = agent.skills.map((skill) => ({
            skill,
            prompt: promptMap.get(`${agent.agentId}:${skill}`),
          }));
          const configuredCount = agentPrompts.filter((a) => a.prompt).length;

          return (
            <div key={agent.agentId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{agent.motor}</h2>
                  <p className="text-xs text-gray-400 font-mono">{agent.agentId}</p>
                </div>
                <Badge variant={configuredCount === agent.skills.length ? 'success' : configuredCount === 0 ? 'error' : 'warning'}>
                  {configuredCount}/{agent.skills.length} skills
                </Badge>
              </div>

              <div className="divide-y divide-gray-100">
                {agentPrompts.map(({ skill, prompt }) => (
                  <div key={skill} className="flex items-center gap-3 py-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300" style={prompt ? { backgroundColor: '#16a34a' } : {}} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-700">{skill}</span>
                        {prompt ? (
                          <>
                            <Badge variant={TIER_VARIANTS[prompt.dataSensitivity] ?? 'info'}>
                              Tier {prompt.dataSensitivity}
                            </Badge>
                            <span className="text-xs text-gray-400">v{prompt.version}</span>
                          </>
                        ) : (
                          <Badge variant="error">no configurado</Badge>
                        )}
                      </div>
                      {prompt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {prompt.model} · {prompt.provider} · actualizado {new Date(prompt.updatedAt).toLocaleDateString('es-MX')}
                        </p>
                      )}
                    </div>
                    {prompt && (
                      <a
                        href={`/admin/models?highlight=${prompt.id}`}
                        className="text-xs text-criteria-600 hover:text-criteria-700 shrink-0"
                      >
                        Editar →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier legend */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Reglas de Tier (DEC-149)</p>
        <div className="space-y-1">
          {Object.entries(TIER_LABELS).map(([tier, label]) => (
            <div key={tier} className="flex items-center gap-2">
              <Badge variant={TIER_VARIANTS[tier] ?? 'info'}>Tier {tier}</Badge>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Sin fallback automático entre tiers. Si Tier A falla, los agentes se pausan.
        </p>
      </div>
    </div>
  );
}
