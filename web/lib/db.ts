import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://criteriafilms:criteriafilms@localhost:5432/criteriafilms";

// Auto-detect SSL for cloud databases (Neon, Vercel Postgres, Supabase)
const isCloudDB =
  connectionString.includes("neon.tech") ||
  connectionString.includes("vercel-storage") ||
  connectionString.includes("supabase") ||
  connectionString.includes("sslmode=require");

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: isCloudDB ? "require" : undefined,
});
export const db = drizzle(client);
