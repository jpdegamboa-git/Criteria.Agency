# criteria.agency — Build Tracker

> Tracking de ejecución del BUILD_ORDER.md
> Última actualización: 2026-04-10

**Checkbox legend:**
- `[x]` — done and validated against BUILD_ORDER spec
- `[~]` — prototype code exists, needs validation against BUILD_ORDER spec
- `[ ]` — not started

---

## Current Focus

- **Fase activa:** 8 — Video Motor
- **Último step completado:** Step 8.7 — Tests Level 1 + Level 2 (52/52 verdes, suite completa 373/373) — 2026-04-10
- **Próximo step:** Validación manual (ejecutar `pnpm seed` para Video Motor prompts) → Fase 8 completa
- **Blocker:** ninguno

> **Contexto:** Existe código de prototipo para todos los steps de Fase 0 y Fase 1. El código NO ha sido validado contra el BUILD_ORDER (que fue creado después del prototipo). La siguiente sesión de trabajo debe recorrer los steps de Fase 0 uno a uno y confirmar que cada uno cumple los criterios de validación del BUILD_ORDER antes de avanzar a Fase 1 formal.
>
> **Steps con código existente en Fase 0:** todos (0.1–0.9)
> **Steps con código existente en Fase 1:** todos (1.1–1.10)
> **Fase 2 (Web Motor):** sin código previo — implementación desde cero.

---

## Registro por fase

### FASE 0 — Cimientos
- **Status:** done
- **Inicio:** 2026-04-09
- **Completion:** —
- **Duración:** —
- **Fricción:** —
- **Prerequisitos founder:**
  - [x] PostgreSQL corriendo localmente (DATABASE_URL en `.env`)
  - [x] Decisión Neon vs Supabase tomada — se usa PostgreSQL local por ahora (DEC-143)
  - [x] `ANTHROPIC_API_KEY` agregado al `.env` — key configurada y URL corregida (`baseURL` explícito en `ai.ts`)
  - [ ] **Créditos Anthropic** — billing sin fondos. Agregar en https://console.anthropic.com/settings/billing. Bloquea live LLM tests.
  - [x] `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` en `.env` — observabilidad activa (DEC-228).

Steps:
- [x] 0.1 — Project scaffold + Hono base + Vitest — validado: health 200, security headers, JSON logging, 101/106 tests pass
- [x] 0.2 — Database + Drizzle ORM — validado: integración + schema tests, pgvector habilitado
- [x] 0.3 — Better Auth POC — validado: create user, create org, assign role, authenticate, HTTP-only cookies
- [x] 0.4 — Auth middleware + tenant isolation — validado: Level 1 security tests pass (401, 403, tenant isolation)
- [x] 0.5 — First tenant + seed data — validado: seed-validation tests pass, session contiene orgId correcto
- [x] 0.6 — Inngest setup — validado: Inngest handler registrado, Level 1 schema + tenantId tests pass
- [x] 0.7 — Vercel AI SDK v6 + Helicone — validado: generateText() + agent with tools pasan. 130/130 tests
- [x] 0.8 — Prompt Registry — validado: 18 tests verdes, tier enforcement DEC-149, CRUD endpoints, seed prompt
- [x] 0.9 — End-to-end loop — validado: LLM calls pasan, output_registry con tenant isolation. 130/130 tests

---

### FASE 1 — Brand Builder
- **Status:** done
- **Inicio:** pre-2026-04-09 (prototipo)
- **Completion:** 2026-04-09
- **Duración:** —
- **Fricción:** —
- **Prerequisitos founder:**
  - [ ] `ANTHROPIC_API_KEY` en `.env` — Brand Strategist es Tier A (Anthropic only, DEC-149). Sin esto, ningún agente LLM de esta fase puede ejecutarse.
  - [ ] `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` en `.env` — observabilidad de costos (DEC-228). Sin esto, las llamadas van directamente a Anthropic sin logging.
  - [ ] **Créditos Anthropic activos** — https://console.anthropic.com/settings/billing — Brand Strategist usa Claude Sonnet/Opus (Tier A). Sin créditos, ningún agente de esta fase ejecuta.

