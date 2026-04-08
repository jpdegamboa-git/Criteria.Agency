# criteria.agency -- Auditoría Integral de Plataforma

> **Fecha:** 7 de abril, 2026
> **Metodología:** 4 agentes auditores especializados evaluando en paralelo
> **Alcance:** Toda la plataforma -- código, specs, agentes, UX, seguridad

---

## Resumen Ejecutivo

| Perspectiva | CRITICAL | HIGH/IMPORTANT | MEDIUM/SUGGESTIONS | STRENGTHS |
|------------|----------|----------------|-------------------|-----------|
| Cliente | 4 | 5 | 4 | 6 |
| UX/UI | 4 | 8 | 8 | 8 |
| Ingeniería | 4 | 7 | 6 | 6 |
| Seguridad | 5 | 8 | 8 | 6 |
| **Total** | **17** | **28** | **26** | **26** |

**Veredicto:** La arquitectura y diseño son excepcionales -- uno de los diseños de plataforma de marketing más completos que existen. Pero hay una brecha enorme entre diseño e implementación. De 50 capacidades, **cero están listas para un cliente que paga**. Hay vulnerabilidades de seguridad críticas que deben resolverse antes de cualquier lanzamiento.

---

## 1. AUDITORÍA DE CLIENTE (Dolores del Gerente de Marketing)

### CRITICAL

**CRIT-C01: El producto es vaporware hoy -- nada es lanzable**
- De 50 capacidades: 0 en Producción, 4 en Beta (solo video), 4 en Alpha (parciales)
- 42 capacidades están en "En desarrollo" o "Roadmap"
- Un prospect no puede registrarse y recibir valor de ningún flujo completo
- **Recomendación:** Definir MVP duro de 5-7 capacidades funcionales en 30 días

**CRIT-C02: Los Quick Wins son sistemáticamente irrealistas**
- "Diagnóstico en 48h" -- el pipeline de diagnóstico no existe
- "Plan de marketing en 1 semana" -- el Strategist no está implementado
- "Video en 72h" -- no puede generar video real (falta billing de Veo/Kling)
- **Recomendación:** Solo prometer Quick Wins para capacidades en Beta o superior

**CRIT-C03: No existe flujo de onboarding**
- No hay wizard de bienvenida, ni cuestionario inicial
- La API requiere especificar `pipelineType` técnico
- Un gerente de marketing no sabe que necesita un "strategist pipeline"
- **Recomendación:** Construir onboarding guiado que traduzca intent del cliente a pipelines

**CRIT-C04: Cadenas de dependencia invisibles crean callejones sin salida**
- Brand Guardian (C-007) requiere Brand DNA de Brand Builder (C-006)
- Multi-channel (C-042) requiere ALL production motors funcionando
- Ninguna dependencia se comunica al cliente
- **Recomendación:** Construir prerequisite checker y "bundles de capacidades"

### IMPORTANT

**IMP-C01: Complejidad abruma al cliente** -- 125 agentes, 24 motores, 50 capacidades. PyME necesita "ayuda con Instagram", no entender pipeline-types.

**IMP-C02: Inteligencia basada en stubs = datos fabricados** -- Los 4 Listeners generan datos sintéticos via LLM. Un cliente tomando decisiones con inteligencia competitiva fabricada es peor que la intuición.

**IMP-C03: Feedback loops son aspiracionales** -- Las 50 capacidades prometen aprendizaje pero no hay infraestructura de feedback implementada.

**IMP-C04: Tiers (PyME/Mediana/Agencia) no tienen mapeo de capacidades** -- No se define qué capacidades incluye cada tier.

**IMP-C05: Value proposition no se comunica en 30 segundos** -- "125 agentes en 24 motores" suena aterrador, no atractivo. Mejor: "Tu departamento de marketing completo, on demand."

### MVP RECOMENDADO

| Prioridad | Capacidad | Estado Actual | Gap |
|-----------|-----------|---------------|-----|
| 1 | C-009: Video | Beta (solo texto) | Activar billing media gen |
| 2 | C-006: Brand Building | Diseñado | Implementar agentes |
| 3 | C-001: Diagnóstico | Diseñado | Implementar paso 1 Strategist |
| 4 | C-011: Copywriting | Alpha (solo AV) | Extender Writers Room |
| 5 | C-033: Dashboard | Alpha (finanzas) | Agregar project tracking |
| 6 | C-045: Autonomía | Beta (solo video) | Extender a otros pipelines |
| 7 | C-047: Quality Gates | Beta (solo video) | Ya funciona para video |

