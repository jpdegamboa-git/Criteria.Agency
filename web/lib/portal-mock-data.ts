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
