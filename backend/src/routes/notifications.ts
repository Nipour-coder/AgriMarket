import { Router, Response, NextFunction } from 'express';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { AuthenticatedRequest, requireUser } from '../middleware/auth.js';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await requireUser(req);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUuid) {
      res.json([]);
      return;
    }

    const records = await getDb().select().from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    res.json(records);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications (mark read)
notificationsRouter.patch('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await requireUser(req);
    await getDb().update(notifications).set({ readAt: new Date() })
      .where(eq(notifications.userId, user.id));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
