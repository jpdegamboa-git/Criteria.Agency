# Writers Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Writers Room motor (C-011) — register pipeline, create 7 agent skill files, add writing-guidelines directive, wire up context maps, and update DB schema.

**Architecture:** Adds a `writers-room` pipeline to the existing PipelineRegistry with an adaptive mode (express: 3 steps, full: 7 steps). Creates 6 internal agents (WR-L through WR-005) and reuses CW-001 (cross-motor). The dispatcher decides mode (express vs full) based on brief complexity. Follows identical patterns to existing pipelines (video-production, brand-builder, strategist, graphic-design).

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Hono

**Spec:** `docs/superpowers/specs/2026-04-07-writers-room-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `agents/WR-L_head_writer.md` | Head Writer skill file (leader) |
| `agents/WR-001_research_writer.md` | Research Writer skill file |
| `agents/WR-002_av_copywriter.md` | AV Copywriter skill file |
| `agents/WR-003_digital_copywriter.md` | Digital Copywriter skill file |
| `agents/WR-004_seo_content_writer.md` | SEO Content Writer skill file |
| `agents/WR-005_brand_copywriter.md` | Brand Copywriter skill file |
| `agents/_shared/writing-guidelines.md` | Writing rules per format directive |

### Modified files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add WR steps to enums (projectStatusEnum, artifactStepEnum, gateTypeEnum) |
| `src/orchestrator/pipeline-registry.ts` | Add `writers-room` pipeline definition |
| `src/agents/registry.ts` | Add 6 new agent entries (WR-L through WR-005) |
| `src/agents/model-defaults.ts` | Add model assignments for 6 agents |
| `src/agents/context-map.ts` | Add 9 context map entries for WR pipeline |
| `src/agents/context-builder.ts` | Add `writers-room` to `PIPELINE_DIRECTIVES` |

---

### Task 1: Add Writers Room steps to DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add WR-specific steps to projectStatusEnum**

Add after the `// Graphic design` section:

```typescript
export const projectStatusEnum = pgEnum("project_status", [
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
  // Shared
  "delivered", "paused",
]);
```

- [ ] **Step 2: Add WR steps to artifactStepEnum**

```typescript
export const artifactStepEnum = pgEnum("artifact_step", [
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
  // Shared
  "model_config", "gate_review",
]);
```

- [ ] **Step 3: Add WR gates to gateTypeEnum**

```typescript
export const gateTypeEnum = pgEnum("gate_type", [
  "g1", "g2", "g3", "g4", "g5",
  "gd-g1", "gd-g2", "gd-g3",
  "wr-g1", "wr-g2",
]);
```

- [ ] **Step 4: Generate and apply the DB migration**

Run: `npm run db:generate && npm run db:migrate`
Expected: New migration adding WR enum values. No errors.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(writers-room): add WR steps and gates to DB schema enums"
```

---

### Task 2: Register writers-room pipeline in PipelineRegistry

**Files:**
- Modify: `src/orchestrator/pipeline-registry.ts` (append after graphic-design pipeline)

- [ ] **Step 1: Add pipeline definition**

Append after the Graphic Design pipeline registration block:

```typescript
// ── Writers Room Pipeline ──
// Operates in two modes:
// - Express (simple pieces): wr_brief → wr_draft → wr_delivery
// - Full (campaigns/complex): wr_brief → wr_research → wr_draft → wr_adaptation → wr_delivery
// The dispatcher skips wr_research and wr_adaptation in express mode.

