# CriteriaFilms.com — Portal specifications

> Last updated: April 5, 2026
> Portals: 3 (public, client, admin)
> Status: Active — Specification phase

---

## Portal architecture

Three separate portals sharing a common backend and authentication system. Each portal has a distinct purpose and user base.

```
                    ┌──────────────────┐
                    │   Shared Auth    │
                    │   (SSO/roles)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
      ┌───────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
      │ Public Portal│ │  Client  │ │    Admin    │
      │ (marketing)  │ │  Portal  │ │   Portal    │
      │              │ │(projects)│ │(production) │
      └──────────────┘ └──────────┘ └─────────────┘
```

---

## Public portal

**Purpose:** Marketing, portfolio showcase, lead generation, school access.

**URL:** criteriafilms.com

### Pages

| Page | Purpose | Key elements |
|------|---------|-------------|
| Landing | First impression, value proposition | Hero video (produced by CriteriaFilms), services overview, social proof |
| Portfolio | Showcase completed work | Filterable gallery by type (corporate, documentary, fiction), video player, case studies |
| Services | Detail service offerings | 3 service tiers or packages, comparison table, pricing starting points |
| About | Team and methodology | Story, methodology (agentic production), quality promise |
| Blog / School | Content marketing + education portal | Articles, tutorials, course listings (business model 3) |
| Contact | Lead capture | Contact form with project type selector, budget range, timeline |

### Onboarding flow

```
Visitor → Landing page → Services/Portfolio → Contact form → Qualification call (or automated) → Account creation → Client portal access → First brief
```

### Technical notes
- Static pages where possible (SSG for performance and SEO)
- Blog/school section may be a separate subdomain (school.criteriafilms.com)
- Portfolio videos hosted on CDN for fast playback

---

## Client portal

**Purpose:** Project management from the client's perspective. Create briefs, upload files, review deliverables, provide feedback.

**URL:** app.criteriafilms.com (or clients.criteriafilms.com)

**Access:** Authenticated clients only. Each client sees only their own projects.

### Main screens

| Screen | Purpose | Key elements |
|--------|---------|-------------|
| Dashboard | Overview of all projects | Project cards with status indicator (mapped to pipeline step), quick actions |
| New brief | Create a new project | Guided conversational interface (powered by Creative Director agent), file upload, reference links |
| Project detail | Deep view of one project | Pipeline progress bar, current status, deliverables by phase, comment threads |
| Deliverable review | Review a specific deliverable | Full-screen viewer (video player / image viewer / document viewer), commenting interface |
| File upload | Add reference materials | Drag-and-drop upload to temporary drive (15-day retention with visible countdown) |
| Account / Profile | Manage account | Brand assets, preferences, billing history |

### Brief creation flow

```
Client clicks "New Project"
    → Type selection (corporate, explainer, documentary, etc.)
    → Guided questions (conversational, powered by Creative Director agent):
        - What's the video for? (objective)
        - Who's the audience?
        - Key messages (1-3)
        - Tone and style preferences
        - Duration preference
        - Reference examples (upload or links)
        - Budget range
        - Timeline
    → Brief summary for client review
    → Client confirms → Brief enters pipeline
```

### Deliverable review and commenting

**Commentable elements:**

| Element | How client sees it | Comment format | Routes to |
|---------|-------------------|---------------|-----------|
| Script | Two-column or formatted text view | Inline comments on specific paragraphs/lines | Team 2 (via T7-002 feedback interpreter) |
| Breakdown | Table of characters, locations, props | Comments on specific items | Producer |
| Style / Moodboard | Image gallery with descriptions | Comments on specific images | Team 1 (Creative Director) |
| Schedule | Timeline/Gantt view | Comments on milestones | PM |
| Storyboard | Image grid with AV text, audio and visual icons | Comments on specific frames | Teams 3/4 |
| Final video | Video player with timestamp markers | Timestamp-anchored comments | Team 6 (Editor, via T7-002) |

**Comment flow:**
1. Client adds comment on element
2. Comment appears in admin portal, tagged to project + element + specific location
3. T7-002 (feedback interpreter) translates vague comments to actionable instructions
4. PM routes instructions to correct team
5. Team makes corrections
6. Updated deliverable appears in client portal
7. Client reviews again (notification sent)

### File upload

- Drag-and-drop interface
- Accepted formats: images (PNG, JPG, PSD), video (MP4, MOV), audio (MP3, WAV), documents (PDF, DOCX)
- 15-day retention with visible countdown timer
- Size limit: 500MB per file, 2GB per project
- Files are accessible to all production teams via artifact storage

