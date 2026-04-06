# criteria.agency — Real Agent Activation (Video Pipeline)

> Date: April 6, 2026
> Status: Design spec
> Scope: Replace mock agent execution with real AI model calls for all 20 Phase 1 video agents

---

## 1. Context

The video pipeline has 20 agents with skill files, an orchestrator (state machine, gates, 3+3 rule, dispatcher), and a complete DB schema. But every agent runs in mock mode — `executeMockAgent()` returns template artifacts instead of real AI output.

This spec replaces mock execution with real AI generation while keeping the same orchestrator, gates, and pipeline structure untouched.

### Current Mock Flow
```
dispatcher → executeAgent(agentId, projectId, step)
           → executeMockAgent() → template string → save as artifact
```

### Target Real Flow
```
dispatcher → executeAgent(agentId, projectId, step)
           → executeRealAgent()
               → load skill file (system prompt)
               → build context (artifacts + attachments)
               → select model (via catalog)
               → call provider (Claude / Gemini / PiAPI)
               → save real output as artifact
           ↓ (fallback if no API keys configured)
           → executeMockAgent() → template artifacts
```

### AI Model Stack

| Capability | Provider | Models | SDK |
|-----------|----------|--------|-----|
| Text/reasoning | Anthropic | claude-opus-4, claude-sonnet-4, claude-haiku-4 | `@anthropic-ai/sdk` (installed) |
| Text/reasoning | Google | gemini-2.5-pro, gemini-2.5-flash | `@google/genai` |
| Image generation | Google | gemini-imagen-3 | `@google/genai` |
| Video generation | Google | veo-3 | `@google/genai` |
| Video generation | PiAPI | kling-v2, seedance-2.0 | REST API (fetch) |
| Audio (VO/music/SFX) | Google | gemini-2.5-pro (audio output) | `@google/genai` |

---

## 2. Model Provider Layer

### Provider Interface

```typescript
interface ModelProvider {
  id: string;                    // "anthropic" | "gemini" | "piapi"
  type: "text" | "image" | "video" | "audio";

  models: ModelEntry[];

  generate(params: GenerateParams): Promise<GenerateResult>;

  // For async providers (video, image, audio)
  checkJob?(jobId: string): Promise<GenerateResult>;

  getStatus(): Promise<{ available: boolean; error?: string }>;
}

interface ModelEntry {
  id: string;                    // "claude-opus-4", "veo-3", "kling-v2"
  provider: string;              // "anthropic", "gemini", "piapi"
  type: "text" | "image" | "video" | "audio";
  tier: "premium" | "standard" | "fast";
  costPer1k: number;            // estimated USD per 1K tokens/seconds/images
  maxTokens?: number;
  maxDuration?: number;          // seconds, for video/audio
  capabilities: string[];        // ["reasoning", "vision", "code", "multimodal"]
  supportedInputs: string[];     // ["text", "image", "video", "audio", "json"]
}

interface GenerateParams {
  model: string;                 // model ID from catalog
  systemPrompt?: string;
  userPrompt: string;
  attachments?: Attachment[];
  maxTokens?: number;
  temperature?: number;
  outputFormat?: "text" | "json" | "file";
}

interface Attachment {
  type: "image" | "video" | "audio" | "json" | "document";
  name: string;
  mimeType: string;
  filePath: string;              // local path
  artifactId?: string;           // if from a project artifact
}

interface GenerateResult {
  status: "completed" | "processing" | "failed";
  jobId?: string;                // for async polling
  output?: {
    text?: string;
    fileUrl?: string;            // remote URL (temporary)
    filePath?: string;           // local path after download
    metadata?: Record<string, any>;
  };
  cost?: {
    inputTokens?: number;
    outputTokens?: number;
    credits?: number;
    estimatedUsd?: number;
  };
  error?: string;
}
```

### Model Catalog

