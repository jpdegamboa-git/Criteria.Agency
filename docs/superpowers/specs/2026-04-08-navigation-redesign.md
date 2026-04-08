# Navigation Redesign — Sidebar + Reorganized Spaces

> Date: 2026-04-08
> Status: Implemented
> Replaces: Horizontal tab nav with 6 Spaces (Crear, Comunicar, Entender, Vender, Mi Marca, Cuenta)

---

## 1. Problem

The current horizontal tab navigation (Home, Brand, Blueprint, Plan, Campaigns, Sales) doesn't map cleanly to how clients think about their business. Blueprint mixes business logic with brand. Plan mixes strategy with market intelligence. The 6 outcome-based Spaces from PROJECT_VISION.md (Crear, Comunicar, Entender, Vender, Mi Marca, Cuenta) are also superseded — they fragmented related work across too many destinations.

The new structure groups spaces by **role** (what they represent) and uses a sidebar layout to support sub-navigation within each space.

---

## 2. New Navigation Structure

### Layout Change

- **From:** Horizontal tabs in header
- **To:** Fixed left sidebar with grouped items
- Header simplified: brand selector, theme toggle, notifications, avatar dropdown
- Sub-navigation per space lives as horizontal tabs **inside each page**, not in the sidebar

### Sidebar Structure

```
criteria.                         ← logo (collapsible toggle)

🏠  Home                          ← same level as categories

── FUNDAMENTOS ── (collapsible group with icon)
📐  Business                      ← was "Business Model"
🎨  Brand
📦  Productos y Servicios
💵  Revenue Streams

── INTELIGENCIA ── (collapsible group with icon)
🌍  Mercado
🔍  Competencia

── EJECUCIÓN ── (collapsible group with icon)
📣  Campaigns
💰  Sales

── TOOLS ── (pinned to bottom, separate section)
🎬  Studio
🛍  Marketplace
📒  Directorio
💾  Drive
📊  Reportes
```

**Group labels** ("Fundamentos", "Inteligencia", "Ejecución") are collapsible/expandable with chevrons. They provide a mental model:

- **Fundamentos** = who you are, what you sell, how you make money
- **Inteligencia** = what's happening outside your business
- **Ejecución** = what you're doing about it
- **Tools** = pinned to bottom, separated by a border divider

**Setup/Cuenta** stays in the avatar dropdown menu (not in sidebar).

### Collapsible Sidebar

- Expanded: **220px** — icon + label
- Collapsed: **60px** icon rail — icon only, tooltips on hover
- Logo click toggles collapse state

### Collapsible Groups

- Groups are collapsed by default
- Auto-expand when navigating into any item within them
- Each group has a **color-tinted background** when expanded:
  - Fundamentos: `#7c5cfc`
  - Inteligencia: `#00c2a8`
  - Ejecución: `#f5a623`
  - Tools: `#ff6b6b`
- Home and categories share the same visual hierarchy (icon + label)
- Tools pinned to bottom with border separator

### Responsive Behavior

On mobile, the sidebar collapses to a bottom tab bar with the main items (no group labels). Icons only, label below.

---

## 3. Spaces and Their Internal Navigation

### Home
**Route:** `/client`
**Internal tabs:** None — single view
**Content:**
- KPIs ejecutivos (aggregated from all spaces)
- Copilot conversacional (primary interaction point, now a floating draggable window)
- Quick actions (e.g., "Crear video", "Nuevo brief") — secondary access to create content without a campaign
- Recent activity feed

### Business (previously Business Model, previously Blueprint)
**Route:** `/client/business-model`
**Internal tabs:**
- **Propuesta de Valor** (default) — Value Proposition Canvas and core value prop definition
- **Nichos** — target niche segments and market fit
- **Productos y Servicios** — editable catalog of products and services
- **Canales** — distribution and acquisition channels

Each tab shows relevant workshops at the bottom.

**What moved out / removed:**
- Unit Economics → removed from this space
- Operación → not included

