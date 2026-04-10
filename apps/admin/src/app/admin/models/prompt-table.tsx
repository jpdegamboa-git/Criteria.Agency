'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import type { PromptRegistryEntry } from '@/lib/api';

const TIER_VARIANTS: Record<string, 'error' | 'warning' | 'info'> = {
  A: 'error',
  B: 'warning',
  C: 'info',
};

interface EditState {
  id: string;
  systemPrompt: string;
  model: string;
  provider: string;
  dataSensitivity: 'A' | 'B' | 'C';
}

export function PromptTable({ prompts }: { prompts: PromptRegistryEntry[] }) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [rows, setRows] = useState(prompts);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check URL for highlight param
  const [highlighted, setHighlighted] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const h = params.get('highlight');
    if (h) {
      setHighlighted(h);
      // Auto-scroll to element
      setTimeout(() => {
        document.getElementById(`prompt-${h}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, []);

  function startEdit(row: PromptRegistryEntry) {
    setEditing({
      id: row.id,
      systemPrompt: row.systemPrompt,
      model: row.model,
      provider: row.provider,
      dataSensitivity: row.dataSensitivity,
    });
    setSaveError('');
    setSavedId(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditing(null);
    setSaveError('');
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setSaveError('');

    try {
      const res = await fetch(`/api/prompts/${editing.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: editing.systemPrompt,
          model: editing.model,
          provider: editing.provider,
          dataSensitivity: editing.dataSensitivity,
        }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setSaveError(body.error ?? 'Error al guardar');
        return;
      }

      const updated = await res.json() as PromptRegistryEntry;
      // Replace the old row with the updated one (new version)
      setRows((prev) => prev.map((r) => r.id === editing.id ? updated : r));
      setSavedId(updated.id);
      setEditing(null);
    } catch {
      setSaveError('Error de red');
    } finally {
      setSaving(false);
    }
  }

  // Group by agentId
  const grouped = rows.reduce<Record<string, PromptRegistryEntry[]>>((acc, p) => {
    if (!acc[p.agentId]) acc[p.agentId] = [];
    acc[p.agentId].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Editar Prompt</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{editing.id}</p>
              </div>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">System Prompt</label>
                <textarea
                  ref={textareaRef}
                  value={editing.systemPrompt}
                  onChange={(e) => setEditing({ ...editing, systemPrompt: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-criteria-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={editing.model}
                    onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-criteria-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
                  <select
                    value={editing.provider}
                    onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-criteria-500"
                  >
                    <option value="anthropic">anthropic</option>
                    <option value="openai">openai</option>
                    <option value="google">google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tier (DEC-149)
                  </label>
                  <select
                    value={editing.dataSensitivity}
                    onChange={(e) => setEditing({ ...editing, dataSensitivity: e.target.value as 'A' | 'B' | 'C' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-criteria-500"
                  >
                    <option value="A">A — Confidencial</option>
                    <option value="B">B — General</option>
                    <option value="C">C — Público</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  Guardar creará una nueva versión del prompt y desactivará la versión actual.
                  El historial de versiones se preserva.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editing.systemPrompt.trim()}
                className="flex-1 py-2 bg-criteria-600 hover:bg-criteria-700 disabled:bg-criteria-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar nueva versión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table grouped by agentId */}
      {Object.entries(grouped).map(([agentId, agentPrompts]) => (
        <div key={agentId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 font-mono">{agentId}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {agentPrompts.map((row) => {
              const isHighlighted = highlighted === row.id;
              const wasSaved = savedId === row.id;
              return (
                <div
                  id={`prompt-${row.id}`}
                  key={row.id}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                    isHighlighted ? 'bg-criteria-50' : wasSaved ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="w-36 shrink-0">
                    <span className="text-sm font-mono text-gray-700">{row.skillId}</span>
                  </div>

                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <Badge variant={TIER_VARIANTS[row.dataSensitivity] ?? 'info'}>
                      Tier {row.dataSensitivity}
                    </Badge>
                    <span className="text-xs text-gray-400">v{row.version}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate font-mono">
                      {row.systemPrompt.slice(0, 80)}{row.systemPrompt.length > 80 ? '…' : ''}
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 w-40 shrink-0 text-right">
                    {row.model}
                    <span className="text-gray-300 mx-1">·</span>
                    {row.provider}
                  </div>

                  <div className="w-24 text-xs text-gray-400 shrink-0 text-right">
                    {new Date(row.updatedAt).toLocaleDateString('es-MX')}
                  </div>

                  <button
                    onClick={() => startEdit(row)}
                    className="ml-2 text-xs text-criteria-600 hover:text-criteria-700 font-medium shrink-0"
                  >
                    Editar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
