import { serve } from '@hono/node-server';
import { app } from './index.js';
import { logger } from './lib/logger.js';

const port = parseInt(process.env.PORT ?? '3001', 10);

serve({ fetch: app.fetch, port }, () => {
  logger.info({ port }, `criteria.agency API running on http://localhost:${port}`);
});
