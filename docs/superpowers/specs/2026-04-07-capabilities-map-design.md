# criteria.agency — Mapa de Capacidades

> Date: April 7, 2026
> Status: Approved design
> Scope: Inventario completo de dolores del gerente de marketing, capacidades de la plataforma, y framework de proceso dual (desarrollo + cliente)

---

## 1. Filosofía

**"La IA genera. El criterio decide."**

criteria.agency no es un generador de contenido. Es un **director de marketing virtual** — un sistema de ~125 agentes especializados organizados en 24 motores que cubre desde la estrategia hasta la medición, pasando por la producción y distribución.

### Para quién

| Tier | Cliente | Necesidad principal |
|------|---------|-------------------|
| **PyME** | 1-20 empleados, sin departamento de marketing | Todo resuelto: estrategia, marca, producción básica |
| **Mediana** | 20-200 empleados, gerente de marketing con equipo limitado | Escalar capacidades: distribución, medición, ventas |
| **Agencia** | Agencia de marketing que quiere automatizar | Volumen + inteligencia + marketplace + white-label |

### Principios

- **Dolor primero:** Cada capacidad existe porque resuelve un problema real del gerente de marketing
- **Muchos a muchos:** Un dolor puede ser resuelto por múltiples capacidades. Una capacidad puede aliviar múltiples dolores
- **Motores sirven a capacidades:** La infraestructura técnica (motores, agentes) sirve a las capacidades, no al revés
- **Inventario abierto:** Se pueden agregar dolores y capacidades en cualquier momento
- **Framework dual:** Cada capacidad tiene un proceso de desarrollo (interno) y un proceso de experiencia (cliente)

---

## 2. Framework de Proceso Dual

Cada capacidad se evalúa en dos dimensiones paralelas:

### Lado Desarrollo (estado interno)

| Fase | Qué cubre |
|------|-----------|
| **Diseño** | Spec escrito, agentes definidos, pipeline mapeado |
| **Implementación** | Código construido, agentes funcionales, integraciones activas |
| **Pruebas** | Testing con datos reales, edge cases cubiertos |
| **Lanzamiento** | Disponible en plataforma para clientes |

**Estados:**

| Icono | Estado | Significado |
|-------|--------|-------------|
| ✅ | Completo | Listo y funcionando |
| 🟡 | Parcial | Existe pero le faltan piezas |
| 🔧 | En desarrollo | Se está construyendo activamente |
| 📋 | Diseñado | Spec existe pero no se ha empezado a construir |
| 💭 | Concepto | Idea identificada, sin spec |

### Lado Cliente (experiencia)

| Dimensión | Qué responde |
|-----------|-------------|
| **Objetivo** | Qué resuelve esta capacidad para el cliente |
| **KPIs** | Cómo se mide el éxito |
| **Quick Win** | Qué puede lograr el cliente en la primera semana |
| **Feedback Loop** | Cómo el cliente retroalimenta y mejora los resultados |
| **Madurez** | Qué tan lista está para ser usada |

**Niveles de madurez:**

| Icono | Nivel | Significado |
|-------|-------|-------------|
| 🟢 | Producción | Disponible y probado con clientes reales |
| 🟡 | Beta | Funcional pero en pruebas internas |
| 🟠 | Alpha | Funciona parcialmente, requiere intervención manual |
| 🔴 | En desarrollo | No disponible para clientes aún |
| ⚪ | Roadmap | Planificado, con fecha estimada |

---

## 3. Registro de Dolores

Inventario abierto de problemas reales que enfrenta un gerente de marketing. Organizados por área temática — los temas son organizacionales, no fijos.

### 3.1 Estrategia y Dirección

| ID | Dolor |
|----|-------|
| D-EST-01 | No sé por dónde empezar con mi marketing |
| D-EST-02 | No tengo un plan de marketing documentado |
| D-EST-03 | No sé quién es mi audiencia ideal |
| D-EST-04 | No sé qué me diferencia de la competencia |
| D-EST-05 | Tomo decisiones de marketing por intuición, no por datos |
| D-EST-06 | No sé en qué canales debo estar presente |
| D-EST-07 | No tengo objetivos de marketing claros ni medibles |

### 3.2 Medición y ROI

| ID | Dolor |
|----|-------|
| D-ROI-01 | No sé si mi marketing está funcionando |
| D-ROI-02 | No puedo atribuir ventas a campañas específicas |
| D-ROI-03 | No sé cuánto me cuesta adquirir un cliente (CAC) |
| D-ROI-04 | No sé dónde poner el presupuesto para máximo retorno |
| D-ROI-05 | No tengo dashboards ni reportes automatizados |
| D-ROI-06 | Mis reportes llegan tarde y ya no sirven para decidir |
| D-ROI-07 | No conozco el valor de vida de mis clientes (LTV) |

### 3.3 Marca e Identidad

| ID | Dolor |
|----|-------|
| D-MCA-01 | No tengo identidad de marca definida |
| D-MCA-02 | Cada pieza de comunicación se ve diferente |
| D-MCA-03 | Mi tono de voz cambia según quién produce el contenido |
| D-MCA-04 | No tengo un manual de marca actualizado |
| D-MCA-05 | Mi marca no refleja lo que realmente somos hoy |

### 3.4 Posicionamiento

| ID | Dolor |
|----|-------|
| D-POS-01 | No sé cómo me percibe el mercado vs cómo quiero ser percibido |
| D-POS-02 | Mi marca se confunde con la competencia, no tengo diferenciación clara |
| D-POS-03 | No tengo un statement de posicionamiento documentado |
| D-POS-04 | Mi posicionamiento no se traduce en mi comunicación — digo una cosa pero comunico otra |
| D-POS-05 | No sé si mi propuesta de valor resuena con mi audiencia |
| D-POS-06 | Quiero reposicionar mi marca pero no sé cómo hacerlo sin perder lo que ya tengo |
| D-POS-07 | No tengo un marco de referencia competitivo claro (contra quién compito y por qué soy mejor) |

### 3.5 Producción de Contenido

| ID | Dolor |
|----|-------|
| D-PRD-01 | Necesito videos pero no tengo productora |
| D-PRD-02 | Necesito diseños pero no tengo diseñador |
| D-PRD-03 | Necesito copy pero no tengo redactor |
| D-PRD-04 | Necesito un sitio web y no tengo desarrollador |
| D-PRD-05 | Necesito audio/podcast pero no sé producirlo |
| D-PRD-06 | Necesito material impreso y no gestiono proveedores |
| D-PRD-07 | Necesito organizar eventos pero no tengo experiencia |

### 3.6 Distribución y Canales

| ID | Dolor |
|----|-------|
| D-DST-01 | No publico con la frecuencia que debería en redes |
| D-DST-02 | No sé qué publicar en cada plataforma |
| D-DST-03 | Mis emails no los abre nadie |
| D-DST-04 | No aparezco en Google |
| D-DST-05 | Gasto en pauta pero no optimizo las campañas |
| D-DST-06 | No respondo comentarios ni mensajes a tiempo |
| D-DST-07 | No aprovecho oportunidades de contenido reactivo |
| D-DST-08 | Cada canal es un universo independiente — herramientas, métricas y formatos diferentes |
| D-DST-09 | Necesito ver todos mis KPIs en un solo lugar, no en 10 plataformas distintas |
| D-DST-10 | Los canales tradicionales (TV, radio, prensa, vallas) son difíciles de contratar, gestionar y monitorear |

### 3.7 Ventas e Integración Comercial

| ID | Dolor |
|----|-------|
| D-VTA-01 | Marketing y ventas no se hablan |
| D-VTA-02 | No le doy seguimiento a los leads |
| D-VTA-03 | No sé qué leads son buenos y cuáles no (scoring) |
| D-VTA-04 | Pierdo oportunidades por no responder rápido |
| D-VTA-05 | No tengo un pipeline de ventas organizado |
| D-VTA-06 | No genero propuestas comerciales profesionales |
| D-VTA-07 | No sé de dónde vienen mis mejores clientes |

### 3.8 Escala y Eficiencia

| ID | Dolor |
|----|-------|
| D-ESC-01 | No puedo producir contenido para todos mis canales |
| D-ESC-02 | De la idea al contenido publicado pasan semanas |
| D-ESC-03 | Dependo de una sola persona para todo el marketing |
| D-ESC-04 | Cada campaña empieza de cero, no reutilizo nada |
| D-ESC-05 | No puedo atender más clientes sin contratar más gente |

### 3.9 Inteligencia y Contexto

| ID | Dolor |
|----|-------|
| D-INT-01 | No sé qué hace mi competencia |
| D-INT-02 | No escucho qué dicen de mi marca online |
| D-INT-03 | No detecto tendencias culturales a tiempo |
| D-INT-04 | No identifico oportunidades de mercado |
| D-INT-05 | No sé qué pasa en mi industria hasta que es tarde |

### 3.10 Presupuesto y Finanzas

| ID | Dolor |
|----|-------|
| D-FIN-01 | No sé cuánto debería gastar en marketing |
| D-FIN-02 | No controlo el gasto por campaña ni por canal |
| D-FIN-03 | No sé si mis proveedores me cobran lo justo |
| D-FIN-04 | No tengo visibilidad de marketing como inversión vs gasto |

