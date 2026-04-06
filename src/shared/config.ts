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
};
