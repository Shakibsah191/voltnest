import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { authCookies } from '../auth/cookies';
import { cartService, type CartOwner } from './cart.service';
import { addItemSchema, importSchema, setQuantitySchema, skuParamSchema } from './cart.schemas';

/** Logged-in user → their cart; otherwise the guest cart from the cookie (if any). */
export function cartOwnerOf(req: Request): CartOwner | null {
  if (req.user) return { userId: req.user.id };
  const guestId = cartService.readGuestId(req);
  return guestId ? { guestId } : null;
}

/** Same, but gives a new guest a cart id cookie on their first add. */
function ensureOwner(req: Request, res: Response): CartOwner {
  const owner = cartOwnerOf(req);
  if (owner) return owner;
  const guestId = randomUUID();
  authCookies.setGuestCart(res, guestId);
  return { guestId };
}

export const cartController = {
  get: asyncHandler(async (req, res) => {
    sendSuccess(res, await cartService.view(cartOwnerOf(req)));
  }),

  addItem: asyncHandler(async (req, res) => {
    const { sku, quantity } = addItemSchema.parse(req.body);
    sendSuccess(res, await cartService.addItem(ensureOwner(req, res), sku, quantity));
  }),

  setQuantity: asyncHandler(async (req, res) => {
    const { sku } = skuParamSchema.parse(req.params);
    const { quantity } = setQuantitySchema.parse(req.body);
    const owner = cartOwnerOf(req);
    sendSuccess(res, owner ? await cartService.setQuantity(owner, sku, quantity) : await cartService.view(null));
  }),

  removeItem: asyncHandler(async (req, res) => {
    const { sku } = skuParamSchema.parse(req.params);
    const owner = cartOwnerOf(req);
    sendSuccess(res, owner ? await cartService.removeItem(owner, sku) : await cartService.view(null));
  }),

  clear: asyncHandler(async (req, res) => {
    const owner = cartOwnerOf(req);
    sendSuccess(res, owner ? await cartService.clear(owner) : await cartService.view(null));
  }),

  import: asyncHandler(async (req, res) => {
    const { items } = importSchema.parse(req.body);
    sendSuccess(res, await cartService.importItems(ensureOwner(req, res), items));
  }),
};
