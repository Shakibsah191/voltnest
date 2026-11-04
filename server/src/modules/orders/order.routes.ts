import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env, isProd } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { authenticate } from '../../shared/middleware/auth';
import { orderController } from './order.controller';

/** Stops someone flooding the shop with fake COD orders: 15 orders per hour per IP. */
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 15 : 200, // higher locally so testing never gets blocked
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) =>
    next(new AppError(429, 'Too many orders from this connection. Please call us to order.', 'TOO_MANY_REQUESTS')),
});

export const orderRoutes = Router();

orderRoutes.get('/checkout/options', orderController.checkoutOptions);
// guests can order too; a logged-in customer's order is linked to their account
orderRoutes.post('/orders', orderLimiter, authenticate, orderController.create);
