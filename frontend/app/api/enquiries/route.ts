import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { enquiries, enquiryMessages, notifications, products, sellerProfiles, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const enquirySchema = z.object({
  productId: z.string().uuid(),
  quantityRequested: z.string().trim().min(1).max(120),
  targetPrice: z.string().trim().max(120).optional(),
  deliveryProvince: z.string().trim().min(2).max(80),
  deliveryAddress: z.string().trim().max(1000).optional(),
  requiredByDate: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(5000),
});

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('buyer', 'seller');
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
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('buyer');
    const input = enquirySchema.parse(await readJson(request));
    const db = getDb();
    const [record] = await db.select({ product: products, status: sellerProfiles.verificationStatus })
      .from(products).innerJoin(sellerProfiles, eq(sellerProfiles.userId, products.sellerId))
      .where(eq(products.id, input.productId)).limit(1);
    if (!record || record.product.status !== 'active' || record.status !== 'Verified') {
      return NextResponse.json({ error: 'This product is not available for enquiries.' }, { status: 404 });
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
    return NextResponse.json(enquiry, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
