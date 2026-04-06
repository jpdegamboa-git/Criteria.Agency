# Business Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 business automation agents — Financial Categorizer, Payment Reconciler, Subscription Manager, Content Writer, and Brief Copilot — to automate revenue operations and content production.

**Architecture:** 3 lightweight service agents (categorizer, reconciler, subscription manager) that run as functions/cron jobs, plus 2 platform agents (content writer, brief copilot) that use Claude via the Anthropic SDK. All share financial module DB tables as prerequisite.

**Tech Stack:** Hono (routes), Drizzle ORM (DB), `@anthropic-ai/sdk` (Claude calls), `node-cron` (scheduling), Resend (emails, already integrated)

**Spec:** `docs/superpowers/specs/2026-04-06-business-agents-design.md`

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @anthropic-ai/sdk node-cron
npm install -D @types/node-cron
```

- [ ] **Step 2: Add anthropicApiKey to config**

In `src/shared/config.ts`, add after the `stripe` block:

```typescript
  // Anthropic (Claude API)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
```

- [ ] **Step 3: Add env var to .env**

Append to `.env`:

```
# Anthropic (Claude API) — leave empty for mock mode
ANTHROPIC_API_KEY=
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/shared/config.ts
git commit -m "feat: add anthropic sdk and node-cron dependencies"
```

---

### Task 2: Financial Module Schema

Add the 5 tables from the financial module spec that the categorizer and reconciler depend on: `transactions`, `expectedPayments`, `clientAliases`, `categorizationRules`, `bankSyncLog`.

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add new enums to schema.ts**

Add after the existing `subscriptionStatusEnum` block (before `// ── Tables ──`):

```typescript
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
  "fee",
]);

export const transactionSourceEnum = pgEnum("transaction_source", [
  "csv_import",
  "conexion_bg",
  "stripe",
  "manual",
]);

export const expectedPaymentStatusEnum = pgEnum("expected_payment_status", [
  "pending",
  "reconciled",
  "overdue",
  "canceled",
]);

export const ruleMatchTypeEnum = pgEnum("rule_match_type", [
  "contains",
  "exact",
  "regex",
]);

export const ruleSourceEnum = pgEnum("rule_source", [
  "auto",
  "manual",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "completed",
  "failed",
  "partial",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "linkedin_post",
  "email_nurture",
  "blog_article",
  "social_caption",
  "landing_copy",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "review",
  "approved",
  "published",
]);

export const copilotSessionStatusEnum = pgEnum("copilot_session_status", [
  "active",
  "completed",
  "abandoned",
]);

export const copilotPhaseEnum = pgEnum("copilot_phase", [
  "understand",
  "define",
  "confirm",
]);
```

- [ ] **Step 2: Add financial tables**

Add after the `comments` table at the end of `schema.ts`:

```typescript
// ── Financial Module ──

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: varchar("bank_account_id", { length: 50 }).default("main").notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  description: text("description").notNull(),
  counterpartyName: varchar("counterparty_name", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  category: varchar("category", { length: 50 }),
  subcategory: varchar("subcategory", { length: 50 }),
  type: transactionTypeEnum("type"),
  source: transactionSourceEnum("source").notNull(),
  reconciled: integer("reconciled").default(0).notNull(), // 0=false, 1=true (drizzle boolean workaround)
  reconciledWithId: uuid("reconciled_with_id"),
  clientId: uuid("client_id").references(() => clients.id),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expectedPayments = pgTable("expected_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: expectedPaymentStatusEnum("status").default("pending").notNull(),
  reconciledTransactionId: uuid("reconciled_transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientAliases = pgTable("client_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  alias: varchar("alias", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categorizationRules = pgTable("categorization_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  matchType: ruleMatchTypeEnum("match_type").default("contains").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  source: ruleSourceEnum("source").default("manual").notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bankSyncLog = pgTable("bank_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  transactionsFound: integer("transactions_found").default(0).notNull(),
  transactionsNew: integer("transactions_new").default(0).notNull(),
  transactionsReconciled: integer("transactions_reconciled").default(0).notNull(),
  status: syncStatusEnum("status").notNull(),
  error: text("error"),
});

// ── Content & Copilot ──

export const contentPieces = pgTable("content_pieces", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: contentTypeEnum("type").notNull(),
  status: contentStatusEnum("status").default("draft").notNull(),
  brief: jsonb("brief").default({}).notNull(),
  content: text("content"),
  title: varchar("title", { length: 255 }),
  meta: jsonb("meta").default({}),
  version: integer("version").default(1).notNull(),
  revisionNotes: text("revision_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const copilotSessions = pgTable("copilot_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id),
  status: copilotSessionStatusEnum("status").default("active").notNull(),
  projectType: varchar("project_type", { length: 50 }),
  currentPhase: copilotPhaseEnum("current_phase").default("understand").notNull(),
  currentQuestion: integer("current_question").default(1).notNull(),
  answers: jsonb("answers").default({}).notNull(),
  generatedBrief: jsonb("generated_brief"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Generate and run migration**

```bash
npx drizzle-kit generate
npm run db:migrate
```

Expected: new migration file created, migration runs successfully.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add financial module + content + copilot tables (7 new tables, 10 new enums)"
```

---

### Task 3: Claude Client Helper

Shared Claude client used by categorizer, reconciler, content writer, and copilot.

**Files:**
- Create: `src/services/claude.ts`

- [ ] **Step 1: Create the Claude client wrapper**

```typescript
// src/services/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../shared/config.js";

const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;

export async function askClaude(params: {
  system: string;
  prompt: string;
  model?: "claude-sonnet-4-20250514" | "claude-haiku-4-20250414";
  maxTokens?: number;
}): Promise<string> {
  const model = params.model ?? "claude-haiku-4-20250414";

  if (!anthropic) {
    console.log(`[CLAUDE MOCK] model=${model}`);
    console.log(`[CLAUDE MOCK] system: ${params.system.slice(0, 100)}...`);
    console.log(`[CLAUDE MOCK] prompt: ${params.prompt.slice(0, 200)}...`);
    return JSON.stringify({
      _mock: true,
      message: "Claude API key not configured. Set ANTHROPIC_API_KEY in .env",
    });
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

export function isClaudeConfigured(): boolean {
  return anthropic !== null;
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/claude.ts
git commit -m "feat: add shared Claude client wrapper with mock fallback"
```

---

### Task 4: Financial Categorizer

**Files:**
- Create: `src/services/categorizer.ts`

- [ ] **Step 1: Create the categorizer service**

