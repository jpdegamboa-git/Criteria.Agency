"use client";

import { useSession } from "@/lib/auth-client";
import { KPICard } from "@/components/portal/kpi-card";
import { IdeaCard } from "@/components/portal/idea-card";
import { OpportunityCard } from "@/components/portal/opportunity-card";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalButton } from "@/components/portal/portal-button";
import { SectionHeader } from "@/components/portal/section-header";
import { mockHomeKPIs, mockIdeas, mockOpportunities, mockActivity, mockBrands } from "@/lib/portal-mock-data";
import {
  RefreshCw,
  ArrowRight,
  Plus,
  Pencil,
  DollarSign,
  ShoppingCart,
  Repeat,
  Gift,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// ── Revenue streams mock data ──

const revenueStreams = [
  {
    id: "rs1",
    name: "Venta directa en tienda",
    type: "Producto",
    icon: ShoppingCart,
    revenue: "₡2.4M",
    share: 45,
    trend: "+12%",
    color: "#7c5cfc",
  },
  {
    id: "rs2",
    name: "Suscripción mensual",
    type: "Recurrente",
    icon: Repeat,
    revenue: "₡1.1M",
    share: 21,
    trend: "+34%",
    color: "#00c2a8",
  },
  {
    id: "rs3",
    name: "Wholesale B2B",
    type: "Producto",
    icon: DollarSign,
    revenue: "₡980K",
    share: 18,
    trend: "+5%",
    color: "#f5a623",
  },
  {
    id: "rs4",
    name: "Merchandising",
    type: "Producto",
    icon: Gift,
    revenue: "₡520K",
    share: 10,
    trend: "-3%",
    color: "#ff6b6b",
  },
  {
    id: "rs5",
    name: "Cursos y talleres",
    type: "Servicio",
    icon: TrendingUp,
    revenue: "₡320K",
    share: 6,
    trend: "+22%",
    color: "#888",
  },
];

export default function ClientHome() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0] || "Usuario";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">
          Buenos días, {firstName}
        </h1>
        <p className="text-sm text-portal-text-muted mt-1">
          4 campañas activas y 3 oportunidades nuevas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {mockHomeKPIs.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Brands Section */}
      <div>
        <SectionHeader
          title="Mis marcas"
          action={
            <Link
              href="/client/brand"
              className="text-[11px] text-portal-accent hover:underline flex items-center gap-0.5"
            >
              Ver todas <ArrowRight size={10} />
            </Link>
          }
        />
        <div className="flex gap-3">
          {mockBrands.map((brand) => {
            const bg = brand.colors[0]?.hex || "#f5a623";
            return (
              <Link key={brand.id} href="/client/brand" className="group">
                <PortalCard className="w-48 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bg }}
                    >
                      <span className="text-white font-bold text-sm">{brand.name[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-portal-text truncate">{brand.name}</p>
                      <p className="text-[10px] text-portal-text-dim">Score: {brand.score}/100</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {brand.colors.map((c) => (
                      <div
                        key={c.hex}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <button className="mt-3 flex items-center gap-1 text-[10px] text-portal-text-muted group-hover:text-portal-accent transition-colors">
                    <Pencil size={10} /> Editar
                  </button>
                </PortalCard>
              </Link>
            );
          })}

          {/* Add new brand card */}
          <button className="w-48 rounded-2xl border-[1.5px] border-dashed border-[#ddd] flex flex-col items-center justify-center gap-2 py-8 text-portal-text-dim hover:border-portal-accent hover:text-portal-accent transition-all hover:-translate-y-0.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] flex items-center justify-center group-hover:bg-[#fff8eb] transition-colors">
              <Plus size={18} />
            </div>
            <span className="text-[11px] font-medium">Agregar marca</span>
          </button>
        </div>
      </div>

      {/* Business Model / Revenue Streams */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionHeader
            title="Revenue streams"
            action={
              <PortalButton variant="secondary" size="sm" icon={<Pencil size={12} />}>
                Editar modelo
              </PortalButton>
            }
          />
          <PortalCard>
            <div className="space-y-3">
              {revenueStreams.map((rs) => {
                const Icon = rs.icon;
                const isNeg = rs.trend.startsWith("-");
                return (
                  <div key={rs.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: rs.color + "15" }}
                    >
                      <Icon size={14} style={{ color: rs.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold text-portal-text truncate">
                          {rs.name}
                        </p>
                        <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">
                          {rs.type}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${rs.share}%`, backgroundColor: rs.color }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-[800] text-portal-text">{rs.revenue}</p>
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: isNeg ? "#ff6b6b" : "#00c2a8" }}
                      >
                        {rs.trend}
                      </p>
                    </div>
                    <span className="text-[10px] text-portal-text-dim w-8 text-right">
                      {rs.share}%
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Total */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] font-semibold text-portal-text-muted">Revenue total</p>
              <p className="text-lg font-[800] text-portal-text">₡5.3M</p>
            </div>
          </PortalCard>
        </div>

        {/* Business model summary */}
        <div>
          <SectionHeader title="Modelo de negocio" />
          <PortalCard>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">
                  Propuesta de valor
                </p>
                <p className="text-[11px] text-portal-text leading-relaxed">
                  Café de especialidad costarricense con trazabilidad completa y experiencia premium.
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">
                  Segmentos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["B2C Retail", "B2B Horeca", "D2C Online"].map((seg) => (
                    <span
                      key={seg}
                      className="text-[9px] font-medium bg-[#f5f5f7] text-portal-text-secondary px-2 py-1 rounded-md"
                    >
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">
                  Canales clave
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Tienda física", "E-commerce", "Wholesale", "Redes sociales"].map((ch) => (
                    <span
                      key={ch}
                      className="text-[9px] font-medium bg-[#f5f5f7] text-portal-text-secondary px-2 py-1 rounded-md"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">
                  Métricas clave
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-[800] text-portal-text">₡18K</p>
                    <p className="text-[9px] text-portal-text-dim">LTV promedio</p>
                  </div>
                  <div>
                    <p className="text-sm font-[800] text-portal-text">₡4.2K</p>
                    <p className="text-[9px] text-portal-text-dim">CAC promedio</p>
                  </div>
                  <div>
                    <p className="text-sm font-[800] text-portal-text">4.3x</p>
                    <p className="text-[9px] text-portal-text-dim">LTV:CAC ratio</p>
                  </div>
                  <div>
                    <p className="text-sm font-[800] text-portal-text">68%</p>
                    <p className="text-[9px] text-portal-text-dim">Retención 6m</p>
                  </div>
                </div>
              </div>
            </div>
          </PortalCard>
        </div>
      </div>

      {/* Ideas + Opportunities */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionHeader
            title="Ideas para ti"
            action={
              <button className="flex items-center gap-1 text-[11px] text-portal-text-muted hover:text-portal-text transition-colors">
                <RefreshCw size={12} />
                Más ideas
              </button>
            }
          />
          <div className="grid grid-cols-1 gap-3">
            {mockIdeas.map((idea) => (
              <IdeaCard key={idea.id} {...idea} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader
            title="Oportunidades"
            action={
              <Link
                href="/client/plan"
                className="text-[11px] text-portal-accent hover:underline flex items-center gap-0.5"
              >
                Ver todas <ArrowRight size={10} />
              </Link>
            }
          />
          <div className="space-y-3">
            {mockOpportunities.map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
            Rendimiento de campañas
          </p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">
            Chart placeholder — Area chart (alcance + engagement)
          </div>
        </PortalCard>
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
            Funnel de ventas
          </p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">
            Chart placeholder — Horizontal bars (Visitantes → Cerrados)
          </div>
        </PortalCard>
      </div>

      {/* Activity Feed */}
      <div>
        <SectionHeader title="Actividad reciente" />
        <div className="space-y-0">
          {mockActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-portal-text-dim" />
              <span className="text-[12px] text-portal-text-secondary flex-1">
                {item.description}
              </span>
              <span className="text-[10px] text-portal-text-dim">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