### Brand
**Route:** `/client/brand`
**Internal tabs:**
- **DNA** — purpose, vision, mission, values, beliefs, archetype, persona, positioning
- **Identidad** — logo, colors, typography, applications
- **Voz** — tone of voice spectrum sliders, do's & don'ts
- **Guardian** — brand score, validations, adjustments, violations, compliance %, manual
- **Marketplace** — branding workshops and services

**What moved out:**
- Audiencias → Mercado > Audiencias
- Productos y Servicios → own sidebar item (also reflected inside Business > Productos y Servicios tab)

### Productos y Servicios
**Route:** `/client/productos`
**Internal tabs:** None — single view
**Content:** Editable catalog of products and services. Previously lived inside Brand, now independent because it's business logic, not brand identity.

### Revenue Streams
**Route:** `/client/revenue`
**Internal tabs:** None — single view
**Content:** Detailed revenue streams with icons, amounts, trends, progress bars, and total. Previously inside Blueprint, now independent for direct access.

### Mercado (previously part of Plan)
**Route:** `/client/mercado`
**Internal tabs:**
- **Industria** — market size, macro trends, sector data
- **Tendencias** — Culture Listener + Industry Listener feeds
- **Oportunidades** — Opportunity Agent feed, filterable by type
- **Estudios** — research cards, surveys, reports
- **Audiencias** — persona cards (moved from Brand; audiences are market context, not brand identity)

### Competencia (new — previously a sub-section of Plan)
**Route:** `/client/competencia`
**Internal tabs:**
- **Landscape** — static analysis: who competitors are, positioning, benchmark
- **Monitor** — real-time feed from Competition Listener

### Campaigns
**Route:** `/client/campaigns`
**Internal tabs:**
- **Estrategia** — marketing objectives, target KPIs, documented plan (moved from Plan > Estrategia)
- **Budget** — budget allocator by channel/funnel/quarter (moved from Plan > Budget)
- **Matrix** — funnel × channel activation grid (existing)
- **Calendar** — Gantt view (existing)
- **Lista** — flat list view (existing)

**Campaign detail** (`/client/campaigns/[id]`) unchanged: stepper, gate cards, artifacts, history, comments, metrics.

**Content creation without campaign:** Available via quick actions on Home (e.g., "Crear video"). This routes to a simplified brief flow that produces content independently. The primary flow remains campaign-driven.

### Sales
**Route:** `/client/sales`
**Internal tabs:**
- **Pipeline** — Kanban board (existing)
- **Leads** — lead sources, scoring (existing)
- **Proposals** — proposals list with auto-generation (existing)

Below all views: Best Customers Origin (attribution table) + Copilot Insights.

---

## 4. Content Migration Map

| Content | From | To |
|---------|------|----|
| Business Model Canvas | Blueprint | Business > Propuesta de Valor |
| Value Proposition Canvas | Blueprint | Business > Propuesta de Valor |
| Unit Economics | Blueprint | Removed |
| Operación | Blueprint | Removed |
| Revenue Streams | Blueprint | Revenue Streams (own space) |
| Productos y Servicios | Brand | Productos y Servicios (own space) + Business > Productos y Servicios tab |
| Brand DNA | Brand | Brand > DNA |
| Identity (logo, colors, type) | Brand | Brand > Identidad |
| Audiences / Personas | Brand | Mercado > Audiencias |
| Tone of Voice + Do's/Don'ts | Brand | Brand > Voz |
| Brand Guardian + Score | Brand | Brand > Guardian |
| Brand Marketplace | Brand | Brand > Marketplace |
| Marketing Strategy + Objectives | Plan > Estrategia | Campaigns > Estrategia |
| Budget Allocator | Plan > Budget | Campaigns > Budget |
| Competitive Landscape | Plan > Estrategia | Competencia > Landscape |
| Markets / Industry data | Plan > Mercados | Mercado > Industria |
| Opportunities feed | Plan > Oportunidades | Mercado > Oportunidades |
| Studies / Research | Plan > Estudios | Mercado > Estudios |
| Nichos | — | Business > Nichos (new) |
| Canales | — | Business > Canales (new) |

