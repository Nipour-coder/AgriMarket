import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDb } from '@backend/db';
import { sessions, users } from '@backend/db/schema';

export const SESSION_COOKIE = 'agrimarket_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type AuthUser = Omit<typeof users.$inferSelect, 'passwordHash'>;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSession(): Promise<void> {
  const db = getDb();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();

  const [record] = await db.select({
    user: users,
    sessionId: sessions.id,
  }).from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(
      eq(sessions.tokenHash, hashToken(token)),
      gt(sessions.expiresAt, new Date()),
    ))
    .limit(1);

  if (!record || record.user.suspendedAt || !record.user.emailVerifiedAt) return null;
  const { passwordHash: _passwordHash, ...safeUser } = record.user;
  return safeUser;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Please sign in with a verified account.', 'UNAUTHENTICATED');
  return user;
}

export async function requireRole(...roles: AuthUser['role'][]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new HttpError(403, 'You do not have permission to perform this action.', 'FORBIDDEN');
  return user;
}