```typescript
const MODEL_CATALOG: ModelEntry[] = [
  // ── Text ──
  {
    id: "claude-opus-4",
    provider: "anthropic",
    type: "text",
    tier: "premium",
    costPer1k: 0.015,
    maxTokens: 32000,
    capabilities: ["reasoning", "vision", "code", "evaluation"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "claude-sonnet-4",
    provider: "anthropic",
    type: "text",
    tier: "standard",
    costPer1k: 0.003,
    maxTokens: 16000,
    capabilities: ["reasoning", "vision", "code", "creative"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "claude-haiku-4",
    provider: "anthropic",
    type: "text",
    tier: "fast",
    costPer1k: 0.00025,
    maxTokens: 8000,
    capabilities: ["classification", "extraction", "simple_reasoning"],
    supportedInputs: ["text", "image", "json"],
  },
  {
    id: "gemini-2.5-pro",
    provider: "gemini",
    type: "text",
    tier: "premium",
    costPer1k: 0.01,
    maxTokens: 65000,
    capabilities: ["reasoning", "vision", "code", "multimodal", "long_context"],
    supportedInputs: ["text", "image", "video", "audio", "json"],
  },
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    type: "text",
    tier: "fast",
    costPer1k: 0.0005,
    maxTokens: 16000,
    capabilities: ["reasoning", "classification", "multimodal"],
    supportedInputs: ["text", "image", "video", "audio", "json"],
  },

  // ── Image ──
  {
    id: "gemini-imagen-3",
    provider: "gemini",
    type: "image",
    tier: "standard",
    costPer1k: 0.04,
    capabilities: ["photorealistic", "illustration", "text_rendering"],
    supportedInputs: ["text", "image"],
  },

  // ── Video ──
  {
    id: "veo-3",
    provider: "gemini",
    type: "video",
    tier: "premium",
    costPer1k: 0.50,
    maxDuration: 8,
    capabilities: ["high_quality", "camera_control", "complex_motion", "audio_generation"],
    supportedInputs: ["text", "image"],
  },
  {
    id: "kling-v2",
    provider: "piapi",
    type: "video",
    tier: "standard",
    costPer1k: 0.30,
    maxDuration: 10,
    capabilities: ["motion", "lip_sync", "image_to_video"],
    supportedInputs: ["text", "image"],
  },
  {
    id: "seedance-2.0",
    provider: "piapi",
    type: "video",
    tier: "premium",
    costPer1k: 0.40,
    maxDuration: 8,
    capabilities: ["character_motion", "dance", "action", "image_to_video"],
    supportedInputs: ["text", "image"],
  },

  // ── Audio ──
  {
    id: "gemini-2.5-pro-audio",
    provider: "gemini",
    type: "audio",
    tier: "standard",
    costPer1k: 0.02,
    maxDuration: 120,
    capabilities: ["voice", "music", "sfx", "tts"],
    supportedInputs: ["text", "audio"],
  },
];
```

The catalog is defined in code but the Team 9 Model Director can override per-project via the `modelConfigs` table (which already exists in the DB).

---

## 3. Provider Implementations

### 3.1 AnthropicProvider (text)

File: `src/providers/anthropic.ts`

- Uses `@anthropic-ai/sdk` (already installed)
- Wraps the existing `src/services/claude.ts` pattern but with full `Attachment` support
- For image attachments: converts to base64, sends inline (Claude supports vision)
- For video/audio attachments: NOT supported — context builder must convert to keyframes/transcript before passing
- Synchronous — response returns immediately

### 3.2 GeminiProvider (text + image + video + audio)

File: `src/providers/gemini.ts`

- Uses `@google/genai` SDK
- Single provider handles all 4 types (Gemini is natively multimodal)
- For text: `generateContent()` with text + inline media
- For image: `generateImages()` via Imagen 3 model
- For video: `generateContent()` via Veo 3 — returns operation ID, poll with `getOperation()`
- For audio: `generateContent()` with audio output modality
- Supports ALL attachment types natively (text, image, video, audio, json as text)
- Video/image generation is async — returns jobId, polled via `checkJob()`

