# criteria.agency — MARA Design (Client Copilot)

> Date: April 9, 2026
> Status: Approved design
> Scope: MARA — conversational interface agent, routing, interaction modes, token model, memory, Output Registry
> Decisions: DEC-127 through DEC-138

---

## 1. Context

MARA is the conversational interface of criteria.agency. Without it, the client interacts with the platform exclusively through visual UI — clicking, navigating, reading dashboards. With MARA, everything the visual interface offers is also accessible through natural language. They are parallel paths to the same system.

MARA was referenced in the Client Portal Navigation spec (§8) as "AI Copilot" — a chat bubble with configurable proactivity and the ability to control the entire platform by natural language. The Analyst spec (§15.1) identified the open question: "When the client asks 'how are my campaigns doing?' — does the Copilot route to the Analyst directly, or to the Strategist?" This spec resolves that question and designs the complete agent.

### The name

**MARA** — Marketing Agent for Routing & Assistance. A human name that works naturally across Latin America. "Pregúntale a Mara." "Mara detectó un problema en tu campaña." The name gives the system a personality without pretending to be human.

### Position in the platform

| Attribute | Value |
|-----------|-------|
| Category | Transversal (interface agent) |
| Type | **Agent** — exercises judgment on intent classification, conversation management, and response composition (DEC-127) |
| Mode | Continuous — always available when the client is in the portal |
| Agent | MARA (1) — 3 skills |
| System functions | Output Registry queries, UI context ingestion, session summary generation |
| Output | Conversational responses composed from other agents' outputs, or requests routed to other agents |
| Consumers | Client (exclusively — MARA is the only agent whose primary interface is conversational with the client) |
| Number | Agent #29 in the platform architecture |

### Key decisions made in this spec

