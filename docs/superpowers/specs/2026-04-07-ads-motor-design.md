# Ads Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-016 Gestión de pauta digital
> Dolores: D-DST-05, D-DST-08, D-ROI-04

---

## 1. Concepto

Motor de planificación y producción de pauta digital. Orquestador puro: genera media plans, coordina producción de copy (via Writers Room) y creativos (via Graphic Design/Video), define targeting, y compila launch kits listos para ejecución. En esta fase NO se conecta a APIs de plataformas — el cliente ejecuta manualmente con los assets generados.

Cubre 11+ canales: Meta (FB+IG), Google (Search, Display, YouTube, Shopping, PMax), TikTok, LinkedIn, Twitter/X, Pinterest, Spotify, Programmatic.

---

## 2. Pipeline

```
[ad_brief] → [ad_strategy] → [G1: estrategia aprobada] → [ad_creative] → [ad_targeting] → [G2: campaña lista] → [ad_launch_kit] → [ad_delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| ad_brief | Interpretación del brief de campaña de pauta | AD-L |
| ad_strategy | Media plan: mix de canales, presupuesto por canal/fase, timeline, KPIs target | AD-001 |
| ad_creative | Coordinación de producción: sub-proyectos en WR (copy) y GD (creativos) con specs por plataforma | AD-002 |
| ad_targeting | Audiencias por plataforma: demographics, interests, lookalikes, retargeting, exclusiones | AD-003 |
| ad_launch_kit | Estructura completa de campañas: campaigns, ad groups/sets, creativos asignados, settings | AD-004 |
| ad_delivery | Review final, compilación del launch kit para ejecución | AD-L |

---

## 3. Agentes

### AD-L — Ads Director (Líder)

- **Rol**: Interpreta brief de pauta, define estrategia general, aprueba campaña, evalúa performance
- **Pasos**: ad_brief, ad_delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### AD-001 — Media Strategist

- **Rol**: Diseña media plan: mix de canales óptimo según objetivo (awareness, consideration, conversion), presupuesto por canal y fase del funnel, timeline de activación, KPIs target por canal
- **Pasos**: ad_strategy
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### AD-002 — Ad Production Coordinator

- **Rol**: Orquesta la producción de assets publicitarios. Crea sub-proyectos en Writers Room (format=digital, channel=ads) para copy por plataforma y en Graphic Design para creativos visuales (banners, carousels). Para video ads, crea sub-proyecto en Video Production
- **Pasos**: ad_creative
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 70%
- **Nivel**: Sub
- **Importante**: NO produce copy ni creativos — solo coordina su producción

### AD-003 — Targeting Specialist

- **Rol**: Define audiencias por plataforma: demographics, intereses, comportamientos, custom audiences (lookalikes, retargeting), exclusiones. Produce specs de targeting listos para configurar
- **Pasos**: ad_targeting
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### AD-004 — Campaign Assembler

- **Rol**: Compila el launch kit completo: estructura jerárquica de campañas → ad groups/sets → ads, asigna creativos a cada ad, configura settings (bid strategy, placement, schedule, budget allocation). Produce un documento ejecutable
- **Pasos**: ad_launch_kit
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Estrategia | ad-g1 | ad_strategy | AD-L + XA-001 (Financial Agent) | 3 | Media plan viable, presupuesto dentro de rango, KPIs realistas |
| Campaña | ad-g2 | ad_targeting | AD-L + XA-003 (Brand Guardian) | 3 | Creativos alineados a marca, targeting coherente, estructura completa |

---

## 5. Canales soportados

| Canal | Formatos | KPIs principales |
|-------|----------|------------------|
| Meta (FB+IG) | Image, Video, Carousel, Collection, Stories, Reels | CPM, ROAS, CTR, CPA |
| Google Search | Text ads (RSA) | CPC, CTR, Quality Score, CPA |
| Google Display | Banners (responsive), Native | CPM, CTR, Viewability |
| YouTube | In-stream (6s, 15s, 30s), Discovery, Shorts | CPV, VTR, Brand Lift |
| Google Shopping | Product listings | ROAS, CPA |
| Google PMax | Multi-format | ROAS, Conversions |
| TikTok | In-feed video, TopView, Spark Ads | CPM, VTR, Engagement Rate |
| LinkedIn | Sponsored Content, Message Ads, Lead Gen | CPL, CTR, Lead Quality |
| Twitter/X | Promoted tweets, Video | CPE, Impressions |
| Pinterest | Standard pin, Video pin, Shopping | CPC, Save Rate |
| Programmatic | Display, Video, Native, Audio | CPM, Viewability, CTR |

---

## 6. Invocación cross-motor

| Motor invocado | Para qué | Paso |
|----------------|----------|------|
| Writers Room (WR-003) | Copy de ads por plataforma (format=digital, channel=ads) | ad_creative |
| Graphic Design | Banners, carousels, thumbnails por plataforma | ad_creative |
| Video Production | Video ads (6s, 15s, 30s) | ad_creative |
| Channel Manager | Specs de formato por canal | ad_strategy, ad_creative |
| Financial Agent (XA-001) | Validación de presupuesto | ad-g1 |
| Brand Guardian (XA-003) | Validación de marca | ad-g2 |
| Strategist | Brief de campaña y audiencias como input | ad_brief |

---

## 7. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| AD-L:ad_brief | [] | [json] | Interpretar brief de pauta. Definir: objetivo (awareness/consideration/conversion), presupuesto total, duración, plataformas preferidas, audiencia target. Output JSON |
| AD-001:ad_strategy | [ad_brief] | [text, json] | Diseñar media plan: seleccionar canales, distribuir presupuesto por canal y fase del funnel, definir timeline, establecer KPIs target por canal. Usar channel-specs.json como referencia |
| AD-002:ad_creative | [ad_brief, ad_strategy] | [text, json] | Coordinar producción de assets: crear sub-proyectos en WR (copy por plataforma) y GD (creativos por formato). Para video ads, crear sub-proyecto en Video. NO producir copy ni creativos directamente |
| AD-003:ad_targeting | [ad_brief, ad_strategy] | [text, json] | Definir audiencias por plataforma: demographics, interests, behaviors, custom audiences (lookalikes de clientes, retargeting de web visitors), exclusiones. Output como specs configurables |
| AD-004:ad_launch_kit | [ad_brief, ad_strategy, ad_creative, ad_targeting] | [text, image, json] | Compilar launch kit: estructura Campaign → Ad Group/Set → Ad, asignar creativos, configurar bid strategy, placement, schedule, budget. Documento ejecutable para cada plataforma |
| AD-L:ad_delivery | [ad_launch_kit] | [text, json] | Review final del launch kit. Verificar completitud, coherencia, presupuesto. Compilar entregable |

---

## 8. Dependencias con motores transversales (stubs)

| Motor transversal | Cómo lo usa Ads | Estado actual |
|-------------------|-----------------|---------------|
| XA-001 Financial Agent | Evaluador en ad-g1. Valida presupuesto | Stub existente |
| XA-003 Brand Guardian | Evaluador en ad-g2. Valida marca | Stub existente |
| Channel Manager | Specs de formato por canal | Motor nuevo (este grupo) |
| Writers Room | Copy de ads | Motor implementado (grupo 3) |
| Graphic Design | Creativos visuales | Motor implementado |
| Video Production | Video ads | Motor existente (beta) |

---

## 9. Modelo de datos

No requiere tablas nuevas. Usa:
- `projects` con `pipelineType: "ads"`
- `artifacts` para outputs por paso
- `agentExecutions`, `gateReviews`

### Nuevos valores en enums

**projectStatusEnum**: `ad_brief`, `ad_strategy`, `ad_creative`, `ad_targeting`, `ad_launch_kit`, `ad_delivery`

**artifactStepEnum**: `ad_brief`, `ad_strategy`, `ad_creative`, `ad_targeting`, `ad_launch_kit`, `ad_delivery`

**gateTypeEnum**: `ad-g1`, `ad-g2`
