# CSV Bank Import & Financial Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import Banco General bank statements (CSV/TXT), auto-extract business entities, categorize/reconcile transactions, and display financial data in 4 SSR dashboard pages.

**Architecture:** BG CSV parser → entity matcher → bank sync orchestrator → existing categorizer/reconciler services → SSR dashboard pages served by Hono with Tailwind CDN + Chart.js CDN.

**Tech Stack:** Hono (routes + SSR), Drizzle ORM (DB), Chart.js (charts), crypto (SHA-256 dedup), existing categorizer + reconciler services, Claude/Gemini for entity extraction fallback.

**Spec:** `docs/superpowers/specs/2026-04-06-csv-import-dashboard-design.md`

**Sample data:** `/Users/juanpa/Downloads/bg/ESTADO-DE-CUENTA-CUENTA-CORRIENTE-2026-04-06-181534.txt`

---

### Task 1: Schema — Business Entities, Invoices, Transaction Updates

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add new enums**

Add after the existing `copilotPhaseEnum` in `src/db/schema.ts`:

```typescript
export const entityTypeEnum = pgEnum("entity_type", [
  "client",
  "vendor",
  "personal",
  "bank",
  "government",
  "unknown",
]);

export const invoiceDirectionEnum = pgEnum("invoice_direction", [
  "issued",
  "received",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "partial",
  "paid",
  "overdue",
  "canceled",
]);
```

- [ ] **Step 2: Add new tables**

Add at the end of `src/db/schema.ts`, after the `copilotSessions` table:

```typescript
// ── Business Entities & Invoices ──

export const businessEntities = pgTable("business_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: entityTypeEnum("type").default("unknown").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  patterns: jsonb("patterns").default([]).notNull(),
  defaultCategory: varchar("default_category", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  direction: invoiceDirectionEnum("direction").notNull(),
  entityId: uuid("entity_id")
    .references(() => businessEntities.id)
    .notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date"),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  filePath: text("file_path"),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionInvoices = pgTable("transaction_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id)
    .notNull(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Add entityId column to transactions table**

In the existing `transactions` table definition, add after the `clientId` line:

```typescript
  entityId: uuid("entity_id").references(() => businessEntities.id),
```

- [ ] **Step 4: Generate and run migration**

```bash
npx drizzle-kit generate && npm run db:migrate
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add businessEntities, invoices, transactionInvoices tables + entityId on transactions"
```

---

### Task 2: Banco General CSV Parser

**Files:**
- Create: `src/services/bg-csv-parser.ts`

- [ ] **Step 1: Create the parser**

```typescript
// src/services/bg-csv-parser.ts
import crypto from "crypto";

export interface ParsedTransaction {
  externalId: string;
  date: Date;
  amount: string;            // numeric string for DB
  currency: string;
  description: string;
  counterpartyName: string;
  reference: string;
  type: "income" | "expense";
  source: "csv_import";
  metadata: Record<string, any>;
}

// ── Amount Parsing ──

function parseAmount(raw: string): number {
  if (!raw || !raw.trim()) return 0;
  // Remove thousands separator (comma), parse float
  return parseFloat(raw.trim().replace(/,/g, ""));
}

// ── Date Parsing ──

