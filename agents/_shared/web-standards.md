# Web Standards — Web Pipeline Directive

Technical and quality standards for all web deliverables produced in the Web pipeline.

---

## Core Web Vitals

All pages must meet Google's "Good" threshold for Core Web Vitals:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5 s | 2.5–4.0 s | > 4.0 s |
| **FID** (First Input Delay) | < 100 ms | 100–300 ms | > 300 ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | < 200 ms | 200–500 ms | > 500 ms |
| **TTFB** (Time to First Byte) | < 800 ms | 800–1,800 ms | > 1,800 ms |

Measure with Lighthouse CI on desktop and mobile (emulated 4G throttling).

---

## Accessibility — WCAG 2.1 AA

All web deliverables must meet WCAG 2.1 Level AA:

| Criterion | Requirement |
|-----------|-------------|
| **Color contrast** | Text on background ≥ 4.5:1 (normal text), ≥ 3:1 (large text ≥18pt or bold ≥14pt) |
| **Alt text** | All meaningful images have descriptive alt; decorative images use `alt=""` |
| **Keyboard navigation** | All interactive elements reachable and operable by keyboard alone |
| **Focus indicators** | Visible focus ring on all focusable elements (min 3:1 contrast with adjacent colors) |
| **Touch target size** | Minimum 44×44 px for all interactive touch targets |
| **Form labels** | Every input has an associated `<label>` or ARIA label |
| **Error identification** | Form errors identified in text, not color alone |
| **Skip navigation** | "Skip to main content" link as first focusable element |
| **Language attribute** | `lang` attribute set on `<html>` element |
| **Heading hierarchy** | Logical H1→H2→H3 structure; no skipped levels |

Run automated checks with axe-core or Lighthouse; supplement with manual keyboard + screen-reader testing.

---

## SEO Baseline

| Element | Specification |
|---------|--------------|
| **Meta title** | ≤60 characters; unique per page; primary keyword near start |
| **Meta description** | 120–160 characters; unique per page; includes CTA |
| **H1** | Exactly one per page; unique; matches or closely mirrors title |
| **H2–H6** | Used for logical structure, not styling |
| **OG tags** | `og:title`, `og:description`, `og:image` (1200×630 px), `og:url` on all pages |
| **Twitter Card** | `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` |
| **Schema JSON-LD** | Appropriate schema type per page (Organization, WebPage, Article, Product, etc.) |
| **Canonical URL** | `<link rel="canonical">` on all indexable pages |
| **Sitemap** | XML sitemap at `/sitemap.xml`; submitted to Search Console |
| **Robots.txt** | Present at root; explicitly blocks staging/admin paths |
| **Internal links** | Descriptive anchor text; no "click here" or "read more" without context |

---

## Images

| Standard | Requirement |
|----------|-------------|
| **Format** | WebP preferred; fallback JPEG/PNG via `<picture>` element |
| **Lazy loading** | `loading="lazy"` on all below-the-fold images |
| **Max file size** | 200 KB per image (hero/full-bleed max 400 KB) |
| **Responsive** | `srcset` and `sizes` attributes for all content images |
| **Dimensions** | `width` and `height` attributes always set to prevent CLS |
| **Compression** | Quality 80–85 for WebP; strip EXIF metadata |

---

## Mobile

| Standard | Requirement |
|----------|-------------|
| **Mobile-first** | Design and code from smallest viewport up |
| **Viewport meta** | `<meta name="viewport" content="width=device-width, initial-scale=1">` |
| **Breakpoints** | 375 px (mobile), 768 px (tablet), 1280 px (desktop), 1440 px (wide) |
| **Text readability** | Minimum 16 px body font on mobile; no horizontal scroll |
| **Tap targets** | 44×44 px minimum; 8 px spacing between adjacent targets |
| **No intrusive interstitials** | No full-screen popups that block content on mobile load |

---

## Forms

| Standard | Requirement |
|----------|-------------|
| **Client-side validation** | Real-time inline error messages with accessible error text |
| **Server-side validation** | Never trust client-only validation; re-validate all inputs server-side |
| **CSRF protection** | CSRF token on all state-changing form submissions |
| **Honeypot field** | Hidden honeypot input to reduce bot submissions |
| **Autocomplete** | `autocomplete` attributes set on all common fields (name, email, tel, address) |
| **Input types** | Use semantic input types (`email`, `tel`, `number`, `date`) for mobile keyboards |
| **Success / error states** | Clear confirmation message on success; descriptive error on failure |
| **Data minimization** | Collect only data required for the stated purpose |
