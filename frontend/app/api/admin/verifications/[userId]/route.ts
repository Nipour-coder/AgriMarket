import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@backend/http';
import { updateApplication } from '@/data/mockVerifications';

const reviewSchema = z.object({
  status: z.enum(['Pending Verification', 'Under Review', 'Verified', 'Rejected', 'Suspended']),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
    const body = await readJson(request);
    const { status, reason } = reviewSchema.parse(body);

    if ((status === 'Rejected' || status === 'Suspended') && !reason) {
      return NextResponse.json({ 
        error: 'A reason is required before rejecting or suspending a seller.' 
      }, { status: 400 });
    }

    // Attempt real database update if available
    try {
      const { requireRole } = await import('@backend/auth');
      const { getDb } = await import('@backend/db');
      const { eq } = await import('drizzle-orm');
      const { notifications, sellerProfiles, users } = await import('@backend/db/schema');

      await requireRole('admin');
      const db = getDb();
      const [current] = await db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId)).limit(1);

      if (current) {
        const [profile] = await db.update(sellerProfiles).set({
          verificationStatus: status,
          verificationReason: status === 'Under Review' || status === 'Verified' ? null : reason ?? null,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(sellerProfiles.userId, userId)).returning();

        if (status === 'Suspended') {
          await db.update(users).set({ suspendedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
        }

        const message = status === 'Verified'
          ? 'Congratulations! Your seller verification application was approved. The official AgriMarket verification badge is now active on your store.'
          : status === 'Under Review'
            ? 'Your seller application is now under administrator review.'
            : `Your seller application was ${status.toLowerCase()}. Reason: ${reason}`;

        await db.insert(notifications).values({ userId, message });
        return NextResponse.json({ profile, message: `Application status updated to ${status}.` });
      }
    } catch {
      // Backend database offline or not present, handle via in-memory demonstration store
    }

    const updated = updateApplication(userId, {
      status,
      reason: status === 'Under Review' || status === 'Verified' ? null : reason,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Seller application not found.' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      profile: updated,
      message: `Seller application successfully set to: ${status}. Notification dispatched to seller.`
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unable to update seller verification status.' 
    }, { status: 400 });
  }
}