### 3.11 Seguridad y Confianza

| ID | Dolor |
|----|-------|
| D-SEG-01 | Me preocupa que la IA publique algo incorrecto sin supervisión |
| D-SEG-02 | No sé si mis datos de clientes están seguros |
| D-SEG-03 | No tengo control sobre qué puede hacer la IA y qué no |

---

## 4. Registro de Capacidades

### Estrategia

---

#### C-001: Diagnóstico de marketing

**Qué resuelve:** Evalúa tu situación actual, identifica fortalezas y brechas, y te dice por dónde empezar.

**Quick Win:** En tu primera semana recibes un diagnóstico completo con las 3 acciones más urgentes.

**Dolores que alivia:** D-EST-01, D-EST-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Pipeline del Strategist diseñado (paso 1: Diagnostic) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Entender tu punto de partida y priorizar acciones de marketing |
| KPIs | Brechas identificadas, acciones priorizadas, tiempo a primer plan |
| Quick Win | Diagnóstico completo en <48h desde onboarding |
| Feedback Loop | El diagnóstico se actualiza conforme se ejecutan campañas y se obtienen datos reales |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Strategist | Diagnóstico inicial usando frameworks Harvard M1-M2 |
| Analytics | Datos históricos si el cliente ya tiene presencia |
| Listeners (x4) | Contexto de mercado, competencia y cultura |

---

#### C-002: Plan de marketing completo

**Qué resuelve:** Objetivos, audiencias, propuesta de valor, canales y presupuesto en un documento accionable — no en tu cabeza.

**Quick Win:** Plan de marketing documentado en tu primera semana, con presupuesto distribuido y calendario.

**Dolores que alivia:** D-EST-02, D-EST-06, D-EST-07, D-FIN-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Pipeline completo del Strategist (pasos 1-6, 3 gates) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tener un plan de marketing profesional, medible y ejecutable |
| KPIs | Objetivos definidos con métricas, canales seleccionados con justificación, presupuesto distribuido por canal y etapa de funnel |
| Quick Win | Plan completo en <1 semana desde el diagnóstico |
| Feedback Loop | El plan se revisa mensualmente con datos reales de performance. El Strategist ajusta automáticamente |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Strategist | Pipeline completo: diagnóstico → objetivos → audiencias → valor → media plan → presupuesto |
| Financial Agent | Validación económica y distribución de presupuesto |
| Channel Manager | Conocimiento de cada canal para recomendar mix |
| Brand Guardian | Alineación con Brand DNA |

---

#### C-003: Definición de audiencias

**Qué resuelve:** Segmentación clara de tu cliente ideal — quién es, qué le importa, dónde está, qué lo motiva.

**Quick Win:** Perfiles de audiencia documentados con datos demográficos, comportamentales y motivacionales.

**Dolores que alivia:** D-EST-03, D-POS-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Paso 3 del pipeline Strategist |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Conocer profundamente a tu audiencia para comunicar con precisión |
| KPIs | Segmentos definidos, match rate con datos reales, conversion rate por segmento |
| Quick Win | 2-3 buyer personas documentadas en la primera semana |
| Feedback Loop | Los segmentos se refinan con datos de campañas reales — qué audiencias convierten mejor |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Strategist | Segmentación (M2) |
| Culture Listener | Tendencias relevantes por audiencia |
| Analytics | Datos de comportamiento si existen |

---

#### C-004: Análisis competitivo

**Qué resuelve:** Mapea qué hace tu competencia, encuentra brechas y define tu diferenciación.

**Quick Win:** Reporte de tu top 5 competidores con fortalezas, debilidades y oportunidades para ti.

**Dolores que alivia:** D-EST-04, D-INT-01, D-POS-02, D-POS-07

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Competitive Listener + Strategist 3Cs |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Saber exactamente contra quién compites y por qué eres la mejor opción |
| KPIs | Competidores mapeados, gaps identificados, diferenciadores documentados |
| Quick Win | Análisis competitivo inicial en <72h |
| Feedback Loop | Monitoreo continuo — el Competitive Listener alerta cuando un competidor hace un movimiento relevante |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Competitive Listener | Monitoreo continuo de actividad competitiva |
| Strategist | Framework 3Cs para posicionamiento |
| Media Scout | Descubre dónde comunican los competidores |

---

#### C-005: Generación de briefs de campaña

**Qué resuelve:** Traduce tu plan de marketing en instrucciones ejecutables por canal, formato y presupuesto.

**Quick Win:** Briefs listos para ejecutar que alimentan directamente a los motores de producción y distribución.

**Dolores que alivia:** D-EST-05, D-EST-06, D-ESC-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Output del pipeline Strategist (G3) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Que cada campaña arranque con instrucciones claras y completas |
| KPIs | Briefs generados/mes, tasa de ejecución sin re-brief, tiempo plan→brief |
| Quick Win | Primer brief de campaña generado automáticamente desde tu plan |
| Feedback Loop | Los resultados de cada campaña retroalimentan la calidad de los briefs futuros |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Strategist | Genera briefs como output del plan |
| Channel Manager | Specs por canal para cada brief |
| Financial Agent | Presupuesto asignado por brief |

---

### Marca

---

#### C-006: Construcción de marca desde cero

**Qué resuelve:** Workshop guiado que produce tu Brand DNA: misión, valores, posicionamiento, identidad visual y verbal.

**Quick Win:** En tu primera semana tienes un Brand DNA Document que define quién eres como marca.

**Dolores que alivia:** D-MCA-01, D-MCA-05, D-POS-03

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Brand Builder pipeline completo (5 pasos, 3 gates) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tener una marca definida profesionalmente, no improvisada |
| KPIs | Brand DNA completado, elementos de identidad definidos, aprobación del cliente |
| Quick Win | Workshop guiado completado y Brand DNA Document entregado en <1 semana |
| Feedback Loop | Brand DNA evoluciona con el negocio — se revisa trimestralmente con datos de percepción |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Brand Builder | Pipeline completo de construcción de marca |
| Culture Listener | Tendencias culturales relevantes para la marca |
| Competitive Listener | Mapeo competitivo para diferenciación |

---

#### C-007: Guardián de marca

**Qué resuelve:** Validación automática de que cada pieza producida respeta tu identidad visual, tono y lineamientos.

**Quick Win:** Desde el primer contenido que produces, el sistema valida coherencia antes de que salga.

**Dolores que alivia:** D-MCA-02, D-MCA-03, D-MCA-04, D-POS-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Brand Guardian como agente transversal |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Garantizar que toda pieza de comunicación sea consistente con tu marca |
| KPIs | % de piezas que pasan validación en primer intento, inconsistencias detectadas/mes |
| Quick Win | Activación automática desde el primer proyecto — no requiere configuración adicional |
| Feedback Loop | Cada corrección enseña al guardián a ser más preciso sobre tu marca específica |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Brand Guardian | Validación en cada gate de cada motor |
| Brand Builder | Provee el Brand DNA como referencia |

---

#### C-008: Manual de marca vivo

**Qué resuelve:** Documento de marca que se actualiza y evoluciona con tu negocio, siempre accesible.

**Quick Win:** Manual de marca generado automáticamente desde tu Brand DNA, compartible con tu equipo.

**Dolores que alivia:** D-MCA-04, D-MCA-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 💭 Concepto | Extensión del Brand DNA Document |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tener una referencia siempre actualizada de tu marca para cualquier persona que produzca contenido |
| KPIs | Accesos al manual/mes, actualizaciones realizadas, adopción por equipo |
| Quick Win | Manual compartible listo inmediatamente después del Brand Builder |
| Feedback Loop | Se actualiza automáticamente cuando se modifica el Brand DNA o se detectan evoluciones de marca |
| Madurez | ⚪ Roadmap |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Brand Builder | Fuente del contenido |
| Brand Guardian | Valida que el manual refleje las reglas activas |

---

### Producción de Contenido

---

#### C-009: Producción de video end-to-end

**Qué resuelve:** Del brief al video final sin que necesites productora, editores ni equipo técnico.

**Quick Win:** En tu primera semana puedes tener un video corporativo de 1-3 minutos listo para publicar.

**Dolores que alivia:** D-PRD-01, D-ESC-01, D-ESC-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | ✅ Completo | Spec completo, 47 agentes diseñados, 5 gates definidos |
| Implementación | 🟡 Parcial | 20 agentes activos con Gemini Flash. Video gen necesita billing |
| Pruebas | 🟡 Parcial | Pipeline probado end-to-end con texto. Multimedia pendiente |
| Lanzamiento | 🔴 Pendiente | Requiere activar billing de Veo/Kling/Imagen |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Producir videos profesionales de forma autónoma con supervisión humana en puntos clave |
| KPIs | Videos entregados/mes, tiempo promedio brief→entrega, tasa de aprobación en primera revisión, costo por video vs mercado |
| Quick Win | Video corporativo explainer en <72h desde el brief |
| Feedback Loop | Cliente revisa en portal con comentarios por timestamp. Revisiones alimentan al sistema para mejorar futuras producciones |
| Madurez | 🟡 Beta — pipeline funcional con texto, multimedia pendiente de billing |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Video Production (9 teams) | Pipeline completo de producción |
| Brand Guardian | Coherencia visual y verbal |
| Financial Agent | Costo por video, control de presupuesto |
| Channel Manager | Specs de entrega por plataforma destino |

