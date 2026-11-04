import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { addresses } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const addressSchema = z.object({
  label: z.string().trim().min(1).max(80).default('Main address'),
  recipientName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(40),
  province: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(120),
  suburb: z.string().trim().max(120).default(''),
  street: z.string().trim().min(3).max(500),
  postalCode: z.string().trim().max(20).default(''),
  instructions: z.string().trim().max(1000).default(''),
  isDefault: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireRole('buyer');
    const records = await getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(asc(addresses.createdAt));
    return NextResponse.json(records);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('buyer');
    const input = addressSchema.parse(await readJson(request));
    const db = getDb();
    if (input.isDefault) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
    const [address] = await db.insert(addresses).values({ ...input, userId: user.id }).returning();
    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
