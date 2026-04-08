"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PortalNav } from "@/components/portal/portal-nav";
import { NotificationsDropdown } from "@/components/portal/notifications-dropdown";
import { AvatarDropdown } from "@/components/portal/avatar-dropdown";
import { CopilotFAB } from "@/components/portal/copilot-fab";
import { Sun } from "lucide-react";

// TODO: Remove PREVIEW_MODE before production — set to false to enable auth guard
const PREVIEW_MODE = true;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!PREVIEW_MODE && !isPending && !session) router.replace("/auth/sign-in");
  }, [session, isPending, router]);

  if (!PREVIEW_MODE && isPending) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-portal-text-muted text-sm">Cargando...</div>
      </div>
    );
  }

  if (!PREVIEW_MODE && !session) return null;

  const userName = session?.user?.name || "Juan Pablo";
  const userEmail = session?.user?.email || "juanpa@criteriafilms.com";

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#f5f5f7" }}>
      {/* Dot pattern — sits above the page bg, below content */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.12) 0.8px, transparent 0.8px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-[#eee] sticky top-0">
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
            <AvatarDropdown name={userName} email={userEmail} />
          </div>
        </div>
      </header>
      <main className="relative z-[1] max-w-[1140px] mx-auto px-8 py-7">{children}</main>
      <CopilotFAB />
    </div>
  );
}
