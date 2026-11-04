import type { UserRole } from '../../modules/users/user.model';

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by the auth middleware when a valid access token is sent. */
      user?: AuthUser;
    }
  }
}

export {};
