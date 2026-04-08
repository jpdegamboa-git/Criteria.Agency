"use client";

import { useState } from "react";
import { KPICard } from "@/components/portal/kpi-card";
import { PortalCard } from "@/components/portal/portal-card";
import { FilterGroup } from "@/components/portal/filter-group";
import { BrandSelector } from "@/components/portal/brand-selector";
import { FunnelMatrix } from "@/components/portal/funnel-matrix";
import { CampaignCalendar } from "@/components/portal/campaign-calendar";
import { StateBadge } from "@/components/portal/state-badge";
import { mockBrands, mockCampaigns, mockActivations } from "@/lib/portal-mock-data";
import { Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ViewMode = "matrix" | "calendario" | "lista";

export default function CampaignsPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("matrix");

  const filtered = mockActivations.filter((a) => {
    if (mediaFilter !== "all" && a.mediaType !== mediaFilter) return false;
    if (onlyActive && a.state !== "ejecutar") return false;
    if (campaignFilter !== "all" && a.campaignId !== campaignFilter) return false;
    return true;
  });

  const filteredCampaigns = mockCampaigns.filter((c) => {
    if (onlyActive && c.state !== "ejecutar") return false;
    if (campaignFilter !== "all" && c.id !== campaignFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header: title left, brand+campaign dropdowns right */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Campaigns</h1>
        <div className="flex items-center gap-2">
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-[#e8e8e8] rounded-xl text-xs font-medium text-[#444] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all cursor-pointer appearance-none"
          >
            <option value="all">Todas las campañas</option>
            {mockCampaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters row: media type | active toggle | view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterGroup
          options={[
            { label: "All", value: "all" },
            { label: "Paid", value: "paid", dot: "#7c5cfc" },
            { label: "Owned", value: "owned", dot: "#00c2a8" },
            { label: "Earned", value: "earned", dot: "#ff6b6b" },
          ]}
          value={mediaFilter}
          onChange={setMediaFilter}
        />

        {/* Active-only toggle button */}
        <button
          onClick={() => setOnlyActive(!onlyActive)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all border",
            onlyActive
              ? "bg-[#111] text-white border-[#111] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              : "bg-white text-[#888] border-[#e8e8e8] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:text-[#444] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          )}
        >
          <Zap size={12} />
          Solo activas
        </button>

        {/* View toggle right-aligned */}
        <div className="ml-auto">
          <FilterGroup
            options={[
              { label: "Matrix", value: "matrix" },
              { label: "Calendar", value: "calendario" },
              { label: "List", value: "lista" },
            ]}
            value={view}
            onChange={(v) => setView(v as ViewMode)}
          />
        </div>
      </div>

      {/* View content */}
      {view === "matrix" && (
        <>
          <FunnelMatrix activations={filtered} />
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Awareness" value="89K" delta="+12%" trend="up" secondary="Impressions last 30d" />
            <KPICard label="Consideration" value="3.2%" delta="+0.4%" trend="up" secondary="Avg CTR" />
            <KPICard label="Conversion" value="3.8x" delta="+0.6x" trend="up" secondary="ROAS" />
            <KPICard label="Retention" value="42%" delta="+2%" trend="up" secondary="Email open rate" />
          </div>
          <PortalCard>
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-portal-accent mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-portal-text">Análisis de cobertura</p>
                <p className="text-[11px] text-portal-text-secondary mt-1">
                  22 celdas vacías de 32 posibles. Recomendación: Priorizar Display × Awareness y Email × Retention para mejorar cobertura del funnel.
                </p>
                <p className="text-[10px] text-portal-text-dim mt-1">10 activaciones / 32 celdas totales</p>
              </div>
            </div>
          </PortalCard>
        </>
      )}

      {view === "calendario" && (
        <PortalCard noPadding>
          <div className="p-5">
            <CampaignCalendar campaigns={filteredCampaigns} />
          </div>
        </PortalCard>
      )}

      {view === "lista" && (
        <div className="space-y-3">
          {filteredCampaigns.map((c) => (
            <Link key={c.id} href={`/client/campaigns/${c.id}`}>
              <PortalCard className="hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xs font-semibold text-portal-text">{c.name}</h3>
                      <StateBadge state={c.state} />
                    </div>
                    <p className="text-[11px] text-portal-text-muted">{c.objective}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-portal-text">
                      ${c.spent.toLocaleString()} / ${c.budget.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-portal-text-dim">{c.activations.length} activaciones</p>
                  </div>
                </div>
              </PortalCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
