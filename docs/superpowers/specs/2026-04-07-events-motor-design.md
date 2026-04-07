# Events Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-015 Producción de eventos
> Dolores: D-PRD-07, D-ESC-01

---

## 1. Concepto

Motor de producción de eventos — del concepto a la ejecución, medición y post-evento. Es el motor más orquestador de la plataforma: produce poco directamente pero coordina a casi todos los demás motores (Marketplace, Writers Room, Graphic Design, Print Production, Video, Audio, Email Marketing, Community Management).

---

## 2. Pipeline

```
[brief] → [concept] → [G1: concepto aprobado] → [planning] → [vendor_setup] → [G2: logística confirmada] → [pre_event] → [live_event] → [post_event] → [G3: cierre y medición]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| brief | Interpretación del brief, definición de tipo de evento | EV-L |
| concept | Concepto detallado: tema, agenda, experiencia deseada, formato | EV-L |
| planning | Plan detallado: timeline, checklist, presupuesto, layout de venue, capacity | EV-001 |
| vendor_setup | Contratación de proveedores via Marketplace (venue, catering, A/V, entretenimiento, MC, etc.) | EV-002 |
| pre_event | Producción de materiales: invitaciones, señalética, guiones, RSVP | EV-003, EV-005 |
| live_event | Cobertura en vivo: social, video, fotos, check-in | EV-003, EV-005 |
| post_event | Follow-up, recap, medición de resultados | EV-003, EV-004 |
| delivery | Cierre de evento, reporte final | EV-L |

---

## 3. Agentes

### EV-L — Event Director (Líder)

- **Rol**: Diseña concepto de evento, define formato y experiencia, coordina todos los motores, aprueba cierre
- **Pasos**: brief, concept, delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader

### EV-001 — Event Planner

- **Rol**: Plan detallado del evento: timeline día por día, checklist de tareas, presupuesto desglosado por categoría, asignación de responsabilidades. Incluye layout/plano del venue con distribución de zonas (escenario, networking, catering, registro, photo wall), capacity planning por zona, y flow de asistentes
- **Pasos**: planning
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### EV-002 — Logistics Coordinator

- **Rol**: Coordina contratación de proveedores via Marketplace: venue, catering, montaje técnico (sonido, iluminación, pantallas), entretenimiento (músicos, DJ), maestros de ceremonias, decoración, mobiliario, fotografía, logística (transporte, seguridad, valet)
- **Pasos**: vendor_setup
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 70%
- **Nivel**: Sub

### EV-003 — Content Activator

- **Rol**: Coordina producción de contenido invocando a otros motores:
  - **Writers Room**: guiones de maestro de ceremonias, scripts de presentaciones, copy de invitaciones, programa, talking points, discursos
  - **Graphic Design**: invitaciones visuales, señalética y wayfinding, backdrop/step-and-repeat, material de mesa (individuales, menús), badges/gafetes, layout del venue visual
  - **Print Production**: material impreso (badges, programa, señalética física)
  - **Video Production**: cobertura audiovisual del evento, recap video
  - **Audio Motor**: diseño sonoro del evento, playlist, jingles
  - **Email Marketing**: envío de invitaciones, confirmaciones, recordatorios, follow-up
  - **Community Management**: cobertura social pre/durante/post evento
- **Pasos**: pre_event, live_event, post_event
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 65%
- **Nivel**: Sub

### EV-004 — Event Analyst

- **Rol**: Mide resultados del evento: asistencia vs target, leads generados (scan de badges, formularios), engagement social (posts, mentions, hashtag), ROI (costo total vs valor generado), NPS (encuesta post-evento). Genera reporte post-evento con insights y recomendaciones
- **Pasos**: post_event
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### EV-005 — Guest Manager

- **Rol**: Gestión de invitados: curación de lista de invitados, RSVP tracking, envío de confirmaciones, recordatorios (1 semana y 1 día antes), check-in on-site (QR code), seating chart/asignación de mesas, gestión de +1s y cancelaciones
- **Pasos**: pre_event, live_event
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Concepto | ev-g1 | concept | EV-L (human approval) | 3 | Concepto aprobado por cliente, presupuesto estimado viable, formato definido |
| Logística | ev-g2 | vendor_setup | EV-L (human approval) | 2 | Proveedores confirmados, presupuesto dentro de rango, timeline factible |
| Cierre | ev-g3 | post_event | EV-L | 2 | Métricas recopiladas, follow-up enviado, reporte generado |

---

## 5. Tipos de evento

| Tipo | Escala | Formato | Motores que coordina |
|------|--------|---------|---------------------|
| **Webinar** | 10-500 asistentes | Virtual | Writers Room, GD, Email, Community Mgmt |
| **Workshop/Taller** | 5-50 asistentes | Presencial/virtual | Writers Room, GD, Email |
| **Networking/Meetup** | 10-100 asistentes | Presencial | Marketplace (venue), Writers Room, GD, Email, CM |
| **Lanzamiento de producto** | 20-200 asistentes | Presencial/híbrido | Marketplace (venue, catering, A/V, entretenimiento), WR, GD, Video, Audio, Email, CM |
| **Conferencia** | 100-1000+ asistentes | Presencial | Marketplace (venue, catering, A/V, logística, montaje, MC), WR, GD, Video, Audio, Print, Email, CM |
| **Activación de marca** | Variable | Presencial | Marketplace (logística, montaje), GD, Video, Audio, CM |
| **Cena/Gala** | 20-300 asistentes | Presencial | Marketplace (venue, catering, entretenimiento, decoración, mobiliario), WR, GD, Print, Email |
| **Feria/Exposición** | 50-5000+ asistentes | Presencial | Marketplace (stand, montaje, logística), GD, Print, Video, CM |

---

## 6. Orquestación cross-motor

El Events Motor es unique por la cantidad de motores que coordina. Cada invocación crea un sub-proyecto con `parentProjectId` apuntando al proyecto de evento.

### Pre-evento

| Motor invocado | Sub-proyecto | Entregables |
|----------------|-------------|-------------|
| **Marketplace** | Cotización y contratación | Venue confirmado, catering, A/V, entretenimiento, MC, decoración, mobiliario, logística |
| **Writers Room** | Copy del evento | Guiones de MC, scripts de presentaciones, copy de invitaciones, programa, talking points |
| **Graphic Design** | Material visual | Invitaciones, señalética, backdrop, badges, material de mesa, layout visual del venue |
| **Print Production** | Material impreso | Badges impresos, programa impreso, señalética física, flyers |
| **Audio Motor** | Audio del evento | Diseño sonoro, playlist, jingles, bumpers |
| **Email Marketing** | Comunicaciones | Invitaciones, confirmación de RSVP, recordatorios |
| **Community Management** | Social pre-evento | Teaser posts, countdown, stories, hashtag setup |

### Durante el evento

| Motor invocado | Sub-proyecto | Entregables |
|----------------|-------------|-------------|
| **Video Production** | Cobertura AV | Grabación, streaming en vivo, fotos |
| **Community Management** | Social en vivo | Posts en tiempo real, stories, retweets, engagement |
| **Email Marketing** | — | Recordatorio día del evento |

### Post-evento

| Motor invocado | Sub-proyecto | Entregables |
|----------------|-------------|-------------|
| **Video Production** | Recap video | Video resumen del evento (1-3 min) |
| **Email Marketing** | Follow-up | Thank you email, encuesta NPS, contenido post-evento |
| **Community Management** | Social post-evento | Recap posts, galería, testimonios, highlights |
| **Writers Room** | Contenido derivado | Blog post recap, nota de prensa |

---

## 7. Timeline típico

```
Semana -6 a -4: brief → concept → G1 (concepto aprobado por cliente)
Semana -4 a -3: planning → vendor_setup → G2 (logística confirmada)
Semana -3 a -2: pre_event fase 1 (producción de materiales: diseño, impresión, audio)
Semana -2 a -1: pre_event fase 2 (invitaciones, RSVP, confirmaciones, recordatorios)
Día -1: pre_event fase 3 (montaje, check de sonido, ensayo)
Día 0: live_event (ejecución, cobertura, check-in)
Semana +1: post_event (follow-up, recap video, medición, reporte) → G3
```

---

## 8. Directives

### brand-voice.md (shared)
Tono de comunicación y identidad visual para todos los materiales del evento.

### event-playbooks.md (nuevo)

Playbooks por tipo de evento con checklist estándar:

| Tipo | Checklist mínimo |
|------|-----------------|
| Webinar | Plataforma, speaker, slides, registro, reminder, recording, follow-up |
| Lanzamiento | Venue, catering, A/V, MC, programa, invitaciones, cobertura, recap |
| Conferencia | Venue, catering, speakers, programa, sponsors, badges, A/V, MC, networking, app |

---

## 9. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| EV-L:brief | [campaign brief] | [json] | Interpretar brief de evento. Definir tipo, formato, escala, objetivos, KPIs |
| EV-L:concept | [brief] | [text] | Detallar concepto: tema central, agenda tentativa, experiencia del asistente, diferenciadores |
| EV-001:planning | [brief, concept] | [text, json] | Plan detallado: timeline, checklist, presupuesto desglosado, layout de venue, capacity planning, flow de asistentes |
| EV-002:vendor_setup | [planning] | [text, json] | Crear requests para Marketplace: venue, catering, A/V, entretenimiento, MC, decoración, mobiliario, logística |
| EV-003:pre_event | [planning, vendor_setup] | [text, image, json] | Coordinar producción de materiales: invocar WR (guiones, copy), GD (visual), Print (impresión), Audio (sonido), Email (invitaciones) |
| EV-005:pre_event | [planning] | [text, json] | Gestionar lista de invitados: RSVP tracking, confirmaciones, seating, check-in prep |
| EV-003:live_event | [pre_event] | [text, image] | Coordinar cobertura en vivo: Video (grabación), CM (social), fotos |
| EV-005:live_event | [pre_event] | [text] | Check-in de asistentes, gestión de incidencias, conteo en tiempo real |
| EV-003:post_event | [live_event] | [text, image, video] | Coordinar follow-up: Email (thank you), CM (recap social), Video (recap), WR (blog post) |
| EV-004:post_event | [live_event] | [text, json] | Medir resultados: asistencia, leads, engagement social, ROI, NPS. Generar reporte con insights |
| EV-L:delivery | [post_event] | [text, json] | Cierre: validar reporte final, evaluar proveedores, documentar aprendizajes |

---

## 10. Dependencias con motores transversales (stubs)

| Motor transversal | Cómo lo usa Events | Estado actual |
|-------------------|--------------------|---------------|
| XA-001 Financial Agent | Control de presupuesto del evento | Stub agent existente |
| XA-002 Channel Manager | Specs de canales para cobertura social | Stub agent existente |
| XA-003 Brand Guardian | Validación de identidad en todos los materiales | Stub agent existente |
| Marketplace | Contratación de todos los proveedores | Motor nuevo (este grupo) |
| Writers Room | Copy de todo el evento | Motor nuevo (este grupo) |
| Graphic Design | Material visual del evento | Pipeline existente |
| Print Production | Material impreso del evento | Motor nuevo (este grupo) |
| Video Production | Cobertura audiovisual | Pipeline existente |
| Audio Motor | Diseño sonoro del evento | Motor nuevo (este grupo) |
| Email Marketing | Comunicaciones del evento | Stub futuro |
| Community Management | Cobertura social | Stub futuro |

---

## 11. Modelo de datos

No requiere tablas nuevas adicionales a las del Marketplace. Usa:
- `projects` con `pipelineType: "events"`
- `artifacts` para cada output por paso
- `agentExecutions` para historial
- `gateReviews` para evaluaciones de gates
- `vendors`, `vendor_quotes`, `vendor_reviews` (del Marketplace)

### Nuevos valores en enums existentes

**projectStatusEnum** (agregar):
- `ev_brief`, `ev_concept`, `ev_planning`, `ev_vendor_setup`, `ev_pre_event`, `ev_live_event`, `ev_post_event`, `ev_delivery`

**artifactStepEnum** (agregar):
- `ev_brief`, `ev_concept`, `ev_planning`, `ev_vendor_setup`, `ev_pre_event`, `ev_live_event`, `ev_post_event`, `ev_delivery`

**gateTypeEnum** (agregar):
- `ev-g1`, `ev-g2`, `ev-g3`