function parseBGDate(raw: string): Date {
  // Format: DD/MM/YYYY
  const parts = raw.trim().split("/");
  if (parts.length !== 3) throw new Error(`Invalid date: ${raw}`);
  const [day, month, year] = parts;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

// ── Counterparty Name Extraction ──

const EXTRACTION_RULES: Array<{
  pattern: RegExp;
  extract: (match: RegExpMatchArray, desc: string) => string;
}> = [
  // Card purchase: ADOBE-4560-34XX-XXXX-0913
  {
    pattern: /^(.+?)-\d{4}-\d{2}XX-XXXX-\d{4}$/,
    extract: (m) => m[1].trim(),
  },
  // Transfer from with account: TRANSFERENCIA DE 0471016148307 CRITERIA, S.A. BANCA EN LINEA
  {
    pattern: /TRANSFERENCIA DE \d+ (.+?) BANCA EN LINEA/,
    extract: (m) => m[1].trim(),
  },
  // Transfer from name: TRANSFERENCIA DE JUAN PABLO DE GAMBOA GOMEZ BANCA EN LINEA
  {
    pattern: /TRANSFERENCIA DE ([A-Z\s]+?) BANCA EN LINEA/,
    extract: (m) => m[1].trim(),
  },
  // Transfer to: TRANSFERENCIA A 0405982815878 CELERO NETWORKS, CORP. (CELERO) BANCA EN LINE
  {
    pattern: /TRANSFERENCIA A \d+ (.+?) BANCA EN LINE/,
    extract: (m) => m[1].trim(),
  },
  // International wire: TRR09339298923 BERTELSMANN FOUNDATION (NORTH AMERI/ 002000041872088
  {
    pattern: /^TRR\d+\s+(.+?)(?:\s*\/\s*\d+)?$/,
    extract: (m) => {
      let name = m[1].trim();
      // Remove truncated parenthetical: "(NORTH AMERI" → remove
      name = name.replace(/\s*\([^)]*$/, "").trim();
      return name;
    },
  },
  // Visa payment: BANCA EN LINEA PAGO VISA 4557-33XX-XXXX-4665 JUAN PABLO DE GAMBOA
  {
    pattern: /PAGO VISA \d{4}-\d{2}XX-XXXX-\d{4}\s+(.+)$/,
    extract: () => "Pago Visa (propia)",
  },
  // Bank payment to service: BANCA EN LINEA BAC INTERNATIONAL BANK ...
  {
    pattern: /BANCA EN LINEA (BAC INTERNATIONAL BANK|DAVIVIENDA)\s/,
    extract: (m) => m[1],
  },
  // Service payment: BANCA EN LÍNEA NATURGY (EDEMET-EDECHI) (6377650)
  {
    pattern: /BANCA EN LI[NÑ]EA (.+?)(?:\s*\(\d+\))?$/,
    extract: (m) => m[1].trim(),
  },
  // Commission
  {
    pattern: /^COMISION/,
    extract: () => "Banco General",
  },
  // Insurance
  {
    pattern: /^(SEGURO|IMPUESTO SEGURO)/,
    extract: () => "Banco General",
  },
  // Interest
  {
    pattern: /^INTERES/,
    extract: () => "Banco General",
  },
];

function extractCounterpartyName(description: string): string {
  for (const rule of EXTRACTION_RULES) {
    const match = description.match(rule.pattern);
    if (match) {
      return cleanName(rule.extract(match, description));
    }
  }
  // Fallback: use full description
  return cleanName(description);
}

function cleanName(raw: string): string {
  let name = raw.trim();
  // Remove trailing numbers/codes
  name = name.replace(/\s+\d{5,}$/, "");
  // Title case (but keep all-caps acronyms like LLC, S.A.)
  name = name.replace(/\b[A-Z]{4,}\b/g, (w) => w); // keep long uppercase words
  name = name
    .split(" ")
    .map((w) => {
      if (w.length <= 3 && w === w.toUpperCase()) return w; // Keep short acronyms: LLC, S.A., RBS
      if (w === w.toUpperCase() && w.length > 3) {
        return w.charAt(0) + w.slice(1).toLowerCase(); // ADOBE → Adobe
      }
      return w;
    })
    .join(" ");
  return name;
}

// ── Main Parse Function ──

export function parseBGFile(content: string, accountId: string): ParsedTransaction[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const results: ParsedTransaction[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    if (cols.length < 7) continue;

    const [dateStr, reference, txCode, description, debitStr, creditStr, balanceStr] = cols;

    if (!dateStr?.trim() || !description?.trim()) continue;

    const debit = parseAmount(debitStr);
    const credit = parseAmount(creditStr);
    const amount = credit > 0 ? credit : -debit;

    if (amount === 0) continue;

    const date = parseBGDate(dateStr);
    const counterpartyName = extractCounterpartyName(description.trim());

    // Generate dedup ID
    const hashInput = `${accountId}|${date.toISOString().split("T")[0]}|${amount}|${description.trim()}`;
    const externalId = crypto.createHash("sha256").update(hashInput).digest("hex");

    results.push({
      externalId,
      date,
      amount: amount.toFixed(2),
      currency: "USD",
      description: description.trim(),
      counterpartyName,
      reference: reference?.trim() || "",
      type: amount >= 0 ? "income" : "expense",
      source: "csv_import",
      metadata: {
        accountId,
        bgReference: reference?.trim(),
        bgTransactionCode: txCode?.trim(),
        bgBalance: balanceStr?.trim(),
        rawLine: lines[i],
      },
    });
  }

  return results;
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/services/bg-csv-parser.ts
git commit -m "feat: add Banco General CSV parser with counterparty name extraction"
```

---

### Task 3: Entity Matcher Service

**Files:**
- Create: `src/services/entity-matcher.ts`

- [ ] **Step 1: Create entity matcher**

```typescript
// src/services/entity-matcher.ts
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { askClaude } from "./claude.js";

interface EntityMatchResult {
  entityId: string | null;
  confidence: number;
  created: boolean;
}

// Reuse name normalization from reconciler pattern
function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  if (a === b) return 100;
  if (!a || !b) return 0;
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return Math.round((1 - matrix[a.length][b.length] / Math.max(a.length, b.length)) * 100);
}

export async function matchEntity(
  counterpartyName: string,
  description: string,
  amount: number,
): Promise<EntityMatchResult> {
  const entities = await db.select().from(schema.businessEntities);
  const descUpper = description.toUpperCase();

  // 1. Pattern match against entity patterns
  for (const entity of entities) {
    const patterns = (entity.patterns as string[]) ?? [];
    for (const pattern of patterns) {
      if (descUpper.includes(pattern.toUpperCase())) {
        return { entityId: entity.id, confidence: 1.0, created: false };
      }
    }
  }

  // 2. Fuzzy name match
  const normalizedName = normalizeForMatch(counterpartyName);
  for (const entity of entities) {
    const score = similarity(normalizedName, normalizeForMatch(entity.name));
    if (score >= 85) {
      return { entityId: entity.id, confidence: 0.9, created: false };
    }
  }

  // 3. Client alias match (check if counterparty is a known client)
  const aliases = await db.select().from(schema.clientAliases);
  for (const alias of aliases) {
    if (normalizeForMatch(alias.alias) === normalizedName) {
      // Find or create businessEntity for this client
      const [existingEntity] = await db
        .select()
        .from(schema.businessEntities)
        .where(eq(schema.businessEntities.clientId, alias.clientId));

      if (existingEntity) {
        return { entityId: existingEntity.id, confidence: 0.95, created: false };
      }

      // Create entity for this client
      const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, alias.clientId));
      if (client) {
        const [newEntity] = await db
          .insert(schema.businessEntities)
          .values({
            name: client.name,
            type: "client",
            clientId: client.id,
            patterns: [counterpartyName],
            defaultCategory: "client_payment",
          })
          .returning();
        return { entityId: newEntity.id, confidence: 0.95, created: true };
      }
    }
  }

  // 4. AI extraction for unmatched
  try {
    const response = await askClaude({
      system: "Extract the business entity name from bank transaction descriptions. Respond with valid JSON only.",
      prompt: `Bank transaction description: "${description}"
Extracted counterparty: "${counterpartyName}"
Amount: ${amount}

What is the clean business name? What type of entity is it?
Types: client (pays us), vendor (we pay them), personal (own transfers), bank (fees/commissions), government (taxes/permits)

Respond JSON only:
{ "name": "Clean Name", "type": "vendor", "suggestedCategory": "software_subscriptions" }`,
      model: "claude-haiku-4-20250414",
    });

    const parsed = JSON.parse(response);
    if (parsed.name && !parsed._mock) {
      // Auto-create entity
      const [newEntity] = await db
        .insert(schema.businessEntities)
        .values({
          name: parsed.name,
          type: parsed.type ?? "unknown",
          patterns: [counterpartyName],
          defaultCategory: parsed.suggestedCategory ?? null,
        })
        .returning();
      return { entityId: newEntity.id, confidence: 0.7, created: true };
    }
  } catch {
    // AI failed — fall through
  }

  // 5. Auto-create with extracted name (no AI)
  if (counterpartyName && counterpartyName !== description) {
    const type = amount > 0 ? "client" : "vendor";
    const [newEntity] = await db
      .insert(schema.businessEntities)
      .values({
        name: counterpartyName,
        type,
        patterns: [counterpartyName],
      })
      .returning();
    return { entityId: newEntity.id, confidence: 0.5, created: true };
  }

  // 6. No match
  return { entityId: null, confidence: 0, created: false };
}