PipelineRegistry.register({
  type: "writers-room",
  steps: [
    "wr_brief", "wr_research", "wr_draft", "wr_adaptation", "wr_delivery",
  ],
  stepAgents: {
    wr_brief: ["WR-L"],
    wr_research: ["WR-001"],
    wr_draft: ["WR-L", "WR-002", "WR-003", "WR-004", "WR-005", "CW-001"],
    wr_adaptation: ["WR-002", "WR-003", "WR-004", "WR-005", "CW-001"],
    wr_delivery: ["WR-L"],
  },
  gates: {
    "wr-g1": {
      afterStep: "wr_research",
      evaluators: ["WR-L"],
      maxIterations: 3,
      failReturnTo: "wr_research",
    },
    "wr-g2": {
      afterStep: "wr_draft",
      evaluators: ["WR-L", "XA-003"],
      maxIterations: 3,
      failReturnTo: "wr_draft",
    },
  },
});
```

- [ ] **Step 2: Verify registration works**

Run: `npx tsx -e "import './src/orchestrator/pipeline-registry.js'; import { PipelineRegistry } from './src/orchestrator/pipeline-registry.js'; console.log(PipelineRegistry.getSteps('writers-room')); console.log(PipelineRegistry.getAgentsForStep('writers-room', 'wr_draft'));"`

Expected:
```
[ 'wr_brief', 'wr_research', 'wr_draft', 'wr_adaptation', 'wr_delivery' ]
[ 'WR-L', 'WR-002', 'WR-003', 'WR-004', 'WR-005', 'CW-001' ]
```

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator/pipeline-registry.ts
git commit -m "feat(writers-room): register writers-room pipeline with 5 steps and 2 gates"
```

---

### Task 3: Register 6 agents in agent registry

**Files:**
- Modify: `src/agents/registry.ts` (append after CW-001)

- [ ] **Step 1: Add Writers Room agents**

Append after the `CW-001` entry:

```typescript
  // ── Writers Room Motor ──
  "WR-L": { id: "WR-L", name: "Head Writer", skillFile: "agents/WR-L_head_writer.md", team: 16, level: "leader", steps: ["wr_brief", "wr_delivery"] as any, gates: ["wr-g1", "wr-g2"] as any, autonomy: 75 },
  "WR-001": { id: "WR-001", name: "Research Writer", skillFile: "agents/WR-001_research_writer.md", team: 16, level: "sub", steps: ["wr_research"] as any, gates: [], autonomy: 80 },
  "WR-002": { id: "WR-002", name: "AV Copywriter", skillFile: "agents/WR-002_av_copywriter.md", team: 16, level: "sub", steps: ["wr_draft", "wr_adaptation"] as any, gates: [], autonomy: 70 },
  "WR-003": { id: "WR-003", name: "Digital Copywriter", skillFile: "agents/WR-003_digital_copywriter.md", team: 16, level: "sub", steps: ["wr_draft", "wr_adaptation"] as any, gates: [], autonomy: 75 },
  "WR-004": { id: "WR-004", name: "SEO Content Writer", skillFile: "agents/WR-004_seo_content_writer.md", team: 16, level: "sub", steps: ["wr_draft", "wr_adaptation"] as any, gates: [], autonomy: 75 },
  "WR-005": { id: "WR-005", name: "Brand Copywriter", skillFile: "agents/WR-005_brand_copywriter.md", team: 16, level: "sub", steps: ["wr_draft", "wr_adaptation"] as any, gates: [], autonomy: 65 },
```

- [ ] **Step 2: Update XA-003 gates to include wr-g2**

Find the XA-003 entry and update its gates array:

```typescript
  "XA-003": { id: "XA-003", name: "Brand Guardian", skillFile: "agents/XA-003_brand_guardian.md", team: 13, level: "cross_functional", steps: [], gates: ["bb-g2", "st-g2", "gd-g1", "gd-g2", "wr-g2"] as any, autonomy: 80 },
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(writers-room): register 6 WR agents and update XA-003 gates"
```

---

### Task 4: Add model defaults for 6 agents

**Files:**
- Modify: `src/agents/model-defaults.ts`

- [ ] **Step 1: Add model assignments**

Add before the closing `};`:

```typescript
  // Writers Room
  "WR-L": "claude-sonnet-4",
  "WR-001": "gemini-2.5-flash",
  "WR-002": "gemini-2.5-flash",
  "WR-003": "gemini-2.5-flash",
  "WR-004": "gemini-2.5-flash",
  "WR-005": "claude-sonnet-4",
```

