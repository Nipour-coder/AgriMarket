import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { addresses } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';

const patchSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  recipientName: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().min(7).max(40).optional(),
  province: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(120).optional(),
  suburb: z.string().trim().max(120).optional(),
  street: z.string().trim().min(3).max(500).optional(),
  postalCode: z.string().trim().max(20).optional(),
  instructions: z.string().trim().max(1000).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer');
    const { id } = await context.params;
    const input = patchSchema.parse(await readJson(request));
    const db = getDb();
    if (input.isDefault) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
    const [address] = await db.update(addresses).set(input).where(and(eq(addresses.id, id), eq(addresses.userId, user.id))).returning();
    if (!address) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    return NextResponse.json(address);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer');
    const { id } = await context.params;
    const [address] = await getDb().delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id))).returning({ id: addresses.id });
    if (!address) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    return NextResponse.json(address);
  } catch (error) {
    return apiError(error);
  }
}