---

#### C-010: Diseño gráfico on-demand

**Qué resuelve:** Piezas visuales para cualquier formato sin necesitar un diseñador en tu equipo.

**Quick Win:** Primeras piezas para redes sociales alineadas a tu marca en <48h.

**Dolores que alivia:** D-PRD-02, D-ESC-01, D-MCA-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Motor Graphic Design (~5 agentes) en marketing-engine spec |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Producir piezas visuales profesionales y consistentes para cualquier canal |
| KPIs | Piezas entregadas/mes, tiempo brief→entrega, adherencia a Brand DNA |
| Quick Win | Kit de piezas para redes sociales en la primera semana |
| Feedback Loop | Preferencias visuales del cliente se aprenden con cada revisión |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Graphic Design | Pipeline de producción visual |
| Brand Guardian | Validación de identidad visual |
| Channel Manager | Specs de formato por plataforma |

---

#### C-011: Copywriting especializado

**Qué resuelve:** Textos profesionales para cualquier canal y formato, siempre en tu tono de voz.

**Quick Win:** Copy para tu próxima campaña listo en <24h.

**Dolores que alivia:** D-PRD-03, D-MCA-03, D-ESC-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 🟡 Parcial | AV Copywriter (T2-002) diseñado. Copywriters para otros formatos por diseñar |
| Implementación | 🟡 Parcial | T2-002 activo para guiones AV |
| Pruebas | 🟡 Parcial | Probado en pipeline de video |
| Lanzamiento | 🔴 Pendiente | Solo disponible dentro del pipeline de video |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tener copy profesional para cualquier necesidad sin esperar a un redactor |
| KPIs | Piezas de copy/mes, tasa de aprobación sin edición, consistencia de tono |
| Quick Win | Copy para campaña activa en <24h |
| Feedback Loop | Cada edición del cliente enseña al sistema su estilo y preferencias de voz |
| Madurez | 🟠 Alpha — funcional solo para guiones AV |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Writers Room | Equipo de redacción (Head Writer + especialistas) |
| Brand Guardian | Validación de tono y voz |
| Strategist | Contexto de campaña y mensajes clave |

---

#### C-012: Desarrollo web

**Qué resuelve:** Landing pages, micrositios y sitios web sin necesitar un desarrollador.

**Quick Win:** Landing page para tu próxima campaña lista en <1 semana.

**Dolores que alivia:** D-PRD-04, D-DST-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Motor Web (~4 agentes) en marketing-engine spec |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Presencia web profesional que convierte visitantes en leads o clientes |
| KPIs | Tiempo de desarrollo, conversion rate, page speed score, SEO score |
| Quick Win | Landing page de campaña en <1 semana |
| Feedback Loop | Analytics alimentan optimización continua de conversión |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Web | Pipeline de desarrollo |
| SEO/Content | Optimización on-page |
| Brand Guardian | Adherencia visual |
| Analytics | Tracking de conversión |

---

#### C-013: Producción de audio

**Qué resuelve:** Podcasts, jingles, spots de radio, voiceovers y diseño sonoro sin estudio propio.

**Quick Win:** Voiceover profesional para tu video o spot en <48h.

**Dolores que alivia:** D-PRD-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 🟡 Parcial | Sonorizador (T5-L) diseñado para video. Motor Audio independiente por diseñar |
| Implementación | 🟡 Parcial | T5-L activo dentro del pipeline de video |
| Pruebas | 🟡 Parcial | Probado como parte de video pipeline |
| Lanzamiento | 🔴 Pendiente | Solo disponible dentro del pipeline de video |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Producir contenido de audio profesional para cualquier formato |
| KPIs | Piezas de audio/mes, calidad de VO (naturalidad), tiempo de entrega |
| Quick Win | Voiceover para tu primer video en <48h |
| Feedback Loop | Preferencias de voz, música y estilo se almacenan para consistencia |
| Madurez | 🟠 Alpha — funcional solo dentro del pipeline de video |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Audio | Pipeline independiente de producción de audio |
| Video Production (T5-L) | Sonorización para video |
| Brand Guardian | Coherencia de identidad sonora |

---

#### C-014: Gestión de producción impresa

**Qué resuelve:** Cotización, preprensa, control de calidad y entrega de material físico sin gestionar proveedores.

**Quick Win:** Cotización comparativa de 3 proveedores para tu material impreso en <48h.

**Dolores que alivia:** D-PRD-06, D-FIN-03

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Print Production pipeline completo (7 pasos, 3 gates) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Material impreso de calidad sin gestionar la cadena de producción |
| KPIs | Costo por pieza vs mercado, calidad de color, tiempo de entrega, satisfacción |
| Quick Win | Primera cotización comparativa en <48h |
| Feedback Loop | Proveedores se califican por calidad y cumplimiento, mejorando selección futura |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Print Production | Pipeline completo preprensa → producción → entrega |
| Marketplace | Registro de proveedores, cotizaciones, contratación |
| Brand Guardian | Validación de identidad en adaptación física |
| Financial Agent | Control de costos |

---

#### C-015: Producción de eventos

**Qué resuelve:** Del concepto a la ejecución y medición de eventos sin equipo de producción propio.

**Quick Win:** Concepto y plan de evento listo en <1 semana.

**Dolores que alivia:** D-PRD-07, D-ESC-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Events pipeline completo (7 pasos, 3 gates) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Eventos profesionales que generan leads, contenido y brand awareness |
| KPIs | Asistencia vs target, leads generados, ROI del evento, NPS, cobertura |
| Quick Win | Concepto + plan + presupuesto estimado en <1 semana |
| Feedback Loop | Cada evento alimenta aprendizajes sobre venues, proveedores y formatos que funcionan |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Events | Pipeline completo de producción de eventos |
| Marketplace | Proveedores (venues, catering, A/V, logística) |
| Community Management | Cobertura social pre/durante/post evento |
| Email Marketing | Invitaciones y follow-up |
| Video Production | Cobertura audiovisual y recap |

---

### Distribución y Canales

---

#### C-016: Gestión de pauta digital

**Qué resuelve:** Campañas de pauta en todas las plataformas con setup, optimización continua y reportes unificados.

**Quick Win:** Primera campaña digital configurada y optimizándose en <1 semana.

**Dolores que alivia:** D-DST-05, D-DST-08, D-ROI-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Ads pipeline (6 pasos, 3 gates) + 11 canales |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Maximizar retorno de inversión publicitaria en todos los canales digitales |
| KPIs | ROAS, CAC, CTR, CPC, conversiones, presupuesto ejecutado vs asignado |
| Quick Win | Campaña en tu canal principal corriendo y optimizándose en <1 semana |
| Feedback Loop | Optimización continua diaria. Reportes semanales. Autonomía configurable: la IA optimiza automáticamente o te recomienda cambios para tu aprobación |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Ads (Pauta) | Pipeline completo de gestión de campañas |
| Channel Manager | Expertise por plataforma (Meta, Google, TikTok, LinkedIn, etc.) |
| Analytics | Tracking de performance |
| Financial Agent | Control de gasto |
| Graphic Design / Video | Creación de assets publicitarios |

---

#### C-017: Community management

**Qué resuelve:** Presencia constante en redes sociales con calendario, publicación y engagement sin un CM dedicado.

**Quick Win:** Calendario editorial para el mes siguiente listo en <48h.

**Dolores que alivia:** D-DST-01, D-DST-02, D-DST-06

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Community Management loop continuo |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Presencia profesional y constante en redes sociales sin esfuerzo diario |
| KPIs | Frecuencia de publicación, engagement rate, tiempo de respuesta, follower growth |
| Quick Win | Calendario editorial del mes + primeras publicaciones programadas |
| Feedback Loop | Contenido de mejor performance se analiza para replicar patrones exitosos |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Community Management | Loop continuo: calendario → publicación → escucha → respuesta → engagement |
| Brand Guardian | Validación de tono y voz en cada publicación |
| Graphic Design | Assets visuales para cada publicación |
| Opportunity Agent | Contenido reactivo para momentos relevantes |

---

#### C-018: Email marketing

**Qué resuelve:** Campañas de email, secuencias automatizadas y nurture flows que realmente se abren y convierten.

**Quick Win:** Secuencia de bienvenida automatizada configurada en <48h.

**Dolores que alivia:** D-DST-03, D-VTA-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Email Marketing pipeline (7 pasos, 1 gate) + 6 flows automatizados |
| Implementación | 🟡 Parcial | Nurture sequence básica implementada (4 emails) con Resend |
| Pruebas | 🟡 Parcial | Probado con secuencia de waitlist |
| Lanzamiento | 🔴 Pendiente | Requiere Resend API key para producción |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Comunicación por email que nutre leads, retiene clientes y genera ventas |
| KPIs | Open rate, CTR, conversion rate, unsub rate, revenue atribuido |
| Quick Win | Secuencia de bienvenida automatizada en <48h |
| Feedback Loop | A/B testing continuo. Subject lines, contenido y timing se optimizan con cada envío |
| Madurez | 🟠 Alpha — secuencia básica funcional, motor completo pendiente |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Email Marketing | Pipeline de campañas + flows automatizados |
| Writers Room | Copy para emails |
| Graphic Design | Templates y assets visuales |
| Analytics | Tracking de performance |
| Sales/CRM | Segmentación por etapa de pipeline |

