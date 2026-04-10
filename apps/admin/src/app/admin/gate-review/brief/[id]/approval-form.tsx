'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BriefApprovalForm({ briefId }: { briefId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  async function handleAction(action: 'approve' | 'reject') {
    setError('');
    setLoading(action);

    try {
      const res = await fetch(`/api/strategist/campaigns/${briefId}/${action}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'}`);
      } else {
        router.push('/admin/gate-review');
        router.refresh();
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Decisión G6</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-criteria-500"
          placeholder="Feedback para el Strategist..."
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium text-sm rounded-lg transition-colors"
        >
          {loading === 'approve' ? 'Aprobando...' : '✓ Aprobar Brief'}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-sm rounded-lg transition-colors"
        >
          {loading === 'reject' ? 'Rechazando...' : '✗ Rechazar Brief'}
        </button>
      </div>
    </div>
  );
}
