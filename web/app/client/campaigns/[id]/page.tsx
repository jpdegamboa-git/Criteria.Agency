"use client";

import { use, useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { StateBadge } from "@/components/portal/state-badge";
import { CampaignStepper } from "@/components/portal/campaign-stepper";
import { ActivationChip } from "@/components/portal/activation-chip";
import { mockCampaigns } from "@/lib/portal-mock-data";
import { ArrowLeft, Pause, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PortalButton } from "@/components/portal/portal-button";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaign = mockCampaigns.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<"artifacts" | "historial" | "comentarios" | "metricas">("artifacts");

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-portal-text-muted">Campaña no encontrada</p>
        <Link href="/client/campaigns" className="text-xs text-portal-accent hover:underline mt-2 inline-block">← Volver a Campaigns</Link>
      </div>
    );
  }

  const steps = [
    { label: "Brief", status: "completed" as const },
    { label: "Concepto", status: "completed" as const },
    { label: "Guion", status: "active" as const },
    { label: "Storyboard", status: "pending" as const },
    { label: "Edición", status: "pending" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/client/campaigns" className="flex items-center gap-1 text-xs text-portal-text-muted hover:text-portal-text mb-3">
          <ArrowLeft size={14} />Campaigns
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">{campaign.name}</h1>
              <StateBadge state={campaign.state} />
            </div>
            <p className="text-sm text-portal-text-muted">{campaign.objective}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{campaign.startDate} → {campaign.endDate}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <PortalButton variant="secondary" icon={<Pause size={14} />}>Pausar</PortalButton>
            <PortalButton variant="primary" icon={<MessageCircle size={14} />}>Hablar con Copilot</PortalButton>
          </div>
        </div>
      </div>

      <PortalCard>
        <div className="flex justify-center"><CampaignStepper steps={steps} /></div>
      </PortalCard>

      <PortalCard className="border-portal-accent border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-portal-text">Gate 3: Guion</p>
            <p className="text-[11px] text-portal-text-muted mt-0.5">Revisión del guion final antes de pasar a storyboard</p>
            <p className="text-[10px] text-portal-accent mt-1 font-medium">Esperando tu revisión</p>
          </div>
          <div className="flex gap-2">
            <PortalButton variant="secondary">Ver anterior</PortalButton>
            <PortalButton variant="secondary">Pedir cambios</PortalButton>
            <PortalButton variant="accent">Revisar</PortalButton>
          </div>
        </div>
      </PortalCard>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-portal-accent rounded-full" style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }} />
        </div>
        <span className="text-xs text-portal-text-muted">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-1 border-b border-portal-border">
        {(["artifacts", "historial", "comentarios", "metricas"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors capitalize",
              activeTab === tab ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
            {tab === "metricas" ? "Métricas" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "artifacts" && (
        <div className="grid grid-cols-3 gap-3">{campaign.activations.map((act) => <ActivationChip key={act.id} activation={act} />)}</div>
      )}
      {activeTab === "historial" && <PortalCard><div className="text-xs text-portal-text-dim text-center py-8">Timeline of events — placeholder</div></PortalCard>}
      {activeTab === "comentarios" && <PortalCard><div className="text-xs text-portal-text-dim text-center py-8">Discussion thread — placeholder</div></PortalCard>}
      {activeTab === "metricas" && <PortalCard><div className="text-xs text-portal-text-dim text-center py-8">Campaign-specific performance data — placeholder</div></PortalCard>}
    </div>
  );
}
