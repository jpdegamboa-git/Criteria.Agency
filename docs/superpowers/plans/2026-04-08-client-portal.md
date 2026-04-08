# Client Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the criteria.agency client portal — a 6-section dashboard (Home, Brand, Plan, Campaigns, Sales, Setup) with Copilot drawer, following the PilePeak.ai-inspired design spec.

**Architecture:** Next.js 16 App Router under `/client` route group with a shared layout (auth guard, top nav, dot-pattern background, Copilot FAB). All data is mocked initially via static fixtures; real API integration comes later. Components follow the existing `components/ui/` pattern with a new `components/portal/` directory.

**Tech Stack:** Next.js 16.2.2, React 19, Tailwind v4, lucide-react (new dep), Better Auth (existing), Vitest for logic tests.

**Spec:** `docs/superpowers/specs/2026-04-08-client-portal-design.md`

---

## File Structure

```
web/
├── app/client/
│   ├── layout.tsx                    # Portal shell: auth guard + nav + bg + copilot
│   ├── page.tsx                      # Home
│   ├── brand/page.tsx                # Brand
│   ├── plan/page.tsx                 # Plan (subtabs)
│   ├── campaigns/
│   │   ├── page.tsx                  # Campaigns (matrix/calendar/list)
│   │   └── [id]/page.tsx             # Campaign detail
│   ├── sales/page.tsx                # Sales
│   └── setup/page.tsx                # Setup
│
├── components/portal/
│   ├── portal-nav.tsx                # Top navigation bar
│   ├── copilot-fab.tsx               # Floating action button
│   ├── copilot-drawer.tsx            # Right-side chat drawer
│   ├── notifications-dropdown.tsx    # Bell icon + dropdown
│   ├── avatar-dropdown.tsx           # User avatar + setup dropdown
│   ├── brand-selector.tsx            # Brand dropdown selector (reused per space)
│   ├── kpi-card.tsx                  # Big-number KPI card
│   ├── portal-card.tsx               # Standard white card (portal style)
│   ├── filter-group.tsx              # Segmented button group (filters)
│   ├── state-badge.tsx               # Plan/Ejecutar/Seguimiento badges
│   ├── media-dot.tsx                 # Colored dot for Paid/Owned/Earned
│   ├── idea-card.tsx                 # Home > Ideas para ti card
│   ├── opportunity-card.tsx          # Home > Oportunidades card
│   ├── identity-card.tsx             # Brand > Logo/Colors/Typography cards
│   ├── tone-slider.tsx               # Brand > Tone of voice spectrum
│   ├── budget-equalizer.tsx          # Plan > Budget allocator drill-down
│   ├── funnel-matrix.tsx             # Campaigns > Matrix grid
│   ├── activation-chip.tsx           # Matrix cell chip
│   ├── campaign-calendar.tsx         # Campaigns > Gantt chart
│   ├── campaign-stepper.tsx          # Campaign detail > Pipeline stepper
│   ├── pipeline-kanban.tsx           # Sales > Kanban board
│   ├── deal-card.tsx                 # Sales > Kanban deal card
│   └── section-header.tsx            # Reusable "Title + action" header
│
├── lib/
│   ├── portal-mock-data.ts           # All mock data for portal
│   └── portal-types.ts              # TypeScript types for portal entities
│
├── app/globals.css                   # Modified: add portal tokens
└── package.json                      # Modified: add lucide-react
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install lucide-react**

```bash
cd web && npm install lucide-react
```

- [ ] **Step 2: Verify installation**

```bash
cd web && node -e "require('lucide-react')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "feat(portal): add lucide-react icon library"
```

---

## Task 2: Portal Design Tokens & CSS

**Files:**
- Modify: `web/app/globals.css`

- [ ] **Step 1: Add portal CSS tokens and utility classes**

Add the following block at the end of `web/app/globals.css`:

```css
/* ── Portal tokens (Client Portal) ── */
@theme inline {
  --color-portal-bg: #f5f5f7;
  --color-portal-text: #111111;
  --color-portal-text-secondary: #444444;
  --color-portal-text-muted: #888888;
  --color-portal-text-dim: #bbbbbb;
  --color-portal-border: #eeeeee;
  --color-portal-accent: #f5a623;

  --color-media-paid: #7c5cfc;
  --color-media-owned: #00c2a8;
  --color-media-earned: #ff6b6b;

  --color-state-plan-bg: #f4f1ff;
  --color-state-plan-text: #7c5cfc;
  --color-state-exec-bg: #fff8eb;
  --color-state-exec-text: #e09600;
  --color-state-track-bg: #edfbf8;
  --color-state-track-text: #00a88e;

  --color-lead-hot: #ff6b6b;
  --color-lead-warm: #f5a623;
  --color-lead-cold: #7c5cfc;
  --color-lead-won: #00c2a8;
}

/* ── Portal dot pattern background ── */
.portal-dot-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(0,0,0,0.15) 0.8px, transparent 0.8px);
  background-size: 20px 20px;
}

