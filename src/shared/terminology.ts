export const PIPELINE_LABELS: Record<string, string> = {
  "video-production": "Produccion de Video",
  "brand-builder": "Construccion de Marca",
  "strategist": "Estrategia",
  "graphic-design": "Diseno Grafico",
  "writers-room": "Redaccion",
  "audio": "Audio",
  "web": "Web",
  "marketplace": "Marketplace",
  "print-production": "Produccion Impresa",
  "events": "Eventos",
  "ads": "Publicidad",
  "community-management": "Comunidad",
  "email-marketing": "Email Marketing",
  "seo-content": "SEO / Contenidos",
  "channel-manager": "Canales",
  "sales-crm": "Ventas / CRM",
  "financial": "Financiero",
  "analytics": "Analitica",
  "security": "Seguridad",
};

export const STATUS_LABELS: Record<string, string> = {
  // Video production
  brief: "Brief",
  concept: "Concepto",
  script: "Guion",
  visual_look: "Look Visual",
  storyboard: "Storyboard",
  video_gen: "Generando video",
  edit: "Edicion",
  audio: "Audio",
  polish: "Pulido final",
  // Brand builder
  discovery: "Discovery",
  research: "Investigacion",
  positioning: "Posicionamiento",
  identity: "Identidad",
  brand_dna: "ADN de Marca",
  // Strategist
  diagnostic: "Diagnostico",
  objectives: "Objetivos",
  audiences: "Audiencias",
  value_prop: "Propuesta de valor",
  media_plan: "Plan de medios",
  budget: "Presupuesto",
  briefs: "Briefs",
  // Graphic design
  design_system: "Sistema de diseno",
  moodboard: "Moodboard",
  production: "Produccion",
  adaptation: "Adaptacion",
  // Writers room
  wr_brief: "Brief",
  wr_research: "Investigacion",
  wr_draft: "Borrador",
  wr_adaptation: "Adaptacion",
  wr_delivery: "Entrega",
  // Audio
  au_brief: "Brief",
  au_sound_design: "Diseno de sonido",
  au_production: "Produccion",
  au_mix_master: "Mezcla y master",
  au_delivery: "Entrega",
  // Web
  wb_brief: "Brief",
  wb_architecture: "Arquitectura",
  wb_content: "Contenido",
  wb_seo: "SEO",
  wb_build: "Desarrollo",
  wb_qa: "QA",
  wb_delivery: "Entrega",
  // Marketplace
  mk_request: "Solicitud",
  mk_search: "Busqueda",
  mk_quote: "Cotizacion",
  mk_compare: "Comparativa",
  mk_contract: "Contrato",
  mk_tracking: "Seguimiento",
  mk_delivery: "Entrega",
  // Print production
  pp_brief: "Brief",
  pp_prepress: "Preprensa",
  pp_vendor_request: "Solicitud a proveedor",
  pp_production_tracking: "Seguimiento de produccion",
  pp_quality_check: "Control de calidad",
  pp_delivery: "Entrega",
  // Events
  ev_brief: "Brief",
  ev_concept: "Concepto",
  ev_planning: "Planeacion",
  ev_vendor_setup: "Setup de proveedores",
  ev_pre_event: "Pre-evento",
  ev_live_event: "Evento en vivo",
  ev_post_event: "Post-evento",
  ev_delivery: "Entrega",
  // Ads
  ad_brief: "Brief",
  ad_strategy: "Estrategia",
  ad_creative: "Creatividad",
  ad_targeting: "Targeting",
  ad_launch_kit: "Kit de lanzamiento",
  ad_delivery: "Entrega",
  // Community management
  cm_brief: "Brief",
  cm_calendar: "Calendario",
  cm_content_production: "Produccion de contenido",
  cm_scheduling: "Programacion",
  cm_monitoring: "Monitoreo",
  cm_reporting: "Reportes",
  cm_delivery: "Entrega",
  // Email marketing
  em_brief: "Brief",
  em_strategy: "Estrategia",
  em_production: "Produccion",
  em_segmentation: "Segmentacion",
  em_send: "Envio",
  em_analysis: "Analisis",
  em_delivery: "Entrega",
  // SEO/Content
  se_brief: "Brief",
  se_audit: "Auditoria",
  se_keyword_strategy: "Estrategia de palabras clave",
  se_content_plan: "Plan de contenidos",
  se_optimization: "Optimizacion",
  se_reporting: "Reportes",
  se_delivery: "Entrega",
  // Channel manager
  ch_request: "Solicitud",
  ch_analysis: "Analisis",
  ch_specs: "Especificaciones",
  ch_delivery: "Entrega",
  // Sales/CRM
  sl_capture: "Captacion",
  sl_enrich: "Enriquecimiento",
  sl_score: "Puntuacion",
  sl_nurture: "Nurturing",
  sl_proposal: "Propuesta",
  sl_negotiate: "Negociacion",
  sl_close: "Cierre",
  sl_attribution: "Atribucion",
  sl_delivery: "Entrega",
  // Financial
  fn_request: "Solicitud",
  fn_budget: "Presupuesto",
  fn_tracking: "Seguimiento",
  fn_pl: "P&L",
  fn_deliver: "Entrega",
  // Analytics
  an_request: "Solicitud",
  an_collect: "Recoleccion",
  an_analyze: "Analisis",
  an_visualize: "Visualizacion",
  an_deliver: "Entrega",
  // Security
  sec_audit: "Auditoria",
  sec_scan: "Escaneo",
  sec_remediate: "Remedios",
  sec_report: "Reporte",
  sec_deliver: "Entrega",
  // Shared
  delivered: "Entregado",
  paused: "Pausado",
  completed: "Completado",
};

