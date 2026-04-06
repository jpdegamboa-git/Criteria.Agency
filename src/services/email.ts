import { Resend } from "resend";
import { config } from "../shared/config.js";

const resend = config.resendApiKey
  ? new Resend(config.resendApiKey)
  : null;

const FROM_EMAIL = "criteria.agency <noreply@criteria.agency>";

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${html.replace(/<[^>]*>/g, "").trim()}`);
    console.log(`[EMAIL] ---`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error);
  }
}

export async function sendReviewNotification(
  founderEmail: string,
  projectName: string,
  commentText: string,
  reviewUrl: string,
) {
  await send(
    founderEmail,
    `Nuevo comentario en "${projectName}"`,
    `
    <h2>Nuevo comentario del cliente</h2>
    <p><strong>Proyecto:</strong> ${projectName}</p>
    <p><strong>Comentario:</strong> ${commentText}</p>
    <p><a href="${reviewUrl}">Ver proyecto</a></p>
    `,
  );
}

export async function sendApprovalNotification(
  founderEmail: string,
  projectName: string,
) {
  await send(
    founderEmail,
    `Proyecto aprobado: "${projectName}"`,
    `
    <h2>El cliente aprobo el proyecto</h2>
    <p><strong>Proyecto:</strong> ${projectName}</p>
    <p>El cliente ha aprobado la entrega. Puedes proceder con la entrega final.</p>
    `,
  );
}

export async function sendRevisionNotification(
  founderEmail: string,
  projectName: string,
  reviewUrl: string,
) {
  await send(
    founderEmail,
    `Revision solicitada: "${projectName}"`,
    `
    <h2>El cliente solicita cambios</h2>
    <p><strong>Proyecto:</strong> ${projectName}</p>
    <p>Revisa los comentarios del cliente y sube una nueva version.</p>
    <p><a href="${reviewUrl}">Ver proyecto</a></p>
    `,
  );
}

export async function sendNewVersionNotification(
  clientEmail: string,
  projectName: string,
  reviewUrl: string,
) {
  await send(
    clientEmail,
    `Nueva version lista: "${projectName}"`,
    `
    <h2>Tu proyecto tiene una nueva version</h2>
    <p><strong>Proyecto:</strong> ${projectName}</p>
    <p>Hemos subido una nueva version de tu entrega. Revisala y dejanos tus comentarios.</p>
    <p><a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Ver mi proyecto</a></p>
    `,
  );
}

export async function sendDeliveryNotification(
  clientEmail: string,
  projectName: string,
  reviewUrl: string,
) {
  await send(
    clientEmail,
    `Tu proyecto esta listo: "${projectName}"`,
    `
    <h2>Tu video esta listo para revision</h2>
    <p><strong>Proyecto:</strong> ${projectName}</p>
    <p>Nuestro equipo ha completado tu proyecto. Revisalo, dejanos comentarios, y apruebalo cuando estes satisfecho.</p>
    <p><a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Revisar mi video</a></p>
    <p style="color:#666;font-size:13px;margin-top:24px;">La IA genera. El criterio decide.</p>
    `,
  );
}
