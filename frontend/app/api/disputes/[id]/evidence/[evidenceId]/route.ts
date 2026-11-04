import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { HttpError, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputeEvidence, disputes } from '@backend/db/schema';
import { apiError } from '@backend/http';
import { createEvidenceDownload, verifyEvidenceObject } from '@backend/storage';

export async function POST(_request: Request, context: { params: Promise<{ id: string; evidenceId: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id, evidenceId } = await context.params;
    const db = getDb();
    const [item] = await db.select({ evidence: disputeEvidence, dispute: disputes })
      .from(disputeEvidence)
      .innerJoin(disputes, eq(disputes.id, disputeEvidence.disputeId))
      .where(and(eq(disputeEvidence.id, evidenceId), eq(disputeEvidence.disputeId, id)))
      .limit(1);
    if (!item || item.evidence.uploaderId !== user.id
      || (item.dispute.reporterId !== user.id && item.dispute.respondentId !== user.id)) {
      return NextResponse.json({ error: 'Evidence upload not found.' }, { status: 404 });
    }
    if (item.dispute.status === 'Resolved' || item.dispute.status === 'Closed') {
      return NextResponse.json({ error: 'This complaint is closed and cannot accept evidence.' }, { status: 409 });
    }
    if (item.evidence.uploadedAt) return NextResponse.json({ ok: true });
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string; evidenceId: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller', 'admin');
    const { id, evidenceId } = await context.params;
    const [item] = await getDb().select({ evidence: disputeEvidence, dispute: disputes })
      .from(disputeEvidence)
      .innerJoin(disputes, eq(disputes.id, disputeEvidence.disputeId))
      .where(and(eq(disputeEvidence.id, evidenceId), eq(disputeEvidence.disputeId, id)))
      .limit(1);
    if (!item || !item.evidence.uploadedAt) {
      return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 });
    }
    if (user.role !== 'admin' && item.dispute.reporterId !== user.id && item.dispute.respondentId !== user.id) {
      return NextResponse.json({ error: 'Evidence not found.' }, { status: 404 });
    }
    return NextResponse.redirect(await createEvidenceDownload(item.evidence.storageKey));
  } catch (error) {
    return apiError(error);
  }
}
