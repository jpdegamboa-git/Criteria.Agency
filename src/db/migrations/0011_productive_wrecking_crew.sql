CREATE TYPE "public"."actor_type" AS ENUM('agent', 'human', 'system');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('open', 'acknowledged', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'escalated', 'expired');--> statement-breakpoint
CREATE TYPE "public"."brand_issue_severity" AS ENUM('critical', 'major', 'minor');--> statement-breakpoint
CREATE TYPE "public"."brand_rule_source" AS ENUM('brand_dna', 'human_feedback', 'learned');--> statement-breakpoint
CREATE TYPE "public"."brand_rule_type" AS ENUM('always', 'never', 'prefer', 'avoid');--> statement-breakpoint
CREATE TYPE "public"."brand_validation_verdict" AS ENUM('pass', 'needs_revision', 'fail');--> statement-breakpoint
CREATE TYPE "public"."continuous_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('qualification', 'nurture', 'proposal', 'negotiation', 'closing', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."lead_classification" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'enriched', 'scored', 'qualified', 'nurturing', 'proposal', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."listener_type" AS ENUM('brand', 'culture', 'industry', 'competitive', 'opportunity');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."vendor_quote_status" AS ENUM('pending', 'accepted', 'rejected', 'expired');--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'design_system' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'moodboard' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'production' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'adaptation' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wr_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wr_research' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wr_draft' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wr_adaptation' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wr_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'au_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'au_sound_design' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'au_production' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'au_mix_master' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'au_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_architecture' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_content' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_seo' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_build' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_qa' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'wb_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_request' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_search' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_quote' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_compare' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_contract' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_tracking' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'mk_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'pp_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'pp_prepress' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'pp_vendor_request' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'pp_production_tracking' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'pp_quality_check' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'pp_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_concept' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_planning' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_vendor_setup' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_pre_event' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_live_event' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_post_event' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ev_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ad_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ad_strategy' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ad_creative' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ad_targeting' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ad_launch_kit' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ad_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_calendar' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_content_production' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_scheduling' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_monitoring' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_reporting' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cm_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_strategy' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_production' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_segmentation' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_send' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_analysis' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'em_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_brief' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_audit' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_keyword_strategy' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_content_plan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_optimization' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_reporting' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'se_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ch_request' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ch_analysis' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ch_specs' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'ch_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_capture' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_enrich' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_score' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_nurture' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_proposal' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_negotiate' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_close' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_attribution' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sl_delivery' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'an_request' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'an_collect' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'an_analyze' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'an_visualize' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'an_deliver' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'fn_request' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'fn_budget' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'fn_tracking' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'fn_pl' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'fn_deliver' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sec_audit' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sec_scan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sec_remediate' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sec_report' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'sec_deliver' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'op_scan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'op_evaluate' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'op_alert' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'bl_scan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'bl_analyze' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'bl_report' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cl_scan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cl_analyze' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'cl_report' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'il_scan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'il_analyze' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'il_report' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'co_scan' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'co_analyze' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."artifact_step" ADD VALUE 'co_report' BEFORE 'model_config';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'gd-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'gd-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'gd-g3';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'wr-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'wr-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'au-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'au-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'wb-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'wb-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'wb-g3';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'mk-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'mk-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'pp-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'pp-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'ev-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'ev-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'ev-g3';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'ad-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'ad-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'cm-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'cm-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'em-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'em-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'se-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'se-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'ch-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'sl-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'sl-g2';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'an-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'fn-g1';--> statement-breakpoint
ALTER TYPE "public"."gate_type" ADD VALUE 'sec-g1';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'design_system' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'moodboard' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'production' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'adaptation' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wr_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wr_research' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wr_draft' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wr_adaptation' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wr_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'au_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'au_sound_design' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'au_production' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'au_mix_master' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'au_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_architecture' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_content' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_seo' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_build' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_qa' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'wb_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_request' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_search' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_quote' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_compare' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_contract' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_tracking' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'mk_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pp_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pp_prepress' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pp_vendor_request' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pp_production_tracking' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pp_quality_check' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pp_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_concept' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_planning' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_vendor_setup' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_pre_event' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_live_event' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_post_event' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ev_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ad_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ad_strategy' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ad_creative' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ad_targeting' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ad_launch_kit' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ad_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sec_audit' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sec_scan' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sec_remediate' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sec_report' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sec_deliver' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_calendar' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_content_production' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_scheduling' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_monitoring' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_reporting' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'cm_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_strategy' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_production' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_segmentation' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_send' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_analysis' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'em_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_brief' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_audit' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_keyword_strategy' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_content_plan' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_optimization' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_reporting' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'se_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ch_request' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ch_analysis' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ch_specs' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'ch_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_capture' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_enrich' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_score' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_nurture' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_proposal' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_negotiate' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_close' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_attribution' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'sl_delivery' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'an_request' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'an_collect' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'an_analyze' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'an_visualize' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'an_deliver' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'fn_request' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'fn_budget' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'fn_tracking' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'fn_pl' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'fn_deliver' BEFORE 'delivered';--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"listener_type" "listener_type" NOT NULL,
	"rule_name" varchar(100) NOT NULL,
	"condition" jsonb NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"notification_channels" jsonb DEFAULT '[]'::jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"alert_rule_id" uuid,
	"listener_type" "listener_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"context" jsonb,
	"status" "alert_status" DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"motor" varchar(50) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"context" jsonb NOT NULL,
	"urgency" varchar(10) DEFAULT 'normal' NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp,
	"responded_by" varchar(100),
	"response_note" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"actor" varchar(100) NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" uuid,
	"details" jsonb,
	"autonomy_level" integer,
	"approval_id" uuid,
	"ip_address" varchar(45),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"global_level" integer DEFAULT 3 NOT NULL,
	"overrides" jsonb DEFAULT '[]'::jsonb,
	"escalation" jsonb NOT NULL,
	"schedule" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "autonomy_configs_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "brand_guardian_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"pass_threshold" integer DEFAULT 80 NOT NULL,
	"auto_pass_threshold" integer DEFAULT 95 NOT NULL,
	"strict_mode" boolean DEFAULT false NOT NULL,
	"weights_by_dimension" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_guardian_configs_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "brand_manuals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content_markdown" text NOT NULL,
	"share_token" varchar(64) NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_manuals_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "brand_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"dimension" varchar(50) NOT NULL,
	"type" "brand_rule_type" NOT NULL,
	"rule" text NOT NULL,
	"source" "brand_rule_source" NOT NULL,
	"examples" jsonb DEFAULT '[]'::jsonb,
	"confidence" numeric(3, 2) DEFAULT '1.00',
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_applied_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "brand_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"content_type" varchar(50) NOT NULL,
	"overall_score" integer NOT NULL,
	"verdict" "brand_validation_verdict" NOT NULL,
	"dimensions" jsonb NOT NULL,
	"summary" text NOT NULL,
	"auto_fixable" boolean DEFAULT false NOT NULL,
	"auto_fix_suggestions" jsonb DEFAULT '[]'::jsonb,
	"human_override" varchar(20),
	"human_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "continuous_agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"agent_id" varchar(20) NOT NULL,
	"listener_type" "listener_type" NOT NULL,
	"step" varchar(30) NOT NULL,
	"status" "continuous_run_status" DEFAULT 'pending' NOT NULL,
	"input_data" jsonb,
	"output_data" jsonb,
	"artifacts_produced" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"cost_usd" numeric(10, 4),
	"error" text,
	"cycle_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_source_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"listener_type" "listener_type" NOT NULL,
	"config" jsonb NOT NULL,
	"schedule" varchar(50) DEFAULT '0 6 * * *' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"stage" "deal_stage" DEFAULT 'qualification',
	"probability" integer DEFAULT 10,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"lost_reason" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"title" varchar(255),
	"phone" varchar(50),
	"source" varchar(50) NOT NULL,
	"source_detail" varchar(255),
	"fit_score" integer DEFAULT 0,
	"intent_score" integer DEFAULT 0,
	"bant_score" jsonb DEFAULT '{}'::jsonb,
	"total_score" integer DEFAULT 0,
	"classification" "lead_classification" DEFAULT 'cold',
	"status" "lead_status" DEFAULT 'new',
	"enrichment_data" jsonb DEFAULT '{}'::jsonb,
	"assigned_to" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"version" integer DEFAULT 1,
	"content" text,
	"pricing" jsonb,
	"valid_until" timestamp,
	"status" "proposal_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"delivery_days" integer,
	"specs" jsonb,
	"status" "vendor_quote_status" DEFAULT 'pending',
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"quality" integer NOT NULL,
	"price" integer NOT NULL,
	"timeliness" integer NOT NULL,
	"communication" integer NOT NULL,
	"notes" text,
	"review_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"categories" text[] NOT NULL,
	"services" text[] NOT NULL,
	"location" varchar(255),
	"rating" numeric(2, 1) DEFAULT '0',
	"total_jobs" integer DEFAULT 0,
	"price_range" varchar(10),
	"portfolio_url" varchar(500),
	"contact" jsonb,
	"notes" text,
	"active" boolean DEFAULT true,
	"client_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_configs" ADD CONSTRAINT "autonomy_configs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guardian_configs" ADD CONSTRAINT "brand_guardian_configs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_manuals" ADD CONSTRAINT "brand_manuals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_rules" ADD CONSTRAINT "brand_rules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_validations" ADD CONSTRAINT "brand_validations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_validations" ADD CONSTRAINT "brand_validations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuous_agent_runs" ADD CONSTRAINT "continuous_agent_runs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_source_configs" ADD CONSTRAINT "data_source_configs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_quotes" ADD CONSTRAINT "vendor_quotes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_quotes" ADD CONSTRAINT "vendor_quotes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_client_status_idx" ON "alerts" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "approval_pending_idx" ON "approval_requests" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "audit_client_time_idx" ON "audit_log" USING btree ("client_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "brand_manuals_client_idx" ON "brand_manuals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "brand_manuals_token_idx" ON "brand_manuals" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "brand_rules_client_idx" ON "brand_rules" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "brand_rules_dimension_idx" ON "brand_rules" USING btree ("client_id","dimension");--> statement-breakpoint
CREATE INDEX "brand_validations_client_idx" ON "brand_validations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "brand_validations_project_idx" ON "brand_validations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "car_client_listener_idx" ON "continuous_agent_runs" USING btree ("client_id","listener_type");--> statement-breakpoint
CREATE INDEX "car_cycle_idx" ON "continuous_agent_runs" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "deals_lead_id_idx" ON "deals" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "deals_client_id_idx" ON "deals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "leads_client_id_idx" ON "leads" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "gate_reviews_project_id_gate_idx" ON "gate_reviews" USING btree ("project_id","gate");