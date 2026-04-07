# Audio Motor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Audio Motor (C-013) — register pipeline, create 5 agent skill files, add audio-specs directive, wire up context maps, update DB schema, and migrate T5-L from the video pipeline to the Audio Motor.

**Architecture:** Adds an `audio` pipeline to the existing PipelineRegistry with 5 steps and 2 gates. Creates 5 agents (AU-L through AU-004). AU-L evolves from T5-L (Sonorizador). Video Production invokes the Audio Motor as a sub-project via `parentProjectId` when it reaches the `audio` step.

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Hono

**Spec:** `docs/superpowers/specs/2026-04-07-audio-motor-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `agents/AU-L_sound_director.md` | Sound Director skill file (leader, evolves from T5-L) |
| `agents/AU-001_sound_designer.md` | Sound Designer & SFX skill file |
| `agents/AU-002_music_producer.md` | Music Producer skill file |
| `agents/AU-003_voice_director.md` | Voice Director skill file |
| `agents/AU-004_mix_engineer.md` | Mix Engineer skill file |
| `agents/_shared/audio-specs.md` | Audio technical specifications directive |

### Modified files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add AU steps to enums |
| `src/orchestrator/pipeline-registry.ts` | Add `audio` pipeline definition |
| `src/agents/registry.ts` | Add 5 new agent entries |
| `src/agents/model-defaults.ts` | Add model assignments for 5 agents |
| `src/agents/context-map.ts` | Add 7 context map entries for audio pipeline |
| `src/agents/context-builder.ts` | Add `audio` to `PIPELINE_DIRECTIVES` |

---

### Task 1: Add Audio steps to DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add AU steps to projectStatusEnum**

Add after the `// Writers Room` section (or after Graphic Design if WR not yet added):

```typescript
  // Audio
  "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
```

- [ ] **Step 2: Add AU steps to artifactStepEnum**

```typescript
  // Audio
  "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
```

- [ ] **Step 3: Add AU gates to gateTypeEnum**

```typescript
  "au-g1", "au-g2",
```

- [ ] **Step 4: Generate and apply the DB migration**

Run: `npm run db:generate && npm run db:migrate`
Expected: New migration adding AU enum values. No errors.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(audio): add AU steps and gates to DB schema enums"
```

---

### Task 2: Register audio pipeline in PipelineRegistry

**Files:**
- Modify: `src/orchestrator/pipeline-registry.ts`

- [ ] **Step 1: Add pipeline definition**

Append after the Writers Room pipeline registration block:

```typescript
// ── Audio Pipeline ──
// Independent audio production. Also invoked by Video Production as sub-project.

PipelineRegistry.register({
  type: "audio",
  steps: [
    "au_brief", "au_sound_design", "au_production", "au_mix_master", "au_delivery",
  ],
  stepAgents: {
    au_brief: ["AU-L"],
    au_sound_design: ["AU-001"],
    au_production: ["AU-L", "AU-002", "AU-003"],
    au_mix_master: ["AU-004"],
    au_delivery: ["AU-L"],
  },
  gates: {
    "au-g1": {
      afterStep: "au_sound_design",
      evaluators: ["AU-L"],
      maxIterations: 3,
      failReturnTo: "au_sound_design",
    },
    "au-g2": {
      afterStep: "au_production",
      evaluators: ["AU-L", "XA-003"],
      maxIterations: 3,
      failReturnTo: "au_production",
    },
  },
});
```

- [ ] **Step 2: Verify registration**

Run: `npx tsx -e "import './src/orchestrator/pipeline-registry.js'; import { PipelineRegistry } from './src/orchestrator/pipeline-registry.js'; console.log(PipelineRegistry.getSteps('audio'));"`

Expected:
```
[ 'au_brief', 'au_sound_design', 'au_production', 'au_mix_master', 'au_delivery' ]
```

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator/pipeline-registry.ts
git commit -m "feat(audio): register audio pipeline with 5 steps and 2 gates"
```

---

### Task 3: Register 5 agents in agent registry

**Files:**
- Modify: `src/agents/registry.ts`

