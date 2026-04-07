// ── Agent Context Map ──────────────────────────────────────────
// Maps each agent:step combination to the artifacts it needs,
// attachment types it can consume, and its task instruction.

export interface AgentContextEntry {
  artifactSteps: string[];
  attachmentTypes: string[];
  taskInstruction: string;
}

export const AGENT_CONTEXT_MAP: Record<string, AgentContextEntry> = {
  "T7-L:brief": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "Create an onboarding record and communication plan for this new client project.",
  },
  "T1-L:brief": {
    artifactSteps: [],
    attachmentTypes: ["image"],
    taskInstruction:
      "Guide the brief enrichment process. Ask clarifying questions and produce an enriched brief document.",
  },
  "T1-L:concept": {
    artifactSteps: ["brief"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Develop 2-3 creative concepts based on the enriched brief. Include mood, tone, visual direction, and narrative approach for each.",
  },
  "T2-L:script": {
    artifactSteps: ["brief", "concept"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Classify this project type, create a beat sheet, and prepare an assignment brief for the AV Copywriter.",
  },
  "T2-002:script": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: [],
    taskInstruction:
      "Write a two-column AV script (audio | video) following the beat sheet and creative direction.",
  },
  "T2-006:script": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: [],
    taskInstruction:
      "Review this script using your 7 diagnostic lenses. Produce an improvement report with severity-graded findings.",
  },
  "T3-L:visual_look": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: ["image", "json"],
    taskInstruction:
      "Define the visual language: framing, lens choices, lighting style, color palette, and movement vocabulary for each scene.",
  },
  "TL-003:visual_look": {
    artifactSteps: ["script"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Create a complete script breakdown: scenes, locations, characters, props, wardrobe, and production requirements.",
  },
  "T3-L:storyboard": {
    artifactSteps: ["script", "visual_look"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Create detailed shot specs for each scene.",
  },
  "T3-003:storyboard": {
    artifactSteps: ["script", "visual_look", "storyboard"],
    attachmentTypes: ["image", "json"],
    taskInstruction:
      "Generate storyboard preview images for each shot using the shot specs.",
  },
  "T3-003:video_gen": {
    artifactSteps: ["script", "visual_look", "storyboard"],
    attachmentTypes: ["image", "json"],
    taskInstruction:
      "Generate video clips for each shot in the storyboard.",
  },
  "T6-L:edit": {
    artifactSteps: ["script", "storyboard", "video_gen"],
    attachmentTypes: ["video", "audio", "image", "json"],
    taskInstruction:
      "Assemble the first cut: sequence clips following the storyboard order, define cutting rhythm.",
  },
  "T5-L:audio": {
    artifactSteps: ["script", "concept", "edit"],
    attachmentTypes: ["video", "json"],
    taskInstruction:
      "Define sonic palette, generate voiceover segments, compose music, create SFX.",
  },
  "T6-L:polish": {
    artifactSteps: ["script", "edit", "audio"],
    attachmentTypes: ["video", "audio", "json"],
    taskInstruction:
      "Apply final polish: color correction, audio sync, transitions, subtitles.",
  },
  "T6-003:delivery": {
    artifactSteps: ["polish"],
    attachmentTypes: ["video", "json"],
    taskInstruction:
      "Encode the final video for all required delivery platforms.",
  },
  "T7-L:delivery": {
    artifactSteps: ["polish", "delivery"],
    attachmentTypes: ["json"],
    taskInstruction: "Prepare the client delivery package.",
  },
  "TL-002:gate": {
    artifactSteps: [
      "brief",
      "concept",
      "script",
      "visual_look",
      "storyboard",
      "video_gen",
      "edit",
      "audio",
      "polish",
    ],
    attachmentTypes: ["image", "video", "audio", "json"],
    taskInstruction:
      "Evaluate this gate. Score 1-10 on relevant dimensions. Issue PASS or FAIL with detailed notes.",
  },
  "XF-001:gate": {
    artifactSteps: [
      "visual_look",
      "storyboard",
      "video_gen",
      "edit",
      "polish",
    ],
    attachmentTypes: ["image", "video", "json"],
    taskInstruction:
      "Evaluate cinematographic quality. Score on composition, lighting, movement, narrative coherence.",
  },
  "T9-L:model_config": {
    artifactSteps: ["brief", "concept"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Create a model selection matrix for this project.",
  },

  // ── Brand Builder Pipeline ──

  "BB-L:discovery": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "You are leading a brand discovery workshop. Synthesize the client's brief and produce a structured workshop document covering: mission, vision, values, history, product/service, differentiators, and aspirations. Ask probing questions and propose initial brand directions.",
  },
  "BB-001:discovery": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "Facilitate the brand discovery workshop. Guide the client through structured questions about their business: Who are you? What do you do? Who do you serve? What makes you different? What do you aspire to become? Produce workshop responses in JSON format with clear sections.",
  },
  "BB-002:research": {
    artifactSteps: ["discovery"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Analyze the workshop responses and produce an audience research report. Include behavioral, psychographic, and cultural analysis of the target audiences. Cross-reference with the cultural and competitive context provided. Output as structured markdown with clear audience segments.",
  },
  "LI-002:research": {
    artifactSteps: ["discovery"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a cultural trends analysis relevant to this brand's industry and target audience. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Include 3-5 relevant cultural trends.",
  },
  "LI-004:research": {
    artifactSteps: ["discovery"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a competitive landscape analysis for this brand. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Map the likely competitive set and identify differentiation opportunities.",
  },
  "BB-L:positioning": {
    artifactSteps: ["discovery", "research"],
    attachmentTypes: [],
    taskInstruction:
      "Using the 3Cs framework (Company, Customers, Competitors), define the brand positioning. Produce: target audience definition, value proposition, competitive set, positioning statement, tone of voice, and brand personality. Reference the workshop and research artifacts.",
  },
  "BB-003:identity": {
    artifactSteps: ["discovery", "research", "positioning"],
    attachmentTypes: [],
    taskInstruction:
      "Design the verbal identity system for this brand. Define: tone of voice (with examples), vocabulary (words to use and avoid), key phrases, communication do's and don'ts. Ensure everything aligns with the positioning statement.",
  },
  "BB-004:identity": {
    artifactSteps: ["discovery", "research", "positioning"],
    attachmentTypes: [],
    taskInstruction:
      "Define the visual identity direction for this brand. Specify: color palette with hex codes and rationale, typography direction, imagery style, logo direction (concept, not design), and visual do's and don'ts. Do NOT generate actual designs — define direction only.",
  },
  "BB-L:brand_dna": {
    artifactSteps: ["discovery", "research", "positioning", "identity"],
    attachmentTypes: [],
    taskInstruction:
      "Consolidate all brand artifacts into the final Brand DNA Document. This is the single source of truth for the brand. Structure: 1) Mission/Vision/Values, 2) Target Audiences, 3) Positioning Statement + 3Cs, 4) Brand Personality, 5) Verbal Identity, 6) Visual Direction, 7) Content Guidelines. Output as a comprehensive markdown document.",
  },

  // ── Strategist Pipeline ──

  "ST-L:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Produce a Marketing Diagnostic Report for this client. Use the Brand DNA Document as context. Apply Harvard M1 (value chain, DTC model) and M2 (marketing plan framework) to assess current position. Include SWOT analysis, channel presence assessment, and the top 3 most urgent actions. Reference listener data for market context.",
  },
  "LI-001:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a brand health assessment for this client. Use your general knowledge — you do not have access to real-time mention data yet. Mark your output as 'baseline analysis — no live data'. Provide a neutral brand health score and identify likely perception areas.",
  },
  "LI-002:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a cultural trends report relevant to this client's industry and audiences. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Include 3-5 cultural trends relevant to their marketing.",
  },
  "LI-003:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate an industry intelligence overview for this client's sector. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Cover market size, key trends, innovation signals, and challenges.",
  },
  "LI-004:diagnostic": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Generate a competitive analysis for this client. Use your general knowledge — you do not have access to real-time data yet. Mark your output as 'baseline analysis — no live data'. Identify likely competitors, their strengths/weaknesses, and gaps this client can exploit.",
  },
  "ST-L:objectives": {
    artifactSteps: ["brand_dna", "diagnostic"],
    attachmentTypes: [],
    taskInstruction:
      "Define measurable SMART marketing objectives aligned to funnel stages (Awareness, Consideration, Conversion, Retention). Apply Harvard M2 goals framework. Each objective must have: specific metric, target value, timeframe, and funnel stage. Output as a structured Objectives Document.",
  },
  "ST-001:audiences": {
    artifactSteps: ["brand_dna", "diagnostic", "objectives"],
    attachmentTypes: [],
    taskInstruction:
      "Create 2-3 detailed buyer personas using Harvard M2 segmentation framework. Each persona should include: demographics, behaviors, motivations, pain points, preferred channels, and content preferences. Cross-reference with the Brand DNA audiences and cultural context. Output as structured markdown.",
  },
  "LI-002:audiences": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Provide cultural context relevant to the audience segments being defined. What cultural trends, values, and behaviors are shaping these audiences? Use your general knowledge. Mark as 'baseline — no live data'.",
  },
  "ST-L:value_prop": {
    artifactSteps: ["brand_dna", "diagnostic", "objectives", "audiences"],
    attachmentTypes: [],
    taskInstruction:
      "Define the marketing positioning using the 3Cs framework (Company, Customers, Competitors). Produce: positioning statement (target + value + competitive set + reasons to believe), competitive differentiation matrix, and messaging hierarchy. Apply Harvard M2 value proposition framework. Reference competitive listener data for market context.",
  },
  "LI-004:value_prop": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Provide competitive context for the positioning exercise. What are the likely competitors doing in terms of messaging and positioning? Use your general knowledge. Mark as 'baseline — no live data'.",
  },
  "ST-002:media_plan": {
    artifactSteps: ["brand_dna", "objectives", "audiences", "value_prop"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Create a Media Plan using the Funnel Matrix (Awareness/Consideration/Conversion/Retention x Paid/Owned/Earned). For each objective x audience combination, recommend specific channels with justification. Apply Harvard M3 (paid media) and M4 (owned/earned media) frameworks. Reference Channel Manager specs for channel capabilities and Media Scout for opportunities. Output as structured markdown with channel-by-channel breakdown.",
  },
  "XA-002:media_plan": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "Provide channel specifications for the media planning process. Present the capabilities, formats, minimum budgets, audience types, and KPIs for each available channel (Meta, Google Ads, TikTok, LinkedIn, Email, SEO). Output as structured reference document.",
  },
  "XA-004:media_plan": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: [],
    taskInstruction:
      "Identify media opportunities for this brand. Based on the industry and target audiences, suggest non-obvious media placements, partnerships, or channel strategies. Use your general knowledge. Mark as 'baseline — no live data'.",
  },
  "ST-003:budget": {
    artifactSteps: ["objectives", "media_plan"],
    attachmentTypes: [],
    taskInstruction:
      "Create a Budget Allocation plan distributing budget by channel x funnel stage. Apply Harvard M6 formulas: set CAC targets by channel, project expected ROAS, estimate LTV impact. Include: budget per channel (% and amount), expected metrics per channel, alert thresholds for overspend. Output as markdown with a summary table plus a JSON budget breakdown.",
  },
  "XA-001:budget": {
    artifactSteps: ["objectives", "media_plan"],
    attachmentTypes: [],
    taskInstruction:
      "Validate the budget allocation. Check: total budget > 0, distribution is reasonable (no single channel > 60%), minimum viable amounts per channel are met. Provide pass/fail assessment with notes.",
  },
  "ST-L:briefs": {
    artifactSteps: ["brand_dna", "objectives", "audiences", "value_prop", "media_plan", "budget"],
    attachmentTypes: [],
    taskInstruction:
      "Generate Campaign Briefs from the approved marketing plan. Create one brief per channel/campaign combination. Each brief must include: objective (linked to SMART goal), target audience (linked to buyer persona), channel and format requirements, assigned budget, expected KPIs (CAC, ROAS, CTR), timeline, and creative direction notes from Brand DNA. These briefs will feed directly into production and distribution motors. Output as individual brief documents separated by --- dividers.",
  },

  // ── Graphic Design Pipeline ──

  "GD-L:brief": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction:
      "Analyze the design brief. Determine: what pieces are needed, formats per channel, quantities, and priority order. If this brief comes from a Campaign Brief (Strategist), extract the visual requirements. Output a Brief Analysis as structured JSON with: pieces (array of {type, channel, format, quantity}), priority, and overall creative direction.",
  },
  "GD-L:design_system": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Supervise the Design System creation. Review the Brand DNA for visual direction (colors, typography, imagery). If a previous Design System exists for this client, validate it against the current Brand DNA and flag any needed updates. Approve or request revisions to the Design System Architect's output.",
  },
  "GD-001:design_system": {
    artifactSteps: ["brand_dna"],
    attachmentTypes: ["image", "json"],
    taskInstruction:
      "Create or update the client's Design System from their Brand DNA Document. Generate: color tokens (primary, secondary, accent, neutral — hex + RGB + CMYK), typography scale (font families, sizes, weights, line heights), grid system (columns, gutters, margins for desktop/tablet/mobile), spacing scale (4px base), and base component patterns (buttons, cards, headers). If client uploaded logos or photos, incorporate them as reference assets. Output as structured markdown + JSON tokens.",
  },
  "GD-L:moodboard": {
    artifactSteps: ["brief", "design_system"],
    attachmentTypes: [],
    taskInstruction:
      "Define the visual direction for this project. Create a moodboard brief specifying: color palette application, layout structure, imagery style, composition approach, and copy direction (key messages, tone per piece). The Graphic Composer will use this to generate visual references.",
  },
  "GD-002:moodboard": {
    artifactSteps: ["brief", "design_system"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Generate moodboard images based on the Art Director's visual direction. Create 3-5 reference images showing the visual style, color palette in use, layout concepts, and typography in context. These are NOT final pieces — they are directional references for production.",
  },
  "GD-002:production": {
    artifactSteps: ["brief", "design_system", "moodboard", "production"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Create the master graphic piece(s). Follow the approved moodboard direction and Design System rules exactly. Apply the copy provided by the Copywriter. Produce at maximum resolution in master format. Each piece must respect: grid system, color tokens, typography scale, safe zones, and accessibility contrast requirements from the design constraints.",
  },
  "GD-004:production": {
    artifactSteps: ["brief", "design_system", "moodboard"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Create motion graphics or animated versions of the design pieces. Add: animated text entrances, subtle transitions, looping elements, or kinetic typography. Keep animations short (3-15 seconds). Output as video clips that the Format Adapter will convert to GIF/MP4.",
  },
  "GD-005:production": {
    artifactSteps: ["brief", "design_system"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Create infographic or data visualization pieces. Transform the provided data into clear, visually compelling graphics following the Design System. Use the client's color palette, typography, and visual style. Ensure all data is accurately represented and the visual hierarchy guides the reader through the information logically.",
  },
  "CW-001:production": {
    artifactSteps: ["brand_dna", "brief", "moodboard"],
    attachmentTypes: [],
    taskInstruction:
      "Write advertising copy for the graphic design pieces. For each piece in the brief, produce: headline (max 8 words), subheadline (max 15 words), body copy (if needed, max 30 words), and CTA (max 5 words). Match the Brand DNA verbal identity (tone, vocabulary, do's/don'ts). Copy must be punchy, memorable, and designed for visual impact — this is advertising, not content. Output as JSON: {pieces: [{pieceId, headline, subheadline, bodyCopy, cta}]}.",
  },
  "GD-003:adaptation": {
    artifactSteps: ["brief", "production"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Adapt master pieces to all required channel formats. For each master piece, produce derivatives at the correct aspect ratio, resolution, and color space per channel (see design-constraints.md). Resize, recrop, and reflow text as needed. Ensure no critical content is cut in safe zones. For print pieces, convert RGB to CMYK and set 300 DPI + 3mm bleed.",
  },
  "GD-003:delivery": {
    artifactSteps: ["production", "adaptation"],
    attachmentTypes: ["image", "video"],
    taskInstruction:
      "Package all final files for delivery. Organize by piece, then by format. Generate a Preview Sheet (PDF) showing all pieces in all formats as a visual index. Create the final ZIP package. Upload everything to R2 storage.",
  },
  "GD-L:gate": {
    artifactSteps: ["brief", "design_system", "moodboard", "production", "adaptation"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Evaluate this gate. For G1 (post-moodboard): Does the visual direction align with Brand DNA? Is the Design System correctly applied? Is the copy direction clear? For G2 (post-production): Are pieces visually excellent? Is copy integrated well? Does it respect the Design System? For G3 (post-delivery): Are all formats present and correct? Score 1-10. Issue PASS or FAIL with notes.",
  },

  // ── Writers Room Pipeline ──
  "WR-L:wr_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret the copy brief. Decide mode: EXPRESS (1 piece, 1 channel, short format) or FULL (multiple pieces, campaign, long content). Assign specialist: WR-002 (av), WR-003 (digital), WR-004 (seo), WR-005 (brand), CW-001 (graphic). Define tone and creative direction. Output JSON: {mode, specialist, tone, direction, pieces: [{format, channel, maxLength}]}." },
  "WR-001:wr_research": { artifactSteps: ["wr_brief"], attachmentTypes: ["text"], taskInstruction: "Research topic, audience, competition, keywords. Output: {topic_summary, audience_profile, competitor_messaging, keywords, content_angles, references}." },
  "WR-002:wr_draft": { artifactSteps: ["wr_brief", "wr_research"], attachmentTypes: ["text", "image"], taskInstruction: "Write AV copy: scripts with timing marks, narrator direction, super text. 30s ≈ 75 words, 60s ≈ 150 words." },
  "WR-003:wr_draft": { artifactSteps: ["wr_brief", "wr_research"], attachmentTypes: ["text", "image"], taskInstruction: "Write digital copy: ads, social posts, email, landing pages. Include A/B variants for subject lines and headlines." },
  "WR-004:wr_draft": { artifactSteps: ["wr_brief", "wr_research"], attachmentTypes: ["text"], taskInstruction: "Write SEO content: articles, pillar pages. H1-H2-H3 structure, meta title <60 chars, meta description 120-160 chars, keyword optimization." },
  "WR-005:wr_draft": { artifactSteps: ["wr_brief", "wr_research"], attachmentTypes: ["text", "image"], taskInstruction: "Write brand copy: taglines (3-8 words), manifestos (200-500 words), naming, claims. Provide 3-5 options with rationale." },
  "CW-001:wr_draft": { artifactSteps: ["wr_brief", "wr_research"], attachmentTypes: ["text", "image"], taskInstruction: "Write short copy for graphic pieces: headlines (max 8 words), subheadlines (max 15), body (max 30), CTAs (max 5). Output JSON." },
  "WR-002:wr_adaptation": { artifactSteps: ["wr_brief", "wr_draft"], attachmentTypes: ["text"], taskInstruction: "Adapt the approved AV script to different durations (30s→15s, 60s→30s) or channels (TV→social, TV→radio). Preserve core message while adjusting timing and format." },
  "WR-003:wr_adaptation": { artifactSteps: ["wr_brief", "wr_draft"], attachmentTypes: ["text"], taskInstruction: "Adapt the approved digital copy to additional channels. Adjust length, tone, and platform conventions (e.g., email→social, ad→landing page, Meta→LinkedIn)." },
  "WR-004:wr_adaptation": { artifactSteps: ["wr_brief", "wr_draft"], attachmentTypes: ["text"], taskInstruction: "Create derivative content from the approved SEO article: social media summaries, email newsletter excerpt, meta descriptions for syndication." },
  "WR-005:wr_adaptation": { artifactSteps: ["wr_brief", "wr_draft"], attachmentTypes: ["text"], taskInstruction: "Adapt brand copy for different applications: website header, business card, social bio, email signature, presentation intro slide." },
  "CW-001:wr_adaptation": { artifactSteps: ["wr_brief", "wr_draft"], attachmentTypes: ["text", "image"], taskInstruction: "Adapt graphic copy to additional formats or channels. Adjust character counts and visual hierarchy for each target format." },
  "WR-L:wr_delivery": { artifactSteps: ["wr_brief", "wr_draft", "wr_adaptation"], attachmentTypes: ["text"], taskInstruction: "Final review: tone matches Brand DNA, lengths respect specs, no errors. Compile deliverables." },

  // ── Audio Pipeline ──
  "AU-L:au_brief": { artifactSteps: [], attachmentTypes: ["json", "audio"], taskInstruction: "Interpret audio brief. Define type (podcast/jingle/voiceover/soundtrack/sonic_branding/sfx_pack/video_audio), sonic concept, agents needed. If parent is video, load script and storyboard." },
  "AU-001:au_sound_design": { artifactSteps: ["au_brief"], attachmentTypes: ["audio", "text"], taskInstruction: "Design sound landscape: select/create SFX, foley, ambiences, transitions. Categorize: hits, whooshes, transitions, ambience, ui. Naming: {category}_{description}_{number}.wav." },
  "AU-002:au_production": { artifactSteps: ["au_brief", "au_sound_design"], attachmentTypes: ["audio", "text"], taskInstruction: "Produce musical elements: composition, selection, arrangement. Deliver stems separated (melody, harmony, bass, drums, pads)." },
  "AU-003:au_production": { artifactSteps: ["au_brief", "au_sound_design"], attachmentTypes: ["audio", "text"], taskInstruction: "Direct and generate voiceover: voice selection, TTS generation, pronunciation guide. Deliver VO as isolated track with cue sheet." },
  "AU-004:au_mix_master": { artifactSteps: ["au_brief", "au_sound_design", "au_production"], attachmentTypes: ["audio"], taskInstruction: "Mix all elements (music, VO, SFX, ambience). Master per channel: broadcast -24 LUFS, streaming -14, web -16, social -14, event -20. Deliver WAV + MP3/AAC." },
  "AU-L:au_delivery": { artifactSteps: ["au_brief", "au_mix_master"], attachmentTypes: ["audio", "text"], taskInstruction: "Final review: specs match requirements, quality professional, brand sonic identity respected. Compile deliverables with manifest." },

  // ── Web Pipeline ──
  "WB-L:wb_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret web brief. Select template: landing-page, landing-multi, microsite, corporate, blog. Define scope: pages, functionality, conversion goal." },
  "WB-001:wb_architecture": { artifactSteps: ["wb_brief"], attachmentTypes: ["text", "json"], taskInstruction: "Design sitemap, navigation (primary 5-7 items max), content hierarchy per page. Map template components. Define form fields. Output JSON." },
  "WB-002:wb_content": { artifactSteps: ["wb_brief", "wb_architecture"], attachmentTypes: ["text", "image", "json"], taskInstruction: "Compose content: map Writers Room copy to template slots, position Graphic Design images, configure CTAs. No empty slots." },
  "WB-003:wb_seo": { artifactSteps: ["wb_brief", "wb_architecture", "wb_content"], attachmentTypes: ["text", "json"], taskInstruction: "Configure SEO: meta title <60 chars, meta description 120-160 chars, OG tags, JSON-LD schema, heading validation, alt text, sitemap.xml, robots.txt." },
  "WB-005:wb_build": { artifactSteps: ["wb_content", "wb_seo"], attachmentTypes: ["text", "json"], taskInstruction: "Compile site from template + content + SEO. Optimize images (WebP, lazy loading). Configure CDN, analytics (GA4, GTM), form submissions." },
  "WB-004:wb_qa": { artifactSteps: ["wb_build"], attachmentTypes: ["text"], taskInstruction: "Validate: responsive (375/768/1280px), accessibility WCAG 2.1 AA (contrast 4.5:1, alt text, keyboard nav, 44x44 touch), Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1), links, forms." },
  "WB-L:wb_delivery": { artifactSteps: ["wb_qa"], attachmentTypes: ["text"], taskInstruction: "Final review before deploy. Verify QA clean, content correct, Brand DNA respected. Prepare deploy package." },

  // ── Marketplace Pipeline ──
  "MK-L:mk_request": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret procurement need. Define: category, services, budget range, location, deadline, minimum vendors, scoring weights." },
  "MK-001:mk_search": { artifactSteps: ["mk_request"], attachmentTypes: ["json"], taskInstruction: "Search vendor registry by category/services. Rank by rating, total_jobs, price_range, location. Return minimum N vendors." },
  "MK-001:mk_quote": { artifactSteps: ["mk_request", "mk_search"], attachmentTypes: ["json"], taskInstruction: "Request and compile quotes: amount, currency, delivery days, specs, payment terms, valid_until." },
  "MK-002:mk_compare": { artifactSteps: ["mk_request", "mk_search", "mk_quote"], attachmentTypes: ["json"], taskInstruction: "Normalize quotes, score: price (0-100), quality (rating), timeliness (delivery days), reliability (history). Apply weights. Rank and recommend." },
  "MK-003:mk_contract": { artifactSteps: ["mk_request", "mk_compare"], attachmentTypes: ["json", "text"], taskInstruction: "Generate work order: specs, quantities, timeline, payment terms, acceptance criteria." },
  "MK-003:mk_tracking": { artifactSteps: ["mk_contract"], attachmentTypes: ["text"], taskInstruction: "Track milestones: order confirmed → production started → proof ready → complete → shipped → delivered. Flag delays." },
  "MK-L:mk_delivery": { artifactSteps: ["mk_request", "mk_contract", "mk_tracking"], attachmentTypes: ["text"], taskInstruction: "Verify delivery, confirm quality, generate vendor review scores." },

  // ── Print Production Pipeline ──
  "PP-L:pp_brief": { artifactSteps: [], attachmentTypes: ["image", "json"], taskInstruction: "Interpret print brief: piece type, quantity, paper, finishing, color mode, bleed, resolution. Input includes artes from Graphic Design." },
  "PP-001:pp_prepress": { artifactSteps: ["pp_brief"], attachmentTypes: ["image"], taskInstruction: "Prepare files: RGB→CMYK, verify 300 DPI (150 large format), add 3mm bleed (5mm large), verify 5mm safe zone, outline typography, check overprint, rich black C40M40Y40K100. Run preflight." },
  "PP-002:pp_vendor_request": { artifactSteps: ["pp_brief", "pp_prepress"], attachmentTypes: ["text", "json"], taskInstruction: "Define print specs for quoting: paper type/weight, finishing, quantity, packaging. Create Marketplace request category='imprenta'." },
  "PP-003:pp_quality_check": { artifactSteps: ["pp_brief", "pp_prepress"], attachmentTypes: ["image", "text"], taskInstruction: "Inspect delivery: color accuracy (Delta E <3), cut precision, finishing quality, quantity. Output quality report with pass/fail." },
  "PP-L:pp_delivery": { artifactSteps: ["pp_quality_check"], attachmentTypes: ["text"], taskInstruction: "Final approval. Review quality report. Accept, request reprint, or escalate." },

  // ── Events Pipeline ──
  "EV-L:ev_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret event brief: type (webinar/workshop/launch/conference/activation/gala/expo), format (virtual/presencial/hybrid), scale, objectives, KPIs, budget." },
  "EV-L:ev_concept": { artifactSteps: ["ev_brief"], attachmentTypes: ["text"], taskInstruction: "Design concept: theme, agenda structure, experience flow, differentiators, atmosphere. For virtual: platform, engagement features." },
  "EV-001:ev_planning": { artifactSteps: ["ev_brief", "ev_concept"], attachmentTypes: ["text", "json"], taskInstruction: "Detailed plan: timeline, checklist with owners/deadlines, budget by category, venue layout with zones, capacity planning, attendee flow map." },
  "EV-002:ev_vendor_setup": { artifactSteps: ["ev_planning"], attachmentTypes: ["text", "json"], taskInstruction: "Create Marketplace requests per vendor category: venue, catering, A/V, entertainment, MC, decoration, furniture, photography, logistics." },
  "EV-003:ev_pre_event": { artifactSteps: ["ev_planning", "ev_vendor_setup"], attachmentTypes: ["text", "image", "json"], taskInstruction: "Coordinate content: WR (scripts, copy), GD (visuals, signage), Print (badges, program), Audio (sound design), Email (invitations, reminders), CM (teasers)." },
  "EV-005:ev_pre_event": { artifactSteps: ["ev_planning"], attachmentTypes: ["text", "json"], taskInstruction: "Guest management: curate list, RSVP tracking, confirmations, +1s, dietary restrictions, QR check-in prep, seating chart, reminders." },
  "EV-003:ev_live_event": { artifactSteps: ["ev_pre_event"], attachmentTypes: ["text", "image"], taskInstruction: "Coordinate live coverage: Video (recording/streaming), CM (real-time posts, stories, hashtag monitoring)." },
  "EV-005:ev_live_event": { artifactSteps: ["ev_pre_event"], attachmentTypes: ["text"], taskInstruction: "On-site operations: check-in (QR scan), real-time attendance, walk-ins, seating changes, issue resolution." },
  "EV-003:ev_post_event": { artifactSteps: ["ev_live_event"], attachmentTypes: ["text", "image", "video"], taskInstruction: "Follow-up: Email (thank you, survey), CM (recap, gallery), Video (recap 1-3min), WR (blog recap, press release)." },
  "EV-004:ev_post_event": { artifactSteps: ["ev_live_event"], attachmentTypes: ["text", "json"], taskInstruction: "Measure: attendance vs target, leads, social engagement, ROI, NPS. Generate report with insights and recommendations." },
  "EV-L:ev_delivery": { artifactSteps: ["ev_post_event"], attachmentTypes: ["text", "json"], taskInstruction: "Close event: review report, validate follow-up complete, submit vendor reviews, document learnings." },

  // ── Ads Pipeline ──
  "AD-L:ad_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret pauta brief. Define: objective (awareness/consideration/conversion), total budget, duration, preferred platforms, target audience. Output JSON." },
  "AD-001:ad_strategy": { artifactSteps: ["ad_brief"], attachmentTypes: ["text", "json"], taskInstruction: "Design media plan: select channels, distribute budget by channel and funnel phase, define timeline, set KPI targets per channel. Use channel-specs.json." },
  "AD-002:ad_creative": { artifactSteps: ["ad_brief", "ad_strategy"], attachmentTypes: ["text", "json"], taskInstruction: "Coordinate asset production: create sub-projects in Writers Room (copy per platform) and Graphic Design (visuals per format). For video ads, create Video Production sub-project. Do NOT produce copy or visuals directly." },
  "AD-003:ad_targeting": { artifactSteps: ["ad_brief", "ad_strategy"], attachmentTypes: ["text", "json"], taskInstruction: "Define audiences per platform: demographics, interests, behaviors, custom audiences (lookalikes, retargeting), exclusions. Output as configurable targeting specs." },
  "AD-004:ad_launch_kit": { artifactSteps: ["ad_brief", "ad_strategy", "ad_creative", "ad_targeting"], attachmentTypes: ["text", "image", "json"], taskInstruction: "Compile launch kit: Campaign → Ad Group/Set → Ad structure, assign creatives, configure bid strategy, placement, schedule, budget. Executable document per platform." },
  "AD-L:ad_delivery": { artifactSteps: ["ad_launch_kit"], attachmentTypes: ["text", "json"], taskInstruction: "Final review of launch kit. Verify completeness, coherence, budget alignment. Compile deliverable." },

  // ── Community Management Pipeline ──
  "CM-L:cm_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret social brief. Define: active networks, objectives (engagement/growth/traffic/leads), tone of voice per network, target frequency." },
  "CM-001:cm_calendar": { artifactSteps: ["cm_brief"], attachmentTypes: ["text", "json"], taskInstruction: "Design monthly editorial calendar: themes per week, frequency per network, content types (educativo 40%, entretenimiento 30%, venta 20%, behind-the-scenes 10%), special dates and holidays." },
  "CM-002:cm_content_production": { artifactSteps: ["cm_brief", "cm_calendar"], attachmentTypes: ["text", "json"], taskInstruction: "Coordinate production: create sub-projects in Writers Room (captions, format=digital, channel=social) and Graphic Design (visual assets) for each post. For reels/shorts, create Video Production sub-project." },
  "CM-002:cm_scheduling": { artifactSteps: ["cm_content_production"], attachmentTypes: ["text", "json"], taskInstruction: "Schedule publications: assign optimal date and time per post, verify no conflicts or gaps, check platform-specific timing." },
  "CM-003:cm_monitoring": { artifactSteps: [], attachmentTypes: ["text"], taskInstruction: "Monitor mentions and comments across all networks. Respond following Brand DNA tone. Detect mild crises (negative comments, complaints). Escalate major crises. Report sentiment." },
  "CM-004:cm_reporting": { artifactSteps: ["cm_monitoring"], attachmentTypes: ["text", "json"], taskInstruction: "Analyze metrics: engagement rate, reach, impressions, follower growth, best performing content by type/theme/time. Generate report with insights and recommendations." },
  "CM-L:cm_delivery": { artifactSteps: ["cm_reporting"], attachmentTypes: ["text", "json"], taskInstruction: "Review cycle performance. Adjust strategy for next month based on insights." },

  // ── Email Marketing Pipeline ──
  "EM-L:em_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret email brief. Define: type (campaign/flow), objective, target audience, expected metrics." },
  "EM-001:em_strategy": { artifactSteps: ["em_brief"], attachmentTypes: ["text", "json"], taskInstruction: "Design email sequence: number of emails, triggers, timing between emails, exit conditions, A/B testing plan (subject lines, content variants)." },
  "EM-002:em_production": { artifactSteps: ["em_brief", "em_strategy"], attachmentTypes: ["text", "json"], taskInstruction: "Coordinate production: create sub-projects in Writers Room (subject+body per email, format=digital, channel=email) and Graphic Design (visual template). Compile final emails." },
  "EM-003:em_segmentation": { artifactSteps: ["em_brief", "em_strategy"], attachmentTypes: ["text", "json"], taskInstruction: "Define audience segments: by funnel stage (lead/MQL/SQL/customer), engagement level (active/warm/cold/churned), demographics, behavior (opened last 30d, clicked, purchased)." },
  "EM-002:em_send": { artifactSteps: ["em_production", "em_segmentation"], attachmentTypes: ["text"], taskInstruction: "Execute send via Resend API. Configure A/B split if applicable. Schedule timing per strategy." },
  "EM-004:em_analysis": { artifactSteps: ["em_send"], attachmentTypes: ["text", "json"], taskInstruction: "Analyze post-send metrics: open rate, click rate, conversion rate, unsubscribe rate, bounce rate, A/B test results. Generate optimization recommendations." },
  "EM-L:em_delivery": { artifactSteps: ["em_analysis"], attachmentTypes: ["text", "json"], taskInstruction: "Review email performance. Optimizations for next send." },

  // ── SEO/Content Pipeline ──
  "SE-L:se_brief": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret SEO brief: scope (full site or section), objectives (traffic/rankings/leads), competitors to analyze." },
  "SE-001:se_audit": { artifactSteps: ["se_brief"], attachmentTypes: ["text", "json"], taskInstruction: "Technical SEO audit: crawlability (robots.txt, sitemap), indexation (canonical, noindex), Core Web Vitals, mobile-friendliness, structured data, page speed, broken links, redirect chains. Output issue list with severity and suggested fix." },
  "SE-002:se_keyword_strategy": { artifactSteps: ["se_brief", "se_audit"], attachmentTypes: ["text", "json"], taskInstruction: "Keyword research: search volume, keyword difficulty, search intent (informational/navigational/commercial/transactional), keyword clusters, content gaps vs competition, long-tail opportunities. Output keyword map with priority." },
  "SE-003:se_content_plan": { artifactSteps: ["se_brief", "se_keyword_strategy"], attachmentTypes: ["text", "json"], taskInstruction: "Map keywords to pages (existing or new), define pillar-cluster structure, production calendar, prioritize by impact potential (volume x ranking probability)." },
  "SE-004:se_optimization": { artifactSteps: ["se_content_plan"], attachmentTypes: ["text"], taskInstruction: "Optimize existing content: meta tags, headings, internal links, content freshness. Create briefs for Writers Room (WR-004) for new SEO content." },
  "SE-004:se_reporting": { artifactSteps: ["se_optimization"], attachmentTypes: ["text", "json"], taskInstruction: "Monitor rankings, organic traffic, backlink profile. Detect ranking drops, recommend content refresh for declining pages." },
  "SE-L:se_delivery": { artifactSteps: ["se_reporting"], attachmentTypes: ["text", "json"], taskInstruction: "Review SEO performance. Adjust strategy for next cycle." },

  // ── Channel Manager Pipeline ──
  "CH-L:ch_request": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret channel request: which channel(s), objective, estimated budget, query type (specs/recommendation/procurement)." },
  "CH-001:ch_analysis": { artifactSteps: ["ch_request"], attachmentTypes: ["text", "json"], taskInstruction: "Analyze digital channel(s): available formats, estimated costs (CPM/CPC/CPV), audience, best practices, limitations. Use channel-specs.json." },
  "CH-002:ch_analysis": { artifactSteps: ["ch_request"], attachmentTypes: ["text", "json"], taskInstruction: "Analyze traditional channel(s): formats, estimated costs, reach, frequency, advantages/limitations. If procurement needed, create Marketplace request." },
  "CH-003:ch_specs": { artifactSteps: ["ch_request", "ch_analysis"], attachmentTypes: ["json"], taskInstruction: "Generate detailed technical specs: dimensions, resolution, file format, max weight, duration, safe zones, color space. Output structured JSON." },
  "CH-L:ch_delivery": { artifactSteps: ["ch_specs"], attachmentTypes: ["text", "json"], taskInstruction: "Compile final recommendation with specs. Deliver to invoking motor." },

  // ── Opportunity Agent (loop) ──
  "OP-001:op_scan": { artifactSteps: [], attachmentTypes: ["text", "json"], taskInstruction: "Collect recent outputs from 4 Listeners (LI-001 Brand, LI-002 Culture, LI-003 Industry, LI-004 Competitive). Cross signals looking for patterns: trending topic matching audience, competitor gap, brand mention to amplify, industry signal for thought leadership." },
  "OP-L:op_evaluate": { artifactSteps: ["op_scan"], attachmentTypes: ["text", "json"], taskInstruction: "Evaluate each signal: relevance to brand (1-10), time window, potential impact, resource needed. Filter: only signals scoring >= minRelevanceScore become opportunities." },
  "OP-002:op_alert": { artifactSteps: ["op_evaluate"], attachmentTypes: ["text", "json"], taskInstruction: "For each approved opportunity: generate activation brief with suggested motor (CM for social, Ads for campaigns, WR for content, SEO for thought leadership), urgency level, and draft brief." },

  // ── Brand Listener (loop) ──
  "BL-001:bl_scan": { artifactSteps: [], attachmentTypes: ["text"], taskInstruction: "Scan for brand mentions across social media, press, forums, reviews, and blogs. Collect: source, text, author, date, reach estimate. Use LLM general knowledge — mark estimates with [VERIFY]. Output: {mentions: [{source, text, author, date, reach, url}]}." },
  "BL-002:bl_analyze": { artifactSteps: ["bl_scan"], attachmentTypes: ["text", "json"], taskInstruction: "Classify each mention by sentiment (positive/neutral/negative, 1-10 scale), topic (product/service/brand/people/price), and urgency (routine/notable/crisis). Calculate Brand Health Score (weighted sentiment average). Flag crisis-level mentions. Output: {brand_health_score, sentiment_distribution, crisis_alerts: [], notable_mentions: []}." },
  "BL-L:bl_report": { artifactSteps: ["bl_scan", "bl_analyze"], attachmentTypes: ["text", "json"], taskInstruction: "Generate Brand Health Report: overall score, sentiment trend (vs previous period), top positive mentions, top negative mentions, crisis alerts if any, recommendations. If crisis detected, generate immediate alert artifact." },

  // ── Culture Listener (loop) ──
  "CL-001:cl_scan": { artifactSteps: [], attachmentTypes: ["text"], taskInstruction: "Scan for cultural trends, viral topics, memes, social movements, and seasonal themes relevant to the client's market and audience. Use LLM general knowledge. Output: {trends: [{topic, description, velocity, platform, audience_overlap_estimate}]}." },
  "CL-002:cl_analyze": { artifactSteps: ["cl_scan"], attachmentTypes: ["text", "json"], taskInstruction: "Evaluate each trend for brand relevance: does it match the audience? Is it on-brand? What's the time window? Score relevance 1-10. Identify upcoming special dates and cultural moments. Output: {relevant_trends: [{topic, relevance_score, time_window, suggested_action}], upcoming_dates: []}." },
  "CL-L:cl_report": { artifactSteps: ["cl_scan", "cl_analyze"], attachmentTypes: ["text", "json"], taskInstruction: "Generate Trend Report: top relevant trends with suggested brand response, upcoming cultural moments to prepare for, trends to avoid. Feed high-score trends to Opportunity Agent." },

  // ── Industry Listener (loop) ──
  "IL-001:il_scan": { artifactSteps: [], attachmentTypes: ["text"], taskInstruction: "Scan for industry signals: publications, research reports, patents, product launches, regulatory changes, M&A activity, technology innovations in the client's sector. Use LLM general knowledge. Output: {signals: [{type, title, source, date, summary}]}." },
  "IL-002:il_analyze": { artifactSteps: ["il_scan"], attachmentTypes: ["text", "json"], taskInstruction: "Evaluate each signal's impact on the client's business: is it an opportunity or threat? What's the timeframe? What action should the client consider? Score impact 1-10. Output: {analyzed_signals: [{title, impact_score, opportunity_or_threat, timeframe, suggested_action}]}." },
  "IL-L:il_report": { artifactSteps: ["il_scan", "il_analyze"], attachmentTypes: ["text", "json"], taskInstruction: "Generate Industry Intelligence Report: top signals by impact, opportunities to pursue, threats to monitor, recommended thought leadership topics. Feed high-impact signals to Opportunity Agent." },

  // ── Competitive Listener (loop) ──
  "CO-001:co_scan": { artifactSteps: [], attachmentTypes: ["text"], taskInstruction: "Scan competitor activity: campaigns launched, product updates, pricing changes, hiring patterns, content published, social media activity, PR mentions. Focus on client's top 5 competitors. Use LLM general knowledge. Output: {competitor_activity: [{competitor, type, description, date, significance}]}." },
  "CO-002:co_analyze": { artifactSteps: ["co_scan"], attachmentTypes: ["text", "json"], taskInstruction: "Identify competitive gaps and threats: what are competitors doing that the client isn't? Where is the client ahead? Score each gap by urgency (1-10) and opportunity size. Output: {gaps: [{area, competitor, description, urgency, opportunity_size, suggested_response}], threats: []}." },
  "CO-L:co_report": { artifactSteps: ["co_scan", "co_analyze"], attachmentTypes: ["text", "json"], taskInstruction: "Generate Competitive Dashboard: competitor activity summary, gaps ranked by priority, threats to watch, recommended competitive responses. Feed high-urgency gaps to Opportunity Agent." },

  // ── Sales/CRM Pipeline ──
  "SL-001:sl_capture": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Capture lead from channel. Normalize: name, email, company, phone, source (web_form/email/event/ad/referral), sourceDetail. Deduplicate by email against existing leads. Output: {lead, is_duplicate, merged_with}." },
  "SL-002:sl_enrich": { artifactSteps: ["sl_capture"], attachmentTypes: ["text", "json"], taskInstruction: "Enrich lead with public data: company name, size, industry, HQ, website, LinkedIn. Use LLM general knowledge — mark all with [VERIFY]. Output: {enriched_fields, confidence_scores}." },
  "SL-003:sl_score": { artifactSteps: ["sl_capture", "sl_enrich"], attachmentTypes: ["text", "json"], taskInstruction: "Score lead: Fit (0-100 ICP match), Intent (0-100 engagement), BANT (Budget/Authority/Need/Timeline Y/N each). Total = Fit*0.4 + Intent*0.3 + BANT*0.3. Classify: Hot(80+), Warm(50-79), Cold(<50). Output: {scores, classification, recommended_action}." },
  "SL-004:sl_nurture": { artifactSteps: ["sl_score"], attachmentTypes: ["text", "json"], taskInstruction: "Based on score: Hot → create Email Marketing sub-project for immediate sales outreach. Warm → 4-email weekly nurture sequence. Cold → monthly drip. Output: {em_sub_project_id, sequence_type, timeline}." },
  "SL-005:sl_proposal": { artifactSteps: ["sl_capture", "sl_enrich", "sl_score"], attachmentTypes: ["text", "json"], taskInstruction: "Generate proposal: create WR sub-project (proposal copy), GD sub-project (branded template), request pricing from XA-001. Compile final document. Do NOT write the proposal — coordinate production. Output: {proposal_document, pricing_summary, valid_until}." },
  "SL-L:sl_negotiate": { artifactSteps: ["sl_proposal"], attachmentTypes: ["text", "json"], taskInstruction: "Track negotiation: log interactions, follow-ups, objections, counter-proposals. Update deal probability. Schedule next action. Output: {negotiation_log, updated_probability, next_action, next_action_date}." },
  "SL-L:sl_close": { artifactSteps: ["sl_negotiate"], attachmentTypes: ["text", "json"], taskInstruction: "Close deal: won (value, date, terms) or lost (reason: price/timing/competition/need/other). Update lead and deal status. Output: {outcome, value_if_won, reason_if_lost, close_date}." },
  "SL-006:sl_attribution": { artifactSteps: ["sl_capture", "sl_close"], attachmentTypes: ["text", "json"], taskInstruction: "Attribute closed deal to origin: channel, campaign, content. Models: first-touch, last-touch, linear. Output: {attribution: {first_touch, last_touch, linear}}." },
  "SL-L:sl_delivery": { artifactSteps: ["sl_close", "sl_attribution"], attachmentTypes: ["text", "json"], taskInstruction: "Generate deal close report: outcome, value, attribution, time-to-close, lessons learned. Update pipeline metrics." },

  // ── Analytics Pipeline ──
  "AN-L:an_request": { artifactSteps: [], attachmentTypes: ["json"], taskInstruction: "Interpret analytics request: type (dashboard/report/query), period, metrics, comparison period. Output JSON." },
  "AN-001:an_collect": { artifactSteps: ["an_request"], attachmentTypes: ["json"], taskInstruction: "Collect data from all motors: Ads (spend, clicks, conversions), CM (engagement, reach), Email (opens, clicks), SEO (rankings, traffic), Sales (leads, deals, revenue). Normalize into unified dataset." },
  "AN-002:an_analyze": { artifactSteps: ["an_request", "an_collect"], attachmentTypes: ["json"], taskInstruction: "Calculate metrics: CAC (spend/customers), LTV (avg revenue × retention), ROAS per channel, funnel rates (lead→MQL→SQL→customer), attribution (first/last/linear). Flag anomalies (>20% change). Output structured metrics." },
  "AN-005:an_analyze": { artifactSteps: ["an_request", "an_collect"], attachmentTypes: ["json", "text"], taskInstruction: "Answer natural language question using collected data. Translate to data query, execute, format response in conversational Spanish with supporting numbers. Output: {question, answer, supporting_data}." },
  "AN-003:an_visualize": { artifactSteps: ["an_request", "an_analyze"], attachmentTypes: ["json"], taskInstruction: "Generate dashboard data: KPI cards (metric, value, trend, target), charts (line trends, bar comparisons, funnel), tables (channel comparison). Output structured JSON for frontend." },
  "AN-004:an_visualize": { artifactSteps: ["an_request", "an_analyze"], attachmentTypes: ["json"], taskInstruction: "Generate report with narrative in Spanish: executive summary (3-5 sentences), metric sections with explanations, anomaly highlights, actionable recommendations (3-5). Output markdown." },
  "AN-L:an_deliver": { artifactSteps: ["an_visualize"], attachmentTypes: ["text", "json"], taskInstruction: "Final review: verify metrics accuracy, narrative clarity, recommendations quality. Compile and deliver." },
};