// Learning: add pattern to entity when manually assigned
export async function addEntityPattern(entityId: string, pattern: string): Promise<void> {
  const [entity] = await db.select().from(schema.businessEntities).where(eq(schema.businessEntities.id, entityId));
  if (!entity) return;

  const patterns = (entity.patterns as string[]) ?? [];
  if (!patterns.some((p) => p.toUpperCase() === pattern.toUpperCase())) {
    patterns.push(pattern);
    await db
      .update(schema.businessEntities)
      .set({ patterns })
      .where(eq(schema.businessEntities.id, entityId));
  }
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/services/entity-matcher.ts
git commit -m "feat: add entity matcher with pattern/fuzzy/alias/AI matching + auto-creation"
```

---

### Task 4: Bank Sync Service

**Files:**
- Create: `src/services/bank-sync.ts`

- [ ] **Step 1: Create bank sync orchestrator**

```typescript
// src/services/bank-sync.ts
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { parseBGFile, type ParsedTransaction } from "./bg-csv-parser.js";
import { matchEntity } from "./entity-matcher.js";
import { categorizeTransaction } from "./categorizer.js";
import { reconcileTransaction, applyReconciliation } from "./reconciler.js";

export interface ImportResult {
  syncLogId: string;
  found: number;
  new: number;
  duplicates: number;
  entitiesCreated: number;
  categorized: number;
  reconciled: number;
  unmatched: number;
}

export async function importCSV(fileContent: string, accountId: string): Promise<ImportResult> {
  const startedAt = new Date();

  // 1. Parse CSV
  const parsed = parseBGFile(fileContent, accountId);
  const found = parsed.length;

  // 2. Dedup — filter out existing externalIds
  const existingIds = new Set<string>();
  if (parsed.length > 0) {
    const existing = await db.select({ externalId: schema.transactions.externalId }).from(schema.transactions);
    for (const e of existing) {
      if (e.externalId) existingIds.add(e.externalId);
    }
  }

  const newTransactions = parsed.filter((t) => !existingIds.has(t.externalId));
  const duplicates = found - newTransactions.length;

  let entitiesCreated = 0;
  let categorized = 0;
  let reconciled = 0;
  let unmatched = 0;

  // 3. Process each new transaction
  for (const txn of newTransactions) {
    // a. Match/create entity
    const entityResult = await matchEntity(
      txn.counterpartyName,
      txn.description,
      parseFloat(txn.amount),
    );
    if (entityResult.created) entitiesCreated++;

    // b. Insert transaction
    const [inserted] = await db
      .insert(schema.transactions)
      .values({
        bankAccountId: accountId,
        externalId: txn.externalId,
        date: txn.date,
        amount: txn.amount,
        currency: txn.currency,
        description: txn.description,
        counterpartyName: txn.counterpartyName,
        reference: txn.reference,
        type: txn.type,
        source: "csv_import",
        entityId: entityResult.entityId,
        metadata: txn.metadata,
      })
      .returning();

    // c. Categorize
    const catResult = await categorizeTransaction({
      date: txn.date,
      description: txn.description,
      counterpartyName: txn.counterpartyName,
      amount: txn.amount,
      currency: txn.currency,
      reference: txn.reference,
    });

    if (catResult.category) {
      await db
        .update(schema.transactions)
        .set({
          category: catResult.category,
          subcategory: catResult.subcategory,
          type: catResult.type,
        })
        .where(eq(schema.transactions.id, inserted.id));
      categorized++;
    }

    // d. Reconcile income transactions
    if (txn.type === "income") {
      const recResult = await reconcileTransaction({
        id: inserted.id,
        amount: txn.amount,
        counterpartyName: txn.counterpartyName,
        date: txn.date,
        description: txn.description,
        type: "income",
      });

      if (recResult.autoReconciled && recResult.expectedPaymentId && recResult.clientId) {
        await applyReconciliation(
          inserted.id,
          recResult.expectedPaymentId,
          recResult.clientId,
          txn.counterpartyName,
        );
        reconciled++;
      } else if (!recResult.matched) {
        unmatched++;
      }
    }
  }

  // 4. Log sync
  const [syncLog] = await db
    .insert(schema.bankSyncLog)
    .values({
      provider: "csv_import",
      startedAt,
      completedAt: new Date(),
      transactionsFound: found,
      transactionsNew: newTransactions.length,
      transactionsReconciled: reconciled,
      status: "completed",
    })
    .returning();

  return {
    syncLogId: syncLog.id,
    found,
    new: newTransactions.length,
    duplicates,
    entitiesCreated,
    categorized,
    reconciled,
    unmatched,
  };
}

// Preview without importing
export async function previewCSV(fileContent: string, accountId: string): Promise<{
  found: number;
  new: number;
  duplicates: number;
  preview: ParsedTransaction[];
}> {
  const parsed = parseBGFile(fileContent, accountId);

  const existingIds = new Set<string>();
  const existing = await db.select({ externalId: schema.transactions.externalId }).from(schema.transactions);
  for (const e of existing) {
    if (e.externalId) existingIds.add(e.externalId);
  }

  const newTxns = parsed.filter((t) => !existingIds.has(t.externalId));

  return {
    found: parsed.length,
    new: newTxns.length,
    duplicates: parsed.length - newTxns.length,
    preview: newTxns.slice(0, 10),
  };
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/services/bank-sync.ts
git commit -m "feat: add bank sync service (parse → dedup → entity match → categorize → reconcile)"
```

---

### Task 5: Entity & Invoice API Routes

**Files:**
- Create: `src/api/entity-routes.ts`
- Create: `src/api/invoice-routes.ts`

- [ ] **Step 1: Create entity routes**

```typescript
// src/api/entity-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { addEntityPattern } from "../services/entity-matcher.js";

export const entityRoutes = new Hono();

entityRoutes.get("/api/entities", async (c) => {
  const entities = await db.select().from(schema.businessEntities);
  return c.json(entities);
});

entityRoutes.post("/api/entities", async (c) => {
  const body = await c.req.json();
  const [entity] = await db
    .insert(schema.businessEntities)
    .values({
      name: body.name,
      type: body.type ?? "unknown",
      clientId: body.clientId ?? null,
      patterns: body.patterns ?? [],
      defaultCategory: body.defaultCategory ?? null,
      notes: body.notes ?? null,
    })
    .returning();
  return c.json(entity, 201);
});

entityRoutes.patch("/api/entities/:id", async (c) => {
  const body = await c.req.json();
  const updates: Record<string, any> = {};
  if (body.name) updates.name = body.name;
  if (body.type) updates.type = body.type;
  if (body.defaultCategory !== undefined) updates.defaultCategory = body.defaultCategory;
  if (body.patterns) updates.patterns = body.patterns;
  if (body.notes !== undefined) updates.notes = body.notes;

  await db.update(schema.businessEntities).set(updates).where(eq(schema.businessEntities.id, c.req.param("id")));
  return c.json({ ok: true });
});

entityRoutes.post("/api/entities/:id/patterns", async (c) => {
  const body = await c.req.json();
  if (!body.pattern) return c.json({ error: "Pattern required" }, 400);
  await addEntityPattern(c.req.param("id"), body.pattern);
  return c.json({ ok: true });
});
```

- [ ] **Step 2: Create invoice routes**

```typescript
// src/api/invoice-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

export const invoiceRoutes = new Hono();

invoiceRoutes.post("/api/invoices", async (c) => {
  const body = await c.req.json();
  const [invoice] = await db
    .insert(schema.invoices)
    .values({
      direction: body.direction,
      entityId: body.entityId,
      invoiceNumber: body.invoiceNumber ?? null,
      amount: body.amount,
      currency: body.currency ?? "USD",
      issueDate: new Date(body.issueDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes ?? null,
      metadata: body.metadata ?? {},
    })
    .returning();
  return c.json(invoice, 201);
});

invoiceRoutes.get("/api/invoices", async (c) => {
  const direction = c.req.query("direction");
  const status = c.req.query("status");

  let query = db.select().from(schema.invoices);
  // Note: filtering done in JS for simplicity (small dataset)
  const all = await query;
  let filtered = all;
  if (direction) filtered = filtered.filter((i) => i.direction === direction);
  if (status) filtered = filtered.filter((i) => i.status === status);
  return c.json(filtered);
});

invoiceRoutes.get("/api/invoices/:id", async (c) => {
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, c.req.param("id")));
  if (!invoice) return c.json({ error: "Not found" }, 404);
  return c.json(invoice);
});

invoiceRoutes.patch("/api/invoices/:id", async (c) => {
  const body = await c.req.json();
  const updates: Record<string, any> = {};
  if (body.status) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.invoiceNumber) updates.invoiceNumber = body.invoiceNumber;

  await db.update(schema.invoices).set(updates).where(eq(schema.invoices.id, c.req.param("id")));
  return c.json({ ok: true });
});

