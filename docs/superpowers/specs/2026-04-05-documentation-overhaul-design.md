# CriteriaFilms Documentation Overhaul — Design Spec

> Date: April 5, 2026
> Approach: Fortalecer y Completar (Enfoque A)
> Scope: Reestructurar 5 docs existentes + crear 3 nuevos + roadmap técnico

---

## Context

CriteriaFilms tiene 5 documentos de fundación (PROJECT_VISION, TEAM_STRUCTURE, AGENT_REGISTRY, PRODUCTION_PIPELINE, DECISION_LOG) que definen un sistema de 38 agentes para producción automatizada de video. El fundador tiene experiencia real produciendo con IA manualmente y quiere rediseñar desde cero con ojos frescos. Los documentos son sólidos conceptualmente pero tienen gaps críticos: no hay plan de fases/MVP, falta arquitectura técnica, hay redundancia entre docs, y el pipeline no detalla loops de iteración ni estado compartido. El objetivo es producir un set de specs completo que sirva como base para construir el sistema, junto con un roadmap técnico por fases.

---

## 1. Reestructuración de documentos

### Problema
AGENT_REGISTRY y TEAM_STRUCTURE se solapan: la composición de equipos, roles, y handoffs aparece en ambos. PROJECT_VISION incluye un resumen del sistema que ya está detallado en otros docs.

### Cambios

| Documento | Cambio |
|-----------|--------|
| `PROJECT_VISION.md` | Recortar a identidad, misión, modelos de negocio, principios. Quitar "System overview". Agregar KPIs y posicionamiento competitivo. |
| `TEAM_STRUCTURE.md` | Absorber composición de equipos de AGENT_REGISTRY. Se convierte en el doc único de estructura organizacional ("quién hace qué, con quién, y con qué autonomía"). |
| `AGENT_REGISTRY.md` | Convertir a referencia técnica pura: inputs → proceso → outputs → tools/modelos por agente. Sin info de estructura. Agregar fase de implementación y dependencias entre agentes. |
| `PRODUCTION_PIPELINE.md` | Mantener estructura. Agregar loops de iteración, tiempos estimados, estado compartido, diagrama de trabajo paralelo. |
| `DECISION_LOG.md` | Mantener formato. Agregar decisiones de esta sesión. Corregir "Vigent" → "Active". |

---

## 2. Mejoras por documento

### 2.1 PROJECT_VISION.md

**Quitar:**
- Sección "System overview" (38 agents, 8 teams, etc.) — ya está en TEAM_STRUCTURE y AGENT_REGISTRY

**Agregar:**
- **KPIs por modelo de negocio:**
  - Producción: proyectos/mes, tiempo promedio brief-to-delivery, tasa de aprobación en primer intento del cliente, costo promedio por minuto de video
  - Producciones propias: piezas producidas/trimestre, aceptación en festivales/plataformas
  - Escuela: alumnos activos, completion rate, NPS
- **Posicionamiento competitivo:** Qué diferencia a CriteriaFilms de otros estudios que usan IA (calidad cinematográfica vs. video genérico, sistema de gates, experiencia de 20 años en producción real)
- **Referencia cruzada actualizada** a los 8 documentos (incluyendo los 3 nuevos)

### 2.2 TEAM_STRUCTURE.md

**Absorber de AGENT_REGISTRY:**
- Composición detallada de cada equipo (ya parcialmente presente, completar con info faltante)

**Agregar:**
- **Matriz de resolución de conflictos:**
  - DP vs Creative Director (visuals vs narrative) → Showrunner decide
  - Editor vs DP (cut vs shot quality) → Showrunner decide
  - Cross-functional veto vs Team leader → Showrunner media
  - Scope change vs Budget → PM decide con input del cliente
  - Para cada conflicto: quién escala, quién arbitra, criterio de decisión

- **Framework de autonomía operacionalizado:**
  - 90-100%: Ejecuta y reporta. No necesita aprobación previa.
  - 75-89%: Ejecuta la mayoría. Consulta para decisiones que afectan a otros equipos o al presupuesto.
  - 60-74%: Ejecuta lo técnico. Decisiones estéticas/creativas requieren validación.
  - <60%: Ejecuta bajo dirección. Propone pero no decide.

### 2.3 AGENT_REGISTRY.md

**Reestructurar cada agente como ficha técnica:**
```
### [ID]: [Nombre]
- **Fase:** 1 / 2 / 3
- **Inputs:** [qué recibe y de quién]
- **Process:** [qué hace con esos inputs]
- **Outputs:** [qué produce y para quién]
- **Tools/Models:** [herramientas de IA que usa]
- **Quality criteria:** [cómo se mide si su output es bueno]
- **Dependencies:** [qué agentes necesita que hayan terminado antes]
- **Replaceable by human:** [sí/no + perfil del humano]
```

**Quitar:**
- Información de estructura de equipos (ya en TEAM_STRUCTURE)
- Información redundante de roles y comunicación

### 2.4 PRODUCTION_PIPELINE.md

**Agregar:**
- **Loops de iteración por gate:**
  - G1 falla → vuelve a Team 1 (costo: horas de concepto)
  - G2 falla → vuelve a Team 2 (costo: horas de escritura)
  - G3 falla → vuelve a Teams 3/4, puede implicar regenerar storyboard
  - G4 falla → diagnóstico: ¿problema de shots (→ Team 3 regenera específicos), de edición (→ Team 6 re-edita), o de audio (→ Team 5 ajusta)?
  - G5 falla → correcciones puntuales por equipo específico, nunca regenerar todo

