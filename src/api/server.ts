import { serve } from "@hono/node-server";
import { app } from "./routes.js";
import { config, auditConfig } from "../shared/config.js";
import { logger } from "../shared/logger.js";
import cron from "node-cron";
import {
  checkExpiringTrials,
  checkExpiredTrials,
  checkOverduePayments,
  detectChurnRisk,
  createRecurringPayments,
  sendEarlyAdopterTransitionNotice,
  sendWaitlistNurture,
} from "../services/subscription-manager.js";

// Security audit on startup
auditConfig();

// Start HTTP server
serve({ fetch: app.fetch, port: config.port }, (info) => {
  logger.info("server.started", { port: info.port });
});

// Schedule subscription management tasks
const cronJob = (schedule: string, name: string, fn: () => Promise<unknown>) => {
  cron.schedule(schedule, () => {
    logger.info("cron.run", { job: name });
    fn().catch((err) => logger.error("cron.failed", { job: name, error: String(err) }));
  });
};

cronJob("0 9 * * *", "checkExpiringTrials", checkExpiringTrials);
cronJob("0 10 * * *", "checkExpiredTrials", checkExpiredTrials);
cronJob("0 11 * * *", "checkOverduePayments", checkOverduePayments);
cronJob("0 9 * * 1", "detectChurnRisk", detectChurnRisk);
cronJob("0 8 1 * *", "createRecurringPayments", createRecurringPayments);
cronJob("0 12 * * *", "sendEarlyAdopterTransitionNotice", sendEarlyAdopterTransitionNotice);
cronJob("0 13 * * *", "sendWaitlistNurture", sendWaitlistNurture);

logger.info("cron.scheduled", { jobs: 7 });
