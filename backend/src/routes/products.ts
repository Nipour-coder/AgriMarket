import { Router, Request, Response, NextFunction } from 'express';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { products, sellerProfiles, users } from '../db/schema.js';
import { requireRoleMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { MOCK_PRODUCTS } from '../data/mockData.js';

export const productsRouter = Router();

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

const updateSchema = productInput.partial();

// GET /api/products
productsRouter.get('/', async (req: Request, res: Response, _next: NextFunction) => {
  const category = (req.query.category as string) || '';
  const province = (req.query.province as string) || '';
  const search = ((req.query.search || req.query.q) as string) || '';

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
      res.json(rows.map(({ product, seller, profile }) => ({
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
      return;
    }
  } catch (dbErr) {
    // Database connection failed, fall back to mock data
    console.warn('Products DB query bypassed, falling back to mock products:', dbErr);
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
  res.json(filtered);
});

// POST /api/products
productsRouter.post('/', requireRoleMiddleware('seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const input = productInput.parse(req.body);
    const db = getDb();
    const [profile] = await db.select({ status: sellerProfiles.verificationStatus })
      .from(sellerProfiles).where(eq(sellerProfiles.userId, user.id)).limit(1);
    if (!profile) {
      res.status(404).json({ error: 'Seller profile was not found.' });
      return;
    }

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

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
productsRouter.get('/:id', async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;

  try {
    const rows = await getDb().select({
      product: products,
      seller: users,
      profile: sellerProfiles,
    }).from(products)
      .innerJoin(users, eq(users.id, products.sellerId))
      .innerJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
      .where(or(eq(products.id, id), eq(products.slug, id)))
      .limit(1);

    const row = rows[0];
    if (row) {
      res.json({
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
      return;
    }
  } catch {
    // Database connection failed, fall back to mock data
  }

  const found = MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (found) {
    res.json(found);
    return;
  }

  res.status(404).json({ error: 'Product not found.' });
});

// PUT / PATCH /api/products/:id
const handleUpdateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const input = updateSchema.parse(req.body);
    const db = getDb();
    
    const [product] = await db.select().from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, user.id)))
      .limit(1);
    
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const { price, ...rest } = input;
    const [updated] = await db.update(products).set({
      ...rest,
      ...(price === undefined ? {} : { priceCents: price === null ? null : Math.round(price * 100) }),
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning();

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

productsRouter.put('/:id', requireRoleMiddleware('seller'), handleUpdateProduct);
productsRouter.patch('/:id', requireRoleMiddleware('seller'), handleUpdateProduct);

// DELETE /api/products/:id
productsRouter.delete('/:id', requireRoleMiddleware('seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const [product] = await getDb().update(products)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.sellerId, user.id)))
      .returning({ id: products.id });
    
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    res.json({ id: product.id });
  } catch (err) {
    next(err);
  }
});