- [ ] **Step 1: Add Audio Motor agents**

Append after the Writers Room agents (or after CW-001 if WR not yet added):

```typescript
  // ── Audio Motor ──
  "AU-L": { id: "AU-L", name: "Sound Director", skillFile: "agents/AU-L_sound_director.md", team: 17, level: "leader", steps: ["au_brief", "au_delivery"] as any, gates: ["au-g1", "au-g2"] as any, autonomy: 75 },
  "AU-001": { id: "AU-001", name: "Sound Designer & SFX", skillFile: "agents/AU-001_sound_designer.md", team: 17, level: "sub", steps: ["au_sound_design"] as any, gates: [], autonomy: 75 },
  "AU-002": { id: "AU-002", name: "Music Producer", skillFile: "agents/AU-002_music_producer.md", team: 17, level: "sub", steps: ["au_production"] as any, gates: [], autonomy: 70 },
  "AU-003": { id: "AU-003", name: "Voice Director", skillFile: "agents/AU-003_voice_director.md", team: 17, level: "sub", steps: ["au_production"] as any, gates: [], autonomy: 70 },
  "AU-004": { id: "AU-004", name: "Mix Engineer", skillFile: "agents/AU-004_mix_engineer.md", team: 17, level: "sub", steps: ["au_mix_master"] as any, gates: [], autonomy: 80 },
```

- [ ] **Step 2: Update XA-003 gates to include au-g2**

```typescript
  "XA-003": { id: "XA-003", name: "Brand Guardian", skillFile: "agents/XA-003_brand_guardian.md", team: 13, level: "cross_functional", steps: [], gates: ["bb-g2", "st-g2", "gd-g1", "gd-g2", "wr-g2", "au-g2"] as any, autonomy: 80 },
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(audio): register 5 AU agents and update XA-003 gates"
```

---

### Task 4: Add model defaults for 5 agents

**Files:**
- Modify: `src/agents/model-defaults.ts`

- [ ] **Step 1: Add model assignments**

```typescript
  // Audio Motor
  "AU-L": "claude-sonnet-4",
  "AU-001": "gemini-2.5-pro-audio",
  "AU-002": "gemini-2.5-pro-audio",
  "AU-003": "gemini-2.5-pro-audio",
  "AU-004": "gemini-2.5-flash",
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/model-defaults.ts
git commit -m "feat(audio): add model defaults for 5 AU agents"
```

---

### Task 5: Add context map entries for audio pipeline

**Files:**
- Modify: `src/agents/context-map.ts`

- [ ] **Step 1: Add AU context map entries**

