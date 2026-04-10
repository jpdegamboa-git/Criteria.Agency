# criteria.agency — Growth Strategy

> Date: April 9, 2026
> Status: Active — pre-implementation
> Scope: Bootstrapped growth from $0 to sustainable revenue, startup credits, GTM, client acquisition
> Context: Solo founder, no external capital, LATAM market focus

---

## 1. Reality Check

criteria.agency is a bootstrapped project with zero capital. The founder (Juan Pablo) is a solo operator with 20+ years in film/video production and deep understanding of marketing for creative businesses. The product is an AI-powered marketing agency SaaS with 24 motors, ~29 agents, and a token-based pricing model.

The project has extensive design (10+ specs, 147 decisions) but zero implementation. The gap between design and first paying client is the critical challenge. Every decision in this document optimizes for one thing: **shortest path to first revenue with zero cash outlay.**

---

## 2. The Free Runway

### Startup credit programs

The AI startup ecosystem in 2026 offers generous credit programs that can fund 6-12 months of development and early operations at $0 cost.

| Program | Credits | What it covers | Application effort | Priority |
|---------|---------|---------------|-------------------|----------|
| **Anthropic Startup Program** | $25K Claude API (12 months) | The dominant cost — all LLM invocations for development and first clients | Airtable form, ~2 week review | **Immediate** |
| **Google for Startups (AI First)** | $250K GCP Year 1, $100K Year 2 | Could host entire backend on GCP instead of Railway, plus $10K Anthropic bonus | Application + review, equity-free | **Immediate** |
| **Cloudflare for Startups** | $5K (self-funded tier) | R2 storage, Workers (if needed), CDN | Simple application | **Week 1** |
| **AWS Activate** | Up to $100K | Fallback: host on AWS, or use Bedrock for Claude access | Application, need to describe startup | **Week 2** |
| **Microsoft for Startups** | $5K-$150K Azure | Fallback model providers via Azure OpenAI | Application, basic path = $5K | **Week 2** |

**Critical path:** Apply to Anthropic and Google for Startups immediately. These two alone provide $275K+ in credits — enough for 12-18 months of full operation. The Anthropic credits are the most important because LLM API costs are 80%+ of variable expenses.

**If Google for Startups is accepted:** Reconsider hosting on GCP (Cloud Run for backend, Cloud SQL for PostgreSQL) instead of Railway + Neon. $250K of GCP credits makes the hosting question irrelevant for Year 1.

### Free tier stack

Even without credit programs, the entire development phase and first 5-10 clients can run on free tiers:

| Service | Free Tier | Months until outgrown |
|---------|-----------|----------------------|
| Vercel | 100GB bandwidth, 1M functions | 6-12 months |
| Neon | 100 CU-hours, 0.5GB storage | 3-6 months (storage is the limit) |
| Upstash Redis | 256MB, 500K commands | 12+ months |
| Inngest | 50K executions/month | 6-12 months |
| Helicone | 10K requests/month | 3-6 months |
| PostHog | 1M events/month | 12+ months |
| BetterStack | 10 monitors, 100K exceptions | 12+ months |
| Better Auth | Open source, $0 | Forever |
| Drizzle | Open source, $0 | Forever |
| Vercel AI SDK | Open source, $0 | Forever |
| Cloudflare R2 | 10GB free + startup credits | 12+ months |

**The first service that breaks:** Neon's 0.5GB storage, around client 5-10. Upgrade to Launch tier ($19/month). At that point, one Starter client ($99/month) covers it 5x over.

---

## 3. Go-to-Market: CriteriaFilms First

### The dogfooding advantage

CriteriaFilms.com is already defined as criteria.agency's first client (SESSION_CONTEXT §1). This is the single most important growth asset:

**CriteriaFilms as proof of concept.** Before selling to anyone, criteria.agency runs its own marketing through the platform. Every feature gets battle-tested. Every bug gets discovered by the founder, not a paying client. The Brand Health Score, the Funnel Matrix, the Strategist recommendations — all demonstrated on a real brand with real campaigns.

**CriteriaFilms as case study.** "We used our own platform to grow CriteriaFilms from X to Y" is the most powerful sales argument possible. It's not a demo — it's a live, public example of the platform working. The public-facing CriteriaFilms.com website, its social presence, its campaigns — all become portfolio pieces.

**CriteriaFilms as content engine.** CriteriaFilms produces video content. criteria.agency can produce marketing content about itself. The platform markets itself using its own motors — a recursive proof of capability.

### Launch sequence

**Phase 0: Build in public (months 1-3)**

Before the product exists, start building the audience:

- criteria.agency landing page (static, built with Next.js public portal) with the value proposition: "Tu director de marketing virtual. 24 motores de IA. Desde $99/mes."
- Waitlist with email capture
- Weekly content (LinkedIn, Twitter/X, YouTube) showing the build process: "Building an AI marketing agency from scratch." Film/video production background makes content creation natural — this is Juan Pablo's core skill.
- Share design decisions, architectural thinking, the "why" behind the platform. The 147 decisions are content gold.

