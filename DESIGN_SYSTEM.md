# criteria.agency — Design System

> Last updated: April 6, 2026
> Source of truth for all UI decisions across the platform

---

## Brand Identity

**Name:** criteria.agency
**Tagline:** "La IA genera. El criterio decide."
**Logo file:** `public/logo.svg` (horizontal, SVG with embedded text in TangoSans)
**Logo font:** TangoSans (for logo only — not available in browsers, use SVG as image)

---

## Color Palette

### Primary Colors (from logo)

| Name | Hex | Usage |
|------|-----|-------|
| Gold | `#ffd053` | Primary accent, CTAs, highlights, brand icon arrow |
| Coral | `#e86b73` | Secondary accent, alerts, destructive actions, logo diamond |
| Turquoise | `#55c9ca` | Success, confirmations, positive indicators, logo diamond |
| Orange | `#ed854b` | Tertiary accent, warnings, logo diamond |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Dark | `#585758` | Primary text (light theme), "criteria" in logo |
| Muted | `#9d9a9c` | Secondary text, "agency" in logo |
| Border | `#e8e8e8` | Borders, dividers (light theme) |
| Background | `#fafafa` | Page background (light theme) |
| Card | `#ffffff` | Card/surface background (light theme) |
| Near Black | `#1a1a1a` | Headlines, buttons (light theme) |

### Dark Theme (Admin / Dashboard)

| Name | Hex | Usage |
|------|-----|-------|
| criteria-black | `#0a0a0a` | Page background |
| criteria-dark | `#141414` | Card/surface background |
| criteria-gray | `#1e1e1e` | Input backgrounds, hover states |
| criteria-border | `#2a2a2a` | Borders, dividers |
| criteria-muted | `#666666` | Tertiary text |
| criteria-text | `#a0a0a0` | Secondary text |
| criteria-light | `#e0e0e0` | Primary text |
| criteria-white | `#fafafa` | Headlines, emphasis |

### When to Use Which Theme

| Surface | Theme | Reason |
|---------|-------|--------|
| Landing page (public) | Light | Professional, approachable, conversion-focused |
| Pricing page | Light | Matches landing |
| Review portal (client-facing) | Dark | Cinematic feel, matches video content |
| Admin dashboard / Finances | Dark | Operational, data-dense, reduces eye strain |
| Client Portal (future) | Light | Client-facing, friendly |

---

## Typography

### Font Stack

**Primary:** Inter (Google Fonts)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Fallback (no font load):** System font stack

### Scale

| Element | Size | Weight | Letter Spacing | Usage |
|---------|------|--------|----------------|-------|
| Hero headline | 56px | 800 | -0.03em | Landing page main title |
| Page title | 36px | 700 | -0.02em | Section headings |
| Card title | 20px | 700 | 0 | Card headings, pricing tier names |
| Section subtitle | 18px | 400 | 0 | Subtitle text below headings |
| Body | 16px | 400 | 0 | General text |
| Body small | 14px | 400 | 0 | Secondary info, table cells |
| Caption | 13px | 400 | 0 | Notes, helper text |
| Label | 12px | 600 | 0.05em | Badges, uppercase labels |
| Badge | 11px | 700 | 0.05em | Tags, status indicators |

### Weight Usage

| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, descriptions |
| 500 | Medium | Navigation links, secondary buttons |
| 600 | Semibold | Labels, badges, emphasis |
| 700 | Bold | Headings, card titles |
| 800 | Extra Bold | Hero headlines, prices |

---

## Spacing

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps, badge padding vertical |
| sm | 8px | Icon gaps, small padding |
| md | 12px | Input padding, card gap small |
| lg | 16px | Standard padding, paragraph gap |
| xl | 20px | Section padding small |
| 2xl | 24px | Card padding, component gap |
| 3xl | 32px | Section gap |
| 4xl | 40px | Page section padding |
| 5xl | 48px | Major section gap |
| 6xl | 60px | Nav horizontal padding |
| 7xl | 80px | Page section vertical padding |
| 8xl | 100px | Hero vertical padding |

### Container

```css
max-width: 1200px;  /* general content */
max-width: 1000px;  /* narrow content (pricing, steps) */
max-width: 800px;   /* text-focused content (hero) */
max-width: 560px;   /* body text max-width */
margin: 0 auto;
padding: 0 40px;    /* horizontal page padding */
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 6px | Small badges, tags |
| md | 8px | Inputs, small buttons |
| lg | 12px | Cards, buttons, containers |
| xl | 16px | Large cards, sections |
| full | 100px | Pills, nav buttons, rounded CTAs |

---

## Shadows

| Name | Value | Usage |
|------|-------|-------|
| none | — | Dark theme (use borders instead) |
| sm | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift on hover |
| md | `0 4px 12px rgba(0,0,0,0.08)` | Cards (light theme) |
| lg | `0 8px 24px rgba(0,0,0,0.12)` | Modals, dropdowns |

Dark theme uses border (`1px solid #2a2a2a`) instead of shadows.

---

## Components

### Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| Primary | bg: `#1a1a1a`, text: white, radius: 12px, padding: 16px 40px | Main CTAs |
| Primary (dark theme) | bg: gold `#ffd053`, text: `#0a0a0a` | CTAs on dark background |
| Secondary | bg: transparent, border: `#e8e8e8`, text: `#585758` | Secondary actions |
| Secondary (dark theme) | bg: `#1e1e1e`, border: `#2a2a2a`, text: `#e0e0e0` | Secondary on dark |
| Ghost | bg: transparent, text: `#9d9a9c` | Tertiary actions, cancel |
| Pill | bg: `#1a1a1a`, text: white, radius: 100px, padding: 8px 24px | Nav CTAs |

### Cards

```css
/* Light theme */
background: white;
border: 1px solid #e8e8e8;
border-radius: 16px;
padding: 36px 28px;

/* Dark theme */
background: #141414;
border: 1px solid #2a2a2a;
border-radius: 16px;
padding: 36px 28px;

/* Featured card */
border: 2px solid #ffd053;
```

### Status Badges

| Status | Background | Text |
|--------|-----------|------|
| Active / Success | `#55c9ca` bg, white text | Turquoise |
| Pending / Warning | `#ffd053` bg, `#1a1a1a` text | Gold |
| Error / Overdue | `#e86b73` bg, white text | Coral |
| Info | `#ed854b` bg, white text | Orange |
| Neutral | `#e8e8e8` bg, `#585758` text | Gray |

### Inputs

```css
/* Light theme */
background: white;
border: 1px solid #e8e8e8;
border-radius: 8px;
padding: 10px 16px;
font-size: 14px;
color: #1a1a1a;

/* Dark theme */
background: #1e1e1e;
border: 1px solid #2a2a2a;
border-radius: 8px;
padding: 10px 16px;
font-size: 14px;
color: #e0e0e0;

/* Focus state (both themes) */
border-color: #ffd053;
outline: none;
```

### Navigation

```css
/* Public (light) */
padding: 20px 60px;
font-size: 14px;
links: color #9d9a9c, hover #585758;
CTA: pill button (dark bg, white text);

/* Admin (dark) */
border-bottom: 1px solid #2a2a2a;
padding: 12px 24px;
active link: #ffd053 (gold);
inactive: #666;
```

---

## Gradients

| Name | Value | Usage |
|------|-------|-------|
| Gold → Orange | `linear-gradient(135deg, #ffd053, #ed854b)` | Accent text, featured elements |
| Dark subtle | `linear-gradient(180deg, #0a0a0a, #0d1117)` | Dark section backgrounds |

---

## Logo Usage

### Do
- Use `public/logo.svg` as `<img>` tag (preserves TangoSans font via SVG paths)
- Minimum height: 24px
- Clear space: at least logo height on all sides
- On dark backgrounds: the logo works as-is (gray text is visible)
- On light backgrounds: the logo works as-is

### Don't
- Don't inline the SVG code (font won't render without TangoSans installed)
- Don't change logo colors
- Don't use logo smaller than 20px height
- Don't place logo on busy backgrounds

### Fallback (when SVG fails to load)
```html
<span style="font-size:18px;font-weight:700;color:#585758;">
  criteria<span style="color:#9d9a9c;">.agency</span>
</span>
```

---

## Chart Styling (Chart.js)

```javascript
// Dark theme charts (admin/finances)
{
  scales: {
    y: {
      grid: { color: '#2a2a2a' },
      ticks: { color: '#666' }
    },
    x: {
      grid: { color: '#2a2a2a' },
      ticks: { color: '#666' }
    }
  },
  plugins: {
    legend: {
      labels: { color: '#a0a0a0' }
    }
  }
}

// Bar colors
income: '#55c9ca'   // turquoise
expense: '#e86b73'  // coral
```

---

## Responsive Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 640px | Single column, stacked cards |
| Tablet | 640-1024px | 2-column grids, adjusted padding |
| Desktop | > 1024px | Full layout, 3-4 column grids |

### Key Responsive Rules
- Nav: hamburger menu on mobile, horizontal on desktop
- Hero: 56px → 36px headline on mobile
- Cards: 3-col → 2-col → 1-col
- Pricing: 3-col → stacked on mobile
- Container padding: 40px → 20px on mobile

---

## Accessibility

- Color contrast: all text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
- Focus states: 2px solid gold outline on interactive elements
- Font size: minimum 13px for any text
- Touch targets: minimum 44px for mobile buttons
- Semantic HTML: use proper heading hierarchy, landmarks, ARIA labels

---

## File Reference

| Token Source | File |
|-------------|------|
| Logo SVG | `public/logo.svg` |
| Dark theme Tailwind config | `src/views/layout.ts` (criteria-* colors) |
| Light theme implementation | Landing page (Next.js, to be implemented) |
| Admin theme implementation | `src/views/finance-*.ts` pages |
| Review portal theme | `src/views/review-page.ts` |
| Pricing page theme | `src/views/pricing-page.ts` |

---

## Related Documents

- `PORTAL_SPECS.md` — Portal layout specs (references this design system)
- `docs/superpowers/specs/2026-04-06-gtm-strategy-design.md` — Brand messaging and positioning
