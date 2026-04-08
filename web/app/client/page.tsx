"use client";

import { useSession } from "@/lib/auth-client";
import { KPICard } from "@/components/portal/kpi-card";
import { IdeaCard } from "@/components/portal/idea-card";
import { OpportunityCard } from "@/components/portal/opportunity-card";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { mockHomeKPIs, mockIdeas, mockOpportunities, mockActivity } from "@/lib/portal-mock-data";
import { RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ClientHome() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0] || "Usuario";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Buenos días, {firstName}</h1>
        <p className="text-sm text-portal-text-muted mt-1">4 campañas activas y 3 oportunidades nuevas</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {mockHomeKPIs.map((kpi) => (<KPICard key={kpi.label} {...kpi} />))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionHeader title="Ideas para ti" action={
            <button className="flex items-center gap-1 text-[11px] text-portal-text-muted hover:text-portal-text transition-colors">
              <RefreshCw size={12} />Más ideas
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

      <div className="grid grid-cols-2 gap-4">
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Rendimiento de campañas</p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">Chart placeholder — Area chart (alcance + engagement)</div>
        </PortalCard>
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Funnel de ventas</p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">Chart placeholder — Horizontal bars (Visitantes → Cerrados)</div>
        </PortalCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <PortalCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Producción de contenido</p>
            <div className="h-40 flex items-center justify-center text-portal-text-dim text-xs">Chart placeholder — Stacked bar by month and type</div>
          </PortalCard>
        </div>
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Inversión mensual</p>
          <div className="h-40 flex items-center justify-center text-portal-text-dim text-xs">Chart placeholder — Donut chart</div>
        </PortalCard>
      </div>

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