| Decision | ID | Choice |
|----------|----|--------|
| Nature | DEC-127 | MARA is an agent (#29), not a system function or router. Exercises judgment on intent classification |
| Skills | DEC-128 | 3 skills: Intent Classification, Conversation Management, Response Composition |
| Routing taxonomy | DEC-129 | 6 intent categories mapping to existing architecture: data lookup, interpretation, strategic decision, brand action, operational action, navigation |
| Output Registry | DEC-130 | New shared infrastructure — indexed store of all agent outputs, queryable by the Copilot and other agents |
| Play/Pause model | DEC-131 | Toggle controls whether MARA can invoke token-consuming agents. Pause = free-only responses. Play = full capability |
| Token cost | DEC-132 | MARA itself is free (interface layer). Cost comes from what MARA invokes downstream |
| Conversational memory | DEC-133 | Session summaries between conversations. No full history storage. Summaries include pending actions |
| Interaction modes | DEC-134 | Three modes: consulta (Q&A), acción (task facilitation), exploratorio (guided by Brand Health Score) |
| Proactivity in play/pause | DEC-135 | Pause: proactive with free information only. Play: proactive with recommendations and strategic outputs |
| Tier access | DEC-136 | Available in all tiers. Depth of response reflects tier capabilities. Limit encounters become upsell moments |
| Transparency model | DEC-137 | Soft transparency — natural language about internal activity, not technical labels. Token cost visible on first use and via toggle state |
| Single face principle | DEC-138 | Client always talks to MARA. Backend agents are never exposed directly. MARA integrates responses as its own voice |

---

## 2. Core Concept: Interface Agent

MARA is unlike every other agent in the platform. Every other agent produces work product: the Strategist produces plans, the Analyst produces diagnostics, the Brand Builder produces Brand DNA. MARA produces nothing of its own. Its value is **translation** — from the client's language to the system, and from the system to the client's language.

### Why MARA is an agent, not a system function (DEC-127)

When the client says "esto no está funcionando," MARA must decide: does the client want a number (Analyst system function), an explanation (Analyst agent), a recommendation (Strategist), or is frustrated and wants someone to take charge (exploratory mode)? This classification of intent is genuine judgment that depends on conversational context, tone, what the client was looking at, and what was discussed earlier in the session. A rule-based router cannot do this reliably. Per DEC-064 taxonomy, judgment = agent.

### What MARA does

- Understands what the client wants (intent classification)
- Finds the answer or routes to the right agent (routing)
- Maintains conversational continuity (memory)
- Translates technical outputs into client-appropriate language (composition)
- Facilitates multi-step processes conversationally (action mode)
- Guides lost clients toward productive actions (exploratory mode)

### What MARA does NOT do

| Action | Who does it | Why not MARA |
|--------|------------|--------------|
| Analyze data | Analyst | MARA routes to the Analyst; it doesn't interpret data itself |
| Make strategic decisions | Strategist | MARA presents Strategist outputs; it doesn't generate strategy |
| Define brand | Brand Builder | MARA facilitates the Brand Builder conversation; it doesn't make brand decisions |
| Calculate scores | System functions | Mechanical work, no LLM needed |
| Produce content | Creation motors | MARA initiates creation workflows; it doesn't generate content |

---

## 3. Skills (DEC-128)

MARA's skills are not domain skills (marketing, data, brand) — they are interaction skills. The domain expertise lives in the specialized agents. MARA's expertise is in understanding the client and connecting them to the right specialist.

### 3.1 Intent Classification — "What does the client want?"

**Purpose:** Determine the type of request and route it to the correct backend system or agent.

**Taxonomy (DEC-129) — 6 intent categories:**

| Category | Example | Routes to | Token cost |
|----------|---------|-----------|------------|
| **Data lookup** | "¿Cuál es mi CTR en Meta?" | Analyst system functions (Interface 1) | Free |
| **Data interpretation** | "¿Por qué bajó mi engagement?" | Output Registry (recent diagnostic) → if miss, Analyst agent (trigger 6) | Free (diagnostics are internal) |
| **Strategic decision** | "¿Qué debería hacer con mi campaña?" | Output Registry (recent recommendation) → if miss, Strategist | Tokens (Strategist output) |
| **Brand action** | "Quiero cambiar mi propuesta de valor" | Brand Builder | Tokens |
| **Operational action** | "Crea una campaña de awareness en Instagram" | Framework Orchestrator | Tokens |
| **Navigation/meta** | "Ábreme el CRM" / "¿Cuántos tokens me quedan?" | System functions | Free |

**The key principle: MARA always searches existing outputs before invoking an agent.** Most questions already have an answer in a recent diagnostic, recommendation, or report. MARA checks the Output Registry first. Only if there's no relevant recent output does MARA invoke an agent. This makes most interactions fast and free.

**Ambiguity resolution:** When intent is unclear, MARA uses three signals:
1. **UI context** — what the client is looking at (see §8)
2. **Conversation history** — what was discussed earlier in this session
3. **Clarifying question** — as last resort, MARA asks. But only one question, not a survey.

### 3.2 Conversation Management — "What's the context?"

**Purpose:** Maintain conversational continuity within and across sessions.

**Within session:** Standard LLM context window. The conversation history is included in each MARA invocation. References like "¿y la versión B?" resolve from prior context without asking the client to repeat themselves.

**Across sessions (DEC-133):** Session summary model. When a session ends (inactivity timeout or logout), MARA generates a lightweight summary:

| Summary field | Content |
|---------------|---------|
| Topics discussed | Campaign X performance, budget reallocation, Brand Health Score |
| Decisions made | Client approved redirecting traffic to version A |
| Actions pending | Budget reallocation not yet executed. Monthly report requested for Friday |
| Client sentiment | Satisfied with Meta performance, concerned about Google |

On next session open, MARA loads the most recent summary and can proactively reference it: "Desde la última vez que hablamos: tu Brand Health Score subió 3 puntos y quedó pendiente la reasignación de presupuesto. ¿Por dónde quieres empezar?"

**Summary generation cost:** Free. It's internal system maintenance, not a client deliverable. Consistent with Analyst diagnostics being free (DEC-100 extended).

### 3.3 Response Composition — "How do I say this?"

**Purpose:** Take technical outputs from agents or system functions and translate them into natural, client-appropriate language.

**What this means in practice:**

The Analyst's diagnostic says: "CTR Meta: 2.3% (benchmark 1.8%, +27.8%). CTR Google Display: 0.4% (benchmark 0.9%, -55.6%). Version B conversion delta: -30% WoW. Pattern: post-click degradation concentrated in CTR-to-landing."

MARA says: "Tu campaña en Meta va muy bien — tu CTR está un 28% por encima del promedio de tu industria. Pero en Google Display estás por debajo. Y la versión B tuvo una caída del 30% esta semana, que parece estar relacionada con un problema en la landing page, no con el anuncio en sí."

Same information. Different language. The composition skill adapts to:
- **Client's tier** — Starter gets simpler language; Agency gets more technical detail
- **Client's history** — A client who's been on the platform 6 months understands "CTR" without explanation
- **Conversation tone** — If the client is asking casually, respond casually. If they're in a meeting and need data fast, be concise
- **Brand DNA language** — If the client's brand uses specific terminology, MARA can mirror it

---

## 4. The Single Face Principle (DEC-138)

The client always talks to MARA. Never to "the Strategist" or "the Analyst" directly. MARA integrates all backend responses as its own voice. The client experiences one continuous conversation with one entity.

### Soft transparency

MARA does not hide that work is happening behind the scenes — it communicates it in natural language:

| Instead of | MARA says |
|------------|-----------|
| "Invoking Strategist agent v2.1..." | "Déjame revisar tu estrategia..." |
| "Querying Analyst system function..." | "Consultando tus datos..." |
| "Routing to Brand Builder skill: Discovery" | "Vamos a trabajar en tu marca..." |
| "Output Registry hit: diagnostic_2026-04-07" | "Según el último análisis de tu campaña..." |

This achieves two things: the client feels there's real work happening (not just a chatbot pattern-matching), and the internal architecture stays invisible.

### When MARA reveals the system

Token cost moments. When MARA is about to invoke something that costs tokens and the client is in play mode, MARA can optionally mention it: "Para darte una recomendación estratégica actualizada necesito hacer un análisis más profundo. ¿Lo hacemos?" This is not required (the client already consented via play mode), but MARA can use it when the cost would be significant.

---

## 5. Play/Pause Model (DEC-131)

### The toggle

A visible toggle in the MARA chat bubble header. Always visible. The client knows at all times whether MARA is in play or pause.

### Play mode

MARA can invoke any agent or system function that the client's tier allows. No per-interaction permission needed. The client gave general consent by activating play. Data lookups, interpretations, strategic recommendations, brand actions, operational actions — all available.

### Pause mode

MARA responds only with free resources:
- Data lookups (Analyst system functions)
- Existing outputs from the Output Registry (recent diagnostics, recommendations, reports)
- Navigation and meta queries
- Proactive alerts about free information (qualified alerts, score changes)

When the client asks something that requires a paid invocation, MARA explains: "Para responderte eso necesitaría consultar al equipo de estrategia, lo que consume tokens. Ponme en play si quieres que lo haga."

### First-use onboarding

The first time the client opens MARA, before any interaction:

"Soy Mara, tu asistente de marketing. Puedo consultar tus datos y ayudarte a navegar la plataforma — eso es gratis, siempre. Cuando necesites que piense más a fondo — estrategia, diagnósticos nuevos, reportes — eso consume tokens de tu plan. Puedes ponerme en pausa cuando quieras y seguiré ayudándote con datos y navegación."

One message. Clear. Then the toggle appears and MARA is ready.

### Token counter

Next to the play/pause toggle, a subtle counter of tokens consumed in the current session. Not intrusive — visible if the client looks for it. Like a mobile data meter.

---

## 6. Token Cost Model (DEC-132)

Following DEC-100: observe is free, think costs tokens, produce costs tokens.

| Component | Token cost | Rationale |
|-----------|-----------|-----------|
| MARA intent classification | **Free** | Interface layer — part of "observe" |
| MARA response composition | **Free** | Translating existing outputs is interface, not thinking |
| MARA session summary generation | **Free** | Internal maintenance |
| Output Registry queries | **Free** | Retrieving existing outputs is observe |
| Data lookups (Analyst system functions) | **Free** | Per existing Analyst spec |
| Serving recent diagnostics from Output Registry | **Free** | Output already generated and paid for |
| Serving recent Strategist recommendations from Output Registry | **Free** | Output already generated and paid for |
| Invoking Analyst (new diagnostic via trigger 6) | **Free** | Per Analyst spec — diagnostics are internal |
| Invoking Strategist (new recommendation) | **Tokens** | Per Strategist spec — strategic outputs cost tokens |
| Invoking Brand Builder | **Tokens** | Per Brand Builder spec |
| Invoking creation workflow | **Tokens** | Per creation motor specs |
| Generating reports (Analyst Reporting skill) | **Tokens** | Per Analyst spec — client-facing deliverables cost tokens |

### The Output Registry efficiency

Because MARA checks existing outputs first, the effective cost of most conversations is zero. The Strategist already produced a recommendation on Monday. The client asks about it on Wednesday. MARA serves the existing recommendation — no new Strategist invocation needed. The client only pays when they need something genuinely new.

---

## 7. Output Registry (DEC-130)

### New shared infrastructure

The Output Registry is a new infrastructure component — an indexed store of all outputs produced by all agents and system functions. It is not owned by MARA; MARA is its primary consumer but not its only one.

### Why it's needed

The platform generates intelligence continuously: diagnostics, recommendations, alerts, reports, scores, Brand Guardian flags, Listener signals. Without a unified registry, each output lives in its originating motor's context and is only accessible via that motor's interface. The Output Registry makes all outputs queryable across the entire platform.

### What gets registered

Every output from every agent and system function that produces a discrete, consultable result:

| Source | Output types registered |
|--------|------------------------|
| Analyst (system functions) | KPI snapshots, threshold flags, Brand Health Score calculations, Campaign Score calculations |
| Analyst (agent) | Qualified alerts, processed diagnostics, campaign reports, monthly reports |
| Strategist | Marketing plans, campaign briefs, strategic adjustments, optimization recommendations, client intelligence |
| Brand Builder | Brand DNA artifacts (per layer), brand audit results |
| Brand Guardian | Consistency flags, approval/rejection decisions |
| Listeners | Signals (brand mentions, competitive moves, cultural trends, industry shifts) |
| Opportunity Agent | Opportunity briefs |
| Financial Agent | Budget status, ROI validations, spend alerts |
| Creative Director | Creative direction documents (per campaign version) |
| Showrunner | Campaign coherence validations |

### Metadata per entry

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier |
| `source_agent` | Which agent or system function produced this |
| `client_id` | Which client this belongs to |
| `output_type` | Diagnostic, recommendation, alert, report, score, flag, signal, plan, brief, artifact |
| `campaigns` | Related campaign IDs (if applicable) |
| `channels` | Related channels (if applicable) |
| `funnel_stages` | Related funnel stages (if applicable) |
| `created_at` | Timestamp |
| `expires_at` | When this output becomes stale (type-dependent) |
| `summary` | One-paragraph human-readable summary |
| `embedding` | Semantic embedding for similarity search |
| `content_ref` | Reference to the full output content |

### Staleness model

Not all outputs age equally:

| Output type | Freshness window | After expiry |
|-------------|-----------------|--------------|
| KPI snapshots | Until next ingestion cycle (4-6 hours) | Superseded by newer snapshot |
| Threshold flags | 48 hours | Stale — may no longer be relevant |
| Qualified alerts | 7 days | Archived — context may have changed |
| Processed diagnostics | 7 days (weekly cycle refreshes) | Superseded by next weekly diagnostic |
| Strategist recommendations | 14 days | Stale — conditions may have changed |
| Marketing plans | 90 days (quarterly cycle) | Superseded by next planning cycle |
| Campaign reports | Permanent | Historical record |
| Brand DNA artifacts | Permanent (until updated) | Current until explicitly changed |
| Listener signals | 72 hours | Stale — market signals are time-sensitive |
| Brand Health Score | Until next daily recalculation | Superseded |

When MARA queries the Output Registry, it considers freshness. A diagnostic from 2 days ago is served confidently. A diagnostic from 10 days ago gets a caveat: "El último análisis es de hace 10 días. ¿Quieres uno actualizado?"

### Query interface

The Output Registry exposes two query modes:

**Structured query:** "Give me the latest diagnostic for campaign X" — filters by source, type, campaign, recency.

**Semantic query:** "What do we know about engagement dropping?" — uses embedding similarity to find relevant outputs across types and sources.

MARA typically combines both: structured filter (this client, last 7 days) + semantic ranking (most relevant to the question).

---

## 8. UI Context

### How it works

When the client interacts with MARA, the frontend includes a context object with each message:

| Field | Content | Example |
|-------|---------|---------|
| `current_view` | Which view is active | `grid` / `matrix` / `campaign_detail` / `tool:crm` |
| `selected_campaign` | Campaign in focus, if any | `{ id: "camp_123", name: "Verano 2026" }` |
| `matrix_cell` | Matrix cell in focus, if in matrix view | `{ channel: "meta", stage: "awareness" }` |
| `active_filters` | Any active filters | `{ status: "active", date_range: "Q2" }` |
| `last_action` | Client's most recent UI action | `clicked_campaign_card` / `toggled_to_matrix` |

### How MARA uses it

UI context resolves ambiguity without asking. "¿Cómo va esto?" with `matrix_cell: { channel: "meta", stage: "awareness" }` and `selected_campaign: "Verano 2026"` becomes a precise data lookup: Meta awareness performance for campaign Verano 2026.

UI context is always included — it's a small JSON payload. MARA ignores it when irrelevant (e.g., the client asks "¿cuántos tokens me quedan?" — the current view doesn't matter).

