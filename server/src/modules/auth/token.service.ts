import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { authConfig } from '../../config/auth';
import { AppError } from '../../shared/errors/AppError';
import type { AuthUser } from '../../shared/types/express';
import { USER_ROLES, type UserRole } from '../users/user.model';

interface AccessPayload {
  sub: string;
  role: UserRole;
  typ: 'access';
}

interface RefreshPayload {
  sub: string;
  tv: number; // the user's tokenVersion when this token was issued
  typ: 'refresh';
}

const ISSUER = 'voltnest-api';

export const tokenService = {
  /** Short-lived (15 min) token the client sends as "Authorization: Bearer …". Kept in memory only. */
  signAccess(user: { id: string; role: UserRole }): string {
    const payload: AccessPayload = { sub: user.id, role: user.role, typ: 'access' };
    return jwt.sign(payload, authConfig.accessSecret, { expiresIn: authConfig.accessTtl, issuer: ISSUER, algorithm: 'HS256' });
  },

  /** Long-lived (7 day) token, only ever stored in an httpOnly cookie. */
  signRefresh(user: { id: string; tokenVersion: number }): string {
    const payload: RefreshPayload = { sub: user.id, tv: user.tokenVersion, typ: 'refresh' };
    return jwt.sign(payload, authConfig.refreshSecret, {
      expiresIn: Math.floor(authConfig.refreshTtlMs / 1000),
      issuer: ISSUER,
      algorithm: 'HS256',
    });
  },

  verifyAccess(token: string): AuthUser {
    try {
      const p = jwt.verify(token, authConfig.accessSecret, { issuer: ISSUER, algorithms: ['HS256'] }) as Partial<AccessPayload>;
      if (p.typ !== 'access' || typeof p.sub !== 'string' || !USER_ROLES.includes(p.role as UserRole)) throw new Error('bad payload');
      return { id: p.sub, role: p.role as UserRole };
    } catch (err) {
      if (err instanceof TokenExpiredError) throw new AppError(401, 'Your session expired', 'TOKEN_EXPIRED');
      throw new AppError(401, 'Invalid session, please log in again', 'INVALID_TOKEN');
    }
  },

  verifyRefresh(token: string): { userId: string; tokenVersion: number } {
    try {
      const p = jwt.verify(token, authConfig.refreshSecret, { issuer: ISSUER, algorithms: ['HS256'] }) as Partial<RefreshPayload>;
      if (p.typ !== 'refresh' || typeof p.sub !== 'string' || typeof p.tv !== 'number') throw new Error('bad payload');
      return { userId: p.sub, tokenVersion: p.tv };
    } catch {
      throw new AppError(401, 'Please log in again', 'SESSION_ENDED');
    }
  },
};