### DOLORES FALTANTES

| Dolor faltante | Descripción |
|---------------|-------------|
| Coordinación de equipo | "No puedo alinear a mi equipo en prioridades" |
| Reportes a clientes (agencia) | "Paso 20% de mi tiempo haciendo reportes" |
| Multi-marca | "Manejo 3 marcas y necesito consistencia" |
| Planificación estacional | "Necesito calendario de temporadas pre-planeado" |
| Comunicación de crisis | "Algo salió mal y necesito responder YA" |
| Gestión de stakeholders | "Mi CEO quiere X, ventas quiere Y" |

---

## 2. AUDITORÍA UX/UI

### CRITICAL

**CRIT-U01: No existe dashboard de cliente post-signup**
- Después de pagar, el cliente no tiene UI para ver proyectos, contenido, ni progreso
- Solo existen: pricing page, review page (via token), finance admin
- **Recomendación:** Construir `/dashboard` con: proyectos activos, entregas recientes, reviews pendientes, copilot

**CRIT-U02: Las features core no tienen frontend**
- Copilot, generación de contenido, y gestión de proyectos son solo endpoints JSON
- Un gerente de marketing necesitaría curl o Postman para usar el producto
- **Recomendación:** Construir UIs para: chat copilot, wizard de contenido, lista de proyectos, timeline de proyecto

**CRIT-U03: No hay navegación global**
- `layout.ts` es un shell vacío sin menú
- Cada vista define su propia navegación ad-hoc
- Finance dashboard navega a `/admin/finances/*`, transactions a `/finance/*` (inconsistente)
- **Recomendación:** Crear componente de navegación compartido con visibilidad por rol

**CRIT-U04: Navegación de finanzas rota entre vistas**
- Dashboard links to `/admin/finances/transactions`
- Transactions nav links to `/finance/transactions` (sin `/admin`)
- Puede causar 404s al navegar entre vistas
- **Recomendación:** Estandarizar todas las URLs de finanzas bajo `/admin/finances/*`

### IMPORTANT

| # | Hallazgo | Impacto |
|---|----------|---------|
| U-I1 | Errores mostrados con `alert()` nativo | Jarring, no-branded, bloquea UI |
| U-I2 | Jerga técnica expuesta ("quality gates", "G1", "T7-L") | Confunde al cliente |
| U-I3 | Sin estados de carga en dashboards | KPIs muestran $0.00 mientras cargan |
| U-I4 | Sin feedback después de acciones exitosas | `window.location.reload()` sin confirmación |
| U-I5 | Confirmaciones inconsistentes | Approve usa `confirm()`, reconcile no tiene confirmación |
| U-I6 | Checkout sin validación inline | Solo HTML5 `required`, sin mensajes inline |
| U-I7 | Errores de API en formato developer | Zod errors en inglés para UI en español |
| U-I8 | Sin indicador de operaciones AI largas | Copilot/content gen toman 10-30s sin feedback |

### STRENGTHS

- Diseño visual limpio y profesional (dark theme + amber accent)
- Pricing page bien ejecutada (toggle billing, FAQ, early adopter)
- Review portal pensado para el flujo correcto
- SSR con Hono = pages cargan instantáneamente
- UI completamente en español (mercado LATAM)
- Arquitectura SSE para canvas events (patrón reutilizable)

---

## 3. AUDITORÍA DE INGENIERÍA

### CRITICAL

**CRIT-E01: `normalizeName` y `levenshtein` duplicados**
- Mismo código en `reconciler.ts` y `entity-matcher.ts`
- Versión del reconciler más robusta (strips sufijos legales)
- **Fix:** Extraer a `src/shared/fuzzy-match.ts`

**CRIT-E02: Doble inicialización del cliente Anthropic**
- `services/claude.ts` tiene su propio `askClaude()` wrapper
- `providers/anthropic.ts` tiene `AnthropicProvider` completo
- 4 servicios usan `askClaude` bypasseando rate limiting y cost tracking
- **Fix:** Deprecar `services/claude.ts`, rutear todo por provider registry

**CRIT-E03: AGENT_OUTPUTS mega-object hardcodeado en types.ts**
- ~200 líneas de mock data embebidas en definiciones de tipos
- Duplica info que ya está en `pipeline-registry.ts`
- **Fix:** Mover a `agents/mock-outputs.ts`

