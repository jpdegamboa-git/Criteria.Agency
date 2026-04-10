# criteria.agency — Ciclo Completo de Desarrollo por Fase

> Guía para entender el flujo de **diseño → implementación → testing → debugging → dogfooding** en cada fase.
> 
> Última actualización: 10 de abril de 2026

---

## PLANTILLA: Estructura de Cada Fase

Cada fase sigue este ciclo:

```
DISEÑO → MÓDULOS → PLAN IMPLEMENTACIÓN → IMPLEMENTACIÓN → TESTING → DEBUGGING → DOGFOODING
```

### **1. DISEÑO (Input: Specs)**
- ¿Qué spec(s) leen?
- ¿Qué DECs son relevantes?
- ¿Qué decisiones arquitectónicas cierran aquí?

### **2. MÓDULOS (Output: Arquitectura)**
- Backend modules (Hono routes, Inngest functions, system functions)
- Database schema (tables, relationships, pgvector)
- AI modules (agents, skills, prompts in registry)
- Frontend modules (if applicable)

### **3. PLAN IMPLEMENTACIÓN (Output: Secuencia)**
- Orden exacto de steps
- Qué depende de qué
- Checkpoints de validación

### **4. IMPLEMENTACIÓN (Código)**
- Code patterns (use Vercel AI SDK, Inngest, Drizzle, etc)
- Where to put code (file structure)
- Config + environment variables

### **5. TESTING (Level 1 + Level 2)**
- **Level 1 (Security):** Write BEFORE implementing. Blocks deploy.
- **Level 2 (Regression):** Write AFTER manual validation passes.
- Critical path tests

### **6. DEBUGGING (When it breaks)**
- What to check first
- Common failure modes per component
- How to introspect (Inngest dashboard, Langfuse, logs)

### **7. DOGFOODING (How to validate it works)**
- Manual test scenario
- What the founder should see
- Success criteria

---

# FASE 0 — Cimientos

## 1. DISEÑO

### Specs a leer
- `2026-04-06-security-framework-design.md` §3.1 (health endpoint), §5 (security headers)
- `2026-04-06-schema-api-design.md` (database schema — verify current decisions)
- `2026-04-06-security-framework-design.md` §4 (auth with Better Auth)
- `2026-04-09-security-audit-v2.md` §2.1 (Inngest security patterns)
- `TECH_ARCHITECTURE.md` §AI Models (Vercel AI SDK patterns)

### DECs críticos
- **DEC-140:** Inngest (no custom state machines)
- **DEC-141:** Vercel AI SDK v6 (generateText + agent patterns)
- **DEC-142:** Better Auth POC (pivot to Clerk if fails)
- **DEC-143, DEC-144:** PostgreSQL + Drizzle + pgvector
- **DEC-145:** Prompt Registry (system prompts NOT hardcoded)
- **DEC-149:** AI Tier enforcement (A/B/C providers)
- **DEC-224, DEC-225, DEC-226:** Testing strategy (Level 1 security before, Level 2 regression after)
- **DEC-228:** Langfuse for LLM observability (not Helicone)

### Decisiones que cierran
- Monorepo vs single package (decide in Step 0.1)
- Neon vs Supabase vs local PostgreSQL (DEC-143, decide in Step 0.2)
- Better Auth stays or Clerk pivot (risk checkpoint in Step 0.3)

---

## 2. MÓDULOS

### Backend
```
src/
├── api/
│   ├── health.ts           # GET /health with security headers
│   ├── auth.ts             # Better Auth routes
│   ├── tenants.ts          # Tenant management
│   └── prompts.ts          # Prompt Registry CRUD
│
├── db/
│   ├── index.ts            # Drizzle client + connection
│   ├── schema/
│   │   ├── auth.ts         # Better Auth tables (auto-managed)
│   │   ├── organizations.ts # Orgs, members, roles
│   │   ├── motors.ts       # Motor config
│   │   ├── prompt_registry.ts # Prompts with tier enforcement
│   │   └── output_registry.ts # Outputs with pgvector
│   └── migrations/         # Drizzle migration files
│
├── inngest/
│   ├── client.ts           # Inngest client (Vercel)
│   ├── functions/
│   │   └── example.ts      # First function: validate → verify tenant → success
│   └── handler.ts          # Serve handler on Hono
│
├── ai/
│   ├── llm.ts              # Vercel AI SDK wrapper (generateText + agent)
│   ├── langfuse.ts         # Langfuse proxy configuration
│   └── prompt-loader.ts    # Load system prompts from DB
│
├── middleware/
│   ├── auth.ts             # Extract tenantId from session
│   ├── tenant-isolation.ts # Filter all queries by tenantId
│   └── security-headers.ts # HSTS, CSP, X-Frame-Options
│
└── lib/
    ├── logging.ts          # JSON structured logging
    └── errors.ts           # Error types + handling
```

### Database Schema (Drizzle)
```typescript
// Better Auth manages: user, session, account, organization, member tables

// Custom tables:
- organizations (orgId, name, createdAt)
- motors (motorId, orgId, name, enabled, config)
- agentPermissions (userId, motorId, skillId, canRead, canWrite)
- prompt_registry (promptId, agentName, skillName, modelAssignment, systemPrompt, data_sensitivity, approved_providers)
- output_registry (outputId, orgId, tenantId, content_type, summary_embedding (pgvector), metadata, createdAt)
```

### AI Modules (Vercel AI SDK v6)
```typescript
// Pattern 1: generateText() — simple classification, summaries
await generateText({
  model: anthropic("claude-3-5-haiku-20241022"),
  prompt: "Classify...",
  system: systemPromptFromRegistry,
});

// Pattern 2: Agent with tools — complex orchestration
const agent = createAgent({
  model: anthropic("claude-3-5-sonnet-20241022"),
  tools: [readBrandDNA, updateBrandDNA, askClient],
  system: systemPromptFromRegistry,
});
```

