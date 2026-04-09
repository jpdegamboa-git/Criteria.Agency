import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

// Enable pgvector extension before running migrations
await client`CREATE EXTENSION IF NOT EXISTS vector`;
console.log('pgvector extension enabled');

// Run Drizzle migrations
await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../drizzle') });
console.log('Migrations complete');

await client.end();