```typescript
// src/services/categorizer.ts
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { askClaude } from "./claude.js";

interface CategorizationResult {
  category: string;
  subcategory: string | null;
  type: "income" | "expense" | "transfer" | "fee";
  confidence: number;
  source: "fixed" | "learned" | "alias" | "ai";
}

// Step 1: Fixed rules (hardcoded)
const FIXED_RULES: Array<{
  patterns: string[];
  category: string;
  type: "income" | "expense" | "transfer" | "fee";
  confidence: number;
}> = [
  { patterns: ["STRIPE"], category: "subscription", type: "income", confidence: 1.0 },
  { patterns: ["COMISION", "COMMISSION", "FEE", "CARGO BANCARIO"], category: "bank_fees", type: "fee", confidence: 1.0 },
  { patterns: ["INTERES", "INTEREST"], category: "interest", type: "income", confidence: 0.95 },
  { patterns: ["TRANSFERENCIA PROPIA", "OWN TRANSFER", "TRASPASO"], category: "internal_transfer", type: "transfer", confidence: 0.95 },
];

function applyFixedRules(description: string): CategorizationResult | null {
  const upper = description.toUpperCase();
  for (const rule of FIXED_RULES) {
    if (rule.patterns.some((p) => upper.includes(p))) {
      return {
        category: rule.category,
        subcategory: null,
        type: rule.type,
        confidence: rule.confidence,
        source: "fixed",
      };
    }
  }
  return null;
}

// Step 2: Learned rules from DB
async function applyLearnedRules(description: string, counterpartyName: string | null): Promise<CategorizationResult | null> {
  const rules = await db
    .select()
    .from(schema.categorizationRules)
    .orderBy(desc(schema.categorizationRules.priority));

  const searchText = `${description} ${counterpartyName ?? ""}`.toUpperCase();

  for (const rule of rules) {
    const pattern = rule.pattern.toUpperCase();
    let matched = false;

    if (rule.matchType === "contains") {
      matched = searchText.includes(pattern);
    } else if (rule.matchType === "exact") {
      matched = searchText === pattern;
    } else if (rule.matchType === "regex") {
      try {
        matched = new RegExp(rule.pattern, "i").test(searchText);
      } catch {
        matched = false;
      }
    }

    if (matched) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        type: rule.transactionType as "income" | "expense" | "transfer" | "fee",
        confidence: 0.9,
        source: "learned",
      };
    }
  }
  return null;
}

// Step 3: Client alias match
async function applyAliasMatch(counterpartyName: string | null, amount: string): Promise<CategorizationResult | null> {
  if (!counterpartyName || parseFloat(amount) <= 0) return null; // only for income

  const aliases = await db.select().from(schema.clientAliases);
  const normalized = counterpartyName.toLowerCase().trim();

  for (const alias of aliases) {
    if (alias.alias.toLowerCase().trim() === normalized) {
      return {
        category: "client_payment",
        subcategory: null,
        type: "income",
        confidence: 0.95,
        source: "alias",
      };
    }
  }
  return null;
}

// Step 4: Claude AI fallback
async function applyAICategorization(transaction: {
  date: Date;
  description: string;
  counterpartyName: string | null;
  amount: string;
  currency: string;
  reference: string | null;
}): Promise<CategorizationResult> {
  // Get recent categorized transactions as examples
  const examples = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.source, "csv_import"))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(10);

  const exampleText = examples
    .filter((e) => e.category)
    .map((e) => `- "${e.description}" (${e.amount}) → ${e.category} (${e.type})`)
    .join("\n");

  const prompt = `Transaction:
- Date: ${transaction.date.toISOString().split("T")[0]}
- Description: ${transaction.description}
- Counterparty: ${transaction.counterpartyName ?? "N/A"}
- Amount: ${transaction.amount} ${transaction.currency}
- Reference: ${transaction.reference ?? "N/A"}

Recent categorization examples:
${exampleText || "No examples yet."}

Respond with JSON only:
{ "category": "...", "subcategory": "..." or null, "type": "income|expense|transfer|fee", "confidence": 0.0-1.0 }`;

  const system = `You are a financial transaction categorizer for a video production & marketing agency.

Available categories:
INCOME: client_payment, subscription, refund_received, interest, other_income
EXPENSE: ai_api_costs, infrastructure, software_subscriptions, contractor, taxes, bank_fees, marketing, office, other_expense
TRANSFER: internal_transfer

Respond with valid JSON only. No explanation.`;

  try {
    const response = await askClaude({ system, prompt, model: "claude-haiku-4-20250414" });
    const parsed = JSON.parse(response);
    return {
      category: parsed.category ?? "other_expense",
      subcategory: parsed.subcategory ?? null,
      type: parsed.type ?? (parseFloat(transaction.amount) >= 0 ? "income" : "expense"),
      confidence: parsed.confidence ?? 0.7,
      source: "ai",
    };
  } catch {
    // Fallback if Claude fails
    const amt = parseFloat(transaction.amount);
    return {
      category: amt >= 0 ? "other_income" : "other_expense",
      subcategory: null,
      type: amt >= 0 ? "income" : "expense",
      confidence: 0.3,
      source: "ai",
    };
  }
}

// Main entry point
export async function categorizeTransaction(transaction: {
  date: Date;
  description: string;
  counterpartyName: string | null;
  amount: string;
  currency: string;
  reference: string | null;
}): Promise<CategorizationResult> {
  // Step 1: Fixed rules
  const fixed = applyFixedRules(transaction.description);
  if (fixed) return fixed;

  // Step 2: Learned rules
  const learned = await applyLearnedRules(transaction.description, transaction.counterpartyName);
  if (learned) return learned;

  // Step 3: Client alias match
  const alias = await applyAliasMatch(transaction.counterpartyName, transaction.amount);
  if (alias) return alias;

  // Step 4: AI fallback
  return applyAICategorization(transaction);
}

// Learning: create rule from manual correction
export async function learnFromCorrection(
  description: string,
  category: string,
  subcategory: string | null,
  type: "income" | "expense" | "transfer" | "fee",
): Promise<void> {
  // Extract distinctive words (3+ chars, not common words)
  const stopWords = new Set(["the", "and", "for", "from", "with", "del", "para", "por", "con", "las", "los", "una"]);
  const words = description
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w.toLowerCase()))
    .slice(0, 3);

  if (words.length === 0) return;

  const pattern = words.join(" ");

  // Check if rule already exists
  const existing = await db
    .select()
    .from(schema.categorizationRules)
    .where(eq(schema.categorizationRules.pattern, pattern));

  if (existing.length > 0) return;

  await db.insert(schema.categorizationRules).values({
    pattern,
    matchType: "contains",
    category,
    subcategory,
    transactionType: type,
    source: "auto",
    priority: 0,
  });
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/categorizer.ts
git commit -m "feat: add financial categorizer with waterfall logic (fixed → learned → alias → AI)"
```

---

### Task 5: Payment Reconciler

**Files:**
- Create: `src/services/reconciler.ts`

- [ ] **Step 1: Create the reconciler service**

