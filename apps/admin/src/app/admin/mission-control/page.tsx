import { cookies } from 'next/headers';
import { KpiCard } from '@/components/ui/kpi-card';
import { MotorHealthCard } from '@/components/ui/motor-health-card';
import { Badge } from '@/components/ui/badge';
import type { ThresholdAlert, MarketingPlan, CampaignBrief, StrategicDiagnosis } from '@/lib/api';

// ── Data fetchers (server-side) ───────────────────────────────────────────────

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

const severityBadge: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MissionControlPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const [alerts, plans, campaigns, diagnoses] = await Promise.all([
    fetchJson<ThresholdAlert[]>(`${api}/api/analyst/alerts?status=open&limit=10`, cookieHeader),
    fetchJson<MarketingPlan[]>(`${api}/api/strategist/plans?status=pending_approval&limit=5`, cookieHeader),
    fetchJson<CampaignBrief[]>(`${api}/api/strategist/campaigns?status=proposed&limit=5`, cookieHeader),
    fetchJson<StrategicDiagnosis[]>(`${api}/api/strategist/diagnoses?status=escalated&limit=5`, cookieHeader),
  ]);

  const openAlerts = alerts ?? [];
  const pendingPlans = plans ?? [];
  const pendingBriefs = campaigns ?? [];
  const escalations = diagnoses ?? [];

  const criticalAlerts = openAlerts.filter((a) => a.severity === 'critical' || a.severity === 'error');

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mission Control</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vista panorámica de la plataforma</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard
          label="Alertas abiertas"
          value={openAlerts.length}
          color={openAlerts.length > 0 ? (criticalAlerts.length > 0 ? 'red' : 'amber') : 'green'}
          subtext={criticalAlerts.length > 0 ? `${criticalAlerts.length} críticas` : 'Sin críticas'}
        />
        <KpiCard
          label="Planes en revisión"
          value={pendingPlans.length}
          color={pendingPlans.length > 0 ? 'amber' : 'default'}
          subtext="Esperan G3"
        />
        <KpiCard
          label="Briefs en revisión"
          value={pendingBriefs.length}
          color={pendingBriefs.length > 0 ? 'amber' : 'default'}
          subtext="Esperan G6"
        />
        <KpiCard
          label="Escalaciones"
          value={escalations.length}
          color={escalations.length > 0 ? 'red' : 'default'}
          subtext="Requieren atención"
        />
        <KpiCard label="Proyectos activos" value="—" subtext="Próximamente" />
        <KpiCard label="Costo AI hoy" value="—" subtext="Langfuse pendiente" />
        <KpiCard label="Revenue este mes" value="—" subtext="Próximamente" />
      </div>

      {/* Motor Health Grid */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Motor Health Grid</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2">
          {/* CREATION */}
          <MotorHealthCard name="Video" category="creation" status="idle" href="/admin/video" icon="🎬" />
          <MotorHealthCard name="Web" category="creation" status="idle" href="/admin/web" icon="🌐" />
          <MotorHealthCard name="Graphic" category="creation" status="soon" icon="🎨" />
          <MotorHealthCard name="Audio" category="creation" status="soon" icon="🎵" />
          <MotorHealthCard name="Events" category="creation" status="soon" icon="📅" />
          <MotorHealthCard name="Print" category="creation" status="soon" icon="🖨️" />
          {/* STRATEGY */}
          <MotorHealthCard name="Brand Builder" category="strategy" status="idle" href="/admin/brand-builder" icon="🏗️" />
          <MotorHealthCard name="Strategist" category="strategy" status={pendingPlans.length > 0 ? 'alert' : 'idle'} href="/admin/strategist" icon="🧠" />
          <MotorHealthCard name="Financial" category="strategy" status="soon" icon="💰" />
          {/* INTELLIGENCE */}
          <MotorHealthCard name="Brand" category="intelligence" status="soon" icon="👂" />
          <MotorHealthCard name="Culture" category="intelligence" status="soon" icon="🌍" />
          <MotorHealthCard name="Industry" category="intelligence" status="soon" icon="📊" />
          {/* DISTRIBUTION */}
          <MotorHealthCard name="Ads" category="distribution" status="soon" icon="📣" />
          <MotorHealthCard name="Community" category="distribution" status="soon" icon="💬" />
          <MotorHealthCard name="Email" category="distribution" status="soon" icon="📧" />
          <MotorHealthCard name="SEO" category="distribution" status="soon" icon="🔍" />
          {/* OPERATION */}
          <MotorHealthCard name="Analytics" category="operation" status="idle" href="/admin/analytics" icon="📈" />
          <MotorHealthCard name="CRM" category="operation" status="soon" icon="🤝" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Alert Feed</h2>
            <a href="/admin/alerts" className="text-xs text-criteria-600 hover:text-criteria-700">
              Ver todas →
            </a>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {openAlerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">Sin alertas abiertas</div>
            ) : (
              openAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3">
                  <Badge variant={severityBadge[alert.severity] ?? 'default'}>
                    {alert.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 truncate">{alert.metric}</p>
                    <p className="text-xs text-gray-500">{alert.alertType}</p>
                  </div>
                  {alert.deviationPct !== null && (
                    <span className="text-xs text-red-600 flex-shrink-0">
                      {alert.deviationPct > 0 ? '+' : ''}{alert.deviationPct.toFixed(0)}%
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Gate Queue */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Gate Review Queue</h2>
            <a href="/admin/gate-review" className="text-xs text-criteria-600 hover:text-criteria-700">
              Revisar →
            </a>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {pendingPlans.length === 0 && pendingBriefs.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">Sin gates pendientes</div>
            ) : (
              <>
                {pendingPlans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm text-gray-800">Plan de Marketing</p>
                      <p className="text-xs text-gray-500">G3 — Aprobación cliente requerida</p>
                    </div>
                    <Badge variant="warning">G3</Badge>
                  </div>
                ))}
                {pendingBriefs.slice(0, 3).map((brief) => (
                  <div key={brief.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm text-gray-800 truncate max-w-[200px]">{brief.name}</p>
                      <p className="text-xs text-gray-500">G6 — Aprobación cliente requerida</p>
                    </div>
                    <Badge variant="warning">G6</Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
