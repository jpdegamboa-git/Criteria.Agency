# criteria.agency — Project Status

> ⚠️ **Historical snapshot — April 7, 2026**
> This file describes the state of the prototype BEFORE the BUILD_ORDER was created.
> For current execution status, see `BUILD_TRACKER.md`.
> This file is kept as reference for what code exists from the prototype era.

> Last updated: April 7, 2026

---

## What's Built (Working Code)

### Infrastructure
- [x] Hono API server (port 3000) with 40+ endpoints
- [x] Next.js frontend (port 3001) with Tailwind v4
- [x] PostgreSQL database with 23 tables (Drizzle ORM)
- [x] Docker Compose for local PostgreSQL
- [x] CLI for project management
- [x] Cron scheduler for 7 subscription/nurture tasks
- [x] **Auth (Better Auth)** — email+password, session cookies, admin role, API key fallback
- [x] **Gemini rate limiter** — sliding window RPM/RPD tracking with auto-wait
- [x] **Vercel deploy prep** — SSL auto-detect, Dockerfile for Hono, production env docs
- [x] Startup security audit (reports configured vs mock services)
- [x] Design System document (`DESIGN_SYSTEM.md`)

### Landing Page (Next.js)
- [x] 8-section landing page with brand design system
- [x] Hero with floating diamonds, shimmer gradient, staggered animations
- [x] Trust bar, How It Works (3 steps), Quality Gates (5 gates dark section)
- [x] Pricing cards (3 tiers with early adopter pricing)
- [x] Gold gradient CTA section with dot grid texture
- [x] Sticky navigation with gold underline hover
- [x] Reusable UI components (button, card, badge, input)
- [x] Noise texture overlay, dot grid backgrounds, radial glows
- [x] Separate pricing page (`/pricing`)
- [x] SEO metadata + OpenGraph

### Waitlist System
- [x] Waitlist form component (name, email, company, video type)
- [x] Next.js API route (`/api/waitlist`) with duplicate prevention
- [x] Welcome email via Resend (console fallback)
- [x] Success page (`/waitlist/success`)
- [x] Database table with nurture step tracking
- [x] **Nurture email sequence** — 4 emails (day 3, 7, 14, 21), daily cron at 1pm

### Admin Dashboard (Next.js)
- [x] Auth-protected layout with session guard + sign-out
- [x] Dashboard homepage with 3 active sections
- [x] `/admin/projects` — project list with status filters, colored badges
- [x] `/admin/projects/[id]` — pipeline progress bar, artifacts/gates/executions tabs
- [x] `/admin/agents` — 20 agents in 8 teams, execution stats, success rates
- [x] `/admin/finances` — KPI cards, top entities, recent transactions
- [x] `/admin/finances/transactions` — filterable list (26 real bank transactions)
- [x] `/admin/finances/reconciliation` — two-panel matching with auto-match detection
- [x] `/admin/finances/import` — drag & drop CSV upload with preview/import flow
- [x] Sign-in / Sign-up pages (dark theme, gold accents)

### Client Delivery Portal
- [x] Token-based review pages (`/review/:token`)
- [x] Client comments + approve/revision flow
- [x] Email notifications (Resend, console fallback)
- [x] New version upload + client notification

### Pricing & Checkout
- [x] Stripe integration (checkout, webhooks, subscription schedules)
- [x] 30-day free trial, early adopter 40% discount
- [x] Success/cancel pages

### Video Pipeline (20 Agents — REAL)
- [x] 20 agent skill files (Phase 1)
- [x] Orchestrator: state machine, 5 gates, 3+3 rule, dispatcher
- [x] **Real execution with Gemini 2.5 Flash** (text agents producing real output)
- [x] Mock fallback for multimedia (image/video/audio — needs billing)
- [x] Context builder: skill files + project artifacts + multimodal attachments
- [x] Full pipeline tested end-to-end: brief → concept (G1 pass) → script (G2 fail→pass on retry) → visual_look → storyboard (G3 pass) → video_gen → edit → audio (G4 pass) → polish (G5 fail = quality system working)

### Model Provider Layer
- [x] 4 providers: Anthropic, Gemini, PiAPI, Mock
- [x] 10 models in catalog (3 Claude + 2 Gemini text + Imagen 4 + Veo 3 + Kling v2 + Seedance 2.0 + Gemini audio)
- [x] Provider registry with auto-fallback to mock per-provider
- [x] Async job polling for video/image/audio
- [x] Model defaults per agent (configurable)

### Business Agents
- [x] Financial Categorizer (waterfall: fixed → learned → alias → AI)
- [x] Payment Reconciler (4-level matching + AI)
- [x] Subscription Manager (6 cron tasks)
- [x] Content Writer (DC-001, Claude/Gemini + auto-review + revision cycles)
- [x] Brief Copilot (CP-001, guided conversation + brief generation)

