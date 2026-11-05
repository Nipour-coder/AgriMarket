import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, '.env') });
dotenv.config({ path: path.join(dir, '.env.local') });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://placeholder:placeholder@localhost:5432/agrimarket',
  },
});