```typescript
// src/services/reconciler.ts
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { askClaude } from "./claude.js";

interface ReconciliationResult {
  matched: boolean;
  matchType: "exact" | "amount" | "fuzzy" | "ai" | "none";
  expectedPaymentId: string | null;
  clientId: string | null;
  confidence: number;
  autoReconciled: boolean;
}

// Name normalization
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(s\.?a\.?|llc|inc\.?|corp\.?|ltd\.?|s\.?r\.?l\.?)\b/gi, "")
    .replace(/\b(wire|transfer|trf|intl|international|payment|pago)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein similarity (0-100)
function similarity(a: string, b: string): number {
  if (a === b) return 100;
  if (!a || !b) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const maxLen = Math.max(a.length, b.length);
  return Math.round((1 - matrix[a.length][b.length] / maxLen) * 100);
}

// Check name against client + aliases
async function findClientByName(counterpartyName: string): Promise<{ clientId: string; score: number } | null> {
  const normalized = normalizeName(counterpartyName);

  // Check aliases first (exact match on normalized)
  const aliases = await db.select().from(schema.clientAliases);
  for (const alias of aliases) {
    if (normalizeName(alias.alias) === normalized) {
      return { clientId: alias.clientId, score: 100 };
    }
  }

  // Check client names and companies
  const clients = await db.select().from(schema.clients);
  let best: { clientId: string; score: number } | null = null;

  for (const client of clients) {
    const nameScore = similarity(normalized, normalizeName(client.name));
    const companyScore = client.company ? similarity(normalized, normalizeName(client.company)) : 0;
    const score = Math.max(nameScore, companyScore);

    if (score >= 85 && (!best || score > best.score)) {
      best = { clientId: client.id, score };
    }
  }

  return best;
}

export async function reconcileTransaction(transaction: {
  id: string;
  amount: string;
  counterpartyName: string | null;
  date: Date;
  description: string;
  type: string | null;
}): Promise<ReconciliationResult> {
  // Only reconcile income transactions
  if (transaction.type !== "income") {
    return { matched: false, matchType: "none", expectedPaymentId: null, clientId: null, confidence: 0, autoReconciled: false };
  }

  const txAmount = parseFloat(transaction.amount);

  // Get pending expected payments
  const pending = await db
    .select({
      ep: schema.expectedPayments,
      client: schema.clients,
    })
    .from(schema.expectedPayments)
    .innerJoin(schema.clients, eq(schema.expectedPayments.clientId, schema.clients.id))
    .where(eq(schema.expectedPayments.status, "pending"));

  // Level 1: EXACT MATCH — amount exact + name ≥85%
  if (transaction.counterpartyName) {
    const clientMatch = await findClientByName(transaction.counterpartyName);

    for (const { ep } of pending) {
      const epAmount = parseFloat(ep.amount);
      if (Math.abs(txAmount - epAmount) < 0.01 && clientMatch && clientMatch.clientId === ep.clientId) {
        return {
          matched: true,
          matchType: "exact",
          expectedPaymentId: ep.id,
          clientId: ep.clientId,
          confidence: 0.95,
          autoReconciled: true,
        };
      }
    }

    // Level 3: FUZZY MATCH — name ≥85%, amount ≤5% diff
    if (clientMatch) {
      for (const { ep } of pending) {
        const epAmount = parseFloat(ep.amount);
        const amountDiff = Math.abs(txAmount - epAmount) / epAmount;
        if (amountDiff <= 0.05 && clientMatch.clientId === ep.clientId) {
          return {
            matched: true,
            matchType: "fuzzy",
            expectedPaymentId: ep.id,
            clientId: ep.clientId,
            confidence: 0.5,
            autoReconciled: false,
          };
        }
      }
    }
  }

  // Level 2: AMOUNT MATCH — exact amount, name doesn't match
  for (const { ep } of pending) {
    const epAmount = parseFloat(ep.amount);
    if (Math.abs(txAmount - epAmount) < 0.01) {
      return {
        matched: true,
        matchType: "amount",
        expectedPaymentId: ep.id,
        clientId: ep.clientId,
        confidence: 0.6,
        autoReconciled: false,
      };
    }
  }

  // Level 4: AI — for amounts > $100
  if (txAmount > 100 && pending.length > 0) {
    const pendingList = pending
      .map(({ ep, client }) => `- ${client.name} (${client.company ?? "N/A"}): $${ep.amount}, due ${new Date(ep.dueDate).toISOString().split("T")[0]}`)
      .join("\n");

    const allClients = await db.select().from(schema.clients);
    const clientList = allClients
      .map((c) => `- ${c.name} (${c.company ?? "N/A"}, ${c.email})`)
      .join("\n");

    const prompt = `Unmatched bank transaction:
- Amount: $${txAmount}
- Sender: "${transaction.counterpartyName ?? "N/A"}"
- Date: ${transaction.date.toISOString().split("T")[0]}
- Description: "${transaction.description}"

Clients with pending payments:
${pendingList}

All active clients:
${clientList}

Is this transaction a payment from one of these clients?
Respond with JSON only:
{ "clientId": "uuid" or null, "expectedPaymentId": "uuid" or null, "confidence": 0.0-1.0, "reasoning": "one sentence" }`;

    try {
      const response = await askClaude({
        system: "You are a payment reconciliation assistant. Match bank transactions to expected client payments. Consider name variations and bank fee deductions. Respond with valid JSON only.",
        prompt,
        model: "claude-haiku-4-20250414",
      });

      const parsed = JSON.parse(response);
      if (parsed.clientId && parsed.confidence >= 0.5) {
        return {
          matched: true,
          matchType: "ai",
          expectedPaymentId: parsed.expectedPaymentId,
          clientId: parsed.clientId,
          confidence: parsed.confidence,
          autoReconciled: parsed.confidence >= 0.9,
        };
      }
    } catch {
      // AI failed, fall through to no match
    }
  }

  return { matched: false, matchType: "none", expectedPaymentId: null, clientId: null, confidence: 0, autoReconciled: false };
}

// Apply reconciliation to DB
export async function applyReconciliation(
  transactionId: string,
  expectedPaymentId: string,
  clientId: string,
  counterpartyName: string | null,
): Promise<void> {
  // Link transaction → expectedPayment
  await db.update(schema.transactions).set({
    reconciled: 1,
    reconciledWithId: expectedPaymentId,
    clientId,
    category: "client_payment",
  }).where(eq(schema.transactions.id, transactionId));

  // Link expectedPayment → transaction
  await db.update(schema.expectedPayments).set({
    status: "reconciled",
    reconciledTransactionId: transactionId,
  }).where(eq(schema.expectedPayments.id, expectedPaymentId));

  // Save alias for future matches
  if (counterpartyName) {
    const existing = await db.select().from(schema.clientAliases)
      .where(and(
        eq(schema.clientAliases.clientId, clientId),
        eq(schema.clientAliases.alias, counterpartyName),
      ));

    if (existing.length === 0) {
      await db.insert(schema.clientAliases).values({ clientId, alias: counterpartyName });
    }
  }

  // Activate subscription if needed
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, clientId));
  if (client && (!client.subscriptionStatus || client.subscriptionStatus === "past_due")) {
    await db.update(schema.clients).set({
      subscriptionStatus: "active",
      subscriptionTier: client.subscriptionTier ?? "pro",
    }).where(eq(schema.clients.id, clientId));
  }

  // Create next expected payment (recurring monthly)
  const [ep] = await db.select().from(schema.expectedPayments).where(eq(schema.expectedPayments.id, expectedPaymentId));
  if (ep) {
    const nextDue = new Date(ep.dueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
    await db.insert(schema.expectedPayments).values({
      clientId,
      amount: ep.amount,
      currency: ep.currency,
      description: ep.description,
      dueDate: nextDue,
    });
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/reconciler.ts
git commit -m "feat: add payment reconciler with 4-level matching + AI fallback"
```

---

### Task 6: Subscription Manager

**Files:**
- Create: `src/services/subscription-manager.ts`

- [ ] **Step 1: Create the subscription manager**

```typescript
// src/services/subscription-manager.ts
import { db, schema } from "../db/index.js";
import { eq, and, lt, gt, between, isNull, sql } from "drizzle-orm";
import { config } from "../shared/config.js";
import { send as sendEmail } from "./email.js";

// Re-export individual email send for subscription manager
async function notify(to: string, subject: string, html: string) {
  // Use the same send function pattern from email.ts
  const { Resend } = await import("resend");
  const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

  if (!resend) {
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${html.replace(/<[^>]*>/g, "").trim()}`);
    console.log(`[EMAIL] ---`);
    return;
  }

  await resend.emails.send({
    from: "criteria.agency <noreply@criteria.agency>",
    to,
    subject,
    html,
  });
}

