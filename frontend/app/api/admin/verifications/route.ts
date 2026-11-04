import { NextResponse } from 'next/server';
import { getApplications } from '@/data/mockVerifications';

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    
    // Try database if present and configured
    try {
      const { requireRole } = await import('@backend/auth');
      const { getDb } = await import('@backend/db');
      const { asc, eq } = await import('drizzle-orm');
      const { sellerProfiles, users } = await import('@backend/db/schema');

      await requireRole('admin');
      const rows = await getDb().select({
        userId: sellerProfiles.userId,
        businessName: sellerProfiles.businessName,
        representativeRole: sellerProfiles.representativeRole,
        registrationNumber: sellerProfiles.registrationNumber,
        farmAddress: sellerProfiles.farmAddress,
        province: sellerProfiles.province,
        primarySector: sellerProfiles.primarySector,
        farmSize: sellerProfiles.farmSize,
        status: sellerProfiles.verificationStatus,
        reason: sellerProfiles.verificationReason,
        submittedAt: sellerProfiles.createdAt,
        contactName: users.name,
        email: users.email,
        phone: users.phone,
        emailVerifiedAt: users.emailVerifiedAt,
      }).from(sellerProfiles)
        .innerJoin(users, eq(users.id, sellerProfiles.userId))
        .orderBy(asc(sellerProfiles.createdAt))
        .limit(200);

      if (rows && rows.length > 0) {
        return NextResponse.json(rows);
      }
    } catch {
      // Backend not running or offline, fall back to rich demonstration verification queue
    }

    const apps = getApplications();
    return NextResponse.json(apps);
  } catch {
    const apps = getApplications();
    return NextResponse.json(apps);
  }
}
