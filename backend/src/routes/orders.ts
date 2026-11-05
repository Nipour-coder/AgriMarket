import { Router, Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { notifications, orderEvents, orderItems, orders, products, sellerProfiles, users } from '../db/schema.js';
import { requireRoleMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

export const ordersRouter = Router();

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

const statusSchema = z.object({
  status: z.enum(['Accepted', 'Rejected', 'Processing', 'Ready for dispatch', 'Cancelled']),
});

// GET /api/orders
ordersRouter.get('/', requireRoleMiddleware('buyer', 'seller', 'admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUuid) {
      res.json([]);
      return;
    }

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

    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders
ordersRouter.post('/', requireRoleMiddleware('buyer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const input = checkoutSchema.parse(req.body);
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

    res.status(201).json({
      id: order.displayId,
      status: order.status,
      subtotal: order.subtotalCents / 100,
      deliveryFee: order.deliveryFeeCents / 100,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
ordersRouter.get('/:id', requireRoleMiddleware('buyer', 'seller', 'admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();
    
    const [row] = await db.select({ order: orders, buyer: users })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.buyerId))
      .where(or(eq(orders.displayId, id), eq(orders.id, id)))
      .limit(1);

    if (!row || (user.role === 'buyer' && row.order.buyerId !== user.id)) {
      res.status(404).json({ error: 'Order not found.' });
      return;
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

    if (!items.length && user.role !== 'admin') {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const history = await db.select({ status: orderEvents.status, timestamp: orderEvents.createdAt })
      .from(orderEvents).where(eq(orderEvents.orderId, row.order.id)).orderBy(asc(orderEvents.createdAt));

    res.json({
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
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id
ordersRouter.patch('/:id', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = statusSchema.parse(req.body);
    const db = getDb();

    const updatedStatus = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(or(eq(orders.displayId, id), eq(orders.id, id))).for('update').limit(1);
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

    res.json({ id, status: updatedStatus });
  } catch (err) {
    next(err);
  }
});
