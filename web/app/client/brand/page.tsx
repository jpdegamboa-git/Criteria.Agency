"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { IdentityCard } from "@/components/portal/identity-card";
import { ToneSlider } from "@/components/portal/tone-slider";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import {
  Download,
  MessageCircle,
  Shield,
  FileText,
  TrendingUp,
  Pencil,
  Image,
  Smartphone,
  Monitor,
  ShoppingBag,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Layers,
  Eye,
} from "lucide-react";

// ── Sub-scores with sparklines ──
const subScores = [
  {
    label: "Tono de voz",
    score: 82,
    trend: "+3",
    color: "#7c5cfc",
    points: "M0,14 L12,12 L24,11 L36,9 L48,7 L60,5",
  },
  {
    label: "Visual",
    score: 75,
    trend: "+5",
    color: "#00c2a8",
    points: "M0,16 L12,15 L24,13 L36,11 L48,8 L60,5",
  },
  {
    label: "Mensaje",
    score: 77,
    trend: "+4",
    color: "#f5a623",
    points: "M0,15 L12,14 L24,14 L36,11 L48,9 L60,6",
  },
];

// ── Logo applications ──
const logoApplications = [
  { name: "Principal", desc: "Fondo claro, uso general", icon: Image, status: "ok" },
  { name: "Invertido", desc: "Fondo oscuro", icon: Monitor, status: "missing" },
  { name: "Monocromático", desc: "Negro o blanco sólido", icon: FileCheck, status: "ok" },
  { name: "Ícono / Favicon", desc: "Versión compacta, apps", icon: Smartphone, status: "ok" },
  { name: "Packaging", desc: "Etiquetas, empaques", icon: ShoppingBag, status: "missing" },
  { name: "Redes sociales", desc: "Avatar y covers", icon: Layers, status: "ok" },
];

// ── Products & Services ──
const products = [
  { name: "Café en grano (250g, 500g, 1kg)", type: "Producto" },
  { name: "Suscripción mensual de café", type: "Servicio" },
  { name: "Cursos de barismo", type: "Servicio" },
  { name: "Merch (tazas, camisetas, accesorios)", type: "Producto" },
  { name: "Café preparado en tienda", type: "Producto" },
];

// ── Do's & Don'ts ──
const dosAndDonts = [
  { type: "do", text: "Usar siempre la tipografía Playfair Display para títulos" },
  { type: "do", text: "Mantener espacio de respeto alrededor del logo (1x altura)" },
  { type: "do", text: "Usar fotos con luz natural y tonos cálidos" },
  { type: "dont", text: "Distorsionar o rotar el logo" },
  { type: "dont", text: "Usar colores que no estén en la paleta aprobada" },
  { type: "dont", text: "Escribir mensajes en tono excesivamente formal o corporativo" },
];

// ── Score improvement ideas ──
const scoreImprovements = [
  { text: "Definir guía de tono de voz para redes sociales", impact: "+8", area: "Tono", color: "#7c5cfc" },
  { text: "Crear variaciones de logo para fondos oscuros", impact: "+5", area: "Visual", color: "#00c2a8" },
  { text: "Documentar propuesta de valor diferenciada", impact: "+4", area: "Mensaje", color: "#f5a623" },
  { text: "Unificar estilo fotográfico en todas las plataformas", impact: "+3", area: "Visual", color: "#00c2a8" },
];

