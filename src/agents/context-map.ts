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
};
