# Landing Page + Waitlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js landing page for criteria.agency with 8 sections, micro-interactions, brand design system, and waitlist capture with email nurture.

**Architecture:** New Next.js 15 app in `web/` directory alongside existing Hono backend. Landing page uses SSG. Waitlist API route stores in shared PostgreSQL via Drizzle and sends email via Resend. Shares DB schema with backend.

**Tech Stack:** Next.js 15, Tailwind CSS v4, TypeScript, Drizzle ORM (shared schema), Resend (email), Inter font (Google Fonts)

**Spec:** `docs/superpowers/specs/2026-04-06-landing-waitlist-design.md`
**Design System:** `DESIGN_SYSTEM.md`
**Mockup:** `.superpowers/brainstorm/*/content/landing-hero-light-v2.html`

---

### Task 1: Next.js Project Scaffolding

**Files:**
- Create: `web/package.json`, `web/next.config.ts`, `web/tsconfig.json`, `web/tailwind.config.ts`, `web/app/layout.tsx`, `web/app/globals.css`, `web/app/page.tsx`
- Copy: `public/logo.svg` → `web/public/logo.svg`
- Modify: `.claude/launch.json`

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
mkdir -p web
cd web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --yes
```

This creates the Next.js 15 scaffold with Tailwind and TypeScript.

- [ ] **Step 2: Install additional dependencies**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2/web
npm install drizzle-orm postgres resend
npm install -D dotenv
```

- [ ] **Step 3: Copy logo**

```bash
cp /Users/juanpa/Agentes/criteria.agency-2/public/logo.svg /Users/juanpa/Agentes/criteria.agency-2/web/public/logo.svg
```

- [ ] **Step 4: Configure Tailwind with brand colors**

Replace `web/tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        },
        surface: {
          bg: '#fafafa',
          card: '#ffffff',
          border: '#e8e8e8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 1.5s infinite',
        'float-slow': 'float 8s ease-in-out 3s infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'fade-in-up-1': 'fadeInUp 0.6s ease 0.1s forwards',
        'fade-in-up-2': 'fadeInUp 0.6s ease 0.2s forwards',
        'fade-in-up-3': 'fadeInUp 0.6s ease 0.3s forwards',
        'fade-in-up-4': 'fadeInUp 0.6s ease 0.4s forwards',
        'fade-in-up-5': 'fadeInUp 0.6s ease 0.5s forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Set up globals.css with textures**

Replace `web/app/globals.css` with:

```css
@import "tailwindcss";

/* ── Noise texture overlay ── */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}

/* ── Dot grid background ── */
.dot-grid {
  background-image: radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0);
  background-size: 40px 40px;
}

