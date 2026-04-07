import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { generateContent, reviseContent } from "../services/content-writer.js";
import { parseBody, generateContentSchema, updateContentSchema, reviseContentSchema } from "./validators.js";

export const contentRoutes = new Hono();

// POST /api/content/generate — Generate new content
contentRoutes.post("/api/content/generate", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(generateContentSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { type, topic, audience, tone, keyMessage, cta, additionalContext } = parsed.data;

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

  const parsed = parseBody(updateContentSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.content !== undefined) updates.content = parsed.data.content;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;

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

  const parsed = parseBody(reviseContentSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const [existing] = await db
    .select()
    .from(schema.contentPieces)
    .where(eq(schema.contentPieces.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  if (existing.version >= 4) {
    return c.json({ error: "Maximum revisions reached (3). Create a new content piece instead." }, 400);
  }

  const output = await reviseContent(id, parsed.data.feedback);
  const newVersion = existing.version + 1;

  const [updated] = await db
    .update(schema.contentPieces)
    .set({
      content: output.content,
      title: output.title,
      meta: output.meta,
      version: newVersion,
      revisionNotes: parsed.data.feedback,
      status: "review",
      updatedAt: new Date(),
    })
    .where(eq(schema.contentPieces.id, id))
    .returning();

  return c.json(updated);
});
