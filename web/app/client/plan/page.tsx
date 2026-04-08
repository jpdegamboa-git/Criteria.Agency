"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { BudgetEqualizer } from "@/components/portal/budget-equalizer";
import { cn } from "@/lib/utils";
import { mockBrands, mockBudgetQ2, mockOpportunities } from "@/lib/portal-mock-data";
import { Target, Eye, BookOpen, BarChart3 } from "lucide-react";

const tabs = [
  { id: "estrategia", label: "Estrategia", icon: Target },
  { id: "budget", label: "Budget", icon: BarChart3 },
  { id: "mercados", label: "Mercados", icon: Eye },
  { id: "oportunidades", label: "Oportunidades", icon: BookOpen },
  { id: "estudios", label: "Estudios", icon: BookOpen },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PlanPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("estrategia");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Plan</h1>
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

      {activeTab === "estrategia" && (
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

          <PortalCard>
            <SectionHeader title="Audiencias" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { segment: "Principal", name: "Profesional urbano 28-45", traits: "Valora calidad, compra online, Instagram" },
                { segment: "Secundaria", name: "Foodie millennial 22-32", traits: "Explora cafés, TikTok, experiencias" },
                { segment: "Nicho", name: "Barista profesional", traits: "Técnico, valora origen, comunidad" },
              ].map((p) => (
                <div key={p.segment} className="border border-portal-border rounded-xl p-4">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-portal-accent">{p.segment}</span>
                  <p className="text-xs font-semibold text-portal-text mt-1">{p.name}</p>
                  <p className="text-[11px] text-portal-text-muted mt-1">{p.traits}</p>
                </div>
              ))}
            </div>
          </PortalCard>

          <PortalCard>
            <SectionHeader title="Panorama competitivo" />
            <div className="text-xs text-portal-text-dim text-center py-8">Competitor analysis cards — placeholder</div>
          </PortalCard>
        </div>
      )}

      {activeTab === "budget" && (
        <PortalCard>
          <SectionHeader title="Budget Allocator — Q2 2026" />
          <p className="text-[11px] text-portal-text-muted mb-4">
            Presupuesto anual: $30,667 · Q2: ${mockBudgetQ2.amount.toLocaleString()} ({mockBudgetQ2.percentage}%)
          </p>
          <BudgetEqualizer root={mockBudgetQ2} annualBudget={30667} />
        </PortalCard>
      )}

      {activeTab === "mercados" && (
        <PortalCard>
          <SectionHeader title="Mercados" />
          <div className="text-xs text-portal-text-dim text-center py-12">Industry data, market size, macro trends — placeholder</div>
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
    </div>
  );
}
