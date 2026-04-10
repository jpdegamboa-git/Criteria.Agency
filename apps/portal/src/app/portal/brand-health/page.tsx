import { cookies } from 'next/headers';
import Link from 'next/link';
import type { BrandHealthScore } from '@/lib/api';

async function getBhsHistory(cookieHeader: string): Promise<BrandHealthScore[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/analyst/bhs/history`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function ScoreBar({ value, label, color }: { value: number | null; label: string; color: string }) {
  const v = value ?? 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{v}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export default async function BrandHealthPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const history = await getBhsHistory(cookieHeader);
  const latest = history[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/portal" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Salud de Marca</h1>
      </div>

      {!latest ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No hay datos de Salud de Marca aún.</p>
          <p className="text-sm text-gray-400 mt-1">Completa el perfil de tu marca para ver el score.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total score */}
          <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 mb-2">Score total</p>
            <div
              className={`text-5xl font-bold ${
                latest.totalScore >= 70 ? 'text-green-600' :
                latest.totalScore >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {latest.totalScore}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(latest.calculatedAt).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* 3-axis breakdown */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Desglose por eje</h3>
            <ScoreBar value={latest.fundamentos} label="Fundamentos" color="bg-criteria-500" />
            <ScoreBar value={latest.ejecucion} label="Ejecución" color="bg-purple-500" />
            <ScoreBar value={latest.oportunidad} label="Oportunidad" color="bg-green-500" />
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Historial (últimos {Math.min(history.length, 10)} días)</h3>
          <div className="space-y-2">
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(h.calculatedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">F: {h.fundamentos ?? '–'}</span>
                  <span className="text-gray-600">E: {h.ejecucion ?? '–'}</span>
                  <span className="text-gray-600">O: {h.oportunidad ?? '–'}</span>
                  <span className="font-semibold text-gray-900">{h.totalScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