---

## Admin portal

**Purpose:** Full production management. Pipeline visualization, agent orchestration, quality control, client management, billing.

**URL:** admin.criteriafilms.com

**Access:** Internal team only (human experts, PM role).

### Main screens

| Screen | Purpose | Key elements |
|--------|---------|-------------|
| Command center | All projects at a glance | Kanban board (columns = pipeline steps), filters by status/client/type/team |
| Project detail | Deep production view | Full pipeline with agent status, gate reviews, artifacts, iteration history, costs |
| Agent dashboard | Monitor agent performance | Active agents, execution times, success rates, 3+3 rule progress, cost per agent |
| Model dashboard | Monitor AI model performance and costs | Current models in use, per-model cost tracking, benchmark results from Team 9, model selection history |
| Gate review | Conduct or review gate decisions | Showrunner evaluation interface, critic scores, cross-functional reports, pass/fail with notes |
| Client comments | View and manage all feedback | Comments organized by project → element → priority, translation status, routing status |
| Billing | Financial overview | Invoices, project costs, revenue, margins per project and aggregate |
| Client management | Manage client accounts | Client list, brand assets, project history, satisfaction metrics |
| Settings | System configuration | Agent configurations, model selections, quality thresholds, notification rules |

### Pipeline visualization

The command center shows a Kanban-style board:

```
| Brief | Concept | [G1] | Script | [G2] | Visual | Storyboard | [G3] | VideoGen | Edit | Audio | [G4] | Polish | [G5] | Delivered |
|-------|---------|------|--------|------|--------|------------|------|----------|------|-------|------|--------|------|-----------|
| Proj-A|         |      |        |      |        |            |      | Proj-C   |      |       |      |        |      | Proj-F    |
|       |         |      |Proj-B  |      |        |            |      |          |      |       |      |Proj-E  |      |           |
|       |         |      |        |      |        | Proj-D     |      |          |      |       |      |        |      |           |
```

Each project card shows: client name, project type, days in current step, iteration count, assigned agents.

Gate columns are highlighted — clicking shows the gate review interface.

### Agent orchestration view

For each active agent:
- Current task and project
- Attempt number (1-6 per 3+3 rule)
- Execution time
- Input artifacts consumed
- Output artifacts produced (or in progress)
- Cost accumulated

**Alert triggers:**
- Agent stuck (execution time > 2x average)
- 3+3 rule: attempt 4 triggered (leader adjustment happening)
- 3+3 rule: attempt 6 failed (human escalation needed)
- Gate failed 2+ times on same project
- Budget exceeded threshold
- New model release detected (Team 9 evaluates and recommends)

---

## Permission matrix

| Action | Public visitor | Registered client | Team leader agent | Sub-agent | PM | Showrunner | Admin human |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View public site | Yes | Yes | — | — | Yes | Yes | Yes |
| Create account | Yes | — | — | — | — | — | Yes |
| Create brief | — | Yes | — | — | Yes | — | Yes |
| Upload files | — | Yes | — | — | Yes | — | Yes |
| View own projects | — | Yes | — | — | Yes | — | Yes |
| Comment on deliverables | — | Yes | — | — | Yes | — | Yes |
| View all projects | — | — | Own team | — | Yes | Teams 1-6 | Yes |
| Edit project artifacts | — | — | Own team | Own task | Yes | — | Yes |
| Conduct gate review | — | — | — | — | — | Yes | Yes |
| Override agent decision | — | — | — | — | Yes | Yes | Yes |
| Approve final delivery | — | Yes | — | — | Yes | Yes | Yes |
| View billing | — | Own invoices | — | — | Yes | — | Yes |
| Manage clients | — | — | — | — | Yes | — | Yes |
| Configure agents | — | — | — | — | — | — | Yes |
| View agent dashboard | — | — | — | — | Yes | Yes | Yes |
| View model dashboard | — | — | — | — | Yes | — | Yes |

**Note:** Team 9 (AI Model Intelligence) leader has read access to all project model configurations across all teams, as model intelligence is transversal.

---

## Related documents

- `PROJECT_VISION.md` — Mission, business models, principles
- `TEAM_STRUCTURE.md` — 9 teams, chain of command, communication protocols
- `AGENT_REGISTRY.md` — Technical reference cards for all 47 agents
- `PRODUCTION_PIPELINE.md` — Step-by-step production flow with gates
- `MVP_ROADMAP.md` — Phased rollout plan
- `TECH_ARCHITECTURE.md` — Technical stack and implementation
- `DECISION_LOG.md` — Chronological log of all key decisions