### 3.3 PiAPIProvider (video only)

File: `src/providers/piapi.ts`

- REST API calls via fetch (no SDK needed)
- Base URL: `https://api.piapi.ai/api/v1/`
- Supports Kling v2 and Seedance 2.0
- Input: text prompt + optional reference image
- Always async — submit job, poll for completion
- Response includes video URL — download to local storage

### 3.4 MockProvider (all types, fallback)

File: `src/providers/mock.ts`

- Returns template content when no API keys configured
- Same mock behavior as current `executeMockAgent()` but through the provider interface
- Activated per-provider when its API key is empty
- Allows partial real execution: Claude real + video mock, for example

---

## 4. Agent Context Builder

File: `src/agents/context-builder.ts`

### Purpose

Builds the complete prompt (system + user + attachments) for each agent based on their role and the project's current state.

### Context Map

Defines what each agent needs as input per pipeline step:

```typescript
const AGENT_CONTEXT_MAP: Record<string, {
  artifactSteps: string[];     // which artifact steps to load
  attachmentTypes: string[];   // which file types to include
  taskInstruction: string;     // what to tell the agent to do
}> = {
  // ── Brief ──
  "T7-L:brief": {
    artifactSteps: [],
    attachmentTypes: [],
    taskInstruction: "Create an onboarding record and communication plan for this new client project.",
  },
  "T1-L:brief": {
    artifactSteps: [],
    attachmentTypes: ["image"],  // client reference images if uploaded
    taskInstruction: "Guide the brief enrichment process. Ask clarifying questions and produce an enriched brief document.",
  },

  // ── Concept ──
  "T1-L:concept": {
    artifactSteps: ["brief"],
    attachmentTypes: ["image"],
    taskInstruction: "Develop 2-3 creative concepts based on the enriched brief. Include mood, tone, visual direction, and narrative approach for each.",
  },

  // ── Script ──
  "T2-L:script": {
    artifactSteps: ["brief", "concept"],
    attachmentTypes: ["json"],
    taskInstruction: "Classify this project type, create a beat sheet, and prepare an assignment brief for the AV Copywriter.",
  },
  "T2-002:script": {
    artifactSteps: ["brief", "concept", "script"],  // loads T2-L's beat sheet
    attachmentTypes: [],
    taskInstruction: "Write a two-column AV script (audio | video) following the beat sheet and creative direction.",
  },
  "T2-006:script": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: [],
    taskInstruction: "Review this script using your 7 diagnostic lenses. Produce an improvement report with severity-graded findings.",
  },

  // ── Visual Look ──
  "T3-L:visual_look": {
    artifactSteps: ["brief", "concept", "script"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Define the visual language: framing, lens choices, lighting style, color palette, and movement vocabulary for each scene.",
  },
  "TL-003:visual_look": {
    artifactSteps: ["script"],
    attachmentTypes: ["json"],
    taskInstruction: "Create a complete script breakdown: scenes, locations, characters, props, wardrobe, and production requirements.",
  },

  // ── Storyboard ──
  "T3-L:storyboard": {
    artifactSteps: ["script", "visual_look"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Create detailed shot specs for each scene: composition, camera angle, movement, lighting, and subject placement.",
  },
  "T3-003:storyboard": {
    artifactSteps: ["script", "visual_look", "storyboard"],  // T3-L's shot specs
    attachmentTypes: ["image", "json"],
    taskInstruction: "Generate storyboard preview images for each shot using the shot specs. Use the image generation model.",
  },

  // ── Video Generation ──
  "T3-003:video_gen": {
    artifactSteps: ["script", "visual_look", "storyboard"],
    attachmentTypes: ["image", "json"],
    taskInstruction: "Generate video clips for each shot in the storyboard. Translate shot specs into optimized prompts for the video model.",
  },

  // ── Edit ──
  "T6-L:edit": {
    artifactSteps: ["script", "storyboard", "video_gen"],
    attachmentTypes: ["video", "audio", "image", "json"],
    taskInstruction: "Assemble the first cut: sequence clips following the storyboard order, define cutting rhythm, note any shots that need regeneration.",
  },

  // ── Audio ──
  "T5-L:audio": {
    artifactSteps: ["script", "concept", "edit"],
    attachmentTypes: ["video", "json"],
    taskInstruction: "Define sonic palette, generate voiceover segments, compose music, create SFX, and produce the final audio mix synced to the edit.",
  },

  // ── Polish ──
  "T6-L:polish": {
    artifactSteps: ["script", "edit", "audio"],
    attachmentTypes: ["video", "audio", "json"],
    taskInstruction: "Apply final polish: color correction, audio sync, transitions, and subtitles if needed. Prepare for final gate review.",
  },

  // ── Delivery ──
  "T6-003:delivery": {
    artifactSteps: ["polish"],
    attachmentTypes: ["video", "json"],
    taskInstruction: "Encode the final video for all required delivery platforms. Generate thumbnails and delivery metadata.",
  },
  "T7-L:delivery": {
    artifactSteps: ["polish", "delivery"],
    attachmentTypes: ["json"],
    taskInstruction: "Prepare the client delivery package. Generate delivery notification and publish to the review portal.",
  },

  // ── Gate Evaluators ──
  "TL-002:gate": {
    artifactSteps: ["brief", "concept", "script", "visual_look", "storyboard", "video_gen", "edit", "audio", "polish"],
    attachmentTypes: ["image", "video", "audio", "json"],
    taskInstruction: "Evaluate this gate. Review all artifacts produced so far. Score 1-10 on relevant dimensions. Issue PASS or FAIL with detailed notes.",
  },
  "XF-001:gate": {
    artifactSteps: ["visual_look", "storyboard", "video_gen", "edit", "polish"],
    attachmentTypes: ["image", "video", "json"],
    taskInstruction: "Evaluate cinematographic quality. Score each shot on composition, lighting, movement, and narrative coherence (1-10). Issue veto if any dimension ≤3 or overall <6.",
  },

  // ── Model Intelligence ──
  "T9-L:model_config": {
    artifactSteps: ["brief", "concept"],
    attachmentTypes: ["json"],
    taskInstruction: "Create a model selection matrix for this project. Recommend specific models for text, image, video, and audio tasks based on project requirements and budget.",
  },
};
```