### Bidirectional interaction

When MARA acts, the UI reflects the action. The client says "crea una campaña de awareness en Instagram" → the matrix view activates, the Meta × Awareness cell highlights, and the campaign creation form opens pre-populated. MARA explains what it prepared.

This bidirectionality is a frontend concern, not an agent design concern. MARA's response includes an optional `ui_action` field that the frontend interprets:

| Action type | Effect |
|-------------|--------|
| `navigate` | Switch view or open a tool |
| `highlight` | Highlight a cell, campaign, or element |
| `open_form` | Open a creation or editing form with pre-populated data |
| `show_data` | Display a specific metric or chart |
| `none` | No UI change — pure conversational response |

---

## 9. Three Interaction Modes (DEC-134)

### 9.1 Consulta — "Tell me something"

The client asks, MARA answers. Question-response flow. MARA talks more than the client.

**Pattern:** Client question → MARA queries (Output Registry or system function or agent) → MARA composes response → Client receives information.

**Escalation:** Consulta conversations naturally escalate from cheap to expensive. "¿Cómo va mi campaña?" (free) → "¿Por qué bajó?" (free if diagnostic exists) → "¿Qué hago?" (tokens). The play/pause toggle controls whether this escalation can happen.

### 9.2 Acción — "Do something"

The client wants to execute a task. MARA becomes a facilitator. The client talks more than MARA — MARA asks questions to collect inputs.

