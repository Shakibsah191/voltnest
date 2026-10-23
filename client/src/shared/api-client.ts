/**
 * The one place the app talks to the API.
 * In development Vite proxies /api to http://localhost:4000.
 * In production set VITE_API_URL only if you are NOT using the Vercel /api rewrite.
 */
export const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, params, signal } = options;

  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include', // sends the refresh-token cookie (Day 3)
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Can’t reach the VoltNest server. Check that it is running.');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? 'UNKNOWN_ERROR',
      json?.error?.message ?? `Request failed with status ${res.status}`,
      json?.error?.details,
    );
  }

  return { data: json.data as T, meta: json.meta };
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal) =>
    apiRequest<T>(path, { params, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
