# criteria.agency — Web Motor Design (MVP)

> Date: April 9, 2026
> Status: Approved design
> Scope: Web Production motor — sites, microsites, landing pages, blogs, product pages
> Depends on: Transversal Agents Design (DEC-174 to DEC-179), Marketing Engine Design §2.1, Creation Motor Pattern (DEC-186)
> Decisions: DEC-217 to DEC-223, references DEC-064, DEC-140, DEC-141, DEC-145, DEC-147, DEC-148, DEC-149, DEC-174, DEC-184, DEC-186, DEC-187, DEC-206
> BUILD_ORDER: Fase 2 (replaces Video Motor per DEC-222)

---

## 1. Context

The Web Motor is criteria.agency's first creation motor to be built, replacing the Video Motor as Fase 2 in the build order. This change follows DEC-222: development priority is driven by founder needs (dogfooding), not implementation complexity. The founder needs a website (landing page + email capture) before needing video production.

The Web Motor is also the first validation of the universal creation motor pattern (DEC-186) and the Inngest orchestration pipeline with multiple transversal agents, 3 gates, and the 3+3 rule.

**What the Web Motor produces:**

- Complete websites (multi-page, navigation, structured content)
- Landing pages (single-page, conversion-focused)
- Microsites (campaign-specific, temporary or permanent)
- Blogs (CMS structure + templates + categories)
- Product pages (feature-focused, conversion-oriented)

**What the Web Motor does NOT produce:**

- E-commerce / online stores (no cart, checkout, payment)
- Web applications (no complex interactivity, user accounts, dashboards)

**Key architectural decisions:**

| Decision | Reference | Choice |
|---|---|---|
| Pipeline pattern | DEC-186, DEC-217 | Universal: Brief → CD → Writer → G1 → Specialist → G2 → Adaptations. Extended with Web Dev + G3. |
| Number of gates | DEC-206, DEC-217 | 3 gates (more than Graphic Design/Audio's 2, fewer than Video's 4) |
| Site architecture | DEC-218 | Input of the brief, not output of the CD |
| Web Developer | DEC-219 | New transversal agent. Sonnet Tier A. |
| Motor mode | DEC-220 | Hybrid: project (build site) → continuous (blog posts, updates, new pages) |
| Blog vs blog post | DEC-221 | Blog structure = project mode. Blog posts = continuous mode via CMS. |
| BUILD_ORDER revision | DEC-222 | Web Motor is Fase 2, replacing Video Motor. Founder-need-driven priority. |
| Gate 3 nature | DEC-223 | Mostly technical (system functions) + CD visual verification |
| Showrunner | DEC-184 | Eliminated. CD evaluates gates at campaign level. Within the motor, CD evaluates creative quality at G1 and G2. |

---

## 2. Agent Map

### 2.1 Transversal Agents (4 — all shared with other motors)

| Agent | Model | Tier | Role in Web Motor | Skills loaded |
|---|---|---|---|---|
| **Creative Director** | Opus | A | Defines creative direction (visual, tonal, experiential). Evaluates G1 and G2. | Web Direction |
| **Writer** | Sonnet | A | Produces all textual content page by page. | Web Copy, Blog Post (continuous mode) |
| **Designer** | Sonnet | A | Produces visual design: layouts, components, responsive. | Web Design |
| **Web Developer** | Sonnet | A | Translates approved design + copy into functional code. | Static Site, CMS Site, Microsite |

### 2.2 Transversal Support (non-agent)

| Component | Type | Role in Web Motor |
|---|---|---|
| **Brand Guardian** | LLM function (generateText) | Evaluates brand consistency at G1 (text) and G2 (visual). Sonnet Tier A. |

### 2.3 No Motor-Specific Agents

Unlike the Video Motor (which has 6 executor agents specific to video), the Web Motor uses only shared transversal agents. This is consistent with the Marketing Engine Design §2.1 which lists Web with just "1: Web Developer." The actual count is higher because Writer, Designer, and CD are transversal — they serve Web, Video, Graphic Design, Audio, and all other creation motors through different skills.

**Agent count impact:** +1 (Web Developer) to the platform total. Per DEC-211, platform goes from ~25 to ~26 agents.

---

## 3. Pipeline

### 3.1 Overview

```
BRIEF → CD → WRITER → [G1: concepto + textos + costo] → DESIGNER → [G2: diseño visual] → WEB DEV → [G3: sitio funcionando] → DEPLOY
```

