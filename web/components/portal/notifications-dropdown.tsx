"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockNotifications } from "@/lib/portal-mock-data";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-black/5 transition-colors">
        <Bell size={18} className="text-portal-text-muted" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff6b6b] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl portal-shadow border border-portal-border z-50 overflow-hidden">
          <div className="p-3 border-b border-portal-border">
            <p className="text-xs font-semibold text-portal-text">Notificaciones</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {mockNotifications.map((n) => (
              <div key={n.id} className={cn("px-3 py-2.5 border-b border-portal-border last:border-0 hover:bg-gray-50 transition-colors", !n.read && "bg-blue-50/30")}>
                <p className="text-xs text-portal-text">{n.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-portal-text-dim">{n.time}</span>
                  {n.action && <button className="text-[10px] font-semibold text-portal-accent hover:underline">{n.action}</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
