# Events Motor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Events Motor (C-015) — register pipeline, create 6 agent skill files, add event-playbooks directive, wire up context maps, and update DB schema.

**Architecture:** Adds an `events` pipeline to the existing PipelineRegistry with 8 steps and 3 gates. Creates 6 agents (EV-L through EV-005). Events is the most orchestrational motor — it produces little directly but coordinates Marketplace (vendors), Writers Room (copy), Graphic Design (visuals), Print Production (printed materials), Video (coverage), Audio (sound design), Email Marketing (invitations), and Community Management (social coverage).

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Hono

**Spec:** `docs/superpowers/specs/2026-04-07-events-motor-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `agents/EV-L_event_director.md` | Event Director skill file (leader) |
| `agents/EV-001_event_planner.md` | Event Planner skill file |
| `agents/EV-002_logistics_coordinator.md` | Logistics Coordinator skill file |
| `agents/EV-003_content_activator.md` | Content Activator skill file |
| `agents/EV-004_event_analyst.md` | Event Analyst skill file |
| `agents/EV-005_guest_manager.md` | Guest Manager skill file |
| `agents/_shared/event-playbooks.md` | Event playbooks directive |

### Modified files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add EV steps to enums |
| `src/orchestrator/pipeline-registry.ts` | Add `events` pipeline definition |
| `src/agents/registry.ts` | Add 6 new agent entries |
| `src/agents/model-defaults.ts` | Add model assignments for 6 agents |
| `src/agents/context-map.ts` | Add 11 context map entries for events pipeline |
| `src/agents/context-builder.ts` | Add `events` to `PIPELINE_DIRECTIVES` |

---

### Task 1: Add Events steps to DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add EV steps to projectStatusEnum**

```typescript
  // Events
  "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
```

- [ ] **Step 2: Add EV steps to artifactStepEnum**

```typescript
  // Events
  "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup", "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
```

- [ ] **Step 3: Add EV gates to gateTypeEnum**

```typescript
  "ev-g1", "ev-g2", "ev-g3",
```

- [ ] **Step 4: Generate and apply the DB migration**

Run: `npm run db:generate && npm run db:migrate`

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(events): add EV steps and gates to DB schema enums"
```

---

### Task 2: Register events pipeline in PipelineRegistry

**Files:**
- Modify: `src/orchestrator/pipeline-registry.ts`

- [ ] **Step 1: Add pipeline definition**

```typescript
// ── Events Pipeline ──
// Orchestrational motor: coordinates Marketplace, Writers Room, Graphic Design,
// Print Production, Video, Audio, Email Marketing, and Community Management.

PipelineRegistry.register({
  type: "events",
  steps: [
    "ev_brief", "ev_concept", "ev_planning", "ev_vendor_setup",
    "ev_pre_event", "ev_live_event", "ev_post_event", "ev_delivery",
  ],
  stepAgents: {
    ev_brief: ["EV-L"],
    ev_concept: ["EV-L"],
    ev_planning: ["EV-001"],
    ev_vendor_setup: ["EV-002"],
    ev_pre_event: ["EV-003", "EV-005"],
    ev_live_event: ["EV-003", "EV-005"],
    ev_post_event: ["EV-003", "EV-004"],
    ev_delivery: ["EV-L"],
  },
  gates: {
    "ev-g1": {
      afterStep: "ev_concept",
      evaluators: ["EV-L"],
      maxIterations: 3,
      failReturnTo: "ev_concept",
    },
    "ev-g2": {
      afterStep: "ev_vendor_setup",
      evaluators: ["EV-L"],
      maxIterations: 2,
      failReturnTo: "ev_vendor_setup",
    },
    "ev-g3": {
      afterStep: "ev_post_event",
      evaluators: ["EV-L"],
      maxIterations: 2,
      failReturnTo: "ev_post_event",
    },
  },
});
```

- [ ] **Step 2: Verify registration**