// Task 1: Trial Expiry Warning
export async function checkExpiringTrials(): Promise<number> {
  const now = new Date();
  const fiveDaysFromNow = new Date(now);
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

  const expiring = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        eq(schema.clients.subscriptionStatus, "trialing"),
        gt(schema.clients.trialEndsAt, now),
        lt(schema.clients.trialEndsAt, fiveDaysFromNow),
      ),
    );

  for (const client of expiring) {
    const daysLeft = Math.ceil(
      (new Date(client.trialEndsAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    await notify(
      client.email,
      `Tu trial termina en ${daysLeft} dias`,
      `<h2>Tu trial de criteria.agency termina pronto</h2>
       <p>Hola ${client.name},</p>
       <p>Tu periodo de prueba termina en <strong>${daysLeft} dias</strong>.</p>
       <p>Agrega tu metodo de pago para continuar disfrutando del servicio.</p>
       <p><a href="${config.baseUrl}/pricing" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Ver planes</a></p>`,
    );
  }

  console.log(`[SUBS] Trial expiry warning: ${expiring.length} clients notified`);
  return expiring.length;
}

// Task 2: Trial Expired
export async function checkExpiredTrials(): Promise<number> {
  const now = new Date();

  const expired = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        eq(schema.clients.subscriptionStatus, "trialing"),
        lt(schema.clients.trialEndsAt, now),
      ),
    );

  for (const client of expired) {
    await db
      .update(schema.clients)
      .set({ subscriptionStatus: "canceled" })
      .where(eq(schema.clients.id, client.id));

    await notify(
      client.email,
      `Tu trial ha terminado`,
      `<h2>Tu periodo de prueba ha terminado</h2>
       <p>Hola ${client.name},</p>
       <p>Tu trial de criteria.agency ha finalizado. Puedes reactivar tu cuenta cuando quieras.</p>
       <p><a href="${config.baseUrl}/pricing">Ver planes</a></p>`,
    );

    await notify(
      config.founderEmail,
      `Trial expirado: ${client.name}`,
      `<p>El trial de <strong>${client.name}</strong> (${client.email}) ha expirado sin conversion.</p>`,
    );
  }

  console.log(`[SUBS] Expired trials: ${expired.length} canceled`);
  return expired.length;
}

// Task 3: Overdue Wire Payments
export async function checkOverduePayments(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const overdue = await db
    .select({ ep: schema.expectedPayments, client: schema.clients })
    .from(schema.expectedPayments)
    .innerJoin(schema.clients, eq(schema.expectedPayments.clientId, schema.clients.id))
    .where(
      and(
        eq(schema.expectedPayments.status, "pending"),
        lt(schema.expectedPayments.dueDate, sevenDaysAgo),
      ),
    );

  for (const { ep, client } of overdue) {
    await db
      .update(schema.expectedPayments)
      .set({ status: "overdue" })
      .where(eq(schema.expectedPayments.id, ep.id));

    if (!client.subscriptionStatus || client.subscriptionStatus !== "past_due") {
      await db
        .update(schema.clients)
        .set({ subscriptionStatus: "past_due" })
        .where(eq(schema.clients.id, client.id));
    }

    const daysOverdue = Math.ceil(
      (Date.now() - new Date(ep.dueDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    await notify(
      config.founderEmail,
      `Pago vencido: ${client.name} — $${ep.amount}`,
      `<p>Pago de <strong>${client.name}</strong> vencido hace ${daysOverdue} dias.</p>
       <p>Monto: $${ep.amount} — Vencimiento: ${new Date(ep.dueDate).toISOString().split("T")[0]}</p>`,
    );
  }

  console.log(`[SUBS] Overdue payments: ${overdue.length} flagged`);
  return overdue.length;
}

// Task 4: Churn Risk Detection
export async function detectChurnRisk(): Promise<string[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Active clients with no recent projects
  const activeClients = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "active"));

  const atRisk: string[] = [];

  for (const client of activeClients) {
    const recentProjects = await db
      .select()
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.clientId, client.id),
          gt(schema.projects.createdAt, thirtyDaysAgo),
        ),
      );

    if (recentProjects.length === 0) {
      atRisk.push(`${client.name} (${client.email}) — sin proyectos en 30+ dias`);
    }
  }

  if (atRisk.length > 0) {
    await notify(
      config.founderEmail,
      `Alerta: ${atRisk.length} clientes en riesgo de churn`,
      `<h2>Clientes sin actividad en 30+ dias</h2>
       <ul>${atRisk.map((r) => `<li>${r}</li>`).join("")}</ul>
       <p>Considera contactarlos para re-engagement.</p>`,
    );
  }

  console.log(`[SUBS] Churn risk: ${atRisk.length} clients at risk`);
  return atRisk;
}

// Task 5: Create Recurring Expected Payments
export async function createRecurringPayments(): Promise<number> {
  const enterpriseClients = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        eq(schema.clients.subscriptionStatus, "active"),
      ),
    );

  // Filter to enterprise-ish (has expectedPayments history)
  let created = 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (const client of enterpriseClients) {
    // Find last reconciled payment to get amount
    const lastPayment = await db
      .select()
      .from(schema.expectedPayments)
      .where(
        and(
          eq(schema.expectedPayments.clientId, client.id),
          eq(schema.expectedPayments.status, "reconciled"),
        ),
      )
      .orderBy(sql`${schema.expectedPayments.dueDate} DESC`)
      .limit(1);

    if (lastPayment.length === 0) continue;

    // Check if this month's payment already exists
    const existingThisMonth = await db
      .select()
      .from(schema.expectedPayments)
      .where(
        and(
          eq(schema.expectedPayments.clientId, client.id),
          gt(schema.expectedPayments.dueDate, new Date(currentYear, currentMonth, 1)),
          lt(schema.expectedPayments.dueDate, new Date(currentYear, currentMonth + 1, 1)),
        ),
      );

    if (existingThisMonth.length > 0) continue;

    // Create new expected payment for 15th of current month
    const dueDate = new Date(currentYear, currentMonth, 15);
    await db.insert(schema.expectedPayments).values({
      clientId: client.id,
      amount: lastPayment[0].amount,
      currency: lastPayment[0].currency,
      description: lastPayment[0].description,
      dueDate,
    });
    created++;
  }

  console.log(`[SUBS] Recurring payments: ${created} created`);
  return created;
}

// Task 6: Early Adopter Transition Notice
export async function sendEarlyAdopterTransitionNotice(): Promise<number> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const transitioning = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        gt(schema.clients.earlyAdopterEndsAt, now),
        lt(schema.clients.earlyAdopterEndsAt, sevenDaysFromNow),
      ),
    );

  for (const client of transitioning) {
    const endDate = new Date(client.earlyAdopterEndsAt!).toISOString().split("T")[0];
    const tier = client.subscriptionTier;
    const fullPrice = tier === "starter" ? "$500" : "$2,000";

    await notify(
      client.email,
      `Tu precio early adopter termina pronto`,
      `<h2>Aviso sobre tu suscripcion</h2>
       <p>Hola ${client.name},</p>
       <p>Tu precio early adopter termina el <strong>${endDate}</strong>.</p>
       <p>A partir de esa fecha, tu plan ${tier} pasa a <strong>${fullPrice}/mes</strong>.</p>
       <p>Gracias por ser de los primeros en confiar en criteria.agency.</p>`,
    );
  }

  console.log(`[SUBS] Early adopter notices: ${transitioning.length} sent`);
  return transitioning.length;
}

