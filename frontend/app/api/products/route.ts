import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { products, sellerProfiles, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';
import { MOCK_PRODUCTS } from '@/data/mockData';

const productInput = z.object({
  name: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(120),
  subcategory: z.string().trim().max(120).optional().default(''),
  province: z.string().trim().min(2).max(80),
  price: z.number().nonnegative().nullable(),
  priceUnit: z.string().trim().min(1).max(80),
  minimumQuantity: z.number().int().positive().max(1000000),
  stockQuantity: z.number().int().nonnegative().max(100000000),
  stockStatus: z.string().trim().min(2).max(80).default('In Stock'),
  description: z.string().trim().max(10000).default(''),
  specifications: z.record(z.string(), z.union([z.string().max(500), z.boolean(), z.array(z.string().max(100)).max(30)])).default({}),
  image: z.string().trim().max(2000).optional().default(''),
  availableForDelivery: z.boolean().default(true),
  availableForCollection: z.boolean().default(true),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const province = url.searchParams.get('province');
  const search = url.searchParams.get('search') || url.searchParams.get('q');

  try {
    const conditions = [
      eq(products.status, 'active'),
      eq(sellerProfiles.verificationStatus, 'Verified'),
    ];
    if (category && category !== 'All') conditions.push(eq(products.category, category));
    if (province && province !== 'All') conditions.push(eq(products.province, province));
    if (search) conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`))!);

    const rows = await getDb().select({
      product: products,
      seller: users,
      profile: sellerProfiles,
    }).from(products)
      .innerJoin(users, eq(users.id, products.sellerId))
      .innerJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(200);

    if (rows && rows.length > 0) {
      return NextResponse.json(rows.map(({ product, seller, profile }) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        subcategory: product.subcategory,
        sellerId: product.sellerId,
        seller: {
          id: seller.id,
          businessName: profile.businessName,
          registrationNumber: profile.registrationNumber ?? '',
          isVerified: true,
          verificationBadge: 'Verified Producer',
          province: profile.province,
          district: seller.city,
          latitude: profile.latitude ?? undefined,
          longitude: profile.longitude ?? undefined,
          avatar: '',
          rating: 0,
          reviewsCount: 0,
          yearsInOperation: 0,
          primaryCommodities: [profile.primarySector],
          certifications: [],
          description: '',
          contactEmail: seller.email,
          contactPhone: seller.phone,
          address: profile.farmAddress,
        },
        province: product.province,
        price: product.priceCents === null ? null : product.priceCents / 100,
        currency: product.currency,
        priceUnit: product.priceUnit,
        minOrderQuantity: String(product.minimumQuantity),
        stockStatus: product.stockQuantity > 0 ? product.stockStatus : 'Out of Stock',
        availableQuantity: String(product.stockQuantity),
        description: product.description,
        specifications: product.specifications,
        image: product.image,
        gallery: product.gallery,
        availableForDelivery: product.availableForDelivery,
        availableForCollection: product.availableForCollection,
        createdAt: product.createdAt.toISOString(),
        rating: 0,
        reviewsCount: 0,
      })));
    }
  } catch {
    // Database connection not available, fall back to synthetic demonstration data
  }

  // Fallback to MOCK_PRODUCTS demonstration data
  let filtered = [...MOCK_PRODUCTS];
  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (province && province !== 'All') {
    filtered = filtered.filter(p => p.province?.toLowerCase() === province.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
  }
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('seller');
    const input = productInput.parse(await readJson(request));
    const db = getDb();
    const [profile] = await db.select({ status: sellerProfiles.verificationStatus })
      .from(sellerProfiles).where(eq(sellerProfiles.userId, user.id)).limit(1);
    if (!profile) return NextResponse.json({ error: 'Seller profile was not found.' }, { status: 404 });

    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
    const [product] = await db.insert(products).values({
      sellerId: user.id,
      name: input.name,
      slug,
      category: input.category,
      subcategory: input.subcategory,
      province: input.province,
      priceCents: input.price === null ? null : Math.round(input.price * 100),
      priceUnit: input.priceUnit,
      minimumQuantity: input.minimumQuantity,
      stockQuantity: input.stockQuantity,
      stockStatus: input.stockStatus,
      description: input.description,
      specifications: input.specifications,
      image: input.image,
      availableForDelivery: input.availableForDelivery,
      availableForCollection: input.availableForCollection,
      status: profile.status === 'Verified' ? 'active' : 'draft',
    }).returning();
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