// Link transaction to invoice
invoiceRoutes.post("/api/transactions/:id/invoices", async (c) => {
  const body = await c.req.json();
  const [link] = await db
    .insert(schema.transactionInvoices)
    .values({
      transactionId: c.req.param("id"),
      invoiceId: body.invoiceId,
      amount: body.amount,
    })
    .returning();

  // Update invoice status based on total linked amount
  const links = await db
    .select()
    .from(schema.transactionInvoices)
    .where(eq(schema.transactionInvoices.invoiceId, body.invoiceId));

  const totalLinked = links.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, body.invoiceId));

  if (invoice) {
    const invoiceAmount = parseFloat(invoice.amount);
    const newStatus = totalLinked >= invoiceAmount ? "paid" : totalLinked > 0 ? "partial" : "pending";
    await db.update(schema.invoices).set({ status: newStatus }).where(eq(schema.invoices.id, body.invoiceId));
  }

  return c.json(link, 201);
});
```

- [ ] **Step 3: Mount routes and update finance-routes for entity assignment**

In `src/api/routes.ts`, add imports and mounts:

```typescript
import { entityRoutes } from "./entity-routes.js";
import { invoiceRoutes } from "./invoice-routes.js";
// ... after existing mounts:
app.route("/", entityRoutes);
app.route("/", invoiceRoutes);
```

In `src/api/finance-routes.ts`, update the PATCH `/api/transactions/:id` handler to also handle `entityId` assignment with pattern learning. Add import:

```typescript
import { addEntityPattern } from "../services/entity-matcher.js";
```

And in the PATCH handler, after existing updates logic, add:

```typescript
  if (body.entityId) {
    updates.entityId = body.entityId;
    // Learn: add description as pattern for this entity
    if (txn.description) {
      await addEntityPattern(body.entityId, txn.counterpartyName ?? txn.description);
    }
  }
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add src/api/entity-routes.ts src/api/invoice-routes.ts src/api/routes.ts src/api/finance-routes.ts
git commit -m "feat: add entity + invoice API routes with pattern learning"
```

---

### Task 6: Import API + Dashboard Data Endpoints

**Files:**
- Create: `src/api/dashboard-routes.ts`

- [ ] **Step 1: Create dashboard routes**

```typescript
// src/api/dashboard-routes.ts
import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import { importCSV, previewCSV } from "../services/bank-sync.js";
import { renderFinanceDashboard } from "../views/finance-dashboard.js";
import { renderFinanceTransactions } from "../views/finance-transactions.js";
import { renderFinanceReconciliation } from "../views/finance-reconciliation.js";
import { renderFinanceImport } from "../views/finance-import.js";

