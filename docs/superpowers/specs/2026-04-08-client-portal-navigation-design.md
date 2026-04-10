# criteria.agency — Client Portal Navigation Design

> Date: April 8, 2026
> Status: Approved design
> Scope: Mapa completo de navegacion del Client Portal — estructura, flujos, componentes
> Supersedes: PORTAL_SPECS.md §3 (Client Portal) — rewrite completo

---

## 1. Filosofia de Navegacion

**"Las cosas aparecen donde se necesitan."**

La navegacion del Client Portal sigue tres principios:

1. **Minima superficie, maximo acceso.** No hay sidebar. No hay menu con 12 items. La interfaz tiene dos vistas principales (Grid de Campanas + Funnel Matrix) y un header limpio. Todo lo demas se accede contextualmente o desde dropdowns.

2. **Progressive disclosure.** Los motores de creacion, distribucion y operacion no se muestran en la navegacion — aparecen dentro del flujo de una campana cuando el contexto lo requiere. El cliente no piensa "voy al motor de video." Piensa "mi campana necesita un video."

3. **Dos interfaces, un sistema.** Todo lo que se puede hacer con clicks en la interfaz visual se puede hacer hablando con el Copilot. Son caminos alternativos al mismo sistema.

---

## 2. Estructura General

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Logo    [Busqueda]    [Tools]  [Brujula]  [Campana]  [Avatar]  │
│                          Header                                   │
├──────────────────────────────────────────────────────────────────┤
│  [Campanas]  [Funnel]                   [Salud de Marca: 72]     │
│                          View Toggle + Score                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│    Grid de Campanas (default)  │  Funnel Matrix (toggle)         │
│                                                                   │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                     Copilot (chat bubble)                         │
└──────────────────────────────────────────────────────────────────┘
```

- **No hay sidebar.** Las dos vistas principales ocupan toda la pantalla.
- **Dos vistas toggle:** Grid de Campanas (crear, definir, iterar) y Funnel Matrix (ejecutar, monitorear, optimizar).
- **Todo se accede desde el header** via dropdowns.
- **El Copilot** es un chat bubble flotante con identidad propia.
- **Theme:** Light mode default, dark mode toggle en Settings.

### Header (6 elementos)

| Posicion | Elemento | Tipo | Funcion |
|----------|----------|------|---------|
| Izquierda | **Logo** | Link | Vuelve al Home (Grid de Campanas) |
| Centro-izquierda | **Busqueda** | Input / Cmd+K | Busqueda global en toda la plataforma |
| Centro-derecha | **Tools** | Dropdown | Acceso a herramientas: Studio, CRM, Research, Marketplace, Drive, Reportes |
| Centro-derecha | **Brujula** | Dropdown + badge | Inteligencia de mercado: insights de Listeners, oportunidades, alertas estrategicas |
| Derecha | **Campana** | Dropdown + badge | Notificaciones operativas: aprobaciones, leads, alertas de presupuesto, flags |
| Derecha | **Avatar** | Dropdown | Mi Negocio, Mi Cuenta, Settings, Cerrar sesion |

### Dropdowns (no paneles laterales)

Todos los accesos del header abren dropdowns, no side panels. Los dropdowns son ligeros — abres, eliges, cierras. No roban atencion de la matriz.

- **Tools dropdown:** 6 items con icono y descripcion de una linea. Click en un item abre vista de pantalla completa.
- **Brujula dropdown:** Feed de insights recientes. Link "Ver mas" lleva a Research (Tool). Click en insight lleva a celda relevante de la Funnel Matrix.
- **Campana dropdown:** Lista de notificaciones operativas por prioridad. Click en notificacion lleva a la accion requerida.
- **Avatar dropdown:** 3 secciones (Mi Negocio, Mi Cuenta, Settings) + Cerrar sesion.

---

## 3. Dos Vistas Principales

### 3.1 Grid de Campanas (vista default / Home)

El cliente abre la plataforma y ve sus **campanas**. Grid filtrable y ordenable.

Cada card de campana muestra:
- Nombre y estado (En definicion, Activa, Completada, Pausada)
- Versiones (cantidad y nombres)
- Campaign Score (ver §4.1)
- Presupuesto (gastado / total)
- Timeline
- Indicador visual de rendimiento

**Acciones:**
- **+ Nueva Campana** → inicia flujo de creacion (ver §6)
- **Click en campana** → entra al detalle de campana (definicion, versiones, activaciones)
- **Filtros:** por estado, por fecha (Q1, Q2...), por marca (si multi-marca), por score

### 3.2 Funnel Matrix (vista toggle)

Vista de ejecucion y monitoreo. Se accede via toggle en el Home o desde dentro de una campana.

**Filas:** Canales (agrupados por Paid, Owned, Earned)
**Columnas:** Etapas del funnel (Awareness, Consideration, Conversion, Retention)

Cada celda es una interseccion canal x etapa donde vive actividad de marketing. Ventas/CRM vive naturalmente en las columnas Conversion y Retention — no es un modulo separado, es parte del continuo del funnel.

### Estados de celda

| Estado | Visual | Significado |
|--------|--------|-------------|
| Vacia | Gris / outline | No hay actividad. Puede mostrar recomendacion del Strategist |
| Activa verde | Verde | Campanas activas, rendimiento on-target |
| Activa amarilla | Amarillo | Campanas activas, rendimiento below-target |
| Activa roja | Rojo | Problema que requiere atencion |
| Recomendada | Outline punteado | El Strategist recomienda activar esta celda (no hay campana, pero deberia haber) |

### Dos capas de la matriz

1. **Realidad** — lo que hay: campanas activas, metricas reales, estado actual.
2. **Recomendacion** — lo que deberia haber: celdas recomendadas por el Strategist basado en el plan, la audiencia, el presupuesto y el benchmarking competitivo.

La diferencia entre ambas capas es el **gap de ejecucion**, que alimenta el tercer eje de la salud de marca ("¿Estoy haciendo lo suficiente?").

### Que muestra la matriz

La matriz muestra **activaciones**, no campanas. Una celda puede tener activaciones de multiples campanas simultaneamente. Una campana se manifiesta como activaciones distribuidas por toda la matriz.

**Filtros de la matriz:**
- **Todas** — vista por defecto, todas las activaciones activas
- **Por campana** — filtra para mostrar solo las activaciones de una campana especifica (la matriz se ilumina solo en las celdas de esa campana)

### Interaccion

- **Click en celda activa** → detalle de activaciones en esa interseccion (de todas las campanas), metricas, recomendaciones del Strategist.
- **Click en celda vacia** → el sistema sugiere crear una activacion, ya sea dentro de una campana existente o como parte de una nueva campana.
- **Click en celda recomendada** → explicacion del Strategist de por que deberia activar esa celda + propuesta.
- **Click en header de columna** (ej: "Conversion") → vista consolidada de toda esa etapa del funnel a traves de todos los canales. Para Conversion, esto es el pipeline de ventas completo.

### Cliente nuevo vs cliente activo

**Post-onboarding (nuevo):**
- Grid de Campanas vacio con prominente "+ Nueva Campana" y recomendaciones del Strategist
- Matriz mayormente vacia: si dio URLs, algunas celdas muestran presencia detectada; si empezo de cero, celdas recomendadas con "empieza aqui"
- Score de salud de marca bajo y visible
- Recomendaciones del Strategist prominentes en ambas vistas

**Cliente activo:**
- Grid de Campanas con cards de campanas activas, scores, y estados
- Matriz poblada con activaciones reales y colores por rendimiento
- Score de salud mas alto
- Recomendaciones del Strategist orientadas a optimizar y escalar
- Insights de Listeners surfaceados como oportunidades en celdas relevantes

---

## 4. Score de Salud de Marca

### Concepto

Un score global visible en todo momento (header o sobre la matriz). Como un credit score: ves el numero, y si quieres entender por que, abres el detalle.

### Tres ejes

| Eje | Pregunta | Que mide | Fuentes |
|-----|----------|----------|---------|
| **Fundamentos** | ¿Estoy listo? | Completitud y profundidad de la base: Brand DNA, audiencias, propuesta de valor, modelo de negocio, objetivos | Mi Negocio. Diferencia entre self-service, copilot, y workshop profesional se refleja en profundidad |
| **Ejecucion** | ¿Lo estoy haciendo bien? | Rendimiento de campanas, consistencia de marca (Brand Guardian), tasa de aprobacion en gates, ROI | Analytics, Brand Guardian, gate reviews |
| **Oportunidad** | ¿Estoy haciendo lo suficiente? | Inversion vs mercado disponible, actividad vs competencia, canales cubiertos vs canales relevantes | Listeners (benchmarking competitivo + sizing de mercado), Financial Agent, Strategist |

### Desglose y acciones

Al abrir el score, el cliente ve:
- Score global (ej: 62/100)
- Score por eje con barra visual
- Para cada eje con score bajo: explicacion y acciones concretas recomendadas
- Cada accion es un link directo a la capability o configuracion relevante

### Quien lo calcula

El **Strategist motor** alimenta continuamente el score. Sintetiza datos de los Listeners (mercado, competencia), Analytics (rendimiento), Brand Guardian (consistencia), y el estado de Mi Negocio (completitud de base).

### Motor de expansion de revenue

El score es tambien el principal driver de upsell:
- "No estoy listo" → vende workshops, copilot avanzado, servicios de configuracion
- "Lo estoy haciendo mal" → vende mas motores, Brand Guardian, revision de expertos
- "No estoy haciendo lo suficiente" → vende mas canales, mas presupuesto, mas campanas

### Relacion con Campaign Score

El eje de Ejecucion del Brand Health Score se alimenta del promedio ponderado de los Campaign Scores activos. Ver §4.1.

---

## 4.1 Campaign Score

### Concepto

Cada campana individual tiene su propio score de calidad. El campaign score mide que tan bien esta definida y ejecutada una campana especifica, y evoluciona con su ciclo de vida.

### Fases del score

| Fase de campana | Que mide el score | Fuentes |
|-----------------|-------------------|---------|
| **En definicion** | Calidad del input estrategico y creativo. ¿Objetivos claros y medibles? ¿Audiencias bien definidas? ¿Versiones diferenciadas? ¿Direccion creativa coherente con Brand DNA? ¿Presupuesto realista? ¿Calendario con sentido? | Showrunner (transversal), Strategist, Brand Guardian |
| **En produccion** | Se suman metricas de calidad de piezas. Tasa de aprobacion en gates internos de los motores, consistencia de marca, calidad de assets | Gate reviews de motores, Brand Guardian |
| **En ejecucion** | Se suman metricas reales de rendimiento. Rendimiento vs objetivos definidos, ROAS, engagement, conversion | Analytics, Ads, Community Management, Email Marketing |

### Acciones recomendadas

Cada score bajo tiene acciones concretas:
- "Tu campaign score subiria si defines mejor la audiencia de la version 2"
- "El rendimiento de la activacion en Meta esta por debajo del objetivo — el Strategist recomienda ajustar targeting"
- "La version romantica tiene mejor rendimiento que la tierna — considera reasignar presupuesto"

### Alimenta al Brand Health Score

El promedio ponderado de campaign scores activos alimenta el eje de "Ejecucion" del Brand Health Score global

Cada accion recomendada se percibe como ayuda, no como venta.

---

## 5. Tools (dropdown)

Herramientas que se usan independientemente del flujo de la Funnel Matrix. Acceso directo via dropdown en header.

| Tool | Proposito | Relacion con la matriz |
|------|-----------|----------------------|
| **Studio** | Creacion libre de contenido (video, diseno, copy, web, audio) sin contexto de campana | Los assets creados pueden asignarse a campanas despues |
| **CRM** | Pipeline de leads y ventas consolidado. Vista de trabajo del vendedor | Mismo dato que Conversion/Retention en la matriz, pero como vista de trabajo |
| **Research** | Exploracion profunda de mercados, estudios, inteligencia de Listeners, documentos del cliente | Profundidad de lo que la Brujula muestra en superficie |
| **Marketplace** | Proveedores externos (AI y humanos), cotizaciones, contratacion | Proveedores usados por campanas y herramientas |
| **Drive** | Archivos, assets de marca, documentos subidos | Repositorio central de archivos |
| **Reportes** | Reportes on-demand y programados. Dashboards personalizados | Consolida datos de toda la plataforma |

### Relacion Brujula ↔ Research

La Brujula (dropdown en header) es la **superficie** — feed rapido de insights recientes de los Listeners. Research (Tool) es la **profundidad** — exploracion completa, estudios historicos, documentos del cliente. Mismo sistema de inteligencia, dos niveles de acceso. La Brujula tiene link "Ver mas en Research" para profundizar.

### Research como espacio hibrido

Research combina tres fuentes:
1. **Lo que los Listeners descubren** — monitoreo continuo automatico
2. **Lo que el cliente sube** — PDFs, URLs, estudios de mercado propios, reportes de consultoras
3. **Lo que el onboarding genero** — analisis inicial de presencia digital y competencia

---

## 6. Jerarquia de Campana y Flujo de Creacion

### 6.1 Jerarquia: Campana → Version → Activacion → Piezas

La unidad central de trabajo es la **Campana**. Cada campana se descompone en cuatro niveles:

| Nivel | Que es | Ejemplo (Dia de las Madres) | Quien lo crea |
|-------|--------|----------------------------|---------------|
| **Campana** | Agrupacion tematica. Concepto unificador con objetivos, audiencia, presupuesto y calendario | "Dia de las Madres 2026" | Cliente + Strategist |
| **Version** | Adaptacion tematica/creativa de la campana. Angulo narrativo, tono, estilo visual | "Romantica", "Sexy", "Tierna" | Creative Director (transversal) propone + cliente co-crea |
| **Activacion** | Ejecucion de una version en una celda especifica de la Funnel Matrix (canal × etapa del funnel) | Version "Romantica" → Instagram Awareness, Email Consideration, Meta Ads Conversion | Strategist distribuye segun plan |
| **Pieza** | Contenido concreto producido por un motor para una activacion | Reel de 30s (motor Video), Carrusel 5 slides (motor Diseno), Email secuencia 3 dias (motor Email) | Motores de creacion |

**Relaciones:**
Una campana tiene multiples versiones. Cada version se ejecuta en multiples activaciones. Cada activacion produce multiples piezas. La misma campana puede tener versiones distintas viviendo simultaneamente en diferentes celdas de la Funnel Matrix.

### 6.2 Flujo de Creacion (4 pasos)

#### Paso 1 — Definicion de Campana (Cliente + Strategist)

Se inicia desde el Grid de Campanas ("+ Nueva Campana"). El Strategist ayuda a definir:

| Elemento | Como se define |
|----------|----------------|
| **Concepto** | Tema unificador de la campana. Puede venir del cliente, de una oportunidad detectada por Listeners, o de una recomendacion del Strategist |
| **Objetivos** | Metrica principal, target, plazo, baseline. El Strategist valida: "este objetivo es alcanzable con tu presupuesto" o "para lograr esto necesitarias invertir X" |
| **Audiencia** | Segmentos de Mi Negocio. El Strategist sugiere los mas relevantes para el concepto |
| **Presupuesto** | Rango sugerido por Financial Agent basado en plan de marketing y benchmarking competitivo |
| **Calendario** | Duracion, fechas clave, frecuencia. Alineado con estacionalidad y momentos de mercado |

El Showrunner (transversal) valida la campana a nivel macro: ¿tiene sentido estrategico? ¿Es coherente con la marca? ¿Los objetivos son realistas? Esta validacion alimenta el Campaign Score (ver §4.1) desde la fase de definicion.

#### Paso 2 — Versiones Creativas (Creative Director + Cliente)

El **Creative Director** (agente transversal) propone versiones creativas basandose en el concepto de la campana, el Brand DNA, y las audiencias:

- Cada version es un angulo narrativo diferente (no un A/B test — son adaptaciones tematicas con identidad propia)
- El Creative Director presenta: nombre de version, tono, direccion visual, mensaje central, diferenciador vs otras versiones
- El cliente puede aprobar, modificar, o proponer sus propias versiones e ideas
- El proceso es iterativo: Creative Director propone → cliente reacciona → Creative Director ajusta → convergencia
- No hay limite de versiones, pero el Creative Director recomienda un numero manejable segun presupuesto y capacidad

#### Paso 3 — Activaciones (Strategist)

Con las versiones definidas, el **Strategist** las distribuye en la Funnel Matrix:

- Cada version se asigna a una o mas celdas (canal × etapa del funnel)
- El Strategist decide: ¿que version funciona mejor en que canal y que etapa?
- Pre-configura cada activacion: formato de contenido sugerido segun canal, metricas de exito especificas para esa celda, calendario de ejecucion
- El cliente ve la distribucion en la Funnel Matrix (filtrando por campana, la matriz se ilumina solo en las celdas asignadas)
- El cliente puede ajustar la distribucion antes de ejecutar

#### Paso 4 — Piezas (Motores de Creacion)

Para cada activacion, los **motores relevantes** producen las piezas:

- Los motores se surfacean contextualmente: Instagram → Video + Diseno. Email → Writers Room + Diseno. Web → Motor Web + SEO
- Cada motor recibe como contexto: concepto de campana, direccion creativa de la version, especificaciones del canal, Brand DNA
- Las piezas pasan por los quality gates internos de cada motor (3+3 rule, Brand Guardian)
- El cliente aprueba segun su configuracion de autonomia (IA decide + supervisa, o IA recomienda + aprueba)

### 6.3 Ajuste Continuo

Una vez activa, la campana entra en ciclo de optimizacion:

- El **Strategist** monitorea rendimiento por activacion y propone ajustes: reasignar presupuesto entre versiones o canales, pausar activaciones de bajo rendimiento, escalar las que funcionan
- El **Creative Director** propone nuevos assets si los actuales pierden efectividad
- El **Showrunner** valida que los ajustes mantengan coherencia a nivel campana
- El **Campaign Score** se actualiza continuamente reflejando la calidad de ejecucion
- Todo respeta la configuracion de autonomia del cliente

### 6.4 Agentes Transversales de Campana

Tres agentes transversales operan a nivel de campana, por encima de los motores individuales:

| Agente | Rol | Alcance |
|--------|-----|---------|
| **Creative Director** | Propone versiones creativas, define direccion visual y narrativa de cada version, itera con el cliente | Opera en paso 2 del flujo. Transversal a todos los motores — la direccion creativa de una version aplica a video, diseno, copy, etc. |
| **Showrunner** | Valida coherencia y calidad a nivel campana completa. ¿Las versiones son consistentes con la marca? ¿La distribucion tiene sentido? ¿La campana cumple sus objetivos? | Opera como quality gate de campana (no de piezas individuales — eso lo hacen los gates de cada motor). Alimenta el Campaign Score |
| **Strategist** | Define objetivos, distribuye activaciones, monitorea rendimiento, propone ajustes | Opera en pasos 1, 3, y ajuste continuo. Motor continuo (ver §11) |

**Nota:** Creative Director y Showrunner fueron originalmente parte del Video motor pero se promueven a transversales porque su funcion aplica a campanas multi-motor (una campana puede involucrar video, diseno, email, ads, web simultaneamente).

---

## 7. Avatar Dropdown

### Mi Negocio

La base estrategica del cliente. Se configura al inicio (onboarding + vias de profundizacion), se consulta y actualiza ocasionalmente. Todo lo que la plataforma necesita saber sobre el cliente para operar con criterio.

| Seccion | Contenido |
|---------|-----------|
| **Brand DNA** | Identidad de marca: mision, valores, posicionamiento, identidad visual, tono de voz, arquetipos |
| **Modelo de negocio** | BMC, propuesta de valor canvas, estructura |
| **Productos y servicios** | Catalogo editable de productos/servicios |
| **Audiencias** | Segmentos de audiencia, buyer personas, datos demograficos y comportamentales |
| **Propuesta de valor** | Que ofreces, por que eres diferente, por que te eligen |
| **Revenue streams** | Fuentes de ingreso, montos, tendencias |
| **Mercados** | Mercados donde compite (definicion, no exploracion — la exploracion esta en Research) |
| **Objetivos de negocio** | Objetivos de alto nivel (facturacion, crecimiento, market share). El Strategist los traduce a objetivos de marketing |

### Tres vias de configuracion

La base puede llenarse por tres vias, cada una con diferente profundidad:

| Via | Experiencia | Profundidad | Tier sugerido |
|-----|-------------|-------------|---------------|
| **Manual** | El cliente llena formularios, el sistema valida completitud | Basica | Free / PyME |
| **Copilot** | IA guia conversacionalmente. Brand Builder y Strategist conducen workshops conversacionales | Media-alta | Pro |
| **Workshop con expertos** | Humano acompana el proceso junto con la IA. Consultoria profesional | Profesional | Enterprise / upsell para cualquier tier |

La profundidad de la base se refleja en el score de salud de marca (eje Fundamentos). Un Brand DNA de workshop profesional pesa mas que uno self-service — incentivo natural para el upsell.

### Mi Cuenta

Gestion administrativa del cliente.

| Seccion | Contenido |
|---------|-----------|
| **Plan** | Tier actual, upgrade, historial |
| **Billing** | Metodo de pago, facturas, consumo |
| **Equipo** | Miembros, roles, invitaciones |

### Settings

Configuracion tecnica y preferencias.

| Seccion | Contenido |
|---------|-----------|
| **Integraciones** | APIs externas conectadas (Meta, Google, Mailchimp, etc.) |
| **Autonomia** | Nivel de autonomia por motor (IA decide vs IA recomienda) |
| **Copilot** | Proactividad: silencioso / moderado / activo |
| **Notificaciones** | Canales de entrega (in-app, email, push) y tipos activados por canal |
| **Preferencias** | Idioma, zona horaria, dark mode |

---

## 8. AI Copilot

### Concepto

Interfaz conversacional alternativa a la interfaz visual. Control por lenguaje natural de toda la plataforma. No es soporte — es un co-piloto que opera la misma nave.

### Donde vive

Chat bubble flotante con identidad propia (logo de criteria.agency o icono del "director de marketing virtual", no icono generico de chat).

### Que puede hacer

Todo lo que la interfaz visual permite:
- Crear y gestionar campanas ("crea una campana de awareness en Instagram")
- Consultar datos ("¿como van mis leads esta semana?")
- Configurar Mi Negocio ("quiero cambiar mi propuesta de valor")
- Navegar tools ("abreme el CRM")
- Consultar inteligencia ("¿que esta haciendo mi competencia?")
- Ejecutar acciones rapidas ("genera un video para mi producto nuevo")

### Interaccion visual

Cuando el Copilot actua, la interfaz visual refleja la accion. El cliente escribe "crea una campana de awareness en Instagram" → la matriz se ilumina en la celda correspondiente, se abre el formulario pre-poblado, el Copilot explica que preparo.

### Proactividad

Configurable por el cliente en Settings:
- **Silencioso** — solo habla cuando le hablan
- **Moderado** — alerta sobre cambios importantes (score baja, oportunidad detectada, lead de alto valor)
- **Activo** — sugiere, recomienda, inicia conversaciones proactivamente

---

## 9. Onboarding (primera vez)

### Flujo modal

El onboarding es un flow modal que secuestra la pantalla hasta completar un minimo.

### Pasos

**Paso 1 — Registro**
Nombre, email, password. Estandar.

**Paso 2 — Tu negocio**
Nombre de empresa, a que se dedica, pais/ciudad. Tres campos. 30 segundos.

**Paso 3 — Bifurcacion: "¿Ya tienes una marca o empiezas de cero?"**

**Camino A — Tengo marca:**
- Pide URLs: website, redes sociales (lo que tenga)
- Con al menos una URL, la plataforma lanza analisis automatico:
  - Website: propuesta de valor, productos, tono, colores, tipografia, logo, SEO basico
  - Redes sociales: frecuencia, tipo de contenido, engagement, tamano de audiencia, tono, consistencia visual
  - Competencia: si se identifican competidores, comparacion inmediata
- El analisis genera un draft automatico de Mi Negocio

**Camino B — Empiezo de cero:**
- Copilot conversacional del Brand Builder
- Tres preguntas minimas: ¿que hace tu negocio? ¿a quien le vende? ¿que lo hace diferente?
- Con las respuestas se genera un Brand DNA preliminar

### Minimo para salir del modal

- Registro completo (paso 1)
- Info basica del negocio (paso 2)
- Al menos una URL proporcionada (camino A) o tres preguntas respondidas (camino B)

A partir de ahi el cliente puede salir. Todo lo adicional (validar draft de Brand DNA, refinar audiencias, completar modelo de negocio) son acciones que suben la salud de marca — el primer ciclo de uso, no pasos del onboarding.

### Post-onboarding

El cliente llega al Home (Grid de Campanas):
- **Camino A:** grid vacio pero con draft de Mi Negocio generado. Score de salud de marca calculado. El Strategist recomienda crear la primera campana basandose en la presencia detectada.
- **Camino B:** grid vacio con Brand DNA preliminar. Score de salud bajo. El Strategist recomienda primero completar Mi Negocio y luego crear la primera campana.
- En ambos casos: Strategist presenta las 3 acciones prioritarias con links directos. La Funnel Matrix (toggle) muestra presencia detectada (camino A) o recomendaciones "empieza aqui" (camino B).

### Advertencias contextuales (no bloqueos)

Cuando el cliente quiere hacer algo que requiere input incompleto, la plataforma le avisa en contexto:
- "Para optimizar tu targeting necesitamos definir tus audiencias. ¿Lo hacemos ahora?"
- "Podemos producir el video, pero sin identidad de marca no podemos garantizar consistencia visual."

No bloquea. Explica la consecuencia y deja decidir. El output sin base completa es generico; con base es profesional. La diferencia se refleja en el score.

---

## 10. Notificaciones

### Dos canales en header

| Canal | Icono | Tipo de contenido | Proposito |
|-------|-------|-------------------|-----------|
| **Brujula** | Brujula + badge | Inteligencia estrategica: insights de mercado, movimientos de competencia, tendencias, oportunidades | Enterate — informa decisiones |
| **Campana** | Campana + badge | Operativo: aprobaciones pendientes, leads nuevos, alertas de presupuesto, Brand Guardian flags, cambios en score, estado de campanas | Actua — requiere atencion |

### Configuracion por el cliente

El cliente decide en Settings:
- **Que le llega:** cada tipo de notificacion activable/desactivable
- **Por donde:** in-app (campana/brujula), email, push mobile (futuro)
- **Nivel de urgencia:** el sistema clasifica (critico, importante, informativo) pero el cliente elige como se manifiestan

---

## 11. Rol del Strategist (motor continuo)

### Tres funciones encadenadas

El Strategist no es un motor puntual. Es continuo y alimenta toda la experiencia:

| Funcion | Que hace | Output |
|---------|----------|--------|
| **Evalua** | Mantiene la salud de marca, detecta gaps, compara contra mercado y competencia | Score de salud de marca, diagnosticos |
| **Disena** | Traduce diagnostico en campanas concretas con canal, formato, mensaje, presupuesto, calendario | Pre-configuracion de campanas, recomendaciones de celdas |
| **Ajusta** | Lee resultados de campanas activas y modifica: reasigna presupuesto, propone nuevos assets, escala o pausa | Optimizacion continua, alertas de ajuste |

### Ciclo perpetuo

Evalua → Disena → Ejecuta (los motores) → Mide (Analytics + Listeners) → Ajusta → Repite

### Independencia de Listeners

El Strategist y los Listeners son motores independientes comunicados por Event Bus. Los Listeners son observadores neutrales — reportan datos sin agenda. El Strategist interpreta y decide. Separacion para evitar sesgo circular.

### Relacion con objetivos

Los objetivos de negocio (en Mi Negocio) son el input del Strategist. El Strategist los traduce a objetivos de marketing, los distribuye en campanas, y mide contra ellos. "Para facturar $500K necesitas X leads, lo que requiere Y alcance, lo que implica Z inversion en estos canales."

### Relacion con Creative Director y Showrunner

El Strategist define el "que" y el "donde" de una campana (objetivos, audiencias, distribucion en la Funnel Matrix). El Creative Director define el "como" creativo (versiones, tono, direccion visual). El Showrunner valida la coherencia del conjunto. Los tres operan a nivel de campana como transversales, pero con responsabilidades distintas y complementarias. Ver §6.4.

---

## 12. Mapa de Navegacion Consolidado

### Vista rapida

```
HEADER:  Logo | Busqueda | Tools | Brujula | Campana | Avatar
HOME:    [Campanas] [Funnel] toggle + Score de Salud de Marca
COPILOT: Chat bubble flotante
```

### Accesos desde header

```
Tools (dropdown)
  ├── Studio         → pantalla completa: creacion libre
  ├── CRM            → pantalla completa: pipeline, leads, propuestas
  ├── Research        → pantalla completa: mercados, estudios, inteligencia
  ├── Marketplace     → pantalla completa: proveedores, cotizaciones
  ├── Drive           → pantalla completa: archivos, assets
  └── Reportes        → pantalla completa: dashboards, reportes

