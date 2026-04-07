# criteria.agency — Graphic Design Engine Implementation Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation plan for Graphic Design capability (C-010), including pipeline definition, 6 internal agents, 1 new cross-motor agent (CW-001 Copywriter), design constraints directive, cross-motor integration, and context maps

---

## 1. Objective

Implement the **Graphic Design** motor — the most cross-referenced Creation motor in the platform. This motor produces visual pieces for every other motor that needs assets: Ads, Community Management, Email Marketing, Events, Print Production, and Brand Builder.

### Capability delivered

| Capability | What it delivers |
|-----------|-----------------|
| C-010: Diseño gráfico on-demand | Visual pieces for any format — social media, ads, brand collateral, infographics, print materials, motion graphics — without a designer on staff |

### Why this motor is priority

Graphic Design is a **dependency for 6+ other motors:**

| Motor | What it needs from Graphic Design |
|-------|----------------------------------|
| Ads (Pauta) | Banners, display ads, social ad creatives |
| Community Management | Posts, stories, covers, profile assets |
| Email Marketing | Headers, templates, visual assets |
| Events | Signage, printed materials, venue branding |
| Print Production | Final art files (receives as input) |
| Web | Hero images, icons, illustrations |

Building Graphic Design first unblocks the entire Distribution and Physical layer.

### Scope

- **Full scope from Phase 1:** Social media, ads, brand collateral, infographics, print-ready materials, motion graphics
- **Design System generation:** Creates and maintains a formal Design System (tokens, grid, spacing, components) from the Brand DNA Document
- **Multi-piece projects:** A single brief can request multiple pieces; the pipeline uses a parent project with sub-tasks per piece
- **Configurable autonomy:** Two human gates (concept + final pieces) that can be set to auto-approve

---

## 2. Pipeline

```
[brief] → [design_system] → [moodboard] → [G1] → [production] → [G2] → [adaptation] → [delivery] → [G3]
```

### Step details

| Step | Agents | What happens | Input artifacts | Output artifacts |
|------|--------|-------------|----------------|-----------------|
| brief | GD-L | Analyzes campaign brief. Determines piece types, formats, quantities, target channels. If from Strategist, extracts specs from Campaign Brief | Campaign Brief or manual brief (text) | Brief Analysis (json): pieces required, formats, channels, priority |
| design_system | GD-L, GD-001 | If client has no Design System, generates one from Brand DNA (color tokens, typography scale, grid system, spacing, base components). If Design System exists, loads it, validates currency, updates if Brand DNA changed | Brand DNA Document, client assets (logos, photos), previous Design System (if exists) | Design System Document (json + markdown): tokens, grid, components, visual do's/don'ts |
| moodboard | GD-L, GD-002 | Generates visual moodboard: applied palette, style references, layout sketches, visual direction for the specific pieces. Defines copy direction (key messages, tone per piece) | Design System, Brief Analysis | Moodboard (markdown + generated images on R2) |
| **G1** | GD-L, XA-003 (Brand Guardian) | Visual direction coherent with Brand DNA? Moodboard reflects brief? Design System correctly applied? Copy direction clear? | Design System + Moodboard + Brief Analysis | pass/fail + notes |
| production | GD-L (supervision), GD-002, GD-004*, GD-005*, CW-001 | Creates master pieces. One sub-task per piece from brief. GD-002 composes layouts. CW-001 generates copy (headlines, taglines, CTAs). GD-002 integrates copy into composition. GD-004 activated only for animated pieces. GD-005 activated only for infographics | Moodboard, Design System, Brief Analysis, client assets | Master pieces (high-res images on R2), Copy Package (json) |
| **G2** | GD-L, TL-002 (Showrunner)*, XA-003 | Visual quality, composition, integrated copy, Brand DNA adherence, communication impact. TL-002 evaluates only if project is cross-motor | Master pieces | pass/fail + corrections |
| adaptation | GD-003, GD-004* | Takes master pieces and adapts to all required aspect ratios, resolutions, and channel specs. GD-004 adds animation if applicable. Exports in correct formats per channel | Master pieces, Channel specs (from XA-002) | Adapted pieces by format (PNG/JPG/SVG/PDF/GIF/MP4 on R2) |
| delivery | GD-003 | Packages all final files. Generates preview sheet showing all pieces in all formats. Uploads to R2 | Adapted pieces, motion assets | Final package (ZIP on R2) + Preview Sheet (PDF) |
| **G3** | GD-L | Delivery complete and correct. All formats present. Resolutions verified. Files properly exported | Final package | pass/fail |

