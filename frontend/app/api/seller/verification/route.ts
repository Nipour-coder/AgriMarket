import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { notifications, sellerProfiles, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const verificationInput = z.object({
  businessName: z.string().trim().min(2).max(200),
  representativeRole: z.string().trim().min(2).max(120),
  registrationNumber: z.string().trim().max(120).optional(),
  farmAddress: z.string().trim().min(5).max(1000),
  province: z.string().trim().min(2).max(80),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  primarySector: z.string().trim().min(2).max(120),
  farmSize: z.string().trim().max(120).optional(),
});

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('seller');
    const [profile] = await getDb().select().from(sellerProfiles)
      .where(eq(sellerProfiles.userId, user.id)).limit(1);
    if (!profile) return NextResponse.json({ error: 'Seller profile was not found.' }, { status: 404 });
    return NextResponse.json({ profile, user: { name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole('seller');
    const input = verificationInput.parse(await readJson(request));
    const db = getDb();
    const [current] = await db.select().from(sellerProfiles)
      .where(eq(sellerProfiles.userId, user.id)).limit(1);
    if (!current) return NextResponse.json({ error: 'Seller profile was not found.' }, { status: 404 });
    if (current.verificationStatus === 'Verified' || current.verificationStatus === 'Suspended') {
      return NextResponse.json({ error: 'This profile cannot be changed in its current verification status.' }, { status: 409 });
    }

    const [profile] = await db.update(sellerProfiles).set({
      ...input,
      registrationNumber: input.registrationNumber || null,
      farmSize: input.farmSize || null,
      verificationStatus: 'Pending Verification',
      verificationReason: null,
      updatedAt: new Date(),
    }).where(eq(sellerProfiles.userId, user.id)).returning();

    await db.insert(notifications).values({
      userId: user.id,
      message: 'Your seller profile was submitted for administrator review. Secure document uploads are not yet enabled.',
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return apiError(error);
  }
}
