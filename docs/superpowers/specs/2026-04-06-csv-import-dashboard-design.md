# criteria.agency — CSV Bank Import, Entity Registry & Financial Dashboard

> Date: April 6, 2026
> Status: Design spec
> Scope: Banco General CSV parser, business entity extraction, invoice tracking, bank sync service, 4 SSR dashboard pages

---

## 1. Context

The financial module schema is built (7 tables) and the categorizer + reconciler services exist. What's missing is the ability to ingest real bank data and visualize it.

**What exists:**
- Tables: `transactions`, `expectedPayments`, `clientAliases`, `categorizationRules`, `bankSyncLog`
- Services: `categorizer.ts` (waterfall categorization), `reconciler.ts` (payment matching)
- API routes: `finance-routes.ts` (CRUD for transactions, payments, rules, subscriptions)

**What this spec adds:**
- CSV parser for Banco General format (`;` delimited `.txt` files)
- Business entity registry (clients, vendors, personal, bank, government)
- Invoice tracking (issued + received, linked to transactions)
- Bank sync service (orchestrates parse → entity match → categorize → reconcile)
- 4 SSR dashboard pages (main, transactions, reconciliation, import)

### Banco General CSV Format (confirmed from real files)

```
Fecha;Referencia;Transacción;Descripción;Débito;Crédito;Saldo capital
02/03/2026;46;50;ADOBE-4560-34XX-XXXX-0913;77.86;;4746.93
17/03/2026;175;48;TRR09339298923 BERTELSMANN FOUNDATION (NORTH AMERI/ 002000041872088;;8,140.00;8142.91
```

- Extension: `.txt` (not .csv)
- Delimiter: semicolon (`;`)
- Encoding: UTF-8
- Date format: `DD/MM/YYYY`
- Amounts: comma thousands, dot decimal (`1,100.00`). Empty if N/A.
- Débito = outflow (expense), Crédito = inflow (income)
- 2 accounts: Corriente + Ahorros (same format)

---

## 2. New Database Tables

### `businessEntities`

Registry of all parties the business transacts with — clients, vendors, contractors, banks, government.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| name | varchar(255) | Clean name: "Adobe", "Uber", "Naturgy" |
| type | enum | `client`, `vendor`, `personal`, `bank`, `government`, `unknown` |
| clientId | uuid nullable FK → clients | If this entity is a criteria.agency client |
| patterns | jsonb | Array of bank description patterns that match this entity: `["ADOBE-4560", "ADOBE SYSTEMS"]` |
| defaultCategory | varchar(50) | Default category for transactions with this entity |
| notes | text | |
| createdAt | timestamp | |

When a transaction is categorized or reconciled manually, the description pattern is added to the entity's `patterns` array. Future transactions matching any pattern auto-resolve to this entity.

### `invoices`

Both issued (to clients) and received (from vendors).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| direction | enum | `issued` (we bill client) / `received` (vendor bills us) |
| entityId | uuid FK → businessEntities | Who issued/received |
| invoiceNumber | varchar(100) | Invoice number |
| amount | numeric(12,2) | Total amount |
| currency | varchar(3) | Default "USD" |
| issueDate | timestamp | |
| dueDate | timestamp | |
| status | enum | `pending`, `partial`, `paid`, `overdue`, `canceled` |
| filePath | text nullable | Path to uploaded PDF/image (`storage/invoices/{id}/filename.pdf`) |
| notes | text | |
| metadata | jsonb | Line items, tax details, etc. |
| createdAt | timestamp | |

### `transactionInvoices`

Many-to-many: a transaction can pay multiple invoices, an invoice can have multiple payments.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| transactionId | uuid FK → transactions | |
| invoiceId | uuid FK → invoices | |
| amount | numeric(12,2) | How much of this transaction applies to this invoice |
| createdAt | timestamp | |

### Modifications to `transactions` table

Add column:
- `entityId` (uuid nullable FK → businessEntities) — the business entity this transaction is associated with

---

## 3. Banco General CSV Parser

File: `src/services/bg-csv-parser.ts`

### Parse Function

```typescript
parseBGFile(content: string, accountId: string): ParsedTransaction[]
```

