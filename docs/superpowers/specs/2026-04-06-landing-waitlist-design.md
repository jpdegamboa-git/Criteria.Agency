# criteria.agency — Landing Page + Waitlist System

> Date: April 6, 2026
> Status: Design spec
> Scope: Next.js frontend app, landing page, waitlist form + email nurture, static file serving

---

## 1. Context

The GTM strategy requires a landing page live in Week 1 with: pitch, demo videos, pricing, and waitlist capture. The platform currently has only a Hono backend API — no frontend framework.

This spec adds **Next.js** as the frontend, starting with the landing page. This establishes the foundation for the future Client Portal (6 Spaces) and full public site.

### Why Next.js Now
- SSR/SSG for SEO (landing page must rank)
- Static asset serving (logo, images, future demo videos)
- Component architecture scales to Client Portal later
- Tailwind CSS v4 native integration
- The industry standard for SaaS landing pages in 2026

### Design Direction (from visual companion mockup)
- **Theme:** Light (white/fafafa background)
- **Colors:** From brand logo — gold (#ffd053), coral (#e86b73), turquoise (#55c9ca), orange (#ed854b)
- **Typography:** Inter (Google Fonts), 800 weight for headlines
- **Textures:** Subtle dot grid, noise overlay, radial glows
- **Micro-interactions:** Floating diamonds, shimmer gradients, hover lifts, staggered fade-in animations
- **Reference:** `DESIGN_SYSTEM.md` for all tokens

---

## 2. Architecture

```
/                          → Next.js app (port 3001)
  /                        → Landing page (SSG)
  /pricing                 → Pricing page (SSG)
  /waitlist/success        → Thank you page (SSG)
  /api/waitlist            → Next.js API route → stores in DB + triggers email

/api/*                     → Hono backend (port 3000, existing)
  /api/transactions/...
  /api/content/...
  /admin/finances/...
  /review/:token
  /pricing (old SSR — replaced by Next.js)
```

Next.js runs on port 3001 in development. In production, Next.js serves the public site and proxies `/api/*` calls to Hono.

### Project Structure

```
web/                          ← NEW: Next.js app
├── app/
│   ├── layout.tsx           ← Root layout (Inter font, metadata)
│   ├── page.tsx             ← Landing page
│   ├── pricing/
│   │   └── page.tsx         ← Pricing page
│   ├── waitlist/
│   │   └── success/
│   │       └── page.tsx     ← Waitlist thank you
│   └── api/
│       └── waitlist/
│           └── route.ts     ← Waitlist API (stores + sends email)
├── components/
│   ├── ui/                  ← Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── input.tsx
│   ├── nav.tsx              ← Navigation bar
│   ├── hero.tsx             ← Hero section
│   ├── how-it-works.tsx     ← 3-step section
│   ├── quality-gates.tsx    ← 5 gates dark section
│   ├── pricing-cards.tsx    ← 3-tier pricing
│   ├── cta-section.tsx      ← Gold gradient CTA
│   ├── footer.tsx           ← Footer
│   └── waitlist-form.tsx    ← Email + name form
├── lib/
│   ├── db.ts               ← Drizzle client (shared with backend)
│   └── email.ts            ← Resend email sending
├── public/
│   ├── logo.svg             ← Brand logo
│   └── og-image.png         ← Open Graph image (future)
├── tailwind.config.ts       ← Brand colors, fonts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Landing Page Sections

All sections from the approved mockup (v2):

### 3.1 Navigation
- Logo (SVG image) left, links center-right, "Unirme al waitlist" pill button right
- Links: Como funciona, Calidad, Planes — smooth scroll to sections
- Sticky on scroll with blur backdrop
- Gold underline animation on link hover

### 3.2 Hero
- Badge: pulsing green dot + "Plazas limitadas — Beta privada Q3 2026"
- Headline: "Video profesional con IA. **Con criterio.**" (gradient gold→orange on accent)
- Subtitle: "20 anos de experiencia..."
- Two CTAs: "Empezar gratis — 30 dias" (primary) + "Ver como funciona ↓" (secondary)
- Note: "Sin tarjeta de credito · Cancela cuando quieras"
- Floating diamond decorations (brand colors, subtle animation)
- Dot grid background texture
- Staggered fade-in-up animation on load

### 3.3 Trust Bar
- "Clientes en 4 paises" label
- City names: Washington DC, New York, Madrid, Bogota
- Hover: names change from gray to dark

### 3.4 How It Works (3 steps)
- Cards with icon (colored background circle), title, description
- Step 1 (turquoise): Describe tu proyecto
- Step 2 (gold): La IA produce, el criterio evalua
- Step 3 (coral): Revisa y aprueba
- Hover: card lifts with shadow + gold top border appears

### 3.5 Quality Gates (dark section)
- Dark background (#1a1a1a) with radial gold glow
- 5 gate cards: G1 Concepto, G2 Guion, G3 Storyboard, G4 Primer corte, G5 Corte final
- Each gate has colored label (rotating brand colors), name, short description
- Hover: colored bottom border appears, subtle lift

### 3.6 Pricing (3 tiers)
- Starter $300/mo (early adopter), Pro $1,200/mo (featured, gold border), Enterprise custom
- Each card: name, description, price, early adopter crossed-out price, feature list with checkmarks
- "Coming soon" items grayed out (Brand Builder, etc.)
- Hover: card lifts with shadow
- "Empezar gratis" buttons

### 3.7 CTA Section
- Gold→orange gradient background with dot grid texture
- "La IA genera. El criterio decide."
- "Reservar mi lugar →" dark button
- Links to waitlist form

### 3.8 Footer
- Brand name, tagline, copyright
- Simple, minimal

---

## 4. Waitlist System

### Database Table

New table `waitlistEntries`:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| name | varchar(255) | |
| email | varchar(255), unique | |
| company | varchar(255) nullable | |
| videoType | varchar(100) nullable | What type of video they need |
| companySize | varchar(50) nullable | "1-10", "11-50", "51-200", "200+" |
| source | varchar(100) | "landing", "pricing", "cta" — where they signed up |
| status | enum | `pending`, `nurturing`, `invited`, `converted` |
| nurtureStep | integer default 0 | Which email in the sequence they're on (0-4) |
| createdAt | timestamp | |

### Waitlist Form

Minimal form embedded in hero and CTA sections:
- Email (required)
- Name (required)
- Company (optional)
- What kind of video do you need? (optional dropdown: Corporate, Explainer, Social, Comercial, Otro)
- Submit → POST to `/api/waitlist`

### API Route (Next.js)

`POST /api/waitlist`:
1. Validate email format
2. Check if email already exists → if yes, return "Ya estas en la lista"
3. Insert into `waitlistEntries`
4. Send welcome email via Resend
5. Redirect to `/waitlist/success`

### Welcome Email

Subject: "Estas en la lista — criteria.agency"

Content:
- Greeting with name
- "Gracias por unirte al waitlist de criteria.agency"
- "Estas entre los primeros en probar nuestra plataforma de video profesional con IA"
- "En las proximas semanas te enviaremos:"
  - Behind-the-scenes de como producimos video con IA
  - Invitacion a la beta privada cuando este lista
- Sign-off with tagline

### Nurture Email Sequence (4 emails, triggered by Subscription Manager)

The existing Subscription Manager cron can be extended, or a new cron task added:

| Email | Trigger | Subject | Content |
|-------|---------|---------|---------|
| 1 | Day 3 | "Asi producimos un video con IA en 48h" | Behind-the-scenes of the pipeline, 5 gates |
| 2 | Day 7 | "5 puntos de criterio que garantizan calidad" | Deep dive into quality gates |
| 3 | Day 14 | "Los primeros resultados de nuestra beta" | Social proof, early results |
| 4 | Day 21 | "Tu invitacion esta casi lista" | Urgency, beta opening soon |

Each email updates `nurtureStep` on the waitlist entry. Content produced by the Content Writer agent when available.

---

## 5. SEO & Metadata

```tsx
// app/layout.tsx metadata
export const metadata = {
  title: "criteria.agency — Video profesional con IA. Con criterio.",
  description: "20 anos de experiencia en produccion codificados en un sistema que exige calidad profesional antes de entregar. La IA genera. El criterio decide.",
  keywords: "video corporativo IA, produccion video inteligencia artificial, video profesional automatizado",
  openGraph: {
    title: "criteria.agency — Video profesional con IA",
    description: "La IA genera. El criterio decide.",
    url: "https://criteria.agency",
    siteName: "criteria.agency",
    type: "website",
  },
};
```

---

## 6. Tailwind Configuration

```typescript
// web/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#ffd053',
          coral: '#e86b73',
          turquoise: '#55c9ca',
          orange: '#ed854b',
          dark: '#585758',
          muted: '#9d9a9c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
      },
    },
  },
};
```

---

## 7. Files to Create

| File | Purpose |
|------|---------|
| `web/package.json` | Next.js app dependencies |
| `web/next.config.ts` | Next.js configuration |
| `web/tsconfig.json` | TypeScript config |
| `web/tailwind.config.ts` | Brand colors + animations |
| `web/app/layout.tsx` | Root layout with Inter font + metadata |
| `web/app/page.tsx` | Landing page (composes sections) |
| `web/app/globals.css` | Tailwind imports + custom animations + textures |
| `web/app/pricing/page.tsx` | Pricing page (reuses pricing-cards component) |
| `web/app/waitlist/success/page.tsx` | Thank you page |
| `web/app/api/waitlist/route.ts` | Waitlist API endpoint |
| `web/components/nav.tsx` | Sticky navigation |
| `web/components/hero.tsx` | Hero section with animations |
| `web/components/how-it-works.tsx` | 3-step cards |
| `web/components/quality-gates.tsx` | 5 gates dark section |
| `web/components/pricing-cards.tsx` | 3-tier pricing |
| `web/components/cta-section.tsx` | Gold gradient CTA |
| `web/components/footer.tsx` | Footer |
| `web/components/waitlist-form.tsx` | Email capture form |
| `web/components/ui/button.tsx` | Button component |
| `web/lib/db.ts` | Database connection (reuses Drizzle config) |
| `web/lib/email.ts` | Resend email sending |
| `web/public/logo.svg` | Brand logo |

## 8. Files to Modify

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add `waitlistEntries` table + enum |
| `package.json` (root) | Add workspace config if using monorepo, or scripts to run both |
| `.claude/launch.json` | Add Next.js dev server entry |

---

## 9. Development Setup

```bash
# Root has Hono backend on port 3000
# web/ has Next.js on port 3001

# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd web && npm run dev
```

For production: Next.js deploys to Vercel, Hono deploys to Railway. Next.js rewrites `/api/*` to Railway URL.

---

## 10. What Is NOT In This Spec

- Full Client Portal (future — uses same Next.js app)
- Blog / SEO content pages (future addition)
- Authentication / login (future — Better Auth)
- Demo video embedding (future — when videos are produced)
- Analytics / tracking (future — PostHog or similar)
- i18n / multi-language (Spanish only for launch)
- Mobile app

---

## 11. Verification

1. `cd web && npm run dev` → Next.js starts on port 3001
2. Visit `http://localhost:3001` → landing page renders with all 8 sections
3. Logo SVG loads correctly from `/logo.svg`
4. Micro-interactions work: floating diamonds, hover lifts, shimmer gradient
5. Waitlist form: submit email → stored in DB → welcome email sent (console) → redirect to success page
6. Pricing page at `/pricing` renders 3 tiers
7. All links scroll smoothly to sections
8. Mobile responsive: hero stacks, cards go single column
9. Lighthouse: Performance 90+, SEO 95+, Accessibility 90+

---

## Related Documents

- `DESIGN_SYSTEM.md` — Color palette, typography, components, spacing
- `docs/superpowers/specs/2026-04-06-gtm-strategy-design.md` — Positioning, messaging, buyer personas
- `src/views/pricing-page.ts` — Existing Hono SSR pricing (reference for content, replaced by Next.js)
- `.superpowers/brainstorm/*/content/landing-hero-light-v2.html` — Approved mockup