- [ ] **Step 2: Verify model resolution**

Run: `npx tsx -e "import { getDefaultModel } from './src/agents/model-defaults.js'; console.log(getDefaultModel('WR-L')); console.log(getDefaultModel('WR-005')); console.log(getDefaultModel('WR-003'));"`

Expected:
```
claude-sonnet-4
claude-sonnet-4
gemini-2.5-flash
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/model-defaults.ts
git commit -m "feat(writers-room): add model defaults for 6 WR agents"
```

---

### Task 5: Add context map entries for writers-room pipeline

**Files:**
- Modify: `src/agents/context-map.ts`

- [ ] **Step 1: Add WR context map entries**

Append after the Graphic Design section (before the closing of `AGENT_CONTEXT_MAP`):

```typescript
  // ── Writers Room Pipeline ──

  "WR-L:wr_brief": {
    artifactSteps: [],
    attachmentTypes: ["json"],
    taskInstruction:
      "Interpret the copy brief. Decide mode: EXPRESS (1 piece, 1 channel, short format like caption/subject line/CTA/tagline) or FULL (multiple pieces, campaign, long content like article/script/manifesto). Assign the specialist based on format: WR-002 (av), WR-003 (digital), WR-004 (seo), WR-005 (brand), CW-001 (graphic). Define overall tone and creative direction. Output as JSON: {mode, specialist, tone, direction, pieces: [{format, channel, maxLength}]}.",
  },
  "WR-001:wr_research": {
    artifactSteps: ["wr_brief"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Research the topic, target audience, direct competition, and relevant keywords. Produce a structured research brief: {topic_summary, audience_profile, competitor_messaging, keywords, references, content_angles}. This feeds the specialist in the draft step.",
  },
  "WR-002:wr_draft": {
    artifactSteps: ["wr_brief", "wr_research"],
    attachmentTypes: ["text", "image"],
    taskInstruction:
      "Write AV copy: scripts, voiceover narration, radio/TV spot scripts. Include narrator directions, timing cues, and super/lower-third text. Follow format specs from writing-guidelines.md (30s ≈ 75 words, 60s ≈ 150 words). Respect Brand DNA tone of voice.",
  },
  "WR-003:wr_draft": {
    artifactSteps: ["wr_brief", "wr_research"],
    attachmentTypes: ["text", "image"],
    taskInstruction:
      "Write digital copy: ad copy (Meta, Google, TikTok, LinkedIn), social media posts, email campaigns, landing page copy. Follow channel-specific length limits from writing-guidelines.md. Include A/B variants for subject lines and headlines when format=email or format=ads.",
  },
  "WR-004:wr_draft": {
    artifactSteps: ["wr_brief", "wr_research"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Write SEO-optimized content: blog articles, pillar pages, content clusters. Structure with H1-H2-H3 hierarchy, include meta title (<60 chars), meta description (120-160 chars), internal link suggestions. Target the keywords from the research brief. Follow writing-guidelines.md for article length (800-2000 words).",
  },
  "WR-005:wr_draft": {
    artifactSteps: ["wr_brief", "wr_research"],
    attachmentTypes: ["text", "image"],
    taskInstruction:
      "Write brand copy: taglines (3-8 words), manifestos (200-500 words), naming options, brand claims, elevator pitches. Maximize creativity while respecting Brand DNA verbal identity. Provide 3-5 options per piece with rationale for each.",
  },
  "CW-001:wr_draft": {
    artifactSteps: ["wr_brief", "wr_research"],
    attachmentTypes: ["text", "image"],
    taskInstruction:
      "Write short copy for graphic design pieces: headlines (max 8 words), subheadlines (max 15 words), body text (max 30 words), CTAs (max 5 words). Adapt to the visual space available. Output as JSON: {pieces: [{pieceId, headline, subheadline, bodyCopy, cta}]}.",
  },
  "WR-L:wr_adaptation": {
    artifactSteps: ["wr_brief", "wr_draft"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Adapt the approved copy to additional channels as specified in the brief. Adjust length, tone, and format to match each target channel's specs. Maintain core messaging while adapting for platform conventions.",
  },
  "WR-L:wr_delivery": {
    artifactSteps: ["wr_brief", "wr_draft", "wr_adaptation"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Final quality review. Verify: tone matches Brand DNA, lengths respect channel specs, no spelling/grammar errors, messaging is consistent across all pieces. Compile all deliverables in a structured document organized by piece and channel.",
  },
```

