import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

/**
 * Create a Drizzle database client.
 * Uses postgres.js driver — works with Neon, Supabase, or local PostgreSQL.
 */
export function createDb(connectionString?: string) {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const client = postgres(url);
  const db = drizzle(client, { schema });
  return Object.assign(db, {
    close: () => client.end(),
  });
}

export type Database = ReturnType<typeof createDb>;
