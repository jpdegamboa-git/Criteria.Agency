# criteria.agency — Financial Module & Bank Integration

> Date: April 6, 2026
> Status: Design spec
> Scope: Bank provider abstraction, transaction ingestion, payment reconciliation, financial dashboard

---

## 1. Context

criteria.agency operates from a single Banco General (Panama) account where all business transactions flow — client payments (wire transfers and Stripe), operational expenses, API costs, contractor payments, taxes, and bank fees.

The founder currently has no formal accounting system. This module becomes the primary financial visibility tool for the business.

**Two types of client payments coexist:**
- **Stripe subscriptions** (Starter/Pro tiers) — already handled by the checkout system
- **Wire transfers** (Enterprise tier) — received in Banco General, identified only by sender name (no reference codes)

**Bank API status:**
- Banco General offers "Conexion BG" — REST API with OAuth 2.0, HTTPS/TLS 1.2
- Access not yet requested — requires onboarding as enterprise client
- Bridge solution needed: CSV import from online banking

**This module feeds two Admin Portal backoffice sections:**
- Finanzas (financial dashboard, cash flow, client payments)
- Contabilidad (transaction categorization, reporting, reconciliation)

---

## 2. Architecture: Bank Provider Abstraction

All transaction data flows through a provider interface. The dashboard and reconciliation engine consume normalized transactions regardless of source.

```
BankProvider interface
  ├── CSVImportProvider    (now — upload CSV from online banking)
  ├── ConexionBGProvider   (future — REST API + OAuth 2.0 polling)
  └── MockProvider         (development — generated test data)
       │
       ▼
  BankSyncService
       │
       ├── Normalize → transactions table
       ├── Deduplicate by externalId
       ├── Auto-categorize (rules + learned patterns)
       ├── Reconcile against expectedPayments
       └── Emit events (new_transactions, payment_reconciled, unmatched_payment)
```

### BankProvider Interface

```typescript
interface BankProvider {
  id: string;       // "csv_import" | "conexion_bg" | "mock"
  name: string;

  fetchTransactions(params: {
    accountId: string;
    since: Date;
    until?: Date;
  }): Promise<NormalizedTransaction[]>;

  getStatus(): Promise<{
    connected: boolean;
    lastSync: Date | null;
    error?: string;
  }>;
}
```

### CSVImportProvider (Phase 1)

- Accepts CSV file uploaded by founder
- Parses Banco General format (auto-detects columns: date, description, debit, credit, balance)
- Generates `externalId` from hash(date + amount + description) to prevent duplicates on re-upload
- No credentials required — founder downloads CSV from online banking and uploads

### ConexionBGProvider (Phase 2 — when access granted)

- OAuth 2.0 authentication (client_id, client_secret, token refresh)
- Configurable polling interval (1h, 4h, or daily)
- Query transactions by date range
- Credentials encrypted in DB (AES-256-GCM with per-tenant salt, per security framework)
- When active, replaces CSV import — same normalization, same output

### MockProvider (Development)

- Generates realistic mix of income and expense transactions
- Activates when `NODE_ENV=development` and no other provider is configured
- Useful for testing dashboard, reconciliation, and categorization

---

## 3. Data Model

### Table: `transactions`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| bankAccountId | varchar(50) | Account identifier (supports future multi-account) |
| externalId | varchar(255), unique | Transaction ID from bank, or hash for CSV. Prevents duplicates. |
| date | timestamp | Transaction date |
| amount | numeric(12,2) | Positive = income, negative = expense |
| currency | varchar(3) | Default "USD" |
| description | text | Original bank description |
| counterpartyName | varchar(255) | Sender/recipient name |
| reference | varchar(255) | Reference/concept if present |
| category | varchar(50) | Assigned category (see categories below) |
| subcategory | varchar(50) | Optional subcategory |
| type | enum | `income`, `expense`, `transfer`, `fee` |
| source | enum | `csv_import`, `conexion_bg`, `stripe`, `manual` |
| reconciled | boolean | Matched with an expected payment? Default false |
| reconciledWithId | uuid, nullable | FK → expectedPayments |
| clientId | uuid, nullable | FK → clients, if identified |
| notes | text | Founder's manual notes |
| metadata | jsonb | Raw original data from source |
| createdAt | timestamp | |

### Table: `expectedPayments`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| clientId | uuid FK → clients | |
| amount | numeric(12,2) | Expected payment amount |
| currency | varchar(3) | |
| description | varchar(255) | e.g. "Suscripcion Pro — Abril 2026" |
| dueDate | timestamp | Expected payment date |
| status | enum | `pending`, `reconciled`, `overdue`, `canceled` |
| reconciledTransactionId | uuid, nullable FK → transactions | |
| createdAt | timestamp | |