---

## 5. What Does NOT Change

- **Visual style:** All existing design tokens, colors, typography, shadows, card styles, button variants remain exactly as-is. This is a structural change only.
- **Campaigns page content:** Matrix, Calendar, Lista views and campaign detail are unchanged.
- **Sales page content:** Pipeline, Leads, Proposals views are unchanged.
- **Home content:** KPIs, activity feed, charts remain. Copilot integration enhanced but layout preserved.
- **Setup/Cuenta:** Stays in avatar dropdown, not affected.
- **Copilot FAB:** Stays bottom-right on all pages. Opens a **floating draggable window** (not a side panel drawer).
- **Brand selector:** Stays in page headers where applicable.
- **Design tokens:** `portal-bg`, `portal-text`, `portal-accent`, media type colors, state colors — all untouched.

---

## 6. Routing Changes

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/client` | `/client` | Unchanged |
| `/client/blueprint` | `/client/business-model` | Renamed; tabs changed (Propuesta de Valor, Nichos, Productos y Servicios, Canales) |
| `/client/brand` | `/client/brand` | Unchanged |
| — | `/client/productos` | New route |
| — | `/client/revenue` | New route |
| `/client/plan` | `/client/mercado` | Renamed + content redistributed |
| — | `/client/competencia` | New route |
| `/client/campaigns` | `/client/campaigns` | Unchanged |
| `/client/campaigns/[id]` | `/client/campaigns/[id]` | Unchanged |
| `/client/sales` | `/client/sales` | Unchanged |
| `/client/setup` | `/client/setup` | Unchanged (avatar dropdown) |

---

## 7. Sidebar Component Spec

The sidebar is implemented in `portal-nav.tsx` (updated in-place; no separate `portal-sidebar.tsx` was created).

**Behavior:**
- Fixed left position, full viewport height
- Background: `bg-white` with `border-r border-portal-border` (consistent with current header)
- **Collapsible:** toggles between 220px (expanded, icon + label) and 60px (icon rail, icon only)
- Active item highlighted (same visual language as current active tab — text-portal-text with left-border equivalent adapted to vertical)
- Group labels are collapsible with chevron icons; `text-[10px] uppercase tracking-wider text-portal-text-dim font-semibold`
- Items use existing icon sizes (16px) and text styles (`text-sm font-medium`)
- Inactive items: `text-portal-text-muted hover:text-portal-text`
- Groups collapsed by default; auto-expand when active item is inside
- Group color tints applied to expanded group backgrounds
- Tools section pinned to bottom with `border-t border-portal-border` separator
- On mobile (< 768px): collapses to bottom tab bar, icons only with small label

**No new design tokens needed.** Uses existing `portal-text`, `portal-text-muted`, `portal-bg`, `portal-border`, `portal-accent` variables.

---

## 8. Copilot — Floating Draggable Window

The Copilot interaction model changed from a **side panel drawer** to a **floating draggable window**.

- Opened via the FAB button (bottom-right, all pages)
- Window is draggable anywhere on screen
- Resizable (min/max bounds)
- Persists position during session
- Does not push or overlay the sidebar or main content in a fixed way
- Z-index above main content, below modals

---

## 9. Impact on PROJECT_VISION.md

The 6 outcome-based Spaces (Crear, Comunicar, Entender, Vender, Mi Marca, Cuenta) defined in PROJECT_VISION.md §99-109 are **superseded** by this navigation structure for all tiers. PROJECT_VISION.md should be updated to reflect the new 3-group model (Fundamentos, Inteligencia, Ejecución) with Tools pinned at bottom, and 9+ spaces.

The capability-to-motor mapping remains valid — only the client-facing navigation layer changes.
