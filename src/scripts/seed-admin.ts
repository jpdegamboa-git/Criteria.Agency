import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { auth } from "../auth.js";
import crypto from "crypto";

/**
 * Seed admin user.
 *
 * Usage:
 *   npm run db:seed-admin -- <email> [password]
 *
 * If user exists → promotes to admin.
 * If user doesn't exist → creates with given or random password, then promotes.
 */
async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("Usage: npm run db:seed-admin -- <email> [password]");
    process.exit(1);
  }

  const password = process.argv[3] || crypto.randomBytes(16).toString("hex");

  // Check if user already exists
  const [existing] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email));

  if (existing) {
    if (existing.role === "admin") {
      console.log(`User ${email} is already an admin.`);
      process.exit(0);
    }

    await db
      .update(schema.user)
      .set({ role: "admin" })
      .where(eq(schema.user.id, existing.id));

    console.log(`Promoted ${email} to admin.`);
    process.exit(0);
  }

  // Create new user via Better Auth API
  const result = await auth.api.signUpEmail({
    body: {
      name: "Admin",
      email,
      password,
    },
  });

  if (!result?.user) {
    console.error("Failed to create user:", result);
    process.exit(1);
  }

  // Promote to admin
  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, result.user.id));

  console.log(`Created admin user:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`\nSave these credentials — the password won't be shown again.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
