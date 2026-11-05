import { Router, Request, Response, NextFunction } from 'express';
import { and, asc, count, desc, eq, notInArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { disputeEvidence, disputeMessages, disputes, notifications, orderItems, orders, users } from '../db/schema.js';
import { requireRoleMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  createEvidenceDownload,
  createEvidenceUpload,
  evidenceObjectKey,
  isAllowedEvidenceType,
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_FILES,
  newEvidenceId,
  removeEvidenceObject,
  verifyEvidenceObject,
} from '../services/storage.js';

export const disputesRouter = Router();

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

const messageSchema = z.object({
  message: z.string().trim().min(1).max(3000),
});

const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_EVIDENCE_BYTES),
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

// GET /api/disputes
disputesRouter.get('/', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUuid) {
      res.json([]);
      return;
    }

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

    res.json(rows.map(({ dispute, ...rest }) => ({
      ...dispute,
      ...rest,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    next(err);
  }
});

// POST /api/disputes
disputesRouter.post('/', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const input = createSchema.parse(req.body);
    const categories = user.role === 'buyer' ? buyerCategories : sellerCategories;
    
    if (!categories.has(input.category)) {
      res.status(400).json({ error: 'Choose a complaint reason available to your account type.' });
      return;
    }

    const db = getDb();
    const [order] = await db.select().from(orders).where(or(eq(orders.displayId, input.orderId), eq(orders.id, input.orderId))).limit(1);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const buyerId = order.buyerId;
    const [sellerItem] = await db.select({ id: orderItems.id, sellerId: orderItems.sellerId }).from(orderItems).where(and(
      eq(orderItems.orderId, order.id),
      eq(orderItems.id, input.orderItemId),
    )).limit(1);

    if (!sellerItem || (user.role === 'buyer' && order.buyerId !== user.id)
      || (user.role === 'seller' && sellerItem.sellerId !== user.id)) {
      res.status(403).json({ error: 'This order or seller is not linked to your account.' });
      return;
    }

    const sellerId = sellerItem.sellerId;
    if (['Cancelled', 'Rejected'].includes(order.status)) {
      res.status(409).json({ error: 'A complaint cannot be opened for a cancelled or rejected order.' });
      return;
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

    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/disputes/:id
disputesRouter.get('/:id', requireRoleMiddleware('buyer', 'seller', 'admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();
    
    const [row] = await db.select({
      dispute: disputes,
      orderDisplayId: orders.displayId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
    })
      .from(disputes)
      .innerJoin(orders, eq(orders.id, disputes.orderId))
      .innerJoin(orderItems, eq(orderItems.id, disputes.orderItemId))
      .where(eq(disputes.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    const isAdmin = user.role === 'admin';
    const isParty = row.dispute.reporterId === user.id || row.dispute.respondentId === user.id;
    if (!isAdmin && !isParty) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    const [reporterUser, respondentUser, messages, evidence] = await Promise.all([
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, row.dispute.reporterId)).limit(1),
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, row.dispute.respondentId)).limit(1),
      db.select({ message: disputeMessages, senderName: users.name }).from(disputeMessages)
        .innerJoin(users, eq(users.id, disputeMessages.senderId))
        .where(eq(disputeMessages.disputeId, id))
        .orderBy(asc(disputeMessages.createdAt)),
      db.select().from(disputeEvidence).where(eq(disputeEvidence.disputeId, id)).orderBy(asc(disputeEvidence.createdAt)),
    ]);

    res.json({
      ...row.dispute,
      orderDisplayId: row.orderDisplayId,
      productName: row.productName,
      quantity: row.quantity,
      reporter: reporterUser[0],
      respondent: respondentUser[0],
      messages: messages.map(({ message, senderName }) => ({
        id: message.id,
        senderId: message.senderId,
        senderName,
        message: message.message,
        createdAt: message.createdAt.toISOString(),
      })),
      evidence: evidence.filter((item) => item.uploadedAt).map((item) => ({
        id: item.id,
        fileName: item.fileName,
        contentType: item.contentType,
        sizeBytes: item.sizeBytes,
        uploaderId: item.uploaderId,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/disputes/:id (delete pending evidence via query param ?evidenceId=...)
disputesRouter.delete('/:id', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const evidenceId = req.query.evidenceId as string;
    
    if (!evidenceId) throw new HttpError(400, 'Evidence id is required.');
    const db = getDb();
    
    const [item] = await db.select({ evidence: disputeEvidence, status: disputes.status }).from(disputeEvidence)
      .innerJoin(disputes, eq(disputes.id, disputeEvidence.disputeId))
      .where(and(
        eq(disputeEvidence.id, evidenceId),
        eq(disputeEvidence.disputeId, id),
        eq(disputeEvidence.uploaderId, user.id),
      )).limit(1);

    if (!item) {
      res.status(404).json({ error: 'Evidence not found.' });
      return;
    }

    if (item.status === 'Resolved' || item.status === 'Closed') {
      throw new HttpError(409, 'Evidence cannot be removed after a final decision.');
    }

    await removeEvidenceObject(item.evidence.storageKey);
    await db.delete(disputeEvidence).where(eq(disputeEvidence.id, item.evidence.id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/disputes/:id/messages
disputesRouter.post('/:id/messages', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { message } = messageSchema.parse(req.body);
    const db = getDb();
    
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    if (!dispute || (dispute.reporterId !== user.id && dispute.respondentId !== user.id)) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    if (dispute.status === 'Resolved' || dispute.status === 'Closed') {
      throw new HttpError(409, 'This complaint is closed and cannot receive further replies.');
    }

    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(disputes).where(eq(disputes.id, id)).for('update').limit(1);
      if (!current || current.status === 'Resolved' || current.status === 'Closed') {
        throw new HttpError(409, 'This complaint is closed and cannot receive further replies.');
      }
      await tx.insert(disputeMessages).values({ disputeId: id, senderId: user.id, message });
      await tx.update(disputes).set({
        status: current.status === 'Open' ? 'Responded' : current.status,
        updatedAt: new Date(),
      }).where(eq(disputes.id, id));
      await tx.insert(notifications).values({
        userId: user.id === dispute.reporterId ? dispute.respondentId : dispute.reporterId,
        message: `A new reply was added to an order complaint.`,
      });
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/disputes/:id/evidence
disputesRouter.post('/:id/evidence', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const input = uploadSchema.parse(req.body);
    
    if (!isAllowedEvidenceType(input.contentType)) {
      throw new HttpError(400, 'Evidence must be a JPEG, PNG, WebP image or MP4, MOV, WebM video.');
    }

    const db = getDb();
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    if (!dispute || (dispute.reporterId !== user.id && dispute.respondentId !== user.id)) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    if (dispute.status === 'Resolved' || dispute.status === 'Closed') {
      throw new HttpError(409, 'This complaint is closed and cannot accept more evidence.');
    }

    const evidenceId = newEvidenceId();
    const key = evidenceObjectKey(id, evidenceId);

    const reservation = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: disputes.id, status: disputes.status })
        .from(disputes).where(eq(disputes.id, id)).for('update').limit(1);
      if (!current || current.status === 'Resolved' || current.status === 'Closed') {
        throw new HttpError(409, 'This complaint is closed and cannot accept more evidence.');
      }
      const [{ value: existingCount }] = await tx.select({ value: count() })
        .from(disputeEvidence).where(eq(disputeEvidence.disputeId, id));
      if (existingCount >= MAX_EVIDENCE_FILES) {
        throw new HttpError(400, `A complaint can include at most ${MAX_EVIDENCE_FILES} evidence files.`);
      }
      const [created] = await tx.insert(disputeEvidence).values({
        id: evidenceId,
        disputeId: id,
        uploaderId: user.id,
        storageKey: key,
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
      }).returning({ id: disputeEvidence.id });
      return created;
    });

    let upload;
    try {
      upload = await createEvidenceUpload(id, evidenceId, input.contentType);
    } catch (error) {
      await db.delete(disputeEvidence).where(eq(disputeEvidence.id, reservation.id));
      throw error;
    }

    res.status(201).json({ id: reservation.id, url: upload.url, fields: upload.fields });
  } catch (err) {
    next(err);
  }
});

// POST /api/disputes/:id/evidence/:evidenceId (confirm upload)
disputesRouter.post('/:id/evidence/:evidenceId', requireRoleMiddleware('buyer', 'seller'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id, evidenceId } = req.params;
    const db = getDb();
    
    const [item] = await db.select({ evidence: disputeEvidence, dispute: disputes })
      .from(disputeEvidence)
      .innerJoin(disputes, eq(disputes.id, disputeEvidence.disputeId))
      .where(and(eq(disputeEvidence.id, evidenceId), eq(disputeEvidence.disputeId, id)))
      .limit(1);

    if (!item || item.evidence.uploaderId !== user.id
      || (item.dispute.reporterId !== user.id && item.dispute.respondentId !== user.id)) {
      res.status(404).json({ error: 'Evidence upload not found.' });
      return;
    }

    if (item.dispute.status === 'Resolved' || item.dispute.status === 'Closed') {
      res.status(409).json({ error: 'This complaint is closed and cannot accept evidence.' });
      return;
    }

    if (item.evidence.uploadedAt) {
      res.json({ ok: true });
      return;
    }

    const size = await verifyEvidenceObject(item.evidence.storageKey, item.evidence.contentType, item.evidence.sizeBytes);
    await db.transaction(async (tx) => {
      const [current] = await tx.select({ status: disputes.status }).from(disputes)
        .where(eq(disputes.id, id)).for('update').limit(1);
      if (!current || current.status === 'Resolved' || current.status === 'Closed') {
        throw new HttpError(409, 'This complaint is closed and cannot accept evidence.');
      }
      await tx.update(disputeEvidence).set({ uploadedAt: new Date(), sizeBytes: size })
        .where(eq(disputeEvidence.id, evidenceId));
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/disputes/:id/evidence/:evidenceId (download evidence)
disputesRouter.get('/:id/evidence/:evidenceId', requireRoleMiddleware('buyer', 'seller', 'admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id, evidenceId } = req.params;
    const [item] = await getDb().select({ evidence: disputeEvidence, dispute: disputes })
      .from(disputeEvidence)
      .innerJoin(disputes, eq(disputes.id, disputeEvidence.disputeId))
      .where(and(eq(disputeEvidence.id, evidenceId), eq(disputeEvidence.disputeId, id)))
      .limit(1);

    if (!item || !item.evidence.uploadedAt) {
      res.status(404).json({ error: 'Evidence not found.' });
      return;
    }

    if (user.role !== 'admin' && item.dispute.reporterId !== user.id && item.dispute.respondentId !== user.id) {
      res.status(404).json({ error: 'Evidence not found.' });
      return;
    }

    const downloadUrl = await createEvidenceDownload(item.evidence.storageKey);
    res.redirect(downloadUrl);
  } catch (err) {
    next(err);
  }
});

