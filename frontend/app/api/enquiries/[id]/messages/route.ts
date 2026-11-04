import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { enquiries, enquiryMessages, notifications } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const messageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  quotePrice: z.string().trim().max(120).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id } = await context.params;
    const input = messageSchema.parse(await readJson(request));
    const db = getDb();
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
    if (!enquiry || ![enquiry.buyerId, enquiry.sellerId].includes(user.id)) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
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
    return NextResponse.json({ message: 'Reply sent.' }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
