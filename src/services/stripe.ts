import Stripe from "stripe";
import { config } from "../shared/config.js";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey)
  : null;

type Tier = "starter" | "pro";
type BillingPeriod = "monthly" | "yearly";

function getPriceId(tier: Tier, billingPeriod: BillingPeriod, earlyAdopter: boolean): string {
  if (tier === "starter") {
    if (billingPeriod === "yearly") return config.stripe.starterYearlyPriceId;
    return earlyAdopter ? config.stripe.starterEarlyPriceId : config.stripe.starterPriceId;
  }
  // pro
  if (billingPeriod === "yearly") return config.stripe.proYearlyPriceId;
  return earlyAdopter ? config.stripe.proEarlyPriceId : config.stripe.proPriceId;
}

export async function createCheckoutSession(params: {
  tier: Tier;
  billingPeriod: BillingPeriod;
  name: string;
  email: string;
  company: string;
}): Promise<string | null> {
  if (!stripe) {
    console.log(`[STRIPE] Mock checkout session for ${params.email} — tier: ${params.tier}, period: ${params.billingPeriod}`);
    return `${config.baseUrl}/checkout/success?mock=true`;
  }

  const priceId = getPriceId(params.tier, params.billingPeriod, true); // Early adopter by default

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_collection: "if_required",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        tier: params.tier,
        earlyAdopter: "true",
      },
    },
    customer_email: params.email,
    metadata: {
      name: params.name,
      company: params.company,
      tier: params.tier,
      billingPeriod: params.billingPeriod,
    },
    success_url: `${config.baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.baseUrl}/checkout/cancel`,
  });

  return session.url;
}

export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event | null {
  if (!stripe) {
    console.log("[STRIPE] Mock webhook — no Stripe client configured");
    return null;
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripeWebhookSecret,
  );
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customer = subscription.customer as string;
  const metadata = subscription.metadata;
  const tier = (metadata.tier ?? "starter") as Tier;

  // Get customer email from Stripe
  let email: string | undefined;
  if (stripe) {
    const stripeCustomer = await stripe.customers.retrieve(customer);
    if (stripeCustomer && !stripeCustomer.deleted) {
      email = stripeCustomer.email ?? undefined;
    }
  }

  if (!email) return;

  // Find or create client
  let [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.email, email));

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  // Early adopter ends 3 months after trial ends (or 4 months from now)
  const earlyAdopterEnd = new Date();
  earlyAdopterEnd.setMonth(earlyAdopterEnd.getMonth() + 4);

  const updateData = {
    stripeCustomerId: customer,
    subscriptionTier: tier as "starter" | "pro",
    subscriptionStatus: "trialing" as const,
    trialEndsAt: trialEnd,
    earlyAdopterEndsAt: earlyAdopterEnd,
  };

  if (client) {
    await db
      .update(schema.clients)
      .set(updateData)
      .where(eq(schema.clients.id, client.id));
  } else {
    await db.insert(schema.clients).values({
      name: email.split("@")[0],
      email,
      ...updateData,
    });
  }

  // Schedule transition from early adopter to full price after 3 months
  if (stripe && metadata.earlyAdopter === "true") {
    try {
      const fullPriceId = getPriceId(tier, "monthly", false);
      if (fullPriceId) {
        // Calculate end date for early adopter phase (3 months from now)
        const earlyEnd = new Date();
        earlyEnd.setMonth(earlyEnd.getMonth() + 3);
        const earlyEndUnix = Math.floor(earlyEnd.getTime() / 1000);

        await stripe.subscriptionSchedules.create({
          from_subscription: subscription.id,
          phases: [
            {
              items: [{ price: getPriceId(tier, "monthly", true), quantity: 1 }],
              end_date: earlyEndUnix,
            },
            {
              items: [{ price: fullPriceId, quantity: 1 }],
            },
          ],
        });
      }
    } catch (err) {
      console.error("[STRIPE] Failed to create subscription schedule:", err);
      // Non-fatal — subscription still works, just won't auto-transition
    }
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customer = subscription.customer as string;

  const statusMap: Record<string, "trialing" | "active" | "past_due" | "canceled"> = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    unpaid: "past_due",
    paused: "past_due",
  };

  const newStatus = statusMap[subscription.status] ?? "active";

  await db
    .update(schema.clients)
    .set({ subscriptionStatus: newStatus })
    .where(eq(schema.clients.stripeCustomerId, customer));
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customer = subscription.customer as string;

  await db
    .update(schema.clients)
    .set({
      subscriptionStatus: "canceled",
      subscriptionTier: null,
    })
    .where(eq(schema.clients.stripeCustomerId, customer));
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customer = invoice.customer as string;

  await db
    .update(schema.clients)
    .set({ subscriptionStatus: "past_due" })
    .where(eq(schema.clients.stripeCustomerId, customer));

  console.log(`[STRIPE] Invoice payment failed for customer ${customer}`);
}
