# criteria.agency — Business Agents & Automation

> Date: April 6, 2026
> Status: Design spec
> Scope: 5 business automation agents — Financial Categorizer, Payment Reconciler, Subscription Manager, Content Writer, Brief Copilot

---

## 1. Context

The platform has a GTM strategy, a financial module design, and a video production pipeline — but no automation connecting them. This spec defines 5 agents that automate the business layer:

- **3 infrastructure agents** (lightweight services): Financial Categorizer, Payment Reconciler, Subscription Manager
- **2 platform agents** (full agent framework): Content Writer, Brief Copilot

The infrastructure agents run as services/cron jobs — they don't need the full orchestrator pipeline with gates and 3+3 rule. The platform agents are proper criteria.agency motors with skill files, revision cycles, and quality control.

### Why These 5 Now

| Agent | Solves | Urgency |
|-------|--------|---------|
| Financial Categorizer | "I can't tell where my money goes" | High — no accounting system exists |
| Payment Reconciler | "I don't know if Enterprise client X paid" | High — wire transfers need manual checking |
| Subscription Manager | "Trials expire without me noticing" | High — revenue leaks without automation |
| Content Writer | "I need marketing content and the platform should produce it" | High — GTM requires 2 posts/week + emails |
| Brief Copilot | "Clients don't know how to write briefs" | Medium — needed before beta opens |

---

## 2. Financial Categorizer

### Purpose

Automatically assigns category and type to bank transactions. Uses a waterfall: fixed rules → learned rules → client alias match → Claude AI fallback.

### Architecture

```
src/services/categorizer.ts

categorizeTransaction(transaction: Transaction): Promise<{
  category: string;
  subcategory: string | null;
  type: "income" | "expense" | "transfer" | "fee";
  confidence: number;       // 0.0 - 1.0
  source: "fixed" | "learned" | "alias" | "ai";
}>
```

### Waterfall Logic

**Step 1: Fixed rules** (hardcoded, highest priority)

| Pattern (in description) | Category | Type | Confidence |
|--------------------------|----------|------|-----------|
| "STRIPE" | subscription | income | 1.0 |
| "COMISION", "COMMISSION", "FEE" | bank_fees | fee | 1.0 |
| "INTERES", "INTEREST" | interest | income | 0.95 |
| "TRANSFERENCIA PROPIA", "OWN TRANSFER" | internal_transfer | transfer | 0.95 |

**Step 2: Learned rules** from `categorizationRules` table

Query rules ordered by priority DESC. First match wins. Example: if founder categorized "AMAZON WEB SERVICES" as `infrastructure` before, the rule `{ pattern: "AMAZON WEB", category: "infrastructure", type: "expense" }` auto-categorizes future AWS charges.

**Step 3: Client alias match**

If the transaction is an income and `counterpartyName` matches a `clientAliases` entry, categorize as `client_payment`. This happens before AI to avoid wasting API calls on known clients.

**Step 4: Claude AI fallback**

For uncategorized transactions (confidence < 0.7 after steps 1-3):

```
Prompt to Claude (Haiku for cost efficiency):

You are a financial transaction categorizer for a video production & marketing agency.

Transaction:
- Date: {date}
- Description: {description}
- Counterparty: {counterpartyName}
- Amount: {amount} {currency}
- Reference: {reference}

Available categories:
INCOME: client_payment, subscription, refund_received, interest, other_income
EXPENSE: ai_api_costs, infrastructure, software_subscriptions, contractor, taxes, bank_fees, marketing, office, other_expense
TRANSFER: internal_transfer

Recent categorization examples for context:
{last 10 categorized transactions as examples}

Respond with JSON only:
{ "category": "...", "subcategory": "..." or null, "type": "income|expense|transfer|fee", "confidence": 0.0-1.0 }
```

**Step 5: Learning on correction**

When founder manually changes a category via the dashboard:
1. Check if a rule already exists for this pattern
2. If not: extract the most distinctive 2-3 words from the description
3. Create `categorizationRules` entry: `{ pattern, matchType: "contains", category, subcategory, type, source: "auto", priority: 0 }`
4. Next time this pattern appears → Step 2 catches it, no AI call needed

### Integration Point

Called by `BankSyncService` (from financial module spec) after normalization and dedup, before reconciliation:

```
normalize → dedup → categorize → reconcile
```