### Context Builder Function

```typescript
async function buildAgentContext(
  agentId: string,
  projectId: string,
  step: string,
  providerId: string,
): Promise<{
  systemPrompt: string;
  userPrompt: string;
  attachments: Attachment[];
}>
```

Logic:
1. Load agent skill file from `agents/{agentId}_*.md` → `systemPrompt`
2. Look up `AGENT_CONTEXT_MAP[agentId:step]` (or `agentId:gate` for gate evaluators)
3. Query artifacts from DB for `projectId` filtering by `artifactSteps`
4. For each artifact: read content from filesystem
5. Assemble text artifacts into `userPrompt` sections
6. Collect file artifacts (image/video/audio/json) as `attachments`
7. Check provider's `supportedInputs` — for unsupported types:
   - Video → extract keyframes (first/middle/last frame as images)
   - Audio → describe as "[Audio track: {name}, {duration}s]" in text
   - If provider supports none of these, include only text description
8. Prepend task instruction to `userPrompt`
9. Return `{ systemPrompt, userPrompt, attachments }`

---

## 5. Agent Runtime (Real Execution)

File: `src/agents/runtime.ts` (modify existing)

### executeRealAgent

```typescript
async function executeRealAgent(
  agentId: string,
  projectId: string,
  step: string,
): Promise<AgentExecutionResult>
```

