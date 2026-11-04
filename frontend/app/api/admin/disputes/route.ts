import { desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { NextResponse } from 'next/server';
import { requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputes, orderItems, orders, users } from '@backend/db/schema';
import { apiError } from '@backend/http';

const reporter = alias(users, 'admin_dispute_reporter');
const respondent = alias(users, 'admin_dispute_respondent');

export async function GET(request: Request) {
  try {
    request.headers.get('cookie');
    await requireRole('admin');
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
      .orderBy(desc(disputes.updatedAt))
      .limit(200);
    return NextResponse.json(rows.map(({ dispute, ...rest }) => ({
      ...dispute,
      ...rest,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
    })));
  } catch (error) {
    return apiError(error);
  }
}
