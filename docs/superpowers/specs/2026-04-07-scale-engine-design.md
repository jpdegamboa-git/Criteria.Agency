# criteria.agency — Scale & Orchestration Engine Design

> Date: April 7, 2026
> Status: Draft — pending review
> Scope: Implementation design for Scale capabilities (C-042 to C-044): Multi-channel Production from Single Brief, Intelligent Asset Reuse, Scalable Virtual Team

---

## 1. Objective

Build the **Scale Engine** — a cross-motor orchestration layer that multiplies output without multiplying effort. This is a lightweight motor with a few specialized agents focused on **orchestration** rather than content production, enabling 1 brief → N channels, asset reuse across projects, and elastic team scaling.

| Capability | What it delivers |
|-----------|-----------------|
| C-042: Producción multicanal desde un solo brief | One campaign brief triggers parallel production across Video, Design, Copy, Web, Audio |
| C-043: Reutilización inteligente de activos | Asset registry that indexes all produced content and recommends reuse/adaptation |
| C-044: Equipo virtual escalable | 125 agents working in parallel with dynamic capacity management |

**Dependency:** C-042 depends on Strategist (brief generation) + Channel Manager (specs) + all production motors. C-043 depends on the artifact storage system. C-044 depends on the orchestration framework.

---

## 2. Multi-channel Production (C-042)

### Problem

Currently, each motor runs independently. A campaign that needs video + social graphics + email copy + landing page requires 4 separate project creations. There's no coordination or shared context.

### Solution: Campaign Orchestrator

A new layer above individual motor pipelines that:
1. Receives a Campaign Brief (from Strategist or manual)
2. Decomposes into per-channel sub-briefs using Channel Manager specs
3. Creates sub-projects for each motor
4. Manages shared context (Brand DNA, campaign messaging, visual direction)
5. Tracks overall campaign progress
6. Ensures cross-channel consistency via Brand Guardian

**Flow:**

```
[Campaign Brief]
    ↓
[Campaign Orchestrator]
    ├── [Decompose] — split brief into channel-specific sub-briefs
    ├── [Validate] — Brand Guardian checks consistency + Financial Agent checks budget
    ├── [Dispatch] — create sub-projects in parallel
    │   ├── Video Production (if video needed)
    │   ├── Graphic Design (if visual assets needed)
    │   ├── Writers Room (if copy needed)
    │   ├── Web (if landing page needed)
    │   ├── Audio (if audio needed)
    │   └── Email Marketing (if email sequence needed)
    ├── [Monitor] — track sub-project progress
    ├── [Consolidate] — collect all deliverables
    └── [Deliver] — campaign package ready for distribution
```

### Agents

| ID | Name | Level | Role | Model | Autonomy |
|----|------|-------|------|-------|----------|
| SC-L | Campaign Orchestrator | leader | Brief decomposition, cross-channel consistency, campaign-level decisions | claude-sonnet-4 | 70% |
| SC-001 | Brief Decomposer | sub | Splits campaign brief into channel-specific sub-briefs | gemini-2.5-flash | 85% |
| SC-002 | Progress Monitor | sub | Tracks sub-project status, detects blockers, reports progress | gemini-2.5-flash | 90% |

### Campaign project structure

```typescript
interface CampaignProject {
  id: string;
  clientId: string;
  pipelineType: "campaign";
  campaignBriefId: string;     // source brief from Strategist
  brandDnaProjectId: string;    // Brand DNA reference
  status: "decomposing" | "dispatched" | "in_progress" | "consolidating" | "delivered";
  subProjects: Array<{
    projectId: string;
    motor: string;              // "video-production", "graphic-design", etc.
    channel: string;            // "instagram", "linkedin", "email", etc.
    status: string;
    priority: number;
    deliverables: string[];     // artifact IDs
  }>;
  sharedContext: {
    campaignMessage: string;
    visualDirection: string;
    toneGuidelines: string;
    targetAudience: string;
    callToAction: string;
  };
  budget: {
    total: number;
    allocated: Record<string, number>;  // motor → amount
    spent: Record<string, number>;
  };
}
```

### Brief decomposition logic

SC-001 takes a Campaign Brief and Channel Manager specs to produce sub-briefs:

```
Campaign Brief: "Lanzar campaña de Q2 para producto X, audiencia millennials urbanos,
                 presupuesto $5000, canales: Instagram, LinkedIn, email"
    ↓
Sub-briefs generated:
  1. Graphic Design: 5 Instagram posts + 3 Stories + 3 LinkedIn images
     (specs: 1080x1080, 1080x1920, 1200x627)
  2. Writers Room: Copy for 5 IG captions, 3 LinkedIn posts, 3 email subjects+body
     (tone: Brand DNA, messaging: campaign message)
  3. Email Marketing: 3-email sequence (announce, value, CTA)
     (segment: millennials urbanos, flow: drip over 7 days)
```

### Cross-channel consistency

The `sharedContext` object is injected into every sub-project's context builder:
- Same campaign message across all channels
- Same visual direction (colors, mood, style)
- Same CTA (adapted per channel format)
- Brand Guardian validates each sub-project against shared context + Brand DNA

---

## 3. Asset Reuse (C-043)

### Problem

Every project starts from zero. A logo, key visual, or video clip produced in one project is not discoverable or reusable in another.

### Solution: Asset Registry

An indexing and recommendation system on top of the existing artifact storage.

```typescript
interface AssetRegistryEntry {
  id: string;
  artifactId: string;          // reference to artifacts table
  clientId: string;
  type: "image" | "video" | "audio" | "document" | "template" | "component";
  tags: string[];               // "logo", "hero_image", "product_shot", "jingle"
  description: string;          // AI-generated description of the asset
  originalContext: {
    projectId: string;
    campaign: string;
    channel: string;
    step: string;
  };
  performance: {
    timesUsed: number;
    channels: string[];         // channels where it was used
    engagement: number | null;  // avg engagement when used
  };
  adaptations: Array<{          // derived versions
    assetId: string;
    channel: string;
    format: string;             // "1080x1080", "1920x1080", etc.
  }>;
  embedding: number[];          // vector embedding for similarity search
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string | null;     // for seasonal/time-bound assets
}
```

### Asset indexing (automatic)

Every artifact produced by any motor is automatically indexed:
1. On artifact creation, trigger indexing job
2. AI generates description + tags
3. Compute vector embedding (for similarity search)
4. Store in asset registry

### Asset recommendation

When a new sub-brief is created (C-042) or a new project starts:

```
SC-001: "Need Instagram post about product X for millennials"
    ↓
Asset Registry search:
  - Tags match: "product_x", "instagram", "millennials"
  - Visual similarity: embedding cosine > 0.8
  - Recent + high performing: engagement > median
    ↓
Recommendations:
  1. "Hero image from Q1 campaign (engagement: 4.2%) — adapt from 1200x627 to 1080x1080"
  2. "Product photo from website — crop and add text overlay"
  3. "Brand color palette template — already formatted for IG"
```

### Agent

| ID | Name | Level | Role | Model | Autonomy |
|----|------|-------|------|-------|----------|
| SC-003 | Asset Curator | sub | Indexes assets, generates descriptions/tags, recommends reuse | gemini-2.5-flash | 90% |

---

## 4. Scalable Virtual Team (C-044)

### Problem

The 3+3 execution rule runs 3 agents in parallel, then waits, then runs 3 more. With 125 agents across 24 motors, we need smarter capacity management.

### Solution: Enhanced Orchestration

Upgrades to the existing dispatcher and state machine:

**Dynamic parallelism:**

> Note: The existing 3+3 rule is an *iteration/escalation* policy (3 agent attempts → 3 with leader adjustment → human escalation), not a concurrency limit. The `maxConcurrentAgents` below controls actual parallelism.

```typescript
interface CapacityConfig {
  maxConcurrentAgents: number;     // default: 10 (across all motors)
  maxConcurrentPerMotor: number;   // default: 3
  maxConcurrentPerClient: number;  // default: 10
  priorityRules: Array<{
    condition: string;             // "deadline < 24h", "client_tier == 'enterprise'"
    boost: number;                 // priority boost factor
  }>;
}
```

**Queue-based execution:**
```
[Project queue] → [Priority sorter] → [Capacity check] → [Dispatch to agent]
                                                               ↓
                                        [Rate limiter check] → [Execute or wait]
```

**Agent health monitoring:**

```typescript
interface AgentHealth {
  agentId: string;
  status: "healthy" | "degraded" | "unavailable";
  metrics: {
    avgResponseTime: number;    // ms
    successRate: number;        // 0-1 over last 24h
    lastExecution: string;
    totalExecutions: number;
    errorRate: number;
  };
  providerStatus: {
    primary: string;            // model provider status
    fallback: string;
  };
}
```