Flow:
1. Determine output type for this agent+step from `AGENT_OUTPUT_TYPES` map:
   - Text agents → "text" provider
   - T3-003 at storyboard step → "image" provider
   - T3-003 at video_gen step → "video" provider
   - T5-L → "audio" provider
   - T6-L, T6-003 → "text" (they produce edit decisions/notes, not actual video editing)

2. Get model recommendation:
   - Check `modelConfigs` table for this project+taskType
   - If no recommendation: use default from `MODEL_DEFAULTS` (per agent tier)

3. Select provider from registry by model ID

4. Build context via `buildAgentContext(agentId, projectId, step, provider.id)`

5. Call `provider.generate({ model, systemPrompt, userPrompt, attachments })`

6. Handle async if needed:
   ```
   if result.status === "processing":
     poll provider.checkJob(result.jobId) every 10s
     timeout: image=2min, video=10min, audio=5min
     on timeout: fail execution
   ```

7. Save output:
   - Text → save as `.md` artifact
   - Image → download to `storage/projects/{id}/{step}/`, save as artifact
   - Video → download, save as artifact
   - Audio → download, save as artifact

8. Record execution in `agentExecutions` table with real cost data

9. Return `{ agentId, step, artifactIds, success, cost }`

### Default Model Selection

When Team 9 hasn't made a recommendation yet:

```typescript
const MODEL_DEFAULTS: Record<string, string> = {
  // Text agents — by role complexity
  "TL-002": "claude-opus-4",          // Showrunner: complex evaluation
  "XF-001": "claude-opus-4",          // Critic: complex evaluation
  "T1-L": "claude-sonnet-4",          // Creative Director: creative generation
  "T2-L": "claude-sonnet-4",          // Head Writer: creative direction
  "T2-002": "claude-sonnet-4",        // AV Copywriter: creative writing
  "T2-006": "claude-sonnet-4",        // Script Doctor: analysis
  "T7-L": "claude-sonnet-4",          // Client Service: communication
  "TL-001": "claude-sonnet-4",        // Project Manager: planning
  "TL-003": "claude-sonnet-4",        // Producer: breakdown

  // Image generation
  "T3-003:storyboard": "gemini-imagen-3",

  // Video generation
  "T3-003:video_gen": "veo-3",

  // Audio generation
  "T5-L": "gemini-2.5-pro-audio",

  // Model intelligence — uses fast model for catalog lookups
  "T9-L": "gemini-2.5-flash",
  "T9-001": "gemini-2.5-flash",
  "T9-002": "gemini-2.5-flash",
  "T9-003": "gemini-2.5-flash",
  "T9-004": "gemini-2.5-flash",
  "T9-005": "gemini-2.5-flash",
};
```

### Fallback to Mock

If the selected provider has no API key configured:
1. Log warning: `[AGENT] No API key for provider {id}, falling back to mock`
2. Call `executeMockAgent()` (existing behavior)
3. Record in `agentExecutions` with `{ mockMode: true }` in cost field

This allows partial real execution: text agents real + video mock, for example.

---

## 6. Async Job Management

### Polling Strategy

For async providers (Gemini image/video, PiAPI video):

```typescript
async function pollUntilComplete(
  provider: ModelProvider,
  jobId: string,
  timeoutMs: number,
  intervalMs: number = 10000,
): Promise<GenerateResult>
```

- Poll every `intervalMs` (default 10s)
- Timeout per type: image=120000ms, video=600000ms, audio=300000ms
- On each poll: update `agentExecutions` table with status
- On completion: download output file to local storage
- On failure: return error, let 3+3 rule handle retry
- On timeout: fail execution, log warning

### File Download

When async generation completes, the provider returns a temporary URL:

1. Download file via fetch to `storage/projects/{projectId}/{step}/{filename}`
2. Create artifact record in DB with `storagePath`
3. Delete temporary URL reference (it expires)

---

## 7. New Dependencies

