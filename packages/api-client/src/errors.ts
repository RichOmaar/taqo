import type { JsonObject } from '@nexa/types';

/**
 * Thrown when the API answers with a non-2xx status.
 *
 * Carries the parsed `ApiError` envelope so callers can branch on `code`
 * instead of matching error message strings.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: JsonObject;

  constructor(status: number, code: string, message: string, details?: JsonObject) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True for 401/403 — the caller should re-authenticate. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