### Cost Control

- Fixed and learned rules: $0
- Client alias match: $0
- Claude Haiku: ~$0.001 per transaction (minimal)
- Goal: <10% of transactions hit Claude after first month of learning

---

## 3. Payment Reconciler

### Purpose

Matches incoming bank transactions against expected payments from clients. Activates subscriptions for Enterprise clients who pay via wire transfer.

### Architecture

```
src/services/reconciler.ts

reconcileTransaction(transaction: Transaction): Promise<{
  matched: boolean;
  matchType: "exact" | "amount" | "fuzzy" | "ai" | "none";
  expectedPaymentId: string | null;
  clientId: string | null;
  confidence: number;
  autoReconciled: boolean;  // true if confidence >= threshold
}>
```

### Matching Algorithm (4 levels + AI)

Runs only on income transactions (`type = "income"`) that are not yet reconciled.

**Level 1: EXACT MATCH** — amount exact + name fuzzy ≥85%
- Compare `transaction.amount` against all `expectedPayments` where `status = "pending"`
- For amount matches, compare `transaction.counterpartyName` (normalized) against:
  - `clients.name` (normalized)
  - `clients.company` (normalized)
  - `clientAliases.alias` (normalized) — exact match since aliases are pre-normalized
- If name similarity ≥85%: **auto-reconcile** (confidence 0.95)

**Level 2: AMOUNT MATCH** — amount exact, name doesn't match
- Same amount comparison, but no name match found
- Action: **suggest** match (confidence 0.6), show in reconciliation queue

**Level 3: FUZZY MATCH** — name matches ≥85%, amount differs ≤5%
- Name matches a client but amount is slightly off (bank fees, rounding)
- Action: **suggest with warning** (confidence 0.5), flag possible bank fee deduction

**Level 4: CLAUDE AI** — no match from rules

For unmatched income transactions above $100 (skip small amounts):

```
Prompt to Claude (Haiku):

You are a payment reconciliation assistant for criteria.agency.

Unmatched bank transaction:
- Amount: ${amount}
- Sender: "{counterpartyName}"
- Date: {date}
- Description: "{description}"

Clients with pending payments:
{list of expectedPayments with client name, company, amount, dueDate}

All active clients:
{list of clients with name, company, email}

Is this transaction a payment from one of these clients? Consider:
- Sender name variations (e.g., "J RODRIGUEZ" could be "Juan Rodriguez")
- Amount tolerance (bank fees may reduce amount by 1-5%)
- Date proximity to due date

Respond with JSON only:
{ "clientId": "uuid" or null, "expectedPaymentId": "uuid" or null, "confidence": 0.0-1.0, "reasoning": "one sentence" }
```

- If confidence ≥0.90: **auto-reconcile**
- If confidence 0.5-0.89: **suggest** in reconciliation queue
- If confidence <0.5: **no match**, categorize as `other_income`

### Post-Reconciliation Actions

On confirmed reconciliation (auto or manual):

1. Link transaction ↔ expectedPayment (set FKs both directions)
2. Set `transaction.reconciled = true`, `transaction.clientId`, `transaction.category = "client_payment"`
3. Set `expectedPayment.status = "reconciled"`
4. Save `counterpartyName` as new `clientAlias` for this client (if not already saved)
5. **Subscription activation:**
   - If client `subscriptionStatus` is null → set to `active`, set `subscriptionTier` to `enterprise`
   - If client `subscriptionStatus` is `past_due` → set to `active`
6. **Recurring payment creation:**
   - If this was a monthly Enterprise client, create next `expectedPayment` (due +1 month, same amount)
7. Log reconciliation event for audit

### Name Normalization

```typescript
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // remove accents
    .replace(/\b(s\.?a\.?|llc|inc\.?|corp\.?|ltd\.?|s\.?r\.?l\.?)\b/gi, "")
    .replace(/\b(wire|transfer|trf|intl|international|payment)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  // Levenshtein distance normalized to 0-100
  // Returns 100 for exact match, 0 for completely different
}
```

### Integration Point

Called by `BankSyncService` after categorization:

```
normalize → dedup → categorize → reconcile → emit events
```

---

## 4. Subscription Manager

### Purpose

Automated lifecycle management for all subscriptions (Stripe + Enterprise wire). Runs as scheduled tasks, detecting events and triggering actions.