Steps:
1. Split content by newlines, skip header row
2. Split each row by `;`
3. For each row with 7 columns:
   - `date` = parse `DD/MM/YYYY` → Date
   - `reference` = column 2 (trim)
   - `transactionCode` = column 3 (trim)
   - `description` = column 4
   - `amount` = if column 6 (Crédito) has value → positive, if column 5 (Débito) has value → negative
   - Parse amounts: remove commas (`"1,100.00"` → `"1100.00"`), parseFloat
   - `balance` = column 7 (stored in metadata, not as field)
4. Generate `externalId` = SHA-256(`accountId|date_iso|amount|description`)
5. Extract `counterpartyName` using BG-specific patterns (see below)

### Counterparty Name Extraction

BG descriptions follow predictable patterns. Extract clean names:

| Pattern | Regex | Extracted Name |
|---------|-------|---------------|
| Card purchase | `/^(.+?)-\d{4}-\d{2}XX-XXXX-\d{4}$/` | Group 1 trimmed: "ADOBE", "UBER TRIP HELP.UBER.C", "RBS LLC" |
| Transfer to | `/TRANSFERENCIA A \d+ (.+?) BANCA EN LINE/` | Group 1: "CELERO NETWORKS, CORP." |
| Transfer from | `/TRANSFERENCIA DE (.+?) BANCA EN LINEA/` | Group 1: "JUAN PABLO DE GAMBOA GOMEZ" |
| Transfer from account | `/TRANSFERENCIA DE \d+ (.+?) BANCA EN LINEA/` | Group 1: "CRITERIA, S.A." |
| International wire | `/^TRR\d+ (.+?)\s*\/\s*\d+$/` | Group 1: "BERTELSMANN FOUNDATION (NORTH AMERI" → clean to "BERTELSMANN FOUNDATION" |
| Bill payment | `/BANCA EN LINEA PAGO VISA .+ (.+)$/` | "Pago Visa (propia)" |
| Bank service | `/BANCA EN LI[NÑ]EA (.+?)(?:\s*\([\d]+\))?$/` | Group 1: "NATURGY (EDEMET-EDECHI)", "MUNICIPIO DE PANAMA" |
| Commission | `/^COMISION/` | "Banco General" |
| Insurance | `/^(SEGURO|IMPUESTO SEGURO)/` | "Banco General" |
| Interest | `/^INTERES/` | "Banco General" |
| Fallback | Everything else | Full description as counterparty |

Post-extraction cleanup:
- Remove trailing account numbers/codes
- Remove "(NORTH AMERI" type truncations → trim at last complete word
- Title case: "ADOBE" → "Adobe", "RBS LLC" → "RBS LLC" (keep uppercase for acronyms)

---

## 4. Entity Matching Service

File: `src/services/entity-matcher.ts`

### Match Function

```typescript
matchEntity(counterpartyName: string, description: string, amount: number): Promise<{
  entityId: string | null;
  confidence: number;
  created: boolean;  // true if a new entity was auto-created
}>
```

### Matching Logic

1. **Pattern match**: Check `businessEntities.patterns` — for each entity, check if any pattern is contained in the description (case-insensitive). Exact pattern match → confidence 1.0.

2. **Name fuzzy match**: Compare extracted counterpartyName against `businessEntities.name` with Levenshtein similarity ≥85%. → confidence 0.9.

3. **Client alias match**: Check `clientAliases` table (already exists). If match found, look up the client's businessEntity. → confidence 0.95.

4. **AI extraction** (for unmatched): Call Claude/Gemini Haiku:

```
Prompt: Extract the business entity name from this bank transaction description.
Description: "{raw description}"
Extracted counterparty: "{counterpartyName}"

What is the clean business name? What type of entity is it?
Types: client, vendor, personal, bank, government

Respond JSON only:
{ "name": "Clean Name", "type": "vendor", "suggestedCategory": "software_subscriptions" }
```

5. **Auto-create entity**: If AI returns a name with confidence, create new `businessEntities` entry with the description as first pattern. → confidence 0.7, created: true.

6. **No match**: Return null entity. Transaction gets `entityId = null`, shown in dashboard for manual assignment.

### Learning on Manual Assignment

When founder manually assigns a transaction to an entity:
1. Add the transaction's description (or a distinctive substring) to `entity.patterns` array
2. If entity doesn't exist, create it with the name founder provides
3. Set `transaction.entityId`
4. If the entity has `defaultCategory` and transaction has no category → auto-categorize

