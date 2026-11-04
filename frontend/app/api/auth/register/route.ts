import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@backend/db';
import { emailVerificationTokens, sellerProfiles, users } from '@backend/db/schema';
import { hashToken } from '@backend/auth';
import { sendVerificationEmail } from '@backend/email';
import { apiError, readJson } from '@backend/http';
import { HttpError } from '@backend/auth';

const registrationSchema = z.object({
  accountType: z.enum(['buyer', 'seller']),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128).refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be 72 bytes or fewer.',
  ),
  phone: z.string().trim().min(7).max(40),
  province: z.string().trim().min(2).max(80),
  city: z.string().trim().max(120).optional().default(''),
  buyerCompany: z.string().trim().max(200).optional(),
  businessName: z.string().trim().min(2).max(200).optional(),
  registrationNumber: z.string().trim().max(120).optional(),
  farmAddress: z.string().trim().max(1000).optional(),
  primarySector: z.string().trim().max(120).optional(),
  farmSize: z.string().trim().max(120).optional(),
}).superRefine((data, context) => {
  if (data.accountType === 'seller') {
    for (const field of ['businessName', 'farmAddress', 'primarySector'] as const) {
      if (!data[field]) context.addIssue({ code: 'custom', path: [field], message: 'This field is required for seller accounts.' });
    }
  }
});

export async function POST(request: Request) {
  try {
    const body = registrationSchema.parse(await readJson(request));
    const email = body.email.toLowerCase();
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.APP_URL) {
      return NextResponse.json({
        error: 'Email verification is not configured. Set RESEND_API_KEY, EMAIL_FROM and APP_URL before creating accounts.',
        code: 'EMAIL_NOT_CONFIGURED',
      }, { status: 503 });
    }
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
    const role = adminEmails.includes(email) ? 'admin' : body.accountType;
    const passwordHash = await bcrypt.hash(body.password, 12);
    const db = getDb();
    const token = randomBytes(32).toString('base64url');
    const user = await db.transaction(async (tx) => {
      const [createdUser] = await tx.insert(users).values({
        name: body.name,
        email,
        passwordHash,
        role,
        phone: body.phone,
        province: body.province,
        city: body.city,
        companyName: body.accountType === 'seller' ? body.businessName : body.buyerCompany,
      }).returning();

      if (role === 'seller') {
        await tx.insert(sellerProfiles).values({
          userId: createdUser.id,
          businessName: body.businessName!,
          registrationNumber: body.registrationNumber || null,
          farmAddress: body.farmAddress!,
          province: body.province,
          primarySector: body.primarySector!,
          farmSize: body.farmSize || null,
        });
      }

      await tx.insert(emailVerificationTokens).values({
        userId: createdUser.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      return createdUser;
    });

    try {
      await sendVerificationEmail(email, token);
    } catch (error) {
      console.error('Verification email delivery failed after account creation', error);
      return NextResponse.json({
        error: 'Your account was created, but the verification email could not be sent. Please request a new email.',
        code: 'VERIFICATION_EMAIL_FAILED',
      }, { status: 503 });
    }

    return NextResponse.json({
      message: 'Account created. Check your email to verify your address before signing in.',
    }, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith('Email is not configured')) {
      return NextResponse.json({ error: error.message, code: 'EMAIL_NOT_CONFIGURED' }, { status: 503 });
    }
    return apiError(error);
  }
}
