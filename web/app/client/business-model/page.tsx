"use client";

import { useState } from "react";
import Link from "next/link";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import { PortalButton } from "@/components/portal/portal-button";
import { BrandSelector } from "@/components/portal/brand-selector";
import { mockBrands } from "@/lib/portal-mock-data";
import { cn } from "@/lib/utils";
import {
  MessageCircle, Pencil, Plus, X, Check,
  Cog, Gem, Users, Heart, Truck, PiggyBank,
  Handshake, Lightbulb, Frown, Smile, ShieldCheck, Sparkles,
  LayoutGrid, BookOpen, Clock, ArrowUpRight, Package,
} from "lucide-react";

// ══════════════════════════════════════════
// DATA
// ══════════════════════════════════════════

const sections: Record<string, { label: string; icon: typeof Cog; color: string; items: string[] }> = {
  value: {
    label: "Propuesta de valor",
    icon: Lightbulb,
    color: "#f5a623",
    items: ["Café de especialidad con trazabilidad completa", "Experiencia premium del grano a la taza", "Suscripción personalizada por perfil de sabor", "Impacto social directo en comunidades productoras"],
  },
  painRelievers: {
    label: "Pain relievers",
    icon: ShieldCheck,
    color: "#00c2a8",
    items: ["QR en cada bolsa con info de finca y tostado", "Entrega directa a domicilio (suscripción)", "Garantía de frescura: tostado máximo 7 días"],
  },
  gainCreators: {
    label: "Gain creators",
    icon: Sparkles,
    color: "#7c5cfc",
    items: ["Certificado de impacto social por compra", "Acceso a catas exclusivas para suscriptores", "App con historial de cafés y recomendaciones"],
  },
  segments: {
    label: "Segmentos de clientes",
    icon: Users,
    color: "#00c2a8",
    items: ["Profesional urbano 28-45", "Foodie millennial 22-32", "Barista profesional", "B2B Horeca (hoteles, restaurantes)"],
  },
  relationships: {
    label: "Relación con clientes",
    icon: Heart,
    color: "#00c2a8",
    items: ["Comunidad de suscriptores", "Asistencia personalizada", "Contenido educativo (café)", "Programa de fidelización"],
  },
  channels: {
    label: "Canales",
    icon: Truck,
    color: "#00c2a8",
    items: ["Tienda física San José", "E-commerce propio", "Instagram y TikTok", "Wholesale (restaurantes, hoteles)", "Marketplace local"],
  },
  jobs: {
    label: "Jobs to be done",
    icon: Cog,
    color: "#7c5cfc",
    items: ["Empezar el día con energía y un ritual agradable", "Impresionar invitados con un café excepcional", "Apoyar productores locales con su compra"],
  },
  pains: {
    label: "Pains",
    icon: Frown,
    color: "#ff6b6b",
    items: ["No saber de dónde viene su café", "Café insípido de supermercado", "Falta de opciones de especialidad cerca"],
  },
  gains: {
    label: "Gains",
    icon: Smile,
    color: "#00c2a8",
    items: ["Sentir que su compra tiene impacto positivo", "Descubrir perfiles de sabor únicos", "Pertenecer a una comunidad de conocedores"],
  },
  activities: {
    label: "Actividades clave",
    icon: Cog,
    color: "#7c5cfc",
    items: ["Tostado artesanal semanal", "Control de calidad (cupping)", "Gestión de suscripciones", "Creación de contenido"],
  },
  resources: {
    label: "Recursos clave",
    icon: Gem,
    color: "#7c5cfc",
    items: ["Tostadora Probat 5kg", "Equipo de baristas (4)", "Marca y know-how", "Relaciones con fincas"],
  },
  partners: {
    label: "Alianzas clave",
    icon: Handshake,
    color: "#7c5cfc",
    items: ["Fincas de Tarrazú y Naranjo", "Proveedores de empaques eco", "Alianza con Correos de CR", "Coworking Hub CR"],
  },
  costs: {
    label: "Estructura de costos",
    icon: PiggyBank,
    color: "#ff6b6b",
    items: ["Café verde (materia prima) — 35%", "Operación tienda — 20%", "Nómina — 25%", "Marketing y distribución — 12%", "Empaques y logística — 8%"],
  },
};

const unitEconomics = [
  { label: "LTV", value: "₡18,000", sub: "Lifetime value promedio" },
  { label: "CAC", value: "₡4,200", sub: "Costo de adquisición" },
  { label: "LTV:CAC", value: "4.3x", sub: "Ratio (saludable >3x)" },
  { label: "Payback", value: "2.8 meses", sub: "Tiempo de recuperación" },
  { label: "Margen bruto", value: "62%", sub: "Después de COGS" },
  { label: "Retención 6m", value: "68%", sub: "Clientes que recompran" },
];

