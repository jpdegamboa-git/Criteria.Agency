import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BriefApprovalForm } from './approval-form';

interface BriefDetail {
  id: string;
  organizationId: string;
  name: string;
  concept: string;
  funnelStage: string;
  channelType: string;
  status: string;
  g4Passed: boolean;
  g6Status: string;
  g6Notes: string | null;
  objective: Record<string, unknown>;
  audiences: unknown[];
  channels: unknown[];
  budget: Record<string, unknown>;
  calendar: Record<string, unknown>;
  expectedKpis: Record<string, string>;
  justification: string;
  confidenceSource: string;
  creativeSuggestion: Record<string, unknown>;
  createdAt: string;
}

export default async function BriefGatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let brief: BriefDetail | null = null;
  try {
    const res = await fetch(`${api}/api/strategist/campaigns/${id}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) notFound();
    brief = await res.json() as BriefDetail;
  } catch {
    notFound();
  }

  const b = brief!;
  const budget = b.budget as { suggested?: number; min?: number; max?: number; currency?: string; rationale?: string };
  const cal = b.calendar as { startDate?: string; durationDays?: number };
  const cs = b.creativeSuggestion as { numberOfVersions?: number; angles?: string[]; formats?: string[]; toneGuidance?: string; requiresVideo?: boolean };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/gate-review" className="text-sm text-gray-400 hover:text-gray-600">← Gate Review</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Campaign Brief</span>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-gray-900 truncate">{b.name}</h1>
          <Badge variant="warning">G6</Badge>
        </div>
        <p className="text-sm text-gray-500 font-mono">{b.id}</p>
      </div>

      {/* Gate status row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500 mb-1">G4 — Self-evaluation (Strategist)</p>
          <Badge variant={b.g4Passed ? 'success' : 'error'}>{b.g4Passed ? 'PASSED' : 'FAILED'}</Badge>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs text-gray-500 mb-1">G6 — Aprobación cliente</p>
          <Badge variant={b.g6Status === 'approved' ? 'success' : b.g6Status === 'rejected' ? 'error' : 'warning'}>
            {b.g6Status}
          </Badge>
        </div>
      </div>

      {/* Brief detail */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Detalle del Brief</h2>

        <div className="space-y-1">
          <p className="text-xs text-gray-400">Concepto</p>
          <p className="text-sm text-gray-800">{b.concept}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-1">Objetivo</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="info">{b.funnelStage}</Badge>
              <Badge>{b.channelType}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Confianza</p>
            <Badge variant={b.confidenceSource === 'history' ? 'success' : 'info'}>{b.confidenceSource}</Badge>
          </div>
          {budget.suggested && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Budget</p>
              <p className="text-gray-800 font-medium">${budget.suggested.toLocaleString()} {budget.currency ?? 'USD'}</p>
              <p className="text-xs text-gray-400">(${budget.min?.toLocaleString()} — ${budget.max?.toLocaleString()})</p>
            </div>
          )}
          {cal.startDate && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Calendario</p>
              <p className="text-gray-800">{cal.startDate}</p>
              {cal.durationDays && <p className="text-xs text-gray-400">{cal.durationDays} días</p>}
            </div>
          )}
        </div>

        {Object.keys(b.expectedKpis).length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">KPIs esperados</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(b.expectedKpis).map(([k, v]) => (
                <div key={k} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1">
                  <span className="text-gray-500">{k}:</span>{' '}
                  <span className="text-gray-800 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 mb-1">Justificación</p>
          <p className="text-sm text-gray-600">{b.justification}</p>
        </div>

        {/* Creative direction */}
        {cs && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Dirección creativa</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {cs.numberOfVersions && (
                <div>
                  <p className="text-xs text-gray-400">Versiones</p>
                  <p className="text-gray-800">{cs.numberOfVersions}</p>
                </div>
              )}
              {cs.toneGuidance && (
                <div>
                  <p className="text-xs text-gray-400">Tono</p>
                  <p className="text-gray-800">{cs.toneGuidance}</p>
                </div>
              )}
              {cs.angles && cs.angles.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400">Ángulos</p>
                  <p className="text-gray-800">{cs.angles.join(', ')}</p>
                </div>
              )}
              {cs.formats && cs.formats.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400">Formatos</p>
                  <p className="text-gray-800">{cs.formats.join(', ')}</p>
                </div>
              )}
            </div>
            {cs.requiresVideo && (
              <div className="mt-2 flex items-center gap-1 text-criteria-600">
                <span>🎬</span>
                <span className="text-xs font-medium">Requiere Video Motor</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval form */}
      {b.g6Status === 'pending' ? (
        <BriefApprovalForm briefId={b.id} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <Badge variant={b.g6Status === 'approved' ? 'success' : 'error'}>
            {b.g6Status === 'approved' ? '✓ Brief aprobado' : '✗ Brief rechazado'}
          </Badge>
          {b.g6Notes && <p className="text-sm text-gray-500 mt-2">{b.g6Notes}</p>}
        </div>
      )}
    </div>
  );
}
