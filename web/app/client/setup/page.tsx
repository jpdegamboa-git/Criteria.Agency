"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { cn } from "@/lib/utils";
import { Building, Users, Plug, CreditCard, Bot, PaintBucket } from "lucide-react";

const sections = [
  { id: "cuenta", label: "Cuenta", icon: Building },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "integraciones", label: "Integraciones", icon: Plug },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "autonomia", label: "Autonomía AI", icon: Bot },
  { id: "apariencia", label: "Apariencia", icon: PaintBucket },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function SetupPage() {
  const [active, setActive] = useState<SectionId>("cuenta");

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Setup</h1>
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <nav className="space-y-1">
            {sections.map((sec) => (
              <button key={sec.id} onClick={() => setActive(sec.id)}
                className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  active === sec.id ? "bg-portal-text text-white" : "text-portal-text-muted hover:text-portal-text hover:bg-gray-50")}>
                <sec.icon size={14} />{sec.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="col-span-3">
          {active === "cuenta" && (
            <PortalCard>
              <SectionHeader title="Información de la empresa" />
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted block mb-1">Nombre</label>
                  <input className="w-full px-3 py-2 text-xs bg-gray-50 border border-portal-border rounded-xl outline-none focus:border-portal-accent transition-colors" defaultValue="Café Artesanal CR" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted block mb-1">Plan</label>
                  <p className="text-xs text-portal-text font-medium">PyME · $49/mes</p>
                </div>
              </div>
            </PortalCard>
          )}
          {active === "equipo" && (
            <PortalCard><SectionHeader title="Equipo" /><p className="text-xs text-portal-text-dim">Disponible en plan Mediana+</p></PortalCard>
          )}
          {active === "integraciones" && (
            <PortalCard>
              <SectionHeader title="Integraciones conectadas" />
              <div className="space-y-3">
                {[
                  { name: "Google Analytics", connected: true },
                  { name: "Meta Business Suite", connected: true },
                  { name: "Mailchimp", connected: false },
                  { name: "HubSpot CRM", connected: false },
                ].map((int) => (
                  <div key={int.name} className="flex items-center justify-between py-2 border-b border-portal-border last:border-0">
                    <span className="text-xs text-portal-text">{int.name}</span>
                    <button className={cn("text-[10px] font-semibold px-3 py-1 rounded-lg",
                      int.connected ? "bg-[#edfbf8] text-[#00a88e]" : "bg-gray-50 text-portal-text-muted hover:text-portal-text")}>
                      {int.connected ? "Conectado" : "Conectar"}
                    </button>
                  </div>
                ))}
              </div>
            </PortalCard>
          )}
          {active === "billing" && (
            <PortalCard><SectionHeader title="Billing" /><div className="text-xs text-portal-text-dim text-center py-8">Subscription management, invoices, payment method — placeholder</div></PortalCard>
          )}
          {active === "autonomia" && (
            <PortalCard>
              <SectionHeader title="Autonomía AI" />
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-portal-text">Modo de operación</p>
                    <p className="text-[10px] text-portal-text-muted">Define cuánto decide la IA de forma autónoma</p>
                  </div>
                  <select className="px-3 py-1.5 bg-gray-50 border border-portal-border rounded-xl text-xs text-portal-text outline-none">
                    <option>AI decide + humano supervisa</option>
                    <option>AI recomienda + humano aprueba</option>
                  </select>
                </div>
              </div>
            </PortalCard>
          )}
          {active === "apariencia" && (
            <PortalCard>
              <SectionHeader title="Apariencia" />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-portal-text">Tema</p>
                  <p className="text-[10px] text-portal-text-muted">Light / Dark mode</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium bg-portal-text text-white rounded-lg">Light</button>
                  <button className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-portal-text-muted rounded-lg hover:text-portal-text">Dark</button>
                </div>
              </div>
            </PortalCard>
          )}
        </div>
      </div>
    </div>
  );
}
