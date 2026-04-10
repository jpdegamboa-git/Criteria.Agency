import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function OrganizationsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let orgs: Organization[] = [];
  try {
    // Better Auth provides the current user's org list
    const res = await fetch(`${api}/api/auth/organization/list`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json() as Organization[] | { organizations?: Organization[] };
      orgs = Array.isArray(data) ? data : (data.organizations ?? []);
    }
  } catch {
    // fail silently
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orgs.length} organización{orgs.length !== 1 ? 'es' : ''} registrada{orgs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {orgs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Sin organizaciones registradas aún.</p>
          <p className="text-xs text-gray-400 mt-1">
            Las organizaciones se crean a través del flujo de onboarding o vía seed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {orgs.map((org) => (
              <div key={org.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-criteria-100 text-criteria-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{org.slug}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">Creada {formatDate(org.createdAt)}</p>
                  <Badge variant="success" className="mt-1">activa</Badge>
                </div>
                <span className="text-xs font-mono text-gray-300">{org.id.slice(0, 8)}…</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Nota:</span> La gestión completa de organizaciones
          (crear, suspender, cambiar plan) está planificada para post-MVP. El listado actual
          usa el endpoint de Better Auth para organizaciones del usuario autenticado.
        </p>
      </div>
    </div>
  );
}
