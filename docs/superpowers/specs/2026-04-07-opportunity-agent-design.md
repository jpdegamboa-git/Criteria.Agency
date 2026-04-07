# Opportunity Agent — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-021 Contenido reactivo y oportunidades, C-027 Detección de oportunidades
> Dolores: D-DST-07, D-INT-03, D-INT-04

---

## 1. Concepto

Agente orquestador con loop continuo — no pipeline lineal. Corre periódicamente, cruza señales de los 4 Listeners (Brand LI-001, Culture LI-002, Industry LI-003, Competitive LI-004) con Brand DNA y audiencias del cliente, y genera alertas de oportunidad con brief sugerido para el motor apropiado.

A diferencia de los otros motores, este NO se registra como pipeline en PipelineRegistry. Se implementa como un scheduled task que genera artifacts de tipo "opportunity".

---

## 2. Loop

```
[scan] → [evaluate] → [alert/brief] → (espera configurable) → [scan] → ...
```

### Fases

| Fase | Qué hace | Agente |
|------|----------|--------|
| scan | Recopila y cruza outputs de los 4 Listeners | OP-001 |
| evaluate | Evalúa relevancia para la marca: ¿es oportunidad real? ¿ventana de tiempo? ¿fit con Brand DNA? | OP-L |
| alert | Si es oportunidad: genera alerta con brief de acción sugerido para el motor apropiado | OP-002 |

---

## 3. Agentes

### OP-L — Opportunity Director (Líder)

- **Rol**: Evalúa señales cruzadas, decide si constituyen una oportunidad real, prioriza por urgencia y potencial de impacto
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader

### OP-001 — Signal Scanner

- **Rol**: Recopila outputs recientes de los 4 Listeners, cruza señales buscando patrones: tendencia cultural que matchea con audiencia, movimiento competitivo que abre gap, mención de marca que puede amplificarse, señal de industria que posiciona como thought leader
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### OP-002 — Activation Planner

- **Rol**: Cuando OP-L aprueba una oportunidad, genera un brief de acción dirigido al motor apropiado: Community Management (contenido reactivo), Ads (campaña oportunística), Writers Room (artículo de thought leadership), SEO/Content (contenido trending)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

---

## 4. Tipos de oportunidad

| Tipo | Fuente | Ventana | Acción típica | Motor destino |
|------|--------|---------|---------------|---------------|
| Tendencia viral | Culture Listener (LI-002) | 24-48h | Post reactivo, meme, contenido trending | Community Management |
| Movimiento competidor | Competitive Listener (LI-004) | 1-2 semanas | Campaña de respuesta, posicionamiento | Ads, Writers Room |
| Mención de marca | Brand Listener (LI-001) | 2-24h | Amplificación, respuesta, engagement | Community Management |
| Señal de industria | Industry Listener (LI-003) | 1-4 semanas | Thought leadership, artículo experto | SEO/Content, Writers Room |
| Fecha especial | Culture Listener (LI-002) | Planificable | Contenido temático | Community Management, Ads |
| Gap competitivo | Competitive Listener (LI-004) | 2-4 semanas | Contenido que llena el gap | SEO/Content |

---

## 5. Implementación

### No usa PipelineRegistry

Este motor NO se registra como pipeline estándar. En su lugar:
- Se implementa como un **scheduled task** (cron-like) que corre cada 4-8 horas (configurable por cliente)
- Cada ejecución genera artifacts de tipo `opportunity` si detecta algo
- Las oportunidades aprobadas se convierten en briefs que crean proyectos en otros motores

### Flujo de datos

```
4 Listeners (stubs) → artifacts recientes
        ↓
OP-001 (Signal Scanner) → cruza señales
        ↓
OP-L (Opportunity Director) → evalúa relevancia
        ↓ (si aprobada)
OP-002 (Activation Planner) → genera brief
        ↓
Crea proyecto en motor destino (CM, Ads, WR, SEO)
```

### Configuración por cliente

```typescript
{
  scanFrequency: "4h" | "8h" | "12h" | "24h",
  minRelevanceScore: 7,    // 1-10, umbral para generar alerta
  autoActivate: false,      // true = crea proyecto automáticamente, false = solo alerta
  opportunityTypes: ["trend", "competitor", "mention", "industry", "date", "gap"],
  notificationChannel: "email" | "dashboard" | "both"
}
```

---

## 6. Dependencias

| Componente | Rol | Estado |
|-----------|-----|--------|
| LI-001 Brand Listener | Señales de menciones de marca | Stub existente |
| LI-002 Culture Listener | Tendencias culturales | Stub existente |
| LI-003 Industry Listener | Señales de industria | Stub existente |
| LI-004 Competitive Listener | Movimientos competitivos | Stub existente |
| Brand Builder | Brand DNA como referencia de fit | Pipeline existente |
| Strategist | Audiencias como referencia de relevancia | Pipeline existente |
| Community Management | Destino para oportunidades sociales | Motor nuevo (este grupo) |
| Ads | Destino para campañas oportunísticas | Motor nuevo (este grupo) |
| Writers Room | Destino para contenido | Motor implementado |
| SEO/Content | Destino para thought leadership | Motor nuevo (este grupo) |

---

## 7. Modelo de datos

No requiere tablas nuevas. Usa:
- `artifacts` para almacenar oportunidades detectadas (step: `op_scan`, `op_evaluate`, `op_alert`)
- `projects` cuando una oportunidad se convierte en brief (con `parentProjectId` = null, referencia en metadata)

### Nuevos valores en enums (opcionales — solo si se quiere trackear como pipeline)

**artifactStepEnum**: `op_scan`, `op_evaluate`, `op_alert`

Nota: NO se agregan a projectStatusEnum ni gateTypeEnum porque no es un pipeline registrado.