- **Tiempos estimados (rangos):**
  - Video corporativo/explainer 1-3 min: brief to delivery estimado
  - Corto/documental 5-15 min: brief to delivery estimado
  - (Rangos, no promesas — depende de iteraciones)

- **Diagrama de estado compartido:**
  - Qué artefactos produce cada paso
  - Dónde se almacenan (project state/database)
  - Quién puede leer vs modificar cada artefacto

- **Diagrama de trabajo paralelo expandido:**
  - Qué equipos pueden trabajar simultáneamente en cada fase
  - Dependencias duras vs soft

### 2.5 DECISION_LOG.md

**Agregar nuevas decisiones:**
- DEC-016: Reestructuración de documentos (eliminar redundancia AGENT_REGISTRY/TEAM_STRUCTURE)
- DEC-017: MVP por fases (3 fases, no big bang)
- DEC-018: Producer en Fase 1 (no Fase 2)
- DEC-019: Creación de 3 documentos nuevos (MVP_ROADMAP, TECH_ARCHITECTURE, PORTAL_SPECS)

**Corregir:** "Vigent" → "Active" en todas las entradas.

---

## 3. Documentos nuevos

### 3.1 MVP_ROADMAP.md

**Contenido:**

**Fase 1: Pipeline mínimo funcional (14 agentes)**
- Agentes: PM, Showrunner, Producer, Creative Director, Head Writer, AV Copywriter (escritor más relevante para corporativo/explainer), Script Doctor, DP, Cinematic Prompt Engineer, Sonorizador, Editor, Delivery Master, Client Service, Cinematographic Critic
- Gates activos: G2 (post-script), G3 (post-storyboard), G5 (final cut)
- Tipo de proyecto target: video corporativo/explainer de 1-3 minutos
- Criterios para avanzar a Fase 2: 3 proyectos completados end-to-end con calidad aceptable

**Fase 2: Calidad y especialización (+10 agentes)**
- Agentes adicionales: Researcher, Casting Director, Narrative Structuralist, escritores adicionales (según demanda), Pre-production Colorist, Camera Movement Director, Post Colorist, Subtitler, Content Compliance, Brand Guardian
- Se activan los 5 gates formales
- Tipos de proyecto target: corporativos más complejos, primeros documentales/cortos
- Criterios para avanzar a Fase 3: 10 proyectos completados, métricas de calidad estables

**Fase 3: Escala y automatización (+resto)**
- Agentes adicionales: Compositor/VFX, Continuity Supervisor, Sound Designer, Foley Artist, Team 8 completo (Operations), Onboarding Specialist, Feedback Interpreter, Accessibility Specialist, AI Filmmaking Tutor
- Tipos de proyecto: todos los formatos, incluyendo ficción y escuela
- Criterios: sistema en operación estable, listos para escalar

**Primer proyecto piloto:**
- Tipo de video recomendado para probar el sistema Fase 1
- Checklist de validación

### 3.2 TECH_ARCHITECTURE.md

**Contenido:**

- **Orquestador de agentes:** Framework recomendado para coordinar los agentes (evaluando opciones como Claude Agent SDK, LangGraph, CrewAI, custom). Cómo se disparan, cómo comparten estado, cómo se manejan los gates.
- **Data model:** Estructura de un "proyecto" — qué campos tiene, qué artefactos produce, cómo se relacionan. Modelo de estado (qué fase está activa, qué gates han pasado).
- **Stack recomendado:** Frontend (portales), backend (API, orquestación), base de datos, storage (archivos de proyecto, videos), modelos de IA por tipo de tarea (generación de video, imagen, audio, texto).
- **Infraestructura:** Hosting, monitoreo, costos estimados por proyecto tipo.
- **Integración criteria.agency:** Cómo se comparten servicios con el ecosistema mayor.

### 3.3 PORTAL_SPECS.md

**Contenido:**

- **Portal público:** Landing, portfolio, servicios, blog/escuela, onboarding de nuevos clientes. Flujo de conversión visitante → cliente.
- **Portal cliente:** Dashboard de proyectos, creación de brief guiada, upload de archivos (drive temporal 15 días), revisión de entregables con comentarios por elemento y timestamp. Flujo completo brief → review → approval.
- **Portal admin:** Command center. Lista de proyectos, estado de cada uno, pipeline visual, orquestación de agentes, comentarios del cliente organizados, billing, legal. Flujo de gestión de proyecto end-to-end.
- **Permisos:** Matriz de qué puede ver/hacer cada tipo de usuario.
- **Elementos comentables:** Script, breakdown, estilo, schedule, storyboard, video final — con formato y flujo de cada tipo de comentario.

---

## 4. Orden de ejecución

1. Reestructurar docs existentes (eliminar redundancia, reorganizar)
2. Mejorar cada doc (KPIs, loops, frameworks, matrices)
3. Crear MVP_ROADMAP.md
4. Crear TECH_ARCHITECTURE.md
5. Crear PORTAL_SPECS.md
6. Actualizar DECISION_LOG.md con decisiones de esta sesión

Cada documento se revisa con el usuario antes de darlo por terminado.

---

## Verificación

- Cada documento modificado mantiene consistencia interna y con los demás
- No hay información duplicada entre TEAM_STRUCTURE y AGENT_REGISTRY
- PROJECT_VISION no repite detalles que están en otros docs
- Todas las referencias cruzadas entre documentos son correctas
- DECISION_LOG refleja todas las decisiones tomadas
- MVP_ROADMAP tiene criterios claros de éxito por fase
- Los 38 agentes están asignados a exactamente una fase
