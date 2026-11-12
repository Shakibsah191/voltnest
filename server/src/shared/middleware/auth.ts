import type { RequestHandler } from 'express';
import '../types/express';
import { AppError } from '../errors/AppError';
import { tokenService } from '../../modules/auth/token.service';
import { UserModel, type UserRole } from '../../modules/users/user.model';
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
 * Logged in with one of these roles. The role is re-read from the database on
 * every request, so promoting, demoting or switching off an account works at
 * once instead of when the 15-minute access token runs out.
 */
export function requireRole(...roles: UserRole[]): RequestHandler[] {
  return [
    requireAuth,
    asyncHandler(async (req, _res, next) => {
      const user = await UserModel.findById(req.user!.id).select('role isActive').lean();
      if (!user || user.isActive === false) throw new AppError(401, 'Please log in again', 'SESSION_ENDED');
      if (!roles.includes(user.role)) throw AppError.forbidden('You don’t have access to this');
      req.user!.role = user.role;
      next();
    }),
  ];
}

/** Employees and the owner: orders, stock, the admin panel. */
export const requireStaff = requireRole('staff', 'admin');
/** Only the owner: prices, products, profit, staff accounts. */
export const requireAdmin = requireRole('admin');
