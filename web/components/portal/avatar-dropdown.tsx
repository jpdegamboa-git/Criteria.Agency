"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface AvatarDropdownProps {
  name: string;
  email?: string;
}

export function AvatarDropdown({ name, email }: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-[#111] text-white text-[10px] font-semibold flex items-center justify-center">
          {initials}
        </div>
        <span className="text-xs font-medium text-[#444] hidden sm:inline">{name.split(" ")[0]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#eee] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-portal-border">
            <p className="text-xs font-semibold text-portal-text">{name}</p>
            {email && <p className="text-[10px] text-portal-text-muted">{email}</p>}
          </div>
          <div className="py-1">
            <Link href="/client/setup" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-portal-text-secondary hover:bg-gray-50 transition-colors">
              <Settings size={14} />Setup
            </Link>
            <button onClick={() => signOut().then(() => router.replace("/auth/sign-in"))} className="flex items-center gap-2 px-4 py-2 text-xs text-portal-text-secondary hover:bg-gray-50 transition-colors w-full text-left">
              <LogOut size={14} />Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