### Architecture

```
src/services/subscription-manager.ts

// Each task is an independent function, callable via cron or API
checkExpiringTrials(): Promise<void>
checkExpiredTrials(): Promise<void>
checkOverduePayments(): Promise<void>
detectChurnRisk(): Promise<void>
createRecurringPayments(): Promise<void>
sendEarlyAdopterTransitionNotice(): Promise<void>
```

### Scheduled Tasks

#### Task 1: Trial Expiry Warning (daily at 9am)

- Query: `clients WHERE subscriptionStatus = 'trialing' AND trialEndsAt BETWEEN now AND now + 5 days`
- Action: Send email to each client — "Tu trial termina en X días. Agrega tu método de pago para continuar."
- Skip if already sent (track in `metadata` jsonb on client or separate notifications table)

#### Task 2: Trial Expired (daily at 10am)

- Query: `clients WHERE subscriptionStatus = 'trialing' AND trialEndsAt < now`
- Action:
  - Set `subscriptionStatus = 'canceled'`
  - Send email: "Tu trial ha terminado. Puedes reactivar cuando quieras."
  - Email founder: "Cliente X trial expirado sin conversión"
- Note: Stripe handles its own trial expiry for Stripe subscriptions. This catches Enterprise trials (manual) and any Stripe edge cases.

#### Task 3: Overdue Wire Payments (daily at 11am)

- Query: `expectedPayments WHERE status = 'pending' AND dueDate < now - 7 days`
- Action:
  - Set `expectedPayment.status = 'overdue'`
  - Email founder: "Pago de [cliente] vencido hace [X] días — $[monto]"
  - Email client (if configured): "Tu pago de $[monto] está pendiente"
  - Set client `subscriptionStatus = 'past_due'` if not already

#### Task 4: Churn Risk Detection (weekly on Mondays at 9am)

- Query: `clients WHERE subscriptionStatus = 'active' AND no projects created in last 30 days AND no login/review in last 30 days`
- Action: Email founder with list: "Estos clientes no han usado la plataforma en 30+ días: [list]"
- No action on client — founder decides whether to reach out

#### Task 5: Create Recurring Expected Payments (1st of each month)

- Query: `clients WHERE subscriptionTier = 'enterprise' AND subscriptionStatus = 'active'`
- For each: check if `expectedPayment` for current month already exists
- If not: create `expectedPayment` with amount from last payment, dueDate = 15th of current month
- Log creation

#### Task 6: Early Adopter Transition Notice (daily)

- Query: `clients WHERE earlyAdopterEndsAt BETWEEN now AND now + 7 days`
- Action: Email client — "Tu precio early adopter termina pronto. A partir de [fecha], tu plan pasa a $[precio full]."
- Stripe handles the actual price change via Subscription Schedules. This is informational only.

### API Endpoints (manual trigger + monitoring)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/subscriptions/check-trials` | Run trial check manually |
| POST | `/api/subscriptions/check-overdue` | Run overdue check manually |
| GET | `/api/subscriptions/at-risk` | List churn risk clients |
| GET | `/api/subscriptions/summary` | Dashboard: trials active, expiring, converted, churned |

### Cron Implementation

For Phase 1 without Redis/BullMQ: use `node-cron` (lightweight, in-process scheduler).

```typescript
import cron from "node-cron";

// Daily at 9am
cron.schedule("0 9 * * *", () => checkExpiringTrials());
// Daily at 10am
cron.schedule("0 10 * * *", () => checkExpiredTrials());
// Daily at 11am
cron.schedule("0 11 * * *", () => checkOverduePayments());
// Mondays at 9am
cron.schedule("0 9 * * 1", () => detectChurnRisk());
// 1st of month at 8am
cron.schedule("0 8 1 * *", () => createRecurringPayments());
// Daily at noon
cron.schedule("0 12 * * *", () => sendEarlyAdopterTransitionNotice());
```

Future: migrate to BullMQ repeatable jobs when Redis is added.

---

## 5. Content Writer

### Purpose

Agent in the criteria.agency framework that produces marketing content. First agent of the **SEO/Content Distribution motor**. Uses Claude to generate content following brand voice and quality standards.

### Agent Identity