### Financial Module
- [x] Banco General CSV parser with counterparty name extraction (tested with real bank files)
- [x] Business entity registry with pattern learning (18 entities auto-created from real data)
- [x] Invoice tracking (issued + received, many-to-many with transactions)
- [x] Bank sync service (parse → dedup → entity match → categorize → reconcile)
- [x] Finance API routes (transactions, payments, rules, subscriptions, entities, invoices)
- [x] Dashboard data endpoints (summary, cash flow, top entities)
- [x] **4 SSR dashboard pages:**
  - [x] `/admin/finances` — KPI cards + Chart.js cash flow chart
  - [x] `/admin/finances/transactions` — filterable transaction list
  - [x] `/admin/finances/reconciliation` — two-panel matching queue
  - [x] `/admin/finances/import` — drag & drop CSV upload with preview

---

## Capability Maturity (Client Value)

> Source: `docs/superpowers/specs/2026-04-07-capabilities-map-design.md`
> 49 capabilities mapped to 62 client pain points across 11 categories

| Level | Count | Capabilities |
|-------|-------|-------------|
| 🟢 Producción | 0 | — |
| 🟡 Beta | 4 | C-009 Video, C-044 Equipo virtual, C-045 Autonomía, C-047 Gates de calidad |
| 🟠 Alpha | 5 | C-011 Copywriting, C-013 Audio, C-018 Email, C-033 Dashboard, C-039 Control de gasto |
| 🔴 En desarrollo | 37 | Strategy, Brand, Distribution, Sales, Intelligence, most Production |
| ⚪ Roadmap | 3 | C-008 Manual de marca, C-043 Reutilización de activos, C-049 Reposicionamiento |

**Key gap:** The #1 client pain point ("No tengo estrategia") has 0 capabilities built. The Strategist and Brand Builder motors are fully designed but have no code. Phase 2 must address this.

**Next capabilities to activate (Tier PyME critical path):**
1. C-001 Diagnóstico de marketing (Strategist motor)
2. C-002 Plan de marketing completo (Strategist motor)
3. C-006 Construcción de marca desde cero (Brand Builder motor)
4. C-048 Diagnóstico de posicionamiento (Brand Builder + Strategist)
5. C-007 Guardián de marca (Brand Guardian transversal)

---

## What's NOT Built Yet (Code Needed)

### High Priority (blocks beta launch)
- [x] **Auth (Better Auth)** — login/signup, session-based auth, admin role (April 7, 2026)
- [x] **Nurture email sequence** — 4 automated emails on days 3, 7, 14, 21 (April 7, 2026)

### Medium Priority (needed for beta quality)
- [ ] **Real multimedia generation** — activate Imagen/Veo/PiAPI with billing (currently mock)
- [x] **Agent calibration** — 20 agents calibrated with CriteriaFilms brand voice + production constraints (April 7, 2026)
- [x] **Admin dashboard** — projects, agents, finances (KPIs, transactions, reconciliation, import) (April 7, 2026)
- [x] **Gemini rate limiter** — auto-wait for free tier limits (10 RPM Flash, 5 RPM Pro) (April 7, 2026)
- [x] **Vercel deploy prep** — SSL auto-detect, Dockerfile, .env.example production docs (April 7, 2026)
- [ ] **Payment groups** — link wire transfer fees to the income transaction they relate to
- [ ] **Invoice matching automation** — auto-suggest invoice↔transaction links by entity + amount + date

### Lower Priority (post-beta)
- [ ] Multi-tenancy + tenant isolation
- [ ] Event Bus cross-motor (Redis + BullMQ)
- [ ] Other 23 motors (Brand Builder, Comunicar, etc.)
- [ ] Full Client Portal (sidebar nav: Fundamentos, Inteligencia, Ejecución, Tools)
- [ ] Full Admin Portal (Mission Control)
- [ ] Conexion BG (real bank API)
- [ ] Mobile responsive landing page refinement

---

## Founder Tasks (Non-Code)

### Immediate (this week)
- [ ] **Add Anthropic billing** — https://console.anthropic.com/settings/billing — needed for Claude agents
- [ ] **Enable Google AI billing** — https://ai.google.dev/pricing — needed for Imagen, Veo 3, Gemini Pro
- [ ] **Test PiAPI billing** — confirm Kling/Seedance work with your key
- [ ] **Request Conexion BG** — contact Banco General for API access (enterprise service)
- [ ] **Set Stripe test keys** — https://dashboard.stripe.com/test/apikeys — run `npm run stripe:setup`
- [ ] **Set Resend API key** — https://resend.com — for real email delivery
- [ ] **Update FOUNDER_EMAIL** in .env to your real email

### GTM (Weeks 1-2)
- [ ] Deploy landing page (Vercel) — it's ready to deploy
- [ ] Produce 2-3 demo videos using the pipeline (dogfooding)
- [ ] Write LinkedIn profile bio with criteria.agency positioning
- [ ] First LinkedIn post: behind-the-scenes of AI video production
- [ ] Set up LinkedIn Ads account ($500-$1K/month budget)
- [ ] Share landing page URL with existing CriteriaFilms clients

