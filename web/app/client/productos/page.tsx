"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const products = [
  { name: "Café en grano (250g, 500g, 1kg)", type: "Producto" },
  { name: "Suscripción mensual de café", type: "Servicio" },
  { name: "Cursos de barismo", type: "Servicio" },
  { name: "Merch (tazas, camisetas)", type: "Producto" },
  { name: "Café preparado en tienda", type: "Producto" },
];

export default function ProductosPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Productos y Servicios</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="primary" size="sm" icon={<Plus size={13} />}>Agregar</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* ── Product List ── */}
      <PortalCard>
        <SectionHeader title="Catálogo de productos y servicios" />
        <div className="space-y-0">
          {products.map((p, i) => (
            <div key={p.name} className={cn("flex items-center gap-3 py-2", i < products.length - 1 && "border-b border-[#f0f0f0]")}>
              <p className="text-[10px] text-portal-text flex-1">{p.name}</p>
              <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{p.type}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
          <button className="flex items-center gap-1.5 text-[10px] font-medium text-portal-text-dim hover:text-portal-accent transition-colors">
            <Plus size={11} /> Agregar producto o servicio
          </button>
        </div>
      </PortalCard>
    </div>
  );
}
