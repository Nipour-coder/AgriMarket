import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HttpError, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputeMessages, disputes, notifications, orderItems, orders } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const decisionSchema = z.object({
  status: z.enum(['Under Review', 'Resolved', 'Closed']),
  resolution: z.enum([
    'Buyer refund recommended',
    'Partial refund recommended',
    'Seller upheld',
    'No refund',
  ]).optional(),
  resolutionReason: z.string().trim().max(3000).optional(),
  refundAmountCents: z.number().int().min(0).optional(),
}).superRefine((value, context) => {
  if (value.status === 'Resolved') {
    if (!value.resolution) context.addIssue({ code: 'custom', path: ['resolution'], message: 'Select a resolution.' });
    if (!value.resolutionReason || value.resolutionReason.length < 15) {
      context.addIssue({ code: 'custom', path: ['resolutionReason'], message: 'Explain the decision in at least 15 characters.' });
    }
    if (['Buyer refund recommended', 'Partial refund recommended'].includes(value.resolution ?? '')
      && (!value.refundAmountCents || value.refundAmountCents < 1)) {
      context.addIssue({ code: 'custom', path: ['refundAmountCents'], message: 'Enter the recommended refund amount in cents.' });
    }
  }
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole('admin');
    const { id } = await context.params;
    const input = decisionSchema.parse(await readJson(request));
    const db = getDb();
    const updated = await db.transaction(async (tx) => {
      const [dispute] = await tx.select({ dispute: disputes, order: orders })
        .from(disputes)
        .innerJoin(orders, eq(orders.id, disputes.orderId))
        .where(eq(disputes.id, id))
        .for('update')
        .limit(1);
      if (!dispute) throw new HttpError(404, 'Complaint not found.');
      if (dispute.dispute.status === 'Resolved' || dispute.dispute.status === 'Closed') {
        throw new HttpError(409, 'This complaint already has a final decision.');
      }

      const sellerItems = await tx.select({
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
      }).from(orderItems).where(and(
        eq(orderItems.orderId, dispute.order.id),
        eq(orderItems.id, dispute.dispute.orderItemId),
      ));
      const sellerSubtotalCents = sellerItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
      const refundAmountCents = input.resolution && ['Buyer refund recommended', 'Partial refund recommended'].includes(input.resolution)
        ? input.refundAmountCents ?? 0
        : 0;
      if (refundAmountCents > sellerSubtotalCents) {
        throw new HttpError(400, 'The recommended refund cannot exceed the value of the disputed order item.');
      }
      if (input.resolution === 'Buyer refund recommended' && refundAmountCents !== sellerSubtotalCents) {
        throw new HttpError(400, 'A full refund recommendation must equal the value of the disputed order item.');
      }
      if (input.resolution === 'Partial refund recommended' && refundAmountCents >= sellerSubtotalCents) {
        throw new HttpError(400, 'Use a full refund recommendation for the full value of the disputed order item.');
      }

      await tx.update(disputes).set({
        status: input.status,
        resolution: input.status === 'Resolved' ? input.resolution : null,
        resolutionReason: input.status === 'Resolved' ? input.resolutionReason : null,
        refundAmountCents: input.status === 'Resolved' ? refundAmountCents : null,
        resolvedBy: input.status === 'Resolved' ? admin.id : null,
        resolvedAt: input.status === 'Resolved' ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(disputes.id, id));

      if (input.status === 'Resolved' && input.resolution && input.resolutionReason) {
        await tx.insert(disputeMessages).values({
          disputeId: id,
          senderId: admin.id,
          message: `Administrator decision: ${input.resolution}. ${input.resolutionReason}${refundAmountCents ? ` Recommended amount: ${(refundAmountCents / 100).toFixed(2)} ZAR. This is not a processed payment refund.` : ''}`,
        });
      }
      await tx.insert(notifications).values([
        { userId: dispute.dispute.reporterId, message: `An administrator updated complaint ${dispute.order.displayId} to ${input.status}.` },
        { userId: dispute.dispute.respondentId, message: `An administrator updated complaint ${dispute.order.displayId} to ${input.status}.` },
      ]);
      return { id, status: input.status };
    });
    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
