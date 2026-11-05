import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { sellerProfiles } from '../db/schema.js';
import { requireRoleMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

export const uploadRouter = Router();

// Ensure upload folders exist
const uploadsBase = path.resolve(process.cwd(), 'uploads');
const productUploadsDir = path.join(uploadsBase, 'products');
const documentUploadsDir = path.join(uploadsBase, 'documents');

fs.mkdirSync(productUploadsDir, { recursive: true });
fs.mkdirSync(documentUploadsDir, { recursive: true });

// Helper to format byte sizes into readable string (e.g. "1.4 MB")
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Multer storage for product images
const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `product-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});

const productImageUpload = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'Only JPEG, PNG, WebP, GIF, or SVG images are allowed.'));
    }
  },
});

// Multer storage for verification KYC documents
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, documentUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `doc-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'Only PDF, JPEG, PNG, WebP, or DOC/DOCX documents are allowed.'));
    }
  },
});

export interface UploadedVerificationDoc {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
  fileUrl: string;
}

// POST /api/upload/product-image
uploadRouter.post(
  '/upload/product-image',
  requireRoleMiddleware('seller'),
  productImageUpload.single('image'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new HttpError(400, 'No image file was provided.');
      }

      const relativeUrl = `/uploads/products/${req.file.filename}`;
      res.status(201).json({
        success: true,
        url: relativeUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/upload/verification-document
uploadRouter.post(
  '/upload/verification-document',
  requireRoleMiddleware('seller'),
  documentUpload.single('document'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new HttpError(400, 'No document file was provided.');
      }

      const user = req.user!;
      const docType = (req.body.type as string) || 'Supporting Document';
      const docName = (req.body.name as string) || req.file.originalname;
      const relativeUrl = `/uploads/documents/${req.file.filename}`;

      const newDoc: UploadedVerificationDoc = {
        id: randomUUID(),
        name: docName,
        type: docType,
        fileName: req.file.originalname,
        fileSize: formatBytes(req.file.size),
        uploadedAt: new Date().toISOString(),
        verified: false,
        fileUrl: relativeUrl,
      };

      const db = getDb();
      const [currentProfile] = await db.select().from(sellerProfiles)
        .where(eq(sellerProfiles.userId, user.id)).limit(1);

      if (!currentProfile) {
        throw new HttpError(404, 'Seller profile was not found.');
      }

      const currentChecklist = (currentProfile.documentChecklist as any) || {};
      const existingDocs: UploadedVerificationDoc[] = Array.isArray(currentChecklist.documents)
        ? currentChecklist.documents
        : [];

      // Append new document
      const updatedDocs = [...existingDocs, newDoc];

      // Update flags
      const updatedChecklist = {
        ...currentChecklist,
        documents: updatedDocs,
        identityFront: currentChecklist.identityFront || docType === 'Representative ID',
        proofOfAddress: currentChecklist.proofOfAddress || docType === 'Proof of Farm Address',
        supportingDocuments: currentChecklist.supportingDocuments || docType === 'CIPC Registration' || docType === 'SARS Tax Compliance' || docType === 'GAP / GlobalG.A.P Audit',
      };

      await db.update(sellerProfiles).set({
        documentChecklist: updatedChecklist,
        verificationStatus: currentProfile.verificationStatus === 'Rejected' ? 'Under Review' : currentProfile.verificationStatus,
        updatedAt: new Date(),
      }).where(eq(sellerProfiles.userId, user.id));

      res.status(201).json({
        success: true,
        document: newDoc,
        documents: updatedDocs,
        message: 'Document uploaded successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/seller/verification/documents
uploadRouter.get(
  '/seller/verification/documents',
  requireRoleMiddleware('seller'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const db = getDb();
      const [profile] = await db.select().from(sellerProfiles)
        .where(eq(sellerProfiles.userId, user.id)).limit(1);

      if (!profile) {
        res.status(404).json({ error: 'Seller profile was not found.' });
        return;
      }

      const checklist = (profile.documentChecklist as any) || {};
      const docs: UploadedVerificationDoc[] = Array.isArray(checklist.documents)
        ? checklist.documents
        : [];

      res.json(docs);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/seller/verification/documents/:documentId
uploadRouter.delete(
  '/seller/verification/documents/:documentId',
  requireRoleMiddleware('seller'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { documentId } = req.params;
      const db = getDb();
      const [profile] = await db.select().from(sellerProfiles)
        .where(eq(sellerProfiles.userId, user.id)).limit(1);

      if (!profile) {
        res.status(404).json({ error: 'Seller profile was not found.' });
        return;
      }

      const checklist = (profile.documentChecklist as any) || {};
      const docs: UploadedVerificationDoc[] = Array.isArray(checklist.documents)
        ? checklist.documents
        : [];

      const targetDoc = docs.find((d) => d.id === documentId);
      if (!targetDoc) {
        res.status(404).json({ error: 'Document not found.' });
        return;
      }

      // Filter out document
      const filteredDocs = docs.filter((d) => d.id !== documentId);

      // Attempt to clean up file from disk
      if (targetDoc.fileUrl && targetDoc.fileUrl.startsWith('/uploads/documents/')) {
        const filePath = path.join(documentUploadsDir, path.basename(targetDoc.fileUrl));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.warn('Could not remove file from disk:', e);
        }
      }

      await db.update(sellerProfiles).set({
        documentChecklist: {
          ...checklist,
          documents: filteredDocs,
        },
        updatedAt: new Date(),
      }).where(eq(sellerProfiles.userId, user.id));

      res.json({
        success: true,
        documents: filteredDocs,
        message: 'Document removed successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

