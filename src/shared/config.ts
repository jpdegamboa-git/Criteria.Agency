import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://criteriafilms:criteriafilms@localhost:5432/criteriafilms",
  storagePath: path.resolve(
    ROOT_DIR,
    process.env.STORAGE_PATH ?? "./storage"
  ),
  agentsPath: path.resolve(ROOT_DIR, "agents"),
  port: parseInt(process.env.PORT ?? "3000", 10),
  gatePassRate: parseFloat(process.env.GATE_PASS_RATE ?? "0.8"),

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  founderEmail: process.env.FOUNDER_EMAIL ?? "founder@criteria.agency",

  // Base URL for links in emails
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripe: {
    starterPriceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    starterEarlyPriceId: process.env.STRIPE_STARTER_EARLY_PRICE_ID ?? "",
    starterYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID ?? "",
    proPriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    proEarlyPriceId: process.env.STRIPE_PRO_EARLY_PRICE_ID ?? "",
    proYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  },

  // Anthropic (Claude API)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",

  // Google AI (Gemini, Imagen, Veo)
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY ?? "",

  // PiAPI (Kling, Seedance)
  piapiApiKey: process.env.PIAPI_API_KEY ?? "",

  // Admin API key for internal routes
  adminApiKey: process.env.ADMIN_API_KEY ?? "",

  // Better Auth
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-in-production",

  // Explicit dev-mode auth bypass — must be set to "true" to skip auth
  skipAuth: process.env.SKIP_AUTH === "true",
  webUrl: process.env.WEB_URL ?? "http://localhost:3001",

  // Google OAuth (for social login)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
};

// ── Startup security audit ──
export function auditConfig(): void {
  const warnings: string[] = [];
  const configured: string[] = [];

  // Required
  if (!config.databaseUrl) warnings.push("DATABASE_URL not set");

  // Optional services — report status
  if (config.anthropicApiKey) configured.push("Anthropic (Claude)");
  else warnings.push("ANTHROPIC_API_KEY empty — text agents will use mock mode");

  if (config.googleAiApiKey) configured.push("Google AI (Gemini/Imagen/Veo)");
  else warnings.push("GOOGLE_AI_API_KEY empty — image/video/audio agents will use mock mode");

  if (config.piapiApiKey) configured.push("PiAPI (Kling/Seedance)");
  else warnings.push("PIAPI_API_KEY empty — PiAPI video models unavailable");

  if (config.stripeSecretKey) configured.push("Stripe");
  else warnings.push("STRIPE_SECRET_KEY empty — checkout will use mock mode");

  if (config.resendApiKey) configured.push("Resend (email)");
  else warnings.push("RESEND_API_KEY empty — emails will log to console");

  if (config.skipAuth) warnings.push("SKIP_AUTH=true — ALL authentication is bypassed (dev/test only)");
  if (config.adminApiKey) configured.push("Admin auth");
  else if (!config.skipAuth) warnings.push("ADMIN_API_KEY empty — API routes are UNPROTECTED");

  if (config.googleClientId && config.googleClientSecret) configured.push("Google OAuth");
  else warnings.push("GOOGLE_CLIENT_ID/SECRET empty — Google sign-in disabled");

  // Report (uses console directly since logger may not be initialized yet)
  if (configured.length > 0) {
    console.log(`[CONFIG] Services configured: ${configured.join(", ")}`);
  }
  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(`[CONFIG] ⚠ ${w}`);
    }
  }
}
