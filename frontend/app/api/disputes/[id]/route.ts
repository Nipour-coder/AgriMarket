import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { HttpError, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputeEvidence, disputeMessages, disputes, orderItems, orders, users } from '@backend/db/schema';
import { apiError } from '@backend/http';
import { removeEvidenceObject } from '@backend/storage';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('buyer', 'seller', 'admin');
    const { id } = await context.params;
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
    if (!row) return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    const isAdmin = user.role === 'admin';
    const isParty = row.dispute.reporterId === user.id || row.dispute.respondentId === user.id;
    if (!isAdmin && !isParty) return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });

    const [reporter, respondent, messages, evidence] = await Promise.all([
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, row.dispute.reporterId)).limit(1),
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, row.dispute.respondentId)).limit(1),
      db.select({ message: disputeMessages, senderName: users.name }).from(disputeMessages)
        .innerJoin(users, eq(users.id, disputeMessages.senderId))
        .where(eq(disputeMessages.disputeId, id))
        .orderBy(asc(disputeMessages.createdAt)),
      db.select().from(disputeEvidence).where(and(
        eq(disputeEvidence.disputeId, id),
      )).orderBy(asc(disputeEvidence.createdAt)),
    ]);

    return NextResponse.json({
      ...row.dispute,
      orderDisplayId: row.orderDisplayId,
      productName: row.productName,
      quantity: row.quantity,
      reporter: reporter[0],
      respondent: respondent[0],
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
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id } = await context.params;
    const evidenceId = new URL(request.url).searchParams.get('evidenceId');
    if (!evidenceId) throw new HttpError(400, 'Evidence id is required.');
    const db = getDb();
    const [item] = await db.select({ evidence: disputeEvidence, status: disputes.status }).from(disputeEvidence)
      .innerJoin(disputes, eq(disputes.id, disputeEvidence.disputeId))
      .where(and(
        eq(disputeEvidence.id, evidenceId),
        eq(disputeEvidence.disputeId, id),
        eq(disputeEvidence.uploaderId, user.id),
      )).limit(1);
    if (!item) return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 });
    if (item.status === 'Resolved' || item.status === 'Closed') {
      throw new HttpError(409, 'Evidence cannot be removed after a final decision.');
    }
    await removeEvidenceObject(item.evidence.storageKey);
    await db.delete(disputeEvidence).where(eq(disputeEvidence.id, item.evidence.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