---

#### C-019: SEO y contenido orgánico

**Qué resuelve:** Aparecer en Google con contenido relevante que atrae tráfico calificado sin pagar por clic.

**Quick Win:** Auditoría SEO de tu sitio + plan de contenido orgánico en <1 semana.

**Dolores que alivia:** D-DST-04, D-ESC-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | SEO/Content pipeline (5 pasos, 1 gate) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tráfico orgánico sostenible que reduce dependencia de pauta |
| KPIs | Posiciones en keywords target, tráfico orgánico, backlinks, domain authority |
| Quick Win | Auditoría técnica SEO + 10 keywords prioritarias en <1 semana |
| Feedback Loop | Optimización continua basada en rankings y tráfico. Content refresh de piezas que pierden posición |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| SEO/Content | Pipeline completo: keywords → estrategia → producción → publicación → optimización |
| Writers Room | Producción de contenido |
| Web | Publicación y optimización técnica |
| Analytics | Tracking de rankings y tráfico |

---

#### C-020: Gestión de canales tradicionales

**Qué resuelve:** Contratación, negociación y monitoreo de TV, radio, prensa, vallas y otros medios offline.

**Quick Win:** Plan de medios tradicionales con cotizaciones comparativas en <1 semana.

**Dolores que alivia:** D-DST-10, D-FIN-03

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Channel Manager con skills de canales tradicionales + Marketplace |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Acceder a canales tradicionales con la misma facilidad que a los digitales |
| KPIs | Costo vs mercado, alcance estimado, compliance de pauta (transmisiones reales), ROI |
| Quick Win | Cotización comparativa de medios tradicionales relevantes |
| Feedback Loop | Proveedores se califican. Datos de alcance y costo alimentan futuras negociaciones |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Channel Manager | Skills de cada canal tradicional (specs, costos, mejores prácticas) |
| Marketplace | Registro de medios, negociación, contratación |
| Media Scout | Descubrimiento de oportunidades en medios |
| Financial Agent | Control de inversión |

---

#### C-021: Contenido reactivo y oportunidades

**Qué resuelve:** Detectar momentos culturales relevantes y generar contenido en ventanas de tiempo cortas.

**Quick Win:** Primera alerta de oportunidad relevante para tu marca.

**Dolores que alivia:** D-DST-07, D-INT-03, D-INT-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Opportunity Agent + 4 Listeners |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | No perder oportunidades de comunicación por falta de velocidad o atención |
| KPIs | Oportunidades detectadas/mes, tiempo detección→publicación, engagement de contenido reactivo vs planificado |
| Quick Win | Primera alerta de oportunidad relevante para tu marca |
| Feedback Loop | El sistema aprende qué tipo de oportunidades son relevantes para tu marca y cuáles ignorar |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Opportunity Agent | Cruza datos de los 4 Listeners + audiencias + Brand DNA |
| Culture Listener | Tendencias y momentos virales |
| Brand Listener | Relevancia para tu marca |
| Community Management | Publicación rápida de contenido reactivo |
| Graphic Design / Video | Producción express de assets |

---

#### C-022: Canal unificado

**Qué resuelve:** Un solo experto virtual que conoce las reglas, formatos, costos y mejores prácticas de cada canal.

**Quick Win:** Consulta sobre cualquier canal y recibe specs, costos estimados y recomendaciones al instante.

**Dolores que alivia:** D-DST-08

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Channel Manager con skill registry extensible |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | No tener que ser experto en cada plataforma para tomar buenas decisiones de canal |
| KPIs | Canales cubiertos, precisión de specs, ahorro en errores de formato |
| Quick Win | Consulta inmediata sobre specs, costos y prácticas de cualquier canal |
| Feedback Loop | Nuevos canales se agregan como skills. Datos de performance refinan recomendaciones por canal |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Channel Manager | Agente + registro de skills por canal |
| Media Scout | Descubrimiento de nuevos canales relevantes |

---

### Inteligencia

---

#### C-023: Escucha de marca

**Qué resuelve:** Monitoreo continuo de lo que dicen de tu marca online con alertas de sentimiento y crisis.

**Quick Win:** Primer reporte de salud de marca con sentimiento actual.

**Dolores que alivia:** D-INT-02, D-MCA-05, D-POS-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Brand Listener (agente continuo) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Saber en tiempo real qué se dice de tu marca y reaccionar a tiempo |
| KPIs | Menciones monitoreadas, brand health score, tiempo de detección de crisis, sentimiento trending |
| Quick Win | Primer Brand Health Report en <72h |
| Feedback Loop | El sistema aprende qué menciones son relevantes y cuáles son ruido |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Brand Listener | Ingestion → análisis → insights → alertas |
| Community Management | Respuesta a menciones que requieren acción |

---

#### C-024: Escucha cultural

**Qué resuelve:** Detección de tendencias, temas virales y movimientos sociales relevantes para tu audiencia.

**Quick Win:** Feed de tendencias culturales relevantes para tu marca esta semana.

**Dolores que alivia:** D-INT-03, D-DST-07

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Culture Listener (agente continuo) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Nunca estar desconectado de lo que le importa a tu audiencia |
| KPIs | Tendencias detectadas/semana, relevancia para marca, contenido reactivo generado |
| Quick Win | Feed de tendencias relevantes en la primera semana |
| Feedback Loop | El sistema aprende qué temas resuenan con tu audiencia específica |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Culture Listener | Monitoreo de tendencias sociales y culturales |
| Opportunity Agent | Cruza tendencias con audiencias y marca |

---

#### C-025: Inteligencia de industria

**Qué resuelve:** Seguimiento de publicaciones, reportes, patentes e innovación en tu sector.

**Quick Win:** Primer reporte de inteligencia de tu industria.

**Dolores que alivia:** D-INT-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Industry Listener (agente continuo) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Estar al día con tu industria sin leer 50 publicaciones |
| KPIs | Señales de innovación detectadas/mes, tiempo de detección, accionabilidad |
| Quick Win | Reporte de inteligencia de industria en <1 semana |
| Feedback Loop | El sistema prioriza fuentes y temas que el cliente marca como relevantes |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Industry Listener | Monitoreo de publicaciones, reportes, patentes |

---

#### C-026: Monitoreo competitivo continuo

**Qué resuelve:** Tracking automático de la actividad de tus competidores: campañas, lanzamientos, precios, contenido.

**Quick Win:** Dashboard con la actividad reciente de tus top 5 competidores.

**Dolores que alivia:** D-INT-01, D-EST-04, D-POS-02, D-POS-07

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Competitive Listener (agente continuo) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Nunca ser sorprendido por un movimiento de la competencia |
| KPIs | Movimientos detectados/mes, gaps identificados, tiempo de alerta |
| Quick Win | Dashboard competitivo inicial en <1 semana |
| Feedback Loop | Alertas se refinan — menos ruido, más señales accionables |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Competitive Listener | Monitoreo continuo de competidores |
| Strategist | Contexto estratégico para evaluar impacto |

---

#### C-027: Detección de oportunidades

**Qué resuelve:** Cruza toda tu inteligencia para generar oportunidades accionables con ventana de tiempo.

**Quick Win:** Primera oportunidad detectada automáticamente con brief de acción sugerido.

**Dolores que alivia:** D-INT-04, D-DST-07, D-EST-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Opportunity Agent (cruza 4 Listeners) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Convertir inteligencia en acción antes de que la ventana se cierre |
| KPIs | Oportunidades detectadas/mes, % aprovechadas, impacto en métricas |
| Quick Win | Primera oportunidad detectada con brief accionable |
| Feedback Loop | El sistema aprende qué oportunidades realmente generan impacto para tu marca |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Opportunity Agent | Cruza outputs de los 4 Listeners + audiencias + Brand DNA |
| Brand Listener | Relevancia de marca |
| Culture Listener | Tendencias culturales |
| Industry Listener | Señales de industria |
| Competitive Listener | Brechas competitivas |

---

### Ventas

---

#### C-028: Captura y enriquecimiento de leads

**Qué resuelve:** Centraliza leads de todos tus canales, los enriquece con datos públicos y los organiza.

**Quick Win:** Todos tus leads de la última campaña centralizados y enriquecidos en <48h.

**Dolores que alivia:** D-VTA-01, D-VTA-02, D-VTA-07

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Sales/CRM pipeline (pasos 1-2) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | No perder ni un lead y tener contexto antes del primer contacto |
| KPIs | Leads capturados/mes por canal, tasa de enriquecimiento, datos completados |
| Quick Win | Leads de última campaña centralizados y enriquecidos en <48h |
| Feedback Loop | Fuentes de leads se califican por calidad de conversión |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Sales/CRM | Captura y centralización |
| Media Scout | Contexto de leads que son media/influencers |
| Analytics | Atribución de origen |

