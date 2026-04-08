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
  { name: "Café en grano (250g, 500g, 1kg)", type: "Producto", description: "Origen único, tostado semanal. Disponible en tueste claro, medio y oscuro.", price: "₡4,500 – ₡15,000" },
  { name: "Suscripción mensual de café", type: "Servicio", description: "Entrega mensual personalizada según perfil de sabor del cliente.", price: "₡6,500/mes" },
  { name: "Cursos de barismo", type: "Servicio", description: "Talleres presenciales de 4 horas. Básico, intermedio y avanzado.", price: "₡25,000" },
  { name: "Merch (tazas, camisetas)", type: "Producto", description: "Cerámica artesanal y textiles con diseño de marca.", price: "₡5,000 – ₡12,000" },
  { name: "Café preparado en tienda", type: "Producto", description: "Espresso, filtrado, cold brew y bebidas especiales.", price: "₡1,800 – ₡3,500" },
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

      {/* ── Product Grid ── */}
      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => (
          <PortalCard key={p.name}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-portal-text">{p.name}</p>
                <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded mt-1 inline-block">{p.type}</span>
              </div>
              <p className="text-xs font-[800] text-portal-text whitespace-nowrap">{p.price}</p>
            </div>
            <p className="text-[10px] text-portal-text-muted leading-relaxed">{p.description}</p>
          </PortalCard>
        ))}

        {/* Add new */}
        <button className="border-2 border-dashed border-[#e0e0e0] rounded-2xl flex flex-col items-center justify-center gap-2 py-8 hover:border-portal-accent hover:bg-[#fafafa] transition-all cursor-pointer group">
          <Plus size={20} className="text-portal-text-dim group-hover:text-portal-accent transition-colors" />
          <span className="text-[11px] font-medium text-portal-text-dim group-hover:text-portal-accent transition-colors">Agregar producto o servicio</span>
        </button>
      </div>
    </div>
  );
}
