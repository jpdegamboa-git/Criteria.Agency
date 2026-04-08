"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PortalNav } from "@/components/portal/portal-nav";
import { NotificationsDropdown } from "@/components/portal/notifications-dropdown";
import { AvatarDropdown } from "@/components/portal/avatar-dropdown";
import { CopilotFAB } from "@/components/portal/copilot-fab";
import { Sun } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) router.replace("/auth/sign-in");
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-portal-text-muted text-sm">Cargando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-portal-bg">
      <div className="portal-dot-bg" />
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-portal-border sticky top-0">
        <div className="max-w-[1140px] mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-base font-bold text-portal-text tracking-tight">
              criteria<span className="text-portal-accent">.</span>agency
            </span>
            <PortalNav />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <Sun size={16} className="text-portal-text-muted" />
            </button>
            <NotificationsDropdown />
            <AvatarDropdown name={session.user.name || "Usuario"} email={session.user.email} />
          </div>
        </div>
      </header>
      <main className="relative z-[1] max-w-[1140px] mx-auto px-8 py-7">{children}</main>
      <CopilotFAB />
    </div>
  );
}
