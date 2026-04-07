import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendWaitlistWelcome(name: string, email: string) {
  const subject = "Estas en la lista — criteria.agency";
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:500px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">Bienvenido, ${escapeHtml(name)}!</h2>
      <p style="color:#585758;">Gracias por unirte al waitlist de <strong>criteria.agency</strong>.</p>
      <p style="color:#585758;">Estas entre los primeros en probar nuestra plataforma de video profesional con IA.</p>
      <p style="color:#585758;">En las proximas semanas te enviaremos:</p>
      <ul style="color:#585758;">
        <li>Behind-the-scenes de como producimos video con IA</li>
        <li>Invitacion a la beta privada cuando este lista</li>
      </ul>
      <p style="color:#9d9a9c;font-size:13px;margin-top:24px;font-style:italic;">La IA genera. El criterio decide.</p>
    </div>
  `;

  if (!resend) {
    console.log("[WAITLIST EMAIL] To:", email);
    console.log("[WAITLIST EMAIL] Subject:", subject);
    console.log("[WAITLIST EMAIL] Name:", name);
    console.log("[WAITLIST EMAIL] ---");
    return;
  }

  await resend.emails.send({
    from: "criteria.agency <noreply@criteria.agency>",
    to: email,
    subject,
    html,
  });
}