### Langfuse Integration
```typescript
// Wrapper that intercepts Vercel AI SDK calls
const wrappedLLMCall = async (params) => {
  const trace = langfuse.trace({
    name: "agent-invocation",
    metadata: {
      agent_id: "brand-strategist",
      tenant_id: orgId,
      skill_id: "discovery",
    },
  });
  
  const result = await llmCall(params);
  
  trace.observation({
    name: "tokens-used",
    output: { tokens: result.usage },
  });
  
  return result;
};
```

---

## 3. PLAN IMPLEMENTACIÓN

### Step 0.1: Project Scaffold + Hono + Vitest
**Orden exacto:**
1. `npm init` — TypeScript + tsconfig
2. Install Hono: `npm install hono`
3. Install Vitest: `npm install -D vitest @vitest/ui`
4. Create `src/index.ts` — Hono server
5. Create `GET /health` endpoint
6. Add security headers middleware
7. Add structured JSON logging (winston or pino)
8. Write test: health endpoint returns 200 + security headers

**Checkpoint:** `npm run dev` starts server, `GET /health` returns 200 with headers.

### Step 0.2: Database + Drizzle
**Orden exacto:**
1. Choose database (Neon / Supabase / local) — update `.env`
2. Install Drizzle: `npm install drizzle-orm postgres pg`
3. Create `src/db/index.ts` — Drizzle client
4. Create schema files (auth, organizations, motors, prompt_registry, output_registry)
5. Create first migration
6. Run migration: `npm run db:push`
7. Verify tables exist + pgvector extension enabled
8. Write tests: can connect, tables exist, pgvector works

**Checkpoint:** `psql` shows all tables. `SELECT * FROM information_schema.tables;` lists new tables.

### Step 0.3: Better Auth POC
**Orden exacto:**
1. Install Better Auth: `npm install better-auth`
2. Create `src/auth/config.ts` — Better Auth config with Hono
3. Create test org + test user via CLI or API
4. Create `POST /auth/signin` endpoint
5. Test: can create org, can create user, can sign in, session has orgId
6. Validate: HTTP-only cookies work, multi-org isolation enforced
7. **If fails:** Note pivot to Clerk (updates all auth code + cost model)

**Checkpoint:** `curl -X POST http://localhost:3000/auth/signin` returns session cookie with orgId.

### Step 0.4: Auth Middleware + Tenant Isolation
**Orden exacto:**
1. Create `src/middleware/auth.ts` — extract tenantId from session, inject into request context
2. Create `src/middleware/tenant-isolation.ts` — Drizzle wrapper that filters by tenantId
3. Create protected route pattern (all routes except `/health`, `/auth/*`)
4. Write Level 1 security tests BEFORE implementing:
   - Unauthenticated request → 401
   - Authenticated as org A, query org B data → empty result
   - Create resource as org A → stored with tenantId=A
5. Implement the code
6. Run Level 1 tests
7. Convert manual validations to Level 2 automated tests

**Checkpoint:** Level 1 tests pass. Curl to protected route without session → 401.

### Step 0.5: First Tenant + Seed Data
**Orden exacto:**
1. Create test organization (via Better Auth API or direct DB insert)
2. Create test user with owner role
3. Seed one motor: `INSERT INTO motors VALUES (orgId, 'web-motor', true)`
4. Verify: can authenticate as test user, session.orgId matches

**Checkpoint:** Login endpoint returns session with correct orgId.

### Step 0.6: Inngest Setup
**Orden exacto:**
1. Install Inngest: `npm install inngest`
2. Create `src/inngest/client.ts` — Inngest client config
3. Create `src/inngest/handler.ts` — serve handler on Hono
4. Create first function: `src/inngest/functions/example.ts`
   - Receives event
   - Validates Zod schema
   - Verifies tenantId exists in DB
   - Returns success
5. Write Level 1 security tests BEFORE:
   - Invalid Zod schema → rejected
   - Nonexistent tenantId → rejected
6. Install Inngest CLI + start Dev Server: `inngest dev`
7. Test: send event, see execution in dashboard

**Checkpoint:** Inngest Dev Server shows function registered. Test event executes successfully.

### Step 0.7: Vercel AI SDK v6 + Langfuse
**Orden exacto:**
1. Install Vercel AI SDK: `npm install ai`
2. Create `src/ai/llm.ts` — Vercel AI SDK wrapper
3. Implement Pattern 1: `generateText()` — test with Haiku classification task
4. Implement Pattern 2: agent with tools — test with Sonnet + one tool
5. Install Langfuse: `npm install langfuse`
6. Create `src/ai/langfuse.ts` — Langfuse proxy
7. Wrap both patterns to log to Langfuse
8. Configure metadata: agent_id, tenant_id, skill_id
9. Test: both patterns work, Langfuse dashboard shows calls

**Checkpoint:** Langfuse dashboard shows LLM calls with tokens, cost, latency, metadata.

### Step 0.8: Prompt Registry
**Orden exacto:**
1. Create Drizzle schema for `prompt_registry`
2. Create CRUD endpoints: `POST /api/prompts`, `GET /api/prompts/:id`, `PUT`, `DELETE`
3. Add security fields: `data_sensitivity` (A/B/C), `approved_providers` (array)
4. Seed first prompt: Brand Strategist, Discovery skill, Sonnet, Tier A
5. Write Level 1 security test BEFORE:
   - Tier A prompt + attempt with Tier B provider → blocked
6. Create `src/ai/prompt-loader.ts` — loads prompt from DB before LLM invocation
7. Test: change prompt in DB → next invocation uses new prompt without redeploy

**Checkpoint:** CRUD endpoints work. Prompt loaded from DB, not hardcoded. Tier enforcement enforced.

### Step 0.9: End-to-end Integration Test
**Orden exacto:**
1. Write comprehensive test scenario:
   - API request (authenticated as test org)
   - Dispatches Inngest event
   - Inngest function validates schema + verifies tenantId
   - Loads prompt from registry
   - Invokes LLM via Vercel AI SDK
   - Langfuse logs the call
   - Result saved to PostgreSQL with tenantId isolation
