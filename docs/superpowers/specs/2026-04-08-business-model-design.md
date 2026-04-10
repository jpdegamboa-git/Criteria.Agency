# criteria.agency — Business Model Design

> Date: April 8, 2026
> Status: Approved design
> Scope: Revenue model, pricing tiers, token economy, cost structure, unit economics

---

## 1. Positioning

**Against traditional agencies, on all three fronts simultaneously:**

- **Price:** 5-10x cheaper than a traditional agency retainer
- **Quality:** AI motors with quality gates, Brand Guardian, and human expert oversight produce consistent, professional output
- **Access:** Gives PyMEs in LATAM what only companies with $5,000+/month budgets could afford — a full marketing department

**Target replacement:**
- Tier 1 replaces the freelancer/community manager ($300-500/month for generic posts)
- Tier 2 replaces the small agency ($2,000-3,000/month retainer)
- Tier 3 replaces the internal marketing team or serves agencies who resell

---

## 2. Four Revenue Streams

| Stream | Type | Margin | Notes |
|--------|------|--------|-------|
| **Subscription** | Recurring monthly | 65-85% | Platform access + included tokens + features per tier |
| **Token overage** | Variable, usage-based | 60-80% | Tokens purchased beyond what's included in the tier |
| **Ad spend commission** | Variable, % of managed spend | ~100% (APIs are free) | Client deposits ad budget upfront, criteria.agency takes commission and executes |
| **Professional services** | One-time or packages | 40-70% | Workshops with human experts, pre-recorded workshops (cheaper), onboarding services |

---

## 3. Token Economy

### What is a token

A universal unit of consumption. Every action that produces something tangible costs tokens. The client sees tokens; criteria.agency knows the real cost behind each token.

### What costs tokens (production)

Any action where AI generates or produces a deliverable:

- Image generation
- Video generation (clips + iterations)
- Audio generation
- Email rendered and sent
- Report/document generated
- Content published to a platform

### What does NOT cost tokens (intelligence — included in subscription)

- Strategist analyzing, evaluating, recommending
- Creative Director proposing versions
- Showrunner validating campaign coherence
- Brand Guardian checking consistency
- Financial Agent calculating budgets
- Listeners monitoring markets and competition
- Opportunity Agent detecting opportunities
- Copilot conversations
- Dashboard and analytics views
- CRM operations (lead tracking, scoring, pipeline management)

**Principle:** The brain is free. The hands cost tokens. The client should never feel penalized for asking the platform to think more.

### Token pricing

Tokens are sold at a fixed price per tier. The internal cost per token varies by what's being produced. criteria.agency's margin is the spread between sale price and production cost.

**Internal cost drivers per token:**
- LLM inference (cheapest: $0.001-0.01 per interaction)
- Image generation (moderate: $0.02-0.08 per image)
- Video generation (expensive: $0.10-0.50 per clip, and 1 final video = ~10 clips × ~5 iterations = ~50 generations)
- Audio generation (moderate: $0.05-0.20 per segment)

**Cost trend:** AI generation costs decrease ~50% every 12-18 months. Token pricing can remain stable while margins improve, or prices can decrease to grow market share.

### Approximate token consumption guide (for client communication)

| Action | Approximate tokens | Notes |
|--------|-------------------|-------|
| Social media post (image + copy) | ~15 | Image generation + Writer agent |
| Carousel (5 slides) | ~40 | Multiple image generations + layout |
| Story/reel thumbnail | ~10 | Single image |
| Short video (15 sec) | ~300 | ~6 clips × ~4 iterations + audio + editing |
| Standard video (30 sec) | ~600 | ~10 clips × ~5 iterations + audio + editing |
| Long video (60 sec) | ~1,200 | ~20 clips × ~5 iterations + audio + editing |
| Email campaign | ~10 | Copy + design + sending |
| Blog post / SEO article | ~25 | Writer + SEO optimization |
| Landing page | ~50 | Design + development + copy |
| Monthly report (PDF) | ~20 | Analytics compilation + design |

