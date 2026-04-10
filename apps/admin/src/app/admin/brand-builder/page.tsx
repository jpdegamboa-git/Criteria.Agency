import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';

interface BrandDna {
  id: string;
  organizationId: string;
  currentLayer: number;
  onboardingPath: string | null;
  status: string;
  fundamentos_score: number;
  createdAt: string;
  updatedAt: string;
}

interface BrandArtifact {
  id: string;
  layer: number;
  artifactType: string;
  status: string;
  createdAt: string;
}

const LAYER_LABELS: Record<number, string> = {
  0: 'Layer 0 — Onboarding',
  1: 'Layer 1 — Fundamentos',
  2: 'Layer 2 — Profundidad Estratégica',
  3: 'Layer 3 — Identity Systems',
};

const LAYER_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-criteria-100 text-criteria-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function BrandBuilderPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let dna: BrandDna | null = null;
  let artifacts: BrandArtifact[] = [];

  try {
    const [dnaRes, artRes] = await Promise.all([
      fetch(`${api}/api/brand-builder`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
      fetch(`${api}/api/brand-builder/artifacts`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
    ]);
    if (dnaRes.ok) dna = await dnaRes.json() as BrandDna;
    if (artRes.ok) artifacts = await artRes.json() as BrandArtifact[];
  } catch {
    // fail silently
  }

  // Group artifacts by layer
  const byLayer = artifacts.reduce<Record<number, BrandArtifact[]>>((acc, a) => {
    if (!acc[a.layer]) acc[a.layer] = [];
    acc[a.layer].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Brand Builder</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Estado del Brand DNA y progreso de layers
        </p>
      </div>

      {!dna ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Sin Brand DNA para esta organización.</p>
          <p className="text-xs text-gray-400 mt-1">Inicia el onboarding para comenzar.</p>
        </div>
      ) : (
        <>
          {/* DNA Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Brand DNA</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{dna.id}</p>
              </div>
              <Badge variant={dna.status === 'active' ? 'success' : dna.status === 'onboarding' ? 'warning' : 'default'}>
                {dna.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Layer actual</p>
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${LAYER_COLORS[dna.currentLayer] ?? 'bg-gray-100 text-gray-700'}`}>
                  {LAYER_LABELS[dna.currentLayer] ?? `Layer ${dna.currentLayer}`}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Fundamentos Score</p>
                <p className="text-2xl font-bold text-gray-900">{dna.fundamentos_score}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Path</p>
                <Badge variant="info">
                  {dna.onboardingPath === 'A' ? 'Path A (tiene marca)' : dna.onboardingPath === 'B' ? 'Path B (desde cero)' : 'Sin iniciar'}
                </Badge>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">Progreso de layers</p>
                <p className="text-xs text-gray-400">Layer {dna.currentLayer} / 3</p>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-criteria-500 rounded-full transition-all"
                  style={{ width: `${(dna.currentLayer / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Artifacts by layer */}
          {[0, 1, 2, 3].map((layer) => {
            const layerArts = byLayer[layer] ?? [];
            const isCurrentLayer = layer === dna!.currentLayer;
            const isPastLayer = layer < dna!.currentLayer;

            return (
              <div key={layer} className={`bg-white rounded-xl border p-5 ${
                isCurrentLayer ? 'border-criteria-300' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">{LAYER_LABELS[layer]}</h2>
                  <div className="flex items-center gap-2">
                    {isPastLayer && <Badge variant="success">Completado</Badge>}
                    {isCurrentLayer && <Badge variant="warning">Activo</Badge>}
                    {layer > dna!.currentLayer && <Badge variant="default">Pendiente</Badge>}
                    <span className="text-xs text-gray-400">{layerArts.length} artifacts</span>
                  </div>
                </div>

                {layerArts.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    {layer > dna!.currentLayer ? 'Layer no iniciado aún' : 'Sin artifacts registrados'}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {layerArts.map((art) => (
                      <div key={art.id} className="flex items-center gap-1.5 text-xs bg-gray-50 rounded px-2 py-1.5 border border-gray-100">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          art.status === 'approved' ? 'bg-green-500' :
                          art.status === 'pending' ? 'bg-amber-400' :
                          'bg-gray-300'
                        }`} />
                        <span className="text-gray-600 truncate">{art.artifactType}</span>
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