**Phase 1: CriteriaFilms live (months 3-6)**

- Launch minimum viable platform with Brand Builder + Strategist + Analyst system functions
- Run CriteriaFilms through the platform end-to-end
- Document everything: Brand Health Score progression, first campaign, first optimization cycle
- Publish the Platform Intelligence quarterly report (DEC-117) even with N=1 — it's criteria.agency's own data, framed as a case study

**Phase 2: Beta clients (months 6-9)**

- Invite 5-10 beta clients from the waitlist. Criteria: small businesses in Panama/LATAM that Juan Pablo can support directly
- Free tier (Starter) during beta — no revenue, but real usage data, real feedback, real Platform Intelligence contributors
- Beta agreement: clients get free access for 3 months in exchange for feedback and a testimonial
- Goal: validate that the platform works for businesses that are NOT CriteriaFilms

**Phase 3: First revenue (months 9-12)**

- Convert beta clients to paid Starter ($99/month)
- Open waitlist to paying customers
- Target: 10 paying clients by month 12 = $990/month MRR
- At 10 clients: Platform Intelligence starts having real cross-client value (approaching K=5 for some dimensions)

---

## 4. Client Acquisition Channels

### Channel 1: Content marketing (owned — $0 cost)

The platform builds its own marketing using its own motors. This is the primary channel and the most authentic proof of capability.

**Content types:**
- Build-in-public series (video, blog, social) — Juan Pablo's background makes this natural
- AI marketing education: "How AI can replace your marketing agency" — educational content that positions criteria.agency as the answer
- Case studies: CriteriaFilms results, then beta client results (anonymized if needed)
- Platform Intelligence quarterly report (DEC-117) — positions criteria.agency as a thought leader in LATAM marketing data

**Distribution:**
- LinkedIn (primary for B2B in LATAM)
- YouTube (video content — core competency)
- Twitter/X (tech/startup audience)
- criteria.agency blog (SEO play, long-term)

### Channel 2: Community (earned — $0 cost)

**LATAM startup ecosystem.** Panama has a growing startup scene. Juan Pablo's network in film/creative industries is an entry point to businesses that need marketing but can't afford an agency.

**Target communities:**
- LATAM startup Slack/Discord groups
- Panama City entrepreneur meetups
- Chambers of commerce (small business focus)
- Marketing professional groups in Spanish

**The pitch is simple:** "¿Estás pagando $2,000-5,000/mes por una agencia de marketing? ¿O haciendo todo tú mismo? criteria.agency te da un equipo de marketing completo por $99/mes."

### Channel 3: Referrals (product-driven — $0 cost)

- Every Starter client is a potential referrer
- Referral incentive: 1 month free for referrer + 1 month free for referred (token cost absorbed)
- Agency tier includes white-label — agencies become distribution channels

### Channel 4: Partnerships (relationship-driven — $0 cost)

- **Design agencies** that don't do marketing: criteria.agency becomes their marketing arm
- **Accountants/consultants** who serve small businesses: referral partnerships
- **CoWorking spaces** in Panama/LATAM: workshop partnerships (Brand Builder workshops as in-person events)

### Channel 5: Paid acquisition (future — when revenue allows)

Not before having 20+ paying clients and validated unit economics. Paid acquisition for a $99/month product needs LTV/CAC to be proven first.

---

## 5. Pricing Strategy for Growth

### The free observation layer is the growth engine

DEC-100 says: observe free, think costs tokens, produce costs tokens. This isn't just a pricing decision — it's a growth strategy:

**Free dashboards, free Brand Health Score, free Listener signals, free MARA data queries.** A Starter client at $99/month gets more free functionality than most analytics tools charge for. The free observation layer makes the platform sticky before the client ever spends a token on strategy or content production.

**The Brand Health Score drives upsell.** A client at 42/100 with a weak Fundamentos axis sees: "Tu marca está en Layer 1. Un workshop de posicionamiento podría subir tu score 20 puntos." That's a $500-2,000 workshop sale driven by a free metric.

**The Funnel Matrix reveals gaps.** Empty cells in the matrix are visual upsell: "No tienes actividad en Email × Retention. Una campaña automatizada aquí podría capturar el 30% de clientes que no repiten." That's a token-consuming campaign creation triggered by a free visualization.

### Token economics must be validated early

The token pricing ($99 for 15K tokens Starter, $249 for 75K Pro, $599 for 300K Agency) is theoretical. The Helicone LLM observability tool is critical for validating:

- How many tokens does a typical Strategist planning session consume?
- How many tokens does a monthly report cost?
- What's the token cost of running CriteriaFilms through the platform for a month?
- At $99/month with 15K tokens, can a Starter client actually do meaningful work?

If 15K tokens isn't enough for a useful month, the pricing is wrong and needs adjustment before public launch. CriteriaFilms and beta clients provide the data to calibrate.

---

## 6. Competitive Positioning

### What criteria.agency is NOT

It's not a chatbot. It's not a "AI content generator." It's not Canva with AI. It's not Jasper or Copy.ai.

### What criteria.agency IS

