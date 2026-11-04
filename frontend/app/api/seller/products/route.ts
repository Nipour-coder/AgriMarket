import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { products } from '@backend/db/schema';
import { apiError } from '@backend/http';

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('seller');
    const records = await getDb().select().from(products)
      .where(eq(products.sellerId, user.id))
      .orderBy(desc(products.createdAt))
      .limit(200);
    return NextResponse.json(records.map((product) => ({
      ...product,
      price: product.priceCents === null ? null : product.priceCents / 100,
    })));
  } catch (error) {
    return apiError(error);
  }
}