Steps:
- [x] 1.1 — Brand DNA data model — schema con 4 layers, versioning, tenant isolation, brand_dna + brand_dna_artifacts
- [x] 1.2 — Layer 0: Onboarding automático — Path A (scraper) + Path B (3 preguntas), función registrada en Inngest
- [x] 1.3 — Brand Health Score: Fundamentos axis — cálculo validado por rangos (L0:15-20, L1:40-50, L2:65-75, L3:85-95)
- [x] 1.4 — Brand Strategist agent: Discovery skill — validado: agent con tools escribe artifacts a DB. 130/130 tests
- [x] 1.5 — 3+3 rule for Brand Builder — estructura + leader adjustment + auto-retry via step.sendEvent()
- [x] 1.6 — Brand Strategist: Positioning + Archetype & Voice skills — validado con LLM. 130/130 tests
- [x] 1.7 — Layer 2 coherence gate — gate bloquea avance, auto-retry implementado
- [x] 1.8 — Brand Strategist: Identity Systems skill — validado con LLM. 130/130 tests
- [x] 1.9 — Layer 3 gate: Brand Guardian function — classifyText pattern, auto-retry via step.sendEvent()
- [x] 1.10 — End-to-end integration test — 130/130 suite completa. Pipeline simulation L0→L3 + gate + 3+3 + versioning + tenant isolation

---

### FASE 2 — Web Motor
- **Status:** done
- **Inicio:** 2026-04-10
- **Completion:** 2026-04-10
- **Duración:** —
- **Fricción:** (pendiente reporte founder)
- **Prerequisitos founder:**
  - [x] `ANTHROPIC_API_KEY` + billing activo — confirmado 2026-04-09
  - [x] `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` — confirmado 2026-04-09
  - [x] Cuenta Vercel creada + proyecto configurado — confirmado 2026-04-09
  - [x] Dominio configurado en Vercel — confirmado 2026-04-09
  - [x] Cloudflare R2 bucket + credenciales (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) — confirmado 2026-04-09

Steps:
- [x] 2.1 — Web Motor data model — 6 tablas (web_projects, web_pages, web_artifacts, web_gate_results, web_iteration_tracking, blog_posts) + migración aplicada
- [x] 2.2 — Pipeline as Inngest function — `web-motor-pipeline` Inngest function, 7 steps + 3 gates, tenant verification DEC-148
- [x] 2.3 — Creative Director: Web Direction skill — agent with tools (Opus, Tier A), prompt seeded en registry
- [x] 2.4 — Writer: Web Copy skill — agent with tools (Sonnet, Tier A), Web Copy + Blog Post skills seeded
- [x] 2.5 — Gate 1 implementation — CD + Brand Guardian en parallel, 3+3 rule, leader adjustment, escalation
- [x] 2.6 — Designer: Web Design skill — agent with tools (Sonnet, Tier A), prompt seeded
- [x] 2.7 — Gate 2 implementation — CD + Brand Guardian, DEC-223 pattern, 3+3 rule
- [x] 2.8 — Web Developer agent + Development step — 3 skills: static-site, cms-site, microsite (Sonnet, Tier A)
- [x] 2.9 — QA + Gate 3 implementation — system functions QA checks + CD visual verification, no Brand Guardian (DEC-223)
- [x] 2.10 — Deploy step — Vercel deploy stub, Output Registry indexing (DEC-130), live URL stored
- [x] 2.11 — Continuous mode: Blog Post pipeline — `web-motor-blog-post` function, Writer + Brand Guardian simplified G1 + publish
- [x] 2.12 — End-to-end integration test — 154/154 tests verdes, pipeline simulation L1→L7 + all gates + 3+3 + tenant isolation + blog post

---

### FASE 3 — Analyst + Output Registry
- **Status:** done
- **Inicio:** 2026-04-10
- **Completion:** 2026-04-10
- **Duración:** —
- **Fricción:** (pendiente reporte founder)
- **Prerequisitos founder:**
  - [x] `ANTHROPIC_API_KEY` — confirmado (Fase 2)
  - [x] `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` — confirmado (Fase 2)
  - [x] `GOOGLE_GEMINI_API_KEY` — confirmado 2026-04-10

Steps:
- [x] 3.1 — Brand Health Score — 3 ejes (Fundamentos/Ejecución/Oportunidad), cálculo diario (Inngest cron), recalculación on-demand, BHS routes (GET, history, recalculate). 190/190 tests
- [x] 3.2 — Dashboard aggregation + KPI + Threshold Alerting — recordKpiSnapshot con deltas, checkThresholds con 4 tipos (absolute/relative/sustained/compound), Dashboard payload con Funnel Matrix 12 celdas, Campaign Score por fase. 190/190 tests
- [x] 3.3 — Output Registry — indexOutput (Gemini 768-dim embeddings, fallback a listing sin key), searchOutputs (cosine similarity pgvector), listOutputs con filtros, tenant isolation DEC-151, migración 0006 (1536→768 dims). 190/190 tests

