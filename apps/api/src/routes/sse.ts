/**
 * SSE — Server-Sent Events endpoint (Fase 6)
 *
 * GET /api/sse — real-time stream for client portal
 *
 * Events pushed:
 *   - pipeline_progress  — video/web motor step completion
 *   - mara_proactive     — MARA alerts in play mode
 *   - alert              — threshold alerts (BHS change, KPI anomaly)
 *   - bhs_update         — Brand Health Score intraday recalculation
 *   - heartbeat          — keep-alive every 30s
 *
 * Implementation: standard SSE (text/event-stream).
 * Each tenant's stream is scoped by their session (tenantId from auth).
 * No WebSocket — SSE is sufficient for one-directional server→client updates.
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

export function createSseRoute(db: Database) {
  const app = new Hono();

  app.get('/', async (c) => {
    const { tenantId } = getAuthContext(c);

    logger.info({ tenantId }, 'SSE client connected');

    return streamSSE(c, async (stream) => {
      // Send initial connection event
      await stream.writeSSE({
        event: 'connected',
        data: JSON.stringify({ tenantId, timestamp: new Date().toISOString() }),
      });

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(async () => {
        try {
          await stream.writeSSE({
            event: 'heartbeat',
            data: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30_000);

      // Keep the stream open until client disconnects
      // In production, this would subscribe to a pub/sub channel (Redis, etc.)
      // For MVP: polling-based approach — check for new alerts every 60s
      let running = true;

      stream.onAbort(() => {
        running = false;
        clearInterval(heartbeatInterval);
        logger.info({ tenantId }, 'SSE client disconnected');
      });

      // MVP: simple loop to check for new events
      while (running) {
        await new Promise((resolve) => setTimeout(resolve, 60_000));

        if (!running) break;

        // Future: push BHS updates, MARA proactive messages, alerts here
        // For now, just send a heartbeat to confirm loop is alive
        try {
          await stream.writeSSE({
            event: 'heartbeat',
            data: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
        } catch {
          running = false;
        }
      }
    });
  });

  return app;
}
