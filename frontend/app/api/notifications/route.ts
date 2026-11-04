import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { requireUser } from '@backend/auth';
import { getDb } from '@backend/db';
import { notifications } from '@backend/db/schema';
import { apiError } from '@backend/http';

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    const user = await requireUser();
    const records = await getDb().select().from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(100);
    return NextResponse.json(records);
  } catch (error) {
    return apiError(error);
  }
}
