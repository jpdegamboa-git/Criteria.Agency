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
  Cog, Gem, Users, Heart, Truck, Wallet, PiggyBank,
  Handshake, Lightbulb,
  Frown, Smile, Package, ShieldCheck, Sparkles,
  LayoutGrid, TrendingUp,
} from "lucide-react";

// ── BMC Block Data ──

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

// ── Tabs ──

const tabs = [
  { id: "canvas", label: "Canvas", icon: LayoutGrid },
  { id: "unit-economics", label: "Unit Economics", icon: TrendingUp },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function BusinessModelPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("canvas");

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Business Model</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="primary" size="sm" icon={<MessageCircle size={13} />}>Editar con Copilot</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── Canvas Tab ── */}
      {activeTab === "canvas" && (
        <div className="space-y-5">
          {/* ══ BUSINESS MODEL CANVAS (Osterwalder grid) ══ */}
          <SectionHeader title="Business Model Canvas" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>} />
          <PortalCard noPadding>
            <div className="p-4">
              {/* Top row: 5 columns */}
              <div className="grid grid-cols-10 gap-3 mb-3">
                {/* Key Partners (2 cols) */}
                <div className="col-span-2 row-span-2">
                  <BMCBlock {...bmcBlocks.partners} className="h-full" />
                </div>
                {/* Key Activities (2 cols, top) */}
                <div className="col-span-2">
                  <BMCBlock {...bmcBlocks.activities} />
                </div>
                {/* Value Proposition (2 cols, span 2 rows) */}
                <div className="col-span-2 row-span-2">
                  <BMCBlock {...bmcBlocks.value} className="h-full" />
                </div>
                {/* Customer Relationships (2 cols, top) */}
                <div className="col-span-2">
                  <BMCBlock {...bmcBlocks.relationships} />
                </div>
                {/* Customer Segments (2 cols, span 2 rows) */}
                <div className="col-span-2 row-span-2">
                  <BMCBlock {...bmcBlocks.segments} className="h-full" />
                </div>
                {/* Key Resources (2 cols, bottom) */}
                <div className="col-span-2">
                  <BMCBlock {...bmcBlocks.resources} />
                </div>
                {/* Channels (2 cols, bottom) */}
                <div className="col-span-2">
                  <BMCBlock {...bmcBlocks.channels} />
                </div>
              </div>
              {/* Bottom row: Costs + Revenue */}
              <div className="grid grid-cols-2 gap-3">
                <BMCBlock {...bmcBlocks.costs} />
                <BMCBlock {...bmcBlocks.revenue} />
              </div>
            </div>
          </PortalCard>

          {/* ══ VALUE PROPOSITION CANVAS (zoom-in) ══ */}
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

      {/* ── Unit Economics Tab ── */}
      {activeTab === "unit-economics" && (
        <div className="space-y-5">
          <SectionHeader title="Unit Economics" />
          <PortalCard>
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
        </div>
      )}
    </div>
  );
}