### Table: `clientAliases`

Learned associations between bank sender names and clients. Improves fuzzy matching over time.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| clientId | uuid FK → clients | |
| alias | varchar(255) | Bank sender name variation (e.g. "ACME CORPORATION WIRE") |
| createdAt | timestamp | |

When a founder confirms a reconciliation match, the sender name is saved as an alias. Future transactions from the same name auto-match.

### Table: `categorizationRules`

Learned and manual categorization rules.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| pattern | varchar(255) | Text match or regex against description/counterpartyName |
| matchType | enum | `contains`, `exact`, `regex` |
| category | varchar(50) | Target category |
| subcategory | varchar(50) | Target subcategory (optional) |
| transactionType | enum | `income`, `expense`, `transfer`, `fee` |
| source | enum | `auto` (system-learned), `manual` (founder-created) |
| priority | integer | Higher = evaluated first. Default 0 |
| createdAt | timestamp | |

### Table: `bankSyncLog`

Audit trail for all sync operations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| provider | varchar(50) | Provider ID |
| startedAt | timestamp | |
| completedAt | timestamp | |
| transactionsFound | integer | Total from provider |
| transactionsNew | integer | After dedup |
| transactionsReconciled | integer | Auto-reconciled |
| status | enum | `completed`, `failed`, `partial` |
| error | text | Error message if failed |

### Predefined Categories

**Income:**
- `client_payment` — Wire transfer from client
- `subscription` — Stripe subscription payment
- `refund_received` — Refund from vendor
- `interest` — Bank interest
- `other_income` — Uncategorized income

**Expense:**
- `ai_api_costs` — Claude, Runway, ElevenLabs, etc.
- `infrastructure` — Vercel, Railway, Neon, R2, Bunny Stream
- `software_subscriptions` — Tools and SaaS
- `contractor` — Freelancer/contractor payments
- `taxes` — Tax payments
- `bank_fees` — Wire fees, maintenance fees
- `marketing` — Ads, content, tools
- `office` — Physical office, supplies
- `other_expense` — Uncategorized expense

**Transfer:**
- `internal_transfer` — Between own accounts

---

## 4. Payment Reconciliation Engine

### Matching Algorithm (by priority)

Runs on every new income transaction against `expectedPayments` with status `pending`:

**1. EXACT MATCH** — Amount exact match + counterpartyName fuzzy match ≥85% against client name/company/aliases
- Action: Auto-reconcile. Set `reconciled = true`, link IDs, activate subscription if needed.

**2. AMOUNT MATCH** — Amount exact match but name doesn't match any client
- Action: Mark as `suggested`. Show in reconciliation dashboard for manual confirmation.

**3. FUZZY MATCH** — Name matches ≥85% but amount differs ≤5%
- Action: Mark as `suggested` with warning flag. Could be bank fee deduction.

**4. NO MATCH** — Income transaction with no corresponding expectedPayment
- Action: Leave as `unmatched`. Categorize as `other_income`. Show in dashboard.

### Fuzzy Name Matching

Normalization before comparison:
- Lowercase
- Remove accents (á → a)
- Remove legal suffixes: "S.A.", "LLC", "Inc.", "Corp.", "Ltd.", "S.R.L."
- Remove common wire transfer noise: "WIRE", "TRANSFER", "TRF", "INTL"
- Trim whitespace

Compare normalized name against:
1. `clients.name` (normalized)
2. `clients.company` (normalized)
3. `clientAliases.alias` (normalized) — exact match here, since aliases are already normalized sender names

Similarity: Levenshtein distance normalized to 0-100%. Threshold: ≥85%.

### On Successful Reconciliation (auto or confirmed)

1. `expectedPayment.status` → `reconciled`
2. `expectedPayment.reconciledTransactionId` → transaction.id
3. `transaction.reconciled` → true
4. `transaction.reconciledWithId` → expectedPayment.id
5. `transaction.clientId` → expectedPayment.clientId
6. `transaction.category` → `client_payment`
7. Save counterpartyName as new `clientAlias` (if not already saved)
8. If client `subscriptionStatus` is null or `past_due` → set to `active`
9. If recurring: create next `expectedPayment` (due +1 month)

---

## 5. Auto-Categorization

Runs on every new transaction after reconciliation (uncategorized transactions only).

### Rule Evaluation Order

1. **Fixed rules** (hardcoded, highest priority):
   - Description contains "STRIPE" → category: `subscription`, type: `income`
   - Description contains "COMISION" or "FEE" → category: `bank_fees`, type: `fee`
   - Description contains "INTERES" → category: `interest`, type: `income`

