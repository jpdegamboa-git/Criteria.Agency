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
  "paused",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const GATE_TYPES = ["g1", "g2", "g3", "g4", "g5"] as const;
export type GateType = (typeof GATE_TYPES)[number];

export const GATE_DECISIONS = ["pass", "fail"] as const;
export type GateDecision = (typeof GATE_DECISIONS)[number];

export const ARTIFACT_STEPS = [
  "brief",
  "concept",
  "script",
  "visual_look",
  "storyboard",
  "video_gen",
  "edit",
  "audio",
  "polish",
  "delivery",
  "model_config",
  "gate_review",
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

// ── Pipeline flow ──

/** Ordered pipeline steps (excluding gates and paused) */
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

/** Which gate follows which step (if any) */
export const STEP_GATE_MAP: Partial<Record<ProjectStatus, GateType>> = {
  concept: "g1",
  script: "g2",
  storyboard: "g3",
  audio: "g4",
  polish: "g5",
};

/** Gate failure: which step to return to */
export const GATE_FAIL_RETURN: Record<GateType, ProjectStatus> = {
  g1: "concept",
  g2: "script",
  g3: "storyboard",
  g4: "edit", // G4 diagnostic can route to edit, video_gen, or audio — default edit
  g5: "polish",
};

/** Max iterations per gate before escalation */
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
  gates: GateType[];
  autonomy: number;
}

/** Which agents execute at each pipeline step */
export const STEP_AGENTS: Record<string, string[]> = {
  brief: ["T7-L", "T1-L"],
  concept: ["T1-L"],
  script: ["T2-L", "T2-002", "T2-006"],
  visual_look: ["T3-L", "TL-003"],
  storyboard: ["T3-L", "T3-003"],
  video_gen: ["T3-003"],
  edit: ["T6-L"],
  audio: ["T5-L"],
  polish: ["T6-L"],
  delivery: ["T6-003", "T7-L"],
};

/** Which agents participate in each gate */
export const GATE_AGENTS: Record<GateType, string[]> = {
  g1: ["TL-002"],
  g2: ["TL-002", "T1-L"],
  g3: ["TL-002"],
  g4: ["TL-002", "XF-001"],
  g5: ["TL-002", "XF-001"],
};

// ── Mock output definitions ──

export interface MockArtifactDef {
  name: string;
  type: ArtifactType;
  templateContent: string;
}