```typescript
  // ── Audio Pipeline ──

  "AU-L:au_brief": {
    artifactSteps: [],
    attachmentTypes: ["json", "audio"],
    taskInstruction:
      "Interpret the audio brief. Define: type (podcast/jingle/voiceover/soundtrack/sonic_branding/sfx_pack/video_audio), concept sonoro, agents needed, technical specs (duration, channel, loudness target). If parentProjectId points to a video project, load the script and storyboard for timing reference. Output as JSON: {type, concept, duration, channel, agents_needed, specs}.",
  },
  "AU-001:au_sound_design": {
    artifactSteps: ["au_brief"],
    attachmentTypes: ["audio", "text"],
    taskInstruction:
      "Design the sound landscape: select/create SFX, foley digital, ambiences, transitions. For SFX packs, categorize as: hits, whooshes, transitions, ambience, UI sounds. For video/soundtrack, design the sonic palette that complements the visual mood. Deliver as categorized audio pack with naming convention: {category}_{description}_{number}.wav.",
  },
  "AU-002:au_production": {
    artifactSteps: ["au_brief", "au_sound_design"],
    attachmentTypes: ["audio", "text"],
    taskInstruction:
      "Produce musical elements: composition, selection, arrangement. For jingles: create a memorable melodic hook in the brand's sonic identity. For soundtracks: compose or select music that matches the mood board from sound_design. Deliver stems separated (melody, harmony, bass, drums, pads) for mixing flexibility.",
  },
  "AU-003:au_production": {
    artifactSteps: ["au_brief", "au_sound_design"],
    attachmentTypes: ["audio", "text"],
    taskInstruction:
      "Direct and generate voiceover: select voice type (gender, age, tone, language), generate TTS with appropriate pacing and emotion, include pronunciation notes for brand names or technical terms. For podcasts: produce intro/outro/bumpers. Deliver VO as isolated track with cue sheet timing.",
  },
  "AU-004:au_mix_master": {
    artifactSteps: ["au_brief", "au_sound_design", "au_production"],
    attachmentTypes: ["audio"],
    taskInstruction:
      "Mix all audio elements (music, VO, SFX, ambience) into the final output. Master according to channel specs from audio-specs.md: broadcast (-24 LUFS), streaming (-14 LUFS), web (-16 LUFS), social (-14 LUFS), event (-20 LUFS). Deliver in required formats (WAV, MP3, AAC) with loudness normalization per target channel.",
  },
  "AU-L:au_delivery": {
    artifactSteps: ["au_brief", "au_mix_master"],
    attachmentTypes: ["audio", "text"],
    taskInstruction:
      "Final quality review. Verify: technical specs match channel requirements (sample rate, bit depth, loudness), audio quality is professional, brand sonic identity is respected. Compile deliverables in all requested formats. Generate delivery manifest listing all files with specs.",
  },
  "AU-L:gate": {
    artifactSteps: ["au_brief", "au_sound_design", "au_production"],
    attachmentTypes: ["audio"],
    taskInstruction:
      "Evaluate this gate. For au-g1 (post-sound_design): Does the sonic concept match the brief? Are SFX appropriate? Is the palette coherent? For au-g2 (post-production): Is audio quality professional? Does it match brand sonic identity? Are specs met? Score 1-10. PASS ≥ 7.",
  },
```

- [ ] **Step 2: Add AU output types**

```typescript
  // Audio Motor
  "AU-L:au_brief": "text",
  "AU-001:au_sound_design": "audio",
  "AU-002:au_production": "audio",
  "AU-003:au_production": "audio",
  "AU-004:au_mix_master": "audio",
  "AU-L:au_delivery": "audio",
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/context-map.ts
git commit -m "feat(audio): add 7 context map entries for audio pipeline"
```

---

### Task 6: Add audio-specs directive

**Files:**
- Create: `agents/_shared/audio-specs.md`
- Modify: `src/agents/context-builder.ts`

- [ ] **Step 1: Create the audio-specs directive**

```markdown
# Audio Technical Specifications — Audio Motor Directive

## Channel Loudness Targets

| Channel | Sample Rate | Bit Depth | Format | Loudness (LUFS) | True Peak |
|---------|------------|-----------|--------|-----------------|-----------|
| Broadcast (TV/Radio) | 48kHz | 24-bit | WAV | -24 LUFS | -2 dBTP |
| Streaming (Spotify, podcast) | 44.1kHz | 16-bit | MP3 320kbps / WAV | -14 LUFS | -1 dBTP |
| Web (video online) | 48kHz | 16-bit | AAC / MP3 | -16 LUFS | -1 dBTP |
| Social media | 44.1kHz | 16-bit | AAC / MP3 | -14 LUFS | -1 dBTP |
| Event (live) | 48kHz | 24-bit | WAV | -20 LUFS | -2 dBTP |

## File Naming Convention

```
{project_id}_{type}_{description}_{version}.{ext}
```

Examples:
- `proj123_sfx_whoosh-cinematic_v1.wav`
- `proj123_music_hero-theme_v2.mp3`
- `proj123_vo_narrator-es_v1.wav`

## SFX Categories

| Category | Description | Typical Use |
|----------|------------|-------------|
| hits | Impact sounds, stingers, accents | Transitions, emphasis |
| whooshes | Movement, swipe, flyby | Scene transitions, motion graphics |
| transitions | Risers, drops, sweeps | Between scenes/sections |
| ambience | Room tone, nature, city, crowd | Background atmosphere |
| ui | Clicks, notifications, confirms | App/web interactions |
| foley | Footsteps, cloth, props | Realistic sound design |
| musical | Stingers, bumpers, jingles | Branding, section breaks |

## Delivery Formats

| Use Case | Primary Format | Secondary Format |
|----------|---------------|-----------------|
| Master / Archive | WAV 48kHz/24-bit | FLAC |
| Web / Social | MP3 320kbps | AAC 256kbps |
| Podcast | MP3 192kbps (mono) | WAV 44.1kHz/16-bit |
| Broadcast | WAV 48kHz/24-bit | — |

## Quality Standards

1. No clipping — true peak must not exceed -1 dBTP (broadcast: -2 dBTP)
2. No audible artifacts (clicks, pops, hum, distortion)
3. Proper fade in/out on all clips (minimum 10ms)
4. Silence trimmed to max 0.5s at start, 1s at end
5. Stereo field: centered VO, music and SFX may use full width
```

