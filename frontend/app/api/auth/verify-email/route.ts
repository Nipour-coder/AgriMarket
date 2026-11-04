import { and, eq, gt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { createSession, hashToken } from '@backend/auth';
import { getDb } from '@backend/db';
import { emailVerificationTokens, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const { token } = z.object({ token: z.string().min(20).max(200) }).parse(await readJson(request));
    const db = getDb();
    const user = await db.transaction(async (tx) => {
      const [record] = await tx.delete(emailVerificationTokens)
        .where(and(
          eq(emailVerificationTokens.tokenHash, hashToken(token)),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ))
        .returning({ userId: emailVerificationTokens.userId });
      if (!record) return null;
      const [verifiedUser] = await tx.update(users)
        .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, record.userId))
        .returning();
      await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, record.userId));
      return verifiedUser;
    });
    if (!user) return NextResponse.json({ error: 'This verification link is invalid or has expired.' }, { status: 400 });
    await createSession(user.id);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return apiError(error);
  }
}