/* ── Portal card shadow ── */
.portal-shadow {
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.portal-shadow-hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

- [ ] **Step 2: Verify dev server still compiles**

```bash
cd web && npx next build --no-lint 2>&1 | tail -5
```

Expected: Build succeeds (or at minimum CSS compiles without errors).

- [ ] **Step 3: Commit**

```bash
git add web/app/globals.css
git commit -m "feat(portal): add portal design tokens and dot pattern CSS"
```

---

## Task 3: Portal TypeScript Types

**Files:**
- Create: `web/lib/portal-types.ts`

- [ ] **Step 1: Write portal entity types**

```typescript
// web/lib/portal-types.ts

// ── Media & State ──

export type MediaType = "paid" | "owned" | "earned";
export type CampaignState = "plan" | "ejecutar" | "seguimiento";
export type LeadTemperature = "hot" | "warm" | "cold";
export type DealStage = "new" | "contacted" | "proposal" | "negotiation" | "won";
export type FunnelStage = "awareness" | "consideration" | "conversion" | "retention";

export type Channel =
  | "sem"
  | "social_ads"
  | "display"
  | "video_ott"
  | "seo_content"
  | "email"
  | "social_org"
  | "influencers";

// ── Entities ──

export interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  score: number;
  toneScores: { formal: number; serious: number; technical: number };
  colors: { name: string; hex: string }[];
  fonts: { heading: string; body: string };
  positioning: string;
}

export interface KPI {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  secondary?: string;
}

export interface CampaignIdea {
  id: string;
  title: string;
  description: string;
  tags: { type: string; channel: string; time: string };
  urgent?: boolean;
  urgencyDays?: number;
}

export interface Opportunity {
  id: string;
  type: "tendencia" | "competencia" | "cultura" | "industria";
  title: string;
  description: string;
  action: string;
}

export interface Campaign {
  id: string;
  name: string;
  state: CampaignState;
  startDate: string;
  endDate: string;
  objective: string;
  budget: number;
  spent: number;
  activations: Activation[];
}

export interface Activation {
  id: string;
  campaignId: string;
  name: string;
  channel: Channel;
  funnelStage: FunnelStage;
  mediaType: MediaType;
  state: CampaignState;
  kpis: { label: string; value: string }[];
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  value: number;
  stage: DealStage;
  temperature: LeadTemperature;
  lastActivity: string;
  score: number;
  touchpoints: string[];
}

export interface BudgetNode {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  locked: boolean;
  recommended?: { min: number; max: number };
  children?: BudgetNode[];
}

export interface Notification {
  id: string;
  description: string;
  source: string;
  time: string;
  action?: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  description: string;
  space: "home" | "brand" | "plan" | "campaigns" | "sales";
  time: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/lib/portal-types.ts
git commit -m "feat(portal): add TypeScript types for portal entities"
```

---

## Task 4: Mock Data

**Files:**
- Create: `web/lib/portal-mock-data.ts`

- [ ] **Step 1: Write mock data fixtures**

```typescript
// web/lib/portal-mock-data.ts

import type {
  Brand,
  KPI,
  CampaignIdea,
  Opportunity,
  Campaign,
  Activation,
  Deal,
  BudgetNode,
  Notification,
  ActivityItem,
} from "./portal-types";

// ── Brands ──

export const mockBrands: Brand[] = [
  {
    id: "b1",
    name: "Café Artesanal",
    logoUrl: null,
    score: 78,
    toneScores: { formal: 30, serious: 25, technical: 20 },
    colors: [
      { name: "Espresso", hex: "#3E2723" },
      { name: "Crema", hex: "#EFEBE9" },
      { name: "Caramelo", hex: "#FF8F00" },
    ],
    fonts: { heading: "Playfair Display", body: "Inter" },
    positioning: "Café de especialidad costarricense para profesionales que valoran la calidad y el origen.",
  },
  {
    id: "b2",
    name: "Tostadores CR",
    logoUrl: null,
    score: 62,
    toneScores: { formal: 60, serious: 55, technical: 45 },
    colors: [
      { name: "Negro", hex: "#212121" },
      { name: "Blanco", hex: "#FAFAFA" },
      { name: "Dorado", hex: "#FFD54F" },
    ],
    fonts: { heading: "Montserrat", body: "Open Sans" },
    positioning: "Proveedor premium de café tostado para hoteles y restaurantes de Costa Rica.",
  },
];

// ── Home KPIs ──

export const mockHomeKPIs: KPI[] = [
  { label: "Campañas activas", value: 4, delta: "+1", trend: "up" },
  { label: "En producción", value: 7, secondary: "3 videos, 2 posts, 2 emails", trend: "flat" },
  { label: "Leads este mes", value: 23, delta: "+18%", trend: "up" },
  { label: "Brand score", value: "78/100", delta: "+5pts", trend: "up" },
];

// ── Ideas ──

export const mockIdeas: CampaignIdea[] = [
  {
    id: "i1",
    title: "Campaña Día de las Madres",
    description: "Video emocional mostrando rituales de café entre madres e hijos. Alta demanda estacional.",
    tags: { type: "Video", channel: "Social Ads", time: "2 semanas" },
    urgent: true,
    urgencyDays: 7,
  },
  {
    id: "i2",
    title: "Serie educativa: Del grano a la taza",
    description: "4 reels cortos sobre el proceso de tostado, ideal para posicionamiento orgánico.",
    tags: { type: "Contenido", channel: "Social Org", time: "3 semanas" },
  },
  {
    id: "i3",
    title: "Email de fidelización Q2",
    description: "Secuencia de 3 emails para clientes recurrentes con descuento exclusivo y encuesta NPS.",
    tags: { type: "Email", channel: "Email", time: "1 semana" },
  },
];

// ── Opportunities ──

export const mockOpportunities: Opportunity[] = [
  {
    id: "o1",
    type: "tendencia",
    title: "Cold brew en alza +40%",
    description: "Las búsquedas de cold brew subieron 40% en CR en los últimos 30 días.",
    action: "Crear contenido",
  },
  {
    id: "o2",
    type: "competencia",
    title: "Competidor lanzó programa de suscripción",
    description: "Britt Coffee lanzó suscripción mensual a ₡12,000. Oportunidad de diferenciación.",
    action: "Analizar",
  },
  {
    id: "o3",
    type: "cultura",
    title: "Festival del Café Naranjo",
    description: "19-21 abril. Posibilidad de presencia de marca y contenido en vivo.",
    action: "Aprovechar",
  },
];

// ── Campaigns & Activations ──

export const mockActivations: Activation[] = [
  { id: "a1", campaignId: "c1", name: "Meta Awareness Ads", channel: "social_ads", funnelStage: "awareness", mediaType: "paid", state: "ejecutar", kpis: [{ label: "CPM", value: "$4.20" }, { label: "Reach", value: "45K" }] },
  { id: "a2", campaignId: "c1", name: "Google Search", channel: "sem", funnelStage: "consideration", mediaType: "paid", state: "ejecutar", kpis: [{ label: "CPC", value: "$0.85" }, { label: "CTR", value: "3.2%" }] },
  { id: "a3", campaignId: "c1", name: "Landing page SEO", channel: "seo_content", funnelStage: "consideration", mediaType: "owned", state: "plan", kpis: [] },
  { id: "a4", campaignId: "c1", name: "Email nurture sequence", channel: "email", funnelStage: "conversion", mediaType: "owned", state: "plan", kpis: [] },
  { id: "a5", campaignId: "c1", name: "Meta Retargeting", channel: "social_ads", funnelStage: "conversion", mediaType: "paid", state: "seguimiento", kpis: [{ label: "ROAS", value: "3.8x" }, { label: "Conv", value: "12" }] },
  { id: "a6", campaignId: "c2", name: "Instagram Reels", channel: "social_ads", funnelStage: "awareness", mediaType: "paid", state: "ejecutar", kpis: [{ label: "Views", value: "22K" }] },
  { id: "a7", campaignId: "c2", name: "Blog posts", channel: "seo_content", funnelStage: "awareness", mediaType: "owned", state: "ejecutar", kpis: [{ label: "Sessions", value: "1.2K" }] },
  { id: "a8", campaignId: "c2", name: "Influencer collab", channel: "influencers", funnelStage: "awareness", mediaType: "earned", state: "plan", kpis: [] },
  { id: "a9", campaignId: "c3", name: "Newsletter mensual", channel: "email", funnelStage: "retention", mediaType: "owned", state: "ejecutar", kpis: [{ label: "Open", value: "42%" }] },
  { id: "a10", campaignId: "c3", name: "NPS survey email", channel: "email", funnelStage: "retention", mediaType: "owned", state: "plan", kpis: [] },
];

export const mockCampaigns: Campaign[] = [
  { id: "c1", name: "Día de las Madres", state: "ejecutar", startDate: "2026-04-14", endDate: "2026-05-11", objective: "Incrementar ventas 20%", budget: 5000, spent: 2100, activations: mockActivations.filter(a => a.campaignId === "c1") },
  { id: "c2", name: "Del grano a la taza", state: "plan", startDate: "2026-04-21", endDate: "2026-06-15", objective: "Brand awareness +30%", budget: 3000, spent: 0, activations: mockActivations.filter(a => a.campaignId === "c2") },
  { id: "c3", name: "Programa fidelización", state: "ejecutar", startDate: "2026-01-01", endDate: "2026-12-31", objective: "Retención >80%", budget: 1200, spent: 400, activations: mockActivations.filter(a => a.campaignId === "c3") },
];

// ── Sales Deals ──

export const mockDeals: Deal[] = [
  { id: "d1", name: "Hotel Presidente", description: "Café para restaurante del hotel, 50kg/mes", value: 850000, stage: "negotiation", temperature: "hot", lastActivity: "Hace 2 horas", score: 88, touchpoints: ["Email sent", "WhatsApp", "Called"] },
  { id: "d2", name: "Coworking Hub CR", description: "Estación de café y suministro mensual", value: 320000, stage: "proposal", temperature: "warm", lastActivity: "Hace 1 día", score: 65, touchpoints: ["Email sent", "WhatsApp"] },
  { id: "d3", name: "Restaurante Silvestre", description: "Carta de café de especialidad", value: 480000, stage: "contacted", temperature: "warm", lastActivity: "Hace 3 días", score: 52, touchpoints: ["Called"] },
  { id: "d4", name: "Tienda Orgánica Vida", description: "Retail 10 SKUs en estante", value: 250000, stage: "new", temperature: "cold", lastActivity: "Hace 5 días", score: 30, touchpoints: [] },
  { id: "d5", name: "Café del Teatro Nacional", description: "Proveedor exclusivo de café", value: 1200000, stage: "won", temperature: "hot", lastActivity: "Hace 1 semana", score: 95, touchpoints: ["Email sent", "WhatsApp", "Called", "Meeting"] },
];

// ── Budget ──

export const mockBudgetQ2: BudgetNode = {
  id: "q2",
  label: "Q2 2026",
  percentage: 30,
  amount: 9200,
  locked: false,
  children: [
    {
      id: "q2-aw", label: "Awareness", percentage: 40, amount: 3680, locked: false,
      recommended: { min: 35, max: 50 },
      children: [
        { id: "q2-aw-sem", label: "SEM", percentage: 25, amount: 920, locked: false },
        { id: "q2-aw-social", label: "Social Ads", percentage: 40, amount: 1472, locked: false },
        { id: "q2-aw-display", label: "Display", percentage: 15, amount: 552, locked: false },
        { id: "q2-aw-seo", label: "SEO/Content", percentage: 20, amount: 736, locked: false },
      ],
    },
    {
      id: "q2-co", label: "Consideration", percentage: 25, amount: 2300, locked: false,
      recommended: { min: 20, max: 30 },
      children: [
        { id: "q2-co-sem", label: "SEM", percentage: 35, amount: 805, locked: false },
        { id: "q2-co-social", label: "Social Ads", percentage: 30, amount: 690, locked: false },
        { id: "q2-co-seo", label: "SEO/Content", percentage: 35, amount: 805, locked: false },
      ],
    },
    {
      id: "q2-cv", label: "Conversion", percentage: 25, amount: 2300, locked: false,
      recommended: { min: 20, max: 30 },
      children: [
        { id: "q2-cv-sem", label: "SEM", percentage: 40, amount: 920, locked: false },
        { id: "q2-cv-email", label: "Email", percentage: 30, amount: 690, locked: false },
        { id: "q2-cv-social", label: "Social Ads", percentage: 30, amount: 690, locked: false },
      ],
    },
    {
      id: "q2-re", label: "Retention", percentage: 10, amount: 920, locked: false,
      recommended: { min: 5, max: 15 },
      children: [
        { id: "q2-re-email", label: "Email", percentage: 60, amount: 552, locked: false },
        { id: "q2-re-social", label: "Social Org", percentage: 40, amount: 368, locked: false },
      ],
    },
  ],
};

// ── Notifications ──

export const mockNotifications: Notification[] = [
  { id: "n1", description: "Video 'Día de las Madres' listo para revisión", source: "campaigns", time: "Hace 10 min", action: "Revisar", read: false },
  { id: "n2", description: "Propuesta para Hotel Presidente generada", source: "sales", time: "Hace 1 hora", action: "Ver propuesta", read: false },
  { id: "n3", description: "Brand score subió a 78/100", source: "brand", time: "Hace 3 horas", read: true },
];

// ── Activity Feed ──

export const mockActivity: ActivityItem[] = [
  { id: "ac1", description: "Activation 'Meta Awareness Ads' cambió a Ejecutar", space: "campaigns", time: "Hace 15 min" },
  { id: "ac2", description: "Nuevo lead: Hotel Presidente", space: "sales", time: "Hace 2 horas" },
  { id: "ac3", description: "Brand guardian aprobó post de Instagram", space: "brand", time: "Hace 4 horas" },
  { id: "ac4", description: "Brief 'Del grano a la taza' creado por Copilot", space: "campaigns", time: "Ayer" },
  { id: "ac5", description: "Budget Q2 ajustado: +5% a Awareness", space: "plan", time: "Ayer" },
];

// ── Channel metadata ──

export const CHANNELS: Record<string, { label: string; description: string }> = {
  sem: { label: "SEM", description: "Search Engine Marketing" },
  social_ads: { label: "Social Ads", description: "Paid social campaigns" },
  display: { label: "Display", description: "Banner & programmatic" },
  video_ott: { label: "Video/OTT", description: "Video & streaming ads" },
  seo_content: { label: "SEO/Content", description: "Organic search & content" },
  email: { label: "Email", description: "Email marketing" },
  social_org: { label: "Social Org", description: "Organic social media" },
  influencers: { label: "Influencers", description: "Creator partnerships" },
};

export const FUNNEL_STAGES: Record<string, { label: string; kpis: string[] }> = {
  awareness: { label: "Awareness", kpis: ["Impressions", "CPM", "Reach"] },
  consideration: { label: "Consideration", kpis: ["Clicks", "CTR", "CPC"] },
  conversion: { label: "Conversion", kpis: ["ROAS", "CAC", "Conv Rate"] },
  retention: { label: "Retention", kpis: ["LTV", "Churn", "Ret Rate"] },
};
```

- [ ] **Step 2: Commit**

```bash
git add web/lib/portal-mock-data.ts
git commit -m "feat(portal): add mock data fixtures for all portal sections"
```

---

## Task 5: Base Portal UI Components (Part 1 — Atoms)

**Files:**
- Create: `web/components/portal/kpi-card.tsx`
- Create: `web/components/portal/portal-card.tsx`
- Create: `web/components/portal/state-badge.tsx`
- Create: `web/components/portal/media-dot.tsx`
- Create: `web/components/portal/filter-group.tsx`
- Create: `web/components/portal/section-header.tsx`

- [ ] **Step 1: Create KPI card**

```tsx
// web/components/portal/kpi-card.tsx
import { cn } from "@/lib/utils";
import type { KPI } from "@/lib/portal-types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColor = {
  up: "text-[#00c2a8]",
  down: "text-[#ff6b6b]",
  flat: "text-portal-text-muted",
};

export function KPICard({ label, value, delta, trend, secondary }: KPI) {
  const TrendIcon = trend ? trendIcon[trend] : null;

  return (
    <div className="bg-white rounded-2xl p-5 portal-shadow">
      <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-[800] tracking-[-1px] text-portal-text leading-none">
          {value}
        </span>
        {delta && trend && TrendIcon && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor[trend])}>
            <TrendIcon size={14} />
            {delta}
          </span>
        )}
      </div>
      {secondary && (
        <p className="text-[11px] text-portal-text-muted mt-1">{secondary}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create portal card**

```tsx
// web/components/portal/portal-card.tsx
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface PortalCardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function PortalCard({ className, noPadding, children, ...props }: PortalCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl portal-shadow border border-portal-border",
        !noPadding && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create state badge**

```tsx
// web/components/portal/state-badge.tsx
import { cn } from "@/lib/utils";
import type { CampaignState } from "@/lib/portal-types";

const stateStyles: Record<CampaignState, string> = {
  plan: "bg-state-plan-bg text-state-plan-text",
  ejecutar: "bg-state-exec-bg text-state-exec-text",
  seguimiento: "bg-state-track-bg text-state-track-text",
};

const stateLabels: Record<CampaignState, string> = {
  plan: "Plan",
  ejecutar: "Ejecutar",
  seguimiento: "Seguimiento",
};

export function StateBadge({ state }: { state: CampaignState }) {
  return (
    <span
      className={cn(
        "inline-block text-[7px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded",
        stateStyles[state]
      )}
    >
      {stateLabels[state]}
    </span>
  );
}
```

- [ ] **Step 4: Create media dot**

```tsx
// web/components/portal/media-dot.tsx
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/portal-types";

const dotColors: Record<MediaType, string> = {
  paid: "bg-media-paid",
  owned: "bg-media-owned",
  earned: "bg-media-earned",
};

export function MediaDot({ type, size = 8 }: { type: MediaType; size?: number }) {
  return (
    <span
      className={cn("inline-block rounded-full", dotColors[type])}
      style={{ width: size, height: size }}
    />
  );
}
```

- [ ] **Step 5: Create filter group**

```tsx
// web/components/portal/filter-group.tsx
"use client";

import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  dot?: string; // CSS color class for dot indicator
}

interface FilterGroupProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterGroup({ options, value, onChange }: FilterGroupProps) {
  return (
    <div className="inline-flex bg-white border border-portal-border rounded-[10px] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
            value === opt.value
              ? "bg-portal-text text-white"
              : "text-portal-text-muted hover:text-portal-text"
          )}
        >
          {opt.dot && (
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: opt.dot }}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create section header**

```tsx
// web/components/portal/section-header.tsx
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-portal-text">{title}</h2>
      {action}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add web/components/portal/
git commit -m "feat(portal): add base UI atoms — KPICard, PortalCard, StateBadge, MediaDot, FilterGroup, SectionHeader"
```

---

## Task 6: Portal Layout Shell

**Files:**
- Create: `web/components/portal/portal-nav.tsx`
- Create: `web/components/portal/copilot-fab.tsx`
- Create: `web/components/portal/avatar-dropdown.tsx`
- Create: `web/components/portal/notifications-dropdown.tsx`
- Create: `web/app/client/layout.tsx`

- [ ] **Step 1: Create portal nav**

```tsx
// web/components/portal/portal-nav.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, Palette, Target, Megaphone, DollarSign } from "lucide-react";

const navItems = [
  { href: "/client", label: "Home", icon: Home },
  { href: "/client/brand", label: "Brand", icon: Palette },
  { href: "/client/plan", label: "Plan", icon: Target },
  { href: "/client/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/client/sales", label: "Sales", icon: DollarSign },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/client"
            ? pathname === "/client"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              isActive
                ? "text-portal-text"
                : "text-portal-text-muted hover:text-portal-text"
            )}
          >
            <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-portal-text rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Create notifications dropdown**

```tsx
// web/components/portal/notifications-dropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { mockNotifications } from "@/lib/portal-mock-data";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
      >
        <Bell size={18} className="text-portal-text-muted" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff6b6b] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl portal-shadow border border-portal-border z-50 overflow-hidden">
          <div className="p-3 border-b border-portal-border">
            <p className="text-xs font-semibold text-portal-text">Notificaciones</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "px-3 py-2.5 border-b border-portal-border last:border-0 hover:bg-gray-50 transition-colors",
                  !n.read && "bg-blue-50/30"
                )}
              >
                <p className="text-xs text-portal-text">{n.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-portal-text-dim">{n.time}</span>
                  {n.action && (
                    <button className="text-[10px] font-semibold text-portal-accent hover:underline">
                      {n.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Needed for the cn function inside this component:
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
```

Wait — this file already imports `cn` from utils in other components. Let me fix: this component should import from `@/lib/utils`. Remove the local `cn` and add the import at the top. Actually let me rewrite correctly:

```tsx
// web/components/portal/notifications-dropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockNotifications } from "@/lib/portal-mock-data";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
      >
        <Bell size={18} className="text-portal-text-muted" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff6b6b] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl portal-shadow border border-portal-border z-50 overflow-hidden">
          <div className="p-3 border-b border-portal-border">
            <p className="text-xs font-semibold text-portal-text">Notificaciones</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "px-3 py-2.5 border-b border-portal-border last:border-0 hover:bg-gray-50 transition-colors",
                  !n.read && "bg-blue-50/30"
                )}
              >
                <p className="text-xs text-portal-text">{n.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-portal-text-dim">{n.time}</span>
                  {n.action && (
                    <button className="text-[10px] font-semibold text-portal-accent hover:underline">
                      {n.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create avatar dropdown**

```tsx
// web/components/portal/avatar-dropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, User } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface AvatarDropdownProps {
  name: string;
  email?: string;
}