---

### FASE 4 — Strategist
- **Status:** in progress
- **Inicio:** 2026-04-10
- **Completion:** —
- **Duración:** —
- **Fricción:** —
- **Prerequisitos founder:**
  - [x] `ANTHROPIC_API_KEY` + billing activo — confirmado (Fase 2)
  - [x] `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` — confirmado (Fase 2)
  - [ ] Validación manual: ejecutar `pnpm seed` para sembrar prompts Strategist + PI benchmarks en DB de dev

Steps:
- [x] 4.1 — Strategist Diagnostic skill — `runDiagnosticSkill`, Inngest `strategist-diagnostic`, routes GET/POST /diagnoses, Tier A enforcement, 3+3 rule
- [x] 4.2 — Strategist Planning skill — `runPlanningSkill`, Inngest `strategist-planning`, G1 (financial) + G2 (brand coherence) gates, G3 client approval, routes /plans + approve/reject
- [x] 4.3 — Strategist Campaign Design skill — `runCampaignDesignSkill`, Inngest `strategist-campaign-design`, G4 self-eval, G6 client approval, Strategist→Video Motor brief pipeline, routes /campaigns + approve/reject
- [x] 4.4 — Platform Intelligence basic — `benchmarkQuery`, `patternQuery`, `batchBenchmarkQuery`, industry_benchmark cold start layer, K-anonymity, hierarchical fallback, routes /pi/benchmark + /pi/pattern
- [x] 4.5 — Tests Fase 4 — 75/75 tests verdes: Level 1 (auth 401, tenant isolation, Tier A enforcement, Inngest schema validation) + Level 2 (PI queries, diagnoses lifecycle, plans G3, campaigns G6, 3+3 escalation, Video Motor link)

---

### FASE 5 — Admin UI
- **Status:** done
- **Inicio:** 2026-04-10
- **Completion:** 2026-04-10
- **Duración:** —
- **Fricción:** —
- **Prerequisitos founder:**
  - [ ] `pnpm install` en `apps/admin` — instalar dependencias Next.js 15 + Better Auth client
  - [ ] `NEXT_PUBLIC_API_URL` en `apps/admin/.env.local` — apuntar a `http://localhost:3001`
  - [ ] Crear usuario admin en la DB de dev (o usar el existente del seed)

Steps:
- [x] 5.1 — Scaffold Next.js 15 app — package.json, next.config.ts, tsconfig, tailwind, postcss, globals.css
- [x] 5.2 — Admin layout — sidebar (colapsable 56/240px, secciones GLOBAL/CREATION/STRATEGY/etc.), header (alert bell, user avatar, sign out), auth server-side check con cookie forwarding
- [x] 5.3 — Mission Control page — KPI row (7 cards), motor health grid (18 motores), alert feed, gate queue
- [x] 5.3b — Gate Review pages — lista G3/G6 pending, plan detail (G1/G2/G3 status + summary), brief detail (G4/G6 status + concepto/budget/KPIs/creative), approve/reject forms (PUT API)
- [x] 5.4 — Agent Dashboard — agents page agrupado por motor, badge Tier A/B/C, estado configurado/no-configurado, link a Model Dashboard; Model Dashboard — PromptTable con inline edit modal, PUT /api/prompts/:id crea nueva versión
- [x] 5.5 — Alerts page (/admin/alerts) — listado con severity/status badges, summary KPIs, ordenado open→acknowledged→resolved
- [x] 5.6 — Strategist overview page (/admin/strategist) — diagnoses + plans (G3 status) + campaigns (G4/G6 status) con links a gate review
- [x] 5.7 — Brand Builder overview page (/admin/brand-builder) — brand DNA status, layer progress bar, artifacts por layer
- [x] 5.8 — Organizations page (/admin/organizations) — lista de orgs via Better Auth endpoint
- [x] 5.9 — install deps + verificación local (pnpm install en apps/admin, smoke test) — todas las páginas cargan sin errores (favicon 404 inofensivo)

---

### FASE 6 — MARA + Client Portal
- **Status:** done
- **Inicio:** 2026-04-10
- **Completion:** 2026-04-10
- **Duración:** —
- **Fricción:** (pendiente reporte founder)
- **Prerequisitos founder:**
  - [x] `pnpm install` en `apps/portal` — dependencias instaladas, build Next.js exitoso
  - [x] `NEXT_PUBLIC_API_URL` en `apps/portal/.env.local` — apunta a `http://localhost:3001`

