import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { HttpError } from './errorHandler.js';

export const SESSION_COOKIE = 'agrimarket_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type AuthUser = Omit<typeof users.$inferSelect, 'passwordHash'>;

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE] || req.cookies?.session_token;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export async function createSession(userId: string, res?: Response): Promise<{ token: string; expiresAt: Date }> {
  const db = getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  
  if (res) {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: expiresAt,
    });
  }

  return { token, expiresAt };
}

export async function clearSession(req: Request, res: Response): Promise<void> {
  const token = extractToken(req);
  if (token) {
    try {
      const db = getDb();
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
    } catch (e) {
      console.warn('Could not remove session from database:', e);
    }
  }

  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie('session_token', { path: '/' });
  res.clearCookie('agrimarket_demo_role', { path: '/' });
}

export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  const token = extractToken(req);
  
  if (token) {
    try {
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

      if (record && !record.user.suspendedAt && record.user.emailVerifiedAt) {
        const { passwordHash: _passwordHash, ...safeUser } = record.user;
        return safeUser;
      }
    } catch (e) {
      console.warn('Database error while finding current user:', e);
    }
  }

  // Demo fallback mode based on cookie
  const demoRole = req.cookies?.agrimarket_demo_role;
  if (demoRole === 'admin') {
    return {
      id: 'admin-1',
      name: 'AgriMarket Administrator',
      email: 'admin@agrimarket.co.za',
      role: 'admin',
      phone: '+27 (0)11 555 0100',
      city: 'Johannesburg',
      province: 'Gauteng',
      companyName: null,
      emailVerifiedAt: new Date(),
      suspendedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else if (demoRole === 'seller') {
    return {
      id: 'seller-1',
      name: 'Valley Green Agri Cooperative',
      email: 'seller@agrimarket.co.za',
      role: 'seller',
      phone: '+27 (0)15 516 4320',
      city: 'Levubu',
      province: 'Limpopo',
      companyName: 'Valley Green Agri Cooperative',
      emailVerifiedAt: new Date(),
      suspendedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else if (demoRole === 'buyer') {
    return {
      id: 'buyer-1',
      name: 'Commercial Wholesale Buyer',
      email: 'buyer@agrimarket.co.za',
      role: 'buyer',
      phone: '+27 (0)11 992 4000',
      city: 'Centurion',
      province: 'Gauteng',
      companyName: 'FreshMark Wholesale',
      emailVerifiedAt: new Date(),
      suspendedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return null;
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new HttpError(401, 'Please sign in with a verified account.', 'UNAUTHENTICATED');
  }
  return user;
}

export function requireRoleMiddleware(...roles: AuthUser['role'][]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const user = await requireUser(req);
      if (!roles.includes(user.role)) {
        throw new HttpError(403, 'You do not have permission to perform this action.', 'FORBIDDEN');
      }
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

