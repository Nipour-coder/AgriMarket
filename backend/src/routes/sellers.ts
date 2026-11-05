import { Router, Request, Response, NextFunction } from 'express';
import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { notifications, products, sellerProfiles, users } from '../db/schema.js';
import { requireRoleMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { MOCK_SELLERS } from '../data/mockData.js';

export const sellersRouter = Router();

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

// GET /api/sellers
sellersRouter.get('/sellers', async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    try {
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
        res.json(records);
        return;
      }
    } catch {
      // Database not reachable, proceed to mock fallback
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
    res.json(demo);
  } catch {
    res.json([]);
  }
});

// GET /api/seller/products
sellersRouter.get('/seller/products', requireRoleMiddleware('seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const records = await getDb().select().from(products)
      .where(eq(products.sellerId, user.id))
      .orderBy(desc(products.createdAt))
      .limit(200);

    res.json(records.map((product) => ({
      ...product,
      price: product.priceCents === null ? null : product.priceCents / 100,
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/seller/verification
sellersRouter.get('/seller/verification', requireRoleMiddleware('seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const [profile] = await getDb().select().from(sellerProfiles)
      .where(eq(sellerProfiles.userId, user.id)).limit(1);
    
    if (!profile) {
      res.status(404).json({ error: 'Seller profile was not found.' });
      return;
    }

    res.json({ profile, user: { name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    next(err);
  }
});

// PUT / POST /api/seller/verification
const handleSaveVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const input = verificationInput.parse(req.body);
    const db = getDb();
    
    const [current] = await db.select().from(sellerProfiles)
      .where(eq(sellerProfiles.userId, user.id)).limit(1);
    
    if (!current) {
      res.status(404).json({ error: 'Seller profile was not found.' });
      return;
    }
    
    if (current.verificationStatus === 'Verified' || current.verificationStatus === 'Suspended') {
      res.status(409).json({ error: 'This profile cannot be changed in its current verification status.' });
      return;
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
      message: 'Your seller profile was submitted for administrator review.',
    });

    res.json({ profile });
  } catch (err) {
    next(err);
  }
};

sellersRouter.put('/seller/verification', requireRoleMiddleware('seller'), handleSaveVerification);
sellersRouter.post('/seller/verification', requireRoleMiddleware('seller'), handleSaveVerification);