type WorkshopStatus = "not_started" | "in_progress" | "completed";

const workshops = [
  { id: "vpc", title: "Define tu Propuesta de Valor", description: "Ejercicio guiado para mapear tu propuesta de valor usando el Value Proposition Canvas.", time: "45 min", status: "not_started" as WorkshopStatus },
  { id: "segments", title: "Mapea tus Segmentos", description: "Identifica y prioriza tus segmentos de clientes con criterios de atractivo y accesibilidad.", time: "30 min", status: "in_progress" as WorkshopStatus },
  { id: "channels", title: "Diseña tus Canales", description: "Define la estrategia de distribución y comunicación para cada segmento.", time: "30 min", status: "not_started" as WorkshopStatus },
  { id: "costs", title: "Estructura de Costos", description: "Analiza y optimiza tu estructura de costos fijos y variables.", time: "25 min", status: "not_started" as WorkshopStatus },
  { id: "unit-economics", title: "Unit Economics", description: "Calcula LTV, CAC, payback y márgenes para validar tu modelo.", time: "35 min", status: "completed" as WorkshopStatus },
  { id: "sprint", title: "Business Model Sprint", description: "Revisión completa del Business Model Canvas en una sesión intensiva.", time: "90 min", status: "not_started" as WorkshopStatus },
];

// ══════════════════════════════════════════
// LOCAL COMPONENTS
// ══════════════════════════════════════════

function GroupHeader({ icon: Icon, label, description, color }: { icon: typeof Cog; label: string; description: string; color: string }) {
  return (
    <div className="flex items-center gap-2 pt-8 pb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "12" }}>
        <Icon size={13} style={{ color }} />
      </div>
      <p className="text-xs font-semibold text-portal-text">{label}</p>
      <span className="text-[11px] text-portal-text-dim">— {description}</span>
    </div>
  );
}

function EditableSection({
  id, section, editing, onEdit, onSave, onCancel, items, onItemsChange,
}: {
  id: string;
  section: { label: string; icon: typeof Cog; color: string };
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  items: string[];
  onItemsChange: (items: string[]) => void;
}) {
  const Icon = section.icon;
  return (
    <PortalCard>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: section.color }} />
          <p className="text-xs font-semibold text-portal-text">{section.label}</p>
          <span className="text-[9px] text-portal-text-dim bg-[#f5f5f7] px-1.5 py-0.5 rounded">{items.length}</span>
        </div>
        {!editing ? (
          <button onClick={onEdit} className="flex items-center gap-1 text-[10px] font-medium text-portal-text-muted hover:text-portal-text transition-colors">
            <Pencil size={10} /> Editar
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={onSave} className="flex items-center gap-1 text-[10px] font-medium text-[#00c2a8] hover:opacity-80 transition-opacity">
              <Check size={10} /> Guardar
            </button>
            <button onClick={onCancel} className="text-[10px] font-medium text-portal-text-dim hover:text-portal-text transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: section.color, opacity: 0.5 }} />
              <p className="text-[11px] text-portal-text leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onItemsChange(next);
                }}
                className="flex-1 text-[11px] text-portal-text bg-[#f8f8fa] border border-portal-border rounded-lg px-3 py-2 outline-none focus:border-portal-accent transition-colors"
              />
              <button
                onClick={() => onItemsChange(items.filter((_, idx) => idx !== i))}
                className="p-1 text-portal-text-dim hover:text-[#ff6b6b] transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onItemsChange([...items, ""])}
            className="flex items-center gap-1 text-[10px] font-medium text-portal-text-dim hover:text-portal-accent transition-colors pt-1"
          >
            <Plus size={11} /> Agregar
          </button>
        </div>
      )}
    </PortalCard>
  );
}

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

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════

const tabs = [
  { id: "modelo", label: "Modelo", icon: LayoutGrid },
  { id: "workshops", label: "Workshops", icon: BookOpen },
] as const;

type TabId = (typeof tabs)[number]["id"];

// ══════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════

