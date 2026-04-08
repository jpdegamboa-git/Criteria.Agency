"use client";

import { useState, useEffect } from "react";
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
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
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

function hasActiveItem(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isActive(item.href, pathname));
}

function SidebarLink({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const active = isActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
        active
          ? "bg-[#f5f5f7] text-portal-text"
          : "text-portal-text-muted hover:text-portal-text hover:bg-[#fafafa]"
      )}
    >
      <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
      {!collapsed && item.label}
    </Link>
  );
}

function SidebarGroup({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  const groupHasActive = hasActiveItem(group, pathname);
  const [open, setOpen] = useState(groupHasActive);

  // Auto-expand when navigating into a group
  useEffect(() => {
    if (groupHasActive) setOpen(true);
  }, [groupHasActive]);

  if (collapsed) {
    // In collapsed mode, show a divider dot and icons only
    return (
      <div className="pt-4">
        <div className="flex justify-center pb-2">
          <div className="w-4 h-px bg-portal-border" />
        </div>
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} collapsed />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-3 pb-2 group cursor-pointer"
      >
        <ChevronRight
          size={10}
          className={cn(
            "text-portal-text-dim transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-portal-text-dim group-hover:text-portal-text-muted transition-colors">
          {group.label}
        </span>
      </button>
      <div
        className={cn(
          "space-y-0.5 overflow-hidden transition-all duration-150",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {group.items.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} collapsed={false} />
        ))}
      </div>
    </div>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "shrink-0 bg-white border-r border-portal-border h-screen sticky top-0 flex flex-col overflow-y-auto transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn("h-14 flex items-center border-b border-portal-border", collapsed ? "justify-center px-2" : "justify-between px-5")}>
        {!collapsed && (
          <span className="text-base font-bold text-portal-text tracking-tight">
            criteria<span className="text-portal-accent">.</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-[#f5f5f7] transition-colors text-portal-text-muted hover:text-portal-text"
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className={cn("flex-1 py-4 space-y-1", collapsed ? "px-2" : "px-3")}>
        {/* Home */}
        <SidebarLink item={homeItem} pathname={pathname} collapsed={collapsed} />

        {/* Groups */}
        {groups.map((group) => (
          <SidebarGroup key={group.label} group={group} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
