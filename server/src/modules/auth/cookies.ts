import type { CookieOptions, Response } from 'express';
import { authConfig } from '../../config/auth';

const { cookies } = authConfig;

const base: CookieOptions = {
  httpOnly: true, // JavaScript in the page can never read these
  secure: cookies.secure,
  sameSite: cookies.sameSite,
};

// The refresh cookie is only sent to /api/v1/auth, so normal API calls never carry it.
const refreshCookie: CookieOptions = { ...base, path: '/api/v1/auth' };
const guestCartCookie: CookieOptions = { ...base, path: '/api/v1' };

export const authCookies = {
  setRefresh(res: Response, token: string) {
    res.cookie(cookies.refresh, token, { ...refreshCookie, maxAge: authConfig.refreshTtlMs });
  },
  clearRefresh(res: Response) {
    res.clearCookie(cookies.refresh, refreshCookie);
  },
  setGuestCart(res: Response, guestId: string) {
    res.cookie(cookies.guestCart, guestId, { ...guestCartCookie, maxAge: authConfig.guestCartTtlMs });
  },
  clearGuestCart(res: Response) {
    res.clearCookie(cookies.guestCart, guestCartCookie);
  },
};
