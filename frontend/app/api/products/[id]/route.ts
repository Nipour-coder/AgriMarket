import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { products, sellerProfiles, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';
import { MOCK_PRODUCTS } from '@/data/mockData';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  category: z.string().trim().min(2).max(120).optional(),
  province: z.string().trim().min(2).max(80).optional(),
  price: z.number().nonnegative().nullable().optional(),
  priceUnit: z.string().trim().min(1).max(80).optional(),
  minimumQuantity: z.number().int().positive().max(1000000).optional(),
  stockQuantity: z.number().int().nonnegative().max(100000000).optional(),
  description: z.string().trim().max(10000).optional(),
  image: z.string().trim().max(2000).optional(),
  availableForDelivery: z.boolean().optional(),
  availableForCollection: z.boolean().optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentUser = await getCurrentUser();
    const rows = await getDb().select({
      product: products,
      seller: users,
      profile: sellerProfiles,
    }).from(products)
      .innerJoin(users, eq(users.id, products.sellerId))
      .innerJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
      .where(eq(products.id, id))
      .limit(1);
    const row = rows[0];
    if (row) {
      const isPublic = row.product.status === 'active' && row.profile.verificationStatus === 'Verified';
      const canView = currentUser?.id === row.product.sellerId || currentUser?.role === 'admin';
      if (isPublic || canView) {
        return NextResponse.json({
          id: row.product.id,
          name: row.product.name,
          slug: row.product.slug,
          category: row.product.category,
          subcategory: row.product.subcategory,
          sellerId: row.product.sellerId,
          seller: {
            id: row.seller.id,
            businessName: row.profile.businessName,
            registrationNumber: row.profile.registrationNumber ?? '',
            isVerified: true,
            verificationBadge: 'Verified Producer',
            province: row.profile.province,
            district: row.seller.city,
            latitude: row.profile.latitude ?? undefined,
            longitude: row.profile.longitude ?? undefined,
            avatar: '',
            rating: 0,
            reviewsCount: 0,
            yearsInOperation: 0,
            primaryCommodities: [row.profile.primarySector],
            certifications: [],
            description: '',
            contactEmail: row.seller.email,
            contactPhone: row.seller.phone,
            address: row.profile.farmAddress,
          },
          province: row.product.province,
          price: row.product.priceCents === null ? null : row.product.priceCents / 100,
          currency: row.product.currency,
          priceUnit: row.product.priceUnit,
          minOrderQuantity: String(row.product.minimumQuantity),
          stockStatus: row.product.stockQuantity > 0 ? row.product.stockStatus : 'Out of Stock',
          availableQuantity: String(row.product.stockQuantity),
          description: row.product.description,
          specifications: row.product.specifications,
          image: row.product.image,
          gallery: row.product.gallery,
          availableForDelivery: row.product.availableForDelivery,
          availableForCollection: row.product.availableForCollection,
          createdAt: row.product.createdAt.toISOString(),
          rating: 0,
          reviewsCount: 0,
        });
      }
    }
  } catch {
    // Database connection failed or not present, fall back to mock data
  }

  // Demonstration product lookup fallback
  const found = MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (found) {
    return NextResponse.json(found);
  }
  return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('seller');
    const { id } = await context.params;
    const input = updateSchema.parse(await readJson(request));
    const [product] = await getDb().select().from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, user.id)))
      .limit(1);
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    const { price, ...rest } = input;
    const [updated] = await getDb().update(products).set({
      ...rest,
      ...(price === undefined ? {} : { priceCents: price === null ? null : Math.round(price * 100) }),
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning();
    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('seller');
    const { id } = await context.params;
    const [product] = await getDb().update(products)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.sellerId, user.id)))
      .returning({ id: products.id });
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    return NextResponse.json({ id: product.id });
  } catch (error) {
    return apiError(error);
  }
}
