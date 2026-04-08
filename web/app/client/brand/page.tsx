"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { ToneSlider } from "@/components/portal/tone-slider";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import {
  Download, MessageCircle, Shield, TrendingUp, Pencil,
  Image, Smartphone, Monitor, ShoppingBag, FileCheck, Layers,
  ThumbsUp, ThumbsDown, BookOpen, Eye,
} from "lucide-react";

export default function BrandPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const brand = mockBrands.find((b) => b.id === brandId) || mockBrands[0];
  const bg = brand.colors[0]?.hex || "#3E2723";

  return (
    <div className="space-y-5">
      {/* ══ HEADER: Brand name + score + actions ══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
            <span className="text-white font-bold text-lg">{brand.name[0]}</span>
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">{brand.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm font-[800] text-portal-text">{brand.score}</span>
              <span className="text-[10px] text-portal-text-dim">/100</span>
              <svg width="80" height="18" viewBox="0 0 80 18">
                <path d="M0,15 L13,13 L27,12 L40,11 L53,8 L67,5 L80,3 L80,18 L0,18 Z" fill="#f5a623" opacity="0.1" />
                <path d="M0,15 L13,13 L27,12 L40,11 L53,8 L67,5 L80,3" fill="none" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="80" cy="3" r="2" fill="#f5a623" />
              </svg>
              <span className="text-[10px] font-semibold text-[#00c2a8] flex items-center gap-0.5"><TrendingUp size={10} />+12pts</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PortalButton variant="secondary" size="sm" icon={<Download size={13} />}>Brand kit</PortalButton>
          <PortalButton variant="primary" size="sm" icon={<MessageCircle size={13} />}>Copilot</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* ══ ROW 1: Brand DNA (2/3) + Arquetipo & Persona (1/3) ══ */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <PortalCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-portal-text">Brand DNA</p>
              <PortalButton variant="secondary" size="sm" icon={<Pencil size={11} />}>Editar</PortalButton>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-0.5">Propósito</p>
                <p className="text-[11px] text-portal-text leading-relaxed">Reconectar a las personas con el origen de lo que consumen, empezando por el café.</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-0.5">Promesa</p>
                <p className="text-[11px] text-portal-text leading-relaxed">En cada taza, el sabor honesto del café costarricense de especialidad.</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-0.5">Visión</p>
                <p className="text-[11px] text-portal-text leading-relaxed">Ser la marca de café de especialidad más querida de Costa Rica.</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-0.5">Misión</p>
                <p className="text-[11px] text-portal-text leading-relaxed">Producir café excepcional con trazabilidad completa, apoyando a productores locales.</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Valores</p>
                <div className="flex gap-2">
                  {["Autenticidad", "Calidad", "Sostenibilidad", "Comunidad", "Transparencia"].map((v) => (
                    <span key={v} className="text-[10px] font-medium bg-[#f5f5f7] text-portal-text-secondary px-2.5 py-1 rounded-lg">{v}</span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Creencias</p>
                <div className="flex gap-4">
                  {["El buen café cuenta una historia de origen", "La transparencia genera confianza real", "Lo artesanal puede escalar sin perder alma"].map((b) => (
                    <div key={b} className="flex items-start gap-1.5 flex-1">
                      <div className="w-1 h-1 rounded-full bg-portal-accent mt-1.5 shrink-0" />
                      <p className="text-[10px] text-portal-text-secondary">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PortalCard>
        </div>

        {/* Archetype + Personification */}
        <PortalCard>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Arquetipo</p>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#fafafa]">
                <span className="text-xl">🌿</span>
                <div>
                  <p className="text-xs font-semibold text-portal-text">El Explorador</p>
                  <p className="text-[9px] text-portal-text-muted">Autenticidad, libertad, descubrimiento</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Personificación</p>
              <p className="text-[10px] text-portal-text-secondary italic leading-relaxed">
                &ldquo;Un barista viajero de 35 años que conoce cada finca. Viste casual con estilo, habla con pasión sin pretensión.&rdquo;
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Positioning</p>
              <p className="text-[10px] text-portal-text leading-relaxed">{brand.positioning}</p>
            </div>
          </div>
        </PortalCard>
      </div>

      {/* ══ ROW 2: Identity (Logo + Applications | Colors + Typo) ══ */}
      <div className="grid grid-cols-3 gap-4">
        {/* Logo + Applications */}
        <div className="col-span-2">
          <PortalCard>
            <div className="flex gap-5">
              {/* Logo preview */}
              <div className="shrink-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Logo</p>
                <div className="w-28 h-28 bg-[#fafafa] rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-portal-text">{brand.name[0]}</span>
                </div>
              </div>
              {/* Applications grid */}
              <div className="flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Aplicaciones</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Principal", icon: Image, ok: true },
                    { name: "Invertido", icon: Monitor, ok: false },
                    { name: "Monocromático", icon: FileCheck, ok: true },
                    { name: "Favicon", icon: Smartphone, ok: true },
                    { name: "Packaging", icon: ShoppingBag, ok: false },
                    { name: "Redes sociales", icon: Layers, ok: true },
                  ].map((app) => {
                    const Icon = app.icon;
                    return (
                      <div key={app.name} className={cn("flex items-center gap-2 p-2 rounded-lg", app.ok ? "bg-[#fafafa]" : "bg-[#fff8eb]")}>
                        <Icon size={13} className={app.ok ? "text-portal-text-muted" : "text-[#e09600]"} />
                        <span className="text-[9px] text-portal-text">{app.name}</span>
                        <span className={cn("text-[7px] font-bold ml-auto", app.ok ? "text-[#00c2a8]" : "text-[#e09600]")}>{app.ok ? "✓" : "!"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </PortalCard>
        </div>

        {/* Colors + Typography */}
        <div className="space-y-4">
          <PortalCard>
            <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Paleta</p>
            <div className="flex gap-2">
              {brand.colors.map((c) => (
                <div key={c.hex} className="text-center flex-1">
                  <div className="h-10 rounded-lg" style={{ backgroundColor: c.hex }} />
                  <p className="text-[8px] text-portal-text-muted mt-1">{c.name}</p>
                  <p className="text-[7px] text-portal-text-dim">{c.hex}</p>
                </div>
              ))}
            </div>
          </PortalCard>
          <PortalCard>
            <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Tipografía</p>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-portal-text">{brand.fonts.heading}</span>
                <span className="text-[8px] text-portal-text-dim">Headings</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-portal-text-secondary">{brand.fonts.body}</span>
                <span className="text-[8px] text-portal-text-dim">Body</span>
              </div>
            </div>
          </PortalCard>
        </div>
      </div>

      {/* ══ ROW 4: Tone + Do's/Don'ts (side by side) ══ */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tone of voice */}
        <PortalCard>
          <SectionHeader title="Tono de voz" action={<PortalButton variant="secondary" size="sm">Editar →</PortalButton>} />
          <div className="space-y-4">
            <ToneSlider labelLeft="Formal" labelRight="Casual" value={brand.toneScores.formal} />
            <ToneSlider labelLeft="Serio" labelRight="Divertido" value={brand.toneScores.serious} />
            <ToneSlider labelLeft="Técnico" labelRight="Accesible" value={brand.toneScores.technical} />
          </div>
        </PortalCard>

        {/* Do's & Don'ts */}
        <PortalCard>
          <SectionHeader title="Guía de uso" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <ThumbsUp size={11} className="text-[#00c2a8]" />
                <p className="text-[9px] font-semibold uppercase text-[#00c2a8]">Correcto</p>
              </div>
              <div className="space-y-1.5">
                {["Tipografía Playfair para títulos", "Espacio de respeto del logo (1x)", "Fotos con luz natural, tonos cálidos"].map((d) => (
                  <div key={d} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#edfbf8]">
                    <div className="w-1 h-1 rounded-full bg-[#00c2a8] mt-1.5 shrink-0" />
                    <p className="text-[9px] text-portal-text">{d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-2">
                <ThumbsDown size={11} className="text-[#ff6b6b]" />
                <p className="text-[9px] font-semibold uppercase text-[#ff6b6b]">Evitar</p>
              </div>
              <div className="space-y-1.5">
                {["Distorsionar o rotar el logo", "Colores fuera de la paleta", "Tono excesivamente formal"].map((d) => (
                  <div key={d} className="flex items-start gap-1.5 p-2 rounded-lg bg-[#fff0f0]">
                    <div className="w-1 h-1 rounded-full bg-[#ff6b6b] mt-1.5 shrink-0" />
                    <p className="text-[9px] text-portal-text">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PortalCard>
      </div>

      {/* ══ ROW 5: Brand Score Improvements (full width) ══ */}
      <PortalCard>
        <SectionHeader title="Oportunidades de mejora" />
        <div className="space-y-1.5">
          {[
            { text: "Guía de tono de voz para redes", impact: "+8", area: "Tono", color: "#7c5cfc" },
            { text: "Logo para fondos oscuros", impact: "+5", area: "Visual", color: "#00c2a8" },
            { text: "Propuesta de valor diferenciada", impact: "+4", area: "Mensaje", color: "#f5a623" },
            { text: "Estilo fotográfico unificado", impact: "+3", area: "Visual", color: "#00c2a8" },
          ].map((idea) => (
            <div key={idea.text} className="flex items-center gap-2 group">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: idea.color }} />
              <p className="text-[10px] text-portal-text flex-1">{idea.text}</p>
              <span className="text-[7px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: idea.color + "12", color: idea.color }}>{idea.area}</span>
              <span className="text-[10px] font-bold text-[#00c2a8]">{idea.impact}</span>
              <span className="text-[9px] text-portal-accent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Aplicar →</span>
            </div>
          ))}
        </div>
      </PortalCard>

      {/* ══ ROW 6: Guardian + Manual (side by side) ══ */}
      <div className="grid grid-cols-3 gap-4">
        {/* Brand Guardian */}
        <PortalCard>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-[#00c2a8]" />
            <p className="text-sm font-semibold text-portal-text">Brand Guardian</p>
            <span className="text-[9px] font-medium text-[#00c2a8] bg-[#edfbf8] px-1.5 py-0.5 rounded ml-auto">Activo</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Validaciones", value: 24 }, { label: "Ajustes", value: 3 }, { label: "Violaciones", value: 0 }, { label: "Compliance", value: "96%" }].map((stat) => (
              <div key={stat.label}>
                <p className="text-base font-[800] text-portal-text">{stat.value}</p>
                <p className="text-[9px] text-portal-text-dim">{stat.label}</p>
              </div>
            ))}
          </div>
        </PortalCard>

        {/* Brand Manual */}
        <div className="col-span-2">
          <PortalCard>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                <BookOpen size={18} className="text-portal-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-portal-text">Manual de marca — {brand.name}</p>
                <p className="text-[9px] text-portal-text-muted">12 páginas · Auto-generado · Actualizado hace 3 días</p>
              </div>
              <PortalButton variant="secondary" size="sm" icon={<Eye size={12} />}>Preview</PortalButton>
              <PortalButton variant="primary" size="sm" icon={<Download size={12} />}>PDF</PortalButton>
            </div>
            <div className="flex gap-2">
              {["Identidad", "Logo", "Colores", "Tipografía", "Tono de voz", "Fotografía", "Do's & Don'ts", "Templates"].map((s) => (
                <span key={s} className="text-[8px] font-medium bg-[#fafafa] text-portal-text-muted px-2 py-1 rounded-md flex-1 text-center">{s}</span>
              ))}
            </div>
          </PortalCard>
        </div>
      </div>

      {/* ══ ROW 7: Marketplace ══ */}
      <SectionHeader title="Marketplace de branding" action={<PortalButton variant="secondary" size="sm">Ver todos →</PortalButton>} />
      <div className="grid grid-cols-3 gap-3">
        {[
          { name: "Workshop: Brand DNA", desc: "Definir propósito, valores, arquetipo y personificación.", time: "4h", price: "$350", tag: "Crear", color: "#7c5cfc", badge: "Recomendado" },
          { name: "Auditoría de marca", desc: "Análisis de identidad visual, verbal y posicionamiento.", time: "1 sem", price: "$500", tag: "Evaluar", color: "#00c2a8", badge: null },
          { name: "Workshop: Tono de voz", desc: "Define cómo habla tu marca. Guía de estilo incluida.", time: "2h", price: "$200", tag: "Definir", color: "#f5a623", badge: null },
          { name: "Diseño de identidad", desc: "Logo, paleta, tipografía, aplicaciones y manual.", time: "2-3 sem", price: "$1,200", tag: "Crear", color: "#7c5cfc", badge: null },
          { name: "Naming y estrategia verbal", desc: "Nombre, tagline, arquitectura de mensajes.", time: "1 sem", price: "$600", tag: "Definir", color: "#f5a623", badge: null },
          { name: "Brand Growth Sprint", desc: "Plan 90 días: posicionamiento, contenido, campañas.", time: "3 meses", price: "$2,500", tag: "Crecer", color: "#ff6b6b", badge: "Popular" },
        ].map((s) => (
          <div key={s.name} className="p-4 rounded-xl bg-[#fafafa] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-portal-text">{s.name}</p>
                {s.badge && <span className="text-[7px] font-bold text-white bg-[#111] px-1.5 py-0.5 rounded">{s.badge}</span>}
              </div>
              <p className="text-xs font-[800] text-portal-text">{s.price}</p>
            </div>
            <p className="text-[9px] text-portal-text-muted mb-2">{s.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="text-[7px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: s.color + "12", color: s.color }}>{s.tag}</span>
                <span className="text-[7px] font-medium bg-[#f0f0f0] text-portal-text-dim px-1.5 py-0.5 rounded">{s.time}</span>
              </div>
              <span className="text-[9px] text-portal-accent opacity-0 group-hover:opacity-100 transition-opacity">Contratar →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
