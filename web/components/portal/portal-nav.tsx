"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, Palette, LayoutGrid, Target, Megaphone, DollarSign } from "lucide-react";

const navItems = [
  { href: "/client", label: "Home", icon: Home },
  { href: "/client/brand", label: "Brand", icon: Palette },
  { href: "/client/blueprint", label: "Blueprint", icon: LayoutGrid },
  { href: "/client/plan", label: "Plan", icon: Target },
  { href: "/client/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/client/sales", label: "Sales", icon: DollarSign },
];

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = item.href === "/client" ? pathname === "/client" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "text-portal-text" : "text-portal-text-muted hover:text-portal-text"
            )}
          >
            <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
