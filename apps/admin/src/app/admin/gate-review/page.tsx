import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import type { MarketingPlan, CampaignBrief } from '@/lib/api';

async function fetchJson<T>(url: string, cookieHeader: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { cookie: cookieHeader, 'Content-Type': 'application/json' },
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

export default async function GateReviewPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const [plans, briefs] = await Promise.all([
    fetchJson<MarketingPlan[]>(`${api}/api/strategist/plans?status=pending_approval`, cookieHeader),
    fetchJson<CampaignBrief[]>(`${api}/api/strategist/campaigns?status=proposed`, cookieHeader),
  ]);

  const pendingPlans = plans ?? [];
  const pendingBriefs = briefs ?? [];
  const total = pendingPlans.length + pendingBriefs.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gate Review</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total === 0 ? 'Sin gates pendientes' : `${total} gate${total !== 1 ? 's' : ''} esperando revisión`}
          </p>
        </div>
      </div>

      {total === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-500 text-sm">No hay gates pendientes de revisión</p>
        </div>
      )}

      {/* G3 — Marketing Plans */}
      {pendingPlans.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            G3 — Aprobación de Planes de Marketing ({pendingPlans.length})
          </h2>
          <div className="space-y-3">
            {pendingPlans.map((plan) => (
              <GatePlanCard key={plan.id} plan={plan} apiBase={api} cookieHeader={cookieHeader} />
            ))}
          </div>
        </section>
      )}

      {/* G6 — Campaign Briefs */}
      {pendingBriefs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            G6 — Aprobación de Campaign Briefs ({pendingBriefs.length})
          </h2>
          <div className="space-y-3">
            {pendingBriefs.map((brief) => (
              <GateBriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GatePlanCard({ plan, apiBase: _apiBase, cookieHeader: _cookieHeader }: { plan: MarketingPlan; apiBase: string; cookieHeader: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning">G3</Badge>
            <span className="text-sm font-medium text-gray-900">Plan de Marketing</span>
          </div>
          <p className="text-xs text-gray-500">
            Período: {formatDate(plan.periodStart)} → {formatDate(plan.periodEnd)}
          </p>
          <p className="text-xs text-gray-400">Creado: {formatDate(plan.createdAt)}</p>
        </div>
        <span className="text-xs font-mono text-gray-300">{plan.id.slice(0, 8)}…</span>
      </div>

      {/* 3+3 dot indicator */}
      <div className="flex items-center gap-1 mb-4">
        <span className="text-xs text-gray-400 mr-1">3+3:</span>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className={`w-3 h-3 rounded-full ${n <= 3 ? 'bg-green-300' : 'bg-amber-300'}`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={`/admin/gate-review/plan/${plan.id}`}
          className="flex-1 text-center py-2 px-3 bg-criteria-600 hover:bg-criteria-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Revisar Plan
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        La aprobación/rechazo se realiza desde la vista de detalle
      </p>
    </div>
  );
}

function GateBriefCard({ brief }: { brief: CampaignBrief }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning">G6</Badge>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[280px]">{brief.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="info">{brief.funnelStage}</Badge>
            <Badge>{brief.channelType}</Badge>
            {brief.g4Passed && <Badge variant="success">G4 ✓</Badge>}
          </div>
          <p className="text-xs text-gray-400 mt-1">Creado: {formatDate(brief.createdAt)}</p>
        </div>
        <span className="text-xs font-mono text-gray-300">{brief.id.slice(0, 8)}…</span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`/admin/gate-review/brief/${brief.id}`}
          className="flex-1 text-center py-2 px-3 bg-criteria-600 hover:bg-criteria-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Revisar Brief
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        La aprobación/rechazo se realiza desde la vista de detalle
      </p>
    </div>
  );
}
