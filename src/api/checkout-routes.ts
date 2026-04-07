import { Hono } from "hono";
import {
  createCheckoutSession,
  constructWebhookEvent,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
} from "../services/stripe.js";
import { renderPricingPage, renderCheckoutSuccess, renderCheckoutCancel } from "../views/pricing-page.js";
import { createCheckoutSchema, parseBody } from "./validators.js";

export const checkoutRoutes = new Hono();

// GET /pricing — Render pricing page
checkoutRoutes.get("/pricing", (c) => {
  return c.html(renderPricingPage());
});

// POST /api/checkout — Create Stripe Checkout Session
checkoutRoutes.post("/api/checkout", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createCheckoutSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { tier, billingPeriod, name, email, company } = parsed.data;

  try {
    const url = await createCheckoutSession({
      tier,
      billingPeriod,
      name,
      email,
      company,
    });

    if (!url) {
      return c.json({ error: "No se pudo crear la sesion de checkout" }, 500);
    }

    return c.json({ url });
  } catch (err) {
    console.error("[CHECKOUT] Error:", err);
    return c.json({ error: "Error al procesar el checkout" }, 500);
  }
});

// GET /checkout/success — Thank you page
checkoutRoutes.get("/checkout/success", (c) => {
  return c.html(renderCheckoutSuccess());
});

// GET /checkout/cancel — Come back page
checkoutRoutes.get("/checkout/cancel", (c) => {
  return c.html(renderCheckoutCancel());
});

// POST /api/webhooks/stripe — Stripe webhook handler
// CRITICAL: Must read raw body for signature verification
checkoutRoutes.post("/api/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  // Read raw body (not JSON-parsed) for signature verification
  const rawBody = await c.req.text();

  try {
    const event = constructWebhookEvent(rawBody, signature);

    if (!event) {
      // Mock mode — no Stripe configured
      console.log("[STRIPE WEBHOOK] Mock mode — event ignored");
      return c.json({ received: true });
    }

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as any);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as any);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as any);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as any);
        break;
      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Error:", err);
    return c.json({ error: "Webhook error" }, 400);
  }
});