| Package | For |
|---------|-----|
| `@google/genai` | Gemini text, image (Imagen 3), video (Veo 3), audio |

PiAPI uses raw `fetch` — no SDK needed.

---

## 8. New Environment Variables

```
# Google AI (Gemini, Imagen, Veo)
GOOGLE_AI_API_KEY=

# PiAPI (Kling, Seedance)
PIAPI_API_KEY=
```

---

## 9. Files to Create

| File | Purpose |
|------|---------|
| `src/providers/types.ts` | ModelProvider, ModelEntry, GenerateParams, GenerateResult, Attachment interfaces |
| `src/providers/catalog.ts` | MODEL_CATALOG array + helper functions |
| `src/providers/registry.ts` | Provider registry — maps model ID to provider instance |
| `src/providers/anthropic.ts` | Anthropic provider (Claude models) |
| `src/providers/gemini.ts` | Gemini provider (text, image, video, audio) |
| `src/providers/piapi.ts` | PiAPI provider (Kling, Seedance) |
| `src/providers/mock.ts` | Mock provider (fallback) |
| `src/agents/context-builder.ts` | Build agent prompts from skill files + project artifacts |
| `src/agents/context-map.ts` | AGENT_CONTEXT_MAP + AGENT_OUTPUT_TYPES definitions |
| `src/agents/model-defaults.ts` | MODEL_DEFAULTS per agent |
| `src/agents/job-poller.ts` | Async job polling utility |

## 10. Files to Modify

| File | Changes |
|------|---------|
| `src/agents/runtime.ts` | Add `executeRealAgent()`, modify `executeAgent()` to try real first, fallback to mock |
| `src/shared/config.ts` | Add `googleAiApiKey`, `piapiApiKey` |
| `package.json` | Add `@google/genai` |
| `.env` | Add `GOOGLE_AI_API_KEY`, `PIAPI_API_KEY` |

---

## 11. What Is NOT In This Spec

- Video editing/compositing (T6-L produces edit decisions as text, actual video assembly is future)
- Real-time streaming of generation progress to client
- Cost budgeting per project (Financial Agent scope, future)
- New agent skill files — existing 20 skill files are used as-is
- Changes to orchestrator, gates, dispatcher, or 3+3 rule
- Changes to the database schema (existing tables sufficient)
- Admin UI for model management (future)

---

## 12. Verification

1. **Text agent real execution**: Create project, advance to `concept` step → T1-L produces real creative concept via Claude Sonnet (not template)
2. **Gate evaluation real**: Advance to G2 → TL-002 produces real evaluation with actual scores and reasoning
3. **Image generation**: Advance to `storyboard` → T3-003 generates real storyboard images via Gemini Imagen
4. **Video generation**: Advance to `video_gen` → T3-003 generates real video clips via Veo 3 (async polling)
5. **Audio generation**: Advance to `audio` → T5-L generates real VO/music via Gemini
6. **Mock fallback**: Remove an API key → that provider falls back to mock, others stay real
7. **Context building**: Verify T2-002 receives brief + concept in prompt (not just task instruction)
8. **Multimodal input**: Verify XF-001 Critic receives video clips as attachments when evaluating at G4
9. **Cost tracking**: Check `agentExecutions` records have real token/credit costs
10. **Full pipeline**: Run entire pipeline brief→delivery → produces real video with real audio

---

## Related Documents

- `AGENT_REGISTRY.md` — All 47 agent reference cards
- `TEAM_STRUCTURE.md` — Team hierarchy, communication protocols
- `PRODUCTION_PIPELINE.md` — 10 steps, 5 gates
- `docs/superpowers/specs/2026-04-06-business-agents-design.md` — Claude client pattern (reuse)
- `src/agents/registry.ts` — Agent registry with skill file paths
- `src/orchestrator/state-machine.ts` — Pipeline flow (unchanged)
- `src/orchestrator/dispatcher.ts` — Agent dispatch (unchanged)