- [ ] **Step 2: Add `audio` to PIPELINE_DIRECTIVES**

```typescript
const PIPELINE_DIRECTIVES: Record<string, string[]> = {
  strategist: ["agents/_shared/harvard-frameworks.md"],
  "graphic-design": ["agents/_shared/design-constraints.md"],
  "writers-room": ["agents/_shared/writing-guidelines.md"],
  audio: ["agents/_shared/audio-specs.md"],
};
```

- [ ] **Step 3: Commit**

```bash
git add agents/_shared/audio-specs.md src/agents/context-builder.ts
git commit -m "feat(audio): add audio-specs directive and wire into context-builder"
```

---

### Task 7: Create AU-L through AU-004 skill files

**Files:**
- Create: `agents/AU-L_sound_director.md`
- Create: `agents/AU-001_sound_designer.md`
- Create: `agents/AU-002_music_producer.md`
- Create: `agents/AU-003_voice_director.md`
- Create: `agents/AU-004_mix_engineer.md`

- [ ] **Step 1: Create AU-L Sound Director**

```markdown
---
name: Sound Director
description: Leader of the Audio Motor. Interprets audio briefs, defines sonic concepts, directs production, approves final mix. Evolved from T5-L Sonorizador.
id: AU-L
team: 17. Audio Motor
level: Leader
autonomy: 75%
phase: 2
---

# Identity

You are the **Sound Director** — the creative and technical leader of all audio production at criteria.agency. You define how brands sound: their sonic identity, their voice, their musical personality.

# Role in Pipeline

## au_brief
- Interpret audio brief (standalone or from Video Production via parentProjectId)
- Define sonic concept: mood, energy, palette, reference tracks
- Determine which agents are needed based on project type
- If parent is video: load script and storyboard for timing reference

## au_delivery
- Final quality review of mixed/mastered audio
- Verify technical specs match channel requirements
- Compile delivery manifest

## Gates

### au-g1 (after sound_design)
- Is the sonic concept coherent with the brief?
- Are SFX appropriate and high quality?
- Score 1-10. PASS ≥ 7.

### au-g2 (after production) — with Brand Guardian
- Professional audio quality?
- Brand sonic identity respected?
- Technical specs met?
- Score 1-10. PASS ≥ 7.

# Rules

1. Always start with the brief — understand the emotion before the technique
2. When working on video audio, sync to the edit timeline precisely
3. For sonic branding, ensure the audio identity is as distinctive as the visual identity
4. Provide specific, actionable feedback at gates
```

- [ ] **Step 2: Create AU-001 Sound Designer**

```markdown
---
name: Sound Designer & SFX
description: Designs soundscapes, creates/selects SFX, foley, ambiences, and transitions. Delivers categorized audio packs.
id: AU-001
team: 17. Audio Motor
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **Sound Designer** — you build the sonic world. From subtle ambience to dramatic impact sounds, you craft every non-musical, non-vocal audio element.

# Role in Pipeline

## au_sound_design
- Design the sonic palette: select SFX libraries, create custom sounds
- Build ambiences and atmospheres
- Create transitions, risers, hits, and stingers
- For SFX packs: organize by category (hits, whooshes, transitions, ambience, ui, foley, musical)
- Follow naming convention from audio-specs.md

# Rules

1. Every sound must serve the story or message — no decoration
2. Deliver all SFX as individual files, properly named and categorized
3. Include a manifest listing all sounds with descriptions and suggested use
4. For video: sync transition sounds to edit points
```

