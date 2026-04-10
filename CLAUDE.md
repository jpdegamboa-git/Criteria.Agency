# criteria.agency — Instructions for Claude Code

## STOP. Read before writing any code.

1. Read `BUILD_ORDER.md` — the integrated implementation plan with phases and dependencies.
2. Read `SESSION_CONTEXT.md` — the complete project briefing (what is criteria.agency, current state, all specs).
3. Identify which FASE of BUILD_ORDER.md you are working on.
4. Read the specific spec document(s) referenced in that fase BEFORE implementing anything.
5. **Do NOT use specs not listed in the table below.** Many specs in `docs/superpowers/specs/` are superseded. See `docs/superpowers/specs/SPEC_INDEX.md` for the full vigency index.

## Immutable Stack Decisions

These are decided. Do not change, substitute, or "improve" them without explicit approval.

| Layer | Technology | Decision |
|-------|-----------|----------|
| Frontend | Next.js 15 (App Router) | — |
| Backend API | Hono (TypeScript) | — |
| Workflow orchestration | **Inngest** | DEC-140. No custom state machines. No BullMQ. |
| AI framework | **Vercel AI SDK v6** | DEC-141. Two patterns: generateText() for simple, agent with tools for complex. |
| Database | PostgreSQL + Drizzle ORM + pgvector | DEC-143, DEC-144 |
| Cache | Redis (Upstash) — session data, rate limiting, temp cache only | — |
| Auth | Better Auth (POC first → Clerk fallback) | DEC-142 |
| File storage | Cloudflare R2 | — |
| Video delivery | Bunny Stream | — |
| Error tracking | BetterStack | DEC-146 |
| LLM observability | **Langfuse** (SDK-wrapper via central helper in `lib/ai/llm.ts`) | DEC-228 (supersedes DEC-147 — Helicone closed new signups after Mintlify acquisition) |
| Prompt management | PostgreSQL table (prompt_registry) | DEC-145 |

## AI Model Rules

- **Tier A (confidential data):** Anthropic only. Brand Builder, Strategist, Analyst Diagnostic, MARA. No exceptions. DEC-149.
- **Tier B (general data):** OpenAI (training opt-out ON), Google Gemini (enterprise settings). DEC-149.
- **Tier C (public data only):** Any provider.
- **No automatic cross-tier fallback.** If Tier A is down, agents requiring Tier A pause. They do not fall back to Tier B/C. DEC-149.
- Use `generateText()` for: classification, summaries, simple extraction, Brand Guardian evaluations. Use agent with tools for: strategy, creative direction, evaluation. DEC-141.
- **Model by creative leverage (DEC-174):** Opus for Creative Director. Sonnet for executor agents + Brand Guardian. Haiku for classification. Configured per agent × skill in prompt_registry.

## Architecture Rules

- **Every Inngest function MUST:** verify webhook signature, validate event schema with Zod, verify tenantId against DB as first step. DEC-148.
- **Never store sensitive data in Inngest step state.** Pass IDs and references only. Each step reads from DB. DEC-148.
- **Every API endpoint MUST:** extract tenantId from authenticated session, filter all queries by tenantId.
- **Every agent reads its system prompt from prompt_registry.** Not hardcoded. DEC-145.
- **3+3 rule:** 3 normal attempts → 3 with leader adjustment → human escalation. Applies to all agents in all motors.
- **Motors define pipelines as Inngest functions.** Each pipeline step is an Inngest step. Gates are decision points within the function.

## Testing Rules (DEC-224 through DEC-226)

- **Framework:** Vitest + Inngest testing toolkit. No Cypress/Playwright until Fase 5.
- **Level 1 (security — automated, blocks deploy):** tenant isolation, auth, AI tier enforcement, Inngest security. Write BEFORE the code.
- **Level 2 (pipeline — regression):** end-to-end flows, gate routing, 3+3 rule, prompt registry. Write AFTER manual validation passes.
- **Level 3 (not tested):** LLM output quality, UI (until Fase 5), performance/load, trivial logic.
- **Every step follows the cycle:** Level 1 tests (if applicable) → implement → run Level 1 → validate manually → debug → convert to Level 2 → advance.

## What NOT to Do

