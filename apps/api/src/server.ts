import express, { type Express } from 'express';

import { healthRouter } from './http/routes/health';

/** Build and configure the Express application. */
export function createServer(): Express {
  const app = express();

  app.use(express.json());
  app.use('/health', healthRouter);

  return app;
}