---

#### C-029: Lead scoring automático

**Qué resuelve:** Modelo de puntuación para saber cuáles leads perseguir primero.

**Quick Win:** Tus leads actuales rankeados por probabilidad de cierre.

**Dolores que alivia:** D-VTA-03, D-VTA-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Sales/CRM pipeline (paso 3: scoring BANT) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Invertir tiempo de ventas en los leads con mayor probabilidad de cierre |
| KPIs | Conversion rate por score tier, tiempo de respuesta a leads hot, accuracy del modelo |
| Quick Win | Ranking de leads actuales por probabilidad de cierre |
| Feedback Loop | Cada cierre/pérdida retroalimenta el modelo de scoring |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Sales/CRM | Modelo de scoring (Fit + Intent + Budget) |
| Analytics | Datos de comportamiento para intent score |

---

#### C-030: Pipeline de ventas

**Qué resuelve:** Kanban visual con etapas claras, follow-ups automáticos y alertas de oportunidades enfriándose.

**Quick Win:** Pipeline organizado con tus deals actuales y follow-ups configurados.

**Dolores que alivia:** D-VTA-05, D-VTA-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Sales/CRM pipeline (pasos 4-8: qualification → close) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | No perder oportunidades por falta de seguimiento |
| KPIs | Deal velocity, conversion rate por etapa, deals perdidos por inactividad, pipeline value |
| Quick Win | Pipeline organizado con deals actuales en <1 día |
| Feedback Loop | Patrones de deals ganados/perdidos informan mejoras en el proceso |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Sales/CRM | Pipeline Kanban con alertas y automations |
| Email Marketing | Follow-ups y nurture de leads warm/cold |

---

#### C-031: Generación de propuestas comerciales

**Qué resuelve:** Propuestas profesionales generadas automáticamente con tu branding y validación financiera.

**Quick Win:** Primera propuesta comercial profesional generada en <24h.

**Dolores que alivia:** D-VTA-06, D-MCA-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Sales/CRM pipeline (paso 6: proposal) |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Propuestas profesionales y consistentes en minutos, no horas |
| KPIs | Tiempo de generación, tasa de aceptación, revenue por propuesta |
| Quick Win | Primera propuesta profesional con tu branding en <24h |
| Feedback Loop | Propuestas ganadoras informan templates y pricing futuros |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Sales/CRM | Generación de propuesta |
| Brand Guardian | Adherencia visual a Brand DNA |
| Financial Agent | Validación de pricing |

---

#### C-032: Atribución de origen de clientes

**Qué resuelve:** Saber exactamente de qué canal, campaña y contenido vino cada cliente cerrado.

**Quick Win:** Primer reporte de atribución mostrando de dónde vienen tus clientes actuales.

**Dolores que alivia:** D-VTA-07, D-ROI-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Analytics + Sales/CRM integrados |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Invertir más en lo que funciona y menos en lo que no |
| KPIs | % de clientes con atribución completa, canales top por revenue, CAC por canal |
| Quick Win | Reporte de atribución de clientes actuales |
| Feedback Loop | Cada cierre enriquece el modelo de atribución |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Analytics | Modelos de atribución (first-touch, last-touch, lineal, data-driven) |
| Sales/CRM | Datos de cierre |
| Ads | Datos de campaña |

---

### Medición y Reportes

---

#### C-033: Dashboard ejecutivo unificado

**Qué resuelve:** Todos tus KPIs de marketing en un solo lugar, en lenguaje simple, sin entrar a 10 plataformas.

**Quick Win:** Dashboard unificado con tus métricas principales al terminar la primera semana.

**Dolores que alivia:** D-ROI-01, D-ROI-05, D-DST-09

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Analytics transversal con 5 dashboards |
| Implementación | 🟡 Parcial | Dashboard financiero implementado (KPIs, gráfico de flujo, transacciones) |
| Pruebas | 🟡 Parcial | Probado con datos financieros reales |
| Lanzamiento | 🔴 Pendiente | Falta integración con canales de marketing |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tomar decisiones informadas sin ser experto en analytics |
| KPIs | Uso del dashboard/semana, tiempo en dashboard, decisiones tomadas con datos |
| Quick Win | Dashboard con métricas principales al terminar setup |
| Feedback Loop | Widgets y métricas se priorizan según lo que el cliente más consulta |
| Madurez | 🟠 Alpha — dashboard financiero funcional, marketing pendiente |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Analytics | Agregación cross-canal |
| Financial Agent | Métricas financieras |
| Todos los motores de distribución | Datos de performance |

---

#### C-034: Atribución multicanal

**Qué resuelve:** Saber qué canales realmente generan resultados con modelos de atribución profesionales.

**Quick Win:** Primer análisis de atribución con datos históricos disponibles.

**Dolores que alivia:** D-ROI-02, D-ROI-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Analytics con 4 modelos de atribución |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Distribuir presupuesto basado en datos reales de contribución por canal |
| KPIs | Revenue atribuido por canal, path-to-purchase length, assisted conversions |
| Quick Win | Análisis de atribución con datos disponibles |
| Feedback Loop | Más datos = modelos más precisos. Data-driven attribution disponible a partir de volumen suficiente |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Analytics | Modelos de atribución |
| Ads | Datos de paid |
| SEO/Content | Datos de organic |
| Email Marketing | Datos de email |
| Community Management | Datos de social |

---

#### C-035: Cálculo automático de CAC y LTV

**Qué resuelve:** Saber cuánto cuesta y cuánto vale cada cliente, actualizado en tiempo real.

**Quick Win:** CAC y LTV calculados con tus datos actuales.

**Dolores que alivia:** D-ROI-03, D-ROI-07

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Analytics con fórmulas M6 |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Conocer el unit economics de tu negocio para tomar decisiones de inversión |
| KPIs | CAC, LTV, LTV:CAC ratio (target >3:1), payback period |
| Quick Win | CAC y LTV estimados con datos disponibles |
| Feedback Loop | Se recalculan continuamente con cada nuevo cliente y cada mes de retención |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Analytics | Cálculos de CAC, LTV, ratios |
| Financial Agent | Datos de inversión y revenue |
| Sales/CRM | Datos de adquisición y retención |

---

#### C-036: Reportes automatizados

**Qué resuelve:** Reportes diarios, semanales y mensuales que llegan solos, sin que nadie los pida.

**Quick Win:** Primer reporte semanal automatizado al final de tu primera semana.

**Dolores que alivia:** D-ROI-05, D-ROI-06

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Analytics con 4 tipos de reportes automatizados |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Información oportuna sin esfuerzo — el reporte llega a ti, no tú al reporte |
| KPIs | Reportes entregados a tiempo, alertas accionables detectadas, decisiones informadas por reportes |
| Quick Win | Primer reporte semanal al final de semana 1 |
| Feedback Loop | Formato y contenido se ajustan según qué secciones el cliente lee y cuáles ignora |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Analytics | Generación de reportes (diario, semanal, mensual, on-demand) |
| Email Marketing | Entrega de reportes |
| All distribution motors | Datos fuente |

---

#### C-037: Reportes en lenguaje natural

**Qué resuelve:** Pregunta lo que quieras sobre tu marketing y recibe una respuesta con datos, no un spreadsheet.

**Quick Win:** Tu primera pregunta respondida con datos reales en <1 minuto.

**Dolores que alivia:** D-ROI-06, D-EST-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Analytics con interfaz conversacional |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Acceder a insights de datos sin ser analista ni saber de herramientas |
| KPIs | Preguntas resueltas/semana, satisfacción con respuestas, uso recurrente |
| Quick Win | Primera pregunta respondida con datos reales |
| Feedback Loop | Preguntas frecuentes se anticipan en dashboards y reportes automáticos |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Analytics | Motor de consultas en lenguaje natural |
| All motors | Datos fuente |

---

### Presupuesto y Finanzas

---

#### C-038: Asignación inteligente de presupuesto

**Qué resuelve:** Distribución óptima de tu presupuesto de marketing por canal y etapa de funnel.

**Quick Win:** Propuesta de distribución de tu presupuesto actual basada en datos y frameworks M6.

**Dolores que alivia:** D-FIN-01, D-ROI-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Strategist paso 6 + Financial Agent |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Maximizar impacto de cada dólar invertido en marketing |
| KPIs | ROAS por canal, eficiencia de asignación, desviación vs forecast |
| Quick Win | Propuesta de distribución presupuestaria en la primera semana |
| Feedback Loop | Performance real ajusta la distribución continuamente |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Financial Agent | Distribución y control de presupuesto |
| Strategist | Frameworks M6 (CAC target, ROAS, LTV) |
| Analytics | Performance real por canal |

---

#### C-039: Control de gasto por campaña

**Qué resuelve:** Tracking en tiempo real de inversión vs presupuesto con alertas de desviación.

**Quick Win:** Vista de gasto actual por campaña y canal al instante.