Brujula (dropdown)
  ├── Feed de insights recientes (Listeners)
  ├── Cada insight → link a celda relevante de la matriz
  └── "Ver mas" → Research (Tool)

Campana (dropdown)
  └── Notificaciones operativas por prioridad → link a accion

Avatar (dropdown)
  ├── Mi Negocio      → pantalla completa: Brand DNA, modelo, audiencias, productos, propuesta de valor, revenue, mercados, objetivos
  ├── Mi Cuenta       → pantalla completa: plan, billing, equipo
  ├── Settings        → pantalla completa: integraciones, autonomia, copilot, notificaciones, preferencias
  └── Cerrar sesion
```

### Flujo principal — Grid de Campanas (Home)

```
Home (Grid de Campanas)
  ├── + Nueva Campana
  │     └── Paso 1: Definicion (Cliente + Strategist) → objetivos, audiencia, presupuesto, calendario
  │     └── Paso 2: Versiones (Creative Director + Cliente) → angulos creativos iterados
  │     └── Paso 3: Activaciones (Strategist) → distribucion en Funnel Matrix
  │     └── Paso 4: Piezas (Motores) → produccion contextual por canal
  │
  └── Click en campana existente
        ├── Vista de definicion: concepto, versiones, Campaign Score
        ├── Vista de versiones: cards por version con su direccion creativa
        ├── Vista de activaciones: mapa de donde esta la campana en la Funnel Matrix
        └── Vista de piezas: assets producidos por motor, estado de aprobacion
