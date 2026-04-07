# Financial Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capabilities: C-038 Budget Allocation, C-039 Spend Tracking, C-041 P&L Analysis
> Dolores: D-FIN-01, D-FIN-02, D-FIN-04, D-ROI-04

---

## 1. Concepto

Motor de gestión financiera de marketing. Evoluciona el stub XA-001 (Financial Agent) en un motor completo con pipeline propio. Cubre el ciclo completo: desde la solicitud de análisis financiero hasta el reporte final con recomendaciones de reasignación presupuestaria.

Soporta tres casos de uso principales: (1) asignación de presupuesto de marketing por canal y etapa del funnel usando frameworks M6, (2) tracking de gasto real vs presupuesto en tiempo real con alertas de desviación, y (3) análisis P&L por campaña con cálculo de ROI verdadero y proyecciones.

---

## 2. Pipeline

```
[fn_request] → [fn_budget] → [fn-g1: presupuesto aprobado] → [fn_tracking] → [fn_pl] → [fn_deliver]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| fn_request | Interpretación de la solicitud financiera: scope, período, tipo de análisis | FN-L |
| fn_budget | Allocación de presupuesto por canal y etapa del funnel con targets de ROAS y CAC | FN-001 |
| fn_tracking | Tracking de gasto real vs presupuestado con alertas de desviación >10% | FN-002 |
| fn_pl | P&L por campaña: inversión vs retorno, ROI verdadero, proyecciones a 6 meses | FN-003 |
| fn_deliver | Review final, reporte compilado con recomendaciones de reasignación | FN-L |

---

## 3. Agentes

### FN-L — Financial Director (Líder)

- **Rol**: Interpreta solicitudes financieras, define scope y período, supervisa el análisis completo, valida números y entrega reporte ejecutivo con recomendaciones accionables
- **Pasos**: fn_request, fn_deliver
- **Gates**: fn-g1 (evaluador)
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### FN-001 — Budget Allocator

- **Rol**: Distribuye presupuesto de marketing por canal (Meta, Google, TikTok, LinkedIn, etc.) y etapa del funnel (TOFU/MOFU/BOFU). Usa frameworks M6 para optimización. Considera historial de ROAS por canal, targets de CAC, y objetivos de campaña
- **Pasos**: fn_budget
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### FN-002 — Spend Tracker

- **Rol**: Monitorea gasto real vs presupuestado en tiempo real por campaña, canal y período. Calcula burn rate y proyecta fecha de agotamiento de presupuesto. Genera alertas para desviaciones superiores al 10%
- **Pasos**: fn_tracking
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 85%
- **Nivel**: Sub

### FN-003 — P&L Analyst

- **Rol**: Calcula P&L por campaña: inversión total (gasto + costos de producción) vs retorno (revenue atribuido). Determina ROI verdadero. Proyecta retornos futuros basado en tendencias actuales
- **Pasos**: fn_pl
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Presupuesto | fn-g1 | fn_budget | FN-L | 2 | Allocación coherente con objetivos, ROAS targets realistas, distribución por funnel correcta |

---

## 5. Dolores que resuelve

| Dolor | Descripción |
|-------|-------------|
| D-FIN-01 | No sé cuánto presupuesto asignar a cada canal |
| D-FIN-02 | No tengo visibilidad del gasto en tiempo real |
| D-FIN-04 | No sé si mis campañas son rentables |
| D-ROI-04 | No puedo calcular el ROI verdadero de mis inversiones de marketing |

---

## 6. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| FN-L:fn_request | [] | [json] | Interpretar solicitud financiera: tipo (budget_allocation/spend_tracking/pl_analysis), período, canales en scope, budget total disponible |
| FN-001:fn_budget | [fn_request] | [json] | Distribuir presupuesto por canal y etapa del funnel usando M6 frameworks. Considerar CAC targets, historial ROAS por canal, objetivos de campaña. Output: {allocation: [{channel, amount, funnel_stage, expected_roas}], total, rationale} |
| FN-002:fn_tracking | [fn_request, fn_budget] | [json] | Comparar gasto real vs presupuestado por campaña, canal y período. Alertar desviaciones >10%. Calcular burn rate y fecha proyectada de agotamiento. Output: {tracking: [{campaign, budgeted, actual, variance_pct}], alerts: [], burn_rate, forecast_exhaustion} |
| FN-003:fn_pl | [fn_request, fn_budget, fn_tracking] | [json] | Calcular P&L por campaña: inversión (gasto + producción) vs retorno (revenue atribuido). ROI verdadero. Proyecciones a 6 meses. Output: {pl: [{campaign, investment, revenue, roi, projected_6m}], total_marketing_roi} |
| FN-L:fn_deliver | [fn_pl] | [text, json] | Revisar análisis financiero. Validar números, compilar reporte ejecutivo con recomendaciones de reasignación presupuestaria |

---

## 7. Evolución desde XA-001

El stub XA-001 (Financial Agent) se mantiene como alias de compatibilidad con los motores existentes que lo referencian como evaluador externo (Ads, Strategist). El motor Financial opera en paralelo como un motor de primera clase con su propio pipeline cuando se activa directamente.

| Motor que usa XA-001 | Para qué |
|---------------------|----------|
| Ads (ad-g1) | Validar presupuesto del media plan |
| Strategist (st-g1) | Validar presupuesto de objetivos |

---

## 8. Modelo de datos

No requiere tablas nuevas. Usa:
- `projects` con `pipelineType: "financial"`
- `artifacts` para outputs por paso
- `agentExecutions`, `gateReviews`

### Nuevos valores en enums

**projectStatusEnum**: `fn_request`, `fn_budget`, `fn_tracking`, `fn_pl`, `fn_deliver`

**artifactStepEnum**: `fn_request`, `fn_budget`, `fn_tracking`, `fn_pl`, `fn_deliver`

**gateTypeEnum**: `fn-g1`
