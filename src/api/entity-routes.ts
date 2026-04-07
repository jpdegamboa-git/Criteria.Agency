import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { addEntityPattern } from "../services/entity-matcher.js";
import { parseBody, createEntitySchema, updateEntitySchema, addPatternSchema } from "./validators.js";

export const entityRoutes = new Hono();

// GET /api/entities — list all business entities
entityRoutes.get("/api/entities", async (c) => {
  const data = await db.select().from(schema.businessEntities);
  return c.json(data);
});

// POST /api/entities — create entity
entityRoutes.post("/api/entities", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(createEntitySchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { name, type, clientId, patterns, defaultCategory, notes } = parsed.data;

  const [created] = await db
    .insert(schema.businessEntities)
    .values({
      name,
      type,
      clientId: clientId ?? null,
      patterns,
      defaultCategory: defaultCategory ?? null,
      notes: notes ?? null,
    })
    .returning();

  return c.json(created, 201);
});

// PATCH /api/entities/:id — update entity
entityRoutes.patch("/api/entities/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = parseBody(updateEntitySchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { name, type, defaultCategory, patterns, notes } = parsed.data;

  const [existing] = await db
    .select()
    .from(schema.businessEntities)
    .where(eq(schema.businessEntities.id, id));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (defaultCategory !== undefined) updates.defaultCategory = defaultCategory;
  if (patterns !== undefined) updates.patterns = patterns;
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db
    .update(schema.businessEntities)
    .set(updates)
    .where(eq(schema.businessEntities.id, id))
    .returning();

  return c.json(updated);
});

// POST /api/entities/:id/patterns — add pattern
entityRoutes.post("/api/entities/:id/patterns", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = parseBody(addPatternSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { pattern } = parsed.data;

  try {
    await addEntityPattern(id, pattern);
    return c.json({ ok: true });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      404,
    );
  }
});
