import { serve } from '@hono/node-server';
import { createDb } from '@criteria/db';
import { createApp } from './index.js';
import { logger } from './lib/logger.js';
import { validateEnv } from './lib/env-validation.js';

// Validate environment before starting — fails fast on misconfiguration (Step 7.1)
validateEnv();

const port = parseInt(process.env.PORT ?? '3001', 10);
const db = createDb();
const { app } = createApp(db);

serve({ fetch: app.fetch, port }, () => {
  logger.info({ port }, `criteria.agency API running on http://localhost:${port}`);
});