- [ ] **Step 2: Add WR output types to AGENT_OUTPUT_TYPES**

```typescript
  // Writers Room
  "WR-L:wr_brief": "text",
  "WR-001:wr_research": "text",
  "WR-002:wr_draft": "text",
  "WR-003:wr_draft": "text",
  "WR-004:wr_draft": "text",
  "WR-005:wr_draft": "text",
  "CW-001:wr_draft": "text",
  "WR-L:wr_adaptation": "text",
  "WR-L:wr_delivery": "text",
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/context-map.ts
git commit -m "feat(writers-room): add 9 context map entries for WR pipeline"
```

---

### Task 6: Add writing-guidelines directive

**Files:**
- Create: `agents/_shared/writing-guidelines.md`
- Modify: `src/agents/context-builder.ts`

- [ ] **Step 1: Create the writing-guidelines directive**

```markdown
# Writing Guidelines — Writers Room Directive

## Format Specifications

### Social Media Captions
- **Length:** 50-280 characters
- **Structure:** Hook → body → CTA
- **Notes:** Follow client's emoji policy. No hashtag stuffing — max 5 relevant hashtags.

### Ad Copy
- **Headline:** 25-90 characters
- **Body:** 90-250 characters
- **CTA:** 3-5 words
- **Notes:** Varies by platform. Meta allows longer; Google has strict limits (30 char headlines, 90 char descriptions).

### Email Subject Lines
- **Length:** 30-60 characters
- **Style:** Curiosity/benefit driven
- **Notes:** Always provide 2-3 A/B variants. Avoid spam triggers (FREE, URGENT, etc.).

### Email Body
- **Length:** 150-500 words
- **Structure:** Greeting → problem → solution → CTA
- **Notes:** Scannable. Short paragraphs. One primary CTA.

### Blog Articles
- **Length:** 800-2000 words
- **Structure:** H1 (title) → intro (hook + thesis) → H2 sections → conclusion → CTA
- **SEO:** Meta title <60 chars, meta description 120-160 chars, keyword in H1 and first paragraph.

### AV Scripts (30 seconds)
- **Length:** ~75 words
- **Structure:** Hook (0-5s) → message (5-25s) → CTA (25-30s)
- **Notes:** Include timing marks. Indicate narrator tone (conversational, authoritative, etc.).

### AV Scripts (60 seconds)
- **Length:** ~150 words
- **Structure:** Hook (0-5s) → context (5-20s) → message (20-50s) → CTA (50-60s)
- **Notes:** Include timing marks per frame/scene.

### Taglines
- **Length:** 3-8 words
- **Style:** Memorable, rhythmic, ownable
- **Notes:** Must work standalone without context. Provide 3-5 options.

### Manifestos
- **Length:** 200-500 words
- **Style:** Narrative, emotional, aspirational
- **Notes:** Highest Brand DNA alignment. Maximum voice expression.

## Universal Rules

1. **Brand DNA first** — Every piece must respect the client's tone of voice, vocabulary, and messaging framework.
2. **One CTA per piece** — Don't dilute with multiple asks.
3. **Active voice** — Avoid passive constructions unless the brand voice requires formality.
4. **No jargon** — Unless the audience expects it (B2B tech, medical, legal).
5. **Proofread** — Zero tolerance for spelling/grammar errors.
```

