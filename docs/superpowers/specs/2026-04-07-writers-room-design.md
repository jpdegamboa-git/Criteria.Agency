# Writers Room Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-011 Copywriting especializado
> Dolores: D-PRD-03, D-MCA-03, D-ESC-01

---

## 1. Concepto

Hub central de copywriting que sirve a todos los motores de la plataforma. Opera en dos modos según complejidad:

- **Modo Express**: piezas individuales simples (caption, subject line, CTA, tagline)
- **Modo Full**: campañas completas o contenido complejo (artículos, guiones, manifiestos)

El dispatcher decide el modo basándose en el brief:
- **Express**: 1 pieza, 1 canal, formato corto → pipeline: `[brief] → [draft] → [delivery]`
- **Full**: múltiples piezas, campaña completa, contenido largo → pipeline completo

---

## 2. Pipeline

### Modo Full

```
[brief] → [research] → [G1: concepto aprobado] → [draft] → [G2: calidad/tono] → [adaptation] → [delivery]
```

### Modo Express

```
[brief] → [draft] → [delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| brief | Interpretación del brief, decisión de modo (express/full), asignación de especialista | WR-L |
| research | Investigación de tema, audiencia, competencia, keywords | WR-001 |
| draft | Copy redactado en el formato solicitado | WR-002/003/004/005/CW-001 (según format) |
| adaptation | Adaptaciones para canales adicionales si el brief lo requiere | Mismo especialista que ejecutó draft (WR-002/003/004/005/CW-001) |
| delivery | Review final, compilación de entregables | WR-L |

---

## 3. Agentes

### WR-L — Head Writer (Líder)

- **Rol**: Interpreta brief, decide tono general, asigna especialista según formato, aprueba copy final
- **Pasos**: brief, delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### WR-001 — Research Writer

- **Rol**: Investiga tema, audiencia objetivo, competencia, keywords relevantes. Produce un research brief que alimenta al especialista
- **Pasos**: research
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### WR-002 — AV Copywriter

- **Rol**: Guiones audiovisuales, spots de radio/TV, voiceover scripts, narración
- **Pasos**: draft (cuando format=av)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 70%
- **Nivel**: Sub
- **Nota**: Comparte skill file con T2-002 del video pipeline. T2-002 es un alias dentro de Video Production

### WR-003 — Digital Copywriter

- **Rol**: Copy para ads (Meta, Google, TikTok, LinkedIn), social media posts, email campaigns, landing page copy
- **Pasos**: draft (cuando format=digital)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### WR-004 — SEO Content Writer

- **Rol**: Artículos de blog, pillar pages, contenido evergreen, content clusters. Optimizado para keywords y estructura SEO
- **Pasos**: draft (cuando format=seo)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub
- **Nota**: Reemplaza a DC-001 (Content Writer) que se depreca

### WR-005 — Brand Copywriter

- **Rol**: Manifiestos de marca, taglines, naming, claims, elevator pitches, brand stories
- **Pasos**: draft (cuando format=brand)
- **Modelo**: claude-sonnet-4 (requiere mayor creatividad y matiz)
- **Autonomía**: 65%
- **Nivel**: Sub

### CW-001 — Graphic Copywriter (ya existe, cross-motor)

- **Rol**: Copy corto para piezas gráficas: headlines, body text, CTAs dentro de diseños
- **Pasos**: draft (cuando format=graphic)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Cross-motor (pertenece a Graphic Design, registrado también en Writers Room)

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Concepto | wr-g1 | research | WR-L | 3 | Research es suficiente, dirección creativa clara, keywords relevantes |
| Calidad | wr-g2 | draft | WR-L + XA-003 (Brand Guardian) | 3 | Tono correcto, adherencia a Brand DNA, longitud adecuada, sin errores |

---

## 5. Formato de request (cómo otros motores invocan al Writers Room)

Otros motores crean un sub-proyecto con `pipelineType: "writers-room"` y `parentProjectId` apuntando al proyecto padre.

```typescript
{
  pipelineType: "writers-room",
  parentProjectId: "uuid-del-proyecto-padre",
  brief: {
    format: "av" | "digital" | "seo" | "brand" | "graphic",
    channel: "video" | "social" | "email" | "ads" | "web" | "print" | "none",
    pieces: 1,            // número de piezas solicitadas
    tone: "formal" | "casual" | "bold" | "empathetic" | "auto",
    maxLength: 500,       // caracteres máximo por pieza (0 = sin límite)
    keywords: ["..."],    // keywords para SEO, opcionales
    references: ["..."],  // URLs o textos de referencia
    context: "..."        // contexto adicional del motor que invoca
  }
}
```

### Tabla de invocaciones

| Motor que invoca | format | channel | Uso típico |
|-----------------|--------|---------|------------|
| Video Production | av | video | Guiones, narración, supers |
| Graphic Design | graphic | varies | Headlines, body, CTAs en piezas visuales |
| Email Marketing | digital | email | Subject lines, body copy, CTAs |
| Ads (Pauta) | digital | ads | Ad copy (Meta, Google, TikTok, LinkedIn) |
| Community Management | digital | social | Captions, posts, respuestas |
| SEO/Content | seo | web | Artículos, blog posts, pillar pages |
| Brand Builder | brand | none | Manifiestos, taglines, naming |
| Events | digital | email | Copy de invitaciones, programa, follow-up |
| Web Motor | digital | web | Copy de landing pages, micrositios |

---

## 6. Migración de agentes existentes

| Agente actual | Acción | Nuevo ID |
|--------------|--------|----------|
| T2-002 (AV Copywriter) | Se mantiene en video pipeline como alias. Skill file compartido | WR-002 |
| T2-L (Head Writer) | Se mantiene en video pipeline con scope AV. WR-L es distinto con scope completo | — (sin cambio) |
| CW-001 (Graphic Copywriter) | Ya existe. Se registra también como agente del Writers Room | CW-001 |
| DC-001 (Content Writer) | Se depreca. WR-004 lo reemplaza | WR-004 |

---

## 7. Directives

### brand-voice.md (shared — ya existe)
Se inyecta siempre. Contiene tono de voz, vocabulario de marca, do's y don'ts.

### writing-guidelines.md (nuevo)
Reglas de escritura por formato:

| Formato | Longitud típica | Estructura | Notas |
|---------|----------------|-----------|-------|
| Caption social | 50-280 chars | Hook → body → CTA | Emoji policy por marca |
| Ad copy | 25-90 chars (headline), 90-250 chars (body) | Headline → body → CTA | Por plataforma |
| Email subject | 30-60 chars | Curiosity/benefit driven | A/B variants |
| Email body | 150-500 words | Saludo → problema → solución → CTA | Scannable |
| Blog article | 800-2000 words | H1 → intro → H2s → conclusion → CTA | SEO structure |
| Guión AV (30s) | ~75 words | Hook → mensaje → CTA | Timing por frame |
| Guión AV (60s) | ~150 words | Hook → contexto → mensaje → CTA | Timing por frame |
| Tagline | 3-8 words | Memorable, rítmica | Brand positioning |
| Manifiesto | 200-500 words | Narrativa, emocional | Brand voice máxima |

---

## 8. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| WR-L:brief | [] | [json] | Interpretar brief de copy. Decidir modo (express/full). Asignar especialista según format. Definir tono y dirección creativa |
| WR-001:research | [brief] | [text] | Investigar tema, audiencia objetivo, competencia directa, keywords relevantes. Producir research brief estructurado |
| WR-002:draft | [brief, research] | [text, image] | Redactar guión AV según specs de formato y timing. Incluir indicaciones de narrador y supers |
| WR-003:draft | [brief, research] | [text, image] | Redactar copy digital: ads, social posts, email copy, landing page copy. Respetar longitudes por canal |
| WR-004:draft | [brief, research] | [text] | Redactar contenido SEO optimizado para keywords target. Estructura H1-H2-H3, meta description, internal links |
| WR-005:draft | [brief, research] | [text, image] | Redactar copy de marca: tagline, manifiesto, naming, claims. Máxima creatividad y adherencia a Brand DNA |
| CW-001:draft | [brief, research] | [text, image] | Redactar copy corto para piezas gráficas: headlines, body text, CTAs. Ajustar a espacio disponible |
| WR-00X:adaptation | [brief, draft] | [text] | Adaptar copy aprobado a canales adicionales. Ajustar longitud, tono y formato según specs de canal destino |
| WR-L:delivery | [brief, draft, adaptation] | [text] | Review final de calidad, tono y adherencia. Compilar entregables en formato solicitado |

---

## 9. Dependencias con motores transversales (stubs)

| Motor transversal | Cómo lo usa el Writers Room | Estado actual |
|-------------------|---------------------------|---------------|
| XA-003 Brand Guardian | Evaluador en wr-g2. Valida tono de voz y adherencia a Brand DNA | Stub agent existente |
| XA-002 Channel Manager | Provee specs de canal (longitudes, formatos) como contexto | Stub agent existente |
| Brand Builder | Brand DNA Document como contexto para tono y mensajes clave | Pipeline existente |
| Strategist | Brief de campaña y audiencias como input | Pipeline existente |

---

## 10. Modelo de datos

No requiere tablas nuevas. Usa las tablas existentes:
- `projects` con `pipelineType: "writers-room"`
- `artifacts` para cada output por paso
- `agentExecutions` para historial
- `gateReviews` para evaluaciones de gates

### Nuevos valores en enums existentes

**projectStatusEnum** (agregar):
- `wr_brief`, `wr_research`, `wr_draft`, `wr_adaptation`, `wr_delivery`

**artifactStepEnum** (agregar):
- `wr_brief`, `wr_research`, `wr_draft`, `wr_adaptation`, `wr_delivery`

**gateTypeEnum** (agregar):
- `wr-g1`, `wr-g2`
