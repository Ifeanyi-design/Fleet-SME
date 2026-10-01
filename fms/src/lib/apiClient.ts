/**
 * Typed fetch wrapper for the Flask REST API (plan.md §1.4).
 * - Injects the bearer token set by AuthContext.
 * - Normalises every failure into an `ApiError` carrying the HTTP status and a
 *   machine-readable code (e.g. VEHICLE_UNAVAILABLE, INVALID_STATE) so the UI can
 *   branch on it — see the dispatch conflict handling in plan.md §2.5.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'VEHICLE_UNAVAILABLE'
  | 'DRIVER_UNAVAILABLE'
  | 'INVALID_STATE'
  | 'CONFLICT'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/* ── Token holder (set by AuthContext) ───────────────────────────────────── */

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/* ── Core request ────────────────────────────────────────────────────────── */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, query } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server.');
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const shape = (payload ?? {}) as { error?: string; message?: string };
    const code = (shape.error ?? mapStatusToCode(response.status)) as ApiErrorCode;
    throw new ApiError(response.status, code, shape.message ?? shape.error);
  }

  return payload as T;
}

function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'SERVER_ERROR';
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
