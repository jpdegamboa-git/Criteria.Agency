import { cookies } from 'next/headers';
import type { PromptRegistryEntry } from '@/lib/api';
import { PromptTable } from './prompt-table';

export default async function ModelDashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let prompts: PromptRegistryEntry[] = [];
  try {
    const res = await fetch(`${api}/api/prompts`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.ok) prompts = await res.json() as PromptRegistryEntry[];
  } catch {
    // fail silently
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Model Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Prompt Registry — {prompts.length} prompts activos · edita sin redeploy (DEC-145)
          </p>
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No hay prompts registrados aún.</p>
          <p className="text-xs text-gray-400 mt-1">Ejecuta el seed para cargar los prompts iniciales.</p>
        </div>
      ) : (
        <PromptTable prompts={prompts} />
      )}
    </div>
  );
}