*Agents marked with * are conditionally activated based on brief requirements.

### Autonomy configuration

| Mode | G1 behavior | G2 behavior | G3 behavior |
|------|------------|------------|------------|
| **AI decides** | Auto-approves if internal evaluation passes | Auto-approves if internal evaluation passes | Always automatic |
| **AI recommends** | Requires human approval | Requires human approval | Always automatic |

---

## 3. Agents

### Internal agents (6)

| ID | Name | Level | Step(s) | Model | Autonomy |
|----|------|-------|---------|-------|----------|
| GD-L | Art Director | leader | brief, design_system, moodboard, production (supervision) | claude-sonnet-4 | 75% |
| GD-001 | Design System Architect | sub | design_system | gemini-2.5-flash | 80% |
| GD-002 | Graphic Composer | sub | moodboard, production | gemini-2.5-flash (text), gemini-imagen-3 (generation) | 70% |
| GD-003 | Format Adapter | sub | adaptation, delivery | gemini-2.5-flash | 85% |
| GD-004 | Motion Designer | sub | production, adaptation | gemini-2.5-flash (text), veo-3 (animation) | 70% |
| GD-005 | Infographic Designer | sub | production | gemini-2.5-flash (text), gemini-imagen-3 (generation) | 75% |

### New cross-motor agent (1)

| ID | Name | Level | Team | Model | Autonomy | Serves |
|----|------|-------|------|-------|----------|--------|
| CW-001 | Copywriter | sub | copy | claude-sonnet-4 | 75% | Graphic Design, Ads, Print, Events |

**CW-001 is a Copywriter — distinct from:**
- **T2-002 (AV Copywriter / Guionista):** Writes audiovisual scripts (two-column format, timecodes, camera directions). Lives in the Writers Room. Serves Video.
- **DC-001 (Content Writer):** Writes long-form strategic content (articles, blog posts, emails, landing pages). Lives in SEO/Content team. Serves SEO, Web, Email.
- **CW-001 (Copywriter):** Writes short-form persuasive text (headlines, taglines, slogans, CTAs, ad copy, product names). Lives in Copy team. Serves all motors needing advertising copy.

| Attribute | T2-002 Guionista | CW-001 Copywriter | DC-001 Content Writer |
|-----------|-----------------|-------------------|----------------------|
| Format | Two-column AV, timecodes | Headlines, taglines, CTAs (short-form) | Articles, emails, posts (long-form) |
| Objective | Narrate for screen and ear | Persuade, sell, impact in few words | Inform, educate, nurture, position |
| Calibration | Camera, pacing, dialogue | Memorability, brevity, visual impact | SEO, engagement, readability |
| Consumes | Script brief, visual look | Brand DNA verbal identity, campaign brief | Brand voice, content strategy |

### Existing cross-motor agents used by Graphic Design

| ID | Name | Role in Graphic Design |
|----|------|----------------------|
| XA-003 | Brand Guardian | Validates Brand DNA adherence in G1 and G2 |
| XA-002 | Channel Manager | Provides format specs per target channel |
| TL-002 | Showrunner | Senior evaluator in G2 (cross-motor projects only) |
| DC-001 | Content Writer | Long-form copy if needed (rare in design context) |

### Agent details

**GD-L (Art Director)** — The leader. Interprets briefs, defines visual direction, supervises quality of all pieces. Equivalent to T1-L (Creative Director) in the video pipeline.
- `brief`: Analyzes brief, determines required pieces, assigns priorities
- `design_system`: Supervises creation/update of Design System
- `moodboard`: Defines visual direction, approves references, sets copy direction
- `production`: Quality review of each piece before G2
- Gates: Primary evaluator in G1, G2, G3

**GD-001 (Design System Architect)** — Specialist in design systems. Generates tokens, grid, spacing, reusable components from Brand DNA.
- First time for client: creates complete Design System
- Subsequent projects: validates currency, updates if Brand DNA changed
- Output is stored per `clientId`, persists across projects