export default function BusinessModelPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("modelo");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionData, setSectionData] = useState<Record<string, string[]>>(
    Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, [...v.items]]))
  );
  // Keep original data for cancel
  const [originalData, setOriginalData] = useState<string[] | null>(null);

  function startEdit(id: string) {
    setOriginalData([...sectionData[id]]);
    setEditingSection(id);
  }
  function saveEdit() {
    setEditingSection(null);
    setOriginalData(null);
  }
  function cancelEdit() {
    if (editingSection && originalData) {
      setSectionData((prev) => ({ ...prev, [editingSection]: originalData }));
    }
    setEditingSection(null);
    setOriginalData(null);
  }
  function updateItems(id: string, items: string[]) {
    setSectionData((prev) => ({ ...prev, [id]: items }));
  }

  function renderSection(id: string) {
    return (
      <EditableSection
        key={id}
        id={id}
        section={sections[id]}
        editing={editingSection === id}
        onEdit={() => startEdit(id)}
        onSave={saveEdit}
        onCancel={cancelEdit}
        items={sectionData[id]}
        onItemsChange={(items) => updateItems(id, items)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-portal-text">Business Model</h1>
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
      {/* MODELO TAB                                */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "modelo" && (
        <div>
          {/* ── OFERTA ── */}
          <GroupHeader icon={Lightbulb} label="Oferta" description="Lo que ofreces y por qué importa" color="#f5a623" />
          <div className="space-y-4">
            {renderSection("value")}
            <div className="grid grid-cols-2 gap-4">
              {renderSection("painRelievers")}
              {renderSection("gainCreators")}
            </div>
            {/* Productos reference */}
            <Link href="/client/productos" className="block group">
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-dashed border-[#e0e0e0] hover:border-portal-accent hover:bg-[#fafafa] transition-all">
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-portal-text-muted group-hover:text-portal-accent transition-colors" />
                  <div>
                    <p className="text-xs font-semibold text-portal-text">Productos y Servicios</p>
                    <p className="text-[10px] text-portal-text-muted">Gestiona tu catálogo completo</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-portal-text-dim group-hover:text-portal-accent transition-colors" />
              </div>
            </Link>
          </div>

          {/* ── CLIENTES ── */}
          <GroupHeader icon={Users} label="Clientes" description="A quién sirves y cómo los alcanzas" color="#00c2a8" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderSection("segments")}
              {renderSection("relationships")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderSection("channels")}
              <PortalCard>
                <p className="text-xs font-semibold text-portal-text mb-3">Perfil del cliente</p>
                <div className="space-y-3">
                  {/* Jobs */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Cog size={10} className="text-[#7c5cfc]" />
                      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#7c5cfc]">Jobs</p>
                      <span className="text-[9px] text-portal-text-dim">{sectionData.jobs.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {sectionData.jobs.map((j) => (
                        <p key={j} className="text-[10px] text-portal-text-secondary pl-3">• {j}</p>
                      ))}
                    </div>
                  </div>
                  {/* Pains */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Frown size={10} className="text-[#ff6b6b]" />
                      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#ff6b6b]">Pains</p>
                      <span className="text-[9px] text-portal-text-dim">{sectionData.pains.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {sectionData.pains.map((p) => (
                        <p key={p} className="text-[10px] text-portal-text-secondary pl-3">• {p}</p>
                      ))}
                    </div>
                  </div>
                  {/* Gains */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Smile size={10} className="text-[#00c2a8]" />
                      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] text-[#00c2a8]">Gains</p>
                      <span className="text-[9px] text-portal-text-dim">{sectionData.gains.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {sectionData.gains.map((g) => (
                        <p key={g} className="text-[10px] text-portal-text-secondary pl-3">• {g}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </PortalCard>
            </div>
          </div>

          {/* ── OPERACIÓN ── */}
          <GroupHeader icon={Cog} label="Operación" description="Cómo funciona tu negocio por dentro" color="#7c5cfc" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {renderSection("activities")}
              {renderSection("resources")}
              {renderSection("partners")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderSection("costs")}
              <PortalCard>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-semibold text-portal-text">Unit Economics</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {unitEconomics.map((m) => (
                    <div key={m.label}>
                      <p className="text-sm font-[800] text-portal-text">{m.value}</p>
                      <p className="text-[8px] text-portal-text-dim mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </PortalCard>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* WORKSHOPS TAB                             */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "workshops" && (
        <div>
          <p className="text-[11px] text-portal-text-muted mb-4">Ejercicios guiados para construir y validar cada parte de tu modelo de negocio.</p>
          <div className="grid grid-cols-2 gap-4">
            {workshops.map((w) => (
              <PortalCard key={w.id}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-semibold text-portal-text">{w.title}</p>
                  <WorkshopStatusBadge status={w.status} />
                </div>
                <p className="text-[10px] text-portal-text-muted leading-relaxed mb-4">{w.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-portal-text-dim flex items-center gap-1">
                    <Clock size={10} /> {w.time}
                  </span>
                  <PortalButton variant={w.status === "completed" ? "secondary" : "primary"} size="sm">
                    {w.status === "completed" ? "Revisar" : w.status === "in_progress" ? "Continuar" : "Comenzar"}
                  </PortalButton>
                </div>
              </PortalCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
