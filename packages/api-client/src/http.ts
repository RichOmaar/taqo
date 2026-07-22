import type { ApiError } from '@nexa/types';

import { ApiRequestError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface HttpClientOptions {
  /** API origin, e.g. `http://localhost:4000`. A trailing slash is tolerated. */
  baseUrl: string;
  /** Bearer token for authenticated calls; null when signed out. */
  getToken?: () => string | null;
  /** Injectable for tests and SSR. Defaults to the global `fetch`. */
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  method?: HttpMethod;
  /** Serialized as JSON. Omit for bodyless requests. */
  body?: unknown;
  /** Attach the bearer token when one is available. */
  auth?: boolean;
  signal?: AbortSignal;
}

export interface HttpClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
}

/**
 * Drops trailing slashes so `baseUrl + path` never doubles up.
 *
 * A character walk rather than /\/+$/, which backtracks super-linearly on a
 * long run of slashes.
 */
export function normalizeBaseUrl(url: string): string {
  let end = url.length;
  while (end > 0 && url.charAt(end - 1) === '/') end -= 1;
  return url.slice(0, end);
}

/** Reads the standard `ApiError` envelope, falling back for non-JSON bodies. */
async function toRequestError(response: Response): Promise<ApiRequestError> {
  let code = 'unknown_error';
  let message = `Request failed (${response.status})`;
  let details: ApiError['error']['details'];

  try {
    const payload = (await response.json()) as Partial<ApiError>;
    if (payload.error?.code) {
      code = payload.error.code;
      message = payload.error.message || message;
      details = payload.error.details;
    }
  } catch {
    // Non-JSON error body (proxy timeout, HTML error page) — keep the defaults.
  }

  return new ApiRequestError(response.status, code, message, details);
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch;

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, auth = false, signal } = requestOptions;
    const headers: Record<string, string> = {};

    if (body !== undefined) headers['Content-Type'] = 'application/json';

    if (auth) {
      const token = options.getToken?.() ?? null;
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    if (!response.ok) throw await toRequestError(response);

    // 204 No Content has no body to parse.
    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  }

  return { request };
}