export const dashboardRoutes = new Hono();

// ── SSR Pages ──

dashboardRoutes.get("/admin/finances", async (c) => {
  return c.html(await renderFinanceDashboard());
});

dashboardRoutes.get("/admin/finances/transactions", async (c) => {
  return c.html(await renderFinanceTransactions());
});

dashboardRoutes.get("/admin/finances/reconciliation", async (c) => {
  return c.html(await renderFinanceReconciliation());
});

dashboardRoutes.get("/admin/finances/import", async (c) => {
  return c.html(await renderFinanceImport());
});

// ── Import API ──

dashboardRoutes.post("/api/transactions/import", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  const accountId = (body["accountId"] as string) ?? "corriente";

  if (!file || typeof file === "string") {
    return c.json({ error: "File required" }, 400);
  }

  const content = await (file as File).text();
  const result = await importCSV(content, accountId);
  return c.json(result);
});

dashboardRoutes.post("/api/transactions/import/preview", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  const accountId = (body["accountId"] as string) ?? "corriente";

  if (!file || typeof file === "string") {
    return c.json({ error: "File required" }, 400);
  }

  const content = await (file as File).text();
  const result = await previewCSV(content, accountId);
  return c.json(result);
});

// ── Dashboard Data API ──

dashboardRoutes.get("/api/finances/summary", async (c) => {
  const period = c.req.query("period") ?? "month";
  const { start, end, prevStart, prevEnd } = getPeriodDates(period);

  const [income] = await db
    .select({ total: sql<string>`COALESCE(SUM(CASE WHEN amount::numeric > 0 THEN amount::numeric ELSE 0 END), 0)` })
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, start), lt(schema.transactions.date, end)));

  const [expenses] = await db
    .select({ total: sql<string>`COALESCE(SUM(CASE WHEN amount::numeric < 0 THEN ABS(amount::numeric) ELSE 0 END), 0)` })
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, start), lt(schema.transactions.date, end)));

  const [prevIncome] = await db
    .select({ total: sql<string>`COALESCE(SUM(CASE WHEN amount::numeric > 0 THEN amount::numeric ELSE 0 END), 0)` })
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, prevStart), lt(schema.transactions.date, prevEnd)));

  const [prevExpenses] = await db
    .select({ total: sql<string>`COALESCE(SUM(CASE WHEN amount::numeric < 0 THEN ABS(amount::numeric) ELSE 0 END), 0)` })
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, prevStart), lt(schema.transactions.date, prevEnd)));

  const [receivable] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
    .from(schema.invoices)
    .where(and(eq(schema.invoices.direction, "issued"), eq(schema.invoices.status, "pending")));

  const incomeVal = parseFloat(income.total);
  const expenseVal = parseFloat(expenses.total);
  const prevIncomeVal = parseFloat(prevIncome.total);
  const prevExpenseVal = parseFloat(prevExpenses.total);

  return c.json({
    income: incomeVal,
    expenses: expenseVal,
    balance: incomeVal - expenseVal,
    receivable: parseFloat(receivable.total),
    incomeChange: prevIncomeVal > 0 ? ((incomeVal - prevIncomeVal) / prevIncomeVal) * 100 : 0,
    expenseChange: prevExpenseVal > 0 ? ((expenseVal - prevExpenseVal) / prevExpenseVal) * 100 : 0,
    period,
  });
});

