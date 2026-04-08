"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutGrid,
  Palette,
  Package,
  DollarSign,
  Globe,
  Search,
  Megaphone,
  Banknote,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const homeItem: NavItem = { href: "/client", label: "Home", icon: Home };

const groups: NavGroup[] = [
  {
    label: "Fundamentos",
    items: [
      { href: "/client/business-model", label: "Business Model", icon: LayoutGrid },
      { href: "/client/brand", label: "Brand", icon: Palette },
      { href: "/client/productos", label: "Productos y Servicios", icon: Package },
      { href: "/client/revenue", label: "Revenue Streams", icon: DollarSign },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { href: "/client/mercado", label: "Mercado", icon: Globe },
      { href: "/client/competencia", label: "Competencia", icon: Search },
    ],
  },
  {
    label: "Ejecución",
    items: [
      { href: "/client/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/client/sales", label: "Sales", icon: Banknote },
    ],
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/client") return pathname === "/client";
  return pathname.startsWith(href);
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-[#f5f5f7] text-portal-text"
          : "text-portal-text-muted hover:text-portal-text hover:bg-[#fafafa]"
      )}
    >
      <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
      {item.label}
    </Link>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-portal-border h-screen sticky top-0 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-portal-border">
        <span className="text-base font-bold text-portal-text tracking-tight">
          criteria<span className="text-portal-accent">.</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Home */}
        <SidebarLink item={homeItem} pathname={pathname} />

        {/* Groups */}
        {groups.map((group) => (
          <div key={group.label} className="pt-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-portal-text-dim">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
