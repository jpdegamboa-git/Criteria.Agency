/**
 * Brand Builder routes — Phase 1
 *
 * POST /api/brand-builder/onboarding  — trigger Layer 0 (Inngest event)
 * GET  /api/brand-builder             — get current Brand DNA for tenant
 * GET  /api/brand-builder/score       — get latest Brand Health Score (Fundamentos)
 * GET  /api/brand-builder/artifacts   — list Brand DNA artifacts
 * POST /api/brand-builder/undo        — revert last Brand DNA update (DEC-084)
 *
 * All routes: tenant isolation via authenticated session (DEC-148).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  eq,
  and,
  desc,
  brandDna,
  brandDnaArtifacts,
  brandHealthScores,
} from '@criteria/db';
import type { Database } from '@criteria/db';
import { getAuthContext } from '../middleware/auth.js';
import { inngest } from '../inngest/client.js';
import { logger } from '../lib/logger.js';

const onboardingPathASchema = z.object({
  path: z.literal('A'),
  websiteUrl: z.string().url(),
  socialUrls: z.array(z.string().url()).default([]),
});

const onboardingPathBSchema = z.object({
  path: z.literal('B'),
  whatDoesDo: z.string().min(10).max(500),
  whoDoYouSellTo: z.string().min(5).max(500),
  whatMakesDifferent: z.string().min(5).max(500),
});

const onboardingSchema = z.discriminatedUnion('path', [
  onboardingPathASchema,
  onboardingPathBSchema,
]);

export function createBrandBuilderRoute(db: Database) {
  const app = new Hono();

  // POST /api/brand-builder/onboarding — start Layer 0
  app.post('/onboarding', async (c) => {
    const { tenantId } = getAuthContext(c);
    const body = await c.req.json().catch(() => null);

    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
    }

    try {
      const { ids } = await inngest.send({
        name: 'brand-builder/onboarding.started',
        data: {
          tenantId,
          onboarding: parsed.data,
        },
      });

      logger.info({ tenantId, path: parsed.data.path }, 'Brand Builder Layer 0 onboarding triggered');
      return c.json({ sent: true, eventIds: ids, path: parsed.data.path }, 202);
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to send onboarding event');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // POST /api/brand-builder/layer1 — trigger Layer 1 Discovery
  app.post('/layer1', async (c) => {
    const { tenantId } = getAuthContext(c);
    const rawBody = await c.req.json().catch(() => null) as {
      clientInput?: string;
      attemptNumber?: number;
    } | null;
    const body = rawBody ?? {};

    try {
      const { ids } = await inngest.send({
        name: 'brand-builder/layer1.started',
        data: {
          tenantId,
          clientInput: body.clientInput ?? '',
          attemptNumber: body.attemptNumber ?? 1,
        },
      });

      logger.info({ tenantId, attemptNumber: body.attemptNumber ?? 1 }, 'Brand Builder Layer 1 Discovery triggered');
      return c.json({ sent: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to send layer1 event');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // POST /api/brand-builder/layer2 — trigger Layer 2 Strategic Depth
  app.post('/layer2', async (c) => {
    const { tenantId } = getAuthContext(c);
    const rawBody = await c.req.json().catch(() => null) as {
      clientInput?: string;
      attemptNumber?: number;
      skills?: string[];
    } | null;
    const body = rawBody ?? {};

    try {
      const { ids } = await inngest.send({
        name: 'brand-builder/layer2.started',
        data: {
          tenantId,
          clientInput: body.clientInput ?? '',
          attemptNumber: body.attemptNumber ?? 1,
          skills: body.skills ?? ['positioning', 'archetype_voice'],
        },
      });

      logger.info({ tenantId }, 'Brand Builder Layer 2 Strategic Depth triggered');
      return c.json({ sent: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to send layer2 event');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // POST /api/brand-builder/layer3 — trigger Layer 3 Identity Systems
  app.post('/layer3', async (c) => {
    const { tenantId } = getAuthContext(c);
    const rawBody = await c.req.json().catch(() => null) as {
      clientInput?: string;
      attemptNumber?: number;
      visualPreferences?: Record<string, unknown>;
    } | null;
    const body = rawBody ?? {};

    try {
      const { ids } = await inngest.send({
        name: 'brand-builder/layer3.started',
        data: {
          tenantId,
          clientInput: body.clientInput ?? '',
          attemptNumber: body.attemptNumber ?? 1,
          visualPreferences: body.visualPreferences ?? {},
        },
      });

      logger.info({ tenantId }, 'Brand Builder Layer 3 Identity Systems triggered');
      return c.json({ sent: true, eventIds: ids }, 202);
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to send layer3 event');
      return c.json({ error: 'Failed to dispatch event — is Inngest Dev Server running?' }, 503);
    }
  });

  // GET /api/brand-builder — current Brand DNA state
  app.get('/', async (c) => {
    const { tenantId } = getAuthContext(c);

    const [dna] = await db
      .select()
      .from(brandDna)
      .where(eq(brandDna.organizationId, tenantId))
      .limit(1);

    if (!dna) {
      return c.json({ brandDna: null, message: 'No Brand DNA found — start with POST /onboarding' }, 200);
    }

    return c.json({ brandDna: dna });
  });

  // GET /api/brand-builder/score — latest Brand Health Score
  app.get('/score', async (c) => {
    const { tenantId } = getAuthContext(c);

    const [latest] = await db
      .select()
      .from(brandHealthScores)
      .where(eq(brandHealthScores.organizationId, tenantId))
      .orderBy(desc(brandHealthScores.calculatedAt))
      .limit(1);

    if (!latest) {
      return c.json({ score: null, message: 'No score yet — complete onboarding first' }, 200);
    }

    return c.json({ score: latest });
  });

  // GET /api/brand-builder/artifacts — list artifacts by layer
  app.get('/artifacts', async (c) => {
    const { tenantId } = getAuthContext(c);
    const layerParam = c.req.query('layer');
    const layer = layerParam !== undefined ? parseInt(layerParam, 10) : undefined;

    const conditions = [eq(brandDnaArtifacts.organizationId, tenantId)];
    if (layer !== undefined && !isNaN(layer)) {
      conditions.push(eq(brandDnaArtifacts.layer, layer));
    }

    const artifacts = await db
      .select()
      .from(brandDnaArtifacts)
      .where(and(...conditions))
      .orderBy(brandDnaArtifacts.layer, brandDnaArtifacts.artifactType);

    return c.json({ artifacts, total: artifacts.length });
  });

  // POST /api/brand-builder/undo — revert last Brand DNA update (DEC-084)
  app.post('/undo', async (c) => {
    const { tenantId } = getAuthContext(c);

    const [dna] = await db
      .select()
      .from(brandDna)
      .where(eq(brandDna.organizationId, tenantId))
      .limit(1);

    if (!dna) {
      return c.json({ error: 'No Brand DNA found' }, 404);
    }

    if (!dna.previousSnapshot) {
      return c.json({ error: 'No previous version to revert to' }, 400);
    }

    // Restore previous snapshot
    const snapshot = dna.previousSnapshot as Record<string, unknown>;
    await db
      .update(brandDna)
      .set({
        currentLayer: (snapshot.currentLayer as number) ?? dna.currentLayer,
        status: (snapshot.status as string) ?? dna.status,
        fundamentos_score: (snapshot.fundamentos_score as number) ?? dna.fundamentos_score,
        previousSnapshot: null,
        previousSnapshotAt: null,
        previousSnapshotTrigger: null,
      })
      .where(eq(brandDna.id, dna.id));

    logger.info({ tenantId }, 'Brand DNA reverted to previous snapshot');
    return c.json({ reverted: true, restoredLayer: snapshot.currentLayer });
  });

  return app;
}