**Pattern:** Client intent → MARA identifies required inputs → MARA asks for missing inputs → Client provides → MARA confirms → MARA triggers action → MARA reports result.

**Example:**
- Client: "Quiero lanzar una campaña para el Día de las Madres."
- MARA: "Perfecto. ¿Para qué fecha necesitas que esté activa?"
- Client: "10 de mayo."
- MARA: "¿Qué objetivo: awareness, consideración, o conversión?"
- Client: "Awareness."
- MARA: "Voy a preparar una campaña de awareness para el Día de las Madres, activa para el 10 de mayo. El Strategist va a diseñarla con tu Brand DNA y los canales que tienes conectados. ¿Procedo?"
- Client: "Sí."
- MARA triggers Strategist Campaign Design skill → campaign brief created → pre-configured campaign appears in the Grid.

**This is the conversational equivalent of the "Nueva Campaña" form in the Grid.** Both paths produce the same object: a Campaign Brief.

### 9.3 Exploratorio — "Help me"

The client doesn't know what they want. No specific question, no clear action. "No sé qué hacer con mi marketing." "¿Qué me recomiendas?" "Estoy perdido."

**Pattern:** MARA reads the Brand Health Score → identifies the weakest axis → proposes a starting point → guides the client toward a concrete action.

**Example:**
- Client: "No sé por dónde empezar."
- MARA: "Tu score de salud de marca está en 42. Lo que más te beneficiaría ahora es fortalecer tus fundamentos — tu marca está en Layer 1 y eso limita lo que las campañas pueden lograr. ¿Quieres que trabajemos en definir mejor tu posicionamiento?"
- Client: "Sí."
- MARA initiates Brand Builder conversation (Layer 2 skill activation).