// Summary for dashboard
export async function getSubscriptionSummary(): Promise<{
  trialing: number;
  active: number;
  pastDue: number;
  canceled: number;
  atRiskCount: number;
}> {
  const clients = await db.select().from(schema.clients);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let atRiskCount = 0;
  for (const client of clients.filter((c) => c.subscriptionStatus === "active")) {
    const recent = await db.select().from(schema.projects)
      .where(and(eq(schema.projects.clientId, client.id), gt(schema.projects.createdAt, thirtyDaysAgo)));
    if (recent.length === 0) atRiskCount++;
  }

  return {
    trialing: clients.filter((c) => c.subscriptionStatus === "trialing").length,
    active: clients.filter((c) => c.subscriptionStatus === "active").length,
    pastDue: clients.filter((c) => c.subscriptionStatus === "past_due").length,
    canceled: clients.filter((c) => c.subscriptionStatus === "canceled").length,
    atRiskCount,
  };
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/subscription-manager.ts
git commit -m "feat: add subscription manager with 6 automated tasks"
```

---

### Task 7: Finance & Subscription API Routes

**Files:**
- Create: `src/api/finance-routes.ts`

- [ ] **Step 1: Create finance routes**

```typescript
// src/api/finance-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, sql } from "drizzle-orm";
import { categorizeTransaction, learnFromCorrection } from "../services/categorizer.js";
import { reconcileTransaction, applyReconciliation } from "../services/reconciler.js";
import {
  checkExpiringTrials,
  checkExpiredTrials,
  checkOverduePayments,
  detectChurnRisk,
  getSubscriptionSummary,
} from "../services/subscription-manager.js";

export const financeRoutes = new Hono();

// ── Transactions ──

// GET /api/transactions — List (paginated, filterable)
financeRoutes.get("/api/transactions", async (c) => {
  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");

  const txns = await db
    .select()
    .from(schema.transactions)
    .orderBy(desc(schema.transactions.date))
    .limit(limit)
    .offset(offset);

  const total = await db.select({ count: sql<number>`count(*)` }).from(schema.transactions);

  return c.json({ data: txns, total: total[0].count, limit, offset });
});

// GET /api/transactions/:id
financeRoutes.get("/api/transactions/:id", async (c) => {
  const [txn] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, c.req.param("id")));
  if (!txn) return c.json({ error: "Not found" }, 404);
  return c.json(txn);
});

// PATCH /api/transactions/:id — Update category, notes
financeRoutes.patch("/api/transactions/:id", async (c) => {
  const body = await c.req.json();
  const { category, subcategory, type, notes } = body;

  const [txn] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, c.req.param("id")));
  if (!txn) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, any> = {};
  if (category) updates.category = category;
  if (subcategory !== undefined) updates.subcategory = subcategory;
  if (type) updates.type = type;
  if (notes !== undefined) updates.notes = notes;

  await db.update(schema.transactions).set(updates).where(eq(schema.transactions.id, txn.id));

  // Learn from correction
  if (category && category !== txn.category) {
    await learnFromCorrection(txn.description, category, subcategory ?? null, type ?? txn.type);
  }

  return c.json({ ok: true });
});

// POST /api/transactions/:id/reconcile — Manual reconciliation
financeRoutes.post("/api/transactions/:id/reconcile", async (c) => {
  const body = await c.req.json();
  const { expectedPaymentId } = body;

  const [txn] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, c.req.param("id")));
  if (!txn) return c.json({ error: "Transaction not found" }, 404);

  const [ep] = await db.select().from(schema.expectedPayments).where(eq(schema.expectedPayments.id, expectedPaymentId));
  if (!ep) return c.json({ error: "Expected payment not found" }, 404);

  await applyReconciliation(txn.id, ep.id, ep.clientId, txn.counterpartyName);

  return c.json({ ok: true });
});

// ── Expected Payments ──

financeRoutes.post("/api/expected-payments", async (c) => {
  const body = await c.req.json();
  const { clientId, amount, currency, description, dueDate } = body;

  const [ep] = await db.insert(schema.expectedPayments).values({
    clientId,
    amount,
    currency: currency ?? "USD",
    description,
    dueDate: new Date(dueDate),
  }).returning();

  return c.json(ep, 201);
});

financeRoutes.get("/api/expected-payments", async (c) => {
  const status = c.req.query("status");
  const payments = status
    ? await db.select().from(schema.expectedPayments).where(eq(schema.expectedPayments.status, status as any))
    : await db.select().from(schema.expectedPayments);
  return c.json(payments);
});

financeRoutes.patch("/api/expected-payments/:id", async (c) => {
  const body = await c.req.json();
  const [ep] = await db.select().from(schema.expectedPayments).where(eq(schema.expectedPayments.id, c.req.param("id")));
  if (!ep) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, any> = {};
  if (body.amount) updates.amount = body.amount;
  if (body.dueDate) updates.dueDate = new Date(body.dueDate);
  if (body.status) updates.status = body.status;

  await db.update(schema.expectedPayments).set(updates).where(eq(schema.expectedPayments.id, ep.id));
  return c.json({ ok: true });
});

financeRoutes.delete("/api/expected-payments/:id", async (c) => {
  await db.update(schema.expectedPayments).set({ status: "canceled" }).where(eq(schema.expectedPayments.id, c.req.param("id")));
  return c.json({ ok: true });
});

// ── Categorization Rules ──

financeRoutes.get("/api/categorization-rules", async (c) => {
  const rules = await db.select().from(schema.categorizationRules).orderBy(desc(schema.categorizationRules.priority));
  return c.json(rules);
});

financeRoutes.post("/api/categorization-rules", async (c) => {
  const body = await c.req.json();
  const [rule] = await db.insert(schema.categorizationRules).values({
    pattern: body.pattern,
    matchType: body.matchType ?? "contains",
    category: body.category,
    subcategory: body.subcategory ?? null,
    transactionType: body.transactionType,
    source: "manual",
    priority: body.priority ?? 10,
  }).returning();
  return c.json(rule, 201);
});

financeRoutes.delete("/api/categorization-rules/:id", async (c) => {
  await db.delete(schema.categorizationRules).where(eq(schema.categorizationRules.id, c.req.param("id")));
  return c.json({ ok: true });
});

// ── Subscription Management ──

financeRoutes.post("/api/subscriptions/check-trials", async (c) => {
  const warned = await checkExpiringTrials();
  const expired = await checkExpiredTrials();
  return c.json({ warned, expired });
});

financeRoutes.post("/api/subscriptions/check-overdue", async (c) => {
  const overdue = await checkOverduePayments();
  return c.json({ overdue });
});

financeRoutes.get("/api/subscriptions/at-risk", async (c) => {
  const atRisk = await detectChurnRisk();
  return c.json({ atRisk, count: atRisk.length });
});

financeRoutes.get("/api/subscriptions/summary", async (c) => {
  const summary = await getSubscriptionSummary();
  return c.json(summary);
});
```

- [ ] **Step 2: Mount routes in main app**

In `src/api/routes.ts`, add import and mount:

```typescript
import { financeRoutes } from "./finance-routes.js";
// ... after existing mounts:
app.route("/", financeRoutes);
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/api/finance-routes.ts src/api/routes.ts
git commit -m "feat: add finance + subscription API routes (transactions, payments, rules, subs)"
```

---

### Task 8: Content Writer Agent

**Files:**
- Create: `src/services/content-writer.ts`
- Create: `agents/DC-001_content_writer.md`
- Create: `src/api/content-routes.ts`

- [ ] **Step 1: Create the Content Writer skill file**

```markdown
<!-- agents/DC-001_content_writer.md -->
# DC-001 — Content Writer

## Identity
- **ID:** DC-001
- **Name:** Content Writer
- **Motor:** SEO/Content (Distribution)
- **Level:** leader
- **Autonomy:** 80%

## Role
You are the Content Writer for criteria.agency. You produce marketing content that embodies the brand voice: professional but accessible, confident not arrogant, technical when needed.

## Core Narrative
"La IA genera. El criterio decide." — 20 years of professional judgment codified into a system that demands quality before delivering.

## Brand Voice Rules
- Professional but accessible — no jargon unless the audience expects it
- Confident not arrogant — show expertise without condescension
- Concrete over abstract — examples, numbers, specifics over buzzwords
- Spanish by default, English when specified

## Banned Words
Never use: "revolutionary", "game-changing", "cutting-edge", "disruptive", "synergy", "leverage" (as verb), "paradigm shift", "best-in-class"

