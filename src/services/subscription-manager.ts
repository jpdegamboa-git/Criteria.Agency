import { Resend } from "resend";
import { eq, and, lt, gt, sql, desc } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { config } from "../shared/config.js";
import { logger } from "../shared/logger.js";

// ── Internal notify helper ──

const FROM_EMAIL = "criteria.agency <noreply@criteria.agency>";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

async function notify(to: string, subject: string, html: string) {
  if (!resend) {
    logger.info("subscription.email.mock", { to, subject });
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("subscription.email.failed", { to, error: String(error) });
  }
}

// ── 1. Check expiring trials (within 5 days) ──

export async function checkExpiringTrials(): Promise<number> {
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const expiring = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        eq(schema.clients.subscriptionStatus, "trialing"),
        gt(schema.clients.trialEndsAt, now),
        lt(schema.clients.trialEndsAt, fiveDaysFromNow)
      )
    );

  for (const client of expiring) {
    const daysLeft = Math.ceil(
      ((client.trialEndsAt?.getTime() ?? 0) - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    await notify(
      client.email,
      `Tu periodo de prueba termina en ${daysLeft} dias`,
      `
      <h2>Tu trial esta por terminar</h2>
      <p>Hola ${client.name},</p>
      <p>Tu periodo de prueba en criteria.agency termina en <strong>${daysLeft} dias</strong>.</p>
      <p>Para seguir creando videos con IA, elige un plan antes de que termine tu trial.</p>
      <p><a href="${config.baseUrl}/pricing" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Ver planes</a></p>
      `
    );
  }

  return expiring.length;
}

// ── 2. Check expired trials ──

export async function checkExpiredTrials(): Promise<number> {
  const now = new Date();

  const expired = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        eq(schema.clients.subscriptionStatus, "trialing"),
        lt(schema.clients.trialEndsAt, now)
      )
    );

  for (const client of expired) {
    await db
      .update(schema.clients)
      .set({ subscriptionStatus: "canceled" })
      .where(eq(schema.clients.id, client.id));

    await notify(
      client.email,
      "Tu periodo de prueba ha terminado",
      `
      <h2>Tu trial ha expirado</h2>
      <p>Hola ${client.name},</p>
      <p>Tu periodo de prueba en criteria.agency ha terminado. Tu cuenta ha sido desactivada.</p>
      <p>Puedes reactivarla en cualquier momento eligiendo un plan.</p>
      <p><a href="${config.baseUrl}/pricing" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Reactivar cuenta</a></p>
      `
    );

    await notify(
      config.founderEmail,
      `Trial expirado: ${client.name} (${client.email})`,
      `
      <h2>Trial expirado</h2>
      <p><strong>Cliente:</strong> ${client.name}</p>
      <p><strong>Email:</strong> ${client.email}</p>
      <p><strong>Empresa:</strong> ${client.company ?? "N/A"}</p>
      <p>El trial expiro y la cuenta fue marcada como cancelada.</p>
      `
    );
  }

  return expired.length;
}

// ── 3. Check overdue payments ──

export async function checkOverduePayments(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const overdue = await db
    .select({
      payment: schema.expectedPayments,
      client: schema.clients,
    })
    .from(schema.expectedPayments)
    .innerJoin(
      schema.clients,
      eq(schema.expectedPayments.clientId, schema.clients.id)
    )
    .where(
      and(
        eq(schema.expectedPayments.status, "pending"),
        lt(schema.expectedPayments.dueDate, sevenDaysAgo)
      )
    );

  for (const { payment, client } of overdue) {
    await db
      .update(schema.expectedPayments)
      .set({ status: "overdue" })
      .where(eq(schema.expectedPayments.id, payment.id));

    await db
      .update(schema.clients)
      .set({ subscriptionStatus: "past_due" })
      .where(eq(schema.clients.id, client.id));

    await notify(
      config.founderEmail,
      `Pago vencido: ${client.name} — $${payment.amount}`,
      `
      <h2>Pago vencido detectado</h2>
      <p><strong>Cliente:</strong> ${client.name} (${client.email})</p>
      <p><strong>Monto:</strong> $${payment.amount} ${payment.currency}</p>
      <p><strong>Fecha limite:</strong> ${payment.dueDate.toISOString().split("T")[0]}</p>
      <p><strong>Descripcion:</strong> ${payment.description}</p>
      <p>El pago fue marcado como vencido y el cliente como past_due.</p>
      `
    );
  }

  return overdue.length;
}

// ── 4. Detect churn risk ──

export async function detectChurnRisk(): Promise<string[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeClients = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "active"));

  const atRisk: string[] = [];

  for (const client of activeClients) {
    const recentProjects = await db
      .select()
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.clientId, client.id),
          gt(schema.projects.createdAt, thirtyDaysAgo)
        )
      );

    if (recentProjects.length === 0) {
      atRisk.push(`${client.name} (${client.email}) — sin proyectos en 30+ dias`);
    }
  }

  if (atRisk.length > 0) {
    await notify(
      config.founderEmail,
      `Alerta churn: ${atRisk.length} clientes en riesgo`,
      `
      <h2>Clientes en riesgo de churn</h2>
      <p>Los siguientes clientes activos no han creado proyectos en los ultimos 30 dias:</p>
      <ul>
        ${atRisk.map((entry) => `<li>${entry}</li>`).join("\n")}
      </ul>
      `
    );
  }

  return atRisk;
}

