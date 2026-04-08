# Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal tab nav with a left sidebar grouped by role (Fundamentos, Inteligencia, Ejecución) and redistribute content across 9 spaces.

**Architecture:** New `portal-sidebar.tsx` component replaces `portal-nav.tsx`. Layout changes from single-column with header nav to sidebar + main content. Existing page content is moved (not rewritten) to new route directories. The visual style (design tokens, colors, typography, shadows) remains untouched.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Lucide icons

**Important:** Read `node_modules/next/dist/docs/` before writing any code — this project uses a newer Next.js version that may differ from training data.

---

## File Structure

### New files
- `web/components/portal/portal-sidebar.tsx` — sidebar nav component (replaces portal-nav.tsx)
- `web/app/client/business-model/page.tsx` — Canvas + Unit Economics (from blueprint)
- `web/app/client/productos/page.tsx` — Products & services catalog (from brand)
- `web/app/client/revenue/page.tsx` — Revenue streams detail (from blueprint)
- `web/app/client/mercado/page.tsx` — Market intelligence with 5 tabs (from plan)
- `web/app/client/competencia/page.tsx` — Competitive analysis + monitor (new)

### Modified files
- `web/app/client/layout.tsx` — replace header nav with sidebar layout
- `web/app/client/brand/page.tsx` — remove Audiences section and Products section
- `web/app/client/campaigns/page.tsx` — add Estrategia and Budget tabs
- `web/app/client/page.tsx` — update Blueprint summary link to /client/business-model

### Deleted files
- `web/app/client/blueprint/page.tsx` — replaced by business-model, productos, revenue
- `web/app/client/plan/page.tsx` — replaced by mercado, competencia, and campaigns tabs

### Kept as-is (referenced only)
- `web/components/portal/portal-nav.tsx` — kept in repo but no longer imported (can delete later)
- `web/app/client/sales/page.tsx` — unchanged
- `web/app/client/campaigns/[id]/page.tsx` — unchanged
- `web/app/client/setup/page.tsx` — unchanged

---

### Task 1: Create portal-sidebar.tsx

**Files:**
- Create: `web/components/portal/portal-sidebar.tsx`

- [ ] **Step 1: Create the sidebar component**

```tsx
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
```

Write this to `web/components/portal/portal-sidebar.tsx`.

- [ ] **Step 2: Verify the file was created**

Run: `ls -la web/components/portal/portal-sidebar.tsx`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add web/components/portal/portal-sidebar.tsx
git commit -m "feat(portal): add sidebar navigation component"
```

---

### Task 2: Update layout.tsx — sidebar replaces header nav

**Files:**
- Modify: `web/app/client/layout.tsx`

- [ ] **Step 1: Replace the layout to use sidebar instead of header nav**

Replace the entire content of `web/app/client/layout.tsx` with:

```tsx
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
```

Key changes:
- Outer div is now `flex` for sidebar + main side by side
- `PortalSidebar` replaces `PortalNav` in imports and rendering
- Header no longer has logo or nav — just right-side controls (theme, notifications, avatar)
- Header uses `justify-end` instead of `justify-between`
- Main content is inside a `flex-1` wrapper next to the sidebar

- [ ] **Step 2: Verify the app loads**

Run the dev server and check that the sidebar renders next to the main content, and the header shows only the right-side controls.

- [ ] **Step 3: Commit**

```bash
git add web/app/client/layout.tsx
git commit -m "feat(portal): replace header nav with sidebar layout"
```

---

### Task 3: Create business-model page (from blueprint)

**Files:**
- Create: `web/app/client/business-model/page.tsx`

- [ ] **Step 1: Create the business-model page**

This page takes the Business Model Canvas, Value Proposition Canvas, and Unit Economics sections from `web/app/client/blueprint/page.tsx` (lines 17-74 for data, 86-110 for BMCBlock, 112-335 for JSX) — but **without** the Revenue Streams detail (lines 271-308) and **without** the Marketplace section (lines 337-363).

The page uses the Plan page's tab pattern (lines 33-41 of plan/page.tsx) to switch between Canvas and Unit Economics.

```tsx
"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import {
  MessageCircle, Pencil, Plus,
  Handshake, Cog, Gem, Users, Heart, Truck, Wallet, PiggyBank,
  Lightbulb, Frown, Smile, Package, ShieldCheck, Sparkles,
  LayoutGrid, Calculator,
} from "lucide-react";

const tabs = [
  { id: "canvas", label: "Canvas", icon: LayoutGrid },
  { id: "unit-economics", label: "Unit Economics", icon: Calculator },
] as const;

type TabId = (typeof tabs)[number]["id"];

