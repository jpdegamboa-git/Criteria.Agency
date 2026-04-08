"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { KPICard } from "@/components/portal/kpi-card";
import { IdeaCard } from "@/components/portal/idea-card";
import { OpportunityCard } from "@/components/portal/opportunity-card";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalButton } from "@/components/portal/portal-button";
import { SectionHeader } from "@/components/portal/section-header";
import { mockHomeKPIs, mockIdeas, mockOpportunities, mockActivity, mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
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
  Megaphone,
  Layers,
  Users,
  Shield,
} from "lucide-react";
import Link from "next/link";

// ── Revenue streams mock data ──

const revenueStreams = [
  { id: "rs1", name: "Venta directa en tienda", type: "Producto", icon: ShoppingCart, revenue: "₡2.4M", share: 45, trend: "+12%", color: "#7c5cfc" },
  { id: "rs2", name: "Suscripción mensual", type: "Recurrente", icon: Repeat, revenue: "₡1.1M", share: 21, trend: "+34%", color: "#00c2a8" },
  { id: "rs3", name: "Wholesale B2B", type: "Producto", icon: DollarSign, revenue: "₡980K", share: 18, trend: "+5%", color: "#f5a623" },
  { id: "rs4", name: "Merchandising", type: "Producto", icon: Gift, revenue: "₡520K", share: 10, trend: "-3%", color: "#ff6b6b" },
  { id: "rs5", name: "Cursos y talleres", type: "Servicio", icon: TrendingUp, revenue: "₡320K", share: 6, trend: "+22%", color: "#888" },
];

