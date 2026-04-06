import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { generateContent, reviseContent } from "../services/content-writer.js";

export const contentRoutes = new Hono();

const VALID_TYPES = ["linkedin_post", "email_nurture", "blog_article", "social_caption", "landing_copy"] as const;
const VALID_STATUSES = ["draft", "review", "approved", "published"] as const;

// POST /api/content/generate — Generate new content
contentRoutes.post("/api/content/generate", async (c) => {
  const body = await c.req.json();
  const { type, topic, audience, tone, keyMessage, cta, additionalContext } = body;

  // Validate required fields
  const missing: string[] = [];
  if (!type) missing.push("type");
  if (!topic) missing.push("topic");
  if (!audience) missing.push("audience");
  if (!tone) missing.push("tone");
  if (!keyMessage) missing.push("keyMessage");
  if (!cta) missing.push("cta");

  if (missing.length > 0) {
    return c.json({ error: `Missing required fields: ${missing.join(", ")}` }, 400);
  }

  if (!VALID_TYPES.includes(type)) {
    return c.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` }, 400);
  }

  const brief = { type, topic, audience, tone, keyMessage, cta, additionalContext };
  const output = await generateContent(brief);

  const [piece] = await db
    .insert(schema.contentPieces)
    .values({
      type,
      status: "review",
      brief,
      content: output.content,
      title: output.title,
      meta: output.meta,
      version: 1,
    })
    .returning();

  return c.json(piece, 201);
});

// GET /api/content — List all content pieces
contentRoutes.get("/api/content", async (c) => {
  const pieces = await db
    .select()
    .from(schema.contentPieces)
    .orderBy(desc(schema.contentPieces.createdAt));
  return c.json(pieces);
});

// GET /api/content/:id — Get single content piece
contentRoutes.get("/api/content/:id", async (c) => {
  const [piece] = await db
    .select()
    .from(schema.contentPieces)
    .where(eq(schema.contentPieces.id, c.req.param("id")));

  if (!piece) return c.json({ error: "Not found" }, 404);
  return c.json(piece);
});

// PATCH /api/content/:id — Update status, content, or title
contentRoutes.patch("/api/content/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(schema.contentPieces)
    .where(eq(schema.contentPieces.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return c.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, 400);
    }
    updates.status = body.status;
  }
  if (body.content !== undefined) updates.content = body.content;
  if (body.title !== undefined) updates.title = body.title;

  const [updated] = await db
    .update(schema.contentPieces)
    .set(updates)
    .where(eq(schema.contentPieces.id, id))
    .returning();

  return c.json(updated);
});

// POST /api/content/:id/revise — Revise with feedback
contentRoutes.post("/api/content/:id/revise", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  if (!body.feedback) {
    return c.json({ error: "Missing required field: feedback" }, 400);
  }

  const [existing] = await db
    .select()
    .from(schema.contentPieces)
    .where(eq(schema.contentPieces.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  if (existing.version >= 4) {
    return c.json({ error: "Maximum revisions reached (3). Create a new content piece instead." }, 400);
  }

  const output = await reviseContent(id, body.feedback);
  const newVersion = existing.version + 1;

  const [updated] = await db
    .update(schema.contentPieces)
    .set({
      content: output.content,
      title: output.title,
      meta: output.meta,
      version: newVersion,
      revisionNotes: body.feedback,
      status: "review",
      updatedAt: new Date(),
    })
    .where(eq(schema.contentPieces.id, id))
    .returning();

  return c.json(updated);
});
