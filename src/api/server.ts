import { serve } from "@hono/node-server";
import { app } from "./routes.js";
import { config } from "../shared/config.js";
import cron from "node-cron";
import {
  checkExpiringTrials,
  checkExpiredTrials,
  checkOverduePayments,
  detectChurnRisk,
  createRecurringPayments,
  sendEarlyAdopterTransitionNotice,
} from "../services/subscription-manager.js";

// Start HTTP server
serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`CriteriaFilms API running on http://localhost:${info.port}`);
});

// Schedule subscription management tasks
cron.schedule("0 9 * * *", () => {
  console.log("[CRON] Running: checkExpiringTrials");
  checkExpiringTrials().catch(console.error);
});

cron.schedule("0 10 * * *", () => {
  console.log("[CRON] Running: checkExpiredTrials");
  checkExpiredTrials().catch(console.error);
});

cron.schedule("0 11 * * *", () => {
  console.log("[CRON] Running: checkOverduePayments");
  checkOverduePayments().catch(console.error);
});

cron.schedule("0 9 * * 1", () => {
  console.log("[CRON] Running: detectChurnRisk");
  detectChurnRisk().catch(console.error);
});

cron.schedule("0 8 1 * *", () => {
  console.log("[CRON] Running: createRecurringPayments");
  createRecurringPayments().catch(console.error);
});

cron.schedule("0 12 * * *", () => {
  console.log("[CRON] Running: sendEarlyAdopterTransitionNotice");
  sendEarlyAdopterTransitionNotice().catch(console.error);
});

console.log("[CRON] Subscription management tasks scheduled");