**Dolores que alivia:** D-FIN-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Financial Agent |
| Implementación | 🟡 Parcial | Módulo financiero con control de transacciones implementado |
| Pruebas | 🟡 Parcial | Probado con transacciones bancarias reales |
| Lanzamiento | 🔴 Pendiente | Falta integración con motores de distribución |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Nunca gastar más de lo planeado sin saberlo |
| KPIs | Gasto actual vs presupuesto por campaña, alertas de umbral, forecast de agotamiento |
| Quick Win | Vista de gasto actual por campaña |
| Feedback Loop | Patrones de gasto informan presupuestos futuros |
| Madurez | 🟠 Alpha — control financiero básico funcional |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Financial Agent | Control de presupuesto en tiempo real |
| Analytics | Dashboard de costos |
| Ads | Datos de gasto en pauta |

---

#### C-040: Validación de proveedores y costos

**Qué resuelve:** Comparación de cotizaciones y verificación de precios justos para servicios externos.

**Quick Win:** Cotización comparativa para tu próxima necesidad de proveedores.

**Dolores que alivia:** D-FIN-03

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Marketplace + Financial Agent |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | No pagar de más ni contratar mal por falta de opciones |
| KPIs | Ahorro vs precio de mercado, calificación de proveedores, tiempo de contratación |
| Quick Win | Primera cotización comparativa para un servicio que necesites |
| Feedback Loop | Proveedores se califican por calidad, precio, cumplimiento y comunicación |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Marketplace | Registro de proveedores, cotización, contratación |
| Financial Agent | Validación de costos |

---

#### C-041: Marketing como inversión

**Qué resuelve:** P&L por campaña, ROI real, y proyección de retorno para justificar presupuesto ante dirección.

**Quick Win:** Primer P&L de campaña mostrando inversión vs retorno real.

**Dolores que alivia:** D-FIN-04, D-ROI-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Financial Agent + Analytics |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Demostrar que marketing es una inversión, no un gasto — con números |
| KPIs | ROI por campaña, ROAS, P&L de marketing, % de revenue atribuible a marketing |
| Quick Win | P&L de tu campaña más reciente |
| Feedback Loop | Datos acumulados construyen el caso de negocio para aumentar inversión |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Financial Agent | P&L por campaña y agregado |
| Analytics | Atribución de revenue |
| Sales/CRM | Datos de cierre |

---

### Escala y Eficiencia

---

#### C-042: Producción multicanal desde un solo brief

**Qué resuelve:** Un brief genera piezas adaptadas para cada canal automáticamente.

**Quick Win:** Un brief → piezas para 3+ canales sin esfuerzo adicional.

**Dolores que alivia:** D-ESC-01, D-DST-08, D-ESC-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Orquestación cross-motor desde briefs del Strategist |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Multiplicar tu presencia sin multiplicar tu esfuerzo |
| KPIs | Canales cubiertos por brief, tiempo brief→todos los canales, consistencia cross-canal |
| Quick Win | Un brief → piezas para tus 3 canales principales |
| Feedback Loop | Performance por canal informa qué adaptaciones funcionan mejor |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Strategist | Genera briefs multicanal |
| Channel Manager | Specs por canal |
| Graphic Design / Video / Writers Room | Producción adaptada por formato |
| Brand Guardian | Coherencia cross-canal |

---

#### C-043: Reutilización inteligente de activos

**Qué resuelve:** El sistema sabe qué piezas tienes y las adapta para nuevos usos sin empezar de cero.

**Quick Win:** Inventario de tus assets existentes con sugerencias de reutilización.

**Dolores que alivia:** D-ESC-04

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 💭 Concepto | Asset registry + AI recommendations |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Maximizar el valor de cada pieza de contenido producida |
| KPIs | % de assets reutilizados, ahorro en producción, vida útil promedio de assets |
| Quick Win | Inventario de assets + primeras sugerencias de reutilización |
| Feedback Loop | Assets de mejor performance se priorizan para reutilización |
| Madurez | ⚪ Roadmap |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Asset Registry (nuevo) | Indexación y categorización de todos los assets |
| Channel Manager | Specs para adaptar assets a nuevos canales |
| Graphic Design / Video | Adaptación de formatos |

---

#### C-044: Equipo virtual escalable

**Qué resuelve:** 125 agentes especializados que no se enferman, no renuncian y trabajan en paralelo.

**Quick Win:** Acceso inmediato a todas las especialidades sin contratar a nadie.

**Dolores que alivia:** D-ESC-03, D-ESC-05

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | ✅ Completo | 125 agentes diseñados en 24 motores |
| Implementación | 🟡 Parcial | 20 agentes activos (Phase 1) |
| Pruebas | 🟡 Parcial | 20 agentes probados con ejecución real |
| Lanzamiento | 🔴 Pendiente | Disponible en beta para video pipeline |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | No depender de disponibilidad, rotación o capacidad de personas individuales |
| KPIs | Agentes disponibles, tareas ejecutadas en paralelo, uptime, costo vs equipo humano equivalente |
| Quick Win | 20 agentes especializados disponibles desde día 1 |
| Feedback Loop | Performance de agentes mejora con cada proyecto |
| Madurez | 🟡 Beta — 20/125 agentes activos |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Todos los motores | Cada motor provee sus agentes especializados |
| Orchestration Framework | State machine, gates, 3+3 rule, dispatcher |

---

### Posicionamiento

---

#### C-048: Diagnóstico y definición de posicionamiento

**Qué resuelve:** Analiza cómo te perciben vs cómo quieres ser percibido, y produce un posicionamiento documentado.

**Quick Win:** Statement de posicionamiento con propuesta de valor y marco competitivo en <1 semana.

**Dolores que alivia:** D-POS-01, D-POS-02, D-POS-03, D-POS-04, D-POS-05, D-POS-07

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Brand Builder paso 3 (Positioning) + Strategist 3Cs |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Saber exactamente quién eres en el mercado, para quién, y por qué te eligen |
| KPIs | Posicionamiento documentado, validación con audiencia, coherencia en comunicación |
| Quick Win | Statement de posicionamiento + propuesta de valor en <1 semana |
| Feedback Loop | Brand Listener monitorea percepción real vs posicionamiento deseado |
| Madurez | 🔴 En desarrollo |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Brand Builder | Framework de posicionamiento (3Cs) |
| Strategist | Validación estratégica |
| Brand Listener | Percepción actual de mercado |
| Competitive Listener | Marco competitivo |

---

#### C-049: Reposicionamiento estratégico

**Qué resuelve:** Migrar tu marca de una posición a otra sin perder lo que ya construiste.

**Quick Win:** Plan de transición con fases claras y métricas de progreso.

**Dolores que alivia:** D-POS-06, D-POS-01

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 💭 Concepto | Extensión del Brand Builder + Strategist |
| Implementación | 🔴 Pendiente | — |
| Pruebas | 🔴 Pendiente | — |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Evolucionar tu posicionamiento de forma controlada y medible |
| KPIs | Progreso de percepción (viejo → nuevo), retención de brand equity, métricas de comunicación por fase |
| Quick Win | Plan de transición con fases y métricas en <1 semana |
| Feedback Loop | Brand Listener mide evolución de percepción en cada fase |
| Madurez | ⚪ Roadmap |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Brand Builder | Auditoría de percepción + diseño de posición objetivo |
| Strategist | Plan de transición |
| Brand Listener | Monitoreo de percepción |
| Brand Guardian | Enforcement gradual de nueva identidad |

---

### Seguridad y Control

---

#### C-045: Autonomía configurable

**Qué resuelve:** Tú decides qué puede hacer la IA sola y qué requiere tu aprobación.

**Quick Win:** Configuración de nivel de autonomía en tu primera sesión.

**Dolores que alivia:** D-SEG-01, D-SEG-03

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | ✅ Completo | "AI decides" vs "AI recommends" por motor/campaña |
| Implementación | 🟡 Parcial | Quality gates implementados en video pipeline |
| Pruebas | 🟡 Parcial | Probado con 5 gates del video pipeline |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Control total sin micromanagement — supervisar, no operar |
| KPIs | Acciones auto-aprobadas vs revisadas, incidentes evitados, tiempo ahorrado |
| Quick Win | Niveles de autonomía configurados en el onboarding |
| Feedback Loop | Confianza crece con uso — clientes naturalmente amplían autonomía |
| Madurez | 🟡 Beta — funcional en video pipeline |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Orchestration Framework | Configurable autonomy levels per motor |
| All motors | Respetan configuración de autonomía |

---

#### C-046: Protección de datos de clientes

**Qué resuelve:** Multi-tenancy, cifrado, cumplimiento regulatorio y auditoría continua.

**Quick Win:** Garantía de aislamiento de datos desde el día 1.

**Dolores que alivia:** D-SEG-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | 📋 Diseñado | Security Team con 6 agentes especializados |
| Implementación | 🟡 Parcial | Auth, sessions, API key protection implementados |
| Pruebas | 🔴 Pendiente | Auditoría formal pendiente |
| Lanzamiento | 🔴 Pendiente | — |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Tranquilidad de que tus datos y los de tus clientes están seguros |
| KPIs | Incidentes de seguridad, compliance score, tiempo de detección de anomalías |
| Quick Win | Certificación de aislamiento de datos en onboarding |
| Feedback Loop | Auditorías periódicas automatizadas con reportes de compliance |
| Madurez | 🟠 Alpha — auth y sessions funcionales, equipo de seguridad pendiente |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Security Team | 6 agentes: Code Guardian, Infrastructure Sentinel, Data Protection Officer, Agent Auditor, Threat Hunter, Security Architect |

