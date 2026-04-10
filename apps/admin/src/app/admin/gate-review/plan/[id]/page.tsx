import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { GateApprovalForm } from './approval-form';

interface PlanDetail {
  id: string;
  organizationId: string;
  status: string;
  g1Status: string;
  g1Feedback: string | null;
  g2Status: string;
  g2Feedback: string | null;
  g3Status: string;
  g3Notes: string | null;
  periodStart: string;
  periodEnd: string;
  objectives: unknown[];
  audiences: unknown[];
  valueProposition: Record<string, unknown>;
  mediaPlan: Record<string, unknown>;
  budgetAllocation: Record<string, unknown>;
  createdAt: string;
}

interface PlanResponse {
  plan: PlanDetail;
  campaigns: unknown[];
}

export default async function PlanGatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let data: PlanResponse | null = null;
  try {
    const res = await fetch(`${api}/api/strategist/plans/${id}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) notFound();
    data = await res.json() as PlanResponse;
  } catch {
    notFound();
  }

  const { plan, campaigns } = data!;

  const budget = plan.budgetAllocation as { totalRecommended?: number; currency?: string; rationale?: string };
  const vp = plan.valueProposition as { headline?: string; differentiator?: string };
  const media = plan.mediaPlan as { plannedCampaigns?: number };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/gate-review" className="text-sm text-gray-400 hover:text-gray-600">← Gate Review</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Plan de Marketing</span>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-gray-900">G3 — Aprobación de Plan</h1>
          <Badge variant="warning">Pendiente</Badge>
        </div>
        <p className="text-sm text-gray-500 font-mono">{plan.id}</p>
      </div>

      {/* Gate status row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500 mb-1">G1 — Viabilidad Financiera</p>
          <Badge variant={plan.g1Status === 'passed' ? 'success' : plan.g1Status === 'flagged' ? 'warning' : 'default'}>
            {plan.g1Status}
          </Badge>
          {plan.g1Feedback && <p className="text-xs text-gray-500 mt-1">{plan.g1Feedback}</p>}
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500 mb-1">G2 — Brand Coherence</p>
          <Badge variant={plan.g2Status === 'passed' ? 'success' : plan.g2Status === 'blocked' ? 'error' : 'default'}>
            {plan.g2Status}
          </Badge>
          {plan.g2Feedback && <p className="text-xs text-gray-500 mt-1">{plan.g2Feedback}</p>}
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500 mb-1">G3 — Aprobación Cliente</p>
          <Badge variant={plan.g3Status === 'approved' ? 'success' : plan.g3Status === 'rejected' ? 'error' : 'warning'}>
            {plan.g3Status}
          </Badge>
        </div>
      </div>

      {/* Plan summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Resumen del Plan</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Período</p>
            <p className="text-gray-800">
              {new Date(plan.periodStart).toLocaleDateString('es-MX')} →{' '}
              {new Date(plan.periodEnd).toLocaleDateString('es-MX')}
            </p>
          </div>
          {budget.totalRecommended && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Budget Recomendado</p>
              <p className="text-gray-800 font-medium">
                ${budget.totalRecommended.toLocaleString()} {budget.currency ?? 'USD'}
              </p>
            </div>
          )}
          {vp.headline && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Value Proposition</p>
              <p className="text-gray-800">{vp.headline}</p>
              {vp.differentiator && (
                <p className="text-xs text-gray-500 mt-0.5">Diferenciador: {vp.differentiator}</p>
              )}
            </div>
          )}
        </div>

        {Array.isArray(plan.objectives) && plan.objectives.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Objetivos ({(plan.objectives as unknown[]).length})</p>
            <div className="space-y-1">
              {(plan.objectives as Array<{ type: string; metric: string; target: string; rationale?: string }>).map((obj, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="info">{obj.type}</Badge>
                  <span className="text-gray-700">{obj.metric}: {obj.target}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {media.plannedCampaigns && (
          <p className="text-sm text-gray-600">
            📋 {media.plannedCampaigns} campaña{media.plannedCampaigns !== 1 ? 's' : ''} planificada{media.plannedCampaigns !== 1 ? 's' : ''}
          </p>
        )}

        {budget.rationale && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Justificación presupuesto</p>
            <p className="text-sm text-gray-600">{budget.rationale}</p>
          </div>
        )}
      </div>

      {/* Campaign briefs preview */}
      {Array.isArray(campaigns) && campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Campaign Briefs incluidos ({campaigns.length})
          </h2>
          <div className="space-y-2">
            {(campaigns as Array<{ id: string; name: string; funnelStage: string; channelType: string }>).map((c) => (
              <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <Badge variant="info">{c.funnelStage}</Badge>
                <Badge>{c.channelType}</Badge>
                <span className="text-sm text-gray-700">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval form */}
      {plan.g3Status === 'pending' ? (
        <GateApprovalForm planId={plan.id} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <Badge variant={plan.g3Status === 'approved' ? 'success' : 'error'}>
            {plan.g3Status === 'approved' ? '✓ Plan aprobado' : '✗ Plan rechazado'}
          </Badge>
          {plan.g3Notes && <p className="text-sm text-gray-500 mt-2">{plan.g3Notes}</p>}
        </div>
      )}
    </div>
  );
}
