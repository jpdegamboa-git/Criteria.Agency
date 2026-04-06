# criteria.agency — Project Status

> Last updated: April 6, 2026

---

## What's Built (Working Code)

### Infrastructure
- [x] Hono API server (port 3000) with 30+ endpoints
- [x] PostgreSQL database with 15 tables (Drizzle ORM)
- [x] Docker Compose for local PostgreSQL
- [x] CLI for project management
- [x] Cron scheduler for subscription tasks
- [x] Startup security audit (reports configured vs mock services)

### Client Delivery Portal
- [x] Token-based review pages (`/review/:token`)
- [x] Client comments + approve/revision flow
- [x] Email notifications (Resend, console fallback)
- [x] New version upload + client notification

### Pricing & Checkout
- [x] Pricing page with 3 tiers (`/pricing`)
- [x] Stripe integration (checkout, webhooks, subscription schedules)
- [x] 30-day free trial, early adopter 40% discount
- [x] Success/cancel pages

### Video Pipeline (20 Agents)
- [x] 20 agent skill files (Phase 1)
- [x] Orchestrator: state machine, 5 gates, 3+3 rule, dispatcher
- [x] Real execution with Gemini 2.5 Flash (text agents)
- [x] Mock fallback for multimedia (image/video/audio)
- [x] Context builder: skill files + project artifacts + attachments
- [x] Full pipeline tested: brief → concept → script → visual_look → storyboard → video_gen → edit → audio → polish (G5 fail = system working)

### Model Provider Layer
- [x] 4 providers: Anthropic, Gemini, PiAPI, Mock
- [x] 10 models in catalog
- [x] Provider registry with auto-fallback to mock
- [x] Async job polling for video/image/audio
- [x] Model defaults per agent (configurable)

### Business Agents
- [x] Financial Categorizer (waterfall: fixed → learned → alias → AI)
- [x] Payment Reconciler (4-level matching + AI)
- [x] Subscription Manager (6 cron tasks)
- [x] Content Writer (DC-001, Claude/Gemini + auto-review)
- [x] Brief Copilot (CP-001, guided conversation)

### Financial Module (Schema Only)
- [x] 7 tables: transactions, expectedPayments, clientAliases, categorizationRules, bankSyncLog, contentPieces, copilotSessions
- [x] Finance API routes (transactions, payments, rules, subscriptions)

---

## What's NOT Built Yet (Code Needed)

### High Priority (blocks beta launch)
- [ ] **Landing page** — single page with pitch, waitlist form, demo videos
- [ ] **Waitlist + email nurture** — form capture + 4-email sequence
- [ ] **CSV bank import** — parser for Banco General CSV, upload endpoint, dedup
- [ ] **Financial dashboard SSR** — cash flow, revenue by client, expenses by category, reconciliation queue
- [ ] **Auth (Better Auth)** — login/signup before opening beta to public

### Medium Priority (needed for beta quality)
- [ ] **Real multimedia generation** — Imagen/Veo/PiAPI with billing (currently mock)
- [ ] **Agent calibration** — tune skill files and prompts for production quality
- [ ] **Admin dashboard** — project list, agent monitoring, gate review UI

### Lower Priority (post-beta)
- [ ] Multi-tenancy + tenant isolation
- [ ] Event Bus cross-motor (Redis + BullMQ)
- [ ] Other 23 motors (Brand Builder, Comunicar, etc.)
- [ ] Full Client Portal (6 Spaces)
- [ ] Full Admin Portal (Mission Control)
- [ ] Conexion BG (real bank API)
- [ ] Mobile responsive

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
- [ ] Produce 2-3 demo videos using the pipeline (dogfooding)
- [ ] Write LinkedIn profile bio with criteria.agency positioning
- [ ] First LinkedIn post: behind-the-scenes of AI video production
- [ ] Set up LinkedIn Ads account ($500-$1K/month budget)

### GTM (Weeks 3-6)
- [ ] Select 5-10 beta testers (CriteriaFilms clients + waitlist)
- [ ] Define beta onboarding flow (brief template, communication channel)
- [ ] Collect testimonials from beta deliveries
- [ ] Pricing page live with early adopter discount

### Business
- [ ] Download first CSV from Banco General, test bank import
- [ ] Create first expectedPayment for an Enterprise client
- [ ] Review subscription manager emails (check tone, content)
- [ ] Calibrate creative agents (T1-L, T2-002, TL-002) for your production style

---

## Specs & Plans Reference

| Document | Type | Status |
|----------|------|--------|
| `docs/superpowers/specs/2026-04-06-gtm-strategy-design.md` | GTM Strategy | Spec complete |
| `docs/superpowers/specs/2026-04-06-financial-module-design.md` | Financial Module | Spec complete, schema built, dashboard pending |
| `docs/superpowers/specs/2026-04-06-business-agents-design.md` | Business Agents | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-real-agents-design.md` | Real Agent Activation | Spec + code complete |
| `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` | 24-Motor Architecture | Spec complete (vision doc) |
| `docs/superpowers/specs/2026-04-06-security-framework-design.md` | Security Framework | Spec complete, P0 fixes pending |
| `docs/superpowers/specs/2026-04-06-schema-api-design.md` | Schema & API | Spec complete |
| `docs/superpowers/plans/2026-04-06-business-agents.md` | Business Agents Plan | Executed, all 11 tasks done |
| `docs/superpowers/plans/2026-04-06-real-agents.md` | Real Agents Plan | Executed, all 11 tasks done |

---

## Tech Stack Summary

| Component | Technology | Status |
|-----------|-----------|--------|
| Backend | Hono (TypeScript) | Running |
| Database | PostgreSQL 16 + Drizzle ORM | 15 tables |
| AI (text) | Gemini 2.5 Flash / Claude | Gemini active, Claude needs billing |
| AI (image) | Gemini Imagen 4 | Needs billing |
| AI (video) | Veo 3 + Kling + Seedance | Needs billing |
| AI (audio) | Gemini 2.5 Pro TTS | Needs billing |
| Payments | Stripe | Needs test keys |
| Email | Resend | Needs API key |
| Bank | Conexion BG (Banco General) | Needs to request access |
| Hosting | Local development | Not deployed yet |

---

## Next Development Session Priority

1. **CSV bank import + financial dashboard** — see your money
2. **Landing page + waitlist** — start capturing leads
3. **Auth (Better Auth)** — secure the platform before beta
4. **Agent calibration** — tune prompts for your production style
5. **Multimedia billing** — activate Imagen/Veo/PiAPI for real media generation
