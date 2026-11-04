import type { RequestHandler } from 'express';

/** Carts, sessions and orders are personal: never let a browser or proxy cache them. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
