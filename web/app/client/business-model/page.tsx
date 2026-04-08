"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import {
  MessageCircle, Plus,
  Cog, Users, Heart, Truck,
  Lightbulb, Frown, Smile, ShieldCheck, Sparkles,
  LayoutGrid, Clock, Package,
} from "lucide-react";

// ══════════════════════════════════════════
// DATA
// ══════════════════════════════════════════

const valueProposition = {
  statement: "Café de especialidad costarricense con trazabilidad completa, experiencia premium del grano a la taza, y suscripción personalizada por perfil de sabor.",
  items: ["Café de especialidad con trazabilidad completa", "Experiencia premium del grano a la taza", "Suscripción personalizada por perfil de sabor", "Impacto social directo en comunidades productoras"],
  painRelievers: ["QR en cada bolsa con info de finca y tostado", "Entrega directa a domicilio (suscripción)", "Garantía de frescura: tostado máximo 7 días"],
  gainCreators: ["Certificado de impacto social por compra", "Acceso a catas exclusivas para suscriptores", "App con historial de cafés y recomendaciones"],
};

const customerSegments = [
  {
    id: "principal",
    segment: "Principal",
    name: "Profesional urbano 28-45",
    avatar: "👨‍💼",
    color: "#7c5cfc",
    traits: ["Valora calidad sobre precio", "Compra online y en tienda", "Instagram y LinkedIn activo"],
    jobs: ["Empezar el día con energía y un ritual agradable", "Impresionar invitados con un café excepcional"],
    pains: ["No saber de dónde viene su café", "Café insípido de supermercado"],
    gains: ["Sentir que su compra tiene impacto positivo", "Descubrir perfiles de sabor únicos"],
    relationship: "Comunidad de suscriptores + asistencia personalizada",
  },
  {
    id: "secundaria",
    segment: "Secundaria",
    name: "Foodie millennial 22-32",
    avatar: "🧑‍🍳",
    color: "#00c2a8",
    traits: ["Explora nuevas experiencias", "Comparte en redes sociales", "Sensible a tendencias"],
    jobs: ["Descubrir experiencias gastronómicas únicas", "Compartir hallazgos en redes"],
    pains: ["Falta de opciones de especialidad cerca", "No poder verificar calidad antes de comprar"],
    gains: ["Pertenecer a una comunidad de conocedores", "Contenido visual para redes"],
    relationship: "Contenido educativo + programa de fidelización",
  },
  {
    id: "nicho",
    segment: "Nicho",
    name: "Barista profesional",
    avatar: "☕",
    color: "#f5a623",
    traits: ["Técnico, valora origen y proceso", "Influenciador en su comunidad", "Busca relación directa con productor"],
    jobs: ["Apoyar productores locales con su compra", "Acceder a granos de origen único"],
    pains: ["Falta de transparencia en la cadena de suministro"],
    gains: ["Relación directa con fincas", "Acceso a lotes exclusivos"],
    relationship: "Relación directa con equipo + acceso wholesale",
  },
  {
    id: "b2b",
    segment: "B2B",
    name: "Horeca (hoteles, restaurantes)",
    avatar: "🏨",
    color: "#ff6b6b",
    traits: ["Busca consistencia y volumen", "Precio competitivo con calidad", "Necesita entrega recurrente"],
    jobs: ["Ofrecer café de calidad a sus clientes", "Simplificar aprovisionamiento"],
    pains: ["Proveedores inconsistentes", "Falta de diferenciación en café ofrecido"],
    gains: ["Menú con historia de origen", "Co-branding con marca de especialidad"],
    relationship: "Account manager dedicado + wholesale",
  },
];