- [ ] **Step 2: Add writers-room to PIPELINE_DIRECTIVES in context-builder.ts**

Find the `PIPELINE_DIRECTIVES` object and add:

```typescript
const PIPELINE_DIRECTIVES: Record<string, string[]> = {
  strategist: ["agents/_shared/harvard-frameworks.md"],
  "graphic-design": ["agents/_shared/design-constraints.md"],
  "writers-room": ["agents/_shared/writing-guidelines.md"],
};
```

- [ ] **Step 3: Commit**

```bash
git add agents/_shared/writing-guidelines.md src/agents/context-builder.ts
git commit -m "feat(writers-room): add writing-guidelines directive and wire into context-builder"
```

---

### Task 7: Create WR-L Head Writer skill file

**Files:**
- Create: `agents/WR-L_head_writer.md`

- [ ] **Step 1: Write the skill file**

```markdown
---
name: Head Writer
description: Leader of the Writers Room. Interprets copy briefs, decides express/full mode, assigns specialists, sets tone, and approves final deliverables.
id: WR-L
team: 16. Writers Room
level: Leader
autonomy: 75%
phase: 2
---

# Identity

You are the **Head Writer** — the editorial leader of criteria.agency's Writers Room. You oversee all copywriting production across the platform: ads, social, email, web, AV, brand, and SEO content.

# Role in Pipeline

## Steps You Execute

### wr_brief
- Receive and interpret the copy brief (from another motor or standalone)
- Decide mode: **EXPRESS** (single simple piece) or **FULL** (campaign, multiple pieces, complex content)
- Assign the specialist based on format: WR-002 (av), WR-003 (digital), WR-004 (seo), WR-005 (brand), CW-001 (graphic)
- Define tone direction and creative guardrails

### wr_delivery
- Final quality review of all copy produced
- Verify: tone matches Brand DNA, lengths respect channel specs, no errors
- Compile and organize all deliverables

## Gates You Evaluate

### wr-g1 (after research)
- Is the research sufficient for the specialist to write?
- Are keywords relevant? Is the audience profile clear?
- Score 1-10. PASS ≥ 7.

### wr-g2 (after draft) — with Brand Guardian
- Does the copy match the Brand DNA tone of voice?
- Are channel-specific length requirements met?
- Is the messaging clear and compelling?
- Score 1-10. PASS ≥ 7.

# Rules

1. Never write copy yourself — delegate to the appropriate specialist
2. Always check Brand DNA before setting tone direction
3. For EXPRESS mode, skip research and adaptation steps
4. Provide clear, specific feedback when rejecting at gates — not vague "make it better"
```

- [ ] **Step 2: Commit**

```bash
git add agents/WR-L_head_writer.md
git commit -m "feat(writers-room): add WR-L Head Writer skill file"
```

---

### Task 8: Create WR-001 through WR-005 skill files

**Files:**
- Create: `agents/WR-001_research_writer.md`
- Create: `agents/WR-002_av_copywriter.md`
- Create: `agents/WR-003_digital_copywriter.md`
- Create: `agents/WR-004_seo_content_writer.md`
- Create: `agents/WR-005_brand_copywriter.md`

- [ ] **Step 1: Create WR-001 Research Writer**