**CRIT-E04: Email infrastructure duplicada**
- Dos clientes Resend independientes (email.ts + subscription-manager.ts)
- Ambos definen `FROM_EMAIL` por separado
- **Fix:** Consolidar en un solo `services/email.ts`

### IMPORTANT

| # | Hallazgo | Archivos | Impacto |
|---|----------|----------|---------|
| E-I1 | Enum explosion en schema | `projectStatusEnum` tiene 67 valores | Cada motor nuevo requiere migration |
| E-I2 | Validator schema drift | `createProjectSchema` acepta "social", DB no | Error críptico en DB |
| E-I3 | Agentes T2-002 y WR-002 duplicados | Mismo "AV Copywriter" en 2 motores | Mantenimiento doble de skills |
| E-I4 | clientAliases cargado 3x por transacción | reconciler + categorizer + entity-matcher | 1,500 queries para 500-row CSV |
| E-I5 | Sin índice en gateReviews(projectId, gate) | Full table scan en cada avance de pipeline | Performance degrada con volumen |
| E-I6 | Specs proponen tablas que ya existen | Phase 0 ya creó tablas que specs listan como "New" | Implementadores crearán duplicados |
| E-I7 | Budget spec duplica vendor tables | `client_vendors` overlap con `vendors` existente | Dos modelos de datos paralelos |

### SUGGESTIONS

- **S-E1:** Dispatch de agentes podría ser paralelo (`Promise.all` en vez de `for...of`)
- **S-E2:** PipelineRegistry podría ser data-driven (JSON/YAML en vez de 450 líneas de código)
- **S-E3:** Mock agent fallback en producción debería ser opt-in (no silencioso)
- **S-E4:** Test coverage es shallow -- solo unit tests de funciones puras, cero integration tests
- **S-E5:** DC-001 y CP-001 usan `askClaude()` sin pasar por agent registry
- **S-E6:** Views SSR con template literals -- aceptable por ahora pero frágil si crece

### STRENGTHS

- **PipelineRegistry** -- mejor pieza de arquitectura del sistema
- **Provider system** -- limpio, extensible, con rate limiting
- **Context Builder** -- context assembly de calidad producción
- **Financial module** -- el módulo más maduro, reconciliación 4-niveles
- **Agent skill files** -- prompts profesionales, jerarquía consistente
- **Autonomy middleware** -- bien diseñado y bien testeado

---

## 4. AUDITORÍA DE SEGURIDAD

### CRITICAL (5 vulnerabilidades explotables)

**CRIT-S01: Dev mode bypasea TODA la autenticación**
- `src/api/auth.ts:42-46` -- Si `NODE_ENV !== "production"`, retorna user mock
- Cualquier request sin auth recibe acceso completo en desarrollo
- **Riesgo:** Si se despliega sin `NODE_ENV=production`, todo está abierto
- **Fix:** Eliminar bypass o requerir flag explícito `SKIP_AUTH=true`

**CRIT-S02: requireAdmin bypaseable cuando user no existe**
- `src/api/auth.ts:56-63` -- Si no hay user en context, pasa silenciosamente
- Permite acceso admin sin autenticación
- **Fix:** Requerir user && user.role === "admin", denegar si user es undefined

**CRIT-S03: Lectura/escritura arbitraria de archivos de agentes**
- `src/api/canvas-routes.ts:124-146` -- PUT `/api/canvas/agents/:id/skill` escribe archivos al filesystem
- El `id` se usa directamente en la ruta del archivo sin sanitización
- Path traversal posible: `../../etc/passwd`
- **Fix:** Validar que id solo contiene caracteres alfanuméricos y guiones

**CRIT-S04: Engine routes sin scoping por cliente**
- `src/api/engine-routes.ts` -- Todas las consultas son globales
- Cualquier usuario autenticado ve alertas, auditoría, y configs de TODOS los clientes
- **Fix:** Agregar `WHERE clientId = ?` a todas las queries

**CRIT-S05: Finance routes devuelven datos de todos los clientes**
- `src/api/finance-routes.ts` -- Summary, transactions, etc. sin filtro de tenant
- **Fix:** Scoping obligatorio por tenant en todas las queries financieras

### HIGH (8 vulnerabilidades)