---

## 5. Bank Sync Service

File: `src/services/bank-sync.ts`

Orchestrates the full import pipeline.

```typescript
importCSV(fileContent: string, accountId: string): Promise<ImportResult>
```

### Pipeline

```
1. Parse CSV → ParsedTransaction[]
2. Dedup: check externalId against existing transactions → filter new only
3. For each new transaction:
   a. Extract counterparty name (BG parser)
   b. Match/create entity (entity-matcher)
   c. Set entityId + counterpartyName on transaction
   d. Insert into transactions table
4. Categorize all new transactions (categorizer.ts, uses entity.defaultCategory as hint)
5. Reconcile income transactions vs expectedPayments (reconciler.ts)
6. Suggest invoice matches (by entity + amount + date proximity)
7. Log sync in bankSyncLog
8. Return ImportResult
```

### ImportResult

```typescript
interface ImportResult {
  syncLogId: string;
  found: number;           // total rows parsed
  new: number;             // after dedup
  duplicates: number;      // skipped
  entitiesCreated: number; // new businessEntities auto-created
  categorized: number;     // auto-categorized
  reconciled: number;      // matched with expectedPayments
  invoiceMatches: number;  // suggested invoice matches
  unmatched: number;       // transactions needing manual review
}
```

---

## 6. Dashboard SSR Pages

All pages at `/admin/finances/*` — Hono SSR + Tailwind CDN + Chart.js CDN. Same dark theme as review portal and pricing page (using `src/views/layout.ts`).

### 6.1 `/admin/finances` — Main Dashboard

**KPI Cards (top row):**
- Ingresos (sum income, period)
- Gastos (sum expenses, period)
- Balance (income - expenses)
- Por cobrar (sum pending invoices issued)

Each card shows % change vs previous period.

**Period selector:** dropdown — Este mes / Último mes / Últimos 3 meses / Este año

**Cash Flow Chart:**
- Bar chart via Chart.js: green bars (income) + red bars (expenses) by month
- Last 6 months
- Data loaded from `/api/finances/cash-flow` endpoint

**Top Entities:**
- Table: top 5 vendors by spend + top 5 clients by revenue this period
- Shows entity name, total, transaction count

**Recent Transactions:**
- Last 10 transactions with: date, entity, description, amount, category, status badge
- Link to full transactions list

### 6.2 `/admin/finances/transactions` — Full Transaction List

**Filters bar:** type (income/expense/all), category (dropdown), entity (dropdown), reconciled (yes/no/all), date range

**Table columns:** Date | Entity | Description | Amount | Category | Reconciled | Invoice | Actions

**Inline editing:**
- Click category → dropdown to change (PATCH + learn)
- Click entity → dropdown to assign/change (PATCH + add pattern)
- Click invoice → dropdown to link existing invoice

**Pagination:** 50 per page, prev/next buttons

**Actions column:** link invoice, edit notes, mark as reviewed

### 6.3 `/admin/finances/reconciliation` — Reconciliation Queue

**Two-panel layout:**

Left panel: "Pagos Esperados" — list of `expectedPayments` with status `pending`
- Shows: client name, amount, due date, days overdue

Right panel: "Ingresos Sin Reconciliar" — income transactions where `reconciled = 0`
- Shows: date, entity/counterparty, amount, description

**Suggested matches** highlighted: when amount matches or entity matches a client → yellow highlight with "Confirmar" button.

**Manual assignment:** button "Asignar" on any unreconciled income → opens dropdown of pending expectedPayments.

### 6.4 `/admin/finances/import` — CSV Import

**Upload section:**
- Drag & drop area or file picker (accepts .txt, .csv)
- Account selector: "Cuenta Corriente" / "Cuenta de Ahorros" (sets accountId)

**Preview section** (after file selected, before confirm):
- Table showing first 10 parsed transactions
- Summary: "25 transacciones encontradas, 18 nuevas, 7 duplicadas"
- New entities that will be created highlighted

**Import button:** triggers POST to `/api/transactions/import`

**Result section:**
- Summary of what was imported
- List of transactions needing manual review (no entity or category)
- Link to transactions list filtered to this import

**Import history:**
- Table of past imports from `bankSyncLog`: date, provider, found, new, reconciled, status

---

## 7. API Endpoints (New/Modified)

