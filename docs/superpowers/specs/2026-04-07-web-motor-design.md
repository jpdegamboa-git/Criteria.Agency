# Web Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-012 Desarrollo web
> Dolores: D-PRD-04, D-DST-04

---

## 1. Concepto

Motor template-driven de desarrollo web. Los agentes seleccionan templates, componen contenido, configuran SEO y optimizan conversión. No generan código custom desde cero — trabajan sobre templates predefinidos (Next.js/Astro) que se llenan con contenido generado por el Writers Room y assets del Graphic Design.

---

## 2. Pipeline

```
[brief] → [architecture] → [G1: estructura aprobada] → [content] → [seo] → [G2: contenido + SEO] → [build] → [qa] → [G3: deploy approval] → [delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| brief | Interpretación del brief, selección de template, definición de scope | WB-L |
| architecture | Sitemap, navegación, jerarquía de contenido, wireframes | WB-001 |
| content | Contenido compuesto en cada página usando template + copy + assets | WB-002 |
| seo | On-page SEO: meta tags, schema markup, sitemap XML, keywords | WB-003 |
| build | Compilación del sitio desde template + contenido, optimización de assets | WB-005 |
| qa | Validación responsive, accesibilidad, page speed, links, formularios | WB-004 |
| delivery | Aprobación final y deploy | WB-L |

---

## 3. Agentes

### WB-L — Web Director (Líder)

- **Rol**: Interpreta brief web, selecciona template apropiado, define scope (landing vs micrositio vs corporativo), aprueba entrega final
- **Pasos**: brief, delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### WB-001 — Information Architect

- **Rol**: Diseña estructura del sitio: sitemap, navegación, jerarquía de contenido, wireframes de layout. Define qué componentes de template usar en cada página
- **Pasos**: architecture
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### WB-002 — Web Content Composer

- **Rol**: Compone contenido en cada página: mapea copy del Writers Room a slots del template, posiciona assets del Graphic Design, configura CTAs y formularios
- **Pasos**: content
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### WB-003 — SEO Specialist

- **Rol**: On-page SEO: meta titles y descriptions, Open Graph tags, schema markup (JSON-LD), sitemap XML, heading structure, keyword density, internal linking, alt text
- **Pasos**: seo
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### WB-004 — QA Tester

- **Rol**: Valida: responsive (mobile, tablet, desktop), accesibilidad WCAG 2.1 AA, Core Web Vitals (LCP, FID, CLS), links rotos, formularios funcionales, cross-browser
- **Pasos**: qa
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 85%
- **Nivel**: Sub

### WB-005 — Build Engineer

- **Rol**: Compila el sitio desde template + contenido generado, optimiza imágenes (WebP, lazy loading), configura CDN y caching, prepara para deploy
- **Pasos**: build
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Estructura | wb-g1 | architecture | WB-L | 3 | Sitemap coherente con brief, navegación clara, template apropiado |
| Contenido + SEO | wb-g2 | seo | WB-L + XA-003 (Brand Guardian) | 3 | Contenido completo, SEO configurado, adherencia a Brand DNA |
| Deploy | wb-g3 | qa | WB-L (human approval) | 2 | QA pasado, Core Web Vitals OK, accesibilidad OK |

---

## 5. Sistema de Templates

```
/templates/web/
  ├── landing-page/        # Landing de campaña (1 página, hero + CTA)
  ├── landing-multi/       # Landing multi-sección (features, pricing, testimonials)
  ├── microsite/           # 3-5 páginas temáticas
  ├── corporate/           # Sitio corporativo (about, services, contact, blog)
  └── blog/                # Blog con categorías y posts
```

### Estructura de cada template

```
/templates/web/{template-name}/
  ├── manifest.json         # Metadatos: nombre, descripción, slots, variables, componentes
  ├── components/           # Componentes disponibles (hero, features, testimonial, CTA, etc.)
  ├── layouts/              # Layouts de página
  ├── styles/               # Variables de estilo (se llenan desde Brand DNA)
  └── preview.png           # Preview del template
