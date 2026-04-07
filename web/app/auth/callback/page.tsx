"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const { data: session } = await authClient.getSession();
      const user = session?.user as { role?: string } | undefined;
      if (user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-[#9d9a9c] text-sm">Redirigiendo...</p>
    </div>
  );
}
