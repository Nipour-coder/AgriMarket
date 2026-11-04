import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(currentDir, '..');
loadEnvConfig(backendDir);

const globalForDb = globalThis as typeof globalThis & {
  agrimarketSql?: ReturnType<typeof postgres>;
  agrimarketDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getDb() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    loadEnvConfig(backendDir);
    connectionString = process.env.DATABASE_URL;
  }

  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Add your Neon connection string to backend/.env.');
  }

  if (!globalForDb.agrimarketDb) {
    const sql = globalForDb.agrimarketSql ?? postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: 'require',
      prepare: false,
    });
    globalForDb.agrimarketSql = sql;
    globalForDb.agrimarketDb = drizzle(sql, { schema });
  }
  return globalForDb.agrimarketDb;
}
