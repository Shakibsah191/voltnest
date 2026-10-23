import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { isProd } from '../../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side. Please try again.';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Some fields are invalid';
    details = err.flatten().fieldErrors;
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'INVALID_ID';
    message = `Invalid value for ${err.path}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err?.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    message = `Duplicate value for ${Object.keys(err.keyValue ?? {}).join(', ') || 'a unique field'}`;
  }

  if (status >= 500) console.error('💥', err);

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(!isProd && status >= 500 && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
};
