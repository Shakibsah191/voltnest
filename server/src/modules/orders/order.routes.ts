import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env, isProd } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { authenticate, requireAuth } from '../../shared/middleware/auth';
import { orderController } from './order.controller';

const limiter = (windowMs: number, prodLimit: number, devLimit: number, message: string) =>
  rateLimit({
    windowMs,
    limit: isProd ? prodLimit : devLimit, // higher locally so testing never gets blocked
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_req, _res, next) => next(new AppError(429, message, 'TOO_MANY_REQUESTS')),
  });

/** Stops someone flooding the shop with fake COD orders: 15 orders per hour per IP. */
const orderLimiter = limiter(60 * 60 * 1000, 15, 200, 'Too many orders from this connection. Please call us to order.');
/** Stops someone guessing phone numbers to read other people's orders. */
const lookupLimiter = limiter(15 * 60 * 1000, 30, 300, 'Too many tries. Wait a few minutes and try again.');

export const orderRoutes = Router();

orderRoutes.get('/checkout/options', orderController.checkoutOptions);
// guests can order too; a logged-in customer's order is linked to their account
orderRoutes.post('/orders', orderLimiter, authenticate, orderController.create);
orderRoutes.get('/orders/mine', requireAuth, orderController.mine);
orderRoutes.get('/orders/:orderNumber', lookupLimiter, authenticate, orderController.getOne);