/* ── Radial glow ── */
.radial-glow-gold {
  position: relative;
}
.radial-glow-gold::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 208, 83, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Gradient text ── */
.gradient-text-gold {
  background: linear-gradient(135deg, #ffd053, #ed854b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: shimmer 3s ease-in-out infinite;
}

/* ── Dot grid for CTA section ── */
.dot-grid-light {
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0);
  background-size: 32px 32px;
}
```

- [ ] **Step 6: Set up root layout with Inter font and metadata**

Replace `web/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "criteria.agency — Video profesional con IA. Con criterio.",
  description:
    "20 anos de experiencia en produccion codificados en un sistema que exige calidad profesional antes de entregar. La IA genera. El criterio decide.",
  keywords:
    "video corporativo IA, produccion video inteligencia artificial, video profesional automatizado",
  openGraph: {
    title: "criteria.agency — Video profesional con IA",
    description: "La IA genera. El criterio decide.",
    url: "https://criteria.agency",
    siteName: "criteria.agency",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans bg-surface-bg text-[#1a1a1a] antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create minimal landing page placeholder**

Replace `web/app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          criteria<span className="text-brand-muted">.agency</span>
        </h1>
        <p className="mt-4 text-brand-muted">Landing page coming up...</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Configure next.config.ts**

Replace `web/next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 9: Add Next.js to launch.json**

Update `/Users/juanpa/Agentes/criteria.agency-2/.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "api",
      "runtimeExecutable": "/opt/homebrew/bin/node",
      "runtimeArgs": ["node_modules/.bin/tsx", "src/api/server.ts"],
      "env": { "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" },
      "port": 3000
    },
    {
      "name": "web",
      "runtimeExecutable": "/opt/homebrew/bin/npm",
      "runtimeArgs": ["run", "dev", "--", "--port", "3001"],
      "env": { "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" },
      "port": 3001,
      "cwd": "web"
    }
  ]
}
```

- [ ] **Step 10: Verify Next.js starts**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2/web
npm run dev -- --port 3001 &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
kill %1 2>/dev/null
```

Expected: 200

- [ ] **Step 11: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/ .claude/launch.json
git commit -m "feat: scaffold Next.js app with Tailwind brand config, Inter font, and textures"
```

---

### Task 2: UI Components (Button, Card, Badge, Input)

**Files:**
- Create: `web/components/ui/button.tsx`, `web/components/ui/card.tsx`, `web/components/ui/badge.tsx`, `web/components/ui/input.tsx`

- [ ] **Step 1: Create all 4 UI components**

These are small, reusable components following the DESIGN_SYSTEM.md specs. Each component should:
- Accept `className` prop for extension
- Use Tailwind classes matching the brand colors
- Button: primary (dark bg), secondary (border), pill (rounded-full) variants
- Card: white bg, border, rounded-xl, hover lift + shadow
- Badge: colored pill (turquoise for success, gold for pending, coral for alert)
- Input: border, rounded-lg, focus ring gold

Each component is a simple React component with variant props using `cn()` utility (just template literal class merging, no external dependency needed).

- [ ] **Step 2: Verify build**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/components/ui/
git commit -m "feat: add reusable UI components (button, card, badge, input)"
```

---

### Task 3: Navigation + Footer Components

**Files:**
- Create: `web/components/nav.tsx`, `web/components/footer.tsx`

- [ ] **Step 1: Create navigation**

Sticky nav with:
- Logo image (`/logo.svg`) on left
- Links (Como funciona, Calidad, Planes) with smooth scroll (`href="#how"` etc.)
- Gold underline animation on hover (`after:` pseudo-element, `hover:after:w-full` transition)
- "Unirme al waitlist" pill button on right
- Sticky: `sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-border`

- [ ] **Step 2: Create footer**

Simple footer:
- Brand name text fallback (criteria.agency)
- Tagline italic
- Copyright 2026

- [ ] **Step 3: Add to layout or page, verify**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/components/nav.tsx web/components/footer.tsx
git commit -m "feat: add sticky navigation with gold underline hover and footer"
```

---

### Task 4: Hero Section

**Files:**
- Create: `web/components/hero.tsx`

- [ ] **Step 1: Create hero component**

The most important visual section. Include:
- Floating diamond decorations (6 small colored squares rotated 45deg, each with `animate-float` and different delays)
- Dot grid background (`dot-grid` class)
- Badge with pulsing green dot: `animate-pulse-dot`
- Headline with gradient accent: `gradient-text-gold` class
- Staggered animations: `opacity-0 animate-fade-in-up-N` for each element (N=1,2,3,4,5)
- Primary + secondary CTA buttons
- Note text

Follow the mockup HTML structure from `.superpowers/brainstorm/*/content/landing-hero-light-v2.html` but convert to React/Tailwind.

- [ ] **Step 2: Update page.tsx to use hero**

Replace placeholder in `web/app/page.tsx` with Nav + Hero + Footer composition.

- [ ] **Step 3: Verify visually**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2/web && npm run dev -- --port 3001 &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
kill %1 2>/dev/null
```

- [ ] **Step 4: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/components/hero.tsx web/app/page.tsx
git commit -m "feat: add hero section with floating diamonds, shimmer gradient, and staggered animations"
```

---

### Task 5: Trust Bar + How It Works + Quality Gates Sections

**Files:**
- Create: `web/components/trust-bar.tsx`, `web/components/how-it-works.tsx`, `web/components/quality-gates.tsx`

- [ ] **Step 1: Create trust bar**

Simple centered section: "Clientes en 4 paises" label + 4 city names with hover color transition.

- [ ] **Step 2: Create how-it-works**

3-column grid of cards:
- Each card has colored icon circle, title, description
- Hover: translateY(-4px), shadow, gold top border (via `before:` pseudo)
- Colors: turquoise, gold, coral for steps 1-3

- [ ] **Step 3: Create quality gates**

Dark section (`bg-[#1a1a1a]`):
- Radial gold glow (`radial-glow-gold` class)
- 5 gate cards in a flex row
- Each gate: colored label, name, description
- Hover: colored bottom border, subtle lift

- [ ] **Step 4: Add all 3 to page.tsx**

Update `web/app/page.tsx` to compose: Nav → Hero → TrustBar → HowItWorks → QualityGates → Footer

- [ ] **Step 5: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/components/trust-bar.tsx web/components/how-it-works.tsx web/components/quality-gates.tsx web/app/page.tsx
git commit -m "feat: add trust bar, how-it-works steps, and quality gates sections"
```

---

### Task 6: Pricing Cards + CTA Section

**Files:**
- Create: `web/components/pricing-cards.tsx`, `web/components/cta-section.tsx`

- [ ] **Step 1: Create pricing cards**

3-column grid:
- Starter ($300/mo early, $500 crossed out), Pro ($1,200/mo, featured with gold border + "Mas popular" badge), Enterprise (custom)
- Feature lists with turquoise checkmarks, grayed "coming soon" items
- Hover lift + shadow
- "Empezar gratis" primary buttons, "Contactar ventas" outline for Enterprise

- [ ] **Step 2: Create CTA section**

Gold→orange gradient background with dot grid texture overlay:
- "La IA genera. El criterio decide." headline
- "Reservar mi lugar →" dark button
- Use `dot-grid-light` class for the texture

- [ ] **Step 3: Add to page.tsx**

Full composition: Nav → Hero → TrustBar → HowItWorks → QualityGates → Pricing → CTA → Footer

- [ ] **Step 4: Create pricing page**

Create `web/app/pricing/page.tsx` that reuses the PricingCards component with Nav and Footer.

- [ ] **Step 5: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/components/pricing-cards.tsx web/components/cta-section.tsx web/app/page.tsx web/app/pricing/
git commit -m "feat: add pricing cards (3 tiers) and gold gradient CTA section"
```

---

### Task 7: Waitlist Schema + Form Component

**Files:**
- Modify: `src/db/schema.ts`
- Create: `web/components/waitlist-form.tsx`

- [ ] **Step 1: Add waitlist table to schema**

In `src/db/schema.ts`, add enum and table:

```typescript
export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "pending",
  "nurturing",
  "invited",
  "converted",
]);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  videoType: varchar("video_type", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  source: varchar("source", { length: 100 }).default("landing").notNull(),
  status: waitlistStatusEnum("status").default("pending").notNull(),
  nurtureStep: integer("nurture_step").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Run migration: `npx drizzle-kit generate && npm run db:migrate`

- [ ] **Step 2: Create waitlist form component**

Client component (`"use client"`) with:
- Name input (required)
- Email input (required)
- Company input (optional)
- Video type dropdown (optional): Corporate, Explainer, Social, Comercial, Otro
- Submit button
- Loading state, success state, error state
- On submit: POST to `/api/waitlist` with JSON body
- On success: redirect to `/waitlist/success`
- Prop `source` to track where the form is placed ("hero", "cta", "pricing")

- [ ] **Step 3: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add src/db/schema.ts src/db/migrations/ web/components/waitlist-form.tsx
git commit -m "feat: add waitlist DB table and form component"
```

---

### Task 8: Waitlist API Route + Email + Success Page

**Files:**
- Create: `web/lib/db.ts`, `web/lib/email.ts`, `web/app/api/waitlist/route.ts`, `web/app/waitlist/success/page.tsx`

- [ ] **Step 1: Create DB connection for Next.js**

`web/lib/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/db/schema.js";

const connectionString = process.env.DATABASE_URL ??
  "postgresql://criteriafilms:criteriafilms@localhost:5432/criteriafilms";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export { schema };
```

Note: This imports schema from the parent `src/db/schema.ts`. The `web/tsconfig.json` needs to allow imports outside `web/`. Add `"paths": { "@db/*": ["../src/db/*"] }` or use relative imports.

- [ ] **Step 2: Create email helper**

`web/lib/email.ts`:
```typescript
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendWaitlistWelcome(name: string, email: string) {
  const subject = "Estas en la lista — criteria.agency";
  const html = `
    <h2>Bienvenido, ${name}!</h2>
    <p>Gracias por unirte al waitlist de <strong>criteria.agency</strong>.</p>
    <p>Estas entre los primeros en probar nuestra plataforma de video profesional con IA.</p>
    <p>En las proximas semanas te enviaremos:</p>
    <ul>
      <li>Behind-the-scenes de como producimos video con IA</li>
      <li>Invitacion a la beta privada cuando este lista</li>
    </ul>
    <p style="color:#9d9a9c;font-size:13px;margin-top:24px;">La IA genera. El criterio decide.</p>
  `;

  if (!resend) {
    console.log(\`[WAITLIST EMAIL] To: \${email}\`);
    console.log(\`[WAITLIST EMAIL] Subject: \${subject}\`);
    console.log(\`[WAITLIST EMAIL] Name: \${name}\`);
    return;
  }

  await resend.emails.send({
    from: "criteria.agency <noreply@criteria.agency>",
    to: email,
    subject,
    html,
  });
}
```

- [ ] **Step 3: Create waitlist API route**

`web/app/api/waitlist/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendWaitlistWelcome } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, company, videoType, source } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
  }

  // Check duplicate
  const existing = await db.select().from(schema.waitlistEntries).where(eq(schema.waitlistEntries.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ error: "Ya estas en la lista" }, { status: 409 });
  }

  // Insert
  await db.insert(schema.waitlistEntries).values({
    name,
    email,
    company: company ?? null,
    videoType: videoType ?? null,
    source: source ?? "landing",
  });

  // Send welcome email
  await sendWaitlistWelcome(name, email);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create success page**

`web/app/waitlist/success/page.tsx`:
```tsx
export default function WaitlistSuccess() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-bg">
      <div className="text-center max-w-md px-6">
        <div className="text-5xl mb-6">🎬</div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">
          Estas en la lista!
        </h1>
        <p className="text-brand-muted mb-2">
          Gracias por unirte. Recibiras un email de bienvenida en los proximos minutos.
        </p>
        <p className="text-brand-muted mb-8">
          Te avisaremos cuando la beta este lista.
        </p>
        <a href="/" className="text-brand-gold hover:underline font-medium">
          ← Volver al inicio
        </a>
        <p className="mt-12 text-sm text-gray-300 italic">
          La IA genera. El criterio decide.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Create .env.local for Next.js**

```bash
echo "DATABASE_URL=postgresql://criteriafilms:criteriafilms@localhost:5432/criteriafilms
RESEND_API_KEY=" > /Users/juanpa/Agentes/criteria.agency-2/web/.env.local
```

- [ ] **Step 6: Add .env.local to .gitignore**

Append `.env.local` to `web/.gitignore` if not already there.

- [ ] **Step 7: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/lib/ web/app/api/ web/app/waitlist/ src/db/schema.ts src/db/migrations/
git commit -m "feat: add waitlist API route, email sending, DB table, and success page"
```

---

### Task 9: Integrate Waitlist Form into Landing Page

**Files:**
- Modify: `web/components/hero.tsx`, `web/components/cta-section.tsx`

- [ ] **Step 1: Add waitlist form to hero**

In the hero section, add the WaitlistForm component below the CTA buttons (or replace the primary CTA with an inline email capture).

Option: keep the "Empezar gratis" button that scrolls to a waitlist form section, OR embed a mini form (just email + name) directly in the hero.

Recommended: embed mini form in hero (email only) + full form in CTA section.

- [ ] **Step 2: Add waitlist form to CTA section**

Replace the CTA button with the full WaitlistForm component (with source="cta").

- [ ] **Step 3: Verify full page**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /Users/juanpa/Agentes/criteria.agency-2
git add web/components/hero.tsx web/components/cta-section.tsx web/app/page.tsx
git commit -m "feat: integrate waitlist form into hero and CTA sections"
```

---

### Task 10: End-to-End Verification

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1: Backend (for DB access)
cd /Users/juanpa/Agentes/criteria.agency-2 && npm run dev &

# Terminal 2: Frontend
cd /Users/juanpa/Agentes/criteria.agency-2/web && npm run dev -- --port 3001 &

sleep 5
```

- [ ] **Step 2: Verify all pages load**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001        # Landing
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/pricing  # Pricing
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/waitlist/success  # Success
```

Expected: all 200.

- [ ] **Step 3: Test waitlist submission**

```bash
curl -s -X POST http://localhost:3001/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","source":"landing"}'
```

Expected: `{"ok":true}`

- [ ] **Step 4: Test duplicate prevention**

```bash
curl -s -X POST http://localhost:3001/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","source":"landing"}'
```

Expected: `{"error":"Ya estas en la lista"}` with status 409.

- [ ] **Step 5: Verify logo loads**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/logo.svg
```

Expected: 200.

- [ ] **Step 6: Kill servers and commit any fixes**

```bash
kill %1 %2 2>/dev/null
```

If fixes needed:
```bash
git add -A && git commit -m "fix: address issues from e2e verification"
```

---

### Summary of Files

**Created (22+ files in web/):**

| File | Purpose |
|------|---------|
| `web/package.json` | Next.js dependencies |
| `web/next.config.ts` | Next.js config |
| `web/tsconfig.json` | TypeScript config |
| `web/tailwind.config.ts` | Brand colors + animations |
| `web/app/layout.tsx` | Root layout (Inter, metadata) |
| `web/app/page.tsx` | Landing page (all 8 sections) |
| `web/app/globals.css` | Tailwind + textures + animations |
| `web/app/pricing/page.tsx` | Pricing page |
| `web/app/waitlist/success/page.tsx` | Thank you page |
| `web/app/api/waitlist/route.ts` | Waitlist API |
| `web/components/nav.tsx` | Sticky navigation |
| `web/components/hero.tsx` | Hero with animations |
| `web/components/trust-bar.tsx` | Trust bar |
| `web/components/how-it-works.tsx` | 3-step cards |
| `web/components/quality-gates.tsx` | 5 gates dark section |
| `web/components/pricing-cards.tsx` | 3-tier pricing |
| `web/components/cta-section.tsx` | Gold gradient CTA |
| `web/components/footer.tsx` | Footer |
| `web/components/waitlist-form.tsx` | Email capture form |
| `web/components/ui/button.tsx` | Button variants |
| `web/components/ui/card.tsx` | Card component |
| `web/components/ui/badge.tsx` | Badge component |
| `web/components/ui/input.tsx` | Input component |
| `web/lib/db.ts` | Drizzle connection |
| `web/lib/email.ts` | Resend email |
| `web/public/logo.svg` | Brand logo |

**Modified (3 files):**

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add waitlistEntries table + enum |
| `.claude/launch.json` | Add Next.js dev server entry |