// ── BMC Block Data (copied from blueprint) ──

const bmcBlocks = {
  partners: {
    label: "Alianzas clave",
    icon: Handshake,
    color: "#7c5cfc",
    items: ["Fincas de Tarrazú y Naranjo", "Proveedores de empaques eco", "Alianza con Correos de CR", "Coworking Hub CR"],
  },
  activities: {
    label: "Actividades clave",
    icon: Cog,
    color: "#7c5cfc",
    items: ["Tostado artesanal semanal", "Control de calidad (cupping)", "Gestión de suscripciones", "Creación de contenido"],
  },
  resources: {
    label: "Recursos clave",
    icon: Gem,
    color: "#7c5cfc",
    items: ["Tostadora Probat 5kg", "Equipo de baristas (4)", "Marca y know-how", "Relaciones con fincas"],
  },
  value: {
    label: "Propuesta de valor",
    icon: Lightbulb,
    color: "#f5a623",
    items: ["Café de especialidad con trazabilidad completa", "Experiencia premium del grano a la taza", "Suscripción personalizada por perfil de sabor", "Impacto social directo en comunidades productoras"],
  },
  relationships: {
    label: "Relación con clientes",
    icon: Heart,
    color: "#00c2a8",
    items: ["Comunidad de suscriptores", "Asistencia personalizada", "Contenido educativo (café)", "Programa de fidelización"],
  },
  channels: {
    label: "Canales",
    icon: Truck,
    color: "#00c2a8",
    items: ["Tienda física San José", "E-commerce propio", "Instagram y TikTok", "Wholesale (restaurantes, hoteles)", "Marketplace local"],
  },
  segments: {
    label: "Segmentos de clientes",
    icon: Users,
    color: "#00c2a8",
    items: ["Profesional urbano 28-45", "Foodie millennial 22-32", "Barista profesional", "B2B Horeca (hoteles, restaurantes)"],
  },
  costs: {
    label: "Estructura de costos",
    icon: PiggyBank,
    color: "#ff6b6b",
    items: ["Café verde (materia prima) — 35%", "Operación tienda — 20%", "Nómina — 25%", "Marketing y distribución — 12%", "Empaques y logística — 8%"],
  },
  revenue: {
    label: "Fuentes de ingreso",
    icon: Wallet,
    color: "#00c2a8",
    items: ["Venta directa en tienda — ₡2.4M (45%)", "Suscripción mensual — ₡1.1M (21%)", "Wholesale B2B — ₡980K (18%)", "Merchandising — ₡520K (10%)", "Cursos y talleres — ₡320K (6%)"],
  },
};

// ── BMC Block Component ──

function BMCBlock({ label, icon: Icon, color, items, className }: {
  label: string; icon: typeof Cog; color: string; items: string[]; className?: string;
}) {
  return (
    <div className={cn("p-3 rounded-xl", className)} style={{ backgroundColor: color + "06" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} style={{ color }} />
        <p className="text-[9px] font-semibold uppercase tracking-[0.5px]" style={{ color }}>{label}</p>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-1.5">
            <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color, opacity: 0.5 }} />
            <p className="text-[10px] text-portal-text leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
      <button className="flex items-center gap-1 mt-2 text-[9px] font-medium text-portal-text-dim hover:text-portal-accent transition-colors">
        <Plus size={10} /> Agregar
      </button>
    </div>
  );
}

