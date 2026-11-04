import { randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { hashToken } from '@backend/auth';
import { getDb } from '@backend/db';
import { emailVerificationTokens, users } from '@backend/db/schema';
import { sendVerificationEmail } from '@backend/email';
import { apiError, readJson } from '@backend/http';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const { email } = z.object({ email: z.string().trim().email().max(320) }).parse(await readJson(request));
    const db = getDb();
    const [user] = await db.select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.emailVerifiedAt)))
      .limit(1);

    if (user) {
      const token = randomBytes(32).toString('base64url');
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));
      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      await sendVerificationEmail(user.email, token);
    }

    return NextResponse.json({ message: 'If that account needs verification, a new link has been sent.' });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Email is not configured')) {
      return NextResponse.json({ error: error.message, code: 'EMAIL_NOT_CONFIGURED' }, { status: 503 });
    }
    return apiError(error);
  }
}