2. **Manual rules** from `categorizationRules` where source = `manual`, ordered by priority desc

3. **Learned rules** from `categorizationRules` where source = `auto`, ordered by priority desc

4. **Fallback**: type based on amount sign (positive → `other_income`, negative → `other_expense`)

### Learning

When the founder manually categorizes a transaction:
- Check if a rule already exists for this pattern
- If not: create `categorizationRules` entry with `source = auto`, `matchType = contains`, `pattern` = most distinctive word(s) from description
- Future transactions matching the pattern get auto-categorized

---

## 6. Financial Dashboard

Served as Hono SSR pages (same pattern as review portal and pricing page). Accessible at `/admin/finances`.

No authentication in Phase 1 (consistent with current API pattern). Future: admin auth required.

### KPI Cards (top row)

| Card | Calculation |
|------|------------|
| Ingresos | Sum of income transactions in selected period |
| Gastos | Sum of expense transactions in selected period (absolute value) |
| Balance | Income - Expenses |
| Por cobrar | Sum of expectedPayments with status `pending` |

Each card shows % change vs previous equivalent period.

### Section: Cash Flow Chart

- Bar chart: income (green) vs expenses (red) by month, last 12 months
- Line overlay: cumulative balance
- Breakdown toggle: income by source (Stripe vs Wire vs Other)
- Implementation: server-rendered data + Chart.js via CDN

### Section: Revenue by Client

- Table: client name, total revenue (all time), last payment date, subscription tier, payment method, status
- Sortable by any column
- Filter by: tier, payment method, period
- Click row → transaction history for that client

### Section: Expenses by Category

- Horizontal bar chart: top categories by spend in period
- Table with: category, amount, % of total, change vs previous period
- Alert indicator if category grew >30% vs previous period

### Section: Recent Transactions

- Paginated table of all transactions
- Columns: date, description, counterparty, amount, category, type, source, reconciled status
- Filters: type, category, reconciled/unreconciled, source, date range
- Click row → detail view with edit (category, notes, manual reconciliation)
- Bulk actions: categorize multiple, export CSV

### Section: Reconciliation Queue

- Split view: expectedPayments (pending) on left, unmatched income transactions on right
- Suggested matches highlighted with "Confirmar" button
- Manual assignment: drag or dropdown to link transaction → expectedPayment
- Quick actions: mark as "not a client payment", create new client from transaction

---

## 7. API Endpoints

### Transaction Management

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/transactions/import` | Upload CSV file, parse, normalize, sync |
| GET | `/api/transactions` | List transactions (paginated, filterable) |
| GET | `/api/transactions/:id` | Get single transaction |
| PATCH | `/api/transactions/:id` | Update category, notes, clientId |
| POST | `/api/transactions/:id/reconcile` | Manually reconcile with expectedPayment |

### Expected Payments

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/expected-payments` | Create expected payment for a client |
| GET | `/api/expected-payments` | List (filterable by status, client) |
| PATCH | `/api/expected-payments/:id` | Update amount, dueDate, status |
| DELETE | `/api/expected-payments/:id` | Cancel expected payment |

### Dashboard Data

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/finances/summary` | KPI cards data for period |
| GET | `/api/finances/cash-flow` | Monthly income/expense for chart |
| GET | `/api/finances/by-client` | Revenue breakdown by client |
| GET | `/api/finances/by-category` | Expense breakdown by category |

### Categorization Rules

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/categorization-rules` | List all rules |
| POST | `/api/categorization-rules` | Create manual rule |
| DELETE | `/api/categorization-rules/:id` | Delete rule |

### Bank Sync

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/bank/status` | Provider status + last sync |
| POST | `/api/bank/sync` | Trigger manual sync (for ConexionBG) |
| GET | `/api/bank/sync-log` | Sync history |

### Dashboard Pages (SSR)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/admin/finances` | Main financial dashboard |
| GET | `/admin/finances/transactions` | Full transaction list with filters |
| GET | `/admin/finances/reconciliation` | Reconciliation queue |
| GET | `/admin/finances/import` | CSV import page with upload form |

---

## 8. CSV Import Flow

### Upload Experience

1. Founder navigates to `/admin/finances/import`
2. Page shows: file upload area, last import date, instructions
3. Founder drags CSV file (downloaded from Banco General online banking)
4. System parses, shows preview: "Found 47 transactions, 12 new, 35 already imported"
5. Founder confirms import
6. System normalizes, categorizes, reconciles
7. Redirect to dashboard with summary: "12 new transactions. 3 auto-reconciled. 2 suggested matches."

### CSV Parsing