| # | Vulnerabilidad | OWASP | Archivo |
|---|---------------|-------|---------|
| S-H1 | Sin CORS en la mayoría de rutas | Security Misconfiguration | server.ts |
| S-H2 | Sin protección CSRF | Broken Auth | server.ts |
| S-H3 | Sin security headers (helmet) | Security Misconfiguration | server.ts |
| S-H4 | Inputs sin validar en checkout | Injection | checkout-routes.ts |
| S-H5 | Inputs sin validar en engine routes | Injection | engine-routes.ts |
| S-H6 | Inputs sin validar en canvas routes | Injection | canvas-routes.ts |
| S-H7 | Database credentials hardcodeados | Sensitive Data Exposure | config.ts |
| S-H8 | Sin rate limiting HTTP-level | DoS | server.ts |

### MEDIUM

| # | Hallazgo |
|---|----------|
| S-M1 | Stripe webhook sin verificación de firma |
| S-M2 | Review tokens predecibles (timestamp-based) |
| S-M3 | Sin Content Security Policy |
| S-M4 | Error responses exponen stack traces |
| S-M5 | No logging de eventos de seguridad |
| S-M6 | AI prompts sin protección contra injection |
| S-M7 | Sin política de rotación de API keys |
| S-M8 | Autonomy middleware no integrada en routes |

### STRENGTHS

- Drizzle ORM previene SQL injection por diseño
- `sanitize.ts` tiene buenas funciones de escape HTML/XSS
- El diseño del Security Engine spec es sólido (5-level autonomy, PII detection, audit trails)
- Autonomy middleware bien diseñada con approval matrix
- Provider rate limiter funcional para Gemini free tier
- Schema tiene tenant_id en la mayoría de tablas (falta enforcement en queries)

---

## 5. PRIORIDADES CROSS-FUNCIONAL

### Top 10 -- Hacer ANTES de cualquier lanzamiento

| # | Acción | Perspectiva | Esfuerzo |
|---|--------|------------|----------|
| 1 | Fijar auth bypass en dev mode | Seguridad | 1h |
| 2 | Fijar requireAdmin bypass | Seguridad | 1h |
| 3 | Agregar client-scoping a TODAS las queries | Seguridad | 4h |
| 4 | Sanitizar path en canvas agent skill write | Seguridad | 1h |
| 5 | Agregar CORS + CSRF + security headers | Seguridad | 2h |
| 6 | Construir dashboard de cliente post-login | UX | 2-3 días |
| 7 | Construir UI de copilot (chat interface) | UX | 2-3 días |
| 8 | Consolidar fuzzy-match y claude wrappers duplicados | Ingeniería | 3h |
| 9 | Activar billing de media gen (Veo/Kling) | Cliente | Config |
| 10 | Definir y comunicar MVP de 5-7 capacidades | Cliente | 1 día |

### Top 5 -- Hacer para Beta

| # | Acción | Perspectiva |
|---|--------|------------|
| 1 | Integrar al menos 1 data source real por Listener | Cliente |
| 2 | Construir onboarding guiado | UX + Cliente |
| 3 | Implementar feedback loops para MVP capabilities | Cliente |
| 4 | Migrar de enum explosion a varchar | Ingeniería |
| 5 | Agregar integration tests para pipeline core | Ingeniería |

---

## 6. LO QUE ESTÁ BIEN

La auditoría encontró **26 fortalezas** significativas:

- **Filosofía "dolor primero"** genuinamente bien ejecutada -- 48 dolores reales, bien mapeados
- **Framework dual** (desarrollo + cliente) -- transparencia interna honesta
- **PipelineRegistry** -- mejor pieza de arquitectura, escala a 24+ motores
- **Provider system** -- limpio, extensible, con rate limiting
- **Quality gates + autonomía configurable** -- diferenciador real vs competencia
- **Agent skill files** -- 135 prompts profesionales con personalidad consistente
- **Financial module** -- el módulo más maduro y completo
- **Context Builder** -- assembly de contexto de calidad producción
- **Diseño visual** -- dark theme profesional, pricing page bien ejecutada
- **SSR con Hono** -- pages cargan rápido, reliable
- **Cobertura del stack completo** -- de estrategia a medición, ningún competidor intenta esta amplitud
- **Security Engine spec** -- inusualmente completo para una plataforma de marketing

**Bottom line:** El diseño merece un producto que esté a su altura. La arquitectura es sólida. Las prioridades deben ser: (1) seguridad básica, (2) frontend de cliente, (3) MVP funcional de 5-7 capacidades, (4) cleanup de ingeniería.
