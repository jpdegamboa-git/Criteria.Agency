import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { config } from "../shared/config.js";
import { validateReviewToken, generateReviewToken } from "../services/review-tokens.js";
import {
  sendDeliveryNotification,
  sendReviewNotification,
  sendApprovalNotification,
  sendRevisionNotification,
  sendNewVersionNotification,
} from "../services/email.js";
import { renderReviewPage } from "../views/review-page.js";
import { errorPage } from "../views/layout.js";

export const reviewRoutes = new Hono();

// ── Client-facing routes (token-based) ──

// GET /review/:token — Render review page
reviewRoutes.get("/review/:token", async (c) => {
  const result = await validateReviewToken(c.req.param("token"));
  if (!result.valid) {
    return c.html(
      errorPage(
        "Enlace invalido o expirado",
        "Este enlace de revision ya no es valido. Contacta a tu gestor de proyecto para obtener un nuevo enlace.",
      ),
      404,
    );
  }

  const { projectId } = result;

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    return c.html(errorPage("Proyecto no encontrado", "El proyecto asociado a este enlace no existe."), 404);
  }

  const gates = await db
    .select()
    .from(schema.gateReviews)
    .where(eq(schema.gateReviews.projectId, projectId))
    .orderBy(schema.gateReviews.createdAt);

  const comments = await db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.projectId, projectId))
    .orderBy(schema.comments.createdAt);

  return c.html(
    renderReviewPage({
      projectName: project.name,
      projectType: project.type,
      deliveryStatus: project.deliveryStatus,
      currentVersion: project.currentVersion,
      videoUrl: project.videoUrl,
      gates: gates.map((g) => ({
        gate: g.gate,
        decision: g.decision,
        iteration: g.iteration,
        createdAt: g.createdAt,
      })),
      comments: comments.map((cm) => ({
        author: cm.author,
        authorName: cm.authorName,
        text: cm.text,
        createdAt: cm.createdAt,
      })),
      token: c.req.param("token"),
    }),
  );
});

// POST /review/:token/comments — Client adds a comment
reviewRoutes.post("/review/:token/comments", async (c) => {
  const result = await validateReviewToken(c.req.param("token"));
  if (!result.valid) {
    return c.json({ error: "Token invalido o expirado" }, 401);
  }

  const { projectId, clientEmail } = result;
  const body = await c.req.json();
  const text = body.text?.trim();

  if (!text) {
    return c.json({ error: "Comentario vacio" }, 400);
  }

  // Insert comment
  await db.insert(schema.comments).values({
    projectId,
    author: "client",
    authorName: clientEmail,
    text,
  });

  // Auto-transition to in_review on first comment
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (project && project.deliveryStatus === "delivered") {
    await db
      .update(schema.projects)
      .set({ deliveryStatus: "in_review", updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));
  }

  // Notify founder
  const reviewUrl = `${config.baseUrl}/review/${c.req.param("token")}`;
  await sendReviewNotification(
    config.founderEmail,
    project?.name ?? "Proyecto",
    text,
    reviewUrl,
  );

  return c.json({ ok: true });
});

// POST /review/:token/status — Client approves or requests revision
reviewRoutes.post("/review/:token/status", async (c) => {
  const result = await validateReviewToken(c.req.param("token"));
  if (!result.valid) {
    return c.json({ error: "Token invalido o expirado" }, 401);
  }

  const { projectId } = result;
  const body = await c.req.json();
  const action = body.action;

  if (action !== "approve" && action !== "revision_requested") {
    return c.json({ error: "Accion invalida" }, 400);
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    return c.json({ error: "Proyecto no encontrado" }, 404);
  }

  if (
    project.deliveryStatus !== "delivered" &&
    project.deliveryStatus !== "in_review"
  ) {
    return c.json({ error: "El proyecto no esta en estado de revision" }, 400);
  }

  await db
    .update(schema.projects)
    .set({
      deliveryStatus: action === "approve" ? "approved" : "revision_requested",
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId));

  const reviewUrl = `${config.baseUrl}/review/${c.req.param("token")}`;

  if (action === "approve") {
    await sendApprovalNotification(config.founderEmail, project.name);
  } else {
    await sendRevisionNotification(config.founderEmail, project.name, reviewUrl);
  }

  return c.json({ ok: true });
});

// ── Internal API routes ──

// POST /api/projects/:id/deliver — Mark project as delivered, generate token, email client
reviewRoutes.post("/api/projects/:id/deliver", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const { clientEmail, videoUrl } = body;

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    return c.json({ error: "Proyecto no encontrado" }, 404);
  }

  // Update project
  await db
    .update(schema.projects)
    .set({
      deliveryStatus: "delivered",
      videoUrl: videoUrl ?? project.videoUrl,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId));

  // Get client email from client record if not provided
  let email = clientEmail;
  if (!email) {
    const [client] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, project.clientId));
    email = client?.email;
  }

  if (!email) {
    return c.json({ error: "No se pudo determinar el email del cliente" }, 400);
  }

  // Generate review token
  const token = await generateReviewToken(projectId, email);
  const reviewUrl = `${config.baseUrl}/review/${token}`;

  // Send delivery notification to client
  await sendDeliveryNotification(email, project.name, reviewUrl);

  return c.json({ ok: true, reviewUrl, token });
});

// POST /api/projects/:id/comments — Internal: criteria team adds comment
reviewRoutes.post("/api/projects/:id/comments", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const text = body.text?.trim();

  if (!text) {
    return c.json({ error: "Comentario vacio" }, 400);
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    return c.json({ error: "Proyecto no encontrado" }, 404);
  }

  await db.insert(schema.comments).values({
    projectId,
    author: "criteria",
    authorName: "criteria.agency",
    text,
  });

  return c.json({ ok: true });
});

// POST /api/projects/:id/new-version — Upload new version and notify client
reviewRoutes.post("/api/projects/:id/new-version", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const { videoUrl } = body;

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));

  if (!project) {
    return c.json({ error: "Proyecto no encontrado" }, 404);
  }

  // Increment version and update
  await db
    .update(schema.projects)
    .set({
      currentVersion: project.currentVersion + 1,
      deliveryStatus: "delivered",
      videoUrl: videoUrl ?? project.videoUrl,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId));

  // Find existing token to get review URL and client email
  const [tokenRecord] = await db
    .select()
    .from(schema.reviewTokens)
    .where(eq(schema.reviewTokens.projectId, projectId))
    .orderBy(desc(schema.reviewTokens.createdAt))
    .limit(1);

  if (tokenRecord) {
    const reviewUrl = `${config.baseUrl}/review/${tokenRecord.token}`;
    await sendNewVersionNotification(tokenRecord.clientEmail, project.name, reviewUrl);
  }

  return c.json({ ok: true, version: project.currentVersion + 1 });
});
