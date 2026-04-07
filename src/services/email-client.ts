import { Resend } from "resend";
import { config } from "../shared/config.js";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;
const FROM_EMAIL = "criteria.agency <noreply@criteria.agency>";

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!resend) {
    console.log(`[email-mock] To: ${to}, Subject: ${subject}`);
    return true;
  }
  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  return !error;
}

export { resend, FROM_EMAIL };
