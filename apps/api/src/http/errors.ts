/** An error carrying an HTTP status and a stable, machine-readable code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: Record<string, unknown>): HttpError =>
  new HttpError(400, 'bad_request', message, details);

export const notFound = (message = 'Resource not found'): HttpError =>
  new HttpError(404, 'not_found', message);
