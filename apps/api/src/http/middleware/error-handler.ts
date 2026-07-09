import type { ApiError } from '@nexa/types';
import type { ErrorRequestHandler, RequestHandler } from 'express';

import { HttpError } from '../errors';

/** Terminal middleware for unmatched routes. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiError = { error: { code: 'not_found', message: 'Route not found' } };
  res.status(404).json(body);
};

/** Centralized error handler: maps thrown errors to the ApiError envelope. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ApiError = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.status).json(body);
    return;
  }

  console.error('[nexa-api] unhandled error', err);
  const body: ApiError = {
    error: { code: 'internal_error', message: 'Internal server error' },
  };
  res.status(500).json(body);
};