**A complete marketing department in a box.** Strategy + execution + measurement + optimization, continuous, learning, improving. The competitive comparison is: "How much does it cost to hire a marketing team of 5?" ($15,000-25,000/month in LATAM). "How much does criteria.agency cost?" ($99-599/month).

### The moat

**Platform Intelligence (DEC-092).** Every client that uses the platform makes it smarter for every other client. A competitor can copy the UI, the motors, even the agent architecture. They can't copy the accumulated learning from hundreds of campaigns across LATAM industries. This moat compounds over time — the earlier criteria.agency launches, the deeper the moat.

**The quarterly PI report (DEC-117)** makes the moat visible and public. "Based on 500 campaigns across 12 LATAM industries, here's what works." No competitor can produce this without the data.

---

## 7. Key Metrics to Track

### North Star Metric

**Monthly active campaigns across all clients.** Not MRR, not user count. Active campaigns are the leading indicator of everything: token consumption (revenue), Platform Intelligence growth (moat), client retention (satisfaction), and platform health.

### Supporting metrics

| Metric | Why it matters | Target (Year 1) |
|--------|---------------|-----------------|
| MRR | Revenue sustainability | $990 (10 Starter clients) by month 12 |
| Clients | Scale | 10 paying by month 12 |
| Active campaigns | Platform health | 30+ across all clients |
| Token utilization | Pricing validation | 60-80% of included tokens used per client |
| Brand Health Score average | Client engagement | Rising month-over-month per client |
| PI contributions | Moat building | 50+ Learning Records by month 12 |
| Churn rate | Product-market fit | <5% monthly |
| Waitlist size | Market interest | 200+ by month 6 |
| Content engagement | Channel health | Growing week-over-week |

---

## 8. Risk Mitigation

### Risk: LLM costs exceed token revenue

**Mitigation:** Helicone monitoring from day 1. Two-pattern invocation (generateText for simple, agent for complex) reduces overhead ~37%. MARA Output Registry reduces redundant invocations. 3+3 rule caps iterations. System functions handle 95% of Analyst work at zero LLM cost. Cost caps per agent per day. If unit economics don't work, adjust token allocations per tier before scaling.

### Risk: No one signs up

**Mitigation:** CriteriaFilms as proof of concept removes the "does it work?" objection. Beta clients at $0 remove the "is it worth the money?" barrier. Content marketing starts before the product exists — build audience first. If after 6 months of content and beta there's no interest, pivot the positioning (not the product).

### Risk: Solo founder bottleneck

**Mitigation:** Automation is the product. The platform should eat its own dogfood to the maximum extent: criteria.agency's marketing runs on criteria.agency. Customer support questions go through MARA first. Only escalations reach Juan Pablo. As revenue grows, first hire is customer success (handles the 20% of questions MARA can't).

### Risk: Anthropic API dependency

**Mitigation:** Vercel AI SDK is model-agnostic. Switching from Claude to GPT-4 or Gemini is a configuration change, not an architecture change. Google for Startups credits include GCP (Gemini access). AWS Activate credits include Bedrock (Claude + other models). Multi-provider credits reduce single-vendor risk.

### Risk: Credit programs rejected

**Mitigation:** Apply to all five programs. Probability of being rejected by ALL is low. Even without any credits, the free tier stack covers everything except LLM API. At worst, LLM costs during development are $50-100/month — manageable with personal savings for 3-6 months. Reduce LLM usage during development by using mock mode (already implemented in the Video motor) and only hitting real APIs for validation.

---

## 9. Timeline Summary

| Month | Milestone | Revenue | Cost |
|-------|-----------|---------|------|
| 0 | Apply to all credit programs. Register free tier accounts. Start content. | $0 | $0 |
| 1-3 | Build MVP (Brand Builder + Analyst system functions + basic portal). Content weekly. | $0 | $0 (credits) |
| 3-4 | CriteriaFilms live on platform. First case study. | $0 | $0 (credits) |
| 4-6 | Strategist + MARA operational. Beta invites to 5-10 waitlist clients. | $0 | ~$10/mo |
| 6-9 | Beta feedback → iterate. Convert betas to paid. Open to public. | $200-500/mo | ~$30/mo |
| 9-12 | 10 paying clients. Token economics validated. PI approaching useful N. | $990+/mo | ~$50-60/mo |
| 12-18 | 25-50 clients. First hire (customer success). Pro/Agency tier upgrades. | $3,000-10,000/mo | ~$150-300/mo |

---

## 10. Immediate Actions (This Week)

1. **Apply to Anthropic Startup Program** — the single most impactful action
2. **Apply to Google for Startups (AI First)** — $250K changes everything
3. **Apply to Cloudflare for Startups** — $5K for R2
4. **Register accounts:** Neon, Vercel, Upstash, Inngest, Helicone, PostHog, BetterStack
5. **Create criteria.agency landing page** with waitlist (static Next.js, deploy to Vercel free tier)
6. **Start weekly content** on LinkedIn: "Building an AI marketing agency from scratch"
7. **Set up CriteriaFilms as client #1** in the database schema (even before the platform works)
