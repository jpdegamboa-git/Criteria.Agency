"use client";

import { useState } from "react";
import { KPICard } from "@/components/portal/kpi-card";
import { PortalCard } from "@/components/portal/portal-card";
import { FilterGroup } from "@/components/portal/filter-group";
import { PipelineKanban } from "@/components/portal/pipeline-kanban";
import { SectionHeader } from "@/components/portal/section-header";
import { mockDeals } from "@/lib/portal-mock-data";
import { Lightbulb } from "lucide-react";

export default function SalesPage() {
  const [viewFilter, setViewFilter] = useState("pipeline");
  const [tempFilter, setTempFilter] = useState("all");

  const filtered = mockDeals.filter((d) => {
    if (tempFilter !== "all" && d.temperature !== tempFilter) return false;
    return true;
  });

  const salesKPIs = [
    { label: "Leads", value: 23, delta: "+18%", trend: "up" as const },
    { label: "Calificados", value: 8, secondary: "35% de leads", trend: "up" as const },
    { label: "Pipeline value", value: "₡3.1M", secondary: "5 deals", trend: "up" as const },
    { label: "Won this month", value: "₡1.2M", secondary: "1 deal", trend: "up" as const },
    { label: "Avg deal size", value: "₡620K", delta: "+8%", trend: "up" as const },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Sales</h1>
      <div className="grid grid-cols-5 gap-4">{salesKPIs.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}</div>
      <div className="flex items-center gap-3">
        <FilterGroup options={[
          { label: "Pipeline", value: "pipeline" },
          { label: "Leads", value: "leads" },
          { label: "Proposals", value: "proposals" },
        ]} value={viewFilter} onChange={setViewFilter} />
        <FilterGroup options={[
          { label: "All", value: "all" },
          { label: "Hot", value: "hot", dot: "#ff6b6b" },
          { label: "Warm", value: "warm", dot: "#f5a623" },
          { label: "Cold", value: "cold", dot: "#7c5cfc" },
        ]} value={tempFilter} onChange={setTempFilter} />
      </div>
      {viewFilter === "pipeline" && <PipelineKanban deals={filtered} />}
      {viewFilter === "leads" && <PortalCard><div className="text-xs text-portal-text-dim text-center py-12">Lead sources — horizontal bar chart placeholder</div></PortalCard>}
      {viewFilter === "proposals" && <PortalCard><div className="text-xs text-portal-text-dim text-center py-12">Proposals list — placeholder</div></PortalCard>}
      <PortalCard>
        <SectionHeader title="Best Customers Origin" />
        <div className="text-xs text-portal-text-dim text-center py-8">Attribution table — Customer, Revenue, Touchpoint journey, Days to close — placeholder</div>
      </PortalCard>
      <PortalCard>
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-portal-accent mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-portal-text">Insight</p>
            <p className="text-[11px] text-portal-text-secondary mt-1">Referrals convierten 3x más rápido que leads fríos. Recomendación: crear programa de referidos para clientes actuales con incentivo de 10% de descuento.</p>
          </div>
        </div>
      </PortalCard>
    </div>
  );
}
