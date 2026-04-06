import { Resend } from "resend";
import { eq, and, lt, gt, sql, desc } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { config } from "../shared/config.js";

// ── Internal notify helper ──

const FROM_EMAIL = "criteria.agency <noreply@criteria.agency>";

async function notify(to: string, subject: string, html: string) {
  if (!config.resendApiKey) {
    console.log(`[SUBSCRIPTION] To: ${to}`);
    console.log(`[SUBSCRIPTION] Subject: ${subject}`);
    console.log(
      `[SUBSCRIPTION] Body: ${html.replace(/<[^>]*>/g, "").trim()}`
    );
    console.log(`[SUBSCRIPTION] ---`);
    return;
  }

  const resend = new Resend(config.resendApiKey);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[SUBSCRIPTION EMAIL ERROR] Failed to send to ${to}:`, error);
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
          WHERE ${schema.projects.createdAt} > ${thirtyDaysAgo}
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