/** What artifacts each agent produces at each step */
export const AGENT_OUTPUTS: Record<string, Record<string, MockArtifactDef[]>> = {
  "T7-L": {
    brief: [
      { name: "onboarding_record.md", type: "document", templateContent: "## Onboarding Record\n\n**Company**: Demo Corp\n**Industry**: Technology\n**Contact**: John Doe, CMO\n**Communication preference**: portal\n**Production experience**: some\n\n### Brand assets received\n- [x] Logo (PNG, SVG)\n- [x] Brand guidelines PDF\n- [x] Color palette: #1a1a2e, #16213e, #0f3460\n- [ ] Fonts: pending\n- [ ] Reference videos: none\n\n### Client goals\nLaunch video for new SaaS product targeting enterprise CTOs." },
    ],
    delivery: [
      { name: "delivery_notification.md", type: "document", templateContent: "## Delivery Notification\n\nYour project is complete and ready for download.\n\n**Files included:**\n- YouTube (1080p)\n- Instagram Reels (vertical)\n- LinkedIn (16:9)\n\nPlease review and let us know if you have any questions." },
    ],
  },
  "T1-L": {
    brief: [
      { name: "brief_summary.md", type: "document", templateContent: "## Brief Summary — Demo Video\n\n**Project type**: corporate\n**Objective**: Launch awareness for new SaaS product\n**Target audience**: Enterprise CTOs, 40-55, seeing content on LinkedIn\n**Key messages**:\n1. Simplifies enterprise workflow by 60%\n2. Enterprise-grade security built in\n3. ROI within 3 months\n**Tone**: Confident and warm — authoritative but not corporate-cold\n**Duration**: 90 seconds for LinkedIn\n**Budget range**: Mid-range\n**Timeline**: 2 weeks" },
    ],
    concept: [
      { name: "enriched_brief.md", type: "document", templateContent: "## Enriched Brief — Demo Video\n\n### Market analysis\nCompetitors use generic stock footage with piano tracks. Opportunity: show the actual product in a narrative context.\n\n### Audience insight\nEnterprise CTOs see 50+ videos weekly. Stop the scroll with a bold visual hook in first 3 seconds.\n\n### Refined messages\n1. \"Your team wastes 12 hours/week on workflow friction\" (pain point)\n2. \"One platform, zero friction\" (solution)\n3. \"Enterprise security, startup speed\" (differentiator)" },
      { name: "concept_doc.md", type: "document", templateContent: "## Concept Document — Demo Video\n\n### Creative concept\nA day in the life of a CTO, split-screen: left side shows chaos (meetings, emails, spreadsheets), right side shows calm (one dashboard, one flow, one decision). The split gradually merges as the product unifies their world.\n\n### Creative north\n\"From chaos to clarity in 90 seconds.\"\n\n### Tone definition\n- Primary: Confident\n- Secondary: Warm\n- Avoid: Corporate-cold, salesy, generic\n- Reference: \"Apple product launch meets Slack brand film\"" },
      { name: "creative_direction.md", type: "document", templateContent: "## Creative Direction — Demo Video\n\n### Visual direction\n- Color world: Deep navy (#1a1a2e) → clean white transition\n- Texture: Clean, digital, minimal\n- Movement: Dynamic split-screen → unified reveal\n- Framing: Tight on faces (chaos), wide on screens (clarity)\n\n### Audio direction\n- Music: Electronic ambient, building energy\n- VO: Male, 35-45, warm authority\n- SFX: Subtle UI sounds, notification pings (chaos side)" },
      { name: "moodboard_brief.md", type: "document", templateContent: "## Moodboard Brief — Demo Video\n\n### Visual references\n1. Apple WWDC product reveals (clean, confident transitions)\n2. Slack \"Work, simplified\" campaign (warm tech aesthetic)\n3. Linear app marketing (minimal UI showcase)\n\n### Color palette\n- Primary: #1a1a2e (deep navy)\n- Secondary: #ffffff (clean white)\n- Accent: #0f3460 (tech blue)\n\n### Typography\n- Sans-serif, geometric, clean\n- No decorative fonts" },
    ],
  },
  "T2-L": {
    script: [
      { name: "script_v1.md", type: "document", templateContent: "## Script — Demo Video v1\n\n### Beat Sheet\n| Beat | Time | Visual | Audio |\n|------|------|--------|-------|\n| Hook | 0:00-0:05 | Split screen: chaos vs calm | Tension SFX |\n| Pain | 0:05-0:20 | CTO overwhelmed | VO: \"Your team wastes 12 hours...\" |\n| Bridge | 0:20-0:30 | Screen merge begins | Music builds |\n| Solution | 0:30-0:55 | Product demo flow | VO: \"One platform, zero friction\" |\n| Proof | 0:55-1:15 | Dashboard metrics | VO: \"Enterprise security...\" |\n| CTA | 1:15-1:30 | Logo + URL | Music resolves |\n\n### Full Script\n[SCENE 1 - HOOK]\nVISUAL: Split screen. Left: cluttered desktop, notifications. Right: clean dashboard.\nVO: (silence — let visuals speak)\nSFX: Notification cascade (left) vs. calm click (right)\n\n[SCENE 2 - PAIN POINT]\nVISUAL: CTO at desk, rubbing temples. Multiple screens with spreadsheets.\nVO: \"Your team wastes twelve hours every week on workflow friction. Twelve hours of meetings about meetings, updates about updates.\"\n..." },
    ],
  },
  "T2-002": {
    script: [
      { name: "av_script_v1.md", type: "document", templateContent: "## AV Script — Demo Video v1\n\n| # | Time | Visual | VO/Dialogue | SFX | Music |\n|---|------|--------|-------------|-----|-------|\n| 1 | 0:00-0:05 | Split screen reveal | — | Notification cascade L / Click R | Tension drone |\n| 2 | 0:05-0:12 | CTO overwhelmed | \"Your team wastes twelve hours...\" | Keyboard, mouse clicks | Low pulse |\n| 3 | 0:12-0:20 | Multiple screens | \"...meetings about meetings\" | — | Building |\n| 4 | 0:20-0:30 | Screens merge | \"What if it didn't have to be?\" | Merge whoosh | Transition |\n| 5 | 0:30-0:45 | Product UI demo | \"One platform. Zero friction.\" | UI sounds | Uplifting |\n| 6 | 0:45-0:55 | Dashboard metrics | \"Enterprise security, startup speed\" | — | Peak |\n| 7 | 0:55-1:15 | Customer logos | \"Join 500+ companies...\" | — | Sustain |\n| 8 | 1:15-1:30 | Logo + CTA | \"Start your free trial\" | — | Resolve |" },
    ],
  },
  "T2-006": {
    script: [
      { name: "script_review.md", type: "document", templateContent: "## Script Doctor Review — Demo Video v1\n\n**Verdict**: APPROVED WITH MINOR NOTES\n\n### Structure: 9/10\nStrong three-act structure. Hook is visual-first (correct for LinkedIn autoplay).\n\n### Pacing: 8/10\nGood overall. Scene 2 (pain) could be 2 seconds shorter — the point lands by 0:18.\n\n### Tone: 9/10\nConsistent with creative direction. No corporate drift.\n\n### VO/Dialogue: 8/10\n\"Meetings about meetings\" is strong. CTA could be more specific.\n\n### Suggestions (non-blocking)\n1. Trim Scene 2 by 2 seconds, add to Scene 5 (product demo needs breathing room)\n2. CTA: consider \"See it in action\" instead of \"Start your free trial\" — warmer, less salesy" },
    ],
  },
  "T3-L": {
    visual_look: [
      { name: "shot_list.md", type: "document", templateContent: "## Shot List — Demo Video\n\n| Shot | Type | Framing | Movement | Duration | Notes |\n|------|------|---------|----------|----------|-------|\n| S01 | Establishing | Wide split screen | Static | 5s | Hook — chaos vs calm |\n| S02 | Medium | CTO at desk | Slow push in | 7s | Pain point |\n| S03 | Close-up | Multiple screens | Pan L-R | 5s | Overwhelm |\n| S04 | Transition | Screens merging | Dolly forward | 3s | Bridge |\n| S05 | Medium | Product UI | Static with cursor | 10s | Solution demo |\n| S06 | Wide | Dashboard | Slow pull back | 8s | Proof/metrics |\n| S07 | Medium | Customer logos | Slow dissolve | 10s | Social proof |\n| S08 | Static | Logo + URL | None | 5s | CTA |" },
      { name: "color_palette.md", type: "document", templateContent: "## Color Palette — Demo Video\n\n**Chaos side**: Desaturated, cool tones, slight blue-gray cast\n**Clarity side**: Clean whites, brand navy accents, warm highlights\n**Transition**: Gradual warmth increase as chaos resolves\n\n**LUT reference**: Custom — desaturated S-curve for chaos, lifted blacks for clarity\n**Color temperature**: 5600K (neutral) chaos → 6500K (warm) clarity" },
    ],
    storyboard: [
      { name: "storyboard_v1.md", type: "document", templateContent: "## Storyboard — Demo Video v1\n\n### Frame descriptions for image generation\n\n**S01**: Wide 16:9 frame. Split down the middle. Left: cluttered office desk, multiple monitors with spreadsheets, sticky notes, coffee cups. Right: minimal desk, single monitor with clean dashboard, plant. Cinematic lighting. Deep navy color grade left, clean white right.\n\n**S02**: Medium shot. Professional man (45, salt-and-pepper hair, blue shirt) rubbing temples at desk. Multiple screens behind him glowing. Shallow DOF. Cool desaturated color.\n\n**S03**: Close-up pan across 3 monitor screens showing spreadsheets, email inbox (47 unread), Slack with 12 channels. Motion blur on pan edges.\n\n[... frames S04-S08 ...]" },
    ],
  },
  "TL-003": {
    visual_look: [
      { name: "breakdown.md", type: "document", templateContent: "## Production Breakdown — Demo Video\n\n### Assets needed\n| Asset | Type | Source | Status |\n|-------|------|--------|--------|\n| CTO character | AI character | Generate | Pending |\n| Office environment | AI environment | Generate | Pending |\n| Product UI screens | Screen recording | Client provides | Requested |\n| Customer logos | Vector | Client provides | Requested |\n| Brand logo | Vector | On file | Ready |\n\n### Resource estimate\n- Image generations: ~15 (storyboard frames)\n- Video generations: ~8 shots × 2 attempts avg = ~16 generations\n- VO generation: 90 seconds\n- Music generation: 1 track + variants\n- Estimated AI API cost: $35-50" },
    ],
  },
  "T3-003": {
    storyboard: [
      { name: "storyboard_preview_s01.png", type: "image", templateContent: "[MOCK] Storyboard preview image — Shot S01: Split screen establishing shot" },
      { name: "storyboard_preview_s02.png", type: "image", templateContent: "[MOCK] Storyboard preview image — Shot S02: CTO medium shot" },
    ],
    video_gen: [
      { name: "clip_s01_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S01: Split screen establishing, 5 seconds, 1080p" },
      { name: "clip_s02_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S02: CTO medium shot push in, 7 seconds, 1080p" },
      { name: "clip_s03_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S03: Screen close-up pan, 5 seconds, 1080p" },
      { name: "clip_s04_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S04: Merge transition, 3 seconds, 1080p" },
      { name: "clip_s05_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S05: Product UI demo, 10 seconds, 1080p" },
      { name: "clip_s06_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S06: Dashboard wide, 8 seconds, 1080p" },
      { name: "clip_s07_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S07: Customer logos, 10 seconds, 1080p" },
      { name: "clip_s08_v1.mp4", type: "video", templateContent: "[MOCK] Generated video clip — Shot S08: Logo + CTA, 5 seconds, 1080p" },
      { name: "prompt_log.md", type: "document", templateContent: "## Prompt Log — Demo Video\n\n| Shot | Model | Prompt | Result |\n|------|-------|--------|--------|\n| S01 | Runway Gen-4 | Wide 16:9 split screen... | ✅ First attempt |\n| S02 | Kling 2.0 | Medium shot, slow push in... | ✅ First attempt |\n[...]" },
    ],
  },
  "T6-L": {
    edit: [
      { name: "edit_v1.mp4", type: "video", templateContent: "[MOCK] First cut — Demo Video, 90 seconds, all clips assembled with transitions" },
      { name: "timeline_notes_v1.md", type: "document", templateContent: "## Timeline Notes — Demo Video v1\n\n**Total duration**: 1:30\n**Clip count**: 8\n**Flagged clips**: 0\n\n### Cutting decisions\n| Timecode | Decision | Rationale |\n|----------|----------|----------|\n| 0:00-0:05 | Hard cut to split screen | Maximum impact for hook |\n| 0:20-0:23 | Cross-dissolve merge | Smooth chaos→clarity transition |\n| 1:15-1:30 | Slow fade to logo | Emotional resolution |\n\n### Rhythm notes\nPacing accelerates through pain section (quick cuts), slows for solution (longer holds). CTA has breathing room." },
    ],
    polish: [
      { name: "final_v1.mp4", type: "video", templateContent: "[MOCK] Final polished video — Demo Video, 90 seconds, color graded, subtitled" },
      { name: "color_notes_v1.md", type: "document", templateContent: "## Color Notes — Demo Video v1\n\nBasic color matching applied across all 8 clips.\n- Temperature: normalized to 5800K\n- Saturation: ±5% across clips\n- Contrast: S-curve applied uniformly\n\nNo narrative grading (Phase 2)." },
      { name: "gate_submission_g5.md", type: "document", templateContent: "## Gate Submission — G5 — Demo Video v1\n\n**Total duration**: 1:30\n**Version**: v1\n\n### Narrative arc assessment\nThe cut achieves the intended chaos→clarity emotional arc. The hook works, the transition is smooth, and the CTA has appropriate weight.\n\n### Readiness assessment\n**Editor's verdict**: READY FOR REVIEW\nAll technical checks passed. Color matching done. Subtitles synced." },
    ],
  },
  "T5-L": {
    audio: [
      { name: "sonic_palette.md", type: "document", templateContent: "## Sonic Palette — Demo Video\n\n**Music style**: Electronic ambient, building energy arc\n**VO style**: Male, warm authority, conversational pace\n**SFX density**: Moderate — UI sounds for chaos, clean transitions\n\n### Emotional arc\n| Section | Emotion | Music intensity | SFX |\n|---------|---------|-----------------|-----|\n| Hook (0:00-0:05) | Tension | 2/5 | Notification cascade |\n| Pain (0:05-0:20) | Frustration | 3/5 | Keyboard, clicks |\n| Bridge (0:20-0:30) | Hope | 4/5 | Merge whoosh |\n| Solution (0:30-1:15) | Confidence | 4/5 | UI sounds |\n| CTA (1:15-1:30) | Resolution | 3/5 | None |" },
      { name: "vo_full_v1.mp3", type: "audio", templateContent: "[MOCK] Voice-over — Demo Video, 90 seconds, male warm authority" },
      { name: "music_v1.mp3", type: "audio", templateContent: "[MOCK] Background music — Electronic ambient, building, 90 seconds" },
      { name: "sfx_editorial_v1.mp3", type: "audio", templateContent: "[MOCK] Editorial SFX — whooshes, risers, UI sounds" },
      { name: "ambient_v1.mp3", type: "audio", templateContent: "[MOCK] Ambient layer — office atmosphere, subtle room tone" },
      { name: "final_mix_v1.mp3", type: "audio", templateContent: "[MOCK] Final audio mix — all layers combined, -14 LUFS" },
      { name: "audio_handoff.md", type: "document", templateContent: "## Audio Handoff — Demo Video v1\n\n**Tracks delivered**:\n| File | Type | Duration |\n|------|------|----------|\n| vo_full_v1.mp3 | Voice-over | 1:30 |\n| music_v1.mp3 | Background music | 1:30 |\n| sfx_editorial_v1.mp3 | Editorial SFX | 1:30 |\n| ambient_v1.mp3 | Ambient layer | 1:30 |\n| final_mix_v1.mp3 | Final mix | 1:30 |\n\n**Mix levels**: VO -3dB | Music -6dB under VO | SFX -9dB avg\n**Master**: -1dBTP / -14 LUFS\n**Licensing**: All AI-generated, commercial use confirmed" },
    ],
  },
  "T6-003": {
    delivery: [
      { name: "youtube_1080p.mp4", type: "video", templateContent: "[MOCK] YouTube delivery — 1920x1080, H.264, AAC stereo" },
      { name: "instagram_reel_9x16.mp4", type: "video", templateContent: "[MOCK] Instagram Reels — 1080x1920, H.264, 30fps" },
      { name: "linkedin_1080p.mp4", type: "video", templateContent: "[MOCK] LinkedIn — 1920x1080, H.264, AAC stereo" },
      { name: "metadata.json", type: "document", templateContent: JSON.stringify({ project: "Demo Video", delivery_date: new Date().toISOString().split("T")[0], files: [{ filename: "youtube_1080p.mp4", platform: "YouTube", resolution: "1920x1080", codec: "H.264" }, { filename: "instagram_reel_9x16.mp4", platform: "Instagram Reels", resolution: "1080x1920", codec: "H.264" }, { filename: "linkedin_1080p.mp4", platform: "LinkedIn", resolution: "1920x1080", codec: "H.264" }] }, null, 2) },
      { name: "delivery_spec.md", type: "document", templateContent: "## Delivery Package — Demo Video\n\n**Delivery date**: [today]\n**Approved by**: Showrunner (G5)\n\n### Files included\n| Filename | Platform | Resolution | Duration | Size |\n|----------|----------|------------|----------|------|\n| youtube_1080p.mp4 | YouTube | 1920x1080 | 1:30 | ~142MB |\n| instagram_reel_9x16.mp4 | Instagram Reels | 1080x1920 | 1:30 | ~98MB |\n| linkedin_1080p.mp4 | LinkedIn | 1920x1080 | 1:30 | ~142MB |\n\n### Verification\n- [x] All formats encoded\n- [x] All formats verified\n- [x] Metadata complete\n- [x] Folder clean" },
    ],
  },
  "TL-002": {},
  "XF-001": {},
  "TL-001": {},
  "T9-L": {
    model_config: [
      { name: "model_selection_matrix.md", type: "document", templateContent: "## Model Selection Matrix — Demo Video\n\n**Project type**: corporate\n**Visual style**: Clean, minimal, tech\n**Budget**: Mid-range\n\n| Task | Model | Rationale | Cost est. | Fallback |\n|------|-------|-----------|-----------|----------|\n| Video gen | Runway Gen-4 | Best for controlled movement | ~$0.50/shot | Kling 2.0 |\n| Image (storyboard) | Flux Schnell | Fast, consistent | ~$0.02/frame | DALL-E 3 |\n| Voice-over | ElevenLabs | Best quality/consistency | ~$0.30/min | PlayHT |\n| Music | Suno Pro | Commercial license | ~$0.10/track | Udio |\n| SFX | ElevenLabs SFX | Same platform as VO | ~$0.05/effect | — |\n| Text gen | Claude Sonnet 4.5 | Best for scripts | ~$3/1M tok | GPT-4o |\n\n**Total est. AI cost**: $35-50" },
    ],
  },
  "T9-001": {},
  "T9-002": {},
  "T9-003": {},
  "T9-004": {},
  "T9-005": {},
};

// ── Pipeline-generic types ──

/** All possible step names across all pipelines */
export type PipelineStep = string;

/** All possible gate names across all pipelines */
export type PipelineGate = string;
