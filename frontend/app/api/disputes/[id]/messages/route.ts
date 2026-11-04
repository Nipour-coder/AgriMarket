import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HttpError, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputeMessages, disputes, notifications } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const messageSchema = z.object({
  message: z.string().trim().min(1).max(3000),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id } = await context.params;
    const { message } = messageSchema.parse(await readJson(request));
    const db = getDb();
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    if (!dispute || (dispute.reporterId !== user.id && dispute.respondentId !== user.id)) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
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
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
