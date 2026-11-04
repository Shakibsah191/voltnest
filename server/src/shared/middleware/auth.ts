import type { RequestHandler } from 'express';
import '../types/express';
import { AppError } from '../errors/AppError';
import { tokenService } from '../../modules/auth/token.service';
import { UserModel } from '../../modules/users/user.model';
import { asyncHandler } from './asyncHandler';

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/**
 * Optional auth: if an access token is sent, it must be valid (expired → 401 so the
 * client refreshes and retries). With no token the request continues as a guest.
 * Used by the cart and checkout, which both work for guests.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) return next();
  try {
    req.user = tokenService.verifyAccess(token);
    next();
  } catch (err) {
    next(err);
  }
};

/** The request must come from a logged-in user. */
export const requireAuth: RequestHandler = (req, res, next) => {
  authenticate(req, res, (err?: unknown) => {
    if (err) return next(err);
    if (!req.user) return next(AppError.unauthorized());
    next();
  });
};

/**
 * Logged in AND an admin. The role is re-read from the database, so removing
 * someone's admin role takes effect at once instead of when their token expires.
 */
export const requireAdmin: RequestHandler[] = [
  requireAuth,
  asyncHandler(async (req, _res, next) => {
    const user = await UserModel.findById(req.user!.id).select('role').lean();
    if (!user || user.role !== 'admin') throw AppError.forbidden('Admins only');
    req.user!.role = 'admin';
    next();
  }),
];