export default function ClientHome() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0] || "Usuario";
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // The selected brand object (null = all brands)
  const activeBrand = selectedBrand ? mockBrands.find((b) => b.id === selectedBrand) : null;

  return (
    <div className="space-y-6">
      {/* ── Header with greeting ── */}
      <div>
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">
          Buenos días, {firstName}
        </h1>
        <p className="text-sm text-portal-text-muted mt-1">
          4 campañas activas y 3 oportunidades nuevas
        </p>
      </div>

      {/* ── Brands (first — acts as global filter) ── */}
      <div>
        <SectionHeader
          title="Mis marcas"
          action={
            <Link href="/client/brand" className="text-[11px] text-portal-accent hover:underline flex items-center gap-0.5">
              Gestionar <ArrowRight size={10} />
            </Link>
          }
        />
        <div className="flex gap-3 items-stretch">
          {mockBrands.map((brand) => {
            const bg = brand.colors[0]?.hex || "#f5a623";
            const isSelected = selectedBrand === brand.id;
            return (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(isSelected ? null : brand.id)}
                className={cn(
                  "text-left rounded-2xl p-4 transition-all w-52",
                  isSelected
                    ? "bg-[#111] shadow-[0_4px_16px_rgba(0,0,0,0.25)] -translate-y-0.5"
                    : "bg-white portal-shadow hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : bg }}
                  >
                    <span className="text-white font-bold text-sm">{brand.name[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-xs font-semibold truncate", isSelected ? "text-white" : "text-portal-text")}>
                      {brand.name}
                    </p>
                    <p className={cn("text-[10px]", isSelected ? "text-white/60" : "text-portal-text-dim")}>
                      Score: {brand.score}/100
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1.5">
                    {brand.colors.map((c) => (
                      <div key={c.hex} className="w-4 h-4 rounded" style={{ backgroundColor: c.hex, opacity: isSelected ? 0.7 : 1 }} />
                    ))}
                  </div>
                  <Link
                    href="/client/brand"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-medium transition-colors",
                      isSelected ? "text-white/60 hover:text-white" : "text-portal-text-dim hover:text-portal-accent"
                    )}
                  >
                    <Pencil size={10} /> Editar
                  </Link>
                </div>
              </button>
            );
          })}

          {/* Add new brand */}
          <button className="w-44 rounded-2xl border-[1.5px] border-dashed border-[#ddd] flex flex-col items-center justify-center gap-2 text-portal-text-dim hover:border-portal-accent hover:text-portal-accent transition-all hover:-translate-y-0.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] flex items-center justify-center group-hover:bg-[#fff8eb] transition-colors">
              <Plus size={18} />
            </div>
            <span className="text-[11px] font-medium">Agregar marca</span>
          </button>
        </div>

        {/* Active filter indicator */}
        {activeBrand && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-portal-text-muted">Filtrando por:</span>
            <span className="text-[10px] font-semibold text-portal-text bg-[#f0f0f0] px-2 py-0.5 rounded-md flex items-center gap-1">
              {activeBrand.name}
              <button onClick={() => setSelectedBrand(null)} className="text-portal-text-dim hover:text-portal-text ml-0.5">×</button>
            </span>
          </div>
        )}
      </div>

      {/* ── Brand Score + Sparkline + Quick Ideas ── */}
      <div className="flex gap-4 items-stretch">
        {/* Score + Trend chart */}
        <PortalCard className="flex items-center gap-4 w-auto shrink-0">
          <div className="text-center shrink-0">
            <p className="text-[28px] font-[800] tracking-[-1px] text-portal-text leading-none">
              {activeBrand?.score || 78}
            </p>
            <p className="text-[9px] text-portal-text-dim mt-0.5">Brand Score</p>
          </div>
          {/* Sparkline SVG — 6 month trend */}
          <div className="shrink-0">
            <svg width="100" height="36" viewBox="0 0 100 36">
              {/* Grid lines */}
              <line x1="0" y1="9" x2="100" y2="9" stroke="#f0f0f0" strokeWidth="0.5" />
              <line x1="0" y1="18" x2="100" y2="18" stroke="#f0f0f0" strokeWidth="0.5" />
              <line x1="0" y1="27" x2="100" y2="27" stroke="#f0f0f0" strokeWidth="0.5" />
              {/* Area fill */}
              <path d="M0,30 L17,26 L34,24 L51,22 L68,16 L85,10 L100,7 L100,36 L0,36 Z"
                fill="url(#scoreGrad)" opacity="0.15" />
              {/* Line */}
              <path d="M0,30 L17,26 L34,24 L51,22 L68,16 L85,10 L100,7"
                fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Current dot */}
              <circle cx="100" cy="7" r="3" fill="#f5a623" />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5a623" />
                  <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px] text-portal-text-dim">Oct</span>
              <span className="text-[8px] text-portal-text-dim">Ene</span>
              <span className="text-[8px] text-portal-text-dim font-semibold text-portal-accent">Abr</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#00c2a8]">
            <TrendingUp size={12} /> +12pts
          </div>
        </PortalCard>

        {/* Quick ideas to improve */}
        <PortalCard className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
            Para mejorar tu score
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { text: "Guía de tono de voz", impact: "+8", area: "Tono", color: "#7c5cfc" },
              { text: "Logo para fondos oscuros", impact: "+5", area: "Visual", color: "#00c2a8" },
              { text: "Propuesta de valor", impact: "+4", area: "Mensaje", color: "#f5a623" },
            ].map((idea) => (
              <button
                key={idea.text}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f8fa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: idea.color }} />
                <span className="text-[10px] text-portal-text">{idea.text}</span>
                <span className="text-[9px] font-bold text-[#00c2a8]">+{idea.impact}</span>
              </button>
            ))}
          </div>
        </PortalCard>
      </div>

      {/* ── Quick stats (compact inline instead of 4 big cards) ── */}
      <div className="flex items-center gap-6">
        {mockHomeKPIs.map((kpi) => (
          <div key={kpi.label} className="flex items-baseline gap-2">
            <span className="text-lg font-[800] text-portal-text leading-none">{kpi.value}</span>
            <span className="text-[10px] text-portal-text-muted">{kpi.label}</span>
            {kpi.delta && kpi.trend && (
              <span className={cn("text-[10px] font-medium", kpi.trend === "up" ? "text-[#00c2a8]" : kpi.trend === "down" ? "text-[#ff6b6b]" : "text-portal-text-muted")}>
                {kpi.delta}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Business Model / Revenue Streams ── */}
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: rs.color + "15" }}>
                      <Icon size={14} style={{ color: rs.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold text-portal-text truncate">{rs.name}</p>
                        <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{rs.type}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
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
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] font-semibold text-portal-text-muted">Revenue total</p>
              <p className="text-lg font-[800] text-portal-text">₡5.3M</p>
            </div>
          </PortalCard>
        </div>

        {/* Business model summary */}
        <div>
          <SectionHeader
            title="Modelo de negocio"
            action={
              <PortalButton variant="secondary" size="sm" icon={<Pencil size={12} />}>
                Editar
              </PortalButton>
            }
          />
          <PortalCard>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Propuesta de valor</p>
                <p className="text-[11px] text-portal-text leading-relaxed">
                  Café de especialidad costarricense con trazabilidad completa y experiencia premium.
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Segmentos</p>
                <div className="flex flex-wrap gap-1.5">
                  {["B2C Retail", "B2B Horeca", "D2C Online"].map((seg) => (
                    <span key={seg} className="text-[9px] font-medium bg-[#f5f5f7] text-portal-text-secondary px-2 py-1 rounded-md">{seg}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Canales clave</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Tienda física", "E-commerce", "Wholesale", "Redes sociales"].map((ch) => (
                    <span key={ch} className="text-[9px] font-medium bg-[#f5f5f7] text-portal-text-secondary px-2 py-1 rounded-md">{ch}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Métricas clave</p>
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

      {/* ── Ideas + Opportunities ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionHeader title="Ideas para ti" action={
            <button className="flex items-center gap-1 text-[11px] text-portal-text-muted hover:text-portal-text transition-colors">
              <RefreshCw size={12} /> Más ideas
            </button>
          } />
          <div className="grid grid-cols-1 gap-3">
            {mockIdeas.map((idea) => (<IdeaCard key={idea.id} {...idea} />))}
          </div>
        </div>
        <div>
          <SectionHeader title="Oportunidades" action={
            <Link href="/client/plan" className="text-[11px] text-portal-accent hover:underline flex items-center gap-0.5">
              Ver todas <ArrowRight size={10} />
            </Link>
          } />
          <div className="space-y-3">
            {mockOpportunities.map((opp) => (<OpportunityCard key={opp.id} {...opp} />))}
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-2 gap-4">
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Rendimiento de campañas</p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">Chart placeholder — Area chart</div>
        </PortalCard>
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Funnel de ventas</p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">Chart placeholder — Horizontal bars</div>
        </PortalCard>
      </div>

      {/* ── Activity Feed ── */}
      <div>
        <SectionHeader title="Actividad reciente" />
        <div className="space-y-0">
          {mockActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-portal-text-dim" />
              <span className="text-[12px] text-portal-text-secondary flex-1">{item.description}</span>
              <span className="text-[10px] text-portal-text-dim">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
