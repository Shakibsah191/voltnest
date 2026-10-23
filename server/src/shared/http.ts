import type { Response } from 'express';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Every successful response has the same shape: { success: true, data, meta? } */
export function sendSuccess<T>(res: Response, data: T, meta?: PageMeta, status = 200) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}
