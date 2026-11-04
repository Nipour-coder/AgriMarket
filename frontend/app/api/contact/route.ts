import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@backend/auth';
import { getDb } from '@backend/db';
import { contactMessages } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  try {
    const input = contactSchema.parse(await readJson(request));
    const user = await getCurrentUser();
    const [record] = await getDb().insert(contactMessages).values({
      ...input,
      userId: user?.id ?? null,
    }).returning({ id: contactMessages.id });
    return NextResponse.json({ id: record.id, message: 'Your message has been received.' }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