Banco General CSV expected format (to be confirmed with actual file):
- Encoding: UTF-8 or Latin-1 (auto-detect)
- Delimiter: comma (fallback: semicolon, tab)
- Headers: auto-detect by looking for date-like, amount-like, description-like columns
- Date formats: try DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- Amount: handle both "1,234.56" and "1.234,56" formats
- Separate debit/credit columns OR single signed amount column

The parser should be resilient — try multiple format strategies and pick the one that produces valid data.

### Deduplication

`externalId` = SHA-256(date_iso + "|" + amount + "|" + description_normalized)

On import:
1. Compute externalId for each row
2. Check against existing transactions
3. Skip duplicates, import only new
4. Report: "X new, Y duplicates skipped"

---

## 9. Stripe Transaction Ingestion

Stripe webhook events already handled in checkout-routes.ts. Extend to also create `transactions` entries:

- `invoice.payment_succeeded` → Create income transaction with:
  - source: `stripe`
  - category: `subscription`
  - clientId: from Stripe customer → clients table
  - amount: invoice amount
  - externalId: Stripe invoice ID
  - auto-reconciled: true (Stripe payments are inherently reconciled)

This ensures the financial dashboard shows ALL revenue — both Stripe and wire transfers — in one unified view.

---

## 10. What Is NOT In This Spec

- Full accounting system (double-entry bookkeeping, chart of accounts, journal entries)
- Tax calculation or filing
- Invoice generation (future — Financial Agent in the Transversal motors)
- Multi-currency conversion (USD only for launch)
- ConexionBG implementation details (requires API documentation from bank)
- Admin authentication (follows existing pattern — no auth in current phase)
- Real-time transaction notifications (polling only, no webhooks from bank)
- Accounts payable / bill payment automation

---

## 11. Future: Conexion BG Integration

When access is granted, implement `ConexionBGProvider`:

### Authentication
- OAuth 2.0 (client_credentials or authorization_code flow — per bank docs)
- Store encrypted: client_id, client_secret, access_token, refresh_token
- Auto-refresh token before expiry

### Polling
- Configurable cron: default every 4 hours
- Fetch transactions since last sync timestamp
- Same normalization pipeline as CSV
- Log every sync in `bankSyncLog`

### Transition from CSV
- When ConexionBG is active, CSV import remains available as fallback
- Dashboard shows active provider and last sync time
- Historical CSV data remains — no migration needed

---

## 12. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Add 4 new tables + enums (extend existing) |
| `src/services/bank-provider.ts` | BankProvider interface + provider registry |
| `src/services/csv-import-provider.ts` | CSV parsing and normalization |
| `src/services/mock-bank-provider.ts` | Mock transaction generator |
| `src/services/bank-sync.ts` | Sync orchestration, dedup, categorize, reconcile |
| `src/services/reconciler.ts` | Payment matching algorithm |
| `src/services/categorizer.ts` | Rule-based auto-categorization |
| `src/api/finance-routes.ts` | All financial API endpoints |
| `src/views/finance-dashboard.ts` | Main dashboard SSR page |
| `src/views/finance-transactions.ts` | Transaction list SSR page |
| `src/views/finance-reconciliation.ts` | Reconciliation queue SSR page |
| `src/views/finance-import.ts` | CSV import SSR page |

### Modified Files

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add transactions, expectedPayments, clientAliases, categorizationRules, bankSyncLog tables |
| `src/api/routes.ts` | Mount finance routes |
| `src/api/checkout-routes.ts` | Add Stripe transaction ingestion on invoice.payment_succeeded |
| `src/shared/config.ts` | Add bank provider config vars |

---

## 13. Verification

1. **CSV Import**: Upload a sample CSV → see transactions in dashboard → categories assigned
2. **Reconciliation**: Create expectedPayment for client → import CSV with matching transaction → auto-reconciled
3. **Fuzzy Matching**: Import transaction from "ACME CORPORATION" → matches client "Acme Corp" → suggested
4. **Learning**: Confirm match → future "ACME CORPORATION" transactions auto-match
5. **Dashboard**: See KPI cards, cash flow chart, revenue by client, expenses by category
6. **Stripe Integration**: Complete a Stripe test payment → appears in dashboard as income
7. **Dedup**: Upload same CSV twice → second import shows "0 new, X duplicates"
8. **Categorization**: Categorize "AWS" as infrastructure → next AWS transaction auto-categorized

---

## Related Documents

- `docs/superpowers/specs/2026-04-06-gtm-strategy-design.md` — Subscription tiers, Stripe integration
- `docs/superpowers/specs/2026-04-06-security-framework-design.md` — Credential encryption, data protection
- `PORTAL_SPECS.md` — Admin portal backoffice modules (Finanzas, Contabilidad)
- `TECH_ARCHITECTURE.md` — Database, infrastructure, security patterns
