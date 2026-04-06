import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { addEntityPattern } from "../services/entity-matcher.js";

export const entityRoutes = new Hono();

// GET /api/entities — list all business entities
entityRoutes.get("/api/entities", async (c) => {
  const data = await db.select().from(schema.businessEntities);
  return c.json(data);
});

// POST /api/entities — create entity
entityRoutes.post("/api/entities", async (c) => {
  const body = await c.req.json();
  const { name, type, clientId, patterns, defaultCategory, notes } = body;

  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  const [created] = await db
    .insert(schema.businessEntities)
    .values({
      name,
      type: type ?? "unknown",
      clientId: clientId ?? null,
      patterns: patterns ?? [],
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
  const { name, type, defaultCategory, patterns, notes } = body;

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

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

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
  const { pattern } = body;

  if (!pattern) {
    return c.json({ error: "pattern is required" }, 400);
  }

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