export function AvatarDropdown({ name, email }: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-portal-text text-white text-xs font-semibold flex items-center justify-center hover:opacity-80 transition-opacity"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl portal-shadow border border-portal-border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-portal-border">
            <p className="text-xs font-semibold text-portal-text">{name}</p>
            {email && <p className="text-[10px] text-portal-text-muted">{email}</p>}
          </div>
          <div className="py-1">
            <Link
              href="/client/setup"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-portal-text-secondary hover:bg-gray-50 transition-colors"
            >
              <Settings size={14} />
              Setup
            </Link>
            <button
              onClick={() => signOut().then(() => router.replace("/auth/sign-in"))}
              className="flex items-center gap-2 px-4 py-2 text-xs text-portal-text-secondary hover:bg-gray-50 transition-colors w-full text-left"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create Copilot FAB**

```tsx
// web/components/portal/copilot-fab.tsx
"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { CopilotDrawer } from "./copilot-drawer";

export function CopilotFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#f5a623] to-[#ed854b] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label="Abrir Copilot"
      >
        <MessageCircle size={24} />
      </button>

      {/* Drawer */}
      {open && <CopilotDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
```

- [ ] **Step 5: Create Copilot drawer (placeholder)**

```tsx
// web/components/portal/copilot-drawer.tsx
"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

interface CopilotDrawerProps {
  onClose: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function CopilotDrawer({ onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola! Soy tu Copilot. ¿En qué te puedo ayudar hoy?" },
  ]);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "Entendido. Estoy procesando tu solicitud..." },
    ]);
    setInput("");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/10 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[350px] bg-white z-50 flex flex-col shadow-xl border-l border-portal-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-portal-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f5a623] to-[#ed854b]" />
            <span className="text-sm font-semibold text-portal-text">Copilot</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-portal-text-muted" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "assistant"
                  ? "bg-[#fff8eb] text-portal-text text-xs p-3 rounded-2xl rounded-tl-sm max-w-[85%]"
                  : "bg-gray-100 text-portal-text text-xs p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto"
              }
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-portal-border">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe un mensaje..."
              className="flex-1 text-xs bg-gray-50 border border-portal-border rounded-xl px-3 py-2 outline-none focus:border-portal-accent transition-colors"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-portal-text text-white rounded-xl hover:opacity-80 transition-opacity"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Create portal layout**

```tsx
// web/app/client/layout.tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PortalNav } from "@/components/portal/portal-nav";
import { NotificationsDropdown } from "@/components/portal/notifications-dropdown";
import { AvatarDropdown } from "@/components/portal/avatar-dropdown";
import { CopilotFAB } from "@/components/portal/copilot-fab";
import { Sun, Moon } from "lucide-react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/auth/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-portal-text-muted text-sm">Cargando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-portal-bg">
      {/* Dot pattern background */}
      <div className="portal-dot-bg" />

      {/* Top nav bar */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-portal-border sticky top-0">
        <div className="max-w-[1140px] mx-auto px-8 h-14 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <span className="text-base font-bold text-portal-text tracking-tight">
              criteria<span className="text-portal-accent">.</span>agency
            </span>
            <PortalNav />
          </div>

          {/* Right: Theme toggle, Notifications, Avatar */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <Sun size={16} className="text-portal-text-muted" />
            </button>
            <NotificationsDropdown />
            <AvatarDropdown
              name={session.user.name || "Usuario"}
              email={session.user.email}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-[1] max-w-[1140px] mx-auto px-8 py-7">
        {children}
      </main>

      {/* Copilot FAB */}
      <CopilotFAB />
    </div>
  );
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```

Fix any type errors before proceeding.

- [ ] **Step 8: Commit**

```bash
git add web/components/portal/portal-nav.tsx web/components/portal/copilot-fab.tsx web/components/portal/copilot-drawer.tsx web/components/portal/avatar-dropdown.tsx web/components/portal/notifications-dropdown.tsx web/app/client/layout.tsx
git commit -m "feat(portal): add portal layout shell — nav, notifications, avatar, copilot FAB"
```

---

## Task 7: Brand Selector Component

**Files:**
- Create: `web/components/portal/brand-selector.tsx`

- [ ] **Step 1: Create brand selector dropdown**

```tsx
// web/components/portal/brand-selector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand } from "@/lib/portal-types";

interface BrandSelectorProps {
  brands: Brand[];
  selected: string;
  onChange: (brandId: string) => void;
}

export function BrandSelector({ brands, selected, onChange }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = brands.find((b) => b.id === selected);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-portal-border rounded-[10px] text-xs font-medium text-portal-text hover:border-portal-text-dim transition-colors"
      >
        <span className="w-3 h-3 rounded-full bg-portal-accent" />
        {current?.name || "Select brand"}
        <ChevronDown size={14} className="text-portal-text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl portal-shadow border border-portal-border z-50 overflow-hidden">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => {
                onChange(brand.id);
                setOpen(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-xs text-portal-text hover:bg-gray-50 transition-colors"
            >
              <span>{brand.name}</span>
              {brand.id === selected && <Check size={14} className="text-portal-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/portal/brand-selector.tsx
git commit -m "feat(portal): add brand selector dropdown component"
```

---

## Task 8: Home Page

**Files:**
- Create: `web/components/portal/idea-card.tsx`
- Create: `web/components/portal/opportunity-card.tsx`
- Create: `web/app/client/page.tsx`

- [ ] **Step 1: Create idea card**

```tsx
// web/components/portal/idea-card.tsx
import { Clock, ArrowRight } from "lucide-react";
import type { CampaignIdea } from "@/lib/portal-types";

export function IdeaCard({ title, description, tags, urgent, urgencyDays }: CampaignIdea) {
  return (
    <div className="bg-white rounded-2xl p-5 portal-shadow border border-portal-border hover:portal-shadow-hover transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-portal-text">{title}</h3>
        {urgent && urgencyDays && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#e09600] bg-[#fff8eb] px-2 py-0.5 rounded-full">
            <Clock size={10} />
            {urgencyDays} días
          </span>
        )}
      </div>
      <p className="text-[12px] text-portal-text-secondary mb-3 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{tags.type}</span>
        <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{tags.channel}</span>
        <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">{tags.time}</span>
      </div>
      <button className="flex items-center gap-1 text-[11px] font-semibold text-portal-accent hover:underline">
        Crear <ArrowRight size={12} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create opportunity card**

```tsx
// web/components/portal/opportunity-card.tsx
import type { Opportunity } from "@/lib/portal-types";

const typeColors: Record<string, string> = {
  tendencia: "#00c2a8",
  competencia: "#7c5cfc",
  cultura: "#ff6b6b",
  industria: "#f5a623",
};

const typeLabels: Record<string, string> = {
  tendencia: "Tendencia",
  competencia: "Competencia",
  cultura: "Cultura",
  industria: "Industria",
};

export function OpportunityCard({ type, title, description, action }: Opportunity) {
  return (
    <div className="bg-white rounded-2xl p-4 portal-shadow border border-portal-border">
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: typeColors[type] }}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-portal-text-muted">
          {typeLabels[type]}
        </span>
      </div>
      <h3 className="text-[13px] font-semibold text-portal-text mb-1">{title}</h3>
      <p className="text-[11px] text-portal-text-secondary mb-3 leading-relaxed">{description}</p>
      <button className="text-[11px] font-semibold text-portal-accent hover:underline">
        {action} →
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create home page**

```tsx
// web/app/client/page.tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { KPICard } from "@/components/portal/kpi-card";
import { IdeaCard } from "@/components/portal/idea-card";
import { OpportunityCard } from "@/components/portal/opportunity-card";
import { PortalCard } from "@/components/portal/portal-card";
import { SectionHeader } from "@/components/portal/section-header";
import {
  mockHomeKPIs,
  mockIdeas,
  mockOpportunities,
  mockActivity,
} from "@/lib/portal-mock-data";
import { RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ClientHome() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0] || "Usuario";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">
          Buenos días, {firstName}
        </h1>
        <p className="text-sm text-portal-text-muted mt-1">
          4 campañas activas y 3 oportunidades nuevas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {mockHomeKPIs.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Ideas + Opportunities */}
      <div className="grid grid-cols-3 gap-4">
        {/* Ideas (2/3) */}
        <div className="col-span-2">
          <SectionHeader
            title="Ideas para ti"
            action={
              <button className="flex items-center gap-1 text-[11px] text-portal-text-muted hover:text-portal-text transition-colors">
                <RefreshCw size={12} />
                Más ideas
              </button>
            }
          />
          <div className="grid grid-cols-1 gap-3">
            {mockIdeas.map((idea) => (
              <IdeaCard key={idea.id} {...idea} />
            ))}
          </div>
        </div>

        {/* Opportunities (1/3) */}
        <div>
          <SectionHeader
            title="Oportunidades"
            action={
              <Link
                href="/client/plan"
                className="text-[11px] text-portal-accent hover:underline flex items-center gap-0.5"
              >
                Ver todas <ArrowRight size={10} />
              </Link>
            }
          />
          <div className="space-y-3">
            {mockOpportunities.map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
          </div>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
            Rendimiento de campañas
          </p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">
            Chart placeholder — Area chart (alcance + engagement)
          </div>
        </PortalCard>
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
            Funnel de ventas
          </p>
          <div className="h-48 flex items-center justify-center text-portal-text-dim text-xs">
            Chart placeholder — Horizontal bars (Visitantes → Cerrados)
          </div>
        </PortalCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <PortalCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
              Producción de contenido
            </p>
            <div className="h-40 flex items-center justify-center text-portal-text-dim text-xs">
              Chart placeholder — Stacked bar by month and type
            </div>
          </PortalCard>
        </div>
        <PortalCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted mb-2">
            Inversión mensual
          </p>
          <div className="h-40 flex items-center justify-center text-portal-text-dim text-xs">
            Chart placeholder — Donut chart
          </div>
        </PortalCard>
      </div>

      {/* Activity Feed */}
      <div>
        <SectionHeader title="Actividad reciente" />
        <div className="space-y-0">
          {mockActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-portal-text-dim" />
              <span className="text-[12px] text-portal-text-secondary flex-1">{item.description}</span>
              <span className="text-[10px] text-portal-text-dim">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the page renders**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add web/components/portal/idea-card.tsx web/components/portal/opportunity-card.tsx web/app/client/page.tsx
git commit -m "feat(portal): add Home page with KPIs, ideas, opportunities, charts, feed"
```

---

## Task 9: Brand Page

**Files:**
- Create: `web/components/portal/identity-card.tsx`
- Create: `web/components/portal/tone-slider.tsx`
- Create: `web/app/client/brand/page.tsx`

- [ ] **Step 1: Create identity card**

```tsx
// web/components/portal/identity-card.tsx
import { ArrowRight } from "lucide-react";

interface IdentityCardProps {
  title: string;
  children: React.ReactNode;
}

export function IdentityCard({ title, children }: IdentityCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 portal-shadow border border-portal-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted">{title}</p>
        <button className="text-[11px] font-semibold text-portal-accent hover:underline flex items-center gap-0.5">
          Editar <ArrowRight size={10} />
        </button>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create tone slider (read-only spectrum)**

```tsx
// web/components/portal/tone-slider.tsx
interface ToneSliderProps {
  labelLeft: string;
  labelRight: string;
  value: number; // 0-100
}

export function ToneSlider({ labelLeft, labelRight, value }: ToneSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-portal-text-muted w-16 text-right">{labelLeft}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-portal-text border-2 border-white shadow"
          style={{ left: `${value}%`, marginLeft: -6 }}
        />
      </div>
      <span className="text-[10px] text-portal-text-muted w-16">{labelRight}</span>
    </div>
  );
}
```

- [ ] **Step 3: Create brand page**

```tsx
// web/app/client/brand/page.tsx
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Brand</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary hover:border-portal-text-dim transition-colors">
            <Download size={14} />
            Descargar brand kit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-portal-text text-white rounded-[10px] hover:opacity-80 transition-opacity">
            <MessageCircle size={14} />
            Editar con Copilot
          </button>
          <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
        </div>
      </div>

      {/* Brand Score */}
      <PortalCard>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#eee" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.91" fill="none" stroke="#f5a623"
                  strokeWidth="3" strokeDasharray={`${brand.score} ${100 - brand.score}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-[800] text-portal-text">
                {brand.score}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-portal-text">Brand Score</p>
              <p className="text-[11px] text-portal-text-muted">/100</p>
            </div>
          </div>
          <div className="flex gap-6">
            {[
              { label: "Tono de voz", score: 82 },
              { label: "Visual", score: 75 },
              { label: "Mensaje", score: 77 },
            ].map((sub) => (
              <div key={sub.label} className="text-center">
                <p className="text-lg font-[800] text-portal-text">{sub.score}</p>
                <p className="text-[10px] text-portal-text-muted">{sub.label}</p>
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-[#00c2a8] font-medium">
            <TrendingUp size={14} />
            +5pts
          </div>
        </div>
      </PortalCard>

      {/* Identity Cards */}
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

      {/* Tone of Voice */}
      <PortalCard>
        <SectionHeader title="Tono de voz" action={<button className="text-[11px] font-semibold text-portal-accent hover:underline">Editar →</button>} />
        <div className="space-y-4">
          <ToneSlider labelLeft="Formal" labelRight="Casual" value={brand.toneScores.formal} />
          <ToneSlider labelLeft="Serio" labelRight="Divertido" value={brand.toneScores.serious} />
          <ToneSlider labelLeft="Técnico" labelRight="Accesible" value={brand.toneScores.technical} />
        </div>
      </PortalCard>

      {/* Positioning */}
      <PortalCard>
        <SectionHeader title="Positioning" action={<button className="text-[11px] font-semibold text-portal-accent hover:underline">Editar →</button>} />
        <blockquote className="text-sm text-portal-text-secondary italic border-l-2 border-portal-accent pl-4">
          {brand.positioning}
        </blockquote>
      </PortalCard>

      {/* Brand Guardian */}
      <PortalCard>
        <SectionHeader title="Brand Guardian" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#00c2a8]" />
            <span className="text-xs font-medium text-[#00c2a8]">Activo</span>
          </div>
          <div className="flex gap-6">
            {[
              { label: "Validaciones", value: 24 },
              { label: "Ajustes", value: 3 },
              { label: "Violaciones", value: 0 },
              { label: "Compliance", value: "96%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-[800] text-portal-text">{stat.value}</p>
                <p className="text-[10px] text-portal-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </PortalCard>

      {/* Brand Manual */}
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
            <button className="px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary hover:border-portal-text-dim transition-colors">
              Vista previa
            </button>
            <button className="px-3 py-1.5 text-xs font-medium bg-portal-text text-white rounded-[10px] hover:opacity-80 transition-opacity">
              Descargar PDF
            </button>
          </div>
        </div>
      </PortalCard>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/components/portal/identity-card.tsx web/components/portal/tone-slider.tsx web/app/client/brand/page.tsx
git commit -m "feat(portal): add Brand page — score, identity, tone, positioning, guardian, manual"
```

---

## Task 10: Plan Page (Strategy + Budget Equalizer)

**Files:**
- Create: `web/components/portal/budget-equalizer.tsx`
- Create: `web/app/client/plan/page.tsx`

- [ ] **Step 1: Write budget equalizer tests**

```bash
mkdir -p web/__tests__
```

Create: `web/__tests__/budget-equalizer.test.ts`

```typescript
// web/__tests__/budget-equalizer.test.ts
import { describe, it, expect } from "vitest";
import { rebalanceSiblings } from "../components/portal/budget-equalizer";

describe("rebalanceSiblings", () => {
  it("redistributes unlocked siblings proportionally", () => {
    const nodes = [
      { id: "a", percentage: 40, locked: true },
      { id: "b", percentage: 30, locked: false },
      { id: "c", percentage: 30, locked: false },
    ];
    // Increase "a" to 50 → locked total = 50, remaining 50 split among b/c (30:30 = 50:50)
    const result = rebalanceSiblings(nodes, "a", 50);
    expect(result.find((n) => n.id === "a")!.percentage).toBe(50);
    expect(result.find((n) => n.id === "b")!.percentage).toBe(25);
    expect(result.find((n) => n.id === "c")!.percentage).toBe(25);
  });

  it("respects locked siblings", () => {
    const nodes = [
      { id: "a", percentage: 40, locked: false },
      { id: "b", percentage: 30, locked: true },
      { id: "c", percentage: 30, locked: false },
    ];
    // Increase "a" to 60 → b stays 30, c gets 10
    const result = rebalanceSiblings(nodes, "a", 60);
    expect(result.find((n) => n.id === "a")!.percentage).toBe(60);
    expect(result.find((n) => n.id === "b")!.percentage).toBe(30);
    expect(result.find((n) => n.id === "c")!.percentage).toBe(10);
  });

  it("sum always equals 100", () => {
    const nodes = [
      { id: "a", percentage: 25, locked: false },
      { id: "b", percentage: 25, locked: false },
      { id: "c", percentage: 25, locked: false },
      { id: "d", percentage: 25, locked: false },
    ];
    const result = rebalanceSiblings(nodes, "a", 70);
    const sum = result.reduce((acc, n) => acc + n.percentage, 0);
    expect(sum).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2 && npx vitest run web/__tests__/budget-equalizer.test.ts 2>&1 | tail -10
```

Expected: FAIL with "rebalanceSiblings is not a function"

- [ ] **Step 3: Create budget equalizer component with rebalance logic**

```tsx
// web/components/portal/budget-equalizer.tsx
"use client";

import { useState } from "react";
import { Lock, Unlock, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetNode } from "@/lib/portal-types";

// ── Rebalance logic (exported for testing) ──

interface RebalanceInput {
  id: string;
  percentage: number;
  locked: boolean;
}

export function rebalanceSiblings(
  nodes: RebalanceInput[],
  changedId: string,
  newPercentage: number
): RebalanceInput[] {
  const changed = nodes.find((n) => n.id === changedId);
  if (!changed) return nodes;

  const clamped = Math.max(0, Math.min(100, newPercentage));
  const lockedTotal = nodes
    .filter((n) => n.id !== changedId && n.locked)
    .reduce((sum, n) => sum + n.percentage, 0);

  const remaining = 100 - clamped - lockedTotal;
  const unlocked = nodes.filter((n) => n.id !== changedId && !n.locked);
  const unlockTotal = unlocked.reduce((sum, n) => sum + n.percentage, 0);

  return nodes.map((node) => {
    if (node.id === changedId) return { ...node, percentage: clamped };
    if (node.locked) return node;
    const share = unlockTotal > 0 ? node.percentage / unlockTotal : 1 / unlocked.length;
    return { ...node, percentage: Math.max(0, Math.round(remaining * share)) };
  });
}

// ── Component ──

interface BudgetEqualizerProps {
  root: BudgetNode;
  annualBudget: number;
}

export function BudgetEqualizer({ root, annualBudget }: BudgetEqualizerProps) {
  const [path, setPath] = useState<string[]>([]);
  const [data, setData] = useState<BudgetNode>(root);

  // Navigate to node by path
  function getNodeAtPath(node: BudgetNode, segments: string[]): BudgetNode | null {
    let current: BudgetNode | null = node;
    for (const seg of segments) {
      current = current?.children?.find((c) => c.id === seg) || null;
    }
    return current;
  }

  const currentNode = path.length === 0 ? data : getNodeAtPath(data, path);
  if (!currentNode || !currentNode.children) {
    return (
      <div className="text-xs text-portal-text-muted">
        <button onClick={() => setPath(path.slice(0, -1))} className="flex items-center gap-1 text-portal-accent hover:underline mb-4">
          <ArrowLeft size={14} /> Volver
        </button>
        <p>No hay sub-niveles</p>
      </div>
    );
  }

  function handleDrillDown(childId: string) {
    const child = currentNode?.children?.find((c) => c.id === childId);
    if (child?.children && child.children.length > 0) {
      setPath([...path, childId]);
    }
  }

  function handleSliderChange(childId: string, newPct: number) {
    // Simple local rebalance for display
    if (!currentNode?.children) return;
    const rebalanced = rebalanceSiblings(
      currentNode.children.map((c) => ({ id: c.id, percentage: c.percentage, locked: c.locked })),
      childId,
      newPct
    );
    // Update data immutably (simplified — only updates current level)
    function updateNode(node: BudgetNode, segments: string[], newChildren: RebalanceInput[]): BudgetNode {
      if (segments.length === 0) {
        return {
          ...node,
          children: node.children?.map((child) => {
            const updated = newChildren.find((r) => r.id === child.id);
            if (!updated) return child;
            const newAmount = (node.amount * updated.percentage) / 100;
            return { ...child, percentage: updated.percentage, amount: Math.round(newAmount) };
          }),
        };
      }
      return {
        ...node,
        children: node.children?.map((child) =>
          child.id === segments[0] ? updateNode(child, segments.slice(1), newChildren) : child
        ),
      };
    }
    setData(updateNode(data, path, rebalanced));
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: root.label, path: [] as string[] },
    ...path.map((seg, i) => {
      const node = getNodeAtPath(data, path.slice(0, i + 1));
      return { label: node?.label || seg, path: path.slice(0, i + 1) };
    }),
  ];

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 mb-4">
        {breadcrumbs.map((bc, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-portal-text-dim" />}
            <button
              onClick={() => setPath(bc.path)}
              className={cn(
                "text-xs",
                i === breadcrumbs.length - 1
                  ? "font-semibold text-portal-text"
                  : "text-portal-text-muted hover:text-portal-text"
              )}
            >
              {bc.label}
            </button>
          </span>
        ))}
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {currentNode.children.map((child) => {
          const hasChildren = child.children && child.children.length > 0;
          const outOfRange =
            child.recommended &&
            (child.percentage < child.recommended.min || child.percentage > child.recommended.max);

          return (
            <div key={child.id} className="flex items-center gap-3">
              {/* Label */}
              <button
                onClick={() => hasChildren && handleDrillDown(child.id)}
                className={cn(
                  "w-28 text-xs text-left truncate",
                  hasChildren ? "font-medium text-portal-accent hover:underline cursor-pointer" : "text-portal-text-secondary"
                )}
              >
                {child.label}
                {hasChildren && <ChevronRight size={10} className="inline ml-0.5" />}
              </button>

              {/* Slider */}
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={child.percentage}
                  onChange={(e) => handleSliderChange(child.id, Number(e.target.value))}
                  disabled={child.locked}
                  className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-portal-text"
                />
                {child.recommended && (
                  <div
                    className="absolute top-0 h-1.5 bg-[#00c2a8]/20 rounded-full pointer-events-none"
                    style={{
                      left: `${child.recommended.min}%`,
                      width: `${child.recommended.max - child.recommended.min}%`,
                    }}
                  />
                )}
              </div>

              {/* Percentage */}
              <span className={cn("w-10 text-right text-xs font-semibold", outOfRange ? "text-[#ff6b6b]" : "text-portal-text")}>
                {child.percentage}%
              </span>

              {/* Amount */}
              <span className="w-16 text-right text-[11px] text-portal-text-muted">
                ${child.amount.toLocaleString()}
              </span>

              {/* Lock */}
              <button
                onClick={() => {
                  // Toggle lock in data
                  function toggleLock(node: BudgetNode, segments: string[], targetId: string): BudgetNode {
                    if (segments.length === 0) {
                      return {
                        ...node,
                        children: node.children?.map((c) =>
                          c.id === targetId ? { ...c, locked: !c.locked } : c
                        ),
                      };
                    }
                    return {
                      ...node,
                      children: node.children?.map((c) =>
                        c.id === segments[0] ? toggleLock(c, segments.slice(1), targetId) : c
                      ),
                    };
                  }
                  setData(toggleLock(data, path, child.id));
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {child.locked ? (
                  <Lock size={12} className="text-portal-text-muted" />
                ) : (
                  <Unlock size={12} className="text-portal-text-dim" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2 && npx vitest run web/__tests__/budget-equalizer.test.ts 2>&1 | tail -10
```

Expected: 3 tests PASS

- [ ] **Step 5: Create Plan page**

```tsx
// web/app/client/plan/page.tsx
"use client";

import { useState } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { BrandSelector } from "@/components/portal/brand-selector";
import { SectionHeader } from "@/components/portal/section-header";
import { BudgetEqualizer } from "@/components/portal/budget-equalizer";
import { cn } from "@/lib/utils";
import { mockBrands, mockBudgetQ2, mockOpportunities } from "@/lib/portal-mock-data";
import { Target, Users, Eye, BookOpen, BarChart3 } from "lucide-react";

const tabs = [
  { id: "estrategia", label: "Estrategia", icon: Target },
  { id: "budget", label: "Budget", icon: BarChart3 },
  { id: "mercados", label: "Mercados", icon: Eye },
  { id: "oportunidades", label: "Oportunidades", icon: BookOpen },
  { id: "estudios", label: "Estudios", icon: BookOpen },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PlanPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [activeTab, setActiveTab] = useState<TabId>("estrategia");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Plan</h1>
        <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-portal-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-portal-text text-portal-text"
                : "border-transparent text-portal-text-muted hover:text-portal-text"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "estrategia" && (
        <div className="space-y-6">
          {/* Marketing Plan */}
          <PortalCard>
            <SectionHeader title="Plan de Marketing" />
            <div className="space-y-4">
              {[
                { obj: "Incrementar ventas online 20%", progress: 45, metric: "₡2.3M / ₡5M" },
                { obj: "Generar 100 leads calificados Q2", progress: 23, metric: "23 / 100" },
                { obj: "Brand awareness +30%", progress: 60, metric: "60% recall rate" },
              ].map((item) => (
                <div key={item.obj} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-portal-text">{item.obj}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-portal-accent rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-portal-text-muted w-28 text-right">{item.metric}</span>
                </div>
              ))}
            </div>
          </PortalCard>

          {/* Audiencias */}
          <PortalCard>
            <SectionHeader title="Audiencias" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { segment: "Principal", name: "Profesional urbano 28-45", traits: "Valora calidad, compra online, Instagram" },
                { segment: "Secundaria", name: "Foodie millennial 22-32", traits: "Explora cafés, TikTok, experiencias" },
                { segment: "Nicho", name: "Barista profesional", traits: "Técnico, valora origen, comunidad" },
              ].map((p) => (
                <div key={p.segment} className="border border-portal-border rounded-xl p-4">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-portal-accent">{p.segment}</span>
                  <p className="text-xs font-semibold text-portal-text mt-1">{p.name}</p>
                  <p className="text-[11px] text-portal-text-muted mt-1">{p.traits}</p>
                </div>
              ))}
            </div>
          </PortalCard>

          {/* Competitive Landscape */}
          <PortalCard>
            <SectionHeader title="Panorama competitivo" />
            <div className="text-xs text-portal-text-dim text-center py-8">
              Competitor analysis cards — placeholder
            </div>
          </PortalCard>
        </div>
      )}

      {activeTab === "budget" && (
        <PortalCard>
          <SectionHeader title="Budget Allocator — Q2 2026" />
          <p className="text-[11px] text-portal-text-muted mb-4">
            Presupuesto anual: $30,667 · Q2: ${mockBudgetQ2.amount.toLocaleString()} ({mockBudgetQ2.percentage}%)
          </p>
          <BudgetEqualizer root={mockBudgetQ2} annualBudget={30667} />
        </PortalCard>
      )}

      {activeTab === "mercados" && (
        <PortalCard>
          <SectionHeader title="Mercados" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Industry data, market size, macro trends — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "oportunidades" && (
        <div className="space-y-3">
          {mockOpportunities.map((opp) => (
            <PortalCard key={opp.id}>
              <div className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-1"
                  style={{
                    backgroundColor:
                      opp.type === "tendencia" ? "#00c2a8" :
                      opp.type === "competencia" ? "#7c5cfc" :
                      opp.type === "cultura" ? "#ff6b6b" : "#f5a623",
                  }}
                />
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-portal-text-muted">
                    {opp.type}
                  </span>
                  <h3 className="text-xs font-semibold text-portal-text mt-0.5">{opp.title}</h3>
                  <p className="text-[11px] text-portal-text-secondary mt-1">{opp.description}</p>
                </div>
                <button className="text-[11px] font-semibold text-portal-accent hover:underline whitespace-nowrap">
                  {opp.action} →
                </button>
              </div>
            </PortalCard>
          ))}
        </div>
      )}

      {activeTab === "estudios" && (
        <PortalCard>
          <SectionHeader title="Estudios" />
          <div className="text-xs text-portal-text-dim text-center py-12">
            Research cards — competitive analysis, audits, benchmarks — placeholder
          </div>
        </PortalCard>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add web/components/portal/budget-equalizer.tsx web/app/client/plan/page.tsx web/__tests__/budget-equalizer.test.ts
git commit -m "feat(portal): add Plan page with strategy subtabs and budget equalizer"
```

---

## Task 11: Campaigns Page — Funnel Matrix

**Files:**
- Create: `web/components/portal/activation-chip.tsx`
- Create: `web/components/portal/funnel-matrix.tsx`
- Create: `web/components/portal/campaign-calendar.tsx`
- Create: `web/app/client/campaigns/page.tsx`

- [ ] **Step 1: Create activation chip**

```tsx
// web/components/portal/activation-chip.tsx
import { StateBadge } from "./state-badge";
import type { Activation } from "@/lib/portal-types";
import Link from "next/link";

const mediaColors: Record<string, string> = {
  paid: "#7c5cfc",
  owned: "#00c2a8",
  earned: "#ff6b6b",
};

export function ActivationChip({ activation }: { activation: Activation }) {
  return (
    <Link
      href={`/client/campaigns/${activation.campaignId}`}
      className="block bg-white rounded-xl p-3 portal-shadow border border-portal-border hover:portal-shadow-hover transition-shadow"
    >
      <p
        className="text-[11px] font-semibold mb-1"
        style={{ color: mediaColors[activation.mediaType] }}
      >
        {activation.name}
      </p>
      <StateBadge state={activation.state} />
      {activation.kpis.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {activation.kpis.map((kpi) => (
            <span key={kpi.label} className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-1.5 py-0.5 rounded">
              {kpi.label}: {kpi.value}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Create funnel matrix**

```tsx
// web/components/portal/funnel-matrix.tsx
"use client";

import { ActivationChip } from "./activation-chip";
import { MediaDot } from "./media-dot";
import { Plus } from "lucide-react";
import type { Activation, Channel, FunnelStage } from "@/lib/portal-types";
import { CHANNELS, FUNNEL_STAGES } from "@/lib/portal-mock-data";

const channelOrder: Channel[] = [
  "sem", "social_ads", "display", "video_ott",
  "seo_content", "email", "social_org", "influencers",
];

const funnelOrder: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

// Map channels to their default media types for the dot indicator
const channelMediaTypes: Record<Channel, ("paid" | "owned" | "earned")[]> = {
  sem: ["paid"],
  social_ads: ["paid"],
  display: ["paid"],
  video_ott: ["paid"],
  seo_content: ["owned"],
  email: ["owned"],
  social_org: ["owned", "earned"],
  influencers: ["earned"],
};

interface FunnelMatrixProps {
  activations: Activation[];
}

export function FunnelMatrix({ activations }: FunnelMatrixProps) {
  function getCell(channel: Channel, stage: FunnelStage): Activation[] {
    return activations.filter(
      (a) => a.channel === channel && a.funnelStage === stage
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-36 p-2 text-left" />
            {funnelOrder.map((stage) => (
              <th key={stage} className="p-2 text-left min-w-[200px]">
                <p className="text-xs font-semibold text-portal-text">
                  {FUNNEL_STAGES[stage].label}
                </p>
                <p className="text-[9px] text-portal-text-dim mt-0.5">
                  {FUNNEL_STAGES[stage].kpis.join(" · ")}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channelOrder.map((channel) => (
            <tr key={channel} className="border-t border-portal-border">
              <td className="p-2 align-top">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {channelMediaTypes[channel].map((mt) => (
                      <MediaDot key={mt} type={mt} size={6} />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-portal-text">{CHANNELS[channel].label}</p>
                    <p className="text-[9px] text-portal-text-dim">{CHANNELS[channel].description}</p>
                  </div>
                </div>
              </td>
              {funnelOrder.map((stage) => {
                const cellActivations = getCell(channel, stage);
                return (
                  <td key={stage} className="p-2 align-top">
                    <div className="space-y-2">
                      {cellActivations.map((act) => (
                        <ActivationChip key={act.id} activation={act} />
                      ))}
                      <button className="w-full border border-dashed border-portal-border rounded-xl p-2 text-portal-text-dim hover:border-portal-accent hover:text-portal-accent transition-colors flex items-center justify-center">
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create campaign calendar (Gantt)**

```tsx
// web/components/portal/campaign-calendar.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/portal-types";

const stateColors: Record<string, string> = {
  plan: "#7c5cfc",
  ejecutar: "#e09600",
  seguimiento: "#00a88e",
};

interface CampaignCalendarProps {
  campaigns: Campaign[];
}

export function CampaignCalendar({ campaigns }: CampaignCalendarProps) {
  const [quarterStart, setQuarterStart] = useState(new Date("2026-04-01"));

  // Generate 13 weeks from quarter start
  const weeks: Date[] = [];
  for (let i = 0; i < 13; i++) {
    const d = new Date(quarterStart);
    d.setDate(d.getDate() + i * 7);
    weeks.push(d);
  }

  const today = new Date();
  const todayWeekIndex = weeks.findIndex(
    (w) => today >= w && today < new Date(w.getTime() + 7 * 86400000)
  );

  function getCampaignSpan(campaign: Campaign) {
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const startIdx = weeks.findIndex(
      (w) => start >= w && start < new Date(w.getTime() + 7 * 86400000)
    );
    const endIdx = weeks.findIndex(
      (w) => end >= w && end < new Date(w.getTime() + 7 * 86400000)
    );
    return {
      start: Math.max(0, startIdx === -1 ? 0 : startIdx),
      end: Math.min(12, endIdx === -1 ? 12 : endIdx),
    };
  }

  function formatWeek(d: Date) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  return (
    <div>
      {/* Time controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setQuarterStart(new Date(quarterStart.getTime() - 91 * 86400000))} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft size={16} className="text-portal-text-muted" />
          </button>
          <span className="text-xs font-semibold text-portal-text">Q2 2026</span>
          <button onClick={() => setQuarterStart(new Date(quarterStart.getTime() + 91 * 86400000))} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronRight size={16} className="text-portal-text-muted" />
          </button>
        </div>
      </div>

      {/* Gantt grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Week headers */}
          <div className="flex border-b border-portal-border">
            <div className="w-40 shrink-0 p-2" />
            {weeks.map((w, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 p-1 text-center text-[9px] text-portal-text-dim",
                  i === todayWeekIndex && "bg-portal-accent/10 rounded-t"
                )}
              >
                {formatWeek(w)}
              </div>
            ))}
          </div>

          {/* Campaign rows */}
          {campaigns.map((campaign) => {
            const span = getCampaignSpan(campaign);
            return (
              <div key={campaign.id} className="flex items-center border-b border-portal-border h-10">
                <div className="w-40 shrink-0 p-2">
                  <p className="text-[11px] font-medium text-portal-text truncate">{campaign.name}</p>
                </div>
                <div className="flex-1 flex relative">
                  {weeks.map((_, i) => (
                    <div key={i} className={cn("flex-1 h-10", i === todayWeekIndex && "bg-portal-accent/5")} />
                  ))}
                  {/* Bar */}
                  <div
                    className="absolute top-2 h-6 rounded-full flex items-center px-2"
                    style={{
                      left: `${(span.start / 13) * 100}%`,
                      width: `${((span.end - span.start + 1) / 13) * 100}%`,
                      backgroundColor: stateColors[campaign.state] + "20",
                      borderWidth: 1,
                      borderStyle: campaign.state === "plan" ? "dashed" : "solid",
                      borderColor: stateColors[campaign.state],
                    }}
                  >
                    <span className="text-[9px] font-medium truncate" style={{ color: stateColors[campaign.state] }}>
                      {campaign.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create campaigns page**

```tsx
// web/app/client/campaigns/page.tsx
"use client";

import { useState } from "react";
import { KPICard } from "@/components/portal/kpi-card";
import { PortalCard } from "@/components/portal/portal-card";
import { FilterGroup } from "@/components/portal/filter-group";
import { BrandSelector } from "@/components/portal/brand-selector";
import { FunnelMatrix } from "@/components/portal/funnel-matrix";
import { CampaignCalendar } from "@/components/portal/campaign-calendar";
import { SectionHeader } from "@/components/portal/section-header";
import { StateBadge } from "@/components/portal/state-badge";
import {
  mockBrands,
  mockCampaigns,
  mockActivations,
} from "@/lib/portal-mock-data";
import { Lightbulb, Grid3X3, Calendar, List } from "lucide-react";
import type { MediaType, CampaignState } from "@/lib/portal-types";
import Link from "next/link";

type ViewMode = "matrix" | "calendario" | "lista";

export default function CampaignsPage() {
  const [brandId, setBrandId] = useState(mockBrands[0].id);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("matrix");

  // Filter activations
  const filtered = mockActivations.filter((a) => {
    if (mediaFilter !== "all" && a.mediaType !== mediaFilter) return false;
    if (stateFilter !== "all" && a.state !== stateFilter) return false;
    if (campaignFilter !== "all" && a.campaignId !== campaignFilter) return false;
    return true;
  });

  const filteredCampaigns = mockCampaigns.filter((c) => {
    if (stateFilter !== "all" && c.state !== stateFilter) return false;
    if (campaignFilter !== "all" && c.id !== campaignFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Campaigns</h1>
        <BrandSelector brands={mockBrands} selected={brandId} onChange={setBrandId} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterGroup
          options={[
            { label: "All", value: "all" },
            { label: "Paid", value: "paid", dot: "#7c5cfc" },
            { label: "Owned", value: "owned", dot: "#00c2a8" },
            { label: "Earned", value: "earned", dot: "#ff6b6b" },
          ]}
          value={mediaFilter}
          onChange={setMediaFilter}
        />
        <FilterGroup
          options={[
            { label: "All", value: "all" },
            { label: "Plan", value: "plan" },
            { label: "Ejecutar", value: "ejecutar" },
            { label: "Seguimiento", value: "seguimiento" },
          ]}
          value={stateFilter}
          onChange={setStateFilter}
        />

        {/* Campaign dropdown */}
        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-portal-border rounded-[10px] text-xs font-medium text-portal-text-secondary appearance-none cursor-pointer"
        >
          <option value="all">All campaigns</option>
          {mockCampaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* View toggle (right-aligned) */}
        <div className="ml-auto">
          <FilterGroup
            options={[
              { label: "Matrix", value: "matrix" },
              { label: "Calendar", value: "calendario" },
              { label: "List", value: "lista" },
            ]}
            value={view}
            onChange={(v) => setView(v as ViewMode)}
          />
        </div>
      </div>

      {/* View content */}
      {view === "matrix" && (
        <>
          <FunnelMatrix activations={filtered} />

          {/* KPI Cards per funnel stage */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Awareness" value="89K" delta="+12%" trend="up" secondary="Impressions last 30d" />
            <KPICard label="Consideration" value="3.2%" delta="+0.4%" trend="up" secondary="Avg CTR" />
            <KPICard label="Conversion" value="3.8x" delta="+0.6x" trend="up" secondary="ROAS" />
            <KPICard label="Retention" value="42%" delta="+2%" trend="up" secondary="Email open rate" />
          </div>

          {/* Gap analysis */}
          <PortalCard>
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-portal-accent mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-portal-text">Análisis de cobertura</p>
                <p className="text-[11px] text-portal-text-secondary mt-1">
                  22 celdas vacías de 32 posibles. Recomendación: Priorizar Display × Awareness y Email × Retention
                  para mejorar cobertura del funnel.
                </p>
                <p className="text-[10px] text-portal-text-dim mt-1">10 activaciones / 32 celdas totales</p>
              </div>
            </div>
          </PortalCard>
        </>
      )}

      {view === "calendario" && (
        <PortalCard noPadding>
          <div className="p-5">
            <CampaignCalendar campaigns={filteredCampaigns} />
          </div>
        </PortalCard>
      )}

      {view === "lista" && (
        <div className="space-y-3">
          {filteredCampaigns.map((c) => (
            <Link key={c.id} href={`/client/campaigns/${c.id}`}>
              <PortalCard className="hover:portal-shadow-hover transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xs font-semibold text-portal-text">{c.name}</h3>
                      <StateBadge state={c.state} />
                    </div>
                    <p className="text-[11px] text-portal-text-muted">{c.objective}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-portal-text">${c.spent.toLocaleString()} / ${c.budget.toLocaleString()}</p>
                    <p className="text-[10px] text-portal-text-dim">{c.activations.length} activaciones</p>
                  </div>
                </div>
              </PortalCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/components/portal/activation-chip.tsx web/components/portal/funnel-matrix.tsx web/components/portal/campaign-calendar.tsx web/app/client/campaigns/page.tsx
git commit -m "feat(portal): add Campaigns page — funnel matrix, calendar gantt, list view"
```

---

## Task 12: Campaign Detail Page

**Files:**
- Create: `web/components/portal/campaign-stepper.tsx`
- Create: `web/app/client/campaigns/[id]/page.tsx`

- [ ] **Step 1: Create campaign stepper**

```tsx
// web/components/portal/campaign-stepper.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  status: "completed" | "active" | "pending";
}

interface CampaignStepperProps {
  steps: Step[];
}

export function CampaignStepper({ steps }: CampaignStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                step.status === "completed" && "bg-[#00c2a8] text-white",
                step.status === "active" && "bg-portal-accent text-white",
                step.status === "pending" && "bg-gray-100 text-portal-text-dim"
              )}
            >
              {step.status === "completed" ? <Check size={14} /> : i + 1}
            </div>
            <span className={cn(
              "text-[9px] mt-1 font-medium",
              step.status === "active" ? "text-portal-text" : "text-portal-text-muted"
            )}>
              {step.label}
            </span>
          </div>

          {/* Connector */}
          {i < steps.length - 1 && (
            <div className={cn(
              "w-12 h-0.5 mx-1",
              step.status === "completed"
                ? "bg-gradient-to-r from-[#00c2a8] to-portal-accent"
                : "bg-gray-100"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create campaign detail page**

```tsx
// web/app/client/campaigns/[id]/page.tsx
"use client";

import { use } from "react";
import { PortalCard } from "@/components/portal/portal-card";
import { StateBadge } from "@/components/portal/state-badge";
import { CampaignStepper } from "@/components/portal/campaign-stepper";
import { ActivationChip } from "@/components/portal/activation-chip";
import { SectionHeader } from "@/components/portal/section-header";
import { mockCampaigns } from "@/lib/portal-mock-data";
import { ArrowLeft, Pause, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const campaign = mockCampaigns.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<"artifacts" | "historial" | "comentarios" | "metricas">("artifacts");

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-portal-text-muted">Campaña no encontrada</p>
        <Link href="/client/campaigns" className="text-xs text-portal-accent hover:underline mt-2 inline-block">
          ← Volver a Campaigns
        </Link>
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
      {/* Breadcrumb + Header */}
      <div>
        <Link href="/client/campaigns" className="flex items-center gap-1 text-xs text-portal-text-muted hover:text-portal-text mb-3">
          <ArrowLeft size={14} />
          Campaigns
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">{campaign.name}</h1>
              <StateBadge state={campaign.state} />
            </div>
            <p className="text-sm text-portal-text-muted">{campaign.objective}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[9px] font-medium bg-gray-100 text-portal-text-muted px-2 py-0.5 rounded">
                {campaign.startDate} → {campaign.endDate}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary hover:border-portal-text-dim transition-colors">
              <Pause size={14} />
              Pausar
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-portal-text text-white rounded-[10px] hover:opacity-80 transition-opacity">
              <MessageCircle size={14} />
              Hablar con Copilot
            </button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <PortalCard>
        <div className="flex justify-center">
          <CampaignStepper steps={steps} />
        </div>
      </PortalCard>

      {/* Active Gate */}
      <PortalCard className="border-portal-accent border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-portal-text">Gate 3: Guion</p>
            <p className="text-[11px] text-portal-text-muted mt-0.5">
              Revisión del guion final antes de pasar a storyboard
            </p>
            <p className="text-[10px] text-portal-accent mt-1 font-medium">Esperando tu revisión</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary">
              Ver anterior
            </button>
            <button className="px-3 py-1.5 text-xs font-medium bg-white border border-portal-border rounded-[10px] text-portal-text-secondary">
              Pedir cambios
            </button>
            <button className="px-3 py-1.5 text-xs font-medium bg-portal-accent text-white rounded-[10px]">
              Revisar
            </button>
          </div>
        </div>
      </PortalCard>

      {/* Budget awareness */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-portal-accent rounded-full"
            style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
          />
        </div>
        <span className="text-xs text-portal-text-muted">
          ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-portal-border">
        {(["artifacts", "historial", "comentarios", "metricas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors capitalize",
              activeTab === tab
                ? "border-portal-text text-portal-text"
                : "border-transparent text-portal-text-muted hover:text-portal-text"
            )}
          >
            {tab === "metricas" ? "Métricas" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "artifacts" && (
        <div className="grid grid-cols-3 gap-3">
          {campaign.activations.map((act) => (
            <ActivationChip key={act.id} activation={act} />
          ))}
        </div>
      )}

      {activeTab === "historial" && (
        <PortalCard>
          <div className="text-xs text-portal-text-dim text-center py-8">
            Timeline of events — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "comentarios" && (
        <PortalCard>
          <div className="text-xs text-portal-text-dim text-center py-8">
            Discussion thread — placeholder
          </div>
        </PortalCard>
      )}

      {activeTab === "metricas" && (
        <PortalCard>
          <div className="text-xs text-portal-text-dim text-center py-8">
            Campaign-specific performance data — placeholder
          </div>
        </PortalCard>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/components/portal/campaign-stepper.tsx web/app/client/campaigns/\[id\]/page.tsx
git commit -m "feat(portal): add Campaign detail page — stepper, gate card, tabs"
```

---

## Task 13: Sales Page

**Files:**
- Create: `web/components/portal/deal-card.tsx`
- Create: `web/components/portal/pipeline-kanban.tsx`
- Create: `web/app/client/sales/page.tsx`

- [ ] **Step 1: Create deal card**

```tsx
// web/components/portal/deal-card.tsx
import type { Deal } from "@/lib/portal-types";

const tempColors: Record<string, string> = {
  hot: "#ff6b6b",
  warm: "#f5a623",
  cold: "#7c5cfc",
};

export function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white rounded-xl p-3 portal-shadow border border-portal-border hover:portal-shadow-hover transition-shadow">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tempColors[deal.temperature] }} />
        <h3 className="text-[11px] font-semibold text-portal-text truncate">{deal.name}</h3>
      </div>
      <p className="text-[10px] text-portal-text-muted mb-2">{deal.description}</p>
      <p className="text-sm font-[800] text-portal-text mb-2">
        ₡{deal.value.toLocaleString()}
      </p>
      <p className="text-[9px] text-portal-text-dim mb-2">{deal.lastActivity}</p>

      {/* Score bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${deal.score}%`,
            backgroundColor: tempColors[deal.temperature],
          }}
        />
      </div>

      {/* Touchpoints */}
      {deal.touchpoints.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {deal.touchpoints.map((tp) => (
            <span key={tp} className="text-[8px] font-medium bg-gray-50 text-portal-text-dim px-1.5 py-0.5 rounded">
              {tp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create pipeline kanban**

```tsx
// web/components/portal/pipeline-kanban.tsx
import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/lib/portal-types";

const stages: { id: DealStage; label: string }[] = [
  { id: "new", label: "Nuevo" },
  { id: "contacted", label: "Contactado" },
  { id: "proposal", label: "Propuesta" },
  { id: "negotiation", label: "Negociación" },
  { id: "won", label: "Ganado" },
];

interface PipelineKanbanProps {
  deals: Deal[];
}

export function PipelineKanban({ deals }: PipelineKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

        return (
          <div key={stage.id} className="flex-1 min-w-[200px]">
            {/* Column header */}
            <div className={cn(
              "rounded-t-xl px-3 py-2 border-b-2",
              stage.id === "won" ? "border-[#00c2a8]" : "border-portal-border"
            )}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-portal-text">{stage.label}</p>
                <span className="text-[10px] text-portal-text-dim">{stageDeals.length}</span>
              </div>
              <p className="text-[10px] text-portal-text-muted">
                ₡{totalValue.toLocaleString()}
              </p>
            </div>

            {/* Cards */}
            <div className="space-y-2 mt-2">
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create sales page**

```tsx
// web/app/client/sales/page.tsx
"use client";

import { useState } from "react";
import { KPICard } from "@/components/portal/kpi-card";
import { PortalCard } from "@/components/portal/portal-card";
import { FilterGroup } from "@/components/portal/filter-group";
import { PipelineKanban } from "@/components/portal/pipeline-kanban";
import { SectionHeader } from "@/components/portal/section-header";
import { mockDeals } from "@/lib/portal-mock-data";
import { Lightbulb } from "lucide-react";

export default function SalesPage() {
  const [viewFilter, setViewFilter] = useState("pipeline");
  const [tempFilter, setTempFilter] = useState("all");

  const filtered = mockDeals.filter((d) => {
    if (tempFilter !== "all" && d.temperature !== tempFilter) return false;
    return true;
  });

  const salesKPIs = [
    { label: "Leads", value: 23, delta: "+18%", trend: "up" as const },
    { label: "Calificados", value: 8, secondary: "35% de leads", trend: "up" as const },
    { label: "Pipeline value", value: "₡3.1M", secondary: "5 deals", trend: "up" as const },
    { label: "Won this month", value: "₡1.2M", secondary: "1 deal", trend: "up" as const },
    { label: "Avg deal size", value: "₡620K", delta: "+8%", trend: "up" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-[28px] font-light tracking-[-0.5px] text-portal-text">Sales</h1>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {salesKPIs.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <FilterGroup
          options={[
            { label: "Pipeline", value: "pipeline" },
            { label: "Leads", value: "leads" },
            { label: "Proposals", value: "proposals" },
          ]}
          value={viewFilter}
          onChange={setViewFilter}
        />
        <FilterGroup
          options={[
            { label: "All", value: "all" },
            { label: "Hot", value: "hot", dot: "#ff6b6b" },
            { label: "Warm", value: "warm", dot: "#f5a623" },
            { label: "Cold", value: "cold", dot: "#7c5cfc" },
          ]}
          value={tempFilter}
          onChange={setTempFilter}
        />
      </div>

      {/* Kanban */}
      {viewFilter === "pipeline" && <PipelineKanban deals={filtered} />}

      {viewFilter === "leads" && (
        <PortalCard>
          <div className="text-xs text-portal-text-dim text-center py-12">Lead sources — horizontal bar chart placeholder</div>
        </PortalCard>
      )}

      {viewFilter === "proposals" && (
        <PortalCard>
          <div className="text-xs text-portal-text-dim text-center py-12">Proposals list — placeholder</div>
        </PortalCard>
      )}

      {/* Attribution */}
      <PortalCard>
        <SectionHeader title="Best Customers Origin" />
        <div className="text-xs text-portal-text-dim text-center py-8">
          Attribution table — Customer, Revenue, Touchpoint journey, Days to close — placeholder
        </div>
      </PortalCard>

      {/* Copilot insight */}
      <PortalCard>
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-portal-accent mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-portal-text">Insight</p>
            <p className="text-[11px] text-portal-text-secondary mt-1">
              Referrals convierten 3x más rápido que leads fríos. Recomendación: crear programa de referidos
              para clientes actuales con incentivo de 10% de descuento.
            </p>
          </div>
        </div>
      </PortalCard>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/components/portal/deal-card.tsx web/components/portal/pipeline-kanban.tsx web/app/client/sales/page.tsx
git commit -m "feat(portal): add Sales page — KPIs, pipeline kanban, attribution, insights"
```

---

## Task 14: Setup Page

**Files:**
- Create: `web/app/client/setup/page.tsx`

- [ ] **Step 1: Create setup page**

```tsx
// web/app/client/setup/page.tsx
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
        {/* Sidebar */}
        <div className="col-span-1">
          <nav className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActive(sec.id)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  active === sec.id
                    ? "bg-portal-text text-white"
                    : "text-portal-text-muted hover:text-portal-text hover:bg-gray-50"
                )}
              >
                <sec.icon size={14} />
                {sec.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
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
            <PortalCard>
              <SectionHeader title="Equipo" />
              <p className="text-xs text-portal-text-dim">Disponible en plan Mediana+</p>
            </PortalCard>
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
                    <button className={cn(
                      "text-[10px] font-semibold px-3 py-1 rounded-lg",
                      int.connected
                        ? "bg-[#edfbf8] text-[#00a88e]"
                        : "bg-gray-50 text-portal-text-muted hover:text-portal-text"
                    )}>
                      {int.connected ? "Conectado" : "Conectar"}
                    </button>
                  </div>
                ))}
              </div>
            </PortalCard>
          )}

          {active === "billing" && (
            <PortalCard>
              <SectionHeader title="Billing" />
              <div className="text-xs text-portal-text-dim text-center py-8">
                Subscription management, invoices, payment method — placeholder
              </div>
            </PortalCard>
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
```

- [ ] **Step 2: Commit**

```bash
git add web/app/client/setup/page.tsx
git commit -m "feat(portal): add Setup page — account, team, integrations, billing, AI autonomy, appearance"
```

---

## Task 15: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: TypeScript compile check**

```bash
cd web && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors, or only pre-existing ones.

- [ ] **Step 2: Run all tests**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2 && npx vitest run web/__tests__/ 2>&1 | tail -15
```

Expected: All budget-equalizer tests pass.

- [ ] **Step 3: Dev server smoke test**

```bash
cd web && timeout 15 npx next dev 2>&1 | head -20
```

Expected: Dev server starts without compilation errors.

- [ ] **Step 4: Verify all routes exist**

```bash
find web/app/client -name "page.tsx" | sort
```

Expected output:
```
web/app/client/brand/page.tsx
web/app/client/campaigns/[id]/page.tsx
web/app/client/campaigns/page.tsx
web/app/client/page.tsx
web/app/client/plan/page.tsx
web/app/client/sales/page.tsx
web/app/client/setup/page.tsx
```

- [ ] **Step 5: Final commit (if any fixes)**

Only if previous steps required fixes:
```bash
git add -A && git commit -m "fix(portal): address compilation and verification issues"
```