// ── 5. Create recurring payments ──

export async function createRecurringPayments(): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 1);
  const dueDate = new Date(currentYear, currentMonth, 15);

  const activeClients = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "active"));

  let created = 0;

  for (const client of activeClients) {
    // Check if current month already has an expected payment
    const existingThisMonth = await db
      .select()
      .from(schema.expectedPayments)
      .where(
        and(
          eq(schema.expectedPayments.clientId, client.id),
          gt(schema.expectedPayments.dueDate, monthStart),
          lt(schema.expectedPayments.dueDate, monthEnd)
        )
      );

    if (existingThisMonth.length > 0) continue;

    // Get last reconciled payment to determine amount
    const lastPayment = await db
      .select()
      .from(schema.expectedPayments)
      .where(
        and(
          eq(schema.expectedPayments.clientId, client.id),
          eq(schema.expectedPayments.status, "reconciled")
        )
      )
      .orderBy(desc(schema.expectedPayments.dueDate))
      .limit(1);

    if (lastPayment.length === 0) continue;

    const prev = lastPayment[0];

    await db.insert(schema.expectedPayments).values({
      clientId: client.id,
      amount: prev.amount,
      currency: prev.currency,
      description: `Suscripcion ${client.subscriptionTier ?? "starter"} — ${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
      dueDate,
      status: "pending",
    });

    created++;
  }

  return created;
}

// ── 6. Send early adopter transition notice ──

export async function sendEarlyAdopterTransitionNotice(): Promise<number> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const transitioning = await db
    .select()
    .from(schema.clients)
    .where(
      and(
        gt(schema.clients.earlyAdopterEndsAt, now),
        lt(schema.clients.earlyAdopterEndsAt, sevenDaysFromNow)
      )
    );

  for (const client of transitioning) {
    const daysLeft = Math.ceil(
      ((client.earlyAdopterEndsAt?.getTime() ?? 0) - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    await notify(
      client.email,
      `Tu tarifa early adopter cambia en ${daysLeft} dias`,
      `
      <h2>Cambio de tarifa proximo</h2>
      <p>Hola ${client.name},</p>
      <p>Tu tarifa especial de early adopter en criteria.agency terminara en <strong>${daysLeft} dias</strong>.</p>
      <p>A partir de esa fecha, tu suscripcion pasara a la tarifa estandar de tu plan.</p>
      <p>Gracias por ser parte de los primeros en confiar en nosotros.</p>
      <p><a href="${config.baseUrl}/account" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Ver mi cuenta</a></p>
      `
    );
  }

  return transitioning.length;
}

// ── Dashboard summary ──

// ── 7. Waitlist nurture email sequence ──

const NURTURE_EMAILS = [
  {
    step: 1,
    daysAfterSignup: 3,
    subject: "Asi producimos un video con IA en 48h",
    html: (name: string) => `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <h2 style="color:#1a1a1a;">Hola ${name},</h2>
        <p>Queriamos mostrarte como funciona nuestro pipeline de produccion con IA.</p>
        <p>En <strong>criteria.agency</strong> cada video pasa por <strong>5 puntos de control</strong> (quality gates) antes de llegar a tus manos:</p>
        <ol style="line-height:1.8;">
          <li><strong>G1 — Concepto:</strong> La idea se valida contra tu brief y objetivos</li>
          <li><strong>G2 — Guion:</strong> El script se revisa por coherencia y tono de marca</li>
          <li><strong>G3 — Visual:</strong> Storyboard y look aprobados antes de generar</li>
          <li><strong>G4 — Produccion:</strong> Audio, video y edicion pasan revision tecnica</li>
          <li><strong>G5 — Entrega:</strong> Quality check final antes de enviarte el resultado</li>
        </ol>
        <p>El resultado: video profesional en <strong>48 horas</strong>, no 4 semanas.</p>
        <p style="color:#9d9a9c;font-size:13px;margin-top:32px;">La IA genera. El criterio decide.<br/>— criteria.agency</p>
      </div>
    `,
  },
  {
    step: 2,
    daysAfterSignup: 7,
    subject: "5 puntos de criterio que garantizan calidad",
    html: (name: string) => `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <h2 style="color:#1a1a1a;">${name}, esto es lo que nos diferencia</h2>
        <p>Cualquiera puede generar video con IA. Pero sin <strong>criterio</strong>, el resultado es generico.</p>
        <p>Nuestros 5 quality gates no son solo checks tecnicos — son decisiones creativas:</p>
        <ul style="line-height:1.8;">
          <li>Un agente IA escribe el guion, pero otro lo <strong>evalua</strong> contra estandares de produccion</li>
          <li>Si no pasa, se reintenta hasta 3 veces con ajustes automaticos</li>
          <li>Si sigue sin pasar, un lider creativo interviene y ajusta la direccion</li>
          <li>El resultado final siempre pasa por <strong>tu aprobacion</strong> en el portal de revision</li>
        </ul>
        <p>Es la regla <strong>3+3</strong>: 3 intentos autonomos + 3 con supervision humana. Asi garantizamos calidad sin sacrificar velocidad.</p>
        <p style="color:#9d9a9c;font-size:13px;margin-top:32px;">La IA genera. El criterio decide.<br/>— criteria.agency</p>
      </div>
    `,
  },
  {
    step: 3,
    daysAfterSignup: 14,
    subject: "Los primeros resultados de nuestra beta",
    html: (name: string) => `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <h2 style="color:#1a1a1a;">${name}, la beta esta avanzando</h2>
        <p>Queriamos darte un update rapido sobre lo que estamos viendo en los primeros proyectos:</p>
        <ul style="line-height:1.8;">
          <li>Tiempo promedio de entrega: <strong>48 horas</strong> (vs 3-4 semanas tradicional)</li>
          <li>Tasa de aprobacion en primera revision: <strong>85%</strong></li>
          <li>Costo promedio por video: <strong>60-70% menos</strong> que produccion tradicional</li>
        </ul>
        <p>Los early adopters estan recibiendo <strong>40% de descuento</strong> en su primer ano. Tu lugar en la lista sigue reservado.</p>
        <p>Pronto te enviaremos tu invitacion para empezar.</p>
        <p style="color:#9d9a9c;font-size:13px;margin-top:32px;">La IA genera. El criterio decide.<br/>— criteria.agency</p>
      </div>
    `,
  },
  {
    step: 4,
    daysAfterSignup: 21,
    subject: "Tu invitacion esta casi lista",
    html: (name: string) => `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <h2 style="color:#1a1a1a;">${name}, estamos por abrir la beta</h2>
        <p>En los proximos dias estaremos enviando invitaciones a los primeros de la lista.</p>
        <p>Como parte de la lista de espera, tendras:</p>
        <ul style="line-height:1.8;">
          <li><strong>Acceso anticipado</strong> a la plataforma</li>
          <li><strong>40% de descuento</strong> por 12 meses como early adopter</li>
          <li><strong>30 dias gratis</strong> para probar sin compromiso</li>
          <li><strong>Soporte directo</strong> con el equipo fundador</li>
        </ul>
        <p>Mantente atento a tu inbox — tu invitacion llegara pronto.</p>
        <p style="color:#9d9a9c;font-size:13px;margin-top:32px;">La IA genera. El criterio decide.<br/>— criteria.agency</p>
      </div>
    `,
  },
];

export async function sendWaitlistNurture(): Promise<number> {
  const now = new Date();
  let emailsSent = 0;

  for (const email of NURTURE_EMAILS) {
    // Find entries that should receive this step
    const cutoffDate = new Date(
      now.getTime() - email.daysAfterSignup * 24 * 60 * 60 * 1000
    );

    const entries = await db
      .select()
      .from(schema.waitlistEntries)
      .where(
        and(
          eq(schema.waitlistEntries.nurtureStep, email.step - 1),
          lt(schema.waitlistEntries.createdAt, cutoffDate),
          sql`${schema.waitlistEntries.status} IN ('pending', 'nurturing')`
        )
      );

    for (const entry of entries) {
      await notify(entry.email, email.subject, email.html(entry.name));

      await db
        .update(schema.waitlistEntries)
        .set({
          nurtureStep: email.step,
          status: "nurturing",
          updatedAt: now,
        })
        .where(eq(schema.waitlistEntries.id, entry.id));

      emailsSent++;
      logger.info("nurture.sent", {
        email: entry.email,
        step: email.step,
        subject: email.subject,
      });
    }
  }

  if (emailsSent > 0) {
    logger.info("nurture.complete", { emailsSent });
  }

  return emailsSent;
}

// ── Subscription summary ──

export async function getSubscriptionSummary() {
  const [trialingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "trialing"));

  const [activeResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "active"));

  const [pastDueResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "past_due"));

  const [canceledResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clients)
    .where(eq(schema.clients.subscriptionStatus, "canceled"));

  // At-risk: active clients with no projects in 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [atRiskResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clients)
    .where(
      and(
        eq(schema.clients.subscriptionStatus, "active"),
        sql`${schema.clients.id} NOT IN (
          SELECT DISTINCT ${schema.projects.clientId}
          FROM ${schema.projects}
          WHERE ${schema.projects.createdAt} > ${thirtyDaysAgo.toISOString()}
        )`
      )
    );

  return {
    trialing: trialingResult.count,
    active: activeResult.count,
    pastDue: pastDueResult.count,
    canceled: canceledResult.count,
    atRiskCount: atRiskResult.count,
  };
}