2. Run test end-to-end
3. Verify:
   - Inngest dashboard shows execution with steps
   - Langfuse shows the LLM call
   - PostgreSQL has new row with correct tenantId
   - All Level 1 + Level 2 tests pass
4. Convert all manual validations from 0.1-0.8 into automated Level 2 regression suite

**Checkpoint:** Full loop works. All tests pass (130/130 target). Infrastructure validated.

---

## 4. IMPLEMENTACIÓN

### File Structure
```
project-root/
├── .env                    # DATABASE_URL, ANTHROPIC_API_KEY, LANGFUSE_*, INNGEST_*
├── src/
│   ├── index.ts           # Hono app entry
│   ├── api/               # HTTP endpoints
│   ├── db/                # Drizzle schema + migrations
│   ├── inngest/           # Inngest functions + handler
│   ├── ai/                # Vercel AI SDK wrapper + Langfuse
│   ├── middleware/        # Auth, tenant isolation, security headers
│   └── lib/               # Utilities (logging, errors)
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # End-to-end tests
│   └── security/          # Level 1 security tests
├── vitest.config.ts       # Vitest configuration
└── package.json
```

### Key Env Vars
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/criteria

# LLM
ANTHROPIC_API_KEY=sk-ant-...

# Observability
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...

# Inngest
INNGEST_SIGNING_KEY=signkey_...
INNGEST_API_KEY=...

# Better Auth
BETTER_AUTH_SECRET=...
```

### Code Patterns

#### Pattern: Tenant Isolation
```typescript
// ❌ WRONG: query without tenant filter
const orgs = await db.select().from(organizations);

// ✅ RIGHT: always include tenantId
const orgs = await db
  .select()
  .from(organizations)
  .where(eq(organizations.tenantId, req.tenantId));
```

#### Pattern: Inngest Function Security
```typescript
export const exampleFunction = inngest.createFunction(
  { id: "example-function" },
  { event: "example.triggered" },
  async ({ event, step }) => {
    // Step 1: Validate schema
    const validated = exampleEventSchema.parse(event);
    
    // Step 2: Verify tenantId exists in DB
    const tenant = await step.run("verify-tenant", async () => {
      return await db.query.organizations.findFirst({
        where: eq(organizations.id, validated.tenantId),
      });
    });
    
    if (!tenant) throw new Error("Tenant not found");
    
    // Step 3: Proceed
    return { success: true };
  }
);
```

#### Pattern: Vercel AI SDK + Langfuse
```typescript
const result = await generateText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  system: await loadSystemPrompt("brand-strategist", "discovery"),
  prompt: userInput,
  onFinish: ({ usage }) => {
    langfuse.observation({
      name: "ai-invocation",
      metadata: {
        agent: "brand-strategist",
        tokens: usage.totalTokens,
        cost: (usage.totalTokens / 1000) * 0.003, // example
      },
    });
  },
});
```

---

## 5. TESTING

### Level 1 (Security — Write BEFORE Implementing)

```typescript
// tests/security/tenant-isolation.test.ts
describe("Tenant Isolation", () => {
  test("Unauthenticated request to protected route → 401", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(401);
  });

  test("Authenticated as org A, query org B data → empty result", async () => {
    const sessionA = await signIn(orgA);
    const resB = await request(app)
      .get("/api/projects")
      .set("Cookie", sessionA);
    // Projects in DB belong to orgB, but query is tenantId=A
    expect(resB.body).toEqual([]);
  });

  test("Create resource as org A → stored with tenantId=A", async () => {
    const session = await signIn(orgA);
    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", session)
      .send({ name: "My Project" });
    
    const saved = await db.query.projects.findFirst({
      where: eq(projects.id, res.body.id),
    });
    expect(saved.tenantId).toBe(orgA.id);
  });
});
```

### Level 2 (Regression — Write AFTER Manual Validation)

```typescript
// tests/integration/phase0.test.ts
describe("Phase 0 — Infrastructure E2E", () => {
  test("Full loop: API → Inngest → LLM → DB", async () => {
    const org = await createTestOrg();
    
    const response = await request(app)
      .post("/api/example-trigger")
      .set("Cookie", await signIn(org))
      .send({ prompt: "test" });

    expect(response.status).toBe(200);

    // Wait for Inngest function to execute
    await waitForInngestExecution(2000);

    // Verify DB has result
    const result = await db.query.exampleResults.findFirst({
      where: eq(exampleResults.orgId, org.id),
    });
    expect(result).toBeDefined();
    expect(result.output).toContain("expected");

    // Verify Langfuse logged call
    const trace = await langfuse.fetchTrace(result.traceId);
    expect(trace.tokens).toBeGreaterThan(0);
  });
});
```

### Critical Paths
- Health endpoint security headers
- Tenant isolation (cross-tenant access blocked)
- Inngest event schema validation
- Vercel AI SDK invocation (both patterns)
- Prompt registry tier enforcement
- End-to-end loop

---

## 6. DEBUGGING

### When Something Breaks

#### "Health endpoint returns 500"
```bash
# Check 1: Is server running?
curl http://localhost:3000/health

# Check 2: Are security headers present?
curl -i http://localhost:3000/health | grep -i "strict-transport"

# Check 3: Logs
tail -f logs/app.log | grep ERROR
```

#### "Tenant isolation test fails"
```bash
# Check 1: Is tenantId in request context?
console.log(req.tenantId); // Add debug log

# Check 2: Is Drizzle filtering?
console.log(sql.toString()); // Log generated SQL

# Check 3: Is data isolated in DB?
SELECT * FROM organizations WHERE id = 'orgA_id';
SELECT * FROM organizations WHERE id = 'orgB_id';
```

#### "Inngest function doesn't execute"
```bash
# Check 1: Is Inngest Dev Server running?
inngest dev

