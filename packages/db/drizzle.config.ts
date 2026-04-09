import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Set it in .env at the project root.');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
