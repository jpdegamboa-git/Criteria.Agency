# Brand Listener — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-023 Monitoreo de marca y reputacion
> Dolores: D-INT-02, D-MCA-05, D-POS-01

---

## 1. Concepto

Motor de escucha continua especializado en la marca del cliente. Corre como loop permanente (no pipeline lineal) — escanea menciones de marca en fuentes abiertas, analiza sentimiento y contexto, y genera reportes periódicos + alertas inmediatas ante crisis o picos de actividad.

Reemplaza el stub LI-001 (Brand Listener) que actualmente solo expone datos mock para el Opportunity Agent. Este motor convierte ese stub en un sistema real con 3 agentes especializados.

Se implementa como scheduled task con loop continuo, no se registra en PipelineRegistry.

---

## 2. Loop

```
[scan] → [analyze] → [report] → (espera configurable) → [scan] → ...
```

### Fases

| Fase | Qué hace | Agente |
|------|----------|--------|
| scan | Escanea fuentes abiertas buscando menciones de marca, productos, personas clave y competidores directos | BL-001 |
| analyze | Analiza sentimiento, contexto, alcance potencial y clasifica por urgencia (crisis / oportunidad / neutro) | BL-002 |
| report | Consolida hallazgos en reporte semanal, despacha alertas inmediatas si detecta crisis o picos significativos | BL-L |

---

## 3. Agentes

### BL-L — Brand Listener Director (Líder)

- **Rol**: Consolida análisis de sentimiento en Brand Health Report semanal, decide despacho de alertas de crisis, prioriza señales para consumo del Opportunity Agent
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader
- **Team**: 28

### BL-001 — Mention Scanner

- **Rol**: Escanea fuentes abiertas (noticias, blogs, foros, redes sociales públicas) buscando menciones de la marca, productos, voceros y variantes ortográficas. Genera un feed estructurado con metadata de fuente, alcance estimado y contexto
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### BL-002 — Sentiment Analyst

- **Rol**: Analiza cada mención del feed clasificando sentimiento (positivo/negativo/neutro/mixto), detecta patrones de crisis emergente (picos de menciones negativas), calcula scores de alcance e impacto
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Outputs

| Output | Frecuencia | Descripción | Consumidor |
|--------|-----------|-------------|------------|
| Brand Health Report | Semanal | Resumen de salud de marca: volumen de menciones, sentimiento promedio, topics principales, comparativa vs semana anterior | Client Service, Opportunity Agent |
| Crisis Alert | Inmediata | Alerta disparada cuando se detecta pico de menciones negativas o mención en medio de alto alcance con sentimiento negativo | Client Service, Community Management |
| Mention Feed | Continuo | Feed estructurado de menciones individuales con metadata (fuente, sentimiento, alcance, contexto) | Opportunity Agent (OP-001) |

---

## 5. Migración desde LI-001 stub

| Aspecto | Stub actual (LI-001) | Motor real (Brand Listener) |
|---------|----------------------|----------------------------|
| Implementación | Mock data estático | Loop continuo con 3 agentes |
| Output | JSON mock de menciones | Feed estructurado + reportes + alertas |
| Frecuencia | Bajo demanda | Continuo (configurable: 1h-24h) |
| Sentimiento | Campo estático | Análisis real con LLM (BL-002) |
| Consumidores | Solo Opportunity Agent | Opportunity Agent + Client Service + Community Management |

El Opportunity Agent (OP-001 Signal Scanner) debe actualizar sus imports para consumir el feed real en lugar del stub.

---

## 6. Context Map entries

```
Brand Listener (C-023)
  ├── upstream: Brand Builder (Brand DNA, keywords de marca)
  ├── upstream: Strategist (audiencias, mercados target)
  ├── downstream: Opportunity Agent (feed de menciones)
  ├── downstream: Client Service (reportes, alertas)
  └── downstream: Community Management (alertas de crisis)
```

---

## 7. Dependencias

| Componente | Rol | Estado |
|-----------|-----|--------|
| Brand Builder | Brand DNA y keywords de marca como input de escaneo | Pipeline existente |
| Strategist | Audiencias target para contextualizar relevancia | Pipeline existente |
| Opportunity Agent | Consumidor principal del feed de menciones | Motor nuevo (este grupo) |
| Client Service | Receptor de Brand Health Reports y alertas | Agente existente |
| Community Management | Receptor de crisis alerts para respuesta inmediata | Motor nuevo |

---

## 8. Modelo de datos

No requiere tablas nuevas. Usa:
- `artifacts` para almacenar menciones escaneadas, análisis de sentimiento y reportes (steps: `bl_scan`, `bl_analyze`, `bl_report`)

### Nuevos valores en enums

**artifactStepEnum**: `bl_scan`, `bl_analyze`, `bl_report`

Nota: NO se agregan a projectStatusEnum ni gateTypeEnum porque no es un pipeline registrado.