# Check 2: Look at Inngest dashboard
http://localhost:8288

# Check 3: Is event schema valid?
console.log(JSON.stringify(event)); // See what's being sent

# Check 4: Is tenantId verification passing?
SELECT * FROM organizations WHERE id = event.tenantId;
```

#### "LLM call costs money but doesn't work"
```bash
# Check 1: Is API key correct?
echo $ANTHROPIC_API_KEY # Should be set

# Check 2: Do you have credits?
https://console.anthropic.com/settings/billing

# Check 3: Is Langfuse intercepting?
http://localhost:3000/traces # Langfuse dashboard (if local)

# Check 4: Is prompt loading from DB?
SELECT * FROM prompt_registry WHERE agent_name = 'brand-strategist';
```

### Inngest Dashboard (localhost:8288)
- See all function executions
- Click on execution → see steps + inputs/outputs
- Inspect tenantId verification step

### Langfuse Dashboard
- See all LLM calls
- Tokens, cost, latency, metadata
- Filter by agent_id, tenant_id

### PostgreSQL Inspection
```sql
-- Check schema
\dt
\d organizations

-- Check tenant isolation
SELECT COUNT(*) FROM motors WHERE org_id = 'test-org-a';
SELECT * FROM prompt_registry WHERE data_sensitivity = 'A';

-- Check pgvector
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

## 7. DOGFOODING

### Manual Test Scenario (What the Founder Does)

**Goal:** Verify "request → Inngest → LLM → DB" loop works end-to-end.

**Steps:**
1. Start local server: `npm run dev`
2. Start Inngest Dev Server: `inngest dev` (in another terminal)
3. Open http://localhost:3000/health → see 200 + security headers
4. Make authenticated request:
   ```bash
   curl -X POST http://localhost:3000/api/trigger-example \
     -H "Authorization: Bearer $SESSION_TOKEN" \
     -d '{"prompt": "classify this text"}'
   ```