## Content Rules
- Every piece must have a clear CTA
- Open with the most interesting idea, not setup/context
- End with value, not filler
- Use short paragraphs (2-3 sentences max)
- For social: hook in first line, value in body, CTA at end

## Output Format
Always return valid JSON:
{
  "content": "the content in markdown",
  "title": "headline or subject line",
  "meta": {
    "keywords": ["keyword1", "keyword2"],
    "cta": "the call to action text",
    "audience": "who this is for",
    "wordCount": 245,
    "readabilityScore": 72
  }
}
```

- [ ] **Step 2: Create the content writer service**

```typescript
// src/services/content-writer.ts
import { askClaude, isClaudeConfigured } from "./claude.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { config } from "../shared/config.js";

const SKILL_FILE = path.resolve(config.agentsPath, "DC-001_content_writer.md");

function getSystemPrompt(): string {
  try {
    return fs.readFileSync(SKILL_FILE, "utf-8");
  } catch {
    return "You are a professional content writer for criteria.agency. Core narrative: La IA genera. El criterio decide.";
  }
}

const WORD_LIMITS: Record<string, number> = {
  linkedin_post: 300,
  email_nurture: 500,
  blog_article: 1500,
  social_caption: 150,
  landing_copy: 800,
};

const BANNED_WORDS = ["revolutionary", "game-changing", "cutting-edge", "disruptive", "synergy", "paradigm shift", "best-in-class"];

interface ContentBrief {
  type: string;
  topic: string;
  audience: string;
  tone: "professional" | "conversational" | "inspirational" | "technical";
  keyMessage: string;
  cta: string;
  references?: string;
  language?: "es" | "en";
}

interface ContentResult {
  content: string;
  title: string;
  meta: {
    keywords: string[];
    cta: string;
    audience: string;
    wordCount: number;
    readabilityScore: number;
  };
}

// Auto-review checks
function autoReview(result: ContentResult, brief: ContentBrief): string[] {
  const issues: string[] = [];
  const limit = WORD_LIMITS[brief.type] ?? 500;

  if (result.meta.wordCount > limit * 1.1) {
    issues.push(`Word count ${result.meta.wordCount} exceeds limit ${limit} by >10%`);
  }
  if (result.meta.wordCount < limit * 0.5) {
    issues.push(`Word count ${result.meta.wordCount} is less than 50% of target ${limit}`);
  }
  if (!result.meta.cta || result.meta.cta.length < 5) {
    issues.push("Missing or weak CTA");
  }

  const contentLower = result.content.toLowerCase();
  const found = BANNED_WORDS.filter((w) => contentLower.includes(w));
  if (found.length > 0) {
    issues.push(`Banned words found: ${found.join(", ")}`);
  }

  return issues;
}

export async function generateContent(brief: ContentBrief): Promise<ContentResult> {
  const system = getSystemPrompt();
  const wordLimit = WORD_LIMITS[brief.type] ?? 500;

  const prompt = `Generate content with these specifications:

Content type: ${brief.type}
Topic: ${brief.topic}
Target audience: ${brief.audience}
Tone: ${brief.tone}
Key message: ${brief.keyMessage}
CTA: ${brief.cta}
Language: ${brief.language ?? "es"}
Word limit: ${wordLimit} words
${brief.references ? `References/context: ${brief.references}` : ""}

Respond with valid JSON only matching this format:
{
  "content": "the content in markdown",
  "title": "headline or subject line",
  "meta": {
    "keywords": ["keyword1", "keyword2"],
    "cta": "the call to action text",
    "audience": "who this is for",
    "wordCount": <number>,
    "readabilityScore": <number 1-100>
  }
}`;

  const response = await askClaude({
    system,
    prompt,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
  });

  let result: ContentResult;
  try {
    result = JSON.parse(response);
  } catch {
    result = {
      content: response,
      title: brief.topic,
      meta: { keywords: [], cta: brief.cta, audience: brief.audience, wordCount: response.split(/\s+/).length, readabilityScore: 70 },
    };
  }

  // Auto-review with up to 2 self-revisions
  for (let attempt = 0; attempt < 2; attempt++) {
    const issues = autoReview(result, brief);
    if (issues.length === 0) break;

    const revisionPrompt = `The content has these issues:
${issues.map((i) => `- ${i}`).join("\n")}

Original content:
${result.content}

Fix these issues and return the corrected content in the same JSON format.`;

    const revised = await askClaude({ system, prompt: revisionPrompt, model: "claude-sonnet-4-20250514", maxTokens: 4096 });
    try {
      result = JSON.parse(revised);
    } catch {
      break; // Can't parse revision, use current
    }
  }

  return result;
}

export async function reviseContent(contentId: string, feedback: string): Promise<ContentResult> {
  const [piece] = await db.select().from(schema.contentPieces).where(eq(schema.contentPieces.id, contentId));
  if (!piece) throw new Error("Content piece not found");

  const system = getSystemPrompt();
  const prompt = `Revise this content based on feedback:

Original content:
${piece.content}

Original brief:
${JSON.stringify(piece.brief)}

Feedback:
${feedback}

Return revised content in the same JSON format.`;

  const response = await askClaude({ system, prompt, model: "claude-sonnet-4-20250514", maxTokens: 4096 });

  let result: ContentResult;
  try {
    result = JSON.parse(response);
  } catch {
    result = {
      content: response,
      title: piece.title ?? "",
      meta: piece.meta as any ?? { keywords: [], cta: "", audience: "", wordCount: 0, readabilityScore: 70 },
    };
  }

  return result;
}
```

- [ ] **Step 3: Create content API routes**

```typescript
// src/api/content-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { generateContent, reviseContent } from "../services/content-writer.js";

export const contentRoutes = new Hono();

// POST /api/content/generate — Generate new content
contentRoutes.post("/api/content/generate", async (c) => {
  const brief = await c.req.json();

  if (!brief.type || !brief.topic || !brief.audience || !brief.tone || !brief.keyMessage || !brief.cta) {
    return c.json({ error: "Missing required fields: type, topic, audience, tone, keyMessage, cta" }, 400);
  }

  const result = await generateContent(brief);

  const [piece] = await db.insert(schema.contentPieces).values({
    type: brief.type,
    status: "review",
    brief,
    content: result.content,
    title: result.title,
    meta: result.meta,
  }).returning();

  return c.json(piece, 201);
});

// GET /api/content — List all
contentRoutes.get("/api/content", async (c) => {
  const pieces = await db.select().from(schema.contentPieces).orderBy(desc(schema.contentPieces.createdAt));
  return c.json(pieces);
});

// GET /api/content/:id
contentRoutes.get("/api/content/:id", async (c) => {
  const [piece] = await db.select().from(schema.contentPieces).where(eq(schema.contentPieces.id, c.req.param("id")));
  if (!piece) return c.json({ error: "Not found" }, 404);
  return c.json(piece);
});

// PATCH /api/content/:id — Edit/approve
contentRoutes.patch("/api/content/:id", async (c) => {
  const body = await c.req.json();
  const [piece] = await db.select().from(schema.contentPieces).where(eq(schema.contentPieces.id, c.req.param("id")));
  if (!piece) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (body.status) updates.status = body.status;
  if (body.content) updates.content = body.content;
  if (body.title) updates.title = body.title;

  await db.update(schema.contentPieces).set(updates).where(eq(schema.contentPieces.id, piece.id));
  return c.json({ ok: true });
});

