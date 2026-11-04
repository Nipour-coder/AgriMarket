import { defineConfig } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnvConfig(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  dialect: 'postgresql',
  schema: '../backend/db/schema.ts',
  out: '../backend/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://placeholder:placeholder@localhost:5432/agrimarket',
  },
});
