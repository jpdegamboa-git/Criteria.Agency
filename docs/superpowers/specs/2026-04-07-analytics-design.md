# Analytics Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capabilities: C-033 Dashboard ejecutivo, C-034 Atribución multicanal, C-035 CAC y LTV, C-036 Reportes automatizados, C-037 Reportes en lenguaje natural
> Dolores: D-ROI-01, D-ROI-02, D-ROI-03, D-ROI-04, D-ROI-05, D-ROI-06, D-ROI-07, D-DST-09

---

## 1. Concepto

Motor transversal de medición y reporting. Agrega datos de todos los motores de distribución, calcula métricas cross-canal (CAC, LTV, ROAS, attribution), genera dashboards ejecutivos, reportes automatizados, y responde preguntas en lenguaje natural sobre los datos de marketing. Extiende el dashboard financiero existente a marketing completo.

---

## 2. Pipeline

```
[an_request] → [an_collect] → [an_analyze] → [G1: datos válidos] → [an_visualize] → [an_deliver]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| an_request | Interpretación del request: tipo de reporte, período, métricas solicitadas | AN-L |
| an_collect | Agregación de datos de todos los motores relevantes | AN-001 |
| an_analyze | Cálculo de métricas: CAC, LTV, ROAS, attribution, funnel rates, anomalías | AN-002 o AN-005 |
| an_visualize | Dashboard o reporte generado con gráficos, tablas, narrative | AN-003 o AN-004 |
| an_deliver | Entrega: dashboard publicado, reporte enviado, o respuesta a query | AN-L |

---

## 3. Agentes

### AN-L — Analytics Director (Líder)

- **Rol**: Interpreta requests de analytics, valida que los datos y métricas sean correctos, aprueba reportes antes de entrega
- **Pasos**: an_request, an_deliver
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### AN-001 — Data Collector

- **Rol**: Agrega datos de todos los motores de distribución y ventas. Fuentes: Ads (spend, impressions, clicks, conversions), CM (engagement, reach, followers), Email (opens, clicks, conversions), SEO (rankings, organic traffic), Sales/CRM (leads, deals, revenue). Normaliza y consolida en dataset unificado
- **Pasos**: an_collect
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 85%
- **Nivel**: Sub

### AN-002 — Metrics Analyst

- **Rol**: Calcula métricas de negocio:
  - **CAC** (Customer Acquisition Cost): total marketing spend / new customers
  - **LTV** (Customer Lifetime Value): avg revenue per customer × avg retention months
  - **LTV:CAC ratio** (target >3:1)
  - **ROAS** por canal: revenue / ad spend
  - **Attribution**: first-touch, last-touch, linear, data-driven (cuando hay volumen)
  - **Funnel conversion rates**: lead → MQL → SQL → opportunity → customer
  - **Anomaly detection**: flagea métricas que cambian >20% vs período anterior
- **Pasos**: an_analyze
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### AN-003 — Dashboard Builder

- **Rol**: Genera dashboards ejecutivos con KPI cards, gráficos de tendencia, tablas comparativas, funnel visualization. Produce output que alimenta el frontend dashboard
- **Pasos**: an_visualize (cuando type=dashboard)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### AN-004 — Report Generator

- **Rol**: Genera reportes automatizados con narrative en español: Daily Pulse (KPIs + alertas), Weekly Performance (canales + content + spend), Monthly Executive (ROI + CAC/LTV + attribution + recommendations). Incluye texto explicativo, no solo números
- **Pasos**: an_visualize (cuando type=report)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### AN-005 — NL Query Agent

- **Rol**: Responde preguntas en lenguaje natural sobre datos de marketing. Ejemplo: "¿Cuánto gastamos en Meta el mes pasado?", "¿Cuál es nuestro CAC por canal?", "¿Qué campaña generó más leads?". Traduce la pregunta a query de datos, ejecuta, y formatea la respuesta en lenguaje natural
- **Pasos**: an_analyze (cuando mode=query)
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Datos | an-g1 | an_analyze | AN-L | 2 | Datos completos, métricas calculadas correctamente, anomalías flaggeadas |

---

## 5. Tipos de reporte

| Tipo | ID | Frecuencia | Contenido principal |
|------|----|-----------|---------------------|
| Daily Pulse | daily | Diario (automático) | KPIs clave del día, alertas de anomalías, spend pace |
| Weekly Performance | weekly | Semanal (automático) | Métricas por canal, top/bottom content, spend vs budget, week-over-week trends |
| Monthly Executive | monthly | Mensual (automático) | ROI global, CAC/LTV, attribution por canal, funnel analysis, recomendaciones estratégicas |
| On-demand Query | query | Bajo demanda | Respuesta a pregunta específica en lenguaje natural con datos |
| Custom Report | custom | Bajo demanda | Reporte personalizado con métricas y período seleccionado |

---

## 6. Métricas calculadas

### Unit Economics
| Métrica | Fórmula | Target |
|---------|---------|--------|
| CAC | Total marketing spend / New customers | Varía por industria |
| LTV | Avg revenue per customer × Avg retention months | >3x CAC |
| LTV:CAC | LTV / CAC | >3:1 |
| Payback Period | CAC / (Monthly revenue per customer) | <12 months |

### Channel Performance
| Métrica | Fórmula |
|---------|---------|
| ROAS | Revenue attributed / Ad spend |
| CPA | Ad spend / Conversions |
| CTR | Clicks / Impressions |
| CVR | Conversions / Clicks |

### Attribution Models
| Modelo | Descripción |
|--------|------------|
| First-touch | 100% crédito al primer contacto |
| Last-touch | 100% crédito al último contacto antes de conversión |
| Linear | Crédito distribuido equitativamente entre todos los touchpoints |
| Data-driven | Crédito basado en contribución real (requiere volumen suficiente) |

---

## 7. Invocación cross-motor (datos fuente)

| Motor | Datos que provee |
|-------|-----------------|
| Ads | Spend, impressions, clicks, conversions, ROAS por campaña |
| Community Management | Engagement rate, reach, impressions, follower growth |
| Email Marketing | Open rate, click rate, conversion rate, unsubscribe rate |
| SEO/Content | Rankings, organic traffic, backlinks, domain authority |
| Sales/CRM | Leads, deals, pipeline value, close rate, revenue |
| Financial Agent (XA-001) | Total marketing spend, budget vs actual |
| Events | Attendance, leads generated, ROI per event |

---

## 8. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| AN-L:an_request | [] | [json] | Interpret analytics request: type (dashboard/report/query), period, metrics requested, comparison period. Output: {type, period, metrics, comparison, report_format} |
| AN-001:an_collect | [an_request] | [json] | Collect data from all relevant motors for the requested period. Aggregate: Ads (spend, impressions, clicks, conversions), CM (engagement, reach, followers), Email (opens, clicks, conversions), SEO (rankings, traffic), Sales (leads, deals, revenue). Output: {datasets: {ads: {}, cm: {}, email: {}, seo: {}, sales: {}}, period, completeness} |
| AN-002:an_analyze | [an_request, an_collect] | [json] | Calculate requested metrics: CAC, LTV, ROAS per channel, funnel conversion rates, attribution. Detect anomalies (>20% change vs previous period). Output: {metrics: {}, anomalies: [], period_comparison: {}} |
| AN-005:an_analyze | [an_request, an_collect] | [json, text] | Answer natural language question using collected data. Translate question to data query, execute, format response in conversational Spanish. Include supporting numbers and context. Output: {question, answer, supporting_data, confidence} |
| AN-003:an_visualize | [an_request, an_analyze] | [json] | Generate dashboard data: KPI cards (metric, value, trend, target), charts (line for trends, bar for comparisons, funnel for conversion), tables (channel comparison). Output: {kpi_cards: [], charts: [], tables: [], period} |
| AN-004:an_visualize | [an_request, an_analyze] | [json] | Generate report with narrative: executive summary (3-5 sentences), metric sections with explanations, anomaly highlights, recommendations (3-5 actionable items). Output: {title, executive_summary, sections: [{title, metrics, narrative}], recommendations: []} |
| AN-L:an_deliver | [an_visualize] | [text, json] | Final review: verify metrics accuracy, narrative clarity, recommendations quality. Compile and deliver. |

---

## 9. Modelo de datos

No requiere tablas nuevas (usa datos de las tablas existentes de cada motor).

### Nuevos valores en enums

**projectStatusEnum**: `an_request`, `an_collect`, `an_analyze`, `an_visualize`, `an_deliver`

**artifactStepEnum**: `an_request`, `an_collect`, `an_analyze`, `an_visualize`, `an_deliver`

**gateTypeEnum**: `an-g1`
