import crypto from "crypto";
import { db, schema } from "../db/index.js";
import { eq, and, gt } from "drizzle-orm";

const TOKEN_EXPIRY_DAYS = 30;

export async function generateReviewToken(
  projectId: string,
  clientEmail: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  await db.insert(schema.reviewTokens).values({
    projectId,
    token,
    clientEmail,
    expiresAt,
  });

  return token;
}

export async function validateReviewToken(
  token: string,
): Promise<{ valid: true; projectId: string; clientEmail: string } | { valid: false }> {
  const [record] = await db
    .select()
    .from(schema.reviewTokens)
    .where(
      and(
        eq(schema.reviewTokens.token, token),
        gt(schema.reviewTokens.expiresAt, new Date()),
      ),
    );

  if (!record) {
    return { valid: false };
  }

  // Sliding window: extend expiry on each access
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + TOKEN_EXPIRY_DAYS);

  await db
    .update(schema.reviewTokens)
    .set({
      lastAccessedAt: new Date(),
      expiresAt: newExpiry,
    })
    .where(eq(schema.reviewTokens.id, record.id));

  return {
    valid: true,
    projectId: record.projectId,
    clientEmail: record.clientEmail,
  };
}
