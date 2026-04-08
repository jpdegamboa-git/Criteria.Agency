"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { Pencil, ShoppingCart, Repeat, DollarSign, Gift, TrendingUp } from "lucide-react";

const revenueStreams = [
  { id: "rs1", name: "Venta directa en tienda", type: "Producto", icon: ShoppingCart, revenue: "₡2.4M", share: 45, trend: "+12%", color: "#7c5cfc" },
  { id: "rs2", name: "Suscripción mensual", type: "Recurrente", icon: Repeat, revenue: "₡1.1M", share: 21, trend: "+34%", color: "#00c2a8" },
  { id: "rs3", name: "Wholesale B2B", type: "Producto", icon: DollarSign, revenue: "₡980K", share: 18, trend: "+5%", color: "#f5a623" },
  { id: "rs4", name: "Merchandising", type: "Producto", icon: Gift, revenue: "₡520K", share: 10, trend: "-3%", color: "#ff6b6b" },
  { id: "rs5", name: "Cursos y talleres", type: "Servicio", icon: TrendingUp, revenue: "₡320K", share: 6, trend: "+22%", color: "#888" },
];

export default function RevenuePage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Revenue Streams</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* ── Revenue Stream List ── */}
      <PortalCard>
        <SectionHeader title="Fuentes de ingresos" />
        <div className="space-y-2.5">
          {revenueStreams.map((rs) => {
            const Icon = rs.icon;
            const isNeg = rs.trend.startsWith("-");
            return (
              <div key={rs.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: rs.color + "15" }}>
                  <Icon size={13} style={{ color: rs.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-portal-text truncate">{rs.name}</p>
                    <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{rs.type}</span>
                  </div>
                  <div className="mt-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${rs.share}%`, backgroundColor: rs.color }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-[800] text-portal-text">{rs.revenue}</p>
                  <p className="text-[10px] font-medium" style={{ color: isNeg ? "#ff6b6b" : "#00c2a8" }}>{rs.trend}</p>
                </div>
                <span className="text-[10px] text-portal-text-dim w-8 text-right">{rs.share}%</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f0]">
          <p className="text-[11px] font-semibold text-portal-text-muted">Total</p>
          <p className="text-lg font-[800] text-portal-text">₡5.3M</p>
        </div>
      </PortalCard>
    </div>
  );
}