- [ ] **Step 3: Create AU-002 Music Producer**

```markdown
---
name: Music Producer
description: Selects or composes music — jingles, soundtracks, underscoring, musical branding. Delivers stems for mixing.
id: AU-002
team: 17. Audio Motor
level: Sub
autonomy: 70%
phase: 2
---

# Identity

You are the **Music Producer** — you create the emotional foundation of audio projects. Whether composing original jingles or curating the perfect soundtrack, you make brands memorable through music.

# Role in Pipeline

## au_production (type=music/jingle/soundtrack)
- Compose or select music that matches the sonic concept
- For jingles: create a memorable melodic hook (3-8 seconds)
- For soundtracks: compose or curate music matching visual mood
- Deliver stems separated: melody, harmony, bass, drums, pads

# Rules

1. Stems must be perfectly synchronized and individually usable
2. Jingles must be memorable after a single listen
3. Music must not compete with voiceover — leave frequency space for VO
4. Always provide at least 2 musical direction options for the Sound Director to choose
```

- [ ] **Step 4: Create AU-003 Voice Director**

```markdown
---
name: Voice Director
description: Selects voice type, directs voiceover delivery, generates TTS. Handles narration for all audio formats.
id: AU-003
team: 17. Audio Motor
level: Sub
autonomy: 70%
phase: 2
---

# Identity

You are the **Voice Director** — you give brands their voice. You select the right vocal type, direct the delivery, and ensure every spoken word connects with the audience.

# Role in Pipeline

## au_production (type=voiceover/podcast)
- Select voice: gender, age, tone, accent, language
- Generate TTS with appropriate pacing, emotion, and emphasis
- Include pronunciation guide for brand names and technical terms
- For podcasts: produce intro/outro/bumper segments
- Deliver VO as isolated track with cue sheet

# Rules

1. Voice selection must match brand personality (casual ≠ corporate)
2. Pacing must match the visual edit timeline when working on video
3. Include a cue sheet with timing marks for the Mix Engineer
4. For multilingual projects, ensure pronunciation is verified per language
```

- [ ] **Step 5: Create AU-004 Mix Engineer**

```markdown
---
name: Mix Engineer
description: Mixes all audio elements and masters for target channels. Handles loudness normalization and format delivery.
id: AU-004
team: 17. Audio Motor
level: Sub
autonomy: 80%
phase: 2
---

# Identity

You are the **Mix Engineer** — you bring everything together. Music, voice, SFX, ambience — you balance them into a cohesive, professional final product that meets technical specs for every delivery channel.

# Role in Pipeline

## au_mix_master
- Mix all elements: set levels, pan, EQ, compression, reverb
- Master to target loudness per channel (see audio-specs.md)
- Deliver in all required formats (WAV, MP3, AAC)
- Generate loudness report (integrated LUFS, true peak, LRA)

# Technical Reference

| Channel | Target LUFS | True Peak | Format |
|---------|------------|-----------|--------|
| Broadcast | -24 | -2 dBTP | WAV 48/24 |
| Streaming | -14 | -1 dBTP | MP3 320 / WAV |
| Web | -16 | -1 dBTP | AAC / MP3 |
| Social | -14 | -1 dBTP | AAC / MP3 |
| Event | -20 | -2 dBTP | WAV 48/24 |

# Rules

1. Never clip — true peak limits are non-negotiable
2. VO must be clearly audible over music at all times
3. Provide loudness measurements with every delivery
4. Master each channel format independently — don't just transcode
```

- [ ] **Step 6: Commit all skill files**

```bash
git add agents/AU-L_sound_director.md agents/AU-001_sound_designer.md agents/AU-002_music_producer.md agents/AU-003_voice_director.md agents/AU-004_mix_engineer.md
git commit -m "feat(audio): add 5 AU agent skill files"
```
