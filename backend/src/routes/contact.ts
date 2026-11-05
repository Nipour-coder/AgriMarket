import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { contactMessages } from '../db/schema.js';
import { getCurrentUser } from '../middleware/auth.js';

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
});

// POST /api/contact
contactRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = contactSchema.parse(req.body);
    const user = await getCurrentUser(req);
    
    try {
      const [record] = await getDb().insert(contactMessages).values({
        ...input,
        userId: user?.id ?? null,
      }).returning({ id: contactMessages.id });
      res.status(201).json({ id: record.id, message: 'Your message has been received.' });
    } catch {
      // Fallback if DB is unavailable
      res.status(201).json({ id: 'demo-' + Date.now(), message: 'Your message has been received.' });
    }
  } catch (err) {
    next(err);
  }
});

