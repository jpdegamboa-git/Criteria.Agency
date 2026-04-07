# Marketplace + Print Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Marketplace transversal motor and Print Production motor (C-014) — register 2 pipelines, create 8 agent skill files, add new DB tables for vendors, wire up context maps, and update DB schema.

**Architecture:** Marketplace is a transversal motor with its own pipeline (9 steps, 2 gates) that manages vendor registration, quoting, comparison, and contracting. Print Production (6 steps, 2 gates) handles prepress file preparation and invokes Marketplace for vendor management. Three new DB tables: `vendors`, `vendor_quotes`, `vendor_reviews`.

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Hono

**Spec:** `docs/superpowers/specs/2026-04-07-marketplace-print-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `agents/MK-L_procurement_director.md` | Procurement Director skill file (leader) |
| `agents/MK-001_vendor_scout.md` | Vendor Scout skill file |
| `agents/MK-002_comparator.md` | Comparator skill file |
| `agents/MK-003_contract_manager.md` | Contract Manager skill file |
| `agents/PP-L_print_director.md` | Print Director skill file (leader) |
| `agents/PP-001_prepress_specialist.md` | Prepress Specialist skill file |
| `agents/PP-002_print_buyer.md` | Print Buyer skill file |
| `agents/PP-003_quality_inspector.md` | Quality Inspector skill file |
| `agents/_shared/print-specs.md` | Print technical specifications directive |

### Modified files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add MK + PP steps to enums, add vendors/quotes/reviews tables |
| `src/orchestrator/pipeline-registry.ts` | Add `marketplace` and `print-production` pipeline definitions |
| `src/agents/registry.ts` | Add 8 new agent entries |
| `src/agents/model-defaults.ts` | Add model assignments for 8 agents |
| `src/agents/context-map.ts` | Add context map entries for both pipelines |
| `src/agents/context-builder.ts` | Add `print-production` to `PIPELINE_DIRECTIVES` |

---

### Task 1: Add Marketplace + Print steps and vendor tables to DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add MK + PP steps to projectStatusEnum**

```typescript
  // Marketplace
  "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery",
  // Print Production
  "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery",
```

- [ ] **Step 2: Add MK + PP steps to artifactStepEnum**

```typescript
  // Marketplace
  "mk_request", "mk_search", "mk_quote", "mk_compare", "mk_contract", "mk_tracking", "mk_delivery",
  // Print Production
  "pp_brief", "pp_prepress", "pp_vendor_request", "pp_production_tracking", "pp_quality_check", "pp_delivery",
```

- [ ] **Step 3: Add MK + PP gates to gateTypeEnum**

```typescript
  "mk-g1", "mk-g2",
  "pp-g1", "pp-g2",
```

- [ ] **Step 4: Add vendor tables**

Add these table definitions after the existing tables:

```typescript
// ── Vendor Management (Marketplace) ──

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  categories: text("categories").array().notNull(),
  services: text("services").array().notNull(),
  location: varchar("location", { length: 255 }),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  totalJobs: integer("total_jobs").default(0),
  priceRange: varchar("price_range", { length: 10 }),
  portfolioUrl: varchar("portfolio_url", { length: 500 }),
  contact: jsonb("contact").$type<{ email?: string; phone?: string; whatsapp?: string; website?: string }>(),
  notes: text("notes"),
  active: boolean("active").default(true),
  clientId: uuid("client_id").references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendorQuoteStatusEnum = pgEnum("vendor_quote_status", [
  "pending", "accepted", "rejected", "expired",
]);