### Import
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/transactions/import` | Upload CSV file, parse, sync. Multipart form: `file` + `accountId` |
| POST | `/api/transactions/import/preview` | Parse CSV without importing, return preview |

### Business Entities
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/entities` | List all business entities |
| POST | `/api/entities` | Create entity manually |
| PATCH | `/api/entities/:id` | Update name, type, defaultCategory, patterns |
| POST | `/api/entities/:id/patterns` | Add a pattern to an entity |

### Invoices
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/invoices` | Create invoice (with optional file upload) |
| GET | `/api/invoices` | List invoices (filterable: direction, status, entityId) |
| GET | `/api/invoices/:id` | Get single invoice |
| PATCH | `/api/invoices/:id` | Update status, notes |
| POST | `/api/transactions/:id/invoices` | Link transaction to invoice |

### Dashboard Data
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/finances/summary?period=` | KPI cards data |
| GET | `/api/finances/cash-flow?months=6` | Monthly income/expense for chart |
| GET | `/api/finances/top-entities?period=` | Top vendors + clients by volume |

### Modify existing
| Method | Route | Change |
|--------|-------|--------|
| PATCH | `/api/transactions/:id` | Add entityId assignment + pattern learning |

### Dashboard Pages (SSR)
| Method | Route |
|--------|-------|
| GET | `/admin/finances` |
| GET | `/admin/finances/transactions` |
| GET | `/admin/finances/reconciliation` |
| GET | `/admin/finances/import` |

---

## 8. Files to Create

| File | Purpose |
|------|---------|
| `src/services/bg-csv-parser.ts` | Parse Banco General .txt format |
| `src/services/entity-matcher.ts` | Match/create business entities from descriptions |
| `src/services/bank-sync.ts` | Orchestrate import pipeline |
| `src/api/dashboard-routes.ts` | All SSR pages + dashboard API endpoints |
| `src/api/entity-routes.ts` | Business entity CRUD |
| `src/api/invoice-routes.ts` | Invoice CRUD + transaction linking |
| `src/views/finance-dashboard.ts` | Main dashboard SSR page |
| `src/views/finance-transactions.ts` | Transaction list SSR page |
| `src/views/finance-reconciliation.ts` | Reconciliation queue SSR page |
| `src/views/finance-import.ts` | CSV import SSR page |

## 9. Files to Modify

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add businessEntities, invoices, transactionInvoices tables + enums. Add entityId to transactions. |
| `src/api/routes.ts` | Mount dashboard, entity, invoice routes |
| `src/api/finance-routes.ts` | Add entityId to PATCH /api/transactions/:id + pattern learning |
| `src/services/categorizer.ts` | Accept entityId hint for category default |

---

## 10. What Is NOT In This Spec

- Automatic invoice generation (future — Financial Agent creates invoices from project deliveries)
- OCR/PDF parsing of received invoices (future — upload as file reference only)
- Multi-currency support (USD only)
- Conexion BG real-time API (future — this is CSV bridge)
- Recurring invoice scheduling
- Tax calculation or reporting
- Accounts receivable aging report (future dashboard addition)

---

## 11. Verification

1. **CSV Import**: Upload real Banco General .txt file → 25 transactions parsed, entities extracted, categories assigned
2. **Entity creation**: "ADOBE-4560-..." → creates "Adobe" vendor entity with pattern
3. **Entity learning**: Manually assign "RBS LLC" → entity created → next import auto-matches
4. **Dedup**: Upload same file twice → second import shows 0 new
5. **Invoice linking**: Create invoice for Bertelsmann $8,140 → link to wire transfer transaction → invoice status "paid"
6. **Dashboard**: See KPI cards, cash flow chart, top entities, recent transactions
7. **Reconciliation**: Create expectedPayment for client → import CSV with matching wire → suggested match shown
8. **Dual account**: Import from both Corriente and Ahorros → all transactions in one view with different accountId

---

## Related Documents

- `docs/superpowers/specs/2026-04-06-financial-module-design.md` — Original financial module architecture
- `docs/superpowers/specs/2026-04-06-business-agents-design.md` — Categorizer + reconciler services
- `src/services/categorizer.ts` — Transaction categorization (already built)
- `src/services/reconciler.ts` — Payment reconciliation (already built)
- `src/api/finance-routes.ts` — Existing finance API routes
