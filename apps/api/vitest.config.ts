import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'test-secret-for-vitest',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
      INNGEST_DEV: '1',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      HELICONE_API_KEY: process.env.HELICONE_API_KEY ?? '',
    },
  },
});