dashboardRoutes.get("/api/finances/cash-flow", async (c) => {
  const months = parseInt(c.req.query("months") ?? "6");
  const now = new Date();
  const data: Array<{ month: string; income: number; expenses: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleDateString("es", { month: "short", year: "numeric" });

    const [row] = await db
      .select({
        income: sql<string>`COALESCE(SUM(CASE WHEN amount::numeric > 0 THEN amount::numeric ELSE 0 END), 0)`,
        expenses: sql<string>`COALESCE(SUM(CASE WHEN amount::numeric < 0 THEN ABS(amount::numeric) ELSE 0 END), 0)`,
      })
      .from(schema.transactions)
      .where(and(gte(schema.transactions.date, start), lt(schema.transactions.date, end)));

    data.push({ month: label, income: parseFloat(row.income), expenses: parseFloat(row.expenses) });
  }

  return c.json(data);
});

dashboardRoutes.get("/api/finances/top-entities", async (c) => {
  const period = c.req.query("period") ?? "month";
  const { start, end } = getPeriodDates(period);

  const txns = await db
    .select()
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, start), lt(schema.transactions.date, end)));

  // Group by entity
  const entityMap = new Map<string, { name: string; total: number; count: number; type: string }>();

  const entities = await db.select().from(schema.businessEntities);
  const entityLookup = new Map(entities.map((e) => [e.id, e]));

  for (const txn of txns) {
    if (!txn.entityId) continue;
    const entity = entityLookup.get(txn.entityId);
    if (!entity) continue;

    const existing = entityMap.get(txn.entityId) ?? { name: entity.name, total: 0, count: 0, type: entity.type };
    existing.total += Math.abs(parseFloat(txn.amount));
    existing.count++;
    entityMap.set(txn.entityId, existing);
  }

  const sorted = [...entityMap.values()].sort((a, b) => b.total - a.total);
  const topVendors = sorted.filter((e) => e.type === "vendor").slice(0, 5);
  const topClients = sorted.filter((e) => e.type === "client").slice(0, 5);

  return c.json({ topVendors, topClients });
});

