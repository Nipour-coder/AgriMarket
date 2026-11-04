import { and, asc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { notifications, orderEvents, orderItems, orders, products, users } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';
import { HttpError } from '@backend/auth';

const statusSchema = z.object({
  status: z.enum(['Accepted', 'Rejected', 'Processing', 'Ready for dispatch', 'Cancelled']),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id } = await context.params;
    const db = getDb();
    const [row] = await db.select({ order: orders, buyer: users })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.buyerId))
      .where(eq(orders.displayId, id))
      .limit(1);
    if (!row || (user.role === 'buyer' && row.order.buyerId !== user.id)) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const items = await db.select({
      orderItemId: orderItems.id,
      productId: orderItems.productId,
      sellerId: orderItems.sellerId,
      name: orderItems.productName,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      sellerStatus: orderItems.sellerStatus,
    }).from(orderItems).where(user.role === 'seller'
      ? and(eq(orderItems.orderId, row.order.id), eq(orderItems.sellerId, user.id))
      : eq(orderItems.orderId, row.order.id));
    if (!items.length) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    const history = await db.select({ status: orderEvents.status, timestamp: orderEvents.createdAt })
      .from(orderEvents).where(eq(orderEvents.orderId, row.order.id)).orderBy(asc(orderEvents.createdAt));
    return NextResponse.json({
      id: row.order.displayId,
      createdAt: row.order.createdAt.toISOString(),
      customer: { name: row.buyer.name, email: row.buyer.email, phone: row.buyer.phone },
      address: row.order.addressSnapshot,
      delivery: row.order.deliveryMethod,
      deliveryDate: row.order.deliveryDate,
      payment: row.order.paymentMethod,
      lines: items.map((item) => ({
        productId: item.productId,
        orderItemId: item.orderItemId,
        sellerId: item.sellerId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents / 100,
        sellerStatus: item.sellerStatus,
      })),
      subtotal: items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0) / 100,
      deliveryFee: row.order.deliveryFeeCents / 100,
      status: row.order.status,
      history: history.map((event) => ({ status: event.status, timestamp: event.timestamp.toISOString() })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id } = await context.params;
    const { status } = statusSchema.parse(await readJson(request));
    const db = getDb();
    const updatedStatus = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.displayId, id)).for('update').limit(1);
      if (!order) throw new HttpError(404, 'Order not found.');

      if (user.role === 'buyer') {
        if (order.buyerId !== user.id || status !== 'Cancelled') throw new HttpError(403, 'You cannot update this order.');
        if (!['Order Placed', 'Seller Processing Order'].includes(order.status)) {
          throw new HttpError(409, 'This order can no longer be cancelled.');
        }
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        for (const item of items) {
          await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
            .where(eq(products.id, item.productId));
        }
        await tx.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(orderEvents).values({ orderId: order.id, status });
        return status;
      }

      if (status === 'Cancelled') throw new HttpError(400, 'Sellers cannot cancel buyer orders through this action.');
      const sellerItems = await tx.select().from(orderItems).where(and(
        eq(orderItems.orderId, order.id),
        eq(orderItems.sellerId, user.id),
      ));
      if (!sellerItems.length) throw new HttpError(403, 'This order does not belong to your store.');
      const currentStatuses = sellerItems.map((item) => item.sellerStatus);
      const allowed = status === 'Accepted' || status === 'Rejected'
        ? currentStatuses.every((item) => item === 'Pending')
        : status === 'Processing'
          ? currentStatuses.every((item) => ['Accepted', 'Processing'].includes(item)) && currentStatuses.includes('Accepted')
          : currentStatuses.every((item) => item === 'Processing');
      if (!allowed) throw new HttpError(409, 'This order status transition is not allowed.');

      await tx.update(orderItems).set({ sellerStatus: status }).where(and(
        eq(orderItems.orderId, order.id),
        eq(orderItems.sellerId, user.id),
      ));
      if (status === 'Rejected') {
        for (const item of sellerItems) {
          await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
            .where(eq(products.id, item.productId));
        }
      }
      const allItems = await tx.select({ status: orderItems.sellerStatus }).from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      const statuses = allItems.map((item) => item.status);
      const orderStatus = statuses.every((item) => item === 'Rejected')
        ? 'Rejected'
        : statuses.every((item) => ['Ready for dispatch', 'Rejected'].includes(item))
          ? 'Ready for Collection or Dispatched'
          : statuses.some((item) => item !== 'Pending')
            ? 'Seller Processing Order'
            : order.status;
      if (orderStatus !== order.status) {
        await tx.update(orders).set({ status: orderStatus, updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(orderEvents).values({ orderId: order.id, status: orderStatus });
        await tx.insert(notifications).values({ userId: order.buyerId, message: `Order ${order.displayId} status updated to ${orderStatus}.` });
      }
      return orderStatus;
    });
    return NextResponse.json({ id, status: updatedStatus });
  } catch (error) {
    return apiError(error);
  }
}