const channels = [
  { name: "Tienda física San José", type: "Directo", stage: "Venta + Experiencia", color: "#7c5cfc" },
  { name: "E-commerce propio", type: "Directo", stage: "Awareness + Venta", color: "#7c5cfc" },
  { name: "Instagram y TikTok", type: "Owned", stage: "Awareness + Engagement", color: "#00c2a8" },
  { name: "Wholesale (restaurantes, hoteles)", type: "Indirecto", stage: "Distribución", color: "#f5a623" },
  { name: "Marketplace local", type: "Indirecto", stage: "Distribución", color: "#f5a623" },
  { name: "Email / Newsletter", type: "Owned", stage: "Retención", color: "#00c2a8" },
  { name: "Eventos y ferias", type: "Directo", stage: "Awareness + Venta", color: "#ff6b6b" },
];

const products = [
  { name: "Café en grano (250g, 500g, 1kg)", type: "Producto", description: "Origen único, tostado semanal. Tueste claro, medio y oscuro.", price: "₡4,500 – ₡15,000" },
  { name: "Suscripción mensual de café", type: "Servicio", description: "Entrega mensual personalizada según perfil de sabor.", price: "₡6,500/mes" },
  { name: "Cursos de barismo", type: "Servicio", description: "Talleres presenciales de 4 horas. Básico, intermedio y avanzado.", price: "₡25,000" },
  { name: "Merch (tazas, camisetas)", type: "Producto", description: "Cerámica artesanal y textiles con diseño de marca.", price: "₡5,000 – ₡12,000" },
  { name: "Café preparado en tienda", type: "Producto", description: "Espresso, filtrado, cold brew y bebidas especiales.", price: "₡1,800 – ₡3,500" },
];

type WorkshopStatus = "not_started" | "in_progress" | "completed";

const workshops = [
  { id: "vpc", title: "Define tu Propuesta de Valor", description: "Ejercicio guiado para mapear tu propuesta de valor usando el Value Proposition Canvas.", time: "45 min", status: "not_started" as WorkshopStatus },
  { id: "segments", title: "Mapea tus Segmentos", description: "Identifica y prioriza tus segmentos de clientes con criterios de atractivo y accesibilidad.", time: "30 min", status: "in_progress" as WorkshopStatus },
  { id: "channels", title: "Diseña tus Canales", description: "Define la estrategia de distribución y comunicación para cada segmento.", time: "30 min", status: "not_started" as WorkshopStatus },
  { id: "products", title: "Catálogo de Productos", description: "Organiza y optimiza tu portafolio de productos y servicios.", time: "25 min", status: "not_started" as WorkshopStatus },
  { id: "relationships", title: "Relaciones con Clientes", description: "Diseña estrategias de relación por segmento para maximizar retención.", time: "35 min", status: "completed" as WorkshopStatus },
  { id: "sprint", title: "Business Model Sprint", description: "Revisión completa del Business Model en una sesión intensiva.", time: "90 min", status: "not_started" as WorkshopStatus },
];

// ══════════════════════════════════════════
// LOCAL COMPONENTS
// ══════════════════════════════════════════

function WorkshopStatusBadge({ status }: { status: WorkshopStatus }) {
  const config = {
    not_started: { label: "Pendiente", bg: "bg-[#f5f5f7]", text: "text-portal-text-muted" },
    in_progress: { label: "En progreso", bg: "bg-[#fff8eb]", text: "text-[#e09600]" },
    completed: { label: "Completado", bg: "bg-[#edfbf8]", text: "text-[#00a88e]" },
  }[status];
  return (
    <span className={cn("text-[8px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded", config.bg, config.text)}>
      {config.label}
    </span>
  );
}