export default function BusinessModelPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("canvas");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Business Model</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="primary" size="sm" icon={<MessageCircle size={13} />}>Editar con Copilot</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "canvas" && (
        <div className="space-y-5">
          {/* Business Model Canvas */}
          <SectionHeader title="Business Model Canvas" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>} />
          <PortalCard noPadding>
            <div className="p-4">
              <div className="grid grid-cols-10 gap-3 mb-3">
                <div className="col-span-2 row-span-2"><BMCBlock {...bmcBlocks.partners} className="h-full" /></div>
                <div className="col-span-2"><BMCBlock {...bmcBlocks.activities} /></div>
                <div className="col-span-2 row-span-2"><BMCBlock {...bmcBlocks.value} className="h-full" /></div>
                <div className="col-span-2"><BMCBlock {...bmcBlocks.relationships} /></div>
                <div className="col-span-2 row-span-2"><BMCBlock {...bmcBlocks.segments} className="h-full" /></div>
                <div className="col-span-2"><BMCBlock {...bmcBlocks.resources} /></div>
                <div className="col-span-2"><BMCBlock {...bmcBlocks.channels} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <BMCBlock {...bmcBlocks.costs} />
                <BMCBlock {...bmcBlocks.revenue} />
              </div>
            </div>
          </PortalCard>

          {/* Value Proposition Canvas */}
          <SectionHeader title="Value Proposition Canvas" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>} />
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Profile */}
            <PortalCard>
              <p className="text-xs font-semibold text-portal-text mb-3">Perfil del cliente</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Cog size={11} className="text-[#7c5cfc]" />
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#7c5cfc]">Jobs (tareas)</p>
                  </div>
                  <div className="space-y-1">
                    {["Empezar el día con energía y un ritual agradable", "Impresionar invitados con un café excepcional", "Apoyar productores locales con su compra"].map((j) => (
                      <div key={j} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#f8f8fa]">
                        <div className="w-1 h-1 rounded-full bg-[#7c5cfc] mt-1.5 shrink-0" />
                        <p className="text-[10px] text-portal-text">{j}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Frown size={11} className="text-[#ff6b6b]" />
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#ff6b6b]">Pains (dolores)</p>
                  </div>
                  <div className="space-y-1">
                    {["No saber de dónde viene su café", "Café insípido de supermercado", "Falta de opciones de especialidad cerca"].map((p) => (
                      <div key={p} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#fff0f0]">
                        <div className="w-1 h-1 rounded-full bg-[#ff6b6b] mt-1.5 shrink-0" />
                        <p className="text-[10px] text-portal-text">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Smile size={11} className="text-[#00c2a8]" />
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#00c2a8]">Gains (beneficios)</p>
                  </div>
                  <div className="space-y-1">
                    {["Sentir que su compra tiene impacto positivo", "Descubrir perfiles de sabor únicos", "Pertenecer a una comunidad de conocedores"].map((g) => (
                      <div key={g} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#edfbf8]">
                        <div className="w-1 h-1 rounded-full bg-[#00c2a8] mt-1.5 shrink-0" />
                        <p className="text-[10px] text-portal-text">{g}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PortalCard>

            {/* Value Map */}
            <PortalCard>
              <p className="text-xs font-semibold text-portal-text mb-3">Mapa de valor</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Package size={11} className="text-[#f5a623]" />
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#f5a623]">Productos y servicios</p>
                  </div>
                  <div className="space-y-1">
                    {["Café de origen único tostado semanalmente", "Suscripción con perfil de sabor personalizado", "Cursos de barismo y cata", "Merch premium (tazas de cerámica artesanal)"].map((p) => (
                      <div key={p} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#fff8eb]">
                        <div className="w-1 h-1 rounded-full bg-[#f5a623] mt-1.5 shrink-0" />
                        <p className="text-[10px] text-portal-text">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck size={11} className="text-[#00c2a8]" />
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#00c2a8]">Pain relievers</p>
                  </div>
                  <div className="space-y-1">
                    {["QR en cada bolsa con info de finca y tostado", "Entrega directa a domicilio (suscripción)", "Garantía de frescura: tostado máximo 7 días"].map((p) => (
                      <div key={p} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#edfbf8]">
                        <div className="w-1 h-1 rounded-full bg-[#00c2a8] mt-1.5 shrink-0" />
                        <p className="text-[10px] text-portal-text">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={11} className="text-[#7c5cfc]" />
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#7c5cfc]">Gain creators</p>
                  </div>
                  <div className="space-y-1">
                    {["Certificado de impacto social por compra", "Acceso a catas exclusivas para suscriptores", "App con historial de cafés y recomendaciones"].map((g) => (
                      <div key={g} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#f8f8fa]">
                        <div className="w-1 h-1 rounded-full bg-[#7c5cfc] mt-1.5 shrink-0" />
                        <p className="text-[10px] text-portal-text">{g}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PortalCard>
          </div>
        </div>
      )}

      {activeTab === "unit-economics" && (
        <PortalCard>
          <SectionHeader title="Unit Economics" />
          <div className="space-y-4">
            {[
              { label: "LTV", value: "₡18,000", sub: "Lifetime value promedio" },
              { label: "CAC", value: "₡4,200", sub: "Costo de adquisición" },
              { label: "LTV:CAC", value: "4.3x", sub: "Ratio (saludable >3x)" },
              { label: "Payback", value: "2.8 meses", sub: "Tiempo de recuperación" },
              { label: "Margen bruto", value: "62%", sub: "Después de COGS" },
              { label: "Retención 6m", value: "68%", sub: "Clientes que recompran" },
            ].map((m) => (
              <div key={m.label} className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm font-[800] text-portal-text">{m.value}</p>
                  <p className="text-[9px] text-portal-text-dim">{m.sub}</p>
                </div>
                <span className="text-[9px] font-semibold text-portal-text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </PortalCard>
      )}
    </div>
  );
}
```

Write this to `web/app/client/business-model/page.tsx`.

- [ ] **Step 2: Verify the page renders**

Navigate to `/client/business-model` in the browser. Confirm:
- Header shows "Business Model" with Copilot button and brand selector
- Canvas tab shows BMC grid + Value Proposition Canvas
- Unit Economics tab shows 6 metric cards

- [ ] **Step 3: Commit**

```bash
git add web/app/client/business-model/page.tsx
git commit -m "feat(portal): add Business Model page (canvas + unit economics)"
```

---

### Task 4: Create productos page (from brand)

**Files:**
- Create: `web/app/client/productos/page.tsx`

- [ ] **Step 1: Create the productos page**

This extracts the "Productos y servicios" section from `web/app/client/brand/page.tsx` (lines 299-316) and makes it a standalone page with the same styling.

```tsx
"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";

const products = [
  { name: "Café en grano (250g, 500g, 1kg)", type: "Producto" },
  { name: "Suscripción mensual de café", type: "Servicio" },
  { name: "Cursos de barismo", type: "Servicio" },
  { name: "Merch (tazas, camisetas)", type: "Producto" },
  { name: "Café preparado en tienda", type: "Producto" },
];

export default function ProductosPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Productos y Servicios</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="primary" size="sm" icon={<Plus size={13} />}>Agregar</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      <PortalCard>
        <SectionHeader title="Catálogo" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>} />
        <div className="space-y-0">
          {products.map((p, i) => (
            <div key={p.name} className={cn("flex items-center gap-3 py-3", i < products.length - 1 && "border-b border-[#f0f0f0]")}>
              <p className="text-xs text-portal-text flex-1">{p.name}</p>
              <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{p.type}</span>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-1 mt-3 text-[11px] font-medium text-portal-text-dim hover:text-portal-accent transition-colors">
          <Plus size={12} /> Agregar producto o servicio
        </button>
      </PortalCard>
    </div>
  );
}
```

Write this to `web/app/client/productos/page.tsx`.

- [ ] **Step 2: Verify the page renders at /client/productos**

- [ ] **Step 3: Commit**

```bash
git add web/app/client/productos/page.tsx
git commit -m "feat(portal): add Productos y Servicios page"
```

---

### Task 5: Create revenue page (from blueprint)

**Files:**
- Create: `web/app/client/revenue/page.tsx`

- [ ] **Step 1: Create the revenue streams page**

This extracts the Revenue Streams section from `web/app/client/blueprint/page.tsx` (lines 76-84 for data, 271-308 for JSX).

```tsx
"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { Pencil, ShoppingCart, Repeat, DollarSign, Gift, TrendingUp } from "lucide-react";

const revenueStreams = [
  { id: "rs1", name: "Venta directa en tienda", type: "Producto", icon: ShoppingCart, revenue: "₡2.4M", share: 45, trend: "+12%", color: "#7c5cfc" },
  { id: "rs2", name: "Suscripción mensual", type: "Recurrente", icon: Repeat, revenue: "₡1.1M", share: 21, trend: "+34%", color: "#00c2a8" },
  { id: "rs3", name: "Wholesale B2B", type: "Producto", icon: DollarSign, revenue: "₡980K", share: 18, trend: "+5%", color: "#f5a623" },
  { id: "rs4", name: "Merchandising", type: "Producto", icon: Gift, revenue: "₡520K", share: 10, trend: "-3%", color: "#ff6b6b" },
  { id: "rs5", name: "Cursos y talleres", type: "Servicio", icon: TrendingUp, revenue: "₡320K", share: 6, trend: "+22%", color: "#888" },
];

export default function RevenuePage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Revenue Streams</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      <PortalCard>
        <div className="space-y-2.5">
          {revenueStreams.map((rs) => {
            const Icon = rs.icon;
            const isNeg = rs.trend.startsWith("-");
            return (
              <div key={rs.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: rs.color + "15" }}>
                  <Icon size={13} style={{ color: rs.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-portal-text truncate">{rs.name}</p>
                    <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{rs.type}</span>
                  </div>
                  <div className="mt-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${rs.share}%`, backgroundColor: rs.color }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-[800] text-portal-text">{rs.revenue}</p>
                  <p className="text-[10px] font-medium" style={{ color: isNeg ? "#ff6b6b" : "#00c2a8" }}>{rs.trend}</p>
                </div>
                <span className="text-[10px] text-portal-text-dim w-8 text-right">{rs.share}%</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f0]">
          <p className="text-[11px] font-semibold text-portal-text-muted">Total</p>
          <p className="text-lg font-[800] text-portal-text">₡5.3M</p>
        </div>
      </PortalCard>
    </div>
  );
}
```

Write this to `web/app/client/revenue/page.tsx`.

- [ ] **Step 2: Verify the page renders at /client/revenue**

- [ ] **Step 3: Commit**

```bash
git add web/app/client/revenue/page.tsx
git commit -m "feat(portal): add Revenue Streams page"
```

---

### Task 6: Create mercado page (from plan)

**Files:**
- Create: `web/app/client/mercado/page.tsx`

- [ ] **Step 1: Create the mercado page**

This takes the Mercados, Tendencias (placeholder), Oportunidades, and Estudios tabs from `web/app/client/plan/page.tsx`, plus the Audiences section from `web/app/client/brand/page.tsx` (lines 197-249).

```tsx
"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands, mockOpportunities } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import { Globe, TrendingUp, Lightbulb, BookOpen, Users, Pencil } from "lucide-react";

const tabs = [
  { id: "industria", label: "Industria", icon: Globe },
  { id: "tendencias", label: "Tendencias", icon: TrendingUp },
  { id: "oportunidades", label: "Oportunidades", icon: Lightbulb },
  { id: "estudios", label: "Estudios", icon: BookOpen },
  { id: "audiencias", label: "Audiencias", icon: Users },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MercadoPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("industria");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Mercado</h1>
        <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
      </div>

      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "industria" && (
        <PortalCard>
          <SectionHeader title="Industria" />
          <div className="text-xs text-portal-text-dim text-center py-12">Industry data, market size, macro trends — placeholder</div>
        </PortalCard>
      )}

      {activeTab === "tendencias" && (
        <PortalCard>
          <SectionHeader title="Tendencias" />
          <div className="text-xs text-portal-text-dim text-center py-12">Culture + Industry Listener feeds — placeholder</div>
        </PortalCard>
      )}

      {activeTab === "oportunidades" && (
        <div className="space-y-3">
          {mockOpportunities.map((opp) => (
            <PortalCard key={opp.id}>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-1" style={{
                  backgroundColor: opp.type === "tendencia" ? "#00c2a8" : opp.type === "competencia" ? "#7c5cfc" : opp.type === "cultura" ? "#ff6b6b" : "#f5a623",
                }} />
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-portal-text-muted">{opp.type}</span>
                  <h3 className="text-xs font-semibold text-portal-text mt-0.5">{opp.title}</h3>
                  <p className="text-[11px] text-portal-text-secondary mt-1">{opp.description}</p>
                </div>
                <button className="text-[11px] font-semibold text-portal-accent hover:underline whitespace-nowrap">{opp.action} →</button>
              </div>
            </PortalCard>
          ))}
        </div>
      )}

      {activeTab === "estudios" && (
        <PortalCard>
          <SectionHeader title="Estudios" />
          <div className="text-xs text-portal-text-dim text-center py-12">Research cards — competitive analysis, audits, benchmarks — placeholder</div>
        </PortalCard>
      )}

      {activeTab === "audiencias" && (
        <div>
          <SectionHeader title="Públicos objetivo" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>} />
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                segment: "Principal",
                name: "Profesional urbano 28-45",
                avatar: "👨‍💼",
                traits: ["Valora calidad sobre precio", "Compra online y en tienda", "Instagram y LinkedIn activo"],
                channels: ["Instagram", "E-commerce", "Tienda"],
                color: "#7c5cfc",
              },
              {
                segment: "Secundaria",
                name: "Foodie millennial 22-32",
                avatar: "🧑‍🍳",
                traits: ["Explora nuevas experiencias", "Comparte en redes sociales", "Sensible a tendencias"],
                channels: ["TikTok", "Instagram", "Eventos"],
                color: "#00c2a8",
              },
              {
                segment: "Nicho",
                name: "Barista profesional",
                avatar: "☕",
                traits: ["Técnico, valora origen y proceso", "Influenciador en su comunidad", "Busca relación directa con productor"],
                channels: ["YouTube", "Talleres", "Wholesale"],
                color: "#f5a623",
              },
            ].map((p) => (
              <PortalCard key={p.segment}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{p.avatar}</span>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: p.color }}>{p.segment}</span>
                    <p className="text-xs font-semibold text-portal-text">{p.name}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3">
                  {p.traits.map((t) => (
                    <div key={t} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: p.color }} />
                      <p className="text-[10px] text-portal-text-secondary">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {p.channels.map((ch) => (
                    <span key={ch} className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{ch}</span>
                  ))}
                </div>
              </PortalCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

Write this to `web/app/client/mercado/page.tsx`.

- [ ] **Step 2: Verify all 5 tabs render at /client/mercado**

- [ ] **Step 3: Commit**

```bash
git add web/app/client/mercado/page.tsx
git commit -m "feat(portal): add Mercado page with 5 tabs (industria, tendencias, oportunidades, estudios, audiencias)"
```

---

### Task 7: Create competencia page

**Files:**
- Create: `web/app/client/competencia/page.tsx`

- [ ] **Step 1: Create the competencia page**

This takes the "Panorama competitivo" placeholder from Plan > Estrategia and the Competition Listener concept, and structures them as two tabs.

```tsx
"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import { Map, Radio } from "lucide-react";

const tabs = [
  { id: "landscape", label: "Landscape", icon: Map },
  { id: "monitor", label: "Monitor", icon: Radio },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CompetenciaPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("landscape");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Competencia</h1>
        <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
      </div>

      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "landscape" && (
        <PortalCard>
          <SectionHeader title="Panorama competitivo" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Competitive landscape — who they are, positioning, benchmark analysis — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "monitor" && (
        <PortalCard>
          <SectionHeader title="Monitor en tiempo real" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Competition Listener real-time feed — placeholder
          </div>
        </PortalCard>
      )}
    </div>
  );
}
```

Write this to `web/app/client/competencia/page.tsx`.

- [ ] **Step 2: Verify both tabs render at /client/competencia**

- [ ] **Step 3: Commit**

```bash
git add web/app/client/competencia/page.tsx
git commit -m "feat(portal): add Competencia page (landscape + monitor)"
```

---

### Task 8: Update brand page — remove Audiences and Products sections

**Files:**
- Modify: `web/app/client/brand/page.tsx`

- [ ] **Step 1: Remove the Audiences section**

In `web/app/client/brand/page.tsx`, delete the entire "ROW 3: Audiences" block. This is the section starting with:
```
{/* ══ ROW 3: Audiences (full width) ══ */}
```
And ending just before:
```
{/* ══ ROW 4: Tone + Do's/Don'ts (side by side) ══ */}
```

This removes the `<SectionHeader title="Públicos objetivo" ...>` and the 3-column grid of audience cards (lines 197-249 approximately).

- [ ] **Step 2: Remove the Products section from the Products + Score Improvements row**

In the "ROW 5: Products + Brand Score Improvements" section, remove the Products card (the first `<PortalCard>` inside the `grid grid-cols-2` that contains `<SectionHeader title="Productos y servicios">`). Change the grid from `grid-cols-2` to a single column for the remaining "Score Improvements" card, or keep the improvements card full-width.

Replace the entire ROW 5 block:
```jsx
{/* ══ ROW 5: Brand Score Improvements (full width) ══ */}
<PortalCard>
  <SectionHeader title="Oportunidades de mejora" />
  {/* Keep the existing improvement opportunities content */}
</PortalCard>
```

Keep the improvement items content that was in the second card of the original grid.

- [ ] **Step 3: Verify the brand page renders without audiences or products**

Navigate to `/client/brand`. Confirm:
- No "Públicos objetivo" section
- No "Productos y servicios" section
- Tone + Do's/Don'ts, Guardian, Manual, Marketplace still render correctly

- [ ] **Step 4: Commit**

```bash
git add web/app/client/brand/page.tsx
git commit -m "refactor(portal): remove audiences and products from Brand page (moved to Mercado and Productos)"
```

---

### Task 9: Add Estrategia and Budget tabs to campaigns page

**Files:**
- Modify: `web/app/client/campaigns/page.tsx`

- [ ] **Step 1: Add Estrategia and Budget as view modes**

The campaigns page currently uses a `ViewMode` type with `"matrix" | "calendario" | "lista"`. Extend this to include `"estrategia" | "budget"`.

At the top of the file, change:
```tsx
type ViewMode = "estrategia" | "budget" | "matrix" | "calendario" | "lista";
```

Change the default view:
```tsx
const [view, setView] = useState<ViewMode>("estrategia");
```

Add the Estrategia and Budget views to the view toggle section. The existing FilterGroup component handles the matrix/calendar/list toggle on the right side. Add a new tab bar above the filter bar for the main sections, using the Plan page tab pattern:

Add a tab bar before the filter section:
```tsx
<div className="flex items-center gap-1 border-b border-portal-border mb-4">
  {[
    { id: "estrategia", label: "Estrategia", icon: Target },
    { id: "budget", label: "Budget", icon: BarChart3 },
    { id: "matrix", label: "Matrix", icon: LayoutGrid },
    { id: "calendario", label: "Calendar", icon: CalendarDays },
    { id: "lista", label: "Lista", icon: List },
  ].map((tab) => (
    <button key={tab.id} onClick={() => setView(tab.id as ViewMode)}
      className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
        view === tab.id ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
      <tab.icon size={14} />{tab.label}
    </button>
  ))}
</div>
```

Remove the separate view toggle FilterGroup that was used for matrix/calendar/list since all 5 views now live in the tab bar.

- [ ] **Step 2: Add Estrategia view content**

Add the Estrategia tab content (from Plan > Estrategia: marketing objectives with progress bars). Insert before the matrix conditional:

```tsx
{view === "estrategia" && (
  <div className="space-y-6">
    <PortalCard>
      <SectionHeader title="Plan de Marketing" />
      <div className="space-y-4">
        {[
          { obj: "Incrementar ventas online 20%", progress: 45, metric: "₡2.3M / ₡5M" },
          { obj: "Generar 100 leads calificados Q2", progress: 23, metric: "23 / 100" },
          { obj: "Brand awareness +30%", progress: 60, metric: "60% recall rate" },
        ].map((item) => (
          <div key={item.obj} className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-portal-text">{item.obj}</p>
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-portal-accent rounded-full" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
            <span className="text-[11px] text-portal-text-muted w-28 text-right">{item.metric}</span>
          </div>
        ))}
      </div>
    </PortalCard>
  </div>
)}
```

- [ ] **Step 3: Add Budget view content**

Add the Budget tab content (from Plan > Budget). Requires importing `BudgetEqualizer` and `mockBudgetQ2`:

```tsx
{view === "budget" && (
  <PortalCard>
    <SectionHeader title="Budget Allocator — Q2 2026" />
    <p className="text-[11px] text-portal-text-muted mb-4">
      Presupuesto anual: $30,667 · Q2: ${mockBudgetQ2.amount.toLocaleString()} ({mockBudgetQ2.percentage}%)
    </p>
    <BudgetEqualizer root={mockBudgetQ2} annualBudget={30667} />
  </PortalCard>
)}
```

Add the imports at the top:
```tsx
import { BudgetEqualizer } from "@/components/portal/budget-equalizer";
import { mockBudgetQ2 } from "@/lib/portal-mock-data";
import { Target, BarChart3, CalendarDays, List, LayoutGrid } from "lucide-react";
```

- [ ] **Step 4: Show the filter bar (media type, active toggle) only for matrix/calendar/list views**

Wrap the existing filter bar in a condition:
```tsx
{(view === "matrix" || view === "calendario" || view === "lista") && (
  // existing filter bar JSX
)}
```

- [ ] **Step 5: Verify all 5 views work at /client/campaigns**

Navigate to `/client/campaigns`. Confirm:
- Estrategia tab shows marketing objectives with progress bars
- Budget tab shows BudgetEqualizer
- Matrix, Calendar, Lista work as before
- Filter bar only shows for matrix/calendar/list views

- [ ] **Step 6: Commit**

```bash
git add web/app/client/campaigns/page.tsx
git commit -m "feat(portal): add Estrategia and Budget tabs to Campaigns page"
```

---

### Task 10: Update home page links

**Files:**
- Modify: `web/app/client/page.tsx`

- [ ] **Step 1: Update the Blueprint summary link**

In `web/app/client/page.tsx`, find the link to `/client/blueprint` (the "Ver Blueprint" link in the Blueprint summary card) and change it to `/client/business-model`.

Search for `"/client/blueprint"` and replace with `"/client/business-model"`.

Also update the card title from "Blueprint" to "Business Model" if it appears as text.

- [ ] **Step 2: Verify the Home page links work**

Navigate to `/client`. Click the "Ver Business Model" link. Confirm it navigates to `/client/business-model`.

- [ ] **Step 3: Commit**

```bash
git add web/app/client/page.tsx
git commit -m "fix(portal): update Home page links to new routes (blueprint → business-model)"
```

---

### Task 11: Delete old blueprint and plan pages

**Files:**
- Delete: `web/app/client/blueprint/page.tsx`
- Delete: `web/app/client/plan/page.tsx`

- [ ] **Step 1: Delete the old blueprint page**

```bash
rm web/app/client/blueprint/page.tsx
rmdir web/app/client/blueprint 2>/dev/null || true
```

- [ ] **Step 2: Delete the old plan page**

```bash
rm web/app/client/plan/page.tsx
rmdir web/app/client/plan 2>/dev/null || true
```

- [ ] **Step 3: Verify no broken imports**

Run the dev server and navigate through all sidebar links. Confirm:
- `/client/blueprint` returns 404 (expected — route no longer exists)
- `/client/plan` returns 404 (expected — route no longer exists)
- All new routes work: `/client/business-model`, `/client/productos`, `/client/revenue`, `/client/mercado`, `/client/competencia`
- Existing routes still work: `/client`, `/client/brand`, `/client/campaigns`, `/client/sales`

- [ ] **Step 4: Commit**

```bash
git rm web/app/client/blueprint/page.tsx web/app/client/plan/page.tsx
git commit -m "cleanup(portal): remove old blueprint and plan pages (replaced by new nav structure)"
```

---

### Task 12: Update PROJECT_VISION.md

**Files:**
- Modify: `PROJECT_VISION.md`

- [ ] **Step 1: Update the 6 Spaces section**

In `PROJECT_VISION.md`, find the "6 Client Spaces" section (around line 99-109) and replace it with the new 3-group / 9-space model:

Replace:
```markdown
### 6 Client Spaces (outcome-based navigation)
Clients navigate by outcomes, not by the 24 motors underneath. Each Space groups capabilities that solve related pain points:

| Space | Outcome | Capabilities | Motors Behind |
|-------|---------|-------------|--------------|
| **Crear** | "I need content" | C-009 to C-015, C-042, C-043 | Video, Design, Web, Audio, Events, Print |
| **Comunicar** | "I need to reach people" | C-016 to C-022 | Ads, Community Management, Email, SEO/Content |
| **Entender** | "I need to understand my market" | C-023 to C-027, C-033 to C-037 | 4 Listeners, Opportunity Agent, Analytics |
| **Vender** | "I need to sell" | C-028 to C-032 | Sales/CRM |
| **Mi Marca** | "I need my brand defined/protected" | C-006 to C-008, C-048, C-049 | Brand Builder, Brand Guardian |
| **Cuenta** | "I need to manage my account" | C-038 to C-041, C-045, C-046 | Settings, billing, team, integrations |
```

With:
```markdown
### 9 Client Spaces (role-based navigation)
Clients navigate via a left sidebar grouped by role. Each group provides a mental model:

**Fundamentos** — who you are, what you sell, how you make money

| Space | Purpose | Key Content |
|-------|---------|-------------|
| **Business Model** | Business logic & structure | BMC, Value Proposition Canvas, Unit Economics |
| **Brand** | Brand identity & protection | DNA, visual identity, tone of voice, guardian |
| **Productos y Servicios** | Product/service catalog | Editable product list |
| **Revenue Streams** | Revenue sources & trends | Stream details, amounts, progress |

**Inteligencia** — what's happening outside your business

| Space | Purpose | Key Content |
|-------|---------|-------------|
| **Mercado** | Market intelligence | Industry, trends, opportunities, studies, audiences |
| **Competencia** | Competitive intelligence | Landscape analysis, real-time monitoring |

**Ejecución** — what you're doing about it

| Space | Purpose | Key Content |
|-------|---------|-------------|
| **Campaigns** | Plan, create, distribute, monitor | Strategy, budget, matrix, calendar, list |
| **Sales** | Manage sales pipeline | Pipeline, leads, proposals |

**Cuenta** stays in the avatar dropdown (settings, billing, team, integrations).

Content creation without a campaign is available via quick actions on Home.
```

- [ ] **Step 2: Commit**

```bash
git add PROJECT_VISION.md
git commit -m "docs: update PROJECT_VISION.md — replace 6 Spaces with 9-space sidebar model"
```

---

### Task 13: Final verification

- [ ] **Step 1: Run the dev server and test all routes**

Run: `npm run dev` (or whatever the start command is)

Test each route:
1. `/client` — Home with KPIs, activity, quick actions
2. `/client/business-model` — Canvas tab + Unit Economics tab
3. `/client/brand` — DNA, Identidad, Voz, Guardian, Marketplace (no Audiences, no Products)
4. `/client/productos` — Product catalog
5. `/client/revenue` — Revenue streams with totals
6. `/client/mercado` — 5 tabs: Industria, Tendencias, Oportunidades, Estudios, Audiencias
7. `/client/competencia` — 2 tabs: Landscape, Monitor
8. `/client/campaigns` — 5 tabs: Estrategia, Budget, Matrix, Calendar, Lista
9. `/client/sales` — Pipeline, Leads, Proposals (unchanged)

Verify:
- Sidebar renders on all pages with correct active state highlighting
- Group labels display correctly
- All navigation links work
- No console errors
- Visual style is unchanged (same colors, fonts, shadows, card styles)

- [ ] **Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(portal): address final navigation issues"
```