// ── Helper ──

function getPeriodDates(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  let start: Date, end: Date, prevStart: Date, prevEnd: Date;

  if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    end = new Date(now.getFullYear(), q * 3 + 3, 1);
    prevStart = new Date(now.getFullYear(), q * 3 - 3, 1);
    prevEnd = new Date(now.getFullYear(), q * 3, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
    prevStart = new Date(now.getFullYear() - 1, 0, 1);
    prevEnd = new Date(now.getFullYear(), 0, 1);
  }

  return { start, end, prevStart, prevEnd };
}
```

- [ ] **Step 2: Mount dashboard routes**

In `src/api/routes.ts`, add:

```typescript
import { dashboardRoutes } from "./dashboard-routes.js";
// after existing mounts:
app.route("/", dashboardRoutes);
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/api/dashboard-routes.ts src/api/routes.ts
git commit -m "feat: add import API, dashboard data endpoints, and SSR page routes"
```

---

### Task 7: SSR Views — Import Page

**Files:**
- Create: `src/views/finance-import.ts`

- [ ] **Step 1: Create import page view**

This is the most important page — it's the entry point for bank data. Create `src/views/finance-import.ts` with `renderFinanceImport()` returning HTML via `layout()`.

The page includes:
- File upload area (drag & drop + file picker, accepts .txt and .csv)
- Account selector dropdown ("Cuenta Corriente" / "Cuenta de Ahorros")
- Preview section that appears after file selected (shows parsed transactions table)
- Import button
- Import history table from bankSyncLog
- JavaScript: on file select → POST to `/api/transactions/import/preview` → show preview. On confirm → POST to `/api/transactions/import` → show result.

Use the existing `layout()` from `src/views/layout.ts` with dark theme (criteria-black, criteria-dark, etc).

Include a nav bar at the top with links: Dashboard | Transacciones | Reconciliacion | Importar (current page highlighted).

The page should work end-to-end: select file → see preview → click import → see results with link to transactions.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/views/finance-import.ts
git commit -m "feat: add CSV import SSR page with preview and drag & drop"
```

---

### Task 8: SSR Views — Main Dashboard

**Files:**
- Create: `src/views/finance-dashboard.ts`

- [ ] **Step 1: Create dashboard page view**

Create `src/views/finance-dashboard.ts` with `renderFinanceDashboard()`. This is the main financial overview page.

Include:
- Same nav bar as import page
- Period selector (Este mes / Ultimo mes / Ultimos 3 meses / Este ano)
- 4 KPI cards loaded from `/api/finances/summary`
- Cash flow chart (Chart.js bar chart, loaded from `/api/finances/cash-flow`)
- Top entities table (loaded from `/api/finances/top-entities`)
- Recent 10 transactions table (loaded from `/api/transactions?limit=10`)

