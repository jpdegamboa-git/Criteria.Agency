import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { generateText } from "../providers/generate-text.js";
import { normalizeName, similarity } from "../shared/fuzzy-match.js";

// ── Types ──

export interface MatchResult {
  entityId: string | null;
  confidence: number;
  created: boolean;
}

// ── Main Matching ──

export async function matchEntity(
  counterpartyName: string | null,
  description: string,
  amount: string | number,
): Promise<MatchResult> {
  const NO_MATCH: MatchResult = { entityId: null, confidence: 0, created: false };

  const allEntities = await db.select().from(schema.businessEntities);

  // ── 1. Pattern match ──
  const descLower = description.toLowerCase();
  for (const entity of allEntities) {
    const patterns = (entity.patterns ?? []) as string[];
    for (const pattern of patterns) {
      if (pattern && descLower.includes(pattern.toLowerCase())) {
        return { entityId: entity.id, confidence: 1.0, created: false };
      }
    }
  }

  // ── 2. Fuzzy name match ──
  if (counterpartyName) {
    let bestEntity: (typeof allEntities)[number] | null = null;
    let bestScore = 0;

    for (const entity of allEntities) {
      const score = similarity(counterpartyName, entity.name);
      if (score >= 85 && score > bestScore) {
        bestEntity = entity;
        bestScore = score;
      }
    }

    if (bestEntity) {
      return { entityId: bestEntity.id, confidence: 0.9, created: false };
    }
  }

  // ── 3. Client alias match ──
  if (counterpartyName) {
    const normalizedCp = normalizeName(counterpartyName);
    const aliases = await db.select().from(schema.clientAliases);

    for (const alias of aliases) {
      if (normalizeName(alias.alias) === normalizedCp) {
        // Check if entity already exists for this client
        const existing = allEntities.find(
          (e) => e.clientId === alias.clientId,
        );
        if (existing) {
          return { entityId: existing.id, confidence: 0.95, created: false };
        }

        // Look up client to create entity
        const [client] = await db
          .select()
          .from(schema.clients)
          .where(eq(schema.clients.id, alias.clientId));

        if (client) {
          const [newEntity] = await db
            .insert(schema.businessEntities)
            .values({
              name: client.company ?? client.name,
              type: "client",
              clientId: client.id,
              patterns: [counterpartyName],
            })
            .returning();

          return { entityId: newEntity.id, confidence: 0.95, created: true };
        }
      }
    }
  }

  // ── 4. AI extraction ──
  if (counterpartyName || description) {
    try {
      const system =
        "You are a financial entity extractor. Given transaction details, extract the clean business name and entity type. Respond ONLY with valid JSON.";

      const prompt = `Extract the business entity from this transaction:
- Counterparty: ${counterpartyName ?? "unknown"}
- Description: ${description}
- Amount: ${amount}

Respond with JSON:
{
  "name": "<clean business name>",
  "type": "client" | "vendor" | "personal" | "bank" | "government" | "unknown"
}`;

      const raw = await generateText("claude-haiku-4", system, prompt, 256);

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          _mock?: boolean;
          name?: string;
          type?: string;
        };

        // Skip mock responses
        if (!parsed._mock && parsed.name) {
          const validTypes = [
            "client",
            "vendor",
            "personal",
            "bank",
            "government",
            "unknown",
          ] as const;
          const entityType = validTypes.includes(
            parsed.type as (typeof validTypes)[number],
          )
            ? (parsed.type as (typeof validTypes)[number])
            : "unknown";

          const [newEntity] = await db
            .insert(schema.businessEntities)
            .values({
              name: parsed.name,
              type: entityType,
              patterns: [description],
            })
            .returning();

          return { entityId: newEntity.id, confidence: 0.7, created: true };
        }
      }
    } catch (err) {
      console.error("[entity-matcher] AI extraction failed:", err);
    }
  }

  // ── 5. Fallback auto-create ──
  if (counterpartyName && counterpartyName.trim() !== description.trim()) {
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;
    const entityType = numericAmount >= 0 ? "client" : "vendor";

    const [newEntity] = await db
      .insert(schema.businessEntities)
      .values({
        name: counterpartyName,
        type: entityType,
        patterns: [description],
      })
      .returning();

    return { entityId: newEntity.id, confidence: 0.5, created: true };
  }

  // ── 6. No match ──
  return NO_MATCH;
}

// ── Add Pattern ──

export async function addEntityPattern(
  entityId: string,
  pattern: string,
): Promise<void> {
  const [entity] = await db
    .select()
    .from(schema.businessEntities)
    .where(eq(schema.businessEntities.id, entityId));

  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  const existing = (entity.patterns ?? []) as string[];
  const normalizedNew = pattern.toLowerCase().trim();

  const alreadyPresent = existing.some(
    (p) => p.toLowerCase().trim() === normalizedNew,
  );

  if (!alreadyPresent) {
    await db
      .update(schema.businessEntities)
      .set({ patterns: [...existing, pattern] })
      .where(eq(schema.businessEntities.id, entityId));
  }
}
