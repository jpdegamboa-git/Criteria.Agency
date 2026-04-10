import { cookies } from 'next/headers';
import type { ThresholdAlert } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

const SEVERITY_VARIANTS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const STATUS_VARIANTS: Record<string, 'error' | 'warning' | 'success' | 'default'> = {
  open: 'error',
  acknowledged: 'warning',
  resolved: 'success',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AlertsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let alerts: ThresholdAlert[] = [];
  try {
    const res = await fetch(`${api}/api/analyst/alerts`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.ok) alerts = await res.json() as ThresholdAlert[];
  } catch {
    // fail silently
  }

  const open = alerts.filter((a) => a.status === 'open');
  const acknowledged = alerts.filter((a) => a.status === 'acknowledged');
  const resolved = alerts.filter((a) => a.status === 'resolved');
  const critical = alerts.filter((a) => a.severity === 'critical' || a.severity === 'error');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Alertas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {open.length} abiertas · {acknowledged.length} reconocidas · {resolved.length} resueltas
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{critical.length}</p>
          <p className="text-xs text-gray-500 mt-1">Críticas/Error</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{open.length}</p>
          <p className="text-xs text-gray-500 mt-1">Abiertas</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{resolved.length}</p>
          <p className="text-xs text-gray-500 mt-1">Resueltas</p>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-500 text-sm">Sin alertas activas</p>
        </div>
      )}

      {/* Alert feed — sorted open first, then acknowledged, then resolved */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {[...open, ...acknowledged, ...resolved].map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-4 ${
                alert.severity === 'critical' ? 'border-red-300' :
                alert.severity === 'error' ? 'border-red-200' :
                alert.severity === 'warning' ? 'border-amber-200' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={SEVERITY_VARIANTS[alert.severity] ?? 'default'}>
                      {alert.severity}
                    </Badge>
                    <Badge variant={STATUS_VARIANTS[alert.status] ?? 'default'}>
                      {alert.status}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">{alert.alertType}</span>
                  </div>
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>Métrica: <span className="font-mono">{alert.metric}</span></span>
                    {alert.deviationPct !== null && (
                      <span>Desviación: {alert.deviationPct > 0 ? '+' : ''}{alert.deviationPct}%</span>
                    )}
                    <span>{formatDate(alert.createdAt)}</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-300 shrink-0">{alert.id.slice(0, 8)}…</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