JavaScript: on page load, fetch all 4 data endpoints and populate. On period change, refetch.

Chart.js via CDN: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/views/finance-dashboard.ts
git commit -m "feat: add financial dashboard SSR page with KPI cards and cash flow chart"
```

---

### Task 9: SSR Views — Transactions List + Reconciliation Queue

**Files:**
- Create: `src/views/finance-transactions.ts`
- Create: `src/views/finance-reconciliation.ts`

- [ ] **Step 1: Create transactions list page**

Create `src/views/finance-transactions.ts` with `renderFinanceTransactions()`.

Include:
- Same nav bar
- Filter bar: type dropdown (all/income/expense), category dropdown, reconciled (all/yes/no)
- Paginated table loaded from `/api/transactions`
- Each row: date, entity name, description (truncated), amount (green/red), category badge, reconciled status
- Click category → inline dropdown to change (PATCH)
- Pagination controls

- [ ] **Step 2: Create reconciliation page**

Create `src/views/finance-reconciliation.ts` with `renderFinanceReconciliation()`.

Include:
- Same nav bar
- Two-panel layout (flexbox):
  - Left: "Pagos Esperados" — loaded from `/api/expected-payments?status=pending`
  - Right: "Ingresos Sin Reconciliar" — loaded from `/api/transactions?reconciled=no&type=income`
- Suggested matches highlighted (amount match + entity match)
- "Confirmar" button on suggested matches → POST to `/api/transactions/:id/reconcile`
- "Asignar" dropdown for manual reconciliation

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/views/finance-transactions.ts src/views/finance-reconciliation.ts
git commit -m "feat: add transactions list and reconciliation queue SSR pages"
```

---

### Task 10: End-to-End Verification

- [ ] **Step 1: Start server and test CSV import with real file**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; npm run dev &
sleep 3

# Import real Banco General file
curl -s -X POST http://localhost:3000/api/transactions/import \
  -F "file=@/Users/juanpa/Downloads/bg/ESTADO-DE-CUENTA-CUENTA-CORRIENTE-2026-04-06-181534.txt" \
  -F "accountId=corriente"
```

Expected: JSON with found, new, duplicates, entitiesCreated counts.

- [ ] **Step 2: Test dedup (import same file again)**

```bash
curl -s -X POST http://localhost:3000/api/transactions/import \
  -F "file=@/Users/juanpa/Downloads/bg/ESTADO-DE-CUENTA-CUENTA-CORRIENTE-2026-04-06-181534.txt" \
  -F "accountId=corriente"
```

Expected: `new: 0, duplicates: 24` (all are duplicates now).

- [ ] **Step 3: Test second account**

```bash
curl -s -X POST http://localhost:3000/api/transactions/import \
  -F "file=@/Users/juanpa/Downloads/bg/ESTADO-DE-CUENTA-CUENTA-DE-AHORROS-2026-04-06-181614.txt" \
  -F "accountId=ahorros"
```

- [ ] **Step 4: Test dashboard endpoints**

```bash
curl -s http://localhost:3000/api/finances/summary?period=month
curl -s http://localhost:3000/api/finances/cash-flow?months=3
curl -s http://localhost:3000/api/entities
curl -s http://localhost:3000/api/transactions?limit=5
```

- [ ] **Step 5: Test SSR pages load**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/finances
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/finances/transactions
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/finances/reconciliation
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/finances/import
```

Expected: all return 200.

- [ ] **Step 6: Commit any fixes**

```bash
kill %1 2>/dev/null
git add -A && git commit -m "fix: address issues from e2e verification"
```

---

### Summary of Files

**Created (10 files):**

| File | Purpose |
|------|---------|
| `src/services/bg-csv-parser.ts` | Parse Banco General .txt files |
| `src/services/entity-matcher.ts` | Match/create business entities |
| `src/services/bank-sync.ts` | Orchestrate import pipeline |
| `src/api/entity-routes.ts` | Business entity CRUD |
| `src/api/invoice-routes.ts` | Invoice CRUD + transaction linking |
| `src/api/dashboard-routes.ts` | Import API + dashboard data + SSR pages |
| `src/views/finance-import.ts` | CSV import page |
| `src/views/finance-dashboard.ts` | Main dashboard with charts |
| `src/views/finance-transactions.ts` | Transaction list with filters |
| `src/views/finance-reconciliation.ts` | Reconciliation queue |

**Modified (4 files):**

| File | Changes |
|------|---------|
| `src/db/schema.ts` | 3 new enums, 3 new tables, entityId on transactions |
| `src/api/routes.ts` | Mount entity, invoice, dashboard routes |
| `src/api/finance-routes.ts` | Add entityId + pattern learning to PATCH |
