import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wrap async route handlers so any thrown error or rejected promise
 * goes to the central error handler instead of crashing the process.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
