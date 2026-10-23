import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};