```

### manifest.json

```json
{
  "name": "landing-page",
  "description": "Landing de campaña: hero + secciones + CTA",
  "slots": ["hero_headline", "hero_subtext", "hero_cta", "hero_image",
            "features", "testimonials", "final_cta"],
  "variables": {
    "primaryColor": "from Brand DNA",
    "secondaryColor": "from Brand DNA",
    "fontFamily": "from Brand DNA",
    "logoUrl": "from Brand DNA"
  },
  "components": ["hero", "features_grid", "testimonial_carousel",
                  "cta_banner", "contact_form", "footer"],
  "seo": {
    "defaultSchema": "WebPage",
    "ogType": "website"
  }
}
```

---

## 6. Invocación cross-motor

### Motores que invocan al Web Motor

| Motor que invoca | Para qué | Template típico |
|-----------------|----------|-----------------|
| Strategist | Landing de campaña vinculada a brief | landing-page, landing-multi |
| Ads (Pauta) | Landing de destino para pauta | landing-page |
| Email Marketing | Landing de conversión para email flows | landing-page |
| Brand Builder | Sitio corporativo desde Brand DNA | corporate |
| SEO/Content | Blog posts y pillar pages | blog |

### Motores que el Web Motor invoca

| Motor invocado | Para qué |
|----------------|----------|
| Writers Room | Copy de cada página (headlines, body, CTAs, meta descriptions) |
| Graphic Design | Hero images, iconos, ilustraciones, OG images |
| Audio Motor | Si hay video/audio embebido |
| Analytics | Configuración de tracking (GA, GTM, pixels) |

---

## 7. Directives

### brand-voice.md (shared — ya existe)
Tono de voz para el copy del sitio.

### web-standards.md (nuevo)

| Área | Estándar |
|------|----------|
| Performance | LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| Accesibilidad | WCAG 2.1 AA, contraste mínimo 4.5:1, alt text en todas las imágenes |
| SEO | Meta title < 60 chars, meta description 120-160 chars, H1 único por página |
| Imágenes | WebP con fallback, lazy loading below fold, max 200KB por imagen |
| Mobile | Mobile-first, touch targets mínimo 44x44px, no horizontal scroll |
| Forms | Validación client + server, CSRF protection, honeypot anti-spam |

---

## 8. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| WB-L:brief | [campaign brief si existe] | [json] | Interpretar brief web. Seleccionar template apropiado. Definir scope (páginas, funcionalidad) |
| WB-001:architecture | [brief] | [text, json] | Diseñar sitemap, navegación y wireframes. Mapear componentes del template a cada página |
| WB-002:content | [brief, architecture, WR output, GD output] | [text, image, json] | Componer contenido en cada página. Mapear copy a slots del template. Posicionar assets visuales |
| WB-003:seo | [brief, architecture, content] | [text, json] | Configurar SEO on-page: meta tags, schema markup, sitemap XML, heading structure, keywords |
| WB-005:build | [content, seo] | [text, json] | Compilar sitio desde template + contenido. Optimizar assets. Configurar deploy |
| WB-004:qa | [build] | [text] | Validar responsive, accesibilidad WCAG 2.1 AA, Core Web Vitals, links, formularios |
| WB-L:delivery | [qa] | [text] | Review final. Verificar que todo el contenido está correcto. Preparar para deploy |

---

## 9. Dependencias con motores transversales (stubs)

| Motor transversal | Cómo lo usa el Web Motor | Estado actual |
|-------------------|-------------------------|---------------|
| XA-003 Brand Guardian | Evaluador en wb-g2. Valida identidad visual y tono | Stub agent existente |
| XA-002 Channel Manager | Specs de plataforma (responsive breakpoints, formatos) | Stub agent existente |
| Writers Room | Copy de todas las páginas | Motor nuevo (este grupo) |
| Graphic Design | Assets visuales (hero, iconos, ilustraciones) | Pipeline existente |
| Analytics | Tracking config (GA, GTM, pixels de conversión) | Stub futuro |
| Brand Builder | Brand DNA (colores, tipografía, logo) para variables de template | Pipeline existente |

---

## 10. Modelo de datos

No requiere tablas nuevas. Usa tablas existentes:
- `projects` con `pipelineType: "web"`
- `artifacts` para cada output por paso
- `agentExecutions` para historial
- `gateReviews` para evaluaciones de gates

### Nuevos valores en enums existentes

**projectStatusEnum** (agregar):
- `wb_brief`, `wb_architecture`, `wb_content`, `wb_seo`, `wb_build`, `wb_qa`, `wb_delivery`

**artifactStepEnum** (agregar):
- `wb_brief`, `wb_architecture`, `wb_content`, `wb_seo`, `wb_build`, `wb_qa`, `wb_delivery`

**gateTypeEnum** (agregar):
- `wb-g1`, `wb-g2`, `wb-g3`

### Nota sobre templates

Los templates web son un deliverable separado que se almacena en el repositorio (no en la base de datos). La tabla `artifacts` almacena el contenido generado (copy, configuración SEO, assets seleccionados), no el código del template.