export const vendorQuotes = pgTable("vendor_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => vendors.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  deliveryDays: integer("delivery_days"),
  specs: jsonb("specs"),
  status: vendorQuoteStatusEnum("status").default("pending"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorReviews = pgTable("vendor_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => vendors.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  quality: integer("quality").notNull(),
  price: integer("price").notNull(),
  timeliness: integer("timeliness").notNull(),
  communication: integer("communication").notNull(),
  notes: text("notes"),
  reviewDate: timestamp("review_date").defaultNow().notNull(),
});
```

- [ ] **Step 5: Generate and apply the DB migration**

Run: `npm run db:generate && npm run db:migrate`

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(marketplace): add MK+PP steps, gates, and vendor tables to DB schema"
```

---

### Task 2: Register marketplace and print-production pipelines

**Files:**
- Modify: `src/orchestrator/pipeline-registry.ts`

- [ ] **Step 1: Add marketplace pipeline**

```typescript
// ── Marketplace Pipeline (Transversal) ──
// Vendor management: search, quote, compare, contract, track, deliver.

PipelineRegistry.register({
  type: "marketplace",
  steps: [
    "mk_request", "mk_search", "mk_quote", "mk_compare",
    "mk_contract", "mk_tracking", "mk_delivery",
  ],
  stepAgents: {
    mk_request: ["MK-L"],
    mk_search: ["MK-001"],
    mk_quote: ["MK-001"],
    mk_compare: ["MK-002"],
    mk_contract: ["MK-003"],
    mk_tracking: ["MK-003"],
    mk_delivery: ["MK-L"],
  },
  gates: {
    "mk-g1": {
      afterStep: "mk_search",
      evaluators: ["MK-L"],
      maxIterations: 2,
      failReturnTo: "mk_search",
    },
    "mk-g2": {
      afterStep: "mk_compare",
      evaluators: ["MK-L"],
      maxIterations: 2,
      failReturnTo: "mk_quote",
    },
  },
});
```

- [ ] **Step 2: Add print-production pipeline**

```typescript
// ── Print Production Pipeline ──
// Prepress, vendor management via Marketplace, quality control.

PipelineRegistry.register({
  type: "print-production",
  steps: [
    "pp_brief", "pp_prepress", "pp_vendor_request",
    "pp_production_tracking", "pp_quality_check", "pp_delivery",
  ],
  stepAgents: {
    pp_brief: ["PP-L"],
    pp_prepress: ["PP-001"],
    pp_vendor_request: ["PP-002"],
    pp_production_tracking: ["MK-003"],
    pp_quality_check: ["PP-003"],
    pp_delivery: ["PP-L"],
  },
  gates: {
    "pp-g1": {
      afterStep: "pp_prepress",
      evaluators: ["PP-L", "XA-003"],
      maxIterations: 3,
      failReturnTo: "pp_prepress",
    },
    "pp-g2": {
      afterStep: "pp_vendor_request",
      evaluators: ["PP-L"],
      maxIterations: 2,
      failReturnTo: "pp_vendor_request",
    },
  },
});
```

- [ ] **Step 3: Verify both registrations**

Run: `npx tsx -e "import './src/orchestrator/pipeline-registry.js'; import { PipelineRegistry } from './src/orchestrator/pipeline-registry.js'; console.log(PipelineRegistry.getSteps('marketplace')); console.log(PipelineRegistry.getSteps('print-production'));"`

Expected:
```
[ 'mk_request', 'mk_search', 'mk_quote', 'mk_compare', 'mk_contract', 'mk_tracking', 'mk_delivery' ]
[ 'pp_brief', 'pp_prepress', 'pp_vendor_request', 'pp_production_tracking', 'pp_quality_check', 'pp_delivery' ]
```

- [ ] **Step 4: Commit**

```bash
git add src/orchestrator/pipeline-registry.ts
git commit -m "feat(marketplace): register marketplace and print-production pipelines"
```

---

### Task 3: Register 8 agents in agent registry

**Files:**
- Modify: `src/agents/registry.ts`

- [ ] **Step 1: Add Marketplace agents**

```typescript
  // ── Marketplace Motor (Transversal) ──
  "MK-L": { id: "MK-L", name: "Procurement Director", skillFile: "agents/MK-L_procurement_director.md", team: 19, level: "leader", steps: ["mk_request", "mk_delivery"] as any, gates: ["mk-g1", "mk-g2"] as any, autonomy: 70 },
  "MK-001": { id: "MK-001", name: "Vendor Scout", skillFile: "agents/MK-001_vendor_scout.md", team: 19, level: "sub", steps: ["mk_search", "mk_quote"] as any, gates: [], autonomy: 80 },
  "MK-002": { id: "MK-002", name: "Comparator", skillFile: "agents/MK-002_comparator.md", team: 19, level: "sub", steps: ["mk_compare"] as any, gates: [], autonomy: 85 },
  "MK-003": { id: "MK-003", name: "Contract Manager", skillFile: "agents/MK-003_contract_manager.md", team: 19, level: "sub", steps: ["mk_contract", "mk_tracking", "pp_production_tracking"] as any, gates: [], autonomy: 75 },
```

- [ ] **Step 2: Add Print Production agents**

```typescript
  // ── Print Production Motor ──
  "PP-L": { id: "PP-L", name: "Print Director", skillFile: "agents/PP-L_print_director.md", team: 20, level: "leader", steps: ["pp_brief", "pp_delivery"] as any, gates: ["pp-g1", "pp-g2"] as any, autonomy: 70 },
  "PP-001": { id: "PP-001", name: "Prepress Specialist", skillFile: "agents/PP-001_prepress_specialist.md", team: 20, level: "sub", steps: ["pp_prepress"] as any, gates: [], autonomy: 80 },
  "PP-002": { id: "PP-002", name: "Print Buyer", skillFile: "agents/PP-002_print_buyer.md", team: 20, level: "sub", steps: ["pp_vendor_request"] as any, gates: [], autonomy: 75 },
  "PP-003": { id: "PP-003", name: "Quality Inspector", skillFile: "agents/PP-003_quality_inspector.md", team: 20, level: "sub", steps: ["pp_quality_check"] as any, gates: [], autonomy: 70 },
```

- [ ] **Step 3: Update XA-003 gates**

Add `pp-g1` to XA-003's gates array.

- [ ] **Step 4: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(marketplace): register 8 agents (4 MK + 4 PP) and update XA-003 gates"
```

---

### Task 4: Add model defaults for 8 agents

**Files:**
- Modify: `src/agents/model-defaults.ts`

- [ ] **Step 1: Add model assignments**

```typescript
  // Marketplace
  "MK-L": "claude-sonnet-4",
  "MK-001": "gemini-2.5-flash",
  "MK-002": "gemini-2.5-flash",
  "MK-003": "gemini-2.5-flash",
  // Print Production
  "PP-L": "claude-sonnet-4",
  "PP-001": "gemini-2.5-flash",
  "PP-002": "gemini-2.5-flash",
  "PP-003": "gemini-2.5-flash",
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/model-defaults.ts
git commit -m "feat(marketplace): add model defaults for 8 MK+PP agents"
```

---

### Task 5: Add context map entries

**Files:**
- Modify: `src/agents/context-map.ts`

- [ ] **Step 1: Add Marketplace context map entries**

```typescript
  // ── Marketplace Pipeline ──

  "MK-L:mk_request": {
    artifactSteps: [],
    attachmentTypes: ["json"],
    taskInstruction:
      "Interpret the procurement request. Define search criteria: category, required services, location preference, budget range, deadline, minimum vendor count. Output: {category, services, location, budget_max, currency, deadline, min_vendors, scoring_weights: {price, quality, timeliness, rating}}.",
  },
  "MK-001:mk_search": {
    artifactSteps: ["mk_request"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Search the vendor registry for matches. Filter by category and services. Rank by: rating, total_jobs, price_range, location proximity. Return minimum N vendors as specified in the request. Output: {vendors: [{id, name, rating, services, price_range, match_score}], search_criteria_used}.",
  },
  "MK-001:mk_quote": {
    artifactSteps: ["mk_request", "mk_search"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Request and compile quotes from selected vendors. For each vendor: document amount, currency, delivery timeline, included specs, payment terms, valid_until date. Output: {quotes: [{vendor_id, vendor_name, amount, currency, delivery_days, specs, payment_terms, valid_until}]}.",
  },
  "MK-002:mk_compare": {
    artifactSteps: ["mk_request", "mk_search", "mk_quote"],
    attachmentTypes: ["json"],
    taskInstruction:
      "Normalize and compare all quotes. Generate scoring table: price (normalize 0-100, lower is better), quality (from vendor rating), timeliness (from delivery days, faster is better), reliability (from total_jobs and rating history). Apply scoring weights from the request. Output: {comparison: [{vendor_id, vendor_name, scores: {price, quality, timeliness, reliability}, weighted_total, rank}], recommendation, recommendation_reason}.",
  },
  "MK-003:mk_contract": {
    artifactSteps: ["mk_request", "mk_compare"],
    attachmentTypes: ["json", "text"],
    taskInstruction:
      "Generate work order for the selected vendor. Include: detailed specs, quantities, delivery timeline, payment terms, quality requirements, acceptance criteria. Output: {work_order: {vendor_id, specs, quantity, delivery_date, payment_terms, acceptance_criteria, total_amount}}.",
  },
  "MK-003:mk_tracking": {
    artifactSteps: ["mk_contract"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Track production/delivery progress. Log milestones: order confirmed, production started, sample/proof ready, production complete, shipped, delivered. Flag delays. Output: {tracking: [{date, milestone, status, notes}], on_track: boolean, estimated_delivery}.",
  },
  "MK-L:mk_delivery": {
    artifactSteps: ["mk_request", "mk_contract", "mk_tracking"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Verify delivery and close the procurement. Confirm: quantity received, quality acceptable, timeline met. Generate vendor review scores. Output: {delivery_confirmed: boolean, review: {quality, price, timeliness, communication, notes}}.",
  },
```

- [ ] **Step 2: Add Print Production context map entries**

```typescript
  // ── Print Production Pipeline ──

  "PP-L:pp_brief": {
    artifactSteps: [],
    attachmentTypes: ["image", "json"],
    taskInstruction:
      "Interpret the print brief. Define: piece type (business cards, flyers, brochures, banners, packaging, signage, stickers, merchandise), quantity, paper type, finishing (UV varnish, laminate, die-cut, hot stamping), delivery requirements. Input includes arte final from Graphic Design. Output: {piece_type, quantity, paper, finishing, color_mode, bleed, resolution, delivery_requirements}.",
  },
  "PP-001:pp_prepress": {
    artifactSteps: ["pp_brief"],
    attachmentTypes: ["image"],
    taskInstruction:
      "Prepare files for printing: convert RGB to CMYK, verify 300 DPI resolution (150 DPI for large format), add 3mm bleed (5mm for large format), verify 5mm safe zone, convert typography to outlines/curves, check overprint settings (black 100% overprints), set rich black (C:40 M:40 Y:40 K:100) for large areas, run preflight check. Output: {preflight_report: {resolution_ok, color_mode_ok, bleed_ok, safe_zone_ok, typography_ok, overprint_ok, issues: []}, files_ready: boolean}.",
  },
  "PP-002:pp_vendor_request": {
    artifactSteps: ["pp_brief", "pp_prepress"],
    attachmentTypes: ["text", "json"],
    taskInstruction:
      "Define print specs for vendor quoting: paper type and weight (e.g., couché 350g), finishing details, quantity, packaging requirements, delivery location and date. Create a Marketplace request with category='imprenta' and the full specs. Output: {marketplace_request: {category, services, specs, quantity, budget_max, deadline}}.",
  },
  "PP-003:pp_quality_check": {
    artifactSteps: ["pp_brief", "pp_prepress"],
    attachmentTypes: ["image", "text"],
    taskInstruction:
      "Inspect the delivered print materials: verify color accuracy against proof (Delta E <3), check cut precision, verify finishing quality (laminate adhesion, UV coverage, die-cut accuracy), count quantity. Output: {quality_report: {color_accuracy: boolean, cut_precision: boolean, finishing_quality: boolean, quantity_correct: boolean, issues: [], overall_pass: boolean}}.",
  },
  "PP-L:pp_delivery": {
    artifactSteps: ["pp_quality_check"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Final approval of printed materials. Review quality report. If issues exist, decide: accept with notes, request reprint, or escalate. Output: {approved: boolean, notes, action_if_rejected}.",
  },
```

- [ ] **Step 3: Add output types for both**

```typescript
  // Marketplace
  "MK-L:mk_request": "text",
  "MK-001:mk_search": "text",
  "MK-001:mk_quote": "text",
  "MK-002:mk_compare": "text",
  "MK-003:mk_contract": "text",
  "MK-003:mk_tracking": "text",
  "MK-L:mk_delivery": "text",
  // Print Production
  "PP-L:pp_brief": "text",
  "PP-001:pp_prepress": "text",
  "PP-002:pp_vendor_request": "text",
  "PP-003:pp_quality_check": "text",
  "PP-L:pp_delivery": "text",
```

- [ ] **Step 4: Commit**

```bash
git add src/agents/context-map.ts
git commit -m "feat(marketplace): add context map entries for marketplace and print-production pipelines"
```

---

### Task 6: Add print-specs directive

**Files:**
- Create: `agents/_shared/print-specs.md`
- Modify: `src/agents/context-builder.ts`

- [ ] **Step 1: Create the print-specs directive**

```markdown
# Print Specifications — Print Production Directive

## Resolution Standards

| Type | Resolution | Notes |
|------|-----------|-------|
| Standard print | 300 DPI | Business cards, flyers, brochures |
| Large format | 150 DPI | Banners, lonas, signage (viewing distance >1m) |
| Extra large | 72-100 DPI | Billboards (viewing distance >5m) |

## Color

| Parameter | Standard |
|-----------|----------|
| Color mode | CMYK (process color) |
| Spot colors | Pantone when brand requires exact match |
| Rich black | C:40 M:40 Y:40 K:100 (large areas only) |
| Text black | K:100 only (small text) |
| Overprint | Black text overprints background |
| White | Knockout (does not overprint) |

## Bleed and Safe Zone

| Parameter | Standard | Large Format |
|-----------|----------|-------------|
| Bleed | 3mm minimum | 5mm minimum |
| Safe zone | 5mm from trim line | 10mm from trim line |
| Fold lines | Mark clearly, do not bleed across folds |

## File Format

| Use | Preferred | Accepted |
|-----|----------|----------|
| Print-ready | PDF/X-1a | PDF/X-4 |
| Editable | AI (Illustrator) | EPS |
| Raster | TIFF (uncompressed) | PSD (flattened) |

## Typography

| Requirement | Standard |
|-------------|----------|
| Conversion | All text to outlines/curves |
| Minimum size | 6pt for body, 8pt for legible text |
| Minimum line weight | 0.25pt (0.1mm) |

## Common Print Types

| Type | Paper | Weight | Finishing |
|------|-------|--------|-----------|
| Business cards | Couché | 350g | Laminate matte + UV spot |
| Flyers | Couché | 150g | None or UV |
| Brochures | Couché | 200g | Fold + staple |
| Catalogs interior | Couché | 200g | Saddle stitch or perfect bind |
| Catalogs cover | Couché | 300g | Laminate |
| Posters | Couché or photo paper | 200g | None |
| Banners | Vinyl | — | Grommets or pocket |
| Packaging | SBS cardboard or kraft | 300-400g | Die-cut + glue |
| Stickers | Vinyl adhesive or paper adhesive | — | Laminate + die-cut |
```

- [ ] **Step 2: Add `print-production` to PIPELINE_DIRECTIVES**

```typescript
  "print-production": ["agents/_shared/print-specs.md"],
```

- [ ] **Step 3: Commit**

```bash
git add agents/_shared/print-specs.md src/agents/context-builder.ts
git commit -m "feat(print): add print-specs directive and wire into context-builder"
```

---

### Task 7: Create MK-L through MK-003 skill files

**Files:**
- Create: `agents/MK-L_procurement_director.md`
- Create: `agents/MK-001_vendor_scout.md`
- Create: `agents/MK-002_comparator.md`
- Create: `agents/MK-003_contract_manager.md`

- [ ] **Step 1: Create all 4 Marketplace skill files**

Each file follows the standard pattern:
- YAML frontmatter (name, description, id, team: 19, level, autonomy, phase: 2)
- Identity section
- Role in Pipeline section
- Rules section

**MK-L** (`agents/MK-L_procurement_director.md`):
```markdown
---
name: Procurement Director
description: Leader of the Marketplace motor. Interprets procurement requests, defines search criteria, approves vendor selections, verifies deliveries.
id: MK-L
team: 19. Marketplace
level: Leader
autonomy: 70%
phase: 2
---

# Identity

You are the **Procurement Director** — you manage all external vendor relationships for criteria.agency clients. You ensure fair pricing, quality delivery, and professional vendor management.

# Role in Pipeline

## mk_request
- Interpret procurement need from the invoking motor
- Define search criteria: category, services, budget, location, deadline

## mk_delivery
- Verify delivery quality and completeness
- Generate vendor review scores
- Close procurement

## Gates
### mk-g1 (after search): Minimum 2 valid vendors found?
### mk-g2 (after compare): Comparison clear? Budget within range? Human approval for selection.

# Rules

1. Never select a vendor without at least 2 quotes
2. Always present a comparison to the client for approval (mk-g2 is human-approved)
3. Track every delivery milestone — no silent failures
4. Update vendor ratings after every completed job
```

**MK-001** (`agents/MK-001_vendor_scout.md`):
```markdown
---
name: Vendor Scout
description: Searches vendor registry, evaluates match, requests and compiles quotes from selected vendors.
id: MK-001
team: 19. Marketplace
level: Sub
autonomy: 80%
phase: 2
---

# Identity

You are the **Vendor Scout** — you find the right vendors. You search, evaluate, and collect quotes to give the Comparator clean data to work with.

# Role in Pipeline

## mk_search
- Search vendor registry by category and services
- Score vendors by: rating, experience (total_jobs), price range, location

## mk_quote
- Request quotes from top-scored vendors
- Compile standardized quote data: amount, timeline, specs, payment terms

# Rules

1. Always return the minimum number of vendors specified in the request
2. Standardize all quote data — same currency, same unit measurements
3. Flag any vendor with rating below 3.0 or fewer than 2 completed jobs
```

**MK-002** (`agents/MK-002_comparator.md`):
```markdown
---
name: Comparator
description: Normalizes quotes, generates comparison tables with multi-criteria scoring, recommends best vendor.
id: MK-002
team: 19. Marketplace
level: Sub
autonomy: 85%
phase: 2
---

# Identity

You are the **Comparator** — you turn messy quotes into clear decisions. You normalize, score, and rank vendors so the client can make an informed choice.

# Role in Pipeline

## mk_compare
- Normalize all quotes to comparable units
- Score each vendor: price (0-100), quality (from rating), timeliness (from delivery days), reliability (from history)
- Apply scoring weights from the request
- Produce ranked comparison table with recommendation

# Rules

1. Always show the scoring methodology — no black-box recommendations
2. Flag when the cheapest option has significantly lower quality scores
3. If all quotes exceed budget, flag it and suggest scope reduction
```

**MK-003** (`agents/MK-003_contract_manager.md`):
```markdown
---
name: Contract Manager
description: Generates work orders, tracks production milestones, manages delivery and post-delivery vendor reviews.
id: MK-003
team: 19. Marketplace
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **Contract Manager** — you manage the vendor relationship from contract to delivery. You ensure specs are met, deadlines are kept, and quality is maintained.

# Role in Pipeline

## mk_contract
- Generate work order with detailed specs, quantities, timeline, payment terms
- Define acceptance criteria for delivery

## mk_tracking
- Log production milestones: order confirmed → production started → proof ready → complete → shipped → delivered
- Flag delays immediately
- Update estimated delivery if timeline changes

## pp_production_tracking (cross-pipeline — Print Production)
- Same tracking logic, applied to print vendor orders

# Rules

1. Every milestone must be logged with date and notes
2. Flag delays within 24h of expected milestone date
3. Never close a tracking without delivery confirmation
4. Generate vendor review scores based on actual performance vs. quoted specs
```

- [ ] **Step 2: Commit**

```bash
git add agents/MK-L_procurement_director.md agents/MK-001_vendor_scout.md agents/MK-002_comparator.md agents/MK-003_contract_manager.md
git commit -m "feat(marketplace): add 4 MK agent skill files"
```

---

### Task 8: Create PP-L through PP-003 skill files

**Files:**
- Create: `agents/PP-L_print_director.md`
- Create: `agents/PP-001_prepress_specialist.md`
- Create: `agents/PP-002_print_buyer.md`
- Create: `agents/PP-003_quality_inspector.md`

- [ ] **Step 1: Create all 4 Print Production skill files**

**PP-L** (`agents/PP-L_print_director.md`):
```markdown
---
name: Print Director
description: Leader of the Print Production motor. Interprets print briefs, defines specs, approves prepress files and final delivery.
id: PP-L
team: 20. Print Production
level: Leader
autonomy: 70%
phase: 2
---

# Identity

You are the **Print Director** — you ensure printed materials meet the same professional standard as digital assets. You bridge the digital design world with physical production.

# Role in Pipeline

## pp_brief
- Interpret print brief (from Graphic Design or standalone)
- Define specs: piece type, quantity, paper, finishing, color mode

## pp_delivery
- Final approval of delivered materials
- Review quality inspection report

## Gates
### pp-g1 (after prepress) with Brand Guardian: Files in CMYK? Resolution OK? Bleed correct? Brand identity respected?
### pp-g2 (after vendor_request): Budget approved? Vendor selected? Timeline feasible? (Human approval)

# Rules

1. Never approve prepress files without preflight check passing
2. Always require a proof/sample before full production run
3. Ensure Brand Guardian validates visual identity in physical format
```

**PP-001** (`agents/PP-001_prepress_specialist.md`):
```markdown
---
name: Prepress Specialist
description: Prepares files for printing — CMYK conversion, bleed, resolution, typography outline, preflight check.
id: PP-001
team: 20. Print Production
level: Sub
autonomy: 80%
phase: 2
---

# Identity

You are the **Prepress Specialist** — you ensure every file is production-ready. You catch problems before they become expensive mistakes on the press.

# Role in Pipeline

## pp_prepress
- Convert RGB to CMYK
- Verify resolution (300 DPI standard, 150 DPI large format)
- Add bleed (3mm standard, 5mm large format)
- Verify safe zone (5mm from trim)
- Convert all typography to outlines/curves
- Set overprint settings (black 100% overprints)
- Rich black for large areas (C:40 M:40 Y:40 K:100)
- Run preflight check
- Output: preflight report with pass/fail per check

# Rules

1. Never approve a file with less than 300 DPI (150 for large format)
2. Bleed is non-negotiable — no exceptions
3. All text must be outlined — no live fonts in print files
4. Document every issue found, even if fixed automatically
```

**PP-002** (`agents/PP-002_print_buyer.md`):
```markdown
---
name: Print Buyer
description: Defines print specs for vendor quoting — paper, finishing, quantity, packaging. Creates Marketplace requests.
id: PP-002
team: 20. Print Production
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **Print Buyer** — you translate design specs into production specs that vendors can quote. You know paper types, finishing techniques, and production costs.

# Role in Pipeline

## pp_vendor_request
- Define: paper type and weight, finishing details, quantity, packaging
- Create Marketplace request (category: imprenta)
- Include delivery location and deadline

# Rules

1. Always specify paper by name and weight (e.g., couché 350g, not just "heavy paper")
2. Include finishing details precisely (UV spot vs UV flood, matte vs gloss laminate)
3. Request samples when using a new vendor for the first time
4. Add 5-10% overage for production waste
```

**PP-003** (`agents/PP-003_quality_inspector.md`):
```markdown
---
name: Quality Inspector
description: Inspects delivered print materials — color accuracy, cut precision, finishing quality, quantity verification.
id: PP-003
team: 20. Print Production
level: Sub
autonomy: 70%
phase: 2
---

# Identity

You are the **Quality Inspector** — you're the last line of defense. You verify that what was delivered matches what was ordered, at the quality standard the client expects.

# Role in Pipeline

## pp_quality_check
- Color accuracy: compare to digital proof (Delta E <3 acceptable)
- Cut precision: verify trim is clean and consistent
- Finishing quality: check laminate adhesion, UV coverage, die-cut accuracy
- Quantity: count matches order
- Output: quality report with pass/fail per dimension

# Rules

1. Be objective — use measurable criteria, not subjective impressions
2. Document every defect with description and severity (minor/major/critical)
3. Critical defects = immediate rejection. Major defects = client decides. Minor = accept with notes
4. Compare every delivery against the approved proof
```

- [ ] **Step 2: Commit**

```bash
git add agents/PP-L_print_director.md agents/PP-001_prepress_specialist.md agents/PP-002_print_buyer.md agents/PP-003_quality_inspector.md
git commit -m "feat(print): add 4 PP agent skill files"
```