The pipeline is a single Inngest function (`web-motor/pipeline`) with each step as an Inngest step. Gates are decision points within the function that can branch to iteration loops.

### 3.2 Inngest Function Structure

```
inngest.createFunction(
  { id: "web-motor-pipeline" },
  { event: "web-motor/pipeline.started" },
  async ({ event, step }) => {
    // Step 0: Validate event + verify tenant
    // Step 1: Brief intake (includes site architecture)
    // Step 2: Creative Direction
    // Step 3: Copy production (page by page)
    // Gate 1: Concept + texts + cost
    // Step 4: Visual design (page by page)
    // Gate 2: Visual design
    // Step 5: Development
    // Step 6: QA (system functions)
    // Gate 3: Site functioning
    // Step 7: Deploy
  }
)
```

**Security per DEC-148:** Every Inngest function verifies webhook signature, validates event schema with Zod, and verifies tenantId against DB as the first step. No sensitive data in step state — only IDs and references.

### 3.3 Step-by-Step Pipeline

#### Step 1: Brief Intake

- **Who:** System function (no LLM)
- **Input:** Client brief (from Client Portal, Strategist campaign brief, or admin)
- **What happens:** Validates brief completeness, stores in DB, creates project record, triggers pipeline
- **Brief fields specific to Web Motor:**
  - Site type: complete site, landing page, microsite, product page
  - Pages and hierarchy (site architecture — DEC-213): page list, navigation structure, parent/child relationships
  - Blog: yes/no. If yes: categories, post frequency intent, author model
  - Integrations: email capture (provider), analytics (GA, PostHog), social embeds, maps, forms
  - Audience: who visits this site, what they're looking for
  - Conversion objectives: what actions should visitors take, priority order
  - Technical requirements: domain, hosting preferences, SSL, specific framework constraints
  - Content inputs: existing copy, brand guidelines, reference sites, images/assets to incorporate
- **Output:** Validated brief with project ID
- **Inngest step:** `brief-intake`

#### Step 2: Creative Direction