### GTM (Weeks 3-6)
- [ ] Select 5-10 beta testers (CriteriaFilms clients + waitlist)
- [ ] Define beta onboarding flow (brief template, communication channel)
- [ ] Collect testimonials from beta deliveries
- [ ] Import bank statements monthly (CSV → `/admin/finances/import`)

### Business
- [x] ~~Download first CSV from Banco General, test bank import~~ DONE — 26 transactions imported
- [ ] Create expectedPayments for Enterprise clients
- [ ] Review subscription manager emails (check tone, content)
- [ ] Calibrate creative agents (T1-L, T2-002, TL-002) for your production style
- [ ] Review and categorize unmatched transactions in `/admin/finances/transactions`

---

## Specs & Plans Reference

| Document | Type | Status |
|----------|------|--------|
| `docs/superpowers/specs/2026-04-06-gtm-strategy-design.md` | GTM Strategy | Spec complete |
| `docs/superpowers/specs/2026-04-06-financial-module-design.md` | Financial Module | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-business-agents-design.md` | Business Agents | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-real-agents-design.md` | Real Agent Activation | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-csv-import-dashboard-design.md` | CSV Import + Dashboard | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-landing-waitlist-design.md` | Landing Page + Waitlist | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | 24-Motor Architecture | Spec complete (vision doc) |
| `docs/superpowers/specs/2026-04-06-security-framework-design.md` | Security Framework | Spec complete, P0 fixes pending |
| `docs/superpowers/specs/2026-04-06-schema-api-design.md` | Schema & API | Spec complete |
| `docs/superpowers/specs/2026-04-07-capabilities-map-design.md` | **Capabilities Map** | **62 pain points → 49 capabilities → 24 motors** |
| `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md` | **Client Portal Navigation** | **Dual view (Grid+Funnel), no sidebar, campaign hierarchy, Brand Health Score** |
| `docs/superpowers/specs/2026-04-08-business-model-design.md` | **Business Model** | **3 tiers ($99/$249/$599), token economy, ad intermediation, white-label, unit economics** |
| `docs/superpowers/plans/2026-04-06-business-agents.md` | Business Agents Plan | ✅ Executed (11 tasks) |
| `docs/superpowers/plans/2026-04-06-real-agents.md` | Real Agents Plan | ✅ Executed (11 tasks) |
| `docs/superpowers/plans/2026-04-06-csv-import-dashboard.md` | CSV Import Plan | ✅ Executed (10 tasks) |
| `docs/superpowers/plans/2026-04-06-landing-waitlist.md` | Landing Page Plan | ✅ Executed (10 tasks) |

---

## Tech Stack Summary

| Component | Technology | Status |
|-----------|-----------|--------|
| Backend API | Hono (TypeScript) | ✅ Running (port 3000) |
| Frontend | Next.js 15 + Tailwind v4 | ✅ Running (port 3001) |
| Database | PostgreSQL 16 + Drizzle ORM | ✅ 19 tables |
| AI (text) | Gemini 2.5 Flash | ✅ Active, producing real output |
| AI (text alt) | Claude (Anthropic) | ⚠️ Needs billing credits |
| AI (image) | Gemini Imagen 4 | ⚠️ Needs billing |
| AI (video) | Veo 3 + Kling + Seedance | ⚠️ Needs billing |
| AI (audio) | Gemini 2.5 Pro TTS | ⚠️ Needs billing |
| Payments | Stripe | ⚠️ Needs test keys |
| Email | Resend | ⚠️ Needs API key (console fallback working) |
| Bank | Conexion BG (Banco General) | 📋 CSV import working, API access pending |
| Hosting | Local development | 📋 Vercel-ready (frontend), Dockerfile ready (backend) |

---

## Session Stats (April 6-7, 2026)

| Metric | Count |
|--------|-------|
| Specs written | 9 |
| Plans written | 5 |
| Plans executed | 5 (50+ tasks total) |
| Commits | 50+ |
| Files created | 100+ |
| Database tables | 23 |
| API endpoints | 40+ |
| Next.js pages | 16 (landing, pricing, auth, admin, finances) |
| AI agents (code) | 25 (20 video + 5 business) |
| Capabilities mapped | 49 (4 Beta, 5 Alpha, 37 In dev, 3 Roadmap) |
| Client pain points mapped | 62 across 11 categories |
| Agents calibrated | 20 (with brand voice + production constraints) |
| Real AI executions tested | 13 (Gemini 2.5 Flash) |
| Real bank transactions imported | 26 |
| Business entities auto-created | 18 |

---

## Next Development Session Priority

1. **Deploy landing page** — `cd web && vercel` (Vercel-ready)
2. **Multimedia billing** — activate Imagen/Veo/PiAPI for real media generation
3. **Payment groups** — link wire transfer fees to income transactions
4. **Invoice matching** — auto-suggest invoice↔transaction links
5. **Agent Canvas** (weavy.ai-style) — visual node editor for agent orchestration
