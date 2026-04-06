/**
 * One-time script to create Stripe Products and Prices.
 * Run: npm run stripe:setup
 *
 * After running, copy the printed price IDs into your .env file.
 */

import "dotenv/config";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is required. Set it in .env");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function setup() {
  console.log("Creating Stripe products and prices...\n");

  // ── Starter Product ──
  const starterProduct = await stripe.products.create({
    name: "criteria.agency Starter",
    description: "1 video profesional/mes, quality gates, AI Copilot",
  });

  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 50000, // $500.00
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "starter", type: "full" },
  });

  const starterEarly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 30000, // $300.00
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "starter", type: "early_adopter" },
  });

  const starterYearly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 500000, // $5,000.00
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { tier: "starter", type: "yearly" },
  });

  // ── Pro Product ──
  const proProduct = await stripe.products.create({
    name: "criteria.agency Pro",
    description: "4 videos profesionales/mes, prioridad, quality gates, AI Copilot",
  });

  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 200000, // $2,000.00
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "pro", type: "full" },
  });

  const proEarly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 120000, // $1,200.00
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "pro", type: "early_adopter" },
  });

  const proYearly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2000000, // $20,000.00
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { tier: "pro", type: "yearly" },
  });

  console.log("Products and prices created successfully!\n");
  console.log("Add these to your .env file:\n");
  console.log(`STRIPE_STARTER_PRICE_ID=${starterMonthly.id}`);
  console.log(`STRIPE_STARTER_EARLY_PRICE_ID=${starterEarly.id}`);
  console.log(`STRIPE_STARTER_YEARLY_PRICE_ID=${starterYearly.id}`);
  console.log(`STRIPE_PRO_PRICE_ID=${proMonthly.id}`);
  console.log(`STRIPE_PRO_EARLY_PRICE_ID=${proEarly.id}`);
  console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearly.id}`);
}

setup().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
