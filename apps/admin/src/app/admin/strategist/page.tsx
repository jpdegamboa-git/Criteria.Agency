import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import type { MarketingPlan, CampaignBrief, StrategicDiagnosis } from '@/lib/api';

async function fetchJson<T>(url: string, cookieHeader: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PLAN_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending_approval: 'warning',
  draft: 'default',
  rejected: 'error',
};

const G6_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

export default async function StrategistPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const [diagnoses, plans, campaigns] = await Promise.all([
    fetchJson<StrategicDiagnosis[]>(`${api}/api/strategist/diagnoses`, cookieHeader),
    fetchJson<MarketingPlan[]>(`${api}/api/strategist/plans`, cookieHeader),
    fetchJson<CampaignBrief[]>(`${api}/api/strategist/campaigns`, cookieHeader),
  ]);

  const d = diagnoses ?? [];
  const p = plans ?? [];
  const c = campaigns ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Strategist</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {d.length} diagnósticos · {p.length} planes · {c.length} campaigns
        </p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{d.length}</p>
          <p className="text-xs text-gray-500 mt-1">Diagnósticos</p>
          <p className="text-xs text-green-600 mt-0.5">
            {d.filter((x) => x.status === 'completed').length} completados
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{p.length}</p>
          <p className="text-xs text-gray-500 mt-1">Planes de Marketing</p>
          <p className="text-xs text-amber-600 mt-0.5">
            {p.filter((x) => x.g3Status === 'pending').length} pendientes G3
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{c.length}</p>
          <p className="text-xs text-gray-500 mt-1">Campaign Briefs</p>
          <p className="text-xs text-amber-600 mt-0.5">
            {c.filter((x) => x.g6Status === 'pending').length} pendientes G6
          </p>
        </div>
      </div>

      {/* Diagnoses */}
      {d.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Diagnósticos Estratégicos</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {d.map((diag) => (
                <div key={diag.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={diag.status === 'completed' ? 'success' : diag.status === 'failed' ? 'error' : 'warning'}>
                        {diag.status}
                      </Badge>
                      <span className="text-xs text-gray-400 font-mono">{diag.triggeredBy}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(diag.createdAt)}</p>
                  </div>
                  <span className="text-xs text-gray-300 font-mono">{diag.iterationCount} iter</span>
                  <span className="text-xs text-gray-300 font-mono">{diag.id.slice(0, 8)}…</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Plans */}
      {p.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Planes de Marketing</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {p.map((plan) => (
                <div key={plan.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={PLAN_STATUS_VARIANT[plan.status] ?? 'default'}>
                        {plan.status}
                      </Badge>
                      <Badge variant={G6_VARIANT[plan.g3Status] ?? 'default'}>
                        G3: {plan.g3Status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(plan.periodStart)} → {formatDate(plan.periodEnd)} · creado {formatDate(plan.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-300 font-mono shrink-0">{plan.id.slice(0, 8)}…</span>
                  {plan.g3Status === 'pending' && (
                    <a
                      href={`/admin/gate-review/plan/${plan.id}`}
                      className="text-xs text-criteria-600 hover:text-criteria-700 font-medium shrink-0"
                    >
                      Revisar →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Campaigns */}
      {c.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Campaign Briefs</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {c.map((brief) => (
                <div key={brief.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-gray-800 truncate">{brief.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{brief.funnelStage}</Badge>
                      <Badge>{brief.channelType}</Badge>
                      {brief.g4Passed && <Badge variant="success">G4 ✓</Badge>}
                      <Badge variant={G6_VARIANT[brief.g6Status] ?? 'default'}>
                        G6: {brief.g6Status}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 font-mono shrink-0">{brief.id.slice(0, 8)}…</span>
                  {brief.g6Status === 'pending' && (
                    <a
                      href={`/admin/gate-review/brief/${brief.id}`}
                      className="text-xs text-criteria-600 hover:text-criteria-700 font-medium shrink-0"
                    >
                      Revisar →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {d.length === 0 && p.length === 0 && c.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No hay datos del Strategist aún.</p>
          <p className="text-xs text-gray-400 mt-1">Ejecuta un diagnóstico para comenzar.</p>
        </div>
      )}
    </div>
  );
}
