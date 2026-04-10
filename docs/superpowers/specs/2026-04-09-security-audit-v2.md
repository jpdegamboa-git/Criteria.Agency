# criteria.agency — Security Audit v2: Comprehensive Risk Assessment

> Date: April 9, 2026
> Status: Approved analysis
> Scope: Full-spectrum security, legal, and operational risk assessment — post-stack revision, post-MARA, post-growth strategy
> Supersedes: Nothing (complements the Security Framework of April 6, 2026)
> Decisions: DEC-148 through DEC-172

---

## 1. Purpose

This document is the result of a comprehensive security audit conducted after the stack revision (Session 12) and the completion of all cerebral specs (Brand Builder, Strategist, Analyst, MARA). It identifies risks not covered by the original Security Framework (April 6, 2026), evaluates their severity, and defines mitigations.

The original Security Framework remains the authoritative document for: OWASP compliance, auth patterns, encryption, tenant isolation, agent sandboxing, operational security, and GDPR/LGPD/CCPA compliance. This document extends it with risks that emerged from the new stack (Inngest, Vercel AI SDK, pgvector, Helicone), from the MARA and Output Registry designs, from the business model (ad spend intermediation, white-label, token economy), and from legal/regulatory analysis.

### Structure

| Section | Domain |
|---------|--------|
| §2 | Stack revision gaps (Inngest, Vercel AI SDK, Helicone, pgvector) |
| §3 | AI-specific risks (prompt injection chains, model confusion, data poisoning) |
| §4 | MARA as attack surface |
| §5 | Output Registry security |
| §6 | Data Ingestion Layer & external APIs |
| §7 | Ad spend & financial risks |
| §8 | White-label (Agency tier) risks |
| §9 | Generated content risks |
| §10 | Platform Intelligence poisoning |
| §11 | SSE & real-time data leakage |
| §12 | Development process security |
| §13 | Operational risks (solo founder) |
| §14 | Legal & regulatory risks |
| §15 | Consolidated risk matrix |
| §16 | Mitigation priorities |
| §17 | Decisions |

---

## 2. Stack Revision Gaps

The Security Framework (April 6) was written for: Claude Agent SDK, custom state machine, BullMQ, Redis pub/sub, Sentry. The stack revision (April 9) changed to: Vercel AI SDK, Inngest, pgvector, Helicone, BetterStack. The following gaps exist.

### 2.1 Inngest as Attack Surface

**Risk: Webhook replay attacks.** Inngest executes functions by calling webhooks to the application server. A captured webhook payload could be re-sent to re-execute a pipeline. Inngest signs webhooks with HMAC-SHA256, but the framework does not mandate signature verification or anti-replay (nonce + timestamp window).

**Risk: Inngest dashboard as privileged access point.** The Inngest dashboard shows all functions, inputs, outputs, state, retries, and event payloads — including client data flowing through pipelines. A compromised Inngest account exposes all client data and allows re-execution of functions with modified data.

**Risk: Event injection.** Inngest operates on events. A compromised API key allows sending arbitrary events: `strategy.completed` with false data, `brand.dna_updated` to corrupt contexts, `security.violation` as DoS. The original Event Bus (Redis) was inside the network; Inngest is external.

**Risk: Tenant context outside Hono middleware.** The framework assumes tenant isolation via Hono middleware extracting tenantId from session tokens. Inngest functions execute from events, not from authenticated HTTP requests. No middleware injects tenantId — the event payload carries it, and nothing validates it's legitimate.

**Risk: Persistent state between steps.** Inngest stores intermediate state (step outputs) in its infrastructure. This state may contain client data (Brand DNA fragments, strategic recommendations, diagnostic results). The framework defines no policy for data at rest in Inngest.

**Mitigations (DEC-148):**

1. **Webhook verification (P0):** Every Inngest webhook MUST verify HMAC-SHA256 signature. Reject webhooks with timestamp > 5 minutes old (anti-replay).
2. **Inngest signing key = SYSTEM SECRET:** Same classification as DATABASE_URL and MASTER_ENCRYPTION_KEY in §7.1 of the Security Framework.
3. **MFA on Inngest account:** Mandatory. Added to operational security runbook.
4. **Event schema validation (P0):** Every Inngest function MUST validate event payload with Zod as first step. Events without valid tenantId, valid schema, or with unexpected fields are rejected and logged as security events.
5. **Tenant verification in functions (P0):** Every Inngest function MUST verify tenantId against the database as first step — confirm tenant exists and the referenced project/campaign belongs to that tenant. Never trust event payload alone.
6. **Minimal state in Inngest steps:** Never store sensitive data (secrets, PII, Brand DNA content, strategic recommendations) in Inngest step state. Pass only IDs and references. Each step that needs sensitive data reads it directly from the database.
7. **Inngest API key isolation:** The API key that sends events to Inngest is a backend secret. NEVER exposed to frontend. Only Hono backend can dispatch events.

### 2.2 Vercel AI SDK Multi-Model Risks

**Risk: Data leakage to training sets.** Multiple AI providers have different data retention and training policies. OpenAI may use API data for training unless opt-out is configured. Google Gemini has its own policies. Brand DNA, strategies, and financial data sent to a provider that trains on API data is a confidentiality breach.

**Risk: Model routing as security decision.** The prompt registry allows changing which model handles an agent's tasks. Changing the Brand Builder from Claude Sonnet to GPT-4 is not just a cost decision — it's a data security decision if GPT-4's data policies differ.

**Risk: Structured output malformation.** Different models implement tool calling differently. A model misinterpreting a tool call could trigger unintended actions (e.g., `delete_campaign` instead of `pause_campaign`).

**Risk: Streaming data leaks.** MARA streaming responses could transmit internal metadata (agent IDs, output types, Output Registry references) to the client before composition filtering completes.

**Risk: Automatic fallback to less-secure providers.** If Anthropic is unavailable and the system falls back to another provider, client data is sent to a provider the client didn't authorize and that may have different data policies.