- **Who:** Creative Director (Opus, Tier A) — Web Direction skill
- **Input:** Brief (including site architecture) + Brand DNA
- **What happens:** CD interprets the brief through the lens of Brand DNA. Does NOT define what pages exist (that's in the brief). Defines HOW the user experiences the site: visual direction, tonal direction, emotional flow through pages, interaction principles, references.
- **Output:** Creative Direction document:
  - Visual direction: color application, imagery style, whitespace philosophy, visual rhythm
  - Tonal direction: voice per page type (home = inspiring, product = clear, blog = conversational)
  - User flow: emotional journey through the site architecture (brief defines the pages; CD defines the feeling of moving through them)
  - Interaction principles: hover states, transitions, scroll behavior, micro-interactions mood
  - References: 2-5 reference sites that capture aspects of the intended direction
- **Inngest step:** `creative-direction`
- **Context injected to all subsequent agents:** Brand DNA + Creative Direction

#### Step 3: Copy Production

- **Who:** Writer (Sonnet, Tier A) — Web Copy skill
- **Input:** Brief (site architecture, audiences, conversion objectives) + Creative Direction (tonal direction) + Brand DNA (verbal identity, voice guide)
- **What happens:** Writer produces all textual content, page by page, following the site architecture from the brief and the tonal direction from the CD. Each page gets: headline hierarchy, body copy, CTAs, microcopy (button labels, form placeholders, navigation labels), meta title + description (SEO).
- **Output:** Complete copy document organized by page, with all text elements per page
- **Inngest step:** `copy-production`

> **Note:** For large sites, this step can be decomposed into sub-steps per page or page group for better observability, similar to the Video Motor's 4 script sub-steps. For MVP, a single step producing all copy is sufficient.

#### Gate 1: Concept + Texts + Cost

- **Central question:** "Does the creative direction work for this site? Does the copy communicate what it must? Is production viable?"
- **Who evaluates:**
  - Creative Director — evaluates: does the copy serve the creative direction? Is the emotional flow maintained across pages? Are the CTAs clear and compelling?
  - Brand Guardian — Textual Voice Review skill (Sonnet): voice, tone, vocabulary, brand personality, do's and don'ts across all page copy
  - Cost estimation — system function: estimated tokens for design + development phases. Is this within the client's plan budget?
- **Inngest step:** `gate-1-concept-text`

**On CD "iterate":** Writer receives feedback, rewrites specific pages or elements. 3+3 rule counter starts. The CD's feedback identifies where: structural problem (page flow) vs execution problem (specific copy).
**On Brand Guardian "fail":** Writer receives brand fix_guidance, adjusts voice/tone.
**On cost overrun:** Pipeline pauses. Client notified of estimated cost. Client approves or reduces scope.

#### Step 4: Visual Design

- **Who:** Designer (Sonnet, Tier A) — Web Design skill
- **Input:** Approved copy + Creative Direction (visual direction) + Brand DNA (visual system) + Brief (site architecture, integrations)
- **What happens:** Designer produces visual layouts page by page. Each page design includes: layout grid, component arrangement, typography application, color usage, imagery direction (what types of images go where — not the images themselves in MVP), responsive behavior notes (how the layout adapts to mobile/tablet).
- **Output:** Design document per page: desktop layout, mobile layout, component specs, responsive notes. For MVP this is a structured description, not a visual mockup (image generation for web mockups is post-MVP).
- **Inngest step:** `visual-design`

> **Design fidelity note:** In MVP, the Designer produces structured design specifications (layout descriptions, component hierarchy, spacing, colors, typography sizes). This is sufficient for the Web Developer to build from. Visual mockup generation (using image gen APIs to produce actual page previews) is a post-MVP enhancement that would add a visual verification step between design and development.

#### Gate 2: Visual Design

- **Central question:** "Does the visual design serve the content and the brand? Will users navigate intuitively toward conversion actions?"
- **Who evaluates:**
  - Creative Director — evaluates coherence with creative direction: visual rhythm, hierarchy, whitespace, emotional tone, interaction principles reflected in the design
  - Brand Guardian — Visual Identity Review skill (Sonnet): color palette application, typography, imagery style, overall visual consistency with Brand DNA
- **Inngest step:** `gate-2-visual`

**On CD "iterate":** Designer receives feedback, adjusts specific pages. 3+3 rule applies.
**On Brand Guardian "fail":** Designer receives brand fix_guidance.

> **This is the last creative checkpoint.** After G2, the Web Developer builds what was approved. Changes after G2 are expensive (rebuilding code). The CD and Brand Guardian should be thorough.

#### Step 5: Development

- **Who:** Web Developer (Sonnet, Tier A) — skill varies by site type (Static Site, CMS Site, or Microsite)
- **Input:** Approved copy + Approved design + Brief (technical requirements, integrations)
- **What happens:** Web Developer generates functional code. Takes the structured design specs and approved copy and produces deployable code. Integrates email capture, analytics, forms, and other integrations specified in the brief. If the site includes a blog (DEC-221), builds the CMS structure: templates, categories, listing pages, individual post template.
- **Skills:**
  - **Static Site:** Next.js static export or HTML/CSS/JS. For landing pages, product pages, microsites without dynamic content.
  - **CMS Site:** Next.js with headless CMS integration (or markdown-based for MVP). For sites with blogs, regularly updated content sections.
  - **Microsite:** Lightweight, single-purpose. Often campaign-tied with an expiration or redirect plan.
- **Output:** Functional code, ready for deployment. Includes: all pages, responsive implementation, integrations, CMS setup if applicable.
- **Inngest step:** `development`

#### Step 6: QA

- **Who:** System functions (no LLM — automated tests)
- **Input:** Built site in staging/preview environment
- **What happens:** Automated verification battery:
  - Responsive check: renders correctly on desktop, tablet, mobile viewport sizes
  - Performance: page load time, asset optimization, Lighthouse score
  - Links: all internal and external links resolve
  - Forms: email capture submits correctly, validation works, confirmation displays
  - SEO basics: meta titles/descriptions present, heading hierarchy correct, sitemap generated
  - Accessibility basics: color contrast, alt text presence, keyboard navigation, ARIA labels
  - Integration verification: analytics fires, email capture connects to provider, embeds load
- **Output:** QA report with pass/fail per check + details on failures
- **Inngest step:** `qa`

#### Gate 3: Site Functioning

- **Central question:** "Does the built site match what was approved, and does everything work?"
- **Who evaluates:**
  - QA report — system functions from Step 6 (automated). If any critical check fails, gate fails automatically.
  - Creative Director — visual verification: does the implemented site look like the approved design? This is the "translation check" — ensuring the Web Developer didn't lose fidelity going from design spec to code. (DEC-223)
- **Inngest step:** `gate-3-functioning`

**On QA failure:** Web Developer receives specific failure report, fixes. 3+3 rule applies.
**On CD visual mismatch:** Web Developer receives feedback on specific pages/components, adjusts.

> **No Brand Guardian at G3.** Brand was validated at G1 (text) and G2 (visual). G3 verifies implementation fidelity, not brand consistency. If something looks off-brand at G3, it means the Web Developer deviated from the approved design — the fix is implementation, not brand re-evaluation.

#### Step 7: Deploy

- **Who:** System function (no LLM)
- **What happens:** Site deployed to hosting (Vercel for Next.js sites). DNS configured if domain provided. SSL verified. Final live checks (site loads, forms work, analytics fires). Output indexed in Output Registry (DEC-130) with summary embeddings.
- **Output:** Live site URL, project status updated, notification sent to client
- **Inngest step:** `deploy`

---

## 4. Continuous Mode (DEC-220)

After the site is deployed (project mode complete), the Web Motor enters continuous mode. Three types of operations, each with a different pipeline:

### 4.1 Blog Post (new content into existing CMS)

Triggered by: Strategist brief, client request via MARA, scheduled content calendar.

```
BRIEF → WRITER → [G1 simplified] → DESIGNER (optional) → PUBLISH via CMS
```

- **Brief:** Topic, keywords, target audience, SEO intent, whether custom imagery is needed.
- **Writer:** Blog Post skill. Produces: title, body (structured with headings), meta description, tags/categories. Follows Brand DNA voice and existing blog tone.
- **G1 simplified:** Brand Guardian Textual Voice Review. CD evaluation only if the post is flagged as high-importance or campaign-tied. For routine posts, Brand Guardian alone is sufficient.
- **Designer (optional):** If the post needs a custom hero image, infographic, or visual element. Uses the site's existing visual system. If no custom visuals needed, post uses default templates.
- **Publish:** System function pushes content to CMS. No Gate 2 or Gate 3 — the CMS and templates were already validated during project mode.

**Inngest function:** `web-motor/blog-post` (separate, lighter function than the main pipeline).

### 4.2 New Page (adding to existing site)

Triggered by: business need (new product, new service, campaign landing page).

```
BRIEF → CD → WRITER → [G1] → DESIGNER → [G2] → WEB DEV → [G3 reduced] → DEPLOY
```

Full pipeline but G3 is reduced — only verifies the new page and its integration with existing navigation, not the entire site.

**Inngest function:** `web-motor/new-page` (or reuses main pipeline with a `scope: "page"` parameter).

### 4.3 Content/Design Update

Triggered by: performance data (low conversion), brand evolution, seasonal update, client request.

```
Change → [Relevant gate] → WEB DEV → DEPLOY
```

- **Copy update:** Writer produces new copy → G1 (Brand Guardian) → Web Dev implements → deploy.
- **Design update:** Designer produces new design → G2 (CD + Brand Guardian) → Web Dev implements → deploy.
- **Technical fix:** Web Dev fixes directly → QA → deploy (no creative gates needed).

**Inngest function:** `web-motor/update` (lightweight function with conditional steps based on update type).

---

## 5. Gate Architecture

### 5.1 Evaluation Matrix

At each gate, the Creative Director and Brand Guardian evaluate in parallel (separate Inngest steps via `step.run`). Their evaluations are orthogonal:

| Brand Guardian | Creative Director | Combined meaning | Action |
|---|---|---|---|
| Pass | Advance | On-brand AND creative quality good | Proceed to next step |
| Pass | Iterate | On-brand but weak execution | Agent retries with CD feedback |
| Warning | Advance | Generic but acceptable → proceed with warning logged | Proceed, warning tracked |
| Fail | Advance | Good creative quality but off-brand | Agent retries with Brand Guardian fix_guidance |
| Fail | Iterate | Off-brand AND weak execution | Agent retries with both feedback |

Both must be non-fail for the pipeline to advance.

### 5.2 Gate Summary

| Gate | After | Central question | Cost if fails | Max iterations (3+3) |
|---|---|---|---|---|
| G1 | Copy | Does the creative direction + copy work? Is it viable? | Low (only LLM tokens) | 6 |
| G2 | Visual Design | Does the design serve the content and brand? | Medium (design tokens) | 6 |
| G3 | Development | Does the built site match approvals and function correctly? | High (development tokens) | 4 |

**Cost escalation principle (same as Video Motor):** Max iterations decrease as cost increases. Demanding early gates save money downstream. A poor copy that passes G1 wastes all design + development tokens.

### 5.3 The 3+3 Rule

Same pattern as all creation motors:

**Attempts 1-3 (normal):** The agent that produced the failing artifact retries with feedback from CD/Brand Guardian injected as `upstream_feedback`.

**Attempts 4-6 (leader adjustment):** The Creative Director is re-invoked to produce an adjusted Creative Direction. This addresses situations where the problem is the direction itself, not execution quality. Writer or Designer then retries under the new direction.

**After attempt 6:** Human escalation. Project flagged in Admin Portal Gate Review queue. The admin (founder in MVP) reviews and provides direction.

**Counter scope:** Per gate, not cumulative across the pipeline.

---

## 6. Agent Details

### 6.1 Creative Director (Transversal — Web Direction Skill)

**Identity:** Agent with tools. Opus, Tier A. Shared across all creation motors. For Web, loads the Web Direction skill.

**Web Direction skill — what it produces:**
- Visual direction applied to web: how Brand DNA's visual system translates to screen layouts, whitespace, visual rhythm
- Tonal direction per page type: home (inspiring/confident), about (personal/trustworthy), product (clear/persuasive), blog (conversational/expert), contact (warm/accessible)
- User flow: emotional journey through the site architecture
- Interaction principles: how the site feels to use (not technical specs — mood/intent)
- References: 2-5 reference sites capturing aspects of the intended direction

**Tools:**
- Read Brief — access site architecture and objectives
- Read Brand DNA — access complete brand identity
- Update Creative Direction — write/update the direction document
- Read Copy (at G1) — evaluate writer's output against direction
- Read Design (at G2) — evaluate designer's output against direction
- Read Built Site (at G3) — visual verification of implementation

**prompt_registry entry:** `agent: creative-director`, `skill: web-direction`

### 6.2 Writer (Transversal — Web Copy Skill)

**Identity:** Agent with tools. Sonnet, Tier A. Shared with Video Motor (script skills), Graphic Design Motor, Audio Motor, etc.

**Web Copy skill — what it produces:**
- Per page: headline hierarchy (H1, H2, H3), body copy, CTAs (primary + secondary), microcopy (button labels, form placeholders, navigation labels, footer text)
- SEO elements: meta title, meta description, structured data hints
- Content organized by page following the site architecture from the brief

**Blog Post skill (continuous mode) — what it produces:**
- Title, subtitle, body with heading structure, meta description, tags/categories, suggested internal links
- Follows established blog tone (derived from Brand DNA + Creative Direction)

**Tools:**
- Read Brief — access site architecture, audiences, conversion objectives
- Read Creative Direction — access tonal direction
- Read Brand DNA — access verbal identity, voice guide, do's and don'ts
- Update Copy — write/update copy document per page

**prompt_registry entries:** `agent: writer`, `skill: web-copy` | `agent: writer`, `skill: blog-post`

### 6.3 Designer (Transversal — Web Design Skill)

**Identity:** Agent with tools. Sonnet, Tier A (DEC-187). Shared with Video Motor (graphics/compositing skills), Graphic Design Motor.

**Web Design skill — what it produces:**
- Per page: layout structure (grid, sections, component hierarchy), typography sizes and weights, color application, spacing system, imagery direction (what type of image/illustration goes where)
- Responsive behavior: how the layout transforms for mobile and tablet
- Component library: reusable elements across pages (header, footer, cards, buttons, forms)
- Interactive states: hover, focus, active states for interactive elements (described, not animated)

**Tools:**
- Read Brief — access site architecture, integrations
- Read Creative Direction — access visual direction, interaction principles
- Read Brand DNA — access visual system (colors, typography, imagery style)
- Read Approved Copy — design around the actual content
- Update Design — write/update design specifications per page

**prompt_registry entry:** `agent: designer`, `skill: web-design`

### 6.4 Web Developer (New Transversal Agent — DEC-214)

**Identity:** Agent with tools. Sonnet, Tier A (consumes Brand DNA, approved designs, and approved copy — all confidential client data).

**Why a new agent (DEC-219):** No existing agent has the judgment needed to translate visual design + copy into functional, performant, accessible code. This is not a system function — the Web Developer makes decisions about implementation approach, component architecture, performance optimization, and integration patterns.

**Skills:**

| Skill | Purpose | When used |
|---|---|---|
| **Static Site** | Next.js static export or HTML/CSS/JS. No server-side logic. | Landing pages, product pages, microsites, simple complete sites |
| **CMS Site** | Next.js with content management. Blog templates, content structure, authoring workflow. | Sites with blogs, news sections, regularly updated content |
| **Microsite** | Lightweight, campaign-specific. Potentially temporary with redirect plan. | Campaign landing experiences, event sites, seasonal promotions |

**Tools:**
- Read Approved Copy — access all page copy
- Read Approved Design — access all design specifications
- Read Brief — access technical requirements, integrations
- Read Brand DNA — access visual system for CSS/style implementation
- Write Code — generate source files
- Configure Integration — set up email capture, analytics, forms, embeds
- Deploy Preview — push to staging environment for QA

**prompt_registry entries:** `agent: web-developer`, `skill: static-site | cms-site | microsite`

---

## 7. Artifact Storage

All artifacts stored on Cloudflare R2 with tenant isolation.

**Path structure:** `{tenantId}/projects/{projectId}/{step}/`

| Step | Artifacts | Path |
|---|---|---|
| Brief | Raw brief, reference files, content inputs | `.../brief/` |
| Creative Direction | Creative direction document, reference site captures | `.../creative-direction/` |
| G1 | Gate evaluation results (CD + Brand Guardian JSON) | `.../gates/g1/` |
| Copy | Copy document per page, SEO elements | `.../copy/` |
| Visual Design | Design specs per page, component library, responsive notes | `.../design/` |
| G2 | Gate evaluation results + CD sign-off | `.../gates/g2/` |
| Development | Source code, configuration files | `.../development/` |
| QA | QA report, Lighthouse scores, screenshots | `.../qa/` |
| G3 | Gate evaluation results + QA report + CD visual verification | `.../gates/g3/` |
| Deploy | Deployment record, live URL, final verification | `.../deploy/` |

**Versioning:** Each iteration (3+3 rule) creates a new version within the step folder. Version naming: `v{attempt_number}`.

**Output Registry integration (DEC-130):** On deployment, key artifacts indexed in Output Registry with summary embeddings: final site URL, copy document, design specs, creative direction. Enables MARA (Fase 6) to reference the site in client conversations.

---

## 8. External API Integrations

The Web Motor has significantly fewer external API dependencies than the Video Motor.

| Capability | Provider(s) | Used in steps | MVP approach |
|---|---|---|---|
| Hosting/Deploy | Vercel | Deploy (Step 7) | Direct integration via Vercel API for Next.js sites |
| Email capture | Mailchimp, ConvertKit, Resend | Development (Step 5) | Abstract behind `EmailProvider` interface. Embed signup form. |
| Analytics | Google Analytics, PostHog | Development (Step 5) | Inject tracking scripts. Abstract behind `AnalyticsProvider` interface. |
| Image assets | Unsplash, brand asset library | Development (Step 5) | MVP: placeholder + brand assets from R2. Post-MVP: image generation for custom imagery. |
| CMS | Headless CMS or markdown | Development (Step 5) | MVP: markdown-based (no external CMS dependency). Post-MVP: headless CMS integration. |

**No stub-first strategy needed.** Unlike Video Motor where video/image generation APIs need stubs, the Web Motor's external dependencies are standard web infrastructure (hosting, email, analytics) that work from day one.

---

## 9. Configurable Autonomy

Same pattern as all motors:

| Mode | AI can do automatically | Requires human approval |
|---|---|---|
| **AI decides + human supervises** | Pass gates, iterate within 3+3, choose design variants | Human escalation after 3+3, budget overruns |
| **AI recommends + human approves** | Nothing — all gates generate recommendations | Every gate requires explicit human approval |

**Gate-level enforcement:**
- In "AI decides" mode: gates evaluate and advance/iterate automatically. Admin sees progress in real-time via SSE.
- In "AI recommends" mode: every gate result is queued in Admin Portal Gate Review. Pipeline pauses (`step.waitForEvent`) until admin approves.

**Web-specific note:** There is no equivalent to Video Motor's G3 client approval (storyboard review). For Web, the client sees the final deployed site. Client feedback enters as a content/design update (continuous mode §4.3), not as a gate within the initial pipeline. This keeps the pipeline moving — the client interacts with the live result, not intermediate artifacts.

**Configuration:** Stored per tenant in `motor_settings` table. Can be set globally or per project.

---

## 10. Token Economics

### 10.1 Estimated Token Consumption Per Site

Estimates for a typical 5-7 page corporate/product site with normal gate passage (1-2 iterations max).

| Component | Input tokens | Output tokens | Model | Invocations | Est. total |
|---|---|---|---|---|---|
| Creative Director (direction + G1 + G2 + G3) | ~4K | ~1.5K | Opus | 4-6 | ~22-33K |
| Writer (all pages) | ~5K | ~4K | Sonnet | 1-3 | ~9-27K |
| Brand Guardian (G1 + G2) | ~5K | ~0.3K | Sonnet | 2-4 | ~10-21K |
| Designer (all pages) | ~6K | ~4K | Sonnet | 1-3 | ~10-30K |
| Web Developer | ~8K | ~10K | Sonnet | 1-3 | ~18-54K |
| **Total LLM tokens** | | | | | **~69K-165K** |

**Cheaper than Video Motor.** No external API costs for generation (no image gen, video gen, TTS). The bulk of the cost is the Web Developer's output tokens (generating code). A landing page (1 page) could be as low as ~20-40K total tokens.

**Blog post (continuous mode):** ~5-15K tokens per post (Writer + Brand Guardian). Very lightweight.

### 10.2 Token Budget Per Plan

- Starter ($99): ~$250 token budget → ~2-4 landing pages/month OR 1 small site + several blog posts
- Pro ($249): ~$700 token budget → ~1-2 complete sites/month + regular blog content
- Agency ($599): ~$2,000 token budget → multiple sites + continuous blog/update operations

---

## 11. Site Types and Pipeline Variations

| Site type | Pages | Blog CMS | Typical integrations | Pipeline notes |
|---|---|---|---|---|
| **Landing page** | 1 | No | Email capture, analytics | Fastest pipeline. Single-page copy + design. |
| **Microsite** | 2-5 | No | Analytics, social embeds, campaign tracking | Campaign-specific. May have expiration/redirect. |
| **Corporate site** | 5-15 | Optional | Email, analytics, contact forms, maps | Standard pipeline. Multiple page types. |
| **Product site** | 3-10 | Optional | Email, analytics, product-specific CTAs | Conversion-focused. Feature pages + pricing. |
| **Blog-first site** | 3-5 + blog | Yes | Email, analytics, RSS, social sharing | CMS Site skill. Blog structure is key deliverable. |

The Web Developer's skill selection (Static Site vs CMS Site vs Microsite) is determined by the brief during Step 1 based on site type and whether a blog is included.

---

## 12. Blog CMS Specification (DEC-221)

When the brief includes a blog, the Web Developer (CMS Site skill) builds:

**Structure (project mode):**
- Blog listing page with pagination
- Individual post template with: title, date, author, body (markdown), featured image slot, tags/categories, related posts
- Category/tag archive pages
- RSS feed generation
- SEO: structured data (Article schema), sitemap inclusion

**Content management (continuous mode):**
- Blog posts are authored by the Writer (Blog Post skill) and published via CMS
- No code changes needed to publish a post — the CMS template handles rendering
- Images/videos referenced in posts come from the client's R2 storage or external URLs

**What the CMS is NOT (MVP):**
- Not a visual editor / drag-and-drop page builder
- Not a full headless CMS with user accounts and workflows
- MVP implementation: markdown files + Next.js rendering. Post-MVP: headless CMS integration for non-technical authoring.

---

## 13. Client Feedback Flow

1. Client sees deployed site in Client Portal (live URL)
2. Client provides feedback via MARA or admin-mediated communication
3. Feedback classified as: copy change, design change, technical fix, new feature request
4. Routed to appropriate continuous mode pipeline (§4.3)
5. Updated site deployed
6. Client notified

**Commentable elements in Client Portal (post-MVP):**
- Per-page feedback on live site
- Specific element annotations (click on element → comment)
- Blog post review before publish (in "human approves" mode)

---

## 14. New Tables Required

Beyond tables already defined in other specs:

| Table | Purpose | Created in |
|---|---|---|
| `web_projects` | Project metadata: tenant, status, current step, site type, brief reference, live URL | Fase 2 |
| `web_artifacts` | Artifact registry: project, step, version, R2 path, type, metadata | Fase 2 |
| `web_gate_results` | Gate evaluation results: project, gate, CD verdict, Brand Guardian verdict, attempt number, feedback | Fase 2 |
| `web_iteration_tracking` | 3+3 rule state: project, gate, attempt count, leader adjustment flag, escalation status | Fase 2 |
| `web_pages` | Page registry per project: page name, type, hierarchy position, status, current copy version, current design version | Fase 2 |
| `blog_posts` | Blog content: project (site), title, slug, body, status (draft/published), author, tags, published_at | Fase 2 |

Tables from other specs that the Web Motor uses:
- `prompt_registry` (DEC-145) — all agent × skill prompts
- `output_registry` (DEC-130) — delivered outputs with embeddings
- `creative_references` (Transversal Agents §9) — CD reference corpus
- `financial_tracking` (Transversal Agents §9) — token cost aggregation
- `motor_settings` — autonomy configuration per tenant

---

## 15. Relationship to BUILD_ORDER Fase 2

Per DEC-222, the Web Motor replaces the Video Motor as Fase 2. The BUILD_ORDER's Fase 2 section needs updating. Implementation components:

| Component | This spec section |
|---|---|
| 1. Pipeline as Inngest function | §3 (Pipeline), §3.2 (Inngest structure) |
| 2. Transversal agents on Vercel AI SDK | §2 (Agent Map), §6 (Agent Details) |
| 3. 3+3 rule implementation | §5.3 (3+3 Rule) |
| 4. Gate router (3 gates) | §5 (Gate Architecture) |
| 5. Artifact storage on R2 | §7 (Artifact Storage) |
| 6. External integrations (hosting, email, analytics) | §8 (External API Integrations) |
| 7. Configurable autonomy | §9 (Configurable Autonomy) |
| 8. Continuous mode (blog posts, updates) | §4 (Continuous Mode) |

**Orchestration validation:** The Web Motor validates the same Inngest patterns as the Video Motor would have: multi-agent pipeline, gates as decision points, 3+3 rule with leader adjustment, parallel evaluation (CD + Brand Guardian), configurable autonomy. Additionally, it validates the hybrid mode (project → continuous) which Video Motor does not have.

---

## 16. Decisions Summary

| Decision | Reference | Impact on Web Motor |
|---|---|---|
| DEC-064 | Agent vs Skill vs System Function | Transversal agents with web-specific skills. Web Developer is the only new agent. |
| DEC-140 | Inngest for orchestration | Pipeline is one Inngest function. Each step is an Inngest step. |
| DEC-141 | Vercel AI SDK v6 | Agents use agent-with-tools pattern. Brand Guardian uses generateText(). |
| DEC-145 | Prompt Registry | All agent prompts loaded from DB. Web-specific skills are separate entries. |
| DEC-147 | Helicone | All LLM calls proxied for cost/latency tracking. |
| DEC-148 | Inngest security | Webhook verification, Zod schema validation, tenant verification on every function. |
| DEC-149 | Multi-model tiers | All Web Motor agents are Tier A (Brand DNA = confidential). |
| DEC-174 | Model by creative leverage | CD = Opus. Writer, Designer, Web Developer = Sonnet. |
| DEC-184 | Showrunner eliminated | CD evaluates gates. No separate evaluator agent. |
| DEC-186 | Universal creation motor pattern | Brief → CD → Writer → G1 → Specialist → G2 → Adaptations. |
| DEC-187 | Designer is transversal | Same agent across Video, Graphic Design, Web, with different skills. |
| DEC-206 | Gate scaling by complexity | Web = 3 gates (between Graphic Design's 2 and Video's 4). |
| DEC-217 | Web Motor pipeline | Follows universal pattern + Web Dev + G3. |
| DEC-218 | Site architecture in brief | Brief includes pages/hierarchy. CD defines how to experience them. |
| DEC-219 | Web Developer agent | New transversal. Sonnet Tier A. Skills: Static, CMS, Microsite. |
| DEC-220 | Web Motor is hybrid | Project mode (build site) → continuous (blog posts, updates, pages). |
| DEC-221 | Blog vs blog post | Blog structure = project. Blog posts = continuous via CMS. |
| DEC-222 | BUILD_ORDER revision | Web Motor is Fase 2, replacing Video Motor. Founder-need-driven priority. |
| DEC-223 | Gate 3 is technical | Mostly system functions (QA) + CD visual verification. No Brand Guardian. |