> These are estimates shown to the client. Actual consumption may vary by complexity. The platform shows real-time token usage during production.

---

## 4. Subscription Tiers

### Tier 1: Starter — $99/month

**Target:** Emprendedor, freelancer, PyME nasciente. One person doing everything.

| Feature | Included |
|---------|----------|
| Tokens | 15,000/month |
| Tokens adicionales | $0.010/token |
| Users | 2 |
| Brands | 1 |
| Active campaigns | 3 |
| Storage | 5 GB (can purchase up to 15 GB at $2/GB/month, beyond that → upgrade to Pro) |
| Ad spend commission | 20% |
| Motors | All |
| Listeners | 1 (competitive) |
| Mi Negocio config | Manual + Copilot |
| CRM/Sales | Basic (pipeline view, manual lead entry) |
| Reports | Monthly auto-generated |
| Support | Copilot |
| White-label | No |

**What 15,000 tokens produces (typical month):** ~3 short videos + 40 social posts + 8 emails + strategy + reports. Or fewer videos and more posts. Client decides.

**Replaces:** $300-500/month freelancer community manager — but with strategy, multi-channel, video, CRM, and intelligence included.

### Tier 2: Pro — $249/month

**Target:** PyME established with a small team (3-10 people). Has a marketing person, a salesperson, the owner.

| Feature | Included |
|---------|----------|
| Tokens | 75,000/month |
| Tokens adicionales | $0.006/token |
| Users | 10 |
| Brands | 3 (shared token pool, individual consumption tracking) |
| Active campaigns | 15 |
| Storage | 25 GB (can purchase up to 75 GB at $2/GB/month, beyond that → upgrade to Agency) |
| Ad spend commission | 15% |
| Motors | All |
| Listeners | All (4) |
| Mi Negocio config | Manual + Copilot |
| CRM/Sales | Complete (scoring, automation, proposals) |
| Reports | Weekly + custom |
| Support | Copilot + email |
| White-label | No |

**What 75,000 tokens produces (typical month):** ~15 videos + 200 social posts + 40 emails + multiple campaigns across channels + full reports. Serious marketing operation.

**Replaces:** $2,000-3,000/month small agency retainer — at 1/10 the cost with more capabilities.

### Tier 3: Agency — $599/month

**Target:** Marketing agencies reselling to their clients. Medium companies with large teams. Multi-brand operations.

