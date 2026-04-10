import { cookies } from 'next/headers';
import Link from 'next/link';
import type { BrandDna, BrandDnaArtifact } from '@/lib/api';

const LAYER_LABELS = ['Cimientos', 'Esencia', 'Posicionamiento', 'Sistema de Identidad'];

async function getBrandDna(cookieHeader: string): Promise<{
  brandDna: BrandDna | null;
  artifacts: BrandDnaArtifact[];
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/brand-builder/dna`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return { brandDna: null, artifacts: [] };
    return res.json();
  } catch {
    return { brandDna: null, artifacts: [] };
  }
}

export default async function MiNegocioPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const { brandDna, artifacts } = await getBrandDna(cookieHeader);

  const artifactsByLayer: Record<number, BrandDnaArtifact[]> = {};
  for (const a of artifacts) {
    if (!artifactsByLayer[a.layer]) artifactsByLayer[a.layer] = [];
    artifactsByLayer[a.layer].push(a);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/portal" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Mi Negocio</h1>
      </div>

      {!brandDna ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">ADN de marca no disponible aún.</p>
          <p className="text-sm text-gray-400 mt-1">Completa el proceso de onboarding para construir tu marca.</p>
        </div>
      ) : (
        <>
          {/* Status banner */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">ADN de Marca</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Capa actual: {LAYER_LABELS[brandDna.currentLayer]} (Layer {brandDna.currentLayer})
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress bar — 4 layers */}
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((layer) => (
                  <div
                    key={layer}
                    className={`h-2 w-8 rounded-full ${
                      layer <= brandDna.currentLayer ? 'bg-criteria-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{brandDna.currentLayer + 1}/4</span>
            </div>
          </div>

          {/* Layers */}
          {[0, 1, 2, 3].map((layer) => {
            const layerArtifacts = artifactsByLayer[layer] ?? [];
            const isComplete = layer <= brandDna.currentLayer;
            const isCurrent = layer === brandDna.currentLayer;

            return (
              <div
                key={layer}
                className={`bg-white rounded-xl border mb-3 overflow-hidden ${
                  isCurrent ? 'border-criteria-300' : 'border-gray-200'
                }`}
              >
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isCurrent ? 'bg-criteria-50' : 'bg-white'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isComplete ? 'bg-criteria-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isComplete ? '✓' : layer}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Layer {layer} — {LAYER_LABELS[layer]}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-criteria-100 text-criteria-700 text-xs font-medium rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{layerArtifacts.length} artefactos</span>
                </div>

                {layerArtifacts.length > 0 && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {layerArtifacts.map((artifact) => (
                      <div key={artifact.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          {artifact.artifactType.replace(/_/g, ' ')}
                        </p>
                        <div className="text-sm text-gray-700">
                          {typeof artifact.content === 'object' && artifact.content !== null
                            ? Object.entries(artifact.content)
                                .slice(0, 3)
                                .map(([k, v]) => (
                                  <p key={k} className="truncate">
                                    <span className="text-gray-400">{k}:</span> {String(v)}
                                  </p>
                                ))
                            : String(artifact.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
