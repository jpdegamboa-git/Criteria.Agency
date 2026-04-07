"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface PreviewResult {
  found: number;
  new: number;
  duplicates: number;
  preview: Array<{
    date: string;
    description: string;
    amount: number;
  }>;
}

interface ImportResult {
  syncLogId: string;
  found: number;
  new: number;
  duplicates: number;
  entitiesCreated: number;
  categorized: number;
  reconciled: number;
  unmatched: number;
}

export default function ImportPage() {
  const [account, setAccount] = useState("checking");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const text = await file.text();
      const res = await fetch(`${API_URL}/api/transactions/import/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContent: text, accountId: account }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPreview(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en preview");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const text = await file.text();
      const res = await fetch(`${API_URL}/api/transactions/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContent: text, accountId: account }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en importacion");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Importar CSV</h1>
      <p className="text-[#9d9a9c] mb-8">
        Sube un extracto bancario de Banco General (.txt o .csv)
      </p>

      {/* Account selector */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-[#666] mb-3">Cuenta bancaria</h2>
        <div className="flex gap-4">
          {["checking", "savings"].map((a) => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="account"
                value={a}
                checked={account === a}
                onChange={() => setAccount(a)}
                className="accent-[#ffd053]"
              />
              <span className="text-sm text-white capitalize">{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div
          className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#ffd053]/30 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
        >
          <input
            type="file"
            accept=".txt,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <p className="text-[#9d9a9c] mb-2">
              {file ? file.name : "Arrastra un archivo o haz click para seleccionar"}
            </p>
            <p className="text-xs text-[#666]">.txt o .csv de Banco General</p>
          </label>
        </div>

        {file && !preview && !result && (
          <button
            onClick={handlePreview}
            disabled={loading}
            className="mt-4 bg-[#ffd053] text-[#0a0a0a] font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#ffda73] transition-colors disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Vista previa"}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium text-[#666] mb-3">Vista previa</h2>
          <div className="flex gap-6 mb-4">
            <Stat label="Encontradas" value={preview.found} />
            <Stat label="Nuevas" value={preview.new} color="text-green-400" />
            <Stat label="Duplicadas" value={preview.duplicates} color="text-[#ffd053]" />
          </div>

          {preview.preview.length > 0 && (
            <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left text-xs text-[#666] px-3 py-2">Fecha</th>
                    <th className="text-left text-xs text-[#666] px-3 py-2">Descripcion</th>
                    <th className="text-right text-xs text-[#666] px-3 py-2">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-b border-[#2a2a2a] last:border-0">
                      <td className="px-3 py-2 text-xs text-[#9d9a9c]">{row.date}</td>
                      <td className="px-3 py-2 text-xs text-white truncate max-w-[300px]">
                        {row.description}
                      </td>
                      <td className={`px-3 py-2 text-xs font-mono text-right ${
                        row.amount >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {fmt(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleImport}
              disabled={loading || preview.new === 0}
              className="bg-[#ffd053] text-[#0a0a0a] font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#ffda73] transition-colors disabled:opacity-50"
            >
              {loading ? "Importando..." : `Importar ${preview.new} transacciones`}
            </button>
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="bg-[#2a2a2a] text-[#9d9a9c] rounded-lg px-6 py-2.5 text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#141414] border border-green-500/30 rounded-xl p-6">
          <h2 className="text-sm font-medium text-green-400 mb-3">Importacion exitosa</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Nuevas" value={result.new} color="text-green-400" />
            <Stat label="Entidades creadas" value={result.entitiesCreated} />
            <Stat label="Categorizadas" value={result.categorized} />
            <Stat label="Reconciliadas" value={result.reconciled} />
            <Stat label="Sin match" value={result.unmatched} color="text-[#ffd053]" />
            <Stat label="Duplicadas" value={result.duplicates} />
          </div>
          <button
            onClick={() => { setResult(null); setFile(null); }}
            className="mt-4 bg-[#2a2a2a] text-[#9d9a9c] rounded-lg px-6 py-2.5 text-sm hover:text-white transition-colors"
          >
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className="text-xs text-[#666]">{label}</p>
      <p className={`text-lg font-bold ${color ?? "text-white"}`}>{value}</p>
    </div>
  );
}