| Feature | Included |
|---------|----------|
| Tokens | 300,000/month |
| Tokens adicionales | $0.004/token |
| Users | Unlimited |
| Brands | Unlimited (shared token pool, individual consumption tracking per brand) |
| Active campaigns | Unlimited |
| Storage | 100 GB (can purchase up to 500 GB at $1/GB/month, beyond that → custom) |
| Ad spend commission | 10% |
| Motors | All |
| Listeners | All + custom sources |
| Mi Negocio config | All + 1 workshop with human experts/year included |
| CRM/Sales | Complete + advanced |
| Reports | All + white-label (agency's brand, not criteria.agency) |
| Support | Copilot + dedicated |
| White-label | Yes — the agency's clients see the agency's brand, not criteria.agency |

**What 300,000 tokens produces (typical month):** ~60 videos + 800 social posts + 200 emails + unlimited campaigns. Enough to serve 5-10 agency clients.

**White-label details:**
- Agency's logo, colors, and domain (app.agencyname.com or custom subdomain)
- Client-facing portal shows agency's brand throughout
- Reports, emails, and notifications branded as the agency
- criteria.agency is invisible to the agency's end clients
- Agency manages all brands under one account with per-brand token tracking for internal billing

**Replaces:** Internal marketing team (3-5 people at $3,000-5,000/person = $9,000-25,000/month) or enables agencies to serve more clients without hiring.

---

## 5. Ad Spend Management (Intermediation)

### Model

criteria.agency acts as media intermediary. The client deposits ad budget upfront (pre-paid), criteria.agency takes a commission and executes the spend on platforms (Meta, Google, TikTok, LinkedIn, etc.).

### How it works

1. Client decides to run paid media (Strategist recommends channels and budget)
2. Client deposits funds: ad budget + commission (e.g., $500 budget + $100 commission at 20% = $600 total)
3. criteria.agency's Paid Media Operator configures, launches, and optimizes campaigns on platforms
4. Client sees transparent dashboard: total deposited, commission, actual spend, remaining balance, performance metrics
5. When balance runs low, platform prompts for top-up

### Commission by tier

| Tier | Commission | Rationale |
|------|-----------|-----------|
| Starter | 20% | Lower volume, higher relative cost of service |
| Pro | 15% | Medium volume, loyalty reward |
| Agency | 10% | High volume, agency already adds their own markup to end clients |

### Pre-payment eliminates risk

- No credit risk: criteria.agency never spends money it hasn't already received
- Client sees real-time balance: "You have $320 remaining in your Meta Ads fund"
- Auto-pause when balance reaches $0 — no surprises
- Platform can offer auto-top-up (client sets a threshold and amount)

### Technical implementation

- criteria.agency operates a Business Manager / MCC (My Client Center) on each ad platform
- Client ad accounts are created under criteria.agency's Business Manager
- No OAuth needed — criteria.agency has native access
- Client doesn't need to understand Meta Business Manager or Google Ads
- If client leaves criteria.agency, their ad account data can be exported or transferred

### Transparency dashboard (in Client Portal)

The client always sees:
- Total deposited this month
- Commission taken (clearly labeled as "management fee")
- Actual platform spend
- Remaining balance
- Performance per platform (ROAS, CPA, CTR)
- Strategist recommendations for budget adjustment

---

## 6. Storage Model

### Included per tier

| Tier | Included | Max purchasable | Overage price | Beyond max |
|------|----------|-----------------|---------------|------------|
| Starter | 5 GB | Up to 15 GB | $2/GB/month | Must upgrade to Pro |
| Pro | 25 GB | Up to 75 GB | $2/GB/month | Must upgrade to Agency |
| Agency | 100 GB | Up to 500 GB | $1/GB/month | Custom pricing |

### What counts as storage

- Generated assets (images, videos, audio, documents)
- Uploaded files (brand assets, client documents, research PDFs)
- Brand DNA and configuration data
- Campaign history and artifacts

### Archival policy

When storage limit is reached and client doesn't purchase more:
- Platform warns at 80% and 95%
- At 100%: new generation paused, but all existing assets remain accessible
- Client can delete old assets to free space, or purchase more, or upgrade tier
- No automatic deletion ever — client data is sacred

---

## 7. Professional Services (Workshops)

### Two types

| Type | Delivery | Price range | Margin |
|------|----------|-------------|--------|
| **Pre-recorded workshops** | Video courses + interactive exercises. Produced once, sold many times. | $29-99 per workshop | ~90% (production cost amortized) |
| **Live workshops with experts** | Human expert + AI copilot guiding the client through Brand DNA, strategy, etc. | $500-2,000 per session | 40-60% (human cost) |

### Pre-recorded workshops (examples)

| Workshop | What it covers | Price |
|----------|---------------|-------|
| Brand DNA Essentials | Build your brand identity step by step | $49 |
| Marketing Strategy 101 | Define audiences, channels, and budget | $49 |
| Content That Converts | Principles of effective marketing content | $29 |
| Ads Masterclass | Set up and optimize paid campaigns | $79 |
| Full Brand Builder | Complete brand + strategy + identity | $99 |

### Live workshops with experts

| Workshop | What it covers | Duration | Price |
|----------|---------------|----------|-------|
| Brand DNA Deep Dive | Full brand strategy with expert guidance | 4-6 hours | $1,000-1,500 |
| Marketing Strategy Session | Comprehensive marketing plan | 3-4 hours | $800-1,200 |
| Campaign Review | Expert review of active campaigns + recommendations | 2 hours | $500-800 |
| Quarterly Business Review | Strategy review + next quarter planning | 3 hours | $800-1,200 |

### Relationship with tiers

- All tiers can purchase any workshop
- Agency tier includes 1 live workshop per year
- Pre-recorded workshops are available to all tiers
- Workshops improve Mi Negocio depth → improves Brand Health Score (Fundamentos axis) → natural incentive

---

## 8. Multi-User Purpose and Roles

### Why multi-user

Each person on the client's team sees and acts on what matters to them. The marketing person sees campaigns. The salesperson sees the CRM. The owner sees the Brand Health Score. Not everyone needs access to everything.

### Roles

| Role | What they see | What they can do | Typical person |
|------|--------------|------------------|----------------|
| **Owner** | Everything | Everything including billing, team management, account deletion | Founder, CEO |
| **Admin** | Everything except billing | Manage campaigns, settings, team (not billing) | Marketing director, operations |
| **Editor** | Campaigns, content, CRM | Create, edit, approve — not manage team or billing | Marketing specialist, designer, content creator |
| **Salesperson** | CRM, relevant campaign data | Manage leads, pipeline, proposals — limited campaign access | Sales team |
| **Viewer** | Dashboards, reports, campaign status | Read-only — can comment but not create or edit | External stakeholder, partner, investor |

### Multi-brand management (Pro and Agency)

- All brands share one token pool
- Dashboard shows token consumption per brand (for internal billing/tracking)
- Each brand has its own: Brand DNA, campaigns, content, audiences, Brand Health Score
- Each brand can have its own user permissions (user X can edit Brand A but only view Brand B)

---

## 9. White-Label (Agency Tier)

### What it includes

The Agency tier can operate criteria.agency under their own brand:

| Component | White-labeled |
|-----------|--------------|
| **Domain** | Custom subdomain (app.agencyname.com) or full custom domain |
| **Logo and colors** | Agency's visual identity throughout the portal |
| **Client portal** | Agency's end-clients see the agency's brand, never criteria.agency |
| **Reports** | Generated with agency's logo, colors, and contact info |
| **Emails/notifications** | Sent from agency's domain |
| **Copilot** | Can be named and branded as the agency's AI assistant |
| **Onboarding** | Agency's welcome flow |

### What is NOT white-labeled

- Admin portal (the agency sees criteria.agency branding in their admin view)
- Technical infrastructure (obvious)
- API documentation (if exposed)

### Agency business model enabled

The agency operates criteria.agency as their backend:
1. Agency signs up for Agency tier ($599/month + token overage)
2. Creates brands for each of their clients
3. Each client gets a white-labeled portal login
4. Agency charges their clients whatever they want (e.g., $1,500/month/client)
5. Agency tracks token consumption per brand to manage profitability
6. Agency buys token overage as needed
7. criteria.agency is invisible — the agency IS the product in the client's eyes

### Margin for the agency

If agency charges $1,500/month per client and serves 10 clients:
- Agency revenue: $15,000/month
- criteria.agency cost: $599/month + ~$1,500 in token overage (10 brands × moderate usage) = ~$2,100/month
- Agency margin: ~$12,900/month (86%)

This makes criteria.agency a margin multiplier for agencies.

---

## 10. Free Trial (by invitation)

### Model

No free tier. Invitation-only free trial.

### Trial details

| Feature | Trial |
|---------|-------|
| Duration | 14 days |
| Tokens | 2,000 (enough for: brand analysis + a few posts + 1 short video + see the value) |
| Access | Full platform (Starter-level features) |
| Credit card | Not required to start. Required to continue after 14 days or when tokens run out |
| Invitation | Required — invite code from existing client, partner, or criteria.agency directly |

### Trial flow

1. Receive invitation (email/link with invite code)
2. Register (name, email, password)
3. Onboarding: "¿Tienes marca?" → URLs or Brand Builder
4. Platform analyzes brand, generates Brand Health Score, Strategist shows recommendations
5. Client explores with 2,000 tokens — generates first pieces, sees the potential
6. Day 12: "Your trial ends in 2 days. Choose a plan to continue."
7. Conversion or expiration (data preserved for 30 days in case they return)

### Why invitation-only

- Controls onboarding quality (no flood of spam signups)
- Creates exclusivity ("I got invited to criteria.agency")
- Existing clients become evangelists (referral program potential)
- Allows criteria.agency to manage growth pace and server costs

---

## 11. Unit Economics Summary

### Per-client economics (estimated averages)

| | Starter ($99) | Pro ($249) | Agency ($599) |
|--|---------------|------------|---------------|
| Subscription revenue | $99 | $249 | $599 |
| Token overage (avg) | $20 | $60 | $200 |
| Ad commission (avg) | $100 (20% of $500) | $300 (15% of $2,000) | $1,000 (10% of $10,000) |
| **Total revenue/client/month** | **~$219** | **~$609** | **~$1,799** |
| AI costs (tokens + generation) | ~$30 | ~$120 | ~$350 |
| Infrastructure (pro-rata) | ~$3 | ~$5 | ~$10 |
| **Total cost/client/month** | **~$33** | **~$125** | **~$360** |
| **Gross margin** | **$186 (85%)** | **$484 (79%)** | **$1,439 (80%)** |

### 100-client scenario (60 Starter / 30 Pro / 10 Agency)

| Metric | Amount |
|--------|--------|
| Monthly revenue | ~$43,000 |
| Monthly variable costs | ~$8,500 |
| Monthly gross profit | ~$34,500 |
| Fixed costs (infra, tools, team) | ~$5,000 |
| **Monthly operating profit** | **~$29,500** |
| **Annual operating profit** | **~$354,000** |

### 500-client scenario (300 Starter / 150 Pro / 50 Agency)

| Metric | Amount |
|--------|--------|
| Monthly revenue | ~$215,000 |
| Monthly variable costs | ~$42,500 |
| Monthly gross profit | ~$172,500 |
| Fixed costs (infra, tools, team) | ~$20,000 |
| **Monthly operating profit** | **~$152,500** |
| **Annual operating profit** | **~$1,830,000** |

---

## 12. Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Token as universal unit | All production consumption measured in tokens | Client understands one unit. criteria.agency controls margin via internal cost mapping |
| Brain is free, hands cost | Intelligence agents don't consume client tokens | Client should never be penalized for asking the platform to think |
| Pre-paid ad intermediation | Client deposits upfront, criteria.agency executes | Zero credit risk + commission revenue stream (~100% margin) |
| Commission decreases with tier | 20% / 15% / 10% | Rewards volume, incentivizes tier upgrades |
| Storage caps force tier upgrades | Buy more up to a limit, then upgrade | Natural tier progression without hard blocks |
| Invitation-only trial | No free tier, 2,000 token trial by invite | Controls quality, creates exclusivity, manages costs |
| White-label for agencies | Agency tier includes full white-label | Makes criteria.agency a margin multiplier for agencies |
| Workshops separate from subscription | Pre-recorded (cheap) + live (premium) | Additional revenue stream, improves Brand Health Score, natural upsell |
| Shared token pool for multi-brand | One pool, per-brand tracking | Simpler billing, agency can track per-client internally |

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI costs rise instead of falling | Margin compression | Token pricing can be adjusted. Multi-model strategy (use cheapest model that meets quality threshold) |
| Client produces only video (high cost) | Negative margin on that client | Token system naturally handles this — video costs more tokens. If client burns through tokens, they buy more |
| Ad platform ToS changes | Lose ability to intermediate | Maintain OAuth backup (client connects directly). Diversify across platforms |
| Agency client churns with end-clients | Lose multiple brands at once | Per-brand value demonstration. Make migration painful (data, Brand DNA, campaign history) |
| Token price too high, client feels nickeled | Churn | Generous included tokens. Clear consumption dashboard. Predictable costs |
| Token price too low, margin collapses | Unsustainable | Internal cost monitoring. Automatic margin alerts. Adjust token-to-cost mapping |