```

### Flujo principal — Funnel Matrix (toggle)

```
Funnel Matrix
  ├── Vista global: todas las activaciones activas
  ├── Filtro por campana: ilumina solo celdas de esa campana
  └── Click celda
        ├── Celda vacia → sugiere crear activacion (nueva campana o campana existente)
        ├── Celda activa → detalle de activaciones, metricas, ajustes
        ├── Celda recomendada → explicacion del Strategist + propuesta
        └── Click header de columna → vista consolidada de esa etapa del funnel
```

### Flujo de onboarding

```
Registro → Info basica → ¿Tienes marca?
  ├── Si → URLs → analisis automatico → draft Mi Negocio → Home (grid vacio + recomendaciones)
  └── No → Copilot Brand Builder → Brand DNA preliminar → Home (grid vacio + recomendaciones)
```

### Jerarquia de campana

```
Campana (concepto tematico)
  └── Version (angulo creativo: romantica, sexy, tierna)
        └── Activacion (celda de Funnel Matrix: canal × etapa)
              └── Pieza (contenido producido por motor: reel, carrusel, email)
```

---

## 13. Decisiones clave (referencia)

| Decision | Eleccion | Razon |
|----------|----------|-------|
| Dos vistas principales | Grid de Campanas (Home) + Funnel Matrix (toggle) | Crear/definir necesita su espacio (grid). Ejecutar/monitorear necesita el suyo (funnel). No son lo mismo |
| Grid de Campanas como Home | El cliente abre la plataforma y ve sus campanas | El acto creativo de definir campanas es el punto de partida natural. La Funnel Matrix es donde se ejecutan |
| Sin sidebar | Dropdowns en header | Maxima simplicidad. Las dos vistas ocupan toda la pantalla |
| Jerarquia Campana → Version → Activacion → Pieza | 4 niveles de descomposicion | Versiones son angulos creativos (no A/B tests). Activaciones son celdas del funnel. Piezas son outputs de motores |
| Creative Director transversal | Propone versiones creativas a nivel campana, no dentro de un motor | Una campana involucra multiples motores — la direccion creativa debe ser consistente entre video, diseno, copy, etc. |
| Showrunner transversal (nivel campana) | Valida coherencia de campana completa, no de piezas individuales | Las piezas las validan los gates de cada motor. El Showrunner valida el conjunto |
| Campaign Score | Score por campana que evoluciona con su ciclo de vida (definicion → produccion → ejecucion) | Mide calidad de input y output. Alimenta el Brand Health Score (eje Ejecucion) |
| Motores contextuales | Aparecen dentro de campanas (paso 4: piezas) | El cliente piensa en lo que necesita, no en que motor lo hace |
| Sales dentro de la matriz | Conversion y Retention del funnel | Ventas es parte del ciclo de marketing, no un modulo separado |
| CRM como Tool | Acceso directo para vendedores | Vista consolidada de pipeline fuera del contexto de la matriz |
| Score de salud de marca | 3 ejes: fundamentos, ejecucion, oportunidad | Unico numero que diagnostica y vende capabilities |
| Mi Negocio en avatar | Configuracion, no destino de trabajo diario | Se configura al inicio, se consulta ocasionalmente |
| Brujula vs Campana | Estrategico vs operativo | Dos canales con propositos distintos |
| Copilot como chat bubble | Interfaz alternativa a la visual | Control por lenguaje natural de toda la plataforma |
| Onboarding modal con minimo | Registro + info basica + URL o 3 preguntas | Basta para arrancar. Todo lo demas sube la salud de marca |
| Advertencias, no bloqueos | Explicar consecuencia, no impedir | Respetar al cliente impaciente. El score le ensenara por que la base importa |

---

## 14. Supersedes

Este documento reemplaza la seccion 3 (Client Portal) de `PORTAL_SPECS.md`. Las secciones 1 (Architecture), 2 (Public Portal), y 4 (Admin Portal) de PORTAL_SPECS.md siguen vigentes.

Decisiones anteriores superadas:
- DEC-031 (6 Spaces basados en outcomes) → ya superada por DEC-036
- DEC-036 (sidebar con 4 grupos: Fundamentos/Inteligencia/Ejecucion/Tools) → superada por este diseno (sin sidebar, dual view Grid+Funnel, dropdowns en header)
- DEC-046 (Funnel Matrix como unica Home) → refinada por DEC-059 (Grid de Campanas como Home, Funnel Matrix como toggle)