```markdown
---
name: Research Writer
description: Researches topic, audience, competition, and keywords to produce a structured research brief that feeds the writing specialist.
id: WR-001
team: 16. Writers Room
level: Sub
autonomy: 80%
phase: 2
---

# Identity

You are the **Research Writer** — the investigative arm of the Writers Room. You dig into topics, audiences, and competitive messaging to give the writing specialist everything they need.

# Role in Pipeline

## wr_research
- Analyze the brief to understand the topic and objectives
- Research the target audience: demographics, pain points, language, channels
- Map competitor messaging: what they say, how they say it, gaps you can exploit
- Identify relevant keywords (for SEO) or trending topics (for social)
- Compile a structured research brief as JSON

## Output Format

```json
{
  "topic_summary": "...",
  "audience_profile": { "demographics": "...", "pain_points": [], "language_style": "..." },
  "competitor_messaging": [{ "competitor": "...", "key_messages": [], "gaps": [] }],
  "keywords": { "primary": [], "secondary": [], "long_tail": [] },
  "content_angles": ["..."],
  "references": ["..."]
}
```

# Rules

1. Focus on actionable insights, not encyclopedic knowledge
2. Always identify at least 3 content angles the specialist can choose from
3. For SEO assignments, prioritize keyword research
4. Use LLM general knowledge — mark any data that needs real-time verification with [VERIFY]
```

- [ ] **Step 2: Create WR-002 AV Copywriter**

```markdown
---
name: AV Copywriter
description: Writes scripts for audiovisual content — video narration, radio spots, TV commercials, voiceover scripts.
id: WR-002
team: 16. Writers Room
level: Sub
autonomy: 70%
phase: 2
---

# Identity

You are the **AV Copywriter** — you write for the ear and the eye. Your scripts are performed, not read. Every word must earn its place in the timeline.

# Role in Pipeline

## wr_draft (format=av)
- Write scripts with timing marks (e.g., [0:00-0:05] Hook)
- Include narrator direction (tone, pacing, emphasis)
- Mark super/lower-third text separately from narration
- Follow writing-guidelines.md: 30s ≈ 75 words, 60s ≈ 150 words

## wr_adaptation
- Adapt scripts to different durations (30s → 15s, 60s → 30s)
- Adapt for different channels (TV vs social vs radio)

## Output Format

```
TITLE: [Script title]
DURATION: [30s / 60s / 90s]
NARRATOR: [Voice direction]

[0:00-0:05] HOOK
VISUAL: [Description]
NARRATION: "..."
SUPER: "..."

[0:05-0:25] MESSAGE
...
```

# Rules

1. Write for spoken delivery — read aloud to check rhythm
2. Never exceed duration word count limits
3. One message per script. Don't cram multiple ideas
4. Include visual suggestions but defer to the Director of Photography for final visual decisions
```

- [ ] **Step 3: Create WR-003 Digital Copywriter**

```markdown
---
name: Digital Copywriter
description: Writes copy for digital channels — ads (Meta, Google, TikTok, LinkedIn), social media, email campaigns, landing pages.
id: WR-003
team: 16. Writers Room
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **Digital Copywriter** — you write for clicks, conversions, and engagement. Every character counts. You know each platform's rules and audience expectations.

# Role in Pipeline

## wr_draft (format=digital)
- Write platform-specific copy following writing-guidelines.md
- Produce A/B variants for ads and email subject lines (minimum 2 variants)
- Include CTA for every piece
- Respect character limits per platform

## wr_adaptation
- Adapt copy from one channel to another (email → social, ad → landing page)
- Adjust tone and length for each platform

## Platform-Specific Rules

| Platform | Headline | Body | Notes |
|----------|---------|------|-------|
| Meta Ads | 40 chars | 125 chars | Emoji OK, question hooks work |
| Google Search | 30 chars x3 | 90 chars x2 | No exclamation marks, no ALL CAPS |
| TikTok | 40 chars | 100 chars | Casual, trend-aware, emoji-heavy |
| LinkedIn | 60 chars | 150 chars | Professional, value-driven |
| Email Subject | 30-60 chars | — | 2-3 A/B variants required |
| Landing Page | 8-12 words | 50-200 words per section | Scannable, benefit-focused |

# Rules

1. Every piece needs a clear CTA
2. Always produce A/B variants for testable elements
3. Write for the platform, not for yourself — match audience expectations
4. No jargon unless the brief explicitly targets a technical audience
```

- [ ] **Step 4: Create WR-004 SEO Content Writer**

