// ── Pipeline enums ──

export const PROJECT_TYPES = [
  "corporate",
  "explainer",
  "documentary",
  "fiction",
  "micro_content",
  "commercial",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  // Video production
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish",
  // Brand builder
  "discovery", "research", "positioning", "identity", "brand_dna",
  // Strategist
  "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
  // Graphic design
  "design_system", "moodboard", "production", "adaptation",
  // Writers Room
  "wr_brief", "wr_research", "wr_draft", "wr_adaptation", "wr_delivery",
  // Audio
  "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
  // Web
  "wb_brief", "wb_architecture", "wb_content", "wb_seo", "wb_build", "wb_qa", "wb_delivery",
  // Marketplace
  "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery",
  // Print Production
  "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery",
  // Events
  "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
  // Ads
  "ad_brief", "ad_strategy", "ad_creative", "ad_targeting", "ad_launch_kit", "ad_delivery",
  // Community Management
  "cm_brief", "cm_calendar", "cm_content_production", "cm_scheduling", "cm_monitoring", "cm_reporting", "cm_delivery",
  // Email Marketing
  "em_brief", "em_strategy", "em_production", "em_segmentation", "em_send", "em_analysis", "em_delivery",
  // SEO/Content
  "se_brief", "se_audit", "se_keyword_strategy", "se_content_plan", "se_optimization", "se_reporting", "se_delivery",
  // Channel Manager
  "ch_request", "ch_analysis", "ch_specs", "ch_delivery",
  // Sales/CRM
  "sl_capture", "sl_enrich", "sl_score", "sl_nurture", "sl_proposal", "sl_negotiate", "sl_close", "sl_attribution", "sl_delivery",
  // Financial
  "fn_request", "fn_budget", "fn_tracking", "fn_pl", "fn_deliver",
  // Analytics
  "an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver",
  // Security
  "sec_audit", "sec_scan", "sec_remediate", "sec_report", "sec_deliver",
  // Shared terminal statuses
  "delivered", "paused",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const GATE_TYPES = ["g1", "g2", "g3", "g4", "g5"] as const;
export type GateType = (typeof GATE_TYPES)[number];

export const GATE_DECISIONS = ["pass", "fail"] as const;
export type GateDecision = (typeof GATE_DECISIONS)[number];

export const ARTIFACT_STEPS = [
  // Video production
  "brief", "concept", "script", "visual_look", "storyboard",
  "video_gen", "edit", "audio", "polish", "delivery",
  // Brand builder
  "discovery", "research", "positioning", "identity", "brand_dna",
  // Strategist
  "diagnostic", "objectives", "audiences", "value_prop", "media_plan", "budget", "briefs",
  // Graphic design
  "design_system", "moodboard", "production", "adaptation",
  // Writers Room
  "wr_brief", "wr_research", "wr_draft", "wr_adaptation", "wr_delivery",
  // Audio
  "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
  // Web
  "wb_brief", "wb_architecture", "wb_content", "wb_seo", "wb_build", "wb_qa", "wb_delivery",
  // Marketplace
  "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery",
  // Print Production
  "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery",
  // Events
  "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
  // Ads
  "ad_brief", "ad_strategy", "ad_creative", "ad_targeting", "ad_launch_kit", "ad_delivery",
  // Community Management
  "cm_brief", "cm_calendar", "cm_content_production", "cm_scheduling", "cm_monitoring", "cm_reporting", "cm_delivery",
  // Email Marketing
  "em_brief", "em_strategy", "em_production", "em_segmentation", "em_send", "em_analysis", "em_delivery",
  // SEO/Content
  "se_brief", "se_audit", "se_keyword_strategy", "se_content_plan", "se_optimization", "se_reporting", "se_delivery",
  // Channel Manager
  "ch_request", "ch_analysis", "ch_specs", "ch_delivery",
  // Sales/CRM
  "sl_capture", "sl_enrich", "sl_score", "sl_nurture", "sl_proposal", "sl_negotiate", "sl_close", "sl_attribution", "sl_delivery",
  // Financial
  "fn_request", "fn_budget", "fn_tracking", "fn_pl", "fn_deliver",
  // Analytics
  "an_request", "an_collect", "an_analyze", "an_visualize", "an_deliver",
  // Security
  "sec_audit", "sec_scan", "sec_remediate", "sec_report", "sec_deliver",
  // Shared
  "model_config", "gate_review",
  // Intelligence Engine steps
  "brand_collect", "brand_analyze", "brand_report", "brand_alert_eval",
  "culture_collect", "culture_analyze", "culture_report", "culture_alert_eval",
  "industry_collect", "industry_analyze", "industry_report", "industry_alert_eval",
  "competitive_collect", "competitive_analyze", "competitive_report", "competitive_alert_eval",
  "opportunity_aggregate", "opportunity_evaluate", "opportunity_generate", "opportunity_prioritize",
] as const;
export type ArtifactStep = (typeof ARTIFACT_STEPS)[number];

export const ARTIFACT_TYPES = [
  "document",
  "image",
  "video",
  "audio",
  "subtitle",
  "package",
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const EXECUTION_STATUSES = [
  "running",
  "completed",
  "failed",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const TASK_TYPES = [
  "text_gen",
  "image_gen",
  "video_gen",
  "audio_voice",
  "audio_music",
  "audio_sfx",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

// ── Pipeline flow (video-production — legacy constants kept for compatibility) ──

/** Ordered video-production pipeline steps (legacy). Use PipelineRegistry for other pipelines. */
export const PIPELINE_FLOW: ProjectStatus[] = [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivered",
];

/** Video-production gate map (legacy). Use PipelineRegistry for other pipelines. */
export const STEP_GATE_MAP: Partial<Record<ProjectStatus, GateType>> = {
  concept: "g1",
  script: "g2",
  storyboard: "g3",
  audio: "g4",
  polish: "g5",
};

/** Video-production gate failure return steps (legacy). */
export const GATE_FAIL_RETURN: Record<GateType, ProjectStatus> = {
  g1: "concept",
  g2: "script",
  g3: "storyboard",
  g4: "edit", // G4 diagnostic can route to edit, video_gen, or audio — default edit
  g5: "polish",
};

/** Video-production max gate iterations (legacy). */
export const GATE_MAX_ITERATIONS: Record<GateType, number> = {
  g1: 3,
  g2: 3,
  g3: 2,
  g4: 2,
  g5: 1,
};

// ── Agent types ──

export type AgentLevel = "top" | "leader" | "sub" | "cross_functional";

export interface AgentRegistryEntry {
  id: string;
  name: string;
  skillFile: string;
  team: number;
  level: AgentLevel;
  steps: ArtifactStep[];
  /** Gate names this agent evaluates (any pipeline gate string, e.g. "g1", "bb-g1", "st-g2") */
  gates: string[];
  autonomy: number;
}

// ── Pipeline-generic types ──

/** All possible step names across all pipelines */
export type PipelineStep = string;

/** All possible gate names across all pipelines */
export type PipelineGate = string;
