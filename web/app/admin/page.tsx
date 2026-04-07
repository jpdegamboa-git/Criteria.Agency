"use client";

import { useSession } from "@/lib/auth-client";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-[#9d9a9c] mb-8">
        Bienvenido, {session?.user.name}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/admin/finances"
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#ffd053]/30 transition-colors group"
        >
          <h2 className="text-lg font-semibold text-white group-hover:text-[#ffd053] transition-colors">
            Finanzas
          </h2>
          <p className="text-sm text-[#666] mt-1">
            Transacciones, reconciliacion, cash flow
          </p>
        </a>

        <a
          href="/admin/projects"
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#ffd053]/30 transition-colors group"
        >
          <h2 className="text-lg font-semibold text-white group-hover:text-[#ffd053] transition-colors">
            Proyectos
          </h2>
          <p className="text-sm text-[#666] mt-1">
            Pipeline de video, gates, agentes
          </p>
        </a>

        <a
          href="/admin/agents"
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#ffd053]/30 transition-colors group"
        >
          <h2 className="text-lg font-semibold text-white group-hover:text-[#ffd053] transition-colors">
            Agentes
          </h2>
          <p className="text-sm text-[#666] mt-1">
            20 agentes, 9 equipos, ejecuciones
          </p>
        </a>
      </div>
    </div>
  );
}