function TabWorkshops({ items }: { items: typeof workshops }) {
  if (!items.length) return null;
  return (
    <div className="pt-6 mt-6 border-t border-portal-border">
      <p className="text-[10px] font-semibold uppercase tracking-[1px] text-portal-text-dim mb-3">Workshops relacionados</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((w) => (
          <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#fafafa] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all cursor-pointer group">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-portal-text">{w.title}</p>
              <p className="text-[9px] text-portal-text-muted mt-0.5">{w.time}</p>
            </div>
            <WorkshopStatusBadge status={w.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════

const tabs = [
  { id: "propuesta", label: "Propuesta de Valor", icon: Lightbulb },
  { id: "nichos", label: "Nichos", icon: Users },
  { id: "productos", label: "Productos y Servicios", icon: Package },
  { id: "canales", label: "Canales", icon: Truck },
] as const;

type TabId = (typeof tabs)[number]["id"];

// Workshops relevant to each tab
const tabWorkshops: Record<string, typeof workshops[number][]> = {
  propuesta: [workshops[0]],  // Define tu Propuesta de Valor
  nichos: [workshops[1], workshops[4]], // Mapea tus Segmentos, Relaciones con Clientes
  productos: [workshops[3]], // Catálogo de Productos
  canales: [workshops[2]],   // Diseña tus Canales
};

// ══════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════

export default function BusinessModelPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("propuesta");

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Core</h1>
        <div className="flex items-center gap-2">
          <PortalButton variant="primary" size="sm" icon={<MessageCircle size={13} />}>Editar con Copilot</PortalButton>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id ? "border-portal-text text-portal-text" : "border-transparent text-portal-text-muted hover:text-portal-text")}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* NICHOS TAB — Segments + Relationships     */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "nichos" && (
        <div className="space-y-4">
          <p className="text-[11px] text-portal-text-muted">Segmentos de clientes con su perfil detallado y tipo de relación.</p>
          <div className="grid grid-cols-2 gap-4">
            {customerSegments.map((seg) => (
              <PortalCard key={seg.id}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">{seg.avatar}</span>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: seg.color }}>{seg.segment}</span>
                    <p className="text-xs font-semibold text-portal-text">{seg.name}</p>
                  </div>
                </div>

                {/* Traits */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {seg.traits.map((t) => (
                    <span key={t} className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>

                {/* Jobs, Pains, Gains */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Cog size={9} className="text-[#7c5cfc]" />
                      <p className="text-[8px] font-semibold uppercase tracking-[0.5px] text-[#7c5cfc]">Jobs</p>
                    </div>
                    {seg.jobs.map((j) => (
                      <p key={j} className="text-[10px] text-portal-text-secondary pl-3 leading-relaxed">• {j}</p>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Frown size={9} className="text-[#ff6b6b]" />
                      <p className="text-[8px] font-semibold uppercase tracking-[0.5px] text-[#ff6b6b]">Pains</p>
                    </div>
                    {seg.pains.map((p) => (
                      <p key={p} className="text-[10px] text-portal-text-secondary pl-3 leading-relaxed">• {p}</p>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Smile size={9} className="text-[#00c2a8]" />
                      <p className="text-[8px] font-semibold uppercase tracking-[0.5px] text-[#00c2a8]">Gains</p>
                    </div>
                    {seg.gains.map((g) => (
                      <p key={g} className="text-[10px] text-portal-text-secondary pl-3 leading-relaxed">• {g}</p>
                    ))}
                  </div>
                </div>

                {/* Relationship */}
                <div className="mt-3 pt-2.5 border-t border-[#f0f0f0]">
                  <div className="flex items-center gap-1.5">
                    <Heart size={10} className="text-portal-text-dim" />
                    <p className="text-[10px] text-portal-text-muted">{seg.relationship}</p>
                  </div>
                </div>
              </PortalCard>
            ))}
          </div>
          <TabWorkshops items={tabWorkshops.nichos} />
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* PROPUESTA DE VALOR TAB                    */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "propuesta" && (
        <div className="space-y-4">
          {/* Main statement */}
          <PortalCard>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#f5a62312" }}>
                <Lightbulb size={16} className="text-[#f5a623]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">Propuesta de valor central</p>
                <p className="text-sm text-portal-text leading-relaxed">{valueProposition.statement}</p>
              </div>
            </div>
          </PortalCard>

          {/* Value items */}
          <PortalCard>
            <p className="text-xs font-semibold text-portal-text mb-3">¿Qué ofrecemos?</p>
            <div className="space-y-2">
              {valueProposition.items.map((item) => (
                <div key={item} className="flex items-start gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[#f5a623] opacity-50" />
                  <p className="text-[11px] text-portal-text leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </PortalCard>

          {/* Pain Relievers + Gain Creators */}
          <div className="grid grid-cols-2 gap-4">
            <PortalCard>
              <div className="flex items-center gap-1.5 mb-3">
                <ShieldCheck size={13} className="text-[#00c2a8]" />
                <p className="text-xs font-semibold text-portal-text">Pain relievers</p>
                <span className="text-[9px] text-portal-text-dim bg-[#f5f5f7] px-1.5 py-0.5 rounded">{valueProposition.painRelievers.length}</span>
              </div>
              <div className="space-y-2">
                {valueProposition.painRelievers.map((item) => (
                  <div key={item} className="flex items-start gap-2 p-2 rounded-lg bg-[#edfbf8]">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[#00c2a8]" />
                    <p className="text-[10px] text-portal-text">{item}</p>
                  </div>
                ))}
              </div>
            </PortalCard>

            <PortalCard>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles size={13} className="text-[#7c5cfc]" />
                <p className="text-xs font-semibold text-portal-text">Gain creators</p>
                <span className="text-[9px] text-portal-text-dim bg-[#f5f5f7] px-1.5 py-0.5 rounded">{valueProposition.gainCreators.length}</span>
              </div>
              <div className="space-y-2">
                {valueProposition.gainCreators.map((item) => (
                  <div key={item} className="flex items-start gap-2 p-2 rounded-lg bg-[#f8f8fa]">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[#7c5cfc]" />
                    <p className="text-[10px] text-portal-text">{item}</p>
                  </div>
                ))}
              </div>
            </PortalCard>
          </div>
          <TabWorkshops items={tabWorkshops.propuesta} />
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* PRODUCTOS Y SERVICIOS TAB                 */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "productos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-portal-text-muted">Catálogo de productos y servicios del negocio.</p>
            <PortalButton variant="primary" size="sm" icon={<Plus size={13} />}>Agregar</PortalButton>
          </div>
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
            <button className="border-2 border-dashed border-[#e0e0e0] rounded-2xl flex flex-col items-center justify-center gap-2 py-8 hover:border-portal-accent hover:bg-[#fafafa] transition-all cursor-pointer group">
              <Plus size={20} className="text-portal-text-dim group-hover:text-portal-accent transition-colors" />
              <span className="text-[11px] font-medium text-portal-text-dim group-hover:text-portal-accent transition-colors">Agregar producto o servicio</span>
            </button>
          </div>
          <TabWorkshops items={tabWorkshops.productos} />
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* CANALES TAB                               */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "canales" && (
        <div className="space-y-4">
          <p className="text-[11px] text-portal-text-muted">Canales de distribución y comunicación para llegar a cada segmento.</p>
          <PortalCard>
            <div className="space-y-0">
              {channels.map((ch, i) => (
                <div key={ch.name} className={cn("flex items-center gap-4 py-3", i < channels.length - 1 && "border-b border-[#f0f0f0]")}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-portal-text">{ch.name}</p>
                    <p className="text-[10px] text-portal-text-muted mt-0.5">{ch.stage}</p>
                  </div>
                  <span className="text-[8px] font-medium bg-[#f5f5f7] text-portal-text-muted px-2 py-0.5 rounded">{ch.type}</span>
                </div>
              ))}
            </div>
          </PortalCard>

          {/* Channel mix summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Directos", count: channels.filter((c) => c.type === "Directo").length, color: "#7c5cfc" },
              { label: "Owned", count: channels.filter((c) => c.type === "Owned").length, color: "#00c2a8" },
              { label: "Indirectos", count: channels.filter((c) => c.type === "Indirecto").length, color: "#f5a623" },
            ].map((g) => (
              <PortalCard key={g.label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-1">{g.label}</p>
                <p className="text-[28px] font-[800] tracking-[-1px]" style={{ color: g.color }}>{g.count}</p>
              </PortalCard>
            ))}
          </div>
          <TabWorkshops items={tabWorkshops.canales} />
        </div>
      )}
    </div>
  );
}
