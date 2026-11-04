import { NextResponse } from 'next/server';
import { MOCK_SELLERS } from '@/data/mockData';

export async function GET() {
  try {
    try {
      const { getDb } = await import('@backend/db');
      const { count, desc, eq } = await import('drizzle-orm');
      const { products, sellerProfiles, users } = await import('@backend/db/schema');
      
      const records = await getDb().select({
        id: users.id,
        businessName: sellerProfiles.businessName,
        province: sellerProfiles.province,
        district: users.city,
        address: sellerProfiles.farmAddress,
        sector: sellerProfiles.primarySector,
        productCount: count(products.id),
      }).from(sellerProfiles)
        .innerJoin(users, eq(users.id, sellerProfiles.userId))
        .leftJoin(products, eq(products.sellerId, users.id))
        .where(eq(sellerProfiles.verificationStatus, 'Verified'))
        .groupBy(users.id, sellerProfiles.businessName, sellerProfiles.province, users.city, sellerProfiles.farmAddress, sellerProfiles.primarySector)
        .orderBy(desc(count(products.id)))
        .limit(12);

      if (records && records.length > 0) {
        return NextResponse.json(records);
      }
    } catch {
      // Database not reachable, proceed to synthetic demonstration data fallback
    }

    const demo = MOCK_SELLERS.map((s) => ({
      id: s.id,
      businessName: s.businessName,
      province: s.province,
      district: s.district || s.address,
      address: s.address,
      sector: s.primaryCommodities?.join(', ') || s.description || 'Agriculture',
      productCount: s.reviewsCount || 6,
    }));
    return NextResponse.json(demo);
  } catch {
    return NextResponse.json([]);
  }
}