Run: `npx tsx -e "import './src/orchestrator/pipeline-registry.js'; import { PipelineRegistry } from './src/orchestrator/pipeline-registry.js'; console.log(PipelineRegistry.getSteps('events'));"`

Expected:
```
[ 'ev_brief', 'ev_concept', 'ev_planning', 'ev_vendor_setup', 'ev_pre_event', 'ev_live_event', 'ev_post_event', 'ev_delivery' ]
```

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator/pipeline-registry.ts
git commit -m "feat(events): register events pipeline with 8 steps and 3 gates"
```

---

### Task 3: Register 6 agents in agent registry

**Files:**
- Modify: `src/agents/registry.ts`

- [ ] **Step 1: Add Events Motor agents**

```typescript
  // ── Events Motor ──
  "EV-L": { id: "EV-L", name: "Event Director", skillFile: "agents/EV-L_event_director.md", team: 21, level: "leader", steps: ["ev_brief", "ev_concept", "ev_delivery"] as any, gates: ["ev-g1", "ev-g2", "ev-g3"] as any, autonomy: 70 },
  "EV-001": { id: "EV-001", name: "Event Planner", skillFile: "agents/EV-001_event_planner.md", team: 21, level: "sub", steps: ["ev_planning"] as any, gates: [], autonomy: 75 },
  "EV-002": { id: "EV-002", name: "Logistics Coordinator", skillFile: "agents/EV-002_logistics_coordinator.md", team: 21, level: "sub", steps: ["ev_vendor_setup"] as any, gates: [], autonomy: 70 },
  "EV-003": { id: "EV-003", name: "Content Activator", skillFile: "agents/EV-003_content_activator.md", team: 21, level: "sub", steps: ["ev_pre_event", "ev_live_event", "ev_post_event"] as any, gates: [], autonomy: 65 },
  "EV-004": { id: "EV-004", name: "Event Analyst", skillFile: "agents/EV-004_event_analyst.md", team: 21, level: "sub", steps: ["ev_post_event"] as any, gates: [], autonomy: 80 },
  "EV-005": { id: "EV-005", name: "Guest Manager", skillFile: "agents/EV-005_guest_manager.md", team: 21, level: "sub", steps: ["ev_pre_event", "ev_live_event"] as any, gates: [], autonomy: 75 },
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/registry.ts
git commit -m "feat(events): register 6 EV agents"
```

---

### Task 4: Add model defaults for 6 agents

**Files:**
- Modify: `src/agents/model-defaults.ts`

- [ ] **Step 1: Add model assignments**

```typescript
  // Events Motor
  "EV-L": "claude-sonnet-4",
  "EV-001": "gemini-2.5-flash",
  "EV-002": "gemini-2.5-flash",
  "EV-003": "gemini-2.5-flash",
  "EV-004": "gemini-2.5-flash",
  "EV-005": "gemini-2.5-flash",
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/model-defaults.ts
git commit -m "feat(events): add model defaults for 6 EV agents"
```

---

### Task 5: Add context map entries for events pipeline

**Files:**
- Modify: `src/agents/context-map.ts`

- [ ] **Step 1: Add EV context map entries**

```typescript
  // ── Events Pipeline ──

  "EV-L:ev_brief": {
    artifactSteps: [],
    attachmentTypes: ["json"],
    taskInstruction:
      "Interpret the event brief. Define: event type (webinar/workshop/networking/launch/conference/activation/gala/expo), format (virtual/presencial/hybrid), scale (expected attendees), objectives (leads/brand awareness/education/networking), KPIs, budget range. Output: {type, format, scale, objectives, kpis, budget_range, target_date}.",
  },
  "EV-L:ev_concept": {
    artifactSteps: ["ev_brief"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Design the event concept: central theme, agenda structure, attendee experience flow (arrival → registration → main content → networking → departure), unique differentiators, atmosphere/mood. For virtual: platform selection, engagement features. Output: {theme, tagline, agenda_draft, experience_flow, differentiators, atmosphere, platform_if_virtual}.",
  },
  "EV-001:ev_planning": {
    artifactSteps: ["ev_brief", "ev_concept"],
    attachmentTypes: ["text", "json"],
    taskInstruction:
      "Create detailed event plan: day-by-day timeline (for multi-day) or hour-by-hour (for single-day), task checklist with owners and deadlines, budget breakdown by category (venue, catering, A/V, entertainment, materials, logistics), venue layout with zone distribution (stage, networking, catering, registration, photo wall), capacity planning per zone, attendee flow map. Output: {timeline, checklist, budget: {categories: [{name, amount, vendor_needed}]}, venue_layout: {zones: [{name, capacity, equipment}]}, flow_map}.",
  },
  "EV-002:ev_vendor_setup": {
    artifactSteps: ["ev_planning"],
    attachmentTypes: ["text", "json"],
    taskInstruction:
      "Create Marketplace requests for all needed vendors. Categories may include: venue, catering, A/V equipment, entertainment (musicians/DJ/performers), MC/host, decoration, furniture, photography, logistics (transport/security/valet), and any other services from the plan. Create one Marketplace sub-project per major vendor category. Output: {marketplace_requests: [{category, services, specs, budget_allocated, deadline}]}.",
  },
  "EV-003:ev_pre_event": {
    artifactSteps: ["ev_planning", "ev_vendor_setup"],
    attachmentTypes: ["text", "image", "json"],
    taskInstruction:
      "Coordinate pre-event content production by creating sub-projects in other motors: 1) Writers Room: MC scripts, presentation scripts, invitation copy, program copy, talking points. 2) Graphic Design: invitations, signage/wayfinding, backdrop, badges/gafetes, table materials, venue layout visual. 3) Print Production: printed badges, program booklet, physical signage. 4) Audio Motor: event sound design, playlist, jingles/bumpers. 5) Email Marketing: invitation send, RSVP confirmation, reminders (1 week, 1 day). 6) Community Management: teaser posts, countdown, hashtag setup. Output: {sub_projects: [{motor, type, brief, status}]}.",
  },
  "EV-005:ev_pre_event": {
    artifactSteps: ["ev_planning"],
    attachmentTypes: ["text", "json"],
    taskInstruction:
      "Manage guest list and RSVP: curate invite list from client CRM/input, track RSVP responses, send confirmations, manage +1s and dietary restrictions, prepare check-in system (QR codes), create seating chart if applicable, send reminders (1 week before, 1 day before). Output: {guest_list: {total_invited, confirmed, declined, pending}, seating_chart_if_applicable, check_in_system_ready: boolean}.",
  },
  "EV-003:ev_live_event": {
    artifactSteps: ["ev_pre_event"],
    attachmentTypes: ["text", "image"],
    taskInstruction:
      "Coordinate live event coverage: 1) Video Production: live recording/streaming, photo coverage. 2) Community Management: real-time social posts, stories, live tweeting, hashtag monitoring, audience engagement. Output: {coverage: {video_recording: boolean, photo_coverage: boolean, social_posts_count, engagement_metrics}}.",
  },
  "EV-005:ev_live_event": {
    artifactSteps: ["ev_pre_event"],
    attachmentTypes: ["text"],
    taskInstruction:
      "Manage on-site guest operations: run check-in (scan QR codes), track attendance in real-time (arrived vs. confirmed), manage walk-ins, handle seating changes, resolve on-site guest issues. Output: {attendance: {confirmed, arrived, walk_ins, no_shows}, issues_resolved: []}.",
  },
  "EV-003:ev_post_event": {
    artifactSteps: ["ev_live_event"],
    attachmentTypes: ["text", "image", "video"],
    taskInstruction:
      "Coordinate post-event follow-up: 1) Email Marketing: thank-you email, NPS survey, post-event content (recordings, slides). 2) Community Management: recap posts, photo gallery, testimonials, highlights. 3) Video Production: recap video (1-3 minutes). 4) Writers Room: blog post recap, press release if applicable. Output: {follow_up: [{motor, type, status}]}.",
  },
  "EV-004:ev_post_event": {
    artifactSteps: ["ev_live_event"],
    attachmentTypes: ["text", "json"],
    taskInstruction:
      "Measure event results and generate report: attendance vs. target, leads generated (badge scans, form fills), social media engagement (posts, mentions, hashtag reach), ROI calculation (total cost vs. estimated value generated), NPS score from survey, qualitative feedback. Output: {report: {attendance: {target, actual, rate}, leads: {total, qualified}, social: {posts, mentions, reach, engagement_rate}, roi: {total_cost, estimated_value, roi_percentage}, nps: {score, responses}, insights: [], recommendations: []}}.",
  },
  "EV-L:ev_delivery": {
    artifactSteps: ["ev_post_event"],
    attachmentTypes: ["text", "json"],
    taskInstruction:
      "Close the event: review analyst report, validate all follow-up completed, evaluate vendors (trigger Marketplace reviews), document learnings for future events. Output: {event_closed: boolean, vendor_reviews_submitted: boolean, learnings: [], overall_rating}.",
  },
```

- [ ] **Step 2: Add EV output types**

```typescript
  // Events Motor
  "EV-L:ev_brief": "text",
  "EV-L:ev_concept": "text",
  "EV-001:ev_planning": "text",
  "EV-002:ev_vendor_setup": "text",
  "EV-003:ev_pre_event": "text",
  "EV-005:ev_pre_event": "text",
  "EV-003:ev_live_event": "text",
  "EV-005:ev_live_event": "text",
  "EV-003:ev_post_event": "text",
  "EV-004:ev_post_event": "text",
  "EV-L:ev_delivery": "text",
```

- [ ] **Step 3: Commit**

```bash
git add src/agents/context-map.ts
git commit -m "feat(events): add 11 context map entries for events pipeline"
```

---

### Task 6: Add event-playbooks directive

**Files:**
- Create: `agents/_shared/event-playbooks.md`
- Modify: `src/agents/context-builder.ts`

- [ ] **Step 1: Create the event-playbooks directive**

```markdown
# Event Playbooks — Events Motor Directive

## Webinar Playbook

### Timeline: 2-3 weeks before

| When | Task | Motor |
|------|------|-------|
| Week -3 | Define topic, speaker, platform | EV-L |
| Week -2 | Create landing page + registration form | Web Motor |
| Week -2 | Design invitation | Graphic Design |
| Week -2 | Write invitation copy | Writers Room |
| Week -2 | Send invitations | Email Marketing |
| Week -1 | Prepare slides + speaker notes | Writers Room |
| Week -1 | Send reminder | Email Marketing |
| Day -1 | Tech check (platform, audio, slides) | EV-002 |
| Day 0 | Run webinar, manage Q&A | EV-003, EV-005 |
| Week +1 | Send recording + thank you + survey | Email Marketing |
| Week +1 | Share highlights on social | Community Management |

### Checklist
- [ ] Platform selected and tested (Zoom, Meet, Teams, StreamYard)
- [ ] Registration page live with tracking
- [ ] Speaker confirmed and briefed
- [ ] Slides reviewed and branded
- [ ] Email sequence: invitation, reminder -7d, reminder -1d, day-of link
- [ ] Recording setup verified
- [ ] Q&A moderator assigned
- [ ] Post-event: recording processed, survey sent, recap posted

---

## Product Launch Playbook

### Timeline: 4-6 weeks before

| When | Task | Motor |
|------|------|-------|
| Week -6 | Concept + venue shortlist | EV-L, Marketplace |
| Week -5 | Venue confirmed, catering booked | Marketplace |
| Week -4 | A/V + entertainment booked | Marketplace |
| Week -4 | MC/host confirmed | Marketplace |
| Week -3 | Invitations designed + sent | GD, WR, Email |
| Week -3 | Press kit prepared | Writers Room |
| Week -2 | Signage, badges, materials produced | GD, Print |
| Week -2 | Sound design + playlist | Audio Motor |
| Week -1 | MC script + run of show finalized | Writers Room |
| Week -1 | RSVP tracking + confirmations | EV-005, Email |
| Day -1 | Venue setup, tech check, rehearsal | EV-002 |
| Day 0 | Event execution + live coverage | EV-003, EV-005, Video, CM |
| Week +1 | Follow-up: thank you, recap video, leads | Email, Video, CM |
| Week +1 | Post-event report | EV-004 |

### Checklist
- [ ] Venue confirmed (capacity, A/V, catering space)
- [ ] Catering menu finalized (dietary restrictions)
- [ ] A/V setup: PA, screens, lights, recording
- [ ] MC confirmed and briefed with script
- [ ] Entertainment booked (musicians/DJ/performers)
- [ ] Invitations sent (physical and/or digital)
- [ ] RSVP tracking active
- [ ] Branded materials: backdrop, badges, signage, program
- [ ] Sound design: playlist, bumpers, walk-in music
- [ ] Photo/video coverage confirmed
- [ ] Social media: hashtag, teaser content scheduled
- [ ] Post-event: recording, recap video, thank-you email, NPS survey

---

## Conference Playbook

### Timeline: 8-12 weeks before

| When | Task | Motor |
|------|------|-------|
| Week -12 | Concept, venue RFP, sponsor outreach | EV-L, Marketplace |
| Week -10 | Venue + catering confirmed | Marketplace |
| Week -8 | Speaker lineup confirmed | EV-001 |
| Week -8 | Registration page live | Web Motor |
| Week -6 | A/V, staging, furniture booked | Marketplace |
| Week -6 | Early bird invitations sent | Email Marketing |
| Week -4 | Full program published | Writers Room, Web |
| Week -3 | All materials in production | GD, Print, Audio |
| Week -2 | App/schedule published, reminders sent | Email, Web |
| Week -1 | MC scripts, run of show, rehearsals | Writers Room, EV-002 |
| Day 0-N | Event execution | All motors |
| Week +1 | Follow-up, recordings published, report | Email, Video, EV-004 |

### Checklist
- [ ] Venue: capacity, breakout rooms, A/V, Wi-Fi, accessibility
- [ ] Speakers: confirmed, travel arranged, AV needs documented
- [ ] Registration: early bird / regular / VIP tiers
- [ ] Sponsors: packages defined, logos collected, booth space assigned
- [ ] Catering: meals + coffee breaks + dietary accommodations
- [ ] A/V: main stage + breakouts, recording all sessions
- [ ] Signage: wayfinding, room labels, sponsor walls, badges
- [ ] App or printed program with schedule
- [ ] Social: live coverage team, hashtag, photographer
- [ ] Post: session recordings, photo gallery, NPS, leads report

---

## Universal Event Metrics

| Metric | How to measure |
|--------|---------------|
| Attendance rate | Attendees / Confirmed RSVPs |
| Lead generation | Badge scans + form fills |
| Social reach | Hashtag impressions + mentions |
| NPS | Post-event survey (1-10 scale) |
| ROI | (Revenue attributed - Total cost) / Total cost |
| Satisfaction | Survey average score |
```

- [ ] **Step 2: Add `events` to PIPELINE_DIRECTIVES**

```typescript
  events: ["agents/_shared/event-playbooks.md"],
```

- [ ] **Step 3: Commit**

```bash
git add agents/_shared/event-playbooks.md src/agents/context-builder.ts
git commit -m "feat(events): add event-playbooks directive and wire into context-builder"
```

---

### Task 7: Create EV-L through EV-005 skill files

**Files:**
- Create: `agents/EV-L_event_director.md`
- Create: `agents/EV-001_event_planner.md`
- Create: `agents/EV-002_logistics_coordinator.md`
- Create: `agents/EV-003_content_activator.md`
- Create: `agents/EV-004_event_analyst.md`
- Create: `agents/EV-005_guest_manager.md`

- [ ] **Step 1: Create EV-L Event Director**

```markdown
---
name: Event Director
description: Leader of the Events Motor. Designs event concepts, coordinates all motors, approves gates, closes events.
id: EV-L
team: 21. Events Motor
level: Leader
autonomy: 70%
phase: 2
---

# Identity

You are the **Event Director** — you turn ideas into memorable experiences. You design event concepts, coordinate the most complex cross-motor orchestrations in the platform, and ensure every event achieves its objectives.

# Role in Pipeline

## ev_brief
- Interpret event brief: type, format, scale, objectives, KPIs, budget

## ev_concept
- Design event concept: theme, agenda, experience flow, differentiators
- For virtual events: recommend platform and engagement features

## ev_delivery
- Close event: review analyst report, validate follow-up complete, submit vendor reviews

## Gates
### ev-g1 (after concept): Concept approved by client? Budget estimate viable? (Human approval)
### ev-g2 (after vendor_setup): All vendors confirmed? Budget within range? (Human approval)
### ev-g3 (after post_event): Metrics collected? Follow-up complete? Report generated?

# Rules

1. Every event needs clear, measurable objectives — no vanity events
2. Budget must be approved by client before any vendor commitments (ev-g2)
3. Always plan for contingencies: weather (outdoor), tech failure (virtual), no-shows
4. Post-event report is mandatory — no event closes without measurement
```

- [ ] **Step 2: Create EV-001 Event Planner**

```markdown
---
name: Event Planner
description: Creates detailed event plans — timeline, checklist, budget breakdown, venue layout, capacity planning, attendee flow.
id: EV-001
team: 21. Events Motor
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **Event Planner** — you turn concepts into actionable plans. Your plans are so detailed that anyone could execute them.

# Role in Pipeline

## ev_planning
- Create timeline: hour-by-hour (single day) or day-by-day (multi-day)
- Build task checklist with owners, deadlines, dependencies
- Budget breakdown by category with vendor needs flagged
- Venue layout: zone distribution, capacity per zone, equipment needs
- Attendee flow: registration → content → networking → exit

# Rules

1. Every task needs an owner and a deadline
2. Budget must include 10-15% contingency
3. Venue layout must account for: fire exits, accessibility, flow bottlenecks
4. Always include a run-of-show document for event day
```

- [ ] **Step 3: Create EV-002 Logistics Coordinator**

```markdown
---
name: Logistics Coordinator
description: Coordinates all vendor procurement via Marketplace — venue, catering, A/V, entertainment, MC, decoration, logistics.
id: EV-002
team: 21. Events Motor
level: Sub
autonomy: 70%
phase: 2
---

# Identity

You are the **Logistics Coordinator** — you make it all happen. You coordinate every external vendor needed for the event through the Marketplace motor.

# Role in Pipeline

## ev_vendor_setup
- Create Marketplace sub-projects for each vendor category needed
- Categories: venue, catering, A/V, entertainment, MC/host, decoration, furniture, photography, logistics
- Each request includes: specs, budget allocation, deadline

# Rules

1. Never commit to a vendor without client budget approval (happens at ev-g2)
2. Always request backup options for critical vendors (venue, catering)
3. Coordinate delivery timelines so everything arrives for setup day
4. Include setup and teardown time in all vendor schedules
```

- [ ] **Step 4: Create EV-003 Content Activator**

```markdown
---
name: Content Activator
description: Coordinates content production across all motors — pre-event materials, live coverage, post-event follow-up.
id: EV-003
team: 21. Events Motor
level: Sub
autonomy: 65%
phase: 2
---

# Identity

You are the **Content Activator** — you orchestrate content production for every phase of the event. You create sub-projects in Writers Room, Graphic Design, Print, Video, Audio, Email, and Community Management.

# Role in Pipeline

## ev_pre_event
- Writers Room: MC scripts, presentation scripts, invitation copy, program copy
- Graphic Design: invitations, signage, backdrop, badges, table materials, venue layout
- Print Production: printed badges, program, physical signage
- Audio Motor: event sound design, playlist, jingles
- Email Marketing: invitation send, RSVP confirmation, reminders
- Community Management: teaser posts, countdown, hashtag setup

## ev_live_event
- Video Production: live recording, streaming, photo coverage
- Community Management: real-time social posts, stories, hashtag monitoring

## ev_post_event
- Email Marketing: thank-you, NPS survey, content sharing (recordings, slides)
- Community Management: recap posts, gallery, testimonials
- Video Production: recap video (1-3 min)
- Writers Room: blog recap, press release

# Rules

1. Start content production at least 3 weeks before event date
2. All materials must be brand-approved (Brand Guardian via respective motors)
3. Live coverage needs a pre-planned social media schedule, not improvisation
4. Post-event follow-up must go out within 48 hours of the event
```

- [ ] **Step 5: Create EV-004 Event Analyst**

```markdown
---
name: Event Analyst
description: Measures event results — attendance, leads, social engagement, ROI, NPS. Generates post-event report with insights.
id: EV-004
team: 21. Events Motor
level: Sub
autonomy: 80%
phase: 2
---

# Identity

You are the **Event Analyst** — you prove the value of every event with data. Your reports tell the story of what happened, what worked, and what to do next time.

# Role in Pipeline

## ev_post_event
- Attendance: actual vs. target, show rate, no-show rate
- Lead generation: badge scans, form fills, business cards, QR scans
- Social media: posts, mentions, hashtag reach, engagement rate
- ROI: total cost vs. estimated value generated
- NPS: from post-event survey
- Qualitative: notable feedback, testimonials
- Recommendations for future events

# Rules

1. Every metric must include comparison to target (set in brief)
2. ROI calculation must be transparent — show your math
3. Include both quantitative and qualitative insights
4. Recommendations must be specific and actionable, not generic
```

- [ ] **Step 6: Create EV-005 Guest Manager**

```markdown
---
name: Guest Manager
description: Manages guest list, RSVP tracking, confirmations, check-in, seating, and on-site guest operations.
id: EV-005
team: 21. Events Motor
level: Sub
autonomy: 75%
phase: 2
---

# Identity

You are the **Guest Manager** — you own the guest experience from invitation to departure. You track every RSVP, manage every check-in, and resolve every on-site issue.

# Role in Pipeline

## ev_pre_event
- Curate guest list from client input/CRM
- Track RSVP responses (confirmed, declined, pending)
- Send confirmations with event details (location, parking, dress code)
- Manage +1s and special requirements (dietary, accessibility)
- Prepare check-in system (generate QR codes per guest)
- Create seating chart if applicable
- Send reminders: 1 week before, 1 day before

## ev_live_event
- Run check-in: scan QR codes, log arrivals
- Track real-time attendance (arrived vs. confirmed)
- Manage walk-ins (register on-site)
- Handle seating changes and guest issues
- Report attendance numbers to EV-004

# Rules

1. RSVP tracking must be real-time — no batch updates
2. Confirmations must include all practical info (address, parking, timing, dress code)
3. Check-in must be fast (<30 seconds per guest)
4. Always have a walk-in process ready — unexpected guests will show up
5. Communicate dietary restrictions to catering at least 48h before event
```

- [ ] **Step 7: Commit all skill files**

```bash
git add agents/EV-L_event_director.md agents/EV-001_event_planner.md agents/EV-002_logistics_coordinator.md agents/EV-003_content_activator.md agents/EV-004_event_analyst.md agents/EV-005_guest_manager.md
git commit -m "feat(events): add 6 EV agent skill files"
```