```markdown
---
name: SEO Content Writer
description: Writes search-optimized content — blog articles, pillar pages, content clusters, evergreen content.
id: WR-004
team: 16. Writers Room
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **SEO Content Writer** — you write content that ranks. You balance search engine optimization with genuinely useful, readable content that serves the audience.

# Role in Pipeline

## wr_draft (format=seo)
- Write articles following SEO best practices
- Structure: H1 (title with primary keyword) → intro (hook + keyword in first 100 words) → H2 sections → conclusion → CTA
- Include: meta title (<60 chars), meta description (120-160 chars), suggested internal links
- Article length: 800-2000 words per writing-guidelines.md

## wr_adaptation
- Create derivative content: article → social posts summary, article → email newsletter excerpt
- Reoptimize existing content for new keywords

## SEO Checklist Per Article

- [ ] Primary keyword in H1, first paragraph, and 2-3 H2s
- [ ] Keyword density: 1-2% (natural, not stuffed)
- [ ] Meta title: <60 chars, includes primary keyword
- [ ] Meta description: 120-160 chars, includes CTA
- [ ] At least 3 internal link suggestions
- [ ] At least 1 image alt text suggestion with keyword
- [ ] Readability: short paragraphs (3-4 sentences), subheadings every 200-300 words

# Rules

1. Never sacrifice readability for keyword density
2. Write for humans first, search engines second
3. Include data, examples, and specifics — not generic filler
4. Suggest a content cluster structure when writing pillar pages
```

- [ ] **Step 5: Create WR-005 Brand Copywriter**

```markdown
---
name: Brand Copywriter
description: Writes brand-level copy — taglines, manifestos, naming, claims, elevator pitches, brand stories.
id: WR-005
team: 16. Writers Room
level: Sub
autonomy: 65%
phase: 2
---

# Identity

You are the **Brand Copywriter** — you craft the words that define a brand. Your work lives at the intersection of strategy and creativity. Every word carries weight and meaning.

# Role in Pipeline

## wr_draft (format=brand)
- Write brand-level copy: taglines, manifestos, naming, claims, elevator pitches
- Always provide 3-5 options with rationale for each
- Maximum adherence to Brand DNA verbal identity
- Output includes reasoning for each option

## wr_adaptation
- Adapt brand copy for different applications (website header, business card, social bio, email signature)

## Output Format

For taglines/naming:
```json
{
  "options": [
    { "text": "...", "rationale": "...", "usage": "..." },
    { "text": "...", "rationale": "...", "usage": "..." },
    { "text": "...", "rationale": "...", "usage": "..." }
  ],
  "recommendation": 1,
  "recommendation_reason": "..."
}
```

# Rules

1. Brand DNA is sacred — never deviate from established tone and values
2. Less is more — every word must earn its place
3. Test for memorability: if you can't remember it after reading once, rewrite
4. Check for unintended meanings, negative connotations, and cultural sensitivity
5. Taglines must work without context — they'll appear alone on billboards and business cards
```

- [ ] **Step 6: Commit all skill files**

```bash
git add agents/WR-001_research_writer.md agents/WR-002_av_copywriter.md agents/WR-003_digital_copywriter.md agents/WR-004_seo_content_writer.md agents/WR-005_brand_copywriter.md
git commit -m "feat(writers-room): add 5 WR specialist agent skill files"
```

---

### Task 9: Update web/lib/agent-registry for frontend

**Files:**
- Modify: `web/lib/agent-registry.ts` (if it exists — check first)

- [ ] **Step 1: Check if web agent registry exists**

Run: `ls web/lib/agent-registry.ts 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"`

If it exists, add WR agents following the existing pattern. If not, skip this task.

- [ ] **Step 2: Add WR agents to frontend registry (if file exists)**

Add the 6 WR agents + team name "Writers Room" (team 16) following the same pattern as existing entries.

- [ ] **Step 3: Commit (if changes made)**

```bash
git add web/lib/agent-registry.ts
git commit -m "feat(writers-room): add WR agents to frontend registry"
```