- Do NOT add npm dependencies that aren't in the approved stack without asking.
- Do NOT create custom state machines or job queues. Use Inngest.
- Do NOT hardcode system prompts. Use the prompt_registry table.
- Do NOT build auth from scratch. Use Better Auth (or Clerk if Better Auth POC failed).
- Do NOT skip tenant isolation on any query or operation.
- Do NOT expose Inngest API keys to frontend. Backend only.
- Do NOT send confidential data (Brand DNA, strategies, diagnostics) to non-Tier-A providers.
- Do NOT implement features from post-MVP list (see BUILD_ORDER.md "What's NOT in the MVP") unless explicitly asked.

## Key Spec Documents

Read the relevant spec BEFORE implementing any component:

| Component | Spec to read |
|-----------|-------------|
| Brand Builder | `docs/superpowers/specs/2026-04-08-brand-builder-motor-design.md` |
| Web Motor | `docs/superpowers/specs/2026-04-09-web-motor-design.md` |
| Video Motor | `docs/superpowers/specs/2026-04-09-video-motor-design.md` |
| Analyst | `docs/superpowers/specs/2026-04-08-analyst-motor-design.md` |
| Strategist | `docs/superpowers/specs/2026-04-08-strategist-motor-design.md` |
| Platform Intelligence | `docs/superpowers/specs/2026-04-08-platform-intelligence-design.md` |
| MARA (copilot) | `docs/superpowers/specs/2026-04-09-mara-copilot-design.md` |
| Security | `docs/superpowers/specs/2026-04-06-security-framework-design.md` + `docs/superpowers/specs/2026-04-09-security-audit-v2.md` |
| Admin Portal | `PORTAL_SPECS.md` §2 |
| Client Portal | `docs/superpowers/specs/2026-04-08-client-portal-navigation-design.md` |
| Business Model | `docs/superpowers/specs/2026-04-08-business-model-design.md` |
| All 24 motors | `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` |
| Growth strategy | `docs/superpowers/specs/2026-04-09-growth-strategy.md` |
| Transversal agents (Brand Guardian, Creative Director, Showrunner) | `docs/superpowers/specs/2026-04-09-transversal-agents-design.md` |

## Build Tracker

`BUILD_TRACKER.md` tracks execution status of the BUILD_ORDER. It is the single source of truth for "where are we."

### Rules for Claude Code

1. **At session start:** Read `BUILD_TRACKER.md` → Current Focus section. This tells you the active fase, last completed step, next step, and any blockers.
2. **When starting a new fase:** Copy the step list from `BUILD_ORDER.md` into the tracker. Set status to "in progress." Record today's date as Inicio.
3. **When completing a step:** Mark the checkbox in the tracker. Update Current Focus (último step completado, próximo step).
4. **When encountering a blocker:** Update Current Focus → Blocker field with a clear description.
5. **When the founder reports fase duration:** Record it in the Duración field. Add fricción notes based on what you observed (propose, don't assume — the founder may correct).
6. **When a fase is complete:** Set status to "done." Record Completion date. Ask the founder: "¿Cuánto tiempo aproximado te tomó esta fase?" Record the answer. Update Patrones observados if you notice a useful pattern. Update the Proyección table.
7. **Never modify BUILD_ORDER.md based on tracking.** The plan and the tracker are separate documents.
8. **If BUILD_ORDER.md has been updated** (steps added, removed, or reordered), sync the tracker's step list for the active fase.
9. **Founder prerequisites:** When starting a new fase, review its steps and identify any actions that only the founder can perform (API keys, billing setup, manual deploys, business decisions). List them as "Prerequisitos founder" in the fase block. If during implementation a founder prerequisite is not met, update Current Focus → Blocker pointing to the specific prerequisite.

## Decision Log

All architectural decisions are in `DECISION_LOG.md` (DEC-001 through DEC-227). If you're unsure about a design choice, look up the relevant DEC for full rationale. Do not contradict existing decisions without explicit approval.

## Project Context

- Solo founder, bootstrapped, $0 capital
- Target market: LATAM SMBs
- 24 motors, ~29 agents + skills + system functions
- Token-based SaaS: Starter $99, Pro $249, Agency $599
- Observe free, think costs tokens, produce costs tokens (DEC-100)
- CriteriaFilms is a separate project (future client of criteria.agency)