// ── Agent Output Types ─────────────────────────────────────────
// Maps each agent:step to the type of content it produces.
// Most agents produce text; exceptions listed explicitly.

export const AGENT_OUTPUT_TYPES: Record<
  string,
  "text" | "image" | "video" | "audio"
> = {
  "T7-L:brief": "text",
  "T1-L:brief": "text",
  "T1-L:concept": "text",
  "T2-L:script": "text",
  "T2-002:script": "text",
  "T2-006:script": "text",
  "T3-L:visual_look": "text",
  "TL-003:visual_look": "text",
  "T3-L:storyboard": "text",
  "T3-003:storyboard": "image",
  "T3-003:video_gen": "video",
  "T6-L:edit": "text",
  "T5-L:audio": "audio",
  "T6-L:polish": "text",
  "T6-003:delivery": "text",
  "T7-L:delivery": "text",
  "TL-002:gate": "text",
  "XF-001:gate": "text",
  "T9-L:model_config": "text",

  // Brand Builder
  "BB-L:discovery": "text",
  "BB-001:discovery": "text",
  "BB-002:research": "text",
  "LI-002:research": "text",
  "LI-004:research": "text",
  "BB-L:positioning": "text",
  "BB-003:identity": "text",
  "BB-004:identity": "text",
  "BB-L:brand_dna": "text",

  // Strategist
  "ST-L:diagnostic": "text",
  "LI-001:diagnostic": "text",
  "LI-002:diagnostic": "text",
  "LI-003:diagnostic": "text",
  "LI-004:diagnostic": "text",
  "ST-L:objectives": "text",
  "ST-001:audiences": "text",
  "LI-002:audiences": "text",
  "ST-L:value_prop": "text",
  "LI-004:value_prop": "text",
  "ST-002:media_plan": "text",
  "XA-002:media_plan": "text",
  "XA-004:media_plan": "text",
  "ST-003:budget": "text",
  "XA-001:budget": "text",
  "ST-L:briefs": "text",

  // Graphic Design
  "GD-L:brief": "text",
  "GD-L:design_system": "text",
  "GD-001:design_system": "text",
  "GD-L:moodboard": "text",
  "GD-002:moodboard": "image",
  "GD-002:production": "image",
  "GD-004:production": "video",
  "GD-005:production": "image",
  "CW-001:production": "text",
  "GD-003:adaptation": "image",
  "GD-003:delivery": "text",
  "GD-L:gate": "text",

  // Writers Room
  "WR-L:wr_brief": "text", "WR-001:wr_research": "text", "WR-002:wr_draft": "text", "WR-003:wr_draft": "text", "WR-004:wr_draft": "text", "WR-005:wr_draft": "text", "CW-001:wr_draft": "text", "WR-L:wr_adaptation": "text", "WR-L:wr_delivery": "text",
  // Audio
  "AU-L:au_brief": "text", "AU-001:au_sound_design": "audio", "AU-002:au_production": "audio", "AU-003:au_production": "audio", "AU-004:au_mix_master": "audio", "AU-L:au_delivery": "audio",
  // Web
  "WB-L:wb_brief": "text", "WB-001:wb_architecture": "text", "WB-002:wb_content": "text", "WB-003:wb_seo": "text", "WB-005:wb_build": "text", "WB-004:wb_qa": "text", "WB-L:wb_delivery": "text",
  // Marketplace
  "MK-L:mk_request": "text", "MK-001:mk_search": "text", "MK-001:mk_quote": "text", "MK-002:mk_compare": "text", "MK-003:mk_contract": "text", "MK-003:mk_tracking": "text", "MK-L:mk_delivery": "text",
  // Print Production
  "PP-L:pp_brief": "text", "PP-001:pp_prepress": "text", "PP-002:pp_vendor_request": "text", "PP-003:pp_quality_check": "text", "PP-L:pp_delivery": "text",
  // Events
  "EV-L:ev_brief": "text", "EV-L:ev_concept": "text", "EV-001:ev_planning": "text", "EV-002:ev_vendor_setup": "text", "EV-003:ev_pre_event": "text", "EV-005:ev_pre_event": "text", "EV-003:ev_live_event": "text", "EV-005:ev_live_event": "text", "EV-003:ev_post_event": "text", "EV-004:ev_post_event": "text", "EV-L:ev_delivery": "text",
  // Ads
  "AD-L:ad_brief": "text", "AD-001:ad_strategy": "text", "AD-002:ad_creative": "text", "AD-003:ad_targeting": "text", "AD-004:ad_launch_kit": "text", "AD-L:ad_delivery": "text",
  // Community Management
  "CM-L:cm_brief": "text", "CM-001:cm_calendar": "text", "CM-002:cm_content_production": "text", "CM-002:cm_scheduling": "text", "CM-003:cm_monitoring": "text", "CM-004:cm_reporting": "text", "CM-L:cm_delivery": "text",
  // Email Marketing
  "EM-L:em_brief": "text", "EM-001:em_strategy": "text", "EM-002:em_production": "text", "EM-003:em_segmentation": "text", "EM-002:em_send": "text", "EM-004:em_analysis": "text", "EM-L:em_delivery": "text",
  // SEO/Content
  "SE-L:se_brief": "text", "SE-001:se_audit": "text", "SE-002:se_keyword_strategy": "text", "SE-003:se_content_plan": "text", "SE-004:se_optimization": "text", "SE-004:se_reporting": "text", "SE-L:se_delivery": "text",
  // Channel Manager
  "CH-L:ch_request": "text", "CH-001:ch_analysis": "text", "CH-002:ch_analysis": "text", "CH-003:ch_specs": "text", "CH-L:ch_delivery": "text",
  // Opportunity Agent
  "OP-001:op_scan": "text", "OP-L:op_evaluate": "text", "OP-002:op_alert": "text",
  // Brand Listener
  "BL-001:bl_scan": "text", "BL-002:bl_analyze": "text", "BL-L:bl_report": "text",
  // Culture Listener
  "CL-001:cl_scan": "text", "CL-002:cl_analyze": "text", "CL-L:cl_report": "text",
  // Industry Listener
  "IL-001:il_scan": "text", "IL-002:il_analyze": "text", "IL-L:il_report": "text",
  // Competitive Listener
  "CO-001:co_scan": "text", "CO-002:co_analyze": "text", "CO-L:co_report": "text",
  // Sales/CRM
  "SL-001:sl_capture": "text", "SL-002:sl_enrich": "text", "SL-003:sl_score": "text", "SL-004:sl_nurture": "text", "SL-005:sl_proposal": "text", "SL-L:sl_negotiate": "text", "SL-L:sl_close": "text", "SL-006:sl_attribution": "text", "SL-L:sl_delivery": "text",
  // Analytics
  "AN-L:an_request": "text", "AN-001:an_collect": "text", "AN-002:an_analyze": "text", "AN-005:an_analyze": "text", "AN-003:an_visualize": "text", "AN-004:an_visualize": "text", "AN-L:an_deliver": "text",
};
