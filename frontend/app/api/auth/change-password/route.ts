import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@backend/db';
import { users } from '@backend/db/schema';
import { readJson } from '@backend/http';

const changePasswordSchema = z.object({
  email: z.string().trim().email().optional(),
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long.'),
});

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const { email, currentPassword, newPassword } = changePasswordSchema.parse(body);

    const targetEmail = (email || 'admin@agrimarket.co.za').toLowerCase();
    const db = getDb();

    // 1. Fetch user from Neon PostgreSQL
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${targetEmail} was not found in the database.` },
        { status: 404 }
      );
    }

    // 2. Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Current password does not match statutory account credentials.' },
        { status: 400 }
      );
    }

    // 3. Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Update password in Neon database
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Neon DB] Password changed successfully for ${user.email} (${user.role})`);

    return NextResponse.json({
      success: true,
      message: 'Administrator password successfully updated in Neon database!',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to change password.' },
      { status: 400 }
    );
  }
}
