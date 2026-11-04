import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env, isProd } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { requireAuth } from '../../shared/middleware/auth';
import { authController } from './auth.controller';

/** Slows down password guessing: 20 tries per 15 minutes per IP address. */
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 20 : 100, // higher locally so testing never gets blocked
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) =>
    next(new AppError(429, 'Too many attempts. Wait 15 minutes and try again.', 'TOO_MANY_REQUESTS')),
});

export const authRoutes = Router();

authRoutes.post('/auth/register', credentialLimiter, authController.register);
authRoutes.post('/auth/login', credentialLimiter, authController.login);
authRoutes.post('/auth/refresh', authController.refresh);
authRoutes.post('/auth/logout', authController.logout);
authRoutes.get('/auth/me', requireAuth, authController.me);