**The Brand Health Score is MARA's compass in exploratory mode.** It was designed to diagnose and drive engagement (Analyst spec §11, "the low score drives engagement"). MARA uses it conversationally to do exactly that.

**Fallback for mature clients:** If all three axes are high, MARA shifts to opportunity-driven exploration: "Tu marca está en buena forma. La Brújula detectó una oportunidad en [Listener signal]. ¿Quieres explorarla?" This routes to Strategist or Opportunity Agent outputs.

---

## 10. Proactivity (DEC-135)

Three levels, configurable by the client in Settings (from Client Portal Navigation spec §7):

### Silencioso

MARA only speaks when spoken to. No unsolicited messages. The chat bubble sits quietly.

### Moderado

MARA surfaces important free information proactively:
- Qualified alerts from the Analyst ("Tu campaña de Meta tiene una alerta de rendimiento")
- Brand Health Score significant changes ("Tu score subió 5 puntos esta semana")
- Pending actions from previous sessions ("Quedó pendiente la reasignación de presupuesto")
- Operational notifications that benefit from context ("Tienes 3 aprobaciones pendientes")

All of these are free — they reference existing outputs, not new agent invocations.

### Activo

Everything in Moderado, plus:
- Strategist recommendations surfaced proactively ("El Strategist detectó una oportunidad para optimizar tu presupuesto. ¿Quieres verla?")
- Opportunity briefs from the Opportunity Agent
- Proactive suggestions based on client behavior patterns ("Llevas 2 semanas sin revisar tu campaña de Google. ¿Quieres un resumen?")

