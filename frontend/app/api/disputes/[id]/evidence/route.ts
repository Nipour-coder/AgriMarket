import { count, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HttpError, requireRole } from '@backend/auth';
import { getDb } from '@backend/db';
import { disputeEvidence, disputes } from '@backend/db/schema';
import { apiError, readJson } from '@backend/http';
import { createEvidenceUpload, evidenceObjectKey, isAllowedEvidenceType, MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES, newEvidenceId } from '@backend/storage';

const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_EVIDENCE_BYTES),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('buyer', 'seller');
    const { id } = await context.params;
    const input = uploadSchema.parse(await readJson(request));
    if (!isAllowedEvidenceType(input.contentType)) {
      throw new HttpError(400, 'Evidence must be a JPEG, PNG, WebP image or MP4, MOV, WebM video.');
    }
    const db = getDb();
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    if (!dispute || (dispute.reporterId !== user.id && dispute.respondentId !== user.id)) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }
    if (dispute.status === 'Resolved' || dispute.status === 'Closed') {
      throw new HttpError(409, 'This complaint is closed and cannot accept more evidence.');
    }
    const evidenceId = newEvidenceId();
    const key = evidenceObjectKey(id, evidenceId);
    const reservation = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: disputes.id, status: disputes.status })
        .from(disputes).where(eq(disputes.id, id)).for('update').limit(1);
      if (!current || current.status === 'Resolved' || current.status === 'Closed') {
        throw new HttpError(409, 'This complaint is closed and cannot accept more evidence.');
      }
      const [{ value: existingCount }] = await tx.select({ value: count() })
        .from(disputeEvidence).where(eq(disputeEvidence.disputeId, id));
      if (existingCount >= MAX_EVIDENCE_FILES) {
        throw new HttpError(400, `A complaint can include at most ${MAX_EVIDENCE_FILES} evidence files.`);
      }
      const [created] = await tx.insert(disputeEvidence).values({
        id: evidenceId,
        disputeId: id,
        uploaderId: user.id,
        storageKey: key,
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
      }).returning({ id: disputeEvidence.id });
      return created;
    });
    let upload;
    try {
      upload = await createEvidenceUpload(id, evidenceId, input.contentType);
    } catch (error) {
      await db.delete(disputeEvidence).where(eq(disputeEvidence.id, reservation.id));
      throw error;
    }
    return NextResponse.json({ id: reservation.id, url: upload.url, fields: upload.fields }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
