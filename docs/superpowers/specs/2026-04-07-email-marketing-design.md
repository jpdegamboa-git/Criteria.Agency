# Email Marketing Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-018 Email marketing
> Dolores: D-DST-03, D-VTA-02

---

## 1. Concepto

Pipeline de campañas de email + flows automatizados. Orquestador puro: diseña secuencias, segmenta audiencia, coordina copy (via Writers Room) y templates (via Graphic Design), ejecuta A/B testing y mide resultados. Usa Resend como provider de envío (ya integrado en src/services/email.ts).

---

## 2. Pipeline

```
[em_brief] → [em_strategy] → [G1: estrategia aprobada] → [em_production] → [em_segmentation] → [G2: campaña lista] → [em_send] → [em_analysis] → [em_delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| em_brief | Interpretación del brief de email, tipo de campaña/flow | EM-L |
| em_strategy | Diseño de secuencia: emails, triggers, timing, A/B plan | EM-001 |
| em_production | Coordinación: sub-proyectos en WR (subject+body) y GD (template visual) | EM-002 |
| em_segmentation | Definición de segmentos: etapa funnel, comportamiento, engagement | EM-003 |
| em_send | Ejecución del envío via Resend API | EM-002 |
| em_analysis | Métricas: open rate, CTR, conversion, unsub, A/B results | EM-004 |
| em_delivery | Review de performance, optimizaciones | EM-L |

---

## 3. Agentes

### EM-L — Email Director (Líder)

- **Rol**: Estrategia de email, aprueba secuencias, evalúa performance
- **Pasos**: em_brief, em_delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### EM-001 — Sequence Designer

- **Rol**: Diseña flows automatizados (welcome, nurture, reactivation, promotional, post-purchase, event) y campañas manuales (newsletter, promo). Define triggers, timing entre emails, condiciones de salida, A/B testing plan
- **Pasos**: em_strategy
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### EM-002 — Email Production Coordinator

- **Rol**: Orquesta producción de cada email: crea sub-proyectos en Writers Room (format=digital, channel=email) para subject line + body copy, y en Graphic Design para template visual. Compila el email final. También ejecuta el envío via Resend
- **Pasos**: em_production, em_send
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 70%
- **Nivel**: Sub
- **Importante**: NO escribe copy — coordina Writers Room

### EM-003 — Audience Segmenter

- **Rol**: Define segmentos de audiencia: por etapa del funnel (lead, MQL, SQL, customer), engagement level (active, warm, cold, churned), demographics, comportamiento (opened last 30d, clicked, purchased)
- **Pasos**: em_segmentation
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### EM-004 — Email Analyst

- **Rol**: Analiza métricas de cada campaña/flow: open rate, click rate, conversion rate, unsubscribe rate, bounce rate, revenue atribuido. Analiza resultados de A/B tests. Genera reporte con optimizaciones
- **Pasos**: em_analysis
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Estrategia | em-g1 | em_strategy | EM-L | 3 | Secuencia coherente, timing adecuado, A/B plan definido |
| Campaña | em-g2 | em_segmentation | EM-L + XA-003 (Brand Guardian) | 3 | Emails producidos, tono correcto, segmentos definidos |

---

## 5. Tipos de flow

| Flow | Trigger | Emails típicos | Timing |
|------|---------|---------------|--------|
| Welcome | Signup/registro | 3-5 | Day 0, 2, 5, 10, 15 |
| Nurture | Lead capturado | 4-8 | Semanal |
| Reactivation | 30 días sin engagement | 3 | Day 0, 7, 14 |
| Promotional | Campaña activa | 1-3 | Según calendario |
| Post-purchase | Compra completada | 2-3 | Day 0, 7, 30 |
| Event | Pre/post evento | 4-6 | Según timeline |
| Newsletter | Recurrente | 1 | Semanal o quincenal |
| Abandoned cart | Carrito abandonado | 3 | 1h, 24h, 72h |

---

## 6. Invocación cross-motor

| Motor invocado | Para qué | Paso |
|----------------|----------|------|
| Writers Room (WR-003) | Subject lines + body copy (format=digital, channel=email) | em_production |
| Graphic Design | Templates visuales de email | em_production |
| Sales/CRM (futuro) | Segmentación por etapa de pipeline | em_segmentation |
| Analytics (futuro) | Tracking de conversión | em_analysis |
| Brand Guardian (XA-003) | Validación de tono | em-g2 |

---

## 7. Integración con Resend

El motor usa la infraestructura Resend existente (`src/services/email.ts`):
- `sendEmail()` para envío individual
- Batch sending para campañas masivas
- Template rendering con HTML

Extensiones necesarias:
- Listas y segmentos (Resend Audiences API)
- Scheduling de emails futuros
- Tracking de opens/clicks
- A/B testing (enviar variante A a 50%, B a 50%)

---

## 8. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| EM-L:em_brief | [] | [json] | Interpretar brief de email. Definir: tipo (campaign/flow), objetivo, audiencia target, métricas esperadas |
| EM-001:em_strategy | [em_brief] | [text, json] | Diseñar secuencia: número de emails, triggers, timing, condiciones, A/B testing plan |
| EM-002:em_production | [em_brief, em_strategy] | [text, json] | Coordinar producción: crear sub-proyectos en WR (subject+body por email) y GD (template). Compilar emails finales |
| EM-003:em_segmentation | [em_brief, em_strategy] | [text, json] | Definir segmentos de audiencia: criterios, tamaño estimado, prioridad |
| EM-002:em_send | [em_production, em_segmentation] | [text] | Ejecutar envío via Resend API. Configurar A/B split si aplica |
| EM-004:em_analysis | [em_send] | [text, json] | Analizar métricas post-envío: opens, clicks, conversions, unsubs, A/B results. Recomendaciones |
| EM-L:em_delivery | [em_analysis] | [text, json] | Review de performance. Optimizaciones para siguiente envío |

---

## 9. Modelo de datos

No requiere tablas nuevas. Usa tablas existentes.

### Nuevos valores en enums

**projectStatusEnum**: `em_brief`, `em_strategy`, `em_production`, `em_segmentation`, `em_send`, `em_analysis`, `em_delivery`

**artifactStepEnum**: `em_brief`, `em_strategy`, `em_production`, `em_segmentation`, `em_send`, `em_analysis`, `em_delivery`

**gateTypeEnum**: `em-g1`, `em-g2`
