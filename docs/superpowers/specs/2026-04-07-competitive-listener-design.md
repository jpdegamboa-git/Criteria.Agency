# Competitive Listener — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-026 Monitoreo competitivo
> Dolores: D-INT-01, D-EST-04, D-POS-02, D-POS-07

---

## 1. Concepto

Motor de escucha continua especializado en competidores directos e indirectos del cliente. Corre como loop permanente (no pipeline lineal) — escanea actividad de competidores (comunicaciones, campañas, lanzamientos, movimientos estratégicos), analiza gaps y amenazas, y genera un dashboard competitivo mensual + alertas ante movimientos significativos.

Reemplaza el stub LI-004 (Competitive Listener) que actualmente solo expone datos mock para el Opportunity Agent. Este motor convierte ese stub en un sistema real con 3 agentes especializados.

Se implementa como scheduled task con loop continuo, no se registra en PipelineRegistry.

---

## 2. Loop

```
[scan] → [analyze] → [report] → (espera configurable) → [scan] → ...
```

### Fases

| Fase | Qué hace | Agente |
|------|----------|--------|
| scan | Escanea actividad pública de competidores: campañas, contenido social, lanzamientos, comunicados, cambios de posicionamiento | CO-001 |
| analyze | Identifica gaps competitivos, amenazas emergentes, territorios abandonados y oportunidades de diferenciación | CO-002 |
| report | Consolida hallazgos en Competitive Dashboard mensual, despacha alertas inmediatas ante movimientos significativos de competidores | CO-L |

---

## 3. Agentes

### CO-L — Competitive Listener Director (Líder)

- **Rol**: Consolida análisis competitivo en Competitive Dashboard mensual, decide despacho de alertas de movimientos significativos, mantiene el mapa competitivo actualizado, prioriza señales para consumo del Opportunity Agent
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader
- **Team**: 31

### CO-001 — Competitor Scanner

- **Rol**: Escanea actividad pública de competidores definidos en Brand DNA (redes sociales, sitios web, comunicados de prensa, campañas activas, lanzamientos de producto). Genera feed estructurado con metadata de competidor, tipo de actividad, alcance estimado y canal
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### CO-002 — Gap Analyst

- **Rol**: Cruza actividad de competidores con posicionamiento actual de la marca. Identifica: gaps de contenido (territorios que nadie ocupa), amenazas (competidor entrando en territorio propio), oportunidades de diferenciación (competidor abandonando un espacio), debilidades explotables
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

---

## 4. Outputs

| Output | Frecuencia | Descripción | Consumidor |
|--------|-----------|-------------|------------|
| Competitive Dashboard | Mensual | Mapa competitivo actualizado: actividad por competidor, share of voice estimado, gaps identificados, amenazas activas, oportunidades de diferenciación | Client Service, Strategist, Opportunity Agent |
| Movement Alert | Inmediata | Alerta disparada cuando un competidor realiza un movimiento significativo: lanzamiento de producto, cambio de posicionamiento, campaña agresiva en territorio propio | Opportunity Agent, Client Service |

---

## 5. Migración desde LI-004 stub

| Aspecto | Stub actual (LI-004) | Motor real (Competitive Listener) |
|---------|----------------------|-----------------------------------|
| Implementación | Mock data estático | Loop continuo con 3 agentes |
| Output | JSON mock de competidores | Dashboard + feed estructurado + alertas |
| Frecuencia | Bajo demanda | Continuo (configurable: 4h-24h) |
| Análisis de gaps | No implementado | Análisis real de gaps con LLM (CO-002) |
| Mapa competitivo | No existe | Dashboard mensual con share of voice y territorios |
| Consumidores | Solo Opportunity Agent | Opportunity Agent + Client Service + Strategist |

El Opportunity Agent (OP-001 Signal Scanner) debe actualizar sus imports para consumir el feed real en lugar del stub.

---

## 6. Context Map entries

```
Competitive Listener (C-026)
  ├── upstream: Brand Builder (competidores definidos, posicionamiento propio)
  ├── upstream: Strategist (territorios estratégicos, audiencias compartidas)
  ├── downstream: Opportunity Agent (feed de movimientos competitivos, gaps)
  ├── downstream: Client Service (Competitive Dashboard, alertas)
  └── downstream: Strategist (input para revisión estratégica)
```

---

## 7. Dependencias

| Componente | Rol | Estado |
|-----------|-----|--------|
| Brand Builder | Lista de competidores y posicionamiento propio como referencia | Pipeline existente |
| Strategist | Territorios estratégicos y audiencias para contextualizar gaps | Pipeline existente |
| Opportunity Agent | Consumidor principal del feed de movimientos y gaps | Motor nuevo (este grupo) |
| Client Service | Receptor de Competitive Dashboard y alertas | Agente existente |
| Strategist (como downstream) | Receptor de insights para revisión estratégica periódica | Pipeline existente |

---

## 8. Modelo de datos

No requiere tablas nuevas. Usa:
- `artifacts` para almacenar actividad de competidores, análisis de gaps y dashboards (steps: `co_scan`, `co_analyze`, `co_report`)

### Nuevos valores en enums

**artifactStepEnum**: `co_scan`, `co_analyze`, `co_report`

Nota: NO se agregan a projectStatusEnum ni gateTypeEnum porque no es un pipeline registrado.
