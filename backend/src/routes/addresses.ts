import { Router, Response, NextFunction } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { addresses } from '../db/schema.js';
import { AuthenticatedRequest, requireRoleMiddleware } from '../middleware/auth.js';

export const addressesRouter = Router();

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

const patchSchema = addressSchema.partial();

// GET /api/addresses
addressesRouter.get('/', requireRoleMiddleware('buyer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUuid) {
      res.json([]);
      return;
    }

    const records = await getDb().select().from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(asc(addresses.createdAt));

    res.json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/addresses
addressesRouter.post('/', requireRoleMiddleware('buyer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const input = addressSchema.parse(req.body);
    const db = getDb();

    if (input.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
    }

    const [address] = await db.insert(addresses).values({ ...input, userId: user.id }).returning();
    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/addresses/:id
addressesRouter.patch('/:id', requireRoleMiddleware('buyer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const input = patchSchema.parse(req.body);
    const db = getDb();

    if (input.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
    }

    const [address] = await db.update(addresses).set(input).where(and(eq(addresses.id, id), eq(addresses.userId, user.id))).returning();
    if (!address) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    res.json(address);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/addresses/:id
addressesRouter.delete('/:id', requireRoleMiddleware('buyer'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const [address] = await getDb().delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id))).returning({ id: addresses.id });
    
    if (!address) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    res.json(address);
  } catch (err) {
    next(err);
  }
});

