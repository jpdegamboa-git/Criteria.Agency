"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
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
    <div className="min-h-screen relative flex" style={{ backgroundColor: "#f5f5f7" }}>
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

      {/* Sidebar */}
      <div className="relative z-10">
        <PortalSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 relative z-[1] min-h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#eee] sticky top-0 z-10">
          <div className="max-w-[1140px] mx-auto px-8 h-14 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                <Sun size={16} className="text-portal-text-muted" />
              </button>
              <NotificationsDropdown />
              <AvatarDropdown name={userName} email={userEmail} />
            </div>
          </div>
        </header>
        <main className="max-w-[1140px] mx-auto px-8 py-7 flex-1">{children}</main>
      </div>

      <CopilotFAB />
    </div>
  );
}