**GD-002 (Graphic Composer)** — The producer. Generates master pieces combining Design System + moodboard + copy. Uses image generation as a tool.
- Creates compositions respecting grid, tokens, typography from Design System
- Integrates copy from CW-001
- Produces at maximum resolution in master format
- Handles: social posts, ads, brand collateral, marketing materials

**GD-003 (Format Adapter)** — Multi-channel adaptation specialist. Takes master piece and adapts to all required aspect ratios and resolutions.
- Resize, recrop, text reflow
- Exports in correct formats per channel (PNG for social, PDF for print, SVG for web)
- Generates preview sheet with all variants
- Handles color space conversion (sRGB → CMYK for print)

**GD-004 (Motion Designer)** — Adds movement. Simple animations for stories, animated banners, GIFs. Only activated when brief requests animated pieces.
- Uses video generation for short motion graphics
- Animated text, transitions, simple loops
- Exports: GIF, MP4, animated PNG

**GD-005 (Infographic Designer)** — Data visualization specialist. Infographics, charts, diagrams. Only activated when brief requests infographics.
- Combines data + Design System to produce informative visual pieces
- Statistical charts, process diagrams, comparison tables, timelines

---

## 4. Gates

| Gate | After step | Evaluator(s) | Max iterations | What it checks | Human |
|------|-----------|-------------|----------------|---------------|-------|
| G1 | moodboard | GD-L, XA-003 (Brand Guardian) | 3 | Visual direction coherent with Brand DNA. Moodboard reflects brief. Design System correctly applied. Copy direction clear | Configurable |
| G2 | production | GD-L, TL-002 (Showrunner)*, XA-003 | 3 | Master pieces: visual quality, composition, integrated copy, Brand DNA adherence, communication impact | Configurable |
| G3 | delivery | GD-L | 1 | Package complete: all formats present, resolutions correct, files properly exported | Automatic |

*TL-002 only evaluates in G2 when the project originates from a cross-motor request (e.g., campaign brief from Strategist).

**Escalation (3+3 rule):** Same as video — 3 normal attempts → 3 with Art Director adjustment → human escalation.

**Gate fail return:**
- G1 fails → returns to `moodboard`
- G2 fails → returns to `production`
- G3 fails → returns to `adaptation`

---

## 5. Artifacts

| Artifact | Produced by step | Format | Persistent | Consumed by |
|----------|-----------------|--------|------------|-------------|
| Brief Analysis | brief | json | No | GD-001, GD-002, CW-001, all production agents |
| Design System Document | design_system | json + markdown | **Yes** (per clientId, reused across projects) | All GD agents, Brand Guardian, other motors |
| Moodboard | moodboard | markdown + images (R2) | No | GD-002, GD-004, GD-005 |
| Copy Package | production (via CW-001) | json (texts per piece) | No | GD-002 |
| Master Pieces | production | high-res images (R2) | No | GD-003, GD-004 |
| Adapted Pieces | adaptation | multi-format images (R2) | No | delivery |
| Motion Assets | adaptation (GD-004) | GIF/MP4 (R2) | No | delivery |
| Preview Sheet | delivery | PDF (R2) | No | Client |
| Final Package | delivery | ZIP with all files (R2) | Yes | Client, other motors |

### Design System as persistent artifact

The Design System Document is stored by `clientId`, not by `projectId`. When a new Graphic Design project is created for the same client, the context builder loads the existing Design System automatically — same pattern as Brand DNA Document in the Strategist pipeline.

```
Brand Builder (project A)
  └─ Artifact: Brand DNA Document
       ↓ (via parentProjectId)
Graphic Design (project B, first project for this client)
  └─ design_system step: GD-001 generates Design System from Brand DNA
       ↓ (stored by clientId, persists)
Graphic Design (project C, second project for same client)
  └─ design_system step: GD-001 loads existing Design System, validates currency
```

---

## 6. Tools

| Tool | Used by | Purpose |
|------|---------|---------|
| `generate_image` | GD-002, GD-005 | Generate images via Imagen 3, DALL-E, Flux |
| `edit_image` | GD-002, GD-003 | Inpainting, outpainting, edit existing images |
| `upscale_image` | GD-003 | Increase resolution for large formats |
| `remove_background` | GD-002, GD-003 | Separate subject from background |
| `generate_video` | GD-004 | Short motion graphics, animations |
| `generate_text` | CW-001 | Generate advertising copy |
| `analyze_image` | GD-L | Evaluate composition, brand coherence |
| `convert_format` | GD-003 | RGB→CMYK, resize, format conversion |
| `upload_to_r2` | GD-003, delivery | Upload files to Cloudflare R2 |
| `create_mockup` | GD-002, GD-003 | Preview piece in context (device mockup, storefront, etc.) |
| `export_pdf` | GD-003 | Export PDF/X-1a for printing |