---

#### C-047: Gates de calidad humanos

**Qué resuelve:** Puntos de control obligatorios donde un humano revisa antes de que algo se publique o envíe.

**Quick Win:** Gates activos desde tu primer proyecto — nada sale sin tu visto bueno.

**Dolores que alivia:** D-SEG-01, D-MCA-02

**Proceso — Lado Desarrollo**

| Fase | Estado | Notas |
|------|--------|-------|
| Diseño | ✅ Completo | 5 gates definidos + 3+3 rule + review portal |
| Implementación | 🟡 Parcial | Gates y review portal implementados para video |
| Pruebas | 🟡 Parcial | Probados end-to-end en video pipeline |
| Lanzamiento | 🔴 Pendiente | Solo en video pipeline |

**Proceso — Lado Cliente**

| Dimensión | Detalle |
|-----------|---------|
| Objetivo | Confianza de que la IA nunca publicará algo que no hayas aprobado en puntos críticos |
| KPIs | % de outputs revisados en gate, tasa de aprobación, tiempo de revisión |
| Quick Win | Gates activos automáticamente desde el primer proyecto |
| Feedback Loop | Cada revisión enseña al sistema para reducir rechazos futuros |
| Madurez | 🟡 Beta — funcional en video pipeline |

**Infraestructura**

| Motor | Rol |
|-------|-----|
| Orchestration Framework | Quality gates + 3+3 escalation rule |
| Review Portal | Interfaz de revisión para el cliente |
| Showrunner | Evaluador senior de calidad |
| Cinematographic Critic | Evaluación formal cuantitativa |

---

## 5. Vistas de Referencia Cruzada

### 5.1 Matriz Dolor → Capacidades

| Dolor | Capacidades |
|-------|-------------|
| D-EST-01 | C-001, C-002 |
| D-EST-02 | C-002 |
| D-EST-03 | C-003 |
| D-EST-04 | C-004, C-026 |
| D-EST-05 | C-001, C-005, C-027, C-037 |
| D-EST-06 | C-002, C-005 |
| D-EST-07 | C-002 |
| D-ROI-01 | C-033, C-041 |
| D-ROI-02 | C-032, C-034 |
| D-ROI-03 | C-035 |
| D-ROI-04 | C-016, C-034, C-038 |
| D-ROI-05 | C-033, C-036 |
| D-ROI-06 | C-036, C-037 |
| D-ROI-07 | C-035 |
| D-MCA-01 | C-006 |
| D-MCA-02 | C-007, C-031, C-047 |
| D-MCA-03 | C-007, C-011 |
| D-MCA-04 | C-007, C-008 |
| D-MCA-05 | C-006, C-008, C-023 |
| D-POS-01 | C-023, C-048, C-049 |
| D-POS-02 | C-004, C-006, C-048 |
| D-POS-03 | C-006, C-048 |
| D-POS-04 | C-007, C-048 |
| D-POS-05 | C-003, C-048 |
| D-POS-06 | C-049 |
| D-POS-07 | C-004, C-048 |
| D-PRD-01 | C-009 |
| D-PRD-02 | C-010 |
| D-PRD-03 | C-011 |
| D-PRD-04 | C-012 |
| D-PRD-05 | C-013 |
| D-PRD-06 | C-014 |
| D-PRD-07 | C-015 |
| D-DST-01 | C-017 |
| D-DST-02 | C-017 |
| D-DST-03 | C-018 |
| D-DST-04 | C-012, C-019 |
| D-DST-05 | C-016 |
| D-DST-06 | C-017 |
| D-DST-07 | C-021, C-024, C-027 |
| D-DST-08 | C-016, C-022, C-042 |
| D-DST-09 | C-033 |
| D-DST-10 | C-020 |
| D-VTA-01 | C-028 |
| D-VTA-02 | C-018, C-028 |
| D-VTA-03 | C-029 |
| D-VTA-04 | C-029, C-030 |
| D-VTA-05 | C-030 |
| D-VTA-06 | C-031 |
| D-VTA-07 | C-028, C-032 |
| D-ESC-01 | C-009, C-010, C-011, C-015, C-019, C-042 |
| D-ESC-02 | C-005, C-009, C-042 |
| D-ESC-03 | C-044 |
| D-ESC-04 | C-043 |
| D-ESC-05 | C-044 |
| D-INT-01 | C-004, C-026 |
| D-INT-02 | C-023 |
| D-INT-03 | C-021, C-024 |
| D-INT-04 | C-027 |
| D-INT-05 | C-025 |
| D-FIN-01 | C-002, C-038 |
| D-FIN-02 | C-039 |
| D-FIN-03 | C-014, C-020, C-040 |
| D-FIN-04 | C-041 |
| D-SEG-01 | C-045, C-047 |
| D-SEG-02 | C-046 |
| D-SEG-03 | C-045 |

### 5.2 Matriz Capacidad → Motores

| Capacidad | Motores |
|-----------|---------|
| C-001 Diagnóstico de marketing | Strategist, Analytics, Listeners (x4) |
| C-002 Plan de marketing | Strategist, Financial Agent, Channel Manager, Brand Guardian |
| C-003 Definición de audiencias | Strategist, Culture Listener, Analytics |
| C-004 Análisis competitivo | Competitive Listener, Strategist, Media Scout |
| C-005 Generación de briefs | Strategist, Channel Manager, Financial Agent |
| C-006 Construcción de marca | Brand Builder, Culture Listener, Competitive Listener |
| C-007 Guardián de marca | Brand Guardian, Brand Builder |
| C-008 Manual de marca vivo | Brand Builder, Brand Guardian |
| C-009 Producción de video | Video Production, Brand Guardian, Financial Agent, Channel Manager |
| C-010 Diseño gráfico | Graphic Design, Brand Guardian, Channel Manager |
| C-011 Copywriting | Writers Room, Brand Guardian, Strategist |
| C-012 Desarrollo web | Web, SEO/Content, Brand Guardian, Analytics |
| C-013 Producción de audio | Audio, Video Production (T5-L), Brand Guardian |
| C-014 Producción impresa | Print Production, Marketplace, Brand Guardian, Financial Agent |
| C-015 Producción de eventos | Events, Marketplace, Community Mgmt, Email, Video |
| C-016 Gestión de pauta digital | Ads, Channel Manager, Analytics, Financial Agent, Design/Video |
| C-017 Community management | Community Mgmt, Brand Guardian, Design, Opportunity Agent |
| C-018 Email marketing | Email Marketing, Writers Room, Design, Analytics, Sales/CRM |
| C-019 SEO y contenido orgánico | SEO/Content, Writers Room, Web, Analytics |
| C-020 Canales tradicionales | Channel Manager, Marketplace, Media Scout, Financial Agent |
| C-021 Contenido reactivo | Opportunity Agent, Culture Listener, Brand Listener, Community Mgmt, Design/Video |
| C-022 Canal unificado | Channel Manager, Media Scout |
| C-023 Escucha de marca | Brand Listener, Community Mgmt |
| C-024 Escucha cultural | Culture Listener, Opportunity Agent |
| C-025 Inteligencia de industria | Industry Listener |
| C-026 Monitoreo competitivo | Competitive Listener, Strategist |
| C-027 Detección de oportunidades | Opportunity Agent, 4 Listeners |
| C-028 Captura de leads | Sales/CRM, Media Scout, Analytics |
| C-029 Lead scoring | Sales/CRM, Analytics |
| C-030 Pipeline de ventas | Sales/CRM, Email Marketing |
| C-031 Propuestas comerciales | Sales/CRM, Brand Guardian, Financial Agent |
| C-032 Atribución de origen | Analytics, Sales/CRM, Ads |
| C-033 Dashboard ejecutivo | Analytics, Financial Agent, All distribution motors |
| C-034 Atribución multicanal | Analytics, Ads, SEO, Email, Community Mgmt |
| C-035 CAC y LTV | Analytics, Financial Agent, Sales/CRM |
| C-036 Reportes automatizados | Analytics, Email Marketing, All distribution motors |
| C-037 Reportes lenguaje natural | Analytics, All motors |
| C-038 Asignación de presupuesto | Financial Agent, Strategist, Analytics |
| C-039 Control de gasto | Financial Agent, Analytics, Ads |
| C-040 Validación de proveedores | Marketplace, Financial Agent |
| C-041 Marketing como inversión | Financial Agent, Analytics, Sales/CRM |
| C-042 Producción multicanal | Strategist, Channel Manager, Design/Video/Writers, Brand Guardian |
| C-043 Reutilización de activos | Asset Registry, Channel Manager, Design/Video |
| C-044 Equipo virtual escalable | All motors, Orchestration Framework |
| C-045 Autonomía configurable | Orchestration Framework, All motors |
| C-046 Protección de datos | Security Team (6 agents) |
| C-047 Gates de calidad | Orchestration Framework, Review Portal, Showrunner, Critic |
| C-048 Diagnóstico de posicionamiento | Brand Builder, Strategist, Brand Listener, Competitive Listener |
| C-049 Reposicionamiento estratégico | Brand Builder, Strategist, Brand Listener, Brand Guardian |