export const GATE_LABELS: Record<string, string> = {
  // Video production
  g1: "Revision de Concepto",
  g2: "Revision de Guion",
  g3: "Revision de Look Visual",
  g4: "Revision de Video",
  g5: "Revision Final",
  // Brand builder
  "bb-g1": "Revision de Investigacion",
  "bb-g2": "Revision de Identidad",
  "bb-g3": "Aprobacion de ADN de Marca",
  // Strategist
  "st-g1": "Revision de Objetivos",
  "st-g2": "Revision de Propuesta de valor",
  "st-g3": "Aprobacion de Presupuesto",
  // Graphic design
  "gd-g1": "Revision de Moodboard",
  "gd-g2": "Revision de Produccion",
  "gd-g3": "Revision de Entrega",
  // Writers room
  "wr-g1": "Revision de Investigacion",
  "wr-g2": "Revision de Borrador",
  // Audio
  "au-g1": "Revision de Diseno de sonido",
  "au-g2": "Revision de Produccion",
  // Web
  "wb-g1": "Revision de Arquitectura",
  "wb-g2": "Revision de SEO",
  "wb-g3": "Revision de QA",
  // Marketplace
  "mk-g1": "Revision de Busqueda",
  "mk-g2": "Revision de Comparativa",
  // Print production
  "pp-g1": "Revision de Preprensa",
  "pp-g2": "Revision de Proveedor",
  // Events
  "ev-g1": "Revision de Concepto",
  "ev-g2": "Revision de Setup de proveedores",
  "ev-g3": "Revision de Post-evento",
  // Ads
  "ad-g1": "Revision de Estrategia",
  "ad-g2": "Revision de Targeting",
  // Community management
  "cm-g1": "Revision de Calendario",
  "cm-g2": "Revision de Programacion",
  // Email marketing
  "em-g1": "Revision de Estrategia",
  "em-g2": "Revision de Segmentacion",
  // SEO/Content
  "se-g1": "Revision de Auditoria",
  "se-g2": "Revision de Plan de contenidos",
  // Channel manager
  "ch-g1": "Revision de Analisis",
  // Sales/CRM
  "sl-g1": "Revision de Puntuacion",
  "sl-g2": "Revision de Propuesta",
  // Financial
  "fn-g1": "Revision de Presupuesto",
  // Analytics
  "an-g1": "Revision de Analisis",
  // Security
  "sec-g1": "Revision de Escaneo",
};

export function pipelineLabel(type: string): string {
  return PIPELINE_LABELS[type] || type;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace(/_/g, " ");
}

export function gateLabel(gate: string): string {
  return GATE_LABELS[gate.toLowerCase()] || gate;
}