---

## 7. Design Constraints Directive

New shared directive: `agents/_shared/design-constraints.md`. Injected as context for all GD agents (equivalent to `production-constraints.md` for video).

### Output formats by channel

| Channel | Format | Resolution | Aspect ratio |
|---------|--------|------------|-------------|
| Instagram Feed | JPG/PNG | 1080×1080 | 1:1 |
| Instagram Stories/Reels | JPG/PNG/MP4 | 1080×1920 | 9:16 |
| Facebook Feed | JPG/PNG | 1200×630 | 1.91:1 |
| LinkedIn Feed | JPG/PNG | 1200×627 | 1.91:1 |
| TikTok | JPG/PNG/MP4 | 1080×1920 | 9:16 |
| YouTube Thumbnail | JPG | 1280×720 | 16:9 |
| Google Display | PNG | Variable (responsive) | Multiple |
| Email Header | JPG/PNG | 600×200 | 3:1 |
| Web Banner | PNG/SVG | Variable | Variable |
| Print (business cards) | PDF/X-1a | 300 DPI, CMYK | Per spec |
| Print (brochure) | PDF/X-1a | 300 DPI, CMYK | Per spec |
| Presentations | PNG/PDF | 1920×1080 | 16:9 |

**Master piece rule:** Always produce at maximum required resolution. Adaptations are derivatives.

### Technical standards

| Aspect | Rule |
|--------|------|
| Digital color | sRGB, 8-bit |
| Print color | CMYK (ISO Coated v2), Pantone when applicable |
| Digital resolution | 72-150 DPI (screen) |
| Print resolution | 300 DPI minimum |
| Typography | Only fonts from Design System. Never unapproved decorative fonts |
| Bleed (print) | 3mm minimum on each side |
| Safe zone (digital) | 10% inner margin on all pieces |
| Text format | Never rasterize text. Keep editable until final export |
| Accessibility | WCAG AA minimum contrast (4.5:1 normal text, 3:1 large text) |
| Source files | Layers organized, semantically named |

### Visual style rules

- Respect client's Design System (tokens, grid, components)
- No generic AI artifacts (artificial gradients, plastic textures, perfect artificial symmetry)
- Composition with clear hierarchy: focal point → support → context
- Intentional white space — do not fill everything
- Legible copy: minimum 14px digital, 8pt print
- Photography: prefer generation or client assets over generic stock

### Never do

- Distort logos
- Use colors outside Design System palette
- Text over image without sufficient contrast
- Generic stock photography (prefer generation or client assets)
- Unlicensed fonts
- Excessive shadow/glow effects
- Rasterize text before final export
- Ignore aspect ratio safe zones

---

## 8. Cross-Motor Integration

### Who invokes Graphic Design

| Invoking motor | Event | What it requests |
|---------------|--------|-----------------|
| Ads (Pauta) | `campaign.needs_creative` | Banners, display ads, social ad creatives |
| Community Management | `asset.requested` | Posts, stories, covers for social media |
| Email Marketing | `asset.requested` | Headers, templates, visual assets for emails |
| Events | `asset.requested` | Printed materials, signage, venue branding |
| Print Production | Receives GD output as input | Final art files for printing |
| Brand Builder | On Brand DNA completion | Triggers initial Design System generation |
| Strategist | On Campaign Brief generation | Briefs include spec for required visual pieces |

### What Graphic Design invokes

| Service invoked | Event | What it requests |
|----------------|--------|-----------------|
| CW-001 Copywriter | `copy.requested` | Headlines, taglines, CTAs for pieces |
| XA-002 Channel Manager | Direct query | Format specs per target channel |
| XA-003 Brand Guardian | Gate evaluation | Brand DNA adherence validation |
| DC-001 Content Writer | `copy.requested` (only for long body copy) | Long-form text content (rare) |

### Cross-motor trigger chains

