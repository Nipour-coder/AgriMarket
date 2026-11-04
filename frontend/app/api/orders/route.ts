import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { orderEvents, orderItems, orders, products, sellerProfiles, users } from '@backend/db/schema';
import { HttpError } from '@backend/auth';
import { apiError, readJson } from '@backend/http';

const checkoutSchema = z.object({
  lines: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().max(1000000),
  })).min(1).max(100),
  address: z.object({
    name: z.string().trim().min(2).max(160),
    phone: z.string().trim().min(7).max(40),
    province: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(120),
    suburb: z.string().trim().max(120).default(''),
    street: z.string().trim().min(3).max(500),
    postalCode: z.string().trim().max(20).default(''),
    instructions: z.string().trim().max(1000).default(''),
  }),
  deliveryMethod: z.enum(['standard', 'express', 'collection', 'scheduled']),
  deliveryDate: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(['Demo online payment', 'Demo instant EFT', 'Payment on collection (demo)']),
});

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('buyer', 'seller', 'admin');
    const db = getDb();
    const orderRows = user.role === 'buyer'
      ? await db.select({ order: orders, buyer: users }).from(orders)
          .innerJoin(users, eq(users.id, orders.buyerId))
          .where(eq(orders.buyerId, user.id))
          .orderBy(desc(orders.createdAt))
          .limit(100)
      : user.role === 'seller'
        ? await db.selectDistinct({ order: orders, buyer: users }).from(orderItems)
          .innerJoin(orders, eq(orders.id, orderItems.orderId))
          .innerJoin(users, eq(users.id, orders.buyerId))
          .where(eq(orderItems.sellerId, user.id))
          .orderBy(desc(orders.createdAt))
          .limit(100)
        : await db.select({ order: orders, buyer: users }).from(orders)
          .innerJoin(users, eq(users.id, orders.buyerId))
          .orderBy(desc(orders.createdAt))
          .limit(100);

    const shaped = await Promise.all(orderRows.map(async ({ order, buyer }) => {
      const items = await db.select({
        orderItemId: orderItems.id,
        productId: orderItems.productId,
        sellerId: orderItems.sellerId,
        name: orderItems.productName,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
        sellerStatus: orderItems.sellerStatus,
      }).from(orderItems).where(user.role === 'seller'
        ? and(eq(orderItems.orderId, order.id), eq(orderItems.sellerId, user.id))
        : eq(orderItems.orderId, order.id));
      const events = await db.select({
        status: orderEvents.status,
        timestamp: orderEvents.createdAt,
      }).from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(orderEvents.createdAt);
      return {
        id: order.displayId,
        createdAt: order.createdAt.toISOString(),
        customer: { name: buyer.name, email: buyer.email, phone: buyer.phone },
        address: order.addressSnapshot,
        delivery: order.deliveryMethod,
        deliveryDate: order.deliveryDate,
        payment: order.paymentMethod,
        lines: items.map((item) => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          sellerId: item.sellerId,
          quantity: item.quantity,
          name: item.name,
          unitPrice: item.unitPriceCents / 100,
          sellerStatus: item.sellerStatus,
        })),
        subtotal: items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0) / 100,
        deliveryFee: order.deliveryFeeCents / 100,
        status: order.status,
        history: events.map((event) => ({ status: event.status, timestamp: event.timestamp.toISOString() })),
      };
    }));
    return NextResponse.json(shaped);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('buyer');
    const input = checkoutSchema.parse(await readJson(request));
    const mergedLines = [...input.lines.reduce((map, line) => map.set(line.productId, (map.get(line.productId) ?? 0) + line.quantity), new Map<string, number>())]
      .map(([productId, quantity]) => ({ productId, quantity }));
    const db = getDb();
    const displayId = `AM-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const order = await db.transaction(async (tx) => {
      const itemRows = await tx.select({ product: products, sellerStatus: sellerProfiles.verificationStatus })
        .from(products)
        .innerJoin(sellerProfiles, eq(sellerProfiles.userId, products.sellerId))
        .where(inArray(products.id, mergedLines.map((line) => line.productId)))
        .for('update');
      if (itemRows.length !== mergedLines.length) throw new HttpError(400, 'One or more products are unavailable.');

      let subtotalCents = 0;
      const records = mergedLines.map((line) => {
        const row = itemRows.find((item) => item.product.id === line.productId);
        if (!row || row.product.status !== 'active' || row.sellerStatus !== 'Verified' || row.product.priceCents === null) {
          throw new HttpError(400, 'One or more products cannot currently be ordered.');
        }
        if (line.quantity < row.product.minimumQuantity || line.quantity > row.product.stockQuantity) {
          throw new HttpError(400, `${row.product.name} does not meet its minimum order or available stock.`);
        }
        subtotalCents += row.product.priceCents * line.quantity;
        return { ...line, product: row.product };
      });
      const sellers = new Set(records.map((record) => record.product.sellerId));
      const sameProvince = records.every((record) => record.product.province === input.address.province);
      const hasSpecialHandling = records.some((record) => ['Livestock', 'Livestock and Animal Products', 'Agricultural Services'].includes(record.product.category));
      if (hasSpecialHandling && input.deliveryMethod !== 'collection') {
        throw new HttpError(400, 'These products are available for collection only.');
      }
      if (input.deliveryMethod === 'express' && !sameProvince) {
        throw new HttpError(400, 'Express delivery is only available within the same province.');
      }
      const feePerSellerCents = input.deliveryMethod === 'collection'
        ? 0
        : input.deliveryMethod === 'express'
          ? 26000
          : input.deliveryMethod === 'scheduled'
            ? 15000
            : sameProvince ? 12000 : 18000;

      const [createdOrder] = await tx.insert(orders).values({
        displayId,
        buyerId: user.id,
        addressSnapshot: input.address,
        deliveryMethod: input.deliveryMethod,
        deliveryDate: input.deliveryDate,
        paymentMethod: input.paymentMethod,
        subtotalCents,
        deliveryFeeCents: feePerSellerCents * sellers.size,
      }).returning();

      for (const record of records) {
        const [updatedStock] = await tx.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${record.quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, record.product.id), sql`${products.stockQuantity} >= ${record.quantity}`))
          .returning({ id: products.id });
        if (!updatedStock) throw new HttpError(409, `${record.product.name} no longer has enough stock.`);
        await tx.insert(orderItems).values({
          orderId: createdOrder.id,
          productId: record.product.id,
          sellerId: record.product.sellerId,
          productName: record.product.name,
          quantity: record.quantity,
          unitPriceCents: record.product.priceCents!,
        });
      }
      await tx.insert(orderEvents).values({ orderId: createdOrder.id, status: 'Order Placed' });
      return createdOrder;
    });

    return NextResponse.json({
      id: order.displayId,
      status: order.status,
      subtotal: order.subtotalCents / 100,
      deliveryFee: order.deliveryFeeCents / 100,
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