### 5.3 Matriz de Madurez Global

| ID | Capacidad | Desarrollo | Madurez Cliente |
|----|-----------|-----------|----------------|
| C-001 | Diagnóstico de marketing | 📋 Diseñado | 🔴 En desarrollo |
| C-002 | Plan de marketing | 📋 Diseñado | 🔴 En desarrollo |
| C-003 | Definición de audiencias | 📋 Diseñado | 🔴 En desarrollo |
| C-004 | Análisis competitivo | 📋 Diseñado | 🔴 En desarrollo |
| C-005 | Generación de briefs | 📋 Diseñado | 🔴 En desarrollo |
| C-006 | Construcción de marca | 📋 Diseñado | 🔴 En desarrollo |
| C-007 | Guardián de marca | 📋 Diseñado | 🔴 En desarrollo |
| C-008 | Manual de marca vivo | 💭 Concepto | ⚪ Roadmap |
| C-009 | Producción de video | 🟡 Parcial | 🟡 Beta |
| C-010 | Diseño gráfico | 📋 Diseñado | 🔴 En desarrollo |
| C-011 | Copywriting | 🟡 Parcial | 🟠 Alpha |
| C-012 | Desarrollo web | 📋 Diseñado | 🔴 En desarrollo |
| C-013 | Producción de audio | 🟡 Parcial | 🟠 Alpha |
| C-014 | Producción impresa | 📋 Diseñado | 🔴 En desarrollo |
| C-015 | Producción de eventos | 📋 Diseñado | 🔴 En desarrollo |
| C-016 | Gestión de pauta digital | 📋 Diseñado | 🔴 En desarrollo |
| C-017 | Community management | 📋 Diseñado | 🔴 En desarrollo |
| C-018 | Email marketing | 🟡 Parcial | 🟠 Alpha |
| C-019 | SEO y contenido orgánico | 📋 Diseñado | 🔴 En desarrollo |
| C-020 | Canales tradicionales | 📋 Diseñado | 🔴 En desarrollo |
| C-021 | Contenido reactivo | 📋 Diseñado | 🔴 En desarrollo |
| C-022 | Canal unificado | 📋 Diseñado | 🔴 En desarrollo |
| C-023 | Escucha de marca | 📋 Diseñado | 🔴 En desarrollo |
| C-024 | Escucha cultural | 📋 Diseñado | 🔴 En desarrollo |
| C-025 | Inteligencia de industria | 📋 Diseñado | 🔴 En desarrollo |
| C-026 | Monitoreo competitivo | 📋 Diseñado | 🔴 En desarrollo |
| C-027 | Detección de oportunidades | 📋 Diseñado | 🔴 En desarrollo |
| C-028 | Captura de leads | 📋 Diseñado | 🔴 En desarrollo |
| C-029 | Lead scoring | 📋 Diseñado | 🔴 En desarrollo |
| C-030 | Pipeline de ventas | 📋 Diseñado | 🔴 En desarrollo |
| C-031 | Propuestas comerciales | 📋 Diseñado | 🔴 En desarrollo |
| C-032 | Atribución de origen | 📋 Diseñado | 🔴 En desarrollo |
| C-033 | Dashboard ejecutivo | 🟡 Parcial | 🟠 Alpha |
| C-034 | Atribución multicanal | 📋 Diseñado | 🔴 En desarrollo |
| C-035 | CAC y LTV | 📋 Diseñado | 🔴 En desarrollo |
| C-036 | Reportes automatizados | 📋 Diseñado | 🔴 En desarrollo |
| C-037 | Reportes lenguaje natural | 📋 Diseñado | 🔴 En desarrollo |
| C-038 | Asignación de presupuesto | 📋 Diseñado | 🔴 En desarrollo |
| C-039 | Control de gasto | 🟡 Parcial | 🟠 Alpha |
| C-040 | Validación de proveedores | 📋 Diseñado | 🔴 En desarrollo |
| C-041 | Marketing como inversión | 📋 Diseñado | 🔴 En desarrollo |
| C-042 | Producción multicanal | 📋 Diseñado | 🔴 En desarrollo |
| C-043 | Reutilización de activos | 💭 Concepto | ⚪ Roadmap |
| C-044 | Equipo virtual escalable | 🟡 Parcial | 🟡 Beta |
| C-045 | Autonomía configurable | 🟡 Parcial | 🟡 Beta |
| C-046 | Protección de datos | 🟡 Parcial | 🟠 Alpha |
| C-047 | Gates de calidad | 🟡 Parcial | 🟡 Beta |
| C-048 | Diagnóstico de posicionamiento | 📋 Diseñado | 🔴 En desarrollo |
| C-049 | Reposicionamiento estratégico | 💭 Concepto | ⚪ Roadmap |

**Resumen de madurez:**

| Nivel | Cantidad | % |
|-------|----------|---|
| 🟢 Producción | 0 | 0% |
| 🟡 Beta | 4 | 8% |
| 🟠 Alpha | 5 | 10% |
| 🔴 En desarrollo | 37 | 76% |
| ⚪ Roadmap | 3 | 6% |

### 5.4 Tiers de Servicio

#### Tier PyME (1-20 empleados, sin departamento de marketing)

**Foco: "No tengo estrategia" + "No tengo marca" + "No tengo equipo"**

| Capacidad | Prioridad |
|-----------|-----------|
| C-001 Diagnóstico de marketing | Crítica |
| C-002 Plan de marketing | Crítica |
| C-003 Definición de audiencias | Crítica |
| C-006 Construcción de marca | Crítica |
| C-007 Guardián de marca | Crítica |
| C-048 Diagnóstico de posicionamiento | Crítica |
| C-009 Producción de video | Alta |
| C-010 Diseño gráfico | Alta |
| C-011 Copywriting | Alta |
| C-012 Desarrollo web | Alta |
| C-017 Community management | Alta |
| C-033 Dashboard ejecutivo | Alta |
| C-045 Autonomía configurable | Alta |
| C-047 Gates de calidad | Alta |

#### Tier Mediana (20-200 empleados, gerente de marketing con equipo limitado)

**Todo lo de PyME +**

| Capacidad | Prioridad |
|-----------|-----------|
| C-004 Análisis competitivo | Crítica |
| C-005 Generación de briefs | Crítica |
| C-016 Gestión de pauta digital | Crítica |
| C-018 Email marketing | Crítica |
| C-019 SEO y contenido orgánico | Crítica |
| C-028 Captura de leads | Crítica |
| C-029 Lead scoring | Alta |
| C-030 Pipeline de ventas | Alta |
| C-034 Atribución multicanal | Alta |
| C-035 CAC y LTV | Alta |
| C-036 Reportes automatizados | Alta |
| C-038 Asignación de presupuesto | Alta |
| C-039 Control de gasto | Alta |
| C-023 Escucha de marca | Alta |
| C-026 Monitoreo competitivo | Alta |

#### Tier Agencia (agencia de marketing que automatiza operación)

**Todo lo de Mediana +**

| Capacidad | Prioridad |
|-----------|-----------|
| C-013 Producción de audio | Alta |
| C-014 Producción impresa | Alta |
| C-015 Producción de eventos | Alta |
| C-020 Canales tradicionales | Alta |
| C-021 Contenido reactivo | Alta |
| C-022 Canal unificado | Crítica |
| C-024 Escucha cultural | Alta |
| C-025 Inteligencia de industria | Alta |
| C-027 Detección de oportunidades | Alta |
| C-031 Propuestas comerciales | Crítica |
| C-032 Atribución de origen | Alta |
| C-037 Reportes lenguaje natural | Alta |
| C-040 Validación de proveedores | Alta |
| C-041 Marketing como inversión | Crítica |
| C-042 Producción multicanal | Crítica |
| C-043 Reutilización de activos | Alta |
| C-044 Equipo virtual escalable | Crítica |
| C-049 Reposicionamiento estratégico | Alta |

---

## 6. Cómo Mantener Este Documento

### Agregar un nuevo dolor

1. Asignar ID con prefijo del tema (ej: D-VTA-08)
2. Escribir descripción desde la perspectiva del gerente
3. Mapear a capacidades existentes que lo resuelven
4. Si ninguna capacidad lo resuelve: crear nueva capacidad o marcar como gap

### Agregar una nueva capacidad

1. Asignar ID secuencial (ej: C-050)
2. Escribir ficha completa (proceso dual)
3. Mapear dolores que resuelve
4. Mapear motores que la sirven
5. Actualizar las 4 vistas de referencia cruzada
6. Asignar a tiers de servicio

### Actualizar madurez

Cuando una capacidad avanza de fase, actualizar:
1. Estado en la ficha de la capacidad
2. Nivel de madurez en la matriz global (sección 5.3)

### Principios de mantenimiento

- **Los dolores se descubren, no se inventan.** Vienen de conversaciones con clientes reales.
- **Las capacidades se diseñan, las herramientas se construyen.** La capacidad define el "qué", los motores definen el "cómo".
- **La madurez es honesta.** Si algo no funciona para un cliente real, no es producción.