| Scenario | Event chain |
|----------|------------|
| Campaign needs visuals | Strategist `campaign.needs_creative` → Graphic Design creates project → produces pieces → `asset.delivered` → Ads/Community consume |
| Event needs materials | Events `asset.requested` → Graphic Design produces signage, brochures → `asset.delivered` → Print Production receives final art |
| New client onboards | Brand Builder completes → `brand_dna.updated` → Graphic Design creates Design System → stored by clientId |
| Social calendar | Community Management `asset.requested` (weekly batch) → Graphic Design produces kit → `asset.delivered` → Community publishes |

---

## 9. Context Maps

For each `agentId:step` combination, what context the agent receives:

| Agent:Step | Loaded artifacts | Directives | Attachments |
|------------|-----------------|------------|-------------|
| GD-L:brief | Campaign Brief (if from Strategist) | brand-voice, design-constraints | — |
| GD-001:design_system | Brand DNA Document, previous Design System (if exists), client assets | brand-voice, design-constraints | Logos, photos (image) |
| GD-L:moodboard | Brief Analysis, Design System | brand-voice, design-constraints | — |
| GD-002:moodboard | Brief Analysis, Design System | brand-voice, design-constraints | — |
| GD-002:production | Moodboard, Design System, Copy Package, Brief Analysis | brand-voice, design-constraints | Moodboard images (image) |
| GD-004:production | Moodboard, Design System, Brief Analysis | brand-voice, design-constraints | Moodboard images (image) |
| GD-005:production | Design System, data for infographic, Brief Analysis | brand-voice, design-constraints | — |
| CW-001:production | Brand DNA (verbal identity section), Brief Analysis, Moodboard (copy direction) | brand-voice | — |
| GD-003:adaptation | Master Pieces, Channel Specs (from XA-002), Brief Analysis | design-constraints | Master pieces (image) |
| GD-003:delivery | Adapted Pieces, Motion Assets | design-constraints | All files (image, video) |
| GD-L:G1 | Design System, Moodboard, Brief Analysis, Brand DNA | brand-voice, design-constraints | Moodboard images (image) |
| GD-L:G2 | Master Pieces, Design System, Brief Analysis, Brand DNA | brand-voice, design-constraints | Master pieces (image) |

---

## 10. Multi-Piece Project Model

Graphic Design differs from Video Production: a single brief often requires multiple pieces (e.g., social media kit = 10 posts + 5 stories + 3 banners).

### Hybrid approach: parent project with sub-tasks

```
Project (parent)
  ├─ brief step: determines all pieces needed
  ├─ design_system step: creates/loads Design System (shared)
  ├─ moodboard step: creates visual direction (shared)
  ├─ G1: approves concept (shared)
  │
  ├─ Sub-task 1: Instagram Post 1 (production → G2 → adaptation → delivery)
  ├─ Sub-task 2: Instagram Post 2 (production → G2 → adaptation → delivery)
  ├─ Sub-task 3: Story 1 (production → G2 → adaptation → delivery)
  ├─ ...
  │
  └─ G3: delivery check (all sub-tasks complete)
```

**Implementation:** Uses the same `parentProjectId` pattern from the Strategist pipeline. The parent project runs steps `brief` through `G1`, then creates sub-task records. Each sub-task runs `production` through `delivery` independently (parallelizable). G3 runs on the parent when all sub-tasks complete.

**Database:** No new columns needed beyond the existing `parentProjectId` on the `projects` table.

---

## 11. Agent Skill Files

7 new agent skill files following the existing pattern:

```
agents/
  # Graphic Design motor
  GD-L_art_director.md
  GD-001_design_system_architect.md
  GD-002_graphic_composer.md
  GD-003_format_adapter.md
  GD-004_motion_designer.md
  GD-005_infographic_designer.md

  # New cross-motor agent
  CW-001_copywriter.md

  # New shared directive
  _shared/design-constraints.md
```

Each skill file follows the existing frontmatter pattern:

```yaml
---
name: [Agent Name]
description: [Brief purpose]
id: [ID]
team: [graphic-design | copy]
level: [leader | sub]
autonomy: [70-85%]
phase: [2]
---
```

---

## 12. Code Changes Summary

### New files

