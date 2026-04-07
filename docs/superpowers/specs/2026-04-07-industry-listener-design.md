# Industry Listener — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-025 Monitoreo de industria y categoria
> Dolores: D-INT-05

---

## 1. Concepto

Motor de escucha continua especializado en la industria y categoría del cliente. Corre como loop permanente (no pipeline lineal) — escanea noticias de industria, regulaciones, innovaciones tecnológicas y movimientos de mercado, analiza impacto potencial para la marca, y genera reportes periódicos + alertas ante señales de alto impacto.

Reemplaza el stub LI-003 (Industry Listener) que actualmente solo expone datos mock para el Opportunity Agent. Este motor convierte ese stub en un sistema real con 3 agentes especializados.

Se implementa como scheduled task con loop continuo, no se registra en PipelineRegistry.

---

## 2. Loop

```
[scan] → [analyze] → [report] → (espera configurable) → [scan] → ...
```

### Fases

| Fase | Qué hace | Agente |
|------|----------|--------|
| scan | Escanea fuentes de industria buscando noticias, regulaciones, innovaciones tecnológicas, reportes sectoriales y movimientos de mercado relevantes | IL-001 |
| analyze | Evalúa impacto potencial de cada señal para la marca: ¿afecta operaciones? ¿abre oportunidad de thought leadership? ¿cambia landscape competitivo? | IL-002 |
| report | Consolida hallazgos en Industry Intelligence Report bisemanal, despacha alertas inmediatas ante señales de alto impacto | IL-L |

---

## 3. Agentes

### IL-L — Industry Listener Director (Líder)

- **Rol**: Consolida análisis de impacto en Industry Intelligence Report bisemanal, decide despacho de alertas de alto impacto, prioriza señales de industria para consumo del Opportunity Agent, contextualiza señales con el posicionamiento actual de la marca
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader
- **Team**: 30

### IL-001 — Industry Scanner

- **Rol**: Escanea fuentes de industria (medios sectoriales, reguladores, portales de innovación, asociaciones gremiales, reportes de consultoras) detectando noticias relevantes, cambios regulatorios, innovaciones tecnológicas y movimientos de mercado
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### IL-002 — Impact Analyst

- **Rol**: Evalúa cada señal de industria contra el contexto de la marca. Clasifica impacto (alto/medio/bajo), determina horizonte temporal (inmediato/corto/largo plazo), identifica tipo de oportunidad (thought leadership, adaptación operativa, posicionamiento)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

---

## 4. Outputs

| Output | Frecuencia | Descripción | Consumidor |
|--------|-----------|-------------|------------|
| Industry Intelligence Report | Bisemanal | Resumen de señales de industria: noticias clave, cambios regulatorios, innovaciones, análisis de impacto y recomendaciones de posicionamiento | Client Service, Opportunity Agent |
| High-Impact Signal Alert | Inmediata | Alerta disparada cuando se detecta señal de industria con impacto alto y horizonte temporal inmediato (nueva regulación, disrupción tecnológica, etc.) | Opportunity Agent, Client Service |

---

## 5. Migración desde LI-003 stub

| Aspecto | Stub actual (LI-003) | Motor real (Industry Listener) |
|---------|----------------------|--------------------------------|
| Implementación | Mock data estático | Loop continuo con 3 agentes |
| Output | JSON mock de señales | Feed estructurado + reportes + alertas |
| Frecuencia | Bajo demanda | Continuo (configurable: 6h-48h) |
| Impacto | Sin análisis | Análisis real de impacto con LLM (IL-002) |
| Consumidores | Solo Opportunity Agent | Opportunity Agent + Client Service |

El Opportunity Agent (OP-001 Signal Scanner) debe actualizar sus imports para consumir el feed real en lugar del stub.

---

## 6. Context Map entries

```
Industry Listener (C-025)
  ├── upstream: Brand Builder (categoría, sector, keywords de industria)
  ├── upstream: Strategist (posicionamiento actual, mercados)
  ├── downstream: Opportunity Agent (feed de señales de industria)
  └── downstream: Client Service (Industry Intelligence Reports, alertas)
```

---

## 7. Dependencias

| Componente | Rol | Estado |
|-----------|-----|--------|
| Brand Builder | Categoría, sector y keywords de industria como input de escaneo | Pipeline existente |
| Strategist | Posicionamiento actual y mercados para contextualizar impacto | Pipeline existente |
| Opportunity Agent | Consumidor principal del feed de señales de industria | Motor nuevo (este grupo) |
| Client Service | Receptor de Industry Intelligence Reports y alertas | Agente existente |

---

## 8. Modelo de datos

No requiere tablas nuevas. Usa:
- `artifacts` para almacenar señales escaneadas, análisis de impacto y reportes (steps: `il_scan`, `il_analyze`, `il_report`)

### Nuevos valores en enums

**artifactStepEnum**: `il_scan`, `il_analyze`, `il_report`

Nota: NO se agregan a projectStatusEnum ni gateTypeEnum porque no es un pipeline registrado.