Steps:
- [x] 6.1 — MARA data model — mara_play_pause, mara_sessions, mara_messages + migración 0007_mara_client_portal aplicada
- [x] 6.2 — Intent Classification skill — Haiku, 6 categorías (DEC-128), prompt en registry, fallback 'navigation' si no hay prompt
- [x] 6.3 — Response Composition + Conversation Management skills — Sonnet, session summaries, cross-session memory (DEC-133)
- [x] 6.4 — Play/pause toggle + invocation budget — server-side enforcement (DEC-131, DEC-157, DEC-158), atomic increments con sql``
- [x] 6.5 — MARA Inngest function + API routes — POST /mara/chat, POST/GET/DELETE /mara/session, GET/PUT /mara/play-pause; Inngest mara/session.end non-blocking
- [x] 6.6 — Scaffold apps/portal — Next.js 15 puerto 3002, layout sin sidebar, header 6 elementos, proxy /api/* → localhost:3001
- [x] 6.7 — Login + onboarding flow — modal bifurcado (has_brand/from_scratch), trigger Brand Builder L0
- [x] 6.8 — Grid de Campañas (home) — campaign cards con status, toggle Grid/Funnel, BHS badge
- [x] 6.9 — Funnel Matrix view — 4×3 celdas (stage × channel) con gaps visuales, toggle desde Grid
- [x] 6.10 — Brand Health Score page — 3 ejes (Fundamentos/Ejecución/Oportunidad), histórico 7/30/90 días
- [x] 6.11 — Mi Negocio page — Brand DNA viewer con 4 layers + progress bar, artifacts por layer
- [x] 6.12 — MARA chat UI — floating bubble, play/pause toggle UI, historial de mensajes, intent badge
- [x] 6.13 — SSE endpoint — GET /api/sse, heartbeat 30s, loop 60s para eventos futuros (pipeline_progress, mara_proactive, alerts, bhs_update)
- [x] 6.14 — Tests Fase 6 — 16/16 tests pasan: Level 1 (auth 401×5, tenant isolation, play/pause enforcement, Inngest schema) + Level 2 (session lifecycle×4, chat flow×3)

---

### FASE 7 — Hardening pre-beta
- **Status:** done
- **Inicio:** 2026-04-10
- **Completion:** 2026-04-10
- **Duración:** —
- **Fricción:** (pendiente reporte founder)
- **Prerequisitos founder:**
  - [ ] MFA activado en todas las cuentas de infra (Inngest, Neon/PostgreSQL, Vercel, Anthropic, Langfuse) — no requiere código, acción manual en dashboards
  - [ ] Railway account creada + proyecto configurado (para CI/CD Step 7.9)
  - [ ] `INNGEST_SIGNING_KEY` configurado en `.env` de staging/prod (Inngest Dashboard → App Settings)
  - [ ] Variables de entorno de prod configuradas en Railway + Vercel (sin `INNGEST_DEV=1`)

Steps:
- [x] 7.1 — Security P0 fixes: startup env validation, secure error handling, Inngest signing key enforcement
- [x] 7.2 — Rate limiting middleware: per-IP + per-user, diferentes límites por endpoint (authRateLimit 10/min, apiRateLimit 60/min, maraRateLimit 30/min)
- [x] 7.3 — MARA hardening: safety classifier (pattern + optional Haiku), system prompt re-injection, context size limit (10 turns / 8K chars)
- [x] 7.4 — Log sanitization: pino serializers + redact config para API keys, PII, passwords
- [x] 7.5 — SSE ya era tenant-scoped via auth middleware. Output Registry pre-filtering: tenantId filter ya aplicado en searchOutputs (DEC-151 validado)
- [x] 7.6 — Legal documents: 5 documentos (TOS, Privacy, DPA, AUP, Cookies) en GET /api/legal/:id — públicos, sin auth
- [x] 7.7 — Content Policy Checker: pattern matching + optional Haiku check, AI disclaimer injection (DEC-167)
- [x] 7.8 — Tests Fase 7: 40 tests (hardening.test.ts) — 321/321 suite completa verde
- [x] 7.9 — CI/CD: ci.yml (typecheck + unit tests + security audit) + deploy.yml (Railway API + Vercel Admin + Vercel Portal)

---

### FASE 8 — Video Motor
- **Status:** in progress
- **Inicio:** 2026-04-10
- **Completion:** —
- **Duración:** —
- **Fricción:** —
- **Prerequisitos founder:**
  - [x] `ANTHROPIC_API_KEY` + billing activo — confirmado (Fases 2-4)
  - [x] `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` — confirmado (Fase 2)
  - [x] Inngest org: Criteria Agency — confirmado 2026-04-10
  - [x] Neon proyecto: criteriaagency, región sa-east-1 — confirmado 2026-04-10
  - [x] RAILWAY_TOKEN en GitHub Secrets — confirmado 2026-04-10
  - [x] MFA activo en todas las plataformas — confirmado 2026-04-10
  - [ ] `INNGEST_SIGNING_KEY` en prod env (Railway) — disponible, pendiente configurar en Railway dashboard
  - [ ] PiAPI billing — para Kling/Seedance (video generation externa). Stub en MVP, activar cuando se necesite real video gen.

Steps:
- [x] 8.1 — Data model — `video_projects`, `video_artifacts`, `video_gate_reviews` en schema.ts + migración 0002 aplicada. Nota: `video_iteration_tracking` del spec §14 implementado como `gateIterations` jsonb en `video_projects` (simplificación MVP válida).
- [x] 8.2 — Pipeline Inngest function — `video-motor-pipeline` function, 11 steps + 5 gates, Zod schema, tenant verification DEC-148, step state = IDs only
- [x] 8.3 — Agent implementations — CD (Opus, Piece Direction), Writer (4 skills: classify/structure/draft/polish), DP (Visual Look/Storyboard/Video Gen Prompting), Visual Designer, Audio Producer (5 skills), Editor (5 skills), Quality Reviewer (3 skills)
- [x] 8.4 — Gate implementations — G1-G5, SR+BG parallel eval, 3+3 rule (attempts 4-6 = CD revision), escalation after attempt 6, G3 waitForEvent client approval
- [x] 8.5 — External APIs — Stub implementations (StubImageGenerator, StubVideoGenerator, StubVoiceGenerator, StubMusicGenerator) abstracted behind interfaces
- [x] 8.6 — API routes — POST/GET /projects, GET /projects/:id, GET /projects/:id/artifacts, GET /projects/:id/gates, POST /projects/:id/approve (G3 client approval)
- [x] 8.7 — Tests Level 1 + Level 2 — 52/52 tests verdes: auth 401 (6 endpoints), Inngest schema validation, Tier A enforcement, tenant isolation; Level 2: data model, pipeline lifecycle (11 steps), gate routing (advance/iterate/rethink), script sub-steps (4a-4d), G3 client approval, G4 diagnostic routing (shots/edit/audio), 3+3 escalation, delivery + output registry. Suite completa: 373/373 tests verdes.

---

## Founder tasks — sin dependencia de fase

Tareas que solo el founder puede hacer y que no bloquean ninguna fase específica del MVP. Completar cuando haya tiempo.

- [ ] `RESEND_API_KEY` en `.env` — para emails reales (nurture, notificaciones). El sistema tiene fallback a consola, no bloquea desarrollo.
- [ ] Stripe test keys configuradas — https://dashboard.stripe.com/test/apikeys — para checkout y webhooks. No se necesita hasta Fase 5+.
- [ ] `FOUNDER_EMAIL` actualizado en `.env` con email real.
- [ ] Solicitar acceso Conexion BG (API Banco General) — post-MVP, CSV import cubre el MVP.
- [ ] PiAPI billing — para Kling/Seedance (Video Motor, Fase 8+).

---

## Patrones observados

> Esta sección se llena conforme avanzan las fases. Registra regularidades útiles para proyectar duración de fases futuras.

(Sin datos aún — se llenará al completar las primeras fases con BUILD_ORDER.)

---

## Proyección

> Se actualiza después de completar cada fase, usando los patrones observados.

| Fase | Estimado | Real | Delta | Nota |
|------|----------|------|-------|------|
| Fase 0 | — | — | — | baseline — trabajo de prototipo, pendiente validación |
| Fase 1 | — | — | — | trabajo de prototipo, pendiente validación |
| Fase 2 | — | — | — | implementación desde cero |
| Fase 3 | — | — | — | |
| Fase 4 | — | — | — | |
| Fase 5 | — | — | — | |
| Fase 6 | — | — | — | |
| Fase 7 | — | — | — | |