// POST /api/content/:id/revise — Request revision
contentRoutes.post("/api/content/:id/revise", async (c) => {
  const body = await c.req.json();
  const feedback = body.feedback?.trim();
  if (!feedback) return c.json({ error: "Feedback required" }, 400);

  const [piece] = await db.select().from(schema.contentPieces).where(eq(schema.contentPieces.id, c.req.param("id")));
  if (!piece) return c.json({ error: "Not found" }, 404);

  if (piece.version >= 4) {
    return c.json({ error: "Maximum revision limit reached (3 revisions)" }, 400);
  }

  const result = await reviseContent(piece.id, feedback);

  await db.update(schema.contentPieces).set({
    content: result.content,
    title: result.title,
    meta: result.meta,
    version: piece.version + 1,
    revisionNotes: feedback,
    status: "review",
    updatedAt: new Date(),
  }).where(eq(schema.contentPieces.id, piece.id));

  const [updated] = await db.select().from(schema.contentPieces).where(eq(schema.contentPieces.id, piece.id));
  return c.json(updated);
});
```

- [ ] **Step 4: Mount content routes**

In `src/api/routes.ts`, add:

```typescript
import { contentRoutes } from "./content-routes.js";
// ... after existing mounts:
app.route("/", contentRoutes);
```

- [ ] **Step 5: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add agents/DC-001_content_writer.md src/services/content-writer.ts src/api/content-routes.ts src/api/routes.ts
git commit -m "feat: add Content Writer agent with Claude Sonnet, auto-review, and revision cycles"
```

---

### Task 9: Brief Copilot Agent

**Files:**
- Create: `src/services/brief-copilot.ts`
- Create: `agents/CP-001_brief_copilot.md`
- Create: `src/api/copilot-routes.ts`

- [ ] **Step 1: Create the Brief Copilot skill file**

```markdown
<!-- agents/CP-001_brief_copilot.md -->
# CP-001 — Brief Copilot

## Identity
- **ID:** CP-001
- **Name:** Brief Copilot
- **Motor:** Transversal
- **Level:** independent
- **Autonomy:** 70%

## Role
You guide clients through creating project briefs for criteria.agency. You are warm, professional, and efficient. You ask ONE question at a time and offer suggested answers when possible.

## Rules
- Ask ONE question at a time — never multiple questions in one message
- Offer 3-4 suggested answers when the question has common responses
- Never use jargon the client wouldn't understand
- If the client is vague, ask a clarifying follow-up
- Your job is to EXTRACT information, not to CREATE content
- Be encouraging — the client should feel guided, not interrogated
- Keep messages short (2-3 sentences max)

## Conversation Phases

### Phase 1: UNDERSTAND (2-3 questions)
Goal: Detect project type, core objective, and audience
- Q1: What do you need? (detect project type)
- Q2: What is the main objective? (core message)
- Q3: Who will see this? (audience)

### Phase 2: DEFINE (3-4 questions, adapted to project type)
Goal: Get specifics for the detected project type
For video: tone, duration, references, materials
For design: style, usage, dimensions, brand guidelines
For content: format, channel, frequency, examples

### Phase 3: CONFIRM
Goal: Present structured brief for client approval
- Generate brief from all answers
- Show summary to client
- Ask for confirmation or edits

## Response Format
Always respond with valid JSON:
{
  "reply": "your message to the client",
  "options": ["option 1", "option 2", "option 3"] or null,
  "extractedData": { "key": "value from this answer" },
  "nextPhase": "understand" | "define" | "confirm" | null,
  "readyForBrief": false
}
```

- [ ] **Step 2: Create the copilot service**

```typescript
// src/services/brief-copilot.ts
import { askClaude } from "./claude.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { config } from "../shared/config.js";

const SKILL_FILE = path.resolve(config.agentsPath, "CP-001_brief_copilot.md");

function getSystemPrompt(): string {
  try {
    return fs.readFileSync(SKILL_FILE, "utf-8");
  } catch {
    return "You are the Brief Copilot for criteria.agency. Guide clients through creating project briefs. Ask ONE question at a time.";
  }
}

interface CopilotResponse {
  sessionId: string;
  reply: string;
  options: string[] | null;
  phase: string;
  progress: number;
  brief: Record<string, any> | null;
}

const TOTAL_QUESTIONS = 7; // approximate total for progress calculation

export async function startSession(clientId?: string): Promise<CopilotResponse> {
  const [session] = await db.insert(schema.copilotSessions).values({
    clientId: clientId ?? null,
    status: "active",
    currentPhase: "understand",
    currentQuestion: 1,
    answers: {},
  }).returning();

  return {
    sessionId: session.id,
    reply: "Hola! Soy tu copiloto de briefs en criteria.agency. Cuéntame, qué necesitas? Un video, diseño, contenido, u otra cosa?",
    options: ["Video corporativo", "Video para redes sociales", "Diseño gráfico", "Contenido escrito"],
    phase: "understand",
    progress: 0,
    brief: null,
  };
}

export async function processMessage(
  sessionId: string,
  message: string,
): Promise<CopilotResponse> {
  const [session] = await db
    .select()
    .from(schema.copilotSessions)
    .where(eq(schema.copilotSessions.id, sessionId));

  if (!session || session.status !== "active") {
    return {
      sessionId,
      reply: "Esta sesión ya no está activa. Inicia una nueva conversación.",
      options: null,
      phase: "ended",
      progress: 1,
      brief: null,
    };
  }

  // Build conversation history for Claude
  const answers = (session.answers as Record<string, string>) ?? {};
  const history = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const system = getSystemPrompt();

  const prompt = `Conversation state:
- Phase: ${session.currentPhase}
- Question number: ${session.currentQuestion}
- Project type detected: ${session.projectType ?? "not yet detected"}
- Previous Q&As:
${history || "None yet"}

Client's latest message: "${message}"

Based on the conversation so far and the client's response, provide your next question or generate the brief if you have enough information.

Respond with JSON:
{
  "reply": "your message",
  "options": ["opt1", "opt2", "opt3"] or null,
  "extractedData": { "key": "value" },
  "nextPhase": "understand" | "define" | "confirm",
  "readyForBrief": false,
  "detectedProjectType": "video" | "design" | "content" | null
}`;

  let parsed: any;
  try {
    const response = await askClaude({ system, prompt, model: "claude-sonnet-4-20250514", maxTokens: 1024 });
    parsed = JSON.parse(response);
  } catch {
    parsed = {
      reply: "Entendido. Puedes darme más detalles sobre lo que necesitas?",
      options: null,
      extractedData: {},
      nextPhase: session.currentPhase,
      readyForBrief: false,
      detectedProjectType: null,
    };
  }

  // Update session state
  const updatedAnswers = {
    ...answers,
    [`q${session.currentQuestion}`]: message,
  };

  const nextQuestion = session.currentQuestion + 1;
  const nextPhase = parsed.nextPhase ?? session.currentPhase;
  const projectType = parsed.detectedProjectType ?? session.projectType;

  // Generate brief if ready
  let generatedBrief: Record<string, any> | null = null;
  if (parsed.readyForBrief) {
    generatedBrief = await generateBrief(updatedAnswers, projectType ?? "video");
  }

  await db.update(schema.copilotSessions).set({
    currentPhase: nextPhase as any,
    currentQuestion: nextQuestion,
    answers: updatedAnswers,
    projectType,
    generatedBrief,
    status: generatedBrief ? "completed" : "active",
    updatedAt: new Date(),
  }).where(eq(schema.copilotSessions.id, sessionId));

  const progress = Math.min(nextQuestion / TOTAL_QUESTIONS, generatedBrief ? 1.0 : 0.95);

  return {
    sessionId,
    reply: parsed.reply,
    options: parsed.options ?? null,
    phase: nextPhase,
    progress,
    brief: generatedBrief,
  };
}

async function generateBrief(answers: Record<string, string>, projectType: string): Promise<Record<string, any>> {
  const answersText = Object.entries(answers)
    .map(([q, a]) => `${q}: ${a}`)
    .join("\n");

  const prompt = `Based on this conversation, generate a structured project brief:

