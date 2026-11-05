import { Router } from 'express';
import { authRouter } from './auth.js';
import { productsRouter } from './products.js';
import { sellersRouter } from './sellers.js';
import { ordersRouter } from './orders.js';
import { disputesRouter } from './disputes.js';
import { adminRouter } from './admin.js';
import { enquiriesRouter } from './enquiries.js';
import { notificationsRouter } from './notifications.js';
import { addressesRouter } from './addresses.js';
import { contactRouter } from './contact.js';
import { uploadRouter } from './upload.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AgriMarket Express Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use(sellersRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/disputes', disputesRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/enquiries', enquiriesRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/contact', contactRouter);
apiRouter.use(uploadRouter);

