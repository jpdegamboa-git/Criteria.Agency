"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { IdentityCard } from "@/components/portal/identity-card";
import { ToneSlider } from "@/components/portal/tone-slider";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { mockBrands } from "@/lib/portal-mock-data";
import { Download, MessageCircle, Shield, FileText, TrendingUp } from "lucide-react";

export default function BrandPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const brand = mockBrands.find((b) => b.id === brandId) || mockBrands[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Brand</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary hover:border-portal-text-dim transition-colors">
            <Download size={14} />Descargar brand kit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-portal-text text-white rounded-[10px] hover:opacity-80 transition-opacity">
            <MessageCircle size={14} />Editar con Copilot
          </button>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      <PortalCard>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#eee" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f5a623" strokeWidth="3" strokeDasharray={`${brand.score} ${100 - brand.score}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-[800] text-portal-text">{brand.score}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-portal-text">Brand Score</p>
              <p className="text-[11px] text-portal-text-muted">/100</p>
            </div>
          </div>
          <div className="flex gap-6">
            {[{ label: "Tono de voz", score: 82 }, { label: "Visual", score: 75 }, { label: "Mensaje", score: 77 }].map((sub) => (
              <div key={sub.label} className="text-center">
                <p className="text-lg font-[800] text-portal-text">{sub.score}</p>
                <p className="text-[10px] text-portal-text-muted">{sub.label}</p>
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-[#00c2a8] font-medium">
            <TrendingUp size={14} />+5pts
          </div>
        </div>
      </PortalCard>

      <div className="grid grid-cols-3 gap-4">
        <IdentityCard title="Logo">
          <div className="h-24 bg-gray-50 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-portal-text">{brand.name[0]}</span>
          </div>
          <p className="text-[11px] text-portal-text-muted mt-2">{brand.name}</p>
        </IdentityCard>
        <IdentityCard title="Paleta de colores">
          <div className="flex gap-3">
            {brand.colors.map((c) => (
              <div key={c.hex} className="text-center">
                <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: c.hex }} />
                <p className="text-[9px] text-portal-text-muted mt-1">{c.name}</p>
              </div>
            ))}
          </div>
        </IdentityCard>
        <IdentityCard title="Tipografía">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-portal-text-muted">Headings</p>
              <p className="text-base font-semibold text-portal-text">{brand.fonts.heading}</p>
            </div>
            <div>
              <p className="text-[10px] text-portal-text-muted">Body</p>
              <p className="text-sm text-portal-text-secondary">{brand.fonts.body}</p>
            </div>
          </div>
        </IdentityCard>
      </div>

      <PortalCard>
        <SectionHeader title="Tono de voz" action={<button className="text-[11px] font-semibold text-portal-accent hover:underline">Editar →</button>} />
        <div className="space-y-4">
          <ToneSlider labelLeft="Formal" labelRight="Casual" value={brand.toneScores.formal} />
          <ToneSlider labelLeft="Serio" labelRight="Divertido" value={brand.toneScores.serious} />
          <ToneSlider labelLeft="Técnico" labelRight="Accesible" value={brand.toneScores.technical} />
        </div>
      </PortalCard>

      <PortalCard>
        <SectionHeader title="Positioning" action={<button className="text-[11px] font-semibold text-portal-accent hover:underline">Editar →</button>} />
        <blockquote className="text-sm text-portal-text-secondary italic border-l-2 border-portal-accent pl-4">{brand.positioning}</blockquote>
      </PortalCard>

      <PortalCard>
        <SectionHeader title="Brand Guardian" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#00c2a8]" />
            <span className="text-xs font-medium text-[#00c2a8]">Activo</span>
          </div>
          <div className="flex gap-6">
            {[{ label: "Validaciones", value: 24 }, { label: "Ajustes", value: 3 }, { label: "Violaciones", value: 0 }, { label: "Compliance", value: "96%" }].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-[800] text-portal-text">{stat.value}</p>
                <p className="text-[10px] text-portal-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </PortalCard>

      <PortalCard>
        <SectionHeader title="Brand Manual" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-portal-text-muted" />
            <div>
              <p className="text-xs font-medium text-portal-text">Manual de marca — {brand.name}</p>
              <p className="text-[10px] text-portal-text-muted">Actualizado hace 3 días · 12 páginas · Auto-generado</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary hover:border-portal-text-dim transition-colors">Vista previa</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-portal-text text-white rounded-[10px] hover:opacity-80 transition-opacity">Descargar PDF</button>
          </div>
        </div>
      </PortalCard>
    </div>
  );
}