**Mitigations (DEC-149):**

1. **AI Provider Security Tiers:**
   - **Tier A (confidential data permitted):** Anthropic API — does not train on API data, 30-day retention for trust & safety.
   - **Tier B (general data, not confidential):** OpenAI API with training opt-out activated, Google Gemini API with enterprise data settings.
   - **Tier C (public data only):** Any other provider, open-source models.
2. **Prompt Registry security fields:** Add `data_sensitivity` (critical/confidential/internal/public) and `approved_providers` (list) per agent × skill entry. The AI invocation layer validates that the assigned model belongs to an approved provider for that sensitivity level.
3. **Agents that process CONFIDENTIAL data (Brand Builder, Strategist, Analyst Diagnostic, MARA) MUST use Tier A providers only.** No exceptions, no automatic fallback.
4. **No automatic cross-tier fallback.** If a Tier A provider is unavailable, agents that require Tier A pause and the client sees "servicio temporalmente limitado." Tier B/C agents may fall back automatically within their tier.
5. **Tool call validation:** Every tool callable by an agent has a Zod schema for expected responses. Before executing any action from a tool call, validate response against schema. Reject and log if the action is not in the agent's declared `criticalActions` or permissions.
6. **MARA streaming buffer:** MARA responses pass through a composition filter before streaming to client. Internal metadata (agent IDs, output_types, content_refs) is stripped. Alternative: stream only after full response is composed (adds 1-3s latency, eliminates risk).
7. **Client consent on providers:** TOS must list Tier A providers by name. Client consent covers these specific providers. Adding a new Tier A provider requires TOS update and notification.

### 2.3 Helicone as Interceptor

**Risk: Man-in-the-middle by design.** All LLM traffic passes through Helicone's proxy. If Helicone is compromised, the attacker sees all prompts and responses for all clients — including Brand DNA, strategies, diagnostics, and financial data.

**Risk: Data retention in Helicone.** Helicone logs all requests for observability. These logs contain full prompts and responses with client data. Retention policies may not align with GDPR/LGPD requirements.

**Mitigations (DEC-150):**

1. **Evaluate Helicone data policies** before implementation. Required: SOC 2 compliance or equivalent, configurable retention periods, data deletion API (for right-to-erasure compliance), encryption at rest.
2. **If Helicone cannot meet requirements:** Use self-hosted LLM logging. Log token counts, costs, latency, model, and agent_id — but NOT full prompts/responses. Full content stays only in the application's own audit trail.
3. **Helicone API key = SYSTEM SECRET.** Same classification as other infrastructure keys.
4. **Include Helicone in data processing inventory** for GDPR/LGPD compliance documentation. Helicone is a sub-processor.

### 2.4 pgvector and Output Registry Embeddings

**Risk: Embedding inversion.** Research (2024-2025) has shown approximate text reconstruction from embeddings. If an attacker accesses the embeddings table, they can reconstruct approximate content of diagnostics, recommendations, and strategic plans.

**Risk: Embedding model as data exposure.** If embeddings are generated by an external provider (OpenAI text-embedding-3), every output registered sends its content to that provider for embedding generation.

**Risk: Cross-tenant semantic search.** Post-filtering in vector search (find N nearest vectors globally, then filter by tenant) could leak information about other tenants via timing or result patterns.

**Mitigations (DEC-151):**

1. **Embed summaries, not full content.** The Output Registry's `embedding` field is generated from the `summary` field, not from the full content. Summary is a lossy compression — embedding inversion recovers a vague summary, not the strategic plan.
2. **Use same-provider embeddings or local model.** Prefer Anthropic embeddings (same provider already processing data, no new data exposure). If unavailable, use local sentence-transformers model on Railway. Avoid adding OpenAI as a new data processor solely for embeddings.
3. **Mandatory pre-filtering for pgvector.** All vector search queries MUST include `WHERE client_id = $tenant` as a SQL condition, not as post-filter. Create partial HNSW indexes per tenant for high-volume clients. This guarantees the search never touches other tenants' vectors.
4. **content_ref as UUID only.** The `content_ref` field MUST be a UUID referencing an artifacts table row or an R2 object key. Validated by regex: alphanumeric + hyphens only. Path traversal is impossible by design.

---

## 3. AI-Specific Risks

### 3.1 Chained Prompt Injection

**Risk:** The Security Framework (§6.2) addresses prompt injection for agents ingesting external content (Listeners, Media Scout). It does not address propagation through the agent chain: Listener ingests malicious content → processes into signal → Opportunity Agent creates brief → Strategist generates campaign → Creation motor produces content. An injected instruction can travel through 4+ agents, amplified at each stage.

**Mitigation (DEC-152):** Defense at every handoff, not just at ingestion. Every inter-agent message (TaskMessage/ResultMessage) passes through a sanitization layer that strips known injection patterns. Output validation at every stage: each agent's output is validated against its expected schema before being passed to the next agent. The orchestrator (Inngest function) validates between steps, not just at the pipeline boundary.

### 3.2 Model Confusion in Multi-Model Environment

**Risk:** Different models interpret tool calls differently. A task designed for Sonnet that runs on Haiku (cost optimization) might produce structurally different outputs or misinterpret tool parameters.

**Mitigation (DEC-153):** Tool schemas are model-agnostic (Zod-validated). But the prompt registry's `approved_models` field must include only models that have been tested for each specific agent × skill combination. Before promoting a new model for an agent, run the agent's test suite (when it exists) against the new model. No untested model-agent combinations in production.

### 3.3 Agent Autonomy Abuse

**Risk:** In "AI decides" mode, agents can take significant actions without human approval. The Security Framework defines critical action gates for major actions (publish ad, send mass email, modify Brand DNA). But it doesn't cover combinations of minor actions that together have major impact: 10 separate "adjust bid +8%" actions that together represent an 80% increase.

