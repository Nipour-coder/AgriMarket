import { and, desc, eq, notInArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HttpError, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputes, notifications, orderItems, orders, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const createSchema = z.object({
  orderId: z.string().min(1).max(40),
  orderItemId: z.string().uuid(),
  category: z.enum([
    'Damaged product',
    'Quality not as described',
    'Wrong product',
    'Incorrect quantity',
    'Order not delivered',
    'False non-delivery claim',
    'Misleading evidence',
    'Product damaged after delivery',
    'Repeated refund abuse',
    'Refused delivery or collection',
    'Other',
  ]),
  description: z.string().trim().min(20).max(5000),
});

const reporter = alias(users, 'dispute_reporter');
const respondent = alias(users, 'dispute_respondent');
const buyerCategories = new Set([
  'Damaged product',
  'Quality not as described',
  'Wrong product',
  'Incorrect quantity',
  'Order not delivered',
  'Other',
]);
const sellerCategories = new Set([
  'False non-delivery claim',
  'Misleading evidence',
  'Product damaged after delivery',
  'Repeated refund abuse',
  'Refused delivery or collection',
  'Other',
]);

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('buyer', 'seller');
    const rows = await getDb().select({
      dispute: disputes,
      orderDisplayId: orders.displayId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      reporterName: reporter.name,
      respondentName: respondent.name,
    }).from(disputes)
      .innerJoin(orders, eq(orders.id, disputes.orderId))
      .innerJoin(orderItems, eq(orderItems.id, disputes.orderItemId))
      .innerJoin(reporter, eq(reporter.id, disputes.reporterId))
      .innerJoin(respondent, eq(respondent.id, disputes.respondentId))
      .where(or(eq(disputes.reporterId, user.id), eq(disputes.respondentId, user.id)))
      .orderBy(desc(disputes.updatedAt))
      .limit(100);
    return NextResponse.json(rows.map(({ dispute, ...rest }) => ({
      ...dispute,
      ...rest,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
    })));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('buyer', 'seller');
    const input = createSchema.parse(await readJson(request));
    const categories = user.role === 'buyer' ? buyerCategories : sellerCategories;
    if (!categories.has(input.category)) {
      return NextResponse.json({ error: 'Choose a complaint reason available to your account type.' }, { status: 400 });
    }
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.displayId, input.orderId)).limit(1);
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const buyerId = order.buyerId;
    const [sellerItem] = await db.select({ id: orderItems.id, sellerId: orderItems.sellerId }).from(orderItems).where(and(
      eq(orderItems.orderId, order.id),
      eq(orderItems.id, input.orderItemId),
    )).limit(1);
    if (!sellerItem || (user.role === 'buyer' && order.buyerId !== user.id)
      || (user.role === 'seller' && sellerItem.sellerId !== user.id)) {
      return NextResponse.json({ error: 'This order or seller is not linked to your account.' }, { status: 403 });
    }
    const sellerId = sellerItem.sellerId;
    if (['Cancelled', 'Rejected'].includes(order.status)) {
      return NextResponse.json({ error: 'A complaint cannot be opened for a cancelled or rejected order.' }, { status: 409 });
    }
    const reporterId = user.id;
    const respondentId = user.role === 'buyer' ? sellerId : buyerId;
    const created = await db.transaction(async (tx) => {
      const [currentOrder] = await tx.select({ id: orders.id, status: orders.status })
        .from(orders).where(eq(orders.id, order.id)).for('update').limit(1);
      if (!currentOrder) throw new HttpError(404, 'Order not found.');
      if (['Cancelled', 'Rejected'].includes(currentOrder.status)) {
        throw new HttpError(409, 'A complaint cannot be opened for a cancelled or rejected order.');
      }
      const [active] = await tx.select({ id: disputes.id }).from(disputes).where(and(
        eq(disputes.orderId, order.id),
        eq(disputes.buyerId, buyerId),
        eq(disputes.sellerId, sellerId),
        notInArray(disputes.status, ['Resolved', 'Closed']),
      )).limit(1);
      if (active) {
        throw new HttpError(409, 'There is already an open complaint for this seller and order.');
      }
      const [record] = await tx.insert(disputes).values({
        orderId: order.id,
        orderItemId: sellerItem.id,
        buyerId,
        sellerId,
        reporterId,
        respondentId,
        direction: user.role === 'buyer' ? 'buyer_to_seller' : 'seller_to_buyer',
        category: input.category,
        description: input.description,
      }).returning({ id: disputes.id });
      await tx.insert(notifications).values({
        userId: respondentId,
        message: `A new order complaint has been opened for ${order.displayId}. Please review and respond.`,
      });
      return record;
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