| File | Purpose |
|------|---------|
| `agents/GD-L_art_director.md` | Art Director skill file |
| `agents/GD-001_design_system_architect.md` | Design System Architect skill file |
| `agents/GD-002_graphic_composer.md` | Graphic Composer skill file |
| `agents/GD-003_format_adapter.md` | Format Adapter skill file |
| `agents/GD-004_motion_designer.md` | Motion Designer skill file |
| `agents/GD-005_infographic_designer.md` | Infographic Designer skill file |
| `agents/CW-001_copywriter.md` | Copywriter skill file (cross-motor) |
| `agents/_shared/design-constraints.md` | Design constraints directive |

### Modified files

| File | Change |
|------|--------|
| `src/orchestrator/pipeline-registry.ts` | Add `graphic-design` pipeline definition (8 steps, 3 gates) |
| `src/agents/registry.ts` | Add 7 new agents (6 GD + 1 CW) |
| `src/agents/model-defaults.ts` | Add model assignments for 7 new agents |
| `src/agents/context-builder.ts` | Add context maps for graphic-design pipeline. Load design-constraints.md as shared directive. Handle Design System persistence by clientId |

### Unchanged

- Pipeline Registry interface — no changes needed, existing `PipelineDefinition` supports this
- State machine — works with any registered pipeline
- Dispatcher — works with any registered pipeline
- Gate router — works with any registered pipeline
- Agent runtime — no changes needed
- Provider system — no changes needed (image generation providers exist)
- Artifact storage — no changes needed
- Database schema — uses existing `pipelineType` and `parentProjectId` columns (requires strategy-engines migration to run first)

### Dependency

This spec assumes the **strategy-engines implementation** has been completed first:
- PipelineRegistry exists and is functional
- `pipelineType` and `parentProjectId` columns exist in the database
- State machine, dispatcher, and gate router use PipelineRegistry
- Context builder supports pipeline-specific directives

If strategy-engines has NOT been implemented, the graphic-design pipeline definition can still be written but cannot be registered until the PipelineRegistry infrastructure exists.

---

## 13. Execution Flow

### Standard flow (manual brief)

```
1. POST /projects { pipelineType: 'graphic-design', clientId, brief }
2. POST /projects/:id/run
   → brief: GD-L analyzes brief, produces Brief Analysis
   → design_system: GD-001 generates or loads Design System
   → moodboard: GD-L + GD-002 create visual direction + copy direction
   → G1: GD-L + Brand Guardian evaluate concept
   → production: GD-002 composes + CW-001 generates copy + GD-004/005 if needed
   → G2: GD-L + Brand Guardian (+ Showrunner if cross-motor) evaluate pieces
   → adaptation: GD-003 adapts to all formats + GD-004 adds motion if needed
   → delivery: GD-003 packages and uploads
   → G3: GD-L verifies complete delivery
3. Final Package available on R2, preview sheet generated
```

### Cross-motor flow (from campaign)

```
1. Strategist completes → campaign.needs_creative event
2. System creates Graphic Design project with parentProjectId pointing to Strategist project
3. Brief step loads Campaign Brief as artifact from parent project
4. Pipeline runs normally
5. On completion, asset.delivered event notifies requesting motor (Ads, Community, etc.)
```

---

## 14. Capabilities Map Update

After implementation, the capabilities map should be updated:

| Field | Before | After |
|-------|--------|-------|
| C-010 Development status | 📋 Diseñado | 🟡 Parcial (pipeline functional, image gen depends on billing) |
| C-010 Client maturity | 🔴 En desarrollo | 🟠 Alpha |

---

## 15. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Pipeline runs end-to-end | Brief → Design System → Moodboard → G1 → Production → G2 → Adaptation → Delivery → G3 |
| Design System persists | Same client's second project loads existing Design System |
| Multi-piece works | Brief requesting 5 pieces produces 5 sub-tasks, all complete |
| Copy integration works | CW-001 generates copy, GD-002 integrates into compositions |
| Format adaptation works | Master piece at 1080×1080 produces correct derivatives for all requested channels |
| Brand Guardian validates | G1 and G2 correctly reference Brand DNA for evaluation |
| Cross-motor invocation works | Ads motor sends `campaign.needs_creative`, Graphic Design produces and delivers |
| No video pipeline regression | Existing video projects continue to work |
| Design constraints enforced | All outputs comply with design-constraints.md rules |