Project type: ${projectType}
Client answers:
${answersText}

Return a JSON brief with these fields:
{
  "projectType": "${projectType}",
  "objective": "main goal",
  "audience": { "primary": "...", "secondary": "..." },
  "message": "key message",
  "tone": "professional|conversational|inspirational|technical",
  "duration": "only for video",
  "references": [],
  "materials": { "hasLogo": bool, "hasPhotos": bool, "hasBrandGuide": bool },
  "additionalNotes": "anything else relevant"
}`;

  try {
    const response = await askClaude({
      system: "Generate a structured project brief from conversation answers. Return valid JSON only.",
      prompt,
      model: "claude-sonnet-4-20250514",
    });
    return JSON.parse(response);
  } catch {
    return {
      projectType,
      objective: answers.q2 ?? "Not specified",
      audience: { primary: answers.q3 ?? "Not specified" },
      message: "To be refined",
      tone: "professional",
      additionalNotes: answersText,
    };
  }
}
```

- [ ] **Step 3: Create copilot API routes**

```typescript
// src/api/copilot-routes.ts
import { Hono } from "hono";
import { startSession, processMessage } from "../services/brief-copilot.js";

export const copilotRoutes = new Hono();

// POST /api/copilot/message — Send message (or start new session)
copilotRoutes.post("/api/copilot/message", async (c) => {
  const body = await c.req.json();
  const { sessionId, message, clientId } = body;

  if (!sessionId) {
    // Start new session
    const response = await startSession(clientId);
    return c.json(response, 201);
  }

  if (!message?.trim()) {
    return c.json({ error: "Message required" }, 400);
  }

  const response = await processMessage(sessionId, message.trim());
  return c.json(response);
});
```

- [ ] **Step 4: Mount copilot routes**

In `src/api/routes.ts`, add:

```typescript
import { copilotRoutes } from "./copilot-routes.js";
// ... after existing mounts:
app.route("/", copilotRoutes);
```

- [ ] **Step 5: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add agents/CP-001_brief_copilot.md src/services/brief-copilot.ts src/api/copilot-routes.ts src/api/routes.ts
git commit -m "feat: add Brief Copilot agent with guided conversation and brief generation"
```

---

### Task 10: Cron Scheduler Setup

**Files:**
- Modify: `src/api/server.ts`

- [ ] **Step 1: Add cron schedules to server startup**

Replace the contents of `src/api/server.ts`:

```typescript
import { serve } from "@hono/node-server";
import { app } from "./routes.js";
import { config } from "../shared/config.js";
import cron from "node-cron";
import {
  checkExpiringTrials,
  checkExpiredTrials,
  checkOverduePayments,
  detectChurnRisk,
  createRecurringPayments,
  sendEarlyAdopterTransitionNotice,
} from "../services/subscription-manager.js";

// Start HTTP server
serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`CriteriaFilms API running on http://localhost:${info.port}`);
});

// Schedule subscription management tasks
cron.schedule("0 9 * * *", () => {
  console.log("[CRON] Running: checkExpiringTrials");
  checkExpiringTrials().catch(console.error);
});

cron.schedule("0 10 * * *", () => {
  console.log("[CRON] Running: checkExpiredTrials");
  checkExpiredTrials().catch(console.error);
});

cron.schedule("0 11 * * *", () => {
  console.log("[CRON] Running: checkOverduePayments");
  checkOverduePayments().catch(console.error);
});

cron.schedule("0 9 * * 1", () => {
  console.log("[CRON] Running: detectChurnRisk");
  detectChurnRisk().catch(console.error);
});

cron.schedule("0 8 1 * *", () => {
  console.log("[CRON] Running: createRecurringPayments");
  createRecurringPayments().catch(console.error);
});

cron.schedule("0 12 * * *", () => {
  console.log("[CRON] Running: sendEarlyAdopterTransitionNotice");
  sendEarlyAdopterTransitionNotice().catch(console.error);
});

console.log("[CRON] Subscription management tasks scheduled");
```

- [ ] **Step 2: Verify compiles and server starts**

```bash
npx tsc --noEmit
```

Then test server starts (kill any existing process first):

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; npm run dev &
sleep 3
curl -s http://localhost:3000/health
kill %1 2>/dev/null
```

Expected: `{"status":"ok","version":"0.1.0"}` and console shows "[CRON] Subscription management tasks scheduled"

- [ ] **Step 3: Commit**

```bash
git add src/api/server.ts
git commit -m "feat: add cron scheduler for subscription management tasks"
```

---

### Task 11: End-to-End Verification

- [ ] **Step 1: Start server and test finance endpoints**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; npm run dev &
sleep 3

# Create expected payment
curl -s -X POST http://localhost:3000/api/expected-payments \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<use an existing client ID>","amount":"5000","description":"Enterprise - April 2026","dueDate":"2026-04-15"}'

# List expected payments
curl -s http://localhost:3000/api/expected-payments

# Get subscription summary
curl -s http://localhost:3000/api/subscriptions/summary

# Manually trigger trial check
curl -s -X POST http://localhost:3000/api/subscriptions/check-trials
```

- [ ] **Step 2: Test Content Writer**

```bash
curl -s -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "linkedin_post",
    "topic": "Quality gates in AI video production",
    "audience": "Marketing managers in LATAM SMBs",
    "tone": "professional",
    "keyMessage": "AI generates, but judgment decides what ships",
    "cta": "Visit criteria.agency to learn more"
  }'

# List generated content
curl -s http://localhost:3000/api/content
```

- [ ] **Step 3: Test Brief Copilot**

```bash
# Start session
SESSION=$(curl -s -X POST http://localhost:3000/api/copilot/message \
  -H "Content-Type: application/json" \
  -d '{}')
echo "$SESSION"

# Extract session ID and send response
SESSION_ID=$(echo $SESSION | python3 -c "import sys,json; print(json.load(sys.stdin)['sessionId'])")

curl -s -X POST http://localhost:3000/api/copilot/message \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"Quiero un video corporativo para mi empresa\"}"
```

- [ ] **Step 4: Kill server and commit any fixes**

```bash
kill %1 2>/dev/null
```

If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```

- [ ] **Step 5: Final commit with all business agents**

```bash
git status
```

If clean, verification is complete. If there are uncommitted changes:

```bash
git add -A
git commit -m "feat: complete business agents implementation (5 agents, verified e2e)"
```

---

### Summary of Files

**Created (12 files):**

| File | Purpose |
|------|---------|
| `src/services/claude.ts` | Shared Claude API client with mock fallback |
| `src/services/categorizer.ts` | Transaction categorization waterfall |
| `src/services/reconciler.ts` | Payment matching (4 levels + AI) |
| `src/services/subscription-manager.ts` | 6 scheduled lifecycle tasks |
| `src/services/content-writer.ts` | Content generation + auto-review |
| `src/services/brief-copilot.ts` | Conversational brief builder |
| `src/api/finance-routes.ts` | Finance + subscription endpoints |
| `src/api/content-routes.ts` | Content CRUD + generation |
| `src/api/copilot-routes.ts` | Copilot message endpoint |
| `agents/DC-001_content_writer.md` | Content Writer skill file |
| `agents/CP-001_brief_copilot.md` | Brief Copilot skill file |

**Modified (5 files):**

| File | Changes |
|------|---------|
| `src/db/schema.ts` | 10 new enums + 7 new tables |
| `src/api/routes.ts` | Mount 3 new route modules |
| `src/api/server.ts` | Add cron scheduler |
| `src/shared/config.ts` | Add anthropicApiKey |
| `package.json` | Add @anthropic-ai/sdk, node-cron |