export default function BrandPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const brand = mockBrands.find((b) => b.id === brandId) || mockBrands[0];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Brand</h1>
        <div className="flex items-center gap-3">
          <PortalButton variant="secondary" icon={<Download size={14} />}>Descargar brand kit</PortalButton>
          <PortalButton variant="primary" icon={<MessageCircle size={14} />}>Editar con Copilot</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* ── Brand Score with sub-scores + sparklines + improvement ideas ── */}
      <PortalCard>
        <div className="flex items-center gap-4 pb-4 border-b border-[#f0f0f0]">
          {/* Main score */}
          <div className="text-center shrink-0">
            <p className="text-[28px] font-[800] tracking-[-1px] text-portal-text leading-none">{brand.score}</p>
            <p className="text-[9px] text-portal-text-dim mt-0.5">Brand Score</p>
          </div>
          {/* Sub-scores with mini sparklines */}
          <div className="flex gap-5 flex-1">
            {subScores.map((sub) => (
              <div key={sub.label} className="flex items-center gap-2">
                <div>
                  <p className="text-base font-[800] text-portal-text">{sub.score}</p>
                  <p className="text-[9px] text-portal-text-dim">{sub.label}</p>
                </div>
                <svg width="60" height="20" viewBox="0 0 60 20">
                  <path d={`${sub.points} L60,20 L0,20 Z`} fill={sub.color} opacity="0.08" />
                  <path d={sub.points} fill="none" stroke={sub.color} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[9px] font-semibold text-[#00c2a8]">{sub.trend}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#00c2a8] shrink-0">
            <TrendingUp size={12} /> +12pts 6m
          </div>
        </div>
        {/* Improvement opportunities */}
        <div className="pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Oportunidades de mejora</p>
          <div className="space-y-1.5">
            {scoreImprovements.map((idea) => (
              <div key={idea.text} className="flex items-center gap-2.5 group">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: idea.color }} />
                <p className="text-[11px] text-portal-text flex-1">{idea.text}</p>
                <span className="text-[8px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: idea.color + "12", color: idea.color }}>{idea.area}</span>
                <span className="text-[10px] font-bold text-[#00c2a8]">{idea.impact}</span>
                <span className="text-[10px] text-portal-accent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Aplicar →</span>
              </div>
            ))}
          </div>
        </div>
      </PortalCard>

      {/* ── Identity: Logo, Colors, Typography ── */}
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

      {/* ── Logo Applications ── */}
      <SectionHeader title="Aplicaciones del logo" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={12} />}>Gestionar</PortalButton>} />
      <PortalCard>
        <div className="grid grid-cols-3 gap-3">
          {logoApplications.map((app) => {
            const Icon = app.icon;
            return (
              <div key={app.name} className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                app.status === "ok" ? "bg-[#fafafa]" : "bg-[#fff8eb]"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  app.status === "ok" ? "bg-white" : "bg-white"
                )}>
                  <Icon size={16} className={app.status === "ok" ? "text-portal-text-muted" : "text-[#e09600]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-portal-text">{app.name}</p>
                  <p className="text-[9px] text-portal-text-muted">{app.desc}</p>
                </div>
                {app.status === "ok" ? (
                  <span className="text-[9px] font-medium text-[#00c2a8] bg-[#edfbf8] px-1.5 py-0.5 rounded">Listo</span>
                ) : (
                  <span className="text-[9px] font-medium text-[#e09600] bg-[#fff8eb] px-1.5 py-0.5 rounded">Falta</span>
                )}
              </div>
            );
          })}
        </div>
      </PortalCard>

      {/* ── Productos y Servicios ── */}
      <SectionHeader title="Productos y servicios" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={12} />}>Editar</PortalButton>} />
      <PortalCard>
        <div className="space-y-0">
          {products.map((p, i) => (
            <div key={p.name} className={cn("flex items-center gap-3 py-2.5", i < products.length - 1 && "border-b border-[#f0f0f0]")}>
              <p className="text-[11px] text-portal-text flex-1">{p.name}</p>
              <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{p.type}</span>
            </div>
          ))}
        </div>
      </PortalCard>

      {/* ── Brand DNA: Valores, Arquetipo, Personalidad, Propósito ── */}
      <SectionHeader title="Brand DNA" action={<PortalButton variant="secondary" size="sm" icon={<Pencil size={12} />}>Editar</PortalButton>} />
      <PortalCard>
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Propósito (Why)</p>
              <p className="text-[11px] text-portal-text leading-relaxed">
                Reconectar a las personas con el origen de lo que consumen, empezando por el café.
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Visión</p>
              <p className="text-[11px] text-portal-text leading-relaxed">
                Ser la marca de café de especialidad más querida de Costa Rica.
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Misión</p>
              <p className="text-[11px] text-portal-text leading-relaxed">
                Producir café excepcional con trazabilidad completa, apoyando a productores locales.
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Valores</p>
              <div className="flex flex-wrap gap-2">
                {["Autenticidad", "Calidad", "Sostenibilidad", "Comunidad", "Transparencia"].map((v) => (
                  <span key={v} className="text-[10px] font-medium bg-[#f5f5f7] text-portal-text-secondary px-2.5 py-1 rounded-lg">{v}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Right column */}
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Arquetipo</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fafafa]">
                <div className="w-10 h-10 rounded-lg bg-[#7c5cfc15] flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-portal-text">El Explorador</p>
                  <p className="text-[10px] text-portal-text-muted">Busca autenticidad, libertad y descubrimiento. Conecta con experiencias genuinas.</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Personificación</p>
              <div className="p-3 rounded-xl bg-[#fafafa]">
                <p className="text-[11px] text-portal-text leading-relaxed italic">
                  &ldquo;Si Café Artesanal fuera una persona, sería un barista viajero de 35 años que conoce cada finca de donde viene su café.
                  Viste casual pero con estilo, habla con pasión pero sin pretensión. Prefiere conversaciones profundas en una mesa de madera.&rdquo;
                </p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Creencias</p>
              <div className="space-y-1.5">
                {[
                  "El buen café cuenta una historia de origen",
                  "La transparencia genera confianza real",
                  "Lo artesanal puede escalar sin perder alma",
                ].map((b) => (
                  <div key={b} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-portal-accent mt-1 shrink-0" />
                    <p className="text-[10px] text-portal-text">{b}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Promesa de marca</p>
              <p className="text-[11px] text-portal-text font-medium">
                En cada taza, el sabor honesto del café costarricense de especialidad.
              </p>
            </div>
          </div>
        </div>
      </PortalCard>

      {/* ── Tone of Voice ── */}
      <PortalCard>
        <SectionHeader title="Tono de voz" action={<PortalButton variant="secondary" size="sm">Editar →</PortalButton>} />
        <div className="space-y-4">
          <ToneSlider labelLeft="Formal" labelRight="Casual" value={brand.toneScores.formal} />
          <ToneSlider labelLeft="Serio" labelRight="Divertido" value={brand.toneScores.serious} />
          <ToneSlider labelLeft="Técnico" labelRight="Accesible" value={brand.toneScores.technical} />
        </div>
      </PortalCard>

      {/* ── Positioning ── */}
      <PortalCard>
        <SectionHeader title="Positioning" action={<PortalButton variant="secondary" size="sm">Editar →</PortalButton>} />
        <blockquote className="text-sm text-portal-text-secondary italic border-l-2 border-portal-accent pl-4">{brand.positioning}</blockquote>
      </PortalCard>

      {/* ── Do's & Don'ts ── */}
      <SectionHeader title="Guía de uso" />
      <PortalCard>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ThumbsUp size={14} className="text-[#00c2a8]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#00c2a8]">Correcto</p>
            </div>
            <div className="space-y-2">
              {dosAndDonts.filter(d => d.type === "do").map((d) => (
                <div key={d.text} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#edfbf8]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00c2a8] mt-1 shrink-0" />
                  <p className="text-[11px] text-portal-text">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ThumbsDown size={14} className="text-[#ff6b6b]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#ff6b6b]">Evitar</p>
            </div>
            <div className="space-y-2">
              {dosAndDonts.filter(d => d.type === "dont").map((d) => (
                <div key={d.text} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#fff0f0]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] mt-1 shrink-0" />
                  <p className="text-[11px] text-portal-text">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PortalCard>

      {/* ── Brand Guardian ── */}
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

      {/* ── Brand Manual ── */}
      <SectionHeader title="Manual de marca" />
      <PortalCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
              <BookOpen size={20} className="text-portal-text-muted" />
            </div>
            <div>
              <p className="text-xs font-semibold text-portal-text">Manual de marca — {brand.name}</p>
              <p className="text-[10px] text-portal-text-muted">Actualizado hace 3 días · 12 páginas · Auto-generado</p>
            </div>
          </div>
          <div className="flex gap-2">
            <PortalButton variant="secondary" icon={<Eye size={14} />}>Vista previa</PortalButton>
            <PortalButton variant="primary" icon={<Download size={14} />}>Descargar PDF</PortalButton>
          </div>
        </div>
        {/* Manual contents preview */}
        <div className="border-t border-[#f0f0f0] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">Contenido del manual</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { section: "1. Identidad", pages: "p.1-3" },
              { section: "2. Logo y aplicaciones", pages: "p.4-5" },
              { section: "3. Paleta de colores", pages: "p.6" },
              { section: "4. Tipografía", pages: "p.7" },
              { section: "5. Tono de voz", pages: "p.8-9" },
              { section: "6. Guía fotográfica", pages: "p.10" },
              { section: "7. Do's & Don'ts", pages: "p.11" },
              { section: "8. Templates", pages: "p.12" },
            ].map((ch) => (
              <div key={ch.section} className="flex items-center justify-between p-2 rounded-lg bg-[#fafafa]">
                <span className="text-[10px] text-portal-text">{ch.section}</span>
                <span className="text-[8px] text-portal-text-dim">{ch.pages}</span>
              </div>
            ))}
          </div>
        </div>
      </PortalCard>
    </div>
  );
}
