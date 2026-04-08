"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { cn } from "@/lib/utils";
import { mockBrands, mockOpportunities } from "@/lib/portal-mock-data";
import { Globe, TrendingUp, Lightbulb, BookOpen, Users } from "lucide-react";

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
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Mercado</h1>
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

      {activeTab === "industria" && (
        <PortalCard>
          <SectionHeader title="Industria" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Industry overview, market size, key players — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "tendencias" && (
        <PortalCard>
          <SectionHeader title="Tendencias" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Macro and micro trends shaping the market — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "oportunidades" && (
        <div className="space-y-3">
          {mockOpportunities.map((opp) => (
            <PortalCard key={opp.id}>
              <div className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-1"
                  style={{
                    backgroundColor:
                      opp.type === "tendencia"
                        ? "#00c2a8"
                        : opp.type === "competencia"
                        ? "#7c5cfc"
                        : opp.type === "cultura"
                        ? "#ff6b6b"
                        : "#f5a623",
                  }}
                />
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-portal-text-muted">
                    {opp.type}
                  </span>
                  <h3 className="text-xs font-semibold text-portal-text mt-0.5">{opp.title}</h3>
                  <p className="text-[11px] text-portal-text-secondary mt-1">{opp.description}</p>
                </div>
                <button className="text-[11px] font-semibold text-portal-accent hover:underline whitespace-nowrap">
                  {opp.action} →
                </button>
              </div>
            </PortalCard>
          ))}
        </div>
      )}

      {activeTab === "estudios" && (
        <PortalCard>
          <SectionHeader title="Estudios" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Research cards — competitive analysis, audits, benchmarks — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "audiencias" && (
        <div className="space-y-4">
          <SectionHeader title="Públicos objetivo" />
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                segment: "Principal",
                name: "Profesional urbano 28-45",
                avatar: "👨‍💼",
                traits: [
                  "Valora calidad sobre precio",
                  "Compra online y en tienda",
                  "Instagram y LinkedIn activo",
                ],
                channels: ["Instagram", "E-commerce", "Tienda"],
                color: "#7c5cfc",
              },
              {
                segment: "Secundaria",
                name: "Foodie millennial 22-32",
                avatar: "🧑‍🍳",
                traits: [
                  "Explora nuevas experiencias",
                  "Comparte en redes sociales",
                  "Sensible a tendencias",
                ],
                channels: ["TikTok", "Instagram", "Eventos"],
                color: "#00c2a8",
              },
              {
                segment: "Nicho",
                name: "Barista profesional",
                avatar: "☕",
                traits: [
                  "Técnico, valora origen y proceso",
                  "Influenciador en su comunidad",
                  "Busca relación directa con productor",
                ],
                channels: ["YouTube", "Talleres", "Wholesale"],
                color: "#f5a623",
              },
            ].map((p) => (
              <PortalCard key={p.segment}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{p.avatar}</span>
                  <div>
                    <span
                      className="text-[8px] font-bold uppercase tracking-wide"
                      style={{ color: p.color }}
                    >
                      {p.segment}
                    </span>
                    <p className="text-xs font-semibold text-portal-text">{p.name}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3">
                  {p.traits.map((t) => (
                    <div key={t} className="flex items-start gap-1.5">
                      <div
                        className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <p className="text-[10px] text-portal-text-secondary">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {p.channels.map((ch) => (
                    <span
                      key={ch}
                      className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded"
                    >
                      {ch}
                    </span>
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
