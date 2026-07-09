import express, { type Express } from 'express';

import { errorHandler, notFoundHandler } from './http/middleware/error-handler';
import { healthRouter } from './http/routes/health';

/** Build and configure the Express application. */
export function createServer(): Express {
  const app = express();

  app.use(express.json());

  app.use('/health', healthRouter);

  // 404 + centralized error handling — must be registered last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
