import type { Request, Response } from 'express';
import { authConfig } from '../../config/auth';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { cartService } from '../carts/cart.service';
import { authService, type Session } from './auth.service';
import { authCookies } from './cookies';
import { loginSchema, registerSchema } from './auth.schemas';

const refreshCookieOf = (req: Request): string | undefined => req.cookies?.[authConfig.cookies.refresh];

/** Sets the refresh cookie and returns only what the client may hold in memory. */
function startSession(res: Response, session: Session, status = 200) {
  authCookies.setRefresh(res, session.refreshToken);
  return sendSuccess(res, { user: session.user, accessToken: session.accessToken }, undefined, status);
}

/** A guest who logs in keeps what they put in the cart. */
async function adoptGuestCart(req: Request, res: Response, userId: string) {
  const guestId = cartService.readGuestId(req);
  if (!guestId) return;
  await cartService.mergeGuestIntoUser(guestId, userId);
  authCookies.clearGuestCart(res);
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const session = await authService.register(registerSchema.parse(req.body));
    await adoptGuestCart(req, res, session.user.id);
    startSession(res, session, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const session = await authService.login(loginSchema.parse(req.body));
    await adoptGuestCart(req, res, session.user.id);
    startSession(res, session);
  }),

  refresh: asyncHandler(async (req, res) => {
    try {
      startSession(res, await authService.refresh(refreshCookieOf(req)));
    } catch (err) {
      authCookies.clearRefresh(res); // a dead cookie is useless; remove it
      throw err;
    }
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(refreshCookieOf(req));
    authCookies.clearRefresh(res);
    sendSuccess(res, { loggedOut: true });
  }),

  me: asyncHandler(async (req, res) => {
    sendSuccess(res, { user: await authService.me(req.user!.id) });
  }),
};
