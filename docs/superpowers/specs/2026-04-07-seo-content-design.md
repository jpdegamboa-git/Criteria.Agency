# SEO/Content Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-019 SEO y contenido orgánico
> Dolores: D-DST-04, D-ESC-01

---

## 1. Concepto

Motor de estrategia y optimización SEO. Orquestador puro: define estrategia de keywords, audita aspectos técnicos, planifica contenido, y monitorea rankings. NO produce contenido (eso lo hace Writers Room WR-004 y Web Motor). Este motor decide QUÉ producir y CÓMO optimizarlo.

---

## 2. Pipeline

```
[se_brief] → [se_audit] → [G1: auditoría completa] → [se_keyword_strategy] → [se_content_plan] → [G2: plan aprobado] → [se_optimization] → [se_reporting] → [se_delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| se_brief | Interpretación del brief SEO, definición de scope | SE-L |
| se_audit | Auditoría técnica: crawlability, indexation, Core Web Vitals, sitemap, structured data | SE-001 |
| se_keyword_strategy | Research de keywords: volumen, dificultad, intent, clusters, gaps vs competencia | SE-002 |
| se_content_plan | Content plan: mapea keywords a páginas, calendar de producción, prioriza por impacto | SE-003 |
| se_optimization | Optimización on-page de contenido existente y nuevo | SE-004 |
| se_reporting | Monitoreo de posiciones, tráfico orgánico, backlinks | SE-004 |
| se_delivery | Review de performance, ajustes de estrategia | SE-L |

---

## 3. Agentes

### SE-L — SEO Director (Líder)

- **Rol**: Estrategia SEO general, prioriza keywords, aprueba content plan, evalúa performance
- **Pasos**: se_brief, se_delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### SE-001 — Technical Auditor

- **Rol**: Auditoría técnica del sitio: crawlability (robots.txt, sitemap), indexation (canonical, noindex), Core Web Vitals (LCP, FID, CLS), mobile-friendliness, structured data (JSON-LD), page speed, broken links, redirect chains
- **Pasos**: se_audit
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### SE-002 — Keyword Strategist

- **Rol**: Research de keywords: search volume, keyword difficulty, search intent (informational, navigational, commercial, transactional), keyword clusters, content gaps vs competencia, long-tail opportunities
- **Pasos**: se_keyword_strategy
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### SE-003 — Content Planner

- **Rol**: Mapea keywords a páginas (existentes o nuevas), define calendar de producción de contenido SEO, prioriza por impacto potencial (volume × ranking probability), define pillar-cluster structure
- **Pasos**: se_content_plan
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### SE-004 — Rankings Monitor

- **Rol**: Monitorea posiciones en SERPs, tráfico orgánico, backlink profile, domain authority. Detecta caídas de ranking y oportunidades. Recomienda content refresh para páginas que pierden posición
- **Pasos**: se_optimization, se_reporting
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Auditoría | se-g1 | se_audit | SE-L | 2 | Auditoría técnica completa, issues priorizados |
| Plan | se-g2 | se_content_plan | SE-L | 3 | Keywords mapeadas, calendar realista, prioridades claras |

---

## 5. Invocación cross-motor

| Motor invocado | Para qué | Paso |
|----------------|----------|------|
| Writers Room (WR-004) | Producción de artículos SEO | se_content_plan (post-aprobación) |
| Web Motor | Publicación y optimización técnica on-page | se_optimization |
| Analytics (futuro) | Datos de tráfico y conversión | se_reporting |

---

## 6. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| SE-L:se_brief | [] | [json] | Interpretar brief SEO: scope (sitio completo o sección), objetivos (tráfico, rankings, leads), competidores a analizar |
| SE-001:se_audit | [se_brief] | [text, json] | Auditoría técnica: crawlability, indexation, Core Web Vitals, mobile, structured data, speed, links, redirects. Output: issue list con severidad y fix sugerido |
| SE-002:se_keyword_strategy | [se_brief, se_audit] | [text, json] | Keyword research: volumen, dificultad, intent, clusters, gaps vs competencia. Output: keyword map con prioridad |
| SE-003:se_content_plan | [se_brief, se_keyword_strategy] | [text, json] | Content plan: mapear keywords a páginas, definir pillar-cluster structure, calendar de producción, priorizar por impacto |
| SE-004:se_optimization | [se_content_plan] | [text] | Optimizar contenido existente: meta tags, headings, internal links, content freshness. Crear briefs para WR-004 para contenido nuevo |
| SE-004:se_reporting | [se_optimization] | [text, json] | Monitorear rankings, tráfico orgánico, backlinks. Detectar caídas, recomendar content refresh |
| SE-L:se_delivery | [se_reporting] | [text, json] | Review de performance SEO. Ajustes de estrategia para siguiente ciclo |

---

## 7. Modelo de datos

No requiere tablas nuevas. Usa tablas existentes.

### Nuevos valores en enums

**projectStatusEnum**: `se_brief`, `se_audit`, `se_keyword_strategy`, `se_content_plan`, `se_optimization`, `se_reporting`, `se_delivery`

**artifactStepEnum**: `se_brief`, `se_audit`, `se_keyword_strategy`, `se_content_plan`, `se_optimization`, `se_reporting`, `se_delivery`

**gateTypeEnum**: `se-g1`, `se-g2`
