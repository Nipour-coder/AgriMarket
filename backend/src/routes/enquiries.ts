import { Router, Request, Response, NextFunction } from 'express';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { enquiries, enquiryMessages, notifications, products, sellerProfiles, users } from '../db/schema.js';
import { requireRoleMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const enquiriesRouter = Router();

const enquirySchema = z.object({
  productId: z.string().uuid(),
  quantityRequested: z.string().trim().min(1).max(120),
  targetPrice: z.string().trim().max(120).optional(),
  deliveryProvince: z.string().trim().min(2).max(80),
  deliveryAddress: z.string().trim().max(1000).optional(),
  requiredByDate: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(5000),
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  quotePrice: z.string().trim().max(120).optional(),
});

// GET /api/enquiries
enquiriesRouter.get('/', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUuid) {
      res.json([]);
      return;
    }

    const db = getDb();
    const rows = await db.select({
      enquiry: enquiries,
      product: products,
      buyer: users,
      seller: sellerProfiles,
    }).from(enquiries)
      .leftJoin(products, eq(products.id, enquiries.productId))
      .innerJoin(users, eq(users.id, enquiries.buyerId))
      .innerJoin(sellerProfiles, eq(sellerProfiles.userId, enquiries.sellerId))
      .where(user.role === 'buyer' ? eq(enquiries.buyerId, user.id) : eq(enquiries.sellerId, user.id))
      .orderBy(desc(enquiries.createdAt))
      .limit(100);

    const result = await Promise.all(rows.map(async ({ enquiry, product, buyer, seller }) => ({
      id: enquiry.id,
      productId: enquiry.productId,
      productName: product?.name ?? 'Product',
      productImage: product?.image,
      buyerId: enquiry.buyerId,
      buyerName: buyer.name,
      buyerCompany: buyer.companyName ?? '',
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      sellerId: enquiry.sellerId,
      sellerName: seller.businessName,
      quantityRequested: enquiry.quantityRequested,
      targetPrice: enquiry.targetPrice,
      deliveryProvince: enquiry.deliveryProvince,
      deliveryAddress: enquiry.deliveryAddress,
      requiredByDate: enquiry.requiredByDate,
      status: enquiry.status,
      message: enquiry.message,
      createdAt: enquiry.createdAt.toISOString(),
      replies: await db.select({
        id: enquiryMessages.id,
        sender: users.name,
        senderRole: users.role,
        message: enquiryMessages.message,
        quotePrice: enquiryMessages.quotePrice,
        timestamp: enquiryMessages.createdAt,
      }).from(enquiryMessages).innerJoin(users, eq(users.id, enquiryMessages.senderId))
        .where(eq(enquiryMessages.enquiryId, enquiry.id))
        .orderBy(enquiryMessages.createdAt),
    })));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/enquiries
enquiriesRouter.post('/', requireRoleMiddleware('buyer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const input = enquirySchema.parse(req.body);
    const db = getDb();
    
    const [record] = await db.select({ product: products, status: sellerProfiles.verificationStatus })
      .from(products).innerJoin(sellerProfiles, eq(sellerProfiles.userId, products.sellerId))
      .where(eq(products.id, input.productId)).limit(1);

    if (!record || record.product.status !== 'active' || record.status !== 'Verified') {
      res.status(404).json({ error: 'This product is not available for enquiries.' });
      return;
    }

    const [enquiry] = await db.insert(enquiries).values({
      ...input,
      buyerId: user.id,
      sellerId: record.product.sellerId,
    }).returning();

    await db.insert(notifications).values({
      userId: record.product.sellerId,
      message: `A buyer sent an enquiry about ${record.product.name}.`,
    });

    res.status(201).json(enquiry);
  } catch (err) {
    next(err);
  }
});

// GET /api/enquiries/:id
enquiriesRouter.get('/:id', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();
    
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
    if (!enquiry || ![enquiry.buyerId, enquiry.sellerId].includes(user.id)) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }

    res.json(enquiry);
  } catch (err) {
    next(err);
  }
});

// POST /api/enquiries/:id/messages
enquiriesRouter.post('/:id/messages', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const input = messageSchema.parse(req.body);
    const db = getDb();
    
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
    if (!enquiry || ![enquiry.buyerId, enquiry.sellerId].includes(user.id)) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }

    await db.insert(enquiryMessages).values({
      enquiryId: enquiry.id,
      senderId: user.id,
      message: input.message,
      quotePrice: input.quotePrice || null,
    });

    if (user.role === 'seller' && input.quotePrice) {
      await db.update(enquiries).set({ status: 'Quote Received', quotePrice: input.quotePrice, updatedAt: new Date() })
        .where(eq(enquiries.id, enquiry.id));
    } else {
      await db.update(enquiries).set({ status: 'In Negotiation', updatedAt: new Date() })
        .where(eq(enquiries.id, enquiry.id));
    }

    await db.insert(notifications).values({
      userId: user.id === enquiry.buyerId ? enquiry.sellerId : enquiry.buyerId,
      message: 'A new message was added to an enquiry.',
    });

    res.status(201).json({ message: 'Reply sent.' });
  } catch (err) {
    next(err);
  }
});

