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
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Boxes,
  Radar,
  Zap,
  Wrench,
  ShoppingBag,
  BookUser,
  HardDrive,
  FileBarChart,
  Clapperboard,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

interface NavGroup {
  label: string;
  icon: typeof Home;
  color: string;
  items: NavItem[];
}

const homeItem: NavItem = { href: "/client", label: "Home", icon: Home };

const groups: NavGroup[] = [
  {
    label: "Fundamentos",
    icon: Boxes,
    color: "#7c5cfc",
    items: [
      { href: "/client/business-model", label: "Business", icon: LayoutGrid },
      { href: "/client/brand", label: "Brand", icon: Palette },
      { href: "/client/productos", label: "Productos y Servicios", icon: Package },
      { href: "/client/revenue", label: "Revenue Streams", icon: DollarSign },
    ],
  },
  {
    label: "Inteligencia",
    icon: Radar,
    color: "#00c2a8",
    items: [
      { href: "/client/mercado", label: "Mercado", icon: Globe },
      { href: "/client/competencia", label: "Competencia", icon: Search },
    ],
  },
  {
    label: "Ejecución",
    icon: Zap,
    color: "#f5a623",
    items: [
      { href: "/client/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/client/sales", label: "Sales", icon: Banknote },
    ],
  },
];

const toolsGroup: NavGroup = {
  label: "Tools",
  icon: Wrench,
  color: "#ff6b6b",
  items: [
    { href: "/client/studio", label: "Studio", icon: Clapperboard },
    { href: "/client/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/client/directorio", label: "Directorio", icon: BookUser },
    { href: "/client/drive", label: "Drive", icon: HardDrive },
    { href: "/client/reportes", label: "Reportes", icon: FileBarChart },
  ],
};

function isActive(href: string, pathname: string): boolean {
  if (href === "/client") return pathname === "/client";
  return pathname.startsWith(href);
}

function hasActiveItem(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isActive(item.href, pathname));
}

function SidebarLink({ item, pathname, collapsed, groupColor }: { item: NavItem; pathname: string; collapsed: boolean; groupColor?: string }) {
  const active = isActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg font-medium transition-colors",
        collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 pl-8 pr-3 py-1.5 text-sm",
        active
          ? "text-portal-text"
          : "text-portal-text-muted hover:text-portal-text hover:bg-white/60"
      )}
      style={active && groupColor ? { backgroundColor: groupColor + "12" } : undefined}
    >
      <item.icon size={15} strokeWidth={active ? 2 : 1.5} />
      {!collapsed && <span className="text-[13px]">{item.label}</span>}
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

  const GroupIcon = group.icon;

  if (collapsed) {
    return (
      <div className="pt-1">
        <button
          onClick={() => setOpen(!open)}
          title={group.label}
          className={cn(
            "flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-colors cursor-pointer",
            groupHasActive || open
              ? "text-portal-text bg-[#f5f5f7]"
              : "text-portal-text-muted hover:text-portal-text hover:bg-[#fafafa]"
          )}
        >
          <GroupIcon size={16} strokeWidth={groupHasActive ? 2 : 1.5} />
        </button>
        {open && group.items.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {group.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} collapsed groupColor={group.color} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
          groupHasActive
            ? "text-portal-text"
            : "text-portal-text-muted hover:text-portal-text hover:bg-[#fafafa]"
        )}
      >
        <GroupIcon size={16} strokeWidth={groupHasActive ? 2 : 1.5} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-150",
            open ? "rotate-0" : "-rotate-90",
            groupHasActive ? "text-portal-text-secondary" : "text-portal-text-dim"
          )}
        />
      </button>
      {group.items.length > 0 && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-150",
            open ? "max-h-[500px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
          )}
        >
          <div
            className="space-y-0.5 rounded-lg py-1 px-1 mx-1"
            style={open ? { backgroundColor: group.color + "08" } : undefined}
          >
            {group.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} collapsed={false} groupColor={group.color} />
            ))}
          </div>
        </div>
      )}
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

      <nav className={cn("flex-1 py-3 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
        {/* Home — same style as category buttons */}
        <Link
          href={homeItem.href}
          title={collapsed ? homeItem.label : undefined}
          className={cn(
            "flex items-center rounded-lg font-medium transition-colors",
            collapsed
              ? "justify-center w-9 h-9 mx-auto"
              : "gap-2.5 px-3 py-2 text-sm",
            pathname === "/client"
              ? "bg-[#f5f5f7] text-portal-text"
              : "text-portal-text-muted hover:text-portal-text hover:bg-[#fafafa]"
          )}
        >
          <Home size={16} strokeWidth={pathname === "/client" ? 2 : 1.5} />
          {!collapsed && <span className="flex-1 text-left">Home</span>}
        </Link>

        {/* Groups */}
        {groups.map((group) => (
          <SidebarGroup key={group.label} group={group} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      {/* Tools — pinned to bottom */}
      <div className={cn("border-t border-portal-border", collapsed ? "px-2 py-2" : "px-3 py-2")}>
        <SidebarGroup group={toolsGroup} pathname={pathname} collapsed={collapsed} />
      </div>
    </aside>
  );
}
