"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { cn } from "@/lib/utils";
import { mockBrands } from "@/lib/portal-mock-data";
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
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Competencia</h1>
        <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
      </div>

      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-portal-text text-portal-text"
                : "border-transparent text-portal-text-muted hover:text-portal-text"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "landscape" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "Britt Coffee", position: "Premium masivo", threat: "Alta", color: "#ff6b6b", strengths: ["Distribución nacional", "Marca reconocida", "Exportación"], share: "15%" },
              { name: "Café Volio", position: "Artesanal local", threat: "Media", color: "#f5a623", strengths: ["Trazabilidad", "Comunidad fiel", "E-commerce"], share: "3%" },
              { name: "Doka Estate", position: "Turismo + retail", threat: "Baja", color: "#00c2a8", strengths: ["Tour de café", "B2B hoteles", "Experiencia"], share: "5%" },
            ].map((c) => (
              <PortalCard key={c.name}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-portal-text">{c.name}</p>
                    <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded mt-1 inline-block">{c.position}</span>
                  </div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.color + "15", color: c.color }}>Amenaza {c.threat}</span>
                </div>
                <div className="space-y-1 mt-3">
                  {c.strengths.map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <p className="text-[10px] text-portal-text-secondary">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-[#f0f0f0] flex justify-between">
                  <p className="text-[9px] text-portal-text-dim">Market share</p>
                  <p className="text-[10px] font-semibold text-portal-text">{c.share}</p>
                </div>
              </PortalCard>
            ))}
          </div>
          <PortalCard>
            <SectionHeader title="Benchmark comparativo" />
            <div className="text-xs text-portal-text-dim text-center py-8">
              Tabla de comparación de features, precios y posicionamiento — placeholder
            </div>
          </PortalCard>
        </div>
      )}

      {activeTab === "monitor" && (
        <div className="grid grid-cols-2 gap-4">
          <PortalCard>
            <SectionHeader title="Actividad reciente" />
            <div className="text-xs text-portal-text-dim text-center py-8">
              Competition Listener real-time feed — placeholder
            </div>
          </PortalCard>
          <PortalCard>
            <SectionHeader title="Alertas" />
            <div className="text-xs text-portal-text-dim text-center py-8">
              Competitor alerts and notifications — placeholder
            </div>
          </PortalCard>
        </div>
      )}
    </div>
  );
}