- **ID:** DC-001 (Distribution Content)
- **Name:** Content Writer
- **Motor:** SEO/Content (Distribution)
- **Level:** leader (only agent in this motor for now)
- **Autonomy:** 80%
- **Skill file:** `agents/DC-001_content_writer.md`

### Content Types

| Type | Format | Max Length | Use Case |
|------|--------|-----------|----------|
| `linkedin_post` | Markdown → plain text | 300 words | Behind-the-scenes, thought leadership, product updates |
| `email_nurture` | Subject + HTML body | 500 words | Waitlist nurture sequence, trial reminders |
| `blog_article` | Markdown + meta | 1500 words | SEO content, case studies, process explanations |
| `social_caption` | Plain text + hashtags | 150 words | Instagram, Twitter/X, short-form |
| `landing_copy` | Structured sections | 800 words | Page sections, hero text, feature descriptions |

### Pipeline

```
Brief (type + topic + audience + tone + references)
  → Content Writer generates draft (Claude Sonnet)
  → Auto-review: readability score, word count, CTA presence, brand voice check
  → If auto-review passes → deliver to founder for approval
  → If auto-review fails → self-revise (max 2 auto-revisions)
  → Founder approves or requests changes
  → Max 3 founder revision rounds
  → Final content delivered
```

### Prompt Structure

```
System prompt (from skill file):
- You are the Content Writer for criteria.agency
- Brand voice: professional but accessible, confident not arrogant, technical when needed
- Core narrative: "La IA genera. El criterio decide."
- Never use: "revolutionary", "game-changing", "cutting-edge" (banned buzzwords)
- Always include a clear CTA
- Write in the language of the brief (Spanish default, English if specified)

User prompt:
- Content type: {type}
- Topic: {topic}
- Target audience: {persona description}
- Tone: {professional | conversational | inspirational | technical}
- Key message: {what the reader should take away}
- CTA: {what action the reader should take}
- References: {URLs, notes, previous content to riff on}
- Word limit: {max words}

Output format:
{
  "content": "the actual content in markdown",
  "title": "headline/subject line",
  "meta": {
    "keywords": ["seo", "keywords"],
    "cta": "the call to action",
    "audience": "who this is for",
    "wordCount": 245,
    "readabilityScore": 72
  }
}
```

### Auto-Review Checks

Before delivering to founder, the agent runs:

| Check | Pass Criteria | On Fail |
|-------|--------------|---------|
| Word count | Within ±10% of limit | Trim or expand |
| CTA present | Contains clear call to action | Add CTA |
| Brand voice | No banned buzzwords, matches tone | Revise |
| Readability | Flesch-Kincaid ≤ grade 10 (accessible) | Simplify |
| Language | Matches brief language (es/en) | Re-generate |

### API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/content/generate` | Submit brief, get content back |
| GET | `/api/content` | List all generated content |
| GET | `/api/content/:id` | Get single content piece |
| PATCH | `/api/content/:id` | Founder edits/approves |
| POST | `/api/content/:id/revise` | Request revision with feedback |

### Database

New table `contentPieces`:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| type | enum | linkedin_post, email_nurture, blog_article, social_caption, landing_copy |
| status | enum | draft, review, approved, published |
| brief | jsonb | Original brief (topic, audience, tone, etc.) |
| content | text | Generated content (markdown) |
| title | varchar(255) | Headline/subject |
| meta | jsonb | Keywords, CTA, readability score, word count |
| version | integer | Revision number |
| revisionNotes | text | Founder's feedback for revision |
| createdAt | timestamp | |
| updatedAt | timestamp | |

---

## 6. Brief Copilot

### Purpose

Conversational agent that guides clients through brief creation. Turns vague "I need a video" into a structured brief that the Creative Director can work with. This is the AI Copilot mentioned in all subscription tiers.

### Agent Identity

- **ID:** CP-001 (Copilot)
- **Name:** Brief Copilot
- **Motor:** Transversal (serves all Creation motors)
- **Level:** independent
- **Autonomy:** 70% (always defers final brief to client confirmation)
- **Skill file:** `agents/CP-001_brief_copilot.md`

### Conversation Flow

The Copilot follows a guided conversation structure — not free chat. It asks specific questions in order, adapts based on answers, and generates the brief at the end.

