/**
 * Legal documents route — Step 7.6 (Security Framework §14, P0-10)
 *
 * 5 required documents pre-launch:
 *   GET /api/legal/tos           — Terms of Service
 *   GET /api/legal/privacy       — Privacy Policy (GDPR baseline)
 *   GET /api/legal/dpa           — Data Processing Agreement
 *   GET /api/legal/aup           — Acceptable Use Policy (DEC-167)
 *   GET /api/legal/cookies       — Cookie Policy
 *
 * Documents are served as JSON (with metadata) and as plain text.
 * These are the MVP versions — a lawyer should review before launch.
 *
 * NOTE: This route is PUBLIC (no auth required) — legal docs must be
 * accessible to prospective clients and regulators.
 */

import { Hono } from 'hono';

const EFFECTIVE_DATE = '2026-04-10';
const COMPANY_NAME = 'criteria.agency';
const COMPANY_EMAIL = 'legal@criteria.agency';
const JURISDICTION = 'República de Panamá';

interface LegalDocument {
  id: string;
  title: string;
  effectiveDate: string;
  version: string;
  content: string;
}

// ── Document content ──────────────────────────────────────────────────────────

const DOCUMENTS: Record<string, LegalDocument> = {
  tos: {
    id: 'tos',
    title: 'Términos de Servicio',
    effectiveDate: EFFECTIVE_DATE,
    version: '1.0.0',
    content: `TÉRMINOS DE SERVICIO — ${COMPANY_NAME}
Fecha de vigencia: ${EFFECTIVE_DATE}
Versión: 1.0.0

1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder y usar ${COMPANY_NAME} ("el Servicio"), aceptas estos Términos de Servicio. Si no aceptas estos términos, no debes usar el Servicio.

2. DESCRIPCIÓN DEL SERVICIO
${COMPANY_NAME} es una plataforma de marketing con inteligencia artificial que asiste a pequeñas y medianas empresas en LATAM en la construcción de marca, estrategia y producción de contenido.

3. CUENTAS Y ACCESO
- Debes proporcionar información precisa al registrarte.
- Eres responsable de mantener la confidencialidad de tu contraseña.
- Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta.

4. MODELO DE TOKENS Y PAGOS
- El Servicio opera bajo un modelo de suscripción mensual con niveles: Starter ($99/mes), Pro ($249/mes), Agency ($599/mes).
- Las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento.
- Los reembolsos se procesan según nuestra Política de Reembolsos publicada en el Servicio.

5. CONTENIDO GENERADO POR IA
- El contenido producido por el Servicio usa inteligencia artificial y requiere revisión humana antes de publicarse.
- ${COMPANY_NAME} no garantiza la exactitud, idoneidad o cumplimiento legal del contenido generado.
- El usuario es responsable final de todo contenido publicado o distribuido.

6. USO ACEPTABLE
- No está permitido usar el Servicio para usos prohibidos según nuestra Política de Uso Aceptable (AUP).
- Nos reservamos el derecho de suspender cuentas que violen la AUP.

7. PROPIEDAD INTELECTUAL
- El contenido generado para tu marca usando el Servicio es tuyo.
- El Servicio, incluyendo su tecnología y modelos, es propiedad exclusiva de ${COMPANY_NAME}.

8. PRIVACIDAD
- El manejo de tus datos se describe en nuestra Política de Privacidad.
- Cumplimos con el RGPD (UE) y leyes de privacidad aplicables en LATAM.

9. LIMITACIÓN DE RESPONSABILIDAD
En la medida máxima permitida por la ley, ${COMPANY_NAME} no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del Servicio.

10. TERMINACIÓN
Podemos suspender o cancelar tu acceso si violas estos Términos. Puedes cancelar en cualquier momento desde la configuración de tu cuenta.

11. CAMBIOS A ESTOS TÉRMINOS
Notificaremos cambios materiales con al menos 30 días de anticipación por email.

12. LEY APLICABLE
Estos Términos se rigen por las leyes de ${JURISDICTION}.

13. CONTACTO
Para consultas legales: ${COMPANY_EMAIL}`,
  },

  privacy: {
    id: 'privacy',
    title: 'Política de Privacidad',
    effectiveDate: EFFECTIVE_DATE,
    version: '1.0.0',
    content: `POLÍTICA DE PRIVACIDAD — ${COMPANY_NAME}
Fecha de vigencia: ${EFFECTIVE_DATE}
Versión: 1.0.0

1. RESPONSABLE DEL TRATAMIENTO
${COMPANY_NAME} es el responsable del tratamiento de tus datos personales.
Contacto DPO: ${COMPANY_EMAIL}

2. DATOS QUE RECOPILAMOS
a) Datos de cuenta: nombre, email, nombre de empresa, país.
b) Datos de uso: interacciones con el Servicio, consultas a MARA, outputs generados.
c) Datos de marca: información sobre tu negocio que provees voluntariamente (Brand DNA).
d) Datos técnicos: IP, tipo de dispositivo, logs de acceso.

3. FINALIDADES DEL TRATAMIENTO
- Proveer y mejorar el Servicio.
- Personalizar la experiencia de MARA y los agentes de IA.
- Cumplimiento legal y seguridad.
- Comunicaciones sobre el Servicio (con tu consentimiento).

4. BASE LEGAL (RGPD)
- Ejecución del contrato (Artículo 6.1.b): para proveer el Servicio.
- Interés legítimo (Artículo 6.1.f): seguridad, prevención de fraude.
- Consentimiento (Artículo 6.1.a): comunicaciones de marketing.

5. PROVEEDORES DE IA Y DATOS
Tu información de marca (Brand DNA) se procesa ÚNICAMENTE por Anthropic (proveedor Tier A). No la enviamos a OpenAI, Google u otros proveedores. Ver nuestra arquitectura de seguridad AI en docs.criteria.agency.

6. RETENCIÓN DE DATOS
- Datos de cuenta: mientras la cuenta esté activa + 90 días tras cancelación.
- Outputs de agentes: 2 años o según configures en tu cuenta.
- Logs de acceso: 90 días.

7. TUS DERECHOS (RGPD)
Tienes derecho a: acceso, rectificación, supresión, portabilidad, oposición y limitación del tratamiento. Ejerce tus derechos en: ${COMPANY_EMAIL}

8. TRANSFERENCIAS INTERNACIONALES
Los datos se procesan en servidores en EE.UU. y Europa. Las transferencias se protegen mediante Cláusulas Contractuales Tipo aprobadas por la UE.

9. COOKIES
Ver nuestra Política de Cookies separada.

10. CAMBIOS
Notificaremos cambios materiales 30 días antes de su vigencia.

11. CONTACTO
${COMPANY_EMAIL}`,
  },

  dpa: {
    id: 'dpa',
    title: 'Acuerdo de Procesamiento de Datos (DPA)',
    effectiveDate: EFFECTIVE_DATE,
    version: '1.0.0',
    content: `ACUERDO DE PROCESAMIENTO DE DATOS (DPA) — ${COMPANY_NAME}
Fecha de vigencia: ${EFFECTIVE_DATE}
Versión: 1.0.0

Este DPA forma parte de los Términos de Servicio entre ${COMPANY_NAME} ("Procesador") y el Cliente ("Responsable").

1. OBJETO Y DURACIÓN
${COMPANY_NAME} procesa datos personales en nombre del Cliente únicamente para proveer los servicios descritos en los Términos de Servicio. El procesamiento dura mientras el contrato esté vigente.

2. NATURALEZA Y FINALIDAD
Procesamiento de datos de empleados, clientes y prospectos del Cliente para fines de marketing, análisis de marca y generación de contenido mediante IA.

3. TIPOS DE DATOS PERSONALES
- Datos de contacto B2B (nombres, emails empresariales)
- Datos de comportamiento de usuarios finales del Cliente (anónimizados)
- Contenido de marca del Cliente (no considerado dato personal en la mayoría de jurisdicciones)

4. OBLIGACIONES DEL PROCESADOR (${COMPANY_NAME})
- Procesar datos solo según instrucciones documentadas del Responsable.
- Garantizar que el personal autorizado está obligado por confidencialidad.
- Implementar medidas técnicas y organizativas apropiadas (ver §5).
- Asistir al Responsable en responder a solicitudes de derechos de sujetos.
- Notificar brechas de seguridad dentro de 72 horas.
- Eliminar o devolver datos al finalizar el contrato.

5. MEDIDAS DE SEGURIDAD
- Cifrado en tránsito (TLS 1.3) y en reposo (AES-256).
- Aislamiento de datos por tenant (organización).
- Autenticación multi-factor en sistemas críticos.
- Auditorías de seguridad periódicas.

6. SUBPROCESADORES
Lista de subprocesadores aprobados:
- Anthropic (EE.UU.) — modelos de IA Tier A
- Neon/PostgreSQL — almacenamiento de datos
- Vercel — infraestructura frontend
- Inngest — orquestación de workflows
- Langfuse — observabilidad de IA
- Cloudflare R2 — almacenamiento de archivos

El Cliente consiente el uso de estos subprocesadores al aceptar este DPA.

7. TRANSFERENCIAS INTERNACIONALES
Las transferencias fuera del EEE se realizan bajo Cláusulas Contractuales Tipo (SCC) de la Comisión Europea.

8. AUDITORÍA
El Cliente puede solicitar auditorías con 30 días de aviso y bajo acuerdo de confidencialidad.

9. CONTACTO DPO
${COMPANY_EMAIL}`,
  },

  aup: {
    id: 'aup',
    title: 'Política de Uso Aceptable (AUP)',
    effectiveDate: EFFECTIVE_DATE,
    version: '1.0.0',
    content: `POLÍTICA DE USO ACEPTABLE (AUP) — ${COMPANY_NAME}
Fecha de vigencia: ${EFFECTIVE_DATE}
Versión: 1.0.0

Esta política define los usos permitidos y prohibidos de ${COMPANY_NAME} (DEC-167).

1. USOS PERMITIDOS
- Marketing y comunicación legítima de productos y servicios reales.
- Generación de contenido para marcas de las que eres titular o representante autorizado.
- Análisis de métricas de tu propio negocio.
- Estrategia de marketing para mercados donde operas legalmente.

2. USOS PROHIBIDOS
El Servicio NO puede usarse para:

a) Contenido dañino:
   - Spam, phishing, o comunicaciones engañosas.
   - Contenido que incite violencia, odio o discriminación.
   - Material sexualmente explícito.
   - Desinformación o noticias falsas deliberadas.

b) Actividades ilegales:
   - Marketing de productos o servicios ilegales en la jurisdicción objetivo.
   - Violación de derechos de autor, marcas registradas u otros derechos de propiedad intelectual.
   - Evasión fiscal o cualquier actividad fraudulenta.

c) Abuso del sistema:
   - Intentos de vulnerar la seguridad del Servicio.
   - Ingeniería inversa o extracción de modelos de IA.
   - Uso de bots o scripts automatizados no autorizados.
   - Cualquier uso que interfiera con otros usuarios del Servicio.

d) Datos sensibles:
   - No subas datos personales sensibles (salud, finanzas personales, menores) sin el DPA correspondiente.

3. CONTENIDO GENERADO POR IA
El contenido generado por el Servicio está sujeto a esta AUP. Eres responsable de revisar el contenido antes de publicarlo.

4. CONSECUENCIAS DEL INCUMPLIMIENTO
El incumplimiento puede resultar en:
- Advertencia
- Suspensión temporal
- Terminación permanente de la cuenta
- Reporte a autoridades competentes cuando aplique

5. REPORTE DE ABUSOS
Reporta usos abusivos a: ${COMPANY_EMAIL}

6. ACTUALIZACIONES
Esta política puede actualizarse. Te notificaremos por email con 14 días de anticipación.`,
  },

  cookies: {
    id: 'cookies',
    title: 'Política de Cookies',
    effectiveDate: EFFECTIVE_DATE,
    version: '1.0.0',
    content: `POLÍTICA DE COOKIES — ${COMPANY_NAME}
Fecha de vigencia: ${EFFECTIVE_DATE}
Versión: 1.0.0

1. ¿QUÉ SON LAS COOKIES?
Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio o usas el Servicio.

2. COOKIES QUE USAMOS

a) Cookies esenciales (no requieren consentimiento):
   - session: Mantiene tu sesión autenticada (HTTP-only, Secure). Duración: sesión.
   - csrf_token: Protección contra ataques CSRF. Duración: sesión.

b) Cookies funcionales (requieren consentimiento):
   - ui_preferences: Preferencias de interfaz (modo oscuro, idioma). Duración: 1 año.

c) Cookies de análisis (requieren consentimiento):
   - En el MVP actual NO usamos cookies de análisis de terceros.
   - Métricas internas se procesan sin cookies de seguimiento.

3. COOKIES DE TERCEROS
   - Better Auth: gestión de sesiones.
   - Vercel: infraestructura (pueden establecer cookies técnicas).
   - No usamos cookies de Google Analytics, Facebook Pixel u otros trackers de terceros.

4. GESTIÓN DE COOKIES
Puedes controlar las cookies desde la configuración de tu navegador. Bloquear cookies esenciales impedirá el funcionamiento del Servicio.

5. CONSENTIMIENTO
Al hacer clic en "Aceptar" en nuestro banner de cookies, consientes el uso de cookies funcionales. Las cookies esenciales no requieren consentimiento.

6. CONTACTO
${COMPANY_EMAIL}`,
  },
};

// ── Route factory ─────────────────────────────────────────────────────────────

export function createLegalRoute() {
  const app = new Hono();

  // GET /api/legal — list all documents
  app.get('/', (c) => {
    const docs = Object.values(DOCUMENTS).map(({ id, title, effectiveDate, version }) => ({
      id,
      title,
      effectiveDate,
      version,
      url: `/api/legal/${id}`,
    }));
    return c.json({ documents: docs });
  });

  // GET /api/legal/:id — get specific document
  app.get('/:id', (c) => {
    const id = c.req.param('id');
    const doc = DOCUMENTS[id];
    if (!doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    const format = c.req.query('format') ?? 'json';
    if (format === 'text') {
      return c.text(doc.content);
    }

    return c.json(doc);
  });

  return app;
}
