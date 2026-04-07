# Culture Listener — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-024 Monitoreo cultural y de tendencias
> Dolores: D-INT-03, D-DST-07

---

## 1. Concepto

Motor de escucha continua especializado en tendencias culturales, momentos virales y fechas especiales relevantes para la marca. Corre como loop permanente (no pipeline lineal) — escanea el zeitgeist cultural, analiza relevancia para la marca y audiencias del cliente, y genera reportes periódicos + alertas de tendencias relevantes + calendario de fechas especiales.

Reemplaza el stub LI-002 (Culture Listener) que actualmente solo expone datos mock para el Opportunity Agent. Este motor convierte ese stub en un sistema real con 3 agentes especializados.

Se implementa como scheduled task con loop continuo, no se registra en PipelineRegistry.

---

## 2. Loop

```
[scan] → [analyze] → [report] → (espera configurable) → [scan] → ...
```

### Fases

| Fase | Qué hace | Agente |
|------|----------|--------|
| scan | Escanea fuentes culturales buscando tendencias emergentes, momentos virales, memes, formatos nuevos y fechas especiales próximas | CL-001 |
| analyze | Evalúa relevancia de cada tendencia para la marca y audiencias: ¿es apropiable? ¿fit tonal? ¿ventana de tiempo? | CL-002 |
| report | Consolida hallazgos en Trend Report semanal, despacha alertas de tendencias relevantes, actualiza calendario de fechas especiales | CL-L |

---

## 3. Agentes

### CL-L — Culture Listener Director (Líder)

- **Rol**: Consolida análisis de tendencias en Trend Report semanal, decide despacho de alertas de tendencias relevantes, mantiene calendario de fechas especiales, prioriza señales culturales para consumo del Opportunity Agent
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader
- **Team**: 29

### CL-001 — Trend Scanner

- **Rol**: Escanea fuentes culturales (redes sociales trending, medios culturales, plataformas de contenido, calendarios de eventos) detectando tendencias emergentes, formatos virales, memes apropiables y fechas especiales próximas relevantes para la categoría
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### CL-002 — Relevance Analyst

- **Rol**: Cruza cada tendencia detectada con Brand DNA y audiencias del cliente. Evalúa: apropiabilidad (¿la marca puede sumarse sin ser cringe?), fit tonal, ventana de tiempo disponible, potencial de impacto y riesgo reputacional
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

---

## 4. Outputs

| Output | Frecuencia | Descripción | Consumidor |
|--------|-----------|-------------|------------|
| Trend Report | Semanal | Resumen de tendencias culturales: tendencias activas, relevancia para la marca, ventanas de oportunidad, formatos sugeridos | Client Service, Opportunity Agent |
| Relevant Trend Alert | Inmediata | Alerta disparada cuando se detecta tendencia de alta relevancia con ventana de tiempo corta (24-72h) | Opportunity Agent, Community Management |
| Upcoming Special Dates | Continuo | Calendario rolling de fechas especiales próximas (30-90 días) relevantes para la marca y categoría | Opportunity Agent (OP-001), Community Management |

---

## 5. Migración desde LI-002 stub

| Aspecto | Stub actual (LI-002) | Motor real (Culture Listener) |
|---------|----------------------|-------------------------------|
| Implementación | Mock data estático | Loop continuo con 3 agentes |
| Output | JSON mock de tendencias | Feed estructurado + reportes + alertas + calendario |
| Frecuencia | Bajo demanda | Continuo (configurable: 2h-24h) |
| Relevancia | Sin análisis | Análisis real de relevancia con LLM (CL-002) |
| Fechas especiales | No implementado | Calendario rolling con anticipación configurable |
| Consumidores | Solo Opportunity Agent | Opportunity Agent + Client Service + Community Management |

El Opportunity Agent (OP-001 Signal Scanner) debe actualizar sus imports para consumir el feed real en lugar del stub.

---

## 6. Context Map entries

```
Culture Listener (C-024)
  ├── upstream: Brand Builder (Brand DNA, tono de marca)
  ├── upstream: Strategist (audiencias, territorios culturales)
  ├── downstream: Opportunity Agent (feed de tendencias, calendario)
  ├── downstream: Client Service (Trend Reports)
  └── downstream: Community Management (alertas de tendencia, fechas especiales)
```

---

## 7. Dependencias

| Componente | Rol | Estado |
|-----------|-----|--------|
| Brand Builder | Brand DNA y tono de marca como filtro de apropiabilidad | Pipeline existente |
| Strategist | Audiencias y territorios culturales para evaluar relevancia | Pipeline existente |
| Opportunity Agent | Consumidor principal del feed de tendencias y calendario | Motor nuevo (este grupo) |
| Client Service | Receptor de Trend Reports semanales | Agente existente |
| Community Management | Receptor de alertas de tendencia y fechas especiales | Motor nuevo |

---

## 8. Modelo de datos

No requiere tablas nuevas. Usa:
- `artifacts` para almacenar tendencias escaneadas, análisis de relevancia y reportes (steps: `cl_scan`, `cl_analyze`, `cl_report`)

### Nuevos valores en enums

**artifactStepEnum**: `cl_scan`, `cl_analyze`, `cl_report`

Nota: NO se agregan a projectStatusEnum ni gateTypeEnum porque no es un pipeline registrado.