```
Phase 1: UNDERSTAND (2-3 questions)
  Q1: "¿Qué necesitas?" → Detect project type (video, design, content, etc.)
  Q2: "Cuéntame en una frase el objetivo" → Extract core message
  Q3: "¿Quién va a ver esto?" → Define audience

Phase 2: DEFINE (3-4 questions, adapted to project type)
  For video:
    Q4: "¿Qué tono prefieres?" → Options: profesional, cercano, inspiracional, técnico
    Q5: "¿Duración ideal?" → Options: 30s, 1min, 2min, 3min+
    Q6: "¿Tienes referencias?" → URLs, descriptions, competitor examples
    Q7: "¿Materiales disponibles?" → Logos, fotos, videos, guías de marca

Phase 3: CONFIRM
  → Copilot generates structured brief summary
  → Shows to client: "Este es tu brief. ¿Todo correcto?"
  → Client can edit inline or confirm
  → On confirm: brief becomes a project in the pipeline
```

### Conversation State

Each copilot session has state tracked in DB:

Table `copilotSessions`:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| clientId | uuid FK → clients | |
| status | enum | active, completed, abandoned |
| projectType | varchar | Detected type (video, design, etc.) |
| currentPhase | enum | understand, define, confirm |
| currentQuestion | integer | Which question in the phase |
| answers | jsonb | All answers so far |
| generatedBrief | jsonb | Structured brief (null until Phase 3) |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Message API

```
POST /api/copilot/message
{
  "sessionId": "uuid" | null,  // null to start new session
  "message": "string"           // client's response
}

Response:
{
  "sessionId": "uuid",
  "reply": "string",            // copilot's next message
  "options": ["opt1", "opt2"],  // suggested answers (optional)
  "phase": "understand",
  "progress": 0.4,              // 0.0 to 1.0
  "brief": null | {...}         // structured brief when phase = confirm
}
```

### Claude Integration

Each message exchange:

```
System prompt (from skill file):
- You are the Brief Copilot for criteria.agency
- You guide clients through creating project briefs
- You are warm, professional, and efficient
- Ask ONE question at a time
- Offer 3-4 suggested answers when possible
- Never use jargon the client wouldn't understand
- If the client is vague, ask a clarifying follow-up
- Your job is to EXTRACT information, not to CREATE content

Context (injected per message):
- Client info (name, company, Brand DNA if exists)
- Conversation history (all Q&As so far)
- Current phase and question
- Project type detected

User message: "{client's response}"

Respond with JSON:
{
  "reply": "your message to the client",
  "options": ["suggested answer 1", "suggested answer 2", "suggested answer 3"] or null,
  "extractedData": { "key": "value" },  // what we learned from this answer
  "nextPhase": "understand" | "define" | "confirm" | null,
  "readyForBrief": false | true
}
```

### Brief Output Format

When `readyForBrief = true`, Copilot generates:

```json
{
  "projectType": "video",
  "objective": "Presentar la empresa a inversionistas",
  "audience": {
    "primary": "Inversionistas ángel en LATAM",
    "secondary": "Partners potenciales"
  },
  "message": "Somos la agencia de marketing del futuro",
  "tone": "profesional",
  "duration": "2min",
  "references": ["https://example.com/video1"],
  "materials": {
    "hasLogo": true,
    "hasPhotos": false,
    "hasBrandGuide": false
  },
  "additionalNotes": "El CEO quiere aparecer hablando a cámara"
}
```

This JSON becomes the input for the Creative Director (T1-L) when the project enters the pipeline.

### Integration with Review Portal

The Copilot can also be invoked from the review portal when a client requests revisions — instead of the client writing free-form feedback, the Copilot guides them: "¿Qué parte del video quieres cambiar?", "¿Es el mensaje, el visual, o el audio?", "Describe lo que te gustaría diferente."

Future: this becomes the primary client interface in the full Client Portal.

---

## 7. Dependencies & New Packages

| Package | For | Agent |
|---------|-----|-------|
| `node-cron` | Scheduled tasks | Subscription Manager |
| `@anthropic-ai/sdk` | Claude API calls | Financial Categorizer, Payment Reconciler, Content Writer, Brief Copilot |

Note: `@anthropic-ai/sdk` is also needed for making the video agents real (Phase 2). Adding it now establishes the pattern.

---

## 8. Files to Create

