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
};
