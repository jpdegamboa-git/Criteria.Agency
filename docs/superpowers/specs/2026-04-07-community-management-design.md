# Community Management Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-017 Community management
> Dolores: D-DST-01, D-DST-02, D-DST-06

---

## 1. Concepto

Motor de gestión continua de redes sociales. Orquestador puro: planifica calendarios editoriales, coordina producción de contenido (via Writers Room y Graphic Design), programa publicaciones, monitorea engagement y analiza performance. Opera como loop continuo: calendario → producción → publicación → escucha → respuesta → análisis → ajuste.

---

## 2. Pipeline

```
[cm_brief] → [cm_calendar] → [G1: calendario aprobado] → [cm_content_production] → [cm_scheduling] → [G2: contenido aprobado] → [cm_monitoring] → [cm_reporting] → [cm_delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| cm_brief | Interpretación de brief social, definición de redes y objetivos | CM-L |
| cm_calendar | Calendario editorial: temas, frecuencia por red, tipos de contenido, fechas especiales | CM-001 |
| cm_content_production | Coordinación de producción: sub-proyectos en WR (captions) y GD (assets) para cada post | CM-002 |
| cm_scheduling | Programación de publicaciones: fechas, horas óptimas, secuencia | CM-002 |
| cm_monitoring | Monitoreo de menciones, respuesta a comentarios/DMs, gestión de crisis leves | CM-003 |
| cm_reporting | Análisis de métricas: engagement rate, reach, growth, best content | CM-004 |
| cm_delivery | Review de performance, ajustes para siguiente ciclo | CM-L |

---

## 3. Agentes

### CM-L — Community Director (Líder)

- **Rol**: Define estrategia social, aprueba calendario, evalúa performance, ajusta estrategia
- **Pasos**: cm_brief, cm_delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### CM-001 — Calendar Planner

- **Rol**: Diseña calendario editorial mensual: distribución de temas por semana, frecuencia por red (IG 5x/semana, LinkedIn 3x, TikTok 4x, etc.), tipos de contenido (educativo, entretenimiento, venta, behind-the-scenes), fechas especiales y efemárides relevantes
- **Pasos**: cm_calendar
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### CM-002 — Social Coordinator

- **Rol**: Orquesta producción de contenido para cada post del calendario. Crea sub-proyectos en Writers Room (format=digital, channel=social) para captions y en Graphic Design para assets visuales. Para video content (reels, shorts), crea sub-proyecto en Video Production. Define horarios óptimos de publicación
- **Pasos**: cm_content_production, cm_scheduling
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 70%
- **Nivel**: Sub
- **Importante**: NO produce contenido — solo coordina su producción

### CM-003 — Engagement Manager

- **Rol**: Monitorea menciones y comentarios en todas las redes, responde a comentarios y DMs siguiendo Brand DNA y tone of voice, detecta y gestiona crisis leves (comentarios negativos, quejas), escala crisis mayores al cliente, reporta sentimiento general
- **Pasos**: cm_monitoring
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 65%
- **Nivel**: Sub

### CM-004 — Social Analyst

- **Rol**: Analiza métricas de todas las redes: engagement rate, reach, impressions, follower growth, best performing content (tipo, tema, hora), audience demographics. Genera reporte con insights y recomendaciones para el siguiente ciclo
- **Pasos**: cm_reporting
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Calendario | cm-g1 | cm_calendar | CM-L (human approval) | 3 | Frecuencia viable, mix de contenido equilibrado, fechas especiales cubiertas |
| Contenido | cm-g2 | cm_scheduling | CM-L + XA-003 (Brand Guardian) | 3 | Todo el contenido producido, tono correcto, visual alineado a marca |

---

## 5. Redes sociales soportadas

| Red | Formatos | Frecuencia típica | Horarios óptimos |
|-----|----------|-------------------|------------------|
| Instagram | Feed (1080x1080, 1080x1350), Stories (1080x1920), Reels (1080x1920), Carousel | 5-7x/semana | 11am-1pm, 7-9pm |
| Facebook | Feed (1200x630), Stories, Video, Link posts | 3-5x/semana | 1-4pm |
| LinkedIn | Feed (1200x627), Article, Document, Video | 3-5x/semana | 8-10am, 12pm (martes-jueves) |
| TikTok | Video (1080x1920), Carousel | 4-7x/semana | 7-9am, 12-3pm, 7-11pm |
| Twitter/X | Text, Image (1600x900), Video, Thread | 3-7x/semana | 8-10am, 12-1pm |
| Pinterest | Pin (1000x1500), Video pin | 5-10x/semana | 8-11pm, sábados |

---

## 6. Invocación cross-motor

| Motor invocado | Para qué | Paso |
|----------------|----------|------|
| Writers Room (WR-003) | Captions y copy de posts (format=digital, channel=social) | cm_content_production |
| Graphic Design | Assets visuales para cada post | cm_content_production |
| Video Production | Reels, shorts, stories con video | cm_content_production |
| Opportunity Agent | Contenido reactivo cuando se detecta oportunidad | cm_monitoring |
| Brand Listener (LI-001) | Alertas de menciones y sentimiento | cm_monitoring |
| Brand Guardian (XA-003) | Validación de tono y voz en contenido | cm-g2 |

---

## 7. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| CM-L:cm_brief | [] | [json] | Interpretar brief social. Definir: redes activas, objetivos (engagement/growth/traffic/leads), tone of voice por red, frecuencia target |
| CM-001:cm_calendar | [cm_brief] | [text, json] | Diseñar calendario editorial mensual: temas por semana, frecuencia por red, tipos de contenido (educativo 40%, entretenimiento 30%, venta 20%, behind-the-scenes 10%), fechas especiales |
| CM-002:cm_content_production | [cm_brief, cm_calendar] | [text, json] | Coordinar producción: crear sub-proyectos en WR (captions) y GD (assets) para cada post del calendario. Para reels/shorts, crear sub-proyecto en Video |
| CM-002:cm_scheduling | [cm_content_production] | [text, json] | Programar publicaciones: asignar fecha y hora óptima a cada post, verificar que no hay conflictos ni gaps |
| CM-003:cm_monitoring | [] | [text] | Monitorear menciones y comentarios. Responder siguiendo Brand DNA. Detectar crisis leves. Escalar crisis mayores. Reportar sentimiento |
| CM-004:cm_reporting | [cm_monitoring] | [text, json] | Analizar métricas: engagement rate, reach, growth, best content. Generar reporte con insights y recomendaciones |
| CM-L:cm_delivery | [cm_reporting] | [text, json] | Review de performance del ciclo. Ajustes para siguiente mes |

---

## 8. Dependencias con motores transversales

| Motor transversal | Cómo lo usa CM | Estado actual |
|-------------------|----------------|---------------|
| XA-003 Brand Guardian | Evaluador en cm-g2. Valida tono | Stub existente |
| Brand Listener (LI-001) | Alertas de menciones | Stub existente |
| Writers Room | Captions y copy | Motor implementado |
| Graphic Design | Assets visuales | Motor implementado |
| Video Production | Reels, shorts | Motor existente |
| Opportunity Agent | Contenido reactivo | Motor nuevo (este grupo) |

---

## 9. Modelo de datos

No requiere tablas nuevas. Usa tablas existentes.

### Nuevos valores en enums

**projectStatusEnum**: `cm_brief`, `cm_calendar`, `cm_content_production`, `cm_scheduling`, `cm_monitoring`, `cm_reporting`, `cm_delivery`

**artifactStepEnum**: `cm_brief`, `cm_calendar`, `cm_content_production`, `cm_scheduling`, `cm_monitoring`, `cm_reporting`, `cm_delivery`

**gateTypeEnum**: `cm-g1`, `cm-g2`