**Auto-scaling behavior:**
- When queue depth > threshold: increase `maxConcurrentAgents`
- When error rate > 10%: reduce concurrency, switch to fallback models
- When rate limit approaching: pre-emptively throttle
- Report capacity utilization to client dashboard

---

## 5. Database Changes

### New tables

```sql
-- Campaign orchestration
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user(id),
  name VARCHAR(255) NOT NULL,
  brief_project_id UUID REFERENCES projects(id),  -- source brief
  brand_dna_project_id UUID REFERENCES projects(id),
  status VARCHAR(30) DEFAULT 'draft',
  shared_context JSONB NOT NULL,
  budget JSONB,
  sub_project_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset registry
CREATE TABLE asset_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id),
  client_id UUID NOT NULL REFERENCES user(id),
  type VARCHAR(30) NOT NULL,
  tags TEXT[] NOT NULL,
  description TEXT,
  original_context JSONB NOT NULL,
  performance JSONB DEFAULT '{"timesUsed": 0}',
  adaptations JSONB DEFAULT '[]',
  embedding REAL[],                              -- vector for similarity search
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_asset_registry_client ON asset_registry (client_id);
CREATE INDEX idx_asset_registry_tags ON asset_registry USING gin (tags);

-- Agent capacity tracking
CREATE TABLE agent_capacity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT NOW(),
  concurrent_agents INTEGER NOT NULL,
  queue_depth INTEGER NOT NULL,
  agents_by_status JSONB,                        -- { "running": 5, "queued": 3, "idle": 117 }
  avg_response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0
);
```

### Enum additions

```sql
ALTER TYPE pipeline_type ADD VALUE 'campaign';
```

---

## 6. API Endpoints

```
-- Campaign orchestration
POST   /api/campaigns/:clientId                    → Create campaign from brief
GET    /api/campaigns/:clientId                    → List campaigns
GET    /api/campaigns/:clientId/:id                → Campaign detail with sub-project status
POST   /api/campaigns/:clientId/:id/dispatch       → Launch campaign (create sub-projects)
GET    /api/campaigns/:clientId/:id/progress       → Real-time progress across all sub-projects
POST   /api/campaigns/:clientId/:id/consolidate    → Collect deliverables into campaign package

-- Asset registry
GET    /api/assets/:clientId                       → Browse asset library (filterable by type, tags, channel)
GET    /api/assets/:clientId/search                → Semantic search (text → embedding similarity)
GET    /api/assets/:clientId/recommend              → Get recommendations for a brief/project
POST   /api/assets/:clientId/:id/adapt             → Request adaptation of asset to new format
GET    /api/assets/:clientId/stats                 → Asset utilization stats

-- Capacity
GET    /api/capacity                               → Current agent capacity overview
GET    /api/capacity/health                        → Agent health dashboard
GET    /api/capacity/history                       → Capacity utilization over time
```

---

## 7. New Files

| File | Purpose |
|------|---------|
| `src/services/scale/campaign-orchestrator.ts` | Campaign decomposition, dispatch, monitoring |
| `src/services/scale/brief-decomposer.ts` | Splits campaign brief into channel sub-briefs |
| `src/services/scale/asset-registry.ts` | Asset indexing, search, recommendation |
| `src/services/scale/capacity-manager.ts` | Dynamic parallelism, queue management |
| `src/api/campaign-routes.ts` | Campaign endpoints |
| `src/api/asset-routes.ts` | Asset registry endpoints |
| `src/api/capacity-routes.ts` | Capacity monitoring endpoints |
| `agents/SC-L_campaign_orchestrator.md` | Agent skill file |
| `agents/SC-001_brief_decomposer.md` | Agent skill file |
| `agents/SC-002_progress_monitor.md` | Agent skill file |
| `agents/SC-003_asset_curator.md` | Agent skill file |

---

## 8. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Campaign creates sub-projects | 1 campaign brief → 3+ sub-projects in different motors |
| Sub-projects share context | All sub-projects receive shared campaign context |
| Cross-channel consistency | Brand Guardian validates across sub-projects |
| Asset indexing works | Create 5 artifacts, verify all indexed with tags and descriptions |
| Asset search returns relevant results | Search "product photo instagram", get matching assets |
| Asset recommendation works | Start new project, get relevant asset suggestions |
| Capacity tracking works | Run 5 agents in parallel, verify capacity log records it |
| Queue-based dispatch works | Queue 10 agents, verify they execute respecting concurrency limits |
| No regression | Individual motor pipelines continue working when not part of a campaign |