**Cost of proactivity:** The proactive scanning (what's worth surfacing?) is a system function with simple rules: new qualified alerts not yet seen, score changes above threshold, pending actions from session summary, Strategist outputs not yet reviewed. This is deterministic — no LLM cost. MARA's LLM is only invoked to compose the message, which is a minimal cost classified as free (interface layer).

### Play/Pause interaction with proactivity

| Proactivity | Pause | Play |
|-------------|-------|------|
| Silencioso | Silent | Silent (only speaks when spoken to, but can invoke paid agents) |
| Moderado | Free alerts only | Free alerts only (play doesn't change moderado behavior — it enables paid responses to client-initiated questions) |
| Activo | Free alerts + suggestions to enable play | Free alerts + paid recommendations surfaced proactively |

---

## 11. Tier Differentiation (DEC-136)

MARA is available in all tiers. The chat bubble exists for everyone. What changes is depth:

### Starter

- Data lookups: full access
- Navigation: full access
- Existing outputs: available (limited by what Starter tier generates — no Strategist outputs, basic Analyst)
- Agent invocations: limited to Starter tier capabilities
- On hitting a limit: "Esa recomendación estratégica es una funcionalidad del plan Pro. ¿Quieres conocer los planes?"

### Pro

- Full MARA capability including Strategist and Analyst agent invocations
- Conversational Brand Builder access
- Session memory with pending actions
- All three proactivity levels

### Agency

- Everything in Pro
- Multi-brand context switching ("Háblame de la marca X" → MARA loads that brand's context)
- White-label MARA (client's branding, not criteria.agency branding)
- Advanced reporting via conversational request

### Upsell moments

Every time MARA hits a tier limit is a natural upsell opportunity. Not aggressive — informative. "Para un análisis de competencia necesitarías el plan Pro, que incluye acceso a los Listeners y la Brújula. ¿Quieres que te cuente más?" The same principle as the Brand Health Score driving engagement through gaps.

---

## 12. MARA During Onboarding

### Camino B — "Empiezo de cero"

When a new client chooses "Empiezo de cero" in the onboarding flow (Client Portal Navigation spec §9), MARA becomes the conversational interface to the Brand Builder's Discovery skill.

The client experiences a conversation with MARA. Internally, MARA is routing to Brand Builder, translating its structured outputs into conversational language, and collecting the client's responses to feed back to Brand Builder.

The client never knows they're "using the Brand Builder motor." They're talking to Mara about their business.

### Camino A — "Tengo marca"

After the automatic URL analysis generates a draft Mi Negocio, MARA can offer to walk the client through it: "Analicé tu sitio web y tus redes. Preparé un borrador de tu perfil de negocio. ¿Quieres que lo revisemos juntos?" This is MARA in acción mode — facilitating review and completion of the draft.

---

## 13. Relationship with Other Agents

### Integration map

| Agent/System | What it sends to MARA | What it receives from MARA |
|-------------|----------------------|---------------------------|
| **Analyst (system functions)** | KPI data, scores, dashboards (via Output Registry) | Data lookup queries |
| **Analyst (agent)** | Qualified alerts, diagnostics, reports (via Output Registry) | Context requests (trigger 6 expanded to include MARA-initiated) |
| **Strategist** | Plans, recommendations, campaign briefs (via Output Registry) | Strategic questions, campaign creation requests |
| **Brand Builder** | Brand DNA artifacts, audit results (via Output Registry) | Brand action requests, onboarding conversation |
| **Brand Guardian** | Consistency flags (via Output Registry) | Nothing directly |
| **Financial Agent** | Budget status, spend alerts (via Output Registry) | Nothing directly |
| **Listeners** | Signals (via Output Registry, filtered by Brújula) | Nothing directly |
| **Opportunity Agent** | Opportunity briefs (via Output Registry) | Nothing directly |
| **Framework Orchestrator** | Action confirmations, pipeline status | Operational action requests |
| **Output Registry** | Query results | Structured and semantic queries |

### Trigger expansion

The Analyst spec defined trigger 6 as "Strategist requests context." With MARA, this trigger expands: "Strategist or MARA requests context on behalf of client." The Analyst doesn't need to know whether the request came from the Strategist's own cycle or from MARA translating a client question. The interface is identical.

---

## 14. Autonomy Model

MARA's autonomy is **controlled by the play/pause toggle**, not by the per-motor autonomy configuration.

The per-motor autonomy setting ("AI decides + human supervises" vs "AI recommends + human approves") applies to the agents MARA invokes, not to MARA itself. If the Strategist is in "recommends + approves" mode, MARA will relay the Strategist's recommendation and ask the client to approve before executing — the same behavior as through the visual interface.

MARA itself doesn't need autonomy configuration because its outputs are conversational responses, not actions. When MARA invokes an action, the autonomy of the executing agent governs the approval flow.

---

## 15. Implementation Notes

### Priority

MARA is **not a prerequisite** for any other motor. Unlike the Analyst (prerequisite for Strategist) or Brand Builder (prerequisite for everything), the platform can function without MARA — clients use the visual interface.

However, MARA is a **high-impact differentiator**. The conversational interface is what makes criteria.agency feel like a virtual marketing director, not a SaaS dashboard. It should be implemented after the core motors but before public launch.

### Recommended build order

| Phase | Component | Type | Depends on |
|-------|-----------|------|------------|
| 1 | Output Registry (shared infrastructure) | System function | Database schema for output metadata + embeddings |
| 2 | MARA — Intent Classification skill | Agent | Output Registry + Analyst system functions operational |
| 3 | MARA — Response Composition skill | Agent | Intent Classification + at least one agent producing outputs |
| 4 | MARA — Conversation Management skill | Agent | Session storage + summary generation |
| 5 | Play/Pause toggle + token counter | Frontend | MARA backend operational |
| 6 | UI context integration | Frontend + MARA | Portal frontend rendering context object |
| 7 | Bidirectional UI actions | Frontend | MARA emitting `ui_action` responses |
| 8 | Session summaries + cross-session memory | Agent + storage | Conversation Management skill |
| 9 | Proactivity engine | System function + MARA | All proactivity sources producing outputs |

**Phase 1 (Output Registry) benefits the entire platform**, not just MARA. It should be prioritized as shared infrastructure even if MARA is delayed.

### Model considerations

- **Intent Classification:** Could start with a lighter model (Haiku). Most intents are classifiable from keywords + UI context without deep reasoning.
- **Response Composition:** Claude or equivalent for nuanced translation. The quality of MARA's language is the client's primary experience of the platform.
- **Conversation Management:** Lighter model for session summaries. Claude for complex conversational flows (exploratory mode, multi-step actions).

### Dependencies

- **Output Registry** must exist for MARA to function beyond navigation/meta queries.
- **At least one producing agent** (Analyst system functions at minimum) must be operational for MARA to have something to query.
- **Portal frontend** must be built to a minimum viable state for UI context integration and bidirectional actions.

---

## 16. Open Questions

### 16.1 MARA's language adaptation

How does MARA calibrate its language? Initial hypothesis: tier-based defaults (Starter = simpler, Agency = more technical) + learning from conversational patterns (if the client uses "ROAS" naturally, MARA mirrors it). Needs empirical testing.

### 16.2 Multi-language support

LATAM includes Portuguese (Brazil). Does MARA detect language from the client's messages, or is language set in Settings? Likely both: Settings as default, auto-detection as override.

### 16.3 MARA during real-time campaign events

When a campaign is live and something happens (budget exhausted, sudden performance drop), MARA in active mode should alert immediately. But the Analyst's ingestion cycle is every 4-6 hours. For truly real-time events (budget exhaustion), the system needs event-driven alerts that bypass the ingestion cycle. This is a Data Ingestion Layer design question, not a MARA question.

### 16.4 MARA + human expert handoff

When MARA can't resolve a question and escalation to a human expert is needed (e.g., in a workshop context), how does the handoff work? Does the human expert take over the MARA conversation, or does the client switch to a different channel? This needs resolution when the workshop/human expert flow is designed.
