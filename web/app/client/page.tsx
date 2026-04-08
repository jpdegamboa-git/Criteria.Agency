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
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

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

      {/* ── Quick stats + Brand Score sparkline ── */}
      <div className="flex items-center gap-6">
        {mockHomeKPIs.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-2">
            <span className="text-lg font-[800] text-portal-text leading-none">{kpi.value}</span>
            <span className="text-[10px] text-portal-text-muted">{kpi.label}</span>
            {kpi.delta && kpi.trend && (
              <span className={cn("text-[10px] font-medium", kpi.trend === "up" ? "text-[#00c2a8]" : kpi.trend === "down" ? "text-[#ff6b6b]" : "text-portal-text-muted")}>
                {kpi.delta}
              </span>
            )}
            {/* Inline sparkline for Brand Score */}
            {kpi.label === "Brand score" && (
              <svg width="60" height="20" viewBox="0 0 60 20" className="ml-1">
                <path d="M0,16 L10,14 L20,13 L30,12 L40,8 L50,5 L60,3 L60,20 L0,20 Z" fill="url(#miniGrad)" opacity="0.15" />
                <path d="M0,16 L10,14 L20,13 L30,12 L40,8 L50,5 L60,3" fill="none" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="60" cy="3" r="2" fill="#f5a623" />
                <defs><linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5a623" /><stop offset="100%" stopColor="#f5a623" stopOpacity="0" /></linearGradient></defs>
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* ── Blueprint summary (compact) ── */}
      <PortalCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-0.5">Propuesta de valor</p>
              <p className="text-[11px] text-portal-text">Café de especialidad costarricense con trazabilidad completa y experiencia premium.</p>
            </div>
            <div className="h-8 w-px bg-[#f0f0f0]" />
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-0.5">Revenue</p>
              <p className="text-base font-[800] text-portal-text">₡5.3M</p>
            </div>
            <div className="h-8 w-px bg-[#f0f0f0]" />
            <div className="flex gap-2">
              {["Tienda 45%", "Suscripción 21%", "B2B 18%"].map((s) => (
                <span key={s} className="text-[9px] font-medium bg-[#f5f5f7] text-portal-text-muted px-2 py-1 rounded-md">{s}</span>
              ))}
            </div>
          </div>
          <Link href="/client/business-model" className="text-[11px] text-portal-accent hover:underline flex items-center gap-0.5 shrink-0">
            Ver Business Model <ArrowRight size={10} />
          </Link>
        </div>
      </PortalCard>

      {/* ── Ideas y oportunidades (unified) ── */}
      <SectionHeader title="Ideas y oportunidades" action={
        <button className="flex items-center gap-1 text-[11px] text-portal-text-muted hover:text-portal-text transition-colors">
          <RefreshCw size={12} /> Actualizar
        </button>
      } />
      <PortalCard>
        <div className="space-y-0">
          {/* Ideas */}
          {mockIdeas.map((idea) => (
            <div key={idea.id} className="flex items-center gap-3 py-2.5 group border-b border-[#f0f0f0]">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-portal-accent" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-portal-text">{idea.title}</p>
                <p className="text-[10px] text-portal-text-muted mt-0.5 truncate">{idea.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {idea.urgent && idea.urgencyDays && (
                  <span className="text-[9px] font-medium text-[#e09600] bg-[#fff8eb] px-1.5 py-0.5 rounded">{idea.urgencyDays}d</span>
                )}
                <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{idea.tags.channel}</span>
                <span className="text-[8px] font-medium bg-[#fff8eb] text-[#e09600] px-1.5 py-0.5 rounded">Idea</span>
                <span className="text-[10px] text-portal-accent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Crear →</span>
              </div>
            </div>
          ))}
          {/* Opportunities */}
          {mockOpportunities.map((opp, i) => (
            <div key={opp.id} className={cn("flex items-center gap-3 py-2.5 group", i < mockOpportunities.length - 1 && "border-b border-[#f0f0f0]")}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                backgroundColor: opp.type === "tendencia" ? "#00c2a8" : opp.type === "competencia" ? "#7c5cfc" : opp.type === "cultura" ? "#ff6b6b" : "#f5a623",
              }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-portal-text">{opp.title}</p>
                <p className="text-[10px] text-portal-text-muted mt-0.5 truncate">{opp.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] font-medium uppercase px-1.5 py-0.5 rounded" style={{
                  backgroundColor: (opp.type === "tendencia" ? "#00c2a8" : opp.type === "competencia" ? "#7c5cfc" : opp.type === "cultura" ? "#ff6b6b" : "#f5a623") + "12",
                  color: opp.type === "tendencia" ? "#00c2a8" : opp.type === "competencia" ? "#7c5cfc" : opp.type === "cultura" ? "#ff6b6b" : "#f5a623",
                }}>{opp.type}</span>
                <span className="text-[10px] text-portal-accent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">{opp.action} →</span>
              </div>
            </div>
          ))}
        </div>
      </PortalCard>

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