5. Check Inngest dashboard (http://localhost:8288):
   - See function execution
   - Verify tenantId step passed
   - Verify LLM invocation step
6. Check Langfuse dashboard:
   - See LLM call with tokens, cost
   - Verify metadata (agent_id, tenant_id)
7. Check PostgreSQL:
   ```sql
   SELECT * FROM output_registry WHERE tenant_id = 'your-org-id' ORDER BY created_at DESC LIMIT 1;
   ```
8. Verify result is there + tenant isolation is correct

### Success Criteria
- ✅ Health endpoint returns 200 with security headers
- ✅ Can authenticate + get session with orgId
- ✅ Can trigger endpoint (returns 202 or 200)
- ✅ Inngest dashboard shows function execution
- ✅ Inngest shows tenantId verification passed
- ✅ Langfuse shows LLM call with cost
- ✅ PostgreSQL has result with correct tenantId
- ✅ Can't access data from another org
- ✅ All tests pass (unit + integration + security)

### Common Dogfooding Issues

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| "500 on health endpoint" | Security headers middleware not applied | Verify middleware order in Hono |
| "Inngest function doesn't run" | Inngest Dev Server not running | `inngest dev` in terminal 2 |
| "tenantId verification fails" | Session doesn't have orgId | Check Better Auth session serialization |
| "LLM call costs money but no result" | No ANTHROPIC_API_KEY | `export ANTHROPIC_API_KEY=...` |
| "Cross-tenant data visible" | Drizzle not filtering by tenantId | Add `.where(eq(...tenantId...))` to query |

---

---

# FASE 1 — Brand Builder

## 1. DISEÑO

### Specs a leer
- `2026-04-08-brand-builder-motor-design.md` (full spec — READ THIS FIRST)

### DECs críticos
- **DEC-076:** Layer 0 onboarding automático (no LLM)
- **DEC-077:** Sufficiency threshold gates (evaluate but don't hard-block)
- **DEC-078:** Brand Guardian function (minimal gate, generateText pattern)
- **DEC-081:** Layer 2 coherence gate (can block)
- **DEC-084:** Versioning (undo, not history)
- **DEC-149:** Tier A enforcement (Brand Strategist = Anthropic only)
- **DEC-173:** Brand Guardian as validation function

### Decisiones que cierran
- Layer 0 onboarding logic (URL scraping vs 3-question template)
- Brand DNA version strategy (snapshot on each layer transition)
- Coherence detection algorithm (3 specific contradiction types)

---

## 2. MÓDULOS

### Backend
```
src/
├── brand-builder/
│   ├── models.ts           # Brand DNA, artifact data types
│   ├── schema.ts           # Drizzle schema (brand_dna, brand_dna_artifacts)
│   ├── layer0.ts           # Onboarding system function
│   ├── layer1.ts           # Discovery skill + agent
│   ├── layer2.ts           # Positioning + Archetype skills + coherence gate
│   ├── layer3.ts           # Identity Systems skill + Brand Guardian gate
│   ├── score.ts            # Brand Health Score: Fundamentos axis
│   └── routes.ts           # API endpoints (GET/POST brand DNA, start layer, etc)
│
└── inngest/
    └── functions/
        ├── brand-builder/onboarding.started.ts
        ├── brand-builder/layer1.started.ts
        ├── brand-builder/layer2.started.ts
        └── brand-builder/layer3.started.ts
```

### Database Schema
```typescript
// brand_dna table
- dnaId (primary key)
- tenantId (foreign key)
- layer (0, 1, 2, or 3 — current state)
- fundamentos_score (15-95)
- created_at
- updated_at

// brand_dna_artifacts table
- artifactId
- dnaId (foreign key)
- layer (0, 1, 2, or 3 — which layer produced this)
- type (manifesto, positioning, archetype, visual_system, etc)
- content (JSON)
- status (draft, pending_validation, approved)
- created_at
- updated_at
- version_context (which iteration produced this, for undo)
```

### AI Modules
```
Agents:
- Brand Strategist (Claude Sonnet, Tier A, DEC-149)

Skills:
- Discovery (Layer 1) → reads Layer 0 Brand DNA → asks client Qs → produces Layer 1 artifacts
- Positioning (Layer 2) → M1-M6 framework
- Archetype & Voice (Layer 2) → brand archetype + tone per channel
- Identity Systems (Layer 3) → brand book, visual system, tone guide

System Functions:
- Layer 0 onboarding (Path A: scraper, Path B: 3 questions)
- Brand Guardian evaluation (Layer 3 gate)
- Fundamentos score calculation
```

---

## 3. PLAN IMPLEMENTACIÓN

### Step 1.1: Brand DNA Data Model
1. Create `brand_dna` table (layer, scores, versioning fields)
2. Create `brand_dna_artifacts` table (content, type, layer, status)
3. Create Drizzle migrations
4. Create TypeScript types that match schema
5. Write tests: can create, read, update Brand DNA with versioning

### Step 1.2: Layer 0 Onboarding
1. Implement Path A (URL scraper):
   - Take website URL → scrape text/metadata → extract brand signals
   - Map signals to Brand DNA template (15-20 fields)
2. Implement Path B (3 questions):
   - Simple form: name + mission + target audience
   - Map to same template
3. Create Inngest function `brand-builder/onboarding.started`
4. Register prompts in `prompt_registry` for signal extraction (Haiku, Tier B OK here)
5. Write tests: Path A produces Layer 0 Brand DNA, Path B produces Layer 0

### Step 1.3: Brand Health Score: Fundamentos
1. Implement scoring algorithm:
   - Layer 0 = ~15-20
   - Layer 1 = ~40-50
   - Layer 2 = ~65-75
   - Layer 3 = ~85-95
2. Create system function that recalculates on Brand DNA changes
3. Add trigger: brand_dna_artifacts updated → recalc score
4. Write tests: verify score ranges per layer

### Step 1.4: Brand Strategist Discovery Skill
1. Register Brand Strategist in `prompt_registry` (Sonnet, Tier A)
2. Register Discovery skill (system prompt for Layer 1)
3. Implement agent with tools:
   - Tool 1: read Brand DNA (Layer 0)
   - Tool 2: update Brand DNA artifact
   - Tool 3: ask client question
   - Tool 4: evaluate sufficiency
4. Create Inngest function `brand-builder/layer1.started`
5. Implement gate 0→1: coverage check (simple system function)
6. Write tests: agent produces Layer 1 artifacts (manifesto, positioning initial, etc)

### Step 1.5: 3+3 Rule for Brand Builder
1. Add `iteration_count` to Brand DNA context
2. Track attempts per layer transition
3. On gate failure: increment counter, dispatch step.sendEvent() with updated instructions
4. After attempt 3: trigger "leader adjustment" (modify Brand Strategist instructions)
5. After attempt 6: human escalation (stop, notify founder)
6. Write tests: force gate failure → verify iteration counter + retry with adjusted instructions

### Step 1.6-1.7: Layer 2 Skills + Coherence Gate
1. Register Positioning skill (M1-M6 framework, Sonnet, Tier A)
2. Register Archetype & Voice skill (Sonnet, Tier A)
3. Create Inngest function `brand-builder/layer2.started`
4. Implement coherence gate (system function, can block):
   - Detect 3 types of contradictions:
     - Positioning vs audience
     - Archetype vs voice
     - Visual direction vs personality
5. Write tests: intentional contradictions → gate blocks → fix → gate passes

### Step 1.8-1.9: Layer 3 + Brand Guardian Gate
1. Register Identity Systems skill (Sonnet, Tier A)
2. Create Inngest function `brand-builder/layer3.started`
3. Implement Brand Guardian gate (generateText pattern):
   - Evaluate specificity (brand book detailed enough? tone guide has examples?)
   - If insufficient → 3+3 rule applies
4. Seed Brand Guardian system prompt in registry
5. Write tests: vague Layer 3 → gate rejects → specific Layer 3 → gate passes

### Step 1.10: End-to-end Integration Test
1. Simulate full journey: L0 → L1 → L2 coherence gate → L3 Brand Guardian → complete
2. Verify all gates, all scores, all artifacts stored + versioned
3. Verify tenant isolation
4. Write comprehensive test suite (130+ tests target)

---

## 4. IMPLEMENTACIÓN

### Code Example: Inngest Function (Layer 1)

```typescript
// src/inngest/functions/brand-builder/layer1.started.ts
export const layer1Started = inngest.createFunction(
  { id: "brand-builder.layer1.started" },
  { event: "brand-builder/layer1.started" },
  async ({ event, step }) => {
    // Step 1: Validate + verify tenant
    const validated = layer1EventSchema.parse(event);
    const org = await step.run("verify-org", async () => {
      return await verifyTenant(validated.tenantId);
    });

    // Step 2: Load Brand DNA (Layer 0)
    const brandDNA = await step.run("load-layer0", async () => {
      return await db.query.brandDna.findFirst({
        where: eq(brandDna.dnaId, validated.dnaId),
      });
    });

    // Step 3: Load Brand Strategist prompt from registry
    const prompt = await step.run("load-prompt", async () => {
      return await loadSystemPrompt(
        "brand-strategist",
        "discovery",
        validated.tenantId
      );
    });

    // Step 4: Invoke Brand Strategist agent (attempt 1-6)
    const attempt = validated.attempt || 1;
    const instructions =
      attempt <= 3
        ? prompt
        : prompt + "\n[LEADER ADJUSTMENT - Attempt " + attempt + "]";

    const agentResponse = await step.run(
      `agent-invocation-attempt-${attempt}`,
      async () => {
        return await brandStrategistAgent({
          system: instructions,
          context: {
            brandDNA,
            tenantId: validated.tenantId,
          },
        });
      }
    );

    // Step 5: Gate 0→1
    const gateResult = await step.run("gate-0-to-1", async () => {
      return await evaluateCoverageGate(agentResponse);
    });

    if (!gateResult.pass) {
      if (attempt < 6) {
        // Retry with updated instructions
        await step.sendEvent("retry", {
          name: "brand-builder/layer1.started",
          data: { ...validated, attempt: attempt + 1 },
        });
        return { status: "retry", attempt: attempt + 1 };
      } else {
        // Escalate
        return { status: "escalated", attempt };
      }
    }

    // Step 6: Save artifacts
    await step.run("save-artifacts", async () => {
      for (const artifact of agentResponse.artifacts) {
        await db.insert(brandDnaArtifacts).values({
          dnaId: validated.dnaId,
          layer: 1,
          type: artifact.type,
          content: artifact.content,
          status: "draft",
        });
      }
    });

    // Step 7: Recalc score + advance layer
    await step.run("update-score", async () => {
      const score = calculateFundamentosScore(1);
      await db.update(brandDna)
        .set({ layer: 1, fundamentos_score: score })
        .where(eq(brandDna.dnaId, validated.dnaId));
    });

    return { status: "complete", layer: 1, attempt };
  }
);
```

### Code Example: Brand Guardian Gate (System Function)

```typescript
// src/brand-builder/brand-guardian.ts
export async function evaluateLayer3Gate(artifacts: Artifact[]): Promise<{ pass: boolean; feedback: string }> {
  const evaluationPrompt = `
    Evaluate these Layer 3 Brand DNA artifacts for specificity:
    1. Brand book — is it detailed enough for consistent output?
    2. Tone guide — does it have concrete examples per channel?
    3. Visual system — does it cover all formats needed?
    
    Artifacts: ${JSON.stringify(artifacts)}
    
    Respond with JSON: { "pass": boolean, "feedback": string }
  `;

  const result = await generateText({
    model: anthropic("claude-3-5-haiku-20241022"),
    system: await loadSystemPrompt("brand-guardian", "layer3-gate"),
    prompt: evaluationPrompt,
  });

  return JSON.parse(result.text);
}
```

---

## 5. TESTING

### Level 1 (Security — Write BEFORE)

```typescript
// tests/security/brand-builder-isolation.test.ts
describe("Brand Builder — Tenant Isolation", () => {
  test("Org A cannot read Org B's Brand DNA", async () => {
    const dnaA = await createBrandDNA(orgA);
    const sessionB = await signIn(orgB);

    const res = await request(app)
      .get(`/api/brand-dna/${dnaA.id}`)
      .set("Cookie", sessionB);

    expect(res.status).toBe(404); // or 403
  });

  test("Create artifact as Org A → stored with tenantId=A", async () => {
    const session = await signIn(orgA);
    const dna = await createBrandDNA(orgA);

    const res = await request(app)
      .post(`/api/brand-dna/${dna.id}/artifacts`)
      .set("Cookie", session)
      .send({ type: "manifesto", content: "..." });

    const saved = await db.query.brandDnaArtifacts.findFirst({
      where: eq(brandDnaArtifacts.id, res.body.id),
    });
    
    // Verify tenantId path
    const parentDNA = await db.query.brandDna.findFirst({
      where: eq(brandDna.dnaId, saved.dnaId),
    });
    expect(parentDNA.tenantId).toBe(orgA.id);
  });
});
```

### Level 2 (Regression — Write AFTER)

```typescript
// tests/integration/brand-builder-pipeline.test.ts
describe("Brand Builder — Layer 0 → Layer 3", () => {
  test("Full journey: L0 → L1 → L2 coherence → L3 Brand Guardian", async () => {
    const org = await createTestOrg();
    const session = await signIn(org);

    // Start Layer 0
    const res0 = await request(app)
      .post("/api/brand-dna/start")
      .set("Cookie", session)
      .send({ pathType: "from-scratch", answers: ["ans1", "ans2", "ans3"] });

    const dnaId = res0.body.dnaId;

    // Trigger Layer 1
    await request(app)
      .post(`/api/brand-dna/${dnaId}/layer1`)
      .set("Cookie", session);

    await waitForInngest(3000); // Wait for function

    // Verify L1 artifacts created
    const l1Artifacts = await db.query.brandDnaArtifacts.findMany({
      where: and(
        eq(brandDnaArtifacts.dnaId, dnaId),
        eq(brandDnaArtifacts.layer, 1)
      ),
    });
    expect(l1Artifacts.length).toBeGreaterThan(0);

    // Trigger Layer 2
    await request(app)
      .post(`/api/brand-dna/${dnaId}/layer2`)
      .set("Cookie", session);

    await waitForInngest(3000);

    // Trigger Layer 3 + Brand Guardian
    await request(app)
      .post(`/api/brand-dna/${dnaId}/layer3`)
      .set("Cookie", session);

    await waitForInngest(3000);

    // Verify final score
    const finalDNA = await db.query.brandDna.findFirst({
      where: eq(brandDna.dnaId, dnaId),
    });
    expect(finalDNA.layer).toBe(3);
    expect(finalDNA.fundamentos_score).toBeGreaterThanOrEqual(85);
  });

  test("Layer 2 coherence gate blocks contradictory artifacts", async () => {
    // Create intentionally contradictory L2 artifacts
    // Trigger gate → should reject
    // Fix contradiction → gate passes
  });

  test("3+3 rule: 3 attempts → leader adjustment → auto-retry", async () => {
    // Force a gate failure
    // Verify retry counter increments
    // After attempt 3, verify leader adjustment in instructions
  });
});
```

---

## 6. DEBUGGING

### When Brand DNA doesn't advance

```bash
# Check 1: Inngest function executing?
http://localhost:8288 → look for function execution

# Check 2: Agent returning valid response?
Look at Inngest step output → see agent response

# Check 3: Gate evaluation passing?
In Inngest step output → see gate result

# Check 4: Artifacts saving to DB?
SELECT * FROM brand_dna_artifacts WHERE dna_id = 'xxx' ORDER BY created_at DESC;

# Check 5: Score calculation correct?
SELECT fundamentos_score, layer FROM brand_dna WHERE dna_id = 'xxx';
```

### When Brand Guardian gate blocks everything

```bash
# Check 1: Is Brand Guardian prompt loaded correctly?
SELECT * FROM prompt_registry WHERE agent_name = 'brand-guardian';

# Check 2: Are artifacts specific enough?
Look at artifact content → is it vague or detailed?

# Check 3: Is Haiku understanding the evaluation prompt?
# Log the evaluation prompt + response

# Check 4: 3+3 rule triggering?
Check iteration_count → verify auto-retry with adjustment
```

### LLM Cost Spike

```bash
# Check Langfuse dashboard
Each Brand Strategist invocation should show token usage

# If cost too high:
- Are you using Sonnet for everything? (Should be Sonnet for L1-L3, Haiku for gates)
- Are agents invoking themselves in loops? (Check Inngest function logs)
```

---

## 7. DOGFOODING

### Manual Test Scenario

**Goal:** Walk through a complete Brand DNA journey (L0 → L3).

**Steps:**
1. Start server + Inngest Dev Server
2. Create test organization
3. Visit `/brand-builder/start` (or call API):
   ```bash
   curl -X POST http://localhost:3000/api/brand-dna/start \
     -H "Cookie: $SESSION" \
     -d '{"pathType": "from-scratch", "answers": ["We are a design agency", "Small LATAM businesses", "Modern design"]}'
   ```
4. Wait for Layer 0 to complete (should be instant — no LLM)
5. Verify Brand DNA created with ~15-20 Fundamentos score
6. Trigger Layer 1:
   ```bash
   curl -X POST http://localhost:3000/api/brand-dna/XXX/layer1 \
     -H "Cookie: $SESSION"
   ```
7. Watch Inngest dashboard:
   - See function execution
   - See "load-layer0" step
   - See "agent-invocation-attempt-1" step
   - See "gate-0-to-1" step
   - See "save-artifacts" step
8. In Langfuse, see Brand Strategist token usage
9. Verify Layer 1 artifacts in database
10. Repeat for Layer 2, Layer 3
11. Final Brand DNA should have ~85-95 Fundamentos score + 4 layer worth of artifacts

### Success Criteria
- ✅ Layer 0 creates instantly (no LLM call)
- ✅ Layer 0 has 15-20 score
- ✅ Layer 1-3 each create artifacts via Brand Strategist agent
- ✅ Gates evaluate correctly (pass/fail/retry)
- ✅ 3+3 rule triggers on gate failure
- ✅ Score increases with each layer
- ✅ All artifacts versioned (can undo)
- ✅ Tenant isolation enforced throughout

---

---

# FASE 2 — Web Motor

## 1. DISEÑO

### Specs a leer
- `2026-04-09-web-motor-design.md` (full spec)

### DECs críticos
- **DEC-222:** Web Motor before Video Motor (validates orchestration patterns)
- **DEC-187:** Designer uses Sonnet (not Opus)
- **DEC-219:** Web Developer as transversal agent
- **DEC-223:** Gate evaluation patterns (CD + Brand Guardian parallel)
- **DEC-130:** Output Registry indexing

---

## 2. MÓDULOS

### Backend
```
src/
├── web-motor/
│   ├── models.ts           # Project, page, artifact types
│   ├── schema.ts           # Drizzle schema
│   ├── agents/
│   │   ├── creative-director.ts  # Opus, Web Direction skill
│   │   ├── writer.ts             # Sonnet, Web Copy + Blog Post skills
│   │   ├── designer.ts           # Sonnet, Web Design skill
│   │   └── developer.ts          # Sonnet, 3 skills: static/cms/microsite
│   ├── gates.ts            # G1, G2, G3 implementations
│   └── routes.ts           # API endpoints
│
└── inngest/
    └── functions/
        ├── web-motor/pipeline.started.ts
        └── web-motor/blog-post.started.ts
```

### Database Schema
```typescript
- web_projects (projectId, tenantId, name, architecture, current_step, status)
- web_pages (pageId, projectId, name, url_path)
- web_artifacts (artifactId, projectId, type: direction|copy|design|code, content)
- web_gate_results (gateId, projectId, gate_number: 1|2|3, attempt, pass, feedback)
- web_iteration_tracking (attempt_num, gate_num, projectId, adjustments_applied)
- blog_posts (postId, projectId, published_at, live_url)
```

### AI Modules
```
Agents:
- Creative Director (Claude Opus, Tier A)
- Writer (Claude Sonnet, Tier A)
- Designer (Claude Sonnet, Tier A)
- Web Developer (Claude Sonnet, Tier A)

Skills:
- CD: Web Direction
- Writer: Web Copy, Blog Post
- Designer: Web Design
- Developer: Static Site, CMS Site, Microsite
```

---

## 3. PLAN IMPLEMENTACIÓN

### Step 2.1: Data Model
Create 6 tables + Drizzle schema

### Step 2.2: Pipeline Inngest Function
Single function with 10+ steps (BRIEF → CD → WRITER → G1 → DESIGNER → G2 → DEV → QA → G3 → DEPLOY)

### Step 2.3-2.10: Agent Implementation
Each step registers agent in `prompt_registry` + implements tool suite

### Step 2.11: Blog Post Continuous Pipeline
Separate Inngest function for ongoing blog publication

### Step 2.12: Integration Test
Full project flow + blog post flow

---

## 4. IMPLEMENTACIÓN

### Web Motor Pipeline Function (Pseudo-code)

```typescript
export const webMotorPipeline = inngest.createFunction(
  { id: "web-motor.pipeline" },
  { event: "web-motor/project.started" },
  async ({ event, step }) => {
    const project = event.data;

    // BRIEF (already exists — user provides it)
    
    // Step 1: Creative Director
    const cdOutput = await step.run("creative-director", async () => {
      return await creativeDirectorAgent({
        project,
        brandDNA: await loadBrandDNA(project.tenantId),
      });
    });

    // Step 2: Writer
    const writerOutput = await step.run("writer", async () => {
      return await writerAgent({
        project,
        cdDirection: cdOutput,
        brandDNA: await loadBrandDNA(project.tenantId),
      });
    });

    // Step 3: Gate 1 (CD + Brand Guardian parallel)
    const g1Result = await step.run("gate-1", async () => {
      const cdEval = await evaluateCreativeCongruence(cdOutput, writerOutput);
      const bgEval = await evaluateBrandGuardian("textual-voice", writerOutput);
      const cost = estimateCost(project);
      
      return {
        pass: cdEval.pass && bgEval.pass,
        feedback: { cdEval, bgEval, cost },
      };
    });

    if (!g1Result.pass) {
      // 3+3 rule
      if (project.gate1_attempt < 6) {
        await step.sendEvent("retry-writer", {
          name: "web-motor/project.started",
          data: { ...project, gate1_attempt: project.gate1_attempt + 1 },
        });
        return { status: "retry-gate-1" };
      }
    }

    // Step 4: Designer
    // Step 5: Gate 2
    // Step 6: Web Developer
    // Step 7: QA
    // Step 8: Gate 3
    // Step 9: Deploy
    
    return { status: "complete", live_url: project.live_url };
  }
);
```

---

## 5. TESTING

### Level 1 (Security)
- Tenant isolation on project creation/read/update
- Inngest event validation
- Prompt tier enforcement

### Level 2 (Regression)
```typescript
test("Full Web Motor pipeline: brief → design → code → deploy", async () => {
  const brief = { name: "My Website", architecture: [...], blog: true };
  
  const res = await triggerPipeline(brief);
  await waitForInngest(10000); // Longer than Phase 1 due to more steps
  
  const project = await db.query.webProjects.findFirst({...});
  expect(project.status).toBe("deployed");
  expect(project.live_url).toBeDefined();
});

test("Gate 1 failure → Writer retries with CD feedback", async () => {
  // Create project with intentionally bad copy
  // Trigger G1 → should fail
  // Verify Writer retried with feedback
});

test("Blog post pipeline: brief → Writer → G1 → publish", async () => {
  // Separate from main pipeline
  // Verify blog post published via CMS
});
```

---

## 6. DEBUGGING

### Web Motor Specifics

```bash
# Check 1: Is CD producing reasonable creative direction?
Look at Inngest step output → inspect cdOutput

# Check 2: Is Writer following CD direction?
Check writerOutput → does it match cdOutput themes?

# Check 3: Is Designer translating copy to layout?
Check designerOutput → pages laid out correctly?

# Check 4: Is Web Developer generating valid code?
Check developerOutput → HTML/CSS valid?

# Check 5: QA catching real issues?
Check qaOutput → accessibility, responsive, links?

# Check 6: Deploy actually working?
curl -i https://[live_url]
```

---

## 7. DOGFOODING

### Manual Test: Build criteria.agency Website

**Goal:** Use Web Motor to build the founder's own website.

**Input:**
```json
{
  "name": "criteria.agency",
  "architecture": [
    { "page": "home", "sections": ["hero", "features", "pricing"] },
    { "page": "about", "sections": ["team", "values"] },
    { "page": "blog", "sections": ["latest_posts"] }
  ],
  "brand_dna_id": "...",
  "blog": true
}
```

**Watch it go:**
1. CD produces design direction
2. Writer creates copy for each page
3. G1 evaluates: CD satisfied, copy on-brand, cost estimated
4. Designer creates layout specs
5. G2 evaluates: design matches CD, visual consistency
6. Web Dev generates full static site + blog CMS
7. QA runs (responsive, links, accessibility)
8. G3 passes
9. Site deployed to Vercel
10. Live URL accessible

**Success:** Founder can show live website built by platform

---

# FASE 3, 4, 5, 6, 7 — Siguiendo el Mismo Patrón

Cada fase sigue:

```
DISEÑO (specs + DECs)
  ↓
MÓDULOS (backend + database + agents)
  ↓
PLAN IMPLEMENTACIÓN (steps en orden)
  ↓
IMPLEMENTACIÓN (code patterns)
  ↓
TESTING (Level 1 + Level 2)
  ↓
DEBUGGING (what to check)
  ↓
DOGFOODING (manual validation)
```

El documento completo para Fases 3-7 seguiría la misma estructura.

---

## RESUMEN: Ciclo de Desarrollo por Fase

| Fase | Diseño Input | Módulos | Steps | Tests | Debug Focus | Dogfood Goal |
|------|--------------|---------|-------|-------|-------------|--------------|
| **0** | Security FW, Schema | Infrastructure | 9 | 130+ | Inngest, LLM, Tenant isolation | End-to-end loop works |
| **1** | Brand Builder spec | Brand DNA, Strategist agent | 10 | 130+ | Gates, scoring, versioning | L0→L3 journey complete |
| **2** | Web Motor spec | 4 agents, pipeline | 12 | 154+ | CD→Writer→Designer→Dev flow | Live website deployed |
| **3** | (pending) | Health Score, Output Registry | 4 | TBD | Score calculation, semantic search | Metrics visible + queryable |
| **4** | (pending) | Strategist agent | 4 | TBD | Diagnostic interpretation | Marketing plan generated |
| **5** | (pending) | Next.js + Admin UI | 4 | TBD | SSE updates, gate review queue | Admin can operate platform |
| **6** | (pending) | MARA + Client Portal | 4 | TBD | Intent classification, Output Registry lookup | Client sees campaigns + MARA |
| **7** | (pending) | Security hardening | 4 | TBD | Rate limiting, MARA safety, legal docs | Production-ready |

