import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(currentDir, '..', '..');

// Load environment variables from .env
dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(backendDir, '.env.local') });

const globalForDb = globalThis as typeof globalThis & {
  agrimarketSql?: ReturnType<typeof postgres>;
  agrimarketDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

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