| File | Purpose | Agent |
|------|---------|-------|
| `src/services/categorizer.ts` | Transaction categorization waterfall | Financial Categorizer |
| `src/services/reconciler.ts` | Payment matching algorithm | Payment Reconciler |
| `src/services/subscription-manager.ts` | 6 scheduled tasks + manual triggers | Subscription Manager |
| `src/services/content-writer.ts` | Content generation with Claude + auto-review | Content Writer |
| `src/services/brief-copilot.ts` | Conversational brief builder | Brief Copilot |
| `src/api/finance-routes.ts` | Transaction + reconciliation endpoints | Categorizer + Reconciler |
| `src/api/content-routes.ts` | Content CRUD + generation endpoints | Content Writer |
| `src/api/copilot-routes.ts` | Conversational message endpoint | Brief Copilot |
| `agents/DC-001_content_writer.md` | Skill file with personality and rules | Content Writer |
| `agents/CP-001_brief_copilot.md` | Skill file with conversation structure | Brief Copilot |

## 9. Files to Modify

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add `contentPieces`, `copilotSessions` tables + enums |
| `src/api/routes.ts` | Mount finance, content, copilot routes |
| `src/api/checkout-routes.ts` | Add `invoice.payment_succeeded` → create transaction |
| `src/shared/config.ts` | Add `anthropicApiKey` |
| `package.json` | Add `node-cron`, `@anthropic-ai/sdk` |
| `.env` | Add `ANTHROPIC_API_KEY` |

---

## 10. Implementation Dependencies

The Financial Categorizer and Payment Reconciler depend on tables defined in the Financial Module spec (`2026-04-06-financial-module-design.md`): `transactions`, `expectedPayments`, `clientAliases`, `categorizationRules`, `bankSyncLog`. The financial module database schema must be implemented before these agents can work.

The Content Writer and Brief Copilot are independent — they only need their own tables (`contentPieces`, `copilotSessions`) and the Claude SDK.

**Recommended implementation order:**
1. Financial Module schema (tables + migration)
2. Financial Categorizer + Payment Reconciler (they plug into the sync pipeline)
3. Subscription Manager (independent, needs only existing `clients` table)
4. Content Writer (independent)
5. Brief Copilot (independent, but ideally after review portal is tested with real clients)

---

## 11. What Is NOT In This Spec

- Video production agents becoming real (separate spec — connecting existing mock agents to Claude)
- Brand Guardian integration with Content Writer (future — when Brand DNA exists)
- Full Client Portal UI for Brief Copilot (currently API-only, future: React chat widget)
- Content publishing/scheduling (Content Writer produces content, founder publishes manually)
- Multi-language content generation (Spanish only for launch, English when needed)
- A/B testing of content variants
- SEO keyword research agent (future addition to SEO/Content motor)
- Social media posting automation (future Community Management motor)

---

## 11. Verification

1. **Financial Categorizer:** Import CSV with mixed transactions → verify categories assigned. Manually correct one → verify rule learned. Import again → verify auto-categorized.

2. **Payment Reconciler:** Create expectedPayment for "Acme Corp" $5,000. Import CSV with "ACME CORPORATION" $5,000 → verify auto-reconciled. Import "J RODRIGUEZ" $5,000 with no match → verify Claude suggests best match.

3. **Subscription Manager:** Create a trial client with `trialEndsAt` = tomorrow → run `checkExpiringTrials()` → verify email sent. Set `trialEndsAt` = yesterday → run `checkExpiredTrials()` → verify status changed to canceled.

4. **Content Writer:** POST brief for LinkedIn post about "quality gates" → verify content returned with correct format, word count, CTA. Request revision with "make it more conversational" → verify revised version.

5. **Brief Copilot:** Start new session → send "Quiero un video" → verify question about objective. Answer all questions → verify structured brief generated. Confirm brief → verify project created in pipeline.

---

## Related Documents

- `docs/superpowers/specs/2026-04-06-gtm-strategy-design.md` — Content needs, funnel automation
- `docs/superpowers/specs/2026-04-06-financial-module-design.md` — Categorization rules, reconciliation algorithm, expectedPayments
- `docs/superpowers/specs/2026-04-06-marketing-engine-design.md` — SEO/Content motor, Transversal agents
- `AGENT_REGISTRY.md` — Video agent reference cards (pattern for new agents)
- `TEAM_STRUCTURE.md` — Team hierarchy and communication protocols
