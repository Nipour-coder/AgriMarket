import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpError } from '../middleware/errorHandler.js';

export const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 5;

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

let client: S3Client | undefined;

function getStorage() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new HttpError(503, 'Private evidence storage is not configured.', 'EVIDENCE_STORAGE_NOT_CONFIGURED');
  }
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return { client, bucket };
}

export function isAllowedEvidenceType(contentType: string): boolean {
  return allowedTypes.has(contentType);
}

export function evidenceObjectKey(disputeId: string, evidenceId: string): string {
  return `disputes/${disputeId}/${evidenceId}`;
}

export async function createEvidenceUpload(disputeId: string, evidenceId: string, contentType: string) {
  if (!isAllowedEvidenceType(contentType)) {
    throw new HttpError(400, 'Evidence must be a JPEG, PNG, WebP image or MP4, MOV, WebM video.', 'UNSUPPORTED_EVIDENCE_TYPE');
  }
  const { client: s3, bucket } = getStorage();
  const key = evidenceObjectKey(disputeId, evidenceId);
  const upload = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: key,
    Expires: 300,
    Fields: { 'Content-Type': contentType },
    Conditions: [
      ['content-length-range', 1, MAX_EVIDENCE_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
  });
  return { ...upload, key };
}

export async function verifyEvidenceObject(key: string, contentType: string, expectedSize: number): Promise<number> {
  const { client: s3, bucket } = getStorage();
  try {
    const object = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    if (!object.ContentLength || object.ContentLength < 1 || object.ContentLength > MAX_EVIDENCE_BYTES) {
      throw new HttpError(400, 'The evidence file is empty or exceeds the 25 MB limit.', 'INVALID_EVIDENCE_SIZE');
    }
    if (object.ContentType !== contentType || object.ContentLength !== expectedSize) {
      throw new HttpError(400, 'Uploaded file details do not match the evidence request.', 'EVIDENCE_MISMATCH');
    }
    return object.ContentLength;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error && typeof error === 'object' && '$metadata' in error && error.$metadata && typeof error.$metadata === 'object' && 'httpStatusCode' in error.$metadata && error.$metadata.httpStatusCode === 404) {
      throw new HttpError(400, 'Evidence upload was not found. Please upload the file again.', 'EVIDENCE_NOT_UPLOADED');
    }
    throw error;
  }
}

export async function createEvidenceDownload(key: string): Promise<string> {
  const { client: s3, bucket } = getStorage();
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: 'application/octet-stream',
    ResponseContentDisposition: 'attachment',
    ResponseCacheControl: 'private, no-store',
  }), { expiresIn: 300 });
}

export async function removeEvidenceObject(key: string): Promise<void> {
  const { client: s3, bucket } = getStorage();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function newEvidenceId(): string {
  return randomUUID();
}