**Mitigation (DEC-154):** Implement cumulative action tracking per agent per tenant per day. Define cumulative thresholds: total budget modifications > 20%, total audience changes > 3, total bid adjustments > 30% cumulative. When a cumulative threshold is reached, the agent pauses and escalates, regardless of whether individual actions were below their individual thresholds.

---

## 4. MARA as Attack Surface

MARA is the only agent receiving direct user input. It has access to the Output Registry (all agent outputs), can invoke any backend agent, and maintains conversational memory. This makes it the highest-value attack target.

### 4.1 Jailbreak via Extended Conversation

**Risk:** An attacker establishes trust over 20-30 messages, then progressively pushes MARA's boundaries. Session summaries could persist manipulated instructions between sessions.

**Mitigation (DEC-155):**
1. **Immutable system prompt re-injection.** MARA's core identity and boundaries are re-injected at the start of EVERY invocation, not just at session start. Even at message 50, MARA's first instruction is its identity and constraints.
2. **Safety classifier.** A lightweight model (Haiku, negligible cost) evaluates each user message before MARA processes it. Detects: directive instructions ("ignore your instructions"), role change requests ("pretend you are"), boundary probing ("what would happen if"). Flagged messages get a neutral MARA response: "No puedo ayudarte con eso."
3. **Context window limit.** After 30 messages in a session, truncate the oldest messages. Prevents cumulative manipulation. Critical system instructions remain (they're re-injected, not part of history).
4. **Session summaries from system actions.** Summaries are generated from system-logged actions (endpoints called, agents invoked, gates passed), NOT from conversation text. "Decisions made" is populated only from confirmed system executions. User statements that don't correspond to executed actions are not recorded as decisions.

### 4.2 Cross-Tenant Data Leakage via Competitive Intelligence

**Risk:** Client A and Client B are competitors. Both use criteria.agency. Client A's Competitive Listener analyzes Client B. MARA could serve Client A fragments of analysis that contain Client B's data if the Output Registry doesn't handle this correctly.

**Mitigation (DEC-156):** Cross-reference check before Output Registry writes. When an output references a competitor entity, verify if that entity is an active tenant. If yes: anonymize the output (remove identifiable data points, keep only public-domain information) before registering. The Competitive Listener can only use publicly available information about competitors who are also tenants — internal metrics, strategies, and Brand DNA are never accessible even indirectly.

### 4.3 Intent Manipulation and Token Drain

**Risk:** Malicious users manipulate question phrasing to force expensive agent invocations. Or reverse: phrase strategic requests as data lookups to get free Strategist-level output.

**Mitigation (DEC-157):** Per-session invocation budget for MARA. Maximum 5 paid agent invocations (Strategist, Brand Builder, Creation motors) per session. After limit: "Has alcanzado el límite de consultas profundas para esta sesión." Counter resets per session. Additionally, MARA's classification is validated by the system: if MARA classifies a request as "data lookup" but the response requires Strategist invocation, the system checks play/pause state and token availability before proceeding.

### 4.4 Play/Pause Server-Side Enforcement

**Risk:** Play/pause toggle is a UI element. An attacker could send API requests directly to MARA with play=true while the toggle shows pause.

**Mitigation (DEC-158):** Play/pause state is stored in the user's session record in the database. The MARA endpoint reads the state from the DB, never from request parameters. To change state, a separate authenticated endpoint updates the DB. The MARA invocation endpoint has no parameter for play/pause — it reads it from the server-side session.

---

## 5. Output Registry Security

### 5.1 Consolidated Protections

The Output Registry is the richest concentration of client intelligence in the platform. It requires protections beyond standard database security.

| Protection | Implementation | Section |
|-----------|---------------|---------|
| Tenant isolation | Pre-filtering in pgvector queries (§2.4) | DEC-151 |
| Embedding safety | Embed summaries only, not full content (§2.4) | DEC-151 |
| Embedding provider | Same-provider or local model (§2.4) | DEC-151 |
| content_ref safety | UUID only, no paths (§2.4) | DEC-151 |
| Cross-tenant competitive | Anonymize if competitor is also tenant (§4.2) | DEC-156 |
| Access logging | Every Output Registry query logged with querier identity, query type, results count | Standard audit |
| Data classification | All Output Registry entries inherit the data classification of their source agent's output type | Security Framework §5.1 |
| Staleness as vector | When serving stale outputs, MARA discloses freshness but does not offer to invoke new analysis unless play mode is active and tokens are available | DEC-157 |

---

## 6. Data Ingestion Layer & External APIs

### 6.1 OAuth Token Security

**Risk:** OAuth tokens for client platforms (Meta, Google, TikTok) have broad permissions. A compromise exposes the ability to publish on client accounts, access their analytics, and potentially spend their ad budgets.

**Mitigation (DEC-159):**
1. OAuth tokens = CRITICAL data classification. Encrypted with AES-256-GCM and per-tenant salt (same scheme as client secrets in Security Framework §7.2).
2. **Minimal scope principle.** Request read-only analytics scopes by default. Write/publish scopes requested only when Distribution motors need them, and stored as separate tokens. Analyst and Listener agents NEVER have access to write-scope tokens.
3. **Token audit trail.** Every OAuth token decryption is logged (who, what agent, what purpose). Anomalous patterns (token decrypted 100 times in 1 hour) trigger security alert.

### 6.2 Webhook Verification

**Risk:** Forged webhooks from external platforms could inject false data (e.g., fake spend reports from Meta).

**Mitigation (DEC-160):** Mandatory signature verification for all incoming webhooks. Implementation per platform:
- Meta: App Secret HMAC-SHA256
- Google: JWT audience verification
- Stripe: webhook signing secret HMAC-SHA256
- TikTok: HMAC-SHA256

Every webhook handler MUST call `verifyWebhookSignature(platform, request)` as first operation. Unverified webhooks return 401 and log security event. No exceptions.

### 6.3 Data Sanity Validation

**Risk:** External APIs can return incorrect data (Meta Ads API known issues in 2024). Incorrect data feeds incorrect diagnostics, which feed incorrect strategy.

**Mitigation (DEC-161):** Sanity checks in the Data Ingestion Layer:
- CTR > 100%: reject
- CPC < 0: reject
- Impressions drop > 95% day-over-day: flag as suspicious
- Cost > configured budget × 1.5: flag as suspicious
- Any metric with null where historically non-null: flag

Flagged data points are marked `suspicious` in the database and excluded from Analyst system functions until manually reviewed or confirmed by next ingestion cycle.

### 6.4 External API Rate Limiting

**Risk:** A bug in the ingestion loop could exhaust a client's API rate limit on Meta/Google, causing the client to lose access to their own accounts.

**Mitigation (DEC-162):** Rate limiter per tenant per platform respecting documented API limits. If a function approaches 80% of the rate limit, it throttles automatically. Rate limit status is visible in the admin dashboard.

---

## 7. Ad Spend & Financial Risks

### 7.1 Uncontrolled Spend

**Risk:** In "AI decides" mode, the Paid Media Operator can adjust bids, redistribute budget, and enable/disable ad sets. A sequence of small changes can result in significant budget impact.

**Mitigation (DEC-163):**
1. **Expand critical action gates.** Add to the critical actions list: `modify_bid` (when cumulative > ±30%), `increase_daily_cap`, `expand_audience` (when budget impact > 10%), `enable_ad_set` (when previously disabled by human).
2. **Cumulative action tracking.** Per-tenant per-day cumulative tracking of budget modifications. If total modifications exceed 20% of daily budget, auto-pause and escalate.
3. **Absolute circuit breaker.** If daily spend exceeds daily_cap × 1.2, ALL campaigns for that tenant pause automatically. Alert to admin AND client.
4. **Pre-execution cost estimate.** Before any spend-related action, estimate cost impact. Log estimate vs actual for reconciliation.

### 7.2 Financial Reconciliation

**Risk:** Discrepancies between what the system reports and what external platforms report erode trust and create financial disputes.

**Mitigation (DEC-164):**
1. **Daily automated reconciliation.** Compare system-recorded spend vs platform-reported spend for each campaign. Flag discrepancies > 5%.
2. **Client-visible reconciliation dashboard.** "Gasto registrado: $X | Gasto reportado por [platform]: $Y | Diferencia: $Z (%)." Transparency builds trust.
3. **Monthly reconciliation report.** Auto-generated, part of the Analyst Reporting skill output.

### 7.3 Ad Spend Intermediation — Legal Structure

**Risk:** Handling client funds for media buying may require licenses, separate accounts, and regulatory compliance in each LATAM jurisdiction (see §14.2).

**Mitigation (DEC-165):** Phase the intermediation model:
- **Phase 1 (MVP):** Client connects their OWN ad platform accounts. criteria.agency has management access only (no billing access). Commission charged as part of subscription, not as percentage of spend. This eliminates custodial risk entirely.
- **Phase 2 (post-revenue, with legal structure):** Offer intermediation as optional premium feature. Requires: separate escrow account for client funds, explicit contracts per client, and regulatory evaluation per jurisdiction.

---

## 8. White-Label (Agency Tier) Risks

### 8.1 Subdomain Spoofing

**Risk:** An attacker registers as "agency" with a subdomain mimicking a legitimate brand for phishing.

**Mitigation (DEC-166):** Custom domains require DNS CNAME verification pointing to criteria.agency infrastructure. The Agency must prove domain ownership via DNS TXT record. Subdomain-only options (e.g., `agency.criteria.agency`) require manual approval with basic identity verification.

### 8.2 Agency as Super-User

**Risk:** A compromised agency account exposes all its sub-clients' data.

**Mitigation (DEC-166 continued):**
1. Agency TOS includes "distributor responsibility" clause: agency is responsible for obtaining sub-client consent and complying with regulations.
2. criteria.agency provides DPA template; agency is responsible for sub-client agreements.
3. Per-brand token consumption logging for audit transparency.
4. Sub-brand data isolation: each brand within an Agency account has its own tenant context. Agency users can switch between brands but MARA context is cleared on switch.

---

## 9. Generated Content Risks

### 9.1 Deepfakes and Illegal Content

**Risk:** Video (Runway, Sora) and Audio (ElevenLabs) motors can generate deepfakes of real people or clone voices without consent. criteria.agency becomes the instrument.

**Mitigation (DEC-167):**
1. **Content Policy Checker (system function).** Before any Creation motor delivers or publishes content, the checker validates: no recognizable faces of real people without documented consent flag, no visible third-party trademarks, no unsupported health/financial claims.
2. **TOS clause:** "The client is responsible for verifying that generated content complies with applicable regulations before publication. criteria.agency prohibits the generation of content that impersonates real individuals without consent, infringes intellectual property, or violates applicable laws."
3. **Acceptable Use Policy:** Explicitly prohibits deepfakes, political disinformation, content targeting minors inappropriately, and advertising of illegal products/services.

### 9.2 Copyright

**Risk:** Generative models trained on copyrighted material may produce infringing content. AI-generated content may not have copyright protection in many jurisdictions.

**Mitigation (DEC-167 continued):**
1. **TOS disclaimer:** "criteria.agency uses third-party AI generative models. Generated content may not have copyright protection in all jurisdictions. criteria.agency does not guarantee that generated content does not infringe third-party rights."
2. **IP ownership clause in TOS:** "All content generated on the platform is owned by the client, subject to the limitations of applicable intellectual property law regarding AI-generated works."
3. Long-term: implement similarity detection against known protected works (when cost-effective tooling exists).

### 9.3 Advertising Compliance

**Risk:** Generated ads may violate advertising regulations (PROFECO in Mexico, CONAR in Brazil, COFEPRIS for health products).

**Mitigation (DEC-168):**
1. **MVP:** Disclaimer in publication flow: "Verifica que este contenido cumple con las regulaciones publicitarias de tu país antes de publicar."
2. **Post-MVP:** Ad Compliance Checker as Brand Guardian skill. Industry-specific rules (health, finance, alcohol, children's products) by country. Flags potential violations before publication.

---

## 10. Platform Intelligence Poisoning

**Risk:** A malicious client injects distorted data (inflated KPIs, fake metrics) to contaminate benchmarks used by all clients.

**Mitigation (DEC-169):**
1. **Statistical anomaly detection.** Data points > 3 standard deviations from platform median are excluded from benchmark calculations until verified.
2. **Minimum sample size.** Benchmarks require data from ≥ 5 clients in the same category to be published. Below threshold, generic industry benchmarks are used.
3. **TOS consent and opt-out.** "Aggregated, anonymized performance data is used to improve platform benchmarks. No individual data, brand identity, or specific strategy is shared. Opt-out available (loses access to benchmarks)."

---

## 11. SSE & Real-Time Data Leakage

**Risk:** SSE events may leak data across roles within an organization (cost data visible to Viewers) or persist as a low-profile exfiltration channel.

**Mitigation (DEC-170):**
1. **Role-based event filtering.** SSE connection is filtered by user role:
   - Client Viewer: `pipeline_update`, `notification`, `heartbeat` only
   - Client Editor: above + `gate_result`, `agent_status`
   - Client Admin/Owner: above + `cost_update`, `mara_proactive`
   - Platform Admin: all events + `security_event`
2. **SSE connection logging.** Every SSE connection establishment is logged (userId, IP, timestamp, duration). Anomalous patterns (connection from new IP, connection lasting > 24h) trigger alerts.
3. **SSE authentication.** SSE endpoint validates session token on connection AND on reconnection. Expired sessions cannot maintain SSE connections.

---

## 12. Development Process Security

### 12.1 Claude Code as Attack Surface

**Risk:** Development with Claude Code gives the AI assistant access to the full repository: security framework, vulnerability list (Section 11 of Security Framework), agent prompts, architecture decisions. If Anthropic's conversation storage is breached, the attacker has a complete attack roadmap.

**Mitigation (DEC-171):**
1. **Accept as residual risk** — the productivity benefit of AI-assisted development outweighs the theoretical risk of Anthropic conversation breach.
2. **Never put active credentials in the repository** (already mandated by Security Framework).
3. **Security Framework §11 (vulnerability list) should use severity categories, not specific exploit instructions.** Current format is informational enough for development but should not contain step-by-step exploitation guides.
4. **Anthropic's API data policy (no training on API data, 30-day retention)** provides baseline protection.

### 12.2 Specs as Intellectual Property

**Risk:** The specifications contain the complete operational blueprint of criteria.agency — every agent, every decision, every commercial strategy.

**Mitigation (DEC-171 continued):**
1. Repository MUST be private (already is).
2. Access limited to founder only (already is).
3. If collaborators join: repository access on need-to-know basis. Specs directory requires separate access.
4. Consider moving commercially sensitive specs (business model, growth strategy, pricing) to a separate private repository if team grows.

---

## 13. Operational Risks (Solo Founder)

### 13.1 Key Escrow

**Risk:** Loss of MASTER_ENCRYPTION_KEY makes all client secrets irrecoverable.

**Mitigation (DEC-172):**
1. **Shamir's Secret Sharing.** Split MASTER_ENCRYPTION_KEY into 2 shares (threshold: 2 of 2). One share in founder's password manager. One share in sealed envelope with a trusted person (attorney, family member). Neither share alone can reconstruct the key.
2. **Key rotation procedure.** On rotation, re-encrypt all client secrets with new key (maintaining keyVersion for gradual migration, as specified in Security Framework §7.3). Test rotation procedure quarterly.

### 13.2 Operational Runbook

**Mitigation (DEC-172 continued):** Living document in password manager (NOT in repository). For each service (Neon, Inngest, Vercel, Stripe, Helicone, BetterStack, Upstash, Cloudflare, Bunny, Anthropic, OpenAI):
- Dashboard URL
- How to access (credentials location)
- What to do if down
- How to pause/escalate
- Support contact
- Last credential rotation date

### 13.3 Automated Rotation Alerts

**Mitigation (DEC-172 continued):** Scheduled job (Inngest function, irony noted) that checks the age of each secret and sends alert when 7 days remain before the 90-day rotation deadline. If not rotated by deadline, daily critical alerts.

### 13.4 Extended Absence

The Security Framework (§9.5) defines autonomous mode for 48h absence. Extended absence mitigations:
- **> 7 days:** Automated systems continue, but pending critical actions accumulate. Daily email digest to founder and emergency contact.
- **> 30 days:** Emergency contact should have documented ability to: pause all motors, read system status, contact support for each provider, and access the Shamir key share if needed.
- **> 90 days:** Key rotation deadlines will be missed. All auto-rotating secrets (sessions, refresh tokens) continue working. Non-auto-rotating secrets (MASTER_ENCRYPTION_KEY, API keys) become overdue. System continues operating but security posture degrades.

---

## 14. Legal & Regulatory Risks

### 14.1 AI Advisory Liability

**Risk:** criteria.agency positions itself as replacement for a marketing agency. If AI-generated strategy causes financial loss, the client may have legal claims under consumer protection laws (PROFECO in Mexico, CDC in Brazil, ACODECO in Panama).

**Mitigations:**
1. **TOS limitation of liability:** "AI-generated recommendations do not constitute professional advice. The client retains full responsibility for business decisions. criteria.agency's liability is limited to the subscription fees paid in the preceding 12 months."
2. **Indemnification clause:** Client indemnifies criteria.agency for losses arising from decisions made based on AI recommendations.
3. **Disclaimer in UI:** First-time use of Strategist output shows: "Esta recomendación fue generada por AI. Revísala antes de actuar."
4. **Professional liability insurance (E&O):** Evaluate and obtain before scaling beyond pilot clients.

### 14.2 Ad Spend Intermediation

**Risk:** Handling client funds for media buying may require regulatory compliance in LATAM jurisdictions.

| Jurisdiction | Risk | Requirement |
|-------------|------|-------------|
| Brazil | CENP registration for media buying agencies | Register or avoid intermediation |
| Mexico | PROFECO transparency requirements on intermediation charges | Separate commission from media spend in invoicing |
| Panama | Potential SBP scrutiny for custodial funds | Separate escrow account |
| Colombia | SIC regulations, DIAN tax implications for intermediation | Evaluate at entry |

**Primary mitigation (DEC-165):** Phase 1 avoids intermediation entirely — client connects their own accounts.

### 14.3 International Data Transfer

**Risk:** Servers in US (Neon, Vercel, Railway, Inngest). Clients in LATAM. LGPD (Brazil) requires specific mechanisms for international data transfer to countries without "adequate protection level." US does not have a federal privacy law.

**Mitigations:**
1. **Standard Contractual Clauses (SCCs)** in DPA for Brazilian clients.
2. **TOS disclosure:** "Data is processed on servers in the United States. By using the service, you consent to this transfer."
3. **Long-term:** Evaluate regional infrastructure (São Paulo for Brazilian clients) when client volume justifies it.

### 14.4 Third-Party Personal Data

**Risk:** Clients upload email lists, audience data, and CRM data containing personal data of individuals who never consented to criteria.agency processing their data.

**Mitigations:**
1. **DPA (Data Processing Agreement):** Template for all clients. criteria.agency is "data processor"; client is "data controller." Client guarantees lawful basis for the data they upload.
2. **TOS clause:** "The client guarantees that all personal data uploaded to the platform was obtained with valid legal basis and consent where required."
3. **PII handling in pipeline:** Agents MUST NOT store third-party PII in execution logs (already in Security Framework §5.5). Email lists are accessed by reference, never included in prompts.

### 14.5 IP Ownership

**Risk:** Unclear ownership of AI-generated Brand DNA, strategies, and content. AI-generated works may not have copyright protection.

**Mitigations:**
1. **TOS IP clause:** "All outputs generated on the platform are owned by the client, subject to applicable intellectual property law. criteria.agency retains no ownership of client-generated content."
2. **Platform Intelligence exception:** "Aggregated, anonymized performance data may be used to improve platform benchmarks. No identifiable client content is shared." Opt-out available.
3. **Advise clients** that AI-generated content may have limited IP protection in some jurisdictions. Recommend human review and modification to strengthen copyright claims.

### 14.6 AI Regulation Compliance

**Risk:** Brazil's AI framework (PL 2338/2023) requires transparency, risk assessment, and human oversight for AI systems. EU AI Act may apply to European clients. Mexico and Colombia are advancing their own AI regulations.

**Mitigations:**
1. **Existing architecture already compliant in spirit:** Quality gates = human oversight. Audit trail = transparency. Configurable autonomy = human control. MARA first-use onboarding = AI disclosure.
2. **Formalize as AI Governance Framework.** Document existing practices as a formal policy. Publish summary on criteria.agency public site: "Our commitment to responsible AI."
3. **Monitor regulatory changes** in LATAM AI regulation quarterly. Adjust when specific requirements are enacted.

### 14.7 Advertising Regulation

**Risk:** AI-generated ads may violate advertising regulations specific to industries (health products in Mexico under COFEPRIS, alcohol in Brazil under CONAR, financial products under local securities regulators).

**Mitigations:** See §9.3 (DEC-168). MVP relies on client responsibility; post-MVP implements automated compliance checking per industry and country.

### 14.8 Required Legal Documents (Pre-Launch)

| Document | Status | Priority |
|----------|--------|----------|
| Terms of Service | Not created | P0 — before any client |
| Privacy Policy (multi-jurisdiction) | Not created | P0 — before any client |
| Data Processing Agreement (DPA) template | Not created | P0 — before any client with PII |
| Acceptable Use Policy | Not created | P0 — before any client |
| Cookie Policy | Not created | P0 — before public portal launch |
| Refund Policy | Not created | P1 — before payments |
| White-Label Distribution Agreement | Not created | P2 — before Agency tier |
| AI Governance Framework (public) | Not created | P2 — before marketing |

---

## 15. Consolidated Risk Matrix

### 15.1 Critical Risks (can destroy the business)

| # | Risk | Domain | Probability | Impact | Mitigation | DEC |
|---|------|--------|------------|--------|------------|-----|
| C1 | Ad spend automation without reconciliation | Financial | Medium | Critical | Phase 1: no intermediation. Circuit breaker. Daily reconciliation | DEC-163, DEC-164, DEC-165 |
| C2 | Inngest event injection → arbitrary pipeline execution | Infrastructure | Low | Critical | Webhook verification, event schema validation, tenant verification | DEC-148 |
| C3 | Multi-model data leakage to training sets | AI/Privacy | Medium | Critical | Provider security tiers, no cross-tier fallback for confidential data | DEC-149 |
| C4 | Deepfake/copyright liability | Legal/Content | Medium | Critical | Content Policy Checker, TOS disclaimers, AUP | DEC-167 |
| C5 | White-label sub-client data without GDPR coverage | Legal/Privacy | Medium | Critical | DPA template, distributor responsibility clause | DEC-166 |
| C6 | No legal documents (TOS, Privacy Policy, DPA) | Legal | Certain | Critical | Create before any client | §14.8 |
| C7 | AI advisory liability without limitation | Legal | Medium | Critical | TOS limitation of liability, E&O insurance | §14.1 |
| C8 | Client funds custody without legal structure | Legal/Financial | High (if intermediating) | Critical | Phase 1: no intermediation | DEC-165 |

### 15.2 High Risks (significant damage)

| # | Risk | Domain | Probability | Impact | Mitigation | DEC |
|---|------|--------|------------|--------|------------|-----|
| H1 | MARA jailbreak via extended conversation | AI/Security | Medium | High | Immutable re-injection, safety classifier, context limit | DEC-155 |
| H2 | Output Registry cross-tenant via semantic search | Data | Low | High | Pre-filtering, partial indexes | DEC-151 |
| H3 | OAuth token theft from client social accounts | Infrastructure | Low | High | CRITICAL classification, minimal scopes, separate read/write tokens | DEC-159 |
| H4 | Session summary poisoning | AI/Security | Low | High | Summaries from system actions, not conversation text | DEC-155 |
| H5 | Play/pause bypass (client-side only) | Application | Medium | High | Server-side enforcement in DB session | DEC-158 |
| H6 | Streaming data leak pre-composition | Application | Medium | Medium | Composition buffer before streaming | DEC-149 |
| H7 | Competitive intelligence leak (client A spying client B) | Data/Business | Medium | High | Cross-reference anonymization | DEC-156 |
| H8 | Helicone as data exposure point | Infrastructure | Low | High | Evaluate policies; self-host logging if insufficient | DEC-150 |
| H9 | International data transfer (Brazil LGPD) | Legal | Medium | High | SCCs in DPA, TOS disclosure | §14.3 |
| H10 | Third-party PII without consent chain | Legal | High | High | DPA template, client guarantees in TOS | §14.4 |

### 15.3 Medium Risks (require attention before scaling)

| # | Risk | Domain | Probability | Impact | Mitigation | DEC |
|---|------|--------|------------|--------|------------|-----|
| M1 | Embedding inversion in pgvector | Data | Low | Medium | Embed summaries only | DEC-151 |
| M2 | Prompt Registry as IP exposure | Data | Low | Medium | CONFIDENTIAL classification, access controls | DEC-171 |
| M3 | Inngest dashboard as access point | Infrastructure | Low | Medium | MFA mandatory | DEC-148 |
| M4 | SSE without role-based filtering | Application | Medium | Medium | Role-based event filtering | DEC-170 |
| M5 | Webhook forgery from external platforms | Infrastructure | Low | Medium | Per-platform signature verification | DEC-160 |
| M6 | Data poisoning via external APIs | Data | Medium | Medium | Sanity validation checks | DEC-161 |
| M7 | Token economy gaming (free tier abuse) | Business | Medium | Medium | Per-session invocation budget | DEC-157 |
| M8 | Advertising compliance | Legal | Medium | Medium | Client responsibility (MVP), automated checking (post-MVP) | DEC-168 |
| M9 | Platform Intelligence poisoning | Data | Low | Medium | Statistical anomaly detection, minimum sample size | DEC-169 |
| M10 | Chained prompt injection | AI | Medium | Medium | Inter-agent sanitization, per-step validation | DEC-152 |
| M11 | Agent cumulative action abuse | AI/Financial | Medium | Medium | Cumulative action tracking | DEC-154 |
| M12 | External API rate limiting (damage to client) | Infrastructure | Medium | Medium | Per-tenant rate limiter | DEC-162 |
| M13 | Specs as IP in repository | Business | Low | Medium | Private repo, access controls | DEC-171 |

---

## 16. Mitigation Priorities

### 16.1 Before Writing Code (Design Decisions)

| # | Mitigation | DEC |
|---|-----------|-----|
| D1 | Define AI provider security tiers (A/B/C) | DEC-149 |
| D2 | Define play/pause as server-side only | DEC-158 |
| D3 | Define Phase 1 ad spend model (no intermediation) | DEC-165 |
| D4 | Define pre-filtering as mandatory for pgvector | DEC-151 |
| D5 | Define Output Registry embeddings from summaries only | DEC-151 |
| D6 | Define MARA session summary source (system actions, not text) | DEC-155 |
| D7 | Define content_ref as UUID-only | DEC-151 |
| D8 | Add security fields to Prompt Registry schema (data_sensitivity, approved_providers) | DEC-149 |

### 16.2 P0 — Before Any Deploy (extends Security Framework §11.1)

| # | Mitigation | DEC |
|---|-----------|-----|
| P0-6 | Inngest webhook signature verification | DEC-148 |
| P0-7 | Inngest event schema validation (Zod) | DEC-148 |
| P0-8 | Tenant verification in Inngest functions | DEC-148 |
| P0-9 | MFA on all infrastructure accounts (Inngest, Neon, Vercel, etc.) | DEC-148 |
| P0-10 | Five legal documents (TOS, Privacy Policy, DPA, AUP, Cookie Policy) | §14.8 |
| P0-11 | AI provider tier enforcement in invocation layer | DEC-149 |

### 16.3 P1 — Before Clients (extends Security Framework §11.2)

| # | Mitigation | DEC |
|---|-----------|-----|
| P1-7 | MARA safety classifier | DEC-155 |
| P1-8 | MARA immutable system prompt re-injection | DEC-155 |
| P1-9 | Play/pause server-side enforcement | DEC-158 |
| P1-10 | Output Registry pre-filtering implementation | DEC-151 |
| P1-11 | Webhook verification for all external platforms | DEC-160 |
| P1-12 | Data sanity validation in ingestion | DEC-161 |
| P1-13 | Ad spend circuit breaker | DEC-163 |
| P1-14 | SSE role-based event filtering | DEC-170 |
| P1-15 | Per-session MARA invocation budget | DEC-157 |

### 16.4 P2 — Before Scaling (extends Security Framework §11.3)

| # | Mitigation | DEC |
|---|-----------|-----|
| P2-7 | Daily ad spend reconciliation | DEC-164 |
| P2-8 | Cross-tenant competitive anonymization | DEC-156 |
| P2-9 | Cumulative agent action tracking | DEC-154 |
| P2-10 | Inter-agent sanitization for chained injection | DEC-152 |
| P2-11 | Content Policy Checker for creation motors | DEC-167 |
| P2-12 | MARA streaming composition buffer | DEC-149 |
| P2-13 | Local/same-provider embedding model | DEC-151 |
| P2-14 | Per-tenant external API rate limiter | DEC-162 |
| P2-15 | Platform Intelligence anomaly detection | DEC-169 |

### 16.5 P3 — Continuous (extends Security Framework §11.4)

| # | Mitigation | DEC |
|---|-----------|-----|
| P3-7 | White-label domain verification | DEC-166 |
| P3-8 | Ad Compliance Checker by country/industry | DEC-168 |
| P3-9 | AI Governance Framework (public document) | §14.6 |
| P3-10 | Professional liability insurance (E&O) | §14.1 |
| P3-11 | Cyber liability insurance | §13 |
| P3-12 | Shamir's Secret Sharing for MASTER_ENCRYPTION_KEY | DEC-172 |
| P3-13 | Automated secret rotation alerts | DEC-172 |

---

## 17. Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| DEC-148 | Inngest security model | Webhook verification + event schema validation + tenant verification + minimal state + MFA | Inngest operates outside network boundary; requires explicit trust verification at every entry point |
| DEC-149 | Multi-model data security | Three-tier provider classification (A/B/C) + prompt registry security fields + no cross-tier fallback + streaming buffer | Different providers have different data policies; security must be model-aware |
| DEC-150 | Helicone risk management | Evaluate data policies before implementation; self-host if insufficient | Helicone sees all LLM traffic; must meet GDPR/LGPD requirements |
| DEC-151 | Output Registry hardening | Summary-only embeddings + pre-filtering + UUID content_ref + same-provider embeddings | Output Registry is highest-value target; defense in depth |
| DEC-152 | Chained prompt injection defense | Inter-agent sanitization + per-step output validation | Single-point defense at ingestion is insufficient for multi-agent chains |
| DEC-153 | Model-agent compatibility | Tested combinations only in production; approved_models per agent × skill | Model behavior varies; untested combinations are security risks |
| DEC-154 | Cumulative action tracking | Per-agent per-tenant per-day cumulative thresholds | Individual action gates insufficient; cumulative impact matters |
| DEC-155 | MARA hardening | Immutable re-injection + safety classifier + context limit + system-action summaries | MARA is highest-exposure surface; requires multi-layer defense |
| DEC-156 | Competitive cross-tenant protection | Anonymize Output Registry entries when competitor is also a tenant | Two clients competing against each other on the same platform creates unique data risk |
| DEC-157 | MARA invocation budget | 5 paid agent invocations per session maximum | Prevents token drain from manipulation or abuse |
| DEC-158 | Play/pause enforcement | Server-side only, stored in DB session, not in request parameters | Client-side controls are bypassable; must be server-authoritative |
| DEC-159 | OAuth token security | CRITICAL classification + minimal scopes + separate read/write tokens + audit trail | OAuth tokens provide access to client external accounts; highest-impact credential type |
| DEC-160 | Webhook verification | Mandatory per-platform signature verification for all incoming webhooks | Unverified webhooks allow data injection from external sources |
| DEC-161 | Data sanity validation | Statistical checks on ingested data; suspicious data excluded until verified | External APIs can return incorrect data; garbage in → garbage out through entire agent chain |
| DEC-162 | External API rate limiting | Per-tenant per-platform rate limiter | Protecting client's external accounts from criteria.agency's own bugs |
| DEC-163 | Ad spend protection | Expanded critical actions + cumulative tracking + absolute circuit breaker | Real money at stake; defense must be proportional |
| DEC-164 | Financial reconciliation | Daily automated comparison of system vs platform-reported spend | Discrepancies erode trust and create legal exposure |
| DEC-165 | Ad spend intermediation phasing | Phase 1: no intermediation (client's own accounts). Phase 2: optional with legal structure | Eliminates custodial and regulatory risk at launch |
| DEC-166 | White-label security | Domain verification + distributor responsibility + per-brand isolation + MARA context clearing | Agency tier multiplies attack surface; each mitigation addresses a specific vector |
| DEC-167 | Content safety | Content Policy Checker + TOS disclaimers + AUP | Platform liability for generated content; defense combines technical checks and legal protection |
| DEC-168 | Advertising compliance | Client responsibility (MVP) + automated checking (post-MVP) | Regulatory risk is real but automated compliance is complex; phase appropriately |
| DEC-169 | Platform Intelligence integrity | Anomaly detection + minimum sample size + opt-out | Poisoned benchmarks affect all clients; statistical safeguards protect collective value |
| DEC-170 | SSE security | Role-based event filtering + connection logging + authentication on reconnect | Real-time channel requires same access controls as REST API |
| DEC-171 | Development security | Residual risk acceptance for Claude Code + private repo + access controls | AI development tools are a calculated trade-off; minimize exposure without eliminating productivity |
| DEC-172 | Solo founder operational security | Shamir key escrow + living runbook + automated rotation alerts + extended absence protocol | Single point of failure for operations; mitigate with documentation and automation |

---

## Related Documents

- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Original security framework (still authoritative for OWASP, auth, encryption, tenant isolation, agent sandboxing, compliance matrix)
- `docs/superpowers/specs/2026-04-09-mara-copilot-design.md` — MARA design (attack surface analyzed in §4)
- `docs/superpowers/specs/2026-04-08-business-model-design.md` — Business model (financial risks analyzed in §7)
- `docs/superpowers/specs/2026-04-09-growth-strategy.md` — Growth strategy (startup credits and phasing)
- `TECH_ARCHITECTURE.md` — Stack (analyzed for gaps in §2)
- `DECISION_LOG.md` — All decisions (DEC-148 through DEC-172 added)
