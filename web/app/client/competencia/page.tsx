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
        <PortalCard>
          <SectionHeader title="Landscape" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Competitive landscape — who they are, positioning, benchmark analysis — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "monitor" && (
        <PortalCard>
          <SectionHeader title="Monitor" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Competition Listener real-time feed — placeholder
          </div>
        </PortalCard>
      )}
    </div>
  );
}
