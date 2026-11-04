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

  /** Field messages from a VALIDATION_ERROR, keyed like "contact.phone". */
  get fieldErrors(): Record<string, string> {
    if (this.code !== 'VALIDATION_ERROR' || !this.details || typeof this.details !== 'object') return {};
    return this.details as Record<string, string>;
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** false for the auth endpoints themselves: no token, no refresh-and-retry. */
  auth?: boolean;
}

/**
 * The auth feature plugs in here (see features/auth/session.ts), so this file
 * never imports a feature. getToken reads the in-memory access token; refresh
 * asks the server for a new one using the httpOnly cookie.
 */
interface AuthHandlers {
  getToken: () => string | null;
  refresh: () => Promise<string | null>;
}
let authHandlers: AuthHandlers = { getToken: () => null, refresh: async () => null };

export function setAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

async function send(url: URL, method: string, body: unknown, token: string | null, signal?: AbortSignal) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(url, {
      method,
      credentials: 'include', // sends the guest-cart and refresh-token cookies
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Can’t reach the VoltNest server. Check that it is running.');
  }
}

async function toResult<T>(res: Response): Promise<ApiResult<T>> {
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, params, signal, auth = true } = options;

  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const token = auth ? authHandlers.getToken() : null;
  const res = await send(url, method, body, token, signal);

  // Access token expired (they last 15 minutes): refresh once, then retry once.
  if (res.status === 401 && auth) {
    const fresh = await authHandlers.refresh();
    if (fresh) return toResult<T>(await send(url, method, body, fresh, signal));
    // Session is over. A read can still be answered as a guest; a write must not
    // silently switch accounts, so it fails and the page asks the user to log in.
    if (token && method === 'GET') return toResult<T>(await send(url, method, body, null, signal));
  }

  return toResult<T>(res);
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal) =>
    apiRequest<T>(path, { params, signal }),
  post: <T>(path: string, body?: unknown, options?: Pick<RequestOptions, 'auth'>) =>
    apiRequest<T>(path, { method: 'POST', body, ...options }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
