"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/auth/sign-in");
    } else if (!isPending && session && !isAdmin) {
      router.replace("/");
    }
  }, [session, isPending, isAdmin, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#9d9a9c] text-sm">Cargando...</div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-white tracking-tight">
              criteria<span className="text-[#ffd053]">.</span>agency
            </span>
            <nav className="flex items-center gap-4">
              <a
                href="/admin"
                className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/admin/projects"
                className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
              >
                Proyectos
              </a>
              <a
                href="/admin/agents"
                className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
              >
                Agentes
              </a>
              <a
                href="/admin/canvas"
                className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
              >
                Canvas
              </a>
              <a
                href="/admin/finances"
                className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
              >
                Finanzas
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#666]">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut().then(() => router.replace("/auth/sign-in"))}
              className="text-sm text-[#9d9a9c] hover:text-white transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
